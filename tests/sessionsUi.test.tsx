// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { StudioPage } from '../src/components/studio/StudioPage';
import { PathHome } from '../src/components/path/PathHome';
import * as coachClient from '../src/lib/coachClient';
import * as speechModule from '../src/lib/speech';
import { writePathPrefs } from '../src/lib/path/storage';

describe('M1b-2b-2 UI tests: session restore, daily-limit card, #plans block, and FirstRun step 1 greeting', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(speechModule, 'speakNorwegian').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('restores 3 exchanges and latest CorrectionCard from GET /api/sessions/current when authEnabled=true', async () => {
    const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/api/sessions/current')) {
        return new Response(
          JSON.stringify({
            session: {
              id: 'sess-restored-1',
              user_id: 'user-a',
              module: 'norskprove',
              scenario_id: 'np-b1b2-velferd-hjemmekontor',
              level: 'B1',
              started_at: '2026-09-28T10:00:00Z'
            },
            turns: [
              {
                id: 1,
                role: 'user',
                text: 'Første svar fra meg.',
                created_at: '2026-09-28T10:01:00Z'
              },
              {
                id: 2,
                role: 'ai',
                text: 'Første oppfølging fra sensor.',
                correction_json: {
                  original: 'Første svar fra meg.',
                  natural_bokmal: 'Mitt første svar.',
                  b2_upgrade: 'Min innledende vurdering.',
                  grammar_rule_l1: 'Первое правило.',
                  cefr_estimate: 'B1',
                  v2_status: '✓ Korrekt V2',
                  samhandling_status: 'Активный диалог'
                },
                created_at: '2026-09-28T10:01:05Z'
              },
              {
                id: 3,
                role: 'user',
                text: 'Andre svar om hjemmekontor.',
                created_at: '2026-09-28T10:02:00Z'
              },
              {
                id: 4,
                role: 'ai',
                text: 'Andre oppfølging fra sensor.',
                correction_json: {
                  original: 'Andre svar om hjemmekontor.',
                  natural_bokmal: 'Et annet svar om hjemmekontor.',
                  b2_upgrade: 'Et ytterligere argument om fjernarbeid.',
                  grammar_rule_l1: 'Второе правило.',
                  cefr_estimate: 'B1+',
                  v2_status: '✓ Korrekt V2',
                  samhandling_status: 'Активный диалог'
                },
                created_at: '2026-09-28T10:02:05Z'
              },
              {
                id: 5,
                role: 'user',
                text: 'Tredje svar om arbeidsmiljø.',
                created_at: '2026-09-28T10:03:00Z'
              },
              {
                id: 6,
                role: 'ai',
                text: 'Tredje oppfølging fra sensor.',
                correction_json: {
                  original: 'Tredje svar om arbeidsmiljø.',
                  natural_bokmal: 'Det tredje svaret handler om arbeidsmiljø.',
                  b2_upgrade: 'Det tredje perspektivet belyser psykososialt arbeidsmiljø.',
                  grammar_rule_l1: 'Третье правило из сохранённой сессии.',
                  cefr_estimate: 'B2',
                  v2_status: '✓ Korrekt V2',
                  samhandling_status: 'Активный диалог'
                },
                created_at: '2026-09-28T10:03:05Z'
              }
            ]
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(null, { status: 204 });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<StudioPage authEnabled={true} userEmail="kari@norsklive.no" />);

    await waitFor(() => {
      expect(screen.getByText('Første svar fra meg.')).toBeTruthy();
      expect(screen.getByText('Andre svar om hjemmekontor.')).toBeTruthy();
      expect(screen.getByText('Tredje svar om arbeidsmiljø.')).toBeTruthy();
      expect(screen.getByText('Tredje oppfølging fra sensor.')).toBeTruthy();
    });

    // Latest AI turn's correction_json feeds CorrectionCard in #chatStream
    const chatStream = document.getElementById('chatStream')!;
    expect(within(chatStream).getByText('Третье правило из сохранённой сессии.')).toBeTruthy();
    expect(
      within(chatStream).getByText('Det tredje perspektivet belyser psykososialt arbeidsmiljø.')
    ).toBeTruthy();
  }, 15000);

  it('shows the daily-limit card with exact N, M, and limit when QuotaExceededError is thrown, disables mic/send/input, and «Вернусь завтра» closes the card while keeping history visible', async () => {
    let callCount = 0;
    vi.spyOn(coachClient, 'postCoach').mockImplementation(async () => {
      callCount++;
      if (callCount <= 2) {
        return {
          reply_norsk: `Svar nummer ${callCount}`,
          reply_l1: `Ответ ${callCount}`,
          correction: {
            original: `Setning ${callCount}`,
            natural_bokmal: `Naturlig setning ${callCount}`,
            b2_upgrade: `B2 setning ${callCount}`,
            grammar_rule_l1: `Правило ${callCount}`,
            cefr_estimate: 'B1',
            v2_status: '✓ Korrekt V2',
            samhandling_status: 'Активный диалог'
          },
          next_hints: []
        };
      }
      throw new coachClient.QuotaExceededError(20, 'free');
    });

    render(<StudioPage authEnabled={false} />);

    const input = document.getElementById('userSpeechInput') as HTMLInputElement;
    const sendBtn = document.getElementById('sendSpeechBtn') as HTMLButtonElement;
    const micBtn = document.getElementById('micToggleBtn') as HTMLButtonElement;

    // Send 2 successful replies
    fireEvent.change(input, { target: { value: 'Setning 1' } });
    fireEvent.click(sendBtn);
    await waitFor(() => expect(screen.getByText('Svar nummer 1')).toBeTruthy());

    fireEvent.change(input, { target: { value: 'Setning 2' } });
    fireEvent.click(sendBtn);
    await waitFor(() => expect(screen.getByText('Svar nummer 2')).toBeTruthy());

    // 3rd attempt hits QuotaExceededError(20, 'free')
    fireEvent.change(input, { target: { value: 'Setning 3 over kvote' } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'На сегодня бесплатные ответы закончились' })
      ).toBeTruthy();
    });

    expect(
      screen.getByText(
        'Вы сделали 2 реплики и разобрали 2 ошибки. Лимит бесплатного плана — 20 в день, завтра снова доступно.'
      )
    ).toBeTruthy();

    const plansLink = screen.getByRole('link', { name: 'Посмотреть подписку' });
    expect(plansLink.getAttribute('href')).toBe('/path#plans');

    // Mic, input, and send button are disabled with hint «Лимит на сегодня исчерпан»
    expect(micBtn.disabled).toBe(true);
    expect(input.disabled).toBe(true);
    expect(sendBtn.disabled).toBe(true);
    expect(document.getElementById('micStatusText')?.textContent).toBe(
      'Лимит на сегодня исчерпан'
    );

    // Clicking «Вернусь завтра» closes the card while keeping history visible and inputs disabled
    fireEvent.click(screen.getByRole('button', { name: 'Вернусь завтра' }));
    expect(
      screen.queryByRole('heading', { name: 'На сегодня бесплатные ответы закончились' })
    ).toBeNull();
    expect(screen.getByText('Svar nummer 1')).toBeTruthy();
    expect(screen.getByText('Svar nummer 2')).toBeTruthy();
    expect(micBtn.disabled).toBe(true);
  }, 15000);

  it('renders FirstRun step 1 greeting under Nora and #plans subscription block on PathHome', () => {
    render(<PathHome />);

    // FirstRun step 1 shows greeting under Nora
    expect(
      screen.getByText('Привет, я Нора. Три коротких вопроса, и начнём.')
    ).toBeTruthy();

    // Skip FirstRun and check #plans block on PathHome
    writePathPrefs({ onboarded: true });
    cleanup();
    render(<PathHome />);

    const plansSection = document.getElementById('plans');
    expect(plansSection).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Подписка' })).toBeTruthy();
    expect(
      screen.getByText('Месяц — 249 kr, 300 ответов в день. Оплата появится скоро.')
    ).toBeTruthy();
  });

  it('formats Russian plural forms (реплику/реплики/реплик, ошибку/ошибки/ошибок) for 1, 2, 5, 11, 21 and 22', async () => {
    const { formatCountRu } = await import('../src/lib/plural');
    const replika = { one: 'реплику', few: 'реплики', many: 'реплик' };
    const oshibka = { one: 'ошибку', few: 'ошибки', many: 'ошибок' };

    expect(formatCountRu(1, replika)).toBe('1 реплику');
    expect(formatCountRu(2, replika)).toBe('2 реплики');
    expect(formatCountRu(5, replika)).toBe('5 реплик');
    expect(formatCountRu(11, replika)).toBe('11 реплик');
    expect(formatCountRu(21, replika)).toBe('21 реплику');
    expect(formatCountRu(22, replika)).toBe('22 реплики');

    expect(formatCountRu(1, oshibka)).toBe('1 ошибку');
    expect(formatCountRu(2, oshibka)).toBe('2 ошибки');
    expect(formatCountRu(5, oshibka)).toBe('5 ошибок');
    expect(formatCountRu(11, oshibka)).toBe('11 ошибок');
    expect(formatCountRu(21, oshibka)).toBe('21 ошибку');
    expect(formatCountRu(22, oshibka)).toBe('22 ошибки');
  });
});
