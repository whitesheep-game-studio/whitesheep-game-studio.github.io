import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'acorn';
import { JSDOM } from 'jsdom';

function literalObject(node) {
  if (node?.type === 'Literal' && typeof node.value === 'string') return node.value;
  if (node?.type !== 'ObjectExpression') throw new Error('Locale dictionaries must contain static string objects');
  const result = Object.create(null);
  for (const property of node.properties) {
    if (property.type !== 'Property' || property.computed || property.method || property.kind !== 'init') {
      throw new Error('Dynamic locale properties are unsupported');
    }
    const key = property.key.type === 'Identifier' ? property.key.name : property.key.value;
    if (typeof key !== 'string' || Object.hasOwn(result, key)) throw new Error(`Duplicate/invalid locale key: ${key}`);
    result[key] = literalObject(property.value);
  }
  return result;
}

function sameKeys(actual, expected, label) {
  if (JSON.stringify(Object.keys(actual).sort()) !== JSON.stringify(Object.keys(expected).sort())) {
    throw new Error(`Locale key mismatch: ${label}`);
  }
}

export function extractLocalization(source) {
  const program = parse(source, { ecmaVersion: 'latest', sourceType: 'script' });
  const assignments = program.body.filter(
    (node) =>
      node.type === 'ExpressionStatement' &&
      node.expression.type === 'AssignmentExpression' &&
      node.expression.left.type === 'MemberExpression' &&
      !node.expression.left.computed &&
      node.expression.left.object.name === 'window' &&
      node.expression.left.property.name === 'WHITESHEEP_TRANSLATIONS'
  );
  if (assignments.length !== 1) throw new Error('Expected one top-level translation dictionary');
  const dictionaries = literalObject(assignments[0].expression.right);
  sameKeys(dictionaries, { ja: null, en: null }, 'source-text locales');
  sameKeys(dictionaries.ja, dictionaries.en, 'source-text ja/en');
  const calls = program.body.filter(
    (node) => node.type === 'ExpressionStatement' && node.expression.type === 'CallExpression' && node.expression.callee.type === 'ArrowFunctionExpression'
  );
  if (calls.length !== 1) throw new Error('Expected one runtime localization function');
  const declarations = calls[0].expression.callee.body.body
    .filter((node) => node.type === 'VariableDeclaration')
    .flatMap((node) => node.declarations)
    .filter((node) => node.id.name === 'languages');
  if (declarations.length !== 1) throw new Error('Expected runtime languages declaration');
  const ui = literalObject(declarations[0].init);
  sameKeys(ui, { ko: null, ja: null, en: null }, 'UI locales');
  for (const locale of ['ja', 'en']) sameKeys(ui.ko, ui[locale], `UI ${locale}`);
  for (const dictionary of [...Object.values(dictionaries), ...Object.values(ui)]) {
    for (const value of Object.values(dictionary)) {
      if (typeof value !== 'string' || !value.trim()) throw new Error('Translation values must be nonempty strings');
    }
  }
  return { dictionaries, ui };
}

export const sourceId = (source) => `text.${createHash('sha256').update(source).digest('hex').slice(0, 20)}`;

export function resourcesFrom({ dictionaries, ui }) {
  const resources = Object.fromEntries(['ko', 'ja', 'en'].map((locale) => [locale, {}]));
  for (const source of Object.keys(dictionaries.ja).sort()) {
    const id = sourceId(source);
    if (Object.hasOwn(resources.ko, id)) throw new Error('Source ID collision');
    resources.ko[id] = source;
    resources.ja[id] = dictionaries.ja[source];
    resources.en[id] = dictionaries.en[source];
  }
  for (const key of Object.keys(ui.ko).sort()) {
    for (const locale of ['ko', 'ja', 'en']) resources[locale][`ui.${key}`] = ui[locale][key];
  }
  return resources;
}

function* htmlFiles(directory) {
  for (const item of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(directory, item.name);
    if (item.isSymbolicLink()) throw new Error('Generated HTML must not be symlinked');
    if (item.isDirectory()) yield* htmlFiles(path);
    else if (item.name.endsWith('.html')) yield path;
  }
}

export function collectGaps(directory, { dictionaries }) {
  const gaps = new Map();
  let pages = 0;
  const add = (source, location, translatedByRuntime) => {
    source = source.trim();
    if (!/[가-힣]/u.test(source)) return;
    const missing = ['ja', 'en'].filter((locale) => !translatedByRuntime || !Object.hasOwn(dictionaries[locale], source));
    if (!missing.length) return;
    const id = sourceId(source);
    const item = gaps.get(id) || { id, source, locales: missing, locations: [] };
    item.locales = [...new Set([...item.locales, ...missing])].sort();
    if (!item.locations.includes(location)) item.locations.push(location);
    gaps.set(id, item);
  };
  for (const path of htmlFiles(directory)) {
    pages++;
    const page = relative(directory, path).replaceAll('\\', '/');
    const dom = new JSDOM(readFileSync(path, 'utf8'));
    const document = dom.window.document;
    const walker = document.createTreeWalker(document.body, dom.window.NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement?.closest('script,style,svg,.language-picker')) continue;
      add(node.nodeValue, `${page}:text`, true);
    }
    for (const element of document.querySelectorAll('[placeholder],[aria-label],[alt]')) {
      for (const attribute of ['placeholder', 'aria-label', 'alt']) {
        if (element.hasAttribute(attribute)) add(element.getAttribute(attribute), `${page}:${attribute}`, true);
      }
    }
    add(document.title, `${page}:title`, false);
    for (const element of document.querySelectorAll('meta[content]')) {
      add(element.content, `${page}:meta:${element.name || element.getAttribute('property')}`, false);
    }
    dom.window.close();
  }
  if (!pages) throw new Error('No generated HTML pages inventoried');
  return [...gaps.values()].map((item) => ({ ...item, locations: item.locations.sort() })).sort((a, b) => a.id.localeCompare(b.id));
}

export function assertKnownGaps(actual, baseline) {
  if (baseline.version !== 1 || baseline.fallback !== 'ko' || !Array.isArray(baseline.knownGaps)) {
    throw new Error('Invalid authored fallback baseline');
  }
  if (JSON.stringify(actual) !== JSON.stringify(baseline.knownGaps)) {
    throw new Error('Authored Korean fallback inventory changed; review missing translations and baseline explicitly');
  }
}
