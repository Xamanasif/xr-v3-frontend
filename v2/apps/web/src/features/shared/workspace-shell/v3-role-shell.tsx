'use client';

import type { Role } from '@xr/domain';
import type { ShellBannerKind } from '@xr/ui';
import {
  Banner,
  TextLink,
  TopLineSeparator,
  WorkspaceShell,
  type ShellDestination,
  type V3IconName,
} from '@xr/ui/v3';
import type { ReactNode } from 'react';

import { weekdayDate } from '@/copy/dates';
import { ACCESS_BANNER, SHELL_HELP, V3_RAIL_COUNT_WORDS } from '@/copy/xs';
import { type BoardIconKey, WORKSPACE_NAV } from '@/nav/nav-config';
import type { ScreenKey } from '@/nav/screens';
import { countLabel, countValue, type NavCount, sidebarModel } from '@/nav/sidebar-model';

import {
  organisationLine,
  type ShellPerson,
  WorkspaceAccountMenu,
} from '../xs-05-account-menu/account-menu';

/**
 * The roles whose workspace has moved to the V3 Refined B shell with their owner-approved complete
 * role export (pack prompt 11): the Super Admin (design/v3-refined-b/roles/SA-v1), the Vendor
 * (roles/VE-v1), the Content Manager (roles/CM-v1), the Academic Reviewer (roles/RV-v1), the
 * Institute Admin (roles/IA-v1), the Faculty member (roles/FA-v1) and the Student (roles/ST-v1):
 * every role. The v46 role shell stays for a role whose export is not integrated.
 */
export const V3_SHELL_ROLES: ReadonlySet<Role> = new Set<Role>([
  'super_admin',
  'vendor',
  'content_manager',
  'academic_reviewer',
  'tenant_admin',
  'faculty',
  'student',
]);

/**
 * The roles whose export names the home page before the date in the top line on that page ("Overview
 * · Thursday 27 August 2026": VE-v1 `Main.dc.html` `rb-top-date`; IA-v1 `Main.dc.html` `rb-top-date`
 * with `topLabel: 'Overview'` on IA-01 only); the Super Admin, Content Manager, Academic Reviewer,
 * Faculty and Student exports draw the date alone (FA-v1 `Main.dc.html` `rb-top-date`: `sh.date`;
 * ST-v1 `StudentFinal.dc.html` `rb-top-date`: `S.dateLong`, "Monday 12 October 2026").
 */
const HOME_IN_TOP_LINE: ReadonlySet<Role> = new Set<Role>(['vendor', 'tenant_admin']);

/**
 * The rail glyph of each destination, as the role exports draw it (SA-v1 `sa-core.js` nav; VE-v1
 * `Main.dc.html` rail: the Overview grid and My experiments' flask; CM-v1 `Main.dc.html` rail: the
 * grid, upload, books, refresh and hash glyphs; RV-v1 `RV.dc.html` rail: the grid, the bulleted
 * list and the checked disc; IA-v1 `Main.dc.html` rail: the grid, the box, the person with a plus,
 * the two people and the pulse line; FA-v1 `Main.dc.html` rail: the grid, the book, the clipboard,
 * the stack, the pen and the two people; ST-v1 `StudentFinal.dc.html` rail: the house and the
 * bars, with its own book and clipboard below). A role whose export draws another glyph for the
 * same board icon has its own entry in ROLE_RAIL_ICON, read first.
 */
const RAIL_ICON: Partial<Record<BoardIconKey, V3IconName>> = {
  overview: 'overview',
  requests: 'inbox',
  inst: 'institutions',
  content: 'content',
  structure: 'academicStructure',
  roles: 'platformRoles',
  ops: 'operations',
  exps: 'myExperiments',
  publish: 'readyToPublish',
  library: 'contentLibrary',
  updates: 'updates',
  codes: 'courseCodes',
  queue: 'reviewQueue',
  reviewed: 'checkCircle',
  caccess: 'contentAccess',
  saccess: 'studentAccess',
  people: 'people',
  usage: 'usage',
  courses: 'book',
  assess: 'clipboardCheck',
  qbank: 'stack',
  marking: 'pen',
  home: 'home',
  progress: 'progress',
};

/**
 * A role's own rail glyph where its export draws another one for a board icon another role shares:
 * the Institute Admin's Requests is the kit's tray (IA-v1 `Main.dc.html` rail, `rbi-inbox`:
 * `requests`), while the Super Admin's Requests keeps the SA-v1 inbox (`inbox`); the Student's My
 * courses and Assessments are the v46 Student sidebar's book and clipboard (ST-v1
 * `StudentFinal.dc.html` rail, `sti-book`, `sti-clip`), while the Faculty member's keep FA-v1's
 * (`book`, `clipboardCheck`).
 */
const ROLE_RAIL_ICON: Readonly<Partial<Record<Role, Partial<Record<BoardIconKey, V3IconName>>>>> = {
  tenant_admin: { requests: 'requests' },
  student: { courses: 'myCourses', assess: 'assessments' },
};

export interface V3RoleShellProps {
  readonly role: Role;
  readonly person: ShellPerson;
  /** The screen on show: its rail owner is current; XS-06 and the in-shell PU-15 mark nothing. */
  readonly screen: ScreenKey;
  /**
   * XS-08, the access banner: a paused institution or an inactive account (the Institute Admin,
   * the Faculty member and the Student; never a platform role today, drawn if the session says so).
   */
  readonly banner?: ShellBannerKind | null;
  /**
   * The Student holds an AR, VR or MR format now, or has an open transfer request (the workspace
   * frame reads it, as for the v46 shell: `features/student/st-18-my-device/device-entry.ts`):
   * the account menu offers My device (XS-05). Ignored for every other role.
   */
  readonly deviceEligible?: boolean;
  readonly built?: ReadonlySet<ScreenKey>;
  readonly counts?: Readonly<Partial<Record<string, NavCount>>>;
  /** Today on the sample clock (the session's sign-in instant): the top line's date. */
  readonly today: string | null;
  readonly onSignOut: () => void;
  readonly children?: ReactNode;
}

/** The top line: the date, after the home page's name on that page where the export draws it. */
function topLine(role: Role, screen: ScreenKey, date: string): ReactNode {
  const home = WORKSPACE_NAV[role].destinations[0];
  if (!HOME_IN_TOP_LINE.has(role) || home?.screen !== screen) return date;
  return (
    <>
      {home.label}
      <TopLineSeparator />
      {date}
    </>
  );
}

/**
 * A migrated role's workspace in the V3 Refined B shell (`WorkspaceShell` of @xr/ui/v3; the role
 * export's shell): the navy rail with the reserved logo slot, the workspace and its destinations
 * (the same sidebar model as the v46 shell: built destinations, counts, the current one), "Help &
 * support" in the rail foot; the top line with today's date and the XS account menu (XS-05); the
 * XS-08 banner first in the page; the Menu drawer below 1024 px. The pages render V3 inside it;
 * a shared page whose V3 design is still pending renders in a `V46Island`.
 */
export function V3RoleShell({
  role,
  person,
  screen,
  banner,
  deviceEligible,
  built,
  counts,
  today,
  onSignOut,
  children,
}: V3RoleShellProps) {
  const config = WORKSPACE_NAV[role];
  const model = sidebarModel(role, { screen, built, counts });
  const destinations: ShellDestination[] = model.destinations.map((destination) => {
    const entry = config.destinations.find((candidate) => candidate.href === destination.href);
    const icon = entry
      ? (ROLE_RAIL_ICON[role]?.[entry.boardIcon] ?? RAIL_ICON[entry.boardIcon])
      : undefined;
    if (!icon) throw new Error(`No V3 rail icon for ${destination.label}.`);
    // The figure the sidebar model counted, worded as the role export words it where it does.
    const words = V3_RAIL_COUNT_WORDS[`${role}:${destination.href}`];
    const count = entry ? counts?.[entry.key] : undefined;
    const value = countValue(count);
    return {
      label: destination.label,
      href: destination.href,
      icon,
      current: destination.current,
      // A count with words of its own keeps them (the sidebar model's label).
      count:
        destination.count && words && value !== undefined && typeof count !== 'object'
          ? { value, label: countLabel(words, value) }
          : destination.count,
    };
  });
  return (
    <WorkspaceShell
      workspace={config.workspace}
      institution={organisationLine(role, person)}
      destinations={destinations}
      help={{ href: model.help.href, current: model.help.current, label: SHELL_HELP }}
      topLine={today ? topLine(role, screen, weekdayDate(today)) : undefined}
      account={
        <WorkspaceAccountMenu
          role={role}
          person={person}
          shell="v3"
          deviceEligible={deviceEligible}
          built={built}
          onSignOut={onSignOut}
        />
      }
      banner={
        banner ? (
          <Banner
            tone={banner === 'inactive' ? 'inactive' : 'paused'}
            action={<TextLink href={config.help.href}>{ACCESS_BANNER.help}</TextLink>}
          >
            {banner === 'inactive' ? ACCESS_BANNER.inactive : ACCESS_BANNER.paused}
          </Banner>
        ) : undefined
      }
    >
      {children}
    </WorkspaceShell>
  );
}
