import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// The product's own visual system, exactly as apps/web loads it (ADR-0001): the v46 sheets in
// one xr.v46 layer plus the xr.product layer. Then the V3 Refined Direction B layer (ADR-0010),
// which applies only inside a V3 root: every v46 specimen and parity page renders as before. The
// harness frame styles come last.
import '@xr/ui/styles.css';
import '@xr/ui/styles-v3.css';
import './harness.css';

export const metadata: Metadata = {
  title: 'Specimen harness',
  robots: { index: false, follow: false },
};

/**
 * The specimen harness (VD-17, ADR-0007 §3): renders one component specimen per page for
 * Playwright checks. It is a separate app that is never deployed and never part of the product;
 * it has no navigation and no controls of its own.
 */
export default function HarnessLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Public Sans as the product loads it (PF-09 fallback, VD-02; the boards' link, B8-07). */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- this is the App Router root
            layout, which every page shares; the rule's pages/_document advice does not apply. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
