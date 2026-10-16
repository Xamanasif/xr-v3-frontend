import { type Workspace, WORKSPACES } from '@xr/contracts/draft';
import type { Role } from '@xr/domain';

import { WORKSPACE_BASE } from './nav-config';
import type { WorkspaceScreenId } from './screens';

/**
 * The route manifest (Appendix F §3.3; ADR-0005; WP-0.13, Phase-1 Package 1A): every page file
 * under `src/app`, what each one shows, and the static redirects of `next.config.ts`. The
 * route-manifest test compares it with the files on disk (Appendix F WP-0.13 acceptance 8), so a
 * page outside the manifest fails the build's tests; the built-screen manifest is derived from it.
 *
 * Seven static workspace bases (ADR-0005 §1; no dynamic `[workspace]` root segment, D-12), each
 * with the Help & support pages (XS-07), the interim landing and the in-shell not-found. Package
 * 1A adds the `(auth)` sign-in page (XS-01, with the XS-03 notices and the XS-04 disclosure), the
 * `/signed-out` redirect (row 21) and the Super Admin's Requests (SA-02) and Request decision
 * (SA-03). Package 1B adds the public surface in the `(public)` group — PU-01 Landing (with the
 * PU-14 section), PU-02 / PU-03 areas, PU-04 catalogue, PU-05 course, PU-06 experiment — and the
 * `/courses` → `/areas` redirect (Appendix A §3.7 row 1). Package 1C adds the public request —
 * PU-07, PU-08, PU-09, PU-10 (with PU-13) and PU-12; its guards (an empty selection, a cold "sent",
 * a request that has no payment step now) replace the address in the browser, where the selection
 * and the tickets live. Every other public address resolves to the root not-found (the public
 * PU-15, inside the public header and footer). Package 1D builds the Super Admin's home — `/admin`
 * is SA-01 Overview (its Phase-1 Requests group), no longer the interim landing — and SA-06
 * Institutions and SA-07 Institution detail. Package 2A (Phase 2) builds the Institute Admin's and
 * the Student's homes (IA-01, ST-01) and their first destinations; the other four bases keep the
 * interim landing. Package 2B completes Phase 2: IA-09, IA-11 and IA-14 get pages; IA-13 and IA-15 are
 * tabs of People, IA-16 of Content access and ST-04 of My courses.
 */

/** What a page file renders. */
export type PageKind =
  /** `/<base>`: until the workspace home is built, it replaces itself with `/<base>/help` (ADR-0005 §8). */
  | 'interim-landing'
  /** A designed screen. */
  | 'screen'
  /** `/<base>/[...unmatched]`: any other workspace address — the in-shell PU-15. */
  | 'unmatched'
  /**
   * A focused task inside a workspace (Phase 4B): the session gate and the workspace guard, but no
   * sidebar or top bar of the shell — the page draws its own bar (B4-12 ST-13 attempt).
   */
  | 'focused';

/** The focused screens (B4-12): ST-13 Assessment attempt has no sidebar (Appendix A §3.6). */
export type FocusedScreenId = 'ST-13';

export type HelpRouteView = 'reports' | 'report' | 'detail';

/** The entry screens with a page of their own outside the workspaces (Appendix A "Entry & shared"). */
export type EntryScreenId = 'XS-01';

/**
 * The public screens with a page of their own (Appendix A "Public"; Packages 1B and 1C). PU-14 is a
 * section of PU-01 (`/#for-institutions`) and PU-13 (Access active) a state of PU-10: neither has a
 * page.
 */
export type PublicPageScreenId =
  | 'PU-01'
  | 'PU-02'
  | 'PU-03'
  | 'PU-04'
  | 'PU-05'
  | 'PU-06'
  | 'PU-07'
  | 'PU-08'
  | 'PU-09'
  | 'PU-10'
  | 'PU-12';

export interface PageRoute {
  /** The URL pattern, Next.js notation (`/student/help/reports/[reportId]`). */
  readonly pattern: string;
  /** The page file, relative to `src/app`. */
  readonly file: string;
  /** The workspace base the page sits under; `null` for the `(auth)` and `(public)` pages. */
  readonly workspace: Workspace | null;
  readonly kind: PageKind;
  /** The screen a `screen` page shows; `null` otherwise. */
  readonly screen: WorkspaceScreenId | EntryScreenId | PublicPageScreenId | FocusedScreenId | null;
  /** The Help view a Help page shows. */
  readonly view?: HelpRouteView;
  /**
   * Screens the page also shows as a tab or a state (Package 2A): IA-08 Faculty is a tab of the
   * People page (`?tab=faculty`), ST-19 "Experiment not available" a state of the experiment hub.
   * Package 2B: People's `?tab=groups` (IA-13) and `?tab=faculty-courses` (IA-15), Content
   * access's `?tab=course-codes` (IA-16) and My courses' `?tab=experiments` (ST-04) — Appendix A
   * rule T2.
   */
  readonly also?: readonly WorkspaceScreenId[];
}

/** The workspace base folder of a role (`/institute` → `institute`), as `SessionService` names it. */
export function workspaceOf(role: Role): Workspace {
  return WORKSPACE_BASE[role].slice(1) as Workspace;
}

/** The role whose workspace a base folder is. */
export function roleOfWorkspace(workspace: Workspace): Role {
  const role = (Object.keys(WORKSPACE_BASE) as Role[]).find(
    (candidate) => workspaceOf(candidate) === workspace,
  );
  if (!role) throw new Error(`No role owns the workspace "${workspace}".`);
  return role;
}

/**
 * The workspace homes built so far: a base whose home screen is built shows it; every other base
 * is the interim landing (ADR-0005 §8; P0-35). Package 1D: the Super Admin's Overview (SA-01).
 * Package 2A: the Institute Admin's Overview (IA-01) and the Student's Home (ST-01).
 */
export const BUILT_HOMES: Readonly<Partial<Record<Workspace, WorkspaceScreenId>>> = {
  admin: 'SA-01',
  'content-manager': 'CM-01',
  faculty: 'FA-01',
  institute: 'IA-01',
  reviewer: 'RV-01',
  student: 'ST-01',
  vendor: 'VE-01',
};

function workspacePages(workspace: Workspace): PageRoute[] {
  const base = `/${workspace}`;
  const home = BUILT_HOMES[workspace] ?? null;
  return [
    {
      pattern: base,
      file: `${workspace}/page.tsx`,
      workspace,
      kind: home ? 'screen' : 'interim-landing',
      screen: home,
    },
    {
      pattern: `${base}/help`,
      file: `${workspace}/help/page.tsx`,
      workspace,
      kind: 'screen',
      screen: 'XS-07',
      view: 'reports',
    },
    {
      pattern: `${base}/help/report`,
      file: `${workspace}/help/report/page.tsx`,
      workspace,
      kind: 'screen',
      screen: 'XS-07',
      view: 'report',
    },
    {
      pattern: `${base}/help/reports/[reportId]`,
      file: `${workspace}/help/reports/[reportId]/page.tsx`,
      workspace,
      kind: 'screen',
      screen: 'XS-07',
      view: 'detail',
    },
    {
      pattern: `${base}/[...unmatched]`,
      file: `${workspace}/[...unmatched]/page.tsx`,
      workspace,
      kind: 'unmatched',
      screen: null,
    },
  ];
}

/**
 * Package 1A (Phase 1): sign-in, and the Super Admin's Requests and Request decision
 * (Appendix A: XS-01 `/sign-in`, SA-02 `/admin/requests`, SA-03 `/admin/requests/[requestId]`).
 */
const PACKAGE_1A_PAGES: readonly PageRoute[] = [
  {
    pattern: '/sign-in',
    file: '(auth)/sign-in/page.tsx',
    workspace: null,
    kind: 'screen',
    screen: 'XS-01',
  },
  {
    pattern: '/admin/requests',
    file: 'admin/requests/page.tsx',
    workspace: 'admin',
    kind: 'screen',
    screen: 'SA-02',
  },
  {
    pattern: '/admin/requests/[requestId]',
    file: 'admin/requests/[requestId]/page.tsx',
    workspace: 'admin',
    kind: 'screen',
    screen: 'SA-03',
  },
];

/**
 * Package 1B (Phase 1): the public surface in the `(public)` route group (ADR-0005 §1; Appendix A
 * PU-01…PU-06; PU-14 is the landing's `#for-institutions` section). Rendered in the browser from
 * the tab's sample world (TE-8).
 */
const PACKAGE_1B_PAGES: readonly PageRoute[] = (
  [
    ['/', '(public)/page.tsx', 'PU-01'],
    ['/areas', '(public)/areas/page.tsx', 'PU-02'],
    ['/areas/[areaId]', '(public)/areas/[areaId]/page.tsx', 'PU-03'],
    ['/experiments', '(public)/experiments/page.tsx', 'PU-04'],
    ['/courses/[courseId]', '(public)/courses/[courseId]/page.tsx', 'PU-05'],
    ['/experiments/[experimentId]', '(public)/experiments/[experimentId]/page.tsx', 'PU-06'],
  ] as const
).map(([pattern, file, screen]) => ({ pattern, file, workspace: null, kind: 'screen', screen }));

/**
 * Package 1C (Phase 1): the public request — PU-07 Your selection, PU-08 Request institutional
 * access (`?step=details|review`), PU-09 Request sent, PU-10 Request status (with the PU-13 Access
 * active state) and PU-12 Payment (Appendix A; owner decision DV-5 / O-05: `[requestId]` is the
 * request's opaque address, never its reference or its ticket). `/requests` alone has no page: it
 * stays the public not-found (Appendix A §3.7 row 2).
 */
const PACKAGE_1C_PAGES: readonly PageRoute[] = (
  [
    ['/selection', '(public)/selection/page.tsx', 'PU-07'],
    ['/request-access', '(public)/request-access/page.tsx', 'PU-08'],
    ['/request-access/sent', '(public)/request-access/sent/page.tsx', 'PU-09'],
    ['/requests/[requestId]', '(public)/requests/[requestId]/page.tsx', 'PU-10'],
    ['/requests/[requestId]/payment', '(public)/requests/[requestId]/payment/page.tsx', 'PU-12'],
  ] as const
).map(([pattern, file, screen]) => ({ pattern, file, workspace: null, kind: 'screen', screen }));

/**
 * Package 1D (Phase 1): the Super Admin's Institutions and Institution detail (Appendix A: SA-06
 * `/admin/institutions`, SA-07 `/admin/institutions/[institutionId]`). SA-01 Overview is the admin
 * base's own page (`BUILT_HOMES`).
 */
const PACKAGE_1D_PAGES: readonly PageRoute[] = (
  [
    ['/admin/institutions', 'admin/institutions/page.tsx', 'SA-06'],
    ['/admin/institutions/[institutionId]', 'admin/institutions/[institutionId]/page.tsx', 'SA-07'],
  ] as const
).map(([pattern, file, screen]) => ({
  pattern,
  file,
  workspace: 'admin',
  kind: 'screen',
  screen,
}));

/**
 * Package 2A (Phase 2): the Institute Admin's campus distribution and the Student's access
 * (Appendix A register routes). `/institute` is IA-01 and `/student` ST-01 (`BUILT_HOMES`). The
 * People page shows IA-06 Students and, on `?tab=faculty`, IA-08 Faculty; the experiment hub shows
 * ST-19 "Experiment not available" in place of its content when the experiment cannot be opened
 * (the register: "no route, no notFound()").
 */
const PACKAGE_2A_PAGES: readonly PageRoute[] = (
  [
    ['/institute/content-access', 'institute/content-access/page.tsx', 'IA-02', ['IA-16']],
    [
      '/institute/content-access/plans/[planId]',
      'institute/content-access/plans/[planId]/page.tsx',
      'IA-03',
    ],
    ['/institute/student-access', 'institute/student-access/page.tsx', 'IA-04'],
    ['/institute/student-access/give', 'institute/student-access/give/page.tsx', 'IA-05'],
    ['/institute/people', 'institute/people/page.tsx', 'IA-06', ['IA-08', 'IA-13', 'IA-15']],
    [
      '/institute/people/students/[studentId]',
      'institute/people/students/[studentId]/page.tsx',
      'IA-07',
    ],
    ['/institute/people/add', 'institute/people/add/page.tsx', 'IA-10'],
    ['/student/courses', 'student/courses/page.tsx', 'ST-02', ['ST-04']],
    ['/student/courses/[courseId]', 'student/courses/[courseId]/page.tsx', 'ST-03'],
    [
      '/student/experiments/[experimentId]',
      'student/experiments/[experimentId]/page.tsx',
      'ST-05',
      ['ST-19'],
    ],
  ] as const
).map(([pattern, file, screen, also]) => ({
  pattern,
  file,
  workspace: pattern.startsWith('/institute') ? 'institute' : 'student',
  kind: 'screen',
  screen,
  ...(also ? { also } : {}),
}));

/**
 * Package 2B (Phase 2): the three remaining Phase-2 pages (Appendix A register routes) — IA-09
 * Faculty record, IA-11 Import students and IA-14 Group (no `/new`: "Create group" is a DL-3 dialog
 * on the Groups tab, D-06). The four tabs are `also` screens of their Package-2A pages.
 */
const PACKAGE_2B_PAGES: readonly PageRoute[] = (
  [
    [
      '/institute/people/faculty/[facultyId]',
      'institute/people/faculty/[facultyId]/page.tsx',
      'IA-09',
    ],
    ['/institute/people/import', 'institute/people/import/page.tsx', 'IA-11'],
    ['/institute/people/groups/[groupId]', 'institute/people/groups/[groupId]/page.tsx', 'IA-14'],
  ] as const
).map(([pattern, file, screen]) => ({
  pattern,
  file,
  workspace: 'institute',
  kind: 'screen',
  screen,
}));

/**
 * Phase 3 (learning, feedback, the device chain, requests to BITS and usage; Appendix A register
 * routes): the experiment hub's Resources (ST-06), Simulation (ST-07) and Progress (ST-10) tabs;
 * the WEB page (ST-08) and the AR / VR / MR page (ST-09, `[format]` = ar | vr | mr, else not
 * found); format feedback (ST-16, with ST-17 Feedback sent as its state); Progress (ST-15); My
 * device (ST-18); the Institute Admin's Requests page — Requests to BITS (IA-17) and, on
 * `?tab=devices`, Device requests (IA-18) — its request detail (B3-08 f4 … f6, no screen id: O-02),
 * the device request (IA-19) and Usage (IA-20); the Super Admin's Operations › Device transfers
 * (SA-18) and the transfer decision (SA-19).
 */
const PHASE_3_PAGES: readonly PageRoute[] = (
  [
    [
      '/student/experiments/[experimentId]/resources',
      'student/experiments/[experimentId]/resources/page.tsx',
      'ST-06',
    ],
    [
      '/student/experiments/[experimentId]/simulation',
      'student/experiments/[experimentId]/simulation/page.tsx',
      'ST-07',
    ],
    [
      '/student/experiments/[experimentId]/simulation/web',
      'student/experiments/[experimentId]/simulation/web/page.tsx',
      'ST-08',
    ],
    [
      '/student/experiments/[experimentId]/simulation/[format]',
      'student/experiments/[experimentId]/simulation/[format]/page.tsx',
      'ST-09',
    ],
    [
      '/student/experiments/[experimentId]/progress',
      'student/experiments/[experimentId]/progress/page.tsx',
      'ST-10',
    ],
    [
      '/student/experiments/[experimentId]/feedback/[format]',
      'student/experiments/[experimentId]/feedback/[format]/page.tsx',
      'ST-16',
      ['ST-17'],
    ],
    ['/student/progress', 'student/progress/page.tsx', 'ST-15'],
    ['/student/device', 'student/device/page.tsx', 'ST-18'],
    ['/institute/requests', 'institute/requests/page.tsx', 'IA-17', ['IA-18']],
    ['/institute/requests/[requestId]', 'institute/requests/[requestId]/page.tsx', 'IA-17'],
    [
      '/institute/requests/devices/[transferId]',
      'institute/requests/devices/[transferId]/page.tsx',
      'IA-19',
    ],
    ['/institute/usage', 'institute/usage/page.tsx', 'IA-20'],
    ['/admin/operations/device-transfers', 'admin/operations/device-transfers/page.tsx', 'SA-18'],
    [
      '/admin/operations/device-transfers/[transferId]',
      'admin/operations/device-transfers/[transferId]/page.tsx',
      'SA-19',
    ],
  ] as const
).map(([pattern, file, screen, also]) => ({
  pattern,
  file,
  workspace: pattern.startsWith('/institute')
    ? 'institute'
    : pattern.startsWith('/admin')
      ? 'admin'
      : 'student',
  kind: 'screen',
  screen,
  ...(also ? { also } : {}),
}));

/**
 * Every page file: the Phase-0 pages of the seven workspaces (35; the admin base is SA-01 since
 * Package 1D, the institute and student bases IA-01 and ST-01 since Package 2A), Package 1A's (3),
 * Package 1B's (6), Package 1C's (5), Package 1D's (2), Package 2A's (10), Package 2B's (3),
 * Phase 3's (14).
 */
/**
 * Phase 4A (boards B4-01 … B4-07): the Faculty workspace's home (FA-01), My courses with its
 * Experiments tab (FA-02, FA-04 `?tab=experiments`), a course (FA-03), an experiment (FA-05),
 * Assessments (FA-06), Create assessment (FA-07, `?step=`), an assessment's Summary, Questions,
 * Settings and Preview tabs (FA-08 … FA-11; Submissions, FA-12, came with Phase 4B), the Question bank
 * (FA-14) and Add / edit question (FA-15). The static `new` pages are listed before their dynamic
 * siblings: they outrank them in the App Router, and `resolveAddress` takes the first match.
 */
const PHASE_4A_PAGES: readonly PageRoute[] = (
  [
    ['/faculty/courses', 'faculty/courses/page.tsx', 'FA-02', ['FA-04']],
    ['/faculty/courses/[courseId]', 'faculty/courses/[courseId]/page.tsx', 'FA-03'],
    ['/faculty/experiments/[experimentId]', 'faculty/experiments/[experimentId]/page.tsx', 'FA-05'],
    ['/faculty/assessments', 'faculty/assessments/page.tsx', 'FA-06'],
    ['/faculty/assessments/new', 'faculty/assessments/new/page.tsx', 'FA-07'],
    ['/faculty/assessments/[assessmentId]', 'faculty/assessments/[assessmentId]/page.tsx', 'FA-08'],
    [
      '/faculty/assessments/[assessmentId]/questions',
      'faculty/assessments/[assessmentId]/questions/page.tsx',
      'FA-09',
    ],
    [
      '/faculty/assessments/[assessmentId]/settings',
      'faculty/assessments/[assessmentId]/settings/page.tsx',
      'FA-10',
    ],
    [
      '/faculty/assessments/[assessmentId]/preview',
      'faculty/assessments/[assessmentId]/preview/page.tsx',
      'FA-11',
    ],
    ['/faculty/question-bank', 'faculty/question-bank/page.tsx', 'FA-14'],
    ['/faculty/question-bank/new', 'faculty/question-bank/new/page.tsx', 'FA-15'],
    ['/faculty/question-bank/[questionId]', 'faculty/question-bank/[questionId]/page.tsx', 'FA-15'],
  ] as const
).map(([pattern, file, screen, also]) => ({
  pattern,
  file,
  workspace: 'faculty',
  kind: 'screen',
  screen,
  ...(also ? { also } : {}),
}));

/**
 * Phase 4B (boards B4-06 f7 … f11, B4-08 … B4-13): the Student's Assessments (ST-11), an
 * assessment's "Before you start" (ST-12), the attempt (ST-13, a focused page without the shell),
 * the result (ST-14) and the experiment hub's Assessment tab (a tab of ST-05, the register's
 * unnumbered "hub Assessment tab"); the Faculty assessment's Submissions tab (FA-12, with FA-22
 * Export CSV), Draft with assistance (FA-16) and Import questions (FA-17) beside the question
 * bank, Marking (FA-18), Mark a submission (FA-19), Students (FA-20, with FA-22) and a Student's
 * detail (FA-21, `?experimentId=`). The static `draft` and `import` pages outrank
 * `[questionId]` (`resolveAddress` matches static patterns first).
 */
const PHASE_4B_PAGES: readonly PageRoute[] = (
  [
    ['/student/assessments', 'student/assessments/page.tsx', 'ST-11', 'screen'],
    [
      '/student/assessments/[assessmentId]',
      'student/assessments/[assessmentId]/page.tsx',
      'ST-12',
      'screen',
    ],
    [
      '/student/assessments/[assessmentId]/attempt',
      'student/assessments/[assessmentId]/attempt/page.tsx',
      'ST-13',
      'focused',
    ],
    [
      '/student/assessments/[assessmentId]/result',
      'student/assessments/[assessmentId]/result/page.tsx',
      'ST-14',
      'screen',
    ],
    [
      '/student/experiments/[experimentId]/assessment',
      'student/experiments/[experimentId]/assessment/page.tsx',
      'ST-05',
      'screen',
    ],
    [
      '/faculty/assessments/[assessmentId]/submissions',
      'faculty/assessments/[assessmentId]/submissions/page.tsx',
      'FA-12',
      'screen',
    ],
    ['/faculty/question-bank/draft', 'faculty/question-bank/draft/page.tsx', 'FA-16', 'screen'],
    ['/faculty/question-bank/import', 'faculty/question-bank/import/page.tsx', 'FA-17', 'screen'],
    ['/faculty/marking', 'faculty/marking/page.tsx', 'FA-18', 'screen'],
    ['/faculty/marking/[attemptId]', 'faculty/marking/[attemptId]/page.tsx', 'FA-19', 'screen'],
    ['/faculty/students', 'faculty/students/page.tsx', 'FA-20', 'screen'],
    ['/faculty/students/[studentId]', 'faculty/students/[studentId]/page.tsx', 'FA-21', 'screen'],
  ] as const
).map(([pattern, file, screen, kind]) => ({
  pattern,
  file,
  workspace: pattern.startsWith('/faculty') ? 'faculty' : 'student',
  kind,
  screen,
}));

/**
 * Phase 5 (boards B5-01 … B5-08, B6-01 … B6-03, B6-05 … B6-08, B6-10 … B6-12): the Vendor's
 * home (VE-01), My experiments (VE-02), the editor — a new experiment (VE-03, with VE-04 … VE-06
 * as its `?step=`s until its first save gives it an id), a saved draft (VE-09, the same steps) and
 * a returned one revised and resubmitted (VE-08) — and the Experiment record with its History tab
 * (VE-07, VE-13 `?tab=history`); the Academic Reviewer's home (RV-01), Review queue (RV-02),
 * Review a submission (RV-03, with RV-06 its decided read-only state) and Reviewed by me (RV-05);
 * the Content Manager's home (CM-01), Ready to publish (CM-02), Publication decision (CM-03),
 * Content library (CM-04), Published experiment (CM-05; its correction entry is Phase 6) and
 * Course codes (CM-09). The static `new` page outranks `[submissionId]`.
 */
const PHASE_5_PAGES: readonly PageRoute[] = (
  [
    ['/vendor/experiments', 'vendor/experiments/page.tsx', 'VE-02'],
    [
      '/vendor/experiments/new',
      'vendor/experiments/new/page.tsx',
      'VE-03',
      ['VE-04', 'VE-05', 'VE-06'],
    ],
    [
      '/vendor/experiments/[submissionId]',
      'vendor/experiments/[submissionId]/page.tsx',
      'VE-07',
      ['VE-13'],
    ],
    [
      '/vendor/experiments/[submissionId]/edit',
      'vendor/experiments/[submissionId]/edit/page.tsx',
      'VE-09',
    ],
    [
      '/vendor/experiments/[submissionId]/revise',
      'vendor/experiments/[submissionId]/revise/page.tsx',
      'VE-08',
    ],
    ['/reviewer/queue', 'reviewer/queue/page.tsx', 'RV-02'],
    [
      '/reviewer/submissions/[submissionId]',
      'reviewer/submissions/[submissionId]/page.tsx',
      'RV-03',
      ['RV-06'],
    ],
    ['/reviewer/reviewed', 'reviewer/reviewed/page.tsx', 'RV-05'],
    ['/content-manager/ready', 'content-manager/ready/page.tsx', 'CM-02'],
    [
      '/content-manager/decisions/[submissionId]',
      'content-manager/decisions/[submissionId]/page.tsx',
      'CM-03',
    ],
    ['/content-manager/library', 'content-manager/library/page.tsx', 'CM-04'],
    [
      '/content-manager/published/[experimentId]',
      'content-manager/published/[experimentId]/page.tsx',
      'CM-05',
    ],
    ['/content-manager/course-codes', 'content-manager/course-codes/page.tsx', 'CM-09'],
  ] as const
).map(([pattern, file, screen, also]) => ({
  pattern,
  file,
  workspace: pattern.startsWith('/vendor')
    ? 'vendor'
    : pattern.startsWith('/reviewer')
      ? 'reviewer'
      : 'content-manager',
  kind: 'screen',
  screen,
  ...(also ? { also } : {}),
}));

export const PAGES: readonly PageRoute[] = [
  ...WORKSPACES.flatMap(workspacePages),
  ...PACKAGE_1A_PAGES,
  ...PACKAGE_1B_PAGES,
  ...PACKAGE_1C_PAGES,
  ...PACKAGE_1D_PAGES,
  ...PACKAGE_2A_PAGES,
  ...PACKAGE_2B_PAGES,
  ...PHASE_3_PAGES,
  ...PHASE_4A_PAGES,
  ...PHASE_4B_PAGES,
  ...PHASE_5_PAGES,
];

/** Whether an address is a focused page (no shell): ST-13's attempt. */
export function isFocusedAddress(pathname: string): boolean {
  const segments = pathname.split(/[?#]/)[0]!.split('/').slice(1);
  return PAGES.some((page) => page.kind === 'focused' && matchesPattern(page.pattern, segments));
}

/**
 * The other route files of Appendix F §3.3: the root layout and not-found (public PU-15), each
 * workspace's layout (SessionGate → WorkspaceFrame) and not-found (in-shell PU-15), the `(auth)`
 * layout (the AR-6 focused frame of B1-09, no public header) and the kept `/healthz` handler.
 */
export const ROUTE_FILES: readonly string[] = [
  'layout.tsx',
  'not-found.tsx',
  'healthz/route.ts',
  '(auth)/layout.tsx',
  '(public)/layout.tsx',
  ...WORKSPACES.flatMap((workspace) => [`${workspace}/layout.tsx`, `${workspace}/not-found.tsx`]),
];

/** XS-03 "Signed out" (B1-09 f10) as the sign-in card's notice (Appendix A §3.7 row 21; D-15). */
export const SIGNED_OUT_ADDRESS = '/sign-in?reason=signed-out';

/**
 * The static redirects (`next.config.ts` `redirects()`, Appendix A §3.7): row 20 —
 * `/<base>/help/reports` → `/<base>/help` (My reports lives on the Help landing) — and row 21,
 * `/signed-out` → `/sign-in?reason=signed-out` (XS-03's proposed address keeps working).
 */
export const REDIRECTS: readonly {
  readonly source: string;
  readonly destination: string;
}[] = [
  ...WORKSPACES.map((workspace) => ({
    source: `/${workspace}/help/reports`,
    destination: `/${workspace}/help`,
  })),
  { source: '/signed-out', destination: SIGNED_OUT_ADDRESS },
  // Row 1 (Package 1B): the PU-05 breadcrumb's intermediate "Areas" level.
  { source: '/courses', destination: '/areas' },
  // Row 17 (Phase 3, board-forced): "Operations" opens Device transfers (B7-09 f0; B3-11).
  { source: '/admin/operations', destination: '/admin/operations/device-transfers' },
];

/** The workspace screens built as pages (the entry and public pages are not sidebar destinations). */
export const SCREENS_WITH_PAGES: ReadonlySet<WorkspaceScreenId> = new Set(
  PAGES.flatMap((page) =>
    page.screen && page.workspace !== null && page.kind !== 'focused'
      ? [page.screen as WorkspaceScreenId, ...(page.also ?? [])]
      : [],
  ),
);

/** The public screens built as pages (the public header, menu sheet and footer render only these). */
export const PUBLIC_SCREENS_WITH_PAGES: ReadonlySet<PublicPageScreenId> = new Set(
  PAGES.flatMap((page) =>
    page.screen && page.workspace === null && page.screen !== 'XS-01'
      ? [page.screen as PublicPageScreenId]
      : [],
  ),
);

/** Where an address leads (for the link-target ledger and its tests). */
export type AddressOutcome =
  | { readonly kind: 'screen'; readonly workspace: Workspace; readonly view: HelpRouteView }
  | {
      readonly kind: 'record-screen';
      readonly workspace: Workspace;
      readonly screen: WorkspaceScreenId | FocusedScreenId;
    }
  | { readonly kind: 'interim-landing'; readonly workspace: Workspace; readonly lands: string }
  | { readonly kind: 'redirect'; readonly workspace: Workspace | null; readonly to: string }
  | { readonly kind: 'workspace-not-found'; readonly workspace: Workspace }
  | { readonly kind: 'sign-in' }
  | { readonly kind: 'public-screen'; readonly screen: PublicPageScreenId }
  | { readonly kind: 'public-not-found' };

const WORKSPACE_SET: ReadonlySet<string> = new Set(WORKSPACES);

/** What a same-origin path resolves to, by the manifest above (a query or fragment is ignored). */
export function resolveAddress(address: string): AddressOutcome {
  const pathname = address.split(/[?#]/)[0]!;
  const segments = pathname.split('/').slice(1);
  const [first, ...rest] = segments;
  const tail = rest.filter((part, index) => part !== '' || index < rest.length - 1);
  if (first === 'sign-in' && tail.length === 0) return { kind: 'sign-in' };
  if (first === 'signed-out' && tail.length === 0) {
    return { kind: 'redirect', workspace: null, to: SIGNED_OUT_ADDRESS };
  }
  if (!first || !WORKSPACE_SET.has(first)) return resolvePublic(first ?? '', tail);
  const workspace = first as Workspace;
  const parts = tail;
  if (parts.length === 0) {
    const home = BUILT_HOMES[workspace];
    if (home) return { kind: 'record-screen', workspace, screen: home };
    return { kind: 'interim-landing', workspace, lands: `/${workspace}/help` };
  }
  if (parts[0] === 'help') {
    if (parts.length === 1) return { kind: 'screen', workspace, view: 'reports' };
    if (parts.length === 2 && parts[1] === 'report')
      return { kind: 'screen', workspace, view: 'report' };
    if (parts.length === 2 && parts[1] === 'reports') {
      return { kind: 'redirect', workspace, to: `/${workspace}/help` };
    }
    if (parts.length === 3 && parts[1] === 'reports' && parts[2] !== '') {
      return { kind: 'screen', workspace, view: 'detail' };
    }
  }
  // A static redirect of a workspace address (Phase 3, row 17: `/admin/operations`).
  const redirect = REDIRECTS.find((entry) => entry.source === `/${[first, ...parts].join('/')}`);
  if (redirect) return { kind: 'redirect', workspace, to: redirect.destination };
  // The record and list screens, by their manifest pattern; a static pattern outranks a dynamic
  // sibling, as in the App Router (Phase 4B: `/faculty/question-bank/draft` beside `[questionId]`).
  const candidates = PAGES.filter(
    (page) =>
      page.workspace === workspace &&
      (page.kind === 'screen' || page.kind === 'focused') &&
      !page.view &&
      page.pattern !== `/${workspace}` &&
      matchesPattern(page.pattern, [first, ...parts]),
  );
  const page = candidates.find((entry) => !entry.pattern.includes('[')) ?? candidates[0];
  if (page) {
    return {
      kind: 'record-screen',
      workspace,
      screen: page.screen as WorkspaceScreenId | FocusedScreenId,
    };
  }
  return { kind: 'workspace-not-found', workspace };
}

/** Whether path segments match a manifest pattern (`[param]` = one non-empty segment). */
function matchesPattern(pattern: string, segments: readonly string[]): boolean {
  const wanted = pattern.split('/').slice(1);
  if (wanted.length !== segments.length) return false;
  return wanted.every((part, index) => {
    const segment = segments[index]!;
    return /^\[[^\].]+\]$/.test(part) ? segment !== '' : part === segment;
  });
}

/** The public surface (Package 1B): `/`, `/areas[/id]`, `/courses/id`, `/experiments[/id]`. */
function resolvePublic(first: string, tail: readonly string[]): AddressOutcome {
  if (first === '' && tail.length === 0) return { kind: 'public-screen', screen: 'PU-01' };
  const id = tail.length === 1 && tail[0] !== '';
  if (first === 'areas' && tail.length === 0) return { kind: 'public-screen', screen: 'PU-02' };
  if (first === 'areas' && id) return { kind: 'public-screen', screen: 'PU-03' };
  if (first === 'experiments' && tail.length === 0)
    return { kind: 'public-screen', screen: 'PU-04' };
  if (first === 'experiments' && id) return { kind: 'public-screen', screen: 'PU-06' };
  if (first === 'courses' && tail.length === 0)
    return { kind: 'redirect', workspace: null, to: '/areas' };
  if (first === 'courses' && id) return { kind: 'public-screen', screen: 'PU-05' };
  if (first === 'selection' && tail.length === 0) return { kind: 'public-screen', screen: 'PU-07' };
  if (first === 'request-access' && tail.length === 0)
    return { kind: 'public-screen', screen: 'PU-08' };
  if (first === 'request-access' && tail.length === 1 && tail[0] === 'sent')
    return { kind: 'public-screen', screen: 'PU-09' };
  if (first === 'requests' && id) return { kind: 'public-screen', screen: 'PU-10' };
  if (first === 'requests' && tail.length === 2 && tail[0] !== '' && tail[1] === 'payment')
    return { kind: 'public-screen', screen: 'PU-12' };
  return { kind: 'public-not-found' };
}
