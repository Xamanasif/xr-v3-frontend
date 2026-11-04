# ADR-0011 — Prisma version gate (E-22): stay on Prisma 7.10 for the first business tables

|                     |                                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**          | **Accepted** — owner, 4 Nov 2026 (closes E-22)                                                                                                          |
| **Date**            | 4 Nov 2026                                                                                                                                              |
| **Branch**          | `backend/b0-groundwork` (backend phase B0, groundwork), from `8ca8166`                                                                                  |
| **Closes**          | `../OPEN_DECISIONS.md` E-22 once accepted                                                                                                               |
| **Evidence**        | `../PHASE0_VERIFICATION.md` §12 (live database, 4 Nov 2026); npm registry reads of 4 Nov 2026 (below)                                                   |
| **Leaves in place** | `packages/database` as it is: `prisma` / `@prisma/client` / `@prisma/adapter-pg` **7.10.0** exact pins, the `prisma-client` generator, the bounded pool |

## Context

E-22 says Prisma 7.10 is a bounded Phase 0 choice and that Prisma 8 must be re-evaluated **before
any business schema modelling**: stable status, migration model, query / driver-adapter model and
generated-client layout. "Do not start the domain schema on a major that is about to change."

Our setup, which any choice must keep working:

- `prisma-client` generator, `output = ../src/generated/prisma`, `moduleFormat = "esm"`,
  `importFileExtension = "js"` (native ESM end to end, ARCHITECTURE.md §5);
- `@prisma/adapter-pg` over a node-postgres pool built by `buildPoolConfig()`
  (`packages/database/src/index.ts`): connect timeout, client `query_timeout` + server
  `statement_timeout`, idle timeout, `max`, `allowExitOnIdle`;
- `prisma.config.ts` loading `v2/.env` with Node's own loader; migrations in `prisma/migrations`;
- Node 24 LTS; TypeScript 6.0; the single table `FoundationProbe` with `@default(uuid(7))`.

On 4 Nov 2026 that setup ran against a live PostgreSQL 17 for the first time: `prisma migrate dev`
applied `20260910000000_foundation_probe`, `pnpm test:db` passed the real probe, and
`GET /api/v1/health` reported `database: ok` (and `unavailable` within 333 ms with the server
stopped — the pool bounds hold).

### What the registry and the release notes say (read 4 Nov 2026)

| Fact                                                                                                                                                                                                                           | Source                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| `prisma` dist-tag **`latest` = `8.0.0-rc.30`** (published 3 Nov 2026); `prev` = `7.10.1`; no `8.0.0`                                                                                                                           | `npm view prisma dist-tags`, `npm view prisma versions`                     |
| `@prisma/client`, `@prisma/adapter-pg`: `latest` = **`7.10.1`**; the only 8.x builds are `8.1.0-dev.*`                                                                                                                         | `npm view @prisma/client dist-tags`, `… adapter-pg …`                       |
| Prisma 8's PostgreSQL runtime is a different package, **`@prisma/orm-postgres`** (`latest` = `8.0.0-rc.22`)                                                                                                                    | `npm view @prisma/orm-postgres dist-tags`; Prisma's `prisma8-and-7-example` |
| GitHub releases: every 8.0.0 entry is a pre-release; "Latest" is 7.10.1. GA was expected October 2026                                                                                                                          | `github.com/prisma/orm/releases`                                            |
| 8.0.0-rc.19: generator functions leave `@default` — `@default(uuid())` is refused (`PSL_GENERATOR_IN_DEFAULT`), use `@onCreate(uuid(7))`                                                                                       | rc.19 release notes                                                         |
| Migration model changes during the RC: `contract emit`, `migration plan`, `db sign` (adopting an existing database), `db migrate`; rc.17 changed data-loss consent; rc.22 moved pack migrations under `migrations/<space-id>/` | rc.15 / rc.17 / rc.22 release notes; `prisma8-and-7-example`                |
| Prisma 8 CLI engines: Node `^22.18.0 \|\| ^24.11.0 \|\| >=26`; `@prisma/orm-postgres` peers TypeScript `>=5.9`                                                                                                                 | `npm view prisma@latest engines`                                            |

So Prisma 8 is not "7 plus changes": it replaces the generated `@prisma/client` + driver-adapter
model with a contract-based runtime and a new migration workflow, and its breaking changes are
still landing release to release. A supported path from 7 to 8 exists — Prisma's own example
adopts a Prisma 7 database with `prisma db sign` and keeps the Prisma 7 migrations as history.

## Options

| Option                                            | For                                                                                                                                                                                                                                                                                   | Against                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **A · Stay on Prisma 7.10 (recommended)**         | Stable, current line ("Latest" on GitHub, 7.10.1 patch out 15 Oct 2026). Every piece of our setup — ESM `prisma-client` output, `@prisma/adapter-pg`, the bounded pool, Node 24 — is now proven live. Prisma documents a 7 → 8 adoption path, so tables created on 7 are not stranded | A major migration remains ahead of us; the longer the schema grows, the larger the adoption step. 7.x will eventually leave active support                                                                                                                                                                                                                                                                                                                   |
| B · Move to Prisma 8 now (8.0.0-rc.30)            | Starts the domain schema on the long-term model; no later adoption step                                                                                                                                                                                                               | Not stable; the RC changed schema semantics (rc.19) and migration layout (rc.22) within the last three weeks. `@prisma/client` / `@prisma/adapter-pg` have no 8.x release, so our generator, client factory and pool wiring must be rewritten against `@prisma/orm-postgres`, whose pool / timeout model is unverified. `FoundationProbe` already needs a schema rewrite (`uuid(7)`). pnpm's minimum-release-age policy would need exclusions for weekly RCs |
| C · Wait: no business tables until Prisma 8 is GA | No double migration                                                                                                                                                                                                                                                                   | Blocks Phase 3 / backend B1 on a third party's date, which has already slipped once                                                                                                                                                                                                                                                                                                                                                                          |

## Decision (recommended)

**Option A.** Build the first business tables on **Prisma 7.10.x**, with exact pins as today. Treat
Prisma 8 as a planned, separate migration, not a precondition.

1. Keep `prisma`, `@prisma/client` and `@prisma/adapter-pg` on the **same exact 7.10.x version**.
   Moving to the 7.10.1 patch is allowed as its own small change, verified with the commands below.
2. Never install by tag. npm's `latest` for `prisma` points at a release candidate; `prisma@latest`
   would install 8.0.0-rc.\*. Every Prisma change names an exact version.
3. Schema conventions that keep the later adoption small: one PostgreSQL schema, no Prisma-only
   features without a database equivalent where avoidable, migrations committed and generated by
   `prisma migrate dev` only. Generator defaults (`@default(uuid(7))`) stay allowed — Prisma 8 ships
   a rewrite to `@onCreate(...)`.
4. **Re-open trigger** (any one): `prisma` publishes `8.0.0` (non-RC) on `latest` **and**
   `@prisma/orm-postgres` publishes `8.0.0`; or Prisma announces an end-of-support date for 7.x;
   or a 7.x defect blocks us. Then run a spike (below) and write the migration ADR.

## Consequences

- Backend B1 (first business table) is unblocked by E-22 once the owner accepts this ADR.
- A Prisma 8 migration is **expected** later: client factory rewrite (`createPrismaClient`,
  `probeDatabase`), schema `@onCreate` rewrite, adoption of the live database with `prisma db sign`,
  CI commands changed. Its size grows with the schema; the re-open trigger bounds the wait.
- The bounded-pool guarantees (ARCHITECTURE.md §5 health, PHASE0_VERIFICATION.md §12) stay as
  they are proven today; the Prisma 8 spike must show the same bounds before any switch.
- `OPEN_DECISIONS.md` E-22 is closed by this ADR (accepted by the owner on 4 Nov 2026).

## How to verify

Today's state (all from `v2/`, Docker running, `v2/.env` from `.env.example`):

```bash
docker compose up -d postgres
pnpm --filter @xr/database prisma:migrate:status   # "Database schema is up to date!"
pnpm test:db                                        # @xr/database: Tests 1 passed (1), nothing skipped
pnpm --filter @xr/api start                         # after `pnpm turbo run build --filter=@xr/api`
curl -s "http://localhost:4000/api/v1/health"       # "checks":{"database":{"status":"ok",…}}
```

The re-open trigger:

```bash
npm view prisma dist-tags                # latest is 8.x without "-rc"
npm view @prisma/orm-postgres dist-tags  # latest is 8.x without "-rc"
```

The Prisma 8 spike, when triggered (a throw-away branch, never `main`): install exact 8.x
versions; port `createPrismaClient` / `probeDatabase` to the Prisma 8 PostgreSQL runtime with the
same pool bounds; adopt a copy of the local database with `prisma db sign`; pass `pnpm build`,
`pnpm typecheck`, `pnpm test`, `pnpm test:db`, the health probe (`ok`, and `unavailable` within the
connect timeout with PostgreSQL stopped).
