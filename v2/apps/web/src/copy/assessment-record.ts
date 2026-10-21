/**
 * The words of FA-08 Assessment · Summary and FA-09 Assessment · Questions in the V3 Refined B
 * design (the owner-approved export design/v3-refined-b/roles/FA-v1, `project/Main.dc.html` "FA-08
 * Summary", "FA-09 Questions" and the script's `vmRecord`, `vmQuestionsTab`, `verNote`,
 * `keepText`). Every undrawn variant — a singular, a change made by someone else, the words while
 * the submissions are not read yet — is a state-copy entry (`state-copy-assessment-record.ts`),
 * read through `stateWords`. No assessment, attempt or question is named by its internal reference
 * (the owner's identifier rule): a question by its position or its words.
 */
import { dateTime, dayMonthYear } from './dates';
import { faPlural, writtenAnswersWaitingWords } from './fa-shared';
import { stateWords } from './state-copy';

const plural = faPlural;

/** "Rahul Verma", "Rahul Verma and Priya Natarajan", "A, B and C" (the export's `names`). */
export function namesWords(names: readonly string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

// ---- FA-08 Summary -------------------------------------------------------------------------------

export const SUMMARY_WORDS = {
  /** `h2#fa-tabh` while Ready, and while a draft. */
  readyTitle: 'Ready to use',
  draftTitle: 'Draft — not ready',
  /** The draft's line: "Students can’t see a draft. It needs at least one question." */
  draftLead: 'Students can’t see a draft.',
  draftNeedsQuestion: 'It needs at least one question.',
  draftNeedsRules: 'Finish the rules to make it ready.',
  /** `ul.fa-check[aria-label]`. */
  checklist: 'Ready checklist',
  nameCheck: 'Name and introduction',
  rulesSet: 'Rules set for this assessment',
  rulesNotFinished: 'Rules — not finished',
  noQuestionCheck: 'At least one question — none yet',
  /** `div.fa-actions > a.rb-btn--primary` (to the Questions tab). */
  addQuestions: 'Add questions',
  versionsTitle: 'Versions',
  rulesTitle: 'Rules as set for this assessment',
  changeSettings: 'Change settings',
  passMark: 'Pass mark',
  attempts: 'Attempts allowed',
  deadline: 'Deadline',
  release: 'Result and answers',
  timeLimit: 'Time limit',
  /** "Time limit · None" — there is no timer (T-22). */
  none: 'None',
  notSetYet: 'Not set yet',
  notChosenYet: 'Not chosen yet',
  introduction: 'Introduction students read first',
  reachTitle: 'Who it reaches',
  reachFormats:
    'Formats don’t change who it reaches: one assessment covers the experiment, whichever format a student used.',
  reachNote: 'Reach follows Student access, set by the Institute Admin.',
  /** The side panel. */
  submissionsTitle: 'Submissions',
  oldestFirst: 'Oldest first',
  waitListLabel: 'Waiting for marking, oldest first',
  nothingWaiting: 'Nothing is waiting for marking.',
  noSubmissions: 'No submissions yet.',
  pinnedNote:
    'Students have submitted. If you change the questions or rules now, that makes a new version — earlier submissions keep theirs.',
  earlierNote: 'Earlier submissions keep the version they answered.',
  freeNote: 'No one has submitted yet. You can change the questions and rules freely.',
  draftNote: 'Students can’t see a draft, so no one can submit yet.',
} as const;

/** "Students who have Shell-and-Tube Heat Exchanger can see and start it." */
export function readyLine(experiment: string): string {
  return `Students who have ${experiment} can see and start it.`;
}

/** "Students can’t see a draft. It needs at least one question." / "… Finish the rules …". */
export function draftLine(hasQuestions: boolean): string {
  return `${SUMMARY_WORDS.draftLead} ${
    hasQuestions ? SUMMARY_WORDS.draftNeedsRules : SUMMARY_WORDS.draftNeedsQuestion
  }`;
}

/** "Version 2 since 8 Nov 2026, 10:15" (the versions notice's title). */
export function versionTitle(version: number, since: string): string {
  return `Version ${version} since ${dateTime(since)}`;
}

/** What the change that made the current version touched (the record's history). */
export type VersionChange = 'rules' | 'questions' | 'both' | 'unknown';

/** The versions notice's first sentence: "You changed a rule after students submitted." */
export function versionLead(change: VersionChange, who: string | null): string {
  const actor = who ?? 'You';
  switch (change) {
    case 'rules':
      return `${actor} changed a rule after students submitted.`;
    case 'questions':
      return `${actor} changed the questions after students submitted.`;
    case 'both':
      return stateWords('FA-08.version-both').replace('{who}', actor);
    case 'unknown':
      return stateWords('FA-08.version-unknown');
  }
}

/** A submission on an earlier version, by who answered it and which version it keeps. */
export interface EarlierSubmission {
  readonly student: string;
  readonly version: number;
}

/**
 * "Rahul Verma’s submission keeps version 1; new attempts use version 2." / "Submissions from Rahul
 * Verma and Priya Natarajan keep version 1; …" / "New attempts use version 2." (the export's
 * `keepText`). While the submissions are not read, `FA-08.version-keeps`.
 */
export function keepWords(version: number, earlier: readonly EarlierSubmission[] | null): string {
  if (earlier === null) return stateWords('FA-08.version-keeps').replace('{n}', String(version));
  if (earlier.length === 0) return `New attempts use version ${version}.`;
  const versions = [...new Set(earlier.map((entry) => entry.version))];
  const keep = versions.length === 1 ? `version ${versions[0]}` : 'the version they answered';
  const who =
    earlier.length === 1
      ? `${earlier[0]!.student}’s submission keeps`
      : `Submissions from ${namesWords(earlier.map((entry) => entry.student))} keep`;
  return `${who} ${keep}; new attempts use version ${version}.`;
}

/** "50% · 8 of 16 marks" (the service's own pass mark marks); with no questions, "50%". */
export function passMarkWords(
  percent: number,
  passMarkMarks: number | null,
  totalMarks: number,
): string {
  if (totalMarks === 0 || passMarkMarks === null) return `${percent}%`;
  return `${percent}% · ${passMarkMarks} of ${totalMarks} marks`;
}

/**
 * The result release as set: "Immediately after marking", "After the deadline", "On a date — 20
 * Nov 2026, 09:00" (the export's `relWords`).
 */
export function releaseRuleWords(
  option: 'immediately-after-marking' | 'after-deadline' | 'on-date',
  date: string | null,
): string {
  if (option === 'immediately-after-marking') return 'Immediately after marking';
  if (option === 'after-deadline') return 'After the deadline';
  return date === null ? 'On a date' : `On a date — ${date}`;
}

/**
 * "Created 26 Oct 2026, 16:40 by you · ready since 27 Oct 2026, 11:05 · version 2 since …" / "· not
 * ready yet" (the export's `created`). `by` is "you" or the creator's name.
 */
export function createdLine(input: {
  readonly createdAt: string;
  readonly by: string;
  readonly readySince: string | null;
  readonly version: number;
  readonly versionSince: string;
}): string {
  const ready = input.readySince
    ? ` · ready since ${dateTime(input.readySince)}`
    : ' · not ready yet';
  const version =
    input.version > 1 ? ` · version ${input.version} since ${dateTime(input.versionSince)}` : '';
  return `Created ${dateTime(input.createdAt)} by ${input.by}${ready}${version}`;
}

/** "by you". */
export const CREATED_BY_YOU = 'you';

/**
 * "5 students who have Shell-and-Tube Heat Exchanger from Godavari Institute of Technology." then
 * the formats line; one student: `FA-08.reach-one`; none: the export's "No students have … yet.
 * It reaches students when your Institute Admin gives them the experiment."
 */
export function reachWords(reach: number, experiment: string, institution: string | null): string {
  const from = institution ? ` from ${institution}` : '';
  if (reach === 0) {
    return `${stateWords('FA-08.reach-none')
      .replace('{experiment}', experiment)
      .replace(
        '{from}',
        from,
      )} It reaches students when your Institute Admin gives them the experiment.`;
  }
  const lead =
    reach === 1
      ? `1 student${stateWords('FA-08.reach-one').replace('{experiment}', experiment).replace('{from}', from)}`
      : `${reach} students who have ${experiment}${from}.`;
  return `${lead} ${SUMMARY_WORDS.reachFormats}`;
}

/** "2 written answers waiting for marking" (`p.rk-pending`). */
export function writtenWaitingWords(count: number): string {
  return writtenAnswersWaitingWords(count);
}

/** The waiting list's time: "5 Nov, 18:52" (the export drops the year). */
export function waitedSinceWords(instant: string): string {
  return dateTime(instant).replace(/ \d{4},/, ',');
}

// ---- FA-09 Questions ---------------------------------------------------------------------------

export const QUESTIONS_WORDS = {
  /** `h2#fa-tabh`. */
  title: 'Questions in order',
  /** `button#fa-aq-open` (the stack). */
  addFromBank: 'Add from question bank',
  /** `a.rb-btn` (the plus; to FA-15, back here afterwards). */
  newQuestion: 'New question',
  /** `p.fa-qmore > span`. */
  or: 'Or',
  /** `div.rk-state > p.rk-state-t`. */
  emptyTitle: 'No questions yet',
  /** `p.rk-hint.fa-qfoot`. */
  footNote:
    'Removing takes a question off this assessment. It stays in your question bank — removing is not deleting.',
  /** `p.fa-qnote`. */
  newerVersion: 'A newer version is in your question bank.',
  useUpdated: 'Use updated version',
  remove: 'Remove',
  /** The bank panel. */
  panelTitle: 'From your question bank',
  add: 'Add',
  closePanel: 'Close question bank',
  panelEmpty: 'Every question in your bank for this experiment is already here.',
  /** The messages after a change. */
  removed: 'Question removed from this assessment. It is still in your question bank.',
  /** Back from "New question" (FA-15): the question is offered, never attached on its own. */
  savedTitle: 'Saved to your question bank.',
  savedLine: 'It isn’t in this assessment yet. Add it only if you want it here.',
  offer: 'Add this question to the assessment',
} as const;

/** "3 marked automatically · 1 written answer you mark" (`p.rk-hint`). */
export function splitWords(automatic: number, written: number): string {
  return `${automatic} marked automatically · ${plural(written, 'written answer')} you mark`;
}

/** "Question 1: " read before the words. */
export function questionLead(position: number): string {
  return `Question ${position}: `;
}

/** "Order of question 2" (`span.fa-order[aria-label]`). */
export function orderLabel(position: number): string {
  return `Order of question ${position}`;
}

/** "Move question 2 up". */
export function moveUpLabel(position: number): string {
  return `Move question ${position} up`;
}

/** "Move question 2 down". */
export function moveDownLabel(position: number): string {
  return `Move question ${position} down`;
}

/** "Remove question 1 from this assessment". */
export function removeLabel(position: number): string {
  return `Remove question ${position} from this assessment`;
}

/** "Use the updated version of question 1". */
export function updatedVersionLabel(position: number): string {
  return `Use the updated version of question ${position}`;
}

/** "Deleted from your question bank on 25 Oct 2026 — this assessment keeps its copy." */
export function deletedLine(deletedAt: string): string {
  return `Deleted from your question bank on ${dayMonthYear(deletedAt)} — this assessment keeps its copy.`;
}

/** The bank panel's line: "Shell-and-Tube Heat Exchanger · not in this assessment". */
export function panelMeta(experiment: string): string {
  return `${experiment} · not in this assessment`;
}

/** "Multiple choice · 2 marks" (a bank question's line). */
export function typeAndMarks(type: string, marks: string): string {
  return `${type} · ${marks}`;
}

/** "Add to this assessment: <the question's words>" (the Add button's name). */
export function addLabel(questionText: string): string {
  return `Add to this assessment: ${questionText}`;
}

/** "Moved question 2 to position 1." */
export function movedMessage(from: number, to: number): string {
  return `Moved question ${from} to position ${to}.`;
}

/** "Added as question 5." */
export function addedMessage(position: number): string {
  return `Added as question ${position}.`;
}

/** "Question 1 now uses the version in your bank." */
export function updatedMessage(position: number): string {
  return `Question ${position} now uses the version in your bank.`;
}

/** "This made version 2. Rahul Verma’s submission keeps version 1; …" (the notice's line). */
export function madeVersionLine(version: number, keep: string): string {
  return `This made version ${version}. ${keep}`;
}

/**
 * The pinned hint: "Rahul Verma and Priya Natarajan have submitted. If you change the questions
 * now, that makes a new version — their submissions keep theirs." (`p.rk-pending`).
 */
export function pinnedHint(names: readonly string[]): string {
  return `${namesWords(names)} ${names.length === 1 ? 'has' : 'have'} submitted. If you change the questions now, that makes a new version — their submissions keep theirs.`;
}
