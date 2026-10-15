/**
 * The device-transfer view rules IA-18 and IA-19 share (B3-09): who asked (the institution's
 * students, else the request's own history — state-copy `IA-18.student`), the status in the
 * Institute Admin's words and the board's tone, the order of the rows and the history lines. A
 * transfer is an authorisation change only: nothing is shipped or provisioned, and there is no
 * decline (T-32).
 */
import type { DeviceTransfer, DeviceTransferState } from '@xr/domain';
import type { StatusTone } from '@xr/ui';

import { dateTime } from '@/copy/dates';
import { transferWords, wordsOf } from '@/copy/flow-state-words';
import {
  authorisedNowWords,
  DEVICE_REQUEST,
  forwardedByWords,
  fromToWords,
  requestedByWords,
} from '@/copy/institute-requests';

/** B3-09: Waiting on you `wait`, Forwarded to BITS `info`, Decided · approved by BITS `ok`. */
export const TRANSFER_TONE: Readonly<Record<DeviceTransferState, StatusTone>> = {
  'with-institute-admin': 'wait',
  forwarded: 'info',
  approved: 'ok',
};

export function transferStatusWords(state: DeviceTransferState): string {
  return wordsOf(transferWords(state, 'tenant_admin')) ?? state;
}

/** A student as the institution's People list names them. */
export interface StudentNaming {
  readonly fullName: string;
  readonly institutionStudentId: string | null;
}

export type StudentNames = ReadonlyMap<string, StudentNaming>;

/** Who asked: the People list's name and student id, else the name the request's history gives. */
export function studentOf(transfer: DeviceTransfer, students: StudentNames): StudentNaming {
  const listed = students.get(transfer.studentId);
  if (listed) return listed;
  const requested = transfer.history.find((entry) => entry.event === 'requested');
  const name =
    requested?.actor.kind === 'person'
      ? requested.actor.displayName
      : (transfer.studentId as string);
  return { fullName: name, institutionStudentId: null };
}

/** Newest request first; decided requests stay listed (B3-09 f0; state-copy `IA-18.order`). */
export function newestFirst(transfers: readonly DeviceTransfer[]): DeviceTransfer[] {
  return [...transfers].sort((a, b) =>
    a.requestedAt === b.requestedAt ? 0 : a.requestedAt < b.requestedAt ? 1 : -1,
  );
}

export interface TransferHistoryLine {
  readonly id: string;
  readonly what: string;
  readonly when: string;
  readonly note: string | null;
}

/**
 * B3-09 "History", newest first: "Approved by BITS" · "The authorised device is now: …";
 * "Forwarded to BITS by Meera Iyer"; "Requested by Rahul Verma" · "From … to …".
 */
export function transferHistoryLines(
  transfer: DeviceTransfer,
  student: string,
): TransferHistoryLine[] {
  const lines = transfer.history.map((entry): TransferHistoryLine => {
    const when = dateTime(entry.at);
    switch (entry.event) {
      case 'requested':
        return {
          id: entry.id,
          what: requestedByWords(student),
          when,
          note: fromToWords(transfer.fromDevice, transfer.newDevice),
        };
      case 'forwarded':
        return {
          id: entry.id,
          what:
            entry.actor.kind === 'person'
              ? forwardedByWords(entry.actor.displayName)
              : transferStatusWords('forwarded'),
          when,
          note: null,
        };
      case 'approved':
        return {
          id: entry.id,
          what: DEVICE_REQUEST.approvedByBits,
          when,
          note: authorisedNowWords(transfer.newDevice),
        };
    }
  });
  return lines.reverse();
}
