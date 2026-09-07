# Stakeholder Closure — Implementation 07.3

| | |
|---|---|
| **Purpose** | Close the XR Simulation Learning Platform prototype against the **complete** stakeholder review — the whole meeting transcript and every populated row of the tracker, not only the six written follow-up questions |
| **Build** | `ui-ux/18-unified-functional-platform/` |
| **Branch** | `uiux/full-platform-design` · working tree only. **Not committed, not pushed, not merged, not published** |
| **Scope** | Product **functionality** and stakeholder corrections. **Not** the final visual redesign, **not** B2C, **not** an architecture change |
| **Schema** | `10 → 11`, purely additive and idempotent. `contentRecords[].previewVideo`, `history[].refs[]`, `academicReviews[].refs[]`, `contentRoleAssignments[].history[]`. Namespace `xrslp-unified-v1` unchanged |
| **Deterministic QA** | **1079 → 1292 assertions, 0 failures.** 213 added. None removed, none weakened. Four *changed*: the schema-version assertions, `10 → 11` |
| **Canonical test origin** | `http://127.0.0.1:8791/` serving this folder as document root, started with the new `serve.py` (caching disabled) |

> Every "COMPLETE" below was verified against **running code** — a state-layer probe, a deterministic
> assertion, or the live app at the canonical origin. **No row is marked complete because an earlier
> report said so.** Three previous reports were found to overstate what was built; those are named in §5.

---

## 1 · The build/origin discrepancy — resolved

The reported symptom was that Renewal and the canonical Course Code were **visible in one local
version and missing on `localhost`**. This was investigated before anything was edited.

**Finding: there was never more than one build.**

| Check | Result |
|---|---|
| Copies of the prototype on disk | **One.** `find ~/Desktop -name index.html` matches only this folder |
| Served bytes vs disk | **All 30 JS files byte-identical** (md5, every file) |
| Every `<script src>` over HTTP | **All 200.** No 404, no missing file |
| Renewal in the tree | **Present** — 8 exported helpers (`renewalRouteFor`, `submitRenewalRequest`, `canRenewAccess`, …) |
| Canonical Course Code in the tree | **Present** — `courses[].code`, `updateCourseCode`, `managerCanSetCourseCode`, `validateCourseCode` |
| Schema migration | **Idempotent, runs on every load** — a stale schema-10 state is repaired, not skipped |

**The actual cause is HTTP caching, and it was reproduced live during this pass.** `python3 -m
http.server` sends `Last-Modified` but **no `Cache-Control` and no `ETag`**. Under RFC 9111 a browser
may then reuse a cached copy without revalidating, and Safari does. Mid-session the browser was
observed executing an **older** `public-catalogue.js` while the server was serving the new one —
confirmed by fetching the file with `cache: 'reload'` and diffing it against the running function.

`file://` does not show the symptom because that origin revalidates by mtime. So the two origins
*appeared* to run different builds. **They never did.**

A second, real but different difference: `file://` and each `http://localhost:PORT` are **separate
browser origins with separate `localStorage`**, and the shell history shows three ports in use
(8080, 8123, 8731). That explains **data** differences between tabs. It does not explain code
differences, and it was not used to hand-wave them.

**Fixes, so this cannot recur:**

1. **`serve.py`** (new) — serves this folder with `Cache-Control: no-store`. This is now the canonical
   way to run the prototype, because it also covers `index.html` itself, which a query string on the
   script tags cannot.
2. **`index.html`** — every `js/` and `css/` reference carries `?v=073`, with a comment explaining the
   failure mode and instructing that the token be bumped whenever the build is handed over for review.

> **CANONICAL TEST ORIGIN = `http://127.0.0.1:8791/`** — `python3 serve.py` from this folder.
> Every QA result and every manual verification in this document was taken there.

---

## 2 · Requirement matrix

Status vocabulary: **COMPLETE** · **PARTIAL** · **OPEN** (needs a stakeholder decision) · **DEFERRED**.

### R01 · Public catalogue: Programme / Department → Course → Experiment — **COMPLETE**

> *"The civil engineering has like 4 experiments … It should be compiled inside civil engineering.
> Why is it showing?"*

The catalogue was a flat wall of every published experiment under two count-cards, the whole
"Browse by Programme" section was `hidden` as soon as **any** filter was active (filtering destroyed
the structure instead of scoping it), and there were **zero** course links on the page.

**Now:** `#/catalogue` opens grouped — Programme → collapsible Course → nested Experiments, each
Course linking to its own page. Filtering **narrows the tree instead of flattening it**, and names the
programmes that hold nothing matching. A **"Flat list"** view remains for single-experiment discovery,
but only one view renders at a time, so the duplicate wall is gone. An experiment whose Course or
Programme does not resolve goes to an explicit **unfiled** group rather than being dropped.

`js/screens/public-catalogue.js` · verified live at 375 / 768 / 1280 / 1440 px, no horizontal overflow.

### R02 · Remove the sample "Decision" UI — **COMPLETE (verified, not changed)**

> *"What is decision? … we do not require this decision."*

Audited: **no sample/illustrative Decision block exists** on the Super Admin request review. The
"Decision" heading that remains is the real decision form. Every legitimate element the stakeholder
wanted kept is present and was checked individually: **Approve**, **Request more information**, the
**required reason**, the **allocation editor**, and the **full history**. Nothing was over-removed.

### R03 · Existing access / additional licences — **COMPLETE (with a defect fixed)**

> *"If the same institution requests the same experiment again, they can request additional licences."*

The state layer was already correct: a second request creates a **second access record beside the
first**, the original is untouched and both histories survive (proved by byte-comparing the first
record before and after).

**A real defect was found and fixed.** `resolveRequestTenant()` consulted the prototype **scenario's
seeded tenant before the submitted institution name**. A request typed under a name no institution
matches therefore resolved to whichever institution the scenario seeded — so the Super Admin's
*"Already held by this institution"* card rendered **a different institution's** access-record ids,
technologies, terms and licence figures, and the identity sentence asserted the request attached to an
institution that had not submitted it. The public request form already had exactly this fix and
documented the reasoning; the reviewer-facing plane had been left behind.

The submitted name now outranks the scenario; an unrecognised name resolves to **null**, which the
screen already renders correctly as *"approving creates a new institution"*. A request already bound
to a tenant id still resolves by id, so a later rename cannot re-route payment.

`js/state.js` `resolveRequestTenant` · **QA scenario 07.3-G**.

### R04 · Tenant Admin terminology — **PARTIAL**

> *"Why are we calling it as assignment? … that is not assignment … change this terminology."*

**"Assignment" is gone.** Zero user-facing occurrences remain anywhere in the Tenant Admin flow —
verified in the live DOM. The nav reads **"Student access"**, and headings, breadcrumbs, buttons,
dialog titles, blocked-reason sentences and announcements were all changed to match. Internal property
names, routes and helper names were deliberately **not** renamed: that would be regression risk for no
user-visible gain, and the master brief permits it.

**Still open: "Access record".** The stakeholder questioned the name but **no source supplies a
replacement**, and the same object is called "access record" on the Super Admin plane and inside
user-visible state strings (`ASSIGNABILITY_REASON`, `renewalBlockText`). Renaming it in tenant screens
alone would make two roles disagree about one object. It is **glossed** in the tenant UI rather than
renamed. → **Open decision D28**.

### R05 · Scalable bulk content organisation — **COMPLETE**

> *"If they have to assign 50 experiments, how they will handle it … otherwise everything is going to
> be in a very big dropdown."*

The chooser was a one-level flat `<select>` labelled "Course — Experiment", with the Programme
resolved and then **thrown away**, and there was no search or filter over content anywhere in the
tenant workspace.

**Now:** the experiment selector is grouped by **Programme** (`<optgroup>`) with "Course — Experiment"
options and a filter box above it; the Content access library has a real search + Programme + Course +
technology filter bar; each access record shows **approved / assigned / remaining** licences per
experiment from `accessAllocation` (a licence sum, never a student count); and "Approved content by
Programme / department" breaks a record down by department with a jump into the filtered library.

**No `Employee` role was invented.** The confirmed institutional roles remain Tenant/Institute Admin,
Faculty, Student/Learner. → **Open decision D29** records the audience the stakeholder mentioned.

### R06 · Tenant Admin institution-level learning overview — **COMPLETE**

> *"Tenant is again a super admin for that particular institution … he should have that overview."*

The Overview covered only provisioning, and the file carried a "NOT IN THIS BUILD" note admitting the
learning half was absent.

**Now:** a *"Learning across the institution"* section — students with access / started / not started /
finished everything; experiments given to students, not started / in progress / **awaiting Faculty
review** / **evaluated, result not released** / completed; and a **By Course** table across
Programme → Course. Every figure is derived from the same helpers the Faculty screens read.

**Deliberately absent, and stated on screen:** no marks, scores or pass rates — those belong to the
Faculty evaluator and the student, and an institution-level pass rate would make a single student's
withheld result inferable in a small cohort. **No revenue, cost or commercial metric anywhere.**

### R07 · Faculty sees the technology **actually used** — **COMPLETE**

> *"If the faculty is giving the assessment marks, how he will know it is a web assignment or a VR
> thing … we need the tag."*

The review screen showed **"Available technologies"** — which is what the *institution licensed*, not
what the student ran — and a single `sourceTechnology`, which is only the *most recent* simulation. A
student who ran Web **and** VR was described as having used one of them. That is precisely the
"do not falsely claim one technology" prohibition.

**Now:** `technologyUseSummary(personId, experimentId)` returns a **set**, and the Faculty review
renders *"Technologies used: Web (completed) · VR (completed)"* plus *"This student used more than one
technology for this experiment. The assessment is experiment-level, so it covers all of them."*
`sourceTechnology` is kept but demoted to what it truly is: *"Entered the assessment from … — not the
full list above."* Requesting a VR package but never running it is reported separately as
**requested, not used**. The configuration screen's availability line is relabelled
*"Technologies licensed to this institution"*.

**Verified live** on a student with `sourceTechnology = vr` who had actually completed both.
`js/state.js`, `js/screens/faculty.js` (`techUsedHTML`), `js/screens/faculty-assess.js` ·
**QA scenario 07.3-E**.

### R08 · Faculty Student Progress export — **COMPLETE**

> *"If there are 100s of students … they cannot count each student."*

There was **no export of any kind** — `js/csv.js` was import-only.

**Now:** an **Export CSV** control on Faculty Student Progress exporting **the filtered rows the
screen is showing**, with 21 columns including student name and ID, Programme, Course, **official**
course code and **institution** course code as separate columns, experiment, technologies **licensed**
and technologies **used**, per-technology simulation status, resource progress, assessment state,
attempt, score, outcome, responses awaiting review and progress.

**The privacy column.** Marks are included and that is correct — the Faculty member is the evaluator
and `scoreWithheld` is explicitly a *student-view* gate. What a detached file would otherwise lose is
whether the student has been shown the result, so the file carries **"Result released to student"**
(`yes` / `NO — withheld` / `n/a`). A withheld result **travels marked as withheld**.

**The generated file was tested, not the button** — captured from the real click path and asserted.
`js/csv.js`, `js/screens/faculty.js` · **QA scenario 07.3-I**.

### R09 · Simplify Student Home / My Learning — **COMPLETE**

> *"This can be little, we can improve … I think we have given too many content."*

Home never **listed** an available experiment: in the resume state its `<main>` held exactly one link,
and the count of everything else was a **dead stat tile** reachable only through the nav rail.

**Now:** *"Continue where you left off"*, then **"Your experiments"** listing every available
experiment with its state and a direct **Continue / Start learning** button, then a counts line, with
the explanatory copy demoted below. Entitlement truth is **preserved, not hidden**: where an
entitlement exists but cannot be opened — an **expired access term**, a **suspended institution**, an
**inactive account**, or a **licence allocation hold** — Home renders a **"Not available at the
moment"** row naming the experiment and the reason. Silence is never substituted for "you are not
entitled".

> **Precisely scoped, after adversarial review.** Two other blocked cases do *not* produce a row, and
> the earlier draft of this document wrongly implied they did. A **deactivated assignment** creates no
> entitlement record at all, so there is nothing for Home to list; an **attempt-limit** block does not
> clear the entitlement, so the experiment stays openable and the limit is explained on the experiment
> page instead. Neither is a silent denial — but neither appears in that section.

My Learning was left as it was — it already lists every experiment as a card with a direct action.

### R10 · VR / AR delivery and in-portal assessment — **COMPLETE**, completion confirmation **OPEN**

> *"They can use the headset, experience it, and then take the assessment in the portal."*

Web/WebGL → hosted link; VR/AR → authorised package and supported-device flow. **AR is a first-class
technology in the Vendor submission.** The in-portal assessment is **not** gated on the Web
simulation — verified on an AR-only entitlement.

**The completion mechanism remains undecided and is now labelled honestly everywhere.** The caveat
previously rendered only on the simulation sub-screen; the experiment page asserted *"Completion
recorded"*, a completion percentage and a "Completion" step with **no caveat at all**. The honest note
now renders wherever a completion is asserted, **including in the completed state**. No API, endpoint,
payload, provider or screenshot rule is named or invented anywhere. → **D25**.

### R11 · Device transfer: Student → Tenant Admin → Super Admin — **COMPLETE (verified, not changed)**

> *"If there is a change request, it should also come through tenant admin."*

Verified end to end: an institutional student's request reaches the **Institute / Tenant Admin** first
(`submitted` means "with the Tenant Admin"), who **forwards** it (`escalated`), and the **Super Admin
holds the final decision**. A Tenant Admin cannot approve. Entitlement, experiment access,
technologies, learning history and assessment history are all preserved, and **no second licence is
consumed**. A directly-enrolled student still routes straight to the Super Admin, which matches the
transcript.

### R12 · Remove duplicate Status / "Currently with" — **COMPLETE**

> *"The same information you're showing in currently with and status. Why do we need two columns?"*

`cui.holderLine()` is derived **purely from `rec.status`** — it names no person — so the two columns
really were the same fact twice. The redundant column is removed from the **Vendor experiments** table,
the **Content Manager Content Library**, and the **Vendor versions** list ("With" beside "State").
The underlying workflow model is untouched, and record **detail** screens still say who holds an item.

The Super Admin device-transfer table **kept** its column, renamed **"Where it sits & why"** — there it
carries the institution, who forwarded, when, and the forwarding note, which the status label does not.

### R13 · Vendor preview / demo video — **COMPLETE**

> *"The vendor is giving the content — give them a provision to add the video also."*

There was no field, no input and no display anywhere; the public page had a placeholder promising a
video the model could not hold.

**Now:** the Vendor supplies it on the submission form (address, label, note); it travels the workflow
and is visible to the **Academic Reviewer** and the **Content Manager**; and it appears on the
**public experiment page once published**.

**Honesty:** it is a **link reference, not an upload** — stated on the form and beside every rendering.
A non-http(s) address is refused with an inline error rather than stored as a dead link.

**The publication boundary is real.** `publicShape()` is a whitelist projection applied only to records
at `PUBLISHED`, so an unpublished record's video is not merely hidden — it is **not in the public read
model at all**. Verified live: an unpublished record carrying a video is not in the pool, its string
appears nowhere in it, and its public route is Page-not-found. **QA scenario 07.3-C.**

### R14 · Supporting references on change requests — **COMPLETE**

> *"Wherever changes are there, we need some permission to enable them to add some reference or
> resources."*

There was no supporting-material channel on any change request, at any gate, in any layer.

**Now:** both the **Academic Reviewer's** and the **Content Manager's** change requests carry
references — a link, or a file the reviewer points at. They are rendered with the recipient's copy of
the request, in the record history timeline, and on the reviewer's decision history.

**Honesty:** a file reference stores **only the browser-reported name and size**, carries
`storedBytes: false` **on the record itself**, invents **no URL**, and every rendering says
*"a file reference records the file's name and size only … nothing was uploaded"*. These are kept
strictly separate from the Vendor's own supporting documentation, which is a different list from a
different person at a different point in the workflow.

**QA scenario 07.3-B.**

### R15 · Content Manager change-request routing — **COMPLETE**

> *"If you click the request, there should be 2 options available. One is academic reviewer and one is
> vendor."* · *"If the application is not working, what is the point in going to the academic review?"*

**Both** `requestChangesAcademic` and `requestChangesContent` previously set a status whose holder was
the **Vendor**. The Content Manager had **no route to the Academic Reviewer at all** — the single
ambiguous return path the stakeholder objected to.

**Now:** the destination is an **explicit choice with no default**. A new status
`CHANGES_ACADEMIC_RECHECK` (holder **reviewer**) is a real state fork, not a label. The screen states
the consequence **before** the decision, names **who can pick it up**, and the confirmation repeats it.

**Verified end to end in the browser:** choosing the Academic Reviewer put the record at
`CHANGES_ACADEMIC_RECHECK`, holder `reviewer`, **in Dr. Iyer's queue**, counted under the manager's
*"returned to the reviewer"* and **not** under *"with the Vendor"*, with the Vendor unable to edit or
resubmit it, and the reason and reference recorded in history.

**A dead end was found and fixed during QA:** `reviewerCanAct()` accepted the new status but
`academicReadiness()` did not, so the reviewer received the record and **could not move it**. Both now
agree. **QA scenario 07.3-A** asserts the recipient, the counts, the vendor lock-out and the fact that
the reviewer can actually move it forward.

### R16 · Content Manager delivery-link management — **COMPLETE**

> *"Content manager should have the provision to edit the link … if he wants to delete and replace the
> link also he can replace it."*

There was **no way** for a Content Manager to edit, replace or remove a delivery link; the screen said
"Vendor submitted — read-only".

**Now:** `managerUpdateDelivery(actorId, recordId, tech, patch, reason, remove)` with an edit /
replace / remove control per technology. A **reason is mandatory**. Every change writes a history entry
naming **what it was and what it became**. It can only touch a technology the record already carries —
it can **never add or remove a technology**, which stays the Vendor's technical submission. A hosted
link that is not an http(s) URL is refused rather than handed to a student.

The **Academic Reviewer can open and inspect** a delivery link during review, in a card explicitly
marked inspect-only, and is given **no** edit authority — no confirmed source grants it.

**A P1 data-loss defect was found by adversarial review and fixed.** The no-op guard compared only the
URL / package reference, so an edit touching **only** `notes`, `runtime` or `packageLabel` mutated the
record in memory, wrote **no history**, never called `save()`, and still **returned truthy** — the
screen announced a write that had not happened, and the value was lost on reload. The comparison now
covers every editable field. **QA scenario 07.3-D** asserts a notes-only and a runtime-only edit are
recorded **and reach storage**, read back from `localStorage`.

### R17 · Super Admin operational control — **COMPLETE**

> *"He should be given the ultimate superpower … if any content manager is facing a problem or an
> academic reviewer is facing a problem or a vendor is facing a problem, he should be able to mitigate
> all those things."*

**A P1 audit defect was found and fixed.** `restorePlatformRoleAssignment` nulled
`removedBy` / `removedAt` / `removedReason`, and the row had no history — so **restoring a scope
destroyed every trace that an actor had ever been suspended, and why**. Clarification F grants
authority *with auditability*; an override whose evidence disappears one click later is not auditable.
A durable append-only `history[]` now records both the withdrawal and the restore, keeping verbatim
what was cleared, and `actorWasEverSuspended()` still answers **after** the restore. Verified live.

Beyond that: the overview surfaces **content-chain deadlocks** ("Experiments nobody can act on",
"Role holders with no scope") so the Super Admin can find a stuck item rather than being told to look;
interventions are reason-required and recorded; and the new `CHANGES_ACADEMIC_RECHECK` is overridable
so the academic route cannot become a new way to strand an item.

**The wording distinction is intact and was checked explicitly.** First publication is **Publish**;
later published-version control is **Release / Hold**. The override refuses `PUBLISHED` in **both**
directions, so it can never turn a first Publish into a Release. Role-specific ownership is untouched:
the Super Admin resolves and audits, and does not become the Content Manager.

**A dead control and two false statements were fixed** in the same pass — see §5.

### R18 · Renewal workflow — **COMPLETE (verified, one copy fix)**

> *"Who will renew, how the renewal will happen?"*

Verified against clarification D: the Tenant Admin raises a renewal on an eligible record; the route is
derived from the **institution's own original onboarding request**, not the prototype scenario;
internal institutions take an approval path **with no payment**; external subscriptions require
**approval → payment → activation**; a renewal request **extends nothing on its own**; there is no
auto-charge and no auto-renew; the term extends only on activation and only on the correct existing
record; history is retained; and the 15-day pre-expiry attention remains **in-product**, with no
invented email/SMS/push channel.

**Fixed:** the payment success toast said *"access for X is now active"* for a renewal, which describes
the wrong event — a renewal activates nothing new, it extends an existing term. It now names the
renewed record and says no new access was created.

### R19 · Official canonical Course Code — **COMPLETE (verified, not changed)**

> Written clarification E.

`courses[].code` is the canonical value, managed by the **Content Manager** primarily and by the
**Super Admin**; the tenant's `localCourseCode` is a **separate field**. The two are labelled
distinctly, **blank is a legal state** and no official value is invented — including in the new CSV
export, which carries **both** columns and correctly showed the official code empty and the local code
`CE-305`. A Content Manager with only Experiment scope cannot set a whole Course's code. The student
CSV importer writes only `localCourseCode` and cannot reach the canonical value. The migration never
re-stamps a code a person entered.

### R20 · "Origin" presentation — **COMPLETE**

> *"What is this origin? … I have to remove it."*

The user-facing **"Origin" label and column are gone**. Provenance is **not deleted** — it is rephrased
into sentences a person would read: *"How this person was added: Included with the prototype as sample
data"*, *"Part of the sample catalogue this prototype starts with"*. The underlying `source` field and
every audit truth are retained internally.

### R21 · Question Bank association — **COMPLETE**

> *"The questions, whatever they are generating, where it will go and sit. Will it be tagged or will it
> be listed under soil mechanics?"*

Verified unchanged and correct: an AI draft **does not** enter the Question Bank automatically, Faculty
must accept it, and the resulting entry keeps the right Course and Experiment.

**The gap was the fourth part — that filters make the association understandable.**
`question.courseId` was written by the state layer and **read by nothing**: no column, no filter, and
the Experiment filter's labels stripped the course name. The Question Bank now has a **Course column**
(canonical name, with the institution's local code beneath it) and a **Course filter**; the Experiment
filter narrows to the chosen Course; a contradicting Experiment filter clears itself instead of showing
an empty table; and option labels read "Course — Experiment" consistently. The AI boundary is untouched.

### R22 · Content Library boundary, and deferred scope — **COMPLETE**

> *"Here it is going to act as one repository. I cannot take any analytics from here. That's fine."*

Verified: the Content Library remains a repository with **zero analytics**. Nothing resembling a Vendor
**purchase-order / order-management** workflow exists anywhere — that was explicitly deferred
(*"that can be separate. It is enough now"*) and **was not built**. No B2C work, no visual redesign.

---

## 3 · Excel tracker reconciliation

| # | Module / Role | Tracker status | **Now** |
|---:|---|---|---|
| 1 | Public Catalogue — grouping | Pending | **Complete** (R01) |
| 2 | Super Admin — remove sample "Decision" | Pending | **Complete** — verified absent; legitimate controls kept (R02) |
| 3 | Super Admin — duplicate requests | *Need Confirmation* | **Complete.** Superseded by written clarification A: not a duplicate — additional licences (R03) |
| 4 | Tenant Admin — terminology + organisation | Pending | **Partially complete.** "Assignments" renamed and bulk organisation built; **"Access record" still open** (R04, R05) |
| 5 | Tenant Admin — institution overview | Pending | **Complete** (R06) |
| 6 | Faculty — show Web / VR / AR on assessment | Pending | **Complete** (R07) |
| 7 | Faculty — export progress | Pending | **Complete** (R08) |
| 8 | Student — simplify | Pending | **Complete** (R09) |
| 9 | VR / AR — package + portal assessment | Pending · *method undecided* | **Complete** for delivery and assessment. **Completion confirmation remains OPEN** (R10, D25) |
| 10 | Device / licence transfer via Tenant Admin | *Need Confirmation* | **Complete.** Superseded by clarification C: Tenant Admin forwards, Super Admin decides (R11) |
| 11 | Vendor — duplicate Status / Currently With | Pending | **Complete** (R12) |
| 12 | Vendor — demo / preview video | Pending | **Complete** (R13) |
| 13 | Change requests — supporting files | Pending | **Complete** (R14) |
| 14 | Content Manager — route to Reviewer or Vendor | Pending | **Complete** (R15) |
| 15 | Content Manager — manage delivery links | Pending | **Complete** (R16) |
| 16 | Super Admin — operational control | *Need Confirmation* | **Complete.** Superseded by clarification F; audit erasure defect fixed (R17) |
| 17 | Renewal workflow | *Need Confirmation* | **Complete.** Superseded by clarification D (R18) |
| — | **Official canonical Course Code** | *not a tracker row* | **Complete.** Added from written clarification E (R19) |

> Rows 3, 10, 16 and 17 were labelled *Need Confirmation* in the tracker. **A later written
> clarification answered each of them**, so the tracker label is out of date rather than authoritative,
> and the clarification was implemented.

---

## 4 · Deterministic QA

`1079 → 1292 assertions, 0 failures.` Run from this folder:

```bash
/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc qa/harness.js qa/checks.js
```

| Scenario | What it pins |
|---|---|
| **07.3-A** | Content Manager routing: the **correct recipient** receives it, the reviewer can **move** it, the Vendor is locked out, the legacy 3-argument call still means Vendor, an academic return does **not** move the "with the Vendor" count, and history names the destination |
| **07.3-B** | Change-request references: both writers, the honesty flag `storedBytes:false`, no invented URL, junk dropped, empty-not-missing |
| **07.3-C** | Preview video survives the workflow, is refused when not an http(s) URL, is carried on **create** as well as edit, and an **unpublished** record's video never reaches the public pool |
| **07.3-D** | Delivery edits: reason required, **notes-only and runtime-only edits are recorded and persisted**, bad URL refused, technology set cannot be widened, removal recorded, Vendor and Academic Reviewer refused, genuine no-op records nothing |
| **07.3-E** | Technology **used** vs **licensed**: a two-technology student is reported as both, requested-but-never-run is not "used", nothing claimed before a run |
| **07.3-F** | Withdraw → restore leaves a **durable** audit line and keeps verbatim what was cleared |
| **07.3-G** | An unrecognised institution resolves to **null**, not to a bystander; a bound request still resolves by id |
| **07.3-H** | Schema 10 → 11 back-fill: nothing lost, nothing invented, idempotent |
| **07.3-I** | The Faculty export **file**: header/row shape, both course-code columns, technologies used, a withheld result never reported as released, CSV quoting |
| **07.3-J** | **Every P0/P1 the adversarial review found** — the per-record renewal route, an existing institution keeping its own route, run-evidence-only technology, delivery removal clearing everything, the field-level history note, reference URL schemes, the withdrawn-scope audit line surviving migration, the export's withheld-score gate, spreadsheet formula neutralisation, and a Course id that can no longer blank the catalogue |

Plus a whole-enum guard that **every** content status has a badge label and a declared holder — the
absence of which put a hole in the middle of concatenated sentences on three screens.

**Responsive and route sweep** at the canonical origin, 14 routes × 4 viewports (375 / 768 / 1280 /
1440): **zero horizontal overflow, zero broken hash routes, zero console errors.**

---

## 5 · Reports that overstated what was built

Finding these was an explicit goal of this pass.

| Claim | Reality |
|---|---|
| `STAKEHOLDER_CORRECTIONS_07_2.md` presents clarification A as fixed | Fixed on the **public request form only**. The Super Admin review plane still read the prototype scenario and disclosed a bystander institution's holdings. Fixed here (R03) |
| `B2B_FUNCTIONAL_CLOSURE_AUDIT.md` §9 asserts the Super Admin override is "explicit, reasoned and audited" | True at withdrawal, **false after restore** — the evidence was erased, and the QA scenario asserting it did not test the restore. Fixed here (R17) |
| Tracker rows 1, 4–8, 11–15 marked "Pending" | Accurate. None had been implemented; the 07.2 pass covered only the six written clarifications |

---

## 6 · Open decisions

| # | Question | Why it is open | What the build does meanwhile |
|---|---|---|---|
| **D25** | How is a VR / AR completion confirmed? | An API/event call between runtime and platform has been **discussed**, but no contract, endpoint, payload, provider or screenshot rule is approved | The existing prototype control is kept and **labelled** as a stand-in wherever a completion is asserted. Nothing is invented |
| **D26** | May a renewal **change** the plan — licences, technologies, term? | Not settled | Fails safe: a renewal **mirrors** the current plan, and `approveRequest` refuses a grant on a renewal. An institution wanting more raises an ordinary request |
| **D27** | Delivery channel for the 15-day expiry reminder | Not settled | **In-product attention only.** No email, SMS or push is claimed |
| **D28** | What should **"Access record"** be called? | The stakeholder questioned the name; **no source supplies a replacement**, and the object is named identically on the Super Admin plane and in user-visible state strings | Glossed in the tenant UI, not renamed. Recommendation: **"Approved content record"**, applied to *both* planes and the state strings in one pass |
| **D29** | Can institutions give access to **employees / other people** who are not students? | Mentioned in the meeting. The confirmed institutional role model is Tenant/Institute Admin, Faculty, Student/Learner only | **Not built.** No `Employee` role was invented. Recorded as an extension rather than corrupting the seven-role model |


---

## 8 · Adversarial review of this pass

After implementation, twelve independent skeptics were set to **refute** the corrections — each
attacking one hypothesis against running code with its own probes, not by reading diffs. They produced
**36 findings: 1 P0, 12 P1, 23 P2.** Every P0 and P1 is fixed and pinned by an assertion in
**scenario 07.3-J**.

| Sev | Defect | Fix |
|---|---|---|
| **P0** | **A renewal took the institution's route, not the record's.** `renewalRouteFor()` read the institution's *first* bound request, so once an institution held records from two routes — exactly what clarification A's additional-licence request creates — a **paid Subscription record renewed on approval alone, with no payment step**, and an internal record was held behind a payment step it never had. All three surfaces repeated the wrong route | `renewalRouteForAccess(accessId)` derives from the **record's own** `requestId` / `accessContext`; the tenant helper is now explicitly institution-scoped and the screens say so when records disagree |
| **P1** | **`submitRequest` took its commercial route from the scenario selector** — the enabler for the above. Typing a known institution's name under the other scenario produced a request bound to that institution carrying the wrong route | An existing institution keeps its own `kind` / `accessContext` / `paymentRequired`; the scenario is consulted only for a name the platform does not recognise |
| **P1** | The **renewal audit line** stamped the institution's `accessContext` onto the record, writing a false provenance onto a paid record | It records the **record's** context |
| **P1** | **`latestSimulationTechnology` ranked on `requestedAt` / `readyAt`**, so merely requesting a VR package outranked a completed Web run — and three screens rendered it as "Taken after VR simulation". The stakeholder's exact question was being answered with a technology the student never opened | Ranks on **run evidence only**; no run yields null |
| **P1** | **Delivery removal left `packageFile` and `install` behind**, so the readiness gate never closed and the screen still showed "Selected file: rig.apk" after promising everything was cleared | `remove` clears every recorded field; the writable set stays narrower |
| **P1** | The **delivery history note logged the summary**, so a notes-only edit recorded "was: PKG-1 · now: PKG-1" while three places promised it named what changed | The note is built from a **field-by-field diff** |
| **P1** | **Change-request reference URLs were not scheme-checked** — the only URL field in the build that skipped `isHttpUrl` — so a reference labelled "Marked-up spec" could point at `javascript:`, `file:` or a protocol-relative host | Rejected at the state layer, and re-checked at render time on both public renderers |
| **P1** | The **CSV export used `resultWithheld`** (decided-outcome only) while every student surface uses the broader `scoreWithheld`, so during a pending review under a delayed policy it **printed the objective sub-score** and marked the row "n/a" | Gated on `scoreWithheld`; the column now reads "NO — score withheld, review pending" |
| **P1** | **A currently-withdrawn scope lost its audit line at migration** — `actorWasEverSuspended()` answered false for a person who *was* suspended, and restoring then cleared the fields, leaving nothing. The dialog's own promise was false | The migration **reconstructs** the withdrawal entry from fields already on the row (marked `backfilled`), and the predicate also counts live `status: 'removed'` |
| **P1** | **A Course id colliding with an `Object.prototype` key blanked the public catalogue** — `byCourse['constructor']` returned a function, `.map` threw before any HTML existed, and it was **unrecoverable from inside the product** (a Course id never changes and nothing deletes a Course) | Null-prototype maps, **plus** a render error boundary so no single screen can blank the shell again |
| **P1** | The tenant overview header printed the **student × experiment pair count under the noun "experiments"** — at the stakeholder's stated scale it would have claimed thousands for an institution holding fifty | Labelled "student entitlements" |
| **P1** | The overview claimed **"no individual result appears anywhere"**, but *Completed* is reachable only through a released **pass** | The claim now describes what the released case actually shows; the withheld case stays masked |

Selected P2s also fixed: the Vendor's record page rendered **no status banner at all** in the new
returned-to-reviewer state; the reviewer's status filter emitted the option **twice** after it joined
the shared helper; a stale local `holderLine` override **forked the wording** for one record across two
screens; the content library's "Show in the content library" shortcut left a **stale technology filter**
that hid everything it had just filtered to; an HTML entity rendered **literally** in an escaped empty
state; and CSV values beginning `=`/`+`/`-`/`@` are now neutralised against **spreadsheet formula
injection**.

**Hypotheses that held up under attack:** the change request reaches the correct recipient and the
Vendor cannot touch a reviewer-held record; a second licence request leaves the first record
byte-identical; a renewal extends nothing before activation and cannot be narrowed; the canonical
Course Code cannot be reached from any tenant-plane writer and is never invented; the Super Admin
cannot publish, release-by-the-wrong-name, or take a role owner's job; attachments never claim an
upload; the catalogue drops no published experiment and leaks no unpublished one; and the tenant
overview fabricates no analytics and exposes no withheld result.

---

## 7 · What this pass explicitly did **not** do

- **No visual redesign.** Screens were changed only enough to make a corrected behaviour usable.
- **No B2C work.**
- **No Vendor purchase-order / order-management workflow** — explicitly deferred by the stakeholder.
- **No invented VR/AR completion contract**, no fabricated upload, no invented reminder channel, no
  fabricated analytics, no revenue metric.
- **Nothing outside `ui-ux/18-unified-functional-platform/` was modified.** The original FRD and the
  branding assets are untouched.
- **No commit, no push, no merge, no publish.**
