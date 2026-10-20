# CHECKS — Content Manager · Design V3 Refined B

What was actually rendered, exercised and only read, on the build in this package: canvas **“XR V3 · Content Manager · Refined B”, version 20** (id `1792491048-0c95`), the final role design for the owner's visual acceptance. `project/` here is byte-for-byte what the canvas holds. All numbers below come from one verification run on 20 Oct 2026 after the last design change; the machine results are in `checks/results/`.

Labels: **RENDERED** — drawn by a real browser and measured or looked at. **LOGIC TESTED** — driven with real clicks, typing and keys, and the result read back from the page. **SOURCE CHECKED** — established by reading the files. **NOT TESTED** — not done; say so before relying on it.

## How it was run

| | |
| --- | --- |
| Browser | Chromium 141.0.7390.37 driven by Playwright 1.56.0, Node 22.22.0 |
| Runtime | The Design type's own runtime (`artifact-type/dc-runtime.js`, sha256 `3f160299989dc595cf434dac7b7f3e6fd20ed015a2d99e075c3eac09dffe0f10`), served unmodified as `support.js` |
| Libraries the runtime loads | React 18.3.1, ReactDOM 18.3.1, @babel/standalone 7.29.0 — npm copies, accepted by the runtime's integrity checks |
| Font | Public Sans variable (@fontsource-variable 5.3.0) answers the Google Fonts request, which the build machine can't reach. The canvas itself loads Public Sans from Google Fonts. |
| Files | The canvas files exactly as published; each check renders either a canvas wrapper or `Main.dc.html` with `screen` / `record` / `preset` / `scenario` props |

This is a faithful local render, not the Claude Design host: the host's canvas, Play mode and board chrome were not driven (see NOT TESTED).

One rule that matched nothing anywhere (`.cm-h3row`, left over from version 16) was removed from `cm.css` while the run was going. A rule that matches no element cannot change a render; the 85 boards were rendered again on the exact shipped files afterwards, and those are the board results and images in this package.

## RENDERED

| What | Result |
| --- | --- |
| **All 85 inspection boards** at their exact canvas frame size, from the wrapper files | 80 page boards: every frame was re-measured after the last change and fits its content exactly. The 5 overlay boards (P01 Publish confirmation, C05 Send dialog, C11 Withdraw dialog, X01 Account menu, X02 Drawer · 375) are window-sized frames by design: the overlay is shown in a 900 / 812 px window over a longer page. On all 85: no horizontal overflow (no element outside the frame, page width equals frame width), no console error or warning of any kind, no failed request, and every board has its page heading. |
| **Width sweep** — 69 states × 1440 / 1024 / 768 / 375, full page (276 renders) | No horizontal overflow, no console error or warning, no failed request. The 69 states cover every owned screen and its subviews, including the list loading and couldn’t-load states, the back-from-correction notice and the empty sample world. The pipeline goes from four-up to a compact four-up below 720 px and to one row per stage on a phone; decision cards and correction cards stack below 600 / 700 px; identity-band facts go two-up below 760 px (first and last full width on a phone on CM-05 and CM-08); side panels go two-up below 940 px and stack below 640 px; tables reflow to labelled blocks; the rail becomes Menu below 1024 px. |
| **Overlays** at 1440 and at 375 (10 renders) | Publish, Send for academic review and Withdraw dialogs, the drawer and the account menu stay inside the window, no overflow. |
| **Design review** | Every board was looked at during the final review — at 1440, 1024, 768 and 375, in contact sheets and at full size where detail mattered — and the new and changed states at 1440 and 375. Two layout refinements came out of it (the band's action keeps its place with a long status line; phone facts take the full width where long) and the list loading and couldn’t-load states were added. Before/after images of the version-20 changes are in the screenshot archive. |
| **Keyboard focus** (6 captures) | The kit's 2 px focus ring is visible on the skip link (1440 and 375), a rail item (white on navy), a decision choice, a library view button at 375 and a course-code field. |
| **Smallest text** | Every text under 13 px is a format-code badge (WEB · VR · AR · MR): 12 px inside list rows (kit `.rk-fmts .xr-fmt`), 12.5 px elsewhere (kit `.xr-fmt`). Census of all visible text on the 69 sweep states at 1440 and 375. |
| **Unresolved values** | On the 69 sweep states and the 5 overlays, the runtime reported no template value it could not fill (its “never resolved — rendered as empty” warning) and logged nothing else. |
| **Clipped-text detector** | Flags only the visually hidden inline labels (“How it runs”, “Device needs”, “Delivery”, “Status”) that exist for screen readers on wide layouts. It finds no visible text cut by its box. |

## LOGIC TESTED

### Journeys — 11 journeys, 243 steps, 0 failed

| Journey | Steps | What it proves |
| --- | --- | --- |
| J1 · first publication | 35 | Overview is the role entry; rail badge 3 → 2; Ready to publish shows three decision cards, the longest wait first and marked; Open decision → CM-03; four checks; error summary takes focus; Publish dialog keeps focus inside (Tab ×8, Shift+Tab ×4), Escape returns focus to Publish; confirm → result with focus; Content library Published count 13, search count and chip; CM-05 history says no one was given access; public handoff frame and back; the Overview count follows. |
| J2 · correction from a published record | 43 | Edit catalogue details creates UPD-0007 pre-filled from live, focus on the summary, entry explained; Changed tag; send refused without reason or version, and with the live version label; Save draft; leave and return through Updates: the draft is listed under Need you and Continue opens it with the edits kept; the live record does not change and its band shows where the open correction is; Edit delivery link joins the same update (no second update); send dialog; read-only in review, Withdraw still offered; Academic Reviewer approves → awaiting; no Release anywhere in product UI; Super Admin releases → 1.1 live with both changes; a new correction can start. |
| J3 · returned correction | 12 | Overview Continue opens the returned update with the reason first; resend; history keeps both; hold with a reason the Content Manager can read; on hold the live 1.0 stays; lift; release shows the corrected text. |
| J4 · platform course codes | 16 | Six courses in three engineering areas; duplicate code refused with focus on the summary and a link to the field; a valid code saves and appears in the library course band, published record, public frame and Ready cards; failed save keeps the edit; Try again. |
| J5 · shell, shared surfaces, refusals | 36 | Menu at 768, drawer keeps focus (Tab ×9), Escape returns focus; drawer link moves focus to the new heading; library switch from the keyboard; filter with no match and Clear filters; account menu, Escape; Help & support, report form pre-filled, empty report refused, SUP-0186 sent; Sign out → signed-out page, Sign in → Overview; out-of-role address → refusal with one way back; stale decision refused and re-read (the identity band then reads Published); save failure keeps edits; missing prerequisite — Publish not offered, Send back preselected, refused without recipient and reason, then sent back; withdraw needs a reason; withdraw after an unseen approval refused and re-read. |
| J6 · more controls | 22 | Sort oldest/newest, the longest wait stays marked; Send back to the vendor with field references (offered only for the vendor) → result, leaves Ready to publish, With vendor view, read-only page keeps the reason; chip removal returns focus to search; Undo changes; Go to the web link focuses the field; returned again shows the new reason first; withdraw from returned keeps the reason; a new correction can start; Help → report detail. |
| J7 · list details | 4 | An unlabelled draft shows the live version and “No version label yet”, with no placeholder. |
| J8 · re-check | 9 | Send back to the Academic Reviewer: no field references; reason required with focus; result with focus; badge 2; In review view (“Re-check you asked for”); Overview With others shows the re-check; read-only decision page keeps the reason. |
| J9 · keyboard | 16 | Send and Withdraw dialogs: focus inside, Tab ×7 and Shift+Tab ×3 stay inside, Escape closes and returns focus to the opener, closing changes nothing; at 1440 and 375 the first Tab shows “Skip to main content” and Enter moves focus to the main content. |
| J10 · busy states (new) | 25 | While each command runs, the button that started it reads Publishing… / Sending… / Saving… / Withdrawing… and is disabled, then the result arrives: Publish, Send back, Save draft, Send for academic review, Withdraw, Save codes, Send report. In the Publish and Send dialogs Cancel is disabled and Escape does nothing while it runs, and focus stays inside; in the Withdraw dialog Cancel is disabled; Undo changes waits while codes save. |
| J11 · list loading and couldn’t load (new) | 25 | Ready to publish, Content library, Updates and Course codes: loading shows an announced status and a skeleton, without rows or figures; couldn’t load says “Nothing has changed. Try again.” without rows or figures; Try again brings the list back (3 cards, 12 published rows, 4 corrections, 6 courses) with focus on the page title; leaving and coming back loads it again. |

Each journey's count includes one last step: every page it opened (38 pages across the eleven journeys) is checked for any console error or warning, unfiltered. None was logged.

**What the version-20 changes did to the journeys.** No assertion was dropped. J10 and J11 are new. The busy-state work found and fixed one real defect: pressing Cancel or Escape while Publish, Send or Withdraw was running closed the dialog as if nothing had happened, and the command then completed anyway. Cancel and Escape now wait for the result.

### Link crawl — 265 clicks from 24 starting states, 0 failed

Every visible control that declares a destination was clicked from a fresh copy of its starting state and the page it landed on was read back (`LINK-MAP.json`):

- 208 landed on their declared destination — including the eight pipeline stages and the catalogue-by-course links on the Overview;
- 5 landed on the intended page under another ID, by design: Edit catalogue details and Edit delivery link (CM-06, CM-07) open the correction draft in CM-08, and Sign in (XS-01 handoff) returns to the Overview;
- 52 were correctly blocked by an open account menu or drawer (the same controls were clicked from the state without the overlay).

From each of the 20 starting states inside the workspace, and from the drawer at 768, all six rail destinations — Overview, Ready to publish, Content library, Updates, Course codes, Help & support — were clicked and landed. The public handoff frame and the signed-out page are outside the workspace and have no rail, by design.

## SOURCE CHECKED

- `core.css`, `rb.css`, `rb-kit.css` are byte-identical to the owner pack (`FOUNDATION-LOCK.json`). `cm.css` and `xs-borrowed.css` define no custom properties and use only tokens the kit defines. Every rule targets a role class (`cm-` or `xsb-`); a few are scoped under the kit's shell root for specificity (`.rb .cm-wide`, `.rb .cm-tile-a`, `.rb > .cm-pub`, `.rb .xsb-skip`, `.rb .xsb-item`, `.rb-top .xsb-acctwrap`, `.rb > .xsb-out`). Kit elements are sized only inside role containers, as listed in `COMPONENT-EXTENSIONS.md`; no rule restyles a kit class on its own.
- Every `cm.css` selector (279) matches markup on at least one of the 85 boards, except two that match only in the live preview: the “With the vendors” owner chip (library With vendor view, also rendered in the sweep) and the field inside the dashed Scenario handoff box (hidden on boards).
- `Main.dc.html`: no `href="#"`; every link routes through a handler to a declared destination or jumps to a real section or field; every button has a handler. No `alert`, no `console.log`, no external links or images; apart from what the design runtime loads for itself, the only network requests are Google Fonts.
- No CM-10, “Academic groupings” or “Governance settings”. No Release, Hold or Lift control outside the dashed Scenario handoff box (also logic-tested in J2).
- No checkpoint, approval-pending or propagation wording in any shipped project file or canvas note.
- The Super Admin decision to hide internal IDs is not extended: SUB-, UPD- and SUP- references stay visible, as in v46.
- No V1 Public Landing or PU-14 file is in the canvas or this package. The React frontend was not touched.
- Sample facts: the sample world inside `Main.dc.html` is identical to the version-15 world, record by record (`checks/results/world-check.txt`), and equals `SCENARIOS.json`. Course areas, live-experiment counts and waiting times are computed from those records. Copy added in side panels and states restates rules already in v46 or in the V3 seeds.
- Focus and motion: the kit's `:focus-visible` ring and `prefers-reduced-motion` rules (including the skeleton shimmer) cover every role element; the role stylesheets override neither.
- Published canvas equals this package: the same 92 files with the same sizes (listed after publishing version 20), and `Main.dc.html` and `cm.css` read back byte-identical.

## NOT TESTED

- **The Claude Design host itself** — the canvas, Play mode, board chrome, zoom and comments. The owner's first click (Play on the live role preview board) is the first host test.
- Screen readers (NVDA, JAWS, VoiceOver, TalkBack). Only the DOM semantics, names, live regions and focus order were checked.
- Browsers other than Chromium, touch input, 200 % text zoom and forced colours.
- Google Fonts delivery itself: the local copy of the same Public Sans family stood in for it.
- Anything across roles: by contract the other roles' decisions are scenario handoffs here, not live links.

## Open findings, not fixed

1. **Small text-link targets (kit patterns).** Row titles, breadcrumbs, group links, the Overview's “Open” links, error-summary links and quiet links on message pages are text links 17–22 px tall (`rk-rowlink`, `rk-crumbs`, `rb-link`, `rk-errsum` links). Each stands apart from other targets and table rows are clickable as a whole, but they are under the 24 px minimum and the Design guidance of 44 px for touch. The base kit is locked, so this is for the kit owner to decide once for every role.
2. **Library views on a phone.** With the last view pressed, the switch scrolls so that view is fully visible and the previous one shows only its count at the left edge; the kit's fade is on the right only.
3. **Out-of-date pages keep their actions.** After a stale refusal the Publish or Withdraw button stays; pressing it again is refused again with the same notice, and Show where it is now re-reads. Hiding actions while out of date would need a shared pattern.
4. **Logo slot.** The rail shows the kit's labelled “Official WILP logo” slot, as on the V3 references; the logo asset is not in the pack.
5. **Focus while a dialog command runs.** The disabled confirm button gives up focus, so focus is placed on the dialog title until the result arrives. A screen reader would announce the title again rather than the working label (not tested with one); an announced status for long-running commands would need a shared pattern.

None of these blocks export: they are kit-level or shared-pattern decisions recorded for the integration owner.
