import type { ReactNode } from 'react';

/** Narrowest and widest content widths a specimen can be framed at (px). */
export const MIN_CONTENT_WIDTH = 200;
export const MAX_CONTENT_WIDTH = 2400;

/**
 * Parses the `width` search parameter: absent = the frame fills the viewport; otherwise a
 * whole number of CSS px within the supported range. Anything else is not a valid address.
 */
export function parseContentWidth(raw: string | string[] | undefined): number | null | 'invalid' {
  if (raw === undefined) return null;
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) return 'invalid';
  const width = Number(raw);
  return width >= MIN_CONTENT_WIDTH && width <= MAX_CONTENT_WIDTH ? width : 'invalid';
}

/**
 * Frames a specimen at a content width (B1-10, for example, is checked at 343/759/760/1112).
 * A plain `div`, not a landmark: shell and page specimens bring their own `main` (WP-0.6).
 */
export function SpecimenFrame({
  width,
  children,
}: {
  readonly width: number | null;
  readonly children: ReactNode;
}) {
  return (
    <div
      className="specimen-frame"
      data-content-width={width ?? 'viewport'}
      style={width === null ? undefined : { inlineSize: `${width}px` }}
    >
      {children}
    </div>
  );
}
