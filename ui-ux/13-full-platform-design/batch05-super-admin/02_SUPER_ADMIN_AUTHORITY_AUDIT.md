# 02 — Super Admin Authority Audit

| | |
|---|---|
| **Document ID** | `BATCH05_SUPER_ADMIN_AUTHORITY_AUDIT` |
| **Batch** | 05 — Super Admin + platform-wide administration |
| **Date** | 27 August 2026 |
| **Status** | Design audit. **Not** a requirement document, **not** a PM decision, **not** an FRD amendment |
| **Purpose** | Establish, from the authoritative sources alone, what the approved Super Admin role actually owns in Phase 1 — **before** any Super Admin screen is designed |
| **Method** | Exhaustive sweep of every authoritative source, followed by an adversarial verification pass in which every claimed capability had to survive an attempt to refute it |

---

## Why this document exists

The 25 August PM update (`PM-16` · `PM-17` · `PM-18`) removed Super Admin from the content-publication flow and **deferred its workspace** "until supported by confirmed requirements or PM decisions in a later platform batch." Batch 05 is that batch.

The old Batch-01 prototype contained two Super Admin publication screens. **Both were withdrawn.** Nothing in this audit reinstates them, and no replacement responsibility is invented to fill the space they left.

The rule this audit applies is the FRD's own, quoted verbatim from the Detailed Master's security principles:

> **Least privilege** — "Every permission in this document is derived from explicit FRD text or an explicit PM statement. Where neither defines a permission it is recorded as pending, never inferred."

---

## Sources audited

| Source | How it was read |
|---|---|
| `requirements/updated-frd/Core frd.pdf` | Full text extracted and read in full (30 pages) |
| `requirements/updated-frd/TL frd.pdf` | Full text extracted and read in full (11 pages) |
| `requirements/updated-frd/Detailed frd.pdf` | Full text extracted; **all 180 "Super Admin" occurrences** located and read in context, plus §6.7, §5, §9 (all ten flows), §17, §18, §19 and Appendix A read whole (147 pages) |
| `requirements/updated-frd/Platform_FRD_v5_OPEN_QUESTIONS.md` · `Platform_FRD_v5_CHANGE_SUMMARY.md` | Read in full |
| `ui-ux/00-project-context/PM_CONFIRMED_BASELINE_2026-08-18.md` (`PM-01`–`PM-12`) | Read in full |
| `ui-ux/00-project-context/PM_CONFIRMED_UPDATE_2026-08-25.md` (`PM-16`–`PM-18`) | Read in full |
| `ui-ux/12-full-platform-reframe/13_PM_CLOSURE_DECISIONS.md` (`PM-13`–`PM-15`) | Read in full |
| `ui-ux/12-full-platform-reframe/01`–`12` | Read in full |
| `ui-ux/13-full-platform-design/` Batches 01–04 | Read for boundary and house style. **Read-only.** |

**PDF / DOCX equivalence.** The PDFs are the authoritative artefacts and were the ones read. The DOCX companions were extracted independently and compared: token overlap **98.8 % / 99.0 % / 99.3 %** against the PDF text (the residual is repeated page furniture — `v5.0 … Page n of m` — present only in the PDF pagination), and the `Super Admin` occurrence counts match (TL 4/4, Core 15/15, Detailed 180/180 in cleaned text). They are the same v5 documents.

**Document status caveat.** Every page of the v5 set is stamped **"DRAFT FOR REVIEW — NOT YET APPROVED."** The v5 set consolidates `source/Platform FRD_v4.pdf`, which remains the issued baseline and is unchanged. Where a PM decision and the FRD disagree, the PM decision governs and the disagreement is recorded as a deviation, never silently reconciled.

---

## Part A — What the sources actually say

### A.1 The one place the role is fully defined

Detailed FRD **§6.7 · Table 41** is the only complete Super Admin role definition anywhere in the source set. Quoted verbatim:

| Attribute | Definition |
|---|---|
| Requirement basis | FRD 8.1.1 and 1.3.5 |
| Platform plane and context | Platform-wide; spans the central content plane and every tenant plane |
| Purpose | "Hold full administrative control over platform configuration, module publishing, licensing management and cross-tenant operational oversight." |
| Main navigation and capability areas | "Overview · Publishing · Content · Institutions · Licensing · Platform · Account." |
| Key workflows | FLOW 1 (publication gate), FLOW 2 (institutional licensing), FLOW 5 (delivery oversight), FLOW 8 (device replacement approval) |
| Data visibility | "Platform-wide, exercised as governance and operational oversight rather than as unrestricted data access." |
| Tenant boundary | "Spans all tenants. The only role that does." |
| Reporting needs in Phase 1 | "Cross-tenant operational oversight and content pipeline status. **No detailed analytics in Phase 1.**" |

**§6.7.2 Permissions and allowed actions** — verbatim, six lines:

1. "Publish approved modules to production — exclusive authority (1.4.4)"
2. "Control when new module versions release to production (2.3.2)"
3. "Manage licensing across institutional and individual entitlements (8.1.1, 6.2.x, 9.2.1)"
4. "Approve device replacement and licence transfer (2.4.2)"
5. "Manage platform configuration and platform role assignment (8.1.1)"
6. "Controlled cross-tenant access for governance and operational oversight (1.3.5)"

**§6.7.3 Prohibited actions** — verbatim, four lines:

- "No custom role creation — Phase 3 (8.3.x)"
- "No cross-tenant analytics dashboards — detailed metrics are deferred by PM-11, and 8.2.x and 11.3.x are Phase 2"
- "No bundle creation or pricing configuration — Phase 2 (6.3.x)"
- "Cross-tenant access is bounded to governance and operational oversight by the FRD's own wording (1.3.5), not unrestricted"

**§6.7.4 Acceptance criteria** — verbatim, three:

- "Given a submission that has not passed both prior gates, when Super Admin views the publication queue, then it is absent from that queue."
- "Given a device-replacement request, when Super Admin approves it, then the licence rebinds to the new device and the learner can see that it has."
- "Given cross-tenant access, when Super Admin views an institution, then tenant-scoped data remains presented within its institutional context rather than aggregated across institutions."

**§6.7.5 Unresolved details** — verbatim, four:

- "Whether Super Admin may also return a submission at the publication gate — PM-14 names Academic Reviewer and Content Manager only" *(= `QP-26`)*
- "How an institutional licence is transacted in Phase 1"
- "Whether an audit trail exists outside content governance for licensing, entitlements, configuration or device replacement"
- "Whether Super Admin may see assessment answer keys"

### A.2 Only six requirement statements name Super Admin in their own text

The Detailed FRD's Roles column lists Super Admin against **50 requirement IDs**. That is a listing, not a grant. Only **six** requirement statements name Super Admin in the requirement sentence itself:

| ID | Verbatim statement | Phase | FRD v5 status | Assigns an action? |
|---|---|---|---|---|
| **1.3.5** | "Cross-Tenant Governance Access. A Super Admin role shall have controlled access to view and manage data across tenants strictly for governance and operational oversight." | **1** | `UNCHANGED-FRD` | **Yes** |
| **1.4.4** | "Production Publishing by Super Admin. Only the Super Admin shall have permission to publish approved modules to the production environment." | 1 | `UNCHANGED-FRD` | Yes — **PM-OVERRIDDEN** |
| **2.3.2** | "Controlled Update Releases. Super Admin shall control when new versions of modules are released to production environments." | **1** | `UNCHANGED-FRD` | **Yes** |
| **2.4.2** | "Device Replacement Authorization. Users requesting device replacement must receive approval from the Super Admin before transferring their license to a new device." | **1** | `PRODUCT-PENDING` | **Yes** |
| **6.3.1** | "Bundle Creation. Super Admin shall be able to create bundles of simulation modules." | **2** | `FUTURE-PHASE` | Yes — **out of Phase 1** |
| **8.1.1** | "Super Admin Role. The Super Admin role shall have full administrative control over platform configuration, module publishing, licensing management, and cross-tenant analytics." | **1** | `UNCHANGED-FRD` | Umbrella grant |

**The "Administrators shall" trap.** Seven requirement statements say *"Administrators"* rather than *"Super Admin"* — 1.6.2, 2.6.1, 3.5.2, 6.4.1, 8.2.2, 8.3.1, 9.4.1. Six carry Super Admin in their Roles column and **all six are Phase 2 or Phase 3**. The seventh, 3.5.2, resolves to "Faculty, Institute Admin" and does not touch Super Admin at all. *"Administrators"* was not read as *"Super Admin"* anywhere in this audit without checking the Roles column.

**Naming variants.** `superadmin`, `super-admin`, `platform admin`, `platform-wide admin` return **zero** hits across the v5 set. There is no aliased Super Admin authority hiding under another name, and **"Platform Administrator" is not a role that exists in any source** — it appears in the Batch-05 brief as a candidate term only.

### A.3 Where Super Admin appears as an actor in a flow step

Only **two** flow-step tables name Super Admin in the Actor column:

| Flow | Step | Verbatim | Requirement |
|---|---|---|---|
| **FLOW 8** — Device binding and replacement | 3 | "Super Admin · Reviews the request and approves the licence transfer." | 2.4.2 |
| **FLOW 10** — Version release to live content | 1 | "Super Admin · Controls when a new module version is released to the production environment, **and may hold a release**." | 2.3.2 |

FLOW 8 carries its own framing sentence, verbatim: *"This is the platform's only Phase-1 two-role, cross-plane approval workflow outside content governance: a learner in the personal context requesting an action only a platform-wide Super Admin can grant. Neither end had any designed surface."*

FLOW 2 step 1 reads "Super Admin / Institute Admin — **An institutional licence exists** against the tenant" — a **post-condition, not an action**, and the flow's own recorded gap says so: *"How an institutional licence is transacted in Phase 1 is undefined, because institutional billing (FRD 9.3.1, 9.3.2) is Phase 2. Licences are shown as existing; no in-platform purchase flow is invented."*

FLOW 1 step 4 (publication) is **PM-OVERRIDDEN**. FLOW 5 ("delivery oversight" in Table 41) has **no step naming Super Admin as actor**.

---

## Part B — The classification

Every candidate capability, classified. `WRITE` = a control the Super Admin operates. `READ` = visibility only. `NONE` = no surface supported.

### B.1 CONFIRMED — designed in Batch 05

| # | Capability | Basis | Classification | Surface |
|---|---|---|---|---|
| **C-01** | **Controlled cross-tenant governance access** — view data across institutions, strictly for governance and operational oversight, presented **within an institutional context and never aggregated** | FRD **1.3.5** · **PM-13** · AC-04 · §6.7.4 | **FRD-CONFIRMED** + **PM-CONFIRMED** | `READ` — SA-02, SA-03 |
| **C-02** | **Controlled update releases** — control when a new module version reaches production; **holding a release is an available and visible outcome** | FRD **2.3.2** · FLOW 10 step 1 | **FRD-CONFIRMED** ⚠ see D-01 | `WRITE` — SA-04, SA-05 |
| **C-03** | **Device-replacement / licence-transfer approval** — approve a B2C learner's request; the licence rebinds and the learner can see that it has | FRD **2.4.2** · FLOW 8 step 3 · AC-28 · §6.7.1 | **FRD-CONFIRMED** | `WRITE` — SA-06, SA-07 |
| **C-04** | **Cross-tenant operational status** — institution status and what awaits platform action. Bounded by `PM-11` to operational status; **no analytics, no KPI dashboard, no metric, no aggregate** | FRD **8.1.1** bounded by **PM-11**, **1.3.4**, §6.7.3 | **FRD-CONFIRMED (bounded)** | `READ` — SA-01 |
| **C-05** | **Licence visibility** — institutional and individual licences shown **as existing**, with their stream mapping and student-count cap | FRD **8.1.1**, **6.2.1**, **6.2.2** · FLOW 2 step 1 | **SOURCE-SUPPORTED** (visibility) / **OPEN** (transaction) | `READ` — SA-08 |
| **C-06** | **Platform-plane role holders** — who currently holds each central-plane role | FRD **8.1.1** · §6.7.2 line 5 (authority) | **FRD-CONFIRMED authority / OPEN mechanism** (`QD-02`) | `READ` — SA-09 |
| **C-07** | **Sole plane-spanning role** — Super Admin is the only role with any concept of crossing between institutions | **PM-13** · V5-ADD-004 · FRD 1.3.5 | **PM-CONFIRMED** | Structural (shell) |
| **C-08** | **Review-history visibility** — the ordered decision record of the content governance chain is traceable | **PM-14** · V5-ADD-007 | **PM-CONFIRMED** (read-only) | Not surfaced in Batch 05 — see E-05 |

### B.2 PM-OVERRIDDEN — removed, recorded, not reconciled

| # | Capability | Source that still asserts it | Overriding decision |
|---|---|---|---|
| **O-01** | **Publish approved modules to production — exclusive authority** | FRD **1.4.4**; §6.7 Purpose; §6.7.1 line 1; §6.7.2 line 1; §6.7.4 criterion 1; FRD 8.1.1 statement + acceptance criterion; FRD 8.1.2 acceptance criterion; Core FRD §2.1, Table 10, Table 11, Table 12; Detailed FRD §5.6 boundary 1, Table 30, Table 77, FLOW 1 step 4, AC-09, AC-12, §15.3; Appendix A rows 1.4.4 / 1.4.5 / 8.1.1 / 8.1.2; Review-006 role matrix cell `D4` (`Pb`) | **`PM-16` · `PM-17` · `PM-18`** (25 Aug 2026) — the **Content Manager** is the publication owner and performs the final Publish action; Super Admin is not part of the confirmed publication flow |
| **O-02** | **Publication-queue visibility** (the "absent from that queue" acceptance criterion) | §6.7.4 criterion 1 | Falls with O-01 — there is no Super Admin publication queue to be absent from |
| **O-03** | **Module metadata management** (`C2` in the Review-006 matrix) | matrix cell only | **Refuted.** FRD 8.1.2 and 1.4.3 assign metadata to the Content Manager by name; Super Admin appears in neither statement nor Roles column |
| **O-04** | **Module builds and assets — view + manage** (`C3`) | matrix cell only | **Refuted.** FRD 1.4.1 names Vendor and Content Manager; 1.1.4 is an ownership *prohibition* with a negative implication only |

**This is a deviation, recorded — not applied to the sources.** FRD 1.4.4 still says what it says. `requirements/`, `source/`, the Review-006 matrix and the 18 August baseline are **unedited**. FRD **1.4.5** (*"Third-party vendors shall not have direct publishing rights"*) is **unaffected**.

> **`O-01` restated in ≥ 20 distinct places across the source set.** Any design deliverable that inherits any one of them silently reintroduces Super Admin publishing. Batch 05's requirement-safety audit (`qa/ACCESSIBILITY_AND_UX_QA.md` §RS) exists to catch exactly that.

### B.3 OPEN / PENDING — named, not designed

| # | Question | Register ID | Status | Batch-05 treatment |
|---|---|---|---|---|
| **P-01** | May Super Admin **return** a submission at the publication gate? | **`QP-26`** | **OPEN** — "PM-14 names only Academic Reviewer and Content Manager. **Not invented**" | **No return, request-changes, reject or reopen control exists anywhere in Batch 05.** Not resolved here |
| **P-02** | How is an institutional licence **transacted** in Phase 1? | `QP-04` (HIGH) · `OQ-01`–`OQ-03` · §6.7.5 | **OPEN** — institutional billing (9.3.1, 9.3.2) is Phase 2 | SA-08 shows licences **as existing**, with a marked gap. No purchase, seat, price, renewal or invoice control |
| **P-03** | What is the Phase-1 **origin of role assignment**? | **`QD-02`** (HIGH) | **OPEN** — "Super Admin assigns platform roles under 8.1.1; how a person becomes Faculty or Institute Admin within a tenant in Phase 1 is recorded as an open question" | SA-09 is **read-only**. No create, assign, revoke or deactivate control. Tenant-internal roles are **deliberately absent** |
| **P-04** | Who **creates an institution / tenant**, and who assigns its first Institute Admin? | derived from FRD **4.2.1** | **OPEN** — 4.2.1's subject is *"Institutions shall register their organization"* (self-registration); its acceptance criterion names no role; **the first Institute Admin's origin is stated nowhere**, and `QD-02` leaves tenant role assignment undefined | **No onboarding wizard, no create-institution action, no first-admin assignment.** SA-02 shows institutions that already exist |
| **P-05** | Is there an **audit trail outside content governance**? | **`GP-4`** · §6.7.5 | **OPEN — recorded FRD GAP.** "Audit trails for licensing changes, entitlement grants, platform configuration and device-replacement approvals are not defined by any requirement and are not invented here" | **No platform audit-log screen exists in Batch 05.** The gap is stated on the surfaces where a reviewer would look for it |
| **P-06** | Which **platform settings** does Super Admin configure? | derived from FRD **8.1.1** | **AUTHORITY CONFIRMED · CONTENT OPEN** — no source names a single Phase-1 platform-wide setting | SA-10 is a **configuration register**: every candidate area listed with its actual source status. **Zero invented controls** |
| **P-07** | Does the **Content Manager** hold any version-release authority, or is that Super Admin's alone? | §6.6.5 | **OPEN** — and now decision-critical, because `PM-16`/`17`/`18` moved publication to the Content Manager | See **D-01**. Batch 05 designs release control as Super Admin's under 2.3.2 and flags the question |
| **P-08** | Who **provisions Vendor and Academic Reviewer accounts**? | new, from this audit | **OPEN** — no source assigns it. FRD 1.4.1's *"Authorized vendors"* never names an authoriser | **No vendor or reviewer registry screen.** Named as an open question on SA-09 |
| **P-09** | May Super Admin **see assessment answer keys**? | §6.7.5 | **OPEN** | **No assessment surface of any kind** in Batch 05 |
| **P-10** | What does *"manage"* in FRD 1.3.5 actually authorise? | new, from this audit | **OPEN** | See **D-02**. Batch 05 designs the cross-tenant surface **read-only** |
| **P-11** | Which **XR delivery mechanism**? | `QT-01` (HIGH) | **OPEN by explicit PM instruction** (`PM-05` declined to select) | Release control is written **mechanism-neutral**: no transport, endpoint, package format or protocol is named |

### B.4 OUT OF PHASE 1 — excluded

| # | Capability | Source | Why excluded |
|---|---|---|---|
| **X-01** | Bundle creation | FRD **6.3.1** | **Phase 2.** Explicitly prohibited by §6.7.3 |
| **X-02** | Pricing configuration | FRD **6.3.2** | **Phase 2.** Explicitly prohibited by §6.7.3 |
| **X-03** | Custom role creation / permission-level access control | FRD **8.3.1**, **8.3.2** | **Phase 3.** Explicitly prohibited by §6.7.3 |
| **X-04** | Cross-tenant analytics dashboards / detailed metrics | FRD **8.2.2**, **11.3.x** | **Phase 2**, and deferred by **`PM-11`**. Explicitly prohibited by §6.7.3 |
| **X-05** | Institutional billing / invoicing / subscription | FRD **9.3.1**, **9.3.2** | **Phase 2** |
| **X-06** | Module lifecycle states (draft / live / retired) | FRD **1.5.1** | **Phase 2** — which is why release control carries no lifecycle chrome |
| **X-07** | Device registration · remote device management | FRD **2.5.x**, **2.6.x** | **Phase 2** — "must not appear in a Phase-1 administrative workspace" (FLOW 8 recorded gap, verbatim) |
| **X-08** | Certification eligibility reporting | FRD **3.5.2** | Assigned to **Faculty / Institute Admin**, not Super Admin |

### B.5 REFUTED — sounds like Super Admin, is not

Each of these survived none of the adversarial verification. Every one was checked against the requirement statement **and** the Roles column.

| # | Candidate | Why it fails |
|---|---|---|
| **R-01** | Institution creation / onboarding wizard / tenant provisioning | FRD **4.2.1** is decisive against it. Verbatim: *"Institutional Account Creation. **Institutions shall register their organization** through the platform's institutional onboarding interface."* **The grammatical subject is the institution, not the Super Admin** — this is self-registration. Its acceptance criterion names no role at all (*"An institution can be registered and a tenant created, after which institutional configuration becomes available"*), and FLOW 6 step 1 attributes onboarding **jointly** to Institute Admin *and* Super Admin. Nothing here supports a Super-Admin-operated onboarding flow |
| **R-02** | Assign an institution's first Institute Admin | No source states it. `QD-02` explicitly leaves the tenant-internal role-assignment origin undefined |
| **R-03** | Vendor account administration (`SA-07` in the Review-006 inventory) | FRD 1.4.1's adjective *"Authorized"* names no authoriser; its Roles column excludes Super Admin. FRD 1.4.5 lists Super Admin but is a **prohibition addressed at Vendors**, with no verb for Super Admin |
| **R-04** | Academic Reviewer account administration (`SA-08` in the inventory) | FRD 1.4.2 is about module validation, not account administration, and its Roles column excludes Super Admin |
| **R-05** | Grant / revoke a learner entitlement | FRD 8.1.3 names **Institute Admin** as subject and sole Roles entry. `OQ-04` (entitlement assignment) is open |
| **R-06** | Assign courses or modules to learners / cohorts | FRD 8.1.4 is the **Faculty** role definition; 7.2.3 is ERP-driven and automatic |
| **R-07** | Assessment configuration — or even a read-only assessment view | **Zero** Super Admin occurrences across the whole of §5 (all eleven assessment requirements). `PM-15` omits Super Admin entirely. Answer-key visibility is open (§6.7.5) |
| **R-08** | Institution SSO configuration | FRD 4.2.2's acceptance criterion assigns it explicitly to **Institute Admin** — designed in Batch 03 |
| **R-09** | Institution ERP configuration | FRD 7.1.1 / 7.1.2 acceptance criteria assign configuration and visibility to **Institute Admin** — designed in Batch 03 |
| **R-10** | Seat-utilisation monitoring · student cap · capacity limit | **`OQ-03` is OPEN** — whether institutional access is bounded by a learner or seat cap at all, and by what model, is unresolved. FRD 6.2.2 is a **draft** line, not a settled rule; the Super Admin equivalent, 8.2.2, is **Phase 2** regardless. **No cap, seat or capacity figure appears anywhere in Batch 05** |
| **R-11** | Session / password / MFA / lockout policy | No requirement defines any of it. Recorded as an open question, not designed |
| **R-12** | Impersonation · tenant deletion · user deletion · platform shutdown · integration credentials | **No source of any kind.** Not designed, not stubbed, not mentioned as a product action |
| **R-12b** | B2C licence activation as an administrative action | FRD **9.2.1** lists Super Admin in its Roles column, but its statement and analyst note remove any human step: *"Upon successful payment, licenses shall be **automatically** activated and linked to the user account"* · *"Activation is automatic; no manual step is required of the learner."* There is no Super Admin action to design |
| **R-13** | Refunds · transaction adjustment · promo management · subscription administration | `QP-18` records: "None stated or implied. **No rule is invented.**" Phase-2 commerce |
| **R-14** | Unpublish · suspend · withdraw published content | No source. Would additionally contradict `PM-16`/`17`/`18` by giving Super Admin content authority through a side door |

### B.6 SUPERSEDED — historical records, left unedited

| Artefact | What it records | Standing |
|---|---|---|
| Review-006 `02_ROLE_PERMISSION_MATRIX.md` cell `D4` (`Pb`, Super-Admin-only publish) | The pre-25-August model | **Historical.** Not edited. Superseded on the publication point only |
| `PM_CONFIRMED_BASELINE_2026-08-18.md` publication statements | The pre-25-August model | **Historical.** Not edited |
| `10_FULL_PLATFORM_SCREEN_INVENTORY.md` rows `SA-02`, `SA-03` (Ready to publish · Publish module) | Two screens built in Batch 01 and then withdrawn | **Withdrawn.** Batch 05 does not revive them under any name |
| `10_FULL_PLATFORM_SCREEN_INVENTORY.md` row `SA-04` (Published modules) | Reassigned to the Content Manager as `CM-03` in Batch 01 | **Reassigned.** Batch 05 does **not** build a second copy |
| `10_FULL_PLATFORM_SCREEN_INVENTORY.md` rows `SA-07`, `SA-08` (Vendors · Academic reviewers) | Registry screens | **Refuted** by this audit — see R-03, R-04 |
| Table 41 navigation item **"Publishing"** | The pre-25-August navigation | **Struck.** Batch 05's navigation derives from the surviving capabilities instead |

---

## Part C — What survives

Stated as plainly as it can be:

> **Super Admin holds exactly two clean write actions in Phase 1** — release or hold a module version (FRD 2.3.2), and approve a device-replacement licence transfer (FRD 2.4.2) — **plus one bounded read capability**: cross-institution governance and operational oversight (FRD 1.3.5), presented one institution at a time and never aggregated.
>
> Everything else the role is said to "own" is either PM-overridden, Phase 2/3, assigned to another role, or an open question.

That is a **small** role. It is deliberately small, and the audit did not make it smaller than the sources require — it made it exactly as large as they support.

### The two-plane picture, after the audit

```
                     ┌──────────────────────────────────────────────┐
   CENTRAL CONTENT   │  Vendor → Academic Reviewer → Content Manager │
   & GOVERNANCE      │                              └── PUBLISHES    │  PM-16/17/18
   PLANE             └──────────────────────────────────────────────┘
                                        │
                                        │ 2.3.2 — version release / hold
                                        ▼
   ┌───────────────────────────────────────────────────────────────────┐
   │  SUPER ADMIN — the only role that spans planes  (1.3.5 · PM-13)   │
   │                                                                   │
   │   releases versions   approves device      sees institutions      │
   │   to production       replacements         one at a time          │
   │   (2.3.2)             (2.4.2, B2C)         (1.3.5, read-only)     │
   └───────────────────────────────────────────────────────────────────┘
        │                        │                       │
        ▼                        ▼                       ▼
   production            personal / B2C          TENANT PLANES
   environments          context                 Institute Admin · Faculty · Learner
                                                 (Super Admin does NOT act here)
```

---

## Part D — Judgement calls

Two source interpretations were genuinely open. Both were resolved by choosing **the least-assumptive reversible design**, and both are flagged for PM review.

**Both are classified `OPEN PM CLARIFICATION`.** Neither is resolved by this batch, neither is recorded as settled anywhere in the package, and both are surfaced in the product artefact itself — `D-01` on `SA-04` and `SA-05`, `D-02` on `SA-02` — so that a reviewer meets the question on the screen rather than only in a document.

| | Question | Classification | Design taken meanwhile | Reversibility |
|---|---|---|---|---|
| **`D-01`** | After Content Manager publishes content, does Super Admin still retain the separate Phase-1 version release/hold authority from FRD 2.3.2? | **OPEN PM CLARIFICATION** | 2.3.2 kept, **isolated** to `SA-04` / `SA-05`, vocabulary firewalled to *release version* / *hold version* | **High** — withdraws as a pair |
| **`D-02`** | Which specific cross-tenant **write** actions does 1.3.5's *"manage"* authorise? | **OPEN PM CLARIFICATION** | Cross-tenant visibility only. **No** cross-tenant write control of any kind | **High** — a write drops into the existing layout |

### D-01 · Does version release control (FRD 2.3.2) survive `PM-18`?

> **Classification: `OPEN PM CLARIFICATION`.** Not resolved by this batch.
>
> **PM question, as it should be put:**
> *"After Content Manager publishes content, does Super Admin still retain the separate Phase-1 version release/hold authority from FRD 2.3.2?"*

**The tension.** `PM-18` removed Super Admin from "the confirmed Batch-01 publication flow." FRD **2.3.2** is a **separate Phase-1 requirement**, separately worded, `UNCHANGED-FRD`, that names Super Admin and governs when *new versions* of already-published modules reach *production environments*. It has its own flow (**FLOW 10**), distinct from the publication flow (**FLOW 1**). The Detailed FRD anticipated the ambiguity itself, at **§6.6.5**: *"Whether the Content Manager holds any version-release authority, or whether that is Super Admin's alone."*

**Reading A** — `PM-18` is scoped to the content-publication *chain* (FLOW 1 / FRD 1.4.4). FRD 2.3.2 / FLOW 10 is untouched and Super Admin keeps release control.
**Reading B** — `PM-18`'s intent is that Super Admin holds nothing that gates content reaching learners, so release control moves too.

**Chosen: Reading A.** Reasons: 2.3.2 is a distinct requirement with a distinct ID, flow and capability tagging (`GOV`, `CFG` — not the governance-chain tagging); `PM-18` names the *publication flow* specifically and its own scope note says it "does **not** define any new Super Admin workspace, screen or responsibility" — it removes one, it does not sweep a second; and Reading B would require inferring a removal the PM did not state, which the FRD's own least-privilege rule forbids in both directions.

**How the risk is contained in the design.** The vocabulary is kept rigorously separate from publication:

| Batch 05 uses | Batch 05 never uses, for Super Admin |
|---|---|
| **Release version** · **Hold version** *(the two controls)* | Publish · Publishing · Published · Ready to publish · Publication gate · Approve · Return · Request changes |
| Held · Released · Awaiting release decision · Version | Release to production · Production release · Hold release *(retired — see below)* |

**The controls are named for what they act on — the version.** *"Release to production"*, *"Production release"* and *"Hold release"* were the wording of the first pass and are **retired from every control, dialog title, confirmation label and page head**. An action named for a *destination* reads as a second shipping gate, and the shipping gate is **publication** — which has already happened, and is the Content Manager's. The word *production* survives only where it explains the **consequence**, in FRD 2.3.2's own words (*"released to production environments"*), and never as the name of an action.

**Publication is stated on the screen as already complete.** A version reaches SA-04 **only after the Content Manager has already published the module** — the release decision is downstream of publication, never a gate in front of it. `SA-04` says so in its lead alert; `SA-05` says so in a boundary note carrying the module's own publication date. **There is no second publication gate, and neither screen may become one.**

**Reversibility.** **High**, and deliberately kept so. Release state is read and written by `SA-04` and `SA-05` alone; no other screen in Batch 05 depends on it. If the PM rules for Reading B, the two screens are withdrawn as a pair — exactly as Batch 01's two publish screens were — leaving no orphaned surface, and the release decision moves to the Content Manager's existing surface.

> **PM question — `D-01`, OPEN PM CLARIFICATION:**
> *"After Content Manager publishes content, does Super Admin still retain the separate Phase-1 version release/hold authority from FRD 2.3.2?"*
>
> `§6.6.5` records this as open and it is now decision-critical.

### D-02 · What does *"manage"* mean in FRD 1.3.5?

> **Classification: `OPEN PM CLARIFICATION`.** Not resolved by this batch.
>
> **Current position:** cross-tenant **visibility** is source-supported. Specific cross-tenant **write** actions are **OPEN / PENDING**.

**The tension.** FRD 1.3.5 grants Super Admin "controlled access to **view and manage** data across tenants **strictly for governance and operational oversight**." The word *manage* implies a write. **No source names a single cross-tenant write action.** The Review-006 matrix records `V M`ˣ, but its own note concedes the `M` is *"derived from 1.3.5"* rather than from any requirement of its own.

**Chosen: read-only.** Batch 05 designs no cross-tenant write control at all. The brief's own rule is applied literally: *"Any write action requires explicit source authority. If only visibility is confirmed: make it read-only."*

**Specifically absent from every institution surface**, and verified mechanically by the requirement-safety audit:

| Absent | Absent | Absent |
|---|---|---|
| Edit institution | Deactivate institution | Suspend institution |
| Delete tenant | Modify institution SSO | Modify institution ERP |
| Assign learner content | Assign institutional licences | Edit institution users |

**Reversibility.** **High.** The institution surfaces are built so that a governance write, once defined, drops into the existing detail layout without restructuring.

> **PM question — `D-02`, OPEN PM CLARIFICATION:**
> *"Which specific cross-tenant write actions does FRD 1.3.5's 'view and manage' authorise?"*
>
> Until one is named, Super Admin can see every institution and change none.

---

## Part E — Consequences recorded, not designed around

| # | Consequence | Recorded where | Batch-05 handling |
|---|---|---|---|
| **E-01** | **Separation of duties.** FLOW 1's own constraint reads, verbatim: *"Three approvals, three roles, one publisher. No role holds two adjacent gates."* `PM-16`/`17`/`18` give the Content Manager both gate 3 (content readiness, 1.4.3) and publication — two adjacent gates | Detailed FRD Table 78 | **Not Batch 05's to resolve** (it concerns Batch 01). Recorded and escalated. Batch 05 does **not** offer Super Admin as the fix — that would reinstate `O-01` through the back door |
| **E-02** | **No rejection path for device replacement.** FRD 2.4.2's row records, verbatim: *"The FRD describes no rejection path, no evidence requirement and no limit on replacement frequency — all PENDING DECISION"* | Detailed FRD 2.4.2 · FLOW 8 | SA-07 offers **Approve only**. The absent decline path is shown as a **marked gap on the screen**, not as a disabled button and not as an invented flow |
| **E-03** | **No audit trail outside content governance** (`GP-4`) | Detailed FRD §5.5, §19.3 | No audit screen. Each write surface states plainly that no requirement defines a record of it |
| **E-04** | **No mid-course change notification.** Phase 1 has no module lifecycle states (1.5.1 is Phase 2) and no notification requirement | FLOW 10 recorded gap | Release control shows the consequence — *"the platform can present an update-available state, but it cannot inform a learner who is not looking"* — rather than inventing a notification |
| **E-05** | **Review-history visibility** (`PM-14`) is confirmed for Super Admin in principle, but with Super Admin out of the publication flow there is **no confirmed Batch-05 surface on which a submission is shown to it** | `PM-14` · V5-ADD-007 | **Not surfaced.** Recorded as available-if-a-purpose-appears. Building it now would be a content-governance surface for a role with no content-governance role |
| **E-06** | **AC-04 is a hard constraint, not a preference:** *"tenant-scoped data remains presented within its institutional context rather than aggregated across institutions"* | §6.7.4 · AC-04 · §17.2 Table 114 | Enforced structurally: the Super Admin shell carries a persistent institution-scope indicator, every institutional figure lives inside one institution's page, and **no cross-institution total, roll-up, league table or comparison exists anywhere in Batch 05** |

---

## Part F — The answer to the batch question

> *"What platform-wide responsibilities does the approved Super Admin role actually perform in Phase 1, and how can those responsibilities be managed across institutions without duplicating Institute Admin, Content Manager or Faculty workspaces?"*

**What it performs.** Two decisions and one lookout:

1. **Release or hold a module version** reaching production (2.3.2).
2. **Approve a device-replacement licence transfer** for an individual learner (2.4.2).
3. **Watch the platform across institutions** — status only, one institution at a time (1.3.5, 8.1.1 bounded by PM-11).

**How, without duplication.** By inverting the relationship rather than repeating it. The tenant roles *operate* their institution; Super Admin only ever *observes* one. Concretely:

| Institute Admin (Batch 03) **operates** | Super Admin (Batch 05) **observes** |
|---|---|
| Configures SSO (`INA-10`) | Sees **that** institutional sign-in is configured — not how, and cannot change it |
| Configures ERP / institution data (`INA-11`) | Sees **that** the last synchronisation succeeded or failed — cannot configure or run it |
| Maps streams to licensed packages (`INA-08`) | Sees **that** a licence exists with a cap — cannot map, price or transact it |
| Manages people (`INA-02`, `INA-03`) | Sees **no** institutional person at all |
| Whatever reporting it has on its own use of that content | Sees **nothing** — 8.2.2 is Phase 2, and whether a seat or learner cap exists at all is `OQ-03`, **OPEN** |

| Content Manager (Batch 01) **owns** | Super Admin (Batch 05) **does not touch** |
|---|---|
| Content readiness review · **Publish** (`CM-02`) | No queue, no publish, no return, no approve, no metadata |
| Published content (`CM-03`) | No second copy of it — release control shows **versions awaiting a decision**, not a content catalogue |

The duplication test applied throughout: **if a screen would answer a question the tenant role already answers better inside its own institution, Super Admin does not get that screen.**

---

## Appendix — the 50 requirement IDs listing Super Admin

For traceability. Listing in the Roles column is **not** a grant; only the six statements in §A.2 name Super Admin in the requirement itself.

`1.1.2` `1.1.3` `1.1.4` `1.2.2` `1.2.3` `1.3.1` `1.3.2` `1.3.4` **`1.3.5`** **`1.4.4`** `1.4.5` `1.5.1` `1.6.1` `1.6.2` `2.1.1` `2.2.2` **`2.3.2`** `2.4.1` **`2.4.2`** `2.6.1` `2.6.2` `2.7.1` `2.7.2` `4.2.1` `4.2.2` `6.1.1` `6.1.2` `6.2.1` `6.2.2` **`6.3.1`** `6.3.2` `6.4.1` `6.4.2` `6.5.2` `7.1.1` `7.1.2` `7.4.2` **`8.1.1`** `8.1.2` `8.2.2` `8.3.1` `8.3.2` `9.2.1` `9.3.1` `9.3.2` `9.4.1` `10.4.1` `10.4.2` `11.4.1` `11.4.2`

`1.1.1`'s Roles column reads "All seven" and therefore includes Super Admin without naming it.

**Bold** = the six statements that name Super Admin in their own text. Of those, four are Phase 1 and action-assigning: `1.3.5`, `1.4.4` (**PM-overridden**), `2.3.2`, `2.4.2` — plus `8.1.1` as the umbrella grant and `6.3.1` as Phase 2.
