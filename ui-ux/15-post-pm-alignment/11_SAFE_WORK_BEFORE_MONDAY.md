# 11 — Safe Work Before Monday

| | |
|---|---|
| **Status** | 🟠 **WORK-PLANNING DRAFT** |
| **Created** | 29 August 2026 |
| **The test applied** | **Would this work product still be correct under *every* plausible Monday answer?** If any plausible answer would waste it, it is not safe |

---

## The test, stated plainly

A piece of work is **SAFE NOW** only if:

1. It does not depend on any of the twelve open items, **and**
2. It does not modify Batches 01–05, **and**
3. It survives every plausible answer without rework.

**Anything that fails even one of those is not safe.** Not "probably fine" — not safe. The cost of a wrong guess here is not a wasted afternoon; it is a change applied to finished, QA-passed batches, and then applied again.

---

# ✅ SAFE NOW

## S1 · Decision and alignment documentation
**This folder.** Extraction, precedence, conflicts, models, journeys, impact, gaps, questions, sequence, diagrams.
**Why safe:** it records what is known and what is not. Every Monday answer *improves* it; none invalidates it.

## S2 · Master journey and role mapping
**Documents 03, 04, 06, 07 and the diagrams.**
**Why safe:** the spine — discover → request → authorise → tenant → allocate → provision → learn — is high-confidence PM direction. The open items are *steps within* the spine, not the spine itself.

## S3 · Gap analysis and screen-coverage mapping
Map the Review-006 104-screen inventory against what the five batches actually built; identify which inventory IDs are built, partially built, or untouched.
**Why safe:** a fact-finding exercise over existing artefacts. **Reusable regardless of Monday.**
**Not yet done in this task** beyond the level in document 10 — it is the obvious next safe step.

## S4 · Terminology audit
Already performed and recorded in `05_CONTENT_HIERARCHY_AND_CATALOGUE_MODEL.md` §4.
**Why safe:** it *counts what exists*. It does not choose a term. It found a real, shipped inconsistency — Batch 04's catalogue card says `Module` while its My Learning header says `Experiment` — which is evidence the PM should see on Monday.
> ⛔ **The rename itself is NOT safe.** It waits for `PQ-04`.

## S5 · Component reuse mapping across batches
Catalogue exactly which components each batch built, which are shared, which are duplicated, and which are candidates for the new surfaces.
**Why safe:** an inventory of existing assets. **High value** — it is the input to consolidation Stage 5 and it already produced two findings worth having:

| Finding | Value |
|---|---|
| **Batch 01's governance-review pattern** — queue · detail · decision with required reason · visible state · history — is a **near-exact fit for tenant-application review** | If `PQ-03` resolves in favour of an in-product approver, a large part of that workspace is already designed and QA-passed |
| **Batch 02's question-bank upload** — upload → per-row validation → error report → commit — is a **near-exact fit for CSV people import** | The *pattern* transfers even though the *schema* is blocked |

## S6 · Public catalogue information architecture — **structure only**
The IA of a public catalogue: browse groupings, course page, experiment page, and **which facts** an experiment page carries.
**Why safe:** `PM29-02` and `PM29-03` are high-confidence, and every fact except *learning outcomes* and *preview/video* already exists somewhere in the built work. Assembling the **information structure** does not require knowing the CTA.
> ⛔ **The CTA is NOT safe** — `PM29-A6`. *Add to request* / *Add to cart* / *Request access* / *Sign in to continue* imply four different products.
> ⛔ **Pricing visibility is NOT safe** — `PM29-04`.

## S7 · Public experiment detail — content inventory
List which facts exist today, where, and which two are genuinely new.
**Why safe:** an audit of existing content, and it produced a real dependency: **`PM29-03` puts video on a public page, and `QX-03` — caption / transcript / audio-description ownership — is HIGH and open.** A public video without captions is an accessibility exposure that should be raised before it is built, not after.

## S8 · CSV import **pattern** research
The interaction shape: upload → validate → **per-row** error report → correct → re-upload → commit → outcome summary.
**Why safe:** the pattern is proven in Batch 02 and is required by the FRD 5.1.1 acceptance criterion (*invalid rows listed individually*). It holds whatever the columns turn out to be.
> ⛔ **The column set is NOT safe** — `PM29-25` / `PQ-10`. A mandatory-field list is a validation contract.

## S9 · Authentication — **ANALYSIS AND IA ONLY**

**Authentication remains a CONFIRMED MISSING UX area** (`AUTH-01`, `AUTH-02`, `AUTH-03`, `AUTH-05`, `AUTH-08`, `AUTH-10` — none designed in any batch). But **only the analysis half of it is safe before Monday.**

> ### ✅ AUTH ANALYSIS / IA = SAFE NOW
> ### ⛔ AUTH PROTOTYPE IMPLEMENTATION = WAIT UNTIL PM CLARIFICATION

### What is safe now

| # | Work | Why it survives every Monday answer |
|---|---|---|
| **S9a** | **Auth coverage mapping** — which `AUTH-*` inventory rows exist, which are built, which are only referenced | A fact-finding pass over existing artefacts |
| **S9b** | **Routing requirements analysis** — what has to be reachable from where, and which routes are conditional on an unresolved answer | Naming a dependency is not resolving it. **This is the exercise that makes the blocked routes visible rather than accidental** |
| **S9c** | **Login / register information architecture** — the structure of the sign-in surface, the entry rules already established (one URL · no role declaration before authentication · SSO ordering contextual · sign-up is B2C-only) | Those rules are already recorded in the Review-006 IA and are not touched by any open item |
| **S9d** | **Component and state planning** — which existing components the auth surfaces would consume, and which states each needs | An inventory of assets, not a build |
| **S9e** | **SSO vs normal-login dependency identification** — where the two paths diverge, and what each depends on | Identification, not resolution |

### Why implementation must wait

**Auth routing intersects five still-open questions.** Building the surface now would mean *choosing* an answer to each of them in the routing:

| Open question | How it lands in auth routing |
|---|---|
| **Institution / Tenant vs Individual entry** (`PM29-06`) | Whether the entry fork sits above sign-in, inside it, or after it — three different routes |
| **Tenant authorisation / onboarding** (`PM29-07`, `PM29-A4` → `PQ-03`) | Whether an applicant has an account at all before authorisation, and what they sign in to while waiting |
| **Individual authorisation before payment** (`PM29-A5` → `PQ-07`) | Whether registration leads to a catalogue, a pending state, or a payment path |
| **SSO fallback behaviour** | What happens when institutional SSO is unavailable, unconfigured, or fails — and whether a password fallback exists for an SSO-provisioned person. ⚠️ Compounded by **`QT-04`**, the standing HIGH collision between FRD 2.4.4 (XR sign-in with LMS credentials) and FRD 4.2.2 + PM-10 (institutional SSO) |
| **Final Student vs Learner terminology** (`PM29-A8` → `PQ-12`) | Every word on the sign-in and registration surfaces, and on `AUTH-08` workspace resolution |

> **The structure of authentication is stable. Its routing is not.** A prototype built before Monday would encode five guesses in the one place that every journey passes through — and unpicking routing is more expensive than unpicking a screen.

### The correction being applied here

An earlier draft of this document recommended **building** the auth prototype before Monday, on the grounds that no open item touches sign-in itself. That was **too narrow a reading**: it was true of the *screens* and false of the *routing between them*. The recommendation is downgraded to analysis and IA.

## S10 · Consolidation sequencing and reuse planning
Document 13. Planning the order of work is not doing the work.

---

# 🟠 WAIT FOR PM

**Each row names the single question that unblocks it.**

| # | Work | Blocked by | Why it cannot start |
|---|---|---|---|
| W1 | **Bundle implementation** — catalogue object, detail page, pricing, overlap | **`PQ-02`** | Four candidate meanings. Each changes what object carries a price |
| W2 | **Version release ownership** — keep, move, or withdraw `SA-04`/`SA-05` | **`PQ-01`** | Removing on ambiguity is as wrong as keeping on ambiguity |
| W3 | **Tenant approval surfaces** — queue, decision, states | **`PQ-03`** | In-product vs manual differ by roughly a workspace |
| W4 | **Tenant Admin vs Faculty assignment boundary** | **`PQ-05`** | Determines which workspace gets the surface |
| W5 | **Cart vs request list** | **`PQ-06`** | A request list and a cart are different objects, not variants |
| W6 | **B2C authorisation before payment** | **`PQ-07`** | Adds or does not add a state to the access spine |
| W7 | **Internal tenant structure** | **`PQ-11`** | Separate tenants vs sub-units differ by a whole hierarchy level no source contains |
| W8 | **Final role terminology** | **`PQ-09`, `PQ-12`** | A rename must happen once, not twice |
| W9 | **CSV mandatory fields** | **`PQ-10`** | A validation contract. Wrong columns fail real imports |
| W10 | **Programme in the hierarchy** | **`PQ-04`** | Collides with the PM-12-deferred *certification program* |
| W11 | **Technology as a level, and its pricing** | **`PQ-08`** | Changes the catalogue, detail page and access record |
| W12 | **Super Admin tenant-content allocation surface** | `PQ-03` + allocation unit | The unit (experiment / course / package) determines the surface |
| W13 | **Super Admin platform-role governance controls** | **`QD-02`** | The *mechanism* is undefined: invited? created? imported? mapped? |
| W14 | **Faculty analytics** | **`PQ-14`** | Points against PM-11. No metric may be invented |
| W15 | **Public pricing visibility** | **`PQ-13`-adjacent · `PM29-04`** | Explicitly "do not invent" |
| W16 | **MR's status** | **`PQ-13`** | Meanwhile: **keep all four formats.** An omission is not a removal |
| **W17** | **Authentication prototype implementation** — `AUTH-01`/`02`/`03`/`05`/`08`/`10` as built surfaces | `PQ-03`, `PQ-07`, `PQ-12` + entry fork + SSO fallback (`QT-04`) | **Auth routing intersects five open questions.** The analysis (`S9a`–`S9e`) is safe; the build encodes five guesses in the one place every journey passes through |

---

# ⛔ DO NOT DO YET

**These are prohibited by the task, or would be actively destructive.**

| # | Prohibited | Why |
|---|---|---|
| N1 | **Any modification to Batches 01–05** | Read-only in this task. All five are committed, QA-passed, and awaiting PM review |
| N2 | **Merging the prototypes** | `PM29-01` requires consolidation *eventually*. Doing it now would bake in `Module`/`Experiment` inconsistency, five separate navigations, and a superseded catalogue position |
| N3 | **Batch 06** | Explicitly out of scope |
| N4 | **A new HTML prototype of any kind** | Architecture/alignment documentation only |
| N5 | **Touching `sessionStorage` models or merging JS** | Same |
| N6 | **Redesigning cards or components** | Same |
| N7 | **Final navigation** | Nine workspaces, and the new surfaces are not yet scoped |
| N8 | **Figma** | Deferred since PM-02, and reinforced by `PM29-01`'s consolidation-first ordering |
| N9 | **Backend, frameworks, API contracts, database schema** | Explicitly out of scope. `PM29-25` in particular must **not** become a schema |
| N10 | **Any commercial transaction flow** | Its structure depends on `PQ-02`, `PQ-06`, `PQ-07`, `PQ-08`, `PQ-11` — five open answers |
| N11 | **Editing the FRD or `requirements/`** | Never edited. Deviations are recorded |
| N12 | **A commit** | Not requested. Nothing is committed by this task |
| N13 | **Closing any open question** | Twelve ambiguities stay visibly open |

---

# The recommendation

**If there is capacity before Monday, spend it in this order:**

| # | Work | Why first |
|---|---|---|
| **1** | **`S9a`–`S9e` — auth coverage mapping, routing requirements, login/register IA, component & state planning, SSO-vs-normal-login dependencies** | Authentication is a confirmed gap on the critical path of the highest-priority journey, and the **analysis** survives every Monday answer. ⛔ **The prototype does not** — auth routing intersects five open questions |
| **2** | **`S5` — component reuse mapping** | Already produced two findings that will shorten the post-Monday build. Costs nothing, invalidated by nothing |
| **3** | **`S3` — screen-coverage mapping** | Turns the 104-screen inventory into a real state-of-play, which is the input to the formal gap audit |
| **4** | **`S6` + `S7` — public catalogue IA and detail content, structure only** | Highest-value new area, and its *structure* is safe even though its *CTA* is not |

**And spend none of it on anything in the WAIT or DO-NOT lists.** Twenty-three gap items are blocked on twelve questions. Answering the questions is worth more than any amount of anticipatory design — and a Monday meeting is cheaper than a rework.
