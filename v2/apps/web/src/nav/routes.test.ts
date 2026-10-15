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

describe('the route files are exactly the manifest (Appendix F §3.3; WP-0.13 acceptance 8; Packages 1A–1D, 2A, 2B)', () => {
  const routeFiles = filesUnder(APP).filter((file) => ROUTE_FILE.test(file));

  it('every page.tsx is in the manifest, and every manifest page exists', () => {
    const pages = routeFiles.filter((file) => /(?:^|\/)page\.tsx$/.test(file)).sort();
    expect(pages).toEqual(PAGES.map((page) => page.file).sort());
    // 35 Phase-0 pages (7 workspaces × 5) + Package 1A's sign-in, Requests and Request decision +
    // Package 1B's six public pages (PU-01 … PU-06; PU-14 is a section of PU-01) + Package 1C's
    // five request pages (PU-07, PU-08, PU-09, PU-10, PU-12; PU-13 is a state of PU-10) + Package
    // 1D's Institutions and Institution detail (SA-01 is the admin base's own page) + Package 2A's
    // ten Institute Admin and Student pages (IA-01 and ST-01 are their bases' own pages) + Package
    // 2B's three (IA-09, IA-11, IA-14; its four tabs are `?tab=` views of 2A pages).
    expect(pages).toHaveLength(64);
  });

  it('every other route file is a §3.3 layout, not-found or the kept /healthz handler', () => {
    const others = routeFiles.filter((file) => !/(?:^|\/)page\.tsx$/.test(file)).sort();
    expect(others).toEqual([...ROUTE_FILES].sort());
  });

  it('seven static workspace bases and no dynamic root segment (ADR-0005 §1; D-12)', () => {
    const roots = readdirSync(APP).filter((entry) => statSync(join(APP, entry)).isDirectory());
    // Plus the `(auth)` and `(public)` route groups (ADR-0005 §1), which add no URL segment.
    expect(roots.filter((entry) => !entry.startsWith('_')).sort()).toEqual(
      [...WORKSPACES, 'healthz', '(auth)', '(public)'].sort(),
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
      '(public)/page.tsx',
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
      'institute/student-access/give/page.tsx',
      'institute/student-access/page.tsx',
      'student/courses/[courseId]/page.tsx',
      'student/courses/page.tsx',
      'student/experiments/[experimentId]/page.tsx',
      'student/page.tsx',
    ]);
    expect(PAGES.find((page) => page.file === 'institute/page.tsx')).toMatchObject({
      kind: 'screen',
      screen: 'IA-01',
    });
    expect(PAGES.find((page) => page.file === 'student/page.tsx')).toMatchObject({
      kind: 'screen',
      screen: 'ST-01',
    });
    expect(
      PAGES.filter((page) => page.kind === 'interim-landing').map((page) => page.pattern),
    ).toEqual(['/faculty', '/vendor', '/reviewer', '/content-manager']);
  });
});

describe('static redirects (next.config.ts; Appendix A §3.7)', () => {
  it('row 20 for the seven bases, row 21 (/signed-out) and row 1 (/courses), not permanent; nothing else', async () => {
    const redirects = await nextConfig.redirects!();
    expect(redirects).toEqual(REDIRECTS.map((redirect) => ({ ...redirect, permanent: false })));
    expect(redirects).toHaveLength(9);
    expect(redirects.slice(-2)).toEqual([
      { source: '/signed-out', destination: '/sign-in?reason=signed-out', permanent: false },
      // Package 1B: the PU-05 breadcrumb's intermediate level.
      { source: '/courses', destination: '/areas', permanent: false },
    ]);
  });
});

describe('the built-screen manifest is generated from the route manifest', () => {
  it('Help (XS-07) in every workspace, the Super Admin’s Requests and decision (Package 1A), Overview, Institutions and Institution detail (Package 1D), and Phase 2’s twenty-one ids (Packages 2A, 2B)', () => {
    const built = [
      'ST-01',
      'XS-07',
      'IA-01',
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
    ['/faculty', { kind: 'interim-landing', workspace: 'faculty', lands: '/faculty/help' }],
    ['/admin/', { kind: 'record-screen', workspace: 'admin', screen: 'SA-01' }],
    ['/vendor/', { kind: 'interim-landing', workspace: 'vendor', lands: '/vendor/help' }],
    ['/faculty/help', { kind: 'screen', workspace: 'faculty', view: 'reports' }],
    ['/institute/help/report', { kind: 'screen', workspace: 'institute', view: 'report' }],
    ['/vendor/help/reports', { kind: 'redirect', workspace: 'vendor', to: '/vendor/help' }],
    ['/reviewer/help/reports/SUP-0213', { kind: 'screen', workspace: 'reviewer', view: 'detail' }],
    ['/content-manager/ready', { kind: 'workspace-not-found', workspace: 'content-manager' }],
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
    ['/student/progress', { kind: 'workspace-not-found', workspace: 'student' }],
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
    ['/institute/requests', { kind: 'workspace-not-found', workspace: 'institute' }],
    ['/faculty/courses', { kind: 'workspace-not-found', workspace: 'faculty' }],
  ] as const)('%s', (path, outcome) => {
    expect(resolveAddress(path)).toEqual(outcome);
  });
});
