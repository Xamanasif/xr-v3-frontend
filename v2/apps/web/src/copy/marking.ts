/**
 * The words of Phase 4B’s FA-18 Marking queue and FA-19 Mark a submission (board B4-09 f0 … f5,
 * f7, f8), and of the two Faculty Overview actions they make possible (B4-01 f0, f4: “Mark <n>
 * written answer”, “Mark now” and the inactive-students row’s “View students”). Every phrase is the
 * frozen boards’ own, found verbatim in their markup or script (`marking.test.ts`); the composed
 * lines take the boards’ forms with the records’ values (names, numbers, dates are never copied
 * from the boards). What B4-09 and B4-01 do not word is a provisional entry of the state-copy
 * register (`state-copy-marking.ts`, VD-12).
 */
import { QUESTION_TYPE_WORDS } from './assessment-words';
import { stateWords } from './state-copy';

// ---- FA-18 Marking queue (B4-09 f0, f4, f5) ----------------------------------------------------

export const MARKING_QUEUE = {
  /** `div.xr-phead-actions > a.xr-btn--primary` (shown while any answer waits). */
  markNext: 'Mark next',
  /** `section.xr-section` “Written answers”. */
  sectionTitle: 'Written answers',
  /** The toolbar’s Assessment filter and its first option. */
  assessment: 'Assessment',
  allAssessments: 'All assessments',
  /** `div.xr-seg[role=group][aria-label=Show]`: Waiting · Marked · All. */
  show: 'Show',
  waiting: 'Waiting',
  marked: 'Marked',
  all: 'All',
  columns: {
    student: 'Student',
    assessment: 'Assessment',
    submitted: 'Submitted (oldest first)',
    status: 'Status',
    action: 'Action',
  },
  /** `span.xr-status--wait` / `span.xr-status--ok`. */
  statusWaiting: 'Waiting for marking',
  statusMarked: 'Marked',
  /** The row’s action: “Mark” while it waits, “View” once its marks are confirmed. */
  mark: 'Mark',
  view: 'View',
  /** A filter that leaves no row while answers exist (B4-09 `noMatch`). */
  noMatch: 'Nothing matches these filters.',
  /** f5 “Nothing waiting”: `div.xr-empty` with the done icon in the ok tint. */
  emptyTitle: 'Nothing is waiting for you',
  emptyLine:
    'Written answers appear here, oldest first, as students submit. Choice questions are marked automatically.',
} as const;

/** The header’s polite count: “2 written answers waiting”, “1 written answer waiting” (f0, f4, f5). */
export function waitingCountWords(waiting: number): string {
  return waiting === 1 ? '1 written answer waiting' : `${waiting} written answers waiting`;
}

/** An Assessment option: “Heat Exchanger — post-lab · Shell-and-Tube Heat Exchanger”. */
export function assessmentOptionWords(assessment: string, experiment: string | null): string {
  return experiment ? `${assessment} · ${experiment}` : assessment;
}

/**
 * The row’s second line: “Question 4 · written answer” — the written question’s number in the
 * attempt’s version. Several written questions (undrawn): “Questions 4, 5 · written answers”
 * (state-copy `FA-18.several-written`).
 */
export function writtenNumbersWords(numbers: readonly number[]): string {
  if (numbers.length === 1) return `Question ${numbers[0]} · written answer`;
  return stateWords('FA-18.several-written').replace('{numbers}', numbers.join(', '));
}

/** The row action’s name: “Mark Rahul Verma”, “View marks for Rahul Verma” (B4-09 `r.aria`). */
export function rowActionLabel(student: string, marked: boolean): string {
  return marked ? `View marks for ${student}` : `Mark ${student}`;
}

// ---- FA-19 Mark a submission (B4-09 f1 … f3, f7, f8) --------------------------------------------

export const MARK_SUBMISSION = {
  /** The top bar’s title below 1024 px (f2, f3, f7, f8 `span.xr-top-title`). */
  title: 'Mark a submission',
  /** “Marking guidance” (`details.xa-guide`, open as drawn). */
  guidance: 'Marking guidance',
  /** The choice questions’ marks (`section.xr-section` “Marked automatically”). */
  automatic: 'Marked automatically',
  /** The panel (`aside.xr-dpanel`) “Your mark”. */
  panelTitle: 'Your mark',
  optional: '(optional)',
  saved: 'Mark saved — not confirmed yet',
  confirm: 'Confirm marks',
  save: 'Save mark',
  confirming: 'Confirming…',
  cancel: 'Cancel',
  cantChange: 'Confirmed marks can’t be changed.',
  /** f2: the confirmed, read-only panel. */
  confirmed: 'Marks confirmed',
  markKey: 'Mark',
  feedbackKey: 'Feedback',
  noFeedback: 'No feedback',
  next: 'Next submission',
} as const;

/** The overline: “Heat Exchanger — post-lab · Shell-and-Tube Heat Exchanger” (upper-cased by CSS). */
export function submissionOverline(assessment: string, experiment: string): string {
  return experiment ? `${assessment} · ${experiment}` : assessment;
}

/**
 * “Submitted 5 Nov 2026, 18:52 · attempt 1 of 2”; with no attempts rule set, “… · attempt 1”
 * (state-copy `FA-19.attempts-unset`).
 */
export function submittedLine(when: string, attempt: number, allowed: number | null): string {
  return allowed === null
    ? `Submitted ${when} · ${stateWords('FA-19.attempts-unset').replace('{n}', String(attempt))}`
    : `Submitted ${when} · attempt ${attempt} of ${allowed}`;
}

/** The question card’s heading: “Question 4 · Written answer”. */
export function writtenQuestionTitle(number: number): string {
  return `Question ${number} · ${QUESTION_TYPE_WORDS.written}`;
}

/** “Rahul Verma’s answer”. */
export function answerTitle(student: string): string {
  return `${student}’s answer`;
}

/** “Question 1” — a choice question’s row under “Marked automatically”. */
export function questionNumberWords(number: number): string {
  return `Question ${number}`;
}

/** “2 of 2”, “7 of 10” — awarded of the question’s marks. */
export function markOfWords(mark: number, outOf: number): string {
  return `${mark} of ${outOf}`;
}

/** “4 of 6 marks” — the choice questions’ marks in the section head. */
export function automaticMarksWords(awarded: number, outOf: number): string {
  return `${awarded} of ${outOf} marks`;
}

/** “Mark for question 4”. */
export function markLabel(number: number): string {
  return `Mark for question ${number}`;
}

/** “Out of 10, as a whole number.” */
export function markHint(max: number): string {
  return `Out of ${max}, as a whole number.`;
}

/** “Feedback for Rahul” (then “(optional)”). */
export function feedbackLabel(first: string): string {
  return `Feedback for ${first}`;
}

/** “7 Nov 2026, 10:15 · Dr S. Ranganathan” under “Marks confirmed”. */
export function confirmedByLine(when: string, by: string): string {
  return `${when} · ${by}`;
}

/** The pinned release terms as the screen reads them (`PinnedRelease`). */
export interface ReleaseTerms {
  readonly option: 'immediately-after-marking' | 'after-deadline' | 'on-date' | null;
  /** The deadline or the release date, in words (“14 Nov 2026, 23:59”). */
  readonly on: string | null;
}

/**
 * The confirmed panel’s release line. Not released yet, after the deadline (f2): “Rahul sees the
 * result after the deadline: 14 Nov 2026, 23:59, as set for this assessment.”; released after the
 * deadline (B4-09 `relLine`): “Released to Rahul on 14 Nov 2026, 23:59 — when the deadline
 * passed.” The other options are undrawn (state-copy `FA-19.release.*`).
 */
export function releaseLine(first: string, terms: ReleaseTerms, releasedAt: string | null): string {
  if (releasedAt !== null) {
    if (terms.option === 'after-deadline')
      return `Released to ${first} on ${releasedAt} — when the deadline passed.`;
    const id =
      terms.option === 'on-date'
        ? 'FA-19.release.released-on-date'
        : 'FA-19.release.released-immediately';
    return stateWords(id).replace('{first}', first).replace('{date}', releasedAt);
  }
  if (terms.option === 'after-deadline' && terms.on !== null)
    return `${first} sees the result after the deadline: ${terms.on}, as set for this assessment.`;
  if (terms.option === 'on-date' && terms.on !== null)
    return stateWords('FA-19.release.on-date')
      .replace('{first}', first)
      .replace('{date}', terms.on);
  if (terms.option === 'immediately-after-marking')
    return stateWords('FA-19.release.immediately').replace('{first}', first);
  return stateWords('FA-19.release.unset').replace('{first}', first);
}

/** DL-1’s title: “Confirm marks for Rahul Verma?”. */
export function confirmTitle(student: string): string {
  return `Confirm marks for ${student}?`;
}

/** DL-1’s first line before the mark: “Question 4: ” (then “7 of 10” in bold and “.”). */
export function confirmMarkLead(number: number): string {
  return `Question ${number}: `;
}

/**
 * DL-1’s effect: “Confirmed marks can’t be changed. Rahul sees the result when it’s released —
 * after the deadline, 14 Nov 2026, 23:59.” The other release options are undrawn (state-copy
 * `FA-19.confirm.*`).
 */
export function confirmEffect(first: string, terms: ReleaseTerms): string {
  const lead = `${MARK_SUBMISSION.cantChange} ${first} sees the result when it’s released`;
  if (terms.option === 'after-deadline' && terms.on !== null)
    return `${lead} — after the deadline, ${terms.on}.`;
  if (terms.option === 'on-date' && terms.on !== null)
    return `${lead} — ${stateWords('FA-19.confirm.on-date').replace('{date}', terms.on)}`;
  if (terms.option === 'immediately-after-marking')
    return `${lead} — ${stateWords('FA-19.confirm.immediately')}`;
  return `${lead}.`;
}

// ---- FA-01 Overview: the Phase-4B actions (B4-01 f0, f4) -----------------------------------------

export const OVERVIEW_ACTIONS = {
  /** The written-answers row’s action (→ FA-18 for that assessment). */
  markNow: 'Mark now',
  /** The inactive-students row’s action (→ FA-20 for that experiment). */
  viewStudents: 'View students',
} as const;

/**
 * The header’s one primary: “Mark 1 written answer” (f0, f4); several, “Mark 3 written answers”
 * (state-copy `FA-01.mark-header-many`).
 */
export function markHeaderWords(answers: number): string {
  return answers === 1
    ? 'Mark 1 written answer'
    : stateWords('FA-01.mark-header-many').replace('{n}', String(answers));
}

/**
 * “2 students inactive for 14 days or more” (f0, f4); one Student (undrawn), “1 student inactive
 * for 14 days or more” (state-copy `FA-01.inactive-one`).
 */
export function inactiveTitle(students: number, days: number): string {
  return students === 1
    ? stateWords('FA-01.inactive-one').replace('{days}', String(days))
    : `${students} students inactive for ${days} days or more`;
}

/** Names drawn on the inactive row before “and <n> more” (state-copy `FA-01.inactive-names`). */
export const INACTIVE_NAMES_SHOWN = 3;

/**
 * “Imran Shaikh, Karthik Rao · Shell-and-Tube Heat Exchanger” (f0, f4); beyond three names,
 * “A, B, C and 2 more · <experiment>” (state-copy `FA-01.inactive-names`).
 */
export function inactiveSub(names: readonly string[], experiment: string): string {
  const shown = names.slice(0, INACTIVE_NAMES_SHOWN).join(', ');
  const rest = names.length - INACTIVE_NAMES_SHOWN;
  const list =
    rest > 0
      ? `${shown} ${stateWords('FA-01.inactive-names').replace('{n}', String(rest))}`
      : shown;
  return `${list} · ${experiment}`;
}
