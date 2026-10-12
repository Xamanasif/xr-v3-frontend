/**
 * Accessibility checks for component tests (Vitest + Testing Library): runs axe-core
 * directly on a rendered container (Appendix E §9.2 "a direct axe.run"; Appendix F WP-0.4).
 * Works in jsdom and in a real browser. Layout-dependent judgements are Playwright's job
 * (Appendix F §7.1: jsdom cannot evaluate layout), so under jsdom the rules that need
 * rendering are switched off with their reason.
 */
import axe from 'axe-core';
import type { AxeResults, Result } from 'axe-core';

import { WCAG_TAGS } from './wcag.js';

export { WCAG_TAGS };

/** A rule switched off for one check. The reason is mandatory. */
export interface DisabledRule {
  readonly id: string;
  readonly reason: string;
}

/** Rules jsdom cannot judge because it neither lays out nor paints. */
export const JSDOM_UNSUPPORTED_RULES: readonly DisabledRule[] = [
  {
    id: 'color-contrast',
    reason: 'jsdom does not paint; contrast is checked in a real browser (Playwright)',
  },
  {
    id: 'target-size',
    reason: 'jsdom has no layout; target size is checked in a real browser (Playwright)',
  },
];

export interface ComponentAxeOptions {
  readonly disableRules?: readonly DisabledRule[];
}

/** Thrown when axe finds violations; the message lists rule, impact and offending nodes. */
export class ComponentAxeError extends Error {
  override readonly name = 'ComponentAxeError';

  constructor(
    message: string,
    readonly violations: readonly Result[],
  ) {
    super(message);
  }
}

function runningInJsdom(): boolean {
  return typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent);
}

/** Runs axe on `context` (an element attached to the document) and returns the results. */
export async function runAxe(
  context: Element | Document,
  options: ComponentAxeOptions = {},
): Promise<AxeResults> {
  const disabled = [
    ...(runningInJsdom() ? JSDOM_UNSUPPORTED_RULES : []),
    ...(options.disableRules ?? []),
  ];
  for (const rule of disabled) {
    if (!rule.reason.trim()) throw new Error(`Disabling axe rule "${rule.id}" needs a reason.`);
  }
  return axe.run(context, {
    runOnly: { type: 'tag', values: [...WCAG_TAGS] },
    rules: Object.fromEntries(disabled.map((rule) => [rule.id, { enabled: false }])),
    resultTypes: ['violations'],
  });
}

/** Fails when axe finds any WCAG 2.2 AA violation in `context`. */
export async function assertNoAxeViolations(
  context: Element | Document,
  options: ComponentAxeOptions = {},
): Promise<AxeResults> {
  const results = await runAxe(context, options);
  if (results.violations.length > 0) {
    const lines = results.violations.flatMap((violation) => [
      `  ${violation.id} (${violation.impact ?? 'unknown impact'}): ${violation.help}`,
      ...violation.nodes.map((node) => `    - ${node.target.join(' ')}`),
    ]);
    throw new ComponentAxeError(
      `${results.violations.length} accessibility violation(s) (axe-core, WCAG 2.2 AA):\n${lines.join('\n')}`,
      results.violations,
    );
  }
  return results;
}
