'use client';

import type { Role } from '@xr/domain';
import type { BreadcrumbLevel } from '@xr/ui';
import { createContext, useContext, useLayoutEffect } from 'react';

import type { ScreenKey } from '@/nav/screens';

/**
 * What a page tells the persistent workspace shell about itself (WP-0.8 README "For WP-0.13": the
 * shell sits in the workspace layout, which cannot receive props from its pages). Each page —
 * and the in-place XS-06 and the in-shell PU-15 — registers its placement while it renders; the
 * frame passes it to the shell before the browser paints (a layout effect), so the top bar and the
 * sidebar's current item never show the previous page's facts.
 */
export interface ShellPlacement {
  /** The screen on show: its sidebar owner is current (`@/nav/active-item`). */
  readonly screen: ScreenKey;
  /** The top-bar title below 1024 px and the current crumb from 1024 px (board 05). */
  readonly title: string;
  /** The crumbs above the page, outermost first; none on a destination's own page. */
  readonly trail?: readonly BreadcrumbLevel[];
  /** The current crumb where it differs from the title. */
  readonly currentCrumb?: string;
}

export const ShellPlacementContext = createContext<((placement: ShellPlacement) => void) | null>(
  null,
);

function placementKey(placement: ShellPlacement): string {
  return JSON.stringify([
    placement.screen,
    placement.title,
    placement.trail?.map((level) => [level.label, level.href]) ?? [],
    placement.currentCrumb ?? null,
  ]);
}

/** Registers the page's placement with the workspace shell it renders in. */
export function useShellPage(placement: ShellPlacement): void {
  const register = useContext(ShellPlacementContext);
  const key = placementKey(placement);
  useLayoutEffect(() => {
    register?.(placement);
    // The key holds every field of the placement; the object itself is new on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [register, key]);
}

/** Whose workspace shell a page renders in: the signed-in person, as the session reads now. */
export interface WorkspaceIdentity {
  /** The session role; the shell, Home and Help are this role's (ADR-0005 §5). */
  readonly role: Role;
  readonly personId: string;
  /** The role's own base (`/student`): "Back to Home" (the interim landing, ADR-0005 §8). */
  readonly home: string;
  /** The role's own Help & support (`/student/help`). */
  readonly help: string;
}

export const WorkspaceIdentityContext = createContext<WorkspaceIdentity | null>(null);

export function useWorkspaceIdentity(): WorkspaceIdentity {
  const identity = useContext(WorkspaceIdentityContext);
  if (!identity) throw new Error('useWorkspaceIdentity is used outside a workspace frame.');
  return identity;
}
