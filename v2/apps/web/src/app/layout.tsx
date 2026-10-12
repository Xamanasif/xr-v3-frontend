import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import '@xr/ui/tokens.css';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'XR Learning Platform',
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
