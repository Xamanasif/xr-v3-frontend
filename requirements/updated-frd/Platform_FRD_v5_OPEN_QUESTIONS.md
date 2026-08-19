# Platform FRD v5 — Questions, Decisions and Dependencies

**Quick-reference register for the Team Lead and Project Manager.** Generated from the same data as `Platform_FRD_v5_DRAFT_FOR_REVIEW.docx` / `.pdf`, so the counts match the document exactly.

| | |
|---|---|
| **Date** | 19 August 2026 |
| **Status** | **DRAFT FOR REVIEW — NOT YET APPROVED** |
| **Source of truth** | `source/Platform FRD_v4.pdf` — unchanged |
| **Rule applied throughout** | **No unresolved question is answered here.** Where a safe working position exists it is labelled as one, never as a decision |

---

## 1. Totals

| Class | Blocker | High | Medium | Low | Total open |
|---|---|---|---|---|---|
| Product | 0 | 3 | 14 | 7 | **24** |
| Technical | 0 | 4 | 9 | 2 | **15** |
| Data / Integration | 0 | 2 | 6 | 2 | **10** |
| Design | 0 | 3 | 6 | 1 | **10** |
| **Total open** | **0** | **12** | **35** | **12** | **59** |
| Future-phase items recorded | — | — | — | — | 19 |
| **Closed by stakeholder decision** | — | — | — | — | **19** |

> **There are no blocking questions.** No open item prevents the platform architecture, the role and permission model, the capability map or the workflow set from being completed. Several block *development* of a specific capability; each is marked in the register below.

**Priority definitions** — **HIGH** changes platform structure, authority, or a legal or compliance position. **MEDIUM** changes a screen or a flow, not the architecture. **LOW** is detail, and a labelled reversible working position exists.

---

## 2. Resolved by stakeholder decision — do not re-ask

These are settled. **None of them appears as open anywhere in the v5 document.** Any artefact still treating one of them as open is out of date.

| Question | Resolution | Authority |
|---|---|---|
| What is the requirement and design scope? | All Phase-1 requirements and all Phase-1 roles. | **PM-01** |
| What order must the design work follow? | Sitemap, then permissions, then all-role workflows, then priority flows into detailed design. | **PM-02** |
| Is this one platform or several products? | One central portal with role-based access and workspaces. | **PM-03** |
| Is it B2B, B2C, or both? | Both. Neither is sequenced ahead of the other. | **PM-04** |
| Must entitled experiments reach the device? | Yes — confirmed as a product requirement. The mechanism is deliberately unselected. | **PM-05** |
| Do the XR simulations already exist? | Yes. The team is not assumed to build every simulation from scratch. | **PM-06** |
| Is Vendor a real role with a login? | Yes — an actual platform login and workspace. | **PM-07** |
| Is Academic Reviewer a real role with a login? | Yes — an actual platform login and workspace. | **PM-07** |
| Are assessment rules fixed or configurable? | Configurable through the portal, consumed by applications through flexible APIs. | **PM-08** |
| Are the earlier fixed assessment values platform constants? | No. They are sample configuration only. | **PM-08** |
| Is the proposed learning sequence acceptable? | Yes — resources, then simulation, then assessment, then completion. | **PM-09** |
| Is institutional SSO required or deferrable? | Required. It stays in the architecture and in the institutional authentication experience. | **PM-10** |
| How much reporting is needed now? | Core operations first; analytics added incrementally. | **PM-11** |
| Is certification in Phase 1? | No — Phase 2. Recorded as a deviation from the FRD as written. | **PM-12** |
| Where do Vendor, Academic Reviewer and Content Manager sit in the tenancy model? | The central content plane. Super Admin alone retains cross-tenant access. | **PM-13** |
| Is there a reject, revise and resubmit path in the governance chain? | Yes — approve or changes required, with comments, correction, resubmission and review history. | **PM-14** |
| Is there an audit trail for governance decisions? | Yes, for the content governance chain. Review history and status traceability are required. | **PM-14** |
| Who configures assessments for a B2C individual learner? | Faculty or the authorized institution side — the same as for B2B. | **PM-15** |
| May a learner author or configure an assessment? | Never, in either market context. | **PM-15** |

---

## 3. High-priority open questions

These twelve change platform structure, authority, or a legal or compliance position.

| ID | Class | Question | Affected requirement | Affected role / workflow | Current safe assumption | Owner | Blocks |
|---|---|---|---|---|---|---|---|
| **QP-02** | Product | Who grades descriptive answers, on what turnaround, and against what rubric? | 5.2.3; compounded by 3.2.2 and 11.1.1 | Faculty, Learner; FLOW 4 | The grading queue is named and positioned but explicitly unowned and undesigned. | Project Manager with academic stakeholder | Blocks development of the grading capability; does not block design of the rest |
| **QP-04** | Product | How is an institutional licence transacted in Phase 1, given that institutional billing is Phase 2? | 6.2.1 against 9.3.1 and 9.3.2 | Institute Admin, Super Admin; FLOW 2, FLOW 9 | Licences are shown as existing. No in-platform purchase flow is invented. | Project Manager with commercial owner | Blocks development of the institutional purchase path; does not block design |
| **QP-27** | Product | What post-attempt feedback may a learner see, and is answer-key visibility ever permitted? | 5.2.1–5.2.3, 11.2.1; no requirement states a feedback policy | Faculty, Learner; FLOW 4 | No feedback policy is asserted in either direction. Learner-facing applications receive only the assessment data the configured and approved policy permits, and that policy is undefined. | Project Manager with academic stakeholder | Blocks development of the result surface and the assessment API payload; does not block design |
| **QT-01** | Technical | Which XR delivery mechanism is used? | 2.1.1, 2.2.1, 2.2.2, 2.3.x; PM-05 | Learner, Super Admin; FLOW 5 | The delivery contract is mechanism-neutral by design and survives any outcome. **Pending by explicit instruction.** | Team Lead with Project Manager | Blocks development of delivery; does not block design |
| **QT-02** | Technical | There is no AR application architecture in Platform FRD_v4. What is it? | 1.2.4 against Section 2, which covers VR and MR only | Learner; FLOW 5 | Flagged, not filled. **AR is explicitly not assumed to behave like VR.** | Team Lead | Blocks development of AR delivery; does not block design of the other formats |
| **QT-03** | Technical | What is the assessment configuration API contract? | PM-08 | Faculty, Learner, external applications; FLOW 4 | Abstract. One constraint is recorded now: a learner-facing payload must carry only the assessment data the approved feedback policy permits, and that policy is itself open (QP-27). | Team Lead | Blocks development of application consumption; does not block design |
| **QT-04** | Technical | How does an SSO-authenticated learner sign into the XR application, which requires LMS credentials? | 2.4.4 against 4.2.2 and PM-10 — both Phase 1 | Learner, Institute Admin; FLOW 5, FLOW 6 | Recorded as a collision. **Not designed around.** | Team Lead with Project Manager | Blocks development of institutional device sign-in; does not block design |
| **QD-01** | Data / Integration | Which profile fields are user-editable and which are ERP-owned? | 4.3.1 against 7.1.1 and 7.2.1 | Learner, Faculty, Institute Admin; FLOW 7 | ERP-sourced fields are presented read-only with their provenance stated. | Team Lead with Institute stakeholder | Blocks development of profile editing; does not block design |
| **QD-02** | Data / Integration | What is the Phase-1 origin of role assignment? | 7.4.2 and 8.3 are both Phase 3 | All seven; FLOW 6 | Super Admin assigns platform roles under 8.1.1. The institutional role-assignment origin is left open rather than invented. | Project Manager with Team Lead | Blocks development of role provisioning; does not block design |
| **QX-01** | Design | Does the desktop-first viewport decision extend to all six new workspaces? | Derived; no FRD requirement | All seven | Not extended automatically. Administrative work is desktop-typical, but this must be decided rather than inherited. | Design lead with Project Manager | Blocks detailed design of the new workspaces |
| **QX-02** | Design | How is the outstanding reflow non-conformance handled now that it spans all workspaces? | Accessibility; no FRD requirement | All seven | Stated plainly as a known non-conformance; layouts are built so a responsive pass is possible without restructuring. | Design lead with Project Manager | Blocks an accessibility conformance claim; does not block design |
| **QX-03** | Design | Who owns video captions, transcripts and audio description? | 3.1.2; 1.4.1 and 1.4.3 are candidate homes | Content Manager, Vendor, Learner; FLOW 1 | Slots are specified; the content is unowned. **A video without captions must not be a required component for completion.** | Project Manager with academic stakeholder | Blocks accessible content delivery; does not block design |

**Pending by explicit instruction rather than by omission:** `QT-01` the XR delivery mechanism (PM-05) · `QD-04` the SSO provider, protocol and attribute mapping (PM-10) · `QP-25` which institution supplies a pure-B2C assessment (PM-15) · the detailed reporting metrics and KPI definitions (PM-11). These are not deficiencies in the draft.

> **`QP-02` — ownership of descriptive-answer grading — is the highest-value product question outstanding**, because it is the only open item that can strand a learner mid-progression through no fault of their own. Requirement 5.2.3 permits descriptive answers; no Phase-1 requirement says who grades them, and the approved progression gates the next module on completion.

---

## 4. Complete open-question register

### 4.1 Product

| ID | Priority | Question | Affected requirement | Affected role / workflow | Current safe assumption | Owner | Blocks design, development or neither |
|---|---|---|---|---|---|---|---|
| `QP-02` | HIGH | Who grades descriptive answers, on what turnaround, and against what rubric? | 5.2.3; compounded by 3.2.2 and 11.1.1 | Faculty, Learner; FLOW 4 | The grading queue is named and positioned but explicitly unowned and undesigned. | Project Manager with academic stakeholder | Blocks development of the grading capability; does not block design of the rest |
| `QP-04` | HIGH | How is an institutional licence transacted in Phase 1, given that institutional billing is Phase 2? | 6.2.1 against 9.3.1 and 9.3.2 | Institute Admin, Super Admin; FLOW 2, FLOW 9 | Licences are shown as existing. No in-platform purchase flow is invented. | Project Manager with commercial owner | Blocks development of the institutional purchase path; does not block design |
| `QP-27` | HIGH | What post-attempt feedback may a learner see, and is answer-key visibility ever permitted? | 5.2.1–5.2.3, 11.2.1; no requirement states a feedback policy | Faculty, Learner; FLOW 4 | No feedback policy is asserted in either direction. Learner-facing applications receive only the assessment data the configured and approved policy permits, and that policy is undefined. | Project Manager with academic stakeholder | Blocks development of the result surface and the assessment API payload; does not block design |
| `QP-07` | MEDIUM | Who creates and manages Faculty accounts? | 8.1.3 names only student access; 7.2.2 names only student records | Institute Admin, Super Admin; FLOW 2 | The faculty-management surface is drawn as pending rather than assigned to a role. | Project Manager | Blocks development of faculty provisioning; does not block design |
| `QP-08` | MEDIUM | Does Institute Admin hold any assessment authority at all? | 5.1.1, 5.3.2, 8.1.4 against 8.1.3 | Institute Admin, Faculty; FLOW 4 | None is granted. PM-15 explicitly declines to grant it, and Faculty is the requirement-named role. | Project Manager | Neither |
| `QP-09` | MEDIUM | Who creates bundles and sets prices in Phase 1, given that both are Phase 2? | 6.1.2 against 6.3.1 and 6.3.2 | Super Admin, Learner; FLOW 3 | No Phase-1 bundle-authoring or pricing surface is invented. | Project Manager with commercial owner | Blocks development of B2C bundle sales; does not block design |
| `QP-10` | MEDIUM | Is the learning sequence per-course configurable, or a platform constant? | 3.2.2; PM-09 approves the model, not its mutability | Faculty, Learner; FLOW 2, FLOW 3 | Treated as a platform model. No configuration surface is drawn. | Project Manager | Neither |
| `QP-11` | MEDIUM | Do multi-role identities exist in Phase 1? | 8.1.x; 8.3 custom roles is Phase 3 | All seven; FLOW 6 | A workspace chooser renders only if such identities exist, and costs nothing if they do not. | Project Manager | Neither |
| `QP-12` | MEDIUM | Are multiple-choice questions single-select or multi-select? | 5.2.1 | Faculty, Learner; FLOW 4 | Single-select. Multi-select would require a partial-credit rule that no scoring model defines. | Project Manager with academic stakeholder | Blocks development of multi-select scoring; does not block design |
| `QP-13` | MEDIUM | Is there an extended-time accommodation for assessments, and who grants it? | 5.2.x, 5.3.x | Faculty, Learner; FLOW 4 | Improved by PM-08 — it becomes an ordinary configuration field rather than a special case. | Project Manager with academic stakeholder | Neither |
| `QP-14` | MEDIUM | Who authorises and performs MR sideloading? | 2.1.2 | Institute Admin, Super Admin; FLOW 5 | Plausibly Institute Admin, but not assigned. No sideloading capability is offered to a learner. | Team Lead with Project Manager | Blocks development of the MR provisioning path; does not block design |
| `QP-15` | MEDIUM | Is academic validation shown to learners or buyers as a trust signal? | 1.4.2 | Learner; FLOW 1, FLOW 3 | Not shown. Adding it unasked would invent a product feature. | Project Manager | Neither |
| `QP-16` | MEDIUM | Are assessment configurations reusable across courses, cohorts or institutions? | PM-08 | Faculty; FLOW 4 | Not addressed. No reuse mechanism is drawn. | Project Manager | Neither |
| `QP-17` | MEDIUM | What receipt or invoice does a B2C buyer receive? | 9.2.1; 9.3.1 is Phase 2 and institution-facing | Learner; FLOW 3 | A purchase record is provided; the document format is pending. | Commercial owner with Project Manager | Blocks development of receipt generation; does not block design |
| `QP-18` | MEDIUM | What are the refund, cancellation and revocation rules? | 9.1.x, 9.2.x | Learner, Super Admin; FLOW 3 | None stated or implied. **No rule is invented.** | Commercial and legal owner | Blocks development of refund handling; does not block design |
| `QP-20` | MEDIUM | Are assessment hints in scope at all, and if so what are their scoring and limit rules? | No FRD requirement defines hints. PM-08 confirms configurable assessment behaviour and does not mention hints | Faculty, Learner; FLOW 4 | Hints are treated as OPTIONAL and unapproved. No hint behaviour, hint scoring or hint limit is assumed in either direction. | Project Manager with academic stakeholder | Neither |
| `QP-28` | MEDIUM | Is direct course purchase in scope, given that Phase-1 purchase requirements name only modules and bundles? | 6.1.1, 6.1.2 against 3.2.1 | Learner, Super Admin; FLOW 3 | Not specified and not included in the current design. It is neither required nor prohibited, and no course-purchase surface is drawn. | Project Manager with commercial owner | Neither |
| `QP-19` | LOW | Which social login providers are approved? | 4.1.2 | Learner; FLOW 3 | Any provider shown is a clearly labelled sample. | Project Manager | Neither |
| `QP-21` | LOW | Is there a platform-level default assessment configuration? | PM-08 | Faculty; FLOW 4 | **None is invented.** | Project Manager | Neither |
| `QP-22` | LOW | May an assessment configuration change between attempts? | PM-08, 11.2.2 | Faculty, Learner; FLOW 4 | Not addressed. Affects fairness and the meaning of attempt history. | Project Manager with academic stakeholder | Neither |
| `QP-23` | LOW | Is there a real help destination behind the consistent help entry? | Not in the FRD | All seven | The location is consistent; the destination is unconfirmed. | Project Manager | Neither |
| `QP-24` | LOW | Is the structural certification node modelled even though the experience is deferred? | 3.3.1; PM-12 | Content model; no Phase-1 workflow | **Not assumed either way.** PM-12 defers the experience, not necessarily the data model. | Project Manager | Neither |
| `QP-25` | LOW | For a pure B2C individual learner, which Faculty, institution or content owner supplies the assessment? | PM-15 | Faculty, Learner; FLOW 4 | Explicitly deferred by PM-15 as a content and implementation detail, and explicitly not a blocker. Whoever supplies it acts on the authorized side and produces the same configuration. | Project Manager with content operations | Neither |
| `QP-26` | LOW | May Super Admin also return a submission at the publication gate? | 1.4.4; PM-14 names Academic Reviewer and Content Manager only | Super Admin; FLOW 1 | **Not invented.** No return capability is granted at the publication gate. | Project Manager | Neither |

### 4.2 Technical

| ID | Priority | Question | Affected requirement | Affected role / workflow | Current safe assumption | Owner | Blocks design, development or neither |
|---|---|---|---|---|---|---|---|
| `QT-01` | HIGH | Which XR delivery mechanism is used? | 2.1.1, 2.2.1, 2.2.2, 2.3.x; PM-05 | Learner, Super Admin; FLOW 5 | The delivery contract is mechanism-neutral by design and survives any outcome. **Pending by explicit instruction.** | Team Lead with Project Manager | Blocks development of delivery; does not block design |
| `QT-02` | HIGH | There is no AR application architecture in Platform FRD_v4. What is it? | 1.2.4 against Section 2, which covers VR and MR only | Learner; FLOW 5 | Flagged, not filled. **AR is explicitly not assumed to behave like VR.** | Team Lead | Blocks development of AR delivery; does not block design of the other formats |
| `QT-03` | HIGH | What is the assessment configuration API contract? | PM-08 | Faculty, Learner, external applications; FLOW 4 | Abstract. One constraint is recorded now: a learner-facing payload must carry only the assessment data the approved feedback policy permits, and that policy is itself open (QP-27). | Team Lead | Blocks development of application consumption; does not block design |
| `QT-04` | HIGH | How does an SSO-authenticated learner sign into the XR application, which requires LMS credentials? | 2.4.4 against 4.2.2 and PM-10 — both Phase 1 | Learner, Institute Admin; FLOW 5, FLOW 6 | Recorded as a collision. **Not designed around.** | Team Lead with Project Manager | Blocks development of institutional device sign-in; does not block design |
| `QT-05` | MEDIUM | What is the XR package and submission format? | 2.2.1 states only “encrypted asset bundles” | Vendor, Content Manager; FLOW 1, FLOW 5 | The upload surface is specified generically and the format is marked pending. | Team Lead | Blocks development of submission handling; does not block design |
| `QT-06` | MEDIUM | Do web simulations use the same encrypted-bundle and licence-validation path as XR formats? | 1.2.1 against 2.2.1 and 2.2.2 | Learner; FLOW 5 | Unstated. Affects load time, pre-launch experience and whether the execution-time gate applies in-browser. | Team Lead | Neither |
| `QT-07` | MEDIUM | What is the completion reconciliation behaviour when a completion is never recorded? | 11.1.1; PM-05 | Learner, Faculty; FLOW 5 | Retry and refresh are offered. **No manual override**, because an override would defeat the progression gate for everyone. | Team Lead | Blocks development of reconciliation; does not block design |
| `QT-08` | MEDIUM | How quickly does a device completion reach the portal? | 11.1.1, 12.2.1 | Learner; FLOW 5 | Read-on-navigation plus an explicit refresh. Cheap to remove if a push mechanism exists. | Team Lead | Neither |
| `QT-09` | MEDIUM | Is the assessment timer server-authoritative, and how often are answers persisted? | PM-08, 5.2.x | Learner; FLOW 4 | Server-authoritative is assumed for design purposes and is unconfirmed. | Team Lead | Blocks development of the attempt runtime; does not block design |
| `QT-10` | MEDIUM | How is video resource coverage measured? | 3.1.2 | Learner; FLOW 2, FLOW 3 | Coverage rather than furthest playhead, because furthest playhead defeats the completion gate. | Team Lead | Neither |
| `QT-11` | MEDIUM | Which payment gateway, and redirect or embedded checkout? | 9.1.1, 9.1.2 | Learner; FLOW 3 | A generic secure redirect is assumed for design purposes. **No provider is named.** | Commercial owner with Team Lead | Blocks development of payment; does not block design |
| `QT-12` | MEDIUM | What is the final technology stack and hosting platform? | 12.1.1 names providers as examples | All; platform-wide | No architectural statement in this document depends on the answer. | Team Lead | Blocks build; does not block design |
| `QT-13` | MEDIUM | Are session-expiry durations per-tenant configurable? | 10.2.2 | All seven | A single platform-wide behaviour is assumed. | Team Lead with Project Manager | Neither |
| `QT-14` | LOW | What are the password policy, multi-factor and lockout requirements? | 10.2.1; absent from the FRD entirely | All seven; FLOW 6 | A design-supplied minimum is assumed and is labelled as such. **No policy is invented as approved.** | Team Lead with Project Manager | Blocks development of authentication policy; does not block design |
| `QT-15` | LOW | Is a storage-constraint state technically reachable on target devices? | PM-05 | Learner; FLOW 5 | Held as a conditional state. Not designed until the delivery mechanism confirms it can occur. | Team Lead | Neither |

### 4.3 Data / Integration

| ID | Priority | Question | Affected requirement | Affected role / workflow | Current safe assumption | Owner | Blocks design, development or neither |
|---|---|---|---|---|---|---|---|
| `QD-01` | HIGH | Which profile fields are user-editable and which are ERP-owned? | 4.3.1 against 7.1.1 and 7.2.1 | Learner, Faculty, Institute Admin; FLOW 7 | ERP-sourced fields are presented read-only with their provenance stated. | Team Lead with Institute stakeholder | Blocks development of profile editing; does not block design |
| `QD-02` | HIGH | What is the Phase-1 origin of role assignment? | 7.4.2 and 8.3 are both Phase 3 | All seven; FLOW 6 | Super Admin assigns platform roles under 8.1.1. The institutional role-assignment origin is left open rather than invented. | Project Manager with Team Lead | Blocks development of role provisioning; does not block design |
| `QD-03` | MEDIUM | Which ERP providers, and what is the integration contract? | 7.1.1, 7.1.2 | Institute Admin; FLOW 7 | Drawn generically. The systems named in the FRD are examples, not a selection. | Team Lead with Institute stakeholder | Blocks development of ERP integration; does not block design |
| `QD-04` | MEDIUM | Which identity provider, protocol and attribute mapping for SSO? | 4.2.2, 7.4.1, 7.4.2; PM-10 | Institute Admin, Learner, Faculty; FLOW 6 | Drawn generically. **Pending by explicit instruction.** | Team Lead with Institute stakeholder | Blocks development of SSO; does not block design |
| `QD-05` | MEDIUM | Can one person hold both a B2B and a B2C identity, and do they link? | 1.3.1, 1.3.2 | Learner; FLOW 3, FLOW 6 | One account per context, with an explicit collision state. No identity linking is invented. | Project Manager | Neither |
| `QD-06` | MEDIUM | Is the learner informed when synchronisation adds or removes entitlements? | 7.2.1, 7.2.3 | Learner, Institute Admin; FLOW 7 | No Phase-1 notification requirement exists. In-workflow state is shown; no push notification is designed. | Project Manager | Neither |
| `QD-07` | MEDIUM | What module metadata schema does the content readiness gate review? | 1.4.3 | Content Manager, Vendor; FLOW 1 | Never enumerated in the FRD. The review surface is specified; the schema is pending. | Team Lead with Content Manager | Blocks development of metadata validation; does not block design |
| `QD-08` | MEDIUM | What curriculum standards does academic validation test against? | 1.4.2 | Academic Reviewer; FLOW 1 | Drawn as pending. **This is content someone must own**, not a design question. | Academic stakeholder | Blocks operation of the validation gate; does not block design |
| `QD-09` | LOW | What are the localization, currency and regional formatting requirements? | 9.1.2 implies international reach; no internationalisation requirement exists | Learner; FLOW 3 | A single language and currency with expansion tolerance in layout. | Project Manager | Neither |
| `QD-10` | LOW | What are the currency, tax treatment and price presentation rules? | 9.1.2; 9.3.1 is Phase 2 | Learner; FLOW 3 | Neutral presentation. **No tax or legal rule is invented.** | Commercial and legal owner | Blocks development of pricing display; does not block design |

### 4.4 Design

| ID | Priority | Question | Affected requirement | Affected role / workflow | Current safe assumption | Owner | Blocks design, development or neither |
|---|---|---|---|---|---|---|---|
| `QX-01` | HIGH | Does the desktop-first viewport decision extend to all six new workspaces? | Derived; no FRD requirement | All seven | Not extended automatically. Administrative work is desktop-typical, but this must be decided rather than inherited. | Design lead with Project Manager | Blocks detailed design of the new workspaces |
| `QX-02` | HIGH | How is the outstanding reflow non-conformance handled now that it spans all workspaces? | Accessibility; no FRD requirement | All seven | Stated plainly as a known non-conformance; layouts are built so a responsive pass is possible without restructuring. | Design lead with Project Manager | Blocks an accessibility conformance claim; does not block design |
| `QX-03` | HIGH | Who owns video captions, transcripts and audio description? | 3.1.2; 1.4.1 and 1.4.3 are candidate homes | Content Manager, Vendor, Learner; FLOW 1 | Slots are specified; the content is unowned. **A video without captions must not be a required component for completion.** | Project Manager with academic stakeholder | Blocks accessible content delivery; does not block design |
| `QX-04` | MEDIUM | Is one queue component sufficient for the four governance roles? | 1.4.1–1.4.4 | Vendor, Academic Reviewer, Content Manager, Super Admin; FLOW 1 | One component with variants. | Design lead | Neither |
| `QX-05` | MEDIUM | Is one configuration-form pattern sufficient for SSO, ERP, assessment and platform settings? | 4.2.2, 7.2.1, PM-08, 8.1.1 | Institute Admin, Faculty, Super Admin | One pattern, validated during detailed design. | Design lead | Neither |
| `QX-06` | MEDIUM | Does the shared shell need per-workspace visual differentiation? | PM-03 | All seven | Navigation content only. Differentiated chrome fragments the platform into apparent separate products. | Design lead | Neither |
| `QX-07` | MEDIUM | Is a vector logo and a reversed variant available? | Branding | All seven | Outstanding. It constrains the header lockup and any dark presentation. | Project Manager | Blocks final visual design; does not block structure |
| `QX-08` | MEDIUM | How is gate position best expressed visually across the governance chain? | 1.4.1–1.4.4; PM-14 | Four governance roles; FLOW 1 | A status component with four positions plus the returned state. | Design lead | Neither |
| `QX-10` | MEDIUM | Is a single sign-in entry point for all roles the approved model, or are separate entry points or a pre-login role choice acceptable? | 10.2.1; PM-03 confirms one central platform with role-based access and does not specify the sign-in model | All seven; FLOW 6 | One sign-in entry point with role resolved from the authenticated identity is a design position, not a confirmed requirement. No source requires or forbids any alternative. | Design lead with Project Manager | Neither |
| `QX-09` | LOW | Should a B2C learner see any indication that assessment behaviour differs from an institutional learner's? | PM-15 | Learner; FLOW 4 | No difference is asserted. PM-15 makes ownership identical on both sides. | Design lead with Project Manager | Neither |

---

## 5. Future-phase items

Recorded so that their absence from Phase 1 is understood as scope, not oversight.

| ID | Item | Requirement | Note |
|---|---|---|---|
| `QF-01` | Certification programs and completion criteria | 3.3.1, 3.3.2 | PM-deferred to Phase 2 — **the FRD places these in Phase 1** |
| `QF-02` | Certification progress tracking and eligibility reports | 3.5.1, 3.5.2 | Phase 3 in the original FRD |
| `QF-03` | In-platform institutional course creation and module mapping | 3.4.1, 3.4.2 | Phase 2 — creates tension T-1 with Phase-1 requirement 8.1.3 |
| `QF-04` | Class-level performance reports | 11.3.1 | Phase 2 — creates tension T-2 with Phase-1 requirement 8.1.4 |
| `QF-05` | Institutional adoption reports | 11.3.2 | Phase 2 in the original FRD |
| `QF-06` | Institutional usage dashboard and licence utilisation tracking | 8.2.1, 8.2.2 | Phase 2 in the original FRD |
| `QF-07` | XR device registration and metadata tracking | 2.5.1, 2.5.2 | Phase 2 — keeps device screens out of Phase 1 administrative workspaces |
| `QF-08` | Remote device configuration and application updates | 2.6.1, 2.6.2 | Phase 2 in the original FRD |
| `QF-09` | Module lifecycle states and version management | 1.5.1, 1.5.2, 1.6.1, 1.6.2 | Phase 2 — Phase-1 governance runs on gate position instead |
| `QF-10` | Bundle creation, pricing configuration and coupons | 6.3.1, 6.3.2, 6.4.1, 6.4.2 | Phase 2 — creates the Phase-1 question recorded as QP-09 |
| `QF-11` | Institutional invoicing and subscription billing | 9.3.1, 9.3.2 | Phase 2 — creates the Phase-1 question recorded as QP-04 |
| `QF-12` | Real-time ERP provisioning at first login | 7.3.1, 7.3.2 | Phase 2 in the original FRD |
| `QF-13` | XR simulation performance scoring and attempt tracking | 5.4.1, 5.4.2 | Phase 2 in the original FRD |
| `QF-14` | Custom role creation and permission-level access control | 8.3.1, 8.3.2 | Phase 3 — **the reason the seven-role set must be fixed in Phase 1** |
| `QF-15` | SSO role mapping from identity-provider attributes | 7.4.2 | Phase 3 — creates the question recorded as QD-02 |
| `QF-16` | AI learning assistant for learners | 5.5.1, 5.5.2 | Phase 3 — **distinct from requirement 5.1.2, which is Phase 1** |
| `QF-17` | Recommendation engine | 4.5.1, 4.5.2 | Phase 2 — the only consumer of the Phase-1 learning-preferences field |
| `QF-18` | XR telemetry, heatmaps and decision-path analysis | 2.7.1, 2.7.2, 11.4.1, 11.4.2 | Phase 3 in the original FRD |
| `QF-19` | Data protection compliance and retention policies | 10.4.1, 10.4.2 | Phase 2 in the original FRD |

---

## 6. Technical and external dependencies

Each of these sits outside the document and outside the team's control. The final column is the one that matters for sequencing.

| Dependency | Owner | Current status | Impact if unresolved | Required decision | Can Phase-1 architecture and design proceed? |
|---|---|---|---|---|---|
| **Existing XR simulation inventory** | Programme / content owner | Confirmed available (PM-06); the inventory itself is not yet catalogued | Determines what can be published, entitled and delivered at launch | Catalogue the existing builds, formats, versions and device compatibility | Yes |
| **XR build and package ownership** | Vendor organisations / programme owner | Not established | Determines who corrects a returned submission and who maintains a published module | Confirm ownership and support contacts per simulation | Yes |
| **XR integration interfaces** | Team Lead / vendor engineering | Undefined | The delivery mechanism, the completion return path and the assessment consumption path all depend on it | Define the interface contract once the delivery mechanism is selected | Yes — architecture can proceed; delivery build cannot |
| **Identity provider** | Institution / Team Lead | Not selected — PENDING by PM-10 | Institutional authentication and the Phase-1 role-assignment origin | Select the provider and protocol, and define attribute mapping | Yes |
| **SSO configuration model** | Team Lead with institution stakeholder | Requirement confirmed; configuration schema undefined | The Institute Admin configuration surface and the tenant authentication path | Define the configuration fields once the protocol is selected | Yes |
| **ERP provider and APIs** | Institution / Team Lead | Not selected; the FRD names examples only | Automated provisioning, stream mapping and entitlement assignment for every institutional learner | Select the provider per institution and define the integration contract | Yes |
| **Payment gateway** | Commercial owner with Team Lead | Not selected | All B2C purchase, activation and entitlement assignment | Select domestic and international providers and decide redirect or embedded checkout | Yes |
| **Cloud platform and environments** | Team Lead | Not selected; the FRD names providers as examples | Hosting, scaling, storage, and the separation of staging from production the governance chain requires | Select the platform and define the environment topology | Yes — no architectural statement here depends on it |
| **Object storage and content distribution** | Team Lead | Concept confirmed by the FRD; technology not selected | Encrypted asset storage and acceptable delivery latency | Select the storage and distribution technology | Yes |
| **E-mail and notification service** | Team Lead with Project Manager | No Phase-1 requirement exists | Would carry any outbound message; currently nothing requires one | Decide whether any Phase-1 outbound message is required at all | Yes |
| **Content sources and metadata schema** | Content Manager with Team Lead | Schema not enumerated in the FRD | What the content readiness gate actually reviews | Define the module metadata schema and the compatibility criteria | Yes |
| **XR device availability** | Institution / programme owner | Not established | Whether institutional learners can reach VR and MR formats at all | Confirm device fleets per institution and per format | Yes |
| **Subject-matter reviewers and validation criteria** | Academic stakeholder | Reviewers confirmed as a role (PM-07); the criteria they validate against are undefined | The academic validation gate cannot operate without a rubric | Define the engineering curriculum standards used at the validation gate | Yes — the gate is designed; it cannot operate |
| **Analytics and reporting definitions** | Project Manager | Deferred by PM-11 | What any reporting surface beyond operational status can contain | Define metrics, formulas and filters incrementally once core operations exist | Yes |
| **Technology stack** | Team Lead | Not selected | Build, but not architecture — this document is technology-neutral throughout | Select the stack before build begins | Yes |
| **Accessibility conformance target** | Project Manager with design lead | Not stated by any requirement | What the platform commits to, and how known non-conformances are recorded | Approve a conformance level and a position on the outstanding reflow item | Yes |

**Two dependencies block operation rather than build:**

1. **Subject-matter reviewers and validation criteria.** The academic validation gate is fully designed, but it cannot operate until someone owns and states the engineering curriculum standards it validates against (requirement 1.4.2 requires alignment with them and never defines them).
2. **Existing XR simulation inventory.** The platform can be built to ingest, govern and deliver content, but it has nothing to publish until the available simulations are catalogued with their formats, versions and device compatibility.

---

## 7. Recommended next decision point

**A single review session covering five items.** Each is a decision only the stakeholders can take; none requires further analysis first.

| # | Decision needed | Why now | Consequence of deferring |
|---|---|---|---|
| 1 | **Accept the consolidated scope and phasing**, including the recorded certification deviation and the SSO phase resolution | Everything downstream is scoped against it | The requirement baseline stays ambiguous and two readings of Phase 1 remain in circulation |
| 2 | **Accept the seven-role model and the two-plane architecture** | Both are extensions of, or silences in, Platform FRD_v4 and should be explicitly accepted as such | Design proceeds against an architecture nobody has formally accepted |
| 3 | **Direct `QP-02` — who grades descriptive answers** | It is the only open item that can strand a learner mid-progression | Either the grading capability is built on a guess, or descriptive questions cannot be used at all |
| 4 | **Direct `QP-04` — how a Phase-1 institutional licence is transacted** | Institutional billing is Phase 2, so Phase 1 needs licences to exist with no defined transaction | The institutional route cannot be completed end to end |
| 5 | **Select the end-to-end flows for detailed design** | The design process requires the architecture first, and that is now complete | Detailed design either stalls or starts on an unprioritised flow |

**Separately, and on the engineering side:** the XR delivery mechanism (`QT-01`) and the absent AR application architecture (`QT-02`) should be scheduled for technical discovery. Neither blocks design — the delivery contract in the document is deliberately mechanism-neutral — but both block build, and the AR gap is the one place where no requirement exists to build against at all.

---

*This register answers no unresolved question. Where a working position is recorded it is labelled as a working position and remains reversible.*
