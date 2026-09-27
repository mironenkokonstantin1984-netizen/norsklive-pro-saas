# Voice Lab — Local Norwegian Speech Model Evaluation (`VOICE_LAB_ENABLED`)

Voice Lab is a **local-only developer tool** for comparing Google Gemini audio models on non-native Norwegian Bokmål speech before building production server-side speech (M2).

Unlike standard dictation models that silently "correct" learner grammar (such as V2 word-order mistakes), NorskLive Pro requires a speech-to-text model that **preserves the learner's spoken errors verbatim** so the coach can diagnose and explain them.

---

## 1. How to Enable Locally

Voice Lab is disabled by default (`404` on `/lab/voice` and `/api/lab/transcribe`). Never enable it on Vercel.

1. Add the following variables to your local `.env.local` file:
   ```dotenv
   # "true" only on a developer machine. Never on Vercel.
   VOICE_LAB_ENABLED=true

   # Comma-separated Gemini model IDs to compare (from Google AI Studio docs)
   VOICE_LAB_MODELS=gemini-2.5-flash,gemini-2.5-pro

   # Existing server-side Google Gemini API key
   GEMINI_API_KEY=your_ai_studio_api_key_here
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000/lab/voice](http://localhost:3000/lab/voice) in Chrome, Firefox, or Safari.
   - The recorder uses `navigator.mediaDevices.getUserMedia` + `MediaRecorder` (`audio/webm;codecs=opus` on Chrome/Firefox, automatic fallback to `audio/mp4` on Safari).
   - It does **not** use the browser Web Speech API.
   - Each clip is capped at **60 seconds** and **10 MB**.

---

## 2. How to Record the Test Set (20–30 Phrases × 3 Ways)

To benchmark error preservation and Word Error Rate (WER) across models, record **20–30 Norwegian Bokmål phrases** drawn from typical Norskprøve Muntlig A2/B1 topics (work, remote work, family, welfare, daily life).

Record each phrase **three ways** as separate clips:

1. **Correct Bokmål** (baseline WER check)
   - *What I meant to say*: `I dag jobber jeg hjemmefra fordi jeg har mange møter.`
   - *What I actually said*: `I dag jobber jeg hjemmefra fordi jeg har mange møter.`
2. **Deliberate typical learner mistakes** (e.g., V2 word-order inversion error, wrong preposition, or hesitation `eh`)
   - *What I meant to say*: `I dag jobber jeg hjemmefra fordi jeg har mange møter.`
   - *What I actually said*: `I dag jeg jobber hjemmefra fordi eh jeg har mange møte.`
3. **Natural non-native accent / spontaneous delivery**
   - Speak naturally at exam pace and fill in both *What I meant to say* and *What I actually said* after listening back via the clip's `<audio>` player.

For each clip, click **Compare Models** to send the audio to `/api/lab/transcribe`. The table updates immediately with:
- **Transcript** (verbatim output from each model)
- **WER** (word error rate against *What I actually said*)
- **Error-preservation %** (percentage of spoken learner errors where `actuallySaid !== meantToSay` that the model kept as spoken instead of auto-correcting)
- **Latency** (round-trip time in milliseconds)

---

## 3. How to Export Results and Paste into a PR Comment

1. Once all clips in your test set have been transcribed and scored, click **Export JSON** in the top-right corner of `/lab/voice`.
2. Your browser will download `voice-lab-results-<timestamp>.json`.
   - This file contains only metadata, reference texts (`meantToSay`, `actuallySaid`), transcripts, WER, error-preservation %, token counts, and latency — **never raw audio or API keys**.
3. Open the downloaded `.json` file, copy its contents, and paste them into a collapsible block in a GitHub PR/issue comment:
   ````markdown
   <details>
   <summary>Voice Lab Benchmark Results (JSON)</summary>

   ```json
   {
     "exportedAt": "...",
     "configuredModels": ["gemini-2.5-flash", "gemini-2.5-pro"],
     "clips": [ ... ]
   }
   ```
   </details>
   ````
