# Batch 04 — Individual (B2C) Learner Access

**XR Simulation Learning Platform · Full-Platform UI/UX Design — Batch 04**
Branch `uiux/full-platform-design` · 2026-08-27 · **Figma deferred — this package is reviewable entirely in the browser.**

---

## The question this batch answers

> **As an individual learner, how do I discover eligible XR learning content, understand what I am getting, obtain access, and then find that content in My Learning?**

```
PUBLISHED ELIGIBLE OFFERING → LEARNER CHOOSES TO GET ACCESS → CHECKOUT / PAYMENT
        → SUCCESSFUL TRANSACTION → ACCESS CREATED → CONTENT APPEARS IN MY LEARNING
```

**This is the counterpart of Batch 03.** Batch 03 designed the institutional route to My Learning; Batch 04 designs the individual route. Both end in the same place, and from there the learning experience designed in Batches 01 and 02 is identical.

> For an institution learner, access arrives from institutional eligibility — **Batch 03**.
> For an individual learner, this batch demonstrates the B2C route: discover content, obtain access, and have the same learning content appear in My Learning.
> **Both routes converge into the same learner experience** — and the prototype shows that, on the index, as a figure.

---

## Role model

**The formal role is `Learner`.** B2C is a commercial and access *context*, not a role — recorded in `PM_CONFIRMED_BASELINE_2026-08-18.md` §B:

> **B2C Individual Learner** is a **business/user context**, not an eighth role.

No Consumer, Customer, Subscriber, Buyer or B2C-Admin role is introduced. **No new formal role of any kind.**

---

## Scope

**10 base product screens · 24 important states · 6 end-to-end flows · 15 routes.**
All six inventoried `B2C-01` … `B2C-06` screens, plus `LRN-02` in the individual context, an experiment handoff, and a minimal authentication handoff.

| Area | What it answers |
|---|---|
| **Explore** | What can I learn, what does it run on, what do I already have, what can I get? |
| **Module detail** | What is this, what is in it, what does it need, do I already have it? |
| **Bundle detail** | Exactly what does this contain, and exactly what would I gain? |
| **Get access** | What am I getting, which account receives it, how much, and one action |
| **Payment outcomes** | Succeeded · not completed · still confirming — and what each means for access |
| **Access history** | What was added to this account, and when — inventoried as `B2C-06`, classified `DA-07` |
| **My Learning** | The same content, arrived — and where the rest of the journey is designed |

Details: [06_SCREEN_INVENTORY.md](06_SCREEN_INVENTORY.md).

---

## The one idea to take away

Everything rests on a **single record**:

```js
S.access[moduleId] = { via, on, ref }
```

Catalogue card state, module detail, bundle detail, access summary, outcome screen and My Learning are **all functions of that map**. Which is why:

- **A bundle is not a special case.** It grants each module it contains (FRD 6.1.2 — *"each reachable individually"*), and every other surface recomputes on its own.
- **My Learning has no list of its own.** Nothing can appear there without an access record behind it.
- **Only success writes.** A declined or unconfirmed payment never touches the map — so no screen has to remember to hide anything.
- The **"you already have part of this bundle"** state was never designed as a case. It **emerged** — and because no bundle-overlap price can be set without asserting a rule (`Q-45`, open), that bundle is **shown but not sold**: no amount, checkout blocked, remaining modules offered individually under the confirmed FRD 6.1.1 path.

---

## What this batch deliberately does not decide

**Nothing here converts an open decision into a requirement.** A programmatic search across all **31 route/state combinations** found **zero** occurrences of *subscription, monthly, annual, renew, cancel, refund, membership, tier, premium, seat, quota, licence, plan, cart, basket, tax, GST, discount, coupon, certificate, expiry, SKU, tenant*, any payment provider, or any authentication provider anywhere a user can see.

| Open | How the design stays truthful |
|---|---|
| **`OQ-06` — the B2C commercial model** | The verb is **"Get access"**. **Nothing is said about how long access lasts.** No recurrence, term, plan or renewal anywhere |
| **Cart or no cart** | The source records this as **DESIGN-PENDING** — *"no requirement specifies a cart model"*. Batch 04 uses direct checkout and registers it as **`DA-01`, reversible**. It is never called required |
| **`OQ-05` — browsing non-entitled content** | The catalogue *route* is source-supported (Core FRD Table 14 ②). **How much detail** a non-entitled learner sees is **`DA-02`, reversible — not PM-confirmed** |
| **Payment provider — and any payment method** | **None named.** 9.1.1 is TECHNICAL-PENDING, `C-05` forbids inventing the gateway, `Q-34` is open, and **zero payment methods appear in any source**. The step is a statement — *"Online payment"* — not a choice |
| **Currency, tax, price presentation** | One plain amount, marked sample. **No tax line, breakdown, discount or saving** — 9.1.2 is PRODUCT-PENDING |
| **Refund / cancellation** | **Absent entirely.** No source states any rule |
| **Receipt / invoice** | Access history lists **what and when**. **No document offered** |
| **`QP-28` — direct course purchase** | **No course is an offering — and no copy says a course cannot be bought.** Absence of a requirement is not a prohibition |
| **Who configures a pure-B2C assessment** | A module *"includes an assessment"*. **Who configured it is never stated** (PM-15) |
| **Authentication** | A handoff that **collects nothing and names no provider** |
| **Certification** | **Nothing** — Phase 2 (PM-12) |

**14 live design assumptions** (`DA-05` withdrawn) are registered with their reversal conditions and impact in [02_B2C_LEARNER_UX_MODEL.md §6](02_B2C_LEARNER_UX_MODEL.md). None is presented as a requirement.

**Cited as confirmed, so it is not mistaken for an assumption:** a bundle entitles the learner to every module it contains, each reachable individually (**6.1.2**) · a successful payment activates access with no further learner action (**9.2.1**) · a purchased module appears in My Learning immediately and is reachable from there (**9.2.2**) · success, decline and indeterminate outcomes are each designed states (**9.1.x**) · a module is one XR simulation and may carry resources and an assessment (**3.1.1, 3.1.2**) · self-registration is the B2C origin and creates no role but Learner (**4.1.1**).

---

## Where things are

| Item | Location |
|---|---|
| **Interactive prototype** | [`prototype/batch04-prototype.html`](prototype/batch04-prototype.html) — open it directly, no server needed |
| Wireframes | [`wireframes/batch04-wireframes.html`](wireframes/batch04-wireframes.html) |
| Source audit, scope, open questions | [01_SOURCE_AND_SCOPE.md](01_SOURCE_AND_SCOPE.md) |
| UX model, IA, **assumption register** | [02_B2C_LEARNER_UX_MODEL.md](02_B2C_LEARNER_UX_MODEL.md) |
| Catalogue and product model | [03_CATALOGUE_AND_PRODUCT_MODEL.md](03_CATALOGUE_AND_PRODUCT_MODEL.md) |
| Access, checkout, entitlement | [04_CHECKOUT_AND_ENTITLEMENT_MODEL.md](04_CHECKOUT_AND_ENTITLEMENT_MODEL.md) |
| Components | [05_COMPONENT_EXTENSIONS.md](05_COMPONENT_EXTENSIONS.md) |
| Screens, states, flows | [06_SCREEN_INVENTORY.md](06_SCREEN_INVENTORY.md) |
| **QA, accessibility, safety audit** | [qa/ACCESSIBILITY_AND_UX_QA.md](qa/ACCESSIBILITY_AND_UX_QA.md) |
| Screenshots | `qa/screenshots/` — 31 files (26 at 1440 px, 5 at 1280 px) |
| State patches | `qa/seed-states/` — 13 files |
| Figma | [FIGMA_HANDOFF_LATER.md](FIGMA_HANDOFF_LATER.md) — deferred |

---

## Reviewing it

Open the prototype and start at **`#/index`**. Best at **1440 px**.

| Path | Shows |
|---|---|
| **A** | Discover → get access → My Learning — the core journey |
| **B** | A bundle grants every module it contains, each individually |
| **C** | Something already held — no purchase path anywhere |
| **D** | A payment that does not complete — nothing created, retry available |
| **E** | Search, filter, no results, reset |
| **F** | Signed out — the sign-in handoff |

**Reset demo**, in the prototype strip, restores the seed exactly at any time.

---

## QA result

**No backend, no network request of any kind, no payment provider, no authentication provider, no entitlement service, no AI, no analytics.** Nothing is ever collected — no card field, no password field, no address, no phone.

- ✅ The required end-to-end test (reset → fail → verify nothing created → retry → succeed → verify everywhere → refresh → reset) **passed in full**
- ✅ **1440 px and 1280 px: no horizontal overflow on any of the 15 routes.** Clean down to 560 px
- ✅ **Contrast: zero AA failures** — after correcting an inherited `--text-3` token that was marginally sub-AA across Batches 01–03. **Referred upward; the Batch-01 sheet was not edited**
- ✅ Heading structure, labelling and accessible names clean on all 15 routes
- ✅ Already-held items are blocked **at the route** — forcing the checkout URL renders no payment control
- ✅ Requirement-safety audit: **no accidental requirement** in the shipped package
- ⚠️ Safari `file://`: the document **loads** (verified) and the resource graph satisfies Safari's same-directory constraint, but Safari's rendered DOM **could not be inspected** — Apple Events JavaScript is disabled and this shell holds no screen-recording permission. Stated plainly in [qa §7](qa/ACCESSIBILITY_AND_UX_QA.md)

**12 defects were found and fixed during QA**; all are listed in [qa §9](qa/ACCESSIBILITY_AND_UX_QA.md).

---

## Not modified by this batch

`source/` · `requirements/` · `branding/` · `ui-ux/00-project-context/` · `ui-ux/12-full-platform-reframe/` · Batch 01 · Batch 02 · Batch 03 · Review-005 · Review-006 · every Figma-related artefact.

All were read. **None was changed.**
