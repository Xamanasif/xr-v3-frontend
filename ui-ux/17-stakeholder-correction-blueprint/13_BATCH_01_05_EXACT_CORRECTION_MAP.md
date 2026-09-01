# 13 — Batch 01–05 Exact Correction Map

| | |
|---|---|
| **Status** | ✅ **CORRECTION MAP — screen level** |
| **Created** | 31 August 2026 |
| **⛔ Batches 01–05 are READ ONLY.** | **Nothing below is applied to them.** This map says what the **unified build** must do with each screen |
| **Why not applied** | `15_IMPLEMENTATION_BACKLOG_AND_SEQUENCE.md` §1 — **Option B**: preserve the batches untouched and build one corrected unified prototype. Corrections are *carried*, not *patched in place* |

---

## How to read the Action column

| | |
|---|---|
| **KEEP** | Carries forward unchanged. Nothing in the 31 Aug review touches it |
| **KEEP + REWORD** | The behaviour is right; specific copy must change |
| **MODIFY** | Gains or changes a region, a state, a field, or an owner |
| **EXPAND** | Gains a materially larger capability inside the same surface |
| **MERGE** | Two or more batch versions collapse into one canonical screen |
| **REFRAME** | The artefact survives; its **position, priority or framing** changes |
| **SUPERSEDE** | Its **position** is replaced by a surface that does not exist yet. **The artefact is not deleted** |
| **NEW** | No surface exists anywhere. Listed against the batch it attaches to |
| **ALREADY WITHDRAWN** | Removed by an earlier decision. Recorded so its absence reads as scope |

**ID note.** Batch-local IDs are used as each batch ships them. Batch 04's inventory IDs and its prototype screen IDs differ by one position; **the prototype IDs are used here**, matching `ui-ux/16-unified-product-planning/03_UNIFIED_SCREEN_INVENTORY_DRAFT.md`.

---

# Part A · Batch 01 — Content governance + learner XR access

`ui-ux/13-full-platform-design/`

## A.1 KEEP — validated by the 31 Aug review

| Element | Why it holds |
|---|---|
| **Vendor → Academic Reviewer → Content Manager → Published** | `STK31-06` **explicitly re-confirms** the chain and the Content Manager as first-publication owner |
| Changes-required · comments · correction · resubmission at the returning gate | PM-14 — untouched |
| Review history / status traceability | PM-14 — untouched |
| *"Rejected"* is never used; the vendor always sees **who holds** the submission | FRD 1.4.5 expressed positively — untouched |
| No disabled Publish control anywhere in the Vendor workspace | FRD 1.4.5 — and `STK31-03` extends the prohibition to internal submitters |
| Learner XR access — entitlement → compatibility → availability → completion, **mechanism-neutral** | PM-05 · `QT-01` still open **by instruction** |
| **All four format badges — Web · VR · MR · AR** | `STK31-45` — **MR retained.** No badge is removed |
| **`Experiment` as the user-facing term** | `STK31-14` — **Batch 01 is the best-aligned batch** |
| Governance queue · review panel · decision dialog · required reason · history timeline · stage indicator | ▶ **Now the reuse source for tenant-request review and for support issues** |

## A.2 Screen-level corrections

| Screen | Name | Action | What changes | Decision |
|---|---|---|---|---|
| `S01` / `VND-01` | My Submissions | **KEEP** | — | — |
| `S02` / `VND-02` | New Submission | **MODIFY** | **(a)** add **Experiment ↔ Course mapping** · **(b)** add **package OR hosted link by technology** · **(c)** add supported technology / device / runtime information as a first-class field set · **(d)** technical documentation · **(e)** 🔴 **Learning Outcomes do NOT go here** — they belong to the Academic Reviewer | `STK31-46` · `STK31-37` · `STK31-15` · `STK31-08` |
| `S02-edit` / `S02-correction` | Edit draft / Correct submission | **KEEP** | Inherits `S02`'s new fields | — |
| `S03` / `VND-05` | Submission Detail & Status | **KEEP + REWORD** | 🔴 **The four strings that use *"release"* to mean *publish* become *publish***. `Release` is now reserved for the Super Admin version decision | `STK31-06` · `STK31-07` |
| `S04` / `ARV-01` | Review Queue | **MODIFY** | Queue may be **scoped by per-Course / per-Experiment reviewer assignment** | `STK31-41` |
| `S04-history` | Review History | **KEEP** | — | — |
| `S05` / `ARV-02` | Academic Review | **EXPAND** | 🔴 **Learning Outcomes are authored/validated here** — a new region. Rubric remains undefined (`QD-08`) | `STK31-08` |
| `S06` / `CM-01` | Content Review Queue | **MODIFY** | May be scoped by per-Course / per-Experiment Content Manager assignment | `STK31-41` |
| `S06-history` | Reviewed Content | **KEEP** | — | — |
| `S07` / `CM-02` | Content Readiness & Publication | **KEEP + REWORD** | **The boundary is now settled:** this screen performs **FIRST PUBLICATION** and nothing else. Copy must make the firewall explicit — it does **not** release versions | `STK31-06` · `STK31-07` |
| `S10` / `CM-03` | Published Content | **EXPAND** | Becomes the **Content Library** view; gains **canonical content metadata management** | `STK31-06` · `STK31-09` |
| `S11` / `LRN-02` | My Learning | **MERGE** | Canonical My Learning — merges Batch 01, 02, 03, 04 variants | — |
| `S12` / `LRN-04` | Experiment Detail | **MERGE + EXPAND** | Merges with Batch 02 `B07` and Batch 04 `B2C-02`. Gains **Course context**, **Learning Outcomes**, **preview/video**, **technology selection**, and a **public unauthenticated sibling** | `STK31-12` · `STK31-15` · `STK31-17` |
| `S13` / `LRN-15` | XR Device Access | **MODIFY** | Six states preserved. Gains a **technology identity** so progress can be attributed per technology | `STK31-36` |
| `WEB-RUN` | Web simulation placeholder | **KEEP** | Web = **hosted link** model confirmed | `STK31-37` |
| `S14` / `LRN-13` | Progress | **MERGE + MODIFY** | Merges with Batch 02 `B12`. **Batch 02's derived model wins** (PM-09). 🔴 **Gains a per-technology axis** | `STK31-36` |
| ~~`S08`~~ / ~~`SA-02`~~ | ~~Publish Queue~~ | **ALREADY WITHDRAWN** | Withdrawn 25 Aug. **`STK31-06` confirms it stays withdrawn** | PM-16/17/18 · `STK31-06` |
| ~~`S09`~~ / ~~`SA-03`~~ | ~~Publish Experiment~~ | **ALREADY WITHDRAWN** | Same. States absorbed into `S07` | PM-16/17/18 · `STK31-06` |
| `INDEX` | Prototype Index | **PROTOTYPE-ONLY** | Replaced by real authentication + workspace resolution | `STK31-44` |

**Verdict: LOW–MEDIUM. Batch 01 survives the 31 Aug review better than any other batch, and three of its decisions are explicitly confirmed.**

---

# Part B · Batch 02 — Assessment

`ui-ux/13-full-platform-design/batch02-assessment/`

## B.1 KEEP

| Element | Why |
|---|---|
| Assessment Builder — Questions · Settings · Assign; completeness rail | PM-08 · `STK31-30` |
| Question bank spreadsheet upload with **per-row error reporting** | FRD 5.1.1 — ▶ **the reuse source for CSV people import** |
| AI-generated drafts under **mandatory Faculty review** | FRD 5.1.2 · `STK31-33` |
| Question editor | — |
| Configuration-generated learner disclosure | `STK31-30` |
| Learner attempt · review · submit · result · **pending evaluation** | `STK31-31` gives the pending state an owner |
| An Experiment never completes while a result is pending | Preserved |
| A learner never authors, configures, or sees the key | PM-15 · `D-25` — **untouched** |
| Every assessment parameter is **SAMPLE**, not a constant | PM-08 |
| The **timer prompts but never auto-submits** | Preserved; re-confirm once a server exists (`Q-43`) |

## B.2 Screen-level corrections

| Screen | Name | Action | What changes | Decision |
|---|---|---|---|---|
| `B01` | Assessments (list) | **KEEP + REWORD** | 🔴 `Module` → `Experiment` — the heaviest label load in the batch | `STK31-14` |
| `B02-questions` | Builder — Questions | **KEEP + REWORD** | Terminology only | `STK31-14` |
| `B02-settings` | Builder — Settings | **EXPAND** | 🔴 **NEW: the answer/explanation visibility policy** — show immediately / after deadline / custom date. **BITS default is a Taxila-reference placeholder** (`ND-10`) | `STK31-32` |
| `B02-assign` | Builder — Assign | **MODIFY** | **Assignment owner is now settled** — the Tenant Admin owns learner assignment; Faculty assigns assessments to Experiments. Gains **local Course Code** and an **OPTIONAL Semester** slot | `STK31-25` · `STK31-11` |
| `B03` | Assessment Preview (learner view) | **KEEP + REWORD** | Terminology | `STK31-14` |
| `B04` | Question Bank | **EXPAND** | 🔴 **NEW: `Delete` a question** — the requested user-facing action, with a confirmation step; the question leaves the **active** bank and **historical attempts/results are preserved**. `STK31-22` governs the **mechanism** (reversible / soft-delete underneath), **not the label**. Never delete silently from under a live assessment. Import extends to **source material** for AI generation | `STK31-34` · `STK31-33` · `STK31-22` |
| `B05` | Question Editor | **KEEP** | — | — |
| `B06` | AI Question Drafts | **EXPAND** | 🔴 **NEW: upload source document/material as generation input**, alongside the existing prompt. Everything downstream — *AI generated · review required*, edit, discard, accept — is **unchanged** | `STK31-33` |
| *(learner)* | My Learning | **MERGE** | Into the canonical `U-LRN-01` | — |
| `B07` | Module Detail | **MERGE + REWORD** | 🔴 **The same object as Batch 01 `S12`, under a different noun.** Merges; the noun becomes `Experiment` | `STK31-14` |
| `B08` | Assessment Introduction | **KEEP** | The generated disclosure is unchanged | — |
| `B09` | Assessment Attempt | **KEEP** | MCQ · True/False · Descriptive all preserved | `STK31-30` |
| `B10` | Review Answers *(+ submit dialog)* | **KEEP** | — | — |
| `B11` | Result | **MODIFY** | Explanation visibility now follows the **Faculty policy**; pending-evaluation copy can now name the evaluation as **Faculty-owned** without naming a person | `STK31-32` · `STK31-31` |
| `B12` | Progress | **MERGE + MODIFY** | Merges with Batch 01 `S14`. **This derived model wins** (PM-09). 🔴 **Gains a per-technology axis** | `STK31-36` |
| `FAC-11` | Descriptive evaluation queue | 🔴 **NEW — now buildable** | **Was BLOCKED on `QP-02`.** Faculty is the only human evaluator; optional auto-review **assists and is never final** | `STK31-31` |
| — | **Faculty view of tenant Experiments** | 🔴 **NEW** | No Faculty browse surface exists. ▶ Reuse Batch 04's catalogue components | `STK31-29` |
| — | **Faculty student progress / usage** | 🔴 **NEW** | `FAC-05` / `FAC-10` inventoried, never built. **Operational only** — no KPI dashboard | `STK31-29` · `STK31-43` |

**Verdict: MEDIUM–HIGH. The assessment core is untouched and validated; the Faculty workspace around it gains three new surfaces and two settled owners.**

---

# Part C · Batch 03 — Institute / Tenant administration

`ui-ux/13-full-platform-design/batch03-institute-admin/`

> **The batch whose caution paid off most.** Two of its deliberate blanks — the content-access origin actor, and the unclaimed assigner — receive their answers cleanly.

## C.1 KEEP — and now validated

| Element | Why |
|---|---|
| The spine `institution content access → eligibility → learner eligibility → content in My Learning` | ✅ **`STK31-24` validates it** |
| The content-access origin line carrying **a date and no actor** | ✅ **`STK31-24` supplies the actor: Super Admin.** *One line changes; the model does not* |
| No price, packaging noun, seat count or purchase route anywhere | ✅ **Validated by `STK31-27`** |
| SSO: configure → check → **turn on only after a successful test** | ✅ FRD 4.2.2 acceptance criterion · `STK31-44` |
| Institution data: schedule, last run, outcome, counts, errors, retry | ✅ FRD 7.2.1 |
| **Records Needing Attention** | ✅ ▶ **The reuse pattern for CSV import errors and for support attention** |
| Academic structure **view-only**; no course authoring | ✅ FRD 3.4.x Phase 2 · **and `STK31-10` confirms streams are platform-controlled** |
| Learner Access Check proving the handoff | ✅ Unchanged |
| The word *"program"* deliberately avoided | ✅ **Correct then.** The FRD 3.3.1 collision is still recorded; **the stream level itself needs no structural change** |

## C.2 Screen-level corrections

| Screen | Name | Action | What changes | Decision |
|---|---|---|---|---|
| `INA-01` | Overview | **EXPAND** | Gains **subscription/access term** and reflects the **REQUIRED 15-day expiry reminder** *(channel pending, `ND-16`)*. An `Expiring soon` row is **recommended supporting UX**, not a separate requirement; gains CSV-import attention rows | `STK31-28` · `STK31-26` |
| `INA-02` | People | **EXPAND** | 🔴 **Gains provisioning entry points** — *Add a person* and *Import CSV*. Gains student **deactivate/remove** | `STK31-25` |
| `INA-03` | Person Detail | **MODIFY** | 🟢 **Faculty `Source` is now answerable** — the Tenant Admin creates Faculty. Gains **plan/access context**, **local Course Code**, **OPTIONAL Semester**. Gains **provenance** (ERP · CSV · manual) | `STK31-25` · `STK31-26` · `STK31-11` |
| — | **Add a person (manual)** | 🔴 **NEW** | `DA-04` said *"no such control exists"*. It must now exist | `STK31-25` |
| — | **Bulk CSV import** | 🔴 **NEW** | upload → validate → per-row error → commit → outcome. ▶ Reuse **Batch 02's** upload pattern | `STK31-26` |
| — | **CSV import error report** | 🔴 **NEW** | ▶ Reuse **Batch 03's own `Issue Card`** and **Batch 02's per-row report** | `STK31-26` |
| — | **CSV ↔ ERP conflict handling** | 🔴 **NEW** | ⚠ **ERP is authoritative and sync overwrites.** Surface a conflict as a *Record Needing Attention*; **never silently overwrite** | `ND-04` / `QD-01` |
| `INA-04` | Academic Structure | **MODIFY** | Gains **local Course Code / reference**. 🟢 **Batch 03's `Academic stream` IS the confirmed grouping level** — no level is added above it; only the final label is open | `STK31-11` · `STK31-10` · `ND-02` |
| `INA-05` | Stream / Group Detail | **KEEP** | — | — |
| `INA-06` | Content Access | **MODIFY** | 🟢 **Origin gains its actor: Super Admin.** Gains **granted technologies** and the **access term** | `STK31-24` · `STK31-15` · `STK31-28` |
| `INA-07` | Access Detail | **MODIFY** | 🟢 **`DA-07` is CONFIRMED, no longer reversible-pending** — the Tenant Admin is the assignment owner. Assignment carries **technologies** | `STK31-25` · `STK31-15` |
| `INA-08` | Access Mapping | **KEEP + EXPAND** | ▶ **Its two-direction view is the reuse pattern for Super Admin tenant allocation.** Gains a technology dimension | `STK31-24` · `STK31-15` |
| `INA-09` | Institution Setup | **KEEP** | — | — |
| `INA-10` | Single Sign-On | **MODIFY** | Gains the **platform-authentication fallback** where an institution has no SSO | `STK31-44` |
| `INA-11` | Institution Data | **KEEP** | Unchanged; ERP stays the authoritative source | — |
| `INA-12` | Records Needing Attention | **EXPAND** | Absorbs **CSV import failures** and **CSV↔ERP conflicts** | `STK31-26` · `ND-04` |
| `INA-13` | Learner Access Check | **MODIFY** | Gains **which technologies** reach the learner | `STK31-15` |
| — | **Institution reporting** | 🔵 **NEW (small)** | Courses/Experiments delivered · students assigned · groups · completion · outcomes · usage · time spent. **Operational only** | `STK31-43` |

> **Superseded assumption, named explicitly:** any earlier reading that the **Tenant Admin could not be the learner-content assignment owner** is superseded by `STK31-25`.

**Verdict: HIGH. One whole capability area (people provisioning) is added; everything else either holds or receives a value it was built to accept.**

---

# Part D · Batch 04 — B2C learner access

`ui-ux/13-full-platform-design/batch04-b2c-learner-access/`

> **Preserved in full as reusable historical work and as the deferred secondary route.** Nothing is deleted.

## D.1 Reusable — carry forward

| Asset | Why it survives |
|---|---|
| **The access record `{ via, on, ref }` as the single spine** | ✅ **Architectural.** Card state, detail, summary, outcome and My Learning are all functions of it. **A B2B request grants through the same path** |
| Catalogue card — six fields, one action, fixed-height blocks | ✅ **The public catalogue's basis** |
| Grid + four filter controls | ✅ Reusable |
| Module detail page | ✅ **The public Experiment page's basis** |
| Access-state derivation `none` / `some` / `all` | ✅ **A signed-out visitor is the `none` case with a different CTA** |
| Payment outcomes — success · declined · indeterminate | ✅ FRD 9.1.x requires all three |
| **Only success writes** | ✅ Architectural |
| Duplicate access blocked **at the route**, not hidden on the card | ✅ Architectural |
| Access history | ✅ Keep |
| My Learning convergence | ✅ **Where both routes meet** |
| The functional **account menu** | ✅ The only functional one in the corpus — **promote it** |

## D.2 Superseded / reframed

| Screen / position | Action | What changes | Decision |
|---|---|---|---|
| **Authenticated-first Explore** *(position)* | 🔴 **SUPERSEDE** | Public discovery is required. **The position moves; the components do not** | `STK31-16` |
| **B2C-first commercial journey** *(framing)* | 🔵 **REFRAME** | B2C is the **deferred secondary rollout**. Documentation-level change | `STK31-04` |
| **Direct payment before institutional approval** | 🔴 **SUPERSEDE for B2B** | **No external B2B access before Super Admin approval.** The cart is a **selection basket + request preparation** | `STK31-18` · `STK31-20` |
| **`DA-01` direct single-item checkout as the transaction model** | 🔴 **SUPERSEDE as the B2B model** · 🟢 preserved for B2C | A selection/request object is **new**, not a modification of `DA-01` | `STK31-18` |
| **The 3-module Bundle model** | 🔴 **SUPERSEDE** | Replaced by **Programme/Department Bundle → Course sub-bundles → Experiments → Technologies** | `STK31-13` · `STK31-12` |
| **Neutral / no-duration access model** | 🔴 **SUPERSEDE as the current architecture** | Access now carries a **term** (`STK31-28`), and B2C carries **Monthly/Quarterly/Yearly, no Lifetime** (`STK31-05`) | `STK31-28` · `STK31-05` |

## D.3 Screen-level

| Screen | Name | Action | What changes | Decision |
|---|---|---|---|---|
| `B2C-01` | Catalogue / Explore | **REFRAME + EXPAND** | Becomes the **public catalogue**. Gains **Programme/Department** and **Course** levels, a **technology filter**, and the **selection/cart** action | `STK31-16` · `STK31-12` · `STK31-15` · `STK31-18` |
| `B2C-02` | Module detail | **MERGE + EXPAND** | Merges into the canonical Experiment detail; gains **Course context**, **Learning Outcomes**, **preview/video**, **technology selection** | `STK31-17` · `STK31-15` |
| `B2C-03` | Bundle detail | **REFRAME** | The 3-module model is superseded. Becomes the **Programme/Course bundle page**. ⚪ **What carries a price is still open** (`ND-08`) | `STK31-13` |
| `B2C-04` | Access / checkout | **REFRAME** | ▷ **Deferred with B2C.** For B2B it is replaced by the **request** surface — a different object | `STK31-04` · `STK31-18` |
| `B2C-05` | Confirming payment | **KEEP** ▷ deferred | Reused where payment applies on the external B2B route | `STK31-20` |
| `B2C-06` | Access outcome | **KEEP** ▷ deferred | All three FRD 9.1.x outcomes preserved | — |
| `B2C-07` | Access history | **KEEP** | Reusable for tenant access history | — |
| `GUARD-ALREADY-HAVE` | Already-held route guard | **KEEP** | ✅ Architectural | — |
| `GUARD-PARTLY-HELD` | Partly-held bundle guard | ▷ **DEFER** | Downstream of bundle pricing — FRD 6.3.x **Phase 2** | `ND-08` |
| `LRN-02` | My Learning *(individual context)* | **MERGE** | Into the canonical My Learning | `STK31-01` |
| `AUTH-B2C` | Sign in to continue | **SUPERSEDE** | Replaced by real authentication. *"A panel, not a form; collects nothing"* | `STK31-44` |
| `NOT-FOUND` | Not found | **KEEP** | — | — |
| — | **Access period selection** | 🔴 **NEW** ▷ deferred | Monthly · Quarterly · Yearly · **no Lifetime**. No term selector exists anywhere | `STK31-05` |
| 🔴 **Internal inconsistency** | card chip `Module` vs My Learning header `Experiment` | **REWORD** | **The batch disagrees with itself.** Resolved once, to `Experiment`, in the unified build | `STK31-14` |

**Verdict: ARCHITECTURAL for the entry and transaction model; MEDIUM for everything else. No component is wasted.**

---

# Part E · Batch 05 — Super Admin

`ui-ux/13-full-platform-design/batch05-super-admin/`

> **The batch most changed — because the 31 Aug review supplies exactly the source material its audit could not find.**

## E.1 KEEP

| Element | Why |
|---|---|
| `SA-01` Overview foundation | Work-waiting model, no dashboard — PM-11 |
| `SA-02` Institutions · `SA-03` Institution detail | The base that governance actions attach to |
| `SA-04` / `SA-05` **Version release / hold** | ✅ **`STK31-07` CONFIRMS them. No longer provisional or reversible-pending** |
| `SA-06` / `SA-07` Device transfer | ✅ `STK31-38` — unchanged; completes when the learner end is built |
| `SA-08` Licensing visibility, **no seat figure** | ✅ **Validated by `STK31-27`** |
| `SA-09` Platform roles — as a **foundation** | The registry survives; its read-only stance does not |
| `SA-10` Platform configuration **register** | ✅ Zero invented controls. **Keep the pattern platform-wide** |
| The **authority-audit method** | ✅ **The most transferable asset in the batch** |
| *"A gap is shown as a gap, never as a disabled control"* | ✅ **Adopt platform-wide** |

## E.2 Screen-level corrections

| Screen | Name | Action | What changes | Decision |
|---|---|---|---|---|
| `SA-01` | Platform overview | **EXPAND** | Gains attention rows for **tenant requests · content allocations · 15-day expiries · support issues**. ⛔ **Still no dashboard** | `STK31-20` · `STK31-24` · `STK31-28` · `STK31-39` · PM-11 |
| `SA-02` | Institutions | **EXPAND** | 🔴 **Read-only is superseded.** Gains **create · deactivate/terminate**. Prefer reversible status (`STK31-22`) | `STK31-21` · `STK31-22` |
| `SA-03` | Institution detail | **EXPAND materially** | Becomes the **institution profile/report**: Tenant Admin · streams by name · student counts · users by stream · assigned Courses/Experiments · **technology selection** · licence/user quantity · **access term + 15-day state** · usage/completion · issues. ⛔ **No revenue metrics** | `STK31-42` · `STK31-27` · `STK31-28` · `STK31-15` |
| `SA-04` | Module releases | **KEEP + REWORD** | ✅ Confirmed. Reword `Module` → `Experiment` | `STK31-07` · `STK31-14` |
| `SA-05` | Release decision | **KEEP + REWORD** | ✅ Confirmed. **The firewall is now mandatory copy** — this is *release*, never *publish* | `STK31-07` · `STK31-06` |
| `SA-06` | Device replacement requests | **KEEP** | ⚠ The absent decline path stays **shown as a gap** | `STK31-38` |
| `SA-07` | Device request detail | **KEEP** | Completes when `LRN-17` exists | `STK31-38` |
| `SA-08` | Licensing | **EXPAND** | Gains **licence/user quantity from the approved request**, **access term**, and expiry state. 🔴 **No arbitrary caps** | `STK31-27` · `STK31-28` |
| `SA-09` | Platform roles | **EXPAND** | 🔴 **Read-only is superseded.** Gains **assignment/governance** for Vendor · Academic Reviewer · Content Manager, **globally and per Course/Experiment**, with **multiple people per Experiment**. ⚠ The on-screen sentence *"No institutional role can be assigned from here"* stays true for **institutional** roles | `STK31-41` |
| `SA-10` | Platform configuration | **KEEP** | The register pattern is unchanged | — |
| — | **Tenant requests queue** | 🔴 **NEW** | ▶ **Batch 01's queue pattern is a near-exact fit** | `STK31-20` |
| — | **Tenant request decision** | 🔴 **NEW** | Approve / request more information · **required reason** · applicant-visible state · history. ▶ Batch 01's review panel + decision dialog + history timeline | `STK31-20` · `STK31-21` |
| — | **Tenant creation** | 🔴 **NEW** — reverses `R-01` | Outcome of approval | `STK31-21` |
| — | **Tenant Admin assignment** | 🔴 **NEW** — reverses `R-02` | ⚠ Identity **origin** remains `QD-02` — design against an existing identity | `STK31-21` |
| — | **Tenant content + technology allocation** | 🔴 **NEW** | ▶ Reuse **Batch 03 `INA-08`**'s two-direction mapping. **The receiving end already exists** | `STK31-24` · `STK31-15` |
| — | **Vendor / Academic Reviewer / Content Manager administration** | 🔴 **NEW** — reverses `R-03`, `R-04` | Account registry **and** per-content assignment | `STK31-41` |
| — | **Canonical / master metadata management** | 🔴 **NEW** | Shared with the Content Manager. ⚪ Schema open (`ND-05`) | `STK31-09` |
| — | **Support / issue queue and detail** | 🔴 **NEW** | See `12_SUPPORT_AND_OPERATIONS_MODEL.md` | `STK31-39` |
| — | **Student deactivation override** | 🔵 **NEW (small)** | Platform override beside the Tenant Admin's normal control | `STK31-25` |

## E.3 The four refutations reversed — and the four that are NOT

| Refutation | Status |
|---|---|
| `R-01` institution creation / onboarding | 🔴 **REVERSED** — `STK31-21` |
| `R-02` assign the first Institute Admin | 🔴 **REVERSED** — `STK31-21` |
| `R-03` Vendor account administration | 🔴 **REVERSED** — `STK31-41` |
| `R-04` Academic Reviewer administration | 🔴 **REVERSED** — `STK31-41` |
| `R-05` grant/revoke a **learner** entitlement | ✅ **STILL REFUTED** — tenant-plane, `STK31-25` |
| `R-06` assign content **to learners or cohorts** | ✅ **STILL REFUTED** — tenant-plane, `STK31-25` |
| `R-08` / `R-09` institution SSO / ERP configuration | ✅ **STILL REFUTED** — Institute Admin, built in Batch 03 |
| `R-14` unpublish / withdraw content | ✅ **STILL REFUTED** — no source; would contradict `STK31-06` through a side door |

**Verdict: ARCHITECTURAL. Batch 05 was correct on its evidence and is now materially too small. Its own audit structure makes every reopening bounded and traceable.**

---

# Part F · Cross-batch reconciliations that need no decision

**Carried from `ui-ux/16-unified-product-planning/12_POST_PM_IMPLEMENTATION_HANDOFF.md` §1 — twenty-four items, all cheap now and expensive after a merge.** Listed here because the unified build must do them **once**.

| Group | Items |
|---|---|
| **Design system** | Collapse five byte-identical stylesheet copies to one · apply the `--text-3` contrast fix once (4.30:1 → 5.43:1) · apply `--control-border` once (1.84:1 → 3.51:1, **WCAG 2.1 SC 1.4.11**) · restore `[hidden]` · fix `.empty h2` heading order · fix `.tmain`/`.tsub` display · resolve the `.subtle-note` line-height collision · remove Batch 02's `.sample-tag` restyle |
| 🔴 **Accessibility defects** | **Remove the false `aria-haspopup`/`aria-expanded` from three dead account buttons** (B01, B02, B03 tell a screen-reader user a menu exists and open none) · **give Help one consistent location** — **WCAG 2.2 SC 3.2.6 is Level A**, and `STK31-39` now supplies the destination · **one nav landmark label** |
| **Component de-duplication** | One `.tabnav` (B02 and B03 wrote byte-identical ones independently) · one attention list (**adopt B05's** — it carries a per-row `aria-label`) · one state-node row · one label/value pair primitive · **adopt B04's account menu** and **B05's sign-out honesty** · delete four duplicate `openDialog()` copies |
| 🔴 **Data correctness** | **One experiment id namespace** — `shear` (B01/B02) vs `c_shear` (B03/B04/B05) · **fix the `torsion` contradiction** — `MR`/unsupported in four batches, `VR`/runnable in B02 **where the learner completes it** · reconcile diverging experiment names · decide whether the sample tenant joins the platform institution list — **the only fully-designed tenant appears in no Batch-05 list** · **adopt one progress model** (PM-09 already resolves it in Batch 02's favour) |
| **Copy** | 🔴 **`Release`** — B05 firewalled it to mean *not publication*; **B01's shipped copy uses it to mean publish, in four strings**. **`STK31-06`/`STK31-07` make the firewall mandatory — the smaller side changes** · **the `Licence` leak** — B03 and B04 ban the word and verify zero hits; B01 reaches learner copy once |

---

# Part G · Roll-up

| Batch | Verdict | Magnitude | New surfaces it attaches to |
|---|---|---|---|
| **01** Content governance + XR access | ✅ Largely intact; three decisions explicitly confirm it | **LOW–MEDIUM** | 0 |
| **02** Assessment | ✅ Core intact; ⛔→✅ two blockers cleared | **MEDIUM–HIGH** | **3** |
| **03** Tenant administration | ✅ Model validated; 🔴 one capability area added | **HIGH** | **4** |
| **04** B2C learner access | ✅ Components reusable; 🔴 entry + transaction model superseded | **ARCHITECTURAL** | **1** *(deferred)* |
| **05** Super Admin | 🟠 Correct, and materially too small | **ARCHITECTURAL** | **8** |

> **No batch is thrown away and no batch is wrong.** The only screens that stop being current are the two Super Admin publish screens **already withdrawn on 25 August** — and `STK31-06` confirms they stay withdrawn.
