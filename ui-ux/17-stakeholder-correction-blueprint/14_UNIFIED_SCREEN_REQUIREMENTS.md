# 14 — Unified Screen Requirements

| | |
|---|---|
| **Status** | ✅ **UNIFIED SCREEN REQUIREMENT SET — the build inventory for ONE product** |
| **Created** | 31 August 2026 |
| **Starting inventory** | `ui-ux/16-unified-product-planning/03_UNIFIED_SCREEN_INVENTORY_DRAFT.md` — **89 draft screens**. Updated **conceptually, in this package only.** That file is not edited |
| **Count** | **101 screens.** Derived, not targeted — see §Method |
| **ID scheme** | `U-<AREA>-nn`, continuing the `16-` scheme. Stage-6 reconciliation against the stable Review-006 inventory is still required |

---

## Method — why 101, and why that is not inflation

The 89-screen draft was built before the 31 Aug review. **Twelve rows are added, and every one is traceable to a decision that created a real capability, not to a desire for a bigger number.**

| Δ | Area | Cause |
|---:|---|---|
| **+4** | Support | `STK31-39` — **a wholly new capability area.** Report · my reports · platform queue · issue detail |
| **+4** | Super Admin | `STK31-21` tenant creation and Tenant Admin assignment · `STK31-41` per-content role assignment · `STK31-09` canonical metadata · `STK31-21` tenant deactivation *(net +4 after two BLOCKED rows became real)* |
| **+2** | Public | `STK31-12` — the **Programme/Department** level and the **Course** page are now confirmed hierarchy levels |
| **+2** | Cross-cutting | The **shell** is now an explicit build item, and **Help** has a destination (`STK31-39`, and **WCAG 2.2 SC 3.2.6 is Level A**) |
| **+1** | Commerce | The **external B2B payment step** is a different route position from B2C checkout (`STK31-20`) |
| **−1** | Auth | The superseded B2C sign-in handoff collapses into one real sign-in; the **platform-authentication fallback** is a **state**, not a screen (`STK31-44`) |

**Two things were deliberately NOT turned into screens**, to avoid inflation:

- the **platform-authentication fallback** — a state of sign-in, not a screen;
- **CSV ↔ ERP conflict handling** — a state of *Records Needing Attention*, not a screen.

---

## Priority definitions

> ### ⚠ P0 / P1 / P2 / P3 are IMPLEMENTATION PRIORITIES — they are NOT project phases
> **They are a build order for the unified prototype. They are NOT equivalent to Phase 1 / Phase 2 / Phase 3.**
>
> **P0, P1 and P2 are all inside the CURRENT B2B delivery.** A later priority number means *built later in the sequence*, **never** *deferred, optional, or outside Phase 1*.
>
> **Only P3 marks genuinely deferred work**, and P3 contains exactly one thing: the **B2C secondary rollout** (`STK31-04`).

| | |
|---|---|
| **P0** | Built first — the **core B2B vertical slice**: public discovery → selection → request → approval → tenant → people → assignment → learn → assess → result → progress |
| **P1** | Built next — **required for the complete current B2B platform delivery.** In scope, not deferred |
| **P2** | Built after that — operational completeness. **In scope, not deferred** |
| **P3** | **Genuinely deferred / secondary rollout** — B2C only |

> **Stated P0 assumption:** the first B2B vertical slice may use **seeded published content**, exactly as Batch 03 assumed a seeded content-access record. The content **production** chain (Vendor → Academic Reviewer → Content Manager) is therefore sequenced at **P1**.
>
> 🔴 **This does NOT make content production deferred, optional, or outside Phase 1.** It is **required for the current complete platform delivery**: **before the current B2B platform can be considered delivered, the Vendor → Academic Reviewer → Content Manager → Published workflow must be integrated.**

## Status legend

**KEEP** carries forward · **MODIFY** gains or changes something · **MERGE** collapses several built versions into one · **NEW** no surface exists anywhere · **SUPERSEDE** its position is replaced; the artefact survives · **DEFER** preserved, built later

---

# A · PUBLIC

| Draft ID | Plane / role | Purpose | Source | Existing reusable screen | Action | Pri | Dependencies |
|---|---|---|---|---|---|:---:|---|
| `U-PUB-01` | Public · visitor | What the platform is; the way into the catalogue and the two entries | `STK31-16` | 🔴 none · header + badges from **B01** | **NEW** | **P1** | `U-X-01` · ⚠ value-proposition copy does not exist |
| `U-PUB-02` | Public · visitor | Browse, search and filter published content | `STK31-16` · `STK31-12` | **B04 `B2C-01`** — card, grid, filter bar, 5 of 7 states | **MODIFY** *(position + CTA + levels)* | **P0** | `U-PUB-06` for the CTA |
| `U-PUB-03` | Public · visitor | A **Programme / Department / Academic Stream** grouping and the Courses it holds | `STK31-12` · `STK31-10` | 🟠 no **public** page exists; **Batch 03's academic structure is the same grouping level**, tenant-side | **NEW** | **P0** | 🟢 **one level, not two.** Final label only — `ND-02` |
| `U-PUB-04` | Public · visitor | A **Course** sub-bundle, its code, and the Experiments it holds | `STK31-12` · `STK31-46` | 🔴 none — no course page in any batch | **NEW** | **P0** | 🔴 no course↔experiment relationship exists yet |
| `U-PUB-05` | Public · visitor | Understand an **Experiment** before any access action; select technologies | `STK31-17` · `STK31-15` | **B04 `B2C-02`** + **B01 `S12`** — 10 of 13 regions exist | **MODIFY** *(+ outcomes, preview, course context, technology selection)* | **P0** | `STK31-08` outcomes authorship · `QX-03` captions |
| `U-PUB-06` | Public · visitor | **Selection basket + request preparation.** Never a checkout | `STK31-18` | 🔴 none — a **different object** from B04's cart-free checkout | **NEW** | **P0** | `U-AUTH-08` |
| `U-PUB-07` | Public · visitor | Entry fork — Institution / Individual | `PM29-06` · `STK31-04` | 🔴 none · **no inventory ID exists** | **NEW** | **P1** | The Individual branch is **P3** |

---

# B · AUTHENTICATION AND ENTRY

> **The quietest and most consequential area.** Every batch used a clearly-labelled non-product index instead of authentication. **A public catalogue makes it blocking:** the public route's first action is *sign in / register / apply*, and none of those destinations exists.

| Draft ID | Plane / role | Purpose | Source | Existing reusable screen | Action | Pri | Dependencies |
|---|---|---|---|---|---|:---:|---|
| `U-AUTH-01` | All | One front door. **Includes the platform-authentication fallback as a state** | FRD 4.1.x, 10.2.1 · `STK31-44` | 🔴 none · form grammar from **B01** | **NEW** | **P0** | `U-AUTH-06` |
| `U-AUTH-02` | Institutional | Institutional SSO redirect / return | FRD 4.2.2 · PM-10 · `STK31-44` | **B03 `INA-10`** configures it; **the sign-in path is not built** | **NEW** | **P1** | ⚠ `QT-04` collision |
| `U-AUTH-03` | Individual | Self-registration | FRD 4.1.1 · `STK31-04` | **B04 `AUTH-B2C`** — *a panel, not a form; collects nothing* | **NEW** | **P3** | Deferred with B2C |
| `U-AUTH-04` | All | Password recovery | Design-supplied; **no FRD requirement** | 🔴 none | **NEW** | **P2** | `U-AUTH-01` |
| `U-AUTH-05` | All | Session expiry without loss of work | FRD 10.2.2 · `D-17` | Pattern exists from Review 005; not rebuilt on the shell | **NEW** | **P2** | `U-X-01` |
| `U-AUTH-06` | All | **Workspace resolution — seven roles, one front door** | PM-01 · PM-03 · `STK31-01`…`03` | 🔴 none | **NEW** | **P0** | **Structural.** Blocks every workspace |
| `U-AUTH-07` | Multi-role | Workspace chooser | `QP-11` | 🔴 none | **NEW** | **P2** | Renders only if multi-role identities exist |
| `U-AUTH-08` | Institution visitor | **Institution application / tenant request** — organisation · SPOC · the selection · licences/users · access term | `STK31-20` · FRD 4.2.1 | 🔴 **`AUTH-10` — inventoried NEW at P3 since Review 006, never built.** Form grammar + `Metadata Group` from **B01** | **NEW** | **P0** | `U-PUB-06` · `U-SA-04` |
| `U-AUTH-09` | Applicant | See that the request was received and its state | `STK31-20` | **B01** `Status Badge` + `Empty State` | **NEW** | **P1** | ⚠ the state set beyond approve / more-information is **not stated** |

---

# C · PLATFORM — Super Admin

| Draft ID | Plane / role | Purpose | Source | Existing reusable screen | Action | Pri | Dependencies |
|---|---|---|---|---|---|:---:|---|
| `U-SA-01` | Platform · Super Admin | What needs a decision from me | `STK31-40` · PM-11 | **B05 `SA-01`** | **MODIFY** *(+ requests, allocations, expiries, issues)* | **P1** | ⛔ **still no dashboard** |
| `U-SA-02` | Platform | The cross-tenant institution list | `STK31-21` | **B05 `SA-02`** | **MODIFY** *(read-only superseded; + create, deactivate)* | **P1** | `U-SA-18` |
| `U-SA-03` | Platform | **Institution profile / operational report** | `STK31-42` · `STK31-27` · `STK31-28` | **B05 `SA-03`** — three booleans and a stream count today | **MODIFY (EXPAND materially)** | **P1** | ⛔ **no revenue metrics** |
| `U-SA-04` | Platform | **Tenant requests queue** | `STK31-20` | ▶ **B01 queue pattern — near-exact fit** | **NEW** | **P0** | `U-AUTH-08` |
| `U-SA-05` | Platform | **Tenant request decision** — approve / request more information, **reason required**, history | `STK31-20` · `STK31-21` | ▶ **B01 review panel + decision dialog + history timeline** | **NEW** | **P0** | `U-SA-04` |
| `U-SA-06` | Platform | Tenant creation outcome | `STK31-21` | 🔴 none — reverses `R-01` | **NEW** | **P1** | `U-SA-05` |
| `U-SA-07` | Platform | **Tenant Admin assignment** | `STK31-21` | 🔴 none — reverses `R-02` | **NEW** | **P0** | ⚠ identity **origin** remains `QD-02` |
| `U-SA-08` | Platform | **Tenant content + technology allocation** | `STK31-24` · `STK31-15` | ▶ **B03 `INA-08`** two-direction mapping · **the receiving end already exists** | **NEW** | **P0** | `U-TA-09` |
| `U-SA-09` | Platform | Versions awaiting a **Release / Hold** decision | `STK31-07` · FRD 2.3.2 | **B05 `SA-04`** | **KEEP** *(+ reword `Module`)* | **P1** | ✅ **now confirmed, not provisional** |
| `U-SA-10` | Platform | **Release or hold** a version | `STK31-07` | **B05 `SA-05`** | **KEEP** *(+ mandatory firewall copy)* | **P1** | `ND-13` (`QP-26`) still open |
| `U-SA-11` | Platform | Device-replacement request queue | `STK31-38` · FRD 2.4.2 | **B05 `SA-06`** | **KEEP** | **P2** | ⚠ **no decline path — shown as a gap** |
| `U-SA-12` | Platform | Approve a device transfer | `STK31-38` | **B05 `SA-07`** | **KEEP** | **P2** | Completes with `U-LRN-11` |
| `U-SA-13` | Platform | Licensing / access records, **quantity from the approved request**, terms and expiry | `STK31-27` · `STK31-28` | **B05 `SA-08`** | **MODIFY** | **P1** | 🔴 **no arbitrary caps** |
| `U-SA-14` | Platform | Who holds which platform role | `STK31-41` | **B05 `SA-09`** | **MODIFY** *(read-only superseded)* | **P1** | ⚠ `QD-02` identity origin |
| `U-SA-15` | Platform | **Per-Course / per-Experiment assignment** of Vendor · Reviewer · Content Manager; multiple people per Experiment | `STK31-41` | 🔴 none — reverses `R-03`, `R-04` | **NEW** | **P1** | `U-SA-14` |
| `U-SA-16` | Platform | **Canonical / master metadata management** *(shared with Content Manager)* | `STK31-09` · `STK31-10` | 🔴 none | **NEW** | **P2** | ⚪ schema `ND-05` |
| `U-SA-17` | Platform | Platform configuration **register** — zero invented controls | Batch 05 | **B05 `SA-10`** | **KEEP** | **P2** | — |
| `U-SA-18` | Platform | **Tenant deactivation / termination** | `STK31-21` · `STK31-22` | 🔴 none | **NEW** | **P2** | **Prefer reversible status** · `ND-15` |

---

# D · PLATFORM — Content governance

**The most intact block in the corpus. `STK31-06` explicitly re-confirms the chain.**

| Draft ID | Plane / role | Purpose | Source | Existing reusable screen | Action | Pri | Dependencies |
|---|---|---|---|---|---|:---:|---|
| `U-VND-01` | Central · Vendor | My submissions | FRD 1.4.1 | **B01 `S01`** | **KEEP** | **P1** | — |
| `U-VND-02` | Central · Vendor | New submission | `STK31-46` · `STK31-37` · `STK31-15` | **B01 `S02`** | **MODIFY** *(+ course mapping, package-or-link by technology, runtime info, documentation)* | **P1** | 🔴 **Learning Outcomes do NOT go here** |
| `U-VND-03` | Central · Vendor | Edit draft / correct submission | PM-14 | **B01 `S02-edit`** | **KEEP** | **P1** | Inherits `U-VND-02` fields |
| `U-VND-04` | Central · Vendor | Submission detail and status — 9 states | PM-14 | **B01 `S03`** | **KEEP + REWORD** | **P1** | 🔴 four *"release"* strings → *publish* |
| `U-ARV-01` | Central · Reviewer | Review queue | FRD 1.4.2 · `STK31-41` | **B01 `S04`** | **MODIFY** *(scoped by assignment)* | **P1** | `U-SA-15` |
| `U-ARV-02` | Central · Reviewer | Review history | PM-14 | **B01 `S04-history`** | **KEEP** | **P2** | — |
| `U-ARV-03` | Central · Reviewer | Academic review · **Learning Outcomes authorship** | `STK31-08` | **B01 `S05`** | **MODIFY (EXPAND)** | **P1** | ⚠ rubric undefined — `QD-08` |
| `U-CM-01` | Central · CM | Content review queue | FRD 1.4.3 · `STK31-41` | **B01 `S06`** | **MODIFY** *(scoped by assignment)* | **P1** | `U-SA-15` |
| `U-CM-02` | Central · CM | Reviewed content | — | **B01 `S06-history`** | **KEEP** | **P2** | — |
| `U-CM-03` | Central · CM | Content readiness and **FIRST PUBLICATION** | `STK31-06` | **B01 `S07`** | **KEEP + REWORD** | **P1** | 🔴 firewall copy — this never *releases* |
| `U-CM-04` | Central · CM | **Content Library** / published content · canonical content metadata | `STK31-06` · `STK31-09` | **B01 `S10`** | **MODIFY (EXPAND)** | **P1** | `U-SA-16` |

---

# E · TENANT — Institute / Tenant Admin

⚠ **Role label pending `ND-01`.** Every row carries it.

| Draft ID | Plane / role | Purpose | Source | Existing reusable screen | Action | Pri | Dependencies |
|---|---|---|---|---|---|:---:|---|
| `U-TA-01` | Tenant · Admin | Institution overview + attention | `STK31-28` · `STK31-26` | **B03 `INA-01`** | **MODIFY** *(+ term, import attention; `Expiring soon` row **recommended**)* | **P0** | ⚠ **The REQUIRED item is the 15-day reminder itself**, whose channel is `ND-16` — **no channel-specific screen is invented.** The `Expiring soon` row here is **recommended supporting UX** |
| `U-TA-02` | Tenant · Admin | People directory | `STK31-25` | **B03 `INA-02`** | **MODIFY** *(+ provisioning entry points, deactivate)* | **P0** | `U-TA-04` · `U-TA-05` |
| `U-TA-03` | Tenant · Admin | Person detail | `STK31-25` · `STK31-26` · `STK31-11` | **B03 `INA-03`** | **MODIFY** *(+ provenance, plan context, course code, OPTIONAL semester)* | **P0** | `ND-04` |
| `U-TA-04` | Tenant · Admin | **Add a person (manual)** | `STK31-25` | 🔴 **`DA-04`: no such control exists.** Form grammar from **B01** | **NEW** | **P0** | `ND-04` |
| `U-TA-05` | Tenant · Admin | **Bulk CSV import** | `STK31-26` | 🔴 none · ▶ **B01 `File Upload`** + **B02 upload → per-row validation → commit** | **NEW** | **P0** | 🟠 `Plan Terms` status `ND-03` |
| `U-TA-06` | Tenant · Admin | **CSV import error report** | `STK31-26` | ▶ **B02 `Upload Report`** + **B03 `Issue Card`** — both near-exact | **NEW** | **P0** | `ND-04` |
| `U-TA-07` | Tenant · Admin | Academic structure — **the same grouping level, tenant-side** | `STK31-10` · `STK31-11` | **B03 `INA-04`** | **MODIFY** *(+ local Course Code)* | **P1** | 🟢 **no extra level added**; final label only — `ND-02` |
| `U-TA-08` | Tenant · Admin | Stream / group detail | — | **B03 `INA-05`** | **KEEP** | **P1** | — |
| `U-TA-09` | Tenant · Admin | Content access | `STK31-24` · `STK31-15` · `STK31-28` | **B03 `INA-06`** | **MODIFY** 🟢 *origin actor supplied — **one line**; + technologies, + term* | **P0** | `U-SA-08` |
| `U-TA-10` | Tenant · Admin | Content access detail + **learner/group assignment** | `STK31-25` · `STK31-15` | **B03 `INA-07`** | **MODIFY** 🟢 *`DA-07` **confirmed**, no longer reversible-pending* | **P0** | — |
| `U-TA-11` | Tenant · Admin | Access mapping — two-direction view | `STK31-15` | **B03 `INA-08`** | **KEEP + EXPAND** | **P1** | ▶ feeds `U-SA-08` |
| `U-TA-12` | Tenant · Admin | Institution setup | — | **B03 `INA-09`** | **KEEP** | **P1** | — |
| `U-TA-13` | Tenant · Admin | Single sign-on — configure → check → turn on | FRD 4.2.2 · `STK31-44` | **B03 `INA-10`** | **MODIFY** *(+ no-SSO fallback statement)* | **P1** | `U-AUTH-02` |
| `U-TA-14` | Tenant · Admin | Institution data / ERP | FRD 7.1.x, 7.2.1 | **B03 `INA-11`** | **KEEP** | **P1** | ⚠ `DA-15` *Run now* reversible |
| `U-TA-15` | Tenant · Admin | **Records needing attention** — incl. CSV failures and **CSV↔ERP conflicts** | `STK31-26` · `ND-04` | **B03 `INA-12`** | **MODIFY (EXPAND)** | **P1** | **Never silently overwrite** |
| `U-TA-16` | Tenant · Admin | Learner access check | `STK31-15` | **B03 `INA-13`** | **MODIFY** *(+ which technologies)* | **P2** | — |
| `U-TA-17` | Tenant · Admin | Tenant reporting — operational only | `STK31-43` | 🔴 none | **NEW** | **P2** | ⛔ **no decorative dashboards** |

---

# F · TENANT — Faculty

| Draft ID | Plane / role | Purpose | Source | Existing reusable screen | Action | Pri | Dependencies |
|---|---|---|---|---|---|:---:|---|
| `U-FAC-01` | Tenant · Faculty | **Experiments available to the tenant** | `STK31-29` | 🔴 none — `FAC-02`/`FAC-03` inventoried, never built. ▶ **B04 catalogue components** | **NEW** | **P1** | `U-TA-09` |
| `U-FAC-02` | Tenant · Faculty | Assessments list | `STK31-30` | **B02 `B01`** | **KEEP + REWORD** | **P0** | `STK31-14` rename |
| `U-FAC-03` | Tenant · Faculty | Builder — Questions | PM-08 | **B02 `B02-questions`** | **KEEP + REWORD** | **P0** | — |
| `U-FAC-04` | Tenant · Faculty | Builder — Settings · **answer/explanation visibility policy** | `STK31-32` | **B02 `B02-settings`** | **MODIFY (EXPAND)** | **P0** | 🟠 BITS default `ND-10` |
| `U-FAC-05` | Tenant · Faculty | Builder — Assign | `STK31-25` · `STK31-11` | **B02 `B02-assign`** | **MODIFY** *(+ course code, OPTIONAL semester)* | **P0** | `U-TA-10` |
| `U-FAC-06` | Tenant · Faculty | Assessment preview (learner view) | — | **B02 `B03`** | **KEEP** | **P2** | — |
| `U-FAC-07` | Tenant · Faculty | Question bank · **`Add` · `Edit` · `Delete`** · import | `STK31-34` | **B02 `B04`** | **MODIFY (EXPAND)** | **P0** | `Delete` + confirmation; **history preserved**. Reversible mechanism underneath — `STK31-22`, `ND-15` |
| `U-FAC-08` | Tenant · Faculty | Question editor | — | **B02 `B05`** | **KEEP** | **P0** | — |
| `U-FAC-09` | Tenant · Faculty | AI question drafts · **source-material input** | `STK31-33` · FRD 5.1.2 | **B02 `B06`** | **MODIFY (EXPAND)** | **P1** | Provider technically pending |
| `U-FAC-10` | Tenant · Faculty | **Descriptive evaluation queue** | `STK31-31` | 🔴 none — **was BLOCKED on `QP-02`** | **NEW** | **P1** | 🟠 auto-review `ND-09` · **never auto-final** |
| `U-FAC-11` | Tenant · Faculty | Student progress / usage — **operational** | `STK31-29` · `STK31-43` | 🔴 `FAC-05`/`FAC-10` inventoried, not built | **NEW** | **P1** | ⛔ **no KPI dashboard** |

---

# G · LEARNER — the shared core

**Identical for both contexts. PM-09 approved. One change: progress gains a technology axis.**

| Draft ID | Plane / role | Purpose | Source | Existing reusable screen | Action | Pri | Dependencies |
|---|---|---|---|---|---|:---:|---|
| `U-LRN-01` | Learner | **My Learning — the convergence point** | `STK31-01` | **B01 `S11`** · **B02** · **B03 `INA-13`** · **B04 `LRN-02`** | **MERGE** *(4 → 1)* | **P0** | — |
| `U-LRN-02` | Learner | Experiment detail | `STK31-12` · `STK31-15` · `STK31-17` | **B01 `S12`** · **B02 `B07`** · **B04 `B2C-02`** | **MERGE + MODIFY** *(3 → 1; + course context, outcomes, technologies)* | **P0** | 🔴 the Module/Experiment split lives here |
| `U-LRN-03` | Learner | XR device access — 6 states, mechanism-neutral | PM-05 · `STK31-36` | **B01 `S13`** | **MODIFY** *(+ technology identity)* | **P0** | `QT-01` open **by instruction** |
| `U-LRN-04` | Learner | Web / WebGL runtime — hosted link | `STK31-37` | **B01 `WEB-RUN`** · `LRN-08` KEEP-from-Review-005 | **KEEP** | **P0** | — |
| `U-LRN-05` | Learner | Assessment introduction — the generated disclosure | PM-08 | **B02 `B08`** | **KEEP** | **P0** | — |
| `U-LRN-06` | Learner | Assessment attempt — MCQ · T/F · Descriptive | `STK31-30` | **B02 `B09`** | **KEEP** | **P0** | Timer prompts, **never auto-submits** |
| `U-LRN-07` | Learner | Review answers (+ submit dialog) | — | **B02 `B10`** | **KEEP** | **P0** | — |
| `U-LRN-08` | Learner | Result — incl. **pending evaluation** | `STK31-31` · `STK31-32` | **B02 `B11`** | **MODIFY** *(+ Faculty-owned evaluation, + visibility policy)* | **P0** | `D-25` untouched |
| `U-LRN-09` | Learner | **Progress — per assigned technology** | `STK31-36` · PM-09 | **B01 `S14`** · **B02 `B12`** | **MERGE + MODIFY** *(2 → 1; + technology axis)* | **P0** | 🔴 a real shape change |
| `U-LRN-10` | Learner | Device binding | FRD 2.4.1 · `STK31-38` | 🔴 none — **no device registry exists** | **NEW** | **P2** | — |
| `U-LRN-11` | Learner | Device replacement request | FRD 2.4.2 · `STK31-38` | 🔴 none · 🟠 **the approval end exists** (**B05 `SA-07`**) | **NEW** | **P2** | Completes a half-built workflow |

---

# H · COMMERCE AND ACTIVATION

| Draft ID | Plane / role | Purpose | Source | Existing reusable screen | Action | Pri | Dependencies |
|---|---|---|---|---|---|:---:|---|
| `U-COM-01` | B2B external | **Payment step — only where payment applies** | `STK31-20` · `STK31-19` | **B04 `B2C-04`** — provider-neutral summary + payment step | **MODIFY (REUSE)** | **P1** | ⛔ **never on the internal route** |
| `U-COM-02` | B2B external | Confirming payment | FRD 9.1.x | **B04 `B2C-05`** | **KEEP** | **P1** | — |
| `U-COM-03` | B2B | **Access activation outcome** — all three FRD 9.1.x outcomes; **and the no-payment activation** | `STK31-19` · `STK31-20` | **B04 `B2C-06`** | **MODIFY** | **P1** | **Only success writes** |
| `U-COM-04` | Tenant | Access history | — | **B04 `B2C-07`** | **KEEP** | **P2** | — |
| `U-IND-01` | Individual · B2C | **Access period selection** — Monthly · Quarterly · Yearly · **no Lifetime** | `STK31-05` | 🔴 **no term selector exists anywhere** | **NEW** | **P3** | `ND-06` |
| `U-IND-02` | Individual · B2C | Individual checkout | `STK31-04` | **B04 `B2C-04`** | **DEFER** | **P3** | `PM29-A5` |
| `U-IND-03` | Individual · B2C | Already-held route guard | — | **B04 `GUARD-ALREADY-HAVE`** | **KEEP** ▷ deferred | **P3** | ✅ architectural |
| `U-IND-04` | Public / B2C | Bundle detail | `STK31-13` | **B04 `B2C-03`** — 3-module model **superseded** | **REFRAME** ▷ deferred | **P3** | ⚪ what carries a price — `ND-08` |
| `U-IND-05` | Individual · B2C | Partly-held bundle guard | `Q-45` | **B04 `GUARD-PARTLY-HELD`** | **DEFER** | **P3** | FRD 6.3.x **Phase 2** |

---

# I · SUPPORT AND OPERATIONS

**A wholly new capability area — `STK31-39`.**

| Draft ID | Plane / role | Purpose | Source | Existing reusable screen | Action | Pri | Dependencies |
|---|---|---|---|---|---|:---:|---|
| `U-SUP-01` | All users | **Report an issue** — experiment not opening · package/link · login · access · device · other | `STK31-39` | 🔴 none · form grammar from **B01** | **NEW** | **P1** | `U-X-04` |
| `U-SUP-02` | All users | My reported issues and their state | `STK31-39` | **B01** `Status Badge` + `Empty State` | **NEW** | **P2** | — |
| `U-SUP-03` | Platform · Super Admin | Issue queue | `STK31-39` | ▶ **B01 queue** + **B05 attention list** | **NEW** | **P1** | — |
| `U-SUP-04` | Platform · Super Admin | Issue detail — affected user / Experiment / Tenant · track · resolve/close | `STK31-39` | ▶ **B01 review panel** + **B03 `Issue Card`** | **NEW** | **P1** | ⛔ **no SLA, no priority formula** |

---

# J · CROSS-CUTTING

| Draft ID | Plane / role | Purpose | Source | Existing reusable screen | Action | Pri | Dependencies |
|---|---|---|---|---|---|:---:|---|
| `U-X-01` | All | **Application shell + unified navigation** — one chrome, per-workspace nav | `STK31-47` | **B01 `SHR-02`** — used unchanged by all five batches | **MODIFY (MERGE)** | **P0** | 🔴 five stylesheet copies → one |
| `U-X-02` | All | Not found | — | **B04 `NOT-FOUND`** · **B05** three states share one pattern | **KEEP** | **P1** | — |
| `U-X-03` | All | Error state grammar | `D-18` | **B01 `STATE-03`** | **KEEP** | **P1** | — |
| `U-X-04` | All | **Help — one consistent location on every screen** | `STK31-39` · **WCAG 2.2 SC 3.2.6 (Level A)** | Present in B01–B03, **dropped by B04, demoted by B05** | **NEW** | **P1** | 🔴 an accessibility obligation, not a preference |

---

# Roll-up

## By status

| Status | Count |
|---|---:|
| **KEEP** *(incl. KEEP + REWORD)* | **26** |
| **MODIFY** *(incl. EXPAND)* | **28** |
| **MERGE** | **3** *(collapsing 9 built screens)* |
| **NEW** | **38** |
| **DEFER / REFRAME** | **6** |
| **Total** | **101** |

## By priority

| Priority | Count | What it buys |
|---|---:|---|
| **P0** | **36** | The core B2B journey walks end to end |
| **P1** | **42** | The rest of the **current** B2B platform delivery — content production, Super Admin governance, support. **In scope, not deferred** |
| **P2** | **17** | Operational completeness — device lifecycle, reporting, configuration, recovery paths. **In scope, not deferred** |
| **P3** | **6** | **The only genuinely deferred work** — the B2C secondary rollout |

## By area

| Area | Screens | P0 | P1 | P2 | P3 | New |
|---|---:|---:|---:|---:|---:|---:|
| A · Public | 7 | 5 | 2 | 0 | 0 | **4** |
| B · Authentication | 9 | 3 | 2 | 3 | 1 | **9** |
| C · Super Admin | 18 | 4 | 9 | 5 | 0 | **8** |
| D · Content governance | 11 | 0 | 9 | 2 | 0 | **0** |
| E · Tenant Admin | 17 | 8 | 7 | 2 | 0 | **4** |
| F · Faculty | 11 | 6 | 4 | 1 | 0 | **2** |
| G · Learner core | 11 | 9 | 0 | 2 | 0 | **2** |
| H · Commerce | 9 | 0 | 3 | 1 | 5 | **1** |
| I · Support | 4 | 0 | 3 | 1 | 0 | **4** |
| J · Cross-cutting | 4 | 1 | 3 | 0 | 0 | **1** |
| **Total** | **101** | **36** | **42** | **17** | **6** | **35** |

*(35 rows are tagged NEW in the per-area count; 38 in the status table, because three MERGE targets also introduce a region that exists nowhere.)*

## What the shape says

- **63 of 101 (62%) already exist in some form.** The product is roughly two-thirds built and one-third unrouted.
- **Area D — content governance — is 100% existing.** Eleven screens, zero new. `STK31-06` re-confirms the chain outright.
- **Area G — the learner core — is 82% existing**, and the two new rows complete a half-built device workflow whose approval end already ships.
- **Area B is 9 new out of 9.** Authentication is the largest single hole, it is not controversial, and it now sits directly in the path of the highest-priority journey.
- **Area C nearly doubles.** Super Admin was intentionally conservative and is now materially larger — but every addition is bounded by a named decision.
- **Only 6 screens are P3 — and P3 is the only deferred tier.** Deferring B2C removes six screens from the near-term build and **deletes none**. **P0, P1 and P2 are all inside the current B2B delivery.**
