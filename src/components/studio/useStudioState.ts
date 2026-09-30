'use client';

import { useEffect, useReducer, useCallback, useRef } from 'react';
import {
  scenariosByModule,
  type ModuleKey,
  type Scenario,
  type ScenariosByModule,
  type TargetWord
} from '../../content/scenarios';
import type { Correction, Hint } from '../../server/schemas';
import {
  AuthRequiredError,
  CoachUnavailableError,
  QuotaExceededError,
  postCoach
} from '../../lib/coachClient';
import { speakNorwegian } from '../../lib/speech';
import { readPathPrefs } from '../../lib/path/storage';

export type L1Language = 'ru' | 'ua' | 'en';
export type CefrLevel = 'A2' | 'B1' | 'B2';
export type AgentPersona = 'standard' | 'interrupting' | 'passive';

export interface GlossaryItem {
  word: string;
  translation: string;
  example?: string;
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  norsk: string;
  l1?: string;
  time?: string;
  /** Canned example answer (COACH_ALLOW_FALLBACK), not a real AI reply. */
  isExample?: boolean;
}

/** The coach could not answer the learner's last message; the message stays in the chat. */
export interface CoachErrorInfo {
  text: string;
}

export interface HkdirScores {
  cefr: string;
  gram: string;
  arg: string;
}

export interface QuotaExceededInfo {
  limit: number;
  plan: string;
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
  chatHistory: ChatMessage[];
  coachingHistory: Correction[];
  hints: Hint[];
  isRecording: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  micStatusText: string;
  usedWordsToast: string;
  hkdirScores: HkdirScores;
  activeSpeech: { text: string; charIndex: number } | null;
  quotaExceeded: QuotaExceededInfo | null;
  limitCardDismissed: boolean;
  coachError: CoachErrorInfo | null;
}

export const DEFAULT_MIC_STATUS = 'Нажмите и говорите';

export const THINKING_MIC_STATUS = 'Экзаменатор отвечает';

export const DEFAULT_HKDIR_SCORES: HkdirScores = {
  cefr: 'B1+',
  gram: 'Ожидание реплики...',
  arg: 'Инициатива в диалоге'
};

export function getOpeningL1(scenario: Scenario, l1Lang: L1Language): string {
  if (l1Lang === 'ua') return scenario.openingUa || scenario.openingTranslation;
  if (l1Lang === 'en') return scenario.openingEn || scenario.openingTranslation;
  return scenario.openingTranslation;
}

export function createInitialChat(scenario: Scenario, l1Lang: L1Language): ChatMessage[] {
  return [
    {
      sender: 'ai',
      norsk: scenario.openingLine,
      l1: getOpeningL1(scenario, l1Lang),
      time: '12:00'
    }
  ];
}

export function buildReportMarkdown(state: StudioState): string {
  const sc = state.currentScenario;
  const lines = [
    `# 🇳🇴 NorskLive Pro — HK-dir & R&D Rapport (${new Date().toLocaleDateString()})`,
    `**Концепт:** ${state.currentModule.toUpperCase()} | **Сценарий:** ${sc ? sc.title : ''}`,
    `**Язык L1 микро-коррекций:** ${state.l1Lang.toUpperCase()} | **Оценка уровня:** Уровень: ${state.hkdirScores.cefr}`,
    `**Активный словарь (Bingo):** ${state.usedWords.length} из ${(sc && sc.targetWords.length) || 0}`,
    ``,
    `## 1. Трансформация фраз (A2 → B2) и L1 Микро-коррекции`,
    ...state.coachingHistory.map(
      (c, i) =>
        `### Реплика ${i + 1}\n- **Что сказал кандидат (${c.cefr_estimate}):** ${c.original}\n- **Naturlig Bokmål:** ${c.natural_bokmal}\n- **B2-Oppgradering:** ${c.b2_upgrade}\n- **L1 Разбор & Samhandling:** ${c.grammar_rule_l1}\n`
    ),
    `## 2. Личный словарь (Min Ordbok)`,
    ...state.savedGlossary.map(
      (g) => `- **${g.word}** — ${g.translation} (*«${g.example || ''}»*)`
    ),
    ``,
    `## 3. История диалога (Samtalelogg)`,
    ...state.chatHistory.map(
      (m) =>
        `- **${m.sender === 'ai' ? sc.partnerName : 'Кандидат'}:** ${m.norsk}${m.l1 ? ` (${m.l1})` : ''}`
    )
  ];
  return lines.join('\n');
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
  | { type: 'MARK_WORD_USED'; word: string }
  | { type: 'MARK_WORDS_USED'; words: string[]; toast: string }
  | { type: 'CLEAR_USED_WORDS_TOAST' }
  | { type: 'APPEND_MESSAGE'; message: ChatMessage }
  | { type: 'ADD_COACHING_CARD'; correction: Correction }
  | { type: 'SET_HINTS'; hints: Hint[] }
  | { type: 'SET_RECORDING'; isRecording: boolean }
  | { type: 'SET_SPEAKING'; isSpeaking: boolean }
  | { type: 'SET_THINKING'; isThinking: boolean }
  | { type: 'SET_MIC_STATUS'; text: string }
  | { type: 'SET_ACTIVE_SPEECH'; activeSpeech: { text: string; charIndex: number } | null }
  | {
      type: 'RESTORE_SESSION';
      session: {
        id: string;
        module: string;
        scenario_id: string;
        level: string;
      };
      turns: Array<{
        id?: number;
        role: 'user' | 'ai';
        text: string;
        correction_json?: unknown;
        created_at?: string;
      }>;
    }
  | { type: 'SET_QUOTA_EXCEEDED'; limit: number; plan: string }
  | { type: 'DISMISS_LIMIT_CARD' }
  | { type: 'SET_COACH_ERROR'; text: string }
  | { type: 'CLEAR_COACH_ERROR' };

const firstScenario = scenariosByModule.norskprove[0];

export const initialStudioState: StudioState = {
  currentModule: 'norskprove',
  scenarios: {
    norskprove: [...scenariosByModule.norskprove],
    jobbintervju: [...scenariosByModule.jobbintervju],
    pensum: [...scenariosByModule.pensum]
  },
  currentScenario: firstScenario,
  l1Lang: 'ru',
  userLevel: 'B1',
  agentPersona: 'standard',
  examPart: 1,
  usedWords: [],
  savedGlossary: [],
  blurMode: false,
  timerSeconds: 0,
  chatHistory: createInitialChat(firstScenario, 'ru'),
  coachingHistory: [],
  hints: [...(firstScenario.hints || [])],
  isRecording: false,
  isSpeaking: false,
  isThinking: false,
  micStatusText: DEFAULT_MIC_STATUS,
  usedWordsToast: '',
  hkdirScores: { ...DEFAULT_HKDIR_SCORES },
  activeSpeech: null,
  quotaExceeded: null,
  limitCardDismissed: false,
  coachError: null
};

function resetForScenario(
  state: StudioState,
  scenario: Scenario,
  module = state.currentModule
): StudioState {
  return {
    ...state,
    currentModule: module,
    currentScenario: scenario,
    usedWords: [],
    examPart: 1,
    timerSeconds: 0,
    chatHistory: createInitialChat(scenario, state.l1Lang),
    coachingHistory: [],
    hints: [...(scenario.hints || [])],
    isThinking: false,
    micStatusText: DEFAULT_MIC_STATUS,
    usedWordsToast: '',
    hkdirScores: { ...DEFAULT_HKDIR_SCORES },
    activeSpeech: null,
    coachError: null
  };
}

export function studioReducer(state: StudioState, action: StudioAction): StudioState {
  switch (action.type) {
    case 'SWITCH_MODULE': {
      const moduleList = state.scenarios[action.module] || [];
      const nextSc = moduleList[0] || state.currentScenario;
      return resetForScenario(state, nextSc, action.module);
    }
    case 'SELECT_SCENARIO':
      return resetForScenario(state, action.scenario);
    case 'SET_L1_LANG': {
      const updatedChat = state.chatHistory.map((m, idx) =>
        idx === 0 && m.sender === 'ai' && m.norsk === state.currentScenario.openingLine
          ? { ...m, l1: getOpeningL1(state.currentScenario, action.l1Lang) }
          : m
      );
      return {
        ...state,
        l1Lang: action.l1Lang,
        chatHistory: updatedChat
      };
    }
    case 'SET_USER_LEVEL':
      return { ...state, userLevel: action.userLevel };
    case 'SET_AGENT_PERSONA':
      return { ...state, agentPersona: action.agentPersona };
    case 'TOGGLE_BLUR_MODE':
      return { ...state, blurMode: !state.blurMode };
    case 'SET_EXAM_PART':
      return { ...state, examPart: action.examPart };
    case 'RESTART_SESSION':
      return resetForScenario(state, state.currentScenario);
    case 'TICK_TIMER':
      return { ...state, timerSeconds: state.timerSeconds + 1 };
    case 'APPLY_CUSTOM_SCENARIO': {
      const updatedModuleList = [action.scenario, ...(state.scenarios[state.currentModule] || [])];
      const nextState = resetForScenario(state, action.scenario);
      return {
        ...nextState,
        scenarios: {
          ...state.scenarios,
          [state.currentModule]: updatedModuleList
        }
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
    case 'MARK_WORDS_USED': {
      const merged = new Set(state.usedWords);
      action.words.forEach((w) => merged.add(w.toLowerCase()));
      return {
        ...state,
        usedWords: Array.from(merged),
        usedWordsToast: action.toast
      };
    }
    case 'CLEAR_USED_WORDS_TOAST':
      return { ...state, usedWordsToast: '' };
    case 'APPEND_MESSAGE':
      return {
        ...state,
        chatHistory: [...state.chatHistory, action.message]
      };
    case 'ADD_COACHING_CARD': {
      const corr = action.correction;
      return {
        ...state,
        coachingHistory: [corr, ...state.coachingHistory],
        hkdirScores: {
          cefr: corr.cefr_estimate || 'B1+',
          gram: corr.v2_status || 'Korrekt V2',
          arg: corr.samhandling_status || 'Активный диалог'
        }
      };
    }
    case 'SET_HINTS':
      return { ...state, hints: action.hints };
    case 'SET_RECORDING':
      return { ...state, isRecording: action.isRecording };
    case 'SET_SPEAKING':
      return { ...state, isSpeaking: action.isSpeaking };
    case 'SET_THINKING':
      return { ...state, isThinking: action.isThinking };
    case 'SET_MIC_STATUS':
      return { ...state, micStatusText: action.text };
    case 'SET_ACTIVE_SPEECH':
      return { ...state, activeSpeech: action.activeSpeech };
    case 'RESTORE_SESSION': {
      const mod =
        action.session.module === 'norskprove' ||
        action.session.module === 'jobbintervju' ||
        action.session.module === 'pensum'
          ? action.session.module
          : state.currentModule;
      const modScenarios = state.scenarios[mod] || [];
      const foundScenario =
        modScenarios.find((s) => s.id === action.session.scenario_id) ||
        modScenarios[0] ||
        state.currentScenario;

      const restoredMessages: ChatMessage[] = [
        ...createInitialChat(foundScenario, state.l1Lang),
        ...action.turns.map((t) => ({
          sender: t.role,
          norsk: t.text,
          time: t.created_at
            ? new Date(t.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })
            : '12:00'
        }))
      ];

      const restoredCorrections: Correction[] = [];
      for (const t of action.turns) {
        if (t.role === 'ai' && t.correction_json && typeof t.correction_json === 'object') {
          restoredCorrections.unshift(t.correction_json as Correction);
        }
      }

      const latestCorr = restoredCorrections[0];
      const nextScores: HkdirScores = latestCorr
        ? {
            cefr: latestCorr.cefr_estimate || state.hkdirScores.cefr,
            gram: latestCorr.v2_status || state.hkdirScores.gram,
            arg: latestCorr.samhandling_status || state.hkdirScores.arg
          }
        : state.hkdirScores;

      return {
        ...state,
        currentModule: mod,
        currentScenario: foundScenario,
        chatHistory: restoredMessages,
        coachingHistory: restoredCorrections,
        hkdirScores: nextScores
      };
    }
    case 'SET_QUOTA_EXCEEDED': {
      const lastMsg = state.chatHistory[state.chatHistory.length - 1];
      const trimmedChat =
        lastMsg && lastMsg.sender === 'user' ? state.chatHistory.slice(0, -1) : state.chatHistory;
      return {
        ...state,
        chatHistory: trimmedChat,
        isThinking: false,
        isRecording: false,
        quotaExceeded: {
          limit: action.limit,
          plan: action.plan
        },
        limitCardDismissed: false,
        micStatusText: 'Лимит на сегодня исчерпан'
      };
    }
    case 'DISMISS_LIMIT_CARD':
      return {
        ...state,
        limitCardDismissed: true
      };
    case 'SET_COACH_ERROR':
      return {
        ...state,
        isThinking: false,
        coachError: { text: action.text },
        micStatusText: DEFAULT_MIC_STATUS
      };
    case 'CLEAR_COACH_ERROR':
      return {
        ...state,
        coachError: null
      };
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

export function detectSpokenTargetWords(
  userText: string,
  targetWords: TargetWord[],
  alreadyUsed: string[]
): { newlyUsedDisplay: string[]; newlyUsedLower: string[] } {
  const usedSet = new Set((alreadyUsed || []).map((w) => w.toLowerCase()));
  const normalizedInput = userText.toLowerCase();
  const newlyUsedDisplay: string[] = [];
  const newlyUsedLower: string[] = [];

  (targetWords || []).forEach((item) => {
    const target = item.word.toLowerCase();
    if (usedSet.has(target)) return;

    const cleanTarget = target.replace(/^å\s+/, '').trim();
    const rootStem = cleanTarget.length > 5 ? cleanTarget.slice(0, -2) : cleanTarget;

    if (
      normalizedInput.includes(cleanTarget) ||
      (rootStem.length >= 4 && normalizedInput.includes(rootStem))
    ) {
      usedSet.add(target);
      newlyUsedLower.push(target);
      newlyUsedDisplay.push(item.word);
    }
  });

  return { newlyUsedDisplay, newlyUsedLower };
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
    title: 'Кастомный тренажёр: ' + raw.slice(0, 34) + '...',
    level: userLevel,
    badge: 'Kopinor-Safe Custom',
    avatar: 'custom',
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

/** Longest vacancy text the coach accepts (`customScenario.sourceText` in the request schema). */
export const VACANCY_MAX_CHARS = 4000;

/**
 * An interview built from a vacancy the learner pasted. The examiner may mention the job only
 * because the learner gave it; nothing is claimed about the learner themselves.
 */
export function buildVacancyScenario(raw: string, base: Scenario): Scenario {
  const vacancy = raw.trim().slice(0, VACANCY_MAX_CHARS);
  return {
    ...base,
    id: 'custom-vacancy-' + Date.now(),
    title: 'Intervju: stillingen du limte inn',
    badge: 'Jobbintervju · Din stillingsannonse',
    partnerRole: 'Leder på arbeidsplassen i annonsen',
    description: vacancy.slice(0, 130),
    sourceText: vacancy,
    openingLine:
      'Hei og velkommen! Takk for at du søkte på denne stillingen. Kan du fortelle litt om deg selv og hvorfor du vil ha denne jobben?',
    openingTranslation:
      'Здравствуйте и добро пожаловать! Спасибо, что откликнулись на эту вакансию. Расскажите немного о себе и о том, почему вы хотите эту работу?',
    openingUa:
      'Вітаю і ласкаво просимо! Дякуємо, що відгукнулися на цю вакансію. Розкажіть трохи про себе і чому ви хочете цю роботу?',
    openingEn:
      'Hello and welcome! Thank you for applying for this position. Can you tell me a little about yourself and why you want this job?'
  };
}

function createInitialStudioState(base: StudioState): StudioState {
  if (typeof window === 'undefined') {
    return base;
  }
  const prefs = readPathPrefs();
  const l1Lang: L1Language = prefs.l1 === 'uk' ? 'ua' : prefs.l1 === 'en' ? 'en' : 'ru';
  const userLevel: CefrLevel =
    prefs.targetLevel === 'A2' || prefs.targetLevel === 'B1' || prefs.targetLevel === 'B2'
      ? prefs.targetLevel
      : base.userLevel;
  if (l1Lang === base.l1Lang && userLevel === base.userLevel) {
    return base;
  }
  return {
    ...base,
    l1Lang,
    userLevel,
    chatHistory: createInitialChat(base.currentScenario, l1Lang)
  };
}

export interface UseStudioStateOptions {
  authEnabled?: boolean;
}

export function useStudioState({ authEnabled = false }: UseStudioStateOptions = {}) {
  const [state, dispatch] = useReducer(studioReducer, initialStudioState, createInitialStudioState);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechRateRef = useRef<number>(1.0);

  useEffect(() => {
    if (!authEnabled || typeof window === 'undefined' || typeof globalThis.fetch !== 'function') {
      return;
    }
    let cancelled = false;
    globalThis
      .fetch('/api/sessions/current')
      .then(async (res) => {
        if (!res || res.status !== 200) return;
        const data = (await res.json()) as {
          session?: {
            id: string;
            module: string;
            scenario_id: string;
            level: string;
          } | null;
          turns?: Array<{
            id?: number;
            role: 'user' | 'ai';
            text: string;
            correction_json?: unknown;
            created_at?: string;
          }>;
        };
        if (!cancelled && data?.session && Array.isArray(data.turns) && data.turns.length > 0) {
          dispatch({
            type: 'RESTORE_SESSION',
            session: data.session,
            turns: data.turns
          });
        }
      })
      .catch(() => {
        // Ignore session restore network errors
      });
    return () => {
      cancelled = true;
    };
  }, [authEnabled]);

  const setSpeechRate = useCallback((rate: number) => {
    speechRateRef.current = rate;
  }, []);

  const speakWithOrb = useCallback((text: string) => {
    speakNorwegian(text, {
      rate: speechRateRef.current,
      onStart: () => {
        dispatch({ type: 'SET_RECORDING', isRecording: false });
        dispatch({ type: 'SET_SPEAKING', isSpeaking: true });
      },
      onBoundary: (charIndex: number) => {
        dispatch({ type: 'SET_ACTIVE_SPEECH', activeSpeech: { text, charIndex } });
      },
      onEnd: () => {
        dispatch({ type: 'SET_SPEAKING', isSpeaking: false });
        dispatch({ type: 'SET_ACTIVE_SPEECH', activeSpeech: null });
      }
    });
  }, []);

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
        speakWithOrb(nextScenario.openingLine);
      }
    },
    [state.scenarios, speakWithOrb]
  );

  const selectScenario = useCallback(
    (scenario: Scenario) => {
      dispatch({ type: 'SELECT_SCENARIO', scenario });
      speakWithOrb(scenario.openingLine);
    },
    [speakWithOrb]
  );

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
    speakWithOrb(state.currentScenario.openingLine);
  }, [state.currentScenario, speakWithOrb]);

  const applyCustomSource = useCallback(
    (rawText: string) => {
      const trimmed = rawText.trim();
      if (!trimmed) return;
      const customScenario = buildCustomScenarioFromText(trimmed, state.userLevel);
      dispatch({ type: 'APPLY_CUSTOM_SCENARIO', scenario: customScenario });
      speakWithOrb(customScenario.openingLine);
    },
    [state.userLevel, speakWithOrb]
  );

  const applyVacancy = useCallback(
    (rawText: string) => {
      const trimmed = rawText.trim();
      if (!trimmed) return;
      // Keep the interview the learner picked (its target words); lunch talk is not an interview.
      const interviews = scenariosByModule.jobbintervju.filter((sc) =>
        sc.id.startsWith('jobb-intervju-')
      );
      const base = interviews.find((sc) => sc.id === state.currentScenario.id) ?? interviews[0];
      const scenario = buildVacancyScenario(trimmed, base);
      dispatch({ type: 'APPLY_CUSTOM_SCENARIO', scenario });
      speakWithOrb(scenario.openingLine);
    },
    [state.currentScenario, speakWithOrb]
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

  /** Sends one learner message to the coach and applies the answer, or shows the error card. */
  const sendToCoach = useCallback(
    async (
      cleanText: string,
      historyPayload: { sender: 'user' | 'ai'; norsk: string; l1?: string }[],
      usedWordsPayload: string[]
    ) => {
      const sc = state.currentScenario;
      dispatch({ type: 'SET_THINKING', isThinking: true });
      dispatch({ type: 'SET_MIC_STATUS', text: THINKING_MIC_STATUS });

      try {
        const result = await postCoach({
          module: state.currentModule,
          scenarioId: sc ? sc.id : 'np-b1b2-velferd-hjemmekontor',
          level: state.userLevel,
          l1: state.l1Lang,
          persona: state.agentPersona,
          userText: cleanText,
          history: historyPayload,
          usedWords: usedWordsPayload,
          customScenario:
            sc && String(sc.id).startsWith('custom-')
              ? {
                  id: sc.id,
                  title: sc.title,
                  partnerName: sc.partnerName,
                  partnerRole: sc.partnerRole,
                  sourceText: sc.sourceText,
                  targetWords: sc.targetWords
                }
              : undefined
        });

        if (result.correction) {
          dispatch({ type: 'ADD_COACHING_CARD', correction: result.correction });
        }

        dispatch({
          type: 'APPEND_MESSAGE',
          message: {
            sender: 'ai',
            norsk: result.reply_norsk,
            l1: result.reply_l1,
            time: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            }),
            ...(result.source === 'fallback' ? { isExample: true } : {})
          }
        });

        if (result.next_hints && result.next_hints.length > 0) {
          dispatch({ type: 'SET_HINTS', hints: result.next_hints });
        }

        speakWithOrb(result.reply_norsk);
        dispatch({ type: 'SET_THINKING', isThinking: false });
        dispatch({ type: 'SET_MIC_STATUS', text: DEFAULT_MIC_STATUS });
      } catch (err) {
        if (err instanceof AuthRequiredError) {
          dispatch({ type: 'SET_THINKING', isThinking: false });
          if (typeof window !== 'undefined' && typeof window.location?.assign === 'function') {
            window.location.assign('/login');
          }
          return;
        }
        if (err instanceof QuotaExceededError) {
          dispatch({
            type: 'SET_QUOTA_EXCEEDED',
            limit: err.limit,
            plan: err.plan
          });
          return;
        }
        // Coach unavailable or any other failure: keep the learner's message and offer a retry.
        if (!(err instanceof CoachUnavailableError)) {
          console.error('Coach request failed.');
        }
        dispatch({ type: 'SET_COACH_ERROR', text: cleanText });
      }
    },
    [
      state.currentScenario,
      state.currentModule,
      state.userLevel,
      state.l1Lang,
      state.agentPersona,
      speakWithOrb
    ]
  );

  const handleUserSubmission = useCallback(
    async (rawText: string) => {
      const cleanText = (rawText || '').trim();
      if (!cleanText) return;

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // Ignore
        }
      }

      const nowTime = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });

      const userMsg: ChatMessage = {
        sender: 'user',
        norsk: cleanText,
        l1: '',
        time: nowTime
      };

      dispatch({ type: 'CLEAR_COACH_ERROR' });
      dispatch({ type: 'APPEND_MESSAGE', message: userMsg });

      const sc = state.currentScenario;
      const { newlyUsedDisplay, newlyUsedLower } = detectSpokenTargetWords(
        cleanText,
        sc?.targetWords || [],
        state.usedWords
      );

      const nextUsedWords = Array.from(new Set([...state.usedWords, ...newlyUsedLower]));

      if (newlyUsedDisplay.length > 0) {
        const toastMsg = `Использовано в речи: ${newlyUsedDisplay.join(', ')}`;
        dispatch({
          type: 'MARK_WORDS_USED',
          words: newlyUsedLower,
          toast: toastMsg
        });
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = setTimeout(() => {
          dispatch({ type: 'CLEAR_USED_WORDS_TOAST' });
        }, 4500);
      }

      const historyPayload = [...state.chatHistory, userMsg].slice(-20).map((t) => ({
        sender: t.sender,
        norsk: t.norsk,
        l1: t.l1
      }));

      await sendToCoach(cleanText, historyPayload, nextUsedWords);
    },
    [state.currentScenario, state.usedWords, state.chatHistory, sendToCoach]
  );

  /** Re-sends the message that failed, without adding it to the chat a second time. */
  const retryLastSubmission = useCallback(async () => {
    const failed = state.coachError;
    if (!failed) return;
    dispatch({ type: 'CLEAR_COACH_ERROR' });
    const historyPayload = state.chatHistory.slice(-20).map((t) => ({
      sender: t.sender,
      norsk: t.norsk,
      l1: t.l1
    }));
    await sendToCoach(failed.text, historyPayload, state.usedWords);
  }, [state.coachError, state.chatHistory, state.usedWords, sendToCoach]);

  const dismissLimitCard = useCallback(() => {
    dispatch({ type: 'DISMISS_LIMIT_CARD' });
  }, []);

  const exportReportAndGlossary = useCallback(() => {
    if (typeof window === 'undefined') return;
    const markdown = buildReportMarkdown(state);
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `NorskLive-HKdir-Report-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
  }, [state]);

  const advanceExamPart = useCallback(() => {
    const sc = state.currentScenario;
    if (state.examPart < 3) {
      const nextPart = state.examPart + 1;
      dispatch({ type: 'SET_EXAM_PART', examPart: nextPart });
      if (sc?.examStructure) {
        const nextPrompt =
          nextPart === 2 ? sc.examStructure.part2Prompt : sc.examStructure.part3Prompt;
        dispatch({
          type: 'APPEND_MESSAGE',
          message: {
            sender: 'ai',
            norsk: nextPrompt,
            l1: 'Переход к следующему регламентированному этапу экзамена HK-dir!',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        });
        speakWithOrb(nextPrompt);
      }
    } else {
      exportReportAndGlossary();
    }
  }, [state.currentScenario, state.examPart, exportReportAndGlossary, speakWithOrb]);

  const speakLastAiReply = useCallback(() => {
    const lastAi = [...state.chatHistory].reverse().find((m) => m.sender === 'ai');
    if (lastAi) {
      speakWithOrb(lastAi.norsk);
    }
  }, [state.chatHistory, speakWithOrb]);

  return {
    state,
    dispatch,
    speakWithOrb,
    setSpeechRate,
    switchModule,
    selectScenario,
    setL1Lang,
    setUserLevel,
    setAgentPersona,
    toggleBlurMode,
    restartSession,
    applyCustomSource,
    applyVacancy,
    saveToGlossary,
    markWordUsed,
    handleUserSubmission,
    dismissLimitCard,
    retryLastSubmission,
    exportReportAndGlossary,
    advanceExamPart,
    speakLastAiReply
  };
}
