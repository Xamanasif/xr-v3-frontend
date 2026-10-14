'use client';

import type { ReactNode } from 'react';
import {
  AccountMenu,
  HelpSupportHome,
  ShellBanner,
  Sidebar,
  TopBar,
  WorkspaceShell,
  type AccountMenuItem,
  type NavDestination,
  type ShellBannerKind,
} from '@xr/ui';

import { ROLE_FIXTURES, type RoleSlug } from '../components/role-shell-fixtures';

/**
 * Parity shells (WP-0.15): the seven workspaces composed from the @xr/ui shell parts exactly as
 * the role-shell specimens (WP-0.8) and apps/web's RoleWorkspaceShell compose them, with board 05
 * and 06 fixture copy, every destination built (boards 05, 06 and 11 draw the full lists). The
 * page area holds only what the boards draw as product (board 05's Help state); board 05's
 * "Page content slot · not designed in Batch 0" is canvas-only and is never rebuilt.
 */
export type ShellPage = 'destination' | 'help';

const slugOf = (label: string) => `#${label.toLowerCase().replace(/[^a-z]+/g, '-')}`;

function accountItems(device: boolean): readonly AccountMenuItem[] {
  return [
    ...(device
      ? [{ kind: 'link', label: 'My device', href: '#my-device', icon: 'myDevice' } as const]
      : []),
    { kind: 'link', label: 'Help', href: '#help', icon: 'help' },
    { kind: 'separator' },
    { kind: 'button', label: 'Sign out', icon: 'signOut', onSelect: () => undefined },
  ];
}

/** Board 05's Help state ("Help & support" with its two sample reports). */
const BOARD_05_REPORTS = [
  {
    reference: 'SUP-0213',
    title: 'VR simulation stopped loading at step 2',
    sub: 'sent 3 Oct · Shell-and-Tube Heat Exchanger · VR',
    href: '#r1',
    status: { tone: 'info', label: 'Open' },
  },
  {
    reference: 'SUP-0198',
    title: 'Lab brief link opened a blank page',
    sub: 'sent 21 Sep · resolved 23 Sep',
    href: '#r2',
    status: { tone: 'ok', label: 'Resolved' },
  },
] as const;

export function ParityShell({
  slug,
  banner,
  page,
  current = 0,
  device = false,
  title: titleOverride,
  trail,
  crumb,
  wrap = 'read',
  helpCurrent,
  children,
}: {
  readonly slug: RoleSlug;
  readonly banner: ShellBannerKind | null;
  readonly page: ShellPage;
  /** Index of the current destination (boards 05/06: the first; board 06 rail: People). */
  readonly current?: number;
  /** "My device" in the account menu (a Student with AR / VR / MR: boards 03, 05). */
  readonly device?: boolean;
  /** Board 11: the top-bar title, parent crumbs and current crumb of the frame. */
  readonly title?: string;
  readonly trail?: readonly string[];
  readonly crumb?: string;
  /** The page width class of the screen drawn (board 07: form or read). */
  readonly wrap?: 'read' | 'form' | 'wide';
  /** Help current in the sidebar (default: on the Help page). */
  readonly helpCurrent?: boolean;
  /** The page area (default: board 05's Help state on the Help page, nothing elsewhere). */
  readonly children?: ReactNode;
}) {
  const role = ROLE_FIXTURES[slug];
  const destinations: NavDestination[] = role.destinations.map((destination, index) => ({
    label: destination.label,
    href: slugOf(destination.label),
    icon: destination.icon,
    count: 'count' in destination ? destination.count : undefined,
    current: page === 'destination' && index === current,
  }));
  const title =
    titleOverride ?? (page === 'help' ? 'Help & support' : role.destinations[current]!.label);
  return (
    <WorkspaceShell
      wrap={wrap}
      banner={banner ? <ShellBanner kind={banner} helpHref="#help" /> : undefined}
      sidebar={
        <Sidebar
          workspace={role.workspace}
          institution={'line' in role ? role.line : undefined}
          destinations={destinations}
          help={{ href: '#help', current: helpCurrent ?? page === 'help' }}
        />
      }
      topBar={
        <TopBar
          title={title}
          trail={trail?.map((label) => ({ label, href: slugOf(label) }))}
          current={crumb}
          account={
            <AccountMenu
              name={role.person}
              role={role.workspace}
              organisation={'line' in role ? role.line : undefined}
              initials={role.initials}
              items={accountItems(device)}
            />
          }
        />
      }
    >
      {children ??
        (page === 'help' ? (
          <HelpSupportHome
            reportHref="#report"
            reports={BOARD_05_REPORTS}
            countText="2 reports"
            lead="Something isn’t working? Report it here and follow what happens to your report."
          />
        ) : null)}
    </WorkspaceShell>
  );
}
