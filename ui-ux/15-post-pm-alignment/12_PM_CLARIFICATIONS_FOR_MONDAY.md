# 12 — PM Clarifications for Monday

| | |
|---|---|
| **Status** | 🟠 **QUESTION LIST — DRAFT** |
| **Created** | 29 August 2026 |
| **Design rule** | **A short, high-value list.** Not thirty questions. Each one below unblocks work that is otherwise stopped |

---

## How to use this

**Ten MUST-ANSWER questions.** Each is stated so it can be answered in a sentence, and each says what it unblocks and what happens if it is not answered.

Where a **read-back** is needed rather than a decision, that is said — reading a statement back and getting a yes takes seconds and converts a draft item into an authoritative one.

---

# MUST ANSWER

## `PQ-01` — Who controls version release after the Content Manager publishes?

> **The Content Manager is the publication owner (PM-16/17/18). FRD 2.3.2 separately gives the Super Admin control over when new module *versions* release to production. After a Content Manager publishes, does the Super Admin still hold that separate version release / hold authority — or does version release belong to the Content Manager too?**

| | |
|---|---|
| **Why it matters** | It is the only remaining question about **who ends the content chain** |
| **Unblocks** | Batch 05 `SA-04`/`SA-05` — keep, move, or withdraw as a pair |
| **If unanswered** | Both stay as they are. Neither removed nor extended |
| **Ref** | `PM29-A1` · Batch 05 `D-01` · FRD 2.3.2 |

**Also worth closing while this is open:** `QP-26` — *may the Super Admin return a submission at the publication gate?* It has been open since PM-14 and nothing has addressed it.

---

## `PQ-02` — What exactly is a Bundle?

> **You corrected the reading that a bundle is an arbitrary group of three modules. What is it instead — a group of experiments, a course-level package, a purely commercial package, or a technology-related grouping?**

| | |
|---|---|
| **Why it matters** | It determines **what object carries a price** — which sets the catalogue, the detail page, the access record and the entitlement |
| **Unblocks** | Batch 04's bundle detail, overlap handling (`Q-45`), and any commercial modelling |
| **If unanswered** | The word is not used in new work. Batch 04 stays as it is |
| **Ref** | `PM29-A2` · FRD 6.1.2 · `QP-09` |

*Useful context for the discussion:* the FRD's own glossary says only *"a purchasable group of simulation modules"* — **with no count**. And FRD 6.1.2 (buy a bundle) is Phase 1 while 6.3.1 (create a bundle) is Phase 2, so **nothing in Phase 1 currently creates the thing Phase 1 sells**.

---

## `PQ-03` — Who approves an institution's request, creates the tenant, and assigns the first Tenant Admin?

> **An institution applies, the platform validates and authorises it, and a tenant is created. Who performs the validation and the authorisation — the Super Admin in the product, another platform operations role, or a manual process outside the product? And who assigns that tenant's first Tenant Admin?**

| | |
|---|---|
| **Why it matters** | **The three answers differ by roughly a workspace.** In-product needs a queue, a decision surface, a reason, a state machine and an applicant-visible status. A manual process needs a request record and a status — and nothing else |
| **Unblocks** | The whole tenant onboarding flow; Batch 05 `R-01`/`R-02`; `SA-09` |
| **If unanswered** | No onboarding surface is designed at all |
| **Ref** | `PM29-A4` · `PM29-07` · `PM29-22` · FRD 4.2.1 · `QD-02` |

> ⚠️ **If the answer is "another platform operations role", flag it immediately.** That would be an **eighth role**, which PM-07 fixed at seven and which FRD 8.3 (custom roles) places in **Phase 3** — so there is no Phase-1 mechanism to create one.

---

## `PQ-04` — Module or Experiment? And what is a Programme?

> **Two terminology questions that have to be answered together.**
> **(a)** In the product interface, is the learning unit called a **Module** or an **Experiment**?
> **(b)** In the hierarchy `Program → Course → Experiment`, is *Programme* an academic programme (like B.Tech Civil), the same thing as an academic stream, or the certification programme that PM-12 deferred to Phase 2?

| | |
|---|---|
| **Why it matters** | 🔴 **The five batches already disagree with each other in shipped copy** — and Batch 04 disagrees with itself: its catalogue card reads **`Module`** while its My Learning header reads **`Experiment`**. A consolidated prototype exposes this on the first click-through |
| **Unblocks** | The rename — which must happen **once**, not twice. Also the top of the content hierarchy |
| **If unanswered** | Everything freezes as-is. **Nothing is renamed on a guess** |
| **Ref** | `PM29-16` · `PM29-A9` · `PM29-13` |

**Measured evidence to show the PM:** Batch 01 `Experiment` (11) · Batch 02 `Module` (61) · Batch 03 `Experiment` · Batch 04 **both** · Batch 05 `Module` (9).

**On (b):** the FRD's only Phase-1 *program* is the **certification program** (3.3.1), which **PM-12 deferred to Phase 2**. Batch 03 deliberately avoided the word for exactly that reason and uses **Academic stream** (FRD 7.2.3) instead.

---

## `PQ-05` — Who assigns an experiment to a specific student or group?

> **The Super Admin decides which experiments a tenant receives. Inside the tenant, who then assigns a particular experiment to a particular student or group — the Tenant Admin, the Faculty, or both at different levels?**

| | |
|---|---|
| **Why it matters** | Determines which workspace gets the assignment surface |
| **Unblocks** | Batch 03 `DA-07`; the Faculty / Tenant Admin split |
| **If unanswered** | Batch 03's editor stays labelled reversible and claims no assigner |
| **Ref** | `PM29-A3` · `OQ-04` · matrix `E3`, `H5` |

*Context:* the role matrix currently grants *"assign content to learners or cohorts"* to **both** Faculty (8.1.4) and Institute Admin (8.1.3, 7.2.3) — which is why it cannot be inferred.

---

## `PQ-06` — For B2B, is it a cart or a request list?

> **A visiting institution browses the public catalogue and finds what it wants. Does it add items to a cart and check out, add them to a request list that is submitted for approval, or simply make an enquiry that names nothing specific?**

| | |
|---|---|
| **Why it matters** | You said the immediate B2B model may **not** behave like direct cart → payment. **A request list and a cart are different objects, not variants of one** |
| **Unblocks** | The B2B transaction surface; the public catalogue's **call to action** |
| **If unanswered** | No B2B transaction surface is designed, and the public catalogue's CTA cannot be chosen |
| **Ref** | `PM29-A6` · Batch 04 `DA-01` |

> **This is the question that gates the public catalogue.** Its structure is safe to plan; its primary button is not.

---

## `PQ-07` — For individuals: approval before payment, and when does B2C go live?

> **Two related questions.**
> **(a)** Does an individual purchase or subscribe directly, or must they be authorised first?
> **(b)** Given that B2B is the immediate focus, does direct self-service B2C stay in Phase 1, or move to a later release?

| | |
|---|---|
| **Why it matters** | (a) adds or does not add a state to the access spine. (b) changes what "secondary" means for scheduling |
| **Unblocks** | Batch 04's rollout position; the individual access path |
| **If unanswered** | B2C is documented as secondary within Phase 1 — which is what PM-04 and FRD 1.1.3 say today. **Nothing is deleted** |
| **Ref** | `PM29-A5` · `PM29-05` vs **PM-04** |

> ⚠️ **This is a direct conflict with PM-04**, which said: *"Do NOT treat B2B-first / B2C-second as a PM-confirmed release sequence."* Worth naming explicitly so the reversal is deliberate rather than accidental.

---

## `PQ-08` — Can an institution choose the technology, and does it affect price?

> **You mentioned an institution might select which technology implementation of an experiment it gets — AR, VR or Web. Is that a real selection? Does an experiment exist in several technologies at once, and does the choice change what is paid?**

| | |
|---|---|
| **Why it matters** | It decides whether technology is a **property** of an experiment (today's model) or a **selectable variant** (a new hierarchy level). The second changes the catalogue, the detail page and the access record |
| **Unblocks** | Public catalogue structure; any commercial modelling |
| **If unanswered** | Technology stays a property. Format badges as built |
| **Ref** | `PM29-18` · `PM29-A11` · `PM29-13` |

---

## `PQ-09` — Tenant Admin and Institute Admin: one role, and which label?

> **Two parts, and the first is a read-back.**
> **(a)** We have read *Tenant Admin* and *Institute Admin* as **the same formal role concept** in the current architecture. Is that right?
> **(b)** If it is, which word appears in the product?

| | |
|---|---|
| **Why it matters** | (a) is an **interpretation we are carrying at high confidence but have not read back** — if the two names were meant to distinguish two positions, the tenant plane's shape changes. (b) is a mechanical rename across every Batch-03 screen, route, document and prototype string, and **it should happen once** |
| **Unblocks** | (a) the tenant-plane role model · (b) the rename |
| **If unanswered** | The one-role reading is carried as **PM-DIRECTION, not confirmed**, and `Institute Admin` stays — it is FRD 8.1.3's word and what Batch 03 built |
| **Ref** | `PM29-09` |

*Confirm at the same time:* **no eighth role is being created.** The system has **seven formal roles** (PM-07), and FRD 8.3 custom-role creation is Phase 3, so there is no Phase-1 mechanism to add one.

---

## `PQ-10` — Read-back: the institutional learner metadata

> **Reading back the handwritten list. Mandatory: Programme · Course Name · Course ID/Code · Semester · Student ID · Student Name · Student Email. Not mandatory: Organisation. Is that correct and complete for the import format?**

| | |
|---|---|
| **Why it matters** | A mandatory-field list is a **validation contract**. Wrong columns fail real institutional imports — and a *silently* wrong one imports rows that mean the wrong thing |
| **Unblocks** | CSV import design |
| **If unanswered** | The CSV **pattern** can be planned; the **columns** cannot be fixed |
| **Ref** | `PM29-25` |

**Three things worth raising in the same breath:**

1. **`Semester` has no Phase-1 basis.** Its only appearance in the whole v5 set is FRD 2.19x *Academic Version Locking* — a **Phase-2** requirement about locking a module version.
2. **No course code field exists anywhere in the FRD.** And *"varies by institution"* implies the code belongs to the **tenant's mapping**, not to the central content record — a structural point.
3. 🔴 **Conflict risk.** The institution's ERP is authoritative (FRD 7.1.1) and scheduled sync overwrites (7.2.1). **What happens when a CSV import and the ERP disagree about the same person is undefined** (`QD-01`, open since Review 006) — and adding a manual/CSV route makes it a real, reachable conflict rather than a theoretical one.

---

# IMPORTANT IF TIME

## `PQ-11` — What are BITS, WILP, Goa and Pilani, and what makes an institution "internal"?
> **Separate tenants, one tenant with organisational units, or examples? And what decides whether an institution gets access without payment?**
**Why:** the two are coupled — if *internal* means belonging to that group, the group's structure **is** the paid/free rule's input. "One tenant with units" would require a **campus/unit level no source contains and no batch designs**.
**Ref:** `PM29-A7` · `PM29-08` · `QP-04`

## `PQ-12` — Are Student and Learner two product terms, or one role in two contexts?
> **Your diagram shows Super Admin → Learner and Tenant Admin → Student. Are those different things?**
**Why:** every source treats them as one role in two contexts. Splitting them makes the label **context-dependent**, and the two contexts share the *entire* learning core — the largest, most finished part of the product.
**Ref:** `PM29-A8`

## `PQ-13` — Is MR still a Phase-1 format?
> **You listed AR, VR and Web. The FRD defines four formats — Web, VR, MR (Ajna Lens) and AR. Is MR still in scope?**
**Why:** an omission in a spoken list is not being read as a removal. **All four formats stay designed** until this is answered. MR has its own Phase-1 requirements (1.2.3, 2.1.2) and its own open question (`QP-14`, who authorises sideloading).
**Ref:** `PM29-14` · `PM29-A10`

## `PQ-14` — What does "analytics" mean for Faculty?
> **You said Faculty should see student usage, progress and analytics. PM-11 deferred detailed metrics and dashboards. Is "analytics" here the operational status Faculty already gets, or something more?**
**Why:** it points against PM-11 and against the FRD's own phasing — every dashboard requirement (8.2.x, 11.3.x, 11.4.x) is Phase 2 or 3. **No metric is invented meanwhile.**
**Ref:** `PM29-11` vs **PM-11**

## `PQ-15` — What is the scope of Super Admin governance over Vendor and Academic Reviewer?
> **You described the Super Admin governing the Vendor, the Academic Reviewer and the content-side roles, and possibly assigning reviewer or vendor responsibility for particular content. Is that account administration, per-content assignment, or both — and at what level: globally, per course, or per experiment?**
**Why:** it determines whether Batch 05 gains an account-registry surface, an assignment surface, or both.
**Ref:** `PM29-24`

---

# CAN WAIT

| # | Question | Why it can wait |
|---|---|---|
| `PQ-16` | Public pricing visibility — does a signed-out visitor see a price? | You said not to invent it. Nothing is blocked until the catalogue's commercial layer is designed |
| `PQ-17` | Does a request carry a content selection, or is it a plain enquiry? | Downstream of `PQ-06` |
| `PQ-18` | Are the B2C periods recurring subscriptions or fixed-term grants paid once? | Downstream of `PQ-07(b)`. **Worth knowing that FRD 9.3.2 subscription billing is Phase 2** |
| `PQ-19` | Renewal, expiry and post-expiry behaviour | No source states any. Downstream of `PQ-18` |
| `PQ-20` | Who maps an experiment to a course — the vendor, the content manager, or per tenant? | Affects Batch 01's submission metadata, which is already labelled SAMPLE |
| `PQ-21` | Should institutional access have a duration, as individual access does? | You gave periods for individuals only |

---

# Long-standing questions worth mentioning if the room allows

**Not created by this meeting. All open since Review 006, all HIGH, and one of them is the highest-value product question on the register.**

| ID | Question | Note |
|---|---|---|
| **`QP-02`** | **Who grades descriptive answers, on what turnaround, against what rubric?** | **The only open item that can strand a learner mid-progression through no fault of their own.** FRD 5.2.3 permits descriptive answers; no requirement says who grades them; the approved progression gates the next module on completion |
| `QP-04` | How is an institutional licence transacted in Phase 1, given Phase-2 billing? | `PM29-08` adds a **free** branch without defining either branch's mechanics |
| `QP-27` | What post-attempt feedback may a learner see? | Blocks the result surface and the assessment API payload |
| `QX-03` | Who owns video captions, transcripts and audio description? | **Now sharper** — `PM29-03` puts preview video on a **public** page |
| `QX-01` / `QX-02` | Viewport and reflow across all workspaces | **Now sharper** — a public catalogue is not a desktop-only surface in practice |

---

# The one-page version

**If only five minutes are available, ask these three:**

1. **`PQ-03`** — who approves a tenant, and who assigns its first admin? *(differs by a workspace)*
2. **`PQ-02`** — what is a bundle? *(determines what carries a price)*
3. **`PQ-06`** — cart or request list for B2B? *(gates the public catalogue's primary button)*

**And read back two things, which takes seconds each:**

- **`PQ-10`** — the metadata list.
- **`PQ-09`** — Tenant Admin or Institute Admin.
