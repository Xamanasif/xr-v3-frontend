import type { BreadcrumbLevel } from '@xr/ui';

import { WORKSPACE_NAV } from './nav-config';
import type { ScreenKey } from './screens';
import { myExperimentAddress } from './student';

/**
 * The Student's Phase-4B assessment pages (boards B4-11 … B4-13; Appendix A register routes):
 * Assessments (ST-11), "Before you start" (ST-12), the attempt (ST-13, a focused page without the
 * shell) and the result (ST-14). Assessments is current in the sidebar for ST-11, ST-12 and
 * ST-14. Top bars as the boards draw them: "Assessments" (B4-11 f0), "Assessments / Heat
 * Exchanger — post-lab" (f11), "Assessments / Heat Exchanger — post-lab / Result" (B4-13 f0).
 */
const destination = WORKSPACE_NAV.student.destinations.find((entry) => entry.screen === 'ST-11')!;

export const STUDENT_ASSESSMENTS_ADDRESS = destination.href;
export const STUDENT_ASSESSMENTS_TITLE = destination.label;

/** ST-11's state tabs (B4-11 f0: "To do (1) · Submitted (0) · Results (0)"; rule T2 `?tab=`). */
export const STUDENT_ASSESSMENT_TABS = ['to-do', 'submitted', 'results'] as const;
export type StudentAssessmentTab = (typeof STUDENT_ASSESSMENT_TABS)[number];

export function studentAssessmentsAddress(tab: StudentAssessmentTab = 'to-do'): string {
  return tab === 'to-do'
    ? STUDENT_ASSESSMENTS_ADDRESS
    : `${STUDENT_ASSESSMENTS_ADDRESS}?tab=${tab}`;
}

/** ST-12 `/student/assessments/[assessmentId]`; ST-13 `/attempt`; ST-14 `/result`. */
export function studentAssessmentAddress(
  assessmentId: string,
  view: 'intro' | 'attempt' | 'result' = 'intro',
): string {
  const page = `${STUDENT_ASSESSMENTS_ADDRESS}/${encodeURIComponent(assessmentId)}`;
  return view === 'intro' ? page : `${page}/${view}`;
}

/** The hub's Assessment tab (B4-11 f7 … f9): `/student/experiments/[experimentId]/assessment`. */
export function hubAssessmentAddress(experimentId: string): string {
  return `${myExperimentAddress(experimentId)}/assessment`;
}

/** "Back to experiment" (B4-11 f11, B4-12 f4, B4-13 f0): the experiment hub's Overview. */
export { myExperimentAddress as experimentAddress } from './student';

export interface StudentAssessmentPlacement {
  readonly screen: ScreenKey;
  readonly title: string;
  readonly trail: readonly BreadcrumbLevel[];
  readonly currentCrumb?: string;
}

const ASSESSMENTS_CRUMB: BreadcrumbLevel = {
  label: STUDENT_ASSESSMENTS_TITLE,
  href: STUDENT_ASSESSMENTS_ADDRESS,
};

export function studentAssessmentsPlacement(): StudentAssessmentPlacement {
  return { screen: 'ST-11', title: STUDENT_ASSESSMENTS_TITLE, trail: [] };
}

/** B4-11 f11: "Assessments / Heat Exchanger — post-lab"; while it loads, "Assessments". */
export function studentAssessmentPlacement(
  assessment: { readonly name: string } | null,
): StudentAssessmentPlacement {
  if (assessment === null) return { screen: 'ST-12', title: STUDENT_ASSESSMENTS_TITLE, trail: [] };
  return {
    screen: 'ST-12',
    title: assessment.name,
    trail: [ASSESSMENTS_CRUMB],
    currentCrumb: assessment.name,
  };
}

/** B4-13 f0: "Assessments / Heat Exchanger — post-lab / Result". */
export function studentResultPlacement(
  resultTitle: string,
  assessment: { readonly id: string; readonly name: string } | null,
): StudentAssessmentPlacement {
  return {
    screen: 'ST-14',
    title: resultTitle,
    trail: [
      ASSESSMENTS_CRUMB,
      ...(assessment
        ? [{ label: assessment.name, href: studentAssessmentAddress(assessment.id) }]
        : []),
    ],
    currentCrumb: resultTitle,
  };
}
