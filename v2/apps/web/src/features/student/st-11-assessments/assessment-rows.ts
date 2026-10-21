import type { MyAssessmentRow } from '@xr/contracts/draft';
import type { StatusTone } from '@xr/ui/v3';

import { studentAssessmentWords, wordsOf } from '@/copy/flow-state-words';
import {
  assessmentActionName,
  HUB_ASSESSMENT_TAB,
  hubFactsLine,
  markedReleaseLine,
  releasedLine,
  ST_HUB_ASSESSMENT_V3,
  ST_ROW_LINES,
  STUDENT_ASSESSMENT_ACTIONS,
  submittedLine,
  WHEN_KICKERS,
  whenWords,
} from '@/copy/student-assessments';
import {
  STUDENT_ASSESSMENT_TABS,
  type StudentAssessmentTab,
  studentAssessmentAddress,
} from '@/nav/student-assessments';

/**
 * The Student's assessment rows as the V3 export draws them (ST-v1 `asmtRow`, `alistVM`,
 * `asmtTabVM`: ST-11 and the hub's Assessment tab): the latest attempt's result as the service
 * answers it (`listMyAssessments` — figure-free until released, ATT-15), never anything derived
 * beyond it. Dates are counted from the session's today (presentation only).
 */
export type StudentAssessmentState = MyAssessmentRow['result']['kind'];

/** Which tab lists a row (the export's `tab`: to do and in progress · waiting and not released · ready). */
export function tabOfState(state: StudentAssessmentState): StudentAssessmentTab {
  switch (state) {
    case 'to-do':
    case 'in-progress':
      return 'to-do';
    case 'waiting-for-marking':
    case 'not-released-yet':
      return 'submitted';
    case 'released':
      return 'results';
  }
}

/** The status pill's tone (the export's `pillCls`: info · warn · warn · plain · ok). */
export const STATE_TONE: Readonly<Record<StudentAssessmentState, StatusTone>> = {
  'to-do': 'info',
  'in-progress': 'warn',
  'waiting-for-marking': 'warn',
  'not-released-yet': 'neutral',
  released: 'ok',
};

/** The status in words ("To do", "Attempt in progress", …). */
export function stateWordsOf(state: StudentAssessmentState): string {
  return wordsOf(studentAssessmentWords(state)) ?? '';
}

/** The state's status (tone and words). */
export function statusOf(state: StudentAssessmentState) {
  return { tone: STATE_TONE[state], words: stateWordsOf(state) } as const;
}

/** A row's one action and where it goes (the export's `act` / `href`: ST-12, ST-13, ST-14). */
export function rowAction(
  assessmentId: string,
  state: StudentAssessmentState,
): { readonly words: string; readonly href: string } {
  switch (state) {
    case 'to-do':
      return {
        words: STUDENT_ASSESSMENT_ACTIONS.open,
        href: studentAssessmentAddress(assessmentId),
      };
    case 'in-progress':
      return {
        words: STUDENT_ASSESSMENT_ACTIONS.continueAttempt,
        href: studentAssessmentAddress(assessmentId, 'attempt'),
      };
    case 'waiting-for-marking':
    case 'not-released-yet':
      return {
        words: STUDENT_ASSESSMENT_ACTIONS.view,
        href: studentAssessmentAddress(assessmentId, 'result'),
      };
    case 'released':
      return {
        words: STUDENT_ASSESSMENT_ACTIONS.seeResult,
        href: studentAssessmentAddress(assessmentId, 'result'),
      };
  }
}

/** The gold primary while the Student can still answer (`btnCls`: to do, in progress). */
export function isPrimaryState(state: StudentAssessmentState): boolean {
  return state === 'to-do' || state === 'in-progress';
}

/** The release terms an attempt pins, or — without the attempt's facts — the assessment's own. */
function releaseOf(row: MyAssessmentRow) {
  if (row.latest) return row.latest.release;
  const release = row.assessment.rules.release;
  return {
    option: release?.option ?? null,
    on: release?.option === 'on-date' ? release.releaseDate : row.assessment.rules.deadline,
  };
}

/** The deadline that applies: the attempt's own version's (as ST-13 shows it), else the current one. */
function deadlineOf(row: MyAssessmentRow): string | null {
  return row.latest?.pinned.deadline ?? row.assessment.rules.deadline;
}

export interface RowWhen {
  readonly kicker: string;
  readonly when: { readonly day: string; readonly time: string; readonly soon: boolean } | null;
}

/**
 * ST-11's date lead (`r.whenK`, `r.when`): "Due" and the deadline while it is open, "Result after"
 * and the release date while it waits (none for a result released at marking), "Released" and the
 * release once results are out. Only a deadline is ever drawn ivory.
 */
export function rowWhen(row: MyAssessmentRow, today: string | null): RowWhen {
  const deadline = deadlineOf(row);
  switch (row.result.kind) {
    case 'to-do':
    case 'in-progress':
      return {
        kicker: WHEN_KICKERS.due,
        when: deadline ? whenWords(deadline, today) : null,
      };
    case 'waiting-for-marking':
    case 'not-released-yet': {
      const on = releaseOf(row).on;
      return { kicker: WHEN_KICKERS.resultAfter, when: on ? whenWords(on, today, false) : null };
    }
    case 'released':
      return {
        kicker: WHEN_KICKERS.released,
        when: whenWords(row.result.releasedAt, today, false),
      };
  }
}

/** ST-11's line after the status (`alistVM` `sub`). */
export function rowLine(row: MyAssessmentRow): string {
  switch (row.result.kind) {
    case 'to-do':
      return ST_ROW_LINES.toDo(row.questionCount, row.totalMarks);
    case 'in-progress':
      return ST_ROW_LINES.inProgress;
    case 'waiting-for-marking':
      return ST_ROW_LINES.waiting(row.latest?.submittedAt ?? null);
    case 'not-released-yet':
      return markedReleaseLine(releaseOf(row));
    case 'released':
      return ST_ROW_LINES.released;
  }
}

/** The hub tab's words after the status (`asmtTabVM` `state`; none while to do). */
export function hubStateLine(row: MyAssessmentRow): string | null {
  switch (row.result.kind) {
    case 'to-do':
      return null;
    case 'in-progress':
      return ST_HUB_ASSESSMENT_V3.inProgress;
    case 'waiting-for-marking':
      return submittedLine(row.latest?.submittedAt ?? null);
    case 'not-released-yet':
      return markedReleaseLine(releaseOf(row));
    case 'released':
      return releasedLine(row.result.releasedAt);
  }
}

/** The hub tab's date lead (`AT1.whenK`, `AT1.when`): "Due" while open, then "Deadline". */
export function hubWhen(row: MyAssessmentRow, today: string | null): RowWhen {
  const deadline = deadlineOf(row);
  return {
    kicker: isPrimaryState(row.result.kind) ? WHEN_KICKERS.due : WHEN_KICKERS.deadline,
    when: deadline ? whenWords(deadline, today) : null,
  };
}

/**
 * The hub tab's key facts (`AT1.facts`): the attempt's own version's once there is an attempt, the
 * current version's before.
 */
export function hubFacts(row: MyAssessmentRow): string {
  const pinned = row.latest?.pinned;
  return hubFactsLine(
    pinned && row.latest
      ? {
          questionCount: row.latest.questionCount,
          totalMarks: pinned.totalMarks,
          passMarkPercent: pinned.passMarkPercent,
          attemptsAllowed: pinned.attemptsAllowed,
        }
      : {
          questionCount: row.questionCount,
          totalMarks: row.totalMarks,
          passMarkPercent: row.assessment.rules.passMarkPercent,
          attemptsAllowed: row.assessment.rules.attemptsAllowed,
        },
  );
}

/** The hub tab's one action (`AT1.act`): "Open assessment" while to do, else the row's action. */
export function hubAction(row: MyAssessmentRow) {
  const state = row.result.kind;
  const action = rowAction(row.assessment.id, state);
  const label = state === 'to-do' ? HUB_ASSESSMENT_TAB.open : action.words;
  return {
    href: action.href,
    label,
    ariaLabel: assessmentActionName(label, row.assessment.name),
    primary: isPrimaryState(state),
  };
}

/**
 * The tab an address asks for and whether it must be normalised: `tab=submitted` and
 * `tab=results` show those tabs; no `tab` is To do; any other `tab` shows To do and the address
 * becomes the bare one (state-copy `ST-11.tabs`).
 */
export function assessmentsTabOf(search: string): {
  readonly tab: StudentAssessmentTab;
  readonly normalise: boolean;
} {
  const asked = new URLSearchParams(search).get('tab');
  if (asked === null) return { tab: 'to-do', normalise: false };
  if (asked !== 'to-do' && (STUDENT_ASSESSMENT_TABS as readonly string[]).includes(asked))
    return { tab: asked as StudentAssessmentTab, normalise: false };
  return { tab: 'to-do', normalise: true };
}
