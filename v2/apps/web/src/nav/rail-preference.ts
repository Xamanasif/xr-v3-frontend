import { useCallback, useSyncExternalStore } from 'react';

import type { SidebarPreference } from '@xr/ui';

/**
 * The rail expand / collapse choice, "remembered per person" (board 06 "Behaviour"; 13 Q7), kept
 * in memory for the signed-in sample person within this browser tab: the Phase-0 interim (VD-20,
 * X-10, register DV-7). Nothing is written to localStorage, sessionStorage or anywhere else while
 * the persistence decision is open; a reload starts again from the board default (`auto`: the
 * rail at 1024–1279, the full sidebar from 1280). It is a UI preference, not a product setting.
 *
 * Choices are only made in the browser (a press of "Expand menu" / "Collapse menu"), so the
 * server never holds one and renders the default.
 */
const choices = new Map<string, SidebarPreference>();
const listeners = new Set<() => void>();

/** The person's choice in this tab, or the board default. */
export function railPreference(personId: string): SidebarPreference {
  return choices.get(personId) ?? 'auto';
}

/** Records the person's choice for the rest of this tab's life. */
export function setRailPreference(personId: string, preference: SidebarPreference): void {
  choices.set(personId, preference);
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The person's choice and its setter, for `WorkspaceShell`'s controlled preference. */
export function useRailPreference(
  personId: string,
): readonly [SidebarPreference, (preference: SidebarPreference) => void] {
  const preference = useSyncExternalStore(
    subscribe,
    () => railPreference(personId),
    () => 'auto' as const,
  );
  const set = useCallback(
    (next: SidebarPreference) => setRailPreference(personId, next),
    [personId],
  );
  return [preference, set];
}
