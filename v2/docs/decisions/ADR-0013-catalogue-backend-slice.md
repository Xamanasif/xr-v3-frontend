# ADR-0013 — D1 catalogue backend slice: the public catalogue served by the API

|                     |                                                                                                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**          | Accepted (engineering) — acknowledgement requested                                                                                                                |
| **Date**            | 4 Nov 2026                                                                                                                                                        |
| **Branch**          | `backend/b1-catalogue`, from `backend/b0-groundwork` (`21d134a`)                                                                                                  |
| **Owner basis**     | Owner, 4 Nov 2026: ADR-0011 and ADR-0012 accepted; first backend slice = **D1 catalogue** (read-only, public, needs no identity decision — A-01 / E-01 stay open) |
| **Leaves in place** | The web on typed mock services (TE-2, TE-8): no web code is re-pointed; `@xr/contracts` root export and `WIRE_CONTRACTS` unchanged; Prisma 7.10 (ADR-0011)        |

## Context

`MIGRATION_STRATEGY.md` §3 Phase 3 builds each domain slice as "Prisma models and migrations,
repositories …, API modules with OpenAPI, DB-backed integration tests"; identity comes first, but
the identity provider is undecided, so the owner chose the read-only public catalogue (slice D1,
§3 Phase 2 table) instead. The catalogue's rules already exist and are tested: `publicCatalogue`
and `publicAreas` in `@xr/domain`, the `CatalogueService` port and its DTO schemas in
`@xr/contracts/draft` (Appendix C §3.2), the typed mock in `@xr/sample-platform`, and the
contract suite's catalogue cases. The web's public pages (PU-01 … PU-06, PU-15) read that port.

The goal of the slice: the API answers **exactly** what the mock answers, so the web can later be
re-pointed behind the same port (TE-2's removal trigger: "`apps/api` serves every port and the
contract suite is green against HTTP").

## Decision

1. **One rule, two adapters.** The search filter and orders (`searchPublicCatalogue`) move from
   the sample adapter into `@xr/domain`; `publicCatalogue`, `publicAreas` and `publishedFormats`
   take the fields they read (`PublishedExperimentFacts`), so a read-model row uses them without
   inventing a full `Experiment`. The sample adapter calls the moved function (behaviour unchanged:
   contract suite, sample-platform and the web's public features green).
2. **Tables** (`packages/database`, migrations `20261104091921_d1_catalogue`,
   `20261104093000_d1_catalogue_order`): `engineering_area`, `course`, `experiment`,
   `experiment_version` (+ `experiment_version_format`), `learning_outcome`, `featured_experiment`,
   with the domain's own ids. An experiment row exists only once published; every version is kept
   and `experiment.live_version_id` names the live one through a **composite** reference, so it is
   always one of the experiment's own versions. Hand-written CHECK constraints hold the WEB-link /
   package delivery split (STK31-37), the live period and non-negative positions; Prisma's diff
   ignores them (verified: no drift). `foundation_probe` is dropped, as its schema comment required.
   Nothing about access, entitlement, activity or completion is stored (BC9).
3. **The catalogue's own order is stored** (`catalogue_order` on areas, courses, experiments). The
   mock's `default` order and its area and course lists follow the sample world's recorded order,
   which no timestamp reproduces; the web shows that order on PU-01 and PU-03. It is seeded from the
   world. **Who curates it in production is not decided** (same standing as PC-32's featured list).
4. **Development seed from the same world.** `@xr/sample-platform` exports its catalogue as plain
   JSON (`export:catalogue-seed` → `packages/database/prisma/seed/catalogue.json`); a test fails
   when the committed file falls behind the world. `pnpm --filter @xr/database db:seed` loads it in
   one transaction and refuses outside `APP_ENV=development` (STK31-23: development fixtures only).
   The two packages may not import each other; the JSON is the only thing that crosses.
5. **API module** `apps/api/src/modules/catalogue`: a `CatalogueRepository` (Prisma: the whole
   public catalogue per request in ONE repeatable-read transaction — it is small; no torn reads
   during a re-seed or publication), `CatalogueReader` (the same domain functions and DTO mapping as
   the mock), and five public routes, no sign-in:

   | Route                                              | Port method       | Errors        |
   | -------------------------------------------------- | ----------------- | ------------- |
   | `GET /api/v1/catalogue/areas`                      | `listAreas`       | 503           |
   | `GET /api/v1/catalogue/areas/{areaId}`             | `getArea`         | 400, 404, 503 |
   | `GET /api/v1/catalogue/courses/{courseId}`         | `getCourse`       | 400, 404, 503 |
   | `GET /api/v1/catalogue/experiments?sort=…`         | `searchCatalogue` | 400, 503      |
   | `GET /api/v1/catalogue/experiments/{experimentId}` | `getExperiment`   | 400, 404, 503 |

   The port's `not-found` is a 404 problem with a client-facing detail; its `unavailable` is a 503
   problem whose reason is logged, never published.

6. **Wire contracts.** ADR-0008's removal trigger ("`apps/api` begins serving ports") has fired for
   this port only. Its draft DTO schemas pass `assertRepresentable` unchanged and are asserted as
   wire schemas in `catalogue.contract.ts`, then published with their routes (the 200 schemas are
   tested equal to `toOpenApiSchema` of the port schemas). They stay **defined** in
   `@xr/contracts/draft`: the guards that keep `./draft` out of the root export and out of
   `WIRE_CONTRACTS` stand, and promotion of the catalogue DTOs to the root entry is a follow-up.
   The one HTTP-only shape is the search query: coercion is refused on the wire (B7), so `featured`
   travels as `'true' | 'false'`; unknown keys are refused; `sort` is required (B1-04).
7. **Two foundation corrections found by the slice.** (a) The problem filter called every 404 a
   missing route; it now does so only for the router's own 404 — a missing record keeps its detail.
   (b) Fastify's default `maxParamLength` (100) answered 414 for ids the published contract allows
   (≤ 200); it is raised to 256, so the contract answers.

## Consequences

- **Parity proven.** Against the seeded development database, 75 comparisons — the area list, 3
  area pages, 5 course pages, 51 searches (17 query shapes × 3 orders: featured, area, format,
  text and combined filters), 12 experiment pages and 3 not-found cases — are byte-identical
  between the API and the typed mock (`node scripts/catalogue-parity.mjs`, the API running). The contract suite's catalogue
  cases are not yet run against HTTP: they need an HTTP subject for the whole suite (TE-2's trigger).
- Tests: domain +6 (search); sample-platform +3 (seed export); database `test:db` +5 (migrations
  on a throw-away schema, seed, CHECK, composite reference, transactional seed); API +11 (routes,
  rules, 400 / 404 / 503 problems with no leak, the published document) and `test:db` +5 (the same
  routes on PostgreSQL: seeded order, featured order, live version only, unpublished hidden).
- `@xr/database/testing` (`createMigratedSchema`, `developmentCatalogueSeed`) makes every later
  slice's DB tests run on the committed migrations without touching the developer's data.
- **Not done here, by design:** the web is not re-pointed (needs the HTTP adapter for every port
  the public pages use, including `SelectionService`); no writes (structure, codes, publication —
  D6 / D7); no caching or SQL-side filtering (revisit when the catalogue outgrows one read per
  request); no CI (D-05).
- Open: who curates the catalogue order and the featured list in production (decision 3, PC-32);
  OD-B7-05 (is the version label public?) keeps `versionLabel: null`.

## How to verify

From `v2/`, Docker running, `v2/.env` from `.env.example`:

```bash
docker compose up -d postgres
pnpm --filter @xr/database prisma:migrate:dev     # applies the two D1 migrations
pnpm --filter @xr/database db:seed                # 3 areas, 6 courses, 12 experiments (15 versions), 4 featured
pnpm test:db                                      # database 6 passed, api 5 passed
pnpm exec turbo run test --filter=@xr/api --filter=@xr/domain --filter=@xr/sample-platform
pnpm exec turbo run build --filter=@xr/api && pnpm --filter @xr/api start
curl -s "http://localhost:4000/api/v1/catalogue/experiments?sort=default&featured=true"
node scripts/catalogue-parity.mjs http://localhost:4000   # "75 comparisons, 0 differences"
```
