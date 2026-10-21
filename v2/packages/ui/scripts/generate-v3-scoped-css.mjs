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
//
// It also writes the scoped derivative of each owner-approved role export's extension sheet
// (ROLE_SHEETS; design/v3-refined-b/roles/, pack prompt 11): XS-v6's xs-shared.css →
// src/styles/v3/xs-scoped.css, SA-v1's sa-role.css → src/styles/v3/sa-scoped.css, VE-v1's
// v3-vendor.css → src/styles/v3/ve-scoped.css, CM-v1's cm.css → src/styles/v3/cm-scoped.css,
// RV-v1's rv.css → src/styles/v3/rv-scoped.css, IA-v1's ia-role.css →
// src/styles/v3/ia-scoped.css and FA-v1's fa.css → src/styles/v3/fa-scoped.css, with the same
// selector-only transform. Before anything is written, the export must name this foundation,
// its three base sheets must be the foundation's own bytes (a different base is a new foundation
// version: STOP), and the extension sheet must match both the export's FOUNDATION-LOCK.json and
// its checksums (the export's own SHA256SUMS.txt, or the list recorded at intake beside it).
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
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
 * copies every other byte unchanged. `keepRule(prelude)` (default: every rule) leaves out a style
 * rule it refuses — the whole rule, its selector and block — and nothing else; a grouping at-rule
 * whose every rule is refused goes with them.
 */
export function scopeStylesheet(css, keepRule = () => true) {
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
        const inner = css.slice(end + 1, close);
        const scoped = scopeStylesheet(inner, keepRule);
        if (scoped.trim() === '' && inner.trim() !== '') {
          // Every rule inside was left out: the grouping rule goes too, with its line.
          cursor = css[close + 1] === '\n' ? close + 2 : close + 1;
          continue;
        }
        output += prelude + '{' + scoped + '}';
      } else {
        // @keyframes, @font-face, …: copied as written.
        output += css.slice(cursor, close + 1);
      }
    } else if (keepRule(prelude)) {
      output += scopeSelectorList(prelude) + css.slice(end, close + 1);
    } else {
      // A left-out rule takes its line with it.
      cursor = css[close + 1] === '\n' ? close + 2 : close + 1;
      continue;
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

/** The owner-approved role exports (design/v3-refined-b/roles/) whose extension sheet ships. */
export const ROLE_SHEETS = [
  {
    /** The workstream: XS · Entry & shared (sign-in, account menu, Help, messages, notices). */
    role: 'XS',
    /** The export, byte for byte (`design/v3-refined-b/roles/README.md`). */
    directory: join(repositoryRoot, 'design', 'v3-refined-b', 'roles', 'XS-v6'),
    /** The extension sheet inside the export (every rule selects an `xs-` class). */
    sheet: 'project/xs-shared.css',
    /** The export ships its own SHA256SUMS.txt. */
    sums: 'inside',
    output: join(packageRoot, 'src', 'styles', 'v3', 'xs-scoped.css'),
    /**
     * Rules left out when every selector names one of these: the export's canvas scaffolding,
     * "never product UI" (its COMPONENT-EXTENSIONS.md §2 "Preview only") — dashed slots for other
     * workstreams' pages (`xs-slot*`), the public slot pages (`xs-pub*`), specimen notes
     * (`xs-spec`) and galleries (`xs-kit*`).
     */
    omit: /\.xs-(?:slot|pub|spec|kit)[\w-]*/,
    /** The header's words for what is left out, line by line. */
    omitNote: [
      'preview-only scaffolding (xs-slot*, xs-pub*, xs-spec, xs-kit*: "never product UI") is left out.',
    ],
  },
  {
    /** The workstream: SA · Super Admin (18 screens). */
    role: 'SA',
    directory: join(repositoryRoot, 'design', 'v3-refined-b', 'roles', 'SA-v1'),
    /** The role extension sheet (every rule selects an `sa-` class). */
    sheet: 'project/sa-role.css',
    /** No SHA256SUMS.txt in the export: the list recorded at intake, `SA-v1.SHA256SUMS.txt`. */
    sums: 'beside',
    output: join(packageRoot, 'src', 'styles', 'v3', 'sa-scoped.css'),
    /**
     * Rules left out when every selector names one of these (the export's COMPONENT-EXTENSIONS.md):
     * the design-only preview controls (`sa-pv-*`: "Never part of the product"), and the placements
     * of the XS surfaces the export borrowed until XS was delivered — the account menu
     * (`sa-acctwrap`, `sa-acctmenu*`), Help & support (`sa-help`, `sa-form`, `sa-file`,
     * `sa-list-row--static`) and the signed-out page (`sa-out`): "Replace with the XS component
     * when delivered". The delivered XS export (XS-v6) draws them.
     */
    omit: /\.sa-(?:pv(?:-[\w-]*)?|acctwrap|acctmenu[\w-]*|help|form|file|out|list-row--static)(?![\w-])/,
    omitNote: [
      'preview controls (sa-pv-*) and its borrowed XS placements (sa-acctwrap, sa-acctmenu*, sa-help,',
      'sa-form, sa-file, sa-list-row--static, sa-out), which the delivered XS export draws, are left out.',
    ],
  },
  {
    /** The workstream: VE · Vendor (10 screens). */
    role: 'VE',
    directory: join(repositoryRoot, 'design', 'v3-refined-b', 'roles', 'VE-v1'),
    /** The role stylesheet (every rule selects a `ve-` or `vr-` class). */
    sheet: 'project/v3-vendor.css',
    /** No SHA256SUMS.txt in the export: the list recorded at intake, `VE-v1.SHA256SUMS.txt`. */
    sums: 'beside',
    output: join(packageRoot, 'src', 'styles', 'v3', 've-scoped.css'),
    /**
     * Rules left out when every selector names one of these (the export's COMPONENT-EXTENSIONS.md):
     * the preview page canvas and reviewer bar (`ve-app`, `ve-preview*`, `ve-pv-*`: "Do not implement
     * it in the application"), and the borrowed XS surfaces — the skip link (`ve-skip`; the shell
     * draws the XS `xs-skip`), the account menu (`ve-acct*`), the Help report rows (`ve-reports`,
     * `ve-report*`) and the preview-only Sign out note (`ve-handoff`): "Replace at assembly with"
     * the XS deliverables, which the delivered XS export (XS-v6) draws.
     */
    omit: /\.ve-(?:app|preview(?:-t)?|pv-[\w-]+|skip|acct(?:-[\w-]+)?|acctmenu|reports?|report-t|handoff)(?![\w-])/,
    omitNote: [
      'page canvas and reviewer bar (ve-app, ve-preview*, ve-pv-*) and its borrowed XS surfaces',
      '(ve-skip, ve-acct*, ve-acctmenu, ve-reports, ve-report*, ve-handoff), which the delivered XS',
      'export draws, are left out.',
    ],
  },
  {
    /** The workstream: CM · Content Manager (9 screens). */
    role: 'CM',
    directory: join(repositoryRoot, 'design', 'v3-refined-b', 'roles', 'CM-v1'),
    /** The role stylesheet (every rule selects a `cm-` class). */
    sheet: 'project/cm.css',
    /** No SHA256SUMS.txt in the export: the list recorded at intake, `CM-v1.SHA256SUMS.txt`. */
    sums: 'beside',
    output: join(packageRoot, 'src', 'styles', 'v3', 'cm-scoped.css'),
    /**
     * Rules left out when every selector names one of these (the export's COMPONENT-EXTENSIONS.md
     * "Preview-only — never product UI"): the scenario handoff box (`cm-dock*`: "Must not ship")
     * and the public-page handoff frame (`cm-pub*`: "not a design of PU-06" — the product opens the
     * real public page). The export's borrowed XS sheet (`xs-borrowed.css`) is not generated: the
     * delivered XS export (XS-v6) draws those surfaces.
     */
    omit: /\.cm-(?:dock(?:-[\w-]+)?|pub(?:bar|body|logo|prod)?)(?![\w-])/,
    omitNote: [
      'scenario handoff box (cm-dock*) and public-page handoff frame (cm-pub*), preview-only, are left',
      'out; its borrowed XS sheet (xs-borrowed.css) is not generated — the delivered XS export draws it.',
    ],
  },
  {
    /** The workstream: RV · Academic Reviewer (6 screens). */
    role: 'RV',
    directory: join(repositoryRoot, 'design', 'v3-refined-b', 'roles', 'RV-v1'),
    /** The role stylesheet (every rule selects an `rv-` class). */
    sheet: 'project/rv.css',
    /** No SHA256SUMS.txt in the export: the list recorded at intake, `RV-v1.SHA256SUMS.txt`. */
    sums: 'beside',
    output: join(packageRoot, 'src', 'styles', 'v3', 'rv-scoped.css'),
    /**
     * Rules left out when every selector names one of these: the export's borrowed shared surfaces
     * (its COMPONENT-EXTENSIONS.md "Borrowed shared surfaces (XS contract, provisional)": "Not
     * independent redesigns … replace them with the Shared Surfaces components at assembly";
     * START-HERE "ASSEMBLY PENDING") — the account menu (`rv-acctwrap`, `rv-menu*`), the message
     * template of the refusals and "Report sent" (`rv-msg*`, `rv-msgpage`, `rv-msgcard`), the file
     * field and form actions of Report a problem (`rv-file`, `rv-formact`) and the signed-out page
     * (`rv-solo*`). The delivered XS export (XS-v6) draws them. The export has no preview-only
     * class family of its own: its canvas boards are wrappers importing the live root.
     */
    omit: /\.rv-(?:acctwrap|menu(?:-[\w-]+)?|msg(?:-[\w-]+|page|card)?|file|formact|solo(?:-[\w-]+)?)(?![\w-])/,
    omitNote: [
      'borrowed XS surfaces (rv-acctwrap, rv-menu*, rv-msg*, rv-msgpage, rv-msgcard, rv-file,',
      'rv-formact, rv-solo*), which the delivered XS export draws, are left out.',
    ],
  },
  {
    /** The workstream: IA · Institute Admin (19 screens). */
    role: 'IA',
    directory: join(repositoryRoot, 'design', 'v3-refined-b', 'roles', 'IA-v1'),
    /** The role extension sheet (every rule selects an `ia-` class). */
    sheet: 'project/ia-role.css',
    /** No SHA256SUMS.txt in the export: the list recorded at intake, `IA-v1.SHA256SUMS.txt`. */
    sums: 'beside',
    output: join(packageRoot, 'src', 'styles', 'v3', 'ia-scoped.css'),
    /**
     * Rules left out when every selector names one of these (the export's COMPONENT-EXTENSIONS.md
     * "Notices, shared and preview parts"): the preview chrome (`ia-pv*`: the role start page, the
     * floating "Preview IA-xx" button, the handoff pages and the in-page notes that link to a
     * documented handoff — "not product UI … must not be implemented in the app"; `ia-lt--pv`, the
     * start page's preview index), and the borrowed XS surfaces — the account menu (`ia-acctwrap`,
     * `ia-menu*`: "Borrowed XS-05 contract … Replace with the XS component at assembly") and the
     * signed-out page (`ia-out*`: "Borrowed XS-03. Replace at assembly"). The delivered XS export
     * (XS-v6) draws them. The borrowed Help pages (XS-07) reuse the role's list and form classes
     * and add only `ia-lt--hp`, which the sheet never styles.
     */
    omit: /\.ia-(?:pv(?:-[\w-]+)?|lt--pv|acctwrap|menu(?:-[\w-]+)?|out(?:-[\w-]+)?)(?![\w-])/,
    omitNote: [
      'preview chrome (ia-pv*, ia-lt--pv) and its borrowed XS surfaces (ia-acctwrap, ia-menu*,',
      'ia-out*), which the delivered XS export draws, are left out.',
    ],
  },
  {
    /** The workstream: FA · Faculty (21 screens). */
    role: 'FA',
    directory: join(repositoryRoot, 'design', 'v3-refined-b', 'roles', 'FA-v1'),
    /** The one role stylesheet (every rule selects an `fa-` class). */
    sheet: 'project/fa.css',
    /** No SHA256SUMS.txt in the export: the list recorded at intake, `FA-v1.SHA256SUMS.txt`. */
    sums: 'beside',
    output: join(packageRoot, 'src', 'styles', 'v3', 'fa-scoped.css'),
    /**
     * Rules left out when every selector names one of these: the export's borrowed shared surfaces
     * (its COMPONENT-EXTENSIONS.md "Borrowed shared surfaces (XS contract, not redesigned)":
     * "Replace them with the delivered XS components"; START-HERE "ASSEMBLY PENDING XS") — the
     * account menu (`fa-acctwrap`, `fa-menu*`, `fa-menuscrim`: "Account menu (borrowed XS-05)"),
     * the whole-page message of XS-06 and the scoped refusals (the bare `fa-msg`) and the
     * signed-out page (`fa-pub*`: XS-03). The delivered XS export (XS-v6) draws them. The message
     * template's parts (`fa-msg-ico`, `fa-msg-ico--lock`, `fa-msg-d`, `fa-msg-act`) and
     * `fa-inlinemsg` stay: the role's own no-course and co-teacher states draw them in its message
     * cards (`fa-msgcard`) and panels. The export has no preview-only class family: its
     * preview-only pieces (the "Preview state" properties panel, FA-16's "in this preview" words,
     * FA-17's sample-file buttons) are markup and words, not sheet classes.
     *
     * And the sheet's one selector without an `fa-` class, exactly `.rk-panel-head h2:focus` (no
     * outline on a navy panel head's heading when it takes focus): from the `xr.v3.fa` layer it
     * would reach every `.rk-panel-head h2` in any V3 root — the Super Admin's decision panel
     * heading among them. It is left out here and re-added confined to the Faculty panels by the
     * central patch V3P-17 (`.rk-panel-head.rk-x-panel-head-quiet h2:focus`).
     */
    omit: /\.fa-(?:msg|pub\w*|acctwrap|menu(?:-[\w-]+)?|menuscrim)(?![\w-])|^\s*\.rk-panel-head h2:focus\s*$/,
    omitNote: [
      'borrowed XS surfaces (fa-acctwrap, fa-menu*, fa-menuscrim, the bare fa-msg page, fa-pub*),',
      'which the delivered XS export draws, are left out; the fa-msg-* parts and fa-inlinemsg stay.',
      'The one rule without an fa- class (.rk-panel-head h2:focus), which would reach every role’s',
      'panel heads, is left out too: V3P-17 confines it to the Faculty panels.',
    ],
  },
];

/** Whether every selector of a rule names something its export says is not product UI. */
export function previewOnlyRule(role, prelude) {
  return splitTopLevel(prelude, ',').every((selector) => role.omit.test(selector));
}

/** The export's recorded SHA-256 of one of its base sheets, in any of the seven lock layouts. */
function exportedBaseSheet(exportLock, sheet) {
  return (
    exportLock.baseFiles?.[`project/${sheet}`]?.sha256 ??
    exportLock.byteIdenticalCopiesInProject?.[sheet]?.sha256 ??
    exportLock.sharedFilesShipped?.[`project/${sheet}`]?.sha256 ??
    exportLock.baseFilesShipped?.[`project/${sheet}`]?.sha256 ??
    exportLock.copiedBaseFiles?.[`project/${sheet}`]?.sha256 ??
    exportLock.byteIdenticalCopies?.[`project/${sheet}`]?.sha256 ??
    exportLock.baseFilesUsed?.[`project/${sheet}`]?.sha256
  );
}

/**
 * The export's recorded SHA-256 of its extension sheet, in any of the seven lock layouts: keyed by
 * path or file name (a hash or `{ sha256 }`), or — IA-v1 — an array of `{ path, sha256 }` entries.
 */
function exportedLocalAddition(exportLock, sheet) {
  const additions = exportLock.localAdditions;
  const entry = Array.isArray(additions)
    ? additions.find((addition) => addition?.path === sheet || addition?.path === basename(sheet))
    : (additions?.[sheet] ?? additions?.[basename(sheet)]);
  return typeof entry === 'string' ? entry : entry?.sha256;
}

/** The export's checksum lines: its own SHA256SUMS.txt, or the list recorded beside it. */
export function roleSums(role) {
  const file =
    role.sums === 'inside'
      ? join(role.directory, 'SHA256SUMS.txt')
      : `${role.directory}.SHA256SUMS.txt`;
  return readFileSync(file, 'utf8').split('\n');
}

/**
 * A role export's extension sheet, checked against the export's own FOUNDATION-LOCK.json and its
 * checksums, after checking that the export is built on this foundation's base sheets.
 */
export function readRoleInput(role) {
  const exportLock = JSON.parse(readFileSync(join(role.directory, 'FOUNDATION-LOCK.json'), 'utf8'));
  if (exportLock.foundationId !== FOUNDATION_ID) {
    throw new Error(
      `${role.role}: the export names ${exportLock.foundationId}, not ${FOUNDATION_ID}`,
    );
  }
  const foundationLock = JSON.parse(readFileSync(FOUNDATION_LOCK, 'utf8'));
  for (const sheet of SHEETS) {
    const exported = exportedBaseSheet(exportLock, sheet);
    const locked = foundationLock.baseFiles[`references/v3/project/${sheet}`];
    const bytes = sha256(readFileSync(join(role.directory, 'project', sheet), 'utf8'));
    if (exported !== locked || bytes !== locked) {
      throw new Error(
        `${role.role}: ${sheet} is ${exported} (file ${bytes}), the foundation lock says ${locked} — a new foundation version: STOP`,
      );
    }
  }
  const css = readFileSync(join(role.directory, role.sheet), 'utf8');
  const actual = sha256(css);
  const expected = exportedLocalAddition(exportLock, role.sheet);
  if (actual !== expected) {
    throw new Error(`${role.role}: ${role.sheet} is ${actual}, its lock says ${expected}: STOP`);
  }
  if (!roleSums(role).includes(`${actual}  ${role.sheet}`)) {
    throw new Error(`${role.role}: ${role.sheet} does not match the export's checksums: STOP`);
  }
  return { ...role, sha256: actual, css };
}

/** The committed derivative of one role export's extension sheet. */
export function renderRoleCss(input) {
  const source = relative(repositoryRoot, join(input.directory, input.sheet)).split('\\').join('/');
  const header = [
    `/* GENERATED by packages/ui/scripts/generate-v3-scoped-css.mjs — do not edit (ADR-0010).`,
    ` * ${input.role} extension sheet of the owner-approved role export ${source}`,
    ` * (foundation ${FOUNDATION_ID}), with each selector confined to a V3 root`,
    ` * (\`${SCOPE_PREFIX.trim()}\`, or the root class itself) and kept out of v46 islands`,
    ` * (\`${ISLAND_EXCLUSION}\`). Both additions have zero specificity; every`,
    ` * declaration, at-rule, comment and the rule order are the source's own bytes. The export's`,
    ...input.omitNote.map((line) => ` * ${line}`),
    ` *   ${basename(input.sheet).padEnd(13)} sha256 ${input.sha256}`,
    ` */`,
  ].join('\n');
  const body = `\n/* ==== ${basename(input.sheet)} ==== */\n${scopeStylesheet(
    input.css,
    (prelude) => !previewOnlyRule(input, prelude),
  )}`;
  return `${header}\n${body}${body.endsWith('\n') ? '' : '\n'}`;
}

if (process.argv[1] === import.meta.filename) {
  writeFileSync(OUTPUT, renderScopedCss(readInputs()));
  process.stdout.write(`wrote ${OUTPUT}\n`);
  for (const role of ROLE_SHEETS) {
    writeFileSync(role.output, renderRoleCss(readRoleInput(role)));
    process.stdout.write(`wrote ${role.output}\n`);
  }
}
