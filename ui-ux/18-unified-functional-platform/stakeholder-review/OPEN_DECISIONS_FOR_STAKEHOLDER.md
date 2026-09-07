# Open Decisions for the Stakeholder

| | |
|---|---|
| **Purpose** | The decisions that are **genuinely unresolved** in the current B2B build, and which we made a judgement on because no source settles them |
| **Build** | `ui-ux/18-unified-functional-platform/` · Implementation 07 closeout |
| **Why now** | Each of these is a **rule**. Changing a rule today is a change to the state layer. Changing it after Implementation 08 is a change to the state layer **and** to every screen that expresses it |
| **Sources audited** | `00-project-context/STAKEHOLDER_CONFIRMED_UPDATE_2026-08-31.md` (`STK31-01`…`48`, §C) · `17-stakeholder-correction-blueprint/` (all 18 documents, `ND-01`…`ND-16` and the standing `QD` / `QT` / `QP` / `QX` register) · this build's `README.md` judgement register (51 entries) and `B2B_FUNCTIONAL_CLOSURE_AUDIT.md` §7–§8 |

## How to read a row

| Field | Meaning |
|---|---|
| **Source status: CONFIRMED** | The stakeholder has settled it. Listed only where a *sub-question* underneath it is still open |
| **PARTIALLY CONFIRMED** | The capability, authority or requirement is confirmed; a specific mechanic inside it is not |
| **IMPLEMENTATION JUDGEMENT** | We chose a behaviour. It is recorded as a judgement in the code and labelled on screen. **Not** presented as policy |
| **NOT SPECIFIED** | No source addresses it at all |
| **Recommendation** | Ours, clearly labelled, offered only where it is genuinely useful. Every one is a suggestion, not a position we have taken |

> **Nothing already confirmed is reopened here.** The list of settled decisions we are deliberately
> **not** asking about is at the end — please glance at it, because if any of those is wrong, that
> matters far more than anything on this list.

---

# ✅ Answered since this list was written — 6 September 2026

Six decisions on this list, or adjacent to it, have since been **settled by the stakeholder** and
are **built**. They are recorded in full, with what changed for each, in
[`STAKEHOLDER_CORRECTIONS_07_2.md`](STAKEHOLDER_CORRECTIONS_07_2.md). In short:

| | Now settled | What it closes here |
|:--:|---|---|
| **A** | An institution may request the **same Experiment again for additional licences**, and the existing plan is shown when it reselects | New — see the new **D26** for the part that is still open |
| **B** | The **XR completion mechanism is undecided**; an API/event call has been discussed as the expected direction | New — recorded as **D25** below |
| **C** | Device requests route **Student → Institute / Tenant Admin → Super Admin**. The Tenant Admin is the institution's POC; the Super Admin remains the final decision maker | Changes the routing described in **D20**; D20(a) and (b) themselves stay open |
| **D** | A tenant **renews through the same payment route it was onboarded through** | Closes the `ND-11` sub-question inside **D19**; the channel in D19 stays open, and the new **D27** carries what is still undecided |
| **E** | The **canonical Course Code** is the **Content Manager's** primarily, with the **Super Admin** also holding access | Extends **D3**'s canonical-metadata half and **D24** |
| **F** | The **Super Admin has overall control**, content changes included | **Closes D4 in section A**, in the affirmative and wider than it was asked |

> Nothing above is back-dated. The rows below still describe what was true when this list was
> written, with an **Answered** line added where the answer has since arrived.

---

# The seven that most change what gets built next

If the meeting runs short, these are the ones to get answers to.

| | Question | Status |
|:--:|---|---|
| **D1** | On a **later version** of published content, should the **Content Manager** also be a gate — and is **academic re-review** required at all? | NOT SPECIFIED |
| **D2** | Should a later version be able to **change which technologies** an Experiment offers — and what then happens to an institution that already paid for one it drops, or does not hold one it adds? | NOT SPECIFIED |
| **D3** | **What consumes one licence?** We count one licence per active student per access record, however many experiments they receive | PARTIALLY CONFIRMED |
| **D4** | On the **external route**, is it right that **approval creates the institution** (so its admin can be appointed) while **payment activates its content**? | PARTIALLY CONFIRMED |
| **D5** | When an access term **expires** or an institution is **deactivated**, what happens to a **written answer already submitted and awaiting Faculty evaluation**? | NOT SPECIFIED |
| **D6** | What is the **BITS / Taxila default** for when a student sees their answers, explanations and result — and may Faculty override it? | PARTIALLY CONFIRMED (`ND-10`) |
| **D7** | The 15-day expiry reminder is required. **Through which channel, and to whom?** | CONFIRMED requirement · channel NOT SPECIFIED (`ND-16`) |

---

# A · Content production and release

## D1 · Later-version governance — who gates a new version?

| | |
|---|---|
| **Question** | When a Vendor proposes a **newer version of an already-published Experiment**, who must approve it before the Super Admin decides to release or hold it? Specifically: **must the Content Manager also pass it**, and **is academic re-review required for a later version at all**? |
| **Why it matters** | This is the single largest judgement in the build. It determines who is accountable for what reaches live content, how long a correction takes to ship, and whether a typo fix needs a full academic pass. It is a workflow question, not a screen question — the wrong answer means re-implementing a state machine |
| **Current prototype behaviour** | **Vendor proposes → Academic Reviewer approves → Super Admin releases or holds.** The Content Manager is **not** on this path. Recorded as a judgement at the head of `js/screens/content-version.js`, and the screens state whose decision it is rather than implying policy |
| **Source status** | **NOT SPECIFIED.** `STK31-07` confirms the Super Admin owns Release / Hold and names the path as *"current released version → newer **approved** version → Super Admin Release / Hold"* — but never says what produces that approval. `STK31-06` scopes the Content Manager to *"first approval/publication"* — the **first** instance. `STK31-08` gives the Vendor *"version submissions"* and the Academic Reviewer *"the academic review decision"* with no version qualifier |
| **Recommendation** | *Recommendation:* keep academic re-review, and add the Content Manager as a gate **only if** a later version can change canonical metadata. If a version is limited to delivery and description, the Content Manager's question has already been answered at first publication. Adding or removing a gate is a state transition — the record, the decision and the Super Admin's action are unchanged either way |

## D2 · Can a later version change the technology set?

| | |
|---|---|
| **Question** | Should a newer version be able to **add or remove a technology** (Web / VR / MR / AR)? If a version **drops** a technology, what happens to an institution that was approved and paid for it? If a version **adds** one, does an existing institution get it, or must it request it? |
| **Why it matters** | Either direction silently changes what an institution paid for. Dropping one revokes something purchased; adding one gives away something not purchased. It also touches student progress, which is tracked per technology |
| **Current prototype behaviour** | **A later version cannot change the technology set at all.** The version form carries no technology control and the release never writes the Experiment's technology list. Existing entitlement is left untouched *by construction*, and the screen states this as an open policy question in its own words |
| **Source status** | **NOT SPECIFIED.** No source states either the capability or the downstream consequence |
| **Recommendation** | *Recommendation:* treat a technology change as a **new request**, not a version side effect. It is a commercial change wearing a content change's clothes. If adding a technology must be possible without a full new request, the cheaper answer is an **amendment to the existing access record** (see **D8**) rather than making it a property of a version |

## D3 · Programme / Department and Course master records — create and retire?

| | |
|---|---|
| **Question** | **Retirement is the remaining half.** Create and rename are now built (see below); does the platform also need to **retire** a Programme / Department or a Course — and what should happen to the live references a retirement would orphan? |
| **Why it matters** | These identifiers are load-bearing: every access record, academic mapping, Faculty mapping and student assignment references them. Add the capability and it needs a rename/retire policy for live references. Leave it out and new academic structure requires a developer |
| **Current prototype behaviour** | **Partly built (Implementation 07.1), following this decision's own recommendation to scope create first.** `#/platform/structure` lets the Super Admin **create, rename and re-parent** a Programme / department and a Course; anything added works immediately in the Vendor's Course chooser, role governance, the tenant CSV mapping and the public catalogue, because the catalogue lookups resolve against platform state rather than a frozen array. **Retirement and deletion remain absent** and are still named as a gap on screen: *"Every id here is referenced by live access records, tenant course mappings, Faculty mappings and student assignments, and no source states what should happen to those references when a structure record retires."* A rename never changes an identifier, so no existing reference is disturbed. Canonical metadata **management** is built, on both the Content Manager's and the Super Admin's planes |
| **Source status** | **PARTIALLY CONFIRMED.** `STK31-10` confirms the structure is platform-controlled and `STK31-09` confirms canonical metadata may be managed by Content Manager **and** Super Admin — but no source describes a create or delete operation. `STK31-46` leaves *who maps an Experiment to a Course* as a **pending detail**, and `ND-02` leaves the final grouping terminology open |
| **Recommendation** | *Recommendation:* **create is now done.** What remains is a decision on **retire** — specifically the rule for live references: does retiring a Course hide it from new selection while leaving existing access, mappings and assignments intact, or must it be blocked while anything still references it? The prototype will not guess |

## D4 · May the Super Admin return a submission at the first-publication gate?

| | |
|---|---|
| **Question** | Can the Super Admin send a submission back at the **first-publication** gate, or does return authority sit only with the Academic Reviewer and the Content Manager? |
| **Why it matters** | It determines whether the Super Admin can intervene in content production, or only in release. Small question, clean answer, easy to add later |
| **Current prototype behaviour** | **Neither granted nor refused.** There is no Super Admin control at the publication gate, and none was removed. The Content Manager's request-changes path is unchanged |
| **Source status** | **NOT SPECIFIED** — recorded as `ND-13` (`QP-26`) and explicitly left open by the 31 August review |
| **Recommendation** | *Recommendation:* leave it out unless there is a real escalation need. It is an addition to an existing decision surface, not a restructure, so deferring costs nothing |
| **✅ ANSWERED — 6 Sep 2026** | **CONFIRMED, and wider than asked.** The Super Admin has *"overall control over all of it as of now"*, including content changes and Vendor / Academic Reviewer / Content Manager issues. **Built (07.2)** as an explicit, separately labelled override that **requires a reason**, names what it moves and who normally holds it, warns when a destination has no live actor, and writes one audited event on the record's own history. **PUBLISHED is refused as both origin and destination**, so first publication stays the Content Manager's act and Release / Hold stays the Super Admin's separate act on a different object — nothing un-publishes. Normal ownership is untouched: not one role gate was widened. Withdrawing a role scope and correcting a **published** canonical master record now both require a reason too |

## D5 · Question spreadsheet import — what is the column schema?

| | |
|---|---|
| **Question** | Faculty should be able to import questions from a spreadsheet. **What are the columns**, and how is a multiple-choice question's option list and answer key expressed in one? |
| **Why it matters** | This is a requirement we deliberately did **not** build — not for effort, but because building it means inventing a validation contract. A wrong schema fails real imports, or worse, imports rows that mean something different from what the author intended |
| **Current prototype behaviour** | Not built. The Question Bank **names the gap in its own words** and no control claims otherwise. Manual authoring and AI-assisted drafting both work |
| **Source status** | **CONFIRMED requirement, schema NOT SPECIFIED.** FRD 5.1.1 and `STK31-34` ask for it; nothing defines the columns |
| **Recommendation** | *Recommendation:* one sample spreadsheet from whoever will actually use it is worth more than a specification. It becomes buildable the moment the columns are confirmed |

---

# B · The institutional request, approval and access

## D6 · Institution creation vs access activation on the external route

| | |
|---|---|
| **Question** | On the external / subscription route, is this the intended behaviour: **approval creates the institution** — so it exists, is listed, and its Tenant Admin can be appointed — while **payment activates the approved content, technologies, licence quantity and term**? |
| **Why it matters** | It is the boundary the whole external onboarding sequence rests on, and it was **corrected during Implementation 07** after manual testing found the institution missing between approval and payment. Getting it wrong in either direction is serious: gate creation on payment and the Super Admin cannot appoint an administrator to an institution that does not exist; activate content at approval and an institution holds paid content it has not paid for |
| **Current prototype behaviour** | External approval **provisions the institution** — status active, listed in Institutions with an **Awaiting payment** badge and **None yet** in the access column, and its Tenant Admin is assignable immediately. It holds **no access record**, so nothing is assignable inside it, no student is entitled and no Faculty member reaches any content. A successful payment writes the access record onto that same institution; a declined or unconfirmed payment writes nothing. Every surface states the state in words. The internal route provisions **and** activates at approval, with no payment step anywhere |
| **Source status** | **PARTIALLY CONFIRMED.** `STK31-21` lists the Super Admin's acts as separate capabilities in this order — approves/authorises · **creates and governs the tenant** · **assigns the Tenant/Institute Admin** · decides which content and technologies the tenant receives — and blueprint `07 §2` carries the same three as separate confirmed stages. Blueprint `06 §3.3` shows payment gating step ⑨ **tenant access activation**, whose contents are only the allocated Courses and Experiments, the technologies, the quantity and the term. The confirmed constraint is stated as *"**ACCESS** is never granted before approval"* — a rule about **access**, not about whether the institution exists. **The separation is traced to confirmed sources but is never stated as a single explicit rule**, which is why we are asking |
| **Recommendation** | *Recommendation:* confirm as built. It is the only reading in which the Super Admin's own confirmed governance sequence is performable. Note we deliberately did **not** invent a new lifecycle status for it — `active` means only *"not deactivated by the Super Admin"*, and marking a brand-new institution `inactive` would have been the actual misstatement |

## D7 · What consumes one licence?

| | |
|---|---|
| **Question** | The approved quantity on a request is a number of **users / licences**. What consumes one? We read it as **one licence per active student per access record**, however many of that record's experiments they receive. And: should a **Faculty** member ever consume one? |
| **Why it matters** | It is the commercial unit. It determines what an institution is actually buying, what *Approved / Assigned / Remaining* means on every screen, and whether a Faculty member costs a seat |
| **Current prototype behaviour** | **One licence = one unique active student per access record.** Assigning a second experiment from the same record to the same student consumes nothing further — the screen says *"A student counts once against this record however many of its experiments they receive."* **Faculty mapping consumes no student licence**, and the mapping screen states so. A **deactivated** student releases their licence; a **reactivated** student re-enters the queue at the back and, if beyond the quantity, is shown as **Held — allocation full** rather than silently entitled. There is no platform-wide cap |
| **Source status** | **PARTIALLY CONFIRMED.** `STK31-27` confirms the quantity comes from the request and forbids a universal cap, and names the trio *Approved / Assigned students / Remaining allocation* — but specifies **no counting algorithm**. Counting entitled students is the only reading in which that trio means anything. Faculty consumption, deactivation release and reactivation ordering are all our judgements |
| **Recommendation** | *Recommendation:* confirm as built, including that Faculty do not consume a seat. If Faculty should consume one, that is one function — but it changes the commercial conversation with every institution |

## D8 · Amending an approved access record

| | |
|---|---|
| **Question** | Once an institution's access is active, can it be **amended** — more licences, a longer term, an extra technology — or must every change be a **new request**? |
| **Why it matters** | It is the most likely real-world operational request after go-live ("we've added thirty students mid-semester"). Today the answer is always a new request, which is defensible but may not match how the business actually wants to work |
| **Current prototype behaviour** | **No amendment operation exists.** A grant may only ever **narrow** the request it came from: `validateGrant()` refuses an experiment not on the request, a technology not requested, a quantity above the requested one and a term longer than requested. A wider allocation must come from a new request. There is no renewal or extension mechanism of any kind |
| **Source status** | **IMPLEMENTATION JUDGEMENT.** `STK31-24` confirms the Super Admin controls what a tenant receives but describes **no amendment operation**. Narrowing is the conservative reading; widening would hand an institution content it never asked for. `ND-11` leaves automatic-vs-manual **renewal** open separately |
| **Recommendation** | *Recommendation:* keep narrow-only for the approval decision itself — it is the right discipline at a decision gate. If amendment is needed, make it a **separate, explicitly recorded operation** on the access record rather than loosening the grant rule, so the audit trail still shows what was requested and what was approved |

## D9 · The internal vs external classification rule

| | |
|---|---|
| **Question** | What decides whether an institution follows the **internal / BITS Community** route (no payment) or the **external / Subscription** route (payment required)? Is it the Super Admin's decision at approval, or a rule the platform applies? |
| **Why it matters** | It decides who pays. An anonymous visitor must never be able to self-select the free route, and today they cannot — but only because the classification is seeded rather than chosen |
| **Current prototype behaviour** | Both branches are fully built and behave correctly. The classification comes from the **seeded requester scenario**, and the request form carries a visible **PROTOTYPE ONLY** note saying the production rule is not confirmed and not implemented. The request detail shows it as *"Internal (prototype seed)"* |
| **Source status** | **PARTIALLY CONFIRMED** — `ND-07`. Both branches are confirmed to exist (`STK31-19`, `STK31-23`); the rule that selects one is open |
| **Recommendation** | *Recommendation:* make it a **property of the approved request, set by the Super Admin at approval** — which is what the build is already shaped for. A later automatic rule then becomes the default value of a field that already exists, rather than a restructure. Please confirm the Super Admin decides it, not the applicant |

## D10 · Rejecting a request

| | |
|---|---|
| **Question** | Should the Super Admin be able to **refuse an institutional request outright**? Today the two confirmed outcomes exist — approve, and request more information — and there is no terminal refusal |
| **Why it matters** | Without it, an unwanted request sits open indefinitely. With it, we need to define what the applicant is told and whether a refusal can be reversed |
| **Current prototype behaviour** | **No reject outcome.** Approve and *Request more information* are both built, each with a required reason shown to the applicant, and the applicant can reply and resubmit. The screen **states the absence** in its own words rather than showing a disabled control |
| **Source status** | **NOT SPECIFIED.** `STK31-20` names approval and more-information; no source defines a refusal state |
| **Recommendation** | *Recommendation:* if a refusal is wanted, define it as **reversible** (consistent with `STK31-22`'s preference throughout the platform) with a required reason the applicant sees — rather than a terminal state, which is the one shape that would be hard to undo |

## D11 · CSV import — is Plan Terms mandatory, and can it override the approved record?

| | |
|---|---|
| **Question** | In the bulk student import, is **Plan Terms / Access Context** a mandatory column? And may a value in that column ever change what a student actually gets, relative to the institution's approved access record? |
| **Why it matters** | A mandatory-field list is a validation contract. Guessing it wrong fails real institutional imports; guessing it wrong *silently* imports rows that mean the wrong thing |
| **Current prototype behaviour** | Required: **Programme · Course Name · Course ID/Code · Student ID · Student Name · Email**. Everything else — including **Semester**, **Organisation** and **Plan Terms** — is optional and a blank value imports cleanly. Plan Terms **never** overrides the approved access record: entitlement comes only from a Tenant Admin assignment inside the approved set. Commit is **all-or-nothing**, with a per-row error report produced either way |
| **Source status** | **PARTIALLY CONFIRMED.** `STK31-26` lists the accepted columns and confirms **Semester is optional, never mandatory** (`STK31-11`). `ND-03` leaves **Plan Terms** mandatory-vs-optional explicitly pending — the stakeholder said *"if possible"* |
| **Recommendation** | *Recommendation:* keep it optional and surface a missing value as an attention row. Promoting optional → mandatory later is a validation change; demoting mandatory → optional after a failed import is a data-recovery problem |

## D12 · CSV and ERP describing the same person differently

| | |
|---|---|
| **Question** | When ERP and a CSV import (or a manual edit) disagree about the same person, which wins — and what should the Tenant Admin see? |
| **Why it matters** | Flagged in the sources as the most consequential of the pending details. ERP is authoritative and scheduled sync overwrites, so adding manual and CSV routes makes this conflict **real and reachable** rather than theoretical |
| **Current prototype behaviour** | **Not reachable in this build**, because ERP is not a provisioning route here — there is no backend of any kind. The person record carries a `source` provenance field left open for one. Nothing silently overwrites anything |
| **Source status** | **NOT SPECIFIED** — `ND-04` / `QD-01`. Confirmed as a real conflict; the precedence rule is open |
| **Recommendation** | *Recommendation:* not blocking for this phase, and not answerable without the ERP integration in front of us. Worth confirming the **principle** now — never silently overwrite; show per-person provenance and require an explicit reversible resolution — so whichever precedence rule is chosen later becomes the default of a mechanism that already exists |

---

# C · Faculty, assessment and the learner

## D13 · The BITS / Taxila default for releasing answers and results

| | |
|---|---|
| **Question** | Faculty choose when a student sees their answers, explanations and result: **immediately**, **after the deadline**, or **on a date they set**. What should the **institutional default** be — and may Faculty override it? |
| **Why it matters** | It is the setting students notice most. A wrong default is visible to every learner on day one, and *"may Faculty override it"* is the difference between a default and a policy |
| **Current prototype behaviour** | All three options are built and drive the student's screens live. The seeded samples deliberately carry **three different values** so none can be mistaken for a rule, and the choice is labelled as a prototype sample. Withholding is thorough: while a result is withheld, **no figure of any kind** reaches the student — not the combined score, not the objective sub-score — and the retry control waits too, because offering or withdrawing it would announce the result |
| **Source status** | **PARTIALLY CONFIRMED** — `ND-10`. `STK31-32` confirms the option set and that visibility is Faculty-controlled. The BITS default is a Taxila reference we were asked **not** to invent, and whether a platform-level default exists at all is open |
| **Recommendation** | *Recommendation:* if Taxila's behaviour is known to anyone, that is the answer. Otherwise pick a default now and make it overridable — it is a configuration value, so changing it later changes data, not screens |

## D14 · AI-assisted review — how far should the assist go?

| | |
|---|---|
| **Question** | For a written answer, what should AI assistance actually do — suggest marks, draft feedback, both, or something narrower? And should the assist be **on by default**, off by default, or a Faculty preference? |
| **Why it matters** | The hard boundary is already confirmed and enforced. What is open is how useful the assist is allowed to be before it starts to feel like the decision |
| **Current prototype behaviour** | A local, deterministic suggestion (no network, no AI provider) offering suggested marks and draft feedback with a *"Why this was suggested"* list of observations. It is a **Faculty preference**, defaulting to **Manual**. Generating a suggestion leaves the review pending, the marks null, the reviewer null and the student's outcome pending; generating a second is still not a decision. Whether a suggestion was used is recorded as an audit trail, never as an author. `finaliseReview` is the only writer of a result. **This is covered by automated assertions, and a mutation test confirms they are load-bearing — making AI auto-finalise a review fails 10 assertions** |
| **Source status** | **CONFIRMED boundary, mechanics NOT SPECIFIED** — `ND-09`. `STK31-31` makes Faculty the only human evaluator and forbids an AI score ever being automatically final. The mechanics of the assist are explicitly left as an implementation detail |
| **Recommendation** | *Recommendation:* confirm the boundary as built (it is the part that could strand a learner) and treat the assist's depth as a Phase-2 refinement with real Faculty in the room |

## D15 · In-flight learning at expiry and deactivation

| | |
|---|---|
| **Question** | When an access term **ends**, or an institution or student is **deactivated**, what should happen to work already underway — specifically **a written answer already submitted and awaiting Faculty evaluation**? |
| **Why it matters** | This is the one open item that can leave a **learner permanently pending through no act of their own**. The student has submitted; the evaluation is somebody else's to complete; and if access stops first, nothing can complete it |
| **Current prototype behaviour** | Records are **preserved** and access stops. Nothing is deleted, and restoring access restores everything exactly. But a submitted answer can be left pending indefinitely. The related risk of a mapping removal stranding a review **is** now handled: `pendingReviewsWithoutEvaluator()` surfaces it, the unmap dialog states the consequence before the act, and the Tenant Admin overview carries an attention row |
| **Source status** | **NOT SPECIFIED.** `STK31-22` prefers reversible deactivation and confirms records are preserved; no source addresses in-flight academic work |
| **Recommendation** | *Recommendation:* allow **evaluation to complete** after expiry — a read-only grace on the review queue alone. It closes the loop for the student, changes no entitlement and grants no new access. The alternative (finalising on objective marks alone) silently marks a student on part of their work |

## D16 · Re-grading a confirmed descriptive review

| | |
|---|---|
| **Question** | May a Faculty member **revise a confirmed mark** on a written answer — and who would authorise that? |
| **Why it matters** | Marks get entered wrongly. Without a correction path the only remedy is a data fix. With one, we need to define who may do it and what the student sees |
| **Current prototype behaviour** | **A confirmed review is read-only and cannot be reopened.** The review screen names this as a prototype limitation where the control would otherwise be, rather than hiding it |
| **Source status** | **NOT SPECIFIED.** No source establishes a re-grading workflow or an authoriser |
| **Recommendation** | *Recommendation:* if it is wanted, the smallest safe shape is a **correction that supersedes** rather than an edit that overwrites — the original mark, the correction and who made it all stay visible. Please confirm whether Faculty may do it alone |

## D17 · The completion rule

| | |
|---|---|
| **Question** | What makes an Experiment **complete** for a student who holds it in more than one technology? |
| **Why it matters** | It is the number an institution will read as an outcome. Today it is deliberately the most conservative reading available, and it is labelled as such on screen — but it is our rule, not a policy |
| **Current prototype behaviour** | Complete = **every learning resource marked done · the simulation completed for *every* technology the student is entitled to · the assessment passed** where one is configured. A result pending Faculty review is never counted as complete. Labelled **PROTOTYPE-DERIVED** on the Progress and Faculty screens, with the rule stated in full. It affects **only** the progress roll-up — never entitlement, licence consumption or access validity |
| **Source status** | **PARTIALLY CONFIRMED.** `STK31-36` requires progress to be expressible **per assigned technology** and forbids three technologies collapsing into one ambiguous state — but names **no roll-up formula** |
| **Recommendation** | *Recommendation:* confirm or replace. The conservative reading is the only one that cannot overstate completion, which is the right default for a number that leaves the building — but if one technology is enough, that is a one-function change |

## D18 · Institution-wide reporting — who should see what?

| | |
|---|---|
| **Question** | Should the **institution** get a view of completion, assessment outcomes, usage and time spent across all its students — and if so, who inside the institution sees it? |
| **Why it matters** | It is the most likely gap an institutional buyer will notice. It is also the one most likely to cross a privacy line if built without a decision |
| **Current prototype behaviour** | **Not built on the tenant plane**, and the Tenant Admin overview **declares the absence** rather than leaving it to be discovered. A Faculty member sees progress and results for **their own mapped content**; the platform sees institution-level usage indicators on the Super Admin's institution report (usage and completion, students by stream). **No revenue metric anywhere** — that is prohibited outright |
| **Source status** | **PARTIALLY CONFIRMED.** `STK31-42` confirms the Super Admin's institution report contents (usage / completion indicators, students by stream) and `STK31-43` addresses Faculty / tenant reporting — but who at the **institution** should see aggregate learner outcomes, and in what form, is not settled. `STK31-29` / PM-11 prohibit invented dashboards, indexes, scores, ranks, predictions and attendance |
| **Recommendation** | *Recommendation:* answer the audience question before the metric question. *"Which named person at the institution needs which decision made easier"* is answerable; *"what should the dashboard show"* is not |

---

# D · Operations

## D19 · The 15-day expiry reminder — channel and recipient

| | |
|---|---|
| **Question** | The reminder to a tenant 15 days before the access term ends is required. **How should it reach them** — email, in-product, both, something else? And **who receives it**: the Tenant Admin, the SPOC named on the original request, or both? |
| **Why it matters** | It is a confirmed requirement the build cannot honour, because sending anything means choosing a channel and a provider. It also decides whether a *person* or a *screen* is the delivery target, which is an integration question, not a UI one |
| **Current prototype behaviour** | The **due state** is derived and shown on both the Super Admin's Operations screen and the tenant's own workspace, with the states *Active / Expiring soon / Expired*. Every surface says plainly that **nothing was sent**, and the screen carries an explicit **DELIVERY CHANNEL PENDING** note: *"No email, SMS, push or notification of any kind has been sent, and no provider is integrated. There is no automatic renewal, payment or extension."* Because the shortest term is Monthly, the 15-day state cannot be reached by using the product, so there is a clearly-labelled prototype-only control that moves one record's end date |
| **Source status** | **CONFIRMED requirement, channel NOT SPECIFIED** — `ND-16`. `STK31-28` states it directly: *"We will send reminders to Tenants 15 days ahead."* The in-product attention row is recommended supporting UX and **explicitly does not discharge the requirement** |
| **Recommendation** | *Recommendation:* confirm the recipient now even if the channel waits — the recipient is a product decision and the channel is an integration one |
| **✅ PARTLY ANSWERED — 6 Sep 2026** | The **renewal** half (`ND-11`) is settled: *"Tenant should go through same payment method which he follows in initial onboarding."* **Built (07.2)** — a renewal is an ordinary request that follows the **institution's own original route**, derived from the institution and never from the prototype scenario selector: a Subscription institution through the same payment step it was onboarded through, a BITS Community institution through its no-payment route. Requesting a renewal extends nothing; only activation does, and it extends the **existing** access record rather than creating a second one, so no assignment or entitlement is stranded. There is still **no auto-renewal and no direct extension writer anywhere**. **The channel and recipient remain OPEN** — nothing renewal-related claims a reminder, invoice or confirmation was sent |

## D20 · Device transfer — declining a request, and how deep device identity goes

| | |
|---|---|
| **Question** | Two parts. **(a)** Should the Super Admin be able to **decline** a device replacement request — and if so, on what grounds, and what must the student be told? **(b)** Does the platform need a real **device registry** — registering hardware, naming models, certifying compatibility — or is approving a transfer enough? |
| **Why it matters** | (a) The confirmed flow is request → approve, with no rejection behaviour, so a request could otherwise sit open forever. (b) A registry is a substantial capability with its own lifecycle, and building it speculatively would be expensive |
| **Current prototype behaviour** | **(a)** A **Decline** path exists, requires a reason the student sees, and is **labelled on screen as an implementation judgement** rather than a confirmed capability. **(b)** No registry: *"The platform holds a device transfer approval with no device registry behind it — the binding is a relationship, not an administrable record. Nothing here registers hardware, names a model, or certifies compatibility."* Device compatibility is **described, not certified**, and no specific headset, handset or browser build is claimed as supported. A transfer decision moves the device authorisation and **nothing else** — no licence, experiment, technology or assessment state |
| **Source status** | **(a) NOT SPECIFIED** — `STK31-38` confirms device licensing and transfer with no rejection behaviour. **(b) PARTIALLY CONFIRMED** — `STK31-37` refines XR **packaging**, not the delivery mechanism; `QT-01` (delivery mechanism) is open **by explicit instruction** and was not to be resolved during UI/UX |
| **Recommendation** | *Recommendation:* confirm decline is in scope (it prevents an open request with no resolution) and keep the registry out of Phase 1 until the delivery mechanism itself is chosen. Building a registry against an unchosen mechanism is the definition of premature |
| **⚠ THE ROUTING CHANGED — 6 Sep 2026** | Both questions above **stay open**, but the flow they sit inside has been corrected: *"Any request from institution should come through Tenant Admin. He will be our POC to facilitate and final approval comes to Super Admin."* **Built (07.2)** — a Student's request now reaches the institution's own **Institute / Tenant Admin** first, who reviews and forwards it; only a forwarded request is the Super Admin's to decide, and the Super Admin remains the **final** decision maker. The outcome is visible to the Student **and** the Tenant Admin. Forwarding writes the request and nothing else — no licence, Experiment, technology, assignment or assessment state — and **no device registry was introduced**: the forwarding note is plain free text, and there is still no serial number, model validation, MDM, certification or authentication step anywhere. Two honest edges are surfaced rather than papered over: a **deactivated** institution cannot forward (and loses nothing), and an institution with **no assigned Tenant Admin** genuinely cannot perform the step — no actor is fabricated to get past it. **Nothing is sent to anybody**; the state is surfaced in product only |

## D21 · Support — status only, or more?

| | |
|---|---|
| **Question** | Support currently tracks **status only**. Is that sufficient for Phase 1, or does it need priority, severity, response-time commitments or an external ticketing integration? |
| **Why it matters** | An SLA model was explicitly prohibited from being invented. Confirming *"status only is correct for now"* closes it; wanting more makes it a real piece of scope |
| **Current prototype behaviour** | Anyone — Student, Faculty, Tenant Admin or a content role — reports a technical issue from the Help destination in their own workspace and sees the state of their own report. The Super Admin resolves it with a required reason the reporter sees. **No SLA clock, no priority, no severity formula, no escalation path, no external provider, no chatbot, and no notification to anybody.** A support ticket changes no entitlement, licence or assignment — and a **deactivated** institution can still report an issue, deliberately, because *"our access stopped working"* is exactly the report someone needs to be able to file |
| **Source status** | **CONFIRMED capability, model NOT SPECIFIED** — `ND-14`. `STK31-39` requires Help/support; the SLA and priority model is explicitly prohibited from invention |
| **Recommendation** | *Recommendation:* confirm status-only for Phase 1. Priority is a new field on an existing record whenever it is wanted |

---

# E · Terminology and labels

## D22 · Institute Admin or Tenant Admin?

| | |
|---|---|
| **Question** | What is the **product-facing** name of the institution's administrator role? |
| **Why it matters** | It appears on navigation, headings, dialogs and every piece of guidance copy. It is a one-line change if it stays in one place, and a rename across dozens of screens if it does not |
| **Current prototype behaviour** | The **role identity is settled** — they are one role. The build carries **Tenant Admin** on the workspace and *Institute Admin / Tenant Admin* where both are useful |
| **Source status** | **CONFIRMED role, label PARTIALLY CONFIRMED** — `ND-01`. `STK31-02` settles that they are the same role; only the word is open |
| **Recommendation** | *Recommendation:* pick the word the institution's own staff would use. Nothing structural depends on it, and it should be decided **before** the visual design fixes it into layouts |

## D23 · Programme / Department / Academic Stream — the final word for one level

| | |
|---|---|
| **Question** | What should the grouping level **above Course** be called, and does it ever need an internal sub-level? |
| **Why it matters** | It appears on the public catalogue, every breadcrumb, the CSV column header and the canonical governance screens. It is also the most stakeholder-visible word in the product |
| **Current prototype behaviour** | Modelled as **one** terminology-neutral grouping level between the catalogue root and Course, labelled *Programme / Department*. Nothing depends on Programme and Academic Stream being separate records |
| **Source status** | **CONFIRMED structure, label PARTIALLY CONFIRMED** — `ND-02`. `STK31-12` / `STK31-10` settle that it is **one** grouping level, platform-controlled, and that the tenant cannot redefine it |
| **Recommendation** | *Recommendation:* settle the word now. If a genuine sub-level is later needed it is an addition to a level that already exists, not a restructure — but the **word** is expensive to change after the design pass |

## D24 · Canonical metadata — which fields?

| | |
|---|---|
| **Question** | What is the **field list** for an Experiment's canonical metadata? |
| **Why it matters** | Ownership is settled; the schema is not. No FRD source enumerates one |
| **Current prototype behaviour** | Metadata is a **field-set container**, not a fixed form: Programme/Department, Course, catalogue summary, description, technologies, version. Fields are labelled as samples, so adding or renaming one does not move the control |
| **Source status** | **CONFIRMED ownership, schema NOT SPECIFIED** — `ND-05` / `QD-07`. `STK31-09` settles who manages it |
| **Recommendation** | *Recommendation:* low priority for this meeting. Worth raising only if the stakeholder names a field they expect to see and cannot find |

---

# F · Opened by the 6 September 2026 answers

Three questions that did not exist before the latest answers, because each one sits *underneath* a
decision the stakeholder has now settled. **The build fails safe on all three** — it neither blocks
nor assumes, and each is labelled on the screen where it matters.

## D25 · The XR completion contract — what does the runtime actually send?

| | |
|---|---|
| **Question** | A finished XR run has to be confirmed back to the platform. **What is the contract?** Which side initiates, what identifies the run (student, experiment, technology, attempt), what is sent about completion and time spent, and what happens when the call fails or arrives twice? |
| **Why it matters** | This is the join between the platform and the XR runtime, and it decides what a completion figure on a Student's Progress screen actually *means*. It is also the last unbuilt piece of the learning journey — everything downstream of it (progress roll-up, institution reporting, Faculty's view of who has done what) is already built and already reads it |
| **Current prototype behaviour** | The Student records their own completion, and **it is labelled as a stand-in in every state, including after a completion has been recorded** — the note says the mechanism is not settled, that an API/event call has been discussed and is the expected direction, and that no contract, endpoint, payload or provider is chosen or built. **No API client, stub or provider exists anywhere in the build.** The three sentences that previously read as though the contract were settled have been corrected. The same caveat appears beside the Progress roll-up |
| **Source status** | **CONFIRMED as undecided** — 6 Sep 2026: *"This is yet to be decided. We have discussed an API-call method to communicate and confirm."* Distinct from `D20(b)`, which is the **delivery** mechanism, and from `D17`, which is the completion **roll-up** rule |
| **Recommendation** | *Recommendation:* nothing needs deciding for the visual design pass — no screen changes shape either way. It becomes blocking at integration, and the cheapest thing to settle first is **what identifies a run**, because that is the only part with a bearing on what the platform must already be storing |

## D26 · Expansion scope — may a re-request also widen the plan?

| | |
|---|---|
| **Question** | An institution may now request an Experiment it already holds, for **additional licences** — that is settled. May the same expansion request also **add a technology variant it does not currently hold** (say it holds Web and wants VR), or **change the access term**? |
| **Why it matters** | It is the difference between "an expansion is a licence top-up" and "an expansion is a way to renegotiate the plan". It also decides what the Super Admin is approving: today a grant may only ever *narrow* what was asked for, and a widening expansion is a different commercial conversation |
| **Current prototype behaviour** | **Neither blocked nor assumed.** The technology picker behaves exactly as it always has — every published technology stays selectable, including ones the institution does not hold — and nothing forces or forbids it. The request form carries an **EXPANSION SCOPE NOT SETTLED** note saying so in plain words. Downstream, two records carrying the same Experiment already resolve correctly: technologies are unioned for the Student, and licences are summed as an allocation figure |
| **Source status** | **NOT SPECIFIED.** 6 Sep 2026 confirms additional licences and confirms the existing plan must be visible on reselect; it says nothing about technologies or term |
| **Recommendation** | *Recommendation:* cheap to settle and worth settling, because the answer decides whether an expansion needs its own request shape or is simply an ordinary request. If in doubt, allowing it costs nothing — the build already handles two records with different technology sets correctly |

## D27 · Renewal — may the plan change on the way through?

| | |
|---|---|
| **Question** | A renewal follows the institution's original payment route — that is settled. May a renewal **change the licence count, the technologies or the term length**, or must it mirror the expiring plan exactly? |
| **Why it matters** | If a renewal can change the plan, it needs a form, a grant comparison and a rule for what happens to students already assigned under the old figures. If it must mirror, it needs none of that, and any change is an ordinary institutional request instead |
| **Current prototype behaviour** | **Mirrors the current plan exactly** — the same experiments, technologies, licence quantity and term length, copied from the expiring record and **not editable anywhere**. The institution's own Content access screen carries a **RENEWAL PLAN CHANGES NOT SETTLED** note and the Super Admin's Operations screen a **RENEWAL PLAN CHANGES NOT DECIDED** one, each saying that this is because the question is open and not because mirroring was chosen as policy; the Super Admin's decision screen states it too, in place of the narrowing control an ordinary request carries. `approveRequest` **refuses** a narrowed grant on a renewal outright, so the position is enforced and not merely described. More licences or different content reach an institution through an ordinary institutional access request |
| **Source status** | **NOT SPECIFIED.** 6 Sep 2026 settles the *route* — *"Tenant should go through same payment method which he follows in initial onboarding"* — and says nothing about the *contents* |
| **Recommendation** | *Recommendation:* mirroring is the safe default and is what is built. Worth confirming only if institutions are expected to routinely resize at renewal, in which case it is better modelled as an expansion **plus** a renewal than as one editable form |

---

# Deliberately NOT reopened

These are **settled**. We are not asking about them, and we have implemented them as stated. Listed
so nobody spends meeting time on them — but if any of these is wrong, say so, because it matters
more than everything above.

| Settled | By |
|---|---|
| **Seven formal roles**; Student and Learner are **one** role | `STK31-01` |
| Institute Admin and Tenant Admin are **one** role | `STK31-02` |
| Internal content teams operate **through the Vendor role** | `STK31-03` |
| **B2B is the delivery priority**; B2C is deferred and preserved, not deleted | `STK31-04` |
| **First publication of a new Experiment is the Content Manager's** | `STK31-06` |
| **Release / hold of a later version is the Super Admin's** | `STK31-07` |
| **Learning Outcomes belong to the Academic Reviewer** | `STK31-08` |
| Canonical metadata may be managed by Content Manager **and** Super Admin | `STK31-09` |
| Academic structure is **platform-controlled**; the tenant cannot redefine the canonical catalogue | `STK31-10` |
| **Semester is optional, never mandatory** | `STK31-11` |
| One grouping level above Course; `Programme` and `Academic Stream` need **not** be separate records | `STK31-12`, `STK31-10` |
| The old "Bundle = exactly three arbitrary modules" model is **superseded** | `STK31-13` |
| **Experiment** is the canonical planning term | `STK31-14` |
| **Technology is selectable and separately licensable** | `STK31-15` |
| **Public discovery before sign-in is required** | `STK31-16` |
| What a public Experiment page may show | `STK31-17` |
| **The B2B cart does not check out** — it is a selection basket and request preparation | `STK31-18` |
| The internal / collaborator route **may skip payment** | `STK31-19` |
| External route: **no access before approval**; Super Admin approves in-product with a required reason and a history trail | `STK31-20` |
| Super Admin owns tenant creation, approval, governance and termination, **and assigns the Tenant Admin** | `STK31-21` |
| **Prefer reversible deactivation over destruction** | `STK31-22` |
| A campus or unit **may be its own tenant** | `STK31-23` |
| **Super Admin controls the tenant's content and technology allocation** | `STK31-24` |
| **Tenant Admin assigns content to learners and groups**, and may deactivate a student (Super Admin may also, as an override) | `STK31-25` |
| Bulk CSV provisioning fields and the accepted column set | `STK31-26` |
| Licence quantity comes from the request; **there is no universal cap** | `STK31-27` |
| An access **term** exists, and the **15-day expiry reminder is REQUIRED** (only the channel is pending) | `STK31-28` |
| Faculty workspace scope; **no invented dashboards, indexes, scores, ranks or attendance** | `STK31-29` |
| **Faculty owns assessment configuration** | `STK31-30` |
| **Faculty is the only human evaluator of a descriptive answer**; an AI score is never automatically final | `STK31-31` |
| Answer / explanation visibility is Faculty-controlled, with three options | `STK31-32` |
| AI-assisted question generation takes source material | `STK31-33` |
| Question Bank action is **`Delete`** — not *Retire*, not *Archive* | `STK31-34` |
| Progress must be expressible **per assigned technology** | `STK31-36` |
| XR and Web delivery model, and packaging | `STK31-37` |
| Device licensing and **transfer** exist | `STK31-38` |
| **Help / support is required** | `STK31-39` |
| Platform role assignment may be **Course- or Experiment-specific** | `STK31-41` |
| Super Admin institution reporting contents; **no revenue metric** | `STK31-40`, `STK31-42` |
| SSO with a platform-authentication fallback (out of scope for this prototype) | `STK31-44` |
| **MR is retained** | `STK31-45` |
| Experiments map to Courses | `STK31-46` |
| One unified product built from the complete journey | `STK31-47` |
| Historical prototypes preserved unchanged | `STK31-48` |
| **Certification does not return to Phase 1** | PM-12 |
| Pricing, payment provider and billing mechanics are **Phase 2** | `ND-08`, `ND-12`, FRD 9.3.2 |

---

## What we need from this session

**Answers to D1–D7.** Those seven change what gets built. The rest can be answered in writing
afterwards without holding anything up.

**A yes or no on this:** *is the functional B2B operating model correct enough to design against?*
If a workflow, an ownership boundary or a business rule is wrong, we would much rather re-implement
it now, against unstyled screens, than after the visual design has been built on top of it.
