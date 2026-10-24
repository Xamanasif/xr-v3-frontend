'use client';

import type { Role } from '@xr/domain';
import {
  Sidebar,
  TopBar,
  WorkspaceShell,
  type BreadcrumbLevel,
  type PageWrap,
  type ShellBannerKind,
} from '@xr/ui';
import { Banner, TextLink, V3Region } from '@xr/ui/v3';
import type { ReactNode } from 'react';

import { ACCESS_BANNER } from '@/copy/xs';
import { WORKSPACE_NAV } from '@/nav/nav-config';
import { useRailPreference } from '@/nav/rail-preference';
import type { ScreenKey } from '@/nav/screens';
import { type NavCount, sidebarModel } from '@/nav/sidebar-model';

import {
  organisationLine,
  WorkspaceAccountMenu,
  type ShellPerson,
} from '../xs-05-account-menu/account-menu';

export interface RoleWorkspaceShellProps {
  /** The signed-in person's role: the shell is chosen by the session role (ADR-0005 §5). */
  readonly role: Role;
  readonly person: ShellPerson;
  /**
   * The screen on show. Its sidebar owner is current (`@/nav/active-item`); XS-06 and the in-shell
   * PU-15 mark nothing current.
   */
  readonly screen: ScreenKey;
  /** The top-bar title below 1024 px and the current crumb from 1024 px (board 05). */
  readonly title: string;
  /** The crumbs above the current page, outermost first; none on a destination's own page. */
  readonly trail?: readonly BreadcrumbLevel[];
  /** The current crumb where it differs from the title. */
  readonly currentCrumb?: string;
  /** The page width inside `main` (default `wide`). */
  readonly wrap?: PageWrap;
  /**
   * XS-08: the institution's access is paused or the account is inactive. The facts come from
   * the session read (`SessionService.getSession` banners); the page column opens with the XS
   * banner and this workspace's Help.
   */
  readonly banner?: ShellBannerKind | null;
  /** The Student holds an AR, VR or MR format ("My device", once ST-18 is built). */
  readonly deviceEligible?: boolean;
  /** The built screens (default: the manifest). */
  readonly built?: ReadonlySet<ScreenKey>;
  /** Sidebar count figures by destination key (zero or absent: no count). */
  readonly counts?: Readonly<Partial<Record<string, NavCount>>>;
  /** Sign out, injected: the session gate runs the session port's command (WP-0.13). */
  readonly onSignOut: () => void;
  readonly children?: ReactNode;
}

/**
 * XS-08, the access banner (owner-approved Entry & shared export, `XsAccessNotice` placement
 * `banner`): the first thing in the page column of every page of an affected person — a paused
 * institution (`rk-banner`), an inactive account (the grey `xs-banner--inactive`) — with this
 * workspace's Help. Display only: what a role's pages may do is theirs to decide.
 */
export function AccessBanner({
  kind,
  helpHref,
}: {
  readonly kind: ShellBannerKind;
  readonly helpHref: string;
}) {
  return (
    <V3Region placement="banner">
      <Banner
        tone={kind === 'inactive' ? 'inactive' : 'paused'}
        action={<TextLink href={helpHref}>{ACCESS_BANNER.help}</TextLink>}
      >
        {kind === 'inactive' ? ACCESS_BANNER.inactive : ACCESS_BANNER.paused}
      </Banner>
    </V3Region>
  );
}

/**
 * One role's workspace shell (Appendix A §3.1 "StudentShell" … "SuperAdminShell"; boards 05, 06,
 * 12): the @xr/ui WorkspaceShell with this role's sidebar (workspace label, institution or
 * organisation line, the built destinations in board order, Help last), the top bar with the
 * account menu (XS-05), the XS-08 banner at the top of the page column, and the rail choice kept
 * in memory for this person in this tab. The skip link, the drawer below 1024 px, the 72 px rail
 * at 1024–1279 and the full sidebar from 1280 come from WorkspaceShell, measured on the app
 * width. The account menu's panel and the banner are the owner-approved XS designs (V3, in V3
 * roots); the rail, the top bar and the account button stay this role's v46 shell until the role
 * moves to the V3 shell.
 *
 * It takes the page's facts (screen, title, crumbs, width) as props. In the app it sits in each
 * workspace's layout (WorkspaceFrame, WP-0.13) with `wrap="none"`; the pages register their facts
 * with `useShellPage` and render their own width (`PageContent`).
 */
export function RoleWorkspaceShell({
  role,
  person,
  screen,
  title,
  trail,
  currentCrumb,
  wrap,
  banner,
  deviceEligible,
  built,
  counts,
  onSignOut,
  children,
}: RoleWorkspaceShellProps) {
  const config = WORKSPACE_NAV[role];
  const { destinations, help } = sidebarModel(role, { screen, built, counts });
  const [preference, setPreference] = useRailPreference(person.id);
  return (
    <WorkspaceShell
      wrap={wrap}
      sidebarPreference={preference}
      onSidebarPreferenceChange={setPreference}

      sidebar={
        <Sidebar
          workspace={config.workspace}
          institution={organisationLine(role, person)}
          destinations={destinations}
          help={help}
        />
      }
      topBar={
        <TopBar
          title={title}
          trail={trail}
          current={currentCrumb}
          account={
            <WorkspaceAccountMenu
              role={role}
              person={person}
              deviceEligible={deviceEligible}
              built={built}
              onSignOut={onSignOut}
            />
          }
        />
      }
    >
      {banner ? <AccessBanner kind={banner} helpHref={config.help.href} /> : null}
      {children}
    </WorkspaceShell>
  );
}
