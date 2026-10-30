import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
const script = readFileSync('i18n.js', 'utf8');
test('translations include Korean Japanese English', () => {
  expect(script).toContain('WHITESHEEP_TRANSLATIONS');
  expect(script).toContain('日本語');
  expect(script).toContain('English');
});
test('text matching uses whitespace regex', () => {
  expect(script).toContain('original.match(/^(\\s*)([\\s\\S]*?)(\\s*)$/)');
});
