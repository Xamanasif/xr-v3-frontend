# 03 — Catalogue and Product Model

**Batch 04 · Individual (B2C) learner access**

---

## 1. What can be an offering

Exactly two things, and the source is unambiguous about both:

| Offering | Requirement | Verbatim |
|---|---|---|
| **Module** | **FRD 6.1.1** | *"Individual Module Purchase. Users shall be able to purchase individual simulation modules."* |
| **Bundle** | **FRD 6.1.2** | *"Bundle Purchases. Users shall be able to purchase bundles of multiple modules."* |

### A course is not an offering

**D-21** states it as a prohibition, and the FRD v5 accuracy corrections state it as an absence:

> Phase-1 purchase requirements explicitly define individual module and bundle purchasing. **Direct course purchase is not specified** and is not included in the current design unless subsequently approved. Classified NOT-SPECIFIED / PRODUCT-PENDING (`QP-28`).
> **No source prohibits course purchase. Absence of a requirement is not a prohibition.**

Batch 04 therefore does the one thing that is correct under both readings: **no course exists as an offering, and no copy anywhere says a course cannot be bought.** There is no course record, no course price, no course action, and no sentence to retract if `QP-28` later resolves in favour of course purchase.

A course remains a valid *educational* grouping (FRD 3.2.1) — it simply is not a product, and Batch 04's catalogue has no reason to show one.

---

## 2. The object graph

```
        offering                                module
  ┌──────────────────────┐              ┌─────────────────────────┐
  │ id                   │              │ id                      │
  │ kind: module|bundle  │──────────────▶ name                    │
  │ module   (if module) │   grants     │ discipline              │
  │ modules[] (if bundle)│              │ fmt: Web|VR|MR|AR       │
  │ amount   SAMPLE      │              │ summary                 │
  └──────────────────────┘              │ pdfs · videos           │
                                        │ assessment: bool        │
                                        └─────────────────────────┘
```

**A bundle holds module ids, not copies.** That single fact is what makes §27 of the brief hold: the bundle detail list, the access summary, the outcome list and the My Learning rows are all generated from `offering.modules`, so what was promised and what arrived cannot drift apart. There is no separately maintained list anywhere.

### What an offering record deliberately does not carry

No term, duration, expiry, renewal date, plan, tier, seat count, quota, discount, coupon, tax rate, or SKU. Each of those would assert something no source establishes.

---

## 3. Access state — derived, never stored on the offering

```js
offeringAccess(o) → { state: 'none' | 'some' | 'all', have, total, missing }
```

| State | Meaning | Where it can occur | Learner reads |
|---|---|---|---|
| `none` | The learner holds none of it | Module or bundle | **"Available to get access"** |
| `some` | The learner holds part of it | **Bundle only** | **"N of M already yours"** — and the bundle carries **no amount**, because it is not offered as a single purchase (§7) |
| `all` | The learner holds all of it | Module or bundle | **"You have access"** |

`some` was never designed as a case. It **falls out of the model**: get access to Surveying on its own, then open the Geotechnical bundle that also contains it, and the bundle reports 1 of 3. Nothing is hard-coded for it.

---

## 4. The catalogue card

A card is a **decision aid, not a dashboard**. Six fields, one action:

```
┌────────────────────────────────────────────┐
│ [Module]  [Available to get access]        │  type · access state
│                                            │
│ Surveying — Total Station Basics           │  title      ┐ fixed-height
│ Civil Engineering                          │  discipline ┘ block
│                                            │
│ Set up and level a total station, take     │  one-line learning summary
│ angle and distance observations, and       │
│ close a simple traverse.                   │
│                                            │
│ [Web]                                      │  facts — delivery type,
│ ─────────────────────────────────────────  │  and for a bundle its
│ ₹1,800                    [View details]   │  module count
│ SAMPLE AMOUNT                              │  amount · one action
└────────────────────────────────────────────┘

A bundle carries the same skeleton — its kind chip reads **Bundle**, and its
module count sits in the facts row as **[⬡ 3 modules]** beside the delivery
badges. Keeping the kind chip to one word is what lets a bundle's top row stay
on a single line beside the access badge, exactly as a module's does.
```

**When the learner already has it, the card changes shape rather than merely recolouring:**

```
┌────────────────────────────────────────────┐
│ [Module]  [✓ You have access]              │
│ Soil Mechanics — Direct Shear Test         │
│ …                                          │
│ ─────────────────────────────────────────  │
│ In your learning           [Go to My Learning]│   ← no amount, no purchase action
└────────────────────────────────────────────┘
```

**The amount is replaced, not struck through or greyed.** There is nothing to buy, so nothing priced is shown — this is the card-level half of the duplicate-access prevention described in `04_CHECKOUT_AND_ENTITLEMENT_MODEL.md` §6.

### What a card deliberately omits

No rating, no review count, no enrolment number, no "popular" or "new" flag, no progress bar, no instructor, no duration, no thumbnail, no badge count. Each would either be invented data or turn the card into a dashboard.

---

## 5. Discovery

Four controls. Not dozens.

| Control | Values | Grounded in |
|---|---|---|
| **Search** | Free text over title, discipline, summary, and — for a bundle — its module names | Table 14 step 2 |
| **Discipline** | Derived from the catalogue, never a fixed list | The content model |
| **Delivery type** | Web browser · VR headset · MR device · Mobile AR | **FRD 1.2.1 – 1.2.4** |
| **Type** | Modules and bundles · Modules only · Bundles only | **FRD 6.1.1 / 6.1.2** |

**Bundle matching is by content, not by label.** Filtering to *VR headset* includes the Geotechnical bundle because one of its modules is VR. A learner filtering for what their headset can run should not lose a bundle that contains exactly that.

**Every filter is removable individually.** Active filters appear as pills with their own remove control, plus a single *Clear filters*. The result count reads `N items of 11` whenever a filter is active, so the learner always knows how much of the catalogue they are not seeing.

**No speculative filters.** No price range, no popularity, no duration, no difficulty, no "new this month", no availability toggle — each would need data or a policy that does not exist.

---

## 6. Module detail

Answers the seven things a learner needs, and stops.

| Question | On screen |
|---|---|
| What is it? | Title, discipline, one paragraph |
| What is included? | **One XR simulation** (FRD 3.1.1) · readings · videos (3.1.2) · *an assessment*, where the module has one |
| What does it run on? | Delivery badge and a plain device line |
| Do I already have it? | The access state, in the panel and in the kicker |
| What would I be getting? | The amount, marked sample |
| How do I get it? | **Get access** — or **Go to My Learning** if it is already yours |
| Is it in a bundle too? | Listed, with the bundle's amount. **No comparison, no saving claimed** |

### Three things it does not do

- **No assessment settings.** It says a module *includes an assessment* and stops. Question count, timing, marking, pass mark and attempts are Batch 02's, are configuration-driven (PM-08), and **who configures them for a pure-B2C learner is deferred by PM-15** — so nothing here implies an owner.
- **No certificate.** Certification is **Phase 2** (PM-12). There is no certificate, no credential and no completion award anywhere in Batch 04.
- **No duration promise.** Per **D-24**, nothing is said about how long access lasts — not "lifetime", not "one-time", not a term.

---

## 7. Bundle detail

A bundle is **exactly its contents**, and the screen is built that way:

| Region | Content |
|---|---|
| Hero | Name, discipline, module count, the delivery types across its contents |
| Access panel | State · amount · one action |
| **What is in this bundle** | Every module, generated from the bundle record — name, delivery badge, device line, and **"Already yours"** where it applies |
| Partly-held notice | Only when `state = 'some'` — see below |
| What you need to run these | Grouped by delivery type, with how many modules use each |

**The contents list is the promise.** It is the same component the access summary and the outcome screen use, so a learner sees the identical list at every step — catalogue, detail, checkout, confirmation, My Learning.

### The partly-held case — shown, but not sold

When the learner already holds part of a bundle, the bundle **is not offered as a single purchase**:

> **Some content in this bundle is already in your learning**
> You have 1 of these 3 already, and what you have stays exactly as it is. How a bundle is priced when you already hold part of it has not been decided, so this bundle is not offered as a single purchase for you — the 2 modules you do not have are available individually below.

The access panel shows **no amount**, offers **no Get access**, and the checkout route is **blocked** for that bundle. Each module the learner does not have is offered on its own, at its own module amount — which is **FRD 6.1.1**, fully confirmed.

**Why not just charge the listed amount?** Because every way of completing it asserts a rule no source establishes: full price asserts *"no credit for what you own"*; anything less asserts a proration, discount or credit rule. There is no neutral price, so none is set.

This is not a new question — it is **`Q-45`** on the existing register (*"What happens when a purchased bundle contains a module the Student already owns?"*, `OPEN_QUESTIONS.md`, product decision, tied to `A-37`). `OQ-B4-01` is the Batch-04 alias. Handling is **`DA-10` — DESIGN ASSUMPTION, REVERSIBLE**.

**A bundle the learner holds none of is completely unaffected** — it prices and completes exactly as before.

### No bundle economics are asserted — including by arithmetic

**Each sample bundle amount is exactly the sum of its component module amounts.**

| Bundle | Contents | Sample amount |
|---|---|---|
| Geotechnical Engineering Bundle | 2,400 + 1,800 + 1,800 | **₹6,000** |
| Mechanical Engineering Bundle | 2,600 + 2,400 + 2,200 | **₹7,200** |

An earlier draft priced them **below** the sum (₹5,400 and ₹6,400). No copy called that a saving — but a reader who can add up the component amounts on the same screen would infer a discount rule from the arithmetic alone. **Summing removes the inference entirely**: it asserts no pricing formula in either direction, because it is arithmetic rather than a policy.

**Bundle pricing logic = PRODUCT-PENDING.** All amounts remain **SAMPLE DESIGN DATA**.

**No copy describes a bundle as a saving, a discount, a deal or an offer**, and no "you save ₹X" appears anywhere. This is not stylistic caution: bundle creation (**6.3.1**) and pricing configuration (**6.3.2**) are **Phase 2**, and the FRD records the resulting tension explicitly —

> Bundles are purchasable in Phase 1, but bundle creation (6.3.1) and pricing configuration (6.3.2) are Phase 2. **Who creates bundles and sets prices in Phase 1 is a PENDING DECISION**; no Phase-1 bundle-authoring surface is invented.

---

## 8. Delivery and device information

Enough to decide, and no more. The full compatibility and delivery experience is Batch 01's.

| Format | Catalogue badge | Device line on detail |
|---|---|---|
| **Web** | `Web` | *"Runs in a web browser — no XR hardware needed"* |
| **VR** | `VR` | *"VR headset required — e.g. Meta Quest"* |
| **MR** | `MR` | *"MR device required — e.g. Ajna Lens"* |
| **AR** | `AR` | *"Android or iOS mobile device required"* |

**Device names are FRD examples shown as examples.** Meta Quest appears in FRD 1.2.2 and Ajna Lens in 1.2.3 / 2.1.2 — both as illustrations, and both written here with *"e.g."*. Nothing claims a supported-device list, and **no copy asserts how an experiment reaches a device**: the delivery mechanism is deliberately unselected (PM-05 · `QT-01`), and Batch-04 wording stays neutral about it.

For a non-web module the detail screen adds one line: *"Once it is in your learning, the platform makes it available on your supported device"* — which is exactly what **FRD 2.2.2 / 10.1.2** require and says nothing about how.

---

## 9. Sample data

**Every content name, summary, discipline, format, amount, date and reference in this batch is SAMPLE DESIGN DATA.**

The nine modules and their formats are carried over unchanged from the Batch-01 and Batch-03 sample set wherever they already existed — *Soil Mechanics — Direct Shear Test*, *Geotechnical — Consolidation Test*, *Surveying — Total Station Basics*, *Fluid Mechanics — Bernoulli Flow Visualisation*, *Strength of Materials — Torsion Test*, *Thermodynamics — Heat Exchanger Analysis* — so the same experiment reads as the same experiment across the whole platform design. Three more (*Structural Analysis — Beam Deflection*, *Machine Design — Gear Train Assembly*, *Electrical Machines — Induction Motor Test*) were added to give discipline and delivery-type filtering something real to act on, including the only AR item.

### How amounts are handled

| | |
|---|---|
| Where they appear | Catalogue card · detail access panel · access summary · access history |
| How they are marked | A `SAMPLE AMOUNT` tag beside the figure, and `SAMPLE DESIGN DATA — AMOUNTS INCLUDED` in the prototype strip on every route |
| What is **not** shown | Tax line · breakdown · strike-through · discount · saving · coupon field · instalment · recurrence · currency selector |
| Why a figure is shown at all | The access summary has to answer *"what am I paying?"* to be a real checkout. **FRD 9.1.2** puts currency, tax treatment and price presentation in PRODUCT-PENDING, so the figure is rendered as plainly as possible |

**The marking is deliberately subtle.** A quiet tag beside the figure and one label in the prototype strip — not a warning banner on every screen. The internal documentation carries the emphasis; the product surface stays readable.
