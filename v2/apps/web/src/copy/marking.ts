/**
 * The words of FA-18 Marking queue and FA-19 Mark a submission as the owner-approved Faculty export
 * draws them (V3 Refined B, design/v3-refined-b/roles/FA-v1 `project/Main.dc.html` FA-18, FA-19,
 * the Confirm marks dialog and the script's `vmQueue`, `vmMark`, `dlgMark`, `relPlan`,
 * `relSentence`), and of the two Faculty Overview actions they make possible (FA-01, the teaching
 * group's: “Mark <n> written answer”, “Mark now” and the inactive-students row's “View students”).
 * Every phrase is the export's own, found verbatim in its template or script (`marking.test.ts`);
 * the composed lines take the script's forms with the records' values (names, numbers and dates
 * are never copied from the export). No line names an attempt or an assessment by its internal
 * reference (the owner's identifier rule): a submission is the Student's, an attempt is “Attempt 1”.
 * What the export does not word is a provisional entry of the state-copy register
 * (`state-copy-marking.ts`).
 */
import { QUESTION_TYPE_WORDS } from './assessment-words';
import { stateWords } from './state-copy';

/** “1 day”, “2 days” (the export's `plural`). */
function plural(count: number, one: string): string {
  return `${count} ${count === 1 ? one : `${one}s`}`;
}

// ---- FA-18 Marking queue -------------------------------------------------------------------------

export const MARKING_QUEUE = {
  /** `p.rk-sub` under the title. */
  lead: 'Written answers from your assessments, oldest first. Choice questions are marked automatically.',
  /** No course taught: the compact message card. */
  noCourseTitle: 'Nothing to mark yet',
  noCourseLine:
    'Written answers appear here once you teach a course with an assessment. Your Institute Admin hasn’t assigned you a course yet.',
  /** The surface's heading (`h2#fa-mq-h`). */
  sectionTitle: 'Written answers',
  /** The toolbar's one gold primary (shown while any answer waits). */
  markNext: 'Mark next',
  /** `div.rk-tools[role=search]`. */
  filters: 'Filter written answers',
  /** The Assessment filter and its first option. */
  assessment: 'Assessment',
  allAssessments: 'All assessments',
  /** `div.fa-seg[role=group][aria-label=Show]`: Waiting · Marked · All. */
  show: 'Show',
  waiting: 'Waiting',
  marked: 'Marked',
  all: 'All',
  caption: 'Written answers, oldest first',
  columns: {
    student: 'Student',
    assessment: 'Assessment',
    submitted: 'Submitted (oldest first)',
    status: 'Status',
    action: 'Action',
  },
  /** The labels a row's cells take on phones (`span.fa-lbl`). */
  cellLabels: { assessment: 'Assessment', submitted: 'Submitted', status: 'Status' },
  statusWaiting: 'Waiting for marking',
  statusMarked: 'Marked',
  /** Under a waiting row's status once its mark is saved. */
  savedNote: 'Mark saved — not confirmed yet',
  /** The row's action: “Mark” while it waits (`rb-btn`), “View marks” once confirmed (ghost). */
  mark: 'Mark',
  view: 'View marks',
  /** A filter that leaves no row while answers exist (`MQ.noMatchT`, `MQ.noMatchD`). */
  noMatchTitle: 'Nothing matches these filters',
  noMatchLine: 'Try another assessment, or show all written answers.',
  /** The same under Marked. */
  noConfirmedTitle: 'No confirmed marks here yet',
  noConfirmedLine: 'Answers you mark and confirm are listed here.',
  showAll: 'Show all written answers',
  /** Nothing waiting (`rk-state--roomy`, the inbox glyph). */
  emptyTitle: 'Nothing is waiting for you',
  emptyLine:
    'Written answers appear here, oldest first, as students submit. Choice questions are marked automatically.',
  /**
   * Under the empty state while a co-teaching colleague's assessment has submissions. The export's
   * "… aren’t shown to co-teachers while sharing between co-teachers is being decided." in the
   * product's words for co-teaching ("a co-teaching colleague"): B8-03 allows no role-name variant.
   */
  coteachNote:
    'Written answers for assessments another Faculty member created aren’t shown to co-teaching colleagues while sharing between colleagues is being decided.',
} as const;

/** The toolbar's count (`span.rk-count[role=status]`): “2 written answers waiting”, “Nothing waiting”. */
export function waitingCountWords(waiting: number): string {
  if (waiting === 0) return 'Nothing waiting';
  return waiting === 1 ? '1 written answer waiting' : `${waiting} written answers waiting`;
}

/** Beside the count (`span.fa-oldest`): “Oldest waiting 2 days”, “Oldest submitted today”. */
export function oldestWaitingWords(days: number): string {
  return days <= 0 ? 'Oldest submitted today' : `Oldest waiting ${plural(days, 'day')}`;
}

/** Under a waiting row's submitted time: “2 days ago”, “Today”. */
export function submittedAgoWords(days: number): string {
  return days <= 0 ? 'Today' : `${plural(days, 'day')} ago`;
}

/** A segmented button's count for screen readers (`span.xr-sr`): “, 2”. */
export function segmentCountWords(count: number): string {
  return `, ${count}`;
}

/** An Assessment option: “Heat Exchanger — post-lab · Shell-and-Tube Heat Exchanger”. */
export function assessmentOptionWords(assessment: string, experiment: string | null): string {
  return experiment ? `${assessment} · ${experiment}` : assessment;
}

/**
 * A row's attempt (`fa-cellsub` under the Student): “Attempt 1 of 2”, the attempts allowed from the
 * assessment list FA-18 reads; while they are not known (the list has not answered, or the rule is
 * not set), “Attempt 1” (state-copy `FA-18.attempt`).
 */
export function queueAttemptWords(attempt: number, allowed: number | null): string {
  return allowed === null
    ? stateWords('FA-18.attempt').replace('{n}', String(attempt))
    : `Attempt ${attempt} of ${allowed}`;
}

/**
 * The row's second line: “Question 4 · written answer” — the written question's number in the
 * attempt's version. Several written questions: “Questions 4 and 5 · written answers” (the
 * export's `wqLabel`, state-copy `FA-18.several-written`).
 */
export function writtenNumbersWords(numbers: readonly number[]): string {
  if (numbers.length === 1) return `Question ${numbers[0]} · written answer`;
  const list = `${numbers.slice(0, -1).join(', ')} and ${numbers[numbers.length - 1]}`;
  return stateWords('FA-18.several-written').replace('{numbers}', list);
}

/** A marked row's note: “Confirmed 7 Nov 2026, 10:15”. */
export function confirmedOnWords(when: string): string {
  return `Confirmed ${when}`;
}

/** The row action's name: “Mark Rahul Verma”, “View marks for Rahul Verma” (`r.aria`). */
export function rowActionLabel(student: string, marked: boolean): string {
  return marked ? `View marks for ${student}` : `Mark ${student}`;
}

// ---- FA-19 Mark a submission ---------------------------------------------------------------------

export const MARK_SUBMISSION = {
  /** The page's name in the document title (the shell placement). */
  title: 'Mark a submission',
  /** Below 860 px, where the panel sits under the answer (`p.fa-gomark`). */
  goToMarks: 'Go to the marks',
  /** The automatic-marks strip (`section.fa-autos`). */
  automatic: 'Marked automatically',
  noChoice: 'This assessment has no choice questions.',
  /** The guidance note (`p.fa-guide-k`). */
  guidance: 'Marking guidance · only you see this',
  /** A written question left blank. */
  noAnswer: 'No answer was given.',
  /** The panel (`div.rk-panel.fa-mpanel`). */
  panelTitle: 'Marks',
  /** The score field's label (`label.fa-score-lbl`). */
  yourMark: 'Your mark',
  total: 'Total',
  save: 'Save mark',
  saved: 'Mark saved — not confirmed yet',
  saveNote: 'Saving keeps your mark editable.',
  confirm: 'Confirm marks',
  confirming: 'Confirming…',
  cancel: 'Cancel',
  cantChange: 'Confirmed marks can’t be changed.',
  /** The confirmed, read-only panel (`div.fa-done`). */
  confirmed: 'Marks confirmed',
  feedbackKey: 'Feedback',
  noFeedback: 'No feedback',
  next: 'Next submission',
  nothingElse: 'Nothing else is waiting for marking.',
  seeSubmissions: 'See submissions',
  statusWaiting: 'Waiting for marking',
  statusMarked: 'Marked',
  /** The dialog's first group (`div.rk-dlg-now > h3`) and its read-only line. */
  confirmNow: 'What confirming does',
  readOnlyAfter: 'The marks become read-only. They can’t be changed after you confirm.',
} as const;

/** The eyebrow: “Heat Exchanger — post-lab · Shell-and-Tube Heat Exchanger”. */
export function submissionOverline(assessment: string, experiment: string): string {
  return experiment ? `${assessment} · ${experiment}` : assessment;
}

/**
 * The meta line after the status: “Submitted 5 Nov 2026, 18:52 · attempt 1 of 2”, with “ · version
 * 2” when the assessment has more than one version; with no attempts rule set, “… · attempt 1”
 * (state-copy `FA-19.attempts-unset`).
 */
export function submittedLine(
  when: string,
  attempt: number,
  allowed: number | null,
  version: number | null = null,
): string {
  const attemptWords =
    allowed === null
      ? stateWords('FA-19.attempts-unset').replace('{n}', String(attempt))
      : `attempt ${attempt} of ${allowed}`;
  return `Submitted ${when} · ${attemptWords}${version === null ? '' : ` · version ${version}`}`;
}

/** Beside the head while it waits (`p.fa-qpos`): “1 of 2 waiting · oldest first”. */
export function queuePositionWords(position: number, waiting: number): string {
  return `${position} of ${waiting} waiting · oldest first`;
}

/** The panel head's note: “16 marks in total”. */
export function totalMarksWords(marks: number): string {
  return `${plural(marks, 'mark')} in total`;
}

/** The strip's head figure: “4 of 6 marks”. */
export function automaticMarksWords(awarded: number, outOf: number): string {
  return `${awarded} of ${outOf} marks`;
}

/** A choice question in the strip: “Question 1 · Multiple choice” (the product's type words). */
export function choiceQuestionWords(
  number: number,
  type: keyof typeof QUESTION_TYPE_WORDS,
): string {
  return `Question ${number} · ${QUESTION_TYPE_WORDS[type]}`;
}

/** “2 of 2”, “7 of 10” — awarded of the question's marks. */
export function markOfWords(mark: number, outOf: number): string {
  return `${mark} of ${outOf}`;
}

/** The written question's head: “Question 4 of 4 · Written answer”. */
export function writtenQuestionHead(number: number, questions: number): string {
  return `Question ${number} of ${questions} · ${QUESTION_TYPE_WORDS.written}`;
}

/** “Rahul Verma’s answer”. */
export function answerTitle(student: string): string {
  return `${student}’s answer`;
}

/** Under “Your mark” (`span.fa-score-q`): “Question 4 · written answer, out of 10”. */
export function markFieldSub(number: number, max: number): string {
  return `Question ${number} · written answer, out of ${max}`;
}

/** Beside the score (`span.fa-scoreof`): “/ 10”. */
export function markOutOf(max: number): string {
  return `/ ${max}`;
}

/** The score's hint: “A whole number from 0 to 10.”. */
export function markHint(max: number): string {
  return `A whole number from 0 to ${max}.`;
}

/** “Feedback for Rahul (optional)”. */
export function feedbackLabel(first: string): string {
  return `Feedback for ${first} (optional)`;
}

/** The live total (`div.fa-total b`): “— of 16” until the mark is a whole number, then “11 of 16”. */
export function liveTotalWords(total: number | null, outOf: number): string {
  return `${total === null ? '—' : total} of ${outOf}`;
}

/** “ · pass mark 8” after a total's line; nothing while the version sets no pass mark. */
function passMarkTail(passMark: number | null): string {
  return passMark === null ? '' : ` · pass mark ${passMark}`;
}

/**
 * Under the live total: “4 marked automatically + the written mark · pass mark 8”, then “4 marked
 * automatically + 7 written · pass mark 8”.
 */
export function liveTotalLine(
  auto: number,
  written: number | null,
  passMark: number | null,
): string {
  const part = written === null ? 'the written mark' : `${written} written`;
  return `${auto} marked automatically + ${part}${passMarkTail(passMark)}`;
}

/** “7 Nov 2026, 10:15 · Dr S. Ranganathan” under “Marks confirmed”. */
export function confirmedByLine(when: string, by: string): string {
  return `${when} · ${by}`;
}

/** The confirmed total (`div.fa-done-total b`): “11 of 16 marks”. */
export function doneTotalWords(total: number, outOf: number): string {
  return `${total} of ${outOf} marks`;
}

/**
 * Beside it: “Passed · pass mark 8”, “Not passed · pass mark 8”; with no pass mark set, nothing
 * (state-copy `FA-19.pass-mark-unset`).
 */
export function passOutcomeWords(passed: boolean | null, passMark: number | null): string | null {
  if (passed === null || passMark === null) return null;
  return `${passed ? 'Passed' : 'Not passed'} · pass mark ${passMark}`;
}

/** A confirmed mark's key in the summary list: “Question 4”. */
export function questionNumberWords(number: number): string {
  return `Question ${number}`;
}

/** The pinned release terms as the screens read them (`PinnedRelease`, P4-06: the attempt's version). */
export interface ReleaseTerms {
  readonly option: 'immediately-after-marking' | 'after-deadline' | 'on-date' | null;
  /** The deadline or the release date, in words (“14 Nov 2026, 23:59”). */
  readonly on: string | null;
}

/**
 * The result's release once the marks are confirmed (`relSentence`, FA-19's panel and FA-21's
 * assessment panel): released after the deadline, “Result released to Rahul when the deadline
 * passed: 14 Nov 2026, 23:59.”; not yet, “Result not released to Rahul yet — after the deadline,
 * 14 Nov 2026, 23:59, as set for this assessment.” What the export cannot reach (not released yet
 * though set for immediately after marking; no release setting) is the register's
 * (`FA-19.release.*`).
 */
export function resultReleaseLine(
  first: string,
  terms: ReleaseTerms,
  released: boolean,
  confirmedAt: string | null,
): string {
  if (released) {
    if (terms.option === 'after-deadline' && terms.on !== null)
      return `Result released to ${first} when the deadline passed: ${terms.on}.`;
    if (terms.option === 'on-date' && terms.on !== null)
      return `Result released to ${first} on ${terms.on}, as set for this assessment.`;
    if (terms.option === 'immediately-after-marking' && confirmedAt !== null)
      return `Result released to ${first} when the marks were confirmed, ${confirmedAt}.`;
    return stateWords('FA-19.release.released').replace('{first}', first);
  }
  if (terms.option === 'after-deadline' && terms.on !== null)
    return `Result not released to ${first} yet — after the deadline, ${terms.on}, as set for this assessment.`;
  if (terms.option === 'on-date' && terms.on !== null)
    return `Result not released to ${first} yet — on ${terms.on}, as set for this assessment.`;
  if (terms.option === 'immediately-after-marking')
    return stateWords('FA-19.release.immediately').replace('{first}', first);
  return stateWords('FA-19.release.unset').replace('{first}', first);
}

/** The dialog's title: “Confirm marks for Rahul Verma?” (its line names the assessment). */
export function confirmTitle(student: string): string {
  return `Confirm marks for ${student}?`;
}

/** The dialog's first line: “Question 4 is marked 7 of 10.”. */
export function confirmMarkLine(number: number, mark: number, max: number): string {
  return `Question ${number} is marked ${mark} of ${max}.`;
}

/**
 * The dialog's total: “Rahul’s total becomes 11 of 16 marks — passed (pass mark 8).”; with no pass
 * mark set, “Rahul’s total becomes 11 of 16 marks.” (state-copy `FA-19.pass-mark-unset`).
 */
export function confirmTotalLine(
  first: string,
  total: number,
  outOf: number,
  passed: boolean | null,
  passMark: number | null,
): string {
  const lead = `${first}’s total becomes ${total} of ${outOf} marks`;
  if (passed === null || passMark === null) return `${lead}.`;
  return `${lead} — ${passed ? 'passed' : 'not passed'} (pass mark ${passMark}).`;
}

/** The dialog's second group (`div.rk-dlg-later > h3`): “When Rahul sees the result”. */
export function confirmLaterTitle(first: string): string {
  return `When ${first} sees the result`;
}

/**
 * When the Student sees the result, by the pinned version's terms (`relPlan`): `now` lines join
 * “What confirming does”; the others are the later group's. Immediately after marking, or a
 * deadline or release date already passed (on the session's clock): “Rahul sees the result as soon
 * as you confirm, as set for this assessment.” / “… as soon as you confirm — the deadline has
 * passed.”; else “Rahul sees the result after the deadline: 14 Nov 2026, 23:59, as set for this
 * assessment.” / “… on 20 Nov 2026, 09:00, as set for this assessment.”. No release setting: the
 * register's `FA-19.release.unset`.
 */
export function confirmReleasePlan(
  first: string,
  terms: ReleaseTerms,
  releasePassed: boolean,
): { readonly now: boolean; readonly text: string } {
  if (terms.option === 'immediately-after-marking')
    return {
      now: true,
      text: `${first} sees the result as soon as you confirm, as set for this assessment.`,
    };
  if (terms.option === null || terms.on === null)
    return { now: false, text: stateWords('FA-19.release.unset').replace('{first}', first) };
  if (releasePassed)
    return {
      now: true,
      text: `${first} sees the result as soon as you confirm — ${
        terms.option === 'on-date' ? 'the release date' : 'the deadline'
      } has passed.`,
    };
  return {
    now: false,
    text:
      terms.option === 'on-date'
        ? `${first} sees the result on ${terms.on}, as set for this assessment.`
        : `${first} sees the result after the deadline: ${terms.on}, as set for this assessment.`,
  };
}
