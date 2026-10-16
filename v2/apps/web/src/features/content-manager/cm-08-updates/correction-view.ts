import type {
  CorrectionEntry,
  CorrectionUpdate,
  Experiment,
  UpdateEvent,
  UpdateReviewDecision,
  UpdateState,
} from '@xr/domain';
import type { StatusTone, TimelineEvent } from '@xr/ui';

import {
  approvedNote,
  approvedWhat,
  heldNote,
  heldWhat,
  LIFTED_NOTE,
  liftedWhat,
  quotedReason,
  releasedNote,
  releasedWhat,
  returnedWhat,
  SENT_WHAT,
  sentNote,
  startedNote,
  startedWhat,
  WITHDRAWN_WHAT,
  withdrawnNote,
} from '@/copy/cm-correction';
import { dateTime } from '@/copy/dates';
import type { CorrectionFocus } from '@/nav/content-manager';
import { deliveryFormatsOf, type PackageFormat } from '@/queries/cm-correction-forms';

/**
 * CM-08's read of one update (B6-09 f1 … f8; B6-11 f10, f11; B7-11 f3): what the page shows for
 * its state, from the record the service answered — the chip's tone, whether the draft is
 * editable and withdrawable (the drawn transitions; the service decides when pressed), the
 * reviewer's last decision and the update history in the Content Manager's words.
 */

/** The board's ids, with the product prefix (`Wd-uh`, `Wd-u-why`, `Wd-err`, `Wd-u-saved`; B6-09). */
export const CORRECTION_FIELD_IDS = {
  title: 'cm-uh',
  summary: 'cm-err',
  saved: 'cm-u-saved',
  why: 'cm-u-why',
  name: 'cm-u-name',
  summaryField: 'cm-u-summary',
  description: 'cm-u-desc',
  web: 'cm-u-web',
  version: 'cm-u-ver',
  change: 'cm-u-chg-e',
  reason: 'cm-u-wr',
  withdraw: 'cm-u-wbtn',
  send: 'cm-u-sbtn',
} as const;

/** A package reference field's id (`Wd-u-vrref` on the board; one per app-package format). */
export function packageFieldId(format: PackageFormat): string {
  return `cm-u-pkg-${format}`;
}

/**
 * The field `?focus=` names (state-copy `CM-08.focus`): CM-06 the summary, CM-07 the web link —
 * or the first package reference when the experiment has no WEB format.
 */
export function correctionFocusTarget(
  focus: CorrectionFocus | null,
  experiment: Experiment,
): string | null {
  if (focus === 'summary') return CORRECTION_FIELD_IDS.summaryField;
  if (focus === 'web-link') {
    const formats = deliveryFormatsOf(experiment);
    if (formats.web) return CORRECTION_FIELD_IDS.web;
    return formats.packages[0] ? packageFieldId(formats.packages[0]) : null;
  }
  return null;
}

/** The chip's tone by state (B6-09 `uChip_*`: draft and withdrawn off, review and awaiting wait …). */
export function updateChipTone(state: UpdateState): StatusTone {
  switch (state) {
    case 'draft':
    case 'withdrawn':
      return 'off';
    case 'in-academic-review':
    case 'awaiting-release-decision':
      return 'wait';
    case 'returned':
      return 'err';
    case 'released':
      return 'ok';
    case 'on-hold':
      return 'paused';
  }
}

/** The draft is hers to edit: a draft, or returned to her (B6-09 `editable`). */
export function isEditable(state: UpdateState): boolean {
  return state === 'draft' || state === 'returned';
}

/** Withdraw is offered while a draft, returned or in academic review (B6-09 `canWithdraw`). */
export function canWithdraw(state: UpdateState): boolean {
  return state === 'draft' || state === 'returned' || state === 'in-academic-review';
}

/** An update still open: the published experiment's one update in progress (B6-08 `open`). */
export function isOpen(state: UpdateState): boolean {
  return state !== 'released' && state !== 'withdrawn';
}

/** The reviewer's last decision of a kind (the returned reason, f2; the approval, f5). */
export function lastDecision(
  update: CorrectionUpdate,
  decision: UpdateReviewDecision['decision'],
): UpdateReviewDecision | null {
  return update.reviewDecisions.findLast((entry) => entry.decision === decision) ?? null;
}

/** A person's name as the records give it. */
export function actorName(actor: CorrectionUpdate['startedBy']): string {
  if (actor.kind === 'person') return actor.displayName;
  if (actor.kind === 'requester') return actor.name;
  return '';
}

function isEntry(note: string | null): note is CorrectionEntry {
  return (
    note === 'start-a-correction' ||
    note === 'edit-catalogue-details' ||
    note === 'edit-delivery-link'
  );
}

/** One history entry in the Content Manager's words (B6-09 `uh`; B7-11 `histAdd`). */
function eventWords(
  update: CorrectionUpdate,
  event: UpdateEvent,
  by: string,
  note: string | null,
): { readonly what: string; readonly note: string | null } | null {
  const base = update.baseVersionLabel;
  switch (event) {
    case 'started':
      return { what: startedWhat(isEntry(note) ? note : null), note: startedNote(base) };
    case 'saved':
      return null;
    case 'sent-for-academic-review':
      return { what: SENT_WHAT, note: sentNote(base) };
    case 'returned-by-reviewer':
      return { what: returnedWhat(by), note: note ? quotedReason(note) : null };
    case 'approved-by-reviewer':
      return { what: approvedWhat(by), note: approvedNote(base) };
    case 'put-on-hold':
      return { what: heldWhat(by), note: note ? heldNote(note, base) : null };
    case 'hold-lifted':
      return { what: liftedWhat(by), note: LIFTED_NOTE };
    case 'released':
      return { what: releasedWhat(by), note: releasedNote(update.versionLabel ?? '') };
    case 'withdrawn':
      return { what: WITHDRAWN_WHAT, note: note ? withdrawnNote(note) : null };
  }
}

/** The update history, newest first, as the Content Manager may read it (state-copy `CM-08.history`). */
export function updateHistory(update: CorrectionUpdate): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  for (const entry of update.history) {
    if (!entry.visibleTo.includes('content_manager')) continue;
    const words = eventWords(update, entry.event, actorName(entry.actor), entry.note);
    if (!words) continue;
    events.push({ id: entry.id, what: words.what, when: dateTime(entry.at), note: words.note });
  }
  return events.reverse();
}
