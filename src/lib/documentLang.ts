export type UiLang = 'ru' | 'uk' | 'en';

/** The interface language follows the learner's L1 setting; `ua` is the older code for Ukrainian. */
export function uiLangFromL1(l1?: string | null): UiLang {
  if (l1 === 'uk' || l1 === 'ua') return 'uk';
  if (l1 === 'en') return 'en';
  return 'ru';
}

export function applyDocumentLang(l1?: string | null): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = uiLangFromL1(l1);
}
