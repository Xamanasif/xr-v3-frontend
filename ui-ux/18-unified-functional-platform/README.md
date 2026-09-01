# 18 — Unified Functional Platform · Implementations 01 + 02

**End-to-end B2B access, tenant operations and student entitlement** for the XR Simulation
Learning Platform, built against the 31 Aug stakeholder decisions.

One connected, functional prototype. Implementation 01 proved the *granting* half of the
chain; Implementation 02 completes the *receiving* half inside the institution:

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
```

### The invariant the two slices exist to prove

```
PUBLISHED   ≠   TENANT ACCESS   ≠   STUDENT ENTITLEMENT
                Super Admin          Tenant Admin
                allocates            assigns
```

Activating tenant access entitles **nobody**. Adding a student entitles them to **nothing**.
Putting a student in a group entitles them to **nothing**. Only an assignment does — and only
inside the approved set, and only within the approved quantity.

| | |
|---|---|
| **Source of truth** | `ui-ux/00-project-context/STAKEHOLDER_CONFIRMED_UPDATE_2026-08-31.md` (STK31-01…48) · `ui-ux/17-stakeholder-correction-blueprint/` |
| **Reuse sources** | Batches 01–05 (`ui-ux/13-full-platform-design/`) as read-only reference implementations — design tokens, shell, component grammar ported once; nothing is runtime-imported from historical folders |
| **Technology** | Dependency-free HTML + CSS + vanilla JS (ES5-style), single-page hash routing. No framework, no build step, no backend, no real payment or authentication |
| **State** | `localStorage`, isolated namespace **`xrslp-unified-v1`** (no historical batch key is reused), **`schemaVersion: 2`**; Implementation-01 state upgrades in place |
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

Anything else → a useful not-found state.

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

**`StudentEntitlement` is derived, never stored** — as
`17_CONCEPTUAL_DATA_AND_STATE_MODEL.md` §4 requires (*"DERIVED LEARNER ELIGIBILITY ← never
stored"*). Deriving it is also the only way the multi-source rules stay correct: one effective
entitlement per Student × Experiment × access record, however many assignment sources feed it.
An entitlement is **effective** only when the student is active, the access record has not
expired, the student is inside that record's approved allocation, and at least one active
assignment reaches them. `StudentCourseMembership` is likewise a read model over the student's
own Programme + Course placement — the confirmed field set gives each student exactly one of each.

### State migration

Loading a state written by Implementation 01 (`version: 1`) **upgrades it in place**: the new
collections are created empty and no request, tenant or access record is touched. Records
written by an earlier build are backfilled with the monotonic ordering stamps the allocation
queue needs. **Reset prototype data is the only action that discards anything**; it restores the
deterministic Implementation-02 seed (2 Faculty, 6 Students, 2 Groups, 2 local mappings for the
seeded internal tenant — and deliberately **no** access record and **no** assignment, so a fresh
reset still shows zero tenant access and zero entitlement).

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

## Prototype-only controls

The dark **“PROTOTYPE CONTROLS — NOT PRODUCT UI”** strip at the top is not product UX:

- **View switch** — Public · Super Admin · Tenant Admin (no real authentication in this slice)
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
- **Student My Learning, Experiment launch, progress** — a Student's entitlement is visible from
  the Tenant Admin side only; there is no Student workspace yet
- **Faculty workspace** — assessment authoring, the descriptive evaluation queue, Faculty
  analytics. Implementation 02 builds only the Tenant Admin *mapping* side
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
```
