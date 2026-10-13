'use client';

/**
 * The session for screens (Appendix F §3.2 `queries/session.ts`; ADR-0003): who is signed in in
 * this tab (`useSession`, from the per-tab session store) and the session as the world reads it
 * now — role, institution and the XS-08 banner facts (`useCurrentSession`). Signing in and out
 * are commands: `useCommand(ports => ports.session.signOut)`, which clears every cached answer.
 */
import type { ProductPorts, Workspace } from '@xr/contracts/draft';

import { useXrQuery, defineQuery } from './use-xr-query';

export { useSession } from '@/platform/platform-provider';
export type { SessionSnapshot } from '@/platform/session-store';

/**
 * `SessionService.getSession`: resolved from the person (PER), the institution's state and its
 * Institute Admin (INST), or a platform role holder (ROLE) on every read; banners derive from
 * the institution's pause and the person's account status.
 */
export const currentSession = defineQuery({
  family: 'session',
  view: 'current',
  deps: ['PER', 'INST', 'ROLE'],
  read: (ports: ProductPorts) => ports.session.getSession(),
});

export function useCurrentSession() {
  return useXrQuery(currentSession, null);
}

/**
 * `SessionService.checkWorkspace`: whether this workspace is the signed-in person's own (the
 * workspace guard, XS-06; ADR-0005 §5). The port decides from the person's role as the records say
 * now; another role's workspace is refused `not-permitted` (`wrong-workspace`), which the
 * workspace frame renders as XS-06 in place.
 */
export const workspaceAccess = defineQuery({
  family: 'session',
  view: 'workspace',
  deps: ['PER', 'INST', 'ROLE'],
  read: (ports: ProductPorts, workspace: Workspace) => ports.session.checkWorkspace(workspace),
});

export function useWorkspaceAccess(workspace: Workspace) {
  return useXrQuery(workspaceAccess, workspace);
}
