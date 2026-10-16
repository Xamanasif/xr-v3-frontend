/**
 * SA-13's pure view rules (B7-06 f1 … f6, f8; B7-10 f5, f6): the record the service answers
 * (`getContentRecord`, PC-71) as the page draws it — its name and overline, its status chip and
 * line, the catalogue details, which notice it carries (stuck · published · its open correction ·
 * in the workflow), who the override would move it to, and the governance history, newest first:
 * the record's history entries the Super Admin may read (`visibleTo`), the released versions, the
 * open correction's entries she may read and — for a stuck record — why nobody can act (the
 * withdrawn reviewer scopes over its course). Nothing is decided here: "stuck", who can act and
 * which correction she may see are the service's answers.
 */
import type { contentRecordOutput, Out } from '@xr/contracts/draft';
import type { ActorRef, SubmissionStatus, Technology } from '@xr/domain';
import type { TimelineEvent } from '@xr/ui';

import {
  academicReviewNote,
  approvedByWhat,
  byContentManagerNote,
  CONTENT_RECORD,
  fromNote,
  HISTORY_WORDS,
  historyDay,
  historyMoment,
  holdLiftedNote,
  holdLiftedWhat,
  noReviewerWhat,
  overrideNote,
  overrideWhat,
  publishedVersionWhat,
  recordOverline,
  releasedCorrectionNote,
  resubmittedWhat,
  returnedByWhat,
  revisionNote,
  scopeWithdrawnNote,
  sentBackToVendorWhat,
  staysLive,
  STATUS_WORDS,
  submittedNote,
  updateApprovedNote,
  updateApprovedWhat,
  updateHeldWhat,
  vendorWho,
  versionReleasedWhat,
} from '@/copy/content-oversight';

import { workflowWords, type WorkflowWords } from '../sa-12-all-content/content-view';

export type ContentRecordView = Out<typeof contentRecordOutput>;
type OpenUpdate = NonNullable<ContentRecordView['openUpdate']>;

/** Which notice the record carries (B7-06: `isStuck`, `isPub` + `rUpd*`, `isFlow`). */
export type RecordNotice =
  | { readonly kind: 'stuck'; readonly since: string }
  | { readonly kind: 'published'; readonly update: OpenUpdate | null }
  | { readonly kind: 'in-workflow' };

export interface RecordFacts {
  /** The submission reference ("SUB-0085"); `null` for an experiment published without one. */
  readonly reference: string | null;
  readonly name: string;
  readonly overline: string;
  readonly status: WorkflowWords;
  readonly notice: RecordNotice;
  /** The course as the stuck notice names it: its platform code, else its name. */
  readonly course: string;
  readonly summary: string;
  readonly formats: readonly Technology[];
  /** The live version (published only): "1.2 · since 3 Jul 2026". */
  readonly live: { readonly label: string; readonly since: string } | null;
  readonly vendor: string;
  readonly whoCanAct: string | null;
  readonly outcomes: readonly string[];
  /** "Ritu Sharma · Meridian Virtual Labs": who the override returns it to (B7-06 `venWho`). */
  readonly vendorWho: string;
  /** The submission and its revision, for the override (stuck records only). */
  readonly override: { readonly id: string; readonly rev: number } | null;
  readonly history: readonly TimelineEvent[];
}

function personName(actor: ActorRef): string | null {
  return actor.kind === 'person' ? actor.displayName : null;
}

/** The facts of the record on show (B7-06 `rName`, `rOver`, `rWords`, `rWhere`, `rWho` …). */
export function recordFacts(view: ContentRecordView): RecordFacts {
  const { submission, experiment } = view;
  const status: SubmissionStatus = submission
    ? submission.status
    : {
        state: 'published',
        at: experiment!.publishedAt,
        experimentId: experiment!.id,
      };
  const published = status.state === 'published';
  const live = experiment
    ? { label: experiment.live.label, since: experiment.live.liveFrom }
    : null;
  const reference = submission?.id ?? null;
  const name = experiment && published ? experiment.live.catalogue.name : submission!.content.name;
  const organisation = submission?.vendorOrganisation || experiment?.vendorOrganisation || '';
  const submitter = submission?.history.find((entry) => entry.event === 'submitted');
  const course = view.courseCode ?? view.courseName ?? CONTENT_RECORD.none;
  const notice: RecordNotice =
    view.stuck && status.state === 'with-academic-reviewer'
      ? { kind: 'stuck', since: status.since }
      : published
        ? { kind: 'published', update: view.openUpdate }
        : { kind: 'in-workflow' };
  return {
    reference,
    name,
    overline: recordOverline(reference, view.courseCode, view.courseName),
    status: workflowWords(
      status,
      view.stuck,
      published ? live : null,
      submission?.revision ?? null,
    ),
    notice,
    course,
    summary:
      (experiment && published ? experiment.live.catalogue.summary : submission?.content.summary) ??
      CONTENT_RECORD.none,
    formats:
      experiment && published
        ? experiment.live.formats.map((entry) => entry.format)
        : (submission?.content.formats ?? []),
    live: published ? live : null,
    vendor: organisation || CONTENT_RECORD.none,
    whoCanAct: view.whoCanAct,
    outcomes: (experiment && published
      ? experiment.learningOutcomes
      : (submission?.learningOutcomes ?? [])
    ).map((outcome) => outcome.text),
    vendorWho: vendorWho(submitter ? personName(submitter.actor) : null, organisation),
    override:
      notice.kind === 'stuck' && submission ? { id: submission.id, rev: submission.rev } : null,
    history: historyOf(view, course),
  };
}

interface Dated extends TimelineEvent {
  readonly at: string;
  /** Order among entries of the same instant: the later-recorded first. */
  readonly order: number;
}

/**
 * The governance history, newest first (state-copy `SA-13.history`): what the Super Admin may read
 * of the record's own history, the versions that went live, the open correction's entries she may
 * read and, for a stuck record, why nobody can act. The draft saves are the Vendor's only (SUB-16).
 */
export function historyOf(view: ContentRecordView, course: string): TimelineEvent[] {
  const { submission, experiment } = view;
  const events: Dated[] = [];
  const push = (event: Omit<Dated, 'order'>) => events.push({ ...event, order: events.length });

  if (submission) {
    const organisation = submission.vendorOrganisation;
    let revision = 1;
    for (const entry of submission.history) {
      if (!entry.visibleTo.includes('super_admin')) continue;
      const who = personName(entry.actor);
      const base = { id: entry.id, at: entry.at, when: historyDay(entry.at) };
      switch (entry.event) {
        case 'submitted':
          push({
            ...base,
            what: HISTORY_WORDS.submitted,
            note: submittedNote(revision, who, organisation),
          });
          break;
        case 'returned-by-reviewer':
          push({ ...base, what: returnedByWhat(who ?? ''), note: revisionNote(revision) });
          break;
        case 'resubmitted':
          revision = Number(entry.note) || revision + 1;
          push({ ...base, what: resubmittedWhat(revision), note: fromNote(who, organisation) });
          break;
        case 'approved-by-reviewer':
          push({ ...base, what: approvedByWhat(who ?? ''), note: academicReviewNote(revision) });
          break;
        case 'sent-back-for-recheck':
          push({ ...base, what: HISTORY_WORDS.recheck, note: byContentManagerNote(who) });
          break;
        case 'returned-by-content-manager':
          push({ ...base, what: sentBackToVendorWhat(who ?? ''), note: revisionNote(revision) });
          break;
        case 'published': {
          const first = experiment?.versions.find(
            (version) => version.source.kind === 'first-publication',
          );
          const label = first?.label ?? submission.content.version;
          push({
            ...base,
            what: label ? publishedVersionWhat(label) : STATUS_WORDS.published,
            note: byContentManagerNote(who),
          });
          break;
        }
        case 'status-overridden':
          push({
            ...base,
            when: historyMoment(entry.at),
            what: overrideWhat(who ?? ''),
            note: overrideNote(entry.note ?? ''),
          });
          break;
        default:
          // A draft save (the Vendor's) and the routing stand-in's step are not listed.
          break;
      }
    }
  }

  if (experiment) {
    for (const version of experiment.versions) {
      const base = { at: version.liveFrom, when: historyDay(version.liveFrom) };
      if (version.source.kind === 'correction-release') {
        push({
          ...base,
          id: `version-${version.label}`,
          what: versionReleasedWhat(version.label),
          note: releasedCorrectionNote(version.source.updateId),
        });
      } else if (!submission) {
        // An experiment published before the sample period: its first version stands for it.
        push({
          ...base,
          id: `version-${version.label}`,
          what: publishedVersionWhat(version.label),
          note: byContentManagerNote(personName(experiment.publishedBy)),
        });
      }
    }
  }

  if (view.openUpdate && experiment) {
    events.push(...updateEvents(view.openUpdate, experiment.live.label, events.length));
  }

  if (view.stuck && submission?.status.state === 'with-academic-reviewer') {
    const since = submission.status.since;
    const withdrawn = view.withdrawnReviewerScopes;
    const at = withdrawn.reduce((latest, scope) => (scope.at > latest ? scope.at : latest), since);
    events.push({
      id: 'stuck',
      at,
      order: Number.POSITIVE_INFINITY,
      when: historyDay(at),
      what: noReviewerWhat(course),
      note:
        withdrawn.length > 0
          ? withdrawn
              .map((scope) => scopeWithdrawnNote(scope.holderName, course, scope.at))
              .join(' ')
          : null,
    });
  }

  return events
    .sort((a, b) => (a.at === b.at ? b.order - a.order : a.at < b.at ? 1 : -1))
    .map(({ id, what, when, note }) => ({ id, what, when, note }));
}

/** The open correction's entries the Super Admin may read (approved, held, hold lifted). */
function updateEvents(update: OpenUpdate, liveLabel: string, offset: number): Dated[] {
  const visible = update.history.filter((entry) => entry.visibleTo.includes('super_admin'));
  const lastApproval = visible.findLast((entry) => entry.event === 'approved-by-reviewer');
  return visible.flatMap((entry, index): Dated[] => {
    const who = personName(entry.actor) ?? '';
    const base = { id: entry.id, at: entry.at, when: historyDay(entry.at), order: offset + index };
    switch (entry.event) {
      case 'approved-by-reviewer':
        return [
          {
            ...base,
            what: updateApprovedWhat(
              update.id,
              update.state === 'awaiting-release-decision' && entry === lastApproval,
            ),
            note: updateApprovedNote(update.baseVersionLabel, update.versionLabel),
          },
        ];
      case 'put-on-hold':
        return [{ ...base, what: updateHeldWhat(update.id, who), note: staysLive(liveLabel) }];
      case 'hold-lifted':
        return [{ ...base, what: holdLiftedWhat(update.id, who), note: holdLiftedNote(liveLabel) }];
      default:
        return [];
    }
  });
}
