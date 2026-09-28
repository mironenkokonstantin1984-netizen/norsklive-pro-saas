// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Nora, type NoraState } from '../src/components/companion/Nora';
import NoraLabPage, { isNoraLabEnabled } from '../src/app/lab/nora/page';

const notFoundMock = vi.fn(() => {
  throw new Error('NEXT_NOT_FOUND');
});

vi.mock('next/navigation', () => ({
  notFound: () => notFoundMock()
}));

describe('Nora companion orb & /lab/nora preview (Issue #27)', () => {
  const originalEnv = process.env.NORA_LAB_ENABLED;

  afterEach(() => {
    cleanup();
    notFoundMock.mockClear();
    if (originalEnv === undefined) {
      delete process.env.NORA_LAB_ENABLED;
    } else {
      process.env.NORA_LAB_ENABLED = originalEnv;
    }
  });

  it('renders each state with the exact Russian aria-label and state class', () => {
    const cases: Array<{ state: NoraState; label: string }> = [
      { state: 'idle', label: 'Нора ждёт' },
      { state: 'listening', label: 'Нора слушает' },
      { state: 'thinking', label: 'Нора думает' },
      { state: 'speaking', label: 'Нора говорит' }
    ];

    const { rerender, container } = render(<Nora state="idle" size="md" />);

    for (const c of cases) {
      rerender(<Nora state={c.state} size="md" />);
      const img = screen.getByRole('img', { name: c.label });
      expect(img).toBeTruthy();
      expect(img.classList.contains(`nora-orb-${c.state}`)).toBe(true);
      expect(img.classList.contains('nora-orb-md')).toBe(true);
      if (c.state === 'speaking') {
        expect(container.querySelectorAll('.nora-ring').length).toBe(2);
      } else {
        expect(container.querySelectorAll('.nora-ring').length).toBe(0);
      }
    }
  });

  it('scales inline transform with level in listening state (scale(1 + level * 0.12))', () => {
    const { rerender } = render(<Nora state="listening" level={0.5} size="lg" />);
    const orb = screen.getByRole('img', { name: 'Нора слушает' });
    expect(orb.style.transform).toBe('scale(1.06)');

    rerender(<Nora state="listening" level={1} size="lg" />);
    expect(orb.style.transform).toBe('scale(1.12)');

    rerender(<Nora state="idle" level={1} size="lg" />);
    const idleOrb = screen.getByRole('img', { name: 'Нора ждёт' });
    expect(idleOrb.style.transform).toBe('');
  });

  it('returns notFound() when NORA_LAB_ENABLED is off and renders all 4 states + slider when on', () => {
    delete process.env.NORA_LAB_ENABLED;
    expect(isNoraLabEnabled()).toBe(false);
    expect(() => NoraLabPage()).toThrow('NEXT_NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalledTimes(1);

    process.env.NORA_LAB_ENABLED = 'true';
    expect(isNoraLabEnabled()).toBe(true);
    const { container } = render(<NoraLabPage />);
    expect(screen.getByRole('img', { name: 'Нора ждёт' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Нора слушает' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Нора думает' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Нора говорит' })).toBeTruthy();

    const slider = container.querySelector('#noraLevelSlider') as HTMLInputElement;
    expect(slider).toBeTruthy();
    fireEvent.change(slider, { target: { value: '0.75' } });
    const listeningOrb = screen.getByRole('img', { name: 'Нора слушает' });
    expect(listeningOrb.style.transform).toBe('scale(1.09)');
  });
});
