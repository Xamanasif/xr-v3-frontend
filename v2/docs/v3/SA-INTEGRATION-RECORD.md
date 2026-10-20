# SA integration record — Super Admin on foundation XR-V3-RB-1.0

The second owner-approved V3 role export, Super Admin (SA), integrated into the normal product on
`v3/refined-b-ui` after the Entry & shared screens (XS, `d9b7e87`), through pack prompt 11. The 18
owned ids: SA-01, SA-02, SA-03, SA-06, SA-07, SA-10 … SA-22. The seven excluded ids (SA-04, 05, 08,
09, 23, 24, 25) stay excluded. No other role was imported.

## 1. Base and safety

- Worktree `/Users/mymac/Desktop/AR-VR-v3-ui`, branch `v3/refined-b-ui`, HEAD `d9b7e87` (XS on
  the foundation), clean tree, no other session writing to it.
- The protected original checkout `/Users/mymac/Desktop/AR-VR` was only read.
- The V1 Public Landing (PU-01, PU-14) and every public page were not modified.
- `design/handoff-v46/` (178 OK), `design/v3-refined-b/pack` (46 OK) and `roles/XS-v6` (125 OK)
  were not modified.

## 2. Source and approval

| Item        | Value                                                                                                                                                                                                                                   |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source      | `XR-V3-Super-Admin-Role-Source.zip`, 122,916 bytes, SHA-256 `aee94cd54af33717976699eaa47556355ee9616b496214267e65821060216adc` (the same archive the intake record of 19 Oct 00:05 hashed)                                              |
| Screenshots | `XR-V3-Super-Admin-Role-Screenshots.zip`, SHA-256 `f5aed4ef781e26bff4d53a44eebdaa205b71ecc699cabc088f9e93cf0ad61fa9`, 168 renders (kept by the owner, not copied)                                                                       |
| Revision    | No revision number in the export: `SA-v1` names this archive. Package date 18 Oct 2026. Plain HTML + JS preview (the V3 canvas runtime was not supplied)                                                                                |
| Foundation  | `XR-V3-RB-1.0`: its `FOUNDATION-LOCK.json` names it; `core.css`, `rb.css`, `rb-kit.css` are the foundation's bytes (checked by file and by lock); its role sheet `sa-role.css` matches its recorded hash; no global token change        |
| Integrity   | 29 files copied byte for byte to `design/v3-refined-b/roles/SA-v1/`. The export ships no checksum list, so the one recorded at intake sits beside the folder (`roles/SA-v1.SHA256SUMS.txt`): 29 OK. Nothing was added inside the export |
| Approval    | The owner: prompt 11 with the export (19 Oct 2026), and "XS is accepted. Start the Super Admin intake from the existing intake record using prompt 11." The export's own files still read "OWNER APPROVAL PENDING"                      |
| Dependency  | The export borrowed the XS account menu, Help & support and signed-out page "until XS is delivered". XS was integrated first (`d9b7e87`); the delivered XS components replace the borrowed ones                                         |

Not product UI and not imported: `sa-data.js` (sample records and scenarios), the `sa-core.js`
in-tab state machine and decision methods, the `sa-pv-*` preview controls, `boards.html`,
`checks/*.js`.

## 3. How it sits in the product (ADR-0010)

- **The Super Admin's workspace is in the V3 shell.** The workspace frame chooses the shell by the
  session role: the Super Admin (`V3_SHELL_ROLES`) gets the V3 `WorkspaceShell`
  (`features/shared/workspace-shell/v3-role-shell.tsx`) — the rail with the reserved logo slot, the
  same sidebar model as before (built destinations, the Requests count, the current destination)
  with the export's glyphs, "Help & support" in the rail foot, the Menu drawer below 1024 px, the
  top line with today on the sample clock ("Friday 23 October 2026"), the XS account menu with its
  V3 button. Every other role keeps its v46 shell.
- **Stylesheet.** `packages/ui/src/styles/v3/sa-scoped.css` is generated from the export's
  `sa-role.css` (the same selector-only transform; the generator checks the foundation lock, the
  role sheet's hash and the recorded checksums) in a new cascade layer `xr.v3.sa` between
  `xr.v3.xs` and `xr.v3.patch`. Left out: the preview controls (`sa-pv-*`) and the borrowed XS
  placements the delivered XS export replaces (`sa-acctwrap`, `sa-acctmenu*`, `sa-help`,
  `sa-form`, `sa-file`, `sa-list-row--static`, `sa-out`), with the one grouping rule they emptied.
- **Components.** The kit's components compose every page. The role's own patterns are central
  components in `packages/ui/src/v3/sa.tsx` (GL-04 message, button row, action groups, the
  waiting list, the read-only table, the record list, layout helpers) and one module per screen
  group (`sa-requests`, `sa-institutions`, `sa-content`, `sa-structure`, `sa-roles`,
  `sa-operations`). `LinkTabs` gained the page-tab spacing and a count per tab; six icons of the
  export's sprite were added. No foundation component was replaced.
- **Shared pages in the V3 shell.** Help & support, Not your workspace and the account menu are
  the XS components. PU-15 (not an SA id; board 08) shows inside a `V46Island`. An unknown or
  unreadable Super Admin record shows the export's GL-04 message in place
  (`features/admin/shared/sa-record-guard.tsx`).
- **Focus.** After a client-side move in a V3 shell, focus goes to the page's H1 (the export's
  "route change → page heading").
- **No reference anywhere.** No Super Admin page shows an internal reference (REQ-, ACC-, UPD-,
  DTR-, SUP-, SUB-) in its words or its accessible names: rows, links, dialogs, crumbs and tab
  titles are named by content ("Konark Polytechnic, additional licences, received 29 Sep 2026,
  Under review. Open the request"; "Approve the VR device transfer for Rahul Verma?"). The
  references stay in the addresses and in the services.

## 4. What was integrated

| Id       | Product                                                                                                                                                    | Where                                                          |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| SA shell | The V3 workspace shell (rail, Menu drawer below 1024 px, top line, XS account menu, Help & support); PU-15 and unknown records inside it                   | every `/admin` address                                         |
| SA-01    | Overview: the two figures, the category switch, the priority band, the queue groups; loading, failed, nothing waiting                                      | `/admin`                                                       |
| SA-02    | Requests: search, Status and Type, More filters, filter chips, sort, the table, no match, failed                                                           | `/admin/requests`                                              |
| SA-03    | Request decision: approve, smaller scope, request information, classification, the confirmation, decided, paused-blocked, validation, renewal, unknown     | `/admin/requests/{id}`                                         |
| SA-06    | Institutions: search, Status (with each figure), the table, no match, failed                                                                               | `/admin/institutions`                                          |
| SA-07    | Institution detail: plan band, What you can do (assign, pause / restore, a student's status), activity by format, people, history; every institution state | `/admin/institutions/{id}`                                     |
| SA-10    | Content › Updates: waiting, on hold, released                                                                                                              | `/admin/content/updates`                                       |
| SA-11    | Release or hold a correction: what changes, institutions using it, release / hold / lift hold; not yet approved, on hold, released                         | `/admin/content/updates/{id}`                                  |
| SA-12    | Content › All content: search, Workflow status, the stuck notice                                                                                           | `/admin/content/all`                                           |
| SA-13    | Content record: history, the stuck override with a reason; published                                                                                       | `/admin/content/records/{id}`                                  |
| SA-14    | Academic structure: areas and courses, add area, add course                                                                                                | `/admin/structure`                                             |
| SA-15    | Area and course records: rename, description, move (refused while people are filed)                                                                        | `/admin/structure/areas/{id}`, `/admin/structure/courses/{id}` |
| SA-16    | Platform roles: Vendors · Reviewers · Content Managers, register a holder                                                                                  | `/admin/roles`, `?tab=reviewers`, `?tab=content-managers`      |
| SA-17    | Role holder: assign scope, withdraw with a reason (inline), restore                                                                                        | `/admin/roles/{id}`                                            |
| SA-18    | Operations › Device transfers: forwarded, still with an institution, approved                                                                              | `/admin/operations/device-transfers`                           |
| SA-19    | Device transfer decision: approve a forwarded transfer; still with the institution; stale refusal                                                          | `/admin/operations/device-transfers/{id}`                      |
| SA-20    | Operations › Support: open, all                                                                                                                            | `/admin/operations/support`                                    |
| SA-21    | Support report: resolve with a note (required), reopen; resolved, reopened                                                                                 | `/admin/operations/support/{id}`                               |
| SA-22    | Operations › Access ending: ending within 15 days or recently ended, a status only                                                                         | `/admin/operations/access-ending`                              |

The behaviour is the product's own, unchanged: the services' reads, commands, validation,
refusals and stale checks; the session gate; the role permissions; the sample world and its
persistence (TE-6). Every word on the pages is the export's, or the product's where the export
has none (`state-copy*.ts`, each entry citing its basis). No service contract, role permission or
workflow changed; no backend, SSO or business rule was added; no sample record or preview state of
the export was imported.

## 5. Decisions and discrepancies

1. **Borrowed XS pieces replaced.** The export drew the XS account menu, Help & support and the
   signed-out page "until XS is delivered". The delivered XS components (`d9b7e87`) are used;
   their `sa-` placements are left out of `sa-scoped.css`.
2. **Business-rule words.** Three of the export's device-transfer sentences carry words the
   repository's business-rule scan forbids in copy (B8-03 "Decline / Reject 0", "0 shipping
   words"). The product says the same without them: "It doesn't send, collect or register a
   device." and the "There is no Decline;" clause left out (no Decline is drawn, T-32). The copy
   test pins each product sentence to the export's (`operations.test.ts`, "reworded for the
   business-rule scan").
3. **Order and notes.** SA-01 leaves out "Oldest first in each group" (the approved order lists
   requests newest first); the priority band keeps "Soonest deadline first, then the longest
   wait". SA-06 lists institutions by name and SA-20 reports oldest first, the services' orders
   (the export sorts its samples otherwise).
4. **What the services do not hold is not drawn.** SA-15 counts a course's experiments (the
   service answers a number, not the list the export links); SA-22 does not draw "Renewal
   approved — the term isn't changed here" or "· access paused" (no such facts); SA-21 has no
   "Where" row (the reporter's own detail has none either); SA-07 counts people without the
   export's sample sentence.
5. **Kept product states the export does not draw.** SA-12's stuck notice with "Show stuck
   records" and the "Resubmitted" row (M-3); SA-21 "Reopened by <name>" when the Super Admin
   reopened it; SA-03 "Decided … by <name>" when another person decided; SA-07 "1 student" in the
   singular; stale refusals in the repository's words. Each is a `state-copy` entry.
6. **Ways on.** SA-01's "Assign Institute Admin" opens SA-07, where Assign is the first action
   (the export opens the dialog in place); SA-07 lists only what waits on the Super Admin (an
   active institution's approved request is not offered as "Open request").
7. **Accessible names.** SA-14's area link reads "Open area <name>" (WCAG 2.5.3 label in name; the
   export's "Open the area <name>" does not contain its visible words).
8. **Focus.** Each dialog opens where the export puts it: the confirm button for release, hold,
   lift, override, restore and reopen (SA-21 Reopen moved to it in this package), the first field
   for the forms. After a client-side move focus goes to the page's H1; "Go to …" scrolls to the panel and focuses its heading without changing the address (the export's `goPanel`).
9. **Inline spacing as patches.** The export's inline spacings are patch V3P-12 (`rk-x-*`
   classes, each checked against the export's own `style=` value by `v3-provenance.test.ts`); the
   term track's data-driven width stays the recorded `TermTrack` scan exception.
10. **Shared components once.** The builders' near-identical pieces were merged: four form
    dialogs into the kit's `ConfirmDialog` (new `groups`, `children`, `initialFocus`,
    `submitOnEnter`), the view switches into `SwitchToolbar`, the go buttons into `GoButton`, the
    notes and quiet lines into `SectionNote` / `QuietLine`. `COMPONENT-EXTENSIONS.md` lists every
    Super Admin component, its classes, source view and tests.
11. **Test harness.** Two shared browser helpers were corrected, each with its own test:
    `expectNoAxeViolations` waits for finite animations to finish (it had measured contrast in a
    dialog's fade-in), and `reachAndClick` also hit-tests each line of a wrapped inline target (a
    V3 row link wraps in its 28 % column; the centre of its box can fall beside the words). Both
    still fail on what they are for: a covered, clipped or unscrollable target, a real contrast
    failure.
12. **Browser specs moved, not weakened.** The v46 Super Admin assertions in the shared journeys
    now read the V3 pages: a record is found by the address its link opens (the reference is never
    on the page), statuses by the kit's `.xr-st`, flashes by `.rk-notice--ok`. A check that the
    hidden reference had made vacuous (`not.toContainText('REQ-0042')`) now checks the link.
13. **Superseded v46 comparisons** are retired by name (148 for SA; 208 with XS), each under the
    V3 entry that replaced it (`V3-COMPARISON-MAP.json` `productScreens[].supersedes`), reported
    as `retired-by-v3` — never counted as passed, never masked.
14. **Role-layer cascade check (20 Oct 2026): no `sa-` difference, no patch.** The V3P-13 method (each element and longhand, the product's layered winner against the export's unlayered one — specificity, then order —, at 1440, 1024, 768 and 375, at rest and with hover / focus forced) over every reachable Super Admin state (85 `/admin` pages on three fixtures with each button's dialog, inline form, validation and outcome; about 3,580 states) finds no `sa-` rule that wins where a Refined B rule wins in the export: 87 of the 90 `sa-` rule parts matched an element and the other three cannot (`.sa-term-only` is not drawn; every read-only row opens with `<th scope="row">`, so `.sa-table--rows td:first-child` never matches). One XS-layer difference shows in the shell and is recorded, not patched (a shared XS surface, left for a separate XS check): the account-menu panel (`div.xs-menu.xs-nofocus`, `tabindex=-1`) once it matches `:focus-visible` (a press on the panel, then any key) keeps its 16 px corners, where the XS export's core `.xr :where(…, [tabindex]):focus-visible` (0,2,0) gives 6 px over `.xs-menu` (0,1,0).

## 6. What did not change

The V1 Public Landing and PU-14; every public page; every other role's pages and shells
(Institute Admin, Student, Faculty, Vendor, Academic Reviewer, Content Manager keep their v46
presentation; the XS screens stay as committed in `d9b7e87`); the domain, contracts, sample
platform and services; the role permissions and the session gate; the baseline pins
(`tools/board-capture/src/pinned.json`), `DEVIATIONS.md` and `BASELINES.md`. The foundation's
components were extended additively (new optional props, new components); none was replaced or
restyled, and no global token changed.

## 7. Tests and results

Every run used ports 3300 / 3400 / 3500; the owner's demo server on port 3000 was left running.

| Check                                       | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm verify` (final gate)                  | Run of 19 Oct 2026 (2,984 s): `format` PASS · `repository` PASS (46 checks; handoff 178/178; audit evidence 36/36; v46 copies 27/27) · `workspace` PASS · `bundle` PASS (2,124 built product files, 0 sentinels; test-hook bridge 6/6) · `browser` PASS · `parity` FAIL on the 7 legacy comparisons only (below).                                                                                                                                                                                                                                                                                    |
| Unit and integration                        | turbo build 12/12, typecheck / lint / test 40/40 tasks; 9,753 unit tests in 10 packages (web 6,392, ui 1,017, domain 787, contracts 781, config 379, sample-platform 320, api 38, validation 20, testing 14, database 5); `v3-provenance.test.ts` regenerates `sa-scoped.css` and checks each V3P-12 value against the export's `style=`; `v3-reference.scan.test.ts` checks both role exports (XS-v6 125, SA-v1 29 by its beside list), the register, the map and the scope boundary (the V3 layer is loaded only by `features/shared`, `features/admin`, the auth layout and the workspace route). |
| Browser, four widths (1440, 1024, 768, 375) | 3,334 Playwright tests passed (web 2,026, specimens 1,232, testing 76); 598 skipped by design, not counted. Before the gate, every web spec that touches the Super Admin (53 files) ran on the normal and test-hook builds at the four widths; its failures were the v46 assertions the V3 pages replace, moved as in §5 (12).                                                                                                                                                                                                                                                                       |
| Super Admin journeys                        | Sign-in with the return address → SA-02 search, filter, chip, sort → SA-03 request information (`package-1a/demonstration`); public request → SA-03 approve → payment → SA-01 → SA-06 → SA-07 assign, pause, restore → the Institute Admin (`package-1d/demonstration`, `package-1e/journey`); Flows A–F and the device chain in one world (`flows/walkthrough`); stuck override, hold and lift (`flows/alternates`); release, hold, governance and support with reopen (`phase-6/demonstration`); sample-world persistence across tabs (`phase-7/prototype`).                                       |
| Navigation, refusal and seams               | Every rendered link of the link-target ledger followed client-side, the Super Admin's rail and Menu drawer included (`foundation/navigation`); another role's address in the Super Admin's shell and the Super Admin's addresses in other shells show XS-06 (`foundation/workspace-guard`, `cross-role`); unknown records show the GL-04 message (each SA spec); the session gate (`foundation/session-gate`, `package-1a/session`).                                                                                                                                                                 |
| Keyboard, focus and accessibility           | Axe WCAG 2.2 AA, no invisible focus target and 24 × 24 px targets on every SA state in the browser suites; dialog focus and return, the H1 after a client-side move, the error summaries, "Go to …" moving to the panel heading (`phase-6/*`, `package-1e/accessibility`).                                                                                                                                                                                                                                                                                                                           |
| Shared test helpers                         | `packages/testing` self-tests 76 passed at four widths, including the wrapped-link reach (positive) and the covered wrapped link (still fails).                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Visual parity (v46 harness)                 | 77 of 82 tests; 770 comparisons: 496 within tolerance, 59 on the deviation register, 208 retired by name for the XS and SA screens (148 SA), 7 unregistered (the legacy exception below); 0 masked; 0 external requests.                                                                                                                                                                                                                                                                                                                                                                             |
| V3 product captures                         | 35 Super Admin cases × 4 widths (140 captures) on the normal build plus SA-18 to SA-21 on the test-hook build: no overflow, no clipped text, all Public Sans weights, no console error, no internal reference (except a seeded Content Manager sentence quoted on SA-11, §8); reviewed side by side with the export renders — `V3-COMPARISON-MAP.json` `productEvidenceSA`.                                                                                                                                                                                                                          |
| Integrity                                   | `design/handoff-v46` 178 OK · `design/v3-refined-b` 46 OK · `roles/XS-v6` 125 OK · `roles/SA-v1` 29 OK (beside list) · protected original checkout unchanged (`1b090c9`, 98 paths) · no change under `app/(public)` or the root layout.                                                                                                                                                                                                                                                                                                                                                              |

**Legacy exception, not new:** the seven B1 artwork comparisons of the public pages
(`b1-01-f0-hero-figure`, `b1-01-f0-formats`, `b1-03-f0-whole-frame`, `b1-03-f2-experiments`,
`b1-05-f0-preview`, `b1-05-f0-whole-frame`, `b1-05-f6-poster`) still fail against their 14 Oct
pins, as recorded at the foundation and at XS. Their product captures are byte-identical to the XS
verify run's. Not re-pinned, not masked.

## 8. Limits and items for the owner

- The export's files still read "OWNER APPROVAL PENDING"; the owner's approval is the prompt-11
  instruction and "XS is accepted. Start the Super Admin intake …". Its open decisions (SA-01
  priority ordering, the institution number on SA-19, response-time targets, reminders) stay open:
  the product shows no reminder, no response-time target and no Decline.
- Sign-in stays the prototype stand-in (sample accounts, any password, no SSO).
- The differences in §5 are recorded in the state-copy register (`provisional`) for the owner's
  review; none is a new business rule.
- The v46 Super Admin copy that the V3 pages replaced (the SA-06 / SA-07 section of
  `copy/institutions.ts`, the SA-10 / SA-11 part of `copy/release.ts`, the v46 Overview-attention
  words in `copy/operations*.ts`) is now read only by its own unit tests. It is left in place and
  can be removed in a follow-up clean-up.
- SA-11 quotes a correction's "what changes and why" as the Content Manager wrote it; two seeded
  corrections of the sample world were written as "Correction UPD-0003." / "Correction UPD-0004."
  (sample text that the Content Manager's own screens and tests use), so that quote shows a
  reference. The page itself names no reference; rewording the seed is the owner's call.
- `apps/specimens` keeps the foundation's SA specimen as committed (its inline `marginBottom: -12`
  is the specimen harness's own; the product uses `SectionHead tight`).

## 9. How to review it

Start the product build (`pnpm --dir v2/apps/web build`, then `pnpm --dir v2/apps/web exec next
start -p 3300`) and open `http://localhost:3300/sign-in`. Seeded account: **Arjun Mehta, Super
Admin — `arjun.mehta@wilp.example`, any password** (the sample sign-in). Other seeded accounts used
at the seams: Kavya Nair, Content Manager (`kavya.nair@wilp.example`); S. Kulkarni, Institute Admin
of Deccan Institute of Technology (`s.kulkarni@deccan.example`). Meera Iyer becomes Godavari's
Institute Admin only when the Super Admin assigns her in the session (after the public request
for Godavari is approved and paid); she is not a seeded account. A reload keeps the sample world
in this browser and signs the tab out (TE-6); "Reset demo data" (`/prototype/reset`) starts it
again.

A short route through every sidebar destination (one tab, about ten minutes):

1. Sign in as Arjun Mehta → **Overview** (`/admin`): the figures, the category switch (try
   Requests, then All), the priority band; at 768 px or less the rail becomes **Menu**.
2. **Requests**: search "konark", Status "Under review", sort by Received, remove the filter chip;
   open Konark Polytechnic → choose "Request more information", Send with the field empty (the
   error summary), then with a question → Back to requests.
3. **Institutions**: Status "No Institute Admin" → Sahyadri → What you can do: Assign Institute
   Admin (Assign with the fields empty, then cancel); open Deccan → Pause access with a reason →
   Restore access; History shows both.
4. **Content** › Updates: the On hold and Released views; open a released correction. › **All
   content**: "Show stuck records" → DC Motor Speed Control → the override panel (Move status with
   no reason is refused; cancel).
5. **Academic structure**: open Chemical & Process → a course → Rename (cancel); Add area (cancel).
6. **Platform roles**: Reviewers → Prof. A. Menon → Withdraw a scope (the inline form; cancel).
7. **Operations** › Device transfers (empty views) › Support (open a report; Resolve with a note)
   › Access ending (Malnad: "Reminder due" is a status only).
8. **Help & support** in the rail foot; the account menu (top right) → Sign out.
9. An unknown record: type `/admin/requests/REQ-9999` into the address bar. The new page load asks
   for sign-in again (TE-6), then the page reads "This page isn't available" with Back to Overview
   and Help & support. (Another role's address inside the Super Admin's shell, and the Super
   Admin's addresses in another role's shell, are proved by the browser suites, which move there
   client-side.)
