# CM integration record — Content Manager on foundation XR-V3-RB-1.0

The fourth owner-supplied V3 role export, the Content Manager (CM), integrated into the normal
product on `v3/refined-b-ui` after the Entry & shared screens (XS, `d9b7e87`), the Super Admin
(SA, `cbe6f6d`, its stylesheet check `cc16212`) and the Vendor (VE, `9856946`), through pack
prompt 11. The 9 owned ids: CM-01 … CM-09. The excluded id CM-10 stays excluded: nothing links to
it. No other role was imported.

## 1. Base and safety

- Worktree `/Users/mymac/Desktop/AR-VR-v3-ui`, branch `v3/refined-b-ui`, HEAD `cc16212`, clean
  tree before the integration.
- The owner's demo server (`next start -p 3300`, serving this worktree's `apps/web/.next` build)
  was left running and its build was never replaced: no `next build` ran in this worktree. Its
  build bundles every workspace package into its own chunks, so the source changes here do not
  reach it. Product and test-hook builds ran only in an isolated verification copy (an APFS copy of
  the worktree with its own git repository, in the session's scratch folder) on ports 3310 / 3410
  / 3520; the test-hook development server of this worktree used 3510 (its own `.next-test-hooks`
  folder).
- The protected original checkout `/Users/mymac/Desktop/AR-VR` was only read.
- The V1 Public Landing (PU-01, PU-14), every public page, the XS screens, the Super Admin screens
  and the Vendor screens were not modified.
- `design/handoff-v46/` (178 OK), `design/v3-refined-b/pack` (46 OK), `roles/XS-v6` (125 OK),
  `roles/SA-v1` (29 OK) and `roles/VE-v1` (85 OK) were not modified.

## 2. Source and approval

| Item         | Value                                                                                                                                                                                                                                                                                                                                                                   |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source       | `XR-V3-CM-Role-source_1.zip`, 280,324 bytes, SHA-256 `4df0557675e61901c519b79e4fd9ebc8726d4f9978d927c52c00f35477e738d6`: “Content Manager — final role design”, Claude Design canvas version 20 (`1792491048-0c95`), foundation `XR-V3-RB-1.0`, 20 Oct 2026                                                                                                             |
| Screenshots  | `XR-V3-CM-Role-screenshots_1.zip`, 57,659,064 bytes, SHA-256 `98dc57aa6da6fa84c8a2e51e35db364e951a2e21db804865d3f378454b8e2894`: 69 states × 4 widths, 85 boards, overlays, journeys, focus and before/after images (kept by the owner, not copied)                                                                                                                     |
| Revision     | `CM-v1` names this archive. It supersedes the version-16 checkpoint `XR-V3-CM-Role-source.zip` (the six anchors redesigned, CM-05/06/07, the CM-08 detail and the PU-06 frame still to follow), which was refused for integration on 20 Oct 2026 and not imported                                                                                                       |
| Coverage     | `START-HERE.md` / `ROLE-STATUS.md`: 9 of 9 designed ids, DESIGN COMPLETE · CONNECTED PREVIEW COMPLETE; `COVERAGE.md` classifies every screen and state as REDESIGNED or REVIEWED AND UNCHANGED; nothing waits for propagation                                                                                                                                           |
| Foundation   | `XR-V3-RB-1.0`: its `FOUNDATION-LOCK.md/.json` (fourth lock layout, `baseFilesShipped`) name the ten base hashes of `V3-FOUNDATION-RECORD.md` §2; `core.css`, `rb.css`, `rb-kit.css` are the foundation's bytes (checked by file and by lock); one role stylesheet (`cm.css`, `cm-` classes, no new token) and the borrowed XS sheet (`xs-borrowed.css`, `xsb-`)        |
| Intake files | `START-HERE.md`, `ROLE-STATUS.md/.json`, `FOUNDATION-LOCK.md/.json`, `COVERAGE.md`, `COMPONENT-EXTENSIONS.md`, `HANDOFF.md`, `CHECKS.md`, `LINK-MAP.json`, `SCENARIOS.json`, `checks/` — all present                                                                                                                                                                    |
| Integrity    | 140 files copied byte for byte to `design/v3-refined-b/roles/CM-v1/`. The export ships no checksum list, so the one recorded at intake sits beside the folder (`roles/CM-v1.SHA256SUMS.txt`): 140 OK. Nothing was added inside the export                                                                                                                               |
| Approval     | The owner, 20 Oct 2026, after the checkpoint was refused: “I will approve the anchors, let the design propagate to CM-05, CM-06, CM-07, the CM-08 detail and the PU-06 frame, and send the final complete package”, then this package. The export's own files read “OWNER VISUAL ACCEPTANCE PENDING”: the owner's browser review of this integration is that acceptance |
| Dependency   | The export borrows the skip link, account menu, Help & support, the refusal page and the signed-out page (`xsb-*`, “ASSEMBLY PENDING XS”). XS is integrated (`d9b7e87`); the delivered XS components replace the borrowed ones                                                                                                                                          |

Not product UI and not imported: the live root's sample world, scenarios, presets (`load:*`,
`fail:*`, `savefail`, `codes-fail`, `stale`, `stale-wd`, `rv-*`, `sa-*`), clock and handlers
(`Main.dc.html` script), the scenario handoff box (`cm-dock*`), the public-page handoff frame
(`cm-pub*` — “View the public page” opens the product's real PU-06 page), the borrowed XS sheet,
the 85 inspection wrappers, `canvas.json`, the design runtime.

## 3. How it sits in the product (ADR-0010)

- **The Content Manager's workspace is in the V3 shell.** `V3_SHELL_ROLES` holds the Super Admin,
  the Vendor and the Content Manager: the rail (Overview, Ready to publish with its gold count,
  Content library, Updates, Course codes, with the export's glyphs), “Help & support” in the rail
  foot, the Menu drawer below 1024 px, the top line with today on the sample clock, the XS account
  menu. The rail count is worded as the export words it (“3 experiments ready to publish”, singular
  at 1: `V3_RAIL_COUNT_WORDS`); the v46 shells keep board 06's words. Every other role keeps its
  v46 shell.
- **Stylesheet.** `packages/ui/src/styles/v3/cm-scoped.css` is generated from the export's `cm.css`
  (the same selector-only transform; the generator checks the foundation lock in its fourth layout,
  `baseFilesShipped`, the role sheet's hash and the recorded checksums) in a new cascade layer
  `xr.v3.cm` between `xr.v3.ve` and `xr.v3.patch`. Left out: the scenario handoff box (`cm-dock*`)
  and the public-page frame (`cm-pub*`), with the one grouping rule they emptied. `xs-borrowed.css`
  is not generated.
- **Icons.** The export's `cmi-*` glyphs: 17 were already in the kit, five more are v46 registry
  glyphs now named in the kit (`readyToPublish`, `contentLibrary`, `updates`, `courseCodes`,
  `externalLink`), one is new (`cross`, a check not met); flag, shield, sign-out and swap are only
  drawn by borrowed or preview-only pieces.
- **Components.** `packages/ui/src/v3/cm.tsx` holds what several Content Manager screens draw (the
  stage track, the version change, the identity band and its track, group heads, course names,
  in-cell labels, the Changed tag, wide aside buttons, quoted reasons, flush format badges); one
  module per screen group holds the rest (`cm-lists` — CM-01/02/04/09, `cm-decision` — CM-03/05,
  `cm-correction` — CM-06/07/08). The app's shared presentation models
  (`features/content-manager/shared/`: status words and tones, stage-track steps, version change,
  record facts, the date line) compute only from the existing reads. `ConfirmDialog` gained two
  additive options (`holdWhileBusy`: Cancel disabled, Escape ignored and focus on the title while
  the command runs; `tightBody`); other roles' dialogs are unchanged. `COMPONENT-EXTENSIONS.md`
  lists everything.
- **Patches.** V3P-14: the export's inline spacings that product elements need (16 rules, each on
  the element the export styles, with the value it writes; every one of the template's 30 `style=`
  attributes is accounted for). The cascade check found no correction to make: where a foundation
  rule would win in the export, `cm.css` already raises its own selector (`.rb .cm-tile-a`,
  `.rb .cm-catlist-t`); checked in 44 states at four widths, at rest, hovered and focused.
- **Shared pages in the V3 shell.** Help & support, Not your workspace, the account menu and the
  skip link are the XS components.
- **Loading.** The four list reads (Ready to publish, Content library, Updates, Course codes) have
  the export's loading and couldn't-load states (“Try again” reads the list again and focuses the
  title); the Overview and the record pages keep the application's page loading (HANDOFF §4).

## 4. What was integrated

| Id       | Product                                                                                                                                                                                                                                                                                                   | Where                                                             |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| CM shell | The V3 workspace shell (rail with the Ready to publish count, Menu drawer below 1024 px, top line, XS account menu, Help & support)                                                                                                                                                                       | every `/content-manager` address                                  |
| CM-01    | Overview: the publishing pipeline (both lifecycles, eight counts, each a link), the decision desk (Publish next, checks and formats; corrections that need her), With others, the catalogue by course, calm                                                                                               | `/content-manager`                                                |
| CM-02    | Ready to publish: decision cards (days waiting, the four checks, the longest wait marked), oldest / newest first, something to resolve, empty, loading, couldn't load                                                                                                                                     | `/content-manager/ready`                                          |
| CM-03    | Publication decision: identity band with the stage track, the publication gate, the catalogue preview, choose, send back (reviewer or vendor), the Publish confirmation and its busy state, published, sent back, stale, missing prerequisite, read-only                                                  | `/content-manager/decisions/{submissionId}`                       |
| CM-04    | Content library: figures, the four views with counts, who holds them, rows grouped by course, search, course filter, chips, no match, empty, an open correction's chip, loading, couldn't load                                                                                                            | `/content-manager/library` (`?tab=`, `&course=`)                  |
| CM-05    | Published experiment: identity band (open correction, version change, track), live catalogue entry, delivery cards, history, the Corrections panel (start, join, Open update), released today, back from a correction, View the public page                                                               | `/content-manager/published/{experimentId}`                       |
| CM-06    | Edit catalogue details: the one draft pre-filled from the live record (or the open one joined), the arrival notice, the summary focused                                                                                                                                                                   | `/content-manager/updates/{updateId}`                             |
| CM-07    | Edit a delivery link: the one draft with the live delivery (or joined), the arrival notice, the web link focused                                                                                                                                                                                          | `/content-manager/updates/{updateId}`                             |
| CM-08    | Updates grouped by who must act (version change, mini track, outcomes), empty, loading, couldn't load; the correction detail in every state (draft, returned, errors, saving, saved, save failed, the send dialog, in review, awaiting, on hold, lifted, released, the withdraw dialog, withdrawn, stale) | `/content-manager/updates`, `/content-manager/updates/{updateId}` |
| CM-09    | Platform course codes grouped by engineering area with live experiments per code: edited, duplicate refused, saving, save failed, saved, loading, couldn't load                                                                                                                                           | `/content-manager/course-codes`                                   |

The behaviour is the product's own: the `production` service's reads and commands
(`getContentManagerOverview`, `listReadyToPublish`, `getPublicationDecision`, `publish`,
`sendBack`, `getLibrary`) and the corrections service's (`getPublishedExperiment`,
`openCorrection`, `saveCorrection`, `sendForAcademicReview`, `withdrawUpdate`, `listUpdates`,
`getUpdate`), the course-code read and save, their validation, refusals, stale checks
(`expectedRev`) and repeat-press protection; the role permissions; the sample world and its
persistence (TE-6); what other roles see. No service contract, permission, workflow or publication
rule changed; no backend was added; no sample record or preview logic of the export was imported.
No Content Manager page shows an internal reference (SUB-, UPD-, REQ-, ACC-, DTR-, SUP-) in its words, its accessible names or its tab titles (§5, 11); the references stay in the addresses and the services.

## 5. Decisions and discrepancies

1. **Borrowed XS pieces replaced.** The delivered XS components draw the skip link, account menu,
   Help & support, Not your workspace and the signed-out page; `xs-borrowed.css` is not loaded.
2. **Computed from existing reads, nothing invented.** The CM-01 pipeline counts come from the
   library's view counts and the updates' states; days waiting count to the session's sign-in
   instant (the sample clock); stage dates are the records' own (a date the record does not hold
   is left out); the catalogue by course and live experiments per code come from the platform
   course-code read; the CM-08 list reads the library's published rows for each experiment's
   course and live version.
3. **Interactions as the approved design draws them.** No decision is preselected on CM-03 (“Choose
   a decision”); Send back is completed in the decision panel and sends at once (v46 had a “Send it
   back?” dialog; the export has none); Publish keeps its confirmation dialog. The CM-04 views are a
   switch (buttons with `aria-pressed`, the pressed one kept in sight on phones), not tabs. After
   Send for academic review or Withdraw, focus goes to the state notice.
4. **Stale and moved-on.** The sample service answers a publication from another tab with
   `invalid-state` (not `stale-version`): both show the export's “This page is out of date” with
   “Show where it is now”, and the page keeps what was typed. A correction approved meanwhile is
   refused with the export's words. Other refusals keep their existing words.
5. **CM-04 search stays the service's.** The service matches name, ID or course code; the
   placeholder and the no-match line say “Experiment or course”: no vendor (the service does not
   match one) and no ID (no reference is shown, item 11), where the export says “Experiment, ID,
   course or vendor” (state copy `CM-04.search.placeholder`, `CM-04.search.no-match`). The
   course filter is new and runs on the page (`course=` in the address).
6. **Facts the read models do not hold are not drawn.** The reviewer of an update in review (the
   update names none until one decides: “the Academic Reviewer”); the export's resubmission note
   text; a publisher other than “you” unless the record names one; the Preview row when the
   submission has no preview label.
7. **Navigation context.** The product cannot know which list opened CM-03: the breadcrumb follows
   the state (open or decided here: Ready to publish; read-only: Content library at the view that
   lists it); the rail marks Ready to publish for CM-03.
8. **Kept product states the export does not draw.** “No update open” on an unknown update; a
   dialog's “service unavailable” alert; CM-09 Save with nothing changed sends nothing. The v46
   send-back result titles (“Sent back to the Academic Reviewer / to the vendor”) have no V3
   counterpart: the result reads “Sent back by you on …” with the status pill, as the export does.
9. **Left out on purpose.** Classes no sheet defines (`cm-lane`, `cm-utag`); the export's icon
   sprite (the kit draws each icon inline); the drawer brand's `padding-top: 0` (the V3 shell's
   brand has none).
10. **Superseded v46 comparisons** are retired by name under the CM-shell entry
    (`V3-COMPARISON-MAP.json`), reported as `retired-by-v3` — never counted as passed, never
    masked.
11. **No internal reference (owner's visual-review correction, 20 Oct 2026).** The export kept
    submission and update IDs visible in this role (its HANDOFF §5); the owner's review asked for
    the Super Admin's approved rule instead: no SUB-, UPD-, REQ-, ACC-, DTR- or SUP- reference in
    any Content Manager page's words, accessible names, dialogs, breadcrumbs or tab titles. Rows,
    links, dialogs and crumbs are named by content (“Continue the update to Induction Motor
    Loading”, “Withdraw the update to Induction Motor Loading?”, “Update on hold”); official
    course codes, experiment names, vendor names and format labels stay. The references stay in
    the addresses, the services, the state and the records (state copy `CM-lists.no-reference`, `CM-03.references`, `CM-05.references`, `CM-08.no-reference`). Text the sample world holds as a person
    wrote it — a seeded correction's “what changes and why”, “Correction UPD-0006.” — is quoted as
    written, as on the Super Admin's SA-11; rewording the seed is the owner's call.

## 6. What did not change

The V1 Public Landing and PU-14; every public page; the XS screens (`d9b7e87`), the Super Admin
screens (`cbe6f6d`) and the Vendor screens (`9856946`) — the shared code touched is additive (the
role shell's role set and count words, `ConfirmDialog`'s two options, icons, a patch layer entry);
every other role's pages and shells (Institute Admin, Student, Faculty and Academic Reviewer keep
their v46 presentation); the domain, contracts, sample platform and services; the baseline pins,
`DEVIATIONS.md` and `BASELINES.md`.

## 7. Tests and results

Builds, the browser suites and the final gate ran in the isolated verification copy (ports 3310 /
3410 / 3520); the owner's demo server (3300) was left running on its own build.

| Check                                       | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm verify` (final gate)                  | Run of 20 Oct 2026 (3,090 s) on the integrated tree: `format` PASS · `repository` PASS (46 checks; handoff 178/178; audit evidence 36/36; v46 copies 27/27) · `workspace` PASS · `bundle` PASS (2,130 built product files, 0 sentinels; test-hook bridge 6/6) · `browser` PASS · `parity` FAIL: only the 7 legacy comparisons below                                                                                                                                                                                                                                                                             |
| Unit and integration                        | turbo build 12/12, typecheck / lint / test 40/40 tasks; 10,322 unit tests in 10 packages (web 6,857, ui 1,121, domain 787, contracts 781, config 379, sample-platform 320, api 38, validation 20, testing 14, database 5); `v3-provenance.test.ts` regenerates `cm-scoped.css`, names the emptied group and checks every V3P-14 value against the export's `style=` markup; `v3-reference.scan.test.ts` checks the four role exports (XS-v6 125, SA-v1 29, VE-v1 85, CM-v1 140 by its beside list), the register (44 migrated), the map and the scope boundary; `surface.test.ts` records the 64 CM kit exports |
| Browser, four widths (1440, 1024, 768, 375) | 3,350 Playwright tests passed (web 2,042, specimens 1,232, testing 76); 602 skipped by design, not counted. Before the gate the whole web suite ran on the normal and test-hook builds at each width (1440: 555 passed, 7 skipped; 1024 and 768: 494 / 68; 375: 499 / 63); 17 specs that the migration broke at 1440 (flows, demonstrations, review-update, structure, release, package-1a) were updated to the V3 markup with their coverage kept                                                                                                                                                              |
| Content Manager journeys                    | Publish from Ready to publish (confirmation, busy, result, the public page) and send back to the reviewer or the vendor (`phase-5/cm-decision`, `phase-5/demonstration`, `flows/walkthrough` E4, `flows/alternates` E-alt1/E-alt2); the Overview, Ready to publish, the library and course codes in every state (`phase-5/cm-lists`); start or join a correction from the published experiment, save, send, withdraw, returned, hold and lift, release (`phase-6/cm-correction`, `phase-6/review-update`, `phase-6/release`, `phase-6/demonstration`, `flows/alternates`)                                       |
| Navigation, refusal and seams               | Every rendered link of the link-target ledger followed client-side, the Content Manager's rail and Menu drawer included (`foundation/navigation`); the skip link first on a document load (product build); Not your workspace in her shell and her addresses in other shells (`foundation/workspace-guard`)                                                                                                                                                                                                                                                                                                     |
| Keyboard, focus and accessibility           | Axe WCAG 2.2 AA, no invisible focus target and 24 × 24 px targets on every Content Manager state in the browser suites; error summaries, the state notice and the dialogs' title taking focus; Cancel disabled and Escape ignored while a command runs                                                                                                                                                                                                                                                                                                                                                          |
| Visual parity (v46 harness)                 | 77 of 82 tests; 770 comparisons: 478 within tolerance, 59 on the deviation register, 226 retired by name for the XS, SA, VE and CM screens (8 CM: the Content Manager's v46 shell on Help and on a report), 7 unregistered (the legacy exception below); 0 masked                                                                                                                                                                                                                                                                                                                                               |
| V3 product captures                         | 21 Content Manager cases × 4 widths (84 captures) on the normal build, the window as tall as the page: no overflow, no clipped text, all Public Sans weights, no console error; reviewed side by side with the export renders — `V3-COMPARISON-MAP.json` `productEvidenceCM`                                                                                                                                                                                                                                                                                                                                    |
| Cascade and inline spacings                 | 44 states at four widths, at rest, hovered and focused: no element where a `cm.css` rule beats a more specific Refined B rule that wins in the export; every V3P-14 value confirmed in the browser                                                                                                                                                                                                                                                                                                                                                                                                              |
| Integrity                                   | `design/handoff-v46` 178 OK · `design/v3-refined-b` 46 OK · `roles/XS-v6` 125 OK · `roles/SA-v1` 29 OK · `roles/VE-v1` 85 OK · `roles/CM-v1` 140 OK (beside list) · protected original checkout unchanged (`1b090c9`, 98 paths) · no change under `app/(public)`, the root layout, or the XS, Super Admin and Vendor screens' code                                                                                                                                                                                                                                                                              |

**Legacy exception, not new:** the seven B1 artwork comparisons of the public pages
(`b1-01-f0-hero-figure`, `b1-01-f0-formats`, `b1-03-f0-whole-frame`, `b1-03-f2-experiments`,
`b1-05-f0-preview`, `b1-05-f0-whole-frame`, `b1-05-f6-poster`) still fail against their 14 Oct
pins, as recorded at the foundation, XS, SA and VE. All 79 public-page product captures of this run
are byte-identical to the VE verify run's. Not re-pinned, not masked.

**After the owner's no-reference correction (§5, 11), 20–21 Oct 2026**, on the corrected tree in
the isolated copy: `pnpm verify` — `format`, `repository`, `workspace` (10,340 unit tests: web
6,874, ui 1,122, …) and `bundle` PASS; `browser`: 3,346 passed and 4 failed — one cross-role step
(`phase-6/review-update` (b)) at the four widths still found a correction card by the reference in
its text; it now finds the card by its link's address, and that spec then passed at the four widths
on the same builds (3 of 3 each). Parity, run as the gate runs it on the same builds: specimens
32/32; web 45/50 — the same 5 tests and 7 legacy comparisons as above, all 79 public-page captures
byte-identical to the VE run's. A sweep of every Content Manager screen, its dialogs and tab titles
on a normal build finds no reference except the seeded “Correction UPD-000n.” quotes; the 21
capture cases × 4 widths: no overflow, no clipped text, no console error, no reference (the seeded
quote on the on-hold and released correction pages excepted).

## 8. Limits and items for the owner

- The export's files read “OWNER VISUAL ACCEPTANCE PENDING”; this integration rests on the owner's
  instruction of 20 Oct 2026 and the final package. The browser review is the acceptance.
- The export's open policies keep the treatment it designed (HANDOFF §4): single-manager scope,
  OD-B6-09 (what a correction may change), OD-B6-08 (version label), OD-B6-06/07 (withdraw and
  join), OD-B6-13 (a platform code saved at once), OD-B7-01 (hold reason shown), OD-B7-04 (what a
  hold blocks: not designed), OD-B7-05 (whether the public page shows the version).
- The differences in §5 (3)–(7) are recorded in the state-copy register for the owner's review.
- Candidates to merge later: `CmUpdatesHead` and `CmPageHead` draw the same markup; `CmCodesFailed`
  and `CmSaveFailed` the same structure; `CmFormatBadges` could become a `flush` option of the kit's
  `FormatBadges`. The change comparison (`cm-cmp*`) is proposed by the export for the shared kit
  (RV-04, SA-11).
- The link-target ledger (`nav/link-targets-p5/cm-lists.ts`) records CM-01's correction-row
  “Continue” as secondary; the page draws it as the gold primary when nothing is ready to publish
  (as the export does). The ledger's one-primary check runs on a world with ready items.
- Sign-in stays the prototype stand-in.

## 9. How to review it

The owner's demo on port 3300 serves the build from before this commit and was not replaced.
To see this commit, serve a build of it on another port (as this integration did, from a separate
copy of the tree), or stop the 3300 server and rebuild it here:
`pnpm --dir v2/apps/web build`, then `pnpm --dir v2/apps/web exec next start -p 3300`; open
`/sign-in`. Seeded account: **Kavya Nair, Content Manager — `kavya.nair@wilp.example`, any
password** (the sample sign-in). Seeded accounts at the seams: Prof. A. Menon, Academic Reviewer
(`a.menon@wilp.example`); Arjun Mehta, Super Admin (`arjun.mehta@wilp.example`); Anil Shetty,
Vendor (`anil.shetty@northline.example`). No account is created by this route. A reload keeps the
sample world in this browser and signs the tab out (TE-6); `/prototype/reset` starts it again.

A short route through every Content Manager screen (one tab, about fifteen minutes):

1. Sign in as Kavya Nair → **Overview**: the publishing pipeline (both rows; each tile opens its
   list), Needs your decision (Transient Cooling marked Publish next; Induction Motor Loading
   returned with the reviewer's words), With others, In the catalogue by course. At 768 px or less
   the rail becomes **Menu**.
2. **Ready to publish** (the gold count in the rail): the decision cards, days waiting and checks;
   **Newest first** / **Oldest first** → **Open decision** on Transient Cooling.
3. **Publication decision**: the band and its stage track (“Your step”), the publication check,
   the catalogue preview. Press **Publish** with nothing chosen (“Choose a decision”); choose
   **Send back** and press it (the error summary); choose **Publish** → **Publish** → the
   confirmation (Cancel disabled while it publishes) → the published result → **View the public
   page**, then back.
4. **Content library**: the four views (Ready, In review, With vendor, Published) with who holds
   them; search “venturi”, then “zzz” (no match → Clear filters); the Course filter; open
   **Distillation Column** (published).
5. **Published experiment**: the band, the live catalogue entry, delivery cards, history; in
   **Corrections**, **Edit catalogue details** → the new draft (arrival notice, the summary
   focused) → change the summary, a reason and a new version label → **Save draft** → **Send for
   academic review** (its dialog) → read-only, In academic review → **Withdraw update** (a reason
   is required) → Withdrawn (closed stages dashed).
6. **Updates**: Need you · With others · Closed; open **Induction Motor Loading** (returned, the
   reason first), **Boiler Drum Level** (on hold, the reason shown) and **Orifice Plate Metering**
   (released: Live before against Released).
7. **Course codes**: give Fluid Mechanics “ME ZG523” → **Save codes** (refused: duplicate, focus
   to the summary) → **Undo changes**; give it a unique code → **Save codes** (saved).
8. **Help & support** in the rail foot; the account menu (top right) → Sign out.
