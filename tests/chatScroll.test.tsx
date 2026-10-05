// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { ChatPanel } from '../src/components/studio/ChatPanel';
import type { ChatMessage } from '../src/components/studio/useStudioState';
import { NEW_REPLY_ANNOUNCEMENT } from '../src/components/studio/useChatAutoScroll';
import { scrollIntoViewClear } from '../src/lib/scrollIntoViewClear';

vi.mock('../src/lib/scrollIntoViewClear', () => ({ scrollIntoViewClear: vi.fn() }));

const greeting: ChatMessage = { sender: 'ai', norsk: 'Hei! Fortell litt om deg selv.' };
const learner: ChatMessage = { sender: 'user', norsk: 'Jeg heter Anna.' };
const reply: ChatMessage = { sender: 'ai', norsk: 'Så hyggelig. Hvor bor du?' };
const learner2: ChatMessage = { sender: 'user', norsk: 'Jeg bor i Bergen.' };
const reply2: ChatMessage = { sender: 'ai', norsk: 'Hva jobber du med?' };

function panel(chatHistory: ChatMessage[]) {
  return (
    <ChatPanel
      chatHistory={chatHistory}
      coachingHistory={[]}
      partnerName="Sensor"
      l1Lang="ru"
      blurMode={false}
      onSpeak={vi.fn()}
      onSaveToGlossary={vi.fn()}
    />
  );
}

const scrollIntoView = vi.mocked(scrollIntoViewClear);
let reducedMotion = false;
let pageScrollY = 0;
let pageScrollHeight = 0;

function setPage(scrollY: number, scrollHeight: number) {
  pageScrollY = scrollY;
  pageScrollHeight = scrollHeight;
}

/** Simulates the learner scrolling the page up with the mouse wheel. */
function learnerScrollsUp() {
  // The page is long and the learner is at its bottom first...
  setPage(2300, 3000);
  fireEvent.scroll(document);
  // ...then scrolls up with the wheel.
  fireEvent.wheel(window, { deltaY: -600 });
  setPage(100, 3000);
  fireEvent.scroll(document);
}

beforeEach(() => {
  vi.useFakeTimers();
  scrollIntoView.mockClear();
  reducedMotion = false;
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? reducedMotion : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    onchange: null,
    dispatchEvent: vi.fn()
  })) as unknown as typeof window.matchMedia;
  // The page starts at the bottom: 700 px of content in a 768 px window.
  setPage(0, 700);
  Object.defineProperty(window, 'scrollY', { configurable: true, get: () => pageScrollY });
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    configurable: true,
    get: () => pageScrollHeight
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function lastCallTarget() {
  const calls = scrollIntoView.mock.calls;
  return calls[calls.length - 1]?.[0] as HTMLElement | undefined;
}

describe('Chat auto-scroll (#44)', () => {
  it('does not scroll on the first render, even with a restored history', () => {
    render(panel([greeting, learner, reply]));
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('scrolls the newest examiner reply into view with a smooth scroll', () => {
    const { rerender } = render(panel([greeting]));
    rerender(panel([greeting, learner]));
    rerender(panel([greeting, learner, reply]));

    expect(scrollIntoView).toHaveBeenLastCalledWith(
      expect.anything(),
      'start',
      'smooth',
      expect.anything()
    );
    expect(lastCallTarget()?.textContent).toContain('Hvor bor du?');
  });

  it('scrolls without animation when the learner prefers reduced motion', () => {
    reducedMotion = true;
    const { rerender } = render(panel([greeting]));
    rerender(panel([greeting, learner]));
    rerender(panel([greeting, learner, reply]));

    expect(scrollIntoView).toHaveBeenLastCalledWith(
      expect.anything(),
      'start',
      'auto',
      expect.anything()
    );
  });

  it('keeps the learner’s own message in view when it is sent', () => {
    const { rerender } = render(panel([greeting]));
    rerender(panel([greeting, learner]));

    expect(scrollIntoView).toHaveBeenLastCalledWith(
      expect.anything(),
      'nearest',
      'smooth',
      expect.anything()
    );
    expect(lastCallTarget()?.textContent).toContain('Jeg heter Anna.');
  });

  it('does not pull a learner who scrolled up; shows «Новые сообщения» instead', () => {
    const { rerender } = render(panel([greeting]));
    rerender(panel([greeting, learner]));
    scrollIntoView.mockClear();

    learnerScrollsUp();
    rerender(panel([greeting, learner, reply]));

    expect(scrollIntoView).not.toHaveBeenCalled();
    const button = screen.getByRole('button', { name: 'Новые сообщения' });

    fireEvent.click(button);
    expect(scrollIntoView).toHaveBeenLastCalledWith(
      expect.anything(),
      'start',
      'smooth',
      expect.anything()
    );
    expect(lastCallTarget()?.textContent).toContain('Hvor bor du?');
    expect(screen.queryByRole('button', { name: 'Новые сообщения' })).toBeNull();
  });

  it('follows again after the learner sends the next message', () => {
    const { rerender } = render(panel([greeting]));
    rerender(panel([greeting, learner]));
    learnerScrollsUp();
    rerender(panel([greeting, learner, reply]));
    expect(screen.getByRole('button', { name: 'Новые сообщения' })).toBeTruthy();

    rerender(panel([greeting, learner, reply, learner2]));
    expect(screen.queryByRole('button', { name: 'Новые сообщения' })).toBeNull();

    scrollIntoView.mockClear();
    rerender(panel([greeting, learner, reply, learner2, reply2]));
    expect(scrollIntoView).toHaveBeenLastCalledWith(
      expect.anything(),
      'start',
      'smooth',
      expect.anything()
    );
    expect(lastCallTarget()?.textContent).toContain('Hva jobber du med?');
  });

  it('hides the button when the learner scrolls back to the bottom', () => {
    const { rerender } = render(panel([greeting]));
    rerender(panel([greeting, learner]));
    learnerScrollsUp();
    rerender(panel([greeting, learner, reply]));
    expect(screen.getByRole('button', { name: 'Новые сообщения' })).toBeTruthy();

    setPage(2300, 3000);
    fireEvent.scroll(document);
    expect(screen.queryByRole('button', { name: 'Новые сообщения' })).toBeNull();
  });

  it('announces a new reply once in a polite live region', () => {
    const { rerender } = render(panel([greeting]));
    const announcer = screen.getByTestId('chatAnnouncer');
    expect(announcer.getAttribute('aria-live')).toBe('polite');
    expect(announcer.textContent).toBe('');

    rerender(panel([greeting, learner]));
    rerender(panel([greeting, learner, reply]));
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(announcer.textContent).toBe(NEW_REPLY_ANNOUNCEMENT);
    expect(announcer.textContent).not.toContain('Hvor bor du?');
  });

  it('scrolls to the daily-limit card when it appears', () => {
    const { rerender } = render(panel([greeting, learner, reply]));
    rerender(
      <ChatPanel
        chatHistory={[greeting, learner, reply]}
        coachingHistory={[]}
        partnerName="Sensor"
        l1Lang="ru"
        blurMode={false}
        quotaExceeded={{ limit: 20, plan: 'free' }}
        onSpeak={vi.fn()}
        onSaveToGlossary={vi.fn()}
      />
    );
    expect(lastCallTarget()?.getAttribute('data-testid')).toBe('dailyLimitCard');
  });
});
