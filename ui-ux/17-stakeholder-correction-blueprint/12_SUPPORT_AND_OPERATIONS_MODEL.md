# 12 — Support and Operations Model

| | |
|---|---|
| **Status** | ✅ **CURRENT SUPPORT MODEL OF RECORD** — **a wholly new capability area** |
| **Created** | 31 August 2026 |
| **Governing decisions** | `STK31-39` · `22` · `40` · `42` |
| **Prior state** | **No support or issue-reporting capability exists in any FRD source or in any of the five batches** |

---

## 1 · What was confirmed — `STK31-39`

### 1.1 The user side

Users must be able to **report operational problems**:

| Issue kind |
|---|
| Experiment not opening |
| Package / link issue |
| Login issue |
| Access issue |
| Device issue |
| Other technical issue |

### 1.2 The platform side

The platform / Super Admin side must be able to:

- **see** the reported issue
- **understand** the affected **user · Experiment · Tenant**
- **track** status
- **resolve / close** the issue

### 1.3 The four prohibitions

> **Do NOT invent, unless source-supported:**
> **1.** an SLA · **2.** a priority formula · **3.** an external ticket provider · **4.** a chatbot implementation.
>
> **Manuals / guides may be added later.** They are not part of this capability.

---

## 2 · The flow

```
   ANY USER                                       PLATFORM / SUPER ADMIN
   ────────                                       ──────────────────────
   Encounters a problem
        │
        ▼
   REPORT AN ISSUE
   · issue kind (from the confirmed list)
   · what they were doing
   · context captured automatically where the
     platform already knows it:
        · user identity + role
        · Tenant
        · Experiment (where applicable)
        · technology / device (where applicable)
        │
        ▼
   SUBMITTED ──────────────────────────────────▶  ISSUE APPEARS IN THE PLATFORM QUEUE
        │                                              │
        │                                              ▼
        │                                         ISSUE DETAIL
        │                                         · who · which Tenant
        │                                         · which Experiment · which technology
        │                                         · what they reported
        │                                              │
        │                                              ▼
        │                                         TRACK STATUS
        │                                              │
        ▼                                              ▼
   THE REPORTER CAN SEE THE STATE   ◀──────────   RESOLVE / CLOSE
```

**The reporter must be able to see that the report was received and what state it is in.** This is the same discipline Batch 01 applies to a submission — *the submitter always knows who holds it* — and the same discipline `STK31-20` requires of a tenant applicant.

---

## 3 · What the platform already has that this reuses

**This is a new capability, but almost none of it is a new pattern.**

| Need | Existing asset |
|---|---|
| A queue of things awaiting a decision | **Batch 01** `Table` + row + queue-empty state |
| A detail view of one submitted item | **Batch 01** `Submission Summary` + `Metadata Group` |
| A decision with a required reason | **Batch 01** `Review Panel` + `Confirmation Dialog` (input variant) |
| A state the submitter can see | **Batch 01** `Status Badge` + `Workflow Stage Indicator` |
| A history trail | **Batch 01** `Review History Timeline` |
| An attention list of things needing action | **Batch 03** *Records Needing Attention* · **Batch 05** attention list (which carries a per-row `aria-label`) |
| An issue with a kind, a cause and a resolution state | **Batch 03** `Issue Card` and its issue taxonomy |

> **Batch 03's *Records Needing Attention* is the closest conceptual match on the platform side, and Batch 01's governance queue is the closest structural match.** Neither needs redesigning.

---

## 4 · Where Help lives — an accessibility obligation, not just a placement choice

> 🔴 **A real, measured inconsistency exists across the built work.**
> **WCAG 2.2 SC 3.2.6 *Consistent Help* is a Level A criterion**, and the project's accessibility baseline is **WCAG 2.2 AA** (`D-11`).
>
> Help is **present in Batches 01–03**, **dropped by Batch 04**, and **demoted by Batch 05**.

**`STK31-39` makes this decidable rather than merely inconsistent:** the platform now has a real Help destination, so **Help gets one consistent location in the shell, on every screen of every workspace.**

This is listed in `ui-ux/16-unified-product-planning/12_POST_PM_IMPLEMENTATION_HANDOFF.md` §1.2 as one of three accessibility items that **need no decision at all** — it needed a destination, and now it has one.

---

## 5 · Operational attention states this model shares with the platform

Support is not the only thing that *needs attention*. The unified build should use **one attention grammar** for all of it:

| Attention source | Owner | Decision |
|---|---|---|
| A reported issue awaiting triage | Super Admin | `STK31-39` |
| A tenant request awaiting a decision | Super Admin | `STK31-20` |
| A version awaiting Release / Hold | Super Admin | `STK31-07` |
| A device-transfer request awaiting approval | Super Admin | `STK31-38` |
| **A tenant access term expiring in 15 days** — *recommended supporting UX; **the confirmed requirement is the reminder itself*** | Super Admin **and** Tenant Admin | `STK31-28` |
| Institution-data records not applied | Tenant Admin | Built — Batch 03 `INA-12` |
| A CSV import row that failed validation | Tenant Admin | `STK31-26` |
| A descriptive result awaiting evaluation | Faculty | `STK31-31` |
| Content access recorded but reaching no learner | Tenant Admin | Built — Batch 03 `INA-06` |

> **One grammar, many sources.** Batch 03 and Batch 05 both already ship an attention-list pattern; **Batch 05's carries a per-row `aria-label` and is the one to promote.**

---

## 6 · What this model deliberately does NOT contain

| Not modelled | Why |
|---|---|
| An SLA, a turnaround commitment, or a response-time promise | `STK31-39` — **explicitly prohibited**. Inventing one creates an expectation the business has not agreed to |
| A priority / severity formula | `STK31-39` — **explicitly prohibited** |
| An external ticketing provider or integration | `STK31-39` — **explicitly prohibited** |
| A chatbot or automated triage | `STK31-39` — **explicitly prohibited** |
| An escalation path or an on-call model | No source contains one |
| A knowledge base, manuals or guides | *"may be added later"* — **not part of this capability** |
| A **support** notification or e-mail service | No source describes one for support. Support status is surfaced **in the product**. ⚠ **This is not the expiry reminder** — that one is **REQUIRED** by `STK31-28`, with only its channel pending (`ND-16`) |
| A satisfaction survey, rating or feedback score | Not sourced anywhere |
