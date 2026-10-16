'use client';

import { useCallback, useSyncExternalStore } from 'react';

import { useSession } from '@/queries/session';

import { EMPTY_EDITOR_DRAFT, type EditorDraft } from './editor-view';

/**
 * What the editor has been given and not yet saved (state-copy `VE-03.kept`): in memory only —
 * never localStorage or sessionStorage — for the signed-in person whose session it was typed in and
 * the record it was typed for (`new` for an experiment without an id yet, else its SUB id), for the
 * life of the tab (as FA-07's `create-draft.ts`). It survives the steps' own address changes and
 * leaving the editor and coming back; it is dropped by Save draft / Save changes (the saved record
 * is shown again), by Submit / Resubmit and by Cancel. A different session never reads it. A reload
 * starts again from the saved record.
 *
 * Beside it, the one "Draft saved · …" line a save leaves for the page it moves to (the first save
 * of a new experiment changes the address to the draft's own, which mounts the editor again).
 */
const drafts = new Map<string, EditorDraft>();
const flashes = new Map<string, string>();
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

/** The draft typed in this session for this record, or `null` when nothing was typed. */
export function editorDraftFor(sessionKey: string | null, record: string): EditorDraft | null {
  return sessionKey === null ? null : (drafts.get(slotKey(sessionKey, record)) ?? null);
}

/** Forgets what was typed for a record (Save, Submit, Resubmit, Cancel). */
export function clearEditorDraft(sessionKey: string | null, record: string): void {
  if (sessionKey === null || !drafts.delete(slotKey(sessionKey, record))) return;
  publish();
}

/** Forgets every draft and saved line in this tab (a fresh tab: component tests start each world so). */
export function forgetEditorDrafts(): void {
  flashes.clear();
  if (drafts.size === 0) return;
  drafts.clear();
  publish();
}

/** Leaves the saved line for the record's next mount (the first save's new address). */
export function leaveSavedLine(sessionKey: string | null, record: string, words: string): void {
  if (sessionKey !== null) flashes.set(slotKey(sessionKey, record), words);
}

/** The saved line left for this record, if any (read while the page first renders). */
export function savedLineFor(sessionKey: string | null, record: string): string | null {
  return sessionKey === null ? null : (flashes.get(slotKey(sessionKey, record)) ?? null);
}

/** Forgets the saved line once the page has shown it (it is shown once). */
export function forgetSavedLine(sessionKey: string | null, record: string): void {
  if (sessionKey !== null) flashes.delete(slotKey(sessionKey, record));
}

/** The signed-in session's key, or `null` while nobody is known. */
export function useSessionKey(): string | null {
  const session = useSession();
  return session.status === 'signed-in' ? session.sessionKey : null;
}

/**
 * The draft on show for a record — what was typed, else `base` (the saved record's content, or the
 * empty draft) — whether anything was typed, and a functional update (it reads the latest draft,
 * so two quick changes in one event never lose the first). The first change copies `base`.
 */
export function useEditorDraft(
  record: string,
  base: EditorDraft | null,
): readonly [EditorDraft, boolean, (change: (current: EditorDraft) => EditorDraft) => void] {
  const sessionKey = useSessionKey();
  const typed = useSyncExternalStore(
    subscribe,
    () => editorDraftFor(sessionKey, record),
    () => null,
  );
  const update = useCallback(
    (change: (current: EditorDraft) => EditorDraft) => {
      if (sessionKey === null) return;
      const current = editorDraftFor(sessionKey, record) ?? base ?? EMPTY_EDITOR_DRAFT;
      drafts.set(slotKey(sessionKey, record), change(current));
      publish();
    },
    [sessionKey, record, base],
  );
  return [typed ?? base ?? EMPTY_EDITOR_DRAFT, typed !== null, update];
}
