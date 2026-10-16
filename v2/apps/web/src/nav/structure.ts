import type { BreadcrumbLevel } from '@xr/ui';

import { WORKSPACE_NAV } from './nav-config';

/**
 * The Super Admin's Academic structure (Phase 6; boards B7-07, B7-10, B7-12): the structure
 * (SA-14) and an area or course record (SA-15) — their addresses (Appendix A register routes:
 * `/admin/structure/areas/[areaId]` and `/admin/structure/courses/[courseId]`, expanded under
 * `/admin/structure`, D-10) and their place in the shell: "Academic structure" current on both.
 * Top bars: "Academic structure" (B7-07 f0); "Academic structure / Process Instrumentation &
 * Control" (f1); "Academic structure / Chemical & Process" (f5); mobile "Academic structure".
 * Programme → Course → Experiment → format: no Programme or Module level here (BC2).
 */
const destination = WORKSPACE_NAV.super_admin.destinations.find(
  (candidate) => candidate.screen === 'SA-14',
)!;

export const STRUCTURE_ADDRESS = destination.href;
export const STRUCTURE_TITLE = destination.label;

export function structureAreaAddress(areaId: string): string {
  return `${STRUCTURE_ADDRESS}/areas/${encodeURIComponent(areaId)}`;
}

export function structureCourseAddress(courseId: string): string {
  return `${STRUCTURE_ADDRESS}/courses/${encodeURIComponent(courseId)}`;
}

export interface StructurePlacement {
  readonly screen: 'SA-14' | 'SA-15';
  readonly title: string;
  readonly trail: readonly BreadcrumbLevel[];
  readonly currentCrumb?: string;
}

const STRUCTURE_CRUMB: BreadcrumbLevel = { label: STRUCTURE_TITLE, href: STRUCTURE_ADDRESS };

export function structurePlacement(): StructurePlacement {
  return { screen: 'SA-14', title: STRUCTURE_TITLE, trail: [] };
}

/** "Academic structure / <area or course name>"; while it loads, "Academic structure". */
export function structureRecordPlacement(name: string | null): StructurePlacement {
  return name === null
    ? { screen: 'SA-15', title: STRUCTURE_TITLE, trail: [] }
    : { screen: 'SA-15', title: STRUCTURE_TITLE, trail: [STRUCTURE_CRUMB], currentCrumb: name };
}
