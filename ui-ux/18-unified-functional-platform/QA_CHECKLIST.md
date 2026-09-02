# QA Checklist — Unified Functional Platform · Implementations 01 + 02 + 03

Run from `ui-ux/18-unified-functional-platform/` (see README for local run).
Every step below was executed against the final build in a Chromium-based browser
(runtime-verified; see the implementation report). Re-run on Safari for the review pass.

Sections **A**, **B** and **Cross-cutting** are the Implementation-01 suite; **C**–**H** are
Implementation 02. Both were re-run in full against the Implementation-03 build. Sections
**J**–**P** are new.

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
