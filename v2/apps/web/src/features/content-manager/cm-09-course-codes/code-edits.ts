'use client';

import { useCallback, useSyncExternalStore } from 'react';

import { useSession } from '@/queries/session';

/** The codes typed and not saved yet, by course id (as typed: trimming happens on Save codes). */
export type CodeEdits = Readonly<Record<string, string>>;

const NO_EDITS: CodeEdits = Object.freeze({});

/**
 * CM-09’s typed codes in this tab (state-copy `CM-09.kept`): in memory only — never localStorage or
 * sessionStorage — for the signed-in person whose session they were typed in, for the life of the
 * tab (as FA-07’s create draft). They survive a visit to another page of the workspace (the page
 * unmounts); Save codes and Undo changes drop them, and another session reads none — its first
 * edit replaces them. A reload starts again.
 */
let slot: { readonly key: string; readonly edits: CodeEdits } | null = null;
const listeners = new Set<() => void>();

function publish(): void {
  for (const listener of [...listeners]) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function editsFor(key: string | null): CodeEdits {
  return key !== null && slot?.key === key ? slot.edits : NO_EDITS;
}

/** Forgets every typed code (Save codes, Undo changes; tests between renders). */
export function clearCodeEdits(): void {
  if (slot === null) return;
  slot = null;
  publish();
}

/**
 * The signed-in session’s typed codes, and a functional update (it reads the latest edits, so two
 * quick changes in one event never lose the first).
 */
export function useCodeEdits(): readonly [
  CodeEdits,
  (change: (current: CodeEdits) => CodeEdits) => void,
] {
  const session = useSession();
  const key = session.status === 'signed-in' ? session.sessionKey : null;
  const edits = useSyncExternalStore(
    subscribe,
    () => editsFor(key),
    () => NO_EDITS,
  );
  const update = useCallback(
    (change: (current: CodeEdits) => CodeEdits) => {
      if (key === null) return;
      slot = { key, edits: change(editsFor(key)) };
      publish();
    },
    [key],
  );
  return [edits, update];
}
