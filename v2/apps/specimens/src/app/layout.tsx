import type { Metadata } from 'next';
import type { ReactNode } from 'react';

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
      <body>{children}</body>
    </html>
  );
}
