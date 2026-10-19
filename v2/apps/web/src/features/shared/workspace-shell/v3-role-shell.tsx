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
import { ACCESS_BANNER, SHELL_HELP } from '@/copy/xs';
import { type BoardIconKey, WORKSPACE_NAV } from '@/nav/nav-config';
import type { ScreenKey } from '@/nav/screens';
import { sidebarModel } from '@/nav/sidebar-model';

import {
  organisationLine,
  type ShellPerson,
  WorkspaceAccountMenu,
} from '../xs-05-account-menu/account-menu';

/**
 * The roles whose workspace has moved to the V3 Refined B shell with their owner-approved complete
 * role export (pack prompt 11): the Super Admin (design/v3-refined-b/roles/SA-v1) and the Vendor
 * (roles/VE-v1). Every other role keeps its v46 shell until its own export is integrated.
 */
export const V3_SHELL_ROLES: ReadonlySet<Role> = new Set<Role>(['super_admin', 'vendor']);

/**
 * The roles whose export names the home page before the date in the top line on that page ("Overview
 * · Thursday 27 August 2026": VE-v1 `Main.dc.html` `rb-top-date`, as IA-01 draws it); the Super Admin
 * export draws the date alone.
 */
const HOME_IN_TOP_LINE: ReadonlySet<Role> = new Set<Role>(['vendor']);

/**
 * The rail glyph of each destination, as the role exports draw it (SA-v1 `sa-core.js` nav; VE-v1
 * `Main.dc.html` rail: the Overview grid and My experiments' flask).
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
};

export interface V3RoleShellProps {
  readonly role: Role;
  readonly person: ShellPerson;
  /** The screen on show: its rail owner is current; XS-06 and the in-shell PU-15 mark nothing. */
  readonly screen: ScreenKey;
  /** XS-08, the access banner (never for a platform role today; drawn if the session says so). */
  readonly banner?: ShellBannerKind | null;
  readonly built?: ReadonlySet<ScreenKey>;
  readonly counts?: Readonly<Partial<Record<string, number>>>;
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
    const icon = entry ? RAIL_ICON[entry.boardIcon] : undefined;
    if (!icon) throw new Error(`No V3 rail icon for ${destination.label}.`);
    return {
      label: destination.label,
      href: destination.href,
      icon,
      current: destination.current,
      count: destination.count,
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
        <WorkspaceAccountMenu role={role} person={person} shell="v3" onSignOut={onSignOut} />
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
