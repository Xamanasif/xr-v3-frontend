'use client';

import type { ReactNode } from 'react';

import { AppLinkProvider } from '@/platform/link';
import { PlatformProvider } from '@/platform/platform-provider';

/**
 * The application providers (Appendix F §3.2): the tab's platform — ports, session, the one
 * QueryClient and its defaults from the composition root — and `next/link` for `@xr/ui` links.
 * They render no UI of their own.
 */
export function Providers({ children }: { readonly children: ReactNode }) {
  return (
    <PlatformProvider>
      <AppLinkProvider>{children}</AppLinkProvider>
    </PlatformProvider>
  );
}
