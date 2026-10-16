'use client';

import type { Workspace } from '@xr/contracts/draft';
import type { MockSession, Role, ShellBanner } from '@xr/domain';
import type { ShellBannerKind } from '@xr/ui';
import { type ReactNode, useLayoutEffect, useMemo, useState } from 'react';

import { initialsOf } from '@/copy/people';
import { WORKSPACE_NAV } from '@/nav/nav-config';
import { useAppNavigation } from '@/nav/navigation';
import { recordPageVisit } from '@/nav/page-location';
import { isFocusedAddress } from '@/nav/routes';
import { useNavCounts } from '@/queries/nav-counts';
import { useCurrentSession, useWorkspaceAccess } from '@/queries/session';

import { useMyDeviceEntry } from '../../student/st-18-my-device/device-entry';
import { DocumentTitle } from '../document-title';
import { SessionGate, SessionLoading, useSignOut } from '../session-gate/session-gate';
import { RoleWorkspaceShell } from '../workspace-shell/role-workspace-shell';
import type { ShellPerson } from '../xs-05-account-menu/account-menu';
import { NotYourWorkspace } from '../xs-06-not-your-workspace/not-your-workspace';
import { useRouteFocus } from './route-focus';
import {
  type ShellPlacement,
  ShellPersonContext,
  ShellPlacementContext,
  type WorkspaceIdentity,
  WorkspaceIdentityContext,
} from './shell-page';

/** XS-08: the banner the session's facts call for (board 05; derived by the service on every read). */
export function bannerKindOf(banners: readonly ShellBanner[]): ShellBannerKind | null {
  if (banners.includes('account-inactive')) return 'inactive';
  if (banners.includes('institution-paused')) return 'paused';
  return null;
}

/** The person as the shell shows them, from the session as the records say now (ADR-0003). */
export function shellPersonOf(session: MockSession): ShellPerson {
  const organisation = session.institutionName ?? session.organisation;
  return {
    id: session.personId,
    name: session.displayName,
    initials: initialsOf(session.displayName),
    ...(organisation ? { organisation } : {}),
  };
}

/** The page's words in the browser tab: its current crumb, then its top-bar title (state-copy). */
export function documentWords(placement: ShellPlacement): string {
  return placement.currentCrumb && placement.currentCrumb !== placement.title
    ? `${placement.currentCrumb} · ${placement.title}`
    : placement.title;
}

/** A workspace base folder (ADR-0005 §1), as the route files name it. */
export type WorkspaceBase = Workspace;

/** The route layer supplies Next.js navigation through these (route files may import features only). */
export { type AppNavigation, NavigationProvider } from '@/nav/navigation';
export { BootTitle, SessionLoading } from '../session-gate/session-gate';

/**
 * One workspace's layout (Appendix F §3.3 `<base>/layout.tsx`): the session gate, then the
 * workspace frame. Rendered by the route layer for each of the seven static bases (ADR-0005 §1).
 */
export function WorkspaceLayout({
  workspace,
  children,
}: {
  readonly workspace: Workspace;
  readonly children?: ReactNode;
}) {
  return (
    <SessionGate>
      <WorkspaceFrame workspace={workspace}>{children}</WorkspaceFrame>
    </SessionGate>
  );
}

/**
 * The workspace frame (Appendix F §3.3 `WorkspaceFrame expected="<role>"`, §5.2 "Workspace guard
 * (XS-06)"; ADR-0005 §5; board 08). The shell is chosen by the SESSION role, never by the
 * address: the session port says who is signed in (`getSession`) and whether this workspace is
 * theirs (`checkWorkspace`). On another role's workspace the person's own shell shows XS-06 in
 * place of the page — the address is kept, nothing in the sidebar is current, "Back to Home" and
 * Help are their own — and the requested page is never rendered, so it reads nothing.
 */
export function WorkspaceFrame({
  workspace,
  children,
}: {
  readonly workspace: Workspace;
  readonly children?: ReactNode;
}) {
  const current = useCurrentSession();
  const access = useWorkspaceAccess(workspace);
  // Sample mode answers `unavailable` only under a test fault plan; no screen is drawn for the
  // session failing to load, so the error goes to the framework's error boundary.
  if (current.isError) throw current.error;
  if (access.isError) throw access.error;
  if (!current.data || !access.data) return <SessionLoading />;
  // Signed out between the gate's read and this one: the gate is already leaving.
  if (!current.data.ok || current.data.value === null) return <SessionLoading />;
  const answer = access.data;
  if (!answer.ok && answer.error.kind !== 'not-permitted') return <SessionLoading />;
  const { session, banners } = current.data.value;
  return (
    <FrameShell role={session.role} session={session} banners={banners} own={answer.ok}>
      {children}
    </FrameShell>
  );
}

function FrameShell({
  role,
  session,
  banners,
  own,
  children,
}: {
  readonly role: Role;
  readonly session: MockSession;
  readonly banners: readonly ShellBanner[];
  /** This workspace is the person's own; otherwise XS-06 shows in place. */
  readonly own: boolean;
  readonly children?: ReactNode;
}) {
  const signOut = useSignOut();
  const { pathname } = useAppNavigation();
  const [placement, setPlacement] = useState<ShellPlacement | null>(null);
  const config = WORKSPACE_NAV[role];
  const identity = useMemo<WorkspaceIdentity>(
    () => ({ role, personId: session.personId, home: config.base, help: config.help.href }),
    [role, session.personId, config],
  );
  const person = useMemo(() => shellPersonOf(session), [session]);
  // The sidebar's counts are the person's own workspace's figures (board 06; B1-10 "Nav count").
  const counts = useNavCounts(role);
  // XS-05 "My device": a Student holding AR, VR or MR now, or with an open transfer request
  // (B3-07 f1 / f2; state-copy `ST-18.offered`). Read for a Student only; hidden until answered.
  const device = useMyDeviceEntry(role === 'student');

  useRouteFocus(pathname);

  // "Where did it happen?" remembers the last page outside Help (`@/nav/page-location`).
  useLayoutEffect(() => {
    if (!placement) return;
    recordPageVisit(session.personId, {
      words: [
        ...(placement.trail?.map((level) => level.label) ?? []),
        placement.currentCrumb ?? placement.title,
      ],
      help: placement.screen === 'XS-07',
    });
  }, [placement, session.personId]);

  // Phase 4B: a focused task (ST-13's attempt, B4-12) draws its own bar — no sidebar, no top bar
  // of the shell — behind the same session gate and workspace guard; it names the browser tab.
  if (own && isFocusedAddress(pathname)) {
    return (
      <WorkspaceIdentityContext value={identity}>
        <ShellPersonContext value={person}>
          <ShellPlacementContext value={setPlacement}>{children}</ShellPlacementContext>
        </ShellPersonContext>
      </WorkspaceIdentityContext>
    );
  }

  return (
    <WorkspaceIdentityContext value={identity}>
      {/* The browser tab names the page (WCAG 2.4.2); Next's route announcer reads it. Where the
          current crumb names the record and the top bar its destination (B7-03: "Institutions"
          over "Godavari Institute of Technology"), the record leads. */}
      <DocumentTitle title={placement ? documentWords(placement) : ''} />
      <ShellPlacementContext value={setPlacement}>
        <RoleWorkspaceShell
          role={role}
          person={person}
          // Before the page registers (the same commit, before paint): nothing current, no title.
          screen={placement?.screen ?? 'XS-06'}
          title={placement?.title ?? ''}
          trail={placement?.trail}
          currentCrumb={placement?.currentCrumb}
          wrap="none"
          banner={bannerKindOf(banners)}
          deviceEligible={device.offered}
          counts={counts}
          onSignOut={signOut}
        >
          {own ? children : <NotYourWorkspace />}
        </RoleWorkspaceShell>
      </ShellPlacementContext>
    </WorkspaceIdentityContext>
  );
}
