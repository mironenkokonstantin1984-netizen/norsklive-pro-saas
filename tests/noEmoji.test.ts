import fs from 'node:fs';
import path from 'node:path';
import { describe, test, expect } from 'vitest';

/** Emoji and pictographic symbols used as decoration (🔴 🎯 ★ ⚠️ ✓ …). Plain arrows such as → stay allowed. */
const DECORATION = /[\p{Extended_Pictographic}★☆✓✔✗✘️]/u;

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(tsx?|css|md|json)$/.test(entry.name) ? [full] : [];
  });
}

describe('#48 no emoji or symbols as decoration (B8)', () => {
  test('files under src/ contain no emoji', () => {
    const root = path.resolve(__dirname, '..');
    const hits: string[] = [];
    for (const file of sourceFiles(path.join(root, 'src'))) {
      fs.readFileSync(file, 'utf8')
        .split('\n')
        .forEach((line, idx) => {
          const match = DECORATION.exec(line);
          if (match) hits.push(`${path.relative(root, file)}:${idx + 1} ${match[0]}`);
        });
    }
    expect(hits).toEqual([]);
  });
});
