# PM Confirmed Baseline — Full Platform Reframe

| | |
|---|---|
| **Document ID** | `PM_CONFIRMED_BASELINE_2026-08-18` |
| **Meeting date** | **18 August 2026** |
| **Document created** | 2026-08-18 |
| **Status** | ✅ **AUTHORITATIVE** — supersedes conflicting prior interpretation |
| **Type** | PM confirmation capture. **Not** a design document, not a review, not an FRD amendment |
| **Supersedes** | The Student-first scope interpretation underlying Reviews 001–005 |
| **Does not supersede** | `source/Platform FRD_v4.pdf` (unchanged, and never to be edited) |
| **Next stage** | **Review 006 — Full Platform Reframe** (not started; see §E) |

---

## Source of these statements

**Direct verbal clarification from the Project Manager**, in a meeting held on **18 August 2026**.

The user recorded the discussion in **Voice Memos** and **translated/transcribed** the answers. This document is the written capture of that transcription. It is the authoritative written record of what the PM confirmed on that date.

---

## Authority rule

These rules govern how this document interacts with every other document in the repository.

1. **These statements are PM-CONFIRMED.**
2. Where a statement here **directly conflicts** with a previous user assumption, an assistant recommendation, or a Review-005 decision, **the PM-confirmed statement takes precedence**.
3. **Do NOT rewrite the original FRD.** `source/Platform FRD_v4.pdf` remains byte-for-byte unchanged.
4. **FRD contradictions or deviations must be recorded, not silently changed.** Every deviation identified during this capture is written down — inline against the relevant PM answer, and consolidated in §F.
5. **Previous Review-005 Learner work must be preserved** and later reclassified/reused where appropriate. Nothing from Reviews 001–005 is deleted by this document.

### What this document does *not* do

- It does **not** modify `DECISIONS.md`, `OPEN_QUESTIONS.md`, `ASSUMPTIONS.md`, or any Review-005 artefact.
- It does **not** create Review 006.
- It does **not** touch Figma.
- It does **not** allocate new register IDs. The next free identifiers, for Review 006 to use, are **D-26**, **A-50**, **Q-57**, **C-11**.

### Reading conventions used below

Each PM answer carries four parts: the **confirmed statement**, its **FRD traceability** (alignment, extension, or deviation), the **prior positions it affects**, and its **status** exactly as the PM left it.

---

# The 12 PM-Confirmed Answers

---

## PM-01 — Current UI/UX Scope

**All Phase-1 requirements and all Phase-1 roles must be covered.**

This **supersedes** the previous interpretation that the detailed project scope was only the Student/Learner desktop LMS.

The Student/Learner work **remains reusable** as one workspace within the complete platform.

**FRD traceability — alignment.** The requirement *breadth* was already correct. FRD Phase 1 is the union of the Phase-1 subsection of all 12 sections: **78 requirements** (verified by direct count of the FRD text, matching `D-02`). What changes is *depth of role coverage*, not the requirement count.

**Affects.** `D-02` (Phase 1 = all 78 Phase-1 requirements) is **reinforced, not changed**. `D-13` (Student role only) is **superseded**. The previous coverage audit reached 44 of 78 requirements (56%) as Student-facing; the remaining 34 were classified SYSTEM / CLARIFY / OUT **largely because no non-Student interface existed in scope**. All 78 must now be re-audited with an explicit **owning role** assigned to each.

**Status:**
**PM CONFIRMED**

---

## PM-02 — Required Design Process

Before detailed Figma work:

1. Create the complete **platform sitemap**.
2. Create the **role/permission model**.
3. Create **workflows for all roles**.
4. Then identify the **most important end-to-end flows**.
5. Take those important flows into **detailed Figma**.

**Do not continue a Student-only high-fidelity transfer before completing this platform-level architecture.**

**Affects.** `ui-ux/FIGMA_TRANSFER_CHECKPOINT.md` currently reads *"Ready to begin transfer · Nothing built in Figma yet."* That checkpoint is **placed on hold** by PM-02. It is **not** cancelled and **not** edited by this document — the Figma target, connection status, page structure, and transfer method it records remain valid and will be reused once the platform architecture is complete. Only its position as *the next action* is superseded.

**Practical consequence.** Nothing has been built in Figma, so no Figma rework is created by this reframe. The pause costs nothing already spent.

**Status:**
**PM CONFIRMED**

---

## PM-03 — Platform Model

Treat the solution as **one central XR Simulation Learning Platform / web portal with role-based access/workspaces**.

**Do not interpret this as saying that every XR runtime executes inside the browser.**

**FRD traceability — alignment.** FRD 1.1.1 defines a multi-tenant SaaS LMS. The explicit non-browser caveat is directly supported by the FRD: FRD 1.2.2 (VR on Meta Quest), 1.2.3 (MR on Ajna Lens), 1.2.4 (AR on Android/iOS), 2.1.1 (master VR application via the Meta Quest Store), and 2.1.2 (sideloaded MR application) all describe runtimes **outside** the browser. Only FRD 1.2.1 (web simulation) runs in a standard browser.

**Reading to avoid.** "One central web portal" describes the **control, entitlement, and administration plane** — not the execution plane for every simulation format.

**Status:**
**PM CONFIRMED**

---

## PM-04 — B2B and B2C

**Both** B2B institutional users **and** B2C individual learners are required.

**Do NOT treat B2B-first / B2C-second as a PM-confirmed release sequence.**

Both must be represented in the platform architecture.

**FRD traceability — alignment.** FRD 1.1.2 (B2B institutional) and 1.1.3 (B2C individual) are **both Phase 1**, with no phasing between them. Supporting Phase-1 requirements exist on both sides: 1.3.1 (tenant-wise isolation), 1.3.2 (separate B2C database environment), 1.3.3 (regional B2C database expansion), 6.1.1/6.1.2 (B2C purchase), 6.2.1/6.2.2 (institutional licensing). **The FRD never sequences B2B ahead of B2C.**

**Affects.** `D-01` (dual audience) is **reinforced**. Any B2B-first/B2C-second sequencing that entered the work as an assumption or a recommendation returns to **pending** — it is not PM-confirmed and is not FRD-derived.

**Open architecture question this raises.** FRD 1.3.1/1.3.2 isolate institutional and B2C data, and FRD 1.3.5 grants only the **Super Admin** controlled cross-tenant access. The FRD says nothing about where **Vendor** and **Academic Reviewer** (PM-07) sit relative to that isolation boundary. Review 006 must resolve this in the role/permission model.

**Status:**
**PM CONFIRMED**

---

## PM-05 — Web Portal to XR Device Delivery

The Project Manager explained that **subscribed/available XR experiments must be deliverable from the platform to the device on which they will be used**.

### Example given

If **"Soil Mechanics"** is an experiment available on the webpage/platform and the user is **subscribed/entitled** to it, there must be a mechanism for that experiment to become available on the user's **headset/device**.

### Implementation concepts the PM described

| Concept | Description |
|---|---|
| **A** | The experiment/application/package **can be downloaded/installed** onto the target device |
| **OR** | |
| **B** | There can be **one centralized application on the VR device** containing/supporting the experiments, while the user **only sees or can access the experiments for which the platform reports a valid subscription/entitlement** |

### IMPORTANT

The PM confirmed the **PRODUCT REQUIREMENT**:

> **entitlement-aware XR experiment delivery/access from the platform to the supported device.**

The PM did **NOT** select the final technical implementation between:

- direct package/application download
- centralized XR application with downloadable modules
- synchronization/deep-link mechanisms
- another technically appropriate solution

**Do not silently choose one during UI/UX.**

**FRD traceability — the product requirement is already FRD-supported.** FRD 2.2.2 states simulation modules *"shall only be downloaded after license validation is confirmed by the platform"*, and FRD 10.1.2 requires licence validation before execution. Entitlement-aware delivery is therefore **not a new requirement** — it is an existing Phase-1 requirement that the Student-only interpretation never surfaced as a designed experience.

**FRD traceability — the mechanism is partially, but not fully, described.** For **VR**, FRD 2.1.1 already describes a centralized master application acting as *"the container for downloading and launching XR simulation modules"*, with FRD 2.2.1 (encrypted asset bundles dynamically downloaded), 2.3.1–2.3.3 (module updates independent of app reinstallation), and 2.4.4 (session-based device login with LMS credentials). That set corresponds closely to the PM's **Concept B**. For **MR**, FRD 2.1.2 specifies a sideloaded Ajna Lens application. **Recorded gap:** FRD Section 2 defines **no application or packaging architecture for AR** (mobile Android/iOS, FRD 1.2.4), and does not state whether **web** simulations (1.2.1) use the same encrypted-bundle and licence-validation path (already tracked as Q-16).

**This is recorded, not resolved.** The FRD leaning toward Concept B for VR does **not** constitute a PM selection. The PM left the mechanism open, and this document leaves it open.

**Affects.** `D-09` (XR modules visible with device guidance), `C-06` (do not invent deep-link or device-control functionality), and `C-08` (no non-functional launch buttons) produced a desktop model that **only informs**. That model is now **incomplete** — it lacks any entitlement-aware delivery/access surface. `C-06` and `C-08` remain sound as anti-invention guards and are **not** withdrawn: the correct response is to obtain the mechanism, not to invent one.

**Status:**
**PM CONFIRMED PRODUCT REQUIREMENT**
**TECHNICAL MECHANISM PENDING**

---

## PM-06 — XR Simulation Availability

**The required XR simulations/experiments are available.**

Therefore **do not assume the current platform team must create every simulation from scratch**.

Later technical discovery should identify:

- existing builds
- formats
- versions
- device compatibility
- package types
- integration interfaces
- ownership/support contacts

**FRD traceability — consistent.** FRD 1.4.1 has authorized vendors submitting XR module builds and assets through the platform's staging environment; the platform is a distribution and governance system for content it receives, not necessarily an origination studio. FRD 1.1.4 keeps all hosted XR modules under platform-owner ownership and governance regardless of who built them.

**Consequence for design.** The platform must be designed to **ingest, validate, publish, entitle, and deliver** existing simulations. Simulation *authoring* is not a Phase-1 platform surface.

**Status:**
**PM CONFIRMED**

---

## PM-07 — Vendor and Academic Reviewer

**Vendor and Academic Reviewer must have actual platform logins/workspaces.**

They are **no longer merely optional/external actors**.

The platform role/workspace model must therefore include:

- **Student/Learner**
- **Faculty**
- **Institute Admin**
- **Content Manager**
- **Super Admin**
- **Vendor**
- **Academic Reviewer**

**FRD traceability — EXTENSION / DEVIATION. Recorded.** FRD 8.1 (Phase 1, *Role Hierarchy*) defines exactly **five** roles: 8.1.1 Super Admin · 8.1.2 Content Manager · 8.1.3 Institute Admin · 8.1.4 Faculty · 8.1.5 Student. **Vendor** and **Academic Reviewer** appear in the FRD only as *actors in the content governance workflow* — FRD 1.4.1 (*"Authorized vendors shall submit XR module builds…"*), FRD 1.4.5 (*"Third-party vendors shall not have direct publishing rights"*), and FRD 1.4.2 (*"academic validation by the BITS Pilani academic team"*) — with **no role definition and no permission set**. PM-07 promotes both to first-class platform roles. The FRD's own mechanism for extending the role model, FRD 8.3 (custom role creation and permission-level access control), is **Phase 3** and therefore cannot be used to justify this within Phase 1.

**This deviation is recorded here and must not be resolved by editing the FRD.**

**Affects.** `D-13` is **superseded**. Every "Vendor / academic reviewer are out of scope" statement across `PROJECT_CONTEXT.md`, `DECISIONS.md` Part B, and `FIGMA_TRANSFER_CHECKPOINT.md` §9 is superseded — those files are **not edited by this task**, only flagged (§C).

**Status:**
**PM CONFIRMED**

---

## PM-08 — Assessment Configuration

**Assessment behaviour must be configurable/setup through the portal and linked to the application through flexible APIs.**

**Do NOT treat the previous prototype values as universal platform constants.**

Examples from the earlier prototype such as:

- 10 MCQs
- 20 minutes
- +2 correct
- +1 after hint
- −1 incorrect
- 10/20 pass
- unlimited attempts

must now be treated as **SAMPLE ASSESSMENT CONFIGURATION** unless independently confirmed later.

The platform architecture must support **configurable assessment behaviour**, including the FRD-supported question types and appropriate assessment parameters.

The configured assessment must be **consumable by the relevant Web/XR application through flexible platform/API integration**.

**FRD traceability — alignment. The FRD always framed assessment as configurable.** FRD 5.1.1 (Faculty upload question banks via structured spreadsheet templates), 5.2.1 MCQ / 5.2.2 True-False / 5.2.3 Descriptive (the Phase-1 question types), 5.3.1 (*"Quiz questions **may** be randomized for each attempt"*), and 5.3.2 (*"Faculty **shall be able to enable** negative marking"*) are all Phase-1 and all express configuration, not fixed values. **The FRD nowhere states a question count, a duration, a score weighting, a pass mark, or an attempt limit.**

**Consequence.** The Review-005 values were a legitimate design interpretation filling FRD silence — they were never FRD constants, and PM-08 confirms they must not be treated as platform constants either. They are retained as **SAMPLE ASSESSMENT CONFIGURATION**.

**Affects.** `D-06`, `D-23` (score floor), and their dependent surfaces are **reclassified from global constants to sample configuration**. The *structural* behaviours they define — mandatory pre-attempt disclosure, hint-reduces-score, timer, attempt history, per-question correctness without the key (`D-25`) — remain valid as **capabilities the configuration model must support**. `A-44` already marks commercial figures as sample data; the same treatment must now extend to assessment figures.

**Recorded scope catch — FRD 5.1.2.** *AI Question Generation* (*"Faculty shall be able to generate assessment questions using AI tools integrated into the platform"*) is a **Phase-1** requirement. Constraint `C-04` excluded "AI assistant" from scope, but `C-04`'s justification referenced **FRD 5.5** (AI Learning Assistant), which is **Phase 3** and a different requirement. FRD 5.1.2 is a Phase-1 **Faculty** capability that the Student-only scope never surfaced. **Review 006 must audit it explicitly rather than inheriting the exclusion.**

**Status:**
**PM CONFIRMED**

---

## PM-09 — Learning Progression

The currently proposed learning progression is **acceptable**:

```
Learning Resources  →  Simulation  →  Assessment  →  Completion / progression
```

The existing Learner sequencing design **can be retained** as the current approved learning-flow model.

**Do not unnecessarily generalize this into unrelated future rules.**

**FRD traceability — consistent.** FRD 3.1.2 (modules *may* include theoretical explanations, simulation instructions, and assessments), 3.1.1 (a module contains a single XR simulation), and 3.2.2 (courses define the sequence in which modules must be completed).

**Affects — retained.** `D-07` (between-module gating), `D-08` (four-part completion model), `D-19` (account-level, not device-level, simulation completion), and `D-20` (module-internal sequential gating) are **approved and retained** as the current learning-flow model.

**Boundary the PM set.** This approval covers the **learner progression model only**. It must not be generalized into governance sequencing, entitlement rules, or any other role's workflow.

**Status:**
**PM CONFIRMED**

---

## PM-10 — SSO

**Institutional SSO integration is required.**

Keep SSO in the **platform architecture** and **institutional authentication UX**.

Exact provider, protocol, attribute mapping and technical implementation remain **implementation details to determine later**.

**FRD traceability — resolves a known FRD phase contradiction.** FRD 4.2.2 places SSO configuration in **Phase 1** (*"Institutions shall be able to configure single sign-on authentication through supported identity providers"*), while FRD 7.4.1 places SSO authentication support in **Phase 3**. PM-10 confirms the Phase-1 reading — the same resolution `D-03` already adopted. `D-03` is therefore **reinforced, not superseded**.

**Recorded scope catch — FRD 4.2.2 is a configuration capability, not just a login button.** Under Student-only scope, SSO was realised solely as a login path (AUTH-01, AUTH-02). FRD 4.2.2 says *institutions shall be able to **configure*** SSO — which requires an **Institute Admin** configuration surface that has never been designed. FRD 7.4.2 (role mapping from identity-provider attributes, Phase 3) directly feeds the role model in PM-07 and should be noted as a forward dependency.

**Status:**
**PM CONFIRMED**

---

## PM-11 — Reporting / Analytics Strategy

The Project Manager said that **detailed reporting parameters cannot be finalized now**.

**Build the core functionality and core operations first.**

Reporting/analytics should be added **incrementally** after the underlying functionality and available data are understood.

Therefore:

- **do not** invent large analytics dashboards now
- **do not** remove reporting from the long-term FRD
- Phase-1 role architecture **may** include operational summaries/status where required
- detailed report metrics/KPIs remain **pending**

**FRD traceability — alignment, not deviation.** FRD Phase-1 analytics are **recording** requirements, not dashboards: 11.1.1 (record module completion status), 11.1.2 (track time spent), 11.2.1 (store assessment scores), 11.2.2 (record attempts). The **dashboards** are later phases: 8.2.1/8.2.2 (institutional usage and licence-utilisation dashboards) are **Phase 2**; 11.3.1/11.3.2 (class-level and institutional reports) are **Phase 2**; 11.4.1/11.4.2 (heatmaps, decision-path analysis) are **Phase 3**. **PM-11 therefore agrees with the FRD's own phasing** — it does not deviate from it.

**Two Phase-1 constraints that still bind any reporting surface.** FRD 1.3.4 limits analytics and reporting for each institution to that tenant's dataset. FRD 8.1.3 makes *"institutional reporting"* part of the **Phase-1 Institute Admin role definition** — which is precisely the *operational summaries/status where required* that PM-11 permits, and the boundary beyond which dashboards must not be invented.

**Status:**
**PM CONFIRMED**

---

## PM-12 — Certification

**Certification is NOT part of the current Phase-1 product scope.**

The platform is currently **a medium for users to access/use the solution**.

**Certification will be treated as a Phase-2 activity.**

This is an **explicit PM project clarification** and must be recorded as a **deviation/clarification relative to any conflicting certification wording in the original FRD**.

**Do NOT edit the original FRD.**

**Do NOT create detailed Phase-1 certification screens.**

**FRD traceability — DIRECT DEVIATION. Recorded.** FRD Section 3 places certification in **Phase 1**:

| FRD | Phase in FRD | Text |
|---|---|---|
| **3.3.1** | **Phase 1** | *"Certification programs shall consist of one or more courses grouped into a structured learning pathway."* |
| **3.3.2** | **Phase 1** | *"Students shall receive certification upon completing all required courses and meeting minimum assessment performance thresholds."* |
| 3.5.1 / 3.5.2 | Phase 3 | Student certification progress tracking · eligibility reports |
| 4.5.2 | Phase 2 | Certification path recommendations |

**PM-12 moves FRD 3.3.1 and 3.3.2 out of Phase 1 and into Phase 2.** This is a genuine deviation from the FRD as written. It is **recorded here and must not be applied to the FRD**.

**Effect on the Phase-1 working set.** The FRD Phase-1 requirement count remains **78** as a document fact. The **Phase-1 design working set becomes 76**, with **3.3.1 and 3.3.2 recorded as PM-deferred to Phase 2**. Review 006 must carry this distinction explicitly so the deferral stays visible rather than looking like an omission.

**Affects.** `Q-12` (*Is certification UI required in Phase 1?*) is **answered by PM-12: no.** `A-12` (certification hierarchy shown, no certificate artefact invented) is superseded in the direction the PM chose — Review 005 correctly declined to invent certification UI, and that restraint now has PM backing. **Also note:** FRD 3.3.1's *structural* concept — that a certification program groups courses — may still need to exist in the platform **content hierarchy** even though no Phase-1 certification *experience* is built. Review 006 should decide whether the structural node is modelled or fully deferred; it must not be assumed either way.

**Status:**
**PM CONFIRMED**

---

# A. Immediate Scope Impact

### OLD INTERPRETATION

> **Student/Learner desktop LMS was treated as the primary detailed Phase-1 product.**

Reviews 001–005 were executed under this reading. It produced: 25 confirmed decisions (D-01 – D-25), 20 user flows, 29 screen IDs, a design system, high-fidelity renders of all 29 screens, a WCAG 2.2 AA review, a coverage matrix, and a developer handoff — all scoped to **one role, one platform surface, one viewport class**.

### NEW PM-CONFIRMED INTERPRETATION

> **Phase 1 must cover the complete platform-level requirements and all Phase-1 roles.**

Requirement breadth is unchanged (**78 Phase-1 requirements**, less the two certification requirements deferred by PM-12). **Role depth changes from one role to seven.**

### What Review 005 becomes

> **"Reusable Learner Workspace baseline created under the earlier Student-first interpretation."**

**It is NOT the complete platform baseline anymore.**

| | |
|---|---|
| **Preserved** | ✅ In full. Nothing is deleted, moved, or rewritten by this document |
| **Reclassified** | From *the Phase-1 product* → to *one role workspace within the Phase-1 platform* |
| **Reusable** | ✅ Substantially — learning progression (PM-09), design system, accessibility baseline, error-state discipline, and most Learner screens |
| **Requires revalidation** | Assessment constants (PM-08), XR access model (PM-05), certification position (PM-12), and every "out of scope" statement grounded in Student-only scope (PM-01, PM-07) |
| **Formal reconciliation** | Review 006 step 11 — **KEEP / MODIFY / SUPERSEDE / DEFER** per artefact |

### Immediate practical effects

1. **Detailed Figma transfer is paused** (PM-02). Nothing was built in Figma, so no rework is created.
2. **The next deliverable is platform architecture**, not screens.
3. **`FRD_UIUX_COVERAGE.md` must be re-audited** — its 44-of-78 Student-facing figure describes the old scope and is no longer the platform coverage measure.
4. **No register IDs are consumed by this document.** Review 006 starts at D-26 / A-50 / Q-57 / C-11.

---

# B. Confirmed Role Set

Seven roles, PM-confirmed:

| # | Role | FRD basis | Status change |
|---|---|---|---|
| 1 | **Student / Learner** | FRD 8.1.5 | Retained — now one workspace among seven |
| 2 | **Faculty** | FRD 8.1.4 | **Now in scope** (was excluded by D-13) |
| 3 | **Institute Admin** | FRD 8.1.3 | **Now in scope** (was excluded by D-13) |
| 4 | **Content Manager** | FRD 8.1.2 | **Now in scope** (was excluded by D-13) |
| 5 | **Super Admin** | FRD 8.1.1 | **Now in scope** (was excluded by D-13) |
| 6 | **Vendor** | FRD 1.4.1, 1.4.5 — **actor only, no FRD 8.1 role definition** | **Now a confirmed role with a login/workspace** (PM-07) |
| 7 | **Academic Reviewer** | FRD 1.4.2 — *"BITS Pilani academic team"*, **actor only, no FRD 8.1 role definition** | **Now a confirmed role with a login/workspace** (PM-07) |

**Also recorded:** **B2C Individual Learner** is a **business/user context**, not an eighth role. It is the non-institutional context in which the Student/Learner role operates (FRD 1.1.3, 6.1.1, 6.1.2), as distinct from the B2B institutional context (FRD 1.1.2, 6.2.1, 7.2.2). Both contexts are required (PM-04) and must be represented in the platform architecture.

**Do not invent additional formal roles.** Roles 6 and 7 exist because the PM confirmed them. No further role may be added without an equivalent confirmation — and FRD 8.3 (custom role configuration) is **Phase 3** and cannot be used to justify inventing one now.

---

# C. Superseded / Modified Previous Assumptions

The following prior positions are directly superseded or now require revalidation.

> **Nothing in this section is edited in its source file by this task.** This is an impact record only. Applying it is Review 006 work.

| # | Previous position | Where it lives | New status |
|---|---|---|---|
| **1** | **Student-only Phase-1 design scope** | `D-13`; `PROJECT_CONTEXT.md` §3; `FIGMA_TRANSFER_CHECKPOINT.md` §1, §9 | 🔴 **SUPERSEDED** by PM-01. Phase 1 covers all Phase-1 requirements **and all Phase-1 roles** |
| **2** | **Other Phase-1 roles classified OUT because of Student-only scope** | `D-13`; `PROJECT_CONTEXT.md` §4; `FRD_UIUX_COVERAGE.md` OUT/SYSTEM rows (e.g. 1.3.5, 1.4.1, 2.4.1, 2.4.2) | 🔴 **SUPERSEDED** by PM-01. Faculty, Institute Admin, Content Manager, Super Admin are in scope. Every OUT/SYSTEM classification justified by "not the Student's role" must be re-audited |
| **3** | **Vendor as only an optional/external actor** | `D-13`; `PROJECT_CONTEXT.md` §4 | 🔴 **SUPERSEDED** by PM-07. **Vendor workspace confirmed** |
| **4** | **Academic Reviewer as only an optional/external actor** | `D-13`; `PROJECT_CONTEXT.md` §4; `A-19` / `Q-19` | 🔴 **SUPERSEDED** by PM-07. **Academic Reviewer workspace confirmed** |
| **5** | **Fixed global assessment values** (10 MCQ · 20 min · +2 / +1 / −1 / 0 · 10/20 pass · unlimited attempts · score floored at 0) | `D-06`, `D-23`; STU-09, STU-10, STU-12 | 🟠 **SUPERSEDED as global constants** by PM-08. **Retained as SAMPLE CONFIGURATION only.** The underlying capabilities remain valid as things the configuration model must support |
| **6** | **Certification as a possible current Phase-1 Learner surface** | `Q-12`, `A-12`; FRD 3.3.1 / 3.3.2 | 🔴 **SUPERSEDED** by PM-12 — **Phase 2**. Recorded as an FRD deviation (§F). No Phase-1 certification screens |
| **7** | **B2B-first / B2C-second release sequencing** | Working interpretation; not in `DECISIONS.md` | ⚪ **NOT PM CONFIRMED.** Returns to **pending** unless the FRD explicitly phases something. Direct count of the FRD confirms it does **not** — 1.1.2 and 1.1.3 are both Phase 1 |
| **8** | **XR screen model that only provides device guidance** | `D-09`, `C-06`, `C-08`; STU-07 four format variants | 🟠 **INCOMPLETE** under PM-05. Future UX must include **entitlement-aware device delivery/access**. `C-06`/`C-08` are **retained** as anti-invention guards — the mechanism must be obtained, not invented |
| **9** | **Reporting-heavy admin dashboards** | Not built; would have been an inference from FRD 8.2 / 11.3 | ⚪ **NOT YET DEFINED** per PM-11. **Core operations first.** Operational summaries/status permitted where required; detailed KPIs pending |
| **10** | **SSO deferral proposals** | FRD 7.4.1 Phase-3 reading | 🔴 **SUPERSEDED** by PM-10 — **SSO integration is required**. Reinforces `D-03`. Adds a previously undesigned **Institute Admin SSO configuration** surface (FRD 4.2.2) |

### Additional items detected during this capture

Not on the original list, surfaced by reading the FRD against the PM answers. Recorded so Review 006 does not inherit them silently.

| # | Item | Why it matters now |
|---|---|---|
| **11** | **FRD 5.1.2 — AI Question Generation is a Phase-1 Faculty requirement** | `C-04` excluded "AI assistant" citing FRD 5.5, which is **Phase 3** and a *different* requirement. FRD 5.1.2 is Phase 1 and Faculty-owned. Must be **audited, not inherited as excluded** |
| **12** | **FRD 4.2.2 SSO is a configuration capability** | Realised only as a Student login path. The **Institute Admin configuration** surface it requires has never been designed (PM-10) |
| **13** | **FRD 2.4.1 / 2.4.2 device binding and replacement** | Phase-1 requirements with **no designed surface anywhere** — previously classified OUT under `A-14`/`Q-14`. 2.4.2 requires **Super Admin approval**, a workflow spanning two now-in-scope roles |
| **14** | **FRD Section 2 defines no AR application architecture** | 2.1.1 covers VR, 2.1.2 covers MR. **AR (FRD 1.2.4) has no packaging or delivery requirement.** A real gap for PM-05's delivery model |
| **15** | **Vendor / Academic Reviewer position in the tenancy model is undefined** | FRD 1.3.1/1.3.2 isolate tenants; 1.3.5 grants cross-tenant access to **Super Admin only**. PM-07's two new roles are inherently cross-tenant and unplaced |
| **16** | **`FRD_UIUX_COVERAGE.md` coverage figures are scope-bound** | "44 of 78 (56%) Student-facing" measured the old scope. It is **not** a platform coverage figure and must not be quoted as one |
| **17** | **Desktop-first at ~1440px (`D-15`) was set for the Learner surface** | Six additional role workspaces now inherit a viewport decision made for one. Needs revalidation, not automatic extension (see §D) |

---

# D. What Remains Technically / Product-Operationally Pending

Unresolved implementation details. **Recorded, not assigned.** The user is not being asked to solve these now.

| # | Pending item | Related FRD / register |
|---|---|---|
| 1 | **Final XR delivery mechanism** | PM-05; FRD 2.1.1, 2.2.1, 2.2.2 |
| 2 | **Package / application format** | FRD 2.2.1 (encrypted asset bundles) |
| 3 | **Centralized XR app vs direct package delivery** | PM-05 Concept A vs Concept B — **explicitly not selected** |
| 4 | **Exact device synchronization / deep-link mechanism** | `C-06`; `Q-49` |
| 5 | **XR integration APIs / events** | `Q-42`, `Q-49`; FRD 5.4.1 (Phase 2) |
| 6 | **Exact assessment configuration schema / API contract** | PM-08; FRD 5.1.1, 5.2.1–5.2.3, 5.3.1, 5.3.2 |
| 7 | **SSO provider / protocol / attribute mapping** | PM-10; FRD 4.2.2, 7.4.1, 7.4.2 |
| 8 | **ERP provider and integration details** | FRD 7.1.1, 7.1.2, 7.2.1 |
| 9 | **Payment gateway / provider details** | `C-05`, `Q-34`; FRD 9.1.1, 9.1.2 |
| 10 | **Detailed reporting KPIs / parameters** | PM-11; FRD 8.2, 11.3, 11.4 |
| 11 | **Final technology stack** | FRD 12.1.1 (AWS / Azure / GCP) |
| 12 | **Detailed responsive breakpoints** | `D-15`, `Q-52` — now spans seven workspaces (§C item 17) |
| 13 | **Detailed analytics definitions** | PM-11; FRD 1.3.4 tenant-scoping constraint |

**Handling rule.** **Do not treat these as blockers for platform IA unless they truly block a flow.** Sitemap, role/permission model, and role workflows can be produced without any of them resolved. Each becomes blocking only at the point a **specific screen** cannot be drawn truthfully without the answer — at which point it is escalated as an open question, never invented.

---

# E. Required Next Project Stage

## REVIEW 006 — FULL PLATFORM REFRAME

**Not started.** This document does not begin it.

Required order:

| Step | Deliverable |
|---|---|
| **1** | Audit **all Phase-1 FRD requirements** from a full-platform perspective |
| **2** | Create the full **Phase-1 feature inventory** |
| **3** | Create the **role-permission matrix** |
| **4** | Create the **shared-capability / domain map** |
| **5** | Create the **complete platform sitemap** for all confirmed roles |
| **6** | Create **end-to-end workflows** for all confirmed roles |
| **7** | Map **B2B and B2C journeys** |
| **8** | Map **content governance**: Vendor → Academic Reviewer → Content Manager → Super Admin → Published content |
| **9** | Map **entitlement-aware XR delivery** |
| **10** | Map **configurable assessment setup → API/application consumption → learner result/progress** |
| **11** | **Reconcile Review-005 Learner work: KEEP / MODIFY / SUPERSEDE / DEFER** |
| **12** | Create the **full screen inventory** |
| **13** | Identify the **highest-priority end-to-end flows** for detailed Figma |
| **14** | **Only then resume detailed Figma work** |

**Step 8 note.** The governance chain above maps one-to-one onto FRD 1.4.1 → 1.4.2 → 1.4.3 → 1.4.4, with FRD 1.4.5 as the constraint that vendors never publish directly. Two of its four actors (Vendor, Academic Reviewer) gained workspaces only at PM-07, so this chain has **never been designed end to end**.

**Step 14 note.** `FIGMA_TRANSFER_CHECKPOINT.md` remains the operational reference for how the transfer is performed — file key, page structure, native-layer requirement, token mapping. Only its *timing* is deferred.

---

# F. FRD Deviation & Alignment Register

Required by **Authority rule 4** — *FRD contradictions or deviations must be recorded, not silently changed.*

**`source/Platform FRD_v4.pdf` is unchanged and must remain unchanged.**

| # | PM answer | FRD reference | Relationship | Record |
|---|---|---|---|---|
| **F-1** | **PM-12** | **3.3.1, 3.3.2** (both **Phase 1**) | 🔴 **DEVIATION** | PM moves certification structure and completion criteria to **Phase 2**. FRD Phase-1 count stays 78 as a document fact; the **design working set becomes 76 + 2 PM-deferred** |
| **F-2** | **PM-07** | **8.1.1 – 8.1.5** (five roles) | 🟠 **EXTENSION** | Vendor (1.4.1, 1.4.5) and Academic Reviewer (1.4.2) are FRD *actors* with no role definition or permission set. PM promotes both to roles with logins/workspaces. FRD 8.3 (custom roles) is **Phase 3** and cannot justify this within Phase 1 |
| **F-3** | **PM-10** | **4.2.2** (Phase 1) vs **7.4.1** (Phase 3) | ✅ **RESOLVES an existing FRD contradiction** | PM confirms the Phase-1 reading. Matches `D-03`. No FRD change required |
| **F-4** | **PM-05** | **2.1.1, 2.1.2, 2.2.1, 2.2.2, 10.1.2** | ✅ **ALIGNMENT** + 🟡 **GAP** | Entitlement-aware delivery is already FRD-required. **Gap:** Section 2 defines app/packaging architecture for **VR and MR only** — **none for AR** (1.2.4); web (1.2.1) bundle/licence path unstated (`Q-16`) |
| **F-5** | **PM-08** | **5.1.1, 5.2.1–5.2.3, 5.3.1, 5.3.2** | ✅ **ALIGNMENT** | The FRD always framed assessment as Faculty-configurable and specifies **no** count, duration, weighting, pass mark, or attempt limit. Review-005 values filled FRD silence and are now sample configuration |
| **F-6** | **PM-08** | **5.1.2** (Phase 1) vs `C-04` | 🟡 **SCOPE CATCH** | `C-04` excluded "AI assistant" citing **FRD 5.5 (Phase 3)**. FRD **5.1.2 AI Question Generation is Phase 1** and Faculty-owned. Must be audited in Review 006 |
| **F-7** | **PM-04** | **1.1.2, 1.1.3** (both Phase 1) | ✅ **ALIGNMENT** | The FRD does not sequence B2B ahead of B2C. B2B-first sequencing was never FRD-derived |
| **F-8** | **PM-11** | **11.1.x, 11.2.x** (Phase 1) vs **8.2.x, 11.3.x** (Phase 2), **11.4.x** (Phase 3) | ✅ **ALIGNMENT** | FRD Phase-1 analytics are **recording**, not dashboards. PM-11 matches the FRD's own phasing. Bounded by 1.3.4 tenant-scoping and 8.1.3 institutional reporting |
| **F-9** | **PM-03** | **1.1.1** vs **1.2.2–1.2.4, 2.1.1, 2.1.2** | ✅ **ALIGNMENT** | "One central web portal" = control/entitlement/administration plane. Non-browser XR runtimes are explicitly FRD-required |
| **F-10** | **PM-06** | **1.4.1, 1.1.4** | ✅ **ALIGNMENT** | Platform ingests, governs, and distributes vendor-built content. Simulation authoring is not a Phase-1 platform surface |
| **F-11** | **PM-09** | **3.1.1, 3.1.2, 3.2.2** | ✅ **ALIGNMENT** | Resources → simulation → assessment → completion is consistent with the FRD content model and sequencing requirement |
| **F-12** | **PM-04 / PM-07** | **1.3.1, 1.3.2, 1.3.5** | 🟡 **GAP** | Tenant isolation grants cross-tenant access to **Super Admin only**. Vendor and Academic Reviewer are inherently cross-tenant and **unplaced** in the FRD's isolation model |

**Legend.** 🔴 deviation from the FRD as written · 🟠 extension beyond the FRD as written · 🟡 gap or catch requiring Review-006 attention · ✅ alignment, no FRD change implied.

---

# Document control

| | |
|---|---|
| **Confirmations captured** | **12** (PM-01 – PM-12) |
| **Prior positions superseded or requiring revalidation** | **17** (10 specified + 7 detected during capture) |
| **Unresolved technical/product-operational items recorded** | **13** |
| **FRD deviations / extensions recorded** | **2** (F-1 certification · F-2 role set) |
| **FRD gaps / catches recorded** | **3** (F-4 AR delivery · F-6 FRD 5.1.2 · F-12 Vendor/Reviewer tenancy) |
| **FRD contradictions resolved** | **1** (F-3 SSO phase) |
| **Files created by this task** | **1** — this document |
| **Files modified by this task** | **0** |
| **FRD modified** | ❌ No — `source/` unchanged |
| **Branding modified** | ❌ No — `branding/` unchanged |
| **Figma modified** | ❌ No |
| **Git commit made** | ❌ No |
| **Review 006 started** | ❌ No |

**Next free register IDs for Review 006:** `D-26` · `A-50` · `Q-57` · `C-11`

**Precedence after this document:**

1. **This document** (PM-confirmed, 18 August 2026)
2. `source/Platform FRD_v4.pdf` — **read-only**, deviations recorded in §F
3. `ui-ux/01-requirements/DECISIONS.md` (D-01 – D-25) — where not superseded by §C
4. Clearly labelled reversible assumptions (`ASSUMPTIONS.md`)
5. External reference research

**An assumption is never silently converted into a confirmed requirement.**
