'use client';

import React, { useEffect, useRef, useState } from 'react';
import { scoreTranscript } from '../../../lib/voiceLab/score';
import type { ModelTranscriptionResult } from '../../../server/voiceLabTranscribe';
import '../../../styles/tokens.css';
import styles from './voiceLab.module.css';

export const MAX_CLIP_DURATION_SEC = 60;

export function selectSupportedAudioMime(): string {
  if (
    typeof MediaRecorder === 'undefined' ||
    typeof MediaRecorder.isTypeSupported !== 'function'
  ) {
    return 'audio/webm;codecs=opus';
  }
  if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
    return 'audio/webm;codecs=opus';
  }
  if (MediaRecorder.isTypeSupported('audio/mp4')) {
    return 'audio/mp4';
  }
  if (MediaRecorder.isTypeSupported('audio/webm')) {
    return 'audio/webm';
  }
  return '';
}

export interface VoiceClipItem {
  id: string;
  blob: Blob;
  audioUrl: string;
  mimeType: string;
  durationSec: number;
  meantToSay: string;
  actuallySaid: string;
  transcribing: boolean;
  error: string | null;
  results: ModelTranscriptionResult[];
}

export interface VoiceLabClientProps {
  configuredModels: string[];
}

export default function VoiceLabClient({
  configuredModels
}: VoiceLabClientProps) {
  const [clips, setClips] = useState<VoiceClipItem[]>([]);
  const [recording, setRecording] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [recorderError, setRecorderError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  async function startRecording() {
    setRecorderError(null);
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function'
    ) {
      setRecorderError('MediaRecorder / getUserMedia is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const preferredMime = selectSupportedAudioMime();
      const recorder = preferredMime
        ? new MediaRecorder(stream, { mimeType: preferredMime })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      startTimeRef.current = Date.now();
      setElapsedSec(0);

      recorder.ondataavailable = (ev: BlobEvent) => {
        if (ev.data && ev.data.size > 0) {
          chunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        const finalDuration = Math.min(
          MAX_CLIP_DURATION_SEC,
          Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
        );
        const resolvedMime =
          recorder.mimeType || preferredMime || 'audio/webm;codecs=opus';
        const blob = new Blob(chunksRef.current, { type: resolvedMime });
        const audioUrl = URL.createObjectURL(blob);

        setClips((prev) => [
          ...prev,
          {
            id: `clip-${Date.now()}-${prev.length + 1}`,
            blob,
            audioUrl,
            mimeType: resolvedMime,
            durationSec: finalDuration,
            meantToSay: '',
            actuallySaid: '',
            transcribing: false,
            error: null,
            results: []
          }
        ]);

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        setRecording(false);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);

      timerRef.current = setInterval(() => {
        const secs = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (secs >= MAX_CLIP_DURATION_SEC) {
          setElapsedSec(MAX_CLIP_DURATION_SEC);
          if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state === 'recording'
          ) {
            mediaRecorderRef.current.stop();
          }
        } else {
          setElapsedSec(secs);
        }
      }, 250);
    } catch (err) {
      setRecorderError(
        err instanceof Error ? err.message : 'Could not access microphone.'
      );
    }
  }

  function stopRecording() {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      mediaRecorderRef.current.stop();
    }
  }

  function updateClipField(
    id: string,
    field: 'meantToSay' | 'actuallySaid',
    value: string
  ) {
    setClips((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  }

  async function transcribeClip(id: string) {
    const clip = clips.find((c) => c.id === id);
    if (!clip) return;

    setClips((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, transcribing: true, error: null } : c
      )
    );

    try {
      const formData = new FormData();
      formData.append('audio', clip.blob, `${clip.id}.audio`);
      formData.append('mimeType', clip.mimeType);

      const response = await fetch('/api/lab/transcribe', {
        method: 'POST',
        body: formData
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.error || `HTTP ${response.status}`);
      }

      setClips((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                transcribing: false,
                results: Array.isArray(body) ? body : []
              }
            : c
        )
      );
    } catch (err) {
      setClips((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                transcribing: false,
                error:
                  err instanceof Error ? err.message : 'Transcription failed'
              }
            : c
        )
      );
    }
  }

  function exportJson() {
    const payload = {
      exportedAt: new Date().toISOString(),
      configuredModels,
      clips: clips.map((clip) => ({
        id: clip.id,
        durationSec: clip.durationSec,
        mimeType: clip.mimeType,
        meantToSay: clip.meantToSay,
        actuallySaid: clip.actuallySaid,
        results: clip.results.map((r) => {
          const score = scoreTranscript(
            clip.meantToSay,
            clip.actuallySaid,
            r.transcript
          );
          return {
            model: r.model,
            transcript: r.transcript,
            wer: score.wer,
            werPercent: score.werPercent,
            errorPreservationRate: score.errorPreservationRate,
            latencyMs: r.latencyMs,
            ...(typeof r.inputTokens === 'number'
              ? { inputTokens: r.inputTokens }
              : {}),
            ...(typeof r.outputTokens === 'number'
              ? { outputTokens: r.outputTokens }
              : {})
          };
        })
      }))
    };

    const jsonBlob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(jsonBlob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `voice-lab-results-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.titleGroup}>
            <span className="t-eyebrow">NorskLive Developer Tool</span>
            <h1 className="t-title">Voice Lab — Norwegian Verbatim STT</h1>
            <p className={styles.subtitle}>
              Models ({configuredModels.length}):{' '}
              {configuredModels.length > 0
                ? configuredModels.join(', ')
                : 'None configured in VOICE_LAB_MODELS'}
            </p>
          </div>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={exportJson}
            disabled={clips.length === 0}
          >
            Export JSON
          </button>
        </header>

        <section className={styles.recorderBar} aria-label="Audio Recorder">
          <div className={styles.recorderControls}>
            {!recording ? (
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={startRecording}
              >
                Record Clip
              </button>
            ) : (
              <button
                type="button"
                className={styles.stopBtn}
                onClick={stopRecording}
              >
                Stop Recording
              </button>
            )}
            <span className={styles.timerBadge} aria-live="polite">
              {elapsedSec}s / {MAX_CLIP_DURATION_SEC}s
            </span>
          </div>
        </section>

        {recorderError && (
          <div role="alert" className={styles.errorBanner}>
            {recorderError}
          </div>
        )}

        <div className={styles.clipList}>
          {clips.map((clip, idx) => (
            <article key={clip.id} className={styles.clipCard}>
              <div className={styles.clipHeader}>
                <div className={styles.audioMeta}>
                  <strong>Clip #{idx + 1}</strong>
                  <span className="t-caption">
                    {clip.durationSec}s · {clip.mimeType}
                  </span>
                  <audio controls src={clip.audioUrl} preload="metadata" />
                </div>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={() => transcribeClip(clip.id)}
                  disabled={clip.transcribing}
                >
                  {clip.transcribing ? 'Transcribing…' : 'Compare Models'}
                </button>
              </div>

              <div className={styles.fieldsGrid}>
                <div className={styles.fieldGroup}>
                  <label
                    htmlFor={`meant-${clip.id}`}
                    className={styles.label}
                  >
                    What I meant to say
                  </label>
                  <textarea
                    id={`meant-${clip.id}`}
                    className={styles.textarea}
                    placeholder="I dag jobber jeg hjemmefra."
                    value={clip.meantToSay}
                    onChange={(e) =>
                      updateClipField(clip.id, 'meantToSay', e.target.value)
                    }
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label
                    htmlFor={`actual-${clip.id}`}
                    className={styles.label}
                  >
                    What I actually said
                  </label>
                  <textarea
                    id={`actual-${clip.id}`}
                    className={styles.textarea}
                    placeholder="I dag jeg jobber hjemmefra."
                    value={clip.actuallySaid}
                    onChange={(e) =>
                      updateClipField(clip.id, 'actuallySaid', e.target.value)
                    }
                  />
                </div>
              </div>

              {clip.error && (
                <div role="alert" className={styles.errorBanner}>
                  {clip.error}
                </div>
              )}

              {clip.results.length > 0 && (
                <div className={styles.tableWrapper}>
                  <table className={styles.resultsTable}>
                    <thead>
                      <tr>
                        <th>Model</th>
                        <th>Transcript</th>
                        <th>WER</th>
                        <th>Error-preservation %</th>
                        <th>Latency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clip.results.map((row) => {
                        const score = scoreTranscript(
                          clip.meantToSay,
                          clip.actuallySaid,
                          row.transcript
                        );
                        return (
                          <tr key={row.model}>
                            <td className={styles.monoCell}>{row.model}</td>
                            <td>{row.transcript}</td>
                            <td className={styles.monoCell}>
                              {score.wer} ({score.werPercent}%)
                            </td>
                            <td className={styles.monoCell}>
                              {score.errorPreservationRate}%
                            </td>
                            <td className={styles.monoCell}>
                              {row.latencyMs} ms
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
