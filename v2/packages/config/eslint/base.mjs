// Shared ESLint (flat config) presets for the V2 workspace.
//
// Consumers compose the pieces they need:
//   import { node } from '@xr/config/eslint';            // Node / NestJS / libraries
//   import { ignores, core, prettier } from '@xr/config/eslint';  // Next.js adds its own TS + React presets
import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import globalsMap from 'globals';
import tseslint from 'typescript-eslint';

export { boundaries } from './boundaries.mjs';

/** Paths no package lints: build output, generated code, dependencies. */
export const ignores = {
  ignores: [
    '**/dist/**',
    '**/.next/**',
    '**/.turbo/**',
    '**/coverage/**',
    '**/node_modules/**',
    '**/src/generated/**',
    '**/playwright-report/**',
    '**/test-results/**',
  ],
};

/** JavaScript baseline. */
export const core = [js.configs.recommended];

/** TypeScript baseline (no type-aware rules yet — those need per-package `parserOptions.project`). */
export const typescript = [
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
];

/** Disables formatting rules that Prettier owns. Always last. */
export const prettier = prettierConfig;

export const nodeGlobals = { languageOptions: { globals: { ...globalsMap.node } } };
export const browserGlobals = { languageOptions: { globals: { ...globalsMap.browser } } };

/** Complete preset for Node.js libraries and services (add `boundaries('<package>')`). */
export const node = [ignores, ...core, ...typescript, nodeGlobals, prettier];
