'use client';

import { useState } from 'react';
import { Nora, type NoraSize, type NoraState } from '../../../components/companion/Nora';

const STATES: NoraState[] = ['idle', 'listening', 'thinking', 'speaking'];
const SIZES: NoraSize[] = ['sm', 'md', 'lg'];

export function NoraLabClient() {
  const [level, setLevel] = useState<number>(0.5);
  const [size, setSize] = useState<NoraSize>('lg');

  return (
    <main className="nora-lab-page">
      <div className="nora-lab-container">
        <header className="nora-lab-header">
          <h1 className="t-title">Nora Companion Lab</h1>
          <p className="t-body nora-lab-subtitle">
            Четыре состояния компаньона Нора: ожидание, слушание, обдумывание, речь.
          </p>
        </header>

        <section className="nora-lab-controls" aria-label="Параметры предпросмотра">
          <label className="nora-lab-field t-callout" htmlFor="noraLevelSlider">
            <span>{`Уровень голоса (level): ${level.toFixed(2)}`}</span>
            <input
              id="noraLevelSlider"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
            />
          </label>

          <div className="nora-lab-sizes" role="group" aria-label="Размер сферы">
            {SIZES.map((s) => (
              <button
                key={s}
                type="button"
                className={`btn-outline ${size === s ? 'active' : ''}`}
                aria-pressed={size === s}
                onClick={() => setSize(s)}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </section>

        <section className="nora-lab-grid" aria-label="Состояния Норы">
          {STATES.map((st) => (
            <article key={st} className="nora-lab-card">
              <div className="nora-lab-state-name t-callout">{st}</div>
              <Nora state={st} level={level} size={size} />
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
