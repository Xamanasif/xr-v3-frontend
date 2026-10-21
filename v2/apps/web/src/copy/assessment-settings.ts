/**
 * FA-10 Assessment · Settings and FA-11 Assessment · Preview in the V3 Refined B design (the
 * owner-approved export design/v3-refined-b/roles/FA-v1, `project/Main.dc.html` "FA-10 Settings",
 * "FA-11 Preview" and the script's `vmSettings`, `vmPreview`). The rules form's sections, labels
 * and hints are `RULES_WORDS` (`assessments.ts`, shared by FA-07 and FA-10). Where the export
 * names who submitted and the submissions are not read yet, the product's words are state-copy
 * entries (`state-copy-assessment-settings.ts`), built by the formulas below.
 */
import { namesWords } from './assessment-record';
import { stateWords } from './state-copy';

/** FA-10. */
export const SETTINGS_PAGE = {
  /** `div.fa-fhead > h2#fa-tabh`. */
  title: 'Settings',
  line: 'Each value belongs to this assessment only. There is no time limit.',
  /** `div.rk-errsum > p.rk-errsum-t`. */
  summaryTitle: 'Check these settings',
  cancel: 'Cancel changes',
  save: 'Save settings',
  /** The busy button. */
  saving: 'Saving…',
  /** The saved notice when nothing makes a new version. */
  saved: 'Settings saved.',
  /** The export's "nothing to save" notice. */
  unchanged: 'Nothing to save — these are the settings already set.',
  /** The warning before a change that makes a new version. */
  newVersionTitle: 'This makes a new version',
  /** The warning before a change of when results are shown (P4-06). */
  releaseTitle: 'This changes when results are shown for new attempts',
  /** The side panel. */
  sideTitle: 'How changes apply',
  sideNameNote: 'Changing the name or the introduction never makes a new version.',
} as const;

/** "Settings saved as version 2." */
export function savedAsVersionWords(version: number): string {
  return `Settings saved as version ${version}.`;
}

/** "Rahul Verma has submitted." / "Rahul Verma and Priya Natarajan have submitted." */
function whoSubmitted(names: readonly string[] | null, count: number): string {
  if (names === null || names.length === 0) {
    return count === 1
      ? stateWords('FA-10.submitted-one')
      : stateWords('FA-10.submitted-many').replace('{n}', String(count));
  }
  return `${namesWords(names)} ${names.length === 1 ? 'has' : 'have'} submitted.`;
}

/**
 * The new-version warning: "Rahul Verma and Priya Natarajan have submitted. Their submissions keep
 * the rules they were answered under; new attempts use these." While the submissions are not
 * read, the count (`FA-10.submitted-*`, `FA-10.new-version-warning.*`).
 */
export function newVersionWarning(names: readonly string[] | null, count: number): string {
  const one = (names?.length ?? count) === 1;
  if (names === null || names.length === 0) {
    return `${whoSubmitted(null, count)} ${
      one
        ? stateWords('FA-10.new-version-warning.one')
        : stateWords('FA-10.new-version-warning.many')
    }`;
  }
  return `${whoSubmitted(names, count)} ${
    one
      ? 'That submission keeps the rules it was answered under; new attempts use these.'
      : 'Their submissions keep the rules they were answered under; new attempts use these.'
  }`;
}

/**
 * The release warning: "… have submitted. Submitted attempts keep the result terms of the version
 * they answered (after the deadline); new attempts use the terms you choose here." (P4-06: the
 * domain keeps the pinned terms.)
 */
export function releaseWarning(
  names: readonly string[] | null,
  count: number,
  current: string,
): string {
  return `${whoSubmitted(names, count)} Submitted attempts keep the result terms of the version they answered (${current.toLowerCase()}); new attempts use the terms you choose here.`;
}

/** "Version 1 · since 27 Oct 2026, 11:05" (`p.fa-side-ver`). */
export function sideVersionWords(version: number, since: string): string {
  return `Version ${version} · since ${since}`;
}

/**
 * "Rahul Verma and Priya Natarajan have submitted version 1. Changing a rule or when results are
 * shown makes version 2; their submissions keep version 1." / "No one has submitted version 1 yet,
 * so changes apply to it directly."
 */
export function sideLine(version: number, names: readonly string[] | null, count: number): string {
  if (count === 0)
    return `No one has submitted version ${version} yet, so changes apply to it directly.`;
  const who =
    names === null || names.length === 0
      ? count === 1
        ? '1 student has'
        : `${count} students have`
      : `${namesWords(names)} ${names.length === 1 ? 'has' : 'have'}`;
  const keep = count === 1 ? 'that submission keeps' : 'their submissions keep';
  return `${who} submitted version ${version}. Changing a rule or when results are shown makes version ${version + 1}; ${keep} version ${version}.`;
}

/**
 * After a save that changed when results are shown: "New attempts release their result after the
 * deadline." (`FA-10.saved-release-changed`), after the keep line.
 */
export function releaseChangedWords(release: string): string {
  return stateWords('FA-10.saved-release-changed').replace('{release}', release);
}

/** FA-11. */
export const PREVIEW_PAGE = {
  /** `h2.xr-sr#fa-tabh`. */
  heading: 'Preview',
  /** `div.fa-seg[aria-label]`. */
  viewLabel: 'Preview as',
  studentView: 'Student view',
  answerKey: 'Answer key',
  /** `p.rk-hint` beside the switch. */
  createsNothing: 'Previewing creates no attempt and saves nothing.',
  /** The student view's head. */
  asStudents: 'As students see it',
  /** The key's head. */
  keyTitle: 'Only you see the answer key and the marking guidance',
  keyLine: 'Students see correct answers and explanations only when their result is released.',
  /** A written answer's box in the student view. */
  writtenBox: 'The student’s written answer goes here. Your faculty marks written answers.',
  correct: 'Correct',
  explanation: 'Explanation',
  noExplanation: 'No explanation given.',
  markingGuidance: 'Marking guidance · only you see this',
  trueWord: 'True',
  falseWord: 'False',
  noTimeLimit: 'no time limit',
  noDeadline: 'no deadline yet',
  /** Nothing to preview (a draft without questions). */
  emptyTitle: 'Nothing to preview yet',
  emptyLine: 'Add a question first. Students can’t see an assessment without questions.',
  addQuestions: 'Add questions',
  /** The preview failing to load. */
  failedTitle: 'We couldn’t load the preview',
  failedLine: 'Nothing has changed, and no attempt was created. Try again.',
  tryAgain: 'Try again',
  /** A colleague's preview: its way back. */
  backToSummary: 'Back to Summary',
  help: 'Help',
} as const;

/** "Question 1 of 4 · Multiple choice" (`span.fa-sheetq-k`). */
export function questionHeading(position: number, count: number, type: string): string {
  return `Question ${position} of ${count} · ${type}`;
}

/**
 * "4 questions · 16 marks · due 14 Nov 2026, 23:59 · no time limit · version 2" (the export's
 * `facts`).
 */
export function studentViewLine(
  questionsAndMarks: string,
  due: string | null,
  version: number,
): string {
  return [
    questionsAndMarks,
    due ? `due ${due}` : PREVIEW_PAGE.noDeadline,
    PREVIEW_PAGE.noTimeLimit,
    ...(version > 1 ? [`version ${version}`] : []),
  ].join(' · ');
}
