/**
 * The words of the Student's assessment list — ST-11 Assessments (B4-11 f0 … f6), the experiment
 * hub's Assessment tab (f7 … f9) and Home's "Up next" assessment row (f10). Every string here is
 * the board's own (`student-assessments.test.ts` finds each on B4-11); what B4-11 does not word is
 * a provisional entry of the state-copy register (`state-copy-student-assessments.ts`, VD-12) and is
 * read from there. Names, dates and codes are the sample world's, never typed here.
 */
import type { PinnedRelease } from '@xr/contracts/draft';

import { questionsAndMarks } from './assessment-words';
import { dateTime, dayMonthYear } from './dates';
import { stateWords } from './state-copy';
import { stDateTime } from './st-shared';

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

/** f1: "Answers saved · due 14 Nov 2026, 23:59" (no deadline: "Answers saved"). */
export function answersSavedLine(deadline: string | null): string {
  return deadline === null ? 'Answers saved' : `Answers saved · due ${stDateTime(deadline)}`;
}

/**
 * f2: "Submitted 5 Nov 2026, 18:52 · your faculty marks written answers"; an attempt with no
 * written question: "… · your faculty confirms the automatic marks" (state-copy
 * `ST-11.choice-only`; owner decision of 24 Oct 2026).
 */
export function submittedLine(submittedAt: string | null, hasWritten = true): string {
  if (!hasWritten) {
    const words = stateWords('ST-11.choice-only');
    return submittedAt === null
      ? words
      : `Submitted ${stDateTime(submittedAt)} · ${words.charAt(0).toLowerCase()}${words.slice(1)}`;
  }
  return submittedAt === null
    ? 'Your faculty marks written answers'
    : `Submitted ${stDateTime(submittedAt)} · your faculty marks written answers`;
}

/**
 * f3: "Released after the deadline: 14 Nov 2026, 23:59" — the attempt's own pinned release terms;
 * "on a date" and "immediately after marking" are the register's (`ST-11.release-on-date`,
 * `ST-11.release-immediately`).
 */
export function releaseTermsLine(release: ReleaseTerms): string {
  if (release.option === 'after-deadline' && release.on)
    return `Released after the deadline: ${stDateTime(release.on)}`;
  if (release.option === 'on-date' && release.on)
    return stateWords('ST-11.release-on-date').replace('{on}', stDateTime(release.on));
  return stateWords('ST-11.release-immediately');
}

/** f4: "Released 14 Nov 2026, 23:59". */
export function releasedLine(releasedAt: string): string {
  return `Released ${stDateTime(releasedAt)}`;
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
    deadline === null ? null : `Due ${stDateTime(deadline)}`,
    questionCountWords(questionCount),
    plural(totalMarks, 'mark'),
    'no time limit',
  ]
    .filter((part): part is string => part !== null)
    .join(' · ');
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
    : `${experimentName} · assessment · due ${stDateTime(deadline)}`;
}

/** f10: `a.xr-btn--secondary.xr-btn--sm`. */
export const UP_NEXT_OPEN_ASSESSMENT = 'Open assessment';

// ---- V3 (the owner-approved Student export ST-v1, `StudentFinal.dc.html`) -------------------------
// ST-11 Assessments (`alistVM`), the hub's Assessment tab (`asmtTabVM`) and the date block they and
// ST-12 lead with (`whenOf`). Each string is the export's own (`student-assessments.test.ts` finds
// it there); what the export does not word is the register's (`state-copy-student-assessments.ts`).

/** ST-11's fixed words (`is.alist`). */
export const ST_ASSESSMENTS_V3 = {
  /** `nav.rk-tabs.sv-tabs aria-label`. */
  tabsLabel: 'Assessments',
  /** `p.rk-loading-msg`. */
  loading: 'Loading your assessments…',
  /** `div.sv-pstate h3.sv-msg-t`. */
  failedTitle: 'We couldn’t load your assessments',
  /** The empty state (`AL.noneD`) when the Student has no experiment yet. */
  noneLineNoExperiment:
    'When your institution gives you an experiment and your faculty sets an assessment for it, it appears here.',
  /** `ul.sv-facts aria-label`. */
  experimentsLabel: 'Your experiments',
  /** Each experiment's fact in the empty state (`AL.exps[].s`). */
  noAssessmentSet: 'No assessment set yet',
} as const;

/** A row's or the tab's action with the assessment's name: "Open, Heat Exchanger — post-lab". */
export function assessmentActionName(action: string, assessmentName: string): string {
  return `${action}, ${assessmentName}`;
}

/** Where the Student's assessment is when this tab has none (`AL.emptyD`). */
export function elsewhereWords(tabs: readonly string[], rows: number): string {
  if (rows === 1 && tabs.length === 1) return `Your assessment is under ${tabs[0]}.`;
  const named =
    tabs.length === 1 ? tabs[0]! : `${tabs.slice(0, -1).join(', ')} and ${tabs[tabs.length - 1]}`;
  return stateWords('ST-11.elsewhere').replace('{tabs}', named);
}

/** The date block's kicker (`r.whenK`, `AT1.whenK`, ST-12 "Deadline"). */
export const WHEN_KICKERS = {
  due: 'Due',
  resultAfter: 'Result after',
  released: 'Released',
  deadline: 'Deadline',
} as const;

const DAY_MS = 86_400_000;

/** The calendar day of an instant in Indian time, as a day number (`dayNum`). */
function dayNumber(instant: string): number {
  const ist = new Date(new Date(instant).getTime() + 330 * 60_000);
  return Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) / DAY_MS;
}

/** "today", "tomorrow", "in 13 days", "yesterday", "2 days ago" (`whenOf`'s `rel`). */
function relativeDay(diff: number): string {
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff > 1) return `in ${diff} days`;
  if (diff === -1) return 'yesterday';
  return `${-diff} days ago`;
}

/**
 * A date block (`whenOf`): "14 Nov" over "23:59 · in 13 days", counted from the session's today;
 * `soon` (the ivory block) when it is due within two days. `soon` is for deadlines only: a release
 * or a result date is never drawn ivory.
 */
export function whenWords(
  instant: string,
  today: string | null,
  deadline = true,
): { readonly day: string; readonly time: string; readonly soon: boolean } {
  const time = dateTime(instant).split(', ')[1] ?? '';
  const day = dayMonthYear(instant).split(' ').slice(0, 2).join(' ');
  if (today === null) return { day, time, soon: false };
  const diff = dayNumber(instant) - dayNumber(today);
  return {
    day,
    time: [time, relativeDay(diff)].filter((part) => part !== '').join(' · '),
    soon: deadline && diff >= 0 && diff <= 2,
  };
}

/** ST-11's row line under the status (`alistVM` `sub`), by the row's state. */
export const ST_ROW_LINES = {
  /** "4 questions · 16 marks · no time limit". */
  toDo: (questionCount: number, totalMarks: number) =>
    `${questionsAndMarks(questionCount, totalMarks)} · no time limit`,
  inProgress: 'Your answers are saved · no time limit',
  /** "Submitted 5 Nov 2026, 18:52 · your faculty marks written answers" (`ST-11.choice-only`). */
  waiting: (submittedAt: string | null, hasWritten = true) =>
    submittedLine(submittedAt, hasWritten),
  released: 'Your result and answers are ready',
} as const;

/**
 * "Marked · released after the deadline" (`alistVM` / `asmtTabVM` for a result marked but not
 * released): the attempt's own release terms; a date is the register's (`ST-11.marked-on-date`).
 */
export function markedReleaseLine(release: ReleaseTerms): string {
  if (release.option === 'on-date' && release.on)
    return stateWords('ST-11.marked-on-date').replace('{on}', stDateTime(release.on));
  if (release.option === 'immediately-after-marking') return stateWords('ST-11.marked-when-marked');
  return 'Marked · released after the deadline';
}

/** The hub's Assessment tab (`asmtTabVM`). */
export const ST_HUB_ASSESSMENT_V3 = {
  /** `p.sv-eyebrow` over the name. */
  kicker: 'Assessment',
  /** In progress: the words after the status. */
  inProgress: 'Your answers are saved',
} as const;

/** "4 questions · 16 marks · pass mark 50% · 2 attempts · no time limit" (`AT1.facts`). */
export function hubFactsLine(facts: {
  readonly questionCount: number;
  readonly totalMarks: number;
  readonly passMarkPercent: number | null;
  readonly attemptsAllowed: number | null;
}): string {
  return [
    questionsAndMarks(facts.questionCount, facts.totalMarks),
    facts.passMarkPercent === null ? null : `pass mark ${facts.passMarkPercent}%`,
    facts.attemptsAllowed === null ? null : plural(facts.attemptsAllowed, 'attempt'),
    'no time limit',
  ]
    .filter((part): part is string => part !== null)
    .join(' · ');
}
