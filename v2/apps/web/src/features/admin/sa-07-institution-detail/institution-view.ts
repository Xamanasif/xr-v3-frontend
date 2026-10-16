/**
 * SA-07 Institution detail (B7-03) as a view of the port's answers — pure functions, no React.
 *
 * Which controls the page offers follows B7-03's script state by state (`canPause = isActive`,
 * `canRestore = isPaused`, `noIa = !ia && (active | ending | paused)`, `iaLater = !ia && payment`),
 * which is matrix INST-04 … INST-09 as drawn; the service decides every command again, and its
 * refusal is what the page then shows. "Needs attention" is written from the institution's own
 * record — the requests its history names, read for their current status through
 * `AccessRequestService.listRequests` — never from invented counts.
 */
import type { InstitutionDetail, RequestRow } from '@xr/contracts/draft';
import type { AccessEndingRow, ActorRef, DeviceTransfer, InstitutionStatus } from '@xr/domain';

import { calendarDay, dateTime, dayMonthYear } from '@/copy/dates';
import {
  ATTENTION_NO_ADMIN,
  ATTENTION_REQUESTS,
  attentionAwaitingPayment,
  attentionPaused,
  attentionRequest,
  HISTORY_OVERRIDE,
  historyActivated,
  historyActivatedNote,
  historyApproved,
  historyApprovedNote,
  historyAssigned,
  historyAssignedNote,
  historyEnded,
  historyLicencesRequested,
  historyPaused,
  historyRenewalRequested,
  historyRestored,
  historySentBy,
  isOpenRequest,
  quoted,
} from '@/copy/institutions';
import { ATTENTION_OPERATIONS, attentionTransfer } from '@/copy/operations';
import { ATTENTION_ACCESS_ENDING, attentionReminderDue } from '@/copy/operations-6';
import { ACCESS_ENDING_ADDRESS, DEVICE_TRANSFERS_ADDRESS } from '@/nav/operations';
import { REQUESTS_ADDRESS } from '@/nav/requests';

import { requestStatusWords } from '../shared/request-status';

/** The drawn state's controls (B7-03 script). */
export interface DrawnControls {
  /** "Assign Institute Admin" and the "No Institute Admin" notice (`noIa`; INST-04). */
  readonly assign: boolean;
  /** "Pause access" (`canPause`: access active or ending soon; INST-07). */
  readonly pause: boolean;
  /** "Restore access" and the paused notice (`canRestore`; INST-08). */
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

/** The newest plan: its reference names the plan in the overline and the summary. */
export function newestPlan(detail: InstitutionDetail) {
  return (
    [...detail.plans].sort((a, b) =>
      a.activatedAt === b.activatedAt ? 0 : a.activatedAt < b.activatedAt ? 1 : -1,
    )[0] ?? null
  );
}

/** One "Needs attention" row and its one action. */
export interface AttentionView {
  readonly key: string;
  readonly text: string;
  readonly action:
    | { readonly kind: 'assign' }
    | { readonly kind: 'restore' }
    | { readonly kind: 'link'; readonly href: string; readonly label: string };
}

/** The requests the institution's record names (its approval, activation and later requests). */
export function requestsNamed(detail: InstitutionDetail): readonly string[] {
  const named = new Set<string>([detail.institution.createdFromRequestId]);
  for (const entry of detail.institution.history) {
    for (const ref of entry.refs ?? []) if (ref.kind === 'REQ') named.add(ref.id);
  }
  return [...named];
}

/**
 * "Needs attention" (B7-03 `att`): a missing Institute Admin first, then (Phase 6) its access
 * ending with a reminder due — "Access ends 2 Nov 2026 — reminder due (nothing is sent from
 * here)", opening Operations › Access ending (B7-03 konark: before its requests; state-copy
 * `SA-07.attention-access-ending`) — then the institution's open requests (newest first), then
 * its device transfers forwarded to BITS (Phase 3: newest first, each opening Operations ›
 * Device transfers), then the pause (the board adds it last). A renewal in progress is its
 * request's row; ended access needs nothing here (B7-10 f8).
 */
export function attentionRows(
  detail: InstitutionDetail,
  requests: readonly RequestRow[],
  transfers: readonly DeviceTransfer[] = [],
  ending: readonly AccessEndingRow[] = [],
): readonly AttentionView[] {
  const controls = drawnControls(detail);
  const rows: AttentionView[] = [];
  if (controls.assign) {
    rows.push({ key: 'no-admin', text: ATTENTION_NO_ADMIN, action: { kind: 'assign' } });
  }
  // B7-03 konark: "Access ends 2 Nov 2026 — reminder due (nothing is sent from here)" → SA-22.
  for (const row of ending) {
    if (row.institutionId !== detail.institution.id || row.standing.kind !== 'reminder-due')
      continue;
    rows.push({
      key: `ending-${row.planId}`,
      text: attentionReminderDue(calendarDay(row.endsOn)),
      action: { kind: 'link', href: ACCESS_ENDING_ADDRESS, label: ATTENTION_ACCESS_ENDING },
    });
  }
  const named = new Set(requestsNamed(detail));
  const open = requests
    .filter((row) => named.has(row.id) && isOpenRequest(row.status))
    .sort((a, b) => (a.receivedAt === b.receivedAt ? 0 : a.receivedAt < b.receivedAt ? 1 : -1));
  for (const row of open) {
    const origin = row.id === detail.institution.createdFromRequestId;
    rows.push({
      key: row.id,
      text:
        origin && row.status === 'approved-payment-required'
          ? attentionAwaitingPayment(row.id)
          : attentionRequest(row.id, row.type, requestStatusWords(row.status)),
      action: { kind: 'link', href: REQUESTS_ADDRESS, label: ATTENTION_REQUESTS },
    });
  }
  // B7-03 godavari: "DTR-0018 — device transfer forwarded on 23 Oct 2026" → Operations (SA-18).
  const forwarded = transfers
    .filter(
      (transfer) =>
        transfer.institutionId === detail.institution.id &&
        transfer.state === 'forwarded' &&
        transfer.forwarded !== null,
    )
    .sort((a, b) =>
      a.forwarded!.at === b.forwarded!.at ? 0 : a.forwarded!.at < b.forwarded!.at ? 1 : -1,
    );
  for (const transfer of forwarded) {
    rows.push({
      key: transfer.id,
      text: attentionTransfer(transfer.id, dayMonthYear(transfer.forwarded!.at)),
      action: { kind: 'link', href: DEVICE_TRANSFERS_ADDRESS, label: ATTENTION_OPERATIONS },
    });
  }
  const pause = detail.institution.pause;
  if (controls.restore && pause) {
    rows.push({
      key: 'paused',
      text: attentionPaused(dayMonthYear(pause.since)),
      action: { kind: 'restore' },
    });
  }
  return rows;
}

/** One History line (B7-03 `hist`). */
export interface HistoryLine {
  readonly id: string;
  readonly what: string;
  readonly when: string;
  readonly note: string | null;
}

function nameOf(actor: ActorRef): string {
  return actor.kind === 'person' ? actor.displayName : '';
}

function refOf(entry: InstitutionDetail['institution']['history'][number], kind: 'REQ' | 'ACC') {
  return entry.refs?.find((ref) => ref.kind === kind)?.id ?? null;
}

/**
 * The institution record's own events, newest first, with their recorded time (state-copy
 * `SA-07.history`). Words follow B7-03's `hist` lines and its script's flashes.
 */
export function historyLines(detail: InstitutionDetail): readonly HistoryLine[] {
  const { institution } = detail;
  const lines = institution.history.map((entry): HistoryLine => {
    const request = refOf(entry, 'REQ') ?? institution.createdFromRequestId;
    const base = { id: entry.id, when: dateTime(entry.at) };
    switch (entry.event) {
      case 'record-created':
        return {
          ...base,
          what: historyApproved(request, institution.kind),
          note: historyApprovedNote(institution.kind),
        };
      case 'access-activated':
        return {
          ...base,
          what: historyActivated(refOf(entry, 'ACC') ?? ''),
          note: historyActivatedNote(institution.kind),
        };
      case 'institute-admin-assigned': {
        const assignment = institution.instituteAdmin;
        const name = entry.note ?? assignment?.name ?? '';
        return {
          ...base,
          what: historyAssigned(name),
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
              ? historyRenewalRequested(request)
              : historyLicencesRequested(request),
          note:
            entry.actor.kind === 'person' && entry.actor.role === 'tenant_admin'
              ? historySentBy(entry.actor.displayName)
              : null,
        };
      case 'access-ended':
        return { ...base, what: historyEnded(refOf(entry, 'ACC')), note: entry.note ?? null };
      case 'student-status-overridden':
        return { ...base, what: HISTORY_OVERRIDE, note: entry.note ?? null };
    }
  });
  return [...lines].reverse();
}
