# Batch 03 — Future Figma Handoff Notes

**Figma remains deferred.** Nothing was created, opened, read or modified in Figma for Batch 03, and no Figma tool was called. When the platform-level batches are approved and the Figma phase begins (per PM-02 and the existing `ui-ux/FIGMA_TRANSFER_CHECKPOINT.md` method), Batch 03 adds only these increments on top of the Batch-01 and Batch-02 handoff plans.

## Pages / frames to add

1. **Institute Admin workspace** page — Institution Overview · People (populated / role-filtered / empty / row needing attention) · Person detail (learner with access / learner with none / faculty) · Academic Structure · Stream & Group detail (reached / not reached) · Content Access (populated / one record not reaching learners / **no content access recorded**) · Content Access detail (mapped / unmapped / after mapping) · Access Mapping · Institution Setup · Single sign-on (**four states**: not set up · details saved · check did not succeed · on) · Institution data (healthy / completed with issues / running) · Records needing attention (open / resolved). **~13 frames + state variants.**
2. **Learner access check** — a single verification frame appended to the existing Learner page, in two states (eligible content present / not currently eligible). **It is not a new Learner workspace** and must not be built as one.

## Components to add to the shared library

Operational status card (normal / needs-attention) · attention list item · connection status block (neutral / ok / warn / bad / busy) · setup card · provenance chip (+ the "not recorded" dash) · covered-content row · eligibility row (+ remove control) · reach-flow strip (complete / pending cells) · mapping row + reach pill · issue card (open / resolved) · run-list row · update-summary counts · learner access card · chip filter · rail key–value list · population picker (radio + dependent select) · tab navigation with needs-attention dot · mini label.

Account, content-access and connection **status badges** join the existing badge families. The Batch-01 **stepper** is reused unchanged for the sign-on setup sequence, including its returned/failed node state.

**Reuse from Batch 01 unchanged:** shell, side navigation, header, breadcrumbs, page header, buttons, fields, tables, alerts, toasts, dialogs, empty states, spinner, sample-data tag, prototype-navigation strip.

## Prototype links to wire

Path B is the one that must be interactive in Figma, because it is the batch's proof: **Content Access → a record not reaching learners → Add-eligibility dialog → the same record now reaching an academic stream → Access Mapping without the gap → the learner view with the experiment present.** Include the reverse (remove eligibility → learner view empty) as a paired variant.

Path D (sign-on: not set up → saved → check failed → checked → on) and Path E (institution data: issues → attention list → retry → resolved) each wire as a linear state chain on one frame.

## Carried constraints — these must survive into Figma

- **No commercial vocabulary anywhere.** No price, payment, invoice, checkout, plan, tier, term, renewal, order or purchase control, and no purchase call to action in the empty state.
- **No seat count, cap or utilisation figure.**
- **No packaging noun** for an access record — describe it by the content it covers.
- **No identity-provider or protocol name**, no attribute/claim/certificate field, no role mapping.
- **No integration provider, endpoint, credential, payload, schema or field name.**
- **No expiry behaviour** — effective dates are data only.
- **No audit or change-history timeline** for access, eligibility or configuration.
- **No institution switcher**, no cross-institution figure, no comparison.
- **No assessment, device, course-authoring, dashboard or report surface** in this workspace.
- Every sample value annotated as **SAMPLE DESIGN DATA**, exactly as in Batch 01 and Batch 02.
- Light theme only (the logo constraint carried from Batch 01).
- Annotate the eligibility editor in the Figma frame as **DESIGN ASSUMPTION — REVERSIBLE**, so the frame cannot be read as a confirmed assignment mechanism.

## What must **not** be planned from this batch

Do not plan the full platform screen inventory from Batch 03 — this file covers only the institutional administration increment. The Super Admin workspace, authentication and workspace resolution, B2C commerce, and the remaining Learner and Faculty surfaces are outside it.
