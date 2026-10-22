/**
 * The Phase-0 route manifest against the files on disk (Appendix F WP-0.13 acceptance 8: "A
 * route-manifest test fails if any page.tsx outside §3.3 exists"), the static redirects of
 * next.config.ts (Appendix A §3.7 row 20), the generated built-screen manifest and what each
 * address resolves to.
 */
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { WORKSPACES } from '@xr/contracts/draft';
import { PLATFORM_ROLES } from '@xr/domain';
import { describe, expect, it } from 'vitest';

import nextConfig from '../../next.config';
import { BUILT_SCREENS } from './built-screens';
import { WORKSPACE_BASE } from './nav-config';
import {
  PAGES,
  REDIRECTS,
  resolveAddress,
  roleOfWorkspace,
  PUBLIC_SCREENS_WITH_PAGES,
  ROUTE_FILES,
  SCREENS_WITH_PAGES,
  workspaceOf,
} from './routes';

const APP = join(import.meta.dirname, '..', 'app');
const SRC = join(import.meta.dirname, '..');

function filesUnder(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? filesUnder(path) : [relative(APP, path)];
  });
}

/** The App Router's special files (a route segment's UI or handler). */
const ROUTE_FILE =
  /(?:^|\/)(?:page|layout|template|not-found|error|loading|default|route|global-error|global-not-found|forbidden|unauthorized)\.(?:tsx?|jsx?)$/;

describe('the route files are exactly the manifest (Appendix F §3.3; WP-0.13 acceptance 8; Packages 1A–1D, 2A, 2B; Phase 3)', () => {
  const routeFiles = filesUnder(APP).filter((file) => ROUTE_FILE.test(file));

  it('every page.tsx is in the manifest, and every manifest page exists', () => {
    const pages = routeFiles.filter((file) => /(?:^|\/)page\.tsx$/.test(file)).sort();
    expect(pages).toEqual(PAGES.map((page) => page.file).sort());
    // 35 Phase-0 pages (7 workspaces × 5) + Package 1A's sign-in, Requests and Request decision +
    // Package 1B's six public pages (PU-01 … PU-06; PU-14 is a section of PU-01) + Package 1C's
    // five request pages (PU-07, PU-08, PU-09, PU-10, PU-12; PU-13 is a state of PU-10) + Package
    // 1D's Institutions and Institution detail (SA-01 is the admin base's own page) + Package 2A's
    // ten Institute Admin and Student pages (IA-01 and ST-01 are their bases' own pages) + Package
    // 2B's three (IA-09, IA-11, IA-14; its four tabs are `?tab=` views of 2A pages) + Phase 3's
    // fourteen (ST-17 and IA-18 are a state and a tab; the request detail has no screen id, O-02)
    // + Phase 4A's twelve (FA-01 is the faculty base's own page; FA-04 is My courses' tab; FA-15 has
    // two pages, new and edit).
    // + Phase 4B's twelve (ST-11, ST-12, the focused ST-13, ST-14, the hub's Assessment tab,
    // FA-12, FA-16 … FA-21; FA-22 is an action, not a page).
    // + Phase 5's thirteen (VE-01, RV-01 and CM-01 are their bases' own pages; VE-04 … VE-06 are
    // steps of the editor, VE-13 the record's tab, RV-06 the review page's decided state).
    // + Phase 6's fifteen (CM-06 and CM-07 open the CM-08 update page; SA-15 has an area and a
    // course page; SA-01 is the admin base's own page, completed in place).
    // + Phase 7's two prototype support pages (owner authorisation, 17 Oct 2026; no screen id):
    // TE-6 "Reset demo data" and the TE-3 sample WEB activity.
    expect(pages).toHaveLength(132);
    expect(PAGES.filter((page) => page.kind === 'prototype').map((page) => page.pattern)).toEqual([
      '/prototype/reset',
      '/prototype/web-activity',
    ]);
  });

  it('every other route file is a §3.3 layout, not-found or the kept /healthz handler', () => {
    const others = routeFiles.filter((file) => !/(?:^|\/)page\.tsx$/.test(file)).sort();
    expect(others).toEqual([...ROUTE_FILES].sort());
  });

  it('seven static workspace bases and no dynamic root segment (ADR-0005 §1; D-12)', () => {
    const roots = readdirSync(APP).filter((entry) => statSync(join(APP, entry)).isDirectory());
    // Plus the `(auth)`, `(public)` and `(landing)` route groups (ADR-0005 §1; the landing's own
    // since prompt 13, D-13), which add no URL segment, and Phase 7's `/prototype` support pages (a
    // local prototype build's, not a workspace).
    expect(roots.filter((entry) => !entry.startsWith('_')).sort()).toEqual(
      [...WORKSPACES, 'healthz', '(auth)', '(public)', '(landing)', 'prototype'].sort(),
    );
    expect(roots.some((entry) => entry.startsWith('['))).toBe(false);
    // Private folders hold route-level modules only, never a route.
    for (const entry of roots.filter((name) => name.startsWith('_'))) {
      expect(filesUnder(join(APP, entry)).filter((file) => ROUTE_FILE.test(file))).toEqual([]);
    }
  });

  it('no proxy or middleware in sample mode (X-3): the session gate is a client component', () => {
    const top = readdirSync(SRC);
    expect(top).not.toContain('proxy.ts');
    expect(top).not.toContain('middleware.ts');
    expect(readdirSync(join(SRC, '..'))).not.toContain('middleware.ts');
    expect(readdirSync(join(SRC, '..'))).not.toContain('proxy.ts');
  });

  it('Packages 1A–1D, 2A and 2B only: sign-in, four Super Admin pages, the six public pages, the five request pages and the Phase-2 pages', () => {
    const all = filesUnder(APP);
    for (const forbidden of [/signed-out/, /\(public\)\/requests\/page\.tsx$/]) {
      expect(all.filter((file) => forbidden.test(file))).toEqual([]);
    }
    expect(all.filter((file) => /^\(public\)/.test(file)).sort()).toEqual([
      '(public)/areas/[areaId]/page.tsx',
      '(public)/areas/page.tsx',
      '(public)/courses/[courseId]/page.tsx',
      '(public)/experiments/[experimentId]/page.tsx',
      '(public)/experiments/page.tsx',
      '(public)/layout.tsx',
      '(public)/request-access/page.tsx',
      '(public)/request-access/sent/page.tsx',
      '(public)/requests/[requestId]/page.tsx',
      '(public)/requests/[requestId]/payment/page.tsx',
      '(public)/selection/page.tsx',
    ]);
    expect(all.filter((file) => /sign-in/.test(file)).sort()).toEqual([
      '(auth)/sign-in/page.tsx',
      '_auth/sign-in-route.tsx',
    ]);
    expect(all.filter((file) => /^admin\/requests/.test(file)).sort()).toEqual([
      'admin/requests/[requestId]/page.tsx',
      'admin/requests/page.tsx',
    ]);
    // Package 1D: SA-06 and SA-07; the Super Admin's base page is SA-01.
    expect(all.filter((file) => /^admin\/institutions/.test(file)).sort()).toEqual([
      'admin/institutions/[institutionId]/page.tsx',
      'admin/institutions/page.tsx',
    ]);
    expect(PAGES.find((page) => page.file === 'admin/page.tsx')).toMatchObject({
      kind: 'screen',
      screen: 'SA-01',
    });
    // Packages 2A and 2B: the Institute Admin's and the Student's pages; their bases are IA-01 and
    // ST-01. Package 2B adds IA-09, IA-11 and IA-14 (no `/groups/new`: D-06).
    expect(
      all
        .filter((file) => /^(institute|student)\//.test(file) && file.endsWith('page.tsx'))
        .filter((file) => !/\/(help|\[\.\.\.unmatched\])\//.test(file))
        .sort(),
    ).toEqual([
      'institute/content-access/page.tsx',
      'institute/content-access/plans/[planId]/page.tsx',
      'institute/page.tsx',
      'institute/people/add/page.tsx',
      'institute/people/faculty/[facultyId]/page.tsx',
      'institute/people/groups/[groupId]/page.tsx',
      'institute/people/import/page.tsx',
      'institute/people/page.tsx',
      'institute/people/students/[studentId]/page.tsx',
      // Phase 3: Requests (IA-17 with the IA-18 tab), its request detail, IA-19 and IA-20.
      'institute/requests/[requestId]/page.tsx',
      'institute/requests/devices/[transferId]/page.tsx',
      'institute/requests/page.tsx',
      'institute/student-access/give/page.tsx',
      'institute/student-access/page.tsx',
      'institute/usage/page.tsx',
      // Phase 4B: Assessments (ST-11), before you start (ST-12), the attempt (ST-13), the result
      // (ST-14) and the hub's Assessment tab.
      'student/assessments/[assessmentId]/attempt/page.tsx',
      'student/assessments/[assessmentId]/page.tsx',
      'student/assessments/[assessmentId]/result/page.tsx',
      'student/assessments/page.tsx',
      'student/courses/[courseId]/page.tsx',
      'student/courses/page.tsx',
      // Phase 3: My device (ST-18), the hub's tabs and pages, feedback and Progress.
      'student/device/page.tsx',
      'student/experiments/[experimentId]/assessment/page.tsx',
      'student/experiments/[experimentId]/feedback/[format]/page.tsx',
      'student/experiments/[experimentId]/page.tsx',
      'student/experiments/[experimentId]/progress/page.tsx',
      'student/experiments/[experimentId]/resources/page.tsx',
      'student/experiments/[experimentId]/simulation/[format]/page.tsx',
      'student/experiments/[experimentId]/simulation/page.tsx',
      'student/experiments/[experimentId]/simulation/web/page.tsx',
      'student/page.tsx',
      'student/progress/page.tsx',
    ]);
    // Phase 3: the Super Admin's Operations › Device transfers (SA-18) and the decision (SA-19);
    // Phase 6: Access ending (SA-22), Support (SA-20) and a support report (SA-21).
    expect(all.filter((file) => /^admin\/operations/.test(file)).sort()).toEqual([
      'admin/operations/access-ending/page.tsx',
      'admin/operations/device-transfers/[transferId]/page.tsx',
      'admin/operations/device-transfers/page.tsx',
      'admin/operations/support/[reportId]/page.tsx',
      'admin/operations/support/page.tsx',
    ]);
    // Phase 6: Content (SA-10 … SA-13), Academic structure (SA-14, SA-15), Platform roles (SA-16,
    // SA-17); the Content Manager's Updates (CM-08) and the reviewer's update (RV-04).
    expect(all.filter((file) => /^admin\/(content|structure|roles)\//.test(file)).sort()).toEqual([
      'admin/content/all/page.tsx',
      'admin/content/records/[recordId]/page.tsx',
      'admin/content/updates/[updateId]/page.tsx',
      'admin/content/updates/page.tsx',
      'admin/roles/[holderId]/page.tsx',
      'admin/roles/page.tsx',
      'admin/structure/areas/[areaId]/page.tsx',
      'admin/structure/courses/[courseId]/page.tsx',
      'admin/structure/page.tsx',
    ]);
    expect(
      all.filter((file) => /^(content-manager|reviewer)\/updates\//.test(file)).sort(),
    ).toEqual([
      'content-manager/updates/[updateId]/page.tsx',
      'content-manager/updates/page.tsx',
      'reviewer/updates/[updateId]/page.tsx',
    ]);
    expect(PAGES.find((page) => page.file === 'institute/page.tsx')).toMatchObject({
      kind: 'screen',
      screen: 'IA-01',
    });
    expect(PAGES.find((page) => page.file === 'student/page.tsx')).toMatchObject({
      kind: 'screen',
      screen: 'ST-01',
    });
    expect(PAGES.find((page) => page.file === 'faculty/page.tsx')).toMatchObject({
      kind: 'screen',
      screen: 'FA-01',
    });
    // Phase 5: every workspace home is built; no base is the interim landing any more.
    expect(
      PAGES.filter((page) => page.kind === 'interim-landing').map((page) => page.pattern),
    ).toEqual([]);
    // Phase 4A: the Faculty pages (FA-01 is the base's own page; FA-04 a tab of My courses).
    expect(
      all
        .filter((file) => /^faculty\//.test(file) && file.endsWith('page.tsx'))
        .filter((file) => !/\/(help|\[\.\.\.unmatched\])\//.test(file))
        .sort(),
    ).toEqual([
      'faculty/assessments/[assessmentId]/page.tsx',
      'faculty/assessments/[assessmentId]/preview/page.tsx',
      'faculty/assessments/[assessmentId]/questions/page.tsx',
      'faculty/assessments/[assessmentId]/settings/page.tsx',
      // Phase 4B: the record's Submissions tab (FA-12).
      'faculty/assessments/[assessmentId]/submissions/page.tsx',
      'faculty/assessments/new/page.tsx',
      'faculty/assessments/page.tsx',
      'faculty/courses/[courseId]/page.tsx',
      'faculty/courses/page.tsx',
      'faculty/experiments/[experimentId]/page.tsx',
      // Phase 4B: Marking (FA-18) and a submission (FA-19).
      'faculty/marking/[attemptId]/page.tsx',
      'faculty/marking/page.tsx',
      'faculty/page.tsx',
      'faculty/question-bank/[questionId]/page.tsx',
      // Phase 4B: Draft with assistance (FA-16) and Import (FA-17).
      'faculty/question-bank/draft/page.tsx',
      'faculty/question-bank/import/page.tsx',
      'faculty/question-bank/new/page.tsx',
      'faculty/question-bank/page.tsx',
      // Phase 4B: Students (FA-20) and a Student (FA-21).
      'faculty/students/[studentId]/page.tsx',
      'faculty/students/page.tsx',
    ]);
    // Phase 4B: ST-13 is the one focused page (no shell, B4-12).
    expect(PAGES.filter((page) => page.kind === 'focused').map((page) => page.screen)).toEqual([
      'ST-13',
    ]);
  });
});

describe('static redirects (next.config.ts; Appendix A §3.7)', () => {
  it('row 20 for the seven bases, row 21 (/signed-out) and row 1 (/courses), not permanent; nothing else', async () => {
    const redirects = await nextConfig.redirects!();
    expect(redirects).toEqual(REDIRECTS.map((redirect) => ({ ...redirect, permanent: false })));
    expect(redirects).toHaveLength(11);
    expect(redirects.slice(-4)).toEqual([
      { source: '/signed-out', destination: '/sign-in?reason=signed-out', permanent: false },
      // Package 1B: the PU-05 breadcrumb's intermediate level.
      { source: '/courses', destination: '/areas', permanent: false },
      // Phase 3, row 17 (board-forced): "Operations" opens Device transfers.
      {
        source: '/admin/operations',
        destination: '/admin/operations/device-transfers',
        permanent: false,
      },
      // Phase 6, row 15 (board-forced): "Content" opens Updates.
      { source: '/admin/content', destination: '/admin/content/updates', permanent: false },
    ]);
  });
});

describe('the built-screen manifest is generated from the route manifest', () => {
  it('Help (XS-07) in every workspace, the Super Admin’s Requests and decision (Package 1A), Overview, Institutions and Institution detail (Package 1D), and Phase 2’s twenty-one ids (Packages 2A, 2B)', () => {
    const built = [
      'ST-01',
      'XS-07',
      // Phase 4A: the faculty base's own page.
      'FA-01',
      'IA-01',
      // Phase 5: the Vendor's, the Academic Reviewer's and the Content Manager's homes.
      'VE-01',
      'RV-01',
      'CM-01',
      'SA-01',
      'SA-02',
      'SA-03',
      'SA-06',
      'SA-07',
      'IA-02',
      // IA-16 Course codes is the Content access page's tab (Package 2B).
      'IA-16',
      'IA-03',
      'IA-04',
      'IA-05',
      'IA-06',
      // IA-08 Faculty, IA-13 Groups and IA-15 Faculty courses are the People page's tabs; ST-19 a
      // state of the experiment hub.
      'IA-08',
      'IA-13',
      'IA-15',
      'IA-07',
      'IA-10',
      'ST-02',
      // ST-04 All experiments is My courses' tab (Package 2B).
      'ST-04',
      'ST-03',
      'ST-05',
      'ST-19',
      'IA-09',
      'IA-11',
      'IA-14',
      // Phase 3's fifteen ids: ST-17 is ST-16's state, IA-18 the Requests page's tab.
      'ST-06',
      'ST-07',
      'ST-08',
      'ST-09',
      'ST-10',
      'ST-16',
      'ST-17',
      'ST-15',
      'ST-18',
      'IA-17',
      'IA-18',
      'IA-19',
      'IA-20',
      'SA-18',
      'SA-19',
      // Phase 4A's other twelve ids: FA-04 is My courses' tab.
      'FA-02',
      'FA-04',
      'FA-03',
      'FA-05',
      'FA-06',
      'FA-07',
      'FA-08',
      'FA-09',
      'FA-10',
      'FA-11',
      'FA-14',
      'FA-15',
      // Phase 4B: ST-13 is focused (not a sidebar screen), the hub's Assessment tab is ST-05's
      // and FA-22 an action.
      'ST-11',
      'ST-12',
      'ST-14',
      'FA-12',
      'FA-16',
      'FA-17',
      'FA-18',
      'FA-19',
      'FA-20',
      'FA-21',
      // Phase 5: VE-04 … VE-06 are the editor's steps, VE-13 the record's History tab, RV-06 the
      // review page's decided state.
      'VE-02',
      'VE-03',
      'VE-04',
      'VE-05',
      'VE-06',
      'VE-07',
      'VE-13',
      'VE-09',
      'VE-08',
      'RV-02',
      'RV-03',
      'RV-06',
      'RV-05',
      'CM-02',
      'CM-03',
      'CM-04',
      'CM-05',
      'CM-09',
      // Phase 6: CM-06 and CM-07 open the CM-08 update page; SA-15 has two pages.
      'CM-08',
      'CM-06',
      'CM-07',
      'RV-04',
      'SA-10',
      'SA-11',
      'SA-12',
      'SA-13',
      'SA-14',
      'SA-15',
      'SA-16',
      'SA-17',
      'SA-20',
      'SA-21',
      'SA-22',
    ];
    expect([...SCREENS_WITH_PAGES]).toEqual(built);
    expect([...BUILT_SCREENS]).toEqual(built);
  });

  it('the public pages are not sidebar destinations; the public header reads its own set (Packages 1B, 1C)', () => {
    expect([...PUBLIC_SCREENS_WITH_PAGES]).toEqual([
      'PU-01',
      'PU-02',
      'PU-03',
      'PU-04',
      'PU-05',
      'PU-06',
      'PU-07',
      'PU-08',
      'PU-09',
      'PU-10',
      'PU-12',
    ]);
  });
});

describe('workspace bases and roles', () => {
  it('each role owns one base, as navigation.json and SessionService name them', () => {
    for (const role of PLATFORM_ROLES) {
      expect(`/${workspaceOf(role)}`).toBe(WORKSPACE_BASE[role]);
      expect(roleOfWorkspace(workspaceOf(role))).toBe(role);
    }
    expect(PLATFORM_ROLES.map(workspaceOf).sort()).toEqual([...WORKSPACES].sort());
  });
});

describe('resolveAddress — what an address shows', () => {
  it.each([
    ['/', { kind: 'public-screen', screen: 'PU-01' }],
    ['/#for-institutions', { kind: 'public-screen', screen: 'PU-01' }],
    ['/areas', { kind: 'public-screen', screen: 'PU-02' }],
    ['/areas/mechanical-manufacturing', { kind: 'public-screen', screen: 'PU-03' }],
    ['/areas/a/b', { kind: 'public-not-found' }],
    ['/experiments?format=vr', { kind: 'public-screen', screen: 'PU-04' }],
    ['/courses/fluid-mechanics', { kind: 'public-screen', screen: 'PU-05' }],
    ['/courses', { kind: 'redirect', workspace: null, to: '/areas' }],
    ['/experiments/shell-and-tube-heat-exchanger', { kind: 'public-screen', screen: 'PU-06' }],
    ['/selection', { kind: 'public-screen', screen: 'PU-07' }],
    ['/selection/x', { kind: 'public-not-found' }],
    ['/request-access', { kind: 'public-screen', screen: 'PU-08' }],
    ['/request-access/sent', { kind: 'public-screen', screen: 'PU-09' }],
    ['/request-access/other', { kind: 'public-not-found' }],
    // Appendix A §3.7 row 2: no public list of requests.
    ['/requests', { kind: 'public-not-found' }],
    ['/requests/rq-0012', { kind: 'public-screen', screen: 'PU-10' }],
    ['/requests/rq-0012/payment', { kind: 'public-screen', screen: 'PU-12' }],
    ['/requests/rq-0012/other', { kind: 'public-not-found' }],
    ['/sign-in', { kind: 'sign-in' }],
    ['/signed-out', { kind: 'redirect', workspace: null, to: '/sign-in?reason=signed-out' }],
    ['/sign-in/extra', { kind: 'public-not-found' }],
    ['/admin/requests', { kind: 'record-screen', workspace: 'admin', screen: 'SA-02' }],
    ['/admin/requests/REQ-0038', { kind: 'record-screen', workspace: 'admin', screen: 'SA-03' }],
    ['/admin/requests/REQ-0038/x', { kind: 'workspace-not-found', workspace: 'admin' }],
    ['/admin', { kind: 'record-screen', workspace: 'admin', screen: 'SA-01' }],
    ['/admin/institutions', { kind: 'record-screen', workspace: 'admin', screen: 'SA-06' }],
    [
      '/admin/institutions/godavari',
      { kind: 'record-screen', workspace: 'admin', screen: 'SA-07' },
    ],
    ['/admin/institutions/godavari/x', { kind: 'workspace-not-found', workspace: 'admin' }],
    ['/institute/institutions', { kind: 'workspace-not-found', workspace: 'institute' }],
    ['/student/requests', { kind: 'workspace-not-found', workspace: 'student' }],
    ['/experiments', { kind: 'public-screen', screen: 'PU-04' }],
    ['/student', { kind: 'record-screen', workspace: 'student', screen: 'ST-01' }],
    ['/institute', { kind: 'record-screen', workspace: 'institute', screen: 'IA-01' }],
    ['/faculty', { kind: 'record-screen', workspace: 'faculty', screen: 'FA-01' }],
    ['/admin/', { kind: 'record-screen', workspace: 'admin', screen: 'SA-01' }],
    ['/vendor/', { kind: 'record-screen', workspace: 'vendor', screen: 'VE-01' }],
    ['/faculty/help', { kind: 'screen', workspace: 'faculty', view: 'reports' }],
    ['/institute/help/report', { kind: 'screen', workspace: 'institute', view: 'report' }],
    ['/vendor/help/reports', { kind: 'redirect', workspace: 'vendor', to: '/vendor/help' }],
    ['/reviewer/help/reports/SUP-0213', { kind: 'screen', workspace: 'reviewer', view: 'detail' }],
    [
      '/content-manager/ready',
      { kind: 'record-screen', workspace: 'content-manager', screen: 'CM-02' },
    ],
    // Phase 5: the editor's static `new` page outranks `[submissionId]`.
    ['/vendor/experiments/new', { kind: 'record-screen', workspace: 'vendor', screen: 'VE-03' }],
    [
      '/vendor/experiments/SUB-0077',
      { kind: 'record-screen', workspace: 'vendor', screen: 'VE-07' },
    ],
    [
      '/vendor/experiments/SUB-0077/edit',
      { kind: 'record-screen', workspace: 'vendor', screen: 'VE-09' },
    ],
    [
      '/vendor/experiments/SUB-0077/revise',
      { kind: 'record-screen', workspace: 'vendor', screen: 'VE-08' },
    ],
    [
      '/reviewer/submissions/SUB-0077',
      { kind: 'record-screen', workspace: 'reviewer', screen: 'RV-03' },
    ],
    // Phase 6: Updates and an update (CM-08); the reviewer's update (RV-04).
    [
      '/content-manager/updates',
      { kind: 'record-screen', workspace: 'content-manager', screen: 'CM-08' },
    ],
    [
      '/content-manager/updates/UPD-0005',
      { kind: 'record-screen', workspace: 'content-manager', screen: 'CM-08' },
    ],
    [
      '/reviewer/updates/UPD-0005',
      { kind: 'record-screen', workspace: 'reviewer', screen: 'RV-04' },
    ],
    ['/reviewer/updates', { kind: 'workspace-not-found', workspace: 'reviewer' }],
    ['/student/help/reports/SUP-0213/x', { kind: 'workspace-not-found', workspace: 'student' }],
    // Package 2A.
    ['/student/courses', { kind: 'record-screen', workspace: 'student', screen: 'ST-02' }],
    ['/student/courses/thermo', { kind: 'record-screen', workspace: 'student', screen: 'ST-03' }],
    ['/student/courses/thermo/x', { kind: 'workspace-not-found', workspace: 'student' }],
    [
      '/student/experiments/shell-and-tube-heat-exchanger',
      { kind: 'record-screen', workspace: 'student', screen: 'ST-05' },
    ],
    ['/student/experiments', { kind: 'workspace-not-found', workspace: 'student' }],
    ['/student/progress', { kind: 'record-screen', workspace: 'student', screen: 'ST-15' }],
    [
      '/institute/content-access',
      { kind: 'record-screen', workspace: 'institute', screen: 'IA-02' },
    ],
    [
      '/institute/content-access/plans/ACC-0107',
      { kind: 'record-screen', workspace: 'institute', screen: 'IA-03' },
    ],
    [
      '/institute/student-access',
      { kind: 'record-screen', workspace: 'institute', screen: 'IA-04' },
    ],
    [
      '/institute/student-access/give?step=students',
      { kind: 'record-screen', workspace: 'institute', screen: 'IA-05' },
    ],
    [
      '/institute/people?tab=faculty',
      { kind: 'record-screen', workspace: 'institute', screen: 'IA-06' },
    ],
    [
      '/institute/people/students/per-0002',
      { kind: 'record-screen', workspace: 'institute', screen: 'IA-07' },
    ],
    ['/institute/people/add', { kind: 'record-screen', workspace: 'institute', screen: 'IA-10' }],
    // Package 2B: the Faculty record, Import students and a Group; `/groups/new` is not a page (D-06)
    // — it is a group id the adapter answers not found for.
    [
      '/institute/people/faculty/per-0014',
      { kind: 'record-screen', workspace: 'institute', screen: 'IA-09' },
    ],
    [
      '/institute/people/import',
      { kind: 'record-screen', workspace: 'institute', screen: 'IA-11' },
    ],
    [
      '/institute/people/groups/GRP-0012',
      { kind: 'record-screen', workspace: 'institute', screen: 'IA-14' },
    ],
    ['/institute/people/groups', { kind: 'workspace-not-found', workspace: 'institute' }],
    ['/institute/people/import/x', { kind: 'workspace-not-found', workspace: 'institute' }],
    [
      '/institute/content-access?tab=course-codes',
      { kind: 'record-screen', workspace: 'institute', screen: 'IA-02' },
    ],
    [
      '/student/courses?tab=experiments',
      { kind: 'record-screen', workspace: 'student', screen: 'ST-02' },
    ],
    // Phase 3.
    [
      '/institute/requests?tab=devices',
      { kind: 'record-screen', workspace: 'institute', screen: 'IA-17' },
    ],
    [
      '/institute/requests/REQ-0058',
      { kind: 'record-screen', workspace: 'institute', screen: 'IA-17' },
    ],
    [
      '/institute/requests/devices/DTR-0018',
      { kind: 'record-screen', workspace: 'institute', screen: 'IA-19' },
    ],
    ['/institute/usage', { kind: 'record-screen', workspace: 'institute', screen: 'IA-20' }],
    [
      '/student/experiments/shell-and-tube-heat-exchanger/resources',
      { kind: 'record-screen', workspace: 'student', screen: 'ST-06' },
    ],
    [
      '/student/experiments/shell-and-tube-heat-exchanger/simulation/web',
      { kind: 'record-screen', workspace: 'student', screen: 'ST-08' },
    ],
    [
      '/student/experiments/shell-and-tube-heat-exchanger/simulation/vr',
      { kind: 'record-screen', workspace: 'student', screen: 'ST-09' },
    ],
    [
      '/student/experiments/shell-and-tube-heat-exchanger/feedback/web',
      { kind: 'record-screen', workspace: 'student', screen: 'ST-16' },
    ],
    ['/student/device', { kind: 'record-screen', workspace: 'student', screen: 'ST-18' }],
    [
      '/admin/operations',
      { kind: 'redirect', workspace: 'admin', to: '/admin/operations/device-transfers' },
    ],
    [
      '/admin/operations/device-transfers/DTR-0018',
      { kind: 'record-screen', workspace: 'admin', screen: 'SA-19' },
    ],
    // Phase 6: Support, a report and Access ending (SA-20 … SA-22); Content (row 15 redirect,
    // SA-10 … SA-13), Academic structure (SA-14, SA-15) and Platform roles (SA-16, SA-17).
    ['/admin/operations/support', { kind: 'record-screen', workspace: 'admin', screen: 'SA-20' }],
    [
      '/admin/operations/support/SUP-0213',
      { kind: 'record-screen', workspace: 'admin', screen: 'SA-21' },
    ],
    [
      '/admin/operations/access-ending',
      { kind: 'record-screen', workspace: 'admin', screen: 'SA-22' },
    ],
    ['/admin/content', { kind: 'redirect', workspace: 'admin', to: '/admin/content/updates' }],
    ['/admin/content/updates', { kind: 'record-screen', workspace: 'admin', screen: 'SA-10' }],
    [
      '/admin/content/updates/UPD-0005',
      { kind: 'record-screen', workspace: 'admin', screen: 'SA-11' },
    ],
    ['/admin/content/all', { kind: 'record-screen', workspace: 'admin', screen: 'SA-12' }],
    [
      '/admin/content/records/SUB-0085',
      { kind: 'record-screen', workspace: 'admin', screen: 'SA-13' },
    ],
    ['/admin/content/records', { kind: 'workspace-not-found', workspace: 'admin' }],
    ['/admin/structure', { kind: 'record-screen', workspace: 'admin', screen: 'SA-14' }],
    [
      '/admin/structure/areas/chemical-process',
      { kind: 'record-screen', workspace: 'admin', screen: 'SA-15' },
    ],
    [
      '/admin/structure/courses/fluid-mechanics',
      { kind: 'record-screen', workspace: 'admin', screen: 'SA-15' },
    ],
    ['/admin/roles', { kind: 'record-screen', workspace: 'admin', screen: 'SA-16' }],
    ['/admin/roles/role-a-menon', { kind: 'record-screen', workspace: 'admin', screen: 'SA-17' }],
    // Phase 4A: the static `new` pages outrank their dynamic siblings.
    ['/faculty/courses', { kind: 'record-screen', workspace: 'faculty', screen: 'FA-02' }],
    [
      '/faculty/courses/thermodynamics-heat-transfer',
      { kind: 'record-screen', workspace: 'faculty', screen: 'FA-03' },
    ],
    [
      '/faculty/experiments/shell-and-tube-heat-exchanger',
      { kind: 'record-screen', workspace: 'faculty', screen: 'FA-05' },
    ],
    ['/faculty/assessments/new', { kind: 'record-screen', workspace: 'faculty', screen: 'FA-07' }],
    [
      '/faculty/assessments/ASMT-0009',
      { kind: 'record-screen', workspace: 'faculty', screen: 'FA-08' },
    ],
    [
      '/faculty/assessments/ASMT-0009/preview',
      { kind: 'record-screen', workspace: 'faculty', screen: 'FA-11' },
    ],
    [
      '/faculty/question-bank/new',
      { kind: 'record-screen', workspace: 'faculty', screen: 'FA-15' },
    ],
    [
      '/faculty/question-bank/Q-0101',
      { kind: 'record-screen', workspace: 'faculty', screen: 'FA-15' },
    ],
    // Phase 4B.
    ['/faculty/marking', { kind: 'record-screen', workspace: 'faculty', screen: 'FA-18' }],
    ['/faculty/marking/ATT-0450', { kind: 'record-screen', workspace: 'faculty', screen: 'FA-19' }],
    // FA-16 and FA-17: the static pages outrank `[questionId]`.
    [
      '/faculty/question-bank/draft',
      { kind: 'record-screen', workspace: 'faculty', screen: 'FA-16' },
    ],
    [
      '/faculty/question-bank/import',
      { kind: 'record-screen', workspace: 'faculty', screen: 'FA-17' },
    ],
    [
      '/faculty/assessments/ASMT-0009/submissions',
      { kind: 'record-screen', workspace: 'faculty', screen: 'FA-12' },
    ],
    ['/faculty/students', { kind: 'record-screen', workspace: 'faculty', screen: 'FA-20' }],
    [
      '/faculty/students/per-0002',
      { kind: 'record-screen', workspace: 'faculty', screen: 'FA-21' },
    ],
    ['/student/assessments', { kind: 'record-screen', workspace: 'student', screen: 'ST-11' }],
    [
      '/student/assessments/ASMT-0009',
      { kind: 'record-screen', workspace: 'student', screen: 'ST-12' },
    ],
    [
      '/student/assessments/ASMT-0009/attempt',
      { kind: 'record-screen', workspace: 'student', screen: 'ST-13' },
    ],
    [
      '/student/assessments/ASMT-0009/result',
      { kind: 'record-screen', workspace: 'student', screen: 'ST-14' },
    ],
    [
      '/student/experiments/shell-and-tube-heat-exchanger/assessment',
      { kind: 'record-screen', workspace: 'student', screen: 'ST-05' },
    ],
    ['/student/assessments/ASMT-0009/other', { kind: 'workspace-not-found', workspace: 'student' }],
  ] as const)('%s', (path, outcome) => {
    expect(resolveAddress(path)).toEqual(outcome);
  });
});
