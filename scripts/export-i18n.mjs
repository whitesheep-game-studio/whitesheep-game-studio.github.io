import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extractLocalization, resourcesFrom, collectGaps, assertKnownGaps } from './i18n-contract.mjs';

const source = extractLocalization(readFileSync('i18n.js', 'utf8'));
const resources = resourcesFrom(source);
const gaps = collectGaps('docs', source);
const baselinePath = '.ci/i18n-known-gaps.json';
if (process.argv.includes('--write-baseline')) {
  writeFileSync(
    baselinePath,
    JSON.stringify(
      {
        version: 1,
        fallback: 'ko',
        note: 'Existing authored Korean fallback. These texts are not verified ja/en translations. Review faithful translations before removing gaps; CI never regenerates this baseline.',
        knownGaps: gaps
      },
      null,
      2
    ) + '\n'
  );
} else {
  assertKnownGaps(gaps, JSON.parse(readFileSync(baselinePath, 'utf8')));
}
mkdirSync('.ci/locales', { recursive: true });
for (const [locale, values] of Object.entries(resources)) {
  writeFileSync(`.ci/locales/${locale}.json`, JSON.stringify(values, null, 2) + '\n');
}
const report =
  `Existing dictionary: ${Object.keys(resources.ko).length} keys across ko/ja/en. ` +
  `Known authored Korean fallback: ${gaps.length} distinct strings. Full-page localization is incomplete.\n`;
console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
