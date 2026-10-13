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
  PHASE0_PAGES,
  PHASE0_REDIRECTS,
  PHASE0_ROUTE_FILES,
  resolveAddress,
  roleOfWorkspace,
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

describe('the route files are exactly Appendix F §3.3 (WP-0.13 acceptance 8)', () => {
  const routeFiles = filesUnder(APP).filter((file) => ROUTE_FILE.test(file));

  it('every page.tsx is in the manifest, and every manifest page exists', () => {
    const pages = routeFiles.filter((file) => /(?:^|\/)page\.tsx$/.test(file)).sort();
    expect(pages).toEqual(PHASE0_PAGES.map((page) => page.file).sort());
    expect(pages).toHaveLength(35);
  });

  it('every other route file is a §3.3 layout, not-found or the kept /healthz handler', () => {
    const others = routeFiles.filter((file) => !/(?:^|\/)page\.tsx$/.test(file)).sort();
    expect(others).toEqual([...PHASE0_ROUTE_FILES].sort());
  });

  it('seven static workspace bases and no dynamic root segment (ADR-0005 §1; D-12)', () => {
    const roots = readdirSync(APP).filter((entry) => statSync(join(APP, entry)).isDirectory());
    expect(roots.filter((entry) => !entry.startsWith('_')).sort()).toEqual(
      [...WORKSPACES, 'healthz'].sort(),
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

  it('no Phase-1 page: no sign-in, signed-out notice, public shell or public page (G-8)', () => {
    const all = filesUnder(APP);
    for (const forbidden of [/sign-in/, /signed-out/, /\(public\)/, /\(auth\)/, /experiments/]) {
      expect(all.filter((file) => forbidden.test(file))).toEqual([]);
    }
  });
});

describe('static redirects (next.config.ts; Appendix A §3.7)', () => {
  it('row 20 for the seven bases, not permanent; nothing else', async () => {
    const redirects = await nextConfig.redirects!();
    expect(redirects).toEqual(
      PHASE0_REDIRECTS.map((redirect) => ({ ...redirect, permanent: false })),
    );
    expect(redirects).toHaveLength(7);
    expect(redirects.map((redirect) => redirect.source)).not.toContain('/signed-out');
  });
});

describe('the built-screen manifest is generated from the route manifest', () => {
  it('Phase 0 builds XS-07 as the one workspace destination', () => {
    expect([...SCREENS_WITH_PAGES]).toEqual(['XS-07']);
    expect([...BUILT_SCREENS]).toEqual(['XS-07']);
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

describe('resolveAddress — what an address shows in Phase 0', () => {
  it.each([
    ['/', { kind: 'public-not-found' }],
    ['/sign-in', { kind: 'public-not-found' }],
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
