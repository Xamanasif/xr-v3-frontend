# Batch 01 — Scope

**Package:** `ui-ux/13-full-platform-design/` · **Branch:** `uiux/full-platform-design` · **Date:** 2026-08-20
**Deliverable type:** UI/UX design outside Figma — specifications, wireframes, high-fidelity browser prototype. **Figma is deferred.**

Batch 01 proves two end-to-end experiences of the single XR Simulation Learning Platform:

- **FLOW A — Content to Production** (Review-006 FLOW 1, FRD 1.4.1–1.4.5, PM-07 · PM-13 · PM-14): Vendor submission → Academic Review (approve / changes required) → Content Readiness Review (approve / changes required) → Super Admin publication, with vendor correction, resubmission and full review history.
- **FLOW B — Entitled XR Content to Learner Device** (Review-006 FLOW 5, FRD 2.2.2 · 10.1.2, PM-05): published experiment → entitlement → device compatibility → get on device → availability states → completion pending → completion received → progress updated. **The XR delivery mechanism is deliberately not selected** — all copy is mechanism-neutral.

Screen IDs below come from the stable Review-006 inventory (`ui-ux/12-full-platform-reframe/10_FULL_PLATFORM_SCREEN_INVENTORY.md`).

---

## Base screens (14)

| # | Screen ID | Screen name | Role | Flow | Purpose | Base / state | Reused / modified / new | Requirement / source | Pending dependency |
|---|---|---|---|---|---|---|---|---|---|
| S01 | `VND-01` | My Submissions | Vendor | A | Everything the vendor has submitted, with gate position and Changes Required surfaced | Base | **NEW** | FRD 1.4.1 · PM-07 · PM-14 | — |
| S02 | `VND-02` (+`VND-03`, `VND-04` as sections) | New Submission | Vendor | A | Create a draft: experiment details, build & asset upload, metadata; submit for review | Base | **NEW** | FRD 1.4.1, 2.2.1, 1.4.3 | ⚠ package/submission format pending (`QT-05`); metadata schema never enumerated (`QD-07`) — form fields are SAMPLE |
| S03 | `VND-05` (+`SHR-05`) | Submission Detail & Status | Vendor | A | Where my submission is and why: status, holder, reviewer feedback, review history, correct & resubmit | Base | **NEW** | FRD 1.4.1–1.4.5 · PM-14 | — |
| S04 | `ARV-01` | Review Queue | Academic Reviewer | A | Submissions awaiting academic validation, incl. resubmitted items; history of own decisions | Base | **NEW** | FRD 1.4.2 · PM-07 | ⚠ validation rubric undefined (`QD-08`) — drawn as review surface, not rubric |
| S05 | `ARV-02` (+`ARV-03`/`SHR-01` embedded) | Academic Review | Academic Reviewer | A | Review content/metadata/documentation, comment, approve or request changes with reason | Base | **NEW** | FRD 1.4.2 · PM-14 | ⚠ curriculum criteria unowned (`ARV-04` PENDING, not in batch) |
| S06 | `CM-01` | Content Review Queue | Content Manager | A | Academically validated submissions awaiting readiness review | Base | **NEW** | FRD 1.4.3, 8.1.2 | — |
| S07 | `CM-02` (+`SHR-01`, `SHR-05`) | Content Readiness Review | Content Manager | A | Metadata / documentation / compatibility readiness; academic record read-only; approve or request changes | Base | **NEW** | FRD 1.4.3 · PM-14 | ⚠ compatibility criteria pending (`CM-04` folded as a checklist section) |
| S08 | `SA-02` | Publish Queue | Super Admin | A | CM-approved submissions ready for production publication | Base | **NEW** | FRD 1.4.4 | — |
| S09 | `SA-03` (+`SHR-05`) | Publish Experiment | Super Admin | A | Verify prior approvals, publish to production, confirmation and result | Base | **NEW** | FRD 1.4.4 · 1.4.5 | ⚠ no Super Admin return action — decision pending (`QP-26`), deliberately **not** designed |
| S10 | `SA-04` | Published Content | Super Admin | A | Live published experiments | Base | **NEW** | FRD 1.4.4 | — |
| S11 | `LRN-02` | My Learning | Learner | B | Entitled experiments with XR format and progress state | Base | **Reused (modified)** — Review-005 STU-02 layout, reframed content | FRD 8.1.5, 7.2.3, 9.2.2 · PM-09 | — |
| S12 | `LRN-04` + `LRN-07` | Experiment Detail | Learner | B | One experiment: entitlement status, device compatibility, simulation access, completion state | Base | **Modified** — STU-04/STU-07 structure + entitlement-aware access (PM-05) | FRD 3.1.x, 1.2.x, 2.2.2, 10.1.2 · PM-05 | ⚠ delivery mechanism pending by PM instruction (`QT-01`) — copy is mechanism-neutral |
| S13 | `LRN-15` | XR Device Access | Learner | B | Where the experiment is relative to the supported device: availability, failures, completion states | Base | **NEW** | PM-05 · FRD 2.2.2, 12.2.1 · XR model Part 4 | ⚠ same mechanism dependency; storage state held conditional (`QT-15`) |
| S14 | `LRN-13` | Progress | Learner | B | Personal progress; shows the completion landing after Completion Received | Base | **Reused (light)** — STU-13 pattern, sample data | FRD 8.1.5, 11.1.x | — |

**Shared surfaces designed once and embedded** (not counted as base screens): `SHR-02` global shell · `SHR-05` review history & comments (S03, S05, S07, S09) · `SHR-01` module content viewer (tabs inside S05, S07) · `STATE-01` access restricted (S12 variants) · `STATE-05` empty states (queues) · `STATE-06` loading/processing (publishing, availability pending).

---

## Important state variants (31)

| Base | State variants |
|---|---|
| S01 My Submissions | ① populated, mixed gate positions ② empty ③ Changes Required emphasis row |
| S02 New Submission | ④ blank draft ⑤ validation error ⑥ correction mode (editing a returned submission, feedback visible) |
| S03 Submission Detail | ⑦ Draft ⑧ Academic Review (submitted) ⑨ Changes Required — academic, with reason ⑩ Resubmitted (v2) ⑪ Content Readiness Review (academic validation complete) ⑫ Changes Required — content readiness ⑬ Ready to Publish ⑭ Published |
| S04 Review Queue (ARV) | ⑮ queue incl. Resubmitted marker ⑯ empty · History list (same list pattern, own decisions incl. returns) |
| S05 Academic Review | ⑰ under review ⑱ Request Changes dialog (reason required) ⑲ Approve confirmation ⑳ resubmitted view with prior decision visible |
| S06 CM Queue | ㉑ queue ㉒ empty · Reviewed list (same pattern) |
| S07 Content Readiness Review | ㉓ under review (academic record read-only) ㉔ Request Changes dialog ㉕ Approve readiness confirmation |
| S08 Publish Queue | ㉖ queue · empty |
| S09 Publish Experiment | ㉗ ready (gate record) ㉘ publish confirmation dialog ㉙ publishing (progress) → published result |
| S12 Experiment Detail | ㉚ entitled + compatible ㉛ not entitled ㉜ access/licence denied ㉝ unsupported device · web-format variant (runs in browser) |
| S13 XR Device Access | ㉞ availability pending ㉟ ready on device ㊱ delivery failed (retry) ㊲ availability unknown (network) ㊳ completion pending ㊴ completion received |

*(Counting method: numbered chips above = 31 curated important variants; queue-empty duplicates and the S14 “updated” landing are counted once within their rows.)*

---

## Canonical governance status vocabulary (user-facing)

`Draft` → `Submitted` → `Academic Review` → (`Changes Required` ⭢ correction ⭢ `Resubmitted` ⭢ re-enters **the returning gate**) → `Academic Validation Complete` → `Content Readiness Review` → `Ready to Publish` → `Published`.

- “Rejected” is **never** used — the workflow is correction and resubmission (PM-14).
- The vendor always sees **who holds** the submission (“With Academic Reviewer”, “With Content Manager”, “With Platform Administration”) — FRD 1.4.5 expressed positively; **no disabled Publish control exists anywhere in the Vendor workspace**.
- Resubmission re-enters at the gate that returned it (PM-14 working position, `13_PM_CLOSURE_DECISIONS.md` detail #5); earlier approvals remain in history.
- No automatic publication after resubmission. Publication is reachable only through gates ② and ③.
- **No Super Admin return/request-changes action** — pending decision `QP-26`, deliberately not invented.
- Traceability: FRD v5 names the gates “Create & submit → Academic validation → Readiness approval → Publish to production → Published content”, with actions “Approve”, “Changes required — comments / reason”, “Correct and resubmit”. The user-facing labels above are the §25 vocabulary of the same chain; internal IDs and gate numbers never appear in product UI.

## XR access status vocabulary (user-facing, mechanism-neutral)

`Entitlement: Active` / `No access` / `Access denied` · `Device compatibility: Supported (e.g. Meta Quest)` / `Device not supported` · `Get on device` → `Availability pending` → `Ready on device` / `Availability failed` / `Availability unknown` · `Completion pending` → `Completion received` → `Progress updated`.

Copy rule applied throughout: **COPY MAY CHANGE AFTER XR DELIVERY IMPLEMENTATION IS SELECTED.** No APK / store / pairing / QR / deep-link / sync / package language anywhere (C-06, C-08, XR model Part 6 rule 9). Web-format experiments may launch in the browser; VR/MR/AR never claim to run in the desktop browser (PM-03).

---

## Explicitly excluded from Batch 01

| Excluded | Reason |
|---|---|
| Faculty workspace (all `FAC-*`), assessment authoring/configuration | Later batch (PM-08/PM-15 model documented; Flow 4 is Rank 3) |
| Institute Admin workspace (all `IAD-*`), SSO/ERP administration | Later batch (Flow 6 is Rank 4) |
| Authentication screens (`AUTH-01…10`), workspace resolution/chooser | Not needed to prove Flows A/B; prototype uses a clearly labelled non-product Prototype Index instead |
| B2C Explore/checkout/payment (`B2C-01…06`) | Later batch; learner in Batch 01 is a B2B institutional learner (avoids inventing purchase prompts — D-01) |
| Assessment attempt/result screens (`LRN-09…12`) | Retained Review-005 designs; configuration-driven rework belongs with Faculty batch |
| Device binding & replacement (`LRN-16`, `LRN-17`, `SA-12`) | Flow 8; needs no Batch-01 proof |
| Web simulation runtime (`LRN-08`) | KEEP from Review-005; Batch 01 shows only a clearly-labelled sample placeholder for the web launch contrast |
| Version releases (`SA-05`), vendors/reviewers admin (`SA-07/08`), institutions/licensing/platform (`SA-09…14`) | Outside the two flows |
| Certification, analytics dashboards, notifications, custom roles | PM-12, PM-11, no Phase-1 FRD basis, Phase 3 |
| Super Admin “Request Changes / Return” | `QP-26` pending — **must not be invented** |

## Design assumptions in this batch (labelled, reversible)

| # | Assumption | Why safe |
|---|---|---|
| DA-01 | Side navigation within the one shared shell (IA doc sketches flat top items; task brief §14 specifies a side-nav shell). Nav *content* per workspace matches the Review-006 IA. | Chrome decision only; nav items unchanged; reversible in Figma pass |
| DA-02 | Governance display statuses combine the §25 vocabulary with a holder line (“With Academic Reviewer”) per `VND-05` spec | Both are sourced; presentation-level |
| DA-03 | The prototype simulates platform state (submission transitions, completion received) purely client-side, advanced by explicit user actions (e.g. “Refresh status”) | Prototype semantics only; the portal never claims to observe the XR session (D-19) |
| DA-04 | Learner context is B2B institutional (Sample Engineering Institute) | Avoids B2C commerce, excluded from this batch |
| DA-05 | “Review History” for ARV/CM rendered as a list variant of the queue pattern, not a bespoke screen | Same component; keeps batch lean |

All prototype content is **SAMPLE DESIGN DATA** (people, timestamps, experiments, institutions). Sample values are labelled where ambiguity is possible.
