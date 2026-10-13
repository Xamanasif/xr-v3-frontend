'use client';

import { useEffect } from 'react';

import { helpPlacement } from '@/nav/help';
import { useAppNavigation } from '@/nav/navigation';

import { noteInterimLanding } from './route-focus';
import { useShellPage, useWorkspaceIdentity } from './shell-page';

/**
 * The interim landing at `/<base>` (ADR-0005 §8; Appendix F §3.3 `page.tsx`; register P0-35): an
 * engineering-build interim, not product navigation. Until the workspace's home screen is built
 * (SA-01 Phase 1 · IA-01, ST-01 Phase 2 · FA-01 Phase 4 · VE-01, RV-01, CM-01 Phase 5), the base
 * replaces itself with the workspace's Help & support, so "Back to Home" reaches a built page and
 * never loops.
 *
 * It runs inside the workspace frame, after the workspace guard: another role's `/<base>` shows
 * XS-06 at the address asked for (the URL is kept) instead of being redirected first. The shell
 * already shows Help's place while the address changes.
 */
export function InterimLanding() {
  const { role, help } = useWorkspaceIdentity();
  const { replace } = useAppNavigation();
  useShellPage(helpPlacement(role, { kind: 'reports' }));
  useEffect(() => {
    // Not a navigation the person asked for: focus stays where it is (route-focus).
    noteInterimLanding(help);
    replace(help);
  }, [replace, help]);
  return null;
}
