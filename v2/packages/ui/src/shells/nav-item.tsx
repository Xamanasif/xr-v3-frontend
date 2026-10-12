'use client';

import { CountBadge } from '../foundation/avatar.js';
import { Icon } from '../foundation/icon.js';
import type { IconName } from '../icons/registry.js';
import { useLinkComponent } from '../link.js';
import { RailTooltip } from '../overlays/rail-tooltip.js';

/** The count beside a destination: the figure, and the same count in words for screen readers. */
export interface NavCount {
  /** The figure drawn in the badge (hidden from screen readers): 12. */
  readonly value: number | string;
  /**
   * The count in words, read instead of the figure: "12 written answers to mark", "3 requests
   * under review" (board 06 "Navigation rules": "Counts … announced in words").
   */
  readonly label: string;
}

/** One sidebar destination, as the caller's role navigation config gives it (WP-0.8). */
export interface NavDestination {
  /** The destination name, also the rail tooltip and the link's name ("Overview", "Marking"). */
  readonly label: string;
  /** Where it goes, through the injected link component. */
  readonly href: string;
  /** The board-06 icon of the destination (registry name of the drawn path). */
  readonly icon: IconName;
  /**
   * This destination owns the current screen, including its details, flows and tabs
   * (Appendix E §4.2): `aria-current="page"`, which the v46 CSS keys the gold rule, fill and bold
   * on. Message pages mark nothing current.
   */
  readonly current?: boolean;
  /**
   * Only where the count opens the list it counts (board 06 "Navigation rules"); the caller omits
   * it at zero (board 05 `hasCount`).
   */
  readonly count?: NavCount;
}

export type NavItemProps = NavDestination;

/**
 * One sidebar destination (`ul.xr-nav > li > a`; boards 05, 06, B1-10 "SA-02 Requests · 1440 ·
 * interactive"): the icon, `span.xr-nav-text`, the rail tooltip `span.xr-tip` (shown only in the
 * rail, on hover and keyboard focus) and, where given, the count in words. The accessible name is
 * always the destination name (plus the count in words).
 */
export function NavItem({ label, href, icon, current = false, count }: NavItemProps) {
  const Link = useLinkComponent();
  return (
    <li>
      <Link href={href} aria-current={current ? 'page' : undefined}>
        <Icon name={icon} />
        <span className="xr-nav-text">{label}</span>
        <RailTooltip>{label}</RailTooltip>
        {count ? <CountBadge count={count.value} label={count.label} /> : null}
      </Link>
    </li>
  );
}
