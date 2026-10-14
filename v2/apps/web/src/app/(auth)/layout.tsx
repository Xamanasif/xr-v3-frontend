import type { ReactNode } from 'react';

import { AuthFrame } from '@/features/shared/xs-01-sign-in/sign-in-page';

/** The `(auth)` group (ADR-0005 §1; Appendix F §3.3): the AR-6 focused frame of B1-09, no public header. */
export default function AuthLayout({ children }: { readonly children: ReactNode }) {
  return <AuthFrame>{children}</AuthFrame>;
}
