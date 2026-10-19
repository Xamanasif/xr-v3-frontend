# Checks · Vendor role (final)

> **Status: FINAL DESIGN · AWAITING OWNER ACCEPTANCE.**

Every number below comes from the final runs on the delivered files, after the last source change. The delivered files are:

- `Main.dc.html` sha256 `b72cc14f…`
- `v3-vendor.css` sha256 `f00db076…`
- `canvas.json` sha256 `233601a8…`

`FOUNDATION-LOCK.md` has the full hashes. The result files and the test scripts are in the screenshot archive under `evidence/`. The scripts use this sandbox's paths; they are included to show exactly what was checked.

## How the checks ran

- **Browser:** Chromium through Playwright, in a cloud sandbox.
- **Files:** served straight from `project/`. Requests for `support.js` were answered with the Design type's own runtime (`artifact-type/dc-runtime.js`, sha256 `3f160299…`). This is the same runtime the host serves for this canvas, so the files ran as the host runs them.
- **Font:** Public Sans 400–800 from a local copy of the same family, because Google Fonts is blocked in the sandbox. The host loads it from Google Fonts. No font files are delivered.
- **Widths:** 1440, 1024, 768 and 375 CSS px. Viewport height 900, or 812 for the phone first-screen check.
- **Baseline comparisons** (copy check and first screen) loaded the accepted baseline root with its own original stylesheet, so the baseline rendered exactly as it was accepted. These temporary files were removed afterwards and are not in `project/`.

## RENDERED

| What | Count | Result |
| --- | --- | --- |
| State renders: 59 states × 4 widths, full-page screenshots | 236 | horizontal overflow **0** · elements past the viewport edge **0** · clipped text **0** · console errors **0** |
| Text smaller than 13px | — | only format chips (WEB, AR, VR, MR) at 12–12.5px, sizes defined by the foundation |
| Overlap probe: any two visible text boxes or controls overlapping, on every state | 236 | **0** at every width |
| Inspection boards measured at their canvas size (69 wrappers + `Main.dc.html`) | 70 | console errors **0** · sideways scroll **0** · heights written into `canvas.json` |
| Hosted files after publishing (canvas version 14, all 75 files under `project/`) | 75 | **75 of 75 byte-identical** to the tested files (sha256) · same design runtime |
| The delivered source ZIP, extracted into an empty folder and served on its own | 70 boards | console errors **0** · failed requests **0** · Create → Fill sample answers → Save draft (SUB-0087) → My experiments shows 7 (`evidence/zip-smoke-f.json`) |
| The accepted R1 screens (VE-01…VE-04, 20 states × 4 widths) compared pixel by pixel with the R1 checkpoint renders | 80 | **77 identical**. The other 3 are VE-03 “draft saved” at 1440, 1024 and 768: the saved message moved about 14px left to sit next to Cancel, as it does next to Back on every other step (`evidence/r1-vs-final-pixels.json`) |

The 59 states cover:

- every owned screen in its primary state;
- the empty, loading, error, read-only and dialog states;
- the already-submitted refusal. The approved refusal is a board (`VE-08-already-decided`), and the published and being-reviewed refusals are exercised (LK-R1, LK-R2);
- the WEB-complete / AR-partly-filled format case;
- the account menu, phone menu and Help;
- the reviewer bar with its handoff note.

`ROLE-STATUS.md` lists the states for each screen. Screenshots were inspected by eye at all four widths. The review checked:

- long names and wrapping;
- error summaries;
- empty data;
- the stepper/aside switch;
- the table-to-card change;
- the outcome facts on phones;
- dialogs;
- that every screen uses the same section, field, block and action patterns.

**The overlap probe** compares the line boxes of every visible text node and control. It ignores sticky and fixed bars and anything inside a clipped ancestor, so it does not report the sticky action bar or the stepper's clipped labels. To show the probe works, it was also run on the baseline at 375. There it found the one real overlap that existed: the sort button running into the “With” column header on VE-02 (`evidence/overlap-probe-on-baseline-375.json`). That column no longer exists.

## Copy check against the accepted baseline

Every baseline line, visible text and aria-label alike, was looked for in the same state of the final root, at 1440 and 375, over 55 states. In 36 states some baseline line no longer appears as written. Each one is a structural change from the accepted R1 direction, a duplicate that was removed, or a label rewritten with the same facts. No caveat, rule, validation message or status notice was lost.

| Baseline line(s) | Where it went |
| --- | --- |
| “Where your experiments are”, status rows with counts, “1 experiment: Returned. Show in My experiments” and similar | four grouped counts on the Overview; the status tabs on My experiments (R1 choices 2 and 3) |
| “Returned: Forced Convection”, “Academic Reviewer · 24 Aug 2026 · “…”” | the returned lead now states the kind, the name, who and when, and the reason in full on separate lines. Every fact is still there (checked by script: `evidence/facts-f.json`) |
| “Draft to finish: Pin Fin Efficiency”, “Last saved 25 Aug 2026 · only you can see it” | the drafts list: kind, name and “Saved at step 2 of 4 · 25 Aug 2026 · only you can see it” |
| “All statuses”, “Filter your experiments”, filter chips such as “Status: Returned” and “Remove filter …” | status tabs with counts and Clear filters (R1 choice 3) |
| “With” column values: “You”, “Content Manager”, “—” | the status pill and its plain line (R1 choice 4) |
| “Browser (WEB) · Web link”, “Augmented reality (AR) · App package”, “Delivered as a web link / an app package” | each block header: chip, name, kind |
| “Package file (optional)”, “Choose file”, “Instead of, or as well as, a reference. No source code.” | Attach file in the Package reference label row. The no-source-code rule is in the guidance written once above the blocks (R1 choice 5) |
| “What you have provided”, “Delivery” | one review section per step on Check and submit, each with a Change button |
| “Status” and “With” rows in the record aside and on the outcome, and the aside label “Where it stands now” | the status is stated once (header pill and notice). The aside is headed “Where it stands” and keeps formats, revision and dates |
| “Submitted: Not yet” on drafts | removed; the draft notice already says nothing is submitted |
| “WEB · AR” as text | format chips with an aria-label (“Formats: WEB, AR”) |

The script results are in `evidence/copy-check-f-1440.json` and `evidence/copy-check-f-375.json`.

## Page heights, baseline → final (board heights, px)

| Board | Baseline | Final | Why |
| --- | --- | --- | --- |
| VE-04 all formats · 1440 | 3,795 | 2,561 | one block per format, guidance written once |
| VE-04 all formats · 375 | 5,216 | 3,774 | same |
| VE-04 fields to fix · 1024 / 768 | 2,576 | 2,209 | same |
| VE-02 · 375 | 2,111 | 1,593 | three-line cards |
| VE-07 returned · 1440 | 1,925 | 1,768 | status stated once, one Details sheet |
| VE-08 · 1440 | 2,523 | 2,081 | returned-reason panel, section grid |
| VE-09 · 375 | 1,830 | 1,523 | section grid |
| VE-01 · 375 | 1,353 | 1,895 | longer by design (R1): the reason in full, references and recent activity |
| VE-13 · 375 | 1,222 | 1,566 | longer by design: “Where it stands” now also shows on the history tab |

The dialog and menu boards (VE-04-leave-guard, VE-06-confirm, VE-08-confirm and menu-375) are now measured at the full page height, so the page under the overlay is visible. That is a change in how they are measured, not in the design.

**Phone first screen (375 × 812, VE-01).** The **Revise “Forced Convection”** button ends at 799px, which is inside the first screen (baseline: 590px). The returned item and drafts come before the counts on phones.

## EXERCISED in a real browser (LOGIC TESTED)

| Suite | 1440 | 1024 | 768 | 375 |
| --- | --- | --- | --- | --- |
| Journeys (J1 create → submit, J2 return → revise → resubmit, J3 read-only and refusals, L list, S shared) | 99 / 99 | 99 / 99 | 102 / 102 | 102 / 102 |
| Links (every remaining in-role, shared and reviewer control, LK-xx) | 54 / 54 | 51 / 51 | 53 / 53 | 53 / 53 |

The counts differ by width for two reasons:

- The phone menu exists only below 1024px, so S adds 3 drawer checks and LK adds LK-31 and LK-32 there.
- The aside outline appears only when the editor area is at least 860px wide, which here means 1440. At the other widths the top stepper takes its place, so LK-N4, LK-N5 and LK-F4 run at 1440 only.

**J1 · create through to history.**

1. Overview → Create experiment.
2. Continue with nothing filled gives 5 required errors, and the summary takes focus. The summary links focus their fields.
3. Only assigned courses are offered. The unique-name rule catches the catalogue name and the Vendor's own name, case-insensitively.
4. Save draft assigns SUB-0087 with a time and moves focus to the saved status. Leaving needs no guard once saved. The list shows 7 experiments, with the new Draft “Saved at step 1”.
5. Edit draft reopens the same editor with the saved values.
6. Step 2 covers no format, the WEB block, the https rule and the browser need. The leave guard opens and focuses its title, and Keep editing keeps the values.
7. Step 3 covers the preview-label rule and Add document.
8. Step 4 shows the ready notice and the “does not publish” note.
9. The dialog focuses its title, Tab cycles inside it, Escape returns focus, and the confirm button shows a busy state.
10. The outcome says nothing is published.
11. The record shows With Academic Reviewer, and the history shows the submission.
12. The list keeps the change. The Overview drops the draft, recent activity shows the submission first, and the counts move it to In review.

**J2 · return through to history.**

1. Reset restores the scenario.
2. The Overview lead opens Revise with the reason above the editor and focused. Each reference focuses its AR field, and the fields are tagged. Changes survive step navigation.
3. Save changes creates a private revision. The record lists the changed fields, the primary action becomes Continue revising, and the list tag reads “Changes saved, not resubmitted”.
4. The resubmit note and dialog are neutral and name no reviewer. The outcome says “Submitted — your changes have been submitted for review.”
5. The record says Submitted and the reason is gone. The history adds “Submitted · revision 2”. The list and Overview keep the change.
6. There is no route control; the reviewer bar explains the route. Conduction Through a Composite Wall reads “Submitted · revision 2” with no routing entry.

**J3 · read-only and refusals.**

- The published record has no edit, revise, publish, update or add-format controls, and says changes are not made here.
- A stale revise link gives the “already submitted” refusal. Edit on an approved experiment gives the “approved” refusal.
- A withdrawn course makes the draft read-only with nothing submittable. A new experiment with a withdrawn course shows the course error.
- The Content Manager return shows its reason and the summary reference.

**L · the list.**

- Search works by name, ID and course. No match offers Clear filters, which returns focus to Search.
- Status tabs show counts, and only statuses that are present. A tab is pressed, filters, and has an accessible name with its count. Draft includes the read-only draft, and All clears the filter.
- Changed in the last 7 days returns the expected three.
- The visible sort flips the order.
- Failed → Try again reloads the list.

**S · shared surfaces.**

- The account menu shows name, role and organisation; Escape closes it and returns focus.
- Help & support → Report a problem has Where prefilled. Validation focuses the summary, the report gets reference SUP-0181, and My reports lists it.
- Sign out reaches the handoff note. Not your workspace → Back to Overview works.
- Below 1024px the drawer opens with focus on Close, traps focus, and closes on Escape with focus back on Menu.

**LK · links.**

- **LK-01…LK-30:** the Overview (create, lead, Finish draft, a recent-activity row, Changed in the last 7 days, real counts, See all, first-visit create), My experiments (create, empty create, row link, Revise, Edit draft), editor breadcrumbs, the submitted outcome, refusals, read-only Back and Ask for help, record Edit draft, Revise and resubmit, a reference chip, Ask for help, breadcrumb and tabs, and Help, Not-your-workspace and the rail.
- **LK-31, LK-32:** the phone menu.
- **LK-E1…E3:** leave guard, Go to, Back.
- **LK-P1…P4:** the reviewer bar.
- **LK-R1…R3:** refusals for published, being reviewed and already submitted.
- **LK-N1…N7** (R1 controls): Attach file; block status counting the file; block turning Complete; outline focus; outline mirroring status; status tabs by keyboard; tabs keeping focus.
- **LK-F1…F6** (final pass):
  - F1: Change on Formats and delivery opens step 2.
  - F2: Change on Preview and documents opens step 3.
  - F3: Remove a document empties the list and shows the empty line, and Add document adds one.
  - F4: the “Catalogue text” outline entry focuses its section.
  - F5: the History tab keeps “Where it stands” and focuses the history heading.
  - F6: the private revision is stated inside the returned-reason panel with “Changed since revision 1”.

## Keyboard paths (exercised)

- The skip link is the first tab stop and is visible on focus. Enter moves focus to the page (`#ve-main`), and the next Tab lands inside the page. Checked on the Overview, the editor and the record at all four widths, 12 / 12 (`evidence/skiplink-f.json`).
- Tab order at 1440: skip link → rail (Overview, My experiments, Help & support) → reviewer bar (when shown) → account menu → page. On phones the reviewer bar is followed by Menu and then the account menu.
  - `evidence/keyboard-order-f.txt` records ten screens with the reviewer bar hidden.
  - `evidence/keyboard-order-reviewer-bar-f.txt` records the Overview with the bar shown.
- In the editor the order is the breadcrumbs → the form, top to bottom → the actions row (Back, Save, Continue or Submit) → the aside outline.
- The error summary takes focus, and its links focus their fields.
- Dialogs (submit, resubmit, leave): focus starts on the title, Tab is trapped inside, and Escape closes and returns focus to the trigger.
- The account menu takes focus on its first item, and Escape returns focus to the account button.
- The phone menu takes focus on Close, traps focus, and Escape returns focus to Menu.
- Revise focuses the returned reason first, and a reference chip focuses its field.
- Clear filters returns focus to Search. Save draft moves focus to the saved status.
- Status tabs work with Enter and Space and keep focus. The History tab moves focus to the history heading.

## SOURCE CHECKED

- `core.css`, `rb.css` and `rb-kit.css` are byte-identical to the foundation hashes (`FOUNDATION-LOCK.md`).
- `v3-vendor.css` adds only role-scoped `ve-` and `vr-` classes, and adjusts shared classes only under a role parent. Every `var(--…)` and every literal colour it uses already exists in the shared files (checked by script). 119 rules that no screen used any more were removed after the merge.
- The kit classes named in `COMPONENT-EXTENSIONS.md` exist and are used.
- Every board in `canvas.json` is a file in `project/`, and every `.dc.html` file is a board. All 69 wrappers import `Main` and render without errors.
- Validation copy is v46's exact wording. No decision IDs appear in product copy.
- No link leads to VE-10/11/12/14/15 or to other roles.
- A second returned item on the Overview uses the same handler as the exercised lead; the sample has one returned item at a time.
- Reduced-motion rules are present in CSS.
- The sample IDs avoid collisions with the rest of the pack. SUB-0085 and SUB-0086 belong to other roles' samples, so the demo uses SUB-0087. SUP-0181 is not used elsewhere.

## NOT TESTED

| Not tested | Why it matters | How to resolve |
| --- | --- | --- |
| The hosted canvas opened in a browser | Published files and the runtime are byte-identical to the tested ones, but nobody has pressed Play on the host yet | Open the Design canvas, press Play on the first board and click Create experiment. If the form opens, the hosted run matches |
| Screen-reader output | Labels, roles, `aria-current`, `aria-pressed`, `aria-invalid`, `role="alert"` and `role="status"` are present by source, but no screen reader was run | Run VoiceOver or NVDA over J1 during implementation QA |
| 200% text zoom, touch-only devices, a real phone | Only viewport emulation was used | Check on one real phone during implementation QA |
| Google Fonts on the host | Same family and weights, loaded from a different source here | Visible on the first hosted Play: headings should be Public Sans, not a fallback |

## Findings left open

- None that block acceptance.
- Cosmetic, reviewer tooling only: at 375 the native Screen and Scenario selects in the reviewer bar truncate long option names. It is not product UI; safe to leave.
