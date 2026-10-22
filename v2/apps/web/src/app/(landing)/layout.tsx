import type { ReactNode } from 'react';

import { LandingRoute } from '../_public/landing-route';

/**
 * The `(landing)` group (owner decision D-13): `/` alone, outside the v46 public shell, whose
 * `div.xp` (`overflow: hidden`) would stop the landing's sticky header and story stage, and whose
 * header and footer the landing draws itself. The URL is unchanged; every other public page keeps
 * the `(public)` group and its shell.
 */
export default function LandingLayout({ children }: { readonly children: ReactNode }) {
  return <LandingRoute>{children}</LandingRoute>;
}
