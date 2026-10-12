# Appendix D — Cross-role workflow and shared-state architecture

> **Appendix D of the Phase-0 audit report** (`XR-v46-Phase0-Audit-Report.md`, Section 6). Source: `wf/final/architecture.md`, final edition (its verification log is §13). Two edits were made at assembly. A **Flow 1–6 ↔ A–F mapping** is inserted at the start of §4, and **invariant 10** in §5.5 is reworded, because "both Composite Wall records exist" is false before Flow E step 1 (`wf/verify/phase0.json` correction 8). The rest of the body is unchanged.
>
> **Reading notes added at assembly**
> 1. **Ports.** §4.1 names 18 ports. The plan adopts the 22 product ports of Appendix C as the contract; the names here are aliases (plan X-1). The error shapes are reconciled in Appendix F §6.5 (X-2).
> 2. **Overlapping grants.** AD-18's interim ("any active grant gives access") is **not** the Phase-0 interim. DV-1 follows permissions SACC-15: the overlap case returns `policy-open`.
> 3. **Phase-0 gate placement.** TE-5 (sample clock) and AD-39 (completion stored as a system record) are signed in gate G-2 before Phase-0 merges. TE-3, TE-4 and TE-8 are signed before their phases; TE-6 only if authorised.
> 4. **Sign-in (R6, §2.2).** XS-01 is built in Phase 1 per B8-06 unless the owner pulls it into Phase 0 (gate G-8). Phase-0 proofs set sessions through the CI-only boot descriptor (§2.5).
> 5. **One connected state (BC14).** Under option A (§3.1), BC14 holds inside one browser tab: every role signed in to that tab reads and writes one world, and sign-out and sign-in keep it. It does not hold across tabs or reloads until the owner authorises option B (AD-07, register P0-02).

---


Phase-0 audit deliverable · XR Learning Platform frontend · frozen design `design/handoff-v46/` · 9 Oct 2026
Read-only analysis. No repository file was changed, and nothing was installed or run.
Final edition: the draft was checked by an adversarial verifier, and every correction was re-checked against the boards and `1b090c9` before it was applied. §13 is the verification log.

## How to read this document

**Status of every item**

| Mark | Meaning in this deliverable |
|---|---|
| **CONFIRMED** | Restates or directly applies one of three sources: an owner binding constraint (START-HERE.md, 9 Oct 2026), a v46 board, or committed foundation code/doc at `1b090c9`. The evidence was spot-checked for this document. An architecture choice is marked CONFIRMED only when the evidence leaves no reasonable alternative. |
| **PROVISIONAL** | An engineering recommendation or a designed safe treatment. Reversible. It may need the owner to acknowledge it or to record an exception to `v2/docs/ARCHITECTURE.md`, but it does not block starting. |
| **UNRESOLVED** | Not specified by any board, stakeholder record or owner constraint, and no drawn safe treatment fully covers it. A safe interim treatment is proposed where one exists. The owner decides. |

**Citations**

- **Boards:** `design/handoff-v46/canvas-v46/project/<code>-….dc.html` is written as the board code (e.g. `B3-03`). `fN` is frame N on that board as indexed in `design/handoff-v46/derived/frame-index.json` (0-based), followed by the frame caption. Every frame quoted here was checked against the board markup.
- **Handoff data:** `design/handoff-v46/canvas-v46/project/handoff/<file>.json` is written as `flows.json`, `entities.json`, …
- **Owner constraints:** `design/handoff-v46/START-HERE.md` "Binding constraints" are written as **BC1…BC14**.
- **Understand-stage findings:** `wf/understand/<file>.json#<key>`. Business rules are cited as `BR-nnn` (`wf/understand/decisions-rules.json#businessRules`).
- **Repository:** `1b090c9:<path>` is the approved foundation commit, read with `git show`. Slice-1 paths are uncommitted working-tree files; they are reference material only.

---

## 0 · Recommendation in brief

Build **one Next.js application**. Its screens read and change **one shared sample world** through **typed service ports**. Today an in-browser mock adapter implements the ports. Later an HTTP adapter for `apps/api` implements the same ports, with no screen rewrite.

| # | Recommendation | Status |
|---|---|---|
| R1 | Business vocabulary, state machines, permission policies, invariants and read-model derivations go in **`@xr/domain`**. It stays pure: no React, no zod, no I/O, as the boundary matrix already requires. Each domain decision takes an **explicit, minimal input** (the records it needs, the actor, `now`), never the whole sample world, because `@xr/domain` may depend on nothing. | CONFIRMED (matrix) · PROVISIONAL (module plan) |
| R2 | Port interfaces, **draft** DTO schemas and the framework-free port contract suite go in **`@xr/contracts`** under a `draft/` namespace. Today the package exports only `.`, so a new `./draft` subpath export is needed. They are not registered in `WIRE_CONTRACTS` or OpenAPI until the API serves them. | PROVISIONAL (owner decision AD-02) |
| R3 | A new workspace package **`@xr/sample-platform`** holds the World types, the in-memory world, the deterministic seed, the clock, the command handlers (load inputs → domain decision → apply to the world) and a pluggable persistence driver (memory by default). It needs a new boundary-matrix row plus the type-union, TypeScript-project and ESLint edits listed in §1.2. `apps/web` may import it **only** from its composition root. | PROVISIONAL (AD-01) |
| R4 | `apps/web` holds the composition root, the TanStack Query layer, the screens (`features/<workspace>/…`) and one fenced, non-product sample route for the WEB runtime stand-in (§6.1). It holds no business rule. Invalidation is driven by the record types each mutation reports as changed. | PROVISIONAL |
| R5 | Persistence: **by default the sample world lives in memory, one per tab, and nothing is written to browser storage** (option A). B8-06 keeps "persistence" out until decided, and FUNCTIONAL_PARITY_MATRIX §G excludes the `localStorage` schema chain. A **versioned `localStorage` snapshot** kept coherent across tabs (option B) is recommended to the owner but is built only after authorisation (AD-07, TE-6). The selection basket stays in the browser session as B1-06 draws it. | CONFIRMED (B8-06 wording) · PROVISIONAL (AD-07) |
| R6 | Identity: real-looking sign-in on **XS-01** against sample-world accounts, with the drawn institution sign-in sequence (f0 → f5 → f6), account menu XS-05 and sign-out notice XS-03. No DEMO banner and no account chooser. Tests set identity through test-only fixtures. | CONFIRMED (BC10, B1-09, B8-03, BR-008) · PROVISIONAL (mechanics, AD-03) |
| R7 | **Runtime and payment stand-ins** live outside product chrome. The WEB runtime stand-in emits **only** launch and session events, never completion. `SIMULATION_COMPLETED` is produced only by seed fixtures and CI-only test hooks, unless the owner authorises otherwise (AD-40). Every stand-in or fixture event carries a sample-only provenance. Each stand-in is recorded as an exception. | CONFIRMED (BC3) · PROVISIONAL (AD-05, AD-06) |
| R8 | One canonical **"spine-start" seed** that holds **nothing Flows A/B create**: no Godavari, ACC-0107, Godavari people, group, Faculty mapping or course code. Background records are in steady state. The flow records come from a **scripted walk** that reserves each board reference (REQ-0042, SACC-0310, ASMT-0009/ATT-0450, DTR-0018, SUB-0077, UPD-0005, REQ-0058 …) and includes the setup steps `flows.json` does not trace. "Later sample" states (12 Oct) are a separate fixture. Test fixtures are built by replaying commands, never by hand-writing snapshots. | PROVISIONAL (AD-08) |
| R9 | Status is stored as **one canonical value per record**. Role-relative labels (DTR, UPD, REQ, SUB) are rendered by a copy table keyed by state × viewer role (and, for SUB, revision and origin). | CONFIRMED (boards use role-relative words) · PROVISIONAL (mechanism) |
| R10 | Before any code, record exceptions **TE-1…TE-8** against `1b090c9:v2/docs/ARCHITECTURE.md` §3/§4/§10/§14, FUNCTIONAL_PARITY_MATRIX §G and `@xr/config` env, each with a removal trigger. | CONFIRMED (the repo requires it) · PROVISIONAL (wording) |
| R11 | **Learning completion (⑤) is its own record**, written only by a system completion handler when the completion signal decided under T-12 is accepted. Read models show ④ and ⑤ side by side and never compute "Completed" from activity. | CONFIRMED (BC3) · PROVISIONAL (mechanism) · UNRESOLVED (trigger T-12; ARCH §8 tension, AD-39) |
| R12 | Where a flow row follows v46 against a recorded stakeholder position, the row is built per v46 and the conflict is **flagged to the owner** (AD-30…AD-37, AD-41…AD-45). It is not resolved here. | CONFIRMED (owner rule) |

---

## 1 · Layering and package placement

### 1.1 Layers

```
 screens  apps/web/src/features/<workspace>/<screen>/…      (React; v46 markup + @xr/ui; copy tables)
    │ only through
 query layer  apps/web/src/queries/<port>.ts                  (TanStack Query hooks, key factories, invalidation)
    │ only through
 ports  @xr/contracts/draft  (new "./draft" subpath export)   (TypeScript interfaces + zod DTO schemas + contract suite, DRAFT)
    │ implemented by (selected once in apps/web/src/platform/composition.ts)
 ├─ mock adapter  @xr/sample-platform                         (World types, world store, seed, clock, command handlers, stand-ins)
 └─ http adapter  apps/web/src/platform/http/*  (later)       (fetchApi + contract schemas → apps/api)
    │ both evaluate rules only through
 domain  @xr/domain                                           (record types, state machines, per-command decisions, policies, invariants, derivations)
```

Rules flow downward only. A screen never imports the world, a store or a domain transition. It renders a **view model** returned by a port and calls **commands** on that port. [PROVISIONAL]

The import `@xr/contracts/draft` resolves only after the `exports` change in §1.2. Today `1b090c9:v2/packages/contracts/package.json` exports only `"."`, and `xr/resolved-boundaries` rejects any bare workspace subpath that is not in the exports map (message `notExported`). [CONFIRMED]

### 1.2 Package placement against the committed boundary matrix

The committed matrix (`1b090c9:v2/packages/config/eslint/boundary-matrix.mjs`) sets:

- `ALLOWED_WORKSPACE_DEPENDENCIES`: `@xr/domain: []` · `@xr/contracts: [@xr/domain, @xr/validation]` · `@xr/web: [@xr/config, @xr/contracts, @xr/domain, @xr/ui, @xr/validation]`.
- `FORBIDDEN_THIRD_PARTY['@xr/domain']`: framework-server, framework-web, data-layer **and `zod`**.
- `'@xr/ui'`: forbids `next` and `next/*`.

| Layer | Package / path | Contains | Allowed by the matrix today? | Status |
|---|---|---|---|---|
| Domain | `@xr/domain` (`src/<family>/…`) | The **record types** each decision needs (REQ, INST, ACC, SACC, SUB, UPD, DTR, ASMT, ATT, CompletionRecord …); status unions as canonical ids; transition tables; **per-command decision functions with explicit, minimal inputs**, e.g. `decideApproveRequest({request, institution?, actor, now})` or `decidePublish({submission, actor, now})` → events or a refusal; policies (`may(actor, action, record, now)`); invariant predicates over those records; read-model derivations; the replaceable completion trigger (§5.1). The existing `roles.ts`, `technology.ts` and `runtime/*` stay. **No World type and no whole-world `apply` live here.** | Yes (no dependencies, no zod) | CONFIRMED (fits; `@xr/domain: []` is asserted by `boundaries.test.ts`) |
| Ports + DTOs | `@xr/contracts` → `src/draft/ports/<port>.ts`, `src/draft/dto/<port>.ts`, `src/draft/contract-suite/` | One TypeScript interface per port; zod schemas for every view model and command input; the `Refusal` union; a **framework-free contract suite** (`node:assert`, takes an adapter factory) that both adapters' tests run. Marked `DRAFT` like `runtime-events.ts`, and not in `WIRE_CONTRACTS`. | **Only after an exports change.** The dependency direction is allowed today (`contracts → domain, validation`; zod allowed), but the package exports only `"."`. Minimal change: add `"./draft": { "types": "./dist/draft/index.d.ts", "default": "./dist/draft/index.js" }`. (Alternative: re-export the draft ports from the root index under a `DRAFT` namespace.) | PROVISIONAL (AD-02) |
| Mock adapter | **new** `@xr/sample-platform` (`packages/sample-platform`) | **World types**; fact loading (world → the inputs of each domain decision); apply-to-world; seed builder and scripted walks; id source (§3.3); clock; the command pipeline (§1.4); side-effect handlers; history events; persistence driver (memory by default; browser snapshot only if AD-07 authorises it); stand-in ingestion (runtime, payment, drafting assistance); test fixtures (`buildWorld(...commands)`) | **No. These edits are needed** (all enforced by `1b090c9:v2/packages/config/src/boundaries/boundaries.test.ts`, which auto-discovers `apps/*` and `packages/*`): (1) `boundary-matrix.mjs`: add `ALLOWED_WORKSPACE_DEPENDENCIES['@xr/sample-platform'] = ['@xr/contracts','@xr/domain','@xr/validation']`, add `'@xr/sample-platform'` to the `'@xr/web'` list, and add `FORBIDDEN_THIRD_PARTY['@xr/sample-platform'] = [...FRAMEWORK_SERVER, ...FRAMEWORK_WEB, ...DATA_LAYER]`; (2) `eslint/boundaries.d.mts`: add it to the closed `WorkspacePackage` union; (3) `packages/sample-platform/tsconfig.build.json` with `composite` and `noEmitOnError`, referencing exactly its runtime dependencies (contracts, domain, validation); (4) a reference in `v2/tsconfig.solution.json`; (5) `eslint.config.mjs` with `boundaries('@xr/sample-platform')`; (6) a `package.json` `exports` map exposing only the composition entry and `./testing`; (7) a row in ARCHITECTURE §6. | PROVISIONAL (AD-01) |
| Composition root | `apps/web/src/platform/` | `composition.ts` selects the adapter from configuration; `PlatformProvider` exposes the ports and the session; `session-store.ts` (memory by default, per-tab `sessionStorage` under option B); a test-hook bridge compiled in **only for CI/Playwright builds** (§2.5) | Yes, once the row exists | PROVISIONAL |
| Query layer | `apps/web/src/queries/` | Per port: hooks, a key factory, `meta.deps` (the record types each view reads) and `useCommand` | Yes | PROVISIONAL |
| Screens | `apps/web/src/features/<workspace>/<screen-id>-<slug>/`, plus `features/shared/` (XS-05/06/07/08) | View components and copy tables (status label × viewer role); route files under `src/app/` stay thin | Yes | PROVISIONAL |
| Sample runtime route (non-product) | `apps/web/src/app/(sample-runtime)/runtime/web/page.tsx` | The WEB runtime stand-in opened by "Launch WEB" (TE-3). It calls `notFound()` unless the data source is `sample`, uses only the runtime port obtained from `PlatformProvider` (no direct `@xr/sample-platform` import), has no product chrome and no controls, and never emits completion. It cannot live in `@xr/sample-platform`, which forbids framework-web. | Yes | PROVISIONAL (AD-05) |
| Visual primitives | `@xr/ui` | v46 components; links are injected because `@xr/ui` cannot import `next/*` | Yes | CONFIRMED (matrix) |

**Why the ports go in `@xr/contracts`, not in `apps/web` or `@xr/domain`.**

1. `@xr/domain` cannot hold zod schemas (forbidden), and the ports return validated DTOs.
2. If the ports lived in `apps/web`, `@xr/sample-platform` could not implement them, because no package may depend on `@xr/web`. The contract suite lives next to the ports in `@xr/contracts/draft` as a framework-free function. The mock's tests (in `@xr/sample-platform`) and the HTTP adapter's tests (in `apps/web`, which owns `src/platform/http`) both run it, and it outlives `@xr/sample-platform` when the mock is retired.
3. `ARCHITECTURE §4` asks forms to use "the same schemas the API validates with (`@xr/validation`, `@xr/contracts`)". DTO schemas in `@xr/contracts` become the future wire contracts once `apps/api` serves them.

Port interfaces are client-side abstractions, slightly wider than ARCH §6's description of `@xr/contracts` ("Zod schemas for API payloads and their inferred types"). That is why this is an owner decision (AD-02), not a silent extension. [PROVISIONAL]

**Why a separate package rather than `apps/web/src/sample/`.**

`1b090c9:v2/docs/ARCHITECTURE.md` §3 says "Next.js is not the business backend… no business rule in `apps/web`". §4 lists "entitlement derivation, licence arithmetic, authorization decisions" as *not* web responsibilities. A separate framework-free package:

- keeps rule evaluation out of `apps/web`;
- can be deleted as one unit;
- runs its tests in node;
- lets the ESLint resolved-boundaries rule stop screens from reaching it.

The cheaper alternative, `apps/web/src/sample/` with a `no-restricted-imports` fence and no matrix change, is acceptable. It keeps "rules in the web app" as a standing exception. [PROVISIONAL]

**Import fences in `apps/web`** (ESLint `no-restricted-imports`, added on the new branch) [PROVISIONAL]:

- `@xr/sample-platform` may be imported only by `src/platform/composition.ts` and by test files. The sample runtime route reaches the runtime port only through `PlatformProvider`.
- `features/**` may import `@/queries/*`, `@xr/ui`, types from `@xr/contracts`, and vocabulary from `@xr/domain` (roles, technology, status ids). It may **not** import domain transition or policy functions. Screens decide nothing; they render the `availableActions` returned by the port (§6.3).

### 1.3 Domain module plan (`@xr/domain`) [PROVISIONAL, built on CONFIRMED rules]

| Module | Records (`entities.json` + boards) | Holds |
|---|---|---|
| `catalogue/` | AREA, CRS (platform code), EXP (live version, published formats), LO | Publication state; version-label rules (OD-B6-08); the two Composite Wall records kept as separate records (BC11, BR-130) |
| `submission/` | SUB (revision, return or re-check origin), LO edits | First-publication machine (BC7); `canPublish` = the publication check (BR-105) |
| `correction/` | UPD | Correction machine (BC8); one open update per experiment (B6-11 f9 "Never a second, conflicting update") |
| `request/` | REQ, PAY outcome | Request machine; the four separate events (BR-036); the smaller-scope difference rule (BR-034) |
| `institution/` | INST, ACC (plan), IA assignment | Pause / restore (BR-046). Term state derived from the clock: "Ending soon" ≤ 15 days (B7-09). The uncommitted Slice-1 `term.ts` is a candidate (§9) |
| `access/` | SACC (individual or group), GRP membership snapshot | Grant machine; `formatAvailability` and `experimentGate` derivations (§5); no counting rule (T-06/D7) |
| `people/` | PER (Programme on the Student record, BC2), FCM, CCODE | Active / Inactive; Faculty scope derivation (BR-064); course-code rule "a semester needs a code" (BR-021) |
| `resources/` | RES activity (Student × resource, `openedAt`) | "Opened (date)" only. Never progress, never ④ or ⑤ (BR-066, T-13). ARCH §8 classes `ResourceActivity` as learner-generated |
| `runtime/` (existing) | RUN events | `foldSessions` and `deriveSimulationUtilisation` (1b090c9) for **activity** (Not started / In progress, sessions). Their `COMPLETED` value is not read as the Student's completion state; see `completion/` |
| `completion/` | CompletionRecord (⑤) | The record type and the **system completion handler's decision**: given an accepted completion signal and any existing record for that Student × Experiment × format, write ⑤ once (the first completion counts; a later run never walks it back, ARCH §8). The trigger stays replaceable until T-12/A-06 is decided. The interim trigger reuses the committed rule "a completion is a report from a run" (a `SIMULATION_COMPLETED` in a launched or started session, `utilisation.ts`) (functional-prototype.json#warnings item 5) |
| `feedback/` | FB | Eligibility; one record per format (BC5, BR-071) |
| `assessment/` | ASMT, Q, ATT, MRK | Readiness derived from completeness (BR-078, PROVISIONAL; the make-available step is open, T-18); no defaults (BC6, BR-076); deterministic scoring of choice questions as drawn (B4-09 "choice questions are marked automatically"), which is not taken to be the excluded grading automation (owner to confirm, AD-38); release derived from the assessment's own setting (BR-079) |
| `device/` | DTR, authorised device | Chain Student → IA forward → SA approve; approve only (BR-073, T-32) |
| `roles/` (extend `roles.ts`) | ROLE holder, scope `all · course · experiment` | Scope withdraw / restore; visibility derivations for the Vendor course list, the Reviewer queue and the CM library (B7-08) |
| `support/` | SUP | Open · Resolved · Reopened; the resolve note is required (BR-011) |
| `history/` | history events on every record | Canonical event types (who, when, reason, references). Wording per viewer role is rendered in web copy tables: B6-12 draws a Vendor history and a staff history of SUB-0077 |

**Pattern** [PROVISIONAL]. Every write is `load inputs → decide → apply → checkInvariants`.

- **load inputs** (in `@xr/sample-platform`; later the `apps/api` repositories) reads from the world only the records the decision names, for example `{request, institution?}` for an approval.
- **decide** (in `@xr/domain`) is pure. It takes those records, the resolved actor and `now`, and returns either `{events, receipt}` or a `Refusal`.
- **apply** (in `@xr/sample-platform`) folds the events into the world's records and appends history.
- **checkInvariants(before, after, command)** (world-level check in `@xr/sample-platform`, built from domain predicates) throws on a programming error. Examples:
  - a Publish or Release changed any ACC or SACC (BC9);
  - a CompletionRecord appeared other than through the system completion handler, or from a launch (BC3);
  - a second FB record exists for one Student × Experiment × format (BC5).

### 1.4 Mock adapter: the command pipeline (`@xr/sample-platform`) [PROVISIONAL]

Every command goes through these steps:

1. **Serialise and read the latest world.** Option A (default, §3): an in-tab async mutex, because the world exists only in that tab's memory. Option B (only if AD-07 authorises it): `navigator.locks.request('xr.sample-world', …)` serialises writers across tabs; without locks, compare-and-swap on `worldVersion`, retried once.
2. **Resolve the actor from records** on every call: session person id → PER or ROLE holder → role, institution, scopes. The caller never passes a role (Slice-1 `services/access/types.ts`: "The caller is never a parameter").
3. **Policy.** May this role perform this action on this record, in this state and scope? If not, refuse with `not-your-workspace`, `not-in-scope`, `read-only` or `invalid-state`.
4. **Validation.** Field errors exactly as drawn (BR-122): required reasons on DL-2, duplicates where drawn.
5. **Load inputs → `decide` → `apply`.** The transition, its history events, and any **cross-record side effects** (table below).
6. **`checkInvariants`.**
7. **Commit.** Replace the world (`worldVersion + 1`) and notify subscribers with `{worldVersion, changed: RecordType[]}`. Under option B the snapshot is also written and the notice is broadcast to other tabs.
8. **Return** `{ok: true, receipt, changed}` or `{ok: false, refusal}`. A refusal writes nothing (Slice-1 `access-adapter.test.ts`: "refusals write nothing").

Each command carries a client-minted `commandId`. A repeated id returns the first receipt, so a double click or a retry never acts twice. This matches the drawn "cannot be sent twice" (B1-07 f6 "Submitting"; B1-09 f2 "Signing in") and the future API idempotency key. [PROVISIONAL]

**Cross-record side effects owned by the mock (and later by `apps/api`)**

| Command | Side effects | Never | Evidence |
|---|---|---|---|
| `requests.decide(approve)` on a new institution | Creates INST at the first approval. External → REQ "Approved — payment required". Internal → ACC created and activated, REQ "Access active" | Creates no SACC; sets no requester-chosen internal/external | B1-13 "Four separate events"; B1-11 f9/f11; BR-035, BR-036 |
| `requests.paymentReturned(success)` | ACC created and activated; REQ "Access active"; history | No SACC | B1-08 f8; BR-037 |
| `institutions.pause` / `restore` | INST status; history with reason | Deletes no work; changes no grant | B7-04 f0–f3; BR-046, BR-047 |
| `access.giveAccess` | One SACC per Student × Experiment, or a group grant reaching the current members | No format picking (inherited, LD-1); no licence arithmetic | B2-05 f2–f5, f11; BR-051, BR-053 |
| `submissions.approve` (Reviewer) | SUB → With Content Manager; LO set on the record | Publishes nothing | B6-11 f0 "Approve ≠ Publish"; BR-102 |
| `publication.publish` (CM) | SUB → Published; EXP created and listed with the formats that passed | Changes no INST, ACC, SACC or FCM | B6-11 f6/f8 "Publishing gives no one access"; BC9 |
| `corrections.release` (SA) | UPD Released; EXP live version replaced; history keeps both versions | No ACC/SACC change; never called "Publish" | B7-10 f0; B7-11 f1; BC8, BC9 |
| `operations.approveTransfer` (SA) | DTR Approved; the Student's authorised device for that format changes | No shipping; no decline path | B3-11; B3-07 f6; BR-073 |
| `people.deactivate` (IA) or SA override | PER Inactive; history | Deletes no grant; "can't open" is derived (§5) | B2-06; B7-03; BR-057, BR-062 |
| `roles.withdrawScope` (SA) | Scope withdrawn with a reason; the holder's lists shrink at once | No SUB deleted; a draft in that course becomes "Draft · read-only" (derived) | B7-08; B5-06 f9; BR-099, BR-119 |
| `progress.openResource` (Student) | RES activity: `openedAt` set the first time | No ④, no ⑤, no progress | B3-01 "Opening a resource only marks it 'Opened'"; B4-10 "Opened 12 Oct 2026, 09:40"; BR-066 |
| `runtime.ingest(event)` | Event appended to ④ (with its sample provenance, §2.6 TE-3) | Never accepted when the Student may not run that format at that moment | `1b090c9` `events.ts`; prototype ingestion rule (functional-prototype.json#runtimeContract.ingestionRules) |
| System completion handler (on an accepted `SIMULATION_COMPLETED`, T-12 interim trigger) | CompletionRecord (⑤) written for that Student × Experiment × format if none exists; history | Never from a launch, a resource, time, an assessment or another format; never written by a user-facing command; a later run never walks it back | BC3; B3-12 "The simulation reports completion (the only route)"; `1b090c9` `utilisation.ts`; ARCH §8 |

### 1.5 Query and mutation layer (`apps/web/src/queries`) [PROVISIONAL]

**Keys.** `['xr', sessionKey, recordFamily, view, params]`.

- `sessionKey` = `person:<id>#<nonce>`, or `public:<browser-session-id>` for anonymous visitors.
- One person's cached answers can therefore never show for another (Slice-1 `services/access/queries.ts`).

Examples:

| Query | Key | `meta.deps` |
|---|---|---|
| SA-02 list | `['xr', s, 'REQ', 'list', {status}]` | `REQ`, `INST` |
| SA-03 | `['xr', s, 'REQ', 'decision', id]` | `REQ`, `INST`, `ACC`, `EXP` |
| ST-01 Home | `['xr', s, 'student', 'home']` | `SACC`, `GRP`, `ACC`, `INST`, `PER`, `EXP`, `RUN`, `COMP`, `ASMT`, `ATT` |
| ST-05 / ST-06 hub and resources | `['xr', s, 'student', 'hub', experimentId]` | `SACC`, `ACC`, `INST`, `PER`, `EXP`, `RES`, `RUN`, `COMP` |
| ST-15 Progress | `['xr', s, 'student', 'progress', filters]` | `SACC`, `EXP`, `RUN`, `COMP`, `FB` |
| FA-18 queue | `['xr', s, 'ATT', 'marking-queue']` | `ATT`, `ASMT`, `FCM`, `SACC` |
| FA-21 student detail | `['xr', s, 'student-detail', personId, {experiment}]` | `PER`, `SACC`, `FCM`, `RES`, `RUN`, `COMP`, `ASMT`, `ATT` |
| Sidebar counts | `['xr', s, 'nav-counts']` | Per role: SA → `REQ`; FA → `ATT`; CM → `SUB` |
| Public catalogue | `['xr', s, 'EXP', 'catalogue', filters]` | `EXP`, `CRS`, `AREA` |

`RecordType` = `REQ · INST · ACC · SACC · PER · GRP · FCM · CCODE · RES · RUN · COMP · FB · ASMT · Q · ATT · MRK · DTR · SUB · EXP · LO · UPD · AREA · CRS · ROLE · SUP` (`RES` = resource activity; `COMP` = CompletionRecord ⑤).

**Invalidation.** Every command receipt (and, under option B, every cross-tab broadcast) carries `changed: RecordType[]`. One function runs:

```ts
queryClient.invalidateQueries({ predicate: q => q.meta?.deps?.some(d => changed.includes(d)) })
```

This single mechanism is what makes "a decision in one role's screen is what every other role sees" true (handoff `README.md` "What the build must add"; BC14). It works within a tab, after sign-out and sign-in as another person (both options), and across tabs, each with its own session, only under option B (§2.3, §3). There are no hand-written per-mutation invalidation lists, because those drift.

**Cache lifetime.**

- Sample mode: `staleTime: Infinity`, `refetchOnWindowFocus: false`. Freshness is event-driven, and the world only changes through commands.
- HTTP adapter: finite stale times plus refetch on focus (§8).
- Sign-out or any identity change runs `queryClient.clear()`.
- The QueryClient-per-browser-session pattern of `1b090c9:v2/apps/web/src/app/providers.tsx` is kept; its defaults come from the composition root.

**Commands.** `useCommand(port.method)` wraps `useMutation`.

- Refusals are values, not exceptions. They drive the drawn field errors, the error summary and the read-only states.
- Only `unavailable` is thrown; it drives the drawn "failed + try again".
- There are no optimistic updates. The busy states ("Approving…", "Releasing…") show until the receipt arrives.

### 1.6 Screens [PROVISIONAL]

- A route file only resolves params and renders `features/<ws>/<screen>`.
- A feature uses a view-model hook (e.g. `useRequestDecision(id)`) that returns `{status, view, availableActions, mode: 'decide' | 'read-only' | 'not-available', reason?}`.
- **Copy tables**, not data, turn canonical states into the board words for the viewer's role (§5.4).
- Never copied [CONFIRMED]: board controls ("Restart", "Sample: …"), captions and annotations, `support.js`, fixed-height frame wrappers, and the rejected Slice-1 UI (START-HERE Known exceptions 3, 4, 6).

---

## 2 · Identity and session (no real auth, no DEMO banner, no account selector)

### 2.1 Port

`IdentityPort`:

- `signInWithEmail({email, password})` → `Session` or `Refusal('wrong-details' | 'validation')`
- `startInstitutionSignIn()` → `'unavailable'` in sample mode
- `getSession()`
- `signOut()`
- `session.expiresAt` (not enforced in sample mode, §2.4)

The session holds **only a person id**. Role, workspace, institution and scopes are resolved from world records on every call. This is the Slice-1 identity principle: "person id only; role and institution resolved from records" (inventory §V, quoted in `wf/understand/decisions-rules.json#mockServices`). [PROVISIONAL]

### 2.2 Sign-in behaviour mapped to the drawn frames (B1-09)

| B1-09 frame (caption) | Sample-mode behaviour | Status |
|---|---|---|
| f0 "GL-02 Sign in · 1440 · interactive" | The form as drawn. The canvas's "any input isn't right" ("there is no back end here") is canvas-only (`surface-public-entry.json#canvasOnly`) | CONFIRMED (form) |
| f2 "Signing in" (busy, cannot be sent twice) | Busy until the receipt; `commandId` dedupe | CONFIRMED |
| f3 "Wrong details" (password cleared, e-mail kept, focus to message) | Unknown e-mail, or a password that fails the sample check | CONFIRMED (state) · PROVISIONAL (trigger) |
| f4 "Missing fields" | Field validation | CONFIRMED |
| f5 "Institution sign-in starting" / f6 "Institution sign-in unavailable" | Recommended: the drawn sequence. f0 shows "Sign in with your institution" (stakeholder-confirmed, BR-008); pressing it shows f5 "Hands over to the institution's sign-in (provider OPEN, T-10)", then f6 (e-mail sign-in as the state, "no dead button"), because no provider exists in sample mode. Alternative for the owner: render f6 permanently, which hides the confirmed institution entry | CONFIRMED (f0 entry, BR-008) · PROVISIONAL (sequence, AD-03) |
| f7 "Account inactive → after sign-in" | Signs in and lands on Home with the XS-08 inactive banner | CONFIRMED |
| f8 "Institution paused → after sign-in" | Signs in and lands on Home with the paused banner | CONFIRMED |
| f9 "Session expired" (return address kept and shown) | `/sign-in?returnTo=…&notice=expired` | CONFIRMED (state) · UNRESOLVED (policy QT-13, AD-21) |
| f10 "Signed out" (confirmation only) | XS-03 is a notice on the sign-in page, not a separate page | CONFIRMED (board); the `screens.json` route `/signed-out` is a handoff defect (§10) |

**Credential check.** No secret is stored and nothing is hashed. Two options (AD-03):

- (a) a known sample e-mail plus any non-empty password signs in;
- (b) one published, non-secret sample password per seed, documented in the developer README.

(a) is recommended. Either way, f3 stays reachable with an unknown e-mail. [PROVISIONAL]

**Who can sign in.** In the mock, every PER or ROLE holder in the world that has an e-mail can sign in. That includes an Institute Admin assigned on SA-07 during Flow A/B and a Student added on IA-10. Identity origin and activation are open (T-11; "Nothing is sent from here", B7-03), and no invitation or activation UI is drawn. [PROVISIONAL, AD-29]

**Landing.** Each person lands on their role's base route: `/student`, `/faculty`, `/institute`, `/vendor`, `/reviewer`, `/content-manager`, `/admin` (`navigation.json` `baseRoute`; BR-008). [CONFIRMED]

### 2.3 Session storage and moving between roles

- **Storage.**
  - Option A (default, §3): the session `{personId, nonce, signedInAt}` is held in memory next to that tab's world. A reload returns the tab to the spine-start world, signed out.
  - Option B (only if AD-07 authorises it): the session lives **per tab** in `sessionStorage` (`xr.session.v1`), and the world lives once per browser.
- **Moving between roles.** A reviewer has these ways:
  - **Same tab (both options):** sign out, then sign in as another sample person. The query cache is cleared, and the new person sees every change the previous one made.
  - **Second tab (option B only):** open a new tab and sign in there. Both tabs read one world, and BroadcastChannel keeps them current. The reviewer can watch the Student view update while acting as Super Admin, with no switcher. Under option A a second tab starts its own spine-start world.
- **Per-tab consequences, stated and accepted for sample mode (AD-07)** [PROVISIONAL]:
  - Tabs the product itself opens do not rely on a session (under option A they have none, and under option B whether one is copied depends on the browser): resources open in a new tab (ST-06, B3-01 "Opened in a new tab just now"), and so does the simulation (B3-03 f0 "opened in a new tab"). Neither needs one. A resource tab only shows the resource. The WEB stand-in tab identifies the run by an opaque launch nonce that `progress.launchFormat` hands over in its URL. The launching tab's adapter keeps the nonce → (person, experiment, format) mapping in memory; it is not a world record and not activity. The stand-in posts its events back to that tab over a `BroadcastChannel` (a message channel, not storage). No personal data goes in the URL.
  - A deep link opened in a new tab asks for sign-in again (and, under option A, starts from the spine-start world).
  - The selection basket (SEL) and the PU-10 ticket live in `sessionStorage` (§3.2). Whether a new tab inherits them is browser-dependent, so a selection made in one tab may be missing in a tab opened from the catalogue. B1-06 says "browser session". The per-tab reading is a narrower sample-mode implementation, and AD-07 records it.
- **Sample accounts list.** It goes in the developer README and the test fixtures, **never in product UI**. There is no account chooser, no "Viewing as…", no workspace chooser and no DEMO strip (BR-006; B8-03 "Sign in looks like a product"; XS-02 DEFER; inventory C.2 "There is no demo strip"). [CONFIRMED]
- **Scope of per-tab sessions.** Sample mode only. A real browser session (cookie or BFF, E-02) would be shared by all tabs. [PROVISIONAL, AD-07]

### 2.4 Account menu, sign-out, expiry, banners

- **XS-05 account menu** (board 05): name · workspace · institution (if any) · "My device" (Students with AR/VR/MR only, B3-07 f1/f2) · Help · separator · Sign out. It is a disclosure pattern, not `role=menu` (`visual-system.json#a11yRules` A-ACCT). [CONFIRMED]
- **Sign out:** `identity.signOut()` → `queryClient.clear()` → `/sign-in` with the "Signed out" notice (B1-09 f10). [CONFIRMED]
- **Expiry:** none automatic in sample mode, because the session policy is open (QT-13). CI tests force expiry through the test-hook clock to show f9; a hosted build never shows f9 live (§2.5). [PROVISIONAL]
- **XS-08 banners** come from read models (board 05 template). [CONFIRMED]
  - `institution.status = paused` → "Your institution's access is paused — your work is kept."
  - `person.status = inactive` → "Your account is inactive. Contact your institution administrator."

### 2.5 Test identity (test-only, never product UI) [PROVISIONAL]

- **Vitest:** `renderScreen(ui, { world: buildWorld(spineStart, [...commands]), as: 'rahul.verma' })` builds an in-memory `SamplePlatform` with a manual clock and an injected session.
- **Playwright:** a fixture `signInAs(page, 'arjun.mehta')`. Flow tests drive XS-01 for real at least once per role. Other tests set the session and load a fixture world through the CI-only test-hook bridge before navigation.
- **Cross-role tests:** under option A, one page signs out and signs in as the next role, which is the default product path. Under option B, two pages in one `BrowserContext` also share `localStorage` and BroadcastChannel but have separate `sessionStorage`: act as role A on one page and assert that role B's page updates.
- **Test hooks** (load a fixture world, advance the clock, set the next payment outcome, emit runtime events including `SIMULATION_COMPLETED`, inject faults) are compiled in only when the build flag `NEXT_PUBLIC_XR_TEST_HOOKS=1` is set. **The rule:** the flag is set only for CI/Playwright builds and **never for any hosted build, owner or reviewer sample builds included**. It is declared in turbo strict env and recorded as TE-7. [PROVISIONAL, AD-10]
- **Consequence: drawn states a hosted sample build cannot reach in a live walk** (they stay reachable in CI tests and fixtures):
  - C2c WEB "Completed" and C2d VR "Completed". The WEB stand-in never emits completion (TE-3), and the headset formats have no stand-in outside CI.
  - Feedback C3, since it needs Completed.
  - B1-08 f6 "Payment not confirmed" and f7 "Payment failed" (TE-4 returns "confirmed" in hosted builds).
  - "Result ready" for an assessment released "After the deadline" or "On a date", until the sample clock passes that date in real elapsed time (§3.5).
  - Every drawn failed / retry frame (fault injection is test-only, §7.4).

  If the owner wants reviewers to see these live, the alternative is an owner-authorised exception for reviewer-build controls (AD-40). It must name who triggers them (never the signed-in Student) and keep them outside product chrome. [PROVISIONAL]

### 2.6 Exceptions to record before building (`1b090c9:v2/docs/ARCHITECTURE.md`)

The plan conflicts with these committed or drawn statements:

- ARCH §14: "Configuration is data supplied at boot, never prototype flags scattered through code: no scenario selector, no demo clock, no stand-in controls in V2".
- ARCH §10: "No authentication is implemented and none is faked".
- ARCH §3/§4: "no business rule in apps/web"; ARCH §4: "Public discovery before login (STK31-16), server-rendered".
- FUNCTIONAL_PARITY_MATRIX §G excludes the "In-page stand-in completion control on the Student's run screen", the "`DEMO CONTROL` runtime-event simulators and the demo expiry clock", the "Payment simulation screen" and the "`localStorage` namespace and schema-version chain".
- The committed `RUNTIME_SOURCES` deliberately excludes `platform-standin`, `demo-runtime-simulator` and `web-prototype-runtime` (`1b090c9:v2/packages/domain/src/runtime/events.ts`).
- `1b090c9:v2/packages/config/src/env/index.ts`: "nothing in V2 reads `process.env` ad hoc, and there are no prototype flags"; `webPublicEnvSchema` has only `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_APP_ENV`.
- B8-06 "Mock services": "Real auth, payment, XR runtimes, grading automation and persistence stay out until decided".

| Id | Exception | Fence | Removal trigger | Status |
|---|---|---|---|---|
| TE-1 | Sample sign-in on XS-01 against sample-world accounts (replaces Slice-1 CF-01) | No tokens, no secrets; no switcher or chooser in product; session person id only | Identity provider decided (T-10/A-01) and OIDC relying party built (E-02) | PROVISIONAL |
| TE-2 | Typed mock services evaluating `@xr/domain` rules in the browser (generalises Slice-1 CF-02) | Only in `@xr/sample-platform`; imported only by the composition root | `apps/api` serves every port and the contract suite is green against HTTP | PROVISIONAL |
| TE-3 | **Runtime stand-in, activity only.** (1) WEB: the sample runtime route `(sample-runtime)/runtime/web` (§1.2, §6.1), opened by "Launch WEB" in a new tab. It emits only `SIMULATION_LAUNCHED`, `SESSION_STARTED` and `SESSION_ENDED`. It has **no completion control, no timer-based completion and no product chrome**, and no developer or demo wording (B8-03 "Developer / demo wording 0"). Its minimal neutral content is an owner decision. (2) `SIMULATION_COMPLETED` for any format, and every headset-format event, comes only from seed fixtures and CI-only test hooks (§2.5), never from a page the signed-in Student operates. (3) The domain enum and the wire schema keep the production source ids unchanged. Every stand-in or fixture event also carries a **sample-only provenance** (`origin: 'sample-standin' \| 'sample-fixture'`) inside the `@xr/sample-platform` envelope, so it is never indistinguishable from runtime traffic (FPM P-12 "stand-ins never presented as device traffic") | The route renders `notFound()` unless the data source is `sample`; it is not linked from product navigation, only from the "Launch WEB" URL; it reaches the runtime port only through `PlatformProvider`. Never a Student completion control anywhere (BC3; B3-03 f3 "No “I have finished” button"; FPM §G) | A real web runtime or native clients post to the ingestion API | PROVISIONAL (AD-05) · completion mechanism UNRESOLVED (T-12) |
| TE-4 | Payment outcome stand-in on PU-12: "confirmed" in hosted builds; "not confirmed" and "failed" only through CI test hooks or fixtures | Provider-neutral step as drawn (B1-08 f5); no amount, no method; no "mark paid" control | Payment provider decided (T-05/R06) | PROVISIONAL (AD-06) |
| TE-5 | Sample clock anchored to a sample "today" (§3.5); time travel only through CI test hooks | No app-visible clock or date control | Real backend time | PROVISIONAL (AD-09) |
| TE-6 | Browser persistence of the sample world (option B: versioned `localStorage` snapshot, schema version, reseed, BroadcastChannel, Web Locks). **Recorded only if the owner authorises AD-07.** Until then option A applies and nothing is written to browser storage except the board-drawn selection basket and request ticket (§3.2) | Only in `@xr/sample-platform`'s persistence driver; no product notice; no "demo" naming | `apps/api` persistence serves every port (PostgreSQL migrations replace the chain, FPM §G) | PROVISIONAL (AD-07) |
| TE-7 | Two new public build flags in `webPublicEnvSchema`: `NEXT_PUBLIC_XR_DATA_SOURCE = sample \| api` (data supplied at boot) and `NEXT_PUBLIC_XR_TEST_HOOKS` (CI/Playwright builds only, never any hosted build) | Read once through `@xr/config/env`; declared in turbo strict env; never read ad hoc | Data source fixed to `api` and test hooks re-pointed to API seed endpoints in test environments (§8 item 9) | PROVISIONAL (AD-10, AD-11) |
| TE-8 | Public discovery renders on the client in sample mode, because the world exists only in the browser | Same routes and markup as the server-rendered target; no client-only URL shapes | HTTP adapter callable from server components (§8 item 8) | PROVISIONAL (AD-12) |

"Draft with assistance" (FA-16) returns canned sample drafts from the questions port. This falls under TE-2: no provider is named, every draft is tagged "Draft — needs your review", and nothing enters the bank until Faculty add it (BR-084, PROVISIONAL). Stakeholder STK31-33 asks for an uploaded source document, which v46 does not draw (OD-B4-12). Flagged as AD-41; built per v46 in the meantime. [PROVISIONAL]

---

## 3 · Persistence of the sample world

### 3.1 Options

| Option | Cross-role coherence | Survives reload | Fits "no backend persistence" (BC10) and B8-06 "persistence stay out until decided" | Fits "apps/web is not the business backend" (ARCH §3) | Cost / risks | Verdict |
|---|---|---|---|---|---|---|
| A · In-memory, per tab | One world per tab, shared by every role signed in there (sign-out and sign-in). The WEB stand-in tab reports to the launching tab over a message channel (§2.3), not through storage | No: a reload returns to spine-start, so Flows A–F must be re-walked from Flow A | Yes, both | Yes (with TE-2) | Lowest; reviewers lose the walk on refresh; no multi-tab review | **Default until the owner decides AD-07** |
| B · Versioned `localStorage` snapshot + BroadcastChannel (+ Web Locks) | All tabs of one browser stay coherent | Yes | BC10 literally yes (browser storage only, no server or database), but it **conflicts with B8-06** "persistence stay out until decided" and with FUNCTIONAL_PARITY_MATRIX §G ("`localStorage` namespace and schema-version chain"). Needs owner authorisation and TE-6 | Yes (with TE-2) | Medium: schema version, integrity gate and memory fallback, all proven in the Slice-1 `world-store.ts` pattern. Per browser, not shared between reviewers. Quota fine (the world is small) | **Recommended to the owner as an authorised upgrade** (AD-07); built behind the pluggable persistence driver only after a yes |
| C · Server-side in-memory world in Next route handlers | Shared across browsers and devices | Lost on server restart; serverless instances do not share memory | Borderline: a backend in `apps/web` | **No**: it makes Next the business backend (ARCH §3) | High: invents REST paths now; flaky on serverless | Reject |
| D · MSW (service-worker interception) over an HTTP adapter | Depends on the storage behind MSW: worker memory dies with the worker, so it needs IndexedDB | With IndexedDB | BC10 yes; with IndexedDB it raises the same B8-06 / FPM §G question as B | Yes | High: invents endpoints and payloads before the API exists (D25 "No API client, endpoint or payload is invented"); service-worker lifecycle in dev and tests | Defer (maybe later, for HTTP-adapter tests) |

### 3.2 Mechanics [PROVISIONAL]

**Default (option A).** `@xr/sample-platform`'s persistence driver is `memory`. The world `{schema: 'xr.sample-world', version, seedId, worldVersion, anchor, seededAtReal, records, history, idSource, runtimeEvents, processedCommandIds}` is built from the seed when the tab starts and lives only in that tab's memory. Nothing is written to `localStorage` or IndexedDB. No "demo" wording anywhere (B8-03 "Developer / demo wording 0").

**Owner-authorised upgrade (option B, TE-6, only after AD-07).**

- **Key and envelope.** `xr.sample-world.v1` holds the same envelope.
- **Codec.** A zod codec in `@xr/sample-platform`, which is allowed there but not in `@xr/domain`. Integrity runs through domain invariants before stored data is trusted. Unreadable, incompatible or inconsistent data → reseed. No product notice is shown, because none is drawn; sample builds log to the console and tests assert. The Slice-1 `world-store.ts` raised viewer notices with developer wording; those must not reach product chrome.
- **Cross-tab.**
  - `BroadcastChannel('xr.sample-world')` posts `{worldVersion, changed}`; the `storage` event is the fallback.
  - Writers serialise with `navigator.locks.request('xr.sample-world', …)`, falling back to compare-and-swap on `worldVersion` (§1.4).
- **Memory fallback.** When storage throws (private mode, quota), the world stays in memory for that tab. No product notice.

**What lives where:**

| Data | Store | Why |
|---|---|---|
| Shared records (REQ, INST, ACC, SACC, PER, GRP, FCM, CCODE, RES activity, RUN events, COMP (CompletionRecord), FB, ASMT, Q, ATT, MRK, DTR, SUB, EXP, LO, UPD, AREA, CRS, ROLE, SUP) | Option A: the tab's in-memory world. Option B: the `localStorage` world | One connected state (BC14) |
| Session (person id) | Option A: memory, per tab. Option B: `sessionStorage`, per tab | §2.3 |
| Selection basket (SEL) | `sessionStorage` (both options) | B1-06: "The selection lives in the visitor's browser session until the request is sent; it does not depend on an account" [CONFIRMED, board-drawn behaviour, not a persistence decision]. Per-tab caveat in §2.3 |
| Requester status ticket for PU-10 | `sessionStorage` (both options) | B1-07 "continues from this session"; the reference is not a key (§6.4). Under option A a reload resets the world, so a held ticket no longer resolves and PU-10 renders the public not-found pattern |
| Unsaved wizard and form drafts (PU-08, IA-05, FA-07, VE-03…06 before the first save) | Option A: memory, keyed by flow (browser Back inside the app keeps them). Option B: `sessionStorage`, keyed by flow | "Back never loses work" (AR-5, `surface-vendor.json#openQuestions`); not a business record |

### 3.3 Deterministic seed [PROVISIONAL, AD-08]

- **Content of the sample world (T-36)** (`decisions-rules.json#mockServices` "Sample world (T-36)"; B2-00 "Sample world"):
  - Platform side, present from the start: BITS Pilani — Hyderabad Campus; course ME ZG523 Thermodynamics & Heat Transfer; Shell-and-Tube Heat Exchanger; Anil Shetty / Northline Simulation Studio (Vendor), Prof. A. Menon (Academic Reviewer), Kavya Nair (Content Manager), Arjun Mehta (Super Admin).
  - The extra institutions drawn on B1-10 and B7-02 (Krishna, Konark, Vizag, Sahyadri, Deccan, Malnad …), with their own requests and plans.
  - Godavari Institute of Technology and everything under it, which **the walk creates** (below).
- **"Spine-start" seed (hosted builds start here).** Background records are in steady state, so platform lists are never empty. **Nothing that depends on Godavari exists yet**, because B1-13 says the institution record is "created at the first approval of a new institution" and B2-00 says "Godavari Institute of Technology — new institution created by approving REQ-0042". So none of these exist:
  - INST Godavari and its access plan ACC-0107;
  - the Institute Admin Meera Iyer as a person (she exists only as the contact named on the request she will send);
  - the 12 students "imported on 8 Oct 2026" (Rahul Verma GIT-2026-0418, Priya Natarajan, Arun Kumar, Sneha Reddy (inactive) …);
  - the Faculty (Dr S. Ranganathan, Dr Anita Desai, Prof. Ravi Shankar (inactive)), the group ME ZG523 — Sem II (GRP-0012), the Faculty course mapping and Godavari's code MEC-523;
  - every SACC, ASMT, ATT, DTR, RES activity, RUN event, CompletionRecord and FB of Godavari people.

  Each platform flow's own record is at its **pre-flow** state too:
  - REQ-0042 does not exist. The background requests drawn on B1-10 exist, with REQ-0038 and REQ-0040 under review, so the SA count reads 2 before A2 and 3 after it (B1-10 f0; B7-00).
  - Distillation Column is live at 1.2 with no open update. Background updates UPD-0001…0004 exist (e.g. UPD-0004 on hold, UPD-0003 released, B6-00).
  - SUB-0077 does not exist. Background submissions (e.g. SUB-0070, 0071, 0074, 0079, 0081, 0083, 0085, 0086 on B5/B6) exist. "Composite Wall Conduction" is published (WEB + AR) as a separate record (BC11).
- **Scripted walk (tests and fixtures).** The walk is a list of commands on a manual clock. It reproduces the board dates and **reserves each board reference explicitly**. The steps run in board-date order: Flow E (August) and Flow F run on the platform side, and Flow A → B → setup → C → D and the device chain run on the Godavari side. The dates conflict across batches (Timeline, below). Steps that `flows.json` does not trace are marked *untraced*:

  | Walk step | Command (actor) | Board date / evidence | Traced in `flows.json`? |
  |---|---|---|---|
  | A1–A4 | selection → `requests.submitRequest` (REQ-0042) → `requests.decide` (INST Godavari created) → payment → ACC-0107 active | 2 Oct, 5 Oct, 8 Oct 11:20, 8 Oct 15:05 (B1-13) | Yes |
  | B1 | `institutions.assignInstituteAdmin` (Meera Iyer) | B7-03 | Yes |
  | S1 | `people.importStudents` (12 students) | "imported on 8 Oct 2026" (B2-00) | *untraced* |
  | S2 | `people.deactivate` (Sneha Reddy) | B2-00 "(inactive)" | *untraced* |
  | S3 | `people.addFaculty` ×3; `people.deactivate` (Prof. Ravi Shankar) | B2-00 | *untraced* |
  | S4 | `people.assignCourse` (Dr S. Ranganathan → ME ZG523, FMAP-0021) | B2-09 | *untraced* |
  | S5 | `groups.create` ME ZG523 — Sem II (GRP-0012, 7 members incl. Rahul) | B2-08; B2-13 f0 "his group has no grant yet" (the group exists, ungranted, on 9 Oct) | *untraced* |
  | S6 | `people.saveCourseCode` MEC-523 | B2-00 "once Meera adds it"; date not drawn | *untraced* |
  | B3–B4 | `access.giveAccess` → SACC-0310 | 9 Oct 2026, 10:20 (B2-00) | Yes |
  | S7 | Rahul's authorised VR device | B3-07 "Authorised device VR … ME lab VR headset". No command draws how a device is first authorised, so the walk sets it as a seeded value (gap, reported) | *untraced*, not designed |
  | C, D, Device | as §4.4, §4.5, §4.8 (completion events come from fixtures only, TE-3) | 12 Oct … 14 Nov | Yes |

- **"Later sample" fixture (12 Oct), applied after Flow B and never part of the spine-start seed.**
  - `access.giveAccess(group ME ZG523 — Sem II)` creates SACC-0311 through the real command (B2-04 "Later sample · 12 Oct 2026").
  - SACC-0312 is given and then withdrawn through the real `giveAccess` and `withdrawGrant` commands (B2-00 "SACC-0312 withdrawn").
  - The only seeded values are the "Waiting for a licence" states (Arun Kumar under SACC-0311; SACC-0313 / 0314; B3-03 f6 "Waiting for a licence · Arun Kumar (later sample)"; B2-04), because no rule may produce them (T-06/D7).
  - This keeps B2-13 f0–f3 true: on 9 Oct, withdrawing SACC-0310 ends Rahul's access because "his group has no grant yet". [PROVISIONAL, AD-17/AD-18]
- **Ids.** One id source per prefix (`REQ`, `INST`, `ACC`, `SACC`, `GRP`, `ASMT`, `Q`, `ATT`, `DTR`, `SUB`, `UPD`, `SUP`), formatted "Prefix + four digits" (B8-03).
  - The scripted walk and the fixtures reserve explicitly every board reference they create, for example REQ-0042, REQ-0058 (sent from IA-17 on 21 Oct, B3-08; B7-00), SACC-0310…0314, ASMT-0009, ATT-0450, DTR-0018, SUB-0077 and UPD-0005. Background records keep their drawn ids (e.g. SUB-0079…0086, UPD-0006/0007, DTR-0019, ATT-0451, wherever the boards place them).
  - Otherwise the id source returns the next free id above a per-prefix floor and skips every existing id.
  - Plain counters would be wrong, because the boards show background and later records with ids above the flow ids (census across the boards: REQ-0058, SUB-0079…0086, UPD-0006/0007, DTR-0019, ATT-0451, SACC-0312…0314). A counter that starts at 0042 would give the IA-17 request REQ-0043, not REQ-0058.
  - A live walk outside the script (a hosted reviewer) may produce other ids. Routes use opaque internal ids; references are display data (§6.4).
- **Test fixtures.** Built by replaying commands from the spine-start seed (`afterFlow('B')`, `laterSample()`), so every fixture state is reachable through legitimate transitions, except the seeded D7 waiting values. The Slice-1 `seed.ts` edge cases (inactive student, other-institution student) are re-expressed as command scripts (repo-baseline.json#slice1 `seed.ts`: "edge cases … as test fixtures only").
- **Timeline.** Board dates disagree across batches: OD-B6-12, OD-B7-08, OD-B7-14, OD-B7-15, OD-B4-16. SUB-0077 was published on 28 Aug while the October catalogue lists 12 experiments; the SA world is dated 23 Oct; the deadline is 14 Nov. The owner picks one anchor date and confirms the steady-state records against it (AD-08). [UNRESOLVED — sample data only, no product effect]

### 3.4 Determinism rules [PROVISIONAL]

- The seed is a pure function `seed(anchor)`.
- There is no `Math.random()` in the mock. Record ids come from the per-prefix id source (reservations, then the next free id above a floor, §3.3). `commandId`s, session nonces and launch nonces come from an injected id source.
- History timestamps come from the clock port.

### 3.5 Clock [PROVISIONAL, AD-09]

- **`Clock` port:** `now(): Instant`. It is injected into `@xr/sample-platform` and passed to every `decide` and every derivation.
- **Sample clock:** `now = anchor + (realNow − seededAtReal)`. Dates move naturally and the world stays coherent. Nothing in the product shows or sets the clock (TE-5; ARCH §14 "no demo clock").
- **Time-based states are derived at read time, never scheduled.** This matches ARCH §8: "access-term state … derived, never stored as truth". [CONFIRMED principle]
  - ACC "Ending soon" / "Reminder due" (≤ 15 days, B7-09; T-31 "nothing is sent")
  - ACC "Access ended"
  - ATT "Result ready" (release "after the deadline" or "on a date", BR-079)
  - "Inactive for N days" (BR-091)
- **Consequence for reviewers.** With ASMT-0009's own release setting "After the deadline" (sample 14 Nov 2026 23:59), a Flow D walk ends at "Result not released yet", which is correct (B4-11 f3). The setting is this assessment's own sample value, never a default (BC6; BR-076; B4-06 "New draft · nothing pre-filled"). Seeing "Result ready" needs an assessment whose own setting is "Immediately after marking", or the sample clock passing the deadline in real elapsed time. A clock advance is available only through CI test hooks (§2.5). [PROVISIONAL]

### 3.6 Reset

- No reset in product UI. Board controls such as "Restart" are not product features (START-HERE Known exception 4). [CONFIRMED]
- Reset through the CI test hook (§2.5); in a hosted build, by reloading the tab (option A) or by clearing site data (option B), as documented in the developer README. [PROVISIONAL]

---

## 4 · Cross-role flows on one shared state

### 4.0 The owner's Flows 1–6 and the `flows.json` letters (added at assembly)

The continuity boards are titled Flow 1–6 (board `<title>`s re-read at assembly), while `flows.json`, B8-04 and this appendix use the letters A–F plus "Device". The 27 `flows.json` steps (A 4 · B 4 · C 3 · D 4 · E 5 · F 4 · Device 3) and the drawn alternates are the test units of the plan (Appendix F WP-0.14).

| Owner / board flow | `flows.json` | Steps (test units) | Continuity boards |
|---|---|---|---|
| Flow 1 — public discovery → request → decision → active access | A | A1–A4 (+ the drawn "Request more information" alternate, not traced in `flows.json`) | B1-13 "Flow-1 Continuity Review" (REQ-0042 → ACC-0107); B1-01…B1-11 |
| Flow 2 — campus distribution | B | B1–B4, + B5 withdraw (alternate) | B2-13 "Flow-2 Continuity" (ACC-0107 → SACC-0310) |
| Flow 3 — Student learning, per-format feedback, device chain | C + Device | C1–C3; Dv1–Dv3 | B3-12 "Flow-3 Continuity" |
| Flow 4 — assessment across Faculty and Student | D | D1–D4 (D4: result released by the assessment's own setting; HB-01) | B4-14 "Flow-4 Continuity" (ASMT-0009 / ATT-0450) |
| Flow 5 — first publication | E | Board steps 1–3 ↔ E1–E2 (including revise and resubmit); step 4 ↔ E3; step 5 ↔ E4; step 6 ↔ E5; + E-alt1…3 (Content Manager send-backs, Super Admin override) | B5-08 "Flow 5 · First publication, steps 1–3 (Vendor side)"; B6-12 "steps 4–6" |
| Flow 6 — corrected version → Release / Hold | F | F1–F4, + F-alt (withdraw, return), Hold / Lift hold | B6-13 "Flow 6 · Corrected version, steps 1–2"; B7-11 "Flow 6 — Release and Hold" |

### 4.1 Ports used in the sequence tables [PROVISIONAL names]

B8-06 "Mock services" names 14 services: requests, institutions, access, people, progress, feedback, assessments, marking, submissions, publication, corrections, structure, roles, operations. This design keeps those 14 and adds four:

- **identity** — §2;
- **catalogue** — public reads composed from publication + structure;
- **selection** — browser-session only, not a world record;
- **runtime** — ingestion, used only by the stand-in route, fixtures and CI test hooks.

| Port | Representative methods (actor never a parameter; every command returns `{ok, receipt, changed}` or a refusal) |
|---|---|
| identity | `signInWithEmail` · `startInstitutionSignIn` · `getSession` · `signOut` |
| catalogue | `listAreas` · `getArea` · `getCourse` · `listExperiments(filters)` · `getExperiment` |
| selection | `add(experimentId, formats)` · `changeFormats` · `remove` · `undo` · `get` |
| requests | `submitRequest` · `getRequestStatus(ticket)` · `listRequests` · `getDecision` · `decide` · `startPayment` · `paymentReturned` (stand-in, TE-4) · `requestRenewal` · `requestMoreLicences` · `listInstitutionRequests` |
| institutions | `listInstitutions` · `getInstitution` · `assignInstituteAdmin` · `pause` · `restore` · `overrideStudentStatus` · `getContentAccess` · `getAccessPlan` · `listAccessEnding` |
| access | `getGiveAccessOptions` · `previewGrants` · `giveAccess` · `listStudentAccess` · `withdrawGrant` |
| people | `listStudents` · `getStudent` · `addStudent` · `importStudents` · `addFaculty` · `deactivate` · `reactivate` · groups (`create` / `rename` / `addMembers` / `removeMember`) · `assignCourse` · `removeCourse` · `saveCourseCode` |
| progress | `getStudentHome` · `listMyCourses` · `getExperimentHub` · `listResources` · `openResource` · `getFormat` · `launchFormat` · `getMyProgress` · `getUsage` (IA) · `listStudentsProgress` / `getStudentDetail` (FA) |
| runtime | `ingest(event)`: the WEB stand-in route (launch and session events only), seed fixtures and CI test hooks (TE-3). The system completion handler runs inside the adapter on an accepted completion signal; it is not a port method any screen can call |
| feedback | `getFeedbackEntry(exp, format)` · `submitFeedback` |
| assessments | Faculty authoring (`createAssessment`, `saveSettings`, question add / remove / reorder, `useUpdatedVersion`, question bank, `requestDrafts`, `importQuestions`) · Student (`listMyAssessments`, `getIntro`, `startAttempt`, `saveAnswer`, `submitAttempt`, `getResult`) |
| marking | `listQueue` · `getAttemptForMarking` · `saveMark` · `confirmMarks` · `listSubmissions` |
| submissions | `saveDraft` · `submitForReview` · `resubmit` · `getRecord` · Reviewer `listQueue` / `listReviewedByMe` / `getForReview` / `approve` / `returnToVendor` |
| publication | `listReadyToPublish` · `getDecision` · `publish` · `sendBack` · `listLibrary` · `getPublishedExperiment` |
| corrections | `openDraft(exp, entry)` · `saveDraft` · `sendForReview` · `withdraw` · `approveUpdate` · `returnUpdate` · `listForRelease` · `release` · `hold` · `liftHold` |
| structure | `getStructure` · `addArea` · `addCourse` · `rename` · `editDescription` · `moveCourse` · `listPlatformCodes` · `savePlatformCodes` |
| roles | `listHolders` · `getHolder` · `registerHolder` · `assignScope` · `withdrawScope` · `restoreScope` |
| operations | `requestDeviceTransfer` · `forwardDeviceTransfer` · `approveDeviceTransfer` · lists and detail · `reportProblem` · `listMyReports` · `resolveReport` · `reopenReport` · `getOverview` · `listAllContent` · `overrideStuckRecord` |

**Shared column legend**

- **Others now see** — what changes after the step for every other role, with screen ids. Everything in it is a read model recomputed from the one world after the receipt's `changed` types trigger invalidation (§1.5).
- **Invariant** — what the mock refuses, or what `checkInvariants` asserts.

The evidence is `flows.json` (27 steps, equal to B8-04 with 0 differences: `handoff-consistency.json#flowDiffs`), the flow boards, and `crossRoleTouchpoints` in the seven `surface-*.json` files. A step's status is CONFIRMED when the board evidence is direct, and PROVISIONAL when only the port and method naming is new. When a row rests on a business rule that `decisions-rules.json` marks PROVISIONAL, its status names that rule. When a row follows v46 against a recorded stakeholder position, its status reads "conflict flagged (AD-nn)". Such a row is built per v46 until the owner decides; the conflict is not resolved here.

### 4.2 Flow A — public discovery → request → Super Admin decision → institution next state

| # | Role | Screen | Command | Record + transition | Others now see | Invariant | Status |
|---|---|---|---|---|---|---|---|
| A1 | Public visitor | PU-01 → PU-04 → PU-06 → PU-07 | `catalogue.*` reads · `selection.add(exp, formats)` | SEL: — → selection (n). Kept in sessionStorage; not a world record | Nobody: SEL is not shared (B1-06 "Persistence") | Availability ("Available in") is never an entitlement (BR-027). Not a cart: no prices, no "Buy" (BR-030) | CONFIRMED · conflict flagged: 07.2-A asks to show the existing plan and "request additional licences" on reselect; v46 waits on T-01 (AD-43) |
| A2 | Institution contact | PU-07 → PU-08 (details → review) → PU-09 | `requests.submitRequest({institution, contact, experiments×formats, licences, term})` → `{reference, statusTicket}` | REQ-0042: — → Under review. The requester's label is "Submitted" until the "BITS started reviewing" event (B1-13 timeline) | SA-02 row "Under review", "Internal or external: Not set yet"; SA nav count 2 → 3 (B1-10 f0 "Nav count 3 = requests under review"; B7-00 "3 under review — REQ-0042, REQ-0040, REQ-0038"); SA-01 Requests group | No internal/external choice, payment detail or price asked (BR-031). The reference is shown but is not a key (B1-07 "Sent"). SEL cleared on send | CONFIRMED (drawn) · PROVISIONAL (BR-031; requester identity T-01/R01 open) · UNRESOLVED (review-started trigger, AD-14) |
| A3 | Super Admin | SA-02 → SA-03 | `requests.decide(req, {approve, route})` · `{approveSmaller, formats, licences, term, reason}` · `{requestInformation, reason}` | REQ: Under review → Approved — payment required (external) / Access active (internal) / Information requested. INST created at the first approval ("Approved — payment required", no plan). Internal route: an access plan is created and activated at approval (sample REQ-0039, B1-08 f9 "History shows approval followed directly by activation"). For REQ-0042 (external), ACC-0107 is created only in A4 | Requester PU-10: "Continue to payment" (B1-08 f0) / "What BITS asked", no reply (f3) / "Approved with changes" with the difference and the reason (f4). SA-06 new INST row (B7-02). Internal: PU-10 "Access active" → PU-13 | No Decline (T-02). Route required for a new institution (B1-11 f7). A smaller scope needs a real difference and a reason (f8). A paused institution's requests can't be decided (f14). A renewal's scope is not adjustable (f13). Approval ≠ payment ≠ activation (BR-036). No SACC created | CONFIRMED (v46) · conflict flagged: STK31-21/24 (SA creates tenants and allocates content directly) vs T-09 (institutions only from an approved request) (AD-37) |
| A4 | Institution contact | PU-10 → PU-12 → PU-10 / PU-13 | `requests.startPayment(ticket)` → payment stand-in → `requests.paymentReturned(ticket, outcome)` | REQ: Approved — payment required → Access active (success) · Payment not confirmed ("Check again", B1-08 f6) · Payment failed ("Try payment again", f7). On success ACC-0107 is created and active ("Access active 8 Oct 2026, 15:05 · Access plan ACC-0107", B1-13) | SA-03 four events in history (B1-11 f10). SA-06/SA-07 INST Access active plus the "No Institute Admin" notice (B7-03). PU-13 "Sign in" for the institution administrator (B1-08 f8) | Only success activates. No "mark paid" (BR-037). Activation grants no Student access (BR-026) | CONFIRMED (states) · PROVISIONAL (BR-037; stand-in, TE-4; f6/f7 reachable only in CI, §2.5) |

### 4.3 Flow B — campus distribution (institution access → Institute Admin → Student access)

| # | Role | Screen | Command | Record + transition | Others now see | Invariant | Status |
|---|---|---|---|---|---|---|---|
| B1 | Super Admin | SA-06 → SA-07 "Assign Institute Admin" (form dialog) | `institutions.assignInstituteAdmin(inst, {name, workEmail})` | INST: no Institute Admin → assigned; a PER (Institute Admin) record created | That person can sign in (TE-1) and lands on IA-01. The SA-07 notice and the SA-01 "no Institute Admin" row clear. Student device requests can now be forwarded (B3-07 f7) | Offered only when access is active, ending soon or paused (OD-B7-11). "Nothing is sent from here (T-11)" (B7-03) | CONFIRMED · PROVISIONAL (sign-in of the new account, AD-29) |
| B2 | Institute Admin | IA-01 → IA-02 → IA-03 | `institutions.getContentAccess` · `getAccessPlan` (reads) | ACC-0107 Access active, read-only for the IA | — | Content access ≠ Student access (BR-026). No plan amendment (T-08). Licence figures as provided (T-06) | CONFIRMED |
| B3 | Institute Admin | IA-06 / IA-10 / IA-11 → IA-05 step 1 (experiments of one course in the active plan) → step 2 (students or a group) → step 3 (review) → "Access given" | `people.addStudent` / `importStudents` when needed · `access.previewGrants` · `access.giveAccess({experimentIds, target})` | SACC-0310 (Rahul × Shell-and-Tube): No access yet → Active. Prerequisite: the untraced setup steps S1–S6 (§3.3: students imported 8 Oct, Faculty added and assigned, group created). "Waiting for a licence" (B2-05 f11) appears only in the later-sample fixture as a seeded value (D7) | Student: ST-01 "Start here", ST-02 "1 experiment given to you · WEB and VR available", ST-05 with inherited WEB · VR (B2-13 f1–f3). Faculty: FA-03 "N students with access", FA-08 "Who it reaches", FA-20 rows. IA: IA-02 count, IA-03 "Students you've given access", IA-04 row, IA-06 "Access active", IA-07 "Experiments given", IA-20 "Students with access" | No format picker; formats are inherited from the plan (LD-1, BR-051). "Not in your access plan" experiments can't be ticked (BR-052). Already-has and inactive students can't be ticked (B2-05 f9). Paused, ended or nothing-held → refusal pages (f15–f17). Give access fails → nothing changes, try again (f12). No licence arithmetic (T-06). `importStudents` takes exactly the six drawn columns, all required (B2-07) | CONFIRMED (v46) · conflict flagged: STK31-26 CSV columns (Semester, Organisation optional; Plan Terms "if possible") vs B2-07 (AD-36) |
| B4 | Student | ST-01 → ST-02 → ST-05 | `progress.getStudentHome` · `listMyCourses` · `getExperimentHub` | No write. `flows.json` "SACC-0310 — → Not started" is the derived RUN view: no runtime events yet | — | Only given experiments appear; an ungiven address shows ST-19 (BR-028). Formats: "Available to you" / "Not included for your institution" / "Not available for this experiment" (BR-027) | CONFIRMED |
| B5 (alt) | Institute Admin | IA-04 → "Withdraw…" (DL-2) | `access.withdrawGrant(sacc, reason)` | SACC: Active → Withdrawn (stays in history; "Show withdrawn") | Student: ST-01 "… is no longer given to you", ST-02 "Earlier work", ST-19 "You no longer have access to this experiment" (B2-13 f1–f3) | Individual grants only (BR-054). A group grant is not changed, and the dialog says so (B2-13 f8). Work is kept. The dialog says nothing about licences | CONFIRMED · UNRESOLVED (what the Student sees with overlapping grants, OD-B2-01, AD-18). On 9 Oct this ends Rahul's access because SACC-0310 is his only grant (B2-13 f0); the 12 Oct overlap (f8) needs the later-sample fixture (§3.3) |

### 4.4 Flow C — learning → runtime activity → per-format progress → system Completed → eligible feedback

| # | Role | Screen | Command | Record + transition | Others now see | Invariant | Status |
|---|---|---|---|---|---|---|---|
| C1 | Student | ST-05 → ST-06 → ST-07 | `progress.listResources` · `progress.openResource(res)` (opens in a new tab) | RES activity (Rahul × lab brief): not opened → Opened (date). A shared record of its own (§3.2), not ④ | Faculty FA-21 "Opened 12 Oct 2026, 09:40" (B4-10) | Resources never count as progress (BR-066, T-13). Only formats given are offered (BR-070) | CONFIRMED · PROVISIONAL (BR-070) |
| C2a | Student | ST-07 → ST-08 "Launch WEB" | `progress.launchFormat(exp, 'web')` → `{url}` with an opaque launch nonce; opens a new tab | The portal itself stores no ④ or ⑤ (§5.2). The nonce mapping is in-memory adapter state, not a record | — | A launch never completes (BC3) | PROVISIONAL (AD-16) |
| C2b | Runtime (WEB stand-in route, TE-3) | New tab, `(sample-runtime)/runtime/web`, outside product chrome | `runtime.ingest(SIMULATION_LAUNCHED, SESSION_STARTED … SESSION_ENDED)`, source `'web-runtime'` plus envelope provenance `origin: 'sample-standin'`. The stand-in has no completion control and no timer | RUN WEB: Not started → In progress ("Last saved …", OD-B3-07) | Student ST-08 "Continue WEB" (B3-03 f0), ST-10, ST-15. IA-20 "started". FA-20 / FA-21 per-format words | Accepted only if the Student may run WEB at that moment: refused when paused, withdrawn, inactive or ended (prototype ingestion rule) | PROVISIONAL (AD-05) |
| C2c | **System** (completion handler) on a `SIMULATION_COMPLETED` that only a seed fixture or a CI test hook emits (provenance `'sample-fixture'`), never the Student's stand-in tab | — | `runtime.ingest(SIMULATION_COMPLETED)` (fixture / CI hook) → system completion handler | CompletionRecord (⑤) WEB: — → "Completed 14 Oct 2026", written by the handler, not derived from ④ | Student ST-08 "You've completed WEB" + "Give feedback on WEB" (B3-03 f3). ST-10 / ST-15 per format. IA-20 "completed" (B3-12 f5). FA-20 / FA-21 "Completed <date>" | Set by the system only, never by the Student, never from a launch or time (BC3; B3-03 f3 "Completion comes only from the simulation (T-12). No “I have finished” button"; B3-12 "The simulation reports completion (the only route)"). Per format, no aggregate verdict (BC4; B3-12 f4 "Still no experiment-level verdict"). WEB never completes VR (1b090c9 `utilisation.ts`). Not reachable in a hosted live walk (§2.5; AD-40) | CONFIRMED (who may not set it: BC3) · PROVISIONAL (handler mechanism) · UNRESOLVED (trigger, T-12; AD-39) |
| C2d | Runtime (headset stand-in: fixture or CI test hook only) | ST-09 (no launch button) | `runtime.ingest(…, source 'vr-native-client', origin 'sample-fixture')` → system completion handler on `SIMULATION_COMPLETED` | RUN VR: Not started → In progress; CompletionRecord VR "Completed 20 Oct" | As C2c for VR (B3-12 f3) | B3-04 f0 "No launch button — VR runs on the headset". Not reachable in a hosted live walk (§2.5) | CONFIRMED (rule) · PROVISIONAL (stand-in) · UNRESOLVED (trigger, T-12) |
| C3 | Student | ST-08 / ST-09 / ST-10 / ST-15 → ST-16 → ST-17 | `feedback.submitFeedback(exp, 'web', {ratings: 5 × 1–5, comments?})` | FB (Rahul × Shell-and-Tube × WEB): — → "Feedback sent · WEB · 14 Oct" | **Nobody else.** No staff view; Usage has no feedback column (B3-12 f5; T-25) | Offered only after that format is Completed (⑤ exists), with no disabled button (BC5; B3-06 f5). Entry points include ST-15 Progress (B3-05 f0 "Give feedback on WEB"; f9 "Give feedback on VR"). Sent once, no edit (BR-071). WEB and VR are separate records (B3-06 f3/f4) | CONFIRMED |

Flow C draws no locks and no required order (T-16; B3-02 "Never shown: … locks or a required order"). It is built that way, and PM-09 sequential gating is flagged as a stakeholder conflict (AD-34). FA-20 / FA-21 and IA-20 show per-format progress without "time spent" or "technology used" figures. STK31-29 / STK31-43 and 07.3 R07 ask for them, so they are flagged as AD-42. [CONFIRMED (v46) · conflicts flagged]

### 4.5 Flow D — Faculty assessment → Student attempt → marking → result by the assessment's own setting

| # | Role | Screen | Command | Record + transition | Others now see | Invariant | Status |
|---|---|---|---|---|---|---|---|
| D1 | Faculty | FA-06 → FA-07 (4 steps) → FA-08…FA-12 | `assessments.createAssessment(steps)` · `saveSettings` · questions from the bank | ASMT-0009: — → "Draft — not ready" → **Ready**. Ready is derived: name + introduction + rules + ≥ 1 question (BR-078, PROVISIONAL) | Student ST-11 "To do", ST-01 "Up next", hub Assessment tab (B4-11 f7, f10). ST-12 shows the six facts exactly as configured (f11) | No defaults; every field starts empty (BC6, BR-076). One per experiment per institution (BR-077, provisional). Scope = Faculty courses ∩ experiments the institution holds (BR-064). No "make available" control: B4-11 f15 "The make-available step itself is open (T-18)" | CONFIRMED (no defaults, BC6; Faculty owns creation) · PROVISIONAL (readiness rule BR-078; T-18 open) |
| D2 | Student | ST-11 → ST-12 → ST-13 | `assessments.startAttempt(asmt)` · `saveAnswer` (autosave) · `submitAttempt(att)` (DL-1) | ATT-0450: To do → Attempt in progress → "Submitted · waiting for marking". Choice questions are scored deterministically as drawn (B4-09 f0 "choice questions are marked automatically"); see AD-38 | Faculty: FA-01 "1 written answer to mark", sidebar Marking badge, FA-12 "Waiting for marking", FA-18 queue oldest first, FA-05 / FA-06 / FA-08 "1 waiting for marking", FA-20 / FA-21. IA: IA-01 "written answers have no Faculty marker" when the course has no Faculty (B4-09 f6) | Submit is never automatic; no timer (B4-12 "No timer · three question types"; "Never auto-submits"). Marking guidance is never shown to the Student (BR-087, PROVISIONAL; B4-12 "Faculty only — open question"). Submit is reachable at every width | CONFIRMED (v46) · PROVISIONAL (guidance clause, BR-087) · conflict flagged: PM-08 timer as a capability vs T-22 (AD-35) |
| D3 | Faculty | FA-01 → FA-18 → FA-19 | `marking.saveMark` (provisional) · `marking.confirmMarks(att)` (DL-1) | ATT: Waiting for marking → Marks confirmed (read-only) | Student ST-14 / ST-11 "Result not released yet", no figure of any kind (B4-11 f3). FA-12 "Marked" + "Result released to student: Not yet — after the deadline" (B4-06 f8) | Mark required, whole number 0…question marks (B4-09). No re-marking (T-20). No suggested marks (T-23) | CONFIRMED |
| D4 | **System** (the assessment's own release setting) | — no control | None. Derived `resultRelease(settings, att, now)` | ATT: Result not released yet → Result ready (immediately after marking / after the deadline / on a date) | Student ST-14: headline, score card, answers, correct answers, explanations, "Feedback from Dr S. Ranganathan"; ST-11 Results tab (B4-11 f4). FA-12 "Released …" (B4-06 f9). FA-19 "Released to Rahul on … — when the deadline passed" (B4-14 markup) | No figure before release (BR-089). **No Release control exists on B4-06 or B4-14** (B4-06 f7–f9 controls: All / Waiting / Marked / Mark next / Export CSV). `flows.json` D4 and B8-04 "FA-12 (release)" are a handoff defect (§10) | CONFIRMED (board) · defect reported |

Two related B4-06 behaviours are CONFIRMED:

- f1 "New-version warning": changing a rule after a submission makes a new version, and earlier submissions keep theirs.
- f2 "Result-release warning": changing the release option applies to students who have already submitted.

Both are `assessments.saveSettings` consequences computed by the domain and shown before saving.

### 4.6 Flow E — first publication (Vendor → Academic Reviewer → Content Manager → Published → catalogue)

| # | Role | Screen | Command | Record + transition | Others now see | Invariant | Status |
|---|---|---|---|---|---|---|---|
| E1 | Vendor | VE-02 → VE-03 → VE-04 → VE-05 → VE-06 | `submissions.saveDraft(input)` (the first save assigns SUB-0077, OD-B5-07) · `submissions.submitForReview(sub)` (DL-1) | SUB-0077: unsaved → Draft → With Academic Reviewer (revision 1) | RV-02 queue row "Waiting · revision 1"; RV-01 attention. VE-07 read-only for the Vendor. SA-12 "In the workflow · Who can act: …" | Course only from the Vendor's assigned courses (BR-017). Missing items listed with links, nothing sent (B5-05 f5). "This sends it to the Academic Reviewer. It does not publish anything." (B5-05 f6; BR-096) | CONFIRMED · PROVISIONAL (BR-017: who maps an experiment to a course, PQ-20) |
| E2a | Academic Reviewer | RV-02 → RV-03 → "Return to vendor" (DL-2) | `submissions.returnToVendor(sub, {reason, refs?})` | SUB: With Academic Reviewer → Returned (by the reviewer) | Vendor: VE-01 "Revise …" top item (B5-08 f1), VE-02 "Returned", reason and "What it refers to" above the editor on VE-07 / VE-08. RV-05 "Returned to vendor · revision 1". CM: nothing | Reason required (B6-11 f1). No partial approval and no per-format decision (BR-102) | CONFIRMED |
| E2b | Vendor | VE-07 → VE-08 → Resubmit (DL-1) | `submissions.resubmit(sub, changes)` | SUB: Returned → With Academic Reviewer (revision 2). The Vendor's confirmation is "Submitted" (M-3) | RV-02 "Resubmitted · revision 2" with "What changed in revision 2" first (B6-11 f0) | Copy never promises the next gate (BR-100). Publishes nothing | CONFIRMED |
| E3 | Academic Reviewer | RV-03 → Approve (DL-1) | `submissions.approve(sub, {learningOutcomes})` | SUB: With Academic Reviewer → With Content Manager; LO set | CM-02 row, CM-01 "Ready to publish" count and sidebar badge (B6-12 f2). Vendor VE-07 "With the Content Manager — Approved by the Academic Reviewer on <date>". RV-06 decided, read-only | ≥ 1 learning outcome (B6-11 f2). "Approving does not publish it." (f0). Outcomes are authored by the reviewer only (LD-3) | CONFIRMED |
| E4 | Content Manager | CM-02 → CM-03 → Publish (DL-1) | `publication.publish(sub)` | SUB-0077 → Published; EXP created and listed under ME ZG523 with the formats that passed governance | Public: PU-05 / PU-06 / PU-04 list it; before this, "We can't find that experiment" (B6-12 f5/f6). Vendor VE-07 "Published · <date>", read-only (f4). RV-05 "Approved — published". IA-02 / IA-03 dashed "published, not in your plan" chips; IA-05 "Not in your access plan". SA-12 / SA-13 "Published · read-only" | Publish offered only without blockers (B6-11 f4). "Publishing gives no one access" (f6/f8): **no change to INST, ACC, SACC or FCM** (BC9). The CM is the sole first publisher (BC7). "Composite Wall Conduction" stays a separate record (BC11) | CONFIRMED |
| E5 | Public | PU-05 / PU-06 | `catalogue.*` | EXP listed | — | Unpublished experiments never appear (BR-029) | CONFIRMED |
| E-alt1 | Content Manager | CM-03 → Send back → Academic Reviewer (DL-2) | `publication.sendBack(sub, {to: 'reviewer', reason})` | SUB: With Content Manager → With Academic Reviewer ("Back for a re-check") | RV-02 / RV-01 re-check row, with the CM's reason first on RV-03 (B6-11 f3). Vendor VE-07 "Back with the Academic Reviewer for a re-check — nothing is needed from you". RV-05 "Approved — later sent back for a re-check" | Destination and reason both required (B6-11 f7) | CONFIRMED (drawn; not traced in `flows.json`, §10) |
| E-alt2 | Content Manager | CM-03 → Send back → Vendor (DL-2) | `publication.sendBack(sub, {to: 'vendor', reason, refs?})` | SUB: With Content Manager → Returned (by the CM) | Vendor "Returned by the Content Manager" (VE-07 / VE-08). RV-06 "With the vendor". CM-04 "With vendor" | References only toward the Vendor (OD-B6-05). The next gate is not promised (M-3) | CONFIRMED |
| E-alt3 | Super Admin | SA-12 → SA-13 "Move status (override)" (DL-2) | `operations.overrideStuckRecord(sub, reason)` | SUB: stuck with the Academic Reviewer → Returned to vendor | Vendor can change and resubmit (B7-06; the Vendor-side view is not drawn) | Stuck, non-published records only; Published is never a target (B7-10 f6; OD-B7-09) | CONFIRMED (v46, M-1) · Vendor wording UNRESOLVED · conflict flagged: 07.2-F / 07.3 R17 "ultimate superpower" over content (AD-32) |

### 4.7 Flow F — correction (Content Manager → Academic Reviewer → Super Admin Release / Hold → live version)

| # | Role | Screen | Command | Record + transition | Others now see | Invariant | Status |
|---|---|---|---|---|---|---|---|
| F1 | Content Manager | CM-04 → CM-05 → Start a correction / Edit catalogue details / Edit delivery link → CM-08 draft → "Send for academic review" (DL-1) | `corrections.openDraft(exp, entry)` (opens or joins the one draft) · `saveDraft` · `sendForReview(upd)` | UPD-0005: — → Draft → In academic review | RV-02 update row, RV-01 attention → RV-04. CM-05 "An update is in progress" with only "Open update" (B6-08 f1). **Live 1.2 unchanged everywhere** | Reason, a new version label different from the live one, and ≥ 1 change (B6-11 f11). Every change, including the delivery link, goes through the draft (M-1, BR-108). Never a second update (B6-11 f9) | CONFIRMED (v46, M-1) · conflict flagged: 07.3 R16 direct CM link edit / replace (AD-31) |
| F2a | Academic Reviewer | RV-02 → RV-04 → Approve update (DL-1) | `corrections.approveUpdate(upd)` | UPD: In academic review → Awaiting release decision (SA label "Waiting for your decision") | CM-08 "Awaiting release decision" (B6-11 f10). SA-10 "Waiting for you", SA-01 row. RV-05 "Update approved — with the Super Admin" | The live version does not change (BR-112). The SA never sees an update before approval (B7-10 f4) | CONFIRMED |
| F2b | Academic Reviewer | RV-04 → Return to the Content Manager (DL-2) | `corrections.returnUpdate(upd, reason)` | UPD → Returned (editable by the CM) | CM-08 "Returned", reason first. CM-01 "Update returned: …". CM-04 tag | Reason only (BR-112). References on update returns stay open (T-28) | CONFIRMED |
| F3a | Super Admin | SA-10 → SA-11 → Release update (DL-1) | `corrections.release(upd)` | UPD → Released; EXP live 1.2 → 1.3 | CM-08 "Released"; CM-05 live 1.3 with history "Version 1.3 released". PU-06 and ST-05 read 1.3 (B7-11 f7/f8). RV-05 "Update approved — released". FA-05 reads the live version | Never "Publish" (BC8; B7-10 f0). Release grants or changes no access (BC9; SA-11 "Nothing here changes any institution's access") | CONFIRMED |
| F3b | Super Admin | SA-11 → Hold (DL-2) | `corrections.hold(upd, reason)` | UPD → On hold; live stays 1.2 | CM-08 "On hold" with the reason; CM-05 history; CM-04 "Update on hold"; CM-01 "With others" | No Release while held. What else a hold affects is open (T-28; B7-10 f2) | CONFIRMED · UNRESOLVED (hold effects, BR-114) |
| F3c | Super Admin | SA-11 → Lift hold (DL-1) | `corrections.liftHold(upd)` | On hold → Awaiting release decision ("Hold lifted — waiting again") | CM-08 back to awaiting; SA-10 "Waiting for you" | Lifting never makes anything live (B7-10 f2) | CONFIRMED |
| F-alt | Content Manager | CM-08 → Withdraw update (DL-2) | `corrections.withdraw(upd, reason)` | Draft / Returned / In academic review → Withdrawn | RV-02 row disappears; RV-04 "Withdrawn by the Content Manager" (script only) | Not offered after approval (BR-111) | CONFIRMED (drawn) · PROVISIONAL (BR-111 timing; OD-B6-06) |
| F4 | CM · public · learner | CM-05 / CM-08 · PU-06 · ST-05 | Reads | EXP live version | — | History keeps every version and decision (BR-113). Whether the version is shown publicly is open (OD-B7-05) | CONFIRMED |

### 4.8 Device-transfer chain

| # | Role | Screen | Command | Record + transition | Others now see | Invariant | Status |
|---|---|---|---|---|---|---|---|
| Dv1 | Student | XS-05 "My device" → ST-18 → "Request a device transfer" → "Send request" | `operations.requestDeviceTransfer({format, newDevice, note?})` | DTR-0018: — → With your Institute Admin | IA-18 row "Waiting on you"; IA-19. SA-18 "DTR-0018 hasn't reached BITS yet" (B7-10 f14) | Authorisation only, nothing shipped (BR-073). "My device" only for AR / VR / MR holders (B3-07 f2). New device is the only required field (f3). Not while paused (f8). No second request is offered while one is open (a designed absence, labelled as an assumption; OD-B3-03 open) | CONFIRMED · PROVISIONAL (one open request, OD-B3-03) |
| Dv2 | Institute Admin | IA-18 → IA-19 → "Forward to BITS" (DL-1) | `operations.forwardDeviceTransfer(dtr)` | DTR → Forwarded. Student and IA label "Forwarded to BITS"; SA label "Forwarded" | SA-18 row; SA-01 Operations group. Student ST-18 "Forwarded to BITS" (B3-07 f5) | The IA cannot approve or decline (B3-09 f1). Blocked while paused (B3-09 f4) or with no IA (B3-07 f7) | CONFIRMED · stakeholder STK31-38 (Super Admin reviews the Student's request directly) is recorded as superseded by the later 07.2-C (Institute Admin as point of contact); listed for owner acknowledgement (AD-45) |
| Dv3 | Super Admin | SA-18 → SA-19 → "Approve transfer" (DL-1) | `operations.approveDeviceTransfer(dtr)` | DTR → Approved; the authorised VR device becomes the new device | Student ST-18 "Approved" and the new authorised device, plus the ST-09 device line (B3-07 f6). IA-18 / IA-19 "Decided · approved by BITS" (B3-09 f3). SA-19 read-only "Approved on … by Arjun Mehta" | Approve only: no Decline, no reason field (T-32; B3-11). The Approve control appears only once forwarded (B7-10 f14) | CONFIRMED |

### 4.9 Cross-cutting commands whose effects cross roles

| Command (role, screen) | Record change | Others now see | Evidence | Status |
|---|---|---|---|---|
| `institutions.pause` / `restore` (SA, SA-07, DL-2 with reason) | INST Access paused ↔ active | **IA:** IA-01/02/03/04/05/16/19 read-only with banner and no "Give students access". **Faculty:** shared banner only (OD-B7-07). **Student:** banner, ST-01 "You can't open experiments right now", formats "Paused". **SA-03:** that institution's requests can't be decided. **Device requests:** can't be forwarded. **Runtime:** ingest refused | B7-04 f0–f3; B1-11 f14; B3-09 f4; BR-047 | CONFIRMED |
| `people.deactivate` (IA, IA-07, DL-2) / `institutions.overrideStudentStatus` (SA, SA-07, reason) | PER Inactive | Student inactive banner, can't open experiments. IA-04 "Student inactive"; IA-05 "Inactive — can't be given access"; IA-14 member "Inactive" | B1-09 f7; B2-05 f9; BR-057, BR-062 | CONFIRMED |
| `people.assignCourse` / `removeCourse` (IA, IA-15) | FCM | Faculty scope (FA-01/02/03/04/05/06/20). Removing a course with waiting answers warns; then IA-01 shows the "no Faculty marker" row | B2-09; B2-13 f7; B4-09 f6 | CONFIRMED |
| `people.saveCourseCode` (IA, IA-16) | CCODE (institution code + optional semester) | Students and Faculty see MEC-523 instead of ME ZG523 | B2-03 f7; T-17 | CONFIRMED |
| `structure.savePlatformCodes` (CM, CM-09) | CRS platform code | Public course chip (blank allowed); SA-14/15 read-only; IA-16 read-only column. Duplicates refused | B6-10; B6-11 f12; M-2 | CONFIRMED (v46, M-2) · conflict flagged: 07.2-E "Super Admin will also get access to it" (AD-33). The writer set is kept as policy data, so an SA writer can be added by explicit owner policy |
| `structure.*` (SA, SA-14/15) | AREA / CRS | Explorer and catalogue facets; Vendor course lists; import matching. A move is blocked while people are filed against the course | B7-07; B7-10 f9 | CONFIRMED |
| `roles.assignScope` / `withdrawScope` / `restoreScope` (SA, SA-17) | ROLE scope | Vendor VE-03 course list and "Draft · read-only" drafts; Reviewer queue; CM library. A holder without scope is flagged | B7-08; B7-10 f10/f11; B5-06 f9 | CONFIRMED |
| `operations.reportProblem` (any signed-in role, XS-07) → `resolveReport` / `reopenReport` (SA, SA-21) | SUP Open → Resolved (note required) → Reopened | SA-20 / SA-01. The IA-01 "open problem report" row for the IA's own institution. The reporter sees the note first | Board 07; B7-09; B7-10 f12 | CONFIRMED · UNRESOLVED (who may reopen, AD-26) |
| Clock passes ≤ 15 days before the plan end (derived) | ACC "Ending soon" / "Reminder due" | SA-22; IA-01. **Nothing is sent** (T-31). The stakeholder STK31-28 reminder capability is not discharged | B7-09; B7-10 f13; `decisions-rules.json#conflicts` "15-day expiry reminder" | CONFIRMED (frontend) · conflict flagged to owner (AD-30) |
| `requests.requestRenewal` / `requestMoreLicences` (IA, IA-17) | New REQ | The same REQ in SA-02 / SA-03. Its decision returns as an IA-17 status and leads to the payment page. Nothing changes until activation | B3-08; BR-043 | CONFIRMED |

---

## 5 · The five-state separation as types, invariants and read models

BC3 says "Published, institution access, Student entitlement, runtime activity and learning completion are five different states. Never derive one from another." It adds: "'Completed' is set by the system, never by the Student, and never inferred from a launch." BR-024 and BR-137 say the same. [CONFIRMED]

Each state is therefore **written** by its own authority and **read** side by side. No read model computes one state from another. Learning completion (⑤) is a stored record that a system completion handler writes. It is not a value computed from runtime activity (④) on every read.

This departs from two committed statements:

- `1b090c9:v2/docs/ARCHITECTURE.md` §8 classes "progress (per technology)" as "Derived, never stored as truth".
- `1b090c9:v2/packages/domain/src/runtime/utilisation.ts` returns `COMPLETED` from the event fold ("COMPLETED needs a completion event and nothing else").

The owner constraint BC3 ranks above both. The tension is recorded for the owner (AD-39), and the committed fold is still reused for activity and for the handler's interim trigger.

### 5.1 Types (sketch for `@xr/domain`) [PROVISIONAL shapes; CONFIRMED separation]

```ts
// ① PUBLICATION — written by the Content Manager (first publication) and by the Super Admin Release (later versions)
type SubmissionState =
  | { s: 'draft' }                                             // "Draft · read-only" is DERIVED from scope (course withdrawn)
  | { s: 'with-reviewer'; revision: number; recheck: boolean } // recheck = sent back by the CM
  | { s: 'returned'; by: 'reviewer' | 'content-manager' | 'override'; reason: string; refs: readonly FieldRef[] }
  | { s: 'with-content-manager' }
  | { s: 'published'; experimentId: ExperimentId };
interface Publication {                                        // EXP
  experimentId: ExperimentId; courseId: CourseId;
  liveVersion: VersionLabel; liveSince: Instant;
  publishedFormats: readonly Format[];                         // only formats that passed governance (BR-015)
}

// ② INSTITUTION ACCESS — written by Super Admin decisions and the payment outcome; term state derived from the clock
type InstitutionState = 'approved-payment-required' | 'active' | 'paused'; // stored
type PlanTermState = 'active' | 'ending-soon' | 'ended';                   // derived(term, now): never stored
interface AccessPlan {                                                     // ACC
  id: PlanId; institutionId: InstitutionId;
  items: readonly { experimentId: ExperimentId; formats: readonly Format[] }[];
  licences: ProvidedLicenceFigures;                                        // shown as provided (T-06); no arithmetic
  term: { period: 'monthly' | 'quarterly' | 'yearly'; start: Instant; end: Instant };
}

// ③ STUDENT ENTITLEMENT — written by the Institute Admin; 'waiting-for-licence' only as seeded data (D7 open)
type GrantState = 'active' | 'waiting-for-licence' | 'withdrawn';
interface Grant {                                                          // SACC
  id: GrantId; planId: PlanId; experimentId: ExperimentId;
  target: { kind: 'student'; personId: PersonId }
        | { kind: 'group'; groupId: GroupId; membersAtGrant: readonly PersonId[] }; // BR-057; late members: OD-B2-02
  state: GrantState; givenBy: PersonId; givenAt: Instant;
  withdrawn?: { by: PersonId; at: Instant; reason: string };
}

// ④ RUNTIME ACTIVITY — appended only through runtime.ingest (TE-3 stand-in route, fixtures, CI hooks in sample mode); never by a screen
type RuntimeEvent = RuntimeEventRecord & { personId: PersonId; experimentId: ExperimentId; clientEventId: string }; // 1b090c9 events.ts
// sample-only provenance lives in the @xr/sample-platform envelope, never in the domain enum or the wire schema:
//   { event: RuntimeEvent; origin: 'sample-standin' | 'sample-fixture' }
type FormatActivity = { s: 'not-started' } | { s: 'in-progress'; lastReportedAt: Instant };                        // via foldSessions; never 'completed'

// ⑤ LEARNING COMPLETION — its own record, written ONLY by the system completion handler (BC3); trigger open (T-12/A-06)
interface CompletionRecord {                                                                      // COMP
  personId: PersonId; experimentId: ExperimentId; format: Format;
  completedAt: Instant;                                                                           // shown as "Completed <date>"
  trigger: { kind: 'runtime-event'; eventId: string };                                            // what the handler accepted
}
interface CompletionTrigger {                                                                     // replaceable until T-12 is decided
  // interim: a SIMULATION_COMPLETED reported from a launched or started session (the committed utilisation.ts rule)
  accept(signal: RuntimeEvent, sessionEvents: readonly RuntimeEventRecord[], existing: CompletionRecord | null): CompletionRecord | null;
}
```

PER status (Active / Inactive) and INST pause are **gating facts** that the read models consult. They are not one of the five states and never change them. [CONFIRMED (B2-13 f4 "work kept"; BR-047)]

### 5.2 Who sets each state

| State | Set by (command) | Never set by | Evidence | Status |
|---|---|---|---|---|
| ① Publication | CM `publication.publish` (first publication); SA `corrections.release` (live version). Vendor and Reviewer only move SUB through earlier states | Super Admin first publication; Vendor; Reviewer; any access command | BC7, BC8; B6-11 f0/f6; B7-10 f0; B8-03 scan "No Publish control on any Super Admin or Reviewer frame" | CONFIRMED |
| ② Institution access | SA `requests.decide` (internal route activates); payment outcome (external); SA `institutions.pause`/`restore`; the clock (ending soon / ended, derived) | Publish / Release; IA; a Student | BC9; BR-033, BR-036, BR-046 | CONFIRMED |
| ③ Student entitlement | IA `access.giveAccess` / `withdrawGrant`; the seed only for "Waiting for a licence" | Publish / Release; plan activation; a Faculty member; the Student | BC9; BR-026, BR-051, BR-054; T-06 | CONFIRMED · PROVISIONAL (seed-only waiting, AD-17) |
| ④ Runtime activity | Runtimes through `runtime.ingest` (stand-in TE-3: activity events only from the WEB stand-in route; fixtures and CI hooks otherwise). The portal "Launch WEB" stores nothing | Resources (they write RES activity only), assessments, feedback, any staff action | 1b090c9 `events.ts` ("deliberately no content event"); BR-066, T-13 | CONFIRMED (rule) · PROVISIONAL (AD-16) |
| ⑤ Completion | **System only**: the system completion handler writes a CompletionRecord when it accepts the completion signal (interim trigger: a `SIMULATION_COMPLETED` from a launched or started session) | The Student (no "I have finished"); any user-facing command; a launch; time; resources; an assessment; another format; the WEB stand-in page | BC3; B3-03 f3; B3-04 f2 "Completion reported from the headset (T-12)"; B3-12 "The simulation reports completion (the only route)" | CONFIRMED (who may not set it) · PROVISIONAL (stored record and handler) · UNRESOLVED (trigger, T-12; ARCH §8 tension, AD-39) |

### 5.3 Derived read models

| Read model | Formula | Used by | Must **not** read | Status |
|---|---|---|---|---|
| `experimentGate(student, exp, now)` | No grant → `not-given`. Only withdrawn grants → `withdrawn`. Plan term ended → `access-ended`. Institution paused → `paused`. Otherwise `open` | ST-03, ST-05…10, ST-16, ST-19 variants (board 08 family: "isn't available to you" / "no longer have access" / "access is paused" / "has ended") | ④ ⑤ | CONFIRMED (variants) · PROVISIONAL (order, AD-27) |
| `formatAvailability(student, exp, f, now)` | `not-available-for-experiment` if f ∉ ①.publishedFormats. `not-included-for-institution` if f ∉ ② plan formats. Otherwise the gate result, `student-inactive`, `waiting-for-licence`, or `available` | ST-05 / ST-07 / ST-08 / ST-09 chips and message pages (B3-04 f3/f4; B3-03 f5/f6) | ④ ⑤ | CONFIRMED (words) · PROVISIONAL (precedence, AD-27) |
| **`canOpenFormat`** | Active grant for (student, exp) ∧ student Active ∧ institution ≠ paused ∧ plan term ≠ ended ∧ f ∈ plan formats ∧ f ∈ published formats | Launch / Continue controls; runtime ingest authorisation | Progress, completion, feedback, assessment | CONFIRMED (inputs) · UNRESOLVED (overlapping grants, OD-B2-01) |
| `formatProgress(student, exp, f)` | Reads ④ and ⑤ **side by side**: a CompletionRecord (⑤) for (student, exp, f) → Completed (date). Otherwise ④ folded by `foldSessions` → In progress (last saved / last session), or Not started. The fold's own `COMPLETED` value is never used here | ST-08 / ST-09 / ST-10 / ST-15; FA-20 / FA-21; IA-20 | ① ② ③. It stays visible as "Earlier work" after access ends or is withdrawn (B2-13 f2) | CONFIRMED (BC3, BC4) · PROVISIONAL (shape) |
| `feedbackEntry(student, exp, f)` | ⑤ exists for f ∧ no FB(student, exp, f). Interim: also `experimentGate = open` | ST-08 / ST-09 / ST-10 / ST-15 "Give feedback on <F>" → ST-16; ST-17 when sent (B3-05 f0 / f9) | ③ beyond the gate; ④; any other format | CONFIRMED (BC5) · UNRESOLVED (gate condition, AD-22) |
| `assessmentForStudent(student, asmt, now)` | Ready(asmt) ∧ active grant for asmt.experiment. Starting an attempt also needs gate = open | ST-01 Up next; ST-11; hub Assessment tab; ST-12 | ④ ⑤ (assessment ≠ progress) | PROVISIONAL (BR-078 readiness; T-18 open; gate) |
| `resultView(att, asmt, now)` | Marks confirmed ∧ release condition(setting, deadline / date, now) → result; else "Result not released yet" / "Submitted — waiting for marking" | ST-11 / ST-14; FA-12 / FA-19 "released to student" | — | CONFIRMED (BR-079, BR-089) |
| `publicCatalogue` | ① only | PU-02…06; Vendor unique-name check | ② ③ | CONFIRMED (BR-029) |
| `iaContentAccess` | ② items + ① published formats ("published, not in your plan" chips) | IA-02 / IA-03 / IA-05 | ③ | CONFIRMED |
| `facultyScope(faculty)` | FCM courses ∩ experiments in the institution's plan | FA-01…06, FA-20 | ③ for scope (students come from ③ only inside the scope) | CONFIRMED (BR-064) |
| `usage(institution)` | Per experiment × format: students with access (③ active) · started (④) · completed (⑤ records) · sessions (④). Each column reads its own state | IA-20 (and SA-07 report) | FB; licence usage (BR-065) | CONFIRMED (fields) · PROVISIONAL (definitions, BR-065, OD-B3-08) · conflict flagged: time spent / technology used (AD-42) |
| `navCounts(role)` | SA: REQ under review. FA: written answers waiting. CM: SUB with CM. … | Sidebar badges, overview attention lists | — | CONFIRMED (B1-10 f0 "Nav count 3 = requests under review") |

### 5.4 Canonical state × viewer-role labels (copy table, not data) [CONFIRMED words · PROVISIONAL mechanism, AD-24]

The label key is canonical state × viewer role. For SUB it also includes the revision and the origin (first submission, resubmit, CM re-check), because the Vendor sees different words for the same `with-reviewer` state.

| Record · canonical state | Student / requester / Vendor | Institute Admin / CM | Reviewer | Super Admin | Evidence |
|---|---|---|---|---|---|
| DTR `with-institute-admin` | "With your Institute Admin" | "Waiting on you" | — | "Still with the institution" / "hasn't reached BITS yet" | B3-07 f4; B3-09 f0; B3-11; B7-10 f14 |
| DTR `forwarded` | "Forwarded to BITS" | "Forwarded to BITS" | — | "Forwarded" | B3-07 f5; B3-09 f2; B3-11 |
| DTR `approved` | "Approved" | "Decided · approved by BITS" | — | "Approved" | B3-07 f6; B3-09 f3 |
| UPD `in-review` | — | CM: "In academic review" | "Waiting for your decision" | (not visible) | B6-09; B6-04; B7-10 f4 |
| UPD `awaiting-release` | — | CM: "Awaiting release decision" | "Approved — with the Super Admin" | "Waiting for your decision" | B6-11 f10; B6-04; B7-05 |
| REQ `under-review` | Requester: "Submitted" until "BITS started reviewing", then "Under review" | IA-17: "Under review" | — | "Under review" | B1-13 timeline table; B1-08 f1/f2 |
| SUB `with-reviewer` (revision 1, first submission) | Vendor: "With Academic Reviewer" | CM: "Still in academic review" | "Waiting · revision 1" | "In the workflow" | B5-06 f2; B6-11 f5; B7-06 |
| SUB `with-reviewer` (revision 2, after a resubmit) | Vendor: **"Submitted"** ("Your changes have been submitted for review. Nothing is needed from you now."), kept until the record moves on; no gate named (M-3) | CM: "Still in academic review" | "Resubmitted · revision 2" | "In the workflow" | B5-06 f4 "Submitted (after the resubmit) — neutral; no gate named (M-3)"; B6-12; BR-100; B6-11 f0/f5; B7-06 |
| SUB `with-reviewer` (recheck) | Vendor: "Back with the Academic Reviewer for a re-check" | — | "Back for a re-check" | — | B5-06 f7; B6-11 f3 |
| SACC (no grant) / `active` / `waiting` / `withdrawn` | "Available to you" / "Waiting for a licence" / "no longer given" | "No access yet" / "Active" / "Waiting for a licence" / "Individual grant withdrawn" | — | — | B2-04; B2-05 f11; B2-06 |

### 5.5 Invariant tests (domain property tests + contract suite) [PROVISIONAL test plan for CONFIRMED rules]

1. Publish and Release leave every ACC, SACC and FCM unchanged (BC9).
2. No command other than `runtime.ingest` changes ④. `progress.openResource` writes RES activity only, never ④ or ⑤. **Only the system completion handler writes ⑤**; no user-facing command, launch, resource, assessment or other format does (BC3).
3. The completion handler never writes ⑤ from a launch, a resource, an assessment, time, or another format (1b090c9 `utilisation.ts` rules). A second completion never moves the date.
4. `formatProgress` is identical before and after a grant withdrawal or an institution pause (work is kept).
5. `canOpenFormat` is identical before and after any runtime event (activity never grants access).
6. `publicCatalogue` is identical before and after any IA, SA-pause or Student command.
7. At most one FB per Student × Experiment × format. FB exists only if ⑤ exists for that format (BC5).
8. Activating a plan creates no grant. Giving a grant creates no runtime event.
9. Assessment pass mark and rules are read only from that assessment; no default exists (BC6).
10. No command merges, deduplicates or renames one Composite Wall record into the other, and neither is removed by a merge (BC11). Both records exist in the `afterFlow('E')` and `stateCoverage()` fixtures; SUB-0077 does not exist in the spine-start world or before Flow E step 1. *(Reworded at assembly: the draft wording "Both Composite Wall records exist" fails on the spine-start world.)*
11. "Completed" is read only from ⑤. No read model returns Completed when ⑤ is absent, whatever ④ contains (BC3).
12. Every stand-in or fixture runtime event carries a sample provenance (`sample-standin` / `sample-fixture`). No event from the WEB stand-in route is a `SIMULATION_COMPLETED` (TE-3).

---

## 6 · Navigation architecture

### 6.1 Route tree (App Router) [PROVISIONAL; routes are proposals (START-HERE Known exception 5)]

```
src/app/
  layout.tsx                  html, Public Sans (working font), v46 stylesheets, <Providers> (QueryClient + PlatformProvider)
  not-found.tsx               PU-15 public pattern ("We can't find that page")
  (public)/layout.tsx         public header / footer (xp-*); header Selection (n) reads SEL
    page.tsx                  PU-01 (+ PU-14 #for-institutions)
    areas/ · areas/[areaId]/  PU-02 · PU-03
    courses/[courseId]/       PU-05 (stable id; platform code shown as data, may be blank, T-17)
    experiments/ · experiments/[experimentId]/   PU-04 · PU-06
    selection/                PU-07
    request-access/ (?step=details|review) · request-access/sent/   PU-08 · PU-09
    requests/status/ · requests/status/payment/                      PU-10 (+PU-13 state) · PU-12 — capability-free: resolves the ticket held in this browser session (§6.4)
  (entry)/sign-in/            XS-01 (+ XS-03 notices "Signed out" / "Session expired"; XS-04 disclosure)
  (workspace)/layout.tsx      server layout rendering client <SessionGate> → <WorkspaceShell>(role FROM SESSION) → XS-08 banners
    student/layout.tsx        server layout rendering client <WorkspaceGuard role="student"> → XS-06 in place on mismatch
      page.tsx … help/ … [...missing]/   ST-01…ST-19, XS-07, workspace not-found pattern
    faculty/ · institute/ · vendor/ · reviewer/ · content-manager/ · admin/   (same pattern)
  (sample-runtime)/runtime/web/page.tsx   NOT PRODUCT — TE-3 WEB runtime stand-in; notFound() unless the data source is `sample`;
                                          no product chrome, no controls, no completion; reached only from the "Launch WEB" URL
```

- XS-07 Help lives inside every workspace (`/<ws>/help`). This avoids the root `[workspace]` dynamic segment that would collide with 16 static segments (`handoff-consistency.json#routeIssues` XS-06/XS-07).
- There is no `/signed-out` page, because B1-09 f10 draws a notice on Sign in.
- PU-05 and every other course route use a stable id, because the platform code contains a space and may be blank (`routeIssues` PU-05).
- The 18 implied intermediate paths redirect to their drawn parent lists, or fall to the not-found pattern (`routeIssues`). [PROVISIONAL]

**Rendering mode.** In sample mode the world exists only in the browser, so workspace and public pages render on the client from the query layer. `ARCHITECTURE §4` "Public discovery before login (STK31-16), server-rendered" returns when the HTTP adapter can be called from server components (§8). This temporary deviation is recorded as TE-8. [PROVISIONAL, AD-12]

**Next.js 16 App Router details** (`1b090c9:v2/apps/web/package.json` pins `next` 16.3.4; behaviour assumed from the App Router model, not run) [PROVISIONAL]:

- `layout.tsx` files are server components by default and cannot read `sessionStorage` or `localStorage`. The `(workspace)` and `(public)` layouts stay server components that render **client** components (`'use client'`): `<SessionGate>`, `<WorkspaceShell>`, `<WorkspaceGuard>`, and the header Selection count. This follows the pattern of `1b090c9:v2/apps/web/src/app/providers.tsx`.
- Browser state (the session under option B, SEL, the ticket) is read through `useSyncExternalStore`, with a `null` server snapshot, so the server render and the first client render agree.
- Before hydration and while the session resolves, the drawn Loading state renders (B7-01 f2 "Skeleton groups; the status is announced"; archetype loading patterns on boards 04 / 09a / 09b), never a flash of the wrong workspace.
- Wizard pages (`?step=`) wrap the component that calls `useSearchParams` in `<Suspense>`, so `next build` can prerender the route shell.
- Page titles that carry record data (e.g. a request reference or an experiment name) are set on the client from the view model. The static route title comes from metadata.

### 6.2 Guards

- **Session gate** (`(workspace)/layout`). No session → `/sign-in?returnTo=<path>`. An expired session gets the f9 notice. [CONFIRMED states · PROVISIONAL mechanism]
- **Workspace guard.** The shell is chosen by the **session role**, not by the URL. A Student opening `/faculty/…` keeps the Student sidebar and account menu and sees XS-06 "This page isn't part of your workspace" **in place**: the URL is kept, no redirect, and nothing in the sidebar is marked current. Board 08 "In context": "The refusal does not replace the shell." Actions are "Back to Home" and Help, and no route, role or status code is shown (BR-004). [CONFIRMED]
- **Record guards** come from the view model's `mode` and `reason`, never from screen logic:

| Mode | Where | Evidence |
|---|---|---|
| ST-19 not available (4 variants) | Student experiment routes | Board 08; B2-13 f3 |
| `read-only` "Draft · read-only" | Vendor editor when the course is withdrawn or the SUB is under review | B5-06 f9; B5-05; BR-099 (PROVISIONAL, OD-B5-01) |
| RV-06 decided, read-only | RV-03 / RV-04 after a decision | B6-03; B6-12 |
| "Still in academic review — read-only" | CM-03 | B6-11 f5 |
| "Nothing to decide" | SA-11 before reviewer approval | B7-10 f4 |
| "hasn't reached BITS yet" | SA-19 before forward | B7-10 f14 |
| Confirmed marks read-only | FA-19 | B4-09 |
| Published read-only | SA-13 | B7-10 f5 |
| Paused read-only | IA pages | B7-04 f1 |

[CONFIRMED, except the "Draft · read-only" row, which is PROVISIONAL (BR-099)]

### 6.3 Actions offered only where drawn

Every view model returns `availableActions` computed by domain policy, and screens render a control only when it is listed. This makes the drawn absences structural:

- no Publish for SA or Reviewer;
- no Decline anywhere;
- no format picker in IA-05;
- no "I have finished";
- no Release control on FA-12;
- no Approve on IA-19.

The B8-03 terminology scans become tests (`decisions-rules.json#tests` "Policy-word / terminology scans"). No permission matrix was designed (HANDOFF-AUDIT item 7), so the per-role action list in `decisions-rules.json#roleGuards` ("evidence, not policy") is the input. Doubtful cases go to the owner. [CONFIRMED principle · PROVISIONAL list]

### 6.4 Cross-role movement, deep links, the public request status

- **Cross-role movement** happens only through public pages (request status) and Help & support. No role's frame links into another workspace (`navigation.json` rules; BR-007). PU-13 "Sign in" leads to XS-01. [CONFIRMED]
- **Deep links.** Every detail route is addressable. After sign-in, `returnTo` is honoured only if it belongs to the signed-in role's workspace; otherwise the person lands on their role's home (BR-008). [PROVISIONAL, AD-21]
- **PU-10 / PU-12 / PU-13.** "The reference number identifies the request — it does not open the page on its own. No reference lookup, OTP, magic link or account registration is designed" (B1-08). B1-07 says "Check request status, continues from this session … the page promises no link, e-mail or account". So **no URL may work as a bearer link**:
  - The routes are capability-free: `/requests/status` and `/requests/status/payment`. They carry no reference and no ticket.
  - The anonymous requester's opaque ticket is held in `sessionStorage` from PU-09, and the page resolves it from there. Copying the URL to another browser opens nothing.
  - A signed-in Institute Admin reaches the same pages for their own institution's request from IA-17 ("Open the payment page", B3-08 f6). The request is identified from the IA's session-scoped navigation state, or from an opaque `?request=` id that is honoured **only** when the signed-in IA belongs to that request's institution. Without that session the id opens nothing.
  - A visit with no ticket in this browser session, or with an unknown or expired ticket (e.g. after an option-A reload), renders the public not-found pattern. No state is drawn for it (`surface-public-entry.json#openQuestions`). [PROVISIONAL, AD-13]

### 6.5 Wizards and Back [PROVISIONAL]

- Steps are URL state: `?step=` slugs in drawn order. PU-08: details → review. IA-05: 1…3. FA-07: 1…4. VE-03…06: course | formats | preview | submit.
- Browser Back moves to the previous step, and values come back from the per-tab draft store ("Back never loses work", AR-5). The component that reads `?step=` through `useSearchParams` sits inside `<Suspense>` (§6.1).
- Result states ("Request sent", "Access given", "Created", "Submitted") are states, not routes. The final command `router.replace`s, so Back cannot resubmit; `commandId` deduplication is the second guard.
- VE-04…06 before the first save: the proposed `[submissionId]` routes need an id the draft does not have yet (OD-B5-07). Use `/vendor/experiments/new?step=…` until the first save, then `router.replace` to `/vendor/experiments/[id]/edit?step=…` (`routeIssues` FA-07/IA-05; `surface-vendor.json#inconsistencies`).

### 6.6 Unsaved changes [UNRESOLVED, AD-19]

No board draws a leave-page prompt. `surface-vendor.json#openQuestions` says: "Not shown: unsaved-changes guard when leaving the editor via Cancel / sidebar (AR-5 says only 'Back never loses work')".

Safe interim treatment:

- no blocking `beforeunload` or route prompt (none is drawn);
- in-progress form input is kept in the per-tab draft store and restored when the person returns;
- the drawn "Cancel" discards it;
- Vendor drafts are written to the world only by the explicit "Save draft".

### 6.7 Route defects carried into the route map (board wins)

These come from `handoff-consistency.json#routeIssues`. [CONFIRMED findings; resolution PROVISIONAL]

- **ST-08 / ST-09.** Keep the static `simulation/web` route and restrict `[format]` to `ar|vr|mr`.
- **SA-15.** Expand to `/admin/structure/areas/[areaId]` and `/admin/structure/courses/[courseId]`. Never `/courses/[courseId]`, which collides with PU-05.
- **SA-16.** `?tab=vendors|reviewers|content-managers` stands for three separate values.
- **IA-14.** Create group is a DL-3 dialog, not `/new` (B2-08).
- **CM-06 / CM-07 / CM-08.** One detail route, `/content-manager/updates/[updateId]`. The entry commands create or join the draft first.
- **FA-21.** Needs experiment context (`?experiment=`) — owner (AD-28).
- **IA-10.** Discriminate student or faculty (`?type=`).
- **Sidebar active state.** Use an explicit route → sidebar-item map, because URL prefixes do not match board 05 (ST-05 sits under "My courses").
- **Student hub Assessment tab** (B4-11 f7–f9) has no id. Use `/student/experiments/[id]/assessment` and report the register gap.

---

## 7 · Error and loading semantics shared by every port

### 7.1 Result types [PROVISIONAL]

```ts
type Result<T> = { ok: true; value: T } | { ok: false; refusal: Refusal };
type CommandResult<R> = { ok: true; receipt: R; changed: readonly RecordType[] } | { ok: false; refusal: Refusal };
type Refusal =
  | { kind: 'not-signed-in' }                                   // → /sign-in?returnTo
  | { kind: 'not-your-workspace' }                              // → XS-06 in place
  | { kind: 'not-found' }                                       // → PU-15 pattern (public or workspace variant, board 08)
  | { kind: 'not-available'; reason: AvailabilityReason }       // → ST-19 variants; AR/MR message pages
  | { kind: 'read-only'; reason: ReadOnlyReason; holder?: Party } // → drawn read-only state "saying who has it now" (BR-123)
  | { kind: 'blocked'; reason: BlockReason }                    // drawn prerequisites: route-required, no-learning-outcomes,
                                                                //   publication-blockers, institution-paused, no-institute-admin, …
  | { kind: 'validation'; errors: readonly FieldError[] }       // → error summary (role=alert, linked) + field errors
  | { kind: 'invalid-state'; current: StatusRef }               // the record moved on (another role / tab acted)
  | { kind: 'unavailable' };                                    // transient → drawn "failed + try again"
```

These map onto the committed RFC 9457 `problemDetailsSchema` for the HTTP adapter:

| Refusal | HTTP status |
|---|---|
| not-signed-in | 401 |
| not-your-workspace, not-in-scope | 403 |
| not-found | 404 |
| invalid-state, duplicate | 409 |
| validation, blocked | 422 |
| unavailable | 503 |

Each also carries a `type` URI (§8). [PROVISIONAL]

### 7.2 One state grammar, mapped to drawn states

BR-123: "loading · empty (with next step) · error + retry ('Nothing was lost') · refused with a reason · read-only (saying who has it now) · paused / inactive banner · not available".

| Situation | Drawn treatment | Examples | Status |
|---|---|---|---|
| Query pending | Drawn loading state where one exists. Otherwise the archetype loading pattern from boards 04 / 09a / 09b | B7-01 f2 "Loading — Skeleton groups; the status is announced"; B2-05 f18 "Loading" | CONFIRMED where drawn · UNRESOLVED where not drawn (e.g. RV-01, RV-03…06, CM screens: `surface-reviewer-cm.json#openQuestions`) |
| Empty | Drawn empty state with its next step | B6-11 f14 "Nothing waiting"; B7-01 f1; B4-06 f11 | CONFIRMED |
| Read failed | "Try again" reloads | B6-11 f13 "Review queue failed + retry" | CONFIRMED (pattern) |
| Command failed (`unavailable`) | Nothing changes; error summary; answers kept; "Nothing was lost" | B1-07 f7; B2-05 f12; B3-06 f2; B3-03 f2 | CONFIRMED |
| Validation | Error summary takes focus, links to fields, fields keep what was typed | B1-07 f3; B2-05 f10; B3-06 f1; B6-11 f1/f7 | CONFIRMED |
| Not found | Board 08 "Page not found · workspace / public" | 08 | CONFIRMED |
| Not your workspace | XS-06 in place | 08 | CONFIRMED |

### 7.3 Stale and concurrent changes [UNRESOLVED, AD-20]

B6 and B7 draw no stale or concurrent state. `surface-reviewer-cm.json#openQuestions` lists "concurrent decision (two reviewers or CM acting on a stale record), record no longer in your scope … failed decision" as not designed. The one shared world makes these real in sample mode under option B (two tabs) and in tests. Under option A they arise only through fixtures. With the API they arise for real users. Examples:

- the SA decides REQ-0042 in tab 1 while tab 2 still shows the decision panel;
- the CM withdraws UPD-0005 while the Reviewer has RV-04 open;
- the SA withdraws a reviewer's scope.

**Safe treatment using only drawn states** [PROVISIONAL]:

1. Every command re-validates against the latest world under the lock (§1.4) and returns `invalid-state` with the current status.
2. The UI closes the open dialog. Focus returns to the page's status region, or to the H1 if the trigger has gone (board 10 return-to-trigger otherwise). The UI then refetches and renders **the record's current drawn state**:
   - "Decided" read-only (B1-11 f9; RV-06; B7-10 f3);
   - "Still in academic review — read-only" (B6-11 f5);
   - "Nothing to decide" (B7-10 f4);
   - "hasn't reached BITS yet" (B7-10 f14);
   - "An update is in progress → Open update" (B6-11 f9).
3. Tabs that are only reading update through the cross-tab broadcast, before anyone acts.
4. A record that leaves a reviewer's or CM's scope renders the workspace not-found pattern until the owner decides otherwise (AD-23).
5. **No new copy is invented.** A one-line explanation such as "This changed while you were looking" needs owner approval (AD-20).

### 7.4 Failure injection (tests only) [PROVISIONAL]

`@xr/sample-platform` accepts a test-only fault plan (`failNext('access.giveAccess', 'unavailable')`), reached through the CI-only test hooks (§2.5). Every drawn failed / retry frame gets exercised in CI. There is no product control, and hosted builds have no fault injection.

---

## 8 · How later phases plug in [PROVISIONAL]

1. **HTTP adapter.** `apps/web/src/platform/http/<port>.ts` implements the same `@xr/contracts` port with `fetchApi(path, schema)` (`1b090c9:v2/apps/web/src/lib/api-client.ts`). A ProblemDetails → `Refusal` mapper uses `type` URIs. The composition root selects `sample | api` from a new `NEXT_PUBLIC_XR_DATA_SOURCE` in `webPublicEnvSchema` (AD-11, TE-7). Screens and query hooks do not change.
2. **Contracts graduate.** When an `apps/api` endpoint exists, its DTO schemas move from `@xr/contracts/draft` into `WIRE_CONTRACTS`, with strict OpenAPI conversion (ARCH §5/§6).
3. **Rules are not duplicated.** `apps/api` loads the same inputs from its repositories and calls the same per-command `@xr/domain` decision functions and policies inside its application layer, and its own completion handler writes ⑤. It never loads a whole world; the API is stateless (ARCH §3). Authorization comes from the server-resolved `Principal` (ARCH §9). The mock's actor resolution mirrors that, and the port signatures never carry the actor.
4. **One contract suite.** The framework-free suite in `@xr/contracts/draft` runs against the mock (in `@xr/sample-platform`'s tests, node) and against a test API (in `apps/web`'s tests, through `src/platform/http`). Parity is proven per port before the mock is retired (inventory §V "contract suite"). The suite outlives `@xr/sample-platform`.
5. **Freshness.** Mutation receipts keep returning `changed` types. For other users' changes the HTTP adapter adds refetch-on-focus plus polling or SSE (an engineering decision at that time). Query keys and `meta.deps` stay.
6. **Identity.** An OIDC adapter replaces TE-1 (E-02 BFF vs browser tokens). XS-01's SSO button becomes real and e-mail sign-in follows T-10. XS-05 and XS-03 are unchanged.
7. **Runtime.** Web and native runtimes post `runtimeEventInputSchema` (DRAFT, 1b090c9) to the API. TE-3 and the `(sample-runtime)` route are deleted. The completion trigger becomes the decided T-12/A-06 contract, and the API's completion handler writes ⑤.
8. **Server rendering.** Public pages return to server components that call the HTTP adapter, which closes AD-12 and TE-8.
9. **Retirement.** `@xr/sample-platform` is removed from `@xr/web`'s dependencies, TE-1…TE-8 are closed, and the test hooks are either removed or re-pointed to API seed endpoints in test environments only.

---

## 9 · Slice-1 salvage (non-visual only, after review)

The source is `wf/understand/repo-baseline.json#slice1` (71 entries: 9 SAFE · 24 SALVAGE_WITH_CHANGES · 38 DISCARD). The classification is taken from repo-baseline.json; six files were re-read for this design (listed in §12). Salvage means a **deliberate copy-in on a new branch**, never a merge or checkout of `v2/connected-frontend-slice1` (repo-baseline.json#recommendation). [CONFIRMED classification · PROVISIONAL landing places]

| Slice-1 file(s) | Class | Lands in | Required changes |
|---|---|---|---|
| `packages/domain/src/access/term.ts` (+ `term.test.ts`) | SAFE | `@xr/domain` `institution/term` | v46 words (Access active / Ending soon / Access ended; Paused is an institution state). Owner sign-off on CF-06 "unreadable end = expired" |
| `packages/domain/src/access/isolation.ts` | SAFE | `@xr/domain` policy helpers | campus → institution |
| `apps/web/src/services/access/context.tsx` | SAFE | `apps/web/src/platform/PlatformProvider` | Generalise to all ports and the session |
| `apps/web/src/demo/storage.ts` | SAFE | `@xr/sample-platform/persistence` (browser driver, used only if AD-07 authorises option B) | Drop "demo" naming; fix the stale comment |
| `apps/web/src/test-support/memory-storage.ts`, `next-mocks.tsx`; dialog-polyfill hunks of both `vitest.setup.ts` | SAFE | Test support | Polyfill only if native `<dialog>` is used (boards draw `div role=dialog`) |
| `packages/domain/src/access/{model,formats,assignment,entitlement,integrity,index}.ts`, `access.test.ts` | SALVAGE | `@xr/domain` `access/` | ACC = experiments × formats; SACC target student or group; formats inherited; remove `no-place-remaining` and placesBefore/After; per-grant results; WEB·AR·VR·MR display order; drop over-allocation-as-corruption; rewrite SCENARIO I |
| `packages/domain/src/access/places.ts` | SALVAGE | `ProvidedLicenceFigures` display type | **No derivation, no "remaining" arithmetic** (T-06/D7) |
| `apps/web/src/services/access/types.ts` | SALVAGE | `@xr/contracts/draft` ports | Split into 18 ports; 7 roles; Refusal aligned to ProblemDetails; keep "caller never a parameter" |
| `apps/web/src/services/access/queries.ts` | SALVAGE | `apps/web/src/queries` | Generalise the session-keyed keys; replace `['access']` invalidation with `meta.deps` |
| `apps/web/src/demo/world.ts`, `world-store.ts` | SALVAGE | `@xr/sample-platform` world + store | All records (incl. RES activity and CompletionRecord); memory driver by default; envelope versioning, BroadcastChannel + locks only behind the option-B driver (AD-07, TE-6); **no notices in product chrome**; rename away from "demo". repo-baseline.json already asked to "confirm with the owner that browser persistence of the sample world is acceptable" |
| `apps/web/src/demo/runtime.ts`, `runtime-provider.tsx` | SALVAGE | Composition root / PlatformProvider | Remove `useDemoWorld` and raw world access from anything a screen can reach; key by session |
| `apps/web/src/demo/access-adapter.ts` | SALVAGE | `@xr/sample-platform` handlers (access port) | Remove the inactive-IA read block (B1-09 f7 shows sign-in + banner); per-grant data, not per-experiment aggregation; v46 ids; no arithmetic |
| `apps/web/src/demo/identity-store.ts` | SALVAGE | `apps/web/src/platform/session-store.ts` | Memory per tab by default; `sessionStorage` per tab under option B; backs XS-01 only; no switcher |
| `apps/web/src/demo/access-adapter.test.ts`, `world-store.test.ts`, `test-support/render.tsx` | SALVAGE | Contract suite (`@xr/contracts/draft`) / store tests / `renderScreen` | Remove place expectations; the access cases become contract-suite cases run against the mock and HTTP |
| `v2/docs/OPEN_DECISIONS.md` (A-22, Part E), `FUNCTIONAL_PARITY_MATRIX.md` edits, `CAPABILITY_REGISTER.md`, domain README / index hunks | SALVAGE | Re-applied as **edits** on the new branch | CF-01 → TE-1; CF-02 → TE-2; CF-03 → T-36 seed; drop CF-04; rewrite CF-06; restart the register against the 147 ids |
| `apps/web/src/demo/seed.ts` | DISCARD | — | Its edge cases only, re-expressed as command-script fixtures |
| All Slice-1 UI: `packages/ui/src/*.tsx`, `cx.ts`, `primitives.test.tsx`, `tokens.css` block, `index.ts` exports; `app/(connected)/**`; `demo-bar.tsx`; `demo-accounts-screen*`; `features/**`; `copy.ts`; `globals.css` `@source` hunk; README sentences; `e2e/connected-slice1.spec.ts` | DISCARD | — | Never reused. The e2e step list survives only as Flow B acceptance ideas |

**Must not be carried, in any form** [CONFIRMED]:

- `places.ts` arithmetic, the `no-place-remaining` refusal, and SCENARIO I (they encode D7 counting that v46 forbids, T-06);
- DEMO strip, account chooser and `/demo`;
- "demo" naming in product-reachable code;
- storage notices in product chrome;
- the inactive-Institute-Admin read block;
- per-experiment aggregation (latest term end, union of formats);
- "campus" and "learner places" wording;
- Slice-1 token values;
- the Slice-1 seed as the product seed.

---

## 10 · Handoff defects and gaps this architecture depends on (report to the owner; the board wins)

| # | Defect / gap | Board evidence | Architecture treatment | Status |
|---|---|---|---|---|
| HD-1 | `flows.json` D4 and B8-04 say "FA-12 (release)", as if Faculty releases | B4-06 f7–f9 and B4-14 f6 have no Release control; FA-19 "Released to Rahul … — when the deadline passed" | D4 is a derived release; no command | CONFIRMED defect |
| HD-2 | `entities.json` RUN ownerWriter "Student" | B3-03 f3 "Completion comes only from the simulation (T-12)"; BC3 | RUN written by runtimes only; the Student is the subject | CONFIRMED defect |
| HD-3 | `entities.json` status words are incomplete and single-perspective | B2-05 f11 "Waiting for a licence"; B1-08 f1 "Submitted", f7 "Payment failed"; B3-09 "Waiting on you"; B7-05 "Waiting for your decision"; B6-11 f3 "Back for a re-check"; B7-10 f10 "no scope" ("Scope active" is drawn nowhere) | Canonical states + role label table (§5.4) | CONFIRMED defect |
| HD-4 | `flows.json` B3 "Experiment × format grant" | B2-05: formats inherited, no picker (LD-1) | `giveAccess` takes experiments, not formats | CONFIRMED defect |
| HD-5 | `flows.json` / B8-04 trace only E's happy path | B5-06 f6/f7; B6-11 f3: CM send-back to Vendor and re-check are drawn | E-alt1/E-alt2 added to flow tests | CONFIRMED gap |
| HD-6 | `screens.json` XS-03 `/signed-out` page | B1-09 f10: a notice on Sign in | No route | CONFIRMED defect |
| HD-7 | PU-10 keyed by reference; T-01 text "Reference-number link" | B1-07 / B1-08: "the reference … does not open the page on its own" | Capability-free `/requests/status` resolving the session's ticket; no bearer URL (AD-13) | CONFIRMED tension |
| HD-8 | `navigation.json` "Request access → PU-08" | Boards' header link goes to PU-07 (Understand finding) | Follow the board | CONFIRMED defect (Understand stage) |
| HD-9 | No id for the Student hub Assessment tab or the B1-02 Area Explorer | B4-11 f7–f9; B1-02 | Route added; reported as a register gap | CONFIRMED gap |
| HD-10 | "BITS started reviewing" event has no trigger | B1-13 timeline (5 Oct) | AD-14 | UNRESOLVED |
| HD-11 | 19 non-literal `proposedRoute` values; 18 intermediate paths | `handoff-consistency.json#routeIssues` | §6.7 | CONFIRMED |
| HD-12 | Who reopens a support report | 07 (Super Admin) vs B7-09 "Reopened by the reporter" | AD-26 | UNRESOLVED |
| HD-13 | Persistence wording differs. B8-06 "Mock services": "… grading automation and persistence stay out until decided". `handoff/README.md` item 9 and BC10 say "backend persistence" | B8-06 | BC10 (owner) governs what is excluded. B8-06's "until decided" makes browser persistence an owner decision (AD-07); option A until then | CONFIRMED difference (reported) |

---

## 11 · Owner decisions this deliverable needs

| Id | Decision | Related ids | Recommended |
|---|---|---|---|
| AD-01 | Put mock services in a new package `@xr/sample-platform` instead of `apps/web/src/sample/`. This needs the full edit set of §1.2: matrix row, `@xr/web` list entry and `FORBIDDEN_THIRD_PARTY` entry; the `WorkspacePackage` union; `tsconfig.build.json` (composite, noEmitOnError, references); `tsconfig.solution.json`; `eslint.config.mjs`; an `exports` map; and an ARCHITECTURE §6 row | ARCH §3/§4/§6; repo-baseline ownerDecisions; CF-02; `boundaries.test.ts` | Package |
| AD-02 | Put port interfaces, draft DTO schemas and the framework-free contract suite in `@xr/contracts`, exposed by a new `"./draft"` subpath export (today only `"."` is exported); not in `WIRE_CONTRACTS` / OpenAPI until served. Alternative: a `DRAFT` namespace re-exported from the root | ARCH §4/§6; `resolved-boundaries.mjs` (`notExported`) | `./draft` export |
| AD-03 | TE-1 sample sign-in on XS-01: credential rule (any non-empty password vs one published sample password); the institution sign-in follows the drawn f0 → f5 → f6 sequence (alternative: permanent f6, which hides the BR-008 entry) | T-10, A-01, CF-01, ARCH §10/§14; BR-008 | Any non-empty; f0 → f5 → f6 |
| AD-04 | TE-2: record mock services evaluating domain rules in the browser as an exception, with removal trigger "API serves every port" | ARCH §3/§4; CF-02 | Record |
| AD-05 | TE-3 runtime stand-in, **activity only**: a fenced `(sample-runtime)/runtime/web` route emits launch and session events, never completion. Completion and headset events come only from fixtures and CI hooks. Every stand-in event carries sample provenance while the production source ids stay unchanged. The owner also decides the stand-in page's neutral content, and the FUNCTIONAL_PARITY_MATRIX §G amendment | T-12, A-06, BC3, `events.ts`, FPM §G / P-12 | Record |
| AD-06 | TE-4 payment outcome stand-in ("confirmed" in hosted builds; failure states via CI hooks or fixtures only) | T-05, R06 | Record |
| AD-07 | **Browser persistence needs owner authorisation.** Until then, option A: an in-memory world per tab and a session in memory (reload = spine-start). If authorised, option B and TE-6: a versioned `localStorage` world, BroadcastChannel, Web Locks and a per-tab `sessionStorage` session. The owner should also accept the per-tab consequences (§2.3: new tabs carry no session; deep links in new tabs need sign-in; SEL/ticket may not carry to a new tab). Inventory v3 Phase 0 asked for "one persistent sample world"; B8-06 keeps persistence out until decided | BC10, BC14; B8-06; FPM §G; HD-13; repo-baseline `world-store.ts` | Authorise option B (recommended for reviewability); build option A until then |
| AD-08 | "Spine-start" canonical seed: nothing Flows A/B create exists at the start; the flow records come from a scripted walk with reserved board references and marked untraced setup steps; a separate "later sample" fixture; anchor date; reconcile the sample timeline | T-36; OD-B6-12, OD-B7-08, OD-B7-14, OD-B7-15, OD-B4-16 | Accept + pick anchor |
| AD-09 | TE-5 anchored sample clock (anchor + real elapsed); time travel in CI tests only | ARCH §14 | Accept |
| AD-10 | Test hooks behind `NEXT_PUBLIC_XR_TEST_HOOKS` exist **only in CI/Playwright builds, never in any hosted build** (owner review included). Accept the list of drawn states that a hosted live walk cannot reach (§2.5) | ARCH §14; turbo strict env; TE-7 | Accept |
| AD-11 | Data-source switch `NEXT_PUBLIC_XR_DATA_SOURCE = sample \| api` in `webPublicEnvSchema` (TE-7) | ARCH §14; `env/index.ts` | Accept |
| AD-12 | Public pages render on the client in sample mode; server rendering returns with the API (TE-8) | ARCH §4 | Accept |
| AD-13 | PU-10 / PU-12 on capability-free routes (`/requests/status`, `/requests/status/payment`) that resolve the ticket held in this browser session; a signed-in IA of that institution reaches them from IA-17; no URL works as a bearer link; otherwise → not-found pattern | T-01, R01; B1-07 / B1-08; B3-08 f6 | Accept |
| AD-14 | What triggers "BITS started reviewing" (requester "Submitted" → "Under review") | B1-13 | Owner |
| AD-15 | Confirm that D4 releases by the assessment's own setting only; correct `flows.json` D4 / B8-04 | HD-1; BR-079 | Confirm |
| AD-16 | The portal "Launch WEB" stores nothing; In progress comes only from runtime events (vs the B3-03 canvas script setting In progress on launch) | T-12, OD-B3-07; `surface-student.json#openQuestions` | Runtime only |
| AD-17 | "Waiting for a licence" appears only as a seeded value in the later-sample fixture (Arun Kumar under SACC-0311; SACC-0313/0314); new grants are Active in the mock | D7, T-06, OD-B2-03 | Accept |
| AD-18 | Student-side outcome of overlapping grants. Interim: any active grant gives access. SACC-0311 exists only in the later-sample fixture (12 Oct), created by a real group `giveAccess`, so the 9 Oct withdrawal (B2-13 f0–f3) stays true. No Student-side overlap screen is drawn or seeded | OD-B2-01, OD-B2-02 | Owner |
| AD-19 | Unsaved-changes policy (interim: no prompt; drafts kept per tab; Cancel discards) | AR-5; `surface-vendor.json#openQuestions` | Owner |
| AD-20 | Stale / concurrent change: refetch and render the drawn current state; whether a one-line notice may be added | B6-11 f5/f9; B7-10 f4/f14 | Owner |
| AD-21 | Session expiry policy and return-address rule (honour `returnTo` only inside one's own workspace) | QT-13; BR-008 | Owner |
| AD-22 | Feedback eligibility after the format is Completed but access is later paused, withdrawn or ended | BC5; BR-047 | Owner |
| AD-23 | A record that leaves a Reviewer's or CM's scope mid-task (interim: workspace not-found pattern) | B7-08; `surface-reviewer-cm.json#openQuestions` | Owner |
| AD-24 | Adopt the canonical state × viewer-role label table as the status vocabulary source | HD-3; B8-03 | Accept |
| AD-25 | Internal role id `tenant_admin` vs rename; WEB·AR·VR·MR as presentation order | A-20; BC1; B8-03 | Owner (carried) |
| AD-26 | Who may reopen a support report | 07 vs B7-09 | Owner |
| AD-27 | Precedence of format / experiment availability reasons when several apply | §5.3; board 08; B3-03 / B3-04 | Accept proposed order |
| AD-28 | FA-21 route carries experiment context | `routeIssues` FA-21 | Accept |
| AD-29 | In the mock, any person or role holder with an e-mail can sign in (no activation step) | T-11, OD-B7-11 | Accept |
| AD-30 | STK31-28 15-day reminder: v46 "Reminder due" only; the reminder is recorded as an unmet production requirement (channel ND-16). Also from STK31-28: its lifecycle labels "Active · Expiring soon · Expired · Renewed" differ from the v46 words used here (Access active · Ending soon · Access ended; no "Renewed") | `decisions-rules.json#conflicts`; B7-09; B7-10 f13 | Owner |
| AD-31 | **Stakeholder conflict (flagged, not resolved).** 07.3 R16 lets the Content Manager edit or replace a delivery link directly. v46 M-1 / BR-108 routes "Edit delivery link" through the correction chain (F1), so a broken link cannot be fixed without review + release (D-09-6 open) | `decisions-rules.json#conflicts` "Content Manager editing / replacing a delivery link"; B6-08; B6-11 | Build per v46 pending owner |
| AD-32 | **Stakeholder conflict.** 07.2-F / 07.3 R17 give the Super Admin an "ultimate superpower" over content. v46 M-1 / OD-B7-09 allows an override only for stuck, non-published records, back to the vendor (E-alt3) | `#conflicts` "Super Admin override"; B7-10 f6 | Build per v46 pending owner |
| AD-33 | **Stakeholder conflict.** 07.2-E says the platform course code belongs to the "Content Manager primarily. Super Admin will also get access to it". v46 M-2: the CM is the single writer and the SA is read-only (§4.9 `savePlatformCodes`). The writer set is kept as policy data | `#conflicts` "Super Admin authority over the platform course code"; B6-10; B7-07 | Build per v46 pending owner |
| AD-34 | **Stakeholder conflict.** PM-09 sequential gating (Resources → Simulation → Assessment → Completion; D-07/D-08/D-19/D-20) vs T-16 "no locks; default order" and BC4 (Flow C) | `#conflicts` "Sequential gating / progression model"; B3-02 | Build per v46 + BC4 pending owner |
| AD-35 | **Stakeholder conflict.** PM-08 keeps a "timer" as a capability the configuration model must support; v46 T-22 has no timer (D2). The data model does not preclude a per-assessment limit later | `#conflicts` "Assessment timer"; B4-12 | Build per v46 pending owner |
| AD-36 | **Stakeholder conflict.** STK31-26 Student CSV: Semester and Organisation optional, Plan Terms "if possible". v46 B2-07: exactly six required columns (B3 `importStudents`) | `#conflicts` "Student CSV columns"; B2-07 | Build per v46 pending owner |
| AD-37 | **Stakeholder conflict.** STK31-21 / STK31-24: the SA creates and governs tenants and allocates content directly. v46 T-09 creates institutions only by approving a request (A3), with no plan amendment (T-08) and Pause / Restore instead of termination | `#conflicts` "Super Admin tenant creation …"; B1-13; B7-04 | Build per v46 pending owner |
| AD-38 | Deterministic scoring of choice questions in the mock is drawn v46 behaviour (B4-09 f0 "choice questions are marked automatically"). It is read as **not** the "grading automation" that BC10 excludes (AI or auto-review of written answers, STK31-31 / T-23; no suggested marks) | BC10; B4-09; `#conflicts` "Auto-review of written answers" | Owner to confirm |
| AD-39 | Is learning completion (⑤) a **stored system fact**, written by a completion handler (this design, following BC3 "set by the system … never derive one from another")? Or is it a **derived read model**, as committed ARCH §8 ("progress (per technology) … Derived, never stored as truth") and `utilisation.ts` (`COMPLETED` from the event fold) say? The T-12 trigger stays open either way | BC3; BR-024; ARCH §8; `utilisation.ts`; T-12 / A-06 | Stored system record (BC3) |
| AD-40 | May a hosted reviewer build show a live "Completed" (and payment f6/f7, failure frames)? If yes, record an exception for reviewer-build controls. It must name who triggers them (never the signed-in Student) and keep them outside product chrome and outside the Student's run screen (FPM §G) | BC3; ARCH §14; FPM §G; §2.5 | No (fixtures and CI only) |
| AD-41 | **Stakeholder conflict.** STK31-33 drafts AI questions from an uploaded source document. v46 B4-08 / OD-B4-12 drafts from the lab brief or pasted text, with no upload (FA-16, TE-2) | `#conflicts` "AI question drafting sources" | Build per v46 pending owner |
| AD-42 | **Stakeholder conflict.** STK31-29 / STK31-43 ask for "time spent / usage indicators", and 07.3 R07 for the technology actually used when marking. v46 shows per-format progress and counts only (FA-20 / FA-21, IA-20, `usage`) | `#conflicts` "Faculty 'time spent' and technology actually used"; OD-B3-07 / OD-B3-08 | Build per v46 pending owner |
| AD-43 | **Stakeholder conflict.** 07.2-A: on reselect, show the existing plan and offer "request additional licences". v46 B1-05 waits on requester identity (T-01 / R01); more licences are asked from IA-17 (Flow A1) | `#conflicts` "Re-requesting an experiment the institution already holds" | Build per v46 pending owner |
| AD-44 | **Stakeholder conflict.** STK31-25 / PM-10 list institution SSO set-up as an Institute Admin responsibility. v46 IA-22 is not designed (DEFER, A-01); identity in §2 has no SSO set-up | `#conflicts` "Institute Admin SSO / institution set-up" | Production gap; owner |
| AD-45 | Acknowledge that STK31-38 (the Super Admin reviews device transfers directly) is treated as superseded by the later 07.2-C (Institute Admin as point of contact), which v46 follows (Dv2) | `#conflicts` "Device-transfer routing" | Acknowledge |

---

## 12 · Counts and verification notes

- **Flows covered:** all 27 steps of `flows.json` (A 4 · B 4 · C 3 · D 4 · E 5 · F 4 · Device 3), plus drawn alternates not traced in `flows.json` (B-withdraw, E-alt ×3, F-alt, Hold / Lift hold). That makes 39 sequence rows in §4.2–§4.8, plus 10 cross-cutting rows in §4.9.
- **Untraced walk steps:** 7 setup steps (S1–S7 in §3.3) that `flows.json` does not trace, plus one later-sample fixture.
- **Ports:** 18 (the 14 named on B8-06, plus identity, catalogue, selection, runtime).
- **Exceptions to record:** 8 (TE-1…TE-8; TE-6 only if AD-07 authorises option B).
- **Handoff defects / gaps:** 13 (HD-1…HD-13).
- **Owner decisions:** 45 (AD-01…AD-45), including 13 stakeholder ↔ v46 items flagged without resolving them (AD-30…AD-37, AD-41…AD-45).
- **Invariant tests:** 12 (§5.5).
- **Slice-1:** 9 SAFE · 24 SALVAGE_WITH_CHANGES · 38 DISCARD (unchanged from repo-baseline.json).
- **Spot-checked against the boards for this document:**
  - B4-06 / B4-14: no Release control (button grep: 0 hits); "when the deadline passed" in B4-14.
  - B3-03 f3: no "I have finished".
  - B1-09 f0–f10 captions.
  - Board 05 account menu template.
  - Board 08 message family and "In context" rule.
  - B1-06 "Persistence".
  - B1-07 / B1-08 reference-is-not-a-key text.
  - B1-13 requester-vs-SA status table.
  - B4-09 "choice questions are marked automatically".
  - B6-11 / B7-10 critical-state captions.
  - B2-05, B2-13, B3-07, B3-09, B3-12, B6-07, B6-08, B6-12, B6-13, B7-04, B7-11 frame captions.
  - `1b090c9`: `boundary-matrix.mjs`, ARCHITECTURE §3/§4/§6/§8/§9/§10/§13/§14, `providers.tsx`, `api-client.ts`, `problem.ts`, `roles.ts`, `technology.ts`, `runtime/events.ts`, `runtime/utilisation.ts`, `runtime-events.ts`, config env schema.
  - Slice-1 working-tree files: `services/access/types.ts`, `queries.ts`, `demo/runtime-provider.tsx`, `identity-store.ts`, `world-store.ts`, `world.ts`.
  - Re-checked in the final edit: B1-08 f0/f5–f9 and the "Who can open this page" note; B1-09 f0–f12; B1-10 f0; B7-00 Requests count; B1-13 "four separate events" and the REQ-0042 history; B2-00 "Sample world"; B2-04 later-sample notes and grant data; B2-08 GRP-0012; B2-09 FMAP-0021; B2-13 f0/f1/f8; B3-01 resource note; B3-02 "Never shown"; B3-03 f0/f3/f6; B3-04 f0/f2; B3-05 f0/f9; B3-07 f0–f3 and the authorised-device text; B3-08 f6; B3-12 C3 row and f3–f5; B4-06 "No defaults" / "New draft · nothing pre-filled"; B4-09 f0/f6; B4-10 "Opened 12 Oct 2026, 09:40"; B4-11 f3/f4/f7/f10/f11/f15; B4-12 "No timer" / "Faculty only — open question"; B5-06 f2/f4/f7/f9; B6-00 update samples; B6-12 Vendor view text; B8-03 scans; B8-06 "Mock services"; an id census over all boards (REQ, SUB, UPD, DTR, ATT, SACC, ASMT, ACC, SUP).
  - `1b090c9` re-checked: `packages/contracts/package.json` (exports `"."` only); `config/eslint/rules/resolved-boundaries.mjs` (`notExported`); `config/eslint/boundary-matrix.mjs`; `config/eslint/boundaries.d.mts` (closed `WorkspacePackage` union); `config/src/boundaries/boundaries.test.ts` (auto-discovery, composite / noEmitOnError / references, solution references, `@xr/domain` = `[]`); `tsconfig.solution.json`; `config/src/env/index.ts`; `docs/ARCHITECTURE.md` §3/§4/§6/§8/§14; `docs/FUNCTIONAL_PARITY_MATRIX.md` §G and P-12; `domain/src/runtime/events.ts` and `utilisation.ts`; `apps/web/package.json` (`next` 16.3.4); `apps/web/src/app/providers.tsx`.
  - `wf/understand/decisions-rules.json`: `businessRules` statuses (BR-017, 031, 037, 065, 070, 078, 087, 099, 111 PROVISIONAL; BR-008, 024, 071, 076, 079 CONFIRMED-STAKEHOLDER; BR-100 CONFIRMED-DESIGN) and all 24 `conflicts`; `open-decisions.json` OD-B3-03, OD-B2-01, T-12, T-18.
- **Not done:** no code was run; no route was built; Next.js 16 behaviour of route groups, client layouts, `useSyncExternalStore` and `Suspense` around `useSearchParams` is assumed from the App Router model, not tested.

---

## 13 · Verification log

The verifier report (`wf/verify/architecture.json`) listed 24 corrections: 1 critical, 8 major and 15 minor. Each one was re-checked against the cited board, handoff file or `1b090c9` path before it was applied. **24 APPLIED · 0 REJECTED.** Several were applied more widely than the verifier asked, so that the document stays consistent; the "Extension" notes say where. No binding constraint was weakened. Three were tightened: BC3 now governs completion and the stand-in; BC10 / B8-06 govern persistence; and the owner rule on stakeholder conflicts now covers 13 items.

| # | Severity | Correction | Verdict | Evidence re-checked · where applied |
|---|---|---|---|---|
| V-01 | critical | The TE-3 WEB stand-in, opened from the Student's own "Launch WEB", was the only sample path to `SIMULATION_COMPLETED`, and it stamped those events with the production source `web-runtime` | **APPLIED** | BC3 (START-HERE); B3-03 f3 note "Completion comes only from the simulation (T-12). No 'I have finished' button"; FPM §G row "In-page stand-in completion control on the Student's run screen"; `events.ts` RUNTIME_SOURCES comment; FPM P-12 "stand-ins never presented as device traffic"; B8-03 "Developer / demo wording 0". Applied in R7, §1.2 sample-runtime row, §1.4, §2.5, TE-3, C2a–C2d (C2c actor = System; status CONFIRMED · PROVISIONAL · UNRESOLVED T-12), §5.5 invariant 12, AD-05, AD-40 |
| V-02 | major | Completion (⑤) was typed as derived from runtime activity (④) and marked CONFIRMED, against BC3 | **APPLIED** | BC3; BR-024 (CONFIRMED-STAKEHOLDER); ARCH §8 "Derived, never stored as truth … progress (per technology)"; `utilisation.ts` header. Applied in R11, §1.3 `completion/` and `runtime/`, §1.4 handler row, §5 intro, §5.1 CompletionRecord, §5.2 row ⑤, §5.3 `formatProgress` / `feedbackEntry` / `usage`, §5.5 invariants 2, 3, 7 and 11, §8 items 3 and 7, AD-39 |
| V-03 | major | Browser persistence was presented as fitting the constraints. B8-06 says "persistence stay out until decided", and FPM §G excludes the `localStorage` schema chain | **APPLIED** | B8-06 "Mock services" text; FPM §G row; handoff README item 9 ("backend persistence"); repo-baseline `world-store.ts` note. Option A is now the default and option B is an owner-authorised upgrade. Applied in R5, §1.4, §2.3, §3.1, §3.2, TE-6, §9 rows, HD-13, AD-07 |
| V-04 | major | The spine-start seed contradicted Flows A/B: Godavari and its dependants cannot exist before REQ-0042 is approved, and a pre-seeded SACC-0311 breaks B2-13 f0–f3 | **APPLIED** | B1-13 "Institution record (created at the first approval of a new institution)"; B2-00 "new institution created by approving REQ-0042 … 12 students imported on 8 Oct 2026"; B2-04 "Later sample · 12 Oct 2026"; B2-13 f0 "his group has no grant yet"; B3-03 f6 "(later sample)". Applied in R8, §3.3 (dependants listed, scripted walk with S1–S7 untraced steps, later-sample fixture), B3 / B5-alt rows, AD-17, AD-18. *Extension:* S7 (the initial authorised VR device has no designed command) is reported as a gap |
| V-05 | major | `@xr/contracts` exports only `"."`, so `@xr/contracts/draft/*` imports fail `xr/resolved-boundaries` (`notExported`). The matrix-change list was incomplete, and "the test must list it" was inaccurate | **APPLIED** | `1b090c9` `contracts/package.json`; `resolved-boundaries.mjs` header and `notExported` message; `boundaries.test.ts` (auto-discovers packages; composite / noEmitOnError / references; solution references); `boundaries.d.mts` union; `tsconfig.solution.json`. Applied in R2, R3, §1.1, §1.2 Ports and Mock-adapter rows, AD-01, AD-02 |
| V-06 | major | World types sat in `@xr/sample-platform`, but `@xr/domain`'s `decide(command, world)` needed them, which would be a forbidden domain → sample-platform import. §8 item 3 also implied a whole-world API | **APPLIED** | `boundary-matrix.mjs` `'@xr/domain': []`; `boundaries.test.ts` `toEqual([])`; ARCH §3 "The API is stateless". Applied in R1, §1.1, §1.2 Domain row, §1.3 Pattern, §1.4 step 5, §8 item 3 |
| V-07 | major | Test-hook scope against ARCH §14 was ambiguous, and the new `NEXT_PUBLIC` flags and client-rendered public pages had no exception | **APPLIED** | ARCH §14 text; ARCH §4 "server-rendered"; `env/index.ts` "there are no prototype flags"; `webPublicEnvSchema` has two keys. Applied in §1.2 Composition root, §2.5 (CI-only rule plus the list of unreachable states), TE-4, TE-5, TE-7, TE-8, §7.4, AD-10, AD-11, AD-12, AD-40 |
| V-08 | major | Seven stakeholder ↔ v46 conflicts touching these flows were marked CONFIRMED, not flagged | **APPLIED** | `decisions-rules.json#conflicts` (24 entries read). Applied in the §4.1 legend; rows A3, B3, D2, E-alt3, F1, the §4.9 `savePlatformCodes` row and the Flow C note; AD-31…AD-37. *Extension:* five more conflicts that touch these flows were flagged the same way: AD-41 STK31-33 (FA-16), AD-42 STK31-29/43 and 07.3 R07 (usage / FA-20/21), AD-43 07.2-A (A1), AD-44 STK31-25 (identity), and AD-45 STK31-38 (superseded; acknowledge). AD-30 now also covers the STK31-28 lifecycle labels |
| V-09 | major | The WEB stand-in page had no route and no allowed home | **APPLIED (option a)** | `boundary-matrix.mjs` FRAMEWORK_WEB includes `next`, `react`; B3-03 f0 "opened in a new tab". A fenced `(sample-runtime)/runtime/web` route is added (§1.2, §6.1), reaching the runtime port only through `PlatformProvider`; the §1.2 fence wording is updated; the launch-nonce handover is in §2.3 |
| V-10 | minor | A2 "SA nav count 3 → 4" should be 2 → 3 | **APPLIED** | B1-10 f0 note "Nav count 3 = requests under review"; B7-00 "3 under review — REQ-0042, REQ-0040, REQ-0038". A2 row; §3.3 |
| V-11 | minor | A3 attached the internal-route activation to ACC-0107 | **APPLIED** | B1-08 f8 "Plan ACC-0107 exists"; f9 "Internal route … Sample: REQ-0039"; B1-13 event 4. A3 row |
| V-12 | minor | Per-prefix counters do not reproduce the board references, because the boards show higher ids such as REQ-0058 and SUB-0079…0086 | **APPLIED** | Id census over all boards (REQ-0058 ×54; SUB 79/81/83/85/86; UPD 6/7; DTR-0019; ATT-0451; SACC 312–314); B3-08; B7-00. R8, §3.3 Ids, §3.4 |
| V-13 | minor | Rules that `decisions-rules.json` marks PROVISIONAL, or that rest on an open decision, were presented as CONFIRMED | **APPLIED** | BR-078, BR-087, BR-099, BR-111 = PROVISIONAL; B4-11 f15 "The make-available step itself is open (T-18)"; OD-B3-03 "Assumed one … Labelled as an assumption". D1, D2, F-alt, Dv1, `assessmentForStudent`, §1.3 assessment, §6.2 row. *Extension:* the same check re-marked A2 (BR-031), A4 (BR-037), E1 (BR-017), C1 (BR-070) and `usage` (BR-065) |
| V-14 | minor | C3 dropped ST-15 as a feedback entry point | **APPLIED** | `flows.json` C3 "ST-10 / ST-15 → ST-16 → ST-17"; B3-05 f0 "Give feedback on WEB", f9 "Give feedback on VR". C3 row, `feedbackEntry`, §1.5 meta.deps (ST-15 row) |
| V-15 | minor | The Vendor label after a resubmit was wrong | **APPLIED** | B5-06 f4 "Submitted (after the resubmit) — neutral; no gate named (M-3)"; B6-12 Vendor view; BR-100. §5.4 now has a revision-1 row and a revision-2 row, with a revision- and origin-aware key |
| V-16 | minor | "With the default 'After the deadline'" called a sample value a default | **APPLIED** | BC6; BR-076; B4-06 "New draft · nothing pre-filled". §3.5 |
| V-17 | minor | The PU-10 ticket in the URL path worked as a bearer link | **APPLIED** | B1-08 "does not open the page on its own. No reference lookup, OTP, magic link…"; B1-07 "continues from this session … promises no link"; B3-08 f6 "Open the payment page". §6.1, §6.4, HD-7, AD-13 |
| V-18 | minor | A permanent f6 default hid the stakeholder-confirmed institution sign-in entry | **APPLIED** | BR-008 (CONFIRMED-STAKEHOLDER); B1-09 f0 controls; f5 / f6 notes; B8-03. §2.2 row, R6, AD-03 |
| V-19 | minor | The RES record was missing from the shared records and from RecordType | **APPLIED** | B4-10 "Opened 12 Oct 2026, 09:40"; B3-01; ARCH §8 `ResourceActivity`; `flows.json` C1 "EXP · RES". §1.3 `resources/`, §1.4 row, §1.5 RecordType and meta.deps (ST-05/06, FA-21), §3.2, C1, invariant 2 |
| V-20 | minor | The per-tab session consequences were not stated | **APPLIED** | B1-06 "browser session"; B3-03 f0 and B3-01 "opened in a new tab". §2.3 (new tabs, deep links, SEL/ticket, launch nonce over BroadcastChannel without personal data in the URL), §3.2, AD-07 |
| V-21 | minor | The contract suite was placed in a package that cannot reach the HTTP adapter, and would have been retired with it | **APPLIED** | `boundary-matrix.mjs` (no package depends on `@xr/web`). The suite moves to `@xr/contracts/draft`, framework-free (`node:assert`). §1.2 point 2, §8 item 4, §9 row, AD-02 |
| V-22 | minor | Next.js client-only details were missing | **APPLIED** | `providers.tsx` `'use client'`; `next` 16.3.4. §6.1 "Next.js 16 App Router details", §6.5; still marked assumed, not tested (§12) |
| V-23 | minor | BC14 was mis-cited for the Slice-1 UI, and "each file re-read" was inaccurate | **APPLIED** | START-HERE Known exception 4 "the rejected Slice-1 connected UI". §1.6, §9 intro |
| V-24 | minor | The grading-automation interpretation was not recorded | **APPLIED** | BC10; B4-09 f0 note; `#conflicts` "Auto-review of written answers". §1.3 assessment, D2, AD-38 |

**Kept from the draft after re-checking (the verifier confirmed them as PASS and this edit did not change them):** one Next.js application with typed ports; invalidation by changed record type; identity through XS-01 / XS-05 / XS-03 with no DEMO banner, switcher or developer account selector; coverage of all 27 `flows.json` steps in 39 rows plus 10 cross-cutting rows; D4 re-attributed to the System (HD-1: no Release control on B4-06 / B4-14); a device chain with no IA approval and no Decline; publish and release granting no access; feedback only after Completed; XS-06 rendered in place; and the Slice-1 classification of 9 / 24 / 38 with no rejected UI reused.
