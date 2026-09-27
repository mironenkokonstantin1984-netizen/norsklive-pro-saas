'use client';

import { useEffect, useRef } from 'react';
import type { ChatMessage, L1Language } from './useStudioState';

export interface ChatPanelProps {
  chatHistory: ChatMessage[];
  partnerName: string;
  l1Lang: L1Language;
  blurMode: boolean;
  onSpeak: (text: string) => void;
  onSaveToGlossary: (word: string, translation: string, example?: string) => void;
}

export function ChatPanel({
  chatHistory,
  partnerName,
  l1Lang,
  blurMode,
  onSpeak,
  onSaveToGlossary
}: ChatPanelProps) {
  const streamRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [chatHistory.length]);

  const flagIcon = l1Lang === 'ua' ? '🇺🇦' : l1Lang === 'en' ? '🇬🇧' : '🇷🇺';

  return (
    <div className="chat-stream" id="chatStream" ref={streamRef}>
      {chatHistory.map((msg, index) => {
        const isAi = msg.sender === 'ai';
        const speakerLabel = isAi ? `🇳🇴 ${partnerName}` : '🎙️ Du (Кандидат)';
        const bubbleClass = [
          'msg-bubble',
          isAi ? 'msg-ai' : 'msg-user',
          blurMode && isAi ? 'blur-text' : ''
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <div key={`${index}-${msg.sender}`} className={bubbleClass}>
            <div className="msg-meta">
              <span>{speakerLabel}</span>
              <span>{msg.time || '12:00'}</span>
            </div>
            <div className="msg-norsk">{msg.norsk}</div>
            {msg.l1 ? (
              <div className="msg-translation">{`${flagIcon} ${msg.l1}`}</div>
            ) : null}
            <div className="msg-actions">
              <button
                type="button"
                className="mini-action-btn btn-replay"
                onClick={() => onSpeak(msg.norsk)}
              >
                🔊 Озвучить
              </button>
              <button
                type="button"
                className="mini-action-btn btn-save-phrase"
                onClick={() =>
                  onSaveToGlossary(
                    msg.norsk.slice(0, 65),
                    msg.l1 || 'Lagret fra samtale',
                    msg.norsk
                  )
                }
              >
                📌 В словарь
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
