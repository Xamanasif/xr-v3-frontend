# Batch 03 — Institute Admin UX Model

The workspace, its information architecture, its vocabulary, its states, and the register of design assumptions that hold it together while `OQ-01` … `OQ-06` remain open.

---

## 1 · What the Institute Admin needs to know

FRD 8.1.3 defines the role in one sentence — *institutional configuration, course structures, student access, institutional reporting*. Batch 03 turns that into five questions the workspace must answer without a manual:

| Question | Where it is answered |
|---|---|
| **Who is in my institution?** | People (INA-02, INA-03) |
| **What content does my institution have access to?** | Content Access (INA-06, INA-07) |
| **Who is eligible for that content?** | Access Mapping (INA-08) · the eligibility list on every access record · the access summary on every person and every stream |
| **Is my institution's identity and data setup healthy?** | Institution Setup (INA-09) → Single sign-on (INA-10) · Institution data (INA-11) |
| **What needs my attention right now?** | Overview (INA-01) → Records needing attention (INA-12) |

Everything else was excluded. There is no reporting section, no billing section, no device section, no assessment section, no content-editing section — each because a source says it belongs to another role or another phase (`01_SOURCE_AND_SCOPE.md` §3, §4).

---

## 2 · Information architecture

```
INSTITUTE ADMIN WORKSPACE                       one institution only (FRD 1.3.1, 1.3.4)
│                                               no institution switcher exists
├── Overview ................................. operational status only (PM-11)
│     · needs attention (the work list)
│     · people · content access · sign-in · institution data
│
├── People ................................... FRD 8.1.3 "student access" · 7.2.2
│     └── Person detail ...................... identity · role · academic context
│           · authentication & provenance      · content access summary
│
├── Academic Structure ....................... FRD 7.2.3 · 3.2.1 · 8.1.3
│     · academic streams · groups · courses (view-only — 3.4.x is Phase 2)
│     └── Stream / group detail ............... members · faculty · content access reaching it
│
├── Content Access ........................... FRD 6.2.1 · 8.1.3 · reframed for OQ-01/02
│     · the access records the institution holds
│     ├── Content access detail ............... what it covers · who it reaches
│     └── Access mapping ..................... the institution-wide eligibility view (IAD-08)
│
└── Institution Setup ........................ FRD 4.2.1
      · institution profile · setup status of both connections
      ├── Single sign-on ..................... FRD 4.2.2 · PM-10          ← the core new surface
      ├── Institution data ................... FRD 7.1.1 · 7.1.2 · 7.2.1
      └── Records needing attention .......... FRD 7.2.1 exception handling
```

**Five primary navigation items, depth 2 at most.** This matches the Review-006 IA (*"Institute Admin — 5 + Account, depth 2 — Integrations → SSO"*), with the group name and two item labels changed for the reasons in `DA-01` … `DA-03`.

### Why the Overview is not a dashboard

PM-11 is explicit: core operations first, no invented analytics. The Overview passes one test on every element — *does this tell me whether my institution is working right now?* Four status cards and one attention list pass. Charts, trends, adoption rates, completion percentages and licence-utilisation gauges do not, and none appears. FRD 8.2.x (institutional usage dashboard) and 11.3.x (adoption reports) are **Phase 2** and are absent rather than greyed out.

---

## 3 · The access model in the interface

The stable spine (`01_SOURCE_AND_SCOPE.md` §2) appears in the UI as four objects:

| Object | User-facing name | What it is | Source |
|---|---|---|---|
| Access record | **Content access** | The record that says this institution may use certain published content | FRD 6.2.1 · 8.1.3 |
| Covered content | **What this covers** | The published experiments the record includes, enumerated | FRD 1.4.4 · 1.1.4 |
| Eligibility relationship | **Who this reaches** | The link between one access record and one institutional population | FRD 7.2.3 · matrix `H4`, `H5`, `E3` |
| Learner eligibility | **Included in your institution's access** | The learner-side consequence | Batch-01 vocabulary, reused verbatim |

### The three rules that keep it honest

1. **An access record is never described by a commercial unit.** It has a name and a list of the content it covers. It is not a bundle, package, plan, subscription, catalogue, licence tier or order. *(`OQ-02` open.)*
2. **An access record never shows how it was acquired, or who recorded it.** Its origin line is a **date and nothing else**. No actor is named, because no source confirms one and every candidate answer to `OQ-01` implies a different one. *(`OQ-01` open; `DA-11`.)*
3. **Eligibility is a relationship, not a transaction.** The interface shows that a relationship exists, what it covers and how many people it reaches. It never states who is required to create it. *(`OQ-04` open; `DA-06`, `DA-07`.)*

### The handoff, end to end

```
Content access record: "Thermodynamics XR"          status: Active
        │                                            covers: Heat Exchanger Analysis (VR)
        │  no eligibility yet ──▶ nobody in the institution can see it
        │                          (INA-06 flags it · INA-08 lists it · INA-07 explains it)
        ▼
Eligibility added: academic stream "B.E. Civil Engineering"
        │
        ▼
Every learner in that stream becomes eligible          ← INA-03 person detail reflects it
        │                                                 INA-05 stream detail reflects it
        ▼
"Thermodynamics — Heat Exchanger Analysis" appears in that learner's My Learning
        with "Included in your institution's access"      ← INA-13 verification view
```

Removing the eligibility reverses every step, including the learner's view. **The prototype demonstrates the relationship in both directions**, which is the whole point of the batch — and the mechanism by which the relationship comes to exist remains open.

---

## 4 · Vocabulary (user-facing)

All of it is design-assumption wording unless a source is named. None of it is an internal identifier; **no FRD number, PM code, QP/QT/QD/QX reference, screen ID or gate number appears in any product surface** (`C-07`, carried from Batch 01).

### Content access

`Active` · `Not yet reaching learners` (an active record with no eligibility) · `No content access yet` (institution-level empty state).
Fields: **Covers** · **Reaches** · **Effective from** · **Effective to** · **Recorded**.

Deliberately absent: *purchased · subscribed · plan · tier · seats · renew · expired · invoice · price · order · quota*.

### Eligibility

`Reaches N learners` · `Not yet reaching learners` · **`Included in your institution's access`** (learner side — Batch-01 wording, reused unchanged) · `Not currently included in your institution's access` (learner side, not-eligible state).

### People

Account state: `Active` · `Awaiting first sign-in` · `Needs attention`.
Provenance: `From institution data` · `—` (shown where the origin is not something the platform can state, e.g. Faculty; see `DA-04`).

### Single sign-on

`Not set up` · `Details saved — connection not checked` · `Connection check failed` · `Institutional sign-in on`.
Actions: **Save details** · **Check connection** · **Turn on institutional sign-in**.
Deliberately absent: any protocol name, any provider brand, any certificate/metadata/claim/assertion field name, any role-mapping control (Phase 3).

### Institution data

`Connected` · `Not connected` · `Last run: completed` · `Last run: completed with issues` · `Running`.
Fields: **Schedule** · **Last run** · **Updated in the last run** · **Records needing attention**.
Deliberately absent: endpoint, host, credential, token, payload, field name, table, API version, provider brand.

### Records needing attention

Every row states **what happened** and **what to do next**, in that order, with no internal code — the Batch-01 error grammar (`D-18`, `STATE-03`). The available action is **Retry these records**, which is the behaviour the consolidated FRD describes (*"keeps failed records with a reason so they can be retried"*).

---

## 5 · Screen-by-screen intent

| ID | Screen | The one thing it must do | Key states |
|---|---|---|---|
| **INA-01** | Institution Overview | Tell the administrator whether the institution is working, and what needs them | populated · all clear · attention items present |
| **INA-02** | People | Show who is in the institution and where each person sits | all · learners · faculty · filtered-empty · needs-attention row · empty institution |
| **INA-03** | Person Detail | Answer *"what can this person reach, and why?"* | active learner with access · learner with no access · faculty · unmatched record |
| **INA-04** | Academic Structure | Show the institution's streams, groups and courses and their origin | populated · stream not set up (attention) · empty |
| **INA-05** | Stream / Group Detail | Show members, faculty and the content access reaching this population | reached by access · not reached by any access |
| **INA-06** | Content Access | The institution's access records at a glance | populated · one record not yet reaching learners · **no access records yet** |
| **INA-07** | Content Access Detail | *What may we use, and who currently receives it?* | active + mapped · active + unmapped · after adding eligibility |
| **INA-08** | Access Mapping | The institution-wide eligibility picture, from both directions | mapped · gaps present |
| **INA-09** | Institution Setup | The institution record plus the health of both connections | ready · setup incomplete |
| **INA-10** | Single Sign-On | Get institutional sign-in configured, checked and on | not set up · details saved · check failed · on |
| **INA-11** | Institution Data | Connection health, schedule and last-run outcome | connected + healthy · completed with issues · running · not connected |
| **INA-12** | Records Needing Attention | Turn a partial sync into a short list of understandable next steps | issues present · all clear |
| **INA-13** | Learner Access Check | Prove the handoff reaches the learner | eligible content present · not currently eligible |

---

## 6 · State inventory (23 important states)

**People and structure** — ① directory populated ② filtered to Faculty ③ filtered-empty (search) ④ person record needing attention ⑤ empty institution ⑥ person detail with content access ⑦ person detail with no content access yet ⑧ faculty person detail ⑨ academic structure populated ⑩ stream flagged *not set up* ⑪ stream detail reached by access ⑫ stream detail not reached by any access.

**Content access** — ⑬ access list populated ⑭ access record **not yet reaching learners** ⑮ **no content access yet** (institution-level empty state) ⑯ access detail with eligibility ⑰ access detail with no eligibility ⑱ access mapping showing gaps.

**Identity and data** — ⑲ single sign-on **not set up** ⑳ single sign-on **connection check failed** ㉑ single sign-on **on** ㉒ institution data **completed with issues** (with the attention list) ㉓ institution data **healthy**.

*(Plus the learner-side pair: content present / not currently eligible — counted with INA-13 rather than twice.)*

---

## 7 · Design assumption register

Each entry states **the choice**, **why it was necessary**, **whether it is reversible**, and **the PM decision that would change it**. None of these is presented anywhere as a confirmed requirement.

### `DA-01` — Five-item navigation

**Choice.** Overview · People · Academic Structure · Content Access · Institution Setup, with Single sign-on, Institution data and Records needing attention as sub-pages of Institution Setup.
**Why.** The Review-006 IA specifies five primary items and depth 2 for this workspace; a flat seven-item nav would put two integration pages at the same level as the institution's core operational areas.
**Reversible.** Yes — grouping and labels only; no screen changes if the grouping changes.
**Changed by.** A PM decision on navigation naming, or the addition of an institutional area not currently in Phase 1.

### `DA-02` — "Academic Structure" rather than "Programs / Groups"

**Choice.** The navigation label is **Academic Structure**. The entities inside keep the terms the sources use: **academic stream** (FRD 7.2.3, 6.2.1), **group** (consolidated FRD — *"assigns content to learners and groups"*; matrix `E3` cohort), **course** (FRD 3.2.1, 8.1.3).
**Why.** The task brief suggested "Programs / Groups" but also instructed that better source-supported terminology should win. **"Program" is not a term the FRD uses for this structure** — its only Phase-1 appearance is *certification programs* (3.3.1), which PM-12 defers to Phase 2. Using it here would borrow a word that already means something else.
**Reversible.** Yes — wording only.
**Changed by.** A PM or institutional preference for local terminology (e.g. *programme*, *branch*, *department*).
**Recorded as a design normalisation:** the grouping of stream + group + course under one navigation area is a **presentation** decision; the three entity types are separate in the source model and remain separately labelled and separately typed in the interface.

### `DA-03` — "Content Access" rather than "Licences"

**Choice.** The navigation item, the page and the record are called **Content Access**.
**Why.** `OQ-01` and `OQ-02` are open. "Licences" names a commercial instrument; the interface would then be asserting one. "Content access" is true under every candidate model and is the abstraction the task brief specifies.
**Reversible.** Yes — wording only; the record and its fields are unchanged.
**Changed by.** `OQ-01` / `OQ-02` resolving to a named commercial model.

### `DA-04` — No account creation or removal in People

**Choice.** The People directory has no *Add person*, *Invite*, *Create account*, *Deactivate* or *Remove* control.
**Why.** Accounts arrive through the institution data connection (FRD 7.2.2) and the brief instructs that provisioning must stay flexible. Matrix `A5` does grant the Institute Admin `M` over learner accounts, so a lifecycle control is *permitted* — but for **Faculty**, matrix `A6` is `?` (PENDING) and `QP-07` records that **who creates a Faculty account is genuinely undefined**. Offering creation for one and not the other would look like an omission; offering it for both would invent authority.
**Reversible.** Yes — purely additive.
**Changed by.** `QP-07`, or a PM decision on provisioning ownership and manual overrides.

### `DA-05` — Access records described by covered content

**Choice.** Every access record shows an enumerated list of the published content it covers. No packaging noun is used.
**Why.** `OQ-02` is open. The covered content is definite; the unit that wraps it is not.
**Reversible.** Yes — presentation only.
**Changed by.** `OQ-02`.

### `DA-06` — Eligibility modelled as a relationship

**Choice.** Access reaches learners through a relationship between an **access record** and an **institutional population** (academic stream, group, or an individual person).
**Why.** FRD 7.2.3 establishes stream-derived access and matrix `H4`/`H5`/`E3` establish stream, cohort and individual as the objects an assignment can attach to. A relationship model survives every `OQ-04` outcome — whether the relationship is created by an administrator, by faculty, by institutional data, or by a combination, *the relationship itself is what the learner's access reads from*.
**Reversible.** Yes. What is **not** claimed: that all three population types are required, that any of them is the primary mechanism, or that an administrator is the one who creates them.
**Changed by.** `OQ-04`.

### `DA-07` — Eligibility editable from the access record — **DESIGN ASSUMPTION — REVERSIBLE**

**Choice.** In this prototype, eligibility is added and removed from the **Content Access Detail** screen, through a dialog that offers academic stream, group or individual person.
**Why.** The batch has to *demonstrate the handoff*; a static picture cannot show that a learner's My Learning changes when the relationship changes. The access record is the object that owns the relationship, so it is the natural place to edit it.
**Reversible — and this is the single most reversible decision in the batch.** It is one dialog on one screen. If `OQ-04` resolves to institutional-data-driven assignment, the dialog disappears and the same list becomes read-only with a provenance line. If it resolves to Faculty ownership, the same list moves to the Faculty workspace. **In neither case does any other screen change.**
**Explicitly not claimed.** That the Institute Admin is the assigner · that manual assignment is required · that automatic assignment from institutional data is required · that individual-learner mapping is required.
**Changed by.** `OQ-04`, matrix `H5`.

### `DA-08` — No seat counts anywhere

**Choice.** No seat count, cap, "N of M used", utilisation bar, capacity warning or "seats remaining" figure appears in Batch 03. `IAD-10` (seat utilisation) is not built.
**Why.** FRD 6.2.2 does describe a licence capped by student count, and the Review-006 IA argued that seat utilisation earns a place on the Overview because a cap is the cause of a learner-facing wall. **But `OQ-03` — the seat model — is explicitly OPEN as of 2026-08-25**, and the task brief instructs that seat numbers be avoided where they are not necessary. A displayed number would imply a model that has not been chosen, and every downstream affordance (top up, request more, near-cap warning) would compound the invention.

> **Recorded source contradiction — deliberately not resolved by drawing.** The consolidated FRD v5 draft goes further than 6.2.2: it lists *"Monitor licence seat utilisation before it is exhausted"* among the Institute Admin's primary responsibilities, *"View institutional licences and seat utilisation (6.2.1, 6.2.2)"* among its permitted actions, and carries the acceptance criterion *"Given a licence approaching its seat cap, when the Institute Admin views the institution overview, then seat utilisation is visible before learners are blocked."*
>
> **Batch 03 does not satisfy that criterion, on purpose.** The FRD v5 set is a **draft for review, not yet approved**; the PM update of **2026-08-25** reopened the seat model as `OQ-03`; and the task brief for this batch instructed that seat counts be avoided where unnecessary. Under the batch's authority order (PM decisions → FRD → Review 006 → assumptions), the PM statement is the later and higher authority. **The gap is recorded here rather than closed by inventing a number.** If `OQ-03` confirms a cap, this criterion becomes satisfiable by adding one capacity row to `INA-06`/`INA-07` and one status to the Overview — no other screen changes.
**What is shown instead.** The number of people in the institution, and the number of learners an eligibility relationship reaches. Both are consequences of institutional data and mapping — neither is a licence capacity.
**Reversible.** Yes — entirely additive. A capacity figure would attach to the access record and appear as one more row on INA-06/INA-07.
**Changed by.** `OQ-03`, matrix `H3`, FRD 6.2.2.

### `DA-09` — Effective dates as data, with no expiry behaviour

**Choice.** Access records show **Effective from** and **Effective to** where the record has them, as plain record data. There is no countdown, no "expiring soon" state, no expiry warning, no renewal action, and no statement of what happens when a date passes.
**Why.** `D-24` requires access-duration values to be data-driven and never invented, and **post-expiry product behaviour is not defined by any source**. Drawing an expiry state would define it.
**Reversible.** Yes.
**Changed by.** A PM decision on access-term behaviour. **Until then, post-expiry behaviour remains PENDING and is not represented.**

### `DA-10` — No audit or history timeline

**Choice.** Changes to access, eligibility, people or configuration are not recorded in a visible history anywhere in the workspace. The Batch-01 review-history timeline is **not** reused here.
**Why.** `M4`: the audit trail for licensing, entitlement, configuration and device decisions is **undefined**, and PM-14's traceability requirement is scoped explicitly to the content-governance chain and no further. A timeline would imply a retention and visibility model nobody has specified.
**Reversible.** Yes — the component already exists in Batch 01 and would drop straight in.
**Changed by.** `M4` being defined.

### `DA-11` — Access-record origin line

**Choice.** Each access record shows **Recorded** with a **date only**. **No actor is named.** The record also carries a human-readable **Reference**, and the rail note reads *"Quote this reference in any query about this content access."*
**Why.** An administrator needs to know when a record came into effect and to have something to quote when asking about it. Neither of those needs an owner to be named — and naming one would assert an operational owner for a process whose ownership is open.
**Withdrawn wording, recorded rather than hidden.** An earlier draft of this batch read **"Recorded — by the platform team"**, and the Content Access empty state read *"When the platform team records content access for your institution…"*. **Both were withdrawn during the requirement-safety check:** *"the platform team"* is not one of the seven approved roles, and no source confirms who records institutional content access. `OQ-01` is open, and the FRD's own list of unresolved Institute Admin details includes *"how an institutional licence is transacted in Phase 1"*.
**What was deliberately kept.** *"The exact details required will be confirmed by the platform team"* remains on the single sign-on form. That usage is the **Batch-01 precedent** (*"Package requirements will be confirmed by the platform team"*) and refers to **who will later confirm a pending technical detail** — not to who owns institutional content access. The two usages are different claims and are treated differently.
**Reversible.** Yes — wording only.
**Changed by.** `OQ-01`, or a PM decision naming the actor that records institutional content access.

### `DA-12` — Status vocabulary

**Choice.** `Active` · `Awaiting first sign-in` · `Needs attention` (accounts); `Active` · `Not yet reaching learners` (access records).
**Why.** No source names a lifecycle vocabulary for either object. These read naturally, describe the observable state rather than a policy, and none of them implies an action that has not been confirmed.
**Reversible.** Yes — wording only.
**Changed by.** A PM decision on lifecycle vocabulary.

### `DA-13` — Single sign-on state model

**Choice.** **Not set up → Details saved (connection not checked) → Connection check failed / checked → Institutional sign-in on.**
**Why — and the part that is NOT an assumption.** The **ordering constraint is a confirmed acceptance criterion**, not a design choice: *"Given a configured identity provider, when the Institute Admin runs a connection test, then the outcome is reported explicitly and an enabled state is reached only after a successful test."* The Review-006 `IAD-13` row lists the same four states (*Not configured · configured · test failed · enabled*).
**What remains an assumption:** only the **plain-language wording** of the four state labels. The state machine and its ordering are sourced, and the prototype enforces the ordering — institutional sign-in cannot be turned on before a check has passed.
**Reversible.** Yes — wording only.
**Changed by.** `QD-04`, which will also determine what the "details" actually are.

### `DA-15` — "Run now" on Institution Data — **DESIGN ASSUMPTION, REVERSIBLE**

**Choice.** `INA-11` offers a **Run now** control that starts a synchronisation run immediately.
**Why this is an assumption, stated plainly.** **No authoritative source establishes a manual or on-demand synchronisation for this role.** FRD 7.2.1 requires *scheduled* synchronisation *at configurable intervals*; its acceptance criterion is *"An Institute Admin sets the synchronisation interval and can see the last run, its outcome, its counts and its errors"*; and the Institute Admin's permitted actions list reads *"Configure ERP integration and synchronisation interval (7.1.1, 7.1.2, 7.2.1)"*. The institutional-integration flow contains only *"Scheduled synchronisation runs at the interval the Institute Admin has configured."* **A manual run appears nowhere in the FRD set.** Its only prior appearance anywhere is a single cell in the Review-006 screen inventory (`10_FULL_PLATFORM_SCREEN_INVENTORY.md`, `IAD-12`, *"Set interval · run now"*) — a design-inventory entry, not a requirement.
**Why it was kept rather than removed.** It is the only way to reach the **run-in-progress** state, and the natural action after the institution's own records have been corrected at source — which is the resolution half of the batch's exception flow. It is a plausible administrative affordance, but it is **not presented as a confirmed requirement anywhere**.
**Reversible.** Yes — completely. It is one button and one handler on one screen. Removing it costs one state (run-in-progress) and changes **no other screen, no data, and no other flow**; the confirmed retry path on `INA-12` continues to work on its own.
**Changed by.** A PM or engineering decision on whether an institution may trigger a synchronisation outside its schedule.

### `DA-14` — Learner Access Check is one read-only view

**Choice.** INA-13 renders a single My Learning view in the Learner shell, read-only, with no module, simulation, device or assessment surface.
**Why.** The batch must prove the handoff without duplicating the Learner workspace (Batch 01) or the learner assessment experience (Batch 02), and without adding a non-functional control (`C-08`).
**Reversible.** Yes — it is a verification surface, not a product screen proposal.
**Changed by.** Nothing product-facing; it is removed once the handoff is accepted.

---

## 8 · Rules applied throughout

1. **Tenant boundary is structural.** No institution switcher, no cross-institution figure, no comparison. FRD 1.3.1, 1.3.4.
2. **Operational, not analytical.** Every number answers *"what is the state of the thing I operate right now?"* PM-11.
3. **Phase boundaries are absences, not disabled controls.** Course authoring, device management, dashboards and reports are simply not there. Nothing is greyed out to hint at a future feature.
4. **Prohibitions are expressed positively.** The Institute Admin sees *what content the institution may use*; there is no disabled edit control on content to imply an authority that will never exist (FRD 1.1.4).
5. **Externally-sourced data is read-only with its origin stated.** `QD-01` working position; matrix `J6`.
6. **No implementation vocabulary in product UI.** No protocol, provider, endpoint, credential, payload, schema, table or API term anywhere a user can see.
7. **Every error and exception states what happened and what to do next.** Batch-01 grammar, `D-18`.
8. **Sample values are tagged** wherever they could be mistaken for approved business values.
9. **Internal caveats live in documentation, not in the product surface.** The screens read as a usable product; the open questions are recorded here, in `01_SOURCE_AND_SCOPE.md`, and in the QA record.
