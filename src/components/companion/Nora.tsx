'use client';

import type { CSSProperties } from 'react';
import './nora.css';

export type NoraState = 'idle' | 'listening' | 'thinking' | 'speaking';
export type NoraSize = 'sm' | 'md' | 'lg';

export interface NoraProps {
  state: NoraState;
  level?: number;
  size?: NoraSize;
}

export const NORA_STATE_LABELS: Record<NoraState, string> = {
  idle: 'Нора ждёт',
  listening: 'Нора слушает',
  thinking: 'Нора думает',
  speaking: 'Нора говорит'
};

export function Nora({ state, level = 0, size = 'md' }: NoraProps) {
  const clampedLevel = Math.max(0, Math.min(1, Number.isFinite(level) ? level : 0));
  const label = NORA_STATE_LABELS[state] ?? NORA_STATE_LABELS.idle;

  const orbStyle: CSSProperties | undefined =
    state === 'listening'
      ? { transform: `scale(${Number((1 + clampedLevel * 0.12).toFixed(4))})` }
      : undefined;

  return (
    <div className={`nora-wrapper nora-size-${size} nora-state-${state}`}>
      <div
        role="img"
        aria-label={label}
        className={`nora-orb nora-orb-${size} nora-orb-${state}`}
        style={orbStyle}
      >
        {state === 'speaking' ? (
          <>
            <span className="nora-ring nora-ring-1" aria-hidden="true" />
            <span className="nora-ring nora-ring-2" aria-hidden="true" />
          </>
        ) : null}
        <span className="nora-core" aria-hidden="true" />
      </div>
      <span className="nora-reduced-motion-label t-caption">{label}</span>
    </div>
  );
}
