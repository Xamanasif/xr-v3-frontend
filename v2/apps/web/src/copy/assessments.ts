/**
 * The words of FA-06 Assessments and FA-07 Create assessment in the V3 Refined B design (the
 * owner-approved export design/v3-refined-b/roles/FA-v1, `project/Main.dc.html` "FA-06
 * Assessments", "FA-07 Create assessment" and the script's `vmAsmList`, `vmCreate`), written from
 * the facts `AssessmentService.listAssessments` and `getCreateOptions` answer (each assessment, its
 * readiness, who has submitted, its reach, what waits for marking; the experiments the Faculty
 * member teaches) and the question bank. Every phrase here is the export's own, found verbatim in
 * its markup or script (`assessments.test.ts`); what the export does not word is a provisional
 * entry of the state-copy register (`state-copy-assessments.ts`, VD-12). The export's sample names,
 * counts and dates are never copied: they come from the records. No assessment, attempt or question
 * is named by its internal reference (the owner's identifier rule, WHAT-CHANGED P10): an assessment
 * by its name (`assessmentName`), a question by its words.
 */
import { formatsHeldLabel, removeFilterLabel, waitingForMarkingWords } from './fa-shared';
import { stateWords } from './state-copy';

export { formatsHeldLabel, removeFilterLabel, waitingForMarkingWords };

/** "1 day", "7 days" (the export's `plural`). */
function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

// ---- FA-06 Assessments ---------------------------------------------------------------------------

export const ASSESSMENTS_PAGE = {
  /** `div.rk-head-text > p.rk-sub`. */
  lead: 'Assessments for the experiments you teach. Rules and pass marks belong to each assessment.',
  /** The head's primary action (with the plus) and the empty state's (without). */
  create: 'Create assessment',
  /** The surface's visually hidden heading (`h2.xr-sr`). */
  section: 'All assessments',
  /** `div.rk-tools[role=search][aria-label]`. */
  toolbarLabel: 'Filter assessments',
  searchLabel: 'Search',
  searchPlaceholder: 'Name or experiment',
  courseLabel: 'Course',
  allCourses: 'All courses',
  stateLabel: 'State',
  allStates: 'All states',
  /** The State filter's options. */
  states: { draft: 'Draft — not ready', ready: 'Ready', waiting: 'Waiting for marking' },
  clearFilters: 'Clear filters',
  /** `table > caption`. */
  caption: 'Assessments for the experiments you teach',
  columns: {
    assessment: 'Assessment',
    experiment: 'Experiment',
    deadline: 'Deadline',
    submissions: 'Submissions',
    state: 'State',
  },
  /** A deadline not set yet. */
  notSetYet: 'Not set yet',
  deadlinePassed: 'Deadline passed',
  /**
   * A co-teaching colleague's assessment (OD-B4-17). The export's "… shown to co-teachers yet" in
   * the product's words for co-teaching ("a co-teaching colleague", state copy FA-12/FA-19/FA-21):
   * B8-03 allows no role-name variant ("Teacher").
   */
  coTeacherSubmissions: 'Submissions aren’t shown to co-teaching colleagues yet',
  rulesNotFinished: 'Rules not finished',
  noQuestionsYet: 'No questions yet',
  studentsCantSee: 'students can’t see it',
  /** `div.rk-state[role=status]`. */
  noMatchTitle: 'No assessment matches these filters',
  noMatchLine: 'Try fewer filters or a different spelling of the name or experiment.',
  /** `div.rk-state.rk-state--roomy`. */
  emptyTitle: 'No assessments yet',
  emptyLine:
    'Create an assessment for an experiment you teach. You can save a draft while you add questions.',
  /** No course assigned (`section.fa-msgcard`). */
  noCourseTitle: 'No assessments yet',
  noCourseLine: 'Assessments appear here when your Institute Admin assigns you a course.',
} as const;

/** The failed state's button (state-copy `FA-06.failed`). */
export const LIST_STATES = { tryAgain: 'Try again' } as const;

export type AssessmentStateFilter = '' | keyof typeof ASSESSMENTS_PAGE.states;

/** "1 assessment"; with a search or filter, "1 of 3 assessments" (the export's `count`). */
export function assessmentCountWords(shown: number, total: number, filtered: boolean): string {
  return filtered ? `${shown} of ${plural(total, 'assessment')}` : plural(total, 'assessment');
}

/** "2 of 5 students submitted" (the export's `subs`). */
export function studentsSubmittedWords(submitted: number, reach: number): string {
  return `${submitted} of ${reach} students submitted`;
}

/** "Rules not finished · students can’t see it", "No questions yet · students can’t see it". */
export function draftSubmissionsWords(hasQuestions: boolean): string {
  return `${hasQuestions ? ASSESSMENTS_PAGE.rulesNotFinished : ASSESSMENTS_PAGE.noQuestionsYet} · ${
    ASSESSMENTS_PAGE.studentsCantSee
  }`;
}

/** "Created by Dr Anita Desai" — a co-teaching colleague's assessment. */
export function createdByWords(name: string): string {
  return `Created by ${name}`;
}

/** The row link's name: "Open Heat Exchanger — post-lab, Ready" (the export's `aria`). */
export function rowOpenLabel(assessmentName: string, state: string): string {
  return `Open ${assessmentName}, ${state}`;
}

/** The chips: "Search: “heat”", "Course: ME ZG523", "State: Ready". */
export function searchChipWords(search: string): string {
  return `Search: “${search}”`;
}
export function courseChipWords(code: string): string {
  return `Course: ${code}`;
}
export function stateChipWords(state: string): string {
  return `State: ${state}`;
}

/** "ME ZG523 · Thermodynamics & Heat Transfer" — the code Faculty see, then the course. */
export function experimentCourseLine(code: string | null, course: string | null): string | null {
  const parts = [code, course].filter((part): part is string => Boolean(part));
  return parts.length === 0 ? null : parts.join(' · ');
}

// ---- FA-07 Create assessment -------------------------------------------------------------------

export const CREATE_ASSESSMENT = {
  /** The crumb, the result's eyebrow and the shell's place words. */
  title: 'Create assessment',
  /** The crumb above (`nav.rk-crumbs`). */
  back: 'Assessments',
  /** `ol.fa-steps[aria-label]`. */
  stepsLabel: 'Steps to create an assessment',
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
  /** No course assigned (`section.fa-msgcard`). */
  noCourseTitle: 'Nothing to set an assessment on yet',
  noCourseLine:
    'Assessments are set per experiment you teach. Your Institute Admin hasn’t assigned you a course yet.',
  backToAssessments: 'Back to Assessments',
  /** `div.rk-errsum > p.rk-errsum-t`. */
  errorsTitle: 'Check this step',
} as const;

/** "Step 2 of 4" (`p.rk-eyebrow`). */
export function stepOfWords(step: number, of: number): string {
  return `Step ${step} of ${of}`;
}

/** Step 1. */
export const CHOOSE_EXPERIMENT = {
  legend: 'Experiment',
  note: 'Assessments are set per experiment, not per format. Students get the formats their institution holds.',
  noAssessment: 'No assessment yet',
  /** "Already has an assessment: Heat Exchanger — post-lab". */
  hasAssessment: 'Already has an assessment: ',
  noStudents: 'No students with access yet',
  /** The field error, the summary link and the notice's title. */
  exists: 'This experiment already has an assessment',
} as const;

/** "5 students with access" (the export's `reach`). */
export function studentsWithAccessWords(count: number): string {
  return count === 0 ? CHOOSE_EXPERIMENT.noStudents : `${plural(count, 'student')} with access`;
}

/** "Open Heat Exchanger — post-lab to change its questions or rules. One assessment …". */
export function existsLine(name: string): string {
  return `Open ${name} to change its questions or rules. One assessment per experiment is how this works for now.`;
}

/** "Open Heat Exchanger — post-lab" (the notice's action). */
export function openAssessmentWords(name: string): string {
  return `Open ${name}`;
}

/** Step 2: the sections, labels and hints of the rules form (FA-07 and FA-10). */
export const RULES_WORDS = {
  nameSection: 'Name and introduction',
  rulesSection: 'Rules',
  name: 'Assessment name',
  introduction: 'Introduction (optional)',
  introductionHint: 'What students read before they start.',
  passMark: 'Pass mark (%)',
  passMarkHint: 'A whole number from 0 to 100.',
  attempts: 'Attempts allowed',
  attemptsHint: 'A whole number, 1 or more.',
  deadline: 'Deadline',
  deadlineHint: 'For example 14 Nov 2026, 23:59',
  release: 'When students see their result and answers',
  releaseHint: 'Nothing is chosen for you. Written answers are always marked first.',
  releaseDate: 'Release date',
  releaseDateHint: 'For example 20 Nov 2026, 09:00',
  /** FA-07 step 2's foot. */
  noTimer:
    'No time limit and no timer. Every value here is set for this assessment only — nothing comes pre-filled.',
} as const;

/** Step 3. */
export const ADD_QUESTIONS = {
  title: 'From your question bank',
  /** `legend.xr-sr`. */
  listLabel: 'Questions for this assessment',
  noneChosen: 'No questions chosen yet',
  noBank:
    'Your question bank has no questions for this experiment yet. Write one, draft some with assistance, or import a file.',
  /** The notice after "New question" comes back with the question written. */
  savedTitle: 'Saved to your question bank.',
  savedLine: 'It’s ticked below. You can untick it.',
  otherWays: 'Other ways to add questions',
  newQuestion: 'New question',
  marksNote:
    'Questions keep the marks set in your bank. Choice questions are marked automatically; you mark written answers.',
} as const;

/** "Shell-and-Tube Heat Exchanger · ME ZG523" (the export's `expT`). */
export function experimentAndCode(name: string, code: string | null): string {
  return code ? `${name} · ${code}` : name;
}

/** Step 4. */
export const PREVIEW_STEP = {
  lead: 'What students will see before they start. Previewing creates no attempt.',
  name: 'Name',
  questions: 'Questions',
  passMark: 'Pass mark',
  attempts: 'Attempts allowed',
  deadline: 'Deadline',
  release: 'Result and answers',
  timeLimit: 'Time limit',
  none: 'None',
  introduction: 'Introduction',
  listTitle: 'Questions',
} as const;

/** "50% · 8 of 16 marks" (the export's `passText`, from the service's own pass mark marks). */
export function passMarkWithMarks(percent: number, marks: number | null, total: number): string {
  return marks === null || total === 0 ? `${percent}%` : `${percent}% · ${marks} of ${total} marks`;
}

/** The side panel. */
export const THIS_ASSESSMENT = {
  title: 'This assessment',
  /** Step 4's title. */
  whenCreated: 'When you create it',
  experiment: 'Experiment',
  name: 'Name',
  rules: 'Rules',
  questions: 'Questions',
  done: ' (done)',
  notDone: ' (not done yet)',
  notChosen: 'Not chosen yet',
  notNamed: 'Not named yet',
  notSet: 'Not set yet',
  noQuestions: 'None yet',
  /** `ul.fa-sidecheck[aria-label]`. */
  createLabel: 'What creating does',
  markedAutomatically: 'Choice questions are marked automatically; you mark written answers.',
  changeLater:
    'You can change it later from its tabs. A change after students submit makes a new version.',
  note: 'Nothing is saved until you create it or save a draft.',
} as const;

/** "Students who have Shell-and-Tube Heat Exchanger can see it in Assessments and start it." */
export function createSeesWords(experiment: string): string {
  return `Students who have ${experiment} can see it in Assessments and start it.`;
}

/** The rules as typed, in one line: "Pass mark 50% · 2 attempts · due 14 Nov 2026, 23:59 · …". */
export function typedRulesLine(parts: {
  readonly passMark: string | null;
  readonly attempts: number | null;
  readonly deadline: string | null;
  readonly release: string | null;
}): string | null {
  const bits = [
    parts.passMark === null ? null : `Pass mark ${parts.passMark}%`,
    parts.attempts === null ? null : plural(parts.attempts, 'attempt'),
    parts.deadline === null ? null : `due ${parts.deadline}`,
    parts.release === null ? null : `results ${parts.release}`,
  ].filter((bit): bit is string => bit !== null);
  return bits.length === 0 ? null : bits.join(' · ');
}

/** The release in the rules line: "immediately after marking", "after the deadline", "on <date>". */
export function typedReleaseWords(
  option: 'immediately-after-marking' | 'after-deadline' | 'on-date',
  date: string | null,
): string {
  if (option === 'on-date') return `on ${date ?? 'a date'}`;
  return option === 'after-deadline' ? 'after the deadline' : 'immediately after marking';
}

/** The result (step 4's Create or any step's Save as draft). */
export const CREATE_RESULT = {
  /** `ul.fa-check[aria-label]`. */
  checklist: 'Ready checklist',
  nameCheck: 'Name and introduction',
  rulesSet: 'Rules set for this assessment',
  rulesNotFinished: 'Rules — not finished',
  noQuestion: 'At least one question — none yet',
  draftLine: 'Students can’t see a draft. Finish what’s missing on the assessment.',
  open: 'Open assessment',
  backToAssessments: 'Back to Assessments',
  /** The product's own way to start again (state-copy `FA-07.result`). */
  another: 'Create another',
} as const;

/** "Students who have Shell-and-Tube Heat Exchanger can now see it in Assessments and start it." */
export function readyLine(experimentName: string): string {
  return `Students who have ${experimentName} can now see it in Assessments and start it.`;
}

/** The "kept" note's words when a step cannot be sent (state copy). */
export function createUnavailableWords(mode: 'create' | 'save-as-draft'): string {
  return mode === 'create'
    ? stateWords('FA-07.create-unavailable')
    : stateWords('FA-07.draft-unavailable');
}
