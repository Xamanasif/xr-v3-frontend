import type { BreadcrumbLevel } from '@xr/ui';

import { WORKSPACE_NAV } from './nav-config';

/**
 * The Institute Admin's Package-2A screens (boards B2-01 … B2-07): their addresses (Appendix A
 * register routes) and their place in the shell (Appendix A §3.6: Overview current on IA-01,
 * Content access on IA-02 / IA-03, Student access on IA-04 / IA-05, People on IA-06 … IA-10). The
 * top bars follow the boards: a destination's own page is titled with the destination; a record or
 * a flow is titled with itself and crumbed under its destination ("Content access / ACC-0107",
 * "Student access / Give students access", "People / Students / Rahul Verma", "People / Add
 * student").
 */
type InstituteScreen =
  'IA-01' | 'IA-02' | 'IA-03' | 'IA-04' | 'IA-05' | 'IA-06' | 'IA-07' | 'IA-08' | 'IA-10';

const destinationOf = (screen: 'IA-01' | 'IA-02' | 'IA-04' | 'IA-06') =>
  WORKSPACE_NAV.tenant_admin.destinations.find((destination) => destination.screen === screen)!;

export const INSTITUTE_OVERVIEW_ADDRESS = destinationOf('IA-01').href;
export const CONTENT_ACCESS_ADDRESS = destinationOf('IA-02').href;
export const STUDENT_ACCESS_ADDRESS = destinationOf('IA-04').href;
export const PEOPLE_ADDRESS = destinationOf('IA-06').href;
export const INSTITUTE_HELP_ADDRESS = WORKSPACE_NAV.tenant_admin.help.href;

/** "Overview", "Content access", "Student access", "People" (board 06 labels). */
export const OVERVIEW_TITLE = destinationOf('IA-01').label;
export const CONTENT_ACCESS_TITLE = destinationOf('IA-02').label;
export const STUDENT_ACCESS_TITLE = destinationOf('IA-04').label;
export const PEOPLE_TITLE = destinationOf('IA-06').label;

/** IA-03: `/institute/content-access/plans/[planId]`. */
export function accessPlanAddress(planId: string): string {
  return `${CONTENT_ACCESS_ADDRESS}/plans/${encodeURIComponent(planId)}`;
}

/** IA-08: the People page's Faculty tab. */
export const FACULTY_ADDRESS = `${PEOPLE_ADDRESS}?tab=faculty`;

/** IA-07: `/institute/people/students/[studentId]`. */
export function studentRecordAddress(studentId: string): string {
  return `${PEOPLE_ADDRESS}/students/${encodeURIComponent(studentId)}`;
}

/** IA-10: Add student (`/institute/people/add`) or Add faculty member (`?type=faculty`). */
export function addPersonAddress(type: 'student' | 'faculty'): string {
  return type === 'faculty' ? `${PEOPLE_ADDRESS}/add?type=faculty` : `${PEOPLE_ADDRESS}/add`;
}

/** What IA-05 opens pre-filled with (B2-05 f4 "from Give this group access", f13 "from the student record"). */
export interface GiveAccessPrefill {
  readonly student?: string;
  readonly group?: string;
  readonly course?: string;
  readonly experiment?: string;
}

/** IA-05: `/institute/student-access/give` (`?student=` / `?group=` / `?course=` / `?experiment=`). */
export function giveAccessAddress(prefill: GiveAccessPrefill = {}): string {
  const query = new URLSearchParams();
  for (const key of ['student', 'group', 'course', 'experiment'] as const) {
    const value = prefill[key];
    if (value) query.set(key, value);
  }
  const text = query.toString();
  return `${STUDENT_ACCESS_ADDRESS}/give${text ? `?${text}` : ''}`;
}

export interface InstitutePlacement {
  readonly screen: InstituteScreen;
  readonly title: string;
  readonly trail: readonly BreadcrumbLevel[];
  readonly currentCrumb?: string;
}

/** A destination's own page: titled with the destination, no trail. */
export function destinationPlacement(
  screen: 'IA-01' | 'IA-02' | 'IA-04' | 'IA-06' | 'IA-08',
): InstitutePlacement {
  const title =
    screen === 'IA-01'
      ? OVERVIEW_TITLE
      : screen === 'IA-02'
        ? CONTENT_ACCESS_TITLE
        : screen === 'IA-04'
          ? STUDENT_ACCESS_TITLE
          : PEOPLE_TITLE;
  return { screen, title, trail: [] };
}

/**
 * A page under a destination: titled with itself, crumbed "<destination> / … / <itself>". Until
 * its record has loaded the name is not known: the destination's own crumb stands alone.
 */
export function underPlacement(
  screen: 'IA-03' | 'IA-05' | 'IA-07' | 'IA-10',
  current: string | null,
  middle: readonly BreadcrumbLevel[] = [],
): InstitutePlacement {
  const destination =
    screen === 'IA-03'
      ? { label: CONTENT_ACCESS_TITLE, href: CONTENT_ACCESS_ADDRESS }
      : screen === 'IA-05'
        ? { label: STUDENT_ACCESS_TITLE, href: STUDENT_ACCESS_ADDRESS }
        : { label: PEOPLE_TITLE, href: PEOPLE_ADDRESS };
  if (current === null) return { screen, title: destination.label, trail: [] };
  return { screen, title: current, trail: [destination, ...middle], currentCrumb: current };
}

/**
 * IA-08, the People page's Faculty tab (B2-06 f14): the top bar reads the tab ("Faculty"), crumbed
 * "People / Faculty".
 */
export function facultyTabPlacement(tabLabel: string): InstitutePlacement {
  return {
    screen: 'IA-08',
    title: tabLabel,
    trail: [{ label: PEOPLE_TITLE, href: PEOPLE_ADDRESS }],
    currentCrumb: tabLabel,
  };
}
