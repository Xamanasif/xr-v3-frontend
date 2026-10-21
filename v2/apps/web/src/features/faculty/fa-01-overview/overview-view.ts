import type { FaProgressRow, FaUnitState } from '@xr/ui/v3';
import type {
  AssessmentListRow,
  FacultyAttention,
  FacultyOverview,
  FacultyStudentRow,
  MarkingQueueRow,
  TeachingCourseRow,
} from '@xr/contracts/draft';

import { deadlineWords, endedOnWords } from '@/copy/assessment-words';
import { dateTime, dayMonth } from '@/copy/dates';
import { assessmentName, faDaysLeftWords } from '@/copy/fa-shared';
import {
  accessEndedSub,
  acrossWords,
  ATTENTION_ITEMS,
  assessmentByWords,
  createdByWords,
  dueWords,
  FACULTY_OVERVIEW_WORDS,
  lastActiveWords,
  markNowLabel,
  moreInWords,
  oldestWaitingWords,
  openDueLabel,
  reachWords,
  releaseRuleWords,
  submittedWords,
} from '@/copy/faculty-overview';
import { stateWords } from '@/copy/state-copy';
import {
  assessmentAddress,
  FACULTY_MY_COURSES_ADDRESS,
  facultyStudentsAddress,
} from '@/nav/faculty';

import type { TaughtExperiment } from '../fa-04-experiments/taught-experiments';
import {
  colleagueOf,
  daysSince,
  formatCodes,
  progressRows,
  studentsReached,
} from '../fa-04-experiments/teaching-view';
import { assessmentStateLongView, type StatusView } from '../shared/assessment-state';
import { deadlineView } from '../shared/deadline-model';
import { submittedUnits } from '../shared/progress-model';

/**
 * FA-01's view, written from the facts the reads answer (the export's `vmOverview`): the priority
 * band from the overview's attention facts (PC-51: facts, never words) with the people behind each
 * count — the waiting submissions from the marking queue (oldest first), the inactive Students'
 * last activity from Students — "Coming up" from the overview's Ready deadlines with the release
 * rule and who created them (`listAssessments`), and "Your teaching" from the courses and the taught
 * experiments' per-format counts. Pure: the page draws what this returns.
 */

/** How many names an item lists before "and <n> more in …" (the export's `slice(0, 3)`). */
export const NAMES_SHOWN = 3;

export interface PriorityItemView {
  readonly key: 'written' | 'inactive' | 'access-ended';
  readonly big: string;
  readonly relative: string;
  readonly calm: boolean;
  readonly kind: 'written' | 'inactive' | 'access-ended';
  readonly kindLabel: string;
  readonly title: string;
  readonly description: string | null;
  readonly list: {
    readonly label: string;
    readonly rows: readonly {
      readonly key: string;
      readonly name: string;
      readonly detail: string | null;
    }[];
    readonly more: string | null;
  } | null;
  readonly action: {
    readonly label: string;
    /** `null`: "Mark now" — the page puts the oldest submission's address (`useOldestWaiting`). */
    readonly href: string | null;
    readonly accessibleName: string | null;
    readonly primary: boolean;
  };
}

/** "5 Nov, 18:52" — a submission's day and time without the year (the export's queue lines). */
export function submittedAtWords(instant: string): string {
  return dateTime(instant).replace(/ \d{4},/, ',');
}

function writtenItem(
  facts: readonly Extract<FacultyAttention, { kind: 'written-answers-to-mark' }>[],
  queue: readonly MarkingQueueRow[] | null,
  today: string | null,
): PriorityItemView {
  const total = facts.reduce((sum, fact) => sum + fact.answers, 0);
  const oldestFact = [...facts].sort((a, b) =>
    a.oldest.submittedAt.localeCompare(b.oldest.submittedAt),
  )[0]!;
  const oldestRow = queue?.[0] ?? null;
  const oldestAt = oldestRow?.submittedAt ?? oldestFact.oldest.submittedAt;
  const days = today === null ? 0 : daysSince(oldestAt, today);
  const words = ATTENTION_ITEMS.written;
  const shown = queue ?? [];
  return {
    key: 'written',
    big: String(total),
    relative: oldestWaitingWords(days),
    calm: false,
    kind: 'written',
    kindLabel: total === 1 ? words.one : words.many,
    title:
      facts.length === 1
        ? assessmentName(oldestFact.assessmentName)
        : acrossWords(facts.length, 'assessment'),
    description: words.description,
    list:
      shown.length > 0
        ? {
            label: words.listLabel,
            rows: shown.slice(0, NAMES_SHOWN).map((row) => ({
              key: row.attempt.id,
              name: row.student.fullName,
              detail: submittedAtWords(row.submittedAt),
            })),
            more: total > NAMES_SHOWN ? moreInWords(total - NAMES_SHOWN, 'Marking') : null,
          }
        : null,
    action: {
      label: words.action,
      href: null,
      accessibleName: markNowLabel(
        oldestRow?.student.fullName ?? oldestFact.oldest.studentName,
        assessmentName(oldestRow?.assessmentName ?? oldestFact.assessmentName),
      ),
      primary: true,
    },
  };
}

function inactiveItem(
  facts: readonly Extract<FacultyAttention, { kind: 'students-inactive' }>[],
  students: ReadonlyMap<string, readonly FacultyStudentRow[]>,
): PriorityItemView {
  const words = ATTENTION_ITEMS.inactive;
  const people = facts.flatMap((fact) => {
    const rows = students.get(fact.experimentId) ?? [];
    return fact.students.map((student, order) => {
      const row = rows.find((candidate) => candidate.studentId === student.studentId) ?? null;
      return { fact, student, row, order };
    });
  });
  // Longest inactive first when Students has answered; else the service's order.
  const ordered = [...people].sort(
    (a, b) => (b.row?.inactiveDays ?? -1) - (a.row?.inactiveDays ?? -1) || a.order - b.order,
  );
  return {
    key: 'inactive',
    big: String(people.length),
    relative: words.when,
    calm: true,
    kind: 'inactive',
    kindLabel: people.length === 1 ? words.one : words.many,
    title: facts.length === 1 ? facts[0]!.experimentName : acrossWords(facts.length, 'experiment'),
    description: null,
    list: {
      label: words.listLabel,
      rows: ordered.slice(0, NAMES_SHOWN).map(({ fact, student, row }) => ({
        key: `${fact.experimentId}:${student.studentId}`,
        name: student.name,
        detail:
          row === null
            ? null
            : lastActiveWords(
                row.lastActivityAt === null ? null : dayMonth(row.lastActivityAt),
                row.accessGivenAt === null ? null : dayMonth(row.accessGivenAt),
              ),
      })),
      more:
        people.length > NAMES_SHOWN ? moreInWords(people.length - NAMES_SHOWN, 'Students') : null,
    },
    action: {
      label: words.action,
      href: facultyStudentsAddress(facts[0]!.experimentId),
      accessibleName: words.actionLabel,
      primary: false,
    },
  };
}

function accessEndedItem(
  facts: readonly Extract<FacultyAttention, { kind: 'access-ended' }>[],
): PriorityItemView {
  const first = facts[0]!;
  return {
    key: 'access-ended',
    big: String(facts.length),
    relative:
      facts.length === 1
        ? stateWords('FA-01.access-ended-when').replace('{date}', endedOnWords(first.endedOn))
        : stateWords('FA-01.access-ended-when-many'),
    calm: true,
    kind: 'access-ended',
    kindLabel: stateWords('FA-01.access-ended-kind'),
    title: facts.length === 1 ? first.experimentName : acrossWords(facts.length, 'experiment'),
    description: facts.length === 1 ? accessEndedSub(first.courseCode) : accessEndedSub(null),
    list: null,
    action: {
      label: FACULTY_OVERVIEW_WORDS.myCourses,
      href: FACULTY_MY_COURSES_ADDRESS,
      accessibleName: null,
      primary: false,
    },
  };
}

/**
 * The priority band's items (at most three in the export: written answers, drafts, inactive
 * Students). The drafts item is not drawn: the overview read holds no drafts fact (PC-51). A course
 * whose access ended — a product state the export does not draw — follows as its own item.
 */
export function priorityItems(
  attention: readonly FacultyAttention[],
  queue: readonly MarkingQueueRow[] | null,
  students: ReadonlyMap<string, readonly FacultyStudentRow[]>,
  today: string | null,
): PriorityItemView[] {
  const written = attention.filter(
    (fact): fact is Extract<FacultyAttention, { kind: 'written-answers-to-mark' }> =>
      fact.kind === 'written-answers-to-mark',
  );
  const inactive = attention.filter(
    (fact): fact is Extract<FacultyAttention, { kind: 'students-inactive' }> =>
      fact.kind === 'students-inactive',
  );
  const ended = attention.filter(
    (fact): fact is Extract<FacultyAttention, { kind: 'access-ended' }> =>
      fact.kind === 'access-ended',
  );
  return [
    ...(written.length > 0 ? [writtenItem(written, queue, today)] : []),
    ...(inactive.length > 0 ? [inactiveItem(inactive, students)] : []),
    ...(ended.length > 0 ? [accessEndedItem(ended)] : []),
  ];
}

/** The experiments the inactive-Students facts name (Students is read for each, to word them). */
export function inactiveExperiments(attention: readonly FacultyAttention[]): string[] {
  return attention.flatMap((fact) =>
    fact.kind === 'students-inactive' ? [fact.experimentId] : [],
  );
}

/** The written answers waiting across the attention facts (the Mark now count). */
export function writtenAnswersWaiting(attention: readonly FacultyAttention[]): number {
  return attention.reduce(
    (sum, fact) => sum + (fact.kind === 'written-answers-to-mark' ? fact.answers : 0),
    0,
  );
}

// ---- Coming up -------------------------------------------------------------------------------------

export interface DeadlineView {
  readonly key: string;
  readonly day: string;
  readonly month: string;
  readonly title: string;
  readonly href: string;
  readonly accessibleName: string;
  readonly due: string;
  readonly left: string;
  readonly submissions: { readonly units: readonly FaUnitState[]; readonly line: string } | null;
  readonly createdBy: string | null;
  readonly release: string | null;
}

/** The overview's Ready deadlines in the next 30 days (the service's, at most three, soonest first). */
export function deadlineViews(
  comingUp: FacultyOverview['comingUp'],
  assessments: readonly AssessmentListRow[],
  me: string | null,
  today: string | null,
): DeadlineView[] {
  return comingUp.map((item) => {
    const row = assessments.find((candidate) => candidate.assessment.id === item.assessmentId);
    const colleague = row ? colleagueOf(row, me) : null;
    const [day = '', month = ''] = dayMonth(item.deadline).split(' ');
    const name = assessmentName(item.name);
    const deadline = deadlineWords(item.deadline);
    const release = row?.assessment.rules.release ?? null;
    return {
      key: item.assessmentId,
      day,
      month,
      title: name,
      href: assessmentAddress(item.assessmentId),
      accessibleName: openDueLabel(name, deadline),
      due: dueWords(deadline),
      left: faDaysLeftWords(
        today === null ? 0 : Math.max(0, deadlineView(item.deadline, today).days),
        'short',
      ),
      submissions:
        colleague === null
          ? {
              units: submittedUnits(item.submitted, item.reach),
              line: submittedWords(item.submitted, item.reach),
            }
          : null,
      createdBy: colleague === null ? null : createdByWords(colleague),
      release:
        release === null
          ? null
          : releaseRuleWords(
              release.option,
              release.releaseDate === null ? null : deadlineWords(release.releaseDate),
            ),
    };
  });
}

// ---- Your teaching --------------------------------------------------------------------------------

export interface TeachingExperimentView {
  readonly experimentId: string;
  readonly name: string;
  readonly formats: readonly string[];
  readonly reach: string;
  readonly students: number;
  readonly progress: readonly FaProgressRow[];
  /** "Assessment ready" (ok), "Assessment in draft" or "No assessment yet" (neutral). */
  readonly status: StatusView;
  readonly assessment: string | null;
}

export interface TeachingCourseView {
  readonly courseId: string;
  readonly code: string | null;
  readonly name: string;
  readonly experiments: readonly TeachingExperimentView[];
}

/** One taught experiment as "Your teaching" (and FA-02's ledger) draws it. */
export function teachingExperimentView(
  entry: TaughtExperiment,
  me: string | null,
): TeachingExperimentView {
  const students = studentsReached(entry.teaching);
  return {
    experimentId: entry.option.experimentId,
    name: entry.option.name,
    formats: formatCodes(entry.teaching.formatsInstitutionHas),
    reach: reachWords(students),
    students,
    progress: students > 0 ? progressRows(entry.teaching) : [],
    status: assessmentStateLongView(entry.assessment?.readiness ?? null),
    assessment:
      entry.assessment === null
        ? null
        : assessmentByWords(
            assessmentName(entry.assessment.assessment.name),
            colleagueOf(entry.assessment, me),
          ),
  };
}

/** The courses (listMyCourses order), each with its taught experiments. */
export function teachingCourseViews(
  courses: readonly TeachingCourseRow[],
  taught: readonly TaughtExperiment[],
  me: string | null,
): TeachingCourseView[] {
  return courses.map((row) => ({
    courseId: row.course.id,
    code: row.course.platformCode,
    name: row.course.name,
    experiments: taught
      .filter((entry) => entry.teaching.experiment.courseId === row.course.id)
      .map((entry) => teachingExperimentView(entry, me)),
  }));
}

/**
 * A new teacher (the export's `isNew`): a course, but no assessment, nothing in the question bank
 * and no Student given an experiment yet — then "Get your course ready" replaces the calm state.
 */
export function isNewTeacher(input: {
  readonly courses: number;
  readonly taught: readonly TaughtExperiment[];
  readonly assessments: readonly AssessmentListRow[];
  readonly bankEmpty: boolean | null;
}): boolean {
  return (
    input.courses > 0 &&
    input.taught.length > 0 &&
    input.assessments.length === 0 &&
    input.bankEmpty === true &&
    input.taught.every((entry) => studentsReached(entry.teaching) === 0)
  );
}

/** "No deadlines in the next 30 days." once an assessment exists; else "No deadlines yet. …". */
export function noDeadlineWords(assessments: readonly AssessmentListRow[]): string {
  return assessments.length > 0
    ? FACULTY_OVERVIEW_WORDS.noDeadlines
    : FACULTY_OVERVIEW_WORDS.noDeadlinesYet;
}
