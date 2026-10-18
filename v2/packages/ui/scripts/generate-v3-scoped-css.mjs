// Generates src/styles/v3/rb-scoped.css — the product derivative of the frozen Refined Direction B
// stylesheets (foundation XR-V3-RB-1.0; repository design/v3-refined-b/; docs/decisions/ADR-0010).
//
// Inputs (read only, never edited): core.css, rb.css and rb-kit.css in
// design/v3-refined-b/pack/references/v3/project/, each checked against its SHA-256 in
// design/v3-refined-b/pack/FOUNDATION-LOCK.json before anything is written.
//
// The derivative is the three sheets concatenated in their load order (core → rb → rb-kit) with
// exactly one kind of change: the text of each style rule's selector list. Every declaration block,
// at-rule prelude, comment and the order of every rule stay byte for byte as the source wrote them.
// Each complex selector is confined to a V3 root without changing its specificity:
//
// - a selector whose first compound already names a V3 root class (`.xr` or `.rb`) keeps it;
// - any other selector is prefixed with `:where(.xr) ` (zero specificity), so a class the v46
//   sheets also define (`.xr-fmt`, `.xr-sr`, `.xr-ico`, `.xr-avatar`, `.xr-num`) never restyles a
//   v46 element outside a V3 root;
// - every subject also gets `:not(:where([data-xr-v46], [data-xr-v46] *))` (zero specificity), so a
//   v46 island inside a V3 root — a screen whose V3 design is still pending — keeps the v46 look.
//
// Run `pnpm --filter @xr/ui generate:v3-css` only after an owner-approved change of the foundation
// (a new FOUNDATION-LOCK). The drift test (src/styles/v3-provenance.test.ts) fails whenever the
// committed file and its sources disagree.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

const packageRoot = join(import.meta.dirname, '..');
const repositoryRoot = join(packageRoot, '..', '..', '..');

export const FOUNDATION_ID = 'XR-V3-RB-1.0';
export const REFERENCE_ROOT = join(repositoryRoot, 'design', 'v3-refined-b', 'pack');
export const FOUNDATION_LOCK = join(REFERENCE_ROOT, 'FOUNDATION-LOCK.json');
export const SOURCE_DIRECTORY = join(REFERENCE_ROOT, 'references', 'v3', 'project');
export const OUTPUT = join(packageRoot, 'src', 'styles', 'v3', 'rb-scoped.css');

/** The three Refined B sheets in the order every V3 board links them. */
export const SHEETS = ['core.css', 'rb.css', 'rb-kit.css'];

/** The classes a V3 root carries (`<div class="xr rb">` on every board). */
export const ROOT_CLASSES = ['xr', 'rb'];

/** Zero-specificity confinement to a V3 root. */
export const SCOPE_PREFIX = ':where(.xr) ';

/** The attribute that marks a v46 island inside a V3 root. */
export const ISLAND_ATTRIBUTE = 'data-xr-v46';

/** Zero-specificity exclusion of a v46 island and everything inside it. */
export const ISLAND_EXCLUSION = `:not(:where([${ISLAND_ATTRIBUTE}], [${ISLAND_ATTRIBUTE}] *))`;

/** At-rules whose blocks hold style rules (rewritten); every other block is copied as written. */
const GROUPING_AT_RULES = new Set(['media', 'container', 'supports', 'layer', 'scope']);

/** Legacy single-colon pseudo-elements, which must stay last in a compound. */
const LEGACY_PSEUDO_ELEMENTS = /^:(before|after|first-line|first-letter)(?![\w-])/;

function sha256(text) {
  return createHash('sha256').update(text).digest('hex');
}

/** Index just past the comment or string that starts at `index`, or `index` itself. */
function skipOpaque(css, index) {
  if (css.startsWith('/*', index)) {
    const end = css.indexOf('*/', index + 2);
    if (end < 0) throw new Error(`Unterminated comment at ${index}`);
    return end + 2;
  }
  const quote = css[index];
  if (quote === '"' || quote === "'") {
    let cursor = index + 1;
    while (cursor < css.length && css[cursor] !== quote) {
      cursor += css[cursor] === '\\' ? 2 : 1;
    }
    if (cursor >= css.length) throw new Error(`Unterminated string at ${index}`);
    return cursor + 1;
  }
  return index;
}

/** Index of the `}` matching the `{` at `open`. */
function matchingBrace(css, open) {
  let depth = 0;
  let cursor = open;
  while (cursor < css.length) {
    const next = skipOpaque(css, cursor);
    if (next !== cursor) {
      cursor = next;
      continue;
    }
    const char = css[cursor];
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return cursor;
    }
    cursor += 1;
  }
  throw new Error(`Unbalanced block at ${open}`);
}

/** Splits `text` at top-level occurrences of `separator` (outside (), [], strings, comments). */
export function splitTopLevel(text, separator) {
  const parts = [];
  let depth = 0;
  let start = 0;
  let cursor = 0;
  while (cursor < text.length) {
    const next = skipOpaque(text, cursor);
    if (next !== cursor) {
      cursor = next;
      continue;
    }
    const char = text[cursor];
    if (char === '(' || char === '[') depth += 1;
    else if (char === ')' || char === ']') depth -= 1;
    else if (char === separator && depth === 0) {
      parts.push(text.slice(start, cursor));
      start = cursor + 1;
    }
    cursor += 1;
  }
  parts.push(text.slice(start));
  return parts;
}

/** `[start, end)` of each compound of a complex selector, at top level. */
function compoundRanges(selector) {
  const ranges = [];
  let depth = 0;
  let start = -1;
  let cursor = 0;
  const close = (end) => {
    if (start >= 0) ranges.push([start, end]);
    start = -1;
  };
  while (cursor < selector.length) {
    const next = skipOpaque(selector, cursor);
    if (next !== cursor) {
      if (start < 0) start = cursor;
      cursor = next;
      continue;
    }
    const char = selector[cursor];
    if (char === '(' || char === '[') depth += 1;
    if (char === ')' || char === ']') depth -= 1;
    const combinator = depth === 0 && (/\s/.test(char) || '>+~'.includes(char));
    if (combinator) close(cursor);
    else if (start < 0) start = cursor;
    cursor += 1;
  }
  close(selector.length);
  return ranges;
}

/** The compound text with every parenthesised argument removed (`:not(.rb)` names no root). */
function withoutArguments(compound) {
  let result = '';
  let depth = 0;
  for (const char of compound) {
    if (char === '(') depth += 1;
    if (depth === 0) result += char;
    if (char === ')') depth -= 1;
  }
  return result;
}

/** Whether a compound names a V3 root class itself (`.xr`, `.rb`, `.xr.rb`). */
export function namesRoot(compound) {
  const bare = withoutArguments(compound);
  return ROOT_CLASSES.some((name) => new RegExp(`\\.${name}(?![\\w-])`).test(bare));
}

/** Where a pseudo-element starts in a compound (insertion point for the subject's exclusion). */
function pseudoElementStart(compound) {
  let depth = 0;
  for (let index = 0; index < compound.length; index += 1) {
    const char = compound[index];
    if (char === '(' || char === '[') depth += 1;
    if (char === ')' || char === ']') depth -= 1;
    if (depth !== 0 || char !== ':') continue;
    if (compound[index + 1] === ':') return index;
    if (LEGACY_PSEUDO_ELEMENTS.test(compound.slice(index))) return index;
  }
  return compound.length;
}

/** One complex selector, confined to a V3 root and kept out of v46 islands. */
export function scopeComplexSelector(raw) {
  const leading = /^\s*/.exec(raw)[0];
  const trailing = /\s*$/.exec(raw)[0];
  const selector = raw.slice(leading.length, raw.length - trailing.length);
  if (selector === '') throw new Error('Empty selector in a selector list');
  const ranges = compoundRanges(selector);
  const first = ranges[0];
  const last = ranges[ranges.length - 1];
  if (!first || !last) throw new Error(`No compound in selector "${selector}"`);
  const subject = selector.slice(last[0], last[1]);
  const insertAt = last[0] + pseudoElementStart(subject);
  const excluded = selector.slice(0, insertAt) + ISLAND_EXCLUSION + selector.slice(insertAt);
  const rooted = namesRoot(selector.slice(first[0], first[1]));
  return leading + (rooted ? excluded : SCOPE_PREFIX + excluded) + trailing;
}

/** A selector list: each complex selector scoped, commas and spacing kept. */
export function scopeSelectorList(prelude) {
  return splitTopLevel(prelude, ',').map(scopeComplexSelector).join(',');
}

/**
 * Rewrites the selectors of every style rule in `css` (recursively inside grouping at-rules) and
 * copies every other byte unchanged.
 */
export function scopeStylesheet(css) {
  let output = '';
  let cursor = 0;
  while (cursor < css.length) {
    // Whitespace and comments between rules are copied as written.
    const opaque = skipOpaque(css, cursor);
    if (opaque !== cursor) {
      output += css.slice(cursor, opaque);
      cursor = opaque;
      continue;
    }
    if (/\s/.test(css[cursor])) {
      output += css[cursor];
      cursor += 1;
      continue;
    }
    // A statement: up to `{` (a block) or `;` (an at-rule without one).
    let end = cursor;
    while (end < css.length) {
      const next = skipOpaque(css, end);
      if (next !== end) {
        end = next;
        continue;
      }
      if (css[end] === '{' || css[end] === ';') break;
      end += 1;
    }
    if (end >= css.length) throw new Error(`Unterminated statement at ${cursor}`);
    const prelude = css.slice(cursor, end);
    if (css[end] === ';') {
      if (!prelude.startsWith('@')) throw new Error(`Stray declaration "${prelude}"`);
      output += css.slice(cursor, end + 1);
      cursor = end + 1;
      continue;
    }
    const close = matchingBrace(css, end);
    if (prelude.startsWith('@')) {
      const name = /^@([\w-]+)/.exec(prelude)?.[1] ?? '';
      if (GROUPING_AT_RULES.has(name)) {
        output += prelude + '{' + scopeStylesheet(css.slice(end + 1, close)) + '}';
      } else {
        // @keyframes, @font-face, …: copied as written.
        output += css.slice(cursor, close + 1);
      }
    } else {
      output += scopeSelectorList(prelude) + css.slice(end, close + 1);
    }
    cursor = close + 1;
  }
  return output;
}

/** The three source sheets, each checked against FOUNDATION-LOCK.json. */
export function readInputs() {
  const lock = JSON.parse(readFileSync(FOUNDATION_LOCK, 'utf8'));
  if (lock.foundationId !== FOUNDATION_ID) {
    throw new Error(`FOUNDATION-LOCK.json names ${lock.foundationId}, not ${FOUNDATION_ID}`);
  }
  return SHEETS.map((sheet) => {
    const css = readFileSync(join(SOURCE_DIRECTORY, sheet), 'utf8');
    const expected = lock.baseFiles[`references/v3/project/${sheet}`];
    const actual = sha256(css);
    if (actual !== expected) {
      throw new Error(`${sheet} is ${actual}, FOUNDATION-LOCK.json says ${expected}: STOP`);
    }
    return { sheet, sha256: actual, css };
  });
}

/** The committed derivative for these inputs. */
export function renderScopedCss(inputs) {
  const header = [
    `/* GENERATED by packages/ui/scripts/generate-v3-scoped-css.mjs — do not edit (ADR-0010).`,
    ` * Foundation ${FOUNDATION_ID}: the frozen Refined Direction B sheets of design/v3-refined-b/pack/`,
    ` * references/v3/project/, in their load order, with each selector confined to a V3 root`,
    ` * (\`${SCOPE_PREFIX.trim()}\`, or the root class itself) and kept out of v46 islands`,
    ` * (\`${ISLAND_EXCLUSION}\`). Both additions have zero specificity; every`,
    ` * declaration, at-rule, comment and the rule order are the sources' own bytes.`,
    ...inputs.map(({ sheet, sha256: hash }) => ` *   ${sheet.padEnd(10)} sha256 ${hash}`),
    ` */`,
  ].join('\n');
  const body = inputs
    .map(({ sheet, css }) => `\n/* ==== ${sheet} ==== */\n${scopeStylesheet(css)}`)
    .join('\n');
  return `${header}\n${body}${body.endsWith('\n') ? '' : '\n'}`;
}

if (process.argv[1] === import.meta.filename) {
  writeFileSync(OUTPUT, renderScopedCss(readInputs()));
  process.stdout.write(`wrote ${OUTPUT}\n`);
}
