// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { StudioPage } from '../src/components/studio/StudioPage';
import { ScenarioPanel } from '../src/components/studio/ScenarioPanel';
import { VACANCY_MAX_CHARS } from '../src/components/studio/useStudioState';
import { scenariosByModule } from '../src/content/scenarios';
import { CoachRequestSchema, TargetWordSchema } from '../src/server/schemas';

/** Claims about a CV or an analysed listing that nobody gave us, and the site we must not scrape. */
const FORBIDDEN = [
  /finn\.no/i,
  /\bdin cv\b/i,
  /\bditt cv\b/i,
  /\byour cv\b/i,
  /tvo[её] cv/i,
  /резюме/i,
  /logistikk/i,
  /b2b-salg/i,
  /ai-automatisering/i,
  /har analysert/i
];

function filesUnder(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? filesUnder(full) : [full];
  });
}

const REPLY = {
  reply_norsk: 'Takk! Hva likte du best i den forrige jobben din?',
  reply_l1: 'Спасибо! Что вам больше всего нравилось на прошлой работе?',
  correction: {
    original: 'Jeg heter Anna.',
    natural_bokmal: 'Jeg heter Anna.',
    b2_upgrade: 'Jeg heter Anna.',
    grammar_rule_l1: 'Всё верно.',
    cefr_estimate: 'A2',
    v2_status: 'Korrekt V2'
  },
  next_hints: []
};

describe('#47 neutral job interview', () => {
  test('no user-visible content, prompt or fallback text claims a CV or an analysed listing', () => {
    const root = path.resolve(__dirname, '..');
    const files = [
      ...filesUnder(path.join(root, 'src/content')),
      ...filesUnder(path.join(root, 'src/components')),
      ...filesUnder(path.join(root, 'src/server'))
    ];
    const hits: string[] = [];
    for (const file of files) {
      const text = fs.readFileSync(file, 'utf8');
      for (const pattern of FORBIDDEN) {
        if (pattern.test(text)) hits.push(`${path.relative(root, file)}: ${pattern}`);
      }
    }
    expect(hits).toEqual([]);
  });

  test('two neutral A2–B1 interview scenarios with valid data', () => {
    const interviews = scenariosByModule.jobbintervju.filter((sc) =>
      sc.id.startsWith('jobb-intervju-')
    );
    expect(interviews.map((sc) => sc.title)).toEqual([
      'Intervju: fortell om deg selv og erfaring',
      'Intervju: hvorfor vil du jobbe hos oss?'
    ]);
    for (const sc of interviews) {
      expect(sc.level).toBe('A2–B1');
      expect(sc.openingLine.startsWith('Hei og velkommen!')).toBe(true);
      expect(sc.sourceText.length).toBeGreaterThan(0);
      expect(sc.targetWords).toHaveLength(6);
      for (const word of sc.targetWords) {
        expect(TargetWordSchema.safeParse(word).success).toBe(true);
        expect(word.translation && word.ua && word.en).toBeTruthy();
      }
      expect(sc.description).toMatch(/[а-яё]/i);
    }
    expect(scenariosByModule.jobbintervju.some((sc) => sc.id === 'jobb-b2b-logistikk-ai')).toBe(
      false
    );
  });
});

describe('#47 vacancy field', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    cleanup();
  });

  test('the panel shows the optional vacancy field with a privacy note, only in Jobbintervju', () => {
    const onApplyVacancy = vi.fn();
    const props = {
      scenarios: scenariosByModule.jobbintervju,
      currentScenario: scenariosByModule.jobbintervju[0],
      onSelectScenario: vi.fn(),
      onApplyCustomSource: vi.fn(),
      onApplyVacancy
    };
    const { getByLabelText, getByText, getByRole, rerender, container } = render(
      <ScenarioPanel currentModule="jobbintervju" {...props} />
    );

    const field = getByLabelText('Вставьте текст вакансии (по желанию)') as HTMLTextAreaElement;
    expect(field.maxLength).toBe(VACANCY_MAX_CHARS);
    expect(getByText(/Текст не сохраняется/)).toBeTruthy();
    expect(field.getAttribute('aria-describedby')).toBe('vacancyPrivacyNote');

    const start = getByRole('button', { name: 'Начать интервью по этой вакансии' });
    expect((start as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(field, { target: { value: '  Vi søker en kokk til kantina vår.  ' } });
    expect(container.querySelector('.vacancy-count')?.textContent).toBe(
      `37 / ${VACANCY_MAX_CHARS}`
    );
    fireEvent.click(start);
    expect(onApplyVacancy).toHaveBeenCalledWith('Vi søker en kokk til kantina vår.');

    rerender(
      <ScenarioPanel
        currentModule="norskprove"
        {...props}
        scenarios={scenariosByModule.norskprove}
        currentScenario={scenariosByModule.norskprove[0]}
      />
    );
    expect(container.querySelector('#vacancyTextarea')).toBeNull();
  });

  test('a pasted vacancy becomes the interview context sent to the coach', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => REPLY
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
    const vacancy = 'Vi søker en blid medarbeider til bakeriet vårt. Du må kunne jobbe tidlig.';

    const { container, getByLabelText, getByRole } = render(<StudioPage />);
    fireEvent.click(container.querySelector('button[data-module="jobbintervju"]') as HTMLElement);
    expect(container.querySelector('#chatStream .msg-ai')?.textContent).toContain(
      'Kan du fortelle litt om deg selv og hva slags jobb du søker?'
    );

    fireEvent.change(getByLabelText('Вставьте текст вакансии (по желанию)'), {
      target: { value: vacancy }
    });
    fireEvent.click(getByRole('button', { name: 'Начать интервью по этой вакансии' }));
    expect(container.querySelector('#chatStream .msg-ai')?.textContent).toContain(
      'Takk for at du søkte på denne stillingen.'
    );

    fireEvent.change(container.querySelector('#userSpeechInput') as HTMLInputElement, {
      target: { value: 'Jeg heter Anna.' }
    });
    fireEvent.click(container.querySelector('#sendSpeechBtn') as HTMLButtonElement);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const coachCall = fetchMock.mock.calls.find(([url]) => String(url).includes('/api/coach'));
    const body = JSON.parse(String(coachCall?.[1]?.body));
    expect(body.module).toBe('jobbintervju');
    expect(body.customScenario.sourceText).toBe(vacancy);
    expect(body.customScenario.targetWords).toHaveLength(6);
    expect(CoachRequestSchema.safeParse(body).success).toBe(true);
  });
});
