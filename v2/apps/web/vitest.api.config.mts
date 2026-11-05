import { fileURLToPath } from 'node:url';

import { createVitestConfig } from '@xr/testing';

// The contract suite against a running API (`pnpm test:contract-api`, never cached; ADR-0014).
// It needs `XR_CONTRACT_API_URL`; without it the suite is skipped.
export default createVitestConfig(
  { environment: 'node', include: ['src/**/*.api.test.ts'], environmentDependent: true },
  {
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
  },
);
