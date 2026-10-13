'use client';

/**
 * Link injection (Appendix E §2.6; Appendix F §3.2 `link.tsx`): `@xr/ui` may not import `next/*`
 * (boundary matrix), so its components ask `LinkProvider` for the link component; the app
 * supplies one that renders `next/link` (client-side navigation, prefetch). Props pass through
 * unchanged.
 */
import { LinkProvider, type LinkRenderProps } from '@xr/ui';
import NextLink from 'next/link';
import type { ReactNode } from 'react';

export function AppLink(props: LinkRenderProps) {
  return <NextLink {...props} />;
}

export function AppLinkProvider({ children }: { readonly children?: ReactNode }) {
  return <LinkProvider component={AppLink}>{children}</LinkProvider>;
}
