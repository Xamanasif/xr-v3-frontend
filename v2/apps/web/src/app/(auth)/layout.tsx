import type { ReactNode } from 'react';

// The V3 layer (ADR-0010) for the Entry & shared sign-in page (XS-01, XS-03, XS-04): it applies
// only inside a V3 root, and only routes that render a V3 surface load it — never the root layout
// of the locked public landing.
import '@xr/ui/styles-v3.css';

import { AuthFrame, V3Fonts } from '@/features/shared/xs-01-sign-in/sign-in-page';

/** The `(auth)` group (ADR-0005 §1; Appendix F §3.3): the XS sign-in page, no public header. */
export default function AuthLayout({ children }: { readonly children: ReactNode }) {
  return (
    <>
      {/* In the server-rendered head with the page, so no later render waits for it. */}
      <V3Fonts />
      <AuthFrame>{children}</AuthFrame>
    </>
  );
}
