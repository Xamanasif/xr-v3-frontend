/**
 * The class names the v46 stylesheets and the product layer define, and a check that a rendered
 * component emits only those (Appendix F WP-0.6 acceptance 2: "product-only classes are exactly
 * the `xr-x-*` allow-list"; ADR-0001 §5). Test support only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PRODUCT_CLASS_ALLOW_LIST } from '@xr/config/policy-terms';
import { expect } from 'vitest';

const STYLES = join(import.meta.dirname, '..', 'styles');
const SHEETS = [
  'v46/xr-foundation.css',
  'v46/xr-public.css',
  'v46/xr-workspace.css',
  'v46/xr-learning.css',
  'v46/xr-assess.css',
  'v46/xr-vendor.css',
  'v46/xr-govern.css',
  'v46/xr-admin.css',
  'product.css',
];

function classNamesIn(css: string): Set<string> {
  const rules = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/url\([^)]*\)/g, '');
  return new Set([...rules.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((match) => match[1] ?? ''));
}

/** Every class a selector of the 8 v46 sheets or `product.css` names. */
export const STYLESHEET_CLASS_NAMES: ReadonlySet<string> = new Set(
  SHEETS.flatMap((sheet) => [...classNamesIn(readFileSync(join(STYLES, sheet), 'utf8'))]),
);

/** Every class token on `root` and its descendants. */
export function classesIn(root: Element): string[] {
  return [
    ...new Set(
      [root, ...root.querySelectorAll('[class]')].flatMap((element) => [...element.classList]),
    ),
  ].sort();
}

/**
 * Fails if `root` emits a class the stylesheets do not define (an invented class), or a product
 * class that is not on the allow-list.
 */
export function expectStylesheetClassesOnly(root: Element): void {
  const classes = classesIn(root);
  const product = classes.filter((name) => name.startsWith('xr-x-'));
  expect(product.filter((name) => !PRODUCT_CLASS_ALLOW_LIST.includes(name))).toEqual([]);
  expect(
    classes.filter((name) => !name.startsWith('xr-x-') && !STYLESHEET_CLASS_NAMES.has(name)),
  ).toEqual([]);
}
