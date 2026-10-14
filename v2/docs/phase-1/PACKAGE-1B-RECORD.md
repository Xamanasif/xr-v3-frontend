# Phase-1 Package 1B — Public Landing, Engineering Areas and Experiment Catalogue (record)

|                   |                                                                                                                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Package           | Phase-1 Package 1B (owner authorisation, 14 Oct 2026): PU-01, PU-02, PU-03, PU-04, PU-05, PU-06, PU-14 only                                                                                                         |
| Branch / worktree | `v2/frontend-v46` at `/Users/mymac/Desktop/AR-VR-frontend-v46`, from `ea0665d` (Package 1A CONDITIONAL PASS)                                                                                                        |
| Design authority  | `design/handoff-v46/` (frozen, 178/178): B1-01 … B1-05; B8-06 (design-to-code handoff: PublicShell, PublicMenuSheet, FilterSheet); B1-09 for the sign-in's back link                                                |
| Safety backup     | `~/Downloads/XR-frontend-v46-ea0665d.bundle` (branch `v2/frontend-v46` at `ea0665d`; `git bundle verify` OK, complete history; SHA-256 `f9d8520a…f40c`, sidecar `.sha256`), made and verified before implementation |
| Environment       | macOS (Darwin 25.5.0), Node 24.21.0, pnpm 12.3.4, Playwright Chromium only                                                                                                                                          |

This record is kept outside `docs/v46/` (the audit evidence there must stay byte-identical,
repository scan; so `docs/v46/handover/METHOD_LEDGER.md` still lists the three reads as
"Phase 1" — the delivered state is `PACKAGE_DELIVERIES` in `@xr/contracts/draft`). It states what
Package 1B built, the exception it runs under, the evidence and what stays open. Nothing of
Packages 1C–1E was started.

## 1 · Screens and routes

| Screen                                                   | Board                                                                  | Route                                                                            | Feature                             |
| -------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------- |
| PU-01 Landing                                            | B1-01, B1-02 (area explorer)                                           | `/`                                                                              | `features/public/pu-01-landing/`    |
| PU-14 How institutional access works                     | B1-01 "For institutions"                                               | `/#for-institutions` (a section of PU-01; its heading takes focus)               | `pu-01-landing/landing.tsx`         |
| PU-02 Engineering areas                                  | B1-03 "PU-02"                                                          | `/areas`; `/courses` → `/areas` (307; redirect row 1)                            | `features/public/pu-02-areas/`      |
| PU-03 Area                                               | B1-03 "PU-03"                                                          | `/areas/[areaId]`                                                                | `features/public/pu-03-area/`       |
| PU-05 Course                                             | B1-03 "PU-05"                                                          | `/courses/[courseId]`                                                            | `features/public/pu-05-course/`     |
| PU-04 Experiment catalogue                               | B1-04                                                                  | `/experiments?area=&course=&format=&q=&sort=&view=` (URL state, `PU-04.address`) | `features/public/pu-04-catalogue/`  |
| PU-06 Experiment detail                                  | B1-05                                                                  | `/experiments/[experimentId]` (`?format=` from a one-format filter, B1-05 f5)    | `features/public/pu-06-experiment/` |
| Public shell (PublicShell, PublicMenuSheet, FilterSheet) | B1-01 … B1-05 header, menu sheet; B1-04 filter sheet; B8-06 components | the `(public)` layout and the PU-15 not-found page                               | `features/public/shell/`            |

Route manifest (`src/nav/routes.ts`): 44 page files (38 + 6 `(public)` pages), `(public)/layout.tsx`,
9 static redirects (+ `/courses`). `PUBLIC_SCREENS_WITH_PAGES` lists the six public pages; the
workspace manifest is unchanged. The PU-15 not-found page now renders inside the public frame, and
its "Browse experiments" leads to the real `/experiments` (link-target ledger `built`); XS-01's
"Back to experiments" renders and leads to `/` (P1-17 "Follow the href").

## 2 · TE-8 — the temporary frontend-on-sample-services exception

Approved by the owner for Package 1B only (`OPEN_DECISIONS.md` Part E, `decisions/README.md`).

- **What it allows.** The `(public)` pages are client components: each reads the tab's one
  browser-only sample world through the existing composition root (`platform/`), the typed ports
  and the query layer (`queries/catalogue.ts`, `queries/selection.ts`). The route files only pass
  the raw `params` on; nothing reads the sample world on the server.
- **Limits.** One world per tab (ADR-0004): every move inside the public pages, and between them,
  the sign-in and back, is client-side (`demonstration.spec.ts` asserts one document). A document
  load (typing an address, reload) starts a fresh world — TE-6 (browser persistence) stays
  unauthorised, so the selection lives for the tab only. Unknown areas, courses and experiments
  show the public not-found page from the client with **HTTP 200** (the server cannot know the
  sample world's ids); unknown addresses keep the real 404. The pages have no server-rendered
  content, so this is **not** the production SSR / SEO architecture and must not be presented as
  such. The permissive sample sign-in (P1-01 / DV-3) is not to be deployed publicly; no backend
  was built or deployed.
- **Removal trigger.** An HTTP adapter callable from server components: the public pages then
  return to server rendering (with real 404s for unknown ids) behind the same routes and markup.
- **Untouched.** TE-4 (payment), DV-5 (request-status access) and TE-6 (browser persistence) stay
  unauthorised; nothing requests, pays or activates access.

## 3 · Services and contracts

| Method                                                                                       | Status                     | Contract / tests                                                                                                                                                                                                                  |
| -------------------------------------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CatalogueService.listAreas`                                                                 | **built** (sample adapter) | Areas in Academic-structure order with ≥ 1 published experiment; counts derived from published experiments; no write (world version unchanged)                                                                                    |
| `CatalogueService.getArea`                                                                   | **built**                  | Courses with published experiments and their formats; an area with nothing published, or an unknown id → `not-found` (CRS-09; OD-B7-13 open)                                                                                      |
| `CatalogueService.getCourse`                                                                 | **built**                  | Course card, its area (`area: { id, name }`, PC-30) and its published experiments in catalogue order; a course with nothing published opens with none (B1-03 f6 / f7); a course of a hidden area, or an unknown one → `not-found` |
| `searchCatalogue`, `getExperiment`; `SelectionService.get` / `add` / `setFormats` / `remove` | reused (Phase 0)           | `searchCatalogue` gains the optional `featured` filter (PC-32) and the course-code order's title tie-break (B1-04's live sort); catalogue entries and the experiment page carry `artworkKey` (PC-31)                              |

- Ledger: `PACKAGE_DELIVERIES` / `DELIVERED_METHODS` in `@xr/contracts/draft` (phase P1, Package
  1B, with the authorisation). The sample adapter's `deferred()` refuses to stand in for a
  delivered method; 41 Phase-1+ methods still reject as deferred.
- Contract suite: four new adapter-independent cases (`catalogue:structure`,
  `catalogue:after-publication` — Flow E publishes and the new experiment is counted for everyone —
  `catalogue:featured`, and `catalogue:nothing-published` — the Super Admin adds an area and two
  courses: the new area and its course stay hidden, a new course of a listed area opens empty); the
  session case honours delivered methods.
- Provisional register: PC-30 (course read names its area), PC-31 (experiment `artworkKey`),
  PC-32 (`featured`), each with source and reversal. The hierarchy stays Programme → Course →
  Experiment → WEB / AR / VR / MR (no Module layer); Published, institutional access, individual
  grant, activity and completion stay separate — no public read carries an access, entitlement or
  completion field (`catalogue.test.ts` pins the experiment page's keys).
- Seed (`seed/catalogue.ts`, `seed/spine-start.ts`): the boards' artwork keys for the three areas and
  the twelve experiments, and the featured list (`FEATURED`, B1-01's four, P1-22 interim). No new
  record, no new experiment, no count is stored: every number on the pages is derived from the
  world. `listInstitutions` and Package 1D are not touched.

## 4 · Evidence

Final `pnpm verify` on the code as committed: **VERIFY PASSED** in 523 s (run
`2026-10-14T15-28-46-770Z-verify`). Only documents changed after it — this record's figures and
`tools/board-capture/DEVIATIONS.md`, regenerated from that run — and they were re-checked with
prettier and the repository scans.

| Step       | Result                                                                                                                                                                                                                  |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| format     | prettier clean                                                                                                                                                                                                          |
| repository | 32 checks · handoff 178/178 · audit evidence 36/36 · v46 copies 27/27 · scans (1 recorded exception, OD-1B-04), deny-list, fence wiring                                                                                 |
| workspace  | turbo build 12/12, typecheck / lint / test 40/40 (`--force`) · **4,082 unit tests** (Package 1A: 3,820): web 1,162 (+246), sample-platform 154 (+12), contracts 723 (+3), ui 829 (+1); the other six packages unchanged |
| bundle     | 757 product files (1A: 658), 0 test-seam or harness sentinels; the test-hook build carries the bridge (4/4 markers)                                                                                                     |
| browser    | **1,947 passed** (1A: 1,874; web 812, was 739), 0 failed; 641 skipped, not passed (1A: 614 — the new width-gated tests); Chromium only                                                                                  |
| parity     | 70/70 tests · **566 comparisons** (1A: 487): 469 within tolerance, 97 on the register, **0 unregistered**, 0 masked, 136/136 board references, 0 external requests; not closed by the owner: DEV-21…DEV-30 (§6)         |

Package-1B tests:

- Unit (web): the public features (`features/public/public.test.tsx` — every screen's drawn,
  loading, failed, empty and not-found states through `faults().failNext`, the menu sheet, the
  filter sheet, the selection panel's pick / in / change / remove and last-format states, URL
  state), `pu-04-catalogue/catalogue-view.test.ts` (OR inside a facet, AND across, counts, chips,
  groups, the address round trip), `copy/public.test.ts` (the drawn phrases checked verbatim
  against B1-01 … B1-05), `nav/public-nav.test.ts`, and the route manifest and link-target ledger
  tests. Sample platform: `handlers/catalogue.test.ts` (12) and the delivered / deferred pipeline
  test. Contracts: the four catalogue cases and the provisional register (32 items).
- Browser (`e2e/package-1b/`): `public.spec.ts` — every drawn B1-01 … B1-05 state at 1440, 1024,
  768 and 375 and on both sides of each breakpoint (599 / 600, 1023 / 1024, 1359 / 1360), each
  through `checkState` (axe WCAG 2.0 / 2.1 / 2.2 A and AA, one level-1 heading, no invisible focus
  target, 24 × 24 px targets, no developer surfaces, no Slice-1 markup, no sideways scroll), the
  loading, empty and failed states, focus after each client move, the menu and filter sheets
  (modal, inert background, Esc, focus return, WCAG 2.4.11 per option), keyboard use of the area
  explorer; plus the updated PU-15 and sign-in specs.

Demonstration (owner step 9): `e2e/package-1b/demonstration.spec.ts` runs the eleven steps in one
tab of the **product build** (no test hooks, no boot descriptor) at 1440 and at 375 and asserts one
document throughout — Landing → Areas → Mechanical & Manufacturing → Thermodynamics & Heat Transfer
→ Browse experiments → search "exchanger", chip removed, VR filter (the sheet at 375) → Shell-and-Tube
Heat Exchanger (`?format=vr`, "Back to VR experiments") → its WEB / AR / VR formats and "Not
available in MR." → Add to selection (WEB + VR) → "More about access" → `/#for-institutions` with
its heading focused → Sign in → "Back to experiments" → the Landing, and the catalogue still marks
the experiment as selected (the same world). The same journey was walked by hand in the desktop
app's browser pane on `next start` (port 3000), at desktop width and at 375. Nothing on the way
claims a request, a payment or institutional access.

Independent review (one bounded pass, a separate agent, read-only; it re-ran the public unit
tests, the web typecheck and probe tests in a scratch folder): no high-severity finding; ten
findings, all addressed —

| #   | Finding                                                                                               | Outcome                                                                                                                                                                                         |
| --- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Featured stayed "loading" for good when only the structure read failed                                | Fixed: the cards show without area tags; unit test                                                                                                                                              |
| 2   | Change formats and Cancel dropped focus to the page                                                   | Fixed: focus goes to the panel heading (B1-05 `focusPanel`); browser test                                                                                                                       |
| 3   | Explorer Previous / Next disabled under focus at an end; a sheet closed by widening left focus hidden | Fixed: focus moves to the other button; a sheet closed by widening moves focus to `main` (menu and filter sheet); browser tests                                                                 |
| 4   | Filter sheet: Esc and the Tab loop lost after a click on the sheet's text                             | Fixed: the dialog takes focus on such a click (`tabIndex −1`, not a tab stop) and Tab re-enters at either end; browser test (text click, Tab, Shift+Tab, Esc) and unit test (Esc, backdrop)     |
| 5   | The explorer would crash with no area to show                                                         | Fixed: the landing shows the plain list, the explorer renders nothing; unit test                                                                                                                |
| 6   | `getCourse` served a course of a hidden area (links back to a not-found area)                         | Fixed: `not-found`; handler test and contract case `catalogue:nothing-published`                                                                                                                |
| 7   | The swipe counter's 568 px track test disagreed with the CSS's 600 px page switch                     | Fixed: swipe mode is read from the swipe hint's own display, i.e. the CSS breakpoint                                                                                                            |
| 8   | A late echo of the catalogue's own address write could look like an outside change                    | Not changed: Next 16 applies its address updates in transitions, so an older address does not arrive after a newer one; the outside-change path now has a browser test (header link, then Back) |
| 9   | `featured` and `artworkKey` widen existing shapes; the featured lead is a claim about the data        | Recorded for the owner (§7 item 9); the claim is pinned by a test                                                                                                                               |
| 10  | No adapter-independent case for a hidden area, its course, or an empty course                         | Fixed: `catalogue:nothing-published`                                                                                                                                                            |

## 5 · Accessibility and responsive corrections

Each is a product correction recorded where it lives; none changes a drawn word.

- **Area explorer list semantics.** B1-02 draws `li[role=group]` slides inside `ul.xp-ex-track`
  (axe `list`); the product gives the track `role="none"`, so each slide is a named group of a
  region with ←/→/Home/End and a live "n of 3" (`explorer.tsx`).
- **Filter panel (PF-22).** B1-04's sticky `aside.xp-filters` is taller than the viewport at
  1024 × 768 (955 px): its lower options could not be reached or seen while focused. The panel is
  static (`.xp-cat > .xp-filters{position:static}`).
- **Filter sheet (PF-22).** The sticky foot covered the last options as focus reached them
  (WCAG 2.4.11): `scroll-padding-bottom:80px` on the sheet panel; the browser test checks every
  option is unobscured when focused.
- **Target-size helper.** `e2e/support/screen-checks.ts` `smallTargets` ignores a target only
  when another element covers its centre (`elementFromPoint`), so occluded controls are judged where
  they can be reached; the WCAG 2.4.11 check above covers the occlusion itself.
- **PF-22 drawn-scale fixes** (the live boards' own class rules lose to later layers): area-card
  title 24 / 30 px, skeleton media tint, hero and preview art `contain`, the dark-hero and sign-in
  top-row back links in white, the selection panel's options and note at the drawn size.
- **Skip link and focus.** The public frame has the shared skip link; after every client move
  focus goes to `main#main`, and a hash target (`#for-institutions`) focuses its heading
  (`route-focus.ts`).

Responsive: the header shows the nav at ≥ 1024 px and Menu below; the menu sheet and the filter
sheet close themselves when the window widens past 1024 px; no sideways scroll at 375 on any state.

## 6 · Visual parity (new comparisons, owner review)

`e2e/parity/b1-package-1b.parity.ts` (17 tests): **79 comparisons** at the drawn frame widths, 58
within tolerance and 21 on the register — B1-01 f0 / f1 / f2, B1-02 f0 / f2 / f4, B1-03 f0 / f1 /
f2 / f7 / f8 / f9, B1-04 f0–f4 / f7–f10, B1-05 f0–f8.

The measured differences are registered, **not approved** (`tools/board-capture/DEVIATIONS.md`,
regenerated from the verify run):

| ID     | Difference                                                                                                                          | Status       |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| DEV-26 | The public ways into the Selection and the request (PU-07, Package 1C) are not rendered (P0-35 extended)                            | owner review |
| DEV-27 | The spine-start world holds no preview link: PU-06 shows B1-05's poster state, not the default frame's preview                      | owner review |
| DEV-28 | PU-06 "How it runs" for VR / MR uses the domain's B6-07 words where B1-05 / B1-01 draw "…supported headset." / "…supported device." | owner review |
| DEV-29 | Concept art as the live boards' `div.xp-bgart` where B1's static frames use `<img>`: SVG edges rasterise differently (0.1–0.4 %)    | owner review |
| DEV-30 | B1-04 f9 "Show 7 experiments": the canvas wrapper overflows the button; the product centres the label inside it                     | owner review |

Prior baselines:

- The 77 Phase-0 and Package-1A pins are kept; the diff adds 21 pins and removes none. DEV-01 …
  DEV-25 keep their statuses, masks (none) and tolerances; only DEV-21's "actual" and DEV-23's
  "product" text are updated (below).
- **One Package-1A pin re-measured, after review:** `b1-09-f0-whole-frame`. Package 1B renders the
  sign-in top row's "Back to experiments" (B1-09 draws it; its destination now exists), so the frame
  now also shows the DEV-23 back icon. Its deviations become DEV-21 + DEV-23 + DEV-24 and its
  fingerprint is updated (4 lines in `pinned.json`); DEV-21's "actual" and DEV-23's "product" text
  say so. No other 1A comparison changed.
- No pin is orphaned by Package 1B: the verify run observes 97 of the 98 pins. The one it does not
  is the Phase-0 `05-super-admin-help-built-sidebar`, unobserved since Package 1A and left for the
  owner (1A record §6 item 5), not deleted.
- **Earlier tests updated (P1-16).** Four Phase-0 browser specs asserted that `/` (and
  `/experiments`, `/areas`) answer 404 "until PU-01 is built": `e2e/smoke.spec.ts` (`/` now 200 with
  no foundation UI; the not-found checks run on `/system`), `e2e/foundation/routes.spec.ts` (the
  public pages answer 200 — unknown ids included, TE-8 — and every other outside address still
  404s), `e2e/harness/test-seam.spec.ts` (the product build boots its own world on the landing,
  signed out, with no bridge) and `e2e/platform/test-hook-bridge.spec.ts` (the full-load probe
  now uses `/selection`, PU-07, which still 404s). The PU-15 and sign-in specs follow the built
  links.
- **A regression the first final verify caught, fixed:** the in-page-link focus added for PU-14
  (`route-focus.ts`) also ran in the workspaces and moved focus from SA-03's decision panel to its
  heading after "Go to decision" (768 px). It now runs in the public shell only and never after a
  link that handled its own click; the SA-03 spec passes at every width.

## 7 · Open items for the owner, and decisions before Package 1C

1. **DEV-26 … DEV-30** (owner review): none is approved by the harness; DEV-21 … DEV-25 stay open.
2. **State copy:** 21 new provisional entries in `copy/state-copy.ts` (Public shell, PU-01, PU-03,
   PU-04, PU-05, PU-06): the undrawn loading / failed / not-found words, the hero caption rule, the
   featured tag, the course chip without a code, the address and format-context rules, and
   `Public shell.links-not-rendered` (DEV-26).
3. **OD-1B-01 — Selection and Request access (Package 1C).** PU-07 and its ways in (header
   Selection (n) and Request access, the menu sheet rows, the hero and For institutions buttons,
   PU-06 "Go to selection", the sign-in card's "Request institutional access") wait for 1C; the
   selection already persists for the tab and is shown in the panel and on catalogue rows.
4. **OD-1B-02 — "How it runs" wording (DEV-28):** one sentence per format for every screen.
5. **OD-1B-03 — Preview data (DEV-27):** whether the sample world gets a preview link.
6. **OD-1B-04 — "What learners can do after this experiment."** B1-05 (also B1-12, B1-13) draws
   the sentence; B8-03 / Appendix F §7.6 count "Learner" as a role-name variant. The drawn words
   stay, under a recorded repository-scan exception (`packages/config/src/scans/exceptions.ts`)
   that ends with the owner's choice.
7. **P1-22 featured experiments:** a seeded list (B1-01's four, in order) under PC-32; curated or
   derived stays open.
8. **OD-B7-13 / CRS-09:** an area with nothing published is hidden from `/areas`, its page is
   not-found and its courses are hidden with it (their pages would lead back to a missing area); a
   course of a listed area with nothing published opens, as B1-03 draws.
9. **Contract widening (review finding 9):** besides the three new reads, Package 1B widened two
   existing shapes — `searchCatalogue`'s optional `featured` input (PC-32, backed by a seeded fact)
   and `artworkKey` on the experiment record and the catalogue outputs (PC-31). Both are
   provisional and reversible; please confirm or redirect. B1-01's drawn featured lead ("…including
   one experiment available in all four formats") holds for the seeded list (a sample-platform
   test pins it) and goes with P1-22.
10. **TE-8 limits** (§2): client-rendered public pages, not-found for unknown ids answered with HTTP
    200, a fresh world on every document load; TE-4, DV-5 and TE-6 unchanged.
11. **Coverage limits:** Chromium only (P0-28; WebKit / Firefox wait for G-5); parity is a
    same-machine interim (VD-18).

Package 1C is not started and waits for the owner's authorisation.
