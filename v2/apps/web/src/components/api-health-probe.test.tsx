import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiHealthProbe } from './api-health-probe';

const sample = {
  status: 'ok',
  service: 'xr-platform-api',
  version: '0.0.0',
  apiVersion: 'v1',
  environment: 'development',
  timestamp: new Date().toISOString(),
  uptimeSeconds: 1,
  checks: { database: { status: 'skipped', detail: 'DATABASE_URL is not set' } },
};

function renderProbe() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ApiHealthProbe />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ApiHealthProbe', () => {
  it('renders the validated health summary', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json(sample));
    renderProbe();
    expect(await screen.findByText('xr-platform-api')).toBeInTheDocument();
    expect(screen.getByTestId('api-health')).toHaveAttribute('data-state', 'ok');
    expect(screen.getByText(/DATABASE_URL is not set/)).toBeInTheDocument();
  });

  it('reports an unreachable API instead of failing silently', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    renderProbe();
    // The query retries once (about 1 s of back-off) before it settles on an error.
    expect(await screen.findByText(/API unreachable/, {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByTestId('api-health')).toHaveAttribute('data-state', 'error');
  });
});
