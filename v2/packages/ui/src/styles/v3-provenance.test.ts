/**
 * Provenance and scope of the V3 stylesheets (foundation XR-V3-RB-1.0; ADR-0010):
 * - the reference copies in design/v3-refined-b/ still have the FOUNDATION-LOCK hashes;
 * - the committed `v3/rb-scoped.css` is exactly what the generator makes from them (drift);
 * - the derivative keeps every declaration block and at-rule of the sources, in order, and changes
 *   only selectors — each one confined to a V3 root and kept out of v46 islands, with zero added
 *   specificity;
 * - the committed `v3/xs-scoped.css` is exactly what the generator makes from the XS extension
 *   sheet of the owner-approved Entry & shared export (design/v3-refined-b/roles/XS-v6), which is
 *   built on this foundation's own base sheets, with the same selector-only transform;
 * - the committed `v3/sa-scoped.css` is the same for the Super Admin role sheet of the
 *   owner-approved Super Admin export (design/v3-refined-b/roles/SA-v1), less its preview controls
 *   and the borrowed XS placements the delivered XS export replaces;
 * - the committed `v3/ve-scoped.css` is the same for the Vendor role sheet of the owner-approved
 *   Vendor export (design/v3-refined-b/roles/VE-v1), less its page canvas, reviewer bar and the
 *   borrowed XS surfaces the delivered XS export replaces;
 * - the committed `v3/cm-scoped.css` is the same for the Content Manager role sheet of the
 *   owner-approved Content Manager export (design/v3-refined-b/roles/CM-v1), less its scenario
 *   handoff box and public-page handoff frame (its borrowed XS sheet is not generated);
 * - the committed `v3/rv-scoped.css` is the same for the Academic Reviewer role sheet of the
 *   owner-approved Academic Reviewer export (design/v3-refined-b/roles/RV-v1), less the borrowed
 *   XS surfaces the delivered XS export replaces;
 * - the committed `v3/ia-scoped.css` is the same for the Institute Admin role sheet of the
 *   owner-approved Institute Admin export (design/v3-refined-b/roles/IA-v1), less its preview
 *   chrome and the borrowed XS surfaces the delivered XS export replaces;
 * - the central patches (`v3/patch.css`) are confined the same way and use only allow-listed
 *   product classes — except V3P-09's container name on the v46 app root that holds a V3 region;
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
  ROLE_SHEETS,
  SCOPE_PREFIX,
  SHEETS,
  SOURCE_DIRECTORY,
  namesRoot,
  previewOnlyRule,
  readInputs,
  readRoleInput,
  renderRoleCss,
  renderScopedCss,
  scopeComplexSelector,
  scopeStylesheet,
  splitTopLevel,
} from '../../scripts/generate-v3-scoped-css.mjs';
import { IA_PATCHED_STYLES } from '../testing/index.js';
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
const xsRole = ROLE_SHEETS.find((role) => role.role === 'XS')!;
const xsSource = readFileSync(join(xsRole.directory, xsRole.sheet), 'utf8');
const xsDerived = readFileSync(xsRole.output, 'utf8');
const saRole = ROLE_SHEETS.find((role) => role.role === 'SA')!;
const saSource = readFileSync(join(saRole.directory, saRole.sheet), 'utf8');
const saDerived = readFileSync(saRole.output, 'utf8');
const veRole = ROLE_SHEETS.find((role) => role.role === 'VE')!;
const veSource = readFileSync(join(veRole.directory, veRole.sheet), 'utf8');
const veDerived = readFileSync(veRole.output, 'utf8');
const cmRole = ROLE_SHEETS.find((role) => role.role === 'CM')!;
const cmSource = readFileSync(join(cmRole.directory, cmRole.sheet), 'utf8');
const cmDerived = readFileSync(cmRole.output, 'utf8');
const rvRole = ROLE_SHEETS.find((role) => role.role === 'RV')!;
const rvSource = readFileSync(join(rvRole.directory, rvRole.sheet), 'utf8');
const rvDerived = readFileSync(rvRole.output, 'utf8');
const iaRole = ROLE_SHEETS.find((role) => role.role === 'IA')!;
const iaSource = readFileSync(join(iaRole.directory, iaRole.sheet), 'utf8');
const iaDerived = readFileSync(iaRole.output, 'utf8');

/** The top-level grouping at-rules of `css`, each with the style rules directly inside it. */
function groupsOf(css: string): { readonly prelude: string; readonly rules: Rule[] }[] {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const groups: { prelude: string; rules: Rule[] }[] = [];
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
    if (/^@(media|container|supports|layer)\b/.test(prelude)) {
      groups.push({ prelude, rules: rulesOf(text.slice(open + 1, close)) });
    }
    cursor = close + 1;
  }
  return groups;
}
/** The one patch rule outside a V3 root (V3P-09): a container name on the v46 app root. */
const APP_ROOT_CONTAINER = '.xr-app:has(.rk-x-region)';

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

describe('generated xs-scoped.css (the XS export, design/v3-refined-b/roles/XS-v6)', () => {
  it('is exactly what the generator writes from the locked extension sheet', () => {
    expect(ROLE_SHEETS.map((role) => role.role)).toEqual(['XS', 'SA', 'VE', 'CM', 'RV', 'IA']);
    expect(xsDerived).toBe(renderRoleCss(readRoleInput(xsRole)));
  });

  it("is built on this foundation: the export's three base sheets are the locked bytes", () => {
    const exportLock = JSON.parse(
      readFileSync(join(xsRole.directory, 'FOUNDATION-LOCK.json'), 'utf8'),
    ) as {
      foundationId: string;
      baseFiles: Record<string, { sha256: string }>;
      localAdditions: Record<string, { sha256: string }>;
      tokenChanges: string;
    };
    expect(exportLock.foundationId).toBe(FOUNDATION_ID);
    for (const sheet of SHEETS) {
      expect(exportLock.baseFiles[`project/${sheet}`]?.sha256, sheet).toBe(
        lock.baseFiles[`references/v3/project/${sheet}`],
      );
      expect(sha256(readFileSync(join(xsRole.directory, 'project', sheet))), sheet).toBe(
        lock.baseFiles[`references/v3/project/${sheet}`],
      );
    }
    expect(exportLock.localAdditions[xsRole.sheet]?.sha256).toBe(sha256(xsSource));
    expect(exportLock.tokenChanges).toMatch(/^none/);
  });

  it('refuses an extension sheet that drifted from the export (one-byte mutation)', () => {
    expect(sha256(`${xsSource} `)).not.toBe(sha256(xsSource));
  });

  it('leaves out only the export’s preview-only scaffolding (slots, public slots, specimens, galleries)', () => {
    const left = rulesOf(xsSource).filter(
      (rule) => !rule.prelude.startsWith('@') && previewOnlyRule(xsRole, rule.prelude),
    );
    expect(left.length).toBeGreaterThan(0);
    for (const rule of left) expect(rule.prelude).toMatch(/^\.xs-(slot|pub|spec|kit)/);
    expect(xsDerived).not.toMatch(/\.xs-(slot|pub|spec|kit)/);
    // Every other rule is kept: product rules never name the scaffolding.
    expect(previewOnlyRule(xsRole, '.xs-menu')).toBe(false);
    expect(previewOnlyRule(xsRole, '.xs-slot,.xs-menu')).toBe(false);
  });

  it('keeps every other declaration block and at-rule in order and changes only selectors', () => {
    const original = rulesOf(xsSource).filter(
      (rule) => rule.prelude.startsWith('@') || !previewOnlyRule(xsRole, rule.prelude),
    );
    const scoped = rulesOf(xsDerived);
    expect(scoped.length).toBe(original.length);
    const keyframeSteps = new Set(['from', 'to']);
    scoped.forEach((rule, index) => {
      const source = original[index]!;
      expect(rule.block, source.prelude).toBe(source.block);
      if (source.prelude.startsWith('@') || keyframeSteps.has(rule.prelude)) {
        expect(rule.prelude).toBe(source.prelude);
        return;
      }
      const before = splitTopLevel(source.prelude, ',').map((part) => part.trim());
      const after = splitTopLevel(rule.prelude, ',').map((part) => part.trim());
      after.forEach((selector, position) => {
        expect(selector).toContain(ISLAND_EXCLUSION);
        expect(selector.replace(SCOPE_PREFIX, '').replace(ISLAND_EXCLUSION, '')).toBe(
          before[position],
        );
      });
    });
  });

  it('selects only xs- classes (and their documented rk-banner / rb-logo uses), no root or URL', () => {
    for (const rule of rulesOf(xsSource).filter(
      (candidate) => !candidate.prelude.startsWith('@') && !/^(from|to)$/.test(candidate.prelude),
    )) {
      for (const selector of splitTopLevel(rule.prelude, ',')) {
        expect(selector, selector).toMatch(/\.xs-/);
      }
    }
    expect(xsDerived).not.toMatch(/url\(|@import/);
    expect(
      rulesOf(xsDerived).filter((rule) => /(^|[\s,])(:root|html|body)\b/.test(rule.prelude)),
    ).toEqual([]);
  });

  it('names keyframes that neither the v46 sheets nor the foundation use', () => {
    const v46 = ['xr-foundation.css', 'xr-workspace.css', 'xr-public.css']
      .map((sheet) => readFileSync(join(import.meta.dirname, 'v46', sheet), 'utf8'))
      .join('\n');
    const names = (css: string) =>
      [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((match) => match[1]);
    expect(names(xsDerived)).toEqual(['xs-spin', 'xs-pop']);
    for (const name of names(xsDerived)) {
      expect(names(v46)).not.toContain(name);
      expect(names(derived)).not.toContain(name);
    }
  });
});

describe('generated sa-scoped.css (the Super Admin export, design/v3-refined-b/roles/SA-v1)', () => {
  /** What the export says is not product UI (its COMPONENT-EXTENSIONS.md). */
  const LEFT_OUT = /^\.(?:rb )?\.?sa-(?:pv|acctwrap|acctmenu|help|form|file|out|list-row--static)/;

  it('is exactly what the generator writes from the locked role sheet', () => {
    expect(saDerived).toBe(renderRoleCss(readRoleInput(saRole)));
  });

  it("is built on this foundation: the export's three base sheets are the locked bytes", () => {
    const exportLock = JSON.parse(
      readFileSync(join(saRole.directory, 'FOUNDATION-LOCK.json'), 'utf8'),
    ) as {
      foundationId: string;
      byteIdenticalCopiesInProject: Record<string, { sha256: string }>;
      localAdditions: Record<string, string>;
      globalTokenChanges: string;
    };
    expect(exportLock.foundationId).toBe(FOUNDATION_ID);
    for (const sheet of SHEETS) {
      expect(exportLock.byteIdenticalCopiesInProject[sheet]?.sha256, sheet).toBe(
        lock.baseFiles[`references/v3/project/${sheet}`],
      );
      expect(sha256(readFileSync(join(saRole.directory, 'project', sheet))), sheet).toBe(
        lock.baseFiles[`references/v3/project/${sheet}`],
      );
    }
    expect(exportLock.localAdditions['sa-role.css']).toBe(sha256(saSource));
    expect(exportLock.globalTokenChanges).toBe('none');
  });

  it('leaves out only the preview controls and the borrowed XS placements', () => {
    const left = rulesOf(saSource).filter(
      (rule) => !rule.prelude.startsWith('@') && previewOnlyRule(saRole, rule.prelude),
    );
    expect(left.length).toBeGreaterThan(0);
    for (const rule of left) {
      for (const selector of splitTopLevel(rule.prelude, ',')) {
        expect(selector.trim(), rule.prelude).toMatch(LEFT_OUT);
      }
    }
    expect(saDerived).not.toMatch(/\.sa-(?:pv|acctwrap|acctmenu|help|form|file|out)(?![\w-])/);
    expect(saDerived).not.toContain('.sa-list-row--static');
    // The role's own patterns stay, the GL-04 message among them.
    for (const kept of ['.sa-msg', '.sa-list-row', '.sa-table', '.sa-act', '.sa-inline']) {
      expect(saDerived, kept).toContain(kept);
      expect(previewOnlyRule(saRole, kept)).toBe(false);
    }
    expect(previewOnlyRule(saRole, '.sa-pv,.sa-msg')).toBe(false);
  });

  it('keeps every other declaration block and at-rule in order and changes only selectors', () => {
    // A grouping at-rule whose every rule is left out goes with them: only the borrowed Help
    // layout's `@container rbpage (max-width: 859.98px){ .sa-help{…} }`.
    const droppedGroup = '@container rbpage (max-width: 859.98px)';
    expect(saSource).toMatch(/@container rbpage \(max-width: 859\.98px\)\{ \.sa-help\{[^}]*\} \}/);
    const original = rulesOf(saSource).filter((rule) =>
      rule.prelude.startsWith('@')
        ? rule.prelude !== droppedGroup
        : !previewOnlyRule(saRole, rule.prelude),
    );
    const scoped = rulesOf(saDerived);
    expect(scoped.length).toBe(original.length);
    scoped.forEach((rule, index) => {
      const source = original[index]!;
      expect(rule.block, source.prelude).toBe(source.block);
      if (source.prelude.startsWith('@')) {
        expect(rule.prelude).toBe(source.prelude);
        return;
      }
      const before = splitTopLevel(source.prelude, ',').map((part) => part.trim());
      const after = splitTopLevel(rule.prelude, ',').map((part) => part.trim());
      after.forEach((selector, position) => {
        expect(selector).toContain(ISLAND_EXCLUSION);
        expect(selector.replace(SCOPE_PREFIX, '').replace(ISLAND_EXCLUSION, '')).toBe(
          before[position],
        );
      });
    });
  });

  it('selects only sa- classes, no root, URL, keyframes or global token', () => {
    for (const rule of rulesOf(saSource).filter(
      (candidate) => !candidate.prelude.startsWith('@'),
    )) {
      for (const selector of splitTopLevel(rule.prelude, ',')) {
        expect(selector, selector).toMatch(/\.sa-/);
      }
    }
    expect(saDerived).not.toMatch(/url\(|@import|@keyframes|[{;]\s*--[\w-]+\s*:/);
    expect(
      rulesOf(saDerived).filter((rule) => /(^|[\s,])(:root|html|body)\b/.test(rule.prelude)),
    ).toEqual([]);
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

/** [ids, classes / attributes / pseudo-classes, types] of a selector (`:where` counts 0). */
function specificity(selector: string): [number, number, number] {
  let rest = selector;
  const inner: [number, number, number][] = [];
  rest = rest.replace(/:where\((?:[^()]|\([^()]*\))*\)/g, '');
  rest = rest.replace(/:(?:not|is)\(((?:[^()]|\([^()]*\))*)\)/g, (_match, list: string) => {
    inner.push(
      splitTopLevel(list, ',')
        .map((part) => specificity(part))
        .sort((x, y) => y[0] - x[0] || y[1] - x[1] || y[2] - x[2])[0]!,
    );
    return '';
  });
  const ids = (rest.match(/#[\w-]+/g) ?? []).length;
  const classes = (rest.match(/\.[\w-]+|\[[^\]]*\]|:(?!:)[\w-]+/g) ?? []).length;
  const types = (rest.replace(/\[[^\]]*\]|[.#:][\w-]+/g, ' ').match(/[a-z][\w-]*/gi) ?? []).length;
  return inner.reduce<[number, number, number]>(
    (sum, part) => [sum[0] + part[0], sum[1] + part[1], sum[2] + part[2]],
    [ids, classes, types],
  );
}

function outranks(a: readonly number[], b: readonly number[]): boolean {
  return a[0]! > b[0]! || (a[0] === b[0] && (a[1]! > b[1]! || (a[1] === b[1] && a[2]! > b[2]!)));
}

/** A rule block's declarations, one `property: value` each. */
function declarations(block: string): string[] {
  return block
    .split(';')
    .map((declaration) => declaration.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .map((declaration) => declaration.replace(/\s*:\s*/, ': '));
}

/**
 * A restoration of the export's cascade (V3P-13, V3P-15): the patch's selector (the elements both
 * rules match), the export's winning Refined B rule (its source selector in core.css / rb.css /
 * rb-kit.css), the role rule it beats there and the declarations restored — each one the Refined B
 * rule's own, on a property the role rule sets too.
 */
interface Restoration {
  readonly patch: string;
  readonly refined: string;
  readonly role: string;
  readonly css: string;
}

/** Each restoration is in patch.css, as the export's winning Refined B rule declares it. */
function expectRestorations(restorations: readonly Restoration[], roleDerived: string): void {
  const patchRules = rulesOf(patch);
  const derivedRules = rulesOf(derived);
  const roleRules = rulesOf(roleDerived);
  for (const restoration of restorations) {
    const prelude = `${SCOPE_PREFIX}${restoration.patch}${ISLAND_EXCLUSION}`;
    const found = patchRules.filter((rule) =>
      splitTopLevel(rule.prelude, ',')
        .map((part) => part.trim())
        .includes(prelude),
    );
    expect(found, restoration.patch).toHaveLength(1);
    const restored = declarations(found[0]!.block);
    expect(restored.join('; '), restoration.patch).toBe(declarations(restoration.css).join('; '));
    // The export's winning rule declares each restored value…
    const refined = derivedRules.filter(
      (rule) => rule.prelude === scopeComplexSelector(restoration.refined),
    );
    expect(refined.length, restoration.refined).toBeGreaterThan(0);
    for (const declaration of restored) {
      expect(
        refined.some((rule) => declarations(rule.block).includes(declaration)),
        `${restoration.refined} ${declaration}`,
      ).toBe(true);
    }
    // …the role rule sets the same properties, and is less specific (it wins only in its layer).
    const role = roleRules.filter(
      (rule) => rule.prelude === scopeComplexSelector(restoration.role),
    );
    expect(role.length, restoration.role).toBeGreaterThan(0);
    const roleProperties = new Set(
      role.flatMap((rule) =>
        declarations(rule.block).map((declaration) => declaration.split(':')[0]!),
      ),
    );
    for (const declaration of restored) {
      const property = declaration.split(':')[0]!;
      // The property itself, or the margin / padding shorthand that sets it.
      const covered =
        roleProperties.has(property) ||
        ['margin', 'padding'].some(
          (shorthand) => roleProperties.has(shorthand) && property.startsWith(`${shorthand}-`),
        );
      expect(covered, `${restoration.role} ${property}`).toBe(true);
    }
    expect(
      outranks(specificity(restoration.refined), specificity(restoration.role)),
      `${restoration.refined} outranks ${restoration.role}`,
    ).toBe(true);
  }
}

/** The product classes one patch (`V3P-nn`) names, up to the next patch. */
function patchClasses(id: string): Set<string> {
  const start = patch.indexOf(`V3P-${id} ·`);
  const next = patch.indexOf(`V3P-${String(Number(id) + 1).padStart(2, '0')} ·`, start + 1);
  const text = patch.slice(start, next < 0 ? undefined : next);
  return new Set([...text.matchAll(/\.(rk-x-[\w-]+)/g)].map((name) => name[1]!));
}

describe('patch.css (V3P-nn)', () => {
  const selectors = rulesOf(patch)
    .filter((rule) => !rule.prelude.startsWith('@'))
    .flatMap((rule) => splitTopLevel(rule.prelude, ','))
    .map((part) => part.trim());

  it('confines every rule to a V3 root and, except the island rule itself, outside islands', () => {
    expect(selectors.length).toBeGreaterThan(0);
    for (const selector of selectors.filter((candidate) => candidate !== APP_ROOT_CONTAINER)) {
      expect(/:where\(\.xr(?: \*)?\)|^\.rb\.rk-x-/.test(selector), selector).toBe(true);
      if (selector !== ':where(.xr) [data-xr-v46]') {
        expect(selector, selector).toContain(ISLAND_EXCLUSION);
      }
    }
  });

  it('V3P-09: outside a V3 root it only names a container, on a v46 app root holding a region', () => {
    expect(selectors.filter((selector) => !/\.xr|\.rb/.test(selector))).toEqual([]);
    const outside = rulesOf(patch).filter((rule) => rule.prelude === APP_ROOT_CONTAINER);
    expect(outside).toHaveLength(1);
    expect(outside[0]!.block.trim()).toBe('container-name: xr-app rb;');
  });

  it('uses only the allow-listed product classes, and each one', () => {
    const product = new Set([...patch.matchAll(/\.(rk-x-[\w-]+)/g)].map((match) => match[1]));
    expect([...product].sort()).toEqual([...V3_PRODUCT_CLASS_ALLOW_LIST].sort());
  });

  it('numbers its patches V3P-01 … V3P-16 in order; V3P-06 and V3P-07 are retired, not reused', () => {
    expect([...patch.matchAll(/V3P-(\d\d) ·/g)].map((match) => match[1])).toEqual([
      '01',
      '02',
      '03',
      '04',
      '05',
      '06',
      '07',
      '08',
      '09',
      '10',
      '11',
      '12',
      '13',
      '14',
      '15',
      '16',
    ]);
    for (const retired of ['06', '07']) {
      expect(patch).toMatch(new RegExp(`V3P-${retired} · retired`));
    }
  });

  it("V3P-12: the Super Admin export's inline spacings, on the element it styles, as it writes them", () => {
    const views = ['a', 'b', 'c', 'd']
      .map((part) => readFileSync(join(saRole.directory, 'project', `sa-views-${part}.js`), 'utf8'))
      .join('\n');
    /** Patched element (its export class + the product class) → the declarations, as written. */
    const SPACINGS: Record<string, { readonly css: string; readonly exported: readonly string[] }> =
      {
        '.rk-small.rk-x-small-flush': {
          css: 'margin: 0;',
          exported: ['<span class="rk-small" style="margin:0">'],
        },
        '.rk-hint.rk-x-hint-table': {
          css: 'margin-top: 10px;',
          exported: ['<p class="rk-hint" style="margin-top:10px">'],
        },
        '.rk-hint.rk-x-hint-list': {
          css: 'margin-top: 12px;',
          exported: ['</dl><p class="rk-hint" style="margin-top:12px">'],
        },
        '.rk-next.rk-x-next-above': {
          css: 'margin-top: 12px;',
          exported: [
            '</blockquote><p class="rk-next" style="margin-top:12px">',
            '<p class="rk-next" style="margin-top:12px"><a class="rb-link"',
          ],
        },
        '.rk-next.rk-x-next-below': {
          css: 'margin-bottom: 12px;',
          exported: ['<p class="rk-next" style="margin-bottom:12px">'],
        },
        '.rk-ask.rk-x-ask-above': {
          css: 'margin-top: 14px;',
          exported: ['<div class="rk-ask" style="margin-top:14px">'],
        },
        '.rb-sec-head.rk-x-sec-head-tight': {
          css: 'margin-bottom: -12px;',
          exported: ['<div class="rb-sec-head" style="margin-bottom: -12px">'],
        },
        '.rk-loading-msg.rk-x-queue-flush': {
          css: 'padding-left: 0;',
          exported: [
            '<section class="rb-queue" aria-busy="true"><p class="rk-loading-msg" role="status" style="padding-left:0">',
          ],
        },
        '.rk-skel-row.rk-x-queue-flush': {
          css: 'padding-left: 0; padding-right: 0;',
          exported: [
            '<div class="rk-skel-row" aria-hidden="true" style="padding-left:0;padding-right:0">',
          ],
        },
      };
    const rules = rulesOf(patch);
    for (const [element, spacing] of Object.entries(SPACINGS)) {
      const found = rules.filter(
        (rule) => rule.prelude === `${SCOPE_PREFIX}${element}${ISLAND_EXCLUSION}`,
      );
      expect(found, element).toHaveLength(1);
      expect(found[0]!.block.replace(/\s+/g, ' ').trim(), element).toBe(spacing.css);
      for (const markup of spacing.exported) expect(views, element).toContain(markup);
    }
    expect([...patchClasses('12')].sort()).toEqual(
      [...new Set(Object.keys(SPACINGS).map((element) => element.split('.').at(-1)!))].sort(),
    );
  });

  it("V3P-13: the Vendor export's inline spacings, on the element it styles, as it writes them", () => {
    const main = readFileSync(join(veRole.directory, 'project', 'Main.dc.html'), 'utf8');
    /** The export's template: the markup before its logic script. */
    const template = main.slice(0, main.indexOf('<script type="text/x-dc"'));
    /** Patched element (its export class + the product class) → the declarations, as written. */
    const SPACINGS: Record<string, { readonly css: string; readonly exported: readonly string[] }> =
      {
        '.rk-ferr.rk-x-ferr-above': {
          css: 'margin-top: 10px;',
          exported: ['<p class="rk-ferr" id="f-fmts-e" style="margin-top: 10px">'],
        },
        '.ve-intro.rk-x-intro-below': {
          css: 'margin-bottom: 10px;',
          exported: [
            '<p class="ve-intro" style="margin-bottom: 10px">One set for every format.</p><ol class="ve-los"><sc-for list="{{ E.outcomes }}"',
            '<p class="ve-intro" style="margin-bottom: 10px">One set for every format.</p><ol class="ve-los"><sc-for list="{{ R.outcomes }}"',
          ],
        },
        '.rk-eyebrow.rk-x-eyebrow-flush': {
          css: 'margin: 0;',
          exported: ['<p class="rk-eyebrow" style="margin: 0">{{ E.refEyebrow }}</p>'],
        },
      };
    const rules = rulesOf(patch);
    for (const [element, spacing] of Object.entries(SPACINGS)) {
      const found = rules.filter(
        (rule) => rule.prelude === `${SCOPE_PREFIX}${element}${ISLAND_EXCLUSION}`,
      );
      expect(found, element).toHaveLength(1);
      expect(found[0]!.block.replace(/\s+/g, ' ').trim(), element).toBe(spacing.css);
      for (const markup of spacing.exported) expect(template, element).toContain(markup);
    }
    expect([...patchClasses('13')].sort()).toEqual(
      [...new Set(Object.keys(SPACINGS).map((element) => element.split('.').at(-1)!))].sort(),
    );
    /*
     * Every other `style=` of the export is accounted for: the hidden icon sprite and the stroke
     * styles of its `<svg><use>` icons (the product draws each icon inline through the kit's
     * `Glyph` / `ButtonLink` / `Button` icons, `svg.xr-ico`), and the borrowed XS surfaces the
     * delivered XS components draw (XS-07 "My reports", its form's error summary and a report's
     * detail; the drawer's brand, the shell's).
     */
    const NOT_PATCHED = [
      '<svg width="0" height="0" style="position: absolute; overflow: hidden" aria-hidden="true" focusable="false">',
      'style="fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round"><use href="#vei-plus">',
      'style="fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round"><use href="#vei-left">',
      'style="fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round"><use href="#vei-right">',
      '<div class="rk-sec" style="padding-bottom: 8px"><div class="rk-sec-h" style="margin-bottom: 0"><h2 class="rb-h2" id="ve-rep-h">My reports</h2>',
      '<div class="rk-errsum" id="ve-errs" tabindex="-1" role="alert" style="max-width: 820px"><p class="rk-errsum-t">One thing needs fixing</p>',
      '<section class="rk-surface" aria-labelledby="ve-repd-h" style="max-width: 880px">',
      '<div class="rb-brand" style="padding-top: 0">',
    ];
    const accounted = [
      ...Object.values(SPACINGS).flatMap((spacing) => spacing.exported),
      ...NOT_PATCHED,
    ];
    const styled = [...template.matchAll(/style="[^"]*"/g)].length;
    for (const markup of accounted) expect(template, markup).toContain(markup);
    const stylesIn = (markup: string) => (markup.match(/style="/g) ?? []).length;
    const occurrences = accounted.reduce(
      (count, markup) => count + (template.split(markup).length - 1) * stylesIn(markup),
      0,
    );
    expect(occurrences, 'each export style= is patched or recorded as not patched').toBe(styled);
  });

  it("V3P-13: the export's cascade — the Refined B declaration that wins there, on the elements both rules match", () => {
    // The Vendor rules (v3-vendor.css) that win only by their layer, and what the export shows.
    const CASCADE: readonly Restoration[] = [
      {
        patch: '.rk-fieldset legend.vr-legend',
        refined: '.rk-fieldset legend',
        role: '.vr-legend',
        css: 'margin-bottom: 10px;',
      },
      {
        patch: '.rk-fieldset legend > span.vr-sec-t',
        refined: '.rk-fieldset legend > span:not(.sc-interp)',
        role: '.vr-sec-t',
        css: 'font: 400 14.5px/21px var(--sans); color: var(--ink-3);',
      },
      {
        patch: '.rk-fieldset legend > span.vr-sec-d',
        refined: '.rk-fieldset legend > span:not(.sc-interp)',
        role: '.vr-sec-d',
        css: 'margin-top: 2px;',
      },
      {
        patch: '.rb-btn--ghost.vr-chg',
        refined: '.rb .rb-btn--ghost',
        role: '.vr-chg',
        css: 'min-height: 40px;',
      },
      {
        patch: '.rk-rowlink.vr-name',
        refined: '.rb .rk-rowlink',
        role: '.vr-name',
        css: 'display: inline; color: var(--navy); font: 650 16.5px/23px var(--sans);',
      },
      {
        patch: '.rk-rowlink.vr-name:hover',
        refined: '.rb .rk-rowlink:hover',
        role: '.vr-name:hover',
        css: 'color: var(--navy);',
      },
      {
        patch: '.vr-linkbtn:focus-visible',
        refined: '.xr :where(a,button,input,select,textarea,[tabindex]):focus-visible',
        role: '.vr-linkbtn',
        css: 'border-radius: 6px;',
      },
      {
        patch: '.vr-ret:focus-visible',
        refined: '.xr :where(a,button,input,select,textarea,[tabindex]):focus-visible',
        role: '.vr-ret',
        css: 'border-radius: 6px;',
      },
    ];
    expectRestorations(CASCADE, veDerived);
  });

  it("V3P-14: the Content Manager export's inline spacings, on the element it styles, as it writes them", () => {
    const main = readFileSync(join(cmRole.directory, 'project', 'Main.dc.html'), 'utf8');
    /** The export's template: the markup before its logic script. */
    const template = main.slice(0, main.indexOf('<script type="text/x-dc"'));
    /** Patched element (its export class + the product class) → the declarations, as written. */
    const SPACINGS: Record<string, { readonly css: string; readonly exported: readonly string[] }> =
      {
        '.cm-grp-head.rk-x-grp-head-side': {
          css: 'margin-bottom: 8px;',
          exported: ['<div class="cm-grp-head" style="margin-bottom: 8px">'],
        },
        '.cm-sidecard-t.rk-x-sidecard-t-flush': {
          css: 'margin-bottom: 0;',
          exported: ['<h2 class="cm-sidecard-t" id="cm-others-h" style="margin-bottom: 0">'],
        },
        'p.rk-x-calm-foot': {
          css: 'padding: 0 0 18px;',
          exported: [
            '<p style="padding: 0 0 18px"><a class="rb-link" href="#cm-main" data-to="CM-04" onClick="{{ goLibrary }}">Open the Content library</a></p>',
          ],
        },
        '.rk-fmts.rk-x-fmts-flush': {
          css: 'margin-top: 0;',
          exported: [
            '<p class="cm-cat-avail">Available in <span class="rk-fmts" style="margin-top: 0" aria-label="{{ D.fmtAria }}">',
            '<p class="cm-cat-avail">Available in <span class="rk-fmts" style="margin-top: 0" aria-label="{{ P.fmtAria }}">',
            '<td class="rk-c-exp"><span class="rk-fmts" style="margin-top: 0" aria-label="{{ r.fmtAria }}">',
          ],
        },
        'th.rk-c-inst.rk-x-lib-col': {
          css: 'width: 34%;',
          exported: ['<th scope="col" class="rk-c-inst" style="width: 34%">Experiment</th>'],
        },
        'th.rk-c-exp.rk-x-lib-col': {
          css: 'width: 17%;',
          exported: ['<th scope="col" class="rk-c-exp" style="width: 17%">Formats</th>'],
        },
        'th.rk-c-type.rk-x-lib-col': {
          css: 'width: 16%;',
          exported: ['<th scope="col" class="rk-c-type" style="width: 16%">{{ L.h3 }}</th>'],
        },
        'th.rk-c-date.rk-x-lib-col': {
          css: 'width: 13%;',
          exported: ['<th scope="col" class="rk-c-date" style="width: 13%">{{ L.h4 }}</th>'],
        },
        'th.rk-c-st.rk-x-lib-col': {
          css: 'width: 20%;',
          exported: ['<th scope="col" class="rk-c-st" style="width: 20%">Where it is</th>'],
        },
        '.rk-h3.rk-x-h3-sub': {
          css: 'margin: 24px 0 10px;',
          exported: ['<h3 class="rk-h3" style="margin: 24px 0 10px">Delivery by format</h3>'],
        },
        'ul.rk-x-pending-list': {
          css: 'margin-top: 4px; padding-left: 18px; list-style: disc;',
          exported: [
            '<div><p>{{ D.blockText }}</p><ul style="margin-top: 4px; padding-left: 18px; list-style: disc">',
          ],
        },
        'li.rk-x-pending-item': {
          css: 'font-weight: 500;',
          exported: ['<li style="font-weight: 500">{{ b }}</li>'],
        },
        '.rk-textarea.rk-x-textarea-short': {
          css: 'min-height: 80px;',
          exported: ['<textarea id="cm-u-summary" class="rk-textarea" style="min-height: 80px"'],
        },
        '.rk-textarea.rk-x-textarea-long': {
          css: 'min-height: 150px;',
          exported: ['<textarea id="cm-u-desc" class="rk-textarea" style="min-height: 150px"'],
        },
        '.rk-ferr.rk-x-ferr-below': {
          css: 'margin-bottom: 10px;',
          exported: ['<p class="rk-ferr" id="cm-u-chg-err" style="margin-bottom: 10px">'],
        },
        '.rk-notice-d.rk-x-notice-more': {
          css: 'grid-column: 2; margin-top: 6px;',
          exported: [
            '<p class="rk-notice-d" style="grid-column: 2; margin-top: 6px"><b>Reason:</b> {{ E.nQuote }}</p>',
            '<p class="rk-notice-d" style="grid-column: 2; margin-top: 6px">{{ E.nExtra }}</p>',
          ],
        },
        'p.rk-x-errsum-line': {
          css: 'margin-top: 4px; font: 500 15px/22px var(--sans);',
          exported: [
            '<p style="margin-top: 4px; font: 500 15px/22px var(--sans)">Your changes are still on this page.',
            '<p style="margin-top: 4px; font: 500 15px/22px var(--sans)">Nothing has changed. Your edits are still in the table.',
          ],
        },
        '.rb-btn.rk-x-errsum-retry': {
          css: 'margin-top: 10px;',
          exported: [
            '<button type="button" class="rb-btn" style="margin-top: 10px" onClick="{{ E.save }}">Try again</button>',
            '<button type="button" class="rb-btn" style="margin-top: 10px" onClick="{{ K.save }}">Try again</button>',
          ],
        },
        '.cm-hold-d.rk-x-hold-d-flush': {
          css: 'margin-top: 0;',
          exported: [
            '<p class="cm-hold-d" style="margin-top: 0">Institute Admins keep their own code',
          ],
        },
        '.rk-dlg-body.rk-x-dlg-body-tight': {
          css: 'padding-bottom: 12px;',
          exported: ['<div class="rk-dlg-body" style="padding-bottom: 12px">'],
        },
      };
    const rules = rulesOf(patch);
    for (const [element, spacing] of Object.entries(SPACINGS)) {
      const found = rules.filter(
        (rule) => rule.prelude === `${SCOPE_PREFIX}${element}${ISLAND_EXCLUSION}`,
      );
      expect(found, element).toHaveLength(1);
      expect(found[0]!.block.replace(/\s+/g, ' ').trim(), element).toBe(spacing.css);
      for (const markup of spacing.exported) expect(template, element).toContain(markup);
    }
    expect([...patchClasses('14')].sort()).toEqual(
      [...new Set(Object.keys(SPACINGS).map((element) => element.split('.').at(-1)!))].sort(),
    );
    // V3P-14 holds these rules and no other: comparing the export's unlayered cascade with the
    // product's layered one on every Content Manager state found no `cm-` rule that wins only by
    // its layer, so nothing is restored (a restoration would be listed and checked as V3P-13's).
    const start = patch.indexOf('V3P-14 ·');
    expect(start).toBeGreaterThan(0);
    expect(
      rulesOf(patch.slice(patch.indexOf('*/', start) + 2, patch.indexOf('/*\n * V3P-15 ·')))
        .map((rule) => rule.prelude)
        .sort(),
    ).toEqual(
      Object.keys(SPACINGS)
        .map((element) => `${SCOPE_PREFIX}${element}${ISLAND_EXCLUSION}`)
        .sort(),
    );
    expect(patch.slice(start, patch.indexOf('V3P-15 ·'))).toContain(
      'finds no element where they differ',
    );
    /*
     * One spacing is an earlier patch's: the note under CM-03's delivery rows is 12 px under the
     * rows as V3P-12's note under a list (`Hint under="list"`, `rk-x-hint-list`).
     */
    const REUSED = {
      element: '.rk-hint.rk-x-hint-list',
      css: 'margin-top: 12px;',
      exported:
        '<p class="rk-hint" style="margin-top: 12px">The experiment is published with all of its formats.',
    };
    const reused = rules.filter(
      (rule) => rule.prelude === `${SCOPE_PREFIX}${REUSED.element}${ISLAND_EXCLUSION}`,
    );
    expect(reused).toHaveLength(1);
    expect(reused[0]!.block.replace(/\s+/g, ' ').trim()).toBe(REUSED.css);
    /*
     * Every other `style=` of the export is accounted for: the hidden icon sprite (the product
     * draws each icon inline), the drawer brand's `padding-top: 0` (the shell's; `.rb-brand` has
     * no top padding) and the public-page handoff frame (`cm-pub`, preview-only: "View the public
     * page" opens the product's PU-06 route).
     */
    const NOT_PATCHED = [
      '<svg width="0" height="0" style="position: absolute; overflow: hidden" aria-hidden="true" focusable="false">',
      '<div class="rb-brand" style="padding-top: 0">',
      '<p class="cm-cat-sum" style="margin-top: 0">{{ B.summary }}</p>',
      '<span class="rk-fmts" style="margin-top: 0" aria-label="{{ B.fmtAria }}">',
    ];
    const accounted = [
      ...Object.values(SPACINGS).flatMap((spacing) => spacing.exported),
      REUSED.exported,
      ...NOT_PATCHED,
    ];
    const styled = [...template.matchAll(/style="[^"]*"/g)].length;
    for (const markup of accounted) expect(template, markup).toContain(markup);
    const stylesIn = (markup: string) => (markup.match(/style="/g) ?? []).length;
    const occurrences = accounted.reduce(
      (count, markup) => count + (template.split(markup).length - 1) * stylesIn(markup),
      0,
    );
    expect(occurrences, 'each export style= is patched or recorded as not patched').toBe(styled);
  });

  it("V3P-15: the Academic Reviewer export's inline styles — none needs a new rule", () => {
    const main = readFileSync(join(rvRole.directory, 'project', 'RV.dc.html'), 'utf8');
    /** The export's template: the markup before its logic script. */
    const template = main.slice(0, main.indexOf('<script type="text/x-dc"'));
    // V3P-15 adds no product class: it restores the export's cascade only.
    expect([...patchClasses('15')]).toEqual([]);
    /*
     * The one product spacing is an earlier patch's: the re-check block's line 12 px under the
     * quote (RV-03) is V3P-12's line under a quote (`RecordLine space="above"`, `rk-x-next-above`).
     */
    const REUSED = {
      element: '.rk-next.rk-x-next-above',
      css: 'margin-top: 12px;',
      exported:
        '<p class="rk-next" style="margin-top: 12px">Check it again and approve, or return it to the vendor.</p>',
    };
    const reused = rulesOf(patch).filter(
      (rule) => rule.prelude === `${SCOPE_PREFIX}${REUSED.element}${ISLAND_EXCLUSION}`,
    );
    expect(reused).toHaveLength(1);
    expect(reused[0]!.block.replace(/\s+/g, ' ').trim()).toBe(REUSED.css);
    /*
     * Every other `style=` of the export is accounted for: the hidden icon sprite (the product
     * draws each icon inline), the borrowed XS surfaces the delivered XS components draw (Help &
     * support "My reports", the Report a problem form, a report's detail) and the drawer brand's
     * `padding-top: 0` (the shell's; `.rb-brand` has no top padding).
     */
    const NOT_PATCHED = [
      '<svg width="0" height="0" style="position: absolute; overflow: hidden" aria-hidden="true" focusable="false">',
      '<section aria-labelledby="rv-hp-h" style="display: flex; flex-direction: column; gap: 14px">',
      '<div class="rk-surface" style="max-width: 760px">\n        <div class="rk-sec" style="display: flex; flex-direction: column; gap: 20px">',
      '<div class="rk-surface" style="max-width: 860px">',
      '<div class="rb-brand" style="padding-top: 0">',
    ];
    const accounted = [REUSED.exported, ...NOT_PATCHED];
    const styled = [...template.matchAll(/style="[^"]*"/g)].length;
    expect(styled).toBe(7);
    for (const markup of accounted) expect(template, markup).toContain(markup);
    const stylesIn = (markup: string) => (markup.match(/style="/g) ?? []).length;
    const occurrences = accounted.reduce(
      (count, markup) => count + (template.split(markup).length - 1) * stylesIn(markup),
      0,
    );
    expect(occurrences, 'each export style= is patched or recorded as not patched').toBe(styled);
  });

  it("V3P-15: the Academic Reviewer export's cascade — the Refined B declaration that wins there, on the elements both rules match", () => {
    // The Reviewer rules (rv.css) that win only by their layer, and what the export shows.
    const CASCADE: readonly Restoration[] = [
      {
        patch: '.rv-filecard:focus-visible',
        refined: '.xr :where(a,button,input,select,textarea,[tabindex]):focus-visible',
        role: '.rv-filecard',
        css: 'border-radius: 6px;',
      },
      {
        patch: '.rv-lo-msg:focus-visible',
        refined: '.xr :where(a,button,input,select,textarea,[tabindex]):focus-visible',
        role: '.rv-lo-msg',
        css: 'border-radius: 6px;',
      },
    ];
    expectRestorations(CASCADE, rvDerived);
    // V3P-15 holds these rules and no other.
    const start = patch.indexOf('V3P-15 ·');
    expect(start).toBeGreaterThan(0);
    expect(
      rulesOf(patch.slice(patch.indexOf('*/', start) + 2, patch.indexOf('/*\n * V3P-16 ·')))
        .flatMap((rule) => splitTopLevel(rule.prelude, ','))
        .map((part) => part.trim())
        .sort(),
    ).toEqual(
      CASCADE.map((restoration) => `${SCOPE_PREFIX}${restoration.patch}${ISLAND_EXCLUSION}`).sort(),
    );
  });

  it("V3P-16: the Institute Admin export's inline sizes, on the element it styles, as it writes them", () => {
    const main = readFileSync(join(iaRole.directory, 'project', 'Main.dc.html'), 'utf8');
    /** The export's template: the markup before its logic script. */
    const template = main.slice(0, main.indexOf('<script type="text/x-dc"'));
    /**
     * Patched element (its export class + the product class) → the declarations as the export writes
     * them inline. Each value maps to one product class (`IA_PATCHED_STYLES`, which the component
     * tests use to read the export's markup with the classes in place of the styles).
     */
    const SIZES: Record<string, string> = {
      '.rk-surface.rk-x-surface-msg': 'max-width: 760px',
      '.rk-state-ico.rk-x-state-ico-flush': 'margin: 0',
      '.rk-field.rk-x-field-select': 'max-width: 520px',
      '.rk-field.rk-x-field-count': 'max-width: 320px',
      '.ia-row.rk-x-row-end': 'align-items: flex-end',
      '.rk-search.rk-x-search-grow': 'flex: 1 1 320px',
      '.rk-count.rk-x-count-low': 'margin-bottom: 10px',
      '.rk-search.rk-x-search-panel': 'max-width: 420px',
      '.ia-row.rk-x-row-center': 'justify-content: center',
      '.ia-row.rk-x-row-tight': 'gap: 6px 8px',
      '.rk-choice.rk-x-choice-plain': 'grid-template-columns: minmax(0, 1fr)',
      '.ia-row.rk-x-row-snug': 'gap: 6px 10px',
      '.xr-ico.rk-x-ico-lead': 'vertical-align: -4px; margin-right: 6px',
      '.xr-ico.rk-x-ico-file': 'color: #3B49B8',
      '.rk-next.rk-x-next-lead': 'font-size: 17px; line-height: 26px; color: #141B5E',
      '.rk-h3.rk-x-h3-above': 'margin-bottom: 12px',
      '.rk-ferr.rk-x-ferr-group': 'margin-top: 8px',
      '.rk-label.rk-x-label-above': 'margin-bottom: 8px',
    };
    /** One earlier patch's: the badges' `margin-top: 0` is V3P-14's `rk-x-fmts-flush`. */
    const REUSED: Record<string, string> = { '.rk-fmts.rk-x-fmts-flush': 'margin-top: 0' };
    /** Declarations compared as written (prettier writes a hex colour in lower case). */
    const declared = (css: string) => declarations(css.toLowerCase()).join('; ');
    const rules = rulesOf(patch);
    for (const [element, style] of Object.entries({ ...SIZES, ...REUSED })) {
      const found = rules.filter(
        (rule) => rule.prelude === `${SCOPE_PREFIX}${element}${ISLAND_EXCLUSION}`,
      );
      expect(found, element).toHaveLength(1);
      expect(declared(found[0]!.block), element).toBe(declared(style));
    }
    expect([...patchClasses('16')].sort()).toEqual(
      Object.keys(SIZES)
        .map((element) => element.split('.').at(-1)!)
        .sort(),
    );
    // The component tests read the export with the same classes in place of the same styles.
    expect(
      Object.fromEntries(
        Object.entries({ ...SIZES, ...REUSED }).map(([element, style]) => [
          style,
          element.split('.').at(-1)!,
        ]),
      ),
    ).toEqual(IA_PATCHED_STYLES);
    /*
     * The `style=` the product does not patch, each with why: the nine term-bar lengths only the
     * plan's dates decide (the recorded `inline-style` scan exception, `IaTermBar`); the hidden icon
     * sprite (the product draws each icon inline); the preview start page and handoff pages, the
     * in-page preview notes and the preview's sample-file chooser (`ia-pv*`; the product opens the
     * browser's own chooser); the borrowed XS surfaces (Help & support's "Report a problem"
     * screenshot field, "Report sent", a report's detail; the signed-out page) and the drawer
     * brand's `padding-top: 0` (the shell's); and what the product does not draw — the not-found
     * cards (IA-07, IA-09, IA-17, IA-19 keep the in-shell not-found page), IA-17's refused form
     * (the product does not offer the form while paused or without a plan), IA-14's "Create group"
     * page (a dialog in the product, decision D-06) and IA-05 step 1's "Already given to …" line.
     */
    const NOT_PATCHED = [
      '<svg width="0" height="0" style="position: absolute; overflow: hidden" aria-hidden="true" focusable="false">',
      '<span class="ia-tt-fill" style="width: {{ V.T2.fill }}">',
      '<span class="ia-tt-rest" style="width: {{ V.T2.rest }}">',
      '<span class="ia-tt-today" style="left: {{ V.T2.fill }}">',
      '<div class="rb" style="display: block">\n  <div class="ia-pv">',
      '<div class="rk-sec" style="padding-top: 0; border-top: 0"><p class="ia-pv-note">',
      '<p class="ia-pv-note" style="margin-top: 14px">',
      '<button type="button" class="rk-choice" id="{{ f.id }}" style="text-align: left; font: inherit" onClick="{{ f.pick }}"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true" style="grid-row: 1 / span 2; color: #3B49B8">',
      '<input id="ia-dlg-file" class="rk-input" type="file" accept=".csv,text/csv" style="height: auto; padding: 9px 12px"',
      '<input id="hp-shot" class="rk-input" type="file" accept="image/*" style="height: auto; padding: 9px 12px"',
      '<section class="rk-surface" aria-labelledby="ia-h1" style="max-width: 760px">\n          <div class="rk-sec ia-stack ia-stack--tight">\n            <span class="rk-state-ico" aria-hidden="true" style="margin: 0"><svg viewBox="0 0 24 24"><use href="#rki-check"></use></svg></span>\n            <h1 class="rb-h2" id="ia-h1" tabindex="-1">Report',
      '<div class="rk-surface" style="max-width: 860px">\n          <section class="rk-sec" aria-labelledby="hd-w-h">\n            <h2 class="rb-h2" id="hd-w-h" style="margin-bottom: 14px">',
      '<h2 class="rb-h2" id="hd-h-h" style="margin-bottom: 14px">History</h2>',
      '<button type="button" class="rk-clear" style="padding: 0" onClick="{{ V.toForm }}">Report a problem</button>',
      '<div class="rb" style="display: block">\n  <div class="ia-out">',
      '<span class="rk-state-ico" aria-hidden="true" style="margin: 0"><svg viewBox="0 0 24 24"><use href="#rki-out"></use></svg></span>',
      '<div class="rb-brand" style="padding-top: 0">',
      '<h2 class="rb-h2" id="hf-h" style="margin-bottom: 14px">What happens there</h2>',
      '<h2 class="rb-h2" style="margin-bottom: 10px">Why it isn’t live here</h2>',
      '<section class="rk-surface" aria-labelledby="ia-h1" style="max-width: 760px">\n          <div class="rk-sec ia-stack ia-stack--tight">\n            <h1 class="rb-h2" id="ia-h1" tabindex="-1">This student isn’t in People</h1>',
      '<section class="rk-surface" aria-labelledby="ia-h1" style="max-width: 760px">\n          <div class="rk-sec ia-stack ia-stack--tight">\n            <h1 class="rb-h2" id="ia-h1" tabindex="-1">This faculty member isn’t in People</h1>',
      '<section class="rk-surface" aria-labelledby="ia-h1" style="max-width: 760px"><div class="rk-sec ia-stack ia-stack--tight"><h1 class="rb-h2" id="ia-h1" tabindex="-1">We can’t find that request</h1>',
      '<section class="rk-surface" aria-labelledby="ia-h1" style="max-width: 760px"><div class="rk-sec ia-stack ia-stack--tight"><h1 class="rb-h2" id="ia-h1" tabindex="-1">No device request to review</h1>',
      '<section class="rk-surface" aria-labelledby="ia-h1" style="max-width: 760px">\n          <div class="rk-sec ia-stack ia-stack--tight">\n            <span class="rk-state-ico" aria-hidden="true" style="margin: 0"><sc-if value="{{ V.refPaused }}"',
      '<div class="rk-field" style="max-width: 520px">\n              <label class="rk-label" for="gn-name">Group name</label>',
      '<span class="rk-choice-d" style="grid-column: 2">{{ e.why }}</span>',
    ];
    /** Where in the template each not-patched markup is (it never overlaps another). */
    const spans: [number, number][] = [];
    for (const markup of NOT_PATCHED) {
      expect(template, markup).toContain(markup);
      for (let at = template.indexOf(markup); at >= 0; at = template.indexOf(markup, at + 1)) {
        expect(
          spans.some(([from, to]) => at < to && at + markup.length > from),
          markup,
        ).toBe(false);
        spans.push([at, at + markup.length]);
      }
    }
    // Every other `style=` of the template is on a product element: one of the sizes above, on an
    // element that carries the patch rule's export class.
    const tag = /<([a-z][\w-]*)([^<>]*?)\sstyle="([^"]*)"([^<>]*)>/g;
    let patched = 0;
    let notPatched = 0;
    for (const match of template.matchAll(tag)) {
      const at = match.index + match[0].indexOf(' style="');
      if (spans.some(([from, to]) => at >= from && at < to)) {
        notPatched += 1;
        continue;
      }
      const style = match[3]!;
      const element = Object.entries({ ...SIZES, ...REUSED }).find(([, css]) => css === style);
      expect(
        element,
        `${match[0].slice(0, 100)} is patched or recorded as not patched`,
      ).toBeDefined();
      const exportClass = element![0].split('.')[1]!;
      const classes = /\sclass="([^"]*)"/.exec(`${match[2]!}${match[4]!}`)?.[1]?.split(/\s+/) ?? [];
      expect(classes, `${match[0].slice(0, 100)} carries .${exportClass}`).toContain(exportClass);
      patched += 1;
    }
    const styled = [...template.matchAll(/style="[^"]*"/g)].length;
    expect(styled).toBe(73);
    expect(patched).toBe(35);
    expect(patched + notPatched, 'each export style= is patched or recorded as not patched').toBe(
      styled,
    );
    // V3P-16 holds these rules and no other, and restores nothing: comparing the export's unlayered
    // cascade with the product's layered one on every Institute Admin state found no `ia-` rule
    // that wins only by its layer (a restoration would be listed and checked as V3P-15's).
    const start = patch.indexOf('V3P-16 ·');
    expect(start).toBeGreaterThan(0);
    expect(
      rulesOf(patch.slice(patch.indexOf('*/', start) + 2))
        .map((rule) => rule.prelude)
        .sort(),
    ).toEqual(
      Object.keys(SIZES)
        .map((element) => `${SCOPE_PREFIX}${element}${ISLAND_EXCLUSION}`)
        .sort(),
    );
    expect(patch.slice(start)).toContain('finds no element where they differ');
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

describe('generated ve-scoped.css (the Vendor export, design/v3-refined-b/roles/VE-v1)', () => {
  /** What the export says is not product UI (its COMPONENT-EXTENSIONS.md). */
  const LEFT_OUT =
    /\.ve-(?:app|preview|pv-|skip|acct|acctmenu|reports|report|report-t|handoff)(?![\w-]*[a-z0-9])|\.ve-(?:pv-[\w-]+|acct-[\w-]+|preview-t|report-t)/;

  it('is exactly what the generator writes from the locked role sheet', () => {
    expect(veDerived).toBe(renderRoleCss(readRoleInput(veRole)));
  });

  it("is built on this foundation: the export's three base sheets are the locked bytes", () => {
    const exportLock = JSON.parse(
      readFileSync(join(veRole.directory, 'FOUNDATION-LOCK.json'), 'utf8'),
    ) as {
      foundationId: string;
      sharedFilesShipped: Record<string, { sha256: string; byteIdentical: boolean }>;
      localAdditions: Record<string, { sha256: string }>;
      tokenChanges: unknown;
      noIndependentRoleTheme: unknown;
    };
    expect(exportLock.foundationId).toBe(FOUNDATION_ID);
    for (const sheet of SHEETS) {
      expect(exportLock.sharedFilesShipped[`project/${sheet}`]?.sha256, sheet).toBe(
        lock.baseFiles[`references/v3/project/${sheet}`],
      );
      expect(exportLock.sharedFilesShipped[`project/${sheet}`]?.byteIdentical, sheet).toBe(true);
      expect(sha256(readFileSync(join(veRole.directory, 'project', sheet))), sheet).toBe(
        lock.baseFiles[`references/v3/project/${sheet}`],
      );
    }
    expect(exportLock.localAdditions['project/v3-vendor.css']?.sha256).toBe(sha256(veSource));
  });

  it('leaves out only the page canvas, the reviewer bar and the borrowed XS surfaces', () => {
    const left = rulesOf(veSource).filter(
      (rule) => !rule.prelude.startsWith('@') && previewOnlyRule(veRole, rule.prelude),
    );
    expect(left.length).toBeGreaterThan(0);
    for (const rule of left) {
      for (const selector of splitTopLevel(rule.prelude, ',')) {
        expect(selector.trim(), rule.prelude).toMatch(LEFT_OUT);
      }
    }
    expect(veDerived).not.toMatch(
      /\.ve-(?:app|preview|pv-[\w-]+|skip|acct(?:-[\w-]+)?|acctmenu|reports?|report-t|handoff)(?![\w-])/,
    );
    // The role's own primitives and layout patterns stay, those beside a left-out name among them.
    for (const kept of [
      '.ve-steps',
      '.ve-files',
      '.ve-file',
      '.ve-saved',
      '.vr-form',
      '.vr-dlv',
      '.vr-ret',
      '.vr-table',
      '.vr-hist',
    ]) {
      expect(veDerived, kept).toContain(kept);
      expect(previewOnlyRule(veRole, kept)).toBe(false);
    }
    expect(previewOnlyRule(veRole, '.ve-preview,.ve-steps')).toBe(false);
  });

  it('keeps every other declaration block and at-rule in order and changes only selectors', () => {
    // A grouping at-rule whose every rule is left out goes with them: the reviewer bar's two
    // paddings, the Help report rows and the account menu's reduced-motion rule.
    const groups = groupsOf(veSource);
    const dropped = groups.filter(
      (group) =>
        group.rules.length > 0 &&
        group.rules.every((rule) => previewOnlyRule(veRole, rule.prelude)),
    );
    expect(dropped.length).toBe(4);
    for (const group of dropped) {
      for (const rule of group.rules) expect(rule.prelude, group.prelude).toMatch(LEFT_OUT);
    }
    // Every kept grouping at-rule is the source's own prelude, in order.
    expect(groupsOf(veDerived).map((group) => group.prelude)).toEqual(
      groups.filter((group) => !dropped.includes(group)).map((group) => group.prelude),
    );
    // Every kept style rule keeps its block, in order; only its selectors change.
    const expected = rulesOf(veSource).filter(
      (rule) => !rule.prelude.startsWith('@') && !previewOnlyRule(veRole, rule.prelude),
    );
    const scoped = rulesOf(veDerived).filter((rule) => !rule.prelude.startsWith('@'));
    expect(scoped.length).toBe(expected.length);
    scoped.forEach((rule, index) => {
      const source = expected[index]!;
      expect(rule.block, source.prelude).toBe(source.block);
      const before = splitTopLevel(source.prelude, ',').map((part) => part.trim());
      const after = splitTopLevel(rule.prelude, ',').map((part) => part.trim());
      after.forEach((selector, position) => {
        expect(selector).toContain(ISLAND_EXCLUSION);
        expect(selector.replace(SCOPE_PREFIX, '').replace(ISLAND_EXCLUSION, '')).toBe(
          before[position],
        );
      });
    });
  });

  it('selects only ve- and vr- classes (shared classes only under a role parent), no root, URL, keyframes or token', () => {
    for (const rule of rulesOf(veSource).filter(
      (candidate) => !candidate.prelude.startsWith('@'),
    )) {
      for (const selector of splitTopLevel(rule.prelude, ',')) {
        expect(selector, selector).toMatch(/\.v[er]-/);
      }
    }
    expect(veDerived).not.toMatch(/url\(|@import|@keyframes|[{;]\s*--[\w-]+\s*:/);
    expect(
      rulesOf(veDerived).filter((rule) => /(^|[\s,])(:root|html|body)\b/.test(rule.prelude)),
    ).toEqual([]);
  });
});

describe('generated cm-scoped.css (the Content Manager export, design/v3-refined-b/roles/CM-v1)', () => {
  /** What the export says is preview-only, never product UI (its COMPONENT-EXTENSIONS.md). */
  const LEFT_OUT = /\.cm-(?:dock(?:-[\w-]+)?|pub(?:bar|body|logo|prod)?)(?![\w-])/;

  it('is exactly what the generator writes from the locked role sheet', () => {
    expect(cmDerived).toBe(renderRoleCss(readRoleInput(cmRole)));
  });

  it("is built on this foundation: the export's three base sheets are the locked bytes", () => {
    const exportLock = JSON.parse(
      readFileSync(join(cmRole.directory, 'FOUNDATION-LOCK.json'), 'utf8'),
    ) as {
      foundationId: string;
      baseFilesShipped: Record<string, { sha256: string; byteIdentical: boolean }>;
      localAdditions: Record<string, { sha256: string }>;
    };
    expect(exportLock.foundationId).toBe(FOUNDATION_ID);
    for (const sheet of SHEETS) {
      expect(exportLock.baseFilesShipped[`project/${sheet}`]?.sha256, sheet).toBe(
        lock.baseFiles[`references/v3/project/${sheet}`],
      );
      expect(exportLock.baseFilesShipped[`project/${sheet}`]?.byteIdentical, sheet).toBe(true);
      expect(sha256(readFileSync(join(cmRole.directory, 'project', sheet))), sheet).toBe(
        lock.baseFiles[`references/v3/project/${sheet}`],
      );
    }
    expect(exportLock.localAdditions['project/cm.css']?.sha256).toBe(sha256(cmSource));
  });

  it('leaves out only the scenario handoff box and the public-page handoff frame', () => {
    const left = rulesOf(cmSource).filter(
      (rule) => !rule.prelude.startsWith('@') && previewOnlyRule(cmRole, rule.prelude),
    );
    expect(left.length).toBeGreaterThan(0);
    for (const rule of left) {
      for (const selector of splitTopLevel(rule.prelude, ',')) {
        expect(selector.trim(), rule.prelude).toMatch(LEFT_OUT);
      }
    }
    expect(cmDerived).not.toMatch(LEFT_OUT);
    // The role's own components stay.
    for (const kept of ['.cm-pipe', '.cm-qcard', '.cm-trk', '.cm-cat', '.cm-devs', '.cm-codes']) {
      expect(cmDerived, kept).toContain(kept);
      expect(previewOnlyRule(cmRole, kept)).toBe(false);
    }
    expect(previewOnlyRule(cmRole, '.cm-dock,.cm-pipe')).toBe(false);
  });

  it('keeps every other declaration block and at-rule in order and changes only selectors', () => {
    // A grouping at-rule whose every rule is left out goes with them: the public frame's narrow
    // layout.
    const groups = groupsOf(cmSource);
    const dropped = groups.filter(
      (group) =>
        group.rules.length > 0 &&
        group.rules.every((rule) => previewOnlyRule(cmRole, rule.prelude)),
    );
    expect(dropped.length).toBe(1);
    for (const group of dropped) {
      for (const rule of group.rules) expect(rule.prelude, group.prelude).toMatch(LEFT_OUT);
    }
    expect(groupsOf(cmDerived).map((group) => group.prelude)).toEqual(
      groups.filter((group) => !dropped.includes(group)).map((group) => group.prelude),
    );
    const expected = rulesOf(cmSource).filter(
      (rule) => !rule.prelude.startsWith('@') && !previewOnlyRule(cmRole, rule.prelude),
    );
    const scoped = rulesOf(cmDerived).filter((rule) => !rule.prelude.startsWith('@'));
    expect(scoped.length).toBe(expected.length);
    scoped.forEach((rule, index) => {
      const source = expected[index]!;
      expect(rule.block, source.prelude).toBe(source.block);
      const before = splitTopLevel(source.prelude, ',').map((part) => part.trim());
      const after = splitTopLevel(rule.prelude, ',').map((part) => part.trim());
      after.forEach((selector, position) => {
        expect(selector).toContain(ISLAND_EXCLUSION);
        expect(selector.replace(SCOPE_PREFIX, '').replace(ISLAND_EXCLUSION, '')).toBe(
          before[position],
        );
      });
    });
  });

  it('selects only cm- classes (shared classes only under a role parent), no root, URL, keyframes or token', () => {
    for (const rule of rulesOf(cmSource).filter(
      (candidate) => !candidate.prelude.startsWith('@'),
    )) {
      for (const selector of splitTopLevel(rule.prelude, ',')) {
        expect(selector, selector).toMatch(/\.cm-/);
      }
    }
    expect(cmDerived).not.toMatch(/url\(|@import|@keyframes|[{;]\s*--[\w-]+\s*:/);
    expect(
      rulesOf(cmDerived).filter((rule) => /(^|[\s,])(:root|html|body)\b/.test(rule.prelude)),
    ).toEqual([]);
  });
});

describe('generated rv-scoped.css (the Academic Reviewer export, design/v3-refined-b/roles/RV-v1)', () => {
  /** What the export says is borrowed from the shared surfaces, never its product UI (its COMPONENT-EXTENSIONS.md). */
  const LEFT_OUT =
    /\.rv-(?:acctwrap|menu(?:-[\w-]+)?|msg(?:-[\w-]+|page|card)?|file|formact|solo(?:-[\w-]+)?)(?![\w-])/;

  it('is exactly what the generator writes from the locked role sheet', () => {
    expect(rvDerived).toBe(renderRoleCss(readRoleInput(rvRole)));
  });

  it("is built on this foundation: the export's three base sheets are the locked bytes", () => {
    const exportLock = JSON.parse(
      readFileSync(join(rvRole.directory, 'FOUNDATION-LOCK.json'), 'utf8'),
    ) as {
      foundationId: string;
      copiedBaseFiles: Record<string, { sha256: string; lockedAs: string; identical: boolean }>;
      localAdditions: Record<string, { sha256: string }>;
    };
    expect(exportLock.foundationId).toBe(FOUNDATION_ID);
    for (const sheet of SHEETS) {
      const copied = exportLock.copiedBaseFiles[`project/${sheet}`];
      expect(copied?.sha256, sheet).toBe(lock.baseFiles[`references/v3/project/${sheet}`]);
      expect(copied?.lockedAs, sheet).toBe(`references/v3/project/${sheet}`);
      expect(copied?.identical, sheet).toBe(true);
      expect(sha256(readFileSync(join(rvRole.directory, 'project', sheet))), sheet).toBe(
        lock.baseFiles[`references/v3/project/${sheet}`],
      );
    }
    expect(exportLock.localAdditions['project/rv.css']?.sha256).toBe(sha256(rvSource));
  });

  it('leaves out only the borrowed XS surfaces', () => {
    const left = rulesOf(rvSource).filter(
      (rule) => !rule.prelude.startsWith('@') && previewOnlyRule(rvRole, rule.prelude),
    );
    expect(left.length).toBeGreaterThan(0);
    for (const rule of left) {
      for (const selector of splitTopLevel(rule.prelude, ',')) {
        expect(selector.trim(), rule.prelude).toMatch(LEFT_OUT);
      }
    }
    expect(rvDerived).not.toMatch(LEFT_OUT);
    // The role's own components stay, the document cards and the refusal notice among them.
    for (const kept of [
      '.rv-kind',
      '.rv-desk',
      '.rv-qtabs',
      '.rv-idcard',
      '.rv-lowrap',
      '.rv-files',
      '.rv-filecard',
      '.rv-file-ico',
      '.rv-refusal',
    ]) {
      expect(rvDerived, kept).toContain(kept);
      expect(previewOnlyRule(rvRole, kept)).toBe(false);
    }
    expect(previewOnlyRule(rvRole, '.rv-menu,.rv-desk')).toBe(false);
  });

  it('keeps every other declaration block and at-rule in order and changes only selectors', () => {
    // A grouping at-rule whose every rule is left out goes with them: the signed-out page's narrow
    // padding and the account menu's reduced motion.
    const groups = groupsOf(rvSource);
    const dropped = groups.filter(
      (group) =>
        group.rules.length > 0 &&
        group.rules.every((rule) => previewOnlyRule(rvRole, rule.prelude)),
    );
    expect(dropped.length).toBe(2);
    for (const group of dropped) {
      for (const rule of group.rules) expect(rule.prelude, group.prelude).toMatch(LEFT_OUT);
    }
    expect(groupsOf(rvDerived).map((group) => group.prelude)).toEqual(
      groups.filter((group) => !dropped.includes(group)).map((group) => group.prelude),
    );
    const expected = rulesOf(rvSource).filter(
      (rule) => !rule.prelude.startsWith('@') && !previewOnlyRule(rvRole, rule.prelude),
    );
    const scoped = rulesOf(rvDerived).filter((rule) => !rule.prelude.startsWith('@'));
    expect(scoped.length).toBe(expected.length);
    scoped.forEach((rule, index) => {
      const source = expected[index]!;
      expect(rule.block, source.prelude).toBe(source.block);
      const before = splitTopLevel(source.prelude, ',').map((part) => part.trim());
      const after = splitTopLevel(rule.prelude, ',').map((part) => part.trim());
      after.forEach((selector, position) => {
        expect(selector).toContain(ISLAND_EXCLUSION);
        expect(selector.replace(SCOPE_PREFIX, '').replace(ISLAND_EXCLUSION, '')).toBe(
          before[position],
        );
      });
    });
  });

  it('selects only rv- classes (shared classes only under a role parent), no root, URL, keyframes or token', () => {
    for (const rule of rulesOf(rvSource).filter(
      (candidate) => !candidate.prelude.startsWith('@'),
    )) {
      for (const selector of splitTopLevel(rule.prelude, ',')) {
        expect(selector, selector).toMatch(/\.rv-/);
      }
    }
    expect(rvDerived).not.toMatch(/url\(|@import|@keyframes|[{;]\s*--[\w-]+\s*:/);
    expect(
      rulesOf(rvDerived).filter((rule) => /(^|[\s,])(:root|html|body)\b/.test(rule.prelude)),
    ).toEqual([]);
  });
});

describe('generated ia-scoped.css (the Institute Admin export, design/v3-refined-b/roles/IA-v1)', () => {
  /**
   * What the export says is preview chrome or borrowed from the shared surfaces, never its product
   * UI (its COMPONENT-EXTENSIONS.md "Notices, shared and preview parts").
   */
  const LEFT_OUT =
    /\.ia-(?:pv(?:-[\w-]+)?|lt--pv|acctwrap|menu(?:-[\w-]+)?|out(?:-[\w-]+)?)(?![\w-])/;

  it('is exactly what the generator writes from the locked role sheet', () => {
    expect(iaDerived).toBe(renderRoleCss(readRoleInput(iaRole)));
  });

  it("is built on this foundation: the export's three base sheets are the locked bytes", () => {
    // The sixth lock layout: `byteIdenticalCopies["project/core.css"]`, and the local additions
    // as an array of `{ path, sha256 }`.
    const exportLock = JSON.parse(
      readFileSync(join(iaRole.directory, 'FOUNDATION-LOCK.json'), 'utf8'),
    ) as {
      foundationId: string;
      byteIdenticalCopies: Record<
        string,
        { copiedFrom: string; sha256: string; matchesLock: boolean; bytes: number }
      >;
      localAdditions: readonly { path: string; sha256: string; bytes: number }[];
    };
    expect(exportLock.foundationId).toBe(FOUNDATION_ID);
    for (const sheet of SHEETS) {
      const copied = exportLock.byteIdenticalCopies[`project/${sheet}`];
      expect(copied?.sha256, sheet).toBe(lock.baseFiles[`references/v3/project/${sheet}`]);
      expect(copied?.copiedFrom, sheet).toBe(`references/v3/project/${sheet}`);
      expect(copied?.matchesLock, sheet).toBe(true);
      expect(sha256(readFileSync(join(iaRole.directory, 'project', sheet))), sheet).toBe(
        lock.baseFiles[`references/v3/project/${sheet}`],
      );
    }
    expect(Array.isArray(exportLock.localAdditions)).toBe(true);
    const sheet = exportLock.localAdditions.filter((entry) => entry.path === 'project/ia-role.css');
    expect(sheet).toHaveLength(1);
    expect(sheet[0]!.sha256).toBe(sha256(iaSource));
    expect(sheet[0]!.bytes).toBe(Buffer.byteLength(iaSource));
  });

  it('leaves out only the preview chrome and the borrowed XS surfaces', () => {
    const left = rulesOf(iaSource).filter(
      (rule) => !rule.prelude.startsWith('@') && previewOnlyRule(iaRole, rule.prelude),
    );
    expect(left.length).toBeGreaterThan(0);
    for (const rule of left) {
      for (const selector of splitTopLevel(rule.prelude, ',')) {
        expect(selector.trim(), rule.prelude).toMatch(LEFT_OUT);
      }
    }
    expect(iaDerived).not.toMatch(LEFT_OUT);
    // The 25 classes of those families, and no other.
    const classes = (css: string) =>
      new Set(rulesOf(css).flatMap((rule) => rule.prelude.match(/\.ia-[\w-]+/g) ?? []));
    const dropped = [...classes(iaSource)].filter((name) => !classes(iaDerived).has(name));
    expect(dropped.sort()).toEqual(
      [
        '.ia-acctwrap',
        '.ia-lt--pv',
        '.ia-menu',
        '.ia-menu-head',
        '.ia-menu-item',
        '.ia-menu-meta',
        '.ia-menu-name',
        '.ia-menu-sep',
        '.ia-out',
        '.ia-out-head',
        '.ia-out-logo',
        '.ia-out-main',
        '.ia-pv',
        '.ia-pv-btn',
        '.ia-pv-card',
        '.ia-pv-fab',
        '.ia-pv-grid',
        '.ia-pv-id',
        '.ia-pv-meta',
        '.ia-pv-note',
        '.ia-pv-space',
        '.ia-pv-steps',
        '.ia-pv-tag',
        '.ia-pv-type',
        '.ia-pv-wrap',
      ].sort(),
    );
    // The role's own components stay, those whose names start alike among them.
    for (const kept of [
      '.ia-ov-head',
      '.ia-plan',
      '.ia-pick',
      '.ia-pick-row',
      '.ia-lt',
      '.ia-ltwrap',
      '.ia-lt--rq',
      '.ia-lt--dv',
      '.ia-lt--stats',
      '.ia-rec-grid',
      '.ia-gm',
      '.ia-steps',
      '.ia-tt-fill',
      '.ia-btn--danger',
      '.ia-lead--paused',
    ]) {
      expect(iaDerived, kept).toContain(kept);
      expect(previewOnlyRule(iaRole, kept)).toBe(false);
    }
    expect(previewOnlyRule(iaRole, '.ia-menu,.ia-plan')).toBe(false);
    expect(previewOnlyRule(iaRole, '.ia-lt--pv .ia-pv-id')).toBe(true);
  });

  it('keeps every other declaration block and at-rule in order and changes only selectors', () => {
    // A grouping at-rule whose every rule is left out goes with them: the start page's narrow
    // padding and the account menu's narrow width.
    const groups = groupsOf(iaSource);
    const dropped = groups.filter(
      (group) =>
        group.rules.length > 0 &&
        group.rules.every((rule) => previewOnlyRule(iaRole, rule.prelude)),
    );
    expect(dropped.length).toBe(2);
    for (const group of dropped) {
      for (const rule of group.rules) expect(rule.prelude, group.prelude).toMatch(LEFT_OUT);
    }
    expect(groupsOf(iaDerived).map((group) => group.prelude)).toEqual(
      groups.filter((group) => !dropped.includes(group)).map((group) => group.prelude),
    );
    const expected = rulesOf(iaSource).filter(
      (rule) => !rule.prelude.startsWith('@') && !previewOnlyRule(iaRole, rule.prelude),
    );
    const scoped = rulesOf(iaDerived).filter((rule) => !rule.prelude.startsWith('@'));
    expect(scoped.length).toBe(expected.length);
    scoped.forEach((rule, index) => {
      const source = expected[index]!;
      expect(rule.block, source.prelude).toBe(source.block);
      const before = splitTopLevel(source.prelude, ',').map((part) => part.trim());
      const after = splitTopLevel(rule.prelude, ',').map((part) => part.trim());
      after.forEach((selector, position) => {
        expect(selector).toContain(ISLAND_EXCLUSION);
        expect(selector.replace(SCOPE_PREFIX, '').replace(ISLAND_EXCLUSION, '')).toBe(
          before[position],
        );
      });
    });
  });

  it('selects only ia- classes (shared classes only under a role parent), no root, URL, keyframes or token', () => {
    for (const rule of rulesOf(iaSource).filter(
      (candidate) => !candidate.prelude.startsWith('@'),
    )) {
      for (const selector of splitTopLevel(rule.prelude, ',')) {
        expect(selector, selector).toMatch(/\.ia-/);
      }
    }
    expect(iaDerived).not.toMatch(/url\(|@import|@keyframes|[{;]\s*--[\w-]+\s*:/);
    expect(
      rulesOf(iaDerived).filter((rule) => /(^|[\s,])(:root|html|body)\b/.test(rule.prelude)),
    ).toEqual([]);
  });
});

describe('the V3 entry (@xr/ui/styles-v3.css)', () => {
  it('reserves xr.v3 after xr.product and imports the derivatives, then the patches', () => {
    const statements = entry
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .trim()
      .split(';')
      .map((part) => part.trim());
    expect(statements.slice(0, 10)).toEqual([
      '@layer properties, theme, xr.v46, xr.product, xr.v3, utilities',
      '@layer xr.v3.rb, xr.v3.xs, xr.v3.sa, xr.v3.ve, xr.v3.cm, xr.v3.rv, xr.v3.ia, xr.v3.patch',
      "@import './rb-scoped.css' layer(xr.v3.rb)",
      "@import './xs-scoped.css' layer(xr.v3.xs)",
      "@import './sa-scoped.css' layer(xr.v3.sa)",
      "@import './ve-scoped.css' layer(xr.v3.ve)",
      "@import './cm-scoped.css' layer(xr.v3.cm)",
      "@import './rv-scoped.css' layer(xr.v3.rv)",
      "@import './ia-scoped.css' layer(xr.v3.ia)",
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
    expect(ignore.split('\n')).toContain('packages/ui/src/styles/v3/xs-scoped.css');
    expect(ignore.split('\n')).toContain('packages/ui/src/styles/v3/sa-scoped.css');
    expect(ignore.split('\n')).toContain('packages/ui/src/styles/v3/ve-scoped.css');
    expect(ignore.split('\n')).toContain('packages/ui/src/styles/v3/cm-scoped.css');
    expect(ignore.split('\n')).toContain('packages/ui/src/styles/v3/rv-scoped.css');
    expect(ignore.split('\n')).toContain('packages/ui/src/styles/v3/ia-scoped.css');
  });
});
