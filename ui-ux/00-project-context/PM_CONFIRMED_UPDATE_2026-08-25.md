# PM Confirmed Update — Publication Ownership

| | |
|---|---|
| **Document ID** | `PM_CONFIRMED_UPDATE_2026-08-25` |
| **Date** | **25 August 2026** |
| **Status** | ✅ **AUTHORITATIVE** for the statements it contains |
| **Type** | PM confirmation capture — a **publication-ownership correction**. **Not** a design document, not a review, not an FRD amendment, not a redesign |
| **Extends** | `PM_CONFIRMED_BASELINE_2026-08-18.md` (PM-01 – PM-12) and `ui-ux/12-full-platform-reframe/13_PM_CLOSURE_DECISIONS.md` (PM-13 – PM-15) |
| **Supersedes** | Only the **publication-owner** statement in the earlier chain (Super Admin as publisher). Nothing else. |
| **Does not supersede** | `source/Platform FRD_v4.pdf` · `requirements/updated-frd/*` · the 18 August baseline · Review-005 · Review-006 — all unchanged |
| **Applies to** | Batch 01 (`ui-ux/13-full-platform-design/`) |

---

## Authority rule

The rules from the 18 August baseline continue to apply unchanged:

1. These statements are **PM-CONFIRMED** and take precedence over prior assumptions, assistant recommendations, and Review-005/006 decisions **on the specific point they address**.
2. **The original FRD is not rewritten.** `source/Platform FRD_v4.pdf` remains unchanged.
3. **FRD deviations or extensions are recorded, not silently applied.**
4. **Earlier documents are not edited to hide the superseded model.** The 18 August baseline, the Review-006 role/permission matrix and `13_PM_CLOSURE_DECISIONS.md` are historical records and remain as written.

### What this document does *not* do

- It does **not** overwrite or edit `PM_CONFIRMED_BASELINE_2026-08-18.md`.
- It does **not** remove Super Admin from the platform role model.
- It does **not** define any new Super Admin workspace, screen or responsibility.
- It does **not** resolve any question about licensing, entitlement or purchase.

---

# CONFIRMED

| # | Statement |
|---|---|
| **PM-16** | **The Content Manager is the publication owner.** |
| **PM-17** | **The Content Manager performs the final Publish action.** |
| **PM-18** | **Super Admin is not part of the confirmed Batch-01 publication flow.** |

## Confirmed Batch-01 governance chain

```
Vendor  →  Academic Reviewer  →  Content Manager  →  Published
```

The Content Manager may **request changes** or **publish**, once the required review state is reached.

## FRD traceability — DEVIATION. Recorded, not silently applied.

FRD **1.4.4** assigns publication to the Super Admin, and the Review-006 role/permission matrix records `D4 · Publish to production` as a Super-Admin-only permission (`Pb`). **This update deviates from that on the single point of publication ownership.** The deviation is recorded here and reflected in current Batch-01 documentation; the FRD and the Review-006 matrix are **not** edited.

FRD **1.4.5** (*third-party vendors shall not have direct publishing rights*) is **unaffected** — the Vendor still holds no publish control anywhere.

## Standing of the Super Admin role

**Super Admin remains one of the approved platform roles** (FRD 8.1.1 · PM-07 · PM-13). This update removes it from the **active Batch-01 content-publication workflow only**. Its detailed workspace and responsibilities are **deferred** until supported by confirmed requirements or PM decisions in a later platform batch.

This is a deferral, **not** the removal of the role from the platform.

---

# OPEN / NOT YET CONFIRMED

These are **not** answered by this update. They must not be inferred, designed around as though settled, or presented as confirmed.

| # | Open question | Status |
|---|---|---|
| **OQ-01** | Exact **B2B subscription / licensing model** | ❌ **OPEN** — not confirmed |
| **OQ-02** | **What institutions subscribe to** (platform, catalogue, per-module, bundle, …) | ❌ **OPEN** — not confirmed |
| **OQ-03** | **Seat model, if any** (named seats, concurrent seats, uncapped, …) | ❌ **OPEN** — not confirmed |
| **OQ-04** | **How learner entitlement is assigned** | ❌ **OPEN** — not confirmed |
| **OQ-05** | **Learner browse behaviour for non-entitled content** (visible / hidden / teaser) | ❌ **OPEN** — not confirmed |
| **OQ-06** | Exact **B2C purchase / subscription model** | ❌ **OPEN** — not confirmed |

**Handling rule.** Batch-01 screens that touch these areas are drawn as **marked gaps with sample design data**, exactly as before. No commercial, licensing, seat or entitlement-assignment rule is invented on the strength of this update.

---

## Related open item — not resolved here

**`QP-26` — may Super Admin also return a submission at the publication gate?**
This update states **who publishes**. It says nothing about Super Admin's return/request-changes authority. **`QP-26` therefore remains OPEN / PENDING** and must not be recorded as resolved. See `requirements/updated-frd/Platform_FRD_v5_OPEN_QUESTIONS.md` and `ui-ux/12-full-platform-reframe/11_OPEN_QUESTIONS_REFRAMED.md` (both unchanged).

---

## Where this is applied

| Artefact | Applied |
|---|---|
| Batch-01 prototype | `ui-ux/13-full-platform-design/prototype/batch01-prototype.js` |
| Batch-01 scope & screen table | `ui-ux/13-full-platform-design/01_BATCH01_SCOPE.md` |
| Batch-01 shell / component / QA / wireframe docs | `ui-ux/13-full-platform-design/` |

Historical documents recording the superseded model are listed under **Does not supersede** above and remain unedited.
