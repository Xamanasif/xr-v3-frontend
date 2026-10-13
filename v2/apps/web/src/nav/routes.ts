import { type Workspace, WORKSPACES } from '@xr/contracts/draft';
import type { Role } from '@xr/domain';

import { WORKSPACE_BASE } from './nav-config';
import type { WorkspaceScreenId } from './screens';

/**
 * The Phase-0 route manifest (Appendix F §3.3; ADR-0005; WP-0.13): every page file under
 * `src/app`, what each one shows, and the static redirects of `next.config.ts`. The
 * route-manifest test compares it with the files on disk (Appendix F WP-0.13 acceptance 8), so a
 * page outside §3.3 fails the build's tests; the built-screen manifest is derived from it.
 *
 * Seven static workspace bases (ADR-0005 §1; no dynamic `[workspace]` root segment, D-12), each
 * with the Help & support pages (XS-07), the interim landing and the in-shell not-found. No
 * public page exists in Phase 0 (G-8): `/`, `/sign-in` and every public address resolve to the
 * root not-found (the public PU-15).
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

export interface PageRoute {
  /** The URL pattern, Next.js notation (`/student/help/reports/[reportId]`). */
  readonly pattern: string;
  /** The page file, relative to `src/app`. */
  readonly file: string;
  readonly workspace: Workspace;
  readonly kind: PageKind;
  /** The screen a `screen` page shows; `null` otherwise. */
  readonly screen: WorkspaceScreenId | null;
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

/** Every page file of Phase 0, workspace by workspace (35). */
export const PHASE0_PAGES: readonly PageRoute[] = WORKSPACES.flatMap(workspacePages);

/**
 * The other route files of Appendix F §3.3: the root layout and not-found (public PU-15), each
 * workspace's layout (SessionGate → WorkspaceFrame) and not-found (in-shell PU-15), and the kept
 * `/healthz` handler.
 */
export const PHASE0_ROUTE_FILES: readonly string[] = [
  'layout.tsx',
  'not-found.tsx',
  'healthz/route.ts',
  ...WORKSPACES.flatMap((workspace) => [`${workspace}/layout.tsx`, `${workspace}/not-found.tsx`]),
];

/**
 * The static redirects (`next.config.ts` `redirects()`, Appendix A §3.7): row 20 only —
 * `/<base>/help/reports` → `/<base>/help` (My reports lives on the Help landing). Row 21
 * (`/signed-out`) arrives with XS-03 in Phase 1.
 */
export const PHASE0_REDIRECTS: readonly {
  readonly source: string;
  readonly destination: string;
}[] = WORKSPACES.map((workspace) => ({
  source: `/${workspace}/help/reports`,
  destination: `/${workspace}/help`,
}));

/** The designed screens Phase 0 builds as pages: XS-07 (the others are shell parts or in-place states). */
export const SCREENS_WITH_PAGES: ReadonlySet<WorkspaceScreenId> = new Set(
  PHASE0_PAGES.flatMap((page) => (page.screen ? [page.screen] : [])),
);

/** Where an address leads in Phase 0 (for the link-target ledger and its tests). */
export type AddressOutcome =
  | { readonly kind: 'screen'; readonly workspace: Workspace; readonly view: HelpRouteView }
  | { readonly kind: 'interim-landing'; readonly workspace: Workspace; readonly lands: string }
  | { readonly kind: 'redirect'; readonly workspace: Workspace; readonly to: string }
  | { readonly kind: 'workspace-not-found'; readonly workspace: Workspace }
  | { readonly kind: 'public-not-found' };

const WORKSPACE_SET: ReadonlySet<string> = new Set(WORKSPACES);

/** What a same-origin path (no query) resolves to, by the manifest above. */
export function resolveAddress(pathname: string): AddressOutcome {
  const segments = pathname.split('/').slice(1);
  const [first, ...rest] = segments;
  if (!first || !WORKSPACE_SET.has(first)) return { kind: 'public-not-found' };
  const workspace = first as Workspace;
  const parts = rest.filter((part, index) => part !== '' || index < rest.length - 1);
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
  return { kind: 'workspace-not-found', workspace };
}
