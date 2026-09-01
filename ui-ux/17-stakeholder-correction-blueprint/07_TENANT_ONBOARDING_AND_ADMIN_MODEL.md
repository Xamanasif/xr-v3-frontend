# 07 — Tenant Onboarding and Administration Model

| | |
|---|---|
| **Status** | ✅ **CURRENT TENANT MODEL OF RECORD** |
| **Created** | 31 August 2026 |
| **Governing decisions** | `STK31-02` · `11` · `19` · `20` · `21` · `22` · `23` · `24` · `25` · `26` · `27` · `28` · `44` |

---

## 1 · Tenant onboarding — end to end

```
   PUBLIC VISITOR
        │
        ▼
   ENTRY CHOICE — Institution / Individual                        🔴 no screen exists
        │
        ▼
   SELECTION BASKET                                               STK31-18
        │  · Courses / Experiments
        │  · technologies per Experiment
        │  · licence / user quantity
        │  · requested access term
        ▼
   INSTITUTION APPLICATION / REQUEST                              STK31-20 · FRD 4.2.1
        │  · organisation information       ✅ named
        │  · SPOC / contact information     ✅ named
        │  · the selection above
        │  · ⚪ nothing beyond this is invented
        ▼
   SUBMITTED — the applicant can see the state                    🔴 no surface exists
        │
        ▼
   SUPER ADMIN REVIEW / APPROVAL                                  STK31-20 · STK31-21
        │  approve · request more information · reason · history
        │
        ├────────────────────────────┬──────────────────────────┐
        ▼                            ▼                          │
   INTERNAL / APPROVED           EXTERNAL                        │
   COLLABORATOR                  INSTITUTION                     │
   · NO payment screen           · payment cycle                 │
   · access still tracked        · then activation               │
        └────────────┬───────────────┘                           │
                     ▼                                           │
   TENANT CREATED                                    STK31-21 · FRD 4.2.1 · 1.3.1
        │  isolation applies from here                           │
        ▼                                                        │
   TENANT ADMIN ASSIGNED                                    STK31-21
        │  ⚪ how an identity first EXISTS is still QD-02 — see §7
        ▼
   TENANT CONTENT + TECHNOLOGY ALLOCATED                     STK31-24
        │  Super Admin decides which Courses, Experiments and
        │  technology variants this tenant receives
        ▼
   TENANT WORKSPACE                                    ✅ mostly designed — Batch 03
        Overview · People · Academic Structure · Content Access ·
        Institution Setup (SSO · institution data)
        🔴 PLUS people provisioning, which does not exist yet
```

**Every stage above is confirmed direction. Four of them have no surface anywhere.**

---

## 2 · Who does what — the actor table

| Stage | Actor | Status |
|---|---|---|
| Apply | The institution | 🔴 No form exists (`AUTH-10`, inventoried NEW at P3, **never built**) |
| Review / validate | **Super Admin** | ✅ **Confirmed** — `STK31-20`, `STK31-21` |
| Authorise | **Super Admin** | ✅ Confirmed |
| Decide the commercial branch | **Super Admin** *(applies the rule)* | 🟠 the **rule** is `ND-07` |
| Create the tenant | **Super Admin** | ✅ Confirmed |
| Assign the Tenant Admin | **Super Admin** | ✅ Confirmed |
| Allocate content and technologies | **Super Admin** | ✅ Confirmed |
| Everything inside the tenant | **Tenant Admin** | ✅ Confirmed |
| Deactivate / terminate the tenant | **Super Admin** | ✅ Confirmed — prefer reversible (`STK31-22`) |

> **This closes `PM29-A4` / `PQ-03`, previously described as differing "by roughly a workspace".** The answer is **in-product, Super Admin** — which means a request queue, a decision surface, a required reason, a state the applicant can see, and a history trail. **Batch 01's governance-review pattern is a near-exact fit** and is the reuse source.

---

## 3 · Tenant structure — `STK31-23`

> **An individual operational campus/unit can be its own Tenant.**

Examples discussed: **WILP · Pilani · Goa · Hyderabad · Dubai.** High-level categorisation may include **On-campus** and **Off-campus**.

| Consequence | Detail |
|---|---|
| **FRD 1.3.1 isolation applies BETWEEN campuses** | Separate configurations, separate people, separate reporting, no shared learner record |
| **No sub-tenant / campus level is created** | The reading that would have required *"a campus/unit level no source contains and no batch designs"* is **not** adopted |
| **Sample institutions are not production records** | Do not hardcode WILP / Pilani / Goa / Hyderabad / Dubai as seeded tenants |
| On-campus / off-campus | A **categorisation attribute** on the Tenant, not a structural level |

**Still open** (`ND-07`): which institutions are *internal* (may skip payment) and which are *external*. **Coupled to the topology but not answered by it.**

---

## 4 · Tenant content allocation — `STK31-24`

**Super Admin controls which Courses, Experiments and technology variants are available to a Tenant. The Tenant Admin cannot assign content outside the approved set.**

```
PUBLISHED CONTENT POOL                    ← Content Manager publishes (STK31-06)
        │                                   Super Admin releases versions (STK31-07)
        ▼
SUPER ADMIN ALLOCATION                    ← 🔴 THE GRANTING END EXISTS NOWHERE
        │  unit = Course · Experiment · technology variant
        ▼
TENANT'S APPROVED SET                     ← ✅ THE RECEIVING END EXISTS
        │  Batch 03's content-access record, whose origin line
        │  deliberately carries a DATE AND NO ACTOR
        │  → STK31-24 supplies that actor: SUPER ADMIN
        ▼
TENANT ADMIN ASSIGNMENT                   ← ✅ STK31-25 confirms the owner
        │  to a Student, a group, or an academic stream
        │  Batch 03's DA-07 eligibility editor is now CONFIRMED, not reversible-pending
        ▼
LEARNER SEES IT IN MY LEARNING            ← ✅ built (Batch 03 INA-13 proves the handoff)
```

> **This was a blank Batch 03 was built to accept.** Its content-access origin line carried a date and no actor *"because no source confirms who records institutional content access."* **One line changes; the model does not.**

**The allocation surface should reuse Batch 03's two-direction mapping view (`INA-08`)** — which already shows *what content reaches which populations* and *which populations are reached by nothing*.

---

## 5 · Tenant Admin responsibilities — `STK31-25`

| Area | Status | Note |
|---|---|---|
| **Manual Faculty creation** | 🔴 **NEW** | Batch 03 `DA-04`: *"no such control exists"*. Faculty rows show `—` in Source *"because who creates a Faculty account is undefined"* — **now answered** |
| **Manual Student creation** | 🔴 **NEW** | Same |
| **Bulk CSV import** | 🔴 **NEW** | upload → validate → **per-row error report** → commit → outcome. **Batch 02's question-bank upload pattern is a near-exact fit** |
| Groups | ✅ built | Batch 03 `INA-04` / `INA-05` |
| Faculty mapping · Student/group mapping | ✅ partly built | Batch 03 |
| **Course / Experiment assignment from the approved set** | ✅ **CONFIRMED OWNER** | Batch 03 `INA-07`'s eligibility editor (`DA-07`) is **confirmed in place**, no longer reversible-pending |
| Institution-specific mappings | 🟠 partly new | Local Course Code 🔴 new · **Semester OPTIONAL** · plan/access context 🔴 new |
| SSO configuration | ✅ built | `INA-10` — configure → check → **turn on only after a successful test** |
| Institution data / ERP | ✅ built | `INA-11` / `INA-12` — schedule, last run, outcome, counts, errors, retry |
| Reporting over assigned students and content | 🔵 partly | `STK31-43` |
| **Student removal / deactivation** | 🔴 **NEW** | Tenant Admin performs it; **Super Admin may also, as a platform override**. Prefer **deactivate** over destructive delete (`STK31-22`) |
| Redefine the canonical Experiment catalogue | ⛔ **Prohibited** | `STK31-10` |

---

## 6 · Bulk CSV provisioning — `STK31-26`

### 6.1 The field set

| Field | Status |
|---|---|
| Programme | accepted |
| Course Name | accepted |
| Course ID / Code | accepted |
| Student ID | accepted |
| Student Name | accepted |
| Student Email | accepted |
| **Semester** | 🟢 **OPTIONAL** — never mandatory (`STK31-11`) |
| **Organisation** | 🟢 **OPTIONAL** |
| **Plan Terms / Access Context** — e.g. `Subscription`, `BITS Community` | 🟠 requested *"if possible"*. **Mandatory status = implementation-detail confirmation PENDING** (`ND-03`) |

> **`Plan Terms` is included in the UX and data-planning model. It must NOT be silently classified as technically mandatory.**
>
> **No database schema is created.** A mandatory-field list is a **validation contract**: getting it wrong fails real institutional imports, and getting it wrong *silently* imports rows that mean the wrong thing.

### 6.2 The import flow

```
UPLOAD FILE
   ▼
VALIDATE ................. per-row, not whole-file
   ▼
ERROR REPORT ............. per-row, with the reason and the row number
   ▼                       ▶ reuse Batch 02's upload report + Batch 03's Issue Card
COMMIT ................... only the rows that pass
   ▼
OUTCOME .................. what was created, what was skipped, what needs attention
```

### 6.3 🔴 The write conflict that this creates — `ND-04`

> **The institution's ERP is authoritative (FRD 7.1.1) and scheduled sync overwrites (FRD 7.2.1).**
>
> Adding **manual creation** and **CSV import** beside an authoritative ERP creates a **real, reachable conflict** on the same person. `QD-01` — *which fields are user-editable vs institution-owned?* — has been open since Review 006, and this makes it unavoidable rather than theoretical.

**Safe reversible handling until it is resolved** — see `16_REMAINING_NONBLOCKING_DETAILS.md`:

- show **provenance per person** (`ERP` · `CSV import` · `manual`), which Batch 03's `Source` column already does;
- **never silently overwrite** — surface a conflict as a *Record Needing Attention*, reusing Batch 03's proven pattern;
- make the resolution an explicit, reversible action rather than a background rule.

---

## 7 · Where a person's identity comes from — the one remaining gap

`QD-02` asked *how does anyone become a role-holder in Phase 1?* The 31 Aug review answers **who assigns** (`STK31-21`, `STK31-25`, `STK31-41`) but not **how an identity first exists**: invited, created, imported, or mapped from an identity provider. FRD 7.4.2 (IdP role mapping) and 8.3 (custom roles) are both **Phase 3**.

**Safe handling:** design the **assignment** surface against an identity that already exists, and render identity origin as a **provenance line**. Do not invent an invitation flow, an activation e-mail, or an account-creation mechanism.

---

## 8 · Licence quantity, access term and expiry

### 8.1 Quantity — `STK31-27`

- The institutional request carries a **quantitative requirement** (e.g. 10 users, 100 users).
- **There is no universal fixed seat cap.**
- Quantity is **specific to the request / access agreement**.
- The UI may show **Requested licences/users · Assigned students · Remaining allocation** — **only when those values derive from the actual approved request.**
- 🔴 **Do NOT restore arbitrary sample caps such as 5,400.**

**FRD relationship.** FRD 6.2.2 — *"Institutions **may** purchase capped licenses based on maximum student count"* — says *may*. A per-request quantity is consistent with it. FRD 8.2.2 licence-utilisation tracking is **Phase 2**.

### 8.2 Access term and expiry — `STK31-28`

Known durations: **Monthly · Quarterly · Yearly.**

> ### ✅ REQUIRED — stated verbatim by the stakeholder
> **"We will send reminders to Tenants 15 days ahead."**
>
> **15 days before an institutional subscription/access term expires, the Tenant must receive an expiry reminder.**

| Layer | Status |
|---|---|
| **The reminder itself** — a reminder event 15 days before expiry, reaching the Tenant | ✅ **REQUIRED** |
| **An in-product `Expiring soon` attention state** on the Tenant overview and the Super Admin institution report | 🔵 **RECOMMENDED SUPPORTING UX** — a design/implementation choice, **not a separately stakeholder-required rule**. It does not discharge the reminder requirement |
| **The delivery channel / mechanism** | 🟠 **PENDING** — `ND-16` |

⛔ **Do NOT invent the channel** — not e-mail, not SMS, not push, not an external notification provider.

```
ACTIVE ──────────────▶ EXPIRING SOON ──────────▶ EXPIRED
   ▲                   (from T-15 days)              │
   │                                                 │
   └───────────────── RENEWED ◀──────────────────────┘
```

> **Do NOT assume automatic payment, automatic renewal, or automatic charge** (`ND-11`). The transition out of *Expired* is not modelled as automatic anywhere.

**Modelling note.** The **confirmed requirement** is the reminder: a **reminder event fired at T-15 days** that reaches the Tenant. Its **delivery channel is pending** (`ND-16`), so whichever channel is later confirmed becomes a **delivery target for an event that already exists**.

Separately, an in-product **`Expiring soon`** attention state on the Tenant overview and the Super Admin institution report is **recommended supporting UX** — safe, useful, and cheap because Batch 03's and Batch 05's attention-list patterns already exist. **It is a design choice, not a stakeholder-confirmed rule, and building it does not by itself satisfy the reminder requirement.**

🟠 **FRD relationship — recorded** (`S-21`): no Phase-1 FRD requirement describes a notification or reminder capability, so **the reminder is an extension**. It is required nonetheless, because the stakeholder stated it directly.

**What happens at expiry to in-flight learning — an attempt underway, a partially completed Experiment — is not stated by any source and is not invented here.** Recorded in `16_REMAINING_NONBLOCKING_DETAILS.md`.

---

## 9 · SSO and institutional sign-in — `STK31-44`

| Rule | Detail |
|---|---|
| Institution **has** SSO | Use the configured institutional SSO — FRD 4.2.2 · PM-10 · Batch 03 `INA-10` (built) |
| Institution **does not have** SSO | **Platform authentication may be provided** |
| Password policy / routing | **Not finalised here** |

**Batch 03 configures institutional SSO. The learner-facing SSO sign-in path has never been built in any batch** (`AUTH-02`). `QT-04` — XR sign-in under SSO — remains **HIGH and open**.

---

## 10 · What this model deliberately does NOT contain

| Not modelled | Why |
|---|---|
| A rejection reason taxonomy or an appeal path | No source contains one. `STK31-20` confirms approval exists; it enumerates no rejection behaviour |
| An SLA or turnaround commitment | Never stated |
| Business-verification integrations | No source names any |
| A sub-tenant / campus level | `STK31-23` — a campus **is** a Tenant |
| A seat cap not derived from an approved request | `STK31-27` |
| A payment step on the internal route | `STK31-19` — explicitly prohibited |
| An automatic-renewal mechanism | `STK31-28` · `ND-11` |
| A CSV schema, column type, or file-format specification | `STK31-26` — **no schema is created** |
| A **delivery channel** for the 15-day reminder — e-mail, SMS, push, or an external provider | **The reminder is REQUIRED; the channel is not stated** (`ND-16`). ⛔ Do not invent one |
