# 04 — Role and Authority Model

| | |
|---|---|
| **Status** | 🟠 **ALIGNMENT MODEL — DRAFT** |
| **Created** | 29 August 2026 |
| **Governing rule** | **Seven roles. No eighth role is created.** PM-07 fixed the set; FRD 8.3 (custom roles) is **Phase 3** and cannot be used to add one |

---

## 1 · The role tree

```
                        ┌─────────────────────┐
                        │    SUPER ADMIN      │   platform-wide
                        │  FRD 8.1.1 · 1.3.5  │   spans both planes
                        └──────────┬──────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
  ══════▼══════════════════  ══════▼═══════════════  ═════════▼═════════
   CENTRAL CONTENT PLANE      TENANT PLANE            INDIVIDUAL CONTEXT
   PM-13 ✅                   PM-13 ✅                 FRD 1.3.2 · PM-13
  ═══════════════════════    ═══════════════════     ═══════════════════

   ┌─────────────────┐        ┌──────────────────────┐   ┌──────────────┐
   │ CONTENT MANAGER │        │  TENANT ADMIN   /    │   │  INDIVIDUAL  │
   │  FRD 8.1.2      │        │  INSTITUTE ADMIN     │   │  LEARNER     │
   │  publishes      │        │  FRD 8.1.3           │   │  (B2C)       │
   │  PM-16/17/18    │        │  🔵 PM29-09 reading  │   │              │
   └─────────────────┘        │  ⚪ LABEL PENDING     │   │ a CONTEXT of │
   ┌─────────────────┐        └──────────┬───────────┘   │ the Learner  │
   │ ACADEMIC        │                   │               │ role, NOT an │
   │ REVIEWER        │        ┌──────────┴───────────┐   │ eighth role  │
   │ FRD 1.4.2·PM-07 │        ▼                      ▼   └──────────────┘
   └─────────────────┘   ┌─────────┐         ┌──────────────┐
   ┌─────────────────┐   │ FACULTY │         │ STUDENT /    │
   │ VENDOR          │   │ 8.1.4   │         │ INSTITUTIONAL│
   │ FRD 1.4.1·1.4.5 │   └─────────┘         │ LEARNER      │
   │ PM-07           │                       │ FRD 8.1.5    │
   │ can NEVER       │                       │ ⚪ STUDENT vs │
   │ publish (1.4.5) │                       │   LEARNER    │
   └─────────────────┘                       │   PM29-A8    │
                                             └──────────────┘
```

### How this compares with the handwritten PM diagram

The PM's diagram is:

```
Super Admin → Tenant Admin / Institute Admin → Faculty → Student
Super Admin → Content Manager · Academic Reviewer · Vendor · Learner
```

**It agrees with the confirmed model in every structural respect.** Super Admin sits above both plane groups (FRD 1.3.5 · PM-13); the tenant chain runs Tenant Admin → Faculty → Student (FRD 8.1.3 → 8.1.4 → 8.1.5); the content-side roles hang off Super Admin (PM-13).

**Two things the diagram implies that the sources do not settle:**

| Implication | Status |
|---|---|
| *Learner* (under Super Admin) and *Student* (under Tenant Admin) are **two different things** | ⚪ **OPEN** — `PM29-A8`. Every source treats them as **one role in two contexts** |
| Super Admin has a **direct** relationship with the Learner | 🔵 Partly supported: FRD 2.4.2 device-replacement approval **is** a direct Super Admin → B2C learner action, and it is the platform's only Phase-1 cross-plane approval. Nothing broader is established |

---

## 2 · Role aliases and contexts — stated explicitly

| Concept | Names in use | Status |
|---|---|---|
| The tenant-plane administrator | **Institute Admin** (FRD 8.1.3, all sources, Batch 03) · **Tenant Admin** (PM, 29 Aug) | 🔵 **Current interpretation — the same formal role concept.** `PM29-09`, **PM-DIRECTION, HIGH CONFIDENCE, not read back.** ⚪ Final product label pending — `PQ-09` |
| The learning consumer | **Student** (FRD 8.1.5) · **Learner** (all downstream artefacts) · **Individual Learner** / **B2C learner** (context) | **ONE role.** ⚪ Whether the two words become **two product terms** is pending — `PM29-A8` / `PQ-12` |
| The individual commercial context | **B2C** | **A context, not a role.** `PM_CONFIRMED_BASELINE_2026-08-18` §B, restated in Batch 04 |
| The institutional commercial context | **B2B** | A context, not a role |
| The content-side reviewer | **Academic Reviewer** · *"BITS Pilani academic team"* (FRD 1.4.2) | One role — PM-07 |

> **No eighth role is created by anything in the 29 August meeting.** The system still has **seven formal roles**. *Tenant Admin* is read as a label for an existing role, not a new one — and that reading (`PM29-09`) is high-confidence **PM direction awaiting read-back**, not a confirmed product decision. *Vendor*, *Academic Reviewer*, *Content Manager* and *Learner* on the PM's diagram are the same four roles the sources already carry.

---

## 3 · Authority by role — confirmed, directional, open

Legend: ✅ confirmed & designed · 🔵 directional (29 Aug) · ⚪ open · ⛔ prohibited or out of phase

### 3.1 Super Admin

| Capability | Status | Basis |
|---|---|---|
| Cross-tenant governance and operational oversight (read) | ✅ Designed — Batch 05 `SA-02`/`SA-03` | FRD 1.3.5 · PM-13 |
| Version release / hold | ✅ Designed — Batch 05 `SA-04`/`SA-05` · ⚪ **ownership now ambiguous** | FRD 2.3.2 · `PM29-A1` |
| Device-replacement approval | ✅ Designed — Batch 05 `SA-06`/`SA-07` | FRD 2.4.2 |
| Licence visibility (no seat figure) | ✅ Designed — Batch 05 `SA-08` | FRD 8.1.1 · 6.2.1 · `PM29-20` |
| **Decide which experiments a tenant receives** | 🔵 **NEW — not designed** | `PM29-23` |
| **Institution / tenant governance (write)** | 🔵 **NEW** · ⚪ actions undefined | `PM29-22` |
| **Define / authorise the Tenant Admin** | 🔵 **NEW** · ⚪ mechanism undefined (`QD-02`) | `PM29-22` |
| **Platform role governance (write)** | 🔵 **NEW** — Batch 05 `SA-09` is read-only today | `PM29-22` · `PM29-24` |
| **Vendor / Academic Reviewer governance** | 🔵 **NEW** · ⚪ scope undefined | `PM29-24` |
| Approve a tenant application | ⚪ **OPEN — actor not named** | `PM29-A4` |
| Publish content | ⛔ **Not Super Admin** | PM-16/17/18 |
| Return a submission at the publication gate | ⚪ **OPEN** | `QP-26` |
| Grant / revoke an individual **learner** entitlement | ⚪ **Still not established** | FRD 8.1.3 names Institute Admin · `OQ-04` |
| Assign courses / experiments **to learners or cohorts** | ⚪ **Still not established** | FRD 8.1.4 names Faculty |
| Custom roles · cross-tenant analytics dashboards · bundle creation · pricing | ⛔ Phase 2 / Phase 3 | FRD 8.3.x · 8.2.x/11.3.x · 6.3.x |

> **The tenant/learner altitude distinction is load-bearing.** `PM29-23` gives Super Admin authority over **what a tenant may use**. It says nothing about **which learner gets what**, and two FRD requirements assign that elsewhere. Collapsing the two would grant a capability the PM did not describe.

### 3.2 Tenant Admin / Institute Admin

| Capability | Status | Basis |
|---|---|---|
| Institutional SSO configuration | ✅ Designed — Batch 03 `INA-10` | FRD 4.2.2 · PM-10 |
| Institution data / ERP connection, schedule, history, retry | ✅ Designed — Batch 03 `INA-11`/`INA-12` | FRD 7.1.1, 7.1.2, 7.2.1 |
| View people, academic structure, content access | ✅ Designed — Batch 03 `INA-02`…`INA-08` | FRD 8.1.3, 7.2.3 |
| Institution profile | ✅ Designed — Batch 03 `INA-09` | FRD 4.2.1 |
| **Manual creation of Faculty and Students** | 🔵 **NEW — not designed** (Batch 03 `DA-04`: no such control) | `PM29-10` |
| **Bulk CSV import of people** | 🔵 **NEW — not designed** · ⚪ schema open | `PM29-10` · `PM29-25` |
| Assign an experiment to a student or group | ⚪ **OPEN — owner undecided** | `PM29-A3` · Batch 03 `DA-07` |
| Course creation in-platform | ⛔ Phase 2 | FRD 3.4.x |
| Assessment authoring | ⚪ **Explicitly not granted** | PM-15 · `QP-08` |
| Device registration / management | ⛔ Phase 2 | FRD 2.5.x, 2.6.x |
| Seat / cap management | ⛔ **No model exists** | `PM29-20` · `OQ-03` |

### 3.3 Faculty

| Capability | Status | Basis |
|---|---|---|
| Question bank — spreadsheet upload, editor | ✅ Designed — Batch 02 `FAC-08` | FRD 5.1.1 |
| AI-assisted question drafts, faculty-reviewed | ✅ Designed — Batch 02 `FAC-09` | FRD 5.1.2 |
| Assessment configuration and assignment | ✅ Designed — Batch 02 `FAC-06`/`FAC-07` | PM-08 · PM-15 · FRD 5.2.x, 5.3.x |
| **See the experiments available to the tenant** | 🔵 **NEW — no Faculty browse surface exists** | `PM29-11` |
| See student usage / progress | 🟠 **Minimally designed** (Batch 02, kept small per PM-11) | FRD 8.1.4, 11.1.x, 11.2.x |
| *"Analytics"* | ⚪ **OPEN — points against PM-11.** No metric defined | `PM29-11` · `PQ-14` |
| Assign an experiment to a student or group | ⚪ **OPEN — owner undecided** | `PM29-A3` |
| Grade descriptive answers | ⚪ **OPEN — owner undefined since Review 006** | `QP-02` HIGH |
| Course creation · class performance reports | ⛔ Phase 2 | FRD 3.4.x · 11.3.1 |

### 3.4 Student / institutional Learner · Individual Learner

| Capability | Status | Basis |
|---|---|---|
| See entitled experiments; consume learning content | ✅ Designed — Batch 01 `LRN-02`, Batch 03 `INA-13` | FRD 8.1.5 |
| Learning resources → simulation → assessment → completion | ✅ Designed — Batches 01 + 02 | PM-09 · FRD 3.1.2 |
| Web simulation in browser | ✅ Designed | FRD 1.2.1 |
| AR / VR / MR access on device, entitlement-aware | ✅ Designed, mechanism-neutral — Batch 01 `LRN-15` | PM-05 · FRD 2.2.2, 10.1.2 |
| Progress and completion | ✅ Designed — Batch 01 `LRN-13` | FRD 11.1.x, 11.2.x |
| Public discovery before login | 🔵 **NEW** | `PM29-02` |
| Individual access with a period | ✅ Period set confirmed · ⚪ not designed | `PM29-19` |
| Device binding · replacement request | 🟠 Half-designed — Batch 05 has the approval end (`SA-07`); the **learner end** (`LRN-16`/`LRN-17`) is not built | FRD 2.4.1, 2.4.2 |
| Author or configure an assessment | ⛔ **Never**, in either context | PM-15 · matrix `F12` |
| See the correct-answer key | ⛔ **Never** | `D-25` · matrix `F11` |

### 3.5 Content Manager · Academic Reviewer · Vendor

| Role | Confirmed authority | 29 Aug effect |
|---|---|---|
| **Content Manager** | Readiness review (1.4.3) · metadata (8.1.2) · request changes (PM-14) · **publish** (PM-16/17/18) | ⚪ Version-release relationship now ambiguous (`PM29-A1`) · 🔵 Governed by Super Admin (`PM29-24`), scope open |
| **Academic Reviewer** | Academic validation (1.4.2) · approve or request changes (PM-14) | 🔵 Governed / possibly assigned per content by Super Admin (`PM29-24`), scope open |
| **Vendor** | Submit builds and metadata (1.4.1) · correct and resubmit (PM-14) · **can NEVER publish (1.4.5)** | 🔵 Governed by Super Admin (`PM29-24`), scope open. **The 1.4.5 prohibition is untouched** |

---

## 4 · The four hard authority boundaries — all still hold

These survive 29 August unchanged. Any consolidated design must preserve them.

1. **The Vendor can never publish** — FRD **1.4.5**, the only explicit role prohibition in the document.
2. **Analytics never cross a tenant** — FRD **1.3.4**, except Super Admin governance access (**1.3.5**).
3. **Institutions cannot modify or redistribute content** — FRD **1.1.4**.
4. **A learner never authors or configures an assessment, and never sees the answer key** — **PM-15** (`F12`) and **`D-25`** (`F11`).

**One boundary changed on 25 August and is unchanged by 29 August:** publication is the **Content Manager's** (PM-16/17/18), not the Super Admin's, despite FRD 1.4.4.

---

## 5 · The two terminology decisions, and why they are not cosmetic

| Decision | If confirmed one way | If confirmed the other |
|---|---|---|
| **`PM29-09`** Tenant Admin **or** Institute Admin | *Institute Admin* — nothing changes; it is what FRD 8.1.3 says and what Batch 03 built | *Tenant Admin* — a mechanical rename across every Batch-03 screen, route, document and prototype string, plus the role matrix and IA |
| **`PM29-A8`** Student **and** Learner as **one** term | One term — the status quo; the shared learning core keeps one vocabulary | **Two** terms — the label becomes **context-dependent**, so every shared learner surface needs a context-aware term. The two contexts share the *entire* learning core (Review-006 `06` Part 1), so this is a change to the largest, most finished part of the product |

> **Both renames must happen exactly once, after confirmation.** Doing either speculatively risks doing it twice — and the second pass would touch finished, QA-passed batches.

**One prior question sits underneath `PM29-09`, and it is not a terminology question.** Before the label can be chosen, the reading that *Tenant Admin* and *Institute Admin* are **the same formal role concept** has to be read back. That reading is `PM29-09` — **PM-DIRECTION, HIGH CONFIDENCE, not yet confirmed.** If the two names were instead meant to distinguish two positions, the tenant plane changes shape and the label question does not arise in this form. `PQ-09` therefore asks both parts, in that order.
