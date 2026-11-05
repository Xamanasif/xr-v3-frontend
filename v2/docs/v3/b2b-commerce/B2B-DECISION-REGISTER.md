# B2B commerce — decision register

|             |                                                                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Status**  | Living register for the B2B commerce **design exploration**. Nothing here authorises implementation                                                                                  |
| **Created** | 4 Nov 2026                                                                                                                                                                           |
| **Rule**    | A decision is closed only by the owner. "Provisional" means accepted for the design, open to revision before implementation. "Open" means undecided; the canvases hold a placeholder |
| **Extends** | `B2B-COMMERCE-SCREEN-SPEC.md` §8 (CD-01 … CD-18); `../../OPEN_DECISIONS.md` A-17 (payment provider and pricing construction) stays open                                              |

## Part A · Provisional, design-only owner decisions of 4 November 2026

The owner reviewed the complete canvas and its QA report and found the visual direction acceptable for continued review — **not** final authorisation for implementation — and recorded the following provisional decisions for the design.

| ID           | Status                        | Owner decision                                                                         | How the design applies it                                                                                                                                                                                                                                                           | Supersedes                                       |
| ------------ | ----------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **PD-B2B-1** | **Provisional** · design only | Include external payments in the Super Admin Operations description                    | Operations lead line: “Device transfers, support reports, access that is ending and external payments.” — on SA-26 at every width and on the head comparison board. The line is shared by all four Operations tabs                                                                  | Wording item W-1                                 |
| **PD-B2B-2** | **Provisional** · design only | Preserve successful, failed and unconfirmed simulated payment states                   | The simulated payment page keeps its three outcomes (Complete the payment, Make the payment fail, Leave it unconfirmed); PU-10 keeps its three approved outcome states (A5) with the Payments section (A7)                                                                          | —                                                |
| **PD-B2B-3** | **Provisional** · design only | Do not allow payment completion while an institution is paused                         | IA-23 paused state hides “Open the payment page” and keeps receipts readable. The simulated payment page must refuse completion for a paused institution; that refusal is still to draw (coverage plan, scenario S-5)                                                               | CD-14 recommendation (now provisionally decided) |
| **PD-B2B-4** | **Provisional** · design only | Remove the proposed “Paid from: This browser” field                                    | Removed from PU-18 at 1440 · 1024 · 768 · 375; the print layout never had it                                                                                                                                                                                                        | CD-15, receipt part                              |
| **PD-B2B-5** | **Provisional** · design only | Use canonical seeded workflow dates and times                                          | REQ-0042 times follow the seeded walk (`v2/packages/sample-platform/src/testing/walk.ts`): approved 8 Oct 2026, 11:20; payment started 14:55; provider outcome reported 15:05. The seed has no failure; the failed outcome reuses the seeded provider-report time (15:05) — see U-7 | Wording item W-4 (the v46 frames’ 14:52 / 14:58) |
| **PD-B2B-6** | **Provisional** · design only | Preserve existing approved Institute Admin identifier behaviour pending reconciliation | IA-17 and IA-03 keep the REQ- and ACC- references the approved IA-v1 export shows; the new IA-23 adds none. Reconciliation with the role-workspace identifier rule stays open (U-8)                                                                                                 | Wording item W-5 (until reconciled)              |

## Part B · Commerce decisions (from the specification §8.2)

| ID    | Decision                                  | Status                                                                                                             | What the design shows meanwhile                                                                               |
| ----- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| CD-01 | Price basis                               | **Open** (owner, 4 Nov 2026)                                                                                       | Lines per experiment × format with licences, term, price per licence and amount — all placeholders            |
| CD-02 | Currency and display                      | **Open** (owner, 5 Nov 2026: currency confirmation; DP-03)                                                         | INR with the ₹ sign and Indian grouping, as placeholders                                                      |
| CD-03 | Tax (including GST)                       | **Open** (owner, 4 Nov 2026)                                                                                       | No tax line; “No tax is calculated.” beside every amount                                                      |
| CD-04 | Sample price values                       | **Open** (owner, 4 Nov 2026)                                                                                       | `₹ X,XX,XXX` (totals), `₹ X,XXX` (per licence); no figures                                                    |
| CD-05 | Disclaimer words                          | Recommendation only                                                                                                | “Sample prices for this prototype — not BITS prices. No tax is calculated.”                                   |
| CD-06 | Quote lifetime                            | **Open** (owner, 5 Nov 2026: final amount-based quotation behaviour; DP-02)                                        | Fixed at approval; no expiry shown                                                                            |
| CD-07 | Quotation page and printing               | Recommendation only                                                                                                | PU-17 as a page; browser print, one A4 page each for quotation and receipt                                    |
| CD-08 | Simulated provider page                   | **Approved interim rule** for prototype planning (DP-05, 5 Nov 2026)                                               | `/prototype/payment` drawn as a support page with three outcomes; not found in any other build                |
| CD-09 | Resolving an unconfirmed payment          | **Approved provisionally**, with a recovery and reset path (DP-06, 5 Nov 2026)                                     | “Check again” only; no product or Super Admin control — see U-2                                               |
| CD-10 | Receipt content and references            | Recommendation only                                                                                                | “Simulated receipt — not a tax invoice”; request reference only; “Payment confirmed”                          |
| CD-11 | IA placement and internal institutions    | Recommendation only                                                                                                | Third IA-02 tab “Subscription and payments”; “Subscription” with no payment content for internal institutions |
| CD-12 | Super Admin overview scope                | Recommendation only                                                                                                | Operations tab, four views, default “Needs payment”, counts only, no actions; read-only quotation in SA-03    |
| CD-13 | Renewal and extra-licence commerce        | **Open** (owner, 4 Nov 2026)                                                                                       | “No amount yet”; renewal and extra-licence requests keep today’s provider-neutral PU-12                       |
| CD-14 | Paying while paused                       | **Provisional** (PD-B2B-3); **approved interim rule**: no start and no completion while paused (DP-08, 5 Nov 2026) | Payment action hidden while paused; simulated page refusal still to draw                                      |
| CD-15 | “Paid from” and the PU-13 “Sign in” line  | Receipt part **provisional** (PD-B2B-4); Sign-in part recommendation only                                          | No “Paid from” line; approved Sign-in words unchanged                                                         |
| CD-16 | New screen IDs PU-17, PU-18, IA-23, SA-26 | Recommendation only                                                                                                | Used as working names, marked pending approval                                                                |
| CD-17 | Build profile                             | **Approved interim rule**: develop a `prototype` profile, do not deploy (DP-16, 5 Nov 2026)                        | A prototype build serves the simulated payment page                                                           |
| CD-18 | Saved worlds on upgrade                   | **Approved interim rule** (DP-18, 5 Nov 2026)                                                                      | Not shown in the design                                                                                       |

**Kept open by the owner (4 Nov 2026):** official pricing, tax rules (including GST), renewal pricing and extra-licence (additional-licence) pricing. None of the six PD-B2B decisions settles any of them. On 5 Nov 2026 the owner also kept open the price basis, currency confirmation, the final amount-based quotation behaviour, renewal and additional-licence commercial rules, hosting security approval and the final visual-design sign-off (`B2B-PROTOTYPE-DECISION-PACK.md`). No final business rule may be inferred from the canvases, which show placeholders only.

## Part C · Wording and data items raised by the design

| ID  | Item                                                                                                  | Status                                          |
| --- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| W-1 | Operations lead wording                                                                               | **Provisional** (PD-B2B-1)                      |
| W-2 | A1 headings: “What BITS approved costs” / “What your institution paid”                                | Open                                            |
| W-3 | v46 B1-08 says “No amount until pricing exists (ND-08)”; A1, A3 and A7 add amounts to approved frames | Open — needs explicit owner acceptance          |
| W-4 | Sample times for the unconfirmed and failed paths                                                     | **Provisional** (PD-B2B-5)                      |
| W-5 | REQ- and ACC- references in Institute Admin screens                                                   | **Provisional** (PD-B2B-6), reconciliation open |

## Part D · Design approvals still needed before any implementation

1. The Option A specification, words and placement.
2. New screens: PU-17 and PU-18 (v46 presentation), IA-23 (IA-v1 system), SA-26 (SA-v1 system).
3. Insertions into approved screens: PU-10 (A1, A5 states, A7), PU-12 (A3), the IA-02 tab set (A8), IA-17 and IA-03 (A9), the Operations tab set and lead line (A10), SA-03 and SA-07 (A11).
4. The `/prototype/payment` support page and the prototype build profile.
5. A review build at 1440 · 1024 · 768 · 375, compared side by side with the neighbouring approved screens.

## Part F · Prototype decision pack — owner direction of 5 Nov 2026

Development continues without final institutional pricing. The full pack, with options, effects and the recovery and reset path, is `B2B-PROTOTYPE-DECISION-PACK.md`. **Approved interim rules are for prototype planning only, not final platform rules**, and each implementation increment needs its own scope approval.

| ID    | Decision                                                                                                    | Status                                                             | Relates to                 |
| ----- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------- |
| DP-01 | Price basis and fictional figures                                                                           | **Open: management**                                               | CD-01, CD-04, A-17         |
| DP-02 | Quotation behaviour (amount-based)                                                                          | **Open: management**                                               | CD-06, CD-07, CD-10, U-1   |
| DP-03 | Currency and display                                                                                        | **Open: management** (currency confirmation)                       | CD-02                      |
| DP-04 | Tax, including GST                                                                                          | **Open: management**                                               | CD-03                      |
| DP-05 | Simulated payment outcomes (complete · fail · leave unconfirmed; no amount, no collection)                  | **Approved interim rule**                                          | CD-08, PD-B2B-2, TE-4      |
| DP-06 | Pending payment stays pending until resolved from `/prototype`; Reset restores the browser's starting world | **Approved provisionally**                                         | CD-09, U-2, REQ-08         |
| DP-07 | Every payment attempt listed; one seeded failed-then-confirmed history                                      | **Approved interim rule**                                          | U-1, U-7                   |
| DP-08 | No payment start and no completion while the institution is paused                                          | **Approved interim rule**                                          | PD-B2B-3, CD-14, U-5       |
| DP-09 | Interim duplicate-institution safeguard (warning; approval refused while the match is unresolved)           | **Approved interim rule** (safeguard only; Q-A1 link command open) | P0-5, Q-A1…A4, SEL-05      |
| DP-10 | Renewal                                                                                                     | **Open: management** (commercial rules)                            | Q-B2, OD-B3-09, CD-13, U-3 |
| DP-11 | Additional licences                                                                                         | **Open: management** (commercial rules)                            | Q-B3, Q-D7, CD-13, U-4     |
| DP-12 | New experiments for an onboarded institution                                                                | **Deferred** from the first implementation; not cancelled          | Q-B1, Q-B4                 |
| DP-13 | Activation and entitlement separation (external on confirmation, internal at approval)                      | **Approved interim rule**                                          | ACC-02, BR-036, REQ-09     |
| DP-14 | Licence counting                                                                                            | **Deferred** from the first implementation; not cancelled          | Q-D1…D7, T-06              |
| DP-15 | Internal BITS institutions never enter the payment journey                                                  | **Approved interim rule**                                          | Part E, CD-11, STK31-19    |
| DP-16 | `prototype` profile: develop, **do not deploy**                                                             | **Approved interim rule**                                          | CD-17, P0-4                |
| DP-17 | Access protection for any hosted deployment                                                                 | **Open: management** (hosting security)                            | TE-8                       |
| DP-18 | Independent browser data and Reset                                                                          | **Approved interim rule**                                          | TE-6, CD-18                |
| DP-19 | Design reference and final visual-design sign-off                                                           | **Open**                                                           | Part D, W-2, W-3           |

## Part E · Rules carried through every decision

- Internal BITS institutions never enter the external payment journey: no quotation, payment page, receipt or payment row.
- Every amount is a clearly marked placeholder; no real payment credentials, processing or provider branding.
- No new sidebar destination; no storefront; the public landing and PU-01 … PU-09 stay price-free.
- Frozen designs (`design/handoff-v46`, `design/v3-refined-b` including `roles/*`, `design/v1-landing`) are never edited, normalised, regenerated or re-exported.
