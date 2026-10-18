'use client';

import { AccountMenu, TopLineSeparator, WorkspaceShell, type ShellDestination } from '@xr/ui/v3';
import type { ReactNode } from 'react';

/**
 * Public Sans with the weight range the Refined B sheets use (400–800, so 650 and 800 render as
 * drawn) — the V3 boards' own link. Only V3 specimen pages load it, so the v46 specimen and parity
 * pages keep exactly their fonts.
 */
export function V3Fonts() {
  return (
    // eslint-disable-next-line @next/next/no-page-custom-font -- a specimen page's own font range
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400..800&display=swap"
      precedence="v3-fonts"
    />
  );
}

const SA_DESTINATIONS = (current: 'overview' | 'requests'): readonly ShellDestination[] => [
  { label: 'Overview', href: '/v3-sa-01', icon: 'overview', current: current === 'overview' },
  {
    label: 'Requests',
    href: '/v3-sa-02',
    icon: 'inbox',
    current: current === 'requests',
    count: { value: 3, label: '3 requests under review' },
  },
  { label: 'Institutions', href: '#', icon: 'institutions' },
  { label: 'Content', href: '#', icon: 'content' },
  { label: 'Academic structure', href: '#', icon: 'academicStructure' },
  { label: 'Platform roles', href: '#', icon: 'platformRoles' },
  { label: 'Operations', href: '#', icon: 'operations' },
];

const ACCOUNT_ITEMS = (base: string) =>
  [
    { kind: 'link', label: 'Help', href: `${base}/help`, icon: 'help' },
    { kind: 'separator' },
    { kind: 'button', label: 'Sign out', icon: 'signOut', onSelect: () => undefined },
  ] as const;

/** The Super Admin shell of the V3 specimens (SA01, SA02). */
export function SuperAdminShell({
  current,
  date,
  children,
}: {
  readonly current: 'overview' | 'requests';
  readonly date: string;
  readonly children: ReactNode;
}) {
  return (
    <>
      <V3Fonts />
      <WorkspaceShell
        workspace="Super Admin"
        destinations={SA_DESTINATIONS(current)}
        help={{ href: '#' }}
        topLine={date}
        account={
          <AccountMenu
            name="Arjun Mehta"
            role="Super Admin"
            initials="AM"
            items={ACCOUNT_ITEMS('#admin')}
          />
        }
      >
        {children}
      </WorkspaceShell>
    </>
  );
}

const IA_DESTINATIONS = (current: 'overview' | 'content-access'): readonly ShellDestination[] => [
  { label: 'Overview', href: '/v3-ia-01', icon: 'overview', current: current === 'overview' },
  {
    label: 'Content access',
    href: '/v3-ia-02',
    icon: 'contentAccess',
    current: current === 'content-access',
  },
  { label: 'Student access', href: '#', icon: 'studentAccess' },
  { label: 'People', href: '#', icon: 'people' },
  { label: 'Requests', href: '#', icon: 'requests' },
  { label: 'Usage', href: '#', icon: 'usage' },
];

/** The Institute Admin shell of the V3 specimens (IA01, IA02). */
export function InstituteAdminShell({
  current,
  date,
  children,
}: {
  readonly current: 'overview' | 'content-access';
  readonly date: string;
  readonly children: ReactNode;
}) {
  return (
    <>
      <V3Fonts />
      <WorkspaceShell
        workspace="Institute Admin"
        institution="Godavari Institute of Technology"
        destinations={IA_DESTINATIONS(current)}
        help={{ href: '#' }}
        topLine={
          current === 'overview' ? (
            <>
              Overview
              <TopLineSeparator />
              {date}
            </>
          ) : (
            date
          )
        }
        account={
          <AccountMenu
            name="Meera Iyer"
            role="Institute Admin"
            organisation="Godavari Institute of Technology"
            initials="MI"
            items={ACCOUNT_ITEMS('#institute')}
          />
        }
      >
        {children}
      </WorkspaceShell>
    </>
  );
}
