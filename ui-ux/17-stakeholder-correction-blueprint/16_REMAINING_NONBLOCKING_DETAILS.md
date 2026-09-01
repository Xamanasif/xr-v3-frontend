# 16 — Remaining Non-Blocking Details

| | |
|---|---|
| **Status** | ✅ **NON-BLOCKING REGISTER** |
| **Created** | 31 August 2026 |
| **Rule** | ⛔ **None of these blocks the start of unified implementation.** Each carries the **safest reversible UX handling** so work can proceed and the answer can land later without rework |
| **Standing** | These are **implementation details, not unconfirmed decisions.** Every `STK31-nn` decision is current and authoritative and is **not reopened** here |

---

## How to read the "Safe reversible handling" column

Every entry answers one question: **what can be built now that will still be right whichever way the detail resolves?**

Three techniques recur, and all three are already proven in the built work:

| Technique | Proven in |
|---|---|
| **Make it a configuration value with a labelled default**, so the answer changes data, not the control | Batch 02's assessment settings — every parameter tagged **SAMPLE** |
| **Show provenance instead of asserting an actor**, so the writer can be settled later | Batch 03's content-access origin line — *a date and no actor*, which `STK31-24` then filled cleanly |
| **Show a gap as a gap, never as a disabled control** | Batch 05's configuration register |

---

# A · The sixteen items from the 31 Aug review

| ID | Detail | Related decision | Why it is not blocking | **Safe reversible handling** |
|---|---|---|---|---|
| **`ND-01`** | Final product-facing label — **`Institute Admin`** or **`Tenant Admin`** | `STK31-02` | The **role identity** is settled; only the word is open. Nothing structural depends on it | **Carry `Institute Admin / Tenant Admin` in planning**, and pick **one** string constant in the unified build's copy layer. A later change is a **one-line constant edit**, not a rename across screens — provided the label is never hard-coded per screen |
| **`ND-02`** | **Final terminology and internal structure of `Programme / Department / Academic Stream`** | `STK31-12` · `STK31-10` | It is **one grouping level**; only its final name — and whether it ever needs an internal sub-level — is open. The three rules that matter are settled: **platform controls the master structure · the Tenant cannot redefine the canonical catalogue · Semester is optional** | Model **one terminology-neutral grouping record** between the catalogue root and Course. **Do NOT create an implementation dependency requiring `Programme` and `Academic Stream` to be separate records.** If a distinction is later confirmed, it is an **addition to a level that already exists** — not a restructure |
| **`ND-03`** | Is **`Plan Terms / Access Context`** technically **mandatory** in the CSV? | `STK31-26` | The stakeholder said *"if possible"*. **A mandatory-field list is a validation contract**; guessing it wrong fails real institutional imports, and guessing it wrong *silently* imports rows that mean the wrong thing | Include the column. **Validate it as OPTIONAL**, and surface a **missing value as an attention row**, not an import failure. Promoting optional → mandatory later is a **validation-rule change**; demoting mandatory → optional after a failed import is a **data-recovery problem** |
| **`ND-04`** | **CSV ↔ ERP write conflict** on the same person (`QD-01`) | `STK31-25` · `STK31-26` | 🔴 The most consequential item here. **ERP is authoritative (FRD 7.1.1) and scheduled sync overwrites (FRD 7.2.1)** — adding manual and CSV routes makes the conflict **real and reachable**, not theoretical | **Never silently overwrite.** Show **per-person provenance** — `ERP` · `CSV import` · `manual` — which Batch 03's `Source` column already does. On a disagreement, raise a **Record Needing Attention** with both values, and require an **explicit, reversible** resolution. Whichever precedence rule is chosen later becomes the **default** of a mechanism that already exists |
| **`ND-05`** | The canonical metadata **schema** (`QD-07`) | `STK31-09` | **Ownership is settled**; the field list is not. **No FRD source enumerates a schema for anything** | Keep Batch 01's discipline: metadata fields are labelled **SAMPLE**, and the surface is a **field-set container** rather than a fixed form. Adding or renaming a field must not move the control |
| **`ND-06`** | B2C periods — **recurring subscription or fixed-term grant paid once**? (`PQ-18`) | `STK31-05` | B2C is **deferred** (`STK31-04`). Nothing in the current build depends on it | Model the period as a **term on the access record** (which the record needs anyway for B2B, per `STK31-28`). **Recurrence is a separate attribute** added later. **Do not build a renewal mechanism** — FRD 9.3.2 subscription billing is **Phase 2** |
| **`ND-07`** | The **internal vs external** institution classification rule | `STK31-19` · `STK31-23` | **Both branches are confirmed to exist**; only the rule that selects one is open | Make the branch a **property of the approved request** — set by the Super Admin at approval — not a computed rule. A later algorithm becomes the **default value** of a field that already exists. **Do not invent a classification algorithm** |
| **`ND-08`** | **Technology-specific pricing** construction | `STK31-15` | **No price may be invented** anywhere. FRD **6.3.x** bundle creation and pricing is **Phase 2** | Carry the **granted technologies** on the access record (needed regardless). Show **no price on any public or request surface**. When pricing exists it attaches to a dimension the record already carries |
| **`ND-09`** | Exact **Taxila auto-review** mechanics | `STK31-31` | **Faculty ownership is settled**, and that is the part that could strand a learner. Auto-review is an **assist** | Build the **Faculty evaluation queue and the manual decision**. Leave auto-review as an **optional, clearly-labelled assist affordance whose absence changes nothing**. 🔴 **An AI score is never automatically final** — the same discipline Batch 02 applies to AI question drafts |
| **`ND-10`** | **BITS feedback timing** — Taxila reference | `STK31-32` | The **general** policy is settled with three options. Only the BITS default is open | Make the policy a **configuration value with an explicitly-labelled institutional default**. A BITS-specific behaviour is later **selected**, not **built**. 🔴 **Do not invent the Taxila rule** |
| **`ND-11`** | **Automatic vs manual renewal** | `STK31-28` | The **term and the 15-day reminder** are settled. Renewal behaviour is not | Model **Active · Expiring soon · Expired · Renewed** as states. **`Renewed` is reached by an explicit action**, never by an assumed automatic charge. If automatic renewal is later confirmed, it becomes a **new path into an existing state** |
| **`ND-12`** | **Payment provider and actual pricing** (`C-05`, `Q-34`, `Q-35`) | `STK31-20` | Batch 04 already proves a **provider-neutral** payment step works | Keep the payment step provider-neutral, with **all three FRD 9.1.x outcomes** — success · declined · indeterminate — and **only success writes**. ⛔ **No payment screen at all on the internal route** (`STK31-19`) |
| **`ND-13`** | May **Super Admin return a submission at the first-publication gate**? (`QP-26`) | `STK31-06` · `STK31-07` | The review settled **who publishes** and **who releases versions**. It said nothing about return authority | **Grant nothing and refuse nothing.** The Content Manager's request-changes path is unchanged. **Do not add a Super Admin control at the publication gate**, and do not remove one — there is none to remove |
| **`ND-14`** | **Support SLA / priority model** | `STK31-39` | 🔴 **Explicitly prohibited to invent.** The capability works without it | Track **status only** — received · in progress · resolved/closed. **No SLA clock, no priority field, no severity formula, no escalation path.** Adding a priority later is a **new field on an existing record** |
| **`ND-15`** | **Permanent-delete vs reversible / soft-delete MECHANISM** | `STK31-22` · `STK31-34` · `STK31-21` · `STK31-25` | The **user-facing actions are settled** — `Delete` in the Question Bank, student removal/deactivation, tenant termination. Only what happens **underneath** is open | **Keep the requested user-facing action and its label.** Implement it over a **reversible / soft-delete mechanism**: the object leaves the **active** set, and **historical records that reference it are preserved** — attempts and results for a deleted question, learning history for a deactivated student. **Do not invent a permanent destructive database operation**, and never make destruction the only path. ⛔ **`STK31-22` governs the mechanism, never the label** — it does not turn `Delete` into `Retire` or `Archive` |
| **`ND-16`** | **Delivery channel / mechanism for the 15-day expiry reminder** | `STK31-28` | 🔴 **The reminder itself is REQUIRED** — *"We will send reminders to Tenants 15 days ahead."* Only **how it reaches the Tenant** is unstated | Model a **reminder event fired at T-15 days**. ⛔ **Do not invent a channel** — not e-mail, not SMS, not push, not an external provider. Whichever channel is later confirmed becomes a **delivery target for an event that already exists.** Separately, an in-product **`Expiring soon`** attention row is **recommended supporting UX** — a design choice, **not a separate stakeholder requirement**, and **building it does not discharge the reminder** |

---

# B · Standing register items — carried, untouched by the 31 Aug review

**These pre-date the review and are unchanged by it. None blocks the unified build; each blocks a specific detail.**

| ID | Question | Status | Safe handling |
|---|---|---|---|
| `QT-01` | **Which XR delivery mechanism** — package download, container application, deep-link, other? | ⚪ **Open by explicit PM-05 instruction** | Batch 01's XR access is **deliberately mechanism-neutral** and survives every answer. `STK31-37` refines **packaging**, not mechanism. **Do not resolve during UI/UX** |
| `QT-02` | **The FRD defines no AR application architecture** | ⚪ Open, HIGH | AR is treated as **package-shaped** (`STK31-37`) without asserting a container model. The device-compatibility copy stays honest about what is known |
| `QT-03` | **Assessment configuration API contract** | ⚪ Open, HIGH | `STK31-35` documents the **boundary**, not the contract. No endpoint, payload or field type is proposed |
| `QT-04` | **XR sign-in under SSO** — FRD 2.4.4 device login vs 4.2.2 institutional SSO | ⚪ Open, HIGH | `STK31-44` settles the **portal** fallback. The **device** sign-in path stays unasserted |
| `QP-14` | **Who authorises and performs MR sideloading** | ⚪ Open | MR is **retained** (`STK31-45`). Sideloading is presented as an **institutionally provisioned route**, with no self-service path offered to a learner |
| `QD-01` | Which fields are **user-editable vs institution-owned** | ⚪ Open — **now reachable** | See `ND-04` |
| `QD-02` | **Phase-1 origin of role assignment** — how does an identity first exist? | 🟠 **Partly answered.** `STK31-21` / `STK31-41` settle **who assigns**; the origin mechanism is still open. FRD 7.4.2 and 8.3 are **Phase 3** | Design assignment against an **identity that already exists**; render origin as a **provenance line**. Invent no invitation, activation or account-creation mechanism |
| `QD-07` | Module/Experiment **metadata schema** | ⚪ Open | See `ND-05` |
| `QD-08` | **Curriculum validation rubric** for academic review | ⚪ Open | `STK31-08` settles **who owns Learning Outcomes**, not how they are judged. The review screen carries the decision, not a rubric |
| `QX-01` | Does **desktop-first ~1440px** extend to all workspaces? | ⚪ Open, HIGH — **now sharper** | **A public catalogue is not a desktop-only surface in practice.** Build the public area responsive from the start; resolve the rest at Stage 10 |
| `QX-02` | **WCAG 2.2 SC 1.4.10 Reflow** — currently **NOT MET** by agreed scope | ⚪ Open, HIGH — **now sharper** | Same reason. Do not widen the debt across nine workspaces; address it in the unified shell |
| `QX-03` | Who owns **captions, transcripts, audio description**? | ⚪ Open, HIGH — **now sharper** | 🔴 `STK31-17` puts **preview/video on a PUBLIC page**. A public video with no captions is a real accessibility exposure. **Do not ship the preview region without a caption commitment** |
| `Q-42` | Recovery when a **simulation completion event never arrives** | ⚪ Open | Batch 01 already ships *availability unknown* and *completion pending* states. Keep them |
| `Q-43` | **Server-authoritative assessment timer** | ⚪ Open | Batch 02's rule stands: **the platform prompts, it never auto-submits.** Re-confirm once a server exists |
| `Q-45` | Bundle **overlap** handling | ⚪ Open — deferred with B2C | Batch 04 shows the partly-held state and **deliberately does not sell it**. Keep that restraint |
| `QP-28` | Is a **Course** directly purchasable? | ⚪ Open | The FRD says *"direct course purchase is not specified"*. `STK31-12` makes the Course a **structural** level; it does not make it a product |

---

# C · What is deliberately NOT on this list

**Things that might look pending but are settled.** Listed so nobody re-opens them.

| Not pending | Settled by |
|---|---|
| Who performs **first publication** | `STK31-06` — Content Manager |
| Who performs **later version release/hold** | `STK31-07` — Super Admin |
| Who **grades descriptive answers** | `STK31-31` — Faculty, the only human evaluator |
| Who **approves a B2B request** | `STK31-20` / `STK31-21` — Super Admin, in-product |
| Who **assigns content to a learner or group** | `STK31-25` — Tenant Admin |
| Who owns **Learning Outcomes** | `STK31-08` — Academic Reviewer |
| Whether **Student and Learner** are two roles | `STK31-01` — **one role** |
| Whether **Tenant Admin and Institute Admin** are two roles | `STK31-02` — **one role** |
| Whether **Semester** is mandatory | `STK31-11` — **optional, never mandatory** |
| Whether the **B2B cart** checks out | `STK31-18` — **it does not** |
| Whether **MR** is still in scope | `STK31-45` — **yes** |
| What a **Bundle** is | `STK31-12` / `STK31-13` |
| Whether **technology** is selectable | `STK31-15` — **yes** |
| Whether there is a **universal seat cap** | `STK31-27` — **no** |
| Whether the **15-day Tenant expiry reminder** is required | `STK31-28` — **yes, REQUIRED.** Only the channel is pending (`ND-16`). *The in-product `Expiring soon` row is recommended UX, not a separate requirement* |
| Whether the Question Bank action is **`Delete`** | `STK31-34` — **yes, `Delete`.** Not `Retire`, not `Archive` |
| Whether **`Programme`** and **`Academic Stream`** must be separate records | `STK31-12` / `STK31-10` — **no. One grouping level** |
| Whether **content production** is deferred | **No.** P1 is **build order**, not phase scope — it is required for the current delivery |
| Whether **B2C is deleted** | `STK31-04` — **no, deferred and preserved** |
| Whether **certification** returns to Phase 1 | **PM-12 — no.** Untouched |
