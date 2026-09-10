import { defineConfig } from 'prisma/config';

/**
 * Prisma 7 does not load `.env` itself. Load the workspace root `.env` (v2/.env) when
 * it exists — Node's built-in loader, no dotenv dependency — and fall back to a
 * placeholder so `prisma generate` works with no database configured. Every command
 * that CONNECTS (migrate, db push, studio) needs a real DATABASE_URL and fails clearly
 * against the placeholder instead of silently doing nothing.
 */
try {
  process.loadEnvFile(new URL('../../.env', import.meta.url));
} catch {
  // no root .env — environment variables already set, or the placeholder applies
}

const PLACEHOLDER_DATABASE_URL = 'postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? PLACEHOLDER_DATABASE_URL,
  },
});
