import type { Out, vendorOverviewOutput } from '@xr/contracts/draft';
import type {
  VendorActivityRow,
  VendorAttentionRow,
  VendorFigure,
  VendorLeadItem,
} from '@xr/ui/v3';

import { dateTime, dayMonth, dayMonthYear } from '@/copy/dates';
import { referenceWords } from '@/copy/vendor-editor';
import {
  activityName,
  draftRowLine,
  finishDraftName,
  HISTORY_WORDS,
  leadMeta,
  resubmittedWords,
  returnedRowLine,
  reviseLabel,
  reviseName,
  VENDOR_OVERVIEW_WORDS,
  withYouLine,
} from '@/copy/vendor-home';
import { editDraftAddress, experimentRecordAddress, reviseAddress } from '@/nav/vendor';

import { hasSavedChanges } from '../shared/saved-changes';
import {
  isReadOnlyDraft,
  isToday,
  type MyExperimentRow,
  onDayOf,
  stepNumber,
  vendorStatusOf,
} from '../ve-02-my-experiments/experiment-rows';

/**
 * VE-01's studio band counts, “Needs your action” and Recent activity, written from the services'
 * facts (the export's `overView` and `activity`; PC-62 facts, never words). Pure: the page draws
 * what these return.
 */

export type VendorOverviewAnswer = Out<typeof vendorOverviewOutput>;
export type VendorAttention = VendorOverviewAnswer['attention'][number];
type Submission = MyExperimentRow['submission'];

const { figures: FIGURES, figureLines: LINES } = VENDOR_OVERVIEW_WORDS;

/**
 * The four counts (state-copy `VE-01.counts`), classified as VE-02's tabs classify the rows; the
 * Read-only count only when there is one.
 */
export function figuresOf(rows: readonly MyExperimentRow[]): VendorFigure[] {
  const count = (keep: (row: MyExperimentRow) => boolean) => rows.filter(keep).length;
  const readOnly = count(isReadOnlyDraft);
  const returned = count((row) => vendorStatusOf(row.submission) === 'returned');
  const drafts = count(
    (row) => vendorStatusOf(row.submission) === 'draft' && !isReadOnlyDraft(row),
  );
  const inReview = count((row) =>
    ['submitted', 'with-academic-reviewer', 'with-content-manager'].includes(
      vendorStatusOf(row.submission),
    ),
  );
  const published = count((row) => vendorStatusOf(row.submission) === 'published');
  const figures: VendorFigure[] = [
    { title: FIGURES.withYou, value: returned + drafts, detail: withYouLine(returned, drafts) },
    {
      title: FIGURES.inReview,
      value: inReview,
      detail: inReview ? LINES.nothingNeeded : LINES.noneRightNow,
    },
    { title: FIGURES.published, value: published, detail: published ? LINES.live : LINES.noneYet },
  ];
  if (readOnly > 0) {
    figures.push({ title: FIGURES.readOnly, value: readOnly, detail: LINES.courseGone });
  }
  return figures;
}

/** Who returned it and what it refers to: the decision behind the return, on the record. */
function lastReturnOf(submission: Submission): {
  readonly who: string;
  readonly references: readonly string[];
} {
  const { status } = submission;
  const decision =
    status.state !== 'returned'
      ? null
      : status.by === 'academic-reviewer'
        ? submission.reviewDecisions.findLast((entry) => entry.decision === 'return-to-vendor')
        : status.by === 'content-manager'
          ? submission.contentManagerDecisions.findLast(
              (entry) => entry.kind === 'send-back-to-vendor',
            )
          : null;
  if (!decision) return { who: '', references: [] };
  const actor = 'decision' in decision ? decision.decidedBy : decision.by;
  const references =
    'references' in decision
      ? decision.references.map((reference) => {
          // The export's `refShort`: the step is left out (“AR · Device need”, “Summary”).
          const words = referenceWords(reference).split(' · ');
          return words.length > 1 ? words.slice(1).join(' · ') : words[0]!;
        })
      : [];
  const who =
    actor.kind === 'person' ? actor.displayName : actor.kind === 'requester' ? actor.name : '';
  return { who, references };
}

export interface AttentionView {
  readonly lead: VendorLeadItem | null;
  readonly rows: readonly VendorAttentionRow[];
  /** How many items wait: the lead and the rows. */
  readonly count: number;
}

/**
 * “Needs your action” (state-copy `VE-01.attention`): the service's facts, the returned item
 * changed last as the lead, then further returned items and drafts, each changed last first. A
 * draft's “Finish draft” opens the step it last reached; the first row's action is gold only when
 * nothing leads.
 */
export function attentionOf(
  attention: readonly VendorAttention[],
  rows: readonly MyExperimentRow[],
  now: string | null,
): AttentionView {
  const byId = new Map(rows.map((row) => [row.submission.id as string, row] as const));
  const lastChange = (fact: VendorAttention) =>
    byId.get(fact.submissionId)?.submission.updatedAt ??
    (fact.kind === 'returned' ? fact.at : fact.savedAt);
  const newestFirst = (a: VendorAttention, b: VendorAttention) => {
    const left = lastChange(a);
    const right = lastChange(b);
    return left === right ? 0 : left < right ? 1 : -1;
  };
  const returned = attention
    .filter(
      (fact): fact is Extract<VendorAttention, { kind: 'returned' }> => fact.kind === 'returned',
    )
    .sort(newestFirst);
  const drafts = attention
    .filter((fact): fact is Extract<VendorAttention, { kind: 'draft' }> => fact.kind === 'draft')
    .sort(newestFirst);

  const [first, ...further] = returned;
  let lead: VendorLeadItem | null = null;
  if (first) {
    const submission = byId.get(first.submissionId)?.submission;
    const facts = submission ? lastReturnOf(submission) : { who: '', references: [] };
    lead = {
      kind: VENDOR_OVERVIEW_WORDS.returnedKind,
      title: first.name,
      meta: leadMeta(first.by, facts.who, dayMonthYear(first.at)),
      reason: first.reason,
      references: { label: VENDOR_OVERVIEW_WORDS.refersTo, items: facts.references },
      pending:
        submission && hasSavedChanges(submission)
          ? VENDOR_OVERVIEW_WORDS.savedNotResubmitted
          : undefined,
      action: {
        href: reviseAddress(first.submissionId),
        label: reviseLabel(first.name),
        accessibleName: reviseName(first.name, first.by),
      },
    };
  }

  const items: VendorAttentionRow[] = [
    ...further.map((fact) => {
      const submission = byId.get(fact.submissionId)?.submission;
      return {
        key: `returned:${fact.submissionId}`,
        icon: 'returned' as const,
        kind: VENDOR_OVERVIEW_WORDS.returnedKind,
        title: fact.name,
        detail: returnedRowLine(
          fact.by,
          onDayOf(fact.at, now),
          submission ? hasSavedChanges(submission) : false,
        ),
        action: {
          href: reviseAddress(fact.submissionId),
          label: reviseLabel(fact.name),
          accessibleName: reviseName(fact.name, fact.by),
        },
      };
    }),
    ...drafts.map((fact) => {
      const step = byId.get(fact.submissionId)?.submission.lastStepReached ?? 'course';
      return {
        key: `draft:${fact.submissionId}`,
        icon: 'edit' as const,
        kind: VENDOR_OVERVIEW_WORDS.draftKind,
        title: fact.name,
        detail: draftRowLine(stepNumber(step), dayMonthYear(fact.savedAt)),
        action: {
          href: editDraftAddress(fact.submissionId, step),
          label: VENDOR_OVERVIEW_WORDS.finishDraft,
          accessibleName: finishDraftName(fact.name),
        },
      };
    }),
  ].map((item, index) => ({
    ...item,
    action: { ...item.action, primary: lead === null && index === 0 },
  }));

  return { lead, rows: items, count: (lead ? 1 : 0) + items.length };
}

/** What a history entry says on Recent activity; `null` for an entry it leaves out. */
function historyWhat(entry: Submission['history'][number], submission: Submission): string | null {
  switch (entry.event) {
    case 'draft-saved':
      return HISTORY_WORDS.draftSaved;
    case 'submitted':
      return HISTORY_WORDS.submitted;
    case 'returned-by-reviewer':
    case 'returned-by-content-manager':
      return HISTORY_WORDS.returned;
    case 'approved-by-reviewer':
      return HISTORY_WORDS.approved;
    case 'resubmitted':
      return resubmittedWords(entry.note ?? String(submission.revision));
    case 'sent-back-for-recheck':
      return HISTORY_WORDS.recheck;
    case 'published':
      return HISTORY_WORDS.published;
    // The routing after a resubmit would name the next stage (HANDOFF §2): never the Vendor's;
    // the override is the Super Admin's own (`visibleTo`).
    case 'routed':
    case 'status-overridden':
      return null;
  }
}

/**
 * Recent activity (state-copy `VE-01.recent-activity`): the `limit` newest history entries the
 * Vendor may see across the Vendor's experiments, newest first (entries of one instant: the later
 * written first), each opening its record.
 */
export function recentActivity(
  rows: readonly MyExperimentRow[],
  now: string | null,
  limit = 5,
): VendorActivityRow[] {
  const entries = rows.flatMap(({ submission }) =>
    submission.history.flatMap((entry, index) => {
      if (!entry.visibleTo.includes('vendor')) return [];
      const what = historyWhat(entry, submission);
      return what === null ? [] : [{ submission, entry, index, what }];
    }),
  );
  entries.sort((a, b) =>
    a.entry.at === b.entry.at ? b.index - a.index : a.entry.at < b.entry.at ? 1 : -1,
  );
  return entries.slice(0, limit).map(({ submission, entry, what }) => {
    const when = dateTime(entry.at);
    return {
      key: entry.id,
      what,
      name: submission.content.name,
      href: experimentRecordAddress(submission.id),
      accessibleName: activityName(what, submission.content.name, when),
      day: isToday(entry.at, now) ? VENDOR_OVERVIEW_WORDS.today : dayMonth(entry.at),
      time: when.split(', ')[1],
    };
  });
}
