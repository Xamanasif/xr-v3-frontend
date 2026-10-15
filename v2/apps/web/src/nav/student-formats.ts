import type { BreadcrumbLevel } from '@xr/ui';

import { FORMAT_PAGE } from '@/copy/formats';

import { helpAddresses } from './help';
import { MY_DEVICE } from './nav-config';
import { MY_COURSES_ADDRESS, MY_COURSES_TITLE, myExperimentAddress } from './student';

/**
 * The Student's format pages (Phase 3; boards B3-03, B3-04): ST-08 WEB simulation at
 * `/student/experiments/[experimentId]/simulation/web` and ST-09 AR / VR / MR format at
 * `…/simulation/[format]` (Appendix A register routes), with the addresses their actions open —
 * ST-07 Simulation ("Back to Simulation"), ST-16 / ST-17 format feedback, ST-18 My device and
 * XS-07 "Report a problem". My courses is current in the sidebar (`nav/active-item.ts`). Top bars
 * as the boards draw them: title "WEB simulation" / "VR format", crumbs "My courses /
 * <experiment> / Simulation / WEB" (B3-03 f0, B3-04 f0).
 */

/** The formats with a page of their own under `[format]`: `web` is ST-08's static route. */
export const PACKAGE_FORMATS = ['ar', 'vr', 'mr'] as const;
export type PackageFormat = (typeof PACKAGE_FORMATS)[number];

/** The address's `[format]` as a package format, or `null` (any other text is not found). */
export function packageFormatOf(segment: string): PackageFormat | null {
  return (PACKAGE_FORMATS as readonly string[]).includes(segment)
    ? (segment as PackageFormat)
    : null;
}

/** ST-07: `/student/experiments/[experimentId]/simulation` ("Back to Simulation"). */
export function simulationAddress(experimentId: string): string {
  return `${myExperimentAddress(experimentId)}/simulation`;
}

/** ST-08: `/student/experiments/[experimentId]/simulation/web`. */
export function webSimulationAddress(experimentId: string): string {
  return `${simulationAddress(experimentId)}/web`;
}

/** ST-09: `/student/experiments/[experimentId]/simulation/[format]`. */
export function formatPageAddress(experimentId: string, format: PackageFormat): string {
  return `${simulationAddress(experimentId)}/${format}`;
}

/** ST-16 / ST-17: `/student/experiments/[experimentId]/feedback/[format]`. */
export function formatFeedbackAddress(experimentId: string, format: string): string {
  return `${myExperimentAddress(experimentId)}/feedback/${format}`;
}

/** ST-18 My device (the device block's link, B3-04 f0). */
export const MY_DEVICE_ADDRESS = MY_DEVICE.href;

/** XS-07 Report a problem (B3-03 f0 "Report a problem": board 07). */
export const REPORT_PROBLEM_ADDRESS = helpAddresses('student').report;

export interface FormatPlacement {
  readonly screen: 'ST-08' | 'ST-09';
  readonly title: string;
  readonly trail: readonly BreadcrumbLevel[];
  readonly currentCrumb: string;
}

/**
 * B3-03 f0 / B3-04 f0: title "WEB simulation" / "VR format", crumbs "My courses / <experiment> /
 * Simulation / <format code>". Until the experiment's name is read, the trail holds My courses and
 * Simulation only.
 */
export function formatPlacement(
  screen: 'ST-08' | 'ST-09',
  words: { readonly title: string; readonly code: string },
  experiment: { readonly id: string; readonly name: string | null },
): FormatPlacement {
  return {
    screen,
    title: words.title,
    trail: [
      { label: MY_COURSES_TITLE, href: MY_COURSES_ADDRESS },
      ...(experiment.name
        ? [{ label: experiment.name, href: myExperimentAddress(experiment.id) }]
        : []),
      { label: FORMAT_PAGE.simulation, href: simulationAddress(experiment.id) },
    ],
    currentCrumb: words.code,
  };
}
