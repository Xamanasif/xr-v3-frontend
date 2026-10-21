# Checks · Student · final design · what was actually rendered, inspected, tested and source-checked

Status: **DESIGN COMPLETE (19 / 19) · CONNECTED PREVIEW COMPLETE · ASSEMBLY PENDING XS · OWNER APPROVED (21 Oct 2026)**.

Labels: **RENDERED** = drawn in a real browser and checked by script. **INSPECTED BY EYE** = the rendered image was looked at. **LOGIC TESTED** = exercised by scripted interaction or by calling the preview’s own code, with assertions. **SOURCE CHECKED** = verified by scanning the source. **NOT TESTED** = not done.

## Environment and build

- Headless Chromium (Playwright) with the Claude Design host’s own runtime file, served locally (review tooling; not in the package). Public Sans from a local OFL copy (the sandbox blocks Google Fonts; the canvas loads it from Google Fonts). Viewport height 900; full-page captures.
- **Every check below ran on the approved build**: `project/StudentFinal.dc.html` `18709e565cd2` with `project/v3-student-final.css` `97f77a3e8a1f` — the exact files in this package. The suite was re-run from scratch on these files after the last change (the owner’s decision to keep internal record identifiers out of Student labels), so no result below predates it.
- Consolidation proof, taken before any final-pass change: the one-stylesheet root against R2’s two layered stylesheets, 155 cases at 1440 and 375 — **310 / 310 pixel-identical**. That is what makes the single stylesheet safe; everything after it is measured against the original design instead.

## RENDERED (automated checks)

| Check | Scope | Result |
| --- | --- | --- |
| Every case | 155 scenario × screen × state cases (all 19 IDs, every scenario that changes a screen, presets for errors, dialogs, menus, loading and failure) at **1440, 1024, 768 and 375** = 620 renders; 51 more at **320** | **666 of 671 clean.** The only finding: the borrowed XS-06 page’s *Help & support* text link is under 24 px tall (5 widths); axe’s target-size rule, which allows a small target with enough space around it, passes it. |
| Identifiers a student can see | The visible text and the screen-reader-only text of every case at 1440 and 375, scanned for identifier-shaped strings | **`GIT-VR-03`, `GIT-VR-07`, `ME ZG523`, `MEC-523`, `ZG523`** and nothing else: the two course codes (open decision 3) and the headset’s physical asset tag. No internal record identifier (`ACC-0107`, `SACC-0310`, `DTR-0018`) appears anywhere |
| Boards | 143 `F-*` boards at their own widths, heights measured into `canvas.json` | 134 clean; the other 9 have one kind of finding: a *Help & support* text link under 24 px tall, inside the kit’s held-access banners (paused, inactive) or on the borrowed XS message page. axe’s target-size rule passes them |
| Long-text stress | 37 screen states × 1440 / 1024 / 768 / 375 with much longer experiment, course, institution, person, device, resource and assessment names | 148 renders, **0 with problems** |
| Accessibility scan | axe-core 4.10.2, WCAG 2.0 / 2.1 / 2.2 A and AA rules (including colour contrast and target size) on every case at four widths and on the live preview | **0 violations on 624 pages** |
| Scroll containers | Every element that scrolls or clips sideways (tab strips, panels) on every case at 1440, 1024, 768, 375 (620 pages) and 320 (51 pages): is anything wider than its box, so part of a tab or label is hidden until scrolled? | **0 pages with hidden content** |
| Full-width buttons | Every button the stylesheet makes full width on phones, on every case at 375 and 320 (310 pages): does it reach the full width of its section? | **0 pages with a short button** |
| Shared components | The dialog, drawer, account menu, rail and focused-task bar rendered at a fixed size in the original design and in the final design, interiors compared by pixels | **32 / 32 identical** — they are the foundation’s, unchanged (coverage register) |
| Keyboard focus | Tab through 84 pages (the primary state of every screen, plus dialog, drawer, account menu, error and failure states) at 1440, 768 and 375; at each stop the area around the control is compared focused vs unfocused | **863 Tab stops; focus visible at every stop on 79 pages.** The other 5 are forced-open review presets (01-learn-menu, 13-inprog-att-dialog): the preset draws the drawer or dialog without moving focus, so Tab walks the dimmed page underneath. With real interaction focus moves into the dialog, drawer and account menu and stays there: **29 / 29 checks** at 1440, 768 and 375 |
| Hover | Every visible link, button, select, field and choice on 23 pages at 1440 hovered and compared | 309 controls; the only controls with no hover change are the skip link (hidden until focused) and the current rail item |
| Interaction states | 16 control types on real pages: default, hover, keyboard focus, pressed (`interaction-states/` in the screenshot archive) | primary: hover focus pressed; secondary: hover focus pressed; link: hover focus pressed; nav: hover focus pressed; tab: hover focus pressed; crumb: hover focus pressed; open: hover focus pressed; select: hover focus; input: hover focus; choice: hover focus pressed; qnum: hover focus pressed; rating: hover focus pressed; textarea: hover focus; byq: hover focus pressed; disclose: hover focus pressed; acct: hover focus pressed |
| Reduced motion | `prefers-reduced-motion: reduce` emulated in every render | the two Student transitions and the borrowed menu fade switch off |

Each render checks: console errors and failed requests; the page scrolling sideways; **content spilling out of, or clipped by, the box that holds it**; clipped single-line text; duplicate IDs; exactly one H1; unresolved holes; visible “undefined / NaN / null”; `href="#"`; controls without an accessible name; ARIA references to missing IDs; controls under 24 px (breadcrumbs excluded; axe’s target-size rule covers them).

## INSPECTED BY EYE

- Contact sheets of every primary screen at 1440, 1024, 768, 375 and 320, and 190 images in total, including held, empty, loading, failure, error, dialog and menu states at 1440 and 375 (marked **[eye]** in the screenshot index).
- During the final pass: the changed screens (ST-15, ST-10, ST-12, ST-05 Assessment tab, ST-17, the stage trackers) at every width, and every primary screen at 1024 and 768.
- Defects found by eye and fixed: ST-15 card inside a card; the full-width Assessment-tab bar on tablets; stage checks hidden at 375; the short *Try again* / *See result* buttons on ST-12 *Not passed* (phones); the cut-off *Results* tab at 320. For the last two a script check was added and run on every case, to confirm nothing else had the same fault.
- After the identifier decision: the sentences and rows it touches (ST-05 Overview pill, ST-07 chooser note, ST-08 WEB, ST-09 VR, ST-10 and ST-15 Progress, ST-18 My device) at 1440 and 375.

## LOGIC TESTED

**Journeys** against the live preview (review strip on):

| Width | Checks passed |
| --- | --- |
| 1440 | **62 / 62** |
| 1024 | **62 / 62** |
| 768 | **64 / 64** |
| 375 | **64 / 64** |

- **J1 learning**: Home › course › Open experiment › Resources (open one: time recorded, progress untouched) › Simulation › Continue WEB › activity › Finish stage 2 › Finish the activity › back on WEB (recorded by the platform) › Progress agrees.
- **J2 feedback**: rating sheet › empty submit (error summary, focus) › rate five › sent page on the same scale › Home moves on to VR.
- **J3 assessment**: row led by its date › Before you start › Start › answer three › Next unanswered › Submit dialog (focus inside, Escape returns to Submit) › submitted › withheld result › Submitted tab › released score panel › marks by question jump › review › not passed: Try again is the one gold action.
- **J4 device**: Open VR › My device › request form › empty error › sent (three dated steps) › forwarded › VR in progress and completed.
- **J5 access restrictions**: paused, waiting for a licence, VR not now, AR and MR refusals (Continue WEB from AR), ST-19 (Open experiment), withdrawn (See your earlier work), ended, My device not available, feedback before completion, no assessment, inactive account.
- **J6 keyboard**: Tab order on the WEB page; the drawer opens with focus on Close and Escape returns focus to Menu (768, 375); every page visited has one H1, at most one gold action and no `#` links; no console errors.

**Logic parity** (the preview’s own code, no DOM): **1206 checks passed, 0 failed**. Every method outside the declared presentation set is byte-identical to the original design — including `hubVM`, kept verbatim; the static data is identical; `resolve()` makes the same decision as the original in all 690 scenario × screen routes; refusal titles and destinations are kept; the one next-step rule equals the original hub rule in every scenario. **No business rule, route, guard, state transition or mutation changed in this design.**

**Comparison with the original design** (rendered, 155 cases × 1440, 1024, 768, 375): no original button is missing on any page; the only original destinations not on a final page are Home’s shortcut links (#/student/courses ‹View all courses›, #/student/experiments/shell-and-tube/progress ‹Progress›, #/student/experiments/shell-and-tube/simulation ‹Simulation›, #/student/experiments/shell-and-tube?tab=assessment ‹Assessment›), on 15 Home cases — decision 2 in `HANDOFF.md`.
**Internal record identifiers**: the original design showed one in 14 of 155 cases; the approved design shows one in **0**. The 14 differences are exactly the owner’s decision, applied in presentation only (141 cases were identical to the original already). The rendered scan above is the check that none is left.
**Link map**: 620 pages, 4648 visible links, 303 unique scenario × destination pairs — **0 unresolved**; each link classified and marked exercised-in-a-journey or rendered-and-resolved (`LINK-MAP.json`).

## SOURCE CHECKED

- The final root loads exactly the foundation and `v3-student-final.css`: yes.
- Foundation byte-identical: yes. The original delivery, checkpoint 1, checkpoint 2 and R2 unchanged: yes.
- `StudentFinal.dc.html` differs from the original outside the replaced regions only in the title, the one stylesheet link and the `renderVals()` lines (12 changed lines).
- `v3-student-final.css`: Part A 115 rules, every one verbatim from `v3-student.css` (0 not verbatim); Part B 642 rules, every selector carrying an `sv-` class (0 without); no custom properties (0); no `!important` in Part B; no colour outside the base files (0); no rgb() / hsl() literals, gradients, keyframes or font families; no text below 13 px in Part B (none).
- Every class the final templates and view models use is defined (517 classes; 0 missing); 341 `sv-` classes, 0 unused.
- Internal record identifiers in the built root: `SACC-0310` 0×, `ACC-0107` 2×, `DTR-0018` 2× — none of them in a template or in a field a template renders. The two `DTR-0018` are the seeded record and the mutation that sets it (the original design's code, verbatim: the record still exists, as the business rules require); the two `ACC-0107` are inside the two `hubVM` fields kept verbatim for parity that no template reads (`cells`, `note`). The rendered scan above is the proof that none reaches a page.
- No descendant `span` rule that could catch the runtime’s interpolation spans.

## NOT TESTED

- The canvas inside the Claude Design editor and Play mode itself (the published version is read back byte for byte after publishing).
- Real screen readers (VoiceOver, NVDA, TalkBack) and real touch devices.
- Safari and Firefox; Windows high-contrast mode; 200 % text zoom.
- Every scenario × screen × preset combination (155 representative cases, not the full cross-product).
- Real XR runtimes, real resource files and any backend behaviour — none exist in this design.

## Evidence files

`checks/results/` holds the raw results of every check above; `checks/scripts/` the scripts (they need the Design host’s runtime file, which is not included).
