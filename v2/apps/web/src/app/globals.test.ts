// @vitest-environment node
/**
 * The web app's stylesheet contract (ADR-0001, G-3 Option A; Appendix E §2.4; WP-0.5): Tailwind
 * without Preflight, its theme reduced to the v46 tokens, and the same layer statement as the
 * `@xr/ui` entry. Compiled here with Tailwind's own compiler, exactly as `@tailwindcss/postcss`
 * compiles `globals.css` in the build.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

import { compile } from 'tailwindcss';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const globals = readFileSync(join(import.meta.dirname, 'globals.css'), 'utf8');
const uiEntry = readFileSync(require.resolve('@xr/ui/styles.css'), 'utf8');
const LAYERS = '@layer properties, theme, xr.v46, xr.product, utilities;';

const firstStatement = (css: string) =>
  css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim()
    .split(';')[0]
    ?.concat(';');

async function build(candidates: string[]): Promise<string> {
  const compiler = await compile(globals, {
    base: import.meta.dirname,
    loadStylesheet: async (id) => {
      const path = require.resolve(id);
      return { path, base: dirname(path), content: readFileSync(path, 'utf8') };
    },
  });
  return compiler.build(candidates);
}

describe('globals.css (apps/web)', () => {
  it('opens with the same layer statement as @xr/ui/styles.css', () => {
    expect(firstStatement(globals)).toBe(LAYERS);
    expect(firstStatement(uiEntry)).toBe(LAYERS);
  });

  it('imports only Tailwind theme and utilities, each into its layer — never Preflight', () => {
    const imports = [...globals.matchAll(/@import\s+([^;]+);/g)].map((match) => match[1]);
    expect(imports).toEqual([
      "'tailwindcss/theme.css' layer(theme)",
      "'tailwindcss/utilities.css' layer(utilities)",
    ]);
    const rules = globals.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(rules).not.toMatch(/preflight|@import\s+['"]tailwindcss['"]/);
    expect(rules).not.toMatch(/\bbody\s*\{/);
  });

  it('generates the composition utilities, mapped to the v46 tokens', async () => {
    const css = await build([
      'flex',
      'grid',
      'gap-4',
      'p-6',
      'mt-2',
      'max-w-180',
      'w-full',
      'whitespace-nowrap',
      'break-words',
      'text-left',
      'text-ink',
      'bg-surface',
      'border-line',
      'rounded-md',
      'shadow-e1',
    ]);
    for (const selector of [
      '.flex',
      '.grid',
      '.gap-4',
      '.p-6',
      '.mt-2',
      '.max-w-180',
      '.w-full',
      '.whitespace-nowrap',
      '.break-words',
      '.text-left',
      '.text-ink',
      '.bg-surface',
      '.border-line',
      '.rounded-md',
      '.shadow-e1',
    ]) {
      expect(css, selector).toContain(`${selector} {`);
    }
    expect(css).toMatch(/\.p-6 \{\s*padding: calc\(4px \* 6\);/); // the 4 px scale (board 01)
    expect(css).toMatch(/\.text-ink \{\s*color: var\(--xr-ink\);/);
    expect(css).toMatch(/\.rounded-md \{\s*border-radius: var\(--xr-r-md\);/);
    expect(css).toContain('@layer utilities');
  });

  it('keeps Tailwind’s @property fallback layer the weakest when a utility needs it', async () => {
    const css = await build(['shadow-e1']);
    expect(css).toContain('@property --tw-shadow');
    const names: string[] = [];
    for (const [, list] of css.matchAll(/@layer\s+([^{;]+)[{;]/g)) {
      for (const name of (list ?? '').split(',').map((part) => part.trim())) {
        if (!names.includes(name)) names.push(name);
      }
    }
    expect(names).toEqual(['properties', 'theme', 'xr.v46', 'xr.product', 'utilities']);
  });

  it('maps the v46 indigo and cyan tokens 1:1 (names the styling scan allows)', async () => {
    const css = await build(['text-indigo-600', 'bg-cyan-50']);
    expect(css).toMatch(/\.text-indigo-600 \{\s*color: var\(--xr-indigo-600\);/);
    expect(css).toMatch(/\.bg-cyan-50 \{\s*background-color: var\(--xr-cyan-50\);/);
  });

  it('generates nothing for Tailwind defaults: palette, type scale, shadows, breakpoints', async () => {
    const empty = await build([]);
    for (const candidate of [
      'bg-red-500',
      'text-gray-700',
      'text-indigo-700',
      'bg-cyan-500',
      'text-lg',
      'text-base',
      'shadow-md',
      'font-bold',
      'font-serif',
      'rounded-xl',
      'max-w-md',
      'sm:flex',
      'md:flex',
      'lg:p-4',
      '@md:flex',
    ]) {
      expect(await build([candidate]), candidate).toBe(empty);
    }
  });
});
