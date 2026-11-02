import { joinClasses } from '../internal/classes.js';

/**
 * The official BITS Pilani WILP lockup (K-02; the owner's `branding/bits-pilani-wilp-logo.png`,
 * 632 × 316, served by the web app as `/brand/bits-wilp-lockup.png` — the file the approved V1
 * landing already shows, so every header, footer, sign-in card and sidebar shows the same asset).
 */
export const OFFICIAL_LOGO = {
  src: '/brand/bits-wilp-lockup.png',
  alt: 'BITS Pilani Work Integrated Learning Programmes',
  width: 632,
  height: 316,
} as const;

/**
 * The words the logo box used to read before the official lockup was placed (BC12; `assets.json`;
 * B8-03). Kept only so older references resolve: the box now shows the lockup and these words are
 * its accessible name.
 */
export const LOGO_PLACEHOLDER_TEXT = OFFICIAL_LOGO.alt;

/** The lockup image, sized by its box (product.css PF-15). */
export function OfficialLogoImage() {
  return (
    <img
      className="xr-logo-img"
      src={OFFICIAL_LOGO.src}
      alt={OFFICIAL_LOGO.alt}
      width={OFFICIAL_LOGO.width}
      height={OFFICIAL_LOGO.height}
    />
  );
}

export interface LogoPlaceholderProps {
  /**
   * `sidebar` (default): the workspace box `div.xr-logo-ph` (boards 05, 06, 07). `public`: the
   * public header, footer and sign-in card box `span.xp-logo` (B1-01 … B1-09; Phase 1).
   */
  readonly placement?: 'sidebar' | 'public';
  /** Composition only (board 05 sets the drawer's box to fill the row beside "Close menu"). */
  readonly className?: string;
}

/**
 * The logo box: at the top of the workspace sidebar (`div.xr-logo-ph`, min-height 48; boards 05,
 * 06, 07), and in the public header, footer and sign-in card (`span.xp-logo`; B1-01 … B1-09). The
 * boxes keep their drawn size and white tile; they now hold the official lockup.
 */
export function LogoPlaceholder({ placement = 'sidebar', className }: LogoPlaceholderProps) {
  if (placement === 'public') {
    return (
      <span className={joinClasses('xp-logo', 'xr-logo--official', className)}>
        <OfficialLogoImage />
      </span>
    );
  }
  return (
    <div className={joinClasses('xr-logo-ph', 'xr-logo--official', className)}>
      <OfficialLogoImage />
    </div>
  );
}
