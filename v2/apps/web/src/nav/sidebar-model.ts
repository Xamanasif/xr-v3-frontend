import type { Role } from '@xr/domain';
import type { NavDestination, SidebarHelp } from '@xr/ui';

import { currentItem } from './active-item';
import { BUILT_SCREENS } from './built-screens';
import { BOARD_ICON, WORKSPACE_NAV, type CountWords } from './nav-config';
import type { ScreenKey } from './screens';

export interface SidebarModelOptions {
  /** The screen on show; its owner is current (`active-item.ts`). */
  readonly screen: ScreenKey;
  /** The built screens (default: the manifest). Only their destinations render. */
  readonly built?: ReadonlySet<ScreenKey>;
  /**
   * Figures for the destinations that count something, by destination key, from the services
   * (board 06 sample numbers are not product data). Zero or absent draws no count (board 05
   * `hasCount`).
   */
  readonly counts?: Readonly<Partial<Record<string, NavCount>>>;
}

/**
 * A destination's count: the figure (worded by the destination's `countWords`), or the figure with
 * words of its own when what it counts differs from those words (the Faculty member's Marking with
 * submissions to confirm, owner decision of 24 Oct 2026).
 */
export type NavCount = number | { readonly value: number; readonly label: string };

/** The figure of a count. */
export function countValue(count: NavCount | undefined): number | undefined {
  return typeof count === 'object' ? count.value : count;
}

export interface SidebarModel {
  readonly destinations: readonly NavDestination[];
  readonly help: SidebarHelp;
}

/** A count in words: the singular for 1 where the configuration has one, else board 06's words. */
export function countLabel(words: CountWords, value: number): string {
  return (value === 1 && words.one ? words.one : words.other).replace('{n}', String(value));
}

/**
 * The sidebar of a workspace on one screen: the built destinations in board order, the current
 * one marked (`aria-current="page"` through NavItem), counts in words, and Help last — current on
 * the Help pages, and nothing current on message pages.
 */
export function sidebarModel(role: Role, options: SidebarModelOptions): SidebarModel {
  const config = WORKSPACE_NAV[role];
  const built = options.built ?? BUILT_SCREENS;
  const current = currentItem(role, options.screen);
  return {
    destinations: config.destinations
      .filter((destination) => built.has(destination.screen))
      .map((destination) => {
        const count = options.counts?.[destination.key];
        const value = countValue(count);
        return {
          label: destination.label,
          href: destination.href,
          icon: BOARD_ICON[destination.boardIcon],
          current: current === destination.key,
          count:
            destination.countWords && value !== undefined && value > 0
              ? {
                  value,
                  label:
                    typeof count === 'object'
                      ? count.label
                      : countLabel(destination.countWords, value),
                }
              : undefined,
        };
      }),
    help: { href: config.help.href, current: current === 'help' },
  };
}
