import { test, expect } from 'vitest';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { extractLocalization, resourcesFrom, collectGaps, assertKnownGaps } from '../../scripts/i18n-contract.mjs';

const source = readFileSync('i18n.js', 'utf8');
test('exports actual static dictionaries without executing browser code', () => {
  const model = extractLocalization(source);
  const resources = resourcesFrom(model);
  expect(Object.keys(resources.ko).sort()).toEqual(Object.keys(resources.ja).sort());
  expect(Object.keys(resources.ko).sort()).toEqual(Object.keys(resources.en).sort());
  expect(resources.en['ui.directory.count']).toBe('{count} / {total} total');
});
test('rejects duplicate keys in the JavaScript AST', () => {
  expect(() => extractLocalization(source.replace('ja: {', 'ja: { duplicate: "x", duplicate: "y",'))).toThrow(/Duplicate/);
});
test('rejects dynamic dictionary values and unsupported locales', () => {
  expect(() => extractLocalization(source.replace('ja: {', 'fr: {'))).toThrow(/Locale/);
  expect(() => extractLocalization(source.replace("'本文へ移動'", '(() => "untrusted")()'))).toThrow(/static/);
});
test('a missing locale entry cannot become silent dictionary coverage', () => {
  expect(() => extractLocalization(source.replace("'본문 바로가기': '本文へ移動',", ''))).toThrow(/mismatch/);
});
test('existing fallback inventory matches built HTML, including titles and metadata', () => {
  const actual = collectGaps('docs', extractLocalization(source));
  const baseline = JSON.parse(readFileSync('.ci/i18n-known-gaps.json', 'utf8'));
  expect(actual.length).toBeGreaterThan(0);
  expect(actual.some((gap) => gap.locations.some((location) => location.includes(':title')))).toBe(true);
  expect(() => assertKnownGaps(actual, baseline)).not.toThrow();
});
test('new missing text fails instead of being copied into every locale', () => {
  const root = mkdtempSync(join(tmpdir(), 'site-i18n-'));
  try {
    writeFileSync(join(root, 'index.html'), '<title>새 제목</title><p>새 미번역 문구</p>');
    const actual = collectGaps(root, extractLocalization(source));
    expect(() => assertKnownGaps(actual, { version: 1, fallback: 'ko', knownGaps: [] })).toThrow(/inventory changed/);
    const resources = resourcesFrom(extractLocalization(source));
    expect(Object.values(resources.en)).not.toContain('새 미번역 문구');
  } finally {
    rmSync(root, { recursive: true });
  }
});
test('removing both locale translations changes the fallback inventory', () => {
  const model = extractLocalization(source);
  delete model.dictionaries.en['본문 바로가기'];
  delete model.dictionaries.ja['본문 바로가기'];
  const actual = collectGaps('docs', model);
  const baseline = JSON.parse(readFileSync('.ci/i18n-known-gaps.json', 'utf8'));
  expect(() => assertKnownGaps(actual, baseline)).toThrow(/inventory changed/);
});
