# B2B Functional Closure Audit — Implementation 07

**Purpose.** Audit the complete current B2B product against the authoritative sources, close the
genuine gaps, and establish whether the platform is stable and honest enough for a **functional
review with the PM and the key stakeholder** — before the final visual-design phase begins.

| | |
|---|---|
| **Scope** | `ui-ux/18-unified-functional-platform/` only. Nothing outside it was read for authority and nothing outside it was modified |
| **Type** | Requirement-coverage audit · cross-role integration closure · gap fix · adversarial review |
| **Not** | A redesign · a new feature slice · B2C · the final visual pass (that is Implementation 08) |
| **Baseline** | Implementation 06 — 429 deterministic assertions, 0 failures |
| **After 07** | **685 deterministic assertions, 0 failures**. No assertion was weakened or removed |
| **Schema** | `xrslp-unified-v1`, `schemaVersion: 8` — **unchanged**. No migration was written and none was needed |

---

## 1 · Method and source coverage

Every requirement claim in this document traces to one of the following, in this precedence order.
Where two sources conflicted, the higher one won and the conflict is recorded rather than
reconciled away.

| # | Source | How it was used |
|---|---|---|
| 1 | `00-project-context/STAKEHOLDER_CONFIRMED_UPDATE_2026-08-31.md` | Read in full. `STK31-01`…`STK31-48`, every explicit prohibition, and §C's unresolved details |
| 2 | `17-stakeholder-correction-blueprint/` | All 18 documents read in full. `14_UNIFIED_SCREEN_REQUIREMENTS` was used as the primary coverage checklist; `16_REMAINING_NONBLOCKING_DETAILS` as the unresolved register |
| 3 | Behaviour already implemented and manually validated in `18/` | Treated as confirmed where it was not contradicted above |
| 4 | `requirements/updated-frd/` | `Platform_FRD_v5_CHANGE_SUMMARY` and `_OPEN_QUESTIONS` read in full |
| 5 | `15-post-pm-alignment/` | `10_PHASE1_GAP_INVENTORY_PRE_MONDAY` and the decision-extraction draft |
| 6 | `16-unified-product-planning/` | Screen inventory, state/data convergence map, terminology audit |
| 7 | Batches 01–05 | Reference only. Nothing was resurrected from them |

**Audit shape.** A read-only requirement and integration audit over sixteen dimensions — the seven
roles, the ten end-to-end journeys, the state and entitlement model, authority and deep-link
boundaries, terminology and internal-copy leakage, empty and error states, and structural
accessibility. **117 candidate findings** were produced. Every one was then put to an independent
adversarial verifier whose default posture was that the finding was wrong and whose instruction was
to refute it against the actual code. **97 survived; 20 were refuted or downgraded.**

**The 20 refutations mattered.** Both findings originally reported as `P0` were refuted at that
severity — the guards they claimed were missing existed at a layer the reporter had not read. There
was **no P0 in the build**, and none was invented to make the audit look productive.

---

## 2 · Requirement ledger — summary

| Classification | Count | Note |
|---|---:|---|
| **CONFIRMED + IMPLEMENTED** | the large majority | Verified against the route or state function that proves it, not against the documentation |
| **CONFIRMED + PARTIALLY IMPLEMENTED** | 9 | All closed in this implementation — §4 |
| **CONFIRMED + MISSING** | 4 | All closed in this implementation — §4 |
| **IMPLEMENTATION JUDGEMENT** | 12 carried forward, 3 added | §7. Each is recorded as a judgement, not promoted to policy |
| **UNRESOLVED** | 75 raw → **8 consolidated** | §8. Not implemented. Documented for the stakeholder |
| **DEFERRED** | B2C, Phase 2/3, final design | §9 and §10 |

**A real gap had to be one of:** required functionality absent · required authority incorrect ·
required data not connected · one role unable to hand off to the next · contradictory business
state · terminology with business implications · a missing critical error or empty state · a broken
deep link or security boundary · a screen claiming something the product does not do. *"Another
design would be nicer"* was not accepted as a gap by any reviewer.

---

## 3 · P0 gaps found

**None.**

Two findings were reported as `P0` and both were refuted at that severity by independent
verification:

| Reported | Verdict |
|---|---|
| *"Tenant Admin workspace is fully writable for a tenant that has no assigned Tenant Admin"* | **Downgraded to P1, then found to be by design.** A tenant with no assigned admin is surfaced as a Super Admin attention row and is never silently administered by another tenant's admin — which `actingTenantAdmin()` refuses explicitly and `qa/checks.js` already asserted. The prototype has no authentication at all (`U-AUTH-01/06`, deferred), so "who is acting" is a scenario switch, and the workspace being reachable is the prototype's stated behaviour rather than an access leak |
| *"Two institutions can be given the same tenant id, merging them into one tenant"* | **Real, but P1 not P0** — it needed two institutions whose different names slug identically, and it was fixed (§4.3). It was never reachable from the seeded data a review would use |

---

## 4 · P1 gaps found, and exactly what was done

All twenty-two confirmed `P1` findings resolved into the eleven distinct defects below. **Every one
that the sources settle has been fixed. One was not fixed, deliberately, and is recorded as
unresolved instead** (§4.11).

### 4.1 · The Super Admin decision surface was one outcome short, and recorded no reason
**Source:** `STK31-20` — *"SUPER ADMIN review / approval — approve · request more information ·
REASON REQUIRED · HISTORY TRAIL"*; `U-SA-05` (marked **P0, NEW**); blueprint `06 §3.1 ⑦` and `07 §2`.

**Was:** one control, `Approve request`. No reason field anywhere. `approveRequest(id)` took a
single argument and pushed a fixed history string. The screen's own gap note admitted the outcome
was missing — which made it honest, but still missing.

**Now:** a decision surface with both confirmed outcomes and a **required reason on either**.
`STATUS.INFO_REQUESTED` was added; `requestMoreInformation(id, reason)` returns the request to the
applicant without approving or refusing it; `resubmitRequest(id, note)` is the applicant's way back
into the queue, on their own status screen, with the reason they were given displayed. The reason is
on the history trail and visible to both sides. A reasonless decision is refused **at the state
layer**, not only in the form.

> A **rejection** outcome was *not* added. No source defines one, and inventing a terminal refusal
> state would have been exactly the speculative behaviour this implementation forbids. The screen
> says so.

### 4.2 · The granting end of tenant allocation did not exist
**Source:** `STK31-24` — *"Super Admin controls which Courses, Experiments and technology variants
are available to a Tenant"*; `STK31-21`; `U-SA-08` (**P0, NEW**).

**Was:** approval copied the applicant's basket verbatim into the access record. `activateRequest()`
is the only writer of `access[]` in the whole build, and it read `req.items`, `req.quantity` and
`req.term` directly. The Super Admin could approve or not approve — nothing in between. The role
that the sources say *controls what a tenant receives* could not change what a tenant received.

**Now:** the approval decision carries an allocation the Super Admin can adjust — per-experiment
technology checkboxes, approved quantity, approved term — and `activateRequest()` writes **what was
granted**. Both sides then show granted-versus-requested wherever they differ.

**The grant may only ever narrow.** `validateGrant()` refuses an experiment that is not on the
request, a technology that was not requested, a quantity above the requested one, and a term longer
than the requested one. Nothing in the sources lets the platform hand an institution content it
never asked for, and a wider grant would have to come from a new request.

### 4.3 · Two institutions could be merged into one tenant
**Source:** FRD 1.3.1 tenant isolation, carried as a hard authority boundary in `17/04 §4`.

**Was:** a new tenant's id was `'tenant-' + util.slug(name)`. `slug()` lower-cases, collapses every
non-alphanumeric run to a hyphen and truncates at 48 characters, so two genuinely different
institutions could produce the same id — while `tenantByName()` (exact, trimmed, lower-cased) did
not consider them the same institution and so did not reuse the row. The result was two tenants
sharing one id and `tenantById()` returning the first: two institutions silently sharing people,
access records and assignments.

**Now:** the identifier is made unique before the row is created.

### 4.4 · The tenant boundary was not enforced on assignment targets or mapping subjects
**Source:** FRD 1.3.1 · `17/04 §4` · `STK31-25`.

**Was:** `previewAssignment()` checked that the *access record* belonged to the tenant but never
that the *targets* did. `mapFaculty()` never checked that the person was a Faculty member of that
tenant — or a Faculty member at all. Neither was reachable through the UI, because the pickers only
list the tenant's own people. **UI hiding is not a boundary.**

**Now:** both are enforced in the state layer. Assignment refuses a foreign student or a foreign
group with the reason `other-tenant-target`; `mapFaculty` refuses a subject who is not an active
Faculty record of that tenant, and refuses a Student outright. Asserted in **Scenario R**.

### 4.5 · A metadata edit could hand an Experiment to a Course the editor had no authority over
**Source:** `STK31-41` (scope is Super-Admin-governed) · `STK31-09`.

**Was:** `updateCanonicalMetadata()` checked the actor covered the record *as it stood*, then checked
only that the destination Course **existed**. A Course-scoped Content Manager could therefore re-file
an Experiment into a Course they held no assignment for — placing it under another person's
authority without that person acting, and removing it from their own reach in the same keystroke.

**Now:** the destination is a second authority question. A platform-scope manager is unaffected; an
Experiment-scope assignment names that Experiment and follows it. Asserted in **Scenario T**.

### 4.6 · Creation scope and mutation scope disagreed, and the Vendor was told a false reason
**Source:** `STK31-41` — assignment may be Course-specific **or** Experiment-specific.

**Was:** `vendorCanCreateIn()` used `actorCourseIds()`, which widens an Experiment-scope assignment
to that Experiment's whole Course. But `actorCoversRecord()` — which gates every edit — matches the
Experiment exactly. So an Experiment-scoped Vendor could create a **new** draft in that Course, and
the new record (a new id no Experiment-scope row can ever name) was **instantly frozen**, with the
screen explaining that their scope had been withdrawn. It had not.

**Now:** `actorCreateCourseIds()` answers the creation question separately — platform or Course
scope only — and every "create" affordance, the Course picker and the refusal copy use it. Asserted
in **Scenario S**.

### 4.7 · Removing a Faculty mapping stranded a learner, silently
**Source:** `STK31-31` — Faculty is the **only** human evaluator of a descriptive answer. FRD v5's
open-questions register calls this *the only open item that can strand a learner mid-progression*.

**Was:** a pending descriptive review is reachable **only** through a Faculty↔Experiment mapping.
Removing the last mapping covering an Experiment made the review invisible to every Faculty member,
while the Student was still told their answer was with their faculty, could not retake, and could
never complete. Nothing was destroyed and re-mapping fixed it in one click — but **nothing told
anybody to**, and no screen in the product could observe the state.

**Now:** `pendingReviewsWithoutEvaluator()` and `pendingReviewsLosingEvaluator()` make it
observable. The unmap control states the consequence before the act, in the same dialog grammar the
rest of that screen already uses; the Tenant Admin overview carries an attention row that leads to
Faculty mapping. **Only the mapping fact is shown** — no answer, mark or student response is exposed
to the Tenant Admin, because the review queue belongs to Faculty. The Faculty authority check is
unchanged. Asserted in **Scenario U**.

### 4.8 · The payment step modelled only success
**Source:** `ND-12` — *"keep the payment step PROVIDER-NEUTRAL with **all three** FRD 9.1.x outcomes
— SUCCESS · DECLINED · INDETERMINATE — and **only success writes**"*; `U-COM-03`.

**Was:** one control, `Simulate payment completed`, and `completePayment(id)` unconditionally
activated.

**Now:** three outcomes. Declined and indeterminate record what happened and **write nothing** — no
tenant, no access record, no entitlement — and the screen says exactly that, including that the
request is left precisely where it was. Only success activates. There is still no provider, no
gateway and no money anywhere. Asserted in **Scenario Q**.

### 4.9 · The Super Admin had no student-deactivation override
**Source:** `STK31-25` — *"Student removal/deactivation: Tenant Admin may perform it; **Super Admin
may ALSO perform it as a platform override**"*; `10_SUPER_ADMIN_PLATFORM_MODEL §3.1` row 22.

**Was:** `setStudentStatus()` existed and was called from exactly two Tenant-plane sites. No Super
Admin route reached a person at all.

**Now:** `setStudentStatusAsPlatform(personId, status, reason)` on the institution report, with the
consequence stated before the act and a **required reason**. It is deliberately the *same* one
writer of a student's status — an override that produced a different kind of *inactive* would be two
truths about one student — so the licence consequence is identical on both planes, and it deletes
no assignment and touches no access record. Recorded on the student and on the institution's
governance history. Asserted in **Scenario V**.

### 4.10 · Two confirmed institution-report lines were missing; Faculty could not see tenant holdings
**Source:** `STK31-42` (usage / completion indicators · students by stream) and `STK31-29` /
`U-FAC-01` (*"Experiments available to their Tenant"*).

**Now:** the institution report carries **students by stream** and a **usage and completion** card —
every figure derived from real records, each stating its own denominator, with `completed` still
labelled as the prototype-derived rule it is. No score, index, ranking or prediction, and no revenue
metric (`STK31-40`/`42` prohibit the last outright). The Faculty workspace carries a **read-only**
*Experiments available to your institution* card that marks each row mapped or not mapped, and says
in its own words that it is not a mapping and cannot be changed there. It widens no authority by a
single record — verified in **Scenario U**.

### 4.11 · A later version's delivery was approved unseen — fixed; the Content-Manager gate — **not** fixed
**Source:** `STK31-07` · `STK31-08`.

**Fixed:** a release writes the candidate version's per-technology delivery onto the published
Experiment, but **neither approver could see it**. Both the Academic Reviewer's version screen and
the Super Admin's Release/Hold panel now render it read-only, and `validateVersion()` now applies
the same hosted-URL format rule a first publication enforces, and refuses reuse of a version label
the Experiment has already released.

**Not fixed, on purpose:** whether the **Content Manager is a gate on a later version**, and whether
academic re-review is required for one at all, is genuinely unsettled. The build's current path —
Vendor → Academic Reviewer → Super Admin Release/Hold — is an **implementation judgement**, and it
is recorded as one at the head of `js/screens/content-version.js` rather than presented as policy.
It is stakeholder question **Q1** in §8.

---

## 5 · Cross-role integration — the ten journeys

Each journey was traced through the code (the function and the record at every step), and A, B, C
and J were additionally driven through the real screens in a browser.

| | Journey | Result |
|---|---|---|
| **A** | Catalogue → request → approval → **ACTIVE** → mapping → assignment → Faculty → Student | **Pass.** Driven in the browser end to end. Internal route has no payment step at any point |
| **B** | External → approval → **institution provisioned** → payment-required → payment → **ACTIVE** | **Pass**, after the §12c correction. Approval creates the institution; payment activates its access onto that same institution and never duplicates it. All three payment outcomes exist, only success writes, and the route renders only in `APPROVED_PAYMENT_REQUIRED` |
| **C** | Vendor → Reviewer (+ Learning Outcomes) → Content Manager **Publish** → catalogue | **Pass.** Publish writes the record's status and a publication record, and **nothing else** — no access, no licence, no assignment |
| **D** | Later version → Reviewer → Super Admin **Release / Hold** | **Pass.** Before release and on hold the old version stays current; release switches it under the same Experiment identity; no technology widening; a later version never becomes a second Experiment |
| **E** | Entitlement → learning → assessment → descriptive review → result by policy | **Pass**, and the AI boundary is now asserted (§6) |
| **F** | Deactivate → records preserved, entitlement zero → reactivate → restored | **Pass.** Nothing deleted; the same assignments restore access; allocation ordering untouched so nobody is displaced |
| **G** | Role scope withdrawn → future authority gone, history preserved → restored | **Pass**, and the Content Manager's own published work is now visible after a withdrawal, matching the rule the other two roles already followed |
| **H** | Device request → Super Admin decision → Student sees outcome | **Pass.** No entitlement, licence, technology, assessment or progress mutation on either side. The route now survives an entitlement change while a request is open |
| **I** | Support report → Super Admin resolve → reporter sees resolution | **Pass.** Same record both ends; no unrelated mutation; no SLA, channel or response-time promise anywhere |
| **J** | Normal → 15-day reminder → expired | **Pass**, and now **reachable in a walkthrough**. Verified live at the boundary: 16 days = not due, 15 = due, past = expired |

**Journey J needed a prototype affordance.** The rule is confirmed, but no product action could
produce the state — the shortest selectable term is Monthly, so every activated record starts about
thirty days out. The confirmed requirement could be asserted in the suite and never *seen*. The
Operations screen now carries a clearly-labelled **prototype-only** control that moves one record's
end date, and says in its own copy that it grants nothing, renews nothing, and changes no quantity,
assignment or entitlement. There is no product control that does this, and no source implies one.

---

## 6 · The Faculty descriptive-review boundary — the coverage gap named at Implementation 06

`STK31-31` makes Faculty the only human evaluator. **AI may suggest, draft and assist; it may never
decide.** The behaviour was already correct and had **no automated assertion** — the one coverage
gap identified at the Implementation-06 closeout.

**Scenario O** now asserts it, and the behaviour was **not** changed to make the test writable.
Generating a suggestion leaves `status` pending, `marks` null, `reviewedBy` null and `reviewedAt`
null, records `accepted: false`, and leaves the Student's outcome at `PENDING_FACULTY_REVIEW`.
Generating a second suggestion is still not a decision. `finaliseReview` is the only writer, and it
refuses blank marks, marks above the maximum, a person who is not the mapped Faculty member, and a
second decision on a completed review. Whether a suggestion was used is recorded as an audit trail,
never as an author.

**These assertions are load-bearing, and that was proved rather than assumed.** Two mutation tests
were run against a scratch copy: making `generateReviewAssistance` write marks and complete the
review fails **10** assertions; removing the cross-tenant assignment guard fails **5**. Neither
mutant reaches the suite green.

---

## 7 · Implementation judgements — recorded, not promoted

The twelve judgements carried from earlier implementations stand unchanged (see `README.md` →
*Judgement calls that need review*). **Three were added here**, and each is a judgement because the
sources are silent, not because a decision was avoided:

| # | Judgement | Why | If wrong |
|---|---|---|---|
| 13 | **A grant may only narrow a request, never widen it** | `STK31-24` confirms the Super Admin controls what a tenant receives but describes no amendment operation. Narrowing is the conservative reading; widening would hand an institution content it never requested | `validateGrant()` |
| 14 | **Creating a new Experiment needs Course-level or platform scope; an Experiment-scope assignment cannot author one** | `STK31-41` allows Experiment-level assignment but the record created is a new id no such assignment can name. The alternative — auto-granting scope over whatever gets created — invents an authority nobody granted | `actorCreateCourseIds()` |
| 15 | **A pending descriptive review with no mapped evaluator is surfaced, not blocked** | `STK31-31` requires a Faculty evaluator; no source says a mapping removal must be *refused*. Refusing it would let one submitted answer freeze an administrative action, so the consequence is stated and the state is made observable instead | `pendingReviewsWithoutEvaluator()` and the unmap dialog |

**A judgement inherited from Implementation 06 is explicitly re-flagged rather than quietly kept:**
the later-version path omits the Content Manager. That remains a judgement. It has **not** been
promoted to confirmed policy, and it is question **Q1** below.

---

## 8 · Questions for the PM and the stakeholder

Seventy-five distinct unresolved points were recorded across the audit. Most are non-blocking detail
already tracked as `ND-nn`. These **eight** are the ones that change what gets built next.

> **Q1 — Later-version governance.** A later version currently follows **Vendor → Academic Reviewer
> → Super Admin Release/Hold**. `STK31-07` confirms the Super Admin owns Release/Hold, and
> `STK31-06` gives the Content Manager *first* publication. It does not say whether the **Content
> Manager is also a gate on a later version**, nor whether **academic re-review is required for one
> at all**. The build implements the shortest defensible path and records it as a judgement. *Please
> confirm the intended gates.*

> **Q2 — Technology changes across a released version.** A later version currently **cannot** change
> which technologies an Experiment offers, because no source says what should happen to a tenant
> already holding a technology a newer version drops, or whether a tenant should automatically gain
> one it adds. Both would silently change what an institution paid for. *Should a version be able to
> change the technology set, and if so what happens to existing tenants — nothing, an opt-in, or a
> new request?*

> **Q3 — Answer and explanation release default.** Faculty choose between `SHOW_IMMEDIATELY`,
> `AFTER_DEADLINE` and `CUSTOM_DATE`. The **BITS / Taxila default** is not stated anywhere. The build
> ships a default and labels it as a prototype choice. *What should the institutional default be, and
> may Faculty override it?*

> **Q4 — Expiry reminder delivery.** A tenant reminder 15 days before expiry is confirmed; the
> **channel is not**. The build represents it as an operational due-state on both sides and states
> plainly that nothing was sent. *Email, in-product, both, or something else — and who is the
> recipient: the Tenant Admin, the SPOC on the original request, or both?*

> **Q5 — In-flight learning at expiry and deactivation.** When an access term ends or an institution
> is deactivated, what should happen to work already underway — specifically **a submitted written
> answer awaiting Faculty evaluation**? Today the record is preserved and access stops, which means a
> Student can be left permanently pending through no act of their own. *Should evaluation be allowed
> to complete after expiry, or should the result be finalised on the objective marks alone, or
> something else?*

> **Q6 — Device transfer decline.** The Super Admin can approve or decline a device replacement. What
> the Student should be told on a decline, and on what grounds one may be declined, is not defined.
> *Is a decline path in scope, and what must the Student see?*

> **Q7 — CSV mandatory columns and Plan Terms.** `STK31-26` lists the accepted columns and marks
> Semester and Organisation optional; `ND-03` leaves **Plan Terms / Access Context** pending. The
> build treats Programme, Course Name, Course ID/Code, Student ID, Student Name and Email as required
> and everything else as optional. *Please confirm — in particular whether Plan Terms is mandatory,
> and whether it may ever override the tenant's approved access record (today it never does).*

> **Q8 — What consumes one licence.** Approved quantity is implemented as **unique active Students
> per access record** — the only reading in which *Approved / Assigned / Remaining* means anything.
> `STK31-27` confirms the quantity and forbids a universal cap but names no counting algorithm.
> *Please confirm the counting unit, and whether Faculty should ever consume one (today they do
> not).*

---

## 9 · Explicitly deferred to B2C

`STK31-04` makes B2B the current delivery priority and defers direct self-service B2C, while keeping
it in the architecture. Not built, and not treated as a gap:

- B2C self-service checkout and any commerce flow
- Monthly / Quarterly / Yearly **individual** access periods (`STK31-05` — preserved, not built; there is no Lifetime option)
- An entry fork between the Institution and Individual routes on the public plane
- Any individual-learner account, billing, renewal or cancellation surface

Batch 04 is preserved in full as reusable historical work.

---

## 10 · Explicitly deferred to Implementation 08 (visual design)

No visual redesign was started. Deferred, and deliberately untouched here:

- The design system, branding and any premium restyling of the marketplace or dashboards
- Typography scale, spacing rhythm, colour beyond the existing accessibility-corrected tokens
- Illustration, imagery and any animation or micro-interaction pass
- Card and density polish, and any layout refactor

Structural accessibility and responsive **defects** were fixed, because they are functional; nothing
aesthetic was changed. No WCAG certification is claimed anywhere.

---

## 11 · Also not built, and not a gap

Each is prohibited, out of phase, or has no source: authentication / SSO / registration · a real
backend, database or API · a real payment gateway · a real AI provider · a real XR runtime or
package delivery · a device **registry** · any notification, message or reminder **delivery** ·
auto-renewal, automatic payment or extension · certificates (`PM-12`, Phase 2) · gamification · an
SLA, priority formula, external ticketing provider, chatbot or escalation path · creating or
deleting Programme / Course **master records** · question **spreadsheet import** (FRD 5.1.1 — see
below) · unpublishing or withdrawing published content.

> **Question spreadsheet import** is the one item in this list that a source *does* ask for
> (FRD 5.1.1 · `STK31-34`) and that this implementation deliberately did **not** build. The reason is
> not effort: **no source defines the column schema**, and nothing states how a multiple-choice
> question's options and answer key should be expressed in a spreadsheet. Building it would have
> meant inventing the schema. The Question Bank names the gap in its own words, and no control claims
> otherwise. It becomes buildable the moment the columns are confirmed.

---

## 12 · Role and authority summary — as built

```
PUBLISHED            ≠   TENANT ACCESS         ≠   STUDENT ENTITLEMENT
Content Manager          Super Admin               Tenant Admin
publishes                grants (and may narrow)   assigns
```

| Role | Owns | Cannot |
|---|---|---|
| **Student / Learner** | Their own learning, attempts, device requests and support reports | Reach anything without an **effective entitlement** — existing, group or Course membership, and publication, grant nothing |
| **Faculty** | Assessment configuration · Question Bank (Add · Edit · **Delete**) · the **only** human evaluation of a written answer | Publish or release · add a technology the institution was not granted · change licences or assignments · act outside their mapping · finalise a review by AI |
| **Institute Admin / Tenant Admin** | People · groups · **local** academic mapping (Course code, **optional** Semester) · Faculty mapping · assignment — the only writer of entitlement | Redefine the canonical catalogue · assign outside the approved set or beyond the approved quantity · touch another institution · act while deactivated |
| **Vendor** | Technical submission · per-technology delivery · documentation · version proposals | Author Learning Outcomes · supply a price · upload source code · publish · release · act outside their scope |
| **Academic Reviewer** | **Learning Outcomes** · academic validation · the academic decision | Publish · release · act outside their scope · read an unsubmitted Vendor draft |
| **Content Manager** | Content Library · **first publication** · canonical content metadata | **Release / Hold** — no control exists on this plane · re-file content into a Course they do not hold |
| **Super Admin** | Request decisions and the allocation · tenant governance · Tenant Admin assignment · platform role governance · canonical metadata · later-version **Release / Hold** · device decisions · support resolution · expiry visibility · student-deactivation override | **First publication** · grant or revoke an individual learner entitlement · assign content to learners · unpublish content · any assessment surface · any revenue metric |

---

## 12b · The adversarial review — Implementation 07 audited against itself

`§32` of the brief asks for **one** adversarial pass after gap closure. Five independent
adversaries attacked the new code from different angles — authority and deep-link bypass,
entitlement and allocation integrity, the content chain and version lifecycle, regression hunting
across the whole diff, and screen-claim honesty. **32 candidate defects** were raised, and each was
then put to a separate verifier instructed to refute it.

**Ten were confirmed. All ten are fixed.** The rest were refuted — most of them because the fix had
already landed while the verification pass was running, which independently confirmed those fixes
against the working tree.

The confirmed defects were all in **Implementation 07's own new work**, which is what an adversarial
pass is for:

| Severity | Defect | Fixed by |
|---|---|---|
| **P1** | `completePayment` bypassed the tenant-inactive gate the same pass had just added to `approveRequest` — the external route could activate onto a deactivated institution, under a screen claiming access was live | The success path now meets the same gate; declining or recording an unconfirmed outcome still works, because neither writes |
| **P1** | The new destination-authority gate reported every refusal as a **name clash**, and the Course picker still offered Courses the save would always refuse | `managerCanFileInto()` is now the one question the picker and the writer both ask, and the refusal names the real reason |
| **P0→refuted→fixed** | A **regression from this pass**: narrowing `vendorCanCreateIn` to Course scope also gated the ordinary save, so an Experiment-scoped Vendor got a live editor whose every save was refused | The move-authority question is now asked **only when the Course is actually changing**. Saving a record where it already sits is not a move |
| **P2** | Two **stored-HTML-injection** sinks introduced this pass: a student's name in the override dialog body, and an institution name in the Faculty card heading | Both escaped. A sweep of the whole diff for unescaped interpolation of user-supplied strings found no others |
| **P2** | `validateGrant` accepted a duplicated experiment or technology, silently narrowing while `grantNarrowsRequest` reported nothing unusual | Both are refused |
| **P2** | `previewAssignment` accepted an unrecognised `targetType`, and the commit then wrote an assignment nothing could derive an entitlement from | Refused as `bad-target-type` |
| **P2** | A redundant reactivation of an **already-active** student re-stamped `activationSeq`, handing their own licence to whoever was queued behind them | `setStudentStatus` is a no-op when the status is not changing |
| **P2** | The `PROTOTYPE-ONLY` expiry control claimed it changed no entitlement — moving a record past its end date expires it, which by design zeroes entitlement derived from it | The copy and the toast now say exactly what a date change does, and that nothing is deleted |
| **P2** | The approve dialog announced *"receives less than it requested"* beside three figures that were all identical, whenever only a **technology** had been dropped | The sentence now names only the dimensions that actually changed, technologies included |
| **P2** | `tenantReport().usage` double counted a student holding one Experiment under **two access records** — progress is Experiment-level, so the second count was a copy of the first | Counted once per student × Experiment, with the technologies unioned; the card says so |

Three further defects the pass found in Implementation 07's *presentation* were fixed at the same
time, because each made a claim the product did not honour: the **decision reason and the
applicant's reply were stored but never rendered** on either request timeline (so `STK31-20`'s
history trail was only half real, and the more-information round trip was one-way); **a narrowed
grant was invisible to the applicant on the internal route**, which has no payment step to show it;
and the **delivery card shown to both approvers rendered the raw candidate** rather than the merge a
release actually performs, so an untouched field read as an em-dash where the published value would
in fact survive.

**Not continued past one clean pass**, as `§32` requires. Nine new assertions (Scenario **X**) lock
the six state-layer fixes in place, and a mutation test confirms they are load-bearing.

---

## 12c · Post-review correction — the external tenant-creation boundary

Found by manual Safari testing after the adversarial pass, on the external Subscription route
(`REQ-002`, Northfield Institute of Technology): **Super Admin → Institutions did not list the
institution between approval and payment**, while the decision screen said approval created it.

**The contract, traced before editing.** `STK31-21` lists the Super Admin's acts in order and as
separate capabilities — *approves / authorises the tenant · **creates and governs the tenant** ·
**assigns the Tenant / Institute Admin** · … · **decides which content and technologies the tenant
receives***. `17/07 §2`'s actor table carries the same three as separate confirmed stages in that
order, and `17/06 §3.3` shows what payment actually gates: step ⑨ **TENANT ACCESS ACTIVATION**,
whose contents are only the allocated Courses and Experiments, the technologies, the licence
quantity and the access term. The confirmed constraint is stated precisely as *"🔴 **ACCESS** is
NEVER granted before approval"* — a rule about access, not about whether the institution exists.
**Contract A confirmed.** The stakeholder's own governance requires it: the Super Admin cannot
assign a Tenant Admin (`STK31-21`) to an institution that does not exist.

**Root cause.** `activateRequest()` performed **two different domain transitions in one function** —
provisioning the institution and writing its access record. The external route defers that whole
function to payment, so tenant *existence* was silently gated on payment along with tenant *content
access*, conflating the two concepts the build exists to keep apart.

| | Old | Corrected |
|---|---|---|
| Internal approval | provision + activate | **unchanged** — provision + activate |
| External approval | *nothing* | **provision the institution** |
| External payment | provision + activate | **activate only** — resolves the bound institution |

`provisionTenantFor()` is now its own function, idempotent, and binds the request to its institution
via `req.tenantId` so payment can never resolve or create a different one. `activateRequest()`
carries a double-activation guard so a second success cannot write a second access record.

**Provisioning grants nothing**, and that is asserted: an approved-but-unpaid institution holds no
access record, no assignable content, no licence allocation, no Faculty reach and no student
entitlement — all of which derive from `access[]`, which only activation writes. `status: 'active'`
was kept as-is because it is the **deactivation axis** (`STK31-22`) and means only *"not deactivated
by the Super Admin"*; marking a brand-new institution `inactive` would have been the actual lie. No
new lifecycle or status was invented. The surfaces now name the state instead: an *Awaiting payment*
badge and a *None yet* access cell in Institutions, and an explicit card on the institution report,
the tenant overview and the tenant content-access screen.

**Scenario Y** covers the whole lifecycle, including the existing-institution case (a second request
from the same institution creates no duplicate at either step) and the internal route's unchanged
immediate activation. Two mutation tests confirm it is load-bearing: restoring the original defect
fails 2 assertions, and activating at approval instead of provisioning fails 12.

---

## 13 · Verification

| | |
|---|---|
| **Deterministic suite** | **685 assertions, 0 failures** (from 429). 256 added; **none removed or weakened** |
| **Load-bearing proof** | Five mutation tests: AI auto-finalising a review fails **10** assertions; removing the cross-tenant guard fails **5**; removing the payment tenant gate and the redundant-status no-op fails **6**; restoring the tenant-creation defect fails **2**; activating at approval instead of provisioning fails **12**. No mutant reaches the suite green |
| **Browser** | Journeys A, B, C and J driven through the real controls. The new decision surface, allocation narrowing, more-information outcome, applicant resubmit, three payment outcomes, institution report, override and Faculty holdings card all verified live |
| **Responsive** | **41 routes × 375 / 768 / 1280** — including every not-found and deep-link-guard path. Zero horizontal overflow at every width, and none masked |
| **Structural a11y** | Same sweep: exactly one `h1` per route, zero unlabelled form controls, zero blank pages, zero uncaught runtime errors. Dialog focus trap, Escape and focus restore intact. No WCAG certification claimed |
| **Runtime** | Zero console messages of any level across the full sweep. All network requests 200; no external request of any kind |
| **State** | `schemaVersion` **unchanged at 8**. No migration was required, so none was written. Implementation 01–06 data is untouched |

---

## 14 · Presentation readiness

The platform is **ready for a functional review**. What a reviewer can now do that they could not
before: take a real decision on an institutional request with both confirmed outcomes and a recorded
reason; grant an institution **less** than it asked for and watch that flow through to the access
record; see an approved external institution **exist while holding nothing** until it pays, and its
Tenant Admin be assigned in that window; see the confirmed 15-day expiry state on a real record;
watch a Faculty member discover what their institution holds without gaining authority over it; and
see a written answer that has lost its evaluator reported rather than silently lost.

**Closeout status.** The tree was re-verified after the §12c correction: **685 assertions, 0
failures**; the nineteen current-state B2B invariants (publication ≠ tenant entitlement · institution
existence ≠ tenant content access · tenant content access ≠ student entitlement · external approval
≠ active paid access · narrow-only grants · no duplicate institutions · Faculty as sole human
evaluator · deactivation preserves everything · release, transfer and support grant nothing ·
canonical metadata closed to the tenant plane · the four publication-authority boundaries) each
asserted directly and passing; and a 42-route smoke across all seven roles and the public plane at
1280 and 375 with no blank page, no uncaught error, no route failure and no horizontal overflow.

What is deliberately still visible and should **not** be read as an oversight: every honest
*prototype-only* label, every *not in this build* gap note, and every unresolved-policy disclaimer.
They are the record of what has not been decided, and removing them before the stakeholder has
decided would be the opposite of useful.

**The final visual design has not been started.** That is Implementation 08, and this build is
deliberately still wearing its functional clothes.
