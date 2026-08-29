# 10 — Phase-1 Gap Inventory (Pre-Monday)

| | |
|---|---|
| **Status** | 🟠 **PRE-MONDAY INVENTORY — DRAFT.** **NOT the formal Phase-1 gap audit** |
| **Created** | 29 August 2026 |
| **Why not the formal audit** | The formal audit sets the build backlog. Running it while twelve ambiguities are open would produce a backlog that has to be redone. It is **Stage 4** in `13_CONSOLIDATION_SEQUENCE.md` |

---

## Classification

| Class | Meaning |
|---|---|
| 🔴 **CONFIRMED MISSING** | A source-supported need with **no surface anywhere**, and no PM answer required to know that |
| 🟠 **LIKELY MISSING** | Directionally required, but the exact surface depends on an open answer |
| ⛔ **BLOCKED BY PM** | Cannot be scoped at all until a specific question is answered |
| ✅ **ALREADY COVERED** | Built in a batch, and 29 August does not change it |
| 🔵 **SUPERSEDED** | A position that existed and is now replaced — the artefact survives, its placement does not |
| ⏭ **LATER PHASE** | Out of Phase 1 by PM decision or FRD phasing |

---

# Part A · Public and entry

| # | Gap | Class | Basis | Note |
|---|---|---|---|---|
| A1 | **Public landing page** | 🔴 **CONFIRMED MISSING** | `PM29-02` | No unauthenticated surface exists in any batch |
| A2 | **Public catalogue browse** | 🔴 **CONFIRMED MISSING** | `PM29-02` | Batch 04's Explore exists but **sits behind sign-in** — components reusable, position wrong |
| A3 | **Public course page** | 🔴 **CONFIRMED MISSING** | `PM29-02`, `PM29-13` | No course-level catalogue page exists anywhere. Batch 04 offers modules and bundles only |
| A4 | **Public experiment detail** | 🔴 **CONFIRMED MISSING** | `PM29-02`, `PM29-03` | Batch 04's module detail is the closest and is authenticated |
| A5 | **Learning outcomes on an experiment** | 🔴 **CONFIRMED MISSING** | `PM29-03` | **No surface in any batch carries learning outcomes** |
| A6 | **Preview / video on a public page** | 🟠 **LIKELY MISSING** | `PM29-03` | ⚠️ Couples to `QX-03` — caption / transcript / audio-description ownership, **HIGH and open**. A public video with no captions is an accessibility exposure |
| A7 | **Entry fork: Institution vs Individual** | 🔴 **CONFIRMED MISSING** | `PM29-06` | No inventory ID exists for it |
| A8 | **Public pricing visibility** | ⛔ **BLOCKED BY PM** | `PM29-04` | "Do NOT yet invent" |
| A9 | **Non-entitled browse depth** | 🟠 **LIKELY MISSING** | `OQ-05`, Batch 04 `DA-02` | `PM29-02` confirms visitors browse; **how much they see is still open** |
| A10 | **Programme browse level** | ⛔ **BLOCKED BY PM** | `PM29-A9` | The word collides with the PM-12-deferred *certification program* |

# Part B · Authentication and identity

| # | Gap | Class | Basis | Note |
|---|---|---|---|---|
| B1 | **Sign in (`AUTH-01`)** | 🔴 **CONFIRMED MISSING** | FRD 10.2.1, 4.1.1, 4.1.2, 4.2.2 · PM-10 | **Never designed in any batch.** Now blocking: a public entry has to hand off to a sign-in that does not exist |
| B2 | **SSO redirect / return (`AUTH-02`)** | 🔴 **CONFIRMED MISSING** | FRD 4.2.2 | Batch 03 configures institutional SSO; **the learner-facing SSO sign-in path is not built** |
| B3 | **Sign up (`AUTH-03`)** | 🔴 **CONFIRMED MISSING** | FRD 4.1.1, 4.1.2 | Batch 04 has a handoff that *"collects nothing and names no provider"* |
| B4 | **Workspace resolution (`AUTH-08`)** | 🔴 **CONFIRMED MISSING** | PM-01, PM-03 | With seven roles and one front door, this is structural |
| B5 | Workspace chooser (`AUTH-09`) | 🟠 **LIKELY MISSING** | `QP-11` | Renders only if multi-role identities exist; costs nothing if not |
| B6 | Password reset (`AUTH-05`) | 🔴 **CONFIRMED MISSING** | Design-supplied; **no FRD requirement** | |
| B7 | Session expired (`AUTH-06`) | 🟠 **LIKELY MISSING** | FRD 10.2.2 · `D-17` | Pattern exists from Review 005; not rebuilt on the platform shell |
| B8 | **Institutional onboarding enquiry (`AUTH-10`)** | 🔴 **CONFIRMED MISSING** | FRD 4.2.1 · `PM29-07` | **Inventoried as NEW at P3 since Review 006. Never built** |

> **Part B is the quietest and most consequential section of this inventory.** Every batch used a clearly-labelled non-product index instead of authentication, which was the right call for a per-flow prototype. **A consolidated product cannot do that**, and a public catalogue makes it worse — the public route's very first action is *"sign in / register / apply"*, and none of those three destinations exists.

# Part C · Tenant onboarding and platform governance

| # | Gap | Class | Basis | Note |
|---|---|---|---|---|
| C1 | **Institution application form** | 🔴 **CONFIRMED MISSING** | FRD 4.2.1 · `PM29-07` | Fields beyond organisation + SPOC are unstated |
| C2 | **Applicant-visible request status** | 🟠 **LIKELY MISSING** | `PM29-07` | The state set is unstated |
| C3 | **Tenant request queue / review / decision** | ⛔ **BLOCKED BY PM** | `PM29-A4` | Exists only if the approver is in-product. **Batch 01's queue + decision + reason + history pattern is a direct fit if so** |
| C4 | **Tenant creation** | 🟠 **LIKELY MISSING** | FRD 4.2.1 · `PM29-07` | Batch 05 `SA-02` lists institutions that **already exist** |
| C5 | **Tenant Admin assignment** | ⛔ **BLOCKED BY PM** | `PM29-22` · **`QD-02`** | Authority directional; **mechanism undefined** — invited? created? imported? mapped? |
| C6 | **Super Admin → tenant content allocation** | 🟠 **LIKELY MISSING** | `PM29-23` | 🔵 The **receiving** end exists (Batch 03 content-access record). The **granting** end does not |
| C7 | **Platform role-holder governance (write)** | ⛔ **BLOCKED BY PM** | `PM29-22` · `QD-02` | Batch 05 `SA-09` is read-only |
| C8 | **Vendor / Academic Reviewer administration** | ⛔ **BLOCKED BY PM** | `PM29-24` | Scope unknown: global, per course, or per experiment |
| C9 | Commercial branch — internal free vs external paid | ⛔ **BLOCKED BY PM** | `PM29-08` · `PM29-A7` · `QP-04` | |
| C10 | Audit trail outside content governance | 🟠 **LIKELY MISSING** | Batch 05 `P-05` / `GP-4` | **Now larger** — tenant approvals and content allocations are exactly the kind of decision an audit trail would need to cover. Still no source |

# Part D · Tenant administration

| # | Gap | Class | Basis | Note |
|---|---|---|---|---|
| D1 | **Manual person creation** | 🔴 **CONFIRMED MISSING** | `PM29-10` | Batch 03 `DA-04`: no such control exists |
| D2 | **Bulk CSV import** | 🔴 **CONFIRMED MISSING** | `PM29-10` | Needs upload → validate → per-row error report → commit → outcome |
| D3 | **CSV schema** | ⛔ **BLOCKED BY PM** | `PM29-25` | **A mandatory-field list is a validation contract.** Not set from handwriting |
| D4 | **CSV vs ERP write conflict** | 🔴 **CONFIRMED MISSING**, and **newly reachable** | `QD-01` · FRD 7.1.1, 7.2.1 | ERP is authoritative and sync overwrites. A manual/CSV route creates a real conflict that has been open since Review 006 |
| D5 | **Course ID / Code** | 🟠 **LIKELY MISSING** | `PM29-15` | No such field in any source. *"Varies by institution"* suggests it belongs to the **tenant mapping** |
| D6 | Semester on a person record | ⛔ **BLOCKED BY PM** | `PM29-25` | Only v5 appearance is a **Phase-2** version-locking line |
| D7 | Learner content-assignment owner | ⛔ **BLOCKED BY PM** | `PM29-A3` | `DA-07` holds meanwhile |
| D8 | Institutional SSO configuration | ✅ **ALREADY COVERED** | Batch 03 `INA-10` | |
| D9 | Institution data / ERP connection, schedule, history, retry | ✅ **ALREADY COVERED** | Batch 03 `INA-11`/`INA-12` | |
| D10 | People directory, person detail, academic structure | ✅ **ALREADY COVERED** | Batch 03 `INA-02`…`INA-05` | |
| D11 | Content access + eligibility + mapping | ✅ **ALREADY COVERED** | Batch 03 `INA-06`…`INA-08` | 🔵 Origin actor now supplied by `PM29-23` |
| D12 | Seat / cap / utilisation | ⏭ **NOT APPLICABLE** | `PM29-20` · `OQ-03` | **No model exists.** Correctly absent from Batches 03 and 05 |

# Part E · Faculty

| # | Gap | Class | Basis | Note |
|---|---|---|---|---|
| E1 | **Faculty view of tenant experiments** | 🔴 **CONFIRMED MISSING** | `PM29-11` | `FAC-02`/`FAC-03` inventoried, **not built**. Batch 04's catalogue is a reuse candidate |
| E2 | **Faculty learner progress / usage** | 🟠 **LIKELY MISSING** | `PM29-11` · FRD 8.1.4 | `FAC-05`/`FAC-10` inventoried, not built. Batch 02 kept it minimal per PM-11 |
| E3 | **"Analytics"** | ⛔ **BLOCKED BY PM** | `PM29-11` vs **PM-11** | **No metric invented** |
| E4 | Assessment builder · question bank · AI drafts | ✅ **ALREADY COVERED** | Batch 02 | |
| E5 | Course assignment (`FAC-04`) | 🟠 **LIKELY MISSING** | FRD 8.1.4 | Overlaps `PM29-A3` |
| E6 | Descriptive grading | ⛔ **BLOCKED BY PM** | **`QP-02` HIGH** | Owner, turnaround and rubric all undefined. **Still the only open item that can strand a learner** |

# Part F · Learner

| # | Gap | Class | Basis |
|---|---|---|---|
| F1 | My Learning · experiment detail · resources · web simulation | ✅ **ALREADY COVERED** | Batches 01, 02 |
| F2 | Entitlement-aware device access, mechanism-neutral | ✅ **ALREADY COVERED** | Batch 01 `LRN-15` |
| F3 | Assessment attempt · result · pending evaluation | ✅ **ALREADY COVERED** | Batch 02 |
| F4 | Progress and completion | ✅ **ALREADY COVERED** | Batch 01 `LRN-13`, Batch 02 |
| F5 | Institutional eligibility reaching the learner | ✅ **ALREADY COVERED** | Batch 03 `INA-13` |
| F6 | **Device binding + replacement request (`LRN-16`, `LRN-17`)** | 🔴 **CONFIRMED MISSING** | FRD 2.4.1, 2.4.2 — Phase 1. 🟠 **The approval end exists** (Batch 05 `SA-06`/`SA-07`); **the learner end does not.** A half-built cross-plane workflow |
| F7 | MR format support | ✅ **ALREADY COVERED** — keep | Batch 01. `PM29-14`'s omission is not a removal |

# Part G · Commerce

| # | Gap | Class | Basis |
|---|---|---|---|
| G1 | **B2B request state / request list** | ⛔ **BLOCKED BY PM** | `PM29-A6` |
| G2 | **B2B transaction mechanism** | ⛔ **BLOCKED BY PM** | `PM29-A6` · `PM29-08` · `QP-04` |
| G3 | **B2C access period selection** | 🟠 **LIKELY MISSING** | `PM29-19` confirmed; ⚪ renewal/expiry undefined; ⚪ B2C is secondary |
| G4 | **B2C authorisation before payment** | ⛔ **BLOCKED BY PM** | `PM29-A5` |
| G5 | **Bundle** | ⛔ **BLOCKED BY PM** | `PM29-A2` |
| G6 | Bundle overlap pricing | ⛔ **BLOCKED BY PM** | `Q-45` · Batch 04 `DA-10` |
| G7 | Technology-variant pricing | ⛔ **BLOCKED BY PM** | `PM29-18` |
| G8 | B2C checkout · payment · outcomes · access history | ✅ **ALREADY COVERED** | Batch 04. 🔵 Entry position superseded |
| G9 | Refund / cancellation / revocation | ⛔ **BLOCKED BY PM** | `QP-18` — *"None stated or implied"* |
| G10 | Receipt / invoice format | ⛔ **BLOCKED BY PM** | `QP-17` |

# Part H · Content governance

| # | Gap | Class | Basis |
|---|---|---|---|
| H1 | Vendor submission → academic validation → readiness → publish, with return loops and history | ✅ **ALREADY COVERED** | Batch 01 |
| H2 | **Version release ownership** | ⛔ **BLOCKED BY PM** | `PM29-A1` · Batch 05 `D-01` |
| H3 | Super Admin return at the publication gate | ⛔ **BLOCKED BY PM** | `QP-26` — untouched |
| H4 | **Experiment ↔ Course mapping at submission** | 🟠 **LIKELY MISSING** | `PM29-17`. No course field in `VND-02`/`VND-04`; **who maps it is unstated** |
| H5 | Curriculum validation rubric | ⛔ **BLOCKED BY PM** | `QD-08` · `ARV-04` PENDING |
| H6 | Module metadata schema | ⛔ **BLOCKED BY PM** | `QD-07` |
| H7 | Captions / transcripts / audio description ownership | ⛔ **BLOCKED BY PM** | **`QX-03` HIGH** — **now sharper**, because `PM29-03` puts video on a **public** page |

# Part I · Cross-cutting

| # | Gap | Class | Basis |
|---|---|---|---|
| I1 | **Terminology consolidation** — `Module` vs `Experiment` | 🔴 **CONFIRMED — measured, shipped inconsistency** | `PM29-16`. Batches disagree; **Batch 04 disagrees with itself** |
| I2 | Role label — `Institute Admin` vs `Tenant Admin`, **and the one-role reading itself** | ⛔ **BLOCKED BY PM** | `PM29-09` — directional, not read back |
| I3 | `Student` vs `Learner` as product terms | ⛔ **BLOCKED BY PM** | `PM29-A8` |
| I4 | **Unified navigation across nine workspaces** | 🟠 **LIKELY MISSING** | `PM29-01`. Each batch has its own nav; no unified IA exists |
| I5 | Single design-system source of truth | 🟠 **LIKELY MISSING** | Batches 02–05 each carry a **byte-identical copy** of the Batch-01 stylesheet, for Safari `file://` reasons. Correct per batch; **needs one source on consolidation** |
| I6 | **Responsive / reflow** | 🟠 **LIKELY MISSING — and now sharper** | **`QX-01`, `QX-02` HIGH.** Desktop-first at 1440px was set for one workspace. **A public catalogue is not a desktop-only surface in practice** |
| I7 | Notifications | ⏭ **LATER** | No Phase-1 FRD requirement |
| I8 | Certification | ⏭ **LATER PHASE** | PM-12 — Phase 2 |
| I9 | Analytics dashboards | ⏭ **LATER PHASE** | PM-11; FRD 8.2.x / 11.3.x / 11.4.x |
| I10 | Device registration / remote management | ⏭ **LATER PHASE** | FRD 2.5.x / 2.6.x — Phase 2 |
| I11 | Custom roles | ⏭ **LATER PHASE** | FRD 8.3.x — Phase 3 |

---

# Roll-up

| Class | Count |
|---|---|
| 🔴 **CONFIRMED MISSING** | **17** |
| 🟠 **LIKELY MISSING** | **15** |
| ⛔ **BLOCKED BY PM** | **23** |
| ✅ **ALREADY COVERED** | **17** |
| 🔵 **SUPERSEDED** *(placement, not artefact)* | **2** |
| ⏭ **LATER PHASE** | **6** |

## The seventeen confirmed-missing items

**These need no PM answer to know they are missing** — though several need one before they can be *designed*.

**Public and entry (6):** landing · catalogue browse · course page · experiment detail · learning outcomes · entry fork
**Authentication (5):** sign in · SSO redirect/return · sign up · workspace resolution · password reset · institutional onboarding enquiry *(6 rows, 5 distinct areas)*
**Tenant administration (2):** manual person creation · bulk CSV import
**Faculty (1):** view of tenant experiments
**Learner (1):** device binding + replacement request — the **learner** end
**Cross-cutting (1):** terminology consolidation
**Data (1):** CSV vs ERP write conflict

## What the numbers say

- **23 blocked items against 17 confirmed-missing ones.** More of this platform is waiting on twelve answers than is waiting on design capacity. **That ratio is the single strongest argument for holding the line until Monday.**
- **17 already-covered items** across five batches. The learning core and the governance chain are genuinely finished.
- **Nothing is superseded as an artefact.** The only two 🔵 rows are *placements* — Batch 04's catalogue position and Batch 05's read-only stance. Both artefacts survive.
- **Authentication is the quiet blocker.** It is not new, it is not controversial, and it is not blocked by anything — and it now sits directly in the path of the highest-priority new journey.
