# Batch 03 — Source & Scope Audit

**Package:** `ui-ux/13-full-platform-design/batch03-institute-admin/` · **Branch:** `uiux/full-platform-design` · **Date:** 2026-08-25
**Flow:** Review-006 **FLOW 2** (B2B institutional — institutional half) · **FLOW 6** (institutional identity / SSO, Rank 4) · **FLOW 9** and **FLOW 10** (access-change and synchronisation, administrator end)
**Roles in batch:** **Institute Admin** (detailed) · **Learner** (one verification view only, to prove the access handoff). No other role is introduced.
**Figma:** deferred — unchanged from Batch 01 and Batch 02.

This audit was completed **before** design work. Every element in the Batch-03 wireframes and prototype traces to a row below.

| Class | Meaning |
|---|---|
| **CONFIRMED** | Stated by the FRD or a PM decision. Designed as required behaviour. |
| **SUPPORTED CONFIGURATION** | The *field* or *surface* is supported by the authoritative model; **every value shown is SAMPLE DESIGN DATA**, never a default, a recommendation or a business rule. |
| **DESIGN ASSUMPTION** | Reversible design position taken to make the flow usable; labelled, and revisitable without re-architecting. |
| **PRODUCT-PENDING** | Awaiting a product decision. Represented without resolving it, or omitted. |
| **TECHNICAL-PENDING** | Awaiting a technical decision. Kept abstract — no provider, protocol, endpoint, payload or schema is named. |

---

## 1 · Authoritative sources read

1. `ui-ux/00-project-context/PM_CONFIRMED_BASELINE_2026-08-18.md` — PM-01 … PM-12, especially **PM-03** (control/entitlement/administration plane), **PM-04** (B2B and B2C both required), **PM-05** (entitlement-aware delivery, mechanism unselected), **PM-10** (institutional SSO required, provider/protocol/attribute mapping pending), **PM-11** (operational status first, no analytics dashboards), **PM-12** (no certification).
2. `ui-ux/00-project-context/PM_CONFIRMED_UPDATE_2026-08-25.md` — PM-16/17/18 (publication ownership; **not revisited here**) and the **six open questions OQ-01 … OQ-06**, which govern this batch more than any other single source.
3. `requirements/updated-frd/Core frd.pdf` (v5 consolidated) — Ch. 6 two-plane architecture · Ch. 7 role model (Institute Admin row) · Ch. 8 capability summary · §9.6 institutional integration setup · Ch. 13 commerce, licensing and entitlements · Ch. 14 single sign-on, ERP and external integrations · Ch. 15 security and data boundaries · Ch. 16 reporting strategy.
4. `requirements/updated-frd/TL frd.pdf` — §3 (who uses the platform), §5 (two routes in, one entitlement).
5. `requirements/updated-frd/Detailed frd.pdf` — consulted only for exact traceability on 4.2.1, 4.2.2, 6.2.1, 6.2.2, 7.1.1, 7.1.2, 7.2.1, 7.2.2, 7.2.3, 8.1.3, 1.3.1, 1.3.4.
6. `ui-ux/12-full-platform-reframe/` — `02_ROLE_PERMISSION_MATRIX.md` (§A, §C, §G, §H, §J, §K, §L), `03_SHARED_CAPABILITY_MAP.md`, `04_PLATFORM_INFORMATION_ARCHITECTURE.md` (Part 3, the `IAD` workspace), `05_END_TO_END_WORKFLOWS.md` (FLOW 2, 6, 9, 10), `06_B2B_B2C_JOURNEYS.md` (Part 2, B1–B20), `10_FULL_PLATFORM_SCREEN_INVENTORY.md` (`IAD-01 … IAD-14`), `11_OPEN_QUESTIONS_REFRAMED.md`, `13_PM_CLOSURE_DECISIONS.md` (PM-13).
7. `ui-ux/13-full-platform-design/` — Batch-01 foundations, shell and component system; `batch02-assessment/` conventions. **Read only. Neither batch is modified.**

**Authority order applied:** PM-confirmed decisions → FRD + consolidated FRD v5 → Review 006 + PM closure → Batch-01/02 patterns → labelled design assumptions. **No unresolved question was converted into a requirement.**

---

## 2 · The question this batch answers

> **PM (2026-08-25):** *"How will the learner get subscribed / get access to see all these courses/content?"*

The **commercial** half of that question is **not answered here** — it is `OQ-01` … `OQ-04` and remains open. What Batch 03 designs is the half that is stable regardless of how the commercial half resolves:

```
INSTITUTION CONTENT ACCESS        an access record the institution holds
          ↓                        (how it was acquired is upstream and OPEN)
      ACCESS SCOPE                 the published content the record covers
          ↓
   ELIGIBILITY MAPPING             which institutional population the record reaches
          ↓
   LEARNER ELIGIBILITY             this person may open this content
          ↓
  CONTENT APPEARS IN MY LEARNING
```

Every screen in the batch is placed on that spine. **Nothing upstream of "an access record exists" is designed** — no checkout, pricing, payment, invoice, renewal, purchase card, subscription tier or seat price appears anywhere (task brief §7; `QP-04` open; institutional billing FRD 9.3.x is Phase 2).

---

## 3 · Phase-1 requirements in scope

| Req | Text (abridged) | Class | Batch-03 treatment |
|---|---|---|---|
| **8.1.3** | Institute Admin role — *institutional configuration, course structures, student access, institutional reporting* | **CONFIRMED** | The whole workspace. All five navigation areas trace to one of the four clauses. |
| **1.3.1** | Tenant-wise data isolation | **CONFIRMED** | Everything is scoped to one institution. **No institution switcher exists anywhere** — the constraint is expressed structurally, not as a disabled control. |
| **1.3.4** | Analytics/reporting confined to the institution's own dataset | **CONFIRMED** | Every count and every list is institution-scoped. Nothing compares institutions. |
| **4.2.1** | Institutional registration / onboarding | **CONFIRMED** | INA-09 Institution Setup carries the institution profile (matrix `A4` = `V E`ᵗ for Institute Admin). Creating an institution is Super Admin work and is **not** in this batch. |
| **4.2.2** | *Institutions shall be able to configure single sign-on authentication through supported identity providers* | **CONFIRMED** (Phase 1 per **PM-10**, resolving the FRD's own 4.2.2 / 7.4.1 phase contradiction) | INA-10. Designed as **configure → check → enable**, exactly the three verbs the consolidated FRD uses. **Provider, protocol and attribute mapping are TECHNICAL-PENDING and are not named.** |
| **7.4.2** | Role mapping from identity-provider attributes | **⛔ Phase 3** | Absent. Not drawn, not disabled, not hinted. |
| **7.1.1 / 7.1.2** | ERP integration by standard API; institutional data exchange | **CONFIRMED** (capability) · provider and contract **TECHNICAL-PENDING** | INA-11 Institution data. Connection presented at a UX level only. **No endpoint, credential field, payload, schema or provider name appears.** |
| **7.2.1** | Scheduled synchronisation at institution-configurable intervals | **CONFIRMED** — *"An Institute Admin sets the synchronisation interval and can see the last run, its outcome, its counts and its errors"* | INA-11 schedule + last run + counts + errors + run history. **`Run now` is NOT covered by this requirement** and is carried as `DA-15` — see below. |
| **7.2.1** (exception handling) | Failed records retained with a reason; retry available | **CONFIRMED** — *"Given a failed ERP synchronisation run, when the Institute Admin views synchronisation history, then failed records are retained with a reason and a retry is available"* | INA-12. **Retry is the only action offered**, and it is the sourced one. |
| **7.2.2** | Accounts provisioned from institutional data | **CONFIRMED** | People arrive through the institution data connection; the directory shows provenance. **No manual account-creation control is offered** — see `DA-04`. |
| **7.2.3** | Stream-based access assignment | **CONFIRMED** (the *mechanism class* — stream-derived access exists) · the *assignment authority* is **PRODUCT-PENDING** (`OQ-04`) | The eligibility mapping in INA-07/INA-08 is built on stream and group relationships because 7.2.3 supports them; **who performs or triggers the mapping is not asserted** — see `DA-06`. |
| **6.2.1** | Institutions hold packages mapped to academic streams | **CONFIRMED** that institutional access exists and relates to academic streams · **what is purchased is `OQ-02`, OPEN** | Access records are presented **by the published content they cover**, enumerated item by item. The packaging unit (module / bundle / course / catalogue) is **never named** — see `DA-05`. |
| **6.2.2** | Licence capped by maximum student count | **CONFIRMED in the FRD** · the seat model is **`OQ-03`, OPEN by PM** | **No seat count, cap, utilisation figure or "seats remaining" indicator appears anywhere in Batch 03.** See `DA-08` for the full reasoning and what would reverse it. |
| **2.2.2 / 10.1.2** | Licence validation before delivery and again before execution | **CONFIRMED** | Referenced only as the learner-side consequence already designed in Batch 01; Batch 03 adds no execution-time surface. |
| **3.2.1 / 3.2.2** | Course structure and module sequence | **CONFIRMED** | Courses appear in the academic structure as **view-only** context. |
| **3.4.1 / 3.4.2** | In-platform institutional course creation and module mapping | **⛔ Phase 2** (tension **T-1**) | Absent. The Institute Admin **views** academic structure that arrives from institutional data; there is **no course authoring tool**. |
| **2.5.x / 2.6.x** | XR device registration; remote enable/disable on devices | **⛔ Phase 2** | Absent. No device administration anywhere in the workspace. |
| **8.2.1 / 8.2.2** | Institutional usage dashboard; licence-utilisation tracking | **⛔ Phase 2** | Absent. |
| **11.3.1 / 11.3.2** | Class-level and institutional adoption reports | **⛔ Phase 2** | Absent. |
| **11.1.x / 11.2.x** | Completion, time, scores and attempts are **recorded** | **CONFIRMED** (recording) | Not surfaced as an Institute Admin analytics view (PM-11). Person detail shows **operational access state**, not performance. |
| **1.1.4** | All content owned and governed centrally; institutions may not modify or redistribute it | **CONFIRMED — prohibition** | The Institute Admin can see *what content the institution may use*. There is **no edit, upload, version or withdraw control** on content anywhere in the workspace. |
| **PM-11** | Core operations first; no large analytics dashboards; detailed KPIs pending | **CONFIRMED** | The Overview is an operational status page: what needs attention, and four facts about whether the institution is working. **No charts, no trends, no KPIs.** |
| **PM-13** | Two-plane model; Institute Admin sits on the tenant plane | **CONFIRMED** | No central-plane surface (no submissions, no review queue, no publication) appears in this workspace. |
| **PM-10** | Institutional SSO required; provider/protocol/mapping pending | **CONFIRMED** | INA-10 exists because of PM-10 and stays generic because of PM-10. |
| **PM-05** | Entitlement-aware XR delivery; mechanism unselected | **CONFIRMED requirement, mechanism PENDING** | Batch 03 stops at *eligibility*. Device delivery is Batch-01 territory and its mechanism-neutral copy is not restated or extended. |
| **PM-12** | Certification is Phase 2 | **CONFIRMED** | Nothing certification-related appears. |

## 4 · Role permissions applied (Review-006 matrix)

| # | Capability | Institute Admin cell | Batch-03 treatment |
|---|---|---|---|
| `A3` | Institutional SSO configuration | **`V Cf`ᵗ** | INA-10 — full configure/check/enable surface. |
| `A4` | Institutional onboarding / organisation record | `V E`ᵗ | INA-09 — view and edit the institution profile. Not create. |
| `A5` | Institutional user accounts (learners) | `V M A`ᵗ | **View and access-context only.** `M` (lifecycle incl. removal) is deliberately **not exercised** — see `DA-04`. |
| `A6` | Institutional user accounts (faculty) | **`?` PENDING** | Faculty are **listed** for institutional visibility; **no create, edit, provision or remove control is offered**, and no provisioning origin is claimed. |
| `A8` | Session & password policy | `?` PENDING | Absent. |
| `C1` | Published module catalogue | `V`ᵗ | The institution sees the published content its access records cover. Read-only. |
| `C4` | Course structure | `V A`ᵗ | Courses shown as read-only academic context. |
| `C5` | Create a course in-platform | **⛔ Phase 2** | Absent. |
| `C7` | Content modification / redistribution | **⛔ prohibited (1.1.4)** | No control exists that could produce it. |
| `E3` | Assign course / module to learners or cohorts | `A`ᵗ | The eligibility relationship in INA-07/08 is the Batch-03 realisation of this verb at **institutional access** level. Faculty-level teaching assignment is Batch-02/Faculty territory and is not duplicated. |
| `F1 / F3 / F6` | Assessment authoring / configuration | **`?` — PM-15 explicitly declines to grant it** | **No assessment surface of any kind appears in the Institute Admin workspace.** |
| `G3` | Entitlement-aware device delivery | `?` PENDING | Not designed. No device or delivery control in this workspace. |
| `G7` | Shared institutional device access | `V`ᵗ | Not surfaced — no Batch-03 flow needs it, and 2.5.x/2.6.x device administration is Phase 2. |
| `G8 / G9 / G10` | Sideloading authority · device registration · remote module control | `?` / ⛔ Phase 2 | Absent. |
| `H1` | View entitlements held in the institution | `V`ᵗ | Person detail "content access" summary; access-record eligibility lists. |
| `H2` | Institutional access record | `V`ᵗ **`Pu?`** | **View only.** `Pu?` (whether an Institute Admin ever transacts a purchase) is `QP-04`/`OQ-01`, **OPEN** — no purchase control exists. |
| `H3` | Capped licence — seat count and utilisation | `V`ᵗ | **Not surfaced.** `OQ-03` open; see `DA-08`. |
| `H4` | Stream → package mapping | `V A`ᵗ | INA-08, built as **content access ↔ population eligibility**; see `DA-05`, `DA-06`. |
| `H5` | Grant / revoke a learner entitlement | `A`ᵗ | Represented through the **eligibility relationship**, not as a per-learner grant button; `OQ-04` keeps the assignment mechanism open — see `DA-07`. |
| `H8` | Access duration values | `V`ᵗ — **data-driven, never invented (`D-24`)** | Effective-from / effective-to shown as **record data** only. **No expiry behaviour, countdown, warning or renewal action** — see `DA-09`. |
| `J1 / J2 / J3` | ERP configuration · schedule · sync status | **`V Cf`ᵗ · `Cf`ᵗ · `V Rp`ᵗ** | INA-11 and INA-12. |
| `J4` | ERP-provisioned account creation | `V`ᵗ — **system-driven** | Shown as provenance and as sync outcome, never as an admin action. |
| `J5` | ERP-derived stream assignment | `V`ᵗ | Academic structure and person records show their origin. |
| `J6` | Override an ERP-sourced field | **`?` PENDING — conflict risk** | Working position applied from `QD-01`: **externally-sourced fields are read-only with their origin stated.** Nothing is made editable that could be silently overwritten. |
| `K2 – K6` | Completion / time / scores / attempts | `V`ᵗ tenant-bounded | Not surfaced as an admin view (PM-11 keeps Phase 1 operational). |
| `L1 / L2` | Operational learner status; institutional operational summary | **`Rp`ᵗ — Phase 1, operational only** | The Overview, and only the Overview. |
| `L5 – L10` | Reports, dashboards, KPI definitions | ⛔ Phase 2/3 · `?` PENDING | Absent. |
| `M4` | Audit trail outside content governance | **`?` — undefined, explicitly not invented** | **No history or audit timeline is shown for access, eligibility or configuration changes.** The Batch-01 review-history component is *not* reused here — see `DA-10`. |
| `M5 / M6` | Custom roles · IdP role mapping | ⛔ Phase 3 | Absent. |

---

## 5 · The six PM open questions — how each is preserved

**None of these is answered, softened, or designed around as though settled.**

| # | Open question | How Batch 03 stays truthful |
|---|---|---|
| **`OQ-01`** | Exact B2B subscription / licensing model | The workspace begins at *"an access record exists"*. **No word for how it was acquired appears in product UI** — no purchase, subscription, plan, order, renewal or contract vocabulary, and **no actor is named as having recorded it**: the origin field carries a date only (`DA-11`). |
| **`OQ-02`** | What institutions subscribe to (module / bundle / course / catalogue / other) | Access records are described **by the published content they cover, enumerated**. The record has a name (sample) and a content list; it is **never** called a bundle, package, plan, catalogue or subscription. |
| **`OQ-03`** | Seat model | **No seat count, cap, "N of M used", utilisation bar or capacity warning anywhere.** The eligible-learner counts shown are *"how many people this reaches"*, which is a consequence of the mapping, not a licence capacity. `DA-08`. |
| **`OQ-04`** | How learner entitlement is assigned | The eligibility mapping is presented as a **relationship that exists**, editable in the prototype to demonstrate the handoff. **`DESIGN ASSUMPTION — REVERSIBLE` (`DA-06`, `DA-07`).** Batch 03 does not claim the Institute Admin is the assigner, does not claim it is Faculty, does not claim it is automatic from institutional data, and does not claim all mapping modes are required. |
| **`OQ-05`** | Whether learners may browse non-entitled content | The learner verification view shows **only what the learner is eligible for**, plus an honest not-eligible state that directs the learner to their institution with **no purchase prompt** (`D-01`). **No catalogue browse surface is added** — adding one would answer `OQ-05` by drawing it. |
| **`OQ-06`** | Exact B2C purchase / subscription model | **Out of scope by instruction.** No B2C surface appears in Batch 03. |

### Further open items preserved unchanged

`QP-04` how an institutional licence is transacted in Phase 1 · `QP-07` who creates and manages Faculty accounts · `QP-08` whether Institute Admin holds any assessment authority (**not granted**) · `QP-14` who authorises MR sideloading · `QT-04` XR sign-in under SSO · `QD-01` which fields are user-editable vs externally owned · `QD-02` how a person becomes Faculty or Institute Admin in Phase 1 · `QD-03` ERP provider and integration contract · `QD-04` identity provider / protocol / attribute mapping · `QD-06` whether a learner is informed when access changes · `M4` audit trail outside content governance · `T-1` Phase-1 course-structure authority vs Phase-2 course creation.

---

## 6 · Screen selection (stable Review-006 IDs)

**13 base screens.** Existing inventory IDs are used wherever one exists.

| Batch ID | Inventory ID | Screen | Role |
|---|---|---|---|
| INA-01 | `IAD-01` | Institution Overview | Institute Admin |
| INA-02 | `IAD-02` + `IAD-04` | People | Institute Admin |
| INA-03 | `IAD-03` | Person Detail | Institute Admin |
| INA-04 | `IAD-07` + `IAD-06` | Academic Structure | Institute Admin |
| INA-05 | `IAD-07` detail | Stream / Group Detail | Institute Admin |
| INA-06 | `IAD-09` | Content Access | Institute Admin |
| INA-07 | `IAD-09` detail + `IAD-05` | Content Access Detail | Institute Admin |
| INA-08 | `IAD-08` | Access Mapping | Institute Admin |
| INA-09 | `IAD-14` | Institution Setup | Institute Admin |
| INA-10 | **`IAD-13`** | Single Sign-On | Institute Admin |
| INA-11 | `IAD-11` + `IAD-12` | Institution Data | Institute Admin |
| INA-12 | `IAD-12` exception state | Records Needing Attention | Institute Admin |
| INA-13 | *(verification view over `LRN-02`)* | Learner Access Check | Learner |

**Consumed unchanged from Batch 01:** `SHR-02` shell · `SHR-03` search & filter · `STATE-01` access restricted (learner not-eligible copy) · `STATE-05` empty states · `STATE-06` loading/processing · `STATE-03` error grammar.

**Deliberately merged, and why:** `IAD-02` (learners) and `IAD-04` (faculty) are one directory with a role filter rather than two near-identical lists — `IAD-04` is a **PENDING** inventory row precisely because faculty provisioning is undefined, and a separate faculty page would have needed actions that cannot be specified. `IAD-11` (connection) and `IAD-12` (schedule and history) are one page because an administrator reads connection health and last-run outcome in one glance; the exception list is split out as INA-12 because it is a work list, not status.

**Deliberately not built:** `IAD-10` seat utilisation (`OQ-03`, `DA-08`) · any purchase, renewal or billing surface (`OQ-01`, task brief §7) · course authoring (Phase 2) · device administration (Phase 2) · usage dashboards and reports (Phase 2) · assessment surfaces (PM-15) · notification centre (no Phase-1 requirement) · the full Learner workspace (Batch 01 owns it).

---

## 7 · Design assumptions introduced (15, all labelled, all reversible)

Full register with reversal conditions: **`02_INSTITUTE_ADMIN_UX_MODEL.md` §7**. Summary:

| # | Assumption | Reversible? |
|---|---|---|
| `DA-01` | Five-item navigation: Overview · People · Academic Structure · Content Access · Institution Setup | Yes — labels and grouping only |
| `DA-02` | Navigation label **"Academic Structure"** instead of the brief's suggested "Programs / Groups"; entities keep their source terms (academic stream, group, course) | Yes — wording only |
| `DA-03` | Navigation label **"Content Access"** instead of "Licences" | Yes — wording only |
| `DA-04` | No account-creation or account-removal control in the People directory | Yes — additive |
| `DA-05` | Access records are described by the content they cover, never by a packaging unit | Yes — presentation |
| `DA-06` | Eligibility is modelled as a **relationship between an access record and an institutional population** | Yes — the relationship survives any `OQ-04` outcome; only *who edits it* changes |
| `DA-07` | The eligibility relationship is **editable from the access record** in this prototype | **Yes — this is the single most reversible decision in the batch** |
| `DA-08` | **No seat counts anywhere** | Yes — additive if `OQ-03` confirms a cap |
| `DA-09` | Effective dates shown as record data with **no** expiry behaviour | Yes |
| `DA-10` | **No audit/history timeline** for access, eligibility or configuration changes | Yes — additive if `M4` is defined |
| `DA-11` | Access-record origin carries a **date only** — no actor is named | Yes — wording |
| `DA-12` | Account and access status vocabulary (`Active`, `Awaiting first sign-in`, `Needs attention`, `Not yet reaching learners`) | Yes — wording |
| `DA-13` | Single sign-on state **wording**. The *ordering* — an enabled state only after a successful check — is a **confirmed acceptance criterion**, not an assumption | Yes — wording only |
| `DA-14` | The learner verification view (INA-13) is a **single read-only My Learning view**, not a Learner workspace | Yes |
| **`DA-15`** | **"Run now" on Institution Data.** Manual synchronisation is **not** established by any source — FRD 7.2.1 requires *scheduled* runs at configurable intervals. Kept because it is the only route to the run-in-progress state and the natural action after a source correction | **Yes — one button, one handler, one screen; removing it changes nothing else** |

---

## 8 · What Batch 03 deliberately does NOT resolve

- **How institutional access is acquired.** No checkout, price, payment, invoice, tier, term, renewal or purchase control exists. `OQ-01`, `QP-04`.
- **What the commercial unit is.** No bundle/package/catalogue/plan noun appears. `OQ-02`.
- **Whether there is a seat cap.** Nothing counts seats. `OQ-03`.
- **Who assigns learner entitlement.** The relationship is shown; the authority is not asserted. `OQ-04`.
- **Whether learners may browse non-entitled content.** No browse surface added. `OQ-05`.
- **B2C commerce.** Entirely out of scope. `OQ-06`.
- **The identity provider, protocol or attribute mapping.** Nothing is named; role mapping (Phase 3) is absent. `QD-04`, `7.4.2`.
- **The ERP provider or integration contract.** No endpoint, credential, payload, field name or schema. `QD-03`, `7.1.1`.
- **Who creates Faculty accounts.** Faculty are listed; no provisioning control or origin is claimed. `QP-07`, matrix `A6`.
- **Which person fields are institution-owned versus user-editable.** Externally-sourced fields are read-only with their origin stated; nothing else is asserted. `QD-01`, matrix `J6`.
- **Whether a learner is told when their access changes.** No notification is designed — there is no Phase-1 notification requirement. `QD-06`.
- **Post-expiry behaviour.** Dates are data; **what happens after a date passes is not defined and not drawn.** `DA-09`.
- **Audit trails outside content governance.** Not invented. `M4`.
