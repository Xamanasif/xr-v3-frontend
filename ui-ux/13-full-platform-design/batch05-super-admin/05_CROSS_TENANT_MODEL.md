# 05 — Cross-Tenant Model

| | |
|---|---|
| **Document ID** | `BATCH05_CROSS_TENANT_MODEL` |
| **Batch** | 05 — Super Admin + platform-wide administration |
| **Date** | 27 August 2026 |
| **Covers** | The platform / tenant boundary: what crossing it means, how it is enforced, and what it does not confer |

---

## 1 · The single sentence this whole model rests on

> **FRD 1.3.5, verbatim:** *"Cross-Tenant Governance Access. A Super Admin role shall have controlled access to **view and manage data across tenants strictly for governance and operational oversight**."*
> Phase 1 · `UNCHANGED-FRD` · role: Super Admin · capability tags `TEN`, `SEC`, `RPT`

**This is the entire licence for building any multi-tenant screen on this platform.** Every cross-institution view in the workspace traces to it, and `PM-13` confirms it while forbidding its extension:

> *"Super Admin retains the FRD-defined cross-tenant governance capability (FRD 1.3.5). **Do not invent additional cross-tenant permissions for the other roles.**"*

The FRD's own summary of the tenancy rule is shorter still:

> *"The three content-side roles never touch institutional data, so they need no access to it and hold none. **Only the Super Admin crosses institutions, and the FRD limits even that to governance and operational oversight.**"*

## 2 · The three planes

`PM-13` establishes the model; the FRD supplies the boundaries.

```
┌────────────────────────────────────────────────────────────────────┐
│  CENTRAL CONTENT & GOVERNANCE PLANE            FRD 1.1.4 · 1.4.x   │
│  Vendor · Academic Reviewer · Content Manager · Super Admin        │
│  module builds, assets, metadata, validation, publication, history │
│  ── holds NO institutional data and needs none ──                  │
└────────────────────────────────────────────────────────────────────┘
                              ▲
                              │  Super Admin alone spans the boundary
                              │  FRD 1.3.5 · PM-13 · V5-ADD-004
                              ▼
┌───────────────────────┐  ┌───────────────────────┐  ┌─────────────┐
│  TENANT PLANE — A     │  │  TENANT PLANE — B     │  │  …  C, D, E │
│  Institute Admin      │  │  Institute Admin      │  │             │
│  Faculty · Learner    │  │  Faculty · Learner    │  │             │
│  FRD 1.3.1 isolated   │  │  FRD 1.3.1 isolated   │  │             │
└───────────────────────┘  └───────────────────────┘  └─────────────┘

┌────────────────────────────────────────────────────────────────────┐
│  PERSONAL / B2C CONTEXT — not a tenant          FRD 1.3.2          │
│  Individual learners, in a separate data environment               │
│  meets Super Admin at exactly ONE point: a device request (2.4.2)  │
└────────────────────────────────────────────────────────────────────┘
```

**Super Admin is the only role with any concept of crossing.** That fact settles a rule for every other workspace on the platform, positively and negatively:

- **Positive** — the Super Admin shell needs a persistent scope indicator, because it is the only shell whose scope changes.
- **Negative** — **no institution switcher, tenant selector, cross-tenant filter or all-institutions view may appear in the Institute Admin, Faculty, Learner, Vendor, Academic Reviewer or Content Manager workspaces.** Batches 01–04 already satisfy this; Batch 05 does not weaken it.

## 3 · The hard constraint: `AC-04`

> **FRD §6.7.4 / AC-04, verbatim:** *"Given cross-tenant access, when Super Admin views an institution, then **tenant-scoped data remains presented within its institutional context rather than aggregated across institutions**."*

Reinforced by FRD 1.3.4, whose own acceptance criterion is absolute: *"Every Faculty and Institute Admin reporting surface returns only that institution's data, with **no cross-tenant aggregate anywhere**."*

**This is a hard design constraint, not a preference, and Batch 05 enforces it structurally rather than by convention.**

### How it is enforced

| Mechanism | Effect |
|---|---|
| **The scope bar** | Every surface declares its scope in the same place, in the same shape. Two kinds only: *the platform*, or *one named institution*. The institution variant is tinted, so crossing into a tenant is never invisible |
| **Institutional figures live in exactly one function** | Stream counts, caps, record counts and run outcomes are rendered only inside the institution detail screen, one institution at a time. No other screen can produce them |
| **The list carries readiness, never volume** | `SA-02`'s columns are *state · content access · institutional sign-in · institution data · registered*. **No learner count, no seat figure, no utilisation percentage** — five institutions' volumes side by side is the comparison AC-04 exists to prevent, even though each cell would individually be that institution's own |
| **The overview counts platform work, never tenant data** | Its two numbers are versions awaiting a release decision and device requests awaiting approval. Both are platform work items. The third row counts *institutions not yet fully operating*, which is a count of institutions, not of anything inside them |
| **No total row, roll-up, league table, ranking, chart or comparison exists anywhere** | Verified across every route by the automated audit |

`SA-01` states the constraint on the page rather than leaving it implicit:

> *"Each row shows one institution's own state. Nothing on this page combines institutions, and there is no platform total — an institution's data stays inside that institution."*

## 4 · What crossing does **not** confer

This is where the model is most easily got wrong, and it is the reason the batch's audit ran an adversarial pass.

**Cross-tenant access is a widened field of view. It is not a superset of the tenant roles' permissions.**

Nothing in FRD 1.3.5, `PM-13`, or anywhere else, grants the Super Admin the actions that belong to a role inside an institution. The audit tested each of these separately and refuted every one:

| A Super Admin may **not** | Because |
|---|---|
| Configure an institution's sign-in | FRD 4.2.2's acceptance criterion assigns it to the **Institute Admin** — Batch 03 `INA-10` |
| Configure or run an institution's data integration | FRD 7.1.1 / 7.1.2 / 7.2.1 assign configuration and visibility to the **Institute Admin** — Batch 03 `INA-11` |
| Map streams to content | FRD 6.2.1 / 7.2.3 — the **Institute Admin** maps its own — Batch 03 `INA-08` |
| See or manage an institution's people | No requirement assigns it. `QD-02` leaves tenant role assignment undefined |
| See a seat, student-cap or capacity figure | **`OQ-03` is OPEN** — whether such a model exists at all is unresolved, so no figure of that kind is shown or implied. The Super Admin equivalent of 6.2.2 (8.2.2) is **Phase 2** in any case |
| Grant or revoke a learner entitlement | FRD 8.1.3 names the **Institute Admin** as subject and sole role |
| Assign a course or module | FRD 8.1.4 is the **Faculty** role definition; 7.2.3 is automatic |
| Touch any assessment | **Zero** Super Admin occurrences across all eleven assessment requirements; `PM-15` omits the role entirely |
| Read institutional analytics | FRD 1.3.4 · `PM-11` · §6.7.3 — Phase 2 and prohibited |

### The relationship, stated as a rule

**What the Institute Admin operates, the Super Admin observes.**

| Institute Admin **operates** (Batch 03) | Super Admin **observes** (Batch 05) |
|---|---|
| Configures institutional sign-in — `INA-10` | Sees **that** it is configured. Not how. Cannot change it |
| Configures institution data and its schedule — `INA-11` | Sees **that** the last run succeeded or failed, and how many records did not apply. Cannot configure or run it |
| Maps streams to licensed content — `INA-08` | Sees **that** an access record exists, its stream count and its cap. Cannot map, price or transact it |
| Manages people — `INA-02` · `INA-03` | Sees **no** institutional person at all |
| Whatever reporting it has on its own use of that content | Sees **nothing** — Phase 2, and the cap model itself is `OQ-03`, **OPEN** |
| Resolves failed records — `INA-12` | Sees the count. **There is nothing here to do** — the screen says so |

## 5 · The provenance line

The mechanism that makes the boundary legible rather than merely true.

Every fact on the institution detail screen carries a line naming the role that owns it and the requirement that says so:

```
  ✓  Institutional sign-in            CONFIGURED
     Institutional sign-in is configured and in use.
     ⓘ Configured by this institution's Institute Admin      FRD 4.2.2 · PM-10
```

That line is **the reason there is no edit control beside it**. It is present on every ledger row without exception, and it is what keeps `SA-03` from reading as a worse copy of the Institute Admin workspace.

One row is deliberately worded differently. A content access record has no confirmed owner — FRD 6.2.1's transaction mechanism is open — so only the *stream mapping* has a named one:

```
  ⓘ Streams mapped by the Institute Admin · how the record itself
    comes to exist is open                        FRD 6.2.1 · 6.2.2 · QP-04
```

Saying *"configured by"* for all three would assert an origin the requirements have not settled.

## 6 · Read-only, and the question that would change it

FRD 1.3.5's word is *"view and **manage**."* **No source names a single cross-tenant management action.** The Review-006 matrix records `V M`ˣ, but its own note concedes the `M` is *"derived from 1.3.5"* rather than from a requirement of its own.

Batch 05 therefore **designs the sight and not the hand** — no suspend, no activate, no status change, no configuration edit — and asks the question on the page instead of answering it:

> *"The requirement grants this role 'controlled access to view and manage data across tenants strictly for governance and operational oversight' — but no requirement anywhere names a single cross-institution management action. Rather than invent one, this page is read-only. If a governance action is later defined — suspending an institution, or anything else — it belongs on this page and the layout leaves room for it."*

This is design assumption **`DA-02`** and judgement call **`D-02`**. **Reversibility is high**: a governance write drops into the existing detail layout without restructuring.

### `D-02` — OPEN PM CLARIFICATION

| | |
|---|---|
| **Cross-tenant visibility** | **Source-supported** — FRD 1.3.5 · `PM-13` · `AC-04` |
| **Specific cross-tenant write actions** | **OPEN / PENDING** — no source names one |
| **PM question** | *"Which specific cross-tenant write actions does FRD 1.3.5's 'view and manage' authorise?"* |

Until it is answered, **no** cross-tenant write control exists anywhere in Batch 05. Specifically absent, and verified mechanically by the requirement-safety audit on every institution route:

| Absent | Absent | Absent |
|---|---|---|
| Edit institution | Deactivate institution | Suspend institution |
| Delete tenant | Modify institution SSO | Modify institution ERP |
| Assign learner content | Assign institutional licences | Edit institution users |

The classification is stated on `SA-02` itself, in the boundary note beneath the institution list, so a reviewer meets the open question on the screen rather than only in this document.

> **PM question:** *Which specific cross-tenant actions does 1.3.5's "manage" authorise?*
> Until one is named, the Super Admin can see every institution and change none.

## 7 · Institution state, derived

Because no requirement defines an institution lifecycle, the platform stores no status. State is **computed at render time** from three facts that *are* required:

| Fact | Requirement | Owner |
|---|---|---|
| A content access record exists | 6.2.1 · 6.2.2 | *(transaction open)* · streams mapped by Institute Admin |
| Institutional sign-in is configured | 4.2.2 · `PM-10` | Institute Admin |
| The institution data integration runs | 7.1.1 · 7.1.2 · 7.2.1 | Institute Admin |

| Derived state | When |
|---|---|
| **Attention needed** | a configured integration reported failures on its last run — FRD 7.2.1 requires failures to be retained with a reason |
| **Setup incomplete** | one or more of the three facts is not yet in place |
| **Operating** | all three are in place and nothing is failing |

**Deliberately excluded: *Inactive*, *Suspended*, *Expired*, *Cancelled*.** Each is the **result of an administrative action**, and no source defines a Super Admin action that produces one. Adding them would smuggle a capability in through a status label. This is `DA-01`.

The ledger always shows all three facts, in the same order, with a missing one shown as missing rather than omitted — *"not configured"* is the state a reviewer most needs to see.

## 8 · What the platform plane never learns

Stated positively, so it can be checked rather than trusted. Across the whole of Batch 05 there is:

- no institutional person — no learner, no faculty member, no institutional administrator, by name or by count;
- no cross-institution total, average, ranking, comparison, chart or trend;
- no learner progress, result, attempt or assessment figure of any kind;
- no seat, student-cap, capacity or utilisation number of any kind — `OQ-03` leaves the whole model open;
- no institutional configuration value the Super Admin could change;
- no record of what the Super Admin looked at — **`GP-4`**, stated on `SA-03` rather than silently absent.

The automated audit in [`qa/ACCESSIBILITY_AND_UX_QA.md`](qa/ACCESSIBILITY_AND_UX_QA.md) verifies the structural half of this across every route at both target widths.
