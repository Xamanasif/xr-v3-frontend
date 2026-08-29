# 07 — Screen Inventory

| | |
|---|---|
| **Document ID** | `BATCH05_SCREEN_INVENTORY` |
| **Batch** | 05 — Super Admin + platform-wide administration |
| **Date** | 27 August 2026 |
| **Count** | **10 base screens · 26 important states · 3 dialogs** |

---

## 1 · The ten screens

Every screen traces to a requirement, or exists to state a gap where one is missing. **No screen was built to reach a number.**

| # | Screen | Route | Requirement basis | Read / write | Origin |
|---|---|---|---|---|---|
| **SA-01** | Platform overview | `#/overview` | FRD **8.1.1** bounded by `PM-11` · 1.3.4 · AC-04 | **Read** | Review-006 `SA-01`, rescoped |
| **SA-02** | Institutions | `#/institutions` | FRD **1.3.5** · `PM-13` | **Read** | Review-006 `SA-09` |
| **SA-03** | Institution detail | `#/institution/<id>` | FRD **1.3.5** · §6.7.4 / AC-04 | **Read** | Review-006 `SA-10`, narrowed to read-only |
| **SA-04** | Module releases | `#/releases` | FRD **2.3.2** · FLOW 10 | **Read** | Review-006 `SA-05` |
| **SA-05** | Release decision | `#/release/<id>` | FRD **2.3.2** · FLOW 10 step 1 | **WRITE** — release · hold | Review-006 `SA-05` detail |
| **SA-06** | Device replacement requests | `#/device-requests` | FRD **2.4.2** · FLOW 8 | **Read** | Review-006 `SA-12` |
| **SA-07** | Device request detail | `#/device-request/<id>` | FRD **2.4.2** · FLOW 8 step 3 · AC-28 | **WRITE** — approve | Review-006 `SA-12` detail |
| **SA-08** | Licensing | `#/licensing` | FRD **8.1.1** · 6.2.1 · 6.2.2 · 9.2.1 | **Read** | Review-006 `SA-11`, narrowed to visibility |
| **SA-09** | Platform roles | `#/platform/roles` | FRD **8.1.1** authority · `QD-02` mechanism | **Read** | Review-006 `SA-14`, narrowed to read-only |
| **SA-10** | Platform configuration | `#/platform/configuration` | FRD **8.1.1** | **Read** | Review-006 `SA-13`, reframed as a register |

**Two write actions in the whole workspace.** That is the finding, not an omission.

Plus one non-product surface: the **prototype index** (`#/index`), which is prototype navigation, clearly marked as such, and not counted as a screen.

## 2 · Review-006 screens deliberately **not** built

The Review-006 inventory listed **14** Super Admin screens. Four are not built, each on evidence.

| Not built | Was | Why |
|---|---|---|
| `SA-02` Ready to publish | CM-approved queue · **1.4.4** | **PM-OVERRIDDEN** — `PM-16`/`17`/`18`. Withdrawn in Batch 01; not revived under any name |
| `SA-03` Publish module | *Review-006's own wording:* “release to production” · **1.4.4** | Same. **Note the wording trap:** Review-006 used *release to production* to describe a **1.4.4 publication** screen. Batch 05's release control is **2.3.2**, and it is deliberately **not** named that way — see `SA-05` |
| `SA-04` Published modules | Live content | **Reassigned** to the Content Manager as `CM-03` in Batch 01. A second copy would duplicate it |
| `SA-06` All modules | Every module, every gate | With publication gone, this view has no confirmed purpose for this role. The only content it still touches is a version awaiting a decision — which is `SA-04` |
| `SA-07` Vendors | Add · manage | **Refuted** (audit R-03). FRD 1.4.1's *"Authorized vendors"* names no authoriser |
| `SA-08` Academic reviewers | Add · manage | **Refuted** (audit R-04). FRD 1.4.2 is about validation, not account administration |

Their absence is recorded on `SA-09`, which names *"who provisions a Vendor or an Academic Reviewer"* as an open question rather than silently omitting it.

## 3 · Screen detail

---

### `SA-01` · Platform overview — `#/overview`

**Answers one question:** *what needs a decision from me?*

| Region | Content |
|---|---|
| Scope bar | Platform |
| What needs a decision | Up to three rows: versions awaiting a release decision · device requests awaiting approval · institutions not yet fully operating. **Settled state when none** |
| Institutions | A roll call — every institution with its own derived state and its three readiness facts. **No column combines institutions** |
| What this overview deliberately does not show | Five stated absences, each with its requirement |

| State | Trigger |
|---|---|
| **Work waiting** | Anything awaits a decision — the default demo state |
| **Nothing waiting** | All settled — `.attn-clear`, not an empty state |
| **Partial** | Some rows present, others resolved |

**No KPI, chart, metric, trend, percentage or cross-institution total.** `PM-11` · FRD §6.7.3 · 1.3.4 · AC-04.

---

### `SA-02` · Institutions — `#/institutions`

The cross-tenant list, and the entry point to the institutional context `AC-04` requires.

| Column | Source |
|---|---|
| Institution — name, reference, city | sample design data |
| State | derived (`DA-01`) |
| Content access | 6.2.1 · 6.2.2 |
| Institutional sign-in | 4.2.2 |
| Institution data | 7.1.1 · 7.2.1 |
| Registered | sample |

**Deliberately absent: any learner count, seat figure or utilisation percentage.** Five institutions' volumes side by side is the comparison AC-04 exists to prevent.

| State | Trigger |
|---|---|
| Full list | Default |
| Filtered — not yet operating | From the overview, or the filter |
| Filtered — one state | Operating · Attention needed · Setup incomplete |
| **No results** | Search matches nothing — offers a clear-and-reset |

Carries two notes: a boundary (*"You can see every institution. You change none of them."*) and a gap (*"Who registers an institution, and who activates it, is not settled"* — `DA-03`).

---

### `SA-03` · Institution detail — `#/institution/<id>`

**The only place in the workspace that is inside a tenant.** Scope bar turns and tints.

| Region | Content |
|---|---|
| Alert | Present only when the state is *Attention needed* or *Setup incomplete* — and says there is nothing here to do |
| Readiness | The three-fact ledger, each row with its provenance line |
| What this institution is running | Streams · cap · last run counts · last run time. Plus the boundary note explaining why nothing is editable |
| Gap | What *"manage across tenants"* authorises is not defined (`DA-02`) |
| Right rail | What the institution runs itself · no record is kept of what you looked at (`GP-4`) |

| State | Institution |
|---|---|
| **Operating** | `nit` Northfield · `au` Ashcroft |
| **Attention needed** | `mce` Meridian — 26 records not applied |
| **Setup incomplete — no sign-in, no data** | `cp` Calder |
| **Setup incomplete — no access record** | `lst` Lakeside |
| **Not found** | Unknown reference — carries its own `h1` |

---

### `SA-04` · Module releases — `#/releases`

| State | Trigger |
|---|---|
| Awaiting decision *(default)* | Versions with no decision yet |
| Held | Decided not to release, for now |
| Released | In production |
| All versions | Every record |
| **Nothing awaiting** | Every version decided |

Leads with the boundary that defines the screen: *"These modules are already published and already in use."*

---

### `SA-05` · Release decision — `#/release/<id>` · **WRITE**

| State | Controls | Panel |
|---|---|---|
| **Awaiting decision** | **Hold version** · **Release version** | Both first-class |
| **Held** | **Release version** | Warning alert: holding is a decision, not a delay; no reason is recorded (`GP-4`) |
| **Released** | *(none)* | States when, and that this is what learners run |
| **Not found** | — | Own `h1` |

Every state carries the boundary note *"This is a version decision, not a publication decision,"* naming the Content Manager and the publication date, stating that **content publication has already occurred**, and recording **`D-01`** as an open PM clarification.

**The controls are named for the version, not for a destination.** *Release to production*, *Production release* and *Hold release* are retired from every control, dialog title, confirmation label and page head; *production* survives only where it explains the consequence, in FRD 2.3.2's own words.

**Dialogs:** *Release version X?* → confirm **Release version** · *Hold version X?* → confirm **Hold version**. Each states its consequence, including what is **not** recorded.

---

### `SA-06` · Device replacement requests — `#/device-requests`

| State | Trigger |
|---|---|
| Awaiting approval *(default)* | Learners waiting |
| Approved | Decided |
| All requests | Every record |
| **No one waiting** | Everything approved |

Carries the B2C boundary (2.4.1 · 2.4.3) and the no-decline gap (`DA-07`).

---

### `SA-07` · Device request detail — `#/device-request/<id>` · **WRITE**

| State | Controls | Right rail |
|---|---|---|
| **Awaiting your approval** | **Approve the transfer** | Gap: *"If this should not be granted, there is nothing to press"* |
| **Approved** | *(none)* | Success: *"The licence has rebound"* |
| **Not found** | — | Own `h1` |

Shows **both ends** of FLOW 8 — the learner's request state is required by FRD 2.4.2's acceptance criterion, not decoration.

**Dialog:** *Approve this device transfer?* — states that the old device stops working, that the learner sees it immediately, and that no record is kept.

---

### `SA-08` · Licensing — `#/licensing`

| State | Trigger |
|---|---|
| Records present *(default)* | Institutions holding content access |
| Some institutions without | A named boundary note lists them |
| **No records at all** | Empty institutional table |

Leads with *"Access records are shown as they stand."* Individual access is explained (9.2.1 activation is automatic) with no surface, and individual learners are not listed (1.3.1 · 1.3.2).

**No price, currency, term, renewal, expiry, invoice, plan, seat, refund or cancellation anywhere.**

---

### `SA-09` · Platform roles — `#/platform/roles`

Read-only table: role · holders · count · basis. Four central-plane roles only.

Three notes: the assignment gap (`QD-02`, HIGH) · the roles inside an institution are not shown · the seven roles are fixed (8.3.x is Phase 3) · plus the unowned provisioning question for Vendor and Academic Reviewer.

---

### `SA-10` · Platform configuration — `#/platform/configuration`

The register: **15 rows**, four kinds — *built here* (2) · *another role* (4) · *later phase* (4) · *not defined* (5). **Zero invented controls.**

Closes with the rule it applies to itself: *"Every field a settings page would need comes from a requirement. Where the requirement does not exist, the field would be invention dressed as specification."*

## 4 · State summary

| Screen | Important states |
|---|---|
| SA-01 | 3 — work waiting · nothing waiting · partial |
| SA-02 | 4 — full · filtered *(needing)* · filtered *(one state)* · no results |
| SA-03 | 5 — operating · attention · setup *(no sign-in/data)* · setup *(no access)* · not found |
| SA-04 | 5 — awaiting · held · released · all · nothing awaiting |
| SA-05 | 4 — awaiting · held · released · not found |
| SA-06 | 4 — awaiting · approved · all · none waiting |
| SA-07 | 3 — awaiting · approved · not found |
| SA-08 | 3 — records · partial · none |
| SA-09 | 1 |
| SA-10 | 1 |
| | **Dialogs: 3** — release · hold · approve |
| | **Total: 26 states + 3 dialogs** |

## 5 · Shared surfaces, designed once

Not counted as screens: the Batch-01 shell (`SHR-02`) · empty states (`STATE-05`) · the boundary note, source gap, scope bar and readiness ledger from [`06_COMPONENT_EXTENSIONS.md`](06_COMPONENT_EXTENSIONS.md) · the three not-found states, which share one pattern.

## 6 · Traceability

| Requirement | Screens |
|---|---|
| FRD **1.3.5** cross-tenant governance | SA-01 · SA-02 · SA-03 |
| FRD **2.3.2** controlled update releases | SA-04 · **SA-05** |
| FRD **2.4.2** device replacement authorisation | SA-06 · **SA-07** |
| FRD **8.1.1** Super Admin role | SA-01 · SA-08 · SA-09 · SA-10 |
| FRD 6.2.1 · 6.2.2 institutional licensing | SA-03 · SA-08 |
| FRD 4.2.2 · 7.1.x *(observed, not owned)* | SA-03 |
| FRD 9.2.1 automatic activation | SA-08 |
| `PM-11` operational status only | SA-01 |
| `PM-13` two-plane model | shell · SA-02 · SA-03 |
| `PM-16`/`17`/`18` publication ownership | Enforced everywhere; stated on SA-04 · SA-05 · index |
| `QD-02` role-assignment origin | SA-09 · SA-10 |
| `QP-04` licence transaction | SA-08 |
| `QP-26` return authority | **Not designed.** Stated on the index |
| `GP-4` no audit trail | SA-03 · SA-05 · SA-07 · SA-10 |

**Bold** = the two write actions.
