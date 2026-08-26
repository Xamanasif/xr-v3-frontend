# Batch 03 — Institute Admin & Institutional Content Access

**XR Simulation Learning Platform · Full-Platform UI/UX Design — Batch 03**
Branch `uiux/full-platform-design` · 2026-08-25 · **Figma deferred — this package is reviewable entirely in the browser.**

## The question this batch answers

> **PM (2026-08-25):** *"How will the learner get subscribed / get access to see all these courses/content?"*

The **commercial** half of that question is not answered here — it is `OQ-01` … `OQ-04` and it stays open. What Batch 03 designs is the half that holds regardless of how the commercial half resolves:

```
INSTITUTION CONTENT ACCESS  →  ELIGIBILITY  →  LEARNER ELIGIBILITY  →  CONTENT IN MY LEARNING
   (an access record            (a relationship to        ("Included in your
    the institution holds)       a stream, group           institution's access")
                                 or person)
```

Every screen sits on that spine, and the prototype demonstrates it in **both directions** — add an eligibility and the experiment appears for the right learner; remove it and it disappears.

## Scope

**Institute Admin** (detailed, 12 screens) + **one learner verification view** proving the handoff. No other role is introduced.

| Area | What it answers |
|---|---|
| **Overview** | Is my institution working, and what needs me right now? |
| **People** | Who is in the institution, where do they sit, and what can each person reach — and why? |
| **Academic Structure** | The academic streams, groups and courses content access maps to (view only) |
| **Content Access** | What may we use, who currently receives it, and which parts of the institution nothing reaches? |
| **Institution Setup** | Institutional single sign-on · the institution data connection · the records that need attention |

**13 base screens · 23 important states · 5 end-to-end flows · 18 routes.** Details: [07_SCREEN_INVENTORY.md](07_SCREEN_INVENTORY.md).

## What this batch deliberately does not decide

**Nothing here converts an open decision into a requirement.** A programmatic search across every route found **zero** occurrences of price, payment, invoice, checkout, purchase, subscription, plan, tier, renewal, seat, quota, licence, any sign-on protocol or vendor, any integration provider, any endpoint, schema or credential term — and zero internal identifiers — anywhere a user can see.

| Open | How the design stays truthful |
|---|---|
| Exact B2B subscription / licensing model | The workspace starts at *"an access record exists"*. Its origin line carries a **date only — no actor is named**, because no source confirms who records institutional content access. **No purchase route anywhere**, including in the empty state. |
| What institutions subscribe to | Records are described by **the published content they cover, enumerated**. Never called a bundle, package, plan, catalogue or subscription. |
| Seat model | **No seat count, cap, utilisation figure or capacity warning anywhere.** The counts shown are how many people a relationship reaches — a consequence of institutional data, not a licence capacity. |
| How learner entitlement is assigned | Modelled as a **relationship**, editable in the prototype to demonstrate the handoff, and recorded as **`DA-07` — DESIGN ASSUMPTION, REVERSIBLE**. Batch 03 does not claim the assigner is the Institute Admin, Faculty, the institution's data, or any combination. |
| Learner browse of non-entitled content | **No browse surface is added** — drawing one would answer the question. |
| B2C purchase / subscription | Out of scope by instruction; no B2C surface appears. |
| Identity provider, protocol, attribute mapping | **None is named.** Configure → check → turn on, in plain language. Automatic role mapping is absent, not disabled. |
| Integration provider and contract | **No endpoint, credential, payload, schema, field name or provider.** Only what an administrator experiences. |
| Who creates Faculty accounts | Faculty are listed; **no provisioning control and no origin is claimed** — their Source column reads "—". |
| Post-expiry behaviour | Effective dates are shown as **record data only**. No countdown, no expiry state, no renewal action. **Post-expiry product behaviour remains pending.** |
| Audit trail outside content governance | **Not invented.** No history timeline for access, eligibility or configuration changes. |
| Whether an institution may trigger a synchronisation outside its schedule | **`Run now` is kept but is not source-established** — FRD 7.2.1 requires *scheduled* runs at configurable intervals. Recorded as **`DA-15` — DESIGN ASSUMPTION, REVERSIBLE**. The confirmed retry path works without it. |

**15 design assumptions** are registered with their reversal conditions in [02_INSTITUTE_ADMIN_UX_MODEL.md §7](02_INSTITUTE_ADMIN_UX_MODEL.md). None is presented as a requirement.

**Confirmed and cited, so it is not mistaken for an assumption:** the Institute Admin *sets the synchronisation interval and sees the last run, its outcome, its counts and its errors* (FRD 7.2.1) · *failed records are retained with a reason and a retry is available* (7.2.1) · *an enabled sign-in state is reached only after a successful connection test* (4.2.2) · *a student in an unmapped stream sees an empty entitlement state that explains what to do* (7.2.3).

## Where things are

| Item | Location |
|---|---|
| Source & scope audit (traceability, permissions, open questions) | `01_SOURCE_AND_SCOPE.md` |
| Institute Admin UX model (IA, vocabulary, states, **assumption register**) | `02_INSTITUTE_ADMIN_UX_MODEL.md` |
| Institution access & entitlement model | `03_INSTITUTION_ACCESS_MODEL.md` |
| People & organisational structure model | `04_PEOPLE_AND_ORG_MODEL.md` |
| Single sign-on & institution data model | `05_SSO_ERP_MODEL.md` |
| Component extensions over Batch 01 | `06_COMPONENT_EXTENSIONS.md` |
| Screen inventory, states and flows | `07_SCREEN_INVENTORY.md` |
| **Low-fi wireframes** | `wireframes/batch03-wireframes.html` — open directly in a browser |
| **High-fidelity interactive prototype** (primary deliverable) | `prototype/batch03-prototype.html` — open directly, or serve the repo root; see `prototype/README.md` for the five demo paths |
| Accessibility, UX and requirement-safety QA | `qa/ACCESSIBILITY_AND_UX_QA.md` |
| Visual QA captures (1440 px + 1280 px) | `qa/screenshots/` (state seeding: `qa/qa-seed.html`, `qa/seed-states/`) |
| Future Figma notes | `FIGMA_HANDOFF_LATER.md` |

Everything in the prototype is **SAMPLE DESIGN DATA**; review it at 1440 px. **No backend, no network request, no real single sign-on, no real institution-data integration, no real entitlement service.**

## Relationship to Batch 01 and Batch 02

**Both are frozen and untouched.** Batch 03 consumes the Batch-01 stylesheet as a verbatim, byte-identical snapshot (`prototype/batch01-design-system.css` — required for reliable double-click `file://` loading in Safari; Batch 01 remains the source of truth) and adds only institutional-administration components on the same tokens.

Continuity is deliberate: the same institution (Sample Engineering Institute), the same learner (Rahul Verma), the same faculty member (Dr. Arjun Mehta), and the same published experiments. The learner verification view reuses Batch 01's access vocabulary verbatim — *"Included in your institution's access"* — and stops exactly where Batch 01 begins. The module, simulation, device-access, assessment and progress screens are **not** repeated or modified.

## Next likely batch

**Batch 04 — not started.** The obvious remaining gaps are authentication and workspace resolution (`AUTH-01…09`, which the institutional sign-in surface designed here now depends on), the Super Admin workspace (deferred by the 2026-08-25 publication update until supported by confirmed requirements), and the B2C route. **The commercial and entitlement-assignment questions this batch preserves are the ones most worth resolving before any of them is designed.**
