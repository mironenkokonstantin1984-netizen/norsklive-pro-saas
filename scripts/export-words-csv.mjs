import fs from 'node:fs';
import path from 'node:path';

function escapeCsvCell(value) {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const rootDir = process.cwd();
const wordsPath = path.join(rootDir, 'data', 'words', 'a1-a2.json');
const phrasesPath = path.join(rootDir, 'data', 'words', 'phrases.json');
const outCsvPath = path.join(rootDir, 'docs', 'words-review.csv');

const words = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));
const phrases = JSON.parse(fs.readFileSync(phrasesPath, 'utf8'));
const allItems = [...words, ...phrases];

const headers = [
  'id',
  'lemma',
  'pos',
  'gender',
  'level',
  'topics',
  'forms',
  'translation_ru',
  'translation_uk',
  'translation_en',
  'example_nb',
  'cloze_1_nb',
  'cloze_1_answer',
  'cloze_2_nb',
  'cloze_2_answer',
  'status',
  'source'
];

const lines = [headers.join(',')];

for (const item of allItems) {
  const formsStr = Object.entries(item.forms ?? {})
    .map(([k, v]) => `${k}: ${v}`)
    .join(' | ');
  const ex1 = item.examples?.[0]?.nb ?? '';
  const c1 = item.cloze?.[0];
  const c2 = item.cloze?.[1];

  const row = [
    item.id,
    item.lemma,
    item.pos,
    item.gender ?? '',
    item.level,
    (item.topics ?? []).join(';'),
    formsStr,
    item.translations?.ru ?? '',
    item.translations?.uk ?? '',
    item.translations?.en ?? '',
    ex1,
    c1?.nb ?? '',
    c1?.answer ?? '',
    c2?.nb ?? '',
    c2?.answer ?? '',
    item.status,
    item.source
  ].map(escapeCsvCell);

  lines.push(row.join(','));
}

fs.mkdirSync(path.dirname(outCsvPath), { recursive: true });
fs.writeFileSync(outCsvPath, lines.join('\n') + '\n', 'utf8');
console.log(`Exported ${allItems.length} items to docs/words-review.csv`);
