# Backend plan — from the first slice to retiring the mock

|               |                                                                                                                                                                 |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Date**      | 4 November 2026                                                                                                                                                 |
| **Status**    | Proposed — for owner review. Nothing here resolves an open decision; each phase lists the decisions it waits for                                                |
| **Builds on** | `MIGRATION_STRATEGY.md` §3 (Phases 2–5, slices D1–D8) and §8 (v46 track); `OPEN_DECISIONS.md`; ADR-0002 (TE-2), ADR-0011, ADR-0012, ADR-0013                    |
| **Measure**   | The typed service ports in `@xr/contracts/draft`: **22 ports, 184 methods** (`ledgerRows()`). Served by the API today: **1 port, 5 methods** (CatalogueService) |

## 1 · Where we are

| Phase                        | Branch                  | Done                                                                                                                                                                                            |
| ---------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **B0 · Groundwork**          | `backend/b0-groundwork` | Database layer live for the first time (migrate, `test:db`, health `ok` / `unavailable`); Prisma 7.10 kept (ADR-0011, accepted); ESLint 9 renewed (ADR-0012, accepted); verification record §12 |
| **B1 · D1 Catalogue (read)** | `backend/b1-catalogue`  | Catalogue tables and constraints, development seed from the sample world, five public routes, 75/75 parity with the mock, ADR-0013                                                              |
| **B2 · Platform plumbing**   | `backend/b2-plumbing`   | **Done** (5 Nov 2026): ADR-0014 accepted by the owner; P-28 moved to `API`. See below                                                                                                           |

B2, as delivered: Windows-safe `dev` / `verify`; CI with PostgreSQL (migrations, `test:db`,
parity, the contract suite over HTTP); the web's HTTP adapter (`platform/http/`, ADR-0014); the
contract suite's HTTP subject (catalogue cases green over HTTP: 44 passed, 41 not run, 0 failed);
the catalogue DTOs promoted to the root entry and `WIRE_CONTRACTS` (ADR-0014 §8); PU-01…PU-06 and
PU-15 checked in a browser on a development `api` build against the API.

Product builds still run entirely on the typed mock (TE-2); an `api` build is development-only. No
branch is pushed or merged.

## 2 · Where we are going

The backend is **finished** when all of these hold (TE-2's removal trigger and `MIGRATION_STRATEGY.md` Phase 5):

1. `apps/api` serves every port — 184 methods — with the port's own schemas as wire contracts.
2. The framework-free contract suite runs **green against HTTP**, not only against the mock.
3. The web is re-pointed port by port behind the same ports; screens do not change.
4. The mock (`@xr/sample-platform`) is no longer in any product build; exceptions TE-1 … TE-8 are
   removed or replaced by their real counterparts.
5. A deployed environment exists with the deployment prerequisites D-01 … D-05 closed.
6. Every parity-matrix row is `Parity-verified`.

## 3 · How every slice is built (definition of done, from B1)

Each slice repeats the B1 recipe, so progress is predictable and reviewable:

| Step | What                                                                                                                                        | Proof                                                                  |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1    | Rules live once, in `@xr/domain` (move any rule still inside the mock adapter)                                                              | domain tests; mock behaviour unchanged (contract suite, web tests)     |
| 2    | Prisma models and an additive migration; CHECK constraints for invariants the schema cannot express                                         | `test:db` on a throw-away schema; no drift after `migrate dev`         |
| 3    | Development seed from the sample world, with a drift test                                                                                   | the seed loads; the committed file equals the export                   |
| 4    | Repository (tenant-scoped once identity exists), service calling the domain's decision functions, routes using the port schemas on the wire | unit tests on an in-memory repository; HTTP tests; `test:db` over HTTP |
| 5    | Problems: 400 contract, 401/403 policy, 404 not found, 409 conflict / stale, 503 unavailable — nothing internal leaked                      | HTTP tests                                                             |
| 6    | Parity with the mock on the same seed (script now; the contract suite over HTTP from B2 on)                                                 | 0 differences                                                          |
| 7    | ADR for the slice; verification-record entry; parity-matrix rows move to `API`                                                              | reviewed docs                                                          |

## 4 · The phases

Ordered by dependency, following the D1–D8 slice order. Method counts are the ledger's; they are a
measure of size, not a schedule.

| Phase                                   | Scope (ports · methods)                                                                                                                                                                                                                                                   | Blocked by (decisions)                                                                                                                                                 | Exit                                                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **B2 · Platform plumbing**              | No new business data. CI (D-05) with a PostgreSQL service; Windows-safe `dev` / `verify` scripts; an **HTTP adapter** in the web for `CatalogueService` and an HTTP **subject for the contract suite**; promote the catalogue DTOs to the root entry (ADR-0013 follow-up) | How a partly re-pointed web is composed (one port on `api`, the rest on `sample`) — needs an ADR and owner acknowledgement (TE-7 knows only all-`sample` or all-`api`) | Contract suite's catalogue cases green against HTTP; public pages PU-01…PU-06 run on the API in a build  |
| **B3 · Identity and tenancy seam**      | SessionService (4). `Principal` resolution, authorization policies from `@xr/domain`, tenant context in every repository, audit history pattern                                                                                                                           | **A-01** identity provider, **E-01** broker vs managed, **E-02** web session, **E-04** RLS or app-layer, **E-06** history storage, **E-18** id strategy                | Every later route can require a principal and a role; tenant isolation tested                            |
| **B4 · D2 Institution lifecycle**       | AccessRequestService (13), InstitutionService (9) — 22                                                                                                                                                                                                                    | B3; **A-17 / E-10** payment (else the TE-4 stand-in stays)                                                                                                             | Flows A/B (request → approve / more information → provision / pay → activate) on the API                 |
| **B5 · D3 People and entitlement**      | PeopleService (10), GroupService (6), FacultyCourseService (4), InstitutionCourseCodeService (2), StudentAccessService (9) — 31                                                                                                                                           | B4; **E-17** derived read models; **E-21** spreadsheet import; D7 / T-06 licence rule (open)                                                                           | Entitlement derived, never stored; licence allocation; CSV import                                        |
| **B6 · D4 Learning and telemetry**      | LearningService (6), FeedbackService (2) — 8; the runtime-event ingestion endpoint (draft contract exists)                                                                                                                                                                | B5; **A-06 / T-12** completing event (the `CompletionPolicy` seam stays); **A-16** retention; **E-07** object storage                                                  | Progress per format from runtime events; completion as a system record                                   |
| **B7 · D5 Assessment**                  | AssessmentService (16), QuestionBankService (11), MarkingService (4), TeachingService (6) — 37                                                                                                                                                                            | B5 (B6 for results); **E-21**; AI assist **A-18 / E-11** (optional — leave out until decided)                                                                          | Faculty assessment, question bank with snapshot safety, attempts, marking                                |
| **B8 · D6 Content production**          | ProductionService (24), CorrectionService (15), PlatformCourseCodeService (2) — 41. **Writes the D1 catalogue tables**                                                                                                                                                    | B3; **A-08 / A-09** later-version governance; **E-07** packages and documents                                                                                          | Vendor draft → review → Publish; corrections → Release / Hold; the catalogue changes only by publication |
| **B9 · D7 Governance**                  | AcademicStructureService (9), PlatformRoleService (6) — 15                                                                                                                                                                                                                | B3; who curates the **catalogue order and featured list** (ADR-0013, PC-32); **A-10** retirement                                                                       | Structure create / rename / move with reasons; platform role scopes                                      |
| **B10 · D8 Operations**                 | OperationsService (16): device transfers, support, access ending, usage, overview                                                                                                                                                                                         | B5; **A-05 / E-09** notifications; **A-15** support SLA                                                                                                                | The 15-day reminder and device chain on the API                                                          |
| **B11 · Cutover**                       | SelectionService (5) stays in the visitor's browser by design (B1-06). Every other port on `api`; mock out of product builds; TE-1…TE-8 retired                                                                                                                           | All of the above                                                                                                                                                       | Section 2 holds                                                                                          |
| **Deployment track** (parallel from B2) | D-01 liveness vs readiness, D-02 production config enforcement, D-03 graceful shutdown, D-04 request-correlated logging, D-05 secrets and CI/CD                                                                                                                           | **A-02 / E-08** hosting                                                                                                                                                | A staging environment deployed from CI                                                                   |

### Critical path

**Identity (B3) gates everything that writes.** Every phase from B4 on needs a principal, a role and
a tenant. If A-01 / E-01 / E-02 stay open, the recommended way not to stall is to build B3's seam
with a **development-only token issuer** behind the verifier interface (never deployed, refused in
`APP_ENV=production` like the seed), so B4–B10 proceed and only the verifier changes when the
identity provider is chosen. This needs the owner's agreement: no real authentication is authorised
today (G-2).

## 5 · Decisions needed, and when

| When          | Decision                                                                           | Why it blocks                                   |
| ------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------- |
| Decided 5 Nov | Mixed composition of the web: one source per build (ADR-0014, accepted)            | Re-pointing the public pages one port at a time |
| Decided 5 Nov | P-28 moved to `API`; "request context" noted as a gap until B4                     | Parity bookkeeping                              |
| Before B3     | A-01, E-01, E-02, E-04, E-06, E-18 — or the development-issuer proposal above      | Every write, every tenant-scoped read           |
| Before B4     | A-17 / E-10 payment provider (or keep TE-4's stand-in in the API)                  | External requests' payment step                 |
| Before B5     | E-17 derived read models; E-21 import library; D7 / T-06 licence rule              | Entitlement and allocation                      |
| Before B6     | A-06 / T-12 completing event; A-16 telemetry retention; E-07 / A-02 object storage | Completion and resources                        |
| Before B8     | A-08, A-09 later-version governance                                                | Corrections and later versions                  |
| Before B9     | Catalogue order and featured-list curation (ADR-0013, PC-32); A-10 retirement      | Structure writes                                |
| Before B10    | A-05 / E-09 notifications; A-15 support SLA                                        | Reminders and support                           |
| Deployment    | A-02 / E-08 hosting, region and data residency                                     | Any deployed environment                        |

## 6 · Risks and how they are handled

| Risk                                                        | Handling                                                                                                        |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| The mock and the API drift apart while both exist           | Rules live only in `@xr/domain`; the contract suite runs against both from B2; parity per slice (0 differences) |
| Identity stays undecided                                    | The development-issuer seam (§4) — only the verifier changes later                                              |
| No CI: everything is verified on one Windows laptop         | B2 brings CI with PostgreSQL and the browser suites; fixes the Windows spawn issues in `dev` / `verify`         |
| Load-sensitive test timeouts on this machine (web, api, ui) | Decide per-test timeouts or fewer workers; CI is the reference run                                              |
| A later Prisma 8 migration grows with the schema            | ADR-0011 re-open trigger; schema kept to portable constructs; the spike plan in ADR-0011                        |
| Whole-catalogue reads per request (B1) stop scaling         | Fine at today's size; revisit with SQL-side filtering or caching when the catalogue grows (ADR-0013)            |
| Seed data mistaken for production data                      | Seeds refuse to run outside development (STK31-23); production gets data only through the product's own writes  |

## 7 · Next three steps

1. **Review and merge** `backend/b0-groundwork`, `backend/b1-catalogue` and `backend/b2-plumbing`
   (the owner's call; nothing is pushed), so CI runs for the first time.
2. **Fix the inherited browser failures** in `@xr/specimens` (stale logo-placeholder checks since
   the official logo; 375 px role-shell timeouts): frontend work, not backend; verification §13.
3. **Start B3**: take the identity decisions (A-01, E-01, E-02) or approve the development-issuer
   seam.
