# Batch 04 prototype — individual (B2C) learner access

**Open `batch04-prototype.html`.** It works by double-clicking the file — no server, no build, no install.

---

## Files

| File | What it is |
|---|---|
| `batch04-prototype.html` | Entry point |
| `batch01-design-system.css` | **Byte-identical snapshot** of `../../prototype/batch01-prototype.css`. Batch 01 remains the source of truth; verify with `cmp`. The copy exists because **Safari blocks parent-directory subresources** for a document opened from `file://`, which left the page unstyled |
| `batch04-prototype.css` | Batch-04 extensions only — catalogue, product detail, access summary, payment outcomes. No Batch-01 component is restyled, and exactly one inherited token is corrected (see below) |
| `batch04-prototype.js` | All behaviour and all state. Plain JavaScript, no framework |
| `assets/bits-pilani-wilp-logo.png` | **Byte-identical copy** of `branding/bits-pilani-wilp-logo.png`. The source asset is never modified |

---

## Where to start

**`#/index`** — the prototype index. Not product UI. It carries six demo paths and the figure showing how the institutional route (Batch 03) and the individual route (Batch 04) converge.

Best reviewed at **1440 px**.

### Six demo paths

| | Path | Shows |
|---|---|---|
| **A** | Discover → get access → My Learning | The core journey. The same item changes state everywhere and appears in My Learning without a reload |
| **B** | Bundle access | One transaction grants **every module the bundle contains, each individually** |
| **B′** | Partly-held bundle | Overlap shown, no amount, checkout blocked, remaining modules offered individually |
| **C** | Something you already have | No purchase path anywhere — and forcing the checkout URL is blocked |
| **D** | Payment that does not complete | Nothing is created; verify in My Learning; retry |
| **E** | Search, filter, no results | Discovery updates locally, including the empty state |
| **F** | Signed out | Sign-in handoff, returning to exactly where you were |

---

## The one thing worth understanding

Everything rests on a single record:

```js
S.access[moduleId] = { via, on, ref }
```

The catalogue card state, module detail, bundle detail, access summary, outcome screen and My Learning are **all functions of that map**, recomputed on every render.

Which is why:

- **A bundle is never a special case.** It grants each module it contains (FRD 6.1.2), and everything else recomputes on its own.
- **My Learning has no list of its own.** Nothing can appear there that is not backed by an access record.
- **Only a successful payment writes.** A decline or an unconfirmed payment never touches the map, so no screen has to remember to hide anything.
- The **"you already have part of this bundle"** state was never designed as a case — it emerged from the model.

---

## Prototype controls — clearly marked, never product UI

| Control | Where |
|---|---|
| **Reset demo** | Prototype strip, every route. Restores the exact seed and removes every temporary access |
| **Outcome to simulate** | Access summary — *Successful · Not completed · Still confirming* |
| **Sign out** | Account menu — drives the signed-out demonstration |

Everything non-product is inside a dashed `PROTOTYPE …` container or the dark strip at the top.

---

## Seeded state

One individual learner, **Aditya Rao**, who already has **Soil Mechanics — Direct Shear Test** and nothing else. Eleven catalogue offerings: nine modules across three disciplines and all four delivery types, plus two bundles.

**Everything is sample design data — every name, summary, date, reference and monetary amount.**

State is held in `sessionStorage` (`xrslp-batch04-proto-v1`): it **survives a refresh** and is gone on a new session. **Reset demo** restores the seed exactly.

---

## What this prototype does not contain

**No** backend · database · network request of any kind · payment API, gateway or provider · authentication provider · entitlement service · analytics · AI · external script · CDN · remote font.

**Nothing is ever collected.** There is no card field, no CVV, no bank selector, no billing address, no password field, no one-time code, and no phone number anywhere in it.

---

## The commercial model is deliberately unanswered

`OQ-06` — the exact B2C purchase/subscription model — is **open**, so the prototype is built not to answer it:

- The verb is **"Get access"**, not "Buy" or "Subscribe".
- **Nothing is said about how long access lasts** (`D-24`).
- **No cart** — the source records the cart model as DESIGN-PENDING, and the choice is registered as a reversible assumption, never as a requirement.
- **No provider, gateway, card network — or payment method — is named.** The payment step is a statement (*"Online payment"*), not a chooser: zero payment methods appear anywhere in the source.
- **Bundle amounts equal the sum of their component modules**, so no discount rule is implied even by arithmetic.
- **A bundle the learner partly holds is shown but not sold** — its remaining modules are offered individually instead (`Q-45` open).
- **No tax, discount, coupon, invoice, refund or renewal** appears anywhere.

Full reasoning: `../04_CHECKOUT_AND_ENTITLEMENT_MODEL.md`. Reversible assumptions: `../02_B2C_LEARNER_UX_MODEL.md` §6.

---

## One inherited token correction

`--text-3` is defined in the Batch-01 sheet as `#6A7686`, which measures **4.12–4.46 : 1** on the surfaces it sits on — just under the 4.5 : 1 WCAG AA minimum. It is darkened to `#5F6B7A` **in the Batch-04 sheet only**, which clears AA everywhere while staying lighter than `--text-2`.

**The Batch-01 sheet is not edited.** This is a shared design-system finding — it affects Batches 01–03 equally — and is referred upward in `../qa/ACCESSIBILITY_AND_UX_QA.md` §4.4.

---

## Routes

```
#/index                 prototype index — not product UI
#/explore               catalogue
#/module/<id>           module detail
#/bundle/<id>           bundle detail
#/get-access/<id>       access summary  (already-held items are blocked here)
#/processing            payment in progress
#/result                access outcome
#/my-learning           My Learning
#/learn/<id>            experiment handoff into Batch 01 / Batch 02
#/history               access history
#/sign-in[/<id>]        sign-in handoff
#/home  #/progress      signposts to where those surfaces are designed
```

Unknown routes fall back to the prototype index.
