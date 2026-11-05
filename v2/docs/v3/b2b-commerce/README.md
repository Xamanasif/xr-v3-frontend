# B2B commerce — design exploration record

|                     |                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**          | **Design exploration only (Option A).** The owner found the visual direction acceptable for continued review on 4 Nov 2026. This is **not** authorisation to implement, and it changes no route, contract or product behaviour. On 5 Nov 2026 the owner approved **interim rules for prototype planning only** (`B2B-PROTOTYPE-DECISION-PACK.md`); each implementation increment still needs its own scope approval |
| **Created**         | 4 Nov 2026                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Baseline**        | `claude/laughing-noether-f2q7b2` @ `d0594ff` (identical to `main`)                                                                                                                                                                                                                                                                                                                                                  |
| **Owner decisions** | Provisional and design-only: PD-B2B-1 … PD-B2B-6 (4 Nov 2026); none authorises implementation — `B2B-DECISION-REGISTER.md`. Interim rules for prototype planning: DP-05, DP-07, DP-08, DP-09, DP-13, DP-15, DP-16, DP-18; DP-06 provisionally (5 Nov 2026) — `B2B-PROTOTYPE-DECISION-PACK.md`                                                                                                                       |
| **Kept open**       | Official pricing, tax rules (including GST), renewal pricing and extra-licence (additional-licence) pricing (CD-01, CD-03, CD-04, CD-13); price basis and currency confirmation; final amount-based quotation behaviour; renewal and additional-licence commercial rules; hosting security approval; final visual-design sign-off (5 Nov 2026). No final business rule is recorded here                             |
| **Frozen designs**  | Unchanged. Checked on 4 Nov 2026: `design/handoff-v46` 178 OK, `design/v3-refined-b` 46 OK, `design/v1-landing` 1 OK, `roles/IA-v1` 151 OK, `roles/SA-v1` 29 OK                                                                                                                                                                                                                                                     |

## What this folder holds

| File                             | What it is                                                                                                                                                                                                                                          | Status                                                         |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `B2B-AUDIT-REPORT.md`            | Read-only audit of the external-institution B2B frontend and commerce workflows (screens, routes, gaps, restrictions, decisions)                                                                                                                    | Record of 4 Nov 2026; findings unchanged                       |
| `B2B-COMMERCE-SCREEN-SPEC.md`    | Proposed screen specification for the eleven additions A1–A11, decisions CD-01 … CD-18, phased plan C0–C8                                                                                                                                           | Proposal; errata and superseded points listed at its top       |
| `B2B-DESIGN-HANDOFF-BRIEF.md`    | The portable brief handed to the design canvas                                                                                                                                                                                                      | Design input; errata and superseded points listed at its top   |
| `B2B-VISUAL-QA-RECORD.md`        | Visual QA of the canvas: round 1 (first five screens) and round 2 (complete canvas)                                                                                                                                                                 | Round 2: 51 PASS, 0 needing revision, 0 blocked                |
| `B2B-DECISION-REGISTER.md`       | Provisional owner decisions, the status of every commerce decision, wording items and the approvals still needed                                                                                                                                    | Living register                                                |
| `B2B-DESIGN-COVERAGE-PLAN.md`    | What is drawn, at which widths and states; scenarios still to draw; unresolved workflow behaviour                                                                                                                                                   | Living plan                                                    |
| `B2B-PROTOTYPE-DECISION-PACK.md` | The prototype decision pack (DP-01 … DP-19) with the owner's direction of 5 Nov 2026: approved interim rules, provisional recommendations, open management decisions, deferrals, the amount-free implementation sequence and the branching strategy | Interim rules for prototype planning; not final platform rules |
| `snapshots/`                     | Six PNG snapshots of proposed designs from the complete canvas: the journey board and the five new core screens at 1440 px                                                                                                                          | Proposed, pending owner approval; not implemented              |

## Design canvases

Both canvases are private claude.ai artifacts: only the owner, and the people the owner shares them with, can open them. They are exploration material, never a design authority.

| Canvas             | Link                                              | Content                                                                                                                                                     | Current version (5 Nov 2026) |
| ------------------ | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Round 1            | https://claude.ai/artifact/FGUoYUb9FvGYWGs562ouVb | Journey; PU-17, simulated payment, PU-18, IA-23, SA-26 at 1440 and 375; visual QA round 1                                                                   | `1793783483-c5b7` (v13)      |
| Complete (round 2) | https://claude.ai/artifact/W2E9N9vh64JT8d7cVNABiN | Seven pages: overview with QA report and coverage; new screens; insertions before and after; states and internal variant; responsive 1024 · 768; print (A4) | `1793789936-32f4` (v34)      |

The BEFORE boards on the complete canvas are pictures of the approved screens, rendered from copies of the frozen files; nothing under `design/` was opened for writing, re-exported or committed.

The editable canvas source (the `.dc.html` artboards and `canvas.json`) is not committed: the owner deferred it until its portability and format are verified (5 Nov 2026).

## Canvas snapshots

`snapshots/` holds a small, labelled selection of static PNG renders from the complete canvas, version `1793789936-32f4` (v34). They show **proposed** designs, pending owner approval: none of these screens is implemented or finally approved, and every amount is a placeholder. The selection is the journey board and the five new core screens at 1440 px; it holds no copy or re-export of a frozen design, and none of the BEFORE boards. See `snapshots/README.md`.

## What this folder is not

- **Not a design authority.** The frozen v46 handoff, the owner-approved V3 role exports and the V1 landing stay the authorities (`CLAUDE.md`).
- **Not an implementation plan approval.** The phased plan in `B2B-COMMERCE-SCREEN-SPEC.md` §10 is a proposal. No code, contract, test or register outside this folder changes with it.
- **Not a pricing record.** Every amount on the canvases, in the snapshots and in these records is a placeholder (`₹ X,XX,XXX`, `₹ X,XXX`); the specification’s “₹1,20,000” illustrates number formatting only (its record note, erratum 9). There are no official prices, tax rules, receipt numbers or invoices.

## Sequence of work

1. Read-only audit of the B2B frontend and commerce workflows (`B2B-AUDIT-REPORT.md`).
2. The owner selected **Option A**: propose the missing commerce screens with the existing approved component libraries and visual language.
3. Screen specification (`B2B-COMMERCE-SCREEN-SPEC.md`).
4. Option A approved as the design exploration approach only; design handoff brief (`B2B-DESIGN-HANDOFF-BRIEF.md`).
5. Round 1 canvas: the five core screens; visual QA round 1 and corrections.
6. The owner approved continuing in the same direction; complete canvas with the remaining six additions, states, internal variant, responsive reviews, print layouts and before/after comparisons; visual QA round 2.
7. Provisional owner decisions PD-B2B-1 … PD-B2B-6, applied to the complete canvas (4 Nov 2026).
8. Prototype decision pack; the owner approved interim rules for prototype planning, kept pricing, tax, quotation, renewal and additional-licence commercial rules, hosting security and final visual sign-off open, and deferred DP-12 and DP-14 from the first implementation (`B2B-PROTOTYPE-DECISION-PACK.md`, 5 Nov 2026).

## Still awaiting the owner

- The open commerce decisions in `B2B-DECISION-REGISTER.md` Part B, above all official pricing, tax, renewal pricing and extra-licence pricing.
- The open management decisions in `B2B-PROTOTYPE-DECISION-PACK.md`: DP-01 … DP-04, DP-10, DP-11, DP-17 and DP-19.
- The scope approval of each implementation increment, starting with I1, before any code is written.
- The scenarios and unresolved workflow behaviour in `B2B-DESIGN-COVERAGE-PLAN.md`.
- The design approvals in `B2B-DECISION-REGISTER.md` Part D, before any implementation starts.
