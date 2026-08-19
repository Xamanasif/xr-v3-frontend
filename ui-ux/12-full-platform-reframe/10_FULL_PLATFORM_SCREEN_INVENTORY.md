# 10 — Full Platform Screen Inventory

**Review:** 006 — Full Platform Reframe
**Created:** 2026-08-18
**Nature:** **An inventory and specification. Not high-fidelity design, not wireframes.**
**Companion:** `04_PLATFORM_INFORMATION_ARCHITECTURE.md` · `05_END_TO_END_WORKFLOWS.md` · `09_REVIEW005_REUSE_MAP.md`

---

## ID scheme

| Prefix | Workspace | Plane |
|---|---|---|
| `AUTH-` | Public & authentication — shared by all roles | — |
| `LRN-` | Learner / Student | Tenant or personal |
| `B2C-` | B2C commerce — a branch of the Learner workspace | Personal |
| `FAC-` | Faculty | Tenant |
| `IAD-` | Institute Admin | Tenant |
| `CM-` | Content Manager | Central content |
| `SA-` | Super Admin | Platform-wide |
| `VND-` | Vendor | Central content |
| `ARV-` | Academic Reviewer | Central content |
| `SHR-` | Shared surfaces used by several workspaces | — |
| `STATE-` | Shared system states | — |

### Mapping from Review-005 IDs

Review-005 used `STU-nn`. Those screens are **preserved unchanged in `ui-ux/04-screen-inventory/`**; here they are re-prefixed `LRN-` for consistency across nine workspaces. `AUTH-`, `B2C-`, and `STATE-` keep their original numbers.

`STU-01 → LRN-01` … `STU-14 → LRN-14`. **One-to-one, no renumbering.**

### Status

`KEEP` · `KEEP+REFRAME` · `MODIFY` · **`NEW`** · `PENDING` (drawn as a known gap, not designed)

### Figma priority

`P1` first detailed Figma pass · `P2` second · `P3` later · `—` inventory only for now

---

# AUTH — Public & Authentication · 10 screens

Shared front door for all seven roles.

| ID | Name | Roles | Purpose | FRD | PM | Primary actions | States | Status | Fig |
|---|---|---|---|---|---|---|---|---|---|
| `AUTH-01` | Sign in | All 7 | Single platform front door | 10.2.1, 4.1.1, 4.1.2, 4.2.2 | PM-10 | Sign in · SSO · social | B2B (SSO first) · B2C · error · locked | **KEEP+REFRAME** | P1 |
| `AUTH-02` | SSO redirect / return | L, F, IA | Hand off to IdP and return | 4.2.2 | PM-10 | — | Redirecting · returning · failed | KEEP | P1 |
| `AUTH-03` | Sign up | L (B2C) | Self-registration | 4.1.1, 4.1.2 | PM-04 | Register · social | Default · email collision | KEEP+REFRAME | P2 |
| `AUTH-04` | Email verification | L (B2C) | Confirm address | implied 4.1.1 | — | Resend | Awaiting · expired · verified | KEEP | P3 |
| `AUTH-05` | Password reset | All 7 | Recover access | *design-supplied* | — | Request · set new | Request · sent · set · expired | KEEP+REFRAME | P3 |
| `AUTH-06` | Session expired | All 7 | Protect unsaved work | 10.2.2 | PM-01 | Re-authenticate | Warning · expired · **admin unsaved state** | **MODIFY** | P2 |
| `AUTH-07` | Profile setup | L, F, IA | First-run profile | 4.3.1 | PM-01 | Complete | B2B read-only · B2C editable · **faculty** | **MODIFY** | P2 |
| `AUTH-08` | **Workspace resolution** | All 7 | Resolve identity → role → plane | 8.1.x | **PM-01, PM-03** | — | Resolving · resolved · no workspace | **NEW** | P1 |
| `AUTH-09` | **Workspace chooser** | Multi-role | Choose among held roles | 8.1.x | PM-01 | Select workspace | Multiple roles · switch | **NEW** | P2 |
| `AUTH-10` | **Institutional onboarding enquiry** | IA, SA | Organisation registration entry | **4.2.1** | PM-01 | Submit enquiry | Form · submitted | **NEW** | P3 |

---

# LRN — Learner Workspace · 17 screens

`LRN-01` – `LRN-14` map one-to-one from Review-005 `STU-01` – `STU-14`.

| ID | Name | Purpose | FRD | PM | Primary actions | States | Status | Fig |
|---|---|---|---|---|---|---|---|---|
| `LRN-01` | Home | One-click resumption | 8.1.5 · D-10 | PM-09 | Continue learning | Full · empty | KEEP | P1 |
| `LRN-02` | My Learning | Entitled content | 8.1.5, 7.2.3, 9.2.2 | PM-09 | Open course/module | Courses · standalone · completed · empty B2B/B2C | KEEP | P1 |
| `LRN-03` | Course detail | Gated module list | 3.2.1, 3.2.2 · D-07 | PM-09 | Open module | Gated list · locked rows | KEEP | P1 |
| `LRN-04` | Module detail | Completion checklist, internal gating | 3.1.1, 3.1.2 · D-08, D-20 | PM-09 | Open component | State A locked · State B available | KEEP | P1 |
| `LRN-05` | PDF viewer | Read a PDF resource | 3.1.2 · D-05 | PM-09 | View · download | Not opened · opened | KEEP | P2 |
| `LRN-06` | Video viewer | Watch a video resource | 3.1.2 · D-05 | PM-09 | Play · download | Coverage vs position | KEEP | P2 |
| **`LRN-07`** | **Simulation access** | Reach the simulation on its runtime | 1.2.1–1.2.4 · 2.1.x · D-09 | **PM-05** | Launch web · access on device | **Web · VR · MR · AR** | **MODIFY** | **P1** |
| `LRN-08` | Web simulation runtime | Run a web simulation | 1.2.1, 12.2.1 | PM-05 | Run · exit | Determinate loading · exit confirm | KEEP | P2 |
| **`LRN-15`** | **Device delivery status** | Where the experiment is, on the device | **PM-05** · 2.2.2, 2.3.1, 12.2.1 | **PM-05** | Retry · check for updates | Available · preparing · ready · update available · unsupported · denied · failed · *storage (conditional)* | **NEW** | **P1** |
| `LRN-09` | Assessment overview | Mandatory pre-attempt disclosure | 5.3.2 · D-06, D-23 | **PM-08** | Start attempt | **Disclosure generated from configuration** | **MODIFY** *(data source)* | P1 |
| `LRN-10` | Assessment attempt | Answer questions | 5.2.1–5.2.3 | **PM-08** | Answer · hint · navigate · submit | Parameterised timer, count, hints | **MODIFY** *(data source)* | P1 |
| `LRN-11` | Submit confirmation | Confirm submission | — | PM-08 | Confirm · cancel | Unanswered warning · failure | KEEP | P2 |
| `LRN-12` | Assessment result | Score and per-question correctness | 11.2.1 · D-23, D-25 | **PM-08** | Retry · review resources | Passed · not passed · floored · **awaiting evaluation** | **MODIFY** *(data source)* | P1 |
| `LRN-13` | Progress | Personal progress | 8.1.5, 11.1.x, 11.2.x | PM-11 | — | Full · empty | KEEP | P2 |
| `LRN-14` | Profile & account | Profile and settings | 4.3.1 | PM-01 | Edit | B2B read-only · B2C editable | **MODIFY** | P2 |
| **`LRN-16`** | **My devices** | Bound devices for a B2C licence | **2.4.1** | PM-05 | View · request replacement | Bound · none · B2B n/a | **NEW** | P2 |
| **`LRN-17`** | **Device replacement request** | Request a licence transfer | **2.4.2** | PM-05 | Submit request | Form · submitted · **awaiting SA approval** · approved | **NEW** | P2 |

---

# B2C — Commerce · 6 screens

| ID | Name | Purpose | FRD | PM | Primary actions | States | Status | Fig |
|---|---|---|---|---|---|---|---|---|
| `B2C-01` | Explore | Catalogue of modules and bundles | 1.1.3, 6.1.1, 6.1.2 · D-21 | PM-04 | Browse · filter | Full · empty | KEEP | P2 |
| `B2C-02` | Product detail | Module or bundle detail | 6.1.1, 6.1.2 · D-24 | PM-04 | Buy | Module · bundle · owned | KEEP | P2 |
| `B2C-03` | Checkout | Direct purchase | 6.1.x | PM-04 | Pay | Full · validation | KEEP | P3 |
| `B2C-04` | Payment processing | Gateway redirect | 9.1.1, 9.1.2 · C-05 | PM-04 | — | Processing | KEEP | P3 |
| `B2C-05` | Payment result | Outcome and activation | 9.2.1, 9.2.2 | PM-04 | Start learning · retry | Success · declined · indeterminate | KEEP | P3 |
| `B2C-06` | **Purchases & receipts** | Purchase history | 9.2.1 | PM-04 | View | List · empty · ⚠ receipt format pending | **NEW** | P3 |

---

# FAC — Faculty Workspace · 10 screens · **all NEW**

Tenant-scoped (1.3.1, 1.3.4). Operational only (PM-11).

| ID | Name | Purpose | FRD | PM | Primary actions | States | Status | Fig |
|---|---|---|---|---|---|---|---|---|
| `FAC-01` | Overview | What needs me now | 8.1.4 | **PM-11** | Go to item | Full · empty | **NEW** | P2 |
| `FAC-02` | Courses | Courses I teach | 3.2.1, 8.1.4 | PM-01 | Open course | List · empty | **NEW** | P2 |
| `FAC-03` | Course detail | Structure and modules | 3.2.1, 3.2.2 | PM-09 | View · assign | Overview · modules *(read-only, 1.1.4)* | **NEW** | P2 |
| `FAC-04` | Course assignment | Assign content to learners/cohorts | **8.1.4** | PM-01 | Assign · unassign | Select · assigned · conflict | **NEW** | P2 |
| `FAC-05` | Course learners | Roster and operational status | 8.1.4 | **PM-11** | Open learner | Full · empty · ⛔ no class reports (11.3.1 = P2) | **NEW** | P2 |
| `FAC-06` | Assessments | Assessments I own | 5.x, 8.1.4 | PM-08 | Open · create | List · empty | **NEW** | **P1** |
| **`FAC-07`** | **Assessment configuration** | Define types, rules, parameters | **5.2.x, 5.3.x** | **PM-08** | Configure · save · assign | Draft · configured · assigned · ⚠ sample values only | **NEW** | **P1** |
| `FAC-08` | Question bank | Upload and manage questions | **5.1.1** | PM-08 | Upload · edit · delete | Empty · populated · upload error | **NEW** | **P1** |
| `FAC-09` | **AI question generation** | Generate questions with AI | **5.1.2** | PM-08 | Generate · review · accept | ⚠ **PRODUCT-PENDING — Phase-1 requirement, build decision open** | **PENDING** | P3 |
| `FAC-10` | Learner detail | One learner's operational status | 8.1.4, 11.1.x, 11.2.x | **PM-11** | — | Completion · attempts · blocked-on | **NEW** | P2 |
| `FAC-11` | **Descriptive grading queue** | Grade free-text answers | **5.2.3** | PM-08 | ⚠ — | ⚠ **OWNER UNDEFINED — drawn as a known gap** | **PENDING** | — |

---

# IAD — Institute Admin Workspace · 14 screens · **all NEW**

Tenant-scoped. Operational only (PM-11).

| ID | Name | Purpose | FRD | PM | Primary actions | States | Status | Fig |
|---|---|---|---|---|---|---|---|---|
| `IAD-01` | Overview | Institution operational status | 8.1.3, 6.2.2, 7.2.1 | **PM-11** | Go to item | Seats · learners · sync · SSO | **NEW** | P2 |
| `IAD-02` | Students | ERP-provisioned learners | 8.1.3, 7.2.2 | PM-01 | Search · open | List · empty · syncing | **NEW** | P2 |
| `IAD-03` | Student detail | Stream, entitlements, access | 8.1.3, 7.2.3 | PM-01 | Grant · revoke | Active · no entitlement · blocked | **NEW** | P2 |
| `IAD-04` | Faculty | Institutional faculty | 8.1.3 | PM-01 | ⚠ — | ⚠ **provisioning owner PENDING (A6)** | **PENDING** | P3 |
| `IAD-05` | Access management | Grant / revoke entitlements | 8.1.3 | PM-01 | Grant · revoke | Bulk · individual · cap reached | **NEW** | P2 |
| `IAD-06` | Courses | Institutional course structure | 8.1.3, 7.1.2 | PM-01 | View · assign | List · ⛔ no authoring (3.4.x = P2) | **NEW** | P2 |
| `IAD-07` | Academic streams | Streams from ERP | 7.2.3 | PM-01 | View | List · empty | **NEW** | P3 |
| `IAD-08` | Stream → package mapping | Map streams to licensed packages | **6.2.1, 7.2.3** | PM-01 | Map · unmap | Mapped · unmapped · unlicensed | **NEW** | P2 |
| `IAD-09` | Institutional licences | Licences held | 6.2.1 | PM-01 | View | Active · expiring · ⚠ purchase PENDING (H2) | **NEW** | P2 |
| `IAD-10` | **Seat utilisation** | Seats used against the cap | **6.2.2** | **PM-11** | View | Within cap · near cap · **exhausted** | **NEW** | P2 |
| `IAD-11` | ERP configuration | Connection settings | **7.1.1, 7.1.2** | PM-01 | Configure · test | Not configured · configured · error | **NEW** | P2 |
| `IAD-12` | ERP sync schedule & history | Intervals, last run, errors | **7.2.1** | PM-01 | Set interval · run now | Scheduled · running · succeeded · failed | **NEW** | P2 |
| **`IAD-13`** | **SSO configuration** | Configure institutional SSO | **4.2.2** | **PM-10** | Configure · test · enable | Not configured · configured · test failed · enabled | **NEW** | **P1** |
| `IAD-14` | Institution profile | Institutional settings | 4.2.1, 8.1.3 | PM-01 | Edit | Full | **NEW** | P3 |

---

# CM — Content Manager Workspace · 7 screens · **all NEW**

Central content plane. Gate ③ of the governance chain.

| ID | Name | Purpose | FRD | PM | Primary actions | States | Status | Fig |
|---|---|---|---|---|---|---|---|---|
| **`CM-01`** | **Review queue** | Submissions awaiting readiness approval | **1.4.3, 8.1.2** | PM-01 | Open submission | Queue · empty · overdue | **NEW** | **P1** |
| **`CM-02`** | **Submission review** | Metadata, docs, compatibility | **1.4.3** | PM-01 | **Approve** · ⚠ reject | Under review · approved · ⚠ **reject path PENDING (D7)** | **NEW** | **P1** |
| `CM-03` | Metadata editor | Edit module metadata | **8.1.2, 1.4.3** | PM-01 | Edit · save | Draft · saved · validation error | **NEW** | P2 |
| `CM-04` | Compatibility check | Formats, devices, versions | **1.4.3** | PM-05 | Record findings | Pass · fail · ⚠ criteria pending | **NEW** | P2 |
| `CM-05` | Content library | All modules by gate position | 8.1.2 | PM-01 | Search · open | List · filtered · empty | **NEW** | P2 |
| `CM-06` | Readiness | Approved, awaiting SA publication | **8.1.2** | PM-01 | View | Awaiting publication · published | **NEW** | P2 |
| `CM-07` | Module viewer *(uses `SHR-01`)* | Inspect module content | 3.1.1, 3.1.2 | PM-01 | View | Read-only | **NEW** *(shared)* | P2 |

---

# SA — Super Admin Workspace · 14 screens · **all NEW**

Platform-wide (1.3.5). Gate ④. Operational only (PM-11).

| ID | Name | Purpose | FRD | PM | Primary actions | States | Status | Fig |
|---|---|---|---|---|---|---|---|---|
| `SA-01` | Overview | Platform operational status | 8.1.1 | **PM-11** | Go to item | Awaiting publish · device requests · institutions | **NEW** | P2 |
| **`SA-02`** | **Ready to publish** | CM-approved queue | **1.4.4** | PM-01 | Open | Queue · empty | **NEW** | **P1** |
| **`SA-03`** | **Publish module** | Release to production | **1.4.4** | PM-01 | **Publish** | Ready · publishing · published · failed | **NEW** | **P1** |
| `SA-04` | Published modules | Live content | 1.4.4 | PM-01 | Search · open | List · empty | **NEW** | P2 |
| `SA-05` | Version releases | Control version release | **2.3.2** | PM-05 | Release · hold | Pending · released · held | **NEW** | P2 |
| `SA-06` | All modules | Every module, every gate | 1.4.x | PM-01 | Search · open | By gate position | **NEW** | P2 |
| `SA-07` | Vendors | Authorised submitters | **1.4.1, 1.4.5** | **PM-07** | Add · manage | Active · suspended | **NEW** | P2 |
| `SA-08` | Academic reviewers | Reviewer accounts | **1.4.2** | **PM-07** | Add · manage | Active · suspended | **NEW** | P2 |
| `SA-09` | Institutions | Cross-tenant list | **1.3.5** | PM-01 | Open | List · empty | **NEW** | P2 |
| `SA-10` | Institution detail | Configuration, licences, status | 1.3.5, 8.1.1 | PM-01 | View · manage | Active · suspended · ⚠ tenant data honoured | **NEW** | P2 |
| `SA-11` | Licensing | Institutional and B2C entitlements | **8.1.1, 6.2.x, 9.2.1** | PM-01 | Manage | Active · expired · capped | **NEW** | P2 |
| **`SA-12`** | **Device replacement approvals** | Approve licence transfers | **2.4.2** | PM-05 | **Approve** · ⚠ reject | Pending · approved · ⚠ **rejection undefined** | **NEW** | P2 |
| `SA-13` | Platform configuration | Platform-wide settings | **8.1.1** | PM-01 | Configure | Full · ⛔ no custom roles (8.3 = P3) | **NEW** | P3 |
| `SA-14` | Roles & users | Platform role assignment | 8.1.1 | **PM-07** | Assign · revoke | List · ⛔ no custom roles (8.3 = P3) | **NEW** | P3 |

---

# VND — Vendor Workspace · 7 screens · **all NEW**

Central content plane, own submissions only. Gate ① — and a hard prohibition at gate ④.

| ID | Name | Purpose | FRD | PM | Primary actions | States | Status | Fig |
|---|---|---|---|---|---|---|---|---|
| **`VND-01`** | **My submissions** | Everything I have submitted | **1.4.1** | **PM-07** | Open | Queue · empty · **gate position per item** | **NEW** | **P1** |
| **`VND-02`** | **New submission** | Submit a module | **1.4.1** | **PM-07** | Create · submit | Draft · submitting · submitted | **NEW** | **P1** |
| `VND-03` | Build & asset upload | Upload the XR package | **1.4.1, 2.2.1** | PM-05 | Upload · replace | Empty · uploading · uploaded · failed · ⚠ **format PENDING** | **NEW** | **P1** |
| `VND-04` | Submission metadata | Supply module metadata | 1.4.1, 1.4.3 | PM-07 | Edit · save | Draft · complete · validation error | **NEW** | P2 |
| **`VND-05`** | **Submission status** | Where my submission is | **1.4.1–1.4.5** | **PM-07** | View | With reviewer · with CM · awaiting publication · published · ⚠ **revision path PENDING** | **NEW** | **P1** |
| `VND-06` | My modules | My published modules | 1.4.4 | PM-07 | View | List · empty | **NEW** | P2 |
| `VND-07` | Vendor organisation profile | Organisation details | 4.3.1 | PM-07 | Edit | Full | **NEW** | P3 |

> **`VND-05` carries FRD 1.4.5 as design.** The vendor always sees *who holds* their submission. **There is no disabled Publish control anywhere in this workspace** — a greyed-out button implies the permission might one day appear. It never will.

---

# ARV — Academic Reviewer Workspace · 6 screens · **all NEW**

Central content plane. Gate ②. Lowest volume, highest authority.

| ID | Name | Purpose | FRD | PM | Primary actions | States | Status | Fig |
|---|---|---|---|---|---|---|---|---|
| **`ARV-01`** | **Validation queue** | Modules awaiting academic validation | **1.4.2** | **PM-07** | Open | Queue · empty · overdue | **NEW** | **P1** |
| **`ARV-02`** | **Module validation** | Assess curriculum alignment | **1.4.2** | **PM-07** | **Validate** · ⚠ reject | Under review · validated · ⚠ **reject path PENDING (D7)** | **NEW** | **P1** |
| `ARV-03` | Module content review *(uses `SHR-01`)* | Inspect the full module | 3.1.1, 3.1.2 | PM-07 | View | Read-only · simulation · resources · assessments | **NEW** *(shared)* | **P1** |
| `ARV-04` | Curriculum criteria | Standards being validated against | **1.4.2** | PM-07 | View | ⚠ **criteria NOT defined in the FRD** | **PENDING** | P3 |
| `ARV-05` | Validated history | My past decisions | 1.4.2 | PM-07 | View | List · empty | **NEW** | P2 |
| `ARV-06` | Reviewer profile | Account details | 4.3.1 | PM-07 | Edit | Full | **NEW** | P3 |

---

# SHR — Shared Surfaces · 4 screens

Defined once, consumed by several workspaces.

| ID | Name | Roles | Purpose | FRD | Status | Fig |
|---|---|---|---|---|---|---|
| **`SHR-01`** | **Module viewer** | F, IA, CM, SA, ARV | Read-only module content — **one component, five permission-filtered contexts** | 3.1.1, 3.1.2, 1.1.4 | **NEW** | **P1** |
| `SHR-02` | Global shell | All 7 | Header, account menu, skip link, breadcrumbs | — | **KEEP+REFRAME** | P1 |
| `SHR-03` | Search / filter | F, IA, CM, SA, VND, ARV | List filtering in admin workspaces | — | **NEW** | P2 |
| `SHR-04` | Help | All 7 | Consistent location — WCAG 2.2 SC 3.2.6 | *design-supplied* | KEEP+REFRAME | P3 |

---

# STATE — Shared System States · 6 screens

| ID | Name | Roles | Purpose | FRD | Status | Fig |
|---|---|---|---|---|---|---|
| `STATE-01` | Access restricted | All 7 | Entitlement, cap, licence, permission | 2.2.2, 6.2.2, 10.1.2 | **MODIFY** | P1 |
| `STATE-02` | Content unavailable | L, F, IA | Withdrawn, changed, or failed content | 7.2.1, 2.3.2 | **KEEP+REFRAME** | P2 |
| `STATE-03` | System error | All 7 | Generic failure | D-18 | KEEP | P2 |
| `STATE-04` | **Permission denied** | All 7 | Role-appropriate refusal, **no internal codes** | C-07, D-18 | **NEW** | P2 |
| `STATE-05` | **Empty state** *(pattern)* | All 7 | Nothing here yet, per surface | D-18 | **NEW** | P2 |
| `STATE-06` | **Loading / processing** *(pattern)* | All 7 | Determinate where possible | 12.2.1 | **KEEP+REFRAME** | P2 |

---

# Roll-up

## Screens by workspace

| Workspace | Screens | KEEP | KEEP+REFRAME | MODIFY | **NEW** | PENDING |
|---|---|---|---|---|---|---|
| `AUTH` Public & Authentication | 10 | 2 | 3 | 2 | **3** | 0 |
| `LRN` Learner | 17 | 9 | 0 | 5 | **3** | 0 |
| `B2C` Commerce | 6 | 5 | 0 | 0 | **1** | 0 |
| `FAC` Faculty | 11 | 0 | 0 | 0 | **9** | **2** |
| `IAD` Institute Admin | 14 | 0 | 0 | 0 | **13** | **1** |
| `CM` Content Manager | 7 | 0 | 0 | 0 | **7** | 0 |
| `SA` Super Admin | 14 | 0 | 0 | 0 | **14** | 0 |
| `VND` Vendor | 7 | 0 | 0 | 0 | **7** | 0 |
| `ARV` Academic Reviewer | 6 | 0 | 0 | 0 | **5** | **1** |
| `SHR` Shared | 4 | 0 | 2 | 0 | **2** | 0 |
| `STATE` System states | 6 | 1 | 2 | 1 | **2** | 0 |
| **TOTAL** | **102** | **17** | **7** | **8** | **66** | **4** |

## By plane

| Plane | Screens |
|---|---|
| Public / shared | 20 (`AUTH` 10 · `SHR` 4 · `STATE` 6) |
| Tenant plane | 48 (`LRN` 17 · `FAC` 11 · `IAD` 14 · part of `B2C`) |
| Personal / B2C plane | 6 |
| Central content plane | 20 (`CM` 7 · `VND` 7 · `ARV` 6) |
| Platform-wide | 14 (`SA`) |

## What the numbers say

- **102 screens** across nine workspaces, up from 29 in one.
- **66 are new (65%)** — and **55 of those 66 belong to the six workspaces that did not exist before PM-01/PM-07** (`FAC` 9 · `IAD` 13 · `CM` 7 · `SA` 14 · `VND` 7 · `ARV` 5). The remaining 11 are additions to existing areas (`AUTH` 3 · `LRN` 3 · `B2C` 1 · `SHR` 2 · `STATE` 2).
- **21 of the 29 Review-005 screens carry forward unchanged or with a scope reframe only.** Of the 8 modified, **3 are data-source changes** (`LRN-09`, `LRN-10`, `LRN-12`).
- **4 screens are `PENDING`** — deliberately drawn as known gaps, not designed: descriptive grading (`FAC-11`), AI question generation (`FAC-09`), faculty provisioning (`IAD-04`), curriculum criteria (`ARV-04`).
- **Analytics screens: zero.** Per PM-11, every reporting element is an operational panel inside an existing Overview, never a dedicated dashboard.

---

# Highest-priority end-to-end flows for detailed Figma

Ranked by **cross-role coverage × design risk × requirement clarity**. Recommendation only — **not PM approval**.

## Rank 1 — FLOW 1 · Content to Production

**`VND-01, 02, 03, 05` → `ARV-01, 02, 03` → `CM-01, 02` → `SA-02, 03`** + `SHR-01`

| | |
|---|---|
| Screens | **13** |
| Roles | **4** — Vendor, Academic Reviewer, Content Manager, Super Admin |
| Existing coverage | **Zero** |
| FRD clarity | **Highest in the document** — 1.4.1–1.4.5 is an explicit authority ladder |
| Pending blockers | Only the reject path (D7) and package format — both drawable as marked gaps |

**Why first.** Four roles, four gates, nothing built, and the least ambiguous requirements in the FRD. It also unblocks everything else: no content reaches a learner, an institution, or a device until it is published.

## Rank 2 — FLOW 5 · XR Entitlement & Device Delivery

**`LRN-07` → `LRN-15`** + `LRN-16, 17` → `SA-12` + `STATE-01`

| | |
|---|---|
| Screens | **6** |
| Roles | 2 — Learner, Super Admin |
| Existing coverage | Guidance-only; **incomplete under PM-05** |
| Design risk | **Highest** — must remain mechanism-neutral while still being usable |

**Why second.** It is the PM's own worked example ("Soil Mechanics"), it is the largest gap between requirement and design, and getting the state vocabulary right now prevents a rebuild when the mechanism is chosen.

## Rank 3 — FLOW 4 · Assessment Authoring to Result

**`FAC-06, 07, 08`** → `LRN-09, 10, 12`

| | |
|---|---|
| Screens | **6** — 3 new, 3 data-source modifications |
| Roles | 2 — Faculty, Learner |
| Existing coverage | Consumption complete; **authoring absent** |

**Why third.** PM-08 is unambiguous, the authoring half is entirely missing, and the configuration surface determines what the three existing learner screens can render.

## Rank 4 — FLOW 6 · Institutional Identity / SSO

**`AUTH-01, 02, 08`** → **`IAD-13`**

| | |
|---|---|
| Screens | **4** |
| Roles | 3 — Institute Admin, Learner, Faculty |
| Existing coverage | Login exists; **configuration absent** |

**Why fourth.** PM-10 makes SSO required, `AUTH-08` workspace resolution gates every workspace, and the configuration surface is the missing half of a requirement already half-built.

## Recommended first Figma pass

**Ranks 1 + 2 = 19 screens.**

| Covers | |
|---|---|
| Roles | **6 of 7** — V, AR, CM, SA, L, *(+ IA via `STATE-01`)* |
| Workspaces | 6 |
| New content-governance coverage | 100% |
| The PM's own worked example | ✅ |
| Rebuild risk if deferred | Highest of any grouping |

Adding **Rank 3** brings Faculty in — **25 screens, all seven roles, four of the six highest-priority flows.**

**This is a recommendation for PM consideration, not an approved plan.**
