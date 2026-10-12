'use client';

import {
  createContext,
  useContext,
  type AnchorHTMLAttributes,
  type ComponentType,
  type ReactNode,
  type Ref,
} from 'react';

/**
 * Link injection (Appendix E §2.6; Appendix F §3.4): @xr/ui may not import `next/*` (boundary
 * matrix), so every component that renders a link asks the context for the link component.
 * apps/web provides one that renders `next/link`; without a provider a plain `<a>` is used.
 */
export interface LinkRenderProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  readonly href: string;
  readonly ref?: Ref<HTMLAnchorElement>;
}

export type LinkComponent = ComponentType<LinkRenderProps>;

function AnchorLink({ ref, ...props }: LinkRenderProps) {
  return <a ref={ref} {...props} />;
}

const LinkContext = createContext<LinkComponent>(AnchorLink);

/** Supplies the application's link component (apps/web: a `next/link` wrapper). */
export function LinkProvider({
  component,
  children,
}: {
  readonly component: LinkComponent;
  readonly children?: ReactNode;
}) {
  return <LinkContext value={component}>{children}</LinkContext>;
}

/** The injected link component (a plain anchor when no provider is mounted). */
export function useLinkComponent(): LinkComponent {
  return useContext(LinkContext);
}
