# ADR-0007 — Test-only controls, sample clock and seeded system facts

|                         |                                                                                                                                                                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**              | Accepted                                                                                                                                                                                                                                                                  |
| **Date**                | 12 Oct 2026                                                                                                                                                                                                                                                               |
| **Exceptions recorded** | TE-5 (sample clock) and TE-7 (build flags and test hooks) in `OPEN_DECISIONS.md` Part E, against `ARCHITECTURE.md` §14 ("no scenario selector, no demo clock, no stand-in controls in V2") and `1b090c9:v2/packages/config/src/env/index.ts` ("no prototype flags")       |
| **Audit ids**           | TE-5, TE-7, AD-09, AD-10, AD-11, VD-17, X-8, X-15, AD-14, gate G-2, register A4 (b)/(d)                                                                                                                                                                                   |
| **Implemented in**      | WP-0.4 (test harness), WP-0.11 (clock, seed, stand-ins), WP-0.12 (flags, test-hook bridge)                                                                                                                                                                                |
| **Owner sign-off**      | **Approved 12 Oct 2026 — G-2:** "Controlled sample identity and test-only clock." "Test-only environment switches outside the product UI." **AD-14:** "Use seeded/test-only review-start facts. Do not invent a rule that opening a request automatically starts review." |

## Context

Several drawn states can be reached only through system events with no human control:

- payment outcomes;
- runtime activity and completion;
- time-based states such as "Ending soon", "Access ended" and "Result ready" by date;
- the request moving from "Submitted" to "Under review" (B1-13 timeline, where no control is drawn);
- licence waits and overlapping grants.

Tests and the seed must reach them, but the product may show no stand-in control, clock or selector. The committed environment schema allows only `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_APP_ENV`.

## Decision

1. **Sample clock (TE-5).** Every decision and derivation reads time through `ClockPort.now()`. The sample clock is anchored to a sample "today": `now = anchor + (real now − seeded-at)`. Time-based states are derived at read time, never scheduled. `setSampleNow` is exported only from `@xr/sample-platform/testing`, so time travel happens only through CI test hooks. **Nothing in the product shows or sets the clock.**
2. **Two build flags (TE-7)**, read once through `@xr/config/env` and declared in Turbo strict env:
   - `NEXT_PUBLIC_XR_DATA_SOURCE = sample | api`, which is data supplied at boot;
   - `NEXT_PUBLIC_XR_TEST_HOOKS`, present only in CI/Playwright builds and never in any hosted build.

   The test-hook bridge is chosen by a build-time alias, so non-CI bundles contain no hook code. Nothing reads `process.env` ad hoc.

3. **Test hooks, never UI:**
   - the CI-only boot descriptor that seeds a fixture world and a session (ADR-0003);
   - `actAs` to run a port command as another actor;
   - fault injection for the drawn failure states;
   - the Phase-0 component specimen harness (VD-17), outside the product build.

   No test uses a UI to choose an identity, and no product page drives a system transition.

4. **Seeded and test-only system facts.** The stand-in system writers (clock, payment outcome, runtime report, routing policy, licence-wait oracle, overlap policy; ADR-0002) take their values only from the seed and from tests.
   - **Review start (AD-14):** the requester's "Submitted" becomes "Under review" only from a seeded or test-supplied review-start fact. **No product code path, and no rule about opening SA-03, starts review.** The product question (P1-04) stays open until the owner answers it, before Phase 1.
   - **Overlapping grants:** the overlap case returns `policy-open` with no default (DV-1; OD-B2-01 open).
   - **Choice-question marks:** supplied by fixtures, with no scoring engine (DV-2; P4-01 open).
5. Every stand-in or fixture event carries a sample-only provenance inside the `@xr/sample-platform` envelope, so it can never pass as runtime traffic (parity row P-12).

## Consequences

- Every drawn state stays reachable in tests without a demo surface. Static scans and bundle sentinels fail if hook code, "DEMO" wording or a clock control reaches a product bundle.
- Hosted builds always run on the anchored clock and the seed.
- Later phases add stand-ins only with their own exception signed first: TE-3 runtime stand-in route (before Phase 3), TE-4 payment outcome (before Phase 1).

## Removal trigger

- **TE-5:** real backend time.
- **TE-7:** the data source is fixed to `api`, and test hooks are re-pointed to API seed endpoints in test environments.

## Evidence

- `v2/docs/v46/audit/Appendix-D-Architecture.md` §2.5 (test identity), §2.6 (TE-5, TE-7), §3.3–§3.6 (seed, determinism, clock, reset), §7.4 (failure injection).
- `v2/docs/v46/audit/Appendix-F-Phase0-Plan.md` §0.2 (X-8, X-15), §4.4 (clock), §7.2 (Playwright sessions, boot descriptor).
- `v2/docs/v46/audit/Appendix-C-Schemas-and-Contracts.md` §3 (stand-in ports, `reviewStartedAt` on M03).
- `v2/docs/v46/audit/Appendix-G-Owner-Decisions.md` A4 (b)/(d), P1-04, DV-1, DV-2; `v2/docs/v46/audit/OWNER-REVIEW.md` §0 row 8.
- Board B1-13 (review-started timeline); `1b090c9:v2/docs/ARCHITECTURE.md` §14; `1b090c9:v2/packages/config/src/env/index.ts`.

## Amendment — Phase-1 Package 1C (14 Oct 2026): TE-4 payment outcome and the request seams

**Owner authorisation (Package 1C, TE-4 approved):** a provider-neutral payment as B1-08 draws it;
"Continue to payment" may confirm through the approved sample payment stand-in **in local prototype
builds**; "not confirmed" and "failed" come from fixtures or CI hooks unless the frozen behaviour
gives an ordinary user action. **No actual payment provider, money movement, payment details,
invented amount, payment-method collection or manual "mark paid" control.** Approval, payment
requirement, payment confirmation and activated access stay separate. "This is not authorization to
deploy simulated payment behavior as a real payment system."

1. **The stand-in lives in the sample adapter.** `PaymentStandIn` (`@xr/sample-platform`
   `platform/core.ts`) answers the payment just started. The composition root of the sample data
   source asks for `confirm-on-start` only in a local prototype build (`NEXT_PUBLIC_APP_ENV` =
   `development`, the default); a `staging` or `production` build leaves a started payment
   unconfirmed, as no provider reports (`apps/web/src/platform/composition.ts`); the API data
   source has no stand-in. Its report is the payment provider's own system command
   (`PaymentOutcomePort.report`, `handlers/payment-provider.ts`), written by
   `system:payment-provider` with `sample-standin` provenance after the requester's
   `startPayment` has committed — never the requester's write and never a product control.
   Confirmed for a new external institution: the plan is created and access activates (ACC-02);
   for an existing institution no plan is written while OD-B3-09 is open.
2. **Test-only outcomes.** `planPayment(platform, 'pending' | 'failed' | 'confirmed')` and the
   provider port (`standinsOf(platform).paymentOutcome.report`) are exported from
   `@xr/sample-platform/testing` only.
3. **Request seams of the test-hook bridge** (marker `xr-web-test-request-seams`, in `pnpm verify`'s
   bundle sentinels and the test-hook build's required markers): `startReview(reference)` records
   the AD-14 review-start fact through the existing seam; `planPayment(outcome)`; and
   `reportPayment(reference, outcome)`, the provider's later report. Their writes invalidate the
   page's reads like `actAs` receipts. Playwright helpers: `startReview`, `planPayment`,
   `reportPayment` (`apps/web/e2e/support/act-as.ts`).

TE-4's removal trigger is unchanged: a payment provider decided (T-05 / R06).
