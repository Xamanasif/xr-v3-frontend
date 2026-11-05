# B2B commerce — visual QA record

|                |                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Status**     | Record of two visual QA rounds on the design canvases, 4 Nov 2026. Design exploration only                                                                                                                                                                                                                                                                                                                   |
| **Method**     | Each artboard rendered in Chromium at its frame width (a static render of the artboard markup, not of the canvas runtime) and compared side by side with renders of copies of the frozen references. Automatic checks: fonts loaded, horizontal overflow, clipped text, content height against frame, touch targets, banned words, internal BITS institutions in payment views, sample data against the seed |
| **References** | v46 B1-08 (every PU-10 and PU-12 frame), B1-09, board 08; IA-v1 IA-02, IA-03, IA-17 and its 1024 · 768 · 375 boards; SA-v1 SA-03 (undecided, confirm dialog, decided), SA-07, Operations and their narrow layouts                                                                                                                                                                                            |
| **Integrity**  | Repository unchanged during both rounds; frozen design checksums intact (`design/handoff-v46` 178 OK, `design/v3-refined-b` 46 OK, `design/v1-landing` 1 OK, `roles/IA-v1` 151 OK, `roles/SA-v1` 29 OK)                                                                                                                                                                                                      |

## Round 1 — first five screens (round 1 canvas)

Canvas: https://claude.ai/artifact/FGUoYUb9FvGYWGs562ouVb, corrected version `1793783483-c5b7`.

| Artboard                 | Before QA      | After corrections | Found and fixed                                                                                                                                                                                                                              |
| ------------------------ | -------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Journey                  | PASS           | PASS              | No change                                                                                                                                                                                                                                    |
| PU-17 Quotation · 1440   | Needs revision | PASS              | Grey page instead of white; header not v46 (“Your selection”, no Request access); plain logo box; review-list colours swapped; table header untinted; footer links; a smaller-scope sample that narrowed a multi-experiment request (REQ-19) |
| PU-17 Quotation · 375    | Needs revision | PASS              | As 1440, plus the v46 phone header                                                                                                                                                                                                           |
| Simulated payment · 1440 | Minor defects  | PASS              | Dashed logo box; outcome list alignment; start time 15:02 corrected to the seeded 14:55                                                                                                                                                      |
| Simulated payment · 375  | Needs revision | PASS              | Bottom 136 px clipped; details list squeezed                                                                                                                                                                                                 |
| PU-18 Receipt · 1440     | Needs revision | PASS              | 404 px of dead space; unequal cards; date wrapping                                                                                                                                                                                           |
| PU-18 Receipt · 375      | Needs revision | PASS              | Date and reference wrapping; frame height                                                                                                                                                                                                    |
| IA-23 · 1440 and 375     | Needs revision | PASS              | V3 shell details (icons, rail divider, Help & support, date, avatar, Give students access); plan strip; an invented failed attempt and renewal line removed; days left corrected to 350 (22 Oct 2026)                                        |
| SA-26 · 1440             | Needs revision | PASS              | Segmented switch, status pills and table now follow SA-v1 Support and Access ending; invented experiments, dates and “Tried again” replaced with seeded records                                                                              |
| SA-26 · 375              | Needs revision | PASS              | Bottom 95 px clipped; SA-v1 phone pattern                                                                                                                                                                                                    |

Round 1 result: no artboard blocked; all passed after correction.

## Round 2 — complete canvas

Canvas: https://claude.ai/artifact/W2E9N9vh64JT8d7cVNABiN. 51 design artboards checked, plus the journey and 14 BEFORE reference renders. **Result: 51 PASS, 0 needing revision, 0 blocked**, after the corrections below.

| Artboard group              | Widths                                      | Compared with                                   | Result | Note                                                          |
| --------------------------- | ------------------------------------------- | ----------------------------------------------- | ------ | ------------------------------------------------------------- |
| PU-17 Quotation             | 1440 · 1024 · 768 · 375 · states · print    | v46 B1-08 frames, PU-12 card                    | PASS   | Header normalised; table fits at 768 with wrapped names       |
| Simulated payment           | 1440 · 1024 · 768 · 375 · states            | v46 B1-09 sign-in frame, board 08               | PASS   | Busy follows PU-12’s approved busy rule                       |
| PU-18 Simulated receipt     | 1440 · 1024 · 768 · 375 · states · print    | v46 B1-08, PU-09 success mark                   | PASS   | Two columns stack at 768; “Paid from” removed (PD-B2B-4)      |
| IA-23                       | 1440 · 1024 · 768 · 375 · states · internal | IA-v1 IA-02 at every width                      | PASS   | Rail fixed; rows stacked at 1024 / 768 as IA-v1 lists do      |
| SA-26                       | 1440 · 1024 · 768 · 375 · states            | SA-v1 Support and Access ending                 | PASS   | Words aligned to SA-03; lead wording PD-B2B-1                 |
| A1 PU-10 summary            | 1440 · 1024 · 375 · in A5 at 768 · states   | v46 B1-08 f0, f10, f4, f9                       | PASS   | Identical to the approved frame except the new section        |
| A3 PU-12 amount row         | 1440 · 1024 · 768 · 375 · states            | v46 B1-08 f5                                    | PASS   | Extra licences keep today’s card, no amount                   |
| A5 outcomes + A7 Payments   | 768 × 3 · 375 (confirmed)                   | v46 B1-08 f6, f7, f8                            | PASS   | Table reflowed; labelled rows at 375; seeded times (PD-B2B-5) |
| A9 IA-17 · IA-03            | 1440 · 375 · 1024 / 768 sheet               | IA-v1 IA-17 (REQ-0042, REQ-0058), IA-03         | PASS   | IA-03 lower sections shortened with a marker                  |
| A11 SA-03 · SA-07           | 1440 · 1024 / 768 / 375 sheet               | SA-v1 SA-03 (8 Oct, 23 Oct), SA-07              | PASS   | Dialog backdrop is a picture of the approved page             |
| Head insertions             | 1440                                        | IA-v1 IA-02 head, SA-v1 Operations head         | PASS   | Lead wording with two alternatives                            |
| State sheets (7)            | 1440                                        | v46 boards 04 / 08, IA-v1 and SA-v1 list states | PASS   | Approved words reused; new words follow the approved formula  |
| Print — quotation · receipt | A4                                          | On-screen PU-17 / PU-18                         | PASS   | One page each; 12 px minimum; 1 px rules                      |
| Journey                     | 2780                                        | The canvas                                      | PASS   | Cards updated for A5 · A7, A9, A11                            |

### Corrected in round 2

1. SA-26 payment words now use SA-03’s approved Where-it-stands words: Vizag “Waiting, not confirmed” (approved, no payment yet), Sahyadri “Not confirmed” (payment started).
2. The V3 rail brand block sat 8 px (IA) and 6 px (SA) too low on round-1 IA-23 and SA-26 at 1440.
3. The v46 public header had drifted on round-1 PU-17 and PU-18 (nav spacing, selection-icon colour, Request access border).
4. The PU-10 Payments table overflowed at 768 with five columns; the outcome time now sits under the outcome.
5. The SA-07 Payments row wrapped its date and status.
6. Print totals wrapped the amount.
7. The internal IA-23 plan strips had misaligned columns.
8. Every frame height now matches its content.
9. The Operations lead wording was proposed with payments (later PD-B2B-1).
10. The journey cards were updated for A5 · A7, A9 and A11.

### Applied after round 2 (provisional owner decisions, 4 Nov 2026)

- PD-B2B-4: “Paid from: This browser” removed from PU-18 at every width.
- PD-B2B-5: the unconfirmed and failed outcome boards use the seeded times (started 14:55, provider outcome 15:05) instead of the v46 frames’ 14:52 / 14:58.
- The coverage board records PD-B2B-1 … PD-B2B-6, the open pricing decisions and the scenarios still to draw.

### Accepted as drawn

- Inline text links shorter than 44 px (“Back to request status”, breadcrumbs, institution names): the approved screens use the same links.
- Screen-reader-only labels are clipped on purpose.
- The IA-03, SA-03 and SA-07 AFTER boards stop below the insertion with a dashed “unchanged below” marker; the BEFORE render shows the full page.
- The v46 state frames are 720 wide; their AFTER boards are 768, which doubles as the 768 review.
