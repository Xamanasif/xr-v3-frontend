/**
 * The words of the Student's assessment list — ST-11 Assessments (B4-11 f0 … f6), the experiment
 * hub's Assessment tab (f7 … f9) and Home's "Up next" assessment row (f10). Every string here is
 * the board's own (`student-assessments.test.ts` finds each on B4-11); what B4-11 does not word is
 * a provisional entry of the state-copy register (`state-copy-student-assessments.ts`, VD-12) and is
 * read from there. Names, dates and codes are the sample world's, never typed here.
 */
import type { PinnedRelease } from '@xr/contracts/draft';

import { dateTime } from './dates';
import { stateWords } from './state-copy';

/** The release terms an attempt pins (`PinnedRelease`; `on` an instant, or none). */
type ReleaseTerms = { readonly option: PinnedRelease['option']; readonly on: string | null };

function plural(count: number, word: string): string {
  return count === 1 ? `1 ${word}` : `${count} ${word}s`;
}

// ---- ST-11 Assessments (B4-11 f0 … f6) ----------------------------------------------------------

export const STUDENT_ASSESSMENTS_PAGE = {
  /** `div.xr-phead-meta span.xl-meta` (f0). */
  meta: 'Assessments for the experiments you have',
  /** `section.xr-section h2.xr-h2` (f0). */
  section: 'Your assessments',
  /** `div.xr-seg[role=group]` aria-label (f0). */
  tabsLabel: 'Show',
  /** f5: `div.xr-empty`. */
  noneTitle: 'No assessments yet',
  noneLine: 'When your faculty sets an assessment for an experiment you have, it appears here.',
} as const;

/** The state tabs' words (f0: "To do (1) · Submitted (0) · Results (0)"). */
export const STUDENT_ASSESSMENT_TAB_WORDS = {
  'to-do': 'To do',
  submitted: 'Submitted',
  results: 'Results',
} as const;

export function assessmentTabWords(tab: keyof typeof STUDENT_ASSESSMENT_TAB_WORDS, count: number) {
  return `${STUDENT_ASSESSMENT_TAB_WORDS[tab]} (${count})`;
}

/** A tab with no row (the board's `emptyText`: `div.xr-section-body p.xr-body`). */
export const STUDENT_ASSESSMENT_TAB_EMPTY = {
  'to-do': 'Nothing to do right now.',
  submitted: 'Nothing submitted and waiting.',
  results: 'No results released yet.',
} as const;

/** A row's action (f0 … f4: `a.xr-btn--secondary.xr-btn--sm`). */
export const STUDENT_ASSESSMENT_ACTIONS = {
  open: 'Open',
  continueAttempt: 'Continue attempt',
  view: 'View',
  seeResult: 'See result',
} as const;

/** The row action's accessible name (the board's `aria-label="{act} {name}"`). */
export function assessmentActionLabel(action: string, assessmentName: string): string {
  return `${action} ${assessmentName}`;
}

/** "Shell-and-Tube Heat Exchanger · ME ZG523" (f0); without a code, the experiment alone. */
export function assessmentExperimentLine(experimentName: string, courseCode: string | null) {
  return courseCode ? `${experimentName} · ${courseCode}` : experimentName;
}

/** "4 questions" (f0); one question reads "1 question" (`ST-11.lines`). */
export function questionCountWords(count: number): string {
  return plural(count, 'question');
}

/** f0: "Due 14 Nov 2026, 23:59 · 4 questions · no time limit" (no deadline: `ST-11.lines`). */
export function dueLine(deadline: string | null, questionCount: number): string {
  return [
    deadline === null ? null : `Due ${dateTime(deadline)}`,
    questionCountWords(questionCount),
    'no time limit',
  ]
    .filter((part): part is string => part !== null)
    .join(' · ');
}

/** f1: "Answers saved · due 14 Nov 2026, 23:59" (no deadline: "Answers saved"). */
export function answersSavedLine(deadline: string | null): string {
  return deadline === null ? 'Answers saved' : `Answers saved · due ${dateTime(deadline)}`;
}

/** f2: "Submitted 5 Nov 2026, 18:52 · your faculty marks written answers". */
export function submittedLine(submittedAt: string | null): string {
  return submittedAt === null
    ? 'Your faculty marks written answers'
    : `Submitted ${dateTime(submittedAt)} · your faculty marks written answers`;
}

/**
 * f3: "Released after the deadline: 14 Nov 2026, 23:59" — the attempt's own pinned release terms;
 * "on a date" and "immediately after marking" are the register's (`ST-11.release-on-date`,
 * `ST-11.release-immediately`).
 */
export function releaseTermsLine(release: ReleaseTerms): string {
  if (release.option === 'after-deadline' && release.on)
    return `Released after the deadline: ${dateTime(release.on)}`;
  if (release.option === 'on-date' && release.on)
    return stateWords('ST-11.release-on-date').replace('{on}', dateTime(release.on));
  return stateWords('ST-11.release-immediately');
}

/** f4: "Released 14 Nov 2026, 23:59". */
export function releasedLine(releasedAt: string): string {
  return `Released ${dateTime(releasedAt)}`;
}

// ---- the hub's Assessment tab (B4-11 f7 … f9) ---------------------------------------------------

export const HUB_ASSESSMENT_TAB = {
  /** `section.xr-section h2.xr-h2` (f7, f9). */
  heading: 'Assessment',
  /** f7: `a.xr-btn--primary`. */
  open: 'Open assessment',
  /** f8: `div.xr-empty` — the B3-01 Progress tab's words, as a heading. */
  noneTitle: 'Your faculty hasn’t set an assessment for this experiment yet',
  noneLine: 'When they do, it appears here and in Assessments.',
} as const;

/** f7: "Due 14 Nov 2026, 23:59 · 4 questions · 16 marks · no time limit". */
export function hubDueLine(deadline: string | null, questionCount: number, totalMarks: number) {
  return [
    deadline === null ? null : `Due ${dateTime(deadline)}`,
    questionCountWords(questionCount),
    plural(totalMarks, 'mark'),
    'no time limit',
  ]
    .filter((part): part is string => part !== null)
    .join(' · ');
}

/**
 * f9: "Submitted 5 Nov 2026, 18:52 · your result appears after the deadline" — the attempt's own
 * release terms; the other two options are the register's (`ST-05.assessment-tab.appears-*`).
 */
export function hubSubmittedLine(submittedAt: string | null, release: ReleaseTerms): string {
  const appears =
    release.option === 'after-deadline'
      ? 'your result appears after the deadline'
      : release.option === 'on-date' && release.on
        ? stateWords('ST-05.assessment-tab.appears-on-date').replace('{on}', dateTime(release.on))
        : stateWords('ST-05.assessment-tab.appears-immediately');
  return submittedAt === null ? appears : `Submitted ${dateTime(submittedAt)} · ${appears}`;
}

// ---- Home's "Up next" (B4-11 f10) ---------------------------------------------------------------

/** f10: "Heat Exchanger — post-lab is ready". */
export function upNextAssessmentTitle(assessmentName: string): string {
  return `${assessmentName} is ready`;
}

/** f10: "Shell-and-Tube Heat Exchanger · assessment · due 14 Nov 2026, 23:59". */
export function upNextAssessmentSub(experimentName: string, deadline: string | null): string {
  return deadline === null
    ? `${experimentName} · assessment`
    : `${experimentName} · assessment · due ${dateTime(deadline)}`;
}

/** f10: `a.xr-btn--secondary.xr-btn--sm`. */
export const UP_NEXT_OPEN_ASSESSMENT = 'Open assessment';
