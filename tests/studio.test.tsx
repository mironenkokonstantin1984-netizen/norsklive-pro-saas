// @vitest-environment jsdom
import React from 'react';
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { StudioPage } from '../src/components/studio/StudioPage';

describe('StudioPage (/studio) M1a-2 UI & State', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  test('1. Switching module shows that module’s scenarios', () => {
    const { container, getByText } = render(<StudioPage />);

    // Default module is norskprove
    expect(container.querySelector('#leftPanelTitle')?.textContent).toContain(
      'Norskprøve Muntlig'
    );
    expect(
      getByText(/Eksamen #1: Digitalisering, hjemmekontor og bærekraftig velferdsstat/)
    ).toBeTruthy();

    // Switch to jobbintervju
    const jobbTab = container.querySelector(
      'button[data-module="jobbintervju"]'
    ) as HTMLButtonElement;
    fireEvent.click(jobbTab);

    expect(container.querySelector('#leftPanelTitle')?.textContent).toContain(
      'Jobbintervju på norsk'
    );
    expect(
      getByText(/Intervju Case: Key Account Manager \/ Logistikk & AI-automasjon/)
    ).toBeTruthy();

    // Switch to pensum
    const pensumTab = container.querySelector(
      'button[data-module="pensum"]'
    ) as HTMLButtonElement;
    fireEvent.click(pensumTab);

    expect(container.querySelector('#leftPanelTitle')?.textContent).toContain(
      'CEFR Teleprompter'
    );
    expect(
      getByText(/CEFR B1 Modul: Fastlege, egenmelding og helsesystemet/)
    ).toBeTruthy();
  });

  test('2. Selecting a scenario renders its target words', () => {
    const { container, getByText } = render(<StudioPage />);

    // Select Eksamen #2 in norskprove
    const scenario2 = getByText(
      /Eksamen #2 \(UDI A2\/B1-krav\): Miljø, nærmiljø og frivillighet \(Dugnad\)/
    );
    fireEvent.click(scenario2);

    const bingoText = container.querySelector('#vocabBingoList')?.textContent || '';
    expect(bingoText).toContain('kildesortering');
    expect(bingoText).toContain('kollektivtransport');
    expect(bingoText).toContain('lokalsamfunn');
  });

  test('3. Applying custom text of "alpha beta gamma delta" creates target words', () => {
    const { container } = render(<StudioPage />);

    const textarea = container.querySelector(
      '#customSourceTextarea'
    ) as HTMLTextAreaElement;
    const applyBtn = container.querySelector(
      '#applyCustomSourceBtn'
    ) as HTMLButtonElement;

    fireEvent.change(textarea, { target: { value: 'alpha beta gamma delta' } });
    fireEvent.click(applyBtn);

    const bingoText = container.querySelector('#vocabBingoList')?.textContent || '';
    expect(bingoText).toContain('alpha');
    expect(bingoText).toContain('beta');
    expect(bingoText).toContain('gamma');
    expect(bingoText).toContain('delta');
    expect(container.querySelector('#vocabProgressText')?.textContent).toContain(
      '0 / 4 brukt'
    );
  });

  test('4. Saving a glossary item writes norsklive_glossary to localStorage', () => {
    const { container } = render(<StudioPage />);

    const firstChip = container.querySelector('#vocabBingoList .vocab-chip') as HTMLElement;
    expect(firstChip).toBeTruthy();
    fireEvent.click(firstChip);

    const rawStored = window.localStorage.getItem('norsklive_glossary');
    expect(rawStored).toBeTruthy();
    const parsed = JSON.parse(rawStored || '[]');
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(1);
    expect(parsed[0].word).toBe('å ta hensyn til');
    expect(container.querySelector('#savedWordsCount')?.textContent).toBe('1');
  });
});
