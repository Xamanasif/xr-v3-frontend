# VE integration record — Vendor on foundation XR-V3-RB-1.0

The third owner-approved V3 role export, the Vendor (VE), integrated into the normal product on
`v3/refined-b-ui` after the Entry & shared screens (XS, `d9b7e87`) and the Super Admin (SA,
`cbe6f6d`), through pack prompt 11. The 10 owned ids: VE-01 … VE-09 and VE-13. The five excluded
ids (VE-10, VE-11, VE-12, VE-14, VE-15) stay excluded: nothing links to them. No other role was
imported.

## 1. Base and safety

- Worktree `/Users/mymac/Desktop/AR-VR-v3-ui`, branch `v3/refined-b-ui`, HEAD `cbe6f6d` (SA on XS on
  the foundation), clean tree, no other session writing to it (an unstarted clean-up proposal for
  the same worktree was withdrawn first).
- The owner's own review server (`next start -p 3300` from this worktree) and demo server (port
  3000, the source checkout) were left running; this integration used ports 3310 / 3410 / 3510.
- The protected original checkout `/Users/mymac/Desktop/AR-VR` was only read.
- The V1 Public Landing (PU-01, PU-14), every public page, the XS screens and the Super Admin
  screens were not modified.
- `design/handoff-v46/` (178 OK), `design/v3-refined-b/pack` (46 OK), `roles/XS-v6` (125 OK) and
  `roles/SA-v1` (29 OK) were not modified.

## 2. Source and approval

| Item         | Value                                                                                                                                                                                                                                                                                                                                                |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source       | `XR-V3-Vendor-Complete-Role-FINAL-Source.zip`, 173,976 bytes, SHA-256 `fcdf336fcaa4877d2144a5fc9536b7aa125c1e82a50e3374d95a3f3f4ce3fe04`: “Vendor — complete role (final)”, Design canvas version 14, delivered 19 Oct 2026                                                                                                                          |
| Screenshots  | `XR-V3-Vendor-Complete-Role-FINAL-Screenshots.zip`, 16,916,437 bytes, SHA-256 `c7ab3621f48645bd943d13309dd454449e5bed1107be553a3372a34b2da4594b`: 59 states × 4 widths, 70 boards, the test evidence (kept by the owner, not copied)                                                                                                                 |
| Revision     | `VE-v1` names this archive. It supersedes the 18 Oct baseline (`XR-V3-Vendor-Complete-Role-Source.zip`) and the refinement checkpoint R1 (`XR-V3-Vendor-Refinement-R1-Source.zip`); neither was imported. R1 alone was refused for integration on 19 Oct (a checkpoint: four screens refined, owner approval pending, no intake files)               |
| Coverage     | `ROLE-STATUS.md`: 10 of 10 owned ids, each DESIGN COMPLETE · CONNECTED, with states, boards and evidence; R1's five accepted presentation choices applied role-wide                                                                                                                                                                                  |
| Foundation   | `XR-V3-RB-1.0`: its `FOUNDATION-LOCK.md/.json` name it with the ten base hashes of `V3-FOUNDATION-RECORD.md` §2; `core.css`, `rb.css`, `rb-kit.css` are the foundation's bytes (checked by file and by lock); every one of the 75 project files matches the lock; one role stylesheet (`v3-vendor.css`, `ve-`/`vr-` classes, no new token or colour) |
| Intake files | `START-HERE.md`, `ROLE-STATUS.md/.json`, `FOUNDATION-LOCK.md/.json`, `COMPONENT-EXTENSIONS.md`, `LINK-MAP.json` (52 controls, no `href="#"` stand-in), `SCENARIOS.json`, `HANDOFF.md`, `CHECKS.md` — all present                                                                                                                                     |
| Integrity    | 85 files copied byte for byte to `design/v3-refined-b/roles/VE-v1/`. The export ships no checksum list, so the one recorded at intake sits beside the folder (`roles/VE-v1.SHA256SUMS.txt`): 85 OK. Nothing was added inside the export                                                                                                              |
| Approval     | The owner, 20 Oct 2026: “The Vendor complete-role design has now been finalized, and I approve this final version for integration.” The export's own files still read “FINAL DESIGN · AWAITING OWNER ACCEPTANCE”: they were written before that approval                                                                                             |
| Dependency   | The export borrows the XS account menu, Help & support, Not your workspace and the signed-out handoff (“ASSEMBLY PENDING XS”). XS is integrated (`d9b7e87`); the delivered XS components replace the borrowed ones                                                                                                                                   |

Not product UI and not imported: the live root's sample world, scenarios, presets, clock and
handlers (`Main.dc.html` script), the reviewer bar (`ve-preview`, `ve-pv-*`), the page canvas
(`ve-app`), the 69 inspection wrappers, `canvas.json`, the design runtime (`support.js`, not
supplied).

## 3. How it sits in the product (ADR-0010)

- **The Vendor's workspace is in the V3 shell.** `V3_SHELL_ROLES` holds the Super Admin and the
  Vendor: the V3 `WorkspaceShell` with the reserved logo slot, the studio name, the rail (Overview,
  My experiments with the export's glyphs), “Help & support” in the rail foot, the Menu drawer below
  1024 px, the top line with today on the sample clock, the XS account menu with its V3 button.
  Every other role keeps its v46 shell.
- **Stylesheet.** `packages/ui/src/styles/v3/ve-scoped.css` is generated from the export's
  `v3-vendor.css` (the same selector-only transform; the generator checks the foundation lock — in
  the export's third lock layout, `sharedFilesShipped` —, the role sheet's hash and the recorded
  checksums) in a new cascade layer `xr.v3.ve` between `xr.v3.sa` and `xr.v3.patch`. Left out: the
  page canvas and reviewer bar (`ve-app`, `ve-preview*`, `ve-pv-*`) and the borrowed XS surfaces
  (`ve-skip`, `ve-acct*`, `ve-acctmenu`, `ve-reports`, `ve-report*`, `ve-handoff`), with the four
  grouping rules they emptied.
- **Icons.** The export's `vei-*` glyphs: 16 were already in the kit, three more are v46 registry
  glyphs now named in the kit (`infoNote`, `next`, `myExperiments`), two are new (`returned`,
  `document`); the sign-out glyph is only drawn by the borrowed account menu.
- **Components.** The kit composes every page. The role's own patterns are central components:
  `packages/ui/src/v3/ve.tsx` holds what several Vendor screens draw (the returned-reason panel
  `vr-ret*`, the format chips `ve-chips`, the per-format delivery blocks `vr-dlv*`, sections, learning
  outcomes), and one module per screen group holds the rest (`ve-workspace` — VE-01/02, `ve-editor` —
  the one four-step editor, `ve-record` — VE-07/13). `ConfirmDialog` gained an additive
  `confirmVariant` (navy, for "Leave without saving") and leaves out an empty body. No foundation
  component was replaced. `COMPONENT-EXTENSIONS.md` lists them all.
- **Patches.** V3P-13: the export's three inline spacings that product elements need, and seven
  cascade corrections. The product puts the role sheet in the layer `xr.v3.ve` above the
  foundation, so a `ve-`/`vr-` rule would beat a higher-specificity Refined B rule that wins in the
  export (where the sheets are unlayered): "Formats it supports" (three declarations), Change on
  Check and submit, the list row's experiment name and its hover, and the focus ring of two
  elements. Each restores the Refined B declaration on exactly the elements both rules match; the
  provenance test checks it.
- **Shared pages in the V3 shell.** Help & support, Not your workspace, the account menu and the
  skip link are the XS components. PU-15 shows inside a `V46Island`.
- **Focus.** After a client-side move focus goes to the page's H1; Save draft moves it to the saved
  status; Revise focuses the returned reason, a reference its field; the History tab its heading.

## 4. What was integrated

| Id       | Product                                                                                                                                                                                                     | Where                                                      |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| VE shell | The V3 workspace shell (rail: Overview, My experiments; the studio; Menu drawer below 1024 px; top line, "Overview · date" on the Overview; XS account menu; Help & support); PU-15 inside it               | every `/vendor` address                                    |
| VE-01    | Overview: studio band with four counts, the returned lead (reason in full, references, Revise), drafts to finish, recent activity, calm, first visit; returned items and drafts before the counts on phones | `/vendor`                                                  |
| VE-02    | My experiments: status tabs with counts, search, Changed in the last 7 days, count, Clear filters, sort, the table and three-line phone rows, no match, empty, loading, failed                              | `/vendor/experiments` (`?status=`, `?changed=last-7-days`) |
| VE-03    | Create · Course and description: two sections, error summary, unique name, withdrawn course, draft saved (ID on first save)                                                                                 | `/vendor/experiments/new`                                  |
| VE-04    | Formats and delivery: the format selector, one delivery block per format with a live status, guidance once, validation, Leave without saving?                                                               | `/vendor/experiments/{id}/edit?step=formats`               |
| VE-05    | Preview and documents: label and link, sample documents with the empty line                                                                                                                                 | `…/edit?step=preview`                                      |
| VE-06    | Check and submit: review sections with Change, missing items with Go to, the confirmation, busy, the outcome card                                                                                           | `…/edit?step=submit`                                       |
| VE-07    | Experiment record: every status stated once, the returned-reason panel with reference chips into the editor field, Details, Where it stands, read-only states                                               | `/vendor/experiments/{id}`                                 |
| VE-08    | Revise and resubmit: the returned-reason panel above the editor, references (`field=`), Save changes, the neutral resubmit, refusals                                                                        | `/vendor/experiments/{id}/revise`                          |
| VE-09    | Edit draft: the same editor at the saved step; course withdrawn → What you entered                                                                                                                          | `/vendor/experiments/{id}/edit`                            |
| VE-13    | Submission and version history: the record's history tab                                                                                                                                                    | `/vendor/experiments/{id}?tab=history`                     |

The behaviour is the product's own, unchanged: the `production` service's reads and commands
(`getVendorOverview`, `listMyExperiments`, `getEditor`, `saveDraft`, `continueStep`,
`submitForReview`, `getRecord`, `saveRevision`, `resubmit`), their validation (v46's exact
messages), refusals, stale checks and repeat-press protection; the role permissions; the sample
world and its persistence (TE-6); what other roles see (a saved revision stays private: the
service already serves other roles the submitted revision). No service contract, permission,
workflow or publication rule changed; no backend was added; no sample record or preview logic of
the export was imported. The Vendor first saw its own submission IDs (SUB-…) where the export
shows them; the owner's identifier rule (§10) has since replaced them with words.

## 5. Decisions and discrepancies

1. **Borrowed XS pieces replaced.** The export drew the account menu, Help & support, Not your
   workspace, the skip link and a Sign out handoff "until assembly"; the delivered XS components
   are used, and their `ve-` placements are left out of `ve-scoped.css`.
2. **Facts the Vendor read model does not hold are not drawn.** The changed-field list of a saved,
   not-resubmitted revision ("Changed since revision N"), "Nothing has changed since revision N",
   the date a course was withdrawn ("on <date>", "Course withdrawn" in Where it stands, its history
   entry). No backend logic was added for them.
3. **Inferred, not invented.** "Changes saved, not resubmitted" is shown on a returned record whose
   last change is later than its return — only Save changes writes a returned record (one helper,
   `features/vendor/shared/saved-changes.ts`, used by the Overview, the list, the record and the
   editor). The four Overview counts and recent activity are computed from the records the list
   read already returns (their own history; "Created" does not exist as an event, the routing
   entry is left out because its label is retired).
4. **Provisional words.** The record's Details line for saved changes ("Your changes as last saved
   on <at>. They are not resubmitted yet.") replaces the export's "not shown here until you
   resubmit", which would be false (the Vendor's read holds the saved changes).
   `VE-07.intro.saved-changes` in the state-copy register.
5. **Business-rule words.** The "(sample file)" marker after sample file names is left out: the
   repository's sample-labels scan refuses it (T-36).
6. **Leave without saving?** — a UI safeguard the export adds (v46 had none) — is client-side in
   the editor: any link with unsaved changes (rail, drawer, breadcrumbs, Cancel, the account menu's
   Help) opens the kit dialog; the browser's Back and a typed address are not guarded.
7. **Order and controls.** The Overview's attention order follows the export (most recently changed
   returned item first; the service's own order is oldest first). The list's sort is a page-side
   toggle over the service's newest-first order. The editor's stepper and outline move between
   steps keeping the values, as the export does (v46's stepper was display-only). The editor's and
   the record's "Ask for help" open the XS report form with Where filled (LINK-MAP L45/L54).
8. **Accessible names.** Some links say more than their visible words, by content (row links:
   "<name>, SUB-…, <status>, last change <date>. Open the experiment record"; the lead: "Revise
   <name>, returned by the Academic Reviewer"); the Overview's H1 is "Overview, <studio>" with
   "Overview, " for assistive technology. The visible words are the export's.
9. **Shared components once.** The three builders' duplicates were merged (§3); the
   cascade corrections and inline spacings are V3P-13.
10. **Left out on purpose.** Classes no sheet defines (`vr-att`, `vr-w6`, `vr-dlv--ro`, `ve-id`);
    the export's inline icon stroke width 2 on four button icons (the kit `Icon` draws 1.75).
11. **Superseded v46 comparisons** are retired by name (10, the Vendor's v46 shell on Help; 218 with
    XS and SA), each under the VE-shell entry (`V3-COMPARISON-MAP.json`), reported as
    `retired-by-v3` — never counted as passed, never masked.

## 6. What did not change

The V1 Public Landing and PU-14; every public page; the XS screens (`d9b7e87`) and the Super Admin
screens (`cbe6f6d`) — the only shared code touched is additive (the role shell's role set and
top-line option, `ConfirmDialog`'s optional variant, icons, a patch layer entry); every other
role's pages and shells (Institute Admin, Student, Faculty, Academic Reviewer and Content Manager
keep their v46 presentation); the domain, contracts, sample platform and services; the baseline
pins, `DEVIATIONS.md` and `BASELINES.md`.

## 7. Tests and results

Every run used ports 3310 / 3410 / 3510; the owner's demo server (3000) and review server (3300)
were left running.

| Check                                       | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm verify` (final gate)                  | Run of 20 Oct 2026 (3,080 s): `format` PASS · `repository` PASS (46 checks; handoff 178/178; audit evidence 36/36; v46 copies 27/27) · `workspace` PASS · `bundle` PASS (2,126 built product files, 0 sentinels; test-hook bridge 6/6) · `browser` PASS · `parity` FAIL: the 7 legacy comparisons (below) and one test that stopped before comparing — the Help parity helper waited for the v46 page frame (`main.xr-page#main`), which the Vendor's Help no longer has in the V3 shell. The helper now waits for `main#main`; the web parity suite was rerun on the same build (below).                         |
| Unit and integration                        | turbo build 12/12, typecheck / lint / test 40/40 tasks; 9,925 unit tests in 10 packages (web 6,518, ui 1,063, domain 787, contracts 781, config 379, sample-platform 320, api 38, validation 20, testing 14, database 5); `v3-provenance.test.ts` regenerates `ve-scoped.css`, names the four emptied groups, and checks every V3P-13 value against the export's `style=` markup and every cascade correction against the Refined B rule it restores; `v3-reference.scan.test.ts` checks the three role exports (XS-v6 125, SA-v1 29, VE-v1 85 by its beside list), the register, the map and the scope boundary. |
| Browser, four widths (1440, 1024, 768, 375) | 3,342 Playwright tests passed (web 2,034, specimens 1,232, testing 76); 602 skipped by design, not counted. Before the gate, the 27 web specs that touch the Vendor ran on the normal and test-hook builds at the four widths: 827 passed, 125 skipped by design.                                                                                                                                                                                                                                                                                                                                                 |
| Vendor journeys                             | Create → validation → save draft → formats with the leave guard → preview → check → submit (`phase-5/vendor-editor`, `phase-5/demonstration`, `flows/walkthrough` E1); return → revise from the Overview lead → a reference opens its field → save changes → resubmit (neutral) → approve → publish (`phase-5/demonstration`, `flows/walkthrough` E2–E4); a Content Manager return and a re-check (`flows/alternates` E-alt1/E-alt2); the record in every status and its history (`phase-5/vendor-record`); the Overview and the list, every state (`phase-5/vendor-home`).                                       |
| Navigation, refusal and seams               | Every rendered link of the link-target ledger followed client-side, the Vendor's rail and Menu drawer included (`foundation/navigation`); Not your workspace in the Vendor's shell and the Vendor's addresses in other shells (`foundation/workspace-guard`, `cross-role`); the editor's refusals (already submitted, being reviewed, approved, published) and the read-only course (`phase-5/vendor-editor`, `vendor-record`).                                                                                                                                                                                   |
| Keyboard, focus and accessibility           | Axe WCAG 2.2 AA, no invisible focus target and 24 × 24 px targets on every Vendor state in the browser suites; the error summary, the saved status, the returned reason and a reference's field taking focus, the dialogs' focus and return, the History heading.                                                                                                                                                                                                                                                                                                                                                 |
| Visual parity (v46 harness)                 | Web parity rerun after the helper fix: 45 of 50 tests; 439 comparisons: 186 within tolerance, 28 on the deviation register, 218 retired by name for the XS, SA and VE screens (13 VE: the Vendor's v46 shell on Help and its empty My reports page), 7 unregistered (the legacy exception below); 0 masked. The specimens parity suite is unchanged (it does not render the Vendor).                                                                                                                                                                                                                              |
| V3 product captures                         | 23 Vendor cases × 4 widths (92 captures) on the normal build, the window as tall as the page: no overflow, no clipped text, all Public Sans weights, no console error; reviewed side by side with the export renders — `V3-COMPARISON-MAP.json` `productEvidenceVE`                                                                                                                                                                                                                                                                                                                                               |
| Integrity                                   | `design/handoff-v46` 178 OK · `design/v3-refined-b` 46 OK · `roles/XS-v6` 125 OK · `roles/SA-v1` 29 OK · `roles/VE-v1` 85 OK (beside list) · protected original checkout unchanged (`1b090c9`, 98 paths) · no change under `app/(public)`, the root layout, the Super Admin's or the XS screens' code.                                                                                                                                                                                                                                                                                                            |

**Legacy exception, not new:** the seven B1 artwork comparisons of the public pages
(`b1-01-f0-hero-figure`, `b1-01-f0-formats`, `b1-03-f0-whole-frame`, `b1-03-f2-experiments`,
`b1-05-f0-preview`, `b1-05-f0-whole-frame`, `b1-05-f6-poster`) still fail against their 14 Oct
pins, as recorded at the foundation, XS and SA. Their product captures are byte-identical to the SA
verify run's. Not re-pinned, not masked.

## 8. Limits and items for the owner

- The export's files still read "FINAL DESIGN · AWAITING OWNER ACCEPTANCE"; the owner's approval
  is the instruction of 20 Oct 2026. The export's open decisions (OD-B5-01 … OD-B5-13, M-3, LD-4)
  keep the treatment it designed: neutral "Submitted · revision N", no notifications, sample file
  names only, no Vendor updates to published material.
- The differences in §5 (2)–(5) are recorded in the state-copy register for the owner's review.
- Sign-in stays the prototype stand-in.
- Candidates to share later: the date-line hook exists for the Super Admin and the Vendor
  (`features/admin/sa-10-updates/content-head.tsx`, `features/vendor/shared/today-line.ts`).

## 9. How to review it

Start the product build on a free port (the owner's own servers use 3000 and 3300; restart the
3300 one after this commit, because the build it serves was replaced):
`pnpm --dir v2/apps/web build`, then `pnpm --dir v2/apps/web exec next start -p 3300`, and open
`http://localhost:3300/sign-in`. Seeded account: **Anil Shetty, Vendor, Northline Simulation Studio
— `anil.shetty@northline.example`, any password** (the sample sign-in). Seeded accounts at the
seams: Prof. A. Menon, Academic Reviewer (`a.menon@wilp.example`); Kavya Nair, Content Manager
(`kavya.nair@wilp.example`). No account is created by this route; a new experiment gets its
submission ID (SUB-0077 in a fresh world) when its draft is first saved. A reload keeps the sample
world in this browser and signs the tab out (TE-6); `/prototype/reset` starts it again.

A short route through both sidebar destinations and every Vendor screen (one tab, about ten
minutes):

1. Sign in as Anil Shetty → **Overview** (`/vendor`): the studio band and its four counts, the
   returned lead (Forced Convection) with its reason and references, the draft to finish, Recent
   activity; at 768 px or less the rail becomes **Menu** and the returned item comes first.
2. **My experiments**: the status tabs (Returned, Draft), search "fin" then "zzz" (no match → Clear
   filters), Changed in the last 7 days, the Last change sort; open **Fin-Tube Bundle**
   (published, read-only) and **Surface Roughness in Turning** (course no longer assigned).
3. **Create experiment** → Continue with nothing filled (the error summary) → fill Course and
   description → **Save draft** (the new ID) → Continue → tick WEB and AR (each block shows its
   status) → click **My experiments** in the rail with a change unsaved (**Leave without saving?**,
   then Keep editing) → Continue → Preview and documents (Add document) → Check and submit (Change
   on a section; the missing items) → finish and **Submit for academic review** (the confirmation,
   the outcome) → **Open the experiment record** → **Submission and version history**.
4. Back on the Overview → **Revise “Forced Convection”**: the reason above the editor; a reference
   chip opens its field; **Save changes**; open the record (the saved changes stated in the panel);
   **Continue revising** → Check and submit → **Resubmit** (neutral wording: “Submitted · revision
   2”).
5. **Help & support** in the rail foot; the account menu (top right) → Sign out.

## 10. Identifier rule applied (22 Oct 2026)

The owner asked, after the four-role run (22 Oct 2026), to apply the identifier rule to the
Vendor as a separate Vendor-only change: no SUB- reference in the Vendor's words, accessible
names, placeholders, breadcrumbs or tab titles; the references stay in the addresses, keys,
service calls and records (the template is the Content Manager's correction, `ff58c5c`).

- VE-02: the row link reads “<name>, <status>, last change <date>. Open the experiment record”; the
  line under a name shows the course code alone (left out when the course has none); search
  “Search by name or course” and its no-match line (the service search still matches a typed
  reference).
- VE-07 / VE-13: the head eyebrow “Experiment”.
- Editor: “Only you can see a draft”, “Revision 1 was returned”; the outline kicker “Draft” /
  “Revision 1 returned”; outcome and refusal eyebrows name the experiment (“Untitled experiment”
  when blank); the read-only eyebrow “Experiment”; the crumb falls back to “Untitled experiment”.
- Kit: `VendorExperimentRow.id` optional (additive; with it the row draws as before).
- Checks: reference checks on every drawn state (unit, kit and the three Vendor specs); packages/ui
  1,505 and apps/web 7,761 unit tests; scans 46; the Vendor specs 71 passed at four widths on the
  test-hook server; on a product build phase-5, phase-6, flows and foundation at 1440 (239 passed)
  and phase-5 + the alternates flow at 1024 / 768 / 375 (40 / 39 / 41 passed), 0 failed; a sweep
  of every Vendor page as Anil Shetty: no reference.
