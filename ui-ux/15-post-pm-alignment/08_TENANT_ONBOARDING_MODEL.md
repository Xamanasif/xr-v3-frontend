# 08 — Tenant Onboarding Model

| | |
|---|---|
| **Status** | 🟠 **ALIGNMENT MODEL — DRAFT.** Models the **stable portion only** |
| **Created** | 29 August 2026 |
| **Rule** | The approving actor, the rejection behaviour and the field list are **not invented** |

---

## 1 · The stable portion

**Everything below is high-confidence PM direction (`PM29-07`) plus FRD 4.2.1. It is the part that holds whoever turns out to own the approval.**

```
   PUBLIC VISITOR
        │
        ▼
   ENTRY CHOICE: Institution / Tenant   ◀── PM29-06 🔵 · 🔴 no screen exists
        │
        ▼
   APPLICATION FORM                     ◀── PM29-07 🔵 · FRD 4.2.1
        │  · organisation information       ✅ named by the PM
        │  · SPOC / contact information     ✅ named by the PM
        │  · ⚪ everything else              NOT STATED — not invented
        │  · ⚪ desired content, if the
        │       request carries a selection  depends on PM29-A6
        ▼
   SUBMITTED
        │  the applicant must be able to see that it was received
        │  and what state it is in — ⚪ the state SET is not stated
        ▼
   PLATFORM REVIEW / VALIDATION         ◀── PM29-07 🔵 · ⚪ ACTOR PM29-A4
        │
        ▼
   AUTHORISATION                        ◀── PM29-07 🔵 · ⚪ ACTOR PM29-A4
        │
        ├──▶ ⚪ REJECTED?  ── NOT STATED IN ANY SOURCE. NOT DESIGNED
        ├──▶ ⚪ PENDING / MORE INFO? ── NOT STATED. NOT DESIGNED
        │
        ▼
   COMMERCIAL OUTCOME                   ◀── PM29-08 🔵 · ⚪ RULE OPEN
        │     internal → access may be provided without payment
        │     external → commercial / payment cycle
        ▼
   TENANT CREATED                       ◀── FRD 4.2.1 acceptance criterion
        │  "An institution can be registered and a tenant created, after
        │   which institutional configuration becomes available."
        │  Tenant isolation applies from here — FRD 1.3.1
        ▼
   TENANT ADMIN EXISTS                  ◀── PM29-22 🔵 · ⚪ MECHANISM QD-02
        │  ⚪ who assigns the first one, and how, is undefined in Phase 1
        │     (FRD 7.4.2 IdP role mapping and 8.3 custom roles are BOTH Phase 3)
        ▼
   TENANT WORKSPACE                     ◀── ✅ DESIGNED — Batch 03
           Overview · People · Academic Structure · Content Access ·
           Institution Setup (SSO · institution data)
```

---

## 2 · What each step's status actually is

| Step | Confidence | Designed? | Nearest existing artefact |
|---|---|---|---|
| Entry choice Institution / Individual | 🔵 HIGH | 🔴 **No** | None. No inventory ID |
| Application form | 🔵 HIGH | 🔴 **No** | `AUTH-10` *Institutional onboarding enquiry* — **NEW, P3, never built in any batch** |
| Submitted / applicant-visible state | 🟠 Implied | 🔴 **No** | — |
| Platform review / validation | 🔵 HIGH *(that it exists)* | 🔴 **No** | Batch 01's review-queue and decision patterns are the closest analogue |
| Authorisation | 🔵 HIGH *(that it exists)* | 🔴 **No** | — |
| Commercial outcome | 🔵 HIGH *(both branches)* | 🔴 **No** | — |
| Tenant created | 🔵 HIGH · FRD 4.2.1 | 🔴 **No** | Batch 05 `SA-02` lists institutions **that already exist** |
| Tenant Admin assigned | 🔵 HIGH *(authority)* | 🔴 **No** | Batch 05 `SA-09` is **read-only** by `DA-04` |
| Tenant workspace | ✅ CONFIRMED | 🟢 **Yes** | Batch 03, 13 screens |

**Eight steps. One designed.**

---

## 3 · The unresolved actor — why it cannot be filled in

`PM29-A4` is not a detail. **It changes what has to be built.**

| If the approver is… | What the product needs |
|---|---|
| **Super Admin, in-product** | A request queue · a request detail screen · approve / reject / more-info actions · a reason field · a state machine · an applicant-visible status · probably a history trail |
| **Another platform operations role** | All of the above, **plus an eighth role** — which PM-07 forbids and FRD 8.3 (Phase 3) provides no mechanism for. **This reading is structurally expensive and should be tested explicitly on Monday** |
| **A manual organisational process** | A request **record**, a status the applicant can see, and an administrative way to mark the outcome. **No queue, no decision UI, no state machine** |

> **The three answers differ by roughly a workspace.** Guessing costs either a wasted build or a missing one.

### What Batch 05 already established, and what has changed

Batch 05 **refuted** a Super-Admin-operated onboarding wizard as `R-01`, on the correct ground that FRD 4.2.1's grammatical subject is *the institution* — it describes **self-registration** — and that its acceptance criterion names no role.

**That reasoning was right about the FRD and is now incomplete about the product.** `PM29-07` adds a platform-side validation and authorisation step that FRD 4.2.1 does not contain. So:

| | Before 29 Aug | After 29 Aug |
|---|---|---|
| `R-01` institution creation / onboarding | **REFUTED** | ⚪ **OPEN — a platform-side step exists; its owner does not** |
| `R-02` assign the first Institute Admin | **REFUTED** | ⚪ **OPEN — `PM29-22` asserts the authority; `QD-02` withholds the mechanism** |

**Note for the record:** FRD 4.2.1's **Roles column** does list *Institute Admin, Super Admin*. Batch 05 correctly treated that as a listing rather than a grant. With `PM29-07` and `PM29-22` added, the listing now has direction behind it — but a listing plus a direction is still not a named actor.

---

## 4 · What this model deliberately does NOT contain

| Not modelled | Why |
|---|---|
| **Rejection rules** | **No source contains a rejection, a reason taxonomy or an appeal path for institutional onboarding.** FRD 4.2.1 has no approval behaviour at all |
| **An SLA or turnaround time** | Never stated anywhere. Inventing one creates an expectation the business has not agreed to |
| **Business-verification providers** — registry lookup, domain verification, GST/tax-ID check, document upload | **No source names any.** Each would be an integration decision, not a design decision |
| **A named approver** | `PM29-A4` |
| **Field lists beyond organisation and SPOC** | `PM29-07` — the PM named two; the rest is not stated |
| **Whether the request carries a content selection** | Depends on `PM29-A6` (request list vs cart vs plain enquiry) |
| **The paid / free classification rule** | `PM29-08` + `PM29-A7` |
| **A sub-tenant / campus structure** | `PM29-A7`. **No source contains such a level**, and BITS/WILP/Goa/Pilani may or may not require one |
| **Seat or capacity commitments in the application** | `PM29-20` — no seat model exists |
| **Notifications to the applicant** | No Phase-1 FRD notification requirement exists anywhere |

---

## 5 · The BITS / WILP / Goa / Pilani question

The handwritten page names all four. **What they are is not established** — and the three readings produce three different platforms.

| Reading | Consequence |
|---|---|
| **Four separate tenants** | FRD 1.3.1 isolation applies **between** them: separate configurations, separate people, separate reporting, no shared learner |
| **One tenant with organisational units** | Requires a **campus / unit level below the tenant that no source contains and no batch designs.** This is a structural addition, not a label |
| **Example institutions only** | No structural consequence |

**It is coupled to `PM29-08`.** If *internal* is defined by membership of the BITS/WILP group, then the group's structure **is** the input to the paid/free rule. Answering one without the other leaves the commercial branch undefined. → `PQ-11`

---

## 6 · Where the design would attach, once unblocked

**Recorded so the work is ready to start, not started.**

| New surface | Attaches to | Reuses |
|---|---|---|
| Public entry fork | Above sign-in (`AUTH-01`) | Shell (`SHR-02`) |
| Institution application form | The Institution branch of the fork | Form components, validation summary, `Metadata Group` (Batch 01) |
| Applicant status view | After submission | `Status Badge` grammar, `Empty State` |
| Platform request queue *(if in-product)* | A platform workspace | **Batch 01's queue + review-panel + decision-dialog pattern, near-verbatim** — that pattern already handles *approve / request changes / reason required / history* |
| Tenant creation outcome | After authorisation | — |
| Tenant Admin assignment | Tenant creation | ⚪ blocked by `QD-02` |

> **The strongest reuse signal in this document:** if the approval turns out to be in-product, **Batch 01's governance-review pattern is a direct fit.** A queue, a detail view, a decision with a required reason, a state that the submitter can see, and a history trail — that is exactly what an application review needs, and it is already built, QA-passed and accessible. That is worth knowing before Monday, and it costs nothing to know.
