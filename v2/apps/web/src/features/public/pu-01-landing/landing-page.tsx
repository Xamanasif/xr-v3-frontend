'use client';

import type { ReactNode } from 'react';

import { useRouteFocus } from '../../shared/workspace-frame/route-focus';

/**
 * What the `(landing)` route files render (Appendix F §3.8: route files import features only): the
 * landing, the navigation it is given, and its frame — the public pages' route focus (after a
 * client-side move focus goes to `main`, or to PU-14's heading at `/#for-institutions`), without
 * the v46 public shell (owner decision D-13).
 */
export { Landing } from './landing';
export { type AppNavigation, NavigationProvider } from '@/nav/navigation';

export function LandingFrame({
  pathname,
  children,
}: {
  readonly pathname: string;
  readonly children?: ReactNode;
}) {
  useRouteFocus(pathname);
  return <>{children}</>;
}
