/**
 * The words of FA-08 Assessment · Summary and FA-09 Assessment · Questions as board B4-05 draws
 * them (f0 … f8, and the interactive frames' own script for the messages after Remove, Add, a
 * move and "Use updated version"). Every undrawn variant — a singular, a draft missing its rules,
 * a change made by someone else, the words without a Student's name — is a state-copy entry
 * (`state-copy-assessment-record.ts`), read through `stateWords`.
 */
import { dateTime, dayMonthYear } from './dates';
import { stateWords } from './state-copy';

// ---- FA-08 Summary (B4-05 f0, f3, f4) ----------------------------------------------------------

export const SUMMARY_WORDS = {
  /** f0 `h2#Sm-r`. */
  readyTitle: 'Ready to use',
  /** f3 "Draft — not ready · Students can’t see it until it has a question." */
  draftLine: 'Students can’t see it until it has a question.',
  /** f0 checklist (the introduction is optional: the item is ticked by the name). */
  nameCheck: 'Name and introduction',
  /** f3 checklist, `span.is-no`. */
  noQuestionCheck: 'At least one question — none yet',
  /** f3 `a.xr-btn--primary` (to the Questions tab). */
  addQuestions: 'Add questions',
  /** f0 `h2#Sm-s`. */
  submissionsTitle: 'Submissions',
  /** f0 `h2#Sm-w`. */
  reachTitle: 'Who it reaches',
  /** f0 "Formats don’t change who it reaches: …". */
  reachFormats:
    'Formats don’t change who it reaches: one assessment covers the experiment, whichever format a student used.',
  /** f0 `p.xl-meta`. */
  reachNote: 'Reach follows Student access, set by the Institute Admin.',
  /** f0 `h2#Sm-k`. */
  rulesTitle: 'Rules as set for this assessment',
  introduction: 'Introduction',
  passMark: 'Pass mark',
  attempts: 'Attempts allowed',
  deadline: 'Deadline',
  release: 'Result and answers',
  timeLimit: 'Time limit',
  /** f0 "Time limit · None" — there is no timer (T-22). */
  noTimeLimit: 'None',
  /** f0 footer link (to the Settings tab). */
  changeSettings: 'Change settings',
} as const;

/** f0 "Students who have Shell-and-Tube Heat Exchanger can see and start it." */
export function readyLine(experiment: string): string {
  return `Students who have ${experiment} can see and start it.`;
}

/**
 * The line beside "Draft — not ready": f3 draws a draft waiting only for a question; a draft
 * waiting for a rule is `FA-08.draft-line-rules` / `FA-08.draft-line-both`.
 */
export function draftLine(missingRules: boolean, missingQuestions: boolean): string {
  if (missingRules && missingQuestions) return stateWords('FA-08.draft-line-both');
  if (missingRules) return stateWords('FA-08.draft-line-rules');
  return SUMMARY_WORDS.draftLine;
}

/** A rule not set yet, named as the "Rules as set" list names it (lower case). */
export type MissingRule = 'passMark' | 'attempts' | 'deadline' | 'release' | 'releaseDate';

const MISSING_RULE_WORDS: Readonly<Record<MissingRule, string>> = {
  passMark: 'pass mark',
  attempts: 'attempts allowed',
  deadline: 'deadline',
  release: 'result and answers',
  releaseDate: 'release date',
};

/** The checklist's rules item while a rule is missing (`FA-08.rules-missing`). */
export function rulesMissingWords(missing: readonly MissingRule[]): string {
  return stateWords('FA-08.rules-missing').replace(
    '{missing}',
    missing.map((rule) => MISSING_RULE_WORDS[rule]).join(', '),
  );
}

/** f0 "1 of 5 submitted" (the separator " · " precedes the waiting pill). */
export function submittedWords(submitted: number, reach: number): string {
  return `${submitted} of ${reach} submitted`;
}

/** f0 `span.xr-status--wait` "1 waiting for marking". */
export function waitingWords(waiting: number): string {
  return `${waiting} waiting for marking`;
}

/**
 * f0 quiet notice: "1 student has submitted. If you change questions or rules now, that makes a
 * new version — earlier submissions keep theirs." More than one: `FA-08.submitted-notice-many`.
 */
export function submittedNotice(students: number): string {
  return students === 1
    ? '1 student has submitted. If you change questions or rules now, that makes a new version — earlier submissions keep theirs.'
    : stateWords('FA-08.submitted-notice-many').replace('{n}', String(students));
}

/** f4 notice title: "Version 2 since 8 Nov 2026". */
export function versionTitle(version: number, since: string): string {
  return `Version ${version} since ${dayMonthYear(since)}`;
}

/** What the change that made the current version touched (the record's history). */
export type VersionChange = 'rules' | 'questions' | 'both' | 'unknown';

/**
 * f4 notice body. Drawn: "You changed a rule after students submitted. Rahul Verma’s submission
 * keeps version 1; new attempts use version 2." The service names no Student here, so the second
 * sentence is `FA-08.version-keeps`; a change to the questions, or made by someone else, is
 * `FA-08.version-questions` / `-both` / `-actor`.
 */
export function versionLine(change: VersionChange, who: string | null, version: number): string {
  const actor = who ?? 'You';
  const lead =
    change === 'rules'
      ? `${actor} changed a rule after students submitted.`
      : change === 'questions'
        ? stateWords('FA-08.version-questions').replace('{who}', actor)
        : change === 'both'
          ? stateWords('FA-08.version-both').replace('{who}', actor)
          : stateWords('FA-08.version-unknown');
  return `${lead} ${stateWords('FA-08.version-keeps').replace('{n}', String(version))}`;
}

/**
 * f0 "**5 students** who have Shell-and-Tube Heat Exchanger from Godavari Institute of
 * Technology." — the strong part and the rest. One student: `FA-08.reach-one`; none:
 * `FA-08.reach-none`; no institution name in the session: the " from …" part is left out.
 */
export function reachWords(
  reach: number,
  experiment: string,
  institution: string | null,
): { readonly strong: string | null; readonly rest: string } {
  const from = institution ? ` from ${institution}` : '';
  if (reach === 0) {
    return {
      strong: null,
      rest: stateWords('FA-08.reach-none')
        .replace('{experiment}', experiment)
        .replace('{from}', from),
    };
  }
  if (reach === 1) {
    return {
      strong: '1 student',
      rest: stateWords('FA-08.reach-one')
        .replace('{experiment}', experiment)
        .replace('{from}', from),
    };
  }
  return { strong: `${reach} students`, rest: ` who have ${experiment}${from}.` };
}

/**
 * f0 "50% · 8 of 16 marks": the marks as the service gives them (pass mark × total; its rounding
 * is open — `FA-08.pass-mark-marks`); with no questions yet, the percentage alone.
 */
export function passMarkWords(
  percent: number,
  passMarkMarks: number | null,
  totalMarks: number,
): string {
  if (totalMarks === 0 || passMarkMarks === null) return `${percent}%`;
  return `${percent}% · ${passMarkMarks} of ${totalMarks} marks`;
}

/**
 * f0 footer "Created 26 Oct 2026, 16:40 by you · ready since 27 Oct 2026, 11:05 · " before the
 * "Change settings" link. `by` is "you" for the signed-in Faculty member, else the creator's name
 * (`FA-08.created-by-other`); never Ready yet, the "ready since" part is left out
 * (`FA-08.never-ready`).
 */
export function createdLine(createdAt: string, by: string, readySince: string | null): string {
  const ready = readySince ? ` · ready since ${dateTime(readySince)}` : '';
  return `Created ${dateTime(createdAt)} by ${by}${ready} · `;
}

/** f0 "by you". */
export const CREATED_BY_YOU = 'you';

// ---- FA-09 Questions (B4-05 f1, f2, f5 … f8) ---------------------------------------------------

export const QUESTIONS_WORDS = {
  /** f6 `h2#Qq-qh`. */
  title: 'Questions in order',
  /** f6 toolbar `button.xr-btn--primary.xr-btn--sm`; f1 empty state `button.xr-btn--primary`. */
  addFromBank: 'Add from question bank',
  /** f6 toolbar and f1 empty state (to FA-15, back here afterwards). */
  newQuestion: 'New question',
  /** f1 `h3`. */
  emptyTitle: 'No questions yet',
  /** f6 foot `p.xl-meta`. */
  footNote:
    'Removing takes a question off this assessment. It stays in your question bank — removing is not deleting.',
  /** f8 row notice. */
  newerVersion: 'A newer version is in your question bank.',
  /** f8 `button.xr-btn--text`. */
  useUpdated: 'Use updated version',
  /** f6 row `button.xr-btn--text`. */
  remove: 'Remove',
  /** The interactive frames' warn notice after a change once Students have submitted. */
  newVersionTitle: 'This makes a new version',
  /** f7 `h2#Qqp-ph.xr-dpanel-title`. */
  panelTitle: 'From your question bank',
  /** f7 panel `button.xr-btn--secondary.xr-btn--sm`. */
  add: 'Add',
  /** f7 close `button.xr-icon-btn[aria-label]`. */
  closePanel: 'Close question bank',
  /** The interactive frames' panel with nothing left to add. */
  panelEmpty: 'Every question in your bank for this experiment is already here.',
} as const;

/** f2 "Deleted from your question bank on 25 Oct 2026 — this assessment keeps its copy." */
export function deletedLine(deletedAt: string): string {
  return `Deleted from your question bank on ${dayMonthYear(deletedAt)} — this assessment keeps its copy.`;
}

/** f6 `aria-label` "Remove question 1 from this assessment". */
export function removeLabel(position: number): string {
  return `Remove question ${position} from this assessment`;
}

/** f6 `aria-label` "Move question 2 up". */
export function moveUpLabel(position: number): string {
  return `Move question ${position} up`;
}

/** f6 `aria-label` "Move question 2 down". */
export function moveDownLabel(position: number): string {
  return `Move question ${position} down`;
}

/** f7 panel row: "Q-0103 · Multiple choice · 2 marks". */
export function bankRowSub(questionId: string, type: string, marks: string): string {
  return `${questionId} · ${type} · ${marks}`;
}

/** f7 `aria-label` "Add Q-0103 to this assessment". */
export function addLabel(questionId: string): string {
  return `Add ${questionId} to this assessment`;
}

/** f7 panel meta: "Shell-and-Tube Heat Exchanger · not in this assessment". */
export function panelMeta(experiment: string): string {
  return `${experiment} · not in this assessment`;
}

/** The interactive frames' message after Remove. */
export function removedMessage(questionId: string): string {
  return `${questionId} removed from this assessment. It is still in your question bank.`;
}

/** The interactive frames' message after Add: "Q-0103 added as question 5." */
export function addedMessage(questionId: string, position: number): string {
  return `${questionId} added as question ${position}.`;
}

/** The interactive frames' message after a move: "Moved Q-0102 to position 1". */
export function movedMessage(questionId: string, position: number): string {
  return `Moved ${questionId} to position ${position}`;
}

/** The interactive frames' message after "Use updated version". */
export function updatedMessage(questionId: string): string {
  return `${questionId} now uses the version in your bank.`;
}

/**
 * The warn notice's body. Drawn: "Rahul Verma has submitted. His submission keeps the version he
 * answered; new attempts use this one." The service names no Student here: `FA-09.new-version-*`.
 */
export function newVersionLine(students: number): string {
  return students === 1
    ? stateWords('FA-09.new-version-one')
    : stateWords('FA-09.new-version-many').replace('{n}', String(students));
}
