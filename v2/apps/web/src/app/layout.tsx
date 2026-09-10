import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import '@xr/ui/tokens.css';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'XR Simulation Learning Platform — V2 foundation',
  description: 'Phase 0 architecture foundation. Not a product screen.',
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
