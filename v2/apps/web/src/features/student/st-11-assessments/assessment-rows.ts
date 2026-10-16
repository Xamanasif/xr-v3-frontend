import type { MyAssessmentRow } from '@xr/contracts/draft';
import type { StatusTone } from '@xr/ui';

import { studentAssessmentWords, wordsOf } from '@/copy/flow-state-words';
import {
  answersSavedLine,
  dueLine,
  releasedLine,
  releaseTermsLine,
  STUDENT_ASSESSMENT_ACTIONS,
  submittedLine,
} from '@/copy/student-assessments';
import {
  STUDENT_ASSESSMENT_TABS,
  type StudentAssessmentTab,
  studentAssessmentAddress,
} from '@/nav/student-assessments';

/**
 * The Student's assessment rows as B4-11 draws them (ST-11 f0 … f4; the hub's Assessment tab f7,
 * f9 reuses the status and the action): the latest attempt's result as the service answers it
 * (`listMyAssessments` — figure-free until released, ATT-15), never anything derived beyond it.
 */
export type StudentAssessmentState = MyAssessmentRow['result']['kind'];

/** Which tab lists a row (board `where`: to do and in progress · waiting and not released · ready). */
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

/** The status chip's tone (board `W`: info · wait · wait · off · ok). */
export const STATE_TONE: Readonly<Record<StudentAssessmentState, StatusTone>> = {
  'to-do': 'info',
  'in-progress': 'wait',
  'waiting-for-marking': 'wait',
  'not-released-yet': 'off',
  released: 'ok',
};

/** The status in words (B4-11 f0 … f4). */
export function stateWordsOf(state: StudentAssessmentState): string {
  // Every state's words are drawn (B4-11 f0 … f4).
  return wordsOf(studentAssessmentWords(state)) ?? '';
}

/** A row's one action and where it goes (board `act` / `href`: ST-12, ST-13, ST-14). */
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

/** ST-11's fact line (f0 … f4, board `sub`). */
export function factLine(row: MyAssessmentRow): string {
  const deadline = row.assessment.rules.deadline;
  const latest = row.latest;
  switch (row.result.kind) {
    case 'to-do':
      return dueLine(deadline, row.questionCount);
    case 'in-progress':
      // The attempt's own version's deadline (Phase 4B review: as ST-13 shows it).
      return answersSavedLine(latest?.pinned.deadline ?? deadline);
    case 'waiting-for-marking':
      return submittedLine(latest?.submittedAt ?? null);
    case 'not-released-yet':
      return releaseTermsLine(
        latest?.release ?? { option: row.result.releaseRule, on: deadlineFor(row) },
      );
    case 'released':
      return releasedLine(row.result.releasedAt);
  }
}

/** Without the attempt's facts, the "after the deadline" terms read the assessment's deadline. */
function deadlineFor(row: MyAssessmentRow): string | null {
  if (row.result.kind === 'not-released-yet' && row.result.releaseRule === 'on-date')
    return row.assessment.rules.release?.releaseDate ?? null;
  return row.assessment.rules.deadline;
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
