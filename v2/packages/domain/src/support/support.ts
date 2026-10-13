/**
 * M24 Support report (SUP) — Help & support in every workspace (Appendix C §2; matrix SUP-*;
 * board 07, B7-09). Any signed-in person reports a problem; the Super Admin resolves (with a note
 * the reporter sees) and reopens. The reporter has no Reopen control (SUP-04 OPEN; P0-30) and no
 * edit or delete (SUP-03). No category field (P0-34), no response times (ND-14). The My reports
 * row title is a display-only excerpt of "What happened" (P0-31 owner decision) — there is no
 * saved title field.
 */
import type { Audience, PersonActorRef, Role } from '../roles.js';
import type { ActorRef } from '../roles.js';
import { type Decision, invalidInput, invalidState, isBlank, ok } from '../kernel/decision.js';
import { type HistoryEntry, historyEntry } from '../kernel/history.js';
import type { IdSource } from '../kernel/id-source.js';
import type { InstitutionId, PersonId, SupportReportId } from '../kernel/ids.js';
import { isDrawnTransition, type TransitionTable } from '../kernel/machine.js';
import { newMeta, nextMeta, type RecordMeta } from '../kernel/record.js';
import type { IsoInstant } from '../kernel/time.js';

export const SUPPORT_STATES = ['open', 'resolved', 'reopened'] as const;
export type SupportState = (typeof SUPPORT_STATES)[number];

export interface SupportReport extends RecordMeta {
  /** SUP-0213 — 'Your reference is SUP-0213'. */
  readonly id: SupportReportId;
  readonly reporter: {
    readonly personId: PersonId;
    readonly role: Role;
    readonly displayName: string;
    readonly institutionId: InstitutionId | null;
    readonly organisation: string | null;
  };
  /** Required: "Say what happened, so it can be looked into". */
  readonly whatHappened: string;
  /** Pre-filled from the page; editable. */
  readonly where: string | null;
  /** Optional; nothing is uploaded. */
  readonly screenshotFileName: string | null;
  readonly state: SupportState;
  readonly sentAt: IsoInstant;
  readonly resolutions: readonly {
    readonly at: IsoInstant;
    readonly by: ActorRef;
    readonly note: string;
  }[];
  readonly reopenings: readonly { readonly at: IsoInstant; readonly by: ActorRef }[];
  readonly history: readonly HistoryEntry<'sent' | 'resolved' | 'reopened'>[];
}

export type SupportCommand = 'reportProblem' | 'resolveReport' | 'reopenReport';

export const SUPPORT_TRANSITIONS: TransitionTable<SupportState, SupportCommand> = [
  {
    from: null,
    to: 'open',
    command: 'reportProblem',
    actors: [
      'student',
      'faculty',
      'tenant_admin',
      'vendor',
      'academic_reviewer',
      'content_manager',
      'super_admin',
    ],
  },
  { from: 'open', to: 'resolved', command: 'resolveReport', actors: ['super_admin'] },
  { from: 'reopened', to: 'resolved', command: 'resolveReport', actors: ['super_admin'] },
  { from: 'resolved', to: 'reopened', command: 'reopenReport', actors: ['super_admin'] },
];

/** The provisional My reports row title: the start of "What happened" (P0-31). */
export function reportTitleExcerpt(report: SupportReport, length = 60): string {
  const text = report.whatHappened.trim().replace(/\s+/g, ' ');
  return text.length <= length ? text : `${text.slice(0, length - 1).trimEnd()}…`;
}

/** Report a problem (SUP-01): any signed-in person; signed-out people cannot (SUP-08). */
export function reportProblem(input: {
  readonly whatHappened: string;
  readonly where: string | null;
  readonly screenshotFileName: string | null;
  readonly institutionId: InstitutionId | null;
  readonly organisation: string | null;
  readonly actor: PersonActorRef;
  readonly now: IsoInstant;
  readonly ids: IdSource;
}): Decision<SupportReport> {
  if (isBlank(input.whatHappened)) return invalidInput({ field: 'whatHappened', rule: 'required' });
  const reporterOnly: readonly Audience[] = [input.actor.role, 'super_admin'];
  return ok({
    ...newMeta(input.now),
    id: input.ids.next('supportReport'),
    reporter: {
      personId: input.actor.personId,
      role: input.actor.role,
      displayName: input.actor.displayName,
      institutionId: input.institutionId,
      organisation: input.organisation,
    },
    whatHappened: input.whatHappened.trim(),
    where: isBlank(input.where) ? null : input.where!.trim(),
    screenshotFileName: isBlank(input.screenshotFileName) ? null : input.screenshotFileName!.trim(),
    state: 'open',
    sentAt: input.now,
    resolutions: [],
    reopenings: [],
    history: [
      historyEntry({
        id: input.ids.next('history'),
        event: 'sent',
        at: input.now,
        actor: input.actor,
        visibleTo: reporterOnly,
      }),
    ],
  });
}

/** Resolve (SUP-05): "Add a note — the reporter sees it". */
export function resolveReport(input: {
  readonly report: SupportReport;
  readonly note: string;
  readonly actor: PersonActorRef;
  readonly now: IsoInstant;
  readonly ids: IdSource;
}): Decision<SupportReport> {
  if (!isDrawnTransition(SUPPORT_TRANSITIONS, input.report.state, 'resolved', 'resolveReport'))
    return invalidState(input.report.state);
  if (isBlank(input.note)) return invalidInput({ field: 'note', rule: 'required' });
  const note = input.note.trim();
  return ok({
    ...input.report,
    ...nextMeta(input.report, input.now),
    state: 'resolved',
    resolutions: [...input.report.resolutions, { at: input.now, by: input.actor, note }],
    history: [
      ...input.report.history,
      historyEntry({
        id: input.ids.next('history'),
        event: 'resolved',
        at: input.now,
        actor: input.actor,
        note,
        visibleTo: [input.report.reporter.role, 'super_admin'],
      }),
    ],
  });
}

/** Reopen (SUP-06; DL-1 "It goes back to the open reports. The reporter sees it is open again."). */
export function reopenReport(input: {
  readonly report: SupportReport;
  readonly actor: PersonActorRef;
  readonly now: IsoInstant;
  readonly ids: IdSource;
}): Decision<SupportReport> {
  if (!isDrawnTransition(SUPPORT_TRANSITIONS, input.report.state, 'reopened', 'reopenReport'))
    return invalidState(input.report.state);
  return ok({
    ...input.report,
    ...nextMeta(input.report, input.now),
    state: 'reopened',
    reopenings: [...input.report.reopenings, { at: input.now, by: input.actor }],
    history: [
      ...input.report.history,
      historyEntry({
        id: input.ids.next('history'),
        event: 'reopened',
        at: input.now,
        actor: input.actor,
        visibleTo: [input.report.reporter.role, 'super_admin'],
      }),
    ],
  });
}
