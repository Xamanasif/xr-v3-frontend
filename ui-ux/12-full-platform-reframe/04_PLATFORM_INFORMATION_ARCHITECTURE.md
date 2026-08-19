# 04 — Platform Information Architecture / Sitemap

**Review:** 006 — Full Platform Reframe
**Created:** 2026-08-18
**Authority:** PM-01 (all Phase-1 roles) · PM-02 (sitemap before Figma) · PM-03 (one central portal, role-based workspaces) · PM-11 (core operations first)
**Companion:** `02_ROLE_PERMISSION_MATRIX.md` · `03_SHARED_CAPABILITY_MAP.md` · `10_FULL_PLATFORM_SCREEN_INVENTORY.md`

---

## The organising principle

> **PM-03: one central XR Simulation Learning Platform / web portal with role-based access/workspaces.**

**Not seven products. One platform, one shell, seven workspaces.**

```
                        ONE PORTAL · ONE URL · ONE SHELL
                                     │
                  ┌──────────────────┴──────────────────┐
                  │        Authenticate once            │
                  │   (password · social · SSO)         │
                  └──────────────────┬──────────────────┘
                                     │
                          Resolve identity → role → plane
                                     │
        ┌──────────────┬─────────────┼──────────────┬──────────────┐
        │              │             │              │              │
   TENANT PLANE   TENANT PLANE  TENANT PLANE   CENTRAL CONTENT  PLATFORM-WIDE
   Learner        Faculty       Inst. Admin    Vendor           Super Admin
   (or personal                                Academic Rev.
    B2C context)                               Content Mgr.
```

### What "one shell" concretely means

Every workspace shares the **same** header lockup, the **same** account menu, the **same** authentication and session behaviour, the **same** design tokens and components, the **same** error/empty/restricted-state grammar (`D-18`), and the **same** WCAG 2.2 AA baseline (`D-11`).

**What differs between workspaces is the navigation content and the permitted actions — never the chrome.**

### The two-plane model

Derived in `02_ROLE_PERMISSION_MATRIX.md` §B2 and `03_SHARED_CAPABILITY_MAP.md` §9.

| Plane | FRD basis | Roles | What lives here |
|---|---|---|---|
| **Central content plane** | 1.1.4 (central ownership), 1.4.1–1.4.5 (governance chain) | **V · AR · CM** | Module builds, assets, metadata, validation, approval, publication |
| **Tenant plane** (per institution) | 1.3.1 (tenant isolation) | **L · F · IA** | Institutional users, entitlements, courses, progress, licences, analytics |
| **Personal plane** (B2C) | 1.3.2 (separate B2C environment) | **L** | Individual accounts, purchases, personal entitlements |
| **Spans all planes** | 1.3.5 (cross-tenant governance) | **SA** | Publishing, licensing, platform configuration, oversight |

> ✅ **CONFIRMED by PM-13 (19 August 2026).** Review 006 recorded this split as a hypothesis, because the FRD never states it. **The Project Manager confirmed the Review-006 model**, so it is now the agreed architecture.
>
> **Central / platform content & governance side:** Vendor · Academic Reviewer · Content Manager · Super Admin
> **Institution / tenant side:** Institute Admin · Faculty · Student / Learner
> **B2C individual learners** use the shared platform and learning capabilities **without becoming an institutional tenant role**.
>
> Shared platform services connect the two areas: identity/access · content · learning · assessment · entitlements · XR delivery · commerce · progress.
>
> **Super Admin retains the FRD-defined cross-tenant governance capability (1.3.5). No additional cross-tenant permissions are granted to any other role.**
>
> See `13_PM_CLOSURE_DECISIONS.md` PM-13. Closes `QP-03`.

---

# Part 0 · Public & Authentication

**Shared by all seven roles. This is the single front door.**

```
PUBLIC / UNAUTHENTICATED
│
├── Sign in .............................. 10.2.1 · one entry for all roles
│   ├── Email + password ................. 4.1.1
│   ├── Social login ..................... 4.1.2 · B2C only
│   └── Institutional SSO ................ 4.2.2 · PM-10
│
├── SSO redirect / return ................ 4.2.2
├── Sign up .............................. 4.1.1 · B2C learners only
├── Email verification ................... implied by 4.1.1
├── Password reset ....................... design-supplied (no FRD requirement)
│
└── Institutional onboarding enquiry ..... 4.2.1 · organisation registration entry
```

```
POST-AUTHENTICATION RESOLUTION                                    ← NEW
│
├── Resolve identity → role(s) → plane → tenant
│
├── Single role  ──▶ land directly in that workspace
└── Multiple roles ──▶ Workspace chooser, then land
```

### Sign-in must serve seven roles without becoming seven sign-ins

| Principle | Rule |
|---|---|
| **One URL** | No `/admin`, `/vendor`, `/faculty` login variants. A separate admin login implies a separate product |
| **No role selection before authentication** | Asking *"are you a vendor?"* before sign-in leaks the role structure and is guessable. Role is **resolved from identity**, never declared |
| **SSO ordering is contextual** | `D-03` orders SSO first for institutional users. Preserved |
| **Sign-up is B2C-only** | FRD 4.1.1 self-registration serves individual learners. **Faculty, admins, vendors, and reviewers are provisioned** (7.2.2, 8.1.x, 1.4.1) — never self-registered |

### The multi-role case

A person may legitimately hold more than one role — an Academic Reviewer who is also Faculty at an institution; a Super Admin who is also a learner. FRD 8.3 (custom roles) is **Phase 3** and gives no Phase-1 mechanism for composite roles.

**Position:** a **workspace chooser** appears only when an identity resolves to more than one role, and the account menu offers *Switch workspace*. Roles are **not merged into one blended navigation** — that would require permission composition the FRD does not define.

**Recorded as a question**, not a decision: whether multi-role identities exist at all in Phase 1 is undefined. If they do not, the chooser never renders and costs nothing.

---

# Part 1 · Learner Workspace — `LRN`

**Roles:** Student / Learner · **Plane:** Tenant (B2B) or Personal (B2C)
**Status:** **KEEP + REFRAME** — the Review-005 IA is retained essentially unchanged and reframed as one workspace.

### Primary navigation

```
B2C individual learner
[logo]  Home   My Learning   Explore   Progress                    [Account ▾]

B2B institutional learner
[logo]  Home   My Learning   Progress            [Institution]     [Account ▾]
```

**One structural difference — B2B drops Explore** (`D-04`, PM-04). Everything else is identical.

### Structure

```
LEARNER WORKSPACE
│
├── Home ................................. D-10 · resumption in one click
│   ├── Continue learning ................ deterministic next action (D-07, D-20)
│   ├── Recent learning
│   ├── Current progress ................. compact
│   └── Needs attention .................. only when non-empty
│
├── My Learning .......................... 8.1.5 · 7.2.3 · 6.2.1 · 9.2.2
│   ├── Courses .......................... in-progress first
│   ├── Standalone modules ............... D-22 · B2C purchases or assigned singles
│   ├── Completed ........................ separated, not hidden
│   │
│   └── Course ........................... 3.2.1
│       ├── Overview
│       └── Modules ...................... ordered + GATED (3.2.2, D-07)
│           │
│           └── Module ................... 3.1.1 · exactly one XR simulation
│               ├── Overview + completion checklist (D-08)
│               ├── Learning Resources ... 3.1.2 · PDF · video (D-05)
│               ├── Simulation ........... Web | VR | MR | AR (1.2.x, D-09)
│               │   ├── Web runtime ...... 1.2.1
│               │   └── Device access .... PM-05 · ENTITLEMENT-AWARE  ← EXPANDED
│               └── Assessment ........... 5.2.x · configuration-driven ← REFRAMED
│                   ├── Overview + pre-attempt disclosure
│                   ├── Attempt
│                   └── Result + correctness review (D-25)
│
├── Explore .............................. B2C only · 1.1.3 · 6.1.1 · 6.1.2
│   ├── Catalogue ........................ modules + bundles (D-21: no courses)
│   └── Product detail ─▶ Checkout ─▶ Payment ─▶ Result
│
├── Progress ............................. 8.1.5 · 11.1.x · 11.2.x
│   ├── Course & module completion
│   ├── Assessment scores + attempt history
│   └── Time spent ....................... course level
│
└── Account ▾
    ├── Profile .......................... 4.3.1 · ERP fields read-only
    ├── My devices ....................... 2.4.1 · B2C only          ← NEW
    │   └── Request device replacement ... 2.4.2                     ← NEW
    ├── Purchases ........................ B2C only
    ├── Help
    └── Sign out
```

### Changes from Review 005

| Change | Driver |
|---|---|
| **Device access under Simulation is expanded** from guidance-only to entitlement-aware delivery states | **PM-05** |
| **Assessment values are read from configuration**, not compiled in | **PM-08** |
| **My devices + device replacement request added** to Account | FRD 2.4.1, 2.4.2 — Phase-1 requirements with no prior surface |
| **No certification surface** anywhere | **PM-12** |
| Everything else | **Unchanged** — PM-09 approves the progression |

**Cross-role surfaces:** Module content (shared with F, IA, CM, SA read-views) · Progress records (read by F, IA) · Entitlements (set by IA, ERP, or purchase).

**Tenant context:** B2B — institution label in header, no tenant switcher (1.3.1). B2C — no institution context (1.3.2).

---

# Part 2 · Faculty Workspace — `FAC`

**Roles:** Faculty · **Plane:** Tenant · **FRD:** 8.1.4 — *course assignments, assessments, student performance monitoring*
**Status:** **NEW**

### Primary navigation

```
[logo]  Overview   Courses   Assessments   Learners     [Institution]  [Account ▾]
```

### Structure

```
FACULTY WORKSPACE                                    tenant-scoped (1.3.1, 1.3.4)
│
├── Overview ............................. operational only (PM-11)
│   ├── My courses ....................... count + state
│   ├── Learners needing attention ....... blocked, failed, not started
│   └── Assessments awaiting action ...... incl. descriptive queue (if owned — PENDING)
│
├── Courses .............................. 3.2.1 · read from ERP in Phase 1 (T-1)
│   └── Course
│       ├── Overview ..................... structure, module sequence
│       ├── Modules ...................... read-only content (1.1.4)
│       ├── Assignment ................... 8.1.4 · assign to learners/cohorts
│       └── Learners ..................... roster + operational status
│
├── Assessments .......................... 5.1.x · 5.2.x · 5.3.x · PM-08
│   ├── Assessment list
│   ├── Assessment configuration ......... PM-08                     ← CORE NEW
│   │   ├── Question types ............... 5.2.1 · 5.2.2 · 5.2.3
│   │   ├── Rules ........................ negative marking (5.3.2) ·
│   │   │                                  randomization (5.3.1) ·
│   │   │                                  count · timing · pass mark ·
│   │   │                                  attempts · hints
│   │   └── Assign / publish ............. 8.1.4
│   ├── Question bank .................... 5.1.1 · spreadsheet upload
│   │   └── AI question generation ....... 5.1.2 · ⚠ Phase 1, audit required
│   └── Descriptive grading queue ........ 5.2.3 · ⚠ OWNER PENDING
│
├── Learners ............................. 8.1.4 · operational (PM-11)
│   └── Learner detail ................... completion · attempts · scores · blocked-on
│
└── Account ▾
```

### Boundaries that keep this workspace honest

| Boundary | Source |
|---|---|
| **No course creation** | 3.4.1 / 3.4.2 are **Phase 2**. Faculty assigns; it does not author courses |
| **No content editing** | 1.1.4 — content is centrally owned |
| **No class performance reports** | 11.3.1 is **Phase 2**. Operational status only |
| **Never crosses the tenant** | 1.3.4 |
| **Descriptive grading is drawn but unowned** | 5.2.3 has no grading workflow. The queue is shown as a **known-pending surface**, not a designed tool |

---

# Part 3 · Institute Admin Workspace — `IAD`

**Roles:** Institute Admin · **Plane:** Tenant · **FRD:** 8.1.3 — *institutional configuration, course structures, student access, institutional reporting*
**Status:** **NEW**

### Primary navigation

```
[logo]  Overview   People   Courses & Streams   Licences   Integrations   [Institution]  [Account ▾]
```

### Structure

```
INSTITUTE ADMIN WORKSPACE                            tenant-scoped (1.3.1, 1.3.4)
│
├── Overview ............................. operational only (PM-11)
│   ├── Licence utilisation .............. 6.2.2 · seats used / cap    ← prevents the learner wall
│   ├── Active learners
│   ├── ERP sync status .................. 7.2.1 · last run, outcome
│   └── SSO status ....................... 4.2.2 · configured / not
│
├── People ............................... 8.1.3 · "student access"
│   ├── Students ......................... ERP-provisioned (7.2.2)
│   │   └── Student detail ............... stream, entitlements, access state
│   ├── Faculty .......................... ⚠ provisioning owner PENDING (A6)
│   └── Access management ................ grant / revoke entitlements
│
├── Courses & Streams .................... 8.1.3 · 7.2.3 · 6.2.1
│   ├── Courses .......................... VIEW + ASSIGN only in Phase 1 (T-1)
│   ├── Academic streams ................. from ERP (7.2.3)
│   └── Stream → package mapping ......... 6.2.1 · 7.2.3
│
├── Licences ............................. 6.2.1 · 6.2.2
│   ├── Institutional licences ........... stream packages
│   ├── Seat utilisation ................. 6.2.2
│   └── ⚠ Purchase / renewal ............. PENDING — billing is Phase 2 (9.3.x)
│
├── Integrations ......................... 7.x · 4.2.2
│   ├── ERP configuration ................ 7.1.1 · 7.1.2
│   │   ├── Connection settings
│   │   ├── Sync schedule ................ 7.2.1 · "configurable intervals"
│   │   └── Sync history & errors
│   └── SSO configuration ................ 4.2.2 · PM-10                ← CORE NEW
│       ├── Identity provider settings
│       ├── Attribute mapping ............ ⚠ 7.4.2 role mapping is Phase 3
│       └── Test connection
│
└── Account ▾
```

### Boundaries

| Boundary | Source |
|---|---|
| **No device registration or management** | 2.5.x / 2.6.x are **Phase 2** |
| **No usage dashboards or adoption reports** | 8.2.x / 11.3.2 are **Phase 2** |
| **No course authoring** | 3.4.x is **Phase 2** |
| **No content modification** | 1.1.4 |
| **Never crosses the tenant** | 1.3.1, 1.3.4 |

**The Overview panel is deliberately four operational facts, not a dashboard.** Each answers *"is my institution working right now?"* — the PM-11 test. Licence utilisation earns its place because 6.2.2's cap is the direct cause of a learner-facing wall (`STATE-01`) the admin currently cannot see coming.

---

# Part 4 · Content Manager Workspace — `CM`

**Roles:** Content Manager · **Plane:** Central content · **FRD:** 8.1.2, 1.4.3
**Status:** **NEW**

### Primary navigation

```
[logo]  Review Queue   Content Library   Readiness                    [Account ▾]
```

### Structure

```
CONTENT MANAGER WORKSPACE                            central content plane
│
├── Review Queue ......................... 1.4.3 · gate ③
│   └── Submission
│       ├── Metadata review .............. 1.4.3 · 8.1.2
│       ├── Documentation review ......... 1.4.3
│       ├── Platform compatibility ....... 1.4.3 · formats, devices, versions
│       ├── Academic validation record ... 1.4.2 · READ-ONLY (AR's decision)
│       ├── Review history ............... PM-14 · all decisions + comments
│       └── Decision ..................... PM-14
│           ├── APPROVE for publication .. 1.4.3
│           └── REQUEST CHANGES .......... PM-14 · comments/reason required
│               └── returns to Vendor · never routes to publication
│
├── Returned ............................. PM-14
│   └── Submissions sent back, awaiting Vendor resubmission
│
├── Content Library ...................... 8.1.2
│   ├── All modules ...................... by gate position
│   └── Module
│       ├── Metadata ..................... EDIT (8.1.2)
│       ├── Learning components .......... 3.1.2
│       └── Publication state ............ read-only — SA publishes (1.4.4)
│
├── Readiness ............................ 8.1.2 · "content readiness for publishing"
│   └── Approved, awaiting Super Admin publication
│
└── Account ▾
```

**Content Manager approves but never publishes** (1.4.4). *Readiness* is the handoff surface to Super Admin — the queue of things CM has cleared and SA has not yet released.

**PM-14 adds a second outcome at this gate.** The Content Manager may **request changes** with comments/reason, returning the submission to the Vendor. A corrected resubmission **re-enters review**; there is no automatic path to publication after a return.

---

# Part 5 · Super Admin Workspace — `SA`

**Roles:** Super Admin · **Plane:** Platform-wide · **FRD:** 8.1.1, 1.3.5, 1.4.4, 2.3.2
**Status:** **NEW**

Super Admin touches **14 of 15 capability domains**. The workspace must be organised **by domain**, not by task, or it becomes unnavigable.

### Primary navigation

```
[logo]  Overview   Publishing   Content   Institutions   Licensing   Platform   [Account ▾]
```

### Structure

```
SUPER ADMIN WORKSPACE                                platform-wide (1.3.5)
│
├── Overview ............................. operational only (PM-11)
│   ├── Awaiting publication ............. 1.4.4
│   ├── Pending device replacements ...... 2.4.2
│   ├── Institutions ..................... count + state
│   └── Platform health .................. operational status
│
├── Publishing ........................... 1.4.4 · gate ④ · EXCLUSIVE AUTHORITY
│   ├── Ready to publish ................. CM-approved queue
│   │   └── Publish to production
│   ├── Published modules
│   └── Version releases ................. 2.3.2 · controlled release
│
├── Content .............................. central content plane oversight
│   ├── All modules ...................... every gate position
│   ├── Vendors .......................... 1.4.1 · authorised submitters
│   └── Academic reviewers ............... 1.4.2
│
├── Institutions ......................... 1.3.5 · cross-tenant
│   ├── Institution list
│   └── Institution detail ............... configuration · licences · status
│       └── ⚠ tenant-scoped data honoured even under governance access
│
├── Licensing ............................ 8.1.1 · 6.2.x · 9.2.1
│   ├── Institutional licences
│   ├── B2C entitlements
│   └── Device replacement approvals ..... 2.4.2                     ← NEW
│
├── Platform ............................. 8.1.1 · 12.x
│   ├── Configuration .................... platform settings
│   ├── Roles & users .................... platform role assignment
│   └── Security ......................... session/auth policy
│
└── Account ▾
```

### Boundaries

| Boundary | Source |
|---|---|
| **No custom role creation** | 8.3.x is **Phase 3** |
| **No cross-tenant analytics dashboards** | 8.1.1 grants cross-tenant *analytics*, but **PM-11** defers detailed metrics. Operational oversight only |
| **No bundle creation or pricing configuration** | 6.3.x is **Phase 2** |
| **Governance access is controlled, not unlimited** | 1.3.5 says *"strictly for governance and operational oversight"* |

---

# Part 6 · Vendor Workspace — `VND`

**Roles:** Vendor · **Plane:** Central content, own submissions only · **FRD:** 1.4.1, 1.4.5 (actor); role confirmed by **PM-07**
**Status:** **NEW**

### Primary navigation

```
[logo]  My Submissions   New Submission   My Modules                  [Account ▾]
         └── includes CHANGES REQUESTED (PM-14)
```

### Structure

```
VENDOR WORKSPACE                                     central plane · own scope only
│
├── My Submissions ....................... 1.4.1
│   └── Submission
│       ├── Status ....................... gate position: submitted → validated →
│       │                                  approved → published
│       ├── Build & assets ............... 1.4.1
│       ├── Metadata ..................... 1.4.3 · vendor-supplied
│       ├── Reviewer comments ............. PM-14 · reason for return
│       ├── Review history ............... PM-14 · every decision, in order
│       └── Correct & resubmit ........... PM-14 · re-enters review
│
├── New Submission ....................... 1.4.1 · staging environment
│   ├── Module details
│   ├── Build upload ..................... XR package · ⚠ format PENDING
│   ├── Supporting assets
│   └── Submit for review
│
├── My Modules ........................... published modules by this vendor
│
└── Account ▾ ............................ vendor organisation profile
```

### The prohibition must be visible, not merely absent

**FRD 1.4.5 is the only explicit role prohibition in the document.** A Vendor can never publish.

The design expresses this **positively** — the submission's status reads *"With Academic Reviewer"*, *"With Content Manager"*, *"Awaiting publication"* — so the vendor always knows where their work is and who holds it. **There is no disabled Publish button anywhere**, because a greyed-out control implies the permission might one day appear. It never will.

**Vendors see only their own submissions and modules.** No cross-vendor visibility is granted anywhere in the FRD.

### PM-14 adds a correction loop, not a shortcut

A returned submission arrives with **comments and a reason**. The vendor **edits their own returned submission and resubmits**, and it **re-enters review** at the gate that returned it. There is **no automatic publication path after rejection** — the prohibition at gate ④ is untouched by PM-14.

---

# Part 7 · Academic Reviewer Workspace — `ARV`

**Roles:** Academic Reviewer (*"BITS Pilani academic team"*, FRD 1.4.2) · **Plane:** Central content
**Status:** **NEW**

**Low volume, highest authority.** One FRD requirement — and it gates every module on the platform.

### Primary navigation

```
[logo]  Validation Queue   Validated                                  [Account ▾]
```

### Structure

```
ACADEMIC REVIEWER WORKSPACE                          central content plane
│
├── Validation Queue ..................... 1.4.2 · gate ②
│   └── Module under validation
│       ├── Module content ............... simulation, resources, assessments
│       ├── Metadata & documentation ..... vendor-supplied
│       ├── Curriculum alignment ......... 1.4.2 · "engineering curriculum standards"
│       │                                  ⚠ criteria not defined in the FRD
│       ├── Review history ............... PM-14
│       └── Decision ..................... PM-14
│           ├── VALIDATE academically .... 1.4.2
│           └── REQUEST CHANGES .......... PM-14 · comments/reason required
│               └── returns to Vendor · re-enters review on resubmission
│
├── Returned ............................. PM-14
│   └── Submissions I sent back, awaiting resubmission
│
├── Validated ............................ own decision history
│
└── Account ▾
```

### One remaining gap, one resolved

| Gap | Detail |
|---|---|
| **Validation criteria are undefined** | FRD 1.4.2 requires alignment with *"engineering curriculum standards"* but never states them. The workspace provides the **decision surface**; the **rubric is content someone must own** |
| ~~No reject path~~ | ✅ **RESOLVED by PM-14** — the reviewer may **request changes** with comments, returning the submission to the Vendor |

**Academic validation precedes Content Manager review** (1.4.2 → 1.4.3). The Reviewer's decision is therefore **read-only input** to the CM workspace, never editable there.

---

# Part 8 · Shared & Cross-Cutting Surfaces

Defined **once**, consumed by every workspace.

```
SHARED
│
├── Global shell ......................... header · account menu · skip link · breadcrumbs
│
├── System states ........................ D-18 · every state says what happened
│   │                                       and what to do next
│   ├── Access restricted ................ 2.2.2 · 6.2.2 · 10.1.2
│   ├── Content unavailable .............. 7.2.1 · 2.3.2
│   ├── System error
│   ├── Session expired .................. 10.2.2 · D-17 · unsaved work protected
│   ├── Empty state ...................... per surface
│   └── Permission denied ................ role-appropriate, no internal codes (C-07)
│
├── Module viewer ........................ read-only module content
│                                          consumed by F · IA · CM · SA · AR
│
├── Workspace chooser .................... multi-role identities
│
└── Help ................................. consistent location · WCAG 2.2 SC 3.2.6
```

**The module viewer is the clearest reuse win in the platform.** Five roles need to *look at* a module without editing it: Faculty checking what they assign, Institute Admin reviewing entitlements, Content Manager reviewing metadata, Academic Reviewer validating, Super Admin before publishing. **One component, five permission-filtered contexts** — not five module screens.

---

# Part 9 · Cross-workspace relationships

## The content governance chain — four workspaces, one object

**Updated by PM-14 — the chain now has return loops at gates ② and ③.**

```
  VND                ARV                  CM                    SA
   │                  │                    │                     │
   ├─ submit ────────▶│                    │                     │
   │   1.4.1          │                    │                     │
   │                  ├─ APPROVE ─────────▶│                     │
   │                  │   validate 1.4.2   ├─ APPROVE ──────────▶│
   │                  │                    │   1.4.3             ├─ publish
   │                  │                    │                     │   1.4.4
   │                  │                    │                     │
   │◀─ CHANGES ───────┤                    │                     │
   │   REQUIRED       │  PM-14 · comments  │                     │
   │◀─ CHANGES ────────────────────────────┤                     │
   │   REQUIRED          PM-14 · comments  │                     │
   │                                                             │
   ├─ correct & resubmit ──▶ RE-ENTERS REVIEW                    │
   │   PM-14 · never routes directly to publication              │
   │                                                             │
   │◀── status + review history ─────────────────────────────────┤
   │        (vendor always sees who holds it and why)   PM-14    │
   │                                                              ▼
   └─ 1.4.5: can NEVER publish                          published content
                                                                  │
                                    ┌─────────────────────────────┤
                                    ▼                             ▼
                              B2C catalogue              Institutional entitlement
                              (Learner · Explore)        (IA → stream → Learner)
```

**Two return edges, no shortcuts.** Academic Reviewer and Content Manager may each send a submission **back**; neither can send it **forward past their own gate**, and neither gains publish authority. A resubmission re-enters review. **Only Super Admin publishes** (1.4.4), and **the Vendor never does** (1.4.5).

## Entitlement flows into learning — two origins, one destination

```
B2B                                        B2C
 SA/IA licence (6.2.1, 6.2.2)               Learner purchase (6.1.1, 6.1.2)
        │                                            │
 ERP stream mapping (7.2.3)                  Payment (9.1.x)
        │                                            │
 IA assignment (8.1.3)                       Activation (9.2.1)
        │                                            │
        └──────────────▶  ENTITLEMENT  ◀─────────────┘
                              │
                    My Learning (9.2.2, 8.1.5)
                              │
                    Module → resources → simulation → assessment (PM-09)
                              │
                    Progress recorded (11.1.x, 11.2.x)
                              │
                    Visible to Learner (own) · Faculty/IA (tenant, operational)
```

## Assessment: authored in one workspace, consumed in another

```
FAC: configure (PM-08, 5.1.x, 5.3.x) ──▶ platform API ──▶ Web/XR application
                                                                │
                                          LRN: attempt ◀────────┘
                                                │
                                          result → PRG → FAC operational view
```

---

# Part 10 · Navigation summary

| Workspace | Primary nav items | Depth to core task | Status |
|---|---|---|---|
| **Public / Auth** | 1 front door | 1 | KEEP + EXPAND |
| **Learner** | 4 (B2C) / 3 (B2B) + Account | **1** — Continue learning | **KEEP + REFRAME** |
| **Faculty** | 4 + Account | 2 — Assessments → configure | NEW |
| **Institute Admin** | 5 + Account | 2 — Integrations → SSO | NEW |
| **Content Manager** | 3 + Account | 1 — Review Queue | NEW |
| **Super Admin** | 6 + Account | 1 — Publishing | NEW |
| **Vendor** | 3 + Account | 1 — New Submission | NEW |
| **Academic Reviewer** | 2 + Account | **1** — Validation Queue | NEW |

**No workspace exceeds six primary items.** Super Admin needs six because it spans 14 domains; Academic Reviewer needs two because it does one thing with high authority.

## Design rules applied throughout

1. **Operational, not analytical** (PM-11). Every workspace Overview answers *"what needs me right now?"*, never *"how did the cohort perform?"*
2. **Queue-first for governance roles.** Vendor, Academic Reviewer, Content Manager, and Super Admin all land on the work waiting for them. Their job is a queue, so the queue is the home.
3. **Phase boundaries are respected as structure, not hidden as disabled controls.** Nothing from Phase 2/3 appears greyed out — it is simply absent.
4. **Prohibitions are expressed positively.** Vendors see *where their submission is*, not a disabled Publish button.
5. **Shared surfaces are shared components**, not per-role rebuilds. One module viewer, one state grammar, one shell.
6. **Tenant boundaries are structural.** No tenant switcher exists for tenant-plane roles (1.3.1). Only Super Admin crosses, via Institutions (1.3.5).
7. **Pending items are drawn as pending**, never resolved by drawing. Descriptive grading and the XR delivery mechanism appear as **named gaps** in the IA, not as invented features. *(Reject paths were such a gap at Review 006; **PM-14 resolved them** and they are now designed surfaces.)*
