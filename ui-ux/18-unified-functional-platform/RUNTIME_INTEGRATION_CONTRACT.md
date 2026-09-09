# Runtime integration contract — Web · AR · VR · MR

| | |
|---|---|
| **Scope** | How a Web, AR, VR or MR runtime reports utilisation and completion to the XR platform. Written for `ui-ux/18-unified-functional-platform/`, and for whoever builds the production backend and the native applications |
| **Type** | Integration contract · architecture statement · open-question register |
| **Not** | An API specification for a service that exists · a claim that any backend, endpoint, transport or native application is built · a device, engine or vendor selection |
| **Status** | The event model, the ingestion rules and the derivations described in §3–§6 are **implemented in the prototype**. Everything in §7–§9 is **future production integration** and is labelled as such, line by line |
| **Raised by** | PM review — *"How do we know a student actually used it? How much time? How many times?"* and *"AR needs a mobile app, VR needs a Meta app"* |

---

## 1 · The one thing this document exists to stop

Before this pass the platform recorded that a simulation had been *started* and *completed* because
a Student pressed two buttons on a web page. There was no record of **what happened**: no session, no
duration that could be defended, no attribution to a runtime, and no way to tell a real run from a
demo click. Two numbers — `launches` and `timeSpentSeconds` — sat on a record with nothing behind
them.

PM-08 asked four questions that model could not answer:

> How do we know a Student actually used an Experiment? How much time did they spend in the actual
> simulation? How many times did they open it? What is the factual basis for *Not started · In
> progress · Completed*?

This contract is the answer, and the shape of the answer is deliberate: **an append-only event log,
and derivations over it.** Every utilisation figure on every screen is folded from that log. Nothing
is a counter that some screen incremented.

> **⚠ There is no API here.** This build has no backend, no endpoint, no transport and no
> authentication. `XRSLP.state.recordRuntimeEvent()` is a local, in-page function that stands in for
> the ingestion a production platform would expose. What is portable is the **event vocabulary, the
> field set, the idempotency rule and the derivation rules** — those are the contract. The transport
> is not specified here because no source has selected one.

---

## 2 · The three runtimes, and what each one is today

```
                        XR PLATFORM
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   WEB PORTAL           AR MOBILE            VR / META
   + WEB RUNTIME        RUNTIME              RUNTIME
        │                    │                    │
   runs in the         runs in a native      runs in a headset
   browser the         app on a phone        application on a
   Student is          or tablet             supported device
   already in
        │                    │                    │
        └────────────────────┴────────────────────┘
                             │
                   RUNTIME UTILISATION EVENTS
              (§3 vocabulary · §4 fields · §5 rules)
                             │
                             ▼
                 SESSION + UTILISATION DERIVATION
              launches · sessions · time · completion
                             │
                             ▼
        Student progress · Faculty reporting · Institution
        utilisation · exports
```

| Runtime | What it is in **this prototype** | What it is in **production** |
|---|---|---|
| **Web** | A bounded, labelled *prototype runtime environment* at `#/learn/:studentId/experiment/:experimentId/simulation/web/run`. It opens a real session, keeps a live elapsed clock, and reports `SESSION_ENDED` and `SIMULATION_COMPLETED` through the same ingestion a native client would use. The **simulation itself is not built** and the page says so in its first sentence | A hosted browser experience, launched from the platform, reporting the same events over a real transport |
| **AR** | Nothing runs. A **demo runtime-event simulator**, inside a `DEMO CONTROL` panel on the Student's AR simulation page, writes the events an AR client would send, stamped `ar-native-client` so no screen can present them as device traffic | A mobile / native AR application on a supported Android or iOS device |
| **VR** | The same demo simulator, stamped `vr-native-client` | A headset application on a supported VR device |
| **MR** | The same demo simulator, stamped `mr-native-client` | An application on supported MR hardware |

A package technology opened from the **platform's own button** — the Student pressing *Open the VR
experiment* — is stamped `platform-standin`, **not** `web-prototype-runtime`. That distinction is
not cosmetic: it is the difference between a figure that came from a runtime and a figure the
platform produced on a runtime's behalf, and every reporting surface reads it.

---

## 3 · The event vocabulary

Five events. They are stored verbatim, in this casing, because they are the contract — a native
client sends these strings.

| Event | Meaning | Sent when |
|---|---|---|
| `SIMULATION_LAUNCHED` | The Student opened the experience | Once per launch, at the moment the runtime starts loading |
| `SESSION_STARTED` | A run began | Once per session, when the experience is interactive |
| `SESSION_ENDED` | A run finished, was closed, or was abandoned by the client | Once per session. Carries `durationSeconds` where the client measured it |
| `SIMULATION_COMPLETED` | The Student completed the experiment **in this technology** | When the experience's own completion condition is met |
| `SIMULATION_ERROR` | The runtime failed | On a failure that stopped or degraded the run. **Never a completion** |

There is deliberately **no content event**. No `VIDEO_WATCHED`, no `RESOURCE_VIEWED`, no
`OUTCOME_MET`. Content is content, and the absence of a content event in this vocabulary is what
structurally prevents *"they watched the video"* from becoming *"they completed the simulation"*.

`SIMULATION_COMPLETED` does **not** imply `SESSION_ENDED`. A client may legitimately report a
completion and keep the session open while the learner looks around. A run that is over sends both.

---

## 4 · The event payload

```
{
  clientEventId:       string   // idempotency key, minted by the CLIENT
  type:                string   // one of the five above
  sessionId:           string   // correlates every event of one run. REQUIRED
  personId:            string   // the Student
  tenantId:            string   // their institution — derived, never sent by the client
  experimentId:        string   // the Experiment
  technology:          'web' | 'ar' | 'vr' | 'mr'
  contentRecordId:     string   // WHICH content the run was against
  contentVersionLabel: string   // and which published version of it
  source:              string   // which runtime is reporting (§4.2)
  occurredAt:          ISO-8601 // the RUNTIME's clock. ENFORCED (§4.3)
  recordedAt:          ISO-8601 // the PLATFORM's clock — set on ingestion
  durationSeconds:     number?  // SESSION_ENDED only, where measured
  detail:              object?  // completion or error metadata
}
```

### 4.1 · Why two clocks

`occurredAt` is when the run event actually happened; `recordedAt` is when the platform accepted it.
A headset that was offline for three hours and flushes a queued session must not have that session
moved to the moment the platform heard about it — the Student did not study at midnight because
their Wi-Fi came back at midnight. An audit reads `recordedAt`; every learning figure reads
`occurredAt`.

### 4.2 · Sources

| `source` | Connected in this build | Presented as |
|---|---|---|
| `web-prototype-runtime` | **Yes** | *Prototype web runtime* |
| `platform-standin` | No | *Opened from the platform* — no device runtime reported it |
| `ar-native-client` | No | *AR mobile application* |
| `vr-native-client` | No | *VR headset application* |
| `mr-native-client` | No | *MR device application* |
| `demo-runtime-simulator` | No | *Demo runtime simulator* |

Any figure whose sources are not **all** connected runtimes is labelled `STAND-IN` wherever it is
shown, in the Faculty row, in the usage drawer, on the institution's utilisation card and in the
CSV export. `XRSLP.state.runtimeSourcesAllReal(sources)` is the single predicate; one stand-in among
them makes the whole figure a stand-in figure.

### 4.3 · ISO-8601 is required, and it is checked

`occurredAt` must be an ISO-8601 instant. Anything else is **refused**, and it is stored normalised
to UTC.

That is stricter than it may look worth being, and the reason is mechanical: the log is **ordered by
its `occurredAt` field**, and a store that compares strings will sort `'Sep 1, 2026 10:00:00 GMT'`
and `'2026-09-01T15:30:00+05:30'` into arbitrary positions relative to everyone else's events — so
one client using a different serialisation folds its runs into the wrong sessions. Accepting only
one format, and normalising the offset away, is what makes the ordering mean what it says.

### 4.4 · Version attribution

`contentVersionLabel` is captured **at ingestion**, from the published record as it stood. A later
Release therefore cannot rewrite which version an earlier run was against. This matters directly to
the version-control rule in §22 of the delta: a correction version changes what future runs use, and
changes nothing about what past runs recorded.

### 4.5 · Hardware

**No hardware serial number, device identifier or headset registry is modelled.** Nothing in any
confirmed source asks for one, and inventing device-identity management would create an obligation
(provisioning, revocation, transfer, privacy) that no requirement establishes. The existing device
**transfer** flow (STK31-38) is unchanged and is not device identity.

---

## 5 · Ingestion rules

Implemented in `XRSLP.state.recordRuntimeEvent()` and asserted in `qa/checks.js`.

| Rule | Behaviour |
|---|---|
| **Authorisation** | The event is accepted only if `studentCanRun(personId, experimentId, technology)` is true. That is the *same* predicate the product uses, so entitlement, tenant deactivation, access term and expiry all gate telemetry exactly as they gate a launch |
| **Idempotency** | A repeated `clientEventId` returns `{ok: true, duplicate: true}` with the **stored** event. Nothing is appended, no sequence number is consumed, and no total moves. A retrying client gets a success |
| **Session required** | An event with no `sessionId` is refused. An unattributable event is worse than no event |
| **Vocabulary** | An unknown `type` or an unknown `technology` is refused |
| **Timestamps** | An unparseable `occurredAt` is refused rather than silently replaced with "now" |
| **Refusal is not storage** | A refused event is not written at all, and the caller is told which rule refused it — `RUNTIME_REJECT.*` — rather than being handed a null |

### 5.1 · What a production ingestion must add

**Future production integration — none of this exists in the prototype:**

- **Authentication.** The client must prove who it is and who the Student is. This build has no
  sign-in anywhere.
- **Authorisation at the edge.** `studentCanRun` is a local read here; in production it is a
  server-side entitlement check against the same rules.
- **Transport, batching and retry.** A headset that loses connectivity must queue events and flush
  them; the idempotency key in §4 is what makes that safe, and it is the reason the key is minted by
  the **client** and not by the platform.
- **Clock trust.** `occurredAt` comes from a device clock. A production ingestion needs a policy for
  implausible timestamps (far future, far past, before the entitlement began). The prototype clamps
  derived durations at zero and never accepts a negative one, which is the floor, not the policy.
- **Retention.** How long runtime events are kept, and what is aggregated or deleted, is **not
  decided**. See §9.

### 5.2 · Known prototype characteristics

These are properties of the prototype, not of the model, and are recorded so nobody mistakes one for
the other:

- **The log is unbounded and lives in `localStorage`.** It grows by three records per run and is
  never pruned. A demo will not reach a browser's quota; a production store obviously needs the
  retention policy §9 records as open (**R2**).
- **Ingestion re-folds.** Each accepted event re-derives that Student × Experiment × technology from
  the whole log, so writing *N* events costs *O(N²)*. That is fine at demo scale and would be
  replaced by an incremental projection in production.
- **Nothing is transported.** `recordRuntimeEvent` is a function call, not an endpoint.

---

## 6 · Derivation — what the platform computes

Per **Student × Experiment × Technology** (`simulationUtilisation`):

| Figure | Rule |
|---|---|
| `launches` | Count of `SIMULATION_LAUNCHED` |
| `sessionCount` | Distinct `sessionId` values seen |
| `openSessions` | Sessions with a start and no end |
| `totalSeconds` | Sum of **finished** session durations. A client-measured `durationSeconds` is preferred; otherwise the interval between the recorded start and end. **Clamped at zero** |
| `firstActivityAt` / `lastActivityAt` | First and last `occurredAt` |
| `completed` / `completedAt` | True only from `SIMULATION_COMPLETED`. The **first** one — a repeated completion never moves the date the Student earned it |
| `errors` | Count of `SIMULATION_ERROR` |
| `status` | `COMPLETED` if a completion exists · `IN_PROGRESS` if a launch or session exists · `NOT_STARTED` otherwise |
| `sources` | Every distinct `source` that contributed |
| `evidence` | `runtime-events` · `pre-telemetry` · `mixed` · `none` (§6.2) |

### 6.1 · The session-folding rules

Each of these is a QA assertion, and each exists because the opposite is a real failure mode:

- A `SESSION_STARTED` for a session already open is **ignored**. The run did not start twice.
- A `SESSION_ENDED` for a session already ended is **ignored**. A duplicate end may not add its
  duration a second time — under *any* client event id.
- A `SESSION_ENDED` with no matching start opens and closes in one step, contributing its reported
  duration if it has one and nothing if it does not.
- A session that **never ended** counts as a session that happened and contributes **zero seconds**,
  because none was measured. It is reported as *left open*, never quietly given a duration.
- A new `SESSION_STARTED` while another is open **abandons** the open one. It stays in the list,
  with no duration, because that is what the evidence supports.
- An end before its start is **zero seconds**, never a negative interval.

### 6.2 · Pre-telemetry history is never fabricated, and never overwritten

A state stored by an earlier build (schema 11) carries simulation records and **no events**, because
none were ever observed. Two things follow, and both are load-bearing:

**Nothing is back-filled.** Minting events for those runs would mean inventing session ids, session
counts and per-session timestamps that nobody recorded — precisely the fabrication this layer exists
to prevent. So a pre-telemetry record has `evidence: 'pre-telemetry'`, its recorded launch count and
time are reported, and **no session is invented for it**.

**Nothing is overwritten either.** The figures the record already held are **frozen once, at the
11 → 12 migration**, and every later derivation *adds* the observed events to that baseline. The
inherited part is reported separately — `inheritedLaunches`, `inheritedSeconds`,
`inheritedCompletion` — and the evidence reads `mixed`, so no screen can present an inherited figure
as session-backed.

> This was a real defect. The derivation *rebuilds* `launches` and `timeSpentSeconds` from the log,
> and on a migrated state the log is empty — so the first new event overwrote a real history: a
> student with 7 launches and 90 minutes recorded became 1 launch and 0 minutes on their next click.
> The freeze is version-guarded so it runs exactly once; running it again would double every
> student's history.

### 6.2.1 · What is not a run

A session row is created by *any* event carrying a session id, so these are stated rather than
assumed:

- An **error alone** is not use. It is recorded and counted as an error, and the technology stays
  *not started*.
- A **completion for a session nobody opened** is recorded and completes nothing. A completion is a
  report *from a run*, so it needs one.
- **Launches count per session**, not per event, so a replayed launch adds nothing.
- **Session ids do not wrap**, and the idempotency key is namespaced by student, experiment and
  technology — two students cannot collide on one session id even if a client reuses one.

### 6.3 · What does **not** cause a completion

Structurally, not by convention:

| Not a completion | Why |
|---|---|
| Watching a video | There is no content event in the vocabulary |
| Viewing or completing a learning resource | Same. Resources are a separate strand of the progress model |
| Meeting a Learning Outcome | Outcomes describe intended academic outcomes. They are not checkboxes and nothing writes against them |
| Opening the Experiment page | Opening a page emits no runtime event |
| Spending any amount of time | Eight hours of recorded sessions with no completion event is `IN_PROGRESS` |
| Submitting or passing the assessment | The assessment belongs to the Experiment; the simulation belongs to a technology |
| Completing a **different technology** | Completion is per technology, always. Web never completes VR |

---

## 7 · What a production Web runtime must do

**Future production integration.**

1. The platform launches the hosted experience with the Student's identity, the Experiment id, the
   content version and a platform-issued session token.
2. The runtime emits `SIMULATION_LAUNCHED` and `SESSION_STARTED`.
3. It emits `SESSION_ENDED` on unload, with the duration it measured. A browser that is killed
   cannot send it — which is exactly the *left open* case §6.1 already handles, and why an open
   session contributes no time rather than an invented one.
4. It emits `SIMULATION_COMPLETED` when the experience's own completion condition is met, followed
   by `SESSION_ENDED`.

**Open:** what a Web runtime's completion condition *is* — a scored task, a checklist, a terminal
state — is content-dependent and unspecified. See §9.

## 8 · What a production AR / VR / MR client must do

**Future production integration.**

1. **Sign in** as the Student against the platform's identity provider. No such provider exists yet.
2. **Fetch entitlements** — which Experiments and technologies this Student may run. The entitlement
   model itself *is* implemented and is the same one the web portal reads.
3. **Obtain the package** for an entitled Experiment. Package distribution — store, MDM, direct
   download, one institutional application carrying many experiments — is **not selected**, and
   `17-stakeholder-correction-blueprint/11` explicitly rules a CDN or delivery network out of scope.
4. **Report** the events in §3, with the fields in §4, honouring the rules in §5. Queue and retry
   offline; the idempotency key makes retry safe.
5. **Never assert completion on the platform's behalf.** A completion is a report of what happened
   in the experience.

### 8.1 · Reviewer and vendor access to a package

An Academic Reviewer cannot execute an AR or VR package in a browser, and this build does not
pretend otherwise. What the review surface now makes explicit, per technology, is **where it runs**
— hosted browser experience, mobile/native AR runtime, headset/native VR runtime, MR device runtime
— alongside the delivery reference, the package and version metadata, the supported technologies and
the stated device requirement.

> **Open question, recorded and not answered: who performs the final technical / runtime validation
> on the target AR or VR device?** No confirmed source assigns it. It is *not* assigned to the
> Academic Reviewer here, and the reviewer's own screen says so in as many words.

---

## 9 · Open for CIL / PM confirmation

Nothing in this section is decided. Each is recorded here and in `PM_DELTA_09.md`.

| # | Open question |
|---|---|
| R1 | **The exact completion rule per technology.** What the runtime must observe before it may emit `SIMULATION_COMPLETED` |
| R2 | **Telemetry retention.** How long runtime events are kept, what is aggregated, what is deleted, and who may read raw events |
| R3 | **The native application stack** for AR and for VR, and whether one institutional application carries many experiments or each Experiment ships its own |
| R4 | **Package distribution architecture.** Store, MDM, direct download, or something else |
| R5 | **Who performs technical / runtime validation on the target device** (§8.1) |
| R6 | **Production backend and API design** — transport, authentication, ingestion endpoints, rate limits |
| R7 | **Clock-trust policy** for implausible `occurredAt` values |
| R8 | **Whether a completion may be revoked**, and by whom. Nothing in this build walks a completion back |
| R9 | **What a runtime should do when it cannot report** — how long it queues, and whether an unreported run is lost or reconciled later |

---

## 10 · Where this lives in the code

| Concern | File |
|---|---|
| Event vocabulary, sources, ingestion, folding, derivation, projection | `js/state.js` — *RUNTIME UTILISATION TELEMETRY* section |
| Prototype Web runtime screen | `js/screens/student-learn.js` — `XRSLP.screens.studentRuntime` |
| Demo runtime-event simulator (AR / VR / MR) | `js/screens/student-learn.js` — the `DEMO CONTROL` panel on `studentSimulation` |
| Faculty utilisation presentation | `js/screens/faculty.js` — `useFigures`, `useSourceNote`, `useDetailHTML` |
| Institution utilisation | `js/screens/tenant.js` — `utilisationCard`, `learningRollup` |
| Export columns | `js/csv.js` — `PROGRESS_EXPORT_COLUMNS`, `facultyProgressRows` |
| Delivery-target statement | `js/content-ui.js` — `RUNTIME_TARGET`, `deliveryRows` |
| Deterministic coverage | `qa/checks.js` — the `IMPL 09` scenario groups |
