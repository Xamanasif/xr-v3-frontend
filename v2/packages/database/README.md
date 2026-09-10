# @xr/database

Prisma 7 + PostgreSQL foundation: schema, generated client (`src/generated/`, git-ignored)
and `createPrismaClient()` over the node-postgres driver adapter.

**The schema is a foundation probe, not the platform data model.** Domain modelling is Phase 3
(`docs/MIGRATION_STRATEGY.md` §3); nothing is translated from the prototype's `localStorage`
collections.

| Command                                            | Purpose                                           |
| -------------------------------------------------- | ------------------------------------------------- |
| `pnpm --filter @xr/database db:generate`           | generate the client (no database needed)          |
| `pnpm --filter @xr/database prisma:migrate:dev`    | create / apply migrations against `DATABASE_URL`  |
| `pnpm --filter @xr/database prisma:migrate:deploy` | apply committed migrations (staging / production) |

`prisma.config.ts` loads the workspace root `.env` (`v2/.env`) itself — Prisma 7 no longer
does — and falls back to a placeholder URL so generation works without a database.
