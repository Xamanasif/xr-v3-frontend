# Platform FRD v5 — Change Summary

**Quick-reference summary for the Team Lead and Project Manager.** Designed to be read in
5–10 minutes.

> **Start with the Core FRD** (`Platform_FRD_v5_CORE_DRAFT_FOR_REVIEW`, 30 pages) — that is the
> primary review document. For a diagram-led discussion in ten minutes, read the
> **Team Lead Review Summary** (11 pages). Use the
> **Detailed Requirements and Traceability Reference** (147 pages) only when you need exact
> requirement provenance. `source/Platform FRD_v4.pdf` remains unchanged.

| | |
|---|---|
| **Document** | XR Simulation Learning Platform — Functional Requirement Document, Consolidated Updated Draft v5.0 |
| **Date** | 19 August 2026 |
| **Status** | **DRAFT FOR REVIEW — NOT YET APPROVED** |
| **Source of truth** | `source/Platform FRD_v4.pdf` — **unchanged, and never edited by this work** |
| **Supersedes** | Nothing. Platform FRD_v4 remains the issued baseline until this draft is approved |

---

## 1. Why v5 was created

Platform FRD_v4 defines the product correctly. The **design work that followed it was executed
under a narrower reading**, in which the detailed Phase-1 scope was taken to be the
Student/Learner desktop experience.

Two direct stakeholder sessions corrected that:

- **18 August 2026** — twelve confirmations (PM-01 – PM-12). The decisive one: *all Phase-1
  requirements and all Phase-1 roles are in scope.*
- **19 August 2026** — three closure confirmations (PM-13 – PM-15) settling the tenancy model,
  the content rejection path, and assessment ownership.

That changed the shape of the work from **one workspace to seven**. Requirement *breadth* never
changed — the FRD still contains 78 Phase-1 requirements. Role *depth* changed.

v5 exists to put the original requirements, the fifteen decisions, and the reconciled
architecture into **one reviewable document** rather than leaving them spread across a baseline
capture, a closure note and thirteen re-audit documents.

---

## 2. What changed — the short list

| # | Change | Source | Type |
|---|---|---|---|
| 1 | Student-only interpretation superseded; all Phase-1 roles in scope | PM-01 | Clarification |
| 2 | **Seven confirmed roles** instead of five in scope | PM-07 | 🟠 **Extension of the FRD** |
| 3 | Vendor gets a real login and workspace | PM-07 | 🟠 Extension |
| 4 | Academic Reviewer gets a real login and workspace | PM-07 | 🟠 Extension |
| 5 | **Two-plane model** — central content plane + tenant planes, Super Admin spans both | PM-13 | Fills an FRD silence |
| 6 | B2B and B2C both Phase 1, **no sequencing** | PM-04 | Alignment |
| 7 | **Entitlement-aware XR device delivery** is a designed experience, not just a restricted state | PM-05 | Alignment + gap |
| 8 | XR simulations are **available**; the platform ingests rather than authors | PM-06 | Alignment |
| 9 | **Configuration-driven assessment**; earlier fixed values are sample configuration only | PM-08 | Alignment |
| 10 | Assessment owned by **Faculty / authorized institution side for both B2B and B2C** | PM-15 | Alignment, extended to B2C |
| 11 | Learners **never** author or configure assessments — now a stated prohibition | PM-15 | Clarification |
| 12 | Learning progression approved: resources → simulation → assessment → completion | PM-09 | Alignment |
| 13 | **Institutional SSO required**, including the institution-side configuration surface | PM-10 | ✅ Resolves an FRD internal conflict |
| 14 | **Reporting is incremental** — operations first, analytics later | PM-11 | Alignment with the FRD's own phasing |
| 15 | **Certification moved to Phase 2** | PM-12 | 🔴 **Deviation from the FRD as written** |
| 16 | Governance chain gains **rejection, comments, resubmission and review history** | PM-14 | 🟠 **Extension of the FRD** |
| 17 | Full platform architecture and 10 end-to-end workflows documented | PM-02, PM-13 | New in v5 |
| 18 | 44 acceptance criteria, open-question register, dependency register, NFR categories | Derived | New in v5 |

---

## 2a. Accuracy corrections in revision 2

Seven claims in the first v5 draft asserted more than the sources support. All are corrected in
every edition. **None changes scope and none removes a requirement** — each narrows what the
document claims.

| Topic | Now recorded as |
|---|---|
| Answer-key visibility | **PRODUCT-PENDING.** Post-attempt feedback policy is open; a learner-facing application receives only what the approved policy permits. Was: a universal rule that the learner never sees the key. New question `QP-27` |
| Direct course purchase | **NOT-SPECIFIED / PRODUCT-PENDING.** Phase-1 purchase requirements name modules and bundles; course purchase is neither required nor prohibited. Was: a permanent prohibition. New question `QP-28` |
| Assessment hints | **OPTIONAL / PRODUCT-PENDING.** No source defines hints — the FRD does not mention them and PM-08 does not name them. Was: attributed to PM-08 and treated as sample configuration. `QP-20` reworded and raised to Medium |
| Authentication and role routing | Sign-in model and the absence of a pre-login role choice are **DESIGN-PENDING** design positions. A workspace chooser is **conditional** on multi-role identities being approved; none is mandated. Was: presented as following from PM-03. New question `QX-10` |
| Role set | **Seven roles currently approved; any additional Phase-1 formal role requires explicit stakeholder approval.** Was: “no further role may be added” |
| Institutional SSO | **Required**, and available per the institution's configured authentication model. Was: described in places as “preferred” and “ordered first” |
| Three inherited design positions | Cart-free checkout, standalone-module gating and the caption-completion rule are relabelled **DESIGN-PENDING**. Was: presented as requirements |

Two classification labels were added to support this — **NOT-SPECIFIED** and **DESIGN-PENDING** —
plus **OPTIONAL**. Open questions moved from 56 to 59, and high-priority from 11 to 12.

> **The principle:** a requirement document may record what a source says, and it may record a
> labelled design position. It must not present the second as the first. Absence of a requirement
> is not a prohibition.

---

## 3. The seven confirmed roles

**Central / platform content and governance plane**

| Role | Basis | Note |
|---|---|---|
| Vendor | FRD 1.4.1, 1.4.5 — *actor only in the FRD* | **PM-added role.** Can never publish (the FRD's only explicit role prohibition) |
| Academic Reviewer | FRD 1.4.2 — *actor only in the FRD* | **PM-added role.** Low volume, highest authority — gates every module |
| Content Manager | FRD 8.1.2 | Approves readiness; never publishes |
| Super Admin | FRD 8.1.1, 1.3.5 | Sole publisher; sole cross-tenant access |

**Institution / tenant plane**

| Role | Basis | Note |
|---|---|---|
| Institute Admin | FRD 8.1.3 | Tenant config, SSO, ERP, licences, student access |
| Faculty | FRD 8.1.4 | Assignment, assessment configuration, operational learner status |
| Student / Learner | FRD 8.1.5 | The existing design, reframed as one workspace |

**B2C individual learner is a business context around the Learner role, not a separate role.**
**Seven formal roles are currently approved for Phase 1. Any additional Phase-1 formal role
requires explicit stakeholder approval** — and FRD 8.3 (custom role creation) is Phase 3, so no
Phase-1 mechanism exists to define one.

---

## 4. Architecture in one page

```
         ONE CENTRAL PLATFORM · ROLE-BASED ACCESS AND WORKSPACES  (PM-03)
         authenticate, then resolve role → plane → tenant   (sign-in model: design position)
                                        │
     ┌──────────────────────────────────┼──────────────────────────────────┐
     │                                  │                                  │
  CENTRAL CONTENT PLANE          TENANT PLANE (per institution)     PERSONAL / B2C
  Vendor · Academic Reviewer     Institute Admin · Faculty          individual accounts
  Content Manager                Student / Learner                  purchases, entitlements
  FRD 1.1.4, 1.4.1–1.4.5         FRD 1.3.1, 1.3.4                   FRD 1.3.2
     │                                  │                                  │
     └──────── SUPER ADMIN spans both planes — FRD 1.3.5 only ─────────────┘
                                        │
   SHARED PLATFORM SERVICES: identity/access · content · learning · assessment ·
   entitlements · XR delivery · commerce · progress
```

- **15 logical capability domains**, each defined once and consumed by many roles in different scopes.
- **Technology-neutral throughout.** No framework, language, cloud provider, database, transport or
  deployment topology is selected. FRD 12.1.1 names AWS/Azure/GCP as *examples*, not a choice.
- **Licensing and entitlements is the spine** — learning reads it, XR delivery validates against it
  twice, commerce creates it, ERP populates it, tenancy scopes it.

---

## 5. Phase figures — stated transparently

| Step | Effect | Count |
|---|---|---|
| Original FRD Phase-1 requirement count | **Unchanged document fact** | **78** |
| Less PM-deferred certification (3.3.1, 3.3.2) | PM-12 — recorded deviation | −2 |
| Phase-1 design working set from the FRD | | **76** |
| Plus FRD 7.4.1 given a Phase-1 working position | PM-10 resolves the 4.2.2 / 7.4.1 conflict | +1 |
| **Phase-1 working set used by v5** | | **77** |

Original FRD totals, all preserved: **131 requirements** — 78 Phase 1, 33 Phase 2, 20 Phase 3.

> **v5 never claims the FRD always said certification was Phase 2.** The original phase is
> preserved in every table alongside the v5 working phase.

---

## 6. Deviations, extensions and conflicts on record

| Ref | Item | Type |
|---|---|---|
| **DV-1** | Certification (3.3.1, 3.3.2) moved Phase 1 → Phase 2 | 🔴 **Deviation from the FRD** |
| **EX-1** | Vendor and Academic Reviewer promoted to roles beyond the FRD's five | 🟠 Extension |
| **EX-2** | Rejection, resubmission and review history added to the governance chain | 🟠 Extension |
| **EX-3** | Two-plane placement of Vendor, Academic Reviewer, Content Manager | Fills an FRD silence — no FRD text contradicted |
| **CF-1** | SSO phase — 4.2.2 (Phase 1) vs 7.4.1 (Phase 3) | ✅ Resolved by PM-10 in favour of Phase 1 |
| **CF-2** | 8.1.3 names course structures (Phase 1) vs 3.4.x course creation (Phase 2) | 🟡 FRD tension — working interpretation recorded, carried as an open question |
| **CF-3** | 8.1.4 names performance monitoring (Phase 1) vs 11.3.1 class reports (Phase 2) | 🟡 FRD tension — operational status only in Phase 1 |
| **GP-1** | **No AR application architecture exists in FRD Section 2** | 🟡 FRD gap — flagged, not filled |
| **GP-2** | 5.1.2 AI question generation is Phase 1, previously excluded on the basis of Phase-3 5.5 | 🟡 Scope catch — reinstated as PRODUCT-PENDING |
| **GP-3** | 2.4.1 / 2.4.2 device binding and replacement had no surface anywhere | 🟡 FRD gap — now specified; the missing rejection path is not invented |
| **GP-4** | No audit trail outside content governance | 🟡 FRD gap — not invented |

**`source/Platform FRD_v4.pdf` is unchanged and must remain unchanged.**

---

## 7. Open questions — totals

| Class | Blocker | High | Medium | Low | Total |
|---|---|---|---|---|---|
| Product | 0 | 3 | 14 | 7 | **24** |
| Technical | 0 | 4 | 9 | 2 | **15** |
| Data / Integration | 0 | 2 | 6 | 2 | **10** |
| Design | 0 | 3 | 6 | 1 | **10** |
| **Total open** | **0** | **12** | **35** | **12** | **59** |
| Future-phase items recorded | | | | | 19 |
| Closed by stakeholder decision | | | | | 19 |

**No open question blocks the platform architecture, role model, capability map or workflow set.**
Several block *development* of a specific capability; those are marked individually.

**Highest-value outstanding product question: `QP-02` — who grades descriptive answers.** It is the
only open item that can strand a learner mid-progression through no fault of their own.

**Four items are pending by explicit instruction, not by omission:** the XR delivery mechanism
(PM-05), the SSO provider and protocol (PM-10), which institution supplies a pure-B2C assessment
(PM-15), and the detailed reporting metrics (PM-11).

Full register: `Platform_FRD_v5_OPEN_QUESTIONS.md` and Appendix B of the document.

---

## 8. Files created by this task

| File | What it is |
|---|---|
| `Platform_FRD_v5_CORE_DRAFT_FOR_REVIEW.docx` / `.pdf` | **THE PRIMARY REVIEW DOCUMENT — read this one.** 30 pages, 22 chapters, 10 diagrams, 32 tables. Understandable without opening the master |
| `Platform_FRD_v5_TEAM_LEAD_REVIEW_SUMMARY.docx` / `.pdf` | **The quick discussion document.** 11 pages, diagram-led. What changed and what needs decisions |
| `Platform_FRD_v5_DRAFT_FOR_REVIEW.docx` / `.pdf` | **The Detailed Requirements and Traceability Reference.** 147 pages, 135 tables, 12 diagrams. All 131 requirements, the traceability matrix, every acceptance criterion and the full registers. Not intended to be read front to back |
| `Platform_FRD_v5_CHANGE_SUMMARY.md` | This file |
| `Platform_FRD_v5_OPEN_QUESTIONS.md` | Quick-reference question and dependency register |
| `architecture-assets/D01…D15*.png` | 15 diagrams — 12 in the master, 3 portrait-friendly ones for the compact editions |

### Which document to read

| If you want to | Read |
|---|---|
| Understand what is being built | **Core FRD** |
| Discuss what changed and decide what is next | **Team Lead Review Summary** |
| Check the exact provenance of a requirement | **Detailed Master** |
| See the original issued requirements | **Platform FRD_v4** — unchanged |

**Nothing else was created, modified or deleted.** `source/`, `branding/`, Review-005 and Review-006
material, and Figma are all untouched. Nothing has been committed.

> **One note on opening the DOCX.** Its table of contents, list of diagrams and list of tables are
> live word-processor fields, and the document is flagged to update them on open. If your word
> processor prompts to update fields, accept — otherwise select each index and refresh it. The PDF
> carries the same three indexes already populated, so use the PDF if you only want to read.

---

## 9. Document contents at a glance

| Chapter | Content |
|---|---|
| Front matter | Document control, revision history, reviewers, approval table, glossary, contents, diagram and table indexes |
| 1–2 | Executive summary · how to read the document, authority order, change classification labels |
| 3 | **Stakeholder Clarification and Decision Register — PM-01 to PM-15**, each with source, affected requirements, roles, effect and what remains pending |
| 4 | Product scope and phasing, with the phase arithmetic shown |
| 5 | **Platform architecture** — system context, role/workspace, two-plane model, capability map, logical services, security and data boundaries |
| 6 | **The seven roles**, each with permissions, prohibitions, workflows, traceability, acceptance criteria and unresolved details |
| 7 | **Functional requirements in the original FRD structure** — all 131 identifiers, faithful wording, both phases, classification, roles, market, capability, clarifications and acceptance criterion |
| 8 | **New and clarified requirements** — 10 × V5-ADD, 12 × V5-CLR |
| 9 | **10 end-to-end workflows** with diagrams and recorded gaps |
| 10–15 | XR delivery · assessment · learning · commerce and licensing · SSO/ERP/integrations · reporting |
| 16–17 | Non-functional requirement categories (18) · UI/UX requirements and required states |
| 18 | **44 acceptance criteria** in Given / When / Then form |
| 19–21 | Questions and decision register · dependency register (16) · summary of changes from FRD v4 |
| Appendices | A — traceability matrix for all 131 requirements · B — full open-question register · C — mechanical verification of this draft |

---

## 10. What remains pending

**Technical** — XR delivery mechanism · AR application architecture · assessment configuration API
contract · XR sign-in under SSO · package format · web-simulation delivery path · completion
reconciliation · payment gateway · technology stack.

**Product** — descriptive-answer grading owner · Phase-1 institutional licence transaction · Faculty
account provisioning · bundle creation and pricing in Phase 1 · MR sideloading authority · refund
and cancellation rules · receipt format.

**Data / integration** — user-editable vs ERP-owned profile fields · Phase-1 role-assignment origin ·
ERP provider and contract · identity provider and protocol · module metadata schema · curriculum
validation criteria.

**Design** — viewport policy for the six new workspaces · outstanding reflow non-conformance ·
caption and transcript ownership · vector logo variant.

**Non-functional** — accessibility conformance target · performance, availability, backup and
retention targets · authentication policy. **No numeric target has been invented anywhere in this
draft.**

---

## 11. Approval required

This draft is **not approved**. Approval is recorded only when the sign-off table in the document's
front matter is completed.

**What we are asking for:**

1. **Confirm the consolidated scope and phasing** in chapter 4, including the recorded certification
   deviation and the SSO phase resolution.
2. **Confirm the seven-role model and the two-plane architecture** as recorded in chapters 5 and 6.
3. **Confirm the recorded deviations and extensions** (section 6 above) are accepted as deviations
   from Platform FRD_v4 rather than requiring the FRD to be amended.
4. **Assign owners to the 12 high-priority open questions**, and in particular give a direction on
   `QP-02` (descriptive-answer grading) and `QP-04` (Phase-1 institutional licence transaction).
5. **Select the end-to-end flows** to take into detailed design first. A ranked recommendation exists
   from the re-audit; it is a recommendation and not an approved plan.

Until those are settled, Platform FRD_v4 remains the issued baseline and this document is a review
draft only.
