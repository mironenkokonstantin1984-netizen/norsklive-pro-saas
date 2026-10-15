'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { speakNorwegian } from '../../../lib/speech';
import type { TtsVoiceInfo } from '../../../server/tts/types';
import styles from './voiceLab.module.css';

export interface TestSentence {
  id: string;
  category: string;
  label: string;
  text: string;
}

export const TEST_SENTENCES: TestSentence[] = [
  {
    id: 'greeting',
    category: 'Приветствие',
    label: '1. Приветствие',
    text: 'Hei! Velkommen til muntlig prøve. Hyggelig å møte deg.'
  },
  {
    id: 'numbers_prices',
    category: 'Числа и цены',
    label: '2. Числа и цены',
    text: 'En kopp kaffe koster førtifem kroner, og lunsjen koster hundreogti kroner.'
  },
  {
    id: 'dates_times',
    category: 'Даты и время',
    label: '3. Даты и время',
    text: 'Prøven starter klokken kvart over ni mandag den syttende mai.'
  },
  {
    id: 'address',
    category: 'Адрес',
    label: '4. Адрес',
    text: 'Jeg bor i Storgata 42 B, leilighet 301 i Oslo.'
  },
  {
    id: 'question_intonation',
    category: 'Интонация вопроса',
    label: '5. Вопрос с интонацией',
    text: 'Har du bodd lenge i Norge, eller kom du hit nylig?'
  },
  {
    id: 'list',
    category: 'Перечисление',
    label: '6. Перечисление',
    text: 'Til frokost spiser jeg ofte brød med ost, et eple og drikker te.'
  },
  {
    id: 'long_sentence',
    category: 'Длинное предложение',
    label: '7. Длинное (~30 слов)',
    text: 'Selv om det var meldt dårlig vær med mye regn og kraftig vind, bestemte vi oss likevel for å gå en lang tur i fjellet sammen med hele familien på søndag.'
  },
  {
    id: 'scandi_vowels',
    category: 'Буквы ø, å, æ',
    label: '8. Гласные ø, å, æ',
    text: 'Læreren spør om vi så den blå bussen kjøre forbi den grønne parken i går kveld.'
  },
  {
    id: 'polite_prompt',
    category: 'Вежливый вопрос',
    label: '9. Вопрос экзаменатора',
    text: 'Kan du være så snill og fortelle litt mer om hva du liker å gjøre på fritiden?'
  },
  {
    id: 'clarification',
    category: 'Переспрос',
    label: '10. «Kan du gjenta?»',
    text: 'Unnskyld, kan du gjenta spørsmålet en gang til? Jeg hørte ikke helt.'
  },
  {
    id: 'number_1234',
    category: 'Число 1 234',
    label: '11. Число 1 234',
    text: 'Billetten koster 1 234 kroner per person tur-retur.'
  },
  {
    id: 'phone_number',
    category: 'Номер телефона',
    label: '12. Номер телефона',
    text: 'Mitt telefonnummer er 98 76 54 32, du kan ringe meg når som helst.'
  }
];

export interface GeneratedClip {
  id: string;
  provider: string;
  voice: string;
  sentenceId: string;
  text: string;
  latencyMs: number;
  charCount: number;
  audioUrl?: string;
  isOutOfEu: boolean;
  timestamp: number;
}

export interface TtsRating {
  clipId: string;
  provider: string;
  voice: string;
  sentenceId: string;
  naturalness: number;
  clarity: number;
  latencyMs: number;
  charCount: number;
  note: string;
  updatedAt: number;
}

export const TTS_RATINGS_STORAGE_KEY = 'norsklive_tts_ratings';

export function loadTtsRatings(): Record<string, TtsRating> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(TTS_RATINGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveTtsRatings(ratings: Record<string, TtsRating>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TTS_RATINGS_STORAGE_KEY, JSON.stringify(ratings));
  } catch {
    // localStorage full or disabled
  }
}

export function exportRatingsToCsv(ratings: Record<string, TtsRating>): string {
  const headers = ['provider', 'voice', 'sentence_id', 'naturalness', 'clarity', 'latency_ms', 'chars', 'note'];
  const rows = Object.values(ratings).map((r) => {
    const escapeCsv = (val: string | number) => {
      const s = String(val ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };
    return [
      escapeCsv(r.provider),
      escapeCsv(r.voice),
      escapeCsv(r.sentenceId),
      escapeCsv(r.naturalness),
      escapeCsv(r.clarity),
      escapeCsv(r.latencyMs),
      escapeCsv(r.charCount),
      escapeCsv(r.note)
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export interface TtsLabTabProps {
  ttsVoices: TtsVoiceInfo[];
}

export default function TtsLabTab({ ttsVoices }: TtsLabTabProps) {
  const [selectedSentenceId, setSelectedSentenceId] = useState<string>('greeting');
  const [text, setText] = useState<string>(TEST_SENTENCES[0].text);
  const [selectedVoiceKey, setSelectedVoiceKey] = useState<string>('browser:speechSynthesis');
  const [rate, setRate] = useState<number>(1.0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [clips, setClips] = useState<GeneratedClip[]>([]);
  const [ratings, setRatings] = useState<Record<string, TtsRating>>({});
  const [calcChars, setCalcChars] = useState<number>(1500);

  // Load ratings from localStorage
  useEffect(() => {
    setRatings(loadTtsRatings());
  }, []);

  // Update text when clicking on a test sentence
  function handleSelectSentence(item: TestSentence) {
    setSelectedSentenceId(item.id);
    setText(item.text);
  }

  // Provider candidate options including browser baseline
  const voiceOptions = useMemo(() => {
    const opts: Array<{
      key: string;
      provider: string;
      voice: string;
      label: string;
      isConfigured: boolean;
      isOutOfEu: boolean;
    }> = [
      {
        key: 'browser:speechSynthesis',
        provider: 'browser',
        voice: 'speechSynthesis (nb-NO)',
        label: 'Браузер: Web Speech API (эталон для сравнения)',
        isConfigured: true,
        isOutOfEu: false
      }
    ];

    for (const v of ttsVoices) {
      const provLabel =
        v.provider === 'google'
          ? 'Google Cloud TTS'
          : v.provider === 'azure'
            ? 'Azure AI Speech'
            : 'ElevenLabs';
      const isUnverified =
        v.provider === 'elevenlabs' ||
        v.voice.includes('Chirp3');
      const unverifiedTag = isUnverified ? ' (не проверено)' : '';
      opts.push({
        key: `${v.provider}:${v.voice}`,
        provider: v.provider,
        voice: v.voice,
        label: `${provLabel}: ${v.voice}${unverifiedTag}${v.isOutOfEu ? ' (вне ЕС)' : ''}${!v.isConfigured ? ' [ключ не задан]' : ''}`,
        isConfigured: v.isConfigured,
        isOutOfEu: v.isOutOfEu
      });
    }

    return opts;
  }, [ttsVoices]);

  // Selected option details
  const selectedOption = useMemo(() => {
    return voiceOptions.find((o) => o.key === selectedVoiceKey) || voiceOptions[0];
  }, [voiceOptions, selectedVoiceKey]);

  // Check if any neural provider is configured
  const hasConfiguredNeural = useMemo(() => {
    return ttsVoices.some((v) => v.isConfigured);
  }, [ttsVoices]);

  // Synthesize and play
  async function handleSynthesizeAndPlay() {
    if (!text.trim()) return;
    setError(null);
    setIsGenerating(true);

    const clipId = `clip-${Date.now()}`;
    const startTime = Date.now();

    if (selectedOption.provider === 'browser') {
      try {
        let latencyRecorded = false;
        let latencyMs = 0;

        await speakNorwegian(text, {
          rate,
          onStart: () => {
            if (!latencyRecorded) {
              latencyMs = Date.now() - startTime;
              latencyRecorded = true;
            }
          }
        });

        if (!latencyRecorded) {
          latencyMs = Date.now() - startTime;
        }

        const newClip: GeneratedClip = {
          id: clipId,
          provider: 'browser',
          voice: selectedOption.voice,
          sentenceId: selectedSentenceId,
          text,
          latencyMs,
          charCount: text.length,
          isOutOfEu: false,
          timestamp: Date.now()
        };

        setClips((prev) => [newClip, ...prev]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка воспроизведения браузерного голоса');
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    // Neural provider synthesis via POST /api/lab/tts
    try {
      const response = await fetch('/api/lab/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedOption.provider,
          voice: selectedOption.voice,
          text,
          rate
        })
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson?.error || `Ошибка сервера (${response.status})`);
      }

      const latencyMs = Number(response.headers.get('x-tts-latency-ms')) || Date.now() - startTime;
      const charCount = Number(response.headers.get('x-tts-chars')) || text.length;
      const isOutOfEu = response.headers.get('x-tts-out-of-eu') === 'true';

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const newClip: GeneratedClip = {
        id: clipId,
        provider: selectedOption.provider,
        voice: selectedOption.voice,
        sentenceId: selectedSentenceId,
        text,
        latencyMs,
        charCount,
        audioUrl,
        isOutOfEu,
        timestamp: Date.now()
      };

      setClips((prev) => [newClip, ...prev]);

      // Auto-play the clip if Audio constructor is available
      if (typeof Audio !== 'undefined') {
        try {
          const audio = new Audio(audioUrl);
          void audio.play().catch(() => {
            // Autoplay may be blocked by browser policy until interaction
          });
        } catch {
          // Audio playback error guard
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка синтеза речи');
    } finally {
      setIsGenerating(false);
    }
  }

  // Update a rating field
  function handleRateClip(
    clip: GeneratedClip,
    field: 'naturalness' | 'clarity',
    value: number
  ) {
    const existing = ratings[clip.id] || {
      clipId: clip.id,
      provider: clip.provider,
      voice: clip.voice,
      sentenceId: clip.sentenceId,
      naturalness: 0,
      clarity: 0,
      latencyMs: clip.latencyMs,
      charCount: clip.charCount,
      note: '',
      updatedAt: Date.now()
    };

    const updated: TtsRating = {
      ...existing,
      [field]: value,
      updatedAt: Date.now()
    };

    const newMap = { ...ratings, [clip.id]: updated };
    setRatings(newMap);
    saveTtsRatings(newMap);
  }

  function handleUpdateNote(clip: GeneratedClip, note: string) {
    const existing = ratings[clip.id] || {
      clipId: clip.id,
      provider: clip.provider,
      voice: clip.voice,
      sentenceId: clip.sentenceId,
      naturalness: 0,
      clarity: 0,
      latencyMs: clip.latencyMs,
      charCount: clip.charCount,
      note: '',
      updatedAt: Date.now()
    };

    const updated: TtsRating = {
      ...existing,
      note,
      updatedAt: Date.now()
    };

    const newMap = { ...ratings, [clip.id]: updated };
    setRatings(newMap);
    saveTtsRatings(newMap);
  }

  // Download ratings as CSV
  function handleDownloadCsv() {
    const csvContent = exportRatingsToCsv(ratings);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `norsklive-tts-ratings-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Grouped stats by provider/voice
  const voiceStats = useMemo(() => {
    const map = new Map<
      string,
      { count: number; natSum: number; clarSum: number; latSum: number }
    >();

    for (const r of Object.values(ratings)) {
      const key = `${r.provider} · ${r.voice}`;
      const entry = map.get(key) || { count: 0, natSum: 0, clarSum: 0, latSum: 0 };
      entry.count += 1;
      entry.natSum += r.naturalness || 0;
      entry.clarSum += r.clarity || 0;
      entry.latSum += r.latencyMs || 0;
      map.set(key, entry);
    }

    return Array.from(map.entries()).map(([key, data]) => ({
      key,
      count: data.count,
      avgNat: data.count > 0 ? (data.natSum / data.count).toFixed(1) : '-',
      avgClar: data.count > 0 ? (data.clarSum / data.count).toFixed(1) : '-',
      avgLat: data.count > 0 ? Math.round(data.latSum / data.count) : 0
    }));
  }, [ratings]);

  // Provider pricing comparison definitions
  const pricingData = [
    {
      provider: 'Браузер (Web Speech API) — эталон',
      region: 'Локально на устройстве',
      pricePerMillionUsd: 0.0,
      checkedDate: 'Бесплатно (эталон $0)',
      sourceUrl: 'https://developer.mozilla.org/docs/Web/API/Web_Speech_API'
    },
    {
      provider: 'Google Cloud TTS (Chirp 3 HD)',
      region: 'EU (eu-texttospeech.googleapis.com)',
      pricePerMillionUsd: 30.0,
      checkedDate: 'Октябрь 2026 (проверено по cloud.google.com/text-to-speech/pricing)',
      sourceUrl: 'https://cloud.google.com/text-to-speech/pricing'
    },
    {
      provider: 'Google Cloud TTS (Neural2)',
      region: 'EU (eu-texttospeech.googleapis.com)',
      pricePerMillionUsd: 16.0,
      checkedDate: 'Октябрь 2026 (проверено по cloud.google.com/text-to-speech/pricing)',
      sourceUrl: 'https://cloud.google.com/text-to-speech/pricing'
    },
    {
      provider: 'Azure AI Speech (Neural)',
      region: 'Norway East (norwayeast)',
      pricePerMillionUsd: 16.0,
      checkedDate: 'Октябрь 2026 (не проверено: страница требует JS, $16/M ориентировочно)',
      sourceUrl: 'https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/'
    },
    {
      provider: 'ElevenLabs (Multilingual v2)',
      region: 'US (EU доступен в Enterprise)',
      pricePerMillionUsd: 200.0,
      checkedDate: 'Октябрь 2026 (не проверено: тариф Pro $99/мес за 500k симв. = ~$200/M)',
      sourceUrl: 'https://elevenlabs.io/pricing'
    }
  ];

  return (
    <div className={styles.ttsContainer}>
      {/* Calm notice when neural keys are missing */}
      {!hasConfiguredNeural && (
        <div className={styles.noticeCard} role="region" aria-label="Инструкция по настройке">
          <p className={styles.noticeTitle}>
            Сравнение нейроголосов: эталон браузера активен
          </p>
          <p className={styles.noticeBody}>
            Для сравнения нейросетевых голосов задайте переменные в файле <code>.env.local</code>:
            <br />
            • <code>GOOGLE_TTS_KEY</code> — Google Cloud TTS (EU endpoint, Chirp 3 HD [$30/M] или Neural2 [$16/M]; голоса Chirp 3 HD не проверены в EU)
            <br />
            • <code>AZURE_SPEECH_KEY</code> и <code>AZURE_SPEECH_REGION=norwayeast</code> — Azure AI Speech ($16/M ориентировочно [не проверено], голоса nb-NO-PernilleNeural, nb-NO-FinnNeural)
            <br />
            • <code>ELEVENLABS_API_KEY</code> — ElevenLabs (~$200/M [не проверено]; обязательно указывать Voice ID, например <code>elevenlabs:21m00Tcm4TlvDq8ikWAM</code> [не проверено], а не текстовое имя)
            <br />
            Сейчас доступен базовый голос браузера (Web Speech API) в качестве эталона для сравнения.
          </p>
        </div>
      )}

      {/* FIXED 12 SENTENCES SELECTOR */}
      <section className={styles.sectionCard} aria-labelledby="sentencesHeading">
        <h2 id="sentencesHeading" className={styles.sectionTitle}>
          12 тестовых предложений для норвежского языка (A2/B1)
        </h2>
        <div className={styles.sentenceChipsGrid}>
          {TEST_SENTENCES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.sentenceChip} ${selectedSentenceId === item.id ? styles.sentenceChipActive : ''}`}
              onClick={() => handleSelectSentence(item)}
              aria-pressed={selectedSentenceId === item.id}
            >
              <span className={styles.chipCategory}>{item.category}</span>
              <span className={styles.chipText}>{item.text}</span>
            </button>
          ))}
        </div>
      </section>

      {/* SYNTHESIS CONTROLS */}
      <section className={styles.sectionCard} aria-labelledby="controlsHeading">
        <h2 id="controlsHeading" className={styles.sectionTitle}>
          Синтез и воспроизведение
        </h2>

        <div className={styles.formGroup}>
          <label htmlFor="ttsInputText" className={styles.fieldLabel}>
            Текст для озвучивания (до 400 символов, текущая длина: {text.length} / 400)
          </label>
          <textarea
            id="ttsInputText"
            className={styles.textarea}
            rows={3}
            maxLength={400}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Введите текст на норвежском..."
            lang="nb"
          />
        </div>

        <div className={styles.controlsRow}>
          <div className={styles.formGroupFlex}>
            <label htmlFor="voiceSelect" className={styles.fieldLabel}>
              Голос для синтеза
            </label>
            <select
              id="voiceSelect"
              className={styles.select}
              value={selectedVoiceKey}
              onChange={(e) => setSelectedVoiceKey(e.target.value)}
            >
              {voiceOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroupFlexNarrow}>
            <label htmlFor="rateSelect" className={styles.fieldLabel}>
              Скорость речи
            </label>
            <select
              id="rateSelect"
              className={styles.select}
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
            >
              <option value={0.8}>0.8x (медленно)</option>
              <option value={1.0}>1.0x (нормально)</option>
              <option value={1.15}>1.15x (быстро)</option>
            </select>
          </div>
        </div>

        {selectedOption.isOutOfEu && (
          <div className={styles.warningNotice} role="note">
            Внимание: провайдер настроен с регионом вне ЕС, только для сравнения качества.
          </div>
        )}

        {error && (
          <div className={styles.errorNotice} role="alert">
            {error}
          </div>
        )}

        <div className={styles.buttonRow}>
          <button
            type="button"
            className={styles.primaryActionBtn}
            onClick={handleSynthesizeAndPlay}
            disabled={isGenerating || !text.trim() || (!selectedOption.isConfigured && selectedOption.provider !== 'browser')}
          >
            {isGenerating ? 'Синтезирую...' : 'Сгенерировать и воспроизвести'}
          </button>
        </div>
      </section>

      {/* GENERATED CLIPS & RATING */}
      {clips.length > 0 && (
        <section className={styles.sectionCard} aria-labelledby="clipsHeading">
          <div className={styles.headerWithAction}>
            <h2 id="clipsHeading" className={styles.sectionTitle}>
              Сгенерированные аудиоклипы и оценки
            </h2>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={handleDownloadCsv}
            >
              Скачать оценки (CSV)
            </button>
          </div>

          <div className={styles.clipsList}>
            {clips.map((clip) => {
              const currentRating = ratings[clip.id] || { naturalness: 0, clarity: 0, note: '' };

              return (
                <div key={clip.id} className={styles.clipItem} data-testid="ttsClipCard">
                  <div className={styles.clipHeader}>
                    <div className={styles.clipMeta}>
                      <span className={styles.clipBadge}>
                        {clip.provider === 'browser'
                          ? 'Браузер'
                          : clip.provider === 'google'
                            ? 'Google TTS'
                            : clip.provider === 'azure'
                              ? 'Azure Speech'
                              : 'ElevenLabs'}
                      </span>
                      <span className={styles.clipVoice}>{clip.voice}</span>
                      <span className={styles.clipStat}>{clip.latencyMs} мс</span>
                      <span className={styles.clipStat}>{clip.charCount} симв.</span>
                      {clip.isOutOfEu && (
                        <span className={styles.outOfEuBadge}>
                          регион вне ЕС, только для сравнения
                        </span>
                      )}
                    </div>
                  </div>

                  <p className={styles.clipText} lang="nb">
                    «{clip.text}»
                  </p>

                  <div className={styles.playerRow}>
                    {clip.audioUrl ? (
                      <audio controls src={clip.audioUrl} className={styles.audioPlayer} />
                    ) : (
                      <button
                        type="button"
                        className={styles.outlineReplayBtn}
                        onClick={() => void speakNorwegian(clip.text, { rate })}
                      >
                        Воспроизвести снова (браузер)
                      </button>
                    )}
                  </div>

                  {/* RATING FORM */}
                  <div className={styles.ratingBox}>
                    <div className={styles.ratingRow}>
                      <span className={styles.ratingLabel}>Естественность:</span>
                      <div className={styles.starsGroup} role="group" aria-label="Естественность от 1 до 5">
                        {[1, 2, 3, 4, 5].map((val) => (
                          <button
                            key={val}
                            type="button"
                            className={`${styles.starBtn} ${currentRating.naturalness === val ? styles.starBtnActive : ''}`}
                            onClick={() => handleRateClip(clip, 'naturalness', val)}
                            aria-pressed={currentRating.naturalness === val}
                            aria-label={`Оценка естественности ${val}`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.ratingRow}>
                      <span className={styles.ratingLabel}>Понятность:</span>
                      <div className={styles.starsGroup} role="group" aria-label="Понятность от 1 до 5">
                        {[1, 2, 3, 4, 5].map((val) => (
                          <button
                            key={val}
                            type="button"
                            className={`${styles.starBtn} ${currentRating.clarity === val ? styles.starBtnActive : ''}`}
                            onClick={() => handleRateClip(clip, 'clarity', val)}
                            aria-pressed={currentRating.clarity === val}
                            aria-label={`Оценка понятности ${val}`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.noteRow}>
                      <label htmlFor={`note-${clip.id}`} className={styles.noteLabel}>
                        Заметка:
                      </label>
                      <input
                        id={`note-${clip.id}`}
                        type="text"
                        className={styles.noteInput}
                        value={currentRating.note}
                        onChange={(e) => handleUpdateNote(clip, e.target.value)}
                        placeholder="Например: хорошая интонация, естественное ударение..."
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* RATINGS SUMMARY STATS */}
      {voiceStats.length > 0 && (
        <section className={styles.sectionCard} aria-labelledby="statsHeading">
          <h2 id="statsHeading" className={styles.sectionTitle}>
            Сводка оценок по провайдерам и голосам
          </h2>
          <div className={styles.tableWrapper}>
            <table className={styles.statsTable}>
              <thead>
                <tr>
                  <th>Провайдер и голос</th>
                  <th>Клипов</th>
                  <th>Ср. естественность (1–5)</th>
                  <th>Ср. понятность (1–5)</th>
                  <th>Ср. задержка</th>
                </tr>
              </thead>
              <tbody>
                {voiceStats.map((st) => (
                  <tr key={st.key}>
                    <td>{st.key}</td>
                    <td>{st.count}</td>
                    <td>{st.avgNat}</td>
                    <td>{st.avgClar}</td>
                    <td>{st.avgLat} мс</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* COST HELPER & CALCULATOR */}
      <section className={styles.sectionCard} aria-labelledby="costHeading">
        <h2 id="costHeading" className={styles.sectionTitle}>
          Оценка стоимости и калькулятор сессии
        </h2>
        <p className={styles.sectionSubtitle}>
          Целевой ориентир продукта: <strong>не более 25 kr</strong> за успешную сдачу (ИИ-коуч + озвучка вместе).
        </p>

        <div className={styles.tableWrapper}>
          <table className={styles.statsTable}>
            <thead>
              <tr>
                <th>Провайдер / Модель</th>
                <th>Регион</th>
                <th>Цена за 1 млн символов</th>
                <th>Проверено</th>
              </tr>
            </thead>
            <tbody>
              {pricingData.map((p) => (
                <tr key={p.provider}>
                  <td>
                    <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className={styles.tableLink}>
                      {p.provider}
                    </a>
                  </td>
                  <td>{p.region}</td>
                  <td>{p.pricePerMillionUsd === 0 ? '0 kr (бесплатно)' : `$${p.pricePerMillionUsd.toFixed(2)}`}</td>
                  <td>{p.checkedDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.calculatorBox}>
          <div className={styles.calcHeader}>
            <label htmlFor="calcCharsInput" className={styles.fieldLabel}>
              Символов речи экзаменатора за одну сессию практики (по умолчанию 1 500):
            </label>
            <input
              id="calcCharsInput"
              type="number"
              min={100}
              max={10000}
              step={100}
              className={styles.calcInput}
              value={calcChars}
              onChange={(e) => setCalcChars(parseInt(e.target.value) || 0)}
            />
          </div>

          <div className={styles.calcResultsGrid}>
            {pricingData.map((p) => {
              const usdCost = (calcChars / 1_000_000) * p.pricePerMillionUsd;
              const nokCost = usdCost * 10.5; // ~10.5 NOK per USD

              return (
                <div key={p.provider} className={styles.calcResultCard}>
                  <div className={styles.calcProviderName}>{p.provider}</div>
                  <div className={styles.calcCostValue}>
                    {p.pricePerMillionUsd === 0 ? '0,00 kr' : `${nokCost.toFixed(2)} kr`}
                  </div>
                  <div className={styles.calcCostSubtext}>
                    {p.pricePerMillionUsd === 0
                      ? 'В браузере ученика'
                      : `$${usdCost.toFixed(4)} за сессию`}
                  </div>
                  <div className={styles.calcBudgetBadge}>
                    ≤ 25 kr цель соблюдена
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
