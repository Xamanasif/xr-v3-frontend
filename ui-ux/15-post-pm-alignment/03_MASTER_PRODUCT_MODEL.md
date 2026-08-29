# 03 — Master Product Model

| | |
|---|---|
| **Status** | 🟠 **ALIGNMENT MODEL — DRAFT.** One system view assembled from confirmed sources plus 29 Aug direction |
| **Created** | 29 August 2026 |
| **Rule** | Anything unresolved is drawn as **⚪ OPEN** on the model itself, never smoothed over |

---

## 1 · The one-sentence model

> **One platform. One published content pool. Two entry contexts that reach it by different routes. One learning core that both routes converge into.**

The learning core is the part that is finished. The routes into it are the part that is not.

---

## 2 · The master model

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  PUBLIC EXPERIENCE                                    PM29-02 · 🟣 FRD EXTENSION ║
║                                                                              ║
║   Landing  →  Catalogue  →  Programme ⚪ →  Course  →  Experiment            ║
║                                                          │                   ║
║                                              Public experiment detail        ║
║                                              · description                   ║
║                                              · learning outcomes             ║
║                                              · preview / video               ║
║                                              · supported technology          ║
║                                                  AR · VR · Web  (MR ⚪)      ║
║                                              · device / runtime requirement  ║
║                                              · access information            ║
║                                              · ⚪ PRICING VISIBILITY OPEN     ║
╚══════════════════════════════════════════════════════════════════════════════╝
                                    │
                    ┌───────────────┴────────────────┐
                    ▼                                ▼
        ┌───────────────────────┐        ┌───────────────────────┐
        │ INSTITUTION / TENANT  │        │      INDIVIDUAL       │
        │   ▶ PRIMARY FOCUS     │        │  ▷ SECONDARY ROLLOUT  │
        │      PM29-05          │        │      PM29-05          │
        └───────────┬───────────┘        └───────────┬───────────┘
                    │                                │
════════════════════╪════════════════════════════════╪════════════════════
   B2B · PRIMARY    │                 B2C · SECONDARY│
════════════════════╪════════════════════════════════╪════════════════════
                    │                                │
   ① Select desired content from the public catalogue │
      ⚪ MECHANISM OPEN — request list? cart?         │  ① Registration /
         PM29-A6                                     │     authorisation
                    │                                │     ⚪ IS APPROVAL
   ② Application / request                           │        REQUIRED BEFORE
      organisation details · SPOC / contact          │        PAYMENT?
      FRD 4.2.1 · PM29-07                            │        PM29-A5 ⚪
                    │                                │
   ③ Platform validation                             │  ② Access period
      ⚪ WHO VALIDATES?  PM29-A4                      │     Monthly ·
                    │                                │     Quarterly ·
   ④ Authorisation / approval                        │     Yearly
      ⚪ SAME ACTOR?  PM29-A4                         │     NO Lifetime
                    │                                │     PM29-19 ✅
        ┌───────────┴───────────┐                    │
        ▼                       ▼                    │  ③ Payment
   INTERNAL                EXTERNAL                  │     9.1.1 · 9.1.2
   (BITS / WILP /          institution               │     success ·
    education group)            │                    │     declined ·
        │                       │                    │     indeterminate
   access may be          commercial /               │
   provided WITHOUT       payment cycle              │  ④ Access created
   payment                      │                    │     9.2.1 automatic
        │                       │                    │
   ⚪ WHICH INSTITUTION IS WHICH?                     │
      PM29-08 · PM29-A7                              │
        └───────────┬───────────┘                    │
                    ▼                                │
   ⑤ TENANT CREATED / ACCESS SET UP                  │
      FRD 4.2.1 · 1.3.1 tenant isolation             │
                    │                                │
   ⑥ TENANT CONTENT ALLOCATED                        │
      ▶ SUPER ADMIN decides which experiments        │
        this tenant receives          PM29-23 🔵     │
      ⚪ ALLOCATION UNIT? experiment / course /       │
         package                                     │
                    │                                │
   ⑦ TENANT ADMIN                                    │
      · manages Faculty and Students   PM29-10 🔵    │
      · manual creation  +  bulk CSV   PM29-10 🔵    │
        ⚪ CSV SCHEMA — PM29-25                       │
      · institutional SSO              FRD 4.2.2 ✅  │
      · institution data / ERP         FRD 7.1.x ✅  │
                    │                                │
        ┌───────────┴──────────┐                     │
        ▼                      ▼                     │
   ⑧ FACULTY              ⑨ STUDENT                  │
   · sees tenant           · sees experiments        │
     experiments 🔵          made available          │
   · builds assessments    · progress · completion   │
     PM-08 · PM-15 ✅                                │
   · sees usage / progress                           │
     ⚪ "analytics" vs PM-11                          │
        │                      │                     │
        └──── ⚪ WHO ASSIGNS ───┘                     │
              AN EXPERIMENT TO                       │
              A STUDENT/GROUP?                       │
              PM29-A3                                │
                               │                     │
                               ▼                     ▼
              ╔═══════════════════════════════════════════════════╗
              ║        SHARED LEARNING CORE — CONVERGENCE         ║
              ║        identical for both routes                  ║
              ║                                                   ║
              ║   My Learning  →  Course  →  Experiment           ║
              ║        │                                          ║
              ║   Learning resources  →  Simulation               ║
              ║        (PDF · video)      Web in browser          ║
              ║                           AR / VR / MR on device  ║
              ║                           entitlement-aware       ║
              ║                           PM-05, mechanism ⚪      ║
              ║        │                                          ║
              ║   Assessment  →  Result  →  Progress · Completion ║
              ║   configuration-driven, PM-08 · PM-15             ║
              ║                                                   ║
              ║        ✅ DESIGNED — Batches 01 + 02              ║
              ╚═══════════════════════════════════════════════════╝
```

---

## 3 · The content supply side — where the catalogue comes from

The model above starts at *"a catalogue exists"*. This is what fills it.

```
CENTRAL CONTENT PLANE                                  PM-13 ✅
─────────────────────────────────────────────────────────────────

  VENDOR ──submit──▶ ACADEMIC ──validate──▶ CONTENT ──PUBLISH──▶ PUBLISHED
   1.4.1             REVIEWER               MANAGER              CONTENT
     ▲                1.4.2                  1.4.3                 POOL
     │                  │                      │
     │◀── changes ──────┘                      │
     │    required                             │
     │◀── changes required ────────────────────┘
     │         PM-14 · comments · reason
     │
     └── correct & resubmit ──▶ re-enters the returning gate
         1.4.5: the Vendor can NEVER publish

  ✅ DESIGNED — Batch 01.  Publication owner = CONTENT MANAGER (PM-16/17/18)

  ⚪ AFTER PUBLICATION — VERSION RELEASE / HOLD
     FRD 2.3.2 · Super Admin · Batch 05 SA-04/SA-05
     ⚪ OWNERSHIP AMBIGUOUS AFTER 29 AUG — PM29-A1 · PQ-01

                              │
                              ▼
        ┌─────────────────────┴──────────────────────┐
        ▼                                            ▼
  PUBLIC CATALOGUE                          TENANT ALLOCATION
  every visitor                             Super Admin decides
  PM29-02 🔵 · 🟣 NEW                        which experiments each
                                            tenant receives
                                            PM29-23 🔵 · 🟣 NEW STAGE
```

### The one structural change 29 August makes to the platform model

**A stage was inserted that did not previously exist.**

| Before (Review 006 / FRD) | After (as directed 29 Aug) |
|---|---|
| published → institutional licence over **stream-mapped packages** (6.2.1) → ERP stream assignment (7.2.3) → Faculty assignment (8.1.4) → learner | published → **Super Admin allocates experiments to a tenant** (`PM29-23`) → the tenant's available set → ⚪ tenant-side assignment → learner |

The FRD never said **who** decides which content an institution may use. `PM29-23` names Super Admin. **That is the single most consequential thing this meeting produced**, because it turns an unowned blank into an owned stage — and because Batch 03 was built with exactly that blank left open, waiting to be filled.

---

## 4 · Confirmed / directional / open — the model's own legend

| Layer | Status | Basis |
|---|---|---|
| Published content pool and its governance chain | ✅ **CONFIRMED + DESIGNED** | FRD 1.4.1–1.4.5 · PM-14 · PM-16/17/18 · Batch 01 |
| Shared learning core | ✅ **CONFIRMED + DESIGNED** | FRD 3.1.x, 8.1.5 · PM-09 · Batches 01 + 02 |
| Two planes: central content / tenant | ✅ **CONFIRMED** | PM-13 |
| Institutional configuration — SSO, institution data | ✅ **CONFIRMED + DESIGNED** | FRD 4.2.2, 7.1.x · PM-10 · Batch 03 |
| Institution content access → eligibility → learner | ✅ **DESIGNED**, ⚪ **origin actor now supplied** | Batch 03 · `PM29-23` |
| Public catalogue and public detail | 🔵 **DIRECTIONAL — NOT DESIGNED** | `PM29-02`, `PM29-03` |
| Two entry contexts | 🔵 **DIRECTIONAL — NOT DESIGNED** | `PM29-06` |
| Tenant application → validation → authorisation → tenant | 🔵 **DIRECTIONAL**, ⚪ **actor open** | `PM29-07`, `PM29-A4` |
| Internal free / external paid branches | 🔵 **DIRECTIONAL**, ⚪ **rule open** | `PM29-08`, `PM29-A7` |
| Super Admin tenant content allocation | 🔵 **DIRECTIONAL**, ⚪ **unit open** | `PM29-23` |
| Tenant Admin people provisioning (manual + CSV) | 🔵 **DIRECTIONAL**, ⚪ **schema open** | `PM29-10`, `PM29-25` |
| B2B transaction mechanism | ⚪ **OPEN** | `PM29-A6` |
| B2C authorisation sequence | ⚪ **OPEN** | `PM29-A5` |
| B2C access periods | ✅ **CONFIRMED**, ⚪ **timing open** | `PM29-19`, `PM29-05` |
| Bundle | ⚪ **OPEN — definition in question** | `PM29-A2` |
| Seat / licence quantity | ✅ **CONFIRMED ABSENT** — no single model | `PM29-20`, `OQ-03` |

---

## 5 · What is deliberately **not** in this model

| Not modelled | Why |
|---|---|
| Any payment sequencing on the B2B side | `PM29-A6` and `PM29-A4` are open. Drawing an order would assert one |
| A cart, a basket or a request list as a **decided** object | `PM29-A6`. Both appear as ⚪ on the diagram; neither is chosen |
| Pricing anywhere | `PM29-04` (public visibility), `PM29-18` (technology pricing), `QP-04` (institutional transaction) all open |
| A seat, cap, quota or capacity figure | `PM29-20` confirms no model exists. Batches 03 and 05 already removed every such figure |
| Certification | PM-12 — Phase 2 |
| Analytics dashboards | PM-11 — deferred; every FRD dashboard is Phase 2/3 |
| A sub-tenant or campus level | `PM29-A7` — BITS/WILP/Goa/Pilani topology unknown. **No source contains such a level** |
| Notifications | No Phase-1 FRD requirement exists |
| Any API, endpoint, payload or schema | Out of scope for this phase by instruction |

---

## 6 · The asymmetry worth naming

Review 006 observed that *"the reframe's real asymmetry is not B2B vs B2C. It is learner vs everyone else."*

**After 29 August the asymmetry has moved again:**

> **The learning core is finished. The governance chain is finished. What is missing is everything that happens before a person has an account — and everything that decides which content reaches which tenant.**

| Layer | State |
|---|---|
| **Learning core** (resources → simulation → assessment → progress) | ✅ Designed twice over, across two batches, and PM-approved (PM-09) |
| **Content governance** (submit → validate → publish) | ✅ Designed end to end, with return loops |
| **Institutional administration** (people, structure, access, SSO, ERP) | ✅ Designed — **except people provisioning** |
| **Platform administration** (Super Admin) | 🟠 Designed **conservatively**, now known to be too small |
| **Content-to-tenant allocation** | 🔴 **Named on 29 Aug. Not designed anywhere** |
| **People provisioning** (manual + CSV) | 🔴 **Named on 29 Aug. Not designed anywhere** |
| **Public discovery and entry** | 🔴 **Named on 29 Aug. Not designed anywhere** |
| **Authentication** | 🔴 **Never designed in any batch** — `AUTH-01…09` are all still NEW |

**Four red rows. Three of them were created by this meeting; the fourth has been outstanding since Review 006 and is now blocking, because a public entry point has to hand off to a sign-in that does not exist.**
