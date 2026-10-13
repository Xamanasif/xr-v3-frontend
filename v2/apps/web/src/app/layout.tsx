import type { ReactNode } from 'react';

// The v46 visual system first (one xr.v46 layer + the xr.product layer), then the app's
// composition utilities (ADR-0001; Appendix E §2.2).
import '@xr/ui/styles.css';
import './globals.css';
import { Providers } from './providers';

// No metadata title here: each page renders its own `<title>` ("Help & support · XR Learning
// Platform"; features/shared/document-title.tsx), because the workspace pages know theirs only in
// the browser, and a metadata title committed after hydration would replace it (WP-0.13).

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* PF-09 fallback (VD-02; START-HERE Known exception 7): Public Sans from Google Fonts,
            exactly as the boards load it (B8-07). Self-hosted files wait for G-5c. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- this is the App Router root
            layout, which every page shares; the rule's pages/_document advice does not apply. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
