# ADR-0014 — The HTTP adapter while the API serves only part of the platform

|                     |                                                                                                                                     |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Status**          | Accepted — owner, 5 Nov 2026 ("accept as written")                                                                                  |
| **Date**            | 5 Nov 2026                                                                                                                          |
| **Branch**          | `backend/b2-plumbing`                                                                                                               |
| **Owner basis**     | Owner, 5 Nov 2026: option 3 accepted as written, closing the B2 decision "how a partly re-pointed web is composed"                  |
| **Leaves in place** | Product builds on `sample` (TE-2, TE-8); the sample adapter and its test hooks (ADR-0007) unchanged; no identity (A-01 / E-01 open) |

## Context

ADR-0013 made the API answer the public catalogue exactly as the mock does. B2 has to show the web
reading it, but the API serves 5 of 184 operations: one build cannot be "all on the API" yet.
ADR-0002 §5 forbids a silent fallback — a configured data source is never answered by another
adapter. Until now `NEXT_PUBLIC_XR_DATA_SOURCE=api` was refused at build time
(`DataSourceUnavailableError`) because `platform/http/` (Appendix F §3.2) did not exist.

Three ways to put a half-switched web app together:

1. **Mixed per port** — the catalogue from the API, everything else from the sample world in the
   same build. Rejected: it is the silent fallback ADR-0002 §5 forbids, and the two halves would
   disagree (a sample publication would not reach the API's catalogue).
2. **Wait for the cutover (B11)** before any web build uses the API. Rejected: the contract tests
   and the public pages would never meet the API until the end, which is the drift risk the plan
   names first.
3. **One source per build; ports the API does not serve answer `unavailable`.** Chosen (owner, 5 Nov 2026).

## Decision

1. **One data source per build.** `NEXT_PUBLIC_XR_DATA_SOURCE=api` composes the HTTP adapter
   (`apps/web/src/platform/http/`) and nothing else; `composePlatform` returns `sample: null`, and
   every sample-only runtime hook (snapshot, sample web activity) is skipped when it is absent.
2. **Port by port:**

   | Port         | Answers from                                                                    |
   | ------------ | ------------------------------------------------------------------------------- |
   | catalogue    | the API, `GET /api/v1/catalogue/…` (ADR-0013)                                   |
   | selection    | this tab's `sessionStorage`, same key and same domain rules as the mock (B1-06) |
   | session      | nobody signed in; `signIn` answers `unavailable` (no identity until B3)         |
   | the other 19 | `unavailable` — the drawn "failed, try again" state — built from the ledger     |

   Each later phase replaces one `unavailablePort(…)` with its HTTP port.

3. **Wire handling** (`request.ts`): 200 is validated against the port's own output schema; a body
   outside it throws `ContractDriftError` (a programming error, not a soft failure). 404 →
   `not-found`, 400 → `invalid-request`, no answer / 5xx / anything else → `unavailable`.
4. **Development builds only.** `next.config.ts` refuses an `api` build unless
   `NEXT_PUBLIC_APP_ENV=development`. Product builds stay on `sample` until B11. `api` together with
   the test hooks is refused by the flag schema: the hooks drive the sample world only (ADR-0007).
5. **Query cache for `api`:** answers are fresh for 60 s and re-read when the network returns (other
   people change the platform); still no retries and no waiting for the network.
6. **Command ids** are not sent yet: the API serves reads only. They reach the API with B4.
7. **The contract suite's HTTP subject** (`platform/http/contract.api.test.ts`, run by
   `test:contract-api`, uncached, only when `XR_CONTRACT_API_URL` is set) runs every case through
   this adapter against a running API on the development seed. It claims the catalogue's methods
   only and builds the spine-start fixture only; everything else is "not run" by the suite's own
   rules. It has no identity (`as` is a fresh visitor until B3), no stand-ins or seams, and an empty
   snapshot: that reads change nothing is checked by the API's own database tests instead. CI runs
   it after the catalogue parity script, against the same API.
8. **The catalogue DTOs are promoted to the root entry** (ADR-0013 follow-up; ADR-0008's removal
   trigger has fired for this port). They are defined once in `@xr/contracts` `src/catalogue.ts`
   (with the wire-only path parameters and search query, formerly in the API) and listed in
   `WIRE_CONTRACTS` as published (`CatalogueAreaList`, `CatalogueAreaPage`, `CatalogueCoursePage`,
   `CatalogueSearchQuery`, `CatalogueSearchResult`, `PublicExperimentPage`). The draft port
   re-exports the same schema objects, so the mock, the API and the web share one definition. The
   kernel they need (`typed.ts`, `primitives.ts`) moved from `src/draft/kernel/` to `src/kernel/`,
   with re-export shims left at the old paths, so the root entry still reaches no `draft/` file.
   The guard "WIRE_CONTRACTS holds no draft port schema" became "only a promoted port's" (the
   catalogue). The web keeps importing from `./draft`: the root entry carries the OpenAPI helpers,
   which the browser bundle does not need.
9. **An `api` build has its own output folder**, `.next-api`, like `.next-test-hooks`, so it can
   never overwrite or be mistaken for the product build in `.next`.

## Consequences

- The public pages can be exercised against a running API in a development build, and the
  contract tests can target the HTTP adapter from B2 on.
- In an `api` development build every signed-in screen shows the failed state. This is intended:
  it shows exactly what the API does not serve yet.
- The selection must know an experiment's published formats from catalogue answers this tab has
  read (`PublishedFormats`); an experiment no answer has named is `not-found`. All current entry
  points to the selection read the experiment first.
- If the owner chooses differently (for example option 2), the HTTP adapter stays as written and
  only point 4 changes.

## How to verify

- `pnpm --filter @xr/web typecheck` and `pnpm --filter @xr/web test` (5 Nov 2026: 177 files,
  7,847 tests passed), including `platform/http/http.test.ts`, `composition.test.ts`,
  `build-alias.test.ts` and `boundaries.test.ts`.
- Contract suite over HTTP: start the API on a seeded development database (`db:seed`, then
  `pnpm --filter @xr/api start`), then `XR_CONTRACT_API_URL=http://localhost:4000 pnpm --filter
@xr/web test:contract-api`. 5 Nov 2026, local Postgres: 44 passed, 41 not run, 0 failed. Read
  the 44 carefully: `catalogue:structure` and `catalogue:featured` are the B2 exit evidence; the 22
  `surface:*` cases check that the adapter offers every ledger method; the 20 `session:*` cases
  pass without calling anything, because they skip every method the adapter does not claim.
- Public pages on the API, in a build: `NEXT_PUBLIC_XR_DATA_SOURCE=api NEXT_PUBLIC_APP_ENV=development
pnpm --filter @xr/web build` (→ `.next-api`), served with `next start` beside the API. 5 Nov 2026,
  in Chromium: PU-01 `/`, PU-02 `/areas`, PU-03 `/areas/chemical-process`, PU-04 `/experiments`,
  PU-05 `/courses/fluid-mechanics`, PU-06 `/experiments/distillation-column` each rendered the
  seeded catalogue from `GET /api/v1/catalogue/…` with no failed state; PU-15 (an unknown
  experiment) showed "We can’t find that experiment" from the API's 404. An ad-hoc check, not yet a
  committed browser suite.
- After the promotion: contracts, API, sample-platform and database typecheck, test and lint
  green; API `test:db` 5 passed; the published OpenAPI document lists the six catalogue components;
  `catalogue-parity.mjs` still "75 comparisons, 0 differences".
- Build refusal: `NEXT_PUBLIC_XR_DATA_SOURCE=api NEXT_PUBLIC_APP_ENV=production pnpm --filter
@xr/web build` fails with the message from `next.config.ts`.
