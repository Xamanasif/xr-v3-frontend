# Appendix F — Phase 0 implementation plan (XR Learning Platform frontend, frozen canvas v46)

Phase-0 architecture audit · deliverable "Phase 0 implementation proposal" · 9 Oct 2026 · read-only.
**This is a proposal. Nothing in it has been implemented, installed, run or committed.** No file under `/Users/mymac/Desktop/AR-VR` or `~/Downloads` was changed while writing it.

> **Appendix F of the Phase-0 audit report** (`XR-v46-Phase0-Audit-Report.md`, Section 8). Source: `wf/design/phase0.md`. Assembled 9 Oct 2026 after re-checking the two verifier reports, `wf/verify/phase0.json` (6 major and 13 minor corrections) and `wf/verify/completeness.json` (1 critical, 5 major and 10 minor). Valid corrections are applied in the text below. The assembly log that follows lists every correction and what happened to it.
>
> **What changed at assembly, in short.** (1) One gate list, shared with Appendix G: G-1, G-6, G-7, G-5, G-2, G-3, G-8. G-4 (git remote) is no longer a gate; it is register item P0-01. (2) Sign-in (XS-01/03/04) and the public shell follow board B8-06 into Phase 1 unless the owner pulls them forward (new gate G-8). The default Phase-0 scope is therefore 42 components and 5 screen ids (45 and 8 under G-8). (3) TE-5 (sample clock) and AD-39 (stored completion, with register P3-01 (a)/(d)) join the G-2 exception packet. The AD-07 acknowledgement and the MIGRATION_STRATEGY amendment leave it. (4) Phase-0 interims are stated for AD-14, DV-1 and DV-2, so the port-level flow suites decide nothing silently. (5) Fixes for prettier and the turbo test cache: byte-identical files are excluded from formatting, and cross-package test inputs are made package-local or run uncached. (6) The Composite Wall invariant is reworded. (7) The contract suite gets its own subpath; the test-hook bridge is chosen by a build-time alias; the import fences are completed. (8) Each workspace base redirects to its Help page until the home screen exists, and a link-target ledger is added. (9) XS-07 acceptance now covers the drawn "Where" pre-fill, the optional screenshot field and the report-title interim. (10) Phase 0 proves Chromium only, and says so.
>
> **Status legend.** CONFIRMED, PROVISIONAL and UNRESOLVED are used as defined below. **GATE** marks an owner decision without which the named work package cannot start or merge (§10.1). Citations to `wf/…` are files in the audit's scratch workspace. `routes.md`, `permissions.md`, `schemas.md`, `architecture.md` and `visual.md` are Appendices A, B, C, D and E of the report.

**Assembly log: verifier corrections and their outcome**

| Source · # | Severity | Correction (short) | Outcome | Where applied |
|---|---|---|---|---|
| phase0 · 1 | major | XS-01/03/04 and the public shell pulled into Phase 0 against B8-06; the "only way to reach a shell" reason is contradicted by the CI-only boot descriptor | **APPLIED.** The scope is an explicit owner decision (G-8), with B8-06 as the recommended answer, and the sentence is deleted. B8-06 ("1 · Public + access spine — PU-01…12, XS-01/03 …") was re-read for this assembly | R5, R8, R11, §0.1, X-11, §3.2–§3.4, §7.2, §7.5, WP-0.6, WP-0.8, WP-0.13, WP-0.14, §9, §10, §11 |
| completeness · 3 | major | The same issue, but proposing to keep the pull-forward as the default | **Explicit-decision part APPLIED; proposed default REJECTED.** B8-06 is a v46 board and ranks above Inventory §U (the design brief). No owner constraint requires sign-in in Phase 0, because Phase-0 proofs can use the CI-only boot descriptor. The pull-forward remains a G-8 option. TE-5, AD-39 and the P3-01 split are applied as proposed | §10.1 G-8; G-2 |
| phase0 · 2 / completeness · 2 | major | The gate lists of this plan and the owner register disagree | **APPLIED.** One list with a crosswalk: A1 → G-6, A2 → G-1, A3 → G-7, A4 → G-2, A5 → G-3, A6 → G-5, A7 → G-8. G-4 becomes P0-01. "The owner asked for this choice first" is replaced by "recommended first, because no remote exists" | §10.1, §1.4, WP-0.1, WP-0.16 |
| phase0 · 3 | major | G-2 bundles items the register places in other phases | **APPLIED.** AD-39 + P3-01 (a)/(d) and TE-5 are in G-2. The AD-07 acknowledgement moves to §10.2. TE-1 is scoped to the session port, plus the XS-01 form only under G-8 | §10.1, §10.2, WP-0.9 |
| phase0 · 4 | major | prettier would rewrite the byte-identical permission matrix and the vendored capture scripts | **APPLIED.** `docs/v46/` and `tools/board-capture/vendor/` are added to `.prettierignore`, with mutation checks | §2.1, §5.3, §7.7, WP-0.2, WP-0.3, WP-0.15 |
| phase0 · 5 | major | The turbo test cache can replay passes for tests whose inputs live outside the package | **APPLIED.** A package-local matrix copy pinned by checksum; an uncached handoff-checks step (or `--force`) | §5.3, §7.7 |
| phase0 · 6 | major | Port-level flow suites reach AD-14, AD-38/DV-2 and DV-1/AD-18 with no Phase-0 interim | **APPLIED.** §10.2 interims added. DV-1 is reconciled to permissions SACC-15 (the overlap case returns `policy-open`), and register DV-1 is changed to match | §10.2, WP-0.9 (8), WP-0.14 (7) |
| phase0 · 7 | minor | WP-0.6 (6) cannot be satisfied (Slice-1 DISCARD names equal the v46 component names) | **APPLIED.** Replaced by a provenance test (content hashes plus Slice-1-only identifiers) | WP-0.6 |
| phase0 · 8 | minor | Invariant "both Composite Wall records exist" is false before Flow E step 1 | **APPLIED** here and in Appendix D §5.5 | WP-0.9 (5), WP-0.14 (2) |
| phase0 · 9 | minor | The test-hook bridge, the import fence and the env rule cannot all hold | **APPLIED.** A build-time alias in `next.config.ts`; fences extended for the bridge and for `app/**` → `@xr/ui` | §3.2, §3.8, WP-0.12 |
| phase0 · 10 | minor | The contract suite sits behind `./draft` and could pull Node built-ins into the client | **APPLIED.** Own subpath `./draft/contract-suite` plus a lint ban | §3.6 |
| phase0 · 11 | minor | WP-0.8 (1) compares icon keys that `navigation.json` lacks; misses HB-19 | **APPLIED** | WP-0.8 |
| phase0 · 12 | minor | WP-0.14 (3) checks the copy tables against themselves | **APPLIED.** An independent expected-words fixture taken from board frames | WP-0.14 |
| phase0 · 13 / completeness · 4 | minor / major | Register items that shape Phase-0 screens are missing (P0-10, P0-28, P0-30…P0-34); XS-07 acceptance misses drawn fields | **APPLIED** | §10.2, §10.3, WP-0.13 (2) |
| phase0 · 14 / completeness · 9 | minor | Defaults differ between plan and register (motion, forced colours, rail preference, decision panel, `/system`) | **APPLIED.** VD-09/VD-15 deferred (DV-8). VD-20 kept in memory (DV-7, with the R5 conflict stated). VD-05 needed by the first DecisionLayout screen (Phase 1). `/system` retired in Phase 0, with register P1-16 aligned | §3.4, §10.2, §10.3; Appendix G |
| phase0 · 15 / completeness · 15 | minor | Dead-end and looping links on Phase-0 screens | **APPLIED.** `/<base>` → `/<base>/help` interim, the public "Browse experiments" listed as a known dead link, a link-target ledger and a self-link test | §3.3, §10.2, WP-0.13 |
| phase0 · 16 | minor | `chmod -R a-w` breaks `git worktree remove` | **APPLIED.** Files only, with write permission restored before removal | §1.4 step 6 |
| phase0 · 17 | minor | Smoke test lands before its pages; grep misses comments/README; a subjective criterion | **APPLIED** | §2.1, WP-0.3 |
| phase0 · 18 | minor | G-3 over-blocks visual verification | **APPLIED.** G-3 is scoped to the `globals.css` / PostCSS step and labelled an engineering ADR with owner acknowledgement | §10.1, WP-0.5 |
| phase0 · 19 | minor | Committed deliverables would cite scratch-only files | **APPLIED.** Commit the Understand JSON under `v2/docs/v46/understand/`, or rewrite the citations | WP-0.2 |
| completeness · 12 | minor | The OPEN_DECISIONS amendment omits A-07, A-08, A-14 | **APPLIED** | §2.2, WP-0.2 |
| completeness · 14 | minor | Chromium-only tests vs the declared browser policy | **APPLIED.** Phase 0 proves Chromium only and records it; WebKit/Firefox need G-5 or the runner | §7.2, §10.2, DoD 16 |
| completeness · 1, 5, 6, 7, 8, 10, 11, 13, 16 | — | Report-level items (verdict, handoff verdict, Flow 1–6 mapping, inventory, wording, legend, superseded figures, BC14 qualification, surfaces / FCM) | **APPLIED in the main report.** FCM = FMAP is also noted in §5.3 here | Main report §1–§10 |

---


## How to read this

**Status of every item**

| Mark | Meaning in this document |
|---|---|
| **CONFIRMED** | Restates, and was checked against, one of these: an owner binding constraint (`design/handoff-v46/START-HERE.md` BC1–BC14, 9 Oct 2026), a v46 board, committed foundation code or docs at `1b090c9`, the repository state today, or an item that a final deliverable marks CONFIRMED and that was spot-checked here. A plan step is CONFIRMED only where the evidence leaves no reasonable alternative. |
| **PROVISIONAL** | An engineering proposal or a stated interim treatment. Reversible. It may need the owner to acknowledge it, but it does not block work. |
| **UNRESOLVED** | An owner decision is missing. The safe interim is stated. The owner decides. |
| **GATE** | A true Phase-0 blocker: the named work package cannot start or cannot merge until the owner answers (§10.1). |

**Citations**

- Boards: `design/handoff-v46/canvas-v46/project/<code>-….dc.html`, written as the board code (`B1-09`), with the 0-based frame number from `design/handoff-v46/derived/frame-index.json` and its caption, e.g. B1-09 f3 "Wrong details". Batch-0 boards are cited by number (`05`, `08`). `design/handoff-v46/…` is the canonical repo path; the package is not yet in the repo (it was read from a checksum-verified scratch extraction).
- Handoff data: `handoff/<file>.json` = `design/handoff-v46/canvas-v46/project/handoff/<file>.json`; `handoff/README.md` likewise.
- Final audit deliverables (scratch today; WP-0.2 proposes committing them under `v2/docs/v46/`): `routes.md §n`, `permissions.md §n`, `schemas.md §n`, `architecture.md §n`, `visual.md §n` = `scratchpad/wf/final/<name>.md`. Their ids are reused unchanged: route defects D-01…D-31 and owner items O-01…O-12 (routes); rows SEL-01…XC-04 (permissions); models M01…M28, defects D-01…D-26 and owner items §8-1…§8-33 (schemas); TE-1…TE-8, HD-1…HD-13, AD-01…AD-45 (architecture); PF-01…PF-13, V-1…V-14, VD-01…VD-23 (visual).
- Understand-stage findings: `wf/understand/<file>.json#<key>`; business rules `BR-nnn` from `wf/understand/decisions-rules.json#businessRules`.
- Repository: `1b090c9:<path>` (approved foundation, read with `git show`). Slice-1 paths are uncommitted working-tree files on `v2/connected-frontend-slice1`.

**Two things called "Phase 0".** In this document "Phase 0" is the v46 build-order Phase 0 (Foundation) of `handoff/README.md` "Build order" and B8-06 "Build order and the boards for each phase". The committed foundation at `1b090c9` also calls itself "Phase 0" (`1b090c9:v2/docs/ARCHITECTURE.md` §16–§17, `v2/docs/PHASE0_VERIFICATION.md`); here it is "the V2 platform foundation". New records use the name "Phase 0 (frontend, v46)" so the two are never confused. [PROVISIONAL]

**Spot checks made for this document** (read-only; `git` read commands and `python3 -I`):

- `~/Downloads/XR-Learning-Platform-Design-Handoff-v46.zip` SHA-256 = `9d33f32e1919b239725b2abee0500795174df804f0f7d6dfa58f25b9c08d24bf` (matches `repo-baseline.json#meta.designReference`); the extraction holds 180 files and `SHA256SUMS.txt` has 178 lines. [CONFIRMED]
- Repository today: branch `v2/connected-frontend-slice1` at `1b090c97b564…` (= `v2/platform-foundation` = `v2/design-system-flagship`); `git status --porcelain -uall` = 11 `M` + 87 `??` (27 of them under `XR_Learning_Platform_Architecture_Source_Pack/`); one worktree; `git remote -v` empty; no `CLAUDE.md` at `1b090c9`. [CONFIRMED]
- `B8-06` text: "Mock services … Real auth, payment, XR runtimes, grading automation and persistence stay out until decided"; Phase 0 row "Shell, sidebars, account menu, Help & support, system pages, tokens, components, dialogs" (boards 01·02·03·04·05·06·07·08·10); Phase 1 row "PU-01…12, XS-01/03, SA-01 requests group, SA-02/03, SA-06/07"; Tests "… a real-pointer reach test for every confirm button (the Batch-4 lesson)". [CONFIRMED]
- `START-HERE.md`: BC1–BC14, Known exceptions 1–9, "Using this package with Claude Code" steps 1–4. `handoff/README.md`: build order 0–7 and "Done, for one screen". [CONFIRMED]
- B1-09 frame captions f0–f12 (frame-index) and the "Never here" annotation ("DEMO strips, sample accounts, a role switcher, “Viewing as…”, or a “choose a workspace” step"); B1-09 strings "Sign in with your institution", "Forgot your password?", "The e-mail or password isn’t right"; B2-01 "Pages are read-only until BITS lifts the pause."; board 07 "Say what happened, so it can be looked into" and "One thing needs fixing"; board 05 "BITS Pilani / WILP logo — placeholder". [CONFIRMED]
- Board 08: the public not-found variant ("We can’t find that page" · "Browse experiments") is drawn under a placeholder bar tagged "Public header · Batch 1"; XS-06 copy "This page isn’t part of your workspace" / "You’re signed in to the Student workspace. This address belongs to a different workspace." Board 05: "Your institution’s access is paused — your work is kept." and "Your account is inactive." [CONFIRMED]
- `handoff/navigation.json`: base routes `/`, `/student`, `/faculty`, `/institute`, `/vendor`, `/reviewer`, `/content-manager`, `/admin`; rules incl. "No link to removed or deferred destinations (B8-01 list)". [CONFIRMED]
- `1b090c9`: `roles.ts`, `technology.ts`, `runtime/utilisation.ts` (completion rule at lines 183–193; `COMPLETED` status at 238–242), `app/layout.tsx`, `globals.css`, `providers.tsx`, `next.config.ts`, `packages/testing/src/playwright.ts`, `e2e/smoke.spec.ts`, `packages/ui/package.json` and `packages/contracts/package.json` exports, `config/src/env/index.ts`, `.prettierignore`, `config/src/boundaries/boundaries.test.ts` (fixture lines name `@xr/ui/tokens.css` and `FoundationStatusList`), `ARCHITECTURE.md` §8/§14/§16/§17, `OPEN_DECISIONS.md` header rule ("Parts B and D are owned by engineering and are closed with an ADR under `v2/docs/decisions/`"; "None may be silently resolved by an implementation"), `FUNCTIONAL_PARITY_MATRIX.md` §G. `ROLE_PLANNING_LABEL` and `TECHNOLOGY_META` are used only by `apps/web/src/app/system/page.tsx` outside their own files; `tenant_admin` appears only in `roles.ts` and `ARCHITECTURE.md`. [CONFIRMED]
- `schemas.md §3`: 22 product port interfaces with 183 methods (re-counted mechanically) and 6 stand-in ports. `permissions.json`: 347 rows; ALLOW 103 · DENY 156 · READ 62 · SYSTEM 11 · OPEN 15; CONFIRMED 176 · PROVISIONAL 130 · UNRESOLVED 41. [CONFIRMED]

---

## 0 · Recommendation in brief

Phase 0 builds the **foundation for the complete platform** (all eight surfaces, Flows A–F and the device chain), not a mini-application. It ends with: the frozen handoff in the repo; the v46 visual layer and component set; seven role shells; the domain, contracts and mock adapter for **every** entity; one connected sample world proven end to end by cross-role tests; and only the designed screens the foundation itself needs.

| # | Recommendation | Status |
|---|---|---|
| R1 | Work in a **new git worktree** on a new branch cut from `v2/platform-foundation` (`1b090c9`). The current checkout, its uncommitted Slice-1 work and the owner's Source Pack are never touched. The owner first chooses how Slice-1 is preserved (GATE G-1) and approves the new branch, its name and the worktree location (GATE G-6). | CONFIRMED (risk evidence) · PROVISIONAL (names) · GATE G-1, G-6 |
| R2 | Commit `design/handoff-v46/` at the repository root (outside `v2/`) after `shasum -a 256 -c SHA256SUMS.txt` = 178 OK, plus the START-HERE step-3 line in a root `CLAUDE.md`. Both are git writes: the owner approves them and confirms that the zip is the approved artefact (GATE G-7). | CONFIRMED (START-HERE steps 1–3) · GATE G-7 |
| R3 | Record the decisions the committed architecture requires **before** the code that depends on them: ADR-0001…0008 under `v2/docs/decisions/` and the exceptions TE-1…TE-8 (GATES G-2, G-3). | CONFIRMED (OPEN_DECISIONS rule) · PROVISIONAL (content) |
| R4 | Port the 8 v46 stylesheets **byte for byte** into `@xr/ui` in one cascade layer `xr.v46`, add an additive `xr.product` layer (PF-01…PF-13), remove Tailwind Preflight. | CONFIRMED (Preflight conflict) · UNRESOLVED (Tailwind option, VD-01) |
| R5 | Build the 42 Phase-0 components of `visual.md §3`. PublicShell, SignInCard, PublicMenuSheet and the password reveal follow in Phase 1 with XS-01 (B8-06), unless the owner pulls sign-in into Phase 0 (GATE G-8; then 45). Fix B1-10 **inside DataTable** (PF-01) with its tests. | CONFIRMED (BC13) · PROVISIONAL (design VD-04) · GATE G-8 (scope) |
| R6 | `@xr/domain` gets types, status unions, transition tables, decision functions, policies and invariants for **all 28 models** of `schemas.md §2`. `@xr/contracts` gets a `./draft` export with **all 22 product ports + 6 stand-in ports**, zod DTOs and a framework-free contract suite. A new `@xr/sample-platform` holds the one in-memory world, seed, clock and command pipeline. | PROVISIONAL (AD-01, AD-02; GATE G-2) |
| R7 | One connected state (BC14): one world per tab (option A, AD-07), one QueryClient, invalidation by changed record kind. No browser persistence until the owner authorises it. | CONFIRMED (BC14; B8-06 "persistence stay out until decided") · PROVISIONAL (mechanism) |
| R8 | Identity only through a session port over sample-world people. Its only product entry is the designed sign-in (XS-01), which B8-06 places in Phase 1 (GATE G-8 decides whether it is pulled forward). No DEMO banner, no account or role selector, in product or developer tooling. Phase-0 tests set sessions programmatically through a CI-only seam. | CONFIRMED (owner constraint; B1-09 "Never here"; SES-04) · PROVISIONAL (TE-1, TE-7) |
| R9 | Permissions are domain policies enforced in the mock command pipeline; screens render only the `availableActions` a port returns; tests are generated from the 347-row candidate matrix. | CONFIRMED (B8-06 "Permissions"; P4) · PROVISIONAL (mechanism) |
| R10 | Completion (BC3) is its own record, written only by a system completion handler through an **injectable `CompletionPolicy`**; the committed `utilisation.ts` rule becomes the interim policy, not a hard-coded trigger. Storing completion amends ARCHITECTURE §8, so it is signed in GATE G-2 (AD-39 with register P3-01 (a)/(d)). | CONFIRMED (BC3) · PROVISIONAL (mechanism) · GATE G-2 (AD-39) · UNRESOLVED (trigger T-12/A-06) |
| R11 | Foundation screens only, as the B8-06 Phase-0 row lists them: XS-05, XS-06, XS-07, XS-08 and PU-15 (5 ids). XS-01 (+XS-03 notices, XS-04 disclosure) and the public header/footer are Phase 1 unless the owner pulls them forward (GATE G-8; then 8 ids). Every other designed route stays unbuilt and resolves to the not-found pattern until its phase; `/<base>` lands on `/<base>/help` meanwhile (ADR-0005 interim). | CONFIRMED (B8-06 Phase-0 and Phase-1 rows) · PROVISIONAL (interim landing) · GATE G-8 |
| R12 | The cross-role proof is a **port-level** walk of Flows A–F + device chain on one world (no unapproved screens), plus browser proofs that use only Phase-0 screens, plus Playwright flow skeletons that Phase 7 turns green. | PROVISIONAL |

### 0.1 Scope box

**In Phase 0:** repository setup; ADRs and doc amendments; foundation conflict fixes; tokens, CSS port and product layer; 42 components (45 under G-8); shells and role navigation for 7 roles + the public header configuration; domain for all entities; all port contracts and the contract suite; the mock adapter with the Phase-0 method set; seed, scripted walk and fixtures; composition root and query layer; session port (the XS-01 form only under G-8); guards; 5 foundation screen ids (8 under G-8); test infrastructure (4 widths, keyboard/focus, reach, axe, invisible-focus, matrix-driven policy tests, contract suite, flow skeletons); board-capture pipeline and Phase-0 baselines; a verification record.

**Not in Phase 0:** XS-01/03/04 and the public header/footer (Phase 1 per B8-06, unless G-8); any PU-01…PU-14, ST-, FA-, IA-, VE-, RV-, CM- or SA- screen; the HTTP adapter; the WEB runtime stand-in route (TE-3, Phase 3); the payment stand-in screen flow (TE-4, Phase 1); browser persistence (TE-6); designed motion (VD-09); decision-ID copy treatment (VD-10, Phase 1: B7-02/B7-03 carry decision ids); any reviewer-build control (AD-40); anything under `apps/api` or `packages/database`.

### 0.2 Where the five final deliverables disagree, and what Phase 0 does

The final deliverables were written in parallel. These differences were found while integrating them. None changes a binding constraint.

| # | Difference | Phase-0 treatment | Status |
|---|---|---|---|
| X-1 | Port set: `architecture.md §4.1` names 18 ports (B8-06's 14 + identity, catalogue, selection, runtime); `schemas.md §3` defines 22 product ports (183 methods) + 6 test/seed-only stand-in ports | The schemas set is the contract. Architecture names are aliases (identity = `SessionService`; runtime ingestion = `RuntimeReportPort` + the Phase-3 stand-in route). Mapping table in §4.1. Recorded in ADR-0008 | PROVISIONAL |
| X-2 | Result and error shapes: `architecture.md §7.1` `Refusal` (not-signed-in, not-your-workspace, not-found, not-available, read-only, blocked, validation, invalid-state, unavailable) with `changed: RecordType[]`; `schemas.md §3.0` `ServiceError` (not-permitted, not-found, invalid-state, refused, validation-failed, stale-version, conflict, policy-open, unavailable) with `changed: RecordRef[]` | One union: the schemas `ServiceError` + `not-signed-in`. "Read-only" and "not available" are view-model `mode` + `refused` codes. `changed: RecordRef[]`; invalidation uses the kinds. HTTP mapping per both documents (§6.5) | PROVISIONAL |
| X-3 | Session redirect: `routes.md §3.2` puts it in `src/proxy.ts` (server); `architecture.md §6.1–6.2` uses a client `SessionGate` | Under option A the session exists only in the tab's memory, so a server proxy cannot see it. Phase 0 uses the client `SessionGate`; `proxy.ts` only becomes possible with a cookie/BFF session (E-02) | CONFIRMED (mechanism) · PROVISIONAL (design) |
| X-4 | Route groups: `routes.md §3.2` `(auth)` + static workspace folders, guard in each workspace `layout.tsx`; `architecture.md §6.1` `(entry)` + `(workspace)` | URLs are identical. The routes tree is adopted; `architecture.md §6.1` was itself marked PROVISIONAL | PROVISIONAL |
| X-5 | PU-10/PU-12 URL: `routes.md` `/requests/[requestId]` (opaque id + gate, O-05); `architecture.md` `/requests/status` (capability-free, ticket in `sessionStorage`, AD-13) | Both keep "the reference is not a key" (B1-07, B1-08). Not built in Phase 0. Recommended interim: routes O-05 (keeps the proposed route and admits the Institute Admin path drawn on B3-08). The owner chooses before Phase 1 (register DV-5 / P1-02) | UNRESOLVED |
| X-6 | Seed strategy: `architecture.md §3.3` "spine-start" seed + scripted walk (system-only states reachable live only in CI); `schemas.md §4.1` "state coverage" seed (every drawn state reachable by signing in as the right person) | Phase 0 builds both as command-replay builders. Default boot world = spine-start. Which one hosted reviewer builds boot is an owner choice before Phase 1 review (AD-08; schemas §8-5; register DV-6, interim spine-start) | PROVISIONAL (both built) · UNRESOLVED (hosted default) |
| X-7 | Completion writer: `schemas.md` M17 `FormatCompletion`, written only by `RuntimeReportPort.reportCompletion`; `architecture.md` R11 `CompletionRecord`, written by a system handler on an accepted `SIMULATION_COMPLETED` | One record (`FormatCompletion`, kind `COMP`). `reportCompletion` appends a sample-provenance `SIMULATION_COMPLETED`; the system handler evaluates it through `CompletionPolicy` and writes the record | PROVISIONAL · UNRESOLVED (T-12) |
| X-8 | Clock: `architecture.md §3.5` anchored clock (anchor + real elapsed), no setter in hosted builds; `schemas.md §3.18` `ClockPort.setSampleNow` (seed/test only) | Compatible. `setSampleNow` is exported only from `@xr/sample-platform/testing` | PROVISIONAL |
| X-9 | Record kinds: architecture `RecordType` uses FCM, COMP, MRK, LO; schemas `RecordKind` uses FMAP and has no COMP | One `RecordKind` union in `@xr/domain`. Board naming FMAP (B2-06 FMAP-0021; schemas D-22). COMP is a separate kind (BC3) | PROVISIONAL |
| X-10 | Rail expand/collapse "remembered per person" (13 Q7): `visual.md` VD-20 stores it in browser storage; `architecture.md` R5 writes nothing to browser storage except the selection basket and request ticket | Kept in memory per tab until AD-07/VD-20 are decided (register DV-7; the register's P0-24 "Approve" would conflict with R5) | UNRESOLVED (owner) · PROVISIONAL (interim) |
| X-11 | Phase placement: B8-06 and `visual.md §3.5` put sign-in and the public shell in Phase 1; Inventory §U (the design brief, ranked below B8-06) lists sign-in in Phase 0 (`decisions-rules.json#phaseBoards[0].notes`) | Default follows B8-06: XS-01/03/04, PublicShell, SignInCard and PublicMenuSheet stay in Phase 1, and the Phase-0 shell, guard, banner and Help proofs reach shells through the CI-only boot descriptor (§7.2). Pulling them forward, so that a Phase-0 build can be walked by a person, is an explicit owner decision (GATE G-8, register A7) | CONFIRMED (B8-06) · GATE G-8 |
| X-12 | Role display names: `schemas.md §1.3/§1.9` puts `ROLE_LABEL` in `@xr/domain/roles.ts`; `architecture.md §1.6/§5.4` keeps words in web copy tables | Role names: `ROLE_LABEL` replaces `ROLE_PLANNING_LABEL` in `roles.ts` (the smallest edit; ids stay, so OPEN_DECISIONS A-20 "labels are copy" holds). Record status words: web copy tables | PROVISIONAL |
| X-13 | B1-10 test target: `visual.md §7.1` targets SA-02, a Phase-1 screen | Phase 0 tests DataTable in the specimen harness at content widths 759/760; the SA-02 route test lands in Phase 1 | PROVISIONAL |
| X-14 | Id continuation: `schemas.md §4.1` "next id above the highest drawn id"; `architecture.md §3.3` explicit reservations + next free id above a per-prefix floor | Compatible: the walk reserves board references; the floor per prefix is the highest drawn id | PROVISIONAL |
| X-15 | Test seam: `schemas.md §3.18` "seed loader and test harnesses only, no UI"; `architecture.md §2.5` a browser test-hook bridge behind `NEXT_PUBLIC_XR_TEST_HOOKS` (CI builds only) | Compatible (no UI). The bridge is TE-7, inside GATE G-2 | PROVISIONAL |

---
## 1 · Safe starting point and procedure (do not execute in this stage)

### 1.1 Facts the procedure rests on [CONFIRMED]

| Fact | Evidence |
|---|---|
| Approved foundation = `1b090c97b564dae660b87d01c0212ab495347620`, single commit on `v2/platform-foundation`; `v2/design-system-flagship` and `v2/connected-frontend-slice1` point at the same commit with no commit of their own | `git rev-parse`; `repo-baseline.json#git.branches` |
| `main` (`e8c6a84`) has no `v2/` and no `ui-ux/`; `main..1b090c9` = 30 commits, 660 files | `repo-baseline.json#git.main` |
| Current checkout `/Users/mymac/Desktop/AR-VR` on `v2/connected-frontend-slice1`: 11 modified tracked + 87 untracked paths = 98; 60 untracked are Slice-1, 27 are the owner's `XR_Learning_Platform_Architecture_Source_Pack/` | `git status --porcelain -uall` today; `repo-baseline.json#uncommittedSummary` |
| No remote, no stash, one worktree | `git remote -v` (empty); `git worktree list` |
| No `CLAUDE.md` at `1b090c9` | `git cat-file -e 1b090c9:CLAUDE.md` fails |
| Handoff zip SHA-256 `9d33f32e…24bf`; one top folder `XR-Learning-Platform-Design-Handoff-v46/`; 180 files; `SHA256SUMS.txt` 178 lines (it and `MANIFEST.json` are not self-listed); 0 CRLF, 0 binary, so `* text=auto` keeps bytes | `shasum`; `repo-baseline.json#git.localConfig.gitattributes` |
| `pnpm format` = `prettier --write .` inside `v2/`; `.prettierignore` does not list any CSS source folder | `1b090c9:v2/package.json`; `1b090c9:v2/.prettierignore` |

### 1.2 Why a separate worktree [CONFIRMED]

All three `v2/*` branches point at `1b090c9`, so `git switch v2/platform-foundation` would succeed silently and carry the 11 modified and 87 untracked paths into the "clean" branch, including the rejected Slice-1 token edits that reuse v46 token names with different values. Cleaning the tree in place needs `stash -u`, `clean`, `reset` or `restore`, each of which can destroy uncommitted Slice-1 work and the untracked Source Pack, and nothing is backed up off this machine (`repo-baseline.json#recommendation.whyNotSwitchInPlace`).

### 1.3 GATE G-1 — preserve Slice-1 before anything else

The worktree approach does not touch the current checkout, so preservation is a safety copy, not a technical prerequisite. Because there is no remote, the owner chooses before any git write:

| Option | What happens | Pros | Cons |
|---|---|---|---|
| **A (recommended)** WIP commit on its own branch | In the current checkout, on the existing branch `v2/connected-frontend-slice1`: `git -C /Users/mymac/Desktop/AR-VR add -- v2` then `git -C /Users/mymac/Desktop/AR-VR commit -m "WIP: Slice-1 (UI rejected) — reference only, never merge"`. The pathspec `v2` takes the 11 modified + 60 untracked Slice-1 paths only; the 27 Source Pack paths stay untracked; ignored build output is not added | Exact content in the object database; salvage reads by `git show <wip>:<path>`; branch already isolated | Moves `v2/connected-frontend-slice1` off `1b090c9` (intended); still only on this machine |
| B patch + archive outside the repo | `git -C /Users/mymac/Desktop/AR-VR diff --binary HEAD -- v2 > <outside>/slice1-tracked.patch` and a tar of `git -C … ls-files --others --exclude-standard -- v2` stored outside the repo | Nothing in the repo changes | Two artefacts to keep in sync; untracked files need the tar |
| C leave as is | Nothing | No action | No copy anywhere; one mistaken `clean` loses it |

Recommendation: **A**, plus B as an off-repo copy until a remote exists. Never use `git add -A`, `git add .`, `git stash -u` or `git clean` in the main checkout. [PROVISIONAL; owner decides]

### 1.4 Procedure

Executed by the implementation session after G-1, G-6 (branch and worktree, before step 2) and G-7 (handoff commit, before step 7), and G-5a for the install (step 9). Commands are shown for review; **none is run in this audit stage**.

| Step | Action | Check |
|---|---|---|
| 0 | Carry out the G-1 choice | `git -C /Users/mymac/Desktop/AR-VR status --porcelain -uall` before/after; with option A, `git show --stat HEAD` lists only `v2/…` paths |
| 1 | Read-only pre-flight | `git -C /Users/mymac/Desktop/AR-VR rev-parse v2/platform-foundation` prints `1b090c97b564dae660b87d01c0212ab495347620`; `git worktree list` shows one worktree |
| 2 | Create the worktree and branch in one step (does not modify the main checkout): `git -C /Users/mymac/Desktop/AR-VR worktree add -b v2/frontend-v46 /Users/mymac/Desktop/AR-VR-frontend-v46 v2/platform-foundation` | Branch and path names are proposals (`repo-baseline.json#recommendation.startingPoint`); the owner may rename. Do not reuse `v2/design-system-flagship` or `v2/connected-frontend-slice1` |
| 3 | Verify the new tree | `git status` clean; `HEAD` = `1b090c9`; no `v2/apps/web/src/demo`, no `(connected)` routes, no Source Pack |
| 4 | Place the handoff at the **repository root**, outside `v2/` (so prettier, eslint, turbo and Tailwind never process it): verify the zip SHA-256, unzip into a new empty temporary folder outside both trees, then move its single top folder to `/Users/mymac/Desktop/AR-VR-frontend-v46/design/handoff-v46/` (the zip does not unpack to that name directly) | `shasum -a 256 ~/Downloads/XR-Learning-Platform-Design-Handoff-v46.zip` = `9d33f32e…24bf` |
| 5 | Integrity: `cd design/handoff-v46 && shasum -a 256 -c SHA256SUMS.txt` | 178 lines `OK`, 0 `FAILED`; 180 files in the folder |
| 6 | Make it read-only by rule and by test: create root `CLAUDE.md` containing the START-HERE step-3 sentence verbatim — "Frontend design reference: `design/handoff-v46/START-HERE.md` (frozen canvas v46). Never edit files under `design/handoff-v46/`." Optional extra lines: Slice-1 UI is rejected and is not a design reference; `runtime/support.js` is canvas preview only and never copied into the product. Optionally make the files read-only, not the directories: `find design/handoff-v46 -type f -exec chmod a-w {} +` (local protection only; git stores no write bit; the checksum test already protects the folder; restore write permission before `git worktree remove`) | `grep -F` finds the sentence |
| 7 | Commit only the handoff and `CLAUDE.md`: `git add -- design/handoff-v46 CLAUDE.md`, message e.g. "Add frozen design handoff v46 as read-only reference" (attribution lines as the implementation session's instructions require) | `git show --stat HEAD` touches nothing else |
| 8 | Re-verify from git objects: check out the commit in a throw-away worktree (or `git archive`) and repeat step 5 | 178 OK |
| 9 | Install and re-establish the foundation baseline **before any code change** (G-5a): `pnpm install --frozen-lockfile` in `v2/`, then build, typecheck, lint, test, e2e | Matches `1b090c9:v2/docs/PHASE0_VERIFICATION.md`: build 9/9, typecheck 9/9, lint 9/9, 218 tests, e2e 2/2 Chromium |
| 10 | Salvage Slice-1 non-visual code only by deliberate copy-in after review (§2.3), read from the main checkout path or from the WIP commit via `git show` | Never merge or check out the Slice-1 branch into the new worktree |
| 11 | PR base: **`v2/platform-foundation`**, not `main` (a PR into `main` would carry 30 commits and 660 files). A remote is needed first (register P0-01; not a Phase-0 gate) | — |
| 12 | Housekeeping: remove the worktree only with `git worktree remove` (deleting the folder by hand leaves stale metadata) | — |

### 1.5 Never

- `git switch`/`checkout` of another branch in `/Users/mymac/Desktop/AR-VR`; `stash`, `clean`, `reset`, `restore` there.
- `git add -A` / `git add .` anywhere near the Source Pack.
- Editing, reformatting or regenerating anything under `design/handoff-v46/` (FREEZE-RECORD freeze rules; START-HERE step 3). Batches 1–3 are never regenerated from their generators (`decisions-rules.json#notToCopy` "Regenerating Batches 1–3").
- Placing the handoff under `v2/` (prettier would rewrite it and break `SHA256SUMS.txt`).
- Committing on `v2/design-system-flagship` or `v2/connected-frontend-slice1` for the new work.

---

## 2 · Reuse as-is / refactor / replace / discard

### 2.1 Committed foundation (`1b090c9`)

| Area / file | Verdict | Reason | Evidence |
|---|---|---|---|
| Workspace tooling: `v2/package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.solution.json`, `scripts/dev.mjs`, `scripts/graph-dev.mjs`, `.nvmrc`, `.editorconfig`, `.prettierrc.json` | **Reuse** | Toolchain pins (Node 24, pnpm 12.3.4, TS 6.0.3, turbo 2.10.12) and strict env mode fit; add a solution reference for the new package and a root `verify` script | `repo-baseline.json#foundation.packages` "workspace tooling … as-is" |
| `v2/.prettierignore` | **Refactor** | Add `packages/ui/src/styles/v46/`, `docs/v46/` and `tools/board-capture/vendor/` so `pnpm format` cannot rewrite byte-identical copies: the v46 CSS/SVG, the committed permission matrix (1-space JSON; the repo's prettier uses tabWidth 2) and the SRI-checked vendored capture scripts | §1.1; `visual.md §2.2` provenance test |
| `@xr/config` tsconfig presets, ESLint presets, `rules/resolved-boundaries.mjs`, `src/boundaries/boundaries.test.ts` | **Reuse** | Enforcement already auto-discovers packages; only data changes | `architecture.md §1.2` |
| `@xr/config/eslint/boundary-matrix.mjs`, `eslint/boundaries.d.mts` | **Refactor** | Add `@xr/sample-platform` row, add it to `@xr/web`'s list, add its forbidden third-party set, extend the closed `WorkspacePackage` union (AD-01) | `architecture.md §1.2` mock-adapter row |
| `boundaries.test.ts` fixture lines | **Refactor** | Its cases import `'@xr/ui/tokens.css'` (expected allowed) and name `FoundationStatusList`; `FoundationStatusList` goes in WP-0.3 and the `./tokens.css` export in WP-0.5, so the specifiers move to a current `@xr/ui` export and to `'@xr/ui/styles.css'` in those packages | `git show 1b090c9:…/boundaries.test.ts` lines 351, 419–422, 460 |
| `@xr/config/src/env/index.ts` | **Refactor** | Add `NEXT_PUBLIC_XR_DATA_SOURCE = sample \| api` and `NEXT_PUBLIC_XR_TEST_HOOKS` to `webPublicEnvSchema`, read once at boot (TE-7). Nothing else reads `process.env` | Its header "there are no prototype flags"; `architecture.md` TE-7 |
| `@xr/contracts` `api.ts`, `health.ts`, `problem.ts`, `runtime-events.ts` (DRAFT), `openapi.ts`, `wire-contracts.ts`, `zod-introspection.ts` + tests | **Reuse** | Wire contracts, RFC 9457 problem details and the strict OpenAPI conversion are what the HTTP adapter will need later | `repo-baseline.json#foundation.packages` |
| `@xr/contracts/package.json` | **Refactor** | Add `"./draft"` export; today only `"."` is exported and `xr/resolved-boundaries` rejects other subpaths (`notExported`) | `architecture.md §1.2` (AD-02) |
| `@xr/domain/src/roles.ts` | **Refactor** | Keep `PLATFORM_ROLES` ids incl. `tenant_admin` (A-20 interim "Role and record identities are stable; labels are copy"); remove `ROLE_PLANNING_LABEL` ("Student / Learner", "Institute Admin / Tenant Admin"); add `ROLE_LABEL` with B8-03 names; add `Audience`, `ActorRef`, `SystemActor` | `schemas.md §1.3`, §1.9 edit 2; BC1 |
| `@xr/domain/src/technology.ts` | **Refactor** | Keep `TECHNOLOGIES` ids and `DeliveryModel`; add `FORMAT_DISPLAY_ORDER` (WEB·AR·VR·MR) and `FORMAT_META` (B6-07 words); delete `TECHNOLOGY_META` (label "Web", "Virtual Reality"…); re-document `sortTechnologies` as non-UI (FRD order) | `schemas.md §1.4`, §1.9 edit 1; B8-03 |
| `@xr/domain/src/runtime/events.ts` | **Reuse** | Five events and four production sources stay unchanged; sample provenance lives in the `@xr/sample-platform` envelope, never in the enum | `architecture.md` TE-3, R7 |
| `@xr/domain/src/runtime/utilisation.ts` (+ test) | **Refactor** | Keep `foldSessions` and the activity derivation. The hard-coded "`SIMULATION_COMPLETED` on a launched/started session ⇒ `COMPLETED`" (lines 183–193, 238–242) moves behind an injectable `CompletionPolicy`; its current rule becomes `interimCompletionPolicy`; no read model or UI uses `SimulationStatus` | BC3; T-12 / OPEN_DECISIONS A-06 (Part A: keep as a boundary); `functional-prototype.json#warnings` item 5; `schemas.md §1.9` edit 3 |
| `@xr/domain/src/index.ts`, `README.md` | **Refactor** | Export the new modules; document the five-state separation | — |
| `@xr/validation` (`identifiers`, `instant`, `strings`) | **Reuse** + extend | Add the drawn field primitives (`requiredTrimmed`, `wholeNumberString`, `wholeNumberInRange`, `emailAsDrawn`, `httpsLinkAsDrawn`, `calendarDate`); optional alias of `IsoInstant` to avoid two exported names | `schemas.md §5.1`, §1.2 |
| `@xr/testing` `createVitestConfig` | **Reuse** | Node/jsdom factory fits | — |
| `@xr/testing` `createPlaywrightConfig` | **Refactor** | Only "Desktop Chrome"; add projects 1440×900, 1024×768, 768×1024, 375×812; keep `webServer` optional so mock-mode e2e does not boot the API | `1b090c9:v2/packages/testing/src/playwright.ts`; `visual.md §9.3` |
| `@xr/ui/src/tokens.css` | **Replace** | Placeholder (system font stack, `--xr-color-fg/bg/muted`, `--xr-space-unit`); v46 `:root` (65 tokens) arrives inside the verbatim `xr-foundation.css` | `visual.md §1.1`, T-1 |
| `@xr/ui/src/foundation-status-list.tsx` (+ test), `index.ts` exports | **Discard / replace** | Wiring proof only; retired with the foundation page | `repo-baseline.json#conflictsWithV46` "@xr/ui package shape" |
| `@xr/ui/package.json` | **Refactor** | Export `./styles.css` → `src/styles/index.css`; list `src/styles/**` in `files`; keep `.` (dist) | `visual.md §2.2` "Packaging" |
| `@xr/ui/vitest.setup.ts`, `vitest.config.ts`, `tsconfig*` | **Reuse** | Add the Slice-1 dialog polyfill hunk only if native `<dialog>` needs it under jsdom (Slice-1 SAFE) | `architecture.md §9` |
| `apps/web/next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.mts`, `vitest.setup.ts`, `turbo.json` | **Reuse** | Add `redirects()` rows as screens arrive (Phase 0: two rows, §3.3); add import fences to the ESLint config | `routes.md §3.7` |
| `apps/web/postcss.config.mjs` | **Reuse or remove** | Depends on VD-01 (option A keeps `@tailwindcss/postcss`; option B removes Tailwind) | `visual.md §2.4` |
| `apps/web/src/app/globals.css` | **Replace** | `@import 'tailwindcss'` includes Preflight, which strips list markers and resets headings/buttons the v46 sheets style; the body rule paints placeholder tokens | `visual.md §2.4` "Preflight must go in either option — CONFIRMED conflict" |
| `apps/web/src/app/layout.tsx` | **Refactor** | Import `@xr/ui/styles.css` before `globals.css`; product name "XR Learning Platform"; drop `min-h-screen antialiased`; providers include the PlatformProvider | `visual.md §2.2`; `repo-baseline.json#conflictsWithV46` "Root layout metadata" |
| `apps/web/src/app/providers.tsx` | **Refactor** | Keep the per-browser-session QueryClient pattern; defaults come from the composition root (sample mode `staleTime: Infinity`); clear on identity change | `architecture.md §1.5` |
| `apps/web/src/app/page.tsx` (`/` foundation page) | **Replace** | `/` is PU-01 (Phase 1). In Phase 0 `/` resolves to the PU-15 public not-found pattern (§3.3) | `routes.md` PU-01 row; O-10 |
| `apps/web/src/app/system/page.tsx` | **Discard** | Not one of the 147 ids; renders `ROLE_PLANNING_LABEL` and internal configuration; no developer-only path is kept (owner constraint: no developer surfaces) | `routes.md` O-10; `repo-baseline.json#conflictsWithV46` "/system" |
| `apps/web/src/app/healthz/route.ts` | **Reuse** | Liveness route handler, not a page | `routes.md §3.2` |
| `apps/web/src/components/api-health-probe.tsx` (+ test) | **Discard** | API probe on a product page; mock mode does not need the API | O-10 |
| `apps/web/src/lib/api-client.ts` (+ test), `lib/env.ts` | **Reuse** / **refactor** | `fetchApi(path, schema)` is the later HTTP adapter's base; `env.ts` reads the two new flags | `architecture.md §8` |
| `apps/web/src/lib/forms.test.tsx` | **Reuse** | Proves React Hook Form + zodResolver + Zod 4; product forms use `mode: 'onSubmit'` (B8-07 "Validate on the primary action") | `visual.md §5.1` |
| `apps/web/playwright.config.ts` | **Refactor** | Boots the built API today; sample mode starts only `next start` | `repo-baseline.json#foundation.web.e2e` |
| `apps/web/e2e/smoke.spec.ts` | **Replace** | Asserts H1 "V2 foundation", the API probe and `/system`. New smoke in steps: WP-0.3 asserts `/healthz` JSON and a 404 for `/` and `/system`; WP-0.13 adds the not-found copy "We can’t find that page"; the `/sign-in` H1 "Sign in" (B1-09 `xp-auth-h`) is added when XS-01 is built (Phase 1, or Phase 0 under G-8) | §8 WP-0.3 / WP-0.13 |
| `apps/web/.env.example`, `v2/.env.example` | **Refactor** | Document the two new public flags | TE-7 |
| `apps/api/**`, `packages/database/**` | **Untouched** | Out of scope (BC10) | `repo-baseline.json#foundation.packages` |
| `branding/bits-pilani-wilp-logo.png` (repo root) | **Do not use** | BC12 placeholder rule; approval of the file is VD-03 | `visual.md §4.5` |

### 2.2 Repository documents (`1b090c9:v2/docs/`)

| Document | Verdict | What changes (as amendments recorded in WP-0.2, owner sign-off) |
|---|---|---|
| `ARCHITECTURE.md` | **Refactor by amendment** | Cross-references to ADR-0001…0008 and exceptions TE-1…TE-8 at §3/§4 (rules evaluated in the browser by the mock), §6 (new package row), §8 (completion stored as a system record — AD-39), §10 (sample sign-in), §14 (test-only seams, no stand-in controls in product), §16 (styling pipeline, E-19) |
| `OPEN_DECISIONS.md` | **Refactor** | E-19 closed by ADR-0001; Part E exceptions TE-1…TE-8 with removal triggers (successors of the uncommitted Slice-1 CF-01/CF-02); A-20 annotated "labels answered by BC1; id kept" — not marked resolved; A-06 stays open (kept as the `CompletionPolicy` boundary); A-07 (v46: IA institution code + CM platform code, M-2), A-08 (v46: CM → AR → SA Release / Hold, BC8) and A-14 (v46: approve-only device transfers, T-32) annotated "v46 position: …; not resolved, owner to confirm" |
| `FUNCTIONAL_PARITY_MATRIX.md` | **Refactor by amendment** | 26 of 36 rows conflict with v46 (`functional-prototype.json#warnings`); add a "Web (mock)" status and notes on P-03, P-04, P-15, P-17, P-25, P-26, P-27; §G amended only where the owner authorises TE-3/TE-6 |
| `MIGRATION_STRATEGY.md` | **Refactor by amendment** | Record the frontend-on-mocks track (v46 phases 0–7 on typed mock services before the backend) — owner sign-off requested in WP-0.2 (register P0-03); not a merge blocker for Phase 0 (`repo-baseline.json#conflictsWithV46` "MIGRATION_STRATEGY phase order") |
| `PHASE0_VERIFICATION.md` | **Reuse** (history) | A new `v2/docs/v46/PHASE0_FRONTEND_VERIFICATION.md` records this phase |
| `v2/README.md`, package READMEs | **Refactor** | Developer README lists sample people and the sign-in rule (never product UI, `architecture.md §2.3`) |

### 2.3 Slice-1 (uncommitted on `v2/connected-frontend-slice1`) — non-visual logic only, after inspection

Classification from `repo-baseline.json#slice1` (71 entries: 9 SAFE · 24 SALVAGE_WITH_CHANGES · 38 DISCARD), landing places from `architecture.md §9`. Salvage = a deliberate copy-in on the new branch, file by file, after review; never a merge. [CONFIRMED classification · PROVISIONAL landing]

| Class | Files | Lands in | Required changes | WP |
|---|---|---|---|---|
| SAFE (9) | `packages/domain/src/access/term.ts` + `term.test.ts` | `@xr/domain/institution/term` | v46 words (Access active · Ending soon · Access ended; Paused is an institution state); owner sign-off on CF-06 "unreadable end = expired" (otherwise invalid data) | 0.9 |
| | `packages/domain/src/access/isolation.ts` | `@xr/domain/policy` helpers | "campus" → institution | 0.9 |
| | `apps/web/src/services/access/context.tsx` | `apps/web/src/platform/platform-provider.tsx` | Generalise to all ports + session | 0.12 |
| | `apps/web/src/demo/storage.ts` | `@xr/sample-platform/persistence/browser.ts` — only if AD-07 authorises option B | Drop "demo" naming | 0.11 (conditional) |
| | `apps/web/src/test-support/memory-storage.ts`, `next-mocks.tsx`; dialog-polyfill hunks of both `vitest.setup.ts` | test support | Polyfill only if native `<dialog>` is used under jsdom | 0.4 |
| SALVAGE (24) | `packages/domain/src/access/{model,formats,assignment,entitlement,integrity,index}.ts`, `access.test.ts` | `@xr/domain/access` | ACC = experiments × formats; SACC target student or group; formats inherited (LD-1); remove `no-place-remaining`, `placesBefore/After`, over-allocation-as-corruption; WEB·AR·VR·MR order; rewrite SCENARIO I | 0.9 |
| | `packages/domain/src/access/places.ts` | `Provided<T>` display type only | No derivation, no "remaining" (T-06/D7) | 0.9 |
| | `apps/web/src/services/access/types.ts` | `@xr/contracts/draft` ports | Split into the 22 ports; 7 roles; errors per §6.5; keep "the caller is never a parameter" | 0.10 |
| | `apps/web/src/services/access/queries.ts` | `apps/web/src/queries` | Session-keyed keys kept; `['access']` invalidation → `meta.deps` | 0.12 |
| | `apps/web/src/demo/world.ts`, `world-store.ts` | `@xr/sample-platform/world`, `store` | All records; memory driver default; envelope versioning, BroadcastChannel and locks only behind option B; no notices in product chrome; no "demo" naming | 0.11 |
| | `apps/web/src/demo/runtime.ts`, `runtime-provider.tsx` | composition root | Remove raw world access from anything a screen can reach | 0.12 |
| | `apps/web/src/demo/access-adapter.ts` | `@xr/sample-platform/handlers/student-access` | Remove the inactive-IA read block (B1-09 f7 signs in with a banner); per-grant data; v46 ids; no arithmetic | 0.11 |
| | `apps/web/src/demo/identity-store.ts` | `apps/web/src/platform/session-store.ts` | Memory per tab; backs XS-01 only; no switcher | 0.12 |
| | `apps/web/src/demo/access-adapter.test.ts`, `world-store.test.ts`, `test-support/render.tsx` | contract suite cases; store tests; `renderScreen` | Remove place expectations | 0.10–0.12 |
| | `v2/docs/OPEN_DECISIONS.md` (A-22, Part E), `FUNCTIONAL_PARITY_MATRIX.md` edits, `CAPABILITY_REGISTER.md`, domain README/index hunks | re-applied as edits | CF-01 → TE-1; CF-02 → TE-2; CF-03 → T-36 seed; drop CF-04; rewrite CF-06; restart the register against the 147 ids | 0.2 |
| DISCARD (38) | `apps/web/src/demo/seed.ts` | — | Edge cases (inactive student, other-institution student) re-expressed as command-script fixtures | 0.11 |
| | All Slice-1 UI: `packages/ui/src/{app-shell,button,card,confirm-dialog,format-legend,notice,page-header,places-meter,status-pill,cx}.tsx/ts`, `primitives.test.tsx`, the `tokens.css` block, `index.ts` exports; `app/(connected)/**`; `demo-bar.tsx`; `demo-accounts-screen*`; `features/**`; `copy.ts`; the `globals.css` `@source` hunk; README sentences; `e2e/connected-slice1.spec.ts` | — | Never reused (START-HERE Known exception 4). The e2e step list survives only as Flow B acceptance ideas | — |

### 2.4 Must not be carried, in any form [CONFIRMED]

`places.ts` arithmetic, the `no-place-remaining` refusal and SCENARIO I (D7 counting, T-06); the DEMO strip, account chooser and `/demo`; "demo" naming in product-reachable code; storage notices in product chrome; the inactive-Institute-Admin read block; per-experiment aggregation; "campus" and "learner places" wording; Slice-1 token values; the Slice-1 seed as the product seed (`architecture.md §9`; `decisions-rules.json#notToCopy` "Slice-1 rules not to carry forward as policy"). WP-0.4 adds a grep test for `no-place-remaining`, `placesBefore`, `placesAfter`, `demo-bar`, `Viewing as`.

---
## 3 · Recommended route and component organisation

### 3.1 Layers and packages against the boundary matrix

```
screens       apps/web/src/features/<surface>/<screen-id>-<slug>/   (React; v46 markup via @xr/ui; copy tables)
   │ only through
query layer   apps/web/src/queries/                                (TanStack Query hooks, key factories, meta.deps, useCommand)
   │ only through
ports         @xr/contracts/draft                                  (22 product + 6 stand-in interfaces, zod DTOs, errors, contract suite)
   │ implemented by (chosen once in apps/web/src/platform/composition.ts)
   ├─ mock      @xr/sample-platform                               (world, seed, clock, ids, command pipeline, handlers, stand-ins)
   └─ http      apps/web/src/platform/http/   (later phases)       (fetchApi + contract schemas → apps/api)
   │ both evaluate rules only through
domain        @xr/domain                                           (types, status unions, transitions, decisions, policies, invariants, derivations)
```

Rules flow downward only. A screen never imports the world, a store or a domain decision; it renders a view model and calls commands (`architecture.md §1.1`). [PROVISIONAL; layering CONFIRMED by `1b090c9` boundary matrix]

| Package | Allowed workspace deps (matrix) | Change needed | Status |
|---|---|---|---|
| `@xr/domain` | `[]`; zod forbidden | none (asserted `toEqual([])` by `boundaries.test.ts`) | CONFIRMED |
| `@xr/validation` | `[]` | none | CONFIRMED |
| `@xr/contracts` | `@xr/domain`, `@xr/validation` | `exports["./draft"]` (AD-02) | PROVISIONAL |
| `@xr/sample-platform` (new) | `@xr/contracts`, `@xr/domain`, `@xr/validation`; forbidden: framework-server, framework-web, data-layer | matrix row; `@xr/web` list; `FORBIDDEN_THIRD_PARTY`; `WorkspacePackage` union; `tsconfig.build.json` (composite, noEmitOnError, references); `tsconfig.solution.json`; `eslint.config.mjs` `boundaries('@xr/sample-platform')`; `exports` = `.` + `./testing`; ARCHITECTURE §6 row (AD-01). Fallback if the owner refuses a package: `apps/web/src/sample/` behind a `no-restricted-imports` fence, recorded as a standing exception | PROVISIONAL (GATE G-2) |
| `@xr/ui` | `[]`; `next`/`next/*` forbidden | `exports["./styles.css"]`; links injected | CONFIRMED (constraint) |
| `@xr/web` | config, contracts, domain, ui, validation | + `@xr/sample-platform` (composition root only) | PROVISIONAL |

### 3.2 `apps/web/src` (full shape; `[P0]` = built in Phase 0, `[Pn]` = phase that fills it)

```text
apps/web/src/
├─ app/                         route files only; thin (see §3.3)
├─ platform/
│  ├─ composition.ts            [P0] selects the adapter from @xr/config env (NEXT_PUBLIC_XR_DATA_SOURCE = sample|api);
│  │                                 the ONLY importer of @xr/sample-platform
│  ├─ platform-provider.tsx     [P0] 'use client'; exposes ports + session; one instance per tab (BC14)
│  ├─ session-store.ts          [P0] {personId, nonce, signedInAt} in memory per tab (option A); sessionStorage only under AD-07 = B
│  ├─ link.tsx                  [P0] injects next/link into the @xr/ui LinkProvider
│  ├─ test-hook-bridge.ts       [P0] resolved by a build-time alias in next.config.ts: an empty stub unless NEXT_PUBLIC_XR_TEST_HOOKS=1
│  │                                 at build time (CI/Playwright builds); may import @xr/sample-platform/testing: boot descriptor,
│  │                                 fixture load, act-as, clock, fault plan — no UI of any kind (TE-7)
│  └─ http/                     [later] HTTP adapter per port (fetchApi + ProblemDetails → ServiceError)
├─ queries/
│  ├─ keys.ts · invalidation.ts · use-command.ts            [P0]
│  └─ <port>.ts                 [P0] session, operations (support), institution/people banner facts; others with their phase
├─ nav/
│  ├─ nav-config.ts             [P0] 7 role configs + public header, verbatim from navigation.json / board 06 raw[]
│  ├─ active-item.ts            [P0] explicit route → sidebar item map (routes.md §3.6)
│  └─ built-screens.ts          [P0] generated manifest of built screen ids; a nav item renders only when its screen is built
├─ copy/
│  ├─ status/<record>.ts        [P0] canonical state × audience label maps for every record (schemas §2 "Status → labels")
│  ├─ messages.ts               [P0] drawn validation and refusal copy (schemas §5.4, §3.0), keyed by rule
│  └─ dates.ts                  [P0] "8 Oct 2026, 15:05" formatting (B8-03: no numeric dates)
├─ features/
│  ├─ shared/                   [P0] xs-05-account-menu · xs-06-not-your-workspace · xs-07-help · xs-08-banners ·
│  │                                 pu-15-not-found · record-guard · [P1, or P0 under G-8] xs-01-sign-in
│  ├─ public/                   [P1] pu-01-landing … pu-14
│  ├─ student/                  [P2] st-01 … st-05, st-19 · [P3] st-06 … st-10, st-15 … st-18 · [P4] st-11 … st-14
│  ├─ faculty/                  [P4] fa-01 … fa-22
│  ├─ institute/                [P2] ia-01 … ia-16 · [P3] ia-17 … ia-20
│  ├─ vendor/                   [P5] ve-01 … ve-09, ve-13
│  ├─ reviewer/                 [P5] rv-01 … rv-03, rv-05, rv-06 · [P6] rv-04
│  ├─ content-manager/          [P5] cm-01 … cm-05, cm-09 · [P6] cm-05 … cm-08
│  └─ admin/                    [P1] sa-01 (requests group), sa-02, sa-03, sa-06, sa-07 · [P3] sa-18, sa-19 · [P6] rest
├─ lib/                         api-client.ts (kept) · env.ts · forms.ts (RHF + zodResolver, mode onSubmit)
└─ test-support/                render-screen.tsx · next-mocks.tsx · memory-storage.ts
apps/web/e2e/
├─ smoke.spec.ts · foundation/*.spec.ts · a11y/*.spec.ts · reach/*.spec.ts · parity/*.spec.ts
├─ flows/flow-{a,b,c,d,e,f}.spec.ts · flows/device.spec.ts      [P0 skeletons, test.fixme] → green in P7
└─ support/ (signInAs · bootWorld · actAs · reachAndClick · expectNoInvisibleFocusTargets · axe)
```

Screen folders are named by screen id so every file traces to `handoff/screens.json`. A feature folder holds the view component, its view-model hook usage and a local test; route files only resolve params and render the feature (`architecture.md §1.6`). [PROVISIONAL]

### 3.3 App Router tree — the Phase-0 subset of `routes.md §3.2`

The full tree (123 page patterns, 26 intermediates, 16 runtime guards, 0 slug conflicts) is `routes.md §3.2–§3.8` and is adopted as the target (X-4). Phase 0 creates only these files. Lines marked `[G-8]` are created in Phase 0 only if the owner pulls sign-in forward; otherwise they arrive in Phase 1.

```text
apps/web/src/app/
├─ layout.tsx                    <html lang="en">; imports @xr/ui/styles.css then ./globals.css; <Providers> (QueryClient + PlatformProvider);
│                                metadata: "XR Learning Platform" (+ per-page titles)
├─ not-found.tsx                 PU-15 public variant (MessagePage). The PublicHeader/PublicFooter frame is added with the public
│                                shell (Phase 1, or Phase 0 under G-8); the root not-found gets the root layout only
├─ healthz/route.ts              kept
├─ (public)/layout.tsx           [G-8] PublicHeader + PublicFooter (from B1-01 markup; header items gated by the built-screen manifest)
├─ (public)/not-found.tsx        [G-8] PU-15 public variant inside the public shell
│                                (no (public)/page.tsx in Phase 0: "/" resolves to the PU-15 public pattern until PU-01, Phase 1)
├─ (auth)/layout.tsx             [G-8] AR-6 focused card on brand background (xp-auth), no public header
├─ (auth)/sign-in/page.tsx       [G-8] XS-01 (+ XS-03 via ?reason=signed-out|expired&returnTo=, XS-04 disclosure)
└─ <base>/                       for base in student, faculty, institute, vendor, reviewer, content-manager, admin
   ├─ layout.tsx                 <SessionGate> → <WorkspaceFrame expected="<role>">: shell chosen by the SESSION role;
   │                             on mismatch renders the own-role shell + XS-06 in place (URL kept, nothing current)
   ├─ page.tsx                   interim: redirect to <base>/help (ADR-0005 engineering-build landing) until the workspace
   │                             home is built (SA-01 P1 · IA-01 and ST-01 P2 · FA-01 P4 · VE-01, RV-01, CM-01 P5)
   ├─ not-found.tsx              PU-15 workspace variant (in shell; "Back to Home" + Help)
   ├─ [...unmatched]/page.tsx    notFound()
   └─ help/page.tsx · help/report/page.tsx · help/reports/[reportId]/page.tsx      XS-07
   (student only: the guard sits in student/layout.tsx above (shell); (focused) arrives with ST-13 in P4)
next.config.ts redirects() in Phase 0 (routes.md §3.7): /<base>/help/reports → /<base>/help (row 20);
                                                        /signed-out → /sign-in?reason=signed-out (row 21) arrives with XS-03
```

Notes:

- **No `proxy.ts` in sample mode** (X-3). The client `SessionGate` reads the session through `useSyncExternalStore` with a `null` server snapshot, shows the drawn loading state while the session resolves, and replaces the URL with `/sign-in?returnTo=<path>`. Until XS-01 exists (Phase 1, unless G-8), an engineering build without a CI boot descriptor therefore shows the public not-found pattern at `/sign-in`. This is expected, and it is recorded in the verification record (K-21). [PROVISIONAL]
- **XS-06 is not a route** (D-12, D-15). Static workspace folders avoid a dynamic root `[workspace]` segment, which would sit beside 16+ static segments. [CONFIRMED defect handling]
- **Unbuilt destinations.** Until a designed screen is built, its URL resolves to the not-found pattern and no navigation item points to it (`navigation.json` rule "No link to removed or deferred destinations"; B8-06 "a sidebar item exists only when its screen exists"). In Phase 0 each sidebar therefore shows only Help. `/<base>` redirects to `/<base>/help` (interim, ADR-0005), so "Back to Home" on the in-shell not-found page and on XS-06 reaches a built page instead of looping. The public PU-15 action "Browse experiments" (→ `/experiments`, PU-04) is a known Phase-0 dead link; the verification record lists it until Phase 1. A link-target ledger records the target of every drawn action on the Phase-0 screens, and a test fails if a Phase-0 primary action resolves to the page it is on. Phase-0 builds are engineering builds, not stakeholder review builds. [PROVISIONAL — acknowledge, §10.2]
- **`notFound()` from client components** in sample mode (record existence is known only in the browser) is assumed from the App Router model and verified by a spike in WP-0.13. Fallback: render the MessagePage directly. In sample mode, a not-found detected on the client returns HTTP status 200. [PROVISIONAL]

### 3.4 `packages/ui` (tokens, CSS layers, components)

```text
packages/ui/
├─ package.json                 exports: "." (dist) · "./styles.css" → src/styles/index.css ; files: dist, src/styles/**
└─ src/
   ├─ styles/
   │  ├─ index.css              first line: @layer theme, xr.v46, xr.product, utilities;  then @import … layer(xr.v46) ×8 (B8-07 order),
   │  │                         @import product.css layer(xr.product)
   │  ├─ v46/xr-foundation.css · xr-public.css · xr-workspace.css · xr-learning.css · xr-assess.css · xr-vendor.css ·
   │  │      xr-govern.css · xr-admin.css      byte-identical to design/handoff-v46/canvas-v46/project/ (checksum test)
   │  ├─ v46/art/*.svg          19 SVGs next to the CSS so url("art/…") resolves
   │  ├─ product.css            additive xr.product layer: PF entries, each with its id and evidence in a comment
   │  └─ fonts/fonts.css (+ public-sans-{400,500,600,700}.woff2 if VD-02 = self-host)
   ├─ link.tsx                  LinkProvider / LinkComponent (next/link injected by apps/web)
   ├─ icons/registry.ts         generated from board 02 (48 named) + observed board paths; never hand-drawn
   ├─ foundation/ (19)          Button · IconButton · Link/BackLink/JumpLink · Icon · FormatBadge/FormatSet · StatusPill · Notice ·
   │                            ShellBanner · Empty/Loading/Failed/NoMatch states · MessagePage · Section/Stack · PageHeader ·
   │                            Breadcrumbs · LogoPlaceholder · Avatar/CountBadge · IdChip · Typography · Rows/AttentionList · SkipLink
   ├─ forms/ (10)               Field · TextInput (password reveal with XS-01: P1, or P0 under G-8) · Select · Textarea · Checkbox/Radio/ChoiceCard ·
   │                            SegmentedControl · FileInput · Stepper · ErrorSummary · FormFooter
   ├─ data/ (5)                 DataTable (+ PF-01 sort) · ListToolbar · Tabs (link tabs; status tablist + tabpanel) · Timeline · DecisionLayout
   ├─ overlays/ (4, +1 G-8)     Dialog (DL-1/2/3, native dialog) · Drawer · AccountMenu (disclosure) · RailTooltip · [G-8] PublicMenuSheet
   ├─ shells/ (4, +2 G-8)       WorkspaceShell · Sidebar + NavItem · TopBar · HelpSupport template · [G-8] PublicShell ·
   │                            [G-8] SignInCard / xp-auth frame
   └─ testing/                  markup-contract helpers (board excerpt fixtures with board code + frame)
```

- **Layers** (`visual.md §2.2`): all 8 sheets in **one** layer `xr.v46` (a later sheet's weaker selector must not beat an earlier sheet's stronger one, e.g. `.xr-btn[aria-disabled="true"]` vs `.xg-del`); `apps/web/src/app/globals.css` repeats the same `@layer` statement as its first line, then only the constrained Tailwind layers if VD-01 = option A. [PROVISIONAL, ADR-0001]
- **Tokens**: the 65 `--xr-*` custom properties stay in `xr-foundation.css :root`; no second token file; literal hex values are not tokenised in Phase 0 (T-3); TS constants only where code needs a value, generated from `handoff/tokens.json` with a drift test (T-2); product-only literals use `--xr-x-*` (T-4). [PROVISIONAL]
- **Product layer in Phase 0**: PF-01 (B1-10, §WP-0.7), PF-02, PF-03, PF-04, PF-05, PF-06, PF-07, PF-09, PF-11, PF-13. Not built: PF-08 motion (VD-09 UNRESOLVED), PF-12 forced colours (VD-15 UNRESOLVED) — both deferred (register DV-8); the reduced-motion guard already in the v46 CSS stays; PF-10 is a prop, no CSS. [PROVISIONAL]
- **Components emit board classes and ARIA exactly**; props map to modifiers; state maps to ARIA first, `is-*` only where the CSS keys on it; `className` passthrough for composition utilities only; no Tailwind classes inside `@xr/ui`; no headless kit or third-party design system (owner constraint; `visual.md §11` item 3). [PROVISIONAL / CONFIRMED constraint]
- Surface-specific parts (`xa-`, `xv-`, `xl-`, `xg-`, `xp-` page sections) live in `apps/web/src/features/*` and move to `@xr/ui` once two surfaces reuse them (`visual.md §3`). [PROVISIONAL]

### 3.5 `packages/domain` (models, state machines, policy)

```text
packages/domain/src/
├─ index.ts
├─ ids.ts                 branded ids (12 drawn prefixes + opaque ids), RESERVED_ID_SLUGS          (schemas §1.1)
├─ time.ts                IsoInstant, CalendarDate brands; ClockPort type                          (schemas §1.2)
├─ roles.ts               PLATFORM_ROLES (ids kept), ROLE_PLANE, ROLE_LABEL, Audience, ActorRef, SystemActor
├─ technology.ts          TECHNOLOGIES (kept), DeliveryModel (kept), FORMAT_DISPLAY_ORDER, FORMAT_META, inDisplayOrder
├─ record-kind.ts         RecordKind union, RecordRef                                               (X-9)
├─ provided.ts            Provided<T> — figures supplied as data, never derived (T-06, OD-B3-07, OD-B3-08)
├─ decision.ts            Decision<E> = { ok: true; events; receipt } | { ok: false; refusal }
├─ history/               HistoryEntry<E>, canonical event kinds, visibleTo audiences                (schemas §1.6, M28)
├─ policy/                PolicyContext (actor, scope, now), may(), availableActions(); rule table keyed by matrix row id; deny by default
├─ invariants/            12 predicates (architecture §5.5)
├─ catalogue/             AREA, CRS (+ platform code), EXP (+ versions, published formats), LO, RES — M06, M07, M09
├─ submission/            SUB machine (BC7), publication check, review/publication decisions — M10
├─ correction/            UPD machine (BC8), one open update per experiment — M11
├─ request/               REQ machine + payment attempt; four separate events (BR-036) — M03; SEL types — M04
├─ institution/           INST, Institute Admin assignment, ACC; pause/restore; term state derived from the clock (Slice-1 term.ts) — M01, M02, M05
├─ access/                SACC (individual / group, membersAtGrant), grant machine, experimentGate, formatAvailability, canOpenFormat — M15
├─ people/                PER (Programme on the Student record only, BC2), GRP, FMAP, CCODE — M08, M12, M13, M14
├─ resources/             resource opened (Student × resource) — M18
├─ runtime/               events.ts (kept), utilisation.ts (foldSessions kept; activity only) — M16
├─ completion/            FormatCompletion, CompletionPolicy (injectable), interimCompletionPolicy (committed rule), handler decision — M17
├─ feedback/              FB eligibility; one record per Student × Experiment × format — M19
├─ assessment/            ASMT (+ versions), Q (+ drafts, imports), ATT/marking/result; readiness; release derivation; no defaults — M20–M22
├─ device/                DTR + authorised device; approve only — M23
├─ support/               SUP — M24
├─ platform-roles/        ROLE holder + scopes (all · course · experiment) — M25
├─ session/               MockSession shape (person id only) — M26
└─ read-models/           usage, navCounts, banner facts, overviews, follow-up — M27
```

Each family holds `model.ts`, `states.ts` (canonical status union + transition table), `decide.ts` (one pure decision per command with **explicit, minimal inputs** — the records it needs, the actor, `now` — never the whole world, because `@xr/domain` may depend on nothing), `policy.ts`, `derive.ts` and tests (`architecture.md` R1, §1.3). Open rules are typed policy interfaces with **no default** — `CompletionPolicy` (T-12), `OverlapGrantPolicy` (OD-B2-01/02), `LicenceAvailabilityOracle` (D7), `WorkflowRoutingPolicy` (M-3, may only return the drawn default) — so code cannot silently decide them (`schemas.md §3.18`). [PROVISIONAL; separation CONFIRMED by BC3–BC9]

### 3.6 `packages/contracts/src/draft` (ports and DTOs)

```text
packages/contracts/src/draft/
├─ index.ts                       DRAFT re-exports of ports, DTOs and errors, never the contract suite (not in WIRE_CONTRACTS or OpenAPI until apps/api serves them)
├─ errors.ts                      Result<T,E>, ServiceError union (§6.5), RefusalCode, FieldError
├─ ports/                         22 product ports: session · catalogue · selection · access-request · institution · people · group ·
│                                 faculty-course · institution-course-code · student-access · learning · feedback · assessment ·
│                                 question-bank · marking · teaching · production · correction · academic-structure ·
│                                 platform-course-code · platform-role · operations
├─ standins/                      6 test/seed-only ports: clock · payment-outcome · runtime-report · workflow-routing ·
│                                 licence-availability · overlap-grant
├─ dto/<port>.ts                  zod input + output schemas per method (built on @xr/validation primitives)
└─ contract-suite/                framework-free (node:assert), runContractSuite(factory); own subpath ./draft/contract-suite:
                                  ports/<port>.cases.ts · flows/{a,b,c,d,e,f,device,cross-cutting}.cases.ts · invariants.cases.ts
```

The suite outlives the mock: `@xr/sample-platform` runs it in node now; `apps/web` runs it against the HTTP adapter later (`architecture.md §1.2` point 2, §8 item 4). It is published on its own subpath, `./draft/contract-suite`, is never re-exported from `./draft`, and a lint rule bans it outside test files and `@xr/sample-platform` tests, so Node built-ins cannot reach the client graph through the composition root or the queries. [PROVISIONAL, AD-02]

### 3.7 `packages/sample-platform` (mock adapter)

```text
packages/sample-platform/
├─ package.json                   exports: "." (createSamplePlatform) · "./testing" (buildWorld, fixtures, manual clock, setSampleNow, fault plan)
└─ src/
   ├─ world/                      World types + envelope {schema, version, seedId, worldVersion, anchor, seededAtReal, records,
   │                              history, idSource, runtimeEvents, processedCommandIds}
   ├─ store/                      in-tab async mutex; commit; subscribe → change bus
   ├─ persistence/memory.ts       [P0] default (option A)   ·   browser.ts only if AD-07 = B (TE-6; Slice-1 storage.ts / world-store.ts)
   ├─ pipeline/                   serialise → resolve actor from records → policy → validation → load inputs → decide → apply →
   │                              checkInvariants → commit → receipt; commandId dedupe; rev check; fault hook (tests only)
   ├─ handlers/<port>/            load inputs, apply events, view models with availableActions + mode/reason
   ├─ standins/                   clock (anchored) · payment-outcome · runtime-report (+ completion handler call) · workflow-routing ·
   │                              licence-availability (seeded answers only) · overlap-grant (no default)
   ├─ seed/                       spine-start.ts (seed(anchor)) · walk/ (A1–A4, B1, S1–S7, B3–B5, C, D, E + alternates, F + alternates,
   │                              Dv1–Dv3) · later-sample.ts · state-coverage.ts · people.ts · reservations.ts
   ├─ ids/                        per-prefix source: reserved board references first, then next free id above the floor;
   │                              injected source for commandId and nonces (no Math.random)
   ├─ events/                     change bus {worldVersion, changed: RecordRef[]}
   └─ testing/                    buildWorld(seed, commands) · afterFlow('A'…'F') · laterSample() · stateCoverage() · faults
```

[PROVISIONAL, AD-01; GATE G-2]

### 3.8 Import fences (ESLint, added in WP-0.4) [PROVISIONAL]

- `@xr/sample-platform` may be imported only by `apps/web/src/platform/composition.ts`, by `apps/web/src/platform/test-hook-bridge.ts` (its `./testing` export only) and by test files.
- `features/**` may import `@/queries/*`, `@/copy/*`, `@/nav/*`, `@xr/ui`, types from `@xr/contracts/draft`, and vocabulary from `@xr/domain` (ids, roles, technology, status unions). It may not import decision, policy or derive functions.
- `app/**` route files may import only `features/**`, `platform/**` providers, `@xr/ui` (components and `styles.css`) and `next/*`.
- The test-hook bridge is chosen at build time by an alias in `next.config.ts` (the one literal `process.env.NEXT_PUBLIC_XR_TEST_HOOKS` read, recorded under TE-7); nothing else reads `process.env`, and the runtime env object from `@xr/config/env` is never used to include or exclude test code.
- `@xr/ui` contains no Tailwind classes; raw hex is banned in TSX except the icon registry and tests (T-4); canvas classes are banned in product code (`doc-*`, `b1-*`, `is-focus`, `is-shown`, `xa-boardctl`, `xl-board-btn`, `xw-live`, `xr-dialog-scrim`, `xw-dlg-top`, `xa-dlg-end`, `xa-dlg-auto`, `xg-dlg`; `visual.md §2.6`).
- `Math.random` and `Date.now` are banned in `@xr/sample-platform/src` and `@xr/domain/src` (determinism; the clock port supplies time).

---

## 4 · Shared data, store and service structure

### 4.1 Ports: the 22 product ports mapped to B8-06's 14 service areas

B8-06 "Mock services": "Typed service interfaces for requests, institutions, access, people, progress, feedback, assessments, marking, submissions, publication, corrections, structure, roles, operations — returning the sample world." [CONFIRMED scope]

All 22 interfaces and all 183 methods are **typed** in Phase 0 (WP-0.10). The mock **implements** in Phase 0: every command method except CSV import parsing, assisted drafting and CSV export; and every read method that the Flows A–F + device-chain suites or the Phase-0 screens call. The other read methods land with their screens. A method ledger (method → phase) is part of WP-0.10 and is checked in acceptance. [PROVISIONAL]

| B8-06 area | Port (`schemas.md §3`) | Methods | Phase-0 mock implementation (others land with the named phase) |
|---|---|---|---|
| — (identity) | SessionService | 4 | all |
| — (public reads) | CatalogueService | 5 | `searchCatalogue`, `getExperiment` (E4/E5 visibility) · rest P1 |
| — (browser session) | SelectionService | 5 | all (A1; `sessionStorage` with memory fallback; not a world record) |
| requests | AccessRequestService | 12 | all (A1–A4; IA-17 requests) |
| institutions | InstitutionService | 9 | `assignInstituteAdmin`, `pauseInstitution`, `restoreInstitution`, `overrideStudentStatus`, `getInstitution`, `listContentAccess`, `getAccessPlan` · `listInstitutions` P1, `getMyOverview` P2 |
| people | PeopleService | 10 | `addStudent`, `addFaculty`, `commitStudentImport` (validated rows), `deactivateStudent`, `reactivateStudent`, `getStudent` · `previewStudentImport` (CSV parsing) P2, lists P2 |
| people | GroupService | 6 | `createGroup`, `renameGroup`, `addMembers`, `removeMember` · lists P2 |
| people | FacultyCourseService | 4 | `assign`, `previewRemoval`, `remove` · `list` P2 |
| people | InstitutionCourseCodeService | 2 | `set` · `list` P2 |
| access | StudentAccessService | 9 | all (B3–B5, Student reads B4) |
| progress | LearningService | 6 | `listResources`, `openResource`, `getFormatPage`, `launchWebFormat` (stores nothing, AD-16), `getMyProgress` · `getSimulationChooser` P3 |
| feedback | FeedbackService | 2 | all |
| assessments | AssessmentService | 16 | `createAssessment`, `updateQuestions`, `updateSettings`, `useUpdatedVersion`, `getAssessment`, `listSubmissions`, `listMyAssessments`, `getAssessmentIntro`, `startAttempt`, `saveAnswer`, `submitAttempt`, `getResult` · `getCreateOptions`, `listAssessments`, `previewAsStudent`, `exportSubmissionsCsv` P4 |
| assessments | QuestionBankService | 11 | `addQuestion`, `editQuestion`, `deleteQuestion`, `getQuestion`, `listQuestions` · drafting (FA-16) and import (FA-17) P4 |
| marking | MarkingService | 4 | all |
| marking / progress | TeachingService | 6 | `listStudents`, `getStudentDetail` (per-format reads in "others now see") · overview, courses, teaching view, CSV export P4 |
| submissions + publication | ProductionService | 24 | every command (`saveDraft`, `continueStep`, `submitForReview`, `saveRevision`, `resubmit`, `approveSubmission`, `returnSubmission`, `publish`, `sendBack`, `overrideStatus`) + `getRecord`, `getReviewQueue`, `getSubmissionForReview`, `listReviewedByMe`, `listReadyToPublish`, `getPublicationDecision`, `getContentRecord` · overviews, editor, library, all-content lists P5/P6 |
| corrections | CorrectionService | 15 | all except `listUpdates`, `listUpdatesForRelease` (P6) |
| structure | AcademicStructureService | 9 | every command + `getStructure` · `getArea`, `getCourse` P6 |
| structure | PlatformCourseCodeService | 2 | `save` · `list` P5 |
| roles | PlatformRoleService | 6 | `registerHolder`, `assignScope`, `withdrawScope`, `restoreScope` · lists P6 |
| operations | OperationsService | 16 | device chain (`getMyDevice`, `requestDeviceTransfer`, `listDeviceRequests`, `getDeviceRequest`, `forwardDeviceTransfer`, `listDeviceTransfers`, `approveDeviceTransfer`), support (`reportProblem`, `listMyReports`, `getMyReport`, `resolveReport`, `reopenReport`), `getUsage` · `listSupportReports`, `listAccessEnding`, `getSuperAdminOverview` P6 |

Stand-in ports (test and seed only — no UI of any kind, `schemas.md §3.18`): `ClockPort` (`setSampleNow` only from `./testing`), `PaymentOutcomePort.report` (TE-4), `RuntimeReportPort.reportActivity` / `reportCompletion` (X-7), `WorkflowRoutingPolicy.route` (only the drawn default), `LicenceAvailabilityOracle.waitFor` (seeded answers only, D7), `OverlapGrantPolicy.resolve` (no default; returns `undecided` → `policy-open`). [PROVISIONAL]

### 4.2 The one world (option A)

- **One world per browser tab, in memory** (option A, `architecture.md §3.1` R5). Every role signed in in that tab reads and writes the same world; sign-out and sign-in as another person keeps it; a reload or a full navigation rebuilds it from the seed. Nothing is written to `localStorage` or IndexedDB. B8-06 says persistence "stay[s] out until decided", and FUNCTIONAL_PARITY_MATRIX §G excludes the `localStorage` schema chain; option B (versioned `localStorage` snapshot + BroadcastChannel + Web Locks, TE-6) is built only after AD-07 says yes, behind the same persistence driver interface. [CONFIRMED (B8-06 wording) · PROVISIONAL]
- **Browser-session data that is board-drawn behaviour, not persistence**: the selection basket (B1-06 "lives in the visitor’s browser session until the request is sent") and the PU-10 requester ticket (B1-07 "continues from this session") use `sessionStorage` with a memory fallback. Phase 0 implements the store; their screens are Phase 1. [CONFIRMED (boards) · PROVISIONAL (mechanism)]
- **Shared records** (one canonical status each; role words in copy tables): REQ (+ payment attempts), INST (+ Institute Admin assignment), ACC, SACC, PER, GRP, FMAP, CCODE, AREA, CRS (+ platform code), EXP (+ versions, LO, RES), SUB, UPD, RUN activity, COMP, resource-opened, FB, ASMT, Q (+ drafts, imports), ATT (+ marks), DTR (+ authorised device), SUP, ROLE (+ scopes). Read models (usage, gates, overviews, nav counts, banners) are derived, never stored (M27). [PROVISIONAL shapes · CONFIRMED BC14]

### 4.3 Seed, scripted walk and fixtures

| Builder | Content | Use | Status |
|---|---|---|---|
| `seed(anchor)` "spine-start" | Platform people and background records in steady state (BITS Pilani — Hyderabad Campus, ME ZG523, Shell-and-Tube Heat Exchanger; Anil Shetty / Northline Simulation Studio, Prof. A. Menon, Kavya Nair, Arjun Mehta; the B1-10 / B7-02 institutions and requests with REQ-0038 and REQ-0040 under review; UPD-0001…0004; background submissions; "Composite Wall Conduction" published WEB + AR as a separate record). **Nothing Flows A/B create**: no Godavari, ACC-0107, Godavari people, GRP-0012, FMAP-0021, MEC-523, SACC/ASMT/ATT/DTR/RUN/COMP/FB of Godavari people; no REQ-0042, SUB-0077 or UPD-0005 | Default boot world; base of every fixture | PROVISIONAL (AD-08) |
| scripted walk | Commands on a manual clock in board-date order: A1–A4 (REQ-0042 → INST Godavari → payment → ACC-0107), B1 (Meera Iyer), untraced setup S1–S7 (students imported 8 Oct 2026, Sneha Reddy inactive, Faculty ×3 with Prof. Ravi Shankar inactive, FMAP-0021, GRP-0012, MEC-523, Rahul's authorised VR device as a seeded value), B3–B5, C, D, E (+ CM send-backs, SA override), F (+ withdraw, return, hold, lift hold), Dv1–Dv3 | Flow suites; fixtures `afterFlow('A'…'F')` | PROVISIONAL |
| `laterSample()` | 12 Oct 2026 states: SACC-0311 via a real group `giveAccess`; SACC-0312 given then withdrawn; seeded "Waiting for a licence" values only (Arun Kumar; SACC-0313/0314) because no rule may produce them (T-06/D7) | Fixtures for later phases | PROVISIONAL (AD-17, AD-18) |
| `stateCoverage()` | At least one record in every drawn state each screen needs, each with a `seedNote` naming its board frame | Screen-state tests; candidate hosted default (X-6) | PROVISIONAL |

- **Ids**: the walk and fixtures reserve every board reference they create (REQ-0042, REQ-0058, ACC-0107, SACC-0310…0314, ASMT-0009, ATT-0450, DTR-0018, SUB-0077, UPD-0005, SUP-0213 …); otherwise the next free id above the per-prefix floor (the highest drawn id: REQ-0058, ACC-0107, SACC-0314, ASMT-0009, ATT-0451, SUB-0086, UPD-0007, DTR-0019, SUP-0213, Q-0117, GRP-0013, FMAP-0021). Ids never equal a reserved route slug (`new`, `draft`, `import`, `edit`, `revise`, `help`, `not-allowed`). Routes use opaque ids where no prefix is drawn; references are display data. [PROVISIONAL (X-14)]
- **Determinism**: `seed(anchor)` is pure; no `Math.random`; command ids, session nonces and launch nonces come from an injected id source; history timestamps from the clock. [PROVISIONAL]
- **Sample people and sign-in**: every PER or ROLE holder with an e-mail can sign in (AD-29). Recommended credential rule: a known sample e-mail plus any non-empty password; an unknown e-mail gives B1-09 f3 "Wrong details" (AD-03). The list of sample people lives in the developer README and test fixtures only, never in product UI (`architecture.md §2.3`). "Marked as sample" (T-36) lives in seed metadata and `seedNote`, never in product chrome (`schemas.md §8-10`). [PROVISIONAL]
- **Sample-data conflicts** S-1…S-12 (`schemas.md §4.2`) and the one anchor date (OD-B6-12, OD-B7-08, OD-B7-14, OD-B7-15, OD-B4-16) are sample-only. Phase 0 records a provisional anchor and runs the walk on board dates; the owner confirms before hosted review. [UNRESOLVED — no product effect]

### 4.4 Clock and time

`ClockPort.now(): IsoInstant` is injected into every decision and derivation. Sample clock: `now = anchor + (realNow − seededAtReal)`; tests use a manual clock; `setSampleNow` exists only in `./testing` (X-8). Time-based states (Ending soon ≤ 15 days, Access ended, Result ready by date/deadline, Inactive for N days) are derived at read time, never scheduled (ARCHITECTURE §8 principle). Nothing in the product shows or sets the clock (TE-5; ARCHITECTURE §14 "no demo clock"). [PROVISIONAL]

### 4.5 Command pipeline (`architecture.md §1.4`) [PROVISIONAL]

1. Serialise (in-tab async mutex) and read the latest world.
2. Resolve the actor from records on every call: session person id → PER or ROLE holder → role, institution, scopes. **The caller never passes a role** (Slice-1 `services/access/types.ts` principle).
3. Policy (`@xr/domain/policy`): may this actor do this action on this record, in this state and scope? Else refuse (`not-permitted` with `wrong-workspace` / `out-of-scope` / `not-own-record`, or `invalid-state`, `refused`, `policy-open`).
4. Validation with the DTO schema; field errors carry the exact drawn copy.
5. Load inputs → `decide` (pure) → `apply` events + history.
6. `checkInvariants(before, after, command)` — a violation is a programming error and throws.
7. Commit (`worldVersion + 1`) and publish `{worldVersion, changed: RecordRef[]}` on the change bus.
8. Return `{ ok: true, value, changed }` or `{ ok: false, error }`. **A refusal writes nothing.**

Each command carries a client-minted `commandId`; a repeated id returns the first receipt (B1-07 f6 "Submitting", B1-09 f2 "Signing in": cannot be sent twice). Each written record carries `rev`; a stale `expectedRev` returns `stale-version` (schemas §1.8).

### 4.6 Query layer and invalidation (`architecture.md §1.5`) [PROVISIONAL]

- Keys `['xr', sessionKey, kind, view, params]`; `sessionKey = person:<id>#<nonce>` or `public:<browser-session-id>`, so one person's cached answers never show for another.
- Every query declares `meta.deps: RecordKind[]`. One function invalidates on every receipt: `queryClient.invalidateQueries({ predicate: q => q.meta?.deps?.some(d => changedKinds.includes(d)) })`. No hand-written per-mutation lists.
- Sample mode: `staleTime: Infinity`, no refetch on focus (the world changes only through commands). Sign-out or identity change: `queryClient.clear()`.
- `useCommand(port.method)` wraps `useMutation`: refusals are values (they drive field errors, the error summary and read-only states); only `unavailable` is thrown (drawn "failed + try again"); no optimistic updates — busy labels ("Approving…") until the receipt.

### 4.7 History, events, notifications

- `HistoryEntry` = what · when · who · note · `visibleTo` · refs (`schemas.md §1.6`). Which commands write which entry follows the boards (M28 table; e.g. a Vendor draft save writes history only on the first save). Reversible changes keep history; nothing is hard-deleted (BR-126). [CONFIRMED (boards) · PROVISIONAL (shape)]
- The change bus carries domain facts for invalidation and tests only. **No adapter sends anything**: no notifications, reminders or messages (T-34; XC-01). "Reminder due" is a derived status; the STK31-28 reminder stays an unmet production requirement flagged to the owner (AD-30). [CONFIRMED (T-34 safe treatment) · flagged conflict]

---
## 5 · Permission enforcement

No permission matrix was designed (`design/handoff-v46/HANDOFF-AUDIT-v46.md` item 7). The 347-row candidate in `permissions.md` is the input; it is evidence-derived, not owner policy. Its principles P1–P12 hold for every layer below. [CONFIRMED principle (B8-06 "Permissions": "Role guards per workspace … actions offered only where the design offers them") · PROVISIONAL mechanism]

### 5.1 Four layers, one source of truth

| Layer | Where | What it does | Never |
|---|---|---|---|
| Policy | `@xr/domain/policy` | `may(ctx, action, record)` and `availableActions(ctx, record)` — pure functions over the actor (resolved from records), scope, record state and `now`. Each rule carries the matrix row id(s) it implements. Deny by default: an action with no ALLOW rule is refused | No React, no I/O, no world |
| Enforcement | `@xr/sample-platform` pipeline step 3 (later: `apps/api` application layer calling the same functions) | Every command is checked before validation and decision; a refusal writes nothing | The UI is never the enforcement point |
| Offer | port view models | Every view model returns `availableActions` and `mode` / `reason` (`decide` · `read-only` · `not-available`) computed by policy | A screen never computes permissions |
| Render | `features/**` | Renders a control only when its action is listed. Drawn absences become structural: no Publish for Super Admin or Reviewer, no Decline anywhere, no format picker on IA-05, no "I have finished", no Release on FA-12, no Approve on IA-19 (`architecture.md §6.3`) | No disabled placeholder controls; no control a board does not show (`handoff/README.md` "Done") |

Matrix kinds map onto code: **ALLOW** → a policy rule; **DENY** → explicit refusal test (and no rule); **READ** → read-model visibility; **SYSTEM** → reachable only through stand-in ports or system handlers (runtime, payment, release by setting, routing, term clock), never through a user command; **OPEN** (15 rows, always UNRESOLVED) → never offered, refused with `policy-open` or `not-permitted` (P4). Rows a stakeholder record contradicts (22) are built per v46 or the designed safe treatment and listed for the owner; none is CONFIRMED (`permissions.md §4.4`). [PROVISIONAL]

### 5.2 Guards

| Guard | Phase-0 implementation | Evidence | Status |
|---|---|---|---|
| Session gate | `SessionGate` in each workspace layout: no session → `/sign-in?returnTo=<path>`; expired → `?reason=expired` notice (B1-09 f9). `returnTo` honoured only as a same-origin relative path (single leading `/`) inside the signed-in role's own base; otherwise the role home | `routes.md §3.8` row 1; B1-09 "Session expired returns them to the page they were on"; AD-21 | CONFIRMED (states) · PROVISIONAL (rule) |
| Workspace guard (XS-06) | `WorkspaceFrame expected=<role>`: the shell is chosen by the **session** role; on mismatch the own-role shell renders XS-06 in place — URL kept, nothing current in the sidebar, "Back to Home" to the own home, Help to the own Help; no route, role or status code shown | Board 08 XS-06 card; `navigation.json` rule; SES-02; BR-004 | CONFIRMED |
| No cross-role links | Nav configs and features link only inside their workspace, plus Help and the public request pages | SES-03; BR-007; B8-01 audit | CONFIRMED |
| Unknown address | `[...unmatched]` → in-shell PU-15; root `not-found.tsx` → public PU-15 | Board 08 "Page not found · workspace / public" | CONFIRMED |
| Record guards (framework) | `RecordGuard` renders the drawn state from the view model's `mode` / `reason`: ST-19 family (Phase 2), "Draft · read-only" (P5), RV-06 decided (P5), "Still in academic review — read-only" (P5), "Nothing to decide" (P6), "hasn't reached BITS yet" (P3/P6), confirmed marks (P4), published read-only (P6), paused read-only (P2). Phase 0 builds the mechanism with fixture view models; each guard is wired with its screen | `architecture.md §6.2`; `routes.md §3.8` (16 runtime guards) | PROVISIONAL (mechanism) |
| State guards | Paused institution: IA writes refused ("Pages are read-only until BITS lifts the pause.", B2-01 paused frame), Students can't open experiments, device requests can't be forwarded, its requests can't be decided; Faculty: banner only (OD-B7-07). Inactive Student: nothing opens. Enforced in policy; the banner is XS-08 | P9; `schemas.md §3.0` `institution-paused` copy | CONFIRMED (drawn) · UNRESOLVED (per-screen presentation on IA-06…IA-15, IA-17 — schemas §8-33) |

### 5.3 Matrix-driven tests

- WP-0.2 commits the matrix as `v2/docs/v46/permission-matrix.json` (byte-identical to `wf/final/permissions.json`, SHA-256 recorded), marked "candidate — owner review", with `docs/v46/` in `.prettierignore` so formatting cannot rewrite it. The `@xr/domain` policy tests read a copy in `packages/domain/test-data/permission-matrix.json` that a checksum test pins to the `docs/v46/` file. Turbo caches `test` on package-local inputs, so this keeps the cache key honest when an owner decision flips a row (the alternative is to declare the matrix path as a task input). [PROVISIONAL]
- Matrix row prefix `FCM` is the record kind `FMAP` (board code, X-9); row ids stay unchanged for traceability.
- `@xr/domain` tests read it and, per row: **ALLOW** — for each acting role, a fixture in the required state and scope gives `may() === true` and the action is in `availableActions`; every role not covered by another ALLOW row is denied. **DENY** — refusal and absence. **OPEN** — absent from every `availableActions`; the command is refused. **SYSTEM** — no user-facing command produces the transition (property: run every user command against fixtures and assert the transition never appears). **READ** — asserted in the contract suite through the role's read model.
- A coverage test fails if any of the 347 row ids is not referenced by at least one test, or if a rule references an id that is not in the matrix. Test names carry the row status, so an owner decision flips one row and its tests. Presentational rows ("no Publish control on SA screens") get a policy assertion in Phase 0 and a UI assertion when the screen lands. [PROVISIONAL]

---

## 6 · Schema and validation foundations

### 6.1 Branded identifiers (`schemas.md §1.1`) [PROVISIONAL; drawn formats CONFIRMED]

- Twelve drawn prefixes, displayed "Prefix + four digits in a monospace chip" (B8-03 "Record IDs"): `RequestId` REQ-0042, `AccessPlanId` ACC-0107, `StudentAccessGrantId` SACC-0310, `AssessmentId` ASMT-0009, `AttemptId` ATT-0450, `SubmissionId` SUB-0077, `UpdateId` UPD-0005, `DeviceTransferId` DTR-0018, `SupportReportId` SUP-0213, `QuestionId` Q-0101, `GroupId` GRP-0012, `FacultyCourseMappingId` FMAP-0021.
- Opaque ids for records with no drawn id (INST, PER, EXP, CRS, AREA, ROLE holder, RES, LO, FB, payment attempt, Institute Admin assignment, question draft, import batch, history entry). `CourseId` is a stable key, never the platform code (blank allowed, contains a space — T-17, D-13). `ExperimentId` reuses the committed `slug`; the two Composite Wall records have different slugs (BC11).
- `RequestStatusToken` is opaque; the REQ reference "does not open the page on its own" (B1-08).
- `RESERVED_ID_SLUGS = ['new','draft','import','edit','revise','help','not-allowed']` are never minted.
- Brands live in `@xr/domain` (framework-free); `@xr/contracts` maps validated wire strings to them.

### 6.2 Time

`IsoInstant` (UTC `toISOString` form) and `CalendarDate` (`YYYY-MM-DD`) brands in `@xr/domain`; the committed `@xr/validation` `isoInstant` codec stays; `@xr/contracts` maps between them; display in one configured zone (sample times read as Indian local time; owner note only). [PROVISIONAL]

### 6.3 Status unions and per-role label maps [CONFIRMED words · PROVISIONAL mechanism (AD-24)]

- One canonical status per record, as a string-literal union in `@xr/domain/<family>/states.ts`, with its transition table.
- Words come from `apps/web/src/copy/status/<record>.ts`: `LabelMap<S> = Partial<Record<Audience, Record<S, string>>>`; for SUB the key also includes revision and origin (first submission, resubmit, CM re-check), because the Vendor sees "Submitted" after a resubmit (B5-06 f4; M-3) but "With Academic Reviewer" on the first submission.
- Sources are the boards and B8-03, **not** `entities.json`, which is incomplete and single-perspective (HD-3; schemas D-02…D-11). Examples: REQ requester "Submitted" until "BITS started reviewing", then "Under review" (B1-13); SACC "No access yet" / "Active" / "Waiting for a licence" / "Individual grant withdrawn" (B2-04, B2-05 f11); DTR "With your Institute Admin" / "Waiting on you" / "Still with the institution" (B3-07, B3-09, B3-11); UPD SA "Waiting for your decision" (B7-05).
- Services return canonical states plus the facts a label needs (dates, revision, who); never pre-rendered words. `StatusPill` takes tone + words.

### 6.4 zod placement (`schemas.md §5.1`) [CONFIRMED by matrix · PROVISIONAL content]

| Package | Holds |
|---|---|
| `@xr/domain` | TS types and brands; pure rules (readiness, open gate, publication check, release time, derivations, `ENDING_SOON_DAYS`). No zod |
| `@xr/validation` | Field primitives shared by forms and adapters: `requiredTrimmed(msg)`, `wholeNumberString(msg)` (`/^[1-9][0-9]*$/`), `wholeNumberInRange(min,max,msg)`, `emailAsDrawn(msg)`, `httpsLinkAsDrawn(msg)`, `calendarDate`, committed `isoInstant` |
| `@xr/contracts/draft` | One input schema per command and one output schema per DTO; later published as OpenAPI components |
| `apps/web` | React Hook Form + `zodResolver` with the same schemas, `mode: 'onSubmit'`, `reValidateMode: 'onSubmit'` (B8-07 "Validate on the primary action"; no as-you-type validation is drawn) |

### 6.5 Error model (reconciled, X-2) [PROVISIONAL, ADR-0008]

```ts
type Result<T, E extends ServiceError = ServiceError> =
  | { readonly ok: true;  readonly value: T; readonly changed: readonly RecordRef[] }
  | { readonly ok: false; readonly error: E };

type ServiceError =
  | { kind: 'not-signed-in' }                                                            // → /sign-in?returnTo
  | { kind: 'not-permitted'; why: 'wrong-workspace' | 'out-of-scope' | 'not-own-record' } // → XS-06 or the action is absent
  | { kind: 'not-found' }                                                                // → PU-15 pattern (public / in-shell)
  | { kind: 'invalid-state'; current: string }                                           // record moved on → refetch, render its drawn state
  | { kind: 'refused'; code: RefusalCode }                                               // drawn refusals with drawn copy (schemas §3.0 table)
  | { kind: 'validation-failed'; fieldErrors: readonly FieldError[]; summaryTitle: string | null }
  | { kind: 'stale-version'; currentRev: number }
  | { kind: 'conflict'; code: 'duplicate' | 'already-sent' | 'already-exists' }
  | { kind: 'policy-open'; decision: string }                                            // an undecided rule was reached, e.g. 'OD-B2-01'
  | { kind: 'unavailable' };                                                             // → drawn "failed + try again · Nothing was lost"
```

HTTP mapping for the later adapter (committed `1b090c9:v2/packages/contracts/src/problem.ts`, RFC 9457): not-signed-in 401 · not-permitted 403 · not-found 404 · invalid-state / refused / conflict / stale-version / policy-open 409 with a typed `type` URI · validation-failed 422 `errors[{path,message}]` · unavailable 503.

UI grammar (BR-123; `architecture.md §7.2`): pending → drawn loading state (or the archetype pattern where not drawn); empty → drawn empty state with next step; read failed → "Try again"; command `unavailable` → nothing changes, error summary, answers kept; validation → error summary takes focus, links to fields, fields keep input; not found → board 08; wrong workspace → XS-06 in place. Stale and concurrent changes render the record's current drawn state; any extra one-line explanation needs owner approval (AD-20). Undrawn states use the board-04 copy formula and go into a per-screen state copy register for sign-off (VD-12).

### 6.6 Field error and error-summary contract [CONFIRMED rules · PROVISIONAL shape]

```ts
interface FieldErrorView   { readonly fieldId: string; readonly message: string; readonly summaryText: string }
interface ErrorSummaryView { readonly title: string; readonly items: readonly FieldErrorView[] } // role="alert", tabIndex -1, focused on submit
function toErrorSummary(e: ValidationFailed, titleFor: (n: number) => string): ErrorSummaryView;
```

- Errors in words under the field (`xr-error` / `xw-ferr`, `aria-invalid`, `aria-describedby` = hint + error) **and** in a summary whose links move focus to the field (board 12 "Summary links move focus to the field"; B8-07).
- Focus on submit: page forms → the summary; dialogs → the first invalid field; single-field forms (ST-18) → the field (`visual.md §5.1`).
- Emitted class `xw-errsum` (192 product instances; VD-22 UNRESOLVED, recommended). Always linked: the 30 plain-text summaries on B2-05, B2-07, B2-14 and B3-08 are normalised to linked items (VD-21). The 47 B5 "missing items" summaries keep their per-item "Go to …" buttons inside a focusable wrapper (Phase 5).
- Busy: the label says what is happening, the button is `aria-disabled`, repeat presses are ignored.

### 6.7 Copy catalogue

`apps/web/src/copy/messages.ts` holds the exact drawn messages, one key per field rule (`schemas.md §5.4`: PU-06/07, PU-08, SA-03, XS-01, XS-07, IA-04/05/07/10/11/13/14/15/16/17, ST-16, ST-18, FA-07/10/15/16/17/19, VE-03/04/05, RV-03/04, CM-03/08/09, SA-07/11/13/14/15/16/17/21) and the refusal copy (`schemas.md §3.0` table). DTO schemas reference keys, so a copy change never touches a rule. Phase 0 fills every key (it is data) and tests the XS-07 keys on screen (and the XS-01 keys under G-8). Decision ids inside product copy (298 text instances, `visual.md §10`) are routed through the same catalogue so VD-10 stays reversible; Phase 0 has none of those screens. [PROVISIONAL]

---

## 7 · Test infrastructure and visual-parity strategy

### 7.1 Layers

| Layer | Tool (foundation version) | Runs in | Phase-0 scope | Gate |
|---|---|---|---|---|
| Domain unit + transition + invariant | Vitest 4.1.11 (node) | `@xr/domain` | All 28 models; exhaustive transition pairs; 12 invariants under seeded randomised command sequences (no new dependency; a property-testing library only if the owner approves it) | blocking |
| Policy (matrix-driven) | Vitest | `@xr/domain` | 347/347 rows referenced (§5.3) | blocking |
| Contract suite | framework-free (`node:assert`) in `@xr/contracts/draft`, run by Vitest | `@xr/sample-platform` (later also `apps/web` HTTP) | Every Phase-0 method; Flows A–F + device + cross-cutting suites; refusals write nothing; idempotency; stale version | blocking |
| Determinism and seed | Vitest | `@xr/sample-platform` | `seed(anchor)` deep-equal twice; walk reproduces board references; spine-start has no Godavari dependants | blocking |
| Component (markup contract + behaviour + axe) | Vitest + RTL 16.3.3 + user-event 14.6.7 + jest-dom 7.0.1 (jsdom) + axe-core (new pinned devDependency, G-5b) | `@xr/ui`, `apps/web` | 42 components (45 under G-8); foundation screens; copy tables | blocking |
| Layout, responsive, container queries | Playwright 1.63.0 (Chromium) in a specimen harness (VD-17: Vitest browser mode on Playwright Chromium, or a non-deployed specimens app with its own matrix row — never a product route) | harness | B1-10 DataTable; shells at 4 widths; PF-03/04/06/07 computed styles | blocking |
| End-to-end (mock mode) | Playwright projects 1440×900 · 1024×768 · 768×1024 · 375×812; `next start` only | `apps/web/e2e` | Smoke; sign-in states (under G-8; otherwise Phase 1); guards; banners; Help; not-found; keyboard; reach; invisible focus; axe (`@axe-core/playwright`, pinned, G-5b); flow skeletons (`test.fixme`) | blocking (except skeletons) |
| Visual parity | Playwright screenshots vs board captures | harness | Phase-0 baselines (§7.5) | blocking once VD-18 decides the runner; until then a recorded same-machine run |
| Static scans | Vitest grep tests + ESLint | repo | §7.6 | blocking |

jsdom cannot evaluate container queries or layout: every visibility and responsive assertion is Playwright (`visual.md §9.2`). [CONFIRMED limitation]

### 7.2 Playwright specifics [PROVISIONAL]

- **Sessions**: in the default Phase-0 scope every test uses the CI-only boot descriptor. Once XS-01 exists (Phase 1, or Phase 0 under G-8), `signInAs(page, person)` drives it for real at least once per role. The boot descriptor: `page.addInitScript` sets `{ fixture, session }`, which the test-hook bridge reads only when `NEXT_PUBLIC_XR_TEST_HOOKS=1`; every document load rebuilds that fixture world (option A rebuilds on full navigation), and multi-step tests navigate client-side. `actAs(page, person, command)` runs a port command as another actor without UI (cross-role proofs). No test uses any UI to choose an identity (owner constraint; `visual.md §11` item 2).
- **Keyboard and focus**: shell tab order (board 12: skip link, sidebar + Help, Menu/Collapse, account, banner Help, main); drawer (focus to "Close menu", Esc back to "Menu", background inert); account-menu disclosure (Enter opens, Tab moves through items, Esc closes and returns focus); every dialog kind (initial focus by kind — Cancel for destructive DL-1 — trap, Esc = Cancel, return to trigger or to the flash notice); error-summary links; radio and scale arrow keys; "Go to decision".
- **`expectNoInvisibleFocusTargets(page)`**: Tab from the skip link to the end of `main`; every `document.activeElement` must pass `checkVisibility({checkOpacity:true, checkVisibilityCSS:true})`, have a box ≥ 2×2 inside the viewport, and no ancestor clipping it to zero. Runs on every built route at the 4 widths (`visual.md §7.1` item 2) — it catches the B1-10 defect class anywhere.
- **`reachAndClick(page, locator)`** (real-pointer reach test, `handoff/README.md`; B8-06; Batch-4 lesson): start at the top, move the mouse to the viewport centre, `page.mouse.wheel` until the target box is in view, hit-test with `document.elementFromPoint`, then `page.mouse.click`; never `scrollIntoView`, `locator.click()` auto-scroll or `window.scrollTo`; fail if never hit-testable. Phase-0 targets: Send report (and Sign in under G-8), every DL-1/DL-2/DL-3 confirm in the specimen harness, at the 4 widths and in bottom-sheet dialog mode.
- **Targets ≥ 24×24** for every interactive element at the 4 widths (WCAG 2.5.8; board 12).
- **Flow skeletons**: `e2e/flows/*.spec.ts` with one `test.fixme` step per `handoff/flows.json` step (27) plus the drawn alternates (`architecture.md §4`: E-alt1…3, F-alt, hold / lift hold, B-withdraw), each naming its screen id, actor and the role-relative words to assert. Phase 7 removes the `fixme`s.
- **Browsers**: Phase 0 proves Chromium only (the only browser in the local Playwright cache) and the verification record says so. The supported-browser policy (register P0-28: Chromium 105+, Safari 16+, Firefox 121+) is verified when a runner exists (Phase 7 / VD-18), unless the owner approves the WebKit and Firefox downloads under G-5, in which case the shell, dialog, DataTable and B1-10 suites also run there.

### 7.3 B1-10 (BC13) test plan

Phase 0 (WP-0.7): Vitest markup and behaviour tests, plus specimen-harness Playwright tests at content widths 343, 759, 760 and 1112 and the `xp-ftable` (< 760) / `xp-compare` (< 600) guards. Phase 1 (SA-02 screen): `e2e/a11y/datatable-sort.spec.ts` at 375×812, 768×1024, 1024×768 with the sidebar expanded and 1440×900, plus app widths 807/808 and 1071/1072, asserting `.xr-app` width equals the viewport first (classic scrollbars, R-20) (`visual.md §7.1`). [CONFIRMED defect · PROVISIONAL design VD-04]

### 7.4 Contract suite design [PROVISIONAL]

`runContractSuite(factory)` where `factory(fixture) → { ports, session, standins, clock }`. Per method: input validation copy; refusals as values; `changed` lists exactly the written records; a refusal leaves the world deep-equal; wrong workspace → `not-permitted`; actor resolved from records (passing a role is impossible by type). Flow suites follow `architecture.md §4.2–§4.9` row by row: record transition, "others now see" through each other role's read model, invariant, and the drawn absences as refusals. Label rendering for each step is asserted in `apps/web` against the copy tables (B8-03 words), which links domain → contracts → mock → copy without any screen.

### 7.5 Board reference capture pipeline (`visual.md §9.1`) [PROVISIONAL; runner UNRESOLVED (VD-18)]

1. Copy `design/handoff-v46/canvas-v46/project` and `runtime/support.js` to a scratch folder (never edit the frozen files) and serve it statically.
2. `page.route()` fulfils unpkg requests with vendored `react@18.3.1`, `react-dom@18.3.1` and `@babel/standalone@7.29.0` (kept in a test-only `v2/tools/board-capture/vendor/`, checked against the `REACT_SRI`, `REACT_DOM_SRI`, `BABEL_SRI` sha384 values in `support.js`) with `Access-Control-Allow-Origin: *` (the scripts load with `integrity` + `crossOrigin`); Google Fonts is served from the same self-hosted Public Sans woff2 the product uses. Fetching these files needs owner approval (G-5c).
3. Wait for `document.fonts.ready`, no `{{` left, and `.b1-frame` count = frame-index count; screenshot each frame as `<board>-f<index>-<caption slug>`; inject harness-only `height:auto` on the cropped Batch 1–3 frames.
4. Product capture at the frame width and **900 px height** (boards carry `min-height: 900px`; product uses `100dvh`), element screenshots for dialogs, state driven by typed fixtures, time fixed by Playwright's clock API (not a product clock).
5. Tolerances: specimens threshold 0.1 / maxDiffPixelRatio 0.001; screens 0.2 / 0.005–0.01 with masks for dynamic text; `animations:'disabled'`, `caret:'hide'`, `reducedMotion:'reduce'`.
6. Expected deviations, each owner-approved with a note: B1-10 sort control (PF-01), skip link, gold sidebar focus (PF-07), dialog position and bottom sheet (PF-04), Cancel style (VD-06), fixed drawer (PF-03), global-override effects (R-16), canvas-only removals, error-summary normalisation (VD-21/22).
7. Until a runner exists (no remote, no CI, no container runtime on this Mac), board and product are captured in the same run on the same machine and kept as run artefacts, not committed cross-OS baselines.

**Phase-0 baselines**: Batch-0 specimens 01–08, 10, 11, 12 (components and shells, incl. 7 roles × banner states from board 05), the ErrorSummary specimen from a linked product instance (e.g. B4-04, VD-22), plus board 07 (XS-07) and board 08 (PU-15, XS-06). B1-09 frames f0–f12 (XS-01/03/04) join the Phase-0 set only under G-8.

### 7.6 Static scans [PROVISIONAL]

- B8-03 policy words: 0 "publish/release grants access", 0 Publish controls on SA/Reviewer screens, 0 Decline/Reject, 0 aggregate progress phrases or percentages, 0 shipping words for device transfers, 0 developer/demo wording, 0 role-name variants ("Tenant Admin", "Learner"), "licence" spelling, no numeric dates — over `apps/web/src/copy/**` and TSX string literals.
- Owner constraints: no "DEMO", "Viewing as", "Switch account", sample-account list or workspace chooser in product code or rendered DOM; no import of `branding/` (VD-03); dependency deny-list (MUI, Chakra, Radix-styled kits, shadcn, Tailwind UI, headless kits, icon fonts) in `apps/web` and `@xr/ui`.
- Canvas leakage: no `support.js`, `dc-script`, `<x-dc>`, `sc-if`/`sc-for`, `b1-frame`, `doc-*`, "Board control", "Sample:" strings in product code.
- Slice-1: no `no-place-remaining`, `placesBefore/After`, `demo-bar`, `/demo`.
- Handoff integrity: `design/handoff-v46` re-hashed against `SHA256SUMS.txt` (178 OK) and the 8 CSS + 19 SVG copies in `@xr/ui` against the matching lines.

### 7.7 Gates (local until a runner exists) [PROVISIONAL]

A root script `pnpm verify` (in `v2/`) runs, in order: `prettier --check` (with `packages/ui/src/styles/v46/`, `docs/v46/` and `tools/board-capture/vendor/` ignored); an **uncached** handoff-checks step (handoff and CSS checksums, and every test that reads `design/handoff-v46/` — tokens, navigation, flows, `SHA256SUMS.txt` — which lies outside the turbo root and cannot be a declared input); `turbo run build typecheck lint test` (incl. boundaries, policy matrix, contract suite, components, scans; the matrix copy is package-local, §5.3, or the run uses `--force` as `PHASE0_VERIFICATION.md` did); Playwright mock-mode e2e at 4 projects (excluding `fixme` skeletons); and, when its inputs are approved, the parity suite. Every gate is blocking. Until the owner adds a remote and a CI runner (P0-01, VD-18), the gates run locally and their output is recorded in the Phase-0 verification document. The same command becomes the CI job later. No CI configuration exists today (`1b090c9`; ARCHITECTURE §17 "no CI/CD pipeline").

---
## 8 · Phase 0 work breakdown

All work packages are PROVISIONAL as a plan. Each one lands as its own commit series on the new branch and is reviewed against its acceptance criteria. "Not included" lists what a reviewer should reject if it appears.

### 8.1 Order and dependencies

```
G-1 · G-6 · G-7 ─► WP-0.1 repo + handoff + baseline (G-5a install)
          │
          ▼
       WP-0.2 ADRs, amendments, v46 docs ──(owner sign-off: G-2, G-3)──┐
          │                                                             │
          ▼                                                             │
       WP-0.3 foundation conflict fixes                                 │
          │                                                             │
   ┌──────┴───────────────────────┐                                     │
   ▼                              ▼                                     │
WP-0.4 test harness base       WP-0.9 domain (all entities)             │
   │  (G-5b)                      │                                     │
   ▼                              ▼                                     │
WP-0.5 tokens + CSS (G-3)      WP-0.10 ports + DTOs + contract suite ◄──┤
   │                              │                                     │
   ▼                              ▼                                     │
WP-0.6 components              WP-0.11 mock adapter + sample world ◄────┘ (G-2)
   │                              │
   ├─► WP-0.7 DataTable + B1-10   ▼
   ▼                           WP-0.12 composition root + queries + session (G-2)
WP-0.8 shells + role nav          │
   └──────────────┬───────────────┘
                  ▼
           WP-0.13 foundation screens + guards (scope: G-8)
                  ▼
           WP-0.14 cross-role thin vertical proof
                  ▼
           WP-0.15 visual parity pipeline + baselines (G-5c, VD-18)
                  ▼
           WP-0.16 verification record + handover (P0-01 remote for the PR)
```

The left column (visual) and the right column (data) can proceed in parallel after WP-0.3.

### 8.2 Work packages

#### WP-0.1 — Repository setup and handoff placement

| | |
|---|---|
| **Scope** | §1.4 steps 0–9: execute the G-1 choice; create worktree `/Users/mymac/Desktop/AR-VR-frontend-v46` on `v2/frontend-v46` from `v2/platform-foundation`; place, verify and commit `design/handoff-v46/`; root `CLAUDE.md`; fresh install; re-run the foundation baseline before any change |
| **Files / areas** | New worktree; `design/handoff-v46/**`; `CLAUDE.md` |
| **Acceptance** | (1) The main checkout's `git status --porcelain -uall` is unchanged (98 lines) — or, with G-1 option A, the WIP commit's `--stat` lists exactly the 71 Slice-1 paths under `v2/` and the 27 Source Pack paths are still untracked. (2) `git worktree list` shows two worktrees; the new branch's first commit has parent `1b090c9`. (3) `shasum -a 256 -c SHA256SUMS.txt` = 178 OK, 0 FAILED, re-run from git objects (step 8). (4) `CLAUDE.md` contains the START-HERE step-3 sentence verbatim. (5) The handoff commit touches only `design/handoff-v46/**` and `CLAUDE.md`. (6) Baseline matches `PHASE0_VERIFICATION.md`: build 9/9, typecheck 9/9, lint 9/9, 218 tests, e2e 2/2 — recorded before WP-0.2 |
| **Not included** | Any `v2/` change; Slice-1 salvage; adding a remote |
| **Gate** | G-1 (before step 0); G-6 (before step 2); G-7 (before step 7); G-5a (install, step 9) |

#### WP-0.2 — Decision records, amendments and v46 reference documents

| | |
|---|---|
| **Scope** | Create `v2/docs/decisions/` (OPEN_DECISIONS: "Parts B and D … are closed with an ADR under `v2/docs/decisions/`") with: **ADR-0001** CSS architecture and Tailwind (VD-01; closes E-19; one `xr.v46` layer; Preflight removed); **ADR-0002** typed mock services in the browser and package placement — the recorded exception to ARCHITECTURE §3/§4 ("no business rule in apps/web") and §14 ("no stand-in controls": stand-in ports exist but have no UI and are driven only by the seed and CI tests) (TE-2, AD-01, AD-02; frontend-on-mocks track); **ADR-0003** sample identity: a session port now, the XS-01 form in Phase 1 or under G-8 (TE-1, AD-03, AD-29; no account or role selector anywhere; no DEMO banner); **ADR-0004** sample-world persistence (AD-07: option A default; TE-6 only if authorised); **ADR-0005** route conventions (routes.md rules S1–S4, T1–T4, canonical params, static workspace folders, XS-06 in place, client SessionGate (X-3), redirects, built-screen nav gating, unbuilt → not-found interim, `/<base>` → `/<base>/help` engineering-build landing, link-target ledger); **ADR-0006** learning completion as a system record behind an injectable `CompletionPolicy` (AD-39; A-06/T-12 kept open as a boundary); **ADR-0007** test-only seams (TE-5 clock, TE-7 flags with test hooks in CI/Playwright builds only, VD-17 specimen harness, fault injection, boot descriptor, bridge chosen by a build-time alias); **ADR-0008** service contract shape (X-1, X-2, X-7, X-9). Amend `ARCHITECTURE.md`, `OPEN_DECISIONS.md` (Part E TE-1…TE-8 with removal triggers; E-19 closed; A-20, A-07, A-08 and A-14 annotated with the v46 position, not resolved), `FUNCTIONAL_PARITY_MATRIX.md` ("Web (mock)" status; notes on conflicting rows), `MIGRATION_STRATEGY.md` (frontend-on-mocks track; sign-off requested, register P0-03, not a merge blocker). Add `v2/docs/v46/` with the six audit deliverables marked "candidate — owner review", `permission-matrix.json`, and the Understand-stage JSON under `v2/docs/v46/understand/` so that `wf/understand/…` citations resolve inside the repo (or rewrite citations to repo paths when committing); add `docs/v46/` to `.prettierignore` |
| **Files / areas** | `v2/docs/decisions/ADR-0001…0008.md`; `v2/docs/*.md`; `v2/docs/v46/**` |
| **Acceptance** | (1) Each ADR has Context · Decision · Status · Consequences · Removal trigger · Evidence (deliverable section + board/commit) and an owner sign-off line. (2) Sign-off recorded for ADR-0002/0003/0006/0007 (G-2) and the owner's acknowledgement of the engineering ADR-0001 (G-3) before the dependent WPs merge; ADR-0004 (option A) is acknowledged, not gated. (3) No Part A row of `OPEN_DECISIONS.md` is marked resolved. (4) `v2/docs/v46/permission-matrix.json` SHA-256 equals `wf/final/permissions.json`, and the check fails after a 1-byte edit. (5) `prettier --check` passes with `docs/v46/` ignored, so (4) and (5) hold together |
| **Not included** | Code. Exceptions for later phases (TE-3 runtime stand-in route, TE-4 payment stand-in, TE-8 client-rendered public pages) are drafted here but signed before Phases 3 / 1 |
| **Gate** | Produces the G-2 and G-3 sign-off packets |

#### WP-0.3 — Foundation conflict fixes

| | |
|---|---|
| **Scope** | `roles.ts`: remove `ROLE_PLANNING_LABEL`, add `ROLE_LABEL` (Student · Faculty · Institute Admin · Vendor · Academic Reviewer · Content Manager · Super Admin), keep ids incl. `tenant_admin` (A-20 interim; AD-25 open). `technology.ts`: add `FORMAT_DISPLAY_ORDER` (WEB·AR·VR·MR) and `FORMAT_META` (B6-07 `fmtName` / `fmtText`; Vendor labels B5-04), delete `TECHNOLOGY_META`, re-document `sortTechnologies` as non-UI. `utilisation.ts`: keep `foldSessions` and the activity derivation; introduce `CompletionPolicy` and `interimCompletionPolicy` (the committed rule, verbatim) in `completion/`; `SimulationStatus` is not exported to any UI path. Remove `/` foundation page, `/system`, `ApiHealthProbe` (+ test), `FoundationStatusList` (+ test, `index.ts` export) and update the `boundaries.test.ts` fixture specifiers. Root metadata "XR Learning Platform". `@xr/testing` Playwright projects ×4 and optional `webServer`; `apps/web/playwright.config.ts` without the API in sample mode. Replace `smoke.spec.ts` with its first step (`/healthz` 200; 404 for `/` and `/system`). `.prettierignore` += `packages/ui/src/styles/v46/`, `docs/v46/`, `tools/board-capture/vendor/`. Edit the `roles.ts` header comment and `packages/ui/README.md`, which still name "Learner", "Tenant Admin" and `FoundationStatusList` |
| **Files / areas** | `v2/packages/domain/src/{roles,technology,index}.ts`, `runtime/utilisation.ts`, new `completion/`; `v2/apps/web/src/app/{page.tsx,system/,layout.tsx}`, `src/components/api-health-probe*`; `v2/packages/ui/src/{foundation-status-list*,index.ts}`; `v2/packages/config/src/boundaries/boundaries.test.ts`; `v2/packages/testing/src/playwright.ts`; `v2/apps/web/{playwright.config.ts,e2e/smoke.spec.ts}`; `v2/.prettierignore`; `v2/packages/ui/README.md` |
| **Acceptance** | (1) `ROLE_PLANNING_LABEL`, `TECHNOLOGY_META`, `FoundationStatusList` and "Tenant Admin" / "Learner" occur nowhere under `v2/packages` and `v2/apps/web`, comments and READMEs included (grep test). (2) `inDisplayOrder(['mr','vr','ar','web'])` → `['web','ar','vr','mr']`; `FORMAT_META` codes are WEB/AR/VR/MR. (3) All existing `utilisation.test.ts` cases pass unchanged, with completion now evaluated through `interimCompletionPolicy`; the domain test count is ≥ 18. (4) `GET /healthz` 200 with `service: 'xr-platform-web'`; `GET /` and `GET /system` 404. (5) Playwright lists 4 projects; e2e starts no API process. (6) All foundation suites and the boundaries test green |
| **Not included** | Renaming `tenant_admin`; changing `TECHNOLOGIES` order; any new route or screen |

#### WP-0.4 — Test harness base

| | |
|---|---|
| **Scope** | Pinned devDependencies for axe (Vitest adapter or direct `axe.run`; `@axe-core/playwright`) under the repo's exact-version + minimum-release-age policy (`1b090c9:v2/pnpm-workspace.yaml`); the specimen harness (VD-17 option chosen by a spike); e2e support (`signInAs`, `bootWorld`, `actAs`, `reachAndClick`, `expectNoInvisibleFocusTargets`, axe wrapper); ESLint import fences and bans (§3.8); grep/scan tests (§7.6) with initial empty-allow lists; dependency deny-list test; root `verify` script |
| **Files / areas** | `v2/packages/testing/**`; `v2/apps/web/e2e/support/**`; `v2/packages/config/eslint/**` (+ RuleTester fixtures); `v2/package.json`; test-support files salvaged from Slice-1 SAFE (`memory-storage.ts`, `next-mocks.tsx`) |
| **Acceptance** | (1) Helper self-tests: `expectNoInvisibleFocusTargets` fails on a fixture page with a clipped focusable button and passes once it is `display:none`; `reachAndClick` reaches a below-the-fold button by wheel only and fails on a button hidden by `overflow:clip`. (2) Each new lint rule has passing/failing RuleTester cases. (3) The deny-list test fails when a listed package is added. (4) `pnpm verify` runs end to end. (5) No test helper exposes identity choice through UI |
| **Not included** | Board capture (WP-0.15); flow specs (WP-0.14) |
| **Gate** | G-5b (new devDependencies), for the axe part only; the rest of the WP proceeds |

#### WP-0.5 — Tokens, CSS port and product layer

| | |
|---|---|
| **Scope** | `visual.md §1–§2`: copy the 8 sheets and 19 SVGs byte for byte; `index.css` with `@layer theme, xr.v46, xr.product, utilities;`; `product.css` with PF-01 (CSS), PF-02, PF-03, PF-04, PF-05, PF-06, PF-07, PF-09, PF-11, PF-13 (each with id + evidence comment); delete placeholder `tokens.css` and the `globals.css` body rule; new `globals.css` per ADR-0001 (no Preflight); `@xr/ui` exports `./styles.css` (the `./tokens.css` export and the matching `boundaries.test.ts` specifier are replaced); layout imports; generated TS constants (thresholds 600/760/860/1024/1280, focus colours) with a drift test against `handoff/tokens.json`; checksum provenance test; layer spike (`@import … layer()` through `@tailwindcss/postcss` + Turbopack, `url("art/…")` from a workspace package, layer order whatever chunk loads first) with the concatenation fallback; fonts per VD-02 (self-hosted `@font-face 'Public Sans'`, or the Google Fonts link as on the boards) |
| **Files / areas** | `v2/packages/ui/src/styles/**`, `v2/packages/ui/package.json`; `v2/apps/web/src/app/{globals.css,layout.tsx}`, `postcss.config.mjs`; `v2/packages/config/src/boundaries/boundaries.test.ts` (one specifier) |
| **Acceptance** | (1) Checksum test passes for 8 CSS + 19 SVG and fails after a 1-byte edit (mutation check). (2) Harness computed styles: `body` background `#F4F5FB`, colour `#12173F`; `document.fonts.check('16px "Public Sans"')` true; `.xr-btn.xr-btn--text.xg-del[aria-disabled="true"]` colour `#5C6389` (single-layer cascade, `visual.md §2.2`); `.xr-side :focus-visible` outline `#F7C95B` (PF-07); drawer `position: fixed` (PF-03); `.xp` `overflow: clip` (PF-06). (3) The built CSS contains no rule from `tailwindcss/preflight.css`. (4) `pnpm format` leaves the v46 copies unchanged. (5) Tailwind utilities, if kept, are limited per ADR-0001 (lint) and never used inside `@xr/ui` |
| **Not included** | Motion PF-08 (VD-09), forced colours PF-12 (VD-15), tokenising literal hex (T-3), any component |
| **Gate** | G-3 (VD-01) for the `globals.css` / PostCSS step only; G-5c for self-hosted fonts (fallback: Google Fonts link, START-HERE Known exception 7) |

#### WP-0.6 — Core component set

| | |
|---|---|
| **Scope** | `visual.md §3`: the 42 Phase-0 rows (19 foundation · 10 forms · 5 data display · 4 overlays · 4 shells; DataTable's sort is WP-0.7, the shells' composition is WP-0.8). PublicShell, SignInCard, PublicMenuSheet and the TextInput password reveal are built here only under G-8; otherwise in Phase 1 with XS-01. Dialog per board 10 (native `dialog`, initial focus by kind with Cancel for destructive DL-1 — VD-07; focus-cycle guard; Esc = Cancel; return focus or flash target; Cancel style default `xr-btn--secondary` pending VD-06; align variants and bottom sheet per PF-04/VD-08). AccountMenu as a disclosure with `aria-controls` (VD-13). Tabs: link tabs and `role=tablist` + `tabpanel` (VD-14). ErrorSummary `xw-errsum`, always linked (VD-21/22). StatusPill takes tone + words. LogoPlaceholder renders exactly "BITS Pilani / WILP logo — placeholder" (BC12). SkipLink. Icon registry generated from the boards. Links injected (`@xr/ui` cannot import `next/*`) |
| **Files / areas** | `v2/packages/ui/src/{foundation,forms,data,overlays,shells,icons,testing}/**`, `link.tsx`, `index.ts`; generator under `v2/tools/` reading `design/handoff-v46/` read-only |
| **Acceptance** | (1) A component ledger lists 42 entries (45 under G-8), each with board code + frame cited by its markup-contract test. (2) Markup-contract tests assert class lists and ARIA against the cited excerpts; product-only classes are exactly the `xr-x-*` allow-list. (3) Behaviour tests: busy ignores repeat presses; dialog initial focus per kind, trap, Esc, return focus; disclosure Enter/Tab/Esc; drawer focus to Close and back to Menu; tablist arrows + tabpanel; error-summary link focuses its field; radio arrows. (4) axe: 0 violations per variant and state. (5) Lint: no canvas classes, no raw hex in TSX, no Tailwind classes in `@xr/ui`. (6) Provenance: no file in `@xr/ui` matches the content hash of any of the 38 Slice-1 DISCARD files (hash list committed with the test), and the Slice-1-only identifiers `PlacesMeter`, `FormatLegend` / `FormatChip`, `AppShell`, `Card`, `cx`, `demo-*` and `places*` do not occur. The v46 component names Button, ConfirmDialog, Notice, PageHeader and StatusPill are allowed |
| **Not included** | Phase-1+ components (GuidedFlowLayout, RatingScale, EditableTable, KeyValueList, ComparisonTable, RecordHubHeader, Disclosure, InlinePanel, OverviewFigures, FilterSheet, FocusedTaskShell); Meter, toast, pagination, combobox, switch (not drawn — do not build) |

#### WP-0.7 — DataTable and the B1-10 fix (BC13)

| | |
|---|---|
| **Scope** | DataTable per `visual.md §3.3` and §7.1: visually hidden caption, `th[scope=col]`, labelled-row mode below 760 px of content, row links, loading/empty/no match/failed states; sortable column markup `th[aria-sort] > button.xr-x-th-sort + span.xr-x-th-text` plus `.xr-x-table-sortbar` button in the toolbar-status row, one shared sort state; de-duplicated accessible name ("Received, newest first. Change order"); PF-01 guard rules for `.xr-table`, `.xp-ftable`, `.xp-compare` thead controls |
| **Files / areas** | `v2/packages/ui/src/data/data-table/**`; PF-01 block in `product.css` |
| **Acceptance** | (1) Vitest: the markup above; both controls call `onSortChange`; accessible names exactly "Received, newest first. Change order" / "Received, oldest first. Change order"; `aria-sort` flips. (2) Harness Playwright at content widths 343, 759, 760, 1112: below 760 exactly one visible control named /^Received/ above the first row, the header button `display:none`, `expectNoInvisibleFocusTargets` passes, activation reverses the rows and flips `aria-sort`; at ≥ 760 the header button is visible and the sort bar is not displayed. (3) A focusable control placed in an `.xp-ftable` thead (< 760 xp) and an `.xp-compare` thead (< 600 xp) is not focusable. (4) axe clean in both modes. (5) The Phase-1 SA-02 route test is written as a `fixme` with the widths of §7.3 |
| **Not included** | SA-02 itself |

#### WP-0.8 — Shells and role-aware navigation

| | |
|---|---|
| **Scope** | WorkspaceShell (container `xr-app`; drawer < 1024, rail 1024–1279 expandable, full ≥ 1280; skip link → `main#main` with `tabindex=-1`); Sidebar + NavItem (gold inset + `aria-current="page"`, counts in words, Help last); TopBar (Menu / Collapse, title or breadcrumbs, account); AccountMenu wiring (name · role · institution or organisation line · "My device"* · Help · Sign out — board 06 table); XS-08 banner slot; HelpSupport template; under G-8 only, the PublicShell header/footer from B1-01 markup with the PublicMenuSheet below 1024 xp and the `(auth)` focused card frame. Nav config for 7 roles + public header verbatim from `navigation.json` / board 06 (header "Request access" → PU-07 per the boards, D-01); explicit active-item map (`routes.md §3.6`); built-screen manifest gating; rail preference in memory (X-10) |
| **Files / areas** | `v2/packages/ui/src/shells/**`; `v2/apps/web/src/nav/**`; `v2/apps/web/src/features/shared/xs-05-account-menu/` |
| **Acceptance** | (1) Labels and order of the nav config equal `navigation.json` for 7 roles + public header after the two documented board-wins normalisations (HB-02 header "Request access" → PU-07; HB-19 "Help (foot)" → "Help"); icon keys equal the board 06 markup (`navigation.json` has none). (2) Help is the last nav item and an account-menu item in all 7 roles. (3) Account-menu lines per role match board 06 (institution for Student, Faculty, IA; organisation for Vendor; none for Reviewer, CM, SA); "My device" appears only for a Student with AR/VR/MR **and** once ST-18 is built. (4) Harness: at app width 1023 the drawer (Menu named "Open menu"; focus to "Close menu"; Esc returns to Menu; background inert); at 1100 the rail with tooltips named by destination; at 1440 the full sidebar; skip link is the first tab stop and focuses `main`. (5) With the Phase-0 manifest each sidebar renders only Help; adding a screen id renders its item in board order. (6) Message pages mark nothing current |
| **Not included** | Workspace page content; FocusedTaskShell (Phase 4) |

#### WP-0.9 — Domain models, state machines and policies for every entity

| | |
|---|---|
| **Scope** | §3.5: types for M01–M28 (`schemas.md §2`); canonical status unions and transition tables; per-command decision functions with explicit minimal inputs; `may` / `availableActions` with matrix row ids; the 12 invariants (`architecture.md §5.5`); read-model derivations (`experimentGate`, `formatAvailability`, `canOpenFormat`, `formatProgress`, `feedbackEntry`, `assessmentForStudent`, `resultView`, `publicCatalogue`, `iaContentAccess`, `facultyScope`, `usage`, `navCounts`, banner facts); completion handler decision over `CompletionPolicy`; `Provided<T>` licence figures; open rules as typed policies with no default; Slice-1 `term.ts`, `isolation.ts` and the `access/` modules salvaged per §2.3 |
| **Files / areas** | `v2/packages/domain/src/**` |
| **Acceptance** | (1) Every model M01–M28 has a type; every status-bearing record's union equals the "Status → labels" list of its schemas model (enumerated fixture). (2) Transition tests: every drawn transition allowed; every other (from, to) pair refused. (3) The 12 invariants hold over seeded randomised command sequences (fixed seeds, reproducible). (4) Policy coverage 347/347 matrix rows (§5.3); the 15 OPEN rows never appear in `availableActions`; the 11 SYSTEM transitions cannot be produced by a user command. (5) Five-state separation: Publish and Release change no ACC, SACC or FMAP; `formatProgress` returns Completed only when a `FormatCompletion` exists; FB requires a completion for that format; no command merges, deduplicates or renames one Composite Wall record into the other, and neither is removed by a merge (BC11); both records exist in the `afterFlow('E')` and `stateCoverage()` fixtures (SUB-0077 does not exist before Flow E step 1). (6) No counting: no exported function derives remaining or used licences; `Provided` values pass through unchanged. (7) `@xr/domain` still has zero workspace dependencies and no zod (boundaries test). (8) The §10.2 Phase-0 interims are implemented as stated and named in test titles: the overlap case returns `policy-open` (DV-1); objective marks come only from fixture-supplied values and no scoring function exists (DV-2); the requester's "Submitted" becomes "Under review" on the first SA-03 decision read (AD-14) |
| **Not included** | zod schemas, world, UI words |
| **Gate** | G-2, for the completion part (AD-39 with register P3-01 (a)/(d)) |

#### WP-0.10 — Service ports, DTO schemas, error model and contract suite

| | |
|---|---|
| **Scope** | §3.6 and §4.1: `@xr/contracts` `./draft` export; 22 product ports + 6 stand-in ports as interfaces; zod input/output schemas per method on new `@xr/validation` primitives; `Result` / `ServiceError` (§6.5) and `RefusalCode` with copy keys; ProblemDetails mapping table; framework-free contract suite (per-method cases, flow cases, invariant cases); method ledger (method → phase) |
| **Files / areas** | `v2/packages/contracts/src/draft/**`, `package.json`; `v2/packages/validation/src/**` |
| **Acceptance** | (1) Interfaces compile; the ledger counts 183 product methods and the stand-in methods of `schemas.md §3.18`, each with a phase. (2) Every command input schema used by the flow suites and the Phase-0 forms reproduces its drawn messages (`schemas.md §5.4`) in table-driven tests. (3) The suite imports no test framework (grep) and exports `runContractSuite(factory)`. (4) Nothing added to `WIRE_CONTRACTS`; the existing contracts tests (66) still pass. (5) `@xr/contracts` still depends only on `@xr/domain` and `@xr/validation` |
| **Not included** | HTTP adapter; OpenAPI publication |

#### WP-0.11 — Mock adapter and the sample world (`@xr/sample-platform`)

| | |
|---|---|
| **Scope** | §3.7, §4.2–§4.5: package and matrix row (AD-01; or the owner's fallback location); world and envelope; in-tab mutex; the 8-step pipeline; handlers for the Phase-0 method set (§4.1); stand-ins (clock, payment outcome, runtime report → completion handler, workflow routing, licence oracle, overlap policy); id source with reservations and floors; memory persistence driver; change bus; history per M28; seed, scripted walk, `laterSample`, `stateCoverage`; fault plan (tests only); `./testing` export; Slice-1 `world.ts` / `world-store.ts` / `access-adapter.ts` patterns salvaged per §2.3 |
| **Files / areas** | `v2/packages/sample-platform/**`; `v2/packages/config/eslint/{boundary-matrix.mjs,boundaries.d.mts}`; `v2/tsconfig.solution.json` |
| **Acceptance** | (1) The contract suite passes against `createSamplePlatform` for every Phase-0 method. (2) `seed(anchor)` twice → deep-equal; the walk yields exactly REQ-0042, ACC-0107, SACC-0310, ASMT-0009, ATT-0450, DTR-0018, SUB-0077, UPD-0005, SUP-0213 and the IA-17 request REQ-0058. (3) Spine-start contains no Godavari record or dependant. (4) A refusal leaves the world deep-equal; a repeated `commandId` returns the first receipt; a stale `expectedRev` returns `stale-version`. (5) Every stand-in or fixture runtime event carries `origin: 'sample-standin' \| 'sample-fixture'`; `events.ts` `RUNTIME_SOURCES` unchanged. (6) No `Math.random` / `Date.now` in `src` (lint). (7) The package imports only contracts, domain and validation (boundaries test) |
| **Not included** | Browser persistence (TE-6) unless AD-07 = B; the WEB runtime stand-in route (Phase 3) |
| **Gate** | G-2 |

#### WP-0.12 — Composition root, query layer and session

| | |
|---|---|
| **Scope** | `@xr/config/env` flags (TE-7); `composition.ts`; `PlatformProvider`; `session-store.ts` (memory per tab); `providers.tsx` defaults from the composition root; keys, `meta.deps`, the single invalidation predicate, `useCommand`; `queryClient.clear()` on identity change; test-hook bridge (CI-only); LinkProvider wiring; import fences active |
| **Files / areas** | `v2/apps/web/src/{platform,queries}/**`, `src/app/providers.tsx`, `src/lib/env.ts`; `v2/packages/config/src/env/**` |
| **Acceptance** | (1) After a command whose `changed` holds INST, exactly the queries whose `meta.deps` include INST are invalidated (spy test). (2) Sign-out clears the cache and the next person's keys differ. (3) A production build without `NEXT_PUBLIC_XR_TEST_HOOKS=1` at build time contains no test-hook code: the build-time alias resolves the bridge to an empty stub, and a sentinel string is absent from every emitted chunk. (4) Only `composition.ts` imports `@xr/sample-platform`, and only the bridge imports `@xr/sample-platform/testing` (lint). (5) Env schema tests cover both flags and reject unknown values |
| **Not included** | HTTP adapter; any screen |
| **Gate** | G-2 |

#### WP-0.13 — Foundation screens and guards

The screens built in Phase 0, and why the foundation needs each one. The B8-06 Phase-0 row reads "Shell, sidebars, account menu, Help & support, system pages, tokens, components, dialogs".

| Screen | Board evidence | Why it is in Phase 0 | Status |
|---|---|---|---|
| XS-05 Account menu | 05, 06, 12 | B8-06 Phase 0 "account menu"; it carries Sign out and Help | CONFIRMED (Phase 0) |
| XS-06 Not your workspace | 08 | B8-06 Phase 0 "system pages"; it is the output of the workspace guard | CONFIRMED (Phase 0) |
| XS-07 Help & support (Help · Report a problem · report detail) | 07 | B8-06 Phase 0 "Help & support". Help is the one destination present in every workspace (WCAG 3.2.6). Its SUP record gives a cross-role UI proof (Student reports → Super Admin resolves → Student reads the note) without any later-phase screen | CONFIRMED (Phase 0) |
| XS-08 Paused / inactive banners | 05, 08, B1-09 f7/f8, B7-04 | Part of the shell; proves that another role's decision (pause, deactivate) reaches every role's shell | CONFIRMED (Phase 0) |
| PU-15 Not found (public + in-shell variants) | 08 | B8-06 Phase 0 "system pages"; every unbuilt or unknown address resolves to it. The header frame of the public variant comes with the public shell | CONFIRMED (Phase 0) |
| XS-01 Sign in (with the XS-04 "Forgot your password?" disclosure) | B1-09 f0–f12 | B8-06 lists XS-01/03 in Phase 1. Inventory §U, the design brief, lists them in Phase 0, but it ranks below B8-06. They are built in Phase 0 only if the owner chooses that at G-8 (for a Phase-0 build a person can walk). Otherwise the Phase-0 proofs reach shells through the CI-only boot descriptor (§7.2), and XS-01 is built in Phase 1 | GATE G-8 (default Phase 1) |
| XS-03 Signed out / session expired notices | B1-09 f9 "Session expired", f10 "Signed out" | Notices on the sign-in card, not a route (D-15); built with XS-01 | GATE G-8 (default Phase 1) |
| Public header / footer (no screen id) | B1-01 markup; board 08 draws a "Public header · Batch 1" placeholder bar above the public not-found variant | Phase 1, with the public pages. In Phase 0 the public PU-15 variant renders its MessagePage without the header frame (engineering-build interim) | GATE G-8 (default Phase 1) |

| | |
|---|---|
| **Scope** | The Phase-0 screens above, plus the G-8 rows if the owner chooses them; root and workspace interims (§3.3); `SessionGate`, `WorkspaceFrame`, `returnTo` validation, `[...unmatched]`, the `RecordGuard` mechanism; the `/<base>` → `/<base>/help` interim; redirect row 20 (row 21 comes with XS-03); the link-target ledger; an App Router spike (client `notFound()`, `useSyncExternalStore` session snapshot, `Suspense` around `useSearchParams`) |
| **Files / areas** | `v2/apps/web/src/app/**` (§3.3 files only); `v2/apps/web/src/features/shared/**`; `v2/apps/web/next.config.ts`; `v2/apps/web/src/copy/**` |
| **Acceptance** | (1) **XS-06**: for all 42 (role, other workspace) pairs, the own-role shell shows the board 08 copy, the URL is unchanged, no sidebar item is current, "Back to Home" targets the own base (which reaches `/<base>/help` in Phase 0), and Help targets the own Help. (2) **XS-07**: a report gives "Sent" with a SUP reference. The "Where did it happen?" field is pre-filled ("Filled in from the page you came from"). The optional screenshot field records a file name only and uploads nothing. There is no category field (P0-34). My reports lists only the person's own reports, each titled with the start of its "What happened" text (P0-31 interim, marked provisional in the state-copy register). The detail shows history and note. The reporter has no reopen control (SUP-04 OPEN; P0-30). Validation reads "Say what happened, so it can be looked into", with the summary "One thing needs fixing". (3) **XS-08**: copy exactly as board 05; `role=status`; never modal; Faculty see the banner only. (4) **PU-15**: the public variant shows "We can’t find that page" + "Browse experiments" (a known Phase-0 dead link to `/experiments`, listed in the verification record). The in-shell variant shows "Back to Home" + Help, and any unknown workspace URL renders it. (5) **XS-05**: the account-menu lines per role match board 06 (WP-0.8 (3)). Sign out ends the session and clears the query cache; the XS-03 "Signed out" notice arrives with XS-01. (6) `returnTo` rule (unit-tested in Phase 0; end to end with XS-01): a Student given `/faculty/x` lands on `/student`; `//example.org` and absolute URLs land on the role home. (7) Per-screen "Done" (`handoff/README.md`) at the 4 widths: drawn states present, labels as drawn, keyboard and focus per boards 10/12, no undrawn control. `expectNoInvisibleFocusTargets` and axe are clean on every Phase-0 route. `reachAndClick` passes on "Send report". (8) A route-manifest test fails if any `page.tsx` outside §3.3 exists. (9) The link-target ledger covers every drawn action on the Phase-0 screens, and no Phase-0 primary action resolves to the page it is on. (10) **XS-01/03/04, under G-8 only**: f0 form; f2 busy, cannot be sent twice; f3 password cleared, e-mail kept, focus on the message "The e-mail or password isn’t right — Check both and try again."; f4 missing fields with the drawn messages; f5 → f6 on "Sign in with your institution"; f7/f8 sign in and land with the inactive / paused banner; f9 via the CI clock; f10 after sign-out; f11/f12 at 375. Each of the 7 roles lands on its own base in its own shell. A DOM scan finds no sample-account list, role switcher, "Viewing as" or workspace chooser (B1-09 "Never here"). `reachAndClick` passes on "Sign in". Without G-8, these cases move unchanged into the Phase-1 acceptance |
| **Not included** | PU-01…PU-14; any workspace home or feature screen; ST-19 screens (only the guard mechanism); the focused not-found variant (Phase 4); XS-01/03/04 and the public shell unless G-8 |
| **Gate** | G-2 (TE-1 session port). G-8 decides whether XS-01/03/04 and the public shell are in scope |

#### WP-0.14 — Cross-role thin vertical proof

| | |
|---|---|
| **Scope** | (a) Port-level suites that walk Flows A–F, the device chain and the cross-cutting commands on **one** world (`architecture.md §4.2–§4.9`): per step the record transition, what every other role now sees through its own read model, the invariant, the drawn absences as refusals, and — in `apps/web` — the role-relative words from the copy tables. (b) Browser proofs using only Phase-0 screens, on one tab and one world: a Student sends a report on XS-07 → `actAs(Super Admin).resolveReport(note)` → the Student's report detail shows Resolved and the note without a reload; `actAs(Super Admin).pauseInstitution` → the Student, Faculty and Institute Admin shells show the paused banner, `restoreInstitution` removes it; `actAs(Institute Admin).deactivateStudent` → that Student's next session (set by the CI seam; by XS-01 under G-8) shows the inactive banner; changing the session to another role in the same tab (CI seam; sign-out and XS-01 sign-in under G-8) keeps the world (option A). (c) Playwright flow skeletons (§7.2) |
| **Files / areas** | `v2/packages/contracts/src/draft/contract-suite/flows/**`; `v2/packages/sample-platform/src/**/*.test.ts`; `v2/apps/web/src/copy/**/*.test.ts`; `v2/apps/web/e2e/{foundation,flows}/**` |
| **Acceptance** | (1) All 27 `flows.json` steps and the drawn alternates (E-alt1…3, F-alt, Hold / Lift hold, B-withdraw) are covered by passing port-level cases on one world. (2) The 12 invariants are checked after every step (invariant 10 as reworded in WP-0.9 (5)). (3) Each step's words for each role match an independent expected-words fixture extracted from the cited board frames (frame-index statuses and headings, each entry carrying its board code and frame number), not the copy tables themselves. (4) Browser proofs pass at the 4 widths. (5) Skeleton specs exist with one `fixme` step per `flows.json` step, naming screen id, actor and expected words. (6) The route-manifest test still shows only Phase-0 routes. (7) Steps that reach an open decision (A2 "Under review" trigger, D3 objective marks, any overlap case) use the §10.2 Phase-0 interims (AD-14, DV-2, DV-1) and name the interim in the test title |
| **Not included** | Building any screen that a flow step names; removing the `fixme`s (Phase 7) |

#### WP-0.15 — Visual-parity pipeline and Phase-0 baselines

| | |
|---|---|
| **Scope** | §7.5: capture harness with vendored, SRI-checked scripts and fonts; frame enumeration from `frame-index.json` (and direct enumeration for Batch-0 boards); product captures; tolerances; expected-deviation register with owner approvals; Phase-0 baselines |
| **Files / areas** | `v2/tools/board-capture/**` (test-only, outside every product package and outside `@xr/ui` `files`); `v2/apps/web/e2e/parity/**` |
| **Acceptance** | (1) Vendored file hashes equal the `support.js` SRI values; `tools/board-capture/vendor/` is excluded from prettier. (2) Captured frame count per board equals the frame-index count (Batch-0 boards by direct enumeration). (3) The harness runs with the network blocked except localhost. (4) Every Phase-0 baseline is within tolerance or covered by an approved deviation entry. (5) Until VD-18 is decided, the run is same-machine and its artefacts are attached to the verification record |
| **Not included** | Baselines for Phase-1+ boards; a CI runner |
| **Gate** | G-5c; VD-18 (runner) |

#### WP-0.16 — Phase-0 verification record and handover

| | |
|---|---|
| **Scope** | `v2/docs/v46/PHASE0_FRONTEND_VERIFICATION.md` (commands, environment, counts, results, deviations); capability ledger for the 147 ids (built in Phase 0 / target phase / excluded); method ledger; permission coverage ledger; updated owner-decision list; PR from `v2/frontend-v46` to `v2/platform-foundation` |
| **Acceptance** | Every item of the Phase-0 definition of done (§11.2) is checked with evidence; the main checkout's status is unchanged since WP-0.1; `design/handoff-v46` still 178 OK |
| **Gate** | None. The PR needs a remote (register P0-01); otherwise a local merge review is recorded |

---
## 9 · How later phases 1–7 connect without rebuilding the foundation

Boards and screen ranges are B8-06 "Build order and the boards for each phase" (spot-checked) and `decisions-rules.json#phaseBoards`; excluded (not designed) ids are never built, linked or routed (`routes.md §2`: PU-11, PU-16, XS-02, ST-20, FA-13, FA-23, FA-24, IA-12, IA-21, IA-22, VE-10, VE-11, VE-12, VE-14, VE-15, RV-07, CM-10, SA-04, SA-05, SA-08, SA-09, SA-23, SA-24, SA-25). [CONFIRMED (ranges) · PROVISIONAL (consumption plan)]

| Phase | Boards (B8-06; + proof / continuity boards for tests) | Designed screens built | Ports consumed (mock read methods added per the ledger) | Components first used or added | Foundation pieces reused unchanged |
|---|---|---|---|---|---|
| 1 Public + access spine | B1-01 … B1-11 · B7-02 · B7-03 (+ B1-12, B1-13) | PU-01 … PU-10, PU-12, PU-13 (state), PU-14 (section); SA-01 requests group, SA-02, SA-03, SA-06, SA-07; XS-01/03/04 and the public shell (unless already built under G-8) | Catalogue, Selection, AccessRequest, Institution (`listInstitutions`); `PaymentOutcomePort` (TE-4) | PublicShell, SignInCard, PublicMenuSheet (unless built under G-8), KeyValueList, ComparisonTable (xp), GuidedFlowLayout + SummaryPanel (public), FilterSheet, DecisionLayout first use (VD-05 decided by then), DataTable sort on SA-02 (B1-10 route test) | Guards, session port, pipeline, query layer, copy tables, test helpers (and the public shell and sign-in if built under G-8) |
| 2 Campus distribution | B2-01 … B2-12 (+ B2-13, B2-14) | IA-01 … IA-11, IA-13 … IA-16; ST-01 … ST-05, ST-19 | Institution (`getMyOverview`), People (lists, `previewStudentImport`), Group, FacultyCourse, InstitutionCourseCode, StudentAccess (UI); `LicenceAvailabilityOracle` (seeded) | EditableTable, `xw-steps3` Stepper, pick lists, CsvImport / ImportReport, RecordHubHeader, hub link tabs, Disclosure, InlinePanel | RecordGuard (ST-19 family), domain access gates, `laterSample()` |
| 3 Learning, feedback, device chain | B3-01 … B3-11 · B7-09 (+ B3-12, B3-13) | ST-06 … ST-10, ST-15 … ST-18; IA-17 … IA-20; SA-18, SA-19 | Learning (`getSimulationChooser`), Feedback, Operations (device lists, usage); `RuntimeReportPort`; the WEB stand-in route `(sample-runtime)/runtime/web` (TE-3) | RatingScale, learning `xl-*` parts, segmented links | Completion handler + `CompletionPolicy`, `formatProgress`, `feedbackEntry` |
| 4 Teaching & assessment | B4-01 … B4-13 (+ B4-14, B4-15) | FA-01 … FA-12, FA-14 … FA-22; ST-11 … ST-14 + the hub Assessment tab | Assessment (remaining), QuestionBank (drafting, import), Marking, Teaching | FocusedTaskShell (ST-13) + focused not-found variant, assessment `xa-*` parts | `resultView` (release by the assessment's own setting), marking decisions |
| 5 Production + first publication | B5-01 … B5-07 · B6-01 … B6-07 · B6-10 (+ B5-08, B5-09, B6-11, B6-12) | VE-01 … VE-09, VE-13; RV-01 … RV-03, RV-05, RV-06; CM-01 … CM-05, CM-09 | Production (overviews, editor, library), PlatformCourseCode (`list`); `WorkflowRoutingPolicy` | Vendor `xv-*`, governance `xg-*`, ComparisonTable (xg), DecisionLayout `xg-static`, status tablists + tabpanel, B5 missing-items error summary | SUB machine, publication check, Composite Wall invariant |
| 6 Corrections + governance | B6-08 · B6-09 · B6-04 · B7-01 … B7-09 (+ B6-13, B6-14, B7-10 … B7-12) | CM-05 … CM-08 (CM-05 detail completed), RV-04, SA-01 (full), SA-10 … SA-17, SA-20 … SA-22 | Correction (lists), AcademicStructure (reads), PlatformRole (lists), Operations (support list, access ending, overview) | OverviewFigures, InlinePanel uses, status tablists | UPD machine, Release/Hold decisions, scope policies |
| 7 Consolidation | B8-04 · B8-05 · B8-03 | none new | all | none new | Flow skeletons made green end to end on one shared state; WCAG 2.2 AA; B8-05 entry screens × 4 widths; terminology scans |

Overlaps in B8-06 are built once: SA-18/SA-19 in Phase 3 (device chain), the rest of SA-10…SA-22 in Phase 6; RV-04 and B6-04 with Flow F in Phase 6.

**What a later phase adds, and what it never changes.** A phase adds feature folders, route files under the §3.3 conventions, the read methods its screens need (ledger), entries in the built-screen manifest (which makes nav items and tabs appear), baselines for its boards, and its entries in the state-copy register. It does not change the domain module boundaries, the port interfaces (additive only; contract-suite cases come with any new method), the pipeline, the query keys and invalidation, the shells, the CSS layers, the guard mechanism or the test helpers. Any change to those is a new ADR. [PROVISIONAL]

---

## 10 · Decisions

### 10.1 True Phase-0 blockers (GATES)

Only these stop a Phase-0 work package. Everything in §10.2 proceeds on a stated default. Gate ids are kept from the draft, so every reference in §1–§8 stays valid. At assembly, G-4 was withdrawn as a gate, and G-6, G-7 and G-8 were added so that this list and the owner register (Appendix G, Section A) are one list. The table is ordered by when each gate is needed.

| Gate | Register | Decision | Blocks | Why it is a true blocker | Recommendation |
|---|---|---|---|---|---|
| **G-1** | A2 | How Slice-1 is preserved before any git write: (A) a WIP commit on `v2/connected-frontend-slice1` with pathspec `v2`; (B) a patch + tar outside the repo; (C) leave it as is | Start of WP-0.1 (step 0) | The work exists nowhere else, because there is no remote. It is recommended first for the same reason | A, plus B as an off-repo copy until a remote exists |
| **G-6** | A1 | Approve creating branch `v2/frontend-v46` from `1b090c9` in a new worktree at `/Users/mymac/Desktop/AR-VR-frontend-v46` (names and location are the owner's choice) | WP-0.1 step 2 onward | A branch and a worktree are git writes. Switching in place would carry the 98 uncommitted paths into the new work | Approve as named, or rename |
| **G-7** | A3 | Approve committing `design/handoff-v46/` (from the zip, SHA-256 `9d33f32e…24bf`, 178/178 OK) at the repository root, plus a root `CLAUDE.md` with the START-HERE line; confirm that the zip is the approved artefact | WP-0.1 step 7, and every later check pinned to `SHA256SUMS.txt` (WP-0.5) | A git write; the canonical citation path does not exist on any branch | Approve |
| **G-5** | A6 | Downloads: (a) `pnpm install --frozen-lockfile` in the new worktree; (b) new pinned devDependencies for axe (a Vitest adapter or direct `axe-core`; `@axe-core/playwright`); (c) vendored `react@18.3.1`, `react-dom@18.3.1`, `@babel/standalone@7.29.0` and the Public Sans woff2 files, with `support.js` run only inside the capture harness | (a) WP-0.1 step 9 (baseline) and so every code WP · (b) the axe part of WP-0.4 · (c) WP-0.15, and self-hosted fonts in WP-0.5 (fallback: the Google Fonts link, as on the boards) | Downloads and new dependencies need explicit approval, and the repo pins exact versions with a minimum release age. (a) is a session permission; (b) and (c) are Phase-0-exit approvals | Approve (a) and (b); approve (c) with the SRI check of §7.5 |
| **G-2** | A4 | Sign-off of the exception packet the committed architecture requires: **TE-1** sample identity (a session port now; the XS-01 form when it is built; AD-03 credential rule, AD-29); **TE-2** mock services that evaluate `@xr/domain` rules in the browser, with **AD-01** (`@xr/sample-platform` + matrix row) and **AD-02** (`@xr/contracts` `./draft`); **TE-5** anchored sample clock (the seed and the scripted walk need it); **TE-7** + **VD-17** (two `NEXT_PUBLIC_*` flags; test hooks in CI/Playwright builds only; the specimen harness is never a product route); **AD-39** with register P3-01 (a)/(d): learning completion stored as a system record behind `CompletionPolicy` (amends ARCHITECTURE §8) | Merge of WP-0.9 (completion part), WP-0.11, WP-0.12 and WP-0.13 | `1b090c9:v2/docs/ARCHITECTURE.md` §3/§4 ("no business rule in apps/web"), §8 ("progress (per technology) … Derived, never stored as truth"), §10 ("No authentication is implemented and none is faked") and §14 ("no scenario selector, no demo clock, no stand-in controls"), and OPEN_DECISIONS ("None may be silently resolved by an implementation"). BC10 and BC14 call for mock services and one connected state, so sign-off is expected, but it still has to be recorded | Approve as drafted in ADR-0002/0003/0006/0007 |
| **G-3** | A5 | Engineering ADR VD-01 closing E-19, for the owner to acknowledge. In both options the v46 CSS goes verbatim into one `xr.v46` layer and Preflight is removed. Option A: Tailwind 4 theme + utilities without Preflight, limited to composition in `apps/web`. Option B: drop Tailwind and use 3–4 typed layout primitives | The `globals.css` / PostCSS step of WP-0.5 only. Component work and its visual verification do not depend on the option, because `@xr/ui` holds no Tailwind classes | E-19 is an open Part-B decision, closed by an ADR under `v2/docs/decisions/` (OPEN_DECISIONS rule) | Option A |
| **G-8** | A7 | Phase-0 scope of sign-in. Either follow B8-06 (XS-01/03/04, PublicShell, SignInCard and PublicMenuSheet in Phase 1; Phase-0 proofs through the CI-only boot descriptor), or pull them into Phase 0 so that a person can walk a Phase-0 build (+3 screen ids and +3 components; TE-1 then covers the XS-01 form in Phase 0) | The scope of WP-0.6, WP-0.8 and WP-0.13 (answer at plan approval) | B8-06, a v46 board, governs the build order over Inventory §U. Departing from it is the owner's call, not a default | Follow B8-06, with Phase-0 review through CI captures (K-21). Pull forward only if a hosted Phase-0 review is wanted |

**Withdrawn as a gate at assembly:** G-4 (git remote, push, PR base) is now register P0-01. Local work in the new worktree proceeds without a remote; the remote is needed for an off-machine backup and for the WP-0.16 PR. **Moved out of G-2:** the AD-07 acknowledgement (option A needs no authorisation; §10.2) and the MIGRATION_STRATEGY / FUNCTIONAL_PARITY_MATRIX amendments (register P0-03: sign-off is requested in WP-0.2, but they do not block a merge).

### 10.2 Phase-0 defaults — proceed unless the owner objects (acknowledge in the G-2 / G-3 packets)

| Item | Phase-0 default | Status |
|---|---|---|
| AD-25 / OPEN_DECISIONS A-20 | Keep the internal id `tenant_admin` and display "Institute Admin" via `ROLE_LABEL`. Renaming the id later is mechanical (it appears only in `roles.ts` and `ARCHITECTURE.md`) | PROVISIONAL |
| schemas §8-3 | WEB·AR·VR·MR display order beside the FRD order; `TECHNOLOGY_META` retired; `DeliveryModel` reused | PROVISIONAL |
| schemas §8-4 / T-12 | `interimCompletionPolicy` = the committed rule; `FormatProgressStatus` is the only UI status. Storing completion is AD-39, signed in G-2 | PROVISIONAL · trigger UNRESOLVED |
| AD-07 / register P0-02 | Option A: one world per tab, in memory. Nothing is written to browser storage except the board-drawn selection basket and request ticket. Acknowledged, not gated. Option B only after authorisation, which is needed before hosted reviewer walk-throughs | PROVISIONAL |
| AD-08 / X-6 / register DV-6 | Spine-start is the default boot world; `stateCoverage()` and the walk are also built | PROVISIONAL · hosted default UNRESOLVED (before the Phase-1 review) |
| Anchor date; S-1 … S-12 | A provisional anchor is recorded; the walk runs on board dates | UNRESOLVED (sample data only) |
| AD-03 / AD-29 | When XS-01 is built: a known sample e-mail + any non-empty password signs in; an unknown e-mail → f3; the institution button runs f0 → f5 → f6; any person or role holder with an e-mail can sign in | PROVISIONAL |
| AD-21 | `returnTo` is honoured only inside the signed-in role's base; no automatic expiry in sample mode (f9 via the CI clock) | PROVISIONAL · expiry policy UNRESOLVED |
| O-10 / register P1-16 | `/system` and the API health probe retired in WP-0.3; `/healthz` kept | PROVISIONAL |
| Unbuilt destinations / register P0-35 | Nav items and tabs render only for built screens. Unbuilt URLs (including `/`) resolve to the not-found pattern. `/<base>` redirects to `/<base>/help` until the workspace home exists, so "Back to Home" never loops. The public "Browse experiments" is a listed Phase-0 dead link. A link-target ledger is kept. Phase-0 builds are engineering builds | PROVISIONAL |
| AD-14 / register P1-04 (Phase-0 interim) | The requester's "Submitted" becomes "Under review" the first time the Super Admin opens the request's decision page (SA-03), recorded as a history event. Used by the Flow A port-level walk; final answer before Phase 1 | UNRESOLVED (interim) |
| DV-1 / AD-18 / SACC-15 / register P2-02 | A single active grant opens the experiment (`canOpenFormat`). The overlap case (a withdrawn individual grant plus an active group grant for the same experiment) is not decided: `OverlapGrantPolicy` returns `undecided` → `policy-open`. Each grant shows its own state only, and no copy explains the overlap. Overlap fixtures stay out of seeded Student journeys and out of the Phase-0 flow suites. Architecture AD-18's "any active grant gives access" is not adopted as the interim, because SACC-15 says the store must not compute can-open for this case | UNRESOLVED (safe) |
| DV-2 / AD-38 / ATT-07 / register P4-01 | Objective (choice / true-false) marks for the walk's ATT-0450 come from fixture-supplied marks per (question, option), applied by the system stand-in. `@xr/domain` contains no scoring function. Deterministic answer-key scoring comes only after the owner confirms it is drawn behaviour, not grading automation | UNRESOLVED (interim) |
| P0-10 | One role per signed-in person; no workspace chooser (XS-02 deferred) | PROVISIONAL |
| P0-28 | Declared browser policy: Chromium 105+, Safari 16+, Firefox 121+. Phase 0 proves Chromium only and records that; WebKit/Firefox runs need the download under G-5 or wait for the runner (VD-18) | PROVISIONAL |
| P0-30 (reporter side) / SUP-04 | No Reopen control for the reporter. Reopening exists only as the Super Admin command (B7-09, Phase 6). The wording "Reopened by the reporter" stays unbuilt until decided | UNRESOLVED (interim) |
| P0-31 | A My reports row title is the start of the "What happened" text, marked provisional in the state-copy register | UNRESOLVED (interim) |
| P0-32 / P0-33 | Help for the Academic Reviewer and the Super Admin uses the board-07 template in their shells. Signed-out people cannot reach Help (as drawn) | PROVISIONAL |
| P0-34 / SC-29 | No problem-category field (board 07: "Nothing else") | UNRESOLVED (interim) |
| P0-03 | One documentation commit in WP-0.2 amends MIGRATION_STRATEGY, FUNCTIONAL_PARITY_MATRIX and OPEN_DECISIONS. Sign-off is requested; no open row is marked resolved | PROVISIONAL |
| X-3, X-4, X-9, X-12, X-13, X-14, X-15 | Engineering reconciliations of §0.2 | PROVISIONAL |
| VD-02 | Self-hosted `@font-face 'Public Sans'` if G-5c is approved; otherwise the Google Fonts link, as on the boards | UNRESOLVED (default chosen) |
| VD-03 | A logo placeholder component; `branding/bits-pilani-wilp-logo.png` is not imported | UNRESOLVED |
| VD-04 · VD-07 · VD-08 · VD-11 · VD-13 · VD-14 · VD-16 · VD-19 · VD-23 | As recommended in `visual.md §13` | PROVISIONAL |
| VD-05 / register P0-12 | DecisionLayout supports both sticky and static variants; each screen follows its board until the owner decides. Needed by the first DecisionLayout screen (SA-03, Phase 1) | UNRESOLVED (default chosen) |
| VD-06 | Dialog Cancel default `xr-btn--secondary` (44 product boards) | UNRESOLVED (default chosen) |
| VD-09 · VD-15 / register DV-8 | Motion and forced-colours rules are deferred, not built. The reduced-motion guard already in the v46 CSS stays | UNRESOLVED (default chosen) |
| VD-20 / X-10 / register DV-7 | The rail preference is kept in memory per tab. The register's P0-24 "Approve" (browser storage) would conflict with architecture R5 | UNRESOLVED (default chosen) |
| VD-21 · VD-22 | The error summary is always linked and emits `xw-errsum` | PROVISIONAL · UNRESOLVED (class) |
| AD-17 / schemas §8-6 | New grants are Active in the mock; "Waiting for a licence" exists only as seeded data | PROVISIONAL |
| CF-06 (Slice-1 `term.ts`) | An unreadable end date is invalid data, not "expired" | UNRESOLVED (interim) |
| schemas §8-32 | `ENDING_SOON_DAYS = 15` (B7-09; BR-049 PROVISIONAL) | PROVISIONAL |
| schemas §8-33 | Every Institute Admin write is refused while paused (as drawn on B2-01); the per-screen presentation is decided with the screens | CONFIRMED (rule) · UNRESOLVED (presentation) |
| AD-24 · AD-27 | Canonical state × audience label tables; availability-reason precedence as proposed in `architecture.md §5.3` | PROVISIONAL |
| schemas §8-1 · §8-5 · §8-10 | No Campus entity; no developer surface of any kind; "sample" marked in data only | PROVISIONAL (account selection: CONFIRMED owner constraint) |
| AD-16 | "Launch WEB" stores nothing; In progress comes only from runtime events | PROVISIONAL |

### 10.3 Decisions needed before specific later phases

| Before | Decisions (ids) | Why then |
|---|---|---|
| Phase 1 | XS-01/03/04 and the public shell, if not built under G-8; X-5 PU-10/PU-12 URL (register DV-5: routes O-05 recommended vs architecture AD-13; T-01/R01 open); X-6 hosted seed default (register DV-6; AD-08, schemas §8-5); AD-07 browser persistence, if reviewers will walk Flow A (option A resets on reload); TE-4 payment stand-in (AD-06); TE-8 client-rendered public pages (AD-12); AD-14 final answer (Phase-0 interim in §10.2); VD-05 decision panel (first DecisionLayout screen, SA-03); VD-10 decision ids in product copy (B7-02/B7-03 carry them); O-03 header target; O-08 direct visits to request pages; O-09 register corrections; S-1/S-2/S-3 sample conflicts (Konark, BITS Hyderabad, A. Menon); stakeholder flags AD-37 (SA creates tenants) and AD-43 (re-request a held experiment) acknowledged | The public pages, the request flow and the SA decision screens consume these |
| Phase 2 | O-07 record guard for ended / withdrawn access; DV-1 / AD-18 / OD-B2-01/02 overlapping grants (final answer); AD-36 CSV columns (stakeholder flag); D-24 paused grant wording and the three "student inactive" wordings (schemas §8-31); §8-33 paused IA presentation; §8-8 group-grant withdrawal confirmed out of scope; O-02 IA request detail registration; O-12 / P2-11 Institute Admin view of institution reports | IA and Student entry screens |
| Phase 3 | P3-01 (b)/(c) and AD-05 / TE-3: the WEB runtime stand-in route and its neutral content, with the FUNCTIONAL_PARITY_MATRIX §G amendment; AD-40 live "Completed" in reviewer builds (default no); AD-22 feedback after access ends; O-08 ST-18 direct visit; OD-B3-03 one open transfer; schemas §8-24 device keying; D-26 "Not available right now"; AD-42 time-spent stakeholder flag; AD-45 acknowledge that STK31-38 is superseded | Learning, completion display, feedback and the device chain |
| Phase 4 | DV-2 / AD-38 choice-question automatic scoring vs "no grading automation" (final answer); schemas §8-17/§8-18 assessment edge rules; AD-35 timer (stakeholder flag); AD-41 drafting sources (stakeholder flag); AD-28 FA-21 route; O-01 hub Assessment tab; O-04 / AD-15 release by the assessment's own setting (D-02) | Assessment authoring, attempts, marking, results |
| Phase 5 | schemas §8-15 resubmission routing (M-3); §8-16 Vendor scope holder; §8-29 platform-code uniqueness (D-25); AD-33 SA writer of platform codes (stakeholder flag); AD-19 unsaved changes; AD-20 stale/concurrent notice; AD-23 record leaving scope; OD-B5-07 submission id timing | Vendor editor, review and publication |
| Phase 6 | AD-31 CM direct link edit and AD-32 SA override scope (stakeholder flags); schemas §8-19 hold blocks later corrections (OD-B7-04); §8-20 correction fields (OD-B6-09); AD-26 / §8-21 Super Admin reopen as drawn on B7-09, and whether any reporter path exists (reporter-side interim in §10.2); AD-30 STK31-28 reminder; §8-28 platform-role experiment scope | Corrections, governance, support and access ending |
| Phase 7 | VD-18 CI runner and the pinned Linux Playwright image; the declared browser policy verified (P0-28); final reviewer-build persistence (AD-07) and live system states (AD-40) | End-to-end flows and parity in CI |

### 10.4 Production-only (do not block any frontend phase)

Each has a designed safe treatment (`handoff/open-decisions.json`: 0 frontend build blockers; B8-08). `decisions-rules.json#counts` records 106 production-blocking decisions (67 batch decisions, 33 register T-items, 6 register extras). The main groups:

- Identity: provider, SSO, password policy, activation, multi-role (T-10, T-11, A-01, E-02, XS-02; AD-44 Institute Admin SSO set-up).
- Payment provider, confirmation and refunds (T-05, R06).
- XR runtime contract and the completion event (T-12, A-06, D25; R1, R2, R7–R9).
- Licence counting and plan changes (D7 / T-06, T-07, T-08, OD-B3-09).
- Requester identity, reply and Decline (T-01/R01, T-03, T-02, T-32).
- Notifications and reminders (T-34; STK31-28 / AD-30); report pages (T-33).
- Backend persistence, migrations and retention; deployment prerequisites D-01…D-05 (ARCHITECTURE §18).
- The stakeholder ↔ v46 conflicts built per v46 and flagged: AD-30…AD-37, AD-41…AD-45 (architecture), 22 flagged permission rows, 24 conflicts in `decisions-rules.json#conflicts`; and the 41 UNRESOLVED permission rows (`permissions.md §4.1`), built with their safe treatment.

---

## 11 · Risks, mitigations and definition of done

### 11.1 Risks and mitigations

| # | Risk | Mitigation | Owner of the mitigation |
|---|---|---|---|
| K-1 | An in-place branch switch carries Slice-1 changes into the new work (all `v2/*` branches at one commit) | New worktree (§1.2); WP-0.1 acceptance 3 | WP-0.1 |
| K-2 | Slice-1 work or the owner's Source Pack is lost (no remote) | G-1 first; never `stash`/`clean`/`reset`/`add -A` in the main checkout; P0-01 remote | Owner + WP-0.1 |
| K-3 | The frozen handoff is edited or reformatted | Root placement outside `v2/`; CLAUDE.md rule; checksum test in `pnpm verify`; optional `chmod` | WP-0.1, WP-0.4 |
| K-4 | `pnpm format` rewrites the byte-identical v46 CSS copies | `.prettierignore` entry; checksum test with a mutation check | WP-0.3, WP-0.5 |
| K-5 | The cascade differs from the boards (layer order through `@tailwindcss/postcss` + Turbopack; per-sheet layers; Preflight) | One `xr.v46` layer; repeated `@layer` statement; spike + computed-style assertions; concatenation fallback | WP-0.5 |
| K-6 | Container-query behaviour is untestable in jsdom | All responsive and visibility checks in Playwright (harness and e2e) | WP-0.4 |
| K-7 | Next.js 16 behaviours are assumed, not run (client `notFound()`, `useSyncExternalStore` snapshots, `Suspense` around `useSearchParams`, route groups, `proxy.ts`) | Spike in WP-0.13 before screens; fallbacks stated (render MessagePage directly; client SessionGate) | WP-0.13 |
| K-8 | Option A resets the world on reload or full navigation, which surprises reviewers and makes tests flaky | Client-side navigation in multi-step tests; CI boot descriptor; documented in the developer README; AD-07 decided before reviewer builds | WP-0.12, owner |
| K-9 | Phase 0 over-builds (all methods, extra screens) or under-builds (ports untested) | Method ledger with phases; route-manifest test; contract-suite coverage of the Phase-0 set | WP-0.10, WP-0.13 |
| K-10 | Open decisions get silently decided in code (D7, T-12, OD-B2-01, M-3, overlap) | Typed policies with no default and `policy-open`; tests per possible answer; ADRs for every departure | WP-0.9 |
| K-11 | Stakeholder positions are lost because v46 is built | Flags carried as AD-30…AD-45 and in the matrix; never marked CONFIRMED; listed in the verification record | WP-0.2, WP-0.16 |
| K-12 | Status words drift (from `entities.json`, prototype or Slice-1 copy) | Copy tables from boards and B8-03; per-step word assertions in WP-0.14; terminology scans | WP-0.14, WP-0.4 |
| K-13 | A demo or developer identity surface creeps in | SES-04 test; DOM and code scans; test hooks only in CI builds with a bundle sentinel check; no UI for stand-in ports | WP-0.4, WP-0.12 |
| K-14 | Slice-1 salvage brings back D7 counting or "demo" naming | Must-not-carry list; review per file; grep tests | WP-0.9, WP-0.11 |
| K-15 | Committed docs (FPM 26/36 conflicting rows, MIGRATION phases, A-08, A-20) mislead implementers | Amendments in WP-0.2; v46 deliverables committed under `v2/docs/v46/` | WP-0.2 |
| K-16 | Two "Phase 0"s are confused in records and reviews | Naming rule (How to read); new verification file name | All |
| K-17 | No CI runner and no remote: gates are only local | `pnpm verify` + recorded output; P0-01 and VD-18 | Owner |
| K-18 | Cross-OS rasterisation breaks visual baselines | Same-run, same-machine captures until a pinned Linux image exists | WP-0.15 |
| K-19 | New dependencies conflict with the repo's pinning policy | Exact versions, minimum release age, G-5b approval | WP-0.4 |
| K-20 | The B1-10 class of defect reappears in other tables or later screens | Fix in DataTable once; generic thead guards; `expectNoInvisibleFocusTargets` on every route at 4 widths | WP-0.7, every phase |
| K-21 | Engineering builds with interim landings are shown to stakeholders as product | Phase-0 builds are not hosted for review; the ADR-0005 interim is stated in the verification record | Owner + WP-0.16 |
| K-22 | Contract shape churns when owner decisions arrive | Errors and policies leave room for every answer (`policy-open`); the contract suite runs on every change | WP-0.10 |

### 11.2 Definition of done for Phase 0

Phase 0 is done when every item below is true and recorded with evidence in `v2/docs/v46/PHASE0_FRONTEND_VERIFICATION.md`:

1. **Repository.** The worktree and branch exist (G-6). The main checkout's status is unchanged since the G-1 action. Slice-1 is preserved as chosen at G-1. Nothing under `apps/api` or `packages/database` changed.
2. **Handoff.** `design/handoff-v46/` is committed (G-7). `shasum -a 256 -c SHA256SUMS.txt` gives 178 OK from a fresh checkout. The root `CLAUDE.md` holds the START-HERE line. No file under the handoff has changed since.
3. **Baseline.** The foundation checks were green before any change (WP-0.1), and all suites are green at the end (`pnpm verify`, with the uncached handoff-checks step).
4. **Decisions.** ADR-0001…0008 are committed. G-2 is signed and G-3 acknowledged. Exceptions TE-1, TE-2, TE-5 and TE-7 and the AD-39 amendment are recorded with removal triggers. No Part-A open decision is marked resolved. The §10.2 defaults are acknowledged, and G-8 is answered.
5. **Foundation conflicts.** No `ROLE_PLANNING_LABEL`, `TECHNOLOGY_META`, "Tenant Admin" or "Learner" in `v2/packages` or `v2/apps/web`, comments and READMEs included. The WEB·AR·VR·MR order is used. Completion goes only through `CompletionPolicy`. The foundation `/` and `/system` pages and the API probe are gone. The new smoke test is green.
6. **Visual layer.** 8 sheets + 19 SVGs byte-identical (checksum test with a mutation check); one `xr.v46` layer; no Preflight; each product-layer rule cites its PF id; computed-style assertions pass.
7. **Components.** 42 components (45 under G-8) with markup-contract, behaviour and axe tests. No canvas classes, raw hex or Tailwind classes in `@xr/ui`. The Slice-1 provenance test passes.
8. **B1-10.** DataTable tests pass at content widths 343/759/760/1112, with no invisible focus target and one visible sort control below 760 px. The Phase-1 SA-02 route test is written.
9. **Shells and navigation.** 7 nav configs + the public header equal `navigation.json` after the HB-02 and HB-19 normalisations, and icon keys equal board 06. Help is last everywhere. Account menus follow board 06. Drawer / rail / full behaviour works. Built-screen gating works.
10. **Domain.** All 28 models; exhaustive transition tests; 12 invariants (invariant 10 as reworded); 347/347 matrix rows covered; the 15 OPEN rows never offered; five-state separation tests; no counting rule; the §10.2 interims implemented and named.
11. **Contracts.** 22 product ports (183 methods) and the 6 stand-in ports (8 methods) typed with zod DTOs. The contract suite is framework-free and on its own subpath. The method ledger is complete.
12. **Mock and world.** The contract suite is green against the mock for the Phase-0 method set. The seed is deterministic. The walk reproduces the board references. Refusals write nothing. Commands are idempotent. Every stand-in event carries sample provenance.
13. **Composition and session.** One world and one QueryClient per tab. Invalidation by changed kind. The cache is cleared on identity change. Test hooks are absent from non-CI bundles (build-time alias, sentinel check).
14. **Screens.** XS-05, XS-06, XS-07, XS-08 and PU-15 meet "Done, for one screen" at 1440/1024/768/375. Under G-8 the same holds for XS-01 (with XS-03 notices and XS-04), with all B1-09 states f0–f12 reachable in tests. There is no account selector, DEMO banner or "Viewing as" anywhere. Only Phase-0 routes exist. The link-target ledger is complete.
15. **Cross-role proof.** Port-level suites cover all 27 `flows.json` steps and the drawn alternates on one world. Browser proofs (report → resolve → note; pause → banners; deactivate → banner; a role change in one tab keeps the world) pass at 4 widths. Flow skeletons exist.
16. **Accessibility and reach.** Keyboard and focus suites, `expectNoInvisibleFocusTargets`, axe and `reachAndClick` pass on every Phase-0 route and on every harness confirm button at 4 widths, in Chromium. Targets are ≥ 24×24. The verification record states that the declared browser policy (P0-28) is verified when a runner exists (Phase 7 / VD-18), unless WebKit/Firefox runs were approved under G-5.
17. **Scans.** B8-03 policy words, owner-constraint scans, canvas-leakage scans and Slice-1 scans are all at 0.
18. **Visual parity.** Phase-0 baselines (Batch-0 specimens, boards 07 and 08; B1-09 under G-8) are captured and are within tolerance or covered by approved deviations: in CI if VD-18 is decided, otherwise in a recorded same-machine run.
19. **Handover.** Capability, method, permission and link-target ledgers are committed, and the owner-decision list is updated. A PR is opened to `v2/platform-foundation` (needs register P0-01, a remote), or a local review is recorded.

### 11.3 Counts in this proposal

- Work packages: 16 (WP-0.1 … WP-0.16). Gates: 7 (G-1, G-2, G-3, G-5, G-6, G-7, G-8); G-4 was withdrawn to register P0-01 at assembly.
- Foundation screens built in Phase 0: 5 screen ids (XS-05, XS-06, XS-07, XS-08, PU-15); under G-8, 8 ids (+ XS-01, XS-03, XS-04) and the public header/footer (no id). Designed screens not built in Phase 0: 118 of 123 (115 under G-8). Excluded (not designed): 24.
- Components in Phase 0: 42 from `visual.md §3` (45 under G-8, adding PublicShell, SignInCard and PublicMenuSheet).
- ADRs proposed: 8 (ADR-0001 … ADR-0008). Exceptions recorded in Phase 0: TE-1, TE-2, TE-5, TE-7 and the AD-39 amendment. TE-3, TE-4 and TE-8 are recorded before their phases; TE-6 only if authorised.
- Reconciliations between the final deliverables: 15 (X-1 … X-15). Risks: 22 (K-1 … K-22). Definition-of-done items: 19.
- Ports: 22 product (183 methods) + 6 stand-in (8 methods); models: 28; permission rows covered: 347; invariants: 12; flow steps: 27 + drawn alternates.

### 11.4 What this proposal did not do

No code was written, run, installed or committed; no file under the repository or `~/Downloads` changed. Next.js 16 behaviours, the Tailwind/Turbopack layer pipeline and container-query behaviour inside `showModal()` dialogs in WebKit/Firefox are assumptions to be proven by the spikes named in WP-0.5 and WP-0.13. The five deliverables this proposal integrates are candidates for owner review; where they disagreed, §0.2 says which reading Phase 0 takes.
