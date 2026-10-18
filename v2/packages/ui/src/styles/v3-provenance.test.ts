/**
 * Provenance and scope of the V3 stylesheets (foundation XR-V3-RB-1.0; ADR-0010):
 * - the reference copies in design/v3-refined-b/ still have the FOUNDATION-LOCK hashes;
 * - the committed `v3/rb-scoped.css` is exactly what the generator makes from them (drift);
 * - the derivative keeps every declaration block and at-rule of the sources, in order, and changes
 *   only selectors — each one confined to a V3 root and kept out of v46 islands, with zero added
 *   specificity;
 * - the central patches (`v3/patch.css`) are confined the same way and use only allow-listed
 *   product classes;
 * - the entry puts both in `xr.v3`, nothing reaches `:root`, `html` or `body`, nothing loads a URL,
 *   and the keyframes do not collide with the v46 ones.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { V3_PRODUCT_CLASS_ALLOW_LIST } from '@xr/config/policy-terms';
import { describe, expect, it } from 'vitest';

import {
  FOUNDATION_ID as GENERATOR_FOUNDATION_ID,
  FOUNDATION_LOCK,
  ISLAND_EXCLUSION,
  OUTPUT,
  REFERENCE_ROOT,
  SCOPE_PREFIX,
  SHEETS,
  SOURCE_DIRECTORY,
  namesRoot,
  readInputs,
  renderScopedCss,
  scopeComplexSelector,
  scopeStylesheet,
  splitTopLevel,
} from '../../scripts/generate-v3-scoped-css.mjs';
import { FOUNDATION_ID, FOUNDATION_SOURCES } from '../v3/provenance.js';

const V3_STYLES = join(import.meta.dirname, 'v3');
const sha256 = (text: string | Buffer) => createHash('sha256').update(text).digest('hex');
const lock = JSON.parse(readFileSync(FOUNDATION_LOCK, 'utf8')) as {
  foundationId: string;
  baseFiles: Record<string, string>;
  immutableReferences: boolean;
};

interface Rule {
  readonly prelude: string;
  readonly block: string;
}

/** Every rule of `css` in order: style rules with their selector, at-rules with their prelude. */
function rulesOf(css: string): Rule[] {
  const rules: Rule[] = [];
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  let cursor = 0;
  while (cursor < text.length) {
    const open = text.indexOf('{', cursor);
    if (open < 0) break;
    const prelude = text.slice(cursor, open).trim();
    let depth = 0;
    let close = open;
    for (; close < text.length; close += 1) {
      if (text[close] === '{') depth += 1;
      if (text[close] === '}') {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    const block = text.slice(open + 1, close);
    if (/^@(media|container|supports|layer)\b/.test(prelude)) {
      rules.push({ prelude, block: '' });
      rules.push(...rulesOf(block));
    } else {
      rules.push({ prelude, block });
    }
    cursor = close + 1;
  }
  return rules;
}

const sources = SHEETS.map((sheet) => readFileSync(join(SOURCE_DIRECTORY, sheet), 'utf8'));
const derived = readFileSync(OUTPUT, 'utf8');
const patch = readFileSync(join(V3_STYLES, 'patch.css'), 'utf8');
const entry = readFileSync(join(V3_STYLES, 'index.css'), 'utf8');

describe('V3 foundation reference (design/v3-refined-b)', () => {
  it('is foundation XR-V3-RB-1.0, immutable, and every base file still has its locked hash', () => {
    expect(lock.foundationId).toBe(FOUNDATION_ID);
    expect(GENERATOR_FOUNDATION_ID).toBe(FOUNDATION_ID);
    expect(lock.immutableReferences).toBe(true);
    expect(FOUNDATION_SOURCES).toEqual(lock.baseFiles);
    for (const [file, hash] of Object.entries(lock.baseFiles)) {
      expect(sha256(readFileSync(join(REFERENCE_ROOT, file))), file).toBe(hash);
    }
  });

  it('refuses a source that drifted from the lock (one-byte mutation)', () => {
    const mutated = `${sources[0] ?? ''} `;
    expect(sha256(mutated)).not.toBe(lock.baseFiles['references/v3/project/core.css']);
  });
});

describe('generated rb-scoped.css', () => {
  it('is exactly what the generator writes from the locked sources', () => {
    expect(derived).toBe(renderScopedCss(readInputs()));
  });

  it('keeps every declaration block and at-rule of core.css, rb.css and rb-kit.css, in order', () => {
    const original = rulesOf(sources.join('\n'));
    const scoped = rulesOf(derived);
    expect(scoped.length).toBe(original.length);
    scoped.forEach((rule, index) => {
      const source = original[index];
      expect(rule.block, source?.prelude).toBe(source?.block);
      if (source?.prelude.startsWith('@')) expect(rule.prelude).toBe(source.prelude);
    });
  });

  it('changes only selectors: each is confined to a V3 root and kept out of v46 islands', () => {
    const original = rulesOf(sources.join('\n')).filter((rule) => !rule.prelude.startsWith('@'));
    const scoped = rulesOf(derived).filter((rule) => !rule.prelude.startsWith('@'));
    const keyframeSteps = new Set(['from', 'to']);
    scoped.forEach((rule, index) => {
      if (keyframeSteps.has(rule.prelude)) return;
      const before = splitTopLevel(original[index]?.prelude ?? '', ',').map((part) => part.trim());
      const after = splitTopLevel(rule.prelude, ',').map((part) => part.trim());
      expect(after.length).toBe(before.length);
      after.forEach((selector, position) => {
        const source = before[position] ?? '';
        expect(selector).toContain(ISLAND_EXCLUSION);
        const rooted = namesRoot(source.split(/[\s>+~]/)[0] ?? '');
        if (rooted) expect(selector.startsWith(SCOPE_PREFIX)).toBe(false);
        else expect(selector.startsWith(SCOPE_PREFIX)).toBe(true);
        // Removing the two zero-specificity additions gives the source selector back.
        expect(selector.replace(SCOPE_PREFIX, '').replace(ISLAND_EXCLUSION, '')).toBe(source);
      });
    });
  });

  it('confines the classes the v46 sheets also define (.xr-fmt, .xr-sr, .xr-ico, .xr-avatar, .xr-num)', () => {
    for (const name of ['xr-fmt', 'xr-sr', 'xr-ico', 'xr-avatar', 'xr-num']) {
      const selectors = rulesOf(derived)
        .flatMap((rule) => splitTopLevel(rule.prelude, ','))
        .map((part) => part.trim())
        .filter((selector) => new RegExp(`\\.${name}(?![\\w-])`).test(selector));
      expect(selectors.length, name).toBeGreaterThan(0);
      for (const selector of selectors)
        expect(selector.startsWith(SCOPE_PREFIX), selector).toBe(true);
    }
  });

  it('declares nothing on :root, html or body and loads no URL', () => {
    for (const css of [derived, patch]) {
      const selectors = rulesOf(css).map((rule) => rule.prelude);
      expect(selectors.filter((selector) => /(^|[\s,])(:root|html|body)\b/.test(selector))).toEqual(
        [],
      );
      expect(css).not.toMatch(/url\(/);
      expect(css).not.toMatch(/@import/);
    }
  });

  it('names keyframes that the v46 sheets do not use', () => {
    const v46 = ['xr-foundation.css', 'xr-workspace.css', 'xr-public.css']
      .map((sheet) => readFileSync(join(import.meta.dirname, 'v46', sheet), 'utf8'))
      .join('\n');
    const names = (css: string) =>
      [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((match) => match[1]);
    const v3 = names(derived);
    expect(v3).toEqual(['rb-in', 'rk-shimmer', 'rk-fade', 'rk-pop']);
    for (const name of v3) expect(names(v46)).not.toContain(name);
  });
});

describe('the selector transform', () => {
  it.each([
    ['.xr', '.xr' + ISLAND_EXCLUSION],
    ['.xr *::before', '.xr *' + ISLAND_EXCLUSION + '::before'],
    ['.rb a:hover', '.rb a:hover' + ISLAND_EXCLUSION],
    ['.xr-st--ok i', SCOPE_PREFIX + '.xr-st--ok i' + ISLAND_EXCLUSION],
    [
      '.rk-tl:has(li:only-child)::before',
      SCOPE_PREFIX + '.rk-tl:has(li:only-child)' + ISLAND_EXCLUSION + '::before',
    ],
    [
      '.rk-fieldset legend > span:not(.sc-interp)',
      SCOPE_PREFIX + '.rk-fieldset legend > span:not(.sc-interp)' + ISLAND_EXCLUSION,
    ],
    [
      '.rk-tabs::-webkit-scrollbar',
      SCOPE_PREFIX + '.rk-tabs' + ISLAND_EXCLUSION + '::-webkit-scrollbar',
    ],
    ['.rb .rb-nav a[aria-current="page"]', '.rb .rb-nav a[aria-current="page"]' + ISLAND_EXCLUSION],
    ['.rb-rail', SCOPE_PREFIX + '.rb-rail' + ISLAND_EXCLUSION],
  ])('%s', (source, expected) => {
    expect(scopeComplexSelector(source)).toBe(expected);
  });

  it('splits a selector list only at top-level commas', () => {
    expect(splitTopLevel('.xr :where(a,button):focus-visible,.rb-x', ',')).toEqual([
      '.xr :where(a,button):focus-visible',
      '.rb-x',
    ]);
  });

  it('does not take a root class inside an argument for the root (`:not(.rb)`)', () => {
    expect(namesRoot(':not(.rb)')).toBe(false);
    expect(namesRoot('.xr.rb')).toBe(true);
    expect(namesRoot('.xr-st')).toBe(false);
  });

  it('copies @keyframes and comments as written and recurses into @container', () => {
    const css =
      '/* c */\n@keyframes k{from{opacity:0}to{opacity:1}}\n@container rb (max-width: 10px){.a{x:1}}';
    expect(scopeStylesheet(css)).toBe(
      `/* c */\n@keyframes k{from{opacity:0}to{opacity:1}}\n@container rb (max-width: 10px){${SCOPE_PREFIX}.a${ISLAND_EXCLUSION}{x:1}}`,
    );
  });
});

describe('patch.css (V3P-nn)', () => {
  const selectors = rulesOf(patch)
    .filter((rule) => !rule.prelude.startsWith('@'))
    .flatMap((rule) => splitTopLevel(rule.prelude, ','))
    .map((part) => part.trim());

  it('confines every rule to a V3 root and, except the island rule itself, outside islands', () => {
    expect(selectors.length).toBeGreaterThan(0);
    for (const selector of selectors) {
      expect(/:where\(\.xr(?: \*)?\)/.test(selector), selector).toBe(true);
      if (selector !== ':where(.xr) [data-xr-v46]') {
        expect(selector, selector).toContain(ISLAND_EXCLUSION);
      }
    }
  });

  it('uses only the allow-listed product classes, and each one', () => {
    const product = new Set([...patch.matchAll(/\.(rk-x-[\w-]+)/g)].map((match) => match[1]));
    expect([...product].sort()).toEqual([...V3_PRODUCT_CLASS_ALLOW_LIST].sort());
  });

  it('numbers its patches V3P-01 … V3P-08 in order', () => {
    expect([...patch.matchAll(/V3P-(\d\d) ·/g)].map((match) => match[1])).toEqual([
      '01',
      '02',
      '03',
      '04',
      '05',
      '06',
      '07',
      '08',
    ]);
  });

  it('leaves no v46 declaration on a shared class name inside a V3 root (V3P-08)', () => {
    const v46 = readFileSync(join(import.meta.dirname, 'v46', 'xr-foundation.css'), 'utf8');
    const core = sources[0] ?? '';
    const SHORTHANDS: Record<string, readonly string[]> = {
      font: ['font-style', 'font-weight', 'font-size', 'line-height', 'font-family'],
      border: ['border-width', 'border-style', 'border-color'],
    };
    const declared = (css: string, selector: string) => {
      const names = new Set<string>();
      for (const rule of rulesOf(css)) {
        if (
          !splitTopLevel(rule.prelude, ',')
            .map((part) => part.trim())
            .includes(selector)
        )
          continue;
        for (const declaration of rule.block.split(';')) {
          const name = declaration.split(':')[0]?.trim();
          if (!name) continue;
          names.add(name);
          for (const longhand of SHORTHANDS[name] ?? []) names.add(longhand);
        }
      }
      return names;
    };
    const patched = declared(
      patch.split(ISLAND_EXCLUSION).join('').split(SCOPE_PREFIX).join(''),
      '.xr-avatar',
    );
    for (const selector of [
      '.xr-avatar',
      '.xr-fmt',
      '.xr-fmt svg',
      '.xr-sr',
      '.xr-ico',
      '.xr-ico--16',
      '.xr-num',
    ]) {
      const v3 = declared(core, selector);
      expect(v3.size, selector).toBeGreaterThan(0);
      const leaking = [...declared(v46, selector)].filter(
        (name) => !v3.has(name) && !(selector === '.xr-avatar' && patched.has(name)),
      );
      expect(leaking, selector).toEqual([]);
    }
  });
});

describe('the V3 entry (@xr/ui/styles-v3.css)', () => {
  it('reserves xr.v3 after xr.product and imports the derivative, then the patches', () => {
    const statements = entry
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .trim()
      .split(';')
      .map((part) => part.trim());
    expect(statements.slice(0, 4)).toEqual([
      '@layer properties, theme, xr.v46, xr.product, xr.v3, utilities',
      '@layer xr.v3.rb, xr.v3.patch',
      "@import './rb-scoped.css' layer(xr.v3.rb)",
      "@import './patch.css' layer(xr.v3.patch)",
    ]);
  });

  it('keeps the product layer statement of @xr/ui/styles.css unchanged (no V3 rule loads with it)', () => {
    const product = readFileSync(join(import.meta.dirname, 'index.css'), 'utf8');
    expect(product).toContain('@layer properties, theme, xr.v46, xr.product, utilities;');
    expect(product).not.toMatch(/v3/);
  });

  it('is prettier-ignored only for the generated file', () => {
    const ignore = readFileSync(
      join(import.meta.dirname, '..', '..', '..', '..', '.prettierignore'),
      'utf8',
    );
    expect(ignore.split('\n')).toContain('packages/ui/src/styles/v3/rb-scoped.css');
  });
});
