/**
 * SA-18 / SA-19 as views of the DTR record the Super Admin reads (`listDeviceTransfers`) — pure
 * functions, no React. The record carries canonical facts only: who requested, forwarded and
 * approved it are its own history entries and `forwarded` / `approved` stamps; the words are the
 * boards' (`@/copy/operations`, `@/copy/flow-state-words`). Nothing here decides what the Super
 * Admin may do: the one action, Approve, is offered while the record is forwarded (B3-11
 * `canApprove`; `transferActionWords`) and the service decides it again.
 */
import type { ActorRef, DeviceTransfer, DeviceTransferState } from '@xr/domain';
import { ROLE_LABEL } from '@xr/domain';
import type { StatusTone, TimelineEvent } from '@xr/ui';

import { dateTime } from '@/copy/dates';
import { transferWords, wordsOf } from '@/copy/flow-state-words';
import { forwardedCell, HISTORY_WORDS, TRANSFERS_LIST } from '@/copy/operations';
import type { TransferShow } from '@/nav/operations';

/** A person's name as the record stamped it (a transfer is only ever moved by people). */
export function actorName(actor: ActorRef): string {
  if (actor.kind === 'person') return actor.displayName;
  return actor.kind === 'requester' ? actor.name : '';
}

/** The requesting Student, as the record's own "requested" entry names them. */
export function requesterName(transfer: DeviceTransfer): string {
  const requested = transfer.history.find((entry) => entry.event === 'requested');
  return requested ? actorName(requested.actor) : '';
}

/** "Meera Iyer" and "Institute Admin": who forwarded it (B3-11 "Forwarded by"). */
export function forwarderOf(
  transfer: DeviceTransfer,
): { readonly name: string; readonly role: string | null } | null {
  if (!transfer.forwarded) return null;
  const by = transfer.forwarded.by;
  return { name: actorName(by), role: by.kind === 'person' ? ROLE_LABEL[by.role] : null };
}

/** The status chip's tone (B3-11: wait for Forwarded, off for Still with the institution, ok). */
export function transferTone(state: DeviceTransferState): StatusTone {
  return state === 'approved' ? 'ok' : state === 'forwarded' ? 'wait' : 'off';
}

/** The Super Admin's words for the state (B3-11 f0 · f2 · f3 · f5; Appendix D §5.4). */
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

/** B3-11's "Forwarded" cell: "23 Oct 2026, 10:00 · Meera Iyer", or "Not yet". */
export function forwardedWords(transfer: DeviceTransfer): string {
  const forwarder = forwarderOf(transfer);
  if (!transfer.forwarded || !forwarder) return TRANSFERS_LIST.notYet;
  return forwardedCell(dateTime(transfer.forwarded.at), forwarder.name);
}

/**
 * The record's history, newest first (B3-11 `hist`): approved by BITS (the device it is now),
 * forwarded by the Institute Admin, requested by the Student (from → to).
 */
export function historyEvents(transfer: DeviceTransfer): readonly TimelineEvent[] {
  const events = transfer.history.map((entry): TimelineEvent => {
    const when = dateTime(entry.at);
    switch (entry.event) {
      case 'approved':
        return {
          id: entry.id,
          what: HISTORY_WORDS.approved,
          when,
          note: HISTORY_WORDS.approvedNote(transfer.newDevice),
        };
      case 'forwarded':
        return { id: entry.id, what: HISTORY_WORDS.forwarded(actorName(entry.actor)), when };
      case 'requested':
        return {
          id: entry.id,
          what: HISTORY_WORDS.requested(actorName(entry.actor)),
          when,
          note: HISTORY_WORDS.requestedNote(transfer.fromDevice, transfer.newDevice),
        };
    }
  });
  return [...events].reverse();
}
