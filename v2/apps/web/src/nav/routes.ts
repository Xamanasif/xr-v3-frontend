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
 * (SA-03). No public page exists yet: `/` and every public address resolve to the root not-found
 * (the public PU-15) until their packages build them.
 */

/** What a page file renders. */
export type PageKind =
  /** `/<base>`: until the workspace home is built, it replaces itself with `/<base>/help` (ADR-0005 §8). */
  | 'interim-landing'
  /** A designed screen. */
  | 'screen'
  /** `/<base>/[...unmatched]`: any other workspace address — the in-shell PU-15. */
  | 'unmatched';

export type HelpRouteView = 'reports' | 'report' | 'detail';

/** The entry screens with a page of their own outside the workspaces (Appendix A "Entry & shared"). */
export type EntryScreenId = 'XS-01';

export interface PageRoute {
  /** The URL pattern, Next.js notation (`/student/help/reports/[reportId]`). */
  readonly pattern: string;
  /** The page file, relative to `src/app`. */
  readonly file: string;
  /** The workspace base the page sits under; `null` for the `(auth)` sign-in page. */
  readonly workspace: Workspace | null;
  readonly kind: PageKind;
  /** The screen a `screen` page shows; `null` otherwise. */
  readonly screen: WorkspaceScreenId | EntryScreenId | null;
  /** The Help view a Help page shows. */
  readonly view?: HelpRouteView;
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

function workspacePages(workspace: Workspace): PageRoute[] {
  const base = `/${workspace}`;
  return [
    {
      pattern: base,
      file: `${workspace}/page.tsx`,
      workspace,
      kind: 'interim-landing',
      screen: null,
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

/** Every page file: the Phase-0 pages of the seven workspaces (35), then Package 1A's (3). */
export const PAGES: readonly PageRoute[] = [
  ...WORKSPACES.flatMap(workspacePages),
  ...PACKAGE_1A_PAGES,
];

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
];

/** The workspace screens built as pages (the entry pages are not sidebar destinations). */
export const SCREENS_WITH_PAGES: ReadonlySet<WorkspaceScreenId> = new Set(
  PAGES.flatMap((page) => (page.screen && page.screen !== 'XS-01' ? [page.screen] : [])),
);

/** Where an address leads (for the link-target ledger and its tests). */
export type AddressOutcome =
  | { readonly kind: 'screen'; readonly workspace: Workspace; readonly view: HelpRouteView }
  | {
      readonly kind: 'record-screen';
      readonly workspace: Workspace;
      readonly screen: 'SA-02' | 'SA-03';
    }
  | { readonly kind: 'interim-landing'; readonly workspace: Workspace; readonly lands: string }
  | { readonly kind: 'redirect'; readonly workspace: Workspace | null; readonly to: string }
  | { readonly kind: 'workspace-not-found'; readonly workspace: Workspace }
  | { readonly kind: 'sign-in' }
  | { readonly kind: 'public-not-found' };

const WORKSPACE_SET: ReadonlySet<string> = new Set(WORKSPACES);

/** What a same-origin path (no query) resolves to, by the manifest above. */
export function resolveAddress(pathname: string): AddressOutcome {
  const segments = pathname.split('/').slice(1);
  const [first, ...rest] = segments;
  const tail = rest.filter((part, index) => part !== '' || index < rest.length - 1);
  if (first === 'sign-in' && tail.length === 0) return { kind: 'sign-in' };
  if (first === 'signed-out' && tail.length === 0) {
    return { kind: 'redirect', workspace: null, to: SIGNED_OUT_ADDRESS };
  }
  if (!first || !WORKSPACE_SET.has(first)) return { kind: 'public-not-found' };
  const workspace = first as Workspace;
  const parts = tail;
  if (parts.length === 0) {
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
  if (workspace === 'admin' && parts[0] === 'requests') {
    if (parts.length === 1) return { kind: 'record-screen', workspace, screen: 'SA-02' };
    if (parts.length === 2 && parts[1] !== '') {
      return { kind: 'record-screen', workspace, screen: 'SA-03' };
    }
  }
  return { kind: 'workspace-not-found', workspace };
}
