/**
 * SA-07 Institution detail (the owner-approved V3 design, SA-v1 `V.institution`) as a view of the
 * port's answers — pure functions, no React.
 *
 * Which controls the page offers follows the drawn states (`canPause` = access active or ending
 * soon, `canRestore` = paused, `noIa` = no Institute Admin while active, ending or paused,
 * `iaLater` = none yet while awaiting payment), which is matrix INST-04 … INST-09; the service
 * decides every command again, and its refusal is what the page then shows. "Also waiting for this
 * institution" is written from the institution's own record — the requests its history names,
 * read for their current status through `AccessRequestService.listRequests` — and its device
 * transfers forwarded to BITS, never from invented counts. A plan's standing in its band is read
 * from the services' answers: the institution's pause, and the plan's row in Operations › Access
 * ending (`OperationsService.listAccessEnding`: ending within 15 days, or ended).
 */
import type { InstitutionDetail, RequestRow } from '@xr/contracts/draft';
import type {
  AccessEndingRow,
  AccessPlanStatus,
  ActorRef,
  DeviceTransfer,
  InstitutionStatus,
} from '@xr/domain';

import { dateTime } from '@/copy/dates';
import {
  HISTORY_OVERRIDE,
  historyActivatedNote,
  historyApprovedNote,
  historyAssignedNote,
  historyPaused,
  historyRestored,
  historySentBy,
  quoted,
  SA_HISTORY,
  SA_INSTITUTION,
  saHistoryApproved,
  saHistoryAssigned,
  waitingRequestWords,
  waitingTransferWords,
} from '@/copy/institutions';
import { deviceTransferAddress } from '@/nav/operations';
import { requestAddress } from '@/nav/requests';

/** The drawn state's controls (SA-v1 `V.institution`). */
export interface DrawnControls {
  /** "Assign Institute Admin" and the "No Institute Admin" notice (`noIa`; INST-04). */
  readonly assign: boolean;
  /** "Pause access" (`canPause`: access active or ending soon; INST-07). */
  readonly pause: boolean;
  /** "Restore access", the paused banner and the reason (`canRestore`; INST-08). */
  readonly restore: boolean;
  /** "The Institute Admin is assigned once access is active." (`iaLater`; INST-05, OD-B7-11). */
  readonly adminLater: boolean;
}

const ACTIVE: readonly InstitutionStatus[] = ['access-active', 'ending-soon'];

export function drawnControls(detail: InstitutionDetail): DrawnControls {
  const { status } = detail;
  const hasAdmin = detail.institution.instituteAdmin !== null;
  const active = ACTIVE.includes(status);
  const paused = status === 'access-paused';
  return {
    assign: !hasAdmin && (active || paused),
    pause: active,
    restore: paused,
    adminLater: !hasAdmin && status === 'approved-payment-required',
  };
}

/** The requests the institution's record names (its approval, activation and later requests). */
export function requestsNamed(detail: InstitutionDetail): readonly string[] {
  const named = new Set<string>([detail.institution.createdFromRequestId]);
  for (const entry of detail.institution.history) {
    for (const ref of entry.refs ?? []) if (ref.kind === 'REQ') named.add(ref.id);
  }
  return [...named];
}

/** One row of "Also waiting for this institution" and the link that opens it. */
export interface WaitingView {
  readonly key: string;
  readonly text: string;
  readonly href: string;
  readonly label: string;
}

const newestFirst = (a: string, b: string) => (a === b ? 0 : a < b ? 1 : -1);

/**
 * "Also waiting for this institution" (SA-v1 `att`): the institution's requests under review,
 * newest first, each opening its decision (SA-03) — "Additional licences request under review" ·
 * Open request — then its device transfers forwarded to BITS and not yet approved, newest first,
 * each opening its decision (SA-19) — "VR device transfer for Rahul Verma" · Review transfer.
 * Nothing names an internal reference. A missing Institute Admin, the pause and the access ending
 * are drawn in their own places (the panel's groups and the plan bands).
 */
export function waitingItems(
  detail: InstitutionDetail,
  requests: readonly RequestRow[],
  transfers: readonly DeviceTransfer[] = [],
): readonly WaitingView[] {
  const named = new Set(requestsNamed(detail));
  const underReview = requests
    .filter((row) => named.has(row.id) && row.status === 'under-review')
    .sort((a, b) => newestFirst(a.receivedAt, b.receivedAt))
    .map((row) => ({
      key: row.id,
      text: waitingRequestWords(row.type),
      href: requestAddress(row.id),
      label: SA_INSTITUTION.openRequest,
    }));
  const students = new Map(detail.people.studentList.map((student) => [student.id, student.name]));
  const forwarded = transfers
    .filter(
      (transfer) =>
        transfer.institutionId === detail.institution.id &&
        transfer.state === 'forwarded' &&
        transfer.forwarded !== null,
    )
    .sort((a, b) => newestFirst(a.forwarded!.at, b.forwarded!.at))
    .map((transfer) => ({
      key: transfer.id,
      text: waitingTransferWords(transfer.format, students.get(transfer.studentId) ?? null),
      href: deviceTransferAddress(transfer.id),
      label: SA_INSTITUTION.reviewTransfer,
    }));
  return [...underReview, ...forwarded];
}

/** Whether a request of the institution is under review (Pause says it can't be decided). */
export function hasRequestUnderReview(
  detail: InstitutionDetail,
  requests: readonly RequestRow[],
): boolean {
  const named = new Set(requestsNamed(detail));
  return requests.some((row) => named.has(row.id) && row.status === 'under-review');
}

// ---- The plan bands ----

const IST_DAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** The calendar day ("2026-10-23") of an instant, in the sample world's Indian time. */
export function dayOf(instant: string): string {
  return IST_DAY.format(new Date(instant));
}

/** Whole calendar days from one day to another ("2026-10-23" → "2026-10-31": 8). */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** The note strip at the foot of a plan band, when the plan needs attention. */
export type PlanNoteView =
  /** Ending soon, with its renewal in progress: the request opens from the note. */
  | { readonly kind: 'renewal'; readonly requestId: string; readonly underReview: boolean }
  /** Ending soon, no renewal: "Reminder due. Nothing is sent from here." → Access ending. */
  | { readonly kind: 'reminder'; readonly notCovered: boolean }
  | { readonly kind: 'paused' }
  | { readonly kind: 'ended' };

export interface PlanView {
  readonly plan: InstitutionDetail['plans'][number];
  readonly status: AccessPlanStatus;
  /** Days left in the term (live or paused), or days since it ended. */
  readonly days: number;
  readonly state: 'live' | 'paused' | 'ended';
  /** The share of the term that has passed, 0 to 1. */
  readonly elapsed: number;
  readonly note: PlanNoteView | null;
}

/**
 * Each plan as its band draws it (SA-v1 `planBand`): its status — ended or ending soon as
 * Operations › Access ending lists it, paused while the institution is, otherwise active — the
 * days its row gives (or, for a plan not listed there, counted from `today`, the session's day on
 * the sample clock; state-copy SA-07.term-clock), the share of the term passed, and its note: the
 * renewal in progress or the reminder due while ending soon, read-only while paused, ended.
 */
export function planViews(
  detail: InstitutionDetail,
  ending: readonly AccessEndingRow[],
  requests: readonly RequestRow[],
  today: string,
): readonly PlanView[] {
  const named = new Set(requestsNamed(detail));
  const renewalOpen = requests.some(
    (row) => named.has(row.id) && row.type === 'renewal' && row.status !== 'access-active',
  );
  const statusOf = new Map(requests.map((row) => [row.id, row.status]));
  return detail.plans.map((plan) => {
    const row = ending.find(
      (candidate) =>
        candidate.planId === plan.id && candidate.institutionId === detail.institution.id,
    );
    const term = Math.max(1, daysBetween(plan.startsOn, plan.endsOn));
    const elapsed = Math.min(1, Math.max(0, daysBetween(plan.startsOn, today) / term));
    if (row && row.endedDaysAgo !== null) {
      return {
        plan,
        status: 'access-ended',
        days: row.endedDaysAgo,
        state: 'ended',
        elapsed: 1,
        note: { kind: 'ended' },
      };
    }
    const left = row?.daysLeft ?? Math.max(0, daysBetween(today, plan.endsOn));
    if (detail.status === 'access-paused') {
      return {
        plan,
        status: 'paused',
        days: left,
        state: 'paused',
        elapsed,
        note: { kind: 'paused' },
      };
    }
    if (row && row.daysLeft !== null) {
      const note: PlanNoteView =
        row.standing.kind === 'renewal-in-progress'
          ? {
              kind: 'renewal',
              requestId: row.standing.requestId,
              underReview: statusOf.get(row.standing.requestId) === 'under-review',
            }
          : { kind: 'reminder', notCovered: renewalOpen };
      return { plan, status: 'ending-soon', days: left, state: 'live', elapsed, note };
    }
    return { plan, status: 'access-active', days: left, state: 'live', elapsed, note: null };
  });
}

// ---- History ----

/** One History line (SA-v1 `hist`). */
export interface HistoryLine {
  readonly id: string;
  readonly what: string;
  readonly when: string;
  readonly note: string | null;
}

function nameOf(actor: ActorRef): string {
  return actor.kind === 'person' ? actor.displayName : '';
}

/**
 * The institution record's own events, newest first, with their recorded time (state-copy
 * `SA-07.history`), in the export's words — by content, never by reference.
 */
export function historyLines(detail: InstitutionDetail): readonly HistoryLine[] {
  const { institution } = detail;
  const lines = institution.history.map((entry): HistoryLine => {
    const base = { id: entry.id, when: dateTime(entry.at) };
    switch (entry.event) {
      case 'record-created':
        return {
          ...base,
          what: saHistoryApproved(institution.kind),
          note: historyApprovedNote(institution.kind),
        };
      case 'access-activated':
        return {
          ...base,
          what: SA_HISTORY.activated,
          note:
            institution.kind === 'external'
              ? historyActivatedNote(institution.kind)
              : SA_HISTORY.activatedInternal,
        };
      case 'institute-admin-assigned': {
        const assignment = institution.instituteAdmin;
        const name = entry.note ?? assignment?.name ?? '';
        return {
          ...base,
          what: saHistoryAssigned(name),
          note:
            assignment && assignment.name === name
              ? historyAssignedNote(assignment.workEmail, nameOf(entry.actor))
              : null,
        };
      }
      case 'paused':
        return {
          ...base,
          what: historyPaused(nameOf(entry.actor)),
          note: entry.note ? quoted(entry.note) : null,
        };
      case 'restored':
        return {
          ...base,
          what: historyRestored(nameOf(entry.actor)),
          note: entry.note ? quoted(entry.note) : null,
        };
      case 'licences-requested':
      case 'renewal-requested':
        return {
          ...base,
          what:
            entry.event === 'renewal-requested'
              ? SA_HISTORY.renewalRequested
              : SA_HISTORY.licencesRequested,
          note:
            entry.actor.kind === 'person' && entry.actor.role === 'tenant_admin'
              ? historySentBy(entry.actor.displayName)
              : null,
        };
      case 'access-ended':
        return { ...base, what: SA_HISTORY.ended, note: entry.note ?? null };
      case 'student-status-overridden':
        return { ...base, what: HISTORY_OVERRIDE, note: entry.note ?? null };
    }
  });
  return [...lines].reverse();
}
