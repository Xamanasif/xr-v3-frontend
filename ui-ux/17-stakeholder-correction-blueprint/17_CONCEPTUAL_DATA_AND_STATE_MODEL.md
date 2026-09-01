# 17 — Conceptual Data and State Model

| | |
|---|---|
| **Status** | ✅ **CONCEPTUAL MODEL — records and relationships only** |
| **Created** | 31 August 2026 |
| **⛔ This is NOT** | A database design · an API contract · a schema · a field-type specification · an endpoint · a payload. **None is produced by this document** |
| **What it is** | The shared conceptual records a **single unified prototype** must agree on, with each record's **owner**, **consumers**, **existing batch source**, and **new requirement source** |
| **Method** | Built on the 24 records measured in `ui-ux/16-unified-product-planning/09_STATE_AND_DATA_CONVERGENCE_MAP.md`, updated by the 31 Aug decisions. **That file is not edited** |
| **Records** | **26** |

---

## 1 · The three convergence problems the unified build must solve first

**Measured properties of the existing prototype code, not inferences. None needs a decision from anyone.**

| # | Problem | Detail |
|---|---|---|
| **1** | 🔴 **The identity namespace is split** | Batches 01, 02 use bare ids — `shear` · `bernoulli` · `torsion`. Batches 03, 04, 05 use `c_`-prefixed ids — `c_shear` · `c_bern` · `c_torsion`. **The same Experiment has two identities.** Any cross-batch link breaks on the first click |
| **2** | 🔴 **A live data contradiction** | `torsion` is `fmt: 'MR'` and `dev: 'unsupported'` in Batches 01, 03, 04, 05 — and `fmt: 'VR'`, runnable, in Batch 02, **where the learner completes its simulation.** *Batch 02's learner runs an Experiment Batch 01 says their device cannot run* |
| **3** | 🔴 **The tenant list does not contain the tenant** | Batch 03's *Sample Engineering Institute* is the only fully-designed tenant — people, streams, groups, courses, access records, SSO, ERP — and it **appears in no Batch-05 institution list.** Batches 01 and 02 hard-code its name as a topbar chip with **no record behind it** |

> **Fix all three in Stage 0**, before anything is drawn. They are the reason Option B costs less than Option A.

---

## 2 · The records

Legend — **Owner** = the role that writes it · **Consumers** = the surfaces that read it · ✅ modelled well · 🟠 modelled partially · 🔴 not modelled anywhere

### 2.1 Content

| # | Record | Owner | Consumers | Existing batch source | New requirement source | Note |
|---|---|---|---|---|---|---|
| 1 | **AcademicGrouping** — *Programme / Department / Academic Stream, **ONE** level* | **Super Admin** *(master)* · Content Manager | Public catalogue · grouping page · allocation · CSV import · academic structure | 🟠 **Batch 03's `Academic stream` IS this record**, under the name that batch used (`s_civil`) | `STK31-12` · `STK31-09` · `STK31-10` | ⚠ **Distinct from FRD 3.3.1 certification program (PM-12-deferred).** 🟢 **Terminology-neutral: `Programme` and `Academic Stream` are NOT required to be separate records.** Final label is `ND-02` |
| 2 | **Course** | **Super Admin** · Content Manager *(canonical)* · **Tenant Admin** *(local code)* | Public catalogue · Course page · allocation · Faculty assign · learner core · CSV | 🟠 **Three shapes.** B02: a denormalised display string, never navigable, **no id**. B03: keyed records with a parent stream and **no link to any experiment** | `STK31-12` · `STK31-11` · `STK31-46` | 🔴 **No batch has a course↔experiment relationship.** `STK31-46` requires one |
| 3 | **Experiment** | **Vendor** *(submits)* · Content Manager / Super Admin *(canonical)* | Everything | 🟠 **All five batches, five disjoint pools, two namespaces.** They disagree on what the object owns — B02: sequence + resources + simulation + one assessment; B04: discipline + format + counts + an assessment **boolean**; B05: **versions** | `STK31-14` · `STK31-12` | 🔴 **The single worst convergence problem.** One record, one namespace, one noun |
| 4 | **ExperimentTechnology** | Vendor *(supplies)* · Super Admin / Content Manager *(governs)* | Catalogue · detail · allocation · access record · device ladder · **progress** | 🔴 **The most duplicated field in the corpus** — the `fmt` enum is a **private constant map in every prototype**, with diverging labels and one data contradiction | `STK31-15` · `STK31-37` · `STK31-45` | **One enum, one label set, one device sentence per format.** Values: **Web · VR · MR · AR** *(MR retained)* |
| 5 | **Bundle** | Super Admin · Content Manager | Public catalogue · Programme/Course pages · commerce *(deferred)* | **B04 only** — `o_bgeo`/`o_bmech`, three module ids each, granting each **individually** | `STK31-12` · `STK31-13` | 🔴 **The 3-module model is superseded.** A Bundle now follows the hierarchy. ⚪ **What carries a price is `ND-08`** |
| 6 | **ContentVersion** | **Super Admin** *(release/hold)* | Release queue · learner *(which build runs)* | 🔴 **Two incompatible objects.** B01's `version` is an **integer counting correction rounds** *(published v3)*; B05's is a **semver string on a published module** *(1.4.0 → 1.5.0)*. **Nothing connects them** | `STK31-07` | ✅ **Ownership is now settled.** The unified model needs **one scheme, or an explicit statement that these are two objects** |
| 7 | **Submission** | **Vendor** | Vendor · Academic Reviewer · Content Manager | ✅ **B01** — 9 states, return loops, history, correction rounds | `STK31-08` · `STK31-37` · `STK31-46` | Gains **course mapping**, **package-or-link by technology**, runtime info, documentation. 🔴 **Learning Outcomes do NOT live here** |
| 8 | **LearningOutcome** | **Academic Reviewer** | Academic review · **public Experiment detail** | 🔴 **No surface anywhere** | `STK31-08` · `STK31-17` | ⚠ Closes the `N-1` ownership ambiguity |
| 9 | **PublishedContent** | **Content Manager** *(first publication)* | Public catalogue · allocation · Content Library | 🟠 **Produced in one place, consumed in four, with zero linkage.** B01 produces it; B03/B04/B05 each keep a **private hand-seeded copy**; B02's fifth copy **does not acknowledge publication exists** | `STK31-06` · `STK31-09` | Batch 01's README states the disconnect **deliberately**. One pool in the unified build |

### 2.2 Organisation and identity

| # | Record | Owner | Consumers | Existing batch source | New requirement source | Note |
|---|---|---|---|---|---|---|
| 10 | **Tenant** | **Super Admin** | Request → approval → creation · `SA-02`/`SA-03` · allocation · tenant workspace | 🟠 **Two incompatible shapes.** B03: **one** record with a full interior, single-tenant *by construction* — no list, no switcher, no "add". B05: **five** records with three readiness booleans each | `STK31-21` · `STK31-23` · `STK31-28` | 🔴 §1 problem 3. **A campus/unit may be its own Tenant.** No sub-tenant level. Gains **access term** and **on/off-campus** categorisation |
| 11 | **TenantRequest** | The applicant *(creates)* · **Super Admin** *(decides)* | Request queue · decision · applicant status · activation | 🔴 **Nowhere** | `STK31-18` · `STK31-19` · `STK31-20` · `STK31-27` | Carries the **selection**, **technologies**, **licence/user quantity**, **requested term**, organisation + SPOC, and the **internal/external branch** (`ND-07`) |
| 12 | **TenantContentAccess** | **Super Admin** *(allocates)* | `INA-06`/`07`/`08` · `SA-08` · Faculty · My Learning | ✅ **B03** — `{ covers[], status, from, to, reference, recorded }`, carrying **no price, term, tier, seats, quota, renewal, invoice or purchaser** — and 🟢 **no actor on `recorded`** | `STK31-24` · `STK31-15` · `STK31-28` | 🟢 **`STK31-24` supplies the actor.** Gains **granted technologies** and the **access term**. *One line changes; the model does not* |
| 13 | **AccessTerm** | Super Admin *(sets at approval)* | Tenant overview · `SA-08`/`SA-13` · attention states | 🔴 **Nowhere.** B03's effective dates **derive nothing**; B04's access is **perpetual** | `STK31-28` · `STK31-05` | States: **Active · Expiring soon (T-15) · Expired · Renewed**. ⛔ **No automatic renewal** (`ND-11`) |
| 14 | **LicenceQuantity** | Super Admin *(approves)* | Tenant overview · `SA-13` · institution report | 🔴 **Nowhere** — and Batches 03/05 **correctly removed every cap figure** | `STK31-27` | Derives **only** from the approved request. 🔴 **No universal cap. No sample caps** |
| 15 | **TenantUser** | **Tenant Admin** *(manual + CSV)* · ERP *(sync)* | People · person detail · Faculty roster · assignment · auth · workspace resolution | 🟠 **B03 only** — 10 records with `instId`, role, stream, groups, account state, **source**. Faculty deliberately carry `source: null`. **One person, three models**: a full record in B03, an **unrecorded persona string** in B01/B02, **absent** in B05 | `STK31-25` · `STK31-26` · `STK31-11` | 🔴 **Provisioning is new.** Gains **provenance** (`ERP`/`CSV`/`manual`), **plan context**, **local course code**, **OPTIONAL semester**. ⚠ `ND-04` write conflict |
| 16 | **UserGroup** | Tenant Admin | Assignment · Faculty · reporting | ✅ **B03** — groups inherit eligibility through their stream, **the only inheritance relationship in the corpus** | `STK31-25` | Preserved |
| 17 | **PlatformUser / RoleHolder** | **Super Admin** | `SA-14`/`SA-15` · governance queues · auth · audit attribution | 🟠 **B05** — four read-only rows. ⚠ **B05's registry does not contain B01's designed governance actors** — they are different individuals, and B01 duplicates the actor **per action** rather than referencing one | `STK31-41` · `STK31-03` | Gains **per-Course / per-Experiment assignment** and **multiple holders per Experiment**. ⚠ Identity **origin** remains `QD-02` |
| 18 | **AcademicStructure** *(grouping · group · course)* | **Platform-controlled** *(the grouping level)* · Tenant Admin *(local mapping)* | `INA-04`/`05` · population picker · allocation · CSV · public browse | ✅ **B03** — streams + groups + courses, all `source: 'data'`, read-only. B05 sees only a **scalar count** and can name none | `STK31-10` · `STK31-11` | 🟢 **Batch 03's stream level IS record 1.** No level above it is required. **No extra hierarchy level is created** |
| 19 | **SSO / ERP configuration** | Tenant Admin | `INA-09`…`INA-12` · `SA-03` readiness · institutional sign-in | ✅ **B03** — SSO with a **single opaque details blob** *(no protocol, provider, certificate, entity id, secret or claim modelled)* and a scripted first-check failure; ERP with interval, run history, issue taxonomy and retry | `STK31-44` | ⚠ **B03 models the failure taxonomy; B05 models only two booleans** — a Super Admin sees *"26 records not applied"* but **cannot see which or why.** Consume B03's richer model |

### 2.3 Access and entitlement

| # | Record | Owner | Consumers | Existing batch source | New requirement source | Note |
|---|---|---|---|---|---|---|
| 20 | **CourseAssignment / ExperimentAssignment** *(learner eligibility)* | **Tenant Admin** | `INA-07`/`08` · Faculty · My Learning | ✅ **B03 as eligibility** — `{ type: stream\|group\|person, ref, added }`, created only through the `INA-07` dialogs. **No `added by` actor field** | `STK31-25` · `STK31-15` | 🟢 **`DA-07` is CONFIRMED** — the assigner is the Tenant Admin. Gains **granted technologies** |
| 21 | **IndividualAccess** *(B2C)* | The individual *(via transaction)* | B2C route · My Learning · access history | ✅ **B04** — `S.access[moduleId] = { via, on, ref }`, *"the access spine"*, **written only by the success branch** | `STK31-05` · `STK31-04` | 🔴 **Perpetual today** — `STK31-05` and `STK31-28` require a **term**. ▷ Deferred with B2C |
| 22 | **DeviceBinding** | The learner *(binds)* · Super Admin *(approves change)* | Device access · a *my devices* surface · `SA-07` | 🔴 **Not modelled as a record anywhere.** B05 has only masked `from`/`to` strings on a transfer request | `STK31-38` · FRD 2.4.1 | ⚠ **The platform has a device-TRANSFER approval with no device REGISTRY** |
| 23 | **DeviceTransferRequest** | The learner *(raises)* · **Super Admin** *(decides)* | `SA-11`/`SA-12` · a learner-side request surface | 🟠 **B05** — 3 records, `state ∈ awaiting\|approved`, **exactly two values because no rejection path exists in the requirement** | `STK31-38` | ⚠ It names its module as **free text** while the same batch keys modules by id — *the corpus's only unresolvable cross-record reference to content* |

### 2.4 Learning

| # | Record | Owner | Consumers | Existing batch source | New requirement source | Note |
|---|---|---|---|---|---|---|
| 24 | **Assessment** *(configuration)* | **Faculty** | Builder · learner disclosure · attempt · result · **the integration boundary** | ✅ **B02** — a `cfg` object with nine settings, with **two deliberately opposite samples** so no value reads as a platform rule. ⚠ **Three resolutions of one word**: a full record (B02), a **presentational line** attributing it to *"your institution"* (B01), and a **boolean** (B04) | `STK31-30` · `STK31-32` · `STK31-35` | Gains the **answer/explanation visibility policy**. **B02 credits Faculty; B01 credits the institution — B02 is correct** (PM-15) |
| 25 | **Question** | **Faculty** | Question bank · builder · attempt | ✅ **B02 only** — 17 in-bank + 2 held `origin:'upload'`. **The most self-contained record in the corpus** | `STK31-33` · `STK31-34` | Gains **`Delete`** — the question leaves the **active** bank while **attempts and results that reference it are preserved** *(reversible mechanism underneath — `STK31-22`, `ND-15`)* — and **source-material provenance** for AI drafts |
| 26 | **Attempt · Result · Progress** | The learner *(attempt)* · **Faculty** *(descriptive result)* · derived *(progress)* | Result · progress · Faculty analytics · the integration boundary | ✅ **B02** — recording is **unconditional** per FRD 11.2.1/11.2.2, so `used` increments regardless of the limit and `attemptLimit` gates only **starting**. 🔴 **The pending → finalized transition has no actor.** ⚠ **B01 and B02 both ship a screen called *Progress* at the same route with different models** | `STK31-31` · `STK31-32` · `STK31-36` | 🟢 **`STK31-31` gives the pending transition its actor: Faculty.** 🟢 **PM-09 confirms B02's derived model.** 🔴 **Progress gains a per-technology axis** |

---

## 3 · Why PUBLISHED ≠ LEARNER-ENTITLED — the chain, now fully owned

**Before 31 August, three of the six stages between *published* and *this learner can see it* had no owner in any batch. All three now do.**

| # | Stage | Record | Owner | Status |
|---|---|---|---|---|
| **1** | Submission reaches published | `Submission.status` + `publishedOn` | ✅ **Content Manager** | `STK31-06` — **confirmed** |
| **2** | **Version release / hold** | `ContentVersion` | ✅ **Super Admin** | 🟢 **`STK31-07` — was ambiguous, now settled** |
| **3** | **Tenant allocation** | `TenantContentAccess` *(created)* | ✅ **Super Admin** | 🟢 **`STK31-24` — was the largest hole, now owned** |
| **4** | Institution content access exists | `TenantContentAccess` | ✅ Super Admin | 🟢 The `recorded` line **gains its actor** |
| **5** | **Eligibility relationship** | `ExperimentAssignment` | ✅ **Tenant Admin** | 🟢 **`STK31-25` — `DA-07` confirmed** |
| **6** | Academic placement | `person.stream` + `person.groups` | ERP · **or CSV / manual** | 🟠 **`STK31-25` adds two write paths** — ⚠ `ND-04` |
| **7** | Derived learner eligibility | never stored | — | ✅ Only here does *published* become *this person can see it* |
| **8** | **Still not runnable** | `DeviceBinding` + technology support | — | **Entitled ≠ available on a device ≠ completed** |
| **9** | **And now, per technology** | `Progress` × technology | — | 🔴 **New** — `STK31-36` |

> **The package proved the gap by construction.** `qa/seed-states/state-end.json` drives a submission to *published v3*, and the same experiment on the learner side is **untouched** — *publishing changes nothing a learner can see*. Batch 03's `a_survey` ships with an **empty eligibility array**: the institution holds the content and **no learner can see it**. Adding **one** relationship makes it appear.
>
> **That chain is now owned end to end.** It was not, three days ago.

---

## 4 · The three incompatible entitlement models — and the one that replaces them

| | Batch 01 | Batch 03 | Batch 04 |
|---|---|---|---|
| **Shape** | `e.ent` — a per-experiment enum `active\|none\|denied` | **Two levels** — content access *(WHAT)* + eligibility *(WHO)* | `S.access[id] = { via, on, ref }` — a per-module grant |
| **Origin** | Hand-seeded, **no relationship behind it** | `recorded` — **a date with no actor** | A **transaction** (`via` + `ref`) |
| **Learner state** | Stored | **Derived, never stored** | Derived from the grant |
| **Duration** | — | Effective dates present; **nothing derived** | 🔴 **Perpetual** |
| **Product word** | *"Access"* to the learner | **Refuses *entitlement*** — says *eligibility* and *reaches* | Confines *entitlement* to a disclaimer |

### The unified record

**Batch 03's two-level model wins**, because it is the only one that separates *what an organisation holds* from *who it reaches* — which is exactly the distinction `STK31-24` and `STK31-25` confirm at two different altitudes. It gains three things:

```
TENANT CONTENT ACCESS          ← Super Admin allocates            STK31-24
   · which Courses / Experiments
   · + WHICH TECHNOLOGIES                                          STK31-15   ← new
   · + THE ACCESS TERM                                             STK31-28   ← new
   · + AN ACTOR ON `recorded`                                      STK31-24   ← new
        │
        ▼
ELIGIBILITY / ASSIGNMENT       ← Tenant Admin assigns             STK31-25
   · to a stream · a group · a person
   · + the granted technologies
        │
        ▼
DERIVED LEARNER ELIGIBILITY    ← never stored
        │
        ▼
PROGRESS × TECHNOLOGY          ← derived, per assigned technology  STK31-36   ← new
```

**Batch 04's transaction-shaped grant is preserved for the deferred B2C route** and writes into the same downstream path. **Batch 01's stored enum is the subset** and is replaced by the derivation — the same resolution PM-09 already applied to progress.

---

## 5 · What a unified prototype must agree on before it starts

| # | Agreement | Needs a decision? |
|---|---|---|
| 0 | **One terminology-neutral academic grouping record** *(record 1)* — **not** two | 🟢 **No** — `STK31-12` and `STK31-10` settle the rules; only the **label** is `ND-02` |
| 1 | **One Experiment record, one id namespace** | 🟢 **No** — `STK31-14` settles the noun; the namespace is a design choice |
| 2 | **One entitlement record** *(§4)* | 🟢 **No** — `STK31-24`, `STK31-25`, `STK31-28`, `STK31-15` settle every input |
| 3 | **One institution record**, and whether the sample tenant joins the platform list | 🟢 **No** — design-only |
| 4 | **One progress model, plus the technology axis** | 🟢 **No** — PM-09 + `STK31-36` |
| 5 | **One version scheme, or an explicit two-object statement** | 🟢 **No** — `STK31-07` settles ownership; the scheme is a design choice |
| 6 | **One technology enum, one label set, one device sentence** | 🟢 **No** — design-only |
| 7 | **A course ↔ experiment relationship** | 🟢 **No** — `STK31-46` requires it; ⚪ *who writes it* is `PQ-20`, non-blocking |
| 8 | **An actor on every access and eligibility record** | 🟢 **No** — `STK31-24` + `STK31-25` |
| 9 | Person **provenance** and conflict handling | 🟠 **Handling yes, precedence rule no** — `ND-04` |

> **Nine of ten need no further decision.** Three days ago, four of eight did.

⛔ **No schema, contract, endpoint, payload or field type is proposed by this document.** The entitlement service, its data model and its interfaces all remain pending.
