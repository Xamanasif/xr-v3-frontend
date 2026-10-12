import type { FormatCode } from '../icons/registry.js';
import { joinClasses } from '../internal/classes.js';
import { FormatGlyph } from './icon.js';

/**
 * Board 04 "Format chips · WEB · AR · VR · MR": offered (`xr-fmt`, indigo tint — "this
 * technology exists for this experiment"), available to you / inherited (`--yours`, navy fill),
 * unavailable (`--off`, dashed: the words beside it say which "not"), on a navy header band
 * (`--on-dark`, record-hub header and public hero only).
 */
export type FormatVariant = 'offered' | 'yours' | 'off' | 'on-dark';

export interface FormatBadgeProps {
  readonly format: FormatCode;
  readonly variant?: FormatVariant;
  /** `xr-fmt--compact`: 24 px high, for rows (board 04 "5 · Compact · inside rows"). */
  readonly compact?: boolean;
  /**
   * The 16 px format glyph. Shown by default, as on the product boards (1,801 compact chips on
   * B1–B8 keep it). Boards 03 and 04 draw compact chips without it ("glyph dropped"):
   * `glyph={false}` reproduces them. Board variance, see the WP-0.6 ledger.
   */
  readonly glyph?: boolean;
  readonly className?: string;
}

/**
 * One format chip (`span.xr-fmt`): glyph + code. The chip names a technology and never
 * changes on completion; access and progress are said in words beside it, which the caller
 * supplies (board 04 "Four things the chips must never blur"). Classes are emitted as the
 * product boards draw them: variant modifier, then `xr-fmt--compact`.
 */
export function FormatBadge({
  format,
  variant = 'offered',
  compact = false,
  glyph = true,
  className,
}: FormatBadgeProps) {
  return (
    <span
      className={joinClasses(
        'xr-fmt',
        variant !== 'offered' && `xr-fmt--${variant}`,
        compact && 'xr-fmt--compact',
        className,
      )}
    >
      {glyph && <FormatGlyph format={format} />}
      {format}
    </span>
  );
}

/** A chip whose variant differs from the rest of its set (board 04: WEB, VR offered, AR off). */
export interface FormatSetItem {
  readonly format: FormatCode;
  readonly variant?: FormatVariant;
}

export interface FormatSetProps {
  /**
   * The chips, in the order given. Presentation order is WEB · AR · VR · MR (Appendix E §3.1);
   * apps/web owns that order map, and this component never re-sorts (board 04 itself draws
   * "WEB, VR, AR (off)" in one compact row).
   */
  readonly formats: readonly (FormatCode | FormatSetItem)[];
  /** The variant of every chip that does not name its own. */
  readonly variant?: FormatVariant;
  readonly compact?: boolean;
  readonly glyph?: boolean;
  readonly className?: string;
}

/** A row of format chips (`span.xr-fmt-set`; board 04, B2-11, B3-01, B1-05). */
export function FormatSet({ formats, variant, compact, glyph, className }: FormatSetProps) {
  return (
    <span className={joinClasses('xr-fmt-set', className)}>
      {formats.map((item, index) => {
        const chip = typeof item === 'string' ? { format: item } : item;
        return (
          <FormatBadge
            key={`${index}-${chip.format}`}
            format={chip.format}
            variant={chip.variant ?? variant}
            compact={compact}
            glyph={glyph}
          />
        );
      })}
    </span>
  );
}
