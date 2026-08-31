# 06 — Public Screen Model: Landing · Catalogue · Course · Entry

| | |
|---|---|
| **Status** | 🟠 **SCREEN PLANNING — DRAFT.** Regions and states only. **No copy is written, no CTA is chosen, no form is designed** |
| **Created** | 29 August 2026 |
| **Companion** | `05_PUBLIC_CATALOGUE_IA.md` (structure) · `07_PUBLIC_DETAIL_CONTENT_MODEL.md` (the experiment page) |
| **Rule applied** | A region may be **planned** when its content is either already built somewhere or is high-confidence PM direction. Everything else is a **⛔ pending region** |

---

# Part A · Public landing

`PUB-01` · route `/` · 🔴 **CONFIRMED MISSING** — gap `A1`. **No unauthenticated surface exists in any batch.**

## A.1 Region model

| # | Region | Content basis | Status |
|---|---|---|---|
| **L1** | **Platform identity** — logo lockup + product name | Batch 01 header, built. `branding/bits-pilani-wilp-logo.png`, referenced in place | ✅ **Reusable verbatim** |
| **L2** | **What this platform is** | 🔴 **No source contains a value proposition.** A *region* is planned; **its copy is not written** | ⛔ **COPY PENDING** |
| **L3** | **Browse XR learning content** — the way into the catalogue | `PM29-02` | 🔵 **Confirmed** |
| **L4** | **Grouping strip** ⟦S1⟧ — Disciplines present in the catalogue | Batch 04 derives disciplines from content, never a fixed list | ✅ **Reusable mechanism** |
| **L5** | **Sample / featured Courses** | 🟠 *"Featured"* implies a **curation rule no source defines.** Planned as **"Courses in the catalogue"**, ordered arbitrarily, not as an editorial feature | 🟠 **Rule pending** |
| **L6** | **Technology availability** — the four formats | Batch 01 format badges (all four, MR retained) | ✅ **Reusable verbatim** |
| **L7** | **Institution entry** | `PM29-06` | 🔵 Confirmed *(destination pending — Part D)* |
| **L8** | **Individual entry** | `PM29-06` | 🔵 Confirmed *(destination pending — Part D)* |
| **L9** | **Sign in** | `AUTH-01` | 🔴 **Destination does not exist** |

## A.2 What is deliberately not planned

| Not planned | Why |
|---|---|
| Any marketing claim, statistic, count or superlative | **Nothing is invented.** No source contains one |
| Testimonials, logos of institutions, case studies | Would assert relationships that do not exist |
| Pricing, plans, "from ₹X" | `PM29-04` — *"do NOT yet invent"* |
| A hero carousel, promotional tile, urgency device | Batch 04's own rule: *"A catalogue, not a storefront"* |
| A "get started free" / trial affordance | No trial exists in any source |
| Number of experiments / institutions / learners | Invented data |

> **L2 is the honest problem on this page.** A landing page's job is to say what the product is, and **no approved sentence exists** to say it with. The region is planned; writing it is a copy task that needs the PM or the business, not a design decision. It is recorded in `11_SAFE_WIREFRAME_SCOPE_BEFORE_PM.md` as the one landing region a wireframe must leave visibly blank.

---

# Part B · Catalogue

`PUB-02` · route `/catalogue` · 🔴 **CONFIRMED MISSING as a public surface** — gap `A2`
**Nearest existing:** Batch 04 `B2C-01` **Explore** (`#/explore`) — *"components reusable, position wrong"*.

## B.1 What transfers from Batch 04, exactly

| Batch 04 asset | Transfers? | Note |
|---|---|---|
| `.filterbar` — four labelled controls, active-filter footer, removable pills, `N items of 11` count | ✅ **Yes, mechanism** | Every control has a **visible label**, not a placeholder standing in for one |
| `.catgrid` — auto-fill, min 316px | ✅ **Yes, verbatim** | |
| `.catcard` — six fields, one action, fixed-height title block (70px) | ✅ **Yes, structure** | The fixed-height block is what makes rows line up when titles wrap unevenly |
| Title is a link · action is a button · card is **not** a click target · `:focus-within` parity | ✅ **Yes — architectural** | This is an accessibility property, not a style |
| Access-state derivation `none` / `some` / `all` | ✅ **Yes — architectural** | **A signed-out visitor is the `none` case with a different verb** |
| Search over title, discipline, summary | ✅ **Yes** | |
| **Discipline** filter — derived from content | ✅ **Yes** | Fills ⟦S1⟧ — see `05` §3 |
| **Delivery type** filter — Web · VR · MR · AR | ✅ **Yes** | Becomes rendering **R2** of the availability set — see `05` §4 |
| **Type** filter — `Modules and bundles` / `Modules only` / `Bundles only` | ⛔ **NO** | `PQ-02`. Task brief: *"Do NOT force Module/Bundle filters"* |
| `.cc-kind` chip reading **`Module`** | ⛔ **Frozen** | `PQ-04`. **This chip is one half of the shipped self-contradiction** — see `10` |
| Amount + `SAMPLE AMOUNT` caption in `.cc-foot` | ⛔ **Not carried to a public card** | `PM29-04` |
| `View details` action | 🟠 **Position yes, verb pending** | The footer's action slot is reusable; its label is ⟦S3⟧-adjacent |
| Bundle card variant, `.cc-count` *"3 modules"* | 🔒 **DEFER** | Preserved in Batch 04, not carried forward |

## B.2 Filter model — flexible by construction

```
FILTERS = [ search ] + [ ⟦S1 grouping⟧ ] + [ technology (R2) ] + [ ⟦optional kind⟧ ]
                              │                    │                      │
                        Discipline today      four formats          EMPTY today
                        Programme later?      MR retained           Bundle later?
```

**Three properties make it flexible rather than merely small:**

1. **Values derive from content, never from a fixed list.** Batch 04 already does this for Discipline. A new discipline appears because an experiment has it, not because someone edited a list.
2. **Each filter is independently removable**, with its own pill and its own remove control, plus one *Clear filters*.
3. **The count states what is hidden** — `N items of M` whenever a filter is active — so a visitor always knows how much of the catalogue they are not seeing.

**Adding a filter later is additive.** Removing one is not, which is why the `Type` filter is not carried forward on the chance that `PQ-02` might justify it.

## B.3 Card kinds — one skeleton, two callers

The brief requires cards *"adaptable to Course and Experiment without duplicating product concepts."*

| | **Course card** | **Experiment card** |
|---|---|---|
| Kind chip | `Course` | `Experiment` ⚠ *frozen label* |
| Title block *(fixed height)* | Course name | Experiment name |
| Sub-line | ⟦S1⟧ grouping | ⟦S1⟧ grouping |
| Summary | One line | One line |
| Facts row | **Count of experiments** *(reuses `.cc-count`)* + the union of their technologies | Its own technology badges + device line |
| Footer | One action | One action ⟦S3⟧ |

> **`.cc-count` is the reuse that matters.** Batch 04 built it to say *"3 modules"* on a **bundle**. The same slot says *"6 experiments"* on a **course** — same component, same position, same width behaviour, and **no bundle concept is carried over with it**. That is how the catalogue gains a Course kind without inheriting an open question.

## B.4 States

| # | State | Source |
|---|---|---|
| 1 | Full catalogue | Batch 04 state 1 — built |
| 2 | Search applied, removable pill | Batch 04 state 2 — built |
| 3 | Filters applied | Batch 04 state 3 — built |
| 4 | **No results** — pills + one clear action | Batch 04 state 4 — built |
| 5 | **Signed out** *(now the default, not a variant)* | Batch 04 state 5 — built, **and this is the position change** |
| 6 | Signed in, holds some content | Batch 04 state 6 — built |
| 7 | Empty catalogue | 🔴 Not built anywhere. Trivial, but real |

**Five of seven exist and were QA-passed.** State 5 flips from an edge case to the default; that is the whole of `PM29-02`'s cost at this screen.

---

# Part C · Course page

`PUB-03` · route `/course/<id>` · 🔴 **CONFIRMED MISSING** — gap `A3`
**No course-level catalogue page exists in any batch.** Batch 04 offers modules and bundles only; Batch 03 shows courses inside the tenant's academic structure, view-only.

## C.1 Region model

| Region | Content | Basis | Status |
|---|---|---|---|
| **C1** | **Course name** | `PM29-15` · FRD 3.2.1 | 🔵 Confirmed |
| **C2** | **Course ID / Code** | `PM29-15` — *"may vary by institution"* | 🟣 **No course-code field exists anywhere in the FRD.** Verified: zero hits for *course code* / *course id*. → `PQ-10` |
| **C3** | ⟦S1⟧ grouping | See `05` §3 | ⛔ Slot |
| **C4** | **Short description** | 🟠 *"if supported"* — no FRD course-description field | 🟠 Region planned, existence pending |
| **C5** | **Experiments in this course** | `PM29-17` — *an Experiment maps to a Course; a Course may hold several* | 🔵 **Confirmed** |
| **C6** | **Technology across the course** — the union of its experiments' availability | Derived, not authored | ✅ Derivable today |
| **C7** | ⟦ACCESS ACTION⟧ | ⛔ `PQ-06` — **and additionally**, whether a Course is even an access unit is open | ⛔ **Double-blocked** |

## C.2 The Course-Code problem, stated precisely

> `05_CONTENT_HIERARCHY_AND_CATALOGUE_MODEL.md` §3.1: *"**'May vary by institution' is a data-model statement, not a UI statement.** If the same course carries a different code per institution, the code belongs to the **tenant's mapping**, not to the central content record."*

| Consequence | Detail |
|---|---|
| On a **public** course page | Which code is shown? There is no tenant context. **Either a canonical code exists (and the PM's statement is about something else), or the public page shows no code at all** |
| On a **tenant** course view | The tenant's own code — a mapping object that no batch designs |
| What this document does | Plans **region C2** and records both readings. **It does not choose.** → `PQ-10` |

**⛔ No institution-specific course-mapping UI is designed.** The task brief prohibits it, and `PQ-10` has not been read back.

## C.3 The 5–10 figure

`PM29-17` mentions a course holding several experiments. **`09_BATCH_01_05_IMPACT_MATRIX.md` records the 5–10 figure as SAMPLE, not cardinality.** No count, minimum, maximum or "typically N" appears in this model.

## C.4 Is a Course purchasable?

⚪ **Not answered, and not asserted in either direction** — exactly as Batch 04 handled it:

> *"No source prohibits course purchase. Absence of a requirement is not a prohibition."* — `QP-28`

Batch 04's discipline here is worth preserving verbatim: **no course price, no course action, and no sentence to retract** if `QP-28` later resolves either way.

---

# Part D · Institution vs Individual entry

`PUB-04` · route `/get-started` · 🔴 **CONFIRMED MISSING** — gap `A7`. **No entry-fork screen exists anywhere, and no inventory ID covers it.**

## D.1 The fork

```
                    PUBLIC CATALOGUE / LANDING
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
          ┌──────────────────┐  ┌──────────────────┐
          │  INSTITUTION /   │  │   INDIVIDUAL     │
          │     TENANT       │  │                  │
          │  ▶ PRIMARY       │  │  ▷ SECONDARY     │
          └────────┬─────────┘  └────────┬─────────┘
                   │                     │
                   ▼                     ▼
              see D.2               see D.3
```

`PM29-06` is **high-confidence** that the fork exists. **Where it sits relative to sign-in is not stated** — and that is one of the five open questions that make the auth prototype unsafe (`S9`).

| Placement | Consequence |
|---|---|
| Fork **above** sign-in | Two distinct pre-auth journeys; sign-in is reached from each |
| Fork **inside** sign-in | One sign-in surface with a context choice |
| Fork **after** sign-in | Contradicts `PM29-06`'s public framing |

⛔ **Not chosen here.**

## D.2 Institution path — mapped, not designed

```
Browse the public catalogue                       🔵 PM29-02      🔴 not built
   └── identify desired content                   ⚪ MECHANISM OPEN — PQ-06
        └── Institution entry                     🔵 PM29-06      🔴 not built
             └── application / request            🔵 PM29-07      🔴 AUTH-10, never built
                  │  organisation information     ✅ named by the PM
                  │  SPOC / contact information   ✅ named by the PM
                  │  everything else              ⚪ NOT STATED — not invented
                  └── submitted, applicant-visible state
                       │                          ⚪ STATE SET NOT STATED
                       └── platform review        ⚪ ACTOR OPEN — PQ-03
                            └── authorisation     ⚪ ACTOR OPEN — PQ-03
                                 └── commercial branch  ⚪ RULE OPEN — PQ-11
                                      └── tenant created     🔵 FRD 4.2.1
                                           └── first Tenant Admin  ⚪ MECHANISM — QD-02
                                                └── TENANT WORKSPACE  ✅ Batch 03
```

**Eight steps. One designed.** ⛔ **No form is designed here** — the task brief prohibits it and the field list beyond organisation + SPOC is not stated.

**The reuse finding that survives every answer:** if `PQ-03` resolves to an in-product approver, **Batch 01's governance-review pattern is a near-exact fit** — queue, detail, decision with a required reason, a submitter-visible state, and a history trail. All five exist, are QA-passed and are accessible. See `01_EXISTING_SCREEN_REUSE_MAP.md` and `02_COMPONENT_REUSE_MAP.md`.

## D.3 Individual path — mapped, not designed

```
Browse the public catalogue                       🔵 PM29-02      🔴 not built
   └── Individual entry                           🔵 PM29-06      🔴 not built
        └── registration                          ✅ FRD 4.1.1/4.1.2   🔴 AUTH-03 not built
             └── ⚪ AUTHORISATION BEFORE PAYMENT? ⚪ OPEN — PQ-07 / PM29-A5
                  └── access period               ✅ CONFIRMED — PM29-19
                       │   Monthly · Quarterly · Yearly · NO Lifetime
                       │   🔴 no term selector exists anywhere
                       └── payment                ✅ Batch 04 B2C-04/05/06
                            └── access created    ✅ automatic — FRD 9.2.1
                                 └── MY LEARNING  ✅ Batch 04 · ▶ CONVERGENCE
```

**The individual path is the better-built of the two** — payment, its three outcomes, automatic activation and My Learning are all designed and QA-passed. What it lacks is everything **before** registration, plus the period selector.

⛔ **No registration form, no period selector and no transaction is designed here.**

## D.4 What both paths share

| Shared | Where it converges |
|---|---|
| The **same public catalogue** | One catalogue, two audiences — `07_B2C_SECONDARY_JOURNEY.md` §2 |
| The **same access record spine** `{ via, on, ref }` | Batch 04 — *"a cart, a request list or an authorisation step would all grant through the same path"* |
| **My Learning** | ▶ **This is where the two routes meet** |
| The **entire learning core** | Resources → simulation → assessment → progress. Batches 01 + 02, PM-09 approved |

> **Only the middle differs.** Both ends — discovery and learning — are one product. That is the single most useful structural fact for the consolidation, and it is why B2B-first does not mean B2C-deleted.

## D.5 B2B primary without deleting B2C

| | B2B — **primary** | B2C — **secondary** |
|---|---|---|
| Rollout attention | ▶ First — `PM29-05` | ▷ After — `PM29-05` |
| Phase 1? | ✅ Yes | ⚪ **OPEN.** The PM did **not** say B2C leaves Phase 1; **PM-04 and FRD 1.1.3 both place it there** → `PQ-07(b)` |
| Access periods | ⚪ Nothing stated for institutions → `PQ-21` | ✅ Monthly · Quarterly · Yearly · **no Lifetime** — `PM29-19` |
| Transaction | ⚪ **OPEN** — `PQ-06`, `PQ-11` | 🟠 Built, but its **entry position** is superseded |
| In this planning package | Prioritised in every ordering | **Preserved in full, nothing deleted** |

⚠ `PM29-05` is a **direct reversal of a PM-04 prohibition** (*"Do NOT treat B2B-first / B2C-second as a PM-confirmed release sequence"*). It resolves on **focus** and stays open on **scope**. Recorded so the reversal is deliberate rather than accidental.
