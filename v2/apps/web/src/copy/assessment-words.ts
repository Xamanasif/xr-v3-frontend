/**
 * The Faculty assessment words the Phase-4A screens share (boards B4-04 … B4-07), so one value
 * reads the same on every page: question types, readiness, the result-release options, marks,
 * question counts, the rules summaries and the typed date-and-time of the rules form. Words the
 * boards draw are quoted; the undrawn variants (singulars, an "On a date" summary, a rule not set
 * yet) are state-copy entries (`state-copy-faculty-shared.ts`).
 */
import type { AssessmentReadiness, AssessmentRules, QuestionType, ReleaseOption } from '@xr/domain';

import { calendarDay, dateTime } from './dates';

/** B4-07 f0 "Type" column and filter; B4-05 f6 rows ("Multiple choice", "True or false", "Written answer"). */
export const QUESTION_TYPE_WORDS: Readonly<Record<QuestionType, string>> = {
  'multiple-choice': 'Multiple choice',
  'true-false': 'True or false',
  written: 'Written answer',
};

/** The three types in the boards' order (B4-07 f3 "Three types only."). */
export const QUESTION_TYPES: readonly QuestionType[] = ['multiple-choice', 'true-false', 'written'];

/** B4-04 f0 / f10, B4-05 f0 / f3: "Ready" (ok) and "Draft — not ready" (wait). */
export const READINESS_WORDS: Readonly<
  Record<AssessmentReadiness, { readonly label: string; readonly tone: 'ok' | 'wait' }>
> = {
  ready: { label: 'Ready', tone: 'ok' },
  'draft-not-ready': { label: 'Draft — not ready', tone: 'wait' },
};

/** B4-04 f2 / B4-06 f0 "When students see their result and answers" — nothing pre-selected (T-19). */
export const RELEASE_OPTIONS: readonly {
  readonly option: ReleaseOption;
  readonly title: string;
  readonly sub: string;
  /** B4-04 f4 summary "results: after the deadline"; B4-05 f0 "Result and answers · After the deadline". */
  readonly summary: string;
}[] = [
  {
    option: 'immediately-after-marking',
    title: 'Immediately after marking',
    sub: 'Each student sees their result once their answers are marked.',
    summary: 'immediately after marking',
  },
  {
    option: 'after-deadline',
    title: 'After the deadline',
    sub: 'Everyone sees their result when the deadline passes.',
    summary: 'after the deadline',
  },
  {
    option: 'on-date',
    title: 'On a date',
    sub: 'Everyone sees their result on the date you choose.',
    summary: 'on a date',
  },
];

export const RULES_FORM = {
  name: 'Assessment name',
  introduction: 'Introduction',
  optional: '(optional)',
  introductionHint: 'What students read before they start.',
  passMark: 'Pass mark (%)',
  passMarkHint: 'Share of the total marks needed to pass, 0–100.',
  attempts: 'Attempts allowed',
  attemptsHint: 'A whole number, 1 or more.',
  deadline: 'Deadline',
  deadlineHint: 'Date and time, for example 14 Nov 2026, 23:59',
  release: 'When students see their result and answers',
  releaseHint: 'Nothing is chosen for you. Written answers are always marked first.',
  releaseDate: 'Release date',
  releaseDateHint: 'Date and time, for example 20 Nov 2026, 09:00',
  /** B4-04 f2 (create). */
  noTimerCreate:
    'No time limit and no timer. Every value here is set for this assessment only — nothing comes pre-filled.',
  /** B4-06 f0 (settings). */
  noTimerSettings: 'No time limit. Each value belongs to this assessment only.',
} as const;

/** "2 marks" (B4-05 f6); "1 mark" (state-copy `FA-shared.marks-one`). */
export function marksWords(marks: number): string {
  return `${marks} ${marks === 1 ? 'mark' : 'marks'}`;
}

/** "4 questions · 16 marks", "0 questions · 0 marks" (B4-05 f1); "1 question" (`FA-shared.questions-one`). */
export function questionsAndMarks(questions: number, marks: number): string {
  return `${questions} ${questions === 1 ? 'question' : 'questions'} · ${marksWords(marks)}`;
}

/** "14 Nov 2026, 23:59" (B4-04, B4-05: deadlines in Indian time, as every board date). */
export function deadlineWords(instant: string): string {
  return dateTime(instant);
}

/** "after the deadline", "on 20 Nov 2026, 09:00" — the rules summary's release words. */
export function releaseSummary(release: AssessmentRules['release']): string | null {
  if (!release) return null;
  if (release.option === 'on-date' && release.releaseDate)
    return `on ${dateTime(release.releaseDate)}`;
  return RELEASE_OPTIONS.find((entry) => entry.option === release.option)!.summary;
}

/**
 * B4-04 f4 "This assessment · Rules": "Pass mark 50% · 2 attempts · due 14 Nov 2026, 23:59 ·
 * results: after the deadline"; `null` while no rule is set ("Not set yet", f1). A rule that is
 * not set is left out (`FA-shared.rules-partial`).
 */
export function rulesSummaryLine(rules: AssessmentRules): string | null {
  const parts = [
    rules.passMarkPercent === null ? null : `Pass mark ${rules.passMarkPercent}%`,
    rules.attemptsAllowed === null
      ? null
      : `${rules.attemptsAllowed} ${rules.attemptsAllowed === 1 ? 'attempt' : 'attempts'}`,
    rules.deadline === null ? null : `due ${deadlineWords(rules.deadline)}`,
    releaseSummary(rules.release) === null ? null : `results: ${releaseSummary(rules.release)}`,
  ].filter((part): part is string => part !== null);
  return parts.length === 0 ? null : parts.join(' · ');
}

/**
 * B4-05 f0 "Ready to use" checklist: "Rules: pass mark 50%, 2 attempts, due 14 Nov 2026, 23:59,
 * results after the deadline"; `null` while a rule is missing.
 */
export function rulesChecklistLine(rules: AssessmentRules): string | null {
  const release = releaseSummary(rules.release);
  if (
    rules.passMarkPercent === null ||
    rules.attemptsAllowed === null ||
    rules.deadline === null ||
    release === null
  )
    return null;
  return `Rules: pass mark ${rules.passMarkPercent}%, ${rules.attemptsAllowed} ${
    rules.attemptsAllowed === 1 ? 'attempt' : 'attempts'
  }, due ${deadlineWords(rules.deadline)}, results ${release}`;
}

/** B4-05 f0 "Result and answers · After the deadline" (sentence case of the option title). */
export function releaseValueWords(release: AssessmentRules['release']): string | null {
  if (!release) return null;
  if (release.option === 'on-date' && release.releaseDate)
    return `On ${dateTime(release.releaseDate)}`;
  return RELEASE_OPTIONS.find((entry) => entry.option === release.option)!.title;
}

const MONTH_INDEX: Readonly<Record<string, number>> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

/**
 * The rules form's typed date and time ("14 Nov 2026, 23:59", the hint's own example; a full
 * month name, a missing comma or a single-digit hour are accepted) read in Indian time — the
 * zone every board date is in — as the RFC 3339 instant the contract takes. Blank stays blank
 * (never a default, BC6); anything else is passed on as typed, so the service's own check answers
 * it (`FA-shared.date-time-unreadable`).
 */
export function typedDateTimeToInstant(typed: string): string {
  const text = typed.trim();
  if (text === '') return '';
  const match = /^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4}),?\s+(\d{1,2}):(\d{2})$/.exec(text);
  if (!match) return text;
  const day = Number(match[1]);
  const month = MONTH_INDEX[match[2]!.slice(0, 3).toLowerCase()];
  const year = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  if (!month || hour > 23 || minute > 59) return text;
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) return text;
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00+05:30`;
}

/** An instant as the rules form shows it again ("14 Nov 2026, 23:59"); blank for none. */
export function instantToTyped(instant: string | null): string {
  return instant === null ? '' : dateTime(instant);
}

/** "7 Oct 2027" from a calendar date (B4-01 f3, B4-02 f7). */
export function endedOnWords(date: string): string {
  return calendarDay(date);
}
