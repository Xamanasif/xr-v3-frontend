# Stakeholder Demo Script — XR Simulation Learning Platform (B2B functional review)

| | |
|---|---|
| **Audience** | PM + key stakeholder ("Mam") |
| **Purpose** | Confirm the **functional B2B operating model** — workflow, terminology, ownership and business rules — **before** the final visual design |
| **Length** | **17 minutes** core · up to 22 with the two optional segments |
| **Build** | `ui-ux/18-unified-functional-platform/` · Implementation 07.1 · `schemaVersion 9` |
| **Runs at** | <http://localhost:8731/> |
| **Prepared from** | A full live rehearsal of every segment below. Every route, every button label and every seeded name in this document was driven in the running build and verified |
| **This is NOT** | A design review. The visual design is deliberately unfinished — that is Implementation 08 |

> **One rule for the presenter.** Everything below assumes **one** *Reset prototype data* at the
> start and **no** reset until the end. Each segment depends on the state the previous one left.
> The reset sequence and recovery steps are in **`DEMO_RESET_AND_REHEARSAL.md`** — read that first.

---

## The story you are telling

Four sentences, in this order. Everything else is evidence for them.

1. **Content becomes available** through Vendor → Academic Reviewer → Content Manager. Publishing puts it in the catalogue and **gives nobody access.**
2. **An institution asks** for specific experiments, specific technologies, a number of licences and a term. **The Super Admin decides what it actually receives** — and may grant less, never more.
3. **The institution's own admin decides who gets it.** Approved content entitles nobody until a Tenant Admin assigns it to a named student.
4. **Faculty and students then do the academic work** — and a written answer is evaluated by a human Faculty member, never by the platform.

The three sentences the demo exists to make undeniable:

```
PUBLISHED            ≠   TENANT ACCESS         ≠   STUDENT ENTITLEMENT
Content Manager          Super Admin               Tenant Admin
publishes                grants (and may narrow)   assigns
```

```
INSTITUTION EXISTS   ≠   INSTITUTION HOLDS CONTENT
approval creates it      payment activates its allocation
```

```
PUBLISH  =  first time a NEW Experiment reaches the catalogue  →  Content Manager
RELEASE  =  a LATER VERSION of an already-published Experiment →  Super Admin
```

---

## Cast — the real records you will name

Everything below exists after a reset. **Nothing is invented mid-demo.**

| Role | Who | Where |
|---|---|---|
| Requesting institution (internal) | **Sample Engineering Institute** — access context *BITS Community* | Requester scenario **A** |
| Requesting institution (external) | **Northfield Institute of Technology** — access context *Subscription* | Requester scenario **B** |
| SPOC (internal) | **Dr. Kavita Sharma** — prefilled | Request form |
| SPOC (external) | **Prof. Daniel Mensah** — prefilled | Request form |
| Tenant Admin | **Priya Raghavan** | Sample Engineering Institute |
| Faculty | **Dr. Arjun Mehta** (`SEI/FAC/0031`) | Sample Engineering Institute |
| Student | **Rahul Verma** (`SEI/CE/2023/0142`) | Sample Engineering Institute |
| Vendor | **Ananya Rao** | Content plane |
| Academic Reviewer | **Dr. R. Iyer** | Content plane |
| Content Manager | **M. Kulkarni** | Content plane |

**Content you will use**

| Record | State after reset | Used in |
|---|---|---|
| **Direct Shear Test** — Soil Mechanics · Web/VR/AR · 5 resources · 5-question assessment, results shown immediately | Published | Parts 1, 2, 5, 7 |
| **Consolidation Test** — Soil Mechanics · Web/VR · assessment includes **one written answer** | Published | Parts 2, 5, 7 |
| **Total Station Experiment** — Surveying · Web/AR | Published | Part 4 |
| **Differential Levelling Exercise (sample)** — `EXP-008` | **Awaiting the Academic Reviewer** | Part 8 |
| **Column Buckling Test (sample)** — `EXP-009` | **Awaiting the Content Manager's publication decision** | Part 8 (spare) |

Request ids are generated in order of submission: the **first** request you submit is `REQ-001`, the **second** is `REQ-002`. The script assumes internal first.

---

# PART 1 — Public discovery · 2 min

**Role** Public (no sign-in — this is the pre-login catalogue)

| | |
|---|---|
| **Path** | `#/catalogue` → **Civil Engineering** → **Soil Mechanics** → **Direct Shear Test** |
| **Action** | Click through the three levels rather than jumping. The breadcrumb *Catalogue / Civil Engineering / Soil Mechanics / Direct Shear Test* is the point |

**Say:**

> "This is what anyone can see before signing in — a prospective institution browsing what we
> offer. The structure is Programme or Department, then Course, then Experiment. Civil
> Engineering, Soil Mechanics, Direct Shear Test.
>
> And then the part that matters commercially: the same experiment is offered in **more than one
> technology**. This one runs on the Web, in VR and in AR — and each is separately selectable and
> separately licensable. An institution with no headsets can buy the Web version alone."

Scroll to *Available technologies & device requirements* and read one device line aloud, then to *Learning outcomes*.

> "The learning outcomes are on the public page deliberately — they are what a prospective
> institution and every enrolled student read. They are written by our **Academic Reviewer**, not
> by the content vendor. I'll come back to that."

**Expected state** The Experiment page shows: summary, technology badges (Web / VR / AR) and the version, *Learning outcomes* (3), *Available technologies & device requirements*, a *Preview* placeholder, and an **INSTITUTIONAL ACCESS** panel with technology checkboxes and **Add to selection**.

**Business rule** Public discovery before login is required, and a public Experiment page shows academic and technology information — **and no price.**

**Screenshot?** **Yes** — the Experiment page. It is the clearest single picture of Programme → Course → Experiment → technologies.

> **If asked "where is the price?"** — no pricing is configured anywhere in this build, on purpose.
> Pricing construction is not settled and nothing has been invented. See open question **D9**.

---

# PART 2 — The institutional request · 2 min

**Role** Public · **Requester scenario A — Internal institution (WILP-type) (BITS Community)** (set in the prototype strip)

| Step | Action |
|---|---|
| 1 | On **Direct Shear Test**, tick **Web**, **VR** and **AR**, then **Add to selection** |
| 2 | Go to **Catalogue → Soil Mechanics → Consolidation Test**, tick **Web** and **VR**, then **Add to selection** |
| 3 | Open **Selection** in the header |
| 4 | Read the summary: *Experiments 2 · Technology selections 5* |
| 5 | **Prepare institutional request** |
| 6 | Institution, SPOC and email are prefilled. Type **40** into **Users / licences required**, choose **Yearly** |
| 7 | **Submit institutional request** |

**Say:**

> "An institution builds up what it wants — the experiments, and for each one the exact
> technologies. Two experiments here, five technology selections between them.
>
> This is a **selection basket, not a shopping cart.** There is no checkout and no payment
> anywhere on this screen. It says so: *'A selection is not access.'*
>
> Then the request itself. Who they are, who to talk to, **how many licences** — forty — and
> **for how long** — a year. That is the whole commercial ask."

**Expected state** Lands on `#/request-status/REQ-001`, status **Submitted — awaiting platform review**, with the requested content, the licence count, the term, *Payment — Not required for this access context*, and a **History** entry.

**Business rules**
- The B2B basket prepares a request; it never checks out.
- Licence quantity comes from the request. There is **no platform-wide cap.**
- Access is never granted before approval.

**Screenshot?** **Yes** — the Selection screen with *Request summary*, and the submitted request status.

> The request form carries a visible **PROTOTYPE ONLY** note: the rule that classifies an
> institution as internal or external is not confirmed and is not implemented — here it comes from
> the seeded scenario. That is open question **D2**. Say so if asked; don't volunteer it yet.

---

# PART 3 — The Super Admin decision · 3 min  ← *the most important segment*

**Role** Super Admin (prototype strip → **Super Admin**)

| Step | Action |
|---|---|
| 1 | **Access requests** → open **REQ-001** |
| 2 | Click **Approve request** *without* typing a reason |
| 3 | Read the refusal, then look at the allocation panel |
| 4 | Under **Direct Shear Test**, **untick AR** |
| 5 | Change the approved quantity **40 → 30** |
| 6 | Change the approved term **Yearly → Quarterly** |
| 7 | Type a reason, e.g. *"Approved for the Geotechnics pilot. AR is held back for Direct Shear until headsets are provisioned; quantity and term reduced to match the current cohort."* |
| 8 | **Approve request** → read the confirmation dialog aloud → **Approve** |

**Say (step 2–3):**

> "First thing — I'll try to approve it without saying why."

*(the screen answers: **This decision cannot be recorded yet — Enter the reason for this decision**)*

> "It won't let me. A reason is **required**, on either outcome, and it goes on the history trail
> and is shown to the institution. That is not a form validation nicety — the platform refuses to
> record a decision nobody can account for."

**Say (step 4–6):**

> "Now the part I most want you to look at. They asked for two experiments, five technology
> variants, forty licences, for a year. I don't have to take that or leave it.
>
> I can decide they get **AR later** — untick it. Thirty licences, not forty. A quarter, not a
> year. This heading is the whole rule: *'What this institution will receive — **adjust only if it
> should get less than it asked for**.'*
>
> I can narrow this in any direction. I **cannot widen it.** I cannot add an experiment they
> didn't ask for, a technology they didn't ask for, a licence above forty or a term beyond a year.
> If they need more, that is a new request. The platform refuses a wider grant in the state layer,
> not just in this form."

**Say (step 8) — read the dialog:**

> *"The institution receives less than it requested — 4 of 5 technology variants, 30 of 40
> licences, Quarterly instead of Yearly. The reason is shown to them. Internal route (BITS
> Community): tenant access activates immediately — there is no payment step. **Activation
> entitles no student. The Tenant Admin still has to assign the content.**"*
>
> "That last sentence is the second boundary, and I'll prove it in a moment."

**Also point out, briefly:**

> "Two outcomes exist here — **approve**, and **request more information**, which sends it back to
> the institution with the reason and lets them reply and resubmit. There is no *reject*. The
> screen says so, in its own words, because no source we have defines what a refusal would mean."

**Expected state** REQ-001 → **ACTIVE**. Access record **ACC-001** written with the **narrowed** grant. Zero students entitled.

**Business rules**
- A required, recorded, applicant-visible reason on **either** decision.
- **The Super Admin controls what the tenant receives, and may only narrow.**
- Internal / BITS Community route: **no payment step anywhere.**
- Activation entitles nobody.

**Screenshot?** **Yes — two.** The decision surface with the narrowed allocation, and the confirmation dialog. These two images carry more of the business model than any other pair in the demo.

---

# PART 4 — The external institution lifecycle · 3 min  ← *the Implementation-07 correction*

This is the segment to slow down on. It is where the model was corrected and where a
misunderstanding would be most expensive.

**Role** Public → Super Admin → Public

| Step | Action |
|---|---|
| 1 | Prototype strip → **Public**. Set **Requester scenario B — External institution (Subscription)** |
| 2 | **Catalogue → Surveying → Total Station Experiment** · tick **Web** and **AR** · **Add to selection** |
| 3 | **Selection → Prepare institutional request**. Note it is now prefilled as **Northfield Institute of Technology / Prof. Daniel Mensah** |
| 4 | Enter **25** licences, **Yearly**, **Submit institutional request** → `REQ-002` |
| 5 | **Super Admin → Access requests → REQ-002**. Read the two decision notices |
| 6 | Type a reason, approve **exactly as requested** (change nothing) |
| 7 | **Institutions** — look at the list |
| 8 | Open **Northfield Institute of Technology** |
| 9 | Prototype strip → **Public → Requests → REQ-002** (or go straight to `#/payment/REQ-002`) |
| 10 | Click **Payment declined** first |
| 11 | Then click **Payment successful** |

**Say (step 5):**

> "Same screen, different route. This one is external — a paying subscription. And the screen tells
> me two different things will happen.
>
> *'Approval moves the request to Approved — payment required. Tenant access is activated only
> after payment completes.'*
>
> And: *'No institution on the platform matches this name, so approving creates a new institution
> called Northfield Institute of Technology **straight away** — you can assign its Tenant Admin
> immediately, and it receives the approved content when payment completes.'*"

**Say (step 7) — the Institutions list:**

> "There it is. **Two tenants on the platform · 1 awaiting payment.** Northfield exists. It is on
> the platform. Its Tenant Admin can be assigned right now, today, before a rupee changes hands —
> because I cannot appoint an administrator of an institution that doesn't exist.
>
> But look at the Access records column: **None yet.** And the badge: **Awaiting payment.**"

**Say (step 8) — the institution report:**

> "*'This institution exists, but holds no content yet.'*
>
> Read what that means: *'Until then nothing is assignable inside it, no student holds an
> entitlement, and no Faculty member reaches any content.'* Every figure on this page is zero.
> People, students with entitlement, approved licences, experiments held — zero.
>
> **This is the distinction I most want confirmed today.** Approving an external request creates
> the institution — its identity, its administrator, its place on the platform. **Payment
> activates the content allocation.** Those are two separate things, and the platform now treats
> them as two separate things."

**Say (step 10) — the declined payment:**

> "Three outcomes exist here, because payments have three outcomes: successful, declined, and
> not confirmed. I'll take the declined one first."

*(after clicking)*

> "*'Payment declined — nothing was activated.'* The approved allocation, the quantity and the term
> are all exactly as they were, and no student is entitled. **Only a successful payment writes
> anything.** The other two are recorded and change nothing."

**Say (step 11):**

> "Now the successful one. And now — and only now — Northfield holds an access record, twenty-five
> licences, a year, for the Total Station experiment in Web and AR."

**Expected state** REQ-002: `SUBMITTED` → `APPROVED_PAYMENT_REQUIRED` (institution created, **no** access record) → declined (nothing written) → `ACTIVE` with access record **ACC-002**. Still exactly two institutions — no duplicate was created at either step.

**Business rules**
- **External approval provisions the institution. Payment activates its approved allocation.**
- Approval creates **no** entitlement, licence or assignable content.
- All three payment outcomes exist; **only success writes.**
- A second request from an existing institution creates no duplicate.
- No payment provider, no gateway, no amount, no money.

**Screenshot?** **Yes — three.** The Institutions list showing *Awaiting payment / None yet*; the institution report's *"This institution exists, but holds no content yet"*; and the payment screen's three outcomes.

---

# PART 5 — The Tenant Admin · 3 min

**Role** Tenant Admin — **Priya Raghavan**, Sample Engineering Institute

| Step | Action |
|---|---|
| 1 | Prototype strip → **Tenant Admin** → the workspace opens on **Sample Engineering Institute** |
| 2 | **Overview** — read the attention row |
| 3 | **Content access** — open **ACC-001** |
| 4 | **Assign an experiment** → access record **ACC-001** → experiment **Direct Shear Test** → tick **Rahul Verma** → read the preview → **Create assignment** |
| 5 | Repeat for **Consolidation Test** → **Rahul Verma** |
| 6 | **Faculty mapping** → **Dr. Arjun Mehta** → **ACC-001** → course **Soil Mechanics** → leave Experiment as *Whole course context* → **Map Faculty** |

**Say (step 2):**

> "This is the institution's own administrator. And the very first thing her workspace tells her is
> the thing I promised to prove: *'1 active content access record not yet reaching any student —
> **Holding approved content does not entitle anyone.** ACC-001 has no assignment.'*
>
> The institution has been approved. It has paid, or it didn't need to. And not one student can
> open anything."

**Say (step 3):**

> "Here is what the Super Admin actually granted. Thirty approved, zero assigned, thirty
> remaining. Quarterly, until December.
>
> And look at Direct Shear Test — **Web and VR**. No AR. That is the narrowing from a few minutes
> ago, arriving here as fact. This institution cannot assign AR to anybody, because it wasn't
> granted AR."

**Say (step 4) — the preview:**

> "Before I commit anything the screen tells me what it will cost me:
> *'1 new student would consume a licence on ACC-001. Remaining allocation would go from 30 to
> 29.'*
>
> And the technologies are inherited, not chosen: *'The institution cannot add a technology it was
> not approved for, and does not remove one it was.'*"

**Say (step 5) — the licence rule:**

> "Now watch the count. I've just given Rahul a **second** experiment — and the toast says *'0 new
> students entitled, 29 licences remaining.'*
>
> **One licence is one student, not one experiment.** The screen states it: *'A student counts once
> against this record however many of its experiments they receive.'* That is our reading of the
> approved quantity, and it is one of the things I would like confirmed today."

**Say (step 6) — Faculty mapping:**

> "Faculty are different. Mapping Dr. Mehta to Soil Mechanics gives him the two experiments in that
> course — and the screen is emphatic: *'**Faculty mapping does not consume the student
> allocation.**'* The toast confirms it: *'Dr. Arjun Mehta mapped. **No student licence was
> consumed.**'*
>
> Also note what the Course dropdown offered me: only **Soil Mechanics**. Nothing outside the
> institution's approved access is reachable from this plane at all."

**Expected state** ACC-001: **approved 30 · assigned 1 · remaining 29**. Rahul Verma entitled to two experiments in Web and VR. Dr. Arjun Mehta mapped to Soil Mechanics.

**Business rules**
- **The Tenant Admin is the only writer of student entitlement.**
- **One licence = one active student**, per access record, regardless of experiment count.
- Faculty mapping consumes **no** student licence and entitles no student.
- Assignment is bounded by the approved set, quantity, technologies and term.
- The Tenant Admin **cannot** redefine the canonical catalogue — Programme, Course and Experiment names are platform-controlled.

**Screenshot?** **Yes — two.** The Content access card (*Approved 30 / Assigned 0 / Remaining 30* and Direct Shear showing Web + VR only), and the Faculty mapping screen with the *does not consume the student allocation* callout.

---

# PART 6 — Faculty · 2 min

**Role** Faculty — **Dr. Arjun Mehta**

| Step | Action |
|---|---|
| 1 | Prototype strip → **Faculty** → choose **Dr. Arjun Mehta** |
| 2 | **My Content** — the mapped table, then scroll to *Experiments available to Sample Engineering Institute* |
| 3 | **Question Bank** — glance at it |
| 4 | **Assessments** → open **Consolidation Test** → look at its settings and questions |
| 5 | **Reviews** — read the *You are the evaluator* panel |
| 6 | **Student Progress** |

**Say (step 2):**

> "Dr. Mehta sees exactly what he has been mapped to — two experiments, in the technologies the
> institution holds, and how many students are entitled to each.
>
> Then this second table, which is new and deliberately read-only: *'Experiments available to
> Sample Engineering Institute'* — everything the institution holds, marked mapped or not mapped to
> him. *'**This is not your mapping.** You can configure an assessment, see students and evaluate
> answers only for the rows marked Mapped to you — your Tenant Admin decides the rest.'*
>
> He can see what the institution bought. He gains no authority over any of it."

**Say (step 4):**

> "Assessment configuration belongs to Faculty. The questions, the pass mark, how many attempts,
> and — importantly — **when answers and explanations become visible** to the student.
>
> There are three options: immediately, after the deadline, or on a date he sets. This one is set
> to after the deadline. Which of those should be the **institutional default for BITS** is not
> something we have been told, so we have not invented it. That's on my questions list."

**Say (step 5) — the point of the whole segment:**

> "And this is the one I will not let slip past. *'**You are the evaluator.** A written answer is
> evaluated by the Faculty member mapped to the Experiment. No other role marks it, and **no result
> exists for it until you confirm one.**'*
>
> There is an AI assist available, and here is exactly what it is: *'A local prototype suggestion
> is offered on each response, which you accept, change or ignore… This is a preference about how
> you work, **not a change of who evaluates.** Either way the result exists only once you confirm
> it.'*
>
> The platform can draft. **The platform cannot decide.** That is enforced in the code, and it is
> covered by automated tests that fail if anyone ever tries to loosen it."

**Say (step 6):**

> "And the analytics. Every number here is a count of the rows underneath it — students entitled,
> not started, in progress, awaiting review, completed. No score, no index, no ranking, no
> prediction, no attendance. The screen also flags that *'Completed'* is a prototype rule, not an
> academic policy, and says what the rule is."

**Expected state** My Content shows 2 mapped experiments. Question Bank holds the seeded sample questions. **Reviews is empty** — nothing has been submitted yet.

> **Handle the empty review queue head-on, don't apologise for it.** Say:
> *"Nothing is waiting for him right now, because no student has submitted a written answer yet.
> I'm about to create one — and then I'll come straight back here."*

**Business rules**
- Faculty reach is bounded by mapping; visibility of institutional holdings is read-only.
- Faculty own assessment configuration and the Question Bank (Add · Edit · **Delete**).
- **Faculty is the only human evaluator of a written answer. AI may suggest; it may never decide.**
- Faculty cannot publish, release, add an ungranted technology, or change licences or assignments.

**Screenshot?** **Yes** — the *You are the evaluator* panel with the review-assistance options beneath it.

---

# PART 7 — The Student · 3 min (+ a 45-second return to Faculty)

**Role** Student — **Rahul Verma**

| Step | Action |
|---|---|
| 1 | Prototype strip → **Student** → choose **Rahul Verma** |
| 2 | **My Learning** — two experiments, each showing its own technologies |
| 3 | Open **Direct Shear Test** |
| 4 | Point at the four numbered steps, the resources, then the **Simulation** section |
| 5 | Under **Web**, click **Open the simulation** → **Open the Web simulation** |
| 6 | Back to the experiment. Point at the **Assessment** card and read the "one assessment" line |
| 7 | **My Learning → Consolidation Test → Go to the assessment → Start the assessment** |
| 8 | Answer the three objective questions, type two sentences into **question 4**, **Submit assessment** → **Submit** |
| 9 | Read the result screen |
| 10 | **Prototype strip → Faculty → Reviews → Review (Rahul Verma)** — award marks, **Confirm review** |
| 11 | **Prototype strip → Student → Progress** |

**Say (step 2–3):**

> "Rahul only sees what was assigned to him — and he sees each experiment in the technologies his
> institution holds. Web and VR. Not AR, because his institution wasn't granted AR for Direct
> Shear.
>
> Nothing about being a student at this institution, or being on this course, or being in a group,
> put anything on this screen. **Only the assignment did.**"

**Say (step 4–5):**

> "The experiment is four steps: resources, simulation, assessment, completion. The resources are
> recommended, not a gate — he can go straight to the simulation, and the screen says so.
>
> And the simulation is **per technology.** Web runs in the browser; VR is an authorised package
> for a headset the institution provisioned. *'Each technology is tracked on its own. Completing
> one does not complete another.'*
>
> This button opens a stand-in, and it says so — there is no real XR runtime in this prototype."

**Say (step 6) — the granularity rule:**

> "But the **assessment is not per technology.** *'One assessment covers this experiment. You are
> not asked to sit it again for each technology your institution made available to you.'*
>
> That distinction was a deliberate decision, and it is worth confirming: **simulation is
> technology-specific; assessment belongs to the Experiment.**"

**Say (step 8–9) — the handoff:**

> "This assessment has three marked questions and one written answer. The marked ones score
> instantly. The written one does not.
>
> *'**Pending Faculty review.** Your written answer is with your faculty for review. Until that
> review is done, this experiment is not counted as finished.'*
>
> And his marks are withheld — because his faculty set this assessment to release answers after the
> deadline. Not the score, not even the objective sub-score. Releasing part of it early would be
> releasing the outcome by another name."

**Say (step 10) — the return to Faculty:**

> "So let's go and be his faculty member for thirty seconds."

*(Faculty → Reviews — the response is now in the queue)*

> "There he is. The question, the guidance, and his actual answer. Marks out of three, optional
> feedback, **Confirm review**. And the screen is clear about what that does and what it costs:
> *'Confirming records the marks and completes this response. It cannot be changed afterwards in
> this prototype.'*
>
> Whether a Faculty member should be able to **revise** a confirmed mark — and who would authorise
> that — is not established anywhere. So we built no re-grading workflow, and the screen says so
> rather than hiding a button. Another one for the list."

**Say (step 11):**

> "And his progress. Per technology, and rolled up to the experiment. *'Completed'* here means
> every resource marked done, the simulation completed for **every** technology he holds, and the
> assessment passed. That is the most conservative reading we could take — it is labelled a
> prototype rule on the screen, because no institutional completion policy exists yet."

**Expected state** Direct Shear: Web simulation opened and recorded. Consolidation: attempt 1 submitted, result **Pending Faculty review**, marks withheld → after the Faculty confirmation, evaluated but still withheld until the deadline, and the student is told when it becomes available.

**Business rules**
- Entitlement is the only key. Publication, activation, group and course membership grant nothing.
- **Simulation is technology-specific; the assessment belongs to the Experiment.**
- A written answer goes to a human Faculty member; the result does not exist until they confirm it.
- The visibility policy governs the whole outcome, including the objective sub-score and the retry.

**Screenshot?** **Yes — two.** *My Learning* (entitlement, per-technology), and the *Pending Faculty review* result.

---

# PART 8 — Content governance · 2 min

**Role** Vendor → Academic Reviewer → Content Manager → Super Admin

| Step | Action |
|---|---|
| 1 | Prototype strip → **Vendor** → **Ananya Rao** → **Submissions** — show **Differential Levelling Exercise (sample)** with the reviewer |
| 2 | Prototype strip → **Academic Reviewer** → **Dr. R. Iyer** → **Queue** → open **Differential Levelling Exercise (sample)** |
| 3 | Type one learning outcome, **Add outcome**, then **Approve academically** → **Approve academically** |
| 4 | Prototype strip → **Content Manager** → **M. Kulkarni** → **Queue** → open the same record |
| 5 | **Publish** → read the dialog aloud → **Publish** |
| 6 | Prototype strip → **Super Admin** → **Content governance** |

**Say (step 1–2):**

> "Where does content come from. A **Vendor** submits it — the build, the per-technology delivery,
> the documentation, the technical notes. What a Vendor cannot do: write the learning outcomes,
> set a price, or publish. Any of those.
>
> It goes to an **Academic Reviewer**, who validates it against the course — and who **owns the
> learning outcomes.** Look: *'Learning outcomes — **You own these**.'*"

**Say (step 3):**

> "And it won't let me approve without one: *'Record at least one Learning Outcome before
> approving.'* They are published on the public page, so approving with none would publish an empty
> section.
>
> When I approve: *'Approval does not publish this experiment, and it grants it to no
> institution.'* It moves to the Content Manager."

**Say (step 5) — read the dialog:**

> "The **Content Manager** publishes. That is the first publication of a new experiment, and it is
> theirs.
>
> *'Publishing grants access to nobody. It makes the experiment discoverable and requestable. An
> institution still submits a request, the Super Admin still approves it, and a Tenant Admin still
> assigns it before any student can see it.'*
>
> That is the first boundary, in the product's own words, at the moment it matters."

**Say (step 6) — Publish vs Release:**

> "Now the distinction I need to be precise about, because we use two different words on purpose.
>
> **Publish** is the first time a new experiment reaches the catalogue. That is the Content
> Manager's.
>
> **Release** and **Hold** apply to a **later version** of something already published. That is
> the **Super Admin's**. And this workspace states it: *'Release and Hold apply to a LATER version
> of an already-published Experiment. The first publication of a new Experiment is the Content
> Manager's, and **there is no publish control anywhere in this workspace**.'*
>
> The path for a later version is: the Vendor proposes it, the Academic Reviewer approves it, and
> the Super Admin decides to release or hold it. **Releasing a later version grants nobody
> anything** — no new institution access, no new licence, no new student. It changes which version
> the catalogue shows, under the same experiment identity.
>
> And I should flag: **whether the Content Manager should also be a gate on a later version, and
> whether academic re-review should be required for one at all, is not something we've been told.**
> We built the shortest defensible path and recorded it as a judgement, not a policy. That is my
> first question for you."

**Expected state** `EXP-008` travels `ACADEMIC_REVIEW` → `CONTENT_REVIEW` → `PUBLISHED` and appears in the public catalogue. **Nothing** about tenant access, allocation, entitlement or Faculty reach changes.

**Business rules**
- Vendor submits · Academic Reviewer validates and owns Learning Outcomes · Content Manager publishes.
- Academic approval requires at least one Learning Outcome.
- **Publishing writes the record's status and a publication record, and nothing else.**
- **Publish ≠ Release.** Neither word appears as an action on the other's plane.
- A later version never becomes a second Experiment, and grants no new access.

**Screenshot?** **Yes** — the Publish confirmation dialog. *"Publishing grants access to nobody"* is the single best sentence in the build.

### Optional — drive the later version live (+3 min)

Only if the meeting has room. Verified working:
**Vendor → Ananya Rao → Versions → Propose a version** on *Direct Shear Test* → label `1.1`, describe what changed → **Save the version** → **Submit for academic review** → **Academic Reviewer → Dr. R. Iyer → Queue →** the version → **Approve version** → **Super Admin → Content governance →** open **Direct Shear Test** → **Release version**.

The release dialog is worth reading aloud: *"This grants no tenant anything. No access record, licence quantity, technology variant or student assignment changes, and no student's progress or attempt history is affected."*

The version form also states an open policy in its own copy: *"this form cannot add or remove a technology — a released version never changes which technologies an Experiment offers, because no source says what that should do to a tenant that already holds one."* That is open question **D2** in `OPEN_DECISIONS_FOR_STAKEHOLDER.md`.

---

# PART 9 — Operations · 1 min

**Role** Super Admin → **Operations**

One screen. Do not click anything except the expiry control.

**Say:**

> "Three operational capabilities, and I want to be honest about the edges of each.
>
> **Device replacement.** A student whose headset broke raises it from their own workspace. It
> goes to **their own institution's Institute / Tenant Admin first** — they are the point of
> contact, they review it and forward it — and only then does it arrive here for the final
> decision. *'A decision here moves the authorised device binding and nothing else. It consumes no
> licence, grants no experiment, adds no technology, and changes no assessment state.'* And:
> *'**There is no device registry anywhere in the platform**'* — we approve a transfer; we do not
> register, certify or configure hardware.
>
> *(If the queue is empty, that is correct: a request that has not been forwarded is sitting with
> the institution, and the table says so in its* Currently with *column.)*
>
> **Support.** Anyone can report a technical issue from their own workspace and see the state of
> it. *'No response time is promised, no priority is assigned, no external ticketing provider is
> integrated, and no notification is sent to anybody.'* An SLA model was explicitly not to be
> invented, so it isn't there.
>
> **Deactivation** — of an institution or of a student — is reversible. It preserves every record
> and removes effective access. Nothing is destroyed.
>
> And the **15-day expiry reminder.**"

Set **Access record** to `ACC-001`, **Ends in** to **15 days (reminder due)**, click **Move the end date**.

> "That control is prototype-only and labelled as such — the shortest term we offer is monthly, so
> you can't reach the 15-day state by using the product. It just winds the clock forward.
>
> And here is the honest bit, in the product's own words: **DELIVERY CHANNEL PENDING.** *'A tenant
> must receive an expiry reminder 15 days before the access term ends. That requirement is
> confirmed; the delivery channel is not, so this build represents the reminder as an operational
> due-state here and on the tenant's own workspace. **No email, SMS, push or notification of any
> kind has been sent**, and no provider is integrated. There is no automatic renewal, payment or
> extension.'*
>
> So: how should that reminder actually reach them, and who should receive it?"

**Business rules** A device request is routed through the institution's Tenant Admin before it reaches the Super Admin, who remains the final decision maker. Device transfer changes device authorisation only. Support resolution changes no entitlement or content state. Deactivation preserves records and removes effective authority. The 15-day reminder is required; the channel is not decided. Renewal follows the institution's own onboarding route and extends nothing until that route completes.

**Screenshot?** **Optional** — the Operations screen, mainly for the *DELIVERY CHANNEL PENDING* note.

---

# PART 10 — Closing · 1 min

Stay on screen. Don't open anything new.

**Say:**

> "That is the whole B2B operating model, running end to end. Content produced and published;
> an institution requesting specific technologies and licences; a platform decision that can narrow
> but never widen; an institution that exists before it holds anything; an administrator deciding
> who gets what; a faculty member who is the only human evaluator; and a student whose access came
> from one place and one place only.
>
> Three things to hold on to.
>
> **First — this is a functional build, not a designed one.** The final visual design has
> deliberately not been started. What you have been looking at is the operating model wearing its
> working clothes. That is next, and it is a separate piece of work.
>
> **Second — every label you saw that says PROTOTYPE ONLY, NOT IN THIS BUILD or DELIVERY CHANNEL
> PENDING is there on purpose.** They are the record of what we have not been told yet. We chose to
> show a gap as a gap rather than as a disabled button, or worse, as an invented answer. They come
> out when you decide, not before.
>
> **Third — and this is why we are having this meeting now rather than after the redesign.** There
> are a handful of places where we had to make a judgement call because the source material is
> genuinely silent. Changing any of them **today** is a change to a rule. Changing them after the
> visual design is a change to a rule **and** to every screen that expresses it.
>
> So: what I need from this session is your corrections on workflow, on terminology, on who owns
> what, and on the business rules — and I have a short list of specific questions to put to you."

Then move to **`OPEN_DECISIONS_FOR_STAKEHOLDER.md`** and capture answers with **`STAKEHOLDER_REVIEW_CHECKLIST.md`**.

---

## Timing

| Part | Segment | Min | Cuttable? |
|---|---|---:|---|
| 1 | Public discovery | 2 | Trim to 1 |
| 2 | Institutional request | 2 | No |
| 3 | **Super Admin decision** | 3 | **No — never cut** |
| 4 | **External lifecycle** | 3 | **No — never cut** |
| 5 | Tenant Admin | 3 | Trim to 2 (skip the second assignment, lose the licence proof) |
| 6 | Faculty | 2 | Trim to 1 (My Content + Reviews only) |
| 7 | Student | 3 | Trim to 2 (skip the simulation screen) |
| 8 | Content governance | 2 | Trim to 1 (publish `EXP-009`, skip the reviewer step) |
| 9 | Operations | 1 | Cut entirely if needed |
| 10 | Closing | 1 | **No** |
| | **Core total** | **17** | |
| + | Later version driven live (Part 8 optional) | +3 | |
| + | Q&A buffer | +5 | |

**If you have only 10 minutes:** Parts 2 → 3 → 4 → 5, then Part 10. That is publication-independent
and still lands all three boundaries. Open on the catalogue for 30 seconds of context first.

---

## Presenter guardrails

1. **One reset at the start. None after.** Every part depends on the previous one.
2. **Requester scenario A for Parts 2–3, B for Part 4.** Getting these the wrong way round breaks the payment story — the internal route has no payment screen at all.
3. **Internal first.** The first request submitted becomes `REQ-001`; the script assumes that.
4. **Say "prototype controls", not "log in".** The dark strip at the top is a view switch, not authentication. There is no authentication in this build. If asked: it is out of scope for the prototype and unchanged in the architecture.
5. **Don't hide the gap notes — read them.** They are the most credible thing on the screen. A stakeholder who spots one you skipped will wonder what else you skipped.
6. **Never say "we decided" about an unconfirmed rule.** Say *"we made a judgement because nothing told us, and it is on my questions list."* The distinction is the entire point of this meeting.
7. **Don't defend the visuals.** If design comes up: *"Noted for Implementation 08 — and please keep them coming, that list is genuinely useful."* Then write it in the checklist and move on.
8. **Don't click anything on the Operations screen except the expiry control.** See the do-not-touch list in `DEMO_RESET_AND_REHEARSAL.md`.
