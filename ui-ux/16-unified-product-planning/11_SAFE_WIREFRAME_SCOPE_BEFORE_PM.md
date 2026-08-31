# 11 — Safe Wireframe Scope Before PM

| | |
|---|---|
| **Status** | 🟠 **STRUCTURAL WIREFRAMES — DRAFT.** ASCII only. **No HTML, no CSS, no JS, no styling, no prototype** |
| **Created** | 29 August 2026 |
| **The question** | Can low-fidelity wireframes safely be created **before** Monday? |
| **The answer** | **Yes — for five surfaces, at structure level only**, provided every unresolved control is drawn as a **pending region** rather than a button |

---

## 1 · The test, and how these pass it

`11_SAFE_WORK_BEFORE_MONDAY.md` sets it: *would this work product still be correct under **every** plausible Monday answer?*

| Requirement | How these wireframes satisfy it |
|---|---|
| Independent of the twelve open items | Every open item appears as a **named pending region**, never as a resolved control |
| Does not modify Batches 01–05 | **Nothing outside this directory is touched** |
| Survives every answer without rework | Regions **move contents**, not positions. A pending region that gains a button does not change the layout around it |

**And `S6` authorises exactly this scope:**

> *"The IA of a public catalogue: browse groupings, course page, experiment page, and which facts an experiment page carries. **Assembling the information structure does not require knowing the CTA.**"*
> ⛔ *"The CTA is NOT safe."* · ⛔ *"Pricing visibility is NOT safe."*

## 2 · Scope

| # | Surface | Wireframe? | Why |
|---|---|---|---|
| 1 | **Public landing** | ✅ **Yes** | Regions are knowable; **L2 value-proposition copy is left visibly blank** |
| 2 | **Catalogue** | ✅ **Yes** | Batch 04 proves the structure; only position and CTA move |
| 3 | **Course detail** | ✅ **Yes** | `Course → Experiment` is the high-confidence spine |
| 4 | **Experiment detail** | ✅ **Yes** | 10 of 12 regions already exist somewhere |
| 5 | **Institution vs Individual entry** | ✅ **Yes** — **the fork only** | `PM29-06` is clear that the fork exists |
| — | Sign in · register · application form | ❌ **No** | Auth **routing** intersects five open questions — `S9`/`W17` |
| — | Any transaction, cart or request list | ❌ **No** | `PQ-06` · `N10` |
| — | Bundle | ❌ **No** | `PQ-02` |
| — | Period selector | ❌ **No** | B2C is secondary; renewal and expiry are undefined |

**Rendering rule for every unresolved control:**

```
┌────────────────────────────────────┐
│  ⛔ ACTION PENDING PM CONFIRMATION  │
│     PQ-xx · what it would decide   │
└────────────────────────────────────┘
```

---

# W1 · Public landing — `/`

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [LOGO] │ XR Simulation Learning Platform          Catalogue   Sign in  ⛔    │  L1 ✅ reusable
└──────────────────────────────────────────────────────────────────────────────┘   header from B01
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │  ⛔ L2 · WHAT THIS PLATFORM IS — COPY DOES NOT EXIST                  │  │
│   │     No source contains a value proposition, statistic or claim.      │  │
│   │     The REGION is planned. The SENTENCE is not written.              │  │
│   │     ▶ This is a copy task for the PM or the business.                │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│   ┌────────────────────────────┐  ┌────────────────────────────┐            │
│   │  L7 · FOR INSTITUTIONS     │  │  L8 · FOR INDIVIDUALS      │            │  PM29-06 🔵
│   │  ▶ primary                 │  │  ▷ secondary               │            │  🔴 not built
│   │  ⛔ destination pending     │  │  ⛔ destination pending     │            │
│   └────────────────────────────┘  └────────────────────────────┘            │
│                                                                              │
│   L3 · BROWSE XR LEARNING CONTENT ──────────────────────────────▶ /catalogue │  PM29-02 🔵
│                                                                              │
│   L4 · ⟦S1 GROUPING STRIP⟧   Discipline today · ⚪ Programme? PQ-04           │  derived from
│   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                               │  content, never
│   │ Civil  │ │ Mech.  │ │ Elec.  │ │  …     │  ← derived, NEVER a fixed list │  a fixed list
│   └────────┘ └────────┘ └────────┘ └────────┘                               │
│                                                                              │
│   L5 · COURSES IN THE CATALOGUE                                              │  🟠 "featured"
│   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                           │  implies a
│   │ course card │ │ course card │ │ course card │  ← NOT "featured":         │  curation rule
│   └─────────────┘ └─────────────┘ └─────────────┘    no curation rule exists │  no source defines
│                                                                              │
│   L6 · RUNS ON    [Web] [VR] [MR] [AR]   ← all FOUR · MR retained (PQ-13)    │  ✅ B01 badges
│                                                                              │
│   ⛔ NO PRICE, NO PLAN, NO "FROM ₹X" ANYWHERE — PM29-04                       │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

# W2 · Catalogue — `/catalogue`

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [LOGO] │ XR Simulation Learning Platform          Catalogue   Sign in  ⛔    │
└──────────────────────────────────────────────────────────────────────────────┘
  Catalogue                                                    ← content breadcrumb,
                                                                 NOT a workspace path
┌──────────────────────────────────────────────────────────────────────────────┐
│  FILTER BAR ─ every control has a VISIBLE LABEL, not a placeholder ✅ B04     │
│  ┌────────────────────┐ ┌──────────────┐ ┌──────────────┐ ┌───────────────┐ │
│  │ SEARCH             │ │ ⟦S1⟧         │ │ TECHNOLOGY   │ │ ⟦kind⟧        │ │
│  │                    │ │ Discipline   │ │ Web VR MR AR │ │ EMPTY today   │ │
│  └────────────────────┘ └──────────────┘ └──────────────┘ └───────────────┘ │
│  ⛔ NO "Modules / Bundles" TYPE FILTER — PQ-02 · brief §9                     │
│  ──────────────────────────────────────────────────────────────────────────  │
│  N items of M      [× Civil Engineering] [× VR]          Clear filters       │  removable pills,
└──────────────────────────────────────────────────────────────────────────────┘  each with an
                                                                                  aria-label ✅ B04
┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐
│ [Course]           │ │ [Experiment] ⚠     │ │ [Experiment] ⚠     │  ⚠ the kind chip's
│                    │ │                    │ │                    │    WORD is frozen
│ TITLE              │ │ TITLE              │ │ TITLE              │    until PQ-04
│ discipline         │ │ discipline         │ │ discipline         │  ← fixed-height
│ ──────────────────  │ │ ──────────────────  │ │ ──────────────────  │    block (70px) so
│ one-line summary   │ │ one-line summary   │ │ one-line summary   │    rows line up ✅
│                    │ │                    │ │                    │
│ [⬡ 6 experiments]  │ │ [VR]  device line  │ │ [Web] device line  │  ← .cc-count reused
│ [VR][Web]          │ │                    │ │                    │    from B04's bundle
│ ──────────────────  │ │ ──────────────────  │ │ ──────────────────  │    "3 modules" slot
│ ⛔ ACTION PENDING   │ │ ⛔ ACTION PENDING   │ │ ⛔ ACTION PENDING   │
│    PM CONFIRMATION │ │    PM CONFIRMATION │ │    PM CONFIRMATION │  ⛔ PQ-06
│    PQ-06           │ │    PQ-06           │ │    PQ-06           │
└────────────────────┘ └────────────────────┘ └────────────────────┘
   ⚠ the card is NOT a click target — the title is a link, the action is a button ✅ B04
   ⛔ NO amount anywhere on a public card — PM29-04

  STATES: full · searched · filtered · no results · SIGNED OUT (now the default) ·
          signed in holding some · empty catalogue 🔴
```

---

# W3 · Course detail — `/course/<id>`

```
  Catalogue / ⟦S1 grouping⟧ / Course name
┌──────────────────────────────────────────────────────────────────────────────┐
│ C1 · COURSE NAME                                            ┌──────────────┐ │
│ C3 · ⟦S1 grouping⟧                                          │ ⛔ ACCESS     │ │
│ C2 · COURSE ID / CODE                                       │  ACTION      │ │
│      ⚠ NO SUCH FIELD EXISTS IN ANY SOURCE                   │  PENDING PM  │ │
│      ⚠ "may vary by institution" — and a PUBLIC page has    │  CONFIRMATION│ │
│        no institution. Either a canonical code exists, or   │              │ │
│        a public page shows none. → PQ-10 · candidate N-2    │  ⛔ DOUBLE-   │ │
│                                                             │  BLOCKED:    │ │
│ C4 · SHORT DESCRIPTION                                      │  PQ-06 AND   │ │
│      🟠 "if supported" — no FRD course-description field     │  whether a   │ │
│                                                             │  Course is   │ │
│ C6 · RUNS ON  [VR] [Web]   ← the UNION of its experiments,  │  an access   │ │
│                              derived, not authored          │  unit at all │ │
│                                                             │  (N-3)       │ │
│                                                             └──────────────┘ │
│ C5 · EXPERIMENTS IN THIS COURSE          ← PM29-17 🔵 high confidence         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ ◻ Experiment name          [VR]   device line              →         │   │
│  │ ◻ Experiment name          [Web]  device line              →         │   │
│  │ ◻ Experiment name          [MR]   device line              →         │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│  ⚠ NO count, minimum, maximum or "typically N" — the 5–10 figure is SAMPLE   │
│  ⛔ NO institution-specific course-mapping UI — brief §10                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

# W4 · Experiment detail — `/experiment/<id>`

```
  Catalogue / Course name / Experiment name
┌──────────────────────────────────────────┬───────────────────────────────────┐
│ E1 · EXPERIMENT TITLE                    │  ACCESS PANEL          [sticky]   │
│ E9 · discipline                          │  ┌─────────────────────────────┐  │
│ E6 · [VR] [Web]  ← R1 badge row          │  │ E10 · ACCESS STATE          │  │
│      ⚠ MR retained — an omission is      │  │  derived none/some/all ✅ B04│  │
│        not a removal (PQ-13)             │  │  a signed-out visitor IS    │  │
│                                          │  │  the `none` case            │  │
│ E3 · DESCRIPTION                         │  ├─────────────────────────────┤  │
│      one paragraph, ≤62 chars per line ✅ │  │ E12 · ⛔ NO AMOUNT SHOWN     │  │
│                                          │  │        PM29-04              │  │
│ E7 · RUNS ON                             │  ├─────────────────────────────┤  │
│      "VR headset required — e.g. Meta    │  │ E11 · ⛔ ACCESS ACTION       │  │
│       Quest"  ← device names are FRD     │  │        PENDING PM           │  │
│       examples, shown as examples ✅      │  │        CONFIRMATION         │  │
│                                          │  │        PQ-06 · PM29-A6      │  │
│ E2 · COURSE CONTEXT          ← NEW LINK  │  │                             │  │
│      no public course↔experiment surface │  │  4 candidates:              │  │
│      exists in any batch                 │  │   · add to request list     │  │
│                                          │  │   · add to cart → checkout  │  │
│ E4 · LEARNING OUTCOMES       🔴 NEW       │  │   · get access / subscribe  │  │
│      ┌────────────────────────────────┐  │  │   · request access (plain)  │  │
│      │ ⛔ NO SURFACE IN ANY BATCH      │  │  │  ▶ four different products  │  │
│      │    NO FRD FIELD                │  │  ├─────────────────────────────┤  │
│      │    NO ROLE OWNS AUTHORING THEM │  │  │ ⟦R3 · TECHNOLOGY SELECTOR⟧  │  │
│      │    → candidate question N-1    │  │  │  RENDERS ONLY UNDER         │  │
│      └────────────────────────────────┘  │  │  PQ-08 reading (B).         │  │
│                                          │  │  ABSENT under (A) — and     │  │
│ E5 · PREVIEW / VIDEO          🔴 NEW ⚠    │  │  no route or breadcrumb     │  │
│      ┌────────────────────────────────┐  │  │  changes either way ✅       │  │
│      │ ⛔ PLACEHOLDER ONLY             │  │  └─────────────────────────────┘  │
│      │    no player, no autoplay,     │  │                                   │
│      │    no source, no controls      │  │  ≤1040px: this panel moves        │
│      │ ⚠ QX-03 CAPTION / TRANSCRIPT   │  │  ABOVE the body (order:-1) so the │
│      │   OWNERSHIP IS HIGH AND OPEN.  │  │  decision is not buried ✅ B04     │
│      │   A public video with no       │  │                                   │
│      │   captions is an accessibility │  └───────────────────────────────────┘
│      │   exposure — raise BEFORE it   │
│      │   is built, not after.         │
│      └────────────────────────────────┘
│
│ E8 · WHAT IS INCLUDED     ✅ B04 `.incl` — ONE component, now FIVE callers
│      ◻ One XR simulation                       FRD 3.1.1
│      ◻ Learning resources — readings, videos   FRD 3.1.2 (optional)
│      ◻ An assessment, where the experiment has one
│      ⛔ NO assessment settings — configuration-driven (PM-08), and who
│         configures for a pure-B2C learner is deferred (PM-15)
│      ⛔ NO certificate — Phase 2 (PM-12)   ⛔ NO duration promise — D-24
│      ⛔ NO rating, review, enrolment count, popularity or "new" flag
└──────────────────────────────────────────┴───────────────────────────────────┘
```

---

# W5 · Institution vs Individual entry — `/get-started`

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          HOW WILL YOU BE LEARNING?                           │
│                    ⚠ heading is placeholder — copy not written                │
│                                                                              │
│  ┌────────────────────────────────┐   ┌────────────────────────────────┐    │
│  │  ▶ AN INSTITUTION              │   │  ▷ AN INDIVIDUAL               │    │
│  │    PRIMARY — PM29-05           │   │    SECONDARY — PM29-05         │    │
│  │                                │   │    ⚪ Phase-1 scope OPEN PQ-07   │    │
│  │  ⛔ SUPPORTING COPY PENDING     │   │  ⛔ SUPPORTING COPY PENDING     │    │
│  │                                │   │                                │    │
│  │  ⛔ ACTION PENDING              │   │  ⛔ ACTION PENDING              │    │
│  │     PM CONFIRMATION            │   │     PM CONFIRMATION            │    │
│  └────────────────────────────────┘   └────────────────────────────────┘    │
│                                                                              │
│  Already have an account?  ⛔ SIGN IN — AUTH-01 DOES NOT EXIST                │
└──────────────────────────────────────────────────────────────────────────────┘

  ⚠ WHERE THIS FORK SITS RELATIVE TO SIGN-IN IS NOT STATED. Three placements,
    three different route graphs — one of the five open questions that make the
    auth prototype unsafe (S9).

    above sign-in    │  two distinct pre-auth journeys
    inside sign-in   │  one surface with a context choice
    after sign-in    │  contradicts PM29-06's public framing

  ─────────────────────────────────────────────────────────────────────────────
  WHAT EACH BRANCH LEADS TO — mapped, NOT designed. NO FORM IS DRAWN.

  INSTITUTION                                  INDIVIDUAL
   application 🔴 AUTH-10 never built           register 🔴 AUTH-03
    org info ✅ named · SPOC ✅ named             │
    everything else ⚪ NOT STATED                 ⚪ authorisation before payment?
     │                                              PQ-07 / PM29-A5
    submitted — ⚪ state set NOT STATED           │
     │                                          access period ✅ PM29-19
    ⚪ platform review — ACTOR OPEN PQ-03          Monthly · Quarterly · Yearly
     │                                            NO Lifetime · 🔴 no selector exists
    ⚪ authorisation — ACTOR OPEN PQ-03           │
     │                                          payment ✅ B04 · 3 outcomes
    ⚪ commercial branch — RULE OPEN PQ-11        │
     │                                          access created ✅ automatic
    tenant created ✅ FRD 4.2.1                   │
     │                                           ▼
    ⚪ first Tenant Admin — QD-02          ▶▶ MY LEARNING ◀◀ both routes converge
     │                                              ✅ BUILT
    TENANT WORKSPACE ✅ Batch 03
```

---

## 3 · What these wireframes deliberately do not contain

| Absent | Source |
|---|---|
| Any chosen CTA verb | `PQ-06` |
| Any price, amount or currency | `PM29-04` |
| Any form field, anywhere | Brief §12 · `N4` |
| A cart, a request list, or a period selector | `PQ-06` · `PQ-07` · `N10` |
| A Bundle card, filter or page | `PQ-02` |
| A *Programme* level | `PQ-04(b)` |
| Technology as a route or breadcrumb level | `PQ-08` — **a level cannot be demoted to a property without breaking routes** |
| Sign-in, register or application screens | `S9` · `W17` |
| Marketing copy, claims, statistics or testimonials | **Nothing is invented** |
| Any colour, type, spacing or visual treatment | **Stage 9** — structure first |
| Any HTML, CSS or JS | `N4` · `N5` |

## 4 · What must happen before these become real wireframes

| # | Before | Needs |
|---|---|---|
| 1 | The **CTA** can be drawn | `PQ-06` |
| 2 | The **grouping level** can be named | `PQ-04(b)` |
| 3 | The **technology selector** can be placed | `PQ-08` |
| 4 | The **landing value proposition** can be written | ⚠ **A copy owner — not currently on any question list** |
| 5 | The **preview region** can hold a player | ⚠ **`QX-03` caption ownership — HIGH and open** |
| 6 | The **course code** can be shown | `PQ-10` + candidate **N-2** |
