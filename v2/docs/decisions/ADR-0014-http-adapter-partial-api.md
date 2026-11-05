# ADR-0014 — The HTTP adapter while the API serves only part of the platform

|                     |                                                                                                                                          |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**          | Proposed — owner decision requested (`docs/BACKEND_PLAN.md`, "Before B2 ends")                                                           |
| **Date**            | 5 Nov 2026                                                                                                                               |
| **Branch**          | `backend/b2-plumbing`                                                                                                                    |
| **Owner basis**     | None yet. The plan lists "how the web app runs with one service on the API and the rest on the mock" as an owner decision before B2 ends |
| **Leaves in place** | Product builds on `sample` (TE-2, TE-8); the sample adapter and its test hooks (ADR-0007) unchanged; no identity (A-01 / E-01 open)      |

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
3. **One source per build; ports the API does not serve answer `unavailable`.** Proposed here.

## Decision (proposed)

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
- Build refusal: `NEXT_PUBLIC_XR_DATA_SOURCE=api NEXT_PUBLIC_APP_ENV=production pnpm --filter
@xr/web build` fails with the message from `next.config.ts`.
