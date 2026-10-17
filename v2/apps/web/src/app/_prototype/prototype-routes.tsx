'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { ResetPage, WebActivity, WebActivityLoading } from '@/features/shared/prototype/pages';

/**
 * The prototype pages' one route-level module that reads the address's query (as
 * `_auth/sign-in-route.tsx` does for sign-in): `/prototype/reset?done=1` after a reset, and the
 * sample WEB activity's `?launch=`. `useSearchParams` sits inside a Suspense boundary; the server
 * render shows the page without its query.
 */
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
