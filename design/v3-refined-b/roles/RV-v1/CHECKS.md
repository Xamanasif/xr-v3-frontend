# Checks · Academic Reviewer · FINAL — OWNER APPROVED

Two runs are reported. The **20 October** full suite ran on the refined design as the owner reviewed it. The **21 October** run re-verified the exact bytes in this package after the post-acceptance correction that took internal record IDs out of reviewer-facing labels. Raw results for the 21 October run are in `checks/results/`; see `checks/README.md` for what happened to the 20 October raw files.

## Environment

| Item | Value |
| --- | --- |
| Browser | headless Chromium 141 through Playwright, device scale 1 |
| Design runtime | the Claude Design type's `dc-runtime.js` served as `support.js`, sha256 `3f160299…dffe0f10` (recorded in `FOUNDATION-LOCK.json`) |
| Font | each board requests Public Sans from Google Fonts; that host is blocked in the sandbox, so the harness answered with a local copy of the same family (`@fontsource-variable/public-sans` 5.3.0, OFL). No font file is in this package. Canvas frames carry a ~24 px allowance below the measured content. |
| Accessibility engine | axe-core 4.10.3 (20 October run) |

## 21 October — re-verification of the exported bytes

| What | Result |
| --- | --- |
| **Every board rendered** at its own frame width and full height | **65 of 65**: no sideways scroll, no console errors, no failed requests, every frame fits its content. Three frames shrank where the ID line left a row and were resized (`RV03-375`, `RV05`, `RV05-375`). `checks/results/boards-render.json` |
| **Internal IDs in reviewer-facing text** — the rendered text of every board, visible copy plus `aria-label`, `title`, `placeholder`, `alt` and `value`, scanned for SUB-/UPD-/REQ-/ACC-style IDs | **0 on 62 of 62 reviewer boards.** The only boards that still name records are `Main` and `Coverage`, which are integration documentation, not product UI |
| **End-to-end smoke** at 1440 and 375: open the item waiting longest, add an outcome, be refused a return with no reason, record the return, queue drops to 3, Reviewed by me grows to 9, reopen a decided item read-only | **32 passed, 0 failed.** Includes: the breadcrumb names the experiment; search still finds an item by its hidden record ID; course codes, vendor names and format badges still shown; console clean. `checks/results/smoke.json` |
| **Source checks** | **15 of 15.** `checks/results/static.json` |

The source checks, in full: base CSS byte-identical to the locked foundation; `rv.css` additive (all 380 selectors carry an `rv-` class, no `:root` or custom property, 208 `rv-` classes and every one used); every static class in the 65 boards defined; no decision identifiers (OD-, LD-, PC-, T-) in visible copy; no record ID printed by the template on any reviewer screen, with the single remaining `{{ r.ref }}` hole being the shared support reference; record IDs still carried in the data and the route proposals; search still matching on the record ID; `canvas.json` complete, frames non-overlapping, each board's declared preview size equal to its frame; `Main` linking all 64 other boards; no `href="#"` placeholder.

## 20 October — full suite on the refined design

| Suite | Widths | Result |
| --- | --- | --- |
| Board renders | each board's own width | 65 of 65 clean |
| Journeys | 1440 · 1024 · 768 · 375 | **918 passed, 0 failed** (229 · 229 · 230 · 230) |
| Keyboard only | 1440 · 1024 · 768 · 375 | **80 passed, 0 failed** (20 each) |
| Reflow at 320 px (WCAG 1.4.10) | 320 | 11 of 11 |
| Long text (long experiment, vendor and person names) | 375 · 768 · 1440 | 21 of 21 |
| Links and controls | 1440 · 1024 · 768 · 375 + index | **146 passed, 0 failed** (36 · 36 · 37 · 37, plus 6 index checks) |
| Separators (no divider starting or ending a wrapped line) | all boards + long text at 4 widths | 90 pages, none found |
| Layout polish (wrapped button labels, clipped text, overlapping siblings, target size) | all boards + long text at 4 widths | 93 pages, none found |
| Automated WCAG 2.1 A and AA (axe-core) | each board's own width | **0 violations**; the 87 contrast nodes axe could not judge were measured directly and all pass AA, the lowest 5.94:1 |
| Source checks | — | 22 of 22 |

The journeys covered: the desk and its side cards; the return path with validation and focus; approval with its dialog; outcomes needed; the re-check with undo; update approve and return; filters and tabs with arrow keys, Home and End; the shell, account menu, Help and report; every list state; the stale-version and already-decided refusals; and the decided-item layouts.

## What the 21 October correction changed

Internal record IDs were removed from: the Review queue row (the ID under the course; the format badges stay), the Reviewed by me row, the identity card on RV-03, RV-04 and RV-06, the breadcrumb current page (now the experiment name), and the search placeholders and no-match hints, which no longer offer "ID". `rv.css` lost the `.rv-id-ref` and `.rv-cell-ref .rk-small` rules with them. Nothing else was touched: no records, rules, routes, permissions, scope or wording of decisions.

## Flagged exceptions — internal IDs that remain on purpose

| Where | Why |
| --- | --- |
| `Main.dc.html` and `Coverage.dc.html` name records (SUB-0070, UPD-0006 and others) | integration documentation on the canvas, not product UI; the owner asked for the two data discrepancies to be documented by ID |
| Help & support shows a support reference (SUP-0214) | the reviewer is given it so they can quote it; a borrowed shared (XS) surface, not one of the six reviewer screens — say if it should be hidden too |
| A VR delivery card shows `NSS-CW-VR-1.0` | the vendor's own build name, not an internal platform record ID |

## NOT TESTED

- **Inside the claude.ai Design canvas** (Play, Tweaks panel, frame scrolling). The published files are the same bytes and the same runtime family as tested; your first open of the canvas is this check.
- Screen readers (VoiceOver, NVDA, TalkBack). Names, roles and focus order were checked in the DOM and by axe only.
- Safari, Firefox, real touch devices, forced colours, 200% text-only zoom, print.
- Real network fonts (see Environment).
- The full journey, keyboard, link, reflow, long-text and axe suites were not re-run on 21 October: the sandbox holding them was reclaimed. The re-verification above covers rendering, the ID policy, the end-to-end flow and the source rules on the exported bytes; `checks/README.md` says how to re-run the full set.

## Findings left open

| Finding | Effect | Next step |
| --- | --- | --- |
| At 375 the *New submissions* tab label takes two lines | by design; the tabs keep an equal height | none |
| Narrow queue rows hide the sender line | pre-existing kit behaviour, carried over unchanged | none |
| Shared surfaces are borrowed renderings | the role cannot be called assembled | swap in the Shared Surfaces components at assembly |
| UPD-0006 scope (OD-B7-15) and the SUB-0070 outcome count | sample-data discrepancies, treated without choosing a winner | verify against the live records at integration (`ROLE-STATUS.md`, `SCENARIOS.json`) |
| Not yet seen in the real canvas host | see NOT TESTED | open the canvas and press Play on the live board |
