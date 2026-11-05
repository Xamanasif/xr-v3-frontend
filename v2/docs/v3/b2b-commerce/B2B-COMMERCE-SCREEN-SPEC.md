# B2B commerce screens: proposed design specification

> **Record note (preserved 4 Nov 2026).** This is the specification as delivered on 4 Nov 2026, kept verbatim except for this note. It remains a **proposal**: Option A is approved as a design exploration approach only, not for implementation.
>
> **Errata and superseded points**
>
> 1. **§3.2, Super Admin words.** For an approved request with no payment yet, the approved SA-03 “Where it stands” word is “Waiting, not confirmed” (`copy/requests.ts` `STAND.paymentWaiting`); “Not started” applies only while the request is under review or information is requested; a started, unconfirmed payment reads “Not confirmed”. The canvases follow the approved words.
> 2. **§4.7 and the public tables.** Public comparison tables and review lists become labelled rows below **600 px** (v46 `@container xp`), not 760 px.
> 3. **CD-14** is provisionally decided by PD-B2B-3: no payment completion while an institution is paused.
> 4. **CD-15**, receipt part: the “Paid from: This browser” line is removed by PD-B2B-4. The PU-13 “Sign in” part stays a recommendation.
> 5. **§3.4, references.** Institute Admin screens keep the REQ- and ACC- references the approved IA-v1 export shows (PD-B2B-6), pending reconciliation; new screens add none.
> 6. **Sample times** follow the seeded walk (PD-B2B-5): payment started 8 Oct 2026, 14:55; provider outcome 15:05.
> 7. **Kept open by the owner (4 Nov 2026):** CD-01, CD-03, CD-04 and CD-13 — official pricing, tax rules (including GST), renewal pricing and extra-licence pricing. No business rule in this document is final.
> 8. **§3.2, “Paid”.** The canvases use “Payment confirmed” for the IA word, as CD-10 suggested; CD-10 remains a recommendation.
> 9. **“₹1,20,000”** (the money-format example, two payment-fact examples and CD-02) illustrates number formatting only; it is not a price. Sample price values stay open (CD-04), and the canvases show placeholders (`₹ X,XX,XXX`).

**Status:** PROPOSAL, awaiting owner approval. Read-only: no repository file was changed, nothing was built, committed or pushed.  
**Date:** 4 Nov 2026 · **Baseline:** `claude/laughing-noether-f2q7b2` @ `d0594ff` (clean)  
**Owner decision recorded:** **Option A.** Use the existing approved component libraries and visual language to propose the missing external-institution commerce screens. Public additions follow the **v46** design authority (`@xr/ui`, `xp-*` / `xr-*` classes). Super Admin and Institute Admin additions follow their approved **V3 Refined B** systems (`@xr/ui/v3`, SA-v1 / IA-v1 compositions). No frozen file is edited, and no approved screen is redesigned.  
**Inputs:** the B2B audit (`B2B-AUDIT-REPORT.md`, same folder), `CLAUDE.md`, the code under `v2/`, the frozen designs, and `v2/docs/**`.

---

## 0. How to read this

- **New screen** means a page that exists nowhere today. It gets a proposed id that continues its role's numbering, past every registered or excluded id: PU-17, PU-18, IA-23, SA-26.
- **Insertion** means a new region or row inside an approved screen. Nothing existing is moved, restyled or removed. Each insertion is listed so the owner can accept it explicitly.
- **Prototype support page** means a page outside the product surface, the same kind as today's `/prototype/web-activity` (TE-3) and `/prototype/reset` (TE-6). It is not a designed screen, carries no screen id, and is served only by the prototype build profile.
- All proposed words are **provisional**. They would enter the state-copy register (`apps/web/src/copy/state-copy*.ts`) with `status: 'provisional'` for sign-off, as every undrawn state already does.
- `CD-nn` marks a commerce decision the owner must take (consolidated in §8).

---

## 1. Fixed rules this specification obeys

| Rule                                                    | Source                                                                                                                               | How it is respected                                                                                                                                                                                            |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No prices on public catalogue or selection pages        | Owner rule; 17/05:228; P-28; B1-05 "Never prices, never 'Buy'"; B1-06 "Never cart, basket, checkout or buy"                          | PU-01…PU-09 are **unchanged**. Amounts appear only after an approval, on the requester's own request pages (PU-10, PU-12, PU-17, PU-18), and in the IA and SA workspaces                                       |
| Internal BITS institutions never enter the payment flow | STK31-19 "Do NOT create a payment screen for internal"; REQ-09; `request/decide.ts:488`                                              | Internal requests never get a quotation, payment page, gateway, receipt or payment row. Every new view checks `route === 'external'` in the domain, never in the UI                                            |
| Selection stays a request basket                        | STK31-18; `selection.tsx:36-38`                                                                                                      | PU-06/PU-07/PU-08 untouched. The quotation is created by the **Super Admin's approval**, never by the visitor                                                                                                  |
| No real provider and no financial credentials           | ADR-0007 TE-4; START-HERE constraint 10                                                                                              | The simulated gateway has no card, UPI, bank or account fields. It offers only three outcome buttons and is labelled as simulated                                                                              |
| No official prices, GST rules or invoices invented      | Det §7.9; ND-08/ND-12; v4 9.3.1 (Phase 2)                                                                                            | Prices come from a **sample price list** labelled as sample. No tax line is shown (CD-03). The receipt is a "simulated receipt — not a tax invoice"                                                            |
| No excluded screen without separate approval            | `V3-STATUS-REGISTER.md` (SA-04, SA-05, SA-08, SA-09, PU-11, IA-12 excluded); pack guard "no manual Mark paid" (`pack/common/03…:26`) | SA-26 is **read-only**: no record-payment, mark-paid, activate, decline or refund control. Pending payments resolve only through the simulated provider (CD-09)                                                |
| Seven portals and accepted behaviour preserved          | Owner rule                                                                                                                           | No sidebar destination is added. Board 06 parity is tested (`nav/nav-config.test.ts`: "No undrawn destination"). Additions live under existing destinations (IA "Content access", SA "Operations")             |
| No internal reference in role workspaces                | Owner identifier rule (`docs/v3/IA-INTEGRATION-RECORD.md:58`; `MASTER-INTEGRATION-RESUME.md:151`)                                    | IA-23 and SA-26 name payments by institution, kind, content and date, never by REQ-/ACC-/payment ids. Public pages keep the request reference they already show (B1-07/B1-08)                                  |
| Wording scans                                           | `packages/config/policy/terms.mjs`                                                                                                   | Avoid "demo", "declin…/reject…" (so failed payments read "Payment failed", never "declined"), "tenant", "email" (write "E-mail"), US "license" and numeric dates (use "8 Oct 2026, 15:05" via `copy/dates.ts`) |
| Approved widths                                         | `packages/testing/src/playwright.ts:12` (1440 · 1024 · 768 · 375)                                                                    | Each spec gives behaviour at these widths and at the container thresholds                                                                                                                                      |
| Four separate events                                    | BR-036                                                                                                                               | Approval, quotation, payment confirmation and activation stay separate facts. "Approved" never reads as active, and "Payment started" never as paid                                                            |

---

## 2. Where the additions sit in the existing workflow

```
PU-01…PU-06 browse ─► PU-07 selection (basket) ─► PU-08 request ─► PU-09 sent ─► PU-10 status
                                    (no prices anywhere above this line)
SA-02 ─► SA-03 decision ──[internal]──► Access active (no quotation, no payment) ──► SA-07 assign IA
            │  ▲ SA-03 insertion: quotation preview in the confirm dialog + "Where it stands" amount
            └─[external approve]─► request.quote frozen ─► "Approved — payment required"
                                                      │
PU-10 ◄─ insertion: Commercial summary ───────────────┤
  └─► PU-17 Quotation (new)                           │
  └─► PU-12 Payment (insertion: amount rows) ─► /prototype/payment  (simulated provider page)
                                                  ├─ Complete the payment ─► confirmed ─► plan created ─► Access active
                                                  ├─ Make the payment fail ─► Payment failed ─► "Try payment again"
                                                  └─ Leave it unconfirmed ─► Payment not confirmed ─► "Check again"
PU-10 ◄─ insertion: Payments (requester history) ─► PU-18 Receipt (new; confirmed payments only)
IA: Content access ─► tab "Subscription and payments" IA-23 (new) · IA-17 detail insertion (amount, receipt link)
SA: Operations ─► tab "Payments" SA-26 (new, read-only) · SA-07 insertion (payments section)
```

### 2.1 Inventory of proposed additions

| #   | Addition                                                                        | Kind                                 | Route                                        | Role / surface                                    | Visual system                                      | Phase (§10) |
| --- | ------------------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------- | ------------------------------------------------- | -------------------------------------------------- | ----------- |
| A1  | **Commercial summary** on PU-10                                                 | Insertion                            | `/requests/[requestId]`                      | Requester (ticket) + the institution's IA         | v46                                                | C3          |
| A2  | **PU-17 Quotation**                                                             | New screen                           | `/requests/[requestId]/quotation`            | same gate as PU-10 (ADR-0009)                     | v46                                                | C3          |
| A3  | **Amount rows** on PU-12 Payment                                                | Insertion                            | `/requests/[requestId]/payment`              | same gate                                         | v46                                                | C3          |
| A4  | **Simulated payment provider page**                                             | Prototype support page               | `/prototype/payment?request=[requestId]`     | the payer who started the payment                 | v46 prototype frame (as `/prototype/web-activity`) | C4          |
| A5  | **Outcome states** on PU-10 (existing states, words for the simulated outcomes) | Existing states + copy               | `/requests/[requestId]`                      | same gate                                         | v46                                                | C4          |
| A6  | **PU-18 Simulated receipt**                                                     | New screen                           | `/requests/[requestId]/receipt`              | same gate                                         | v46                                                | C3/C4       |
| A7  | **Payments** section (requester payment history) on PU-10                       | Insertion                            | `/requests/[requestId]`                      | same gate                                         | v46                                                | C3          |
| A8  | **IA-23 Subscription and payments**                                             | New screen (a third tab of IA-02)    | `/institute/content-access?tab=subscription` | Institute Admin (external institutions; see §4.8) | V3 / IA-v1                                         | C6          |
| A9  | IA-17 detail and IA-03 insertions                                               | Insertions                           | existing                                     | Institute Admin                                   | V3 / IA-v1                                         | C6          |
| A10 | **SA-26 Payments**                                                              | New screen (a fourth Operations tab) | `/admin/operations/payments`                 | Super Admin                                       | V3 / SA-v1                                         | C5          |
| A11 | SA-03 and SA-07 insertions                                                      | Insertions                           | existing                                     | Super Admin                                       | V3 / SA-v1                                         | C5          |

---

## 3. Shared foundations: data, words and formatting

### 3.1 Commercial model (new; domain-owned, provider-neutral)

```ts
// packages/domain/src/commerce/model.ts  (proposed)
type CurrencyCode = 'INR'; // CD-02
interface Money {
  amountMinor: number /* integer paise */;
  currency: CurrencyCode;
}
interface PriceListEntry {
  // CD-01: basis is a decision
  experimentId: ExperimentId | '*';
  format: Technology | '*';
  term: 'monthly' | 'quarterly' | 'yearly';
  perLicence: Money;
}
interface PriceList {
  id: string;
  version: number;
  currency: CurrencyCode;
  basis: 'per-licence-per-format-per-term';
  entries: PriceListEntry[];
  sample: true;
}
interface QuoteLine {
  experimentId: ExperimentId;
  format: Technology;
  licences: number;
  term: RequestedTerm;
  unit: Money;
  amount: Money;
}
interface Quote {
  priceListVersion: number;
  preparedAt: IsoInstant;
  lines: QuoteLine[];
  total: Money;
  scope: { items; licences; term };
  sample: true;
}
```

- **Where the quote lives.** `AccessRequest.quote: Quote | null` is **frozen at the external approval** (`approveRequest` / `approveSmallerScope`, from the approved scope). It is never recomputed afterwards, so the payer pays what was approved. Internal approvals leave it `null`, and an invariant enforces that.
- **The payment attempt** (`request/model.ts:83-89`) gains `amount: Money` (a copy of `quote.total` at `startPayment`) and `channel: 'simulated'`. It stays provider-neutral: no method, provider name or payer details.
- **Receipt.** A pure read model, `receiptOf(request, attempt)`, exists only for an attempt whose `outcome === 'confirmed'`. There is no receipt table: the receipt is derived from the request record, so nothing new is stored.
- **"Until a fixed date"** terms have no recurring price. `quoteFor` answers `policy-open` until CD-01 covers them (the audit's P1-10 term-set conflict).
- **Renewal and more licences.** Quotes are `policy-open (OD-B3-09)` until CD-13. The interim (recommended) is that **only new-access external requests** enter the simulated payment flow in the first release. Renewal and more-licences requests keep today's provider-neutral PU-12 with no amount.

### 3.2 Status vocabulary (reuse; nothing new)

| Fact                                  | Requester words (B1-08, `copy/request-access.ts`)                               | SA words (SA-v1 `STAND`, `copy/requests.ts:430-454`) | Proposed IA words (IA-v1 pattern)             |
| ------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------- |
| approved-payment-required, no attempt | "Approved — payment required"                                                   | Payment: "Not started"                               | "Payment needed"                              |
| attempt pending                       | "Payment not confirmed" (history "Payment started · Waiting for confirmation.") | "Waiting, not confirmed"                             | "Waiting for confirmation"                    |
| attempt failed                        | "Payment failed"                                                                | "Payment failed"                                     | "Payment failed"                              |
| attempt confirmed                     | "Access active" (history "Payment confirmed")                                   | "Confirmed 8 Oct 2026, 15:05"                        | "Paid" (CD-10 may prefer "Payment confirmed") |
| internal                              | no payment wording at all                                                       | "Not needed (internal)"                              | no payment wording                            |

### 3.3 Money and disclaimers (proposed words, provisional)

- **Format.** `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })` gives "₹1,20,000" (Indian grouping, no paise shown; CD-02). A new `apps/web/src/copy/money.ts` would be the only formatter.
- **Sample-price line** (every place an amount appears): **"Sample prices for this prototype — not BITS prices. No tax is calculated."** (CD-05)
- **Simulation line** (gateway, receipt): **"Simulated payment — no money moves and no payment details are asked for."**
- **Receipt line:** **"Simulated receipt for a prototype. It is not a tax invoice."**

### 3.4 Reference display

- **Public pages (PU-10/12/17/18).** Keep the existing request reference ("REQ-0042"), because the requester quotes it (B1-07). Add no new payment or receipt number (CD-10 recommendation: avoids a new identifier class).
- **IA and SA pages.** No REQ-, ACC- or payment ids. Name rows by institution, request kind ("New access", "Renewal", "More licences"), content summary and date.

---

## 4. Screen specifications

Each addition lists: route and placement · reuse · sections, fields, actions, states · responsive · domain/contract/data · tests · approval and decisions.

### 4.1 A1: Commercial summary on PU-10 (insertion)

**Route and placement.** `/requests/[requestId]` (`features/public/pu-10-request-status/request-status.tsx`). It is a new `xr-section` placed **between** `StatusHeadPanel` and `Compare`, rendered only when `view.commercial !== null` (external, approved, with a frozen quote). Internal, under-review, information-requested and smaller-scope-pending requests render nothing new.

**Reuse.** `xr-section` / `xr-section-head` / `xr-h2` (as `Compare`), the `xp-sumlist` definition list (as PU-07's summary card), `Link` styled as `xr-btn xr-btn--secondary`, `Notice tone="quiet"` for the sample-price line, and `useId` headings.

**Sections and fields.**

- Heading: "What BITS approved costs" (provisional). Rows:
  - "Total": ₹ amount, from `quote.total`.
  - "Based on": "{n} experiments · {formats list} · {licences} licences · {term}", reusing `itemsLine`, `licencesLine` and `termWords`.
  - "Prepared": date, from `quote.preparedAt` via `dayMonthYear`.
- Sample-price line (quiet notice).
- **Action:** "View quotation" → PU-17. The existing next action ("Continue to payment" / "Try payment again" / "Check again") stays in `StatusHeadPanel`, unchanged.
- **States.**
  - Loading and failed: the page's existing loading and failed states (no separate state).
  - `access-active` (external): the heading becomes "What your institution paid", and a "View receipt" link → PU-18 is added.

**Responsive.**

- The `xr-section` is full width in `xp-in--read`.
- Below 600 px (`@container xp`) the link button goes full width, as `.xp-pay .xr-btn` does.
- Identical at 1440 / 1024 / 768. At 375 the dl rows stack label over value (the `xp-sumlist` behaviour).

**Domain, contract, data.**

- `requesterRequestView` gains `commercial: { quote: QuoteView; receiptAvailable: boolean } | null` (additive; provisional register PC-78).
- The domain sets it only for `route === 'external'`.
- Query: `useRequestStatus` (`queries/public-request.ts`) is unchanged; its deps already include `REQ`.

**Tests to extend.**

- `features/public/request.test.tsx`: region present for external approved, absent for internal, under review and information requested.
- `copy/request-access.test.ts`.
- `copy/state-copy.test.ts`: new keys.
- e2e `package-1c/status.spec.ts`: "Approved with changes → Payment" now asserts the total from the smaller scope.
- e2e `package-1c/status.spec.ts` "Internal route": asserts no commercial region.

**Approval and decisions.**

- Insertion into the B1-08 status frame. B1-08 f5 anticipates amounts "until pricing exists (ND-08)", so the owner's acceptance of the insertion is required.
- CD-01, CD-02, CD-05.

### 4.2 A2: PU-17 Quotation (new screen)

**Route and placement.** `/requests/[requestId]/quotation` (new `app/(public)/requests/[requestId]/quotation/page.tsx` → `features/public/pu-17-quotation/quotation.tsx`).

- Reached from A1 "View quotation" and from PU-12 ("See the full quotation").
- **Gate:** exactly PU-10's (ADR-0009: the ticket holder of the sending session, or the requesting institution's signed-in IA). Anyone else gets `PublicNotFound`.
- A request with no frozen quote (internal, undecided) **goes to its status page**, as PU-12 does (`PU-12.not-payable` pattern).

**Reuse.** `PublicMain className="xp-page"`, `xp-in xp-in--read`, `BackLink` ("Back to request status"), `xp-phead-main` + `xp-eyebrow` ("Quotation · REQ-0042") + `xp-h1`, `xp-compare` table for lines, `xp-sumlist`, `Notice tone="quiet"`, `xp-formfoot`, `Button` / `Link` (`xr-btn--primary` for the next step), `FailedBlock`, `DocumentTitle`, `useCatalogueNames` / `nameOf` (experiment names), `FormatBadge`.

**Sections and fields.**

1. **Head:**
   - eyebrow "Quotation · {reference}"
   - H1 "Quotation for {institution}"
   - lead "Prepared by BITS when your request was approved on {date}. Access starts only after the payment is confirmed." (BR-036)
2. **Who and what** (`xp-review` dl, read-only):
   - Institution; Contact person; Request reference.
   - Approved scope: experiments and formats, licences, access term.
   - "Changed from your request" marker when `approved.changed` is non-empty (reuse the `xp-diff` "Changed" chip).
3. **Lines** (`table.xp-compare`):
   - Columns: Experiment · Format · Licences · Term · Price per licence · Amount.
   - One row per experiment × format, with `FormatBadge` in the Format cell.
4. **Total:** `xp-sumlist` row "Total" ₹; the sample-price line under it.
5. **Next step:**
   - If `nextStep` is `continue-to-payment` or `try-payment-again`: primary "Continue to payment" → PU-12.
   - If `check-again`: a quiet line "Your payment is waiting for confirmation" and a link to status.
   - If `access-active`: "View receipt" → PU-18.
   - Always: "Print" (`window.print()`; CD-07) and "Back to request status".

**States.** Loading ("Loading the quotation"); failed with retry (`FailedBlock`); not found (`PublicNotFound`); not-quoted (go to status); quotation for a smaller scope (Changed chips); after activation (read-only, receipt link).

**Responsive.**

- 1440/1024: `xp-in--read` column, table full width.
- Below 760 (`labelledRows`): `xp-compare` becomes labelled rows (`td[data-label]`), as it already does on PU-10.
- Below 600: actions stack full width; the eyebrow wraps.
- Print: the header, footer and actions are hidden by a small product-layer print rule (`packages/ui/src/styles/product.css`; CD-07).

**Domain, contract, data.**

- No new method if `commercial.quote` carries the lines; otherwise `AccessRequestService.getQuotation(routeId)` → `QuotationView` under PU-10's read policy (`request.read-status`).
- Route manifest `nav/routes.ts`, link-target ledger `nav/link-targets.ts`, a `screens.ts` id `PU-17`, and the active-item map (public: none).

**Tests to extend.**

- `features/public/request.test.tsx` (or a new `quotation.test.tsx` beside it).
- e2e `package-1c/access.spec.ts`: the gate. The sending tab reads it; another tab, a forged ticket, or a signed-in other person gets not-found; the IA of the institution reads it.
- e2e `package-1e/journey.spec.ts`: walk through the quotation.
- `nav/routes.test.ts`, `nav/link-targets.test.ts`, `foundation/routes.spec.ts`, `foundation/not-found.spec.ts`.

**Approval and decisions.**

- New screen in v46 presentation. Needs owner visual approval on a review build at four widths and a `V3-STATUS-REGISTER` row ("v46 presentation, proposed extension").
- CD-01, CD-06, CD-07.

### 4.3 A3: Amount rows on PU-12 Payment (insertion)

**Route and placement.** `/requests/[requestId]/payment` (`features/public/pu-12-payment/payment.tsx`). Inside the existing `.xp-pay` card:

- After the five "What will be activated" rows, add **one** row "Amount to pay" (₹ total) and a link "See the full quotation" → PU-17.
- The existing `PAYMENT.note` changes from "You'll complete the payment on the payment step that follows…" to the simulation line (§3.3) when the prototype profile is active. **Unchanged:** guards, `startPayment`, busy state, stale refusal.

**Reuse.** The existing `PaymentRow` (dl grid `xp-review grid-cols-[200px_minmax(0,1fr)_0]`), `Notice tone="quiet"`, `Link`.

**Actions.** "Continue to payment" now (prototype profile) runs `startPayment`, then navigates to the simulated provider page (A4), instead of the instant stand-in confirmation. Outside the prototype profile, behaviour is exactly today's.

**States.** Unchanged (loading, not-payable redirect, failed, busy) plus "no quote" (renewal or more licences in the interim). In that case the amount row is omitted and today's provider-neutral copy is kept.

**Responsive.** Unchanged `.xp-pay` rules: 20 px padding and full-width buttons below 600.

**Domain, contract, data.**

- `startPayment` copies `quote.total` into the new attempt (`request/decide.ts:659-680`).
- A new `PaymentStandIn` mode, `'simulated-provider'` (`sample-platform/src/platform/create.ts:67-71`), leaves the attempt **pending** until the provider page reports.
- `composition.ts:114-121` selects the mode by build profile (CD-17).

**Tests to extend.**

- `features/public/request.test.tsx` (PU-12 cases).
- `platform/composition.test.ts`: mode per profile.
- `sample-platform/src/handlers/access-request.test.ts`: the attempt amount equals the quote.
- e2e `package-1c/status.spec.ts`, `phase-7/request-recovery.spec.ts`: reload between PU-12 and the provider page.

**Approval and decisions.**

- Insertion into B1-08 f5 (which says "No amount until pricing exists").
- CD-08, CD-13, CD-17.

### 4.4 A4: Simulated payment provider page (prototype support page)

**Route and placement.** `/prototype/payment?request=[requestId]` (opaque route id, as PU-10). A new `app/prototype/payment/page.tsx` follows the `web-activity/page.tsx` pattern: `if (!PROTOTYPE_PROFILE) notFound()`. The feature is `features/shared/prototype/simulated-payment.tsx`.

- Reached **only** by PU-12's "Continue to payment", in the **same tab**, as a hosted payment page would be.
- Also reachable for a still-pending payment from the prototype support index (CD-09).
- Gate: the same read policy as PU-12 (ticket holder or the institution's IA). A request with no pending attempt goes to its status page.

**Reuse.**

- The prototype frame and words module (`copy/prototype.ts` `PROTOTYPE_FRAME`).
- The web-activity page's components: `Button`, `Notice`, `StatusPill`, `LoadingState`.
- The v46 `.xp-pay` card for the summary.
- Nothing from the frozen design pack's preview controls (IA-v1's "Payment page" stub is preview-only and is not copied).

**Sections and fields.**

1. Frame header: product name; the page title "Simulated payment".
2. `Notice tone="info"`: the simulation line (§3.3) + "This page stands in for a payment provider. Choose what happens to this payment."
3. Summary card (read-only `xp-review` dl): Paying for: {institution}; Request: {reference}; **Amount: ₹{total}**; Started: {date, time}.
4. **Actions** (three buttons, the outcome vocabulary of v46 B1-08):
   - Primary: **"Complete the payment"** → provider reports `confirmed`.
   - Secondary: **"Make the payment fail"** → provider reports `failed`.
   - Text button: **"Leave it unconfirmed"** → no report; the attempt stays pending.

   After each, the page navigates (replace) to `/requests/[requestId]`, which shows the outcome state (A5).

5. Line: "Nothing here is collected or stored except the outcome you choose."

**States.** Connecting/loading (the web-activity pattern); not found; "Nothing to pay" (no pending attempt → status); busy (all three buttons `aria-disabled`, one live "Recording the outcome…" line); report refused (stale: re-read, then status).

**Responsive.**

- A single column at most 640 px wide, centred, matching `/prototype/web-activity`.
- Below 600, buttons stack full width with primary first.
- Focus moves to the H1 on arrival and to the result status line on busy.

**Domain, contract, data.**

- The outcome is written by `system:payment-provider` through the existing `reportPayment` handler (`sample-platform/src/handlers/payment-provider.ts`) with `sample-standin` provenance. **Never by the payer's command**, which keeps BR-036 and the "no mark paid" guard.
- Exposed on the root export only when configured, as the `webRuntime` option is (`createSamplePlatform({ simulatedProvider: true })` → `sample.simulatedProvider.report(routeId, outcome)`).
- The web composition passes it only in the prototype profile.
- ADR-0007 TE-4 amendment required.

**Tests to extend.**

- e2e `phase-7/prototype.spec.ts`: page served only in the prototype profile; three outcomes; refusals.
- `sample-platform/src/handlers/access-request.test.ts`: report → confirmed creates the plan; failed → `payment-failed`; no report → stays pending.
- `platform/test-hook-bridge.requests.test.ts`: the existing `planPayment` and `reportPayment` seams keep working for CI.
- `packages/config/src/scans/*` (the new copy passes `demo-wording` and `decline-reject`).
- `boundaries.test.ts` (sample-platform root export surface).

**Approval and decisions.**

- Not a designed screen (support page): it needs an **owner authorisation** extending TE-4 (simulated outcomes chosen by the payer on a provider stand-in) and a TE-3/TE-6-style record.
- CD-08, CD-09, CD-17.

### 4.5 A5: Outcome states on PU-10 (existing states)

No new layout. The three outcomes land on states PU-10 already renders (`request-status.tsx:119-196`; regions composed at `:102-109`):

| Provider outcome      | Request status (domain)        | PU-10 head (existing words)                                                     | Next action (existing)                            | New                                                                                  |
| --------------------- | ------------------------------ | ------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Complete the payment  | `access-active` (plan created) | "Access active" + "Access plan …"                                               | "Sign in" (see note)                              | A1 heading "What your institution paid" + "View receipt"; A7 row "Payment confirmed" |
| Make the payment fail | `payment-failed`               | "Payment failed" ("The payment didn't go through. Nothing has been activated.") | "Try payment again" → PU-12                       | A7 row "Payment failed"                                                              |
| Leave it unconfirmed  | `payment-not-confirmed`        | "Payment not confirmed" ("Access starts once the payment is confirmed.")        | "Check again" (a read, never "pay again", REQ-08) | A7 row "Waiting for confirmation"                                                    |

**Note on "Sign in" (PU-13).** It is shown to a requester who has no account (audit P1-9, G-9). Proposed: keep it for the IA path and add the provisional line "Your institution administrator signs in once BITS assigns them" (CD-15). This is copy only.

**Tests.** e2e `package-1c/status.spec.ts` already covers all three states through CI hooks. Add the same three through the provider page in the prototype-profile build (`e2e/phase-7`).

### 4.6 A6: PU-18 Simulated receipt (new screen)

**Route and placement.** `/requests/[requestId]/receipt` (`features/public/pu-18-receipt/receipt.tsx`).

- Reached from A1 ("View receipt"), A7 (the confirmed row), PU-17 after activation, and IA-23 / IA-17 (via the same public page, as IA-17 already opens PU-12).
- Gate: PU-10's. With no confirmed attempt it goes to the status page. One receipt per request: only one attempt can be confirmed.

**Reuse.** As PU-17: `PublicMain`, `xp-in--read`, `BackLink`, `xp-phead-main`, `xp-review` dl, `xp-compare`, `xp-sumlist`, `Notice tone="quiet"`, `xr-msg-icon xr-x-msg-icon--ok` + `Icon name="done"` (the PU-09 success mark), `Button`.

**Sections and fields.**

1. Success mark + H1 "Payment receipt" + the receipt line (§3.3: simulated, not a tax invoice).
2. **Payment** (dl): Status "Payment confirmed"; Confirmed on {date, time} (`attempt.outcomeAt`); Amount ₹{amount}; Paid for request {reference}; Paid from: "this browser" or "your institution administrator" (CD-15; no names or payer details are stored).
3. **What was paid for:** the quotation lines (`xp-compare`, as PU-17) + Total.
4. **What happened next:**
   - New access: "Institutional access became active on {date}. Students get access when your institution administrator gives it." (`CONFIRM_LINES.students` words)
   - Renewal or more licences, once CD-13 allows them: "This payment doesn't change your access plan from here" (`planUnchangedLine` words, OD-B3-09).
5. Sample-price line. **Actions:** "Print" (CD-07), "Back to request status".

**States.** Loading; failed (retry); not found; not-yet-confirmed (go to status); printed view.

**Responsive.** As PU-17. Below 760 the lines become labelled rows; below 600 the actions stack; a print rule hides the chrome.

**Domain, contract, data.** `receiptOf()` read model; `AccessRequestService.getPaymentReceipt(routeId)` → `ReceiptView` (`request.read-status` policy; `NotFound` otherwise); ledger, method entry, contract-suite case.

**Tests to extend.** `features/public/request.test.tsx` (or `receipt.test.tsx`); e2e `package-1c/access.spec.ts` (gate); `package-1e/journey.spec.ts`; `phase-7/request-recovery.spec.ts` (receipt reopens after reload in the same browser via kept tickets); `nav/routes.test.ts`, `link-targets.test.ts`.

**Approval and decisions.** New screen (v46). Owner visual approval. CD-10, CD-07, CD-15.

### 4.7 A7: Requester payment history, the "Payments" section on PU-10 (insertion)

**Route and placement.** `/requests/[requestId]`. A new `xr-section` **between `Compare` and `History`**, rendered when `view.commercial?.payments.length > 0`.

- The requester holds only this request's ticket (ADR-0009), so "history" is per request: every attempt, newest first.
- The existing History timeline keeps its "Payment started / Payment not completed / Payment confirmed" lines unchanged.

**Reuse.** `xr-section`, `table.xp-compare` (labelled rows below 760), `StatusPill` (tones `ok` / `wait` / `err`).

**Fields per row.** Started (date, time) · Amount ₹ · Outcome (`StatusPill`: "Payment confirmed" ok / "Waiting for confirmation" wait / "Payment failed" err) · Outcome time · Action: "View receipt" on the confirmed row only.

**States.** Hidden with no attempt. One pending row while `payment-not-confirmed`. Several rows after failures.

**Responsive.** Table at 1440/1024/768. Labelled rows at 375 (`td[data-label]`).

**Domain, contract, data.** `commercial.payments: PaymentView[]` (`{ startedAt, amount, outcome, outcomeAt }`; no attempt id in words).

**Tests.** `features/public/request.test.tsx`; e2e `package-1c/status.spec.ts` (pending → failed → retry → confirmed shows three rows).

**Approval and decisions.** Insertion into B1-08's status page layout ("nothing else", B1-08 "Layout"), so explicit owner acceptance is needed. CD-10.

### 4.8 A8: IA-23 Subscription and payments (new screen, IA-02 tab) and A9 insertions

**Route and placement.**

- `/institute/content-access?tab=subscription`: a **third LinkTab** on IA-02 after "Experiments" and "Course codes", using the existing `?tab=` mechanism (`content-access.tsx:84-120`).
- The sidebar is unchanged ("Content access" stays current).
- Alternative (CD-11): a sub-route `/institute/content-access/subscription` linked from IA-03's plan strip.

**Who sees what.**

- External institutions: "Your subscription" + "Payments".
- Internal institutions: the tab is labelled **"Subscription"**, shows only "Your subscription", and adds one quiet line: "Your institution's access doesn't need a payment." (STK31-19: no payment screen for internal; CD-11).

**Reuse (IA-v1 / `@xr/ui/v3`).** `LinkTabs`, `ContentStack`, `IaSectionHead` / `IaSectionBody` / `IaSectionCount` / `IaSectionFoot`, `IaPlanStrip` / `IaPlanStripRow` / `IaPlanStripView` / `IaPlanStripNote` (the strip IA-02 already draws per plan), `IaTermBar` / `TermTrack`, `IaListTable` (rows → stacked under its breakpoint), `StatusPill` / `toV3Tone`, `IaEmptyTitle`, `IaStatusNotes`, `TextLink`, `ListState` / `LoadingRows`.

**Sections and fields.**

1. **Your subscription** (one strip per access plan; existing plan facts, no new rules):
   - Status pill (Access active · Ending soon · Paused · Access ended).
   - Term ("Yearly · 8 Oct 2026 to 7 Oct 2027") with the term bar and days left.
   - Licences "as approved by BITS" (T-06 words).
   - Renewal state: "Renewal requested {date}" / "Renewal approved — payment needed" (from the institution's open requests).
   - Links "View plan" → IA-03; "Ask for a renewal" → IA-17's form (existing action).
2. **Payments** (external only), via `IaListTable`, newest first.
   - Columns: Date (started) · For (kind + content: "New access · Shell-and-Tube, Distillation Column" — no ids) · Amount ₹ · Status (`StatusPill`: Paid / Waiting for confirmation / Payment failed / Payment needed) · Action.
   - Actions: "Open the payment page" → PU-12 when payment is needed or failed (IA-17's existing action words), "View receipt" → PU-18 when paid.
   - Count line "{n} payments".
   - Sample-price line in the section foot.
3. **States:**
   - Loading rows.
   - Failed (IA-v1 failed pattern with "Try again").
   - No payments yet: calm empty state "No payments yet."
   - Paused institution: the read stays available and the actions are hidden, with the existing paused notice. **Decision CD-14:** may a paused institution pay?
   - Internal institution (see above).

**A9 insertions.**

- **IA-17 request detail** (`features/institute/ia-17-requests/request-detail.tsx:168-205, 289-295`): in "Where it stands" (`IaRqStands`), the payment fact shows the amount ("Payment needed · ₹1,20,000"); when paid, "Paid {date}" + a "View receipt" link. The existing "Open the payment page" stays.
- **IA-03 plan page:** one `TextLink` in the plan strip foot, "Payments and receipts" → IA-23 (external only).

**Responsive.**

- IA-v1 rules: `LinkTabs` wrap and scroll on phones.
- `IaListTable` switches to stacked rows under its own inline-size breakpoint (`useInlineSize`), as IA-04 and IA-06 do.
- Plan strips stack below 860.
- At 375 the actions become full-width text links under each row.

**Domain, contract, data.**

- New read `InstitutionService.listMyPayments()` → `InstitutionPaymentRow[]` (`{ requestKind, items, startedAt, amount, status, receiptRoute | null, paymentRoute | null }`) under a new policy `payment.list-institution` (tenant_admin, own institution).
- `getMyOverview` is unchanged. Query deps: `REQ`, `ACC`, `INST`.

**Tests to extend.**

- `features/institute/requests.test.tsx`: IA-17 stands amount and receipt link.
- IA-02 `content-access-view.test.ts` + a new `subscription.test.tsx`.
- `copy/ia-access.test.ts` / `copy/institute-requests.test.ts`.
- e2e `phase-3/institute-requests.spec.ts`: "Approved — payment required" now shows the amount; pay from IA-17 through the provider page.
- e2e `package-2a/demonstration.spec.ts`: tab presence.
- Identifier sweep (no REQ-/ACC- in words).
- `nav/routes.test.ts`, `nav/link-targets.test.ts`.

**Approval and decisions.**

- New IA screen in the IA-v1 visual system, plus an **insertion of a third tab into the approved IA-02 head**, plus IA-17/IA-03 insertions. Owner visual approval at four widths.
- CD-11, CD-14, CD-10.

### 4.9 A10: SA-26 Payments (new screen, Operations tab) and A11 insertions

**Route and placement.**

- `/admin/operations/payments`: a **fourth Operations page tab** after "Device transfers · Support · Access ending" (`nav/operations.ts:69-73`; `OperationsHead` with `LinkTabs pageTabs`).
- The sidebar is unchanged ("Operations" stays current).
- Views follow SA-20's segmented pattern (`?show=`): **Needs payment · Waiting or failed · Confirmed · All** (CD-12).

**Reuse (SA-v1).**

- SA-20/SA-22 lists: `OperationsHead`, `LinkTabs`, `SwitchToolbar` (`sa-seg`), `ListSurface`, `FilterToolbar` + `SearchInput` (institution name), `RecordTable` + `CellLines`, `StatusPill`, `ListState`, `LoadingRows`, `ListFoot`, `SaMessage` (failed), `QuietLine`.
- Row links reuse `requestAddress` (SA-03) and `institutionAddress` (SA-07).

**Columns.**

- Institution (link → SA-07; "New institution" quiet line when its record is still awaiting the first payment)
- For: kind + first experiment "+ n more" (the SA-02 `experimentsCell` words)
- Amount ₹
- Status (`StatusPill` with STAND words: "Not started" · "Waiting, not confirmed" · "Payment failed" · "Confirmed {date}")
- Approved (date)
- Last payment activity (date)
- Row action "Open request" → SA-03

No REQ/ACC ids appear in words (identifier rule).

**Summary line** (`rk-statusline` pattern): "{n} need payment · {n} waiting or failed · {n} confirmed in the last 30 days". Counts are derived from the request records; there is no money total across institutions (CD-12: may the SA see sums?).

**Explicitly absent** (excluded SA-05 and the pack guards): Record payment, Mark paid, Activate, Refund, Decline, Close, Export. The page carries one `QuietLine`: "Payments are confirmed by the payment provider, not from this page." (`CONFIRM_LINES.externalExisting` style).

**States.** Loading rows; failed (`SaMessage` + Try again); empty per view ("Nothing needs payment"); no match for search; 375 cards.

**A11 insertions.**

- **SA-03 decision** (`features/admin/sa-03-request-decision/*`):
  - (a) In the approve / smaller-scope **confirm dialog** for an **external** request, add a "What happens now" line: "The requester is asked to pay ₹{quote preview total} (sample prices)." The quote is previewed for the scope being approved. Internal dialogs are unchanged.
  - (b) In "Where it stands" (`StandList`), the Payment fact gains the amount ("Waiting, not confirmed · ₹1,20,000").
  - (c) Decided external panel: "View quotation" opens a read-only quotation dialog (V3 `ConfirmDialog` used as a viewer, or a `DefinitionList` in the panel). CD-12.
- **SA-07 institution detail:** a "Payments" `SurfaceSection` (`ReadOnlyTable`) listing the institution's attempts (date, for, amount, status), external only, placed after the plans section. An awaiting-payment institution's existing "no plan, no IA" state is unchanged.
- **SA-01 overview:** unchanged (it already counts "1 awaiting payment").

**Responsive.**

- SA-v1: `RecordTable` follows its own breakpoint (the sort bar replaces column sorting below it).
- `FilterToolbar` moves type-size filters into "More filters" below 600.
- `LinkTabs` scroll horizontally on phones.
- The page head shows the date line on phones (as OperationsHead does).
- SA-03's `DetailLayout` keeps one column below 860.

**Domain, contract, data.**

- New `AccessRequestService.listPayments(filter: { show, query })` → `PaymentOverviewRow[]` under a new policy `payment.list-all` (super_admin).
- `decisionPage` gains `quotePreview: QuoteView | null` (computed for the current decidable scope; `null` for internal or route not set) and `whereItStands.paymentAmount: Money | null`.
- `getInstitution` gains `payments: InstitutionPaymentRow[]` (external only).
- Query deps: `REQ`, `INST`.

**Tests to extend.**

- `features/admin/sa-03-request-decision/request-decision.test.tsx` and `decision-view.test.ts`: the external confirm line with the amount, absent for internal; the stands amount.
- `features/admin/operations.test.tsx` / `operations-6.test.tsx`: the tab set now has four tabs; SA-26 list, views, search, states.
- `features/admin/institutions.test.tsx`, `sa-07-institution-detail/institution-view.test.ts`.
- `features/admin/sa-01-overview/overview.test.tsx`: unchanged counts.
- e2e `phase-6/operations.spec.ts` (tab and list at four widths), `package-1d/institutions.spec.ts` (SA-07 payments section), `package-1a/decision.spec.ts` and `package-1e/decision-revision.spec.ts` (confirm dialog), `foundation/workspace-guard.spec.ts` (only the SA reaches `/admin/operations/payments`).

**Approval and decisions.**

- New SA screen in the SA-v1 system, plus an **insertion of a fourth tab into the approved Operations head**, plus SA-03/SA-07 insertions. Owner visual approval.
- SA-05 stays excluded.
- CD-12.

---

## 5. Connections: payment outcomes → institution activation → entitlements

The domain already implements every arrow below except the commercial facts (quote, amount, receipt). The simulated provider only supplies the outcome, through the existing `reportPaymentOutcome` (`request/decide.ts:701-771`).

| Step                      | External, new institution                                                                                                                                                                                                                         | External, existing institution (renewal / more licences)                                                         | Internal                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| SA approves               | Institution record created (BR-036 event 1); request `approved-payment-required`; **quote frozen**; no plan, no IA (OD-B7-11)                                                                                                                     | Request `approved-payment-required`; quote: **policy-open until CD-13** (interim: no amount, today's PU-12)      | Record + **plan created at once**; `access-active`; no quote, no payment (REQ-09) |
| PU-12 → provider page     | Attempt `pending` with `amount = quote.total`; request `payment-not-confirmed`                                                                                                                                                                    | as left                                                                                                          | never reachable (PU-12 redirects internal to status, `PU-12.not-payable`)         |
| Outcome: confirmed        | Plan ACC created from the approved scope (items, formats, licences, term; `startsOn` today; `endsOn` via `termEndsOn`); request `access-active`; institution `access-active`; **SA-07 Assign IA becomes available**; receipt available            | Request `access-active`; **plan unchanged** (OD-B3-09); receipt says "doesn't change your access plan from here" | n/a                                                                               |
| Outcome: failed           | Request `payment-failed`; institution stays "Approved — payment required"; nothing activated; "Try payment again" (a new attempt, same quote)                                                                                                     | same                                                                                                             | n/a                                                                               |
| Outcome: left unconfirmed | Request `payment-not-confirmed`; "Check again" reads only; resolution per CD-09                                                                                                                                                                   | same                                                                                                             | n/a                                                                               |
| After activation          | IA assigned (SA-07) → IA adds people (IA-10/11) → IA gives access (IA-05: only in-plan experiments × formats; licence figure display-only, T-06) → Student gate opens (`access/gate.ts`)                                                          | unchanged until CD-13                                                                                            | same chain                                                                        |
| Term end                  | `ending-soon` at 15 days (`ENDING_SOON_DAYS`, provisional), then `access-ended`. Student gate "access ended"; IA-23 shows it; renewal via IA-17 → SA-03 → payment (CD-13)                                                                         | —                                                                                                                | renewal approval, no payment                                                      |
| Pause                     | SA pauses → IA and Student see the paused banner; **paying while paused is undecided (CD-14)**. Recommended: the provider page refuses "Complete the payment" for a paused institution (the gold-standard prototype's rule, `state.js:3180-3183`) | same                                                                                                             | n/a                                                                               |

**Entitlements never come from payment alone.** Payment activates the institution's plan. Students get access only from an IA grant (SEL-04, BC9; `CONFIRM_LINES.students`). The receipt and PU-13 words say so.

**Invariants to add** (`packages/domain/src/invariants/invariants.ts`):

- (13) An internal request has no quote and no payment attempt.
- (14) Every attempt's `amount` equals its request's frozen `quote.total`.
- (15) At most one attempt per request is `confirmed`.
- (16) A confirmed new-access attempt implies exactly one plan created from that request.

---

## 6. Domain, contract and data changes (consolidated)

| Layer           | Change                                                                                                                                                                                                                | Files (proposed)                                                                                                                  | Notes                                                 |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Domain          | `commerce/` module: `Money`, `PriceList`, `Quote`, `quoteFor(scope, priceList)` (pure; `policy-open` for an until-date term or a missing price), `receiptOf(request, attempt)`                                        | `packages/domain/src/commerce/{model,quote,receipt}.ts`; export via `index.ts`                                                    | No floats: integer minor units                        |
| Domain          | `AccessRequest.quote: Quote \| null`; `PaymentAttempt.amount`, `.channel`                                                                                                                                             | `request/model.ts:83-140`                                                                                                         | Additive; existing statuses and transitions unchanged |
| Domain          | Approve (external) freezes the quote; `startPayment` copies the amount; outcome logic unchanged                                                                                                                       | `request/decide.ts:478-540, 659-680`                                                                                              | Smaller scope prices the approved scope               |
| Domain          | Policies `request.read-receipt` (= read-status), `payment.list-institution`, `payment.list-all`                                                                                                                       | `policy/rules.ts`                                                                                                                 | Same actor resolution as today                        |
| Domain          | Invariants 13–16                                                                                                                                                                                                      | `invariants/invariants.ts`                                                                                                        |                                                       |
| Contracts       | `requesterRequestView.commercial`; `decisionPage.quotePreview`, `whereItStands.paymentAmount`; `getInstitution.payments`                                                                                              | `contracts/src/draft/ports/access-request.ts:199-249`, `ports/institution.ts`                                                     | Additive fields; provisional register PC-78…          |
| Contracts       | New methods `getPaymentReceipt`, `listPayments` (SA), `listMyPayments` (IA); optional `getQuotation`                                                                                                                  | ports + `draft/ledger/methods-a.ts` + `PACKAGE_DELIVERIES` + contract-suite cases                                                 | Error words from the ledger                           |
| Sample platform | Seeded **sample price list** (`seeded.priceList`, `seedNote: 'sample — not an official BITS price'`)                                                                                                                  | `seed/prices.ts` (new), `seed/spine-start.ts`                                                                                     | Values supplied by the owner (CD-04)                  |
| Sample platform | Back-fill quotes and attempt amounts for the seeded external requests: Konark, Deccan, Malnad, Sahyadri confirmed; Vizag REQ-0037 "payment required"; Sahyadri REQ-0036 pending                                       | `seed/institutions.ts:180-215`                                                                                                    | So IA-23 and SA-26 are not empty                      |
| Sample platform | `PaymentStandIn` mode `'simulated-provider'`; root-export `simulatedProvider.report(routeId, outcome)` when configured                                                                                                | `platform/create.ts:67-71, 242`, `handlers/payment-provider.ts`                                                                   | ADR-0007 amendment                                    |
| Sample platform | Handlers for the new reads                                                                                                                                                                                            | `handlers/access-request.ts`, `handlers/institution.ts`                                                                           |                                                       |
| Persistence     | World shape changes → snapshot compatibility fingerprint changes → existing saved worlds are rejected once (clean start)                                                                                              | `persistence/snapshot.ts` (no code change; behaviour by design)                                                                   | Announce with the release (CD-18)                     |
| Web             | Routes PU-17, PU-18, `/prototype/payment`, IA-23 tab, SA-26; manifest, link-target ledger, `screens.ts`, active-item map                                                                                              | `app/**`, `nav/routes.ts`, `nav/link-targets.ts`, `nav/screens.ts`, `nav/active-item.ts`, `nav/operations.ts`, `nav/institute.ts` | No `nav-config.ts` change (board-06 parity kept)      |
| Web             | Copy `copy/commerce.ts` + `copy/money.ts`; state-copy entries (provisional)                                                                                                                                           | `copy/*`                                                                                                                          | Words in §3.3                                         |
| Web             | Queries `useQuotation`, `useReceipt`, `usePaymentsOverview`, `useInstitutionPayments` (deps `REQ`/`ACC`/`INST`)                                                                                                       | `queries/public-request.ts`, `queries/access-requests.ts`, `queries/institutions.ts`                                              | One invalidation function unchanged                   |
| Web             | Composition: payment mode and provider page by profile                                                                                                                                                                | `platform/composition.ts`, `platform/local-prototype.ts`                                                                          | CD-17                                                 |
| UI kit          | **No new component expected**; compose from existing parts. If a reusable amount cell or total row is wanted in V3, add it as a controlled extension (row in `packages/ui/src/v3/COMPONENT-EXTENSIONS.md` + specimen) | `packages/ui/src/v3/*` (only if needed)                                                                                           | Frozen v46 and V3 sheets untouched                    |
| Docs            | ADR-0007 amendment (simulated provider); OPEN_DECISIONS TE-4/TE-8 rows; V3-STATUS-REGISTER rows; decisions README                                                                                                     | `v2/docs/**`                                                                                                                      |                                                       |

---

## 7. Existing tests to extend (consolidated)

| Area                  | Files                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Domain                | `packages/domain/src/request/request.test.ts`, `institution/institution.test.ts`, `invariants/invariants.test.ts`, `status-unions.test.ts`, `vocabulary.test.ts`, `boundaries.test.ts`; new `commerce/commerce.test.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Contracts             | `packages/contracts/src/contracts.test.ts`, `draft/ledger/ledger.test.ts`, `draft/provisional.test.ts`, `draft/ports/inputs.test.ts`, contract-suite `cases/flow-a.ts`, `cases/institutions.ts`, `cases/cross-role.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Sample platform       | `handlers/access-request.test.ts`, `handlers/institution.test.ts`, `handlers.test.ts`, `one-world.test.ts` (+ `test-support/one-world/steps-spine.ts`), `world.test.ts`, `snapshot.test.ts`, `kept-tickets.test.ts`, `boundaries.test.ts`, `contract.test.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Web unit              | `features/public/request.test.tsx`, `features/public/public.test.tsx` (**asserts no amount on PU-01…PU-09**), `copy/request-access.test.ts`, `copy/requests.test.ts`, `copy/state-copy.test.ts`, `features/admin/sa-03-request-decision/*.test.*`, `features/admin/operations.test.tsx`, `operations-6.test.tsx`, `institutions.test.tsx`, `sa-07-institution-detail/institution-view.test.ts`, `features/institute/requests.test.tsx`, `ia-02-content-access/content-access-view.test.ts`, `nav/routes.test.ts`, `nav/link-targets.test.ts`, `nav/active-item.test.ts`, `nav/nav-config.test.ts` (**unchanged expectations prove no new sidebar item**), `platform/composition.test.ts`, `queries/invalidation.test.ts` |
| Web e2e (four widths) | `package-1c/status.spec.ts`, `package-1c/access.spec.ts`, `package-1c/request.spec.ts` (**no price on selection and request**), `package-1e/journey.spec.ts`, `phase-7/request-recovery.spec.ts`, `phase-7/prototype.spec.ts`, `phase-3/institute-requests.spec.ts`, `package-1d/institutions.spec.ts`, `phase-6/operations.spec.ts`, `package-1a/decision.spec.ts`, `package-1e/decision-revision.spec.ts`, `flows/walkthrough.spec.ts`, `foundation/routes.spec.ts`, `foundation/not-found.spec.ts`, `foundation/workspace-guard.spec.ts`, `foundation/a11y.spec.ts`                                                                                                                                                   |
| Scans and gate        | `packages/config/src/scans/repository.scan.test.ts` (new copy passes every term), `exceptions.ts` (only if the owner approves an exception), `pnpm verify` bundle scan (the provider page never in a non-prototype bundle, as the test-hook bridge marker is proven today)                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Parity                | No v46/V3 board exists for the additions, so board parity cannot apply. The **owner-approved review-build captures** become the baseline (as for the V1 landing review build, `DEMO-READINESS-REPORT.md:118-125`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

---

## 8. Design approval requirements and unresolved product decisions

### 8.1 Design approvals needed

1. **This specification** (placement, composition and words) under Option A.
2. **New screens:**
   - PU-17 and PU-18 (v46 presentation)
   - IA-23 (IA-v1 system)
   - SA-26 (SA-v1 system)

   Each gets a `V3-STATUS-REGISTER` row "proposed extension — owner-approved composition", distinct from "complete-role export".

3. **Insertions into approved screens:**
   - PU-10 (A1, A7)
   - PU-12 (A3)
   - IA-02 tab set (A8)
   - IA-17 and IA-03 (A9)
   - Operations tab set (A10)
   - SA-03 and SA-07 (A11)
4. **Prototype support page** `/prototype/payment`: an owner authorisation recorded like TE-3 and TE-6.
5. **Words:** every new state-copy entry is signed off (status `provisional` → `drawn` / approved).
6. **Visual review:** a review build at 1440 · 1024 · 768 · 375, with captures for every state listed above, reviewed side by side with the neighbouring approved screens.

### 8.2 Commerce decisions (CD)

| ID    | Decision                               | Recommended                                                                                                                                                                                              | Blocks         |
| ----- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| CD-01 | Price basis                            | Per licence × format × term, per experiment (STK31-15 "pricing may differ by technology"). "Until a fixed date" not priced in the first release                                                          | A1–A3, A6      |
| CD-02 | Currency and display                   | INR, "₹1,20,000", Indian grouping, no paise                                                                                                                                                              | all amounts    |
| CD-03 | Tax                                    | **No tax line** and the words "No tax is calculated" (GST invoices are Phase 2, v4 9.3.1)                                                                                                                | A2, A6         |
| CD-04 | Sample price values                    | The owner supplies the figures, or approves a placeholder set clearly marked sample                                                                                                                      | seed           |
| CD-05 | Disclaimer words                       | §3.3 lines                                                                                                                                                                                               | all            |
| CD-06 | Quote lifetime                         | Frozen at approval; no expiry in the prototype                                                                                                                                                           | A2             |
| CD-07 | Quotation page and printing            | PU-17 as a page; browser Print only (no PDF)                                                                                                                                                             | A2, A6         |
| CD-08 | Simulated provider page                | Authorise; route under `/prototype`; same tab; three outcomes "Complete the payment / Make the payment fail / Leave it unconfirmed"; outcome written by `system:payment-provider`                        | A3–A5          |
| CD-09 | Resolving an unconfirmed payment       | The provider page stays reachable for a pending attempt from the prototype support index (`/prototype`), where the tester can later complete or fail it; no product or SA control (SA-05 stays excluded) | A5             |
| CD-10 | Receipt content and references         | "Simulated receipt — not a tax invoice"; request reference only (no new receipt number); IA and SA name payments by content                                                                              | A6–A10         |
| CD-11 | IA placement and internal institutions | Third IA-02 tab "Subscription and payments" (external) / "Subscription" (internal, no payment content)                                                                                                   | A8             |
| CD-12 | SA overview scope                      | Operations tab, four views, counts only (no money totals across institutions), no actions; read-only quotation in SA-03                                                                                  | A10–A11        |
| CD-13 | Renewal and more-licences commerce     | **Interim:** keep them out of the priced flow (today's provider-neutral PU-12) until OD-B3-09 / Q-B1…B4 are answered; then price a renewal as one full term at the current list                          | A1–A6 scope    |
| CD-14 | Paying while paused                    | Refuse "Complete the payment" while the institution is paused (show the paused notice)                                                                                                                   | A4, A8         |
| CD-15 | "Paid from" and PU-13 "Sign in"        | "This browser" / "Your institution administrator"; add the line that the administrator signs in once assigned                                                                                            | A5, A6         |
| CD-16 | New screen ids                         | PU-17, PU-18, IA-23, SA-26 (continuing each role's numbering past excluded ids)                                                                                                                          | registers      |
| CD-17 | Build profile                          | A `prototype` value for `NEXT_PUBLIC_APP_ENV` (or authorise `development` builds on a host) that turns on the provider page and the other stand-ins                                                      | A3–A5, hosting |
| CD-18 | Saved worlds on upgrade                | Accept a one-time clean start when the world shape changes                                                                                                                                               | release        |

---

## 9. Minimum decisions for a credible hosted B2B prototype

**Must have** (without these the hosted demo either cannot pay or cannot be shown):

1. **CD-01 + CD-02 + CD-04 + CD-05:** a sample price model, INR, figures and the disclaimer.
2. **CD-08:** authorise the simulated provider page (a TE-4 extension).
3. **CD-17 + TE-8:** a hosted prototype profile, and how the any-password sample sign-in is protected (recommended: an access-protected deployment).
4. **CD-10:** receipt wording ("not a tax invoice") and the reference policy.
5. **CD-13 interim:** priced flow for new access only.
6. **Design approvals 8.1(1)–(4)** (spec, new ids, insertions, support page).
7. **The audit's P0-5 interim:** acknowledge the duplicate-institution guard (a repeat request must not corrupt a shared demo world).
8. **The 12-institution roster** (audit §7.3) with each institution's commercial state: needs payment, payment failed, waiting, paid, internal, ended.

**Can follow with a safe treatment:** CD-03 (default no tax line), CD-06, CD-07, CD-09 (default: pending stays pending, keep it out of walkthroughs), CD-11 / CD-12 placement details, CD-14, CD-15, CD-18, and the lifecycle rules Q-A…Q-E from the P1 register.

---

## 10. Phased implementation plan (after approval; each phase ends with `pnpm verify` green)

| Phase                                | Scope                                                                                                                                                                                                                    | Main files                                                                                             | Exit criteria                                                                                                               | Size                 |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| **C0 Approvals**                     | Owner signs this spec, CD-01…CD-18 (at least the §9 "must" set), price figures, roster                                                                                                                                   | docs only                                                                                              | Decisions recorded in `docs/decisions/README.md`, the ADR-0007 amendment drafted                                            | —                    |
| **C1 Prerequisites**                 | The audit's no-new-rule fixes: duplicate-institution interim guard, PU-10 "Reply outside the platform" line, IA-17 renewal copy, SA-02 "Payment failed" filter, until-date ≥ today, approval re-checks published formats | per `P1-DECISION-REGISTER.md` file lists                                                               | Unit + e2e for each; no behaviour change elsewhere                                                                          | S–M (≈400 lines)     |
| **C2 Commerce domain and contracts** | `commerce/` module, quote freeze at approval, attempt amounts, receipt model, invariants 13–16, policies, contract fields and methods, ledger, contract suite, seeded price list and back-filled quotes                  | domain, contracts, sample-platform                                                                     | Domain and contract suites green; one-world proof extended (quote frozen, amounts equal)                                    | M (≈900–1,200 lines) |
| **C3 Public commercial screens**     | A1, A2 (PU-17), A3, A6 (PU-18), A7 + routes, copy, state-copy, queries                                                                                                                                                   | `features/public/*`, `app/(public)/requests/*`, `copy/*`, `nav/*`                                      | Unit + e2e at four widths; **public.test asserts no amount on PU-01…PU-09**; gate tests                                     | M (≈1,000 lines)     |
| **C4 Simulated provider**            | A4 page, `PaymentStandIn` `'simulated-provider'`, composition by profile, A5 outcome states end to end, pending resolution (CD-09)                                                                                       | `app/prototype/payment`, `features/shared/prototype/*`, `sample-platform/platform/*`, `web/platform/*` | Three outcomes through the product UI in the prototype profile; non-prototype bundle carries no provider page (bundle scan) | M (≈600 lines)       |
| **C5 Super Admin**                   | SA-26 tab and list; SA-03 confirm line, stands amount, quotation view; SA-07 payments section                                                                                                                            | `features/admin/*`, `nav/operations.ts`                                                                | SA unit + e2e; identifier sweep; Operations tabs at four widths                                                             | M (≈800 lines)       |
| **C6 Institute Admin**               | IA-23 tab; IA-17 stands amount and receipt link; IA-03 link                                                                                                                                                              | `features/institute/*`, `nav/institute.ts`                                                             | IA unit + e2e; internal institution shows no payment content; identifier sweep                                              | M (≈700 lines)       |
| **C7 Hosted profile and data**       | CD-17 profile; 12-institution seed with commercial states; prepared worlds as repo fixtures; tester guide (credentials outside product copy)                                                                             | `packages/config/src/env`, `platform/*`, `seed/*`, `testing/fixtures.ts`, `docs/**`                    | A hosted build with independent per-browser worlds, payments end to end, Reset; snapshot size measured                      | L (≈1,500+ lines)    |
| **C8 Review and sign-off**           | Review build; captures of every state at four widths; owner visual review; state-copy sign-off; register rows                                                                                                            | docs, captures                                                                                         | Owner acceptance recorded                                                                                                   | —                    |

**Order and dependencies.**

- C1 and C2 can run in parallel once C0 is signed.
- C3 and C4 depend on C2.
- C5 and C6 depend on C2 and can run in parallel with C3 and C4.
- C7 depends on C4 (the profile) and the roster decision.
- Nothing touches `design/**`, the V1 landing, PU-01…PU-09, the selection basket, or the sidebar configuration.

---

## Appendix: evidence index

- **Public pages:** `apps/web/src/features/public/pu-10-request-status/request-status.tsx:31-310` (regions composed at `:102-109`; `StatusHeadPanel` `:119`, `Compare` `:199`, `History` `:288`), `pu-12-payment/payment.tsx:23-160`, `pu-07-selection/selection.tsx:36-38`, `pu-06-experiment/selection-panel.tsx:12-19`; copy `copy/request-access.ts:135-144, 409-434`.
- **Domain:** `packages/domain/src/request/model.ts:47-219`, `request/decide.ts:400-771`, `institution/model.ts:24-123`, `institution/term.ts:31-83`.
- **Payment stand-in:** `packages/sample-platform/src/handlers/payment-provider.ts`, `platform/create.ts:67-71, 242`; `apps/web/src/platform/composition.ts:110-156`, `platform/local-prototype.ts`.
- **Prototype support precedent:** `apps/web/src/app/prototype/web-activity/page.tsx`, `features/shared/prototype/web-activity.tsx:13-23`, `copy/prototype.ts:1-30`.
- **Contracts:** `packages/contracts/src/draft/ports/access-request.ts:186-249, 315-410`.
- **SA patterns:**
  - `features/admin/sa-20-support/operations-tabs.tsx`, `nav/operations.ts:69-73`, `sa-20-support/support-reports.tsx:128-182`
  - `sa-22-access-ending/access-ending.tsx`
  - `sa-03-request-decision/request-decision.tsx:117-144`
  - copy `copy/requests.ts:286-300, 368-454`
- **IA patterns:** `features/institute/ia-02-content-access/content-access.tsx:84-200`, `ia-03-access-plan/access-plan.tsx:60-110`, `ia-17-requests/request-detail.tsx:168-205, 289-295`.
- **UI kits:** `packages/ui/src/index.ts` (v46), `packages/ui/src/v3/index.ts` and `COMPONENT-EXTENSIONS.md` (V3); `packages/ui/src/styles/v46/xr-public.css:431-432` (`.xp-pay`), container thresholds `packages/ui/src/tokens/v46-constants.ts`.
- **Rules:**
  - `CLAUDE.md`; `nav/README.md` (board-06 parity, "No undrawn destination")
  - `packages/config/policy/terms.mjs` (wording scans)
  - `docs/v3/IA-INTEGRATION-RECORD.md:58` (identifier rule)
  - `docs/v3/V3-STATUS-REGISTER.md` (excluded ids)
  - `design/v3-refined-b/pack/common/03-BEHAVIOUR-AND-DATA-GUARDS.md:26`
  - ADR-0007 TE-4 amendment
  - `docs/OPEN_DECISIONS.md:115-119` (TE-4, TE-6, TE-8)
- **Gold-standard precedent (behaviour, not UI):** `ui-ux/18-unified-functional-platform/js/screens/public-request.js:1065-1104`, `js/state.js:3155-3206, 3180-3183`.
