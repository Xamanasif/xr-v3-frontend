# 01 — PM Decision Extraction, 29 August 2026

# ⚠ DRAFT — AWAITING MONDAY READ-BACK CONFIRMATION

| | |
|---|---|
| **Document ID** | `PM29_DECISION_EXTRACTION_DRAFT` |
| **Meeting date** | **29 August 2026** |
| **Document created** | 29 August 2026 |
| **Status** | 🟠 **DRAFT — NOT AUTHORITATIVE.** No statement here has been read back to the Project Manager |
| **Type** | Decision *extraction*. **Not** a PM confirmation capture, not an FRD amendment, not a design document |
| **Source** | Direct PM discussion, 29 August 2026, **plus** a handwritten role/data diagram produced by the PM. **The meeting transcript was noisy** |
| **Extends (does not supersede)** | `PM_CONFIRMED_BASELINE_2026-08-18.md` (PM-01 – PM-12) · `13_PM_CLOSURE_DECISIONS.md` (PM-13 – PM-15) · `PM_CONFIRMED_UPDATE_2026-08-25.md` (PM-16 – PM-18) |
| **Modifies** | **Nothing.** No file outside `ui-ux/15-post-pm-alignment/` is touched by this document |

---

## Why this document is a draft and not a confirmation

The three previous PM captures (18 Aug, 19 Aug, 25 Aug) each became authoritative because the statements they recorded were unambiguous and were reviewed as a set. **This meeting was different.** Some statements are as clear as any previous capture. Others survive only as paraphrase, and at least three of them (bundle, version release, cart) contain wording that points in two directions at once.

Converting the whole meeting into `PM-19 … PM-4x` now would **hide that difference**. So this document does the opposite: it separates what can be relied on from what cannot, and refuses to resolve the second group by reasoning.

> **The single rule applied throughout.**
> Nothing is called CONFIRMED because it sounds reasonable, because it is the only workable answer, or because it matches what the design already does. It is called CONFIRMED only where the PM's own statement settles it.

### Identifier scheme

`PM29-nn` — a candidate decision from this meeting. **The prefix is deliberately different from `PM-nn`** so no reader mistakes a draft item for a confirmed one. If Monday's read-back confirms an item, it is re-issued under the next free `PM-nn` number (the chain currently ends at **PM-18**, so the next free number is **PM-19**).

`PM29-Ax` — an ambiguity this meeting created or left. **These are not decisions.** They are recorded so they cannot be silently closed.

### Classification legend

| Class | Meaning |
|---|---|
| ✅ **PM-CONFIRMED — HIGH CONFIDENCE** | The PM settled a question outright. Safe to rely on. Still needs formal read-back before it enters the `PM-nn` chain |
| 🔵 **PM-DIRECTION — HIGH CONFIDENCE** | A clear instruction about what to build or how to proceed. Safe to design *toward*. Not yet a requirement statement |
| 🟠 **PM-DIRECTION — NEEDS READ-BACK CONFIRMATION** | The intent is clear; the exact scope, wording or boundary is not. **Design may not depend on it** |
| ⚪ **OPEN / PENDING** | Named by the PM and deliberately left unresolved, or left unresolved by the noise in the transcript |
| 🔴 **CONFLICT WITH EARLIER PM DECISION** | Points against something a previous PM capture settled |
| 🟣 **FRD CONFLICT** | Points against, or has no basis in, FRD v4 / the consolidated FRD v5 set |
| ▶ **DESIGN CONSEQUENCE** | What the item does to work that already exists. Recorded, **not applied** |

---

# Part A · Confirmed / high-confidence decisions

**Three items.** Each settles something outright.

> `PM29-09` (Tenant Admin / Institute Admin) was initially drafted here and has been **moved to Part B** and reclassified **PM-DIRECTION — HIGH CONFIDENCE**. The role *position* is clear; the *interpretation* has not been read back and the *label* is not settled, so it does not belong among the outright confirmations.

---

## `PM29-01` — Design from the complete user journey; the five prototypes are modules, not products
✅ **PM-CONFIRMED — HIGH CONFIDENCE**

The PM explicitly directed that the design start from the **complete user journey**, and that the separate designs be **combined into the final product** afterwards.

**Consequence for how the existing work is described.** Batches 01–05 are **functional design modules of one platform**, not five finished products. Each was scoped to a flow or a role and each stops cleanly at its own boundary; none of them was ever the product.

| Relationship to earlier decisions | |
|---|---|
| **PM-02** (sitemap → role model → workflows → priority flows → Figma) | **Compatible, and extended.** PM-02 ordered the *architecture* work. `PM29-01` adds an end stage PM-02 never named: **consolidation into one product.** Nothing in PM-02 is withdrawn |
| **PM-03** (one central portal, role-based workspaces) | **Reinforced.** One portal is exactly what "combine into the final product" produces |

▶ **DESIGN CONSEQUENCE.** The consolidation stage is now an explicit deliverable rather than an implied one. It is sequenced in `13_CONSOLIDATION_SEQUENCE.md`. **It does not start now** — see `11_SAFE_WORK_BEFORE_MONDAY.md`.

---

## `PM29-19` — Individual access periods are Monthly, Quarterly and Yearly. There is no Lifetime option
✅ **PM-CONFIRMED — HIGH CONFIDENCE** *(the period set)* · ⚪ **OPEN** *(when B2C becomes active — see `PM29-05`)*

The PM stated the three periods explicitly, and explicitly excluded lifetime access.

🟣 **FRD CONFLICT — recorded, not resolved.** The FRD's Phase-1 B2C requirements are **purchase** requirements, not subscription requirements:

- **6.1.1** *"Users shall be able to purchase individual simulation modules."*
- **6.1.2** *"Users shall be able to purchase bundles of multiple modules."*
- **9.2.1** *"Upon successful payment, licenses shall be automatically activated and linked to the user account."*

**Recurring subscription billing is FRD 9.3.2 — Phase 2.** A monthly/quarterly/yearly period model in Phase-1 B2C therefore either (a) pulls part of 9.3.2 into Phase 1, or (b) describes a fixed-term access grant that is paid once and expires, which is not a subscription at all. **The PM's statement does not distinguish these two.**

▶ **DESIGN CONSEQUENCE.** Batch 04 deliberately shows **no** term, duration, renewal, recurrence or cancellation anywhere (`04_CHECKOUT_AND_ENTITLEMENT_MODEL.md` §3 — *"no recurring toggle · term selector · renewal notice · cancellation link"*). This is fortunate: **`PM29-19` is an addition to Batch 04, not a contradiction of it.** Nothing has to be retracted; a period-selection surface has to be added. It is **not** added now, because `PM29-05` makes direct B2C secondary and the renewal/expiry half of the model is undefined.

---

## `PM29-20` — There is no single confirmed seat model
✅ **PM-CONFIRMED — HIGH CONFIDENCE**

The PM stated that there is **not** currently one universally confirmed seat model, and that quantity may be determined at **request / agreement** level.

**`OQ-03` (seat model) remains OPEN and is now more clearly open than before.**

| Relationship to earlier decisions | |
|---|---|
| **`OQ-03`** (`PM_CONFIRMED_UPDATE_2026-08-25`) | **Reinforced, not closed** |

🟣 **FRD tension — recorded.** FRD **6.2.2** *"Capped Licensing … maximum student count"* exists as a Phase-1 line, and the Review-006 matrix carries it as `H3`. The consolidated FRD v5 already treats it as a draft line rather than a settled rule, and the Super Admin equivalent (**8.2.2**, licence utilisation tracking) is **Phase 2** regardless.

▶ **DESIGN CONSEQUENCE.** Batches 03 and 05 **both already removed every seat, cap, quota and capacity figure**, precisely because `OQ-03` is open (Batch 03 README; Batch 05 `R-10`). `PM29-20` **confirms that removal was correct.** No student cap may be reintroduced anywhere on the strength of FRD 6.2.2 alone.

---

# Part B · High-confidence directional decisions

**Fifteen items.** Each is a clear instruction. **None is yet a requirement statement**, and several carry a scope boundary that is not clear.

---

## `PM29-02` — Visitors browse available XR content **before** login
🔵 **PM-DIRECTION — HIGH CONFIDENCE** · 🟣 **FRD EXTENSION**

The PM compared discovery conceptually to an ecommerce catalogue:

```
public visitor → categories / programmes / courses / experiments
              → opens an experiment
              → understands what it is
              → only then performs login / request / access actions
```

🟣 **FRD EXTENSION — recorded.** **No FRD requirement describes unauthenticated browsing.** The v5 B2C workflow (FLOW 3) is explicit that registration comes **first**:

> **FLOW 3 step 1** — *"The learner self-registers by e-mail or through a supported social login provider…"*
> **FLOW 3 step 2** — *"The learner browses the catalogue of published modules and bundles."*

Every catalogue surface in the source set sits **behind** authentication. Public pre-login discovery is therefore a **new capability**, not a re-reading of an existing one.

▶ **DESIGN CONSEQUENCE — significant.** Batch 04's Explore catalogue is authenticated-first, which was correct against the FRD. Its **components** (card, grid, four filter controls, detail pages, access badges) survive; its **position in the journey** does not. See `09_BATCH_01_05_IMPACT_MATRIX.md` and `10_PHASE1_GAP_INVENTORY_PRE_MONDAY.md`.

---

## `PM29-03` — What a public experiment page may show
🔵 **PM-DIRECTION — HIGH CONFIDENCE** *(that these facts belong there)* · 🟠 **NEEDS READ-BACK** *(that this is the complete set)*

The PM listed: description · learning outcomes · preview / video · supported technology · device / runtime requirement · relevant access information.

**Read as a "may include" list, because that is how it was given.** It is not read as a final content specification.

▶ **DESIGN CONSEQUENCE — low risk.** Every one of these facts **already exists** in the built work: description and summary (Batch 04 `03_CATALOGUE_AND_PRODUCT_MODEL.md`), format badges and device compatibility (Batch 01 `XR Format Badge`, `Device Compatibility`), contents and resource presence (Batch 04 module detail). *Learning outcomes* and *preview/video* are the only two with **no existing surface**. Assembling a public detail page is largely re-composition, not new design.

---

## `PM29-05` — B2B is the immediate focus; direct self-service B2C is secondary
🔵 **PM-DIRECTION — HIGH CONFIDENCE** · 🔴 **CONFLICT WITH EARLIER PM DECISION (PM-04)**

The PM indicated **B2B = immediate / main focus** and **direct self-service B2C = secondary / later focus**.

### 🔴 This points directly against PM-04

> **PM-04 (18 August 2026), verbatim:** *"Both B2B institutional users and B2C individual learners are required. **Do NOT treat B2B-first / B2C-second as a PM-confirmed release sequence.** Both must be represented in the platform architecture."*

**And the FRD agrees with PM-04, on direct enumeration:** FRD 1.1.2 (B2B) and 1.1.3 (B2C) are **both Phase 1**, with no sequencing between them; so are 1.3.2, 1.3.3, 6.1.1, 6.1.2, 6.2.1 and 6.2.2.

### How this document resolves the conflict — and how far

Applying the precedence rule in `02_SOURCE_PRECEDENCE_AND_CONFLICTS.md`, the 29 August statement is explicit on **focus** and silent on **scope**. So the conflict resolves **partially**:

| Question | Resolution |
|---|---|
| Which route gets attention first? | **B2B.** `PM29-05` supersedes PM-04's prohibition on *prioritisation* |
| Does B2C leave Phase 1? | ⚪ **OPEN.** The PM did **not** say so, and PM-04 + FRD 1.1.3 both place it in Phase 1. **Not inferred** |
| Is B2C work deleted or withdrawn? | ❌ **No.** Batch 04 is preserved in full and reclassified as the **secondary route within the same architecture** |

▶ **DESIGN CONSEQUENCE.** A **classification** change, not a design change. Batch 04 is not edited, not withdrawn and not deprioritised out of the architecture — its rollout position changes and its entry model is affected by `PM29-02`, which is a separate matter.

---

## `PM29-06` — The public platform distinguishes two entry contexts
🔵 **PM-DIRECTION — HIGH CONFIDENCE**

Approximately: **Institution / Tenant** and **Individual**.

🟣 **FRD relationship — partial support.** The FRD contains both destinations — **4.2.1** *"Institutions shall register their organization through the platform's institutional onboarding interface"* and **4.1.1** individual self-registration — but **never a public choice point between them.** The two entries exist; the fork does not.

▶ **DESIGN CONSEQUENCE.** A public entry fork is a **new screen with no inventory ID**. The nearest existing row is `AUTH-10` *Institutional onboarding enquiry* (Review-006 inventory, status **NEW**, priority P3) — **never designed in any batch.**

---

## `PM29-07` — The institution / tenant application path
🔵 **PM-DIRECTION — HIGH CONFIDENCE** *(the shape)* · ⚪ **OPEN** *(the fields, and the approving actor)*

```
application / registration → organisation information → SPOC / contact information
   → platform validation → authorisation → tenant creation / access setup
```

**Confirmed by the PM:** this sequence exists, and organisation details plus a SPOC/contact are part of it.
**Not stated:** the field list beyond that, and **who performs validation and authorisation** — see `PM29-A4`.

🟣 **FRD relationship.** FRD 4.2.1's acceptance criterion is *"An institution can be registered and a tenant created, after which institutional configuration becomes available."* Its **Roles column lists Institute Admin and Super Admin** — which is a listing, not a grant, and does not name an approver. **No approval, rejection, pending or SLA behaviour exists in any source.**

▶ **DESIGN CONSEQUENCE.** Batch 05 explicitly **refuted** a Super-Admin-operated onboarding wizard (`R-01`), on the correct ground that FRD 4.2.1's grammatical subject is the institution and no source named an operator. **`PM29-07` supplies part of what was missing** — a platform-side validation and authorisation step now exists as PM direction. It does **not** supply the actor. `R-01` is therefore **no longer refuted, but not yet confirmed either.**

---

## `PM29-08` — Two institutional commercial situations
🔵 **PM-DIRECTION — HIGH CONFIDENCE** *(both branches exist)* · ⚪ **OPEN** *(which institution falls into which)*

| Branch | Sequence |
|---|---|
| **Internal** (BITS / WILP / education-group type context) | request → approval → **access may be provided without payment** |
| **External** institution | request → approval → **commercial / payment cycle** → access |

**The rule determining which institution is paid or free is NOT stated and is NOT invented.** See `PM29-A7` for the related question of whether BITS / WILP / Goa / Pilani are separate tenants at all.

🟣 **FRD relationship.** FRD **6.2.1** says *"Institutions shall purchase packages mapped to academic streams"* — with **no free-of-charge branch anywhere.** A no-payment institutional route is therefore an **extension**. Institutional billing (9.3.1, 9.3.2) is **Phase 2**, which is why `QP-04` — *how is an institutional licence transacted in Phase 1?* — has been HIGH and open since Review 006.

▶ **DESIGN CONSEQUENCE.** Batch 03 begins at *"an access record exists"* and its origin line **carries a date and names no actor**, precisely because this was unresolved. That design choice is **now validated**: it accommodates both branches without change.

---

## `PM29-09` — Tenant Admin and Institute Admin occupy the same role position
🔵 **PM-DIRECTION — HIGH CONFIDENCE** *(on the role position)* · 🟠 **NEEDS READ-BACK CONFIRMATION** *(on the final product label)*

The PM used **Tenant Admin** and **Institute Admin** in the same conceptual position. The handwritten diagram shows:

```
Super Admin  →  Tenant Admin / Institute Admin  →  Faculty  →  Student
```

### Current interpretation

> **Tenant Admin and Institute Admin represent the same formal role concept in the current architecture.**

**This is a working interpretation carried at HIGH confidence, not a confirmed product decision.** The discussion and the diagram place the two names in one position strongly enough to design against; they do not settle which word the product uses, and **the reading itself has not been read back to the PM.**

### Still pending

- **The final product-facing role label.**
- Read-back of the interpretation above — that the two names are one role concept rather than, for example, two positions the PM was distinguishing.

**What is NOT pending: the role count.** The system still has **seven formal roles**, and **no eighth role is created by this item**. That is the one part of this entry that rests on a settled decision (PM-07) rather than on the 29 August reading.

| Relationship to earlier decisions | |
|---|---|
| **PM-07** (seven roles, no more) | **Not disturbed.** The seven-role set is unchanged. FRD 8.3 custom-role creation is Phase 3 and still cannot be used to add one |
| **PM-13** (two-plane model) | **Consistent.** The role sits on the tenant plane under either label |

🟣 **FRD note — not a conflict.** FRD **8.1.3** names the role **Institute Admin**. *"Tenant Admin"* appears **nowhere** in FRD v4 or in the v5 set; *"tenant"* appears only as a data-isolation concept (1.3.1, 1.3.2, 1.3.5). The PM's alternative label is therefore **new vocabulary**, not a competing requirement.

▶ **DESIGN CONSEQUENCE.** Batch 03 uses *Institute Admin* in every screen, route, document and prototype string, and **keeps using it** until the label is confirmed. A later change would be a **mechanical rename with no structural effect** — but it touches every Batch-03 artefact and should be made **once**, after confirmation, not twice. See `PQ-09`.

---

## `PM29-10` — Tenant Admin provisions Faculty and Students, manually and by bulk CSV
🔵 **PM-DIRECTION — HIGH CONFIDENCE** · 🟣 **FRD EXTENSION**

The PM explicitly discussed **manual user creation/addition** and **bulk CSV upload**, and stated that the Tenant Admin should not need to add every learner one by one.

🟣 **FRD EXTENSION — recorded, and larger than it looks.**

| What the FRD has | Where |
|---|---|
| Student accounts **auto-created from institutional ERP** | 7.2.2 |
| Faculty **question bank** upload by structured spreadsheet | 5.1.1 — *the only spreadsheet upload in the entire FRD*, and it uploads **questions**, not people |
| Manual creation of a person by an administrator | **Nowhere** |
| CSV import of people | **Nowhere** |

`PM29-10` therefore adds a **second and a third** provisioning route alongside ERP. It also touches the long-open `QP-07` — *who creates and manages Faculty accounts?* — which FRD 8.1.3 leaves undefined (it names only *"student access"*).

▶ **DESIGN CONSEQUENCE — this is the largest single gap in the built work.** Batch 03 has **no provisioning control of any kind**, by explicit design assumption `DA-04`, and its Faculty rows show `—` in the Source column *"because who creates a Faculty account is undefined"*. `PM29-10` fills that hole with direction — but the CSV **schema** does not follow from it (see `PM29-25`).

---

## `PM29-11` — Faculty capabilities
🔵 **PM-DIRECTION — HIGH CONFIDENCE** *(the four capabilities)* · 🟠 **NEEDS READ-BACK** *(what "analytics" means)*

The PM's list: see experiments available to the tenant · work with those experiments · create assessments · see student usage / progress / analytics.

| Capability | Status against existing sources |
|---|---|
| Create assessments | ✅ **Already confirmed and already built.** PM-08, PM-15, FRD 5.1.1/5.1.2/5.3.1/5.3.2/8.1.4 — designed in Batch 02 |
| See student usage / progress | ✅ Supported — FRD 8.1.4, 11.1.x, 11.2.x, matrix `F9`/`K2`–`K6`. **Only minimally built** (Batch 02 keeps it small per PM-11) |
| **See experiments available to the tenant** | 🟠 **New surface.** No Faculty catalogue or experiment-browse screen exists in any batch |
| **"analytics"** | 🟠 **Read-back required.** 🔴 This word points against **PM-11** — *"do not invent large analytics dashboards now… detailed report metrics/KPIs remain pending"* — and every FRD dashboard requirement (8.2.x, 11.3.x, 11.4.x) is **Phase 2 or 3** |

> **No analytics metric is defined on the strength of this item.** Until read-back establishes otherwise, *analytics* is read as the **operational learner status** PM-11 already permits, which is what Batch 02 built.

---

## `PM29-12` — Student / institutional learner capabilities
🔵 **PM-DIRECTION — HIGH CONFIDENCE**

See experiments made available to them · access learning content · see progress and completion · access the AR/VR runtime where appropriate · use Web/WebGL experiences in-browser where appropriate.

**Every one of these is already confirmed and already designed.** FRD 8.1.5 · PM-09 · PM-05 · PM-03 · FRD 1.2.1. The learner journey is the most complete part of the platform: Batch 01 FLOW B (entitlement → device compatibility → availability → completion), Batch 02 (assessment), Batch 03 `INA-13` (institutional eligibility reaching the learner).

▶ **DESIGN CONSEQUENCE — none, with one caveat.** `PM29-12` **reinforces** existing work. The caveat is `PM29-14`: the PM's technology list omits **MR**, which the learner design currently supports as a fourth format.

---

## `PM29-13` — Content hierarchy: Program → Course → Experiment → Available Technology
🔵 **PM-DIRECTION — HIGH CONFIDENCE** *(the spine Course → Experiment)* · 🟣 **FRD CONFLICT** *(on "Program" and on "Technology" as a level)*

### 🟣 Conflict 1 — "PROGRAM"

**In the FRD, the word *program* has exactly one Phase-1 meaning: *certification program* (3.3.1)** — *"Certification programs shall consist of one or more courses grouped into a structured learning pathway."* **PM-12 deferred certification to Phase 2.**

There is **no generic academic-programme level** anywhere in the FRD content hierarchy. The FRD hierarchy is:

```
Certification Program (3.3.1 — PM-12 DEFERRED)  →  Course (3.2.1)  →  Module (3.1.1)
```

So the PM's *Programme* is either (a) the certification-program node under a new name, which PM-12 deferred, or (b) an academic programme (e.g. *B.Tech Civil Engineering*) that no source contains. **These are different objects and the transcript does not distinguish them.**

**This has already been avoided once, deliberately.** Batch 03 states it explicitly:

> *"The word 'program' is not used. Its only Phase-1 appearance in the FRD is certification programs (3.3.1), which PM-12 defers to Phase 2. Borrowing it here would collide with a term that already means something else in this product."*

Batch 03 uses **Academic stream** (FRD 7.2.3) and **Group** instead. Whether the PM's *Programme* is Batch 03's *Stream*, or a level above it, or the deferred certification node, is **unresolved**.

### 🟣 Conflict 2 — "AVAILABLE TECHNOLOGY" as a hierarchy level

In the FRD, simulation format is a **property of the module** (1.2.1–1.2.4), not a child node. `PM29-13` places it as a fourth level — which is coherent only if a single experiment has **multiple technology implementations that can be selected between**. `PM29-18` says the PM did discuss exactly that. **It remains unconfirmed.**

### What *is* safe

**Course → Experiment**, with an Experiment mapped to a Course and a Course holding several Experiments (`PM29-17`), is consistent with FRD 3.2.1 + 3.1.1 under the reading Experiment ≡ Module. **That spine is the high-confidence part.** The level above it and the level below it are both unresolved.

---

## `PM29-14` — Available technologies: AR, VR, Web / WebGL
🔵 **PM-DIRECTION — HIGH CONFIDENCE** *(these three exist)* · 🟣 **FRD CONFLICT** *(MR is missing)*

🟣 **The FRD defines FOUR Phase-1 formats, not three:**

| FRD | Format | Runtime |
|---|---|---|
| 1.2.1 | **Web** | Standard browser, no XR hardware |
| 1.2.2 | **VR** | VR headsets (e.g. Meta Quest) — master app, FRD 2.1.1 |
| **1.2.3** | **MR** | **MR hardware (e.g. Ajna Lens) — sideloaded application, FRD 2.1.2** |
| 1.2.4 | **AR** | Android / iOS mobile |

**The PM's list omits MR.** Nothing in the transcript says MR is dropped. **This is not read as a removal** — an omission in a spoken list is not a decision, and MR carries its own dedicated Phase-1 requirements (1.2.3, 2.1.2) and an open question (`QP-14`, who authorises MR sideloading).

Separately, **"WebGL" appears in no source.** The FRD says *"standard web environments"* / *"standard web browser"*. WebGL is a specific rendering technology; naming it in product UI would assert an implementation the FRD does not.

▶ **DESIGN CONSEQUENCE.** Batch 01 designs **all four** format badges and device-compatibility states. **Nothing is removed.** MR's status is added to the Monday list (`PQ-13`).

---

## `PM29-17` — An Experiment is mapped to a Course; a Course may hold several
🔵 **PM-DIRECTION — HIGH CONFIDENCE**

The handwritten example says approximately **5–10 experiments** per course.

> **This is illustrative sample context. It is NOT a cardinality requirement.** No minimum, no maximum, no validation rule and no capacity assumption follows from it. Recorded exactly as the previous PM captures recorded the Review-005 assessment values: **SAMPLE**, per PM-08's precedent.

🟣 **FRD relationship — aligned.** FRD 3.2.1 defines a Course as *"a collection of modules"*, and 3.2.2 has the Course define the sequence. Under Experiment ≡ Module this is the FRD's own model.

---

## `PM29-21` — Super Admin sits centrally over the platform's roles
🔵 **PM-DIRECTION — HIGH CONFIDENCE** *(the structure)* · 🔴 **CONFLICT WITH THE BATCH-05 MODEL**

The handwritten PM diagram places Super Admin over: Tenant / Institute Admin · Content Manager · Academic Reviewer · Vendor · Learner.

🟣 **FRD relationship — aligned in substance.** FRD **8.1.1** grants *"full administrative control over platform configuration, module publishing, licensing management, and cross-tenant analytics"*, and **1.3.5** makes Super Admin the only cross-tenant role. **PM-13** already places Vendor, Academic Reviewer and Content Manager on the central plane with Super Admin. The diagram is consistent with all of that.

🔴 **The conflict is with the current design, not with the requirements.** Batch 05 built Super Admin as **two write actions and one bounded read** — version release/hold (2.3.2), device-replacement approval (2.4.2), read-only cross-institution oversight (1.3.5) — because at the time of that audit, **no source named any other Super Admin action.** Its `R-01` … `R-14` table refutes fourteen candidate capabilities on exactly that ground.

**`PM29-21` through `PM29-24` are now a source.** Several of those refutations are therefore no longer safe. Which ones, precisely, is worked out in `09_BATCH_01_05_IMPACT_MATRIX.md` — and it is **not** all of them.

---

## `PM29-22` — Super Admin platform and tenant governance
🔵 **PM-DIRECTION — HIGH CONFIDENCE** *(the areas)* · ⚪ **OPEN** *(the exact actions)*

The direction covers: institution / tenant governance · defining and authorising the Tenant Admin · deciding and controlling what experiments a tenant receives · platform-side role governance · Vendor / Academic Reviewer / content-side role governance.

**Exact actions still require boundary analysis and are not fixed here.** *Governance* is not a verb; *approve*, *create*, *assign*, *revoke* and *suspend* are, and the transcript names none of them precisely.

🟣 **FRD relationship.** *Platform role assignment* is directly supported — the consolidated FRD's Super Admin section states *"Manage platform configuration and platform role assignment (8.1.1)"*. **But the Phase-1 mechanism is a standing HIGH open question (`QD-02`)**: FRD 7.4.2 (IdP role mapping) and 8.3 (custom roles) are both **Phase 3**, so *how* anyone becomes a role-holder in Phase 1 is undefined.

▶ **DESIGN CONSEQUENCE.** Batch 05 `SA-09` *Platform roles* is **read-only** with no create, assign, revoke or deactivate control (`DA-04`), and states on the screen: *"No institutional person appears on this screen. No institutional role can be assigned from here."* **That position is now too conservative** — but the replacement cannot be designed until the mechanism (`QD-02`) and the actor boundary are settled.

---

## `PM29-23` — Super Admin defines which experiments a tenant receives
🔵 **PM-DIRECTION — HIGH CONFIDENCE**

In substance: **Super Admin defines what experiments are given to a particular tenant. Faculty then sees the experiments available to that tenant. Tenant-side users operate only within that allowed set.**

**This is the most structurally consequential item in the meeting**, because it inserts a stage the platform model did not have: between *published centrally* and *entitled to a learner*, there is now an explicit **tenant allocation** step with a named owner.

```
BEFORE (Review 006 · FRD 1.4.4 → 6.2.1 → 7.2.3 → 8.1.4)
   published → institutional licence (stream package) → stream mapping → faculty assignment → learner

AFTER (as directed 29 Aug)
   published → SUPER ADMIN ALLOCATES EXPERIMENTS TO TENANT → tenant's available set
             → [tenant-side assignment — OWNER OPEN, PM29-A3] → learner
```

🟣 **FRD relationship — this fills a silence rather than contradicting text.** The FRD reaches the tenant through **stream-mapped packages** (6.2.1) and **ERP-derived stream assignment** (7.2.3), and **never says who decides which content a given institution may use.** `PM29-23` names Super Admin as that decider. It does **not** say whether the unit allocated is an experiment, a course, or a package — the PM said *experiments*.

▶ **DESIGN CONSEQUENCE — Batch 03 anticipated this exactly.** Batch 03's spine is:

> `INSTITUTION CONTENT ACCESS → ELIGIBILITY → LEARNER ELIGIBILITY → CONTENT IN MY LEARNING`

with the content-access record's origin line deliberately carrying **a date and no actor**, *"because no source confirms who records institutional content access."* **`PM29-23` supplies that actor.** This is a fillable blank in a design built to accept it — the best possible outcome, and one of the strongest signals in this whole review that the conservative approach paid off.

**What it does NOT settle:** who assigns an allocated experiment to a *particular student or group* inside the tenant. See `PM29-A3`.

---

## `PM29-25` — Handwritten mandatory metadata for the institutional learner record
🔵 **PM-DIRECTION — HIGH CONFIDENCE** · 🟠 **NEEDS READ-BACK CONFIRMATION BEFORE ANY SCHEMA**

The handwritten notes mark these as **mandatory**:

| Field | Marked |
|---|---|
| Programme | mandatory |
| Course Name | mandatory |
| Course ID / Code | mandatory |
| Semester | mandatory |
| Student ID | mandatory |
| Student Name | mandatory |
| Student Email | mandatory |
| **Organisation** | **not mandatory** |

> ### 🟠 This must not become a CSV or database schema on the strength of handwriting.
> A mandatory-field list is a **validation contract**. Getting it wrong produces import failures for real institutional data, and getting it wrong *silently* produces the worst kind: rows that import and mean the wrong thing.

🟣 **FRD CONFLICT — none of this exists in any source.** Verified by direct search of the consolidated v5 set:

| Field | FRD basis |
|---|---|
| Student Name, Student Email | Implied by 4.3.1 / 7.2.2; **never enumerated** |
| Student ID | Batch 03 shows an *Institutional ID* whose format it explicitly declines to specify |
| Course Name, Course ID / Code | **No course-code field exists anywhere in the FRD** |
| **Semester** | Appears **once** in the entire v5 set — FRD **2.19x** *Academic Version Locking*, which is **Phase 2** and is about locking a module version, not about a learner record |
| Programme | See `PM29-13` — the term is contested |
| Organisation | Marked *not mandatory*; no FRD basis either way |

**`QD-07`** — *what module metadata schema does 1.4.3 review?* — has been open since Review 006 for the same reason: **the FRD enumerates no schema for anything.**

▶ **DESIGN CONSEQUENCE. Batch 03 is not modified.** Its person record shows Institutional ID, Role, Academic stream, Groups, Account state, Source, Sign-in method and Content access — a deliberately narrow set justified by FRD 1.3.4 and PM-11. Reconciling it with the handwritten list is **post-read-back work**.

---

# Part C · Conflicts with previous PM decisions

| # | 29 Aug item | Points against | Nature | Resolution taken here |
|---|---|---|---|---|
| **C-1** | `PM29-05` B2B primary, B2C secondary | **PM-04** — *"Do NOT treat B2B-first / B2C-second as a PM-confirmed release sequence"* | 🔴 **Direct reversal of a prohibition** | **Partial.** Focus/priority → 29 Aug wins. Phase-1 *scope* of B2C → **stays open**; PM-04 and FRD 1.1.3 are not overridden by silence |
| **C-2** | `PM29-11` Faculty sees *"analytics"* | **PM-11** — *"do not invent large analytics dashboards now"*; detailed metrics pending | 🟠 **Wording tension, not a stated reversal** | **Unresolved. No metric defined.** Read as PM-11 operational status until read-back |
| **C-3** | `PM29-22` Super Admin governs platform roles (write) | **Batch 05 `DA-04`** read-only roles screen; `QD-02` (mechanism undefined) | 🔴 **Design position now too conservative**; ⚪ mechanism still open | Recorded. **No control designed** — the authority is directional, the mechanism is not |
| **C-4** | `PM29-22` Super Admin creates/authorises tenants and Tenant Admins | **Batch 05 `R-01`, `R-02`** — both refuted | 🔴 **Refutation no longer safe** | `R-01`/`R-02` move from **REFUTED** to **OPEN — actor pending** (`PM29-A4`) |
| **C-5** | `PM29-24` Super Admin governs Vendor / Academic Reviewer | **Batch 05 `R-03`, `R-04`** — both refuted | 🔴 **Refutation no longer safe** | Move to **OPEN — scope pending** |
| **C-6** | `PM29-19` Monthly / Quarterly / Yearly | **FRD 9.3.2** subscription billing = Phase 2 | 🟣 FRD phase conflict | Recorded, not resolved. See `PQ-07` |
| **C-7** | `PM29-A1` version release ambiguity | **PM-16/17/18** (CM publishes) + **FRD 2.3.2** (SA releases versions) + Batch 05 `D-01` | 🔴 **Pre-existing conflict, now noisier** | **Explicitly not resolved.** See Part D |

### One conflict that is NOT created — stated so it is not assumed

**`PM29-23` (Super Admin allocates tenant content) does NOT reverse Batch 05 `R-05` or `R-06`.**

| Batch 05 refutation | Still refuted? |
|---|---|
| `R-05` — Super Admin grants/revokes a **learner** entitlement | ✅ **Still refuted.** FRD 8.1.3 names Institute Admin; `OQ-04` is open. The PM spoke about **tenants**, not learners |
| `R-06` — Super Admin assigns courses/modules **to learners or cohorts** | ✅ **Still refuted.** FRD 8.1.4 is the Faculty role definition |

**Tenant-level allocation and learner-level assignment are different objects at different altitudes.** Collapsing them would hand Super Admin a capability the PM did not describe and two FRD requirements assign elsewhere.

---

# Part D · Ambiguous transcript statements — recorded, NOT resolved

## `PM29-A1` — Content publication vs version release ownership
⚪ **OPEN — MUST ASK MONDAY. HIGHEST-PRIORITY AMBIGUITY IN THIS MEETING.**

**Standing, confirmed position (unchanged, and not touched by this document):**

```
Vendor → Academic Reviewer → Content Manager → Published
```
**PM-16 / PM-17 / PM-18 (25 Aug): the Content Manager is the publication owner and performs the final Publish action.**

**Also standing:** Batch 05 retains **FRD 2.3.2** — *"Super Admin shall control when new versions of modules are released to production environments"* — as `SA-04` / `SA-05` (Release version / Hold version), isolated and explicitly reversible.

**The 29 August transcript contains conflicting and ambiguous wording about whether Super Admin has any intervention after the content pipeline.**

> **Two rules applied, and both matter:**
> 1. **The PM-confirmed Content Manager publication decision is NOT changed.** Ambiguity does not override an explicit prior decision (precedence rule, `02_SOURCE_PRECEDENCE_AND_CONFLICTS.md`).
> 2. **Super Admin Version Release is NOT removed.** FRD 2.3.2 is a separate, unchanged Phase-1 requirement with its own flow, and removing it on ambiguity would be the same error in the other direction.

**Classification: FINAL VERSION RELEASE OWNERSHIP = NEEDS PM CONFIRMATION MONDAY.** → `PQ-01`

**Related and still open, deliberately:** **`QP-26`** — *may Super Admin return a submission at the publication gate?* Nothing in this meeting addresses it.

---

## `PM29-A2` — What a Bundle actually is
⚪ **OPEN — MUST ASK PM. MAJOR IMPACT ON BATCH 04.**

The PM **rejected / corrected** the simplistic interpretation *"a Bundle is an arbitrary group of three modules"*. **The transcript does not establish a single safe replacement.**

Interpretations mentioned or discussed, none selected:

| Candidate | What it would change |
|---|---|
| A group of experiments | Closest to today's model; smallest change |
| A course-level package | Makes the **Course** the commercial unit — which touches `QP-28` (direct course purchase, open) and `D-21` (courses are not products) |
| A commercial package | Decouples the commercial unit from the content hierarchy entirely |
| A technology-related purchase grouping | Ties bundling to `PM29-18` — AR/VR/Web variants of the same experiment |

**These four are not variations of one idea. They change what object carries a price**, which changes the catalogue, the detail page, the access record and the entitlement.

🟣 **What the FRD says, for reference — it does not settle this.** The v5 glossary defines Bundle as *"A purchasable group of simulation modules (FRD 6.1.2)"*, with **no cardinality**. So the FRD never said "three" either; the interpretation the PM rejected was never sourced. **6.1.2 is Phase 1 while bundle creation (6.3.1) and pricing (6.3.2) are Phase 2** — `QP-09`, open since Review 006: *bundles are purchasable before anything creates them.*

▶ **DESIGN CONSEQUENCE.** Batch 04 models a bundle as an id-list of modules that grants each individually (FRD 6.1.2's own acceptance criterion), and its **partly-held bundle** state (`DA-10` / `Q-45`) is shown but deliberately **not sold**, because no overlap price can be set without asserting a rule. **All of that is downstream of a definition that is now in question.** → `PQ-02`

---

## `PM29-A3` — Who assigns an experiment to a specific student or group
⚪ **OPEN**

What is clear:

```
Super Admin  → determines tenant content            (PM29-23, high confidence)
Tenant Admin → manages Faculty and Students         (PM29-10, high confidence)
Faculty      → sees tenant experiments, builds assessments, sees progress  (PM29-11)
```

**What is not clear:** which of Tenant Admin and Faculty owns assigning a particular experiment to a particular student or group — or whether both do, at different altitudes.

🟣 **The sources do not settle it either.** Matrix `E3` grants *assign content to learners or cohorts* to **both** Faculty (8.1.4) **and** Institute Admin (8.1.3, 7.2.3). `H5` (grant/revoke learner entitlement) gives Institute Admin `A` and leaves Faculty `?`. `OQ-04` (*how learner entitlement is assigned*) is **open**.

▶ **DESIGN CONSEQUENCE.** Batch 03's eligibility editor is `DA-07` — **DESIGN ASSUMPTION, REVERSIBLE**, and Batch 03 explicitly *"does not claim the assigner is the Institute Admin, Faculty, the institution's data, or any combination."* That restraint holds. **Classification: FINAL TENANT LEARNER CONTENT-ASSIGNMENT OWNER = OPEN.** → `PQ-05`

---

## `PM29-A4` — Who approves a B2B request
⚪ **OPEN**

The PM described *platform / admin / our-team* approval. The final explicit actor is **not** confirmed: Super Admin? another platform operations role? a manual organisational process outside the product?

> **Not guessed.** The difference is not cosmetic: a *product* approver needs a queue, a decision surface, a reason field and a state machine. A *manual organisational* approver needs none of those — it needs a request record and a status the applicant can see.

🟣 **No source names an approver.** FRD 4.2.1 names none; its Roles column lists Institute Admin and Super Admin, which is a listing. **No approval, rejection, pending or SLA behaviour exists in any FRD requirement.** → `PQ-03`

---

## `PM29-A5` — Whether an individual is authorised before paying
⚪ **OPEN**

The transcript contains **both** *"individuals purchase / subscribe"* and *"individuals may send a request / be authorised first"*.

🟣 **The FRD supports only the first.** FLOW 3 is register → browse → checkout → pay → automatic activation (9.2.1), with **no authorisation step anywhere**. An approval gate before individual payment would be a new stage.

▶ **DESIGN CONSEQUENCE.** Batch 04 implements the FRD sequence. If authorisation-before-payment is confirmed, Batch 04 gains a state between *Get access* and *payment* — **not a redesign, but a new state in the access spine.** → `PQ-07`

---

## `PM29-A6` — Public cart versus request list
⚪ **PARTIALLY OPEN — and the split matters**

| Statement | Status |
|---|---|
| **Public discovery** (ecommerce-style browsing before login) | ✅ **CONFIRMED** — `PM29-02` |
| **Direct cart → checkout** as the B2B model | ❌ **NOT CONFIRMED.** The PM used ecommerce/Flipkart-style catalogue language **and later explicitly said the immediate B2B model may NOT behave like direct cart → payment** |
| **B2B add-to-request / request list** | 🟠 **STRONG CANDIDATE**, not confirmed |

**The ecommerce comparison was about *discovery*, not about *transaction*.** Carrying it into checkout would be exactly the kind of silent resolution this document exists to prevent.

🟣 **The FRD is neutral, and says so.** The v5 accuracy corrections name *"a cart-free checkout"* as one of three inherited design positions **wrongly presented as requirements**, now relabelled **DESIGN-PENDING**: *"Whether checkout is single-item or basket-based is DESIGN-PENDING — no requirement specifies a cart model."*

▶ **DESIGN CONSEQUENCE.** Batch 04's `DA-01` (direct single-item access, no persistent cart) is already labelled reversible with **MEDIUM** impact and an explicitly unaffected access spine. **A request-list model for B2B is a different object from a cart** — it collects intent for approval rather than items for payment — and would be **new**, not a modification of `DA-01`. → `PQ-06`

---

## `PM29-A7` — What BITS / WILP / Goa / Pilani are
⚪ **OPEN**

The handwritten page references all four. **It is not established whether they are separate tenants, one tenant with organisational units, or simply example institutions.**

**Why this cannot be inferred.** Each reading produces a different platform:

| Reading | Consequence |
|---|---|
| Separate tenants | FRD 1.3.1 isolation applies between them — no shared learners, no shared reporting, four separate configurations |
| One tenant, organisational units | Requires a **sub-tenant / campus level that no source contains**, and that no batch designs |
| Example institutions only | No structural consequence at all |

▶ **DESIGN CONSEQUENCE.** This is coupled to `PM29-08` (internal may be free) — if *internal* is defined by belonging to the BITS/WILP group, then the group's structure **is** the paid/free rule's input. → `PQ-11`

---

## `PM29-A8` — Learner versus Student as product terminology
⚪ **OPEN**

The handwritten diagram shows **Super Admin → Learner** and, separately, **Tenant Admin → Student**. This *suggests* Learner = individual/B2C context and Student = institutional/B2B context.

🟣 **The sources use the two words interchangeably for one role.** FRD 8.1.5 names the role **Student**. Every downstream artefact — the Review-006 matrix, the IA, the screen inventory (`LRN-*`), all five batches — uses **Student / Learner** as one role, and `PM_CONFIRMED_BASELINE_2026-08-18` §B states plainly: *"B2C Individual Learner is a business/user context, not an eighth role."*

> **Splitting the words into two product terms is a bigger change than it appears.** It would make the label depend on commercial context, which means every shared learner surface needs a context-aware term — and the two contexts already share the entire learning core (Review-006 `06_B2B_B2C_JOURNEYS.md` Part 1). **Not done on the strength of a diagram.** → `PQ-12`

---

# Part E · Decisions requiring Monday confirmation

Ordered by consequence. Full question wording in `12_PM_CLARIFICATIONS_FOR_MONDAY.md`.

| # | What must be confirmed | Blocks |
|---|---|---|
| 1 | `PM29-A1` — version release ownership after CM publication | Batch 05 `SA-04`/`SA-05` keep-or-withdraw; the end of the governance chain |
| 2 | `PM29-A2` — the Bundle definition | Batch 04 catalogue, detail, access record; any commercial modelling |
| 3 | `PM29-A4` + `PM29-07` — tenant approval actor and authority | The entire tenant onboarding flow; several Batch-05 refutations |
| 4 | `PM29-23` boundary — what exactly Super Admin allocates, at what unit | Batch 03 content-access origin; Batch 05 institution write actions |
| 5 | `PM29-A3` — tenant-side learner-assignment owner | Batch 03 `DA-07`; the Faculty/Tenant Admin split |
| 6 | `PM29-A6` — cart vs request list for B2B | The B2B transaction surface; Batch 04 `DA-01` |
| 7 | `PM29-A5` + `PM29-05` — B2C authorisation and Phase-1 timing | Batch 04 rollout position and access spine |
| 8 | `PM29-18` — technology-specific selection and commercial rules | Whether technology is a hierarchy level or a property |
| 9 | `PM29-09` / `PM29-A8` — final role labels | A mechanical rename that must happen **once** |
| 10 | `PM29-25` — the metadata read-back | Any CSV import work |
| 11 | `PM29-A7` — BITS/WILP/Goa/Pilani structure | The internal/external commercial rule |
| 12 | `PM29-11` — what *analytics* means for Faculty | Whether PM-11 is being relaxed |
| 13 | `PM29-14` — is MR still in scope? | Whether a Phase-1 format is being dropped |

---

# Part F · Existing open questions this meeting RESOLVES

**Fewer than it first appears.** Each row below is a question that was genuinely open before 29 August and is now answered — at direction level.

| Question | Was | Now | Confidence |
|---|---|---|---|
| Who decides which content an institution may use? | **Unnamed anywhere.** Batch 03's content-access origin line carried a date and no actor | **Super Admin** (`PM29-23`) | 🔵 HIGH — allocation *unit* still open |
| Is there a public / pre-login discovery surface? | Not in any source; every catalogue was authenticated | **Yes** (`PM29-02`) | 🔵 HIGH |
| `QP-07` — who creates and manages Faculty accounts? | Open since Review 006; matrix `A6` = `?`; Batch 03 Faculty Source = `—` | **Tenant / Institute Admin** (`PM29-10`) | 🔵 HIGH — mechanism and schema still open |
| Is there a bulk route for institutional people? | No source; only ERP auto-provisioning (7.2.2) | **Yes — manual creation *and* CSV** (`PM29-10`) | 🔵 HIGH — schema open (`PM29-25`) |
| `OQ-03` — is there a confirmed seat model? | Open; FRD 6.2.2 implies a cap | **No single confirmed model; quantity may sit at agreement level** (`PM29-20`) | ✅ CONFIRMED |
| Is there a free institutional route? | FRD 6.2.1 says institutions *purchase*; no free branch | **Yes, for an internal context** (`PM29-08`) | 🔵 HIGH — the *rule* is open |
| Does B2C have access periods? | Batch 04 deliberately silent; FRD is purchase-based | **Monthly / Quarterly / Yearly, no Lifetime** (`PM29-19`) | ✅ CONFIRMED — timing open |

---

# Part G · Existing open questions still UNRESOLVED

Carried forward untouched. **Nothing in this meeting closes any of them.**

| ID | Question | Priority | Note |
|---|---|---|---|
| `QP-02` | Who grades descriptive answers, on what turnaround, against what rubric? | **HIGH** | Still the only open item that can strand a learner mid-progression |
| `QP-04` | How is an institutional licence transacted in Phase 1? | **HIGH** | `PM29-08` adds a **free** branch without defining either branch's mechanics |
| `QP-26` | May Super Admin return a submission at the publication gate? | LOW | Untouched. Related to `PM29-A1` but not answered by it |
| `QP-27` | What post-attempt feedback may a learner see? | **HIGH** | Untouched |
| `QT-01` | Which XR delivery mechanism? | **HIGH** | **Pending by explicit PM-05 instruction.** Untouched |
| `QT-02` | No AR application architecture exists in the FRD | **HIGH** | Untouched — and `PM29-14` names AR without supplying one |
| `QT-03` | Assessment configuration API contract | **HIGH** | Untouched |
| `QT-04` | XR sign-in under SSO (2.4.4 vs 4.2.2) | **HIGH** | Untouched |
| `QD-01` | Which profile fields are user-editable vs institution-owned? | **HIGH** | **Now harder** — `PM29-10` adds CSV as a third write path alongside ERP and manual |
| `QD-02` | Phase-1 origin of role assignment | **HIGH** | **Now more urgent** — `PM29-22` asserts the authority without the mechanism |
| `QX-01` | Does desktop-first ~1440px extend to all workspaces? | **HIGH** | Untouched. A public catalogue makes it sharper — public pages are not desktop-only in practice |
| `QX-02` | WCAG 1.4.10 Reflow remains not met | **HIGH** | **Now sharper** for the same reason |
| `QX-03` | Who owns captions, transcripts, audio description? | **HIGH** | **Now sharper** — `PM29-03` puts **preview/video on a public page** |
| `OQ-01`, `OQ-02`, `OQ-04`, `OQ-05`, `OQ-06` | B2B licensing model · what institutions subscribe to · entitlement assignment · non-entitled browse · B2C model | — | `OQ-05` is **partly** addressed: `PM29-02` confirms non-entitled visitors browse, but **how much detail** they see is still open |

---

# Part H · New open questions created by this meeting

| ID | Question | Why it is new |
|---|---|---|
| `PM29-A1` | Version release ownership after CM publication | The transcript reopened a settled-looking area |
| `PM29-A2` | Bundle definition | An interpretation was rejected without a replacement |
| `PM29-A3` | Tenant-side learner content-assignment owner | Two roles gained adjacent responsibilities with no stated boundary |
| `PM29-A4` | B2B request approving actor | An approval step was introduced without an owner |
| `PM29-A5` | B2C authorisation before payment | Two incompatible sequences were both described |
| `PM29-A6` | Cart vs request list | An ecommerce analogy was drawn and then partly withdrawn |
| `PM29-A7` | BITS / WILP / Goa / Pilani topology | Four names with no stated relationship |
| `PM29-A8` | Learner vs Student terminology | A diagram implies a split the sources do not make |
| **`PM29-A9`** | **Is "Programme" an academic programme, a stream, or the deferred certification node?** | `PM29-13` uses a word the FRD reserves for a **PM-12-deferred** object |
| **`PM29-A10`** | **Is MR still a Phase-1 format?** | `PM29-14` lists three technologies where the FRD defines four |
| **`PM29-A11`** | **Is "technology" a hierarchy level, or a property of an experiment?** | `PM29-13` places it as a level; the FRD treats format as a property |
| **`PM29-A12`** | **What does "analytics" mean for Faculty, given PM-11?** | `PM29-11` uses a word PM-11 deferred |

---

# Document control

| | |
|---|---|
| **Candidate decisions extracted** | **25** (`PM29-01` – `PM29-25`) |
| ✅ Confirmed / high confidence | **3** |
| 🔵 Directional / high confidence | **15** |
| 🟠 Needs read-back | **5** *(`PM29-03`, `PM29-09` label, `PM29-16`, `PM29-18`, `PM29-25`)* |
| ⚪ Open / pending | **3** *(`PM29-04`, plus the open halves of `PM29-07`/`PM29-08`)* |
| **Ambiguities preserved** | **12** (`PM29-A1` – `PM29-A12`) |
| **Conflicts with earlier PM decisions** | **7** (C-1 – C-7) |
| **FRD conflicts / extensions recorded** | **7** — public browsing · Programme · MR omission · technology-as-level · CSV people import · subscription periods vs Phase-2 billing · free institutional branch |
| **Existing open questions closed** | **0 formally.** 7 answered at *direction* level, none read back |
| **Files modified outside this folder** | **0** |
| **FRD modified** | ❌ No |
| **Batches 01–05 modified** | ❌ No |
| **Git commit made** | ❌ No |
| **Next free `PM-nn` identifier**, if Monday confirms | **PM-19** |
