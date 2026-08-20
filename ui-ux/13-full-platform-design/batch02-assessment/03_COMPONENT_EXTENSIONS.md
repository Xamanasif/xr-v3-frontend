# Batch 02 — Component Extensions

Batch 02 reuses the Batch-01 component system wherever one exists (its stylesheet is consumed as a verbatim, byte-identical snapshot — `prototype/batch01-design-system.css` — so the prototype loads from `file://` in Safari; Batch 01 remains the source of truth). This file lists only what assessment UX **adds**. Format: Purpose · States · Accessibility · Origin (♻ reused Batch-01 · ♻✎ reused with modification · ★ new in Batch 02).

## Reused unchanged (♻ — no respecification)

Application shell, side navigation, header, breadcrumb, page header, buttons (all variants), text/textarea/select fields, form validation grammar (summary + inline), search/filter listbar, table, status badge families, alert, toast, confirmation dialog, empty state, loading/spinner, timeline (attempt history reuses the review-history timeline), ladder (module learning sequence reuses the XR-access ladder), kv metadata grid, `sample-tag`, `proto-note`.

## Extended (♻✎)

| Component | Extension |
|---|---|
| **Status Badge** | New assessment sets. Lifecycle: Draft (neutral) · Configured (info) · **Assigned** (success). Learner: Available (info) · Attempt in progress (info) · Passed (success) · Not passed (warning) · **Result pending evaluation** (warning/hourglass) · Module complete (published-dark). Icon + text, never colour alone. |
| **Confirmation Dialog** | Configuration-aware consequence lines (attempts remaining / last attempt / pending-evaluation note); unanswered-questions warning variant for submission. |
| **Timeline** | Attempt-history variant: attempt number + outcome + timestamp (11.2.2). |
| **Ladder** | Learning-sequence variant with an action slot on the assessment row (`.seq .lact`). |
| **Number input** | `.field input[type=number]` styled to the Batch-01 field grammar (Batch-01 covered text/textarea/select only). |

## New (★)

| Component | Purpose · key states · accessibility |
|---|---|
| **Tab Navigation** (`.tabnav`) | Builder sections as sub-routes styled as tabs. States: current (`aria-current="page"`), needs-attention dot + `sr-only` "needs attention". Real links — keyboard/back-button friendly. |
| **Question Type Badge** (`.qtype`) | Identifies MCQ / True-False / Descriptive wherever a question appears. Text label, never colour/icon alone. |
| **AI Draft Badge** (`.ai-badge` + warning badge pair) | Marks AI-generated drafts: "AI-generated draft" + "Review required", dashed border to read as provisional. Also rendered as text in row status. |
| **Question Row** (`.qrow`) | Included-question row in the builder: number, text, type badge, Edit/Remove. |
| **Completeness Checklist** (`.donelist`) | Builder status rail: ok/todo items + detail + the next safe action sentence. States announce in text ("— to do"), not colour alone. |
| **Configuration Group** (`.cfggroup`) | Fieldset+legend grouping for rules (radio pairs with consequence descriptions) and sample-tagged parameter groups; dependent fields disable (penalty ⇔ negative marking, minutes ⇔ timed). |
| **Disclosure List** (`.disc`) | The generated pre-attempt disclosure rows (icon + rule + consequence). Consumed by learner intro and faculty preview. |
| **Preview Banner** (`.previewbar`) | Marks faculty preview as not-recorded learner view. |
| **Attempt Layout** (`.attempt-grid`, `.attempt-top`) | Question area + navigator rail; position + answered count always in text. |
| **Timer Chip** (`.timerchip`) | Only when the assessment has a configured time limit; `low` state under 5 minutes; time also stated in text and in the intro (never the only indication). No enforcement (A6: expiry prompts, never auto-submits). |
| **Answer Option** (`.opt`) | Selectable option row (real radio input inside a label): default/hover/selected/focus-within; static variant for preview. Letter + text. |
| **Descriptive Input** (`.desc-input`, `.savenote`) | Labelled textarea + "Saved in this attempt" indicator + evaluated-after-submission note. |
| **Question Navigator** (`.qgrid`, `.qlegend`) | Numbered buttons: answered / current / unanswered, each with a full `aria-label`; legend in text. Scales with question count (wraps). |
| **Review Row** (`.revrow`) | Pre-submission review: number, question, answer excerpt or "Not answered" (warning), change/answer action. |
| **Result Hero** (`.result-hero`) | pass / fail / pending variants; icon + heading + plain-language consequence; `role="status"`. |
| **Score Line** (`.scoreline`) | Score · percentage · pass mark · answered — tabular numerals, labels in text. |
| **AI Draft Card** (`.aicard`) | Draft question + options (correct marked "visible to faculty only") + Accept / Review & edit / Discard. |
| **Upload Report** (`.uprep`) | Per-row upload outcome list — added rows and individually-reported problem rows (5.1.1 acceptance criterion). |

**Deliberately not built:** grading workspace/rubrics (owner pending), hint controls (pending), per-question correctness review (feedback policy pending), reusable configuration templates (pending), bulk bank actions, sortable tables, notification centre, dark theme, mobile variants.
