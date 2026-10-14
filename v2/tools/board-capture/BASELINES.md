# Phase-0 baselines — inventory and results (WP-0.15)

The Phase-0 visual baseline set (Appendix F §7.5 "Phase-0 baselines"; Appendix E §9.1): the Batch-0
specimen boards 01–08, 10, 11 and 12 (components and shells, including the seven roles × banner
states of board 05), the ErrorSummary from a linked product instance (B4-04, VD-22), board 07
(XS-07 Help & support) and board 08 (XS-06, PU-15 and the foundation message states). Sign-in
(B1-09, XS-01/03/04) stays in Phase 1 (owner decision G-8). No Phase-1+ screen is baselined.

Recorded run `2026-10-14T08-46-43-822Z-verify` (the `pnpm verify` run of the WP-0.15 decision-closure commit):
Chromium 153.0.8010.12 (Playwright 1.63.0, the only browser in the local cache), macOS (Darwin
25.5.0), 1× pixels, reduced motion, en-GB, Asia/Kolkata, browser clock frozen by Playwright for the
screen captures. Same machine and same run for board and product (VD-18 local interim) — these
captures are run artefacts, not cross-OS baselines.

## Reference captures (board side)

Every capture waits for the runtime to finish rendering (fonts ready, DOM quiet, no `{{` marker in
text or attributes, Public Sans loaded); every board loaded only localhost and the vendored inputs
(0 external requests). Names: `<board>-f<index>-<caption>` / `<board>-s<index>-<caption>`.

| Board                         | Enumeration             | Frames                   | Sections | States                                  | Captures |
| ----------------------------- | ----------------------- | ------------------------ | -------- | --------------------------------------- | -------- |
| 01 Visual foundation          | direct                  | 0                        | 5        | —                                       | 5        |
| 02 Tokens and typography      | direct                  | 0                        | 7        | —                                       | 7        |
| 03 Core components            | direct                  | 5                        | 9        | —                                       | 14       |
| 04 Status, format, states     | direct                  | 0                        | 4        | —                                       | 4        |
| 05 Workspace shell (GL-01)    | canvas props            | —                        | —        | 21 role × banner + 7 menu open + 7 Help | 35       |
| 06 Sidebar variants           | direct                  | 5                        | 5        | —                                       | 10       |
| 07 Help & support (XS-07)     | direct                  | 10                       | 1        | —                                       | 11       |
| 08 System and message pages   | direct                  | 10                       | 4        | —                                       | 14       |
| 10 Dialogs                    | direct                  | 7                        | 4        | —                                       | 11       |
| 11 Responsive proof           | direct                  | 13                       | 5        | —                                       | 18       |
| 12 Accessibility and motion   | direct                  | 1                        | 5        | —                                       | 6        |
| B4-04 (ErrorSummary instance) | frame-index (12 frames) | f3 "Step 2 · validation" | —        | —                                       | 1        |
| **Total**                     |                         | **51**                   | **49**   | **35**                                  | **136**  |

## Comparisons (product side)

Component specimens = the `@xr/ui` components in the specimen harness (board data); screens = the
built Phase-0 screens of the test-hook build on the `after-flow-d` sample world. Every comparison
is an acceptance comparison: element comparisons (including every part of a screen) at the component
tolerance, the six whole frames at the screen tolerance. "Register" = outside tolerance (or drawing
other icons) and measured exactly as `src/pinned.json` pinned it for an entry of `DEVIATIONS.md` —
the harness reports a registered difference, it never approves one. The owner's decisions are
the entries' statuses: since the visual-decision closure of 14 Oct 2026 every entry is approved,
except DEV-05 (acknowledged as measured, cause not proven) and DEV-16 (deferred to the ST-19
phase); both stay tracked with runner portability (VD-18). This baseline is the Phase-0 visual
foundation, not a claim that the designed screens are implemented.

| Board      | Product                                                                                                                                                                                                                                                                                                                                   | Comparisons | Within tolerance | Register | Entries                    |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------------- | -------- | -------------------------- |
| 02         | Text, Link (incl. hover, external), IdChip, NavItem (navy focus), Icon (3 sizes + 48-icon set), FormatBadge                                                                                                                                                                                                                               | 67          | 66               | 1        | DEV-05                     |
| 03         | Button (5 variants × default/hover/focus/busy, sizes, disabled), fields, choices, long values, ListToolbar + DataTable ×3 widths, segmented control, tabs, back link, page header, rows, attention list, notices (the stretched warn notice as icon + body), failed state, empty state, stepper, timeline, decision panel, account button | 53          | 43               | 10       | DEV-01, 02, 03, 04, 05, 18 |
| 04         | StatusPill ×22, FormatBadge ×13, notices, ShellBanner ×2                                                                                                                                                                                                                                                                                  | 39          | 37               | 2        | DEV-04, 18                 |
| 05         | WorkspaceShell: 11 applicable role × banner states (sidebar, top bar, banner), 7 open account menus, 7 Help states (+ Help header and My reports)                                                                                                                                                                                         | 49          | 49               | 0        | —                          |
| 05 (built) | The built shell on each workspace's Help page: top bar, sidebar parts, whole sidebar, Help header; paused banner (Student, Faculty, Institute Admin after the Super Admin pauses Godavari); inactive banner (per-0005)                                                                                                                    | 46          | 32               | 14       | DEV-10, 11, 15             |
| 06         | Seven sidebars, rail + tooltip, drawer (375), four nested section-tab strips                                                                                                                                                                                                                                                              | 32          | 29               | 3        | DEV-06, 07                 |
| 07 (built) | XS-07 State 1, 1a, 1c, 2a, 3a (1280: shell parts, page parts, whole frame) and both phone frames (375), on the real screens                                                                                                                                                                                                               | 48          | 32               | 16       | DEV-10, 11, 12, 13, 14     |
| 07         | States 1b (Sending), 2 (Institute Admin reports), 3 (Faculty detail) with board data                                                                                                                                                                                                                                                      | 19          | 16               | 3        | DEV-01, 17                 |
| 08 (built) | PU-15 workspace, PU-15 public, XS-06 (1440, message parts), XS-06 at 375 (top bar, message, whole frame)                                                                                                                                                                                                                                  | 15          | 13               | 2        | DEV-19                     |
| 08         | The eight-message family at the drawn width; "In context" at 1312                                                                                                                                                                                                                                                                         | 19          | 18               | 1        | DEV-16                     |
| 10         | Six dialog states (head, effect, field, confirm, footer, size) and the 375 bottom sheet                                                                                                                                                                                                                                                   | 30          | 20               | 10       | DEV-01, 03, 08             |
| 11         | Top bars, sidebars, rail, drawer, menus at 1440/1024/768/375; four tab strips at 375                                                                                                                                                                                                                                                      | 21          | 20               | 1        | DEV-06                     |
| 11 (built) | "375 · AR-8 form" against the built report form                                                                                                                                                                                                                                                                                           | 1           | 0                | 1        | DEV-14                     |
| 12         | SkipLink on keyboard focus                                                                                                                                                                                                                                                                                                                | 1           | 1                | 0        | —                          |
| B4-04      | ErrorSummary (`xw-errsum`, the VD-22 baseline)                                                                                                                                                                                                                                                                                            | 1           | 1                | 0        | —                          |
| **Total**  |                                                                                                                                                                                                                                                                                                                                           | **441**     | **377**          | **64**   |                            |

0 comparisons outside tolerance without a register entry; 0 registered comparisons off their pinned
measurement; 0 stale entries; 0 masks. 20 comparisons draw other icons than the board (all
registered: the Phase-0 sidebar's missing destination icons, DEV-10, 17; the read-only note's
lock, DEV-02, 1; the success notice tick, DEV-18, 2). Six whole frames are gated at the screen tolerance: 08 "At 375 px" is within it; 07 State 1, 1c
and 2a are inside its ratio but draw fewer icons (the Phase-0 sidebar, DEV-10, with DEV-11 for
1c) and are registered; 07 State 1a and 3a are 4 and 10 px taller (DEV-12; DEV-11 + DEV-13), so
no pixel comparison of the whole frame is possible — they are registered on their size and their
content fingerprints are pinned, while every part of them is compared on its own. Every registered
comparison is pinned by size, icons, two content fingerprints and pixel count. Tests: 41/41 passed (31
specimen-suite, 10 screen-suite). Board 08 paints the public PU-15 frame #F4F5FB, the product's
public shell is white (`.xp`): the 0.1 threshold does not separate the two, so DEV-20 records it
for the owner.

## Reference only — no Phase-0 product counterpart

Captured and counted, never compared (there is no product component or built screen for them yet,
or they are documentation):

- **01** whole board (colour roles, surfaces, borders/radius/elevation, spacing, page widths — tokens
  and documentation; the tokens themselves are pinned by the verbatim stylesheets).
- **02** "Typeface", "Motion principles", "Token names" (documentation); "Focus on light" (static
  `.is-focus` buttons — real focus is compared on board 03 — and an input, DEV-03); "Hierarchy in
  use" (a composition of styles compared one by one); the type-scale "label" row (the Field label,
  compared on board 03).
- **03** the summary drawn as `xr-notice--err` (VD-22; the baseline is B4-04), the open account
  menus drawn `position: static; width: 100%` (compared on board 05/11 instead), the loading
  skeleton, read-only box and comparison block (board-only inline layout), the editable table (not
  a Phase-0 component), the breadcrumbs drawn outside a top bar (compared in the top bars).
- **04** "Four things the chips must never blur" and the state-grammar table (documentation of the
  same chips), the composed "Waiting on another role" / "Not available · inline" boxes.
- **05** the "Page content slot · not designed in Batch 0" (canvas-only); the canvas combinations
  no role can be shown (paused for platform roles, inactive for non-Students): captured only.
- **06** the account-menu table and navigation rules (documentation).
- **08** "Anatomy" (documentation).
- **10** "Try it" (the live demo triggers) and "When a dialog is allowed" (words).
- **11** the page areas of the frames — AR-2 People, AR-4 request decision, AR-10 "not available" —
  are Phase-1/2 screens; the AR-8 form is compared on the built screen.
- **12** contrast, keyboard patterns, targets and reduced-motion tables (documentation) and the
  1–5 rating scale (a Phase-3 component, format feedback).
