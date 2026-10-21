/**
 * Test support for the V3 layer (foundation XR-V3-RB-1.0; ADR-0010). Never shipped.
 *
 * - `V3_STYLESHEET_CLASS_NAMES` / `expectV3ClassesOnly`: a rendered V3 component emits only the
 *   classes the V3 stylesheets define (plus the allow-listed `rk-x-*`); inside a v46 island only
 *   v46 classes.
 * - `expectRenderedAsV3Drawn`: a rendered element is exactly a static excerpt of a frozen V3 board
 *   (`design/v3-refined-b/`), once both are normalised — the board's sprite icons (`<use
 *   href="#rki-…">`) inlined from its own symbols, attributes in name order, style values without
 *   spaces.
 * - `expectNoInternalReferences`: the Super Admin rule (owner decision 6) — no REQ-, ACC-, UPD-,
 *   DTR-, SUP- or SUB- reference in text, names, descriptions or hidden text.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { V3_PRODUCT_CLASS_ALLOW_LIST } from '@xr/config/policy-terms';
import { expect } from 'vitest';

import { canonicalMarkup, normaliseMarkup } from './board.js';
import { STYLESHEET_CLASS_NAMES } from './v46-css.js';

const V3_STYLES = join(import.meta.dirname, '..', 'styles', 'v3');

export const V3_BOARDS_DIRECTORY = join(
  import.meta.dirname,
  '..',
  '..',
  '..',
  '..',
  '..',
  'design',
  'v3-refined-b',
  'pack',
  'references',
  'v3',
  'project',
);

function classNamesIn(css: string): Set<string> {
  const rules = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/url\([^)]*\)/g, '');
  return new Set([...rules.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((match) => match[1] ?? ''));
}

/**
 * The owner-approved Entry & shared export (XS-v6): its `.dc.html` component files, read as the
 * reference for the XS components' markup and icons.
 */
export const XS_EXPORT_DIRECTORY = join(
  V3_BOARDS_DIRECTORY,
  '..',
  '..',
  '..',
  '..',
  'roles',
  'XS-v6',
  'project',
);

/**
 * The owner-approved Super Admin export (SA-v1): its plain HTML + JS views (`sa-views-*.js`,
 * `sa-core.js`), read as the reference for the Super Admin pages' markup, words and icons.
 */
export const SA_EXPORT_DIRECTORY = join(
  V3_BOARDS_DIRECTORY,
  '..',
  '..',
  '..',
  '..',
  'roles',
  'SA-v1',
  'project',
);

/**
 * The owner-approved Vendor export (VE-v1): its live role root (`Main.dc.html`), read as the
 * reference for the Vendor pages' markup, words and icons.
 */
export const VE_EXPORT_DIRECTORY = join(
  V3_BOARDS_DIRECTORY,
  '..',
  '..',
  '..',
  '..',
  'roles',
  'VE-v1',
  'project',
);

/**
 * The owner-approved Content Manager export (CM-v1): its live role root (`Main.dc.html`), read as
 * the reference for the Content Manager pages' markup, words and icons.
 */
export const CM_EXPORT_DIRECTORY = join(
  V3_BOARDS_DIRECTORY,
  '..',
  '..',
  '..',
  '..',
  'roles',
  'CM-v1',
  'project',
);

/**
 * The owner-approved Academic Reviewer export (RV-v1): its live role root (`RV.dc.html`), read as
 * the reference for the Academic Reviewer pages' markup, words and icons.
 */
export const RV_EXPORT_DIRECTORY = join(
  V3_BOARDS_DIRECTORY,
  '..',
  '..',
  '..',
  '..',
  'roles',
  'RV-v1',
  'project',
);

/**
 * The owner-approved Institute Admin export (IA-v1): its live role root (`Main.dc.html`, START-HERE
 * "Live role entry"), read as the reference for the Institute Admin pages' markup, words and icons.
 */
export const IA_EXPORT_DIRECTORY = join(
  V3_BOARDS_DIRECTORY,
  '..',
  '..',
  '..',
  '..',
  'roles',
  'IA-v1',
  'project',
);

/**
 * Every class a selector of the V3, XS, SA, VE, CM, RV and IA derivatives or the V3 patches names.
 */
export const V3_STYLESHEET_CLASS_NAMES: ReadonlySet<string> = new Set(
  [
    'rb-scoped.css',
    'xs-scoped.css',
    'sa-scoped.css',
    've-scoped.css',
    'cm-scoped.css',
    'rv-scoped.css',
    'ia-scoped.css',
    'patch.css',
  ].flatMap((sheet) => [...classNamesIn(readFileSync(join(V3_STYLES, sheet), 'utf8'))]),
);

/** The raw text of an XS export file (`XsSignIn.dc.html`, …), for markup and icon checks. */
export function xsExportText(file: string): string {
  return readFileSync(join(XS_EXPORT_DIRECTORY, file), 'utf8');
}

/** The raw text of an SA export file (`sa-views-a.js`, …), for markup, words and icon checks. */
export function saExportText(file: string): string {
  return readFileSync(join(SA_EXPORT_DIRECTORY, file), 'utf8');
}

/** The raw text of a VE export file (`Main.dc.html`, …), for markup, words and icon checks. */
export function veExportText(file: string): string {
  return readFileSync(join(VE_EXPORT_DIRECTORY, file), 'utf8');
}

/** The raw text of a CM export file (`Main.dc.html`, …), for markup, words and icon checks. */
export function cmExportText(file: string): string {
  return readFileSync(join(CM_EXPORT_DIRECTORY, file), 'utf8');
}

/** The raw text of an RV export file (`RV.dc.html`, …), for markup, words and icon checks. */
export function rvExportText(file: string): string {
  return readFileSync(join(RV_EXPORT_DIRECTORY, file), 'utf8');
}

/** The raw text of an IA export file (`Main.dc.html`, …), for markup, words and icon checks. */
export function iaExportText(file: string): string {
  return readFileSync(join(IA_EXPORT_DIRECTORY, file), 'utf8');
}

/**
 * The Institute Admin export's inline sizes on product elements, each with the central patch's
 * product class the kit emits there instead (V3P-16; `rk-x-fmts-flush` is V3P-14's, reused). Each
 * `style` value the IA export writes on a product element maps to exactly one class.
 */
export const IA_PATCHED_STYLES: Readonly<Record<string, string>> = {
  'max-width: 760px': 'rk-x-surface-msg',
  'margin: 0': 'rk-x-state-ico-flush',
  'max-width: 520px': 'rk-x-field-select',
  'max-width: 320px': 'rk-x-field-count',
  'align-items: flex-end': 'rk-x-row-end',
  'flex: 1 1 320px': 'rk-x-search-grow',
  'margin-bottom: 10px': 'rk-x-count-low',
  'max-width: 420px': 'rk-x-search-panel',
  'justify-content: center': 'rk-x-row-center',
  'gap: 6px 8px': 'rk-x-row-tight',
  'grid-template-columns: minmax(0, 1fr)': 'rk-x-choice-plain',
  'gap: 6px 10px': 'rk-x-row-snug',
  'vertical-align: -4px; margin-right: 6px': 'rk-x-ico-lead',
  'color: #3B49B8': 'rk-x-ico-file',
  'font-size: 17px; line-height: 26px; color: #141B5E': 'rk-x-next-lead',
  'margin-bottom: 12px': 'rk-x-h3-above',
  'margin-top: 8px': 'rk-x-ferr-group',
  'margin-bottom: 8px': 'rk-x-label-above',
  'margin-top: 0': 'rk-x-fmts-flush',
};

/**
 * An excerpt of the IA export with each patched inline size (`IA_PATCHED_STYLES`) written as the
 * product class the kit emits in its place (added to the element's classes, the `style` dropped);
 * any other `style` is left as it is.
 */
export function iaPatchedMarkup(html: string): string {
  return html.replace(
    /<([a-z][\w-]*)([^<>]*?)\sstyle="([^"]*)"([^<>]*)>/g,
    (whole, tag: string, before: string, style: string, after: string) => {
      const added = IA_PATCHED_STYLES[style];
      if (!added) return whole;
      const attributes = `${before}${after}`;
      return /\sclass="/.test(attributes)
        ? `<${tag}${attributes.replace(/\sclass="([^"]*)"/, (_match, value: string) => ` class="${value} ${added}"`)}>`
        : `<${tag} class="${added}"${attributes}>`;
    },
  );
}

/**
 * Fails if `root` emits a class the V3 sheets do not define, a product class that is not on the
 * V3 allow-list, or — inside a v46 island (`[data-xr-v46]`) — a class the v46 sheets do not define.
 */
export function expectV3ClassesOnly(root: Element): void {
  const islands = [
    ...(root.matches('[data-xr-v46]') ? [root] : []),
    ...root.querySelectorAll('[data-xr-v46]'),
  ];
  const inIsland = (element: Element) => islands.some((island) => island.contains(element));
  const outside = new Set<string>();
  const inside = new Set<string>();
  for (const element of [root, ...root.querySelectorAll('[class]')]) {
    for (const name of element.classList) (inIsland(element) ? inside : outside).add(name);
  }
  const product = [...outside].filter((name) => name.startsWith('rk-x-'));
  expect(product.filter((name) => !V3_PRODUCT_CLASS_ALLOW_LIST.includes(name))).toEqual([]);
  expect([...outside].filter((name) => !V3_STYLESHEET_CLASS_NAMES.has(name))).toEqual([]);
  expect([...inside].filter((name) => !STYLESHEET_CLASS_NAMES.has(name))).toEqual([]);
}

const boardCache = new Map<string, string>();

/** The symbols a board defines, by id (`<symbol id="rki-x" …><path d="…">`). */
function symbolsOf(html: string): Map<string, string> {
  return new Map(
    [...html.matchAll(/<symbol id="([\w-]+)" viewBox="0 0 24 24"><path d="([^"]+)"/g)].map(
      (match) => [match[1] ?? '', match[2] ?? ''] as const,
    ),
  );
}

/** A board's markup with every sprite reference inlined from the board's own symbols. */
function inlineSprites(html: string, symbols: Map<string, string>): string {
  return html.replace(/<use href="#([\w-]+)"><\/use>/g, (whole, id: string) => {
    const path = symbols.get(id);
    return path ? `<path d="${path}"></path>` : whole;
  });
}

/** Style attribute values without spaces or a trailing semicolon (`width: 95.88%` = `width:95.88%`). */
function compactStyles(html: string): string {
  return html.replace(/ style="([^"]*)"/g, (_whole, value: string) => {
    return ` style="${value.replace(/\s+/g, '').replace(/;$/, '')}"`;
  });
}

/** The design host's event bindings (`onClick="{{ toList }}"`): runtime wiring, not markup. */
function withoutBindings(html: string): string {
  return html.replace(/ on[A-Z][A-Za-z]*="\{\{[^"]*\}\}"/g, '');
}

/** The normalised source of a V3 board (sprites inlined, event bindings dropped). */
export function v3BoardText(file: string): string {
  const cached = boardCache.get(file);
  if (cached) return cached;
  const raw = readFileSync(join(V3_BOARDS_DIRECTORY, file), 'utf8');
  const text = normaliseMarkup(withoutBindings(inlineSprites(raw, symbolsOf(raw))));
  boardCache.set(file, text);
  return text;
}

/**
 * Canonical form for comparing rendered markup with a board excerpt: attributes in name order,
 * style values compacted, and no `aria-hidden` on `svg` — the boards hide a decorative icon either
 * on the svg or on its box, the components always on the svg; both are decorative.
 */
export function v3Canonical(html: string): string {
  const template = document.createElement('template');
  template.innerHTML = canonicalMarkup(html);
  for (const svg of template.content.querySelectorAll('svg')) svg.removeAttribute('aria-hidden');
  return compactStyles(template.innerHTML);
}

/**
 * The excerpt is drawn on the V3 board (after normalising), and `element` renders exactly it.
 * `excerpt` is given with the board's sprites already inlined or with `<use>` references, which
 * are inlined from the board's symbols.
 */
export function expectRenderedAsV3Drawn(element: Element, file: string, excerpt: string): void {
  const raw = readFileSync(join(V3_BOARDS_DIRECTORY, file), 'utf8');
  const drawn = normaliseMarkup(withoutBindings(inlineSprites(excerpt, symbolsOf(raw))));
  expect(v3BoardText(file).includes(drawn), `not drawn on ${file}: ${drawn.slice(0, 120)}`).toBe(
    true,
  );
  expect(v3Canonical(element.outerHTML)).toBe(v3Canonical(drawn));
}

/**
 * A static element of a V3 board, by selector (the first match): its markup with the board's
 * sprites inlined and event bindings dropped. Fails if the element is templated (`{{ … }}`).
 */
export function v3BoardElement(file: string, selector: string): string {
  const raw = readFileSync(join(V3_BOARDS_DIRECTORY, file), 'utf8');
  const html = withoutBindings(inlineSprites(raw, symbolsOf(raw)));
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const element = parsed.querySelector(selector);
  if (!element) throw new Error(`${file} draws no ${selector}`);
  const markup = normaliseMarkup(element.outerHTML);
  expect(markup.includes('{{'), `${file} ${selector} is templated`).toBe(false);
  return markup;
}

/** `element` renders exactly the static board element `selector` of `file` (canonical forms). */
export function expectRenderedAsV3Element(element: Element, file: string, selector: string): void {
  expect(v3Canonical(element.outerHTML)).toBe(v3Canonical(v3BoardElement(file, selector)));
}

/** The internal references Super Admin screens never show (owner decision 6; HANDOFF "No internal IDs"). */
export const INTERNAL_REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

const NAMING_ATTRIBUTES = [
  'aria-label',
  'aria-description',
  'title',
  'alt',
  'placeholder',
  'value',
];

/** Fails if `root` shows an internal reference in its text (hidden text too) or naming attributes. */
export function expectNoInternalReferences(root: Element): void {
  const found: string[] = [];
  const text = root.textContent ?? '';
  const match = INTERNAL_REFERENCE.exec(text);
  if (match) found.push(`text: ${match[0]}`);
  for (const element of [root, ...root.querySelectorAll('*')]) {
    for (const name of NAMING_ATTRIBUTES) {
      const value = element.getAttribute(name);
      const hit = value ? INTERNAL_REFERENCE.exec(value) : null;
      if (hit) found.push(`${name}: ${hit[0]}`);
    }
  }
  expect(found).toEqual([]);
}
