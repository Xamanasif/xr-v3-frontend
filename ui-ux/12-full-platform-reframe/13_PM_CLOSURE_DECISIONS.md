# 13 — PM Closure Decisions (PM-13 · PM-14 · PM-15)

| | |
|---|---|
| **Document ID** | `13_PM_CLOSURE_DECISIONS` |
| **Meeting date** | **19 August 2026** |
| **Source** | **Direct verbal confirmation from the Project Manager** |
| **Type** | Closure update to Review 006. **Not a new review. Not a redesign.** |
| **Status** | ✅ **AUTHORITATIVE** |
| **Extends** | `ui-ux/00-project-context/PM_CONFIRMED_BASELINE_2026-08-18.md` (PM-01 – PM-12) |
| **Branch** | `uiux/full-platform-review006` |

---

## What this document does

Review 006 completed with **zero blocking questions** but flagged six questions newly surfaced by the full-platform re-audit. The Project Manager has now directly answered **three** of them.

**These three decisions close the three most structurally significant open questions in Review 006.**

| PM decision | Closes | Was |
|---|---|---|
| **PM-13** | `QP-03` — placement of Vendor, Academic Reviewer, Content Manager in the tenancy model | **HIGH** — the largest structural unknown |
| **PM-14** | `QP-01` — reject / revise / resubmit path in the governance chain · and `QP-06` — governance review history | **HIGH** ×2 |
| **PM-15** | `QP-05` — who configures assessments for a B2C individual learner | **HIGH** |

## Authority rule

The rules from the 18 August baseline continue to apply unchanged:

1. These statements are **PM-CONFIRMED** and take precedence over prior assumptions, assistant recommendations, and Review-005 decisions.
2. **The original FRD is not rewritten.** `source/Platform FRD_v4.pdf` remains unchanged.
3. **FRD deviations or extensions are recorded, not silently applied.**
4. Review-005 artefacts are preserved.

---

# PM-13 — Platform / Tenancy Model

The Project Manager confirmed that **we should continue with the proposed Review-006 model.**

The current product architecture may therefore use the proposed **central-content-plane / tenant-plane model**.

## Current interpretation

### Central / platform content & governance side

- **Vendor**
- **Academic Reviewer**
- **Content Manager**
- **Super Admin**

### Institution / tenant side

- **Institute Admin**
- **Faculty**
- **Student / Learner**

**B2C individual learners** use the shared platform and learning capabilities **without becoming an institutional tenant role**.

## Shared platform services

These connect the two areas:

- identity / access
- content
- learning
- assessment
- entitlements
- XR delivery
- commerce
- progress

## Cross-tenant boundary

**Super Admin retains the FRD-defined cross-tenant governance capability** (FRD 1.3.5).

> **Do not invent additional cross-tenant permissions for the other roles.**

## Status

**PM CONFIRMED**

**This resolves the Review-006 question concerning the placement of Vendor, Academic Reviewer and Content Manager.**

## What changes

The two-plane model was recorded in Review 006 as a **working hypothesis requiring confirmation** — the only reading consistent with every FRD sentence, but never stated by the FRD itself. **It is now a confirmed architectural position.**

| Before | After |
|---|---|
| ⚠️ Hypothesis, flagged for confirmation | ✅ **PM-confirmed architecture** |
| `02` §B2 cells `?` for CM, V, AR | Resolved — central content plane |
| `QP-03` open at HIGH | **CLOSED** |

## FRD relationship

**No deviation.** PM-13 is consistent with every relevant FRD requirement:

| FRD | How PM-13 aligns |
|---|---|
| 1.1.4 | All modules centrally owned by the platform owner → a central content plane is the natural home for governance |
| 1.3.1 | Tenant-wise isolation applies to institutional user, licensing, and analytics data — the tenant side |
| 1.3.2 | B2C in a separate data environment — consistent with B2C learners not being a tenant role |
| 1.3.5 | Cross-tenant governance access is Super Admin's alone — **explicitly preserved** |
| 1.4.1 – 1.4.5 | The governance chain operates on central content, not on tenant data |

**PM-13 fills an FRD silence rather than contradicting FRD text.** The FRD never placed Vendor, Academic Reviewer, or Content Manager in its isolation model; PM-13 places them.

---

# PM-14 — Content Rejection / Resubmission

The Project Manager confirmed that **submitted content may be rejected / returned for correction.**

## Required workflow

```
Vendor submits
   ↓
Academic Reviewer reviews
   ↓
if changes are required:
   reviewer returns / rejects with comments / reason
   ↓
Vendor corrects
   ↓
Vendor resubmits
   ↓
Academic review continues
```

**The same principle applies where the Content Manager finds issues:** content may be **returned with comments / reasons** for correction and resubmission before it can progress toward Super Admin publication.

## The workflow therefore needs

- **approve**
- **reject / changes required**
- **reviewer comments / reason**
- **Vendor correction**
- **resubmission**
- **review history / status traceability**

> **Do not invent an automatic publication path after rejection.**

A corrected resubmission **re-enters review**. It does not skip a gate, and it never routes directly to publication.

## Status

**PM CONFIRMED**

**This resolves the Review-006 reject/resubmission-path question.**

## What changes

| Before | After |
|---|---|
| Forward-only chain: submit → validate → approve → publish | **Chain with return loops at gate ② and gate ③** |
| `02` §D7 cells `?` for V, AR, CM | Resolved — approve / request changes / comment |
| Reject paths drawn as ⚠ known-missing edges | **Designed states and actions** |
| No review history requirement | **Review history / status traceability is required** |
| `QP-01` open at HIGH | **CLOSED** |
| `QP-06` (governance audit trail) open at HIGH | **CLOSED for the content governance chain** — see note |

### Note on `QP-06`

`QP-06` asked whether an audit trail exists for governance decisions. **PM-14's explicit requirement for "review history / status traceability" answers that for the content governance chain**: decisions, comments, and status transitions must be traceable.

**It does not extend beyond content governance.** Audit trails for licensing changes, entitlement grants, platform configuration, or device-replacement approvals remain undefined and are **not** invented on the strength of PM-14.

## FRD relationship

🟠 **EXTENSION — recorded.** FRD 1.4.1 – 1.4.4 describe a **forward-only** chain and contain **no** rejection, revision, resubmission, or review-history requirement. PM-14 adds them.

This is an extension the review gates require in order to function — a gate that can only approve is not a gate — but it is an addition to the FRD, and it is recorded as one. **The FRD is not edited.**

---

# PM-15 — Assessment Ownership for B2B and B2C

The Project Manager confirmed that **for BOTH B2B and B2C, assessment setup/configuration is the responsibility of Faculty or the institution side.**

> **The learner does NOT author or configure assessments.**

## The confirmed architecture is unchanged

```
Faculty / institution-authorized side
   ↓
portal assessment configuration
   ↓
flexible platform / API integration
   ↓
Web / XR application consumes assessment configuration
   ↓
learner attempts assessment
   ↓
result / progress returns to platform
```

This is exactly the PM-08 architecture. **PM-15 assigns its ownership; it does not change its shape.**

## Important interpretation rule

> **Do NOT automatically grant every Institute Admin assessment-authoring permission unless supported by the FRD or another PM decision.**

The FRD explicitly gives **Faculty** assessment-management responsibility (8.1.4, 5.1.1, 5.1.2, 5.3.2), so **Faculty remains the clearest direct assessment-authoring role**.

*"Faculty or institution should take care"* means assessment **ownership sits on the authorized Faculty/institution side rather than with the B2C learner**. It is not a blanket grant to Institute Admin.

## B2C operational mapping

For a **pure B2C individual learner**, the exact operational mapping — *which* Faculty, institution, or content owner supplies the assessment — **may be resolved later as a content / implementation detail.**

**It is NOT a blocker for platform IA.**

## Status

**PM CONFIRMED**

**This resolves the Review-006 B2C assessment-ownership product question.**

## What changes

| Before | After |
|---|---|
| `QP-05` — three defensible readings, none stated, no working position | **Resolved at product level: Faculty / institution-authorized side owns configuration for both B2B and B2C** |
| B2B/B2C divergence 17 open | **CLOSED as a divergence** — ownership is now the **same** for both |
| Learner assessment-authoring permission | **Explicitly prohibited** — was already absent, now stated as a rule |
| Institute Admin assessment cells `?` | **Remain `?`** — PM-15 explicitly declines to grant them |
| B2C operational assignment | **Non-blocking implementation/content-operations detail** |

**Divergence 17 is removed from the B2B/B2C register, not merely answered.** Assessment ownership is no longer a point where the two journeys diverge — it converges on the same authorized side.

## FRD relationship

✅ **ALIGNMENT.** FRD 5.1.1, 5.1.2, and 5.3.2 all assign assessment authoring and configuration to Faculty, and 8.1.4 names assessments among Faculty responsibilities. PM-15 confirms that reading and extends it to cover the B2C case the FRD never addressed.

**No FRD text is contradicted.** The FRD's silence on B2C assessment ownership is filled, not overridden.

---

# Affected Review-006 artefacts

| File | Change | Driver |
|---|---|---|
| `01_PHASE1_FEATURE_INVENTORY.md` | 1.4.1/1.4.2/1.4.3 rows gain return-path coverage; gap register updated — **G-4, G-5, G-6 resolved**; status counts recalculated | PM-13, PM-14, PM-15 |
| `02_ROLE_PERMISSION_MATRIX.md` | §B2 resolved; §D7 becomes a defined permission row; V/AR/CM permissions updated; F-domain ownership stated; **learner authoring prohibition added**; counts recalculated | PM-13, PM-14, PM-15 |
| `03_SHARED_CAPABILITY_MAP.md` | `GOV` reject/resubmit + review history move `PEND-P` → `P1`; `TEN` plane placement resolved; `ASM` ownership resolved; reuse table updated | PM-13, PM-14, PM-15 |
| `04_PLATFORM_INFORMATION_ARCHITECTURE.md` | Two-plane model becomes **PM-confirmed**; governance chain diagram gains return loops; VND/ARV/CM workspaces gain return-path surfaces; design rule 7 updated | PM-13, PM-14 |
| `05_END_TO_END_WORKFLOWS.md` | FLOW 1 rewritten with return loops; FLOW 4 ownership stated; gap register updated | PM-14, PM-15 |
| `06_B2B_B2C_JOURNEYS.md` | **Divergence 17 removed** — ownership converges; divergence count 18 → 17; summary updated | PM-15 |
| `08_ASSESSMENT_CONFIGURATION_MODEL.md` | Ownership section added; B2C owner question closed; clarification list reduced; counts updated | PM-15 |
| `10_FULL_PLATFORM_SCREEN_INVENTORY.md` | Return-path states added to existing screens; **`SHR-05` review history & comments** added; counts recalculated | PM-14 |
| `11_OPEN_QUESTIONS_REFRAMED.md` | `QP-01`, `QP-03`, `QP-05`, `QP-06` closed; new non-blocking `QP-25`; counts recalculated | PM-13, PM-14, PM-15 |
| `12_REVIEW006_SUMMARY.md` | PM-13/14/15 recorded; governance diagram, deviation register, counts, and Figma recommendation all updated | All three |

## Not modified

| File | Reason |
|---|---|
| `07_XR_DELIVERY_MODEL.md` | **None of PM-13/14/15 touches XR delivery.** The mechanism remains pending by PM-05 |
| `09_REVIEW005_REUSE_MAP.md` | Review-005 dispositions are unaffected. All three decisions concern new platform areas |

---

# Remaining implementation details

**None of these blocks platform IA.** Each is recorded so it is not mistaken for an omission.

## From PM-13

| # | Detail | Class |
|---|---|---|
| 1 | How the central content plane and tenant planes are physically separated (schema, service, or logical boundary) | Technical |
| 2 | Whether central-plane roles need any read visibility into tenant usage of their content — **no such permission is granted or assumed** | Product |

## From PM-14

| # | Detail | Class |
|---|---|---|
| 3 | Comment structure — free text, structured findings, or per-section annotations | Design |
| 4 | Whether a returned submission is versioned, or corrected in place | Technical |
| 5 | Whether a resubmission re-enters at the **returning** gate or restarts at gate ② | **Product** — working position: it re-enters at the returning gate; both prior gates' approvals are recorded in history |
| 6 | Whether Vendor is **notified** of a return, or discovers it on next sign-in | Product — no Phase-1 FRD notification requirement exists |
| 7 | Retention period and visibility scope of review history | Data |
| 8 | Whether Super Admin may return a submission at gate ④ — **not stated by PM-14, not invented.** PM-14 names Academic Reviewer and Content Manager only | Product |

## From PM-15

| # | Detail | Class |
|---|---|---|
| 9 | **Which Faculty / institution / content owner supplies the assessment for a pure B2C learner** — explicitly deferred by PM-15 as a content/implementation detail | **Content operations — explicitly non-blocking** |
| 10 | Whether Institute Admin holds any assessment authority at all — PM-15 declines to grant it; remains `?` | Product |
| 11 | Whether an assessment configuration is reusable across institutions or cohorts | Product |

---

# Validation

| Check | Result |
|---|---|
| PM-13 recorded | ✅ |
| PM-14 recorded | ✅ |
| PM-15 recorded | ✅ |
| `QP-03` two-plane / role placement closed | ✅ |
| `QP-01` rejection / resubmission closed | ✅ |
| `QP-06` governance review history closed *(content chain only)* | ✅ |
| `QP-05` B2C assessment ownership closed | ✅ |
| No automatic publication path after rejection | ✅ |
| No learner assessment-authoring permission anywhere | ✅ |
| No blanket Institute Admin assessment grant | ✅ |
| No additional cross-tenant permissions invented | ✅ |
| FRD unchanged | ✅ |
| Review-005 unchanged | ✅ |
| Figma untouched | ✅ |
