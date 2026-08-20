# Batch 01 — Component System

Only components Batch 01 genuinely needs. Each consumes semantic tokens exclusively (see `02_FOUNDATIONS_AND_SHELL.md`). Format per component: **Purpose · States · Variants · Accessibility · Reused where**.

Legend for origin: ♻ reused from Review-005 · ♻✎ reused with modification · ★ new in Batch 01.

---

## Foundation

| Component | Spec |
|---|---|
| **Application Shell** ★ (`SHR-02` rebuilt) | Purpose: one chrome for all workspaces. States: —. Variants: per-workspace nav content + context label only. A11y: `<header>/<nav>/<main>` landmarks, skip link first tab stop, logical order header→nav→content. Reused: every screen. |
| **Side Navigation** ★ | Purpose: workspace navigation. States: default/hover/active/focus. Variants: 2-item minimum (ARV) to 2+ items; badge slot for queue counts. A11y: `<nav aria-label="Workspace">`, `aria-current="page"` on active, 36px targets. Reused: all screens. |
| **Header** ♻✎ | Purpose: brand + account. States: account menu open/closed. Variants: none (identical everywhere). A11y: logo alt text; account menu = button + `aria-expanded` + Esc closes. Reused: all screens. |
| **Breadcrumb** ♻ | Purpose: location + back path. States: link hover/focus. Variants: 2–3 levels. A11y: `<nav aria-label="Breadcrumb">`, current page `aria-current="page"`, not a link. Reused: all detail pages. |
| **Page Header** ♻✎ | Purpose: title, status, primary actions. States: with/without status badge, with/without actions. Variants: list page (title+count), detail page (title+badge+meta+actions). A11y: exactly one `<h1>` per view. Reused: all screens. |

## Actions

| Component | Spec |
|---|---|
| **Primary Button** ♻✎ | Purpose: the single main action of a context. States: default/hover/focus/disabled/loading. Variants: md 40px, lg 44px; danger variant reserved (unused in Batch 01 — no destructive governance action exists). A11y: real `<button>`, loading announces via `aria-busy` + text change, never colour-only. Reused: submit, decisions, publish, Get on device. |
| **Secondary Button** ♻ | Outline/neutral action. Same states. Reused: Request Changes, Save draft, Retry, Refresh status, dialog cancel. |
| **Ghost/Tertiary Button** ♻ | Low-emphasis (view links, dismiss). Reused: table row actions, panel links. |
| **Icon Button** ★ | Purpose: compact single-purpose control (close dialog, dismiss toast). States: hover/focus. A11y: `aria-label` required, ≥24px target. |

## Forms

| Component | Spec |
|---|---|
| **Text Input / Textarea** ♻✎ | States: default/focus/error/disabled/read-only. Label always visible above; helper text slot; error = 1.5px danger border + message with icon, `aria-describedby` + `aria-invalid`. Textarea for descriptions and review comments. Reused: submission form, comment composer, reason field. |
| **Select** ♻ | Native `<select>`, same label/error grammar. Reused: XR format, discipline, supported device (SAMPLE options). |
| **Checkbox / Radio** ♻ | Border n-500 (3:1 rule); selected 1.5px action + fill. Reused: readiness checklist (CM), submission declaration. |
| **File Upload** ★ | Purpose: build package + supporting documents. States: empty (dashed drop area)/uploaded (file row with name·size·remove)/error. **No format promise is made — package format is pending (`QT-05`); helper copy says “Package requirements will be confirmed by the platform team.”** Prototype simulates instantly, no real upload. A11y: the drop area is also a real button; file rows are a list. Reused: S02 build & assets. |
| **Form Validation** ♻✎ | Inline per-field + error summary alert at top on submit, links focus the field. A11y: summary receives focus, fields `aria-invalid`. Reused: S02, Request Changes dialog. |
| **Metadata Group** ★ | Purpose: labelled key–value grid for read-only metadata display (detail/review screens) and its editable form twin. States: read-only/editing. A11y: `<dl>` semantics read-only; labelled inputs editing. **Fields are SAMPLE — the metadata schema is unenumerated (`QD-07`).** Reused: S03, S05, S07, S09, S12. |

## Data / navigation

| Component | Spec |
|---|---|
| **Search** ★ (`SHR-03`) | Input with icon, 280px, filters as you type (prototype: client-side). A11y: labelled, result count announced politely. Reused: queues + lists. |
| **Filter** ★ | Status select/chips beside search. States: active filter shows clear affordance. Reused: submissions list, published list. |
| **Table** ★ | Purpose: queue/list pattern for all six list screens. Row 56px, 1px dividers, header 12px/650 uppercase `text-tertiary`; row hover raised; entire primary cell is the open link. States: populated/empty/filtered-empty. Variants: submissions (vendor), review queue (ARV/CM incl. **Resubmitted marker** + waiting-since), publish queue, published list, learner list uses cards instead. A11y: real `<table>` + `<caption class="sr-only">`, `<th scope="col">`, row action is a real link; status cells icon+text. Reused: S01, S04, S06, S08, S10. |
| **Pagination** ★ | Simple prev/next + count (visual in Batch 01 — sample data fits one page; specified for realism). A11y: `<nav aria-label="Pagination">`, disabled states real. |
| **Tabs** ♻ | Underline tabs, roving tabindex. Reused: review screens (Overview · Build & assets · Documentation · [Academic validation record]); ARV/CM queue↔history could use nav instead — Batch 01 keeps history as separate nav item. A11y: `role="tablist"` pattern with keyboard support. |

## Feedback

| Component | Spec |
|---|---|
| **Status Badge** ♻✎ | Purpose: one glance = one state. 22px, radius 2, 650 11.5px, icon + label, tinted surface + border + text of one semantic hue. **Governance set:** Draft (neutral) · Academic Review (info) · Changes Required (warning) · Resubmitted (info, outline) · Content Readiness Review (info) · Ready to Publish (success-outline) · Published (success). **XR set:** Entitlement active (success) · No access (neutral) · Access denied (danger) · Availability pending (info) · Ready on device (success) · Availability failed (danger) · Completion pending (warning) · Completion received (success). Never colour-alone. Reused: everywhere. |
| **Alert** ♻ | Inline tinted panel, icon + title + body + optional action. Variants: info/success/warning/danger. Reused: Changes Required feedback (warning), validation summary (danger), publish result (success), device failure explanations. |
| **Toast** ♻ | Bottom-left, polite live region, 5s + dismiss. Reused: decision recorded, submitted, resubmitted, published, completion received. |
| **Confirmation Dialog** ♻✎ | 520px, focus trap, Esc, backdrop click does not destroy input. Variants: confirm (Submit/Approve/Publish — states consequence + what happens next) and **input dialog** (Request Changes — required reason textarea, validation, “sends back to vendor” consequence line). A11y: `role="dialog"` `aria-modal` `aria-labelledby`; focus returns to invoker. Reused: S02, S05, S07, S09. |
| **Empty State** ♻✎ (`STATE-05`) | Icon chip + one-line cause + next action if any. Per-surface copy (empty queue ≠ filtered-empty ≠ no submissions yet). Reused: all lists. |
| **Loading / Skeleton** ♻ (`STATE-06`) | Determinate bar where progress is knowable (publishing); honest indeterminate + explanation where not (availability pending). Reduced-motion safe. Reused: S09, S13. |
| **Error State** ♻ (`STATE-03` grammar) | What happened + what to do next + where to get help; **no internal codes**. Reused: delivery failed, availability unknown. |

## Content governance

| Component | Spec |
|---|---|
| **Submission Row** ★ | Table row: name, version chip, status badge, holder (“With Academic Reviewer”), updated. Changes-Required rows get warning-tinted left inset. Reused: S01, S04, S06, S08. |
| **Submission Summary** ★ | Header block on detail/review screens: title, vendor org, XR format badge, target device, version, submitted date. Reused: S03, S05, S07, S09. |
| **Workflow Stage Indicator** ★ | Purpose: gate position at a glance (`QX-08` position: four stages + returned state). Horizontal stepper: Submit → Academic Review → Content Readiness → Publish; states per node: complete (✓)/current (filled)/upcoming (outline)/**returned** (warning ↩ on the gate that returned it). Compact variant for rail. A11y: `<ol>`, each step's state in text (“Academic Review — current”), not colour/shape alone. Reused: S03, S05, S07, S09 (+ learner never sees it — governance-only). |
| **Review Panel** ★ | Rail card holding the decision for the current gate: context line (“Academic review of v2”), Approve (primary) + Request Changes (secondary), links to history. Only renders actions the role holds at the gate it holds — CM panel shows the academic record read-only; SA panel has publish only, **no return action** (`QP-26` pending). Reused: S05, S07 (decision), S09 (publish). |
| **Review Comment** ★ | One comment: author, role, timestamp, body; part of history entries and Changes-Required feedback. A11y: semantic list; timestamps human-readable. Reused: S03, S05, S07, S09. |
| **Comment Composer** ★ | Textarea + guidance (“The vendor sees this comment as the reason for changes”); required when requesting changes, optional note on approve. Reused: S05, S07 (inside decision dialogs). |
| **Changes Required Panel** ★ | Vendor-side warning panel: who requested changes, when, full reason/comments, “Correct submission” CTA. The **loudest** element on a returned submission. Reused: S03 (⑨⑫), summarised on S01 row. |
| **Approval Panel / Record** ★ | Read-only record of a completed gate: decision, decider, role, date, note. SA publish screen shows both records (academic + readiness) before the publish action — the “required prior approvals” evidence. Reused: S07 (academic record), S09 (both records). |
| **Review History Timeline** ★ (`SHR-05`) | The traceability surface (PM-14): every submission/decision/return/comment/resubmission, newest first; entries: actor, role, action, reason excerpt, timestamp, resulting status. Permission-filtered: Vendor sees own submission's history; ARV/CM/SA see it on submissions at/through their gate. Prior-gate decisions **remain visible after resubmission**. A11y: `<ol>` with full-text entries. Reused: S03, S05, S07, S09. |
| **Version / Resubmission Marker** ★ | “v2” chip + “Resubmitted” badge; queues mark resubmitted items so reviewers see returning work; history records version boundaries. Reused: rows, summaries, history. |

## XR (learner)

| Component | Spec |
|---|---|
| **Experiment Card** ♻✎ | My Learning card/row: name, format badge, device line, status badge, progress, primary action. Reused: S11. |
| **XR Format Badge** ♻ | Web/VR/MR/AR, icon + letters + colour (fmt tokens). Reused: S11, S12, S13, governance summaries. |
| **Entitlement Status** ★ | Row in XR Access panel: “Included in your institution's access” (success) / “Not included in your current access” (neutral) / “Access denied” (danger) + explanation + who to contact. B2B copy has **no purchase prompt** (D-01). Reused: S12. |
| **Licence / Access Status** ★ | The execution-time twin of entitlement (checked again before running — FRD 10.1.2); denial explains without internal codes. Reused: S12 ㉜, S13. |
| **Device Compatibility** ★ | Row: required runtime + example supported device (“VR headset — e.g. Meta Quest”); unsupported state names the requirement honestly, never a dead launch button (C-08). Reused: S12, S13. |
| **Device Access Panel** ★ (heart of `LRN-07`/`LRN-15`) | Stacked status rows (entitlement → device → availability → completion) + one contextual CTA (“Get on device” / “Retry” / “Refresh status”). All copy mechanism-neutral; never claims live device observation. Reused: S12 summary, S13 full. |
| **Availability Status** ★ | Availability pending (in-progress, honest waiting copy) / Ready on device (success + “Run it on your supported device” instruction) / failed (retry + help) / unknown (network explanation + refresh). Reused: S13. |
| **Ready-on-Device State** ★ | Success confirmation + what-to-do-next instruction (run on device, then completion reaches your account). Reused: S13. |
| **Completion Pending** ★ | Normal-state (not error) panel: “Completion hasn't reached the platform yet” + Refresh status + when-to-worry guidance. Reused: S12, S13. |
| **Completion Received** ★ | Success state + progress update confirmation + link to Progress. Reused: S12, S13, S14 toast. |

---

### Deliberately not built in Batch 01

Sortable data tables, bulk actions, notification centre, charts, rich text editing, workspace switcher, dark theme, mobile variants — either outside the two flows or pending decisions. Listed so their absence reads as scope, not oversight.
