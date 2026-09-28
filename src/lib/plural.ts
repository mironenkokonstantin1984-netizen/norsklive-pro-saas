const ruPluralRules = new Intl.PluralRules('ru');

export interface RuPluralForms {
  one: string;
  few: string;
  many: string;
}

export function pluralRu(count: number, forms: RuPluralForms): string {
  const category = ruPluralRules.select(Math.abs(count));
  if (category === 'one') return forms.one;
  if (category === 'few') return forms.few;
  return forms.many;
}

export function formatCountRu(count: number, forms: RuPluralForms): string {
  return `${count} ${pluralRu(count, forms)}`;
}
