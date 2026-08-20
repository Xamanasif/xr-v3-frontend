# Batch 02 — Future Figma Handoff Notes

**Figma remains deferred.** Nothing was created or modified in Figma for Batch 02. When the platform-level batches are approved and the Figma phase begins (per PM-02 and the existing `FIGMA_TRANSFER_CHECKPOINT.md` method), Batch 02 adds only these increments on top of the Batch-01 handoff plan:

## Pages / frames to add

1. **Faculty workspace** page — Assessments list, Assessment Builder (Questions / Settings / Assign as variants of one frame + the status rail), Preview (learner view), Question Bank, Question Editor, AI Question Drafts. (~6 frames + state variants.)
2. **Learner assessment** frames appended to the existing Learner page — module sequence state, introduction (generated-disclosure component with 2 contrasting sample configurations), attempt (MCQ / True-False / descriptive variants + navigator), review answers, submit dialog, result (passed / not passed / pending / final-received), progress row states. (~7 frames + variants.)

## Components to add to the shared library

Tab navigation (link-tabs with needs-attention dot) · question type badge · AI draft badge pair · question row · completeness checklist · configuration group (radio-pair rule + sample-tagged parameter grid) · disclosure list row · answer option (radio row: default/hover/selected/focus) · descriptive input with saved note · question navigator cell (answered/current/unanswered) + legend · timer chip (+ low state) · review row · result hero (3 variants) · score line · AI draft card · upload report row. Assessment/learner status badges join the existing badge families. (The Awaiting-evaluation topic is a prototype annotation, not a component — nothing to build for it in Figma.)

**Reuse from Batch 01 unchanged:** shell, nav, header, breadcrumbs, page header, buttons, fields, tables, alerts, toasts, dialogs, timeline, ladder, empty states, sample-data tag.

## Prototype links to wire

Path A (list → builder tabs → preview → assign dialog → assigned), Path C/D (module → intro → attempt → review → submit dialog → result → progress), Path E (settings variant ↔ intro variant pair showing the disclosure difference, including the absent negative-marking line).

## Carried constraints

All parameter values remain **SAMPLE DESIGN DATA** in Figma (annotate frames the same way) · no hints, no answer key/per-question correctness, no grading tool, no evaluator naming, no certification · single-select MCQ until the multi-select decision · light theme only (logo constraint `QX-07`).

Do not plan the full 104-screen inventory from Batch 02 — this file covers only the assessment increment.
