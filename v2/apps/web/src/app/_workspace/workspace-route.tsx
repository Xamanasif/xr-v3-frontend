'use client';

import { notFound, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { type ReactNode, Suspense, useMemo } from 'react';

import {
  type AppNavigation,
  BootTitle,
  NavigationProvider,
  SessionLoading,
  type WorkspaceBase,
  WorkspaceLayout,
} from '@/features/shared/workspace-frame/workspace-frame';

/**
 * The one route-level module that reads Next.js navigation for the workspaces (WP-0.13): the
 * address, its query and the router, supplied to the framework-free features as
 * `@/nav/navigation` (import fences, Appendix F §3.8; the same injection as `@/platform/link`).
 *
 * `useSearchParams` sits inside a Suspense boundary (WP-0.13 spike S3: without one, the
 * prerendered workspace routes fail the production build), whose fallback is the session gate's
 * own loading state — the server never knows the tab's session (ADR-0004), so it renders that
 * state either way. The tab's title while nobody is known stays outside the boundary, so the
 * server-rendered page has one.
 */
export function WorkspaceRoute({
  workspace,
  children,
}: {
  readonly workspace: WorkspaceBase;
  readonly children?: ReactNode;
}) {
  return (
    <>
      <BootTitle />
      <Suspense fallback={<SessionLoading titled={false} />}>
        <WithNavigation workspace={workspace}>{children}</WithNavigation>
      </Suspense>
    </>
  );
}

function WithNavigation({
  workspace,
  children,
}: {
  readonly workspace: WorkspaceBase;
  readonly children?: ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.toString();
  const navigation = useMemo<AppNavigation>(
    () => ({
      pathname,
      search: query ? `?${query}` : '',
      replace: (href) => router.replace(href),
      notFound,
    }),
    [pathname, query, router],
  );
  return (
    <NavigationProvider value={navigation}>
      <WorkspaceLayout workspace={workspace}>{children}</WorkspaceLayout>
    </NavigationProvider>
  );
}
