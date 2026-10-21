# MASTER-INTEGRATION-RESUME — V3 four-role integration (paused 21 Oct 2026, 17:15 IST)

The owner's master instruction of 21 Oct 2026 integrates the four remaining roles **sequentially**
from their FINAL, owner-approved packages: Academic Reviewer → Institute Admin → Faculty → Student,
then one platform-wide verification and ONE consolidated report for the owner's browser review. The
run was paused at the owner's request (end of day). This file is the resume point.

## 0. Status update (21 Oct 2026, evening — run resumed, owner's acceleration instruction)

- Stage B · Institute Admin: committed `5e102ee` (bundle `XR-frontend-v3-5e102ee-ia.bundle`,
  restore-tested); the WIP branch was deleted.
- Stage C · Faculty (21 ids): committed `68efdc2` "Add FA: …" (see `FA-INTEGRATION-RECORD.md`), register 90
  migrated; bundle `XR-frontend-v3-68efdc2-fa.bundle` in `~/Downloads`.
- Stage D · Student (19 ids): committed as "Add ST: …" (see `ST-INTEGRATION-RECORD.md`), register 109 migrated. Built in an isolated copy of the worktree (scratchpad `stw`) in parallel with
  the Faculty verification, then applied to the worktree as one diff.
- **Run complete (22 Oct 2026):** Student committed `1d03cb8` (bundle `XR-frontend-v3-1d03cb8-st.bundle`);
  final `pnpm verify` on `1d03cb8`: all steps PASS except parity's 7 known Public Landing artwork
  comparisons; the consolidated report is `V3-FINAL-BROWSER-REVIEW-REPORT.md`; review build on
  port 3360. Nothing is pending in this run; acceptance is the owner's browser review.
- Sections 1–6 below describe the pause state of the morning and are kept as the record.

## 1. Repository state at the pause

| Item                         | Value                                                                                                                                                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repository / worktree        | `/Users/mymac/Desktop/AR-VR-v3-ui`                                                                                                                                                                        |
| Branch                       | `v3/refined-b-ui`                                                                                                                                                                                         |
| HEAD (branch tip, committed) | `aa654ab` — Add RV (Stage A, Academic Reviewer)                                                                                                                                                           |
| Working tree                 | **Institute Admin (Stage B) work, uncommitted**: 126 modified + 28 untracked paths (design/v3-refined-b/roles/IA-v1/ + its checksum list, IA kit and pages, shared helpers, copy, registers, specs, docs) |
| WIP checkpoint               | branch `wip/ia-checkpoint-2026-10-21` = HEAD + the whole working tree as one commit (made with a temporary index: the working tree, index and `v3/refined-b-ui` were not changed)                         |
| Protected original           | `/Users/mymac/Desktop/AR-VR` at `1b090c9`, 98 paths — never modify                                                                                                                                        |

## 2. Completed stages and commits (all on `v3/refined-b-ui`)

| Stage                                   | Commit                                 | Bundle (in `~/Downloads`)                                                                                                       | State                                                                                                                          |
| --------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Content Manager (accepted by the owner) | `ff58c5c`; acceptance record `984efe3` | `XR-frontend-v3-984efe3-cm-accepted.bundle`                                                                                     | ACCEPTED                                                                                                                       |
| **A · Academic Reviewer** (RV-01…06)    | **`aa654ab`**                          | `XR-frontend-v3-aa654ab-rv.bundle` (SHA-256 `37d1f42807cd7cf19690e98390f019de5a86085edfe4b5b1bb4e93032f28fd5a`, restore-tested) | integrated, verified (web suite four widths 0 failed; parity gl-01/xs-07 8/8); owner acceptance PENDING (final browser review) |
| B · Institute Admin (19 ids)            | — (WIP checkpoint only)                | `XR-frontend-v3-ia-wip-2026-10-21.bundle` (both branches)                                                                       | implementation complete, verification NOT finished                                                                             |
| C · Faculty (21 ids)                    | —                                      | —                                                                                                                               | not started (brief + analysis ready)                                                                                           |
| D · Student (19 ids)                    | —                                      | —                                                                                                                               | not started (brief + analysis ready)                                                                                           |

Register: 69 ids marked migrated in the working tree (44 accepted roles + 6 RV + 19 IA); committed
HEAD says 50.

## 3. Institute Admin progress (Stage B)

Done (in the working tree / WIP checkpoint):

- Intake PASS; export copied byte for byte to `design/v3-refined-b/roles/IA-v1/` (151 OK beside
  list); `ia-scoped.css` (layer `xr.v3.ia`, sixth lock layout); V3 shell for `tenant_admin`
  (per-role rail icon map, Overview · date); icon `device`.
- Shared helpers moved to `features/institute/shared/`; ledger split `nav/link-targets-ia/`.
- All 19 screens built by four groups (plan, access, people, requests) on `ia.tsx` + group kits;
  identifier rule applied (no ACC-/REQ-/DTR-/SACC-/GRP-/FMAP-).
- Consolidation: 112 `Ia*` exports recorded; V3P-16 (35 static styles; 73 `style=` accounted for);
  term-bar inline-style scan exception; ConfirmDialog additive options (destructive / alertdialog /
  initialFocus cancel / busyLook / optional description); duplicates merged; cascade check (148
  states × 4 widths): no difference; COMPONENT-EXTENSIONS IA section.
- Cross-role specs updated (19 e2e files modified, see `git status -- v2/apps/web/e2e`).
- Docs: comparison-map IA entries (IA-shell + 19), register (69 migrated), `IA-INTEGRATION-RECORD.md`
  draft (§7 results and §9 review still RESULTS-PENDING / partial).

Test evidence so far:

- Unit (after consolidation): packages/ui 1,299; apps/web 7,475; config 379 + scans 46 — all pass.
- IA specs on the dev server: 52/52 at each of 1440, 1024, 768, 375.
- Whole web e2e on an isolated product build of ~16:16: 1440 567 passed / 7 skipped; 1024 506 / 68;
  768 506 / 68; 375 511 / 63 — **0 failed**. The consolidation agent was still editing product files
  until ~16:35, so the FINAL tree has not yet run the browser suite.
- Parity (`gl-01`, `xs-07`, `b1-package-1c`): 20 passed, **1 failed** — `gl-01` "board 05 · the
  built shell on Help for 7 roles" (17 min, timed out on elements the V3 shell no longer has). The
  Institute Admin's v46 shell comparisons have NOT yet been retired in the comparison map (as was
  done for RV: `05-<role>-help-built-top-bar`, `-sidebar-head`, `-sidebar-workspace`,
  `-sidebar-help`, and for the Institute Admin `-sidebar-phase-3`, plus its paused-banner name if it
  fails). The 7 B1 public-page artwork comparisons are the recorded legacy exception.

Outstanding for Stage B (in order):

1. Rebuild the isolated verification copy from the worktree (see §6) and run the IA specs + the
   cross-role specs at the four widths in parallel (or the whole suite, three widths in parallel).
2. Retire the Institute Admin's v46 shell comparisons by name under `IA-shell` → `supersedes`
   (check the failing names in the gl-01 run), re-run `gl-01` + `xs-07` + `b1-package-1c` alone.
3. Captures `node tools/v3-reference/capture-product.mjs --product http://localhost:3310 --only 'ia*'`
   and the identifier sweep (`notes/../scripts/sweep-role.mjs <base> meera.iyer@godavari.edu.in
'<routes json>'`); fix anything clipped/overflowing.
4. Fill `IA-INTEGRATION-RECORD.md` §7/§9, `productEvidenceIA` in the map; prettier.
5. Integrity (handoff 178, pack 46, XS 125, SA 29, VE 85, CM 140, RV 120, IA 151), protected checkout.
6. Commit "Add IA: …" on `v3/refined-b-ui` (only IA + records), bundle + `.sha256`, restore test.
   Delete the WIP branch only after the real commit is bundled.

## 4. Remaining stages

- **C · Faculty**: package `~/Downloads/XR-V3-Faculty-Final-Source.zip` (SHA-256
  `d11a3d009132b3aca3b69639027016b9bed9abd4056b5075cb1bbddf10435bef`) + `XR-V3-Faculty-Final-Screenshots.zip`
  (`02507a27…3c9`). Brief `FA-BRIEF.md`, analysis `FA-ANALYSIS.md` (decisions: keep "Multiple choice"
  (domain CSV rule), no new XLSX guard, hide ASMT/attempt/question ids, lock key `baseFilesUsed`,
  42 inline styles to patch).
- **D · Student**: package `~/Downloads/XR-V3-Student-FINAL-Source.zip` (SHA-256
  `029b9dfb56734f929f82ee46cdb063dc558c051ed188f7a52ee554a21048c268`) + `XR-V3-Student-FINAL-Screenshots.zip`
  (`e5a23f57…0d5f60`). Brief `ST-BRIEF.md`, analysis `ST-ANALYSIS.md` (decisions: illustrative
  simulation stages are NOT product data — leave out, report the dependency; keep the new-tab sample
  activity; My device must reach the V3 account menu; hide ACC-/SACC-/DTR-).
- Then: the full platform gate (`pnpm verify` in the isolated copy, ports 3310/3410/3520), a final
  identifier sweep of all roles, the 123-screen register reconciliation (44 accepted + 65 new = 109;
  reconcile the other 14 by their actual status — do not claim 123/123), a review server on a free
  port (not 3300/3330), ONE consolidated report, STOP.

All four packages passed the consolidated intake (21 Oct): FINAL / OWNER APPROVED, every owned id
covered in ROLE-STATUS.json, foundation `XR-V3-RB-1.0` hashes match; `.json` forms of ROLE-STATUS /
FOUNDATION-LOCK are what `ROLE-INTAKE-REQUIREMENTS.md` requires.

## 5. Processes at the pause

- Stopped: the cross-role spec agent (Stage B; its full-suite runs had finished, parity had just
  finished), the isolated copy's servers (3310, 3312, 3520, 3522), the worktree's test-hook dev
  server (3510) and the @xr/ui watch. No browser test, build or agent is running.
- Left running (owner's): **3330** — the Content Manager review build served from the temporary
  verification copy `…/scratchpad/cmv`; it ends at shutdown. **3300** was not running at the start
  of the run.
- The temporary scratchpad (`/private/tmp/claude-501/…/scratchpad`, with the isolated copies `cmv`,
  `cmv2` and the extracted packages) is cleared by a restart. Everything needed is saved in
  `~/Downloads/XR-V3-master-integration-checkpoint-2026-10-21/` (notes, scripts, latest logs, this
  file) and in the repository.

## 6. How to resume tomorrow

1. Check: `git -C /Users/mymac/Desktop/AR-VR-v3-ui status --short | wc -l` → 154 (126 M + 28 ??),
   branch `v3/refined-b-ui`, HEAD `aa654ab`. If the working tree is somehow lost, restore it from the
   WIP branch: `git checkout wip/ia-checkpoint-2026-10-21 -- .` (from the worktree root) — or from
   the bundle `XR-frontend-v3-ia-wip-2026-10-21.bundle` (`git fetch <bundle>
wip/ia-checkpoint-2026-10-21`).
2. Re-extract the packages into a fresh scratchpad (`unzip` the four FINAL source + screenshot zips
   from `~/Downloads`) — the briefs' scratchpad paths point to the old location: read them with the
   new paths.
3. Recreate the isolated verification copy: `cp -c -R /Users/mymac/Desktop/AR-VR-v3-ui <scratch>/cmv2`
   (APFS clone, includes node_modules), `rm -rf <scratch>/cmv2/.git`, `git init` + commit there;
   build in `cmv2/v2`: `pnpm exec turbo run build --filter=@xr/web`, then in `apps/web`
   `node scripts/next-with-test-hooks.mjs build`; serve on 3310 / 3520. Never build in the worktree.
4. Continue Stage B at §3 "Outstanding" step 1, then Stages C and D, then the final verification
   and report.
5. If the owner wants the Content Manager review server again: rebuild a copy of commit `ff58c5c`
   (or later) the same way and `next start -p 3330`.

## 7. The owner's instructions and safety requirements (binding)

- Sequential stages; one coordinated writer (disjoint-file builders under one lead); a role commit +
  verified recovery bundle + integration record per role; no owner prompts between successful
  roles; stop only for genuine blockers; never mark an implementation accepted — acceptance is the
  owner's final browser review.
- Identifier rule for every role: no SUB-/UPD-/REQ-/ACC-/DTR-/SACC-/attempt or similar internal ids
  in user-facing words, names, dialogs, crumbs, tab titles; keep course codes, names, vendors,
  formats, versions, statuses; IDs stay in routes/state/services; seeded user-authored text quoted
  as written; Help's SUP- support references stay.
- Preserve service contracts, permissions, business rules; no invented data, features or rules
  (Vendor "Request Course Access" stays on hold); report undefined dependencies.
- Protect: the original checkout, the frozen design folders (handoff-v46 178, v3-refined-b 46, the
  role exports), the accepted roles (XS, SA, VE, CM), the Public Landing; ports 3300/3330.
- Never merge, push, deploy or reset. Fast-track: focused per-role checks + essential cross-role
  regressions; the full gate once at the end; parallel widths; reuse caches; no weakened tests.
