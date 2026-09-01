# 02 — Previous Decisions Superseded

| | |
|---|---|
| **Status** | ✅ **SUPERSESSION RECORD** |
| **Created** | 31 August 2026 |
| **Rule** | **History is not rewritten.** No earlier file is edited. Every row below marks a prior position as *superseded* or *currently overridden* **in this register only** |

---

## How to read the Status column

| | |
|---|---|
| 🔴 **SUPERSEDED** | The prior position is replaced. Do not carry it forward |
| 🟠 **OVERRIDDEN IN PART** | One half of the prior position is replaced; the other half stands |
| 🔵 **RECLASSIFIED** | Nothing about the artefact changes; its *position*, *priority* or *framing* changes |
| 🟢 **VALIDATED** | The prior position was right, and the new decision confirms it. Listed so it is not "corrected" by mistake |
| ⚪ **CLOSED** | An ambiguity or open question that is now answered. Nothing was wrong; something was missing |

---

# A · The supersession table

| # | Previous decision / assumption | Old source | New decision | New source | Status | Affected batch | Required correction |
|---|---|---|---|---|---|---|---|
| **1** | **PM-04 — *"Do NOT treat B2B-first / B2C-second as a PM-confirmed release sequence"*** | `PM_CONFIRMED_BASELINE_2026-08-18` PM-04 | **B2B is the current delivery priority; direct self-service B2C is deferred/secondary.** Both remain in the architecture | `STK31-04` · 31 Aug review + follow-up | 🟠 **OVERRIDDEN IN PART** — the *prohibition on sequencing* is overridden; *"both must be represented in the platform architecture"* **stands** | **04** *(classification)*, and the build order of all | Reclassify Batch 04 as the deferred secondary route. **Delete nothing.** Do not let B2C checkout drive the Phase-1 build |
| **2** | **Bundle = an arbitrary group of three modules** — `o_bgeo` and `o_bmech`, three module ids each | Batch 04 `03_CATALOGUE_AND_PRODUCT_MODEL.md`; **never FRD-sourced** — the v5 glossary carries *no cardinality* | **Programme / Department Bundle → Course sub-bundles → Experiments → Available Technologies** | `STK31-12`, `STK31-13` | 🔴 **SUPERSEDED** | **04** | Replace the flat three-module bundle with the academic hierarchy. Bundle **pricing** remains uninvented — FRD 6.3.x is Phase 2 |
| **3** | **Student and Learner may be two product terms** | `PM29-A8` / `PQ-12` — raised by the 29 Aug handwritten diagram | **One formal role, two contexts.** Planning term `Student / Learner` | `STK31-01` | ⚪ **CLOSED** — the split is **not** adopted | **01, 02, 03, 04** *(no change)* | None. **The status-quo reading is confirmed**; the speculative rename is cancelled |
| **4** | **Super Admin is read-only across tenants** — `D-02`: *"no cross-tenant write is designed"* | Batch 05 `02_SUPER_ADMIN_AUTHORITY_AUDIT.md` `C-01`, `D-02` | **Super Admin approves, creates, governs, terminates tenants; assigns Tenant Admins; allocates content and technology; governs platform roles** | `STK31-21`, `STK31-24`, `STK31-40`, `STK31-41` | 🔴 **SUPERSEDED** | **05** | `SA-02`, `SA-03`, `SA-09` gain write authority. Four new capability areas. See `13` Part E |
| **5** | **Batch 05 `R-01` institution creation / onboarding — REFUTED** | Batch 05 authority audit | **Confirmed Super Admin capability** | `STK31-21` | 🔴 **REFUTATION REVERSED** | **05** | Build the tenant request → approval → creation workspace |
| **6** | **Batch 05 `R-02` assign the first Institute Admin — REFUTED** | Batch 05 authority audit | **Confirmed Super Admin capability** | `STK31-21` | 🔴 **REFUTATION REVERSED** | **05** | Tenant Admin assignment surface. *(Identity origin — how a person first exists — remains `QD-02`/`ND-01`-adjacent)* |
| **7** | **Batch 05 `R-03` / `R-04` Vendor and Academic Reviewer administration — REFUTED** | Batch 05 authority audit | **Confirmed — account governance AND per-Course / per-Experiment assignment** | `STK31-41` | 🔴 **REFUTATION REVERSED** | **05** | A role-holder registry **and** a per-content assignment surface |
| **8** | **Batch 05 `R-05` / `R-06` — Super Admin grants learner entitlement / assigns content to learners or cohorts — REFUTED** | Batch 05 authority audit | **Still refuted.** `STK31-25` assigns learner-level content assignment to the **Tenant Admin** | `STK31-25` | 🟢 **VALIDATED — do not reverse** | **05** | **None.** The tenant/learner altitude distinction is load-bearing |
| **9** | **Tenant content allocation has no named actor** — Batch 03's content-access origin line carries *a date and no actor* | Batch 03 `03_INSTITUTION_ACCESS_MODEL.md` | **Super Admin allocates Courses, Experiments and technology variants to a Tenant** | `STK31-24` | ⚪ **CLOSED — a blank built to be filled** | **03** *(one line)*, **05** *(a new surface)* | Batch 03 `INA-06` origin gains an actor. Batch 05 gains the granting end, which exists nowhere |
| **10** | **Arbitrary seat / cap figures** — e.g. a `5,400` student cap | Pre-Batch-03 working assumptions; **FRD 6.2.2 says *may*** | **Quantity is per institutional request. No universal fixed seat cap. Arbitrary sample caps must not be restored** | `STK31-27` | 🟢 **VALIDATED** — Batches 03 and 05 had already removed every such figure | **03, 05** | **None.** Future quantity displays must derive from the **approved request**, never from a sample |
| **11** | **Descriptive grading owner undefined** — Batch 02's `result.state:'pending'` has *"no evaluator, rubric, turnaround, queue or grading record"* | `QP-02`, HIGH, open since Review 006 | **Faculty is the ONLY human evaluator.** Optional auto-review assists; an AI score is **not** automatically final | `STK31-31` | ⚪ **CLOSED** — *the only open item that could strand a learner* | **02** | A Faculty descriptive-evaluation queue becomes buildable. The pending state gains an owner |
| **12** | **Post-attempt feedback policy undefined** | `QP-27`, HIGH, open | **Faculty controls it** — show immediately / after deadline / on custom date. **BITS = Taxila-reference pending** | `STK31-32` | ⚪ **CLOSED for general contexts** · 🟠 BITS pending | **02** | A policy control on the assessment settings step. **`D-25` — the learner never sees the answer key — is untouched** |
| **13** | **Learning-outcome ownership undefined** — flagged `N-1`, *"candidate home"* on the **Vendor** submission screen | `ui-ux/16-unified-product-planning/01_EXISTING_SCREEN_REUSE_MAP.md` | **Academic Reviewer owns Learning Outcomes** | `STK31-08` | ⚪ **CLOSED** | **01** | Learning Outcomes move to the academic-review step, not the Vendor metadata form |
| **14** | **First publication vs later version release conflated** — FRD 1.4.4 gives publication to Super Admin; the 29 Aug transcript reopened it | FRD 1.4.4 · `PM29-A1` / `PQ-01` | **FIRST PUBLICATION = Content Manager. LATER VERSION RELEASE/HOLD = Super Admin.** Two objects, two owners, one terminology firewall | `STK31-06`, `STK31-07` | ⚪ **CLOSED** · 🔴 the historical Super-Admin-as-first-publisher reading is **SUPERSEDED** | **01, 05** | Batch 01's four *"release"* strings that mean *publish* must be re-worded. Batch 05 `SA-04`/`SA-05` are **confirmed, no longer provisional** |
| **15** | **AI question generation is prompt-only / random** | Batch 02 `B06` — request → generating → drafts, from a prompt | **Faculty supplies source material and/or context;** AI drafts; **Faculty review stays mandatory** | `STK31-33` | 🟠 **OVERRIDDEN IN PART** — the review-required model **stands**; the input model expands | **02** | Add a source-material input to `B06`. Nothing else changes |
| **16** | **Tenant Admin has no people-provisioning control** — `DA-04`: *"no such control exists"*; Faculty rows show `—` in Source | Batch 03 `DA-04` | **Tenant Admin provisions Faculty and Students — manually and by CSV bulk import** | `STK31-25`, `STK31-26` | 🔴 **SUPERSEDED** — *the largest single gap in the built work* | **03** | Manual add · CSV import · per-row error report. ⚠ Creates the **CSV ↔ ERP write conflict** (`ND-04`) |
| **17** | **The assumption that the Tenant Admin could NOT be the learner-content assignment owner** | Read into Batch 03's `DA-07` restraint; the Review-006 matrix grants `E3` to **both** Faculty and Institute Admin | **Tenant Admin performs Course/Experiment assignment from the tenant's approved content** | `STK31-25` | 🔴 **SUPERSEDED** | **03, 02** | Batch 03's `DA-07` eligibility editor is **confirmed in place**, no longer reversible-pending |
| **18** | **B2C-first / authenticated-first catalogue emphasis** — Explore sits behind sign-in | Batch 04 `02_B2C_LEARNER_UX_MODEL.md`; correct against FRD FLOW 3 | **Public pre-login catalogue is required** | `STK31-16` | 🔵 **RECLASSIFIED** — the **position** is superseded, the **artefact** is not | **04** | Lift the catalogue out from behind sign-in. Every component survives |
| **19** | **`DA-01` direct single-item access / checkout as the transaction model** | Batch 04 `04_CHECKOUT_AND_ENTITLEMENT_MODEL.md`, labelled reversible | **B2B uses a selection basket + request preparation. The cart never grants access** | `STK31-18` | 🔴 **SUPERSEDED as the B2B model** · 🟢 preserved for the deferred B2C route | **04** | A selection/request object is **new**, not a modification of `DA-01` |
| **20** | **`Semester` is a mandatory learner field** | The 29 Aug handwritten notes, `PM29-25` | **Semester is tenant-selectable and OPTIONAL. Never mandatory anywhere** | `STK31-11`, `STK31-26` | 🔴 **SUPERSEDED** | **03, 02** | Remove any mandatory treatment. Its only FRD appearance is a **Phase-2** version-locking line |
| **21** | **`Module` as the learning-unit noun** — 627 corpus occurrences; Batch 02 (61 labels) and Batch 05 (9) use it; **Batch 04 uses both** | Batches 02, 04, 05 | **`Experiment` is the canonical planning term** | `STK31-14` | 🔴 **SUPERSEDED as the planning term** · 🟢 historical batches keep their copy | **All five** | A **single** rename, performed **once**, in the unified build. **Historical batches are not touched** |
| **22** | **`Programme` avoided because it collides with the PM-12-deferred certification program** | Batch 03, deliberately | **`Programme / Department Bundle` is the top hierarchy level — a DIFFERENT object from FRD 3.3.1** | `STK31-12` | ⚪ **CLOSED** · 🟣 the collision is **recorded, not resolved by inference** | **03, 04** | Introduce the level. **PM-12 is not reversed; no Phase-1 certification experience is created** |
| **23** | **Technology is an informational property of an experiment** | All five batches — `fmt ∈ Web\|VR\|MR\|AR`, a private constant map in each prototype | **Technology is a selectable dimension.** Institutions choose combinations; access/licensing/pricing may differ | `STK31-15` | 🔴 **SUPERSEDED as a display-only property** | **01, 03, 04, 05** | A technology selector, a technology-bearing access record, and **per-technology progress** (`STK31-36`) |
| **24** | **Progress is one completion state per experiment** | Batch 01 *(stored enum)* · Batch 02 *(derived four-part)* — PM-09 confirms Batch 02's model | **Progress must be expressible per assigned technology** | `STK31-36` | 🟠 **OVERRIDDEN IN PART** — PM-09's derivation model **stands**; it gains a dimension | **01, 02** | The merged progress model carries a technology axis |
| **25** | **BITS / WILP / Goa / Pilani topology unknown** — three readings, one requiring a sub-tenant level no source contains | `PM29-A7` / `PQ-11` | **An individual operational campus/unit can be its own Tenant.** On-campus / off-campus categorisation | `STK31-23` | ⚪ **CLOSED** — **separate tenants; no sub-tenant level is created** | **03, 05** | FRD 1.3.1 isolation applies **between** campuses. Sample institutions must not be hardcoded as production records |
| **26** | **No institutional access duration** — Batch 03's effective dates derive nothing; Batch 04's access is perpetual | Batches 03 / 04 | **Access term + a REQUIRED 15-day pre-expiry reminder to the Tenant.** Active / Expiring soon / Expired / Renewed. **No automatic renewal assumed** | `STK31-28` | 🔴 **SUPERSEDED — perpetual access is no longer the model** | **03, 04, 05** | The access record gains a term. **A reminder capability is new** *(channel pending, `ND-16`)*; an in-product expiry-attention surface is **recommended supporting UX** |
| **27** | **Batch 05 `SA-09` platform roles is read-only** — *"No institutional person appears on this screen. No institutional role can be assigned from here."* | Batch 05 `DA-04` | **Super Admin governs Vendor / Academic Reviewer / Content Manager, globally and per Course/Experiment** | `STK31-41` | 🔴 **SUPERSEDED** | **05** | `SA-09` becomes writeable; a per-content assignment surface is new |
| **28** | **No support or issue-reporting capability anywhere** | No FRD requirement; absent from all five batches | **Help/support is required at both ends** | `STK31-39` | ⚪ **CLOSED — a wholly new capability area** | **All** *(shell)*, **05** | A user report path and a platform issue queue. ⚠ Also resolves the **WCAG 2.2 SC 3.2.6 Consistent Help** inconsistency across batches |
| **29** | **Stage 3 of the 29 Aug consolidation sequence — *"correct the affected functional batches in place, then merge"*** | `ui-ux/15-post-pm-alignment/13_CONSOLIDATION_SEQUENCE.md` Stage 3 | **Preserve Batches 01–05 untouched; build ONE corrected unified prototype** | `15_IMPLEMENTATION_BACKLOG_AND_SEQUENCE.md` §1, on task direction consistent with `STK31-47` / `PM29-01` | 🔴 **SUPERSEDED as the implementation route** | **All five** *(they are now references only)* | See `15` §1 for the Option A vs Option B comparison and the evidence |

---

# B · Sanity check — what is NOT superseded

**Listed because a supersession register invites over-correction.**

| Standing rule | Source | Status after 31 Aug |
|---|---|---|
| **A Vendor can never publish** | FRD 1.4.5 — the only explicit role prohibition | ✅ **Untouched.** Applies to internal submitters too (`STK31-03`) |
| **Analytics never cross a tenant** | FRD 1.3.4, except Super Admin governance access (1.3.5) | ✅ Untouched |
| **Institutions cannot modify or redistribute content** | FRD 1.1.4 | ✅ Untouched |
| **A learner never authors or configures an assessment** | PM-15 · matrix `F12` | ✅ **Reinforced** by `STK31-30` |
| **A learner never sees the correct-answer key** | `D-25` · matrix `F11` | ✅ **Untouched** by `STK31-32` |
| **Certification is Phase 2** | PM-12 | ✅ **Untouched.** `STK31-12`'s *Programme* is a different object |
| **No invented analytics dashboards or KPIs** | PM-11 | ✅ **Scoped, not overridden**, by `STK31-29` / `STK31-42` / `STK31-43` |
| **Seven roles; no eighth** | PM-07; FRD 8.3 custom roles is Phase 3 | ✅ **Reinforced** by `STK31-01`, `STK31-02`, `STK31-03` |
| **Assessment values are SAMPLE, not platform constants** | PM-08 | ✅ Untouched |
| **Learning progression: resources → simulation → assessment → completion** | PM-09 | ✅ **Untouched**, and gains a technology axis (`STK31-36`) |
| **XR delivery mechanism is not selected** | PM-05 · `QT-01` | ✅ **Untouched.** `STK31-37` refines packaging, not mechanism |
| **The FRD is never edited** | Every capture since 18 Aug | ✅ Untouched |
| **A gap is shown as a gap, never as a disabled control** | Batch 05 | ✅ **Adopted as a platform-wide rule** |

---

# C · Roll-up

| Status | Count |
|---:|---|
| 🔴 **SUPERSEDED** *(incl. 3 refutation reversals)* | **13** |
| 🟠 **OVERRIDDEN IN PART** | **4** |
| 🔵 **RECLASSIFIED** | **1** |
| 🟢 **VALIDATED** | **2** |
| ⚪ **CLOSED** | **9** |
| **Total rows** | **29** |

> **Nothing in the built work is deleted by this register.** Twenty-nine rows, and the only artefacts that stop being *current* are two already-withdrawn Super Admin publish screens from a decision made on 25 August. Everything else is either carried forward, re-positioned, or completed.
