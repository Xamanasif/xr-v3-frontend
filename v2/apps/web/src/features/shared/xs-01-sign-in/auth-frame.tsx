import type { ReactNode } from 'react';

/**
 * The `(auth)` frame (Appendix F §3.3 `(auth)/layout.tsx`; B1-09 "Pattern: AR-6 focused task: one
 * centred card on the calm B2 brand background … No navigation to wander off to"): `div.xp >
 * div.xp-auth`, the top row and `main.xp-auth-main` holding the card. No public header.
 *
 * B1-09's two ways out — "Back to experiments" (the Landing, `/`, P1-17) in the top row and
 * "Request institutional access" (the Selection, PU-07) under the card — are not rendered until
 * those public pages are built (P0-35 built-screen navigation, extended to Phase 1 by the owner;
 * `nav/link-targets.ts`): an address that is not built would show the public not-found page and
 * load a new document, which restarts the tab's sample world (ADR-0004). The empty top row keeps
 * its drawn height.
 */
export function AuthFrame({ children }: { readonly children?: ReactNode }) {
  return (
    <div className="xp">
      <div className="xp-auth">
        <div className="xp-in xp-auth-top" />
        <main className="xp-auth-main">{children}</main>
      </div>
    </div>
  );
}
