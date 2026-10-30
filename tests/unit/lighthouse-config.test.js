import { createRequire } from 'node:module';
import { test, expect } from 'vitest';

const require = createRequire(import.meta.url);
const { findRcFile, loadRcFile, flattenRcToConfig } = require('@lhci/utils/src/lighthouserc.js');

test('Lighthouse discovers and loads the configuration in this ESM project', () => {
  const file = findRcFile(process.cwd());
  expect(file).toBeDefined();
  const config = flattenRcToConfig(loadRcFile(file));
  expect(config.collect.staticDistDir).toBe('./docs');
  expect(config.collect.url).toEqual(['http://localhost/', 'http://localhost/apps/']);
  expect(config.collect.numberOfRuns).toBe(1);
  for (const category of ['performance', 'accessibility', 'best-practices', 'seo']) {
    expect(config.assert.assertions[`categories:${category}`][0]).toBe('warn');
  }
  expect(config.upload.target).toBe('temporary-public-storage');
});
