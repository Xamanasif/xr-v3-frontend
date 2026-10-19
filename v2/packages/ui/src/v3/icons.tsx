import { ICON_PATHS } from '../icons/registry.js';
import { joinClasses } from '../internal/classes.js';

/**
 * The line icons the Refined Direction B boards draw (foundation XR-V3-RB-1.0): the nav icons
 * inline in each rail, and the `rbi-*` / `rki-*` symbols of SA01, SA02, IA01 and IA02, plus the
 * ones the Entry & shared export (XS-v6) draws in its sign-in card, account menu, Help pages and
 * messages, and the Super Admin export (SA-v1) in its sprite. Twenty-six are the very paths of
 * the v46 registry (taken from it, so the two never drift); the others are new to V3.
 * `primitives.test.tsx` checks every path against the board or export that draws it.
 */
export const V3_ICON_PATHS = {
  // Shared with the v46 registry (identical paths).
  overview: ICON_PATHS.overview,
  institutions: ICON_PATHS.institutions,
  content: ICON_PATHS.content,
  academicStructure: ICON_PATHS.academicStructure,
  platformRoles: ICON_PATHS.platformRoles,
  operations: ICON_PATHS.operations,
  help: ICON_PATHS.help,
  menu: ICON_PATHS.menu,
  close: ICON_PATHS.close,
  add: ICON_PATHS.add,
  contentAccess: ICON_PATHS.contentAccess,
  studentAccess: ICON_PATHS.studentAccess,
  people: ICON_PATHS.studentsPeople,
  requests: ICON_PATHS.requests,
  usage: ICON_PATHS.usage,
  chevronDown: ICON_PATHS.chevronDown,
  check: ICON_PATHS.done,
  alertCircle: ICON_PATHS.failed,
  alertTriangle: ICON_PATHS.warning,
  clock: ICON_PATHS.clock,
  pauseCircle: ICON_PATHS.paused,
  ended: ICON_PATHS.notAvailable,
  // Shared with the v46 registry, drawn by the XS export (XS-v6).
  back: ICON_PATHS.back,
  signOut: ICON_PATHS.signOut,
  retry: ICON_PATHS.retry,
  checkCircle: ICON_PATHS.reviewedByMe,
  // New in Refined Direction B.
  inbox: 'M4 13l2.5-7h11L20 13v6H4zM4 13h5l1.5 2h3L15 13h5',
  calendar:
    'M8 3v3M16 3v3M4 9h16M20 11V6a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h6M17.5 21a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM17.5 16v1.6l1 .9',
  edit: 'M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4',
  headset:
    'M3 9.5A2.5 2.5 0 0 1 5.5 7h13A2.5 2.5 0 0 1 21 9.5v5a2.5 2.5 0 0 1-2.5 2.5h-3.3a2 2 0 0 1-1.7-1l-.7-1.2a1 1 0 0 0-1.7 0l-.7 1.2a2 2 0 0 1-1.7 1H5.5A2.5 2.5 0 0 1 3 14.5z',
  lifebuoy:
    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5.6 5.6l3.9 3.9M14.5 14.5l3.9 3.9M18.4 5.6l-3.9 3.9M9.5 14.5l-3.9 3.9',
  userMinus:
    'M15 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-4A3.5 3.5 0 0 0 4 17.5V19M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM16.5 11h5',
  hourglass: 'M6 3h12M6 21h12M7 3v3a5 5 0 0 0 10 0V3M7 21v-3a5 5 0 0 1 10 0v3',
  userQuestion:
    'M15 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-4A3.5 3.5 0 0 0 4 17.5V19M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM17.5 8.5a2 2 0 1 1 2.6 1.9c-.6.2-.6.7-.6 1.1M20 14.5h.01',
  faculty: 'M3 9l9-4 9 4-9 4-9-4zM7 11v4.5c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V11M21 9v5',
  search: 'M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15zM16 16l5 5',
  chevronRight: 'M9.5 6l6 6-6 6',
  filter: 'M4 6h10M18 6h2M16 4v4M4 12h3M11 12h9M9 10v4M4 18h11M19 18h1M17 16v4',
  arrowDown: 'M12 5v14M6 13l6 6 6-6',
  arrowUp: 'M12 19V5M6 11l6-6 6 6',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5zM12 15v2.5',
  cloudAlert: 'M7 18h10a4 4 0 0 0 .6-8 6 6 0 0 0-11.4-1.5A4.5 4.5 0 0 0 7 18zM12 11v4M12 17.5h.01',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5a7.5 7.5 0 0 1 15 0',
  // New in the XS export (XS-v6): the information disc of its notices and prototype line.
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01',
  // New in the Super Admin export (SA-v1, `sa-core.js` sprite): its own information disc, the
  // done disc of its flashes, the plain calendar, the person, the way out and the layers.
  infoDisc: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5h.01',
  okDisc: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12.5l3 3 5-6',
  calendarPlain:
    'M8 3v3M16 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z',
  person: 'M18 20v-1.5a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4V20M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  exit: 'M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l-4-4 4-4M6 12h10',
  layers: 'M12 3 3 8l9 5 9-5zM3 13l9 5 9-5',
} as const satisfies Record<string, string>;

export type V3IconName = keyof typeof V3_ICON_PATHS;

/** 20 px is the default `xr-ico`; 16 and 18 are the core.css size modifiers. */
export type V3IconSize = 16 | 18 | 20;

export interface V3IconProps {
  readonly name: V3IconName;
  readonly size?: V3IconSize;
  /** A Refined B context class (V3 classes only). */
  readonly className?: string;
}

/**
 * A Refined B line icon, always decorative (`aria-hidden`): a control that shows only an icon
 * carries its own accessible name. Markup as the boards draw it:
 * `<svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="…"/></svg>`.
 */
export function Icon({ name, size = 20, className }: V3IconProps) {
  return (
    <svg
      className={joinClasses(
        'xr-ico',
        size === 16 && 'xr-ico--16',
        size === 18 && 'xr-ico--18',
        className,
      )}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d={V3_ICON_PATHS[name]} />
    </svg>
  );
}

/**
 * The bare glyph the kit draws inside a styled box (`.rk-state-ico svg`, `.rk-notice > svg`,
 * `.rb-pi-kind svg`, …): the box's own rule sizes and strokes it, so it carries no class.
 */
export function Glyph({ name }: { readonly name: V3IconName }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={V3_ICON_PATHS[name]} />
    </svg>
  );
}
