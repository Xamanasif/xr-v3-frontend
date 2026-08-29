# 04 — Platform Administration Model

| | |
|---|---|
| **Document ID** | `BATCH05_PLATFORM_ADMIN_MODEL` |
| **Batch** | 05 — Super Admin + platform-wide administration |
| **Date** | 27 August 2026 |
| **Covers** | The four platform-plane areas: module version release, device-replacement approval, platform roles, platform configuration |
| **Companion** | [`05_CROSS_TENANT_MODEL.md`](05_CROSS_TENANT_MODEL.md) covers the institution-facing half |

---

## 1 · Module version release — `SA-04` · `SA-05`

### 1.1 What this is, and what it is not

> **FRD 2.3.2, verbatim:** *"Controlled Update Releases. Super Admin shall control when new versions of modules are released to production environments."*
> Phase 1 · `UNCHANGED-FRD` · role: Super Admin · capability tags `GOV`, `CFG`
>
> **FLOW 10 step 1, verbatim:** *"Super Admin — Controls when a new module version is released to the production environment, **and may hold a release**."*

**This is not publication, and the distinction is the most important thing in this batch.**

| | Publication | Version release |
|---|---|---|
| Requirement | FRD **1.4.4** | FRD **2.3.2** |
| Flow | **FLOW 1** — content to production | **FLOW 10** — version release to live content |
| Question it answers | Does this module reach learners **at all**? | Does this **newer version** replace the one they are running? |
| Owner | **Content Manager** (`PM-16` · `PM-17`) | **Super Admin** |
| Designed in | Batch 01, `CM-02` | Batch 05, `SA-04` / `SA-05` |

Every module on these screens has **already been published** by the Content Manager and is already reaching learners. **Content publication has already occurred**, and both screens say so in product language — `SA-04` in its lead alert, `SA-05` in a boundary note carrying the module's own publication date. The Super Admin never sees an unpublished module, has no route to one, and **holds no second publication gate in front of the Content Manager's**.

### 1.1a The controls are named for the version

| Control | Retired wording |
|---|---|
| **Release version** | ~~Release to production~~ · ~~Production release~~ |
| **Hold version** | ~~Hold release~~ |

An action named for a **destination** reads as a second shipping gate, and the shipping gate is publication. *Production* survives only where it explains the **consequence**, in FRD 2.3.2's own words (*"released to production environments"*) — never as the name of an action. Dialog titles, confirmation labels, page heads and screen-reader announcements all follow the control.

> ⚠ **`D-01` — OPEN PM CLARIFICATION.** Not resolved by this batch.
>
> **PM question:** *"After Content Manager publishes content, does Super Admin still retain the separate Phase-1 version release/hold authority from FRD 2.3.2?"*
>
> `PM-18` removed Super Admin from the *publication flow*; FRD 2.3.2 is a separate Phase-1 requirement with its own flow that the PM did not address, and §6.6.5 records the ambiguity in the FRD's own words: *"Whether the Content Manager holds any version-release authority, or whether that is Super Admin's alone."* Batch 05 takes the least-assumptive reading — 2.3.2 survives — and keeps the capability **isolated and reversible**: release state is read and written by `SA-04` and `SA-05` alone, so if the PM rules otherwise the two screens are withdrawn as a pair, exactly as Batch 01's two publish screens were, leaving no orphaned surface. **Full reasoning in the audit, Part D.**

### 1.2 The two outcomes

The acceptance criterion makes the second one mandatory, not optional:

> *"A new module version reaches production only when Super Admin releases it; **holding a release is an available and visible outcome**."*

So **Hold** is a first-class control with its own state. It is never a disabled button, and it is never merely the absence of pressing Release.

```
                          ┌──────────────────────┐
      version is ready →  │  Awaiting decision   │
                          └──────────┬───────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    ▼                                 ▼
            ┌───────────────┐                 ┌───────────────┐
            │   Released    │                 │     Held      │
            │ learners move │                 │ learners stay │
            │ to the new    │                 │ on the        │
            │ version       │                 │ current one   │
            └───────────────┘                 └───────┬───────┘
                                                      │ may be released later
                                                      └──────────────►
```

Three states, because the requirement and its acceptance criterion define three and no more. A hold does not expire, does not withdraw the version, and can be released at any time.

### 1.3 What releasing sets in motion

`SA-05` shows the consequence chain, because a release decision is only meaningful if its effect is visible. Each step cites its own requirement:

| | What happens | Requirement |
|---|---|---|
| 1 | **You decide.** The version reaches production only on your release | 2.3.2 |
| 2 | The device application downloads the updated version automatically | 2.3.1 |
| 3 | The module updates independently of the application — no reinstall | 2.3.3 |
| 4 | The learner may see an *update available* state; an unrequested update never blocks them | 2.3.1 · `PM-05` |

**Mechanism-neutral throughout.** No transport, endpoint, protocol, package format or environment is named anywhere — `PM-05` explicitly declined to select one and `QT-01` holds it open.

### 1.4 Deliberate absences

| Absent | Why |
|---|---|
| Publish · unpublish · withdraw | `PM-16` · `PM-17` — the Content Manager's |
| Return to vendor · request changes | **`QP-26` OPEN** |
| A reason on a hold | **`GP-4`** — no audit trail is defined outside content governance (`DA-06`) |
| Rollback to an earlier version | No source defines one |
| Module lifecycle state — draft / live / retired | FRD 1.5.1 is **Phase 2** |
| Learner notification | No Phase-1 notification requirement exists anywhere. FLOW 10's recorded gap states the consequence: *"the platform can present an update-available state, but it cannot inform a learner who is not looking"* — and `SA-04` says so rather than inventing one |
| Diff · changelog format · version history tree | No source defines any |

---

## 2 · Device-replacement approval — `SA-06` · `SA-07`

### 2.1 The platform's only cross-plane approval

> **FRD 2.4.2, verbatim:** *"Device Replacement Authorization. Users requesting device replacement must receive approval from the Super Admin before transferring their license to a new device."*
> Phase 1 · `PRODUCT-PENDING` · roles: Learner, Super Admin · **B2C**
>
> **FLOW 8's own framing, verbatim:** *"This is the platform's only Phase-1 two-role, cross-plane approval workflow outside content governance: a learner in the personal context requesting an action only a platform-wide Super Admin can grant. **Neither end had any designed surface.**"*

This is the strongest-supported write action the role retains, and the only place in the platform where an individual learner and the Super Admin meet.

### 2.2 B2C only — structurally, not by filter

FRD 2.4.1 binds an individual licence to a device. FRD 2.4.3 makes institutional deployments use **shared** devices, so an institutional learner has **no personal device binding to transfer**. No institutional request can exist here.

`SA-06` states this rather than leaving a reviewer to wonder where the institutional requests are: *"this is not a filter, it is the shape of the requirement."*

### 2.3 Both ends, on one screen

FRD 2.4.2's acceptance criterion requires that *"the request's state is visible to the learner throughout,"* and FLOW 8 step 4 requires that after approval *"the learner can see that it has."* Those are learner-side obligations, and `SA-07` shows them — so the person deciding sees what the decision does to the person waiting.

```
  ①  Learner asks to move their access                       2.4.2
       from  XRD-8F2A-••••-41C7   →   to  XRD-D3B9-••••-77E0
                    │
  ②  Waiting for your approval                               2.4.2 AC
       the learner can see the request is with the platform
                    │
  ③  Access stays on the current device
       until you approve, they can only open it where they are
                    ▼
      ── approve ──►  the licence rebinds, and the learner
                      can see that it has                    FLOW 8 ④ · AC-28
```

### 2.4 One outcome — and the gap where the second should be

FRD 2.4.2's row records it verbatim: *"The FRD describes no rejection path, no evidence requirement and no limit on replacement frequency — **all PENDING DECISION**."*

So there is **Approve**, and there is nothing else. `SA-07` shows the missing decline route as a **marked gap in the page**, not as a greyed-out control:

> *"The requirement gives this role one outcome — approval — and describes no rejection path, no evidence a learner must supply, and no limit on how often a device may be replaced. Rather than show a decline control that would not work, or a greyed-out one implying the route exists, the gap is stated here. A learner whose request should not be granted currently has no defined outcome at all."*

**Device identifiers are shown partly masked.** FRD 2.4.1 requires the licence to bind to *"a specific encrypted XR device ID"*; nothing in the source asks an administrator to read one in full.

### 2.5 Deliberate absences

| Absent | Why |
|---|---|
| Decline · reject | FRD 2.4.2 — **PENDING DECISION** (`DA-07`) |
| Evidence or supporting-document step | FRD 2.4.2 — **PENDING** |
| Replacement-frequency limit or counter | FRD 2.4.2 — **PENDING** |
| Device registration · remote device management | FRD 2.5.x · 2.6.x are **Phase 2** — *"must not appear in a Phase-1 administrative workspace"* |
| Any record of the approval beyond the request's own state | **`GP-4`** |
| Payment · refund · entitlement change | The access itself is unchanged — only the device it opens on. `QP-18` |

---

## 3 · Platform roles — `SA-09`

### 3.1 Confirmed authority, undefined mechanism

> **§6.7.2, verbatim:** *"Manage platform configuration and **platform role assignment** (8.1.1)."*
> **Detailed FRD, verbatim:** *"Super Admin assigns platform roles under 8.1.1; **how a person becomes Faculty or Institute Admin within a tenant in Phase 1 is recorded as an open question**."* → **`QD-02`, HIGH**

The authority is real. The route by which anyone is actually assigned a role in Phase 1 — invited, created, imported, or something else — has not been decided. Designing an assignment control would mean **choosing that mechanism**, which is not a designer's decision to take.

So `SA-09` shows **who holds what** and offers no control to change it. This is `DA-04`.

### 3.2 Only the central plane

| Shown | Basis | Plane |
|---|---|---|
| Super Admin | FRD 8.1.1 | Platform-wide |
| Content Manager | FRD 8.1.2 · `PM-16` · `PM-17` | Central content plane |
| Academic Reviewer | FRD 1.4.2 · `PM-07` | Central content plane |
| Vendor | FRD 1.4.1 · 1.4.5 · `PM-07` | Central content plane |

**Institute Admin, Faculty and Learner are deliberately absent.** They belong to an institution, not to the platform (`PM-13`), and how a person becomes one in Phase 1 is expressly undefined. Their absence is stated on the screen so it reads as a boundary rather than an oversight:

> *"No institutional person appears on this screen. No institutional role can be assigned from here. No institution's staff list is reachable from here."*

### 3.3 The seven roles are fixed

FRD 8.3.1 and 8.3.2 (custom role creation, permission-level access control) are **Phase 3**, and §6.7.3 prohibits them to this role outright. Nothing on this screen can add a role or change what an existing one may do.

### 3.4 A second, unowned gap

`SA-09` also records a question this audit surfaced and no source answers:

> **Who provisions a Vendor or an Academic Reviewer?** The requirements speak of *"authorised vendors"* without ever saying who authorises them, and academic validation is described with no account administration around it. Both roles are confirmed by `PM-07`; the route by which a person becomes one is written down nowhere.

This is why the Review-006 inventory's `SA-07` (Vendors) and `SA-08` (Academic reviewers) registry screens are **not built** — see audit **R-03** and **R-04**.

---

## 4 · Platform configuration — `SA-10`

### 4.1 Why this is a register and not a settings page

> **FRD 8.1.1, verbatim:** *"The Super Admin role shall have **full administrative control over platform configuration**, module publishing, licensing management, and cross-tenant analytics."*

The authority could not be plainer. And **no source, anywhere in the v5 set, names a single Phase-1 platform-wide setting for this role to control.**

A settings page invented to fill that space would be the most misleading artefact this batch could produce: it would look like a specification, and every control on it would be fiction. The batch brief prohibits it outright — *"A fake 'Settings' page with invented controls is prohibited"* — and it would be wrong even if it did not.

So the screen renders **the register itself**. The screen's content *is* the finding.

### 4.2 The register

Fifteen areas a reader might expect, each with what the sources actually say. Four kinds:

| Kind | Meaning | Count |
|---|---|---|
| **Built here** | Confirmed, and it has its own screen in this batch | 2 |
| **Another role** | The setting exists and someone else owns it | 4 |
| **Later phase** | The requirement exists and is Phase 2 or Phase 3 | 4 |
| **Not defined** | No requirement defines it at all | 5 |

| Area | Status | Source |
|---|---|---|
| Module version release | **Built here** → `SA-04` | FRD 2.3.2 |
| Device replacement approval | **Built here** → `SA-06` | FRD 2.4.2 |
| Platform role assignment | Not defined *(authority confirmed, mechanism open)* → `SA-09` read-only | FRD 8.1.1 · `QD-02` |
| Institutional sign-in | Another role — **Institute Admin** | FRD 4.2.2 · `PM-10` |
| Institution data integration | Another role — **Institute Admin** | FRD 7.1.1 · 7.2.1 |
| Content access and stream mapping | Another role — **Institute Admin** | FRD 6.2.1 · 7.2.3 |
| Assessment rules and grading | Another role — **Faculty** | FRD 5.1.x · `PM-15` |
| Bundles and pricing | Later phase — **Phase 2**, prohibited by §6.7.3 | FRD 6.3.1 · 6.3.2 |
| Custom roles and permissions | Later phase — **Phase 3**, prohibited by §6.7.3 | FRD 8.3.1 · 8.3.2 |
| Cross-institution analytics | Later phase — **Phase 2**, deferred, prohibited by §6.7.3 | FRD 8.2.2 · 11.3.x · `PM-11` |
| Device registration and management | Later phase — **Phase 2** | FRD 2.5.x · 2.6.x |
| XR delivery mechanism | Not defined — **open by explicit instruction** | `PM-05` · `QT-01` |
| Session, password and sign-in policy | Not defined — **no requirement defines any of it** | — |
| Audit and activity records | Not defined — **acknowledged gap** | `GP-4` · §6.7.5 |
| Notifications | Not defined — **no Phase-1 requirement exists** | — |

### 4.3 The rule the screen states about itself

> *"Every field a settings page would need — a value, a default, a permitted range, an effect — comes from a requirement. Where the requirement does not exist, the field would be invention dressed as specification."*

---

## 5 · Licensing — `SA-08`

Included here for completeness; it holds no action.

FRD 8.1.1 and §6.7.2 confirm *"licensing management"* as a Super Admin area. **The mechanism does not exist.** FLOW 2's recorded gap, verbatim:

> *"How an institutional licence is transacted in Phase 1 is undefined, because institutional billing (FRD 9.3.1, 9.3.2) is Phase 2. **Licences are shown as existing; no in-platform purchase flow is invented.**"*

§6.7.5 lists the same thing as an unresolved detail of the role itself.

So `SA-08` shows access records **as they stand** — which institutions hold one, which academic streams it covers, and its state — and does nothing else. **No price, currency, term, renewal, expiry, invoice, plan, seat, student cap, capacity limit, refund or cancellation appears anywhere on it**, because `OQ-01`–`OQ-06` and `QP-04` leave every one of those open.

> ⚠ **`OQ-03` — OPEN.** *Does institutional access use a learner/seat cap, and if so what is the exact model?*
>
> An earlier pass showed a **Student cap** column here, and a *"Capped at 5,400 students"* line on `SA-03`, read from the draft FRD's seat-utilisation line (6.2.2). That presented an unresolved model as a settled fact of the record. The column, the figure, the `SA-03` key/value row and the underlying seed field are **removed**, and **nothing replaces them** — no alternative commercial model is invented in their place. What remains is only what the sources support: that a record exists, which academic streams it covers, and its state.

**The individual side has no administrative action at all.** FRD 9.2.1 makes activation automatic — *"Upon successful payment, licenses shall be automatically activated and linked to the user account"* — with no human step for anyone, so there is no screen to design. And individual learners are not listed: FRD 1.3.1 / 1.3.2 hold individual data apart from institutional data, and nothing on this platform combines the two.

Where an individual learner does need something from this role, it reaches them as a **request** — which is `SA-06`.
