# Role status · Academic Reviewer (RV) · FINAL — OWNER APPROVED

Foundation `XR-V3-RB-1.0` · role `RV` · owned designed IDs **6 of 6** (RV-01 to RV-06) · RV-07 excluded by the existing decision · as of 2026-10-21.

## Status

| Level | State |
| --- | --- |
| DESIGN COMPLETE | **Yes** — all six screens and every state in one design |
| CONNECTED PREVIEW COMPLETE | **Yes, inside the role** — one live root, decisions persist across views |
| OWNER VISUAL ACCEPTANCE | **ACCEPTED 2026-10-21** |
| EXPORT | **Done** — FINAL source ZIP and FINAL screenshot ZIP produced on 21 October 2026 from the bytes in project/ |
| ASSEMBLY PENDING | Shared Surfaces (XS) components; React integration (Claude Code) — not started |

Acceptance basis: Owner message of 21 October 2026: "ACCEPTED — Academic Reviewer V3 Complete-Role Design … I approve the final Academic Reviewer visual design covering RV-01 through RV-06 and all 65 boards."

## Supersedes

| Version | Date | State |
| --- | --- | --- |
| completed role | 2026-10-18 | preserved unchanged; superseded |
| visual refinement checkpoint 1 (four anchor screens) | 2026-10-19 | preserved unchanged; reviewed, not approved; superseded |

Integrate this design alone. Do not mix in layouts from the earlier versions.

## Correction applied after acceptance: internal IDs out of reviewer-facing labels

**Internal record IDs removed from reviewer-facing labels on all six screens** (2026-10-21, requested by the owner with the acceptance).

Removed from:

- Review queue row (the record ID under the course; the format badges stay)
- Reviewed by me row (the record ID under the course)
- Identity card eyebrow on RV-03, RV-04 and RV-06 (the type tag and revision stay)
- Breadcrumb current page, which now names the experiment
- Search placeholders and the no-match hints, which no longer offer "ID"

Kept, unchanged:

- Record IDs in the records, the route proposals (/reviewer/submissions/[submissionId], /reviewer/updates/[updateId]), the search index and the audit trail
- Experiment names, course codes, course names, vendor and sender names, revision numbers, version numbers and format labels

Flagged exceptions — each is outside the six reviewer screens or not an internal platform ID:

| Where | Why it stays |
| --- | --- |
| Main.dc.html and Coverage.dc.html name records (SUB-0070, UPD-0006 and others) | integration documentation on the canvas, not product UI; the owner asked for the two data discrepancies to be documented by ID |
| Help & support shows a support reference (SUP-0214) | a reference the reviewer is given so they can quote it, on a borrowed shared (XS) surface, not one of the six reviewer screens — flagged for the owner |
| The VR delivery card shows a vendor package reference (NSS-CW-VR-1.0) | a vendor-supplied build name, not an internal platform record ID |

Verification: The rendered text of all 65 boards — visible copy plus aria-label, title, placeholder, alt and value — scanned for SUB-/UPD-/REQ-/ACC-style IDs: none on any of the 62 reviewer boards. Plus a 32-check end-to-end smoke run at 1440 and 375.

## Coverage

**42 subviews: 30 REDESIGNED, 12 REVIEWED AND UNCHANGED, 0 pending.** Full register in `COVERAGE.md`.

| Screen | Subviews | Redesigned | Reviewed and unchanged |
| --- | --- | --- | --- |
| RV-01 | 3 | 3 | 0 |
| RV-02 | 5 | 4 | 1 |
| RV-03 | 13 | 10 | 3 |
| RV-04 | 6 | 3 | 3 |
| RV-05 | 5 | 4 | 1 |
| RV-06 | 4 | 3 | 1 |
| Boundaries | 3 | 3 | 0 |
| Shell | 3 | 0 | 3 |
| RV-07 | 1 | 0 | 0 |

## Screens

| ID | Screen | Kind | Route proposal | Boards |
| --- | --- | --- | --- | --- |
| RV-01 | Overview | page | `/reviewer` | 6 |
| RV-02 | Review queue | page | `/reviewer/queue` | 10 |
| RV-03 | Review a submission | page | `/reviewer/submissions/[submissionId]` | 13 |
| RV-04 | Review an update | page | `/reviewer/updates/[updateId]` | 10 |
| RV-05 | Reviewed by me | page | `/reviewer/reviewed` | 9 |
| RV-06 | Decided item (read-only) | state | `/reviewer/submissions/[submissionId] (decided, read-only); decided updates use the update route` | 5 |

Per-screen states, actions and evidence are in `ROLE-STATUS.json`.

## Open decisions

| ID | What | How the design treats it | Owner |
| --- | --- | --- | --- |
| OD-B7-15 | UPD-0006 (EEE ZC341) is in the v46 Reviewed by me list but EEE ZC341 is not on the 27 Aug 2026 scope line; Batch 7 records that scope withdrawn on 1 Oct 2026 | left out of Reviewed by me (8 decisions, not 9) and used as the out-of-scope refusal; the record is still in the fixtures, filtered by scope | confirm |
| SUB-0070 outcomes | the v46 queue data gives 3 learning outcomes; board B6-11 shows none | the decided page omits the outcome list and count rather than choosing a number | confirm |
| SUP-0214 | Help & support still shows a support reference | kept: the reviewer needs it to follow up; shared surface, not one of the six screens | say if it should be hidden too |
| XS assembly | shared surfaces are borrowed renderings | replace with the Shared Surfaces components at assembly | none (assembly step) |
| WILP logo | official logo not supplied | reserved slot with a placeholder | supply the asset |

Two of these are sample-data discrepancies to verify at integration; see `SCENARIOS.json` (`conflictsAndOmissions`) and the next section.

## Data discrepancies for integration verification

Neither was invented or silently changed. The design shows the safe reading and flags it.

- **UPD-0006 (EEE ZC341) — scope.** v46 lists this update in Reviewed by me, but EEE ZC341 is not on Prof. Menon’s 27 August 2026 scope line, and Batch 7 records that scope withdrawn on 1 October 2026. Following the effective-scope rule, the design leaves it out of Reviewed by me (**8 decisions, not 9**) and uses it as the out-of-scope refusal example. The record stays in the fixtures, filtered by scope. **Verify against the live scope records**: if the course was in scope on 27 August, the list is 9 and the refusal example needs another record.
- **SUB-0070 — learning outcomes.** The v46 queue data gives **3** learning outcomes; board B6-11 shows **none**. The decided page omits the outcome list and count rather than choosing one. **Verify against the live record** and restore the list once the true count is known.

## Checks

See CHECKS.md. 20 Oct full suite on the then-current bytes: 65 of 65 boards rendered clean; journeys 229/229/230/230 at 1440/1024/768/375; keyboard 20 per width; 320 px reflow 11/11; long-text 21/21; links 36/36/37/37 plus 6 index checks; separator and layout audits clean; axe-core WCAG 2.1 A/AA 0 violations; source checks 22/22. 21 Oct after the internal-ID correction: all 65 boards re-rendered clean, 0 internal IDs in the rendered text of the 62 reviewer boards, 32-check smoke run passed at 1440 and 375.
