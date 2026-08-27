# 01 — Source and Scope

**XR Simulation Learning Platform · Full-Platform UI/UX Design — Batch 04**
Branch `uiux/full-platform-design` · 2026-08-27 · Individual (B2C) learner access

---

## 1. What this batch is

Batch 04 designs the **individual learner's route into the platform**: how a person who is not at a subscribing institution discovers XR learning content, understands what they would be getting, obtains access to it, and then finds that same content in My Learning.

```
PUBLISHED ELIGIBLE OFFERING
        ↓
LEARNER CHOOSES TO GET ACCESS
        ↓
CHECKOUT / PAYMENT
        ↓
SUCCESSFUL TRANSACTION
        ↓
ACCESS CREATED
        ↓
CONTENT APPEARS IN MY LEARNING
```

It is the **counterpart of Batch 03**. Batch 03 designed the institutional route to the same destination. Batch 04 designs the individual route. Both end in the same My Learning, and from there the learning experience designed in Batch 01 and Batch 02 is identical.

---

## 2. Role model — this is not a new role

**The formal role is `Learner`.** B2C is a *commercial and access context* around that role, not an eighth role.

This is not an interpretation. It is recorded in the PM baseline:

> **B2C Individual Learner** is a **business/user context**, not an eighth role. It is the non-institutional context in which the Student/Learner role operates (FRD 1.1.3, 6.1.1, 6.1.2), as distinct from the B2B institutional context.
> — `PM_CONFIRMED_BASELINE_2026-08-18.md` §B

Accordingly, Batch 04 introduces **no** Consumer, Customer, Subscriber, Buyer or B2C-Admin role, and no new formal role of any kind. The prototype has exactly one signed-in persona: a Learner in an individual access context.

---

## 3. Sources read

### Authoritative — project

| Document | Used for |
|---|---|
| `ui-ux/00-project-context/PM_CONFIRMED_BASELINE_2026-08-18.md` | PM-01 – PM-12 · the seven-role set · B2C-as-context · payment provider recorded as pending · commercial figures as sample data |
| `ui-ux/00-project-context/PM_CONFIRMED_UPDATE_2026-08-25.md` | The open register `OQ-01` … `OQ-06`, carried forward verbatim in §8 |

### Authoritative — requirements

| Document | Used for |
|---|---|
| `requirements/updated-frd/Core frd.pdf` | Chapter 9.3 **Table 14 — Individual route, end to end** · the capability/open-question table for Commerce and payments |
| `requirements/updated-frd/TL frd.pdf` | The consolidated open-decision list |
| `requirements/updated-frd/Detailed frd.pdf` | Verbatim requirement text and acceptance criteria for 1.1.3, 4.1.1, 4.1.2, 6.1.1, 6.1.2, 9.1.1, 9.1.2, 9.2.1, 9.2.2, 2.4.1, 2.4.2 · the B2C surface register · the classification of every pending item |

> **A note on how the FRDs were read.** This machine has no PDF text-extraction or page-rendering tooling installed (no `poppler`/`pdftotext`, no Python PDF library), so the PDFs could not be read directly. The `.docx` companions in the same directory — `Core frd.docx`, `TL frd.docx`, `Detailed frd.docx` — were read instead. They are the same v5 documents exported in a second format, issued together with identical timestamps. Nothing in `requirements/` was modified; the extraction was performed on temporary copies outside the repository. Every requirement quoted below is quoted verbatim from that text.

### Reframe (Review 006)

`01_PHASE1_FEATURE_INVENTORY.md` · `02_ROLE_PERMISSION_MATRIX.md` · `03_SHARED_CAPABILITY_MAP.md` · `04_PLATFORM_INFORMATION_ARCHITECTURE.md` · `05_END_TO_END_WORKFLOWS.md` (FLOW 3) · `06_B2B_B2C_JOURNEYS.md` (Part 3, the C1–C18 register, and the divergence register) · `08_ASSESSMENT_CONFIGURATION_MODEL.md` · `10_FULL_PLATFORM_SCREEN_INVENTORY.md` (`B2C-01` … `B2C-06`) · `13_PM_CLOSURE_DECISIONS.md` (PM-15).

### Review-005 decisions still in force

`ui-ux/01-requirements/DECISIONS.md` — **D-01** (dual audience), **D-04** (B2C purchasing in scope; B2B learners see no commerce), **D-21** (purchasable product types), **D-22** (standalone module gating), **D-24** (access duration).

### Completed batches — read for continuity, not modified

Batch 01 (`ui-ux/13-full-platform-design/`), Batch 02 (`batch02-assessment/`), Batch 03 (`batch03-institute-admin/`). The design system, shell, sample content set, prototype-state conventions and QA method are carried forward from them. **No file in any of them was changed.**

---

## 4. What the source actually confirms

Everything in this table is quoted or directly paraphrased from an authoritative source. Batch 04 treats it as settled.

| # | Confirmed | Source |
|---|---|---|
| C-1 | **B2C individual learning environment is Phase 1**, not sequenced behind B2B | FRD 1.1.3 · PM-04 |
| C-2 | *"Users shall be able to **purchase individual simulation modules**."* AC: *"An individual learner can purchase a single module and reach it immediately after activation."* | **FRD 6.1.1** — UNCHANGED-FRD |
| C-3 | *"Users shall be able to **purchase bundles of multiple modules**."* AC: *"A bundle purchase entitles the learner to **every module the bundle contains, each reachable individually**."* | **FRD 6.1.2** — UNCHANGED-FRD |
| C-4 | The learner *"browses the catalogue of published modules and bundles"* | Core FRD **Table 14**, step 2 |
| C-5 | The learner *"views a product and checks out"* | Core FRD **Table 14**, step 3 |
| C-6 | *"Success, decline and **indeterminate** outcomes are each designed states."* | FRD 9.1.x · Core FRD Table 14 step 4 |
| C-7 | *"Upon successful payment, licenses shall be **automatically activated** and linked to the user account."* AC: *"…without any further learner action."* | **FRD 9.2.1** — UNCHANGED-FRD |
| C-8 | *"Purchased modules or packages shall be automatically assigned to the user's dashboard."* AC: *"A purchased module **appears in My Learning immediately** after activation and is reachable from there."* | **FRD 9.2.2** — UNCHANGED-FRD |
| C-9 | A module is exactly **one XR simulation**; it may carry optional resources and an assessment | FRD 3.1.1, 3.1.2 |
| C-10 | Four delivery formats — browser, VR, MR, mobile AR | FRD 1.2.1 – 1.2.4 |
| C-11 | Self-registration by e-mail is **the B2C account origin**; it *"never creates any role other than Learner"* | FRD 4.1.1 |
| C-12 | The individual learner sits in a **separate data environment**, with no institution context | FRD 1.3.2 |
| C-13 | Individual learner navigation is **Home · My Learning · Explore · Progress**; the institutional learner has no Explore | `04_PLATFORM_INFORMATION_ARCHITECTURE.md` · D-04 |
| C-14 | The learner **never authors or configures an assessment**, in either market | **PM-15** |
| C-15 | **Certification is Phase 2** — no Phase-1 certificate surface anywhere | **PM-12** |
| C-16 | Access duration is **data, not copy**; where no authoritative data exists, **display nothing** | **D-24** |
| C-17 | Purchasable product types are **module and bundle only** — a course is not a product | **D-21** · FRD 6.1.1/6.1.2 |

---

## 5. What the source explicitly leaves open

Every item here is recorded as open **by the source itself**. Batch 04 does not answer any of them, and §36 of the requirement-safety audit (`qa/ACCESSIBILITY_AND_UX_QA.md` §7) verifies that no screen accidentally does.

| # | Open | Classification in source | How Batch 04 stays truthful |
|---|---|---|---|
| O-1 | **The exact B2C commercial model** — is it a one-time purchase, a term, a subscription, something else? | `OQ-06` **OPEN** | The learner-facing verb is **"Get access"**. No recurrence, term, plan, tier, membership or renewal appears anywhere. **Nothing is said about how long access lasts** |
| O-2 | **Whether checkout is single-item or basket-based** | *"DESIGN-PENDING — **no requirement specifies a cart model**"* | **No cart.** Direct `Get access → checkout`. Registered as `DA-01`, reversible |
| O-3 | **The payment gateway / provider — and any payment method at all** | **FRD 9.1.1 TECHNICAL-PENDING** — *"No gateway is selected. Redirect versus embedded checkout is also undetermined"* · **`C-05`** forbids inventing the gateway · **`Q-34`** OPEN. An audit of all three FRD editions and every project register found **zero** occurrences of any payment method, mode, option or instrument | **No provider, gateway, card network, redirect or payment method is named or implied.** The step is a statement — *"Online payment"* — not a choice |
| O-4 | **Currency, tax treatment and price presentation** | **FRD 9.1.2 PRODUCT-PENDING** — *"compliance-adjacent and undefined… No tax or legal rule is invented by this draft"* | One plain amount. **No tax line, no breakdown, no discount, no saving, no coupon.** Every amount marked SAMPLE |
| O-5 | **Refund, cancellation and revocation** | *"Not in the FRD… No rule is stated or implied anywhere"* | Absent entirely |
| O-6 | **What a B2C buyer receives as a document** (receipt / invoice / neither) | PRODUCT-PENDING; GST invoicing (9.3.1) is Phase 2 and institution-facing | Access history lists what was added and when. **No document, download or invoice** |
| O-7 | **Who creates bundles and sets prices in Phase 1** | TENSION on 6.1.2 — bundle creation (6.3.1) and pricing (6.3.2) are **Phase 2** | No bundle-authoring surface. No bundle amount is described as a saving or an offer |
| O-8 | **Whether direct course purchase is in scope at all** | `QP-28` **NOT-SPECIFIED / PRODUCT-PENDING** — *"neither required nor prohibited"* | **No course is purchasable and no course is prohibited in copy.** Courses simply do not appear as offerings |
| O-9 | **Learner browse of non-entitled content** | `OQ-05` **OPEN** | See §6 — treated as a **reversible design assumption**, never as confirmed |
| O-10 | **Which Faculty or content owner supplies the assessment for a pure B2C learner** | PM-15 defers it as a content/implementation detail | Detail screens say a module *includes an assessment*. **Who configured it is never stated** |
| O-11 | **The sign-in model and the available sign-in methods** | `QX-10` DESIGN-PENDING; social providers PRODUCT-PENDING (4.1.2) | A handoff panel that **collects nothing and names no provider** |
| O-12 | **Operational handling of an indeterminate payment** | The outcome is required; its handling is not specified | The screen states the position and stops. No timing, retry or banking rule |
| O-13 | **Personal device binding and device replacement** (2.4.1, 2.4.2) | PRODUCT-PENDING | Out of Batch-04 scope. Not designed, not implied |

---

## 6. `OQ-05` — the one that matters most for this batch

> **`OQ-05` — Learner browse behaviour for non-entitled content (visible / hidden / teaser).** ❌ **OPEN — not confirmed.**
> — `PM_CONFIRMED_UPDATE_2026-08-25.md`

Batch 04 **necessarily shows a learner content they do not yet have** — that is what a catalogue is. So this must be handled precisely rather than waved through.

**The honest split:**

| | Standing |
|---|---|
| That an individual learner reaches a **catalogue of published modules and bundles** they do not yet hold | **Source-supported.** Core FRD Table 14 step 2 states it directly, and 6.1.1/6.1.2 are unbuildable without it — a learner cannot purchase what they cannot see |
| **How much** a non-entitled learner is shown about an item — full description, contents and requirements, versus a teaser | ⚠️ **`DA-02` — DESIGN ASSUMPTION, REVERSIBLE.** No source states the disclosure depth. Batch 04 shows the full description, the component list, the delivery requirements and the bundle contents. **This is not PM-confirmed** |
| Whether a **B2B institutional** learner may browse content their institution has not licensed | **Untouched.** Batch 04 adds no browse surface to the institutional context, exactly as Batch 03 did not |

**If `OQ-05` resolves to "teaser only", what changes:** the catalogue card keeps its title, discipline, type and delivery badges; the module-detail component list and the bundle contents list are reduced or gated. **Low impact** — one list component and one card region, no flow change, no state change.

---

## 7. Scope boundaries

### In scope

| Area | Screens |
|---|---|
| Catalogue discovery, search and filtering | `B2C-01` |
| Module detail | `B2C-02` |
| Bundle detail | `B2C-03` |
| Access summary and payment step | `B2C-04` |
| Payment in progress | `B2C-05` |
| Access outcome — confirmed · not completed · still confirming | `B2C-06` |
| My Learning in the individual context | `LRN-02` |
| The handoff out of Batch 04 | `LRN-04b` |
| Access history | `B2C-07` |
| Sign-in handoff | `AUTH-B2C` |

### Deliberately out of scope

| Not in Batch 04 | Why |
|---|---|
| Resources → simulation → XR device access → assessment → results → progress | Designed in **Batch 01** and **Batch 02**. Batch 04 ends where they begin, and says so on screen |
| Institute Admin, institutional access, eligibility, SSO, institution data | Designed in **Batch 03**. Batch 04 adds no institutional surface |
| Content governance (Vendor → Reviewer → Content Manager) | **Batch 01** |
| Faculty assessment configuration | **Batch 02** · PM-15 |
| Authentication screens, registration, social sign-in | Shared platform work · `QX-10` DESIGN-PENDING. Only the handoff is shown |
| Personal device binding · device replacement (2.4.1, 2.4.2) | Phase-1 requirements with no Batch-04 dependency; a later batch |
| Learner Home (`LRN-01`) | Confirmed in the IA, **not designed in any batch yet**. The navigation item is present and says so |
| Certification | **Phase 2** — PM-12 |
| Cart, coupons, tax, invoices, refunds, saved instruments, billing addresses | None is established by any source. See §5 |
| Payment-method selection of any kind | **Zero occurrences** of payment method, mode, option or instrument across all three FRD editions and every project register |
| Final visual redesign | Explicitly not this batch. Batch 04 continues the Batch-01 design system unchanged |

---

## 8. Open questions carried forward, unchanged

Reproduced verbatim from `PM_CONFIRMED_UPDATE_2026-08-25.md`. **Batch 04 resolves none of them.**

| # | Open question | Status |
|---|---|---|
| `OQ-01` | Exact **B2B subscription / licensing model** | ❌ **OPEN** |
| `OQ-02` | **What institutions subscribe to** | ❌ **OPEN** |
| `OQ-03` | **Seat model, if any** | ❌ **OPEN** |
| `OQ-04` | **How learner entitlement is assigned** | ❌ **OPEN** |
| `OQ-05` | **Learner browse behaviour for non-entitled content** | ❌ **OPEN** — see §6 |
| `OQ-06` | Exact **B2C purchase / subscription model** | ❌ **OPEN** — the central constraint on this batch |

### Also carried forward from the FRD v5 register

| # | Open question | Status |
|---|---|---|
| `QP-28` | Is **direct course purchase** in scope at all? | NOT-SPECIFIED / PRODUCT-PENDING |
| `QP-27` | Answer-key visibility and post-attempt feedback policy | PRODUCT-PENDING — Batch 04 shows only that an assessment exists |
| `QX-10` | The sign-in and role-routing model | DESIGN-PENDING |
| `QT-01` | The XR delivery mechanism | TECHNICAL-PENDING — Batch-04 copy is mechanism-neutral |
| — | Whether checkout is **single-item or basket-based** | DESIGN-PENDING — *no requirement specifies a cart model* |
| — | Who creates bundles and sets prices in Phase 1 | PENDING DECISION (tension on 6.1.2) |
| — | Currency, tax and price presentation | PRODUCT-PENDING (9.1.2) |
| — | Refund, cancellation and revocation | PRODUCT-PENDING — not in the FRD at all |
| — | What a B2C buyer receives as a document | PRODUCT-PENDING |

### Raised by Batch 04 — new, and not answered here

| # | Question | Why it arose |
|---|---|---|
| `OQ-B4-01` | When a learner already holds **part** of a bundle, what should the amount be? **Alias for the existing `Q-45`** (*"What happens when a purchased bundle contains a module the Student already owns?"*, `OPEN_QUESTIONS.md`, product decision, tied to `A-37`) — not a new question | The bundle is **shown but not sold**: no amount, checkout blocked at the route, remaining modules offered individually under the confirmed FRD 6.1.1 path |
| `OQ-B4-02` | Is there a state in which a published item is **visible but not obtainable**? | No source describes one, so none is designed. Recorded so its absence is deliberate rather than an oversight |
| `OQ-B4-03` | Should an individual learner see the **institutional** route at all (e.g. "ask your institution")? | Batch 04 shows no such prompt. D-04 forbids the reverse (commerce for B2B learners); nothing states this direction |

---

## 9. Traceability — screen to requirement

| Screen | ID | Requirement | Reframe inventory |
|---|---|---|---|
| Explore — catalogue | `B2C-01` | 1.1.3 · 6.1.1 · 6.1.2 · D-21 · Table 14 step 2 | `B2C-01` |
| Module detail | `B2C-02` | 6.1.1 · 3.1.1 · 3.1.2 · 1.2.1–1.2.4 · D-24 · Table 14 step 3 | `B2C-02` (module) |
| Bundle detail | `B2C-03` | 6.1.2 · D-24 | `B2C-02` (bundle) |
| Get access — access summary | `B2C-04` | 6.1.x · 9.1.1 · 9.1.2 · Table 14 step 3 | `B2C-03` |
| Confirming payment | `B2C-05` | 9.1.1 · 9.1.2 · Table 14 step 4 | `B2C-04` |
| Access outcome | `B2C-06` | 9.1.x · 9.2.1 · 9.2.2 · Table 14 steps 4–5 | `B2C-05` |
| My Learning | `LRN-02` | 8.1.5 · 9.2.2 · D-22 · Table 14 step 5 | `LRN-02` |
| Experiment handoff | `LRN-04b` | 3.1.1 · 3.1.2 · PM-09 | `LRN-04` (entry only) |
| Access history | `B2C-07` | Inventoried as `B2C-06`; **no requirement mandates it** — `DA-07` | `B2C-06` |
| Sign in to continue | `AUTH-B2C` | 4.1.1 · `QX-10` | — (new, minimal) |

**All six inventoried `B2C-01` … `B2C-06` screens are covered**, plus `LRN-02` in the individual context and a minimal authentication handoff.
