# 09 — State and Data Convergence Map

| | |
|---|---|
| **Status** | 🟠 **CONVERGENCE ANALYSIS — DRAFT** |
| **Created** | 29 August 2026 |
| **⛔ This is not** | A database design, an API contract, a schema, or a field-type specification. **No schema is produced by this task** — `N9` |
| **What it is** | A map of **which conceptual records the five prototypes already simulate**, where they duplicate or contradict each other, and which future screens consume them |
| **Method** | Read from the initial-state blocks of all five `prototype/*.js` files **and** the 37 `qa/seed-states/*.json` patches. Every claim below is a measured property of the code, not an inference |
| **Records mapped** | **24** |

---

## 1 · The three findings that matter most

### 1.1 · 🔴 The identity namespace is split

| Batches | Key form | Example |
|---|---|---|
| **01, 02** | bare ids | `shear` · `bernoulli` · `torsion` · `consolidation` · `surveying` |
| **03, 04, 05** | `c_`-prefixed ids | `c_shear` · `c_bern` · `c_torsion` · `c_consol` · `c_survey` |

**The same experiment has two identities across the package.** Any consolidated prototype breaks on the first cross-batch link.

### 1.2 · 🔴 A live data contradiction on one experiment

| | `torsion` — *Strength of Materials — Torsion Test* |
|---|---|
| **Batches 01, 03, 04, 05** | `fmt: 'MR'` · in Batch 01, `dev: 'unsupported'` |
| **Batch 02** | `fmt: 'VR'` · `deviceLine: 'VR headset — e.g. Meta Quest'` — **and the learner completes its simulation** |

> **Batch 02's learner runs an experiment Batch 01 says their device cannot run.**

**Names diverge too, on the same objects:**

| Batches 01 / 03 / 04 | Batch 02 |
|---|---|
| *Fluid Mechanics — Bernoulli Flow Visualisation* | *Fluid Dynamics — Bernoulli's Theorem* |
| *Geotechnical — Consolidation Test* (B03) | *Soil Mechanics — Consolidation Test* |

### 1.3 · 🔴 The tenant list does not contain the tenant

| | |
|---|---|
| Batch 03's institution | **Sample Engineering Institute** (`SEI-2026`) — one record, full interior: people, streams, groups, courses, access records, SSO, ERP |
| Batch 05's institutions | **Northfield · Meridian · Calder · Ashcroft · Lakeside** — five records, three readiness booleans each |

**The only fully-designed tenant appears in no platform-level list**, and the two institution shapes cannot produce one another. Batches 01 and 02 additionally hard-code the string *"Sample Engineering Institute"* as workspace context and topbar chip — **an institution with no record behind it**.

---

## 2 · The record map

Legend — ✅ modelled well · 🟠 modelled partially · 🔴 not modelled · ⚠ incompatible shapes

### 2.1 Content

| Record | Simulated in | Duplicated in | Incompatible shape | Future consumers | PM dep |
|---|---|---|---|---|---|
| **Program / Programme** | 🔴 **Nowhere** | — | ⚠ **A name collision with a deferred term.** Batch 03 refused the word and shipped **Academic stream** (`s_civil` *B.E. Civil Engineering*) in its place | Public browse level · public course page · allocation unit · **CSV import (`PM29-25` makes *Programme* a mandatory learner field)** · `INA-04` | ⛔ **`PQ-04(b)`** |
| **Course** | B02 *(a display string on the module)* · B03 *(keyed records `k_geo`, `k_fluid`, `k_som`, `k_therm` with a parent stream)* | Both carry **the same four course names with no shared identity** | ⚠ **Three shapes.** B02: a denormalised string, never navigable, no id. B03: a first-class record from institution data with **no link to any experiment**, and explicitly never a target of eligibility. And **no batch has a course↔experiment relationship at all** | Public catalogue · public course page · learner core · allocation · Faculty assign · CSV | 🟠 The level is agreed; **the code field and the experiment link are not** |
| **Experiment / Module** | **All five** — B01 twice *(governance + learner, mutually disconnected by explicit design)* · B02 `S.modules` · B03 `S.content` · B04 `S.modules` · B05 `S.modules` | **Five disjoint content pools** | ⚠ **The single worst convergence problem.** Two key namespaces, and the batches disagree on what the object **owns**: B02's module owns a learning sequence, resources, a simulation state and one assessment; B04's owns discipline, format, PDF/video counts and an assessment **boolean**; B05's owns **versions** | Everything | ⛔ **`PQ-04(a)`** |
| **Bundle** | **B04 only** — `o_bgeo` → `[c_consol, c_survey, c_beam]` at 6000 · `o_bmech` → `[c_torsion, c_heat, c_gear]` at 7200 | — | ⚠ Not a duplication. B04's bundle **holds module ids, not copies**, and grants each **individually** — verified: one history record grants three separate access entries. It is **never a special case in the access model** | Public catalogue *(blocked)* · B2C get-access · allocation *(if the unit is a package)* | ⛔ **`PQ-02`** |
| **Technology availability** | **All five** — `fmt ∈ Web\|VR\|MR\|AR` | 🔴 **The most duplicated single field in the package** — redefined as a **local constant map in every prototype** | ⚠ Same enum, **five private copies**, one data contradiction (§1.2), and diverging labels: badges read `Web/VR/MR/AR`, B04's filter reads *Web browser / VR headset / MR device / Mobile AR*, and device sentences differ per batch for the same format | Public detail *(a `PM29-03` field)* · catalogue filter · access record *(if a variant)* · device ladder | ⛔ `PQ-13` · `PQ-08` |
| **Published content** | **B01 only produces it** — any submission with `status: 'published'` + `publishedOn`, **plus two hard-coded rows that exist nowhere else in state** | B03, B04, B05 each keep a **private hand-seeded copy**; B02's is a fifth that **does not acknowledge publication exists** | ⚠ **Produced in one place, consumed in four, with zero linkage.** Batch 01's README states the disconnect deliberately | Public catalogue · allocation · content access · B2C offering | 🟢 Ownership **confirmed**; ⚪ what happens next is `PQ-01` |

### 2.2 Organisation and identity

| Record | Simulated in | Incompatible shape | Future consumers | PM dep |
|---|---|---|---|---|
| **Institution / Tenant** | B03 *(one record, full interior)* · B05 *(five records, readiness booleans)* | ⚠ **Three ways.** (1) **Cardinality** — B03 is single-tenant *by construction*: no list, no switcher, no "add". (2) **Membership** — §1.3. (3) **Shape** — a full interior vs three booleans | Application → validation → authorisation → creation · `SA-02`/`SA-03` · allocation · `INA-09` | ⛔ `PQ-03` · `PQ-11` |
| **Tenant user** | **B03 only** — 10 records with `instId`, role, stream, groups, account state, source. **Faculty deliberately carry `source: null`** because *who creates a Faculty account is undefined* | ⚠ **One person, three models.** `p_rv` Rahul Verma is a full record in B03, an **unrecorded persona string** in B01/B02, and **absent** in B05 | 🔴 **Provisioning — manual + CSV** · `INA-02`/`INA-03` · Faculty roster · **auth and workspace resolution** | ⛔ `PM29-10` · **`PQ-10`** |
| **Platform user** | **B05** — four read-only rows *(Super Admin, Content Manager, Academic Reviewer, Vendor)* | ⚠ **B05's role register does not contain B01's designed governance actors** — they are different individuals. B01 also **duplicates the actor per-action** rather than referencing one (`arvApprove` always attributes to *Dr. R. Iyer*) | `SA-09` · auth · multi-role chooser · audit attribution | ⛔ **`QD-02`** |
| **Academic structure** | **B03** — streams + groups + courses, all `source: 'data'`, read-only. **Groups inherit eligibility through their stream — the only inheritance relationship in the package** | ⚠ B05 sees only a **scalar count of streams** and can name none. **Neither models a level above the stream** — exactly where *Programme* would sit | `INA-04`/`INA-05` · population picker · access mapping · CSV import · public browse | ⛔ **`PQ-04(b)`** |
| **SSO / ERP configuration** | **B03** — SSO with a **single opaque details blob** *(no protocol, provider, certificate, entity id, secret, issuer or claim is modelled)* and a scripted first-check failure; ERP with interval, run history, issue taxonomy and retry | ⚠ B03 models the **configuration and its failure taxonomy**; B05 models only the **outcome** as two booleans. So a Super Admin sees *"26 records not applied"* but **cannot see which records or why** | `INA-09`…`INA-12` · `SA-03` readiness ledger · tenant setup · institutional sign-in | ✅ **The least PM-blocked area in the package** |

### 2.3 Access and entitlement

| Record | Simulated in | Incompatible shape | Future consumers | PM dep |
|---|---|---|---|---|
| **Content access** *(institutional)* | **B03** — 5 records: `{ covers[], status, from, to, reference, recorded }`. **`a_survey` ships with an empty eligibility array as the demonstration record.** Carries **no** price, term, tier, seats, quota, renewal, invoice or purchaser — **and no actor on `recorded`** | ⚠ **B03 models it as enumerable** *(which experiments, which populations)*; **B05 as a per-institution boolean plus a count of streams** — it can say *"content access recorded against 4 academic streams"* but **cannot say which experiments** | 🔴 **Allocation creates it** · `SA-08` · `INA-06`/`07`/`08` · My Learning | 🔵 **`PM29-23` fills the actor blank** · ⚪ **unit open** |
| **Tenant allocation** | 🔴 **NOT SIMULATED ANYWHERE** | ⚠ **The package's largest structural hole.** The missing stage between *published* and *the institution holds content access*. B03's records simply pre-exist; B05's Super Admin has **no such write action** | A new Super Admin allocation screen · `SA-08` becomes writeable · `INA-06` records gain an actor and a provenance line | 🔵 `PM29-23` · ⚪ **unit** |
| **Learner assignment** | **B03 as eligibility** — `{ type: stream\|group\|person, ref, added }`, created only through the `INA-07` dialogs. **No `added by` / actor field exists** | ⚠ **Three different verbs for "make content reach a person", none of which is the one the PM's model needs.** B03: institution → population, Institute-Admin-owned. B02: assessment → module, Faculty-owned. The master model asks *who assigns an experiment to a student or group* and draws a **dashed line** | A tenant-side assignment surface · `INA-08` · Faculty workspace · My Learning | ⛔ **`PQ-05`** |
| **Individual access** | **B04** — `S.access[moduleId] = { via, on, ref }`, *"the access spine"*. **Written only by the success branch** of `settleTransaction()` | ⚠ **A third incompatible model** — see §3. And it is **perpetual**: no term, no expiry. **`PM29-19` already contradicts that** | B2C route · My Learning · access history · public CTA · **renewal/expiry surfaces that exist in no batch** | ✅ `PM29-19` periods · ⚪ `PQ-07` |
| **Device binding** | 🔴 **Not modelled as a record anywhere.** B05 has only masked `from`/`to` strings on a transfer request | ⚠ **The platform has a device-TRANSFER approval with no device REGISTRY** | Device access · a *my devices* surface *(never designed)* · `SA-07` | FRD 2.4.1 has no designed surface; 2.5.x/2.6.x are Phase 2 |
| **Device-transfer request** | **B05** — 3 records, `state ∈ awaiting\|approved`, **exactly two values because no rejection path exists in the requirement** | ⚠ Two structural gaps: it names its module as a **free-text string** while the same batch keys modules by id — *the platform's only cross-record reference to content is unresolvable*; and **there is no decline path**, recorded as an explicit source gap rather than a disabled control | `SA-06`/`SA-07` · 🔴 a learner-side request surface | ⚪ Whether declining is possible |

### 2.4 Learning

| Record | Simulated in | Incompatible shape | PM dep |
|---|---|---|---|
| **Assessment** | **B02** — the `cfg` object with nine settings is **the core record**, with two deliberately opposite samples so no value reads as a platform rule | ⚠ **Three resolutions of one word:** a full configuration record (B02), a **presentational list line** attributing it to *"your institution"* (B01), and a **boolean** (B04). B01 credits the institution; B02 credits Faculty | ✅ `PM-08` · ⛔ `QP-02` |
| **Question** | **B02 only** — 17 in-bank + 2 held `origin:'upload'` until the simulated upload flips them | ⚠ No duplication. **The most self-contained record in the package.** One tension: the bank is called *tenant-scoped* but **no tenant record exists in B02** — the scope is asserted in copy only | ❌ **None blocking** |
| **Attempt** | **B02 only** — answers written on every change; **recording is unconditional** per FRD 11.2.1/11.2.2, so `used` increments regardless of the limit, and `attemptLimit` gates only **starting** a new attempt | ⚠ No duplication. B04 models none. One risk: the timer is a client-side epoch, and **A6 says the platform prompts but never auto-submits** — a rule needing re-confirmation once a server exists | ❌ None blocking |
| **Result** | **B02 only** — objective results are complete; descriptive results enter `state: 'pending'` and are later mutated by a **prototype control** | ⚠ **A deliberate hole inside the record: the pending → finalized transition has no actor.** No evaluator, rubric, turnaround, queue or grading record. The learner-facing wording is always *"the required evaluation"*, naming no one | ⛔ **`QP-02`** — *the only open item that can strand a learner* |
| **Progress** | B01 *(stored — an enum driven by XR delivery events)* · B02 *(**derived, never stored** — resources + simulation + assessment pass)* | ⚠ **Both ship a screen literally called *Progress* at `#/learner/progress`, with different columns and different models.** For B01, completing the simulation **is** completion; for B02, simulation is **step 2 of 4** and a module never completes while a result is pending | 🟢 **`PM-09` confirms B02's derivation as the intended one** — B01's stored enum is the subset |
| **Version release** | **B05** — 5 records, `state ∈ awaiting\|released\|held`; releasing advances `module.live`. **No reason field on a hold** | ⚠ **Same noun, two objects.** B01's `version` is an **integer** counting correction rounds; B05's is a **semver string** on a published module. **Nothing connects them** — B01's soil submission reaches *published v3* while B05 tracks `1.4.0 → 1.5.0` | ⛔ **`PQ-01`** · `GP-4` |

---

## 3 · The three incompatible entitlement models

**The same concept, modelled three ways that cannot be merged without one side gaining fields it deliberately refused.**

| | Batch 01 | Batch 03 | Batch 04 |
|---|---|---|---|
| **Shape** | `e.ent` — a per-experiment enum `active\|none\|denied` | **Two levels** — a content-access record *(covers WHAT)* + an eligibility relationship *(covers WHO)* | `S.access[moduleId] = { via, on, ref }` — a per-module grant |
| **Origin** | Hand-seeded, **no relationship behind it** | `recorded` — **a date with no actor** | A **transaction** (`via` + `ref`) — which B03 deliberately refuses |
| **Learner state** | Stored | **Derived, never stored** | Derived from the grant |
| **Duration** | — | Effective dates present; **nothing derived from them** | 🔴 **Perpetual** — no term, no expiry |
| **Product word** | *"Access"* to the learner; *entitlement* in docs | **Refuses *entitlement*** — says *eligibility* and *reaches* | Confines *entitlement* to a non-product disclaimer |

> **A consolidated product needs one record here — and `PM29-19` already contradicts Batch 04's perpetual grant.** Monthly / Quarterly / Yearly is a term, and Batch 04's access record has no place to put one. That is an addition rather than a retraction (Batch 04 shows **no** term anywhere, so there is nothing to unpick), but it is a real shape change.

---

## 4 · Why **PUBLISHED** does not equal **LEARNER-ENTITLED**

> *Published* is a fact recorded on the **central plane** about a piece of content. *Entitled* is a fact about **one person** on the tenant (or personal) plane. **Between them sit six distinct records, three of which have no owner in any batch.**

### The B2B chain

| # | Stage | Record | Owner | Learner impact |
|---|---|---|---|---|
| **1** | Submission reaches `published` | B01 — `sub.status` + `publishedOn` | ✅ **Content Manager** | **NONE** |
| **2** | **Version release** | B05 — `awaiting\|released\|held`; advances `module.live` | ⚪ **Ambiguous — `PQ-01`** | Decides **which build** a learner runs |
| **3** | **Tenant allocation** | 🔴 **NOT DESIGNED ANYWHERE** | 🔵 Super Admin — `PM29-23` | **The single largest hole** |
| **4** | Institution content access | B03 — `{ covers[], status, reference, recorded }` | ⚪ **`recorded` is a date with no actor** | Still **none** |
| **5** | **Eligibility relationship** | B03 — `{ type, ref, added }`. **No actor field** | ⛔ **`PQ-05`** | Without one: *"Not yet reaching learners / No one yet"* |
| **6** | **Academic placement** | B03 — `person.stream` + `person.groups`, from institution data | ERP | **A sync failure severs entitlement** |
| **7** | Derived learner eligibility | B03 — never stored | — | ✅ **Only here does *published* become *this person can see it*** |
| **8** | **Still not runnable** | B01 — `e.dev` + `e.xr` | — | **Entitled ≠ available on a device ≠ completed** |
| **9** | **And possibly not assigned** | The master model's dashed line | ⛔ `PM29-A3` | — |

### The package proves the gap by construction

| Evidence | What it shows |
|---|---|
| Batch 01's README states the learner catalogue is **deliberately independent** of the governance catalogue | The disconnect is a design decision, not an oversight |
| `qa/seed-states/state-end.json` drives the `soil` submission to `published` **v3** — and `S.exps.shear`, the same experiment on the learner side, is **untouched** | **Publishing changes nothing a learner can see** |
| `a_survey` ships with an **empty eligibility array** | The institution **holds** the Surveying content and **no learner can see it** |
| `state-survey-mapped.json` adds **one** relationship → stream `s_civil` | **That single relationship is what makes the experiment appear** |
| `p_sb` Sana Basheer has `stream: null` — an incoming `CIVIL-ENGG-2023` matched no stream | She is eligible for **nothing**, though her institution holds five access records covering six experiments |

### The B2C chain — the same gap, different records

```
published ──▶ OFFERING (B04, with an amount)
              🔴 WHO CREATES AN OFFERING AND SETS ITS AMOUNT IS MODELLED NOWHERE
                   │
                   ▼
              TRANSACTION  checkout → processing → success | failed | pending
                   │
                   └── only on the SUCCESS branch of settleTransaction()
                       is S.access[moduleId] = { via, on, ref } written
                   │
                   ▼
              MY LEARNING
```

`state-payment-failed.json` and `state-payment-pending.json` **both leave `S.access` untouched and `S.seq` unadvanced** — the batch is explicit that *"nothing has been added to your learning"*.

> **On this route too, published content reaches a learner only after a record that no designed surface creates (the offering) and a record that only one code path writes (the access grant).**

---

## 5 · What a consolidated prototype would have to agree on first

**Ordered by cost of getting it wrong. None of this is done by this task.**

| # | Agreement | Blocked by |
|---|---|---|
| 1 | **One experiment record, one id namespace** | `PQ-04(a)` for the noun; the namespace itself is a **design decision** |
| 2 | **One entitlement record** | `PQ-05` · `PM29-19` term · `PQ-02` |
| 3 | **One institution record**, and whether the sample tenant joins the platform list | 🟢 **Design-only** — no PM answer needed |
| 4 | **One progress model** | 🟢 **`PM-09` already resolves it** in Batch 02's favour |
| 5 | **One version scheme**, or an explicit statement that there are two objects | 🟠 `PQ-01`-adjacent |
| 6 | **One technology enum**, one label set, one device sentence per format | 🟢 **Design-only** |
| 7 | **A course ↔ experiment relationship** | 🔴 **No batch has one.** `PM29-17` requires it |
| 8 | **An actor on every access and eligibility record** | `PM29-23` supplies one; `PQ-05` supplies the other |

> **Four of the eight need no PM answer at all.** They are pure reconciliation, and they are the reason Stage 6 exists between the corrections and the merge.

⛔ **No schema, contract, endpoint, payload or field type is proposed by this document.** The entitlement service, its data model and its interfaces all remain pending.
