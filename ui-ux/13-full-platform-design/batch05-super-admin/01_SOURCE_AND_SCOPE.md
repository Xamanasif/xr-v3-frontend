# 01 — Source and Scope

| | |
|---|---|
| **Document ID** | `BATCH05_SOURCE_AND_SCOPE` |
| **Batch** | 05 — Super Admin + platform-wide administration |
| **Date** | 27 August 2026 |
| **Branch** | `uiux/full-platform-design` |
| **Status** | Design deliverable. **Not** a requirement document, **not** a PM decision, **not** an FRD amendment |
| **Depends on** | [`02_SUPER_ADMIN_AUTHORITY_AUDIT.md`](02_SUPER_ADMIN_AUTHORITY_AUDIT.md) — **read that first.** This batch's scope is a consequence of it |

---

## 1 · What this batch is

The Super Admin workspace. Ten screens covering the platform-wide responsibilities the approved Super Admin role **actually holds in Phase 1**, established by source audit before any screen was drawn.

This is functional, high-fidelity UI/UX design. **The final visual redesign has not been performed.** The design language continues Batches 01–04 unchanged.

## 2 · Why the audit came first

The 25 August PM update (`PM-16` · `PM-17` · `PM-18`) moved publication to the Content Manager and **deferred the Super Admin workspace** "until supported by confirmed requirements or PM decisions in a later platform batch." Batch 05 is that batch, and it could not begin by assuming what the old Batch-01 prototype contained — two Super Admin publication screens, both since withdrawn.

So the batch began with a complete sweep of every authoritative source, followed by an adversarial pass in which each candidate capability had to survive an attempt to refute it. The result is [`02_SUPER_ADMIN_AUTHORITY_AUDIT.md`](02_SUPER_ADMIN_AUTHORITY_AUDIT.md), and the scope below is what that audit left standing.

## 3 · The finding, in one paragraph

**Super Admin holds exactly two clean write actions in Phase 1** — release or hold a module version (FRD 2.3.2), and approve a device-replacement licence transfer (FRD 2.4.2) — **plus one bounded read capability**: cross-institution governance and operational oversight (FRD 1.3.5), presented one institution at a time and never aggregated. Everything else the role is commonly assumed to own turned out to be PM-overridden, Phase 2/3, another role's, or an open question.

That is a small role. **The scope below is exactly as large as the sources support, and no larger.**

## 4 · Sources

**Authoritative, in precedence order.**

| Rank | Source | Bearing on this batch |
|---|---|---|
| 1 | `ui-ux/00-project-context/PM_CONFIRMED_UPDATE_2026-08-25.md` (`PM-16`–`PM-18`) | Removes publication from the role; defers the workspace to this batch |
| 2 | `ui-ux/12-full-platform-reframe/13_PM_CLOSURE_DECISIONS.md` (`PM-13`–`PM-15`) | `PM-13` establishes the platform / tenant split and preserves cross-tenant governance for Super Admin alone |
| 3 | `ui-ux/00-project-context/PM_CONFIRMED_BASELINE_2026-08-18.md` (`PM-01`–`PM-12`) | Scope, the seven roles, `PM-11`'s deferral of detailed metrics |
| 4 | `requirements/updated-frd/Core frd.pdf` · `TL frd.pdf` · `Detailed frd.pdf` (v5.0) | The requirement set. §6.7 / Table 41 is the only complete Super Admin role definition anywhere |
| 5 | `requirements/updated-frd/Platform_FRD_v5_OPEN_QUESTIONS.md` | `QP-`/`QT-`/`QD-`/`GP-` registers |
| 6 | `ui-ux/12-full-platform-reframe/01`–`12` | Review-006 inventory, matrix, IA, workflows, screen inventory |

**Read for boundary and house style, never modified:** `ui-ux/13-full-platform-design/` Batches 01, 02, 03, 04.

**PDF / DOCX equivalence.** The PDFs are authoritative and were the artefacts read. Text was extracted from each and independently cross-checked against the DOCX companions: token overlap **98.8 % / 99.0 % / 99.3 %** (the residual is repeated PDF page furniture), with matching `Super Admin` occurrence counts. Same v5 documents.

**Draft status.** Every page of the v5 set is stamped **"DRAFT FOR REVIEW — NOT YET APPROVED."** `source/Platform FRD_v4.pdf` remains the issued baseline and is unchanged.

## 5 · In scope

| # | Capability | Basis | Surface |
|---|---|---|---|
| 1 | **Cross-institution operational oversight** — what needs a platform decision, and each institution's own state | FRD 1.3.5 · 8.1.1 bounded by `PM-11` | SA-01 |
| 2 | **Institutions, read-only** — a cross-tenant list and a per-institution detail, presented inside an institutional context and never aggregated | FRD 1.3.5 · `PM-13` · AC-04 · §6.7.4 | SA-02 · SA-03 |
| 3 | **Module version release control** — release a new version to production, or hold it | FRD **2.3.2** · FLOW 10 step 1 | SA-04 · SA-05 |
| 4 | **Device-replacement approval** — approve an individual learner's licence transfer | FRD **2.4.2** · FLOW 8 step 3 · AC-28 | SA-06 · SA-07 |
| 5 | **Licence visibility** — institutional access records shown as existing: that a record exists, which academic streams it covers, and its state. **No cap, seat or capacity figure** (`OQ-03` OPEN) | FRD 8.1.1 · 6.2.1 | SA-08 |
| 6 | **Platform-plane role holders, read-only** | FRD 8.1.1 authority · `QD-02` open mechanism | SA-09 |
| 7 | **Platform configuration register** — what is configurable, and what is not yet defined | FRD 8.1.1 | SA-10 |

## 6 · Out of scope — and why

Each of these was considered and excluded on evidence, not on preference. Full reasoning in the audit, Part B.

| Excluded | Reason |
|---|---|
| **Publishing content** · publication queue · approve · unpublish · withdraw | **`PM-16` · `PM-17` · `PM-18`** — the Content Manager publishes. FRD 1.4.4 still says otherwise; that is a recorded deviation, not reconciled here |
| **Returning a submission at the publication gate** | **`QP-26` OPEN** — `PM-14` names only Academic Reviewer and Content Manager. Not invented |
| **Creating an institution · onboarding wizard · assigning the first Institute Admin** | FRD 4.2.1 reads *"Institutions shall register their organization"* — self-registration, and no administrator is named. `QD-02` leaves the first admin undefined |
| **Assigning, revoking, inviting or deactivating any user** | Authority confirmed (8.1.1); **mechanism is `QD-02`, an open HIGH question** |
| **Vendor and Academic Reviewer account registries** | **Refuted.** No source assigns their administration to anyone |
| **Any cross-tenant write** — suspend, activate, edit an institution | FRD 1.3.5 says *"view and manage"* but **names no management action**. Read-only until one is defined |
| **SSO or ERP configuration** | FRD 4.2.2 / 7.1.x assign both to the **Institute Admin** — designed in Batch 03 |
| **Seat utilisation · student cap · capacity limit** | **`OQ-03` is OPEN** — whether institutional access is bounded by a learner or seat cap at all, and by what model, is unresolved. FRD 6.2.2 is a *draft* line and is not a settled product rule; the Super Admin equivalent (8.2.2) is **Phase 2**. **No cap, seat or capacity figure appears anywhere in Batch 05** |
| **Entitlement grant / revoke · course assignment** | Refuted — Institute Admin (8.1.3) and Faculty (8.1.4) |
| **Any assessment surface, including read-only** | **Zero** Super Admin occurrences across all eleven assessment requirements. Answer-key visibility is open (§6.7.5) |
| **Analytics, dashboards, metrics, cross-institution totals** | **Phase 2** (8.2.2, 11.3.x), deferred by `PM-11`, prohibited by §6.7.3, and bounded by 1.3.4 / AC-04 |
| **Audit log outside content governance** | **`GP-4` — recorded FRD gap.** "not defined by any requirement and are not invented here" |
| **Bundles · pricing** | **Phase 2** (6.3.1, 6.3.2), prohibited by §6.7.3 |
| **Custom roles · permission editing** | **Phase 3** (8.3.x), prohibited by §6.7.3 |
| **Billing · invoices · subscriptions · renewals · refunds · seats · prices** | Phase 2 (9.3.x); `QP-18` records "None stated or implied. No rule is invented" |
| **B2C commerce administration** | FRD 9.2.1 makes activation automatic — no human step exists to design |
| **Device registration · remote device management** | **Phase 2** (2.5.x, 2.6.x) — "must not appear in a Phase-1 administrative workspace" |
| **Impersonation · tenant deletion · user deletion · security policy · integration credentials · platform shutdown** | **No source of any kind** |

## 7 · Boundaries against the other batches

Batch 05 complements the completed batches; it absorbs none of them.

| Batch | Owns | Batch 05 does |
|---|---|---|
| **01** — Content governance | Vendor → Academic Reviewer → **Content Manager publishes** (`CM-02`), published content (`CM-03`) | Nothing. No content catalogue, no queue, no gate. Release control acts only on versions of modules the Content Manager **has already published** |
| **02** — Faculty assessment | Assessment configuration, question bank, learner attempt and result | Nothing. No assessment surface of any kind |
| **03** — Institute Admin | People, academic structure, content access, institution setup, SSO, institution data (`INA-01`…`INA-13`) | **Observes** an institution's readiness, read-only, one at a time. Configures nothing |
| **04** — Individual learner | Catalogue, access, payment outcome, My Learning (`B2C-01`…`B2C-07`) | Nothing commercial. It meets the individual learner at exactly one point: a device-replacement request (FRD 2.4.2) |

The duplication test applied throughout: **if a screen would answer a question the tenant role already answers better inside its own institution, Super Admin does not get that screen.**

## 8 · Deliverables

```
batch05-super-admin/
├── README.md
├── 01_SOURCE_AND_SCOPE.md          this document
├── 02_SUPER_ADMIN_AUTHORITY_AUDIT.md   the audit — read first
├── 03_SUPER_ADMIN_UX_MODEL.md      the workspace, and the assumption register
├── 04_PLATFORM_ADMIN_MODEL.md      releases · device approvals · roles · configuration
├── 05_CROSS_TENANT_MODEL.md        the platform / tenant boundary
├── 06_COMPONENT_EXTENSIONS.md      the Batch-05 additions to the component system
├── 07_SCREEN_INVENTORY.md          ten screens, their states and their basis
├── FIGMA_HANDOFF_LATER.md
├── wireframes/batch05-wireframes.html
├── prototype/                      standalone, no backend, Safari file:// verified
└── qa/                             accessibility, responsive, safety, screenshots, seed states
```

## 9 · What was not done, deliberately

- **No commit.** The batch is left uncommitted for PM review.
- **No modification to any earlier batch, requirement, source, branding or review artefact.** Read-only inspection only.
- **No final visual redesign.** Batch 01's design language is continued as-is.
- **No open question resolved.** Eleven are carried forward, listed in [`03_SUPER_ADMIN_UX_MODEL.md`](03_SUPER_ADMIN_UX_MODEL.md) §6.
- **No Batch 06.**
