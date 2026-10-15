/**
 * The words of FA-06 Assessments and FA-07 Create assessment (board B4-04 f0 … f11), written from
 * the facts `AssessmentService.listAssessments` and `getCreateOptions` answer (each assessment, its
 * readiness, who has submitted, its reach, what waits for marking; the experiments the Faculty
 * member teaches) and the question bank. Every phrase here is the frozen board's own, found
 * verbatim in its markup (`features/faculty/assessments.test.tsx`); what B4-04 does not word is a
 * provisional entry of the state-copy register (`state-copy-assessments.ts`, VD-12). The board's
 * sample names, counts and dates are never copied: they come from the records.
 */
import { stateWords } from './state-copy';

// ---- FA-06 Assessments (B4-04 f0, f9, f10) ------------------------------------------------------

export const ASSESSMENTS_PAGE = {
  /** `div.xr-phead-meta > span.xl-meta`. */
  meta: 'Assessments for experiments you teach',
  /** The header's primary action and the empty state's (f0, f9, f10). */
  create: 'Create assessment',
  /** `section.xr-section > h2`. */
  section: 'All assessments',
  searchLabel: 'Search assessments',
  searchPlaceholder: 'Name or experiment',
  courseLabel: 'Course',
  allCourses: 'All courses',
  stateLabel: 'State',
  allStates: 'All states',
  /** The State filter's options (f0 `select#Lm-s`). */
  states: { draft: 'Draft', ready: 'Ready', waiting: 'Waiting for marking' },
  columns: {
    assessment: 'Assessment',
    experiment: 'Experiment',
    state: 'State',
    deadline: 'Deadline and submissions',
    action: 'Action',
  },
  /** A Ready assessment's action (f0). */
  open: 'Open',
  /** A draft's action (f10). */
  continueSettingUp: 'Continue setting up',
  /** f9. */
  emptyTitle: 'No assessments yet',
  emptyLine:
    'Create an assessment for an experiment you teach. You can save a draft while you add questions.',
} as const;

/** The failed state's button (B2-06 f5 “Try again”; state-copy `FA-06.failed`). */
export const LIST_STATES = { tryAgain: 'Try again' } as const;

export type AssessmentStateFilter = '' | keyof typeof ASSESSMENTS_PAGE.states;

/**
 * "1 assessment" (f0, f10); PROVISIONAL in the plural and while a search or filter is applied
 * (`FA-06.count`): "3 assessments", "1 of 3 assessments".
 */
export function assessmentCountWords(shown: number, total: number, filtered: boolean): string {
  const noun = (count: number) => (count === 1 ? 'assessment' : 'assessments');
  return filtered ? `${shown} of ${total} ${noun(total)}` : `${total} ${noun(total)}`;
}

/** f0 "Due 14 Nov 2026, 23:59 · 1 of 5 submitted · " before the wait pill. */
export function dueAndSubmittedWords(deadline: string, submitted: number, reach: number): string {
  return `Due ${deadline} · ${submitted} of ${reach} submitted`;
}

/** f0 `span.xr-status--wait` "1 waiting for marking". */
export function waitingForMarkingWords(count: number): string {
  return `${count} waiting for marking`;
}

/**
 * f10 "Rules set · no questions yet · students can’t see it". The other drafts (`FA-06.draft-line`,
 * PROVISIONAL): "Some rules set" / "No rules set yet", "1 question" / "<n> questions".
 */
export function draftLineWords(rules: 'all' | 'some' | 'none', questions: number): string {
  const rulesPart =
    rules === 'all'
      ? 'Rules set'
      : rules === 'some'
        ? stateWords('FA-06.draft-rules-some')
        : stateWords('FA-06.draft-rules-none');
  const questionsPart =
    questions === 0
      ? 'no questions yet'
      : `${questions} ${questions === 1 ? 'question' : 'questions'}`;
  return `${rulesPart} · ${questionsPart} · students can’t see it`;
}

/** The row action's accessible name: the drawn word, then the assessment (`FA-06.row-action-name`). */
export function rowActionLabel(action: string, assessmentName: string): string {
  return `${action} ${assessmentName}`;
}

// ---- FA-07 Create assessment (B4-04 f1 … f8, f11) ----------------------------------------------

export const CREATE_ASSESSMENT = {
  /** The top bar, the crumb, the result's overline and the stepper's name (`ol[aria-label]`). */
  title: 'Create assessment',
  /** `a.xr-back`. */
  back: 'Assessments',
  /** The stepper's labels (Appendix A rule S1 slugs `experiment|rules|questions|preview`). */
  steps: ['Experiment', 'Rules', 'Questions', 'Preview'],
  stepTitles: {
    experiment: 'Choose the experiment',
    rules: 'Set the rules',
    questions: 'Add questions',
    preview: 'Preview and create',
  },
  createdTitle: 'Assessment created',
  draftTitle: 'Saved as draft',
  cancel: 'Cancel',
  continue: 'Continue',
  goBack: 'Back',
  saveAsDraft: 'Save as draft',
  create: 'Create assessment',
  creating: 'Creating…',
} as const;

/** Step 1 (f1, f8). */
export const CHOOSE_EXPERIMENT = {
  legend: 'Experiments you teach',
  noAssessment: 'No assessment yet',
  /** "Already has an assessment: Heat Exchanger — post-lab". */
  hasAssessment: 'Already has an assessment: ',
  note: 'Students get the formats their institution holds. Assessments are set per experiment, not per format.',
  /** f8: the field error, the summary link and the notice's title. */
  exists: 'This experiment already has an assessment',
  /** f8: "Open <name> to change its questions or rules. One assessment per experiment is …". */
  existsBefore: 'Open ',
  existsAfter:
    ' to change its questions or rules. One assessment per experiment is how this works for now (open decision).',
} as const;

/** "ME ZG523 · Thermodynamics & Heat Transfer" — the code Faculty see, then the course. */
export function experimentCourseLine(code: string | null, course: string | null): string | null {
  const parts = [code, course].filter((part): part is string => Boolean(part));
  return parts.length === 0 ? null : parts.join(' · ');
}

/** The "This assessment" panel (f1 … f5; a collapsible block below 860 px of content, f8, f11). */
export const THIS_ASSESSMENT = {
  title: 'This assessment',
  experiment: 'Experiment',
  name: 'Name',
  rules: 'Rules',
  questions: 'Questions',
  notChosen: 'Not chosen yet',
  notNamed: 'Not named yet',
  notSet: 'Not set yet',
  noQuestions: 'No questions yet',
} as const;

/** "Shell-and-Tube Heat Exchanger · ME ZG523" (f2 … f5). */
export function summaryExperimentWords(name: string, code: string | null): string {
  return code ? `${name} · ${code}` : name;
}

/** Step 3 (f4). */
export const ADD_QUESTIONS = {
  /** "From your question bank · Shell-and-Tube Heat Exchanger". */
  fromBank: 'From your question bank · ',
  listLabel: 'Questions',
  newQuestion: 'New question',
} as const;

/** "Q-0101 · Multiple choice · 2 marks" (f4). */
export function bankRowSub(id: string, type: string, marks: string): string {
  return `${id} · ${type} · ${marks}`;
}

/** Step 4 (f5). */
export const PREVIEW_STEP = {
  lead: 'What students will see before they start. Previewing creates no attempt.',
  name: 'Name',
  questions: 'Questions',
  passMark: 'Pass mark',
  attempts: 'Attempts allowed',
  deadline: 'Deadline',
  release: 'Result and answers',
} as const;

/** "Question 1 · Multiple choice · 2 marks" (drawn in capitals by `xa-q-n`). */
export function previewQuestionHead(number: number, type: string, marks: string): string {
  return `Question ${number} · ${type} · ${marks}`;
}

/** The results (f6, f7). */
export const CREATE_RESULT = {
  /** `ul.xa-check[aria-label]`. */
  checklist: 'Ready checklist',
  nameAndRules: 'Name and rules',
  atLeastOneQuestion: 'At least one question',
  open: 'Open assessment',
  another: 'Create another',
  draftLine: 'Students can’t see a draft. Finish what’s missing below.',
} as const;

/** "ASMT-0009 · Ready", "ASMT-0009 · Draft — not ready". */
export function resultNoticeTitle(id: string, readiness: string): string {
  return `${id} · ${readiness}`;
}

/** f6 "Students who have Shell-and-Tube Heat Exchanger can now see it in Assessments and start it." */
export function readyLine(experimentName: string): string {
  return `Students who have ${experimentName} can now see it in Assessments and start it.`;
}
