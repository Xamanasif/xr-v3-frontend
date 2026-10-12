# Appendix G — Owner decision register (XR Learning Platform frontend, frozen canvas v46)

Phase-0 architecture audit · consolidated owner decisions · 9 Oct 2026
This is a read-only audit. No file in the repository or in `~/Downloads` was changed, and nothing was installed or run. This register brings together the owner-decision sections of the five final deliverables (`wf/final/architecture.md` §11, `permissions.md` §4, `routes.md` §6, `schemas.md` §8, `visual.md` §13), the Understand-stage registers, and the spot-checks re-run for this document (see the Verification log).

> **Appendix G of the Phase-0 audit report** (`XR-v46-Phase0-Audit-Report.md`, Section 9). Source: `wf/design/owner-decisions.md`. Assembled 9 Oct 2026 after re-checking `wf/verify/phase0.json` and `wf/verify/completeness.json` against the boards and the repository. The changes below make this register and the plan (Appendix F) give the owner the same questions, the same gates and the same interims.
>
> **Assembly changes.**
> - **Section A.** A gate crosswalk table; A6 (install and downloads, gate G-5) and A7 (Phase-0 scope of sign-in, gate G-8) added. TE-5 and AD-39 with P3-01 (a)/(d) moved into A4. AD-07 and the MIGRATION_STRATEGY amendment moved out of the gate. A5 scoped to the `globals.css` / PostCSS step. A.2 updated.
> - **D.0.** DV-1 and DV-2 interims aligned with the plan. DV-5…DV-8 added.
> - **D.1.** P0-12, P0-16, P0-21, P0-24 and P0-28 aligned with the plan. P0-35 added (unbuilt destinations).
> - **D.2–D.4 and C.** P1-01, P1-02, P1-04 and P1-16 updated. P3-01 split. SC-20 points to A7.
> - **Counts.** Updated.
>
> **One verifier proposal was rejected:** `completeness.json` correction 3 proposed keeping sign-in in Phase 0 as the default. B8-06, a v46 board, ranks above Inventory §U, so this register recommends following B8-06 and asks the owner explicitly (A7).
>
> **Status legend.** The status of a row is the status of the *decision*. The evidence behind it is CONFIRMED unless the row says otherwise. CONFIRMED = follows directly from a binding constraint or the board-wins rule, so the owner only acknowledges it. PROVISIONAL = a reversible default the build can proceed on. UNRESOLVED = the owner must choose; an interim is given. Citations to `wf/…` are files in the audit's scratch workspace; `wf/final/<file>` are Appendices A–E.


## How to read this register

**Authority.** The order is: owner binding constraints (`design/handoff-v46/START-HERE.md` BC1–BC14, `FREEZE-RECORD-v46.md`), then the v46 boards, then the handoff JSON, then `derived/`. Where a board and the JSON differ, the board wins and the difference is a handoff defect to report (Section B). Where a stakeholder record conflicts with v46, the item is flagged for the owner and not resolved here (Section C).

**"Phase"** means the v46 build order on board B8-06: 0 Foundation · 1 Public + access spine · 2 Campus distribution · 3 Learning, feedback and device chain · 4 Teaching and assessment · 5 Production and first publication · 6 Corrections and governance · 7 Consolidation. The repository's own "Phase 0" closed with commit `1b090c9`. It uses different numbering (`1b090c9:v2/docs/MIGRATION_STRATEGY.md` §3); see P0-03.

**Status labels** (they apply to the item, not to the evidence)

| Label | Meaning here |
|---|---|
| **CONFIRMED** | The fact is verified against the cited board, handoff file, owner record or `1b090c9`. The answer follows directly from a binding constraint or the board-wins rule, so the owner only needs to acknowledge it. |
| **PROVISIONAL** | The evidence is verified. The recommended default is a reversible engineering or design judgement, and the build can proceed on it until the owner says otherwise. |
| **UNRESOLVED** | The sources conflict or say nothing, and no drawn safe treatment fully covers the case. The owner must choose. An interim is proposed where one exists. |

**Recommendations are not decisions.** Every "Recommended default" below is the audit's suggestion. Nothing is decided until the owner says so.

**Citations.** Board codes refer to `design/handoff-v46/canvas-v46/project/<code>-….dc.html`. `fN` is frame N in `design/handoff-v46/derived/frame-index.json` (0-based), followed by the frame caption or quoted text. Handoff files are given by name (`screens.json`, `flows.json` …). Understand-stage files are `wf/understand/<file>#<key>`. Final deliverables are `wf/final/<file> §n` or their own ids (AD-nn architecture, O-nn routes, VD-nn visual, permission row ids such as SACC-08, schemas §8-n). Repository facts are `1b090c9:<path>`. Array references such as `#inconsistencies[3]` or `#ownerDecisions[5]` are 0-based indices into the JSON array.

---

## A. Before Phase 0 starts

**Test applied.** An item is listed here only if Phase-0 work cannot begin or merge without it. That means one of three things: a git write the owner has not approved; a download that needs approval; or a departure from a committed repository rule that "may not be silently resolved" (`1b090c9:v2/docs/OPEN_DECISIONS.md` status row: "None may be silently resolved by an implementation") with no buildable safe default. Phase 0 (B8-06 row "0 · Foundation") covers "Shell, sidebars, account menu, Help & support, system pages, tokens, components, dialogs" (Batch-0 boards 01–08 and 10).

Seven items pass the test. A1–A5 come from the draft register; A6 and A7 were added at assembly so that this section and the plan's gate list (Appendix F §10.1) are one list. Seven candidates were checked and demoted (A.2).

**Gate crosswalk (one list, used by both documents)**

| Register | Plan gate | Decision | Blocks |
|---|---|---|---|
| A2 | G-1 | Preserve the uncommitted Slice-1 work | WP-0.1 step 0 (first git write) |
| A1 | G-6 | New branch in a new worktree | WP-0.1 step 2 onward |
| A3 | G-7 | Commit the frozen handoff and `CLAUDE.md`; confirm the artefact | WP-0.1 step 7; checksum-pinned work |
| A6 | G-5 | Install and downloads (a/b/c) | (a) WP-0.1 step 9 and all code WPs; (b) WP-0.4 axe part; (c) WP-0.15 and self-hosted fonts |
| A4 | G-2 | ARCHITECTURE exception packet (TE-1, TE-2 + AD-01/AD-02, TE-5, TE-7 + VD-17, AD-39) | Merge of WP-0.9 (completion part), WP-0.11, WP-0.12, WP-0.13 |
| A5 | G-3 | CSS ADR VD-01 (engineering ADR; owner acknowledgement) | The `globals.css` / PostCSS step of WP-0.5 |
| A7 | G-8 | Phase-0 scope of sign-in and the public shell | Scope of WP-0.6, WP-0.8, WP-0.13 |
| — | ~~G-4~~ | Git remote and PR base: withdrawn as a gate at assembly; now P0-01 | The WP-0.16 PR and off-machine backup only |

### A1 · Starting point: new branch in a new worktree (gate G-6)

- **Question.** Approve creating branch `v2/frontend-v46` from `1b090c9` (= `v2/platform-foundation`) in a **new git worktree at a separate path**, leaving the current checkout `/Users/mymac/Desktop/AR-VR` untouched? The owner also chooses the branch name and the worktree location.
- **Why it matters.**
  - Three branches point at the same commit `1b090c9` (`v2/connected-frontend-slice1`, `v2/design-system-flagship`, `v2/platform-foundation`). Re-checked with `git branch -v`.
  - Switching in place would carry the 98 uncommitted paths into the new work without warning. Re-checked with `git status --porcelain -uall`: 11 modified tracked files, plus 87 untracked paths (60 Slice-1 files whose UI was rejected, and 27 in the owner's Source Pack).
  - There is one worktree today. Creating a branch is a git write that needs the owner's approval.
- **Recommended default (recommendation).**
  - Run `git worktree add -b v2/frontend-v46 /Users/mymac/Desktop/AR-VR-frontend-v46 v2/platform-foundation`.
  - Never reuse `v2/design-system-flagship` or `v2/connected-frontend-slice1`.
  - Make future PRs against `v2/platform-foundation`, not `main`: `main` (`e8c6a84`) has no `v2/` (re-checked: its tree is `.gitattributes .gitignore README.md branding source`).
  - Procedure: `wf/understand/repo-baseline.json#recommendation.procedure` steps 1–3; Appendix F §1.4.
- **Blocks.** WP-0.1 step 2 onward (all Phase-0 work happens in the worktree).
- **Status.** Evidence CONFIRMED · decision UNRESOLVED (a default is recommended).

### A2 · Preserve the uncommitted Slice-1 work (gate G-1)

- **Question.** Before anyone runs a git command in the main checkout, choose one option:
  - **(A)** A WIP commit on `v2/connected-frontend-slice1` with the explicit pathspec `v2` only.
  - **(B)** `git diff --binary HEAD -- v2` plus a tar of the 60 untracked `v2/` paths, both stored outside the repository.
  - **(C)** Leave the working tree exactly as it is.
- **Why it matters.**
  - The repository has no remote (re-checked: `git remote` is empty), so nothing can be recovered from anywhere else.
  - The Slice-1 tree holds the only copy of the non-visual code the architecture plans to salvage after review: 9 SAFE and 24 SALVAGE_WITH_CHANGES files (`wf/understand/repo-baseline.json#slice1Counts`; `wf/final/architecture.md` §9).
  - `git add -A`, `git add .`, `git stash -u` and `git clean` would also sweep the 27-file owner Source Pack, which exists nowhere in git.
- **Recommended default (recommendation).**
  - Option A, recommended first because no remote exists. With the `v2` pathspec, the Source Pack stays untracked, and the salvage source stays readable through `git show`.
  - Option B if the owner prefers no commit on that branch (also useful as an off-repo copy until a remote exists).
  - Option C is safe only together with A1's worktree, and it leaves a single copy with no backup.
- **Blocks.** The first git operation of Phase 0. If the owner accepts the no-backup risk, the answer can be (C).
- **Status.** Evidence CONFIRMED · decision UNRESOLVED.

### A3 · Add the frozen handoff to the repository (gate G-7)

- **Question.** Approve committing `design/handoff-v46/` at the **repository root** as the first commit on the new branch, unzipped from `~/Downloads/XR-Learning-Platform-Design-Handoff-v46.zip`? The approval covers two more steps:
  - adding a root `CLAUDE.md` with the START-HERE line: "Frontend design reference: `design/handoff-v46/START-HERE.md` (frozen canvas v46). Never edit files under `design/handoff-v46/`."
  - confirming that this zip is the approved artefact. Its SHA-256 is `9d33f32e1919b239725b2abee0500795174df804f0f7d6dfa58f25b9c08d24bf`, re-computed at assembly (read only).
- **Why it matters.**
  - START-HERE "Using this package" steps 1–3 require it.
  - FREEZE-RECORD freeze rules 1–4 make the folder read-only.
  - Phase 0 ports the 8 v46 stylesheets byte for byte and pins them to `design/handoff-v46/SHA256SUMS.txt` (`wf/final/visual.md` §0 item 1).
  - Every citation in this audit uses that path, and the path exists on no branch today (re-checked with `git ls-tree` on all 8 local branches).
  - `1b090c9` has no `design/` and no root `CLAUDE.md`.
  - Placing the folder under `v2/` would expose it to `prettier --write` and lint, which would rewrite frozen files (`repo-baseline.json#recommendation.risks`).
- **Recommended default (recommendation).** Approve. Unzip into a temporary folder, move the single top folder to `design/handoff-v46/`, and run `shasum -a 256 -c SHA256SUMS.txt` (178/178 OK expected; re-run at assembly: 178 OK). Commit only that folder and `CLAUDE.md`.
- **Blocks.** WP-0.1 step 7, and the work pinned to the checksums (the CSS port and its checksum test).
- **Status.** Evidence CONFIRMED · decision UNRESOLVED.

### A4 · Record the ARCHITECTURE exceptions that Phase-0 code needs (gate G-2)

- **Question.** Record the following against `1b090c9:v2/docs/ARCHITECTURE.md`, each with a removal trigger (TE ids from `wf/final/architecture.md` §2.6)?
  - **(a) TE-2: typed mock services** that evaluate `@xr/domain` rules in the browser. Two sub-decisions go with it:
    - where they live: AD-01, a new workspace package `@xr/sample-platform`, with the boundary-matrix row, `WorkspacePackage` union, tsconfig and ESLint edits listed in architecture §1.2;
    - where the port and DTO drafts go: AD-02, a new `"./draft"` subpath export of `@xr/contracts` (the contract suite gets its own subpath `./draft/contract-suite`).
  - **(b) Test seams.** TE-7 / AD-10 / AD-11 add two build flags:
    - `NEXT_PUBLIC_XR_DATA_SOURCE = sample | api`;
    - `NEXT_PUBLIC_XR_TEST_HOOKS`, present only in CI / Playwright builds and never in any hosted build. The test-hook bridge is chosen by a build-time alias, so non-CI bundles contain no hook code.

    VD-17 adds the test-only seeding seam and the Phase-0 component specimen harness, both outside the product build.
  - **(c) TE-1: sample identity.** A session port now. The XS-01 sign-in form follows in Phase 1 (B8-06) unless A7 pulls it into Phase 0. The record states explicitly: **no developer account selector and no DEMO banner, anywhere**.
  - **(d) TE-5: the anchored sample clock** (no app-visible clock or date control; time travel only through CI hooks). Moved here from Phase 1 at assembly, because the Phase-0 seed and scripted walk need it.
  - **(e) AD-39 with P3-01 (a) and (d): learning completion stored as a system record** behind an injectable `CompletionPolicy`, with the committed `utilisation.ts` rule as the interim policy. This amends ARCH §8 ("progress (per technology) … Derived, never stored as truth"). Moved here from Phase 3 at assembly, because Phase 0 models M17 and walks Flow C at port level. P3-01 (b), (c) and TE-3 stay in Phase 3.
- **Why it matters.**
  - The committed text forbids these without a recorded exception (re-checked):
    - ARCH §3, line 59: "no business rule in `apps/web`";
    - ARCH §8: "progress (per technology) … Derived, never stored as truth";
    - ARCH §10, line 173: "No authentication is implemented and none is faked";
    - ARCH §14, line 213: "no scenario selector, no demo clock, no stand-in controls in V2".
  - `webPublicEnvSchema` holds only `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_APP_ENV` (architecture §2.6).
  - Phase 0 itself needs a session and sample data. The role sidebars (board 06), the account menu (05), Help & support with "my reports" (07) and the XS-06 role guard (08) all need them.
  - BC10 authorises typed mock services. The owner instruction of 9 Oct forbids a developer-only account selector. That supersedes `repo-baseline.json#recommendation.ownerDecisions[5]` ("a developer switcher outside product navigation") and the B8-03 row "The developer switcher stays outside the product" (HB-20).
- **Recommended default (recommendation).**
  - Record (a)–(e) now, with AD-01 = package and AD-02 = `./draft`.
  - Record each remaining exception at the start of the phase that needs it:
    - TE-3, the WEB runtime stand-in (Phase 3);
    - TE-4, the payment outcome (Phase 1);
    - TE-6, browser persistence, only if the owner authorises it (P0-02);
    - TE-8, client-rendered public pages (Phase 1).
  - Not part of this gate (moved out at assembly): the AD-07 acknowledgement (option A needs no authorisation; P0-02) and the MIGRATION_STRATEGY / FUNCTIONAL_PARITY_MATRIX amendments (P0-03, sign-off requested, not a merge blocker).
- **Blocks.** Merge of WP-0.9 (completion part), WP-0.11, WP-0.12 and WP-0.13 (the session, the seed and the mock adapter are the first data code).
- **Status.** Evidence CONFIRMED · decision UNRESOLVED.

### A5 · CSS architecture ADR (closes E-19) (gate G-3)

- **Question.** Acknowledge engineering ADR VD-01? Its common part:
  - the 8 v46 stylesheets go verbatim into one cascade layer `xr.v46` in `@xr/ui`, in B8-07 load order, with a checksum test;
  - production deltas go in a small `xr.product` layer;
  - components emit the board class names.

  Then one of two options:
  - **Option A:** Tailwind 4 **without Preflight**, as constrained composition utilities in `apps/web` only;
  - **Option B:** drop Tailwind and use typed layout primitives.
- **Why it matters.**
  - `1b090c9:v2/apps/web/src/app/globals.css` is `@import 'tailwindcss';`, which includes Preflight (re-checked).
  - Preflight strips list markers the boards rely on, forces `svg`/`img` to `display:block`, and resets the headings and buttons that `xr-foundation.css` styles (`wf/final/visual.md` §2.4; `wf/understand/visual-system.json#risks` R-02). That conflict is CONFIRMED in both options.
  - `OPEN_DECISIONS.md` E-19 records "Tailwind v4 + tokens in `@xr/ui`; primitives chosen at Design V2 start" (re-checked). That start is now. The v46 plan instead keeps the 65 tokens in `xr-foundation.css :root`, which changes the recorded interim.
  - Under the committed rule, Part-B decisions are owned by engineering and closed with an ADR, so the owner acknowledges this ADR rather than choosing it.
- **Recommended default (recommendation).** Option A. In both options Preflight goes and the v46 CSS is ported verbatim.
- **Blocks.** Only the `globals.css` / PostCSS step of WP-0.5. Components and their visual verification do not depend on the option (`@xr/ui` holds no Tailwind classes).
- **Status.** Evidence CONFIRMED · decision UNRESOLVED.

### A6 · Install and downloads (gate G-5; added at assembly)

- **Question.** Approve (a) `pnpm install --frozen-lockfile` in the new worktree (a session permission); (b) new pinned devDependencies `@axe-core/playwright` and a Vitest axe adapter (or direct `axe-core`); (c) fetching the vendored `react@18.3.1`, `react-dom@18.3.1`, `@babel/standalone@7.29.0` and the Public Sans woff2 files into a test-only `v2/tools/board-capture/vendor/`, checked against the `support.js` SRI hashes, and running `support.js` only inside the capture harness.
- **Why it matters.** Downloads and new dependencies need explicit approval. The repo pins exact versions with a minimum release age (`1b090c9:v2/pnpm-workspace.yaml`). The draft register carried (b) and (c) only as P0-09 and P0-08 and did not list (a).
- **Recommended default (recommendation).** Approve (a) and (b). Approve (c) with the SRI check.
- **Blocks.** (a) WP-0.1 step 9, the baseline run, and so every code WP. (b) The axe part of WP-0.4. (c) WP-0.15, and self-hosted fonts in WP-0.5 (fallback: the Google Fonts link, as on the boards). If the owner also wants WebKit and Firefox test runs in Phase 0 (P0-28), those browser downloads join (c).
- **Status.** Decision UNRESOLVED.

### A7 · Phase-0 scope of sign-in and the public shell (gate G-8; added at assembly)

- **Question.** Follow B8-06, with XS-01/03/04, PublicShell, SignInCard and PublicMenuSheet built in Phase 1, or pull them into Phase 0?
- **Why it matters.**
  - B8-06 (re-read at assembly): "0 · Foundation — Shell, sidebars, account menu, Help & support, system pages, tokens, components, dialogs"; "1 · Public + access spine — PU-01…12, XS-01/03, SA-01 requests group, SA-02/03, SA-06/07". Inventory §U (the design brief) lists sign-in in Phase 0, but it ranks below B8-06 (SC-20).
  - Without the pull-forward, Phase-0 shells, guards, banners and Help are proved through the CI-only boot descriptor, and a person cannot walk a Phase-0 build. Phase-0 builds are not hosted for review (plan risk K-21).
  - With the pull-forward, Phase 0 gains 3 screen ids (XS-01, XS-03, XS-04) and 3 components, and TE-1 covers the XS-01 form in Phase 0.
- **Recommended default (recommendation).** Follow B8-06, with Phase-0 review through CI captures. Pull forward only if a hosted Phase-0 review is wanted (P1-01).
- **Blocks.** The scope of WP-0.6, WP-0.8 and WP-0.13; answer at plan approval.
- **Status.** Decision UNRESOLVED.

### A.2 Checked and demoted: these do not block starting Phase 0

| Candidate | Why it does not block | Where it is now |
|---|---|---|
| Add a git remote; PR base; when the foundation lands on `main` (repo-baseline ownerDecisions[2]); the plan's former gate G-4 | Local work in the A1 worktree proceeds without a remote. A remote is needed for backup and for the first PR, and it is strongly recommended early. | P0-01 |
| Persistence of the mock world in browser storage (AD-07) | The default, option A, keeps the world in memory and writes nothing to browser storage except the B1-06 selection and the request ticket. It needs no authorisation, and the persistence driver is pluggable. | P0-02 (needed by the Phase-1 review) |
| May the committed `branding/bits-pilani-wilp-logo.png` be used? (VD-03) | BC12 already says the logo is an unapproved placeholder. The `LogoPlaceholder` treatment is CONFIRMED (`assets.json`; B8-03 'Logo box now reads "placeholder"'). | P0-04 (production) |
| Amend MIGRATION_STRATEGY, FUNCTIONAL_PARITY_MATRIX and OPEN_DECISIONS to match v46 (repo-baseline ownerDecisions[14], [15]) | v46 Phase-0 content (tokens, primitives, shells) matches the committed "Phase 1 — Flagship design: Design tokens and accessible primitives in `@xr/ui`" (re-checked). The conflicts begin with workspace screens on mocks, which start in Phase 1. | P0-03 (sign-off requested in WP-0.2; before Phase-1 workspace screens) |
| Font delivery, role id, format order, `/system` page, visual-regression runner | Each has a buildable default that can be changed later. (The downloads themselves are A6.) | P0-05 … P0-08, P1-16 |
| TE-3, TE-4, TE-6, TE-8 | Needed only by the later phases that use them. (TE-5 moved into A4 at assembly.) | A4 note; P1-01, P1-06, P3-01 |
| Sample-world anchor date and the S-1…S-11 sample conflicts (AD-08) | Sample data only, with no product effect. The seed scaffold can start with platform-side records. | P1-12 |

Inventory v3 §U also listed T-10, T-35 and T-36 as Phase-0 "Needs decided first". Each has a v46 safe treatment (`open-decisions.json` `frontendBuildBlockers` = 0; `wf/understand/decisions-rules.json#phase0Notes`). See SC-19 and SC-20.

---

## B. Handoff defects to acknowledge (board wins)

**The single ask.** Confirm "board wins" for every row in B.1, or issue a new canvas version for any row where the index, not the board, was meant (freeze rule 4: "Any change after the freeze needs a new canvas version and a new owner approval").

**Recommended default (recommendation).** Confirm "board wins" for all rows. No new canvas version is needed for the build. Correct the handoff index files only if a later canvas version is made for other reasons.

"Re-checked" marks a row whose evidence was re-run for this register (Verification log). Every other row relies on final deliverables that were themselves verified against the boards.

### B.1 Index or handoff text versus the drawn boards

| Id | Handoff says | Boards draw (evidence) | Build treatment (board wins) | Needed by | Status |
|---|---|---|---|---|---|
| HB-01 | `flows.json` D4 and the B8-04 traceability table: actor "Faculty → Student", screens "FA-12 (release) → ST-14" | B4-14 D4 row: actor "The assessment’s own setting · Results are released after the deadline (14 Nov 2026, 23:59)". B4 boards have 0 `<button>Release…` controls. FA-19 reads "Released to Rahul … when the deadline passed". (HD-1; routes D-02/O-04; schemas §7 D-12; ATT-13/14; AD-15.) Re-checked. | No release command. The result is released by each assessment's own setting, and FA-12 shows the release flag. B8-04 mirrors `flows.json`; the behavioural boards B4-06, B4-09 and B4-14 win. | Phase 4 | CONFIRMED |
| HB-02 | `navigation.json` Public header "Request access → PU-08"; `screens.json` PU-08 navigation "Header: Request access / flow step" | B1-01 `a.xp-access` href is `B1-06-Selection.dc.html` ×3. B1-06 head reads "Header “Request access” and “Selection (n)” both land here". (HD-8; D-01/O-03; V-7.) Re-checked. | The header link goes to PU-07 `/selection`. PU-08 is reached only through "Continue to request". | Phase 1 | CONFIRMED |
| HB-03 | `entities.json` (and the B8-07 shared-records table) gives one status set per record, from one perspective | At least 45 drawn labels are absent (`handoff-consistency.json` check 7). Examples by record: <br>• REQ "Submitted", "Payment failed" (B1-08 f1, f7) <br>• SACC "No access yet", "Waiting for a licence", "Individual grant withdrawn", "Access ended", "Student inactive" (B2-04, B2-05 f11) <br>• UPD "Waiting for your decision" (B7-05) <br>• DTR "Waiting on you", "Forwarded", "Still with the institution" (B3-09, B3-11) <br>• SUB "Submitted" (M-3), "Draft · read-only", "Back for a re-check", "Returned to vendor", "Stuck — nobody can act" <br>• ASMT "Draft — not ready" <br>• ATT "To do", "Result not released yet", "Marked", "Passed" <br>• INST/ACC "Paused" vs "Access paused" <br>• FB "Feedback sent 14 Oct 2026" <br>(HD-3; schemas §7 D-02…D-11.) | Store one canonical state per record and render labels from a state × viewer-role copy table. Adopt that table as the status vocabulary source (AD-24). | Phase 0 (status components), then every phase | CONFIRMED |
| HB-04 | `entities.json` ROLE status "Scope active · withdrawn (reason)" | "Scope active" appears on no board except the B8-07 table that mirrors `entities.json` (re-checked by text scan). B7-08 draws "Since <date>" and "Withdrawn <date> · “reason”", and B7-10 f10 draws "no scope". | Use the B7-08 words, and add a "No scope" state. | Phase 6 | CONFIRMED |
| HB-05 | `entities.json` and B8-07: RUN ownerWriter "Student" | B3-03 f3 note "Completion comes only from the simulation (T-12). No “I have finished” button." B3-04 f2 "Completion reported from the headset (T-12)". BC3 applies. (HD-2.) Re-checked. | Runtime events write the activity record and a system handler writes completion. The Student only launches. | Phase 3 | CONFIRMED |
| HB-06 | `entities.json` has 15 records | The boards also write SEL, payment attempts, RES opened, LO, CCODE, GRP, FMAP, Q (with drafts and imports), marking, Institute Admin assignment and authorised device. Record codes differ by source: board "FMAP-0021" (B2-09) vs entities "FCM", and ACC vs inventory "PLAN". SUB ownerWriter leaves out the Super Admin's effects (scope withdrawal → read-only draft; override back to the vendor). (Schemas §7 D-01, D-22.) | Model every drawn record (schemas M01–M28). | Phases 1–6 | CONFIRMED |
| HB-07 | `flows.json` and the B8-04 traces | Drawn steps that are not traced: <br>• B3 says "Experiment × format grant", but B2-05 inherits formats with no picker (LD-1) <br>• E leaves out the Content Manager send-back to the vendor and to a re-check (B5-06 f6/f7; B6-11 f3) <br>• F1 leaves out Withdraw; F2 leaves out the Reviewer's "Return to the Content Manager" (B6-04 f3) <br>• A3 leaves out "Request more information" (B1-11 f6/f12) <br>• C3 lists feedback entry from ST-10/ST-15 only; B3-06 also has ST-07/08/09 and Home <br>• No steps for IA-17 → SA, the SACC-0311 group grant, FMAP → Faculty scope, IA withdraw → Student, or the IA-16 code display <br>• B4 "SACC-0310 · — → Not started" mixes the grant with RUN <br>(HD-4, HD-5; schemas §7 D-08, D-09, D-13…D-15.) | The flow tests add the drawn alternates (architecture §4: E-alt1…3, F-alt, B-withdraw, Hold / Lift hold). | Phases 1–6 | CONFIRMED |
| HB-08 | The register (`screens.json` = B8-01) has no id for some drawn product items | <br>• Student hub "Assessment" tab: B4-11 f7–f9 "Hub · Assessment tab · to do / none yet / waiting for marking" (re-checked: 3 captions) <br>• B1-02 Area Explorer <br>• Institute Admin request detail REQ-0058 (B3-08 f4–f6) <br>• "Start a correction" (B6-08 f0) <br>• PU-08 "Review" step (B1-07 f5) <br>• Help sub-pages <br>• States drawn on unregistered boards: ST-01 on B4-11 f10 and B7-04 f3; IA-01 on B4-09 f6 and B7-04 f1; FA-01 paused on B7-04 f2; post-publication states on B6-12 and B7-11 <br>(HD-9; D-03…D-05, D-29.) | Register these as states or tabs of the existing ids, not as new screens. Approve the routes `/student/experiments/[experimentId]/assessment` (O-01) and `/institute/requests/[requestId]` (O-02), and make B1-02 a PU-01 source (O-09). | Phases 1, 2, 4, 6 | CONFIRMED |
| HB-09 | The register lists boards that do not draw the screen | CM-02 lists B6-03, whose 6 frames are all Reviewer frames. SA-11 lists B7-01, which only links to it. SA-13 lists B7-09, which has no content record. (D-25; O-09.) | Annotate the rows; there is no route impact. | Phases 5–6 | CONFIRMED |
| HB-10 | `screens.json` IA-14 `proposedRoute` "/institute/people/groups/[groupId] · /new" | B2-08 f0 note "Create group opens DL-3" and f1 "Create group (DL-3)": creation is a dialog on IA-13. (D-06.) Re-checked. | No `/new` route. "Create group" stays a DL-3 dialog. | Phase 2 | CONFIRMED |
| HB-11 | `screens.json` VE-13: type "tab", `?tab=history`, "Record tab + filter" | B5-06 draws "Submission and version history" as the last **section**, with no tablist. (D-07.) Re-checked (`screens.json`). | A `#history` anchor on VE-07. No tab UI is invented. | Phase 5 | CONFIRMED |
| HB-12 | Route strings in `screens.json` (proposals; START-HERE known exception 5) | <br>• 19 `proposedRoute` values are not literal routes (D-19) <br>• SA-15 packs two routes, and its abbreviated `/courses/[courseId]` would collide with PU-05 `/courses/[courseCode]`, which Next.js refuses (D-10) <br>• SA-16 uses "\|" (D-11) <br>• FA-15 and CM-06/07/08 use multi-values or "→" (D-26) <br>• FA-07 and IA-05 use ellipsis steps (D-18) <br>• VE-04…06 need a pre-save `/new?step=`, and the VE-08 revise route has no step (D-08, D-09) <br>• 18 intermediate paths have no screen (26 in the route plan) (D-20) <br>• Tabs are modelled two ways, with IA-02 and IA-17 typed "page" (D-21) <br>• The sidebar's current item cannot be derived from the URL prefix (D-22) <br>• Static and dynamic sibling segments collide (D-23) <br>• FA-21 has no experiment context (D-16) <br>• IA-10 is one route for two forms (D-17) <br>• SUB → EXP identity changes along the pipeline (D-24) <br>Re-checked: SA-15 and SA-16 strings. | Accept the route map in `wf/final/routes.md` §3. Under START-HERE known exception 5 this is the implementer's choice, so the owner only acknowledges. | Phases 0–6 | CONFIRMED |
| HB-13 | PU-05 `/courses/[courseCode]` | B1-03 f6 "Course without a platform code" (T-17). Codes contain a space ("ME ZG523"). (D-13.) Re-checked (`screens.json`). | `/courses/[courseId]`; the code is display data only. | Phase 1 | CONFIRMED |
| HB-14 | PU-10 `/requests/[requestId]`, navigation "link from confirmation / e-mail: OPEN"; T-01 "Reference-number link" | B1-07: "Reference REQ-0042 identifies the request; it is never presented as a key to the request’s details". B1-08: "The reference number identifies the request — it does not open the page on its own." (HD-7; D-14.) Re-checked. | Use an opaque id with a session gate. The access decision is P1-02. | Phase 1 | CONFIRMED |
| HB-15 | XS-03 typed "page" `/signed-out`; XS-04 "Link on Sign in" | B1-09 f9 "Session expired" and f10 "Signed out" are notices on the Sign in card. XS-04 is drawn as a disclosure button. The B1-09 caption still carries the legacy id "GL-02". (HD-6; D-15.) Re-checked (`screens.json`). | `/sign-in?reason=…`, with `/signed-out` redirecting to it. | Phase 1 | CONFIRMED |
| HB-16 | XS-06 `/[workspace]/not-allowed` and XS-07 `/[workspace]/help` (a dynamic root segment) | Board 08 XS-06 is rendered in place, in the person's own shell ("This address belongs to a different workspace"). Help hangs off a static base per workspace. (D-12.) | Static `help/` folders, and XS-06 rendered by the guard. | Phase 0 | CONFIRMED |
| HB-17 | CM-07 "Edit a delivery link (with reason)"; inventory "Remove from the draft (with reason)" | B6-08 "Edit delivery link" only opens or joins the correction draft. The only reason field is the draft-level "What changes and why" (B6-09), and no "Remove" control is drawn. (D-26; schemas §7 D-19.) Re-checked (`screens.json` text). | Build as drawn. | Phase 6 | CONFIRMED |
| HB-18 | FA-17 "Import questions (CSV / XLSX)" | B4-08: CSV only ("XLSX and the final column schema are open (T-24 · D5)"). (`surface-faculty.json#inconsistencies[3]`.) | CSV only. | Phase 4 | CONFIRMED |
| HB-19 | Omissions in `navigation.json` and B8-01 | <br>• The rail mode at 1024–1279 (B2-14, boards 05/11) is missing from the "below 1024 → Menu" rule <br>• The default tabs behind the sidebar items "Content" (Updates, B7-05) and "Operations" (Device transfers, B7-09) are not recorded <br>• "Help (foot)" is drawn with the label "Help" | Build as drawn. | Phases 0, 6 | CONFIRMED |
| HB-20 | B8-03 row "Sign in looks like a product, not a test tool": "The developer switcher stays outside the product (Inventory C.2 “DEV”)" | The owner binding instruction (9 Oct) says: no developer-only account selector. The owner's authority (rank 1) outranks the boards (rank 2). (V-14.) Re-checked. | No switcher anywhere. `repo-baseline.json` ownerDecisions[5] is withdrawn. | Phase 0 | CONFIRMED |
| HB-21 | B8-06 "Mock services": "Real auth, payment, XR runtimes, grading automation and persistence stay out until decided" | BC10 and `handoff/README` say "backend persistence". (HD-13.) Re-checked. | BC10 governs what is excluded. Browser persistence becomes owner decision P0-02. | Phase 0 / 1 | CONFIRMED |
| HB-22 | Annotations left stale by the Batch-8 fixes | <br>• The B7-06 annotation still lists the old SUB words; B8-02 corrected the chips <br>• B2-12, B3-01, B3-06, B3-00 and B4-11 notes say links "open the register" or "will be re-pointed in Batch 8" <br>• B1-14 says logos are labelled "approved asset", while every board reads "placeholder" | Chips, links and frames win; annotations are not product (known exception 4). | — | CONFIRMED |
| HB-23 | Phase lists on B8-06 | The build-order lists leave out boards that `screens.json` registers (B2-13; B6-11…13; B7-10…12). Phase 0 lists only 01–08 and 10, not 09a, 09b, 11 or 12. RV-04/B6-04 appear in Phases 5 and 6, and SA-18/19 in Phases 3 and 6. | Build shared items once and re-verify them in the later phase. Read 09a/09b/11/12 as Phase-0 rules (`decisions-rules.json#phaseBoards`). | Phase 0 | CONFIRMED |
| HB-24 | Package documentation (`handoff-consistency.json` check 12) | <br>• The START-HERE path note is wrong for `derived/` and HANDOFF-AUDIT <br>• FREEZE-RECORD's "Details: verification/" has no link-crawl output <br>• "Three CSV-template data: links" — there are 2 distinct templates <br>• FREEZE-RECORD's open-decisions path is wrong <br>• `handoff/README` leaves out `Main.dc.html` and B5-08 <br>• "111 of 123 named in a frame caption" holds only when caption notes are counted <br>• The `files.json` coverage wording is off | No product effect. | — | CONFIRMED |

### B.2 Board-versus-board contradictions (no "board wins" rule applies; the owner picks)

These boards contradict each other. Each one has an interim and an owner question in Section D.

| Contradiction | Boards | Decided in |
|---|---|---|
| Who reopens a support report | 07: "resolving and reopening are Super Admin actions" vs B7-09: "Reopened by the reporter" ×7 (re-checked) | P0-30 |
| Whether an Institute Admin sees problem reports from their institution | B2-01 f7 (SUP-0213, a Student's report) vs 07: "The Help landing is the person’s own reports" | P2-11 |
| Institute Admin signed in before activation | B2-01 f1, B2-02 f6, B2-05 f17 vs OD-B7-11 | P1-08 |
| Vendor course scope held by the organisation or the person | B5-03: "Only the courses assigned to Northline Simulation Studio are listed" (re-checked) vs B7-08 (person) | P5-02 |
| Assessment with no questions | B4-05: "Students can’t see the assessment until it has a question" vs B4-11 f15: "Not available yet · no questions" | P4-02 |
| Withdraw reason visibility | B6-09 withdraw dialog: "The Academic Reviewer sees your reason" vs RV-04, which shows no reason | P6-03 |
| "Change on the group" leads to no control | B2-04 "Change on the group" (13 text occurrences, re-checked), linking to B2-08, whose group-grant table has no action column | P2-05 |
| Platform-code uniqueness | B6-10 annotation "case and spaces ignored" vs its script (trim + uppercase only) | P5-07 |
| Earlier work after access ends or is withdrawn | B2-11 f7/f8, B2-12 f4/f6, B2-13 f3, B3-02 f6, B3-05 | P2-06 |
| A link's label and href disagree | IA-01 device row: href IA-17 vs annotation IA-18. XS-01 "Back to experiments": href `/` vs catalogue | P1-17, P3-07 |
| Access term "Until a fixed date" | B1-07 request form vs the B1-11 decision term select | P1-10 |
| Status wording while paused, and "student inactive" | IA-03 "Paused" vs IA-04 keeping the grant's own word; "student inactive" is worded four ways (B2-04/05/06/08) | P2-09 |
| Changing the release option after a submission | B4-06 save message "keeps version 1" vs the warning "he sees his result on the new terms" | P4-06 |
| Component rules vs product boards | Board 10, board 03 and B8-07 rules vs product boards: V-1…V-6 and V-13 (destructive focus, Cancel style, `role="menu"`, unlinked error summaries, sticky vs static panel, tabs as links, ErrorSummary class); B8-07 "field + summary" vs Batch-7 dialogs with field errors only; board 10 "DL-3 two fields at most" vs the B7-07/B7-08 dialogs | P0-11 … P0-27, P6-05 |
| Static header counts vs frame state; sample counts | B4-05/B4-06 headers; S-8 | P1-12 (sample only) |

---

## C. Stakeholder records versus v46

**Rule (owner).** Business behaviour follows stakeholder-confirmed requirements. Where a record conflicts with v46, the build follows v46, which is the board authority approved by the owner, and the conflict is flagged here. It is not resolved by the audit.

All 24 rows of `wf/understand/decisions-rules.json#conflicts` follow (SC-01…SC-24, in register order), then 8 stakeholder differences that the final deliverables found outside that register (SC-25…SC-32). The "Kind" column says whether a decision is needed.

| Id | Topic | Stakeholder record says | v46 draws | Recommended handling (recommendation) | Needed by | Kind · Status |
|---|---|---|---|---|---|---|
| SC-01 | 15-day expiry reminder | STK31-28 (CONFIRMED): "We will send reminders to Tenants 15 days ahead". It is a required capability: "An in-product attention state does not discharge it". The channel is pending (ND-16). | T-31: a "Reminder due" state, and nothing is sent (B7-09 "Access ending"; "Not here: any notification channel"). T-34 is WAIT. | Build the v46 "Ending soon" / "Reminder due" states exactly. The mock exposes a reminder-due fact and sends nothing. Record this as an unmet production requirement; the owner chooses channel and recipient (ND-16 / A-05 / D19). | Phase 6 build; decision before production | Stakeholder ↔ v46 — decision needed · UNRESOLVED (AD-30; ACC-07) |
| SC-02 | Who writes the platform course code | 07.2-E: "Content Manager primarily. Super Admin will also get access to it." STK31-09; `1b090c9` OPEN_DECISIONS A-07. | M-2: the Content Manager is the single writer (B6-10). The Super Admin sees it read-only in Academic structure: "only a future policy could change that" (B7-07). | Build per v46. Keep the writer set as policy data. Ask whether "access" meant read access. | Phase 5 (CM-09) · Phase 6 (SA-14/15) | Decision needed · UNRESOLVED (AD-33; CC-07; REG-SA-COURSE-CODE) |
| SC-03 | Super Admin "ultimate superpower" over content | 07.2-F: overall control; 07.3 R17: "He should be given the ultimate superpower"; STK31-09: SA may manage canonical metadata. | M-1: the SA never edits a published record. The override applies only to stuck, non-published records and only "back to the vendor" (B7-06; B7-10 f6; OD-B7-09). | Build per v46. Shared invariant: Published is never an override origin or target, and every override is recorded with a reason. Ask whether more override targets (SUB-35) or SA metadata correction (EXP-07) are wanted. | Phase 6 | Decision needed · UNRESOLVED (AD-32) |
| SC-04 | Content Manager edits a delivery link directly | 07.3 R16: the CM may "edit the link … replace it". In the prototype the edit took effect immediately, with a reason. | M-1: "Edit delivery link" opens a correction draft → Academic Reviewer → SA Release. No safe edit (D-09-6 open). | Build per v46. Flag that a broken link cannot be fixed without review and release while REG-D-09-6 / D-09-9 (technical-only skip) are open. | Phase 6 | Decision needed · UNRESOLVED (AD-31; EXP-06) |
| SC-05 | Sequential gating | PM-09: Resources → Simulation → Assessment → Completion; D-07, D-08, D-19 and D-20 retained. | T-16: "No locks; default order". B3-02: "Never shown: … locks or a required order". BC4: no aggregate verdict. | BC4 and v46 govern. Record that PM-09 gating is not implemented. T-16 / R22 stays open for the owner and PM. | Phase 3 | Decision needed · UNRESOLVED (AD-34) |
| SC-06 | Assessment timer | PM-08: the timer remains a capability "the configuration model must support". | T-22: no timer. B4-04/B4-06 "Not designed: Timer"; B4-12 has no countdown. | Build per v46. The data model must not rule out a per-assessment limit later. | Phase 4 | Decision needed · UNRESOLVED (AD-35; ASMT-09) |
| SC-07 | Top grouping level | STK31-12: one grouping level (Programme / Department / Academic stream); label pending (ND-02). | BC2: Programme is held on the Student record only. Engineering area is the catalogue grouping (B7-07). | The owner constraint governs; acknowledge. Keep the label swappable (T-35). | Phase 1 | Owner constraint governs — acknowledge · CONFIRMED |
| SC-08 | Student CSV columns | STK31-26: Programme, Course Name, Course ID/Code, Student ID, Name and Email accepted; Semester OPTIONAL; Organisation OPTIONAL; Plan Terms "if possible". | B2-07: exactly six required columns. The semester sits on the Institute Admin course-code record (B2-03). | Build the template and validation exactly as drawn. The mock tolerates absent optional fields but shows no undrawn column. The owner decides the optional columns and ND-03 before production. | Phase 2 | Decision needed · UNRESOLVED (AD-36; PER-02) |
| SC-09 | Sources for AI question drafting | STK31-33: "Upload source document/material and/or prompt/context". | B4-08 / OD-B4-12: the lab brief or pasted text; 3 or 5 drafts; no upload. | Build per v46 (mandatory review matches). Flag the missing upload. | Phase 4 | Decision needed · UNRESOLVED (AD-41; Q-04) |
| SC-10 | Faculty "time spent"; technology actually used | STK31-29 / STK31-43: time spent and usage indicators. 07.3 R07: the technology used, known at marking. | Per-format progress and counts only (B4-02, B4-03, B4-10; OD-B3-07 "no step names or durations"). | Build per v46. Record both as not shown; decide before production (OD-B3-07 / OD-B3-08). | Phase 4 (and Phase 3 Usage) | Decision needed · UNRESOLVED (AD-42; RUN-15) |
| SC-11 | Super Admin creates, allocates and terminates tenants | STK31-21: the SA creates and governs tenants and can terminate them. STK31-24: the SA controls courses, experiments and technologies. STK31-40. STK31-22 prefers reversible deactivation. | Institutions are created only by approving a request (T-09; SA-08 not designed). Allocation happens at approval; there is no amendment (T-08). Pause / Restore exists; "Access ended" comes only from the term. | Build per v46. The owner confirms whether direct creation, amendment or termination is required (T-08 / T-09 WAIT). | Phase 1 (approval) · Phase 6 (institution pages) | Decision needed · UNRESOLVED (AD-37; INST-02, INST-10, ACC-03) |
| SC-12 | Institute Admin SSO and institution set-up | STK31-25 lists them among Tenant Admin duties; PM-10 notes FRD 4.2.2. | IA-22 not designed (DEFER, A-01). B7-08: "Not here: no SSO set-up". | Not built in the frontend. Record as a production gap tied to A-01 / T-10. | Production | Decision needed · UNRESOLVED (AD-44; INST-16) |
| SC-13 | Re-requesting an experiment the institution already holds | 07.2-A: "It should show the existing plan when they reselect"; request additional licences. | B1-05 "Not shown": this needs a recognised institution (T-01 / R01). The Institute Admin asks for more licences from Requests (B3-08). | Build per v46. The public behaviour waits on T-01. | Phase 1 | Decision needed · UNRESOLVED (AD-43; SEL-05) |
| SC-14 | Device-transfer routing | STK31-38 (31 Aug): the Student requests and the SA approves. 07.2-C (6 Sep, later): the Tenant Admin is the point of contact, and final approval stays with the SA. | Student → Institute Admin (forward only) → Super Admin (approve only) (B3-07, B3-09, B3-11). | No change: v46 follows the later 07.2-C. Acknowledge that STK31-38 is superseded on this point. | Phase 3 | Superseded — acknowledge · CONFIRMED (AD-45; DTR-13) |
| SC-15 | Access-term lifecycle labels | STK31-28: "Active · Expiring soon · Expired · Renewed". | "Access active · Ending soon · Access paused · Access ended", plus "Renewal in progress" and "Reminder due". | Use the v46 words. "Renewed" is not a status: a renewal extends the existing record after payment (07.2-D). | Phases 2, 6 | Wording — acknowledge · CONFIRMED |
| SC-16 | Wording of the result-release options | STK31-32: "Show immediately · after deadline · on custom date". The BITS default follows Taxila, pending (ND-10). | "Immediately after marking · After the deadline · On a date"; nothing pre-selected (T-19). | Aligned in substance. Use the v46 wording; the BITS default stays pending. | Phase 4 | Aligned — acknowledge · CONFIRMED |
| SC-17 | Auto-review of written answers | STK31-31: Faculty may optionally use AUTO REVIEW, and an AI score is never final. | T-23: no marking suggestion. B4-09: "Not designed: Suggested marks from an assistant". | Consistent with BC10 (no grading automation). ND-09 stays pending. | Phase 4 | Aligned — acknowledge · CONFIRMED (ATT-11) |
| SC-18 | Super Admin return at the first-publication gate | QP-26 / ND-13 is OPEN (PM update of 25 Aug; STK31-07). | No SA return at the gate. The override moves a record stuck with the Reviewer back to the vendor only. | No conflict: do not add a return. Keep QP-26 on the owner list. | Phases 5, 6 | Open item — no conflict · PROVISIONAL (SUB-36) |
| SC-19 | Timing of licence counting (D7) and other "Blocks" | Inventory v3 §T (the design brief, not a stakeholder record): T-06 "Answer before the Phase 2 build"; T-12 blocks Phase 3; T-18 blocks Phase 4; T-10, T-35 and T-36 are Phase-0 "Needs decided first". | `open-decisions.json` `frontendBuildBlockers` = 0: "every open item has a designed safe treatment" (B8-08). The owner approved v46 subject to the open decisions. | Follow v46: Phases 2–4 build on the drawn safe treatments. Treat T-06, T-12 and T-18 as production blockers and owner questions (P2-01, P3-01, P4-02). | Phases 2, 3, 4 | Design brief ↔ v46 — confirm · PROVISIONAL |
| SC-20 | Phase allocation | Inventory §U: sign-in XS-01/03/05–08 and "DEV" in Phase 0; IA-01/02/03 in Phase 1; IA-18/19/20 in Phase 3. | B8-06: Phase 0 is the Batch-0 boards; XS-01/03 are Phase 1; IA-01…16 Phase 2; IA-17…20 Phase 3. | B8-06 governs. Exclude ids that are not designed. The "DEV" switcher is superseded by the owner constraint (HB-20). Pulling sign-in into Phase 0 is the explicit owner decision A7. | Phase 0 | Design brief ↔ v46 — confirm · PROVISIONAL |
| SC-21 | Status vocabularies | — | `entities.json` uses one perspective; the boards use role-relative labels. | See HB-03. | Phase 0 onwards | Handoff-internal · CONFIRMED |
| SC-22 | Who writes RUN | BC3: Completed is set by the system. | `entities.json` RUN ownerWriter "Student". | See HB-05. | Phase 3 | Handoff-internal · CONFIRMED |
| SC-23 | "Waiting for a licence" with no counting rule | — | T-06 says never explain counting, yet B2-04, B2-05 f11 and B3-10 show "Waiting for a licence". | Seed it as a provided state and never compute it (P2-01). | Phase 2 | v46-internal · UNRESOLVED |
| SC-24 | Register v2 §T items missing from `open-decisions.json` | Register v2 §T: D-09-6, 07.2-F, SA editing of course codes, VE-08 next gate, XS-02, VE-10/11/12/14. | `registerT` holds 35 items. | Carried as REG-* (6) in Section E. | — | Handoff-internal · CONFIRMED |
| SC-25 | Institute Admin visibility of individual students | STK31-25: Tenant Admin "reporting and visibility over assigned students and content". 07.3 R06: "he should have that overview". | IA Usage shows counts per experiment × format only (B3-10). PER-16 denies the Institute Admin per-student progress (A-12 / D18). | Build per v46 pending the owner. | Phase 3 | Decision needed · UNRESOLVED (PER-16) |
| SC-26 | Super Admin institution report by stream | STK31-42: "number and names of streams", "students/users by stream where available". | SA-07 reports per experiment × format (B7-03). Programme lives only on the Student record (BC2). | Build per v46 pending the owner. | Phase 1 (SA-07 is in B8-06 Phase 1) | Decision needed · UNRESOLVED (RUN-14) |
| SC-27 | Correct answers shown after release | STK31-32: "D-25 — a learner never sees the answer key — is NOT overridden". | ST-14 shows the correct answer and explanation after release (B4-13). OD-B4-09 reads D-25 as applying during the attempt. | Build per v46. Confirm that showing answers after release is approved. | Phase 4 | Possible conflict — confirm · UNRESOLVED (ATT-16) |
| SC-28 | Vendor "version submissions" | STK31-08 lists "version submissions" among what the Vendor owns. | LD-4 defers updates that start with the Vendor (VE-10/11/12/14 not designed). | Build per v46. Confirm what "version submissions" covers. | Phases 5, 6 | Possible conflict — confirm · UNRESOLVED (EXP-08, UPD-12) |
| SC-29 | Problem categories in Help | STK31-39: report "Experiment not opening · package/link issue · login issue · access issue · device issue · other technical issue". | Board 07 "Report a problem": "Fields: what happened, where …, optional screenshot. Nothing else." No category field. | Build per board 07. The owner decides whether a category field is needed (it would need a new canvas version). | Phase 0 (non-blocking) | Decision needed · UNRESOLVED |
| SC-30 | Campus categorisation | STK31-23 (CONFIRMED): "A campus/unit may be its own Tenant"; no sub-tenant level; "High-level categorisation may include On-campus and Off-campus". | Institutions with an internal / external classification only. "BITS Pilani — Hyderabad Campus" is an institution. | No Campus entity. On- and Off-campus are not modelled until the owner asks for them (P1-13). | Phase 1 | Acknowledge plus a later decision · PROVISIONAL |
| SC-31 | Plan context "Subscription" / "BITS Community" | STK31-19: the plan or access context "may distinguish: Subscription and BITS Community". | No plan-context field on the SA boards. The internal / external rule is T-04 / ND-07. | Build per v46. Decide before production together with ND-07. | Phase 1 | Decision needed · UNRESOLVED |
| SC-32 | "Cart" wording | STK31-18: an "ecommerce-style selection / cart experience" that grants no checkout or access. | B1-06 "Your selection"; v46 never says "cart" or "basket" (BR-030). | The substance is aligned. Use the v46 wording. | Phase 1 | Wording — acknowledge · CONFIRMED |

Count: 32 rows. Of these, 18 need a decision: SC-01…06, 08…13, 25…29 and 31. Three ask the owner to confirm the v46 position (SC-18, SC-19, SC-20). Six only need acknowledgement (SC-07, 14, 15, 16, 17, 32). One is an acknowledgement plus a later decision (SC-30). Four are handoff-internal or v46-internal (SC-21…24) and are handled in B or D.

---

## D. Needed before later phases

Each table lists what the owner should answer before the named phase's build or review. Every row has a buildable interim. **None blocks starting Phase 0** (Section A covers those).

### D.0 Places where this audit's own deliverables differ (the owner picks one interim)

DV-5…DV-8 were added at assembly. DV-1 and DV-2 were revised so that the plan (Appendix F §10.2) and this register state the same Phase-0 interim.

| Id | Topic | Positions in the deliverables | Recommended interim (recommendation) | Decided in |
|---|---|---|---|---|
| DV-1 | Overlapping grants | <br>• architecture AD-18: "any active grant gives access" <br>• permissions SACC-15 (UNRESOLVED): "show each grant's own state only; keep overlap students out of seeded Student journeys; the shared store must not compute can-open" <br>• schemas: `OverlapGrantPolicy` "no default in the contract" | One interim, used in Phase 0 and in this register. A single active grant opens the experiment. The overlap case (a withdrawn individual grant plus an active group grant for the same experiment) returns `policy-open`, shows each grant's own state, and has no copy explaining the overlap. Overlap cases stay out of seeded Student journeys and out of the Phase-0 flow suites. AD-18's broader wording is not adopted, because SACC-15 forbids computing can-open for this case | P2-02 |
| DV-2 | Automatic marking of choice questions | <br>• architecture AD-38: deterministic answer-key scoring, as drawn <br>• permissions ATT-07: seeded objective marks, "no scoring engine" <br>• schemas M22: computed, scope [U] | Fixture-supplied marks per (question, option), applied by the system stand-in. This also covers the live ATT-0450 in the Phase-0 walk. There is no scoring function in `@xr/domain`. Switch to deterministic answer-key scoring only after the owner confirms | P4-01 |
| DV-3 | Sample sign-in credential | <br>• architecture AD-03: any non-empty password <br>• schemas §4.1: a sample-credentials fixture per person | Any non-empty password. No credential values appear in product copy or chat | P1-01 |
| DV-4 | WEB runtime stand-in page | <br>• architecture TE-3: a fenced `(sample-runtime)/runtime/web` route, opened by "Launch WEB", that emits only launch and session events <br>• schemas §8-5: "Developer surface — default NONE"; `RuntimeReportPort` is test and seed only | The owner decides whether "Launch WEB" opens anything in hosted builds. Recommended: the TE-3 page with neutral content and **no** completion control | P3-01 |
| DV-5 | PU-10 / PU-12 URL and gate (plan X-5) | <br>• routes O-05: `/requests/[requestId]` with an opaque id, open to the sending browser session and to the signed-in Institute Admin of the requesting institution (B3-08) <br>• architecture AD-13: capability-free `/requests/status`, ticket in `sessionStorage` | Routes O-05. It keeps the proposed route, admits the Institute Admin path drawn on B3-08, and never treats the reference as a key | P1-02 |
| DV-6 | Hosted seed default (plan X-6) | <br>• architecture §3.3: "spine-start" seed + scripted walk <br>• schemas §4.1: "state coverage" seed | Spine-start for hosted builds; both builders exist | P1-12 (before the Phase-1 review) |
| DV-7 | Rail expand / collapse preference (plan X-10) | <br>• visual VD-20: per-viewer browser preference ("Approve") <br>• architecture R5: nothing in browser storage except the selection basket and the request ticket | Memory per tab until VD-20 is approved. Approving VD-20 also means accepting an exception to R5 | P0-24 |
| DV-8 | Designed motion and forced colours (VD-09, VD-15) | <br>• visual §13: build both in Phase 0 <br>• plan §3.4: not built | Defer both. The reduced-motion guard already in the v46 CSS stays | P0-16, P0-21 |

### D.1 Phase 0 — answer during Phase 0 (does not block starting)

| Ref | Question | Why it matters | Recommended default (recommendation) | Needed by | Status |
|---|---|---|---|---|---|
| P0-01 | Add a git remote? What is the PR base, and when does the foundation land on `main`? (repo-baseline ownerDecisions[2]) | There is no remote (re-checked), so no backup exists and no PR is possible. `main` (`e8c6a84`) has no `v2/`. | Add a private remote and push `v2/platform-foundation` and the new branch before the first PR. PR base: `v2/platform-foundation`. Landing on `main` is a separate decision. | First PR / Phase-0 review | UNRESOLVED |
| P0-02 | May the one sample world persist in browser storage? (AD-07; schemas §8-26; repo-baseline ownerDecisions[7]; HB-21) | Option A (memory, one world per tab) resets on reload, so reviewers lose their walk. Option B (a versioned `localStorage` snapshot with BroadcastChannel and Web Locks; TE-6) keeps it, but B8-06 "persistence stay out until decided" and FPM §G exclude it unless the owner authorises it. | Build option A now, behind the pluggable driver. Authorise option B before hosted reviewer walk-throughs of cross-role flows. | Phase-1 review | UNRESOLVED |
| P0-03 | Amend the committed repository documents to record v46 and BC1–BC14 as superseding inputs (repo-baseline ownerDecisions[14], [15]) | The documents would otherwise contradict the work: <br>• MIGRATION_STRATEGY has workspaces "on the API" after Phase 3, Phase 1 "Tailwind v4", D3 "one licence per active student per access record" (vs T-06) and D4 "conservative overall state" (vs BC4) (re-checked) <br>• FUNCTIONAL_PARITY_MATRIX: 26 of 36 rows conflict (P-15, P-19, P-18/21, P-23; the §G exclusions vs TE-3, TE-4, TE-6) <br>• OPEN_DECISIONS A-07, A-08, A-14, A-20, E-19 <br>• ARCH §8 "progress … derived" (AD-39) <br>• the "AcademicGrouping" wording <br>• the phase-number clash (repo Phase 0 vs v46 Phase 0) | One documentation commit in Phase 0 that records the supersession and resolves no open row silently. | Before Phase-1 workspace screens | PROVISIONAL |
| P0-04 | Is the committed `branding/bits-pilani-wilp-logo.png` the approved lockup? (VD-03; R-17) | `1b090c9:ui-ux/00-project-context/PROJECT_CONTEXT.md` lists it under "Protected assets" and D-12 calls it "Logo is the only confirmed brand asset" (re-checked). But BC12, `assets.json` and board 13 Q1 treat the logo as unapproved. | Keep "BITS Pilani / WILP logo — placeholder". Do not import the PNG. | Production | UNRESOLVED |
| P0-05 | Public Sans delivery: self-host or the Google Fonts link? (VD-02; repo-baseline ownerDecisions[13]; R-19) | `next/font` renames the family. A runtime Google link adds a third party. Self-hosting needs approval to download the OFL files. | Self-host via `@font-face 'Public Sans'`. Until the download is approved, use the Google Fonts link exactly as the boards do (START-HERE known exception 7). | During Phase 0 | UNRESOLVED |
| P0-06 | Keep the committed role id `tenant_admin`? (AD-25; A-20; schemas §8-2) | `roles.ts` labels it "Institute Admin / Tenant Admin"; v46 says "Institute Admin" (BC1, B8-03). | Keep the internal id and display "Institute Admin" through copy. Keep `ROLE_PLANNING_LABEL` out of every copy path. Record A-20 as answered. | During Phase 0 | PROVISIONAL |
| P0-07 | Format order: committed `web · vr · mr · ar` vs v46 WEB · AR · VR · MR (schemas §8-3) | Format chips and legends are Phase-0 components (B8-03 "Formats WEB · AR · VR · MR"). | Add a presentation order beside the canonical one, and replace `TECHNOLOGY_META` with `FORMAT_META`. An ADR is needed only if the canonical order changes. | During Phase 0 | PROVISIONAL |
| P0-08 | Visual-regression runner, and approval to fetch the vendored React 18.3.1, ReactDOM 18.3.1, Babel 7.29.0 and Public Sans for board capture (VD-18; R-18) | There is no remote, no CI and no container runtime. Board capture needs these files, checked against the `support.js` SRI hashes. | Capture board and product in the same run on the same machine until a runner exists. Use the pinned Playwright 1.63.0 image later. Approve written tolerances. | Phase-0 exit | UNRESOLVED |
| P0-09 | Add pinned devDependencies `@axe-core/playwright` and a Vitest axe adapter? (VD-17) | Automated WCAG checks on the components. Adding them needs a package download. | Approve. | Phase-0 exit | PROVISIONAL |
| P0-10 | One role per signed-in person (REG-XS-02; QP-11; XS-02 not designed) | This shapes the session model and the guards. | Phase 0 assumes one role per person, with no workspace chooser (`decisions-rules.json#phase0Notes`). | During Phase 0 | PROVISIONAL |
| P0-11 | B1-10 fix design and baseline deviation (VD-04; BC13; START-HERE known exception 1) | DataTable is a Phase-0 component. The sort button's accessible name also repeats the word "Received" (`surface-super-admin.json#inconsistencies[16]`). | A visible sort control: "Received, newest first / oldest first" plus "Change order", with a de-duplicated name, and the hidden header controls taken out of the tab order. Approve it as an expected deviation on B1-10. | During Phase 0 | PROVISIONAL |
| P0-12 | Decision panel: sticky on B1–B4, static on B6/B7, or static everywhere as B8-03 says? (VD-05) | Class scan: 69 sticky and 71 static. | Follow each board as drawn. Phase 0 builds DecisionLayout with both variants. | First DecisionLayout screen (SA-03, Phase 1) | UNRESOLVED |
| P0-13 | Dialog Cancel style: `xr-btn--secondary` (397 + 12 + 47 instances on 44 product boards) or `--text` (board 10)? (VD-06) | Every dialog depends on it. | Secondary. | During Phase 0 | UNRESOLVED |
| P0-14 | Destructive DL-1 initial focus on Cancel (board 10) rather than on the danger button as the B2-08, B2-09/B2-14 and B4-07 scripts do? (VD-07) | Accessibility of destructive actions. | Follow board 10 (Cancel first). | During Phase 0 | PROVISIONAL |
| P0-15 | Mapping of dialog alignment to viewport-fixed dialogs (VD-08) | The canvas classes `xw-dlg-top`, `xa-dlg-*` and `xg-dlg` are frame-relative. | The PF-04 mapping: start for header actions, centre by default, end at form end, bottom sheet below 600 px of app width. | During Phase 0 | PROVISIONAL |
| P0-16 | Build the designed motion (drawer 280 ms, dialog 280 ms, menu 200 ms; boards 02/12)? No stylesheet contains it. (VD-09; R-11; DV-8) | Fidelity versus scope. | Defer (DV-8). If the owner wants motion, build it later behind the existing reduced-motion guard. | During Phase 0 | UNRESOLVED |
| P0-17 | Gold focus ring on the navy sidebar and drawer as a build correction (VD-11) | The ring is #1F4FD8 on #141B5E = 2.35:1, below 3:1 (contrast computed in the `wf/final/visual.md` spot-checks). | Approve PF-07. | During Phase 0 | PROVISIONAL |
| P0-18 | States that are not drawn (loading, failed, empty, not-found) for many screens (VD-12) | Gaps noted in `surface-institute-admin.json#openQuestions[23]`, `surface-super-admin.json#openQuestions[31]`, `surface-vendor.json#openQuestions[21]` and `surface-reviewer-cm.json#openQuestions[20]`. | Use the board-04/08 grammar plus a per-screen state-copy register for sign-off. | During Phase 0 | PROVISIONAL |
| P0-19 | Account menu as a disclosure (boards 05/12) rather than B3-07's `role="menu"` (VD-13) | Keyboard and screen-reader behaviour. | Disclosure with `aria-controls`. | During Phase 0 | PROVISIONAL |
| P0-20 | Hub tabs stay links; status tablists gain a `tabpanel` (VD-14) | Board 03 says tablist, but B2-12 and B3-01 draw links. | Keep links; add `tabpanel` and `aria-controls`. | During Phase 0 | PROVISIONAL |
| P0-21 | Forced-colors (Windows High Contrast) support (VD-15; DV-8) | Not designed. Current-item indicators disappear in that mode. | Defer (DV-8). A minimal outline rule can be added later without changing any v46 rule. | During Phase 0 | UNRESOLVED |
| P0-22 | Skip link on the public and focused-task shells (VD-16) | It is drawn only on boards 05 and 12. | Add it. | During Phase 0 | PROVISIONAL |
| P0-23 | Load all 8 sheets globally and accept the global-override effects (VD-19) | This changes boards that loaded fewer sheets (R-16). | Accept. | During Phase 0 | PROVISIONAL |
| P0-24 | Rail expand / collapse "remembered per person" (board 13 Q7) stored as a per-viewer browser preference (VD-20; DV-7) | This is a UI preference, not a business record, but architecture R5 writes nothing to browser storage except the selection basket and the request ticket. | Keep it in memory per tab until approved. Approving the browser preference also means accepting an exception to R5. | During Phase 0 | UNRESOLVED |
| P0-25 | ErrorSummary always links each item and takes focus; normalise the 30 plain-text instances on B2-05, B2-07, B2-14 and B3-08 (VD-21) | Board 12: "Summary links move focus to the field". | Approve. Keep the 47 B5 missing-item summaries as drawn. | During Phase 0 | PROVISIONAL |
| P0-26 | Class emitted by ErrorSummary: `xw-errsum` (192 product instances) or `xr-notice--err` (boards 03, 09b) (VD-22) | The component baseline depends on it. | `xw-errsum`, with the baseline taken from a linked product instance. | During Phase 0 | UNRESOLVED |
| P0-27 | Public root deltas PF-06 (`overflow: clip`) and PF-02 (viewport min-height) (VD-23) | They let `.xp-filters` and `.xp-sumcard` stick as their CSS intends. | Accept both. | During Phase 0 | PROVISIONAL |
| P0-28 | Supported-browser policy (R-24: 10 `:has()` rules and container queries) | It defines the test matrix. Only Chromium is in the local Playwright cache. | Declare Chromium 105+, Safari 16+ and Firefox 121+. Phase 0 proves Chromium only and records that; the policy is verified when a runner exists (VD-18), or earlier if the WebKit/Firefox downloads are approved under A6. | During Phase 0 | PROVISIONAL |
| P0-29 | Where the "marked as sample" flag (T-36) lives, given there is no DEMO banner (schemas §8-10) | It must not reach product chrome. | In data only: seed metadata and `seedNote`. | During Phase 0 | PROVISIONAL |
| P0-30 | Who reopens a support report? (SUP-04; HD-12; AD-26; board 07 vs B7-09) | Board 07 is in Phase 0 and B7-09 in Phase 6. The two boards contradict each other (B.2). | The reporter gets no Reopen control (board 07). The Super Admin's Reopen is built as drawn on B7-09. Keep the label "Reopened by the reporter" only if the owner confirms that a reporter path exists; otherwise this needs a new canvas version. | Phase 0 (reporter side) · Phase 6 | UNRESOLVED |
| P0-31 | Where does the report title shown in "My reports" come from? The form has no title field. (schemas §8-21; `surface-public-entry.json#inconsistencies[10]`) | The Help list is a Phase-0 screen. | Owner decides. Interim: the start of the "What happened" text, marked provisional. | During Phase 0 | UNRESOLVED |
| P0-32 | Help for the Academic Reviewer and Super Admin, which board 07 does not draw | The template rule covers them. | Apply the board-07 template in their shells. | During Phase 0 | PROVISIONAL |
| P0-33 | People who are signed out cannot reach Help (`surface-public-entry.json#openQuestions[21]`) | Help is for "any signed-in person". Sign-in only says "Contact your institution administrator". | Build as drawn. | During Phase 0 | PROVISIONAL |
| P0-34 | Problem category field (SC-29) | See SC-29. | Build per board 07, with no category field. | During Phase 0 | UNRESOLVED |
| P0-35 | Unbuilt destinations during Phase 0 (plan §3.3, ADR-0005; added at assembly) | Every Phase-0 screen carries drawn links into routes that are not built yet, and `/<base>` has no home screen until its phase, so "Back to Home" would loop. | Nav items render only for built screens; unbuilt URLs show the not-found pattern; `/<base>` redirects to `/<base>/help` until the home exists; the public "Browse experiments" is a listed dead link until Phase 1; a link-target ledger is kept. Phase-0 builds are engineering builds, not review builds. | During Phase 0 | PROVISIONAL |

### D.2 Phase 1 — Public + access spine (B1-01…B1-11, B7-02, B7-03)

| Ref | Question | Why it matters | Recommended default (recommendation) | Needed by | Status |
|---|---|---|---|---|---|
| P1-01 | Record TE-1 sample sign-in on XS-01 (AD-03, O-06, AD-29; T-10 / T-11 open; DV-3) | ARCH §10: "none is faked". XS-01 is in Phase 1 (B8-06). | <br>• The real XS-01 form resolves typed sample e-mails to sample people <br>• Any non-empty password <br>• The institution sign-in follows the drawn f0 → f5 → f6 sequence <br>• No activation step <br>• No switcher, chooser or DEMO banner <br>Whether XS-01 is pulled into Phase 0 is decided at A7 (default: Phase 1, per B8-06). The TE-1 session port itself is recorded in A4. | Phase 1 | UNRESOLVED |
| P1-02 | Who may open PU-10 and PU-12, and what does a cold visit see? (AD-13, O-05, T-01, R01, REQ-04, REQ-05; HB-14) | B1-08: "does not open the page on its own". B3-08 draws a signed-in Institute Admin opening both pages. | DV-5, routes O-05: `/requests/[requestId]` with an opaque id (never the reference), rendered only for the browser session that sent the request and for the signed-in Institute Admin of the requesting institution (from IA-17, B3-08). Everyone else (another device, a cold visit) gets the PU-15 not-found pattern. No lookup by reference. Alternative: architecture AD-13's capability-free `/requests/status` with the ticket in `sessionStorage`. | Phase 1 | UNRESOLVED |
| P1-03 | Direct visits that are not drawn (O-08): an empty selection at `/request-access`; a cold `/request-access/sent` | No drawn state exists. | Redirect both to `/selection`. | Phase 1 | PROVISIONAL |
| P1-04 | What moves a request from "Submitted" to "Under review" ("BITS started reviewing", B1-13 timeline)? (AD-14, HD-10, schemas §8-13) | The requester's and the SA's statuses depend on it, and no control is drawn. | Owner decides. Interim: the first time the Super Admin opens the request's decision page (SA-03), recorded as a history event. The Phase-0 port-level walk uses this interim (Appendix F §10.2). | Phase 1 | UNRESOLVED |
| P1-05 | How does a request leave "Information requested"? (T-03, OD-B3-10, PU-11 not designed, REQ-06, REQ-18) | It is a dead end: the requester has no reply field, and the SA has no path back to a decidable state (B1-11 f12). | No reply and no SA action. The request stays in that state in the mock. Keep it out of hosted walk-throughs. | Phase 1 | UNRESOLVED |
| P1-06 | Resolving "Payment not confirmed", and the TE-4 payment stand-in (REQ-22, R06, T-05, SA-05 not designed; AD-06) | No actor exists for that state. | Hosted builds always confirm payment. The "Not confirmed" and "Failed" frames are reached only through fixtures or CI hooks. No SA action. Record TE-4. | Phase 1 | UNRESOLVED |
| P1-07 | Narrowing a request for several experiments (REQ-19; SA-09 merged into SA-03) | The B1-11 script narrows only `R.exps[0]`. | Build only the drawn single-experiment narrowing. | Phase 1 | UNRESOLVED |
| P1-08 | Can an Institute Admin be assigned before activation? (INST-05, OD-B7-11) | B2-01 f1, B2-02 f6 and B2-05 f17 draw IA screens in "Approved — payment required" (B.2). | Follow OD-B7-11: assign only once access is active. Treat the pre-activation IA frames as unreachable, and seed no pre-activation IA session. | Phase 1 | UNRESOLVED |
| P1-09 | Replacing or removing an Institute Admin (INST-06) | Needed operationally, but not designed. | Not offered. | Phase 1 | UNRESOLVED |
| P1-10 | Access term "Until a fixed date" on the public form (B1-07) has no counterpart in the SA decision select (B1-11; BR-040 Monthly · Quarterly · Yearly) (schemas §7 D-18, §8-11) | Board versus board. | Build both screens exactly as drawn, with no mapping logic. The owner decides how the SA approves a date term. | Phase 1 | UNRESOLVED |
| P1-11 | What does approving a renewal or a more-licences request do to the access plan? (OD-B3-09, T-07, T-08, schemas §8-12) | B1-11's internal confirm copy hard-codes the creation of a new plan (`surface-super-admin.json#inconsistencies[26]`). | The mock returns `planEffect: policy-open` and writes no ACC change. Institution status never moves backwards. | Phase 1 (SA-03) · Phase 3 (IA-17) | UNRESOLVED |
| P1-12 | Sample world: one anchor date, and the S-1…S-11 conflicts (AD-08, T-36; OD-B4-16, OD-B6-11, OD-B6-12, OD-B7-06, OD-B7-08, OD-B7-14, OD-B7-15; schemas §4.2) | One store can hold only one answer per record. <br>• S-1 Konark: B1-11 shows ACC-0064, 180 licences, paused; B7-02/B7-03 show ACC-0091, 60 licences, Ending soon <br>• S-2 BITS Hyderabad: ACC-0081 vs ACC-0098 vs the contents of REQ-0039 <br>• S-3 "A. Menon": the REQ-0039 contact vs the Academic Reviewer <br>• S-4 SUP-0213 date <br>• S-5 SUB-0077 published 28 Aug vs a 12-experiment catalogue <br>• S-6 UPD-0005 timing <br>• S-7 reviewer scope history <br>• S-8 ASMT-0009 counts <br>• S-9 deadline after the SA world date <br>• S-10 VR string <br>• S-11 second Vendor | A "spine-start" seed (architecture §3.3) and one anchor date. For S-1 and S-2, seed the Batch-7 institution records, which drive SA-06/07 and the IA pages. Treat S-3 as two people. Confirm Meridian Virtual Labs as sample data. Sample data only. | Phase 1 | UNRESOLVED |
| P1-13 | Campus (STK31-23; schemas §8-1; SC-30) | This shapes the institution model. | No Campus entity: each campus or unit is its own Institution. On- and Off-campus are not modelled. Sample institutions are never production records. | Phase 1 | PROVISIONAL |
| P1-14 | Decision ids inside product copy: 298 text instances and 316 id mentions, for example "(T-08)" ×11 on B7-03 (re-checked) (VD-10) | B7-02 and B7-03 are Phase-1 boards and carry T-06, T-08, T-09, T-11 and T-25. | Strip the suffix through a copy table and keep the sentence. | Phase 1 | UNRESOLVED |
| P1-15 | Public pages rendered on the client in sample mode (AD-12, TE-8) | ARCH §4 says public discovery is server-rendered, but the sample world exists only in the browser. | Accept, and record TE-8. | Phase 1 | PROVISIONAL |
| P1-16 | Retire the foundation `/system` page and the ApiHealthProbe; `/` becomes PU-01; keep `/healthz` (O-10; repo-baseline ownerDecisions[12]) | These are foundation routes that v46 replaces. | Accept. Done in Phase 0 (plan WP-0.3); `/` resolves to the not-found pattern until PU-01 is built in Phase 1. | Phase 0 (WP-0.3) | PROVISIONAL |
| P1-17 | XS-01 "Back to experiments": the href is `/` (Landing), but the label and the inventory say catalogue (O-11) | Label and href disagree. | Follow the href. | Phase 1 | PROVISIONAL |
| P1-18 | May a hosted reviewer build show live payment f6/f7, "Completed" or failure frames? (AD-40, AD-10) | Hosted walks cannot reach those states (architecture §2.5). | No: fixtures and CI only. Accept the list of states that hosted walks cannot reach. | Phase 1 (payment) · Phase 3 (completion) | PROVISIONAL |
| P1-19 | Session expiry policy and the return-address rule (AD-21, QT-13) | B1-09: "Session expired returns them to the page they were on." | Honour `returnTo` only inside one's own workspace. The mock has no automatic expiry. | Phase 1 | UNRESOLVED |
| P1-20 | Unsaved-changes policy (AD-19; AR-5 "Back never loses work"; `surface-vendor.json#openQuestions[18]`; `surface-faculty.json#openQuestions[29]`) | It affects every multi-step form. | No prompt. Drafts are kept per tab, and Cancel discards. | Phase 1 | UNRESOLVED |
| P1-21 | Stale or concurrent changes (AD-20) | Two roles can act on one record. | Refetch and render the current drawn state. Ask whether a one-line notice may be added. | Phase 1 | UNRESOLVED |
| P1-22 | Catalogue details: featured experiments curated or derived (B1-14); order when a course has more than three experiments (B1-04); OR inside a facet and AND across facets (`surface-public-entry.json#openQuestions[15]`) | These are reversible design choices. | Featured experiments are a seeded list. Facets as the inventory describes them. | Phase 1 | PROVISIONAL |

### D.3 Phase 2 — Campus distribution (B2-01…B2-12)

| Ref | Question | Why it matters | Recommended default (recommendation) | Needed by | Status |
|---|---|---|---|---|---|
| P2-01 | Licence counting (D7 / T-06; OD-B2-03; AD-17; ACC-09; schemas §8-6; repo-baseline ownerDecisions[10]; SC-19, SC-23) | The rule is undecided, yet "Waiting for a licence" is drawn. Slice-1 `places.ts` and "no-place-remaining" encode a counting rule (`repo-baseline.json`). | "Waiting for a licence" exists only as a seeded value in the later-sample fixture. New grants are Active. Licence figures are display-only. Do not salvage the Slice-1 counting code. | Phase 2 | UNRESOLVED |
| P2-02 | What does a Student see with overlapping grants, after one of them is withdrawn? (OD-B2-01, AD-18, SACC-15, schemas §8-7; DV-1) | The guard has to answer "can open?". The deliverables disagree (D.0). | The DV-1 interim. | Phase 2 | UNRESOLVED |
| P2-03 | Do students added to a group after a group grant receive the experiment? (OD-B2-02, SACC-16, GRP-03) | B2-08 f9 says "Added after the group grant" and promises nothing. Register IA-F5 and the inventory say grants reach new members. | Change the membership only; no SACC is created. | Phase 2 | UNRESOLVED |
| P2-04 | What does removing a member do to access and history? (GRP-05) | B2-15: "Not stated in the dialog". | Change the membership only, with no access-effect statement. | Phase 2 | UNRESOLVED |
| P2-05 | Withdrawing or changing a group grant (SACC-08, schemas §8-8) | IA-04's "Change on the group" (13 text occurrences on B2-04) links to B2-08, which has no control. | Not offered. Confirm it is out of scope; if it is wanted, it needs a new canvas version. | Phase 2 | UNRESOLVED |
| P2-06 | Earlier work after access is withdrawn or ended, and withdrawal after the plan has ended (O-07, D-27, SACC-14, SACC-11) | The boards disagree (B.2). | Show ST-19 at the hub for both "no longer given" and "access ended". ST-02 "View earlier work" goes to `/student/progress` (the ST-15 earlier-work section). No withdraw control after the plan ends. | Phase 2 | UNRESOLVED |
| P2-07 | Institute Admin writes while paused or after the plan has ended, and whether the pause reason is shown (INST-13, schemas §8-33, `surface-institute-admin.json#openQuestions[20]`, `[21]`, `surface-public-entry.json#openQuestions[22]`) | Not drawn for IA-06…IA-15 or IA-17. | Refuse every IA write while paused, with the IA-01 copy "Pages are read-only until BITS lifts the pause." The pause reason is not shown to the Institute Admin or Student. | Phase 2 | PROVISIONAL |
| P2-08 | Faculty deactivate / reactivate, editing a person's details, deleting a person, and sign-in by an inactive Faculty member (PER-07, PER-08, PER-09, SES-09) | Not designed. STK31-22 prefers reversible deactivation. | Not offered. Seed no inactive Faculty sign-in. | Phase 2 | UNRESOLVED |
| P2-09 | Wording: a grant while paused ("Paused" on IA-03 vs the grant's own word on IA-04); "student inactive" worded four ways; two meanings of "inactive" (schemas §8-31, §7 D-24; `surface-student.json#openQuestions[21]`) | Consistency of copy. | Keep the per-screen words as drawn. | Phase 2 | PROVISIONAL |
| P2-10 | "Not available right now" for one format (B2-12 f2), and which availability reason wins when several apply (schemas §8-30, §7 D-26; AD-27) | No record, cause or writer is designed for it. | Seed only; the gate returns `policy-open`. Accept the proposed precedence order. | Phase 2 | UNRESOLVED |
| P2-11 | Does an Institute Admin see problem reports from their institution? (SUP-07, O-12, D-31, S-4) | B2-01 f7 shows a Student's report SUP-0213 on IA-01 (B.2). | Show own reports only. IA-01 keeps the drawn target. | Phase 2 | UNRESOLVED |
| P2-12 | Where IA-05 Cancel returns to, and pre-filling the experiment (`surface-institute-admin.json#inconsistencies[26]`, `[29]`) | The B2-01 table says "Give students access, pre-filled", but it is not drawn. | Cancel returns to IA-04 as drawn. Pre-fill the experiment when the flow is entered from an IA-01 or IA-02 row. | Phase 2 | PROVISIONAL |
| P2-13 | Several access plans or courses (`surface-institute-admin.json#openQuestions[24]`) | Only a B2-02 annotation covers this. | Follow the annotation: one band per plan. | Phase 2 | PROVISIONAL |
| P2-14 | Record ids shown to Students: SACC-0310, ACC-0107, DTR-0018 (`surface-student.json#openQuestions[18]`) | Are they meant for Students? | Show them as drawn. | Phase 2 | PROVISIONAL |
| P2-15 | The Slice-1 judgement "unreadable term end = expired" (CF-06; repo-baseline ownerDecisions[11]) | It would carry a prototype judgement into the rules. | Do not carry it over. Treat unreadable data as an integrity failure (reseed), not as a business state. | Phase 2 | PROVISIONAL |
| P2-16 | Reaching the public catalogue from the Student workspace: the ST-20 disposition says "stays reachable from the footer", but no footer is drawn | Disposition and drawing differ. | No footer, as drawn. | Phase 2 | PROVISIONAL |

### D.4 Phase 3 — Learning, feedback and device chain (B3-01…B3-11, B7-09)

| Ref | Question | Why it matters | Recommended default (recommendation) | Needed by | Status |
|---|---|---|---|---|---|
| P3-01 | Completion (T-12, A-06, AD-05, AD-16, schemas §8-4; DV-4). Parts (a) stored vs derived and (d) moving the committed rule behind `CompletionPolicy` were moved to A4 at assembly (AD-39), because Phase 0 models M17 and walks Flow C at port level. Remaining here: <br>(b) May the WEB stand-in emit activity only? <br>(c) Does "Launch WEB" store nothing, so that In progress comes only from runtime events? <br>and the trigger event itself (T-12). | BC3: "Completed is set by the system, never by the Student, never inferred from a launch". The trigger event is still open. | (b) Yes; completion comes only from fixtures and CI. (c) Yes. Record TE-3. | Phase 3 | UNRESOLVED |
| P3-02 | Feedback eligibility once a format is Completed but access is later paused, withdrawn or ended (AD-22; BC5) | It is not drawn. | No new feedback entry while access is not active. Feedback already sent stays. | Phase 3 | UNRESOLVED |
| P3-03 | Device chain (OD-B3-01, OD-B3-02, OD-B3-03, OD-B3-05, DTR-09, schemas §8-24): how an authorised device is keyed and first recorded (walk step S7 has no drawn command), one open transfer at a time, and who resolves a request when the institution has no Institute Admin | A Student may hold more than one AR/VR/MR device, but the request form has no format field. | Seed the device per Student × format. Allow one open request. A request waits as "can’t be forwarded yet", with Help; there is no fallback actor. | Phase 3 | UNRESOLVED |
| P3-04 | Usage figures and who sees them (OD-B3-08, A-12 / D18, schemas §8-22; SC-25) | The four figure definitions on B3-10. | The service computes them from store records, using the B3-10 one-line definitions. Institute Admin only. No export. | Phase 3 | PROVISIONAL |
| P3-05 | Who writes learning resources, and what types and labels they have (schemas §8-23; OD-B3-06) | No authoring screen is drawn. | Seed them per experiment, with no authoring UI. | Phase 3 | UNRESOLVED |
| P3-06 | ST-18 opened directly by a Student with no AR/VR/MR format (O-08) | Only the hidden menu entry is drawn. | The in-shell not-found pattern. | Phase 3 | PROVISIONAL |
| P3-07 | Target of the IA-01 device-request row: IA-18 (annotation) or IA-17 (href)? (O-11) | Label and href disagree. | IA-18: `/institute/requests?tab=devices`. | Phase 3 | PROVISIONAL |

### D.5 Phase 4 — Teaching and assessment (B4-01…B4-13)

| Ref | Question | Why it matters | Recommended default (recommendation) | Needed by | Status |
|---|---|---|---|---|---|
| P4-01 | Automatic marking of choice questions vs BC10 "grading automation" (AD-38, ATT-07, schemas §8-17; DV-2) | B4-09: "choice questions are marked automatically" (re-checked). | Treat deterministic answer-key comparison as drawn v46 behaviour, not as grading automation. Use seeded marks until the owner confirms. | Phase 4 | UNRESOLVED |
| P4-02 | An assessment with no questions: hidden, or shown as not startable? And what happens when the last question is removed from a Ready assessment? (ASMT-15, T-18, OD-B4-02; `surface-faculty.json#openQuestions[26]`) | B4-05 and B4-11 f15 disagree (B.2). | Hide it from Students until it has a question (the B4-05 rule). Removing the last question is not drawn; the owner decides. | Phase 4 | UNRESOLVED |
| P4-03 | Co-teaching on one course; who owns the question bank; which experiment a new or imported question belongs to (ASMT-17, Q-10, Q-11, OD-B4-17) | No co-teaching sample is drawn, and FA-15 has no experiment picker. | One bank per experiment ("Questions for <experiment>"). Seed no co-teaching. Questions are created in the bank page that is open. | Phase 4 | UNRESOLVED |
| P4-04 | Attempts with several written questions: confirm per answer or per attempt? (ATT-17) | FA-18 has one row per answer; FA-19 is per attempt. | Seed one written question per attempt, and confirm per attempt as drawn. | Phase 4 | UNRESOLVED |
| P4-05 | Assessment edge rules (schemas §8-18; OD-B4-02, OD-B4-04, OD-B4-05): <br>• attempts with choice questions only <br>• pass-mark rounding <br>• retrying while waiting for marking <br>• release time when marks are confirmed after the deadline <br>• date validation: past dates, a release date before the deadline, time zone (`surface-faculty.json#openQuestions[28]`) | None of these is drawn. | Use the schemas M22 interim, and add no validation rule beyond "present". | Phase 4 | UNRESOLVED |
| P4-06 | Changing the release option after a submission: does it apply to existing submissions? (`surface-faculty.json#inconsistencies[8]`; OD-B4-13) | The save message and the warning on B4-06 contradict each other. | The release change applies to existing submissions, as the warning says. Rule changes create versions (OD-B4-13). | Phase 4 | UNRESOLVED |
| P4-07 | Consistent Help (WCAG 3.2.6) on the ST-13 focused attempt page, which has no sidebar and no Help link (`surface-student.json#openQuestions[17]`) | Accessibility compliance. | Owner decides. Accept as drawn, or add a Help link. | Phase 4 | PROVISIONAL |

### D.6 Phase 5 — Production and first publication (B5-01…B5-07, B6-01…B6-07, B6-10)

| Ref | Question | Why it matters | Recommended default (recommendation) | Needed by | Status |
|---|---|---|---|---|---|
| P5-01 | Routing after a Vendor resubmits, including after a Content Manager return (OD-B5-05, M-3, REG-VE-08-NEXT-GATE, schemas §8-15) | B5-06 draws "Submitted (after the resubmit)", and on the canvas a board control moves it on. | Route through the normal chain (BC7). The Vendor sees the drawn "Submitted" (M-3), and copy never names the gate. A shortcut back to the Content Manager would first need a decision compatible with BC7. | Phase 5 | UNRESOLVED |
| P5-02 | Is the Vendor course scope held by the person or the organisation, and do colleagues see each other's submissions? (ROLE-08, SUB-15, schemas §8-16) | B5-03 (organisation) vs B7-08 (person) (B.2). | Hold the scope on the person (B7-08). A Vendor sees only their own submissions ("Every experiment you created"). Keep the B5-03 wording as copy. | Phase 5 | UNRESOLVED |
| P5-03 | A Vendor with an "All experiments" or "one experiment" scope (ROLE-11; STK31-41) | Only a course choice is designed. | Seed course scopes only. | Phase 5 | UNRESOLVED |
| P5-04 | What a scope withdrawal does to work in flight (ROLE-09, OD-B5-01, OD-B7-15, OD-B6-01) | Only "They stop seeing it straight away" is stated. | Drafts become read-only, as drawn. Items in review are unchanged. Stuck records go through the SA override (SUB-33). | Phase 5 | UNRESOLVED |
| P5-05 | Reviewer scoping, and whether a platform-role experiment scope covers published experiments only or submissions too (OD-B6-01, STK31-41, schemas §8-28) | It determines what the queue, filters and scope line show. | The scope covers the submissions and updates of its course or experiment. Several holders per experiment are allowed. | Phase 5 | UNRESOLVED |
| P5-06 | Content Manager scope (CC-06, ROLE-10). B7-08 draws it: "Decides publication and raises corrections for: …". Under M-2 the CM is the single writer of platform codes. | A Content Manager scoped to one course is not drawn. | Seed the Content Manager with "All experiments". | Phase 5 | UNRESOLVED |
| P5-07 | Platform-code uniqueness: are spaces inside the code ignored? (schemas §8-29, §7 D-25) | B6-10's annotation and its script differ (B.2). | Follow the annotation rule: ignore case and all spaces. | Phase 5 | UNRESOLVED |
| P5-08 | SUB → EXP identity after publication (D-24; `surface-reviewer-cm.json#openQuestions[21]`) | Routes use SUB ids or EXP ids depending on the role. The 12 Batch-1 published experiments have no SUB. | An explicit SUB → EXP link and a `recordId` union. | Phase 5 | PROVISIONAL |
| P5-09 | How the Vendor's "Version" relates to the live "version n" (`surface-vendor.json#inconsistencies[16]`, `#openQuestions[22]`) | B5 does not state it. | The Vendor's version is a catalogue field; the live number is assigned by the system. Owner confirms. | Phase 5 | UNRESOLVED |
| P5-10 | VE-01's status line does not count "Submitted" (`surface-vendor.json#openQuestions[23]`) | A record in Submitted is counted nowhere. | Keep it as drawn (Register VE-F1). | Phase 5 | PROVISIONAL |

### D.7 Phase 6 — Corrections and governance (B6-08, B6-09, B6-04, B7-01…B7-09)

| Ref | Question | Why it matters | Recommended default (recommendation) | Needed by | Status |
|---|---|---|---|---|---|
| P6-01 | Does a held update block later corrections? (OD-B7-04, UPD-21, T-28, schemas §8-19) | The effects beyond the live version are open. | As drawn: the held update blocks later corrections. | Phase 6 | UNRESOLVED |
| P6-02 | Which correction fields cover AR/MR packages and learning outcomes? (OD-B6-09, schemas §8-20) | B6-09 draws only name, summary, description, web link, VR package reference and version label. | Only the drawn fields; AR, MR and learning outcomes cannot be edited in a correction until decided. | Phase 6 | UNRESOLVED |
| P6-03 | Does the Reviewer see the Content Manager's withdraw reason? (UPD-17, OD-B6-06) | The dialog promises it; RV-04 shows none (B.2). | Build RV-04 as drawn, with no reason, and flag the dialog copy. The owner decides. | Phase 6 | UNRESOLVED |
| P6-04 | What the Vendor sees after a Super Admin override (SUB-38) | Not drawn on B5. | Drawn states only. | Phase 6 | UNRESOLVED |
| P6-05 | Validation in Super Admin dialogs: B8-07 "errors on the field and in a summary" vs field-only errors on B7-02…B7-09 (schemas §7 D-23) | Board versus board. | Field-only errors in short dialogs, as drawn; a summary in longer forms. | Phase 6 | UNRESOLVED |
| P6-06 | The "Ending soon" threshold (BR-049 PROVISIONAL; T-31; schemas §8-32) | It drives "Ending soon" and "Reminder due". | 15 days, held as `ENDING_SOON_DAYS`. | Phase 6 | PROVISIONAL |

### D.8 Phase 7 — Consolidation (B8-03, B8-04, B8-05)

| Ref | Question | Why it matters | Recommended default (recommendation) | Needed by | Status |
|---|---|---|---|---|---|
| P7-01 | Final labels: T-35, ND-01 "Institute Admin", ND-02 "Engineering area", D28 "Access plan", and the format words | Labels are copy and stay swappable. | Keep the working labels in one copy table. | Phase 7 | PROVISIONAL |
| P7-02 | Sign off the expected baseline deviations (B1-10 fix, skip link, focus ring, viewport-fixed overlays) against the frozen boards (VD-18) | Visual regression must not fail on approved corrections. | Approve the list compiled during Phases 0–6. | Phase 7 | PROVISIONAL |

### D.9 The 12 decisions that shape the data model

`open-decisions.json` classifies these as "Shapes the data model — build the designed fields behind a service interface; confirm before a real backend". All 12 also block production (Section E).

**The ask.** Confirm each designed field set before a real backend is built.

**Recommended default (recommendation).** Build exactly the safe treatment shown.

| Id | Decision | Designed safe treatment (`handoff-consistency.json#dataModelDecisions`) | Built in |
|---|---|---|---|
| OD-B3-02 | Fields of a transfer request | New device (required) and a note (optional). No serial, asset tag or proof. | Phase 3 (P3-03) |
| OD-B3-06 | Resource types, delivery and size labels (T-15) | Opens in a new tab. Types and names are sample data. "Opened" only (T-13). | Phase 3 (P3-05) |
| OD-B3-07 | What "last saved" and a "session" are (T-12 / A-06) | A time only. No step names or durations. | Phase 3 (P3-01) |
| OD-B3-08 | Usage figure definitions and who sees them; export | Four figures, each defined in one line. Institute Admin only. No export. | Phase 3 (P3-04) |
| OD-B4-11 | Question import schema, XLSX, commit mode (T-24 · D5) | A ten-column CSV template. All-or-nothing for now. A missing explanation is a warning. | Phase 4 |
| OD-B4-12 | Assistance: sources, counts, provider, depth (T-23 · A-18 · R16) | The lab brief or pasted text. 3 or 5 drafts. No provider named. No suggested marks. | Phase 4 (SC-09) |
| OD-B4-13 | How versions are numbered and shown | "New version — earlier submissions keep theirs". | Phase 4 (P4-06) |
| OD-B5-02 | App package model and required fields (T-14) | Label, a reference or a file, the device needed, and install notes are required; other notes are optional. No source code. | Phase 5 |
| OD-B5-03 | Catalogue field schema (T-29 · ND-05) | Course, name, one-sentence summary, description, version. | Phase 5 (P5-09) |
| OD-B5-07 | When a submission id is given | On the first save of a draft. | Phase 5 (HB-12) |
| OD-B5-11 | Documents: types, sizes and where they are shown | Sample file names only. Shown to the Academic Reviewer. The product needs a real file input (routes verification item 4). | Phase 5 |
| OD-B6-08 | Version label rules for a correction | Required and different from the live version. No format rule. | Phase 6 |

### D.10 The 41 UNRESOLVED permission rows (`wf/final/permissions.md` §4.1): where each is decided

| Rows | Decided in |
|---|---|
| SEL-05 | SC-13 |
| REQ-05 | P1-02 |
| REQ-06, REQ-18 | P1-05 |
| REQ-19 | P1-07 |
| REQ-22 | P1-06 |
| INST-05 | P1-08 |
| INST-06 | P1-09 |
| INST-10 | SC-11 |
| INST-13 | P2-07 |
| ACC-07 | SC-01 |
| ACC-09 | P2-01 |
| SACC-08 | P2-05 |
| SACC-11, SACC-14 | P2-06 |
| SACC-15 | P2-02 |
| SACC-16 | P2-03 |
| GRP-05 | P2-04 |
| PER-07, PER-08, SES-09 | P2-08 |
| CC-06 | P5-06 |
| RUN-15 | SC-10 |
| ASMT-15 | P4-02 |
| ASMT-17, Q-10, Q-11 | P4-03 |
| ATT-07 | P4-01 |
| ATT-14 | HB-01 |
| ATT-17 | P4-04 |
| DTR-09 | P3-03 |
| SUB-15, ROLE-08 | P5-02 |
| SUB-35 | SC-03 |
| SUB-38 | P6-04 |
| UPD-17 | P6-03 |
| UPD-21 | P6-01 |
| ROLE-09 | P5-04 |
| ROLE-11 | P5-03 |
| SUP-04 | P0-30 |
| SUP-07 | P2-11 |

That is 41 rows, each placed once.

**Bulk confirmations (PROVISIONAL)**

- **X-01.** `permissions.md` §4.3 lists 32 rows with no rule behind them. The owner is asked to confirm the drawn or inferred behaviour in one pass. Examples: GRP-06 no group delete; PER-09 no person delete; PER-17 no profile edit; ASMT-08 no delete or archive of an assessment; SUB-13 no draft delete or duplicate; EXP-12 no unpublish; ROLE-06 no deregistration; DTR-04 no withdrawal of a sent request; INST-15 other roles see "BITS" instead of the Super Admin's name.
- **X-02.** The 98 PROVISIONAL rows in `permissions.md` §4.2 follow their governing decision ids. They need no separate ask beyond Sections D and E.

---

## E. Production and backend only

**Summary by theme.** These 106 decisions all have `blocksProduction` = true and `blocksPhase0` = false (`wf/understand/decisions-rules.json`). They break down as 67 batch decisions, 33 Register-T items and 6 REG-* extras; re-counted and grouped by theme for this register.

**Common to every theme:**
- **Question:** the open policy named by each id.
- **Why it matters:** a real backend cannot be built without an answer.
- **Recommended default (recommendation):** keep the drawn safe treatment (`open-decisions.json`, B8-08) in the mock until the owner decides. Do not invent the missing policy.
- **Blocks:** production, not the frontend phases.

Ids that also appear in Section D are listed there because the mock needs the owner to confirm the interim.

| Theme | Count | Ids | Safe treatment built in | Also in D / C |
|---|---|---|---|---|
| E1 Access requests, payment and institution lifecycle | 12 | T-01, T-02, T-03, T-04, T-05, T-07, T-08, T-09, OD-B3-09, OD-B3-10, OD-B3-11, OD-B7-11 | Phases 1, 3, 6 | P1-02, P1-05, P1-06, P1-08, P1-11; SC-11, SC-31 |
| E2 Licences, Student access grants, people and course codes | 8 | T-06 / D7, OD-B2-01, OD-B2-02, OD-B2-03, OD-B2-04, T-24, T-17, OD-B6-13 | Phases 2, 5 | P2-01, P2-02, P2-03; SC-08 |
| E3 Identity, sign-in and roles | 3 | T-10, T-11, REG-XS-02 | Phases 0, 2 | P0-10, P1-01; SC-12 |
| E4 Learning, runtime and completion | 8 | T-12, T-13, T-14, T-15, T-16, OD-B3-06, OD-B3-07, OD-B3-13 | Phase 3 | P3-01, P3-05; SC-05 |
| E5 Usage, reports and feedback visibility | 4 | OD-B3-08, OD-B3-12, T-25, T-33 | Phases 3, 6 | P3-04; SC-25, SC-26 |
| E6 Device transfers | 6 | OD-B3-01, OD-B3-02, OD-B3-03, OD-B3-04, OD-B3-05, T-32 | Phase 3 | P3-03 |
| E7 Assessment, question bank and marking | 21 | OD-B4-01…OD-B4-14, OD-B4-17, T-18, T-19, T-20, T-21, T-22, T-23 | Phase 4 | P4-01…P4-06; SC-06, SC-09, SC-16, SC-17, SC-27 |
| E8 Content production and first publication | 21 | OD-B5-01…OD-B5-08, OD-B5-10, OD-B5-11, OD-B5-13, OD-B6-01…OD-B6-05, T-26 residual, T-29, T-30, REG-VE-08-NEXT-GATE, REG-VE-10-14 | Phase 5 | P5-01…P5-09; SC-18, SC-28 |
| E9 Corrections, Release / Hold and published content | 13 | OD-B6-06, OD-B6-07, OD-B6-08, OD-B6-09, OD-B6-14, OD-B7-01, OD-B7-02, OD-B7-03, OD-B7-04, OD-B7-05, T-28 residual, REG-D-09-6, REG-07.2-F | Phase 6 | P6-01…P6-03; SC-03, SC-04 |
| E10 Governance: structure, platform roles, operations | 7 | OD-B7-07, OD-B7-09, OD-B7-10, OD-B7-12, OD-B7-13, T-31, REG-SA-COURSE-CODE | Phase 6 | SC-01, SC-02, SC-03 |
| E11 Notifications and messaging | 3 | T-34, OD-B3-14, OD-B5-12 | Phases 3, 5, 7 | — |
| **Total** | **106** | | | |

**Not blocking production (14).** OD-B3-15, OD-B3-16, OD-B4-15 and OD-B6-10 are resolved or recorded. OD-B4-16, OD-B6-11, OD-B6-12, OD-B7-06, OD-B7-08, OD-B7-14 and OD-B7-15 are sample data only (P1-12). OD-B5-09 is held open by BC11 (two separate records). T-35 and T-36 are design-now items (P7-01, P0-29).

**Other production or backend items outside the 106.** None of these is a frontend decision:
- the identity provider and the IA SSO set-up (A-01, IA-22; SC-12);
- the payment provider, pricing and refunds (R06, ND-08, ND-12);
- the reminder channel (ND-16; SC-01);
- the support SLA and provider (ND-14);
- the AI provider and assist depth (A-18, ND-09);
- runtime completion ingestion (A-06);
- backend persistence and migrations (BC10; FPM §G);
- hosting and secrets (E-08);
- the API serving every port, which is the removal trigger for TE-1…TE-8;
- the approved logo asset (P0-04);
- the rule that sample institutions are never production records (STK31-23).

---

## Counts

| Section | Count |
|---|---|
| A · blocks starting or merging Phase-0 work | 7 (A1–A7; A6 and A7 added at assembly), mapped one-to-one to plan gates G-1, G-2, G-3, G-5, G-6, G-7, G-8; 7 candidates checked and demoted (A.2), including the former plan gate G-4 |
| B.1 · handoff defects (board wins) | 24 (HB-01…HB-24) |
| B.2 · board-versus-board contradictions routed to D | 15 |
| C · stakeholder records vs v46 | 32 (24 registered + 8 found by the final deliverables). Of these, 18 need a decision, 3 are confirmations, 6 are acknowledgements, 1 is an acknowledgement plus a later decision, and 4 are internal. Status: UNRESOLVED 19 (the 18 plus SC-23) · PROVISIONAL 4 · CONFIRMED 9. |
| D.0 · divergences inside this audit | 8 (DV-1…DV-8; DV-5…DV-8 added at assembly) |
| D.1 · Phase 0 (during) | 35 (P0-01…P0-35; P0-35 added at assembly) |
| D.2 · Phase 1 | 22 |
| D.3 · Phase 2 | 16 |
| D.4 · Phase 3 | 7 |
| D.5 · Phase 4 | 7 |
| D.6 · Phase 5 | 10 |
| D.7 · Phase 6 | 6 |
| D.8 · Phase 7 | 2 |
| D.9 · data-model decisions | 12 |
| D.10 · UNRESOLVED permission rows placed | 41, plus 2 bulk confirmations (X-01: 32 rows; X-02: 98 rows) |
| E · production / backend | 106 in 11 themes, plus 14 that do not block production |
| Status of the D.1–D.8 rows (105) | UNRESOLVED 61 · PROVISIONAL 44 (by phase, U/P: P0 14/21 · P1 15/7 · P2 9/7 · P3 4/3 · P4 6/1 · P5 8/2 · P6 5/1 · P7 0/2) |

## Source coverage

All 163 `inconsistencies` and 189 `openQuestions` in the seven `wf/understand/surface-*.json` files were read and triaged. Each went into B, C, D or E, or was judged build-level. Build-level means the board is followed as drawn and no owner decision is needed. Examples of build-level items:
- inventory or Register wording superseded by a board;
- link targets resolved in the routes verification (SA-01 rows; the ST-13 way-out);
- copy differences between frames, where the later or more specific frame wins (Up next wording; breadcrumbs);
- sample-data slips inside one board (the B2-08 empty group);
- per-board variants of the same component.

The owner-decision lists of the five finals were cross-checked:
- architecture AD-01…AD-45;
- routes O-01…O-12;
- schemas §8 items 1–33;
- visual VD-01…VD-23;
- permissions §4.1 (41), §4.4 (22) and §4.5.

Also cross-checked: `repo-baseline.json#recommendation.ownerDecisions` 1–16, `visual-system.json#risks` R-01…R-25, `handoff-consistency.json` checks 1–12, and `decisions-rules.json#conflicts` (24), `#decisions` (114), `#registerExtras` (6) and `#phase0Blockers` (0).

## Verification log (spot-checks re-run for this register)

**Repository (read-only git):**
- `git remote` is empty.
- `git branch -v`: `v2/connected-frontend-slice1`, `v2/design-system-flagship` and `v2/platform-foundation` are all at `1b090c97…`; `main` is at `e8c6a84`, and its tree is `.gitattributes .gitignore README.md branding source`.
- `git status --porcelain -uall`: 98 lines, 27 of them under the Source Pack.
- `git worktree list`: 1 worktree.
- `1b090c9`: the root holds no `design/` and no `CLAUDE.md`; `branding/bits-pilani-wilp-logo.png` is present.
- `1b090c9:v2/docs/ARCHITECTURE.md`: line 59 "no business rule in `apps/web`"; line 173 "No authentication is implemented and none is faked"; line 213 "no scenario selector, no demo clock, no stand-in controls in V2"; the section headings confirm that §10 is authentication and §14 is environments and configuration.
- `1b090c9:v2/docs/OPEN_DECISIONS.md`: the status row "None may be silently resolved by an implementation"; the texts of E-19, A-07, A-08, A-14 and A-20.
- `1b090c9:v2/docs/MIGRATION_STRATEGY.md` §3: Phase 1 "Design tokens and accessible primitives in `@xr/ui` (Tailwind v4 …)"; Phase 2 D3 "one licence per active student per access record"; D4 "conservative overall state"; Phase 4 "built on the API".
- `1b090c9:v2/apps/web/src/app/globals.css` = `@import 'tailwindcss';`.
- `1b090c9:v2/packages/domain/src/runtime/utilisation.ts` line 183: `case 'SIMULATION_COMPLETED'`.
- `1b090c9:ui-ux/00-project-context/PROJECT_CONTEXT.md`: "Protected assets … `branding/bits-pilani-wilp-logo.png`"; "D-12 Logo is the only confirmed brand asset".

**Handoff (scratch extraction; python3 -I; script in `wf/design/_owner/spot.py`):**
- `screens.json`: IA-14 "· /new"; SA-15 two routes; SA-16 "\|"; PU-05 `[courseCode]`; PU-10 `/requests/[requestId]`; XS-03 type page `/signed-out`; VE-13 type tab; PU-08 "Header: Request access / flow step"; CM-07 "with reason"; FA-21 without an experiment.
- `navigation.json`: "Request access → PU-08".
- `flows.json` D4: "Faculty → Student", "FA-12 (release) → ST-14".
- `entities.json`: RUN ownerWriter "Student"; ROLE "Scope active · withdrawn (reason)"; "Scope active" appears on no board except B8-07.

**Boards:**
- B1-01: `a.xp-access` → `B1-06-Selection.dc.html` ×3.
- B4 boards: 0 `<button>Release…`.
- B4-14 D4: "The assessment’s own setting".
- B2-08: "Create group (DL-3)" and "Create group opens DL-3".
- B8-06: "… persistence stay out until decided"; Phase-0 row "Shell, sidebars, account menu, Help & support, system pages, tokens, components, dialogs".
- B8-03: "The developer switcher stays outside the product (Inventory C.2 “DEV”)".
- B7-09: "Reopened by the reporter" ×7. Board 07: "resolving and reopening are Super Admin actions".
- B1-08: "does not open the page on its own".
- B4-09: "choice questions are marked automatically".
- B2-04: the text "Change on the group" occurs 13 times.
- B5-03: "Only the courses assigned to Northline Simulation Studio are listed".
- B4-11: "Hub · Assessment tab" ×3.
- B3-03: "Completion comes only from the simulation (T-12). No “I have finished” button."
- B7-03: "(T-08)" ×11.

**Owner records:** START-HERE BC1–14 and known exceptions 1–9 were read in full. FREEZE-RECORD freeze rules 1–4 were read in full.

**Stakeholder records:** `1b090c9:ui-ux/00-project-context/STAKEHOLDER_CONFIRMED_UPDATE_2026-08-31.md` entries STK31-18, -19, -23, -32, -39 and -42 were read for SC-25…SC-32.

**Artefact:** `~/Downloads/XR-Learning-Platform-Design-Handoff-v46.zip`, SHA-256 `9d33f32e1919b239725b2abee0500795174df804f0f7d6dfa58f25b9c08d24bf`, read only.

**Counts:**
- The 106 production blockers were regrouped by script (`wf/design/_owner/themes.py`): 106 assigned, 0 missing, 0 duplicated.
- The 12 data-model ids match `decisions-rules.json` classification "Shapes the data model".

**Re-checked at assembly (9 Oct 2026, read-only):** zip SHA-256 `9d33f32e…24bf` re-computed; `shasum -a 256 -c SHA256SUMS.txt` in the scratch extraction = 178 OK, 180 files, 128 boards; HEAD `1b090c9` on `v2/connected-frontend-slice1`; `git status --porcelain -uall` 98 lines (11 M, 87 ??); `git diff --stat` 11 files, +192/−58; no remote; one worktree; `design/` exists on none of the 8 local branches; B8-06 build-order rows ("0 · Foundation …", "1 · Public + access spine — PU-01…12, XS-01/03 …"); board 07 "resolving and reopening are Super Admin actions" ×1 vs B7-09 "Reopened by the reporter" ×7; 24,319 `style=` attributes over 128 boards; B1-13 has 1 `thead` with a control (the inert SA-02 thumbnail) vs 10 on B1-10.

**Not done:** no code was run and nothing was installed. All repository and Downloads access was read-only.
