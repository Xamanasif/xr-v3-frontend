# QA Checklist — Unified Functional Platform · Implementations 01 + 02

Run from `ui-ux/18-unified-functional-platform/` (see README for local run).
Every step below was executed against the final build in a Chromium-based browser
(runtime-verified; see the implementation report). Re-run on Safari for the review pass.

Sections **A**, **B** and **Cross-cutting** are the Implementation-01 suite, re-run in full
against the Implementation-02 build. Sections **C**-**H** are new.

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
