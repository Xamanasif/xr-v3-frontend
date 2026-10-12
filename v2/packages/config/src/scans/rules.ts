/**
 * The static scans of Appendix F §7.6 (WP-0.4) as data plus pure checks, so each rule can be
 * proven on synthetic input (cached unit tests) and run on the repository (uncached suite).
 */
import {
  CANVAS_CLASS_PATTERNS,
  CANVAS_TERMS,
  DEVELOPER_SURFACE_TERMS,
  POLICY_WORD_TERMS,
  PUBLISH_CONTROL_TERM,
  SLICE1_TERMS,
  type CopyKind,
  type CopyTerm,
  type ScopedTerm,
} from '../../policy/terms.mjs';
import { extractCss, extractScript, type TextItem } from './extract.js';

export interface Finding {
  readonly rule: string;
  readonly file: string;
  readonly line: number;
  readonly found: string;
  readonly evidence: string;
}

/** How a product file is treated by the scans. */
export interface ScanTarget {
  /** Repository-relative path (forward slashes). */
  readonly file: string;
  readonly source: string;
  /** Rendered copy lives here: `.tsx` files and `apps/web/src/copy/**`. */
  readonly copy: boolean;
  /** `apps/web/src/copy/**`: every string is copy. */
  readonly copyModule: boolean;
  /** Super Admin or Academic Reviewer feature folder (B8-03 Publish scan). */
  readonly adminOrReviewer: boolean;
  /** Web-app code, where Tailwind composition utilities are allowed (ADR-0001). */
  readonly webApp: boolean;
}

const COPY_KINDS: readonly CopyKind[] = ['jsx-text', 'copy-attr', 'string', 'copy-module-string'];

function excerpt(text: string, index: number): string {
  const start = Math.max(0, index - 15);
  return text
    .slice(start, index + 45)
    .replace(/\s+/g, ' ')
    .trim();
}

function scopedTermFindings(
  term: ScopedTerm,
  target: ScanTarget,
  items: readonly TextItem[],
): Finding[] {
  const findings: Finding[] = [];
  for (const item of items) {
    const inCode = term.scope.includes('code');
    const inIdentifier = term.scope.includes('identifier') && item.kind === 'identifier';
    const inCopy =
      term.scope.includes('copy') &&
      target.copy &&
      item.kind !== 'identifier' &&
      item.kind !== 'code-attr';
    if (!inCode && !inIdentifier && !inCopy) continue;
    const match = term.pattern.exec(item.text);
    if (match) {
      findings.push({
        rule: term.id,
        file: target.file,
        line: item.line,
        found: excerpt(item.text, match.index),
        evidence: term.evidence,
      });
    }
  }
  return findings;
}

function copyTermFindings(
  term: CopyTerm,
  target: ScanTarget,
  items: readonly TextItem[],
): Finding[] {
  if (!target.copy) return [];
  const kinds = term.kinds ?? COPY_KINDS;
  const findings: Finding[] = [];
  for (const item of items) {
    if (!(kinds as readonly string[]).includes(item.kind)) continue;
    const match = term.pattern.exec(item.text);
    if (match) {
      findings.push({
        rule: term.id,
        file: target.file,
        line: item.line,
        found: excerpt(item.text, match.index),
        evidence: term.evidence,
      });
    }
  }
  return findings;
}

/** Raw styling and import rules (ADR-0001; Appendix E §11; Appendix F §3.8, §7.6). */
const TAILWIND_UTILITY_PREFIX =
  '(?:[a-z0-9-]+:)*(?:bg|text|border(?:-[trblxyse])?|fill|stroke|ring|outline|from|via|to|decoration|shadow|accent|caret|divide|placeholder)';
/** v46 colour tokens (xr-foundation.css :root) named like a Tailwind palette shade. */
const V46_TOKENS_WITH_TAILWIND_HUES = 'indigo-(?:100|200|300|500|600)|cyan-(?:50|400|700)';

const STYLING_TOKEN_RULES: readonly { id: string; pattern: RegExp; evidence: string }[] = [
  {
    id: 'tailwind-viewport-breakpoint',
    pattern:
      /^(?:[a-z0-9-]+:)*(?:sm|md|lg|xl|2xl|max-sm|max-md|max-lg|max-xl|max-2xl|min-\[[^\]]*\]|max-\[[^\]]*\]):/,
    evidence: 'ADR-0001 §4 (no viewport breakpoint variants); Appendix E §11 item 8',
  },
  {
    id: 'tailwind-arbitrary-colour',
    pattern: new RegExp(
      `^${TAILWIND_UTILITY_PREFIX}-\\[(?:#|rgb|hsl|oklch|oklab|lab|lch|hwb|color:)`,
    ),
    evidence: 'ADR-0001 §4 (no arbitrary colour values)',
  },
  {
    id: 'tailwind-default-palette',
    // Except the eight v46 colour tokens whose names share a Tailwind hue: the web theme maps
    // them 1:1 (`--color-indigo-600: var(--xr-indigo-600)`, apps/web/src/app/globals.css).
    pattern: new RegExp(
      `^${TAILWIND_UTILITY_PREFIX}-(?!(?:${V46_TOKENS_WITH_TAILWIND_HUES})(?:/\\d+)?$)(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|[1-9]00|950)(?:/\\d+)?$`,
    ),
    evidence: 'ADR-0001 §4 (no Tailwind default palette)',
  },
  {
    id: 'tailwind-type-scale-or-shadow',
    pattern:
      /^(?:[a-z0-9-]+:)*(?:text-(?:xs|sm|base|lg|[2-9]?xl)|shadow(?:-(?:2xs|xs|sm|md|lg|xl|2xl|inner))?)$/,
    evidence: 'ADR-0001 §4 (no Tailwind default type scale or shadows)',
  },
];

const IMPORT_RULES: readonly { id: string; pattern: RegExp; evidence: string }[] = [
  {
    id: 'next-font',
    pattern: /^next\/font(?:\/|$)/,
    evidence: 'Appendix E §11 item 6 (no next/font for Public Sans: it renames the family)',
  },
  {
    id: 'branding-import',
    pattern: /(?:^|[/@])branding(?:\/|$)|bits-pilani-wilp-logo/,
    evidence: 'VD-03 (logo approval open); BC12 placeholder rule; Appendix F §7.6',
  },
  {
    id: 'frozen-handoff-import',
    pattern: /handoff-v46|design\/handoff/,
    evidence: 'CLAUDE.md (the frozen handoff and its runtime are never product code)',
  },
];

/**
 * Test-seam names may appear only where the approved design puts them. These are permanent
 * designated locations (not exceptions with a removal trigger): the test-hook bridge reads the
 * seam (TE-7, compiled out of non-CI builds by a build-time alias, Appendix F §3.2), and the
 * flag is read by the alias in next.config.ts (Appendix F §3.8) and by the app's one env module
 * (ADR-0007 §2: "read once through @xr/config/env").
 */
const TEST_SEAM_RULES: readonly {
  id: string;
  pattern: RegExp;
  evidence: string;
  designated: readonly string[];
}[] = [
  {
    id: 'test-seam-globals',
    pattern: /__XR_TEST_BOOT__|__XR_TEST_HOOKS__/,
    evidence:
      'ADR-0007 §2–3 (test hooks only in CI/Playwright builds, through the test-hook bridge chosen by a build-time alias)',
    designated: ['apps/web/src/platform/test-hook-bridge.ts'],
  },
  {
    id: 'test-hooks-flag',
    pattern: /NEXT_PUBLIC_XR_TEST_HOOKS/,
    evidence:
      'Appendix F §3.8 (the build-time alias in next.config.ts reads NEXT_PUBLIC_XR_TEST_HOOKS) and ADR-0007 §2 (flags are read once, in the env module)',
    designated: ['apps/web/next.config.ts', 'apps/web/src/lib/env.ts'],
  },
];

/** Where each test-seam name may appear (for the summary and the docs). */
export const TEST_SEAM_DESIGNATED_LOCATIONS = Object.fromEntries(
  TEST_SEAM_RULES.map((rule) => [rule.id, rule.designated]),
);

/** Identity is never chosen through an address (owner constraint; ADR-0003 §5). */
export const IDENTITY_QUERY_PARAMETER = {
  id: 'identity-query-parameter',
  pattern: /[?&](?:as|role|user|persona|account|person|personId|impersonate|session)=/,
  evidence: 'Owner constraint 9 Oct 2026; ADR-0003 §3, §5 (no identity choice through UI or URL)',
};

const CSS_RULES: readonly { id: string; pattern: RegExp; evidence: string }[] = [
  {
    id: 'tailwind-preflight',
    pattern: /@import\s+['"]tailwindcss(?:\/preflight(?:\.css)?)?['"]/,
    evidence:
      'ADR-0001 §4 (G-3 Option A: Tailwind without Preflight — only theme.css and utilities.css)',
  },
  {
    id: 'viewport-breakpoint-css',
    pattern: /@media[^{]*\b(?:min-|max-)?(?:width|height|aspect-ratio)\b/,
    evidence: 'Appendix E §11 item 8 (no viewport media-query breakpoints; layout uses @container)',
  },
];

/** Every finding of every product-code rule in one file. */
export function scanProductFile(target: ScanTarget): Finding[] {
  if (target.file.endsWith('.css')) return scanProductCss(target);
  const extracted = extractScript(target.file, target.source, target.copyModule);
  const findings: Finding[] = [];
  for (const term of [...DEVELOPER_SURFACE_TERMS, ...CANVAS_TERMS, ...SLICE1_TERMS]) {
    findings.push(...scopedTermFindings(term, target, extracted.items));
  }
  for (const term of POLICY_WORD_TERMS)
    findings.push(...copyTermFindings(term, target, extracted.items));
  if (target.adminOrReviewer) {
    findings.push(...copyTermFindings(PUBLISH_CONTROL_TERM, target, extracted.items));
  }
  for (const { token, line } of extracted.classTokens) {
    if (CANVAS_CLASS_PATTERNS.some((pattern) => pattern.test(token))) {
      findings.push({
        rule: 'canvas-class',
        file: target.file,
        line,
        found: token,
        evidence: 'Appendix F §3.8; Appendix E §10 (canvas-only classes)',
      });
    }
    if (target.webApp) {
      for (const rule of STYLING_TOKEN_RULES) {
        if (rule.pattern.test(token)) {
          findings.push({
            rule: rule.id,
            file: target.file,
            line,
            found: token,
            evidence: rule.evidence,
          });
        }
      }
    }
  }
  for (const attribute of extracted.jsxAttributes) {
    if (attribute.name === 'style') {
      findings.push({
        rule: 'inline-style',
        file: target.file,
        line: attribute.line,
        found: 'style={…}',
        evidence:
          'ADR-0001 (styles live in the v46 layer and the product layer; board inline styles are never copied — Appendix E §2.5)',
      });
    }
  }
  for (const { specifier, line } of extracted.imports) {
    for (const rule of IMPORT_RULES) {
      if (rule.pattern.test(specifier)) {
        findings.push({
          rule: rule.id,
          file: target.file,
          line,
          found: specifier,
          evidence: rule.evidence,
        });
      }
    }
  }
  const seamRules = TEST_SEAM_RULES.filter((rule) => !rule.designated.includes(target.file));
  for (const item of extracted.items) {
    for (const rule of [...seamRules, IDENTITY_QUERY_PARAMETER]) {
      const match = rule.pattern.exec(item.text);
      if (match) {
        findings.push({
          rule: rule.id,
          file: target.file,
          line: item.line,
          found: excerpt(item.text, match.index),
          evidence: rule.evidence,
        });
      }
    }
  }
  return findings;
}

function scanProductCss(target: ScanTarget): Finding[] {
  const css = extractCss(target.source);
  const findings: Finding[] = [];
  for (const { token, line } of css.classTokens) {
    if (CANVAS_CLASS_PATTERNS.some((pattern) => pattern.test(token))) {
      findings.push({
        rule: 'canvas-class',
        file: target.file,
        line,
        found: `.${token}`,
        evidence: 'Appendix F §3.8; Appendix E §10 (canvas-only classes)',
      });
    }
  }
  for (const rule of CSS_RULES) {
    for (const match of css.text.matchAll(new RegExp(rule.pattern.source, 'g'))) {
      findings.push({
        rule: rule.id,
        file: target.file,
        line: css.lineOf(match.index ?? 0),
        found: match[0].trim(),
        evidence: rule.evidence,
      });
    }
  }
  for (const term of CANVAS_TERMS) {
    const match = term.pattern.exec(css.text);
    if (match) {
      findings.push({
        rule: term.id,
        file: target.file,
        line: css.lineOf(match.index),
        found: excerpt(css.text, match.index),
        evidence: term.evidence,
      });
    }
  }
  return findings;
}

/** Identity must never be chosen through an address — in product code or in test support. */
export function scanIdentityAddresses(file: string, source: string): Finding[] {
  const extracted = extractScript(file, source, false);
  const findings: Finding[] = [];
  for (const item of extracted.items) {
    if (item.kind === 'identifier') continue;
    const match = IDENTITY_QUERY_PARAMETER.pattern.exec(item.text);
    if (match) {
      findings.push({
        rule: IDENTITY_QUERY_PARAMETER.id,
        file,
        line: item.line,
        found: excerpt(item.text, match.index),
        evidence: IDENTITY_QUERY_PARAMETER.evidence,
      });
    }
  }
  return findings;
}

/** Every rule id the product scans can report, for the per-rule summary. */
export const PRODUCT_SCAN_RULE_IDS: readonly string[] = [
  ...DEVELOPER_SURFACE_TERMS.map((term) => term.id),
  ...CANVAS_TERMS.map((term) => term.id),
  'canvas-class',
  ...SLICE1_TERMS.map((term) => term.id),
  ...POLICY_WORD_TERMS.map((term) => term.id),
  PUBLISH_CONTROL_TERM.id,
  ...STYLING_TOKEN_RULES.map((rule) => rule.id),
  'inline-style',
  ...IMPORT_RULES.map((rule) => rule.id),
  ...CSS_RULES.map((rule) => rule.id),
  ...TEST_SEAM_RULES.map((rule) => rule.id),
  IDENTITY_QUERY_PARAMETER.id,
];
