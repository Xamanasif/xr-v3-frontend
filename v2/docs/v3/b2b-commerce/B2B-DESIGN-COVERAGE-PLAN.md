# B2B commerce — design coverage plan

|             |                                                                                                                                                                         |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**  | Living plan for the design exploration. “Drawn” means an artboard on the complete canvas; nothing here is implemented                                                   |
| **Created** | 4 Nov 2026                                                                                                                                                              |
| **Canvas**  | https://claude.ai/artifact/W2E9N9vh64JT8d7cVNABiN (private), version `1793789936-32f4`                                                                                  |
| **Data**    | Seeded walk (`v2/packages/sample-platform/src/testing/walk.ts`), v46 B1-08, IA-v1 and SA-v1 sample records only. Every amount is a placeholder (PD-B2B-5 for all times) |

## 1 · What is drawn

| Addition                              | 1440                           | 1024               | 768           | 375                         | States                                                                              | Before / after · print       |
| ------------------------------------- | ------------------------------ | ------------------ | ------------- | --------------------------- | ----------------------------------------------------------------------------------- | ---------------------------- |
| A1 Commercial summary on PU-10        | Drawn                          | Drawn              | Drawn (in A5) | Drawn                       | Smaller scope · not shown (internal, under review, information requested) · paid    | Before / after 1440 · 375    |
| A2 PU-17 Quotation                    | Drawn                          | Drawn              | Drawn         | Drawn                       | Loading · couldn’t load · smaller scope · after payment · not available             | Print A4                     |
| A3 Amount and quotation link on PU-12 | Drawn                          | Drawn              | Drawn         | Drawn                       | Starting · couldn’t continue · no amount (extra licences) · loading                 | Before / after 768           |
| A4 Simulated payment page             | Drawn                          | Drawn              | Drawn         | Drawn                       | Recording · no longer waiting · not found outside the prototype build               | New page                     |
| A5 Payment outcome states on PU-10    | Same as 768, wider             | Same as 768, wider | Drawn × 3     | Drawn (confirmed)           | Confirmed · not confirmed · failed                                                  | Before / after × 3           |
| A6 PU-18 Simulated receipt            | Drawn                          | Drawn              | Drawn         | Drawn                       | Loading · couldn’t load · no receipt yet                                            | Print A4                     |
| A7 Requester payment history on PU-10 | Same as 768, wider             | Same as 768, wider | Drawn × 3     | Drawn (labelled rows)       | Waiting · failed · confirmed · hidden before any payment                            | In the A5 pairs              |
| A8 IA-23 Subscription and payments    | Drawn                          | Drawn              | Drawn         | Drawn                       | Loading · couldn’t load · payment needed · paused · internal variant (1440, 375)    | Head before / after          |
| A9 IA-17 and IA-03 insertions         | Drawn (both)                   | Region sheet       | Region sheet  | IA-17 drawn · IA-03 region  | Paid · payment required with no amount (extra licences)                             | Before / after × 3           |
| A10 SA-26 Payments                    | Drawn                          | Drawn              | Drawn         | Drawn                       | Needs payment · waiting or failed · loading · couldn’t load · nothing needs payment | Head and lead before / after |
| A11 SA-03 and SA-07 insertions        | Drawn (dialog, decided, SA-07) | Region sheet       | Region sheet  | Region sheet (incl. dialog) | Confirm (external) · decided paid                                                   | Before / after × 3           |

## 2 · Scenarios to complete

| ID  | Scenario                                  | Now          | Where it would appear                                                                                                                                                                         | Unresolved workflow behaviour |
| --- | ----------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| S-1 | Payment failure → retry → success history | Not drawn    | PU-10 Payments (A7) with several rows; PU-12 after “Try payment again”; IA-23 and SA-07 rows; SA-26 latest activity                                                                           | **U-1**                       |
| S-2 | Pending (unconfirmed) payments            | Drawn        | PU-10 “Payment not confirmed”; A7 “Waiting for confirmation”; SA-26 Waiting or failed (Sahyadri, started 23 Sep 2026, 10:00)                                                                  | **U-2**                       |
| S-3 | Renewal scenarios                         | Not drawn    | IA-17 renewal request → SA-03 → PU-12; IA-23 renewal row; PU-17 / PU-18 for a renewal                                                                                                         | **Open: CD-13**; **U-3**      |
| S-4 | Extra-licence scenarios                   | Partly drawn | IA-17 REQ-0058 “No amount yet”; provider-neutral PU-12; SA-26 Sahyadri                                                                                                                        | **Open: CD-13**; **U-4**      |
| S-5 | Paused institution at payment (PD-B2B-3)  | Partly drawn | IA-23 paused (drawn); simulated payment page refusal (to draw)                                                                                                                                | **U-5**                       |
| S-6 | Empty states                              | Partly drawn | SA-26 “Nothing needs payment” and A7 hidden before payment (drawn); SA-07 Payments for an approved institution with no payment yet (Vizag); SA-26 empty Waiting or failed and Confirmed views | **U-6**                       |
| S-7 | Internal BITS institutions                | Drawn        | IA-23 internal variant (1440, 375); PU-10 internal route unchanged                                                                                                                            | —                             |

## 3 · Unresolved workflow behaviour

These are not design choices to be made by drawing; each needs an owner answer before it is drawn as settled behaviour.

| ID  | Question                                                                                                                                                                                                                                                       | Blocks          |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| U-1 | After a failure, is every attempt listed or only the latest outcome? Does a retry reuse the quotation fixed at approval (the specification says yes)? The seed has one successful attempt, so a failure-and-retry sample needs an owner-approved seed addition | S-1             |
| U-2 | How and when does a pending payment resolve (CD-09)? No timeout, expiry or person-confirmed path is designed, and none may be invented                                                                                                                         | S-2             |
| U-3 | Does a paid renewal extend the current term or create a new plan (OD-B3-09)? Renewal pricing is open (CD-13)                                                                                                                                                   | S-3             |
| U-4 | When do added licences take effect after an extra-licence payment? Extra-licence pricing is open (CD-13)                                                                                                                                                       | S-4             |
| U-5 | Only renewal or extra-licence payments can meet a paused institution, so the refusal wording on the simulated payment page waits for CD-13                                                                                                                     | S-5             |
| U-6 | Does SA-07 hide its Payments section before a first payment, or show “No payments yet”? (IA-23 has no reachable empty state for an external institution)                                                                                                       | S-6             |
| U-7 | The seeded walk records no failed payment. The failed outcome reuses the seeded provider-report time (15:05) under PD-B2B-5; the owner may prefer a different seeded event                                                                                     | A5 failed board |
| U-8 | Reconcile the role-workspace identifier rule with the approved IA-v1 screens that show REQ- and ACC- references (PD-B2B-6)                                                                                                                                     | A8, A9          |

**Owner direction of 5 Nov 2026** (`B2B-PROTOTYPE-DECISION-PACK.md`; interim rules for prototype planning only):

- U-1: every attempt is listed (DP-07, approved interim rule). Whether a retry reuses the quotation stays open with DP-02.
- U-2: a pending payment stays pending until a tester resolves it from `/prototype`, and Reset restores the browser's starting world (DP-06, approved provisionally).
- U-3 and U-4: still open (DP-10, DP-11).
- U-5: no payment start or completion while paused (DP-08, approved interim rule). The refusal wording is still to sign off.
- U-6: still open.
- U-7: a seeded failed-then-confirmed history with its own times (DP-07). The seed values will be proposed with that increment.
- U-8: still open.

## 4 · Not drawn, and why

- Renewal and extra-licence quotations, receipts and amounts — pricing is open (CD-13).
- A failed payment row on SA-26 and IA-23 — the seed has no failed payment; the approved word “Payment failed” is named on the state sheets.
- An IA-23 empty state — it cannot occur for an external institution; internal institutions get the variant instead.
- SA-26 search and “no match” — no search is proposed for a list of six.
- SA-03 for an internal request — unchanged by A11 (no amount line).
- Dark mode — no approved dark theme exists for v46, IA-v1 or SA-v1.
