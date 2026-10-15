'use client';

import { useCallback, useSyncExternalStore } from 'react';

import { useSession } from '@/queries/session';

import { EMPTY_RULES, type RulesDraft } from '../shared/rules-fields';

/**
 * What FA-07 has been given so far: the experiment, the name, introduction and rules as typed, and
 * the questions ticked. Nothing is pre-filled (BC6; B4-04 f2 "rules start empty").
 */
export interface CreateDraft {
  readonly experimentId: string | null;
  readonly rules: RulesDraft;
  /** The ticked questions' ids; the bank's order decides their order (`FA-07.question-order`). */
  readonly questionIds: readonly string[];
}

export const EMPTY_CREATE_DRAFT: CreateDraft = Object.freeze({
  experimentId: null,
  rules: EMPTY_RULES,
  questionIds: Object.freeze([]) as readonly string[],
});

/**
 * The guided flow's typed state in this tab (state-copy `FA-07.kept`): in memory only — never
 * localStorage or sessionStorage — for the signed-in person whose session it was typed in, for the
 * life of the tab (as the rail preference and the PU-08 request draft). It survives the steps'
 * own address changes and a round trip to "New question" (FA-15, which unmounts this page); it is
 * dropped by Create, Save as draft and Cancel, and is never shown to another session: a different
 * session key reads the empty draft and the next write replaces the old one. A reload starts again.
 */
let slot: { readonly key: string; readonly draft: CreateDraft } | null = null;
const listeners = new Set<() => void>();

function publish(): void {
  for (const listener of [...listeners]) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The draft typed in this session, or the empty draft. */
export function createDraftFor(key: string | null): CreateDraft {
  return key !== null && slot?.key === key ? slot.draft : EMPTY_CREATE_DRAFT;
}

/** Forgets the draft (Create, Save as draft, Cancel). */
export function clearCreateDraft(): void {
  if (slot === null) return;
  slot = null;
  publish();
}

/** The signed-in session's key, or `null` while nobody is known. */
export function useSessionKey(): string | null {
  const session = useSession();
  return session.status === 'signed-in' ? session.sessionKey : null;
}

/**
 * The draft of the signed-in session, and a functional update (it reads the latest draft, so two
 * quick changes in one event never lose the first).
 */
export function useCreateDraft(): readonly [
  CreateDraft,
  (change: (current: CreateDraft) => CreateDraft) => void,
] {
  const key = useSessionKey();
  const draft = useSyncExternalStore(
    subscribe,
    () => createDraftFor(key),
    () => EMPTY_CREATE_DRAFT,
  );
  const update = useCallback(
    (change: (current: CreateDraft) => CreateDraft) => {
      if (key === null) return;
      slot = { key, draft: change(createDraftFor(key)) };
      publish();
    },
    [key],
  );
  return [draft, update];
}
