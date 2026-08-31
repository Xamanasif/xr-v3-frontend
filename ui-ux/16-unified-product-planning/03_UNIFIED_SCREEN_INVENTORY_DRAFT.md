# 03 — Unified Screen Inventory (DRAFT)

| | |
|---|---|
| **Status** | 🟠 **DRAFT INVENTORY.** A rationalisation of what exists plus what is provably absent. **Not a build backlog** |
| **Created** | 29 August 2026 |
| **Not** | The formal Phase-1 gap audit. That is **Stage 4**, and it runs **after** Stage 3 corrections — *"an audit run before corrections measures the wrong thing and has to be redone"* |
| **Count** | **89 draft screens.** Derived, not targeted — see §Method |
| **Draft ID scheme** | `U-<AREA>-nn`. **Provisional.** Stage 6 reconciles batch-local IDs (`INA-nn`, `S01`, `B2C-nn`, `SA-nn`) against the stable Review-006 inventory |

## Status legend

| | |
|---|---|
| **EXISTING — KEEP** | Built. Carries forward as-is |
| **EXISTING — MODIFY** | Built. Gains or changes something |
| **EXISTING — MERGE** | Two or more built versions collapse into one |
| **NEW — CONFIRMED MISSING** | Provably absent, and **no PM answer is needed to know that** |
| **NEW — LIKELY** | Directionally required; the exact surface depends on an open answer |
| **BLOCKED BY PM** | Cannot be scoped until a named question is answered |
| **LATER** | Deferred by a PM decision or FRD phasing |
| **SUPERSEDED** | A position replaced by a surface that does not exist yet. **The artefact survives** |

## Method

> **The number is a result, not a goal.** `89` is what you get by taking the **71 product screens** already built, collapsing the **8 MERGE rows into 3**, and adding the surfaces the alignment blueprint proves are absent. No row exists to reach a figure, and **no attempt was made to approach the Review-006 figure of 104** — that inventory counts a different thing, at a different altitude, and reconciling the two is Stage 6 work.

---

# A · PUBLIC

| Draft ID | Screen | Role / context | Purpose | Existing reusable source | Status |
|---|---|---|---|---|---|
| `U-PUB-01` | **Landing** | Visitor | What this platform is; the way into the catalogue and the two entries | 🔴 none · header + badges from **B01** | **NEW — CONFIRMED MISSING** ⚠ *value-proposition copy does not exist* |
| `U-PUB-02` | **Catalogue** | Visitor | Browse, search, filter published content | **B04 `B2C-01`** — card, grid, filter bar, 5 of 7 states | **EXISTING — MODIFY** *(position + CTA)* |
| `U-PUB-03` | **Course detail** | Visitor | A course, its code, and the experiments it holds | 🔴 **no course page in any batch** | **NEW — CONFIRMED MISSING** |
| `U-PUB-04` | **Experiment detail (public)** | Visitor | Understand an experiment **before** any access action | **B04 `B2C-02`** + **B01 `S12`** — 10 of 12 regions exist | **EXISTING — MODIFY** *(+ outcomes, preview, course context)* |
| `U-PUB-05` | **Entry fork — Institution / Individual** | Visitor | Choose a context | 🔴 none · **no inventory ID exists** | **NEW — CONFIRMED MISSING** |
| `U-PUB-06` | **Grouping browse** ⟦S1⟧ | Visitor | Browse by Discipline *(today)* | **B04** filter state | **NEW — LIKELY** *(a filter state today, a page later)* |

---

# B · AUTHENTICATION AND ENTRY

> **The quietest and most consequential section.** Every batch used a clearly-labelled non-product index instead of authentication — correct for a per-flow prototype, **impossible for a product**. A public catalogue makes it urgent: the public route's first action is *sign in / register / apply*, and **none of those three destinations exists**.
> ⛔ **Analysis and IA are safe; the build is not.** Auth *routing* intersects five open questions — `S9`.

| Draft ID | Screen | Role / context | Purpose | Existing reusable source | Status |
|---|---|---|---|---|---|
| `U-AUTH-01` | **Sign in** | All | One front door | 🔴 none · form grammar from **B01** | **NEW — CONFIRMED MISSING** *(`AUTH-01`)* |
| `U-AUTH-02` | **SSO redirect / return** | Institutional | The learner-facing half of institutional sign-in | **B03 `INA-10`** configures it; **the sign-in path is not built** | **NEW — CONFIRMED MISSING** *(`AUTH-02`)* ⚠ `QT-04` collision |
| `U-AUTH-03` | **Register** | Individual | Self-registration by e-mail or social provider | **B04 `AUTH-B2C`** — *a panel, not a form; collects nothing* | **NEW — CONFIRMED MISSING** *(`AUTH-03`)* |
| `U-AUTH-04` | **Password reset** | All | Recovery | 🔴 none · **no FRD requirement** — design-supplied | **NEW — CONFIRMED MISSING** *(`AUTH-05`)* |
| `U-AUTH-05` | **Session expired** | All | Re-entry without loss | Pattern exists from Review 005; not rebuilt on the platform shell | **NEW — LIKELY** *(`AUTH-06`)* |
| `U-AUTH-06` | **Workspace resolution** | All | Seven roles, one front door | 🔴 none | **NEW — CONFIRMED MISSING** *(`AUTH-08`)* — **structural** |
| `U-AUTH-07` | **Workspace chooser** | Multi-role | Only if multi-role identities exist | 🔴 none | **NEW — LIKELY** *(`AUTH-09` · `QP-11`)* — *costs nothing if not* |
| `U-AUTH-08` | **Institution application form** | Institution visitor | Organisation + SPOC, and submit | 🔴 **`AUTH-10` — inventoried NEW at P3 since Review 006, never built.** Form grammar + `Metadata Group` from **B01** | **NEW — CONFIRMED MISSING** ⚠ fields beyond org + SPOC not stated |
| `U-AUTH-09` | **Applicant status view** | Applicant | See that it was received, and its state | **B01** `Status Badge` + `Empty State` | **NEW — LIKELY** ⚠ **the state set is not stated** |
| `U-AUTH-10` | ~~Sign in to continue *(B2C handoff)*~~ | Individual | — | **B04 `AUTH-B2C`** | **SUPERSEDED** by `U-AUTH-01`. *The artefact is not deleted* |

---

# C · PLATFORM — Super Admin

| Draft ID | Screen | Purpose | Existing source | Status |
|---|---|---|---|---|
| `U-SA-01` | **Platform overview** | What needs a decision from me | **B05 `SA-01`** | **EXISTING — MODIFY** *(+ request and allocation rows)* ⛔ still no dashboard — `PM-11` |
| `U-SA-02` | **Institutions** | The cross-tenant list | **B05 `SA-02`** | **EXISTING — MODIFY** *(read-only is now too conservative — `PM29-22`)* |
| `U-SA-03` | **Institution detail** | Inside exactly one institution | **B05 `SA-03`** | **EXISTING — MODIFY** *(same)* |
| `U-SA-04` | **Tenant requests queue** | Applications awaiting a decision | **B01 queue pattern — near-exact fit** | 🔴 **BLOCKED BY PM** — `PQ-03`. *Exists only if the approver is in-product* |
| `U-SA-05` | **Tenant request decision** | Approve / request more information, with a reason | **B01 review panel + decision dialog + history** | 🔴 **BLOCKED BY PM** — `PQ-03` |
| `U-SA-06` | **Tenant content allocation** | Which experiments this tenant receives | **B03 `INA-08`** two-direction mapping view · **the receiving end already exists** | **NEW — CONFIRMED MISSING** ⚠ **allocation unit open** — only the structural shell is plannable |
| `U-SA-07` | **Version releases** | Versions awaiting a release decision | **B05 `SA-04`** | **EXISTING — KEEP** ⚪ pending `PQ-01` |
| `U-SA-08` | **Release decision** | Release or hold a version | **B05 `SA-05`** | **EXISTING — KEEP** ⚪ pending `PQ-01` · `QP-26` |
| `U-SA-09` | **Device replacement requests** | The approval queue | **B05 `SA-06`** | **EXISTING — KEEP** ⚠ **no decline path exists — stated as a gap** |
| `U-SA-10` | **Device request detail** | Approve a transfer | **B05 `SA-07`** | **EXISTING — KEEP** 🟠 *completes only when `U-LRN-11` exists* |
| `U-SA-11` | **Licensing / access visibility** | Access records as they stand | **B05 `SA-08`** | **EXISTING — KEEP** ✅ **no seat figure — validated by `PM29-20`** |
| `U-SA-12` | **Platform roles** | Who holds which platform role | **B05 `SA-09`** | **EXISTING — MODIFY** *(authority)* · ⛔ **write blocked on `QD-02` mechanism** |
| `U-SA-13` | **Platform configuration** | The register — zero invented controls | **B05 `SA-10`** | **EXISTING — KEEP** |
| `U-SA-14` | **Vendor / Academic Reviewer administration** | Account or per-content governance | **B05 `SA-09`** names the gap | 🔴 **BLOCKED BY PM** — `PQ-15`. *Global? per course? per experiment?* |

---

# D · PLATFORM — Content governance

**The most intact block in the corpus. Nothing on 29 August changes the chain's shape.**

| Draft ID | Screen | Role | Existing source | Status |
|---|---|---|---|---|
| `U-VND-01` | My Submissions | Vendor | **B01 `S01`** | **EXISTING — KEEP** |
| `U-VND-02` | New Submission | Vendor | **B01 `S02`** | **EXISTING — MODIFY** *(+ experiment↔course mapping `PM29-17`; candidate home for learning outcomes)* |
| `U-VND-03` | Edit draft / Correct submission | Vendor | **B01 `S02-edit`** | **EXISTING — KEEP** |
| `U-VND-04` | Submission detail & status | Vendor | **B01 `S03`** | **EXISTING — KEEP** — 9 states |
| `U-ARV-01` | Review queue | Academic Reviewer | **B01 `S04`** | **EXISTING — KEEP** |
| `U-ARV-02` | Review history | Academic Reviewer | **B01 `S04-history`** | **EXISTING — KEEP** |
| `U-ARV-03` | Academic review | Academic Reviewer | **B01 `S05`** | **EXISTING — KEEP** ⚠ rubric undefined — `QD-08` |
| `U-CM-01` | Content review queue | Content Manager | **B01 `S06`** | **EXISTING — KEEP** |
| `U-CM-02` | Reviewed content | Content Manager | **B01 `S06-history`** | **EXISTING — KEEP** |
| `U-CM-03` | Content readiness & publication | Content Manager | **B01 `S07`** | **EXISTING — KEEP** ⚪ version-release boundary may move — `PQ-01` |
| `U-CM-04` | Published content | Content Manager | **B01 `S10`** | **EXISTING — KEEP** ⚠ `DA-06` **REVERSIBLE** |

---

# E · TENANT — Institute / Tenant Admin

⚠ **Role label pending `PQ-09`.** Every row below carries it.

| Draft ID | Screen | Existing source | Status |
|---|---|---|---|
| `U-TA-01` | Institution overview | **B03 `INA-01`** | **EXISTING — KEEP** |
| `U-TA-02` | People | **B03 `INA-02`** | **EXISTING — MODIFY** *(+ provisioning entry points)* |
| `U-TA-03` | Person detail | **B03 `INA-03`** | **EXISTING — MODIFY** *(Faculty origin now answerable)* |
| `U-TA-04` | **Add a person (manual)** | 🔴 **B03 `DA-04`: no such control exists.** Form grammar from **B01** | **NEW — CONFIRMED MISSING** — `PM29-10` |
| `U-TA-05` | **Bulk CSV import** | 🔴 none · **B01 `File Upload`** + **B02 upload → per-row validation → commit** | **NEW — CONFIRMED MISSING** ⛔ **schema blocked — `PQ-10`** |
| `U-TA-06` | **CSV import error report** | **B02 `Upload Report`** + **B03 `Issue Card`** — *both near-exact* | **NEW — CONFIRMED MISSING** ⚠ **`QD-01` CSV↔ERP write conflict is now reachable** |
| `U-TA-07` | Academic structure | **B03 `INA-04`** | **EXISTING — MODIFY** *(+ Course ID/Code — no such field exists in any source)* |
| `U-TA-08` | Stream / group detail | **B03 `INA-05`** | **EXISTING — KEEP** |
| `U-TA-09` | Content access | **B03 `INA-06`** | **EXISTING — MODIFY** 🟢 *origin actor supplied by `PM29-23` — **one line changes*** |
| `U-TA-10` | Content access detail | **B03 `INA-07`** | **EXISTING — MODIFY** ⚠ eligibility editor is `DA-07` **REVERSIBLE** |
| `U-TA-11` | Access mapping | **B03 `INA-08`** | **EXISTING — KEEP** ▶ *its two-direction view feeds `U-SA-06`* |
| `U-TA-12` | Institution setup | **B03 `INA-09`** | **EXISTING — KEEP** |
| `U-TA-13` | Single sign-on | **B03 `INA-10`** | **EXISTING — KEEP** — 4 states, ordering is a confirmed acceptance criterion |
| `U-TA-14` | Institution data | **B03 `INA-11`** | **EXISTING — KEEP** ⚠ `DA-15` *Run now* reversible |
| `U-TA-15` | Records needing attention | **B03 `INA-12`** | **EXISTING — KEEP** |
| `U-TA-16` | **Learner assignment** | **B03 `INA-07`** editor holds meanwhile | 🔴 **BLOCKED BY PM** — `PQ-05`. *Determines which workspace gets the surface* |

---

# F · TENANT — Faculty

| Draft ID | Screen | Existing source | Status |
|---|---|---|---|
| `U-FAC-01` | **Experiments available to the tenant** | 🔴 **no Faculty browse surface exists.** `FAC-02`/`FAC-03` inventoried, never built. **B04 catalogue is the reuse candidate** | **NEW — CONFIRMED MISSING** — `PM29-11` |
| `U-FAC-02` | Assessments list | **B02 `B01`** | **EXISTING — KEEP** |
| `U-FAC-03` | Builder — Questions | **B02 `B02-questions`** | **EXISTING — KEEP** |
| `U-FAC-04` | Builder — Settings | **B02 `B02-settings`** | **EXISTING — KEEP** |
| `U-FAC-05` | Builder — Assign | **B02 `B02-assign`** | **EXISTING — MODIFY** ⚠ `PQ-05` owner · `PQ-10` course/semester |
| `U-FAC-06` | Assessment preview (learner view) | **B02 `B03`** | **EXISTING — KEEP** |
| `U-FAC-07` | Question bank | **B02 `B04`** | **EXISTING — KEEP** ▶ *its upload pattern feeds `U-TA-05`* |
| `U-FAC-08` | Question editor | **B02 `B05`** | **EXISTING — KEEP** |
| `U-FAC-09` | AI question drafts | **B02 `B06`** | **EXISTING — KEEP** |
| `U-FAC-10` | **Student progress / usage** | `FAC-05`/`FAC-10` inventoried, not built | **NEW — LIKELY** ⛔ *"analytics"* **blocked — `PQ-14`, no metric invented** |
| `U-FAC-11` | **Descriptive evaluation queue** | 🔴 **not designed anywhere** | 🔴 **BLOCKED BY PM** — **`QP-02` HIGH.** *The only open item that can strand a learner* |

---

# G · LEARNER — the shared core

**Identical for both routes. `PM-09` approved. Nothing on 29 August changes it.**

| Draft ID | Screen | Existing source | Status |
|---|---|---|---|
| `U-LRN-01` | **My Learning** | **B01 `S11`** · **B02** · **B03 `INA-13`** · **B04 `LRN-02`** | **EXISTING — MERGE** *(cluster D1 — 4→1)* ▶ **the convergence point** |
| `U-LRN-02` | **Experiment detail** | **B01 `S12`** · **B02 `B07`** · **B04 `B2C-02`/`LRN-04b`** | **EXISTING — MERGE** *(cluster D2 — 3→1)* 🔴 **the Module/Experiment split lives here** |
| `U-LRN-03` | XR device access | **B01 `S13`** | **EXISTING — KEEP** — 6 states, mechanism-neutral |
| `U-LRN-04` | Web simulation runtime | **B01 `WEB-RUN`** placeholder · `LRN-08` KEEP-from-Review-005 | **EXISTING — KEEP** |
| `U-LRN-05` | Assessment introduction | **B02 `B08`** | **EXISTING — KEEP** — **the generated disclosure** |
| `U-LRN-06` | Assessment attempt | **B02 `B09`** | **EXISTING — KEEP** |
| `U-LRN-07` | Review answers *(+ submit dialog)* | **B02 `B10`** + `LRN-11` | **EXISTING — KEEP** |
| `U-LRN-08` | Result | **B02 `B11`** | **EXISTING — KEEP** — incl. **result pending evaluation** |
| `U-LRN-09` | **Progress** | **B01 `S14`** · **B02 `B12`** | **EXISTING — MERGE** *(cluster D3 — 2→1)* |
| `U-LRN-10` | **Device binding** | 🔴 none | **NEW — CONFIRMED MISSING** — `LRN-16` · FRD 2.4.1 |
| `U-LRN-11` | **Device replacement request** | 🔴 none · 🟠 **the approval end exists** — **B05 `SA-07`** | **NEW — CONFIRMED MISSING** — `LRN-17` · FRD 2.4.2. **A half-built cross-plane workflow** |

---

# H · INDIVIDUAL (B2C)

**Secondary rollout. Preserved in full — nothing deleted.**

| Draft ID | Screen | Existing source | Status |
|---|---|---|---|
| `U-IND-01` | **Access period selection** | 🔴 **no term selector exists anywhere** | **NEW — LIKELY** — `PM29-19` Monthly · Quarterly · Yearly · **no Lifetime**. ⚪ renewal/expiry undefined |
| `U-IND-02` | **Access summary / checkout** | **B04 `B2C-04`** — summary, account block, provider-neutral payment step | 🔴 **BLOCKED BY PM** — `PQ-06`, `PQ-07`. *The components are reusable; the transaction is not designable* |
| `U-IND-03` | Confirming payment | **B04 `B2C-05`** | **EXISTING — KEEP** — determinate, nothing added yet |
| `U-IND-04` | Access outcome | **B04 `B2C-06`** | **EXISTING — KEEP** — **all three FRD 9.1.x outcomes** |
| `U-IND-05` | Access history | **B04 `B2C-07`** | **EXISTING — KEEP** ⚠ `DA-07` reversible |
| `U-IND-06` | Already-held route guard | **B04 `GUARD-ALREADY-HAVE`** | **EXISTING — KEEP** ✅ **architectural** |
| `U-IND-07` | Bundle detail | **B04 `B2C-03`** | **LATER** ⛔ `PQ-02` — *preserved intact* |
| `U-IND-08` | Partly-held bundle guard | **B04 `GUARD-PARTLY-HELD`** | **LATER** ⛔ `PQ-02` · `Q-45` |

---

# I · CROSS-CUTTING

| Draft ID | Screen | Existing source | Status |
|---|---|---|---|
| `U-X-01` | Not found | **B04 `NOT-FOUND`** · **B05** three not-found states share one pattern | **EXISTING — KEEP** |
| `U-X-02` | Error state | **B01 `STATE-03`** grammar | **EXISTING — KEEP** |

---

# Roll-up

| Status | Count |
|---|---:|
| **EXISTING — KEEP** | **42** |
| **EXISTING — MODIFY** | **13** |
| **EXISTING — MERGE** | **3** *(from 8 built screens)* |
| **NEW — CONFIRMED MISSING** | **16** |
| **NEW — LIKELY** | **6** |
| **BLOCKED BY PM** | **6** |
| **LATER** | **2** |
| **SUPERSEDED** | **1** |
| **Total** | **89** |

## By area

| Area | Screens | Of which new or blocked |
|---|---:|---:|
| A · Public | 6 | **4** |
| B · Authentication & entry | 10 | **9** |
| C · Platform — Super Admin | 14 | **4** |
| D · Platform — Content governance | 11 | **0** |
| E · Tenant — Admin | 16 | **4** |
| F · Tenant — Faculty | 11 | **3** |
| G · Learner core | 11 | **2** |
| H · Individual | 8 | **3** |
| I · Cross-cutting | 2 | 0 |

## What the shape says

- **58 of 89 (65%) already exist in some form.** The product is two-thirds built and one-third unrouted.
- **Areas D and G — content governance and the learner core — are 100% built.** Twenty-two screens, zero new, zero blocked. *"The learning core is finished. The governance chain is finished."*
- **Area B is 9 new out of 10.** Authentication is the largest single hole, it is not controversial, it is blocked by nothing conceptually — and it sits **directly in the path of the highest-priority new journey**.
- **Only 6 screens are BLOCKED BY PM** — but they are load-bearing: two are the entire tenant-approval workspace, one is the B2B transaction, one is learner assignment, one is Vendor/Reviewer governance, and one can strand a learner mid-progression.
- **The public area is small.** Four new screens plus two modifications. The IA work is larger than the screen count, because the *journey* moves, not the components.

## PM-blocking tag

**Per the brief, any screen depending on Bundle · version-release ownership · tenant approval actor · tenant-content allocation action · Tenant Admin vs Faculty assignment · cart vs request list · B2C pre-payment approval · technology-specific pricing · seat model · internal BITS topology · role terminology · CSV final schema is tagged BLOCKED BY PM — unless only its structural shell can safely be planned.**

Four screens fall in that exception and are tagged **NEW — CONFIRMED MISSING** rather than **BLOCKED**, with the blocked part named in place:

| Screen | Shell that is safe | Part that is blocked |
|---|---|---|
| `U-SA-06` Tenant content allocation | A two-direction mapping view; **the receiving end already exists** in `U-TA-09` | ⛔ the **allocation unit** |
| `U-TA-05` Bulk CSV import | upload → validate → per-row error → commit → outcome | ⛔ the **columns** (`PQ-10`) — *a mandatory-field list is a validation contract* |
| `U-TA-06` CSV import error report | The per-row error pattern, proven twice | ⛔ which fields can be wrong |
| `U-PUB-04` Experiment detail | Ten of twelve content regions | ⛔ the **access action** (`PQ-06`) and the **price** (`PM29-04`) |

**Everything else that touches an open item is tagged BLOCKED, LATER, or carries its blocker inline.** No screen silently assumes an answer.
