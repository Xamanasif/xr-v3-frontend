# Project Context — XR Simulation Learning Platform (UI/UX)

**Document status:** Living document
**Created:** 2026-08-10
**Owner:** UI/UX
**Source of truth:** `source/Platform FRD_v4.pdf` (17 pages, 12 sections)
**Last FRD review:** Review 001 — see `ui-ux/11-reviews/UX_REVIEW_LOG.md`

---

## 1. What this product is

The XR Simulation Learning Platform is a **multi-tenant SaaS Learning Management System (LMS)** that distributes **XR-based engineering simulation modules** to learners (FRD 1.1.1).

It is not a generic LMS. Its defining characteristic is that the core learning object is an **XR simulation**, delivered across four distinct runtime targets (FRD 1.2):

| Format | FRD | Runtime target | Reachable from a desktop browser? |
|---|---|---|---|
| Web simulation | 1.2.1 | Standard web browser, no XR hardware | **Yes** |
| VR simulation | 1.2.2 | VR headsets (e.g. Meta Quest) | No — runs in a separate master VR app (FRD 2.1.1) |
| MR simulation | 1.2.3 | MR hardware (e.g. Ajna Lens) | No — sideloaded device app (FRD 2.1.2) |
| AR simulation | 1.2.4 | Android / iOS mobile devices | No |

This distinction drives the entire Phase-1 Student design: **the desktop LMS can only *run* web simulations.** For VR/MR/AR modules the LMS is an entitlement, information, and progress surface — not a launch surface.

All XR content remains owned and governed by the platform owner and cannot be modified or redistributed by institutions (FRD 1.1.4). Content reaches production only through a vendor → BITS Pilani academic validation → Content Manager → Super Admin publishing chain (FRD 1.4.1–1.4.5).

### Content hierarchy (FRD 3.1–3.3)

```
Certification Program   (3.3.1)  one or more courses
  └── Course            (3.2.1)  collection of modules on an engineering topic
        └── Module      (3.1.1)  smallest learning unit = ONE XR simulation
              ├── Theoretical explanations   (3.1.2, optional)
              ├── Simulation instructions    (3.1.2, optional)
              └── Assessment                 (3.1.2, optional)
```

Note the word **"may"** in FRD 3.1.2 — supporting learning material and assessments are *optional* per module. Every screen that renders a module must therefore tolerate their absence.

---

## 2. Who the overall platform serves

The FRD defines two commercial environments and five roles.

### Commercial environments

| Environment | FRD | Description |
|---|---|---|
| **B2B / Institutional** | 1.1.2 | Organizations purchase licenses; students and faculty access under a shared institutional subscription. Students are auto-provisioned from institutional ERP (7.2.2) and entitled by academic stream (7.2.3). |
| **B2C / Individual** | 1.1.3 | Individual learners independently purchase modules or packages and access simulations through personal accounts (6.1.1, 6.1.2). |

Data for the two is deliberately isolated: tenant-wise isolation for institutions (1.3.1) and a separate database environment for B2C (1.3.2).

### Roles (FRD 8.1)

| Role | FRD | Scope |
|---|---|---|
| Super Admin | 8.1.1 | Platform configuration, module publishing, licensing, cross-tenant analytics |
| Content Manager | 8.1.2 | Module uploads, metadata, content readiness |
| Institute Admin | 8.1.3 | Institutional configuration, course structures, student access, reporting |
| Faculty | 8.1.4 | Course assignments, assessments, student performance monitoring |
| **Student** | **8.1.5** | **Access licensed modules, complete simulations, view personal learning progress** |

FRD 8.1.5 is the single most important sentence for this assignment. It defines exactly three Student capabilities, and every Phase-1 Student navigation decision is traced back to it.

---

## 3. What the current UI/UX assignment includes

Scope confirmed at **Review 002**, 2026-08-10:

- **Phase 1 across all FRD sections** (D-02)
- **Student role** (D-13)
- **LMS web application** (D-14)
- **Desktop / laptop first, ~1440px design width** (D-15)
- **Designed from scratch** (D-16)
- **Both B2B institutional Students and B2C individual learners** (D-01)
- Student learning experience · **B2C purchasing and checkout** (D-04) · assessments (D-06) · learning progress · simulation access (D-09) · Student profile · authentication (D-03) · learning resources (D-05)

### What "Phase 1" means

The FRD does **not** define three global project phases. Each of its 12 sections has its *own* Phase 1 / Phase 2 / Phase 3 subdivision. **D-02 confirms** that Phase 1 means the union of the Phase-1 subsection of **all 12 sections** — 78 requirements. At Review 001 this was assumption A-01; it is now a confirmed decision.

### Current stage

Full UI/UX execution: foundation → wireframes → design system → high-fidelity → prototype spec → accessibility review → coverage audit → developer handoff.

---

## 4. What this assignment explicitly excludes

**Out of interface scope:** Faculty · Institute Admin · Content Manager · Super Admin · Vendor · academic reviewer · native Quest · native Ajna · native Android · native iOS · Phase 2 · Phase 3.

**However**, the desktop LMS must appropriately communicate access to VR/MR/AR simulations (D-09) — licensed XR modules are never hidden.

**Excluded by working rule** (C-04) — not added merely because competitor LMS products have them: AI assistant (FRD 5.5 is Phase 3 anyway) · gamification, badges, leaderboards · social feed, chat · recommendations (FRD 4.5 is Phase 2 anyway) · vanity analytics.

**Excluded by product decision:** persistent cart (FRD describes single-object purchase) · coupon field (FRD 6.4 is Phase 2) · global search (zero FRD mentions) · certification tracking UI (FRD 3.5.1 is Phase 3).

**No longer excluded:** B2C purchasing and checkout — **confirmed in scope by D-04**, reversing the Review-001 position.

**Protected assets, never modified:** `source/Platform FRD_v4.pdf` · `branding/bits-pilani-wilp-logo.png`.

---

## 5. Confirmed decisions

Full detail in `ui-ux/01-requirements/DECISIONS.md`.

| # | Decision |
|---|---|
| **D-01** | Dual audience — B2B **and** B2C, shared core with defined branch points |
| **D-02** | Phase 1 = all Phase-1 requirements across the complete FRD |
| **D-03** | Authentication — email/password **and** institutional SSO; SSO preferred for B2B |
| **D-04** | **B2C purchasing and checkout are in scope**; B2B sees no unnecessary commerce |
| **D-05** | Learning resources — **PDF notes and instructional videos**, download optional |
| **D-06** | Assessment — 10 MCQ · 20-min total timer · +2/−1/0 · pass 10/20 · unlimited attempts · hints reduce a correct answer to +1 · mandatory pre-attempt disclosure |
| **D-07** | **Module completion is gated** — sequential unlock is mandatory |
| **D-08** | Completion = required resources + simulation + assessment **passed** |
| **D-09** | XR modules stay visible on desktop with format badges and device-specific CTAs |
| **D-10** | Primary goal — access learning resources **and continue learning with minimum friction** |
| **D-11** | **WCAG 2.2 AA** accessibility baseline |
| **D-12** | Logo is the only confirmed brand asset; provisional visual system, not mechanically derived |
| **D-17** | Session expiry must not destroy Student work or consume an attempt |
| **D-18** | Every error state says *what happened* and *what to do next* |
| D-13 – D-16 | Student role · LMS web · desktop-first 1440px · from scratch |

---

## 6. Unresolved questions

Full register in `ui-ux/01-requirements/OPEN_QUESTIONS.md`. **All four Review-001 blocking questions are closed; 34 remain open and none blocks wireframing.**

**High priority (8):** approved brand guide (Q-13) · B2B/B2C identity linking (Q-18) · localization and formatting (Q-32) · currency, tax, and price presentation (Q-35) · profile field editability (Q-11) · are courses purchasable (Q-46) · does gating apply to standalone purchased modules (Q-47) · recovery when a simulation completion event never arrives (Q-42).

**Three carry engineering dependencies** as much as product ones: video coverage tracking (Q-40) · simulation completion events (Q-42) · server-authoritative assessment timer (Q-43).

---

## 7. FRD contradictions — status after Review 002

| # | Contradiction | Status |
|---|---|---|
| 1 | **SSO in two phases** — 4.2.2 (Phase 1) vs 7.4.1 (Phase 3) | ✅ **Resolved by D-03** in favour of Phase 1 |
| 2 | **Two account origins** — 4.1.1 self-registration vs 7.2.2 ERP auto-creation | ✅ **Resolved** — different account-origin paths for different audiences (D-01, D-03), not a contradiction |
| 3 | **B2C commerce Phase 1 in FRD, excluded by manager** | ✅ **Resolved by D-04** — in scope |
| 4 | **Sequencing** — 3.2.2 says "**recommended** sequence in which modules **must** be completed" | ✅ **Resolved by D-07** — enforced |
| 5 | **Certification** — issuance Phase 1 (3.3.2), tracking Phase 3 (3.5.1) | ⚠️ **Open ambiguity** (Q-12), not a direct contradiction |
| 6 | **"Learning preferences"** collected in Phase 1 (4.3.1) with no Phase-1 consumer — 4.5.1 is Phase 2 | ⚠️ **Open** (Q-15) — field moved to Account so it does not add first-run friction |
| 7 | **Blank FRD page 12** between Sections 7 and 8 | ⚠️ **Open** (Q-21) — numbering runs continuously 7.4.2 → 8.1.1, so almost certainly an export artefact |

**Absences confirmed by text sweep** — the FRD contains **zero** mentions of: accessibility, WCAG, screen reader, contrast, keyboard (addressed by D-11) · localization, language, translation (Q-32) · password reset, forgot, logout (A-29R) · search · student deadlines.

---

## 8. Requirement authority order

1. Latest confirmed product/handover decisions
2. `source/Platform FRD_v4.pdf`
3. Existing confirmed `DECISIONS.md`
4. Clearly labelled reversible UX assumptions
5. External reference research

**An assumption is never silently converted into a confirmed requirement.** Requirements are never invented — where the FRD is silent and design must continue, a marked reversible assumption is recorded and the gap is escalated as an open question. `source/` and `branding/` are preserved unchanged.
