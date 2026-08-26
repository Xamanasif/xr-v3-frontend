# Batch 03 — Institution Access & Entitlement Model

The object model behind INA-06, INA-07, INA-08, INA-03, INA-05 and INA-13 — written so it stays true under every unresolved outcome of `OQ-01` … `OQ-05`.

---

## 1 · The spine

```
        ┌───────────────────────────────────────────────────────────┐
        │  UPSTREAM — NOT DESIGNED IN BATCH 03                      │
        │  However an institution comes to be allowed to use        │
        │  content: commercial agreement, purchase, provisioning    │
        │  action, or something else.   OQ-01 · OQ-02 · QP-04 OPEN  │
        └────────────────────────────┬──────────────────────────────┘
                                     │  produces
                                     ▼
        ╔═══════════════════════════════════════════════════════════╗
        ║  INSTITUTION CONTENT ACCESS  — "an access record"         ║
        ║  · a name                                                 ║
        ║  · the published content it covers (enumerated)           ║
        ║  · a status                                               ║
        ║  · effective dates, where the record has them             ║
        ║  · the date it was recorded (no actor is named)           ║
        ╚════════════════════════════┬══════════════════════════════╝
                                     │  reaches, through
                                     ▼
        ╔═══════════════════════════════════════════════════════════╗
        ║  ELIGIBILITY  — a relationship to an institutional        ║
        ║  population: an academic stream, a group, or a person     ║
        ║  Who creates it is OQ-04 — OPEN.  DA-06 · DA-07           ║
        ╚════════════════════════════┬══════════════════════════════╝
                                     │  resolves to
                                     ▼
        ╔═══════════════════════════════════════════════════════════╗
        ║  LEARNER ELIGIBILITY                                      ║
        ║  "Included in your institution's access"                  ║
        ╚════════════════════════════┬══════════════════════════════╝
                                     │  appears as
                                     ▼
        ╔═══════════════════════════════════════════════════════════╗
        ║  CONTENT IN MY LEARNING            (Batch-01 vocabulary)  ║
        ║  Everything after this point — module, simulation, device ║
        ║  delivery, assessment — is Batch 01 / Batch 02 and is not ║
        ║  redesigned here.                                         ║
        ╚═══════════════════════════════════════════════════════════╝
```

**Batch 03 owns the middle three boxes.** The top box is open; the bottom box is already designed.

---

## 2 · Objects

### 2.1 Content access record

| Field | User-facing label | Notes |
|---|---|---|
| Name | *(the record title)* | **SAMPLE DESIGN DATA.** A readable name for the record. **Never a packaging noun** — see `DA-05`. |
| Covered content | **Covers** | An enumerated list of published experiments: title, XR format badge, device line. Sourced from what the platform published (FRD 1.4.4). |
| Status | *(badge)* | `Active` · `Not yet reaching learners` |
| Eligibility | **Reaches** | The relationship list (§2.2) and the resulting learner count |
| Effective from / to | **Effective from** · **Effective to** | Record data only. **No expiry behaviour** — `DA-09` |
| Recorded | **Recorded** | **A date only. No actor is named** — no source confirms who records institutional content access, and `OQ-01` is open. `DA-11` |
| Reference | **Reference** | A short human-readable record reference, **SAMPLE DESIGN DATA**. Present because an administrator needs something to quote when asking about a record — the rail note reads *"Quote this reference in any query about this content access"*, naming no counterparty. It is not an invoice, order or contract number and is never labelled as one. |

**Fields that deliberately do not exist:** price · currency · term length · tier · plan · seats · quantity · quota · renewal date · auto-renew · invoice · order · payment status · purchaser.

### 2.2 Eligibility relationship

| Field | User-facing label | Notes |
|---|---|---|
| Access record | *(context)* | The record the relationship belongs to |
| Population | **Reaches** | One of: **academic stream** · **group** · **person** |
| Resulting reach | *"Reaches N learners"* | A count of people the relationship currently resolves to — a consequence of institutional data, **not a licence capacity** (`DA-08`) |
| Added | **Added** | Date. **No actor is named** — `OQ-04` is open, so the interface does not claim who created the relationship |

**Three population types are offered because three are supported by the source model** (FRD 7.2.3 stream-derived access; matrix `E3` *"person, cohort, stream"*; matrix `H4`/`H5`). **It is not claimed that all three are required**, nor that any one of them is the primary mechanism.

### 2.3 Learner eligibility (derived, never stored as an admin object)

A learner is eligible for a piece of content when **any** eligibility relationship on an access record covering that content resolves to them — directly, through their group, or through their academic stream. The learner-side wording is Batch-01's, unchanged:

- eligible → **"Included in your institution's access"**
- not eligible → **"Not currently included in your institution's access"** + *"Your institution decides which experiments are available to you. Contact your institution administrator if you expect to see something here."* — **no purchase prompt** (`D-01`).

---

## 3 · Why this survives every open outcome

| If `OQ-01`/`OQ-02` resolve to… | What changes | What does not |
|---|---|---|
| Per-module purchase | The record's name and covered list become one item | The record, its eligibility list, and the learner's view |
| Bundle purchase | The record gains a bundle name and possibly a bundle badge | Everything else |
| Catalogue / platform subscription | One record covers everything published; the covered list gets a summary line | Everything else |
| Something else entirely | The record is still *a thing the institution may use* | Everything else |

| If `OQ-03` resolves to… | What changes | What does not |
|---|---|---|
| No cap | Nothing | Everything |
| A cap | One capacity row is added to INA-06/INA-07 and one status to the Overview | The access model and the eligibility model |

| If `OQ-04` resolves to… | What changes | What does not |
|---|---|---|
| …the **Institute Admin** being the assigner | Nothing — the prototype already shows it that way, as `DA-07` | — |
| …**Faculty** being the assigner | The eligibility editor moves to the Faculty workspace; INA-07's list becomes read-only | The relationship, its display, and the learner's view |
| …**institutional data** driving it | The editor is replaced by a provenance line (*"from institution data"*); INA-08 becomes a read-only reconciliation view | The relationship, its display, and the learner's view |
| …a **combination** | Each relationship gains an origin indicator | The relationship, its display, and the learner's view |

**In every row of every table above, the learner-side result is identical.** That is the property the design was built for.

> **No row above is a prediction, a recommendation or a working position.** `OQ-04` is open, and **Batch 03 states nowhere — in documentation or in product copy — that the Institute Admin assigns learner entitlements.** The editable eligibility interaction exists to demonstrate the handoff and is classified `DA-07` — **DESIGN ASSUMPTION, REVERSIBLE**. The only thing this batch asserts is the stable chain: *institution has content access → learner becomes eligible → content appears in My Learning.*
>
> The learner-facing wording for the other end of that chain is **source-confirmed**: FRD 7.2.3's acceptance criterion requires that *"a student in an unmapped stream sees an empty entitlement state that explains what to do"*, and the FRD's own flow note states that such a state *"explains that the institution assigns access"*. `INA-13`'s not-eligible copy — *"Your institution decides which experiments are available to you"* — attributes the decision to **the institution**, never to a named role.

---

## 4 · Where each screen reads from the model

| Screen | Reads | Writes (prototype only) |
|---|---|---|
| INA-06 Content Access | all access records + their reach counts | — |
| INA-07 Content Access Detail | one record: covered content + eligibility list | adds / removes an eligibility relationship (`DA-07`) |
| INA-08 Access Mapping | every relationship, presented from both directions: *records with no reach* and *populations with no access* | — |
| INA-03 Person Detail | the content this person is currently eligible for, and which relationship produces it | — |
| INA-05 Stream / Group Detail | the access records reaching this population | — |
| INA-01 Overview | count of active records; count of records not yet reaching learners | — |
| INA-13 Learner Access Check | the derived learner eligibility | — |

**One computation serves all seven.** In the prototype it is a single function over local state; that is a prototype implementation detail and **not a schema, contract or API proposal** — the entitlement service, its data model and its interfaces are all pending.

---

## 5 · States and how they are drawn

| State | Where | How it reads |
|---|---|---|
| **No content access yet** | INA-06 | Empty state: *"No content access has been recorded for this institution yet."* + *"Content access recorded for this institution appears here, with the experiments it covers."* **No purchase call to action, and no actor named as the recorder** — the acquisition route and its owner are both open (`OQ-01`). |
| **Active, reaching learners** | INA-06, INA-07 | `Active` badge + *"Reaches N learners"* + the population list |
| **Active, not yet reaching learners** | INA-06 (row emphasis), INA-07 (inline panel), INA-08, INA-01 | `Not yet reaching learners` badge; the detail screen explains the consequence in one sentence — *"No one in your institution can see this content yet."* — and offers the next step |
| **Population with no access** | INA-05, INA-08 | *"No content access currently reaches this stream."* |
| **Person with no access** | INA-03 | *"This person is not currently eligible for any content."* + the reason (*"no content access reaches their academic stream or groups"*) |
| **Learner eligible** | INA-13 | The content appears, each with *"Included in your institution's access"* |
| **Learner not eligible** | INA-13 | Batch-01 `STATE-01` copy pattern, institution-directed, no purchase prompt |
| **Effective dates present** | INA-07 | Two plain data rows. **Nothing is derived from them** — `DA-09` |

---

## 6 · What is deliberately absent

| Absent | Why |
|---|---|
| Checkout, cart, pricing, payment, invoice, receipt, billing | Task brief §7; institutional billing FRD 9.3.x is Phase 2; `QP-04` and `OQ-01` open |
| Renewal, auto-renew, "expiring soon", expiry consequence | Post-expiry behaviour is undefined — `DA-09` |
| Seats, caps, utilisation, "N of M used" | `OQ-03` open — `DA-08` |
| Subscription tiers, plans, add-ons, upgrades | `OQ-01`/`OQ-02` open |
| A catalogue of content the institution does **not** have access to | `OQ-05` open — drawing a browse surface would answer it |
| Per-learner "grant access" / "revoke access" buttons | `OQ-04` open; the relationship model expresses the same capability without asserting the authority — `DA-07` |
| A change history for access or eligibility | `M4` undefined — `DA-10` |
| Any statement of who is *required* to create an eligibility relationship | `OQ-04` open |
