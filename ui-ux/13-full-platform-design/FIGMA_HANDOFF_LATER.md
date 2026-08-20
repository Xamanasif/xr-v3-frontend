# Figma Handoff — Later, If Required

**Figma was deliberately not used in Batch 01.** The design is fully reviewable through the browser prototype. This note records only what a future native-Figma delivery would need, **if** stakeholders require that format after reviewing Batch 01. It is not a plan to build anything now.

## Recommended fresh full-platform file structure

```
00 - Cover & Project Map
01 - UX & Workflows          (Flow A + Flow B diagrams, status vocabularies)
02 - Design System           (tokens → variables, components below)
03 - Shared Platform         (shell, queues/tables, dialogs, states)
04 - Learner
05 - Vendor
06 - Academic Reviewer
07 - Content Manager
08 - Super Admin
09 - Faculty                 (later batch)
10 - Institute Admin         (later batch)
11 - Prototype & Review      (flows wired for Paths A–E)
```

The historical Student file (key recorded in `ui-ux/FIGMA_TRANSFER_CHECKPOINT.md`, still empty/valid) should **not** be extended for the full platform; start the platform file fresh and keep that checkpoint as reference for transfer method and protected-asset rules.

## Reusable visual foundations

- `ui-ux/06-design-system/tokens.css` → Figma variables 1:1 (palette + semantic aliases; light + dark, dark deferred until a reversed logo exists — `QX-07`).
- Type scale, spacing, radii, elevation, focus treatment as documented in `02_FOUNDATIONS_AND_SHELL.md`.
- Logo: `branding/bits-pilani-wilp-logo.png` placed, never re-drawn (protected asset; checksum in the transfer checkpoint).

## Shared components to build first (in order)

1. Shell: header, side navigation (+ workspace context), breadcrumb, page header
2. Status badge set (governance + XR) and XR format badges
3. Table/queue row + list bar (search/filter) + empty states
4. Buttons, inputs/textarea/select, form validation, file upload
5. Workflow Stage Indicator (4 stages + returned state)
6. Review History timeline (SHR-05) + review comment
7. Review/decision panel + confirmation & request-changes dialogs
8. XR access ladder (entitlement → device → availability → completion) + device access panel
9. Alerts, toasts, loading/progress

## Batch-01 screens to transfer (14 base + states)

S01–S10 governance (VND-01/02/05, ARV-01/02, CM-01/02, SA-02/03/04) and S11–S14 learner (LRN-02, LRN-04+07, LRN-15, LRN-13), with the 31 curated state variants listed in `01_BATCH01_SCOPE.md`. Everything is reconstructible from the approved browser prototype (`prototype/`) — layouts, exact copy, token usage, and state logic are all in three readable files; the headless QA screenshots in `qa/screenshots/` double as per-state visual references.

## Suggested native build order

Variables → shared components (above) → S01/S04 queue family → S03/S05/S07/S09 detail family → learner S11–S14 → wire Paths A–E in Figma prototype mode → review page.

**Not planned:** the remaining ~90 platform screens; they follow later batches, not this handoff.
