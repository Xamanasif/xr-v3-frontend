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
 * Institutions and SA-07 Institution detail; the other six bases keep the interim landing.
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
  readonly screen: WorkspaceScreenId | EntryScreenId | PublicPageScreenId | null;
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

/**
 * The workspace homes built so far: a base whose home screen is built shows it; every other base
 * is the interim landing (ADR-0005 §8; P0-35). Package 1D: the Super Admin's Overview (SA-01).
 */
export const BUILT_HOMES: Readonly<Partial<Record<Workspace, WorkspaceScreenId>>> = {
  admin: 'SA-01',
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
 * Every page file: the Phase-0 pages of the seven workspaces (35; the admin base is SA-01 since
 * Package 1D), Package 1A's (3), Package 1B's (6), Package 1C's (5), Package 1D's (2).
 */
export const PAGES: readonly PageRoute[] = [
  ...WORKSPACES.flatMap(workspacePages),
  ...PACKAGE_1A_PAGES,
  ...PACKAGE_1B_PAGES,
  ...PACKAGE_1C_PAGES,
  ...PACKAGE_1D_PAGES,
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
];

/** The workspace screens built as pages (the entry and public pages are not sidebar destinations). */
export const SCREENS_WITH_PAGES: ReadonlySet<WorkspaceScreenId> = new Set(
  PAGES.flatMap((page) =>
    page.screen && page.workspace !== null ? [page.screen as WorkspaceScreenId] : [],
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
      readonly screen: 'SA-01' | 'SA-02' | 'SA-03' | 'SA-06' | 'SA-07';
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
    if (workspace === 'admin') return { kind: 'record-screen', workspace, screen: 'SA-01' };
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
  if (workspace === 'admin' && parts[0] === 'institutions') {
    if (parts.length === 1) return { kind: 'record-screen', workspace, screen: 'SA-06' };
    if (parts.length === 2 && parts[1] !== '') {
      return { kind: 'record-screen', workspace, screen: 'SA-07' };
    }
  }
  return { kind: 'workspace-not-found', workspace };
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
