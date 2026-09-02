# 18 — Unified Functional Platform · Implementations 01 + 02 + 03 + 04 + 05

**The content that reaches a learner, from the people who produce it to the learner who runs
it** — content production, B2B access, tenant operations, student entitlement, the student
learning experience and the Faculty workspace that authors and evaluates it — for the XR
Simulation Learning Platform, built against the 31 Aug stakeholder decisions.

One connected, functional prototype. Implementation 01 proved the *granting* half of the
chain; Implementation 02 completed the *receiving* half inside the institution; Implementation
03 carried that same derived entitlement into the Student's own workspace; Implementation 04
put the Faculty member behind the assessment the Student sits and the written answer the
Student submits. **Implementation 05 closes the chain at the top**: the content those four
slices distribute is no longer seeded — it is produced, academically validated and published
through the confirmed chain, into the same catalogue:

```
IMPLEMENTATION 05
VENDOR CREATES AN EXPERIMENT (technical submission — never publishes)
→ SUBMIT FOR ACADEMIC REVIEW
→ ACADEMIC REVIEWER validates academically and AUTHORS THE LEARNING OUTCOMES
   (approve · or request changes → correct → resubmit)
→ CONTENT MANAGER content-readiness review
→ **PUBLISH** — the FIRST publication of a NEW Experiment
→ IT IS IN THE PUBLIC CATALOGUE, and in nobody's hands yet

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

**Implementation 05 sits at the top of that chain and hands off to Implementation 01 without a
special case.** A newly published Experiment is discovered, requested, approved, allocated,
assigned and run by exactly the code the seeded catalogue already used.

### The invariant the slices exist to prove

```
PUBLISHED   ≠   TENANT ACCESS   ≠   STUDENT ENTITLEMENT
Content Manager Super Admin          Tenant Admin
publishes       allocates            assigns
```

Implementation 05 makes the first altitude real, and proves it stays separate. **Publishing
writes exactly one thing** — the content record's status, plus a publication record. It creates
no access row, changes no licence, creates no assignment. The QA path publishes an Experiment
and then shows the existing tenant's access, allocation, entitlements and Faculty scope
byte-identical to what they were a moment before.

### The terminology firewall — `STK31-06` / `STK31-07`

| Event | Object | Owner | The word |
|---|---|---|---|
| A **new** Experiment reaches the catalogue for the first time | the Experiment | **Content Manager** | **Publish** |
| A **newer version** replaces an already-published Experiment | the Version | **Super Admin** | **Release** / **Hold** |

**This slice builds the first row only.** The words *Release* and *Hold* do not appear as an
action anywhere in it, no later-version workflow exists, and no dead control hints at one. Where
a Vendor or a Content Manager looks at a published Experiment, the screen says plainly that a
later version is a different decision owned by another role and is not built here.

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

**Vendor workspace** (Implementation 05 — the content producer / submitter, `STK31-03`)

Three destinations, all implemented. There is no Invoices, Contracts, Payments, Messages,
Analytics or Support entry: none is built.

| Route | Screen |
|---|---|
| `#/vendor` | Resolves the prototype's current Vendor, or the PROTOTYPE-ONLY chooser |
| `#/vendor/:actorId/overview` | Counts that exist (draft · in academic review · changes requested · awaiting publication · published), attention rows, the Courses this Vendor may submit into |
| `#/vendor/:actorId/experiments` | **My Experiments** — every record this Vendor created, with search + status filter |
| `#/vendor/:actorId/experiments/new` | **Create experiment** — Course selection, metadata, technology availability, per-technology delivery, documentation, version, notes, with a live submission checklist |
| `#/vendor/:actorId/experiment/:recordId` | Submission detail and status — where it is, who holds it, what came back, full history |
| `#/vendor/:actorId/experiment/:recordId/edit` | Edit draft / **correct submission**. Refuses, with the reason, while a reviewer holds the revision or after publication |
| `#/vendor/:actorId/submissions` | Everything that has entered the governance chain, with the returned ones surfaced first |

**Academic Reviewer workspace** (Implementation 05 — academic validation + Learning Outcomes, `STK31-08`)

| Route | Screen |
|---|---|
| `#/review` | Resolves the prototype's current Academic Reviewer, or the PROTOTYPE-ONLY chooser |
| `#/review/:actorId/overview` | Waiting for review · changes requested · academically approved · published, the reviewer's own decision history, and the Courses assigned to them |
| `#/review/:actorId/queue` | **Review queue** — submissions inside their assignment, with search, status and Course filters |
| `#/review/:actorId/submission/:recordId` | **Academic review** — the experiment, its Course context, the technical delivery *as context*, and the **Learning Outcomes editor** (add · edit · delete · reorder). Approve academically, or request changes with a required reason |

**Content Manager workspace** (Implementation 05 — Content Library + FIRST PUBLICATION, `STK31-06`)

| Route | Screen |
|---|---|
| `#/content` | Resolves the prototype's current Content Manager, or the PROTOTYPE-ONLY chooser |
| `#/content/:actorId/overview` | Published · awaiting publication · in academic review · with a Vendor, technology coverage derived from published content, and what publishing does **not** do |
| `#/content/:actorId/library` | **Content Library** — the canonical pool, published and pipeline alike, with search + status + Course + technology filters. The same content source the public catalogue reads |
| `#/content/:actorId/queue` | **Publication queue** — academically approved items awaiting a first-publication decision, each with its readiness |
| `#/content/:actorId/item/:recordId` | Final review — canonical metadata, Learning Outcomes (read-only), the academic decision, technology delivery, documentation, readiness. **Publish**, or request changes with a required reason |
| `#/content/:actorId/item/:recordId/metadata` | **Canonical content metadata** (`STK31-09`) — name, Course, summary, description. Not the Learning Outcomes, not the delivery, not the master records |

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
**`schemaVersion: 6`** inside the stored object carrying the evolution. No second namespace
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
| `contentRecords[]` | **THE CANONICAL EXPERIMENT POOL** — id, Course, name, summary, description, `outcomes[]`, `technologies[]`, per-technology `delivery`, `documents[]`, version label, correction `revision`, workflow `status`, `origin`, the current `academicReview`, the `publication`, and an embedded `history[]` | **Vendor** creates and submits · **Academic Reviewer** writes the outcomes · **Content Manager** publishes and owns the canonical metadata |
| `academicReviews[]` | **AcademicReview** — every academic decision (`approved` / `changes_requested`), with the reviewer, the timestamp, the comment, the revision reviewed, and the Learning Outcomes as they stood | **Academic Reviewer** (STK31-08) |
| `publicationRecords[]` | **PublishedContent** — one per first publication: who published, when, the version label, the revision, the technologies and outcomes published, and the academic approval it rests on | **Content Manager** (STK31-06) |
| `contentActors[]` | Prototype Vendor · Academic Reviewer · Content Manager identities | prototype seed |
| `contentRoleAssignments[]` | Per-Course / per-Experiment role scope (`STK31-41`) | prototype seed, standing in for the Super Admin governance UI of a later slice |

### One content source — the single most important structural decision in this slice

Before Implementation 05, the catalogue was the static `EXPERIMENTS` array in `data.js`. Making
publication real without creating a second catalogue meant choosing where the one truth lives.

**It lives in `contentRecords[]`.** `data.js` keeps its array as the *seed* and installs a
resolver:

```js
XRSLP.data.setPublishedResolver(XRSLP.state.publishedPool);
```

From that line on, every catalogue lookup already written — `data.experiment()`,
`data.contextOf()`, `data.experimentsInCourse()`, `data.experimentsInGrouping()`,
`data.technologiesInUse()`, `data.experiments()` — resolves against `contentRecords[]` filtered
to `PUBLISHED`. Roughly ninety existing call-sites across the public catalogue, the tenant
screens, Faculty and Student were not touched, and two things became true **structurally**
rather than by discipline:

- a newly published Experiment appears everywhere, with no second catalogue and no call-site
  change;
- **content that is not published cannot be reached through any of them** — a hand-typed
  `#/experiment/EXP-011` before publication returns `null` from `contextOf()` and the screen
  resolves to *not found*. The leak is not guarded against; it is unrepresentable.

The three content workspaces go through `XRSLP.state.contentForVendor()` /
`contentForReviewer()` / `contentForManager()` instead, which see the full pool inside the
actor's authority. The projection is memoised against a content-event counter and dropped on
every mutation, on reset and on load.

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

**Schema 5 → 6** adds the content production chain, additively:

1. the five new collections are created if absent;
2. the five prototype content actors and their eleven per-Course role assignments are seeded;
3. **every existing seed Experiment becomes a `PUBLISHED` content record** carrying a publication
   record whose `origin` is `seed` — with its **id unchanged**, so every stored reference to it
   (selection items, access rows, assignments, Faculty mappings, attempts, questions, reviews)
   still resolves;
4. the four sample in-flight submissions are seeded **once**, and only into a state that has never
   held any Vendor-produced content — a browser that has already driven the chain is never handed
   records it did not create;
5. a stale prototype Vendor / Reviewer / Manager pointer is cleared, and re-checked against the
   actor's role.

Nothing from Implementations 01–04 is touched. Verified on a real schema-5 browser state: two
requests, two access records, eight people, two groups, four memberships, two course mappings, a
Faculty mapping, an assignment, an attempt, twelve questions, three assessment definitions and a
descriptive review all survived, and `migratedFrom` reported `5`.

**Existing published content is NOT replayed through a fabricated Vendor workflow.** It carries no
invented submission, no invented reviewer and no invented decision — inventing an audit trail
nobody wrote would be a lie in the one record whose whole purpose is to be trustworthy. Its
publication origin is `seed`, shown to a Content Manager as *"Existing published content"* with a
line explaining that it predates the workflow.

**Reset prototype data is the only action that discards anything**; it restores the deterministic
seed (2 Faculty, 6 Students, 2 Groups, 2 local mappings, **12 Question Bank items and 3 assessment
definitions** for the seeded internal tenant, **6 published Experiments and 4 sample in-flight
submissions**, **5 content actors and their role assignments** — and deliberately **no** access
record, **no** assignment and **no** learning activity, so a fresh reset still shows zero tenant
access and zero entitlement).

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
| 26 | **Status names: `Draft` · `Academic review` · `Changes requested` · `Content readiness review` · `Published`** | `U-VND-04` marks Batch 01's shipped status model **KEEP + REWORD**, so the set is inherited rather than invented. The rewording is (a) this build's sentence case, and (b) *Changes required* → **Changes requested**, which is PM-14's own verb and the brief's word. Batch 01's transient `publishing` state is dropped: it animated a deployment this prototype does not perform. `CHANGES_ACADEMIC` and `CHANGES_CONTENT` share the label but not the return gate | `CONTENT_STATUS` · `CONTENT_STATUS_META` |
| 27 | **`CONTENT_REVIEW` is both "academically approved" and "awaiting publication"** | Batch 01's own comment records the reason: the Content Manager publishes **at** the readiness gate, so a hand-off state between the two would describe nothing and would be a gate nobody passes through. The brief's two conceptual states map onto this one | `CONTENT_STATUS.CONTENT_REVIEW` |
| 28 | **A resubmission returns to the gate that requested the change, not to the start** | Batch 01's `resubmit(sub, target)` does exactly this, and it is the only reading in which the Content Manager's metadata question does not invalidate academic validation that has already passed. The recorded academic approval survives, so the publish guard still finds it | `submitContent()` · `returnedGate` |
| 29 | **A Vendor may edit only in `DRAFT` / `CHANGES_ACADEMIC` / `CHANGES_CONTENT`** | Brief §28 asks for a simple safe policy so the Vendor cannot mutate the exact revision a reviewer is reading. Editability follows the handoff: if the workflow has given the work back, it is editable; if someone else holds it, it is not. Enforced in `vendorCanEdit()`, so the route resolving is not the same as the action being allowed | `vendorCanEdit()` · `VENDOR_EDITABLE` |
| 30 | **A published record is read-only for the first-publication workflow, and NO "create new version" control is rendered** | Brief §45 asks for a safe policy and forbids building Super Admin Release/Hold here, and forbids a dead control. So the published revision is fixed, and both the Vendor and the Content Manager get a plain statement of whose decision a later version is — instead of a button that would either lie or do nothing | `vendorCanEdit()` · `publishedNextVersionNote()` |
| 31 | **Existing published content migrates with `publication.origin = 'seed'` and NO invented workflow history** | Brief §15 permits a migration-generated origin and forbids a fake historical Vendor workflow. Fabricating a submission, a reviewer and a decision would put words in people's mouths in the one record whose purpose is to be trustworthy. Ids are unchanged, so every stored reference still resolves | `seedContentPool()` · `migrateContentProduction()` |
| 32 | **A Vendor SELECTS a canonical Course; it cannot propose a new Programme or Course** | `STK31-10` makes the academic structure platform-controlled and `STK31-46` leaves *who maps an Experiment to a Course* 🟠 **detail pending** — while `U-VND-02` explicitly adds *course mapping* to the Vendor submission screen. Selecting from the canonical set satisfies the screen requirement without taking an authority no source grants. **If the pending detail resolves the other way, a "proposed / pending" state is an addition to a field that already exists, not a restructure** | `vendorCanCreateIn()` · the Course select |
| 33 | **Approving academically requires at least one Learning Outcome** | No source states a minimum. But `STK31-08` makes outcomes the reviewer's own object, `STK31-17` puts them on the public Experiment page, and the public page renders a *Learning outcomes* card unconditionally — so approving with none would publish a visibly empty section. Required at the gate that owns them, not at the Vendor's | `academicReadiness()` |
| 34 | **Publish readiness re-checks everything the earlier gates checked** | Brief §43 asks the Content Manager to catch missing canonical metadata, missing academic approval and incomplete technical information before Publish, and §58 requires the state layer — not the UI — to reject an invalid publish. The list is therefore evaluated inside `publishContent()` as well as rendered, so a hand-driven action fails identically | `publishReadiness()` · `publishContent()` |
| 35 | **Package delivery is metadata only, and says so** | Brief §10 forbids real storage and §68 forbids claiming an upload. A browser file picker is still the honest control for *"which package is this"*, so the name and size are recorded, the limitation is stated where the file is chosen and where the metadata is shown, and no message anywhere says a binary was uploaded or deployed | `packageFile` · `.dnote` |
| 36 | **A hosted URL is validated by format only, and is never opened during authoring** | Brief §69 asks for format validation and forbids auto-navigation. `isHttpUrl()` accepts `http(s)://host/...`; `https://` is what the hint asks for and every sample uses. No reachability check is possible or claimed in a browser prototype, and the value is not fetched, previewed or opened anywhere in the authoring flow | `isHttpUrl()` |
| 37 | **Content role assignments are prototype seed data, per Course** | `STK31-41` confirms Course- and Experiment-specific assignment with several holders per Experiment, and `U-SA-15` puts the surface that manages it in a later slice. Seeding the assignments makes scope real and testable now; the model already carries `scope: 'experiment'`, so the deferred UI writes into a structure that exists rather than replacing one | `contentRoleAssignments[]` |
| 38 | **A Vendor's visibility rule is ownership, not the Course assignment** | Brief §19 says a Vendor sees content they are authorised to work on. Two Vendors assigned to the same Course must still not read each other's drafts, so the Course assignment governs **where a Vendor may submit** and ownership governs **what they may read**. Verified: a hand-typed route to another Vendor's record is not found | `contentForVendor()` |

## The content production model

### Who owns what — `STK31-08`, and nothing outside it

| Role | Owns | Can never |
|---|---|---|
| **Vendor** | The technical submission: Course placement, experiment metadata, technology availability, per-technology delivery, documentation, version, correction and resubmission | **Publish** (FRD 1.4.5 — the only explicit role prohibition, and `STK31-03` extends it to internal BITS teams). Own Learning Outcomes. Approve anything |
| **Academic Reviewer** | Academic validation, Course/Experiment alignment, **the Learning Outcomes**, and the academic decision | Publish. Grant tenant access. Grade a Student's descriptive answer — that is Faculty (`STK31-31`) |
| **Content Manager** | The Content Library, content-readiness review, **the FIRST publication**, and canonical content metadata (`STK31-09`) | Publish an item with no academic approval. Re-mark Learning Outcomes. Release or hold a later version (`STK31-07` — Super Admin) |

**`Vendor` means content producer / submitter.** An internal BITS / WILP content team uses the
same role and the same workflow (`STK31-03`); no `Internal Developer`, `Content Developer`,
`Technical Reviewer`, `Publisher` or `Release Manager` role was invented. There are seven formal
roles and no eighth.

### The status machine

Batch 01's shipped model, which `14_UNIFIED_SCREEN_REQUIREMENTS.md` marks **KEEP + REWORD** for
`U-VND-04`, re-worded into this build's sentence case and PM-14's own verb:

```
                                    ┌──── request changes (reason required) ────┐
                                    ▼                                           │
DRAFT ──submit──▶ ACADEMIC_REVIEW ──┴──approve──▶ CONTENT_REVIEW ──publish──▶ PUBLISHED
  ▲                    ▲                              │  ▲
  │              CHANGES_ACADEMIC ◀───────────────────┘  │
  │                    │        request changes          │
  └── (Vendor edits) ──┤                                 │
                       │        CHANGES_CONTENT ─resubmit┘
                       └──resubmit──▶ (back to the gate that asked)
```

| Status | Label shown | With |
|---|---|---|
| `DRAFT` | Draft | the Vendor — not yet submitted |
| `ACADEMIC_REVIEW` | Academic review | the Academic Reviewer |
| `CHANGES_ACADEMIC` | Changes requested | the Vendor — correct and resubmit |
| `CONTENT_REVIEW` | Content readiness review | the Content Manager |
| `CHANGES_CONTENT` | Changes requested | the Vendor — correct and resubmit |
| `PUBLISHED` | Published | nobody — it is in the catalogue |

`CONTENT_REVIEW` is **both** *academically approved* and *awaiting first publication*. Batch 01's
own note records why there is no hand-off state between them: the Content Manager publishes **at**
the readiness gate, so a "ready to publish" state would describe nothing.

Batch 01's transient `publishing` state is **not** carried. It animated a deployment to production
that this prototype does not perform, and claiming one would be false.

### Changes requested — source-backed, at both gates

`04_FINAL_ROLE_AND_AUTHORITY_MODEL.md` gives the Academic Reviewer *"approve or request changes
(PM-14)"* and the Content Manager *"request changes (PM-14)"*; `13_BATCH_01_05_EXACT_CORRECTION_MAP.md`
lists *"Changes-required · comments · correction · resubmission at the returning gate"* as
**PM-14 — untouched**; and `ND-13` states that *"the Content Manager's request-changes path is
unchanged"*. It is implemented at both gates, exactly once each, with **a reason required** — a
submission returned without one is not a review.

A resubmission increments the correction-round counter and returns to **the gate that asked**. The
Content Manager's metadata question does not send work back through academic validation it has
already passed, and the recorded academic approval survives it.

#### …but only while the approval still describes the work

A content-gate return hands the **whole** submission back to the Vendor, so the work that comes
back need not be the work that was approved. Without a check, a Vendor could change the Course, the
name, the description and the technologies while "correcting", resubmit past academic review
entirely, and publish — with the publication record naming a reviewer who had never seen the
object. That was a real, reproducible hole, found by an audit of this slice and fixed.

An academic approval therefore records a **fingerprint** of what was validated: Course, name,
summary, description, technologies and Learning Outcomes. Delivery detail and documentation are
deliberately **not** in it, because correcting exactly those is what a content-gate return is for.
On resubmission the fingerprint is compared:

- **unchanged** → straight back to content readiness review, approval intact (the intended path);
- **changed** → the approval is **withdrawn** and the submission returns to academic review, with
  the reason written into its history.

The comparison **fails closed**: an approval that cannot be shown to describe the resubmitted work
does not get the benefit of the doubt. `publishReadiness()` checks it again as a last line of
defence, migration back-fills it onto approvals written before it existed, and the Vendor's
correction screen states in advance which changes will withdraw the approval.

### Vendor editing while a review is in progress

A Vendor may edit only in `DRAFT`, `CHANGES_ACADEMIC` and `CHANGES_CONTENT` — the states in which
the workflow has handed the work back to them. While an Academic Reviewer or the Content Manager
holds the submitted revision it is read-only, so the revision under review cannot change underneath
the reviewer. The route still resolves; the editor refuses and says which of those two things is
true.

### After publication

The published revision is **fixed** for this slice. The Vendor's editor refuses, and both the
Vendor and the Content Manager see a plain statement that replacing a published Experiment with a
newer version is a **Super Admin Release / Hold** decision on a different object, not part of
first publication, and not built here. **No "Create new version" control is rendered** — a dead
button that explains a deferred feature is worse than an absent one.

The Content Manager can still correct **canonical metadata** on a published item (`STK31-09`).
That takes effect in the public catalogue immediately, and the screen says so; it creates no new
version and does not touch the published revision, the recorded academic approval or the
publication record.

Canonical metadata is a **Content Library** action, so it applies only to content the Content
Manager actually holds — an item at their own readiness gate, or one already published. It is
refused on a draft the Vendor is still writing and on a submission the Academic Reviewer is
holding: rewriting either would change the work under the person doing it, and could move a
submission out of its assigned reviewer's scope. Enforced in `canonicalEditable()`, in the screen,
and on the action that links to it.

### Learning Outcomes — one copy, academically owned

`STK31-08` resolves the `N-1` ambiguity in favour of the Academic Reviewer, and
`14_UNIFIED_SCREEN_REQUIREMENTS.md` marks `U-VND-02` **"Learning Outcomes do NOT go here"**. So:

- the Vendor's form has **no** outcomes field — it says who owns them, and shows them read-only
  once they exist;
- the Academic Review screen carries the **only** editor: add, edit, delete, reorder, on the
  submission that reviewer currently holds;
- approving requires **at least one** outcome, because approving with none would publish an
  Experiment whose public *Learning outcomes* card is empty;
- the approval snapshots the outcomes as they stood, and so does the publication record;
- **there is no second copy.** The outcomes the reviewer wrote are the `outcomes[]` the public
  catalogue renders and the entitled Student reads on the experiment page. Verified end to end.

### Technology delivery — `STK31-37`

| Technology | Model | What the Vendor supplies |
|---|---|---|
| **AR · VR · MR** | Authorised / downloadable **package** | Package label and/or reference identifier, optionally a selected file (**metadata only**), device / runtime requirement, installation notes, technical notes |
| **Web / WebGL** | **Hosted** experience represented by a link | Hosted URL (`https://` format-validated), browser / runtime requirement, technical notes |

The editor renders **only** the selected technologies, and **only** the fields that technology's
delivery model uses. A package technology is never asked for a URL; Web is never asked for a
package. Delivery detail for a de-selected technology is discarded, so a submission never carries
a hosted URL for a technology it does not offer. **MR is structurally supported throughout**
(`STK31-45`) and is not silently dropped, even though the sample data concentrates on AR / VR /
Web.

**Source code is never required** (`STK31-37`). There is no repository field, no Git integration,
no container image, no registry and no binary deployment step anywhere in this slice, and the
Vendor form says so explicitly.

### The prototype file limitation, stated once

Choosing a package file or a document records **the file name and size only**. Nothing is
uploaded, nothing is stored, no deployment happens. The limitation is stated where a file is
actually chosen and once more where the recorded metadata is displayed — not repeated as a banner
on every screen, and never contradicted by a message claiming a successful upload.

### Readiness rules

**Before submitting for academic review** — a Course, a name unique in the pool, a summary, a
description, a version label, at least one technology, and for each selected technology enough
delivery information to be reviewable (package reference *or* label *or* a selected file for a
package technology; a valid `https://` URL for Web) plus its device / runtime requirement.

**Before approving academically** — the item is in academic review, the reviewer is authorised on
it, and at least one Learning Outcome is recorded.

**Before publishing** — the item is in content readiness review; an academic approval exists; the
canonical Course resolves; name, summary, description and version label are present; at least one
Learning Outcome exists; at least one technology exists and each carries valid delivery
information and a runtime requirement.

Each list is re-checked inside the state action, not only in the screen. A hand-driven
`state.publishContent()` on a draft, an item still in academic review, or an item returned for
correction returns `null` and changes nothing.

### Role scope — `STK31-41`, pending the Super Admin governance UI

Assignment may be Course- or Experiment-specific, and several people may be associated with one
Experiment. The Super Admin surface that manages this (`U-SA-15`) belongs to a later slice, so the
assignments are **prototype seed data** standing in for it — read by every scope check, written by
nothing in this build, and labelled as such on each chooser screen.

| Actor | Role | Scope |
|---|---|---|
| Ananya Rao — *Sample XR Content Vendor* | Vendor | Soil Mechanics · Surveying · Structural Analysis |
| K. Menon — *Sample Labs Collective* | Vendor | Strength of Materials · Fluid Mechanics |
| Dr. R. Iyer | Academic Reviewer | Soil Mechanics · Surveying · Structural Analysis |
| Dr. S. Nandakumar | Academic Reviewer | Strength of Materials · Fluid Mechanics |
| M. Kulkarni | Content Manager | Platform-wide (the Content Library is a platform surface) |

These are the neutral sample identities the Batch 01 governance prototype already used. **None is
a real BITS employee**, and none is a real person.

A Vendor sees **the records they created** — ownership, not the Course assignment, is the
visibility rule, so one Vendor can never read another's draft even inside a Course they both work
on. A reviewer sees submitted work inside their assignment. Seeded published content carries no
submission and is not review work, so it is not in any review queue.

### What publication does, and does not do

Publishing writes the content record's status and a publication record. That is all. The QA path
proves the rest by measurement: after publishing, the seeded tenant's access rows, active
assignments, every student's derived entitlements and every Faculty member's content scope are
**identical** to what they were before, and the tenant holds no entitlement to the new Experiment.
It becomes theirs only through the ordinary request → Super Admin approval → activation lifecycle,
and reaches a Student only through a Tenant Admin assignment.

### Public information boundary

The public Experiment page renders the name, Course, Programme / Department, description,
technology availability, device requirements and the **published Learning Outcomes**. It renders
**none** of: Vendor notes, Academic Reviewer comments, Content Manager comments, package labels or
references, selected file names, hosted URLs, the correction revision, or the history timeline.
Verified by asserting the exact stored strings do not appear in the rendered public page.

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

- **View switch**, in two labelled groups so eight roles wrap instead of overflowing:
  - *Access* — Public · Super Admin · Tenant Admin · Faculty · Student
  - *Content* — **Vendor** · **Academic Reviewer** · **Content Manager**

  (no real authentication in this slice)
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
- **Viewing as Vendor / Academic Reviewer / Content Manager** — shown only inside the matching
  workspace, and the same shape as the Student and Faculty switches. Each lists the **real**
  sample content actors that exist in prototype state, never a fabricated identity, and choosing
  one grants nothing: scope still comes only from the seeded per-Course role assignments.
  `#/vendor`, `#/review` and `#/content` offer the same choice as a full screen, labelled
  **PROTOTYPE ONLY**, with each identity's assigned scope shown beside it
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
- **Later-version Release / Hold** (`STK31-07` · `U-SA-09` / `U-SA-10`) — the Super Admin's
  decision on a *newer version of an already-published Experiment*. A different object, a
  different owner and a different word from first publication, which this slice does build. No
  part of it exists here, and no control hints at one
- **The Super Admin role-governance and per-content assignment surface** (`U-SA-14` / `U-SA-15`) —
  the screen that would write `contentRoleAssignments[]`. The records it writes exist and are
  seeded; the screen is a later slice
- **Global canonical master-data administration** (`U-SA-16`) — creating, renaming or retiring
  **Programme / Department and Course master records**. `STK31-09` gives canonical *content*
  metadata to the Content Manager and this slice implements exactly that, on the Experiment. The
  broader master-data surface is shared with the Super Admin and is deferred; the metadata schema
  itself is `ND-05`, still open
- **Vendor review history and Content Manager reviewed-content archives** (`U-ARV-02` / `U-CM-02`,
  both **P2**) — every decision is recorded and readable on the item itself and in the reviewer's
  own recent-decisions list; the separate archive screens are not built
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
      · csv (parser + validation + template) · components
      · content-ui (ONE implementation of the routes, status badge, holder line,
        technology delivery panel, outcomes list, readiness card and history
        timeline that all three content workspaces render)
      · router · app
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
             · vendor (chooser · overview · my experiments · submissions
               · submission detail · create / edit / correct)
             · reviewer (chooser · overview · review queue · academic review
               + the Learning Outcomes editor)
             · content-manager (chooser · overview · Content Library
               · publication queue · final review + Publish · canonical metadata)
```

`js/content-ui.js` loads **after** `components.js` (it builds on `XRSLP.ui`) and **before** the
three content workspaces that consume it. `js/state.js` installs the published-content resolver
into `js/data.js` at the foot of its own module, which is what makes the catalogue read one
source.

`js/screens/faculty*.js` load **after** the Student screens: the Faculty preview renders through
`XRSLP.studentUI`, so that module must exist first. That shared code path is what makes *"preview
shows what the student receives"* a structural fact rather than two implementations that have to
keep agreeing.
