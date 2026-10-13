# @xr/sample-platform

The typed mock adapter and the one shared sample world behind the draft service ports
(`@xr/contracts/draft`) — work package WP-0.11 (ADR-0002, ADR-0004, ADR-0006, ADR-0007,
ADR-0008; Appendix F §3.7, §4.1–§4.5). It builds no screen.

- **Depends on** `@xr/contracts`, `@xr/domain` and `@xr/validation` only (boundary matrix). It
  holds no business rule of its own: every decision, policy check, gate, invariant and status
  comes from `@xr/domain`; every input schema, error word and ledger entry from
  `@xr/contracts/draft`.
- **Two exports.** `.` — `createSamplePlatform`, `seed`, `SPINE_ANCHOR` — is the only one product
  code may import (the WP-0.12 composition root). `./testing` holds the stand-ins, the test seams,
  the sample-clock control, the fault plan, identity by the harness seam, the scripted walk, the
  fixtures and the contract-suite factory; it carries the marker `xr-sample-platform-testing`,
  which `pnpm verify` proves never reaches a product bundle.

## Architecture

```text
src/
├─ world/         World envelope {schema, version, seedId, worldVersion, anchor, seededAtReal,
│                 records, identities, seeded, history, idSource, runtimeEvents,
│                 processedCommandIds, seedNotes, sentContent}; tables; read queries
├─ ids/           per-prefix id source: reservations first, then above the drawn floor
├─ clock/         fixed / anchored / manual clocks; the platform clock only tests can move
├─ store/         in-tab mutex, commit (worldVersion + 1), change bus {worldVersion, changed}
├─ persistence/   memory driver (ADR-0004 option A)
├─ session/       browser session: selection basket and request tickets (sessionStorage or memory)
├─ pipeline/      the eight-step pipeline, actor resolution, ledger guards, invariants
├─ handlers/      one module per port family (the 139 WP-0.11 methods)
├─ platform/      core, port builder, createSamplePlatform
├─ seed/          seed(anchor): catalogue, platform roles, institutions, production history
├─ standins/      the six stand-in ports (exported from ./testing only)
└─ testing/       harness, scripted walk, fixtures, contract factory (./testing)
```

**The pipeline** (Appendix F §4.5). Every command 1. runs under the in-tab lock on the latest
world; 2. resolves the actor from the canonical records — the session holds a person id only, so a
role, scope or account change applies to the very next call, and no caller ever passes a role,
institution, permission or gate; 3. checks domain policy and record scope (`may`, `canRead`); 4. validates the input with the method's DTO schema (drawn words); 5. checks the record revision
(`stale-version`), runs the pure domain decision and stages the records; 6. checks the twelve domain
invariants; 7. commits the next world version, appends one history entry and publishes the exact
changed refs; 8. answers the typed `Result`. A refusal writes nothing — no record, no id, no
history. Reads and previews write nothing (a read that stages a write throws). A repeated
client-minted command id (`platform.withCommandId(id)`) answers its first receipt and applies
nothing — also for a command that changed nothing (its receipt is kept without a new world version,
history entry or event), and before any planned test failure; reusing it for another method is a
programming error, and new command ids continue past every id a world keeps. A write to an
existing record that names no revision (`expectedRev: null`) is stale. Policy and scope are checked
before the input. A call runs in the session it was made in: sign-in and sign-out take their turn
behind the calls already made, and a call whose session has since ended answers `not-signed-in`.
Every answer's error kind, refusal code and open decision is checked at run time against the
method's ledger entry.

**Methods.** The 138 methods Appendix F §4.1 places in Phase 0, plus
`ProductionService.listAllContent` (the E-alt3 exception below). The other 44 keep their phase:
calling one rejects with the phase it lands in — never an invented value.

## The E-alt3 exception — `listAllContent`

Owner decision (WP-0.11 authorisation §2): `ProductionService.listAllContent` is implemented in
WP-0.11 **only** so the Super Admin stuck-submission workflow (E-alt3) can reach the seeded stuck
record. It keeps its WP-0.10 signature, reads under the existing rule (`canRead` SUB-37: the Super
Admin reads every submission except a draft; SUB-16 keeps drafts the Vendor's) inside the Super
Admin's read-only workspace, and grants nothing new. A published experiment's row reads under
EXP-03, and its open correction is named only where the Super Admin may read it (UPD-18 / UPD-26:
nothing before the Academic Reviewer approves it) — `getContentRecord` withholds the same id. SA-12
itself is still a Phase-6 screen, and no other Phase-6 method moved. The ledger records the departure in `PHASE_SCHEDULE_EXCEPTIONS`
(`@xr/contracts/draft`); Appendix F and the audit evidence are unchanged.

## Persistence — a reload resets the world

One shared world per browser tab, in memory (ADR-0004 option A). Every role signed in in that tab
reads and writes the same world; signing out and in as someone else keeps it. **A page reload or a
full navigation rebuilds the world from the seed — every change made in the session is lost.**
Nothing is written to `localStorage` or IndexedDB and nothing is shared between tabs; browser
persistence (TE-6) is not authorised. **It must be reviewed before the hosted manager
walkthrough.** Only the selection basket and the request tickets use `sessionStorage` (with a
memory fallback) — board-drawn browser-session behaviour, not world persistence.

## The sample world

### `seed(anchor)` — spine-start

The sample "today" is 2 Oct 2026, 10:00 (Indian time), fourteen minutes before REQ-0042 arrives
(B1-11). It holds the platform people (Anil Shetty and Ritu Sharma, Prof. A. Menon, Kavya Nair,
Arjun Mehta), the catalogue (three areas, six courses, twelve experiments — "Composite Wall
Conduction" among them as its own record), the B7 institutions and requests (REQ-0038 and REQ-0040
under review), the background submissions SUB-0052 … SUB-0086 (SUB-0085 stuck), the corrections
UPD-0001 … UPD-0004 and UPD-0006, and SUP-0207. **Nothing Flows A–F create**: no Godavari
Institute of Technology or its people, no REQ-0042 / REQ-0058, ACC-0107, SUB-0077 or UPD-0005. The
board references the walk creates are reserved in the id source, in walk order. Each seeded record
carries a `seedNote` naming its board frame ("marked as sample" lives in data, never in product
chrome, T-36).

### The scripted walk (`./testing`)

Real port commands on the manual sample clock, in board-date order, creating REQ-0042 → Godavari →
ACC-0107 → Meera Iyer → twelve students, three Faculty, FMAP-0021, GRP-0012, MEC-523 → SACC-0310 →
WEB and VR activity, completions and feedback → SUB-0077 (returned, revised, resubmitted, routed,
approved, published) → UPD-0005 (sent, approved, held, lifted, released) → the question bank →
REQ-0058 → DTR-0018 → ASMT-0009 / ATT-0450 (11 of 16, released by its own setting) → SUP-0213.

Times kept or moved (sample data only — no product effect):

- Flows A–D and the device chain keep their drawn dates (2 Oct – 15 Nov 2026).
- Flow E and the Content Manager / Academic Reviewer steps of Flow F are drawn in Aug 2026, before
  the anchor; spine-start holds neither SUB-0077 nor UPD-0005, so they move by exactly 56 days
  (weekday and time kept): Flow E runs 6–23 Oct, UPD-0005 is sent on 20 Oct and approved on 22 Oct,
  and the Super Admin's drawn hold / lift / release follow on 23–24 Oct (S-5, S-6).
- SUP-0213 ("sent 3 Oct" by Rahul Verma, who is imported on 8 Oct) moves to 16 Oct, after his
  first VR session (S-4).
- Background steps the B7 boards draw in the period: SUP-0207 reopened (6 Oct), Deccan paused
  (12 Oct, 09:40), Dr K. Iyer registered (20 Oct).

### Fixtures

| Fixture             | Moment                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `spine-start`       | `seed()`                                                                                                                 |
| `after-flow-a`      | access active on ACC-0107; no Institute Admin yet (8 Oct, before B1)                                                     |
| `after-setup`       | Flow B's first step plus the setup S1–S7 (before Meera gives access)                                                     |
| `after-flow-b`      | SACC-0310 given; nothing learnt yet (before Flow C, 12 Oct 09:40)                                                        |
| `after-flow-c`      | WEB and VR completed with feedback, and everything dated before Flow D starts on 27 Oct (the question bank among it)     |
| `after-flow-d`      | the whole walk (15 Nov: ATT-0450's result released)                                                                      |
| `after-flow-e`      | SUB-0077 published (23 Oct 10:05)                                                                                        |
| `after-flow-f`      | UPD-0005 released (24 Oct 09:45)                                                                                         |
| `after-flow-device` | DTR-0018 approved (24 Oct 12:30)                                                                                         |
| `later-sample`      | a branch from after-flow B on 12 Oct: SACC-0311 (group), SACC-0312 (withdrawn), SACC-0313 / 0314, supplied licence waits |
| `state-coverage`    | the whole walk plus GRP-0013 "Lab batch B" and DTR-0019 waiting with the Institute Admin                                 |

`later-sample` is a branch because SACC-0311 reaches Rahul, who also holds SACC-0310: the overlap
is undecided (OD-B2-01), so his own gate would answer `policy-open` — the boards draw that state on
Institute Admin screens only (S-12).

**State coverage — drawn states not present** (no coherent drawn record can hold them together
with the walk; none is invented): a request "Payment failed"; an Institute Admin more-licences
request "Approved — payment required" (REQ-0058 is drawn under review); a correction in Draft, In
academic review, Awaiting decision or Withdrawn at the end of the walk; a device transfer
Forwarded, or one waiting with no Institute Admin; a support report Resolved at the end of the walk
(SUP-0207's resolution is in its history); a Completed format with feedback still offered; attempts
in progress or waiting for marking; Priya Natarajan's ATT-0451 (she holds no grant on the walk:
S-8 resolved as "one waiting"). The B7-09 reports of Godavari people dated before Godavari exists
(SUP-0189, SUP-0198, SUP-0209, SUP-0211) are not seeded.

### Sample-data reconciliation (Appendix C §4.2; one answer each)

- **S-1, S-2:** the B7 variant — Konark holds ACC-0091 (Buck Converter Ripple, WEB + AR, 60,
  Quarterly 3 Aug – 2 Nov 2026, not paused); BITS Pilani — Hyderabad Campus holds ACC-0098
  (Distillation Column + Boiler Drum Level, WEB + VR, 80, Monthly 1–31 Oct 2026, active 26 Sep),
  the plan B7-05 lists for UPD-0005. REQ-0038 renews ACC-0098; a renewal cannot arrive before its
  plan, so its receipt moves from 24 to 26 Sep (16:02 kept) and it renews ACC-0098 as it stands.
- **S-3:** "A. Menon" stays a request contact name (not a person record, not the reviewer holder).
- **S-4, S-5, S-6:** see the walk timeline above. **S-8:** one attempt waiting. **S-12:** branch.
- **Fills where no board draws a value** (sample only, never a default): experiment descriptions
  repeat the drawn summary; web links nobody drew are `https://labs.example/<slug>`; undrawn vendor
  organisations, package labels and install notes are empty; the dates and contacts of the origin
  requests REQ-0027 / 0029 / 0031; REQ-0036's licence count and REQ-0041's three experiments;
  SUB-0070's three outcomes; the summaries of SUB-0081 and SUB-0085; UPD-0004's hold reason; the
  options of Q-0103 and the answers of Q-0103 / Q-0105; feedback ratings; the written-answer
  feedback; Sneha Reddy's deactivation reason; Imran Shaikh's device tags; times marked "undrawn"
  in the walk.

## Stand-ins, seams and provenance (`./testing`)

The six stand-in ports of Appendix C §3.18: the sample clock (`setSampleNow`), the payment outcome
(TE-4 — the only way a payment is confirmed or fails), the runtime report (TE-3 — activity, and the
completion report the system completion handler writes; it reports only for a format the Student
can open now), workflow routing (only the drawn default, M-3), licence availability (seeded answers
only, T-06 / D7) and the overlapping-grant policy (no default: `undecided`, so the case stays
`policy-open`, DV-1). The three test-only seams: the seeded "BITS started reviewing" fact (AD-14 —
opening SA-03 never starts review), fixture-supplied objective marks (DV-2 — no answer is compared
with a key; the values are B4-13's for ATT-0450) and resubmission routing (M-3). Every sample
runtime event records `sample-fixture` or `sample-standin` provenance in the world envelope; the
production runtime-event vocabulary is unchanged. No launch, session, time or user action completes
a format. Two fixture-supplied values have no product command: Prof. Ravi Shankar's inactive
account (PER-07 open) and the authorised VR devices (no device registry, D20b).

### Identity seams for the web test-hook bridge (WP-0.12)

`asPersonId(platform, personId)` is `asPerson` by person id (the Playwright helpers name people by
id), in a session of its own. `beginSession(platform, personId)` starts the platform's own session
— the CI-only boot descriptor's signed-in person, without the XS-01 form. Both refuse an id the
world does not know, live in `./testing` only, and list no one.

## Sample credentials

Sign-in (XS-01) takes a known sample e-mail and any non-empty password (AD-03); an unknown e-mail is
"Wrong details". The list lives here and in the test fixtures, never in product copy. Arjun Mehta's
address is not drawn; it follows the drawn platform-staff domain.

| Person                 | Role               | E-mail                          |
| ---------------------- | ------------------ | ------------------------------- |
| Arjun Mehta            | Super Admin        | `arjun.mehta@wilp.example`      |
| Anil Shetty            | Vendor (Northline) | `anil.shetty@northline.example` |
| Ritu Sharma            | Vendor (Meridian)  | `ritu.sharma@meridian.example`  |
| Prof. A. Menon         | Academic Reviewer  | `a.menon@wilp.example`          |
| Kavya Nair             | Content Manager    | `kavya.nair@wilp.example`       |
| Meera Iyer (after B1)  | Institute Admin    | `meera.iyer@godavari.edu.in`    |
| Rahul Verma (after S1) | Student            | `rahul.verma@godavari.edu.in`   |
| Dr S. Ranganathan (S3) | Faculty            | `s.ranganathan@godavari.edu.in` |

## Interpretations recorded here

- **RV-03 "What changed in revision n"** (Appendix C [C], B6-03): the domain record keeps only the
  current content, so the world envelope keeps the content each revision was sent with
  (`sentContent`) — storage only; field keys follow the submit checklist's vocabulary.
- **Experiment ids** are slugs of the catalogue name (Appendix C §1.1 [P]): publishing SUB-0077
  creates `conduction-through-a-composite-wall`, never merged with `composite-wall-conduction`.
- **A `null` answer** (ST-13) saves nothing: no rule for clearing an answer is drawn.
- **Pre-rendered words** (PC-13 provisional) — the review-queue sub-line and "who can act" use the
  boards' words; SA-11's per-institution note is `null` rather than invented copy.
- **A Student's rows follow the domain** (SACC-12, SACC-14; B2-10 … B2-12). Which given experiments
  show is the read verdict (`canRead` student-learning, which computes the gate itself): open, or
  one of the drawn read-only closures (paused, inactive, waiting for a licence), is a row; the
  gate's own open decision (OD-B2-01, OD-B2-02, GRP-05) is a row carrying `{ policyOpen }` on every
  format; after the only grant is withdrawn or access ended (SACC-14) there is no row — the course
  keeps only its earlier-work flag — and a course with neither is not listed (`noAccessYet` when no
  course is). Format words come from the domain's `formatAvailability`; a closed visible experiment
  reads them with the closure lifted, so the formats it gave still show beside the closure.
  **Contract gap for the owner:** the row has no "Paused" or "Waiting for a licence" word (B2-12
  draws "Paused"); the session banner carries the pause and the inactive account (XS-08, PER-13)
  and the format page's gate carries all three (B3-02, B3-03). Progress rows (B3-05) list only
  experiments the Student may see, each through the grant the gate routes it by.
- **B7-06 divergence:** the board's third content-record variant names an update "Nothing reaches
  you until the Academic Reviewer approves it", but the read rule hides such an update from the
  Super Admin (UPD-18 / UPD-26), so the sample never produces that variant (owner review).
- **Feedback state** (FB-01) is `eligible` exactly when the feedback form may open — the rule that
  also sends it; an unknown experiment or format is `not-eligible` (the read answers a state).

## Hosted-walkthrough gaps (for the owner)

A live walk from spine-start stops where no product path exists by design: a payment is never
confirmed (TE-4), a format is never Completed (TE-3), a resubmission stays "resubmitted" (M-3), and
a reload resets the world (TE-6). Background institutions carry no person records, so their drawn
student and Faculty counts are not reproduced.

## Reuse of earlier non-visual code

None. The rejected Slice-1 branch's `world.ts`, `world-store.ts` and `access-adapter.ts` (Appendix F
§2.3 salvage candidates) were not copied or adapted; the store, envelope, pipeline and adapter here
are written new against ADR-0004 option A and the WP-0.9 / WP-0.10 code.

## Commands

```bash
pnpm --filter @xr/sample-platform test
```
