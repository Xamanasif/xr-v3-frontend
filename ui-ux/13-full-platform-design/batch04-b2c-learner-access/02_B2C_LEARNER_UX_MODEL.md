# 02 — The Individual Learner UX Model

**Batch 04 · Individual (B2C) learner access**

---

## 1. The question this batch answers

> **As an individual learner, how do I discover eligible XR learning content, understand what I am getting, obtain access, and then find that content in My Learning?**

The answer has to work for someone who knows nothing about entitlements, licences, tenancy or platform architecture. So the vocabulary on screen is deliberately ordinary:

| Internal concept | What the learner reads |
|---|---|
| Entitlement / licence record | **"You have access"** · **"Included in your learning"** — shortened to **"In your learning"** on the compact catalogue card |
| Creating an entitlement | **"Get access"** |
| Entitlement-bearing product | **"Module"** / **"Bundle"** |
| Automatic licence activation (9.2.1) | *"It appears in My Learning as soon as the payment succeeds — you do not have to activate anything."* |
| Access record | **"Access history"** |

**The word "entitlement" appears nowhere a learner can see.** It is used in this documentation and in code comments only. `qa/ACCESSIBILITY_AND_UX_QA.md` §7 verifies that programmatically, along with "licence", "tenant", "SKU" and every other internal term.

---

## 2. The access spine

Everything in Batch 04 rests on one record:

```
S.access[moduleId] = { via, on, ref }
```

That is the whole model. Six surfaces are **functions of it**, recomputed on every render:

```
                        ┌──────────────────────┐
                        │   S.access map       │
                        │  moduleId → record   │
                        └──────────┬───────────┘
                                   │
      ┌───────────┬────────────┬───┴────┬───────────┬────────────┐
      ▼           ▼            ▼        ▼           ▼            ▼
  Catalogue    Module      Bundle    Access     Outcome     My Learning
  card state   detail      detail    summary    screen         list
```

**Why this matters more than it looks.** Because nothing downstream stores its own copy:

- A bundle is never a special case. It grants **each module it contains** (FRD 6.1.2), and every other surface then recomputes on its own.
- There is no separate My Learning list to keep in step. **Delete an access record and the row goes with it.**
- A failed or unconfirmed payment simply **never writes to the map**, so no screen has to remember to hide anything.
- The "you already have part of this bundle" state was never designed as a case. It **emerged** from the model the moment a learner bought one module that a bundle also contains.

This is the same discipline Batch 03 used for institutional access — one relationship, recomputed everywhere — which is why the two batches converge cleanly.

---

## 3. Information architecture

The individual learner's navigation is the one confirmed in `04_PLATFORM_INFORMATION_ARCHITECTURE.md`:

```
[logo]  Home   My Learning   Explore   Progress                    [Account ▾]
```

**Explore is present because this is the individual context.** The institutional learner does not have it (Divergence 1 · D-04) — a B2B learner must never meet a purchase prompt. There is **no institution chip** in this header (Divergence 2 · FRD 1.3.2) and **no cart control anywhere**.

| Item | In Batch 04 | Note |
|---|---|---|
| **Home** | Signpost only | `LRN-01` is confirmed in the IA but is **not designed in any batch yet**. The screen says exactly that |
| **My Learning** | ✅ Designed | The individual-context variant of `LRN-02` |
| **Explore** | ✅ Designed | Catalogue → detail → get access → outcome |
| **Progress** | Signpost only | Designed in Batch 01 and Batch 02 |
| **Account ▾** | Partly | **Access history** works. Profile and Help are inert. **Sign out** works, because it drives the signed-out demonstration |

**Why the two signposts exist rather than being hidden.** Removing Home and Progress would misrepresent the confirmed navigation; drawing them would invent surfaces Batch 04 has no basis for. A signpost naming exactly where each lives is the only option that is both complete and honest. Both are labelled **PROTOTYPE SIGNPOST — NOT PRODUCT UI** and neither is counted as a Batch-04 design screen.

---

## 4. The journey

```
① EXPLORE ─────────────────────────────────────────── B2C-01
   Search · discipline · delivery type · module or bundle
   Each card already says whether you have it
        │
        ├── already yours ──▶ Go to My Learning        (no purchase path)
        ▼
② DETAIL ──────────────────────────────── B2C-02 / B2C-03
   What it is · what is in it · what it runs on
   One access decision, one amount, one action
        │
        ├── not signed in ──▶ Sign in to continue ──┐   AUTH-B2C
        ▼                                           │
③ GET ACCESS ◀──────────────────────────────────────┘  B2C-04
   What you are getting · which account · the amount
   · how you want to pay
        │
        ▼
④ CONFIRMING ──────────────────────────────────────── B2C-05
   Determinate. "Nothing has been added yet."
        │
        ├─── successful ──────▶ access created ──▶ ⑤   B2C-06
        ├─── not completed ───▶ nothing created  ──▶ retry
        └─── still confirming ▶ nothing created  ──▶ check back
        ▼
⑤ ACCESS CONFIRMED ────────────────────────────────── B2C-06
   Exactly what arrived, listed
        │
        ▼
⑥ MY LEARNING ─────────────────────────────────────── LRN-02
   The same experiments, marked as just added
        │
        ▼
⑦ ─── resources → simulation → assessment → progress ───
       Batch 01 and Batch 02. Not rebuilt here.
```

---

## 5. Two routes, one platform

This is the point of the batch, and the prototype index states it as a figure so a PM can see it without explanation:

| | Institutional learner | Individual learner |
|---|---|---|
| Designed in | **Batch 03** | **Batch 04** |
| Access originates from | The institution holding content access | The learner getting access themselves |
| Reaches the learner through | Eligibility — a stream, a group or a person | A completed payment |
| Sees a catalogue? | ❌ No Explore, no commerce (D-04) | ✅ Explore |
| Header context | Institution name | None (FRD 1.3.2) |
| Empty My Learning says | *"Contact your institution"* | *"Explore modules"* (Divergence 6) |
| **Ends at** | **My Learning** | **My Learning** |
| **From there** | **Identical** — resources → simulation → assessment → progress (PM-09) | **Identical** |

**Different access origin. Same learning platform.** Batch 04 builds no second learning product, and the convergence is visible in the prototype rather than only asserted in a document.

---

## 6. Design assumptions — the reversible register

Every one of these is a **choice Batch 04 made because a source is silent**, not a requirement. Each says what would reverse it and what that would cost.

| # | Assumption | Why it was needed | What would change it | Removal impact |
|---|---|---|---|---|
| **DA-01** | **No cart. Direct `Get access → checkout`.** | The flow has to complete, and something had to be chosen | Source is explicit: *"Whether checkout is single-item or basket-based is **DESIGN-PENDING** — no requirement specifies a cart model."* A PM decision for a basket | **Medium.** Adds a cart surface, a cart state and a multi-item summary. The access spine itself is unaffected — a cart grants the same records |
| **DA-02** | **A non-entitled learner sees the full description, component list, delivery requirements and bundle contents.** | A catalogue that hides what an item contains cannot support a decision | **`OQ-05` OPEN.** If it resolves to "teaser", the component and contents lists reduce or gate | **Low.** One list component and one card region. No flow, state or navigation change |
| **DA-03** | **"Get access" as the primary verb**, rather than "Buy" or "Subscribe" | `OQ-06` leaves the commercial model open. A neutral verb survives every resolution of it | Any PM decision on the commercial model. If it is a one-time purchase, "Buy" becomes available; if it is a term, "Subscribe" does | **Low.** One string in one component |
| **DA-04** | **Nothing is said about how long access lasts.** | **D-24**: duration is data, and where no authoritative data exists, display nothing | Authoritative duration data. D-24 already specifies the behaviour for both outcomes ("Access until…" / "No expiry") | **Low.** D-24 defines the slot; Batch 04 leaves it empty rather than filling it with a promise |
| ~~**DA-05**~~ | ~~Three neutral payment-instrument labels~~ — **WITHDRAWN** | — | An audit of all three FRD editions and every project register found **zero** occurrences of any payment method, mode, option or instrument. The labels were **not source-supported** and have been removed | **Removed.** The payment step is now a statement, not a choice: *"Online payment — this is completed through a secure payment step."* No assumption is needed to justify it |
| **DA-06** | **Access summary and payment step are one screen**, not two | Keeps the flow to its minimum. The reframe inventory splits `B2C-03` Checkout from `B2C-04` Payment processing | A redirect-based gateway (undetermined) would force a real split | **Low–medium.** The screen already separates the summary panel from the method choice, so splitting is a layout change |
| **DA-07** | **An "Access history" surface exists**, listing what was added and when | The screen **is inventoried** — `B2C-06 · Purchases & receipts · Purchase history` in `10_FULL_PLATFORM_SCREEN_INVENTORY.md` (NEW, P3), `Account → Purchases` in the reframe IA, and `C17` in the journeys register (🟡 Partial). **But no FRD requirement mandates a history surface** — a search for *purchase history*, *transaction history* and *order history* across all three editions returns zero. Inventoried ≠ required, so this is an assumption, not a citation | A PM decision on what a buyer receives, or on whether the surface is wanted at all. **No document, receipt or invoice is offered** — that is PRODUCT-PENDING | **Low.** One list screen and one account-menu item |
| **DA-08** | **The account menu opens**, carrying Access history and Sign out | The confirmed IA puts Purchases under Account. Batch 01 and Batch 03 render this control as visual-only, but here two real destinations live in it. It provides **navigation and handoff only** — the four entries are Access history, Profile (inert), Help (inert) and Sign out. **No account deletion, payment profile, saved cards, subscription management, password policy or account-merge rule anywhere** | Nothing pending — this is a straightforward reading of the IA | **Low.** One menu component |
| **DA-09** | **Home and Progress are shown as signposts** rather than hidden or drawn | Showing the confirmed navigation intact without inventing surfaces | Home being designed in a later batch | **None.** Deleting the signpost and pointing the item at the real screen is a one-line change |
| **DA-10** | **A partly-held bundle is shown but not sold.** No amount, no Get access, checkout blocked at the route; its remaining modules are offered **individually** at their own module amounts (FRD 6.1.1, confirmed) | The state is reachable, and **every** way of completing the transaction asserts an unestablished rule — full price asserts "no credit for what you own", anything less asserts proration or a discount. There is no neutral price | **`Q-45`** on the existing register (*"a purchased bundle contains a module the Student already owns"*), aliased here as `OQ-B4-01`. **OPEN** | **Low.** One panel branch, one route guard, one contents-row variant. **No pricing logic exists, so none has to be removed.** If the decision is "charge full price", delete the guard — the normal bundle path already works |
| **DA-11** | **The catalogue offers four controls**: search, discipline, delivery type, item type | Discovery has to work. These four are each grounded — discipline and delivery type in FRD 1.2.x and the content model, item type in 6.1.1/6.1.2 | A PM decision on catalogue taxonomy | **Low.** Each control is independent; removing one removes one `<select>` |
| **DA-12** | **`Reset demo` returns to the exact seed**, and prototype state is held in `sessionStorage` | Reviewers need a repeatable demo | Not applicable — prototype-only mechanics | **None.** Not product behaviour |
| **DA-13** | **The learner may reach the catalogue and product detail while signed out**; the account is required only at Get access | A catalogue that demands sign-in before it can be seen would answer `OQ-05` and the authentication model at once | `OQ-05` and `QX-10` | **Low.** The gate moves from the Get-access action to the route |
| **DA-14** | **Nine sample modules across three disciplines, and two bundles** | Enough to make filtering meaningful without becoming a marketplace | Real catalogue content | **None.** Sample data |
| **DA-15** | **A module that also appears in a bundle says so** on its detail screen | A real decision the learner is entitled to make | Nothing pending | **Low.** One card. **No comparison and no saving is claimed** |

**Scope of these IDs.** `DA-nn` is numbered **within this batch**, exactly as Batch 01 (`DA-01`–`DA-06`) and Batch 03 (`DA-01`–`DA-15`) numbered theirs. A `DA-nn` in this document always means the Batch-04 one.

---

## 7. What Batch 04 deliberately does not decide

A programmatic search across every route (`qa/ACCESSIBILITY_AND_UX_QA.md` §7) confirms each of these.

| Open | How the design stays truthful |
|---|---|
| The B2C commercial model (`OQ-06`) | **No** subscription, monthly, annual, plan, tier, membership, premium, pro, renewal, expiry or cancellation anywhere. The verb is "Get access" |
| Cart or no cart | **No cart.** `DA-01`, reversible — never described as required |
| Payment provider | **No** provider, gateway, card network or redirect named. `DA-05`, TECHNICAL-PENDING |
| Currency, tax, price presentation | One plain amount, marked sample. **No** tax line, breakdown, discount, coupon or saving |
| Refund / cancellation | **Absent entirely.** No source states any rule |
| Receipt / invoice | Access history lists **what and when**. **No document offered** |
| Direct course purchase (`QP-28`) | **No course is an offering.** Equally, **no copy prohibits it** — absence of a requirement is not a prohibition |
| Who configures a pure-B2C assessment | Detail screens say a module *includes an assessment*. **Who configured it is never stated.** No learner-authored assessment, no AI-generation claim, no new role |
| Certification | **Nothing.** Phase 2 (PM-12) |
| Authentication | A handoff that **collects nothing and names no provider** |
| XR delivery mechanism | Device lines are decision information, marked as examples. **Mechanism-neutral** (`QT-01`) |
| Access duration | **Nothing said.** D-24 |
| Institutional access | **No institutional surface.** Batch 03 owns it |
| Seats, caps, quotas | **Nothing.** `OQ-03` |

**Cited as confirmed, so it is not mistaken for an assumption:** a bundle entitles the learner to every module it contains, each reachable individually (**6.1.2**) · a successful payment activates access with no further learner action (**9.2.1**) · a purchased module appears in My Learning immediately and is reachable from there (**9.2.2**) · success, decline and indeterminate outcomes are each designed states (**9.1.x**) · a module is one XR simulation and may carry resources and an assessment (**3.1.1, 3.1.2**) · self-registration is the B2C origin and creates no role but Learner (**4.1.1**).
