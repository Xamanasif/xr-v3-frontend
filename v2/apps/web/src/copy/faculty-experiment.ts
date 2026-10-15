/**
 * The words of FA-05 Experiment, the teaching view (board B4-03 f0 … f4), written from the facts
 * `TeachingService.getTeachingExperiment` answers (the published page, the formats the
 * institution's plans give it, the formats its Students have opened, per format how many of the
 * Students it reaches completed, are in progress or have not started) and the institution's
 * assessment (`AssessmentService.getAssessment`, `listAssessments`). Every phrase here is the
 * frozen board's own, found verbatim in its markup (`experiment.test.tsx`); what B4-03 does not
 * word is a provisional entry of the state-copy register (`state-copy-faculty-experiment.ts`,
 * VD-12) and is read from there. The board's sample counts, names and dates are never copied: they
 * come from the records.
 */
import type { AssessmentRules } from '@xr/domain';

import { stateWords } from './state-copy';

export const EXPERIMENT_PAGE = {
  /** `a.xr-back` (B4-03 f0): back to My courses. */
  back: 'My courses',
  /** The two labelled facts under the H1 (`div.xw-statusline > span.xl-inline`). */
  formatsHas: 'Formats your institution has',
  formatsUsed: 'Formats used by your students',
  /** B4-03 f3: "Formats used by your students · None yet". */
  noneYet: 'None yet',
} as const;

/** The three sections' H2s, in the drawn order. */
export const EXPERIMENT_SECTIONS = {
  assessment: 'Assessment',
  activity: 'Student activity',
  about: 'About this experiment',
} as const;

/** B4-03 f1 / f3: the Assessment section with no assessment yet. */
export const NO_ASSESSMENT = {
  title: 'No assessment for this experiment yet',
  line: 'Create one: choose the rules, add questions from your bank, preview it as a student.',
  action: 'Create assessment',
} as const;

/** The assessment row's one action: f0 "Open assessment" (Ready), f2 "Continue setting up" (draft). */
export const ASSESSMENT_ROW = {
  open: 'Open assessment',
  continue: 'Continue setting up',
} as const;

/** B4-03 f0: the Student activity section. */
export const ACTIVITY = {
  /** `ul.xa-counts[aria-label]`. */
  countsLabel: 'Student activity by format',
  completed: 'completed',
  inProgress: 'in progress',
  notStarted: 'not started',
  /** "5 students have this experiment from your institution." — after the strong count. */
  have: 'have this experiment from your institution.',
  /** B4-03 f3: "5 students have this experiment. None has opened it yet." */
  noneOpened: 'have this experiment. None has opened it yet.',
} as const;

/** B4-03 f0: About this experiment. */
export const ABOUT = {
  outcomes: 'Learning outcomes',
  outcomesNote:
    'One set of outcomes for the experiment, written by the Academic Reviewer. Read-only here.',
  resources: 'Resources students see',
} as const;

/** "ME ZG523 · Thermodynamics & Heat Transfer" (the overline is drawn in capitals by CSS). */
export function experimentOverline(code: string | null, courseName: string): string {
  return code ? `${code} · ${courseName}` : courseName;
}

/** The count before the sentence: "5 students"; "1 student" (state-copy `FA-05.students-one`). */
export function studentsWords(count: number): string {
  return count === 1 ? '1 student' : `${count} students`;
}

/**
 * f0: "**5 students** have this experiment from your institution." The singular is provisional
 * (`FA-05.students-one`): "**1 student** has this experiment from your institution."
 */
export function studentsHaveLine(count: number): {
  readonly strong: string;
  readonly rest: string;
} {
  return {
    strong: studentsWords(count),
    rest: count === 1 ? 'has this experiment from your institution.' : ACTIVITY.have,
  };
}

/**
 * f3 "No activity yet": "5 students have this experiment. None has opened it yet." One student
 * (`FA-05.no-activity-one`) and none (`FA-05.no-students`) are provisional.
 */
export function noActivityLine(count: number): string {
  if (count === 0) return stateWords('FA-05.no-students');
  if (count === 1) return stateWords('FA-05.no-activity-one');
  return `${studentsWords(count)} ${ACTIVITY.noneOpened}`;
}

/** "WEB · 2 completed": the per-format counts' words after each `span.xl-num`. */
export const COUNT_WORDS = [
  ['completed', ACTIVITY.completed],
  ['inProgress', ACTIVITY.inProgress],
  ['notStarted', ACTIVITY.notStarted],
] as const;

/**
 * f0 / f4 the Ready row's line: "Due 14 Nov 2026, 23:59 · 1 of 5 submitted · 1 waiting for
 * marking". The waiting figure is left out at 0 and the submissions without the list row
 * (state-copy `FA-05.ready-line`).
 */
export function readyLine(input: {
  readonly deadline: string | null;
  readonly counts: {
    readonly submitted: number;
    readonly reach: number;
    readonly waiting: number;
  } | null;
}): string {
  const { counts } = input;
  return [
    input.deadline === null ? null : `Due ${input.deadline}`,
    counts ? `${counts.submitted} of ${counts.reach} submitted` : null,
    counts && counts.waiting > 0 ? `${counts.waiting} waiting for marking` : null,
  ]
    .filter((part): part is string => part !== null)
    .join(' · ');
}

/** Every rule a Ready assessment needs is set (the release date too when "On a date"). */
function everyRuleSet(rules: AssessmentRules): boolean {
  return (
    rules.passMarkPercent !== null &&
    rules.attemptsAllowed !== null &&
    rules.deadline !== null &&
    rules.release !== null &&
    (rules.release.option !== 'on-date' || rules.release.releaseDate !== null)
  );
}

function noRuleSet(rules: AssessmentRules): boolean {
  return (
    rules.passMarkPercent === null &&
    rules.attemptsAllowed === null &&
    rules.deadline === null &&
    rules.release === null
  );
}

/**
 * f2 the draft row's line: "Rules set · no questions yet. Students can’t see it." The other drafts
 * (rules not or partly set, questions added) are provisional (`FA-05.draft-line`).
 */
export function draftLine(rules: AssessmentRules, questions: number): string {
  const rulesPart = everyRuleSet(rules)
    ? 'Rules set'
    : noRuleSet(rules)
      ? stateWords('FA-05.draft-rules-none')
      : stateWords('FA-05.draft-rules-some');
  const questionsPart =
    questions === 0
      ? 'no questions yet'
      : `${questions} ${questions === 1 ? 'question' : 'questions'}`;
  return `${rulesPart} · ${questionsPart}. Students can’t see it.`;
}

/** B4-03 f0 Student activity's meta: "as of 7 Nov 2026" (the read's own instant, PC-52). */
export function asOfWords(date: string): string {
  return `as of ${date}`;
}
