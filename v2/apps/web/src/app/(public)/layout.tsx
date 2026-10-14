import type { ReactNode } from 'react';

import { PublicRoute } from '../_public/public-route';

/**
 * The `(public)` group (ADR-0005 §1; Appendix A §3.2; Phase-1 Package 1B): the public shell —
 * header, the page's own `main`, footer — around PU-01 … PU-06 (PU-14 is a section of PU-01).
 */
export default function PublicLayout({ children }: { readonly children: ReactNode }) {
  return <PublicRoute>{children}</PublicRoute>;
}
