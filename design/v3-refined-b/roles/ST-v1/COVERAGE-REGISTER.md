# Coverage register · Student · final design

Status: **DESIGN COMPLETE (19 / 19) · CONNECTED PREVIEW COMPLETE · ASSEMBLY PENDING XS · OWNER APPROVED (21 Oct 2026)**.

Every owned screen ID (19 of 19) and its important subviews (60 rows), plus the role-level shell parts and the borrowed shared surfaces. **Status** is measured against the original complete-role design (`project/Main.dc.html`): each case was rendered from Main and from the final preview at 1440, 1024, 768 and 375 and the pixels compared — the whole page, or the named component for the parts drawn by shared components. **REDESIGNED** = it differs; **REVIEWED AND UNCHANGED** = reviewed in the final pass and identical to the original.

Result: 57 of 60 owned subviews REDESIGNED, 3 REVIEWED AND UNCHANGED; nothing is pending, incomplete or awaiting propagation (see `CONSOLIDATION-LEDGER.md`).

| ID | Screen | Status | Subviews | Final pass | Journeys |
| --- | --- | --- | --- | --- | --- |
| ST-01 | Home | REDESIGNED | 5 (5 redesigned) | changed | J1 J2 J5 |
| ST-02 | My courses | REDESIGNED | 3 (3 redesigned) | no change needed | J1 (breadcrumb) |
| ST-03 | Course (student view) | REDESIGNED | 2 (2 redesigned) | no change needed | J1 |
| ST-04 | All my experiments | REDESIGNED | 3 (3 redesigned) | no change needed | link map |
| ST-05 | Experiment (hub: Overview · Resources · Simulation · Assessment · Progress) | REDESIGNED | 3 (3 redesigned) | changed | J1 J5 |
| ST-05as | Experiment · Assessment tab (part of ST-05) | REDESIGNED | 2 (2 redesigned) | changed | link map |
| ST-06 | Resources | REDESIGNED | 3 (3 redesigned) | no change needed | J1 |
| ST-07 | Simulation — choose a format | REDESIGNED | 2 (2 redesigned) | changed | J1 J4 |
| ST-08 | WEB simulation (launch / resume) | REDESIGNED | 3 (3 redesigned) | changed | J1 J5 J6 |
| ST-08a | WEB · simulated sample activity (part of ST-08) | REDESIGNED | 3 (2 redesigned) | no change needed | J1 |
| ST-09 | AR / VR / MR format (setup & progress) | REDESIGNED | 3 (3 redesigned) | changed | J4 J5 |
| ST-10 | Progress for this experiment | REDESIGNED | 2 (2 redesigned) | changed | link map |
| ST-11 | Assessments | REDESIGNED | 3 (3 redesigned) | changed | J3 |
| ST-12 | Assessment — before you start | REDESIGNED | 2 (2 redesigned) | changed | J3 J5 |
| ST-13 | Assessment attempt | REDESIGNED | 6 (4 redesigned) | changed | J3 |
| ST-14 | Result | REDESIGNED | 2 (2 redesigned) | changed | J3 |
| ST-15 | Progress (all experiments) | REDESIGNED | 3 (3 redesigned) | changed | J1 J5 |
| ST-16 | Format feedback | REDESIGNED | 4 (4 redesigned) | no change needed | J2 J5 |
| ST-17 | Feedback sent (confirmation, read-only) | REDESIGNED | 1 (1 redesigned) | changed | J2 |
| ST-18 | My device (AR/VR/MR holders only) | REDESIGNED | 4 (4 redesigned) | changed | J4 J5 |
| ST-19 | Experiment not available (refusal page) | REDESIGNED | 1 (1 redesigned) | no change needed | J5 |

## Role-level parts (shared by every screen)

| Part | Status | Basis |
| --- | --- | --- |
| Navigation rail and top bar (foundation shell) | REVIEWED AND UNCHANGED | the component is pixel-identical to the original in 10 renders (.rb-rail, fixed viewport) |
| Top bar with the date and the account button | REVIEWED AND UNCHANGED | the component is pixel-identical to the original in 4 renders (.rb-top, fixed viewport) |
| Menu drawer below 1024 px | REVIEWED AND UNCHANGED | the component is pixel-identical to the original in 2 renders (.rb-drawer, fixed viewport) |
| Held-access banners (institution paused, account inactive) | REVIEWED AND UNCHANGED | the component is pixel-identical to the original in 2 renders (.rk-banner, fixed viewport) |
| Breadcrumbs | REVIEWED AND UNCHANGED | pixel-identical to the original design in 16 renders (.rk-crumbs) |

## Borrowed shared surfaces (XS contract, not owned by Student)

| ID | Surface | Status | Measured |
| --- | --- | --- | --- |
| XS-05 | Account menu | BORROWED · UNCHANGED · ASSEMBLY PENDING XS | component pixel-identical to the original in 4 renders |
| XS-07 | Help & support (and Report a problem) | BORROWED · UNCHANGED · ASSEMBLY PENDING XS | page pixel-identical to the original |
| XS-03 | Signed out | BORROWED · UNCHANGED · ASSEMBLY PENDING XS | component pixel-identical to the original in 4 renders |
| XS-06 | Not your workspace | BORROWED · UNCHANGED · ASSEMBLY PENDING XS | component pixel-identical to the original in 4 renders |
| XS-08 | Account inactive notice | BORROWED · UNCHANGED · ASSEMBLY PENDING XS | component pixel-identical to the original in 2 renders |

## ST-01 · Home

**Purpose.** Show what the student is learning now, where they left off and the one next action; reach the course, experiment, resources, formats and assessment.  
**Main action.** The next step for the current experiment (e.g. Continue WEB).

**Treatment as built.** One “Continue learning” card: course line (code chip + course link), the experiment and what it is, the next-step strip (format chip, “Your next step”, title, detail, the sample activity’s three-stage tracker while WEB is in progress, the one gold action and Open experiment). “Also in this experiment” lists resources (opened count), the other format and the assessment with real status; “What you’re learning” below. Held (licence, paused) → the strip becomes a held line with no action; ended / withdrawn → “Your earlier work” with See earlier work; new student → message with a three-step How it works; inactive → one line under the borrowed XS-08 banner.

**Final pass.** Stage checks kept at 375 (hidden only on 320 phones).

| Subview | Kind | Status | Basis | Widths | Boards |
| --- | --- | --- | --- | --- | --- |
| Home · active learner: next step with the stage tracker, also in this experiment, what you learn | page | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 5 |
| Learning states: given, assessment ready, attempt in progress, feedback to give, VR in progress / not now / done, waiting, released | state | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 | 0 |
| New student: no access yet, how it works | state | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 | 1 |
| Held access: waiting for a licence, institution paused, ended, withdrawn, no headset formats | state | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 4 |
| Account inactive (borrowed XS-08 notice above the page) | state | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 | 0 |

## ST-02 · My courses

**Purpose.** List the courses that contain experiments given to the student and lead into them.  
**Main action.** Open a course or go straight to its experiment.

**Treatment as built.** Tabs Courses | All experiments. Each course is a section: code chip and engineering area, course name, BITS course code chip, count, held pill, Open course; the experiments given to you as rows (title, two-line description, format chips with status words, Open experiment). Earlier work card for ended / withdrawn; loading skeleton; failure with Try again; new-student message.

**Final pass.** Reviewed again at 1440, 1024, 768, 375 and 320: no change needed.

| Subview | Kind | Status | Basis | Widths | Boards |
| --- | --- | --- | --- | --- | --- |
| My courses · course sections with experiment rows | page | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 2 |
| Given, new student, waiting for a licence, paused, access ended / withdrawn (earlier work) | state | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 1 |
| Loading and could not load (Try again) | state | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 | 2 |

## ST-03 · Course (student view)

**Purpose.** Show one course and the experiments given to the student in it.  
**Main action.** Open an experiment.

**Treatment as built.** Record header (Course · area eyebrow, title, held pill, BITS code chip, count) and one “Experiments given to you” card with the same experiment rows as My courses. Paused is said by the pill and the rows (no extra notice). No current course → compact refusal card.

**Final pass.** Reviewed again at 1440, 1024, 768, 375 and 320: no change needed.

| Subview | Kind | Status | Basis | Widths | Boards |
| --- | --- | --- | --- | --- | --- |
| Course · experiments given to you | page | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 2 |
| Paused, waiting for a licence, new student, course not current (refusal with earlier work) | state | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 | 2 |

## ST-04 · All my experiments

**Purpose.** Find any experiment given to the student across courses.  
**Main action.** Open an experiment.

**Treatment as built.** One panel: toolbar (search, format, result count, removable filter chips, Clear filters) and experiment rows (code chip, course, title, description, format chips with status, Open experiment). No match is a compact row state with Clear filters.

**Final pass.** Reviewed again at 1440, 1024, 768, 375 and 320: no change needed.

| Subview | Kind | Status | Basis | Widths | Boards |
| --- | --- | --- | --- | --- | --- |
| All my experiments · toolbar (search, format filter) and rows | tab | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 2 |
| Search / filter with no match, chips and Clear filters | form | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 1 |
| Ended, paused, loading, could not load | state | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 0 |

## ST-05 · Experiment (hub: Overview · Resources · Simulation · Assessment · Progress)

**Purpose.** Introduce the experiment: what it is, what you learn, your formats and progress, resources and assessment.  
**Main action.** The next step on its own row (gold).

**Treatment as built.** Header: code chip, course, title; held pill with the licence sentence on Overview. Five section tabs, wrapping as chips on phones so every section and the current one stay visible. Overview (checkpoint 2 design, kept): about → what you’ll learn → formats and your progress (yours with status and one action, the next step marked in place; not available with reasons) with learning resources and the assessment beside it.

**Final pass.** Assessment tab: on tablets the action keeps its own width under the content (was a full-width bar). The licence-wait sentence no longer names the access-plan record (owner decision: internal identifiers stay out of Student labels).

| Subview | Kind | Status | Basis | Widths | Boards |
| --- | --- | --- | --- | --- | --- |
| Experiment header and the five section tabs (wrapping chips on phones) | nested page | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 5 |
| Overview tab: about, what you learn, formats and your progress, resources and assessment beside | tab | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 7 |
| Held: waiting for a licence, paused, ended / withdrawn refusals, new student | state | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 2 |

## ST-05as · Experiment · Assessment tab (part of ST-05)

**Purpose.** Show this experiment’s assessment and its state.  
**Main action.** Open, continue or see the result.

**Treatment as built.** One card: deadline date block (Due / Deadline), assessment name and what it covers, status pill and state words, key facts line, one action. None set → compact message.

**Final pass.** On tablets the action keeps its own width under the content (was a full-width gold bar).

| Subview | Kind | Status | Basis | Widths | Boards |
| --- | --- | --- | --- | --- | --- |
| Assessment tab: deadline block, what it covers, state and one action | tab | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 2 |
| In progress, submitted, not released, released, not passed, none set yet | state | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 2 |

## ST-06 · Resources

**Purpose.** Let the student read the experiment resources (each opens in a new tab).  
**Main action.** Open a resource.

**Treatment as built.** Reading-list card: type tile, title, type · length, opened state with the time (Opening…, It didn’t open — Try again), Open ↗. A pause or licence wait is said once above the list. Aside: Before you run a simulation · Opened isn’t progress (opened count). None, loading and failed states.

**Final pass.** Reviewed again at 1440, 1024, 768, 375 and 320: no change needed.

| Subview | Kind | Status | Basis | Widths | Boards |
| --- | --- | --- | --- | --- | --- |
| Resources tab: reading list with type, length and when opened; aside on how resources relate | tab | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 2 |
| A resource did not open (Try again) | state | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 1 |
| Given, paused, waiting for a licence, loading, could not load | state | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 1 |

## ST-07 · Simulation — choose a format

**Purpose.** Choose a format for the simulation.  
**Main action.** Continue or open the chosen format.

**Treatment as built.** Format chooser: “Choose a format” with one note (a licence wait is said there once). Your formats as two cards: chip, name, Next step tag, access words, what you need, your headset for VR, progress pill, WEB stage tracker, dated facts, the hold reason, one action. “Not available to you” as compact rows with the reason.

**Final pass.** An unstyled hook class removed from held format cards (no visual change); stage checks kept at 375. The chooser’s licence note no longer names the access-plan record.

| Subview | Kind | Status | Basis | Widths | Boards |
| --- | --- | --- | --- | --- | --- |
| Simulation tab: two format cards (next step tagged), formats not available listed with reasons | tab | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 3 |
| Given, VR not now, VR in progress, both completed, waiting for a licence, paused | state | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 3 |

## ST-08 · WEB simulation (launch / resume)

**Purpose.** Launch or resume the WEB simulation (simulated sample activity in this prototype).  
**Main action.** Launch / Continue WEB.

**Treatment as built.** Header: format chip, experiment, title, status pill with last saved or completion. Launch card: state heading, one sentence, stage tracker (in progress / completed), the gold Launch / Continue with an honest hint (opening doesn’t complete WEB), failure notice with Try again, help row with Report a problem. Aside: About WEB (needs, in this prototype, completed means). Paused / waiting: no launch; the student’s own progress stays in the header.

**Final pass.** Stage checks kept at 375. The licence-wait sentence no longer names the access-plan record.

| Subview | Kind | Status | Basis | Widths | Boards |
| --- | --- | --- | --- | --- | --- |
| WEB page: launch card (stages, one action, help row) and the format facts | page | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 3 |
| Not started, completed (feedback), paused, waiting for a licence | state | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 | 3 |
| The simulation did not open (Try again, Report a problem) | state | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 1 |

## ST-08a · WEB · simulated sample activity (part of ST-08)

**Purpose.** Run the simulated sample activity stage by stage.  
**Main action.** Finish stage / Finish the activity.

**Treatment as built.** Focused page (exit and save status in the top bar). Narrow column: simulated tag and experiment, title, intro; large three-stage tracker; one stage card with Finish stage N (gold) and Leave and keep my place; completion card (Completed date, recorded by the platform, Give feedback on WEB, Back to WEB simulation).

**Final pass.** Reviewed again at 1440, 1024, 768, 375 and 320: no change needed.

| Subview | Kind | Status | Basis | Widths | Boards |
| --- | --- | --- | --- | --- | --- |
| Sample activity: stage tracker and one stage card | step | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 2 |
| Activity completed: recorded by the platform | state | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 1 |
| Focused-task bar: back link and save status | component | REVIEWED AND UNCHANGED | the component is pixel-identical to the original in 6 renders (.st-focusbar, fixed viewport) | 1440 · 1024 · 768 · 375 · 320 | 2 |

## ST-09 · AR / VR / MR format (setup & progress)

**Purpose.** Set up and follow progress for a headset format (VR); explain AR / MR.  
**Main action.** Follow setup; give feedback when completed.

**Treatment as built.** Same launch card for VR: state heading and sentence; your authorised headset with My device; numbered setup steps (open on the first visit, Hide / View toggle); help row; aside About VR. AR and MR are compact refusal cards with “Formats you can use” rows (Continue WEB / Open VR) and Back to Simulation.

**Final pass.** Setup-steps disclosure gets the same hover as text links. The licence-wait sentence no longer names the access-plan record.

| Subview | Kind | Status | Basis | Widths | Boards |
| --- | --- | --- | --- | --- | --- |
| VR page: set up (steps disclosure), your authorised headset, help row, format facts | page | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 2 |
| In progress, completed (feedback), not available right now, paused, waiting, no headset formats | state | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 4 |
| AR not included · MR not available (compact refusal with the formats you can use) | state | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 3 |

## ST-10 · Progress for this experiment

**Purpose.** Progress for this experiment, format by format.  
**Main action.** Continue or give feedback where allowed.

**Treatment as built.** One card “Your progress, format by format” with the grant note; the ST-15 table scoped to this experiment (format and access, progress pill, dated facts, one action), not-available rows, assessment line.

**Final pass.** The grant line carries no record identifier (as before). One 24 / 18 px gutter aligned with the card header; below 766 px the table becomes two-column rows (fixes content spilling past the card at 768–1024).

| Subview | Kind | Status | Basis | Widths | Boards |
| --- | --- | --- | --- | --- | --- |
| Progress tab: one row per format with dated facts, formats not available, assessment line | tab | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 4 |
| Given, paused | state | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 | 0 |

## ST-11 · Assessments

**Purpose.** List assessments: to do, submitted, results.  
**Main action.** Open / continue / see result.

**Treatment as built.** Tabs with counts (fit on phones). Rows led by the key date block — Due, Result after or Released (ivory only within two days of a deadline) — then experiment · code, name, description, status pill and words, one action. An empty tab says where the assessment is. No assessment at all: the checkpoint-2 compact message, kept. Loading and failed as compact states.

**Final pass.** At 320 the three tabs sit tighter, so “Results” and its count are no longer cut off at the edge of the tab strip.

| Subview | Kind | Status | Basis | Widths | Boards |
| --- | --- | --- | --- | --- | --- |
| Assessments: To do / Submitted / Results tabs with counts, rows led by the key date | page | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 4 |
| Empty tabs say where the assessment is; no assessments set; new student | state | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 2 |
| Loading and could not load (no counts shown) | state | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 | 1 |

## ST-12 · Assessment — before you start

**Purpose.** Brief the student before an attempt.  
**Main action.** Start / continue / try again / see result.

**Treatment as built.** One card. First the state: status pill, the state as the heading (Before you start, Attempt 1 in progress, Submitted — waiting for marking, …), the state sentence, the three rules while answering is possible (no time limit; answers save as you go; nothing is submitted until you choose Submit — you can’t change answers after), the gold action and Back to experiment. Then the deadline date block beside the key facts (questions, total marks, pass mark, attempts, result and answers, set by).

**Final pass.** The six key facts sit in two columns on phones (one column only below 330 px). Not passed: “Try again” and “See result” now reach the card edge on phones (the action row had shrunk to its two short labels).

| Subview | Kind | Status | Basis | Widths | Boards |
| --- | --- | --- | --- | --- | --- |
| Before you start: state, three rules and the action; deadline block and six key facts | page | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 4 |
| Attempt in progress, submitted, not released, released, not passed (try again), none set | state | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 4 |

## ST-13 · Assessment attempt

**Purpose.** Answer the questions; save; submit.  
**Main action.** Submit (with confirmation).

**Treatment as built.** Focused page. One numbered sheet: a number circle per question that fills when answered, type · marks, the question, answer rows or the written answer. One sticky panel: your answers (count, numbered strip, Next unanswered) and Submit with its rule; below 900 px the panel splits — answers at the top, Submit after the last question. Dialog, save failure and submit failure keep their behaviour; submitted card (Waiting for marking).

**Final pass.** Answered numbers in the navigator get a hover state.

| Subview | Kind | Status | Basis | Widths | Boards |
| --- | --- | --- | --- | --- | --- |
| Attempt: one numbered question sheet (choice, true / false, written) and the answer navigator | step | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 5 |
| Answers save automatically: saved / did not save + Try again | state | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 | 1 |
| Submit dialog naming unanswered questions (focus kept inside, Escape closes) | dialog | REVIEWED AND UNCHANGED | the component is pixel-identical to the original in 4 renders (.rk-dialog, fixed viewport) | 1440 · 1024 · 768 · 375 · 320 | 2 |
| Answers were not submitted (still saved) | state | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 1 |
| Submitted: waiting for marking | state | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 1 |
| Focused-task bar: back link and save status | component | REVIEWED AND UNCHANGED | the component is pixel-identical to the original in 6 renders (.st-focusbar, fixed viewport) | 1440 · 1024 · 768 · 375 · 320 | 4 |

## ST-14 · Result

**Purpose.** Show the result or why it is withheld.  
**Main action.** Back to experiment / Try again when allowed.

**Treatment as built.** Score panel: score, pass mark, attempt, release; marks by question as a jump list; Try again with attempts left when allowed. Answer review: your answer with a Correct / Not correct tag, the correct answer only where it differs, the explanation, your faculty’s feedback as a quote; Back to experiment and See your progress. Withheld results (not submitted, waiting for marking, not released) use the compact message card.

**Final pass.** Full-mark chips in “marks by question” get a hover state.

| Subview | Kind | Status | Basis | Widths | Boards |
| --- | --- | --- | --- | --- | --- |
| Result released: score panel, marks by question (jump list), answer review | page | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 5 |
| Not submitted / waiting for marking / not released: compact message, no marks | state | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 2 |

## ST-15 · Progress (all experiments)

**Purpose.** Progress across experiments, format by format.  
**Main action.** Continue / feedback where allowed.

**Treatment as built.** Filters (status, course), count and chips; per experiment: format table (format and access, progress pill, dated facts, one action), not-available rows, assessment line; “Given by your institution”, with no record identifier; held and ended states; loading, failed, no match, new student. R2 adds the shared tokens of the redesign (chips, tags, 13 px floor) and the licence sentence.

**Final pass.** The grant line reads “Given by your institution”, without the student-access record, and the licence-wait sentence no longer names the access-plan record. No box inside the card: experiments are flat groups with a tinted header band; one 24 / 18 px gutter; two-column rows below 766 px.

| Subview | Kind | Status | Basis | Widths | Boards |
| --- | --- | --- | --- | --- | --- |
| Progress: filters with chips, course groups, one row per format with dated facts | page | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 6 |
| Filtered, no match, Clear filters | form | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 | 2 |
| New student, paused, earlier work after access ended, loading, could not load | state | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 4 |

## ST-16 · Format feedback

**Purpose.** Rate five statements about a completed format; optional comment.  
**Main action.** Submit feedback.

**Treatment as built.** One rating sheet: the five-point scale named once above five statement rows of radio cells; on phones each statement gets five numbered segments with the end anchors and the chosen rating in words. Error summary and per-row errors; comments; Cancel and Submit feedback; not-sent notice.

**Final pass.** Reviewed again at 1440, 1024, 768, 375 and 320: no change needed.

| Subview | Kind | Status | Basis | Widths | Boards |
| --- | --- | --- | --- | --- | --- |
| Feedback: one rating sheet, the scale named once, optional comment | step | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 3 |
| Ratings missing: error summary and inline errors | form | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 1 |
| Not sent (answers kept) | state | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 | 1 |
| Not open yet (before the format is completed) | state | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 | 1 |

## ST-17 · Feedback sent (confirmation, read-only)

**Purpose.** Confirm sent feedback; read-only answers.  
**Main action.** Back to experiment / See your progress.

**Treatment as built.** One card: a thank-you band with the sent time and the rule, Back to experiment (gold) and See your progress; your answers read-only on the same five-point scale, with words; your comments.

**Final pass.** At 320 the answer words wrap under the dots instead of being clipped (1440–375 unchanged).

| Subview | Kind | Status | Basis | Widths | Boards |
| --- | --- | --- | --- | --- | --- |
| Feedback sent: thank-you band and the answers on the same scale, read-only | state | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 2 |

## ST-18 · My device (AR/VR/MR holders only)

**Purpose.** Show the authorised headset and the transfer request chain.  
**Main action.** Request a device transfer.

**Treatment as built.** One card: the authorised headset (icon, name, VR chip and experiment) with Request a device transfer below it; the request form as a section (moving from, new device with hint and error, note, rule, Cancel / Send request); your transfer request: status pill, explanation, three dated steps (Requested · Forwarded to BITS · BITS decides / Approved — vertical on phones), the no-Institute-Admin notice, From / To / Your note, earlier request. Aside: How a transfer works (numbered) and the rule that progress stays with you.

**Final pass.** The transfer request shows no Reference row: the DTR record identifier stays in the data and in the view model, but is not a label on the page.

| Subview | Kind | Status | Basis | Widths | Boards |
| --- | --- | --- | --- | --- | --- |
| My device: authorised headset and one action | page | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 1 |
| Transfer request form and its validation | form | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 2 |
| Request as three dated steps: with your Institute Admin, forwarded, approved, no Institute Admin | state | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 6 |
| Paused; not available without headset formats | state | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 2 |

## ST-19 · Experiment not available (refusal page)

**Purpose.** Explain that an experiment is not available and offer a permitted path.  
**Main action.** Back to My courses / See earlier work.

**Treatment as built.** Compact refusal card: icon, kicker, title, reason, and what you can still do from existing facts and destinations (experiments you can open, or your work as recorded), then the actions and Help & support. The same component serves access ended / withdrawn, no current course, AR / MR, feedback not open yet, My device not available, no assessment yet and withheld results. Borrowed XS-06 / XS-08 messages keep their XS form.

**Final pass.** Reviewed again at 1440, 1024, 768, 375 and 320: no change needed.

| Subview | Kind | Status | Basis | Widths | Boards |
| --- | --- | --- | --- | --- | --- |
| Not available: compact card, the reason once and what you can still do | state | REDESIGNED | every render differs from the original design | 1440 · 1024 · 768 · 375 · 320 | 4 |

