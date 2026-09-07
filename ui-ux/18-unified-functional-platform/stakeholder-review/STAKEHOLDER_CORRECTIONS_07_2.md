# Implementation 07.2 — Stakeholder-Confirmed Corrections

| | |
|---|---|
| **Purpose** | The record of six decisions the stakeholder settled **after** the Implementation-07 review, and exactly what changed in the build because of each |
| **Build** | `ui-ux/18-unified-functional-platform/` |
| **Date confirmed** | 6 September 2026 |
| **Scope** | A narrowly scoped functional correction pass. **Not** the visual redesign, **not** B2C, **not** an architecture change |
| **Schema** | `9 → 10`, purely additive. Three back-filled fields — plus `renewsAccessId` on a renewal request, `overrides[]` on a content record and `codeSetBy` / `codeSetAt` on a Course, each written only when the thing it records actually happens and each tolerated as absent everywhere it is read. No collection added, no row removed, and the `xrslp-unified-v1` localStorage namespace is unchanged |
| **Deterministic QA** | **855 → 1079 assertions, 0 failures.** 224 added. **None removed and none weakened**; seven were *changed*, each because the confirmed behaviour itself changed |

> These decisions **supersede prototype assumptions where they conflict**. Nothing here is
> back-dated: the earlier documents recorded what was true when they were written, and they
> are not rewritten to pretend these answers were known earlier.

---

## The six decisions

### A · Re-requesting an Experiment the institution already holds

> **Stakeholder:** *"If the same institution requests the same experiment again, they can request
> additional licenses. It should show the existing plan when they reselect."*

**What was already true, and did not change.** Nothing blocked a re-request. A second request
produced a **second access record beside the first**, the original record was untouched, both
request histories survived in full, and no duplicate institution was created. That behaviour was
verified against the state layer before anything was edited, and it is now pinned by assertion.

**What was missing.** *Nobody was ever told.* No surface — public catalogue, request form, Super
Admin decision screen — read the institution's existing access. The requester could not see the
plan they already held, the Super Admin could not see the overlap they were approving.

**What changed.** Three read models and the surfaces that use them:

| | |
|---|---|
| `scenarioTenant()` | Which institution the public plane is speaking for. **Prototype-only** — resolved from the scenario selector, not authentication, and it grants nothing. Returns `null` when no institution is resolvable, and every surface renders nothing rather than claiming an identity |
| `tenantAccessForExperiment(tenantId, experimentId)` | **One row per access record** — never a blended "current plan". Two records have independent technologies, terms and licence counts, and one can expire while the other runs |
| `heldSelectionFor(tenantId, items)` | The subset of a selection basket the institution already holds |

The catalogue shows the existing plan on reselect and relabels the action **Request additional
licences**. The request form frames it as an **expansion of existing institutional access**, and
states the licence arithmetic — *N held across M live records, this asks for a further Q* — read
from `tenantAllocation().approved`, which is a **licence sum and never a student count**. The
Super Admin request detail shows what the institution already holds before the decision is taken.

**Nothing is blocked or disabled anywhere.**

---

### B · VR / AR completion confirmation

> **Stakeholder:** *"This is yet to be decided. We have discussed an API-call method to communicate
> and confirm."*

**No mechanism was invented, and no code changed in the state layer.** There is no API client, no
endpoint, no payload shape, no provider and no stub. The prototype's existing completion control is
kept — it is the only way to demonstrate the learning journey — and it is now **labelled correctly**.

**What was wrong.** Three sentences asserted a settled contract (*"the experiment itself reports
your completion"*, *"reports back what you completed"*, *"your completion will return to this
page"*). Worse, the existing prototype label rendered **only while a run was in progress**, so it
disappeared at exactly the moment a completion was claimed.

**What changed.** The three sentences are hedged to *expected*, and a **COMPLETION CONFIRMATION NOT
DECIDED** note now renders in **every** state including completed. It says an API/event call between
the XR runtime and the platform has been discussed and is the expected direction, that no contract
is chosen or built, and that the control is a prototype stand-in. It names no verb, path, payload
or provider. The Student's Progress screen carries the same caveat.

**The exact event contract remains OPEN — see D25.**

---

### C · Device replacement / transfer routing

> **Stakeholder:** *"Any request from institution should come through Tenant Admin. He will be our
> POC to facilitate and final approval comes to Super Admin."*

**The stakeholder's reading of the prototype was correct** and is now fixed. A Student request
previously became Super-Admin-actionable the instant it was created — creation and platform
visibility were the same state, and the Tenant Admin workspace showed device requests **nowhere**.

**The corrected chain.**

```
Student  →  Institute / Tenant Admin  →  Super Admin  →  decision
            (institution POC:              (final decision maker,
             reviews, forwards)             unchanged)
```

| Before | After |
|---|---|
| `submitted` meant "awaiting Super Admin decision" | `submitted` means **"with the Institute / Tenant Admin"** |
| — | `escalated` — forwarded, awaiting the Super Admin |
| `transfersAwaitingDecision()` returned `submitted` | returns **`escalated` only**. This single filter is what stops a Student reaching the platform directly, and every Super Admin count, badge and attention row derives from it, so they all move together |

New: `transfersAwaitingTenant(tenantId)`, `transfersForTenant(tenantId)`,
`escalateDeviceTransfer(id, note)`. `decideDeviceTransfer` now requires `escalated`.
A new **Device requests** destination in the Tenant Admin workspace carries the queue and the
Forward action. The outcome is visible to the Student **and** the Tenant Admin, and the Student's
own request tile now shows the forwarding step in its history.

**Boundaries held.** Forwarding writes the request and nothing else — no licence, no Experiment, no
technology, no assignment, no assessment state. **No device registry** was introduced: the
escalation note is plain free text, and there is no serial number, model validation, MDM, hardware
certification or authentication step anywhere on the path. **Nothing is sent** — this build has no
notification channel and does not pretend to.

**Two honest edges, both asserted.** A **deactivated** institution cannot forward, and the request
stays exactly where it was until reactivation. An institution with **no assigned Tenant Admin**
genuinely cannot perform the POC step, and no actor is fabricated to get past it.

---

### D · Renewal

> **Stakeholder:** *"Tenant should go through same payment method which he follows in initial
> onboarding."*

**There was no renewal capability at all** — not automatic, and not a manual Super Admin extension
either. Verified: `endsOn` was written in exactly two places, activation and the explicitly
labelled prototype demo clock. So the risk was not that a Super Admin could extend directly; it was
that the only renewal-shaped path available — submitting a second request — **derived its
commercial route from the prototype scenario selector rather than from the institution**. With the
external scenario active, renewing an internal BITS Community institution would have put it on the
payment route.

**What changed.** `renewalRouteFor(tenantId)` derives the route from the **institution and its
original onboarding request**, never from `scenario()`. `submitRenewalRequest(accessId, form)`
builds an **ordinary request row**, so it inherits every existing gate — the required decision
reason, the inactive-institution refusal, the grant-may-only-narrow rule, and the same three payment
outcomes on the same existing payment screen. No second decision surface, no new payment provider,
no price, no invoice.

| Route | Behaviour |
|---|---|
| **External / Subscription** | Approval alone activates **nothing**. Only a completed payment extends the term. Declined and unconfirmed outcomes extend nothing and record nothing |
| **Internal / BITS Community** | No payment step exists on that route, so the Super Admin's approval activates it — exactly as internal onboarding already works |

**Renewal extends the existing record's term rather than creating a second record.** This is
deliberate and is the one shape that keeps the institution whole: a new record would leave every
assignment, faculty mapping and licence allocation behind on the old one, and the institution would
renew only to find no student entitled. Rule A's **expansion** is the case that legitimately adds a
record, because it adds licences. The two are kept apart on purpose.

**No auto-renewal. No silent extension** — requesting a renewal extends nothing; only activation
does. **The 15-day reminder rule is unchanged**, and its delivery channel remains unresolved (D19).
Expiry still removes effective access and **not history** — assertions now pin the completed
simulation, its time spent and the assignment behind it surviving an expiry.

**Implementation judgement, recorded as one:** a renewed term runs from whichever is later, the
current end or today — so renewing early adds to what is left rather than discarding it, and
renewing after expiry does not back-date a term nobody could use.

---

### E · Canonical Course Code ownership

> **Stakeholder:** *"Content Manager primarily. Super Admin will also get access to it."*

**The field did not exist** — a canonical Course had `{ id, groupingId, name, summary }` and no
code. And the ownership was **exactly inverted**: every canonical Course write was Super-Admin-only
and the Content Manager was excluded in code *and* in on-screen copy.

**What changed.** Courses gain an **optional** `code`. It is seeded **blank** — no official code has
been supplied, and inventing one would put fabricated institutional data on the public catalogue.
Blank is a permanent, legitimate state, exactly as a blank Semester is.

| Owner | Surface |
|---|---|
| **Content Manager (primary)** | `updateCourseCode(actorId, courseId, code)` — the only actor-scoped structure writer in the build, and it writes **one field**. A new *Course codes* destination in the Content Manager workspace |
| **Super Admin (also)** | The `code` field on the existing Academic-structure create and edit forms |
| **Tenant Admin (never)** | Unchanged. Their local code stays on `courseMappings[].localCode`, scoped to their institution. The canonical code is now shown **read-only** beside it so the distinction is visible |

**Authorisation lives in the state layer, not in the route** — this prototype has no authentication
and its routes carry only a shell label, so the boundary that matters is the writer: the actor must
be a Content Manager, and the Course must be inside their assigned scope. A Vendor, an Academic
Reviewer and a tenant id are all refused outright.

The Content Manager may **not** create, rename, re-parent or delete a Course — the structure itself
stays platform-controlled. The code is unique **platform-wide** when present (a different scope from
the Course *name* rule, which is unique within a Programme, because a name is a label in a tree and
a code is platform identity); blanks never collide. **Nothing in the build resolves by code** — CSV
import and manual entry still resolve canonical structure by name, and the tenant's own conflict
warning still compares local codes.

---

### F · Super Admin override authority

> **Stakeholder:** Super Admin should have overall control over all of it *"as of now"*, including
> content changes, Vendor issues, Academic Reviewer issues, Content Manager issues.

**Half was already true.** Vendor / Reviewer / Content Manager **authority** was already fully
Super-Admin-governed, their **issues** already reached the platform through support, and tenant
governance, Tenant Admin assignment, canonical structure and Release / Hold were already Super Admin
acts. What was structurally absent was any authority over the **content status machine**: every
transition was gated on a content actor id, and the platform is not one — so a submission whose only
assigned Academic Reviewer had their scope withdrawn was **inert, permanently, with nobody able to
move it**.

**What changed — and what deliberately did not.**

`overrideContentStatusAsPlatform(recordId, toStatus, reason)`:

- **A reason is required.** An override with no stated reason is exactly the invisible mutation
  mechanism this must not become.
- **It names what it overrides** — from-status and to-status, on the record's own `overrides[]`
  line and in one `override` history event that reads *as* an override in the shared timeline every
  workspace already renders.
- **PUBLISHED is refused as origin and as destination.** First publication stays the Content
  Manager's act, a later version stays the Super Admin's separate act on a different object, and
  nothing un-publishes. Un-publishing would strand live access records, faculty mappings,
  assignments and in-progress attempts that still reference the Experiment id.
- **The destinations are declared before the decision**, each with whether anybody live actually
  covers it — so an override cannot quietly create a record nobody can reach.
- **It grants nothing** — no access, no entitlement, no publication, no academic decision.

**Normal ownership is untouched.** Not one character of `vendorCanEdit`, `reviewerCanAct` or
`managerCanAct` was widened. The Vendor still submits, the Academic Reviewer still validates and
owns the Learning Outcomes, the Content Manager still controls first publication. Assertions pin
all three *after* an override has been used.

**Two existing overrides were brought up to the same bar.** Withdrawing a role scope now **requires**
a reason (it freezes somebody's workspace — that is consequential). Correcting a **published**
canonical master record now requires a reason, because the public catalogue shows the change
immediately. A new *withdraw every scope* control makes suspending an actor **one decision with one
reason**, with every row still individually restorable and their name still on every record they
acted on.

**This closes D4 in the affirmative and wider than it was asked.**

---

## Schema 9 → 10

Purely additive. Presence-guarded, ID-keyed and **idempotent**, running on every load — the same
shape as the existing structure back-fill, so a state already stamped 10 is still repairable and a
value a real person entered is never re-stamped back to the seed.

| Field | Back-fill |
|---|---|
| `courses[].code` | From the seed (blank) when absent. An entered code is never touched. A code that is actually set also carries `codeSetBy` / `codeSetAt`, written on demand by whichever owner set it — a record that has never had one claims no provenance |
| `access[].renewals[]` | `[]` — a record that has renewed nothing has renewed nothing. **Empty, not missing** |
| `deviceTransferRequests[]` → `escalatedBy` / `escalatedAt` / `escalationNote` | `null` / `null` / `''` |

**A stored request sitting at `submitted` is not rewritten.** Under the corrected routing
`submitted` *means* "with the Institute / Tenant Admin", which is exactly where an undecided request
should be — so the honest migration leaves the status alone.

Three further fields are **written on demand rather than back-filled**, because absent is their
true value on a record where the thing never happened: `renewsAccessId` on a request (only a
renewal has one), `overrides[]` on a content record (only an overridden one), and `codeSetBy` /
`codeSetAt` on a Course (only one whose code has been set). Every reader tolerates them being
absent, which is why they need no migration step.

Nothing is deleted, renamed or reordered. The localStorage namespace is unchanged.

---

## What is still open — and was not decided here

| | Open question | Where it is labelled |
|:--:|---|---|
| **D25** | The XR completion **API/event contract** — endpoint, payload, direction, provider | On the Student's run screen, in every state |
| **D26** | May an **expansion** request also add technology variants the institution does not currently hold, or change the access term? | On the request form |
| **D27** | May a **renewal** change licences, technologies or term, or must it mirror the current plan? | On the renewal surfaces |
| **D19** | The 15-day reminder's **delivery channel and recipient** | Unchanged — still labelled *delivery channel pending* |
| **D20(a)** | Whether **declining** a device request is in scope | Unchanged — still labelled an implementation judgement |

The build **fails safe** on all five: it neither blocks nor assumes. A renewal mirrors the current
plan because that is the only choice that decides nothing; an expansion neither forces nor forbids
adding a technology; no completion contract is stubbed.

---

## Adversarial review of this pass, and what it found

The change was reviewed against itself before it was called done: five reviewers over the diff, and
every finding put to three independent verifiers whose default was to refute it. Six defects
survived that and were fixed **inside this pass**. Each is now pinned by assertion (scenario **GG**)
so it cannot come back.

| | What was wrong | Why it mattered | Fix |
|:--:|---|---|---|
| **1** | A renewal reached the ordinary Super Admin decision surface, which offers the control for granting an institution **less** than it asked for. `validateGrant` accepted the narrowing, the dialog and the institution's own status screen both announced *"the institution receives less than it requested"* — and then `activateRenewal`, which extends the term of an **existing** record, applied only the term and left the licences, experiments and technologies untouched | **The most serious finding.** The recorded decision and the real entitlement diverged with nothing to reconcile them: an institution kept 40 licences and a technology the Super Admin had explicitly refused, while every screen said otherwise | `approveRequest` **refuses** a grant on a renewal; the decision screen renders no narrowing control and says why; `activateRenewal` refuses to activate a renewal carrying a plan it would not fully apply. This is also the fail-safe reading of open question **D27** |
| **2** | The public request form resolved the institution from the **prototype scenario selector**, not from the name the applicant typed | A visitor who cleared the prefilled name and typed a different institution was shown the **seeded** institution's access records, licence counts and terms, under the heading *"this request expands access <their own institution> already holds"* | New `requesterTenant(name)` — resolved from the typed name, exactly as the approval match is. An unrecognised name resolves to **nobody**, and the expansion framing simply does not render |
| **3** | The catalogue said *"your institution already has access to this experiment"* and relabelled the button *"Request additional licences"* whenever **any** record existed — including one whose term had expired | An institution that held nothing was told it held something, and invited to add to it | Heading, button and supporting copy follow **live** access; the expired records are still listed, because that history is real and is what makes the new request an expansion |
| **4** | The platform override cleared `returnedGate` on every destination | `submitContent` reads that field to route a resubmission, so the two *Changes requested* destinations behaved identically — a Super Admin who deliberately returned a record at the **content readiness** gate would have watched the resubmission go to the Academic Reviewer anyway | The gate is **set to match the destination**, and cleared only for a destination that is not a return |
| **5** | `updateCourseCode` authorised on `actorCourseIds`, the **reading** scope, which widens an Experiment-scope assignment to that Experiment's Course | An assignment naming one Experiment could set or clear the canonical code of the **whole Course** — platform master data belonging to every other Experiment in it | Authorises on the **authoring** scope instead: platform scope, or an explicit Course scope. The same distinction `actorCreateCourseIds` and `managerCanFileInto` already draw |
| **6** | The Super Admin's *"Already held by this institution"* card listed the access record **this very request** had created, once the request was active; and the applicant's own screens told a renewal that the record it was renewing was *"unaffected and continues exactly as it is"* | Both stated the opposite of the truth on the exact screen built to remove that confusion | Records are excluded by `requestId`, and the renewed record is named for what it is — the one thing the request changes |

Two further findings were fixed as small correctness items: a Course created **with** a code
reported *"Never set"* in its own provenance column, and one new assertion was a tautology that
would have passed even had the behaviour it named been broken.

Everything else the reviewers raised was either refuted on verification, already handled by a guard
elsewhere, pre-existing rather than introduced here, or a documentation staleness fixed in the same
pass.

---

## Regression

Every invariant from Implementations 01–07 still holds and is still asserted. The ones most exposed
by this pass, each re-pinned:

- public catalogue browsing grants nothing — and now reads existing access **without** granting
- published ≠ tenant access ≠ student entitlement
- one Student consumes one licence against an access record, however many of that record's
  Experiments they receive
- Faculty mapping and every governance action consume no licence — **forwarding a device request
  included**
- first Publish stays distinct from Release / Hold; the Academic Reviewer does not publish; the
  Vendor does not author Learning Outcomes — **all three re-asserted after an override**
- expiry removes effective access, **not** history — now asserted on the completed run itself, its
  time spent, and the assignment behind it
- payment stays a clearly labelled prototype simulation; no real provider, no real AI provider, no
  authentication, no device registry
