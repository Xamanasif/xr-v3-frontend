'use client';

import { LoadingState } from '@xr/ui';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef } from 'react';

import { stateWords } from '@/copy/state-copy';
import { useAppNavigation } from '@/nav/navigation';
import { signInAddress } from '@/nav/return-to';
import { useSession } from '@/queries/session';
import { useCommand } from '@/queries/use-command';

import { DocumentTitle } from '../document-title';

/**
 * The session gate of every workspace layout (Appendix F §3.3, §5.2; ADR-0003; ADR-0005 §5).
 *
 * - The session lives in the tab's memory (ADR-0004 option A), so the gate is a client component:
 *   it reads the session store through `useSyncExternalStore` with an `unknown` server snapshot
 *   (WP-0.13 spike S2) and shows the loading state until the tab's platform has booted. No
 *   `proxy.ts` in sample mode (X-3).
 * - Signed out: it replaces the address with `/sign-in?returnTo=<the address asked for>`; after
 *   the person signs out themselves, with `/sign-in?reason=signed-out` (XS-03 "Signed out"). The
 *   sign-in page and its notices are Phase 1 (G-8), so in Phase 0 that address shows the public
 *   not-found page (K-21) — an engineering build, not a stakeholder walk-through.
 * - Signed in: the workspace frame decides whose workspace this is (XS-06).
 *
 * It also owns signing out (XS-05 "Sign out"): the session port's `signOut` command, through
 * `useCommand`; the session store then clears the whole query cache and publishes the signed-out
 * session (WP-0.12), and the gate leaves with `reason=signed-out`. Nothing is shown in between.
 */
const SignOutContext = createContext<(() => void) | null>(null);

/** Sign out, for the account menu (XS-05). */
export function useSignOut(): () => void {
  const signOut = useContext(SignOutContext);
  if (!signOut) throw new Error('useSignOut is used outside the session gate.');
  return signOut;
}

/**
 * The loading state while the tab's session resolves (board 04 "Loading … announced politely";
 * board 12 "“Loading …” still announced"): a status, nothing else — the shell is drawn only once
 * the person is known, so no other role's shell or name flashes up.
 */
export function SessionLoading({ titled = true }: { readonly titled?: boolean }) {
  return (
    <main>
      {titled ? <DocumentTitle title="" /> : null}
      <LoadingState label={stateWords('shell.session-loading')} surface={null} lines={0} />
    </main>
  );
}

/**
 * The tab's title while nobody is known yet — on the server and until the tab's platform has
 * booted. Rendered by the route layer outside its `useSearchParams` Suspense boundary, because
 * React does not hoist a `<title>` out of a boundary's fallback into the server-rendered head
 * (WP-0.13). Once the session is known, the gate's or the shell's own title takes over.
 */
export function BootTitle() {
  const session = useSession();
  return session.status === 'unknown' ? <DocumentTitle title="" /> : null;
}

export function SessionGate({ children }: { readonly children?: ReactNode }) {
  const session = useSession();
  const navigation = useAppNavigation();
  const { run: runSignOut } = useCommand((ports) => ports.session.signOut);
  const intent = useRef<'signed-out' | null>(null);
  const left = useRef(false);

  const signOut = useCallback(() => {
    intent.current = 'signed-out';
    runSignOut().then(
      (answer) => {
        // Already signed out is signed out; any other refusal leaves the person where they are.
        if (!answer.ok && answer.error.kind !== 'not-signed-in') intent.current = null;
      },
      () => {
        intent.current = null;
      },
    );
  }, [runSignOut]);

  const signedOut = session.status === 'signed-out';
  const { pathname, search, replace } = navigation;
  useEffect(() => {
    if (!signedOut) {
      left.current = false;
      return;
    }
    if (left.current) return;
    left.current = true;
    replace(
      intent.current === 'signed-out'
        ? signInAddress({ kind: 'signed-out' })
        : signInAddress({ kind: 'return', path: `${pathname}${search}` }),
    );
  }, [signedOut, pathname, search, replace]);

  if (session.status === 'unknown') return <SessionLoading titled={false} />;
  if (session.status === 'signed-out') return <SessionLoading />;
  return <SignOutContext value={signOut}>{children}</SignOutContext>;
}
