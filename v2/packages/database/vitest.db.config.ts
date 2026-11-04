import { createVitestConfig } from '@xr/testing';

// Like prisma.config.ts: load the workspace root `.env` (v2/.env) when it exists, so
// `pnpm test:db` reaches the database the developer configured. Variables already set
// in the shell (CI) take precedence; with neither, the database case is skipped.
try {
  process.loadEnvFile(new URL('../../.env', import.meta.url));
} catch {
  // no root .env — environment variables already set, or the database case skips
}

export default createVitestConfig({
  environment: 'node',
  include: ['src/**/*.db.test.ts'],
  environmentDependent: true,
});
