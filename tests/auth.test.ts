// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCoachHandler } from '../src/server/coachHandler';
import { AuthRequiredError, postCoach } from '../src/lib/coachClient';
import * as browserSupabaseModule from '../src/lib/supabase/browser';
import LoginPage from '../src/app/login/page';
import { TopBar } from '../src/components/studio/TopBar';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const VALID_COACH_BODY = {
  module: 'norskprove' as const,
  scenarioId: 'np-b1b2-velferd-hjemmekontor',
  level: 'B1' as const,
  l1: 'ru' as const,
  persona: 'standard' as const,
  userText: 'Vi må sikre høy sysselsetting og bærekraftig velferdsstat.',
  history: [],
  usedWords: []
};

function makeCoachRequest(body: unknown = VALID_COACH_BODY): Request {
  return new Request('http://localhost/api/coach', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

describe('M1b-2a Auth & Login tests', () => {
  it('1. /api/coach with auth enabled + getUser -> null returns 401 { error: "auth_required" } and never calls fetchImpl', async () => {
    const fetchSpy = vi.fn();
    const handler = createCoachHandler({
      authEnabled: () => true,
      getUser: async () => null,
      fetchImpl: fetchSpy as unknown as typeof globalThis.fetch
    });

    const res = await handler(makeCoachRequest());
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toEqual({ error: 'auth_required' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('2. /api/coach with auth enabled + authenticated user returns 200 (fallback path)', async () => {
    const prevKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
      const handler = createCoachHandler({
        authEnabled: () => true,
        getUser: async () => ({ id: '00000000-0000-0000-0000-000000000001' })
      });

      const res = await handler(makeCoachRequest());
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(typeof json.reply_norsk).toBe('string');
      expect(json.reply_norsk.length).toBeGreaterThan(0);
    } finally {
      if (prevKey !== undefined) {
        process.env.GEMINI_API_KEY = prevKey;
      }
    }
  });

  it('3. /api/coach with auth disabled + getUser -> null returns 200 (anonymous behaviour)', async () => {
    const prevKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
      const handler = createCoachHandler({
        authEnabled: () => false,
        getUser: async () => null
      });

      const res = await handler(makeCoachRequest());
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(typeof json.reply_norsk).toBe('string');
    } finally {
      if (prevKey !== undefined) {
        process.env.GEMINI_API_KEY = prevKey;
      }
    }
  });

  it('4. coachClient postCoach throws AuthRequiredError when server responds 401', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'auth_required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    await expect(postCoach(VALID_COACH_BODY)).rejects.toBeInstanceOf(AuthRequiredError);
  });

  it('5. Login page renders one email input and one submit button, calls signInWithOtp with /auth/callback, and shows sent message', async () => {
    const signInWithOtpMock = vi.fn().mockResolvedValue({ data: {}, error: null });
    vi.spyOn(browserSupabaseModule, 'createBrowserClient').mockReturnValue({
      auth: {
        signInWithOtp: signInWithOtpMock
      }
    } as unknown as ReturnType<typeof browserSupabaseModule.createBrowserClient>);

    const { container } = render(React.createElement(LoginPage));

    const emailInputs = container.querySelectorAll('input[type="email"]');
    expect(emailInputs).toHaveLength(1);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0].textContent).toContain('Получить ссылку для входа');

    fireEvent.change(emailInputs[0], { target: { value: 'kari@norsklive.no' } });
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(signInWithOtpMock).toHaveBeenCalledTimes(1);
    });

    const callArg = signInWithOtpMock.mock.calls[0][0];
    expect(callArg.email).toBe('kari@norsklive.no');
    expect(callArg.options?.emailRedirectTo).toMatch(/\/auth\/callback$/);

    await waitFor(() => {
      expect(
        screen.getByText(
          'Мы отправили ссылку на kari@norsklive.no. Откройте письмо на этом устройстве.'
        )
      ).toBeDefined();
    });
  });

  it('6. TopBar shows signed-in email and Выйти form when authEnabled is true, and nothing extra when false', () => {
    const noop = () => {};
    const { rerender } = render(
      React.createElement(TopBar, {
        currentModule: 'norskprove',
        l1Lang: 'ru',
        userLevel: 'B1',
        authEnabled: false,
        userEmail: 'kari@norsklive.no',
        onSwitchModule: noop,
        onChangeL1Lang: noop,
        onChangeUserLevel: noop
      })
    );

    expect(screen.queryByText('Выйти')).toBeNull();

    rerender(
      React.createElement(TopBar, {
        currentModule: 'norskprove',
        l1Lang: 'ru',
        userLevel: 'B1',
        authEnabled: true,
        userEmail: 'kari@norsklive.no',
        onSwitchModule: noop,
        onChangeL1Lang: noop,
        onChangeUserLevel: noop
      })
    );

    expect(screen.getByText('kari@norsklive.no')).toBeDefined();
    const signOutBtn = screen.getByRole('button', { name: 'Выйти' });
    expect(signOutBtn.closest('form')?.getAttribute('action')).toBe('/auth/signout');
    expect(signOutBtn.closest('form')?.getAttribute('method')).toBe('post');
  });
});
