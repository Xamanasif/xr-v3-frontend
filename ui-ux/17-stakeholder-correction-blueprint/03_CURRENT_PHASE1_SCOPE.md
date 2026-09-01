# 03 — Current Phase-1 Delivery Scope

| | |
|---|---|
| **Status** | ✅ **CURRENT SCOPE OF RECORD** |
| **Created** | 31 August 2026 |
| **Governing decision** | `STK31-04` — **B2B is the current delivery priority. Direct self-service B2C is deferred/secondary** |
| **Rule** | **Nothing is deleted.** Deferred work is preserved, named, and given a re-entry point |

---

## 1 · The one-sentence scope

> **Build the institutional (B2B) route end to end — public discovery → institutional request → Super Admin approval → tenant → people → content assignment → learning → assessment → progress — plus the content production chain that fills it and the platform governance that controls it. Preserve the individual (B2C) route in full and build it later.**

> ### ⚠ Implementation priority is not phase scope
> The **P0 / P1 / P2 / P3** labels in `14_UNIFIED_SCREEN_REQUIREMENTS.md` and the **stages** in `15_IMPLEMENTATION_BACKLOG_AND_SEQUENCE.md` are **build order**. **They are not Phase 1 / Phase 2 / Phase 3.**
>
> Everything in §3 below is **current delivery scope**, whatever its priority number. In particular, the **content-production chain (Vendor → Academic Reviewer → Content Manager → Published) is required for the current complete B2B platform** — sequencing it after the first vertical slice does not defer it. **Only §4 is deferred.**

---

## 2 · What "B2B first" does and does not mean

| It means | It does NOT mean |
|---|---|
| The institutional route is built, proved and stabilised first | That B2C leaves the architecture |
| B2C checkout architecture **does not drive** the Phase-1 build | That Batch 04 is deleted, deprecated or withdrawn |
| The public catalogue's primary action is the **institutional selection/request** path | That an individual can never be served |
| Commercial modelling follows the **institutional request**, not a self-service basket | That the FRD's B2C Phase-1 requirements are removed |
| The shared learning core is built once and serves both | That two learner experiences are built |

> **Recorded override.** `PM-04` (18 Aug) explicitly prohibited treating B2B-first as a confirmed release sequence. **`STK31-04` overrides that prohibition deliberately.** `PM-04`'s other half — *"both must be represented in the platform architecture"* — **stands and is honoured** by the Deferred-but-Preserved section below.

---

## 3 · CURRENT B2B DELIVERY — in scope now

### 3.1 Public plane

| Area | Content |
|---|---|
| **Public landing** | What the platform is; the way into the catalogue and the two entry contexts |
| **Public catalogue** | Browse · search · filter over published content. Programme/Department → Course → Experiment |
| **Public Course page** | A course, its code, and the Experiments it holds |
| **Public Experiment detail** | Title · Programme/Course context · description · **Learning Outcomes** · preview/video where available · supported technologies · device/runtime requirements · access/request context |
| **Technology selection** | AR / VR / Web(GL) — selectable per Experiment |
| **Selection / cart** | A selection basket that prepares a request. **It never grants access** |
| **Entry fork** | Institution / Tenant · Individual |

### 3.2 Institutional access plane

| Area | Content |
|---|---|
| **Institution application / tenant request** | Organisation information · SPOC/contact · selected content and technologies · **required licences/users** · requested access term |
| **Request status** | The applicant can see that it was received and what state it is in |
| **Super Admin review and decision** | Approve · request more information, with a reason and a history trail |
| **Commercial branch** | **External** → payment cycle → activation · **Internal / approved collaborator** → activation with **no payment screen**, access still tracked |
| **Tenant creation** | Tenant exists; isolation applies; a Tenant Admin is assigned |
| **Tenant content and technology allocation** | Super Admin decides which Courses, Experiments and technology variants the tenant receives |

### 3.3 Tenant plane

| Area | Content |
|---|---|
| **Tenant Admin** | People (manual add · CSV bulk import · per-row error report) · Faculty and Student/group mapping · Course/Experiment assignment **from the approved set** · institution-specific mappings (local Course Code, optional Semester, plan/access context) · SSO and institution-data setup · reporting over assigned students and content · student deactivate/remove |
| **Faculty** | Experiments available to the tenant · student/group assignment context · assessment configuration · Question Bank (add · edit · **delete** · AI drafts from source material · import) · **descriptive evaluation** · student results · completion/progress · Experiment usage · time spent |
| **Student / Learner** | My Learning · Experiment detail · resources → simulation → assessment → result → progress · **progress per assigned technology** · Web in browser · AR/VR/MR on device, entitlement-aware · **device binding and replacement request** |

### 3.4 Central content plane

| Area | Content |
|---|---|
| **Vendor** | Submit builds and metadata · package **or** hosted link by technology · supported technology/device/runtime information · technical documentation · corrections and version submissions · Experiment↔Course mapping |
| **Academic Reviewer** | Academic validation · Course/Experiment alignment · **Learning Outcomes** · approve or request changes |
| **Content Manager** | Content Library · readiness review · **first publication** · canonical content metadata |
| **Super Admin** | Canonical/master metadata · **later-version Release/Hold** · platform role governance, including per-Course / per-Experiment assignment of Vendor, Reviewer and Content Manager |

### 3.5 Platform operations

| Area | Content |
|---|---|
| **Super Admin platform** | Tenant requests and approvals · tenant creation, deactivation, termination · Tenant Admin assignment · content and technology allocation · licensing and access visibility · subscription/access terms and the **REQUIRED 15-day expiry reminder** *(an `Expiring soon` attention row is recommended supporting UX, not a separate requirement)* · institution profile/report · device-transfer approvals · platform configuration register |
| **Support / operations** | User issue reporting · platform-side issue visibility, tracking and resolution |
| **Authentication** | Sign in · institutional SSO with a **platform-authentication fallback** · registration · password reset · session expiry · **workspace resolution across seven roles** |

---

## 4 · DEFERRED BUT PRESERVED

> **This section exists so that deferral is never mistaken for deletion.** Every item below has a designed artefact, a named owner, and a re-entry point.

| # | Deferred item | Where it lives | Why deferred | Re-entry condition |
|---|---|---|---|---|
| **D1** | **Direct B2C self-service commerce** — catalogue → get access → checkout → payment → access | Batch 04 (`B2C-01` … `B2C-07`, guards, `AUTH-B2C`) | `STK31-04` — B2B proves the model first | B2B is stable and the business decides to launch B2C |
| **D2** | **B2C access periods** — Monthly · Quarterly · Yearly, **no Lifetime** | `STK31-05`; no surface exists yet | Downstream of D1 | With D1 |
| **D3** | **Individual authorisation-before-payment**, if it applies | `PM29-A5`; Batch 04's access spine would gain **one state** | Downstream of D1 | With D1 |
| **D4** | **B2C bundle purchase and overlap handling** | Batch 04 `B2C-03`, `GUARD-PARTLY-HELD`, `Q-45` | Downstream of D1 **and** of bundle pricing, FRD 6.3.x **Phase 2** | With D1, once pricing exists |
| **D5** | **Certification** | PM-12 — moved to Phase 2. FRD 3.3.1 / 3.3.2 | PM decision, 18 Aug. **Untouched by 31 Aug** | Phase 2 |
| **D6** | **Analytics dashboards** | PM-11; FRD 8.2.x / 11.3.x (Phase 2), 11.4.x (Phase 3) | PM decision. `STK31-29`/`42`/`43` scope **operational** reporting only | Phase 2 |
| **D7** | **XR device registration and remote management** | FRD 2.5.x / 2.6.x — Phase 2 | FRD phasing | Phase 2 |
| **D8** | **In-platform institutional course creation** | FRD 3.4.x — Phase 2 | FRD phasing. Batch 03's academic structure stays view-only | Phase 2 |
| **D9** | **Custom role creation** | FRD 8.3.x — Phase 3 | FRD phasing. **Seven roles is a hard boundary in Phase 1** | Phase 3 |
| **D10** | **Bundle creation and pricing configuration; coupons** | FRD 6.3.x / 6.4.x — Phase 2 | FRD phasing | Phase 2 |
| **D11** | **Institutional invoicing and subscription billing** | FRD 9.3.x — Phase 2 | FRD phasing. `STK31-28` confirms the **access term and reminder**, not billing | Phase 2 |
| **D12** | **Real-time ERP provisioning** | FRD 7.3.x — Phase 2 | FRD phasing. Scheduled sync (7.2.1) is Phase 1 and built | Phase 2 |
| **D13** | **A general notification capability** *(beyond the confirmed expiry reminder)* | No Phase-1 FRD requirement | Not sourced. ⚠ **The 15-day expiry reminder is NOT deferred** — `STK31-28` makes it a **REQUIRED** capability and it sits in current scope (§3.2). Only its **delivery channel** is pending (`ND-16`), and only *other* notification types are deferred | When a further notification requirement exists |

### The rule for deferred work

> **A deferred surface is not drawn, not routed, and not stubbed with a disabled control.** Where a deferred capability would otherwise appear, the platform **shows the gap as a gap** — Batch 05's rule, adopted platform-wide.

---

## 5 · Phase-1 requirement accounting

**Unchanged as a document fact.** The FRD's Phase-1 set is **78 requirements**; the **design working set is 76 + 2 PM-deferred** (FRD 3.3.1 and 3.3.2, deferred by PM-12).

**The 31 Aug review does not remove a single requirement from Phase 1.** It:

- **sequences delivery** (`STK31-04`) — B2B first, B2C preserved;
- **extends** the requirement set in nine recorded places (§D `S-5`, `S-6`, `S-8`, `S-9`, `S-10`, `S-15`, `S-20` in the update file);
- **fills three FRD silences** (`S-14` descriptive grading, `S-18` learning outcomes, `S-17` version release);
- **resolves one DESIGN-PENDING item** (`S-7` the cart model).

> **The requirement count is not the scope.** Delivery scope is the B2B route through those requirements, as enumerated in §3.

---

## 6 · What is explicitly NOT in the current scope

| Not in scope | Why |
|---|---|
| A price, a currency, a tax treatment, or a price-construction rule | `ND-08`, `ND-12`. **Do not invent** |
| A payment provider or gateway integration | `ND-12`; FRD 9.1.x names none |
| A payment screen on the internal / BITS-community route | `STK31-19` — **explicitly prohibited** |
| A seat cap, quota or capacity figure that does not come from an approved request | `STK31-27` |
| Revenue, financial or executive analytics | `STK31-40`, `STK31-42` — **explicitly prohibited** |
| A support SLA, priority formula, external ticket provider, or chatbot | `STK31-39` — **explicitly prohibited** |
| Automatic renewal, automatic payment, or automatic charge | `STK31-28` — **must not be assumed** |
| A database schema, API contract, endpoint or payload | Out of scope for this phase by instruction. `17_CONCEPTUAL_DATA_AND_STATE_MODEL.md` is **conceptual only** |
| A selected XR delivery mechanism | `QT-01`, pending by explicit PM-05 instruction |
| Any edit to the FRD, `source/`, `requirements/`, the PM captures, Review 006, Batches 01–05, `15-` or `16-` | Standing authority rule |
