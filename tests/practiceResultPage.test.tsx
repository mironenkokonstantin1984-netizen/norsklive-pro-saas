// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import PracticeResultPage from '../src/app/practice/result/page';
import {
  savePracticeResult,
  clearPracticeResult,
  type PracticeResultData
} from '../src/lib/practice/resultData';

const mockReplace = vi.fn();
const mockRouter = {
  replace: mockReplace,
  push: vi.fn()
};
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter
}));

describe('/practice/result page (Issue #54)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockReplace.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('redirects to / if there is no finished session', () => {
    clearPracticeResult();

    render(<PracticeResultPage />);

    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('renders ResultScreen when a finished session exists in storage', () => {
    const sampleResult: PracticeResultData = {
      id: 'session-123',
      scenarioId: 'arbeid-1',
      scenarioTitle: 'Интервью',
      module: 'norskprove',
      isExam: false,
      completedAt: '2026-10-14T19:00:00.000Z',
      learnerTurnCount: 3,
      hasEnoughData: true,
      criteria: {
        uttale: 'B1',
        ordforrad: 'B1',
        grammatikk: 'B1',
        samhandling: 'B1'
      },
      improvements: [],
      stumbledWords: [],
      turns: []
    };

    savePracticeResult(sampleResult);

    render(<PracticeResultPage />);

    expect(screen.getByTestId('practiceResultScreen')).toBeTruthy();
    expect(screen.getByText('Интервью · Итог')).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
