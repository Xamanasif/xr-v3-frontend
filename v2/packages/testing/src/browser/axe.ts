import { AxeBuilder } from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import type { AxeResults, Result } from 'axe-core';

import { WCAG_TAGS } from '../wcag.js';

export { WCAG_TAGS };

/** A rule switched off for one scan. The reason is mandatory and appears in reports. */
export interface DisabledAxeRule {
  readonly id: string;
  readonly reason: string;
}

export interface AxeScanOptions {
  /** CSS selectors to scan instead of the whole page. */
  readonly include?: readonly string[];
  readonly exclude?: readonly string[];
  readonly disableRules?: readonly DisabledAxeRule[];
}

/** Thrown when axe finds WCAG violations; the message lists rule, impact and targets. */
export class AxeViolationsError extends Error {
  override readonly name = 'AxeViolationsError';

  constructor(
    message: string,
    readonly violations: readonly Result[],
  ) {
    super(message);
  }
}

/**
 * The accessibility wrapper for browser tests: runs axe-core (through
 * `@axe-core/playwright`) against the WCAG 2.2 AA tag set and fails on any violation.
 * Best-practice rules are outside the tag set on purpose; a rule is switched off only
 * with a written reason.
 */
export async function expectNoAxeViolations(
  page: Page,
  options: AxeScanOptions = {},
): Promise<AxeResults> {
  let builder = new AxeBuilder({ page }).withTags([...WCAG_TAGS]);
  for (const selector of options.include ?? []) builder = builder.include(selector);
  for (const selector of options.exclude ?? []) builder = builder.exclude(selector);
  for (const rule of options.disableRules ?? []) {
    if (!rule.reason.trim()) throw new Error(`Disabling axe rule "${rule.id}" needs a reason.`);
  }
  if (options.disableRules?.length) {
    builder = builder.disableRules(options.disableRules.map((rule) => rule.id));
  }
  const results = await builder.analyze();
  if (results.violations.length > 0) {
    throw new AxeViolationsError(formatAxeViolations(results.violations), results.violations);
  }
  return results;
}

/** One line per rule, then one line per offending node. */
export function formatAxeViolations(violations: readonly Result[]): string {
  const lines = violations.flatMap((violation) => [
    `  ${violation.id} (${violation.impact ?? 'unknown impact'}): ${violation.help}`,
    ...violation.nodes.map(
      (node) =>
        `    - ${node.target.join(' ')}${node.failureSummary ? `: ${node.failureSummary.replace(/\s+/g, ' ')}` : ''}`,
    ),
  ]);
  return `${violations.length} accessibility violation(s) (axe-core, WCAG 2.2 AA):\n${lines.join('\n')}`;
}
