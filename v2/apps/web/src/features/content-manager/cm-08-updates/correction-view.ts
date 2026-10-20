import type {
  CorrectionEntry,
  CorrectionUpdate,
  Experiment,
  UpdateEvent,
  UpdateReviewDecision,
  UpdateState,
} from '@xr/domain';
import type { TimelineEvent } from '@xr/ui/v3';

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
  SENT_AGAIN_WHAT,
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
 * CM-08's read of one update (the CM-v1 correction detail in every state): what the page shows for
 * its state, from the record the service answered — whether the draft is editable and
 * withdrawable (the drawn transitions; the service decides when pressed), the reviewer's last
 * decision and the update history in the Content Manager's words.
 */

/** The export's ids (CM-v1 `Main.dc.html`, the correction detail and its dialogs). */
export const CORRECTION_FIELD_IDS = {
  title: 'cm-h-update',
  summary: 'cm-u-errs',
  saved: 'cm-u-saved',
  saveFailed: 'cm-u-savefail',
  state: 'cm-u-state',
  stale: 'cm-u-stale',
  entry: 'cm-u-entry',
  panel: 'cm-u-panel',
  panelTitle: 'cm-u-panel-h',
  returned: 'cm-u-ret',
  aboutTitle: 'cm-u-why-h',
  catalogueTitle: 'cm-u-cat-h',
  deliveryTitle: 'cm-u-del-h',
  readOnlyWhyTitle: 'cm-u-rwhy',
  comparisonTitle: 'cm-u-cmp-h',
  historyTitle: 'cm-u-hist-h',
  why: 'cm-u-why',
  name: 'cm-u-name',
  summaryField: 'cm-u-summary',
  description: 'cm-u-desc',
  web: 'cm-u-web',
  version: 'cm-u-ver',
  change: 'cm-u-chg-err',
  reason: 'cm-dlg-wd-r',
  withdraw: 'cm-u-wd',
  send: 'cm-u-send',
  save: 'cm-u-save',
} as const;

/** A package reference field's id (`cm-u-pk-VR`; one per app format the experiment has). */
export function packageFieldId(format: PackageFormat): string {
  return `cm-u-pk-${format.toUpperCase()}`;
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

/** The draft is hers to edit: a draft, or returned to her (the export's `edit`). */
export function isEditable(state: UpdateState): boolean {
  return state === 'draft' || state === 'returned';
}

/** Withdraw is offered while a draft, returned or in academic review (OD-B6-06). */
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

/** One history entry in the Content Manager's words (the export's `uh` entries). */
function eventWords(
  update: CorrectionUpdate,
  event: UpdateEvent,
  by: string,
  note: string | null,
  again: boolean,
): { readonly what: string; readonly note: string | null } | null {
  const base = update.baseVersionLabel;
  switch (event) {
    case 'started':
      return { what: startedWhat(isEntry(note) ? note : null), note: startedNote(base) };
    case 'saved':
      return null;
    case 'sent-for-academic-review':
      return { what: again ? SENT_AGAIN_WHAT : SENT_WHAT, note: sentNote(base) };
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

/**
 * The update history, newest first, as the Content Manager may read it (state-copy
 * `CM-08.history`): a send after a return is “Sent again for academic review”.
 */
export function updateHistory(
  update: CorrectionUpdate,
): (TimelineEvent & { readonly id: string })[] {
  const events: (TimelineEvent & { readonly id: string })[] = [];
  let returned = false;
  for (const entry of update.history) {
    if (entry.event === 'returned-by-reviewer') returned = true;
    if (!entry.visibleTo.includes('content_manager')) continue;
    const words = eventWords(update, entry.event, actorName(entry.actor), entry.note, returned);
    if (!words) continue;
    events.push({
      id: entry.id,
      what: words.what,
      when: dateTime(entry.at),
      ...(words.note ? { note: words.note } : {}),
    });
  }
  return events.reverse();
}
