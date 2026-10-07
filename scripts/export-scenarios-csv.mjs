import console from 'node:console';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { a2Scenarios } from '../src/content/scenarios/a2.ts';
import { b1Scenarios } from '../src/content/scenarios/b1.ts';

function escapeCsvCell(value) {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const rootDir = process.cwd();
const outCsvPath = path.join(rootDir, 'docs', 'scenarios-review.csv');

const allItems = [...a2Scenarios, ...b1Scenarios];

const headers = [
  'id',
  'level',
  'part',
  'topic',
  'openingLine',
  'guidingQuestions',
  'status'
];

const lines = [headers.join(',')];

for (const item of allItems) {
  const row = [
    item.id,
    item.level,
    item.part,
    item.topic,
    item.openingLine,
    item.sourceText,
    item.status
  ].map(escapeCsvCell);

  lines.push(row.join(','));
}

fs.mkdirSync(path.dirname(outCsvPath), { recursive: true });
fs.writeFileSync(outCsvPath, lines.join('\n') + '\n', 'utf8');
console.log(`Exported ${allItems.length} scenarios to docs/scenarios-review.csv`);
