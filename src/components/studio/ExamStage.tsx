'use client';

import { Clock } from 'lucide-react';
import type { ModuleKey, Scenario } from '../../content/scenarios';

export interface ExamStageProps {
  currentModule: ModuleKey;
  currentScenario: Scenario;
  examPart: number;
}

export function ExamStage({
  currentModule,
  currentScenario,
  examPart
}: ExamStageProps) {
  if (currentModule !== 'norskprove' || !currentScenario.examStructure) {
    return (
      <div
        className="exam-stage-banner"
        id="examStageBanner"
        style={{ display: 'none' }}
      />
    );
  }

  let stageLabel = 'ЭТАП 1: Монолог (Presentasjon · 2–3 мин)';
  let promptText = currentScenario.examStructure.part1Prompt;
  if (examPart === 2) {
    stageLabel = 'ЭТАП 2: Дискуссия (Samtale · 5–6 мин)';
    promptText = currentScenario.examStructure.part2Prompt;
  } else if (examPart === 3) {
    stageLabel = 'ЭТАП 3: Углублённые вопросы (Oppfølging)';
    promptText = currentScenario.examStructure.part3Prompt;
  }

  return (
    <div className="exam-stage-banner" id="examStageBanner">
      <div className="exam-stage-title t-caption" id="examStageLabel">
        <Clock size={20} strokeWidth={1.75} color="currentColor" aria-hidden="true" />
        <span>{stageLabel}</span>
      </div>
      <div className="exam-prompt-text t-speech" id="examPromptText">
        {promptText}
      </div>
    </div>
  );
}
