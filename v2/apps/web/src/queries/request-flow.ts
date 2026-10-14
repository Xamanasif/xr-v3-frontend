'use client';

/**
 * The public request flow's own state in this tab (B1-06 → B1-07; Appendix D §6.5 "values come
 * back from the per-tab draft store"; register P1-20: no prompt, drafts kept per tab): what the
 * visitor has typed on PU-08, and the request just sent (PU-09 "Request sent" is shown only right
 * after a successful submit in this tab, Appendix A PU-09).
 *
 * In memory only — never `sessionStorage`, whose use stays limited to the approved selection basket
 * and request tickets (ADR-0004 §2; owner, 14 Oct 2026), nor `localStorage` — and dropped at every
 * change of who is signed in to the tab, so nothing typed or sent by one person stays on show for
 * the next. A reload starts both again (ADR-0004 option A).
 */
import type { PublicRequestInput } from '@xr/contracts/draft';
import type { RequestedTerm, RequestId, RequestRouteId } from '@xr/domain';
import { useCallback, useEffect, useSyncExternalStore } from 'react';

import { usePlatform } from '@/platform/platform-provider';
import type { SessionStore } from '@/platform/session-store';

/** The PU-08 form as typed (B1-07 `reqInit`: inst, contact, email, phone, lic, term, until, msg). */
export interface RequestDraft {
  readonly institutionName: string;
  readonly contactPerson: string;
  readonly email: string;
  readonly phone: string;
  readonly licences: string;
  readonly term: 'monthly' | 'quarterly' | 'yearly' | 'until-date' | null;
  readonly endsOn: string;
  readonly message: string;
}

export const EMPTY_DRAFT: RequestDraft = Object.freeze({
  institutionName: '',
  contactPerson: '',
  email: '',
  phone: '',
  licences: '',
  term: null,
  endsOn: '',
  message: '',
});

/** The request this tab has just sent: its reference and the address of its status page. */
export interface SentRequest {
  readonly reference: RequestId;
  readonly routeId: RequestRouteId;
}

let draft: RequestDraft = EMPTY_DRAFT;
let sent: SentRequest | null = null;
const listeners = new Set<() => void>();
/** The session store whose identity changes clear the flow (one per tab). */
let watched: SessionStore | null = null;

function publish(): void {
  for (const listener of [...listeners]) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Forgets the draft and the request just sent (a sign-in, a sign-out, a different person). */
export function clearRequestFlow(): void {
  if (draft === EMPTY_DRAFT && sent === null) return;
  draft = EMPTY_DRAFT;
  sent = null;
  publish();
}

/** Starts watching the tab's session once: every identity change clears the flow. */
function watch(session: SessionStore): void {
  if (watched === session) return;
  watched = session;
  const keyOf = () => {
    const snapshot = session.getSnapshot();
    return snapshot.status === 'unknown' ? null : snapshot.sessionKey;
  };
  let last = keyOf();
  session.subscribe(() => {
    const next = keyOf();
    if (next !== last) clearRequestFlow();
    last = next;
  });
}

function useWatchedSession(): void {
  const runtime = usePlatform();
  useEffect(() => {
    if (runtime) watch(runtime.session);
  }, [runtime]);
}

/** The draft and a setter for some of its fields. */
export function useRequestDraft(): readonly [RequestDraft, (patch: Partial<RequestDraft>) => void] {
  useWatchedSession();
  const current = useSyncExternalStore(
    subscribe,
    () => draft,
    () => EMPTY_DRAFT,
  );
  const update = useCallback((patch: Partial<RequestDraft>) => {
    draft = { ...draft, ...patch };
    publish();
  }, []);
  return [current, update];
}

/** The request just sent in this tab, if any (PU-09). */
export function useSentRequest(): SentRequest | null {
  useWatchedSession();
  return useSyncExternalStore(
    subscribe,
    () => sent,
    () => null,
  );
}

/** A request was accepted: remember it for PU-09, and forget what was typed (B1-07 f8). */
export function rememberSent(request: SentRequest): void {
  sent = request;
  draft = EMPTY_DRAFT;
  publish();
}

/** The draft as `submitPublicRequest` takes it (the items come from the selection, never the form). */
export function requestInput(form: RequestDraft): PublicRequestInput {
  const term: Exclude<RequestedTerm, { kind: 'current-plan' }> | null =
    form.term === null
      ? null
      : form.term === 'until-date'
        ? ({ kind: 'until-date', endsOn: form.endsOn } as Extract<
            RequestedTerm,
            { kind: 'until-date' }
          >)
        : { kind: form.term };
  return {
    institutionName: form.institutionName,
    contactPerson: form.contactPerson,
    email: form.email,
    phone: form.phone,
    licencesRequested: form.licences,
    message: form.message,
    term: term as PublicRequestInput['term'],
  };
}

/** Tests only: a new tab. */
export function forgetRequestFlow(): void {
  draft = EMPTY_DRAFT;
  sent = null;
  watched = null;
  listeners.clear();
}
