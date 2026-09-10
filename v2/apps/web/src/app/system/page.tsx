import { HEALTH_PATH } from '@xr/contracts';
import { ROLE_PLANNING_LABEL, PLATFORM_ROLES, TECHNOLOGY_META, TECHNOLOGIES } from '@xr/domain';
import Link from 'next/link';

import { publicEnv } from '@/lib/env';

/** Second route: proves App Router navigation and server-side use of shared packages. */
export default function SystemPage() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-semibold">System</h1>
      <p className="mt-2">
        <Link href="/">← Foundation</Link>
      </p>
      <h2 className="mt-6 text-lg font-medium">Web configuration</h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4">
        <dt>Environment</dt>
        <dd>{publicEnv.NEXT_PUBLIC_APP_ENV}</dd>
        <dt>API base URL</dt>
        <dd>{publicEnv.NEXT_PUBLIC_API_BASE_URL}</dd>
        <dt>Health path</dt>
        <dd>{HEALTH_PATH}</dd>
      </dl>
      <h2 className="mt-6 text-lg font-medium">Domain vocabulary (from @xr/domain)</h2>
      <ul>
        {PLATFORM_ROLES.map((role) => (
          <li key={role}>{ROLE_PLANNING_LABEL[role]}</li>
        ))}
      </ul>
      <ul className="mt-2">
        {TECHNOLOGIES.map((technology) => (
          <li key={technology}>
            {TECHNOLOGY_META[technology].name} — {TECHNOLOGY_META[technology].delivery}
          </li>
        ))}
      </ul>
    </main>
  );
}
