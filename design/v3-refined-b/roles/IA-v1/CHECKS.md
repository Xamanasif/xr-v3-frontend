# Checks · Institute Admin · final complete-role design · 21 Oct 2026

Canvas: Version 15 of the Institute Admin canvas, page **Final · start here** (the page the canvas opens on).
Status: **FINAL — OWNER APPROVED (21 Oct 2026).** The source and screenshot archives are built from exactly these files.

Labels: **RENDERED** = drawn by the Claude Design runtime in Chromium and looked at or measured · **LOGIC TESTED** = scripted clicks and keys with asserted outcomes · **SOURCE CHECKED** = verified by reading or hashing files · **NOT TESTED** = not done; reason given.

Everything below was run again, from scratch, on the approved files — after the identifier pass of 21 Oct 2026 and the three fixes of 20 Oct — using the served design runtime (sha256 3f160299…dffe0f10) and Public Sans.

## What the owner approved

| Decision | Outcome |
|---|---|
| The whole role (19 owned screens, one design language) | Approved 21 Oct 2026 |
| Plan tint on the Overview plan card and the Content access plan strip | **Kept**, as in the foundation contract and on the Access plan page |
| Internal record ids in ordinary labels | **Taken out** before approval was recorded; see below and HANDOFF.md § 9 |

## RENDERED

| Set | Count | Result |
|---|---|---|
| Every route (start page, 19 owned screens, Help, Signed out) in all 7 sample worlds at 1440, 1024, 768 and 375 | 616 | 0 horizontal overflow, 0 console errors, 0 load failures |
| Every named state (74) at 1440, 1024, 768 and 375 | 296 | 0 horizontal overflow, 0 console errors, 0 load failures |
| Every canvas board (137) at its canvas size | 137 | Rendered height equals board height (the two 812px phone boards show the first screen with the dialog or drawer open, by design); 0 overflow; 0 console errors |
| Full-page captures looked at as contact sheets: every route in the populated world at the four widths (88), every named state at 1440 and 375 (148), and the screens the identifier pass touched | 236+ | Every owned screen holds the same page, list, record and step patterns at all four widths; the defects this review found were fixed (below) |
| Reviewed R1 and R2 screens compared pixel by pixel with the published Version 7 (R2 look) | 23 | IA-04 (populated, ending), IA-06 (populated, new institution) and IA-16 (populated, paused) identical at 1440 and 375, and 5 named states of those screens identical (IA-06 at 375 differs by 6 pixels inside the sideways-scrolling status switch, a known render variance). IA-01 and IA-02 differ only inside the plan card and plan strip (the plan tint). IA-04 paused and ended differ only by the waiting note no longer shown under Paused or Access ended. Details in the evidence archive, `results/reviewed-vs-final.txt` |
| Stylesheet reorganisation in the final pass | 36 | Pixel-identical before and after on 36 representative renders |
| Accessibility scan: axe-core 4.10 with the WCAG 2.0, 2.1 and 2.2 A and AA rules, on every route at 1440 and 375 (44), restricted and empty worlds (10), and 22 named states (dialogs, forms with errors, menus, filters) | 76 | 0 violations. axe left 124 items for a person to judge: text beside the timeline's and the tabs' decorative pseudo-elements (contrast) and the group-heading rows of the grouped tables (header cells). Looked at by eye: ink text on white or on the plan tint; group headings label their rows |

## LOGIC TESTED

| Run | Checks | What is asserted |
|---|---|---|
| J1–J5 journeys | 71/71 | New institution → add student → course code → give → Student access and Content access agree; CSV errors → clean file → import → duplicate refused; group → members → group grant → withdraw one individual grant; faculty → course → record agrees; request to BITS → status → forward a device request |
| K1–K10 keyboard and focus | 67/67 | Drawer (focus trap, Escape, focus back to Menu), account menu, Help, destructive and edit dialogs (focus in, Escape, focus back to the trigger), row keyboard, paused read-only, ended and awaiting refusals |
| R1 suite (RA–RI: IA-04 filters, withdraw and keyboard; IA-06 People; IA-16 codes; IA-01 links; phones; restricted worlds) | 112/112 | The R1 screens behave exactly as reviewed |
| R2 suite (R2A–R2F: IA-02 filters, links, keyboard, plan states, formats, phones and tablet) | 66/66 | The IA-02 screen behaves exactly as reviewed |
| Final suite FA–FM (32 runs) | 95/95 | IA-03 strip, groups, read-only students, links and plan states; IA-07 About and order on phones; IA-09 header and Remove…; IA-14 grants beside members and first on phones; IA-08 search, chips, Clear filters; IA-13 list; IA-15 panel beside the table from 1,060px, compact row below it, stacked on phones, row action preselects the person; IA-17 list and detail order; IA-18/19 one explanation, history without repeated devices; IA-20 three figures across on phones, definitions beside; IA-05 phone steps and the folded selection; IA-11 errors table; plan tint on Overview and Content access |
| Every control clicked | 542 controls in 242 start states | 0 with no visible effect, 0 wrong destinations, 0 console errors; 375 of 375 links reached their declared screen (LINK-MAP.json) |
| **Total asserted checks** | **411/411** | 0 failures, 0 console errors |

The 29 "focus-only" results in the control crawl are expected: links to the page already shown, the status already selected, a dialog's confirm that returns focus to its empty required field, and Faculty courses' "Assign a course", which fills in the person (asserted separately in FG1) and moves focus to the course field.

## Interaction states checked

| Run | Checks | What is asserted or captured |
|---|---|---|
| IS01–IS16 (15 captures at 1440, one at 375) | 10/10 | Keyboard focus ring (`:focus-visible`) on a list row link, a status segment, a row Give access, Remove… (normal and small), a pick-list checkbox, the Ask BITS link and Review; the busy “Giving access…” button; the folded selection opening on a phone. Hover captured on list rows, Withdraw…, Remove…, a pick row and People’s Give access |

Also exercised by the suites above: selected tabs and segments, disabled and unavailable rows with their reason, error summaries and field errors, chips and Clear filters, dialogs opening, invalid and closing with focus returned, flashes after a change, drawer and account menu open and closed.

## The identifier pass (21 Oct 2026)

Grant (`SACC-…`), faculty-course (`FMAP-…`) and group (`GRP-…`) record ids are gone from every ordinary label; access plan, request, device request, problem report, student and course codes stay, because the person quotes those outside this role (HANDOFF.md § 9).

**How it was checked.** The visible text of every route in all 7 sample worlds and every named state (228 renders) was dumped before and after and compared line by line.

- 0 of 228 states still show a grant, faculty-course or group id anywhere.
- 33 lines changed, every one of them an id-bearing label, and 19 replacement lines appeared. Nothing else moved: no page title, button, status word, validation message, empty state, dialog title, permission or count differs from the approved text.
- Each replacement identifies the same record in words — "Individually · 9 Oct 2026", "Group: ME ZG523 — Sem II · 12 Oct 2026", "Given 9 Oct 2026", "Group grant". A student holds at most one individual grant and one grant per group for an experiment, so these stay unambiguous.
- The rules that name a record still name it: the withdraw dialog reads "This withdraws the access you gave Rahul Verma individually on 9 Oct 2026" and still says the group grant is not changed (OD-B2-01); the result flash still says which grant ended and that the group's is unchanged.
- The ids are unchanged in the data model, in `SCENARIOS.json` and in `LINK-MAP.json`; element ids, Student access's search by grant id, and every command input in HANDOFF.md § 4 are untouched.

## SOURCE CHECKED

- `core.css`, `rb.css`, `rb-kit.css` are byte-identical to the foundation lock (XR-V3-RB-1.0).
- `ia-role.css` is the only role stylesheet. Every selector in it is scoped by an `ia-` class (0 exceptions), so no `xr-`, `rb-` or `rk-` part changes outside the role's own containers; colours are foundation tokens plus a few values copied from the kit's own rules (listed in COMPONENT-EXTENSIONS.md); all 256 classes it defines are used by the role root.
- `Main.dc.html` has no look switch and no R1/R2 template left; every owned screen has exactly one template.
- The seven sample worlds are byte-for-byte the data of the delivered role (dumped from the source and compared), ids included.
- The canvas lists 137 boards and every listed file is in `project/`; 85 files of the earlier pages were removed from the canvas and the published files (FOUNDATION-LOCK.json, `retiredSinceLastExport`).
- Published Version 15: `Main.dc.html` (sha256 6718071f…cefd821c), `ia-role.css` (8014894a…b5210a22), `canvas.json` (20835fb4…ce4bbe61), `coverage.dc.html` (f877bd97…a05d9595), every board wrapper and the three foundation files match the tested files by hash; the artifact holds exactly the 142 project files of this package and nothing of the earlier pages; the served design runtime is the one used for every render (3f160299…dffe0f10).

## Defects found and fixed during the final verification

- IA-15 Faculty courses at 768–1,059px: in the one-row assign form the faculty select clipped its placeholder (“Choose a faculty membe”). The faculty field now takes a larger share of the row.
- IA-08 Faculty and IA-13 Groups: the footnote (“Courses taught set what each person sees…”, “Giving a group access gives it to the group’s current members…”) had dropped out of the empty and no-match states. It shows in every state again, as delivered.
- Forms with several errors (IA-10 Add student, IA-17 request form, XS-07 report form): the error summary's single-line links sat 22px apart, under the 24px target spacing of WCAG 2.2 (2.5.8). Inside role forms the items now have 4px more space; the kit's own spacing is noted for the kit owner in HANDOFF.md.

The first two were found by the contact-sheet review and a before/after text comparison, the third by the accessibility scan. Everything in this file was run again on the finished files afterwards.

## Text changes against the design the owner reviewed

Two passes changed visible words, each verified by a full before/after text comparison of all 228 states: the final consolidation (20 Oct, against published Version 7) and the identifier pass (21 Oct, above). Everything not listed is word-for-word the delivered text, including page titles, buttons, status words, error messages, empty states and dialogs.

| Screen | Change (20 Oct consolidation) |
|---|---|
| IA-03 | “Ask BITS for a renewal or more licences” at the foot of the plan becomes “Need more, or a renewal? Ask BITS from Requests” in the plan strip (same destination). The ending, paused and ended notes each become one sentence with the same facts. The per-experiment “Students given access” count leaves the plan table; the students section counts them per experiment. A “No licence is available…” note now appears under a student who reads Waiting for a licence, as on Student access |
| IA-04 | The “No licence is available…” note no longer appears under Paused or Access ended (paused and ended worlds) |
| IA-05 | The “Your selection” summary no longer repeats beside the review and the result; beside steps 1–2 it reads “ACC-0107 · ME ZG523” |
| IA-07 | “Details” and “Courses and groups” become one “About” panel (course, group, programme, added); the student ID and e-mail appear once, in the head; “From access plan ACC-0107” on each row becomes one footnote, “Formats come from access plan ACC-0107; they are never chosen per student.” |
| IA-08, IA-15 | The search field's label (read by screen readers) is “Search faculty” instead of “Search” |
| IA-09 | The “Details” panel moves into the head (“Added 8 Oct 2026 · Meera Iyer”); where a record has no added date (Prof. Ravi Shankar in the sample) nothing is shown instead of “Not recorded in this sample”. New footnote: “These courses set what {name} sees in the Faculty workspace. They never give students access.” |
| IA-13 | The “2 groups” line above the list is removed (the tab shows the count) |
| IA-14 | The group's grants are items instead of a table; the note ends “Each member's status is shown in Members, in words.”; the member count appears once |
| IA-17 | The status legend line under the list is removed; “Licences are shown as requested and approved by BITS.” stays |
| IA-18, IA-19 | The footnote repeating the device-request statuses is removed; the history no longer repeats the two devices |
| Preview start page (not product UI) | The look switch is gone; the screen index is a table |

## NOT TESTED

| Item | Why |
|---|---|
| The canvas inside claude.ai | The browser here isn't signed in to claude.ai; the served files are the tested files (hash- and size-checked). The owner's acceptance covers this. |
| Screen readers, 200–400% zoom, Safari and Firefox | Not available here (same as every earlier delivery). |

## Unresolved findings

None. Both owner decisions are recorded in ROLE-STATUS.json (`ownerDecisions`); `openDesignDecisions` is empty. The open **business** policies in HANDOFF.md § 6 are unchanged and belong to the product, not to this design.
