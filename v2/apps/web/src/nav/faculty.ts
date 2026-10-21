import type { BreadcrumbLevel } from '@xr/ui';

import { assessmentName } from '@/copy/fa-shared';
import { WORKSPACE_NAV } from './nav-config';
import type { ScreenKey } from './screens';

/**
 * The Faculty workspace's Phase-4A pages (boards B4-01 … B4-07; Appendix A register routes): their
 * addresses, titles and places in the shell. Sidebar owners are the active-item map's (Overview;
 * My courses for FA-02 … FA-05; Assessments for FA-06 … FA-11; Question bank for FA-14, FA-15).
 *
 * Top bars as the boards draw them: a destination's own page has no crumbs (B4-01 f0 "Overview",
 * B4-02 f0 "My courses", B4-04 f0 "Assessments", B4-07 f0 "Question bank"); a tab of My courses is
 * crumbed under it (B4-02 f2 "My courses / Experiments"); a course "My courses / ME ZG523" (f1);
 * an experiment "My courses / ME ZG523 / Shell-and-Tube Heat Exchanger" (B4-03 f0); an
 * assessment's tab "Assessments / <name> / <tab>" (B4-05 f0 "Assessments / Heat Exchanger —
 * post-lab / Summary"); a question "Question bank / Add a question" (B4-07 f3).
 */
type FacultyDestination = 'FA-01' | 'FA-02' | 'FA-06' | 'FA-14' | 'FA-18' | 'FA-20';

const destinationOf = (screen: FacultyDestination) =>
  WORKSPACE_NAV.faculty.destinations.find((destination) => destination.screen === screen)!;

export const FACULTY_HOME_ADDRESS = destinationOf('FA-01').href;
export const FACULTY_MY_COURSES_ADDRESS = destinationOf('FA-02').href;
export const ASSESSMENTS_ADDRESS = destinationOf('FA-06').href;
export const QUESTION_BANK_ADDRESS = destinationOf('FA-14').href;
export const MARKING_ADDRESS = destinationOf('FA-18').href;
export const FACULTY_STUDENTS_ADDRESS = destinationOf('FA-20').href;
export const FACULTY_HELP_ADDRESS = WORKSPACE_NAV.faculty.help.href;

export const FACULTY_OVERVIEW_TITLE = destinationOf('FA-01').label;
export const FACULTY_MY_COURSES_TITLE = destinationOf('FA-02').label;
export const ASSESSMENTS_TITLE = destinationOf('FA-06').label;
export const QUESTION_BANK_TITLE = destinationOf('FA-14').label;
export const MARKING_TITLE = destinationOf('FA-18').label;
export const FACULTY_STUDENTS_TITLE = destinationOf('FA-20').label;

/** "Courses · Experiments" (board 05 / 06 section tabs of My courses). */
export const MY_COURSES_TABS = destinationOf('FA-02').sectionTabs as readonly [string, string];

/** FA-04: the Experiments tab of My courses (Appendix A rule T2: `?tab=experiments`). */
export const FACULTY_EXPERIMENTS_ADDRESS = `${FACULTY_MY_COURSES_ADDRESS}?tab=experiments`;

/** FA-03: `/faculty/courses/[courseId]`. */
export function facultyCourseAddress(courseId: string): string {
  return `${FACULTY_MY_COURSES_ADDRESS}/${encodeURIComponent(courseId)}`;
}

/** FA-05: `/faculty/experiments/[experimentId]`. */
export function facultyExperimentAddress(experimentId: string): string {
  return `/faculty/experiments/${encodeURIComponent(experimentId)}`;
}

/** The steps of FA-07 (Appendix A rule S1: the B4-04 stepper's labels as slugs). */
export const CREATE_STEPS = ['experiment', 'rules', 'questions', 'preview'] as const;
export type CreateStep = (typeof CREATE_STEPS)[number];

/**
 * FA-07: `/faculty/assessments/new?step=<slug>`; the first step carries no parameter. An
 * experiment chosen before (FA-05 "Create assessment") rides along as `?experimentId=`
 * (register: "Optional ?experimentId= pre-selection from FA-05").
 */
export function createAssessmentAddress(
  options: { readonly step?: CreateStep; readonly experimentId?: string } = {},
): string {
  const query = new URLSearchParams();
  if (options.step && options.step !== 'experiment') query.set('step', options.step);
  if (options.experimentId) query.set('experimentId', options.experimentId);
  const text = query.toString();
  return `${ASSESSMENTS_ADDRESS}/new${text ? `?${text}` : ''}`;
}

/** The assessment record's tabs (B4-05 / B4-06 `nav.xw-hubtabs`; Appendix A rule T1). */
export const ASSESSMENT_TABS = [
  'summary',
  'questions',
  'settings',
  'preview',
  'submissions',
] as const;
export type AssessmentTab = (typeof ASSESSMENT_TABS)[number];

/** The tab's screen (Submissions, FA-12, since Phase 4B). */
export const ASSESSMENT_TAB_SCREEN = {
  summary: 'FA-08',
  questions: 'FA-09',
  settings: 'FA-10',
  preview: 'FA-11',
  submissions: 'FA-12',
} as const satisfies Record<AssessmentTab, ScreenKey>;

/** `/faculty/assessments/[assessmentId]` and its tabs `/questions`, `/settings`, `/preview`, `/submissions`. */
export function assessmentAddress(assessmentId: string, tab: AssessmentTab = 'summary'): string {
  const record = `${ASSESSMENTS_ADDRESS}/${encodeURIComponent(assessmentId)}`;
  return tab === 'summary' ? record : `${record}/${tab}`;
}

/** FA-11's Answer key view (register: "optional ?view=key", rule T3). */
export const PREVIEW_KEY_VIEW = 'key';

/** FA-15: `/faculty/question-bank/new` (optionally for an experiment) and `/faculty/question-bank/[questionId]`. */
export function newQuestionAddress(
  options: { readonly experimentId?: string; readonly returnTo?: string } = {},
): string {
  const query = new URLSearchParams();
  if (options.experimentId) query.set('experimentId', options.experimentId);
  if (options.returnTo) query.set('returnTo', options.returnTo);
  const text = query.toString();
  return `${QUESTION_BANK_ADDRESS}/new${text ? `?${text}` : ''}`;
}

export function questionAddress(questionId: string): string {
  return `${QUESTION_BANK_ADDRESS}/${encodeURIComponent(questionId)}`;
}

/** FA-14 for one experiment (`?experimentId=`, the bank's Experiment filter). */
export function questionBankAddress(experimentId?: string): string {
  return experimentId
    ? `${QUESTION_BANK_ADDRESS}?experimentId=${encodeURIComponent(experimentId)}`
    : QUESTION_BANK_ADDRESS;
}

/** A page's place in the shell (the shape `useShellPage` takes). */
export interface FacultyPlacement {
  readonly screen: ScreenKey;
  readonly title: string;
  readonly trail: readonly BreadcrumbLevel[];
  readonly currentCrumb?: string;
}

const MY_COURSES_CRUMB: BreadcrumbLevel = {
  label: FACULTY_MY_COURSES_TITLE,
  href: FACULTY_MY_COURSES_ADDRESS,
};
const ASSESSMENTS_CRUMB: BreadcrumbLevel = { label: ASSESSMENTS_TITLE, href: ASSESSMENTS_ADDRESS };
const QUESTION_BANK_CRUMB: BreadcrumbLevel = {
  label: QUESTION_BANK_TITLE,
  href: QUESTION_BANK_ADDRESS,
};

export function facultyOverviewPlacement(): FacultyPlacement {
  return { screen: 'FA-01', title: FACULTY_OVERVIEW_TITLE, trail: [] };
}

export function facultyMyCoursesPlacement(): FacultyPlacement {
  return { screen: 'FA-02', title: FACULTY_MY_COURSES_TITLE, trail: [] };
}

/** B4-02 f2: "My courses / Experiments". */
export function facultyExperimentsPlacement(): FacultyPlacement {
  const tab = MY_COURSES_TABS[1];
  return { screen: 'FA-04', title: tab, trail: [MY_COURSES_CRUMB], currentCrumb: tab };
}

/** B4-02 f1: "My courses / ME ZG523"; while it loads, "My courses". */
export function facultyCoursePlacement(
  course: { readonly name: string; readonly crumb: string } | null,
): FacultyPlacement {
  if (course === null) return { screen: 'FA-03', title: FACULTY_MY_COURSES_TITLE, trail: [] };
  return {
    screen: 'FA-03',
    title: course.name,
    trail: [MY_COURSES_CRUMB],
    currentCrumb: course.crumb,
  };
}

/** B4-03 f0: "My courses / ME ZG523 / Shell-and-Tube Heat Exchanger". */
export function facultyExperimentPlacement(
  experiment: {
    readonly name: string;
    readonly course: { readonly crumb: string; readonly courseId: string } | null;
  } | null,
): FacultyPlacement {
  if (experiment === null) return { screen: 'FA-05', title: FACULTY_MY_COURSES_TITLE, trail: [] };
  return {
    screen: 'FA-05',
    title: experiment.name,
    trail: [
      MY_COURSES_CRUMB,
      ...(experiment.course
        ? [
            {
              label: experiment.course.crumb,
              href: facultyCourseAddress(experiment.course.courseId),
            },
          ]
        : []),
    ],
    currentCrumb: experiment.name,
  };
}

export function assessmentsPlacement(): FacultyPlacement {
  return { screen: 'FA-06', title: ASSESSMENTS_TITLE, trail: [] };
}

/** B4-04 f1: "Assessments / Create assessment". */
export function createAssessmentPlacement(title: string): FacultyPlacement {
  return { screen: 'FA-07', title, trail: [ASSESSMENTS_CRUMB], currentCrumb: title };
}

/**
 * B4-05 f0: "Assessments / Heat Exchanger — post-lab / Summary" — the name opens the Summary
 * (B4-06 f7 "Assessments / Heat Exchanger — post-lab / Submissions"). While the record loads, the
 * tab's name under "Assessments". An assessment is named by its content (FA-v1, the owner's
 * identifier rule): its name, or "Untitled draft" while it has none — never its id, which only
 * the crumb's address carries.
 */
export function assessmentTabPlacement(
  tab: AssessmentTab,
  tabTitle: string,
  assessment: { readonly id: string; readonly name: string } | null,
): FacultyPlacement {
  const screen = ASSESSMENT_TAB_SCREEN[tab];
  if (assessment === null)
    return { screen, title: tabTitle, trail: [ASSESSMENTS_CRUMB], currentCrumb: tabTitle };
  return {
    screen,
    title: tabTitle,
    trail: [
      ASSESSMENTS_CRUMB,
      { label: assessmentName(assessment.name), href: assessmentAddress(assessment.id) },
    ],
    currentCrumb: tabTitle,
  };
}

export function questionBankPlacement(): FacultyPlacement {
  return { screen: 'FA-14', title: QUESTION_BANK_TITLE, trail: [] };
}

/** B4-07 f3: "Question bank / Add a question" (f4: "Question bank / Edit question"). */
export function questionPlacement(title: string): FacultyPlacement {
  return { screen: 'FA-15', title, trail: [QUESTION_BANK_CRUMB], currentCrumb: title };
}

// ---- Phase 4B (B4-06 f7 … f11, B4-08 … B4-10) ----

/** FA-16 (B4-08 f0): `/faculty/question-bank/draft`, for an experiment (`?experimentId=`). */
export function draftQuestionsAddress(experimentId?: string): string {
  return experimentId
    ? `${QUESTION_BANK_ADDRESS}/draft?experimentId=${encodeURIComponent(experimentId)}`
    : `${QUESTION_BANK_ADDRESS}/draft`;
}

/** FA-17 (B4-08 f5): `/faculty/question-bank/import`, for an experiment (`?experimentId=`). */
export function importQuestionsAddress(experimentId?: string): string {
  return experimentId
    ? `${QUESTION_BANK_ADDRESS}/import?experimentId=${encodeURIComponent(experimentId)}`
    : `${QUESTION_BANK_ADDRESS}/import`;
}

/** FA-14's "Drafts to review" tab (B4-07 tab strip; Appendix A rule T2 `?tab=drafts`). */
export function draftsToReviewAddress(experimentId?: string): string {
  const query = new URLSearchParams({ tab: 'drafts' });
  if (experimentId) query.set('experimentId', experimentId);
  return `${QUESTION_BANK_ADDRESS}?${query.toString()}`;
}

/** FA-18 for one assessment and state (`?assessmentId=`, `?state=marked | all`; waiting is the default). */
export function markingQueueAddress(
  options: { readonly assessmentId?: string; readonly state?: 'waiting' | 'marked' | 'all' } = {},
): string {
  const query = new URLSearchParams();
  if (options.assessmentId) query.set('assessmentId', options.assessmentId);
  if (options.state && options.state !== 'waiting') query.set('state', options.state);
  const text = query.toString();
  return `${MARKING_ADDRESS}${text ? `?${text}` : ''}`;
}

/** FA-19: `/faculty/marking/[attemptId]`. */
export function markSubmissionAddress(attemptId: string): string {
  return `${MARKING_ADDRESS}/${encodeURIComponent(attemptId)}`;
}

/** FA-20 for one experiment (`?experimentId=`). */
export function facultyStudentsAddress(experimentId?: string): string {
  return experimentId
    ? `${FACULTY_STUDENTS_ADDRESS}?experimentId=${encodeURIComponent(experimentId)}`
    : FACULTY_STUDENTS_ADDRESS;
}

/** FA-21: `/faculty/students/[studentId]?experimentId=` (the detail is per experiment). */
export function facultyStudentAddress(studentId: string, experimentId: string): string {
  return `${FACULTY_STUDENTS_ADDRESS}/${encodeURIComponent(studentId)}?experimentId=${encodeURIComponent(experimentId)}`;
}

const MARKING_CRUMB: BreadcrumbLevel = { label: MARKING_TITLE, href: MARKING_ADDRESS };
const STUDENTS_CRUMB: BreadcrumbLevel = {
  label: FACULTY_STUDENTS_TITLE,
  href: FACULTY_STUDENTS_ADDRESS,
};

/** B4-08 f0 "Question bank / Draft with assistance"; f5 "Question bank / Import questions". */
export function questionToolPlacement(screen: 'FA-16' | 'FA-17', title: string): FacultyPlacement {
  return { screen, title, trail: [QUESTION_BANK_CRUMB], currentCrumb: title };
}

export function markingPlacement(): FacultyPlacement {
  return { screen: 'FA-18', title: MARKING_TITLE, trail: [] };
}

/**
 * B4-09 f1 "Marking / Rahul Verma" (crumbs from 1024 px); below 1024 the top bar reads the page's
 * name, "Mark a submission" (f2, f3, f7, f8). While it loads, "Marking".
 */
export const MARK_SUBMISSION_TITLE = 'Mark a submission';

export function markSubmissionPlacement(studentName: string | null): FacultyPlacement {
  if (studentName === null) return { screen: 'FA-19', title: MARKING_TITLE, trail: [] };
  return {
    screen: 'FA-19',
    title: MARK_SUBMISSION_TITLE,
    trail: [MARKING_CRUMB],
    currentCrumb: studentName,
  };
}

export function facultyStudentsPlacement(): FacultyPlacement {
  return { screen: 'FA-20', title: FACULTY_STUDENTS_TITLE, trail: [] };
}

/** B4-10 f3 "Students / Rahul Verma"; while it loads, "Students". */
export function facultyStudentPlacement(studentName: string | null): FacultyPlacement {
  if (studentName === null) return { screen: 'FA-21', title: FACULTY_STUDENTS_TITLE, trail: [] };
  return {
    screen: 'FA-21',
    title: studentName,
    trail: [STUDENTS_CRUMB],
    currentCrumb: studentName,
  };
}
