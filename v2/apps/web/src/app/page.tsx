import { API_BASE_PATH } from '@xr/contracts';
import { PLATFORM_ROLES, TECHNOLOGIES } from '@xr/domain';
import { FoundationStatusList } from '@xr/ui';
import Link from 'next/link';

import { ApiHealthProbe } from '@/components/api-health-probe';
import { publicEnv } from '@/lib/env';

/**
 * Phase 0 foundation page. It proves that the app boots, routes, imports the shared
 * workspace packages and reaches the API. It is NOT a product screen — the Public
 * Landing and every workspace belong to Design V2.
 */
export default function HomePage() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-semibold">XR Simulation Learning Platform — V2 foundation</h1>
      <p className="mt-2">
        Phase 0 proves the wiring only. Product screens are designed in Design V2 after this
        foundation is reviewed.
      </p>
      <div className="mt-6">
        <FoundationStatusList
          title="Foundation checks"
          checks={[
            {
              id: 'boot',
              label: 'Web application boots (Next.js App Router, strict TypeScript)',
              state: 'ok',
            },
            {
              id: 'routing',
              label: 'Routing',
              state: 'ok',
              detail: <Link href="/system">Open the /system route</Link>,
            },
            {
              id: 'packages',
              label: 'Shared workspace packages',
              state: 'ok',
              detail: `@xr/domain: ${PLATFORM_ROLES.length} roles, technologies ${TECHNOLOGIES.join(' · ')} — @xr/contracts: ${API_BASE_PATH} — @xr/ui: this list`,
            },
            {
              id: 'api',
              label: `API connectivity (${publicEnv.NEXT_PUBLIC_API_BASE_URL})`,
              state: 'info',
              detail: <ApiHealthProbe />,
            },
          ]}
        />
      </div>
    </main>
  );
}
