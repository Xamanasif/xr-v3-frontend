/**
 * The sidebar's plain data (MAX_DESTINATIONS, PRODUCT_NAME) and, across the whole @xr/ui barrel,
 * the 'use client' boundary for plain data. In a Server Component every export of a
 * 'use client' module is a client reference (a function), so a constant re-exported from one
 * reads as a function on the server: `n > MAX_DESTINATIONS` is silently false and
 * `NOTICE_TONE_ICONS[tone]` is undefined. vitest imports the source without that transform, so
 * the boundary is checked on the source: every non-function runtime export of index.ts must come
 * from a module whose first statement is not 'use client'.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import * as ui from '../index.js';
import { MAX_DESTINATIONS, PRODUCT_NAME } from './limits.js';

const SOURCE = join(import.meta.dirname, '..');

/** The module source behind a relative `.js` specifier of index.ts (`.ts` or `.tsx`). */
function moduleSource(specifier: string): { readonly path: string; readonly text: string } {
  const base = join(SOURCE, specifier.replace(/\.js$/, ''));
  const path = [`${base}.ts`, `${base}.tsx`].find((candidate) => existsSync(candidate));
  if (!path) throw new Error(`No source for ${specifier}`);
  return { path, text: readFileSync(path, 'utf8') };
}

/** Whether the module's first statement is the 'use client' directive (comments skipped). */
function isClientModule(text: string): boolean {
  const code = text.replace(/^(?:\s+|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*/, '');
  return /^(['"])use client\1/.test(code);
}

/** The runtime names index.ts re-exports, with the module each comes from. */
function barrelRuntimeExports(): { readonly name: string; readonly specifier: string }[] {
  const barrel = readFileSync(join(SOURCE, 'index.ts'), 'utf8');
  return [...barrel.matchAll(/export\s*\{([^}]*)\}\s*from\s*'([^']+)'/g)].flatMap(
    ([, names = '', specifier = '']) =>
      names
        .split(',')
        .map((name) => name.trim())
        .filter((name) => name !== '' && !name.startsWith('type '))
        .map((name) => ({ name: name.split(/\s+as\s+/).at(-1)!, specifier })),
  );
}

describe('sidebar limits (board 06 "Navigation rules")', () => {
  it('at most 8 destinations plus Help; the product name under the logo', () => {
    expect(MAX_DESTINATIONS).toBe(8);
    expect(PRODUCT_NAME).toBe('XR Learning Platform');
    expect(ui.MAX_DESTINATIONS).toBe(8);
  });

  it('limits.ts is not a client module, so its values reach Server Components as values', () => {
    expect(isClientModule(moduleSource('./shells/limits.js').text)).toBe(false);
    expect(isClientModule(moduleSource('./shells/sidebar.js').text)).toBe(true);
  });
});

describe("@xr/ui barrel: plain data never comes from a 'use client' module", () => {
  const exports = barrelRuntimeExports();

  it('reads the barrel (MAX_DESTINATIONS and NOTICE_TONE_ICONS among its data exports)', () => {
    const names = exports.map((entry) => entry.name);
    expect(names).toContain('MAX_DESTINATIONS');
    expect(names).toContain('NOTICE_TONE_ICONS');
    for (const { name } of exports) expect(ui, name).toHaveProperty(name);
  });

  it('every non-function runtime export is re-exported from a module without the directive', () => {
    const offenders = exports
      .filter(({ name }) => typeof (ui as Record<string, unknown>)[name] !== 'function')
      .filter(({ specifier }) => isClientModule(moduleSource(specifier).text))
      .map(({ name, specifier }) => `${name} from ${specifier}`);
    expect(offenders).toEqual([]);
  });
});
