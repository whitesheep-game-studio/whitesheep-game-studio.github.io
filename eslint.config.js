import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['docs/**', 'node_modules/**', '.lighthouseci/**', 'test-results/**'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...globals.browser, ...globals.node, ...globals.vitest } },
    rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_' }] }
  }
];
