'use client';

import { useEffect, useReducer, useCallback } from 'react';
import {
  scenariosByModule,
  type ModuleKey,
  type Scenario,
  type ScenariosByModule,
  type TargetWord
} from '../../content/scenarios';
import { speakNorwegian } from '../../lib/speech';

export type L1Language = 'ru' | 'ua' | 'en';
export type CefrLevel = 'A2' | 'B1' | 'B2';
export type AgentPersona = 'standard' | 'interrupting' | 'passive';

export interface GlossaryItem {
  word: string;
  translation: string;
  example?: string;
}

export interface StudioState {
  currentModule: ModuleKey;
  scenarios: ScenariosByModule;
  currentScenario: Scenario;
  l1Lang: L1Language;
  userLevel: CefrLevel;
  agentPersona: AgentPersona;
  examPart: number;
  usedWords: string[];
  savedGlossary: GlossaryItem[];
  blurMode: boolean;
  timerSeconds: number;
}

export type StudioAction =
  | { type: 'SWITCH_MODULE'; module: ModuleKey }
  | { type: 'SELECT_SCENARIO'; scenario: Scenario }
  | { type: 'SET_L1_LANG'; l1Lang: L1Language }
  | { type: 'SET_USER_LEVEL'; userLevel: CefrLevel }
  | { type: 'SET_AGENT_PERSONA'; agentPersona: AgentPersona }
  | { type: 'TOGGLE_BLUR_MODE' }
  | { type: 'SET_EXAM_PART'; examPart: number }
  | { type: 'RESTART_SESSION' }
  | { type: 'TICK_TIMER' }
  | { type: 'APPLY_CUSTOM_SCENARIO'; scenario: Scenario }
  | { type: 'LOAD_GLOSSARY'; items: GlossaryItem[] }
  | { type: 'SAVE_TO_GLOSSARY'; item: GlossaryItem }
  | { type: 'MARK_WORD_USED'; word: string };

export const initialStudioState: StudioState = {
  currentModule: 'norskprove',
  scenarios: {
    norskprove: [...scenariosByModule.norskprove],
    jobbintervju: [...scenariosByModule.jobbintervju],
    pensum: [...scenariosByModule.pensum]
  },
  currentScenario: scenariosByModule.norskprove[0],
  l1Lang: 'ru',
  userLevel: 'B1',
  agentPersona: 'standard',
  examPart: 1,
  usedWords: [],
  savedGlossary: [],
  blurMode: false,
  timerSeconds: 0
};

export function studioReducer(state: StudioState, action: StudioAction): StudioState {
  switch (action.type) {
    case 'SWITCH_MODULE': {
      const moduleList = state.scenarios[action.module] || [];
      const firstScenario = moduleList[0] || state.currentScenario;
      return {
        ...state,
        currentModule: action.module,
        currentScenario: firstScenario,
        usedWords: [],
        examPart: 1,
        timerSeconds: 0
      };
    }
    case 'SELECT_SCENARIO': {
      return {
        ...state,
        currentScenario: action.scenario,
        usedWords: [],
        examPart: 1,
        timerSeconds: 0
      };
    }
    case 'SET_L1_LANG':
      return { ...state, l1Lang: action.l1Lang };
    case 'SET_USER_LEVEL':
      return { ...state, userLevel: action.userLevel };
    case 'SET_AGENT_PERSONA':
      return { ...state, agentPersona: action.agentPersona };
    case 'TOGGLE_BLUR_MODE':
      return { ...state, blurMode: !state.blurMode };
    case 'SET_EXAM_PART':
      return { ...state, examPart: action.examPart };
    case 'RESTART_SESSION':
      return {
        ...state,
        usedWords: [],
        examPart: 1,
        timerSeconds: 0
      };
    case 'TICK_TIMER':
      return { ...state, timerSeconds: state.timerSeconds + 1 };
    case 'APPLY_CUSTOM_SCENARIO': {
      const updatedModuleList = [
        action.scenario,
        ...(state.scenarios[state.currentModule] || [])
      ];
      return {
        ...state,
        scenarios: {
          ...state.scenarios,
          [state.currentModule]: updatedModuleList
        },
        currentScenario: action.scenario,
        usedWords: [],
        examPart: 1,
        timerSeconds: 0
      };
    }
    case 'LOAD_GLOSSARY':
      return { ...state, savedGlossary: action.items };
    case 'SAVE_TO_GLOSSARY': {
      if (state.savedGlossary.some((x) => x.word === action.item.word)) {
        return state;
      }
      return {
        ...state,
        savedGlossary: [action.item, ...state.savedGlossary]
      };
    }
    case 'MARK_WORD_USED': {
      const normalized = action.word.toLowerCase();
      if (state.usedWords.includes(normalized)) {
        return state;
      }
      return {
        ...state,
        usedWords: [...state.usedWords, normalized]
      };
    }
    default:
      return state;
  }
}

export function getL1Text(
  obj: { translation?: string; ru?: string; ua?: string; en?: string } | null | undefined,
  l1Lang: L1Language,
  ruKey: 'translation' | 'ru' = 'translation'
): string {
  if (!obj) return '';
  if (l1Lang === 'ua' && obj.ua) return obj.ua;
  if (l1Lang === 'en' && obj.en) return obj.en;
  return obj[ruKey] || obj.ru || obj.translation || '';
}

export function buildCustomScenarioFromText(raw: string, userLevel: CefrLevel): Scenario {
  const tokens = raw
    .replace(/[.,!?;:()"«»]/g, ' ')
    .split(/[\s,;\n]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 4);

  const uniqueWords = [...new Set(tokens)].slice(0, 10);
  const targetWords: TargetWord[] = uniqueWords.map((w) => ({
    word: w.toLowerCase(),
    translation: 'Целевое слово из твоего списка / вакансии',
    ua: 'Цільове слово з твого списку / вакансії',
    en: 'Target word from your custom list / job ad',
    example: `Det er viktig å fokusere på ${w.toLowerCase()} i denne situasjonen.`
  }));

  const resolvedTargets =
    targetWords.length > 0 ? targetWords : scenariosByModule.norskprove[0].targetWords;

  return {
    id: 'custom-' + Date.now(),
    title: '⚡ Кастомный тренажёр: ' + raw.slice(0, 34) + '...',
    level: userLevel,
    badge: '🛡️ Kopinor-Safe Custom',
    avatar: '🎯',
    partnerName: 'AI Sparringpartner (Персональный сценарий)',
    partnerRole: 'Динамический телесуфлёр по твоим словам и источнику',
    description: raw.slice(0, 130),
    sourceText: raw,
    targetWords: resolvedTargets,
    openingLine: `Jeg har lagt inn dine ${targetWords.length} målord i teleprompteren! La oss starte rollespillet. Hvordan vil du bruke «${(targetWords[0] && targetWords[0].word) || 'arbeidsmiljø'}» for å beskrive din erfaring eller mening her?`,
    openingTranslation: `Я загрузил твои целевые слова (${targetWords.length} шт.) в телесуфлёр! Давай начнём ролевую тренировку. Как ты используешь первое слово в своём ответе?`,
    openingUa: `Я завантажив твої цільові слова (${targetWords.length} шт.) у телесуфлер! Давай почнемо рольове тренування.`,
    openingEn: `I loaded your ${targetWords.length} target words into the teleprompter! Let us begin the roleplay.`,
    hints: [
      {
        label: 'Использовать слово №1 + №2 (B1/B2)',
        norsk: `Det er avgjørende å ta hensyn til ${(targetWords[0] && targetWords[0].word) || 'dette'}, spesielt i kombinasjon med ${(targetWords[1] && targetWords[1].word) || 'praksis'}.`,
        ru: 'Критически важно учитывать первое понятие, особенно в сочетании со вторым.',
        ua: 'Критично важливо враховувати перше поняття, особливо в поєднанні з другим.',
        en: 'It is crucial to consider the first concept, especially in combination with the second.'
      }
    ]
  };
}

export function useStudioState() {
  const [state, dispatch] = useReducer(studioReducer, initialStudioState);

  // Load saved glossary from localStorage on client mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('norsklive_glossary');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          dispatch({ type: 'LOAD_GLOSSARY', items: parsed });
        }
      }
    } catch {
      // Ignore invalid JSON in localStorage
    }
  }, []);

  // Session timer interval
  useEffect(() => {
    const intervalId = setInterval(() => {
      dispatch({ type: 'TICK_TIMER' });
    }, 1000);
    return () => clearInterval(intervalId);
  }, [state.currentModule, state.currentScenario.id]);

  const switchModule = useCallback(
    (module: ModuleKey) => {
      dispatch({ type: 'SWITCH_MODULE', module });
      const nextScenario = state.scenarios[module]?.[0];
      if (nextScenario) {
        speakNorwegian(nextScenario.openingLine);
      }
    },
    [state.scenarios]
  );

  const selectScenario = useCallback((scenario: Scenario) => {
    dispatch({ type: 'SELECT_SCENARIO', scenario });
    speakNorwegian(scenario.openingLine);
  }, []);

  const setL1Lang = useCallback((l1Lang: L1Language) => {
    dispatch({ type: 'SET_L1_LANG', l1Lang });
  }, []);

  const setUserLevel = useCallback((userLevel: CefrLevel) => {
    dispatch({ type: 'SET_USER_LEVEL', userLevel });
  }, []);

  const setAgentPersona = useCallback((agentPersona: AgentPersona) => {
    dispatch({ type: 'SET_AGENT_PERSONA', agentPersona });
  }, []);

  const toggleBlurMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_BLUR_MODE' });
  }, []);

  const restartSession = useCallback(() => {
    dispatch({ type: 'RESTART_SESSION' });
    speakNorwegian(state.currentScenario.openingLine);
  }, [state.currentScenario]);

  const applyCustomSource = useCallback(
    (rawText: string) => {
      const trimmed = rawText.trim();
      if (!trimmed) return;
      const customScenario = buildCustomScenarioFromText(trimmed, state.userLevel);
      dispatch({ type: 'APPLY_CUSTOM_SCENARIO', scenario: customScenario });
      speakNorwegian(customScenario.openingLine);
    },
    [state.userLevel]
  );

  const saveToGlossary = useCallback(
    (word: string, translation: string, example?: string) => {
      if (state.savedGlossary.some((x) => x.word === word)) return;
      const newItem: GlossaryItem = { word, translation, example };
      const updated = [newItem, ...state.savedGlossary];
      dispatch({ type: 'SAVE_TO_GLOSSARY', item: newItem });
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('norsklive_glossary', JSON.stringify(updated));
        } catch {
          // Ignore storage quota errors
        }
      }
    },
    [state.savedGlossary]
  );

  const markWordUsed = useCallback((word: string) => {
    dispatch({ type: 'MARK_WORD_USED', word });
  }, []);

  const exportReportAndGlossary = useCallback(() => {
    if (typeof window === 'undefined') return;
    const sc = state.currentScenario;
    const lines = [
      `# 🇳🇴 NorskLive Pro — HK-dir & R&D Rapport (${new Date().toLocaleDateString()})`,
      `**Концепт:** ${state.currentModule.toUpperCase()} | **Сценарий:** ${sc ? sc.title : ''}`,
      `**Язык L1 микро-коррекций:** ${state.l1Lang.toUpperCase()} | **Оценка уровня:** Уровень: B1+`,
      `**Активный словарь (Bingo):** ${state.usedWords.length} из ${(sc && sc.targetWords.length) || 0}`,
      ``,
      `## 1. Использованные целевые слова (Bingo)`,
      ...state.usedWords.map((w) => `- ✓ **${w}**`),
      ``,
      `## 2. Личный словарь (Min Ordbok)`,
      ...state.savedGlossary.map((g) => `- **${g.word}** — ${g.translation} (*«${g.example || ''}»*)`)
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `NorskLive-HKdir-Report-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
  }, [state.currentModule, state.currentScenario, state.l1Lang, state.usedWords, state.savedGlossary]);

  const advanceExamPart = useCallback(() => {
    const sc = state.currentScenario;
    if (state.examPart < 3) {
      const nextPart = state.examPart + 1;
      dispatch({ type: 'SET_EXAM_PART', examPart: nextPart });
      if (sc?.examStructure) {
        const nextPrompt =
          nextPart === 2 ? sc.examStructure.part2Prompt : sc.examStructure.part3Prompt;
        speakNorwegian(nextPrompt);
      }
    } else {
      exportReportAndGlossary();
    }
  }, [state.currentScenario, state.examPart, exportReportAndGlossary]);

  return {
    state,
    dispatch,
    switchModule,
    selectScenario,
    setL1Lang,
    setUserLevel,
    setAgentPersona,
    toggleBlurMode,
    restartSession,
    applyCustomSource,
    saveToGlossary,
    markWordUsed,
    exportReportAndGlossary,
    advanceExamPart
  };
}
