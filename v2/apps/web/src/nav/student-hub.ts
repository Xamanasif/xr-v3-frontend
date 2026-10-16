import type { Technology } from '@xr/domain';
import type { BreadcrumbLevel } from '@xr/ui';

import { HUB_TABS } from '@/copy/learning-hub';
import type { ScreenKey } from './screens';
import {
  MY_COURSES_ADDRESS,
  MY_COURSES_TITLE,
  myCourseAddress,
  myExperimentAddress,
} from './student';

/**
 * The experiment hub's Phase-3 pages (boards B3-01, B3-02; Appendix A register routes): the
 * Resources (ST-06), Simulation (ST-07) and Progress (ST-10) tabs beside the Overview (ST-05), and
 * the pages their actions open — the WEB page (ST-08), the AR / VR / MR page (ST-09) and format
 * feedback (ST-16). Top bars as B3-01 and B3-02 draw them: the tab's name, crumbed
 * "My courses / ME ZG523 / Shell-and-Tube Heat Exchanger / Resources", the experiment crumb
 * opening the Overview. My courses stays current in the sidebar (`nav/active-item.ts`).
 */
export type HubTab = 'overview' | 'resources' | 'simulation' | 'assessment' | 'progress';

/** A tab's place in the shell (the shape `useShellPage` takes). */
export interface HubPlacement {
  readonly screen: ScreenKey;
  readonly title: string;
  readonly trail: readonly BreadcrumbLevel[];
  readonly currentCrumb: string;
}

/**
 * The tab's screen (ST-05 Overview, ST-06, ST-07, ST-10; Phase 4B: the Assessment tab, the
 * register's unnumbered "hub Assessment tab", B4-11 f7 … f9).
 */
export const HUB_TAB_SCREEN = {
  overview: 'ST-05',
  resources: 'ST-06',
  simulation: 'ST-07',
  assessment: 'student-hub-assessment',
  progress: 'ST-10',
} as const satisfies Record<HubTab, ScreenKey>;

/** `/student/experiments/[experimentId]` and its tabs `/resources`, `/simulation`, `/assessment`, `/progress`. */
export function hubTabAddress(experimentId: string, tab: HubTab): string {
  const hub = myExperimentAddress(experimentId);
  return tab === 'overview' ? hub : `${hub}/${tab}`;
}

/** ST-08 `/simulation/web`; ST-09 `/simulation/ar | vr | mr`. */
export function formatPageAddress(experimentId: string, format: Technology): string {
  return `${hubTabAddress(experimentId, 'simulation')}/${format}`;
}

/** ST-16 / ST-17: `/student/experiments/[experimentId]/feedback/[format]`. */
export function formatFeedbackAddress(experimentId: string, format: Technology): string {
  return `${myExperimentAddress(experimentId)}/feedback/${format}`;
}

const MY_COURSES_CRUMB: BreadcrumbLevel = { label: MY_COURSES_TITLE, href: MY_COURSES_ADDRESS };

/**
 * A tab's top bar (B3-01 f0, f8; B3-02 f0): title = the tab's name; crumbs "My courses / <course
 * code> / <experiment>", the code opening the course (ST-03) and the experiment its Overview.
 * While the hub loads, the tab's name under "My courses".
 */
export function hubTabPlacement(
  tab: Exclude<HubTab, 'overview'>,
  experiment: {
    readonly id: string;
    readonly name: string;
    readonly course: { readonly crumb: string; readonly courseId: string } | null;
  } | null,
): HubPlacement {
  const title = HUB_TABS[tab];
  const screen = HUB_TAB_SCREEN[tab];
  if (experiment === null) return { screen, title, trail: [MY_COURSES_CRUMB], currentCrumb: title };
  return {
    screen,
    title,
    trail: [
      MY_COURSES_CRUMB,
      ...(experiment.course
        ? [{ label: experiment.course.crumb, href: myCourseAddress(experiment.course.courseId) }]
        : []),
      { label: experiment.name, href: myExperimentAddress(experiment.id) },
    ],
    currentCrumb: title,
  };
}
