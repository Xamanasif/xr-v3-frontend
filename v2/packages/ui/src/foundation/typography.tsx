import type { ReactNode } from 'react';

import { joinClasses } from '../internal/classes.js';

/**
 * The workspace type scale of board 02 "Type scale" (`xr-foundation.css`): display 44/52 ·
 * h1 32/40 · h2 22/30 · h3 18/26 · lead 18/28 · body 16/24 · small 14/20 · meta 14/20 ink 3 ·
 * caption 13/18 · overline 13/16 caps. Below 600 px of app width h1 becomes 26/34, h2 20/28 and
 * display 32/40 (the sheet's container query; board 02 "Below 600 px, H1 becomes 26 / 34 and
 * H2 20 / 28"). The public `xp-*` scale is Phase 1 (G-8).
 */
export type TypeStyle =
  'display' | 'h1' | 'h2' | 'h3' | 'lead' | 'body' | 'small' | 'meta' | 'caption' | 'overline';

/** The elements the boards set these styles on (e.g. `h2.xr-h3` in empty states, `dt.xr-overline`). */
export type TextElement = 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div' | 'dt' | 'dd';

/**
 * The default element of each style (board markup census): the heading styles default to the level
 * their name says, the text styles to the element the boards use most (`p.xr-lead` 201,
 * `p.xr-body` 1,393, `p.xr-small` 289, `span.xr-meta` 1,765, `p.xr-caption` 16,
 * `span.xr-overline` 769). The boards also draw `xr-h3` on `h2` (550, empty-state titles) more
 * often than on `h3` (420): the page outline decides, so pass `as`. `xr-display` is drawn only in
 * board 02's scale (on a span); it defaults to `p`.
 */
const DEFAULT_ELEMENT: Readonly<Record<TypeStyle, TextElement>> = {
  display: 'p',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  lead: 'p',
  body: 'p',
  small: 'p',
  meta: 'span',
  caption: 'p',
  overline: 'span',
};

export interface TextProps {
  /** The type style: `xr-<variant>`. */
  readonly variant: TypeStyle;
  /**
   * The element, when it is not the usual one: `h2` for an `xr-h3` empty-state title (B5-01), `p`
   * for a heading look on text that is not a heading. Heading levels follow the page outline,
   * never the look. A `display` line that is the page title passes `as="h1"`.
   */
  readonly as?: TextElement;
  /** Tabular figures (`xr-num`, board 02 "Numbers that line up use tabular figures"). */
  readonly tabular?: boolean;
  readonly id?: string;
  /** A heading that is a focus target after an action takes `tabIndex={-1}`. */
  readonly tabIndex?: -1;
  /** Board context classes (`xw-nowrap`, `xw-full`) or composition. */
  readonly className?: string;
  readonly children: ReactNode;
}

/**
 * Text in one of the board-02 type styles. The boards draw `xr-num` before the scale class
 * (`span.xr-num.xr-meta`); the element defaults to the one the boards use most.
 */
export function Text({
  variant,
  as,
  tabular = false,
  id,
  tabIndex,
  className,
  children,
}: TextProps) {
  const Element = as ?? DEFAULT_ELEMENT[variant];
  return (
    <Element
      className={joinClasses(tabular && 'xr-num', `xr-${variant}`, className)}
      id={id}
      tabIndex={tabIndex}
    >
      {children}
    </Element>
  );
}

export interface NumProps {
  readonly children: ReactNode;
  readonly className?: string;
}

/** Figures that line up (`span.xr-num`, tabular-nums; 09a AR-1 "Licences 1,284 of 1,650 …"). */
export function Num({ children, className }: NumProps) {
  return <span className={joinClasses('xr-num', className)}>{children}</span>;
}

export interface VisuallyHiddenProps {
  /** Words for screen readers only: ", 12 written answers to mark", "(opens in a new tab)". */
  readonly children: ReactNode;
  /** `span` (702 board uses) or `h2` (a section named for screen readers only, 10 uses). */
  readonly as?: 'span' | 'h2';
  readonly id?: string;
}

/** Visually hidden text that screen readers still read (`xr-sr`; board 02 "Links and focus"). */
export function VisuallyHidden({ children, as: Element = 'span', id }: VisuallyHiddenProps) {
  return (
    <Element id={id} className="xr-sr">
      {children}
    </Element>
  );
}
