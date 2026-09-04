# Stakeholder Review Checklist — in-meeting capture sheet

| | |
|---|---|
| **Meeting** | B2B functional review · PM + key stakeholder |
| **Date** | ____________________ |
| **Present** | ____________________ |
| **Captured by** | ____________________ |
| **Build reviewed** | `ui-ux/18-unified-functional-platform/` · Implementation 07 closeout · `schemaVersion 8` |

**How to use this.** One row per topic. Mark the status, write the words the stakeholder actually
used, and move on — do not debate in the meeting. `CHANGE REQUESTED` and `OPEN QUESTION` rows are
the input to Implementation 08 scoping; `NOT DISCUSSED` is a legitimate and useful outcome.

**Status key**

| | |
|---|---|
| **C** | **CONFIRMED** — stakeholder confirmed the behaviour as built |
| **X** | **CHANGE REQUESTED** — behaviour must change. Capture *what*, not *how* |
| **?** | **OPEN QUESTION** — raised, not resolved. Needs a follow-up owner and date |
| **–** | **NOT DISCUSSED** |

> Record the stakeholder's **own wording** in the notes column. A paraphrase loses the thing that
> makes a correction cheap to act on.

---

## 1 · Role ownership

| # | Item as built | C / X / ? / – | Notes (their words) |
|---|---|:---:|---|
| 1.1 | **Seven roles**: Student/Learner · Faculty · Institute/Tenant Admin · Vendor · Academic Reviewer · Content Manager · Super Admin | | |
| 1.2 | **Student and Learner are ONE role** | | |
| 1.3 | **Institute Admin and Tenant Admin are ONE role** — final product-facing label still to pick | | |
| 1.4 | **Vendor** submits technically; never authors Learning Outcomes, never sets a price, never publishes | | |
| 1.5 | **Academic Reviewer** owns academic validation **and Learning Outcomes** | | |
| 1.6 | **Content Manager** owns the Content Library, canonical metadata and **first publication** | | |
| 1.7 | **Super Admin** owns request decisions, allocation, tenant governance, Tenant Admin assignment, role governance, later-version Release/Hold, device decisions, support resolution | | |
| 1.8 | **Tenant Admin** owns people, groups, local academic mapping, Faculty mapping and **assignment** | | |
| 1.9 | **Faculty** owns assessment configuration, the Question Bank, and evaluation of written answers | | |
| 1.10 | Internal BITS content teams operate **through the Vendor role**, not a separate role | | |
| 1.11 | Any role, capability or authority **missing** from the seven above | | |

---

## 2 · B2B request and approval

| # | Item as built | C / X / ? / – | Notes |
|---|---|:---:|---|
| 2.1 | Public catalogue browsable **before sign-in** | | |
| 2.2 | Selection basket **prepares a request** — it is not a checkout | | |
| 2.3 | Request captures: institution · SPOC · email · **experiments + technologies** · **licence quantity** · **access term** | | |
| 2.4 | Access terms offered: **Monthly / Quarterly / Yearly** | | |
| 2.5 | Super Admin outcomes: **Approve** and **Request more information** | | |
| 2.6 | **A reason is required on either outcome**, recorded on history and shown to the applicant | | |
| 2.7 | **No reject / refuse outcome exists** (no source defines one) | | |
| 2.8 | Applicant can **reply and resubmit** after a more-information request | | |
| 2.9 | **The grant may only NARROW** — fewer experiments, fewer technologies, lower quantity, shorter term. Never more than requested | | |
| 2.10 | A wider grant requires a **new request** | | |
| 2.11 | Granted-vs-requested is shown to **both** sides wherever they differ | | |
| 2.12 | Is the **internal vs external classification** decided by the Super Admin at approval, or by a rule? | | |

---

## 3 · Institution creation

| # | Item as built | C / X / ? / – | Notes |
|---|---|:---:|---|
| 3.1 | **Internal route**: approval provisions the institution **and** activates its access immediately | | |
| 3.2 | **External route**: approval **provisions the institution** — it exists, is listed, has an identity | | |
| 3.3 | The approved-but-unpaid institution holds **no access record, no licences, no assignable content, no entitlement** | | |
| 3.4 | **The Tenant Admin can be assigned in that window**, before payment | | |
| 3.5 | An institution is created **only** by approving a request — no standalone create | | |
| 3.6 | A second request from an existing institution creates **no duplicate** | | |
| 3.7 | Is the wording right — *"institution exists but holds no content yet"* / *"Awaiting payment"*? | | |
| 3.8 | A campus or unit may be its **own** tenant | | |

---

## 4 · Payment and access activation

| # | Item as built | C / X / ? / – | Notes |
|---|---|:---:|---|
| 4.1 | **No payment step anywhere** on the internal / BITS Community route | | |
| 4.2 | External route: payment gates **activation of the approved allocation** | | |
| 4.3 | Three outcomes: **successful · declined · not confirmed** | | |
| 4.4 | **Only success writes anything.** Declined and not-confirmed are recorded and change nothing | | |
| 4.5 | No payment provider, gateway, amount or pricing anywhere | | |
| 4.6 | Access term runs from activation; the record carries **quantity + term + technologies** | | |
| 4.7 | Renewal is **not** built. No automatic renewal, charge or extension | | |
| 4.8 | What should happen at expiry — lapse, grace period, or something else? | | |

---

## 5 · Tenant Admin operations

| # | Item as built | C / X / ? / – | Notes |
|---|---|:---:|---|
| 5.1 | Tenant Admin sees only **activated** content — approved-but-unpaid shows as awaiting payment | | |
| 5.2 | Add Faculty and add Student manually | | |
| 5.3 | **Bulk CSV import** of students, with per-row validation | | |
| 5.4 | CSV required columns: **Programme · Course Name · Course ID/Code · Student ID · Student Name · Email**; everything else optional | | |
| 5.5 | **Semester is optional, never mandatory** | | |
| 5.6 | Is **Plan Terms / Access Context** mandatory in the CSV? (built as optional) | | |
| 5.7 | CSV commit is **all-or-nothing**; a per-row error report is produced either way | | |
| 5.8 | Student groups, and local academic mapping (institution's own Course code) | | |
| 5.9 | **Tenant Admin cannot redefine canonical Programme / Course / Experiment metadata** | | |
| 5.10 | Tenant isolation: cannot reach another institution's people, content or assignments | | |
| 5.11 | Deactivation (student or institution) is **reversible** and preserves all records | | |
| 5.12 | Institution-wide reporting is **not** built on the tenant plane — who should see what? | | |
| 5.13 | ERP as a provisioning route, and CSV↔ERP conflict on the same person | | |

---

## 6 · Student allocation and licensing

| # | Item as built | C / X / ? / – | Notes |
|---|---|:---:|---|
| 6.1 | **Only a Tenant Admin assignment creates student entitlement** | | |
| 6.2 | Activating tenant access entitles **nobody** | | |
| 6.3 | Adding a student, group membership and course enrolment each entitle **nothing** | | |
| 6.4 | **One licence = one active student per access record**, however many experiments they receive | | |
| 6.5 | **Faculty mapping consumes no student licence** | | |
| 6.6 | A deactivated student **releases** their licence | | |
| 6.7 | A reactivated student re-enters the allocation at the back; beyond quantity shows as **Held — allocation full**, never silently entitled | | |
| 6.8 | Assignment can target **individual students or a group** | | |
| 6.9 | Assigned technologies are **inherited from the approved record** — the institution can neither add nor drop one | | |
| 6.10 | There is **no universal seat cap**; quantity comes from the request | | |
| 6.11 | Is the counting unit right, and should Faculty ever consume one? | | |

---

## 7 · Faculty and assessment

| # | Item as built | C / X / ? / – | Notes |
|---|---|:---:|---|
| 7.1 | Faculty reach is bounded by **Faculty↔Course/Experiment mapping** | | |
| 7.2 | Faculty see institutional holdings **read-only** — visibility without authority | | |
| 7.3 | Faculty own assessment configuration: questions, pass mark, attempt limit, deadline | | |
| 7.4 | Question Bank: **Add · Edit · Delete** (the word is *Delete*) | | |
| 7.5 | Assessment holds **copies** of bank questions, so a bank edit cannot silently rewrite a live assessment | | |
| 7.6 | A structural edit to an assessment with submitted attempts creates a **revision**; submitted attempts keep their snapshot | | |
| 7.7 | **Faculty is the only human evaluator of a written answer** | | |
| 7.8 | **AI may suggest, draft and assist. AI may never decide.** The result exists only on Faculty confirmation | | |
| 7.9 | A **confirmed review cannot be reopened** — no re-grading workflow is built | | |
| 7.10 | Answer/explanation visibility: **immediately / after deadline / custom date** | | |
| 7.11 | **What is the BITS institutional default for visibility, and may Faculty override it?** | | |
| 7.12 | Faculty analytics are **row counts** — no score, index, rank, prediction or attendance | | |
| 7.13 | **Question spreadsheet import is NOT built** — no column schema is defined anywhere | | |
| 7.14 | Faculty cannot publish, release, add an ungranted technology, or change licences or assignments | | |
| 7.15 | Is a Faculty member's assessment **tenant-scoped** correct — i.e. a new institution starts with none? | | |

---

## 8 · Content publication (first publication)

| # | Item as built | C / X / ? / – | Notes |
|---|---|:---:|---|
| 8.1 | Chain: **Vendor → Academic Reviewer → Content Manager Publish** | | |
| 8.2 | Vendor supplies per-technology delivery, documentation and technical notes | | |
| 8.3 | Vendor **selects** a canonical Course; cannot propose a new Programme or Course | | |
| 8.4 | Academic Reviewer authors **Learning Outcomes** and takes the academic decision | | |
| 8.5 | Academic approval requires **at least one** Learning Outcome | | |
| 8.6 | Either gate can **request changes**, with a required reason | | |
| 8.7 | A resubmission returns to the gate that requested the change, not to the start | | |
| 8.8 | **Publishing writes the record's status and a publication record — and nothing else.** No access, no licence, no assignment | | |
| 8.9 | Content Manager may manage **canonical metadata**; Learning Outcomes stay with the Reviewer; technology delivery stays with the Vendor | | |
| 8.10 | **Unpublishing / withdrawing content is NOT built** | | |
| 8.11 | **Creating or deleting a Programme / Department or Course is NOT built** — is that capability needed? | | |
| 8.12 | May the Super Admin **return** a submission at the first-publication gate? (built: neither granted nor refused) | | |
| 8.13 | Content role assignment is **Course- or Experiment-specific**; several holders per Experiment | | |

---

## 9 · Later-version Release / Hold

| # | Item as built | C / X / ? / – | Notes |
|---|---|:---:|---|
| 9.1 | **Publish ≠ Release.** Publish is a new Experiment's first appearance; Release is a later version | | |
| 9.2 | **Release / Hold is the Super Admin's**, and exists on no other plane | | |
| 9.3 | Built path: **Vendor proposes → Academic Reviewer approves → Super Admin releases or holds** | | |
| 9.4 | **Should the Content Manager also be a gate on a later version?** (built: no) | | |
| 9.5 | **Is academic re-review required for a later version at all?** (built: yes) | | |
| 9.6 | **Releasing a later version grants no new tenant or student access** | | |
| 9.7 | A later version stays the **same Experiment identity** — never a second Experiment | | |
| 9.8 | **A later version cannot change the technology set.** What should happen to a tenant already holding a technology a newer version drops, or one it adds? | | |
| 9.9 | **Hold parks a candidate and is reversible**; the current version stays live | | |
| 9.10 | Only **one** open version candidate per Experiment | | |
| 9.11 | **No rollback** to a previously released version | | |
| 9.12 | A reason is **optional** on Release/Hold (required on a content return and a device decline) | | |

---

## 10 · Student learning and progress

| # | Item as built | C / X / ? / – | Notes |
|---|---|:---:|---|
| 10.1 | Student sees only what was **assigned** to them, in the technologies the institution holds | | |
| 10.2 | Learning resources are **recommended, not a gate** — but do count towards completion | | |
| 10.3 | Marking a resource *done* is a **student** action | | |
| 10.4 | **Simulation is technology-specific**; each technology is tracked separately | | |
| 10.5 | **The assessment belongs to the Experiment**, not the technology — never sat twice for two technologies | | |
| 10.6 | Objective questions score on submission; **a written answer goes to Faculty** | | |
| 10.7 | Result withholding follows the Faculty visibility policy — including the **objective sub-score** and the retry control | | |
| 10.8 | Progress is expressed **per technology** and rolled up per Experiment | | |
| 10.9 | **Completion rule** (prototype): every resource done · simulation complete for **every** entitled technology · assessment passed. Is that the intended institutional rule? | | |
| 10.10 | Work after an assignment is revoked is kept as **"Earlier work"**, not deleted | | |
| 10.11 | **What should happen to a submitted answer awaiting evaluation when the term expires or the institution is deactivated?** | | |
| 10.12 | No assessment timer; the platform prompts and never auto-submits | | |
| 10.13 | Certificates are **not** in this phase | | |

---

## 11 · Device and support

| # | Item as built | C / X / ? / – | Notes |
|---|---|:---:|---|
| 11.1 | Student raises a **device replacement / transfer** request from their own workspace | | |
| 11.2 | Super Admin decides; **the decision moves the device binding and nothing else** | | |
| 11.3 | **There is no device registry** — no hardware registered, named, certified or configured | | |
| 11.4 | A **Decline** path exists — built as a judgement, not a confirmed capability. Is decline in scope, and what must the student be told? | | |
| 11.5 | **Help / support** exists in every workspace; the reporter sees the state of their report | | |
| 11.6 | **No SLA, priority, severity, escalation path or external ticketing provider** | | |
| 11.7 | **Support resolution changes no entitlement or content state** | | |
| 11.8 | A deactivated institution can still **report an issue** (deliberate exception) | | |
| 11.9 | **15-day expiry reminder is required.** Represented in-product only — **which channel, and who receives it?** | | |
| 11.10 | XR delivery mechanism is deliberately **unasserted** — is that still correct? | | |

---

## 12 · Terminology

Mark each word **keep** or **change**. Terminology corrections are the cheapest change available
today and among the most expensive after the visual design.

| # | Word as used | C / X / ? / – | Preferred word |
|---|---|:---:|---|
| 12.1 | **Experiment** (the learning unit) | | |
| 12.2 | **Course** | | |
| 12.3 | **Programme / Department** (one grouping level) | | |
| 12.4 | **Institute Admin** vs **Tenant Admin** — pick one for the product | | |
| 12.5 | **Student** vs **Learner** | | |
| 12.6 | **Academic Reviewer** | | |
| 12.7 | **Content Manager** | | |
| 12.8 | **Vendor** | | |
| 12.9 | **Super Admin** | | |
| 12.10 | **Publish** (first publication) | | |
| 12.11 | **Release / Hold** (later version) | | |
| 12.12 | **Access record** · **Approved licences** · **Entitlement** | | |
| 12.13 | **Assignment** (Tenant Admin → student) | | |
| 12.14 | **Faculty mapping** | | |
| 12.15 | **Selection** (the basket) | | |
| 12.16 | **Access context** — *BITS Community* / *Subscription* | | |
| 12.17 | **Access term** — Monthly / Quarterly / Yearly | | |
| 12.18 | Statuses: *Draft · Academic review · Changes requested · Content readiness review · Published* | | |
| 12.19 | *Approved — payment required* · *Awaiting payment* | | |
| 12.20 | **Technologies** — Web / VR / MR / AR | | |
| 12.21 | Any word the stakeholder used that the product does not | | |

---

## 13 · Missing B2B capability

Anything the stakeholder expects that is **not in the build**. Capture the need, not a solution.

| # | Capability | C / X / ? / – | Notes · who needs it · how often |
|---|---|:---:|---|
| 13.1 | Reject / refuse a request outright | | |
| 13.2 | Create / rename / retire a **Programme or Course** master record | | |
| 13.3 | Unpublish or withdraw published content | | |
| 13.4 | **Question spreadsheet import** (needs a column schema) | | |
| 13.5 | Institution-wide reporting on the tenant plane | | |
| 13.6 | Amend an existing access record (extend, add licences, add a technology) without a new request | | |
| 13.7 | Renewal — automatic or manual | | |
| 13.8 | Notification / reminder **delivery** of any kind | | |
| 13.9 | Authentication / SSO / registration | | |
| 13.10 | Certificates | | |
| 13.11 | Bundles, pricing or any revenue surface | | |
| 13.12 | Re-grading a confirmed descriptive review | | |
| 13.13 | Device registry / device identity management | | |
| 13.14 | B2C self-service (deferred — confirm it stays deferred) | | |
| 13.15 | Other: | | |
| 13.16 | Other: | | |

---

## 14 · Visual / UX feedback → Implementation 08

**Log, do not discuss.** Everything here is expected and welcome — the visual design has not been
done. Nothing in this section changes a business rule.

| # | Observation | Where | Priority (H/M/L) |
|---|---|---|:---:|
| 14.1 | | | |
| 14.2 | | | |
| 14.3 | | | |
| 14.4 | | | |
| 14.5 | | | |
| 14.6 | | | |
| 14.7 | | | |
| 14.8 | | | |

**Prompts if the stakeholder needs them:** overall look and feel · branding and logo use ·
density and whitespace · typography · colour · navigation clarity per role · terminology **on
screen** · table vs card presentation · the public catalogue as a marketing surface · the
prototype-controls strip (which disappears in the product) · mobile and tablet expectations ·
accessibility expectations.

---

## Close-out

| | |
|---|---|
| Rows marked **CHANGE REQUESTED** | ______ |
| Rows marked **OPEN QUESTION** | ______ |
| Rows marked **NOT DISCUSSED** (needs a second session?) | ______ |
| **Any change that alters a business rule or state transition** — list ids | |
| **Any change that is visual only** — safe for Implementation 08 | |
| **Blocking items** — work cannot proceed until answered | |
| Follow-up owner + date | |
| **Is the functional B2B model approved to proceed to visual design?** | **YES / NO / WITH THE CHANGES ABOVE** |

> **After the meeting.** Split the `X` and `?` rows into (a) business-rule changes — these are
> re-implementation and must land before the visual pass, and (b) presentation changes — these fold
> into Implementation 08. Do not start the visual design until (a) is scoped.
