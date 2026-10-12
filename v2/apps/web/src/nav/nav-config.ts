import { ROLE_LABEL, type Role } from '@xr/domain';
import type { IconName } from '@xr/ui';

import type { WorkspaceScreenId } from './screens';

/**
 * The navigation of the seven workspaces and the public header (Appendix F §3.2 `nav-config.ts`;
 * Appendix E §4.1). Labels, order and icon keys are board 06's (`06-Sidebar-Variants` script
 * `raw[]`), which equals `handoff/navigation.json` after its two documented board-wins
 * normalisations: HB-19 "Help (foot)" is shown as "Help", and HB-02 the public header's "Request
 * access" opens PU-07 Selection (B1-01 links B1-06), not PU-08. Routes are ADR-0005's static
 * workspace bases with Appendix A's recommended paths. Section tabs are board 05's and 06's
 * nested destinations (data for the screens that draw them; never a second sidebar level).
 *
 * Every destination is listed here, built or not; the sidebar shows only those whose screen is
 * built (`built-screens.ts`), so the order never changes by state (board 06 "Navigation rules").
 */

/**
 * Board 06's icon keys (`const I` in its script) and the @xr/ui registry name of the same path
 * (the registry is generated from the boards and names the paths from board 02's list).
 */
export const BOARD_ICON = {
  home: 'home',
  overview: 'overview',
  courses: 'myCourses',
  assess: 'assessments',
  progress: 'progress',
  qbank: 'questionBank',
  marking: 'marking',
  people: 'studentsPeople',
  caccess: 'contentAccess',
  saccess: 'studentAccess',
  requests: 'requests',
  usage: 'usage',
  exps: 'myExperiments',
  queue: 'reviewQueue',
  reviewed: 'reviewedByMe',
  publish: 'readyToPublish',
  library: 'contentLibrary',
  updates: 'updates',
  codes: 'courseCodes',
  inst: 'institutions',
  content: 'content',
  structure: 'academicStructure',
  roles: 'platformRoles',
  ops: 'operations',
} as const satisfies Readonly<Record<string, IconName>>;

export type BoardIconKey = keyof typeof BOARD_ICON;

/**
 * A count in words, read instead of the figure (board 06 "Counts … announced in words"). `{n}` is
 * the figure; `other` is board 06's wording. `one` is the singular the boards draw in the same
 * words: "1 written answer to mark" (the B4 sidebars' Marking count) and "1 device request to
 * forward" (B2-01's attention row; no board draws the Institute Admin's sidebar count at 1).
 * Without it the `other` wording is used for every figure.
 */
export interface CountWords {
  readonly other: string;
  readonly one?: string;
}

/** One sidebar destination of a workspace. */
export interface NavDestinationConfig {
  /** Stable key, unique in the workspace (the active-item map refers to it). */
  readonly key: string;
  /** The destination name (board 06 `n(label, …)`), also the rail tooltip and the link's name. */
  readonly label: string;
  /** Board 06's icon key; the path is `BOARD_ICON[boardIcon]` in the @xr/ui registry. */
  readonly boardIcon: BoardIconKey;
  /** The screen the destination opens; the item renders only once that screen is built. */
  readonly screen: WorkspaceScreenId;
  /** Where it goes (ADR-0005; Appendix A recommended route). */
  readonly href: string;
  /**
   * Where board 06 draws a count (its `countText`): the destination opens the list it counts,
   * except the Institute Admin's Requests (an open item, nav/README.md).
   */
  readonly countWords?: CountWords;
  /** The destination's section tabs (board 05 `tabs`, board 06 "Nested destinations"). */
  readonly sectionTabs?: readonly string[];
}

/**
 * Which line the sidebar and the account menu show under the workspace label (board 06 "Account
 * menu" table): the institution for the institution roles, the vendor's organisation for the
 * Vendor, none for the platform roles (whether they get one is open, board 13 Q5).
 */
export type OrganisationLine = 'institution' | 'organisation' | 'none';

export interface WorkspaceNavConfig {
  readonly role: Role;
  /** The workspace label, gold capitals in the sidebar (B8-03 role names, `ROLE_LABEL`). */
  readonly workspace: string;
  /** The workspace base (ADR-0005 §1). */
  readonly base: string;
  readonly organisationLine: OrganisationLine;
  /** In board order; at most 8 plus Help (board 06 "Navigation rules"). */
  readonly destinations: readonly NavDestinationConfig[];
  /** Help & support, always last, in the sidebar foot and the account menu (WCAG 3.2.6). */
  readonly help: { readonly label: 'Help'; readonly screen: 'XS-07'; readonly href: string };
}

/** ADR-0005 §1: one static base per workspace (`navigation.json` `baseRoute`). */
export const WORKSPACE_BASE: Readonly<Record<Role, string>> = {
  student: '/student',
  faculty: '/faculty',
  tenant_admin: '/institute',
  vendor: '/vendor',
  academic_reviewer: '/reviewer',
  content_manager: '/content-manager',
  super_admin: '/admin',
};

function workspace(
  role: Role,
  organisationLine: OrganisationLine,
  destinations: readonly NavDestinationConfig[],
): WorkspaceNavConfig {
  const base = WORKSPACE_BASE[role];
  return {
    role,
    workspace: ROLE_LABEL[role],
    base,
    organisationLine,
    destinations,
    help: { label: 'Help', screen: 'XS-07', href: `${base}/help` },
  };
}

/** The seven workspaces' navigation (board 06 `raw[]`, in its order). */
export const WORKSPACE_NAV: Readonly<Record<Role, WorkspaceNavConfig>> = {
  student: workspace('student', 'institution', [
    { key: 'home', label: 'Home', boardIcon: 'home', screen: 'ST-01', href: '/student' },
    {
      key: 'my-courses',
      label: 'My courses',
      boardIcon: 'courses',
      screen: 'ST-02',
      href: '/student/courses',
      sectionTabs: ['Courses', 'All experiments'],
    },
    {
      key: 'assessments',
      label: 'Assessments',
      boardIcon: 'assess',
      screen: 'ST-11',
      href: '/student/assessments',
    },
    {
      key: 'progress',
      label: 'Progress',
      boardIcon: 'progress',
      screen: 'ST-15',
      href: '/student/progress',
    },
  ]),
  faculty: workspace('faculty', 'institution', [
    {
      key: 'overview',
      label: 'Overview',
      boardIcon: 'overview',
      screen: 'FA-01',
      href: '/faculty',
    },
    {
      key: 'my-courses',
      label: 'My courses',
      boardIcon: 'courses',
      screen: 'FA-02',
      href: '/faculty/courses',
      sectionTabs: ['Courses', 'Experiments'],
    },
    {
      key: 'assessments',
      label: 'Assessments',
      boardIcon: 'assess',
      screen: 'FA-06',
      href: '/faculty/assessments',
    },
    {
      key: 'question-bank',
      label: 'Question bank',
      boardIcon: 'qbank',
      screen: 'FA-14',
      href: '/faculty/question-bank',
    },
    {
      key: 'marking',
      label: 'Marking',
      boardIcon: 'marking',
      screen: 'FA-18',
      href: '/faculty/marking',
      countWords: { other: '{n} written answers to mark', one: '{n} written answer to mark' },
    },
    {
      key: 'students',
      label: 'Students',
      boardIcon: 'people',
      screen: 'FA-20',
      href: '/faculty/students',
    },
  ]),
  tenant_admin: workspace('tenant_admin', 'institution', [
    {
      key: 'overview',
      label: 'Overview',
      boardIcon: 'overview',
      screen: 'IA-01',
      href: '/institute',
    },
    {
      key: 'content-access',
      label: 'Content access',
      boardIcon: 'caccess',
      screen: 'IA-02',
      href: '/institute/content-access',
    },
    {
      key: 'student-access',
      label: 'Student access',
      boardIcon: 'saccess',
      screen: 'IA-04',
      href: '/institute/student-access',
    },
    {
      key: 'people',
      label: 'People',
      boardIcon: 'people',
      screen: 'IA-06',
      href: '/institute/people',
      sectionTabs: ['Students', 'Faculty', 'Groups', 'Faculty courses'],
    },
    {
      key: 'requests',
      label: 'Requests',
      boardIcon: 'requests',
      screen: 'IA-17',
      href: '/institute/requests',
      // Board 06 draws this count on Requests, which opens Requests to BITS (IA-17), while it counts
      // device requests (the IA-18 tab) — against its own rule "Counts appear only where they open
      // the list they count". Open for the owner (nav/README.md); no count shows in Phase 0.
      countWords: { other: '{n} device requests to forward', one: '{n} device request to forward' },
      sectionTabs: ['Requests to BITS', 'Device requests'],
    },
    { key: 'usage', label: 'Usage', boardIcon: 'usage', screen: 'IA-20', href: '/institute/usage' },
  ]),
  vendor: workspace('vendor', 'organisation', [
    { key: 'overview', label: 'Overview', boardIcon: 'overview', screen: 'VE-01', href: '/vendor' },
    {
      key: 'my-experiments',
      label: 'My experiments',
      boardIcon: 'exps',
      screen: 'VE-02',
      href: '/vendor/experiments',
    },
  ]),
  academic_reviewer: workspace('academic_reviewer', 'none', [
    {
      key: 'overview',
      label: 'Overview',
      boardIcon: 'overview',
      screen: 'RV-01',
      href: '/reviewer',
    },
    {
      key: 'review-queue',
      label: 'Review queue',
      boardIcon: 'queue',
      screen: 'RV-02',
      href: '/reviewer/queue',
      // Board 06's words; B6 draws "{n} items waiting for review" (open: nav/README.md).
      countWords: { other: '{n} waiting for review' },
    },
    {
      key: 'reviewed-by-me',
      label: 'Reviewed by me',
      boardIcon: 'reviewed',
      screen: 'RV-05',
      href: '/reviewer/reviewed',
    },
  ]),
  content_manager: workspace('content_manager', 'none', [
    {
      key: 'overview',
      label: 'Overview',
      boardIcon: 'overview',
      screen: 'CM-01',
      href: '/content-manager',
    },
    {
      key: 'ready-to-publish',
      label: 'Ready to publish',
      boardIcon: 'publish',
      screen: 'CM-02',
      href: '/content-manager/ready',
      // Board 06's words; B6 draws "{n} experiments ready to publish" (open: nav/README.md).
      countWords: { other: '{n} ready to publish' },
    },
    {
      key: 'content-library',
      label: 'Content library',
      boardIcon: 'library',
      screen: 'CM-04',
      href: '/content-manager/library',
    },
    {
      key: 'updates',
      label: 'Updates',
      boardIcon: 'updates',
      screen: 'CM-08',
      href: '/content-manager/updates',
    },
    {
      key: 'course-codes',
      label: 'Course codes',
      boardIcon: 'codes',
      screen: 'CM-09',
      href: '/content-manager/course-codes',
    },
  ]),
  super_admin: workspace('super_admin', 'none', [
    { key: 'overview', label: 'Overview', boardIcon: 'overview', screen: 'SA-01', href: '/admin' },
    {
      key: 'requests',
      label: 'Requests',
      boardIcon: 'requests',
      screen: 'SA-02',
      href: '/admin/requests',
      // The boards draw only the plural ("3 requests under review"); the singular is not drawn.
      countWords: { other: '{n} requests under review' },
    },
    {
      key: 'institutions',
      label: 'Institutions',
      boardIcon: 'inst',
      screen: 'SA-06',
      href: '/admin/institutions',
    },
    {
      key: 'content',
      label: 'Content',
      boardIcon: 'content',
      screen: 'SA-10',
      // Appendix A §3.7 row 15 (board-forced): the sidebar's "Content" opens Updates (B7-05).
      href: '/admin/content/updates',
      sectionTabs: ['Updates', 'All content'],
    },
    {
      key: 'academic-structure',
      label: 'Academic structure',
      boardIcon: 'structure',
      screen: 'SA-14',
      href: '/admin/structure',
    },
    {
      key: 'platform-roles',
      label: 'Platform roles',
      boardIcon: 'roles',
      screen: 'SA-16',
      href: '/admin/roles',
    },
    {
      key: 'operations',
      label: 'Operations',
      boardIcon: 'ops',
      screen: 'SA-18',
      // Appendix A §3.7 row 17 (board-forced): "Operations" opens Device transfers (B7-09 f0).
      href: '/admin/operations/device-transfers',
      sectionTabs: ['Device transfers', 'Support', 'Access ending'],
    },
  ]),
};

/** "My device" in the Student's account menu (board 06 "Account menu"; ST-18, B3-07). */
export const MY_DEVICE = {
  label: 'My device',
  icon: 'myDevice',
  screen: 'ST-18',
  href: '/student/device',
} as const satisfies {
  readonly label: string;
  readonly icon: IconName;
  readonly screen: WorkspaceScreenId;
  readonly href: string;
};

/** The screens of the public surface the header opens (PUBLIC is a surface, not a role: BC1). */
export type PublicScreenId = 'PU-01' | 'PU-02' | 'PU-04' | 'PU-07' | 'XS-01';

export interface PublicHeaderItemConfig {
  readonly key: string;
  /** The item's words as the B1 boards draw them. */
  readonly label: string;
  readonly screen: PublicScreenId;
  readonly href: string;
  /** "Selection (n)": the label carries the selection count (B1 header `xp-sel-n`). */
  readonly counted?: true;
}

/**
 * The public header (`navigation.json` "Public header"; B1-01 markup), in order. Data only in
 * Phase 0: the PublicShell that renders it is Phase 1 (owner decision G-8). "For institutions"
 * is the PU-14 section of the landing page (`#for-institutions`, Appendix A PU-01). HB-02 (board
 * wins): "Request access" opens PU-07 Selection — B1-01 draws `a.xp-access
 * href="B1-06-Selection.dc.html"` where `navigation.json` says PU-08.
 */
export const PUBLIC_HEADER_NAV: readonly PublicHeaderItemConfig[] = [
  { key: 'browse', label: 'Browse experiments', screen: 'PU-04', href: '/experiments' },
  { key: 'areas', label: 'Areas', screen: 'PU-02', href: '/areas' },
  {
    key: 'for-institutions',
    label: 'For institutions',
    screen: 'PU-01',
    href: '/#for-institutions',
  },
  { key: 'selection', label: 'Selection', screen: 'PU-07', href: '/selection', counted: true },
  { key: 'sign-in', label: 'Sign in', screen: 'XS-01', href: '/sign-in' },
  { key: 'request-access', label: 'Request access', screen: 'PU-07', href: '/selection' },
];
