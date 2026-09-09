# Implementation 08 — UX / product closure pass

**What this pass was for.** The unified B2B prototype was functionally complete and
verified: 1292 deterministic assertions passing, every workflow reachable, every authority
boundary enforced. What it was not, was one product. Screens read as engineering artefacts —
dashed notice panels explaining unresolved decisions, paragraphs defining internal vocabulary,
the same action offered twice under two names, a single record marooned in a grid built for
twelve. This pass fixed the presentation without touching a single guard.

**What it deliberately was not.** Not a rewrite, not a re-audit, not a new framework, not a
speculative feature pass, not B2C, and not permission to simplify working business logic.

> **Scope note.** `B2B_FUNCTIONAL_CLOSURE_AUDIT.md` §10 already scoped Implementation 08 as the
> visual design pass — design system, typography scale, spacing rhythm, card and density polish,
> layout refactor — and stated that structural accessibility and responsive *defects* were
> functional work already completed at 07. That held. The baseline audit at the start of this
> pass found **zero** horizontal overflow, duplicate ids, nameless controls, heading skips, raw
> entities or undersized targets across 144 routes × 5 widths. Nothing structural needed repair.

---

## 1 · The authority chain, corrected

The working brief for this pass named the **31 August** stakeholder update as the overriding
authority. That is the base authority, but it is **not the most recent**. Two later
stakeholder-confirmed records live inside this build folder and supersede prototype assumptions
where they conflict:

| Record | Date | What it settles |
|---|---|---|
| `stakeholder-review/STAKEHOLDER_CORRECTIONS_07_2.md` | 6 Sep 2026 | A re-request / additional licences · B XR completion undecided · C device-transfer routing via the Tenant Admin · D renewal through the original onboarding payment route · **E canonical Course Code ownership** · F Super Admin overall control |
| `stakeholder-review/STAKEHOLDER_CLOSURE_07_3.md` | 7 Sep 2026 | Closure against the full meeting transcript and tracker (R01–R22, open decisions D25–D29) |

**Traceability, checked rather than assumed.** These are not implementation reports that outrank a
stakeholder decision by being newer. Each of 07.2's six decisions opens with the stakeholder's own
words — *"Content Manager primarily. Super Admin will also get access to it."*, *"This is yet to be
decided. We have discussed an API-call method…"*, *"Any request from institution should come
through Tenant Admin…"* — and 07.3 attributes its course-code row (R19) to **"Written clarification
E"**, the same stakeholder source. So they carry stakeholder authority, not authorial authority.

**And their precedence is narrower than "they supersede 31 August."** 07.2's own wording is
*"these decisions supersede **prototype assumptions** where they conflict"* — prototype
assumptions, not STK31 decisions — and it adds that nothing is back-dated. 07.3 records that none
of them reopens an STK31 decision; they answer questions STK31 left open. The accurate statement,
which replaces the looser one this document carried:

> **31 Aug remains the governing stakeholder decision set. The 6 and 7 Sep written clarifications
> are stakeholder-sourced answers to questions 31 Aug did not settle, and they override earlier
> *prototype assumptions* — not earlier stakeholder decisions.**

This matters for exactly one decision in this pass: **the platform-vs-institution course-code split
rests on 07.2 §E, and could not have rested on 31 August** — on 31 August no canonical code existed
in the model at all, which is why STK31-11/25/26 assign only the *local* code an owner.

---

## 2 · The design system, and what was missing from it

The existing token set and component grammar were sound and stayed. What the build did not have
was a vocabulary for anything *other* than "another card on a stack", which is most of why long
operational screens read as one endless column.

### Tokens added — `css/tokens.css`

| Token group | Why |
|---|---|
| `--s-1 … --s-10` spacing scale | Padding and gaps were being set as loose literals — 11px, 13px, 14px, 16px, 18px, 20px and 22px all appeared for the same job. One scale is what makes separate screens read as one product. |
| `--t-eyebrow … --t-3xl` type scale, `--lh-*`, `--w-*` | The sizes already in use, named, so "semibold" means one thing product-wide. |
| `--sheet-w` | The side sheet's width. |

Existing literals were not rewritten wholesale; new and reworked surfaces use the scale.

### Components added — `css/components.css` + `js/components.js`

| Helper | The problem it solves |
|---|---|
| **`ui.openSheet()`** — side sheet | **The surface that was missing.** The product had exactly one overlay, the confirmation dialog, so anything too big for a dialog and too secondary for a page became another stacked card. Shares one focus trap, Escape handler and focus-restore with the dialog; `onConfirm` receives the detached body so inputs remain readable. Bottom sheet under 640px. |
| **`ui.metrics()`** | The replacement for explanatory prose: `5 licences · 1 assigned · 4 remaining · expires 7 Dec 2026` instead of a paragraph defining what an access record is. |
| **`ui.statStrip()`** | `.statgrid` tiles are 26px figures in 160px boxes — right for an overview, far too loud repeated down an operational page. |
| **`ui.emptyRow()`** | `.empty` is 48px of padding and a 48px medallion. Correct when the empty state *is* the page; half a viewport of nothing when it is one quiet queue. `ok:true` states "nothing needs attention" as a result, not an absence. |
| **`ui.about()`** | The honest replacement for a user-facing `gapNote`: same information, product language, folded away. |
| **`ui.demoPanel()`** | Where a genuinely prototype-only control goes, so it stays available for a demo without shaping the product around it. |
| **`ui.track()`** | One workflow stepper. The Student's `.seqstrip` was the only stepper in the build; the request and production chains had none. |
| **`ui.sectionHead()`** | Page-level zoning above cards, so a long screen reads as a few areas rather than a stack of boxes. |
| **`ui.dangerZone()`** | Consequential actions separated from the information they sit beside. |
| **`ui.platformCode()` / `ui.institutionCode()` / `ui.codePair()`** | See §4. |
| **`ui.infoTip()`** | A real button with a real expanded state. `title` is unreachable by keyboard and unread on touch, so it is not used for anything a user needs. Wired once centrally in `app.js`. |

**One consolidation, not an addition:** `openDialog` was rebuilt on the same `mountOverlay`
primitive as the sheet. Two overlays maintaining two copies of a focus trap is how one of them
quietly stops trapping. The dialog's contract is unchanged and is asserted.

---

## 3 · Delete / retire of canonical structure — the decision, and the evidence

**Decision: no delete control, no retire control, for a canonical Programme / Department or
Course. This pass adds neither.**

This was considered seriously rather than deferred. An exhaustive source audit was run across
`00-project-context`, `15-post-pm-alignment`, `16-unified-product-planning`,
`17-stakeholder-correction-blueprint`, `requirements/updated-frd` and this build's own records.

**What the sources say:**

- The FRD corpus (Core · Detailed · TL) contains **zero** occurrences of *delete*, *retire*,
  *deprecate*, *unpublish*, *cascade*, *purge* or *soft delete* — verified by direct text
  extraction, sanity-checked against 225 hits for "Super Admin" and 133 for "Course".
- `17-.../17_CONCEPTUAL_DATA_AND_STATE_MODEL.md`, whose entire purpose is to enumerate records
  with owners and state, gives **AcademicGrouping, Course and Experiment no lifecycle at all**.
- `STK31-22` ("prefer reversible status change / deactivation over physical deletion") scopes
  itself by its own text to **tenant termination, student removal and the Question Bank Delete**
  — not to canonical structure.
- Unpublishing content is not merely unaddressed, it is **refuted** (Batch 05 `R-14`, re-affirmed
  by STK31-06/07 and enforced in code).
- The only confirmed cascade-shaped rules in the corpus are at **Question**, **Tenant** and
  **Student** level. None at structure level.
- Within this codebase, *"a Course id never changes and nothing deletes a Course"* is already a
  **load-bearing assumption** — it is what made an `Object.prototype` id collision unrecoverable
  from inside the product, and the fix relied on ids being permanent.

**Why not even a guarded delete of a zero-reference record?** It was the strongest candidate, and
it was rejected on evidence: the dependency counter it would have to trust was **incomplete**
(§3.1). A control whose safety rests on a count that under-reports is not a guarded control. With
the count corrected, adding deletion would still introduce a state transition no source
describes, against a codebase that assumes ids are permanent.

**What changed instead:** the ~700-character dashed panel beginning *"No source describes a
create, retire or delete operation for these records"* is gone from the stakeholder-facing
screen. The reasoning is preserved in code comments and here. The product simply does not offer
an unsafe action, and where a record cannot be removed the screen states that as a short fact
about *that record*, next to its dependency figures.

### 3.1 · A real defect found while deciding this

`state.courseUsage()` counted five reference classes. **Six** collections carry a `courseId`:
the **Question Bank** was invisible to it.

Latent on seed data — no seeded Course has a zero count on the other five — but wrong in exactly
the case the screen exists for. A Course whose content records, tenant mappings, role
assignments, faculty mappings and enrolments had all been cleared, but against which a Faculty
member had written a question bank, reported **"Not yet referenced"** to a Super Admin. Any
removal control built on that reading would have orphaned the bank silently.

Fixed, and the number is now correct because it is shown to a Super Admin as a statement of
fact — independently of the fact that nothing may be removed. A Programme-level counterpart,
`state.groupingUsage()`, was added for the same reason.

Covered by 21 new assertions, including four that assert the *absence* of a removal API:

```
PASS  THE STATE LAYER EXPOSES NO deleteCourse
PASS  and no deleteGrouping
PASS  and no retireCourse
PASS  and no retireGrouping
```

---

## 4 · The two course codes

Settled by `STAKEHOLDER_CORRECTIONS_07_2.md` §E, verified at closure 07.3.

| | Platform course code | Institution course code |
|---|---|---|
| Example | `CE G511` | `CE-306` |
| Stored on | the canonical Course record (`courses[].code`) | the tenant's course mapping (`courseMappings[].localCode`) |
| Owned by | **Content Manager** (primary), **Super Admin** (also) | **Tenant Admin** |
| Blank? | **Yes — permanently legitimate.** Seeded blank; inventing one would put fabricated institutional data on the public catalogue. | Blank until the institution sets it |

**The stakeholder-confusion fix.** The two were being labelled four different ways across four
surfaces and rendered in matching styling, so `CE G511` and `CE-306` read as rival values for one
thing. They now never get matching styling: the platform code renders as an *issued identifier*
(`ui.platformCode`, monospace on a tinted chip), the institution's as ordinary text
(`ui.institutionCode`). Labels are exactly **"Platform course code"** and **"Institution course
code"** — "canonical code" is gone from user-facing copy.

**Both appear together on one screen only** — the Tenant Admin's academic mappings, where the
mapping between them is the subject, with the helper *"Maps your institution's course code to the
platform Course. It does not change the platform course code."*

### What is confirmed, and what is ours

These are different things and the earlier version of this document blurred them. Separated:

| | Status |
|---|---|
| Two separate fields, two separate owners — platform code on the canonical Course, institution code on `courseMappings[].localCode` | **Source-confirmed.** Written clarification E, 6 Sep 2026, stakeholder verbatim: *"Content Manager primarily. Super Admin will also get access to it."* Re-verified at closure 07.3 R19 |
| Blank is a permanent legal state for the platform code | **Source-confirmed** (07.2 §E) |
| A Tenant Admin can never reach the platform code | **Source-confirmed** (07.2 §E, STK31-10) |
| Nothing in the build resolves *by* code — CSV and manual entry resolve structure by name | **Source-confirmed** (07.2 §E) |
| Calling them **"Platform course code"** and **"Institution course code"** | **Directed by the project brief for this pass.** The sources use several words for the platform one — *canonical*, *official*, *platform-wide* — and never settle a user-facing label. One name was chosen and applied everywhere |
| **Which code a Student sees** | **NOT source-confirmed. A reversible UX judgement.** See below |

**The Student display is our judgement, not a stakeholder decision.** An exhaustive search of the
FRD, the 31 Aug decisions, the correction blueprint, the 6 Sep clarifications and the 7 Sep
closure returns **no statement, at any date, about which code a Student sees.** This build shows
the **institution's** code, because the platform code is governance vocabulary a learner has no
use for and because showing both is what produced the "why does one course have two codes?"
question in the first place.

The screen renders the value with **no label asserting which kind it is**, so nothing the Student
reads claims a convention that has not been agreed. It is one line to reverse
(`js/screens/student.js`, the *Where you are studying* card), and the reasoning is recorded there
as a judgement rather than as a rule.

> This is listed again, unresolved, in §8. Both statements are meant to stand: the **concepts and
> their ownership** are settled; the **Student-facing display convention** is not.

Independence is asserted in both directions: setting the platform code leaves the institution
code untouched, and vice versa.

---

## 5 · The Student experience

### The reported defect
Home rendered *"Continue where you left off"* with a **Continue learning** button, and directly
beneath it *"Your experiments"* — a list whose first row was **the same experiment** with its own
**Continue** button. My Learning then showed it a third time. The old code admitted it in a
comment: *"It repeats a row from the list below on purpose."*

### The fix
Not copy — information architecture. Home now answers four questions in order: what should I do
next · is anything waiting · how am I progressing · what else do I have. One featured `.focus`
card carries **the** primary action, and **the featured item is removed from the list beneath
it**. One experiment therefore renders one card and one control.

The secondary rows all read **"Open"**. Their verb used to match the featured card's, so a student
with five unstarted experiments read "Start learning" five times down one page — the same
repetition reappearing as copy instead of as layout. Each row already states its state in a badge,
so the verb is not carrying that meaning.

Verified in the running app across every entitlement count:

| Entitled | Focus cards | Experiment buttons | Primary | Duplicate controls |
|---|---|---|---|---|
| 0 | 0 | 0 | 0 | 0 |
| 1 | 1 | 1 | 1 | 0 |
| 3 | 1 | 3 | 1 | 0 |
| 5 | 1 | 5 | 1 | 0 |

A student with no entitlement gets a meaningful empty state and **no dead primary action**. An
inactive student gets the blocked state with history preserved, also with no dead action.

### My Learning
`.lgrid` is `repeat(auto-fill, minmax(330px,1fr))`, so a student holding exactly one experiment
got a 330px card marooned in ~900px of empty page. The card was never the problem — with one item
there is no grid to be in. `.lgrid.one` + `.lcard.wide` drops out of the grid and goes horizontal.

### My Device
**Already correct; verified, not changed.** The nav entry is gated on
`studentHasPackageTechnology()` *or* an open transfer request — so a Web-only student is never led
into device management, and a student whose entitlement changed while a request was pending keeps
the route to their own record. Confirmed in the running app: shown for a VR holder, hidden for a
Web-only student and for a student with nothing.

### Completion honesty
How a simulation reports completion is genuinely undecided. The dashed
**COMPLETION CONFIRMATION NOT DECIDED** panel is gone from the Student's journey; the same
statement, in full and equally honest, is now `L.completionNote()` — a folded "About this",
closed by default. It does not claim an integration exists, and it does not claim one is coming.

---

## 6 · Development clutter — the systematic pass

Measured the same way before and after, on the same clean seed, across the same 144 routes:

| | Before | After | |
|---|---|---|---|
| Routes showing engineering notices | 39 of 144 | **2 of 144** | −95% |
| `.gapnote` blocks rendered | 41 | **0** | eliminated |
| `.proto-note` blocks rendered | 5 | 2 | |
| Characters of engineering prose in product UI | **15,771** | **617** | **−96%** |

The 21 distinct tags — `NOT IN THIS BUILD`, `IMPLEMENTATION JUDGEMENT`, `OPEN POLICY QUESTION`,
`COMPLETION CONFIRMATION NOT DECIDED`, `PENDING — NOT ESTABLISHED` and the rest — are gone from
the product journey. **95 individual notices were classified and dispositioned**, each one to
exactly one of four outcomes:

- **the user genuinely needs it** → concise product help, `ui.infoTip()` or `ui.about()`
- **it documents an unresolved engineering decision** → removed from the UI, preserved as a code
  comment beside the logic and in this document
- **demo/debug only** → `ui.demoPanel()`, collapsed, visually not-the-product
- **a genuine product warning** → kept, made concise and better placed

**What deliberately remains**, and should not be read as an oversight: on a richer state, ten
`PROTOTYPE ONLY` notices survive, and every one of them says the same thing — *this build has no
authentication*. That is why a request page opens for anyone holding its address, and why the
institution named on a public panel is a prototype selection rather than a signed-in identity.
Removing those would not tidy the product; it would make it lie.

Nothing was resolved by pretending a missing integration exists.

---

## 7 · What this pass did NOT invent

No authentication provider · no SSO · no payment gateway (the payment step remains simulated and
still says so) · no notification, email or SMS delivery (the 15-day expiry reminder is an
in-product state) · no device registry, serial inventory, certification, remote management or MDM
· no analytics backend · no real AI provider (assisted drafts remain prototype-local and
deterministic) · no external ticketing, SLA, response-time guarantee or priority model · no real
file upload storage · no revenue or business metrics · no cascading deletion.

---

## 7b · Verification, and what adversarial review caught

Every area was implemented by one writer and then re-read by a separate adversarial verifier
whose only job was to find what broke. **Six areas, six verifiers.** One came back clean; five
found real defects. All were fixed, and the ones worth a permanent guard now have one.

| Found | Where | Fixed by |
|---|---|---|
| **Focus thrown behind an open modal.** Cancelling the return confirmation reopens the return sheet; the closing dialog then restored focus to the page underneath, outside the new focus trap. | `js/components.js` — my own change | The restore now defers to the callback in the two cases where the callback knows better: it opened another overlay, or it deliberately moved focus. Guarded by a new DOM interaction check. |
| **A handler's deliberate focus silently overridden.** Same root cause, opposite symptom — four Faculty flows re-focus a row after re-rendering, and the restore was undoing it. | `js/components.js` | Same rule. |
| **A page contradicting itself.** With a Vendor's scope withdrawn, the banner said none of these can be corrected and the heading below told the reader to correct and resubmit. | `js/screens/vendor.js` | The instruction now consults the same `frozen` guard the banner does. |
| **A bare "Course code" surviving at one breakpoint.** The `<th>` was relabelled but the cell's `data-label` was not — and below 740px that attribute *is* the visible field label. | `js/screens/content-manager.js` | Relabelled, plus a new assertion that scans every `data-label` for a bare "Course code". |
| **Three more course-code labels** on the Super Admin plane, including a form label and a hint calling it "canonical". | `js/screens/platform-content.js` | Relabelled to *Platform course code*. |
| **A student's account state missing.** The new short-answer branch of My device rendered without `L.accountNotice(p)`, so a deactivated Student was told only that nothing they hold runs on a device. | `js/screens/student-ops.js` | The notice renders on both branches. |
| **A false claim in the present tense.** *"You sign in on a supported device with the same institutional account… the experiment appears among the experiences you are authorised to run."* Neither is true — this build has no sign-in and delivers no package. | `js/screens/student-learn.js` | Rewritten in the conditional, with **"None of that is built yet"** stated plainly. |
| **A filter you could not clear.** The group-content search box rendered only for groups with more than four experiments, but the query was module-level and shared — so it travelled to a small group and hid its content behind an empty state with no input to clear. | `js/screens/tenant-groups.js` | The box renders whenever a query is active, not only when the list is long. |
| **A promise the records did not keep.** "Each record states its own renewal route" was true only for records that happened to be renewable right now. | `js/screens/tenant.js` | The route line is a fact about the record and now renders in every branch. |
| **Product terms lowercased** by a `toLowerCase()` on link text, renaming the destination. | `js/screens/platform.js` | Removed. |
| **A heading level skipped** (h1 → h3) on the Faculty student-progress empty state. | `js/screens/faculty.js` | Corrected to h2. |

Two further defects were found by the central verification rather than by any agent:

- **`var(--line)` was never defined.** `.refed { border: 1px solid var(--line) }` shipped with
  that token declared in no stylesheet. An invalid value inside a *shorthand* invalidates the
  whole declaration, so the supporting-references editor — which the Content Manager's return and
  the Academic Reviewer's change request both draw — had been rendering with **no border at all**,
  silently, since it was written. Fixed at the root, and a new assertion now proves every custom
  property referenced anywhere in `css/` resolves.
- **`ui.infoTip()` was a 20×20 target**, below the WCAG 2.5.8 minimum of 24. Caught by the route
  sweep the moment the first screen used it.

### Final results

| | Baseline | Final |
|---|---|---|
| Deterministic assertions (`qa/checks.js`) | 1292 · 0 failures | **1386 · 0 failures** |
| Assertions added | — | **+94**, none weakened or removed |
| Product JS files parsing | not checked | **30 / 30**, now asserted every run |
| Rendered-DOM checks (`qa/ui-audit.js`) | — | **890** (178 routes × 5 widths) · **0 issues** |
| Interaction checks | — | **25** · 0 failures |
| Engineering prose in product UI (clean seed) | 15,771 chars | **617 chars** |

---

## 8 · Genuinely unresolved, and still open

These are source-level unknowns, not unfinished work. **The five items below are the whole of
the open list.**

1. **Retirement of canonical structure** — `OPEN_DECISIONS_FOR_STAKEHOLDER.md` `D3`. Does the
   platform need to retire a Programme or Course, and what happens to the live references it
   would orphan? Unanswerable from the sources; the product avoids the action.
2. **XR completion confirmation** — how a simulation reports completion (07.2 §B). Prototype
   stand-in retained and labelled.
3. **Expiry reminder delivery channel** — the 15-day rule is confirmed; the channel is not. An
   in-product warning is what exists.
4. **Which course code a public course page shows** — recorded as `N-2` and never closed. A public
   page has no institution.
5. **Which course code a Student sees** — no source states it, at any date. This build shows the
   institution's code and labels it as neither kind, so no unagreed convention is asserted on
   screen. **This is a reversible UX judgement, not a confirmed requirement** (§4), and it is the
   one item where an earlier version of this document claimed both "resolved" and "unresolved".
   The concepts and their ownership are resolved; the Student-facing display convention is not.

### Not part of the list above — two pre-existing defects, found and FIXED

Two state-layer inconsistencies were found during the redesign and initially recorded here as
needing a product decision. A targeted reconciliation pass re-traced both against the sources and
found that **neither was actually unresolved** — in both cases the correct behaviour was already
settled, and the second definition was simply an implementation that had not been updated to
match. Both are now fixed and asserted.

- **~~Two definitions of "the Courses this institution uses"~~ — RESOLVED.** They answer two
   legitimately different questions, and only one of them was being asked in the wrong place.
   `tenantCourseIds()` is the **content** denominator (Courses reachable through live access) and
   is correct for content, assignment and entitlement surfaces. Mapping is a different question:
   `courseMappings[].localCode` is the institution's own code (STK31-11/25) and STK31-26 makes
   Course ID/Code **required** when a student is provisioned — so a Course students are filed
   against needs a local code whether or not the institution holds content in it. That union was
   already the stated rule, written inline in the Academic mappings screen; `coursesWithoutMapping()`
   simply did not use it, so the Overview's "missing a local code" row and the mappings table
   produced **two numbers under one label**. The union is now one function,
   `state.tenantMappableCourseIds()`, and both read it. 13 assertions.
- **~~The institution course code is written to two places by two paths~~ — RESOLVED.** The CSV
   importer wrote the person record *and* the tenant mapping, under a stated rule (ND-04: create
   only where none exists, never silently overwrite). Manual `addStudent()` wrote only
   `person.localCourseCode`. Both paths collect the same **required** field on the same
   institution, and the model says the institution's code lives on `courseMappings` — so this was
   an implementation inconsistency, not an open choice. `addStudent()` now writes the mapping under
   **the CSV importer's own ND-04 rule, verbatim**: an existing mapping is never overwritten by
   adding a student, because a Tenant Admin's deliberate mapping outranks a value typed into one
   person's form. No schema change; `person.localCourseCode` and every existing id and history row
   are untouched. 12 assertions.

---

## 9 · Implementation 08R — visual recovery pass

The redesign was accepted functionally and rejected visually on several screens. This pass
compared every major route against checkpoint `a52615c` — both served with **identical state** on
two ports — and recovered the earlier pattern wherever it was better, rather than assuming newer
meant better.

### Where the checkpoint was right, and was restored

| Screen | Verdict | What was recovered |
|---|---|---|
| **Faculty Overview** | **OLD BETTER** | The 4-tile `.statgrid` dashboard. The redesign had replaced it with a dense strip and then grown it to **seven** figures, so what you teach and what is waiting for you weighed the same as "0 submissions". The new experiments table (progress bars, assessment readiness) was kept — a genuine **COMBINE**. |
| **Student access** | **COMBINE** | The checkpoint's content-first grant table was already right. The redesign's compact record rows were better than its big allocation meters. Both kept; the identifiers demoted (below). |
| **Public catalogue** | **COMBINE** | The checkpoint contained its Experiments in bordered rows; the redesign had lost containment entirely. Recovered as real cards, in a grid. |
| **Content governance** | **COMBINE** | The checkpoint's decision-first ordering was right and was kept. Its giant empty states and the duplicated canonical tree were not. |

### Two defects the comparison exposed

- **Three competing `.expcard` rules.** The merged stylesheet carried the card rule, a padding
  override, and a third that set `background:transparent; border:0; border-radius:0;
  box-shadow:none`. The last won, so **every Experiment on the public catalogue rendered as bare
  text** — the worst surface in the build, on the page a stakeholder judges the product by.
- **`statGrid` called across an IIFE boundary.** Twice — in `tenant.js` and `faculty.js` — a
  helper defined in the module IIFE was called bare from the screens IIFE. Both threw. The route
  sweep reported them **clean**, because the app's error boundary renders a page with a heading,
  body copy and no overflow. The audit now detects that fallback explicitly; a caught render error
  can never again pass as a healthy route.

### Internal identifiers are secondary metadata

`ACC-001` was the dominant label on Student access and Content access, which made an institution
admin read their own content library as a table of database keys. **No record was merged and no
identifier changed** — this is presentation only:

| Surface | Before | After |
|---|---|---|
| Student access — record rows | `ACC-001` in monospace, first | *Direct Shear Test and 2 more* · 8 approved · 3 assigned · 5 remaining, then `Reference ACC-001` muted |
| Student access — table column | **ACCESS RECORD** → `ACC-002` | **ACCESS SOURCE / TERM** → *Yearly · ends 8 Sep 2027*, then the muted reference |
| Content access — table column | **ACCESS RECORD** → `ACC-001` | **ACCESS SOURCE / TERM** → term badge, dates, *3 of 8 licences used*, then the reference |
| Filters | "Access record" → `ACC-001` | "Access source" → *Direct Shear Test and 2 more (ACC-001)* |

`ui.accessRef()` is the one helper that renders it, so the treatment cannot drift.

### Support media — the missed stakeholder requirement

Every authenticated role's Help screen can now attach evidence to a technical issue report, through
the **shared** support module: Student · Faculty · Tenant Admin · Vendor · Academic Reviewer ·
Content Manager. Verified on all six.

**What is stored, exactly.** There is no server and no file storage, and one was not invented. The
record keeps the file's own facts — name, MIME type, byte size, pixel dimensions — and, for an
image, a **thumbnail the browser downscales to 320px and re-encodes** (a 22 KB PNG becomes a
2,987-byte preview). That is a real picture, so the platform team sees the evidence rather than a
filename. **The full-resolution file is never stored and never leaves the device.** Video is
recorded by its facts alone — a file input offers no frame to grab, and one is not faked.

**The write is verified.** `save()` swallows a quota failure so the prototype can continue in
memory, which means an oversized preview would silently cost the build its persistence. The
thumbnail is size-capped before the record is written, and the creation path re-reads its own write
and drops the preview if it did not survive — the facts are kept either way, so a report never
loses that evidence was attached.

### Help, rebuilt

Four cards became two. "How this works", "What is recorded" and "What this does not include" — a
rail whose loudest content was a list of things the platform does *not* have (no knowledge base,
no chatbot, no escalation path, no SLA) — are gone from the screen. Those constraints are real and
are still honoured; they are scope facts for this document, not the first thing a person with a
broken headset should read. One line survives on screen, because it changes what the reporter does:
nothing is emailed or texted, so this page is where the answer appears.

### Prototype controls, minimised

The dark strip is now a **30px collapsed `<details>`** (was ~70px, expanded, on every screen). Every
function is preserved — role switch, requester scenario, identity pickers, reset — and its
open/closed state is remembered in `sessionStorage`, deliberately **not** the product's
`localStorage` namespace, so it can never appear in an export or survive a data reset.

### Also simplified

Super Admin Overview 8 tiles → 4 · Tenant Overview 5 tiles + two counting paragraphs → 4 tiles
(the sentence *"N distinct students hold at least one licence across M active access records"* is
gone) · Faculty Student Progress 8 metrics → 4 · Academic Structure course rows now carry name,
platform code and Experiment count, with the full dependency breakdown moved to a **Usage &
dependencies** card on the Course page · the catalogue's "Already held" banner replaced by one
muted clause and a chip that names the institution itself.
