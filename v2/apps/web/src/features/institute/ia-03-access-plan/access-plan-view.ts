/**
 * IA-03's pure view rules in the V3 design (IA-v1 `Main.dc.html` IA-03 and its script's `vm03`):
 *
 * - "Students you’ve given access", grouped by experiment (as on Student access): one row per
 *   student — the grant they hold individually, else the group grant that reaches them — with
 *   "Also in …" for each other group whose grant reaches them too (the export's `saRow`).
 * - "History", newest first: the plan's own history (activation, grants given and withdrawn,
 *   pause and restore), its request's "Request submitted" and "Request approved" lines (the
 *   payment lines fold into "Access activated"), and "Plan ended" once the plan reads ended
 *   (state-copy `IA-03.history`, `IA-03.history-ended`). No grant or plan reference is written: a
 *   grant is who was given what and how (state-copy `IA-plan.no-reference`).
 */
import type { AccessPlanView, PlanGrantRow, RequesterRequestView } from '@xr/contracts/draft';
import type { GrantDisplayStatus, InstitutionKind, Technology } from '@xr/domain';

import { calendarDay, dateTime, dayMonthYear } from '@/copy/dates';
import {
  ACCESS_PLAN_WORDS,
  approvedWithChangesWhat,
  endOfTermNote,
  givenWhat,
  requestApprovedWhat,
  RESTORED_WHAT,
  whenBy,
  withdrawnNote,
} from '@/copy/institute-home';
import { routeWords } from '@/copy/requests';

import { actorName } from '../shared/actor-name';

// ---- Students you've given access ----

/** One student of an experiment, by the grant that reaches them. */
export interface GivenStudentView {
  readonly key: string;
  readonly student: PlanGrantRow['student'];
  /** Individually, or through a group (its page). */
  readonly via: PlanGrantRow['via'];
  readonly givenAt: string;
  readonly display: GrantDisplayStatus;
  /** The other groups whose grant reaches the student too ("Also in …"). */
  readonly alsoIn: readonly string[];
}

/** One experiment of the plan with the students given it. */
export interface GivenGroupView {
  readonly experimentId: string;
  readonly name: string;
  readonly courseCode: string | null;
  readonly courseName: string;
  readonly formats: readonly Technology[];
  readonly students: readonly GivenStudentView[];
}

/**
 * The students given each experiment of the plan, in the plan's order and the service's row order:
 * a student's own grant first, else the group grant that reaches them; every other group grant
 * that reaches them is named under it.
 */
export function givenGroups(view: AccessPlanView): GivenGroupView[] {
  return view.experiments.flatMap((experiment) => {
    const rows = view.givenTo.filter((row) => row.experimentId === experiment.experimentId);
    const byStudent = new Map<string, PlanGrantRow[]>();
    for (const row of rows) {
      const list = byStudent.get(row.student.id) ?? [];
      list.push(row);
      byStudent.set(row.student.id, list);
    }
    const students = [...byStudent.values()].map((held): GivenStudentView => {
      const primary = held.find((row) => row.via.kind === 'student') ?? held[0]!;
      const alsoIn = held
        .filter((row) => row !== primary)
        .flatMap((row) => (row.via.kind === 'group' ? [row.via.groupName] : []));
      return {
        key: `${experiment.experimentId}:${primary.student.id}`,
        student: primary.student,
        via: primary.via,
        givenAt: primary.givenAt,
        display: primary.display,
        alsoIn,
      };
    });
    if (students.length === 0) return [];
    return [
      {
        experimentId: experiment.experimentId,
        name: experiment.name,
        courseCode: experiment.course.platformCode,
        courseName: experiment.course.name,
        formats: experiment.formats,
        students,
      },
    ];
  });
}

// ---- History ----

export interface HistoryLine {
  readonly id: string;
  /** When it happened (sorting only). */
  readonly at: string;
  readonly what: string;
  readonly when: string;
  readonly note: string | null;
}

function routeOf(note: string | null): InstitutionKind | null {
  return note === 'internal' || note === 'external' ? note : null;
}

/** The end of a plan's last day in Indian time (`2027-10-07` → `2027-10-07T18:30:00.000Z`). */
function endOfDay(date: string): string {
  return `${date}T18:30:00.000Z`;
}

export function historyLines(
  view: AccessPlanView,
  request: RequesterRequestView | null,
): HistoryLine[] {
  const { plan } = view;
  const experimentName = (experimentId: string) =>
    view.experiments.find((experiment) => experiment.experimentId === experimentId)?.name ??
    experimentId;
  const lines: HistoryLine[] = [];

  for (const entry of request?.history ?? []) {
    if (entry.event === 'submitted') {
      lines.push({
        id: entry.id,
        at: entry.at,
        what: ACCESS_PLAN_WORDS.requestSubmitted,
        when: whenBy(dateTime(entry.at), actorName(entry.actor)),
        note: null,
      });
    } else if (entry.event === 'approved' || entry.event === 'approved-with-changes') {
      const route = routeOf(entry.note);
      const routeText = routeWords(route);
      lines.push({
        id: entry.id,
        at: entry.at,
        what:
          entry.event === 'approved'
            ? requestApprovedWhat(routeText)
            : approvedWithChangesWhat(routeText),
        // The export names no BITS person for the approval.
        when: dateTime(entry.at),
        note: route === 'external' ? ACCESS_PLAN_WORDS.requestApprovedNote : null,
      });
    }
  }

  for (const entry of plan.history) {
    const grantId = entry.refs.find((ref) => ref.kind === 'SACC')?.id;
    const grant = grantId ? view.grants.find((candidate) => candidate.id === grantId) : undefined;
    switch (entry.event) {
      case 'activated':
        lines.push({
          id: entry.id,
          at: entry.at,
          what: ACCESS_PLAN_WORDS.activated,
          when: dateTime(entry.at),
          note:
            entry.actor.kind === 'system' && entry.actor.system === 'system:payment-provider'
              ? ACCESS_PLAN_WORDS.activatedNote
              : ACCESS_PLAN_WORDS.createdNote,
        });
        break;
      case 'access-given':
        if (!grant) break;
        lines.push({
          id: entry.id,
          at: entry.at,
          what: givenWhat(
            grant.target.name,
            experimentName(grant.experimentId),
            grant.target.kind === 'group',
          ),
          when: whenBy(dateTime(entry.at), actorName(entry.actor)),
          note:
            grant.target.kind === 'group'
              ? ACCESS_PLAN_WORDS.groupGrant
              : ACCESS_PLAN_WORDS.individually,
        });
        break;
      case 'access-withdrawn':
        if (!grant) break;
        lines.push({
          id: entry.id,
          at: entry.at,
          what: ACCESS_PLAN_WORDS.withdrawn,
          when: whenBy(dateTime(entry.at), actorName(entry.actor)),
          note: withdrawnNote(grant.target.name, experimentName(grant.experimentId)),
        });
        break;
      case 'paused':
        lines.push({
          id: entry.id,
          at: entry.at,
          what: ACCESS_PLAN_WORDS.paused,
          when: dayMonthYear(entry.at),
          note: null,
        });
        break;
      case 'restored':
        lines.push({
          id: entry.id,
          at: entry.at,
          what: RESTORED_WHAT,
          when: dayMonthYear(entry.at),
          note: null,
        });
        break;
      case 'ended':
        lines.push({
          id: entry.id,
          at: entry.at,
          what: ACCESS_PLAN_WORDS.planEnded,
          when: calendarDay(plan.endsOn),
          note: endOfTermNote(plan.term),
        });
        break;
      default:
        // ending-soon, renewal-requested, renewed: no sample writer and no words yet.
        break;
    }
  }

  if (view.status === 'access-ended' && !plan.history.some((entry) => entry.event === 'ended')) {
    lines.push({
      id: `${plan.id}-ended`,
      at: endOfDay(plan.endsOn),
      what: ACCESS_PLAN_WORDS.planEnded,
      when: calendarDay(plan.endsOn),
      note: endOfTermNote(plan.term),
    });
  }

  // Newest first; of two at the same moment, the one recorded later first.
  return lines
    .map((line, index) => ({ line, index }))
    .sort((a, b) => (a.line.at === b.line.at ? b.index - a.index : a.line.at < b.line.at ? 1 : -1))
    .map(({ line }) => line);
}
