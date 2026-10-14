'use client';

import { notFound, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { type ReactNode, Suspense, useMemo } from 'react';

import {
  type AppNavigation,
  NavigationProvider,
  PublicFrame,
  PublicNotFound,
} from '@/features/public/shell/public-page';

/**
 * The public surface's one route-level module that reads Next.js navigation (as `_workspace/` and
 * `_auth/` do; import fences, Appendix F §3.8): the address and its query, supplied to the
 * framework-free public features as `@/nav/navigation`. Package 1B (TE-8): the pages render in the
 * browser from the tab's sample world.
 *
 * `replace` mirrors a page's view into the address with the browser's own history
 * (`history.replaceState`, which the App Router follows for `usePathname` / `useSearchParams`):
 * no new history entry, no scroll, no request, and the page keeps its state while the catalogue's
 * filters and search change (state-copy `PU-04.address`).
 *
 * `useSearchParams` sits inside a Suspense boundary (WP-0.13 spike S3); the server cannot know the
 * query of a prerendered page, so the fallback is the same page read with an empty query.
 */
const replaceInHistory = (href: string) => window.history.replaceState(null, '', href);

export function PublicRoute({ children }: { readonly children?: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const withoutQuery = useMemo<AppNavigation>(
    () => ({
      pathname,
      search: '',
      replace: replaceInHistory,
      navigate: (href, options) => (options?.replace ? router.replace(href) : router.push(href)),
      notFound,
    }),
    [pathname, router],
  );
  return (
    <PublicFrame pathname={pathname}>
      <Suspense fallback={<NavigationProvider value={withoutQuery}>{children}</NavigationProvider>}>
        <WithNavigation pathname={pathname}>{children}</WithNavigation>
      </Suspense>
    </PublicFrame>
  );
}

function WithNavigation({
  pathname,
  children,
}: {
  readonly pathname: string;
  readonly children?: ReactNode;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.toString();
  const navigation = useMemo<AppNavigation>(
    () => ({
      pathname,
      search: query ? `?${query}` : '',
      replace: replaceInHistory,
      navigate: (href, options) => (options?.replace ? router.replace(href) : router.push(href)),
      notFound,
    }),
    [pathname, query, router],
  );
  return <NavigationProvider value={navigation}>{children}</NavigationProvider>;
}

/**
 * PU-15, public variant (board 08), for every address outside the workspaces and the public
 * pages: the root not-found renders in the root layout only, so it brings the public header and
 * footer itself (Appendix A §3.2 `not-found.tsx`).
 */
export function PublicNotFoundRoute() {
  const pathname = usePathname();
  return (
    <PublicFrame pathname={pathname}>
      <PublicNotFound />
    </PublicFrame>
  );
}
