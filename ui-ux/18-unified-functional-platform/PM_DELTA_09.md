# Implementation 09 — PM functional delta

| | |
|---|---|
| **Scope** | `ui-ux/18-unified-functional-platform/` only. The functional and architectural gaps the latest PM review exposed, plus one user-requested addition |
| **Type** | Functional delta · architecture preparation · QA extension |
| **Not** | A visual redesign · a dashboard redesign · a B2C implementation · a backend · permission to reopen an accepted workflow |
| **Baseline** | Implementation 08 — schema 11, `xrslp-unified-v1`, **1460** deterministic assertions, 0 failures, commit `87fa20c` |
| **This pass** | schema 12, `xrslp-unified-v1` unchanged, **2202** deterministic assertions, 0 failures · 835 route × width checks, 0 issues · 81 driven interaction checks, 0 failures |
| **Corrected after manual QA** | §2.2 and §2.7 below were revised by the UX / clarity correction that followed manual end-to-end testing. Both changes are recorded in place |
| **Companion** | `RUNTIME_INTEGRATION_CONTRACT.md` — the Web / AR / VR / MR integration contract and the architecture statement |

---

## 1 · What the review actually challenged

The PM accepted the B2B product direction and the Implementation-08 visual work, and then asked
questions the build could not answer from evidence:

> How do we know a Student actually used an Experiment? How much time did they spend in the actual
> simulation? How many times did they open it? What is the factual basis for *Not started · In
> progress · Completed*? A video is content — watching it is not completing the simulation. Web
> simulations may run in the browser, but AR needs a mobile application and VR needs a Meta
> application, and the platform has to be able to receive what those report. And if the Content
> Manager can edit and replace content, how is version control preserved?

Two of those were fair descriptions of real defects, not requests for features:

- **`launches` and `timeSpentSeconds` were counters, not evidence.** Two numbers written by two
  button handlers, with no session, no attribution and no way to re-derive them.
- **A published artefact could be silently rewritten under its own version label.**
  `managerUpdateDelivery` was gated on scope and *not* on status — deliberately, because the
  stakeholder's own example was a published experiment whose hosted link had gone stale. The
  consequence was that two institutions could be running materially different content, both called
  `v1.0`, with nothing in the record saying so.

---

## 2 · Confirmed / direct PM direction

Everything in this section came from the review and is implemented or documented as stated.

### 2.1 · Utilisation, time and session tracking are needed

**Implemented.** An append-only runtime event log — `SIMULATION_LAUNCHED`, `SESSION_STARTED`,
`SESSION_ENDED`, `SIMULATION_COMPLETED`, `SIMULATION_ERROR` — with one ingestion door, client-minted
idempotency keys, two clocks, and derivations folded over it. `js/state.js`, *RUNTIME UTILISATION
TELEMETRY*. The full field set and every rule are in `RUNTIME_INTEGRATION_CONTRACT.md` §3–§6.

`launches` and `timeSpentSeconds` still exist on the Implementation-03 record and every existing
reader still reads them — but they are now **projections of the log**, recomputed after every
ingestion, so the record and the evidence can never disagree.

### 2.2 · Progress must come from actual usage evidence

**Implemented.** A simulation is complete when — and only when — a `SIMULATION_COMPLETED` event
exists for that Student, that Experiment and that technology.

`experimentProgress` returns a `factual` block reporting the three strands — resources, simulation
and assessment — separately, each against its own denominator.

> **⚠ CORRECTED AFTER MANUAL QA.** This pass originally *kept* the percentage and step count, on the
> grounds that they were counted from explicit steps rather than from a formula. Manual QA found the
> real problem with them, which was not the arithmetic: the denominator was *resources + one step per
> technology format + the assessment*, so *"Steps done 0 of 9"* and *"0 of 3 simulations completed"*
> asserted that finishing Web **and** VR **and** AR were three separate mandatory steps. **No
> confirmed source says that** — Web, AR and VR are delivery formats of one experiment.
>
> The aggregate is therefore **no longer presented anywhere** in the Faculty or Student UI. The
> derivation still exists in the state layer and every per-technology record is untouched; what is
> shown is the three strands, and each format on its own. Whether a student must finish every format
> at all is recorded as open (§9, **D-09-13**).

**What cannot complete a simulation** — structurally, not by convention — is listed in
`RUNTIME_INTEGRATION_CONTRACT.md` §6.3 and asserted individually in `qa/checks.js`.

### 2.3 · A video / resource is content; viewing it is not completing

**Implemented, structurally.** The event vocabulary contains no content event. There is no
`VIDEO_WATCHED` and no `RESOURCE_VIEWED`, so no content action has a path to the simulation state.
Reading every learning resource writes **zero** runtime events, and the QA suite asserts exactly
that.

Learning Outcomes are unchanged: they describe intended academic outcomes, are authored by the
Academic Reviewer, and nothing writes against them.

### 2.4 · Web simulations may run in the browser

**Implemented as a bounded prototype runtime.** Route
`#/learn/:studentId/experiment/:experimentId/simulation/web/run`. It opens a real session, keeps a
live elapsed clock, ends the session with a measured duration, and reports its own completion
through the same ingestion a native client would use.

It is a **clearly-labelled prototype runtime environment**, not a claim of a Web simulation: the
first sentence on the page says the simulation is not built here. The explicit completion control
lives *inside* that environment — where a runtime's own *"I have finished"* control belongs — and no
longer appears as a platform capability in the normal Student UX.

The Student's own product control is unchanged in kind: *Open the Web simulation*. It now leads
somewhere.

### 2.5 · AR needs a mobile application; VR needs a Meta / native application

**Documented as a contract; not fabricated.** No Android or Meta application is built, and none is
implied. `RUNTIME_INTEGRATION_CONTRACT.md` §8 defines what such a client must do — sign in, fetch
entitlements, obtain the package, report the events, never assert completion on the platform's
behalf.

For demonstration, a **demo runtime-event simulator** sits inside a `DEMO CONTROL` panel on the
Student's AR/VR/MR simulation page. It writes the events a native client would send, stamped
`ar-native-client` / `vr-native-client` / `mr-native-client`, and every reporting surface prints
those figures as `STAND-IN` — *no device application is connected in this build*.

A package technology opened from the platform's own button is stamped `platform-standin`, **not** the
web runtime. Attributing a VR launch to the web runtime was a real defect this pass found and fixed.

### 2.6 · The platform must be able to receive runtime events from Web / AR / VR clients

**Implemented as an ingestion contract; the transport is not built.** `recordRuntimeEvent()` is the
single door, and it is local and in-page. `RUNTIME_INTEGRATION_CONTRACT.md` §1 and §5.1 state
plainly what a production ingestion must add: authentication, server-side authorisation, transport,
batching and retry, a clock-trust policy and a retention policy.

### 2.7 · Faculty needs usable utilisation for many Students

**Implemented.** Student Progress carries, per Student × Experiment: technology used and its state,
launches, sessions, recorded time, sessions left open, and a `STAND-IN` note where the figures did not
come from a connected runtime.

> **⚠ CORRECTED AFTER MANUAL QA.** This pass first put the full per-technology breakdown in a
> **drawer** opened from a *Usage* button beside *Open*. Manual QA found the obvious consequence:
> every row then had **two** detail actions and a reader had to guess which held what. The drawer is
> gone. There is **one** detail destination — *View details* — and it leads to the full
> Student–Experiment record, which already answered everything the drawer did and the resources, the
> assessment and the written answers besides. `useDetailHTML` was not deleted; the record renders it.

The CSV export gains eight factual columns (§5). Result withholding is untouched.

### 2.8 · Version control must survive Content Manager edits

**Implemented.** See §6.

---

## 3 · User-requested addition

### 3.1 · Faculty Question Bank import — CSV and XLSX

**Implemented.** Question Bank now offers three ways in: *Add a question*, *Import questions*, *Draft
with assistance*. Add / Edit / Delete are unchanged.

The flow is Question Bank → Import questions → **choose the Course / Experiment** → choose the file →
parse → preview → validate → confirm. Nothing is written before the confirmation dialog is accepted;
the import is all-or-nothing; and a spreadsheet row can never name its own Experiment. Details in §7.

> **This was not raised by the PM.** It is recorded here as a user-requested addition so the two are
> not confused when this document is read alongside the review notes.

---

## 4 · Utilisation model

### 4.1 · Structure

Events, not booleans. One append-only collection, `runtimeEvents[]`, folded into sessions on read.
The full payload and every rule are in `RUNTIME_INTEGRATION_CONTRACT.md`; the short form:

- attribution — event id · student · tenant · experiment · technology · content record and version
  label · session id · source · runtime clock · platform clock
- derivation per Student × Experiment × Technology — launches · sessions · open sessions · total
  time · first activity · last activity · completion and its date · errors · sources · evidence
- safety — duplicate events refused by client key; duplicate session ends ignored under any key;
  durations never negative; incomplete sessions counted but contributing no time; a completion never
  walked back by a later run

### 4.2 · Completion semantics

`SIMULATION_COMPLETED`, for that technology, and nothing else. Not time, not sessions, not
resources, not video, not Learning Outcomes, not assessment submission, and never another
technology.

### 4.3 · Pre-telemetry history

A schema-11 state migrates with an **empty** log and its existing records untouched, and the launch
count and time those records already held are **frozen once, at the version boundary**, as a
baseline. Every later derivation adds the observed events to that baseline rather than replacing it.

> **This was a real defect, found and fixed during the adversarial pass.** The derivation rebuilt
> `launches` and `timeSpentSeconds` from the log — and on a migrated state the log is empty, so the
> first new event overwrote a real history: a student with 7 launches and 90 minutes recorded became
> 1 launch and 0 minutes on their next click. Freezing the baseline is what makes "no existing
> history is destroyed" true rather than intended. The freeze is version-guarded so it runs exactly
> once; running it again would double every student's history.

The inherited part is reported separately (`inheritedLaunches`, `inheritedSeconds`,
`inheritedCompletion`) and the evidence reads `mixed`, so no screen can present an inherited figure
as session-backed. **No session is ever invented for it** — a pre-telemetry run has no session count
and no session detail, because none was recorded.

### 4.4 · What the fold refuses to treat as a run

Any event carrying a session id creates a row in the session list, so these are stated explicitly:

- An **error alone** is not use. It is recorded and counted as an error; the technology stays *Not
  started* and the delivery ladder does not move.
- A **completion for a session nobody opened** is recorded and completes nothing. A completion is a
  report *from a run*, so it needs one.
- **Launches are counted per session**, like every other figure, so a client that replays a launch
  under a fresh key adds neither a launch nor a session.
- A **session id does not wrap**. `util.pad3` is a formatter with a 1000-wide space; a session is
  minted once per run, so it is the counter that reaches it, and past 999 the number is printed in
  full. The idempotency key is namespaced by student, experiment and technology as well, so two
  students cannot collide on one session id even if a client reuses one.

---

## 5 · Faculty reporting

| Surface | What is new |
|---|---|
| Student Progress table | Column *Simulations* → *Simulation use*: per-technology chips (unchanged) plus launches · sessions · recorded time · sessions left open · last activity, or *Never opened*. A `STAND-IN` line where the figures are not from a connected runtime |
| Usage drawer | Per-technology: state, launches, sessions (and how many open), time spent, first used, last activity, runtime errors, source. Plus resources, assessment state and overall — with the sentence naming the three strands as three strands |
| Student detail page | The per-technology list is now the same shared renderer as the drawer, so the two screens cannot describe one student differently |
| CSV export | Eight new columns: *Simulation launches · Simulation sessions · Sessions left open · Time spent (minutes) · First simulation activity · Last activity · Simulation completed in · Usage evidence* |

**Result withholding is unchanged and re-asserted.** The utilisation model carries no score, mark,
earned total or outcome at any level — a structural assertion in the QA suite walks the whole factual
object and fails if one appears. The export's withholding columns and gating are untouched.

---

## 6 · Version control

### 6.1 · Before first publication — unchanged

The Content Manager's correction authority is exactly what the stakeholder asked for. Every edit
still requires a reason, still writes a history entry naming what it was and what it became, and
still respects the existing academic-approval protections. `qa/checks.js` asserts this path
explicitly, on a record at the readiness gate.

### 6.2 · After publication — a correction version

A **material** change to a published record is refused in place and becomes a **correction version**:
a `contentVersions[]` row, `origin: 'content-manager'`, `correction: true`, created as a **draft**
that reaches nobody until the Content Manager sends it. From there it runs the chain that already
exists — Academic Review → Approved → **Super Admin Release or Hold**.

- The published version stays live and public throughout.
- Tenant entitlement is untouched by a candidate's existence; students keep running the live version.
- Only one later version may be open per Experiment, so a further material edit is **blocked** with
  a stated reason rather than silently queued.
- No new gate is invented and none is skipped. `STK31-08` — *"no additional approval gates may be
  invented"* — is the reason this reuses the chain rather than adding a manager-only shortcut.
- A correction the Academic Reviewer **returns** can be **revised** and re-sent. Without that it
  could only be re-sent unchanged, the reviewer would return it again, and — because only one later
  version may be open — it would block every future version of that Experiment for good.
- A correction can be **withdrawn** by the manager who raised it, while it is still theirs (a draft,
  or one a reviewer returned). Nothing is deleted: the candidate, its change note and its whole
  history stay, and the Experiment's own timeline keeps both the entry that raised it and the one
  that withdrew it. It exists because Implementation 09 gave a **second** role the ability to occupy
  the single open-version slot, and a Vendor could not clear a Content Manager's abandoned draft.
- A **clear is an instruction, not an absence.** `releaseVersion` merges a candidate's delivery onto
  the published record and skips empty values — correctly, so an untouched technology carries its
  published values forward. That makes an absence unable to mean anything, so a correction that
  withdraws a reference or blanks one field records what it clears, and the release applies it.

  > **Also a real defect found during this pass.** A withdrawal correction passed academic review,
  > was released by the Super Admin, and changed nothing at all — the release silently did nothing
  > while three screens said it had.

### 6.3 · Material vs safe

| Material once published | Safe — audited in place |
|---|---|
| `url` — the hosted Web experience | `notes` — content-plane technical notes. Rendered only in the content workspace, never delivered to a Student |
| `packageRef` · `packageLabel` — which package is authorised | `name` · `summary` · `courseId` — canonical catalogue metadata, which `STK31-09` explicitly gives the Content Manager |
| `runtime` — the device requirement a Student is told to meet | |
| **Any removal** of a delivery reference | |
| `description` — the Experiment's instructional content | |

The two sets **partition** the writable field set, and the QA suite asserts that they do — a field
added to the writable set is material by default and has to be argued out.

> **⚠ This split is an implementation judgement, not confirmed policy.** No source enumerates
> material fields. Where a field was ambiguous the version-preserving reading was taken, which is why
> `runtime` is material and `notes` is not. It is open for confirmation (§9, D-09-6).

**An omitted field is not an untouched field on the metadata writer.** `updateCanonicalMetadata`
assigns every canonical field unconditionally, so a patch that leaves `description` out does not
preserve it — it blanks it. The materiality check therefore compares against what the writer *would*
write, which for an absent field is the empty string. The delivery writer is genuinely different: it
touches only the fields the patch supplies, so there an absent field really is untouched.

### 6.3.1 · The one named exception

**The Super Admin's platform-master correction (`updateCanonicalAsPlatform`) is not gated by this
rule**, and that is deliberate rather than an oversight:

- The capability is stakeholder-confirmed. `07.2` rule F names the published master record's *"public
  name, Course, summary and description"*. Withdrawing half of it would reopen a confirmed decision.
- It is not the failure PM-08 described. That concern was a published artefact changing **silently**.
  This writer already refuses without a reason on published content and writes an audit entry naming
  who, when and why. The Content Manager's path had neither and could be reached from an ordinary
  Save.
- There is no correction-version route for that role — only a Vendor or a Content Manager can raise
  one — so gating it would leave the platform's own governance role unable to exercise an authority
  it has been given.

The exception is **pinned by an assertion** so it cannot drift in either direction unnoticed, and it
is open for confirmation (§9, **D-09-11**).

### 6.4 · Release / Hold compatibility

Unchanged. A correction version is decided by the same `releaseVersion` / `holdVersion` /
`returnHeldVersionToDecision` functions, on the same screen, with the same terminology firewall:
**Publish** is the Content Manager's first publication; **Release / Hold** is the Super Admin's
decision on a later version. Holding leaves the live version exactly where it is; lifting a hold does
not erase the hold from the history.

---

## 7 · Question import

| | |
|---|---|
| **Formats** | `.csv` and `.xlsx` |
| **Schema** | `question_type · question · option_a … option_d · correct_answer · marks · explanation` — documented in `QUESTION_IMPORT_TEMPLATE.md` and generated from one array in `js/question-import.js`, so template, validator and documentation cannot drift |
| **Types** | `multiple_choice` → `mcq`, `true_false` → `tf`, `descriptive` → `descriptive`. **Only the product's actual types**; no type is invented |
| **Context** | Chosen from the Faculty member's own mapped Experiments **before** the file. Never read from a row. Re-checked at write time |
| **Preview** | Shows the **resolved** values — mapped type, kept options, which option the answer key landed on — because the resolution is the part a person cannot check by re-reading their spreadsheet |
| **Confirmation** | An explicit dialog naming the count, the file and the destination. Nothing is written before it |
| **Errors** | Row number as the spreadsheet shows it, the column, what is wrong, and how to correct it |
| **All-or-nothing** | One blocking error blocks the whole file. Committing a blocked result writes nothing |
| **Duplicates** | Flagged against the bank and within the file, as warnings. **Never** auto-deleted, merged or skipped — nothing in the product establishes that behaviour |
| **Provenance** | `origin: 'import-csv'` / `'import-xlsx'`, distinct from `'ai'`. An imported question is never presented as an AI draft |
| **Template** | Downloadable as CSV **and** XLSX, generated from the column contract. The downloaded template re-imports with zero errors — asserted |

### 7.1 · The XLSX dependency question, answered

`README.md` records this build's technology as *"Dependency-free HTML + CSS + vanilla JS (ES5-style)
… No framework, no build step, no backend"*, and
`17-stakeholder-correction-blueprint/11_XR_DELIVERY_AND_DEVICE_MODEL.md` §2 rules a CDN out of
scope. A vendored SheetJS would break the first; a CDN script tag would break both.

So **no third-party parser was added.** `js/xlsx.js` is first-party and implements exactly the subset
an import needs, from the published formats: a ZIP container reader (PKZIP APPNOTE), a raw DEFLATE
decompressor (RFC 1951 — stored, fixed-Huffman and dynamic-Huffman blocks), CRC-32 (RFC 1952) for
writing, and enough SpreadsheetML (ECMA-376) to walk a worksheet and its shared strings into rows.
No network access at build time or run time; the prototype still opens from `file://`.

The QA suite exercises the decompressor against a **real DEFLATE-compressed workbook**, not only a
round-trip through the first-party writer — the writer emits stored entries, so a round-trip alone
would test none of the half most likely to be wrong.

**Limits, stated:** formulas are read at their cached value; number formats are not applied (a date
arrives as its serial number, and the import has no date column); `.xls` is not read and is named as
such rather than reported as a damaged file.

---

## 8 · State and migration

| | |
|---|---|
| **Before** | schema 11 |
| **After** | schema 12 |
| **`STORAGE_KEY`** | `xrslp-unified-v1` — **unchanged** |
| **Added** | `runtimeEvents[]` · `seq.runtimeEvent` · `seq.runtimeSession` |
| **Removed / renamed / re-keyed** | Nothing |

The additive collection and both counters are created by the presence guards `migrate()` already runs
over `emptyCollections()` and the `seq` key list, so the migration is idempotent, repairs a state
written by any earlier build, and touches no existing object, id or history. **Both** the seed
literal and the migration key list were updated — they are duplicated in this file, and updating only
one produces ids like `RTE-NaN`.

`js/data.js` was **not** modified. Every new QA fixture is built by calling the product's own writers.

Additive fields on existing objects: `contentVersions[]` rows raised as corrections carry `origin`,
`correction` and `correctionOf`; questions carry two new `origin` values. Neither requires a
back-fill — absence is the correct historical value and reads as the pre-existing default.

Migration from schema 11 is asserted directly, including that it invents no events, that a second
load changes nothing, and that a pre-telemetry completion survives the arrival of new events.

---

## 9 · Open for CIL / PM confirmation

Nothing here is approved. Several of these are also registered in
`RUNTIME_INTEGRATION_CONTRACT.md` §9.

| # | Open question | Why it is open |
|---|---|---|
| **D-09-1** | The exact completion rule per technology — what a runtime must observe before emitting `SIMULATION_COMPLETED` | Content-dependent; no source specifies it |
| **D-09-2** | Telemetry retention — how long events are kept, what is aggregated, what is deleted, who may read raw events | No source addresses it, and it is a privacy decision as much as a storage one |
| **D-09-3** | The native application stack for AR and for VR, and whether one institutional application carries many Experiments | Discussed in review; not decided |
| **D-09-4** | Who performs final technical / runtime validation on the target AR / VR device | **Not** assigned to the Academic Reviewer here. No confirmed source assigns it to anyone |
| **D-09-5** | Package distribution architecture | Explicitly out of scope in `17/11` |
| **D-09-6** | Field-level exceptions to the published-edit rule (§6.3) | The material/safe split is an implementation judgement |
| **D-09-7** | Production backend and API design — transport, authentication, ingestion, rate limits | No backend is selected |
| **D-09-8** | Whether a recorded completion may ever be revoked, and by whom | Nothing in this build walks one back |
| **D-09-9** | Whether a Content Manager's technical-only correction may skip academic review | This build routes every correction through the existing chain, which is the safer reading |
| **D-09-10** | Whether spreadsheet import should extend to the Tenant Admin's student import, which is CSV-only | Out of scope for this pass; the capability now exists |
| **D-09-11** | Whether the **Super Admin's** platform-master correction should itself become a version once published (§6.3.1) | `07.2` rule F confirms the capability by name; whether version control should now override it is a stakeholder question, not one this build should settle by wording |
| **D-09-12** | Whether a Content Manager's **withdrawal** of a correction should require anyone else's agreement | It currently requires only a reason, and nothing is deleted |
| **D-09-13** | **Whether a student must complete an experiment in every technology format their institution holds.** Web, AR and VR are delivery formats of one experiment; nothing confirmed says all of them are required | Raised by manual QA of this pass. Until it is settled, no aggregate figure with a technology denominator is shown, and *Completed* is only ever announced when nothing at all is outstanding — the cautious reading, which can never over-claim |

> **⚠ None of the above is approved.** Each is recorded so that a later reader cannot mistake an
> implementation judgement for a stakeholder decision.

---

## 10 · What this pass deliberately did not do

- **No visual redesign.** The public landing and catalogue, the Overview dashboards, Help, the
  Student Home composition, the navigation styling and the design system are untouched. New UI was
  added only where the new functional data needed a surface.
- **No new nav destination anywhere.** Institution utilisation went onto the screen that already owns
  the institution's detailed content reporting; the Faculty breakdown went into a drawer rather than
  seven more columns.
- **Nothing added to the accepted Tenant Overview.** Its Learning snapshot is four values by a
  stakeholder-closed decision, and a fifth would reopen it.
- **No fake native application, no in-browser AR or VR execution, no device identity, no hardware
  serial management.**
- **No backend, no endpoint, no transport, no authentication.**
- **No third-party dependency, no CDN, no build step.**
- **No seed data changed to make a screen or a test look better.** `js/data.js` is untouched.
- **No existing assertion weakened or deleted.** Where an assertion changed, it changed because the
  behaviour it described was the defect PM identified — and it was replaced with assertions covering
  **both** the preserved path and the corrected one. The count went from 1460 to 2077.
