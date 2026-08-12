# FRD → UI/UX Coverage Matrix — Phase 1 Student

**Document status:** Initial coverage matrix
**Created:** 2026-08-10
**Basis:** Full 17-page FRD read (Review 001)
**Scope:** All 78 Phase-1 FRD requirements, plus Phase-2/3 requirements that intersect Student concerns

---

---

# ⚠️ Review 002 update — read this first

Confirmed decisions D-01 – D-18 changed the coverage of 19 requirements. The section tables below were written at Review 001; the rows listed here are **superseded**.

## Coverage summary — Review 002

| Category | Review 001 | **Review 002** | Change |
|---|---|---|---|
| **UI** — planned for a Student screen | 21 | **34** | +13 |
| **SHARED** — flow / state / component | 12 | 10 | −2 |
| **SYSTEM** — no direct Student UI | 24 | 24 | — |
| **CLARIFY** — blocked on a question | 9 | 3 | **−6** |
| **OUT** — role, platform, or excluded | 12 | 7 | −5 |
| **Total Phase-1** | 78 | **78** | — |

**Student-facing reach: 33 → 44 of 78 requirements (56%).** Requirements still blocked on a question fell from 9 to 3.

## Reclassified requirements

| FRD | Review 001 | **Review 002** | Driver |
|---|---|---|---|
| 1.1.3 | CLARIFY | **UI** — B2C is a first-class audience | D-01, D-04 |
| 1.2.2 | UI +CLARIFY | **UI** — VR badge, device requirement, *Continue on Meta Quest* | D-09 |
| 1.2.3 | UI +CLARIFY | **UI** — MR badge, lab guidance, *Continue on Ajna Lens* | D-09 |
| 1.2.4 | UI +CLARIFY | **UI** — AR badge, QR continuation, *Continue on Mobile* | D-09 |
| 3.1.2 | UI +CLARIFY | **UI** — PDF + video; required vs optional | D-05, D-08 |
| 3.2.2 | UI +CLARIFY | **UI** — gated sequence, Locked state | **D-07** |
| 4.2.2 | UI +CLARIFY | **UI** — SSO is Phase 1, preferred for B2B | **D-03** |
| 5.2.1 | UI +CLARIFY | **UI** — 10 MCQ, +2/−1/0, max 20 | D-06 |
| 5.3.1 | SHARED +CLARIFY | **UI** — unlimited attempts, history shown | D-06 |
| 5.3.2 | UI +CLARIFY | **UI** — mandatory pre-attempt disclosure | D-06 |
| 6.1.1 | OUT | **UI** — B2C-01, B2C-02, B2C-03 | **D-04** |
| 6.1.2 | OUT | **UI** — bundle purchase | **D-04** |
| 9.1.1 | OUT | **UI** — B2C-03, B2C-04 via secure redirect | **D-04** |
| 9.1.2 | OUT | **UI** — same surface; currency open (Q-35) | **D-04** |
| 9.2.1 | OUT | **UI** — activation confirmed on B2C-05 | **D-04** |
| 9.2.2 | SHARED | **UI** — entitlement lands in My Learning; *Start Learning* | **D-04** |
| 10.2.2 | UI +CLARIFY | **UI** — AUTH-06 with autosave and attempt protection | **D-17** |
| 11.1.1 | UI +CLARIFY | **UI** — four-part completion checklist | **D-08** |
| 11.2.2 | SHARED +CLARIFY | **UI** — attempt history on STU-12 and STU-13 | D-06 |
| 7.4.1 | FUTURE +CLARIFY | **Superseded** — D-03 places SSO in Phase 1 | D-03 |

## Requirements still needing clarification

Only three Phase-1 requirements remain genuinely blocked, down from nine:

| FRD | Question | Why still open |
|---|---|---|
| 3.3.1, 3.3.2 | **Q-12** | Certification issuance is Phase 1; tracking is Phase 3 (3.5.1). No Phase-1 surface is defined for an outcome the FRD promises. |
| 5.2.3 | **Q-24** | Descriptive answers cannot be machine-scored and no Phase-1 grading workflow exists — now more serious, because D-07 gates the next module on *passing*. |
| 4.3.1 | **Q-11** | Which fields are Student-editable vs ERP-controlled. Sync (7.2.1) would silently overwrite local edits. |

## Two cross-cutting obligations

Not tied to any single FRD row, and applying to every screen:

- **D-11 — WCAG 2.2 AA** across all screens, states, and components
- **D-18 — every error, empty, and restricted state** must say what happened and what to do next

---

---

# ✅ Stage 9 — Final coverage audit

**Date:** 2026-08-10 · Audited against the finished screen set: 29 screens specified, 16 rendered at high fidelity, all behaviour specified in `08-prototype/INTERACTION_SPECIFICATION.md`.

## Final position

| Category | R001 | R002 | **Final** |
|---|---|---|---|
| **UI** — realised on a Student screen | 21 | 34 | **34** |
| **SHARED** — flow / state / component | 12 | 10 | **10** |
| **SYSTEM** — no direct Student UI | 24 | 24 | **24** |
| **CLARIFY** — blocked on a question | 9 | 3 | **3** |
| **OUT** — role, platform, or excluded | 12 | 7 | **7** |
| **Total Phase-1** | 78 | 78 | **78** |

**Student-facing reach: 44 of 78 (56%).** Every one of those 44 is realised on a named screen — no requirement is "covered" by a document alone.

## Requirement → screen map

| FRD | Requirement | Realised on |
|---|---|---|
| 1.1.1 | Multi-tenant LMS | Authenticated shell, all screens |
| 1.1.2 | B2B institutional | AUTH-01/02 (SSO), STU-01 (institution label), STATE-01 |
| 1.1.3 | B2C individual | AUTH-01/03, B2C-01 – 05 |
| 1.2.1 | **Web simulation** | STU-07 Web, **STU-08 runtime** |
| 1.2.2 | VR simulation | **STU-07 VR** — badge, device, CTA, D-19 account completion |
| 1.2.3 | MR simulation | STU-07 MR panel — lab guidance |
| 1.2.4 | AR simulation | STU-07 AR panel — QR, mobile CTA |
| 1.3.1/1.3.2 | Tenant isolation | No tenant switcher (A-18R); Explore omitted from B2B DOM |
| 1.3.4 | Tenant-scoped analytics | STU-13 — personal only, no peer comparison |
| 1.4.3 | Module metadata | STU-04 overview, B2C-02 |
| 1.4.4 | Published-only | Entitlement and catalog filtering |
| 2.1.1 | Master VR app | STU-07 VR guidance |
| 2.1.2 | MR sideloaded app | STU-07 MR — institutional support routing |
| 2.2.2 / 10.1.2 | Licence validation | STU-07 launch gate → STATE-01 variant 3 |
| 2.4.3 | Shared institutional devices | STU-07 VR — B2B guidance |
| 2.4.4 | LMS credentials on device | STU-07 — sign-in guidance (⚠ Q-14 under SSO) |
| 3.1.1 | Module = one simulation | STU-04 |
| 3.1.2 | Optional components | STU-04 content-generated sections; STU-05/06 required vs optional |
| 3.2.1 | Course composition | STU-03 |
| 3.2.2 | **Sequencing (gated)** | **STU-03 locked rows**, STU-04 |
| 3.3.1/3.3.2 | Certification | ⚠ **CLARIFY** — hierarchy only (A-12, Q-12) |
| 4.1.1 | Email registration | AUTH-03 |
| 4.1.2 | Social login | AUTH-01 B2C |
| 4.2.2 | **SSO** | **AUTH-01 B2B primary path, AUTH-02** |
| 4.3.1 | Profile | ⚠ **CLARIFY** — AUTH-07, STU-14 (editability Q-11) |
| 5.2.1 | MCQ | STU-10 radiogroup |
| 5.2.2 | True/False | STU-10 variant |
| 5.2.3 | Descriptive | ⚠ **CLARIFY** — STU-12 awaiting-evaluation (A-24, Q-24) |
| 5.3.1 | Randomization / attempts | STU-09 history, STU-12 |
| 5.3.2 | **Negative marking** | **STU-09 mandatory disclosure**, STU-12 breakdown |
| 6.1.1 | Module purchase | B2C-01, B2C-02, B2C-03 |
| 6.1.2 | Bundle purchase | B2C-01, B2C-02 |
| 6.2.1 | Stream licensing | STU-02 entitlements, STU-14 stream |
| 6.2.2 | **Capped licence** | **STATE-01 variant 1** — no purchase prompt |
| 7.1.1/7.1.2 | ERP | AUTH-07 read-only fields |
| 7.2.1 | Scheduled sync | STATE-02 withdrawn-content state (A-20) |
| 7.2.2 | **ERP account creation** | **AUTH-01/02 first-login path** |
| 7.2.3 | Stream assignment | STU-02, STATE-01 variant 2 |
| 8.1.5 | **Student role** | Access → STU-02/03/04 · complete → STU-07/08 · progress → STU-13 |
| 9.1.1/9.1.2 | Payment gateways | B2C-03 → B2C-04 secure redirect |
| 9.2.1 | Licence activation | B2C-05 success |
| 9.2.2 | Entitlement to dashboard | B2C-05 → STU-02 |
| 10.2.1 | Secure auth | AUTH-01 (WCAG 3.3.8) |
| 10.2.2 | **Session expiry** | **AUTH-06** — warn, autosave, resume, attempt not consumed |
| 11.1.1 | **Completion tracking** | **STU-04 checklist**, STU-03, STU-13 |
| 11.1.2 | Time spent | STU-03, STU-13 — course level only |
| 11.2.1 | Assessment scores | STU-12, STU-13 |
| 11.2.2 | Attempt tracking | STU-09 history, STU-12, STU-13 |
| 12.2.1 | CDN delivery | STU-08 determinate asset loading |

## Decision → realisation audit

Every confirmed decision must be visible somewhere. All 19 verified:

| D | Realised |
|---|---|
| D-01 | 10 documented divergences; Explore omitted from B2B DOM |
| D-02 | 78 requirements across 12 sections audited |
| D-03 | AUTH-01 both paths, SSO ordered first for B2B |
| D-04 | B2C-01 – 05 |
| D-05 | STU-05 PDF, STU-06 video with distinct completion rules |
| D-06 | STU-09 all five disclosures · STU-10 timer, hints, navigator · STU-12 breakdown |
| D-07 | STU-03 locked rows, reason readable without interaction |
| D-08 | STU-04 completion checklist — the single source of truth |
| D-09 | STU-07 four format variants, always format/device/access/status |
| D-10 | STU-01 Continue Learning — 1 click to content |
| D-11 | Full WCAG 2.2 AA review, 0 failures |
| D-12 | Every colour via a semantic token; no palette derived from the logo |
| D-13–16 | Student-only, LMS web, 1440px, from scratch |
| D-17 | AUTH-06 — attempt never consumed by auth expiry |
| D-18 | STATE-01 ×4, STATE-02, STATE-03, three payment outcomes |
| **D-19** | **STU-07 VR instruction not warning · "Awaiting device completion" · Check for updates (A-42)** |

## Review-004 re-audit

| FRD | Change |
|---|---|
| **3.1.2** | Learning components now gate in sequence (**D-20**). Required vs optional distinction becomes load-bearing — optional resources are excluded from every gate condition. Realised on **STU-04 states A and B**. |
| **3.2.2** | Unchanged between modules (D-07), now paired with an internal sequence (D-20). Both gates visible on STU-03 and STU-04. |
| **D-05 amendment** | Download is unconditional on PDF (STU-05) and video (STU-06); never contributes to completion. |
| 6.1.1 / 6.1.2 / 9.2.1 | Purchase copy carries **no licence-duration claim** — "lifetime access" withdrawn (A-47, Q-53). |
| 11.2.1 | Score display is **sign-neutral** pending Q-54 (A-46) — no floor applied, no negative special-cased. |

**Coverage counts are unchanged** — D-20 alters *how* 3.1.2 and 3.2.2 are realised, not which requirements reach a Student. Student-facing reach remains **44 of 78 (56%)**, and **all 29 screens are now individually rendered**, so no requirement is carried by a specification alone.

Requirements still blocked remain **3**: Q-11 (4.3.1), Q-12 (3.3.1/3.3.2), Q-24 (5.2.3).

## Review-005 re-audit — D-21 to D-25

| FRD | Change |
|---|---|
| **6.1.1 / 6.1.2** | **D-21 fixes the product taxonomy**: individual Modules and Bundles are the only purchasable types. FRD 6.1.1/6.1.2 name exactly these two, so the design now matches the requirement literally — **Q-46 closed with no invented product.** Courses (3.2.1) stay structural. |
| **3.2.2 / 3.1.2** | **D-22** — D-07's sequence applies in a course context only; a standalone purchased module is immediately Available while **D-20 internal gating persists**. Realised on STU-02/03/04. **Q-47 closed.** |
| **11.2.1** | **D-23** — stored score is raw; **reported score is `max(raw, 0)`**. STU-12 shows the true arithmetic plus the floor. **Q-54 closed.** |
| **11.2.1 / 5.1.1** | **D-25** — per-question **correctness** is now Student-visible; the correct answer, key, and answer text remain prohibited. This protects the Faculty question bank (5.1.1) that randomization (5.3.1) implies is reused. **Q-10 closed.** |
| **9.2.1 / 9.2.2** | **D-24** — licence activation is confirmed on B2C-05, but **no duration is asserted**. An access-duration slot renders only on authoritative entitlement data. |

**Coverage counts unchanged** — D-21–D-25 change *how* these requirements are realised, not which reach a Student. Student-facing reach remains **44 of 78 (56%)**; all 29 screens individually rendered.

**Requirements still blocked: 3** — Q-11 (4.3.1), Q-12 (3.3.1/3.3.2), Q-24 (5.2.3). Unchanged by this review, as instructed.

## Audit result

| Check | Result |
|---|---|
| All 131 FRD requirements accounted for | ✅ |
| All 78 Phase-1 requirements classified | ✅ |
| Every Student-facing requirement lands on a named screen | ✅ 44/44 |
| Every decision D-01 – D-19 realised | ✅ 19/19 |
| Requirements invented | ✅ **None** |
| Assumptions silently promoted | ✅ **None** — 29 labelled |
| Design-supplied items labelled | ✅ 4 — AUTH-05, STU-11, STATE-03, Help |
| Requirements still blocked | 3 — Q-11 (4.3.1), Q-12 (3.3.1/3.3.2), Q-24 (5.2.3) |

---

## Categories

| Category | Meaning |
|---|---|
| **UI** | Planned for a Student-facing screen in this milestone |
| **SHARED** | Realised as a shared flow, state, or component rather than a dedicated screen |
| **SYSTEM** | System / backend behavior with no direct Student UI |
| **CLARIFY** | Coverage cannot be settled until an open question is answered |
| **OUT** | Out of the current milestone — role, platform, or manager-excluded |
| **FUTURE** | FRD Phase 2 or Phase 3 |

A requirement may carry a **primary** category plus a `+CLARIFY` marker where an open question shapes but does not block it.

---

## Coverage summary — Phase 1

| Category | Count | Share |
|---|---|---|
| **UI** | 21 | 27% |
| **SHARED** | 12 | 15% |
| **SYSTEM** | 24 | 31% |
| **CLARIFY** | 9 | 12% |
| **OUT** | 12 | 15% |
| **Total Phase-1** | **78** | 100% |

Of the 78, **33 (42%) reach the Student** as either a screen or a shared state/component. Of those 33, **26 carry at least one `+CLARIFY` marker** — the design surface is well-identified but its detail is under-specified.

---

## Section 1 — Platform Overview

| FRD | Requirement | Category | Coverage |
|---|---|---|---|
| 1.1.1 | Multi-tenant SaaS LMS for institutions and individuals | SHARED +CLARIFY | Authenticated shell; entitlement model · Q-01 |
| 1.1.2 | B2B institutional environment | SHARED +CLARIFY | B2B branch across Flows 1–3, 13 · Q-01 |
| 1.1.3 | B2C individual environment | CLARIFY | B2C branch; catalog S-C1 conditional · Q-01, Q-04 |
| 1.1.4 | Centralized content ownership | SYSTEM | Constrains design: no download, export, or share affordances |
| 1.2.1 | **Web simulation support** | **UI** | **S-12 pre-launch · S-13 runtime** — the only executable format on desktop |
| 1.2.2 | VR simulation support | **UI** +CLARIFY | S-14 XR access information · Q-17 |
| 1.2.3 | MR simulation support | **UI** +CLARIFY | S-14 · Q-17 — access is administratively gated (2.1.2) |
| 1.2.4 | AR simulation support | **UI** +CLARIFY | S-14 · Q-17 — no desktop→mobile handoff exists in the FRD |
| 1.3.1 | Tenant-wise database isolation | SYSTEM | Removes any need for a tenant switcher |
| 1.3.2 | B2C database isolation | SYSTEM +CLARIFY | Implies separate accounts per context · Q-18 |
| 1.3.3 | B2C regional database expansion | SYSTEM | Performance only |
| 1.3.4 | Tenant-scoped analytics | SYSTEM | Bounds S-19 to personal data; no peer comparison |
| 1.3.5 | Cross-tenant governance access | OUT | Super Admin role |
| 1.4.1 | Vendor module submission | OUT | Vendor / Content Manager |
| 1.4.2 | BITS Pilani academic validation | SYSTEM +CLARIFY | Not displayed under A-19 · Q-19 |
| 1.4.3 | Content Manager approval of metadata | SHARED +CLARIFY | Module metadata region on S-10 · Q-06 |
| 1.4.4 | Super Admin production publishing | SYSTEM | Only published modules appear |
| 1.4.5 | Restricted vendor publishing | SYSTEM | — |
| 1.5.x, 1.6.x | Content lifecycle, version management | FUTURE | Phase 2 — **leaves Phase 1 with no defined withdrawal behavior** · Q-20 |
| 1.7.x | Regional CDN, multi-region replication | FUTURE | Phase 3 |

---

## Section 2 — XR Content Delivery Architecture

| FRD | Requirement | Category | Coverage |
|---|---|---|---|
| 2.1.1 | Master VR application (Meta Quest Store) | **UI** +CLARIFY | S-14 — tells the Student where launch actually happens · Q-17 |
| 2.1.2 | MR device application (sideloaded, Ajna Lens) | **UI** +CLARIFY | S-14 — not self-service; directs to institutional support · Q-17 |
| 2.2.1 | Encrypted XR asset bundle packaging | SYSTEM +CLARIFY | Whether web simulations use the same mechanism is unknown · Q-16 |
| 2.2.2 | License-based module access | SHARED | S-20 restricted state; validation gate before S-13 |
| 2.3.1 | Automatic module updates | SYSTEM | Device-side |
| 2.3.2 | Controlled update releases | SYSTEM +CLARIFY | Content can change mid-course · Q-20 |
| 2.3.3 | Module update without app reinstallation | SYSTEM | Device-side |
| 2.4.1 | B2C device binding | OUT +CLARIFY | No device UI under A-14 · Q-14 |
| 2.4.2 | Device replacement authorization | OUT +CLARIFY | Request surface never named in the FRD · Q-14 |
| 2.4.3 | Institutional shared device access | SYSTEM | Explains why no personal binding UI exists for B2B |
| 2.4.4 | Session-based device login with **LMS credentials** | SHARED +CLARIFY | S-14 sign-in guidance · **Q-14 — an SSO-only Student may have no password for a headset** |
| 2.5.x, 2.6.x | Device registration, remote configuration | FUTURE | Phase 2 |
| 2.7.x | XR telemetry and interaction analytics | FUTURE | Phase 3 |

---

## Section 3 — Content Organization & Learning Structure

The densest Student-facing section — 4 of 6 Phase-1 requirements are UI.

| FRD | Requirement | Category | Coverage |
|---|---|---|---|
| 3.1.1 | Module = smallest unit, one XR simulation | **UI** | S-10 module detail — the atomic unit of the whole IA |
| 3.1.2 | Modules **may** include material, instructions, assessments | **UI** +CLARIFY | S-10 sections generated from actual content · S-11 · S-15 · **Q-05 — formats never specified** |
| 3.2.1 | Course composition | **UI** | S-09 course detail |
| 3.2.2 | Course module sequencing | **UI** +CLARIFY | S-09 ordered list · **Q-22 — "recommended" vs "must be completed" in one sentence** |
| 3.3.1 | Certification program structure | CLARIFY | Content hierarchy only under A-12 · Q-12 |
| 3.3.2 | Certification completion criteria | CLARIFY | **Thresholds never quantified anywhere in the FRD** · Q-09, Q-12 |
| 3.4.x | B2B institutional course configuration | FUTURE | Phase 2 — Institute Admin |
| 3.5.1 | Student certification progress tracking | FUTURE | **Phase 3** — why S-19 excludes certification |
| 3.5.2 | Certification eligibility reports | FUTURE | Phase 3 — Faculty / Institute Admin |

---

## Section 4 — User Management & Onboarding

| FRD | Requirement | Category | Coverage |
|---|---|---|---|
| 4.1.1 | Email registration | **UI** +CLARIFY | S-03 · **Q-03 — conflicts with ERP auto-creation (7.2.2), both Phase 1** |
| 4.1.2 | Social login ("may") | CLARIFY | S-01/S-03 secondary action · Q-02 — providers never enumerated |
| 4.2.1 | Institutional account creation | OUT | Institution-facing |
| 4.2.2 | SSO integration | **UI** +CLARIFY | S-01/S-02 · **Q-02 — Phase 1 here, Phase 3 in 7.4.1** |
| 4.3.1 | Profile information collection | **UI** +CLARIFY | S-06 · S-07 · Q-11 editability · **Q-15 — "learning preferences" has no Phase-1 consumer** |
| 4.4.x | Learning data tracking | FUTURE | Phase 2 |
| 4.5.x | Recommendation engine | FUTURE | Phase 2 — also excluded by C-08 |

---

## Section 5 — Learning Experience Features

| FRD | Requirement | Category | Coverage |
|---|---|---|---|
| 5.1.1 | Faculty question bank upload (spreadsheet) | OUT +CLARIFY | Faculty; shapes S-16 question rendering · Q-05 |
| 5.1.2 | Faculty AI question generation | OUT | Faculty-side authoring; not a Student AI feature |
| 5.2.1 | MCQ | **UI** +CLARIFY | S-16 · Q-23 single vs multi-select |
| 5.2.2 | True/False | **UI** | S-16 |
| 5.2.3 | Descriptive questions | **UI** +CLARIFY | S-16 · **S-18 awaiting-evaluation state — Q-24, no Phase-1 grading workflow exists** |
| 5.3.1 | Randomized question order | SHARED +CLARIFY | Confirms multiple attempts exist · Q-07, Q-10 |
| 5.3.2 | Negative marking | **UI** +CLARIFY | S-15 disclosure · S-18 explanation · **Q-25 — FRD never requires telling the Student** |
| 5.4.x | XR assessment integration | FUTURE | Phase 2 |
| 5.5.x | AI learning assistant | FUTURE | Phase 3 — also excluded by C-08 |

---

## Section 6 — Licensing & Monetization

| FRD | Requirement | Category | Coverage |
|---|---|---|---|
| 6.1.1 | Individual module purchase | OUT +CLARIFY | Deferred by C-09 / A-04 · **Q-04 — FRD places this in Phase 1** |
| 6.1.2 | Bundle purchases | OUT +CLARIFY | Deferred · Q-04 |
| 6.2.1 | Stream-based institutional licensing | SHARED +CLARIFY | Explains S-08 content; stream shown in S-07 · Q-26 |
| 6.2.2 | Capped institutional license | SHARED +CLARIFY | **S-20 case 13A — cap-reached state · Q-27, undefined in the FRD** |
| 6.3.x, 6.4.x | Package configuration, coupons | FUTURE | Phase 2 |
| 6.5.x | License lifecycle, grace period | FUTURE | Phase 3 |

---

## Section 7 — Enterprise Integrations

| FRD | Requirement | Category | Coverage |
|---|---|---|---|
| 7.1.1 | Supported ERP systems | SYSTEM +CLARIFY | Makes ERP fields authoritative → read-only in S-06/S-07 · Q-11 |
| 7.1.2 | ERP API integration | SYSTEM +CLARIFY | Courses are pushed, not self-selected · Q-03 |
| 7.2.1 | Scheduled ERP synchronization | SHARED +CLARIFY | Content can change between sessions · S-21 · **Q-20 — no notification mechanism in Phase 1** |
| 7.2.2 | **ERP-based account creation** | **UI** +CLARIFY | S-01 first-login path · **Q-03 — conflicts with 4.1.1** |
| 7.2.3 | Stream-based access assignment | SHARED +CLARIFY | Populates S-08; drives the zero-entitlement state · Q-27 |
| 7.3.x | Real-time ERP provisioning | FUTURE | Phase 2 |
| 7.4.1 | SSO authentication support | FUTURE +CLARIFY | **Phase 3 — contradicts 4.2.2 (Phase 1)** · Q-02 |
| 7.4.2 | Role-based access mapping | FUTURE | Phase 3 |

---

## Section 8 — Administration & Role Management

| FRD | Requirement | Category | Coverage |
|---|---|---|---|
| 8.1.1 | Super Admin role | OUT | Excluded by D-02 |
| 8.1.2 | Content Manager role | OUT | Excluded by D-02 |
| 8.1.3 | Institute Admin role | OUT | Excluded by D-02 |
| 8.1.4 | Faculty role | OUT | Excluded by D-02 |
| 8.1.5 | **Student role** | **UI** +CLARIFY | **The defining requirement.** Access modules → S-08/S-09/S-10; complete simulations → S-12/S-13; view progress → S-19 · Q-28 |
| 8.2.x | Institutional analytics dashboard | FUTURE | Phase 2 |
| 8.3.x | Dynamic role configuration | FUTURE | Phase 3 |

---

## Section 9 — Payment & Billing

| FRD | Requirement | Category | Coverage |
|---|---|---|---|
| 9.1.1 | Indian payment gateways | OUT +CLARIFY | Deferred by C-09 / A-04 · Q-04 |
| 9.1.2 | International payment gateways | OUT +CLARIFY | Deferred · Q-04 |
| 9.2.1 | Automated license activation | OUT +CLARIFY | Deferred · Q-04 |
| 9.2.2 | Entitlement assignment to "the user's dashboard" | SHARED +CLARIFY | **Fulfilled by S-08 My Learning** — see IA §2.1 on why no separate Dashboard exists · Q-04 |
| 9.3.x | Institutional invoicing | FUTURE | Phase 2 |
| 9.4.x | Payment monitoring, grace notifications | FUTURE | Phase 3 |

---

## Section 10 — Security & Compliance

| FRD | Requirement | Category | Coverage |
|---|---|---|---|
| 10.1.1 | XR asset encryption | SYSTEM | Reinforces no-download design |
| 10.1.2 | Secure module authorization before execution | SHARED +CLARIFY | **S-20 case 13C — launch can fail after being initiated** · Q-27 |
| 10.2.1 | Secure login authentication | **UI** +CLARIFY | S-01 · **Q-29 — password policy, MFA, lockout, and reset are absent from the FRD** |
| 10.2.2 | **Session expiry after inactivity** | **UI** +CLARIFY | **S-05** · **Q-30 — no duration, no warning, no treatment of in-progress work** |
| 10.3.1 | VAPT compliance | SYSTEM | — |
| 10.3.2 | Security patch management | SYSTEM | — |
| 10.4.x | Data protection compliance | FUTURE | Phase 2 |

---

## Section 11 — Analytics & Reporting

The only defined sources of Phase-1 progress data.

| FRD | Requirement | Category | Coverage |
|---|---|---|---|
| 11.1.1 | Module completion tracking | **UI** +CLARIFY | S-08 · S-09 · S-10 · S-19 · **Q-31 — the triggering event is never defined** |
| 11.1.2 | Time spent tracking | SHARED +CLARIFY | Course level only under A-28 · Q-28 |
| 11.2.1 | Assessment score tracking | **UI** +CLARIFY | S-18 · S-19 · Q-09, Q-10 |
| 11.2.2 | Attempt tracking | SHARED +CLARIFY | S-12 · S-15 · S-18 · **Q-07 — counted but never limited** |
| 11.3.x | Institutional reporting | FUTURE | Phase 2 |
| 11.4.x | XR simulation analytics | FUTURE | Phase 3 |

---

## Section 12 — Platform Infrastructure & Hosting

| FRD | Requirement | Category | Coverage |
|---|---|---|---|
| 12.1.1 | Cloud infrastructure hosting | SYSTEM | — |
| 12.1.2 | Encrypted asset storage | SYSTEM | — |
| 12.2.1 | CDN-based asset delivery | SHARED +CLARIFY | **S-13 loading state must be designed, not incidental** · Q-16 — payload unknown |
| 12.3.x | Auto-scaling, load balancing | FUTURE | Phase 2 |
| 12.4.x | Multi-region infrastructure | FUTURE | Phase 3 |

---

## Requirements needing clarification before wireframing

| FRD | Question | Why it blocks or shapes design |
|---|---|---|
| 1.1.1, 1.1.2, 1.1.3 | **Q-01** | Determines whether a catalog exists and what My Learning's empty state means |
| 4.2.2 vs 7.4.1 | **Q-02** | SSO is Phase 1 and Phase 3 simultaneously; S-01 cannot be wireframed |
| 4.1.1 vs 7.2.2 | **Q-03** | Two competing account-creation origins, both Phase 1 |
| 6.1.x, 9.1.x, 9.2.x | **Q-04** | FRD Phase 1 vs manager exclusion; changes milestone definition |
| 3.1.2 | Q-05 | Resource format determines S-11 entirely |
| 3.2.2 | Q-22 | Advisory vs enforced changes S-09's interaction model |
| 3.3.2 | Q-09 | Thresholds never quantified; S-18 cannot state a verdict |
| 5.2.3 | Q-24 | No grading workflow; S-18 needs an awaiting-evaluation state |
| 10.2.2 | Q-30 | Expiry during an attempt could destroy work and consume an attempt |
| 6.2.2, 7.2.3, 10.1.2 | Q-27 | Three distinct restricted states, none described |
| 11.1.1 | Q-31 | Completion definition propagates through every progress surface |
| 1.2.2, 1.2.3, 1.2.4 | Q-17 | What the LMS tells a desktop Student about XR modules |

---

## Coverage gaps — design needs with no FRD requirement

Not classified above because they have no FRD source. Each is design-supplied and labelled as such.

| Need | Screen | Assumption | Question |
|---|---|---|---|
| Password reset / account recovery | S-04 | A-29 | Q-29 |
| Logout | Account menu | A-29 | Q-29 |
| Submission confirmation | S-17 | — | — |
| Generic system error handling | S-22 | — | — |
| Pre-launch orientation | S-12 | A-06 | Q-06 |
| XR access information | S-14 | A-17 | Q-17 |

---

## Verification

Every numbered FRD requirement across all 12 sections appears in this matrix. Phase-1 requirements are itemized individually; Phase-2 and Phase-3 requirements are grouped by subsection except where one explains a Phase-1 gap (1.5.x, 3.5.1, 4.5.x, 7.4.1), which are called out individually.

| | Count |
|---|---|
| Phase-1 requirements itemized | 78 |
| Phase-2 / Phase-3 requirements covered by grouping | 53 |
| **Total FRD requirements accounted for** | **131** |

Verified mechanically against the extracted FRD text: 131 unique numbered requirements exist across the document, and all 131 are represented here.

---

## Requirements the FRD does not contain

A second-pass absence sweep searched the full text for UX-critical vocabulary. These terms appear **zero** times across all 17 pages:

| Absent term | Consequence | Tracked as |
|---|---|---|
| accessibility · WCAG · screen reader · contrast · keyboard | **No accessibility standard exists anywhere in the FRD**, despite this being an educational platform and despite `09-accessibility/` existing in the agreed structure | **Q-33** |
| localization · language · translation | No i18n requirement, despite international payment gateways (9.1.2) and regional B2C databases (1.3.3) planning for global learners in Phase 1 | **Q-32** |
| password reset · forgot · logout · sign out | No account recovery or sign-out path, despite mandated password authentication (4.1.1, 10.2.1) | Q-29 |
| search | Confirms the IA decision to exclude a Student search destination was correct — it would have been invented | — |
| due · tutorial · help | No Student deadlines, guided onboarding, or help system defined — confirms excluding a Calendar destination | — |

Terms appearing only once, each confirming an existing finding: **browser** (1.2.1 only — no browser support matrix, Q-16); **notification** (9.4.2 only — Phase 3, institution-facing, so no Student notifications in Phase 1, Q-20); **deadline** (9.4.2 only — license renewal, not a Student deadline); **mobile** (1.2.4 only — AR, no conflict with desktop-first).

Terms **responsive** and **dark** appear zero times, confirming nothing in the FRD conflicts with the desktop-first decision (D-04).
