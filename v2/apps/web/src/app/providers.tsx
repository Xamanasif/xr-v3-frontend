'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';

/** Server-state foundation: one QueryClient per browser session. */
export function Providers({ children }: { readonly children: ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 5_000 } } }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
