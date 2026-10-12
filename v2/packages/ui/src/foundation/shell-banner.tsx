import type { ReactNode } from 'react';

import type { IconName } from '../icons/registry.js';
import { joinClasses } from '../internal/classes.js';
import { Icon } from './icon.js';
import { Link } from './links.js';

/** XS-08: the institution's access is paused (amber), or the account is inactive (navy). */
export type ShellBannerKind = 'paused' | 'inactive';

export interface ShellBannerProps {
  readonly kind: ShellBannerKind;
  /** Where Help is (the HelpSupport page of the current workspace). */
  readonly helpHref: string;
  /** Board context classes or apps/web composition utilities. */
  readonly className?: string;
}

/**
 * The words are fixed: boards 04, 05, B1-09, B2-01 … B3-01 draw them verbatim on every
 * instance (Appendix E §3.1 ShellBanner row).
 */
const BANNER: Readonly<
  Record<ShellBannerKind, { readonly icon: IconName; readonly words: ReactNode }>
> = {
  paused: {
    icon: 'paused',
    words: <strong>Your institution’s access is paused — your work is kept.</strong>,
  },
  inactive: {
    icon: 'notAvailable',
    words: (
      <>
        <strong>Your account is inactive.</strong> Contact your institution administrator.
      </>
    ),
  },
};

/**
 * The shell banner (XS-08; `div.xr-banner`): shown below the top bar, `role="status"`, a shell
 * banner and never a modal (B8-07). It states the fact and offers Help only (board 04 "Kept open
 * on purpose"). Paused is amber (`xr-banner--paused`); inactive is navy (`xr-banner--inactive
 * xr-dark`, so focus rings turn gold).
 */
export function ShellBanner({ kind, helpHref, className }: ShellBannerProps) {
  const { icon, words } = BANNER[kind];
  return (
    <div
      className={joinClasses(
        'xr-banner',
        `xr-banner--${kind}`,
        kind === 'inactive' && 'xr-dark',
        className,
      )}
      role="status"
    >
      <div className="xr-banner-msg">
        <Icon name={icon} />
        <span>{words}</span>
      </div>
      <Link className="xr-btn xr-btn--text" href={helpHref}>
        Help
      </Link>
    </div>
  );
}
