# 02 — Source Precedence and Conflict Register

| | |
|---|---|
| **Status** | 🟠 **ALIGNMENT DOCUMENT — DRAFT.** Records precedence and conflicts; **resolves none of them by reasoning** |
| **Created** | 29 August 2026 |
| **Companion** | `01_PM_2026-08-29_DECISION_EXTRACTION_DRAFT.md` |

---

## 1 · The precedence order for this task

```
1.  Explicit, unambiguous 29 August PM direction
2.  PM_CONFIRMED_UPDATE_2026-08-25       (PM-16 · PM-17 · PM-18)
3.  PM_CONFIRMED_BASELINE_2026-08-18     (PM-01 … PM-12)
    + 13_PM_CLOSURE_DECISIONS            (PM-13 · PM-14 · PM-15)
4.  FRD v5 consolidated set               (Core · TL · Detailed)
    over source/Platform FRD_v4.pdf       (read-only, never edited)
5.  Review 006                            (12-full-platform-reframe)
6.  Existing prototype design assumptions (Batches 01–05, DA-nn)
```

### The rule that governs everything below

> **If the 29 August discussion is ambiguous, it does NOT overwrite an earlier explicit PM decision.**
> **The ambiguity is recorded instead.**

This is not caution for its own sake. The 18 / 19 / 25 August captures were each reviewed as a set and each states its own authority rule. A noisy transcript cannot outrank one of them, because the thing that made them authoritative — clarity — is exactly what is missing.

### Two corollaries, applied consistently

| Corollary | Why |
|---|---|
| **An omission is not a decision.** A format, role or capability the PM did not mention on 29 August is **not thereby removed** | Spoken lists are lossy. `PM29-14` omits MR; MR is not dropped |
| **A rejection is not a replacement.** Rejecting an interpretation does not establish the alternative | `PM29-A2` — the PM rejected "bundle = arbitrary group of three" and named no replacement |

---

## 2 · Where levels 2 and 3 already disagree with level 4

**These predate 29 August. They are listed because a consolidation must not silently re-inherit the FRD side of any of them.**

| # | Point | FRD says | PM says | Standing |
|---|---|---|---|---|
| **P-1** | **Who publishes content** | **1.4.4** — *"Only the Super Admin shall have permission to publish approved modules to the production environment"* | **PM-16/17/18** — the **Content Manager** is the publication owner and performs the final Publish | 🔴 **PM wins.** FRD unedited. Restated in **20+ places** across the source set — see Batch 05 `O-01` |
| **P-2** | **Certification in Phase 1** | **3.3.1 / 3.3.2** — Phase 1 | **PM-12** — Phase 2 | 🔴 **PM wins.** Design working set = 76 + 2 deferred |
| **P-3** | **Number of roles** | **8.1** — five roles | **PM-07** — seven, adding Vendor and Academic Reviewer | 🟠 **PM extends.** FRD 8.3 (custom roles) is Phase 3 and cannot justify it |
| **P-4** | **Reject / resubmit path** | 1.4.1–1.4.4 are **forward-only** | **PM-14** — approve / request changes / comment / correct / resubmit / review history | 🟠 **PM extends** |
| **P-5** | **SSO phase** | **4.2.2** Phase 1 vs **7.4.1** Phase 3 | **PM-10** — required, Phase 1 | ✅ **PM resolves an internal FRD contradiction** |
| **P-6** | **Assessment values** | The FRD states **no** count, duration, weighting, pass mark or attempt limit | **PM-08** — configurable; earlier values are sample only | ✅ **Alignment** |

---

## 3 · New conflicts created or sharpened on 29 August

### 3.1 Against earlier PM decisions

| # | 29 Aug item | Against | Nature | Standing after this document |
|---|---|---|---|---|
| **N-1** | `PM29-05` B2B primary / B2C secondary | **PM-04** — explicit prohibition on that sequencing | 🔴 Direct reversal of a prohibition | **Partially resolved.** *Focus* → 29 Aug wins. *Phase-1 scope of B2C* → **OPEN**; the PM did not say B2C leaves Phase 1, and PM-04 + FRD 1.1.3 are not overridden by silence |
| **N-2** | `PM29-11` Faculty *"analytics"* | **PM-11** — no analytics dashboards; metrics pending | 🟠 Wording tension | **Unresolved. No metric is defined.** Read as PM-11 operational status pending read-back |
| **N-3** | `PM29-A1` version release wording | **PM-16/17/18** + **FRD 2.3.2** | 🔴 Ambiguous on both sides | **NOT resolved.** CM publication stands; SA version release stands; the question goes to Monday |
| **N-4** | `PM29-22` Super Admin role governance (write) | Batch 05 `DA-04` read-only; **`QD-02`** open | 🔴 Design position too conservative | **Recorded.** Authority directional; **mechanism still undefined**, so no control is designed |
| **N-5** | `PM29-22` tenant + Tenant Admin authority | Batch 05 `R-01`, `R-02` (refuted) | 🔴 Refutations no longer safe | **REFUTED → OPEN**, actor pending (`PM29-A4`) |
| **N-6** | `PM29-24` Vendor / Reviewer governance | Batch 05 `R-03`, `R-04` (refuted) | 🔴 Refutations no longer safe | **REFUTED → OPEN**, scope pending |

> **Not a conflict, stated so it is not assumed:** `PM29-23` does **not** reverse Batch 05 `R-05` (grant/revoke a *learner* entitlement) or `R-06` (assign courses/modules *to learners or cohorts*). The PM spoke about **tenants**. Tenant-level allocation and learner-level assignment are different objects; FRD 8.1.3 and 8.1.4 assign the learner-level ones elsewhere.

### 3.2 Against the FRD

| # | 29 Aug item | FRD position | Nature |
|---|---|---|---|
| **F-1** | `PM29-02` public pre-login browsing | **No requirement describes it.** FLOW 3 is register → browse | 🟣 **EXTENSION** |
| **F-2** | `PM29-13` **"PROGRAM"** as a hierarchy level | The FRD's only Phase-1 *program* is **certification program** (3.3.1), **deferred by PM-12**. No generic academic-programme level exists | 🟣 **CONFLICT — terminology collision.** Batch 03 avoided the word for exactly this reason |
| **F-3** | `PM29-14` technologies = AR / VR / Web-WebGL | The FRD defines **four** Phase-1 formats: Web 1.2.1, VR 1.2.2, **MR 1.2.3**, AR 1.2.4 | 🟣 **OMISSION — not read as removal.** MR retained |
| **F-4** | `PM29-13` technology as a **hierarchy level** | Format is a **property of the module** (1.2.x), not a child node | 🟣 **EXTENSION**, coupled to `PM29-18` |
| **F-5** | `PM29-10` CSV people import | Only spreadsheet upload in the FRD is **5.1.1 question banks**. People arrive by **ERP** (7.2.2) | 🟣 **EXTENSION** — adds two provisioning routes |
| **F-6** | `PM29-19` Monthly / Quarterly / Yearly | 6.1.1/6.1.2 are **purchase**; **9.3.2 subscription billing is Phase 2** | 🟣 **PHASE CONFLICT** |
| **F-7** | `PM29-08` free institutional branch | **6.2.1** — *"Institutions shall purchase packages…"*; no free route | 🟣 **EXTENSION** |
| **F-8** | `PM29-25` mandatory learner metadata | **No person schema exists anywhere.** *Semester* appears once, in a **Phase-2** version-locking line. No course-code field exists | 🟣 **EXTENSION** — and `QD-07` (no metadata schema) has been open since Review 006 |
| **F-9** | `PM29-07` tenant approval / rejection states | **4.2.1** has no approval, rejection, pending or SLA behaviour | 🟣 **EXTENSION** |

---

## 4 · What must NOT be treated as settled

**Requirement-safety checklist for this blueprint.** Every row is verified absent from the deliverables in this folder.

| # | Must remain visibly pending | Verified |
|---|---|---|
| 1 | Bundle definition | ✅ `PM29-A2`, `PQ-02` |
| 2 | Super Admin final version-release ownership | ✅ `PM29-A1`, `PQ-01` |
| 3 | Final B2C approval flow | ✅ `PM29-A5`, `PQ-07` |
| 4 | Final B2B approval actor | ✅ `PM29-A4`, `PQ-03` |
| 5 | The paid / free institution classification rule | ✅ `PM29-08`, `PQ-11` |
| 6 | Seat model | ✅ `PM29-20` — *confirmed absent*, `OQ-03` open |
| 7 | CSV schema | ✅ `PM29-25`, `PQ-10` |
| 8 | Technology-specific pricing | ✅ `PM29-18`, `PQ-08` |
| 9 | Learner-assignment actor | ✅ `PM29-A3`, `PQ-05` |
| 10 | Tenant Admin vs Institute Admin label — **and the reading that they are one role** | ✅ `PM29-09` *(directional, not read back)*, `PQ-09` |
| 11 | Student vs Learner terminology | ✅ `PM29-A8`, `PQ-12` |
| 12 | Internal BITS tenant topology | ✅ `PM29-A7`, `PQ-11` |

---

## 5 · Source-reading record

| Source | Read | Modified | Note |
|---|---|---|---|
| `source/Platform FRD_v4.pdf` | ✅ metadata only — **17 pages** confirmed | ❌ | Text extraction unavailable (§5.1). Its content reaches this blueprint through the v5 consolidation, which preserves all 131 original requirements with faithful wording |
| `requirements/updated-frd/Core frd.pdf` · `.docx` | ✅ | ❌ | |
| `requirements/updated-frd/TL frd.pdf` · `.docx` | ✅ | ❌ | |
| `requirements/updated-frd/Detailed frd.pdf` · `.docx` | ✅ | ❌ | Used for exact traceability |
| `Platform_FRD_v5_OPEN_QUESTIONS.md` · `_CHANGE_SUMMARY.md` | ✅ | ❌ | |
| `ui-ux/00-project-context/` — all three | ✅ | ❌ | |
| `ui-ux/12-full-platform-reframe/` — all thirteen | ✅ | ❌ | |
| Batches 01 – 05 | ✅ | ❌ | **READ ONLY in this task** |

### 5.1 PDF extraction — what was actually done

**No PDF text tooling is available in this environment** (`pdftotext`, `pdfinfo`, `pypdf`, `PyPDF2`, `pymupdf` all absent). A direct zlib walk of the PDF content streams recovers only glyph indices, because the documents embed **subset fonts with custom encodings** — the parenthesised strings are not readable text.

**The DOCX companions were therefore used, as the task permits — after verifying correspondence:**

| Check | Core | TL | Detailed |
|---|---|---|---|
| PDF page count, measured from `/Type /Page` objects | **30** | **11** | **147** |
| Page count the DOCX declares for that document | **30** | **11** | **147** |
| Version header in the DOCX | *"Consolidated Updated Draft — Version 5.0"*, dated **19 August 2026** | | |

**Three-for-three page-count agreement plus a matching version header** establishes that the `.docx` files are the same v5 documents as the `.pdf` files. Every FRD quotation in this blueprint is traceable to the extracted DOCX text.

---

## 6 · Traceability of the FRD claims made in this blueprint

Each row was verified by direct search of the extracted v5 text, not recalled.

| Claim | Verification |
|---|---|
| No public / unauthenticated catalogue requirement exists | Searched *anonymous · unauthenticated · public catalogue · visitor*. Only hit: a note that a **pre-login role choice** is DESIGN-PENDING. FLOW 3 orders register (①) before browse (②) |
| *Program* has one Phase-1 meaning: certification program | Every non-*programming* hit for *program* is either *certification program* or the project's own *programme* as an organisation. No generic academic-programme node |
| *Semester* has no learner-record basis | Two hits total: **2.19x Academic Version Locking** (Phase 2), and one analytics question about cohort performance |
| No course code / course ID field exists | Searched *course code · course id*. **Zero hits** |
| The only spreadsheet upload is question banks | Searched *csv · bulk · spreadsheet*. All hits are **5.1.1** Faculty question banks |
| Bundle carries no cardinality | Glossary: *"Bundle — A purchasable group of simulation modules (FRD 6.1.2)."* No count anywhere |
| Four Phase-1 XR formats | 1.2.1 Web · 1.2.2 VR · **1.2.3 MR** · 1.2.4 AR, with 2.1.2 defining the MR sideloaded application |
| FRD 4.2.1 names no approver | Statement subject is *"Institutions shall register their organization"*; acceptance criterion names no role; Roles column lists Institute Admin and Super Admin — a listing, not a grant |
| Cart is DESIGN-PENDING, not required | v5 accuracy corrections name *"a cart-free checkout"* among three inherited positions wrongly presented as requirements |

---

## 7 · Terminology conflict evidence — measured, not assumed

The Module-vs-Experiment question (`PM29-16`) is not hypothetical. **The five batches already disagree with each other in user-visible copy.** Counted directly in the prototype sources:

| Batch | Role focus | `Experiment` | `Module` | Dominant term in product copy |
|---|---|---|---|---|
| **01** | Vendor · Reviewer · CM · Learner XR | **11** | 0 | **Experiment** |
| **02** | Faculty · Learner assessment | 0 | **61** | **Module** |
| **03** | Institute Admin | **1** *(+26 lowercase)* | 0 | **Experiment** |
| **04** | B2C learner | 3 | **23** | **Mixed — inconsistent within one batch** |
| **05** | Super Admin | 0 | **9** | **Module** |

*(Capitalised occurrences, which are label positions; lowercase prose counts show the same split.)*

**Batch 04 is internally inconsistent**: its catalogue card chip reads **`Module`**, while its My Learning table header reads **`Experiment`** and its caption reads *"Experiments you have access to"*.

> **This is a real, shipped inconsistency that a consolidation would expose immediately.** It is the strongest practical argument for settling `PM29-16` on Monday — and it is why the terminology audit in `05_CONTENT_HIERARCHY_AND_CATALOGUE_MODEL.md` §4 is classified **SAFE NOW**: the audit costs nothing and the rename cannot begin without the answer.
