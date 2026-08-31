# 07 — Public Experiment Detail: Content Model

| | |
|---|---|
| **Status** | 🟠 **CONTENT PLANNING — DRAFT.** An inventory of facts and where each already lives. **No copy, no CTA, no price** |
| **Created** | 29 August 2026 |
| **Authorised by** | `11_SAFE_WORK_BEFORE_MONDAY.md` **S7** — *"Public experiment detail — content inventory … an audit of existing content"* |
| **The finding** | **Ten of twelve content regions already exist somewhere in the built work. Two do not. One is blocked.** Assembling this page is largely **re-composition, not new design** |

`PUB-05` · route `/experiment/<id>` · 🔴 **CONFIRMED MISSING as a public surface** — gap `A4`
**Nearest existing:** Batch 04 `B2C-02` **Module detail** (`#/module/<id>`) — authenticated, and the closest thing in the corpus.

---

## 1 · Why the PM asked for this page

> `PM29-02`: *public visitor → … → opens an experiment → **understands what it is** → only then performs login / request / access actions.*

The page's job is **comprehension before commitment**. Every region below is judged against that job — which is also why the access region can stay a slot without the page failing.

---

## 2 · The content inventory

`PM29-03` listed: description · learning outcomes · preview/video · supported technology · device/runtime requirement · relevant access information. **Read as a "may include" list, because that is how it was given** — not as a final content specification.

| # | Region | Exists today? | Where | Verdict |
|---|---|---|---|---|
| **E1** | **Experiment title / identity** | ✅ | All five batches | **KEEP** |
| **E2** | **Course context** | 🟠 **Partly** | Batch 03 academic structure (tenant-side); Batch 02 module↔assessment context | **NEW LINK** — no public course↔experiment surface exists |
| **E3** | **Description / summary** | ✅ | Batch 04 `.ph-lede` + `.cc-sum`; Batch 01 submission metadata | **KEEP** |
| **E4** | **Learning outcomes** | 🔴 **NO** | **No surface anywhere in any batch** | 🔴 **CONFIRMED MISSING** — gap `A5` |
| **E5** | **Preview / video** | 🔴 **NO** | No surface. Batch 04 lists videos as *contents*, never plays one | 🔴 **MISSING** + ⚠ **coupled to `QX-03`** |
| **E6** | **Technology availability** | ✅ | Batch 01 `XR Format Badge` (4 formats); Batch 04 `fmtBadges` | **KEEP** — rendering **R1** |
| **E7** | **Device / runtime requirement** | ✅ | Batch 01 `Device Compatibility`; Batch 04 device line | **KEEP** |
| **E8** | **Learning experience summary** — what is inside | ✅ | Batch 04 `.incl` / `.incl-row`: *one XR simulation · readings · videos · an assessment where present* | **KEEP** |
| **E9** | **Discipline** ⟦S1⟧ | ✅ | Batch 04 catalogue + detail facts | **KEEP** |
| **E10** | **Access state** | ✅ | Batch 04 `none` / `some` / `all`, derived | **KEEP — architectural** |
| **E11** | **⟦ACCESS ACTION⟧** | 🟠 Region exists | Batch 04 `.accesspanel` | ⛔ **ACTION PENDING PM CONFIRMATION** |
| **E12** | **Price / amount** | 🟠 Region exists | Batch 04 `.ap-amt` | ⛔ **`PM29-04` — not shown** |

**Ten reusable. Two genuinely new (E4, E5). One blocked (E11). One suppressed (E12).**

---

## 3 · The two genuinely new regions

### 3.1 `E4` — Learning outcomes 🔴

| | |
|---|---|
| Exists in any batch? | **No. Zero surfaces.** |
| Exists in the FRD? | **No field.** FRD 3.1.2 lists a module's optional parts — *theoretical explanations · simulation instructions · assessment* — and **outcomes are not among them** |
| Who authors them? | ⚪ **Not stated.** The Vendor submits metadata (1.4.1); the metadata schema has been unenumerated since Review 006 (`QD-07`) |
| Where would they attach? | **Batch 01's `VND-02`/`VND-04` submission metadata** — which is already labelled **SAMPLE** for exactly this reason |
| Structural shape | A short list. Nothing more is knowable |

> **This is the one region on the page that is new content, not new layout.** It needs a source before it needs a design: someone must produce learning outcomes, and no role currently owns doing so. That is a real, small, answerable question and it is **not** on the Monday list — it should be added. See §7.

### 3.2 `E5` — Preview / video 🔴 ⚠

| | |
|---|---|
| Exists in any batch? | **No player anywhere.** Batch 04 counts videos as *contents*; it never renders one |
| The accessibility exposure | ⚠ **`QX-03` — who owns captions, transcripts and audio description — is HIGH and OPEN** |
| Why it is sharper now | `PM29-03` puts video on a **public** page. A public video with no captions is an exposure **before** anyone has signed in or agreed to anything |
| Safe planning | The **region**, its position, and a **placeholder**. ⛔ **No player, no autoplay, no source, no control set** |

> **Raise this before it is built, not after.** `11_SAFE_WORK_BEFORE_MONDAY.md` S7 identified exactly this dependency and it has not moved. A caption obligation discovered after a public launch is an incident; discovered now it is a line item.

---

## 4 · Region layout — planned, and inherited

**Batch 04's two-column detail layout transfers wholesale**, and its responsive behaviour is the part worth keeping most:

```
┌───────────────────────────────────────────┬────────────────────────┐
│  .phero                                   │  .accesspanel  STICKY  │
│   E1 title · E9 discipline                │   E10 access state     │
│   E6 technology badges (R1)               │   E12 ⛔ amount region  │
│   E3 lede — capped at 62 chars/line       │   E11 ⛔ ACTION PENDING │
│   E7 device / runtime facts               │       PM CONFIRMATION  │
│                                           │   ⟦R3 technology       │
│  E2 course context           ← NEW LINK   │    selector — only     │
│  E4 learning outcomes        ← 🔴 NEW      │    under PQ-08(B)⟧     │
│  E5 preview / video          ← 🔴 NEW ⚠    │                        │
│  E8 what is included  (.incl — 4 callers) │                        │
└───────────────────────────────────────────┴────────────────────────┘
                 ≤1040px → one column, panel moves ABOVE the body
```

**The `order:-1` behaviour is not a style choice.** Batch 04 established it so the access decision is not buried below a long body on a narrow viewport. It should survive whatever `E11` turns out to be.

**`.incl` is the highest-value single component on this page.** Batch 04 built it with **one component and four callers** — module contents, bundle contents, access summary, outcome list — *"which is what keeps the promise identical from catalogue to confirmation."* On a public page it gains a fifth caller and keeps that property.

---

## 5 · The access region, in detail

⛔ **ACCESS ACTION — PM DECISION PENDING**

### 5.1 What each pending model would require

| Model | New objects | New states | New screens | Existing reuse |
|---|---|---|---|---|
| **Add to request list** | A **request list**; a **request** with a submitted state | list-has-items · submitted · under review · authorised · ⚪ rejected? | List view · review/submit step · applicant status view | Batch 01 queue + decision + reason + history — **near-exact** |
| **Add to cart → checkout** | A **cart** | cart-has-items · multi-item summary | Cart view · multi-item checkout | Batch 04 checkout — but `DA-01` is single-item; this is the reversal it named |
| **Get access / Subscribe** *(individual)* | A **period** on the access record | period selected · renewal? · expiry? | Period selector | Batch 04 `B2C-04/05/06` **entire path** |
| **Request access** *(plain enquiry)* | **None** — the request names nothing | submitted only | Application form only | Batch 01 metadata group + validation summary |
| **Sign in to continue** | None | None | None | Batch 04 `AUTH-B2C` handoff — built, minimal, collects nothing |

> **The cheapest answer is *plain enquiry*; the most expensive is *cart*.** They differ by a cart object, a multi-item state model and a checkout surface. That is why `PQ-06` gates this page's primary button and why guessing it is the single most expensive guess available in this planning phase.

### 5.2 What is safely planned about it regardless

| Safe | Why |
|---|---|
| **One region, one primary action** | True under all five models |
| Its **position** — right rail wide, above body narrow | Batch 04, proven, and independent of the verb |
| **Access state derives**, never stored on the offering | Batch 04 architectural finding; `some` *"falls out of the model"* rather than being coded |
| A signed-out visitor renders the **`none` case** | `07_B2C_SECONDARY_JOURNEY.md` §4 states it explicitly |
| The region can hold an amount **and today holds none** | `PM29-04` |
| Duplicate access is blocked **at the route**, not hidden on the card | Batch 04 architectural finding — survives every model |

---

## 6 · What the page must not do

| Prohibited | Source |
|---|---|
| Show a price, amount, currency or "from ₹X" | `PM29-04` |
| Name the access verb | `PQ-06` |
| Say *Module*, or rename anything to *Experiment*, in a **batch** artefact | `PQ-04` — planning vocabulary only |
| Offer a technology **choice** | `PQ-08` — R3 renders only under reading B |
| Say *WebGL* | Appears in no source |
| Claim how an experiment reaches a device | `PM-05` · `QT-01` — copy stays mechanism-neutral |
| Drop MR | `PM29-A10` — an omission is not a removal |
| Show a rating, review, enrolment count, popularity or "new" flag | Invented data — Batch 04's own rule |
| Show a certificate or credential | Certification is Phase 2 — PM-12 |
| Promise a duration | `D-24` — not "lifetime", not "one-time", not a term |
| Show assessment settings | Configuration-driven (PM-08); **who configures for a pure-B2C learner is deferred by PM-15** |

---

## 7 · Questions this document surfaces that are **not yet on the Monday list**

**Recorded, not asked — the question list is owned by `12_PM_CLARIFICATIONS_FOR_MONDAY.md` and is not edited by this task.**

| # | Question | Why it appears now |
|---|---|---|
| **N-1** | **Who authors learning outcomes, and where do they enter the platform?** | `PM29-03` requires them on a public page; **no batch has a surface, no FRD field exists, and no role owns producing them.** Nearest attachment is Batch 01's submission metadata, already SAMPLE (`QD-07`) |
| **N-2** | **Does a public course page show a course code at all?** | `PM29-15` says the code *"may vary by institution"*, and a public page has no institution. Either a canonical code exists or the public page shows none — `PQ-10` asks the schema, not this |
| **N-3** | **Is a Course an access unit?** | `PM29-23`'s allocation unit is open (experiment / course / package) and `QP-28` leaves course purchase unspecified. The course page's action region is **double-blocked**, which no single existing question captures |

> These are **candidates for the next question list**, not additions to the current one. `13_CONSOLIDATION_SEQUENCE.md` Stage 2 owns register updates.
