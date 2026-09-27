export interface TargetWord {
  word: string;
  translation: string;
  ua?: string;
  en?: string;
  example?: string;
}

export interface ExamStructure {
  part1Prompt: string;
  part2Prompt: string;
  part3Prompt: string;
}

export interface ScenarioHint {
  label: string;
  norsk: string;
  ru: string;
  ua: string;
  en: string;
}

export interface Scenario {
  id: string;
  title: string;
  level: string;
  badge: string;
  avatar: string;
  partnerName: string;
  partnerRole: string;
  description: string;
  examStructure?: ExamStructure;
  sourceText: string;
  targetWords: TargetWord[];
  openingLine: string;
  openingTranslation: string;
  openingUa: string;
  openingEn: string;
  hints: ScenarioHint[];
}

export type ModuleKey = 'norskprove' | 'jobbintervju' | 'pensum';

export type ScenariosByModule = Record<ModuleKey, Scenario[]>;
