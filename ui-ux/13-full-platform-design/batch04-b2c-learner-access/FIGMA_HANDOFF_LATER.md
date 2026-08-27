# Figma Handoff — Later

**Batch 04 · Individual (B2C) learner access**

---

## Status: DEFERRED

Figma transfer remains **paused** (PM-02), as it has been since Batch 01. Nothing was created in Figma for this batch, no Figma MCP tool was called, and no existing Figma-related artefact in the repository was touched.

**No rework is created by this deferral** — the prototype is the reviewable artefact and is reviewable entirely in a browser.

This document records **what would eventually need to transfer**, so that whenever Figma work is authorised it starts from a list rather than from a re-reading.

---

## What would transfer

### Foundations — already exist, nothing new

Batch 04 introduces **no new token**. Colour, type, spacing, radius, elevation and motion all come from the Batch-01 system unchanged.

**One correction to carry across:** `--text-3` should be `#5F6B7A`, not `#6A7686`. The Batch-01 value measures 4.12–4.46 : 1 against the surfaces it is used on — marginally below WCAG AA. This is a **shared-system change affecting Batches 01–04**, not a Batch-04 variant, and should be made once at the token level.

### Components to build — 13

| # | Component | Variants / states |
|---|---|---|
| 1 | **Catalogue card** | Module · Bundle × Not held · Partly held · Held |
| 2 | **Catalogue filter bar** | Default · with active pills · with results count |
| 3 | **Filter pill** | Default · hover · focus (24 × 24 remove target) |
| 4 | **Product hero** | Module · Bundle |
| 5 | **Access panel** | Available · **Partly yours (no amount, not purchasable)** · You have access |
| 6 | **Included-item row** | Component row · Contents row · Held · Not held |
| 7 | **Access summary card** | Single module · Bundle |
| 8 | **Account block** | One state |
| 9 | **Payment step** | One state — a statement, not a choice |
| 10 | **Outcome panel** | Processing · Succeeded · Not completed · Still confirming |
| 11 | **Account menu** | Closed · Open (signed in) · Signed out |
| 12 | **Sign-in handoff panel** | One state |
| 13 | **Convergence figure** | Documentation only — not a product component |

### Screens to compose — 10 + 24 states

The ten base screens and twenty-four important states enumerated in `06_SCREEN_INVENTORY.md`. **Payment outcomes are states of one screen, not three screens** — build them as variants.

### Not to build

- **Home** (`LRN-01`) and **Progress** — the two navigation signposts are prototype scaffolding, not product surfaces. Progress is designed in Batch 01/02; Home is not yet designed anywhere.
- The **prototype index**, the **prototype strip**, and every `PROTOTYPE …` container.
- Any **cart**, coupon, tax, invoice, refund or renewal component. None is established by any source.
- Any **certificate** component. Certification is Phase 2 (PM-12).

---

## Carry these constraints into Figma

Anything transferred must preserve them, or the Figma file will assert requirements the design deliberately avoids.

| Constraint | Why |
|---|---|
| **No cart component** | The cart model is DESIGN-PENDING. `DA-01`, reversible |
| **The verb is "Get access"** | `OQ-06` — the commercial model is open |
| **No statement about how long access lasts** | `D-24` — duration is data; where none exists, display nothing |
| **Every amount labelled sample** | Price presentation is PRODUCT-PENDING (9.1.2) |
| **No payment provider, gateway, card network — or payment method** | 9.1.1 TECHNICAL-PENDING · `C-05` · `Q-34`. Zero payment methods are source-supported; the step is a statement, not a chooser |
| **A bundle amount equals the sum of its component module amounts** | Anything lower implies a discount rule. Bundle pricing logic is PRODUCT-PENDING |
| **A partly-held bundle carries no amount and is not purchasable** | `Q-45` is open; every completion asserts a rule no source establishes |
| **No tax line, discount, coupon or saving** | None is established by any source |
| **No course is purchasable — and no copy says it cannot be** | `QP-28` is NOT-SPECIFIED, and absence of a requirement is not a prohibition |
| **No receipt or invoice document** | What a B2C buyer receives is PRODUCT-PENDING |
| **A module "includes an assessment" — nothing about who configured it** | PM-15 defers pure-B2C operational ownership |
| **No certificate anywhere** | PM-12 — Phase 2 |
| **Device names appear only as examples** | The delivery mechanism is deliberately unselected (PM-05 · `QT-01`) |
| **No institution label in this context** | FRD 1.3.2 — Divergence 2 |
| **Explore exists only in the individual context** | D-04 — a B2B learner must never meet a purchase prompt |
| **Nothing is signalled by colour alone** | Every state carries a word |
| **The learner never reads "entitlement" or "licence"** | Learner-facing language only |

---

## Sequence when Figma resumes

1. **Correct `--text-3` at the token level** — it is a shared-system fix, and doing it first avoids reworking every component.
2. Build components **1 – 6** (catalogue and product). They cover the two screens most likely to be reviewed first.
3. Compose **Explore** and **Module detail** with all their states.
4. Build components **7 – 10** (access and outcome) and compose the access flow.
5. Compose **My Learning** in the individual context — reusing the Batch-01 `LRN-02` frame rather than duplicating it, since only the empty state and the origin column differ.
6. Components **11 – 12** and the remaining screens.
7. The convergence figure last, as documentation.

---

## Prerequisites before any of it starts

| | |
|---|---|
| PM authorisation to resume Figma | PM-02 |
| A decision on the **cart model** | Changes the checkout composition |
| A decision on **`Q-45`** — bundle overlap | Changes whether a partly-held bundle is purchasable at all |
| A decision on the **commercial model** (`OQ-06`) | Changes the primary verb and may add a duration slot |
| A decision on `OQ-05` | Changes how much a non-entitled learner is shown |
| Payment provider selection | Replaces the instrument component wholesale |

**None of the five blocks the design work already done.** Each changes a bounded, named part of it — the impact of every one is recorded in `02_B2C_LEARNER_UX_MODEL.md` §6.
