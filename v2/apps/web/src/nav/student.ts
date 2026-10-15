import type { BreadcrumbLevel } from '@xr/ui';

import { WORKSPACE_NAV } from './nav-config';

/**
 * The Student's Package-2A screens (boards B2-10 … B2-12): their addresses (Appendix A register
 * routes) and their place in the shell — Home current on ST-01; My courses current on ST-02, ST-03,
 * ST-05 and the ST-19 state (Appendix A §3.6). Top bars as the boards draw them: "My courses /
 * ME ZG523" on a course, "My courses / ME ZG523 / Shell-and-Tube Heat Exchanger" on an
 * experiment, "My courses / Not available" on the refusal.
 */
type StudentScreen = 'ST-01' | 'ST-02' | 'ST-03' | 'ST-05' | 'ST-19';

const destinationOf = (screen: 'ST-01' | 'ST-02') =>
  WORKSPACE_NAV.student.destinations.find((destination) => destination.screen === screen)!;

export const STUDENT_HOME_ADDRESS = destinationOf('ST-01').href;
export const MY_COURSES_ADDRESS = destinationOf('ST-02').href;
export const STUDENT_HELP_ADDRESS = WORKSPACE_NAV.student.help.href;

export const HOME_TITLE = destinationOf('ST-01').label;
export const MY_COURSES_TITLE = destinationOf('ST-02').label;

/** ST-03: `/student/courses/[courseId]`. */
export function myCourseAddress(courseId: string): string {
  return `${MY_COURSES_ADDRESS}/${encodeURIComponent(courseId)}`;
}

/** ST-05: `/student/experiments/[experimentId]`. */
export function myExperimentAddress(experimentId: string): string {
  return `/student/experiments/${encodeURIComponent(experimentId)}`;
}

export interface StudentPlacement {
  readonly screen: StudentScreen;
  readonly title: string;
  readonly trail: readonly BreadcrumbLevel[];
  readonly currentCrumb?: string;
}

export function homePlacement(): StudentPlacement {
  return { screen: 'ST-01', title: HOME_TITLE, trail: [] };
}

export function myCoursesPlacement(): StudentPlacement {
  return { screen: 'ST-02', title: MY_COURSES_TITLE, trail: [] };
}

const MY_COURSES_CRUMB: BreadcrumbLevel = { label: MY_COURSES_TITLE, href: MY_COURSES_ADDRESS };

/** ST-03 (B2-11 f1): title = the course's name; crumbs "My courses / <code shown>". */
export function coursePlacement(
  course: { readonly name: string; readonly crumb: string } | null,
): StudentPlacement {
  if (course === null) return { screen: 'ST-03', title: MY_COURSES_TITLE, trail: [] };
  return {
    screen: 'ST-03',
    title: course.name,
    trail: [MY_COURSES_CRUMB],
    currentCrumb: course.crumb,
  };
}

/**
 * ST-05 (B2-12 f0): title = the experiment's name; crumbs "My courses / <course code> / <name>",
 * the course crumb opening that course (ST-03).
 */
export function experimentPlacement(
  experiment: {
    readonly name: string;
    readonly course: { readonly crumb: string; readonly courseId: string } | null;
  } | null,
): StudentPlacement {
  if (experiment === null) return { screen: 'ST-05', title: MY_COURSES_TITLE, trail: [] };
  return {
    screen: 'ST-05',
    title: experiment.name,
    trail: [
      MY_COURSES_CRUMB,
      ...(experiment.course
        ? [{ label: experiment.course.crumb, href: myCourseAddress(experiment.course.courseId) }]
        : []),
    ],
    currentCrumb: experiment.name,
  };
}

/** ST-19 (B2-11 f12, B2-12 f4): title "Not available"; crumbs "My courses / Not available". */
export function notAvailablePlacement(title: string): StudentPlacement {
  return { screen: 'ST-19', title, trail: [MY_COURSES_CRUMB], currentCrumb: title };
}
