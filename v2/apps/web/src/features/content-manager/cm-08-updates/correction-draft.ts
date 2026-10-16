'use client';

import { useCallback, useSyncExternalStore } from 'react';

import type { CorrectionForm } from '@/queries/cm-correction-forms';
import { useSession } from '@/queries/session';

/**
 * What the correction draft has been given and not yet saved (state-copy `CM-08.kept`): in memory
 * only — never localStorage or sessionStorage — for the signed-in person whose session it was typed
 * in and the update it was typed for, for the life of the tab (as the Vendor editor's
 * `editor-draft.ts`). It survives leaving the update and coming back, and a refused or failed save;
 * it is dropped by Save draft, Send for academic review and Withdraw (the saved record is shown
 * again). Each typed form remembers the update's revision it was typed on (`baseRev`): a save sends
 * that revision, so a change made meanwhile in another tab is refused as stale, never overwritten.
 *
 * Beside it, the one-off "Back from the correction" signal (B6-08 f3; state-copy
 * `CM-05.back-from-correction`): set by "Back to the published experiment" on an open update, read
 * once by that experiment's CM-05 — never in the address or browser storage.
 */
export interface TypedCorrection {
  readonly form: CorrectionForm;
  readonly baseRev: number;
}

const typed = new Map<string, TypedCorrection>();
const backFlashes = new Set<string>();
const listeners = new Set<() => void>();

function slotKey(sessionKey: string, record: string): string {
  return `${sessionKey}|${record}`;
}

function publish(): void {
  for (const listener of [...listeners]) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The signed-in session's key, or `null` while nobody is known. */
export function useCorrectionSessionKey(): string | null {
  const session = useSession();
  return session.status === 'signed-in' ? session.sessionKey : null;
}

/** The form typed in this session for this update, or `null` when nothing was typed. */
export function typedCorrectionFor(
  sessionKey: string | null,
  updateId: string,
): TypedCorrection | null {
  return sessionKey === null ? null : (typed.get(slotKey(sessionKey, updateId)) ?? null);
}

/** Forgets what was typed for an update (Save draft, Send, Withdraw; the update moved on). */
export function clearTypedCorrection(sessionKey: string | null, updateId: string): void {
  if (sessionKey === null || !typed.delete(slotKey(sessionKey, updateId))) return;
  publish();
}

/** Keeps what was typed, now on the update's current revision (after a stale refusal). */
export function rebaseTypedCorrection(
  sessionKey: string | null,
  updateId: string,
  rev: number,
): void {
  if (sessionKey === null) return;
  const key = slotKey(sessionKey, updateId);
  const current = typed.get(key);
  if (!current || current.baseRev === rev) return;
  typed.set(key, { ...current, baseRev: rev });
  publish();
}

/** Forgets every typed correction and signal in this tab (component tests start each world so). */
export function forgetCorrectionDrafts(): void {
  backFlashes.clear();
  if (typed.size === 0) return;
  typed.clear();
  publish();
}

/**
 * The form on show for an update — what was typed, else `base` (the saved draft) — whether
 * anything was typed, the revision a save sends, and a functional update that reads the latest
 * form (two quick changes in one event never lose the first). The first change copies `base`.
 */
export function useTypedCorrection(
  updateId: string,
  base: { readonly form: CorrectionForm; readonly rev: number } | null,
): {
  readonly form: CorrectionForm | null;
  readonly isTyped: boolean;
  readonly expectedRev: number | null;
  readonly change: (next: (current: CorrectionForm) => CorrectionForm) => void;
} {
  const sessionKey = useCorrectionSessionKey();
  const kept = useSyncExternalStore(
    subscribe,
    () => typedCorrectionFor(sessionKey, updateId),
    () => null,
  );
  const change = useCallback(
    (next: (current: CorrectionForm) => CorrectionForm) => {
      if (sessionKey === null || base === null) return;
      const current = typedCorrectionFor(sessionKey, updateId) ?? {
        form: base.form,
        baseRev: base.rev,
      };
      typed.set(slotKey(sessionKey, updateId), { ...current, form: next(current.form) });
      publish();
    },
    [sessionKey, updateId, base],
  );
  return {
    form: kept?.form ?? base?.form ?? null,
    isTyped: kept !== null,
    expectedRev: kept?.baseRev ?? base?.rev ?? null,
    change,
  };
}

/** "Back to the published experiment" from an open update: CM-05 says so once (B6-08 f3). */
export function noteBackFromCorrection(sessionKey: string | null, experimentId: string): void {
  if (sessionKey !== null) backFlashes.add(slotKey(sessionKey, experimentId));
}

/** Whether CM-05 should say "Back from the correction" (read while the page first renders). */
export function backFromCorrectionFor(sessionKey: string | null, experimentId: string): boolean {
  return sessionKey !== null && backFlashes.has(slotKey(sessionKey, experimentId));
}

/** Forgets the signal once CM-05 has shown it (it is shown once). */
export function forgetBackFromCorrection(sessionKey: string | null, experimentId: string): void {
  if (sessionKey !== null) backFlashes.delete(slotKey(sessionKey, experimentId));
}
