import type { ReactNode } from 'react';

import type { FormatCode } from '../icons/registry.js';
import { Glyph } from './icons.js';

/** The technology formats, always in this order (foundation contract "Keep WEB/AR/VR/MR order"). */
export const FORMAT_ORDER: readonly FormatCode[] = ['WEB', 'AR', 'VR', 'MR'];

/**
 * The three appearances a format has everywhere (core.css `xr-fmt`, rb-kit.css `rk-fcell`, rb.css
 * `rb-fc`): `on` solid navy — requested on a request, in the plan on an institution's plan;
 * `pub` dashed indigo — published but not requested / not in the plan; `none` flat grey — not
 * published. The look never changes meaning silently: every cell carries its words from the
 * caller ("Requested", "In your plan", "Published, not in your plan", "Not published"), and a
 * role-specific state keeps one of these looks with its own explicit words.
 */
export type FormatState = 'on' | 'pub' | 'none';

function inFormatOrder<Item extends { readonly format: FormatCode }>(
  items: readonly Item[],
): Item[] {
  const seen = new Set<FormatCode>();
  for (const { format } of items) {
    if (seen.has(format)) throw new Error(`Format ${format} is listed twice.`);
    seen.add(format);
  }
  return [...items].sort(
    (left, right) => FORMAT_ORDER.indexOf(left.format) - FORMAT_ORDER.indexOf(right.format),
  );
}

export interface FormatBadgesProps {
  /** The formats a row names (requested or in the plan), drawn as compact solid badges. */
  readonly formats: readonly FormatCode[];
  /**
   * What the badges mean, read instead of the codes: "Formats requested: WEB, VR". The boards
   * put it in an `aria-label` on a plain `span`, which assistive technology ignores; here it is
   * visually hidden text (ADR-0010).
   */
  readonly label: string;
}

/** `span.rk-fmts`: the solid `xr-fmt` badges of a list row (SA-02 "Experiments"). */
export function FormatBadges({ formats, label }: FormatBadgesProps) {
  const ordered = inFormatOrder(formats.map((format) => ({ format })));
  return (
    <span className="rk-fmts">
      <span className="xr-sr">{label}</span>
      {ordered.map(({ format }) => (
        <span key={format} className="xr-fmt" aria-hidden="true">
          {format}
        </span>
      ))}
    </span>
  );
}

export interface FormatCell {
  readonly format: FormatCode;
  readonly state: FormatState;
  /** The state in words ("Requested", "In your plan", "Not published"). */
  readonly words: string;
  /** The format's name ("Browser", "Virtual reality"): the `experiment` and `plan` variants. */
  readonly name?: string;
}

export interface FormatCellsProps {
  /**
   * `strip` (SA-03 "What they're asking for": code + words), `experiment` (IA-02 experiment card:
   * code, name, words) or `plan` (IA-01 access-plan sheet, `rb-fc`).
   */
  readonly variant: 'strip' | 'experiment' | 'plan';
  /** The list's name: "Formats of Shell-and-Tube Heat Exchanger". */
  readonly label: string;
  readonly cells: readonly FormatCell[];
}

/** The format cells of an experiment, in WEB/AR/VR/MR order (`ul.rk-fstrip` / `ul.rb-fcells`). */
export function FormatCells({ variant, label, cells }: FormatCellsProps) {
  const ordered = inFormatOrder(cells);
  if (variant === 'plan') {
    return (
      <ul className="rb-fcells" aria-label={label}>
        {ordered.map((cell) => (
          <li key={cell.format} className={`rb-fc rb-fc--${cell.state}`}>
            <span className="rb-fc-code">
              {cell.format}
              {cell.state === 'on' ? <Glyph name="check" /> : null}
            </span>
            {cell.name ? <span className="rb-fc-name">{cell.name}</span> : null}
            <span className="rb-fc-state">{cell.words}</span>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="rk-fstrip" aria-label={label}>
      {ordered.map((cell) => (
        <li key={cell.format} className={`rk-fcell rk-fcell--${cell.state}`}>
          <b>
            {cell.format}
            {cell.state === 'on' ? <Glyph name="check" /> : null}
          </b>
          {variant === 'experiment' ? (
            <>
              {cell.name ? <span className="rk-fcell-n">{cell.name}</span> : null}
              <span className="rk-fcell-s">{cell.words}</span>
            </>
          ) : (
            <span>{cell.words}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export interface FormatKeyItem {
  readonly state: FormatState;
  /** "Requested", "Published, not requested", "Not published". */
  readonly words: ReactNode;
}

export interface FormatKeyProps {
  readonly items: readonly FormatKeyItem[];
  /**
   * The key's name ("Format key"): a named list (IA-02). Without it the key is decorative
   * (`aria-hidden`), as SA-03 draws it, because every cell already says its state in words.
   */
  readonly label?: string;
}

function Swatch({ state }: { readonly state: FormatState }) {
  return (
    <span className={`rk-swatch rk-swatch--${state}`} aria-hidden="true">
      {state === 'on' ? <Glyph name="check" /> : null}
    </span>
  );
}

/** The key to the three format appearances (`rk-legend`). */
export function FormatKey({ items, label }: FormatKeyProps) {
  if (label) {
    return (
      <ul className="rk-legend" aria-label={label}>
        {items.map((item) => (
          <li key={item.state} className="rk-legend-i">
            <Swatch state={item.state} />
            {item.words}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div className="rk-legend" aria-hidden="true">
      {items.map((item) => (
        <span key={item.state} className="rk-legend-i">
          <Swatch state={item.state} />
          {item.words}
        </span>
      ))}
    </div>
  );
}
