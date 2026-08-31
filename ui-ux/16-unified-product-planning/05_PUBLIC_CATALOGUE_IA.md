# 05 — Public Catalogue Information Architecture

| | |
|---|---|
| **Status** | 🟠 **IA PLANNING — DRAFT.** Structure only. **No CTA is chosen, no price is shown, no term is renamed** |
| **Created** | 29 August 2026 |
| **Authorised by** | `15-post-pm-alignment/11_SAFE_WORK_BEFORE_MONDAY.md` **S6** — *"the IA of a public catalogue … is safe; the CTA is not"* |
| **Governing rule** | Every level below is either **high-confidence PM direction** or **already built and proven**. Anything else is drawn as a **slot**, not a level |

---

## 1 · The safe spine

This is the only part of the public architecture that holds under **every** plausible Monday answer.

```
PUBLIC (unauthenticated)
   │
   ├── LANDING
   │
   ├── CATALOGUE ................................ browse + search + filter
   │      │
   │      ├── ⟦GROUPING SLOT⟧ .................... see §3 — Discipline today
   │      │
   │      ├── COURSE ............................ name · code ⚪ · its experiments
   │      │      │
   │      │      └── EXPERIMENT .................. the learning unit
   │      │
   │      └── EXPERIMENT (reachable directly) .... the catalogue is flat-addressable
   │
   └── EXPERIMENT DETAIL ......................... the page PM29-03 describes
          │
          └── ⟦ACCESS ACTION SLOT⟧ ............... ⛔ PM DECISION PENDING — PQ-06
```

**Two entry contexts hang off the access action, not off the catalogue** — see `06_PUBLIC_CATALOGUE_SCREEN_MODEL.md` §7 and `12_POST_PM_IMPLEMENTATION_HANDOFF.md`.

### Why `Course → Experiment` is the load-bearing pair

`05_CONTENT_HIERARCHY_AND_CATALOGUE_MODEL.md` §1 establishes it precisely:

> *"The high-confidence part of the PM's hierarchy is `Course → Experiment`. Under the reading Experiment ≡ Module, that is the FRD's own model (3.2.1 + 3.1.1), reinforced by `PM29-17`. **The level above and the level below are both unresolved.**"*

So this IA builds the pair as a **level**, and both neighbours as **slots**.

---

## 2 · The three slots, and why each is a slot rather than a level

| # | Slot | Why it is not a level yet | Blocked by |
|---|---|---|---|
| **S1** | **Grouping** above Course | *Programme* collides with FRD 3.3.1 *certification program*, which **PM-12 deferred to Phase 2**. Batch 03 refused the word deliberately | `PQ-04(b)` |
| **S2** | **Technology** below Experiment | Technology is a **property** in the FRD (1.2.1–1.2.4) and a **level** in `PM29-13`. The two shapes differ | `PQ-08` · `PM29-A11` |
| **S3** | **Access action** on the detail page | *Add to cart* / *Add to request* / *Request access* / *Sign in to continue* imply four different products | `PQ-06` · `PM29-A6` |

> **A slot is not a gap.** Each slot has a defined shape, a defined set of candidate fillings, and a defined consequence per filling. That is what makes the IA answer-proof rather than merely incomplete.

---

## 3 · Slot S1 — the grouping level

### What exists today

| Term | Where | Status |
|---|---|---|
| **Discipline** | Batch 04 catalogue filter — 25 occurrences; derived from the catalogue, never a fixed list | ✅ **Built and proven** |
| **Academic stream** | Batch 03 — 252 occurrences; FRD 7.2.3 | ✅ Built, but **tenant-side**, not catalogue-side |
| **Programme** | 2 occurrences in the whole corpus, both incidental | 🔴 **Not built anywhere** |
| **Category** | **0 occurrences.** Used nowhere in any batch | 🔴 Not built |

### The slot's shape

```
CATALOGUE
   └── grouped by ⟦G⟧          where ⟦G⟧ is a browse dimension over experiments,
                                derived from content, not authored as an object
```

### What fills it under each Monday answer

| If `PQ-04(b)` resolves to… | ⟦G⟧ becomes | IA change | Screen change |
|---|---|---|---|
| **A browse grouping only** *(no content object)* | **Discipline** — unchanged | **None** | **None.** Batch 04's filter already is this |
| **An academic programme** *(B.Tech Civil)* | A **new content object** above Course | Adds one level; Discipline survives beside it as a facet | A programme landing page; one breadcrumb level |
| **The same thing as Academic stream** | Stream, surfaced publicly | **None structurally** — but a **tenant** concept becomes public, which needs its own check | Naming only |
| **The deferred certification program** | ⛔ Nothing — **PM-12 reversal** | Out of Phase 1 | None; escalate instead |

> **Interim position, and it costs nothing:** use **Discipline**. It exists, it is proven, it is derived rather than authored, and it is the one filling that is a subset of all three viable answers. `05_CONTENT_HIERARCHY_AND_CATALOGUE_MODEL.md` §4 recommends exactly this — *"Use `Discipline` — it exists and is proven. Treat *category* as browse-only, not a content object."*

**⛔ Do not introduce the word *Programme* into any public surface before `PQ-04`.**

---

## 4 · Slot S2 — technology, designed so both readings fit

**This is the most important structural decision in this document**, because `PQ-08` is the one open answer that could otherwise force the IA to be rebuilt.

### The two readings

| | **A · Technology as a property** *(today)* | **B · Technology as a selectable variant** |
|---|---|---|
| Model | An experiment **is** a VR experiment | An experiment **has** AR, VR and Web implementations |
| Catalogue | A badge, and a filter facet | A badge, a filter facet, **and a choosable thing** |
| Detail page | An availability **fact** | An availability **choice** |
| Access record | Carries the experiment | Carries the experiment **+ the chosen technology** |
| Commercial | No consequence | **Direct** — `PM29-18`, `PQ-08` |
| Built in | Batches 01, 03, 04 — format badges | 🔴 Nowhere |

### The construction that survives both

Model technology **once**, as an ordered **availability set on the experiment**:

```
EXPERIMENT
   └── availability : [ { technology, deviceRequirement, runtimeNote } , … ]
```

Then bind **three independent renderings** to that one set:

| Rendering | Reading A | Reading B | Where |
|---|---|---|---|
| **R1 · Badge row** | ✅ renders | ✅ renders | Catalogue card · detail kicker |
| **R2 · Filter facet** | ✅ *"experiments that run on X"* | ✅ *"variants available in X"* | Catalogue filter bar |
| **R3 · Selection control** | **not rendered** | **rendered**, and feeds the access action | Detail page, beside ⟦ACCESS ACTION⟧ |

**Under reading A, R3 is simply absent.** No level is added, no route changes, no breadcrumb changes, nothing is removed later. Under reading B, R3 appears in a slot that already exists on the page and attaches to an access action that is itself still a slot.

> **This is why technology must not be drawn as a hierarchy level now.** A level implies a route (`/experiment/x/vr`) and a breadcrumb depth. A property with three renderings implies neither — and can *become* a level later without invalidating any route that exists in the meantime. Drawing the level first cannot be undone the same way.

### MR is retained

**Four formats, not three.** Batch 01 designs all four badges and all four device-compatibility states. `PM29-14`'s omission of MR from a spoken list is not a removal — `02_SOURCE_PRECEDENCE_AND_CONFLICTS.md` corollary: *"An omission is not a decision."* The availability set therefore admits **Web · VR · MR · AR**. → `PQ-13`

**⛔ Do not write *WebGL* in any product surface.** It appears in no source; the FRD says *"standard web environments"*.

---

## 5 · Slot S3 — the access action

**⛔ ACCESS ACTION — PM DECISION PENDING (`PQ-06` · `PM29-A6`)**

The detail page reserves **one region** for it. The region's position, size and prominence can be planned; its verb, its object and its destination cannot.

| Candidate | What it would require the platform to be | What it would add |
|---|---|---|
| **Add to request list** *(strong candidate, not confirmed)* | An institution collects **intent** for approval | A request-list object · a request state · a submit step · an applicant-visible status. **A different object from a cart** |
| **Add to cart → checkout** | An institution **transacts directly** | A cart surface · a cart state · a multi-item summary. ⚠ The PM **explicitly said B2B may not behave this way** |
| **Get access / Subscribe** *(individual)* | A person buys directly | Batch 04's built path — plus a **period selector** (`PM29-19`) that does not exist yet |
| **Request access** *(plain enquiry)* | The FRD 4.2.1 shape — names nothing specific | An application form only. **No selection object at all** |
| **Sign in to continue** | The action is deferred past authentication | Batch 04's `AUTH-B2C` handoff — already built, minimal |

**Interim rendering for any wireframe or planning artefact:**

```
┌──────────────────────────────────────────────┐
│  ACCESS                                      │
│  ⛔ ACTION PENDING PM CONFIRMATION            │
│  PQ-06 · PM29-A6                             │
│  Four candidate models — see 05 §5            │
└──────────────────────────────────────────────┘
```

> **What can safely be planned about it anyway:** its **position** (right rail on wide, above the body below 1040px — Batch 04's proven `order:-1` behaviour), the fact that it is **one region with one primary action**, and that **access state derives** rather than being stored (Batch 04's `none` / `some` / `all`). A signed-out visitor is simply the `none` case with a different verb.

---

## 6 · Pricing

**⛔ Not modelled anywhere in this IA.** `PM29-04` — *"do NOT yet invent"*.

| | |
|---|---|
| Public price visibility | ⚪ **OPEN** — `PQ-16` |
| Technology-specific pricing | ⚪ **OPEN** — `PQ-08` |
| Institutional transaction | ⚪ **OPEN** — `QP-04` |
| Bundle as a priced object | ⚪ **OPEN** — `PQ-02` |

The detail page's access region **may or may not** contain an amount. It is drawn as a region that can hold one, and does not.

---

## 7 · Bundle

**⛔ The word is not used in this IA.**

`PM29-A2` — the PM rejected *"an arbitrary group of three modules"* and **named no replacement**. `02_SOURCE_PRECEDENCE_AND_CONFLICTS.md` corollary: *"A rejection is not a replacement."*

| | |
|---|---|
| Does the catalogue have a Bundle filter? | **No.** Batch 04's *Type* filter (`Modules and bundles` / `Modules only` / `Bundles only`) is **not carried forward** |
| Does the catalogue have a Bundle card? | **No** |
| Is Batch 04's bundle work discarded? | ❌ **No.** It is preserved intact and classified **DEFER** — see `01_EXISTING_SCREEN_REUSE_MAP.md` |
| What happens if `PQ-02` defines one? | A card kind and a filter value are **added** to structures that already accept both. Batch 04 proves the pattern |

> The task brief is explicit: *"Do NOT force Module/Bundle filters from Batch 04. Bundle definition remains OPEN."* This IA complies by carrying forward Batch 04's **card and filter machinery** while carrying forward **neither of its two product-kind values as a required filter**.

---

## 8 · Terminology inside this IA

**Nothing is renamed.** `PQ-04(a)` is unanswered.

| This document says | Because |
|---|---|
| **Experiment** | It is the PM's own word on 29 August, and Batch 01 — the best-aligned batch — uses it 107 times against 5 for *Module* |
| **Course** | ✅ No conflict. Stable in every source |
| **Discipline** | Built, proven, and neutral between all viable `PQ-04(b)` answers |
| **Technology** *(availability)* | The PM's word; kept as a **property** per §4 |

> ⚠ **This is a planning vocabulary, not a rename.** Batches 01–05 are untouched and still say what they said. The corpus-wide count stands at **Module 614 · Experiment 204** — see `10_DUPLICATION_AND_TERMINOLOGY_AUDIT.md`. The rename happens **once**, after `PQ-04`, at Stage 6 of the consolidation sequence.

---

## 9 · What a signed-out visitor sees — depth

⚪ **OPEN — `OQ-05`.** `PM29-02` confirms visitors browse; **it does not say how deeply.**

| Depth | Status |
|---|---|
| Catalogue listing · card facts | 🔵 Confirmed by `PM29-02` |
| Course page | 🔵 Confirmed by `PM29-02`, `PM29-13` |
| Experiment detail — the `PM29-03` fact set | 🔵 Confirmed by `PM29-03` |
| Preview / video **playback** | 🟠 Confirmed as **present**; ⚠ **couples to `QX-03`** — caption / transcript ownership is **HIGH and open**. *A public video with no captions is an accessibility exposure* |
| Learning **resources** themselves (PDFs, videos) | ⚪ **Not stated.** Not modelled |
| Simulation | ⛔ **No.** Entitlement-gated — Batch 01 |
| Assessment | ⛔ **No** |

Batch 04's `DA-02` already covers browse depth and is labelled **reversible**. Nothing here closes it.

---

## 10 · Routes — planning shape only

**Not final. No router is written.** Recorded so `12_POST_PM_IMPLEMENTATION_HANDOFF.md` has something to attach to.

| Surface | Planning route | Existing analogue |
|---|---|---|
| Landing | `/` | 🔴 none |
| Catalogue | `/catalogue` | Batch 04 `#/explore` — **direct reuse** |
| Grouping view ⟦S1⟧ | `/catalogue?discipline=…` | Batch 04 filter state — **direct reuse** |
| Course | `/course/<id>` | 🔴 none — **no course page exists in any batch** |
| Experiment detail | `/experiment/<id>` | Batch 04 `#/module/<id>` — **structural reuse** |
| Entry fork | `/get-started` | 🔴 none |
| Sign in | `/sign-in` | Batch 04 `#/sign-in[/<id>]` — **handoff only, not a real screen** |

> **Query-parameter filtering rather than path segments for ⟦S1⟧ is deliberate.** It keeps the grouping a facet until `PQ-04` says otherwise, and promoting a facet to a path is additive; demoting a path to a facet breaks links.

---

## 11 · What this IA deliberately does not contain

| Absent | Why |
|---|---|
| A chosen CTA verb | `PQ-06` — four candidates, four different products |
| Any price, amount or currency | `PM29-04` |
| A *Programme* browse level | `PQ-04(b)` — collides with PM-12-deferred certification |
| Technology as a route segment | `PQ-08` — a level cannot be demoted to a property without breaking routes |
| A Bundle object, card kind or filter | `PQ-02` |
| A cart or a request list | `PQ-06` — **they are different objects, not variants** |
| A period / term selector | `PM29-19` confirmed as a **set**; the surface is B2C-secondary and unbuilt |
| Sign-in / register / apply screens | `AUTH-01`/`03`/`10` — auth **routing** intersects five open questions (`S9`) |
| A tenant-side catalogue for Faculty | `PM29-11` — reuse is mapped in `02`, the surface is not designed |
| Marketing copy, claims, testimonials, counts | **Nothing is invented.** See `06` §2 |
