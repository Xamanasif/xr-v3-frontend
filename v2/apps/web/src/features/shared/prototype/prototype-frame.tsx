import { LogoPlaceholder } from '@xr/ui';
import type { ReactNode } from 'react';

import { PROTOTYPE_FRAME } from '@/copy/prototype';

/**
 * The frame of the local prototype build's support pages (owner authorisation of Phase 7): the
 * sign-in page's calm brand background and one white card (`div.xp > div.xp-auth`, as the `(auth)`
 * frame of B1-09), with the brand row. No public header and no workspace shell: these pages are not
 * designed v46 screens. `wide` gives the sample WEB activity room for its steps.
 */
export function PrototypeFrame({
  wide = false,
  children,
}: {
  readonly wide?: boolean;
  readonly children?: ReactNode;
}) {
  return (
    <div className="xp">
      <div className="xp-auth">
        <div className="xp-in xp-auth-top" aria-hidden="true" />
        <main className="xp-auth-main">
          <div className={wide ? 'xp-auth-card max-w-[760px]' : 'xp-auth-card'}>
            <div className="xp-auth-brand">
              <LogoPlaceholder placement="public" />
              <span>{PROTOTYPE_FRAME.product}</span>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
