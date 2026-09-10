import { createVitestConfig } from '@xr/testing';

// Deterministic unit tests only. Database-backed checks live in *.db.test.ts and run
// through `vitest.db.config.ts` (`pnpm test:db`), which Turbo never caches.
export default createVitestConfig({ environment: 'node' });
