# Faculty — checks (what was actually rendered, exercised and compared)

Status: DESIGN COMPLETE · CONNECTED PREVIEW COMPLETE · ASSEMBLY PENDING XS · FINAL — APPROVED BY THE OWNER. All checks below ran on this exact build (21 Oct 2026).

## How the checks ran

- Local Chromium through Playwright 1.56, serving the canvas files with the Design runtime (`support.js`) and the Public Sans webfont, device scale 1, reduced motion. Scripts and raw results: `checks/`.
- Labels: **RENDERED** (drawn and measured), **EXERCISED** (driven by real clicks, typing and keys in one live preview), **COMPARED** (pixel or element comparison between builds), **SOURCE CHECKED** (read from the markup).

## RENDERED

- **219 renders**: every inspection board and live starting point (135) and the four-width strip of every owned ID (84). For each: page height, horizontal page scroll, elements running off the page, text under 13 px and console errors.
- Result: horizontal page scroll **0**, console errors **0**, elements off the page outside a scroll region **0**. The only text under 13 px is the kit’s WEB / AR / VR / MR chips (12 px).
- Responsive strip (page height in px; ✓ = no page scroll, no console error, nothing off the page):

| ID | 1440 | 1024 | 768 | 375 |
| --- | --- | --- | --- | --- |
| FA-01 | ✓ 961 | ✓ 1579 | ✓ 1579 | ✓ 2015 |
| FA-02 | ✓ 900 | ✓ 900 | ✓ 900 | ✓ 1088 |
| FA-03 | ✓ 973 | ✓ 1267 | ✓ 1267 | ✓ 1555 |
| FA-04 | ✓ 900 | ✓ 943 | ✓ 943 | ✓ 978 |
| FA-05 | ✓ 1054 | ✓ 1500 | ✓ 1500 | ✓ 2037 |
| FA-06 | ✓ 900 | ✓ 900 | ✓ 900 | ✓ 900 |
| FA-07 | ✓ 1326 | ✓ 1842 | ✓ 1842 | ✓ 2263 |
| FA-08 | ✓ 1420 | ✓ 1868 | ✓ 1868 | ✓ 2358 |
| FA-09 | ✓ 1177 | ✓ 1414 | ✓ 1414 | ✓ 1936 |
| FA-10 | ✓ 1867 | ✓ 2188 | ✓ 2209 | ✓ 2898 |
| FA-11 | ✓ 2370 | ✓ 2436 | ✓ 2436 | ✓ 3178 |
| FA-12 | ✓ 931 | ✓ 1104 | ✓ 1104 | ✓ 1339 |
| FA-14 | ✓ 1309 | ✓ 1766 | ✓ 1766 | ✓ 2187 |
| FA-15 | ✓ 1765 | ✓ 2408 | ✓ 2408 | ✓ 2650 |
| FA-16 | ✓ 1167 | ✓ 1571 | ✓ 1571 | ✓ 2214 |
| FA-17 | ✓ 1260 | ✓ 1956 | ✓ 1956 | ✓ 2240 |
| FA-18 | ✓ 900 | ✓ 988 | ✓ 988 | ✓ 1082 |
| FA-19 | ✓ 1042 | ✓ 1779 | ✓ 1779 | ✓ 2380 |
| FA-20 | ✓ 1148 | ✓ 2075 | ✓ 2075 | ✓ 2304 |
| FA-21 | ✓ 900 | ✓ 1151 | ✓ 1151 | ✓ 1305 |
| FA-22 | ✓ 1585 | ✓ 2536 | ✓ 2536 | ✓ 2876 |

- **Long-text stress:** 46 renders (23 screens at 1440 and 375) with names and titles 3–5× longer than the sample: horizontal page scroll 0, console errors 0; reviewed visually (screenshots in `stress-long-text/`).

## EXERCISED

| Set | What it drives | Widths | Steps passed |
| --- | --- | --- | --- |
| J1–J4 | create · bank · marking · students · co-teacher chains | 1440 | 117 of 117 |
| J1–J4 narrow | the same five chains | 1024 · 768 · 375 | 369 of 369 |
| J5 | drawer, account menu, delete dialog, 15 Nov release, no courses | 375 · 1440 | 48 of 48 |
| J6 | draft with assistance, drafting fails | 1440 | 20 of 20 |
| J6 phone | draft with assistance, drafting fails | 375 | 20 of 20 |
| J7 | settings and questions, list filters | 1440 | 31 of 31 |
| J8 | R1 screens: overview, courses, new teacher, marking total, drafting | 1440 | 43 of 43 |
| J8 narrow | R1 screens | 768 · 375 | 106 of 106 |
| J9 | final pass: experiment chain, record tabs, bank cards, queue and students, import figures, phone and tablet sweeps, keyboard focus | 1440 · 768 · 375 | 128 of 128 |
| J10 | the message, dialog and export chains again, with an internal-ID guard on every step | 1440 | 204 of 204 |

**Total: 1086 of 1086 steps passed.** J1–J8 are the published and R1 journeys, with class selectors renamed (`rename-map.json`), the labels that changed when internal ids left them re-pointed literally (the table at the top of `checks/scripts/journeys.py`), and eight expectations re-pointed where a screen now shows a fact differently (`checks/specs/journey-changes.json`, each with its reason). J9 is new for the final pass; J10 is the internal-ID guard.

- **Keyboard:** the drawer and the account menu trap and return focus and close on Escape (J5a, J5b); the delete-question and confirm-marks dialogs return focus (J5c, J3); the bank panel’s close returns focus to Add from question bank (J9b); every stop tabbed through FA-08, FA-10, FA-12, FA-14 drafts and FA-20 shows a focus ring on the control or its row, and FA-08’s tab sequence has no hidden stops (J9i).
- **Phone and tablet:** J9g (375) and J9h (768) walk every rail destination and the main records through the drawer with no horizontal scroll; J9c checks that the current record tab is scrolled into view and the rule fields stack at 375.

### Link crawl

- From 103 start states, every visible anchor was clicked on a fresh page: **442 links, 0 not landing where their screen ID says**. No in-role destination is a bare `#`. Results: `checks/results/links.json`; summary in `LINK-MAP.json`.

## INTERNAL TECHNICAL IDs

Owner decision, 21 October 2026. The sweep looks for `ASMT-`, `ATT-`, `Q-` and `D-` identifiers (and the Super Admin set) in visible text, `aria-label`, `title`, `placeholder`, `alt` and screen-reader-only text.

- 219 boards swept for ASMT-, ATT-, Q- and D- identifiers in visible text, aria-label, title, placeholder, alt and screen-reader text: 0 found.
- J10 repeats the chains that produce messages, notices and dialogs with the same guard on every step: 204 of 204 steps pass.
- Kept on purpose: academic course codes, institution-issued student IDs and the CSV “student ID” column; stable keys in routing, element ids and the question search.
- One identifier remains in the role, on a borrowed surface: Help & support answers a sent report with “Your reference is SUP-0231”. XS-07 is owned by the shared XS contract, so it is flagged for its owner rather than changed here.

## COMPARED

- **Consolidation:** 219 of 219 renders pixel-identical before (published `fa.css` + `fr-` rules) and after (one `fa.css`). Every class seen in any render that had a rule before still has one (527 classes checked, 0 lost).
- **R1 carry-over:** 29 of 51 boards of the five R1 screens are pixel-identical to the R1 checkpoint you saw. FA-01 and FA-02 are unchanged; FA-03 is unchanged. The differences are the two later owner decisions, not a redesign: FA-01’s no-course card gained 4 px above “Help & support” and FA-16’s no-course state became the compact message card (sparse-state consistency), and FA-16 and FA-19 lost the internal ids — FA-19’s band now reads “Waiting for marking · Submitted … · attempt 1 of 2” and an added draft reads “In your question bank”.
- **Published build:** every board was also rendered on the published V3 Faculty build; 10 are pixel-identical (FA-04 no match, loading and couldn’t load; FA-06 no assessment yet; XS Help, Report a problem, Signed out, Not your workspace; both refusals). The coverage register’s statuses are checked against this comparison by `coverage.py`.
- **Unchanged components inside redesigned pages** (compared element by element, `checks/results/element-compare-unchanged-components.json`): the FA-14 and FA-20 empty states and the menu drawer are identical; the Delete question and Confirm marks dialogs and the account menu are identical apart from the redesigned page showing through their rounded corners; the FA-11 failed state and the FA-11 / FA-12 co-teacher refusals differ by at most 7 of 255 on one colour channel where their tinted icon sits on the redesigned surface (not visible).

## SOURCE CHECKED

- Structural accessibility scan of all 219 renders: unnamed buttons and links, unlabelled fields, duplicate IDs, broken `aria-labelledby` / `describedby` / `controls`, `label for` targets, placeholder links, one visible h1 per view, and stray copy (`undefined`, `NaN`, `[object`, lorem, TODO, percentages outside pass marks): **0 issues**.
- Foundation: `core.css`, `rb.css`, `rb-kit.css` byte-identical to the pack (hashes in `FOUNDATION-LOCK.json`).

## NOT TESTED

- A real backend, real files on disk (exports show the rows; the import template is a data: CSV link) and real drafting assistance — all are labelled sample stand-ins.
- Screen readers beyond the structural scan (names, labels, roles, live regions were checked in markup; no NVDA / VoiceOver session).
- Browsers other than Chromium, and zoom above 100 %.
- Cross-role effects (a student seeing a released result) — documented, not linked.

## Unresolved findings

- None blocking. One item is for the XS owner, not for Faculty: Help & support still answers a sent report with “Your reference is SUP-0231”, on a borrowed shared surface (`HANDOFF.md` section 4).
- The product decisions that were already open stay open and unchanged; they are listed in `HANDOFF.md` section 4.
