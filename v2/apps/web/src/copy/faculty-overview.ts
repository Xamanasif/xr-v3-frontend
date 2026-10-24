/**
 * The words of FA-01 Overview, the Faculty workspace home, as the owner-approved V3 export draws it
 * (design/v3-refined-b/roles/FA-v1 `project/Main.dc.html`: the FA-01 template and the script's
 * `vmOverview`): the scope line, "Needs your attention" (the priority band), "Get your course ready"
 * for a new teacher, "Coming up" and "Your teaching". Written from the facts the reads answer
 * (`TeachingService.getFacultyOverview`, `MarkingService.listQueue`, `listMyCourses`,
 * `getTeachingExperiment`, `AssessmentService.listAssessments`): read models carry no words. Every
 * phrase here is the export's own, in its template or composed as its script composes it
 * (`overview.test.tsx`); what the export does not word is a provisional entry of the state-copy
 * register (`state-copy-faculty-overview.ts`). The export's sample names, counts and dates are never
 * copied: they come from the records. No line names an internal reference.
 */
import {
  activityByFormatLabel,
  FA_ASSESSMENT_STATE_WORDS,
  FA_PROGRESS_WORDS,
  faPlural,
} from './fa-shared';
import { stateWords } from './state-copy';

// The Faculty failed formula moved to the shared module (frozen); FA-18 and FA-19 import it here.
export { FACULTY_FAILED_WORDS } from './fa-shared';
// The words every teaching page shares with the other groups (`copy/fa-shared.ts`).
export { asOfWords, formatsHeldLabel } from './fa-shared';

/** "1 course", "2 experiments" — the export's `plural` (`faPlural`). */
export const counted = faPlural;

export const FACULTY_OVERVIEW_WORDS = {
  /** `section.rb-prio` "Needs your attention". */
  attention: 'Needs your attention',
  /** The band's note with more than one item (`p.rb-note`). */
  attentionNote: 'Marking first · oldest first in each',
  /** `div.rb-calm[role=status]`: nothing needs the Faculty member. */
  calmTitle: 'Nothing needs you right now',
  calmLine: 'Written answers to mark, drafts to review and inactive students appear here.',
  /** `section.rb-panel.fa-pane` "Coming up" and its note. */
  comingUp: 'Coming up',
  comingUpNote: 'Next 30 days',
  /** Coming up with no Ready assessment due in the next 30 days, once there is an assessment. */
  noDeadlines: 'No deadlines in the next 30 days.',
  /** Coming up before any assessment exists. */
  noDeadlinesYet: 'No deadlines yet. They appear here once you create an assessment.',
  /** `section.rb-panel.fa-pane` "Your teaching". */
  teaching: 'Your teaching',
  openCourse: 'Open course',
  /** An experiment no Student has been given yet (`p.fa-quiet`). */
  noStudentsLine: 'No students yet. They appear when your Institute Admin gives them access.',
  noStudents: 'No students yet',
  /** No courses: the message card (`section.rk-surface.fa-msgcard`) and its one link. */
  noCoursesTitle: 'Your Institute Admin hasn’t assigned you courses yet',
  noCoursesLine:
    'When they assign you a course in Faculty courses, its experiments, assessments and students appear here.',
  help: 'Help & support',
  /** The access-ended item's action (→ My courses, FA-02). */
  myCourses: 'My courses',
} as const;

/** The priority band's items, as `vmOverview` words them. */
export const ATTENTION_ITEMS = {
  written: {
    one: 'Written answer to mark',
    many: 'Written answers to mark',
    today: 'Submitted today',
    description: 'Choice questions are marked automatically.',
    listLabel: 'Waiting for marking, oldest first',
    action: 'Mark now',
  },
  inactive: {
    one: 'Student to follow up',
    many: 'Students to follow up',
    when: 'Inactive 14 days or more',
    listLabel: 'Students inactive for 14 days or more, longest first',
    action: 'View students',
    actionLabel: 'View students inactive for 14 days or more',
  },
} as const;

/** "You teach 1 course with 1 experiment, as assigned by your Institute Admin." (`p.rk-sub`). */
export function scopeLineWords(courses: number, experiments: number): string {
  return `You teach ${counted(courses, 'course')} with ${counted(
    experiments,
    'experiment',
  )}, as assigned by your Institute Admin.`;
}

/** "Oldest waiting 2 days" — the oldest written answer's wait in whole days. */
export function oldestWaitingWords(days: number): string {
  return days <= 0 ? ATTENTION_ITEMS.written.today : `Oldest waiting ${counted(days, 'day')}`;
}

/** "Across 2 assessments", "Across 3 experiments" — an item that spans several records. */
export function acrossWords(count: number, what: 'assessment' | 'experiment'): string {
  return `Across ${counted(count, what)}`;
}

/** "and 2 more in Marking", "and 1 more in Students" — after the three names shown. */
export function moreInWords(count: number, where: 'Marking' | 'Students'): string {
  return `and ${count} more in ${where}`;
}

/** "Mark now: Rahul Verma, Heat Exchanger — post-lab" (the action's accessible name). */
export function markNowLabel(student: string, assessment: string): string {
  return `${ATTENTION_ITEMS.written.action}: ${student}, ${assessment}`;
}

/**
 * The item of submissions without a written question, whose automatic marks wait for the Faculty
 * member's confirmation (owner decision of 24 Oct 2026; state-copy `FA-01.confirm-kind`): its kind,
 * its line and its action — FA-19's own “Confirm marks”.
 */
export const CONFIRM_ITEM = {
  kind: (count: number) =>
    stateWords(count === 1 ? 'FA-01.confirm-kind' : 'FA-01.confirm-kind-many'),
  description: () => stateWords('FA-01.confirm-description'),
  action: 'Confirm marks',
} as const;

/** "Confirm marks: Rahul Verma, Fin-Tube Bundle — quick check" (as `markNowLabel` composes it). */
export function confirmNowLabel(student: string, assessment: string): string {
  return `${CONFIRM_ITEM.action}: ${student}, ${assessment}`;
}

/** "Last active 19 Oct" / "No activity since access, 12 Oct" — an inactive Student's line. */
export function lastActiveWords(lastActive: string | null, accessGiven: string | null): string {
  if (lastActive !== null) return `Last active ${lastActive}`;
  return accessGiven === null
    ? stateWords('FA-01.inactive-no-date')
    : `No activity since access, ${accessGiven}`;
}

// ---- Get your course ready (a new teacher) --------------------------------------------------------

export const GET_READY = {
  title: 'Get your course ready',
  steps: {
    bank: {
      kind: 'Question bank',
      title: 'Write questions',
      description:
        'Your question bank is empty. Add questions, draft some with assistance, or import a file.',
      action: 'Add a question',
    },
    assessment: {
      kind: 'Assessment',
      title: 'Create the assessment',
      description: 'Set its rules and add questions. Students see it once it has a question.',
      action: 'Create assessment',
    },
    experiment: {
      kind: 'Experiment',
      title: 'Look at the experiment',
      description:
        'See the formats your institution has. Students appear when your Institute Admin gives them access.',
      action: 'Open experiment',
    },
  },
} as const;

/** "For Shell-and-Tube Heat Exchanger" — the experiment the steps are for (`p.rb-note`). */
export function getReadyNote(experiment: string): string {
  return `For ${experiment}`;
}

// ---- Coming up -------------------------------------------------------------------------------------

/** "Due 14 Nov 2026, 23:59". */
export function dueWords(deadline: string): string {
  return `Due ${deadline}`;
}

/** "2 of 5 students submitted", "0 of 1 student submitted". */
export function submittedWords(submitted: number, reach: number): string {
  return `${submitted} of ${counted(reach, 'student')} submitted`;
}

/** "Created by Dr S. Ranganathan" — a co-teaching colleague's assessment. */
export function createdByWords(name: string): string {
  return `Created by ${name}`;
}

/** "Open Heat Exchanger — post-lab, due 14 Nov 2026, 23:59" (the title link's accessible name). */
export function openDueLabel(name: string, deadline: string): string {
  return `Open ${name}, due ${deadline}`;
}

/** When students see their result, as the assessment's release rule says (`p.fa-upi-rel`). */
export function releaseRuleWords(
  option: 'immediately-after-marking' | 'after-deadline' | 'on-date',
  releaseDate: string | null,
): string {
  if (option === 'immediately-after-marking') {
    return 'Students see results as soon as answers are marked';
  }
  if (option === 'on-date' && releaseDate !== null) return `Students see results on ${releaseDate}`;
  return 'Students see results after the deadline';
}

// ---- Your teaching -------------------------------------------------------------------------------

/** "Open course ME ZG523 Thermodynamics & Heat Transfer". */
export function openCourseLabel(code: string | null, name: string): string {
  return code ? `Open course ${code} ${name}` : `Open course ${name}`;
}

/** "5 students with access" or "No students yet". */
export function reachWords(students: number): string {
  return students > 0
    ? `${counted(students, 'student')} with access`
    : FACULTY_OVERVIEW_WORDS.noStudents;
}

/** "Student activity by format for Shell-and-Tube Heat Exchanger, as of 7 Nov 2026". */
export const activityLabel = activityByFormatLabel;

/** The per-format counts' words after each `b` (`p.fa-prog-t`). */
export const PROGRESS_WORDS = FA_PROGRESS_WORDS;

/** The assessment line of an experiment: "Assessment ready" / "Assessment in draft" / none yet. */
export const TEACHING_STATUS = {
  ready: FA_ASSESSMENT_STATE_WORDS.readyLong,
  draft: FA_ASSESSMENT_STATE_WORDS.draftLong,
  none: FA_ASSESSMENT_STATE_WORDS.none,
} as const;

/** "Heat Exchanger — post-lab · created by Dr S. Ranganathan" (a colleague's assessment). */
export function assessmentByWords(name: string, colleague: string | null): string {
  return colleague === null ? name : `${name} · created by ${colleague}`;
}

// ---- Course access ended (a product state the export does not draw) ------------------------------

/**
 * "Your institution’s access to Shell-and-Tube Heat Exchanger ended on 7 Oct 2027" — the
 * experiment's name and the date its institution's access ended (B4-01 f3; state-copy
 * `FA-01.access-ended`).
 */
export function accessEndedTitle(experimentName: string, endedOn: string): string {
  return `Your institution’s access to ${experimentName} ended on ${endedOn}`;
}

const ACCESS_ENDED_LINE = 'students can’t open it now; their work and results are kept';

/**
 * "ME ZG523 · students can’t open it now; their work and results are kept" — the course code
 * Faculty see first; without one, the line alone (state-copy `FA-01.access-ended-no-code`).
 */
export function accessEndedSub(courseCode: string | null): string {
  return courseCode === null
    ? stateWords('FA-01.access-ended-no-code')
    : `${courseCode} · ${ACCESS_ENDED_LINE}`;
}
