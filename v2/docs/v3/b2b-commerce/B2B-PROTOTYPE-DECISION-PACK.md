# B2B prototype decision pack

|                 |                                                                                                                                                                                                                                                                                                             |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**      | **Owner direction recorded on 5 Nov 2026.** Development continues **without final institutional pricing**. The approved rules below are **interim rules for prototype planning**, not final platform rules, and each implementation increment still needs its own scope approval before any code is written |
| **Prepared**    | 5 Nov 2026, read-only, against `main` @ `d0594ff`                                                                                                                                                                                                                                                           |
| **Builds on**   | This folder (audit §4–§8, specification §8–§10, decision register, coverage plan); `../phase2/P1-DECISION-REGISTER.md` (Q-A…Q-E); `../../OPEN_DECISIONS.md` (A-17, TE-1…TE-8)                                                                                                                               |
| **Goal**        | A functional, browser-isolated hosted prototype of **external-institution** commerce: simulated payments and activation, with internal BITS institutions kept on their payment-free route. Individual (B2C) purchasing is out of scope                                                                      |
| **Not changed** | No price, tax rule, currency rule or commercial rule is set by this pack. No code, deployment or frozen design changes                                                                                                                                                                                      |

## Owner direction of 5 Nov 2026

| Category                                        | Decisions                                                                                                                                                                                                                                                                                 | Meaning                                                                                                      |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Approved interim rules** (prototype planning) | DP-05, DP-07, DP-08, DP-09 (interim safeguard only), DP-13, DP-15, DP-16 (develop, **do not deploy**), DP-18                                                                                                                                                                              | May be planned and, once an increment's scope is approved, built for the prototype. Not final platform rules |
| **Approved provisionally**                      | DP-06, with a documented recovery and reset path (below)                                                                                                                                                                                                                                  | May be planned; to be confirmed after use                                                                    |
| **Open: management decisions**                  | DP-01 (price basis and all figures), DP-02 (final amount-based quotation behaviour), DP-03 (currency confirmation), DP-04 (GST and tax rules), DP-10 and DP-11 (renewal and additional-licence commercial rules), DP-17 (hosting security approval), DP-19 (final visual-design sign-off) | Nothing that depends on them is built. The recommendations below remain **provisional recommendations** only |
| **Deferred from the first implementation**      | DP-12, DP-14                                                                                                                                                                                                                                                                              | Deferred, **not cancelled**: both stay on the full platform roadmap                                          |

**What the code does today** (checked at `d0594ff`):

- The request spine is complete: approval → payment started → provider outcome → activation. Every payment attempt is kept (`payments[]`), and a failed payment can be retried (REQ-07). Paying again while a payment is pending is refused (REQ-08).
- Payments carry no amount (T-05). The payment stand-in has only `confirm-on-start` (local builds) and `provider-reports`; "failed" and "not confirmed" are reachable only through fixtures and test hooks.
- An external plan is created only when the provider confirms the payment (ACC-02). An internal request becomes active at approval (REQ-09). A plan starts on its activation date.
- Renewal and more-licences payments change no plan (`planEffect: policy-open OD-B3-09`).
- `startPayment` does not check whether the institution is paused.
- The duplicate-institution guard (audit P0-5) is not implemented.
- `APP_ENV` accepts only `development | staging | production`. Every stand-in is limited to `development`, and no access-protection middleware exists.

## Summary

| ID    | Decision                                     | Recommendation                                                    | Status (owner, 5 Nov 2026)                        |
| ----- | -------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------- |
| DP-01 | Price basis and fictional figures            | Per licence × format × term; 12 fictional sample figures          | **Open: management**                              |
| DP-02 | Quotation behaviour                          | Frozen at approval; attempts carry the amount                     | **Open: management**                              |
| DP-03 | Currency and display                         | INR, ₹, Indian grouping, whole rupees                             | **Open: management**                              |
| DP-04 | Tax                                          | No tax line; "No tax is calculated"; "not a tax invoice"          | **Open: management**                              |
| DP-05 | Simulated payment outcomes                   | Payer chooses: complete · fail · leave unconfirmed                | **Approved interim rule**                         |
| DP-06 | Pending-payment behaviour                    | Stays pending until resolved; no timeout; recovery and reset path | **Approved provisionally**                        |
| DP-07 | Payment attempt history                      | Every attempt listed                                              | **Approved interim rule**                         |
| DP-08 | Payment while paused                         | Refuse starting and completing a payment                          | **Approved interim rule**                         |
| DP-09 | Duplicate institutions                       | Interim safeguard; the link command is decided later              | **Approved interim rule** (safeguard only)        |
| DP-10 | Renewal                                      | Extend the same plan by one term                                  | **Open: management** (commercial rules)           |
| DP-11 | Additional licences                          | Add N to the plan                                                 | **Open: management** (commercial rules)           |
| DP-12 | New experiments for an onboarded institution | Defer                                                             | **Deferred** from the first implementation        |
| DP-13 | Activation and entitlements                  | Keep the existing separation                                      | **Approved interim rule**                         |
| DP-14 | Licence counting                             | Defer                                                             | **Deferred** from the first implementation        |
| DP-15 | Internal BITS institutions                   | Keep the payment exclusion                                        | **Approved interim rule**                         |
| DP-16 | Hosted-prototype profile                     | A new `prototype` profile                                         | **Approved interim rule**: develop, do not deploy |
| DP-17 | Access protection                            | Host-level protection on every deployment                         | **Open: management** (hosting security)           |
| DP-18 | Independent browser data                     | Per-browser worlds, Reset, clean start on seed change             | **Approved interim rule**                         |
| DP-19 | Design reference                             | Canvas v34 as the prototype build reference                       | **Open** (final visual-design sign-off)           |

---

## A · Fictional illustrative pricing and quotations

### DP-01 · Price basis and fictional figures

**Status: Open: management.** No figure is set.

- **Existing:** CD-01 and CD-04 (open, 4 Nov 2026); ND-08, ND-12, QD-10; A-17 (unresolved); audit P0-1.
- **Options:**
  - (a) A line per experiment × format: licences × per-licence figure for the term.
  - (b) One price per plan or tier.
  - (c) No amounts, keeping today's provider-neutral payment.
- **Provisional recommendation: (a).** One per-licence figure for each format (web, vr, mr, ar) and priced term (monthly, quarterly, yearly), the same for every experiment; "Until a fixed date" not priced.
  - Management would supply the fictional figures, or authorise engineering to choose round ones.
  - The figures would live only in sample data, labelled "Sample prices for this prototype — not BITS prices".
- **Effects if approved:**
  - **Frontend:** amounts only after approval, never on PU-01…PU-09 (P-28).
  - **Domain:** a `commerce/` module with a sample price list and a pure `quote()`.
  - **Contracts:** additive quote fields.
  - **Tests:** quote units, a seed invariant, and a test that asserts no amount on PU-01…PU-09.

### DP-02 · Quotation behaviour

**Status: Open: management** (final amount-based quotation behaviour).

- **Existing:** CD-06, CD-07, CD-10 (recommendations only); U-1.
- **Options:**
  - (a) Frozen at approval, no expiry.
  - (b) Recomputed when payment starts.
  - (c) An expiry date.
- **Provisional recommendation: (a).** Computed from the approved scope. Every attempt records amount, currency and quote revision, and a payment against a stale quote is refused. Request reference only, no quotation number.
- **Effects if approved:**
  - **Domain:** the approval writes the quote; `PaymentAttempt` gains `amount`, `currency` and `quoteRev`.
  - **Contracts:** additive fields.
  - **Tests:** a frozen-quote test and a retry-amount test.

## B · Currency and tax

### DP-03 · Currency and display

**Status: Open: management** (currency confirmation).

- **Existing:** CD-02; QD-09.
- **Options:**
  - (a) INR, ₹, Indian grouping, whole rupees.
  - (b) INR with paise.
  - (c) Currency-neutral units.
- **Provisional recommendation: (a).** The specification's "₹1,20,000" illustrates the format only.

### DP-04 · Tax

**Status: Open: management** (GST and tax rules).

- **Existing:** CD-03 (open); GST invoices are Phase 2 (v4 9.3.1); A-17.
- **Options:**
  - (a) No tax line, with "No tax is calculated."
  - (b) An illustrative GST line. This creates a tax rule.
  - (c) "Prices exclude taxes", with nothing computed.
- **Provisional recommendation: (a)**, with "Simulated receipt — not a tax invoice" and no GSTIN, billing or invoice fields.

## C · Successful, failed and pending simulated payments

### DP-05 · Simulated payment outcomes

**Status: Approved interim rule** (prototype planning).

- **Existing:** CD-08; TE-4 extension; ADR-0007 amendment; PD-B2B-2; audit P0-2.
- **Rule:** in the `prototype` profile only, the payer chooses the outcome on `/prototype/payment`: Complete the payment · Make the payment fail · Leave it unconfirmed.
  - The outcome is written by `system:payment-provider` with sample provenance, so "mark paid" stays impossible.
  - No card or UPI fields; nothing is collected; no provider branding.
  - Until amounts are decided, the page shows no amount.
- **Effects:**
  - **Frontend:** the A4 page and the A5 outcome states.
  - **Sample platform:** a new `PaymentStandIn` mode.
  - **Domain and contracts:** unchanged transitions and `PaymentOutcomePort`.
  - **Tests:** e2e for all three outcomes; a bundle scan proves the page is absent from staging and production builds.
- **Still needed:** the ADR-0007 amendment is recorded in the increment that builds the page.

### DP-06 · Pending-payment behaviour

**Status: Approved provisionally**, with the recovery and reset path below.

- **Existing:** CD-09; U-2; REQ-08; SA-05 excluded (P1-6).
- **Rule:** a payment left unconfirmed stays "Payment not confirmed" until it is resolved. There is no timeout, no automatic failure and no Super Admin control.
- **Recovery and reset path:**
  1. PU-10 shows "Payment not confirmed" with "Check again", which re-reads the status and changes nothing.
  2. A tester resolves the pending attempt from the `/prototype` support index (prototype profile only) by completing it or making it fail. That is the same provider outcome as DP-05.
  3. While an attempt is pending, a new payment cannot start (REQ-08). Resolving it is therefore the only way forward for that request.
  4. If a tester abandons the world, **Reset** (DP-18) restores the starting world **in that browser only**. Nothing on any other browser changes.
  5. A redeploy that changes the seed starts every browser clean (CD-18). Testers are told before it happens.
- **Effects:**
  - **Frontend:** a pending list on the support index.
  - **Contracts:** a prototype-only port to report the outcome of a named attempt.
  - **Tests:** e2e for pending → resolved later, and for Reset → seed.
- **Confirm after use:** whether the pending list needs filters, and whether testers need a resolve link from PU-10 itself.

### DP-07 · Payment attempt history

**Status: Approved interim rule** (prototype planning).

- **Existing:** U-1; U-7; REQ-07. The domain already keeps every attempt.
- **Rule:**
  - Every attempt is listed, newest first, with its outcome and time, on PU-10 (A7), IA-23, SA-07 and SA-26.
  - One seeded failed-then-confirmed history is added to a background external institution, with its own seeded times. The exact seed values are proposed in that increment's scope.
  - Whether a retry reuses the quote waits on DP-02.
- **Effects:**
  - **Frontend:** history rows.
  - **Contracts:** an attempt list on the views.
  - **Tests:** a seed invariant and an e2e for fail → retry → confirm.

### DP-08 · Payment while the institution is paused

**Status: Approved interim rule.** It confirms and extends PD-B2B-3.

- **Existing:** PD-B2B-3; CD-14; U-5. Pause blocks every Institute Admin write, but `startPayment` is not checked today.
- **Rule:**
  - Starting a payment is refused while the institution is paused (`institution-paused`).
  - A "confirmed" report is refused while paused, so the attempt stays pending until access resumes. A "failed" report is still recorded.
  - Only renewal and more-licences payments can meet a pause: a new institution can be paused only after activation.
- **Effects:**
  - **Domain:** the two refusals.
  - **Contracts:** `startPayment` gains `Refused<'institution-paused'>`.
  - **Frontend:** IA-17 hides "Open the payment page" while paused; PU-12 treats the refusal as not payable.
  - **Tests:** units and e2e.
- **Still needed:** sign-off of the simulated page's refusal line (U-5) when DP-05's page is built.

## D · Duplicate-institution prevention

### DP-09 · Duplicate institutions

**Status: Approved interim rule** (the safeguard only). The Q-A1 link command stays a PM or stakeholder decision.

- **Existing:** audit P0-5 (confirmed defect, still present at `main`); Q-A1…Q-A4; INST-01; SEL-05; T-01.
- **Rule (interim):**
  - When a public request names an institution that already exists (normalised name), SA-03 warns and names the existing record or records.
  - Approval is refused (`policy-open`, SEL-05) while the match is unresolved.
  - Nothing merges automatically, and the public requester learns nothing.
- **Later, decided separately:**
  - Q-A1(a): the Super Admin links the request.
  - Q-A2: a linked request keeps the institution's route, internal or external.
  - Q-A3: two same-name institutions are allowed after an explicit confirmation.
  - Q-A4: deferred with DP-12.
- **Effects:** SA-03 warning; an additive decision-page field; a domain refusal; regression tests from the P1 register reproductions.

## E · Renewal and additional licences

### DP-10 · Renewal

**Status: Open: management** (renewal commercial rules).

- **Existing:** Q-B2; OD-B3-09; CD-13 (open); U-3; T-07. Today a paid renewal changes no plan.
- **Options:**
  - (a) Extend the same plan by one term.
  - (b) A new plan starting on the old end date.
  - (c) A new plan starting today.
- **Provisional recommendation: (a).** The term runs from the later of the plan's end date and today.
  - External: on payment confirmation. Internal: at approval.
  - One open renewal per plan.
  - Price: one full term (open with DP-01).

### DP-11 · Additional licences

**Status: Open: management** (additional-licence commercial rules).

- **Existing:** Q-B3; Q-D7; U-4; CD-13 (open).
- **Options:**
  - **Effect:** (a) add N to the plan's licence figure; (b) a separate top-up record.
  - **Price:** (i) N × the term figure, not pro-rated; (ii) pro-rated; (iii) unpriced.
- **Provisional recommendation: (a) + (i).** The plan's end date is unchanged. External: on payment confirmation. Internal: at approval.

### DP-12 · New experiments for an onboarded institution

**Status: Deferred from the first implementation** (not cancelled; stays on the platform roadmap).

- **Existing:** Q-B1; Q-B4; BR-043.
- **Meanwhile:** the DP-09 safeguard catches the public-catalogue path.
- **Later:** Q-B1(a), a separate plan; Q-B4(a), a third IA-17 request kind.

## F · Institution activation and entitlements

### DP-13 · Activation and entitlements

**Status: Approved interim rule** (preserve the existing separation).

- **Existing:** ACC-02; BR-036 ("Approved" ≠ "active", "Payment started" ≠ "paid"); REQ-07; REQ-09; STK31-19.
- **Rule:**
  - External access activates only when the provider confirms. Internal access activates at approval.
  - The entitlement is one access plan: the approved experiment × format items, the licence figure and the term dates, starting on the activation date.
  - The Institute Admin is assigned only after activation.
- **Effects:** none new; existing ACC-02 tests stay.

### DP-14 · Licence counting

**Status: Deferred from the first implementation** (not cancelled; stays on the platform roadmap).

- **Existing:** Q-D1…Q-D7; T-06; ACC-08.

### DP-15 · Internal BITS institutions

**Status: Approved interim rule** (preserve the payment exclusion).

- **Existing:** ND-07; SC-31; STK31-19; CD-11; register Part E.
- **Rule:**
  - The Super Admin's route choice at SA-03 stands, locked once set.
  - Internal institutions never see a quote, payment, receipt or payment row; IA-23 shows "Subscription" only.
- **Tests:** the exclusion is asserted at the domain, contract and e2e layers in every commerce increment.

## G · Secure hosted prototype with independent browser data

### DP-16 · Hosted-prototype profile

**Status: Approved interim rule: develop the profile; do not deploy.**

- **Existing:** CD-17; audit P0-4; TE-3, TE-4, TE-6.
- **Rule:**
  - A new `prototype` value for `APP_ENV` turns on browser persistence, Reset and the simulated provider.
  - `staging` and `production` keep every stand-in off and show no commerce, so `main` stays releasable.
  - No deployment until DP-17 is approved.
- **Effects:**
  - **Config:** the env schema, `local-prototype.ts`, `composition.ts` and the scans.
  - **Tests:** env schema units; a bundle scan per profile with positive and negative controls; e2e under `prototype`.

### DP-17 · Access protection

**Status: Open: management** (hosting security approval).

- **Existing:** TE-8 ("the permissive sample sign-in is never deployed publicly"); ADR-0007 (test hooks never hosted). No middleware exists.
- **Options:**
  - (a) Host-level password or SSO on every deployment, previews included.
  - (b) App-level basic-auth middleware.
  - (c) Public access with a TE-8 exception. Not recommended.
- **Provisional recommendation: (a)**, with HTTPS only, `noindex`, test hooks off, sample people only, tester credentials outside product copy, and a host that runs `next start`.

### DP-18 · Independent browser data

**Status: Approved interim rule.**

- **Existing:** TE-6; CD-18; audit §7.2; P0-7.
- **Rule:**
  - One world per browser, shared by that browser's tabs and never by another browser.
  - Reset restores the starting world in that browser.
  - A one-time clean start is accepted when a deploy changes the seed.
  - The sample clock is kept (2 Oct 2026, 10:00 IST, plus elapsed time).
  - The 12-institution roster is a later decision.
- **Tests:** a snapshot-size measurement; a two-context isolation e2e.

## H · Design reference

### DP-19 · Design reference for the build

**Status: Open** (final visual-design sign-off).

- **Existing:** decision register Part D; W-2; W-3; CD-16; PD-B2B-1…6 (provisional).
- **Provisional recommendation:** canvas v34 as the build reference for the `prototype` profile only, with final sign-off at a four-width review build. W-3 needs explicit acceptance.
- Until then, increments change approved screens only with approved components and words, and each new word is listed for sign-off in the increment's scope.

---

## Out of scope for this prototype

The following are left out:

- Individual (B2C) purchasing (STK31-04).
- A real payment provider or payment collection (A-17).
- GST invoices.
- Refunds and cancellation (QP-18).
- Offline or purchase-order payments (SA-05).
- Coupons.
- Bundles (QP-09).
- Decline, close and leaving "Information requested" (Q-E1…E4). Testers use Reset.
- Institute Admin invitation (T-11).
- Requester re-entry from another browser (T-01).

## Implementation sequence

The amount-free path comes first, so development continues while pricing stays open. Each increment is one pull request and needs its own scope approval. Each ends with `pnpm verify` green (the gate until a CI runner exists, VD-18) and every frozen-design checksum OK.

| Inc. | Scope                                                                                                      | Rests on            | Status                                     |
| ---- | ---------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------ |
| I1   | Duplicate-institution safeguard; paused-payment refusals; small correctness fixes                          | DP-08, DP-09        | Scope proposed separately for approval     |
| I2   | `prototype` profile, stand-in switches and Reset; bundle scans. **No deployment**                          | DP-16, DP-18        | After I1                                   |
| I3   | Simulated payment page (no amount); pending recovery from `/prototype`; retry                              | DP-05, DP-06, DP-08 | After I2                                   |
| I4   | Payment attempt history on PU-10, IA-23, SA-07 and SA-26 (no amount); seeded failed-then-confirmed history | DP-07, DP-15        | After I3; screens wait on a DP-19 decision |
| —    | Quotation, amounts, currency and receipts                                                                  | DP-01…DP-04         | **Waits on management**                    |
| —    | Renewal and additional-licence plan effects and prices                                                     | DP-10, DP-11        | **Waits on management**                    |
| —    | Hosted deployment                                                                                          | DP-17               | **Waits on management**                    |
| —    | New experiments for onboarded institutions; licence counting                                               | DP-12, DP-14        | Deferred from the first implementation     |

## Branching strategy

1. **Draft PR #1 carries this pack.** It stays documentation-only and is not merged until the owner decides.
2. **I1 is built on its own feature branch cut from the current `main` baseline (`d0594ff`)**, independent of PR #1. I1 does not touch `v2/docs/v3/b2b-commerce/`, so the two cannot conflict.
3. **One short-lived branch per increment**, cut from the latest `main` after the previous increment merges. Only one code PR is open at a time. Each PR is a draft until `pnpm verify` and the checksums pass.
4. **Never** push to `main`, force-push a reviewed branch, or deploy.
