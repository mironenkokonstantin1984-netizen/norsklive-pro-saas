'use client';

import { useRef, useState } from 'react';
import { ArrowDown, Bookmark, Bot, RotateCcw, Volume2, X } from 'lucide-react';
import type { Correction } from '../../server/schemas';
import type { LearnerMood } from '../../lib/prefs';
import { formatCountRu } from '../../lib/plural';
import { CorrectionCard } from './CorrectionCard';
import { useChatAutoScroll } from './useChatAutoScroll';
import type { ChatMessage, CoachErrorInfo, L1Language, QuotaExceededInfo } from './useStudioState';

const REPLIKA_FORMS = { one: 'реплику', few: 'реплики', many: 'реплик' } as const;
const ERROR_FORMS = { one: 'ошибку', few: 'ошибки', many: 'ошибок' } as const;

export interface ChatPanelProps {
  chatHistory: ChatMessage[];
  coachingHistory?: Correction[];
  partnerName: string;
  l1Lang: L1Language;
  blurMode: boolean;
  subtitlesEnabled?: boolean;
  /** Exam mode: no «Попробуйте» phrase under the correction. */
  examMode?: boolean;
  activeSpeech?: { text: string; charIndex: number } | null;
  quotaExceeded?: QuotaExceededInfo | null;
  limitCardDismissed?: boolean;
  onDismissLimitCard?: () => void;
  coachError?: CoachErrorInfo | null;
  isThinking?: boolean;
  onRetry?: () => void;
  onSpeak: (text: string) => void;
  onSaveToGlossary: (word: string, translation: string) => void;
  onSelectMood?: (mood: LearnerMood) => void;
}

export const EXAMPLE_ANSWER_LABEL = 'Пример ответа, ИИ не подключён';
export const COACH_ERROR_TEXT = 'Не получилось получить ответ. Ваш ответ сохранён.';

const MOOD_OPTIONS: LearnerMood[] = ['Спокойно', 'Нормально', 'Тревожно'];

export function renderSpokenText(
  text: string,
  subtitlesEnabled: boolean,
  activeSpeech: { text: string; charIndex: number } | null | undefined
) {
  if (!subtitlesEnabled || !activeSpeech || activeSpeech.text !== text) {
    return text;
  }
  const { charIndex } = activeSpeech;
  if (charIndex < 0 || charIndex >= text.length) {
    return text;
  }
  let start = charIndex;
  while (start < text.length && /\s/.test(text[start])) {
    start++;
  }
  if (start >= text.length) {
    return text;
  }
  while (start > 0 && !/\s/.test(text[start - 1])) {
    start--;
  }
  let end = start;
  while (end < text.length && !/\s/.test(text[end])) {
    end++;
  }
  if (start >= end) {
    return text;
  }
  return (
    <>
      {text.slice(0, start)}
      <mark className="subtitle-word-active">{text.slice(start, end)}</mark>
      {text.slice(end)}
    </>
  );
}

export function ChatPanel({
  chatHistory,
  coachingHistory = [],
  partnerName,
  l1Lang,
  blurMode,
  examMode = false,
  subtitlesEnabled = true,
  activeSpeech = null,
  quotaExceeded = null,
  limitCardDismissed = false,
  onDismissLimitCard,
  coachError = null,
  isThinking = false,
  onRetry,
  onSpeak,
  onSaveToGlossary,
  onSelectMood
}: ChatPanelProps) {
  const streamRef = useRef<HTMLDivElement | null>(null);
  const [dismissedMoodTurn, setDismissedMoodTurn] = useState<number | null>(null);

  const { showNewMessages, announcement, jumpToNewest } = useChatAutoScroll({
    streamRef,
    chatHistory,
    limitCardVisible: Boolean(quotaExceeded) && !limitCardDismissed,
    errorCardVisible: Boolean(coachError)
  });

  let lastUserIndex = -1;
  let learnerTurnCount = 0;
  for (let i = 0; i < chatHistory.length; i++) {
    if (chatHistory[i].sender === 'user') {
      lastUserIndex = i;
      learnerTurnCount++;
    }
  }

  const showMoodCard =
    learnerTurnCount > 0 && learnerTurnCount % 5 === 0 && dismissedMoodTurn !== learnerTurnCount;

  const handleMoodClick = (mood: LearnerMood) => {
    onSelectMood?.(mood);
    setDismissedMoodTurn(learnerTurnCount);
  };

  return (
    <div className="chat-stream" id="chatStream" ref={streamRef}>
      {chatHistory.map((msg, index) => {
        const key = `${index}-${msg.sender}-${msg.time || ''}`;
        if (msg.sender === 'ai') {
          const l1Translation = msg.l1 || '';

          return (
            <div key={key} className={`msg msg-ai ${blurMode ? 'blurred' : ''}`}>
              <div className="msg-speaker t-caption">
                <Bot size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
                <span>{partnerName}</span>
              </div>
              {msg.isExample ? (
                <div className="msg-example-label t-caption" data-testid="exampleAnswerLabel">
                  {EXAMPLE_ANSWER_LABEL}
                </div>
              ) : null}
              <div className="msg-norsk t-speech">
                {renderSpokenText(msg.norsk, subtitlesEnabled, activeSpeech)}
              </div>
              {l1Translation ? (
                <div className="msg-ru t-caption">{`${l1Lang.toUpperCase()}: ${l1Translation}`}</div>
              ) : null}
              <div className="msg-actions">
                <button
                  type="button"
                  className="mini-action-btn btn-speak"
                  onClick={() => onSpeak(msg.norsk)}
                >
                  <Volume2 size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
                  <span>Прослушать</span>
                </button>
                <button
                  type="button"
                  className="mini-action-btn btn-save-phrase"
                  onClick={() => onSaveToGlossary(msg.norsk, l1Translation)}
                >
                  <Bookmark size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
                  <span>В словарь</span>
                </button>
              </div>
            </div>
          );
        }

        const isLatestUserMsg = index === lastUserIndex && coachingHistory.length > 0;
        const correctionIsExample = Boolean(chatHistory[index + 1]?.isExample);

        return (
          <div key={key} className="user-turn-group">
            <div className="msg msg-user">
              <div className="msg-speaker t-caption">Du (Кандидат)</div>
              <div className="msg-user-text t-speech">{msg.norsk}</div>
            </div>
            {isLatestUserMsg && correctionIsExample ? (
              <div className="msg-example-label t-caption">{EXAMPLE_ANSWER_LABEL}</div>
            ) : null}
            {isLatestUserMsg ? (
              <CorrectionCard
                correction={coachingHistory[0]}
                olderCorrections={coachingHistory.slice(1)}
                showTry={!examMode}
                onSpeak={onSpeak}
              />
            ) : null}
          </div>
        );
      })}

      {coachError ? (
        <div className="coach-error-card" role="alert" data-testid="coachErrorCard">
          <p className="coach-error-text t-body">{COACH_ERROR_TEXT}</p>
          <button
            type="button"
            className="btn-outline coach-retry-btn t-callout"
            onClick={onRetry}
            disabled={isThinking}
          >
            <RotateCcw size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
            <span>Повторить</span>
          </button>
        </div>
      ) : null}

      {showMoodCard ? (
        <div
          className="mood-check-card"
          id="moodCheckCard"
          role="region"
          aria-label="Как ощущения?"
        >
          <div className="mood-check-header">
            <span className="mood-check-title t-callout">Как ощущения?</span>
            <button
              type="button"
              className="btn-text mood-dismiss-btn"
              aria-label="Закрыть вопрос"
              onClick={() => setDismissedMoodTurn(learnerTurnCount)}
            >
              <X size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
            </button>
          </div>
          <div className="mood-check-options">
            {MOOD_OPTIONS.map((mood) => (
              <button
                key={mood}
                type="button"
                className="btn-outline mood-option-btn"
                onClick={() => handleMoodClick(mood)}
              >
                {mood}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {quotaExceeded && !limitCardDismissed ? (
        <div
          className="daily-limit-card"
          data-testid="dailyLimitCard"
          role="region"
          aria-labelledby="dailyLimitCardTitle"
        >
          <h3 id="dailyLimitCardTitle" className="daily-limit-title t-callout">
            На сегодня бесплатные ответы закончились
          </h3>
          <p className="daily-limit-body t-body">
            {`Вы сделали ${formatCountRu(learnerTurnCount, REPLIKA_FORMS)} и разобрали ${formatCountRu(coachingHistory.length, ERROR_FORMS)}. Лимит бесплатного плана — ${quotaExceeded.limit} в день, завтра снова доступно.`}
          </p>
          <div className="daily-limit-actions">
            <a href="/path#plans" className="btn-primary daily-limit-primary-btn t-callout">
              Посмотреть подписку
            </a>
            <button
              type="button"
              className="btn-text daily-limit-secondary-btn t-callout"
              onClick={onDismissLimitCard}
            >
              Вернусь завтра
            </button>
          </div>
        </div>
      ) : null}

      <div className="sr-only" aria-live="polite" data-testid="chatAnnouncer">
        {announcement}
      </div>

      {showNewMessages ? (
        <button
          type="button"
          className="btn-outline new-messages-btn t-callout"
          onClick={jumpToNewest}
        >
          <ArrowDown size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
          <span>Новые сообщения</span>
        </button>
      ) : null}
    </div>
  );
}
