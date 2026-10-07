// @vitest-environment jsdom
import React from 'react';
import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ChatPanel } from '../src/components/studio/ChatPanel';
import { ScenarioPanel } from '../src/components/studio/ScenarioPanel';
import { a2Scenarios } from '../src/content/scenarios/a2';
import { b1Scenarios } from '../src/content/scenarios/b1';
import { DRAFT_SCENARIO_LABEL } from '../src/content/scenarios/visibility';
import type { ChatMessage } from '../src/components/studio/useStudioState';

describe('Scenario UI & Picture Task rendering (Issue #50)', () => {
  const dummyHistory: ChatMessage[] = [
    {
      sender: 'ai',
      norsk: 'Se på bildet og beskriv hva du ser.',
      l1: 'Посмотрите на картинку и опишите, что вы видите.',
      time: '10:00'
    }
  ];

  test('ChatPanel renders scenario image above examiner line for picture task', () => {
    const pictureScenario = b1Scenarios.find((s) => s.part === 'picture')!;
    expect(pictureScenario.image).toBeDefined();

    const { container, getByTestId } = render(
      <ChatPanel
        chatHistory={dummyHistory}
        coachingHistory={[]}
        partnerName="Sensor Kari"
        l1Lang="ru"
        blurMode={false}
        isThinking={false}
        onSpeak={() => {}}
        onSaveToGlossary={() => {}}
        scenarioImage={pictureScenario.image}
      />
    );

    const imageWrapper = getByTestId('scenarioImageWrapper');
    expect(imageWrapper).toBeTruthy();

    const img = imageWrapper.querySelector('img');
    expect(img).toBeTruthy();
    expect(img?.getAttribute('src')).toBe(pictureScenario.image?.src);
    expect(img?.getAttribute('alt')).toBe(pictureScenario.image?.alt_nb);

    // Image wrapper is inside msg-ai before speaker name
    const msgAi = container.querySelector('.msg-ai');
    expect(msgAi?.contains(imageWrapper)).toBe(true);
  });

  test('ChatPanel does not render image wrapper when scenarioImage is undefined', () => {
    const { container } = render(
      <ChatPanel
        chatHistory={dummyHistory}
        coachingHistory={[]}
        partnerName="Sensor Kari"
        l1Lang="ru"
        blurMode={false}
        isThinking={false}
        onSpeak={() => {}}
        onSaveToGlossary={() => {}}
        scenarioImage={undefined}
      />
    );

    expect(container.querySelector('[data-testid="scenarioImageWrapper"]')).toBeNull();
  });

  test('ScenarioPanel groups scenarios by HK-dir topics and shows draft badges', () => {
    const { container, getAllByTestId } = render(
      <ScenarioPanel
        currentModule="norskprove"
        scenarios={[...a2Scenarios, ...b1Scenarios]}
        currentScenario={b1Scenarios[0]}
        targetLevel="B1"
        showDrafts={true}
        onSelectScenario={() => {}}
        onApplyCustomSource={() => {}}
      />
    );

    const topicGroups = container.querySelectorAll('.scenario-topic-group');
    expect(topicGroups.length).toBe(7);

    const topicTitles = Array.from(container.querySelectorAll('.scenario-topic-title')).map(
      (el) => el.textContent?.trim()
    );
    expect(topicTitles).toEqual([
      'Arbeid',
      'Bolig',
      'Helse',
      'Familie',
      'Handel',
      'Transport',
      'Fritid'
    ]);

    const draftBadges = getAllByTestId('scenarioDraftLabel');
    expect(draftBadges.length).toBe(21); // 21 B1 scenarios
    expect(draftBadges[0].textContent).toContain(DRAFT_SCENARIO_LABEL);
  });

  test('ScenarioPanel filters by targetLevel A2 vs B1', () => {
    const { container, rerender } = render(
      <ScenarioPanel
        currentModule="norskprove"
        scenarios={[...a2Scenarios, ...b1Scenarios]}
        currentScenario={a2Scenarios[0]}
        targetLevel="A2"
        showDrafts={true}
        onSelectScenario={() => {}}
        onApplyCustomSource={() => {}}
      />
    );

    expect(container.querySelector('#scenarioCountBadge')?.textContent).toBe('21 сценария');
    expect(container.textContent).toContain('Norskprøve A2 · Del 1');
    expect(container.textContent).not.toContain('Norskprøve B1 · Del 1');

    rerender(
      <ScenarioPanel
        currentModule="norskprove"
        scenarios={[...a2Scenarios, ...b1Scenarios]}
        currentScenario={b1Scenarios[0]}
        targetLevel="B1"
        showDrafts={true}
        onSelectScenario={() => {}}
        onApplyCustomSource={() => {}}
      />
    );

    expect(container.querySelector('#scenarioCountBadge')?.textContent).toBe('21 сценария');
    expect(container.textContent).toContain('Norskprøve B1 · Del 1');
    expect(container.textContent).not.toContain('Norskprøve A2 · Del 1');
  });
});
