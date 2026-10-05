// @vitest-environment jsdom
import React from 'react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { StudioPage } from '../src/components/studio/StudioPage';
import { COACH_ERROR_TEXT, EXAMPLE_ANSWER_LABEL } from '../src/components/studio/ChatPanel';

const REPLY = {
  reply_norsk: 'Så fint! Hvor lenge har du bodd der?',
  reply_l1: 'Как здорово! Как долго ты там живёшь?',
  correction: {
    original: 'Jeg bor i Bergen.',
    natural_bokmal: 'Jeg bor i Bergen.',
    b2_upgrade: 'Jeg bor i Bergen.',
    grammar_rule_l1: 'Всё верно.',
    cefr_estimate: 'A2',
    v2_status: 'Korrekt V2'
  },
  next_hints: []
};

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function send(container: HTMLElement, text: string) {
  const input = container.querySelector('#userSpeechInput') as HTMLInputElement;
  fireEvent.change(input, { target: { value: text } });
  fireEvent.click(container.querySelector('#sendSpeechBtn') as HTMLButtonElement);
}

describe('#45 coach unavailable card and retry', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    cleanup();
  });

  test('503 shows the error card, keeps the message, and «Повторить» re-sends the same text once', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(503, { error: 'coach_unavailable' }))
      .mockResolvedValueOnce(jsonResponse(200, REPLY));
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const { container, getByRole } = render(<StudioPage />);
    send(container, 'Jeg bor i Bergen.');

    await waitFor(() => {
      expect(container.querySelector('[data-testid="coachErrorCard"]')?.textContent).toContain(
        COACH_ERROR_TEXT
      );
    });
    expect(container.querySelector('[data-testid="coachErrorCard"]')?.getAttribute('role')).toBe(
      'alert'
    );
    expect(container.querySelectorAll('#chatStream .msg-user')).toHaveLength(1);
    expect(container.querySelectorAll('#chatStream .msg-ai')).toHaveLength(1);

    fireEvent.click(getByRole('button', { name: 'Повторить' }));

    await waitFor(() => {
      expect(container.querySelectorAll('#chatStream .msg-ai')).toHaveLength(2);
    });
    expect(container.querySelector('[data-testid="coachErrorCard"]')).toBeNull();
    // The learner's message was not duplicated by the retry.
    expect(container.querySelectorAll('#chatStream .msg-user')).toHaveLength(1);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    const retryBody = JSON.parse(fetchMock.mock.calls[1][1].body as string);
    expect(retryBody.userText).toBe('Jeg bor i Bergen.');
    expect(retryBody.userText).toBe(firstBody.userText);
    expect(retryBody.history).toEqual(firstBody.history);
  });

  test('a network failure also shows the card, never a correction', async () => {
    globalThis.fetch = vi
      .fn()
      .mockRejectedValue(new TypeError('Failed to fetch')) as unknown as typeof globalThis.fetch;

    const { container } = render(<StudioPage />);
    send(container, 'Hei!');

    await waitFor(() => {
      expect(container.querySelector('[data-testid="coachErrorCard"]')).not.toBeNull();
    });
    expect(container.querySelector('#chatStream .correction-card')).toBeNull();
  });

  test('a canned example answer (source: fallback) is labelled «Пример ответа, ИИ не подключён»', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(200, { ...REPLY, source: 'fallback' })
      ) as unknown as typeof globalThis.fetch;

    const { container } = render(<StudioPage />);
    send(container, 'Jeg bor i Bergen.');

    await waitFor(() => {
      expect(container.querySelector('[data-testid="exampleAnswerLabel"]')?.textContent).toBe(
        EXAMPLE_ANSWER_LABEL
      );
    });
    expect(container.querySelectorAll('.msg-example-label').length).toBe(2);
  });

  test('a real AI answer has no example label', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(jsonResponse(200, REPLY)) as unknown as typeof globalThis.fetch;

    const { container } = render(<StudioPage />);
    send(container, 'Jeg bor i Bergen.');

    await waitFor(() => {
      expect(container.querySelectorAll('#chatStream .msg-ai')).toHaveLength(2);
    });
    expect(container.querySelector('.msg-example-label')).toBeNull();
  });
});
