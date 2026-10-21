/**
 * The words of the Student's access screens — ST-01 Home (B2-10), ST-02 My courses and ST-03
 * Course (B2-11), ST-05 Experiment hub (B2-12) and the ST-19 "Experiment not available" state
 * (B2-11 f12, B2-12 f4, f6; B2-13 f1–f3) — Phase-2 Package 2A. Every string here is a board's own
 * (`student.test.ts` finds each on its board); what no board words is a provisional entry of the
 * state-copy register (`state-copy-student.ts`, VD-12) and is read from there. Names, codes,
 * counts and formats are the sample world's, never typed here.
 */
import { FORMAT_META, type FormatCode, type Technology } from '@xr/domain';
import { stDateTime, stDay } from './st-shared';

type ProgressStatus = 'not-started' | 'in-progress' | 'completed';

function plural(count: number, word: string): string {
  return count === 1 ? `1 ${word}` : `${count} ${word}s`;
}

/** The format as the boards write it on its chip and in sentences ("WEB", "VR"). */
export function formatCode(format: Technology): FormatCode {
  return FORMAT_META[format].code;
}

/**
 * Codes in a sentence: "WEB", "WEB and VR" (B2-10, B2-11, B2-12); three or more follow the same
 * form, "WEB, AR and VR" (state-copy `ST-02.format-list`).
 */
export function formatList(formats: readonly Technology[]): string {
  const codes = formats.map(formatCode);
  if (codes.length <= 1) return codes[0] ?? '';
  return `${codes.slice(0, -1).join(', ')} and ${codes.at(-1)!}`;
}

/** A format's progress as a label beside its code: "Not started", "In progress" (B2-10 f4, B2-11 f1), "Completed" (B3-05). */
export function progressLabel(progress: ProgressStatus): string {
  switch (progress) {
    case 'not-started':
      return 'Not started';
    case 'in-progress':
      return 'In progress';
    case 'completed':
      return 'Completed';
  }
}

/** The same in a sentence: "WEB not started", "WEB in progress" (B2-12 f0, f1), "WEB completed" (B3-02). */
export function progressInSentence(format: Technology, progress: ProgressStatus): string {
  return `${formatCode(format)} ${progressLabel(progress).toLowerCase()}`;
}

/** "ME ZG523 · Thermodynamics & Heat Transfer" (B2-10 f1, B2-11 f1, B2-12 f0), or the name alone. */
export function courseLine(code: string | null, courseName: string): string {
  return code ? `${code} · ${courseName}` : courseName;
}

// ---- shared Student words -----------------------------------------------------------------

export const STUDENT_WORDS = {
  help: 'Help',
  openCourse: 'Open course',
  availableToYou: 'Available to you:',
  earlierWork: 'Earlier work',
  paused: 'Paused',
  tryAgain: 'Try again',
  failedLine: 'Nothing has changed. Try again.',
} as const;

/** "Open course Thermodynamics & Heat Transfer" (B2-10 f1, B2-11 f0 `aria-label`). */
export function openCourseLabel(courseName: string): string {
  return `Open course ${courseName}`;
}

/** "1 experiment given to you" (B2-10 f1, B2-11 f0, f1; B2-11 script `count`). */
export function experimentsGivenWords(count: number): string {
  return `${plural(count, 'experiment')} given to you`;
}

// ---- ST-01 Home (B2-10) -------------------------------------------------------------------

export const HOME_PAGE = {
  startHere: 'Start here',
  upNext: 'Up next',
  noAccessTitle: 'Your institution hasn’t given you access yet',
  noAccessLine: 'When it gives you an experiment, it appears here and in My courses.',
  pausedTitle: 'You can’t open experiments right now',
  pausedLine:
    'Your institution’s access is paused. Your work is kept, and you can continue when it’s lifted.',
  inactiveTitle: 'Your account is inactive',
  inactiveLine:
    'You can’t open experiments until your institution reactivates your account. Your work is kept.',
  assessmentSub: 'Assessment · to do',
  openExperimentShort: 'Open experiment',
} as const;

/** "Hello, Rahul" (B2-10 f0 … f9); "Hello, Priya" (B2-13 f6). */
export function greeting(firstName: string): string {
  return `Hello, ${firstName}`;
}

/** "An assessment for Shell-and-Tube Heat Exchanger is ready" (B2-10 f5). */
export function assessmentReadyWords(experimentName: string): string {
  return `An assessment for ${experimentName} is ready`;
}

/** "Give feedback on WEB" (B2-10 f5). */
export function giveFeedbackWords(format: Technology): string {
  return `Give feedback on ${formatCode(format)}`;
}

/** "VR is waiting for you" (B2-10 f5). */
export function formatWaitingWords(format: Technology): string {
  return `${formatCode(format)} is waiting for you`;
}

// ---- ST-02 My courses (B2-11) -------------------------------------------------------------

export const MY_COURSES_PAGE = {
  meta: 'Courses with experiments your institution has given you',
  noAccessTitle: 'Your institution hasn’t given you access yet',
  noAccessLine: 'Courses appear here when your institution gives you an experiment in them.',
  nothingNowTitle: 'No experiments are given to you right now',
  nothingNowLine: 'Your earlier work is kept below.',
  loading: 'Loading your courses',
  failedTitle: 'We couldn’t load your courses',
} as const;

/** B2-11 `nav.xr-tabs` "My courses": "Courses · All experiments" (ST-02 / ST-04; Package 2B). */
export const MY_COURSES_TABS = {
  label: 'My courses',
  courses: 'Courses',
  experiments: 'All experiments',
} as const;

// ---- ST-04 All experiments (B2-11 f2, f4, f15; Package 2B) ---------------------------------

export const ALL_EXPERIMENTS_PAGE = {
  searchLabel: 'Search',
  searchPlaceholder: 'Experiment or course',
  formatLabel: 'Format',
  allFormats: 'All formats',
  clearFilters: 'Clear filters',
  noMatchTitle: 'No experiments match',
  noAccessTitle: 'Your institution hasn’t given you access yet',
  noAccessLine: 'Experiments appear here when your institution gives them to you.',
  loading: 'Loading your experiments',
  failedTitle: 'We couldn’t load your experiments',
} as const;

/** B2-11 `chips`: "Search: “Fin-Tube”", "Format: WEB". */
export function experimentSearchChip(search: string): string {
  return `Search: “${search.trim()}”`;
}

export function formatChip(format: Technology): string {
  return `Format: ${formatCode(format)}`;
}

// ---- ST-03 Course (B2-11 f1, f6, f14) ------------------------------------------------------

/** "Open Shell-and-Tube Heat Exchanger" (B2-11 f1 `aria-label` of "Open"). */
export function openExperimentLabel(name: string): string {
  return `Open ${name}`;
}

// ---- ST-05 Experiment hub (B2-12) ----------------------------------------------------------

export const HUB_PAGE = {
  formatsLabel: 'Formats for you',
  nextSteps: 'Your next steps',
  resources: 'Resources',
  simulation: 'Simulation',
  assessment: 'Assessment',
  suggestedOrder:
    'Suggested order: resources, then a simulation, then the assessment. Nothing is locked.',
  pausedResources: 'Not available while your institution’s access is paused.',
  pausedSimulation:
    'Not available while your institution’s access is paused. Your progress is kept.',
  nothingToDo: 'Nothing to do here yet.',
  noAssessment: 'Your faculty hasn’t set an assessment for this experiment yet.',
  eachFormatOwnProgress: 'Each format has its own progress.',
  about: 'About this experiment',
  course: 'Course',
  area: 'Engineering area',
  whatYouNeed: 'What you need',
  outcomes: 'Learning outcomes',
  sameForEveryFormat: 'The same for every format.',
} as const;

/** The per-format words of the hub's header (B2-12 f0, f2, f3). */
export const HUB_AVAILABILITY = {
  'available-to-you': 'Available to you',
  'not-included-for-your-institution': 'Not included for your institution',
  'not-available-for-this-experiment': 'Not available for this experiment',
  'not-available-right-now': 'Not available right now',
} as const;

/** "Step 1 of 3" (B2-12 f0). */
export function stepWords(step: 1 | 2 | 3): string {
  return `Step ${step} of 3`;
}

/** "3 resources · none opened yet." (B2-12 f0). */
export function resourcesNoneOpenedWords(total: number): string {
  return `${plural(total, 'resource')} · none opened yet.`;
}

/**
 * Provisional (state-copy `ST-05.resources-opened`): "3 resources · 1 opened. 2 more to read.",
 * "3 resources · all opened." — B2-12 f1 names the resource and its date, which the read does not.
 */
export function resourcesOpenedWords(total: number, opened: number): string {
  return opened >= total
    ? `${plural(total, 'resource')} · all opened.`
    : `${plural(total, 'resource')} · ${opened} opened. ${total - opened} more to read.`;
}

/**
 * "WEB and VR are available to you." (B2-12 f0); "WEB is available to you; VR is not available
 * right now." (B2-12 f2).
 */
export function simulationAvailabilityWords(
  available: readonly Technology[],
  notRightNow: readonly Technology[],
): string {
  const verb = (formats: readonly Technology[]) => (formats.length === 1 ? 'is' : 'are');
  const parts: string[] = [];
  if (available.length > 0) {
    parts.push(`${formatList(available)} ${verb(available)} available to you`);
  }
  if (notRightNow.length > 0) {
    parts.push(`${formatList(notRightNow)} ${verb(notRightNow)} not available right now`);
  }
  return parts.length > 0 ? `${parts.join('; ')}.` : '';
}

/** "WEB not started · VR not started." (B2-12 f0); "WEB in progress · VR not started." (f1). */
export function simulationProgressWords(
  formats: readonly { readonly format: Technology; readonly progress: ProgressStatus }[],
): string {
  return `${formats.map((row) => progressInSentence(row.format, row.progress)).join(' · ')}.`;
}

/** "laptop or desktop with a current web browser" (B2-12 f0 "What you need", after "WEB — "). */
export function deviceNeedsWords(deviceNeeds: string): string {
  return deviceNeeds.charAt(0).toLowerCase() + deviceNeeds.slice(1);
}

// ---- ST-19 Experiment not available (B2-11 f12, B2-12 f4, f6; B2-13 f3) ---------------------

export const NOT_AVAILABLE = {
  /** The top bar's title and current crumb (B2-11 f12, B2-12 f4: "My courses / Not available"). */
  title: 'Not available',
  notGivenTitle: 'This experiment isn’t available to you',
  noLongerTitle: 'This experiment is no longer given to you',
  back: 'Back to My courses',
} as const;

/** "Your institution hasn’t given you Shell-and-Tube Heat Exchanger. Experiments you can open are in My courses." (B2-11 f12). */
export function notGivenLine(name: string): string {
  return `Your institution hasn’t given you ${name}. Experiments you can open are in My courses.`;
}

/** "Your institution no longer gives you Shell-and-Tube Heat Exchanger. Your work is kept." (B2-12 f4). */
export function noLongerLine(name: string): string {
  return `Your institution no longer gives you ${name}. Your work is kept.`;
}

/** "Your access to Shell-and-Tube Heat Exchanger has ended" (B2-12 f6). */
export function endedTitle(name: string): string {
  return `Your access to ${name} has ended`;
}

// ---- V3 (owner-approved Student export ST-v1, `StudentFinal.dc.html`) — ST-01 … ST-04, ST-19 ----
// New keys only: the words above stay as other screens and roles read them. Each string here is
// the export's own (`student.test.ts` "the V3 words" finds each in its template or script); none
// names a record by its internal reference (lead decision 3).

/** ST-01 Home (`homeVM`, `nextStep`). */
export const HOME_V3 = {
  continueLearning: 'Continue learning',
  yourExperiment: 'Your experiment',
  nextStep: 'Your next step',
  alsoIn: 'Also in this experiment',
  inThis: 'In this experiment',
  learning: 'What you’re learning',
  sameInEvery: 'The same in every format',
  howItWorks: 'How it works',
  how: [
    'Your institution gives you an experiment, with the formats you can use.',
    'Read its resources, then run a simulation. Nothing is locked.',
    'Answer the assessment when your faculty sets one.',
  ],
  inactiveTitle: 'You can’t open experiments right now',
  inactiveLine: 'Your work is kept and will be here when your account is reactivated.',
  pausedStep: 'You can carry on from where you left off when the pause is lifted.',
  waitingTitle: 'You’re waiting for a licence',
  resourcesTitle: 'Start with the resources',
  resourcesAction: 'Open resources',
  simulationTitle: 'Run a simulation',
  simulationLine: 'Each format has its own progress.',
  simulationAction: 'Choose a format',
  assessmentTitle: 'Start the assessment',
  assessmentAction: 'Open assessment',
  attemptTitle: 'Finish your attempt',
  attemptLine: 'Your answers are saved.',
  attemptAction: 'Continue attempt',
  nothingTitle: 'Nothing else is waiting for you right now',
  nothingLine: 'Your work on each format is kept in Progress.',
  resources: 'Resources',
  assessment: 'Assessment',
  seeEarlierWork: 'See earlier work',
  noAssessment: 'Not set by your faculty yet',
  attemptInProgress: 'Attempt in progress · answers saved',
  waitingForMarking: 'Submitted · waiting for marking',
  resultNotReleased: 'Result not released yet',
  feedbackToGive: 'feedback to give',
} as const;

/** "Continue in your browser" (WEB), "Continue on your headset" (a headset format). */
export function continueInWords(format: Technology): string {
  return format === 'web' ? 'Continue in your browser' : 'Continue on your headset';
}

/** "WEB is in progress." — the export's "Last saved …" follows only where a read holds it. */
export function inProgressLine(format: Technology): string {
  return `${formatCode(format)} is in progress.`;
}

/** "Feedback on WEB is open". */
export function feedbackOpenTitle(format: Technology): string {
  return `Feedback on ${formatCode(format)} is open`;
}

/** "You completed WEB." — the export's "on <date>" needs the completion date, which Home does not read. */
export function completedLine(format: Technology): string {
  return `You completed ${formatCode(format)}.`;
}

/** "Set up VR". */
export function setUpWords(format: Technology): string {
  return `Set up ${formatCode(format)}`;
}

/** "VR is waiting for you." */
export function waitingForYouLine(format: Technology): string {
  return `${formatCode(format)} is waiting for you.`;
}

/** "Heat Exchanger — post-lab is due 14 Nov 2026, 23:59." */
export function assessmentDueLine(assessmentName: string, deadline: string): string {
  return `${assessmentName} is due ${stDateTime(deadline)}.`;
}

/** The Resources step's line: "3 resources · none opened yet". */
export function resourcesNoneLine(total: number): string {
  return `${plural(total, 'resource')} · none opened yet`;
}

/** The Resources item: "None opened yet · 3 to read", "1 of 3 opened", "All 3 opened". */
export function resourcesItemWords(total: number, opened: number): string {
  if (opened === 0) return `None opened yet · ${total} to read`;
  if (opened >= total) return `All ${total} opened`;
  return `${opened} of ${total} opened`;
}

/** The Assessment item while it is to do: "Ready · due 14 Nov 2026, 23:59" (or "Ready"). */
export function assessmentReadyItem(deadline: string | null): string {
  return deadline === null ? 'Ready' : `Ready · due ${stDateTime(deadline)}`;
}

/** The Assessment item once released: "Result released 14 Nov 2026". */
export function resultReleasedItem(releasedAt: string): string {
  return `Result released ${stDay(releasedAt)}`;
}

/** "Thermodynamics & Heat Transfer, open course" (the cover's course link). */
export function courseLinkLabel(courseName: string): string {
  return `${courseName}, open course`;
}

/** "Open experiment, Shell-and-Tube Heat Exchanger" (the cover's "Open experiment"). */
export function coverOpenLabel(experimentName: string): string {
  return `Open experiment, ${experimentName}`;
}

/** ST-02 / ST-04 (`coursesVM`, `courseCard`, `xcard`). */
export const MY_COURSES_V3 = {
  listHeading: 'Your courses',
  loadingCourses: 'Loading your courses…',
  loadingExperiments: 'Loading your experiments…',
  coursesNone: 'Courses appear here when your institution gives you an experiment in them.',
  experimentsNone: 'Experiments appear here when your institution gives them to you.',
  allHeading: 'All the experiments given to you',
  filterLabel: 'Filter your experiments',
  listLabel: 'Experiments',
  noMatchLine:
    'Only experiments your institution has given you are listed. Try fewer filters or a different spelling.',
  waiting: 'Waiting for a licence',
} as const;

/** "Experiments given to you in Thermodynamics & Heat Transfer" (a course's list). */
export function experimentsInCourseLabel(courseName: string): string {
  return `Experiments given to you in ${courseName}`;
}

/** "Your formats for Shell-and-Tube Heat Exchanger" (a row's formats). */
export function yourFormatsLabel(experimentName: string): string {
  return `Your formats for ${experimentName}`;
}

/** ST-04's count: "1 experiment in 1 course", or "1 of 3 experiments" while a filter applies. */
export function experimentsCountWords(
  shown: number,
  total: number,
  courses: number,
  filtered: boolean,
): string {
  return filtered
    ? `${shown} of ${plural(total, 'experiment')}`
    : `${plural(total, 'experiment')} in ${plural(courses, 'course')}`;
}

/** "Remove filter Search: “fin”" (a chip's button). */
export function removeFilterLabel(chip: string): string {
  return `Remove filter ${chip}`;
}

/** ST-03 (`courseVM`, `msg('course-none')`). */
export const COURSE_V3 = {
  kind: 'Course',
  experimentsHeading: 'Experiments given to you',
  onlyGiven: 'Only experiments given to you are listed',
  noneTitle: 'This course has no experiments for you right now',
} as const;

/** ST-19 (`msg('notgiven')`): "Your institution hasn’t given you Fin-Tube Bundle." with experiments listed below. */
export function notGivenShortLine(name: string): string {
  return `Your institution hasn’t given you ${name}.`;
}

/** ST-19's list of what the Student can open instead. */
export const NOT_AVAILABLE_V3 = {
  openInstead: 'Experiments you can open',
} as const;
