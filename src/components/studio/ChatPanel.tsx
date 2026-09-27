'use client';

import { useEffect, useRef } from 'react';
import { Bookmark, Bot, Volume2 } from 'lucide-react';
import type { ChatMessage, L1Language } from './useStudioState';

export interface ChatPanelProps {
  chatHistory: ChatMessage[];
  partnerName: string;
  l1Lang: L1Language;
  blurMode: boolean;
  onSpeak: (text: string) => void;
  onSaveToGlossary: (word: string, translation: string) => void;
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
  }, [chatHistory]);

  return (
    <div className="chat-stream" id="chatStream" ref={streamRef}>
      {chatHistory.map((msg, index) => {
        const key = `${index}-${msg.sender}-${msg.time || ''}`;
        if (msg.sender === 'ai') {
          const l1Translation = msg.l1 || '';

          return (
            <div
              key={key}
              className={`msg msg-ai ${blurMode ? 'blurred' : ''}`}
            >
              <div className="msg-speaker t-caption">
                <Bot size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
                <span>{partnerName}</span>
              </div>
              <div className="msg-norsk t-speech">{msg.norsk}</div>
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

        return (
          <div key={key} className="msg msg-user">
            <div className="msg-speaker t-caption">Du (Кандидат)</div>
            <div className="msg-user-text t-speech">{msg.norsk}</div>
          </div>
        );
      })}
    </div>
  );
}
