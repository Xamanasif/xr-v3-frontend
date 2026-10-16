import { parseEnv } from '@xr/config/env';
import { webBuildFlagsSchema } from '@xr/config/env/build';
import type { NextConfig } from 'next';

/**
 * The build flags (TE-7; ADR-0007 §2), validated once. This is the one literal read of the
 * test-hook flag (Appendix F §3.8): nothing that ships to the browser reads it.
 */
const flags = parseEnv(webBuildFlagsSchema, {
  NEXT_PUBLIC_XR_DATA_SOURCE: process.env.NEXT_PUBLIC_XR_DATA_SOURCE,
  NEXT_PUBLIC_XR_TEST_HOOKS: process.env.NEXT_PUBLIC_XR_TEST_HOOKS,
});

// No silent fallback (ADR-0002 §5): `api` is a valid data source, but its HTTP adapter
// (Appendix F §3.2 `platform/http/`) is not built, so no build is made for it.
if (flags.NEXT_PUBLIC_XR_DATA_SOURCE === 'api') {
  throw new Error(
    'NEXT_PUBLIC_XR_DATA_SOURCE=api: the HTTP adapter is not built yet (Appendix F §3.2). Build with NEXT_PUBLIC_XR_DATA_SOURCE=sample or unset.',
  );
}

/**
 * The build-time alias of the test-hook bridge (Appendix F §3.2, §3.8; ADR-0007 §2). The
 * platform imports `@/platform/test-hooks`. Every build names its target explicitly: the empty
 * stub, unless this is a dedicated CI/Playwright build (`scripts/next-with-test-hooks.mjs`),
 * which compiles in the bridge. A build without the alias resolves the stub too (tsconfig
 * paths), so no misconfiguration can ship the bridge; `pnpm verify` scans the built chunks.
 */
const TEST_HOOKS_MODULE = '@/platform/test-hooks';
const testHooksTarget = flags.NEXT_PUBLIC_XR_TEST_HOOKS
  ? './src/platform/test-hook-bridge.ts'
  : './src/platform/test-hooks.ts';

/**
 * The seven static workspace bases (ADR-0005 §1; `@xr/contracts/draft` WORKSPACES). Kept literal
 * here — next.config.ts loads before the app's modules — and held equal to the route manifest
 * (`src/nav/routes.ts` REDIRECTS) by its unit test.
 */
const WORKSPACE_BASES = [
  'student',
  'faculty',
  'institute',
  'vendor',
  'reviewer',
  'content-manager',
  'admin',
] as const;

// Turbopack is the default in Next.js 16 for `next dev` and `next build`.
// Workspace packages are consumed as compiled ESM (`dist/`), so no transpilePackages.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // `next dev` would otherwise write AGENTS.md / CLAUDE.md into this app; agent guidance
  // for this repository is decided at repository level, not by a framework default.
  agentRules: false,
  // The test build has its own output folder, so it can never be mistaken for (or overwrite)
  // the product build in `.next`.
  ...(flags.NEXT_PUBLIC_XR_TEST_HOOKS ? { distDir: '.next-test-hooks' } : {}),
  turbopack: {
    resolveAlias: { [TEST_HOOKS_MODULE]: testHooksTarget },
  },
  /**
   * Appendix A §3.7 row 20 (Phase 0): `/<base>/help/reports` is an intermediate path created by
   * the XS-07 sub-routes — My reports lives on `/<base>/help`. Row 21 (Phase 1, Package 1A, with
   * XS-03): `/signed-out` → the sign-in card's "You’re signed out" notice (D-15). Row 1 (Package
   * 1B): `/courses` → `/areas`. Not permanent (the route plan may still change).
   */
  redirects() {
    return Promise.resolve([
      ...WORKSPACE_BASES.map((base) => ({
        source: `/${base}/help/reports`,
        destination: `/${base}/help`,
        permanent: false,
      })),
      { source: '/signed-out', destination: '/sign-in?reason=signed-out', permanent: false },
      // Row 1 (Phase 1, Package 1B): the PU-05 breadcrumb's "Areas" level has no page of its own.
      { source: '/courses', destination: '/areas', permanent: false },
      // Row 17 (Phase 3, board-forced): "Operations" opens Device transfers (B7-09 f0; B3-11).
      {
        source: '/admin/operations',
        destination: '/admin/operations/device-transfers',
        permanent: false,
      },
      // Row 15 (Phase 6, board-forced): "Content" and the "Content" crumb open Updates (B7-05).
      { source: '/admin/content', destination: '/admin/content/updates', permanent: false },
    ]);
  },
};

export default nextConfig;
