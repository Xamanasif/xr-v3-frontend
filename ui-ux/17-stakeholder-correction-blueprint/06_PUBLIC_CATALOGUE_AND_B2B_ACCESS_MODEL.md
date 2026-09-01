# 06 — Public Catalogue and B2B Access Model

| | |
|---|---|
| **Status** | ✅ **CURRENT ACCESS MODEL OF RECORD** |
| **Created** | 31 August 2026 |
| **Governing decisions** | `STK31-04` · `05` · `15` · `16` · `17` · `18` · `19` · `20` · `44` |
| **Rule** | **The cart never grants access.** No price is invented. No payment screen appears on a route where payment is not required |

---

## 1 · Public discovery — `STK31-16`

Users must be able to browse content **before login**.

The marketplace comparison (Flipkart / Amazon style) means: **public browsing · categories/programmes · courses · experiments · detail pages · selection/cart-like collection.**

> **It does NOT mean copying those products visually.** The comparison is about **discovery behaviour**, not about visual design and not about transaction behaviour — the transaction is settled separately by `STK31-18`.

### The public spine

```
LANDING
   │
   ▼
CATALOGUE ................................ browse · search · filter
   │
   ├── PROGRAMME / DEPARTMENT ............. e.g. Civil Engineering
   │        │
   │        ▼
   │     COURSE .......................... name · local code (tenant-side) · its Experiments
   │        │
   │        ▼
   │     EXPERIMENT ...................... the learning unit
   │
   └── EXPERIMENT (directly addressable) .. the catalogue stays flat-addressable
            │
            ▼
      EXPERIMENT DETAIL (public)
            │  title · Programme/Course context · description
            │  LEARNING OUTCOMES · preview/video where available
            │  supported technologies · device/runtime requirements
            │  access/request context
            │
            ▼
      TECHNOLOGY SELECTION ............... AR · VR · Web    (STK31-15)
            │
            ▼
      ADD TO SELECTION / CART ............ STK31-18
```

**FRD relationship — recorded, not applied.** **No FRD requirement describes unauthenticated browsing.** FRD v5 **FLOW 3** orders **register (①) before browse (②)**. Public pre-login discovery is a **recorded extension** (`S-6` in the update file).

**What is deliberately absent from a public page:**

| Absent | Why |
|---|---|
| A price, a currency, a tax treatment | `ND-08`, `ND-12`. **Do not invent** |
| Marketing claims | `STK31-17` — explicitly prohibited |
| A checkout affordance | `STK31-18` — the cart is not a checkout |
| Seat counts, quotas, caps | `STK31-27` |

---

## 2 · The entry fork

Two entry contexts (`PM29-06`, carried forward):

```
                    PUBLIC CATALOGUE
                          │
              ┌───────────┴────────────┐
              ▼                        ▼
     INSTITUTION / TENANT          INDIVIDUAL
     ▶ CURRENT PRIORITY            ▷ DEFERRED (STK31-04)
```

**No fork screen exists in any batch, and no inventory ID exists for it.** The nearest existing row is `AUTH-10` *Institutional onboarding enquiry* — inventoried **NEW at P3 since Review 006, never built.**

---

## 3 · The B2B selection / cart / request flow — `STK31-18`

> ### The single most important rule on this page
> **The cart does NOT immediately grant direct checkout or access.**
> **The cart is: a selection basket + request preparation, before payment.**

### 3.1 External institutional flow — `STK31-20`

```
① Public catalogue
      ▼
② Select Course / Experiments
      ▼
③ Select required technologies ................. AR / VR / Web     STK31-15
      ▼
④ Add to selection / cart ...................... a SELECTION BASKET, not a checkout
      ▼
⑤ Specify access requirements .................. licence/user quantity   STK31-27
      │                                          requested access term   STK31-28
      ▼
⑥ Submit institutional request ................. organisation info · SPOC/contact
      ▼
⑦ SUPER ADMIN review / approval ................ approve · request more information
      │                                          reason required · history trail
      ▼
⑧ Payment ...................................... WHEN APPLICABLE ONLY
      ▼
⑨ Tenant access activation
```

**🔴 Access is NEVER granted before approval.** Step ⑧ cannot precede step ⑦, and step ⑨ cannot precede step ⑦.

### 3.2 Internal / approved-collaborator flow — `STK31-19`

```
Catalogue → selection → request / subscription → SUPER ADMIN approval → ACCESS ACTIVATION
```

**Payment may be SKIPPED.**

> **Do NOT create a payment screen for internal / BITS-community access where payment is not required.**
> Not a hidden one. Not a skipped one. Not a disabled one. **The route simply does not contain that step.**

**The request and the access are still tracked.** Plan / access context may distinguish **`Subscription`** and **`BITS Community`**. Approved collaborators may also receive non-paid access depending on their arrangement.

**The commercial classification algorithm is NOT invented** (`ND-07`). Which institutions are internal and which are external is a business rule that has not been stated.

### 3.3 The two branches side by side

```
                        ⑦ SUPER ADMIN APPROVAL
                                  │
              ┌───────────────────┴───────────────────┐
              ▼                                       ▼
     INTERNAL / APPROVED COLLABORATOR          EXTERNAL INSTITUTION
     · plan context: BITS Community            · plan context: Subscription
       or an approved arrangement              · commercial / payment cycle
     · NO payment screen                       · payment
     · request + access still TRACKED            │
              │                                   ▼
              └───────────────┬───────────────────┘
                              ▼
                    ⑨ TENANT ACCESS ACTIVATION
                       · allocated Courses / Experiments / technologies
                       · licence/user quantity from the approved request
                       · access term + expiry state
```

---

## 4 · Why the cart is not a cart

| A cart | A selection basket + request |
|---|---|
| Collects **items for payment** | Collects **intent for approval** |
| Ends in **checkout** | Ends in a **submitted request** |
| Grants on **payment success** | Grants on **approval**, and only then payment where applicable |
| Owned by the buyer | Reviewed by the **Super Admin** |

> **They are different objects, not variants of one.** Batch 04's `DA-01` direct single-item checkout is **superseded as the B2B model** and preserved for the deferred B2C route. The selection/request object is **new** — it is not a modification of `DA-01`.

**FRD relationship.** The v5 accuracy corrections already list *"a cart-free checkout"* among three inherited positions **wrongly presented as requirements**, and state that *"whether checkout is single-item or basket-based is DESIGN-PENDING — no requirement specifies a cart model."* `STK31-18` **resolves a DESIGN-PENDING item; it contradicts nothing.**

---

## 5 · Access requirements captured in the request

| Captured | Source | Rule |
|---|---|---|
| Selected Courses / Experiments | `STK31-18` | From the selection basket |
| Selected **technologies** per Experiment | `STK31-15` | AR / VR / Web, any combination |
| **Licence / user quantity** | `STK31-27` | e.g. 10 users, 100 users. **No universal fixed cap.** The quantity is specific to this request/agreement |
| **Requested access duration** | `STK31-20`, `STK31-28` | Monthly · Quarterly · Yearly are the known durations |
| Organisation information · SPOC / contact | `STK31-20` | The two fields the review named. **Nothing beyond them is invented** |

**Later, the UI may show `Requested licences/users` · `Assigned students` · `Remaining allocation` — ONLY where those values derive from the actual approved request** (`STK31-27`).

> 🔴 **Do NOT restore arbitrary sample caps such as 5,400.** Batches 03 and 05 removed every seat, cap, quota and capacity figure, and that removal is validated.

---

## 6 · Authentication and the entry hand-off — `STK31-44`

Public discovery makes authentication **urgent**, because the public route's first action is *sign in / register / apply* and **none of those three destinations exists in any batch.**

| Rule | Detail |
|---|---|
| **If an institution HAS SSO** | Use the configured institutional SSO (FRD 4.2.2 · PM-10 · Batch 03 `INA-10`) |
| **If an institution does NOT have SSO** | **Platform authentication may be provided** |
| Exact password policy and routing | **Not finalised in this documentation task** |
| Workspace resolution | **Seven roles, one front door.** Structural, and unbuilt |

**Still open and untouched:** `QT-04` — XR sign-in under SSO (FRD 2.4.4 device login vs 4.2.2 institutional SSO).

---

## 7 · B2C — deferred but preserved

| | |
|---|---|
| **Status** | **DEFERRED / SECONDARY ROLLOUT** (`STK31-04`) |
| **Preserved** | Batch 04 in full — catalogue components, module/bundle detail, access-state derivation, checkout, all three FRD 9.1.x payment outcomes, access history, guards, My Learning convergence |
| **Access periods** | **Monthly · Quarterly · Yearly. No Lifetime** (`STK31-05`) — preserved for the later rollout |
| **Still open** | Whether an individual is authorised before paying (`PM29-A5`); whether the periods are recurring subscriptions or fixed-term grants (`ND-06`) |
| **Rule** | **B2C checkout architecture must not drive the unified Phase-1 build** (`STK31-04`) |

### What carries across when B2C is built

The **access record is the single spine** for both routes. A B2C grant and a B2B tenant allocation both end at the same place:

```
   B2B REQUEST → approval → (payment if applicable) → TENANT ACCESS
                                                            │
   B2C SELECTION → (authorisation?) → payment → INDIVIDUAL ACCESS
                                                            │
                                    ┌───────────────────────┘
                                    ▼
                              ACCESS RECORD
                              · what content
                              · which technologies      STK31-15
                              · which term               STK31-28
                                    │
                                    ▼
                               MY LEARNING
                          (identical for both routes)
```

> **This convergence is why deferring B2C costs nothing structurally.** The learning core is built once. Only the *route into it* differs, and Batch 04 already proved that the route writes into one access record.

---

## 8 · What this model deliberately does NOT contain

| Not modelled | Why |
|---|---|
| Rejection copy, reason taxonomies, appeal paths for institutional onboarding | **No source contains any of it.** FRD 4.2.1 has no approval behaviour at all. `STK31-20` confirms approval exists; it does not enumerate outcomes beyond approve / request more information |
| An SLA or turnaround time | Never stated. Inventing one creates an expectation the business has not agreed to |
| Business-verification steps — registry lookup, domain verification, tax-ID check, document upload | **No source names any.** Each is an integration decision |
| A price, a price-construction rule, or technology-specific pricing | `ND-08`, `ND-12` |
| A payment provider | `ND-12`; FRD 9.1.x names none |
| A sub-tenant / campus level below the Tenant | `STK31-23` — **a campus is its own Tenant**; no such level is created |
| Automatic renewal or automatic charge | `STK31-28` — must not be assumed |
| A **delivery channel** for the 15-day expiry reminder | **The reminder itself is REQUIRED** (`STK31-28`). The channel — e-mail, SMS, push, external provider — **is not stated and is not invented** (`ND-16`) |
