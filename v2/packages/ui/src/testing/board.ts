/**
 * Markup-contract helpers (Appendix F §3.4 `testing/`, WP-0.6 acceptance 1–2): every component
 * test cites the board and frame its markup comes from, and proves the cited excerpt is really
 * drawn there by reading the frozen board (read only). Test support only — never in `dist`.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect } from 'vitest';

export const BOARDS_DIRECTORY = join(
  import.meta.dirname,
  '..',
  '..',
  '..',
  '..',
  '..',
  'design',
  'handoff-v46',
  'canvas-v46',
  'project',
);

/** A board code as the inventory cites it ('03', '10', 'B1-10') and a frame or section caption. */
export interface BoardSource {
  readonly board: string;
  readonly frame: string;
}

const cache = new Map<string, string>();

/** Whitespace collapsed, entities the boards use decoded, `<path>` closing tags dropped. */
export function normaliseMarkup(html: string): string {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<\/path>/g, '')
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .trim();
}

/**
 * Markup with the allow-listed product classes (`xr-x-*`, T-4) taken out of every `class`
 * attribute, for comparing a rendered element that carries a PF product class with the board
 * excerpt it reproduces; the product class itself is asserted separately with its PF entry.
 */
export function withoutProductClasses(html: string): string {
  return html.replace(/ class="([^"]*)"/g, (_match, value: string) => {
    const kept = value.split(/\s+/).filter((token) => token && !token.startsWith('xr-x-'));
    return kept.length > 0 ? ` class="${kept.join(' ')}"` : '';
  });
}

/** The normalised source of the board whose file name starts with `<code>-`. */
export function boardText(code: string): string {
  const cached = cache.get(code);
  if (cached) return cached;
  const file = readdirSync(BOARDS_DIRECTORY).find((name) => name.startsWith(`${code}-`));
  if (!file) throw new Error(`No frozen board ${code}`);
  const text = normaliseMarkup(readFileSync(join(BOARDS_DIRECTORY, file), 'utf8'));
  cache.set(code, text);
  return text;
}

/**
 * Asserts the board draws the cited frame and every excerpt (each a literal piece of board
 * markup or copy, compared whitespace-normalised). Both must be on the cited board; the check
 * does not require the excerpt to sit inside that frame, because product boards render one
 * template engine into several frames.
 */
export function expectBoardDraws(source: BoardSource, ...excerpts: readonly string[]): void {
  const text = boardText(source.board);
  const missing = [source.frame, ...excerpts].filter(
    (piece) => !text.includes(normaliseMarkup(piece)),
  );
  expect(missing, `not drawn on board ${source.board}`).toEqual([]);
}

/**
 * The strongest markup contract: `element` renders exactly the cited board excerpt (both
 * whitespace-normalised), and the board really draws it in the cited frame.
 */
export function expectRenderedAsDrawn(
  element: Element,
  source: BoardSource,
  excerpt: string,
): void {
  expectBoardDraws(source, excerpt);
  expect(normaliseMarkup(element.outerHTML)).toBe(normaliseMarkup(excerpt));
}

/**
 * `normaliseMarkup` plus every element's attributes in name order: React writes some attributes
 * (an input's `type`) in its own order, which is not a markup difference.
 */
export function canonicalMarkup(html: string): string {
  const template = document.createElement('template');
  template.innerHTML = normaliseMarkup(html);
  for (const element of template.content.querySelectorAll('*')) {
    const attributes = [...element.attributes]
      .map((attribute) => [attribute.name, attribute.value] as const)
      .sort(([a], [b]) => a.localeCompare(b));
    for (const [name] of attributes) element.removeAttribute(name);
    for (const [name, value] of attributes) element.setAttribute(name, value);
  }
  return template.innerHTML;
}

/** `expectRenderedAsDrawn`, ignoring attribute order (see `canonicalMarkup`). */
export function expectRenderedAsDrawnInAnyAttributeOrder(
  element: Element,
  source: BoardSource,
  excerpt: string,
): void {
  expectBoardDraws(source, excerpt);
  expect(canonicalMarkup(element.outerHTML)).toBe(canonicalMarkup(excerpt));
}
