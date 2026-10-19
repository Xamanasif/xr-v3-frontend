import { EntryPage } from '@xr/ui/v3';
import type { ReactNode } from 'react';

import { SIGN_IN } from '@/copy/sign-in';

/**
 * The `(auth)` frame in the owner-approved Entry & shared design (XS-01, XS-03, XS-04;
 * design/v3-refined-b/roles/XS-v6, `XsSignIn`): a whole V3 page outside any workspace shell — the
 * top row with its one way out, and the centred column for the card and the prototype line. No
 * public header, nothing else to wander off to.
 *
 * "Back to experiments" opens the public catalogue (PU-04, `/experiments`), as the XS link map
 * draws it; the v46 board's link to the Landing (P1-17) is superseded.
 */
export function AuthFrame({ children }: { readonly children?: ReactNode }) {
  return (
    <EntryPage back={{ href: SIGN_IN.backHref, label: SIGN_IN.backToExperiments }}>
      {children}
    </EntryPage>
  );
}
