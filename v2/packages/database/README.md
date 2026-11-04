# @xr/database

Prisma 7 + PostgreSQL: schema, generated client (`src/generated/`, git-ignored),
`createPrismaClient()` over the node-postgres driver adapter with a bounded pool, and the
committed migrations. Prisma stays on 7.10.x by ADR-0011.

**Data model.** Built slice by slice (`docs/MIGRATION_STRATEGY.md` §3, Phase 3); nothing is
translated from the prototype's `localStorage` collections. Today: **D1 · Catalogue**
(ADR-0013) — engineering areas, courses, published experiments with their versions, formats,
learning outcomes and the featured list. Hand-written CHECK constraints live in the migrations.

| Command                                            | Purpose                                                   |
| -------------------------------------------------- | --------------------------------------------------------- |
| `pnpm --filter @xr/database db:generate`           | generate the client (no database needed)                  |
| `pnpm --filter @xr/database prisma:migrate:dev`    | create / apply migrations against `DATABASE_URL`          |
| `pnpm --filter @xr/database prisma:migrate:deploy` | apply committed migrations (staging / production)         |
| `pnpm --filter @xr/database db:seed`               | load the development catalogue seed (refused outside dev) |
| `pnpm --filter @xr/database test:db`               | database-backed tests, each run in a throw-away schema    |

`prisma.config.ts`, `vitest.db.config.ts` and `scripts/db-seed.mjs` load the workspace root
`.env` (`v2/.env`) themselves — Prisma 7 no longer does; values already in the shell win.

**Development seed.** `prisma/seed/catalogue.json` is the sample world's catalogue, exported by
`pnpm --filter @xr/sample-platform export:catalogue-seed`; a sample-platform test fails when the
committed file falls behind the world. It is a development fixture only, never a production
record (STK31-23).

**`@xr/database/testing`.** `createMigratedSchema(url)` creates a fresh schema and applies every
committed migration to it as written, so database tests never touch `public`; `drop()` removes it.
