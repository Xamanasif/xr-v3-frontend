'use client';

import { useQuery } from '@tanstack/react-query';
import { HEALTH_PATH, healthResponseSchema } from '@xr/contracts';

import { fetchApi } from '@/lib/api-client';
import { publicEnv } from '@/lib/env';

/** Proves the web → API path: calls GET /api/v1/health through TanStack Query. */
export function ApiHealthProbe() {
  const health = useQuery({
    queryKey: ['api', 'health'],
    queryFn: () => fetchApi(HEALTH_PATH, healthResponseSchema),
    retry: 1,
    refetchInterval: 15_000,
  });

  if (health.isPending) {
    return (
      <p role="status" data-testid="api-health" data-state="pending">
        Checking the API at {publicEnv.NEXT_PUBLIC_API_BASE_URL}…
      </p>
    );
  }

  if (health.isError) {
    return (
      <p role="status" data-testid="api-health" data-state="error">
        API unreachable at {publicEnv.NEXT_PUBLIC_API_BASE_URL}: {health.error.message}
      </p>
    );
  }

  const report = health.data;
  return (
    <dl
      data-testid="api-health"
      data-state={report.status}
      className="grid grid-cols-[auto_1fr] gap-x-4"
    >
      <dt>Status</dt>
      <dd>{report.status}</dd>
      <dt>Service</dt>
      <dd>{report.service}</dd>
      <dt>Version</dt>
      <dd>{report.version}</dd>
      <dt>Environment</dt>
      <dd>{report.environment}</dd>
      <dt>Database</dt>
      <dd>
        {report.checks.database.status}
        {report.checks.database.detail ? ` — ${report.checks.database.detail}` : ''}
      </dd>
    </dl>
  );
}
