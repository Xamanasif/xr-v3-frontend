# XR Simulation Learning Platform — V2

Production-oriented engineering foundation for the platform. **Phase 0** (architecture foundation, accepted by independent audit with corrections applied) — no product screens, no business modules, no authentication yet.

The validated behaviour lives in the gold-standard prototype at `../ui-ux/18-unified-functional-platform/` (read-only). Start with the documents:

| Document                                                               | Purpose                                                                                                                                                             |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)                         | System boundaries, web / API separation, multi-tenancy, data and auth boundaries, XR runtimes, storage, testing layers, Phase 0 decisions, deployment prerequisites |
| [`docs/MIGRATION_STRATEGY.md`](docs/MIGRATION_STRATEGY.md)             | How behaviour moves from the gold standard into V2, phase by phase, with parity gates and rollback                                                                  |
| [`docs/FUNCTIONAL_PARITY_MATRIX.md`](docs/FUNCTIONAL_PARITY_MATRIX.md) | The 36 scenario groups V2 must reproduce, with their sources and evidence. Nothing is verified yet                                                                  |
| [`docs/OPEN_DECISIONS.md`](docs/OPEN_DECISIONS.md)                     | Product decisions still owned by the stakeholder / PM, engineering decisions, the Prisma 8 and ESLint gates, deployment prerequisites                               |
| [`docs/PHASE0_VERIFICATION.md`](docs/PHASE0_VERIFICATION.md)           | What was verified for the corrected foundation, with the exact commands and results                                                                                 |

## Layout

```
v2/
  apps/
    web/          Next.js 16 (App Router) — the web application
    api/          NestJS 12 on Fastify, native ESM — the platform API (/api/v1, OpenAPI at /api/docs)
    specimens/    component specimen harness (VD-17) — test infrastructure only, never deployed
  packages/
    domain/       pure business rules and vocabularies (no dependencies at all)
    contracts/    Zod schemas for API payloads + strict OpenAPI conversion + wire-contract registry
    validation/   shared validation primitives (wire and accepted forms)
    database/     Prisma 7 schema, generated client, bounded pool configuration
    config/       tsconfig / ESLint presets (incl. package-boundary rules) + environment schemas
    testing/      Vitest and Playwright foundations, browser helpers (keyboard, reach, axe), component axe checks
    ui/           design tokens and primitives (filled by Design V2)
  docs/
  docker-compose.yml   local PostgreSQL (optional)
```

Everything is native ES modules — packages and the API alike; the web app is bundled by Turbopack.

## Prerequisites

| Tool    | Version                                              | Notes                                                                                                              |
| ------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Node.js | **24 LTS** (`engines`: ≥ 24.15; verified on 24.21.0) | `.nvmrc` says `24`. The machine used to create Phase 0 had no Node.js installed; see `docs/PHASE0_VERIFICATION.md` |
| pnpm    | **12.3.4** (`packageManager`)                        | `corepack enable && corepack prepare pnpm@12.3.4 --activate`, or `npm install -g pnpm@12.3.4`                      |
| Docker  | optional                                             | for the local PostgreSQL in `docker-compose.yml`; every check except `pnpm test:db` runs without it                |

## Commands (run from `v2/`)

```bash
pnpm install
pnpm build          # builds every package and app through the Turborepo graph
pnpm typecheck
pnpm lint           # ESLint 9 flat config, including the package-boundary rules
pnpm test           # deterministic unit / component / API-integration suites (cacheable, environment-independent)
pnpm test:db        # database-backed checks against DATABASE_URL (never cached; skipped when unset)
pnpm test:e2e       # Playwright at the four approved widths against the BUILT apps: web smoke, browser-helper self-tests, specimen harness (no API)
pnpm format:check
pnpm verify         # the local gate: format, uncached repository checks, build/typecheck/lint/test, bundle scan, browser suites
pnpm dev            # shared packages in tsc --watch, API on http://localhost:4000, web on http://localhost:3000
```

`pnpm dev` is dependency-aware: an edit in a shared package is recompiled by that package's watcher, the API restarts on the new output (and stays stopped while its own code does not compile), and the Next.js dev server picks the change up on the next request.

`pnpm verify` (`scripts/verify.mjs`, `docs/v46/audit/Appendix-F-Phase0-Plan.md` §7.7) is the gate until a CI runner exists. Its repository step re-hashes the frozen `design/handoff-v46/` (178 files) and the audit evidence in `docs/v46/`, and runs the static scans of §7.6 (owner constraints, canvas leakage, Slice-1 terms, B8-03 policy words, raw styling, the UI-kit deny-list) uncached, because they read files outside any one package. The browser suites need ports 3000 and 3100 free.

Environment: copy `.env.example` to `.env` (root, used by the API and by Prisma) and `apps/web/.env.example` to `apps/web/.env.local`. Placeholders only — no real secrets are committed. Turborepo runs in strict env mode; the `.env` files a build reads are part of its cache key.

Local database (optional):

```bash
docker compose up -d postgres
pnpm --filter @xr/database prisma:migrate:dev
pnpm test:db
```

Without a database the API still boots and `GET /api/v1/health` reports the database check as `skipped`; `GET /api/v1/health?database=skip` is the cheap liveness poll.
