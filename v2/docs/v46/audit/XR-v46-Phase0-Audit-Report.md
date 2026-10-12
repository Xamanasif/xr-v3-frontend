# XR Learning Platform — Phase-0 architecture audit of the v46 frontend

Read-only audit · 9 Oct 2026 · design authority: frozen Claude Design canvas v46 (`design/handoff-v46/`) · repository: `/Users/mymac/Desktop/AR-VR`, approved V2 foundation commit `1b090c9`

**Verdict: READY** (Section 10). Phase 0 can start once the owner approves this plan and answers the seven Section-9A items. The handoff verifies, nothing in the repository or the design rules out planning, and every binding constraint is traced to a design element and a test.

---

## How to read this report

**One status legend for the report and all appendices.**

| Mark | Meaning |
|---|---|
| **CONFIRMED** | Checked against an owner binding constraint (START-HERE BC1–BC14 or FREEZE-RECORD), a v46 board, a handoff file that matches its board, the committed foundation at `1b090c9`, or the repository state today. Routes marked "CONFIRMED (board-forced)" and routes marked "EXCLUDED" (confirmed as not designed) count here. |
| **PROVISIONAL** | A reversible engineering proposal or a designed safe treatment. The build can proceed on it; the owner may acknowledge or change it. Appendix A's and Appendix C's "PROPOSED" / `[P]` count here. |
| **UNRESOLVED** | The sources conflict or are silent, and the owner must decide. A safe interim is stated wherever one exists. |
| **GATE** | An UNRESOLVED owner decision without which a named Phase-0 work package cannot start or merge (Section 9A). |

In the owner-decision register (Appendix G), a row's status is the status of the *decision*; its evidence is CONFIRMED unless the row says otherwise.

**Citations.** Boards are cited as `design/handoff-v46/canvas-v46/project/<code>-….dc.html` (written as the board code, e.g. `B1-10`), with the 0-based frame number from `design/handoff-v46/derived/frame-index.json` and its caption (e.g. "B1-09 f3 'Wrong details'"). Batch-0 boards are cited by number (`05`, `08`). `design/handoff-v46/` is the canonical repository path. The package is **not yet in the repository**; it was audited from a checksum-verified extraction of the owner's zip (Section 1). Handoff data is `handoff/<file>.json`. Repository facts are `1b090c9:<path>`. `wf/…` files are the audit's scratch workspace (Understand-stage findings, verifier reports).

**Appendices** (same folder):

| | File | Content |
|---|---|---|
| A | [Appendix-A-Routes.md](Appendix-A-Routes.md) | Full 147-row screen → route table and the proposed App Router tree |
| B | [Appendix-B-Permissions.md](Appendix-B-Permissions.md) | Candidate role × action permission matrix, 347 rows |
| C | [Appendix-C-Schemas-and-Contracts.md](Appendix-C-Schemas-and-Contracts.md) | 28 candidate models; 22 service ports + 6 stand-ins; validation |
| D | [Appendix-D-Architecture.md](Appendix-D-Architecture.md) | Cross-role flows, shared state, five-state separation, invariants |
| E | [Appendix-E-Visual-Strategy.md](Appendix-E-Visual-Strategy.md) | Tokens, CSS architecture, components, accessibility, visual regression |
| F | [Appendix-F-Phase0-Plan.md](Appendix-F-Phase0-Plan.md) | Phase-0 implementation plan: 16 work packages, gates, tests, risks |
| G | [Appendix-G-Owner-Decisions.md](Appendix-G-Owner-Decisions.md) | Owner decision register: Sections A–E |

**How this report was produced.** The audit had three stages. The Understand stage extracted evidence from every board, the handoff JSON, the repository and the historical prototype. The Design stage produced five deliverables (routes, permissions, schemas, architecture, visual), each checked by an adversarial verifier and then finalised. The plan and the owner register were checked by two more verifiers. Their corrections were re-checked and applied in this assembly (Appendix F's opening log lists each one and its outcome; one proposed default was rejected, with the reason).

**At a glance**

- The v46 package verifies: SHA-256 of the zip `9d33f32e…24bf`; **178/178** checksums OK; 128 boards; 966 indexed frames; the five index files equal their source boards with 0 field differences; **0 frontend build blockers**.
- **147 screen IDs: 123 designed, 24 not designed.** All 123 are routed (107 CONFIRMED, 7 CONFIRMED board-forced, 9 PROVISIONAL), with 0 dynamic-segment conflicts. The 24 excluded IDs get no route, link or nav item.
- The candidate permission matrix has **347 rows**: 176 CONFIRMED, 130 PROVISIONAL, 41 UNRESOLVED. 22 rows carry a stakeholder ↔ v46 conflict flag.
- **28 candidate models** and **22 service ports with 183 methods**, plus 6 test/seed-only stand-in ports, cover every entity on all eight surfaces.
- One shared sample world in the browser holds the five learning states as separate records. "Completed" is written only by a system handler.
- The visual plan ports the 8 v46 stylesheets byte for byte into one cascade layer, removes Tailwind Preflight, and fixes B1-10 once, inside DataTable.
- Phase 0 is 16 work packages with objective acceptance criteria. It builds the foundation for the whole platform, not a mini-application.
- Seven owner decisions gate Phase 0 (Section 9A). Five are approvals of git writes, downloads or recorded exceptions, one is an engineering ADR to acknowledge, and one is a scope choice.

---

## 1. Handoff verification verdict

**Verdict: VERIFIED. The package is usable as the frozen design authority.** It is complete, it is byte-identical to its manifest, and its index files match the boards they summarise. The differences found sit between the index and the drawn frames, and in the route strings. All 24 are reported as handoff defects with a "board wins" treatment (Section 9B), and none of them blocks a frontend built on mock services. The package is **not yet in the repository**: `design/handoff-v46/` exists on none of the 8 local branches (re-checked with `git ls-tree` at assembly). Committing it is gate G-7.

### 1.1 What was checked

| Check | Result | Evidence |
|---|---|---|
| Artefact identity | `~/Downloads/XR-Learning-Platform-Design-Handoff-v46.zip`, SHA-256 `9d33f32e1919b239725b2abee0500795174df804f0f7d6dfa58f25b9c08d24bf`, unchanged (re-computed at assembly). The owner chose to audit this zip. | main session; `repo-baseline.json#meta` |
| Archive safety | 180 entries under one top folder, no path traversal. Extracted to an isolated scratch folder; no file in it was executed (`support.js` was hashed only). | main session; `handoff-consistency.json` check 1 |
| Checksums | `shasum -a 256 -c SHA256SUMS.txt` → **178 OK, 0 failed, 0 missing**. The only unlisted files are `MANIFEST.json` and `SHA256SUMS.txt` themselves. Re-run at assembly: 178 OK, 180 files. | CONFIRMED |
| Composition | 166 design files = 128 boards + 8 stylesheets + 19 SVG artworks + `canvas.json` + 10 handoff files, as stated in FREEZE-RECORD. `handoff/files.json` md5 and size match on 165/165 entries. `canvas.json` references all 128 boards. | check 1 · CONFIRMED |
| v45 → v46 delta | 19 added (B8-00…B8-08 and the 10 handoff files), 97 changed, 50 unchanged, 0 removed, as FREEZE-RECORD and B8-02 state. `xr-foundation.css` is unchanged, so the tokens are unchanged. | check 2 · CONFIRMED |
| `screens.json` vs B8-01 register | 147 IDs (123 designed, 24 not designed); ID set, flags, names, types, navigation, proposed route and board links identical: **0 differences** | check 3 · CONFIRMED |
| `navigation.json` vs B8-01 and boards 05/06 | 8 navigation sets (public header + 7 roles), destinations in identical order: **0 differences** | check 4 · CONFIRMED |
| `flows.json` vs B8-04 | 27 steps (A 4 · B 4 · C 3 · D 4 · E 5 · F 4 · Device 3), field by field: **0 differences** (only the table order differs) | check 6 · CONFIRMED |
| `open-decisions.json` vs B8-08 | **0 frontend build blockers**; 79 batch decisions (55 product policy + 12 data-model + 7 sample-data + 1 still open + 4 resolved/recorded); 35 register T-items: **0 differences** | check 8 · CONFIRMED |
| `tokens.json` / `tokens.css` vs `xr-foundation.css :root` and B8-07 | 65 tokens in all four sources: **0 differences** | check 9 · CONFIRMED |
| Local references | 12,156 local `href`/`src`/`url()` references resolve, except `./support.js` on the 128 boards (the canvas runtime, provided separately in `runtime/`) | check 12 · CONFIRMED |
| Frame index | `derived/frame-index.json`: 966 frames on 90 boards. 111 of the 123 designed IDs are named in at least one frame caption or caption note. The other 12 (PU-01, PU-14, PU-15, XS-01, XS-03…XS-07, VE-13, CM-06, CM-07) are identified from their registered boards; several sit on Batch-0 boards, which have no indexed frames. | check 5 · CONFIRMED |
| `entities.json` | PARTIAL. 15 records whose table equals B8-07, but each record lists one perspective's status words; at least 45 drawn role-relative labels are missing. "Scope active" is drawn nowhere. RUN `ownerWriter: Student` must not be read as the Student setting Completed. | check 7 · HB-03, HB-04, HB-05 |
| `proposedRoute` values | PARTIAL. 91 literal, 13 with query, **19 not literal routes**. Read literally, SA-15 would break the Next.js build; IA-14 "/new" contradicts its dialog board. | check 10 · HB-10, HB-12 |
| Unreferenced boards | PARTIAL. 45 of 128 boards are referenced by no screen. All 45 are non-product kinds (foundation, index, flow, proof, change log, handoff), except B1-02 (the Area Explorer, a PU-01 source). | check 11 · HB-08 |
| Package documentation | PARTIAL. Small mismatches: the START-HERE path note; FREEZE-RECORD's link-crawl evidence is not in `verification/`; "three" CSV templates where the markup has two. No product effect. | check 12 · HB-24 |

### 1.2 Authority applied

Owner binding constraints (START-HERE BC1–BC14, FREEZE-RECORD) > v46 boards > handoff JSON > `derived/`. Where the JSON and a board differ, the board wins, and the difference is reported, not silently fixed. Where a stakeholder record conflicts with v46, the build follows v46 and the conflict is flagged for the owner (Section 9C). Three examples of "board wins" that shape the build:

- `flows.json` D4 and B8-04 say Faculty release results on FA-12. The B4 boards draw no Release control (0 `<button>Release…`), and B4-14 D4 names "The assessment's own setting". Result release is therefore a system transition (HB-01).
- `navigation.json` sends the header "Request access" to PU-08. B1-01 links it to `B1-06-Selection.dc.html` three times, so it goes to PU-07 `/selection` (HB-02).
- B8-03 says "The developer switcher stays outside the product". The owner's binding instruction (rank 1) forbids a developer-only account selector, so there is no switcher anywhere (HB-20).

---

## 2. Repository baseline and safety assessment

### 2.1 State today (re-checked read-only at assembly)

| Fact | Value |
|---|---|
| Current branch / HEAD | `v2/connected-frontend-slice1` at `1b090c97b564…` |
| Approved foundation | `1b090c9` "Establish V2 platform foundation", the single commit on `v2/platform-foundation` |
| Branches at `1b090c9` | `v2/platform-foundation`, `v2/design-system-flagship`, `v2/connected-frontend-slice1`: three names, one commit, none with a commit of its own |
| Other local branches | `main` `e8c6a84` (no `v2/`, no `ui-ux/`; tree `.gitattributes .gitignore README.md branding source`), `requirements/frd-v5-draft`, `uiux/full-platform-design` (`8af1f2a`, the gold-standard prototype checkpoint), `uiux/full-platform-review006`, `uiux/student-phase1`. None is in scope for new work |
| Uncommitted work | 98 paths: **11 modified tracked** + **60 untracked Slice-1** + **27 untracked owner Source Pack** (`XR_Learning_Platform_Architecture_Source_Pack/`, which must stay untouched). Tracked diff: 11 files, +192 / −58 |
| Remote / worktrees / stash | No remote; one worktree; no stash (verifier `phase0.json` check a) |
| `CLAUDE.md`, `design/` | Neither exists at `1b090c9`; `design/` is absent from all 8 branches |

### 2.2 Inventory of the approved foundation `1b090c9`

| Area | What exists | Verdict for v46 |
|---|---|---|
| Toolchain | Node ≥ 24.15 (24.21.0 installed), pnpm 12.3.4, TypeScript 6.0.3, turbo 2.10.12 (strict env), Next.js 16.3.4 (App Router), React 19.3.0, Tailwind 4.3.3 via PostCSS, TanStack Query 5.102.8, React Hook Form 7.87.0, zod 4.6.0, Vitest 4.1.11, Playwright 1.63.0, ESLint 9.39.5, prettier 3.9.6 | Reuse; the pins are deliberate |
| 9 workspace packages | `@xr/config` (tsconfig and ESLint presets, the boundary matrix and the `xr/resolved-boundaries` rule, env schemas) · `@xr/contracts` (wire contracts, RFC 9457 problem details, strict OpenAPI conversion, draft runtime events) · `@xr/domain` (7 roles, technologies, runtime events, utilisation fold; zero dependencies) · `@xr/validation` (identifier, slug, ISO instant, bounded strings) · `@xr/testing` (Vitest and Playwright factories) · `@xr/ui` (placeholder `tokens.css` + `FoundationStatusList`) · `@xr/database` (Prisma; out of scope) · `apps/web` · `apps/api` (NestJS; out of scope) | Config, contracts, validation and testing: reuse (testing gains 4 viewport projects). Domain: refactor. UI: replace. API and database: untouched |
| Web routes | `/` (foundation page, "not a product screen"), `/system` (internal labels), `/healthz` (liveness JSON) | `/` becomes PU-01 (Phase 1); `/system` and the API probe are retired; `/healthz` stays |
| Web services | `providers.tsx` (one QueryClient per browser session), `lib/api-client.ts` (`fetchApi(path, schema)`), `lib/env.ts`, forms helper (RHF + zodResolver) | Reuse; `fetchApi` is the base of the later HTTP adapter |
| Tests | `PHASE0_VERIFICATION.md`: build 9/9, typecheck 9/9, lint 9/9, **218 unit tests** (config 67 · testing 5 · validation 8 · domain 18 · database 5 · contracts 66 · ui 1 · api 38 · web 10), test:db 1 passed + 1 skipped, **e2e 2/2 Chromium**, format clean | Re-established as the baseline before any change (WP-0.1) |
| Infrastructure | No remote, no CI configuration (ARCHITECTURE §17), no Docker or PostgreSQL. The local Playwright cache holds Chromium only | Gates run locally until a runner exists (VD-18) |
| Docs | ARCHITECTURE, MIGRATION_STRATEGY, FUNCTIONAL_PARITY_MATRIX (P-01…P-36), OPEN_DECISIONS (A-, E-, C-, D-rows), PHASE0_VERIFICATION | Amended in WP-0.2; no open Part-A row marked resolved |

### 2.3 Conflicts between the foundation and v46

Each conflict has a planned fix in WP-0.2 or WP-0.3 (Appendix F §2):

- **Tokens and base CSS.** `@xr/ui/tokens.css` is a placeholder (system font stack; `--xr-color-fg/bg/muted`, which v46 does not have). The `globals.css` body rule paints with it. Replace both with the verbatim v46 sheets.
- **Tailwind Preflight.** `globals.css` is `@import 'tailwindcss';`, which includes Preflight. Preflight strips list markers and resets the headings, buttons and images that `xr-foundation.css` styles. It is removed in either styling option (gate G-3).
- **Role labels.** `roles.ts` id `tenant_admin` and `ROLE_PLANNING_LABEL` ("Institute Admin / Tenant Admin", "Student / Learner") conflict with BC1 and B8-03. Plan: keep the id, add `ROLE_LABEL`, delete the planning labels.
- **Format order and labels.** `technology.ts` orders `web · vr · mr · ar` and labels "Web", while v46 uses WEB · AR · VR · MR. Plan: add a display order and `FORMAT_META`; retire `TECHNOLOGY_META`.
- **Completion trigger.** `runtime/utilisation.ts` (lines 183–193, 238–242) hard-codes `SIMULATION_COMPLETED` on a launched or started session as COMPLETED, while T-12 is still open. Plan: move the rule behind an injectable `CompletionPolicy` as the interim policy (gate G-2, AD-39).
- **Committed rules that need recorded exceptions.** ARCHITECTURE §3/§4 ("no business rule in apps/web"), §8 (progress "derived, never stored as truth"), §10 ("none is faked") and §14 ("no scenario selector, no demo clock, no stand-in controls"). These become TE-1, TE-2, TE-5 and TE-7 plus AD-39 (gate G-2).
- **Docs that disagree with v46.** FUNCTIONAL_PARITY_MATRIX (26 of 36 rows, e.g. P-03 licence counting, P-15 overall verdict, P-17 decline, P-25/P-26/P-27 later versions and in-place edits); MIGRATION_STRATEGY (phase order, D3 counting, D4 overall state); OPEN_DECISIONS A-07, A-08, A-14, A-20, E-19. They are amended as "v46 position, owner to confirm" (register P0-03).
- **Logo.** `branding/bits-pilani-wilp-logo.png` is committed, while BC12 makes the logo an unapproved placeholder. The PNG is not imported (VD-03).

### 2.4 Slice-1 (uncommitted, UI rejected)

Of the 71 Slice-1 paths (11 modified + 60 untracked), 9 are SAFE, 24 SALVAGE-WITH-CHANGES and 38 DISCARD (`repo-baseline.json#slice1Counts`, re-verified by the plan's verifier). No Slice-1 UI, token value, seed, copy or "demo" naming is reused (START-HERE Known exception 4). The non-visual logic is salvaged only by deliberate copy-in after review, never by merge. Salvageable examples: `term.ts` (the 15-day "Ending soon" rule), `isolation.ts`, the service-context pattern and the test doubles. Explicitly never carried: `places.ts` arithmetic, the `no-place-remaining` refusal and SCENARIO I (they encode D7 licence counting), the DEMO strip, the account chooser and `/demo`, and the inactive-Institute-Admin read block (Appendix F §2.3–§2.4).

### 2.5 Safety assessment

- **Do not switch branches in place.** All three `v2/*` branches point at `1b090c9`, so `git switch v2/platform-foundation` succeeds silently and carries the 98 uncommitted paths into the "clean" branch, including Slice-1 token edits that reuse v46 token names with different values. Cleaning in place needs `stash -u`, `clean`, `reset` or `restore`. Each of these can destroy Slice-1 work or the owner's Source Pack, and there is no remote to recover from.
- **Recommended procedure** (Appendix F §1.4; nothing has been run). (0) Preserve Slice-1 (G-1). (1) Read-only pre-flight. (2) `git worktree add -b v2/frontend-v46 /Users/mymac/Desktop/AR-VR-frontend-v46 v2/platform-foundation` (G-6). (4–7) Unzip the verified zip into a temporary folder, move it to `design/handoff-v46/` at the repository root (outside `v2/`, so prettier, eslint, turbo and Tailwind never touch it), re-run `shasum -c` (178 OK), add a root `CLAUDE.md` with the START-HERE line, and commit only those (G-7). (9) Install and re-establish the 218-test baseline before any code change (G-5a). PR base: `v2/platform-foundation`, not `main` (a PR into `main` would carry 30 commits and 660 files).
- **Never** run `git add -A`, `git add .`, `stash -u`, `clean` or `reset` in the main checkout. Never place the handoff under `v2/`. Never commit new work on `v2/design-system-flagship` or `v2/connected-frontend-slice1`.
- **Safety of this audit.** Every repository and Downloads access was read-only, and every working file was written to the session scratchpad (closing statement).

---

## 3. Complete screen and route coverage summary

Full table: [Appendix A](Appendix-A-Routes.md) §1. App Router tree: Appendix A §3.

### 3.1 Counts

The owner counts **eight surfaces**: Public plus the seven role workspaces. "Entry & shared" (XS-01…XS-08) is not a ninth surface; its screens render inside whichever surface the person is in.

| Surface | Designed | Excluded | Total |
|---|---|---|---|
| Public | 14 | 2 | 16 |
| Entry & shared (rendered in every surface) | 7 | 1 | 8 |
| Student | 19 | 1 | 20 |
| Faculty | 21 | 3 | 24 |
| Institute Admin | 19 | 3 | 22 |
| Vendor | 10 | 5 | 15 |
| Academic Reviewer | 6 | 1 | 7 |
| Content Manager | 9 | 1 | 10 |
| Super Admin | 18 | 7 | 25 |
| **All** | **123** | **24** | **147** |

Each of the 147 IDs appears exactly once, with 0 missing and 0 duplicated (computed from `screens.json` and the table rows). Every designed ID has a recommended route, a layout and shell, a navigation item, its key components, its drawn states with a count, and its source boards with frame counts.

### 3.2 Route decisions for the 123 designed IDs

- **107 CONFIRMED**: the proposed route is kept, with only its notation normalised.
- **7 CONFIRMED (board-forced)**, where a frame makes the proposal wrong. **PU-05** `/courses/[courseId]`: B1-03 f6 draws a course without a platform code, and codes contain a space. **IA-14**: no `/new`, because B2-08 f1 draws "Create group (DL-3)" as a dialog. **VE-03…VE-06**: a pre-save `/vendor/experiments/new?step=` form that becomes `/[submissionId]/edit?step=` after the first save (B5-03, "The ID is given on first save"). **VE-13**: the `#history` section of the record, not a tab (B5-06).
- **9 PROVISIONAL (proposed)**, the implementer's choice. PU-08 `?step=details|review`; XS-03 as a notice on `/sign-in?reason=`; XS-06 rendered in place by the workspace guard; XS-07 static `help/` folders per workspace; FA-07 named step slugs; FA-21 `?experimentId=`; IA-05 three named steps; IA-10 `?type=student|faculty`; VE-08 `/revise?step=`.
- **Tree facts.** 123 page patterns (102 product pages + 21 Help pages); **0 dynamic-segment name conflicts**, with one canonical parameter name per record kind (Appendix A §3.3); 26 intermediate paths (25 redirects + 1 not-found) plus 1 alias; 16 runtime guards (record and state guards, not static redirects); tab rules T1–T4 and step rules S1–S4; an explicit sidebar active-item map, because the current item cannot be derived from the URL prefix.

### 3.3 Product vs canvas

- **Product items with no screen ID**, registered as states or tabs of existing IDs rather than new screens: the Student hub Assessment tab (B4-11 f7–f9 → `/student/experiments/[experimentId]/assessment`, O-01), the Institute Admin request detail (B3-08 f4–f6 → `/institute/requests/[requestId]`, O-02), and the B1-02 Area Explorer (a PU-01 source board).
- **Not product** (Appendix A §4.1; Appendix E §10): batch indexes; flow continuity boards and their "Restart" and "Sample: …" controls; responsive proofs; change logs; B8 handoff boards; captions and annotations; `support.js`; fixed-height frame wrappers; board-only sample pools.

### 3.4 The 24 excluded IDs

PU-11, PU-16, XS-02, ST-20, FA-13, FA-23, FA-24, IA-12, IA-21, IA-22, VE-10, VE-11, VE-12, VE-14, VE-15, RV-07, CM-10, SA-04, SA-05, SA-08, SA-09, SA-23, SA-24, SA-25. Each gets no route, no link and no nav item; Appendix A quotes its `screens.json` disposition word for word. No designed screen links to any of them (B8-01 link scan).

### 3.5 What Phase 0 builds

By default (B8-06 Phase-0 row), Phase 0 builds **5 screen IDs**: XS-05 Account menu, XS-06 Not your workspace, XS-07 Help & support, XS-08 Paused / inactive banners, PU-15 Not found. XS-01/03/04 Sign-in and the public shell follow in Phase 1 unless the owner pulls them forward (gate G-8, giving 8 IDs). Every other designed URL resolves to the not-found pattern until its phase, and no navigation item points to it. Twelve route items need the owner (O-01…O-12, Appendix A §6); all are later-phase except O-06 (now part of gate G-2) and O-10 (done in Phase 0).

---

## 4. Candidate role × action permission matrix

Full matrix: [Appendix B](Appendix-B-Permissions.md), with its machine-readable twin `wf/final/permissions.json`.

### 4.1 How it was built

The v46 handoff contains **no designed permission matrix** (`design/handoff-v46/HANDOFF-AUDIT-v46.md` item 7: derive permissions from the boards and "list any doubtful case for the owner, not guess"). Every row is derived from cited evidence: the 278 `permissionEvidence` rows of the seven surface extractions, board rules and drawn controls, the handoff JSON, the owner constraints, stakeholder records and the locked decisions. **Nothing is invented.** Each row records the action, acting role, kind, required state, resulting state, scope, evidence, status, basis, decision ids and any stakeholder conflict.

Row kinds: **ALLOW** (the design offers the action), **DENY** (explicitly not offered, or a designed absence), **READ** (visibility), **SYSTEM** (no human control performs it: runtime, payment, release clock, routing), **OPEN** (undecided, never offered). **Only ALLOW grants anything**; everything else is denied by default (principle P4, from B8-06 "actions offered only where the design offers them").

### 4.2 Counts (re-computed from the JSON)

| Kind | CONFIRMED | PROVISIONAL | UNRESOLVED | Total |
|---|---|---|---|---|
| ALLOW | 76 | 27 | 0 | 103 |
| DENY | 68 | 78 | 10 | 156 |
| READ | 30 | 20 | 12 | 62 |
| SYSTEM | 2 | 5 | 4 | 11 |
| OPEN | 0 | 0 | 15 | 15 |
| **Total** | **176** | **130** | **41** | **347** |

Stakeholder-conflict flags: 22 rows. No row whose own point a stakeholder record contradicts is CONFIRMED. Rows by basis: designed safe treatment 93, stakeholder record 71, handoff rule 46, binding constraint 44, drawn board 21, gap 19, inferred absence 14, locked decision 13, contradiction 10, open 8, conflict 6, board rule 2. Entity code note: the matrix keys Faculty-course rows as **FCM**, which is the record kind **FMAP** in the schemas and the plan (board code, B2-09 "FMAP-0021"); row ids stay unchanged for traceability.

### 4.3 Principles that apply to every row (all CONFIRMED unless noted)

- **P1.** PUBLIC is a surface; there are exactly seven authenticated roles.
- **P2.** One role per signed-in person. No DEMO banner, sample-account chooser or developer selector anywhere (CONFIRMED). No role switcher while XS-02 is deferred (PROVISIONAL).
- **P3.** Another workspace's address renders XS-06 in place.
- **P4.** Offer only what is drawn; deny by default.
- **P5.** No links from one role's workspace into another's.
- **P6.** The public may browse, select, request, follow the request status page and pay. It may not buy, check out, register or gain access.
- **P7.** Scope model per role (Student self; Faculty = Faculty courses ∩ plan; Institute Admin own institution; platform roles by scope all / course / experiment).
- **P8.** The five states are never derived from each other.
- **P9.** State guards: paused institution, inactive Student, read-only published content.
- **P10.** Reasons and overrides are recorded; Published is never an override origin or target.
- **P11.** System transitions are mock services; board controls are never product.
- **P12.** One connected state for every shared record.

### 4.4 The rows that carry the binding constraints

| Row | Action · role | Kind · status | Evidence (short) |
|---|---|---|---|
| SES-04 | Show a DEMO banner, sample-account chooser or developer-only account selector · all roles | DENY · CONFIRMED | Owner constraint; B1-09 "Never here" |
| SES-02 | Open another role's workspace address · all roles | DENY · CONFIRMED | `navigation.json` rule; board 08 |
| SEL-02 | Buy / check out from the selection · Public | DENY · CONFIRMED | STK31-18; B1-06 "Never cart, basket, checkout or buy" |
| REQ-01 | Submit an institutional access request · Public | ALLOW · CONFIRMED | B1-07; `flows.json` A2 |
| REQ-13 | Approve a request, external route (DL-1) · Super Admin | ALLOW · CONFIRMED | B1-11 f1–2, f9 |
| ACC-02 | Activate access after payment is confirmed · System | SYSTEM · PROVISIONAL | B1-11; T-05 open |
| ACC-08 | Show, compute or explain licence arithmetic · every role | DENY · PROVISIONAL | T-06 / D7 safe treatment |
| SACC-01 | Give students access (experiments × students) · Institute Admin | ALLOW · CONFIRMED | B2-05; B2-13 f0 |
| SACC-05 | Give access while paused, after the plan ends, or before activation · Institute Admin | DENY · CONFIRMED | B2-05 f15–17; B7-04 f1 |
| SACC-18 | Create or change ACC / SACC as a side effect of Publish or Release · CM, SA | DENY · CONFIRMED | BC9 |
| SACC-15 | Open through a remaining group grant after the individual grant is withdrawn · Student | READ · UNRESOLVED | OD-B2-01; interim DV-1 |
| CMP-01 | Set "Completed {date}" for a format · System | SYSTEM · CONFIRMED | B3-03; BC3 (trigger T-12 open) |
| CMP-02 | Mark a format completed ("I have finished") · Student | DENY · CONFIRMED | B3-03 "You can't mark it yourself" |
| CMP-03 | Infer Completed from a launch, resource or assessment · System | DENY · CONFIRMED | BC3 |
| FB-01 | Open format feedback only after that format is Completed · Student | ALLOW · CONFIRMED | B3-06 "No disabled button"; BC5 |
| ASMT-01 | Create an assessment (4 steps) · Faculty | ALLOW · CONFIRMED | B4-04; BC6 |
| ASMT-11 | Apply universal / default assessment settings · every non-Faculty role | DENY · CONFIRMED | BC6 |
| ATT-13 | Release a result at the time set on the assessment · System | SYSTEM · PROVISIONAL | B4-14 D4; OD-B4-04 |
| ATT-14 | Release a result manually on FA-12 · Faculty | DENY · UNRESOLVED | HB-01 (index vs board) |
| ATT-07 | Mark choice / true-false answers automatically · System | SYSTEM · UNRESOLVED | B4-09 vs BC10; interim DV-2 |
| SUB-12 / SUB-21 / SUB-32 | Publish · Vendor / Academic Reviewer / Super Admin | DENY · CONFIRMED | BC7; B8-03 "No Publish control on any Super Admin or Reviewer frame" |
| SUB-17 | Approve (DL-1; at least one learning outcome) · Academic Reviewer | ALLOW · CONFIRMED | B6-03 |
| SUB-24 | Publish (DL-1), first publication · Content Manager | ALLOW · CONFIRMED | BC7; B6-07 |
| UPD-19 / UPD-20 | Release (never "Publish") / Hold · Super Admin | ALLOW · CONFIRMED | BC8; B7-05; B7-10 f0 |
| UPD-10 | Release, Hold or Publish a correction · Content Manager | DENY · CONFIRMED | BC8 |
| EXP-07 | Edit published catalogue or delivery fields · Super Admin | DENY · PROVISIONAL (conflict 07.2-F) | M-1; B7-06 |
| CC-07 | Edit the platform course code · Super Admin | DENY · PROVISIONAL (conflict 07.2-E) | M-2; B6-10; B7-07 |
| DTR-07 / DTR-10 / DTR-11 | IA approve or decline / SA approve / SA decline a device transfer | DENY · CONFIRMED / ALLOW · CONFIRMED / DENY · PROVISIONAL | B3-09 f1; B3-11; T-32 |
| XC-01 | Send notifications, messages or reminders · every role | DENY · PROVISIONAL | T-34 |
| SUP-04 | Reopen own resolved report · every role | OPEN · UNRESOLVED | Board 07 vs B7-09 (P0-30) |

### 4.5 Role × entity grid

Codes: C create · R read · U update · T named transition · D delete · × at least one explicit not-permitted row · ? at least one UNRESOLVED or OPEN row · `·` no row.

| Entity | Public | Student | Faculty | Inst. Admin | Vendor | Acad. Reviewer | Content Mgr | Super Admin | System |
|---|---|---|---|---|---|---|---|---|---|
| SEL | C×? | · | · | · | · | · | · | · | · |
| REQ | CRT×? | × | × | CRT×? | × | × | × | RUT×? | · |
| INST | · | R | R× | R×? | · | · | · | CRT×? | · |
| ACC | · | R×? | R×? | R×? | × | × | × | CR×? | CT×? |
| SACC | · | R×? | R× | CRT×? | × | × | × | × | · |
| GRP | · | ? | · | CRU×? | · | · | · | · | · |
| PER | · | R× | R× | CRT×? | × | × | × | T× | · |
| FCM (= FMAP) | · | · | R× | CRD× | · | · | · | · | · |
| CCODE | R | R | R | U× | · | · | U×? | × | · |
| RUN | · | RUT×? | R×? | R×? | × | × | × | R× | U× |
| CMP | · | × | × | × | × | × | × | × | T× |
| FB | · | CR× | × | × | · | × | × | × | · |
| ASMT | · | R×? | CRU×? | × | × | × | × | × | × |
| Q | · | × | CUTD? | · | · | · | · | · | × |
| ATT | · | CRUT× | RUT×? | × | · | × | × | × | T×? |
| DTR | · | CR× | × | RT×? | × | × | × | RT×? | · |
| SUB | · | · | · | · | CRUT×? | RT× | RT× | RT×? | T |
| LO | R | R | R× | · | R× | U× | R× | × | · |
| EXP | R× | R× | R× | × | × | × | R× | × | × |
| UPD | · | · | · | · | × | T×? | CRUT×? | RT×? | ? |
| AREA/CRS | R× | × | × | × | U× | × | × | CU× | · |
| ROLE | · | × | × | × | R×? | R× | R× | CRT×? | ? |
| SUP | × | CR×? | CR×? | CR×? | CR×? | CR×? | CR×? | CRT×? | · |
| SESSION | · | T× | T×? | T× | T× | T× | T× | T× | · |
| XC | · | × | × | × | × | × | × | × | U× |

Super Admin `T` on SUB is the stuck-record override only, never Publish. System `T` on CMP is the only route to Completed.

### 4.6 What the owner reviews

- **41 UNRESOLVED rows** (15 of them OPEN). Each has a safe build treatment and is mapped to the register item that decides it (Appendix G D.10).
- **98 PROVISIONAL rows** that follow a named open decision (Appendix B §4.2).
- **32 PROVISIONAL rows with no rule behind them**, confirmable in one pass (bulk item X-01: for example no group delete, no person delete, no unpublish, no withdrawal of a sent device request).
- **22 stakeholder-conflict rows**, built per v46 and flagged (Section 9C).
- Seven handoff defects that affect permissions (Appendix B §4.5).

### 4.7 How the matrix is enforced (Appendix F §5)

There are four layers and one source of truth. **Policy** is pure `may()` / `availableActions()` functions in `@xr/domain`, each rule carrying its matrix row id. **Enforcement** happens in the mock command pipeline (later the API) before validation; a refusal writes nothing. **Offer**: every view model returns `availableActions` and a mode. **Render**: a screen shows a control only when its action is listed, so drawn absences become structural (no Publish for Super Admin or Reviewer, no Decline anywhere, no format picker on IA-05, no "I have finished", no Release on FA-12). The tests are generated from the matrix: each of the 347 row ids must be referenced by at least one test, OPEN rows never appear in `availableActions`, and no user command can produce a SYSTEM transition.

---

## 5. Candidate domain schema and service-contract summary

Full models, TypeScript sketches, status-to-label maps, transition tables and contracts: [Appendix C](Appendix-C-Schemas-and-Contracts.md).

### 5.1 Approach

The handoff has **no field-level schemas and no service contracts**. B8-06 names only 14 service areas, and `entities.json` lists 15 records with one status line each. Every item in Appendix C is therefore labelled `[C]` (drawn on a board, or stated by a constraint or stakeholder record), `[P]` (an implementation field, labelled PROVISIONAL in this report) or `[U]` (open; the contract leaves room for every answer and encodes no rule). Across the 28 models there are about 266 `[C]`, 75 `[P]` and 123 `[U]` tagged items.

### 5.2 Cross-cutting foundations (Appendix C §1)

- **Branded ids.** Twelve drawn prefixes (REQ, ACC, SACC, ASMT, ATT, SUB, UPD, DTR, SUP, Q, GRP, FMAP; "Prefix + four digits in a monospace chip", B8-03), plus opaque ids for records with no drawn id. Reserved slugs (`new`, `draft`, `import`, `edit`, `revise`, `help`, `not-allowed`) are never minted. A REQ reference is display data only ("does not open the page on its own", B1-08).
- **Time.** `IsoInstant` and `CalendarDate` brands, and an injected clock.
- **Formats.** Display order WEB · AR · VR · MR beside the committed canonical order.
- **Labels.** One canonical status per record, with words from state × audience copy tables taken from the boards and B8-03, not from `entities.json`.
- **History.** Per command, as the boards draw it (the M28 table).
- **Provided values.** `Provided<T>` for figures the world supplies but nothing may derive, such as licences (T-06/D7).
- **Required edits to `1b090c9`.** `roles.ts`, `technology.ts` and `utilisation.ts` (Appendix C §1.9).

### 5.3 The 28 models

| # | Model (code) | Writer | Key CONFIRMED | Key PROVISIONAL | Key UNRESOLVED |
|---|---|---|---|---|---|
| M01 | Institution (INST) | Super Admin, only by approving a request | Internal/external set by SA at approval (B1-11 f7); no "Create institution" (T-09) | Pause is the only stored status fact; words derive from term and pause | No Campus entity (STK31-23); terminate not drawn |
| M02 | Institute Admin assignment | Super Admin | Name + work e-mail with drawn messages (B7-03); offered once access is active (OD-B7-11) | `personId`; history row | Replace/remove; more than one IA |
| M03 | Access request + payment attempt (REQ) | Public contact / IA → SA; payment = system | Form fields and messages (B1-07); requester chain Submitted → … → Access active (B1-08) | Opaque `statusToken`; `reviewStartedAt` | Exit from "Information requested" (T-03); review-started trigger (AD-14) |
| M04 | Selection (SEL) | Visitor (browser session) | Experiment + chosen published formats; last format locked (B1-05/06) | `sessionStorage` with memory fallback | A format unpublished before sending |
| M05 | Access plan (ACC) | System, on activation | Created by activation (B1-11); "Experiments in this plan" (B2-03) | `licences: Provided<number>`; status from dates + pause | D7 counting; renewal effect (OD-B3-09); "until a fixed date" term |
| M06 | Engineering area (AREA) | Super Admin | Add/rename messages (B7-07) | Public counts from published only | Empty area in public explorer (OD-B7-13) |
| M07 | Course (CRS) + platform code | SA; code: Content Manager | Single writer of the platform code is the CM (M-2, B6-10) | `CourseId` never the code (blank allowed; contains a space) | Internal-space uniqueness (D-25); 07.2-E conflict |
| M08 | Institution course code (CCODE) | Institute Admin | "Your course code" + optional semester (B2-03 f6) | Keyed by (institution, course) | Which code each audience sees (T-17) |
| M09 | Experiment, versions, delivery, LO, resources (EXP) | CM (publish); SA (release) | Public only when published (B6-12 f5–6); live version line (B7-05) | Explicit SUB → EXP link; `versions[]`; `openUpdateId` | Public version label (OD-B7-05); resource authorship |
| M10 | Submission + review/publication decisions (SUB) | Vendor → AR → CM | Editor fields and messages (B5-03); unique name rule | Six-state union collapsing the Vendor engine's nine keys; decision logs | Next gate after resubmit (OD-B5-05 / M-3) |
| M11 | Correction (UPD) | CM → AR → SA | Three entries, one draft; live unchanged until release (B6-08) | `baseVersionLabel`; packages keyed by format | Correction fields (OD-B6-09); hold blocks later corrections (OD-B7-04) |
| M12 | Person, Student / Faculty (PER) | Institute Admin (SA override) | Add forms; CSV exactly six required columns (B2-07) | Discriminated Person; course filings from CSV | STK31-26 optional columns; Faculty deactivate |
| M13 | Group + membership (GRP) | Institute Admin | Create/rename via DL-3 (B2-08) | Memberships with `removedAt` | Late members (OD-B2-02); effect of removal |
| M14 | Faculty course mapping (FMAP) | Institute Admin | Assign/remove rules (B2-09); gives students nothing | Soft removal | Co-teaching (OD-B4-17) |
| M15 | Student access grant (SACC) | Institute Admin | 3-step flow; no format picker, formats inherited (LD-1, B2-05) | Formats derived at read time; `ProvidedLicenceWait`; `OpenGate` | Overlap (OD-B2-01); "Not available right now" (D-26) |
| M16 | Runtime activity (RUN, activity) | Runtime (stand-in) | "Last saved …" / "Last session reported …" times only (B3-03/04) | Per-format summary of provided values | Does "Launch WEB" alone mean In progress? |
| M17 | Format completion + progress view | System only | "You can't mark it yourself" (B3-03); per format, no percentage (B3-05) | Completion as its own record (G-2, AD-39) | Completing event (T-12); conflicts with committed `utilisation.ts` |
| M18 | Resource opened | Student | "Opened" and nothing else (T-13) | First opening only | Resource delivery (T-15) |
| M19 | Format feedback (FB) | Student | Five 1–5 ratings, comments optional (B3-06) | Uniqueness (student, experiment, format) | Staff ownership (T-25) |
| M20 | Assessment + versions (ASMT) | Faculty | One per experiment per institution; no defaults (B4-04) | Question and version pins | Ready rule; no-question contradiction (B4-05 vs B4-11 f15) |
| M21 | Question bank, drafts, imports (Q) | Faculty | Three types; marks ≥ 1 whole number (B4-07) | Bank scope; draft working set | Bank ownership; drafting sources (STK31-33); XLSX |
| M22 | Attempt, marking, result (ATT) | Student · Faculty · release setting | "No time limit"; autosave words; submit failure (B4-11/12) | Result derived from the clock; release-time formula | Automatic choice marking vs BC10 (DV-2) |
| M23 | Device transfer + authorised device (DTR) | Student → IA → SA | Two fields only; waits when no IA (B3-07) | Device keyed by Student × format; format derived | Registry; one open request; decline (T-32) |
| M24 | Support report (SUP) | Any signed-in person → SA | "What happened?" required; "Where" pre-filled; optional screenshot (07) | Resolutions/reopenings history | Who reopens (07 vs B7-09); title source; IA visibility |
| M25 | Platform role holder + scopes (ROLE) | Super Admin | Register dialogs; scope all / course / experiment (B7-08) | Scope items with ids | Experiment scope on unpublished items; Vendor scope holder |
| M26 | Mock session and identity | Sign-in (mock) | Sign-in copy and states (B1-09) | Session stores `personId` only; tests seed sessions; no switcher of any kind | Identity provider (T-10/T-11) |
| M27 | Derived read models | Services only | Usage definitions (B3-10); "Reminder due" is a status only (T-31) | Recomputed on every read | Usage visibility (OD-B3-08); STK31-28 reminder |
| M28 | History / audit | Per command as drawn | Per-command history wording table | Superseded scope rows kept | Review-started trigger |

### 5.4 Service contracts (Appendix C §3)

Every method takes no caller role (the actor is resolved from records). Each returns `Result<T, ServiceError>`, which is either `{ ok, value, changed: RecordRef[] }` or a typed refusal, and a refusal writes nothing. **22 product ports, 183 methods:**

| Port | Methods | Port | Methods |
|---|---|---|---|
| SessionService | 4 | AssessmentService | 16 |
| CatalogueService | 5 | QuestionBankService | 11 |
| SelectionService | 5 | MarkingService | 4 |
| AccessRequestService | 12 | TeachingService | 6 |
| InstitutionService | 9 | ProductionService | 24 |
| PeopleService | 10 | CorrectionService | 15 |
| GroupService | 6 | AcademicStructureService | 9 |
| FacultyCourseService | 4 | PlatformCourseCodeService | 2 |
| InstitutionCourseCodeService | 2 | PlatformRoleService | 6 |
| StudentAccessService | 9 | OperationsService | 16 |
| LearningService | 6 | FeedbackService | 2 |

Together they cover B8-06's 14 service areas plus identity, catalogue and selection. **Six test/seed-only stand-in ports (8 methods)**: `ClockPort`, `PaymentOutcomePort`, `RuntimeReportPort` (the only writer of a format completion), `WorkflowRoutingPolicy` (can return only the drawn default), `LicenceAvailabilityOracle` (seeded answers only) and `OverlapGrantPolicy` (no default). They have **no UI of any kind**. The running app reaches every drawn state by seeding, not by a demo control.

**Error model** (reconciled in Appendix F §6.5): not-signed-in · not-permitted (wrong workspace / out of scope / not own record) · not-found · invalid-state · refused (drawn refusal copy) · validation-failed (field errors + summary) · stale-version · conflict · policy-open (an undecided rule was reached) · unavailable. Each maps to an RFC 9457 status for the later HTTP adapter.

**Validation.** zod sits only in `@xr/validation` and `@xr/contracts/draft` (`@xr/domain` stays zod-free, as the boundary matrix requires). Forms use React Hook Form with the same schemas and validate on the primary action. Every drawn message is held once in a copy catalogue keyed by rule.

### 5.5 Not modelled, by design (Appendix C §6)

- A Module layer.
- Programme as a navigation level, grouping or filter. It is free text on the Student record.
- A Campus entity.
- Aggregate completion.
- Launch-derived or self-reported completion.
- Licence counting.
- Payment processing, real authentication, XR runtimes and grading automation.
- Backend persistence, and sent notifications.
- Decline states.
- Super Admin edits of published content.
- Vendor updates.
- A DEMO banner or any account/role switcher, in product or developer tooling.
- A routing branch that skips the Academic Reviewer.

### 5.6 What the schemas leave to the owner

There are 33 items (Appendix C §8). The ones that shape the data model are D7 counting, overlapping grants, the completion trigger, renewal effects on the plan, the resubmission gate, the Vendor scope holder, choice-question marking and support-report reopening. Each is placed in a phase in Appendix G.

---

## 6. Cross-role workflow and shared-state architecture

Full design: [Appendix D](Appendix-D-Architecture.md).

### 6.1 Layers

```
screens        apps/web/src/features/<surface>/<screen-id>/   render view models; call commands; never compute permissions
query layer    apps/web/src/queries/                          TanStack Query; keys per session; one invalidation predicate
ports          @xr/contracts/draft                            22 product + 6 stand-in interfaces, zod DTOs, contract suite
adapters       @xr/sample-platform (now) · HTTP adapter (later) chosen once in apps/web/src/platform/composition.ts
domain         @xr/domain                                     types, state machines, policies, invariants, derivations
```

The rules flow downward only. The mock and the later HTTP adapter implement the same ports, and the same framework-free contract suite runs against both, so moving from mocks to `apps/api` needs no screen rewrite. The new package `@xr/sample-platform` needs one boundary-matrix row (gate G-2, AD-01). `@xr/domain` keeps its committed zero-dependency, zod-free rule.

### 6.2 One connected state (BC14)

There is one sample world, and every role reads and writes it. **Option A** (default, PROVISIONAL): one world per browser tab, in memory, with one QueryClient. Sign-out and sign-in as another person keep the world. A reload or full navigation rebuilds it from the seed, and nothing is written to browser storage except the board-drawn selection basket and request ticket. **BC14 is therefore met inside one tab. It is not met across tabs or after a reload** until the owner authorises option B (a versioned `localStorage` snapshot with BroadcastChannel and Web Locks; TE-6; register P0-02). Hosted reviewer walk-throughs of cross-role flows need P0-02 answered first.

**Command pipeline** (every write): serialise → resolve the actor from records → policy → validation → load inputs → pure decision → apply events and history → check invariants → commit and publish `{worldVersion, changed}`. Each command carries a `commandId`, so a repeat returns the first receipt; each record carries a `rev`, so a stale write is refused. **Invalidation**: every query declares the record kinds it depends on, and one predicate invalidates whatever the receipt says changed, so no hand-written per-mutation lists exist. Status words are never stored: services return canonical states plus facts, and the web copy tables render the words for each role.

### 6.3 Five states, five writers (Appendix D §5)

| State | Set by | Never set by | Status |
|---|---|---|---|
| ① Publication | Content Manager `publish` (first publication); Super Admin `release` (later versions) | Super Admin first publication; Vendor; Reviewer; any access command | CONFIRMED (BC7, BC8) |
| ② Institution access | SA decision (internal route activates); payment outcome (external); SA pause / restore; the clock (ending / ended, derived) | Publish / Release; Institute Admin; Student | CONFIRMED (BC9) |
| ③ Student entitlement | Institute Admin `giveAccess` / `withdrawGrant`; seed only for "Waiting for a licence" | Publish / Release; plan activation; Faculty; Student | CONFIRMED · PROVISIONAL (seed-only waiting) |
| ④ Runtime activity | Runtime events only (stand-in, fixtures, CI hooks). "Launch WEB" stores nothing | Resources, assessments, feedback, staff actions | CONFIRMED rule · PROVISIONAL (AD-16) |
| ⑤ Learning completion | **System completion handler only**, behind an injectable `CompletionPolicy` (interim: the committed `utilisation.ts` rule) | The Student; any user command; a launch; time; resources; an assessment; another format | CONFIRMED (who may not) · GATE G-2 (stored record, AD-39) · UNRESOLVED (trigger T-12) |

Read models read these states side by side and never derive one from another. `formatProgress` shows Completed only when a completion record exists. `feedbackEntry` needs a completion for that format and no earlier feedback (one record per Student × Experiment × format; BC5). `canOpenFormat` reads ①②③ and never ④⑤. Progress is per format, with no percentage or overall verdict (BC4).

**Twelve invariants**, checked after every command in tests:

1. Publish and Release change no ACC, SACC or FMAP.
2. Only runtime ingestion changes ④, and only the completion handler writes ⑤.
3. The completion handler never writes ⑤ from a launch, resource, assessment, time or another format, and a second completion never moves the date.
4. Progress is unchanged by a withdrawal or a pause.
5. `canOpenFormat` is unchanged by runtime events.
6. The public catalogue is unchanged by IA, SA-pause or Student commands.
7. At most one FB per Student × Experiment × format, and only after ⑤.
8. Activating a plan creates no grant, and giving a grant creates no runtime event.
9. Assessment rules come only from that assessment.
10. No command merges, deduplicates or renames one Composite Wall record into the other (BC11). This is the wording as corrected at assembly.
11. "Completed" is read only from ⑤.
12. Every stand-in event carries sample provenance.

### 6.4 Flows 1–6 on one world

The continuity boards are titled Flow 1–6 (titles re-read at assembly); `flows.json` uses letters. Appendix D §4 gives every step with its command, transition, what every other role now sees, the invariant and the status. The 27 `flows.json` steps plus the drawn alternates are the Phase-0 test units.

| Flow (boards) | `flows.json` | One record, many roles (examples of "others now see") |
|---|---|---|
| **1** Public discovery → request → decision → active access (B1-13; B1-01…B1-11) | A1–A4 | REQ-0042: the requester sees "Submitted", then "Under review" (trigger interim AD-14); the SA nav count goes 2 → 3; approval creates the institution; payment success creates ACC-0107 and SA-06/SA-07 show "Access active" with "No Institute Admin" |
| **2** Campus distribution (B2-13) | B1–B4 + withdraw | SA assigns the Institute Admin; the IA gives SACC-0310; the Student sees the experiment with inherited WEB · VR; Faculty see "students with access"; withdrawal shows "no longer given" to the Student |
| **3** Learning, per-format feedback, device chain (B3-12) | C1–C3; Device 1–3 | A resource opening is visible to Faculty (FA-21); a system completion makes "Completed 14 Oct 2026" and "Give feedback on WEB" appear and updates the FA, IA-20 and SA-07 counts; DTR-0018 moves Student → IA (forward only) → SA (approve only) with role-relative words |
| **4** Assessment across Faculty and Student (B4-14) | D1–D4 | ASMT-0009 created by Faculty; ATT-0450 by the Student; marks confirmed by Faculty; the result is released by the assessment's own setting, not a Faculty control (HB-01) |
| **5** First publication (B5-08 steps 1–3; B6-12 steps 4–6) | E1–E5 + 3 alternates | SUB-0077 Vendor → Academic Reviewer (return, revise, resubmit; the Vendor sees "Submitted" after a resubmit, M-3) → Content Manager publishes → listed in the catalogue. **No access is granted** |
| **6** Corrected version, Release / Hold (B6-13 steps 1–2; B7-11) | F1–F4 + alternates | UPD-0005 CM → AR → SA; "Awaiting release decision" (CM) and "Waiting for your decision" (SA) are one state with two labels; Release swaps the live version 1.2 → 1.3 everywhere; Hold keeps the live version |

### 6.5 Identity and stand-ins without demo controls

Identity is a session port over sample-world people. Its only product entry is the designed XS-01 form (Phase 1 by default; gate G-8): a typed sample e-mail plus any non-empty password signs in, and an unknown e-mail shows the drawn "Wrong details". There is no DEMO banner, account chooser, role switcher or "Viewing as" anywhere, including developer tooling. Tests set sessions through a CI-only boot descriptor that is compiled out of every non-CI build. System writers (clock, payment outcome, runtime report, routing, licence wait, overlap) are stand-in ports driven only by the seed and by tests. Each departure from the committed architecture is recorded as an exception with a removal trigger: TE-1, TE-2, TE-5 and TE-7 now; TE-3, TE-4 and TE-8 before their phases; TE-6 only if authorised.

---

## 7. Visual implementation strategy

Full strategy: [Appendix E](Appendix-E-Visual-Strategy.md).

### 7.1 Facts (CONFIRMED by direct scans)

- 65 tokens in `xr-foundation.css :root`, identical to `handoff/tokens.css`. Only 11 are read through `var()`; the sheets hard-code most colours, and 16 hex values are not token values.
- 8 stylesheets, 124,181 bytes, with prefixes `xr-` (foundation), `xp-` (public), `xw-` (workspace), `xl-` (learning), `xa-` (assess), `xv-` (vendor), `xg-` (govern) and `xd-` (admin).
- 89 `@container` blocks on the named containers `xr-app`, `xr-content` and `xp`. The only `@media` rule is `prefers-reduced-motion`. Responsive behaviour therefore depends on the shell establishing those containers, and jsdom cannot test it.
- **24,319 inline `style=` attributes** on the 128 boards (re-counted at assembly; the Understand-stage figure of 23,140 is superseded). They are board layout, not product CSS.
- Error summaries: 192 product instances. 115 link each item to its field; 30 list plain text (B2-05, B2-07, B2-14, B3-08); 47 on B5 boards use per-item "Go to …" buttons. The Understand-stage "77 do not link" is these 30 + 47.
- Sidebar focus ring: #1F4FD8 on #141B5E = **2.35:1**, below the 3:1 the design claims for focus. Gold #F7C95B gives 9.98:1.
- Motion (drawer and dialog 280 ms, menus 200 ms) is specified on boards 02/12 but exists in no stylesheet.

### 7.2 Strategy

1. **Port the 8 sheets byte for byte** into `@xr/ui`, in one shared cascade layer `xr.v46`, in B8-07 load order, with a checksum test against `SHA256SUMS.txt`. Do not rewrite them into CSS Modules or utilities. One layer matters: a later sheet's weaker selector must not beat an earlier sheet's stronger one, as it would if each sheet had its own layer.
2. **An additive product layer `xr.product`** (PF-01…PF-13). Each rule cites its evidence: PF-01 the B1-10 sort fix and hidden-header guards; PF-02 viewport min-height; PF-03 a fixed drawer and scrim with an inert background; PF-04 native `<dialog>` with a bottom sheet below 600 px; PF-05 fixed public overlays; PF-06 `.xp{overflow:clip}`; PF-07 the gold focus ring on navy; PF-09 self-hosted Public Sans under its own family name; PF-11 focus never hidden under sticky bars; PF-13 product-only literals. PF-08 (motion) and PF-12 (forced colours) are deferred (register DV-8). PF-10 is a prop, not CSS.
3. **Tailwind Preflight is removed in both options.** VD-01 (gate G-3) chooses between Tailwind 4 without Preflight as constrained composition utilities in `apps/web` (Option A, recommended) and no Tailwind (Option B).
4. **Components emit the board class names and ARIA exactly.** They are built on native elements, with no headless kit and no third-party design system (owner constraint), and no Tailwind classes inside `@xr/ui`.

### 7.3 Components and shells

There are **42 Phase-0 components**: 19 foundation, 10 forms, 5 data display, 4 overlays, 4 shells. Examples: Button, StatusPill, Notice, ShellBanner, MessagePage, LogoPlaceholder ("BITS Pilani / WILP logo — placeholder", BC12), SkipLink, Field, ErrorSummary (`xw-errsum`, always linked), DataTable, Tabs, DecisionLayout (sticky and static variants, VD-05), Dialog (DL-1/2/3), Drawer, AccountMenu (a disclosure, not `role="menu"`), WorkspaceShell, Sidebar, TopBar and the Help template. PublicShell, SignInCard and PublicMenuSheet are Phase 1 (45 components if gate G-8 pulls them forward). Components that are not drawn are not built: no Meter, toast, pagination, combobox or switch.

**Navigation.** One typed config per role, taken verbatim from `navigation.json` and board 06 after two board-wins normalisations: "Request access" → PU-07, and "Help (foot)" → "Help". Help is always last. The active item comes from an explicit map, and a nav item renders only when its screen is built. Below 1024 px of app width the sidebar becomes a drawer with a Menu button; from 1024 to 1279 it is a rail; from 1280 it is full. The account menu content follows board 06 ("My device" only for Students with AR, VR or MR).

### 7.4 B1-10 (BC13) remediation

**Root cause.** In `xr-foundation.css`, `@container xr-content (max-width:759.98px){ .xr-table thead{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)} … }` visually hides the header row but leaves the "Received" sort `<button>` focusable. Below 760 px of content it is a 1×1 invisible tab stop. It is drawn on B1-10 frames 3, 8 and 9. Its accessible name also repeats "Received".

**Fix, once, in DataTable (PF-01).** Below 760 px a visible sort control sits in the toolbar-status row above the rows, sharing one sort state with the header. The header button gets `display:none`. Guard rules also cover `.xp-ftable` (below 760 px) and `.xp-compare` (below 600 px). The accessible name is de-duplicated to "Received, newest first. Change order".

**Tests.** Vitest markup and behaviour tests; Playwright in a specimen harness at content widths 343, 759, 760 and 1112; `expectNoInvisibleFocusTargets` on every built route at 4 widths; the SA-02 route test is written in Phase 0 and turned on in Phase 1. **Correction to the Understand stage:** B1-13 does **not** repeat the defect. Its one `thead` control sits in an inert, `aria-hidden` SA-02 thumbnail (1 of B1-13's 9 `thead`s, against 10 of 10 on B1-10; re-counted at assembly), and the same DataTable fix covers it.

### 7.5 Other accessibility and responsive rules

- **Overlays.** Drawers and dialogs on the boards are positioned inside canvas frames; in the product they are fixed to the viewport (PF-03…PF-05).
- **Scrolling.** The page scrolls naturally; the canvas's fixed-height frame wrappers are never copied.
- **Dialog focus** follows board 10: the initial focus depends on the dialog kind (Cancel first for a destructive DL-1), focus is trapped, Esc means Cancel, and focus returns to the trigger.
- **Validation** runs on the primary action. The error summary takes focus and links each error to its field; dialogs focus the first invalid field.
- **Targets** are at least 24×24.
- **Live regions** use `role=status` and `role=alert` as drawn.
- **Skip link** on every shell (VD-16).
- **Fonts.** Public Sans is the working font; it is self-hosted if the download is approved (G-5c), otherwise loaded from the Google Fonts link exactly as on the boards.

### 7.6 Visual regression and the "do not" list

**Board capture is offline.** The frozen boards are served from a scratch copy, never edited. React 18.3.1, ReactDOM 18.3.1, Babel 7.29.0 and Public Sans are vendored and checked against the SRI hashes in `support.js` (download approval: G-5c), and the network is blocked except localhost. Product screens are compared at 1440/1024/768/375 with written tolerances. Expected deviations each need owner approval: B1-10, the skip link, the gold focus ring, the viewport-fixed overlays, the error-summary normalisation and the canvas-only removals. There is no CI runner and no container runtime, so until VD-18 is decided, board and product are captured in the same run on the same machine.

**Never in product code:**
- `support.js`;
- board controls ("Restart", "Sample: …"), captions, annotations and frame wrappers;
- canvas classes (`doc-*`, `b1-frame`, `xa-boardctl`, …);
- decision ids inside product copy (VD-10; 298 text instances on B5–B7, stripped through the copy table);
- "DEMO", "Viewing as", a sample-account list or a workspace chooser;
- the committed logo PNG;
- any Slice-1 UI.

Static scans enforce each of these.

---

## 8. Proposed Phase 0 implementation plan

Full plan, with commands, file lists, acceptance criteria, risks and the definition of done: [Appendix F](Appendix-F-Phase0-Plan.md).

### 8.1 Scope

Phase 0 builds **the foundation for the complete platform**, all eight surfaces and Flows 1–6, without building a mini-application. It delivers:
- the frozen handoff in the repository;
- the v46 visual layer and 42 components;
- seven role shells and their navigation;
- domain types, state machines, policies and invariants for **all 28 models**;
- **all 22 port contracts** with the contract suite;
- the mock adapter, the seed and a scripted walk;
- the composition root and query layer;
- the foundation screens of the B8-06 Phase-0 row (5 IDs);
- cross-role proofs on one world;
- test infrastructure at four widths;
- the board-capture pipeline;
- a verification record.

**Not in Phase 0**: any PU-, ST-, FA-, IA-, VE-, RV-, CM- or SA- screen; sign-in and the public shell unless G-8; the HTTP adapter; the WEB runtime stand-in route (Phase 3); the payment stand-in screens (Phase 1); browser persistence; motion; anything under `apps/api` or `packages/database`.

### 8.2 Work packages

| WP | Scope | Key acceptance criteria (abridged; all are objective) | Gate |
|---|---|---|---|
| 0.1 Repository setup | Slice-1 preservation; new worktree and branch from `1b090c9`; place, verify and commit `design/handoff-v46/` + `CLAUDE.md`; install; baseline | The main checkout's status is unchanged (98 lines), or the WIP commit holds exactly the 71 Slice-1 paths; 178 OK re-run from git objects; the handoff commit touches only the handoff and `CLAUDE.md`; baseline = build 9/9, typecheck 9/9, lint 9/9, 218 tests, e2e 2/2 | G-1, G-6, G-7, G-5a |
| 0.2 Decisions and doc amendments | ADR-0001…0008 under `v2/docs/decisions/`; exceptions TE-1…TE-8 with removal triggers; amendments to ARCHITECTURE, OPEN_DECISIONS (A-07, A-08, A-14, A-20 annotated), FUNCTIONAL_PARITY_MATRIX, MIGRATION_STRATEGY; audit deliverables, the permission matrix and the Understand JSON under `v2/docs/v46/` | Each ADR has context, decision, consequences, removal trigger, evidence and a sign-off line; no Part-A row marked resolved; matrix SHA-256 equal to the audit file, with `docs/v46/` excluded from prettier | produces the G-2 / G-3 packets |
| 0.3 Foundation conflict fixes | `ROLE_LABEL`; display order + `FORMAT_META`; `CompletionPolicy` with the committed rule as `interimCompletionPolicy`; retire `/`, `/system`, the API probe and `FoundationStatusList`; Playwright 4 projects; new smoke test step 1; `.prettierignore` | A grep finds no "Tenant Admin", "Learner", `ROLE_PLANNING_LABEL` or `TECHNOLOGY_META`, comments and READMEs included; `inDisplayOrder` → web, ar, vr, mr; all existing `utilisation.test.ts` cases pass; `/` and `/system` give 404, `/healthz` 200 | — |
| 0.4 Test harness base | Pinned axe devDependencies; specimen harness; `reachAndClick`, `expectNoInvisibleFocusTargets`, `actAs`, boot descriptor; ESLint import fences; scans; `pnpm verify` | Helper self-tests catch a clipped focusable button and an unreachable button; each lint rule has RuleTester cases; the dependency deny-list test fails on a design-system package | G-5b (axe part) |
| 0.5 Tokens, CSS port, product layer | 8 sheets + 19 SVGs byte for byte; one `xr.v46` layer; PF rules; Preflight removed; fonts | Checksum test passes and fails after a 1-byte edit; computed body background #F4F5FB and text #12173F; sidebar focus outline #F7C95B; no Preflight rule in the built CSS | G-3 (globals / PostCSS step); G-5c (fonts) |
| 0.6 Core components | 42 components, emitting board classes and ARIA; icon registry from the boards | A ledger of 42 entries, each with a board-frame citation; markup-contract, behaviour and axe tests; Slice-1 provenance test | — |
| 0.7 DataTable + B1-10 | Labelled-row mode below 760 px; sort control in the toolbar; guards for `xp-ftable` and `xp-compare` | Below 760 px exactly one visible "Received" control and no invisible focus target; header button `display:none`; ≥ 760 px header visible; names exactly as specified | — |
| 0.8 Shells and navigation | Shell (drawer / rail / full), sidebar, top bar, account menu, banner slot, Help template; 7 nav configs + public header config | Labels and order equal `navigation.json` after the HB-02/HB-19 normalisations; icon keys equal board 06; Help last; the drawer focus cycle; each sidebar shows only Help with the Phase-0 manifest | (scope G-8) |
| 0.9 Domain for every entity | Types for M01–M28; transition tables; decisions; policies with matrix row ids; 12 invariants; read models; open rules as typed policies with no default | Every drawn transition allowed and every other pair refused; 347/347 matrix rows covered; OPEN never offered; the five-state separation and no-counting tests; zero dependencies and no zod | G-2 (completion part) |
| 0.10 Ports, DTOs, contract suite | `@xr/contracts` `./draft`; 22 + 6 ports; zod DTOs; error model; framework-free contract suite on its own subpath; method ledger | The ledger counts 183 + 8 methods, each with a phase; drawn messages reproduced in table-driven tests; the existing 66 contracts tests still pass | — |
| 0.11 Mock adapter and sample world | `@xr/sample-platform`: world, mutex, 8-step pipeline, handlers for the Phase-0 method set, stand-ins, ids, seed (spine-start), scripted walk, fixtures | Contract suite green; deterministic seed; the walk yields exactly REQ-0042, ACC-0107, SACC-0310, ASMT-0009, ATT-0450, DTR-0018, SUB-0077, UPD-0005, SUP-0213 and REQ-0058; refusals write nothing; no `Math.random` or `Date.now` | G-2 |
| 0.12 Composition root, queries, session | Env flags; `composition.ts`; PlatformProvider; session store; query keys, `meta.deps`, one invalidation predicate; test-hook bridge by build-time alias | Exactly the queries depending on a changed kind are invalidated; sign-out clears the cache; no test-hook code in non-CI bundles; only the composition root imports the mock | G-2 |
| 0.13 Foundation screens and guards | XS-05, XS-06, XS-07, XS-08, PU-15; SessionGate, WorkspaceFrame, `returnTo`, record-guard mechanism; `/<base>` → `/<base>/help` interim; link-target ledger | XS-06 correct for all 42 (role, other workspace) pairs; XS-07 drawn fields, including the "Where" pre-fill and screenshot file name; no reporter Reopen; "Done" at 4 widths; axe and invisible-focus clean; no page outside the Phase-0 manifest | G-2; scope G-8 |
| 0.14 Cross-role thin vertical proof | Port-level walk of Flows 1–6 and the device chain on one world; browser proofs on Phase-0 screens; Playwright flow skeletons | All 27 steps + drawn alternates pass; invariants after every step; role words match an independent fixture taken from board frames; report → resolve → note and pause → banners in one tab | — |
| 0.15 Visual parity pipeline | Offline board capture; product capture; tolerances; deviation register; Phase-0 baselines | Vendored hashes equal the SRI values; frame counts equal the frame index; network blocked; baselines within tolerance or approved | G-5c; VD-18 |
| 0.16 Verification record and handover | `PHASE0_FRONTEND_VERIFICATION.md`; capability, method, permission and link ledgers; PR to `v2/platform-foundation` | Every definition-of-done item is evidenced; the main checkout is unchanged; still 178 OK | — (PR needs a remote, P0-01) |

**Order.** WP-0.1 → 0.2 → 0.3. Then the visual column (0.4 → 0.5 → 0.6 → 0.7 / 0.8) and the data column (0.9 → 0.10 → 0.11 → 0.12) run in parallel, and join at 0.13 → 0.14 → 0.15 → 0.16.

**Definition of done** (19 items, Appendix F §11.2), in summary: the repository and handoff are verified; all suites are green through `pnpm verify` (with an uncached handoff-checks step); ADRs and exceptions are signed; foundation conflicts are gone; the CSS is byte-identical with no Preflight; 42 components are tested; B1-10 is fixed and tested; navigation equals the index; the domain covers 347/347 matrix rows; the contracts are complete; the mock is deterministic; one world per tab; the 5 screens are "Done" at 4 widths; the cross-role proofs pass; accessibility and reach checks pass in Chromium (the browser policy is verified later, when a runner exists); scans are at 0; Phase-0 baselines are captured; the ledgers are committed.

**Main risks and mitigations** (22 in Appendix F §11.1):
- An in-place branch switch, or loss of Slice-1 work: the worktree, and G-1 first.
- prettier rewriting byte-identical files: ignore lists plus mutation checks.
- The turbo test cache hiding matrix changes: package-local inputs, or an uncached step.
- Cascade drift: one layer, a spike and computed-style assertions.
- Container queries untestable in jsdom: Playwright.
- Assumed Next.js 16 behaviours: a spike before the screens.
- Option A resetting the world on reload: AD-07 decided before reviewer builds.
- Open decisions being decided silently in code: typed policies with no default, plus the stated interims.
- A demo or identity surface creeping in: scans and bundle sentinels.

**How later phases connect.** Phases 1–7 follow B8-06. Each phase adds feature folders, route files, the read methods its screens need, built-screen manifest entries (which make nav items appear), baselines and copy-register entries. It never changes the domain boundaries, the port interfaces (additions only, each with contract cases), the pipeline, the query keys, the shells, the CSS layers or the guards; any such change needs a new ADR (Appendix F §9).

---

## 9. Open decisions requiring owner approval

The complete register is [Appendix G](Appendix-G-Owner-Decisions.md). Recommendations are not decisions.

### 9A. Before Phase 0 starts: blockers (one list, shared by the plan and the register)

| # | Gate (register) | Decision | Blocks | Recommendation |
|---|---|---|---|---|
| 1 | **G-1** (A2) | How to preserve the uncommitted Slice-1 work before any git write: (A) a WIP commit on `v2/connected-frontend-slice1` with pathspec `v2` only; (B) a patch + tar outside the repo; (C) leave it as is | WP-0.1 step 0 | A, plus B as an off-repo copy until a remote exists |
| 2 | **G-6** (A1) | Approve branch `v2/frontend-v46` from `1b090c9` in a new worktree at `/Users/mymac/Desktop/AR-VR-frontend-v46` (names and location are yours) | WP-0.1 step 2 onward | Approve, or rename |
| 3 | **G-7** (A3) | Approve committing `design/handoff-v46/` at the repository root plus a root `CLAUDE.md` with the START-HERE line, and confirm the zip (SHA-256 `9d33f32e…24bf`) is the approved artefact | WP-0.1 step 7; checksum-pinned work | Approve |
| 4 | **G-5** (A6) | Approve (a) `pnpm install --frozen-lockfile` in the new worktree; (b) pinned axe devDependencies; (c) vendored React/ReactDOM 18.3.1, Babel 7.29.0 and Public Sans files, with `support.js` run only in the capture harness | (a) baseline and all code WPs; (b) WP-0.4 axe part; (c) WP-0.15 and self-hosted fonts | Approve (a) and (b); approve (c) with the SRI check |
| 5 | **G-2** (A4) | Sign the exception packet against `1b090c9` ARCHITECTURE §3/§4/§8/§10/§14: TE-1 sample identity (session port; no selector, no DEMO banner); TE-2 browser mock services with AD-01 (`@xr/sample-platform`) and AD-02 (`@xr/contracts` `./draft`); TE-5 anchored sample clock; TE-7 + VD-17 test-only flags and harness; AD-39 completion stored as a system record behind `CompletionPolicy` | Merge of WP-0.9 (completion part), 0.11, 0.12, 0.13 | Approve as drafted |
| 6 | **G-3** (A5) | Acknowledge engineering ADR VD-01 (closes E-19): verbatim v46 CSS in one layer, Preflight removed; Option A (Tailwind without Preflight, constrained) or Option B (no Tailwind) | The `globals.css` / PostCSS step of WP-0.5 | Option A |
| 7 | **G-8** (A7) | Phase-0 scope of sign-in: follow B8-06 (XS-01/03/04 and the public shell in Phase 1; Phase-0 proofs via the CI-only seam) or pull them into Phase 0 so a person can walk a Phase-0 build | The scope of WP-0.6, 0.8, 0.13 | Follow B8-06 |

**Withdrawn as a gate:** the git remote and PR base (formerly plan gate G-4; now P0-01). It is needed for the PR and an off-machine backup, not for any work package, but strongly recommended early because nothing is backed up today.

**Phase-0 defaults to acknowledge with G-2 / G-3** (they proceed unless you object; Appendix F §10.2):
- Keep the `tenant_admin` id with "Institute Admin" labels.
- WEB·AR·VR·MR display order.
- Option A persistence (memory per tab).
- Spine-start seed.
- `/<base>` → `/<base>/help` until each home exists, with "Browse experiments" listed as a known dead link.
- Interims so the flow suites decide nothing silently: AD-14 (the "Under review" trigger is the first SA-03 read); DV-1 (the overlap case returns `policy-open`); DV-2 (objective marks from fixtures, no scoring engine).
- No reporter Reopen; report title = the start of "What happened"; no problem-category field.
- One role per person.
- Chromium-only proof in Phase 0.
- Motion and forced colours deferred.
- Rail preference kept in memory.
- The remaining VD defaults as recommended.

### 9B. Handoff defects to acknowledge (board wins)

There are 24 rows (HB-01…HB-24, Appendix G §B.1). The single ask: confirm "board wins" for all of them; no new canvas version is needed for the build. The ones with build effect:
- **HB-01** — results released by the assessment's own setting; no Release on FA-12.
- **HB-02** — "Request access" goes to PU-07.
- **HB-03** — role-relative status words come from the boards, not `entities.json`.
- **HB-04** — "Scope active" is drawn nowhere.
- **HB-05** — the Student never writes Completed.
- **HB-06** — records the boards write but `entities.json` omits (SEL, payment attempt, LO, CCODE, GRP, FMAP, Q with drafts and imports, marking, Institute Admin assignment, authorised device).
- **HB-07** — drawn steps not traced in `flows.json`.
- **HB-08** — drawn product items with no ID: the hub Assessment tab, the IA request detail, B1-02.
- **HB-09** — register rows listing boards that do not draw the screen.
- **HB-10** — no `/groups/new`.
- **HB-11** — VE-13 is a section, not a tab.
- **HB-12** — 19 non-literal route strings, including SA-15's collision.
- **HB-13** — PU-05 keyed by course id.
- **HB-14** — the PU-10 reference is not a key.
- **HB-15** — XS-03 is a notice.
- **HB-16** — XS-06 renders in place.
- **HB-17** — CM-07 has no per-link reason.
- **HB-18** — CSV-only question import.
- **HB-19** — navigation omissions.
- **HB-20** — no developer switcher (owner constraint over B8-03).
- **HB-21** — browser persistence is an owner decision.
- **HB-22…HB-24** — stale annotations, phase-list gaps and package-doc mismatches; no product effect.

Fifteen **board-versus-board contradictions** have no board-wins answer and are routed to Section D items. Examples: who reopens a support report (07 vs B7-09); IA visibility of institution reports; Vendor scope holder; an assessment with no questions; withdraw-reason visibility; platform-code uniqueness; Cancel style and destructive initial focus.

### 9C. Stakeholder records versus v46

There are 32 rows (SC-01…SC-32: the 24 registered conflicts plus 8 found by the deliverables). The build follows v46 and the conflict is flagged, not resolved. **18 need a decision**, the main ones being:
- **SC-01** — the STK31-28 15-day reminder (v46 T-31 sends nothing; recorded as an unmet production requirement).
- **SC-02** — SA access to the platform course code (07.2-E vs M-2).
- **SC-03** — SA "ultimate superpower" (07.2-F / 07.3 R17 vs M-1).
- **SC-04** — CM direct link edit (07.3 R16 vs M-1).
- **SC-05** — PM-09 sequential gating (vs T-16, no locks).
- **SC-06** — the assessment timer (PM-08).
- **SC-08** — STK31-26 CSV columns.
- **SC-09** — AI drafting sources.
- **SC-10** — time spent / technology used.
- **SC-11** — SA creates or terminates tenants.
- **SC-12** — IA SSO set-up.
- **SC-13** — re-requesting a held experiment.
- **SC-25** — IA per-student visibility.
- **SC-26** — SA report by stream.
- **SC-27** — answers shown after release.
- **SC-28** — Vendor "version submissions".
- **SC-29** — problem categories.
- **SC-31** — plan context "Subscription / BITS Community".

Three ask you to confirm the v46 position (SC-18, SC-19, SC-20). Six need acknowledgement only (SC-07, SC-14, SC-15, SC-16, SC-17, SC-32). SC-14 records that STK31-38's device-transfer path is superseded by the later 07.2-C, which v46 follows.

### 9D. Needed before later phases (condensed)

There are 105 rows (P0-01…P7-02: 61 UNRESOLVED, 44 PROVISIONAL), each with a buildable interim, in Appendix G D.1–D.8.

| Needed by | Count | Examples |
|---|---|---|
| During Phase 0 | 35 | Remote (P0-01); browser persistence (P0-02); doc amendments (P0-03); logo (P0-04); font delivery (P0-05); runner and capture downloads (P0-08); dialog Cancel style (P0-13); support reopen and title (P0-30, P0-31); unbuilt-destination interim (P0-35) |
| Phase 1 | 22 | Sign-in exception details (P1-01); request-status URL and gate (P1-02); "Under review" trigger (P1-04); "Information requested" exit (P1-05); payment stand-in (P1-06); sample-world anchor and conflicts (P1-12) |
| Phase 2 | 16 | D7 licence counting (P2-01); overlapping grants (P2-02); late group members (P2-03); group-grant withdrawal (P2-05); earlier work after access ends (P2-06) |
| Phase 3 | 7 | WEB stand-in and launch semantics (P3-01 b/c); device keying (P3-03); usage figures (P3-04) |
| Phase 4 | 7 | Choice-question marking (P4-01); empty assessments (P4-02); co-teaching (P4-03) |
| Phase 5 | 10 | Resubmission gate (P5-01); Vendor scope holder (P5-02); platform-code uniqueness (P5-07) |
| Phase 6 | 6 | Held update blocks corrections (P6-01); correction fields (P6-02); withdraw-reason visibility (P6-03) |
| Phase 7 | 2 | Final labels; sign-off of expected baseline deviations |

Plus 8 places where the deliverables differed, each now with one interim (DV-1…DV-8), the 12 data-model decisions (D.9), and the 41 UNRESOLVED permission rows, each mapped to its deciding item (D.10).

### 9E. Production and backend only

There are 106 decisions (67 batch decisions, 33 register T-items and 6 register extras), grouped into 11 themes:
- access requests, payment and institution lifecycle (12);
- licences, grants, people and course codes (8);
- identity (3);
- learning, runtime and completion (8);
- usage, reports and feedback visibility (4);
- device transfers (6);
- assessment, question bank and marking (21);
- content production and first publication (21);
- corrections, Release / Hold and published content (13);
- governance (7);
- notifications (3).

None blocks a frontend phase. Each has a designed safe treatment that the mock keeps until you decide (0 Phase-0 blockers among the 141 business rules and 114 decisions).

---

## 10. Final verdict

**READY.**

The frozen v46 package is present, intact and consistent: 178/178 SHA-256, the index files equal their boards with 0 field differences, and 0 frontend build blockers. The approved foundation `1b090c9` is reusable, with a bounded list of refactors. All 123 designed screen IDs are routed with no slug conflicts, and the 24 excluded IDs are preserved as exclusions. Every entity on all eight surfaces has a candidate model (28) and a typed contract (22 ports, 183 methods), and the 347-row permission matrix is evidence-derived, with every doubtful case listed. Every binding constraint (BC1–BC14) is traced to a design element and a test, BC14 with the stated one-tab qualification. The audit itself has no material gap left: the gaps found by the two completeness and consistency verifiers are closed in this assembly, and the gate list of the plan and the register is now one list. Nothing in the sources or the repository is missing, corrupt or in hard conflict, so NO-GO does not apply.

The audit is READY but does not authorise a start on its own. Phase 0 may start only when these conditions are met:
1. The owner approves this plan.
2. The owner answers the seven Section-9A gates. G-1, G-6, G-7 and G-5a come before any git write or install. G-2 must be signed before the data work packages merge. G-3 must be acknowledged before the CSS pipeline step. G-8 is answered at plan approval.
3. The owner acknowledges the Section-9A Phase-0 defaults and the Section-9B "board wins" rows.

Phase 0 would become NO-GO only if the owner refused both browser-side mock services (TE-2) and every form of sample session (TE-1). The foundation would then have no lawful way to reach a shell, and Phase 0 would need re-planning.

---

No implementation files were changed: no repository file was created, modified or deleted; no branch was switched; nothing was installed, committed or pushed. All working files were written only to the session scratchpad.

*Precision note (re-checked at assembly):* `git status --porcelain -uall` still lists the same 98 paths, the tracked diff is still 11 files (+192/−58), and HEAD and all 8 branches are unchanged. The zip's SHA-256 is unchanged. During the audit, the only file under the repository folder whose modification time moved was the Claude Code host lock `.claude/scheduled_tasks.lock`, which git ignores and which the audit did not write (verifier `completeness.json`). All audit outputs are under the session scratchpad (`wf/` and `report/`).
