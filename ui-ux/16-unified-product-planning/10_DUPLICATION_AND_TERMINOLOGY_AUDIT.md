# 10 — Duplication and Terminology Audit

| | |
|---|---|
| **Status** | 🟠 **AUDIT — DRAFT.** It **counts what exists**. It does not choose a term, and it renames nothing |
| **Created** | 29 August 2026 |
| **Authorised by** | `11_SAFE_WORK_BEFORE_MONDAY.md` **S4** — *"it counts what exists. It does not choose a term"* |
| **Method** | Case-insensitive occurrence counts with word boundaries, plurals folded, over `.md` `.js` `.css` `.html` in `ui-ux/13-full-platform-design/`. `b01` = the root directory plus its own `prototype/`, `qa/` and `wireframes/`, excluding the batch 02–05 subdirectories |
| **⛔ Prohibition** | **Nothing is renamed.** `PQ-04`, `PQ-09` and `PQ-12` are unanswered. A rename must happen **once**, at Stage 6, after confirmation |

---

# Part A · Duplicate screens

**Twenty clusters where two or more batches solve the same conceptual problem.** Seven are screen-level; thirteen are component- or pattern-level and are detailed in `02_COMPONENT_REUSE_MAP.md` §12.

| # | Conceptual problem | Implementations | Strongest | Blocked? |
|---|---|---:|---|---|
| **1** | *"What do I have access to, and where do I resume?"* — **My Learning** | **4** | **B04** structure · **B01** vocabulary | 🟠 label only |
| **2** | *"Here is one piece of content"* — **experiment / module detail** | **4** | **B01** state coverage | 🔴 **the noun** |
| **3** | *"What have I completed?"* — **Progress** | **2 + 1 signpost** | **B02** | ❌ |
| **4** | *"What content exists that I do not have?"* — **catalogue browse** | **5 framings** | **B04 `B2C-01`** | ⛔ **`PQ-06`, `PQ-02`** |
| **5** | *"Can this person reach this content, and why?"* — **access state** | **4 vocabularies** | **B01** ladder · **B04** derivation | ❌ *for the display merge* |
| **6** | *"Is this institution set up and working?"* | **2 planes** | **B05 `SA-03`** | ❌ |
| **7** | *"What may this institution use, and who receives it?"* | **3 views** | **B03 `INA-06/07/08`** | ⛔ **three at once** |
| **8** | **Application shell** | **5** | **B05** structure · **B04** account region | ❌ |
| **9** | **Account menu** | **5 — three dead, two live** | **B04** | ❌ |
| **10** | **Section navigation** | **4 mechanisms** | **B02/B03** `.tabnav` · **B05** sidebar | ❌ |
| **11** | **Table / list** | **5** | **B01** semantics · **B05** composition | ❌ |
| **12** | **Empty states** | **~23 across 5** | **B04 + B05** *(the `h2` fix)* | ❌ |
| **13** | **Not found** | **3 ways — and 11 times not solved** | **B05** per-entity | ❌ |
| **14** | **Alert / banner** | **5, 75 instances** | **B02** live regions · **B05** boundary/gap | ❌ |
| **15** | **Status badge** | **~40 states, 6 families, 3 code structures** | **B05** state maps | ❌ |
| **16** | **Confirmation dialog** | **5 copies — one is dead code** | **B03** + **B05** `confirmClass` | ❌ |
| **17** | **Search / filter** | **5 across 4 mechanisms** | **B04** bar · **B05** deep-link · **B03** chips | ❌ |
| **18** | **Attention / work list** | **2** | **B05 `SA-01`** | ❌ *component* |
| **19** | **Sign-in handoff / arrival** | **5 stand-ins, 1 real handoff** | **B04 `AUTH-B2C`** | ⛔ **nothing to merge into** |
| **20** | **Prototype disclaimers** | **5 idioms** | **B05** `.boundary` / `.gap` | ❌ |

> **Fifteen of twenty are not blocked at all.** They are pure reconciliation — decidable at Stage 6 without the PM. That is the single most useful number in this audit.

## A.0 · The three screen clusters in detail

**All three are learner-facing — because four batches each needed a learner context and each built one.**

## A.1 · Cluster D1 — **My Learning**

**Four implementations of one screen — and three of them claim the literal same route string (`#/learner/my-learning`), so the four cannot coexist in one prototype.**

| Batch | Screen | Route | What it does that the others do not |
|---|---|---|---|
| **01** | `S11` · `LRN-02` | `#/learner/my-learning` | XR format + progress state per row; B2B institutional framing |
| **02** | *(unnamed — carries no batch ID)* | `#/learner/my-learning` | Per-module assessment status; pending-result banner; **never marks a module complete while a result is pending** |
| **03** | `INA-13` *Learner Access Check* | `#/learner/my-learning` | **The eligible / not-eligible pair** — proves the institutional handoff reaches the learner. `DA-14`, *a verification view over `LRN-02`* |
| **04** | `LRN-02` *(individual)* | `#/my-learning` | **Origin per row** (`{via, on, ref}`); **just-added** banner + row badge; individual empty state |

| | |
|---|---|
| **Canonical future screen** | **`LRN-02` My Learning** — one screen, context-aware |
| **Strongest implementation** | **Batch 04.** It is the only one whose rows are a **function of the access record** rather than a list — *"My Learning has no list of its own — it is a function of the access record."* That is the property the other three need and none has |
| **What merges** | B01's format + progress row · B02's assessment status and pending rule · B03's eligible / not-eligible pair · B04's origin, just-added and derivation |
| **What disappears** | Nothing. **Three of the four are context variants of one screen**, not rival designs |
| **PM-blocked?** | 🟠 **Partly** — `PQ-12` (Student vs Learner) decides whether the **label** is context-dependent. The screen is not blocked; its vocabulary is |

> ▶ **This is where the two commercial routes converge.** A B2B student and a B2C individual reach the identical screen by different routes. It is the single most important merge in the corpus.

## A.2 · Cluster D2 — **Learner experiment / module detail**

**Three implementations, under two different nouns.**

| Batch | Screen | Route | Noun | What it does that the others do not |
|---|---|---|---|---|
| **01** | `S12` · `LRN-04`+`LRN-07` | `#/learner/experiment/:id` | **Experiment** | Entitlement → device compatibility → availability → completion; access-denied and unsupported-device states |
| **02** | `B07` · `LRN-04` | `#/learner/module/<mid>` | **Module** | The learning **sequence ladder** — resources → simulation → **assessment**, each with *why it is available* |
| **04** | `B2C-02` + `LRN-04b` | `#/module/<id>` · `#/learn/<id>` | **Module** | Catalogue framing, access panel, `.incl` contents list, already-held state |

| | |
|---|---|
| **Canonical future screen** | **Experiment Detail** — with a **public, unauthenticated twin** (`07_PUBLIC_DETAIL_CONTENT_MODEL.md`) |
| **Strongest implementation** | **Batch 01**, on state coverage — eight states including the three failure modes the others do not model. **Batch 02 contributes the sequence ladder; Batch 04 contributes the contents list and access panel** |
| **What merges** | All three, plus `E4` learning outcomes and `E5` preview from `PM29-03` |
| **What disappears** | B04's `LRN-04b` — it is an explicit **handoff signpost**, not a rival design |
| **PM-blocked?** | 🔴 **Yes, on the noun.** `PQ-04`. **This is the clearest place a consolidated prototype exposes the split** — the same object, one click apart, under two names |

## A.3 · Cluster D3 — **Progress**

| Batch | Screen | Route | Contribution |
|---|---|---|---|
| **01** | `S14` · `LRN-13` | `#/learner/progress` | Completion landing after *Completion Received* |
| **02** | `B12` · `LRN-13` | `#/learner/progress` | Per-module simulation / assessment / module status; **pending banner**; the rule that a module never completes while a result is pending |
| **04** | `SIGNPOST-PROGRESS` | `#/progress` | *(signpost only — not a design)* |

| | |
|---|---|
| **Canonical future screen** | **`LRN-13` Progress** |
| **Strongest implementation** | **Batch 02** — it carries the load-bearing rule |
| **What disappears** | B04's signpost |
| **PM-blocked?** | ❌ No |

## A.4 · The six remaining screen-level clusters

### Cluster 4 — **Catalogue browse** *(5 framings)*

| Where | Framing |
|---|---|
| **B04 `B2C-01`** | A **commercial catalogue** — the only real one in the corpus |
| **B01 `S10`/`CM-03`** | A **governance catalogue** of what is live |
| **B01 `S11`** | An *"Also at your institution"* **one-row teaser** inside My Learning |
| **B03 `INA-07`** | *"What this covers"* — an **enumerated list** on an access record |
| **B03 `INA-13`** | `.entgrid` / `.entcard` — a **learner content grid** |

**Strongest: B04.** *The only surface built for browsing rather than listing* — a filter bar where every control has a **visible label**, removable pills each with an `aria-label` naming what they remove, a **derived** discipline list, a result count announced politely on every repaint, and caret-preserving in-place repaint.

**Canonical:** one **public** catalogue plus its **authenticated twin** in the learner workspace.
**Merges:** B01's *"Also at your institution"* becomes the institutional learner's entry point to the same catalogue; B03's `.entcard` becomes the card's **held-state footer variant**; B03's *"What this covers"* shares the included-items component.
**Does not disappear:** ✅ **B01's `CM-03`.** *"What did I release, when, at what version"* is a different question asked by a different role — **and Batch 05 explicitly declined to build a second one for exactly this reason.**
⛔ **Blocked:** `PQ-06` gates the card's and the detail page's primary button; `PQ-02` gates the `Type` filter.

### Cluster 5 — **Access state** *(4 vocabularies for one idea)*

| Batch | Vocabulary | Device |
|---|---|---|
| **01** | *entitlement* → device → availability → completion | `xrLadder()` |
| **03** | *eligibility* · *reaches* · *"Included in your institution's access"* | `.reachflow` |
| **04** | *access* — derived `none` / `some` / `all` | `accessPanel()` |
| **05** | *"Recorded"*, with no transaction | `SA-08` |

**Strongest: B01's ladder for the learner chain; B04's derivation for the state model.** B01's is the only implementation rendering the **full chain in one component**, with each node's state in words and the rule that **a state which forbids an action removes the control rather than disabling it** — *"No launch control is shown for a device that can't run this experiment."*

**Canonical:** one derivation function underneath **three presentations** — the learner's ladder, the administrator's reach flow, and the derived badge. B05's read-only *"Recorded"* becomes a fourth, **observer** presentation.
❌ **Not blocked** — the display merge is decidable now. `PQ-05` blocks only **who creates** the relationship.

### Cluster 6 — **Institution readiness** *(2 planes, same 3 facts)*

**Strongest: B05 `SA-03`.** Its readiness ledger renders **all three facts always**, so *a missing fact is shown as missing rather than omitted* — and **every row carries a provenance line naming the role that owns it and the requirement that says so.** That line *"is what makes the absence of an edit control legible instead of looking broken."*

**Canonical:** one **Institution Readiness** component with two callers — the Institute Admin's **operating** view (rows actionable) and the Super Admin's **observing** view (rows carry provenance, no controls).
**Neither screen disappears** — *"they are two planes looking at one record, which is exactly the shape FRD 1.3.5 and AC-04 require."*

### Cluster 7 — **Content access** *(3 views; the granting end exists on none)*

**Strongest: B03 `INA-06`/`07`/`08`** — *the only implementation that models the record **and** the relationship*, and the only one showing the picture **from both directions** so a gap is visible whichever way you come at it.

**Canonical:** one record, three views — the Super Admin's **allocation** view *(🔴 does not exist yet)*, the Institute Admin's **mapping** view, and the learner's **access line**.
**Nothing disappears.** Two of the three survive with **one line filled in** — the origin actor. The third has to be built.
⛔ **Blocked three times over:** `PQ-05` · the allocation **unit** · `PQ-03`.

### Cluster 13 — **Not found** *(3 ways, and 11 times not solved)*

| Batch | Treatment |
|---|---|
| **01** | 4× bare `<p>Not found.</p>` inside the shell, **no `<h1>`** |
| **02** | 7× the same |
| **03** | 🔴 **Silent fall-through** — an unknown `:id` renders an unrelated view |
| **04** | `notFound()` — one generic page with `h1` + empty state |
| **05** | **Per-entity** — own `h1`, **breadcrumb preserved**, empty state, and a *Back to …* action |

**Strongest: B05 per-entity, with B04's `notFound()` as the generic sibling.** **Eleven bare fallbacks and one silent fall-through disappear.** This is composition, not new work — both already use the same `emptyState()` primitive.

### Cluster 19 — **Sign-in handoff** *(5 stand-ins, 1 real handoff)*

**Strongest: B04 `AUTH-B2C`** — *the only one that models the handoff as a product moment rather than as prototype navigation, and it does so without inventing anything*: the lede names the specific item the account is needed for, it **preserves the destination** so the learner returns to exactly where they left, and it offers both *Sign in* and *Create an account*.

**Canonical:** a real `AUTH-01` + `AUTH-08`, **which no batch has designed**. B04's panel is **SUPERSEDED, not deleted** — its return-to-origin behaviour is a **requirement on the real screen**.
> ✅ **The restraint worth naming: no batch invented a password field, a provider name, or a role switcher inside product chrome. That is why there is nothing to unpick here.**
⛔ **Blocked** — there is nothing to merge *into*.

## A.5 · Shared surfaces that are **not** duplicates

**Recorded so they are not mistaken for redundancy.** Each was designed once in Batch 01 and consumed unchanged.

| Surface | Owner | Consumed by |
|---|---|---|
| Global shell (`SHR-02`) | B01 | 02 · 03 · 04 · 05 |
| Search & filter (`SHR-03`) | B01 | 02 · 03 · 05 |
| Access-restricted copy (`STATE-01`) | B01 | 03 |
| Error grammar (`STATE-03`) | B01 | all |
| Empty states (`STATE-05`) | B01 | all |
| Loading / processing (`STATE-06`) | B01 | all |
| Review history timeline (`SHR-05`) | B01 | 02 *(attempt history)* · 05 *(request state)* |

## A.6 · Component-level duplication

**Twenty-four findings, in `02_COMPONENT_REUSE_MAP.md` §12.** The four that are genuine re-implementations:

| Idea | Implementations |
|---|---|
| Status row with a state node | **3** — `.lrow` (B01) · `.constat` (B03) · `.led` (B05) |
| Label / value pair | **4** — `.kv` (B01) · `.railkv` (B03) · `.sumline` (B04) · `.factrow` (B05) |
| Attention / work list | **2** — `.attnlist` (B03) · `.attn` (B05) |
| Content card | **3** — `Experiment Card` (B01) · `.entcard` (B03) · `.catcard` (B04) |

⛔ **No code is merged by this task.**

---

# Part B · Terminology audit

## B.1 · The measured table

| Term | Total | b01 | b02 | b03 | b04 | b05 | Conflict |
|---|---:|---:|---:|---:|---:|---:|---|
| **Module** | **627** | 6 | 129 | 15 | **302** | 175 | 🔴 **ACTIVE** |
| **Experiment** | **266** | **139** | 2 | 51 | 71 | 3 | 🔴 **ACTIVE** |
| Course | 100 | 0 | 16 | 50 | 29 | 5 | ✅ None |
| Program | 9 | 0 | 0 | **9** | 0 | 0 | 🟣 **All nine are rejections of the word** |
| Programme | 2 | 0 | 0 | 1 | 0 | 1 | ✅ Not a live term |
| **Bundle** | **353** | 0 | 1 | 9 | **333** | 10 | 🔴 **DEFINITION IN QUESTION** |
| **Learner** | **1035** | 102 | 214 | 302 | 196 | 221 | ✅ None |
| Student | 46 | 5 | 2 | 8 | 5 | 26 | ✅ **Nowhere a product term** |
| Institute Admin | 227 | 5 | 4 | **117** | 2 | 99 | ✅ None |
| **Tenant Admin** | **0** | 0 | 0 | 0 | 0 | 0 | 🟣 **Does not exist in the corpus** |
| Institution | 1081 | 20 | 8 | 437 | 31 | **585** | ✅ None |
| Tenant | 184 | 0 | 6 | 11 | 4 | **163** | ✅ Architecture word only |
| Content Access | 223 | 0 | 0 | **181** | 3 | 39 | ✅ **Coined by b03, adopted by b05** |
| Licence | 106 | **4** | 1 | 28 | 8 | 65 | 🟠 **One leak — see B.4** |
| License | 11 | 0 | 0 | 1 | 3 | 7 | ✅ FRD quotations only |
| Entitlement | 90 | 19 | 1 | 36 | 19 | 15 | 🟠 **Doc vs implementation** |
| **Technology** | **9** | 3 | 1 | 2 | 0 | 3 | 🟣 **Not a product term anywhere** |
| Format | 90 | **39** | 8 | 7 | 15 | 21 | 🟠 Three labels |
| Simulation | 165 | 50 | 53 | 11 | 33 | 18 | ✅ Two stable senses |
| Discipline | 60 | 23 | 0 | **0** | 33 | 4 | 🟠 **Undeclared relationship to Stream** |
| Stream | 298 | 0 | 0 | **232** | 3 | 63 | 🟠 Same |
| Category | 3 | 0 | 0 | 0 | 3 | 0 | ✅ **Not a product term** |
| Faculty | 296 | 7 | **156** | 94 | 3 | 36 | ✅ None |
| Vendor | 239 | **182** | 0 | 4 | 1 | 52 | 🟠 Homonym in b03 |
| Academic Reviewer | 77 | 45 | 0 | 0 | 0 | 32 | ✅ None |
| Content Manager | 161 | 73 | 0 | 0 | 1 | 87 | ✅ None |
| Super Admin | 344 | 31 | 0 | 5 | 0 | **308** | ✅ None |
| **Release** | **372** | **4** | 0 | 0 | 0 | **368** | 🔴 **ACTIVE — see B.3** |
| **Version** | **380** | 49 | 0 | 4 | 0 | **327** | 🔴 **TWO OBJECTS — see B.3** |
| Device | 561 | 179 | 6 | 44 | 47 | 285 | ✅ None |
| Subscription | 38 | 0 | 0 | 16 | 10 | 12 | ✅ **A forbidden word in all three** |

> ⚠ **These are total corpus occurrences.** They are a different measurement from `05_CONTENT_HIERARCHY_AND_CATALOGUE_MODEL.md` §4.1, which counts **user-facing label positions** (Experiment 11 · Module 61 · …). Both are correct; they answer different questions. The label counts show what a *user* sees; these show what a *consolidation* has to touch.

## B.2 · The consolidation table

| Current term | Current meaning | PM direction (29 Aug) | Conflict | **Temporary consolidation term** | Final PM confirmation needed? |
|---|---|---|---|---|---|
| **Module** / **Experiment** | 🔴 The batches disagree — and **b04 ships both in one sentence**: *"Each module stays a separate experiment with its own resources, simulation and assessment"* | **Experiment** | 🔴 **ACTIVE, SHIPPED** | **Freeze. Use *Experiment* in planning documents only** | ✅ **`PQ-04(a)`** |
| **Course** | The academic container. b03: *"Source term — used verbatim"* | **Course** | ✅ None | **`Course`** | ❌ No |
| **Program** | b03 rejects it 9 times: *"The word 'program' is not used"* | Top hierarchy level | 🟣 **Collides with PM-12-deferred certification** | ⛔ **Do not introduce.** Use `Discipline` for browse; `Academic stream` for tenant grouping | ✅ **`PQ-04(b)`** |
| **Bundle** | b04's second offering kind, holding module ids; **b03 bans the word**; b05 avoids it | PM **rejected** *"an arbitrary group of three"*; **named no replacement** | 🔴 **DEFINITION IN QUESTION** | ⛔ **Do not use in new work.** b04 unchanged | ✅ **`PQ-02`** |
| **Learner** / **Student** | One role. b04 states it: *"The formal role is `Learner`. B2C is a commercial and access context around that role, not an eighth role."* **`Student` is nowhere a product term** — all 46 hits are FRD quotations, historical file names, or records of retired wording | Diagram implies **two** | 🟠 Possible split | **One role, two contexts** | ✅ **`PQ-12`** |
| **Institute Admin** / **Tenant Admin** | `Institute Admin`, 227 hits. 🟣 **`Tenant Admin` returns zero in every separator form** | Both, interchangeably | 🟠 Label only | **Keep `Institute Admin`** — the FRD term and the built term | ✅ **`PQ-09`** |
| **Content Access** / **Licence** | b03 **coined** `Content Access` to replace *Licences* (`DA-03`); **b05 adopted the coinage verbatim** | — | ✅ Resolved between batches | **`Content Access`** | ❌ No |
| **Entitlement** | b01 documents it as **user-facing** (*"Entitlement: Active"*); b03 keeps it internal, realised on screen as *eligibility* | — | 🟠 **Doc vs implementation** — b01's shipped ladder actually renders *"Access confirmed"* / *"Included in your institution's access"* | **Internal only.** Product surfaces say *access* | 🟠 Worth a decision, not a question |
| **Technology** | 🟣 **Not a product taxonomy term in any batch.** All 9 hits are incidental — *assistive-technology* in QA statements, a sample module title *"Concrete Technology — Slump Test"*, and institution names *"Northfield Institute of Technology"* | *Available Technology* as a **level**, 3 values | 🟣 **Different shape · MR missing · WebGL unsourced** | **Keep four formats as a property.** ⛔ Never say *WebGL* | ✅ **`PQ-13`, `PQ-08`** |
| **Format** | The Web/VR/MR/AR attribute. Three labels: *XR format* (form field), *Format* (table column), *XR format badge* (component) | *Technology* | 🟠 Three labels for one attribute | **Pick one at Stage 6** | 🟠 Minor |
| **Discipline** / **Academic stream** | `Discipline` is a b04 **catalogue filter**, derived not fixed. `Academic stream` is a b03 **tenant grouping**, FRD 7.2.3. 🟠 **b03 has zero `Discipline`; b04 has three `Stream`** | *categories / programmes* | 🟠 **Their relationship is undeclared** | **Both, distinctly** — one is content classification, one is tenant population | 🟠 Folded into `PQ-04(b)` |
| **Category** | 🟣 **3 hits, all ordinary English — two of them arguing *against* a taxonomy** | Browse vocabulary | 🟠 New | **Use `Discipline`.** Treat *category* as browse-only | 🟠 Only if it becomes a content object |
| **Simulation** | Two stable senses: the platform name, and **exactly one XR simulation per content item** (FRD 3.1.1) | *Experiment* | ⚪ Minor | **Keep the distinction** — the experiment is the unit; the simulation is what runs | ❌ No |
| **Subscription · Seat · Plan · Price** | 🟢 **Independently banned by b03, b04 and b05 with matching reasoning**, each verifying its own ban programmatically across every route | No seat model — `PM29-20` | ✅ **Validated** | **Keep banned** | ❌ No |

## B.3 · 🔴 Two conflicts this audit found that were not previously recorded

### B.3.1 · **`Release`** — b05 firewalled the word; b01's shipped copy still uses it the old way

Batch 05 deliberately retired *release to production*, *production release* and *hold release* from every control, dialog title and page head, because its release control is **FRD 2.3.2 version release**, and it must not read as **FRD 1.4.4 publication**:

> *"This is a version decision, not a publication decision."*

**But Batch 01's live prototype still says, in product copy:**

| Where | String |
|---|---|
| `prototype/batch01-prototype.js` | *"**{title}** (v{n}) will be **released to production**. It becomes available for institutional licensing and to entitled learners."* |
| `prototype/batch01-prototype.js` | *"The Content Manager has **released** this experiment."* |
| `prototype/batch01-prototype.js` | *"Experiments you have **released to production**."* |
| `wireframes/batch01-wireframes.html` | *"**Releases** this experiment to production"* |

| | |
|---|---|
| **Why it matters** | In b01, *release* **means publish**. In b05, *release* means **explicitly not publish**. A consolidated prototype puts a Content Manager who *"released to production"* one nav away from a Super Admin told that releasing *"is not a publication decision"* |
| **Is it a PM question?** | ❌ **No.** Both batches are internally correct and PM-16/17/18 already settles who publishes. **This is a copy reconciliation, decidable at Stage 6 without the PM** |
| **Recommended direction** | Adopt **b05's discipline** — reserve *release* for FRD 2.3.2 versions, and let b01's Content Manager copy say **publish**. b05 already retired the ambiguous phrasing for exactly this reason |
| **Scale** | 4 occurrences in b01 · 368 in b05. **The smaller side is the one that changes** |

### B.3.2 · **`Version`** — two objects, two numbering schemes, no document connecting them

| | Batch 01 | Batch 05 |
|---|---|---|
| Object | A **submission revision** | A **published module's production version** |
| Scheme | Plain integer — `version: 1`, `sub.version += 1` on resubmit | **Dotted three-part** — `1.1.0`, `1.2.0`, `1.3.4`, `1.4.0`, `1.5.0` |
| Rendered as | a `v1` / `v2` chip | the object of the release decision |

**Both are correct in their own batch, and no document states the relationship.** Does submission v2 become production 1.2.0? Does a published experiment restart numbering? **Unknown, and not inferable.**

| | |
|---|---|
| **Is it a PM question?** | 🟠 **Possibly.** It may be a design decision at Stage 6, or it may need a product answer if versions are learner-visible |
| **Coupling** | ⚠ It sits directly underneath **`PQ-01`** — if version-release ownership moves, so does the boundary between these two numbering schemes |
| **Recorded as** | **N-4** in the candidate-question list — see §B.5 |

## B.4 · Three smaller findings

| # | Finding | Detail |
|---|---|---|
| **T1** | **A `Licence` leak into learner-visible copy** | b03 and b04 both ban the word and **verify zero product-surface hits**. b01 reaches learner copy once: *"This can happen when a licence changes or expires."* (`prototype/batch01-prototype.js`). **Four occurrences; the fix is one sentence** |
| **T2** | **`Entitlement` — documentation vs implementation** | b01 documents it as *user-facing* status vocabulary (*"Entitlement: Active / No access / Access denied"*), but the shipped ladder renders *"Access confirmed"* / *"Included in your institution's access"*. **The implementation is the better one**; the doc should follow it |
| **T3** | **A `Vendor` homonym in b03** | Four strings use *vendor* in the ordinary commercial sense rather than the platform role. **Confined and harmless, but it should not survive consolidation** |

## B.5 · Candidate questions this audit surfaces

**Recorded, not asked.** `12_PM_CLARIFICATIONS_FOR_MONDAY.md` owns the question list and is not edited by this task.

| # | Candidate | Type |
|---|---|---|
| **N-4** | **How do submission revisions relate to production versions?** | 🟠 Possibly design-only, but coupled to `PQ-01` |
| **N-5** | **Is `Discipline` a property of content and `Academic stream` a property of people — or are they the same axis seen twice?** | 🟠 Folded into `PQ-04(b)` |

## B.6 · The one-sentence state of the corpus

> **The vocabulary is in good health everywhere except the noun the product is named after.**
>
> Roles are effectively perfect — six role names, one meaning each, in all five batches, with near-variants actively refuted rather than merely unused. The commercial-prohibition vocabulary is the strongest work in the corpus: *Subscription*, *Licence*, *Seat*, *Plan* and *Price* are independently banned by three batches with matching reasoning, each verifying its own ban programmatically — and when Batch 03 coined **Content Access** to replace *Licences*, **Batch 05 adopted the coinage verbatim**, which is exactly the behaviour you want across a batch boundary.
>
> Against that: **Module (627) and Experiment (266) denote the same object**, split by surface rather than by concept, and Batch 04 ships both **in one sentence**. Two further collisions — `Release` and `Version` — come from batches solving local problems well and globally badly.
>
> **All three are cheap to fix once and expensive to fix after a merge.** That is the whole argument for `13_CONSOLIDATION_SEQUENCE.md`'s ordering, restated in measurements.
