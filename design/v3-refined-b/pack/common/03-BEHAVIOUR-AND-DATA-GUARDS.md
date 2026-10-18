# Functional behavior and sample-data guardrails

## Preserve these distinctions

Publication != institutional access != Student entitlement != runtime activity != completion. Preserve every corresponding state and permission. Programme is data on the Student record, not a new required navigation level. Engineering area groups courses; do not add a mandatory Module layer.

First publication: Vendor -> Academic Reviewer -> Content Manager -> Published.
Post-publication correction: Content Manager -> Academic Reviewer -> Super Admin Release/Hold.
Publication and release never grant institution or Student access. A saved correction never silently overwrites the live experiment.

## Later implementation interims supersede older design gaps

The current user-approved local prototype includes the following. Preserve them during redesign; production policies remain open:

- Deterministic sample WEB activity, visibly identified as simulated. Its staged completion is system-owned and unlocks only that format's feedback. Launching, opening a resource, answering a feedback form or elapsed time alone does not complete learning.
- A pre-authorized sample device for Rahul enabling the approved transfer chain. Device transfer is authorization, not shipment or real device registration.
- Versioned local browser persistence with explicit reset. Refresh preserves sample records but signs the tab out. Credentials, sessions and requester tickets are not persistently stored. Separate tabs keep their own identity. Do not reset data or change these semantics merely to match a screenshot.
- Local-only objective-answer marking stand-in using the pinned assessment's key; Faculty still marks written answers and confirms. Preserve versioned attempts and their recorded release terms; do not disclose keys or withheld results.
- Sample identity-collision protections. Adding/importing/assigning people must not silently hijack another sign-in.
- Vendor revision-2 resubmission follows the accepted local-prototype route back to the Academic Reviewer (reported owner-approved PC-66); neutral Vendor-facing wording is retained. Do not undo that route because an older design had a test-only path.

The supplied Phase-4B, Phase-6 and Phase-7 reports are evidence of implementation outcomes, not substitutes for inspecting current contracts in Claude Code. The resubmission and identity safeguards are additionally recorded in the owner's conversation reports; verify the corresponding repository decisions when implementing.

## No accidental policy expansion

- No Decline for institutional requests or device transfers; no manual Mark paid; no direct Create institution action.
- No real SSO, invite delivery, payment provider, refunds, messaging, hardware provisioning or AI provider.
- Assessment rules are per assessment; no universal default pass mark, new timer, extra question types or unauthorized re-marking. Supported question types remain single-choice, true/false and written answer.
- No arbitrary aggregate learning-completion percentage. Keep progress per format, actual reported usage separate and feedback per Student + Experiment + format.
- Do not restore excluded report/settings pages, vendor updates, multi-role chooser or other `designed:false` IDs from V1.
- Preserve 'Composite Wall Conduction' and 'Conduction Through a Composite Wall' as separate records while the duplicate-content decision is open.
- Preserve role-scoped reads and corrections audience filtering. Do not expose hidden fields just to enrich a card.

## V3 design logic is not production or prototype service logic

`SA02.dc.html` has simplified local decision state. It validates a positive licence number, works with a limited sample and includes generic confirmation language. That does not authorize increasing an 'approve smaller' allocation or applying first-activation language to every renewal.

Claude Code must bind existing commands, validation, optimistic revisions, repeated-command protection and returned outcome flags. In particular, do not claim that additional licences or renewals change a plan if the current service returns `planEffect: policy-open` or an equivalent interim. Inspect the actual command result. Preserve a safe refusal or unchanged-plan result where documented.

Likewise the public request's 'Submitted' versus staff 'Under review' labeling must follow the current application and accepted disclosure rules, not a designer's attempt to unify every label.

## Existing unresolved records

The original V3 handoff records conflicting Konark plans, a Godavari extra-licence request partly filled from another record, different course-code scenarios, Sahyadri dates and duplicate SUP-0213 reports. Do not silently choose a winner, remove a pause or overwrite the working world's data.

Design sessions may show distinct, explicitly documented scenarios with different `scenarioId` and `asOf` dates. Keep each scenario internally coherent. Record added illustrative facts and their source in `SCENARIOS.json`; never call them canonical product records. An unknown fact can be omitted or shown using an honest unavailable state.

The real React app uses its current shared world. If that differs from a board's sample, keep the app's facts and reproduce the layout. Do not change the world's clock, sample identities, IDs, grants or counts to satisfy visual snapshots.

## Pending presentation proposals are not implicitly approved policies

Refined B's 'soonest deadline first, then longest wait', linked renewal shortcut and set-up grouping are design proposals embedded in the selected layout. Visual approval does not silently authorize service ranking, new queue semantics or new rights.

Preserve the visual arrangement. During implementation use approved deterministic ordering and valid existing destinations; record a specific unresolved rule if a proposed ranking cannot be supported. Do not launch another aesthetic review over this. Count each semantic work item once; highlighting a record elsewhere does not increase the count. A renewal task and an expiry event can be separate categories only when their meanings are explicitly defined.
