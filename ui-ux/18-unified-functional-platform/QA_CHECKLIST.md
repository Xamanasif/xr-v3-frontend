# QA Checklist — Unified Functional Platform · Implementations 01 + 02 + 03 + 04 + 05

Run from `ui-ux/18-unified-functional-platform/` (see README for local run).
Every step below was executed against the final build in a Chromium-based browser
(runtime-verified; see the implementation report). Re-run on Safari for the review pass.

Sections **A**, **B** and **Cross-cutting** are the Implementation-01 suite; **C**–**H** are
Implementation 02; **J**–**P** are Implementation 03; **Q**–**X** are Implementation 04. All four
were re-run against the Implementation-05 build. Sections **Y1**–**Y11** are new.

> **Implementation 05 runs first in the chain but is verified last**, because the proof it exists
> to give is that a *newly produced* Experiment travels the whole platform on the code the seeded
> catalogue already used. Section **Y8** is that end-to-end test, and **Y6** is its most important
> negative: publishing grants nobody anything.

## Scenario A — internal / BITS Community (no payment step)

| # | Step | Expected | Result |
|---|---|---|---|
| A1 | Prototype controls → **Reset prototype data** → confirm | Seed state: scenario A, 1 seeded tenant, **no requests and no access records**; seeded tenant people/groups/mappings present; lands on `#/` | ✅ |
| A2 | Browse without any login: `#/` → **Browse catalogue** | Catalogue renders publicly | ✅ |
| A3 | Open **Civil Engineering** (Programme/Department bundle) | Its 3 Course sub-bundles | ✅ |
| A4 | Open **Soil Mechanics** | Its 2 Experiments | ✅ |
| A5 | Open **Direct Shear Test** | Detail: description, Learning Outcomes, technologies + device requirements, preview placeholder, access panel | ✅ |
| A6 | Tick **VR** (and optionally **AR**) in *Select technologies* | Explicit selection; *Add to selection* with none ticked shows an inline error and adds nothing | ✅ |
| A7 | **Add to selection** | Toast; panel flips to *In your selection*; header count updates | ✅ |
| A8 | **Selection → Prepare institutional request** → quantity `120`, term `Quarterly` → **Submit** | `REQ-001` created once; selection + draft cleared; status page confirms with identifier | ✅ |
| A9 | Prototype controls → **Super Admin** | Request queue, `REQ-001` submitted | ✅ |
| A10 | Open `REQ-001` | Full inspection: institution, BITS Community context, contact, users, term, items + technology variants, history | ✅ |
| A11 | **Approve request** → confirm dialog | Consequence text names the internal branch; on confirm status → **Active** | ✅ |
| A12 | Verify **no payment screen occurs** | Route never contains a payment step; `#/payment/REQ-001` redirects to status | ✅ |
| A13 | Prototype controls → **Tenant Admin** | Resolves to *Sample Engineering Institute* workspace | ✅ |
| A14 | Verify approved content appears | `ACC-001` from `REQ-001` listed under Content access | ✅ |
| A15 | Verify technologies / quantity / term | Exactly the selected variants per experiment; Quarterly with end date; granted by Super Admin | ✅ |
| A16 | Verify **activation entitled nobody** | Allocation reads `Approved n · Assigned 0 · Remaining n`; every seeded student still shows 0 entitlements | ✅ |

## Scenario B — external institution (payment-gated)

| # | Step | Expected | Result |
|---|---|---|---|
| B1 | Reset prototype data; set Requester scenario **B — External** | Scenario switches (toast) | ✅ |
| B2 | Browse the catalogue publicly | Works as in A | ✅ |
| B3 | Select one or more Experiments (e.g. Total Station, Beam Deflection) | Added with per-experiment technologies | ✅ |
| B4 | Choose technology variants per Experiment | Any combination; ≥1 enforced | ✅ |
| B5 | Submit request (e.g. 40 users, Yearly) | `REQ-00n` with context **Subscription**, payment required | ✅ |
| B6 | Super Admin approves | Dialog names the external consequence | ✅ |
| B7 | Verify status = **Approved — payment required** | Queue + detail + applicant status all show it | ✅ |
| B8 | Verify tenant access is **NOT** active yet | No tenant record exists for the institution; Tenant Admin view shows *no active tenant workspace*; no access record | ✅ |
| B9 | Applicant status → **Continue to payment** → *Simulate payment completed* (PROTOTYPE ONLY) | Provider-neutral screen states no configured commercial amount | ✅ |
| B10 | Verify request becomes **Active** | Status + history updated | ✅ |
| B11 | Verify tenant content access appears | External tenant created from the request; access record with items, technologies, 40 users, Yearly + end date | ✅ |
| B12 | Open the new external tenant's whole workspace | Overview, People, Groups, Academic mappings, Assignments, Faculty mapping all render honest empty states; **0 people, 0 entitled students** — activation auto-entitles nobody | ✅ |

## Cross-cutting checks

| Check | Expected | Result |
|---|---|---|
| Search | `shear` → 1 match; grouping cards hide while filtering; caret/focus preserved while typing | ✅ |
| Filters | Technology toggles (`aria-pressed`) and programme select combine; count + live announcement update | ✅ |
| Empty search | *No experiments match* + clear action | ✅ |
| Edit selection | Technology checkboxes update the stored item | ✅ |
| Remove item | Removes with toast; summary updates | ✅ |
| Last-technology guard | Unchecking the only technology is reverted with an explanatory error | ✅ |
| Quantity validation | empty / `0` / negative / decimal rejected inline; no max cap | ✅ |
| Term + identity validation | Missing term, name, contact, invalid email → inline errors + focused summary (`aria-invalid`, `aria-describedby`) | ✅ |
| Double-submit | Submit disables on first click; one record per submission; refresh cannot duplicate | ✅ |
| Refresh persistence | Selection, draft fields, requests, tenants, access survive reload (`localStorage` `xrslp-unified-v1`) | ✅ |
| Reset | Restores deterministic seed data | ✅ |
| Deep-route refresh | Direct load of e.g. `#/tenant/…/content-access`, `#/platform/requests/REQ-002` renders correctly | ✅ |
| Invalid route | `#/nonexistent/route` → not-found state with recovery links | ✅ |
| Responsive widths | 375 px, 768 px, desktop: zero horizontal page overflow on all routes; tables collapse to labelled cards ≤740 px; sidebar becomes a horizontal strip ≤900 px; detail rails stack with the decision panel first | ✅ |
| Keyboard | Skip link is the first tab stop and focuses main; all controls are native buttons/links/inputs; dialog traps Tab/Shift+Tab, closes on Escape, restores focus to the opener | ✅ |
| Console | No errors or warnings across both scenarios | ✅ |
| Empty states | Empty catalogue search · empty selection · no requests (applicant + Super Admin) · tenant with no active content · no tenant workspace yet | ✅ |

## Invariants spot-checked

- **CART/SELECTION ≠ ENTITLEMENT** — nothing before approval (and payment, where applicable) creates a tenant or access record.
- **No payment screen on the internal route** — the step does not exist there, hidden or otherwise.
- **Access is never granted before approval**; for external, never before payment completion.
- **No universal seat cap**; quantity comes only from the request.
- **No prices anywhere**; the payment step states the amount is not configured.
- Terminology: *Experiment* (never *Module*), *Web* (never *WebGL* in copy), one *Student/Learner* role, one *Institute Admin / Tenant Admin* role, *Semester* absent (not required anywhere).

---

# IMPLEMENTATION 02

## C — Manual provisioning → group → assignment → entitlement

Prerequisite: an **ACTIVE** access record (Scenario A above, `4` users, Quarterly).

| # | Step | Expected | Result |
|---|---|---|---|
| C1 | Tenant Admin → **People** | 2 seeded Faculty + 6 seeded Students; All / Faculty / Students tabs with live counts | ✅ |
| C2 | **Add Faculty** → submit empty | Both required fields flagged inline + focused summary; nothing created | ✅ |
| C3 | Add Faculty with an existing email | *"A person with this email already exists…"*; nothing created | ✅ |
| C4 | Add Faculty with a fresh email + optional staff ID | Record created, routed to Faculty detail | ✅ |
| C5 | **Add Student** → submit empty | Exactly **6** errors — Student ID, Name, Email, Programme, Course, Course ID/Code. **Semester, Organisation and Plan terms are NOT flagged** | ✅ |
| C6 | Choose a Programme | Course select populates from that Programme only; already-typed identity fields survive the re-render | ✅ |
| C7 | Submit with **Semester, Organisation and Plan terms all blank** | Student created; the three fields store blank and render *Not specified*; `source = manual` | ✅ |
| C8 | Verify the new Student's entitlements | **0** — creating a student grants nothing | ✅ |
| C9 | **Academic mappings** → set a local Course Code, **leave Semester blank** → Save | Saves without error; canonical Course name unchanged and not editable | ✅ |
| C10 | **Groups → Create group** → add 3 Students | Group created; membership recorded | ✅ |
| C11 | Verify entitlements of the 3 members | **0, 0, 0** — group membership grants nothing | ✅ |
| C12 | **Faculty mapping** → map the new Faculty to a Course + Experiment | Course options restricted to courses inside the access record; Experiment options restricted to that course's approved experiments | ✅ |
| C13 | Verify the allocation after Faculty mapping | Unchanged — `Assigned 0 · Remaining 4`. Faculty mapping consumes no student licence | ✅ |
| C14 | **Assignments → New assignment** → access record → Experiment | Experiment list comes only from the approved record; technologies shown as **inherited**, not selectable | ✅ |
| C15 | Target = the group → verify the consequence panel | *"3 new students would consume a licence… Remaining would go from 4 to 1"* | ✅ |
| C16 | Create the assignment | Toast names the students entitled and the licences remaining | ✅ |
| C17 | Verify entitlement | All 3 members entitled to that Experiment; the non-member still 0 | ✅ |
| C18 | Verify technology inheritance | Entitlement carries exactly the record's approved variants (VR + AR) — not the Experiment's full availability | ✅ |
| C19 | Verify allocation | `Approved 4 · Assigned 3 · Remaining 1` on Content access, Assignments and Overview | ✅ |
| C20 | Open **Student detail** | Course & Experiment, technologies, source access record, assignment source (Group · name), status | ✅ |
| C21 | Refresh the page | Everything persists (`schemaVersion: 2`) | ✅ |

## D — CSV bulk Student import

Fixtures: `qa/students-invalid.csv`, `qa/students-valid.csv`.

| # | Step | Expected | Result |
|---|---|---|---|
| D1 | **People → Import Students (CSV)** | Real `<input type="file" accept=".csv">` with a label and hint; `.xlsx` explicitly not claimed | ✅ |
| D2 | **Download CSV template** | A real file is generated in the browser with the confirmed columns; sample rows demonstrate blank Semester / Organisation / Plan Terms | ✅ |
| D3 | Upload `students-invalid.csv` | Preview + per-row report; **commit blocked**, button disabled with an explanation | ✅ |
| D4 | Missing required field (row 3) | *Student Name is required and this row leaves it blank.* | ✅ |
| D5 | Invalid email (row 4) | *"not-an-email" is not a valid email address.* | ✅ |
| D6 | Duplicate Student ID inside the file (row 5) | *…already used on row 2 of this file.* | ✅ |
| D7 | Student ID already in the tenant (row 7) | *…already exists in this institution.* | ✅ |
| D8 | Email already in the tenant (row 8) | *…already belongs to a person in this institution.* | ✅ |
| D9 | Unresolvable Programme (row 9) | *…does not match any Programme / Department in the platform catalogue.* — never guessed | ✅ |
| D10 | Unresolvable Course (row 10) | *"Rocket Science" is not a Course in Civil Engineering.* — never guessed | ✅ |
| D11 | **Blank Semester / Organisation / Plan Terms** (rows 6, 11) | Row result is **Valid** — blanks are not errors | ✅ |
| D12 | Counts | `3 valid rows · 7 invalid rows`; nothing imported | ✅ |
| D13 | Quoted values | A name containing a comma, and a value containing escaped double quotes, both parse correctly | ✅ |
| D14 | Local-code conflict with an existing tenant mapping | **Attention** row, not an error: the existing mapping is kept and the row's code is stored on the student only | ✅ |
| D15 | Upload the corrected `students-valid.csv` | *File is valid — 5 rows ready to import*; blanks explicitly stated to be valid | ✅ |
| D16 | **Import Students** — clicked three times rapidly | Exactly 5 students created; no double import | ✅ |
| D17 | Outcome screen | Names what was created, states plainly that **no student received any content** | ✅ |
| D18 | People + refresh | Imported students appear with `source = CSV import`; blank Semester renders *Not specified*; survives reload | ✅ |
| D19 | Re-upload the same valid file | Now blocked — every row collides with an existing Student ID and email | ✅ |
| D20 | Empty file / header-only file / missing required column | Each produces a clear fatal message, never a silent pass | ✅ |

## E — Licence limit

Access record with **4** approved users.

| # | Step | Expected | Result |
|---|---|---|---|
| E1 | 3 students assigned via a group | `Assigned 3 · Remaining 1` | ✅ |
| E2 | Assign a 4th student | Succeeds; `Assigned 4 · Remaining 0` | ✅ |
| E3 | Assign a 5th **new** student | **BLOCKED** — *"would add 1 new student but only 0 licences remain… Nothing is assigned"*; submit disabled; clicking it creates nothing | ✅ |
| E4 | Assign an **already-counted** student a **different** Experiment on the same record | **Allowed** at `Remaining 0`; the student still counts once — `Assigned 4` unchanged | ✅ |
| E5 | Assign a group whose 2 new students exceed the remaining 0 | **Entire assignment blocked**; no partial application; both members remain unentitled | ✅ |
| E6 | Verify the numbers everywhere | Content access, Assignments and Overview all agree | ✅ |

## F — Multiple assignment sources

| # | Step | Expected | Result |
|---|---|---|---|
| F1 | Student A is entitled to Experiment X through Group A | 1 effective entitlement, source `Group · A` | ✅ |
| F2 | Directly assign Experiment X to Student A | Picker and consequence panel both say *already entitled via Group A — gains another source, not another entitlement*; **0 new licences** | ✅ |
| F3 | Verify the entitlement | **One** effective entitlement with **two** sources | ✅ |
| F4 | Remove the direct assignment | Dialog states how many students keep the experiment through another source; A **remains entitled** through Group A | ✅ |
| F5 | Remove the group assignment | Effective entitlement disappears; licences released | ✅ |
| F6 | Verify traceability | Both assignment records retained with status `Removed` and a date; visible via *Show removed assignments* | ✅ |

## G — Student deactivation / reactivation

| # | Step | Expected | Result |
|---|---|---|---|
| G1 | Deactivate a Student with 2 active entitlements | Confirm dialog states the consequence; status → **Inactive** | ✅ |
| G2 | Verify entitlement | Both listed but **not effective**, reason *Student is inactive*; nothing deleted | ✅ |
| G3 | Verify allocation | The licence is released back — `Assigned` drops by 1 | ✅ |
| G4 | Try to assign an inactive Student | Refused — an inactive student cannot receive a new assignment; they are not listed in the picker | ✅ |
| G5 | Reactivate while a licence is free | Status → Active; both entitlements effective again | ✅ |
| G6 | Reactivate when the allocation is **full** | Student is reactivated; entitlement shows **Held — allocation full**; the students who took the licences keep them; the entitled count never exceeds the approved quantity | ✅ |
| G7 | Free a licence | The held entitlement becomes effective again | ✅ |

## H — Implementation-02 cross-cutting

| Check | Expected | Result |
|---|---|---|
| State migration from Implementation 01 | A stored `version: 1` state upgrades in place: requests, tenants, access records, selection and draft all survive; new collections start empty; `schemaVersion` becomes 2 | ✅ |
| Reset | Restores the Implementation-02 seed — and still **no** access record and **no** assignment | ✅ |
| Expired access record | Entitlement derived from it is not effective; the record and its assignments are retained; renewal is never automatic | ✅ |
| No dead controls | Every enabled button and link on all 15 tenant routes is bound; no `href="#"`; the only disabled controls are dependent form fields with explanatory text | ✅ |
| Responsive | 375 px, 768 px and desktop: **zero** horizontal page overflow across 24 routes; tables collapse to labelled cards; mapping inputs go full width | ✅ |
| Accessibility sweep (15 tenant routes) | Every form control has an accessible name; every table has a caption and `data-label` cells; one `h1` per page and no skipped heading levels; `main` + labelled `nav` landmarks; exactly one `aria-current="page"` in the side nav | ✅ |
| Dialogs | `role="dialog"` + `aria-modal` + `aria-labelledby`; focus moves inside on open, Tab is trapped, Escape closes, focus returns to the opener | ✅ |
| Announcements | Import outcome, assignment outcome and filter changes are announced via the polite live region | ✅ |
| Status never colour-only | Active / Inactive / Entitled / Held / Removed / Expired all carry text | ✅ |
| Console | No errors or warnings across the whole session | ✅ |
| Empty states | No Faculty · no Students · no Groups · no mappings · no assignments · no entitlements · no active access · no remaining allocation · CSV invalid · CSV valid · CSV imported · duplicate student · inactive student · assignment exceeds capacity | ✅ |

## Invariants spot-checked — Implementation 02

- **TENANT ACCESS ≠ STUDENT ENTITLEMENT** — activating an access record entitles nobody; the allocation reads `Assigned 0`.
- **GROUP MEMBERSHIP ≠ CONTENT ACCESS** — joining a group changes no entitlement until an assignment targets that group.
- **Nothing outside the approved set** — the Experiment picker, the Faculty-mapping course list and the state layer all derive from the access record.
- **Technologies are inherited, never chosen** — no control exists to widen or narrow the approved variants.
- **One effective entitlement per Student × Experiment × access record**, however many assignment sources support it.
- **The approved quantity is never exceeded** — including on reactivation, where the returning student is *Held* rather than silently entitled.
- **Faculty mapping consumes no student licence.**
- **Nothing is destroyed** — deactivation and unassignment are reversible states; assignment records are retained.
- **Semester and Plan Terms are never mandatory** — not in the manual form, not in the CSV, not in the academic mapping.
- Terminology: *Students* throughout the tenant workspace; no separate *Learners* section.

---

# IMPLEMENTATION 03

Prerequisite for J–N: Scenario A approved with **Direct Shear Test → VR + AR** and
**Consolidation Test → VR + Web**, `4` users, Yearly; Direct Shear assigned directly to
*Rahul Verma*, Consolidation assigned to *Geotechnics Lab Batch A*.

## J — Entitlement → My Learning

| # | Step | Expected | Result |
|---|---|---|---|
| J1 | Prototype controls → **Student** | The prototype-only chooser lists the **real** student records, each with its effective-entitlement count, under a *PROTOTYPE ONLY* note that says sign-in is not built | ✅ |
| J2 | Choose *Rahul Verma* | Routes to his Home; the protobar gains a **Viewing as student** selector (present in the Student area only) | ✅ |
| J3 | **Home** | Name, institution, Programme, Course + local code, Semester, Student ID — all from real records. Counts derive from state. No rankings, points, leaderboards, attendance or grades | ✅ |
| J4 | **My Learning** | Exactly the 2 assigned Experiments under *Available to you*. No other catalogue content appears | ✅ |
| J5 | Verify technologies on Direct Shear | **VR and AR only** — the catalogue also publishes it in Web, and Web is absent | ✅ |
| J6 | Verify technologies on Consolidation | **Web and VR** — exactly what the access record granted | ✅ |
| J7 | Open the Experiment page | Course context, description, Learning Outcomes, the four-step sequence, resources, one simulation card per entitled technology, assessment entry, progress rail | ✅ |
| J8 | Look for administrative language | No `ACC-nnn`, no licence quantity, no *Super Admin*, no direct-vs-group assignment source anywhere in the Student workspace | ✅ |

## K — No entitlement

| # | Step | Expected | Result |
|---|---|---|---|
| K1 | View as *Meera Sundaram* — enrolled on **Surveying** and a member of **Survey Field Batch A**, with no assignment | My Learning shows *"No experiments have been assigned to you yet"* and states that being enrolled on a course is not the same thing | ✅ |
| K2 | Launch controls | **None** — the empty state carries no experiment card and no launch action | ✅ |
| K3 | Home and Progress | Both render their own honest empty states; counts read 0 | ✅ |
| K4 | Invariant | **COURSE MEMBERSHIP ≠ ENTITLEMENT** and **GROUP MEMBERSHIP ≠ ENTITLEMENT**, proven on one record | ✅ |

## L — Technology restriction

| # | Step | Expected | Result |
|---|---|---|---|
| L1 | Direct Shear (entitled VR + AR) Experiment page | Two simulation cards, two assessment rows, two technology chips. **No Web anywhere** | ✅ |
| L2 | Hand-edit the address to `…/experiment/direct-shear/simulation/web` | Explicit refusal: *"Direct Shear Test is not available to you in Web"*, with what **can** be opened. **No authorised launch state** | ✅ |
| L3 | The assessment route carries **no** technology segment (`…/assessment`) | There is nothing to restrict: one assessment per Experiment, gated on the Experiment's effective entitlement. The technology restriction lives on the simulation route, which is the technology-specific thing | ✅ |
| L4 | State layer directly (`studentCanRun`, `startSimulation`, `startAttempt`, `openResource` for Web) | All refuse — the gate is in the state writers, not only the UI | ✅ |
| L5 | Address an Experiment that was never assigned (`total-station`) | *"Not assigned to you"*, explaining that course/group membership is not assignment | ✅ |

## M — Resources → simulation → assessment → progress

| # | Step | Expected | Result |
|---|---|---|---|
| M1 | Open a learning resource | Expands to real local content; state moves to **Opened**. No external URL and no download anywhere | ✅ |
| M2 | **Mark as done** | State → **Done**; the sequence strip and the resource count update; un-checking returns it to *Opened*, never to *Not opened* | ✅ |
| M3 | Open the VR simulation with resources still unfinished | Allowed — resources are a recommended sequence, not a gate | ✅ |
| M4 | VR (package technology) | *Request access on my device* → **Availability pending** → *Simulate the package becoming ready* (labelled prototype) → **Ready on device** → open → **Completion recorded** | ✅ |
| M5 | Web (hosted technology) on Consolidation | No device-authorisation step — available to open immediately, per the hosted-link model | ✅ |
| M6 | The runtime panel | Clearly labelled *PROTOTYPE ONLY*; states that nothing is downloaded or installed and that the mechanism is not selected | ✅ |
| M7 | Time spent | Derived from the real interval between opening and completing — not a seeded figure | ✅ |
| M8 | Assessment introduction | Discloses question count and types, pass mark, attempts used, and **the answer-visibility policy** | ✅ |
| M9 | Attempt | MCQ radio groups and True/False in `fieldset`/`legend`; live *Answered n of 5*; review panel lists each question's answered state and links to it | ✅ |
| M10 | Refresh mid-attempt | Attempt, question answers and the answered count all survive | ✅ |
| M11 | Submit | Confirmation dialog names the technology and warns about unanswered questions; submitting routes to the result | ✅ |
| M12 | Double submission | Submit disabled on confirm; re-calling `submitAttempt` returns `null`; refresh produces no second result | ✅ |
| M13 | Result under **Show immediately** | Score, per-question correct/incorrect and the explanations | ✅ |
| M14 | Progress | Updates from the real actions — resource count, per-technology rows, steps and percentage | ✅ |

## N — Per-technology progress

| # | Step | Expected | Result |
|---|---|---|---|
| N1 | Complete VR (simulation + assessment passed), leave AR untouched; all resources done | Progress shows **VR — Completed** and **AR — Not started / In progress** as separate rows. They are never collapsed | ✅ |
| N2 | Experiment roll-up | **In progress**, *not* Completed — one finished technology does not complete an Experiment assigned in two | ✅ |
| N3 | Roll-up sentence | States which technologies it covers: *"VR completed · AR not started."* | ✅ |
| N4 | An Experiment assigned in one technology | Renders without the extra dimension — no noise where it carries no information | ✅ |
| N5 | Complete an Experiment with **no** assessment (Beam Deflection, VR) | Completes on resources + simulation alone; 100% | ✅ |
| N6 | Resources unfinished but simulation + assessment done | Technology stays **In progress**, and the page says *"Mark the remaining learning resources as done to complete this experiment"* | ✅ |

## O — Assessment policy, written answers, attempts

| # | Step | Expected | Result |
|---|---|---|---|
| O1 | Consolidation assessment (**Show after the assessment deadline**, seed + 14 days) | Result shows the score but **withholds answers and explanations**, naming the release date | ✅ |
| O2 | Written answer | Marked questions scored immediately; the attempt outcome is **Pending Faculty review** | ✅ |
| O3 | Learner-facing wording | Says the answer *needs to be evaluated* — **no evaluator is named**, and no turnaround or SLA is promised | ✅ |
| O4 | Experiment status while pending | **Pending Faculty review**, never Completed; the percentage does not count the pending step | ✅ |
| O5 | Start another attempt while pending | Refused, with the reason | ✅ |
| O6 | Fail an objective assessment with attempts remaining | **Try again** offered; the previous result is kept | ✅ |
| O7 | Exhaust the configured attempts | No retry control; the result states all attempts are used | ✅ |
| O8 | `D-25` | No correct answer or explanation appears anywhere on the attempt screen, under any policy | ✅ |
| O9 | Third policy (**Show on a set date**) | Present and distinct in the seeded data, so no single value reads as a platform rule | ✅ |

## P — Deactivation · revocation · expiry

| # | Step | Expected | Result |
|---|---|---|---|
| P1 | Tenant Admin → deactivate *Rahul Verma* → switch to the Student view | Clear account state: *"Your account is not active at the moment"*, explaining nothing has been removed and that the institution administers it | ✅ |
| P2 | Launch attempts while inactive | Refused at the state layer too — `studentCanRun`, `startSimulation`, `startAttempt` and `openResource` all return nothing; no launch control renders | ✅ |
| P3 | History while inactive | Completed simulation, submitted attempt and resource progress all intact | ✅ |
| P4 | Reactivate with capacity | Entitlements effective again; prior progress unchanged (**VR Completed**, **AR In progress**) | ✅ |
| P5 | Remove the **last** assignment source for Direct Shear | It leaves *Available to you* and appears under **Earlier work**, stating it can no longer be opened and that the record is kept | ✅ |
| P6 | Earlier work | Shows the technologies actually worked on and their states; carries **no launch control**; Progress lists it separately from current experiments | ✅ |
| P7 | Address the revoked Experiment directly | *"No longer available to you"* with a link to Progress; nothing opens | ✅ |
| P8 | Mark the access record expired (QA-only console edit of `endsOn`; no production assumption changed) | Every entitlement from it becomes *Not available at the moment* — *"Your institution's access to this experiment has reached its end date"*; launch blocked at the state layer; history intact; **no renewal action is offered to the Student** | ✅ |

## Implementation-03 cross-cutting

| Check | Expected | Result |
|---|---|---|
| Implementation 01 + 02 regression | 28 scripted assertions over Scenario A, Scenario B, provisioning, groups, assignment, allocation and entitlement — **all pass** on the Implementation-03 build | ✅ |
| State migration | `schemaVersion` 1 → 3 and 2 → 3 upgrade in place; requests, tenants, access, people, groups, memberships, mappings and assignments all survive; the three learning collections start empty; a stale prototype-student pointer is cleared rather than resolving to nothing | ✅ |
| Namespace | Still `xrslp-unified-v1` — no second key was created | ✅ |
| One entitlement engine | The Student workspace reads `getEffectiveStudentEntitlements()` / `studentExperiments()`; no second entitlement store exists and no seeded student access exists | ✅ |
| No dead controls | Across all Student routes there is exactly one non-navigational button per state, every one bound; every link is an internal hash route; no `href="#"`, no external URL, no fake download, certificate, message or support control | ✅ |
| Route sweep | **45 routes** across public, Super Admin, Tenant Admin and Student render correctly, including the refusal and not-found states | ✅ |
| Responsive | 375 px, 768 px and 1280 px: **zero** horizontal page overflow on all 45 routes plus the live attempt screen | ✅ |
| Accessibility sweep (all 45 routes) | One `h1` per page, no skipped heading levels, single `main` landmark, labelled `nav`, skip link present, every form control has an accessible name, every radio inside a `fieldset` with a `legend`, no nameless link or button | ✅ |
| Dialog | `role="dialog"` + `aria-modal="true"` + `aria-labelledby`; focus moves inside on open, Escape closes, focus is restored | ✅ |
| Status never colour-only | Not started / In progress / Pending Faculty review / Completed / Passed / Not passed / Ready on device / Availability pending all carry an icon and a word | ✅ |
| Progress representation | The bar is `role="img"` with an accessible name; the figures it represents are always present as text beside it | ✅ |
| Console | No errors or warnings across the whole 45-route sweep | ✅ |
| Student empty states | No entitlements · no activity yet · nothing completed · assessment pending · no progress yet · inactive student · access expired · assignment revoked · experiment with no resources · experiment with no assessment · technology not granted · experiment not assigned | ✅ |

## Defects found by the Implementation-03 review pass, and fixed

A multi-agent adversarial review of the finished slice raised 39 candidate defects; 26 survived
verification. All the behavioural ones were fixed and re-tested. The ones worth recording:

| # | Defect | Effect | Fix | Re-tested |
|---|---|---|---|---|
| 1 | `accessTermState` compared `Math.ceil(msRemaining / 86400000) < 0`. For a record that expired less than a day ago that expression is `-0 < 0`, which is **false** in JavaScript | An expired access record read as **Active** for up to 24 hours, and entitlement derived from it stayed effective and launchable. **Pre-existing from Implementation 01/02** | Compare the instant (`endsOn <= now`) instead of a rounded day count | ✅ a record expired one hour ago now reads Expired, blocks launch, and its entitlement is not effective |
| 2 | The Progress screen rendered only `effective` entitlements and `past` experiments. A blocked entitlement (inactive student, expired access, allocation hold) is in **neither** bucket | A deactivated student's Progress screen went **completely blank** — including a 100%-complete experiment — while the refusal screen promised *"everything you have already done is kept"* and linked to it | A third **Not available at the moment** section, carrying the reason and the full record | ✅ a deactivated student's Progress still shows the experiment, the per-technology rows and the completed work |
| 3 | Historical work was rolled up like current work. Once the assignment was gone, the technology set it covered was gone with it, so the roll-up ran over only the technologies the student had touched | A student who finished VR of an assigned **VR + AR** flipped to **Completed · 100%** the moment the assignment was revoked | `experimentProgress(..., { historical: true })` reports the per-technology record with **no completion verdict and no percentage** | ✅ Earlier work now shows *No longer assigned*, states why there is no verdict, and still shows VR completed / AR in progress |
| 4 | The result screen resolved its attempt with `latestSubmittedAttempt` only | After **Try again**, the previous result — with the correct answers and explanations — stayed one click away from the questions being answered. A **`D-25` violation** | An open attempt now always wins the route: `/result` redirects to `/attempt` | ✅ navigating to the result during a retry lands on the attempt, and no answer key is rendered |
| 5 | The review panel's per-question links were bare `#qn-…` fragments | Clicking one drove the **hash router**, which resolved it to *Page not found* and destroyed the attempt mid-assessment | `preventDefault` + scroll + focus, matching the skip-link pattern already in the build | ✅ jumps to the question and focuses its first control; the attempt survives |
| 6 | The experiment page's assessment row branched on the last **submitted** attempt before the **open** one | With a retry in progress the badge said *In progress* while the only control opened the old result — and at the attempt limit the open attempt was unreachable | An open attempt outranks a previous result | ✅ the row now reads *Continue the assessment* and links to the attempt |
| 7 | `experimentProgress` returned `NOT_STARTED` whenever the technology list was empty | An experiment with every resource done reported *Not started* beside *100%* | With no technologies the status derives from the resources | ✅ reports Completed at 100% |
| 8 | `startAttempt` returned an in-progress attempt **before** `attemptBlock` ran, so the `not-entitled` gate was dead code on the resume path | Latent: an attempt open when entitlement was withdrawn mid-attempt could still be resumed and written to. Not reachable through the UI, but it contradicted the stated invariant | Only the `studentCanRun` clause is hoisted above the resume shortcut — the rest of the ordering is deliberate, because an open attempt counts toward the limit. `saveAnswer` and `submitAttempt` gained the same gate | ✅ resume, save and submit all refuse once entitlement is gone, and all resume normally on reactivation |
| 9 | A technology worked on and then removed from the entitlement vanished from Progress | Real work disappeared with no trace | Retired technologies are reported **beside** the entitled rows, marked *Past activity*, and excluded from the roll-up so they neither vanish nor hold completion back | ✅ |
| 10 | `blockedBy` ranked `access-expired` above `allocation-held` | A student held on a **live** record was told their institution's access *"has ended"* because a different record had expired | Priority reordered to `student-inactive · allocation-held · access-expired` | ✅ |
| 11 | Copy and control defects: the pending headline claimed answers were *"shown below"* under a policy that withheld them; the attempt-limit explanation was unreachable; a written answer advertised marks it never contributes; *Open it again* changed nothing visible; the launch instructions were present tense for steps that do not exist; the protobar *Viewing as student* control could disagree with the page | Misleading copy and one control that read as dead | Each reworded or removed; the protobar now follows the student actually rendered | ✅ |

Also raised and **deliberately not changed**, with reasons:

- **`load()` falls back to the seed for an unparseable or newer-schema store, and the next save overwrites it.** Pre-existing Implementation-01 behaviour, documented in the code. It only triggers when moving *backwards* between builds; changing it late in this slice risks a migration regression for no prototype benefit. Recorded as a limitation.
- **Catalogue descriptions say *"The learner prepares a soil specimen…"*.** Third person is the right register for a public catalogue entry, and the string is shared with the public Implementation-01 screens.
- **The prototype student chooser uses derivation vocabulary.** It is a `PROTOTYPE ONLY` screen that exists to explain exactly that; it is not product UX.

## Source-safety review — assessment granularity and descriptive-response status

### 1 · Descriptive responses now say **Pending Faculty review**

`STK31-31` settles the owner — *"FACULTY is the ONLY human role responsible for
descriptive-answer evaluation"* — so the earlier deliberately evaluator-neutral wording
(*"awaiting evaluation"*, *"needs to be evaluated"*) was corrected everywhere the state
represents a written answer awaiting human review. The status badge, the roll-up label, the
result headline, the submit dialog, the assessment disclosure, the per-question row, the
attempt-blocked note and the Progress tile all now name Faculty review. **No Faculty review
workspace, grading, auto-review or turnaround is implemented** — those belong to the Faculty
slice.

### 2 · Assessment granularity — source check

| Question | Finding |
|---|---|
| Does any authoritative source state that an assessment is **configured or attempted per technology variant**? | **No.** |
| What does the corpus say instead? | `17-…/05_CONTENT_HIERARCHY_METADATA_AND_BUNDLES.md` §5 records the exact question as open: *"\| Assessment \| Attached to the Experiment \| ⚪ Attached to the Experiment or to a variant — **not asked, not assumed.** Folded into `ND-08` \|"* — and `15-post-pm-alignment/09_BATCH_01_05_IMPACT_MATRIX.md` row 6 asks *"Assessment as a per-technology thing?"* and answers *"⚪ UNKNOWN … **Not asked yet**"* |
| Positive evidence for Experiment-level | `17-…/13_BATCH_01_05_EXACT_CORRECTION_MAP.md` Part B `B02-assign`: *"**Faculty assigns assessments to Experiments**"*. `B08` Assessment Introduction and `B09` Assessment Attempt are both **KEEP**; only `B12` Progress and `S13` XR Device Access gain the technology axis |
| Screen inventory | `14_UNIFIED_SCREEN_REQUIREMENTS.md` area G: `U-LRN-05/06/07` **KEEP**; `U-LRN-08` Result **MODIFY** *"+ Faculty-owned evaluation, + visibility policy"* — no technology dimension; only `U-LRN-09` Progress gains *"+ technology axis"* |
| Data model | `17_CONCEPTUAL_DATA_AND_STATE_MODEL.md` record 24 Assessment *"Gains the answer/explanation visibility policy"* and nothing else; record 26 names **Progress** — not Attempt, not Result — as gaining the per-technology axis |
| FRD extension register | `STAKEHOLDER_CONFIRMED_UPDATE_2026-08-31.md` row **S-20**: *"Progress gains a technology dimension."* No row records an assessment, attempt or result gaining one |
| The only counter-evidence | `09_STUDENT_LEARNING_PROGRESS_MODEL.md` §3 rule 4 — *"simulation and assessment **state** are technology-level unless a source says otherwise"* — which speaks of assessment **state** on a progress surface, carries its own hedge, and sits under a heading whose governing decision is about progress; plus that section's ASCII worked example, which is layout only |

**Verdict: NO EXPLICIT SUPPORT for per-technology assessment → refactored to per Experiment.**

### 3 · What changed

| # | Step | Expected | Result |
|---|---|---|---|
| S1 | `startAttempt` / `attemptsFor` / `currentAttempt` / `latestSubmittedAttempt` / `attemptBlock` / `assessmentState` | All keyed by **Student + Experiment**; no technology parameter | ✅ |
| S2 | The attempt record | `technology` replaced by **`sourceTechnology`** — an observation of which simulation route led in, never an identity | ✅ |
| S3 | Routes | `…/assessment` · `…/assessment/attempt` · `…/assessment/result` — no technology segment | ✅ |
| S4 | Experiment page | **One** assessment entry, not one per technology; footnote states you are not asked to sit it again per technology | ✅ |
| S5 | Progress table | Columns are Technology · Simulation · Time spent · This technology. The **assessment is an Experiment-level line** above the table | ✅ |
| S6 | Step arithmetic | 5 resources + 2 simulations + **1** assessment = 8 steps (previously 9 — the assessment was double-counted per technology) | ✅ |
| S7 | A Student entitled to VR + AR who passes the assessment | Is **not** asked to take it again for the second technology (`attemptBlock` → `already-passed`) | ✅ |
| S8 | Simulation | Still fully technology-specific — request, availability, launch, completion, time spent, and the technology refusal | ✅ |
| S9 | A technology whose simulation is untouched while a written answer is pending | Reads **In progress**, not *Pending Faculty review* — a shared pending result must not hide outstanding work | ✅ |
| S10 | Everything else done + written answer pending | Experiment reads **Pending Faculty review**, never Completed; percentage stays below 100 | ✅ |
| S11 | Visibility policies | `SHOW_IMMEDIATELY` releases; `AFTER_DEADLINE` withholds with its date; `CUSTOM_DATE` seeded — all unchanged | ✅ |
| S12 | Attempt persistence, retry safety, `D-25` | Answers persist per change; submit idempotent; a result is unreachable while an attempt is open | ✅ |
| S13 | Migration 3 → 4 | 18 assertions: every request, tenant, access, person, group, mapping, assignment, resource, simulation and attempt preserved; `technology` moved to `sourceTechnology`; stored `PENDING_EVALUATION` renamed; entitlement still derives | ✅ |
| S14 | Implementation 01 + 02 | 39 scripted assertions — all pass | ✅ |
| S15 | Route sweep | 46 routes at 375 / 768 / 1280 — no console errors, no accessibility findings, no horizontal overflow | ✅ |

### 4 · Completion rule classification

The Experiment roll-up is now labelled in the product and in this document as a
**PROTOTYPE-DERIVED COMPLETION RULE**, explicitly *not* stakeholder-confirmed policy. It affects
only the Student-progress roll-up — verified that no entitlement, allocation, licence or
access-validity function reads any progress record.

## Student assessment UI polish and technology-progress semantics

Two issues found in a real Safari visual review, both corrected. **No business rule, entitlement,
granularity or arithmetic changed** — `js/state.js` was not touched, and its 39 + 29 + 18
assertions all still pass unchanged.

### 1 · Result feedback was visually too heavy

| # | Step | Expected | Result |
|---|---|---|---|
| V1 | Result question cards | On the normal white surface. **No full red/pink or green card fill** | ✅ measured `rgb(255,255,255)` on both |
| V2 | Correctness accent | A 3px left accent only — red for incorrect, green for correct | ✅ |
| V3 | Status badge | Compact, top-right, **icon + word** (`× Incorrect` / `✓ Correct`) | ✅ |
| V4 | Incorrect hierarchy | Question → **Your answer** (red label + ×) → **Correct answer** (green label + ✓) → neutral **Why** block | ✅ |
| V5 | Correct hierarchy | Question → **Your answer** (green label + ✓) → neutral **Why** block. The correct answer is **not** repeated | ✅ one answer block only |
| V6 | Explanation | Neutral secondary block on `--n-25`, labelled *Why* — never a status area | ✅ |
| V7 | Pending Faculty review question | Neutral card, amber accent, *What happens next* block | ✅ |
| V8 | Colour-independence | Every correctness state pairs an icon with a word, on the badge and on the answer label | ✅ |

### 2 · Selected answers during an attempt

| # | Step | Expected | Result |
|---|---|---|---|
| V9 | A selected option | Clearer than an unselected one — stronger border (`--control-border`), subtle neutral tint (`--n-25`), bolder label | ✅ |
| V10 | Colour | **No success or error colour anywhere on the attempt screen.** The selected state must not imply correct or incorrect before submission | ✅ measured neutral |
| V11 | Switching answers | The marker follows the choice; exactly one option per question is marked | ✅ |
| V12 | Persisted answers | A selection restored after refresh renders marked | ✅ |
| V13 | New attempt | No option pre-selected | ✅ |
| V14 | Density | Consistent 46px option rows, consistent card padding, clearer spacing between question number / type / text / options, and between questions | ✅ |

### 3 · Technology status on Progress was semantically misleading

The reviewed state — VR simulation completed, AR not started, assessment passed, resources 0/5 —
displayed *"VR in progress · AR in progress"* and a **This technology: In progress** cell beside
**Simulation: Completed**. The cause: Experiment-level activity (resources, assessment) was
colouring per-technology labels.

| # | Step | Expected | Result |
|---|---|---|---|
| V15 | Per-technology labels | Derive from that technology's **own simulation** only | ✅ |
| V16 | Roll-up sentence | *"Simulations: VR completed · AR not started."* | ✅ |
| V17 | The old wording | *"VR in progress"* / *"AR in progress"* appears **nowhere** | ✅ |
| V18 | Technology table | Columns are **Technology · Simulation · Time spent**; the contradictory *This technology* column is gone | ✅ |
| V19 | Shared state | **Overall experiment — In progress**, **Learning resources — 0 of 5**, **Assessment — Passed · 60% · one assessment for this experiment**, all above the table | ✅ |
| V20 | VR row | **Completed**, with its date and real time spent | ✅ |
| V21 | AR row | **Not started**, time spent `—` | ✅ |
| V22 | Arithmetic | **2 of 8 steps · 25%** — unchanged | ✅ |
| V23 | Completion rule | Still labelled a **PROTOTYPE-DERIVED COMPLETION RULE**, not confirmed product policy | ✅ |
| V24 | My Learning + Experiment rail | Chip groups retitled *Your simulations* and report simulation state | ✅ |

### 4 · Cross-cutting re-test

| Check | Result |
|---|---|
| Reviewed Safari path — My Learning → Direct Shear → VR → complete → assessment → answer → submit → result → Progress, driven through the real UI | ✅ |
| Responsive 375 / 768 / 1280 on attempt, result and progress | ✅ no horizontal overflow |
| Accessibility sweep across 26 routes at all three widths | ✅ no findings |
| Console | ✅ no errors or warnings |
| State layer (`js/state.js`) | **untouched** — 39 Implementation 01+02 + 29 assessment-model + 18 migration assertions all pass |

## Assessment review-and-submit UX correction

The attempt page ended in five large repeated *"Question n — Not answered"* cards: functionally
correct, visually repetitive and weak as a navigation tool. Replaced with a compact review
navigator. **No assessment logic, scoring, granularity, result or progress logic changed** —
`js/state.js` was not touched.

| # | Step | Expected | Result |
|---|---|---|---|
| W1 | New attempt | **0 of 5 answered** · *"5 questions still need an answer."* | ✅ |
| W2 | Question chips | One compact button per question — number + mark. The five repeated status cards are gone | ✅ |
| W3 | Answer questions 1 and 2 | **2 of 5 answered** · *"3 questions still need an answer."*; chips 1–2 marked, 3–5 not | ✅ |
| W4 | Outstanding list | *"Still to answer: 3, 4, 5"*, updating live | ✅ |
| W5 | Click chip 4 | Scrolls to question 4 and moves focus to it; all answers preserved | ✅ |
| W6 | **Go to next unanswered** | Moves to question 3 — the first outstanding one | ✅ |
| W7 | Answer everything | **5 of 5 answered** · *"All questions have been answered. Review anything you want before submitting."*; outstanding row and next-unanswered hidden | ✅ |
| W8 | Submit | **Always enabled.** While incomplete the note beside it reads *"You can submit now, but unanswered questions will receive no marks."* — see section 5 below for the warning flow | ✅ |
| W9 | Singular grammar | *"1 question still needs an answer."* | ✅ |
| W10 | Refresh mid-attempt | Count, chip statuses, outstanding list, selected options and the disabled Submit all restored | ✅ |
| W11 | Submit | Confirmation dialog → result flow unchanged; scoring unchanged; double submit still refused | ✅ |
| W12 | No correctness signalling | No *Correct*/*Incorrect* wording anywhere in the review section; answered chips use the neutral action accent (`#F2F4FC` / `#C6D0F0`), never a success colour | ✅ |
| W13 | Keyboard | Chips are real `<button>`s in tab order; activation moves focus to the question **section** (announcing number, type and text) rather than to an option, so arriving at a radio group never looks like a selection | ✅ |
| W14 | Accessible names | Every chip: *"Question 4 — answered"* / *"Question 3 — not answered"*. The visual mark and the legend are `aria-hidden`, so the name is not doubled. Chip list labelled by its heading | ✅ |
| W15 | Preserved semantics | `fieldset`/`legend` per question, radio labels, visible focus ring | ✅ |
| W16 | Responsive | 375: chips wrap to 2 rows, actions full width. 768 and 1280: one row. No horizontal overflow at any width | ✅ |
| W17 | Sweep | 19 routes × 375 / 768 / 1280 — no accessibility findings, no console errors | ✅ |

> **W8 note.** An earlier pass briefly disabled Submit while questions were unanswered. That was
> an unconfirmed business-rule change — no source makes every question mandatory — and it was
> reverted. The rule below is the one in force.

## Incomplete submission — the rule in force

**An incomplete assessment can be submitted, after an explicit warning.** No stakeholder source
makes every question mandatory, so the prototype refuses to encode that. `state.submitAttempt()`
is untouched; this is entirely UI behaviour.

| # | Step | Expected | Result |
|---|---|---|---|
| X1 | **A** — 0 of 5 answered | Submit **enabled**, not styled disabled; note reads *"You can submit now, but unanswered questions will receive no marks."* | ✅ |
| X2 | A — click Submit | Dialog **"Submit assessment?"** · *"5 questions are still unanswered."* · *"Unanswered questions: 1, 2, 3, 4, 5"* · *"If you submit now, unanswered questions will receive no marks and you will not be able to change your answers afterward."* · **[Continue reviewing] [Submit anyway]** | ✅ |
| X3 | A — Continue reviewing | Returns to the attempt; nothing submitted; answers intact | ✅ |
| X4 | **B** — 2 of 5 answered | Chips 1–2 answered, 3–5 not; *"Still to answer: 3, 4, 5"*; Submit enabled | ✅ |
| X5 | B — Submit | Warning counts and names **3, 4, 5**; **Submit anyway** completes | ✅ |
| X6 | B — scoring | Unanswered questions earn nothing and still count in the total (2 of 5 · 40%). They are **never** called incorrect, and there is no negative marking | ✅ |
| X7 | **C** — 5 of 5 answered | Submit enabled; the ordinary confirmation with **no** unanswered warning; buttons **Cancel / Submit** | ✅ |
| X8 | C — scoring unchanged | 5 of 5 · 100% · Passed | ✅ |
| X9 | **D** — refresh mid-attempt | Count, chip statuses and `aria-label`s, outstanding list, selected options and the enabled Submit all restored | ✅ |
| X10 | Singular grammar | *"1 question is still unanswered."* · *"Unanswered question: 4"* · *"1 question still needs an answer."* | ✅ |
| X11 | Plural grammar | *"3 questions are still unanswered."* · *"Unanswered questions: 3, 4, 5"* | ✅ |
| X12 | **E** — double submit | Still refused (`submitAttempt` returns `null` on a submitted attempt); the control disables on confirm | ✅ |
| X13 | Written-answer note | The Faculty-review consequence is still shown in the dialog alongside the unanswered warning | ✅ |
| X14 | **F** — result flow | Unchanged; scoring, outcome and visibility policy all as before | ✅ |
| X15 | Navigator preserved | Compact card, live count, chips, *Still to answer*, **Go to next unanswered** (hidden once complete), responsive wrapping, accessible names, no Correct/Incorrect state | ✅ |
| X16 | **G** — sweep | 18 routes × 375 / 768 / 1280 — no accessibility findings, no horizontal overflow, no console errors | ✅ |

## Invariants spot-checked — Implementation 03

- **PUBLISHED ≠ TENANT ACCESS ≠ STUDENT ENTITLEMENT** — a Student sees only what an assignment reaches them with; published catalogue content never leaks into My Learning.
- **COURSE MEMBERSHIP ≠ ENTITLEMENT** and **GROUP MEMBERSHIP ≠ ENTITLEMENT** — proven on a student who has both and no entitlement.
- **A Student never sees a technology they were not granted** — enforced by the state writers as well as the UI, so the address bar cannot produce an authorised launch state.
- **The Student workspace derives from the Implementation-02 engine** — there is no second entitlement store and no seeded student access.
- **An inactive Student cannot launch**, and **expired tenant access cannot launch** — in both cases history is preserved and nothing is deleted.
- **A revoked assignment removes current access but not the record of past work**, and the two are clearly separated.
- **Progress derives from real actions only** — no decorative percentage exists anywhere.
- **Three assigned technologies never collapse into one state**, and the roll-up always says which technologies it covers.
- **Nothing completes while a written answer is pending Faculty review** — in the label and in the percentage.
- **Answer visibility follows the seeded policy**, not a hardcoded assumption of immediate feedback.
- **One assessment per Experiment** — a Student is never asked to repeat it because two technologies were licensed.
- **No certificates**, no gamification, no leaderboards, no B2C commerce; no Faculty review workspace, grading or turnaround is implemented.

---

# IMPLEMENTATION 04

**Faculty workspace · assessment management · Question Bank · descriptive review ·
student progress and analytics.**

Every step below was executed against the final build in a Chromium-based browser, from a
`Reset prototype data` seed forward. No console error or warning was produced at any point.

The fixture used throughout: Scenario A approved → `ACC-001` (Direct Shear Test **VR + AR**,
Consolidation Test **VR**, quantity **3**, Yearly) → three Students assigned both Experiments →
**Dr. Arjun Mehta** mapped to *Direct Shear Test*, **Dr. Sneha Iyer** mapped to
*Consolidation Test*.

## Q — Faculty resolution and the mapping boundary

| # | Step | Expected | Result |
|---:|---|---|:--:|
| Q1 | Prototype controls strip | A **Faculty** entry sits between Tenant Admin and Student | ✅ |
| Q2 | `#/faculty` with nothing selected | Chooser over the **real** Faculty records, each with its institution, its faculty id and how much is mapped to it. No fabricated identity | ✅ |
| Q3 | Select a Faculty member | Strip shows **Viewing as Faculty**, the workspace opens on Overview, and the pointer and the page agree | ✅ |
| Q4 | Faculty with **no** mapping (fresh seed) | Overview and My Content both give a useful empty state explaining that the institution maps content to faculty. Not a blank page, not an error | ✅ |
| Q5 | Arjun's Overview after mapping only Direct Shear Test | Mapped courses **1**, mapped experiments **1**, students reached **3**, responses to review **0** | ✅ |
| Q6 | Consolidation Test is in the Tenant's access **and** assigned to students | It does **not** appear anywhere in Arjun's workspace — he is not mapped to it | ✅ |
| Q7 | Hand-edit to `#/faculty/USR-001/assessment/consolidation` | Explicit refusal: *"This experiment is not mapped to you"*, with a route back to My Content | ✅ |
| Q8 | Hand-edit to another faculty member's review, `#/faculty/USR-001/review/REV-002` | Explicit refusal: *"This response is not in your queue"* | ✅ |
| Q9 | Sneha's Question Bank | Shows only the 4 Consolidation Test questions — not Arjun's, not the whole tenant's | ✅ |

## R — Student reach is entitlement, not enrolment

| # | Step | Expected | Result |
|---:|---|---|:--:|
| R1 | 6 Students exist in the tenant; 3 hold effective entitlement to Direct Shear Test | Faculty student reach for that Experiment is **3**, not 6 | ✅ |
| R2 | My Content student column | Counts effective entitlement, and says so above the table | ✅ |
| R3 | Student Progress rows | One row per Student × mapped Experiment — 3 rows, all entitled | ✅ |
| R4 | Attempt to assign 5 Students against 3 licences (Implementation-02 regression) | Blocked whole: *"requires 2 more licences on ACC-001. No part of the selection is applied"* — reach never counts a held student | ✅ |

## S — Question Bank: Add · Edit · Delete

| # | Step | Expected | Result |
|---:|---|---|:--:|
| S1 | Fresh seed | 12 seeded Question Bank items and 3 assessment definitions exist as **mutable state**, not static data | ✅ |
| S2 | Add a question, submit empty | Error summary + inline errors: question text, at least two options, choose the correct answer | ✅ |
| S3 | Add MCQ, mark a **blank** option as correct | *"The option you marked as correct is empty. Fill it in, or mark a different option."* — the answer index can never silently shift onto another option when blanks are dropped | ✅ |
| S4 | Add a valid **MCQ** | Stored with the trimmed options and the remapped answer index; `origin: manual` | ✅ |
| S5 | Add a **True / False** question | Stored with a boolean answer, no options | ✅ |
| S6 | Add a **Descriptive** question with 4 marks and evaluation guidance | Stored with `answer: null` — **no machine answer key is required** | ✅ |
| S7 | Switch question type in the editor | Only the fields for that type are present, and the hidden fieldsets are disabled — they leave the tab order rather than becoming invisible traps | ✅ |
| S8 | Edit a question already used in an assessment | Saves to the **bank**. The assessment keeps its own copy and shows *"This question has been changed in the Question Bank"* with an explicit **Use the updated version** action | ✅ |
| S9 | Take that update | The assessment's copy is updated **on the decision**, never as a side effect | ✅ |
| S10 | Search, type filter, experiment filter | All work; the count line reads `n of m shown`; a filtered-to-nothing state offers **Clear filters** | ✅ |
| S11 | Refresh the page | Everything persists (`localStorage`, `xrslp-unified-v1`, `schemaVersion: 5`) | ✅ |

## T — Question Bank **Delete** safety

The §41 sequence, executed end to end.

| # | Step | Expected | Result |
|---:|---|---|:--:|
| T1 | Create a question → add it to an assessment → a Student attempts and submits it | Attempt exists, containing that question | ✅ |
| T2 | The control's label | Reads **Delete**. Not Archive, not Retire, not Deactivate | ✅ |
| T3 | Click Delete | Confirmation naming the assessment it is used in **and** the number of submitted attempts that contain it, then *"the question is removed from your active Question Bank"* | ✅ |
| T4 | After confirming — the bank | The question is gone from the active bank. No archive, bin or restore surfaces it again | ✅ |
| T5 | After confirming — the assessment | Still contains its copy and still works; the builder notes the bank item is gone and that nothing is affected | ✅ |
| T6 | After confirming — the submitted attempt | Snapshot, answers, score and outcome **byte-identical** to before | ✅ |
| T7 | After confirming — the **pending review** for that deleted question | Still opens, still shows the question text and the evaluation guidance, and can still be completed | ✅ |

## U — Assisted question drafting

| # | Step | Expected | Result |
|---:|---|---|:--:|
| U1 | Open **Draft with assistance** | Prompt, **source material** (paste or open a local text file), question type, number of drafts. A `PROTOTYPE ONLY` note stating no provider and no network request | ✅ |
| U2 | Enter *"Create 3 beginner questions about Direct Shear Test specimen preparation and the failure plane"* and generate | 3 drafts, built from the Experiment's own learning resources, each a coherent subject question with a real answer key | ✅ |
| U3 | Network activity during generation | **Zero** new resource entries — measured with `performance.getEntriesByType('resource')` | ✅ |
| U4 | Question Bank during generation | **Unchanged.** A draft has no id in any collection | ✅ |
| U5 | Draft labelling | Every draft carries **AI-assisted draft** *and* **Review required**, as words plus badges — never styling alone | ✅ |
| U6 | Edit a draft, then add it | The **edited** values are what is stored; the question appears in the bank with `origin: ai` so its provenance stays visible | ✅ |
| U7 | Discard a draft | Removed, with *"It was never in your Question Bank."* | ✅ |
| U8 | Generate twice with the same prompt | **Identical** drafts — deterministic | ✅ |
| U9 | Generate with a different prompt | Different drafts — the prompt genuinely steers which source material is used | ✅ |
| U10 | Paste source material and generate | Drafts are built from the supplied material, and say so (*"According to the material you supplied…"*) | ✅ |
| U11 | Add a draft that fails validation | Refused with the reason shown on the draft card; nothing is added | ✅ |

## V — Assessment management

| # | Step | Expected | Result |
|---:|---|---|:--:|
| V1 | Assessments list | One row per mapped Experiment — questions, marks, derived status, students, submitted attempts, updated | ✅ |
| V2 | Assessment overview | Configuration, **Who this assessment reaches** (local Course code + optional Semester + entitled students), the three-item completeness rail and a next-action sentence | ✅ |
| V3 | Builder — add from the Question Bank | Multi-select of bank items **for that Experiment** not already included; the count updates as items are selected | ✅ |
| V4 | Builder — reorder | **Move up / Move down** are real buttons, keyboard-operable, disabled at the ends | ✅ |
| V5 | Builder — **Remove from this assessment** | Confirmation says the question stays in the Question Bank; it does | ✅ |
| V6 | Settings — create form | **Nothing is pre-filled.** No pass mark, attempt limit or policy is suggested, and the form says why | ✅ |
| V7 | Settings — choose *Show on a set date* and save with no date | Refused: *"Set the date answers and explanations become visible."* | ✅ |
| V8 | Settings — the `PENDING — ND-10` note | States that the BITS / Taxila rule is not established and that no BITS default is preselected here | ✅ |
| V9 | Structural edit with **0** submitted attempts | Saved; revision stays **1** | ✅ |
| V10 | Structural edit with **1** submitted attempt | A warning **before** the edit says it creates revision 2 and that submitted attempts are unchanged. Revision advances; the attempt's snapshot does not move | ✅ |
| V11 | Settings-only edit | Does **not** advance the revision — it changes no question | ✅ |

## W — Preview

| # | Step | Expected | Result |
|---:|---|---|:--:|
| W1 | Preview → *What the student sees* | The generated disclosure and the questions, rendered through the **Student's own renderer**. **Zero** answer keys on screen | ✅ |
| W2 | Preview → *Authoring view* | 6 answer keys shown for 6 objective questions, each explicitly labelled **Correct answer**, behind a banner saying this is not a student view | ✅ |
| W3 | Every input in the preview | Disabled — nothing can be answered | ✅ |
| W4 | Attempts after previewing | **0.** Preview creates no attempt and consumes no attempt allowance | ✅ |

## X — Descriptive review and the Student result

| # | Step | Expected | Result |
|---:|---|---|:--:|
| X1 | Student submits an assessment containing a written answer | Outcome **Pending Faculty review**; the score reports the **objective** questions only; a `reviews[]` record is created | ✅ |
| X2 | The Student result screen | *"Pending Faculty review"*, and the written answer shows *"This answer is with your faculty for review"* | ✅ |
| X3 | Faculty **Reviews** queue | The response appears with student, experiment, question, max marks, submitted time and attempt number | ✅ |
| X4 | Review assistance preference — **Manual** | No suggestion is offered; the marking form works exactly the same | ✅ |
| X5 | Review assistance — **With a suggestion** → Generate | Suggested marks, suggested feedback, and **what was compared** (length; which of *your* guidance points appear). No confidence score, no percentage, no scoring band | ✅ |
| X6 | The `PENDING — ND-09` note beside it | States plainly that this is **not** the Taxila auto-review, that the mechanism is not in the sources, and that none has been invented | ✅ |
| X7 | After generating a suggestion | The review is still **pending**, the attempt outcome is still pending, and the Student sees no change | ✅ |
| X8 | **Use this suggestion** | Fills the form. Nothing is saved | ✅ |
| X9 | Enter marks above the maximum | Refused: *"Marks cannot be more than the maximum of 4."* Not silently clamped | ✅ |
| X10 | Change the marks away from the suggestion and **Confirm** | A dialog states the consequence; on confirm the review completes, attributed to that Faculty member | ✅ |
| X11 | The attempt after confirmation | Re-scored: objective + descriptive (8.5 of 10 → 85%), outcome decided against the **snapshot** pass mark | ✅ |
| X12 | The Student result screen, policy **Show immediately** | Outcome shown, the written answer shows **3.5 of 4 marks** and the **Faculty feedback**, and the headline says the percentage now includes the faculty marks | ✅ |
| X13 | A second attempt under policy **Show after the assessment deadline**, reviewed **before** the deadline | *"Your written answer has been reviewed"* — the final result is **withheld**, the answers stay hidden, and the objective sub-score is still shown. No pass/fail leak, and no **Try again** button that would reveal the outcome | ✅ |
| X14 | Faculty change the policy on an assessment whose result was already visible | The Student result follows immediately — answers re-withheld, the score reverts to the objective figure. The Faculty control drives the **same** result engine | ✅ |
| X15 | The pass mark shown on that result | Still the value the attempt was **taken under**, not the value Faculty later set. History is not re-decided | ✅ |
| X16 | A completed review | Read-only, with a named prototype limitation explaining why no re-grading workflow was invented | ✅ |

## Y — Faculty student progress and analytics

| # | Step | Expected | Result |
|---:|---|---|:--:|
| Y1 | Every figure on the page | Reproducible by counting the rows below it; each states what it counts | ✅ |
| Y2 | Filters — search, experiment, progress state | All work; the aggregates recompute over the **filtered** set, so the numbers and the table always agree | ✅ |
| Y3 | Filter to a state with no rows | Honest empty state, not a blank table | ✅ |
| Y4 | Switch to a different Faculty member | Filters reset. A search term set by one faculty member never silently narrows another's list | ✅ |
| Y5 | **Simulation activity by technology**, after a Student completes **VR** only and submits the assessment | VR: 3 entitled · 1 started · 1 completed. **AR: 3 entitled · 0 started · 0 completed.** The assessment submission does **not** make AR look started | ✅ |
| Y6 | Student detail | Assessment state and score, written answers with the marks and feedback, resources, **per-technology** simulation rows with launches and recorded time, and the overall roll-up | ✅ |
| Y7 | Anywhere on either screen | No index, score, rank, prediction, engagement metric, attendance or GPA | ✅ |
| Y8 | The completion caveat | Present on every surface that shows *Completed*, stating that it is a prototype-derived rule and not an academic policy | ✅ |

## Implementation-01 → 03 regression, re-run on the Implementation-04 build

| # | Check | Result |
|---:|---|:--:|
| Z1 | **Scenario A** — internal request → approve → **no payment step** → Active, tenant access created with the approved items, technologies, quantity and term | ✅ |
| Z2 | **Scenario B** — external request → approve → `APPROVED_PAYMENT_REQUIRED` with **no access record created** → payment → Active, tenant and access created | ✅ |
| Z3 | People · Groups · academic mappings · Faculty mapping · student assignments | ✅ |
| Z4 | **5 Students against 3 licences → blocked whole**, nothing assigned, remaining allocation unchanged | ✅ |
| Z5 | Derived entitlement — one Student counted once across two Experiments on the same access record | ✅ |
| Z6 | Student My Learning shows only entitled Experiments and only entitled technologies | ✅ |
| Z7 | Resources → simulation → assessment → result → progress | ✅ |
| Z8 | Assessment attempt screen — 7 question cards, the compact review navigator, live answered count, **no** correct/incorrect indication before submission | ✅ |
| Z9 | Incomplete submission — allowed, but only after an explicit warning naming the unanswered questions | ✅ |
| Z10 | **VR completed · AR not started** stays exactly that on the Student's own progress, after an assessment submission | ✅ |
| Z11 | The Student attempt renders through the **shared** renderer the Faculty preview uses — no behaviour changed | ✅ |

## Responsive

Swept every Faculty route at **375**, **768** and **1280**, measuring
`document.body.scrollWidth − document.documentElement.clientWidth` after render.

| Width | Result |
|---|:--:|
| 375 | **No page-level horizontal overflow on any Faculty route** | ✅ |
| 768 | **No page-level horizontal overflow on any Faculty route** | ✅ |
| 1280 | **No page-level horizontal overflow on any Faculty route** | ✅ |

Wide tables scroll inside their own `.tscroll` container and degrade to stacked cards below
740px; the workspace navigation becomes a horizontal scrolling strip below 900px; the
completeness rail and the form aside move **above** the body when the two-column layout
collapses, so the next safe action is read first.

## Accessibility

Audited programmatically across all 17 Faculty routes, plus the empty-state variants.

| Check | Result |
|---|:--:|
| Every route has an `h1`, and no heading level is skipped | ✅ *(one skip found on Reviews' empty state and fixed)* |
| Every form control has a label, `aria-label` or wrapping label | ✅ |
| Every button and link has an accessible name | ✅ |
| Every table has a `<caption>` | ✅ |
| Every `<fieldset>` has a `<legend>` | ✅ |
| Hidden question-type fieldsets are also `disabled` — they leave the tab order | ✅ |
| Builder reorder / remove / refresh are real buttons, keyboard-operable | ✅ |
| Status is never colour-only — every badge carries an icon and a word | ✅ |
| Dialogs trap focus, close on Escape and restore focus (shared component) | ✅ |
| Form errors render as a focused summary **and** inline, tied by `aria-describedby` | ✅ |

No formal WCAG conformance is claimed.

## Invariants spot-checked — Implementation 04

| Invariant | Verified by |
|---|---|
| A Faculty member sees only mapped content | Q5–Q9 |
| Faculty mapping ≠ student entitlement | R1–R4 |
| Assessment is per **Experiment**; simulation is per **technology** | Y5, Z10 |
| An assessment submission never makes a technology look started | Y5 |
| A submitted attempt is never mutated by a later Faculty edit or delete | T6, V10, X15 |
| `Delete` is the label, and history survives it | T2–T7 |
| Nothing generated by assistance reaches the bank, an assessment or a Student without an explicit Faculty action | U4, U6, X7, X8 |
| Faculty is the only writer of an evaluated descriptive result | X7–X11 |
| The Student consumes the **same** definition Faculty manage | V3 → Z8, X14 |
| No answer key on any student-facing surface | W1, Z8 |
| No BITS/Taxila default is asserted anywhere | V8 |
| No KPI, index, score, rank or prediction | Y7 |
| Every enabled control does something | whole suite — no dead control found |

---

## Y1 · Content production — Vendor: create, save draft, and stay private

Prototype controls → **Vendor** → *Ananya Rao — Sample XR Content Vendor* → **Open workspace**.

| # | Step | Expected | Result |
|---|---|---|---|
| Y1-1 | Reset prototype data, then open `#/vendor` | Chooser lists **2 sample Vendors** with their assigned Courses; labelled PROTOTYPE ONLY; no fabricated identity | ✅ |
| Y1-2 | Open Ananya Rao's workspace | Overview counts real records: Draft 1 · In academic review 1 · Changes requested 0 · Awaiting publication 1 · Published 0. No score, rating, SLA or revenue anywhere | ✅ |
| Y1-3 | Check the Courses panel | Soil Mechanics · Surveying · Structural Analysis — the seeded assignment, no others | ✅ |
| Y1-4 | **Create experiment** | Form opens with a live **submission checklist** listing what is still missing | ✅ |
| Y1-5 | Open the Course select | Only the 3 assigned canonical Courses. There is no control to create a Programme or a Course | ✅ |
| Y1-6 | Look for a Learning Outcomes field | **None.** The card says they are authored by the Academic Reviewer | ✅ |
| Y1-7 | Look for a source-code / repository / container field | **None anywhere.** The aside states explicitly that none is required | ✅ |
| Y1-8 | Tick **VR** and **Web** | Two delivery fieldsets appear — **Web**: hosted URL, browser/runtime, notes. **VR**: package label, reference, file picker, device/runtime, installation notes, notes. Web is never asked for a package; VR is never asked for a URL | ✅ |
| Y1-9 | Enter `xr.example.edu/triaxial` as the Web URL and **Save and submit** | Refused. Error summary + inline field error: *"enter a full URL beginning with https://"*, `aria-invalid="true"`, `aria-describedby` points at the error. **No record was created** | ✅ |
| Y1-10 | Correct to `https://xr.example.edu/triaxial-compression`, fill the rest, **Save draft** | Checklist flips to *"Everything required for academic review is present"*; `EXP-011` created as **Draft**; toast says it is private until submitted | ✅ |
| Y1-11 | Choose a package file for VR | Records the **file name and size only**; the line says *"Prototype records package metadata only; no binary is uploaded or stored"*. Nothing claims an upload succeeded | ✅ |
| Y1-12 | **Public** → catalogue; search *triaxial* | **0 experiments matching.** The draft is not in the catalogue, the counts or the search index | ✅ |
| Y1-13 | Hand-type `#/experiment/EXP-011` | **Page not found** — `data.contextOf()` cannot resolve unpublished content | ✅ |
| Y1-14 | Tenant Admin → Content access · Faculty → My Content · Student → My Learning | The draft appears on none of them | ✅ |

## Y2 · Vendor — submit for academic review

| # | Step | Expected | Result |
|---|---|---|---|
| Y2-1 | Open `EXP-011` → **Submit for academic review** | Confirm dialog names the Academic Reviewer, warns the submission becomes read-only, and states that submitting publishes nothing | ✅ |
| Y2-2 | Confirm | Status → **Academic review**; `submittedAt` and `submittedBy` recorded; history gains *"Submitted for academic review (v1)"* | ✅ |
| Y2-3 | Try to edit it: `#/vendor/ACT-001/experiment/EXP-011/edit` | Route resolves; the **editor refuses** and says the Academic Reviewer holds the revision. `state.vendorCanEdit()` returns false | ✅ |
| Y2-4 | Public catalogue and direct route again | Still not found. Still 6 published | ✅ |

## Y3 · Academic Reviewer — the queue, the outcomes editor, the return path

Prototype controls → **Academic Reviewer** → *Dr. R. Iyer*.

| # | Step | Expected | Result |
|---|---|---|---|
| Y3-1 | Open the **Review queue** | `EXP-011` present with Vendor, Course, technologies, submitted date, version, status. No academic quality score anywhere | ✅ |
| Y3-2 | Look for a Publish control | **None on any Reviewer screen** | ✅ |
| Y3-3 | Open the submission | Metadata, Course context, technology delivery **as read-only context**, documentation, Vendor notes, version. No install, download or deploy control | ✅ |
| Y3-4 | Check **Approve academically** before any outcome exists | Disabled, with the reason named: *"Record at least one Learning Outcome before approving."* | ✅ |
| Y3-5 | **Request changes** with an empty comment | Refused; the field is marked invalid with the reason. Status unchanged | ✅ |
| Y3-6 | Enter a reason and **Request changes** → confirm | Status → **Changes requested**; `returnedGate = academic`; the decision is stored in `academicReviews[]`; the Vendor may edit again | ✅ |
| Y3-7 | Vendor opens the submission | Sees the reviewer's comment, their name, their role and the timestamp; the action reads **Correct submission** | ✅ |
| Y3-8 | Vendor corrects and resubmits | Revision → **2**, *Resubmitted* chip, back to **Academic review**. History keeps *created · submitted · changes · resubmitted* — the earlier decision is not erased | ✅ |
| Y3-9 | Reviewer reopens it | Header says *"Resubmitted for academic review (revision 2)"*; the previous decision is listed under **Academic decision history** | ✅ |
| Y3-10 | **Add** three Learning Outcomes | Ordered list; the approve control enables as soon as the first is added | ✅ |
| Y3-11 | **Edit** outcome 2 | Inline editor; save updates it in place | ✅ |
| Y3-12 | **Move** outcome 3 up, then back down | Order changes and restores | ✅ |
| Y3-13 | Add a temporary outcome, then **Delete** it | Confirm dialog; count returns to 3 | ✅ |
| Y3-14 | **Approve academically** → confirm | Dialog states it does **not** publish and grants nothing. Status → **Content readiness review**; reviewer, timestamp, decision, comment, revision **2** and the 3 outcomes are all recorded | ✅ |
| Y3-15 | Public catalogue and direct route | **Still not published, still not found.** Approval is not publication | ✅ |

## Y4 · Content Manager — Content Library, readiness, and the terminology firewall

Prototype controls → **Content Manager** → *M. Kulkarni*.

| # | Step | Expected | Result |
|---|---|---|---|
| Y4-1 | **Content Library** | Published and pipeline content in one list, over the same source the public catalogue reads. Search, status, Course and technology filters, all working | ✅ |
| Y4-2 | Filter to something that matches nothing | Honest empty state with a *Clear search & filters* action that works | ✅ |
| Y4-3 | **Publication queue** | Only academically approved items. Each row shows its Vendor, the academic approval, and its readiness | ✅ |
| Y4-4 | Read the queue's header note | Says first publication only, and that a later version is a separate Super Admin decision on a different object | ✅ |
| Y4-5 | Open `EXP-011` | Canonical metadata, Learning Outcomes **read-only** (marked *Academic Reviewer owned*), the academic decision, technology delivery, documentation, history | ✅ |
| Y4-6 | Check readiness | *"Ready for first publication"* — academic approval present and every canonical and technical requirement met | ✅ |
| Y4-7 | **Search the whole workspace for the words *release* and *hold* as an action** | **Zero occurrences.** The action is **Publish** throughout | ✅ |
| Y4-8 | Open a **published** item (Direct Shear Test) | Publication record shown; origin *Existing published content*, with a line explaining it predates the workflow. No invented Vendor, reviewer or decision | ✅ |
| Y4-9 | Check for a *Create new version* control | **Not rendered** on any screen. Instead: a plain statement that a later version is a Super Admin Release / Hold decision, not part of first publication, and not built here | ✅ |

## Y5 · The Publish action

| # | Step | Expected | Result |
|---|---|---|---|
| Y5-1 | **Publish** on `EXP-011` | Confirm dialog names the Programme › Course, the version, the technologies, the outcome count and the academic approver — and states plainly: **"Publishing grants access to nobody."** | ✅ |
| Y5-2 | Confirm | Status → **Published**. `publishedBy` = M. Kulkarni, `publishedAt` recorded, version `1.0`, revision `2`, technologies and outcomes snapshotted, the academic review id linked | ✅ |
| Y5-3 | Content Library | The item moves to Published; the published count rises | ✅ |
| Y5-4 | History | *created · submitted · changes · resubmitted · approved · published*, each with actor, role and timestamp | ✅ |

## Y6 · **Publishing grants nobody anything** — the critical negative

Measured immediately before and immediately after the Publish in Y5.

| # | Check | Before | After | Result |
|---|---|---|---|---|
| Y6-1 | Seeded tenant's access rows | `ACC-001`, `ACC-002` | **byte-identical** | ✅ |
| Y6-2 | Tenant holds `EXP-011`? | no | **no** | ✅ |
| Y6-3 | Active assignments | 1 | **1** | ✅ |
| Y6-4 | Every student's derived entitlements | recorded | **identical** | ✅ |
| Y6-5 | Every Faculty member's content scope | recorded | **identical** | ✅ |
| Y6-6 | Tenant Admin → Content access | no entitlement to the new Experiment appears | ✅ |

## Y7 · Public catalogue integration, and the information boundary

| # | Step | Expected | Result |
|---|---|---|---|
| Y7-1 | Public → **Catalogue** | Count rises from *6 experiments published* to **7**; the new Experiment is listed | ✅ |
| Y7-2 | Search *triaxial* | **1 experiment matching** — the same search index, not a second one | ✅ |
| Y7-3 | Search *permeability* (a seeded **draft**) | **0 experiments matching** + *No experiments match*. Unpublished content is absent from search, suggestions and counts | ✅ |
| Y7-4 | Open the new Experiment | Under **Civil Engineering › Soil Mechanics**, with its description, both technologies, device requirements and the **3 Learning Outcomes the Academic Reviewer wrote** | ✅ |
| Y7-5 | Assert the internal strings are absent from the rendered page | Vendor notes ❌ · reviewer comments ❌ · package label ❌ · package reference ❌ · hosted URL ❌ · Vendor name ❌ · reviewer name ❌ · Content Manager name ❌ · history ❌ · revision ❌ | ✅ |

## Y8 · End-to-end — new content reaches a Student with no special-case code

| # | Step | Expected | Result |
|---|---|---|---|
| Y8-1 | Public → the new Experiment → tick both technologies → **Add to selection** | Uses the existing selection basket | ✅ |
| Y8-2 | **Prepare institutional request** → submit | `REQ-003` created by the **existing** Implementation-01 workflow. No new request path was built | ✅ |
| Y8-3 | Super Admin → open `REQ-003` → **Approve** | Internal route → **Active** immediately, no payment step. `ACC-003` created for the new Experiment with the selected technologies | ✅ |
| Y8-4 | Switch to scenario **B** and repeat with the new Experiment | External route → **Approved — payment required** → payment simulation → **Active**; a second tenant is created. Implementation-01 states are unchanged | ✅ |
| Y8-5 | Tenant Admin → **Assignments → New assignment** | `ACC-003` offered; selecting it lists the new Experiment; assign two students | ✅ |
| Y8-6 | Check entitlement | Both students derive `EXP-011` with exactly the granted technologies | ✅ |
| Y8-7 | Tenant Admin → **Faculty mapping** | `ACC-003` → Soil Mechanics → the new Experiment; map Dr. Sneha Iyer | ✅ |
| Y8-8 | Faculty → **My Content** | The new Experiment appears. **No `data.js` change was needed** | ✅ |
| Y8-9 | Faculty → **Assessments** → open the new Experiment | The assessment builder opens for it, in scope | ✅ |
| Y8-10 | Student → **My Learning** | The new Experiment appears | ✅ |
| Y8-11 | Open the Student's experiment page | Shows the **Academic Reviewer's Learning Outcomes** — one copy, not a Faculty-only duplicate — and both entitled technologies | ✅ |
| Y8-12 | Check the empty states | No resources and no assessment are configured yet, and the page says so honestly. Nothing is faked to make the page look full, and nothing crashes | ✅ |

## Y9 · Role and action guards — refused at the state layer, not just the UI

Every call below was made **directly against `XRSLP.state`**, bypassing the screens entirely.

| # | Attempt | Expected | Result |
|---|---|---|---|
| Y9-1 | Vendor → `approveAcademic()` | refused (`null`) | ✅ |
| Y9-2 | Vendor → `publishContent()` | refused | ✅ |
| Y9-3 | Vendor → `requestChangesAcademic()` | refused | ✅ |
| Y9-4 | Vendor → `addOutcome()` | refused — outcomes are not the Vendor's | ✅ |
| Y9-5 | Vendor → `updateCanonicalMetadata()` | refused | ✅ |
| Y9-6 | Academic Reviewer → `publishContent()` | refused | ✅ |
| Y9-7 | Academic Reviewer → `requestChangesContent()` | refused | ✅ |
| Y9-8 | Academic Reviewer → `updateCanonicalMetadata()` | refused | ✅ |
| Y9-9 | Academic Reviewer → approve a submission **outside their Course assignment** | refused | ✅ |
| Y9-10 | Content Manager → publish a **DRAFT** | refused | ✅ |
| Y9-11 | Content Manager → publish an item still **in academic review** | refused — this is the "cannot fake academic approval" case | ✅ |
| Y9-12 | Content Manager → publish an item **returned for correction** | refused | ✅ |
| Y9-13 | Vendor → edit **another Vendor's** record | refused | ✅ |
| Y9-14 | Vendor → create in a Course they are **not assigned** to | refused | ✅ |
| Y9-15 | Vendor → edit a record **under review** | refused | ✅ |
| Y9-16 | **State after all sixteen attempts** | record count, every status, the canonical name, the outcome count and the published pool **all unchanged** | ✅ |

### Route guards

| # | Route | Expected | Result |
|---|---|---|---|
| Y9-17 | `#/vendor/<Content-Manager-id>/overview` | Page not found | ✅ |
| Y9-18 | `#/review/<Vendor-id>/queue` | Page not found | ✅ |
| Y9-19 | `#/content/<Reviewer-id>/library` | Page not found | ✅ |
| Y9-20 | `#/vendor/ACT-001/experiment/<other Vendor's record>` | Page not found | ✅ |
| Y9-21 | `#/review/<Civil reviewer>/submission/<Mechanical record>` | Page not found | ✅ |
| Y9-22 | `#/experiment/<unpublished id>` (Public) | Page not found | ✅ |
| Y9-23 | `#/learn/<student>/experiment/<unpublished id>` | Experiment not found | ✅ |
| Y9-24 | Tenant Admin → Content access | No *Edit experiment*, no *Publish*, no *Edit Learning Outcomes* control exists | ✅ |

## Y10 · Migration, reset and schema

| # | Step | Expected | Result |
|---|---|---|---|
| Y10-1 | Open the build on an existing **schema-5** browser state | Upgrades in place. `schemaVersion` **6**, `migratedFrom` **5**, namespace still `xrslp-unified-v1` — no second key | ✅ |
| Y10-2 | Count every Implementation 01–04 collection after migration | 2 requests (both still ACTIVE) · 2 access · 1 tenant · 8 people · 2 groups · 4 memberships · 2 course mappings · 1 Faculty mapping · 1 assignment · 1 attempt · 12 questions · 3 assessment definitions · 1 review — **all preserved** | ✅ |
| Y10-3 | Check the new collections | `contentRecords` 10 · `academicReviews` 4 · `publicationRecords` 6 · `contentActors` 5 · `contentRoleAssignments` 11 | ✅ |
| Y10-4 | Check the migrated catalogue | 6 seeded Experiments are now `PUBLISHED` content records with **unchanged ids**; Direct Shear Test still resolves everywhere | ✅ |
| Y10-5 | **Reset prototype data** | Restores the deterministic seed: 6 published + 4 sample in-flight submissions, 5 content actors, 0 requests, 0 access, 0 assignments. The dialog names the content pool among what it discards | ✅ |
| Y10-6 | Publish something, then reset | The published pool returns to 6; the projection cache does not serve the stale pool | ✅ |

## Y11 · Responsive, accessibility and console

| # | Check | Expected | Result |
|---|---|---|---|
| Y11-1 | **375 · 768 · 1280 · 1440** across 24 routes (all 8 workspaces) | **No document-level horizontal overflow on any of them** | ✅ |
| Y11-2 | `overflow-x` on `body` and `html` | **`visible`** — no overflow is masked | ✅ |
| Y11-3 | The eight-role prototype strip at 375 | Wraps into two labelled groups; the group labels drop below 900px; never overflows | ✅ |
| Y11-4 | Landmarks and headings across 25 route/state combinations | `<main id="main-content">`, one `h1` per screen, **no skipped heading level**, labelled `<nav>` | ✅ |
| Y11-5 | Every form control | Has a `<label for>`, a wrapping label, or an `aria-label` — **zero unlabelled controls** | ✅ |
| Y11-6 | Every button and link | Has an accessible name — **zero unnamed controls** | ✅ |
| Y11-7 | Every table | Has a `<caption>` and `scope` on every header cell | ✅ |
| Y11-8 | Grouped technology controls | `<fieldset>` + `<legend>`; every fieldset has a legend | ✅ |
| Y11-9 | Status | Text label **and** icon on every badge (10/10) — never colour alone | ✅ |
| Y11-10 | Errors | Error summary + per-field `aria-invalid` and `aria-describedby`; first invalid field focused | ✅ |
| Y11-11 | Publish dialog | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` the title, focus moves in, **Escape closes**, focus **restored to the trigger**, and nothing was published | ✅ |
| Y11-12 | First focusable element on every page | The **Skip to main content** link, ahead of the prototype strip | ✅ |
| Y11-13 | Live region | `role="status"`, `aria-live="polite"`; outcome edits announce | ✅ |
| Y11-14 | Console | **No errors and no warnings** across every route in every workspace | ✅ |

### Defects found and fixed during the Implementation-05 pass

| # | Defect | Fix |
|---|---|---|
| Y-D1 | **A `<select>` sized to its longest option pushed the whole document wider than a 375px viewport.** The Content Library's Course filter carries the longest option string in the product (*"Civil Engineering › Soil Mechanics"*); its width propagated out through the label and past the viewport | Shared `.listbar` fix, so **every** filter bar in the product gets it: `label{min-width:0; max-width:100%}` and `select,input{min-width:0; max-width:100%}` below 740px. Re-verified: 24/24 routes clean at all four widths |
| Y-D2 | **A status pill could not wrap, and overflowed at 1280px.** *"Existing published content"* was rendered as a `.badge`, which is `white-space:nowrap`, inside the narrow value column of a rail card | It is **provenance, not status**, so a badge was the wrong component. Replaced with an icon + text line that wraps (`.provline`) |
| Y-D3 | **The Vendor Submissions page skipped a heading level** (`h1` → `h3`), because the submission cards reused the Student workspace's `h3` card pattern without its `h2` section heading | The cards are top-level sections of that page, so their heading is `h2`, with the type treatment carried over. Two in-table empty states that were pinned to `h3` inside a heading-less `.tablecard` were returned to the default `h2` |
| Y-D4 | **The two decision cards had no error-summary container**, so a missing required reason produced only an inline field error and no summary | Added a `.form-errors` region to the Academic Review and Publication decision cards, matching every other form in the build |

### Defects found by an adversarial audit of this slice, and fixed

An independent audit pass was run over the Implementation-05 code against its own stated
invariants, and every reported finding was then adversarially verified against the running build.
Nine survived verification. All nine are fixed and re-verified below.

| # | Severity | Defect | Fix |
|---|:--:|---|---|
| Y-D5 | 🔴 **HIGH** | **An item could publish carrying an academic approval for different content.** A content-gate return hands the whole submission back to the Vendor, and `submitContent()` routed it straight back to `CONTENT_REVIEW`. Nothing checked that what came back was what had been approved — so a Vendor could change the Course, the name, the description and the technologies, resubmit past academic review entirely, and publish into the public catalogue with `publication.academicReviewerName` naming a reviewer who had never seen the object. **Reproduced live, end to end.** | An academic approval now records a **fingerprint** of what was validated — Course, name, summary, description, technologies and outcomes; delivery detail and documentation are deliberately excluded, because correcting *those* is exactly what a content-gate return is for. On resubmission the fingerprint is compared, and it **fails closed**: an approval that cannot be shown to describe the resubmitted work is withdrawn and the item returns to academic review. `publishReadiness()` re-checks it as a last line of defence, migration back-fills it onto older approvals, and the Vendor's correction screen says in advance which changes will withdraw the approval |
| Y-D6 | 🔴 **HIGH** | **An abandoned edit was restored and written back over the stored record.** The Vendor editor's working copy was module-scoped and cleared only on a successful save, so leaving via Cancel, the breadcrumb or the side nav kept it alive; re-entering restored it, and the next save wrote the abandoned values into state | The copy is stamped with the record, that record's event sequence and the actor, and is **discarded whenever the editor is left** — every non-editor Vendor screen calls `discardWork()`. Verified through all four exit paths, with a genuine in-session edit still saving correctly |
| Y-D7 | 🟠 MEDIUM | **The Content Manager could rewrite a Vendor's draft or a submission the Academic Reviewer was holding** — `updateCanonicalMetadata()` had no status guard, and the route rendered a live editor at any status. It could also move a submission out of its assigned reviewer's scope | Canonical metadata is a **Content Library** action: `canonicalEditable()` allows it only at the readiness gate and after publication. Enforced in the state action, in the screen, and on the action that links to it |
| Y-D8 | 🟠 MEDIUM | **The create form carried an abandoned draft across a change of Vendor identity** | The working copy carries the actor it was opened by, and is rebuilt when that changes |
| Y-D9 | 🟠 MEDIUM | **One history timeline rendered two role vocabularies** — seeded events stored raw keys (`vendor`), runtime events stored display labels (`Vendor`) | The seed writer maps through `CONTENT_ROLE_LABEL`, the same table the runtime writer uses |
| Y-D10 | 🟠 MEDIUM | **The academic readiness statement contradicted the Approve button.** It was rendered once; adding or deleting an outcome updated the button but not the alert above it | `refreshDecision()` repaints both, and now also runs after an edit |
| Y-D11 | 🟠 MEDIUM | **A persisted filter could select a value the rebuilt dropdown no longer offered** — publish the last draft and *"Status: draft"* stops existing, leaving every row filtered out while the control read *"Status: all"* with no way to clear it | `normaliseFilters()` resets any filter value the current rows cannot offer, called before the options are built, so the control and the filter always agree |
| Y-D12 | 🟠 MEDIUM | **Every action in the Learning Outcomes editor dropped keyboard focus to `<body>`**, because the repaint destroyed the button that had just been pressed | `repaint()` takes an explicit refocus target. Add returns focus to the input; edit, move and cancel return it to the row acted on; delete moves to the row that took its place, or the input if it was the last |
| Y-D13 | 🟢 LOW | **The Publish/Release firewall note jumped out of DOM order below 1040px**, because the shared rule lifts a rail's `.card` children above the body and the note is a bare `.alert` | The rule now orders a rail's direct `.alert` children with its cards |

### Re-verification after the fixes

| # | Check | Result |
|---|---|---|
| Y-R1 | The Y-D5 exploit, replayed exactly: return at the content gate → change Course, name, description and technologies → resubmit | Returns to **academic review**, approval withdrawn, publish **refused**, never reaches the catalogue, and the history records why | ✅ |
| Y-R2 | The legitimate case: return at the content gate → correct **only** the delivery details → resubmit | Goes to **content readiness review**, approval kept, publishes correctly | ✅ |
| Y-R3 | Abandoned edit, via all four exit paths | Stored values restored every time; a genuine edit still saves | ✅ |
| Y-R4 | Canonical metadata on a draft / on a submission in review / at the gate / published | refused · refused · allowed · allowed; the editor is not rendered for the first two, and the action link is absent | ✅ |
| Y-R5 | Readiness alert and Approve button after add / delete | Move together in both directions | ✅ |
| Y-R6 | Keyboard focus after add / delete in the outcomes editor | Lands on a real control, never `<body>` | ✅ |
| Y-R7 | Stale filter values | Reset to *all*; valid values kept | ✅ |
| Y-R8 | One role vocabulary across a mixed seeded/runtime timeline | `Content Manager · Academic Reviewer · Vendor · Vendor` | ✅ |
| Y-R9 | **Full guard suite re-run** — 19 state-layer actions and 8 route guards | **All 19 refused, all 8 not found, state byte-intact** | ✅ |
| Y-R10 | **Full lifecycle re-run** — create → submit → changes → correct → resubmit → outcomes → approve → publish → public | Passes, and publishing still granted nothing | ✅ |
| Y-R11 | **Responsive re-run** — 28 routes × 375 / 768 / 1280 / 1440 | **112/112 clean**, `overflow-x: visible` | ✅ |
| Y-R12 | **Accessibility re-run** — 28 routes | **0 issues** | ✅ |
| Y-R13 | Console | No errors, no warnings | ✅ |

## Defects found by the Implementation-04 review pass, and fixed

A multi-dimension adversarial review was run over the changed files (state correctness, student
regression, faculty screens, invariants, migration, the local assistance module, accessibility
and responsive, and source compliance), with every finding independently verified through three
lenses before being accepted. Fourteen real defects survived. All are fixed and re-verified in
the browser.

### 1 · The Progress screen printed a score the result screen was withholding

`recomputeAttempt` makes `score.percent` the **whole-assessment** figure once every written
answer is reviewed. The Progress screen still printed it as *"n% on the marked questions"* — a
wrong label, and worse, it printed the combined figure while the result screen was withholding it
under a delayed policy. It now asks the same question the result screen asks: when the final
result is withheld it shows the **objective sub-score** (the figure that was never withheld), and
otherwise it says whether the faculty marks are included.

### 2 · The reviewed-but-unreleased **outcome** leaked through the assessment badge

The same class of leak, one level up: `assessmentState()` returns `PASSED` as soon as the review
completes, so the Progress screen and the Experiment card announced *"Passed"* while the result
screen was withholding it. A single Student-facing mapping,
`XRSLP.studentUI.studentAssessState()`, now renders that case as **Reviewed — result not
released yet**. The state layer, the progress derivation and the Faculty workspace are untouched
and keep the true outcome — the withholding is a display decision on Student surfaces only, and
it is scoped to results that actually contain a Faculty review.

### 3 · The result screen read the attempt limit from the frozen snapshot

`attemptBlock` gates a new attempt on the **live** definition — as documented — but the result
screen read `attemptLimit` from the attempt's snapshot. Faculty raising or lowering the limit
therefore produced a **Try again** button the gate refused, or hid one the gate would have
allowed. The retry control now asks `attemptBlock` directly, and every attempt count on the
screen reads the live definition. Verified both ways: dropping the limit to 1 hides the control
and says *"You have used all 1 attempt"*; raising it to 3 restores it and says *"You have 2
attempts left"*.

### 4 · Two technology labels still read the Experiment roll-up

*"Your other technologies"* on the simulation screen and *"What you can open"* on the refusal
screen rendered `technologyProgress().status`, which folds in the Experiment-level resources and
assessment — the exact defect Implementation 03 fixed everywhere else. An untouched AR simulation
read *"In progress"* because the shared assessment had moved. Both now read that technology's own
`simulationStatus`, which is the rule stated at the head of `student.js`.

### 5 · A blank pass mark validated as 0%

`Number('')` is `0`, and `0` is a legal pass mark — so an empty field passed validation and every
attempt then passed. Blank numeric fields are now refused explicitly rather than coerced, in the
assessment settings and in the question editor.

### 6 · A True/False validation error was aimed at a hidden fieldset

`validateQuestion` emitted the field id `q-answer` for a missing True/False choice, but that id is
the **MCQ** option container; the True/False controls live in `q-tf`. The error summary appeared
and the inline message attached to a hidden element, so it was never seen. The error now names
its own field.

### 7 · An assessment with no questions could be started

`attemptBlock` only checked that a definition existed. A Faculty member who creates an assessment
before choosing its questions therefore left a Student able to start it, snapshot an empty
question list, score `null%` and land on **Not passed**. `attemptBlock` now returns
`no-questions`, and both Student surfaces say plainly that the faculty have not set the questions
yet.

### 8 · Edits to one assisted draft were discarded when another was added or removed

Draft edits were read out of the DOM only for the draft being added. Adding or discarding one
re-rendered the whole list, silently reverting every other card. Edits are now read back into the
held drafts before any re-render.

### 9 · A source-material file was dropped on the next render

`FileReader.onload` wrote the text into the textarea but not into the held state, so any
re-render lost the material while the label still claimed the file was loaded.

### 10 · Two supplied material extracts could be compared with themselves

Every chunk of Faculty-supplied source material carried the identical topic phrase, so the
false-True/False template could emit *"the material you supplied and the material you supplied
describe the same thing"* keyed **False** — a statement that is in fact true. Extracts now carry
distinct labels, and the template falls back to the true form rather than emitting a mis-keyed
question if there is nothing distinct to contrast with.

### 11 · A drafted MCQ could contain identical options

Distractors were taken from other sources with no dedupe. Two sources opening with the same
sentence produced a question with two identical options, only one of which the answer key pointed
at. Options are now deduplicated against the key and against each other.

### 12 · The suggestion emitted *"Missing or unclear: ."*

With no evaluation guidance there are no terms to compare, so there was nothing to name as
missing. That case now says so instead.

### 13 · The record always claimed the suggestion had been used

The review screen passed *"a suggestion exists"* where *"a suggestion was applied"* was meant, so
`assistance.accepted` was never `false`. It now records whether **Use this suggestion** was
actually clicked for that response.

### 14 · Smaller fixes

- The preview's **authoring view** — the one place an answer key is rendered — was a module
  global and carried over into a different assessment. It is now scoped, and defaults back to the
  student view.
- **Add a question** read the Question Bank's experiment filter without re-owning it, so the
  preselected experiment could be one another faculty member had filtered to.
- `state.releaseFor(att)` on the review screen lacked the null guard every neighbouring line has.
- *"Attempts submitted"* on the reach card is tenant-wide beside a faculty-scoped student count;
  the label now says so.
- The question-editor subtitle interpolated the experiment name into an HTML sink without
  escaping.
- Three empty states inside a table card used `h3` directly under the page `h1`, skipping a
  heading level.

### Re-verification after the fixes

| Check | Result |
|---|:--:|
| 59 routes swept across all five workspaces — runtime errors | **0** |
| 59 routes swept — blank pages | **0** |
| Horizontal overflow at 375 / 768 / 1280 | **none** |
| Accessibility audit (headings, labels, names, captions, legends) | **clean** |
| Sections Q–Y and the Z regression suite | **re-run, all passing** |

### 15 · Faculty student reach was intersected with the mapping's access record

A tenant can hold the same Experiment on more than one access record. Reach counted only the
students entitled through the record the Faculty mapping runs through — so a student entitled via
another record was invisible on Student Progress while their written answer still appeared in the
**Reviews** queue, because reviews are keyed by Experiment. The two surfaces disagreed. Reach is
now every student effectively entitled to that Experiment anywhere in the tenant, which is the
same population the assessment definition and the review queue already serve.

### 16 · The assistance module claimed to have no arithmetic it plainly had

The file and the UI promised *"no rubric weighting, threshold or scoring band"* while
`reviewSuggestion` contains exactly a weighted blend and length bands. A suggested figure has to
come from somewhere, so the fix was to make the claim true rather than to hide the mechanism: the
suggestion now **states its own derivation on screen** — the two observations it is built from and
nothing else — and the promise is the accurate one, that nothing here is presented or asserted as
how a production auto-review scores. That is the question `ND-09` leaves open, and it stays open.

---

## Result-withholding / progress-leak audit

A targeted audit of one question: **can a Student infer a withheld assessment result from any
other Student-facing status?**

### The progress roll-up dependency

It depends on **PASS/FAIL**, not on submission. Two places:

- `technologyProgress()` — `learningDone` requires `assess === ASSESS_STATE.PASSED`;
- `experimentProgress()` — the assessment step counts toward `steps.done` (and therefore the
  percentage) only when `assessState === ASSESS_STATE.PASSED`.

### Verdict — **LEAK FOUND**, reproduced before any change

Two Students, identical visible activity (all resources done, VR simulation complete, assessment
submitted), the same Consolidation Test assessment under **AFTER_DEADLINE** with a future
deadline. Faculty awarded full marks to one and zero to the other. Neither result was released.

| Student-facing signal | Passing Student | Failing Student |
|---|---|---|
| Experiment roll-up | **Completed** | **In progress** |
| Percentage | **100%** | **86%** |
| Steps | 7 of 7 | 6 of 7 |
| Technology row | `vr: COMPLETED` | `vr: IN_PROGRESS` |
| Home / Progress counts | completed **1** | in progress **1** |

Five independent channels, each of which differed **only** because of the hidden result.

### The correction

The smallest coherent one: the derivation gains an explicit **Student view**.

- `state.resultWithheld(personId, experimentId)` — true while a result that carries Faculty-awarded
  marks has been evaluated and the visibility policy has not released it.
- `technologyProgress(..., opts)` and `experimentProgress(..., opts)` take `opts.studentView`.
  Under it the assessment step is **undecided**: it never counts toward `steps.done`, and the
  status becomes the new `TECH_PROGRESS.RESULT_WITHHELD` — for a passing and a failing Student
  alike.
- `studentProgressSummary()` takes the Student view and counts that case in its own
  `awaitingRelease` bucket, so it is not silently folded into *Pending Faculty review* (which
  would be untrue — the review is done) or into *Not started*.
- Student screens pass `{ studentView: true }`. **The Faculty workspace does not**, and neither
  does `facultyExperimentStats`, so Faculty keep the evaluated truth (audit §9).

Files changed: `js/state.js`, `js/screens/student.js`, `js/screens/student-learn.js`.
`js/screens/faculty.js` and `js/screens/faculty-assess.js` are untouched by this audit.

The Student label is **Result pending release** — an activity/workflow state, exactly as audit §4
permits. It says the work is done and the result is waiting on a date, and nothing about the
result.

### After the correction — the two Students are indistinguishable

| Signal | Passing | Failing |
|---|---|---|
| Roll-up | `RESULT_WITHHELD` | `RESULT_WITHHELD` |
| Percentage | 86% | 86% |
| Steps | 6 of 7 | 6 of 7 |
| Technology row | `vr: RESULT_WITHHELD` | `vr: RESULT_WITHHELD` |
| Assessment badge | Reviewed — result not released yet | Reviewed — result not released yet |
| Summary counts | awaitingRelease 1 | awaitingRelease 1 |
| **Truth underneath** | PASSED | NOT_PASSED |

All six Student surfaces (Home · My Learning · Experiment · Assessment intro · Result · Progress)
were rendered for both Students and scanned for `Passed`, `Not passed`, `Correct`, `Incorrect`,
`Correct answer`, `Faculty feedback` and `Try again`: **clean on every surface for both**.

### Test matrix

| # | Case | Student sees | Faculty sees |
|---|---|---|:--:|
| A | `SHOW_IMMEDIATELY`, reviewed | Released — outcome, combined score, marks, feedback, explanations. Roll-up **Completed**, 100% | PASSED |
| B | `AFTER_DEADLINE`, reviewed before the deadline | Withheld — no outcome, no combined score, no marks, no feedback, no explanations. Roll-up **Result pending release**, 86% | PASSED |
| C | `CUSTOM_DATE`, reviewed before the date | identical to B | PASSED |
| D | Descriptive still unevaluated | **Pending Faculty review** — a distinct state, never conflated with C | PENDING |
| E | Evaluated, release withheld | Told the evaluation is finished and when the result becomes available; marks, feedback and outcome all withheld | PASSED / NOT PASSED |

Release was then exercised for real: moving case C's custom date into the past flipped the Student
view to **Passed / Completed / 100%** — so the policy still governs, in both directions.

### Residual channel, reported not closed

The **objective sub-score** ("n% on the marked questions") is still shown while the final result is
withheld. It has been shown at submission under every policy since Implementation 03, and
withholding it only after a Faculty review would retract a figure the Student had already seen. A
Student whose objective score is low enough that the remaining descriptive marks cannot reach the
pass mark can therefore deduce the outcome early. Closing this means withholding the objective
sub-score throughout under delayed policies — a change to Implementation 03's approved result
model, and a stakeholder decision rather than an audit fix. Recorded as README judgement call 24.

### Regression after the correction

| Check | Result |
|---|:--:|
| VR completed · AR not started, after an assessment submission | ✅ unchanged |
| Faculty per-technology analytics (`ar: 0 started`) | ✅ unchanged |
| Faculty review still updates the evaluated attempt | ✅ marks 3, reviewer recorded, outcome recomputed |
| Faculty still see the evaluated result and the true roll-up | ✅ passed 1 · roll-up Completed · 100% |
| Student receives the result exactly when the policy permits | ✅ verified in both directions |
| 43 routes across five workspaces — runtime errors | **0** |
| 43 routes — blank pages | **0** |

---

## Withheld-result score leak — final closure

The previous audit closed the indirect PASS/FAIL channel through the progress roll-up but left one
Student-facing channel open by design, and reported it: **the objective sub-score stayed on screen
while the result it determines was withheld.** This closes it.

### Root cause

`state.resultWithheld()` required `score.includesReview`. Three consequences followed:

- an **objective-only** assessment was never treated as withheld at all — machine marking was
  being treated as self-releasing, so `AFTER_DEADLINE` and `CUSTOM_DATE` governed nothing for it;
- a **mixed** assessment showed its objective sub-score both before Faculty review and after it,
  while the final result was withheld;
- the roll-up neutralisation therefore never applied to objective-only assessments either, so
  *Completed / 100%* versus *In progress / 86%* still published the outcome for them.

A Student whose objective marks already put the pass mark out of reach could read the hidden
outcome straight off any of these.

### The correction — one shared release decision

`state.scoreWithheld(personId, experimentId)` — *a submitted attempt exists and the
Faculty-configured policy has not released it*, with no reference to how the marking was done.
`resultWithheld()` becomes the subset of it where the outcome is actually decided, which is what
the roll-up neutralises; a still-pending review keeps its own honest state. Every Student-facing
score surface asks this one function, so no screen can disagree with another.

Files changed: `js/state.js`, `js/screens/student.js`, `js/screens/student-learn.js`.
`js/screens/faculty.js`, `js/screens/faculty-assess.js` and `js/ai-assist.js` untouched.

### Test matrix

| # | Case | Student sees | Faculty |
|---|---|---|:--:|
| A | `SHOW_IMMEDIATELY`, objective | score, outcome, per-question correctness, explanations | ✅ |
| B | `AFTER_DEADLINE` in future, objective | **no score, no outcome, no correctness** — “Result pending release”, and the date | ✅ |
| C | `CUSTOM_DATE` in future, objective | identical to B | ✅ |
| D | Mixed, before Faculty review | **Pending Faculty review**, and **no objective sub-score** | ✅ |
| E | Mixed, reviewed, release future | **Result pending release** — no objective sub-score, no descriptive marks, no outcome, no feedback | ✅ |
| F | Release moved into the past | full policy-permitted result, breakdown, answer feedback and Faculty feedback | ✅ |
| G | Faculty, throughout | evaluated marks and outcome visible before Student release | ✅ |
| H | Retry / Try again | hidden for **both** a passing and a failing Student while withheld | ✅ |

### Proof — a passing and a failing Student are indistinguishable

Two Students on the same withheld assessment, one scoring full marks and one scoring zero:

| Surface | Rendered output |
|---|---|
| Experiment detail | **byte-identical** |
| Assessment result | **byte-identical** — no figure, no outcome, no retry button |
| Progress — the withheld experiment's block | **byte-identical**: *“Result pending release · available 16 Sep 2026”* |
| Roll-up · percentage · steps · summary counts | identical (`RESULT_WITHHELD`, 86%, 6 of 7, awaitingRelease 1) |
| Truth underneath | PASSED vs NOT_PASSED |

Scanned on every Student surface for `Passed`, `Not passed`, `Incorrect`, `Correct answer`,
`Faculty feedback`, `Try again` and `marks awarded`: **clean on every withheld experiment for both
Students**. The only surfaces carrying those tokens are experiments whose policy has **released**
them, which is correct.

### Retry channel — verdict

**LEAK FOUND and closed.** `canRetry` required `att.outcome === NOT_PASSED`, so the presence of
*Try again* announced failure and its absence announced a pass. It now also requires
`!scoreWithheld`, and the attempts-left sentence is not printed while withheld. Verified: the
button is absent for both students under a withheld policy, and returns for the failing student
alone once the release date passes. **No change to the attempt-limit configuration** — `attemptBlock`
and `attemptLimit` are untouched.

### Regression

| Check | Result |
|---|:--:|
| `SHOW_IMMEDIATELY` — outcome, combined score, correctness, explanations, Faculty feedback | ✅ unchanged |
| Pending Faculty review state | ✅ distinct from *Result pending release* |
| Post-review withheld result | ✅ nothing disclosed |
| Release transition, in both directions | ✅ |
| Progress pass/fail withholding from the previous audit | ✅ preserved |
| VR completed · AR not started, after submission | ✅ preserved |
| Faculty analytics per technology (`ar: 0 started`) | ✅ unchanged |
| Faculty review still recomputes the attempt and is visible to Faculty | ✅ passed 1 recorded |
| Question Bank · AI drafting · AI-assisted review · review navigator | ✅ untouched |
| 45 routes across five workspaces — runtime errors | **0** |
| 45 routes — blank pages | **0** |

---

## Safari UX / copy correction pass — Implementation 04

A manual Safari pass over the Faculty workspace. Everything below is presentation, copy or
transient state. **No** business rule, assessment granularity, entitlement rule, review
architecture or result-visibility policy was changed.

### Reaching these screens at all

The seed ships **zero** tenant access, faculty mappings, assignments, attempts and reviews, so
`#/faculty/:id/questions/draft` redirects to the Question Bank and the review queue is empty
until a fixture exists. Any spot check that skips this step is testing a redirect. The fixture
used here drives only the real state API, in the order the UI does:

```
reset → scenario A → selectionAdd(direct-shear, [vr, ar]) → submitRequest → approveRequest
  → mapFaculty(USR-001, soil-mechanics, direct-shear)
  → assignExperiment(student: USR-003, USR-004, USR-005)
  → requestSimulationAccess/simulatePackageReady/startSimulation/completeSimulation(USR-003, vr)
  → addQuestion(descriptive, 3 marks, with evaluation guidance) → addQuestionsToAssessment
  → startAttempt(USR-003) → saveAnswer(descriptive: "Shear") → submitAttempt
  → setFacultyReviewMode(USR-001, ASSISTED)
```

That reproduces the reviewed state exactly: Rahul Verma, one-word written answer, 3 max marks,
VR completed / AR not started.

### 17 · A hidden file input put a horizontal scrollbar on the whole page

**Reproduced**, *Draft questions with assistance* at 1440: `documentElement.scrollWidth` 1849 vs
`clientWidth` 1440 — **409px**. A DOM walk returned exactly one offender: `input#ai-file.sr-only`,
1440 × 48 at `left: 409.77`.

`css/screens.css` `.field input[type=file]{width:100%; … min-height:48px}` has specificity
(0,2,1); `.sr-only` has (0,1,0) and carried `!important` only on `position`. So the hidden control
kept a full-size box, absolutely positioned with no positioned ancestor — containing block the
viewport — and an absolutely-positioned box still contributes to the document's scrollable
overflow. `clip` suppresses paint, not layout.

**Corrected** by making the `.sr-only` geometry authoritative in `css/base.css`, the way its
`position` already was — `width`/`height` plus `min-`/`max-` (`height:1px` alone loses to
`min-height:48px`) and `padding`/`border`/`overflow`. **No `overflow-x:hidden` anywhere.**
Verified: the input computes 1 × 1 and `scrollWidth === clientWidth`.

Two latent traps closed while verifying: `fieldset.fgroup` keeps the UA
`min-inline-size:min-content` unless reset, and `.draftcard .dc-src` had no `overflow-wrap`.

### 18 · A hard refresh recreated the generated-suggestion panel

**Reproduced**: generate a suggestion, then reload — the panel returned, the `Generate` control
was gone, and the Suggestion section was owned by a tinted block nobody had asked for.

Root cause: `generateReviewAssistance` calls `save()`, so `rv.assistance` is in `localStorage`;
the screen rendered the panel on `if (rv.assistance)`. **The data revived the presentation.**

**Corrected** by separating the two. The record still persists — `finaliseReview` stamps
`accepted`, which is the completed review's audit trail — but the panel is gated on module-local
`suggestionView`, which starts empty on every page load.

| After a hard refresh, with a suggestion in storage | Result |
|---|:--:|
| Review Detail loads normally | ✅ |
| Suggestion panel auto-opened | ❌ none |
| `Generate suggestion` present and usable | ✅ |
| Any overlay / scrim | ❌ none |
| Focus stolen | ❌ no |
| Assistance record still persisted | ✅ |

### 19 · The suggestion panel read as diagnostic output

Raw tokeniser labels (`Not found`) and a 60-word implementation-facing paragraph were rendered as
product copy; read as text the badges and values ran together (*"AI-assisted suggestionFaculty
confirmation required"*, *"Suggested marks0 of 3"*).

**Corrected**: an in-page card — never an overlay — with the panel name as a heading rather than a
badge abutting a badge, `SUGGESTED MARKS 0.5 / 3`, the suggested feedback, and a short
`WHY THIS WAS SUGGESTED` list (label above value, so nothing runs together):

```
Why this was suggested
 · Answer length            1 word
 · Guidance points found    shear
 · Guidance points not found  strength, cohesion, friction, angle, normal, stress, failure

This is a starting point only. Review and change it before confirming.
[Use suggestion] [Dismiss]
```

The `ND-09` argument — that how a production auto-review scores is unspecified and has not been
invented — moved to `README.md` and this file. The **observations** stay on screen, so the reader
can still see what the figure came from. `js/ai-assist.js` carries a note that removing it from
the documentation would make its own accuracy claim false.

### 20 · Generated drafts rendered as a wall of simultaneous editors

Three drafts meant three complete forms open at once — every textarea, every option row, every
radio, two filled warning badges per card. Correct workflow, unreadable page.

**Corrected**: compact summaries with **exactly one open editor**.

| Behaviour | Result |
|---|:--:|
| 3 drafts render as 3 summaries, 0 editors | ✅ |
| Summary carries order · type · `AI-assisted draft · Review required` · question · marks · source | ✅ |
| MCQ summary adds option count and whether a key is set | ✅ `4 options · 1 mark · answer key selected` |
| Which option the key points at is **not** shown before review | ✅ never |
| `Review & edit` opens one and closes any other | ✅ 1 editor at all times |
| Edits survive switching drafts (text, marks, guidance, options, key) | ✅ |
| Discarding draft 0 while editing draft 1 keeps the same draft open | ✅ index follows |
| `Add to Question Bank` from a **collapsed** summary | ✅ bank 6 → 7, `origin: 'ai'` kept |
| The added question does **not** enter any assessment | ✅ still 6 questions |
| Invalid draft: editor opens, error summary + field error, focus on the control | ✅ |
| Discard removes only that draft | ✅ |
| Refresh: drafts gone by design, Question Bank persists | ✅ |
| External network requests | **0** |

Because only one editor exists, it reuses the manual question form's field ids, so
`state.validateQuestion` errors land on the right control through `ui.showErrors` unchanged.

### 21 · Copy corrections

| Screen | Was | Now |
|---|---|---|
| Tenant Admin · Faculty mapping, empty state | `institution&rsquo;s` printed literally (`ui.emptyState` **escapes** `body`) | real Unicode `’` |
| Tenant Admin · Faculty mapping | `NOT IN THIS SLICE — Faculty assessment and analytics … are a later slice` | removed; the card now says what mapping unlocks |
| Tenant Admin · person (Faculty) | `NEXT SLICE — Faculty workspace … arrive in a later slice` | states the Tenant Admin / Faculty boundary instead |
| Faculty · My Content | *"Student numbers are entitlement, not enrolment"* | *"Student counts reflect entitlement, not enrolment"* |
| Faculty · My Content + Assessment overview | `Technologies held` | `Available technologies` |
| Faculty · Reviews | *"evaluated by the faculty member who teaches the experiment"* | *"evaluated by the Faculty member mapped to the Experiment"* |
| Review Detail | `Your evaluation guidance` icon jammed against its label | proper micro-label treatment; the Student answer is set off with its own rule |
| `state.js` | comment claiming the Faculty review workspace was a later slice | corrected |

An audit of all 32 raw HTML entities in `js/` found exactly one in an escaped position. The other
31 are in raw-HTML arguments and are correct as written; the `&amp;` uses inside `data-label`
attributes would be actively wrong to change.

### Responsive — document-level horizontal overflow

`documentElement.scrollWidth − clientWidth`, measured on 11 surfaces at each width.

| Surface | 375 | 768 | 1280 | 1440 | 1728 |
|---|:--:|:--:|:--:|:--:|:--:|
| Draft — before generation | 0 | 0 | 0 | 0 | 0 |
| Draft — 3 generated drafts | 0 | 0 | 0 | 0 | 0 |
| Draft — editor open (MCQ) | 0 | 0 | 0 | 0 | 0 |
| Review Detail — assistance off | 0 | 0 | 0 | 0 | 0 |
| Review Detail — suggestion inline | 0 | 0 | 0 | 0 | 0 |
| Review Detail — completed | 0 | 0 | 0 | 0 | 0 |
| Tenant Faculty mapping | 0 | 0 | 0 | 0 | 0 |
| Faculty My Content | 0 | 0 | 0 | 0 | 0 |
| Faculty Question Bank | 0 | 0 | 0 | 0 | 0 |
| Faculty Student Progress | 0 | 0 | 0 | 0 | 0 |
| Faculty Student detail | 0 | 0 | 0 | 0 | 0 |

⚠ Measure with a real viewport. With the browser pane hidden, `clientWidth` reads 0 and every
screen appears to overflow.

### Accessibility — the redesigned surfaces

| Check | Result |
|---|:--:|
| Every draft action is a real `<button>` | ✅ 9 controls across 3 cards |
| No positive `tabindex` | ✅ |
| `aria-expanded` on every `Review & edit`, `aria-controls` when open | ✅ |
| Open state marked by accent **and** the word `EDITING` **and** the button label | ✅ not colour alone |
| `Review & edit` moves focus into the editor; closing returns it to the button | ✅ |
| Add-validation failure focuses the offending control, `aria-invalid` set | ✅ |
| Draft generation announced via the existing `aria-live="polite"` region, focus not stolen | ✅ |
| `Generate suggestion` / `Use suggestion` / `Dismiss` are real controls | ✅ |
| Generated suggestion announced; focus left where it was | ✅ |
| `Use suggestion` moves focus to the marks field it just filled | ✅ intended |
| Heading order on the draft screen | ✅ H1 → H2, no skips |

Not a WCAG conformance claim.

### Review workflow — end to end

| Step | Result |
|---|:--:|
| `Generate suggestion` → review still `pending`, attempt still `PENDING_FACULTY_REVIEW` | ✅ |
| `Use suggestion` → marks `0.5` and feedback filled | ✅ |
| …and nothing saved: `rv.marks === null` | ✅ |
| Faculty overwrites both values (`2`, own feedback) | ✅ |
| `Confirm review` → `completed`, marks **2** (not 0.5), Faculty feedback stored | ✅ |
| `Reviewed by: Dr. Arjun Mehta`, `Assistance: A suggestion was used as a starting point` | ✅ |
| Attempt re-scored and decided | ✅ `NOT_PASSED` |
| Completed review is read-only — no form, no suggestion editor, 0 inputs | ✅ |
| AI auto-finalisation | ❌ none possible |

### Regression

| Check | Result |
|---|:--:|
| Question Bank Add / Edit / Delete | ✅ 7 → 8 → edited → 7 |
| Assessment builder adds a bank question | ✅ 6 → 7, revision 1 → 2 |
| Student consumes the same Faculty-managed definition | ✅ 7 questions served, incl. the Faculty-added descriptive |
| Student descriptive submission → Pending Faculty review | ✅ `REV-003` pending |
| Faculty finalisation → Student result update | ✅ 38% with review |
| Result withheld (`CUSTOM_DATE`): score, %, pass/fail, correctness, Faculty feedback, *Try again* | ❌ none disclosed |
| Pass mark (60%) and attempt number still shown while withheld | ✅ rules, not results |
| VR completed / AR not started, unaffected by assessment activity | ✅ |
| Faculty analytics per technology | ✅ unchanged |
| Impl-02 Faculty mapping: map, unmap, empty state | ✅ 1 → 2 → 1 |
| Mapping boundary: unmapped Faculty sees no scope and no reviews | ✅ scope 0, queue 0 |
| Impl-02 Student assignment list and form | ✅ |
| Console errors across the pass | **0** |
| External network requests | **0** |

### Not changed, reported instead

While the result is withheld, the Student's *"your score above is final for the marked questions"*
sentence points at a score that is correctly not shown. It is pre-existing copy on a screen this
pass was scoped not to touch, and it discloses nothing. Flagged, not changed.
