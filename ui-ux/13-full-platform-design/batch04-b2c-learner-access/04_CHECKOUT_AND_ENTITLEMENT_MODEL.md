# 04 — Access, Checkout and Entitlement Model

**Batch 04 · Individual (B2C) learner access**

---

## 1. The stable shape

The commercial model is open (`OQ-06`), so Batch 04 is designed around the part of the flow that holds **whatever `OQ-06` resolves to**:

```
PUBLISHED ELIGIBLE OFFERING          module (6.1.1) or bundle (6.1.2)
        ↓
LEARNER CHOOSES TO GET ACCESS        one action, neutral verb
        ↓
CHECKOUT / PAYMENT                   what · which account · how much · pay
        ↓
SUCCESSFUL TRANSACTION               success · decline · indeterminate  (9.1.x)
        ↓
ACCESS CREATED                       automatic, no learner action        (9.2.1)
        ↓
CONTENT APPEARS IN MY LEARNING       immediately, and reachable          (9.2.2)
```

Every step of that chain except the *commercial characterisation* of step 2 is source-confirmed. That is why the design can be complete while `OQ-06` stays open: the shape is settled, only the label on the transaction is not.

---

## 2. The cart decision

**Batch 04 has no cart. `Get access` goes straight to a single-item access summary.**

### Why

The source is explicit that this is not settled:

> **Checkout · 6.1.x · UNCHANGED-FRD** — *The purchase must complete.* **Whether checkout is single-item or basket-based is DESIGN-PENDING — no requirement specifies a cart model.**

The FRD v5 accuracy corrections go further and name "a cart-free checkout" as one of three inherited design positions that were **wrongly presented as requirements** and have been relabelled DESIGN-PENDING:

> All three were legitimate design inferences from earlier work, but **none is stated by a source**.

So a cart-free checkout is a *defensible inherited position*, not a requirement — and Batch 04 records it as exactly that.

### Classification

> ### `DA-01` — **DESIGN ASSUMPTION, REVERSIBLE**
> **Direct single-item access, no persistent cart.**
> **This is not a requirement and is not PM-confirmed.** No source specifies a cart model. Chosen because the flow must complete and a single-item path is the smaller of the two claims — it adds no surface, no state and no vocabulary that a later cart decision would have to unpick.
> **Reversal:** a PM decision that checkout is basket-based.
> **Impact: MEDIUM.** Adds a cart surface, a cart state and a multi-item summary. **The access spine is unaffected** — a cart would grant the same `S.access` records through the same code path.

Nowhere in the package is a cart described as unnecessary, prohibited or resolved.

---

## 3. The access summary (`B2C-04`)

One screen, five answers:

| Question | Where |
|---|---|
| **What am I getting?** | Named item, its type, and — for a bundle — every module it would add, generated from the bundle record |
| **What is included?** | The same contents component used on the detail screen |
| **How much?** | One figure in the summary panel, marked `SAMPLE AMOUNT` |
| **Which account gets it?** | Name and e-mail, in an explicit account block |
| **How do I confirm?** | One primary action: *"Pay ₹X and get access"* |

### What is deliberately absent

**No** cart · coupon or promo field · promotional code · loyalty points · financing · instalments · tax line or tax logic · invoice workflow · saved cards · billing address · address book · gift option · recurring toggle · term selector · renewal notice · cancellation link · refund note.

Each would assert something no source establishes. §36 of the requirement-safety audit verifies their absence programmatically.

### The account block is not decoration

**FRD 9.2.1** requires that a successful payment activates access *"and links it to the user account"*. Showing which account is receiving the access is the learner-facing half of that requirement — and it is why the sign-in handoff exists at all (§7).

---

## 4. Payment representation

### No payment method is offered, because none is source-supported

**Audit result.** A search across the whole v5 requirement set — `Core frd`, `TL frd` and `Detailed frd` — returns **zero** occurrences of *payment method*, *payment mode*, *payment option*, *payment instrument*, *card*, *debit card*, *credit card*, *netbanking*, *UPI*, *wallet*, *bank transfer*, *NEFT*, *IMPS* or *RTGS*. The same search across every project register (`DECISIONS.md`, `ASSUMPTIONS.md`, `OPEN_QUESTIONS.md`, the PM baseline and update, and the Review-006 reframe) returns **zero** as well.

**No payment method is required by any source.** What the source does say:

> **FRD 7.9 — Payment and Billing.** *"No payment provider is selected, and no currency, tax, refund or invoice rule is invented by this draft."*

> **FRD 9.1.1 — acceptance criterion.** *"A domestic purchase completes through a **provider-neutral payment step** whose success, decline and indeterminate outcomes are all designed."*

> **FRD 9.1.1 — clarification.** *"No gateway is selected. **Redirect versus embedded checkout is also undetermined.** PENDING DECISION."*

> **Constraint `C-05`** forbids inventing the gateway. **`Q-34`** — *"Which payment gateway, and what is the integration pattern?"* — is **OPEN**.

### The correction made

An earlier draft of this batch offered three sample instrument labels — *Card*, *Bank transfer*, *Another payment method*. **Those were not source-supported and have been removed.** Even labelled as samples, a method chooser implies that the platform will offer methods, and that these are the categories.

The payment step is now a **statement, not a choice**:

```
┌── Payment ───────────────────────────────────────────────┐
│  🔒  Online payment                                      │
│      This is completed through a secure payment step.    │
│                                                          │
│  ℹ No payment provider, gateway, card network or payment │
│    method has been selected for the platform, so this    │
│    step is deliberately neutral. Nothing is collected    │
│    here.                                                 │
└──────────────────────────────────────────────────────────┘
```

| | |
|---|---|
| Named providers | **None.** No Razorpay, Stripe, PayPal, UPI provider, bank or card network |
| Named methods or instruments | **None.** No card, netbanking, wallet or transfer |
| Redirect vs embedded | **Neither implied.** The wording is *"completed through a secure payment step"* — not *"you will be taken to…"*, which would hint at a redirect |
| Selection control | **None.** There is nothing to choose, so there is no radio group, no `<fieldset>`, and no `method` field in transaction state |
| Data collected | **None.** No card field, no CVV, no bank selector, no address, no phone |
| Network activity | **None.** No fetch, no XHR, no SDK, no external script |

**This satisfies the acceptance criterion exactly** — a provider-neutral payment step whose three outcomes are each designed — without asserting anything the source leaves open.

### The reviewer controls remain

Reaching all three outcomes still requires a way to choose one. That control sits in a dashed **`PROTOTYPE CONTROL — NOT PRODUCT UI`** container directly below the payment step, offering *Successful · Not completed · Still confirming*. It is the only interactive element in the payment area, and it is unmistakably not product UI.

> ### `DA-05` — **superseded**
> The former "three neutral instrument labels" assumption is **withdrawn**. Nothing replaces it: the neutral payment step asserts no product decision, so no assumption is required to justify it. `DA-05` is retained as a register entry recording the withdrawal.

---

## 5. Payment outcomes

**FRD 9.1.x requires all three.** The Review-006 screen inventory records `B2C-05` as carrying exactly these states: *Success · declined · indeterminate*.

| State | Heading | Access created? | What it says | What it offers |
|---|---|---|---|---|
| **Processing** | *Confirming your payment* | — | *"**Nothing has been added to your learning yet** — please do not close this page."* | Determinate progress: Sent → Confirming → Access |
| **Success** | *It's yours — access added* | ✅ **Yes** | Exactly what arrived, listed | Go to My Learning · Keep exploring · reference + date |
| **Not completed** | *Payment not completed* | ❌ **No** | *"…so **nothing has been added to your learning** and no amount has been taken."* | **Try again** · Back to details |
| **Still confirming** | *Still confirming your payment* | ❌ **No** | *"This payment has not been confirmed yet. **Nothing has been added to your learning so far.**"* | Check My Learning · Back to details |

### Every one of them states the access consequence

That is the rule the failure copy is built on: a learner must never have to guess whether they now own something. Each state says plainly whether access exists, and the two negative states say so in bold.

### Failure copy — what it does and does not claim

**Does:** access was not granted · no amount was taken · trying again starts a fresh payment · your learning is unchanged and you can verify that in My Learning.

**Does not:** invent a decline reason, a bank rule, a retry limit, a cooling-off period, a hold, a reversal timeline, or a support path.

### The indeterminate state — deliberately incomplete

The outcome is required; **its operational handling is specified nowhere**. So the screen states the position and stops:

> *"You do not need to activate anything. Check My Learning — if the experiment is there, the payment went through. If it is still not there and you have not been charged, you can start again."*

The first sentence is **FRD 9.2.1** restated in learner language (activation is automatic). Nothing else is asserted. The screen carries an `OUTCOME HANDLING PENDING` marker so a reviewer can see the gap is deliberate. Recorded as **O-12**.

---

## 6. Duplicate access is prevented at the route, not hidden on the card

Three layers, and the third is the one that matters:

| Layer | Behaviour |
|---|---|
| **Catalogue card** | An item the learner has shows **"You have access"**, replaces the amount with *"In your learning"*, and offers **Go to My Learning**. There is no purchase action to click |
| **Detail screen** | The access panel switches to the *have* variant: **no amount, no Get access**, one action — Go to My Learning |
| **Checkout route** | `viewCheckout()` computes access state on entry and **returns the "You already have this" screen** before any summary or Pay control is rendered |
| **Checkout route — partly-held bundle** | The same guard returns **"Some of this bundle is already yours"** for `state === 'some'`, so a bundle the learner partly holds also cannot reach a payment control. See §6a |

The third layer means that even **forcing the URL** `#/get-access/o_shear` for an already-held item cannot reach a payment control. Verified in QA: on that route `document.getElementById('pay-btn')` is `null`.

**No refund, upgrade, re-purchase, extend, transfer or gift path is invented** — none is established by any source.

---

## 6a. The partly-held bundle — `Q-45` / `OQ-B4-01`, OPEN

The access model makes one case reachable that no source addresses: **a bundle containing a module the learner already holds.**

This is not a new question. It is already on the register:

> **`Q-45` — What happens when a purchased bundle contains a module the Student already owns?**
> `ui-ux/01-requirements/OPEN_QUESTIONS.md` — classified **Product decision**, tied to `A-37`.

`OQ-B4-01` is the Batch-04 alias for it, not a new question.

### Why the bundle cannot simply be sold at its listed amount

Every way of completing the transaction asserts a rule the source does not establish:

| Completing it by… | Asserts |
|---|---|
| Charging the full bundle amount | *"You get no credit for what you already own"* |
| Charging less | A proration, discount or credit rule |
| Charging for the missing modules only | A per-module unbundling rule |
| Refusing and offering a refund path | A refund rule — and **no refund rule exists anywhere in the FRD** |

There is no neutral price. So Batch 04 does not set one.

### What the design does instead

| | |
|---|---|
| **The overlap is shown**, not hidden | Catalogue badge *"N of M already yours"* · detail state *"Partly yours already"* · per-module *"Already yours"* marks |
| **No amount is shown for that bundle** | Neither on the card nor in the access panel. It is not being offered as a single purchase, so it carries no price |
| **The bundle cannot be completed** | Blocked at the **route** — forcing `#/get-access/<bundle>` renders no payment control |
| **A confirmed route is offered instead** | The modules the learner does not have are offered **individually**, each at its own module amount — which is **FRD 6.1.1**, fully confirmed |
| **A marker states the gap** | `BUNDLE OVERLAP PRICING PENDING` |
| **The no-overlap bundle flow is untouched** | A bundle the learner holds none of prices and completes exactly as before |

**Nothing is invented:** no prorated price, no discount, no credit, no refund, no duplicate payment, no automatic upgrade price.

> ### `DA-10` — **DESIGN ASSUMPTION, REVERSIBLE**
> **A partly-held bundle is shown but not sold; its remaining modules are offered individually.**
> Needed because the state is reachable and must read as something. **Reversal:** any PM decision on `Q-45`. **Impact: LOW** — one panel branch, one route guard, one contents-row variant. **No pricing logic exists, so none has to be removed.** If the decision is "charge full price", the guard is deleted and the normal bundle path already works.

---

## 7. Account and authentication

A transaction has to belong to an account (**9.2.1**). Batch 04 shows that and nothing more.

| | |
|---|---|
| Default | A **seeded signed-in individual learner** |
| Browsing signed out | The catalogue and product detail remain reachable — `DA-13` |
| At `Get access` signed out | Routes to **Sign in to continue**, then returns to exactly where the learner was |
| What the handoff contains | A sentence naming the item, one primary action, one secondary action, and a note that **authentication is designed elsewhere** |
| What it collects | **Nothing.** No password field, no e-mail field, no one-time code, no named provider |

**Not invented:** social-login requirement, Google sign-in, phone OTP, password policy, e-mail verification, session rules, or any institutional/B2C account-merge rule. `QX-10` (the sign-in and role-routing model) and FRD 4.1.2 (social providers, PRODUCT-PENDING) both stay open.

The only source-grounded statement the handoff makes is that self-registration belongs to the individual context — **FRD 4.1.1**: *"Self-registration is offered only in the B2C context and never creates any role other than Learner."*

---

## 8. Access creation — the one place state is written

```js
function settleTransaction() {
  if (simulate === 'success') {
    granted = newModules(offering);              // bundle → each module it contains
    granted.forEach(mid => S.access[mid] = { via, on, ref });
    S.history.unshift({ ref, offering, on, amount, granted });
  }
  else if (simulate === 'failed')  { stage = 'failed';  }   // writes nothing
  else                             { stage = 'pending'; }   // writes nothing
}
```

Four properties fall out of writing it this way:

1. **Only success writes.** Decline and indeterminate never touch the access map, so no downstream screen has to remember to hide anything.
2. **A bundle is not a special case** — it grants each module it contains, satisfying **FRD 6.1.2**'s acceptance criterion that every module be *"reachable individually"*.
3. **Already-held modules keep their original record.** Getting a bundle you partly hold does not rewrite the origin or date of what you already had.
4. **My Learning has no list of its own.** It is `myModules()` over `S.access`. Nothing can be shown there that is not backed by an access record.

### The state model

| Brief's name | In the prototype | Meaning |
|---|---|---|
| `available` | `offeringAccess() === 'none'` | Derived — nothing held |
| `checkout` | `tx.stage === 'checkout'` | On the access summary |
| `processing` | `tx.stage === 'processing'` | Payment in flight |
| `access-success` | `tx.stage === 'success'` | Succeeded; access written |
| `payment-failed` | `tx.stage === 'failed'` | Declined; nothing written |
| `entitled` | `offeringAccess() === 'all'` | Derived — fully held |
| *(source-added)* | `tx.stage === 'pending'` | Indeterminate — required by 9.1.x |
| *(derived)* | `offeringAccess() === 'some'` | Bundle partly held |
| *(derived)* | `justAdded()` | The success moment, shown once |

**Six required states, plus one the source requires and two the model produces.**

`justAdded()` deserves a note: the "just added" emphasis on My Learning is a *moment*, not a state. It is shown the first time the learner arrives after a success and is then marked seen, so a refresh or a later visit shows the settled list. The access records are untouched by it — only the emphasis.

---

## 9. Persistence and reset

| | |
|---|---|
| Store | `sessionStorage`, key `xrslp-batch04-proto-v1` — the Batch-01/02/03 convention |
| Refresh | State **survives**. Access created in the session is still there |
| New tab / browser close | State is gone; the seed returns |
| **Reset demo** | Restores `initialState()` **exactly**: access back to the single seeded module, history back to one record, the reference counter back to 115, the transaction cleared, filters cleared, signed back in |

Reset is a full replacement, not a diff, so no temporary access can survive it. Verified in QA §5 step 15.

---

## 10. What the learner never sees

The technical vocabulary of this document does not appear in the product surface. Verified programmatically across every route (`qa/ACCESSIBILITY_AND_UX_QA.md` §7):

**entitlement · licence · license · activation · SKU · tenant · provision · gateway · provider · subscription · monthly · annual · renew · cancel · refund · plan · tier · premium · membership · seat · quota · invoice · coupon · discount · tax · GST · cart · basket**

The learner reads **"You have access"**, **"Included in your learning"**, **"Get access"**, and **"Access history"**.
