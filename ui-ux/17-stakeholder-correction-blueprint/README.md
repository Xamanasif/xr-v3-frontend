# 17 — Stakeholder Correction Blueprint

**XR Simulation Learning Platform** · Branch `uiux/full-platform-design` · **31 August 2026**

> ### ✅ This is the current source of truth for the product.
> **The 31 Aug decisions are authoritative and are not reopened.** Only genuinely unresolved **implementation details** remain pending.
> **No prototype was created. No batch was modified. No open question was closed without an answer. No commit was made.**

---

## What this is

The consolidation of the **31 Aug stakeholder review** — a second detailed review attended by the project intern/designer, a second project intern, the Project Manager, and a primary project stakeholder to whom the product is being presented/delivered — together with that stakeholder's **written follow-up answers**, the co-intern's **handwritten meeting notes**, and direct clarification of previously ambiguous decisions.

> **The stakeholder's formal company title is not asserted anywhere in this package.** The source is named **"31 Aug stakeholder review"** or **"stakeholder-confirmed follow-up"** throughout.

The decisions themselves live in **[`ui-ux/00-project-context/STAKEHOLDER_CONFIRMED_UPDATE_2026-08-31.md`](../00-project-context/STAKEHOLDER_CONFIRMED_UPDATE_2026-08-31.md)** — the authoritative record, `STK31-01` … `STK31-48`. **This package is what those decisions mean for the product and the build.**

---

## The five findings that matter most

### 1 · Twelve preserved ambiguities and thirteen open questions are now answered

`ui-ux/15-post-pm-alignment/` deliberately preserved **twelve ambiguities** (`PM29-A1` … `PM29-A12`) and raised **ten must-answer questions**, on the explicit rule that *"nothing is called CONFIRMED because it sounds reasonable."* **The 31 Aug review answers essentially all of them** — including `QP-02`, the descriptive-grading owner, repeatedly identified as **the only open item that could strand a learner mid-progression through no fault of their own.**

### 2 · Publication and version release are two owners, two objects, one firewall

| Event | Owner | Word |
|---|---|---|
| **First publication of a new Experiment** | **Content Manager** | **Publish** |
| **Release / hold of a later version** | **Super Admin** | **Release / Hold** |

The reason given for the split is operational, not organisational: **the Super Admin has platform-wide visibility into who is using the existing version** and can manage or notify affected users before replacement.

🔴 **This creates a copy collision the unified build must fix:** Batch 05 firewalled *"release"* to mean *not publication*; **Batch 01's shipped copy uses it to mean publish, in four strings.** Both batches are internally correct. The smaller side changes.

### 3 · The B2B cart is not a cart

**Selection basket + request preparation.** It **never grants access.**

```
catalogue → select → technologies → basket → requirements
   → institutional request → SUPER ADMIN APPROVAL → payment WHEN APPLICABLE → activation
```

**Internal / approved-collaborator access skips payment entirely** — *not a hidden step, not a skipped one, not a disabled one.* The route does not contain it. And **no external access is granted before approval.**

### 4 · Three unowned records in the entitlement chain now have owners

Between *published* and *this learner can see it* sit six records. **Three of them had no owner in any batch three days ago.**

| Stage | Owner now |
|---|---|
| Version release / hold | **Super Admin** — `STK31-07` |
| **Tenant content allocation** | **Super Admin** — `STK31-24` *(the largest structural hole in the corpus)* |
| Learner assignment | **Tenant Admin** — `STK31-25` |

**Batch 03's content-access origin line deliberately carried a date and no actor.** `STK31-24` supplies it. **One line changes; the model does not.**

### 5 · Preserve the batches; build the product once

**Option A** — patch all five batches, then merge — pays for every correction twice, has no home for four entirely new capability areas, and **destroys the only thing the batches are still good for: being the validated record of what was reviewed.**

> ## ▶ **OPTION B is recommended.** Preserve Batches 01–05 untouched as reference implementations, and build **ONE corrected unified functional prototype** from the stakeholder-confirmed requirements.

**63 of 101 screens already exist.** This is **reconstitution, not re-invention** — and the evidence that would have favoured Option A is recorded, checked, and absent.

> ⚠ **P0–P3 and the stage numbers are implementation priorities, not project phases.** P0, P1 and P2 are all inside the **current** B2B delivery — including the content-production chain. **P3 is the only genuinely deferred tier, and it contains only B2C.**

---

## The documents

| # | File | What it holds |
|---|---|---|
| **01** | [`01_STAKEHOLDER_DECISION_INDEX.md`](01_STAKEHOLDER_DECISION_INDEX.md) | All **48 decisions** indexed by subject; what the review **closed**; what stays open |
| **02** | [`02_PREVIOUS_DECISIONS_SUPERSEDED.md`](02_PREVIOUS_DECISIONS_SUPERSEDED.md) | **29 rows** — previous decision · old source · new decision · new source · status · affected batch · required correction. Plus **what is NOT superseded** |
| **03** | [`03_CURRENT_PHASE1_SCOPE.md`](03_CURRENT_PHASE1_SCOPE.md) | Current **B2B delivery scope**, and **"Deferred but preserved"** — 13 items with a re-entry condition each |
| **04** | [`04_FINAL_ROLE_AND_AUTHORITY_MODEL.md`](04_FINAL_ROLE_AND_AUTHORITY_MODEL.md) | **Seven roles.** Authority by role · the **eleven hard boundaries** · the two terminology firewalls |
| **05** | [`05_CONTENT_HIERARCHY_METADATA_AND_BUNDLES.md`](05_CONTENT_HIERARCHY_METADATA_AND_BUNDLES.md) | Programme/Department → Course → Experiment → Technologies · metadata ownership · **MR retained** · the terminology table |
| **06** | [`06_PUBLIC_CATALOGUE_AND_B2B_ACCESS_MODEL.md`](06_PUBLIC_CATALOGUE_AND_B2B_ACCESS_MODEL.md) | Public discovery · the selection basket · **both commercial branches** · B2C deferred but preserved |
| **07** | [`07_TENANT_ONBOARDING_AND_ADMIN_MODEL.md`](07_TENANT_ONBOARDING_AND_ADMIN_MODEL.md) | Application → approval → tenant → allocation · Tenant Admin scope · **CSV fields and the ERP conflict** · licence quantity · the 15-day expiry |
| **08** | [`08_FACULTY_ASSESSMENT_AND_ANALYTICS_MODEL.md`](08_FACULTY_ASSESSMENT_AND_ANALYTICS_MODEL.md) | Faculty scope · **descriptive evaluation** · **feedback visibility** · AI from source material · the integration boundary |
| **09** | [`09_STUDENT_LEARNING_PROGRESS_MODEL.md`](09_STUDENT_LEARNING_PROGRESS_MODEL.md) | One role, two contexts · the approved learning journey · **progress per technology** · device lifecycle |
| **10** | [`10_SUPER_ADMIN_PLATFORM_MODEL.md`](10_SUPER_ADMIN_PLATFORM_MODEL.md) | **22 capabilities** · what Super Admin explicitly does **not** do · the four refutations reversed and the four that are not |
| **11** | [`11_XR_DELIVERY_AND_DEVICE_MODEL.md`](11_XR_DELIVERY_AND_DEVICE_MODEL.md) | Package vs hosted link · four formats · technology as a licensable dimension · device transfer · the boundary |
| **12** | [`12_SUPPORT_AND_OPERATIONS_MODEL.md`](12_SUPPORT_AND_OPERATIONS_MODEL.md) | The new support capability · one attention grammar · **Help placement as a WCAG 2.2 Level A obligation** |
| **13** | [`13_BATCH_01_05_EXACT_CORRECTION_MAP.md`](13_BATCH_01_05_EXACT_CORRECTION_MAP.md) | **Screen-level corrections for every batch**, plus 24 cross-batch reconciliations that need no decision |
| **14** | [`14_UNIFIED_SCREEN_REQUIREMENTS.md`](14_UNIFIED_SCREEN_REQUIREMENTS.md) | **101 screens** with plane · role · purpose · source · reusable screen · action · **P0–P3** · dependencies |
| **15** | [`15_IMPLEMENTATION_BACKLOG_AND_SEQUENCE.md`](15_IMPLEMENTATION_BACKLOG_AND_SEQUENCE.md) | **Option A vs Option B**, compared and decided · dependency analysis · **13 stages** · the reuse summary |
| **16** | [`16_REMAINING_NONBLOCKING_DETAILS.md`](16_REMAINING_NONBLOCKING_DETAILS.md) | **16 `ND-nn` items + 16 standing register items**, each with the **safest reversible UX handling** |
| **17** | [`17_CONCEPTUAL_DATA_AND_STATE_MODEL.md`](17_CONCEPTUAL_DATA_AND_STATE_MODEL.md) | **26 conceptual records** — owner · consumers · batch source · new requirement source. ⛔ **No schema, no API** |
| **18** | [`18_REQUIREMENT_SAFETY_CHECK.md`](18_REQUIREMENT_SAFETY_CHECK.md) | The **17 prohibited claims**, verified absent · **11 additional self-checks** · what could not be verified |

> **Files 17 and 18 are additions to the requested file list**, covering the conceptual data model and the requirement-safety verification. Both were explicitly required deliverables; each is large enough to deserve its own file rather than being buried inside another.

### Diagrams

**Each is provided as both Mermaid and ASCII, so it renders anywhere.**

| File | Shows |
|---|---|
| [`diagrams/CURRENT_MASTER_PLATFORM.md`](diagrams/CURRENT_MASTER_PLATFORM.md) | The whole product on one page — **read this first** |
| [`diagrams/CONTENT_PRODUCTION_AND_RELEASE.md`](diagrams/CONTENT_PRODUCTION_AND_RELEASE.md) | Vendor → Reviewer → Content Manager → Published, and **the publish/release firewall** |
| [`diagrams/B2B_REQUEST_TO_LEARNING.md`](diagrams/B2B_REQUEST_TO_LEARNING.md) | **The canonical B2B journey — 24 stages**, and the four gates |
| [`diagrams/TENANT_ROLE_TREE.md`](diagrams/TENANT_ROLE_TREE.md) | Seven roles, three planes, **the altitude rule**, and the eleven hard boundaries |
| [`diagrams/CONTENT_HIERARCHY.md`](diagrams/CONTENT_HIERARCHY.md) | Programme/Department → Course → Experiment → Technologies, with the worked example |
| [`diagrams/ASSESSMENT_FLOW.md`](diagrams/ASSESSMENT_FLOW.md) | Configuration → attempt → **descriptive evaluation** → feedback visibility → progress |
| [`diagrams/SUPPORT_FLOW.md`](diagrams/SUPPORT_FLOW.md) | The new support capability, and **one attention grammar for the whole platform** |

---

## The numbers

| | |
|---|---|
| **Decisions recorded** | **48** (`STK31-01` … `STK31-48`) |
| **Decisions carrying a supersession marker** | **23** — of which **11** override a specific named prior rule |
| **Prior ambiguities closed** | **12** (`PM29-A1` … `PM29-A12`) + `QP-02` |
| **Prior open questions closed** | **13** |
| **Supersession rows** | **29** |
| **Unified screens** | **101** — P0 **36** · P1 **42** · P2 **17** · P3 **6** |
| **Screens that already exist in some form** | **63 of 101 (62%)** |
| **Conceptual records** | **26** |
| **Non-blocking details preserved** | **16 `ND-nn`** + **16** standing register items |
| **FRD deviations / extensions / gaps recorded** | **21** (`S-1` … `S-21`) |
| **Requirement-safety checks passed** | **17 of 17**, plus 11 self-checks |

---

## The rule this package applied throughout

> **A newer explicit decision that conflicts with the FRD or an earlier PM decision is recorded as an override — never silently reconciled.**
>
> Twenty-three decisions carry a supersession marker. `02_PREVIOUS_DECISIONS_SUPERSEDED.md` gives all twenty-nine affected positions a prior source, a new source, a status and a required correction. **Nothing in the built work is deleted; the only screens that stop being current are two Super Admin publish screens already withdrawn on 25 August.**

---

## Note on folder numbering

This package is `ui-ux/17-stakeholder-correction-blueprint/`. **17 is the next unused top-level prefix** — `00`–`16` are all occupied, and `12-` and `14-` each already carry two directories (`12-full-platform-reframe` / `12-presentations`, and `13-full-platform-design`'s sibling `14-presentations`).

---

## What was not done

| | |
|---|---|
| Prototype created | ❌ **No** |
| HTML · JS · CSS created | ❌ **No** — every file here is Markdown |
| Batches 01–05 modified | ❌ **No** |
| `15-post-pm-alignment/` modified | ❌ **No** |
| `16-unified-product-planning/` modified | ❌ **No** |
| Earlier PM captures or `PROJECT_CONTEXT.md` modified | ❌ **No** |
| FRD · `source/` · `requirements/` · `branding/` modified | ❌ **No** |
| Figma touched | ❌ **No** |
| Backend · API contract · database schema | ❌ **No** |
| Screens redesigned | ❌ **No** |
| An open question closed without an answer | ❌ **No** — 15 + 16 stay visibly open |
| Git commit made | ❌ **No** |
