import type { Role } from '@xr/domain';

import type { ScreenKey } from './screens';

/**
 * The sidebar's current item for each screen — an explicit map, never derived from URL prefixes
 * (ADR-0005 §9; Appendix A §3.6, the approved route register). A destination owns its details,
 * flows and tabs (Appendix E §4.2): B7-03 Institution detail → Institutions, B2-12 Experiment hub →
 * My courses. Help is current on the Help pages (board 05 `helpCurrent`).
 *
 * `null` = nothing is current: the message pages XS-06 "Not your workspace" and the in-shell
 * PU-15 "Not found" (board 08: "nothing in it is marked current because the page is not a
 * destination"), and the Student's My device page ST-18 (B3-07), which the account menu opens.
 *
 * Board variance kept open (not resolved here): Appendix A §3.6 and the product boards B2-11 f12
 * and B2-12 f4 draw ST-19 "Experiment not available" with My courses current; board 08 draws the
 * same refusal as a generic message page with nothing current. ST-19 follows the route register
 * until the owner decides (ST-19 is built in Phase 2).
 */
const OWNERS: Readonly<Record<Role, Readonly<Record<string, readonly ScreenKey[]>>>> = {
  student: {
    home: ['ST-01'],
    'my-courses': [
      'ST-02',
      'ST-03',
      'ST-04',
      'ST-05',
      'ST-06',
      'ST-07',
      'ST-08',
      'ST-09',
      'ST-10',
      'student-hub-assessment',
      'ST-16',
      'ST-17',
      'ST-19',
    ],
    assessments: ['ST-11', 'ST-12', 'ST-14'],
    progress: ['ST-15'],
  },
  faculty: {
    overview: ['FA-01'],
    'my-courses': ['FA-02', 'FA-03', 'FA-04', 'FA-05'],
    assessments: ['FA-06', 'FA-07', 'FA-08', 'FA-09', 'FA-10', 'FA-11', 'FA-12'],
    'question-bank': ['FA-14', 'FA-15', 'FA-16', 'FA-17'],
    marking: ['FA-18', 'FA-19'],
    students: ['FA-20', 'FA-21'],
  },
  tenant_admin: {
    overview: ['IA-01'],
    'content-access': ['IA-02', 'IA-03', 'IA-16'],
    'student-access': ['IA-04', 'IA-05'],
    people: ['IA-06', 'IA-07', 'IA-08', 'IA-09', 'IA-10', 'IA-11', 'IA-13', 'IA-14', 'IA-15'],
    requests: ['IA-17', 'IA-18', 'IA-19', 'institute-request-detail'],
    usage: ['IA-20'],
  },
  vendor: {
    overview: ['VE-01'],
    'my-experiments': [
      'VE-02',
      'VE-03',
      'VE-04',
      'VE-05',
      'VE-06',
      'VE-07',
      'VE-08',
      'VE-09',
      'VE-13',
    ],
  },
  academic_reviewer: {
    overview: ['RV-01'],
    // Even when opened from Reviewed by me (B6-03 f4).
    'review-queue': ['RV-02', 'RV-03', 'RV-04', 'RV-06'],
    'reviewed-by-me': ['RV-05'],
  },
  content_manager: {
    overview: ['CM-01'],
    'ready-to-publish': ['CM-02', 'CM-03'],
    'content-library': ['CM-04', 'CM-05'],
    // CM-08 list and detail, including the drafts CM-06 and CM-07 open (B6-09).
    updates: ['CM-06', 'CM-07', 'CM-08'],
    'course-codes': ['CM-09'],
  },
  super_admin: {
    overview: ['SA-01'],
    requests: ['SA-02', 'SA-03'],
    institutions: ['SA-06', 'SA-07'],
    content: ['SA-10', 'SA-11', 'SA-12', 'SA-13'],
    'academic-structure': ['SA-14', 'SA-15'],
    'platform-roles': ['SA-16', 'SA-17'],
    operations: ['SA-18', 'SA-19', 'SA-20', 'SA-21', 'SA-22'],
  },
};

/** Screens every workspace shell shows: Help, and the two message pages (nothing current). */
const SHARED: Readonly<Record<'help' | 'none', readonly ScreenKey[]>> = {
  help: ['XS-07'],
  none: ['XS-06', 'PU-15'],
};

/** Screens of one workspace that mark nothing current besides the shared message pages. */
const NOTHING_CURRENT: Readonly<Partial<Record<Role, readonly ScreenKey[]>>> = {
  student: ['ST-18'],
};

/** What is current in the sidebar: a destination key, Help, or nothing. */
export type CurrentItem = string | 'help' | null;

/** The destination keys of a workspace and the screens each owns (the map, for tests). */
export function activeItemOwners(role: Role): Readonly<Record<string, readonly ScreenKey[]>> {
  return OWNERS[role];
}

/**
 * The sidebar item that is current on a screen of this workspace. A screen of another workspace
 * is a programming error here: the workspace guard shows XS-06 for it instead (ADR-0005 §5).
 */
export function currentItem(role: Role, screen: ScreenKey): CurrentItem {
  if (SHARED.help.includes(screen)) return 'help';
  if (SHARED.none.includes(screen) || NOTHING_CURRENT[role]?.includes(screen)) return null;
  for (const [key, screens] of Object.entries(OWNERS[role])) {
    if (screens.includes(screen)) return key;
  }
  throw new Error(`Screen ${screen} is not part of the ${role} workspace.`);
}
