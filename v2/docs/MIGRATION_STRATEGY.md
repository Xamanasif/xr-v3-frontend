# V2 Migration Strategy

|                          |                                                                                                                                                                                                                |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**               | Phase 0 — engineering plan. Nothing after Phase 0 is started                                                                                                                                                   |
| **Created**              | 10 September 2026                                                                                                                                                                                              |
| **Gold standard**        | `ui-ux/18-unified-functional-platform/` at commit `8af1f2a4f55d96cd98be4e4ee413e856236ee1f7` — **frozen, read-only, runnable**                                                                                 |
| **Companion documents**  | `ARCHITECTURE.md` · `FUNCTIONAL_PARITY_MATRIX.md` · `OPEN_DECISIONS.md`                                                                                                                                        |
| **Governing constraint** | Business rules are **migrated, not reinterpreted**. Where a rule is an implementation judgement in the gold standard it stays labelled as one in V2 (`OPEN_DECISIONS_FOR_STAKEHOLDER.md`, `PM_DELTA_09.md` §9) |
| **Amended**              | 12 October 2026 (WP-0.2): §8 records the v46 frontend-on-mocks track. **Owner sign-off requested** (register P0-03); not a merge blocker for Phase 0. Phases 1–5 below are unchanged as the backend target     |

---

## 1 · Principles

1. **The gold standard is the executable specification.** Its state layer (`js/state.js`) and its 2,202 deterministic assertions (`qa/checks.js`, 97 scenario groups) define what "correct" means until a stakeholder decision says otherwise.
2. **Behaviour first, screens last.** Rules move into `@xr/domain` with tests before any API or screen depends on them. Screens are redesigned (Design V2), never ported.
3. **Deliberate, not mechanical.** The 11,000-line state engine is not transliterated. Each slice is re-expressed as pure functions over explicit inputs, with the prototype-only scaffolding (scenario selector, demo controls, demo clock, stand-in completion, `localStorage` schema) left behind.
4. **Every slice ends in a parity gate** with evidence, and the gold standard stays runnable beside V2 until the final gate is signed.
5. **Reversible.** V2 lives under `v2/` on `v2/*` branches. `main` and the prototype are not modified. Nothing is deleted at any stage; retirement of the prototype is an explicit, separate decision.

## 2 · The reference, and how to use it

| Use                             | How                                                                                                                                                                                                                              |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Run the prototype               | `cd ui-ux/18-unified-functional-platform && python3 serve.py` → `http://127.0.0.1:8791/` (no build, no dependencies)                                                                                                             |
| Run its deterministic suite     | `/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc qa/harness.js qa/checks.js` from the prototype folder — expect the literal line `ALL CHECKS PASSED — N assertions`                                   |
| Find a rule                     | `README.md` (state model, request state machine, licence allocation, content production model, learning model, judgement register), then the named function in `js/state.js`                                                     |
| Find the assertion for a rule   | the `group('…')` names in `qa/checks.js`; each maps to a parity row                                                                                                                                                              |
| Find the decision behind a rule | `STK31-nn` in `ui-ux/00-project-context/STAKEHOLDER_CONFIRMED_UPDATE_2026-08-31.md`; 6 Sep answers in `stakeholder-review/STAKEHOLDER_CORRECTIONS_07_2.md`; open items in `stakeholder-review/OPEN_DECISIONS_FOR_STAKEHOLDER.md` |

**Not migrated, by design:** prototype-only actor pointers (`protoStudentId` etc.), the scenario selector and `scenarioTenant()`, `DEMO CONTROL` runtime simulators, the demo expiry clock, the in-page stand-in completion control, the payment simulation screen (the _boundary_ is migrated, the simulation is not), the first-party XLSX parser (V2 may use a maintained library; the import **rules** are what must survive), and the `localStorage` schema-version chain (V2 uses database migrations).

## 3 · Phases

### Phase 0 — Foundation (this phase)

Monorepo, web and API skeletons, database and package boundaries, tooling, these documents. Exit: all checks in `PHASE0_VERIFICATION.md` pass; human review of the architecture.

### Phase 1 — Flagship design (Design V2)

Opened **only after** Phase 0 is reviewed. Design tokens and accessible primitives in `@xr/ui` (Tailwind v4, custom XR Platform components — not a generic component-library dashboard), then the flagship screens: Public Landing, Public Catalogue, Student Home, Faculty Overview, Tenant Overview, Super Admin Overview. Screens are designed from the confirmed journeys and the gold standard's _information_ (what each screen must show — `STK31-17`, `STK31-42`, `STK31-43`), not from its HTML. Flagship screens run on contract-shaped fixtures until Phase 3 provides real endpoints.

Exit: stakeholder review of the flagship set; design tokens and primitives accepted.

### Phase 2 — Domain migration

Rules move into `@xr/domain`, one slice at a time, in dependency order (derived from `ui-ux/17-stakeholder-correction-blueprint/15_IMPLEMENTATION_BACKLOG_AND_SEQUENCE.md` §2):

| Slice                                      | Rules migrated                                                                                                                                                                                                                                                                                                                   | Gold-standard evidence                                                              |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| D1 · Vocabularies and catalogue read model | technology enum (Web · VR · MR · AR, `STK31-45`), hierarchy (Grouping → Course → Experiment → technology availability), published-only visibility                                                                                                                                                                                | `data.js`, `publishedPool()`, QA Y7                                                 |
| D2 · Institution lifecycle                 | request state machine, approve / request-more-information with required reason, internal vs external branch, provision-on-approval vs activate-on-payment, grant may only narrow, expansion, renewal mirrors plan                                                                                                                | `submitRequest`… `activateRenewal`; scenarios A, P, Q, Y, AA, CC                    |
| D3 · Tenant people and entitlement         | manual add, CSV import contract, groups, course mappings (local code, optional Semester), Faculty mapping, assignment inside the approved set, **derived** entitlement, licence allocation (one licence per active student per access record; Faculty consume none; deactivation releases; reactivation queue), tenant isolation | scenarios I, M, R, ALTITUDES, 08R groups; QA C–H                                    |
| D4 · Learning and telemetry                | resources (Experiment-level), simulation per technology, runtime events (vocabulary, idempotency, session folding, pre-telemetry baseline), progress per technology, conservative overall state                                                                                                                                  | IMPL 09 / 09c groups; `foldSessions`, `simulationUtilisation`, `experimentProgress` |
| D5 · Assessment                            | Faculty-owned definitions, Question Bank Add / Edit / Delete with snapshot safety, CSV / XLSX import rules, AI-assisted drafting boundary, attempts and scoring, visibility policy and withholding, descriptive review (Faculty only; AI suggestion never final)                                                                 | scenarios O, IMPL 09 import groups; QA O, S–X                                       |
| D6 · Content production                    | Vendor draft → submit, Academic Review with Learning Outcomes, change requests with references, Content Manager readiness, **Publish** (first publication), delivery-link management, later versions and correction versions, **Release / Hold** by the Super Admin, material-vs-safe field split                                | scenarios D, E, J, V, 07.3-A…D, IMPL 09 correction groups                           |
| D7 · Governance                            | tenant creation / Tenant Admin assignment / deactivation, platform role scopes (all / course / experiment) and withdrawal, canonical structure create / rename / re-parent, canonical metadata and Course code ownership, platform override with reason                                                                          | scenarios B, C, L, S, T, Z1–Z5, DD, EE                                              |
| D8 · Operations                            | device transfer Student → Tenant Admin → Super Admin, support requests, access-term state and the 15-day reminder rule (channel open), Faculty progress export                                                                                                                                                                   | scenarios F, G, H, N, BB, 07.3-I                                                    |

For each slice: transcribe the relevant `qa/checks.js` assertions into Vitest tests **first**, implement pure functions until they pass, record every place a prototype judgement was carried over (labelled) versus a source-confirmed rule.

Exit per slice: the transcribed assertions pass; the parity row moves to _Domain_.

### Phase 3 — Backend migration

For each domain slice, in the same order: Prisma models and migrations, repositories with tenant scoping, application services with authorization policies, API modules with OpenAPI, DB-backed integration tests. The identity layer (authentication, `Principal` resolution, SSO federation) is the first backend increment because every workspace depends on it. Seed data for development is generated from the same sample world the gold standard uses (Sample Engineering Institute, the six Civil / Mechanical experiments) — as **development fixtures only**, never as production records (`STK31-23`).

Exit per slice: integration tests pass; the parity row moves to _API_.

### Phase 4 — Deep workspace migration

Role workspaces are built on the API in dependency order: authentication and shell → public catalogue and request → Super Admin → Tenant Admin → Faculty → Student → Vendor / Academic Reviewer / Content Manager. Each workspace uses the Phase 1 design system and the Phase 3 endpoints; each ends with its parity gate and browser tests.

Exit per workspace: the parity rows it owns move to _Web_ and then _Parity-verified_.

### Phase 5 — Cutover and reference retirement

When every parity row is verified and the stakeholder signs the operating model, the prototype becomes an archived reference. It is **not deleted**; the folder and its history stay in the repository, and the parity matrix records the commit each row was verified against.

## 4 · Parity gates

A parity gate is passed when, for a scenario group:

1. the transcribed assertions exist in V2 and pass at the level the gate claims (domain, API or web);
2. every deviation from gold-standard behaviour is either **source-confirmed** (a stakeholder / PM decision newer than the prototype) or **recorded as an open decision** — never silent;
3. prototype-only behaviour that was deliberately dropped is listed in the row's notes;
4. a reviewer other than the implementer has run the scenario against both systems.

Gates are recorded in `FUNCTIONAL_PARITY_MATRIX.md`, one row per scenario group, with the commit hashes of both sides.

## 5 · Rollback and reference strategy

| Situation                                             | Action                                                                                                                                                                                                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A V2 slice is found to contradict a confirmed rule    | The row returns to its previous status; the gold standard remains the reference; the fix is a domain change with a new test, not a screen patch.                                                                                                  |
| A stakeholder decision changes a rule                 | The gold standard is **not** edited (`STK31-48`). The change is recorded in `OPEN_DECISIONS.md` (closed) and the parity row's _governing source_ is updated; V2 implements the new rule with the old assertion replaced, never weakened silently. |
| V2 must be abandoned or restarted                     | Delete `v2/` on a branch. Nothing outside `v2/` depends on it, and the prototype is intact.                                                                                                                                                       |
| Demonstration is needed before V2 reaches a workspace | Use the prototype (`serve.py`). It remains the demo vehicle until its parity rows are verified.                                                                                                                                                   |

## 6 · Data migration

There is **no production data** to migrate: the prototype's `localStorage` state is sample data in each reviewer's browser. V2 starts from an empty database plus development fixtures. The schema-version chain of the prototype (1 → 12) is therefore not reproduced; its lessons are — every V2 migration is additive and idempotent, and a migrated record is never back-filled with invented history (the pre-telemetry rule).

## 7 · Risks

| Risk                                                                                              | Mitigation                                                                                                                                       |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Rules re-interpreted while being "cleaned up"                                                     | Assertions transcribed before implementation; deviations must cite a source                                                                      |
| The prototype and V2 drift while both exist                                                       | The prototype is frozen at `8af1f2a4…`; only stakeholder decisions change either                                                                 |
| Open decisions (completion contract, SSO provider, reminder channel, native stacks) block a slice | Each slice is designed so the open item is a **boundary** (port, adapter, config) not a dependency; see `OPEN_DECISIONS.md` for what each blocks |
| Toolchain majors (TypeScript 7, NestJS 12, Vitest 5, Prisma 8) shift under the foundation         | Versions pinned; upgrades are explicit tasks (E-12)                                                                                              |
| Local environments without Node.js (the machine used for Phase 0 had none)                        | `v2/README.md` states the exact prerequisites; verification used an isolated Node 24 LTS                                                         |

## 8 · v46 frontend-on-mocks track (amendment, 12 October 2026 — owner sign-off requested)

**Status.** Recorded in WP-0.2 for owner sign-off (register P0-03 in `docs/v46/audit/Appendix-G-Owner-Decisions.md`). It does not block Phase-0 work packages; it must be signed before the first Phase-1 workspace screen is built.

**What changes.** The owner approved the frozen Claude Design canvas v46 (`design/handoff-v46/`) as the frontend design authority and a Phase-0 plan that builds the complete v46 frontend **on typed mock services before the backend** (ADR-0002). The v46 build order (board B8-06) is its own track:

| v46 phase                               | Scope                                                                                                                                                                                                                                                                             | Runs on             |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| 0 · Foundation                          | Repository setup, decision records, v46 CSS and components, shells and navigation, domain types / state machines / policies for every record, all service ports and the contract suite, the mock adapter and sample world, foundation screens (XS-05, XS-06, XS-07, XS-08, PU-15) | Typed mock services |
| 1 · Public + access spine               | Public pages, request access, sign-in, Super Admin requests and institutions                                                                                                                                                                                                      | Typed mock services |
| 2 · Campus distribution                 | Institute Admin content access, Student access, people, groups, Faculty courses                                                                                                                                                                                                   | Typed mock services |
| 3 · Learning, feedback and device chain | Student learning, per-format progress, feedback, device transfers, usage                                                                                                                                                                                                          | Typed mock services |
| 4 · Teaching and assessment             | Faculty courses, assessments, question bank, marking, results                                                                                                                                                                                                                     | Typed mock services |
| 5 · Production and first publication    | Vendor editor, Academic Reviewer, Content Manager publication                                                                                                                                                                                                                     | Typed mock services |
| 6 · Corrections and governance          | Corrections and Release / Hold, Super Admin governance and operations                                                                                                                                                                                                             | Typed mock services |
| 7 · Consolidation                       | Cross-role flows A–F and the device chain end to end, responsive and accessibility sign-off                                                                                                                                                                                       | Typed mock services |

**Relation to the phases above.**

- **Numbering.** The repository's "Phase 0" (§3) closed at commit `1b090c9`. The v46 "Phase 0" is the frontend foundation on branch `v2/frontend-v46`. The two numberings are separate.
- **Phase 1 — Flagship design.** v46 Phase 0 delivers its tokens and accessible primitives. The flagship screens follow in v46 Phases 1–4, designed by v46 rather than re-designed.
- **Phases 2–4.** Phase 2 (domain migration) and Phase 3 (backend migration) remain the backend target. Phase 4 ("workspaces on the API") becomes: v46 workspaces built on the mock first, then **re-pointed to the API behind the same service ports**. The mock adapter retires per exception TE-2: when `apps/api` serves every port and the contract suite is green against HTTP.
- **Parity.** Rows reached on the mock carry the status `Web (mock)` (`FUNCTIONAL_PARITY_MATRIX.md` §I), which is never `Parity-verified`.

**v46 positions on the domain slices (recorded; nothing here resolves an open decision).**

| Slice | Text above                                                                       | v46 position for the frontend                                                                                                                                                             | Status                                                                                         |
| ----- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| D1    | "Grouping → Course → Experiment → technology availability"; "Web · VR · MR · AR" | Engineering area → Course → Experiment → Technology format. Programme is held on the Student record only, never a navigation level; no Module layer. Display order **WEB · AR · VR · MR** | Owner binding constraint BC2 (hierarchy); display order is a WP-0.3 copy change, ids unchanged |
| D3    | "one licence per active student per access record …"                             | Licence figures are shown as provided; nothing is computed or explained; "Waiting for a licence" is seeded, not derived                                                                   | **Open** — D7 / T-06 (register P2-01)                                                          |
| D4    | "progress per technology, conservative overall state"                            | Progress per technology format with **no** overall verdict; completion is a system-owned record (ADR-0006); a launch never completes                                                      | Owner binding constraints BC3 / BC4; the completing event (T-12 / A-06) is **open**            |
| D6    | "later versions and correction versions, Release / Hold"                         | Corrections run Content Manager → Academic Reviewer → Super Admin Release / Hold; Vendor-originated updates are deferred (LD-4)                                                           | `OPEN_DECISIONS.md` A-08 annotated, **not resolved**                                           |
| D8    | "device transfer Student → Tenant Admin → Super Admin"                           | Same chain, approve only, no Decline (T-32)                                                                                                                                               | `OPEN_DECISIONS.md` A-14 annotated, **not resolved**                                           |

**Unchanged.** The gold standard stays frozen and is not edited. Business rules are still migrated, not reinterpreted. Every deviation must cite a source or be recorded as an open decision (§4).
