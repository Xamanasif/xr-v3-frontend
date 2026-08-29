# 07 — B2C Secondary Journey

| | |
|---|---|
| **Status** | 🟠 **ALIGNMENT MODEL — DRAFT** |
| **Priority** | ▷ **SECONDARY ROLLOUT FOCUS** — `PM29-05`. **Not deleted, not withdrawn, not out of Phase 1** |
| **Created** | 29 August 2026 |

---

## 1 · What "secondary" means here, precisely

| Statement | Status |
|---|---|
| Direct self-service B2C gets attention **after** B2B | 🔵 **PM direction, 29 Aug** — `PM29-05` |
| B2C leaves Phase 1 | ⚪ **NOT STATED.** PM-04 and FRD 1.1.3 both place it in Phase 1, and the PM did not say otherwise |
| Batch 04 is withdrawn, deprecated or deleted | ❌ **No.** It is preserved in full and reclassified |
| Batch 04 is retrofitted now | ❌ **No.** Explicitly out of scope for this task |

> **The reclassification is a change to the rollout order, not to the architecture.** The B2C route remains one of the two routes into the same shared learning core.

---

## 2 · The journey

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ① PUBLIC DISCOVERY                                    🔵 PM29-02 · 🟣 NEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Same public catalogue as the B2B route. One catalogue, two audiences.
   🔴 CHANGE FROM TODAY: Batch 04's Explore sits BEHIND sign-in, which was
      correct against FRD FLOW 3 (register ① → browse ②).
      The catalogue COMPONENTS survive; its POSITION moves.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ② INDIVIDUAL ENTRY                                            🔵 PM29-06
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   The visitor identifies as an individual rather than an institution.
   🔴 NO ENTRY-FORK SCREEN EXISTS ANYWHERE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ③ REGISTRATION                                     ✅ FRD 4.1.1 · 4.1.2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Self-registration by e-mail, or a supported social login provider.
   Creates a personal account in the separate B2C data environment (1.3.2).
   Creates NO role but Learner.
   🟠 AUTH-03 exists in the inventory; the sign-up screen itself is not built
      in any batch. Batch 04 has a handoff that "collects nothing and names
      no provider".

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ④ AUTHORISATION — DOES IT EXIST?                              ⚪ OPEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   The transcript contains BOTH:
      · "individuals purchase / subscribe"          ← the FRD's model
      · "individuals may send a request / be authorised first"
   🟣 The FRD supports only the first. FLOW 3 is register → browse → checkout
      → pay → automatic activation (9.2.1), with NO authorisation step.
   ⚪ NOT DECIDED — PM29-A5 → PQ-07
   If confirmed, this adds a STATE between "Get access" and payment.
   Not a redesign — a new state in the existing access spine.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ⑤ ACCESS PERIOD                                     ✅ PM29-19 CONFIRMED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        Monthly  ·  Quarterly  ·  Yearly
        NO Lifetime option
   🟣 FRD CONFLICT: 6.1.1/6.1.2 are PURCHASE requirements;
      recurring subscription billing (9.3.2) is PHASE 2.
      Whether these are recurring subscriptions or fixed-term grants paid
      once is NOT distinguished by the PM's statement.
   🔴 NO TERM SELECTOR EXISTS. Batch 04 deliberately shows no term,
      duration, renewal, recurrence or cancellation anywhere.
      ▶ THIS IS AN ADDITION, NOT A CONTRADICTION. Nothing to retract.
   ⚪ RENEWAL · EXPIRY · POST-EXPIRY BEHAVIOUR — none stated anywhere

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ⑥ PAYMENT                                        ✅ FRD 9.1.1 · 9.1.2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Provider-neutral. Success · declined · indeterminate — all three designed.
   ✅ DESIGNED — Batch 04 B2C-03/04/05
   ⚪ Provider, redirect-vs-embedded, currency, tax, refund: all still open
      (QT-11, QD-09, QD-10, QP-18). None invented in Batch 04.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ⑦ ACCESS CREATED                                 ✅ FRD 9.2.1 · 9.2.2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Activation is automatic on successful payment; no manual step.
   Only success writes an access record — decline and indeterminate never do.
   ✅ DESIGNED — Batch 04, and this is the batch's central proof

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ⑧ MY LEARNING                                            ✅ FRD 9.2.2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   The content appears immediately and is reachable from there.
   My Learning has no list of its own — it is a function of the access record.
   ✅ DESIGNED — Batch 04.  ▶ CONVERGES with the B2B route here.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ⑨ LEARNING                                        ✅ IDENTICAL TO B2B
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Experiment → resources → simulation → assessment → progress
   PM-09 approved.  Batches 01 + 02.
   Device binding (2.4.1) and replacement request (2.4.2) are B2C-specific:
   🟠 the APPROVAL end is designed (Batch 05 SA-06/07);
      the LEARNER end (LRN-16/LRN-17) is NOT built in any batch.
```

---

## 3 · What stays unknown — recorded, not resolved

| # | Unknown | Ref |
|---|---|---|
| 1 | Whether approval is required before individual payment | `PM29-A5` → `PQ-07` |
| 2 | When B2C becomes active in the rollout | `PM29-05` → `PQ-07` |
| 3 | What a Bundle is | `PM29-A2` → `PQ-02` |
| 4 | Whether technology variants are priced separately | `PM29-18` → `PQ-08` |
| 5 | Partial ownership of a bundle — overlap pricing | `Q-45` / Batch 04 `OQ-B4-01`, **open** |
| 6 | Whether the periods are recurring subscriptions or fixed-term grants | `PM29-19` vs FRD 9.3.2 (Phase 2) |
| 7 | Renewal, expiry and post-expiry behaviour | No source states any |
| 8 | Refund / cancellation / revocation | `QP-18` — *"None stated or implied. No rule is invented"* |
| 9 | Receipt or invoice format | `QP-17` |
| 10 | How much detail a signed-out visitor sees | `OQ-05`; Batch 04 `DA-02`, reversible |
| 11 | Cart vs single-item checkout | `DA-01`, reversible; `PM29-A6` for the B2B side |
| 12 | Direct course purchase | `QP-28` — *"neither required nor prohibited"* |

---

## 4 · Batch 04 concepts — kept, every one

**Nothing in Batch 04 is deleted by this reclassification.** The table records what each concept is worth under the new direction.

| Concept | Verdict |
|---|---|
| Single access record `{ via, on, ref }` as the spine | ✅ **Keep — architectural.** Card state, detail, summary, outcome and My Learning are all functions of it. A cart, a request list or an authorisation step would all grant through the same path |
| Catalogue card · grid · four filter controls | ✅ **Keep — reusable in a public catalogue** |
| Module detail page | ✅ **Keep** — gains learning outcomes and preview (`PM29-03`) |
| Access-state derivation `none` / `some` / `all` | ✅ **Keep.** A signed-out visitor is the `none` case with a different CTA |
| Payment outcome states — success · declined · indeterminate | ✅ **Keep — FRD 9.1.x requires all three** |
| Only success writes | ✅ **Keep — architectural** |
| Duplicate access blocked **at the route** | ✅ **Keep** |
| Access history (`B2C-06`) | ✅ Keep, classified `DA-07` |
| My Learning convergence | ✅ **Keep — this is where the two routes meet** |
| Bundle detail page | ⚪ **Hold** — `PM29-A2` |
| Partly-held bundle: shown, not sold (`DA-10`) | ⚪ **Hold** — downstream of the same definition |
| Direct single-item checkout (`DA-01`) | 🟠 **Hold** — already labelled reversible, MEDIUM impact, spine unaffected |
| Explore behind sign-in | 🔴 **Superseded as a position** by `PM29-02`. The components are not |
| `Module` / `Bundle` card labels | 🔴 **Change once**, after `PQ-04` |

---

## 5 · The migration path — recorded, not started

**Target shape:**

```
PUBLIC CATALOGUE (one, shared)
        │
        ├── B2B PRIMARY: request-first
        │      ⚪ mechanism open — PM29-A6
        │
        └── B2C SECONDARY: subscription/access with a period
               ✅ periods confirmed — PM29-19
               ⚪ authorisation-before-payment open — PM29-A5
```

**The four moves, in order, once unblocked:**

| # | Move | Blocked by | Magnitude |
|---|---|---|---|
| 1 | Lift the catalogue out from behind sign-in; make signed-out the default state | Nothing structural — but the **CTA** is blocked by `PM29-A6` | **MEDIUM** — components survive, position and CTA change |
| 2 | Add the entry fork (Institution / Individual) upstream of it | `PM29-06` is clear; the downstream B2B branch is not | **MEDIUM** |
| 3 | Add a period selector to the individual access path | `PM29-19` confirmed; renewal/expiry undefined | **MEDIUM** |
| 4 | Re-label `Module` → `Experiment`, if confirmed | `PQ-04` | **LOW but wide** — 23 label sites in Batch 04 alone |

> **None of these starts before Monday.** Move 1's components are safe to *map*; its CTA is not safe to *choose*. See `11_SAFE_WORK_BEFORE_MONDAY.md`.
