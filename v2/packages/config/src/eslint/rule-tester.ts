import { join } from 'node:path';

import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, it } from 'vitest';

// ESLint's RuleTester reports through the host framework's describe/it; Vitest runs without
// globals here, so hand them over explicitly.
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

/** TypeScript + JSX, as every product package is linted. */
export function ruleTester(): RuleTester {
  return new RuleTester({
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  });
}

/** Fixture paths live under this package, so flat config never treats them as outside the base path. */
export const fixtureApp = join(import.meta.dirname, '..', '..', 'fixture-workspace', 'apps', 'web');
export const fixturePath = (relativePath: string): string => join(fixtureApp, relativePath);
