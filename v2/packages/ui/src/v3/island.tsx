import type { ReactNode } from 'react';

/**
 * A v46 island inside a V3 root (`div[data-xr-v46]`, ADR-0010): content whose V3 design is still
 * pending — for example the shared Help pages while the XS workstream finishes — keeps the
 * existing v46 components and their look. Every V3 rule excludes the island and everything in it
 * (`rb-scoped.css`, `patch.css`), and V3P-05 gives it the v46 app container (`xr-app`) and text
 * defaults, so the v46 container queries keep working inside the V3 page.
 */
export function V46Island({ children }: { readonly children: ReactNode }) {
  return <div data-xr-v46="">{children}</div>;
}
