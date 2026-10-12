import { joinClasses } from '../internal/classes.js';
import {
  FORMAT_GLYPH_PATHS,
  ICON_PATHS,
  type FormatCode,
  type IconName,
} from '../icons/registry.js';

export type IconSize = 16 | 20 | 24;

export interface IconProps {
  readonly name: IconName;
  /** 20 is the default (stroke 1.75); 16 (stroke 2) and 24 use `xr-ico--16` / `xr-ico--24`. */
  readonly size?: IconSize;
  /** A board context class that styles the icon, e.g. `xr-acct-chev` (v46 classes only). */
  readonly className?: string;
}

/**
 * A v46 line icon (board 02 "Icon sizing and working icon set"): always decorative
 * (`aria-hidden`); a control that shows only an icon carries its own accessible name.
 * Markup as drawn: `<svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="…"/></svg>`.
 */
export function Icon({ name, size = 20, className }: IconProps) {
  return (
    <svg
      className={joinClasses(
        'xr-ico',
        size === 16 && 'xr-ico--16',
        size === 24 && 'xr-ico--24',
        className,
      )}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

/** The 16 px format glyph inside `span.xr-fmt` (board 04), decorative. */
export function FormatGlyph({ format }: { readonly format: FormatCode }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d={FORMAT_GLYPH_PATHS[format]} />
    </svg>
  );
}
