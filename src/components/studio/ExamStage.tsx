'use client';

import type { ModuleKey, Scenario } from '../../content/scenarios';

export interface ExamStageProps {
  currentModule: ModuleKey;
  currentScenario: Scenario;
  examPart: number;
  onAdvanceExamPart?: () => void;
}

export function getExamStageMeta(currentScenario: Scenario, examPart: number) {
  const structure = currentScenario.examStructure;
  if (!structure) {
    return null;
  }
  if (examPart === 1) {
    return {
      stageLabel: '🎓 ЭТАП 1 (Individuell presentasjon — 2–3 мин): ',
      promptText: structure.part1Prompt,
      btnText: '⏭️ К Этапу 2 (Дебаты с Medkandidat)'
    };
  }
  if (examPart === 2) {
    return {
      stageLabel: '🗣️ ЭТАП 2 (Samhandling — Диалог с напарником 5–7 мин): ',
      promptText: structure.part2Prompt,
      btnText: '⏭️ К Этапу 3 (Вопросы Sensor HK-dir)'
    };
  }
  return {
    stageLabel: '🏛️ ЭТАП 3 (Каверзные вопросы экзаменатора HK-dir): ',
    promptText: structure.part3Prompt,
    btnText: '✅ Завершить и скачать вердикт HK-dir'
  };
}

export function ExamStage({
  currentModule,
  currentScenario,
  examPart
}: ExamStageProps) {
  if (currentModule !== 'norskprove' || !currentScenario.examStructure) {
    return null;
  }

  const meta = getExamStageMeta(currentScenario, examPart);
  if (!meta) return null;

  return (
    <div
      id="examBanner"
      style={{
        background: 'rgba(99,102,241,0.14)',
        borderBottom: '1px solid rgba(99,102,241,0.35)',
        padding: '10px 18px',
        fontSize: '0.81rem'
      }}
    >
      <strong style={{ color: '#a5b4fc' }} id="examStageLabel">
        {meta.stageLabel}
      </strong>
      <span id="examPromptText">{meta.promptText}</span>
    </div>
  );
}
