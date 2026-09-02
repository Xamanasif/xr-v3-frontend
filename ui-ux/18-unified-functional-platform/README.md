# 18 — Unified Functional Platform · Implementations 01 + 02 + 03 + 04

**End-to-end B2B access, tenant operations, student entitlement, the student learning
experience and the Faculty workspace that authors and evaluates it** for the XR Simulation
Learning Platform, built against the 31 Aug stakeholder decisions.

One connected, functional prototype. Implementation 01 proved the *granting* half of the
chain; Implementation 02 completed the *receiving* half inside the institution; Implementation
03 carried that same derived entitlement into the Student's own workspace; Implementation 04
puts the Faculty member behind the assessment the Student sits and the written answer the
Student submits:

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

IMPLEMENTATION 04
→ TENANT ADMIN MAPS FACULTY → FACULTY CONTENT BOUNDARY (derived)
→ FACULTY QUESTION BANK (add · edit · DELETE · assisted drafts)
→ FACULTY CONFIGURES THE EXPERIMENT'S ASSESSMENT
   (questions · pass mark · attempts · deadline · answer-visibility policy)
→ THE STUDENT SITS THAT SAME DEFINITION
→ WRITTEN ANSWER → PENDING FACULTY REVIEW
→ FACULTY EVALUATES (optionally with a local suggestion, never auto-final)
→ RESULT RECOMPUTED → RELEASED BY THE CONFIGURED POLICY
→ FACULTY STUDENT PROGRESS + OPERATIONAL ANALYTICS
```

### The invariant the slices exist to prove

```
PUBLISHED   ≠   TENANT ACCESS   ≠   STUDENT ENTITLEMENT
                Super Admin          Tenant Admin
                allocates            assigns
```

Implementation 04 adds a second altitude that must not collapse into the first:

```
FACULTY MAPPING          ≠   STUDENT ENTITLEMENT
which content a Faculty      which content a Student
member manages               may open
```

A Faculty member manages an Experiment's assessment because of a **FacultyAssignment**.
A Student appears in that Experiment's reach only through **effective entitlement** — never
through Course membership, Group membership, or "students at this institution".

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

**Faculty workspace** (Faculty — a formal role inside a Tenant, STK31-01 / STK31-04)

Six navigation destinations, all implemented. There is no `Messages`, `Attendance`,
`Certificates`, `Calendar`, `Profile` or `Support` entry, because none of them is built.

| Route | Screen |
|---|---|
| `#/faculty` | Resolves the prototype's selected Faculty member, or offers the **prototype-only** chooser over the real Faculty records that exist |
| `#/faculty/:f/overview` | Mapped Courses · mapped Experiments · Students reached · responses to review, a **Needs your attention** list of real states only, and a per-experiment roll-up |
| `#/faculty/:f/content` | The mapping boundary made visible — Course, Experiment, **technologies the Tenant holds**, entitled-student count, assessment status, progress summary. Mappings whose access record is no longer usable are listed separately, with the reason |
| `#/faculty/:f/assessments` | One assessment per mapped Experiment — questions, marks, derived status, students reached, submitted attempts, last updated |
| `#/faculty/:f/assessment/:e` | Assessment overview — configuration, who it reaches (local Course code + **optional** Semester), the completeness rail, the question list in order |
| `#/faculty/:f/assessment/:e/questions` | The builder — add from the Question Bank, remove from **this assessment**, reorder, take a Question Bank update |
| `#/faculty/:f/assessment/:e/settings` | Name · introduction · pass mark · attempts · **deadline** · **answer/explanation visibility policy**. Also the create form |
| `#/faculty/:f/assessment/:e/preview` | **What the student sees** (rendered through the Student's own renderer, no answer key) and an explicitly-labelled **Authoring view** that shows the key. No attempt is created |
| `#/faculty/:f/questions` | Question Bank — search, type filter, experiment filter, **Add · Edit · Delete** |
| `#/faculty/:f/questions/new` · `/question/:q` | Question editor — MCQ · True/False · Descriptive, one form for create and edit |
| `#/faculty/:f/questions/draft` | **Assisted drafting** — prompt + optional source material (pasted or opened from a local text file), type and count, drafts to review, edit and explicitly add |
| `#/faculty/:f/reviews` | Descriptive review queue — Experiment and state filters, and the review-assistance preference |
| `#/faculty/:f/review/:r` | One written answer — the question, the evaluation guidance, the answer, the optional suggestion, and the marking decision |
| `#/faculty/:f/students` | Student Progress — one row per Student × Experiment, with search and filters, plus operational analytics and per-technology simulation figures |
| `#/faculty/:f/student/:s/:e` | One Student on one Experiment — assessment, written answers, resources, per-technology simulations, overall |

Anything else → a useful not-found state. A technology, an experiment or a student the address
names but the entitlement does not support renders an explicit refusal with the reason. A
Faculty member who hand-edits the address to an Experiment or a review outside their mapping
gets the same treatment.

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

`localStorage` key **`xrslp-unified-v1`** (unchanged since Implementation 01), with
**`schemaVersion: 5`** inside the stored object carrying the evolution. No second namespace
exists.

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
| `attempts[]` | **AssessmentAttempt** — **Experiment-level**: answers, score, outcome, `sourceTechnology` as an observation, and the **snapshot** of the questions it was taken against | the Student |
| `questions[]` | **QuestionBankItem** — tenant-scoped: type, text, options, answer key, marks, explanation, evaluation guidance, `origin` (`seed`/`manual`/`ai`), `revision` | **Faculty** (STK31-34) |
| `assessmentDefs[]` | **AssessmentDefinition** — one per Tenant × Experiment: title, introduction, pass mark, attempt limit, deadline, visibility policy, its own **copies** of the questions, `revision` | **Faculty** (STK31-30) |
| `reviews[]` | **DescriptiveReview** — one per attempt × written question: max marks, marks, feedback, who reviewed it, and any suggestion that was generated | **Faculty** (STK31-31) |
| `facultyPrefs` | A Faculty workflow preference (`manual` / `assisted` review). **Not a role** | Faculty |

**`FacultyContent` is derived, never stored** — `state.facultyScope()` reads the
Implementation-02 `facultyMappings[]` and nothing else. There is no second Faculty mapping
store. An Experiment-level mapping carries that Experiment; a Course-level mapping carries every
Experiment the Tenant actually holds under that access record for that Course — never the whole
canonical Course, and never the whole Tenant. A mapping whose access record is expired, empty or
out of quantity stops carrying content and is reported with its reason rather than vanishing.

**`FacultyStudentReach` is derived, never stored** — `state.facultyStudentReach()` is
`entitledStudentsFor()` over the mapping's access records. Course membership, Group membership
and Tenant access grant nothing here (brief §9 / §36).

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

### The assessment definition — where it moved, and why

Implementation 03 read its assessment configuration from a static array in `js/data.js`. Faculty
own that configuration (`STK31-30`), so it cannot live in a read-only file any more. Schema 5
**evolves it into mutable unified state**:

```
data.ASSESSMENTS  ──seed / migrate──▶  assessmentDefs[]   (Faculty edit these)
                  ──seed / migrate──▶  questions[]        (the Question Bank)
```

After that, `data.ASSESSMENTS` is a **seed source only** — nothing reads it at runtime. The
Faculty workspace and the Student workspace both read `assessmentDefs`, so there is exactly one
assessment definition and the two roles cannot drift apart. The seeded Direct Shear Test sample
assessment is **not** replaced by disconnected Faculty data: it becomes `ADEF-001`, editable, and
its five questions become the first five Question Bank items.

### Historical integrity — what is frozen and what is live

At the moment an attempt starts, it takes a **snapshot** of the questions, options, answer key,
marks and pass mark it is being taken against. That snapshot is what the result screen renders.

| Value | Read from | Why |
|---|---|---|
| Questions, options, **answer key**, per-question marks | the attempt **snapshot** | they decided a result that has already been given |
| Pass mark | the attempt **snapshot** | re-deciding a stored outcome would be a regrade, and no source asks for one |
| **Answer/explanation visibility policy** | the **live** definition | §19 requires the Faculty control to drive the same Student result engine; a policy change that could not reach an existing result would not be that control |
| Attempt limit (as a gate on starting) | the **live** definition | it is a decision about what happens next |

So a Faculty member can reword a question, change its marks, or delete it from the Question Bank,
and every submitted attempt keeps exactly what the Student answered. This is verified in
`QA_CHECKLIST.md` (**T — Question Bank Delete safety**).

### State migration

The namespace is unchanged at every version; `schemaVersion` inside the stored object carries
the evolution. Loading a state written by Implementation 01 (`version: 1`), 02
(`schemaVersion: 2`), 03 (`3`) or the interim `4` **upgrades it in place**: the new collections
are created empty and no request, tenant, access, person, group, mapping, assignment, resource,
simulation or attempt record is touched. Records written by an earlier build are backfilled with
the monotonic ordering stamps the allocation queue needs; a migrated state is stamped with a
`seededAt` at the moment this build first opens it, so the assessment visibility offsets have a
base.

**Schema 4 → 5** is additive in four steps, in this order:

1. the seeded internal tenant receives the sample assessment configuration it always had — now as
   editable `assessmentDefs[]` plus the `questions[]` they came from;
2. any **other** tenant whose Students already attempted a sample assessment also receives a live
   definition for it, so an existing attempt never lands on *"no assessment is set"*;
3. every attempt gains the `snapshot` it would have taken at start, built from the sample
   configuration it was actually taken against, and is re-pointed at the tenant's live definition
   id (the snapshot, not the definition, is what renders);
4. every submitted attempt containing a written answer gains the **pending review** record its
   *"Pending Faculty review"* status always implied — so the promise Implementation 03 made now
   has a real queue behind it.

**Reset prototype data is the only action that discards anything**; it restores the deterministic
seed (2 Faculty, 6 Students, 2 Groups, 2 local mappings, **12 Question Bank items and 3 assessment
definitions** for the seeded internal tenant — and deliberately **no** access record, **no**
assignment and **no** learning activity, so a fresh reset still shows zero tenant access and zero
entitlement).

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
| 14 | **Assessment definitions are TENANT-scoped, and a tenant with none simply has none** | `STK31-30` makes Faculty the owner of assessment configuration, and Faculty exist inside a Tenant. A definition is therefore keyed by Tenant × Experiment. A Tenant whose Faculty have not authored one gets the honest empty state — assessment is optional (FRD 3.1.2), and the brief forbids inventing a requirement that every Experiment must have one. There is **no** fallback to the seeded sample for a tenant that has none, because a Faculty member should never see configuration nobody at their institution wrote | `assessmentForTenant()` |
| 15 | **A structural edit to an assessment that already has submitted attempts creates a REVISION; a settings edit does not** | Brief §39 asks for a safe policy and forbids building the Super Admin version-release system here. Adding, removing, reordering or refreshing a question changes what a *future* attempt answers, so the revision number advances and the change applies from then on. Every submitted attempt keeps its snapshot, so nothing is invalidated and no version-management UI is needed. Settings (name, pass mark, attempts, deadline, policy) do not advance the revision because they change no question | `bumpRevision()` |
| 16 | **The pass mark is historical; the visibility policy is live** | Split deliberately. Re-deciding a stored outcome because Faculty later moved the pass mark would rewrite a Student's history, and no source asks for a regrade. But §19 requires the Faculty visibility control to drive the *same* Student result engine, so the policy is read live — change it and an existing result follows. Verified: changing the policy re-withholds an already-visible result | `releaseFor()` · `snapshotOfDefinition()` |
| 17 | **A completed descriptive review is READ-ONLY** | Whether a Faculty member may revise a finalised descriptive mark, and who would authorise it, is not established in any source. Rather than invent a re-grading workflow, a confirmed review cannot be reopened, and the screen says so as a named prototype limitation rather than hiding the control | `finaliseReview()` |
| 18 | **Question Bank `Delete` is a state change, not a destruction** | `STK31-34` requires the user-facing action to be **`Delete`** and forbids relabelling it; `STK31-22` / `ND-15` govern the *mechanism* and forbid inventing a permanent destructive operation. So the button says Delete, the item leaves the active bank completely, and nothing surfaces it again — no archive, no bin, no restore. Underneath it is a status change, which is what lets an assessment that already contains a copy, and every attempt that already answered it, survive untouched | `deleteQuestion()` |
| 19 | **An assessment holds COPIES of its questions, not references** | It is the only way *"Delete from the Question Bank"* and *"Remove from this assessment"* can be genuinely different actions (brief §17), and the only way a bank edit cannot silently rewrite a live assessment (`ND-15`). The copy keeps a link back, so the builder can say *"this has been changed in the Question Bank"* and offer to take the update — applied by a decision, never as a side effect | `copyBankQuestion()` · `assessmentQuestionLink()` |
| 20 | **Batch 02's third builder tab, `Assign`, is realised as read-only `Reach`** | `13_…` marks the three-part builder **KEEP**, but in the unified model the assessment is created *for* an Experiment and who may take it derives from the Tenant Admin's assignment (`STK31-25`). A Faculty-side assign control would take an authority the source gives to another role. The region therefore shows the reach the assessment actually has, with the local Course code and the **optional** Semester that `U-FAC-05` asks for, and offers no control that would create eligibility | Assessment overview, *Who this assessment reaches* |
| 21 | **The Faculty analytics counts are row counts of the list beneath them, not KPIs** | `STK31-29` / PM-11 prohibit invented dashboards, indexes, scores, ranks, predictions and attendance; `U-FAC-11` prohibits a KPI dashboard outright. Every figure shown is a count over the rows displayed directly below it, states what it counts, and moves with the filters. There is no gauge, no trend, no composite and no metric without a record behind it | `facultyExperimentStats()` · `facultyOverview()` |
| 22 | **A post-review final result is released by the same visibility policy as the answers** | Brief §30 asks for exactly this. It creates a deliberate asymmetry with an objective-only attempt, which keeps Implementation 03's behaviour (score and outcome shown at submission, answers gated). The reason is that only the reviewed case has a *post-review* result for the policy to govern; the objective sub-score is never withheld, because it existed at submission and Implementation 03 already showed it under every policy | `studentResult` — `finalWithheld` |
| 23 | **The withholding in (22) reaches the progress roll-up too, via an explicit STUDENT VIEW of the derivation** | The roll-up counts the assessment step only when the outcome is `PASSED`, so with every other activity finished, *"Completed / 100%"* meant passed and *"In progress / 86%"* meant not passed — the withheld outcome, readable straight off the Progress screen. `experimentProgress()` and `technologyProgress()` therefore take an `opts.studentView` flag: under it, `resultWithheld()` makes the assessment step **undecided**, so a passing and a failing Student produce identical status, percentage, steps and Home counts until the policy releases. Student screens pass the flag; **the Faculty workspace and the analytics do not**, and keep the true outcome | `state.resultWithheld()` · `opts.studentView` |
| 24 | **“Automatically marked” is not “released” — the objective sub-score is withheld too** | An objective assessment is scored the instant it is submitted, but under `AFTER_DEADLINE` or `CUSTOM_DATE` that score is a withheld result like any other: a figure that already puts the pass mark out of reach *is* the outcome, disclosed early by another name. So while `state.scoreWithheld()` holds, no figure of any kind reaches a Student surface — not the combined score, not the objective sub-score. Implementation 03's behaviour is unchanged under `SHOW_IMMEDIATELY`, which is every assessment that does not delay | `state.scoreWithheld()` |
| 25 | **Retry availability is an outcome channel, so it waits for release** | “Try again” appears only for a `NOT_PASSED` attempt. Offering it — or withdrawing it — while the result is withheld would announce the result the rest of the screen is holding back. While `scoreWithheld` holds, no retry control is offered to anyone, and no attempts-left sentence is printed. **The attempt-limit configuration is untouched**; the control simply waits for release like everything else | `studentResult` — `canRetry` |

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

| Seeded as | Experiment | Policy | Contains |
|---|---|---|---|
| `ADEF-001` | Direct Shear Test | **Show immediately** | 3 MCQ + 2 True/False |
| `ADEF-002` | Consolidation Test | **Show after the assessment deadline** (seed + 14 days) | 2 MCQ + 1 True/False + **1 written answer** |
| `ADEF-003` | Total Station Experiment | **Show on a set date** (seed + 21 days) | 2 MCQ + 1 True/False |

Since Implementation 04 these are **Faculty-editable definitions in state**, seeded from
`data.ASSESSMENTS`, and their questions are also the first 12 Question Bank items. See
*The assessment definition — where it moved, and why*.

Beam Deflection, Torsion and Bernoulli carry **no** assessment — assessment is optional
(FRD 3.1.2) and a Student must be able to complete an Experiment without one.

- The BITS/Taxila timing rule is **not invented** (`ND-10`): there is no fourth mode.
- `D-25` is untouched — no correct answer and no explanation is rendered during an attempt,
  whatever the policy says about the result.
- A written answer is **never machine-graded**. It enters **Pending Faculty review**; the marked
  questions are scored immediately, and the Experiment never completes while that review is
  outstanding. `STK31-31` settles the owner — *"FACULTY is the ONLY human role responsible for
  descriptive-answer evaluation"* — so the Student-facing label names Faculty review rather than
  an anonymous evaluator. **Implementation 04 builds the Faculty side of that state**: the
  submission creates a real review obligation, a Faculty member evaluates it, and the result is
  recomputed and released by the configured policy. See *The Faculty model*.

> ### One `D-25` reading to confirm — carried forward from Implementation 03, unchanged
> After the visibility policy releases a result, the Student result screen shows, for a question
> answered **incorrectly**, both *Your answer* and *Correct answer*, plus the explanation.
> `STK31-32` confirms that explanations become visible after an attempt, and `08_…` §4 describes
> the model as *"per-question-correctness-without-the-key"*. Whether showing the correct option
> **after** release is inside that description or outside it is a reading, not a settled rule.
> This build does **not** change the behaviour — it shipped in Implementation 03 and §42 of the
> Implementation-04 brief forbids regressing it — but it is named here so the question can be put
> to the stakeholder rather than left implicit. `D-25` is unambiguous and fully honoured
> **during** an attempt: no key and no explanation is rendered there under any policy.
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

## The Faculty model

### The content boundary

Everything a Faculty member reaches is derived from the Implementation-02 `facultyMappings[]` and
nothing else — there is no second Faculty mapping store, and no path by which tenant-held content
reaches a Faculty member without a mapping. A Faculty member with no mapping gets a useful empty
state, not an empty page; a Faculty member who hand-edits the hash to an Experiment or a review
outside their mapping gets an explicit refusal with the reason.

Faculty **cannot** publish or release content (`STK31-06` / `STK31-07`), **cannot** add a
technology the Tenant was not granted (`STK31-24`), and **cannot** change a licence quantity or a
student assignment (`STK31-25`). No control offers to, and the workspace says so in one place
rather than leaving the absence unexplained.

### Question Bank — Add · Edit · **Delete**

`STK31-34` names all three, and **`Delete` is the requirement**: it is not relabelled `Retire`,
`Archive` or `Deactivate`. `STK31-22` governs the *mechanism*, not the label, so:

```
Delete → a confirmation that states the actual consequences
       → the question leaves the ACTIVE Question Bank
       → an assessment that already contains it keeps its copy and keeps working
       → every submitted attempt and its result stay exactly as they are
```

The confirmation names the assessments the question is used in and the number of submitted
attempts that already contain it, so the consequence is stated before the action, not discovered
after it. Underneath, deletion is a status change — which is what makes the two guarantees above
possible — and nothing surfaces the deleted item again: no archive, no bin, no restore.

**`Remove from this assessment` is a different action, in a different place.** It takes a question
out of one assessment and leaves it in the bank. Both screens say so.

### Assisted question drafting

`STK31-33` requires Faculty-supplied input and mandatory Faculty review, and records the provider
as technically pending. So:

- **there is no AI provider and no network request.** Drafts are generated locally, in this
  browser, by `js/ai-assist.js`
- input is a **prompt** *and/or* **source material** — pasted, or opened from a local text file
  with `FileReader`. The file never leaves the browser. Without material, drafts are built from
  the Experiment's own seeded learning resources
- generation is **deterministic**: the same prompt and material always produce the same drafts, so
  a QA path is repeatable and no demonstration depends on chance
- every draft carries **`AI-assisted draft`** and **`Review required`**, on every surface it
  appears on, never by styling alone
- **nothing enters the Question Bank until Faculty explicitly add it.** Drafts are held on the
  screen only; they have no id in any collection and a refresh discards them
- generated drafts are reviewed as **compact summaries with exactly one open editor**. Each
  summary carries what a decision needs — order, type, the provenance labels, the question, the
  marks, the source resource, and for a keyed type the option count and whether a key is set —
  but never *which* option the key points at, because that is the verdict Faculty are there to
  make. `Review & edit` opens one draft and closes any other, so the page stays a list of
  questions rather than a stack of simultaneous forms
- `Add to Question Bank` works from a collapsed summary. It **validates first**; if the draft is
  not addable, that draft's editor opens with the errors on the actual controls
- a question added from a draft keeps `origin: 'ai'` for ever, so its provenance stays visible in
  the bank after acceptance — Batch 02's separation of *provenance* from *review state*
- no claim is made about the quality or accuracy of a draft, and no model, vendor or latency
  figure appears anywhere

### Descriptive review — Faculty is the only human evaluator

`STK31-31` settles the owner. `state.finaliseReview()` is the **only** writer of an evaluated
descriptive result, and the Faculty review screen is its only caller. No Academic Reviewer,
Content Manager, Tenant Admin or Super Admin surface can reach it, and no second grader column
exists anywhere.

```
Student submits a written answer
   → submission creates the REVIEW OBLIGATION            reviews[] · status pending
   → Student is told "Pending Faculty review"
   → Faculty opens it, sees the question, their own evaluation guidance and the answer
   → Faculty enters marks (0 … max, whole or half) and optional feedback
   → Faculty CONFIRMS behind a dialog that states the consequence
   → the attempt is re-scored: objective + descriptive, decided against the snapshot pass mark
   → the existing visibility policy decides when the Student sees it
```

A confirmed review is **read-only** — see judgement call 17. Marks above the configured maximum
are refused with a message, not silently clamped.

### AI-assisted review — a suggestion, never a result

`ND-09` records the referenced Taxila auto-review mechanics as **not available**, and
`18_REQUIREMENT_SAFETY_CHECK.md` lists *inventing an auto-review algorithm* among the things this
project must not do. So the assistance affordance:

- is **optional**, controlled by a Faculty workflow preference (`Manual` / `With a suggestion`).
  It is a preference about how a Faculty member works, **not** a new evaluator role, and the queue
  and the decision work identically with it switched off
- produces **observations**, not a metric: how long the answer is, and which points from the
  Faculty member's own evaluation guidance appear in it. There is **no** confidence score, **no**
  similarity percentage, and **no** model, provider or vendor anywhere. The suggested figure is
  derived from those two observations and from nothing else, and it **says so on screen** rather
  than claiming to have no arithmetic behind it
- offers a **starting figure** the Faculty member fills in, changes or ignores. `Use suggestion`
  fills the marks and feedback fields and nothing else — it does not save, submit or complete
  anything. `Dismiss` hides the panel. Only `Confirm review` creates a result
- appears as an **in-page card inside the Suggestion section**, never an overlay or a modal. It
  shows the suggested marks, the suggested feedback, and a short `Why this was suggested` list of
  the observations the figure came from
- is **transient presentation state**. The suggestion *record* persists — `finaliseReview` stamps
  it, which is how a completed review can report whether a suggestion was used — but whether the
  panel is *on screen* is held in the screen module only. A reload therefore lands on a normal
  Review Detail with the `Generate suggestion` control, and never rebuilds a panel because
  suggestion data happens to exist in storage

**What `ND-09` leaves open, and why this is still safe.** The suggested figure is a weighted blend
of two observations — how much of the Faculty member's evaluation guidance appears in the answer,
and how long the answer is — with crude length bands. That is the entire derivation. How a
production auto-review would actually score a written answer is **not specified in the project
sources and has not been invented here**; this is not the Taxila mechanism. What
`18_REQUIREMENT_SAFETY_CHECK.md` forbids is *inventing* an auto-review algorithm and presenting it
as the product's, and nothing here is presented as, or asserted to be, how one scores. This
paragraph is where that account lives: it used to run as prose inside the suggestion panel, which
put implementation-facing text in the middle of a Faculty member's review. The **observations**
stay on screen, so the reader can still see what the figure came from; the argument about what is
unspecified belongs here and in `QA_CHECKLIST.md`.

### Answer / explanation visibility policy

`STK31-32`'s three confirmed general options, and no fourth:

| Option | Resolves against | Before release the Student sees |
|---|---|---|
| **Show immediately** | — | everything, at once |
| **Show after the assessment deadline** | the assessment's `deadline` | the workflow state and the date — no marks, no outcome |
| **Show on a set date** | the date set on the policy | the workflow state and the date — no marks, no outcome |

Faculty set it in the assessment settings; the **same** Student result engine
(`state.assessmentRelease()`) consumes it, and changing it reaches an existing result. A delayed
policy with no date set yet is honest about it — nothing is released and the sentence says why,
rather than inventing a date.

**The policy is not circumventable through another status.** One decision,
`state.scoreWithheld()`, governs every Student-facing score surface: a submitted attempt whose
policy has not released it shows **no figure and no outcome anywhere** — not on the result screen,
not on Progress, not in a badge — and offers no retry control. The progress derivation
additionally treats the assessment step as undecided under `opts.studentView`, so a passing and a
failing Student produce identical status, percentage, steps and counts. The Student is told the
workflow state (**Pending Faculty review**, then **Result pending release**) and the date, and
nothing else.

Faculty and the analytics are not affected and keep the true result. See `QA_CHECKLIST.md` —
*Result-withholding / progress-leak audit* and *Withheld-result score leak — final closure* — and
judgement calls 23–25.

> ### The BITS / Taxila default is **not** invented — `ND-10`
> The 31 August review said to *refer to Taxila behaviour* for BITS cases. That behaviour is not in
> the project sources. **No BITS default is preselected, asserted or implied anywhere in this
> build.** The settings screen carries a visible `PENDING — ND-10` note saying exactly that: the
> three options above are the confirmed general policy, and a BITS-specific behaviour would later
> be *selected* from a control like this one, not built into it. The three deliberately different
> policies on the seeded assessments are `PROTOTYPE SAMPLE CONFIGURATION`, chosen so that no single
> value can be mistaken for a platform rule — not a claim about BITS.

### Faculty analytics — what each number is

`STK31-29` scopes analytics to **operational learning analytics**; PM-11 and `U-FAC-11` prohibit
KPI dashboards, invented indexes, scores, ranks, predictions, attendance and engagement metrics.
Every figure in this build is a count over records that exist, states what it counts, and moves
with the filters above it. There is no gauge, no trend line and no composite.

| Figure | Numerator / denominator |
|---|---|
| Students reached | Students holding an **effective entitlement** to at least one mapped Experiment |
| Student entitlements | one row per Student × mapped Experiment, after filters |
| Not started · In progress · Awaiting review · Completed | those rows, bucketed by `experimentProgress().status` |
| Assessments submitted · passed · not passed · pending | Students with a latest **submitted** attempt, bucketed by its stored outcome |
| Responses to review | `reviews[]` with `status: pending`, inside the mapping |
| Resources | resources marked done ÷ resources the Experiment carries |
| **Simulation started / completed, per technology** | `simulationActivity[]` for that technology **only** |

That last row is the one that matters most. **A technology's figures come from simulation activity
and nothing else** — an Experiment-level assessment submission never makes a technology look
started. Implementation 03 corrected that semantic problem on the Student side; the Faculty
analytics inherit the correction rather than reintroducing it.

**“Completed” inherits the prototype-derived completion rule** (judgement call 8) and every Faculty
surface that shows it says so in words, in the same note.

## Prototype-only controls

The dark **“PROTOTYPE CONTROLS — NOT PRODUCT UI”** strip at the top is not product UX:

- **View switch** — Public · Super Admin · Tenant Admin · **Faculty** · **Student** (no real
  authentication in this slice)
- **Viewing as student** — shown only inside the Student workspace. It selects one **real**
  `TenantUser` record created through Implementation 02; it is not a sign-in, not an account
  switcher, and it grants nothing. What the chosen Student can see still comes only from what
  has been assigned to them. `#/learn` offers the same choice as a full screen, labelled
  **PROTOTYPE ONLY**
- **Viewing as Faculty** — shown only inside the Faculty workspace, and exactly the same shape.
  It selects one **real** Faculty `TenantUser` record created through Implementation 02; no
  identity is fabricated even when no Faculty is mapped to anything. What the chosen Faculty
  member can reach still comes only from their mappings. `#/faculty` offers the same choice as a
  full screen, labelled **PROTOTYPE ONLY**
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
- **Spreadsheet import of questions** (FRD 5.1.1) — Batch 02 built an upload with per-row error
  reporting and `13_…` keeps it. It is **not** implemented here and no control claims otherwise;
  the Question Bank names it as a gap. Faculty-supplied **source material** for drafting *is*
  implemented
- **Negative marking, a per-assessment marks scheme, and the assessment timer** — Batch 02's
  `cfg` carried `marksCorrect` / `marksIncorrect` / `marksUnanswered` / `floorZero` and a total
  time budget. Implementation 03 replaced the per-assessment marks scheme with **per-question
  marks**, which is what the Question Bank and the mixed objective/descriptive scoring need; the
  negative-marking model does not port onto it, so it is not carried forward. The timer (which
  prompts and never auto-submits) is likewise not rebuilt — `Q-43` flags it for re-confirmation
  once a server exists
- **Help in one consistent location** (`U-X-04`, WCAG 2.2 SC 3.2.6) — a cross-cutting shell item
  that no slice has built yet. Named here rather than half-added to one workspace
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
  moving backwards between builds; forward migration (1 → 5, 2 → 5, 3 → 5, 4 → 5) is additive and
  destroys nothing.
- **A completed descriptive review cannot be reopened.** No source establishes a re-grading
  workflow or who would authorise one, so none is invented; the review screen says so where the
  control would otherwise be. See judgement call 17.
- **Assessment definitions are per Tenant, and a Tenant whose Faculty have not authored one has
  none.** Assessment is optional, so that is a valid state and the Student is told so plainly —
  but it does mean a newly-created external tenant starts with no assessments at all until its
  Faculty write them.
- **Drafts from assisted drafting do not survive a refresh.** They are held on the screen, not in
  state, precisely so that an unreviewed draft cannot persist as something that looks reviewed.
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

## Safari review corrections

A manual Safari pass over the Faculty workspace produced one real layout bug, one real
transient-state bug and a set of copy defects. All are fixed; the behaviour, business rules,
assessment granularity, entitlement logic and result-visibility policy are unchanged.

| Defect | Root cause | Fix |
|---|---|---|
| Page-level horizontal scrollbar on *Draft questions with assistance* (409px at 1440) | `.field input[type=file]` in `screens.css` (specificity 0,2,1) beat `.sr-only` (0,1,0), so the visually-hidden file input kept `width:100%` / `min-height:48px`. Absolutely positioned with no positioned ancestor, its containing block was the viewport, and an absolutely-positioned box still contributes to the document's scrollable area — `clip` suppresses paint, not layout | the `.sr-only` geometry in `base.css` is now authoritative (`width`/`height`/`min-*`/`max-*`/`padding`/`border`), the way its `position` already was. No `overflow-x:hidden` anywhere |
| Generated suggestion "reopened itself" after a hard refresh | `generateReviewAssistance` persists the suggestion, and the screen showed the panel whenever `rv.assistance` was truthy — so the data revived the presentation | the panel is gated on module-local `suggestionView`, which no reload can restore. The record still persists, because `finaliseReview` stamps the audit trail |
| Suggestion panel read as diagnostic output | raw tokeniser labels (`Not found`) and a long implementation-facing paragraph rendered as product copy | a `Why this was suggested` list of short labelled observations; the `ND-09` argument moved to this README and `QA_CHECKLIST.md` |
| Generated drafts read as a form dump | every draft rendered as a full editor at once | compact summaries, exactly one open editor; the workspace moved below the rail so the editor gets full width |
| `institution&rsquo;s` printed literally | an HTML entity in a string `ui.emptyState` **escapes** | real Unicode punctuation. The other 31 entity uses are in raw-HTML positions and are correct as written |
| *"Faculty assessment and analytics … are a later slice"* | written before Implementation 04 built that workspace | removed; the Faculty-mapping and person screens now state what mapping unlocks |
| *"evaluated by the faculty member who teaches the experiment"* | implied a teaching assignment the model does not store | *"evaluated by the Faculty member mapped to the Experiment"* — mapping is the actual authorisation boundary |

Two latent overflow traps found while verifying were closed at the same time: `fieldset.fgroup`
keeps the UA `min-inline-size:min-content` unless reset, and `.draftcard .dc-src` had no
`overflow-wrap`.

## File map

```
index.html                 entry point (classic scripts — works from file://)
assets/                    byte-identical logo copy (protected asset, never edited)
qa/                        sample CSV fixtures for the bulk-import checks
css/  tokens → base → layout → components → screens → responsive
js/   utils · data (sample pool + scenarios + seeded tenant people + the
        assessment SEED SOURCE that state.js evolves into mutable state)
      · ai-assist (local deterministic drafting + review suggestion — no network)
      · state (records, state machine, allocation, derived entitlement,
        question bank, assessment definitions, reviews, faculty scope + analytics)
      · csv (parser + validation + template) · components · router · app
js/screens/  public-catalogue · public-request · platform
             · tenant (helpers · overview · content access)
             · tenant-people (directory · manual add · CSV import · person detail)
             · tenant-groups (groups · membership · academic mappings)
             · tenant-assign (assignments · faculty mapping)
             · student (helpers · prototype chooser · home · my learning · progress
               · the SHARED question renderer the Faculty preview also uses)
             · student-learn (experiment · simulation · assessment · attempt · result)
             · faculty (helpers · chooser · overview · my content · student progress)
             · faculty-assess (assessments · builder · settings · preview
               · question bank · editor · assisted drafts · review queue · review)
```

`js/screens/faculty*.js` load **after** the Student screens: the Faculty preview renders through
`XRSLP.studentUI`, so that module must exist first. That shared code path is what makes *"preview
shows what the student receives"* a structural fact rather than two implementations that have to
keep agreeing.
