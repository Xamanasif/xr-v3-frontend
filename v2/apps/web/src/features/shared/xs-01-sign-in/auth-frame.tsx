import { BackLink } from '@xr/ui';
import type { ReactNode } from 'react';

import { SIGN_IN } from '@/copy/sign-in';

/**
 * The `(auth)` frame (Appendix F §3.3 `(auth)/layout.tsx`; B1-09 "Pattern: AR-6 focused task: one
 * centred card on the calm B2 brand background … No navigation to wander off to"): `div.xp >
 * div.xp-auth`, the top row and `main.xp-auth-main` holding the card. No public header.
 *
 * B1-09's two ways out are rendered once their pages are built (P0-35 built-screen navigation,
 * extended to Phase 1 by the owner; `nav/link-targets.ts`): "Back to experiments" in the top row
 * goes to the Landing, `/` (P1-17 follows the href), built in Package 1B; "Request institutional
 * access" under the card waits for the Selection (PU-07, Package 1C) — an unbuilt address would
 * show the public not-found page and load a new document, which restarts the tab's sample world
 * (ADR-0004).
 */
export function AuthFrame({ children }: { readonly children?: ReactNode }) {
  return (
    <div className="xp">
      <div className="xp-auth">
        <div className="xp-in xp-auth-top">
          <BackLink href="/">{SIGN_IN.backToExperiments}</BackLink>
        </div>
        <main className="xp-auth-main">{children}</main>
      </div>
    </div>
  );
}
