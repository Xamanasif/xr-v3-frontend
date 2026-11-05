'use client';

import { notFound, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { type ReactNode, Suspense, useMemo } from 'react';

import {
  type AppNavigation,
  NavigationProvider,
  PrototypeToolsPage,
  ResetPage,
  SamplePaymentPage,
  WebActivity,
  WebActivityLoading,
} from '@/features/shared/prototype/pages';

/**
 * The prototype pages' one route-level module that reads the address's query (as
 * `_auth/sign-in-route.tsx` does for sign-in): `/prototype/reset?done=1` after a reset, and the
 * sample WEB activity's `?launch=`, and the simulated payment provider's `?request=` (B2B milestone
 * I3). `useSearchParams` sits inside a Suspense boundary; the server render shows the page without
 * its query.
 */
/** The address and the router, given to the framework-free support pages as `@/nav/navigation`. */
function PrototypeNavigation({ children }: { readonly children?: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const navigation = useMemo<AppNavigation>(
    () => ({
      pathname,
      search: '',
      replace: (href) => window.history.replaceState(null, '', href),
      navigate: (href, options) => (options?.replace ? router.replace(href) : router.push(href)),
      notFound,
    }),
    [pathname, router],
  );
  return <NavigationProvider value={navigation}>{children}</NavigationProvider>;
}

export function ToolsRoute() {
  return (
    <PrototypeNavigation>
      <PrototypeToolsPage />
    </PrototypeNavigation>
  );
}

export function SamplePaymentRoute() {
  return (
    <PrototypeNavigation>
      <Suspense fallback={<SamplePaymentPage routeId={null} />}>
        <SamplePaymentWithQuery />
      </Suspense>
    </PrototypeNavigation>
  );
}

function SamplePaymentWithQuery() {
  const query = useSearchParams();
  return <SamplePaymentPage routeId={query.get('request')} />;
}

export function ResetRoute() {
  return (
    <Suspense fallback={<ResetPage done={false} />}>
      <ResetWithQuery />
    </Suspense>
  );
}

function ResetWithQuery() {
  const query = useSearchParams();
  return <ResetPage done={query.get('done') === '1'} />;
}

export function WebActivityRoute() {
  return (
    <Suspense fallback={<WebActivityLoading />}>
      <WebActivityWithQuery />
    </Suspense>
  );
}

function WebActivityWithQuery() {
  const query = useSearchParams();
  return <WebActivity launch={query.get('launch')} />;
}
