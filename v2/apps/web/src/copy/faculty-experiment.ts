/**
 * The words of FA-05 Experiment, the teaching view, as the owner-approved V3 export draws it
 * (design/v3-refined-b/roles/FA-v1 `project/Main.dc.html`: the FA-05 template, the script's
 * `vmExperiment` and `asmSum`), and the assessment summary FA-03 Course draws with the same words.
 * Written from the facts `TeachingService.getTeachingExperiment` (the published page, the formats
 * the institution's plans give it, the formats its Students opened, per format how many of the
 * Students it reaches completed, are in progress or have not started) and
 * `AssessmentService.listAssessments` answer. Every phrase is the export's own, in its template or
 * composed as its script composes it (`experiment.test.tsx`); what it does not word is a
 * provisional entry of the state-copy register (`state-copy-faculty-experiment.ts`). The export's
 * sample counts, names and dates are never copied: they come from the records. No line names an
 * internal reference.
 */
import { READINESS_WORDS } from './assessment-words';
import { FA_ASSESSMENT_STATE_WORDS, writtenAnswersWaitingWords } from './fa-shared';
import { counted } from './faculty-overview';

export const EXPERIMENT_PAGE = {
  /** The breadcrumb's first level (`nav.rk-crumbs`). */
  myCourses: 'My courses',
  /** The identity band's figures (`dl.fa-figs`). */
  formatsHas: 'Formats your institution has',
  formatsUsed: 'Formats your students have used',
  studentsWithAccess: 'Students with access',
  /** A figure with nothing in it yet. */
  noneYet: 'None yet',
} as const;

/** The sections' and the panel's headings, in the drawn order. */
export const EXPERIMENT_SECTIONS = {
  activity: 'Student activity, by format',
  about: 'About this experiment',
  assessment: 'Assessment',
} as const;

/** "Experiment you teach · Thermodynamics & Heat Transfer" (`p.rk-eyebrow`, after the code). */
export function experimentKicker(courseName: string): string {
  return `Experiment you teach · ${courseName}`;
}

/** "Formats used by your students: WEB, VR" (the badges' name). */
export function formatsUsedLabel(codes: readonly string[]): string {
  return `Formats used by your students: ${codes.length > 0 ? codes.join(', ') : 'none yet'}`;
}

export const ACTIVITY = {
  /** Under the meters: who can open it, and the way to them (FA-20). */
  studentsLink: 'Students on this experiment',
  /** No Student has been given the experiment yet. */
  noStudents:
    'No students have this experiment yet. They appear when your Institute Admin gives them access.',
} as const;

/** "5 students have this experiment from your institution." / "1 student has …". */
export function studentsHaveLine(count: number): string {
  return `${counted(count, 'student has', 'students have')} this experiment from your institution.`;
}

export const ABOUT = {
  outcomes: 'Learning outcomes',
  outcomesNote:
    'One set of outcomes for the experiment, written by the Academic Reviewer. Read-only here.',
  resources: 'Resources students see',
} as const;

// ---- The assessment summary (FA-05 panel, FA-03 experiment panels) -------------------------------

export const ASSESSMENT_SUMMARY = {
  ready: READINESS_WORDS.ready.label,
  draft: READINESS_WORDS['draft-not-ready'].label,
  none: FA_ASSESSMENT_STATE_WORDS.none,
  noDeadline: 'No deadline set yet',
  open: 'Open assessment',
  continue: 'Continue setting up',
  create: 'Create assessment',
} as const;

/** FA-05 with no assessment yet: the panel's title, line and its one primary. */
export const NO_ASSESSMENT = {
  title: 'No assessment for this experiment yet',
  line: 'Create one: choose the rules, add questions from your bank, and preview it as a student. Assessments are set per experiment, not per format.',
  /** FA-03's line in the experiment's Assessment column. */
  courseLine:
    'No assessment for this experiment yet. Assessments are set per experiment, not per format.',
} as const;

/** "Deadline passed: 14 Nov 2026, 23:59". */
export function deadlinePassedWords(deadline: string): string {
  return `Deadline passed: ${deadline}`;
}

/** "2 written answers waiting for marking" (`writtenAnswersWaitingWords`). */
export const writtenWaitingWords = writtenAnswersWaitingWords;

/** "Mark 2 written answers" (the primary that opens the oldest waiting submission). */
export function markWrittenWords(count: number): string {
  return `Mark ${counted(count, 'written answer')}`;
}

/** "Mark 2 written answers for Heat Exchanger — post-lab" (its accessible name). */
export function markWrittenLabel(count: number, assessment: string): string {
  return `${markWrittenWords(count)} for ${assessment}`;
}

/**
 * The quiet note of an assessment: a colleague's ("Created by Dr S. Ranganathan."), a draft with
 * questions ("Rules not finished · students can’t see it yet.") or without ("No questions yet ·
 * students can’t see it yet."); none for the Faculty member's own Ready assessment.
 */
export function assessmentNoteWords(input: {
  readonly colleague: string | null;
  readonly ready: boolean;
  readonly questions: number;
}): string | null {
  if (input.colleague !== null) return `Created by ${input.colleague}.`;
  if (input.ready) return null;
  return `${input.questions > 0 ? 'Rules not finished' : 'No questions yet'} · students can’t see it yet.`;
}
