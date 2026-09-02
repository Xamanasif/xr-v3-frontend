# 18 — Unified Functional Platform · Implementations 01 + 02 + 03

**End-to-end B2B access, tenant operations, student entitlement and the student learning
experience** for the XR Simulation Learning Platform, built against the 31 Aug stakeholder
decisions.

One connected, functional prototype. Implementation 01 proved the *granting* half of the
chain; Implementation 02 completed the *receiving* half inside the institution; Implementation
03 carries that same derived entitlement into the Student's own workspace:

```
IMPLEMENTATION 01
PUBLIC CATALOGUE → PROGRAMME/DEPARTMENT BUNDLE → COURSE → EXPERIMENT
→ TECHNOLOGY SELECTION → SELECTION/CART → INSTITUTIONAL REQUEST
→ SUPER ADMIN APPROVAL → PAYMENT (external only) → TENANT ACCESS ACTIVATED
→ TENANT ADMIN SEES THE ACTIVATED CONTENT

IMPLEMENTATION 02
→ TENANT ADMIN PROVISIONS FACULTY + STUDENTS (manual · CSV bulk import)
→ STUDENT GROUPS → LOCAL ACADEMIC MAPPINGS → FACULTY MAPPING
→ EXPERIMENT ASSIGNED TO STUDENTS OR GROUPS (approved content only)
→ APPROVED LICENCE QUANTITY ENFORCED
→ STUDENT ENTITLEMENT EXISTS
→ WHO HAS ACCESS · HOW MANY LICENCES USED · HOW MANY REMAIN

IMPLEMENTATION 03
→ STUDENT WORKSPACE (the SAME derived entitlement, nothing else)
→ MY LEARNING → EXPERIMENT → LEARNING RESOURCES
→ TECHNOLOGY-SPECIFIC SIMULATION (only the granted variants)
→ ASSESSMENT → RESULT (per the Faculty visibility policy)
→ PROGRESS, EXPRESSED PER ASSIGNED TECHNOLOGY
```

### The invariant the two slices exist to prove

```
PUBLISHED   ≠   TENANT ACCESS   ≠   STUDENT ENTITLEMENT
                Super Admin          Tenant Admin
                allocates            assigns
```

Activating tenant access entitles **nobody**. Adding a student entitles them to **nothing**.
Putting a student in a group entitles them to **nothing**. Enrolling a student on a Course
entitles them to **nothing**. Only an assignment does — and only inside the approved set, and
only within the approved quantity.

Implementation 03 adds no second entitlement store. The Student workspace **consumes** the
Implementation-02 derivation through one shared selector,
`state.getEffectiveStudentEntitlements(studentId)`, and its read model
`state.studentExperiments(studentId)`. If the entitlement is not effective there, nothing in
the Student workspace can open.

| | |
|---|---|
| **Source of truth** | `ui-ux/00-project-context/STAKEHOLDER_CONFIRMED_UPDATE_2026-08-31.md` (STK31-01…48) · `ui-ux/17-stakeholder-correction-blueprint/` |
| **Reuse sources** | Batches 01–05 (`ui-ux/13-full-platform-design/`) as read-only reference implementations — design tokens, shell, component grammar ported once; nothing is runtime-imported from historical folders |
| **Technology** | Dependency-free HTML + CSS + vanilla JS (ES5-style), single-page hash routing. No framework, no build step, no backend, no real payment or authentication |
| **State** | `localStorage`, isolated namespace **`xrslp-unified-v1`** (no historical batch key is reused), **`schemaVersion: 4`**; Implementation-01, -02 and -03 state upgrade in place |
| **Theme** | Light only (logo constraint QX-07, carried forward) — with the Stage-0 a11y token fixes applied once (`--text-3:#5F6B7A`, `--control-border:#7E8A99`, `[hidden]` restored) |

## Run locally

Any static file server from this directory:

```
cd ui-ux/18-unified-functional-platform
python3 -m http.server 8123
```

then open <http://localhost:8123/>. Opening `index.html` directly via `file://` also works
(assets are local to this directory; the logo is a byte-identical copy of
`branding/bits-pilani-wilp-logo.png`, following the per-batch precedent for Safari `file://`).

## Implemented routes

**Public shell** (no sign-in — public discovery per STK31-16)

| Route | Screen |
|---|---|
| `#/` | Landing — what the platform is, how institutional access works |
| `#/catalogue` | Catalogue — search · Programme/Department filter · technology filters (derived from data) |
| `#/programme/:id` | Programme / Department bundle → its Course sub-bundles |
| `#/course/:id` | Course → its Experiments |
| `#/experiment/:id` | Experiment detail — description, Learning Outcomes, technologies + device requirements, preview placeholder, **explicit technology selection**, add to selection |
| `#/selection` | Selection basket — edit technologies, remove items, request summary. **Selection ≠ access** |
| `#/request` | Institutional request form — institution/SPOC, users/licences (>0, no cap), access term (Monthly/Quarterly/Yearly) |
| `#/requests` | Requests of the active requester scenario |
| `#/request-status/:id` | Applicant-visible status + history timeline |
| `#/payment/:id` | **External route only** — provider-neutral payment-required step; renders only in `APPROVED_PAYMENT_REQUIRED`, otherwise redirects to status. The internal route never contains this step (STK31-19) |

**Super Admin workspace**

| Route | Screen |
|---|---|
| `#/platform/requests` | Access request queue (state filter, live counts) |
| `#/platform/requests/:id` | Request detail — inspect everything, **Approve** with a consequence-explicit confirm dialog |
| `#/platform/institutions` | Tenants on the platform (read-only visibility) |

**Tenant workspace** (Institute Admin / Tenant Admin — one role, STK31-02)

Six navigation destinations, all implemented. There is no nav link that leads nowhere.

| Route | Screen | Slice |
|---|---|:--:|
| `#/tenant` | Resolves the active scenario's tenant (or an honest "no tenant workspace yet" state) | 01 |
| `#/tenant/:t/overview` | Faculty · Students · active Students · Groups · access records · approved licences · assigned · remaining · entitled, plus a **Needs attention** list of real states only | 02 |
| `#/tenant/:t/content-access` | Activated content + **Approved · Assigned · Remaining** per record, per-experiment entitled-student counts, term validity, granted-by | 01→02 |
| `#/tenant/:t/people` | Directory — All / Faculty / Students, search, status filter, provenance | 02 |
| `#/tenant/:t/people/add-faculty` | Manual Faculty creation (Name + Email required) | 02 |
| `#/tenant/:t/people/add-student` | Manual Student creation (Semester · Organisation · Plan terms all optional) | 02 |
| `#/tenant/:t/people/import` | **CSV bulk Student import** — upload → preview/validate → commit | 02 |
| `#/tenant/:t/person/:id` | Student detail (identity · academic mapping · groups · effective entitlements · deactivate/reactivate) or Faculty detail (mapped content) | 02 |
| `#/tenant/:t/groups` · `/groups/new` · `/group/:id` | Student groups, creation, rename, membership | 02 |
| `#/tenant/:t/mappings` | Academic mappings — local Course Code + **optional** Semester beside the canonical Course | 02 |
| `#/tenant/:t/assignments` · `/assignments/new` | Experiment assignment to Students or Groups, with live allocation consequence and removal | 02 |
| `#/tenant/:t/faculty-mapping` | Faculty → Course / Experiment inside approved access | 02 |

**Student workspace** (Student / Learner — ONE formal role, STK31-01)

Three navigation destinations, all implemented. There is no `Assessments`, `Certificates`,
`Messages`, `Profile` or `Support` entry, because none of them is built in this slice.

| Route | Screen |
|---|---|
| `#/learn` | Resolves the prototype's selected Student, or offers the **prototype-only** chooser over the real student records that exist |
| `#/learn/:s/home` | Name · institution · Programme · Course · counts that derive from real state · **Continue where you left off** when there is real work in progress |
| `#/learn/:s/my-learning` | **Available to you** (effective entitlement only) · **Not available at the moment** (assigned but blocked, with the reason) · **Earlier work** (assignment removed, record kept) |
| `#/learn/:s/progress` | Per experiment: resource count, one row **per assigned technology** (simulation · assessment · time spent · that technology's state), the roll-up, and the completion rule stated in plain words |
| `#/learn/:s/experiment/:e` | Student-facing Experiment: description, Learning Outcomes, the four-step sequence, Learning Resources, one simulation card per **entitled** technology, assessment entry, progress rail |
| `#/learn/:s/experiment/:e/simulation/:tech` | Device/runtime requirement, delivery model, the mechanism-neutral state ladder, clearly-labelled prototype actions, derived time spent |
| `#/learn/:s/experiment/:e/assessment` | Assessment introduction — the generated disclosure, including the answer-visibility policy. **No technology segment:** one assessment per Experiment |
| `#/learn/:s/experiment/:e/assessment/attempt` | The attempt — MCQ · True/False · written answer, live answered count, review panel, submit with a consequence dialog |
| `#/learn/:s/experiment/:e/assessment/result` | Score, outcome, and answers **only when the visibility policy releases them** |

Anything else → a useful not-found state. A technology, an experiment or a student the address
names but the entitlement does not support renders an explicit refusal with the reason.

## Request state machine

```
DRAFT (selection + form, persisted)
  → SUBMITTED
      → approve, internal / BITS Community ────────────────→ ACTIVE
      → approve, external / Subscription → APPROVED_PAYMENT_REQUIRED
                                              → simulate payment → ACTIVE
ACTIVE ⇒ tenant record (created for a new external institution,
         reused for the seeded internal one) + TenantContentAccess record
```

`PUBLISHED ≠ ENTITLED`: catalogue content, the selection, the request, and tenant access are
four separate records — and tenant access is still not student entitlement.

## State model

`localStorage` key **`xrslp-unified-v1`** (unchanged), with **`schemaVersion: 2`** inside the
stored object carrying the evolution.

| Collection | Record | Written by |
|---|---|---|
| `requests[]` | TenantRequest | applicant → Super Admin decides |
| `tenants[]` | Tenant | created on activation |
| `access[]` | **TenantContentAccess** — experiments, technologies, quantity, term | Super Admin (STK31-24) |
| `people[]` | **TenantUser** — Faculty + Student profiles, with `source` provenance (`seed`/`manual`/`csv`) | Tenant Admin |
| `groups[]` · `memberships[]` | **StudentGroup** · **GroupMembership** | Tenant Admin |
| `courseMappings[]` | **TenantCourseMapping** — local code + optional semester | Tenant Admin |
| `facultyMappings[]` | **FacultyAssignment** — Faculty → Course / Experiment | Tenant Admin |
| `assignments[]` | **ExperimentAssignment** — the only writer of entitlement | Tenant Admin (STK31-25) |
| `resourceActivity[]` | **ResourceActivity** — **Experiment-level**, one per Student × Experiment × resource | the Student |
| `simulationActivity[]` | **SimulationActivity** — **technology-level**: status, delivery state, started/completed, derived time spent | the Student |
| `attempts[]` | **AssessmentAttempt** — **Experiment-level**: answers, score, outcome, plus `sourceTechnology` as an observation | the Student |

**`StudentEntitlement` is derived, never stored** — as
`17_CONCEPTUAL_DATA_AND_STATE_MODEL.md` §4 requires (*"DERIVED LEARNER ELIGIBILITY ← never
stored"*). Deriving it is also the only way the multi-source rules stay correct: one effective
entitlement per Student × Experiment × access record, however many assignment sources feed it.
An entitlement is **effective** only when the student is active, the access record has not
expired, the student is inside that record's approved allocation, and at least one active
assignment reaches them. `StudentCourseMembership` is likewise a read model over the student's
own Programme + Course placement — the confirmed field set gives each student exactly one of each.

### Which records carry a technology, and why

**Only the simulation does.** `STK31-36` adds a technology axis to **progress**; the sources
scope it there and nowhere else, and the one place the corpus contemplates attaching an
assessment to a technology variant records the question as **unasked**:

> `17-stakeholder-correction-blueprint/05_CONTENT_HIERARCHY_METADATA_AND_BUNDLES.md` §5
> — *"| Assessment | Attached to the Experiment | ⚪ Attached to the Experiment or to a variant —
> **not asked, not assumed.** Folded into `ND-08` |"*

Building a separate assessment per technology would have been assuming exactly what that row
says must not be assumed. So:

**What a technology-facing label may say.** The **simulation** is the only technology-specific
learning activity, so every per-technology label — the chips on My Learning, the Progress table,
the roll-up sentence — reads that technology's **own simulation** and nothing else. Letting the
Experiment-level resources or assessment colour a per-technology label produced statements that
were untrue of the technology (*"AR in progress"* when the AR simulation had never been opened
and only the shared assessment had moved). The Experiment roll-up still uses the full derivation
and is shown on its own line, labelled as the prototype-derived rule that it is.

| Record | Level | Source |
|---|---|---|
| **ResourceActivity** | Experiment | `09_…` §3 rule 4 |
| **SimulationActivity** | **Technology** | `13_…` Part A `S13` — *"Gains a **technology identity** so progress can be attributed per technology"* |
| **AssessmentAttempt** | **Experiment** | `13_…` Part B — *"Faculty assigns assessments to **Experiments**"*; `B08`/`B09` are **KEEP** |
| **Progress** | **Technology + Experiment roll-up** | `STK31-36`; `17_…` record 26 — *"**Progress** gains a per-technology axis"* |

A Student sits **one assessment per Experiment**, however many technologies their institution
licensed — they are never asked to repeat it because two variants were granted. The attempt
records `sourceTechnology` (which simulation route led into it) as an observation; it creates no
second assessment identity. Full reasoning is at the head of `js/state.js`.

No API, endpoint, payload or schema is proposed by any of it (`STK31-35`).

### State migration

The namespace is unchanged at every version; `schemaVersion` inside the stored object carries
the evolution. Loading a state written by Implementation 01 (`version: 1`) or Implementation 02
(`schemaVersion: 2`) **upgrades it in place**: the new collections are created empty and no
request, tenant, access, person, group, mapping or assignment record is touched. Records written
by an earlier build are backfilled with the monotonic ordering stamps the allocation queue
needs; a migrated state is stamped with a `seededAt` at the moment this build first opens it, so
the assessment visibility offsets have a base. **Reset prototype data is the only action that
discards anything**; it restores the deterministic seed (2 Faculty, 6 Students, 2 Groups, 2
local mappings for the seeded internal tenant — and deliberately **no** access record, **no**
assignment and **no** learning activity, so a fresh reset still shows zero tenant access and
zero entitlement).

## Licence / user allocation

Each access record carries the approved quantity from its request (STK31-27 — no universal cap,
no sample caps). The prototype interprets that quantity as:

> the maximum number of **unique active Students** entitled through **one access record**.

- a Student counts **once** per access record, however many of its Experiments they receive;
- Experiment assignments are **never** counted as separate licences;
- an assignment that would take a record past its approved quantity is **refused whole** — a
  group is never partially applied;
- Faculty mapping does **not** consume the student allocation.

`Approved · Assigned · Remaining` are shown on Content access, Assignments and Overview, and
every figure derives from the approved request.

## CSV schema

Required: `Programme` · `Course Name` · `Course ID/Code` · `Student ID` · `Student Name` ·
`Email`.  Optional: `Semester` · `Organisation` · `Plan Terms`.

- **Semester is optional and never mandatory** (STK31-11). Organisation is optional (STK31-26).
  Plan Terms is optional because its mandatory status is unresolved (ND-03) — a blank value is
  valid and an unrecognised value is an attention row, not an import failure.
- Programme and Course resolve against the **canonical** catalogue only; an institution maps a
  local code onto a canonical Course and never invents a replacement (STK31-10).
- Parsing is a real RFC 4180-shaped state machine — quoted values, commas and newlines inside
  quotes, escaped `""`, and a stripped UTF-8 BOM. `.csv` only; `.xlsx` is **not** claimed.
- **Download CSV template** generates a real file from the same column contract.
- Error policy is **all-or-nothing**: if any row carries a blocking error, nothing is committed.
  The per-row report (row number · field · problem · valid/invalid counts) is produced either way.

## Judgement calls that need review

| # | Call | Why | If wrong |
|---|---|---|---|
| 1 | **Approved quantity = unique active Students per access record** | `STK31-27` confirms the quantity and forbids a universal cap, but names **no counting algorithm**. Counting entitled Students (not assignments) is the only reading in which "Assigned students / Remaining allocation" — the trio `STK31-27` itself lists — means anything | one function, `accessAllocation()` |
| 2 | **Faculty mapping does not consume the student allocation** | No source says a Faculty mapping takes a learner licence; `STK31-27` describes the quantity as *users/students* on the institutional request | `mapFaculty()` would join the same count |
| 3 | **A deactivated Student releases their licence** | Follows from (1): an inactive Student holds no effective entitlement, so counting them would reserve a licence nobody can use | same function as (1) |
| 4 | **Reactivation re-enters the allocation queue at the back** | `STK31-22` prefers reversible deactivation but says nothing about capacity on the way back. Re-stamping activation means reactivation can never displace a Student who is currently entitled, and can never push a record past its approved quantity. A reactivated Student beyond the quantity is shown as **Held — allocation full**, never silently entitled | ordering in `accessAllocation()` |
| 5 | **CSV commit is all-or-nothing** | `07_TENANT_ONBOARDING_AND_ADMIN_MODEL.md` §6.2 sketches *"commit only the rows that pass"*. All-or-nothing is the safer reading for a prototype: a half-imported cohort is a reconciliation problem, and `STK31-26` creates no schema to arbitrate. The per-row error report the source asks for is produced either way | `XRSLP.csv.commit()` |
| 6 | **A direct assignment onto an already-entitled Student is allowed** | It adds a second *source*, never a second entitlement, and is what keeps a Student entitled if they later leave the group. Both sources are shown; the licence count is untouched | `previewAssignment()` |
| 7 | **CSV/manual Programme + Course resolve against the whole canonical catalogue, not only approved content** | An institution provisions all its students regardless of which courses it has bought. Approved access constrains **assignment**, not provisioning | `XRSLP.csv.validate()` |
| 8 | **PROTOTYPE-DERIVED COMPLETION RULE — an Experiment is completed only when EVERY entitled technology is completed** | ⚠ **Not confirmed product policy.** `STK31-36` forbids three assigned technologies collapsing into one ambiguous state but names no roll-up formula. The conservative reading is the only one that cannot overstate. It is labelled as a prototype calculation on the Progress screen, and it affects **only** the Student-progress roll-up — never entitlement, allocation, licence consumption or access validity | `experimentProgress()` |
| 9 | **Learning resources do not gate the simulation, but are required for completion** | Neither Batch 01 nor Batch 02 gates the simulation on resources, and no source makes them a blocker — so they stay a recommended sequence. But PM-09 confirms Batch 02's derivation, which is a four-part rule (`resources + simulation + assessment pass`), so they are required for **completion**. An Experiment carrying **no** resources is never held short of completion by this — Batch 02's rule ANDs the flag unconditionally and only works because its one resource-free module is seeded complete; that fragility is not copied | `technologyProgress()` |
| 10 | **Marking a resource "done" is a Student action** | Batch 02 seeds `resourcesDone` and **never mutates it** — there is no control anywhere that sets it. The transition had to be designed, not ported. Opening a resource records *in progress*; an explicit checkbox records *done*, and un-checking returns it to *opened*, never to *never seen* | `openResource()` / `setResourceComplete()` |
| 11 | **Progress after an assignment is revoked is shown as “Earlier work”, not deleted** | `STK31-22` / `ND-15` prefer reversible mechanisms and nothing in the sources says learning history is destroyed when an assignment source is removed. Past work is kept, clearly separated from current access, and carries no launch control | `studentPastExperiments()` |
| 12 | **An assessment attempt is per EXPERIMENT, not per technology** | ✅ **Source-checked and settled.** No source states that an assessment is configured or attempted per technology variant; `13_…` Part B says *"Faculty assigns assessments to **Experiments**"* and marks `B08`/`B09` **KEEP**, and `05_…` §5 records the variant question as *"not asked, not assumed"*. `09_…` §3 rule 4 speaks of assessment **state** and carries its own hedge. A Student is never asked to repeat an assessment because two technologies were licensed. The attempt keeps `sourceTechnology` as an observation | `attemptsFor()` · `startAttempt()` |
| 13 | **The seeded assessments carry three different visibility policies** | `STK31-32` confirms the option set but names no default, and whether a platform default exists at all is open. Following Batch 02's precedent of deliberately opposite samples, three different values are seeded so none can be mistaken for a rule. The BITS/Taxila rule is not invented (`ND-10`) | `data.ASSESSMENTS` |

## The Student learning model

### Technology-specific access

A Student sees **only the technology variants present in their effective entitlement** — never
the Experiment's catalogue availability. Direct Shear Test exists in AR, VR and Web in the
catalogue; a Student entitled to VR + AR sees **VR and AR, and no Web**. The same gate is
applied by the state writers, not only by the UI, so hand-editing the address to a technology
that was never granted produces an explicit refusal rather than an authorised launch state.

### Delivery model

`STK31-37`'s distinction is preserved and the **mechanism is not selected** (PM-05, `QT-01`
remains open by instruction):

| | Delivery | Student surface |
|---|---|---|
| **AR · VR · MR** | authorised, downloadable package | *Request access on my device* → *availability pending* → *ready on device* → open → completion recorded, plus real launch instructions that name no mechanism |
| **Web** | hosted experience, opened from the platform | available immediately, no device authorisation step |

Nothing is downloaded, installed, hosted or launched, and **no external URL is invented**. The
prototype stand-ins are labelled as stand-ins everywhere they appear. Batch 01's XR access
vocabulary is preserved; only the states a real prototype action can honestly produce are
modelled — *delivery failed* and *availability unknown* exist in the model but nothing here can
produce them, so no control claims to.

Device compatibility is **described, not certified**: no vendor, headset, handset or browser
build is claimed as supported.

### Assessment

A small set of seeded assessments exists purely so the progression can be demonstrated; the
Faculty Assessment Builder is a later slice. **Every value in them is sample configuration, not
a platform rule.** Three assessments carry three deliberately different answer/explanation
visibility policies (`STK31-32`) so no single value reads as a default:

| Assessment | Experiment | Policy | Contains |
|---|---|---|---|
| `ASM-001` | Direct Shear Test | **Show immediately** | 3 MCQ + 2 True/False |
| `ASM-002` | Consolidation Test | **Show after the assessment deadline** (seed + 14 days) | 2 MCQ + 1 True/False + **1 written answer** |
| `ASM-003` | Total Station Experiment | **Show on a set date** (seed + 21 days) | 2 MCQ + 1 True/False |

Beam Deflection, Torsion and Bernoulli carry **no** assessment — assessment is optional
(FRD 3.1.2) and a Student must be able to complete an Experiment without one.

- The BITS/Taxila timing rule is **not invented** (`ND-10`): there is no fourth mode.
- `D-25` is untouched — no correct answer and no explanation is rendered during an attempt,
  whatever the policy says about the result.
- A written answer is **never machine-graded**. It enters **Pending Faculty review**; the marked
  questions are scored immediately, and the Experiment never completes while that review is
  outstanding. `STK31-31` settles the owner — *"FACULTY is the ONLY human role responsible for
  descriptive-answer evaluation"* — so the Student-facing label names Faculty review rather than
  an anonymous evaluator. The **Faculty review workspace is not built in this slice**, and
  nothing here grades a written answer, auto-reviews it, or states a turnaround.
- Recording is unconditional and `attemptLimit` gates only *starting* a new attempt (Batch 02's
  FRD 11.2.1/11.2.2 rule, preserved). Submission is idempotent by construction: only an
  in-progress attempt can be submitted, so a double click, a resubmitted form and a refreshed
  page all produce exactly one result. Answers persist on every change, so a refresh mid-attempt
  loses nothing.

### Progress

Derived, never stored, and **per technology** (`STK31-36` over PM-09's confirmed Batch 02
derivation). Resources and the assessment are Experiment-level, so their state appears against
every technology row; only the **simulation** differs by technology.

```
steps total = resources + technologies (one simulation each) + 1 assessment where one is set
steps done  = resources marked done
            + technologies whose simulation is complete
            + 1 if the experiment's assessment is passed
percentage  = done ÷ total
```

The assessment counts **once**, not once per technology. A result pending Faculty review
contributes nothing, which keeps *never complete while a result is pending* true of the number
as well as of the label — and a technology whose own simulation is still outstanding is never
labelled *Pending Faculty review*, because that would hide real outstanding work behind a shared
pending result. The roll-up always states **which technologies it covers**; an Experiment
assigned in one technology renders without the extra dimension.

> ### ⚠ PROTOTYPE-DERIVED COMPLETION RULE — not confirmed product policy
>
> **"An Experiment is Completed only when every entitled technology is Completed" is this
> prototype's roll-up calculation, not a stakeholder-confirmed requirement.** No source states a
> completion formula; `STK31-36` requires only that several assigned technologies must not
> collapse into one ambiguous state, and the conservative reading was chosen because it cannot
> overstate. It is presented to the Student as such on the Progress screen.
>
> It affects **nothing but the Student-progress roll-up**. It does not touch entitlement, tenant
> allocation, licence consumption or access validity — those derive from assignments, person
> status, the access term and the approved quantity, and read no progress record at all.

### Assessment feedback presentation

The result screen is **content first, status second**. A question card sits on the normal
surface; correctness is carried by a compact badge, a thin left accent and a coloured answer
label — never by filling the card, which read as a QA diff rather than as feedback. An incorrect
question shows *Your answer* then *Correct answer* then a neutral **Why** block; a correct
question shows its answer **once**, because repeating the same sentence under *Correct answer*
is noise. Correctness is never carried by colour alone — every state pairs an icon with a word.

During an attempt the chosen option is marked with weight, a stronger border and a neutral tint
only. **No success or error colour appears on the attempt screen**, because before submission the
platform has told the Student nothing about correctness and the selected state must not imply a
verdict that does not exist yet.

The attempt ends in a **compact review navigator**, not a list of repeated status cards: a live
answer count, one small button per question carrying its number and an answered/not-answered
mark, the outstanding question numbers, **Go to next unanswered**, and the primary Submit. Its
two states are only *answered* and *not answered* — pre-submission, so the answered mark uses the
neutral action accent rather than a success colour. Every chip's accessible name carries its
status (*"Question 3 — not answered"*), so the mark is never the only way to know.

**An incomplete assessment can be submitted, after an explicit warning.** No source makes every
question mandatory, so the prototype does not encode that as a rule: the Submit control stays
enabled, and the copy beside it says *"You can submit now, but unanswered questions will receive
no marks."* Submitting with questions outstanding opens a confirmation that counts them, **names
which numbers are outstanding**, and states the consequence, with **Continue reviewing** and
**Submit anyway**. The wording matches what scoring actually does — an unanswered question earns
nothing and still counts in the total; it is never called incorrect, and there is no negative
marking. When every question is answered the same control uses the ordinary confirmation with no
warning. `state.submitAttempt()` is unchanged.

## Prototype-only controls

The dark **“PROTOTYPE CONTROLS — NOT PRODUCT UI”** strip at the top is not product UX:

- **View switch** — Public · Super Admin · Tenant Admin · **Student** (no real authentication in
  this slice)
- **Viewing as student** — shown only inside the Student workspace. It selects one **real**
  `TenantUser` record created through Implementation 02; it is not a sign-in, not an account
  switcher, and it grants nothing. What the chosen Student can see still comes only from what
  has been assigned to them. `#/learn` offers the same choice as a full screen, labelled
  **PROTOTYPE ONLY**
- **Requester scenario** — seeds the requester identity and access context:
  - **A — Internal (WILP-type)** · *Sample Engineering Institute* · context **BITS Community** · `paymentRequired: false`
  - **B — External** · *Northfield Institute of Technology* · context **Subscription** · `paymentRequired: true`
  - The internal/external classification exists **only in prototype seed data** (the production
    eligibility rule is `ND-07`, not confirmed and not invented; an anonymous visitor cannot
    self-select a free route)
- **Reset prototype data** — restores the deterministic seed state

## Two primary QA scenarios

See `QA_CHECKLIST.md`. In short: Scenario A (internal) approves straight to **Active** with no
payment step anywhere on the route; Scenario B (external) gates activation behind the
payment-required state and a clearly-labelled payment simulation.

## Intentionally NOT implemented in this slice

- Authentication / SSO / registration (scenario switcher stands in; architecture unchanged)
- Content production chain (Vendor → Academic Reviewer → Content Manager → Published) —
  **required for the complete current B2B delivery**, integrated in a later slice; this slice
  runs on seeded published content only to exercise the access journey
- **Faculty workspace** — assessment authoring and the Assessment Builder, the **Faculty review
  queue** for written answers, auto-review assistance, Faculty analytics. Implementations 02 and
  03 build only the Tenant Admin *mapping* side and the Student side; a written answer therefore
  stays **Pending Faculty review**, which is the honest state while no review surface exists
- **Assessment timer** — Batch 02's timer (which prompts and never auto-submits) is not rebuilt;
  `Q-43` flags it for re-confirmation once a server exists, and exam security is out of scope here
- **Device binding and device-replacement requests** (`U-LRN-10` / `U-LRN-11`) — no device
  registry exists anywhere in the platform, and the Student end of that half-built workflow is a
  later device-operations slice. Nothing about it is faked in the Student UI
- **Certificates and certification** — Phase 2 (PM-12). No certificate surface, artefact or
  language exists anywhere in this build

## Known limitations

- **Loading a state written by a NEWER build falls back to the seed, and the next write replaces
  it.** Pre-existing Implementation-01 behaviour, documented in `state.js`. It only triggers when
  moving backwards between builds; forward migration (1 → 3, 2 → 3) is additive and destroys
  nothing.
- **A written answer stays `Pending Faculty review` in this slice**, because Faculty are the
  confirmed reviewer (`STK31-31`) and the Faculty review workspace is a later build item. That is
  the honest state, not a stall: an Experiment assessed only by marked questions completes
  normally, and one with no assessment completes on resources and simulation alone. Nothing here
  grades a written answer, auto-reviews it, or promises a turnaround.
- **No assessment timer.** Batch 02's timer prompts and never auto-submits; `Q-43` flags it for
  re-confirmation once a server exists, so it is not rebuilt here.
- **Time spent is the interval between opening and completing in this browser.** In the product
  the experiment itself reports it, carrying a technology identifier (`STK31-35`).
- Tenant SSO / ERP configuration, Records-needing-attention as a screen, tenant reporting
- ERP as a person-provisioning route (the `source` provenance field is left open for it)
- Super Admin tenant governance beyond request approval (creation outside a request,
  Tenant Admin assignment, deactivation, institution report, Super Admin student override —
  the data model supports it, the surface is later), version Release/Hold, support
- Rejection / request-more-information decision outcomes (not source-supported for this slice)
- Prices, payment provider, renewal mechanics, notification channels (the required 15-day
  expiry reminder's **channel** is `ND-16`; the derived `Active / Expiring soon / Expired`
  display state is implemented as recommended supporting UX)
- B2C purchasing journey (deferred, preserved in Batch 04)

## File map

```
index.html                 entry point (classic scripts — works from file://)
assets/                    byte-identical logo copy (protected asset, never edited)
qa/                        sample CSV fixtures for the bulk-import checks
css/  tokens → base → layout → components → screens → responsive
js/   utils · data (sample pool + scenarios + seeded tenant people)
      · state (records, state machine, allocation, derived entitlement)
      · csv (parser + validation + template) · components · router · app
js/screens/  public-catalogue · public-request · platform
             · tenant (helpers · overview · content access)
             · tenant-people (directory · manual add · CSV import · person detail)
             · tenant-groups (groups · membership · academic mappings)
             · tenant-assign (assignments · faculty mapping)
             · student (helpers · prototype chooser · home · my learning · progress)
             · student-learn (experiment · simulation · assessment · attempt · result)
```
