'use client';

import {
  AccountMenu,
  HelpSupportHome,
  MessagePage,
  PageHeader,
  Sidebar,
  TopBar,
  WorkspaceShell,
  type AccountMenuItem,
  type NavDestination,
  type SidebarPreference,
} from '@xr/ui';
import { useState, type ReactNode } from 'react';

import { ROLE_FIXTURES, type RoleFixture, type RoleSlug } from './role-shell-fixtures';

/**
 * WP-0.8 role-shell specimens: the seven workspaces as boards 05 and 06 draw them, composed from
 * the @xr/ui shell parts exactly as apps/web's RoleWorkspaceShell composes them (WorkspaceShell +
 * Sidebar + TopBar + AccountMenu). The harness may import @xr/ui only (boundary matrix, VD-17),
 * so the board-06 data below is harness fixture copy — labels, icons, sample counts, the
 * institution or organisation line, the sample people of board 05 — and the browser suite
 * (e2e/role-shells.spec.ts) checks what renders against the frozen board itself. apps/web's
 * configuration is checked against the same board by its unit tests. Nothing here is a screen.
 *
 * Each role has two states: Phase 0 (only Help & support is built: the sidebar shows Help alone,
 * current, on the Help page) and "every destination built" (later phases: board 06's full list,
 * the first destination current, its sample counts). `c-role-student-not-your-workspace` is the
 * XS-06 message page in the Student's own shell: nothing is current (board 08). As in apps/web,
 * the rail choice is controlled by the caller and kept in memory only (here, in the specimen).
 */

/** Harness only: marks the specimen once React has hydrated it (`[data-ready]`). */
function markReady(element: HTMLElement | null): void {
  element?.setAttribute('data-ready', 'true');
}

const slugOf = (label: string) => `#${label.toLowerCase().replace(/[^a-z]+/g, '-')}`;

/** Board 06 "Account menu": My device* (a Student with AR / VR / MR, ST-18 built) · Help · Sign out. */
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

type Page = 'help' | 'destination' | 'not-your-workspace';

function RoleShell({
  slug,
  built,
  page,
}: {
  readonly slug: RoleSlug;
  readonly built: boolean;
  readonly page: Page;
}) {
  const role: RoleFixture = ROLE_FIXTURES[slug];
  const [preference, setPreference] = useState<SidebarPreference>('auto');
  const first = role.destinations[0]!.label;
  const destinations: NavDestination[] = built
    ? role.destinations.map((destination) => ({
        label: destination.label,
        href: slugOf(destination.label),
        icon: destination.icon,
        count: 'count' in destination ? destination.count : undefined,
        current: page === 'destination' && destination.label === first,
      }))
    : [];
  const title =
    page === 'help' ? 'Help & support' : page === 'destination' ? first : 'Not your workspace';
  let content: ReactNode;
  if (page === 'help') {
    content = <HelpSupportHome reportHref="#report-a-problem" reports={[]} />;
  } else if (page === 'destination') {
    content = (
      <>
        <PageHeader overline={role.workspace} title={first} />
        <a href="#main" data-probe="page-link">
          A link on the page
        </a>
        <div className="specimen-spacer" aria-hidden="true" />
      </>
    );
  } else {
    // Board 08 "At 375 px": XS-06 in the person's own shell.
    content = (
      <MessagePage
        icon="readOnly"
        iconSize={24}
        title="This page isn’t part of your workspace"
        action={{ label: 'Back to Home', href: '#home' }}
        secondary={{ label: 'Help', href: '#help' }}
      >
        You’re signed in to the {role.workspace} workspace. This address belongs to a different
        workspace.
      </MessagePage>
    );
  }
  return (
    <div data-probe="root" ref={markReady}>
      <WorkspaceShell
        wrap={page === 'help' ? 'read' : page === 'destination' ? 'wide' : 'none'}
        sidebarPreference={preference}
        onSidebarPreferenceChange={setPreference}
        sidebar={
          <Sidebar
            workspace={role.workspace}
            institution={role.line}
            destinations={destinations}
            help={{ href: '#help', current: page === 'help' }}
          />
        }
        topBar={
          <TopBar
            title={title}
            account={
              <AccountMenu
                name={role.person}
                role={role.workspace}
                organisation={role.line}
                initials={role.initials}
                items={accountItems(built && slug === 'student')}
              />
            }
          />
        }
      >
        {content}
      </WorkspaceShell>
    </div>
  );
}

export function RoleShellSpecimen(props: {
  readonly slug: RoleSlug;
  readonly built: boolean;
  readonly page: Page;
}) {
  return <RoleShell {...props} />;
}
