# 06 — B2B Primary Journey

| | |
|---|---|
| **Status** | 🟠 **ALIGNMENT MODEL — DRAFT** |
| **Priority** | ▶ **PRIMARY ROLLOUT FOCUS** — `PM29-05` |
| **Created** | 29 August 2026 |
| **Rule** | Every unresolved step is labelled ⚪ **on the journey itself**. No sequencing is asserted where the PM left one open |

---

## 1 · The journey

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ① PUBLIC DISCOVERY                                    🔵 PM29-02 · 🟣 NEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   A visitor from an institution browses without signing in.
   Catalogue → Course → Experiment → public detail
   Sees: description · learning outcomes · preview · supported technology ·
         device requirement · access information
   ⚪ PRICING VISIBILITY — PM29-04, do not invent
   STATUS: 🔴 NOT DESIGNED ANYWHERE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ② THE INSTITUTION IDENTIFIES DESIRED CONTENT                        ⚪ OPEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   The visitor marks what the institution wants.

   ⚪ THE MECHANISM IS NOT DECIDED — PM29-A6
      · add-to-request / request list   ← strong candidate, not confirmed
      · direct cart → checkout          ← PM explicitly said B2B may NOT
                                          behave this way
      · a plain enquiry naming nothing  ← the FRD's 4.2.1 shape
   STATUS: 🔴 BLOCKED. Not designed. → PQ-06

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ③ APPLICATION / REQUEST                        🔵 PM29-07 · FRD 4.2.1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Organisation information · SPOC / contact information · submission
   ⚪ FIELDS BEYOND ORGANISATION + SPOC ARE NOT STATED
   Inventory row exists and was never built: AUTH-10, NEW, P3
   STATUS: 🔴 NOT DESIGNED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ④ PLATFORM VALIDATION / REVIEW                          🔵 PM29-07 · ⚪ ACTOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ⚪ WHO VALIDATES? — PM29-A4
      Super Admin? · another platform operations role? · a manual
      organisational process outside the product?
   ⚪ WHETHER REJECTION / PENDING STATES EXIST IS NOT STATED
      FRD 4.2.1 contains no approval, rejection, pending or SLA behaviour
   STATUS: 🔴 BLOCKED → PQ-03

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ⑤ AUTHORISATION                                         🔵 PM29-07 · ⚪ ACTOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ⚪ SAME ACTOR AS ④, OR A SECOND ONE? Not stated.
   STATUS: 🔴 BLOCKED → PQ-03

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ⑥ COMMERCIAL BRANCH                                     🔵 PM29-08 · ⚪ RULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        INTERNAL                              EXTERNAL
   BITS / WILP / education-group        another institution
        │                                     │
   access MAY be provided               commercial / payment cycle
   WITHOUT payment                            │
        │                                     ▼
        │                              ⚪ PRICE CONSTRUCTION — not stated
        │                              ⚪ SEAT QUANTITY — no model (PM29-20)
        │                              ⚪ TECHNOLOGY PRICING — PM29-18
        │                              ⚪ ACCESS DURATION — not stated for B2B
        └──────────────┬───────────────────────┘
                       ▼
   ⚪ WHAT MAKES AN INSTITUTION INTERNAL? — PM29-08 · PM29-A7
      Coupled to whether BITS / WILP / Goa / Pilani are separate tenants,
      one tenant with units, or examples.
   🟣 FRD 6.2.1 says institutions "shall purchase" — no free branch exists
   🟣 Institutional billing (9.3.1, 9.3.2) is PHASE 2 — QP-04 HIGH, open
   STATUS: 🔴 BLOCKED → PQ-11

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ⑦ TENANT CREATED                                  🔵 PM29-07 · FRD 4.2.1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   FRD 4.2.1 acceptance criterion: "An institution can be registered and a
   tenant created, after which institutional configuration becomes available."
   Tenant isolation applies from here — FRD 1.3.1
   ⚪ WHO ASSIGNS THE FIRST TENANT ADMIN? — PM29-22 · QD-02
   STATUS: 🔴 NOT DESIGNED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ⑧ TENANT CONTENT ALLOCATED                                    🔵 PM29-23
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SUPER ADMIN decides which experiments this tenant receives.
   ⚪ ALLOCATION UNIT — experiment? course? package? The PM said experiments
   ✅ THE RECEIVING END ALREADY EXISTS: Batch 03's content-access record,
      whose origin line deliberately carries a date and NO actor.
      PM29-23 supplies that actor.
   STATUS: 🟠 RECEIVING END DESIGNED · GRANTING END NOT DESIGNED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ⑨ TENANT ADMIN SETS THE INSTITUTION UP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ✅ Institutional SSO         FRD 4.2.2 · PM-10   — Batch 03 INA-10
   ✅ Institution data / ERP    FRD 7.1.x, 7.2.1    — Batch 03 INA-11/12
   ✅ Academic structure (view) FRD 7.2.3, 3.2.1    — Batch 03 INA-04/05
   ✅ Content access + eligibility                   — Batch 03 INA-06/07/08
   🔵 PEOPLE PROVISIONING — manual creation + bulk CSV      PM29-10
      🔴 NOT DESIGNED. Batch 03 has NO provisioning control (DA-04)
      ⚪ CSV SCHEMA — PM29-25 → PQ-10
   STATUS: 🟢 MOSTLY DESIGNED · 🔴 PROVISIONING MISSING

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ⑩ CONTENT REACHES PEOPLE                                        ⚪ OWNER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ⚪ WHO ASSIGNS AN EXPERIMENT TO A STUDENT OR GROUP? — PM29-A3
      Tenant Admin? Faculty? Both, at different altitudes?
      Matrix E3 grants "assign to learners or cohorts" to BOTH (8.1.3, 8.1.4)
      OQ-04 (how learner entitlement is assigned) is OPEN
   🟠 Batch 03's eligibility editor is DA-07 — DESIGN ASSUMPTION, REVERSIBLE
   STATUS: 🟠 A REVERSIBLE POSITION EXISTS · OWNER UNDECIDED → PQ-05

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ⑪ FACULTY WORKS WITH THE ALLOWED SET                            🔵 PM29-11
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔴 See experiments available to the tenant — NO FACULTY BROWSE SURFACE
   ✅ Build assessments — Batch 02 FAC-06/07/08/09 (PM-08 · PM-15)
   🟠 See student usage / progress — minimally designed, kept small per PM-11
   ⚪ "analytics" — points against PM-11. NO METRIC DEFINED → PQ-14
   STATUS: 🟠 ASSESSMENT DESIGNED · EXPERIMENT VISIBILITY MISSING

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ⑫ STUDENT LEARNS                                    ✅ FULLY DESIGNED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   My Learning → Experiment → resources → simulation → assessment → progress
   Web in browser · AR / VR / MR on device, entitlement-aware, mechanism-neutral
   Batch 01 (FLOW B) + Batch 02 + Batch 03 INA-13.  PM-09 approved.
   STATUS: 🟢 DESIGNED. Nothing on 29 August changes it.
```

---

## 2 · The stable spine — what holds regardless of Monday

Strip out every open item and this remains:

```
public discovery
   → the institution identifies content it wants
      → a request is made
         → the platform reviews and authorises it
            → a commercial outcome is reached (paid or not)
               → a tenant exists
                  → the tenant receives an allowed set of content
                     → the Tenant Admin manages people and configuration
                        → Faculty and Students work within the allowed set
```

**Every one of those nine stages is high-confidence PM direction.** The open questions are *who does step 4*, *what the mechanism of step 2 is*, *what decides step 5's branch*, and *what unit step 6 allocates. None of them changes the spine.**

> **This is why the spine is safe to document now and the steps are not safe to design now.**

---

## 3 · Everything labelled, in one table

| # | Stage | Confidence | Designed? | Open item |
|---|---|---|---|---|
| ① | Public discovery | 🔵 HIGH | 🔴 No | Pricing visibility (`PM29-04`) |
| ② | Identify desired content | ⚪ OPEN | 🔴 No | **Mechanism** — `PM29-A6` |
| ③ | Application / request | 🔵 HIGH | 🔴 No (`AUTH-10` never built) | Fields beyond org + SPOC |
| ④ | Platform validation | 🔵 HIGH (that it exists) | 🔴 No | **Actor** — `PM29-A4` |
| ⑤ | Authorisation | 🔵 HIGH (that it exists) | 🔴 No | **Actor** — `PM29-A4` |
| ⑥ | Commercial branch | 🔵 HIGH (both exist) | 🔴 No | **Rule**, price, seats, duration — `PM29-08`, `PM29-A7`, `QP-04` |
| ⑦ | Tenant created | 🔵 HIGH | 🔴 No | First Tenant Admin — `QD-02` |
| ⑧ | Tenant content allocated | 🔵 HIGH | 🟠 Receiving end only | **Unit** — `PM29-23` |
| ⑨ | Tenant setup | ✅ / 🔵 | 🟢 Mostly | **People provisioning missing**; CSV schema — `PM29-25` |
| ⑩ | Content reaches people | ⚪ OPEN | 🟠 `DA-07` reversible | **Owner** — `PM29-A3` |
| ⑪ | Faculty | 🔵 HIGH | 🟠 Partly | Experiment browse missing; *analytics* — `PM29-11` |
| ⑫ | Student learns | ✅ CONFIRMED | 🟢 Yes | — |

**Four stages designed or mostly designed. Eight not. Six blocked on a PM answer.**

---

## 4 · What is deliberately absent from this journey

| Absent | Why |
|---|---|
| Any payment step in a fixed position | `PM29-A4` and `PM29-A6` are open. Placing payment asserts a sequence |
| A price, a seat count, a quota, a cap | `PM29-20` confirms no seat model; `QP-04` is open. Batches 03 and 05 already removed every such figure |
| Rejection copy, pending SLAs, escalation | **No source contains any of it.** FRD 4.2.1 has no approval behaviour at all |
| A business-verification provider or step | Would invent an integration no source names |
| An access-duration value for B2B | `PM29-19` gives periods for **individuals**; nothing was said about institutional duration |
| A sub-tenant / campus level | `PM29-A7` — topology unknown, and no source contains such a level |
