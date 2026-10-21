# Student · final design · integration handoff

Foundation `XR-V3-RB-1.0` · role Student · 19 owned IDs (ST-01 … ST-19) · ST-20 excluded.

**Status: DESIGN COMPLETE (19 / 19) · CONNECTED PREVIEW COMPLETE · ASSEMBLY PENDING XS · OWNER APPROVED (21 Oct 2026).** Approved by the owner on 21 Oct 2026 for integration into the existing V3 frontend. This is the one Student design to implement; every earlier generation is superseded. Design only: no backend and no repository changes, and this package starts no work by itself. The sample data is illustrative (`SCENARIOS.json`).

## How the files fit together

| File | Role |
| --- | --- |
| `project/StudentFinal.dc.html` | **The one final design**: every Student screen, its states and the connected journeys in one component, with one state (scenario world + route + UI). The dark review strip on top is preview tooling: never port it |
| `project/v3-student-final.css` | **The one role stylesheet**, loaded after `core.css`, `rb.css` and `rb-kit.css` (byte-identical foundation). Part A carries, verbatim, the original's shell, focused-task shell and borrowed XS rules. Part B holds the Student components (`sv-`). See `COMPONENT-EXTENSIONS.md` |
| `project/F-*.dc.html` | 143 fixed boards: one scenario, screen and state each, at 1440, 1024, 768, 375 or 320. Evidence only |
| `project/canvas.json` | Final-only index of this package. The published canvas has the same **Final** page, plus a **History** page with every superseded generation (not in this package) |
| `checks/build/` | `Main.dc.html` (the original design: build input for the logic, verified by hash), the final templates and view models, and the build scripts. This is how `StudentFinal.dc.html` is reproduced, not a design to implement |

**Reproducible build.** `fx_build.py` takes the original `Main.dc.html`, checks it against its hash, and replaces only its template regions and presentation view models with `final-src/`. `fx_consolidate.py` then writes the one stylesheet. Outside the replaced regions, the final differs from the original only in three places: the page title, the one stylesheet link, and seven lines in `renderVals()` that call the new view models (checked by `fx_source.py`).

## Integrating it into the existing V3 frontend

1. **Port one design per screen.** Templates live in `StudentFinal.dc.html`, one commented region per ID (map below); their presentation view models are the methods named in the map. Every other method is the original design's code, verbatim, and corresponds to behaviour the app already has.
2. **Port one stylesheet**: the anatomy and rules in `v3-student-final.css`. Ignore the `sv-` / `st-` prefixes if the app has its own naming. Do not import any earlier Student stylesheet. The four retired generations are listed in `CONSOLIDATION-LEDGER.md`.
3. **Keep the app's real routes.** The preview uses the v46 route proposals as hash links only to identify screens.
4. **Keep the app's data.** `SCENARIOS.json` contains fixtures. Never paste them over the application's records.
5. **Shared surfaces.** The account menu, Help & support, signed out, not your workspace and the inactive notice are faithful borrowed versions of the XS contract. Use the XS team's delivered components when they exist (*assembly pending XS*), and keep the app's working Help and account meanwhile.
6. **Runtime differences.** `support.js` (the design runtime) is not in the package and must never ship. The runtime wraps every text hole in `<span class="sc-interp">`; the stylesheet never relies on that wrapper.

## Screen map

| ID | Screen | Type | Template region · view model | Boards (canvas rows) |
| --- | --- | --- | --- | --- |
| ST-01 | Home | page | `home` · `homeVM`, `nextStep` | Home |
| ST-02 | My courses | page | `courses` · `coursesVM`, `courseCard`, `xcard` | My courses · All my experiments |
| ST-03 | Course (student view) | page | `course` · `courseVM` | Course |
| ST-04 | All my experiments | tab | `courses` (tab) · `coursesVM` | My courses · All my experiments |
| ST-05 | Experiment hub · Overview | page | `hubhead`, `overview` · `hubVM` (verbatim), `overviewVM` | Overview |
| ST-05 · Assessment tab | part of ST-05 | tab | `asmttab` · `asmtTabVM` | Assessment tab · Progress tab |
| ST-06 | Resources | tab | `resources` · `resVM` | Resources · Simulation |
| ST-07 | Simulation — choose a format | tab | `simprog` · `simVM` | Resources · Simulation |
| ST-08 | WEB simulation | page | `fpage` · `fpageVM` | WEB · sample activity |
| ST-08a | Sample activity (part of ST-08) | step | `focusact` · `actVM` | WEB · sample activity |
| ST-09 | VR (AR / MR refusals) | page | `fpage`, `msg` · `fpageVM`, `msg` | VR · AR and MR |
| ST-10 | Progress for this experiment | tab | `simprog` · `progTabVM`, `progExp` | Assessment tab · Progress tab |
| ST-11 | Assessments | page | `alist` · `alistVM` | Assessments |
| ST-12 | Before you start | page | `aintro` · `introVM` | Before you start |
| ST-13 | Attempt | step | `focusatt` · `attVM` (dialog region is the kit's DL-1, unchanged) | Attempt |
| ST-14 | Result | page | `result` · `resultVM` | Result |
| ST-15 | Progress | page | `progress` · `progVM`, `progExp` | Progress |
| ST-16 / ST-17 | Feedback · sent | step / state | `feedback` · `fbVM` | Feedback · sent |
| ST-18 | My device | page | `device` · `devVM` | My device |
| ST-19 | Not available | state | `msg` · `msg` | Not available |

What changed and why, per ID and per subview: `COVERAGE-REGISTER.md`. How the four earlier generations were merged: `CONSOLIDATION-LEDGER.md`.

## Rules the design encodes (unchanged from the original, now visible)

- **Access and entitlement**: `resolve()` is verbatim. All 690 scenario × screen routing decisions are identical to the original (logic test). Publication, institutional access, the student's grant, activity and completion are kept apart. Refusals keep their titles and every destination the original offered.
- **One next action.** At most one gold action per view. On Home, the Overview and the hub it is the same next step: `nextStep` gives the original hub rule, with the same label and destination in every scenario.
- **Format language**: the 56 × 24 chip, always with words:
  - solid navy ✓: available to you
  - dashed indigo: published, but not in your institution's access
  - grey: not published
  - outlined navy + glyph: given but held
  - grey outline + dash: access ended
- **Progress**: per format only. No percentages and no invented metrics. Stage trackers show only the recorded stages of the sample activity.
- **Completion** comes only from the simulation or the headset; opening never completes. The page says so where the action is.
- **Feedback**: unlocks only for a completed format; one record per student × experiment × format; read-only once sent; answers are kept when sending fails.
- **Assessment**: facts come from the assessment version; three question types; no timer and no auto-submit; answers save as they change. The submit dialog names unanswered questions. Withheld results never show marks or answer keys. *Try again* only when not passed and attempts remain.
- **Device**: an authorisation change only; nothing is shipped. *New device* is the only required field. Three dated steps; no Decline; no new request while one is open or while access is paused.
- **Held states are said once** per page (banner, pill or note).
- **Focus**: after navigation, focus goes to the H1; after mutations, to the result (status, error summary, done card). Dialogs and the drawer trap focus.

## Shared contracts and cross-role flows (from `CROSS-ROLE-FLOWS.json`, preserved)

| Flow · step | Screens | Record and transition | How the design shows it |
| --- | --- | --- | --- |
| B · 4: the institution grants an experiment | ST-01 → ST-02 → ST-05 | SACC-0310 (record, not shown to the student): — → Not started | Scenario *Given, nothing started*; the grant line on Progress |
| C · 1–2: resources, then a format | ST-05 → ST-06 → ST-07 → ST-08 / ST-09 | RUN per format: Not started → In progress → Completed | Journey 1; per-format progress, no overall verdict |
| C · 3: feedback after completion | ST-10 / ST-15 → ST-16 → ST-17 | FB, one per student × experiment × format | Journey 2; *Give feedback* only after Completed |
| D · 2: attempt and submission | ST-11 → ST-12 → ST-13 | ATT-0450: To do → In progress → Submitted | Journey 3; Submit reachable at every width |
| D · 4: Faculty releases the result | FA-12 → ST-14 | ATT-0450: not released → Result ready | Scenarios *Marked, not released* and *Result released*: documented handoff, no live propagation between canvases |
| F · 4: content version change | CM-05 / CM-08 → ST-05 | EXP live version | The hub reads the live version; no Student control |
| Device · 1–3: transfer request (Student, then Institute Admin IA-18 / IA-19, then Super Admin SA-18 / SA-19) | ST-18 | DTR-0018 (record, not shown to the student): with your Institute Admin → forwarded to BITS → approved | Journey 4; steps 2–3 shown as the device scenarios (documented handoffs) |

Ownership (`SCREEN-OWNERSHIP.json`): ST-01 … ST-19 are designed by the Student workstream. ST-20, the signed-in catalogue, is excluded by an existing decision and is not a destination in this design.

## Commands and reads to bind (intent only; existing names are in the app)

| Intent | Used by | Notes |
| --- | --- | --- |
| Read the student's home model: current experiment and its next step, the rest of the experiment, what it teaches | ST-01 | Next step = the hub rule |
| Read courses and experiments given to the student, with per-format status | ST-02, ST-03, ST-04 | Only grants, never the institution's catalogue |
| Read the experiment hub: description, outcomes, formats for you, resources, assessment summary, next step | ST-05 … ST-10 | |
| Record resource opened | ST-06 | Opened ≠ progress |
| Launch / resume WEB; record an activity stage; complete on the last stage (system-owned) | ST-08, ST-08a | Stages are illustrative in this design |
| Read format run facts (first opened, last saved / session, completed, by whom) | ST-07, ST-09, ST-10, ST-15 | |
| Submit format feedback (once per student × experiment × format) | ST-16 → ST-17 | |
| Read the assessment version; start an attempt; save an answer; submit; start a retry | ST-11 … ST-14 | |
| Read the result under its release terms | ST-14 | Withheld → no marks or keys |
| Request a device transfer; read its status and history | ST-18 | DTR record; no Decline |
| Shared: account menu, help reports, sign out, refusals | XS-03 … XS-08 | From the XS workstream |

## Decisions for the owner (made during the redesign, reversible)

1. **Internal record identifiers are not labels on Student pages** (owner decision at approval, 21 Oct 2026). Student is an ordinary user-facing role, so the access-plan record (`ACC-0107`), the student-access record (`SACC-0310`) and the device-transfer record (`DTR-0018`) no longer appear in its sentences, grant line or request details. This is presentation only: every record is still carried in the data and in the view models, no business rule, route, guard, state transition or mutation changed, and nothing else moved on the page. What changed, and how to show an identifier again:

   | Where it was | Now | Restore by |
   | --- | --- | --- |
   | Licence-wait sentence, “No licence is available for you **on ACC-0107** right now.” — ST-05 Overview pill, ST-07 chooser note, ST-08 WEB, ST-09 VR, ST-10 / ST-15 Progress | “No licence is available for you right now.” | put ` on ACC-0107` back in the one sentence in `vm-shared.js` (`holdReason`), `vm-hub.js` (band + chooser note), `vm-fpage.js` (two places), `vm-prog.js` and `render-edits.json` |
   | Progress grant line, “Given by your institution **· SACC-0310**” — ST-15 (ST-10 never showed it) | “Given by your institution” | append ` · SACC-0310` to `given` in `vm-prog.js` (`progExp`) |
   | My device, the **Reference** row (`DTR-0018`) and the earlier-request line — ST-18 | no Reference row; the request is identified by its dated steps, From / To and your note | `hasRef: hasReq && !!d.ref` in `vm-dev.js` (`ref` is still there), and the `prevText` line beside it |

   Earlier positions, for the record: checkpoint 2 hid two of these and asked for a decision; owner decision 6 limited hiding to Super Admin; R2 and the final candidate preserved the original design's identifiers. The approval decision supersedes those for Student. Student-facing codes that are **not** internal identifiers stay: the course codes `MEC-523` and `ME ZG523` (open decision 3) and the headset's physical asset tag `GIT-VR-03`, which the student needs to pick up the right device. A rendered scan of every case confirms these are the only identifier-shaped strings a student can see (`CHECKS.md`).
2. **Home has no shortcut links** to the hub's Simulation, Assessment and Progress tabs, and no *View all courses*. The destinations stay one click away. This is the only place where an original destination left a page (link comparison over 155 cases × 4 widths).
3. **Message title 30/36** for refusals and withheld results, so a refusal reads as a message rather than a destination.
4. **Format pages**: *Back to Simulation* left the card (the breadcrumb keeps it); *Report a problem* sits in a help row.
5. **AR / MR refusals** lead with *Formats you can use*. **ST-19** lists *Experiments you can open*.
6. **Result review** shows the correct answer only where the student's answer differs.
7. **Experiment sections on phones** wrap as chips below 480 px.
8. **Progress tables** become two-column rows below 766 px (final pass). The status column moves under the format name.

## Open decisions: the original's position preserved

1. **Ended vs withdrawn access**: one refusal component with two titles, *See your earlier work* and *Back to My courses*.
2. **Released result after access ends**: kept readable on ST-14 and Progress.
3. **Student-facing course code**: MEC-523 with the BITS code (ME ZG523) beside it.
4. **Support / reference identifiers**: settled for Student by decision 1 above — none is shown. Still open for the roles that may need one (the help report reference is not shown either; borrowed XS-07, unchanged). If support later needs the student to quote a transfer reference, restore the row as decision 1 describes rather than inventing a new one.
5. **Sample-activity stages are illustrative.** Bind the real activity's stage names and count before implementation; if the real simulation reports no stages, remove the trackers.
6. **Skip link** (a proposal), plus the inherited items: try again after passing; a pause reason line; how AR / VR apps reach devices; extra device fields; the licence-counting explanation; one assessment per experiment.
7. **Minor inconsistency inherited from the original, not changed**: the hub rule labels VR in progress *Open VR*, while the Simulation and Progress rows say *Continue VR*. Both open the VR page.

## Changes from the v46 visual treatment and from the original V3 design

- Refined B shell, kit and status grammar. Content, wording, rules and states follow v46 and the original design.
- **One main surface plus at most one aside per page; no card inside a card.** The 72 px format tiles became 56 × 24 chips with words.
- **Home**: one *Continue learning* card with the next step and a stage tracker; the rest of the experiment as a quiet list; what you learn.
- **Hub**: Overview reads in order (about → outcomes → formats and progress, resources and assessment beside). Resources is a reading list; Simulation is a format chooser; the Assessment tab is led by its date; the Progress tab shares the Progress rows.
- **Format pages**: one launch card with stages and honest hints; the sample activity in a focused column.
- **Assessments**: rows led by the key date; *Before you start* as one card; the attempt as one numbered sheet with a navigator; the result as a score panel with marks by question.
- **Feedback**: one rating sheet with the scale named once; sent feedback on the same scale.
- **My device**: the request as three dated steps.
- **Refusals**: one compact card with what the student can still do.

## Sources

v46 boards B2-10 … B2-13, B3-01 … B3-07, B4-11 … B4-13 and the shared boards; V3 Refined B sources (`references/v3`); the owner briefs for the original design, checkpoints 1 and 2, R2 and this final pass; pack guards `common/01` … `05`.
