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

describe('the route files are exactly the manifest (Appendix F §3.3; WP-0.13 acceptance 8; Package 1A)', () => {
  const routeFiles = filesUnder(APP).filter((file) => ROUTE_FILE.test(file));

  it('every page.tsx is in the manifest, and every manifest page exists', () => {
    const pages = routeFiles.filter((file) => /(?:^|\/)page\.tsx$/.test(file)).sort();
    expect(pages).toEqual(PAGES.map((page) => page.file).sort());
    // 35 Phase-0 pages (7 workspaces × 5) + Package 1A's sign-in, Requests and Request decision.
    expect(pages).toHaveLength(38);
  });

  it('every other route file is a §3.3 layout, not-found or the kept /healthz handler', () => {
    const others = routeFiles.filter((file) => !/(?:^|\/)page\.tsx$/.test(file)).sort();
    expect(others).toEqual([...ROUTE_FILES].sort());
  });

  it('seven static workspace bases and no dynamic root segment (ADR-0005 §1; D-12)', () => {
    const roots = readdirSync(APP).filter((entry) => statSync(join(APP, entry)).isDirectory());
    // Plus the `(auth)` route group (ADR-0005 §1), which adds no URL segment.
    expect(roots.filter((entry) => !entry.startsWith('_')).sort()).toEqual(
      [...WORKSPACES, 'healthz', '(auth)'].sort(),
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

  it('Package 1A only: the sign-in page and two Super Admin pages — no public shell or page', () => {
    const all = filesUnder(APP);
    for (const forbidden of [/\(public\)/, /experiments/, /signed-out/, /selection/, /catalogue/]) {
      expect(all.filter((file) => forbidden.test(file))).toEqual([]);
    }
    expect(all.filter((file) => /sign-in/.test(file)).sort()).toEqual([
      '(auth)/sign-in/page.tsx',
      '_auth/sign-in-route.tsx',
    ]);
    expect(all.filter((file) => /^admin\/requests/.test(file)).sort()).toEqual([
      'admin/requests/[requestId]/page.tsx',
      'admin/requests/page.tsx',
    ]);
  });
});

describe('static redirects (next.config.ts; Appendix A §3.7)', () => {
  it('row 20 for the seven bases and row 21 (/signed-out), not permanent; nothing else', async () => {
    const redirects = await nextConfig.redirects!();
    expect(redirects).toEqual(REDIRECTS.map((redirect) => ({ ...redirect, permanent: false })));
    expect(redirects).toHaveLength(8);
    expect(redirects.at(-1)).toEqual({
      source: '/signed-out',
      destination: '/sign-in?reason=signed-out',
      permanent: false,
    });
  });
});

describe('the built-screen manifest is generated from the route manifest', () => {
  it('Help (XS-07) in every workspace, and the Super Admin’s Requests and decision (Package 1A)', () => {
    expect([...SCREENS_WITH_PAGES]).toEqual(['XS-07', 'SA-02', 'SA-03']);
    expect([...BUILT_SCREENS]).toEqual(['XS-07', 'SA-02', 'SA-03']);
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
    ['/', { kind: 'public-not-found' }],
    ['/sign-in', { kind: 'sign-in' }],
    ['/signed-out', { kind: 'redirect', workspace: null, to: '/sign-in?reason=signed-out' }],
    ['/sign-in/extra', { kind: 'public-not-found' }],
    ['/admin/requests', { kind: 'record-screen', workspace: 'admin', screen: 'SA-02' }],
    ['/admin/requests/REQ-0038', { kind: 'record-screen', workspace: 'admin', screen: 'SA-03' }],
    ['/admin/requests/REQ-0038/x', { kind: 'workspace-not-found', workspace: 'admin' }],
    ['/student/requests', { kind: 'workspace-not-found', workspace: 'student' }],
    ['/experiments', { kind: 'public-not-found' }],
    ['/student', { kind: 'interim-landing', workspace: 'student', lands: '/student/help' }],
    ['/admin/', { kind: 'interim-landing', workspace: 'admin', lands: '/admin/help' }],
    ['/faculty/help', { kind: 'screen', workspace: 'faculty', view: 'reports' }],
    ['/institute/help/report', { kind: 'screen', workspace: 'institute', view: 'report' }],
    ['/vendor/help/reports', { kind: 'redirect', workspace: 'vendor', to: '/vendor/help' }],
    ['/reviewer/help/reports/SUP-0213', { kind: 'screen', workspace: 'reviewer', view: 'detail' }],
    ['/content-manager/ready', { kind: 'workspace-not-found', workspace: 'content-manager' }],
    ['/student/help/reports/SUP-0213/x', { kind: 'workspace-not-found', workspace: 'student' }],
    ['/student/courses', { kind: 'workspace-not-found', workspace: 'student' }],
  ] as const)('%s', (path, outcome) => {
    expect(resolveAddress(path)).toEqual(outcome);
  });
});
