import type { Technology } from '@xr/domain';
import type { BreadcrumbLevel } from '@xr/ui';

import { WORKSPACE_NAV } from './nav-config';
import { MY_COURSES_ADDRESS, MY_COURSES_TITLE, myExperimentAddress } from './student';

/**
 * The Student's Phase-3 progress and feedback screens (boards B3-05, B3-06): their addresses
 * (Appendix A register routes) and their place in the shell — Progress current on ST-15 (B3-05 f0
 * `aria-current="page"`); My courses current on ST-16 and its ST-17 state. Top bars as the boards
 * draw them: "Progress" alone on ST-15; "My courses / Shell-and-Tube Heat Exchanger / Feedback on
 * VR" on ST-16 and ST-17 (B3-06 f0, f3, f4), the experiment crumb opening its hub (ST-05).
 */
const progressDestination = WORKSPACE_NAV.student.destinations.find(
  (destination) => destination.screen === 'ST-15',
)!;

/** ST-15: `/student/progress`, the sidebar's "Progress". */
export const PROGRESS_ADDRESS = progressDestination.href;
export const PROGRESS_TITLE = progressDestination.label;

/** The formats a feedback address may name (Appendix A: `[format]` = web | ar | vr | mr). */
export const FEEDBACK_FORMATS: readonly Technology[] = ['web', 'ar', 'vr', 'mr'];

export function isFeedbackFormat(format: string): format is Technology {
  return (FEEDBACK_FORMATS as readonly string[]).includes(format);
}

/** ST-16 / ST-17: `/student/experiments/[experimentId]/feedback/[format]`. */
export function feedbackAddress(experimentId: string, format: Technology): string {
  return `${myExperimentAddress(experimentId)}/feedback/${format}`;
}

/**
 * The format's own page: ST-08 `…/simulation/web` for WEB, ST-09 `…/simulation/[format]` for AR,
 * VR and MR (B3-05 "Continue WEB" → B3-03, "Open VR" → B3-04; B3-06 "← VR" and "Cancel" → B3-04,
 * "← WEB" → B3-03).
 */
export function formatPageAddress(experimentId: string, format: Technology): string {
  return `${myExperimentAddress(experimentId)}/simulation/${format}`;
}

export interface ProgressPlacement {
  readonly screen: 'ST-15' | 'ST-16' | 'ST-17';
  readonly title: string;
  readonly trail: readonly BreadcrumbLevel[];
  readonly currentCrumb?: string;
}

/** ST-15 (B3-05 f0): title "Progress", the destination's own page (no crumbs above it). */
export function progressPlacement(): ProgressPlacement {
  return { screen: 'ST-15', title: PROGRESS_TITLE, trail: [] };
}

/**
 * ST-16 / ST-17 (B3-06 f0, f3, f4): title "Feedback on VR"; crumbs "My courses / <experiment>",
 * the experiment's crumb drawn once its name is read.
 */
export function feedbackPlacement(
  screen: 'ST-16' | 'ST-17',
  title: string,
  experiment: { readonly experimentId: string; readonly name: string } | null,
): ProgressPlacement {
  return {
    screen,
    title,
    trail: [
      { label: MY_COURSES_TITLE, href: MY_COURSES_ADDRESS },
      ...(experiment
        ? [{ label: experiment.name, href: myExperimentAddress(experiment.experimentId) }]
        : []),
    ],
    currentCrumb: title,
  };
}
