/**
 * SA-18 / SA-19 as views of the DTR record the Super Admin reads (`listDeviceTransfers`) — pure
 * functions, no React. The record carries canonical facts only: who requested, forwarded and
 * approved it are its own history entries and `forwarded` / `approved` stamps; the words are the
 * Super Admin export's (`@/copy/operations`) and the shared state words
 * (`@/copy/flow-state-words`). Nothing here decides what the Super Admin may do: the one action,
 * Approve, is offered while the record is forwarded (`transferActionWords`) and the service
 * decides it again. No DTR reference is ever part of these words (SA-v1 HANDOFF).
 */
import type { ActorRef, DeviceTransfer, DeviceTransferState } from '@xr/domain';
import { ROLE_LABEL } from '@xr/domain';
import type { StatusTone, TimelineEvent } from '@xr/ui/v3';

import { dateTime, dayMonthYear } from '@/copy/dates';
import { transferWords, wordsOf } from '@/copy/flow-state-words';
import { forwardedByWords, HISTORY_WORDS, TRANSFERS_LIST } from '@/copy/operations';
import type { TransferShow } from '@/nav/operations';

/** A person's name as the record stamped it (a transfer is only ever moved by people). */
export function actorName(actor: ActorRef): string {
  if (actor.kind === 'person') return actor.displayName;
  return actor.kind === 'requester' ? actor.name : '';
}

/** A person's role in words, when the record names one ("Institute Admin"). */
function actorRole(actor: ActorRef): string | null {
  return actor.kind === 'person' ? ROLE_LABEL[actor.role] : null;
}

/** The requesting Student, as the record's own "requested" entry names them. */
export function requesterName(transfer: DeviceTransfer): string {
  const requested = transfer.history.find((entry) => entry.event === 'requested');
  return requested ? actorName(requested.actor) : '';
}

/** "Meera Iyer" and "Institute Admin": who forwarded it. */
export function forwarderOf(
  transfer: DeviceTransfer,
): { readonly name: string; readonly role: string | null } | null {
  if (!transfer.forwarded) return null;
  const by = transfer.forwarded.by;
  return { name: actorName(by), role: actorRole(by) };
}

/** "Meera Iyer, Institute Admin" — or the name alone when the record names no role. */
export function forwarderWords(transfer: DeviceTransfer): string | null {
  const forwarder = forwarderOf(transfer);
  if (!forwarder) return null;
  return forwarder.role ? forwardedByWords(forwarder.name, forwarder.role) : forwarder.name;
}

/** The status pill's tone (the export's `DTR_LBL`: info, the grey dash, ok). */
export function transferTone(state: DeviceTransferState): StatusTone {
  return state === 'approved' ? 'ok' : state === 'forwarded' ? 'info' : 'ended';
}

/** The Super Admin's words for the state ("Forwarded", "Still with the institution", "Approved"). */
export function transferStatusWords(state: DeviceTransferState): string {
  return wordsOf(transferWords(state, 'super_admin')) ?? '';
}

/** The moment each view orders by, newest first (state-copy `SA-18.rows`). */
function orderKey(transfer: DeviceTransfer, show: TransferShow): string {
  if (show === 'approved') return transfer.approved?.at ?? transfer.requestedAt;
  if (show === 'forwarded') return transfer.forwarded?.at ?? transfer.requestedAt;
  return transfer.requestedAt;
}

export function inListOrder(
  transfers: readonly DeviceTransfer[],
  show: TransferShow,
): readonly DeviceTransfer[] {
  return [...transfers].sort((a, b) => {
    const [ka, kb] = [orderKey(a, show), orderKey(b, show)];
    return ka === kb ? 0 : ka < kb ? 1 : -1;
  });
}

/** The "Forwarded" cell: the day it was forwarded ("23 Oct 2026"), or "Not yet". */
export function forwardedDay(transfer: DeviceTransfer): string {
  return transfer.forwarded ? dayMonthYear(transfer.forwarded.at) : TRANSFERS_LIST.notYet;
}

/**
 * The record's history, newest first: approved ("Approved by Arjun Mehta" — the authorisation
 * moved to the new device), forwarded ("Forwarded to BITS" — by the Institute Admin), requested
 * ("Transfer requested" — by the Student).
 */
export function historyEvents(transfer: DeviceTransfer): readonly TimelineEvent[] {
  const events = transfer.history.map((entry): TimelineEvent => {
    const when = dateTime(entry.at);
    switch (entry.event) {
      case 'approved':
        return {
          what: HISTORY_WORDS.approved(actorName(entry.actor)),
          when,
          note: HISTORY_WORDS.approvedNote(transfer.format),
        };
      case 'forwarded':
        return {
          what: HISTORY_WORDS.forwarded,
          when,
          note: HISTORY_WORDS.by(actorName(entry.actor), actorRole(entry.actor)),
        };
      case 'requested':
        return {
          what: HISTORY_WORDS.requested,
          when,
          note: HISTORY_WORDS.by(actorName(entry.actor), actorRole(entry.actor)),
        };
    }
  });
  return [...events].reverse();
}
