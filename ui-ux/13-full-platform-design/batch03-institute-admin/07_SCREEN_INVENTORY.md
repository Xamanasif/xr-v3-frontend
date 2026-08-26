# Batch 03 — Screen Inventory

**13 base screens · 23 important states · 5 end-to-end flows.** Screen IDs in the `Inventory ID` column come from the stable Review-006 inventory (`ui-ux/12-full-platform-reframe/10_FULL_PLATFORM_SCREEN_INVENTORY.md`); Batch-03 IDs (`INA-nn`) are the local package IDs used across this batch's documents, wireframes, prototype and QA record.

---

## Base screens

| # | Batch ID | Inventory ID | Screen | Role | Route | Purpose | New / modified | Source | Pending dependency |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `INA-01` | `IAD-01` | Institution Overview | Institute Admin | `#/admin/overview` | Is my institution working, and what needs me? | **NEW** | FRD 8.1.3 · **PM-11** | ⚠ Detailed reporting metrics remain pending by PM instruction — this page is operational status only |
| 2 | `INA-02` | `IAD-02` + `IAD-04` | People | Institute Admin | `#/admin/people` | Who is in the institution, and where does each person sit? | **NEW** — two inventory rows merged into one directory with a role filter | FRD 8.1.3, 7.2.2 | ⚠ Faculty provisioning owner undefined — Faculty are listed, **no provisioning control or origin is claimed** |
| 3 | `INA-03` | `IAD-03` | Person Detail | Institute Admin | `#/admin/person/:id` | What can this person reach, and why? | **NEW** | FRD 8.1.3, 7.2.3 | ⚠ Which fields are institution-owned vs user-editable is undefined — externally-sourced fields are read-only with their origin stated |
| 4 | `INA-04` | `IAD-07` + `IAD-06` | Academic Structure | Institute Admin | `#/admin/structure` | The academic shape content access maps to | **NEW** | FRD 7.2.3, 3.2.1, 8.1.3 | ⛔ In-platform course creation is a later phase — **view only**, nothing disabled |
| 5 | `INA-05` | `IAD-07` detail | Stream / Group Detail | Institute Admin | `#/admin/structure/:id` | Members, faculty, and the content access reaching this population | **NEW** | FRD 7.2.3, 8.1.3, 8.1.4 | — |
| 6 | `INA-06` | `IAD-09` | Content Access | Institute Admin | `#/admin/access` | What the institution may use | **NEW** — reframed from "Institutional licences" | FRD 6.2.1, 8.1.3 | ⚠ Commercial model, packaging unit and seat model all open — **no price, packaging noun, seat count or purchase route** |
| 7 | `INA-07` | `IAD-09` detail + `IAD-05` | Content Access Detail | Institute Admin | `#/admin/access/:id` | What may we use, and who currently receives it? | **NEW** | FRD 6.2.1, 7.2.3, 8.1.3 | ⚠ **Who assigns learner entitlement is open** — the eligibility editor is `DA-07`, **DESIGN ASSUMPTION — REVERSIBLE** |
| 8 | `INA-08` | `IAD-08` | Access Mapping | Institute Admin | `#/admin/mapping` | The eligibility picture from both directions — records reaching nobody, populations nothing reaches | **NEW** | FRD 6.2.1, 7.2.3 | ⚠ Same as `INA-07` |
| 9 | `INA-09` | `IAD-14` | Institution Setup | Institute Admin | `#/admin/setup` | The institution record plus the health of both connections | **NEW** | FRD 4.2.1 | ⛔ Creating or deleting an institution is platform-side and absent |
| 10 | `INA-10` | **`IAD-13`** | Single Sign-On | Institute Admin | `#/admin/setup/sso` | Get institutional sign-in configured, checked and on | **NEW** — the core new surface of the batch | **FRD 4.2.2 · PM-10.** Ordering is a **confirmed acceptance criterion**: *"…an enabled state is reached only after a successful test"* | ⚠ Provider, protocol and attribute mapping pending — **none is named**; role mapping is a later phase and is absent |
| 11 | `INA-11` | `IAD-11` + `IAD-12` | Institution Data | Institute Admin | `#/admin/setup/data` | Connection health, schedule, last-run outcome | **NEW** — two inventory rows merged | FRD 7.1.1, 7.1.2, **7.2.1** — *"An Institute Admin sets the synchronisation interval and can see the last run, its outcome, its counts and its errors"* | ⚠ Provider and contract pending — **no endpoint, credential, payload, schema or field name**. ⚠ **`Run now` is not source-established** — `DA-15`, **DESIGN ASSUMPTION, REVERSIBLE** |
| 12 | `INA-12` | `IAD-12` exception state | Records Needing Attention | Institute Admin | `#/admin/setup/data/attention` | Turn a partial run into a short list of understandable next steps | **NEW** | **FRD 7.2.1 — CONFIRMED:** *"Given a failed ERP synchronisation run, when the Institute Admin views synchronisation history, then failed records are retained with a reason and a retry is available"* | ⚠ Provider and contract pending; **retry is the only action offered, and it is the sourced one** |
| 13 | `INA-13` | verification view over `LRN-02` | Learner Access Check | Learner | `#/learner/my-learning` | Prove the handoff reaches the learner | **NEW verification surface** — `DA-14` | FRD 8.1.5, 7.2.3 · Batch-01 learner vocabulary | ⚠ Whether non-entitled content may be browsed is open — **no browse surface is added** |

**Shared surfaces consumed unchanged from Batch 01, not counted as base screens:** `SHR-02` global shell · `SHR-03` search & filter · `STATE-01` access-restricted copy pattern (the learner not-eligible state) · `STATE-03` error grammar · `STATE-05` empty states · `STATE-06` loading / processing.

**Dialogs, not screens:** Add eligibility (`INA-07`) · Remove eligibility (`INA-07`) · Turn on institutional sign-in (`INA-10`) · Edit institution details (`INA-09`).

---

## Important states (23)

| Base | States |
|---|---|
| `INA-01` Overview | ① attention items present ② all clear (nothing needs attention) |
| `INA-02` People | ③ directory populated ④ filtered to Faculty ⑤ filtered-empty (no search match) ⑥ empty institution ⑦ row needing attention |
| `INA-03` Person Detail | ⑧ learner with content access ⑨ learner not placed in an academic stream, with no access ⑩ faculty (no origin recorded) ⑪ learner in a stream but not in a group |
| `INA-04` Academic Structure | ⑫ populated ⑬ incoming values that do not match the structure (attention alert) |
| `INA-05` Stream / Group Detail | ⑭ reached by content access ⑮ reached by nothing |
| `INA-06` Content Access | ⑯ populated ⑰ a record **not yet reaching learners** ⑱ **no content access recorded yet** |
| `INA-07` Access Detail | ⑲ active with eligibility ⑳ active with no eligibility ㉑ after eligibility is added |
| `INA-08` Access Mapping | ㉒ gaps present ㉓ every record reaching learners |
| `INA-10` Single Sign-On | ㉔ not set up ㉕ details saved, connection not checked ㉖ connection check did not succeed ㉗ institutional sign-in on (with identity-matching status) |
| `INA-11` Institution Data | ㉘ completed with issues ㉙ completed, healthy ㉚ run in progress |
| `INA-12` Records Needing Attention | ㉛ three issue kinds open ㉜ retried before the cause is fixed — still needs attention ㉝ resolved |
| `INA-13` Learner Access Check | ㉞ eligible content present ㉟ not currently eligible |

*(Counting method: 35 numbered chips above collapse to **23 distinct important states** — search-empty and filtered variants of the same list pattern, and the three sign-on intermediate states, are counted once per behaviour rather than once per screen. The prototype exercises all 35.)*

---

## Flows

| Flow | Path | Where it is proven |
|---|---|---|
| **A — Institution setup overview** | Overview → People → Content Access → Institution Setup (both connection statuses) | Prototype demo path A |
| **B — Institution content access to learner** | Content Access → a record not reaching learners → inspect it → add eligibility → Access Mapping → Learner Access Check | Prototype demo path B — **the batch's central proof** |
| **C — People / academic structure relationship** | People → a person → their academic stream → the content access reaching it | Prototype demo path C |
| **D — Single sign-on** | Institution Setup → Single sign-on → save details → check (does not succeed) → check again → turn on | Prototype demo path D |
| **E — Institution data and its exceptions** | Institution Data (completed with issues) → Records Needing Attention → *(prototype control: records corrected at source)* → retry → applied | Prototype demo path E |

---

## Navigation

```
Overview · People · Academic Structure · Content Access · Institution Setup
                                                            ├── Institution
                                                            ├── Single sign-on
                                                            └── Institution data
                                                                  └── Records needing attention
```

Five primary items, depth 2 at most — matching the Review-006 IA for this workspace. Two labels differ from that document's sketch and are recorded as reversible design assumptions (`DA-02` Academic Structure, `DA-03` Content Access).

**No institution switcher exists anywhere** — the tenant boundary is structural, not a control.

---

## Explicitly excluded from Batch 03

| Excluded | Reason |
|---|---|
| Any purchase, pricing, checkout, invoice, renewal or billing surface | Task brief §7; the acquisition route and commercial model are open; institutional billing is a later phase |
| Seat utilisation (`IAD-10`) | The seat model is open — see `DA-08` |
| In-platform course creation and module mapping | Later phase (tension **T-1** handled as view-only) |
| Device registration, remote device configuration | Later phase |
| Institutional usage dashboards, adoption and class-performance reports | Later phase; PM-11 keeps Phase 1 operational |
| Any assessment surface for this role | Assessment authority for Institute Admin is explicitly not granted |
| Authentication screens (`AUTH-01…10`), workspace resolution and chooser | Not needed to prove the Batch-03 flows; the prototype uses a clearly-labelled non-product Prototype Index |
| The Learner workspace, module, simulation, device-access and assessment screens | Batch 01 and Batch 02 own them and are untouched |
| B2C surfaces of any kind | Out of scope by instruction |
| Certification, notifications, custom roles, cross-institution views | No Phase-1 basis, or a later phase, or Super-Admin-only |
| A change history / audit trail for access, eligibility or configuration | Undefined outside content governance — see `DA-10` |
