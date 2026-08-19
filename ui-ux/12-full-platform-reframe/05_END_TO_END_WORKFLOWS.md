# 05 — End-to-End Workflows

**Review:** 006 — Full Platform Reframe
**Created:** 2026-08-18
**Authority:** PM-02 (workflows for all roles before Figma) · PM-05 · PM-08 · PM-09 · PM-10
**Companion:** `04_PLATFORM_INFORMATION_ARCHITECTURE.md` · `10_FULL_PLATFORM_SCREEN_INVENTORY.md`

---

## Conventions

| Symbol | Meaning |
|---|---|
| `▶` | Actor performs a step |
| `⟶` | System transition |
| `⚠` | **Known gap** — drawn as pending, deliberately not designed |
| `⛔` | Prohibited by an explicit requirement |
| `◆` | Decision point |
| `[ROLE]` | Which workspace the step happens in |

> **Rule for every flow below:** where the PM left a mechanism pending, the flow shows **what must happen**, never **how it is implemented**. Abstract steps are marked and are not a design shortfall — they are the accurate record of an open decision.

---

# FLOW 1 — Content to Production

**Roles:** Vendor → Academic Reviewer → Content Manager → Super Admin
**FRD:** 1.4.1 → 1.4.2 → 1.4.3 → 1.4.4, constrained by 1.4.5
**Status:** **100% NEW.** No step in this flow has ever been designed.
**Priority:** **Highest** — four roles, four gates, zero existing coverage, and the most precisely specified sequence in the FRD.

```
① SUBMISSION                                                    [VND]
   ▶ Vendor creates a submission
   ▶ Uploads XR module build + assets            ⚠ package format PENDING
   ▶ Supplies module metadata
   ▶ Submits to the staging environment                       FRD 1.4.1
   ⟶ Status: WITH ACADEMIC REVIEWER
        │
        ▼
② ACADEMIC VALIDATION                                           [ARV]
   ⟶ Appears in the Academic Reviewer's validation queue
   ▶ Reviews module content, metadata, documentation
   ▶ Assesses alignment with engineering curriculum standards  FRD 1.4.2
        ⚠ criteria are NOT defined anywhere in the FRD
   ◆ Decision
     ├── VALIDATED  ⟶ Status: WITH CONTENT MANAGER
     └── ⚠ REJECT / REQUEST REVISION — no FRD path exists (gap D7)
        │
        ▼
③ CONTENT READINESS APPROVAL                                    [CM]
   ⟶ Appears in the Content Manager's review queue
   ▶ Reviews metadata
   ▶ Reviews documentation
   ▶ Checks platform compatibility                             FRD 1.4.3
   ▶ Reads the academic validation record          (read-only — AR owns it)
   ◆ Decision
     ├── APPROVED  ⟶ Status: READY TO PUBLISH
     └── ⚠ REJECT / REQUEST REVISION — gap D7
        │
        ▼
④ PRODUCTION PUBLISHING                                         [SA]
   ⟶ Appears in the Super Admin's Ready-to-publish queue
   ▶ Publishes to production                                   FRD 1.4.4
   ⛔ No other role may perform this step
   ⟶ Status: PUBLISHED
        │
        ▼
⑤ CONTENT BECOMES AVAILABLE
   ⟶ Enters the B2C catalogue                    [LRN · Explore]
   ⟶ Becomes licensable to institutions          [IAD · SA]
   ⟶ Becomes assignable to learners              [FAC · IAD]
   ⟶ Becomes deliverable to devices              → FLOW 5

VENDOR VISIBILITY THROUGHOUT
   The vendor sees gate position at every stage.
   ⛔ FRD 1.4.5 — the vendor can never publish, at any point.
      Expressed positively as "Awaiting publication", never as a disabled control.
```

### What this flow exposes

| Finding | Detail |
|---|---|
| **Three approvals, three roles, one publisher** | No role holds two adjacent gates. The strongest authority statement in the FRD |
| **⚠ No reject path anywhere** | The FRD describes a forward-only chain. Three review gates, zero defined rejection or resubmission. **Not invented here** |
| **⚠ No validation rubric** | 1.4.2 requires curriculum alignment but never defines the standard |
| **⚠ No audit trail** | Four authority decisions per module, no requirement to record who decided what, when |
| **⚠ No package format** | 2.2.1 says "encrypted asset bundles"; the submission format is undefined |

---

# FLOW 2 — B2B Institutional Learning

**Roles:** Super Admin / Institute Admin → Faculty → Learner
**FRD:** 6.2.1, 6.2.2, 7.2.x, 8.1.3, 8.1.4, 8.1.5, 3.2.2, 11.1.x
**Status:** **Learner half fully designed; entire institutional half is new.**

```
① INSTITUTIONAL LICENCE                                     [SA / IAD]
   ▶ Institution acquires stream-mapped packages              FRD 6.2.1
   ▶ Capped licence by maximum student count                  FRD 6.2.2
   ⚠ HOW the purchase is transacted in Phase 1 is PENDING
      — institutional billing (9.3.x) is Phase 2
   ⟶ Licence exists against the tenant
        │
        ▼
② INSTITUTIONAL CONFIGURATION                                   [IAD]
   ▶ Configures ERP integration                          FRD 7.1.1, 7.1.2
   ▶ Sets synchronization schedule                             FRD 7.2.1
   ▶ Configures institutional SSO                    FRD 4.2.2 · PM-10  → FLOW 6
   ▶ Maps academic streams to licensed packages         FRD 7.2.3, 6.2.1
        │
        ▼
③ AUTOMATED PROVISIONING                                     [system]
   ⟶ ERP sync pushes student records                         FRD 7.1.2
   ⟶ Student accounts auto-created                           FRD 7.2.2
   ⟶ Stream-based packages auto-assigned                     FRD 7.2.3
   ⟶ Entitlements exist before the learner ever signs in
        │
        ▼
④ FACULTY ASSIGNMENT                                            [FAC]
   ▶ Views course structure (from ERP — authoring is Phase 2, T-1)
   ▶ Assigns courses / modules to learners or cohorts          FRD 8.1.4
   ▶ Configures assessments                        PM-08       → FLOW 4
        │
        ▼
⑤ LEARNER ACCESS                                                [LRN]
   ▶ Signs in — SSO preferred for B2B                    D-03 · PM-10
   ⟶ First login may provision the account                     FRD 7.2.2
   ▶ Lands on Home, resumes in one click                            D-10
        │
        ▼
⑥ LEARNING SEQUENCE                                 [LRN] · PM-09 APPROVED
   ▶ Learning resources ...... PDF · video                     FRD 3.1.2
        ⟶ required resources complete                               D-20
   ▶ Simulation .............. web in-portal, or device        FRD 1.2.x
        ⟶ completion recorded to the ACCOUNT                        D-19
        ⟶ device-delivered simulations                          → FLOW 5
   ▶ Assessment .............. configuration-driven            → FLOW 4
        ⟶ passed
   ⟶ MODULE COMPLETE                                        D-08 · 11.1.1
   ⟶ Next module unlocks                                    D-07 · 3.2.2
        │
        ▼
⑦ PROGRESS VISIBILITY
   [LRN] own progress ............................ 8.1.5 · 11.1.x · 11.2.x
   [FAC] operational learner status ................ 8.1.4 · PM-11
   [IAD] institutional operational summary ......... 8.1.3 · PM-11
   ⛔ Class performance reports — Phase 2 (11.3.1)
   ⛔ Institutional adoption reports — Phase 2 (11.3.2)
   ⛔ Never crosses the tenant — 1.3.4

RESTRICTED PATHS
   Licence cap reached (6.2.2) ⟶ learner blocked
        ⚠ Today the learner hits a wall the IA cannot see coming.
          Step ② now surfaces seat utilisation so it is preventable.
   Zero stream entitlement (7.2.3) ⟶ empty My Learning, contact institution
```

---

# FLOW 3 — B2C Purchase to Learning

**Roles:** Learner (individual) · **FRD:** 1.1.3, 6.1.1, 6.1.2, 9.1.x, 9.2.x
**Status:** **KEEP** — fully designed in Review 005, reframed as one branch of the platform.

```
① REGISTRATION                                                  [LRN]
   ▶ Self-registers by email                                   FRD 4.1.1
   ▶ or social login                                           FRD 4.1.2
   ⟶ Personal account in the separate B2C environment          FRD 1.3.2
        │
        ▼
② DISCOVERY                                            [LRN · Explore]
   ▶ Browses the catalogue of PUBLISHED modules (← FLOW 1)     FRD 1.4.4
   ▶ Views a product: individual module or bundle       FRD 6.1.1, 6.1.2
   ⛔ Courses are not products                                       D-21
   ⟶ Access duration shown only if authoritative data exists        D-24
        │
        ▼
③ PURCHASE
   ▶ Checkout — direct purchase, no persistent cart
   ▶ Payment via gateway redirect            FRD 9.1.1, 9.1.2 · C-05
        ⚠ gateway not selected
   ◆ Outcome
     ├── Success ⟶ ④
     ├── Declined ⟶ retry
     └── Indeterminate ⟶ designed explicitly
        │
        ▼
④ ENTITLEMENT
   ⟶ Licence activates automatically                           FRD 9.2.1
   ⟶ Entitlement assigned to My Learning                       FRD 9.2.2
   ⟶ Standalone module is immediately Available                     D-22
        │
        ▼
⑤ LEARNING
   Same sequence as FLOW 2 ⑥ — PM-09 approved.
   D-07 previous-module gating does not apply to a standalone purchase (D-22);
   D-20 internal gating applies in full.
        │
        ▼
⑥ DEVICE ACCESS (where the simulation is not web)
   → FLOW 5
   ⚠ B2C licences are device-bound (2.4.1); replacement needs SA approval (2.4.2)
```

---

# FLOW 4 — Assessment Authoring to Result

**Roles:** Faculty → platform/API → Web or XR application → Learner
**FRD:** 5.1.1, 5.1.2, 5.2.1–5.2.3, 5.3.1, 5.3.2, 11.2.1, 11.2.2 · **PM-08**
**Status:** **Authoring half is new; delivery half is reusable but must become configuration-driven.**

```
① QUESTION SOURCING                                             [FAC]
   ▶ Uploads a question bank via spreadsheet template          FRD 5.1.1
   ▶ or generates questions with integrated AI tools           FRD 5.1.2
        ⚠ Phase-1 requirement. C-04 excluded "AI assistant" citing FRD 5.5
          (Phase 3, learner-facing) — a DIFFERENT requirement. Must be audited
        │
        ▼
② ASSESSMENT DEFINITION                                  [FAC] · PM-08
   ▶ Selects question types      MCQ 5.2.1 · True/False 5.2.2 · Descriptive 5.2.3
   ▶ Sets rules:
        • negative marking on/off ........ FRD 5.3.2 — explicitly Faculty-configurable
        • question randomization ......... FRD 5.3.1 — "may be randomized"
        • question count ................. ⚠ no FRD value
        • time limit ..................... ⚠ no FRD value
        • scoring weights ................ ⚠ no FRD value
        • pass mark ...................... ⚠ no FRD value
        • attempt limit .................. ⚠ no FRD value
        • hint behaviour ................. ⚠ no FRD value
   ⟶ Review-005 values (10 · 20 min · +2/+1/−1/0 · 10/20 · unlimited)
      are SAMPLE CONFIGURATION, not constants                        PM-08
        │
        ▼
③ PUBLICATION / ASSIGNMENT                                      [FAC]
   ▶ Assigns the assessment to a module, course, or cohort     FRD 8.1.4
   ⟶ Configuration becomes available to consuming applications
        │
        ▼
④ API CONSUMPTION                                            [system]
   ⟶ Platform exposes the configuration through flexible APIs       PM-08
   ⟶ Web or XR application consumes it
        ⚠ API contract and schema are PENDING — abstract by instruction
        │
        ▼
⑤ LEARNER ATTEMPT                                               [LRN]
   ▶ Reads the mandatory pre-attempt disclosure  ← RENDERED FROM CONFIGURATION
        scoring · negative marking · hints · time limit · pass mark
   ▶ Attempts the assessment
        timer · hints · navigation — all parameterised
   ▶ Submits
        │
        ▼
⑥ SCORING & RESULT
   ⟶ Auto-scored types scored immediately        5.2.1, 5.2.2
   ⚠ Descriptive answers (5.2.3) ⟶ AWAITING EVALUATION
        ⚠ GRADING OWNER IS UNDEFINED — must not be invented
        ⚠ Compounded: PM-09 sequencing gates the next module on completion,
          so an ungraded assessment can strand a learner
   ▶ Learner sees: score · pass/fail · per-question CORRECTNESS
   ⛔ Learner never sees the correct answer or key                    D-25
        │
        ▼
⑦ PROGRESS
   ⟶ Score recorded                                            FRD 11.2.1
   ⟶ Attempt recorded                                          FRD 11.2.2
   ⟶ Module completion evaluated                        FRD 11.1.1 · D-08
   ⟶ [FAC] operational learner status updated       8.1.4 · PM-11
```

---

# FLOW 5 — XR Entitlement and Device Delivery

**Roles:** Learner (+ Super Admin for device replacement)
**FRD:** 1.2.x, 2.1.x, 2.2.2, 2.3.x, 2.4.x, 10.1.2, 12.2.1 · **PM-05**
**Status:** **The product requirement is confirmed; the technical mechanism is deliberately abstract.**

> **PM-05: the PM confirmed the product requirement — entitlement-aware XR experiment delivery/access from the platform to the supported device — and did NOT select the technical implementation. This flow must not choose one.**

```
① ENTITLED EXPERIMENT
   Learner holds an entitlement, from either origin:
     • B2B — stream package assigned          FRD 6.2.1, 7.2.3   (FLOW 2)
     • B2C — purchased module or bundle       FRD 6.1.1, 6.1.2   (FLOW 3)
   Example (the PM's own): "Soil Mechanics" is available on the platform
   and the user is subscribed to it.
        │
        ▼
② ENTITLEMENT VALIDATION                                     [system]
   ⟶ Platform confirms a valid licence          FRD 2.2.2 · 10.1.2
   ◆ Not entitled ⟶ ACCESS RESTRICTED state
        │
        ▼
③ DEVICE COMPATIBILITY                                          [LRN]
   ⟶ Determine the target runtime for this simulation
     ├── WEB ....... browser, no XR hardware              FRD 1.2.1
     ├── VR ........ VR headset (e.g. Meta Quest)         FRD 1.2.2 · 2.1.1
     ├── MR ........ MR device (e.g. Ajna Lens)           FRD 1.2.3 · 2.1.2
     └── AR ........ Android / iOS mobile                 FRD 1.2.4
                     ⚠ NO application architecture defined in FRD Section 2
   ◆ Device unsupported / unavailable ⟶ UNSUPPORTED DEVICE state
        │
        ├── WEB ────▶ launch in-portal ────▶ ⑦
        │
        ▼ (VR / MR / AR)
④ DELIVERY / ACCESS TO THE DEVICE                        PM-05 · ABSTRACT
   ⟶ The entitled experiment BECOMES AVAILABLE on the supported device.

   Two concepts the PM described, NEITHER SELECTED:

     A. Direct package / application delivery
        the experiment is downloaded or installed onto the target device

     B. Centralized XR application with entitlement-controlled modules
        one application on the device contains or supports the experiments;
        the user sees only those the platform reports as entitled

   Other technically appropriate solutions remain possible
   (synchronisation, deep-link, or another mechanism).

   ⚠ FRD 2.1.1 (master VR app as download/launch container), 2.2.1 (dynamically
     downloaded encrypted bundles), and 2.2.2 (download only after licence
     validation) lean toward Concept B FOR VR — but the PM made no selection,
     and this flow makes none.
        │
        ▼
⑤ AVAILABILITY STATE ON THE DEVICE
   The learner needs to know where the experiment is. States required
   regardless of mechanism:
     • Available / entitled
     • Preparing / downloading             (12.2.1 CDN latency is real)
     • Installed / ready
     • Update available                     FRD 2.3.1
     • Unsupported device
     • Licence denied                       FRD 2.2.2 · 10.1.2
     • Delivery failed / network
     • Storage issue                        ⚠ only if technically relevant
        │
        ▼
⑥ SESSION
   ▶ Learner runs the experiment on the device
   ⟶ Institutional learner signs into the device app with LMS credentials  FRD 2.4.4
        ⚠ Under SSO the learner may have no password to type into a headset
   ⟶ B2C licence is bound to the device                        FRD 2.4.1
        │
        ▼
⑦ COMPLETION AND RESULT
   ⟶ Completion recorded against the ACCOUNT, not the device         D-19
   ⟶ Platform reflects it; the portal does not observe the XR session
   ⟶ States: COMPLETION PENDING · COMPLETION RECEIVED
   ⚠ Reconciliation when a completion is never recorded is PENDING
   ⟶ Module completion evaluated ⟶ next module unlocks     D-07 · D-08
        │
        ▼
⑧ DEVICE LIFECYCLE (B2C)
   ▶ [LRN] requests device replacement                         FRD 2.4.2
   ⟶ [SA] approves the licence transfer                        FRD 2.4.2
   ⚠ Neither surface exists today. Only Phase-1 two-role cross-plane approval
     outside content governance
   ⛔ Device registration and remote management are Phase 2 (2.5.x, 2.6.x)
```

**No API, package format, file type, protocol, or transport is named anywhere in this flow. That is intentional and is the PM's instruction, not an omission.**

---

# FLOW 6 — Institutional Identity / SSO

**Roles:** Institute Admin → Learner / Faculty · **FRD:** 4.2.1, 4.2.2, 10.2.1, 7.2.2 · **PM-10**
**Status:** Learner-facing login exists; **the configuration half is new.**

```
① INSTITUTIONAL ONBOARDING                                 [IAD / SA]
   ▶ Organisation registered on the platform                   FRD 4.2.1
   ⟶ Tenant created                                            FRD 1.3.1
        │
        ▼
② SSO CONFIGURATION                                    [IAD] · PM-10
   ▶ Configures single sign-on with a supported identity provider  FRD 4.2.2
   ▶ Provider settings
        ⚠ provider, protocol, and attribute mapping are PENDING by PM-10
   ▶ Tests the connection
   ⟶ SSO becomes an available authentication path for this tenant
   ⚠ Automatic role mapping from IdP attributes is Phase 3           7.4.2
        │
        ▼
③ USER AUTHENTICATION                                          [AUTH]
   ▶ User signs in at the single platform front door
   ▶ Chooses institutional SSO (ordered first for B2B — D-03)
   ⟶ Redirect to the identity provider
   ⟶ Return with an assertion
   ◆ SSO failure ⟶ explicit failure state, what happened + what next (D-18)
        │
        ▼
④ IDENTITY, TENANT AND ROLE RESOLUTION                       [system]
   ⟶ Resolve identity → tenant → role
   ⟶ ERP-provisioned account may be created at first login     FRD 7.2.2
   ⚠ Phase 1 has no IdP-attribute role mapping (7.4.2 is Phase 3),
     so role assignment origin in Phase 1 is PENDING
        │
        ▼
⑤ WORKSPACE ACCESS
   ⟶ Land in the resolved workspace — Learner, Faculty, or Institute Admin
   ⟶ Multiple roles ⟶ workspace chooser
        │
        ▼
⑥ DOWNSTREAM DEPENDENCY
   ⚠ FRD 2.4.4 requires institutional learners to sign into the XR
     application with LMS credentials. Under SSO they may hold no password.
     Unresolved — recorded, not designed around.
```

---

# Additional Phase-1 cross-role workflows required by the FRD

Identified during the re-audit. Each is required by Phase-1 FRD text and has **no** existing design.

## FLOW 7 — Version Release to Live Content

**Roles:** Super Admin → Learner · **FRD:** 2.3.1, 2.3.2, 2.3.3, 7.2.1

```
[SA] ▶ Controls when a new module version releases to production      2.3.2
     ⟶ XR application downloads the update automatically              2.3.1
     ⟶ Modules update without reinstalling the application            2.3.3
[LRN] ⟶ May see an "update available" state on a delivered experiment
      ⚠ Content can change mid-course. Phase 1 has no lifecycle states
        (1.5.1 is Phase 2) and no notification requirement
```

## FLOW 8 — Device Replacement Authorisation

**Roles:** Learner → Super Admin · **FRD:** 2.4.1, 2.4.2 · **B2C**

```
[LRN] ▶ Requests device replacement — licence bound to a device       2.4.1
      ⟶ Request reaches the Super Admin
[SA]  ▶ Approves the licence transfer to the new device               2.4.2
      ⟶ Entitlement rebinds
⚠ Neither end exists. Both are Phase-1 requirements.
⚠ No FRD text describes rejection, evidence, or limits on replacement.
```

## FLOW 9 — Licence Cap Exhaustion

**Roles:** Institute Admin ← Learner · **FRD:** 6.2.2, 7.2.3

```
[LRN] ⟶ Capped institutional licence exhausted ⟶ ACCESS RESTRICTED
      ▶ Directed to the institution administrator — no purchase prompt (D-01)
[IAD] ⟶ Sees seat utilisation BEFORE exhaustion                       6.2.2
      ⚠ How additional seats are acquired in Phase 1 is PENDING
        (institutional billing 9.3.x is Phase 2)
```

## FLOW 10 — ERP Synchronisation and Entitlement Change

**Roles:** Institute Admin ← system → Learner · **FRD:** 7.2.1, 7.2.3, 4.3.1

```
[system] ⟶ Scheduled sync runs at configured intervals                7.2.1
         ⟶ Student records updated; stream assignments recalculated   7.2.3
         ⟶ Entitlements may be ADDED or REMOVED between sessions
[IAD]    ▶ Sees sync status, last run, and errors
[LRN]    ⟶ Course list may change with no action by the learner
         ⚠ No Phase-1 notification requirement exists (FRD "notification"
           appears once, at 9.4.2, Phase 3)
         ⚠ ERP overwrite of locally edited profile fields is PENDING
```

---

# Workflow coverage summary

| # | Workflow | Roles | New / Reused | FRD basis | Priority |
|---|---|---|---|---|---|
| **1** | Content to Production | V · AR · CM · SA | **100% NEW** | 1.4.1–1.4.5 | **Highest** |
| **2** | B2B Institutional Learning | SA · IA · F · L | Learner reused; institutional NEW | 6.2.x, 7.2.x, 8.1.x | **Highest** |
| **3** | B2C Purchase to Learning | L | **Reused** | 1.1.3, 6.1.x, 9.x | Medium |
| **4** | Assessment Authoring to Result | F · system · L | Authoring NEW; delivery reframed | 5.1.x–5.3.x, PM-08 | **High** |
| **5** | XR Entitlement & Device Delivery | L · SA | **NEW, abstract by instruction** | 1.2.x, 2.x, PM-05 | **High** |
| **6** | Institutional Identity / SSO | IA · L · F | Config NEW; login reused | 4.2.x, PM-10 | **High** |
| 7 | Version Release to Live Content | SA · L | NEW | 2.3.x | Medium |
| 8 | Device Replacement Authorisation | L · SA | NEW | 2.4.1, 2.4.2 | Medium |
| 9 | Licence Cap Exhaustion | IA · L | Learner end reused; admin end NEW | 6.2.2 | Medium |
| 10 | ERP Sync & Entitlement Change | IA · L | Learner end reused; admin end NEW | 7.2.1, 7.2.3 | Medium |

**All seven roles appear:** L (2,3,4,5,6,9,10) · F (2,4) · IA (2,6,9,10) · CM (1) · SA (1,2,5,7,8) · V (1) · AR (1).

## Gaps carried forward — recorded, not designed

| Gap | Flows | Type |
|---|---|---|
| No reject / revise / resubmit path in governance | 1 | Product |
| No academic validation rubric | 1 | Content ownership |
| No governance audit trail | 1 | Product |
| No XR package/submission format | 1, 5 | Technical |
| XR delivery mechanism unselected | 5 | **Technical — by PM instruction** |
| AR application architecture absent from the FRD | 5 | **FRD gap** |
| Descriptive-answer grading owner undefined | 4 | Product |
| Assessment API contract undefined | 4 | Technical |
| Institutional purchase mechanism in Phase 1 | 2, 9 | Product |
| SSO provider / protocol / attributes | 6 | **Technical — by PM instruction** |
| Phase-1 role-assignment origin (7.4.2 is Phase 3) | 6 | Product |
| XR sign-in under SSO (2.4.4) | 5, 6 | Technical |
| Completion reconciliation when never recorded | 5 | Technical |
| No Phase-1 notification requirement | 7, 10 | Product |
| ERP overwrite of edited profile fields | 10 | Data |

**Every gap above is drawn into its flow as a marked `⚠` step.** None is filled with an invented mechanism, and none blocks the platform sitemap.
