# IA integration record — Institute Admin on foundation XR-V3-RB-1.0

Stage B of the owner's master integration instruction of 21 Oct 2026 (Academic Reviewer →
Institute Admin → Faculty → Student), on `v3/refined-b-ui` after RV (`aa654ab`). The 19 owned ids:
IA-01 … IA-11, IA-13 … IA-20. The excluded ids IA-12, IA-21 and IA-22 stay excluded.

## 1. Base and safety

- Worktree `/Users/mymac/Desktop/AR-VR-v3-ui`, HEAD `aa654ab`, clean at the start of the stage.
- No build ran in this worktree; product and test-hook builds ran in an isolated copy (ports
  3310 / 3520); the worktree's test-hook development server used 3510. Port 3330 (the Content
  Manager review build) was left running; port 3300 was not running.
- The protected original checkout was only read (`1b090c9`, 98 paths). The V1 Public Landing, the
  public pages and the XS, SA, VE, CM and RV screens were not modified, except additive shared
  pieces listed in §6.

## 2. Source and approval

| Item        | Value                                                                                                                                                                                                                                                                                              |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source      | `XR-V3-IA-Final-source.zip`, 269,446 bytes, SHA-256 `055511089966bdcdeee574b646f17251f854338e318ff0edf58006b90a59787e`: “FINAL — OWNER APPROVED (21 Oct 2026)”; canvas https://claude.ai/artifact/VM1CC1Yni43Ngw2bhtgAgb Version 15                                                                |
| Screenshots | `XR-V3-IA-Final-screenshots.zip`, 25,210,120 bytes, SHA-256 `3998c1106a3ad0f28da18bf1922c1066c6a24287c90e0d414a86305fd7491167`; review trail `XR-V3-IA-Final-review-evidence.zip`, 5,668,185 bytes, SHA-256 `7cc34867d4715d300ae3fccd8b0efa12ef0b4ece1cb8afec08235f4f305debd3` (kept by the owner) |
| Coverage    | 19 screens and 76 subviews: 59 REDESIGNED, 17 REVIEWED AND UNCHANGED, 0 pending (`COVERAGE.md`)                                                                                                                                                                                                    |
| Foundation  | `XR-V3-RB-1.0`; `FOUNDATION-LOCK.json` (a sixth lock layout: `byteIdenticalCopies`, `localAdditions` as a list) names the ten base hashes; base sheets byte-identical; one role sheet `ia-role.css`                                                                                                |
| Integrity   | 151 files copied byte for byte to `design/v3-refined-b/roles/IA-v1/`; checksum list beside it: 151 OK                                                                                                                                                                                              |
| Approval    | The export's own status and the owner's master instruction of 21 Oct 2026 naming this package. Implementation acceptance pending the owner's browser review                                                                                                                                        |

## 3. How it sits in the product

- **Shell.** `V3_SHELL_ROLES` adds `tenant_admin`: rail Overview, Content access, Student access,
  People, Requests (the kit's `requests` glyph — a per-role rail-icon map keeps the Super Admin's
  `inbox`), Usage; “Overview · date” in the top line on the Overview; the XS-08 banner (paused /
  inactive) first in the page.
- **Stylesheet.** `ia-scoped.css` from `ia-role.css` in layer `xr.v3.ia` (after `xr.v3.rv`); left
  out: the preview chrome (`ia-pv*`, `ia-lt--pv`) and the borrowed XS families (`ia-acctwrap`,
  `ia-menu*`, `ia-out*`).
- **Components.** `ia.tsx` (shared: list tables, sections, record grid, management toolbar with
  counted segments, grouped table, steps, form column, format badges …) and one module per group:
  `ia-plan`, `ia-access`, `ia-people`, `ia-requests`. Cross-group helpers moved to
  `features/institute/shared/` with frozen APIs; the IA link-target ledger split per group
  (`nav/link-targets-ia/`).
- **Inline styles.** The term bar's data-driven widths are set in one kit place (the recorded
  inline-style exception, as `TermTrack`); the export's static `style=` values are central patches.

## 4. What was integrated

All 19 ids on their normal routes (`/institute/*`), bound to the existing services: plan and
content access (IA-01, 02, 03, 16, 20), student access and groups (IA-04, 05, 07, 14), people
(IA-06, 08, 09, 10, 11, 13, 15), requests and device requests (IA-17, 18, 19). The register
(`V3-STATUS-REGISTER.json`) states each id's states.

No purchasing, approval, entitlement or access behaviour was added or changed: plans
(entitlements), catalogue availability, requests and payments, and student access stay the
services' distinct facts. No service contract, permission or workflow changed.

## 5. Decisions and discrepancies

1. **No internal reference** (the owner's rule for every role, which overrides the export's ACC- /
   REQ- / DTR- labels): no ACC-, REQ-, DTR-, SACC-, GRP- or FMAP- reference in words, accessible
   names, crumbs, eyebrows, dialogs or tab titles; named by content (“your access plan”, the plan's
   dates, the request's kind and date, the student's name).
2. **Facts no read holds are left out:** “Removed from the group”, “Joined a group after its grant”,
   the written-answers-without-a-marker and open-problem-report Overview items, the renewal-requested
   band, IA-06's statuses beyond the directory's three.
3. **Kept product behaviour:** not-found pages (existence not revealed), the IA-14 create page not
   built (D-06: the IA-13 dialog creates groups), IA-09 Remove stays a link to IA-15, the form and
   result of IA-17 on the list page.
4. **Faculty-visible words unchanged:** new IA words are new keys (FA-19/21 read
   `copy/student-access.ts`, `copy/institute-people.ts`).

## 6. What did not change

Shared code touched, additively: the role shell (role set, per-role rail icons, top line), kit
options listed in `COMPONENT-EXTENSIONS.md`, icons (`device`), patch entries, the reviewer- and
institute-only entries of shared registers.

## 7. Tests and results

Builds and browser suites ran in an isolated verification copy (ports 3310 / 3520). The run was
paused overnight (end of day, 21 Oct) with a work-in-progress checkpoint (branch
`wip/ia-checkpoint-2026-10-21`, bundle `XR-frontend-v3-ia-wip-2026-10-21.bundle`) and resumed from
it; the final browser runs below are on the final consolidated code.

| Check                                | Result                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit and integration                 | packages/ui 80 files, 1,299 tests; apps/web 165 files, 7,475 tests; packages/config 379 + scans 46 (IA-v1 151 OK, register 69 migrated, map, scope boundary, no stale exception); typecheck and lint clean                                                                                                                                  |
| IA browser specs                     | package-2a/screens, package-2b/screens, phase-3/institute-requests, phase-3/usage: 52/52 at each of 1440, 1024, 768, 375 (test-hook development server)                                                                                                                                                                                     |
| Whole web browser suite, final build | 1440: 567 passed / 7 skipped; 1024: 506 / 68; 768: 506 / 68; 375: 511 / 63 — 0 failed (skips by design). Cross-role specs moved to the V3 markup with their coverage kept (19 e2e files: flows, the package-2a/2b/phase-3/4a/4b/5/6 demonstrations, navigation, banners, a11y, package-1e journey)                                          |
| Visual parity (v46 harness)          | `gl-01`, `xs-07`, `b1-package-1c`: 21/21, with the Institute Admin's five v46 Help-shell comparisons retired by name under IA-shell. The first run timed out (17 min) waiting for v46 shell elements the V3 shell no longer has; the gl-01 pause helper now also accepts the V3 shell's banner placement (`main#main.rb-page > .rk-banner`) |
| Cascade                              | 148 states × 4 widths at rest / hover / focus: no difference (the export raises its rules to `.rb .ia-…`)                                                                                                                                                                                                                                   |
| Inline styles                        | 73 `style=` in the export accounted for: 35 patched (V3P-16), 9 data-driven term-bar widths (recorded scan exception), the rest preview, borrowed or not drawn                                                                                                                                                                              |
| V3 product captures                  | 10 cases × 4 widths: no overflow, no clipped text, all font weights, no console error, no reference (`productEvidenceIA`)                                                                                                                                                                                                                   |
| Identifier sweep                     | every list page and its record pages as Malnad and Deccan: no internal reference                                                                                                                                                                                                                                                            |
| Integrity                            | handoff-v46 178 · v3-refined-b 46 · XS-v6 125 · SA-v1 29 · VE-v1 85 · CM-v1 140 · RV-v1 120 · IA-v1 151 OK · protected checkout `1b090c9`, 98 paths                                                                                                                                                                                         |

## 8. Limits and items for the owner

- Implementation acceptance is pending the owner's browser review.

## 9. How to review it

Seeded accounts in a fresh sample world: **V. Hegde, Institute Admin, Malnad College of
Engineering (an active plan, ending soon) — `v.hegde@malnad.example`, any password**; S. Kulkarni,
Deccan (paused by BITS) — `s.kulkarni@deccan.example`; R. Bhatt, Konark (no course code) —
`r.bhatt@konarkpoly.edu.in`. Godavari (Meera Iyer) appears after the sample journey onboards it.
Route: Overview (attention, plan card) → Content access (plan strip, experiments by course, course
codes) → Student access (grants by experiment, withdraw) → Give students access (steps) → People
(students, faculty, groups, who teaches what; add, import) → Requests (requests to BITS, device
requests) → Usage.
