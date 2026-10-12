import { joinClasses } from '../internal/classes.js';

/**
 * The exact placeholder text (BC12; `assets.json`; B8-03 "Logo box now reads “placeholder”").
 * The approved BITS Pilani / WILP lockup was never supplied (board 13 Q1); the committed
 * branding PNG is not used (VD-03, Appendix E §4.5).
 */
export const LOGO_PLACEHOLDER_TEXT = 'BITS Pilani / WILP logo — placeholder';

export interface LogoPlaceholderProps {
  /** Composition only (board 05 sets the drawer's box to fill the row beside "Close menu"). */
  readonly className?: string;
}

/**
 * The dashed logo box at the top of the workspace sidebar (`div.xr-logo-ph`, min-height 48;
 * boards 05, 06, 07). The public placements (`xp-logo`, `xp-auth-brand`) are Phase 1 (G-8).
 * An approved asset later changes this one component.
 */
export function LogoPlaceholder({ className }: LogoPlaceholderProps) {
  return <div className={joinClasses('xr-logo-ph', className)}>{LOGO_PLACEHOLDER_TEXT}</div>;
}
