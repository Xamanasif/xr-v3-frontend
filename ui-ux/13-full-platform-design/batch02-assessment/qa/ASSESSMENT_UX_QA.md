# Batch 02 — Assessment UX & Accessibility QA

**Standard:** designed toward **WCAG 2.2 AA** (Batch-01 / D-11 baseline carried forward).
**Honest position:** ✅ **DESIGN REVIEW COMPLETED** · ⚠️ **IMPLEMENTATION ACCESSIBILITY TESTING NOT PERFORMED** (no assistive-technology pass, no automated audit tooling, no user testing). No conformance claim is made. The prototype is a design artefact, not production code.

---

## 1 · Accessibility design review (assessment-specific; Batch-01 shell findings carry over)

| Area | Position in Batch 02 |
|---|---|
| **Keyboard interaction** | Everything operable is a real `<button>`, `<a>`, or form control. Builder tabs are links (`aria-current="page"`); answer options are labels wrapping real radio inputs (arrow keys work within the group); the question navigator is a set of buttons; dialogs trap focus, Esc closes, focus returns to the invoker. |
| **Visible focus** | Global Batch-01 `:focus-visible` ring; option rows add `:focus-within` outline so the focused radio is visible on the whole row. |
| **Radio/checkbox groups** | Attempt options in `role="radiogroup"` with an aria-label; editor option-marking radios individually labelled ("Mark option A as the correct answer"); settings rule pairs are native radios with visible labels + consequence text. |
| **Question navigation** | Navigator buttons carry full text labels ("Question 3, not answered, current"); position also in text ("Question 2 of 5" + "1 of 5 answered"); legend written in words next to the swatches. |
| **Form labels & validation** | Every field has a visible label (or explicit sr-only label for search/selects); required marked; invalid fields get `invalid` styling + inline message with icon; settings/editor submit renders an **error summary that receives focus** and (settings) links that focus the field. |
| **Descriptive answer area** | Labelled textarea, evaluated-after-submission consequence in text, "Saved in this attempt" indicator not colour-alone. |
| **Timer communication** | Timer appears only when configured; announced in the intro ("the 25-minute time budget starts when you begin"), shown as text (`tabular-nums`), warning state adds colour + is not the only signal (time text itself), and expiry inserts a `role="alert"`-styled prompt plus a polite announcement. **No auto-submit** (A6). |
| **Review & submission** | Unanswered questions listed by number in a warning alert; per-row "Not answered" is text + tinted number chip; the submit dialog states consequences in plain language and is focus-trapped. |
| **Result announcements** | Submission/result transitions announced via the polite live region ("Assessment submitted. Passed, 100 percent." / "Result pending evaluation."); result heroes carry `role="status"`; pending is styled as a normal state (warning tint), never as an error. |
| **Status not colour-alone** | Every badge = icon + words (Assigned, Setup incomplete, Result pending evaluation, Passed · 75%); checklist items append "— to do"; navigator adds dot + label text. |
| **AI draft identification** | Drafts carry two text badges ("AI-generated draft", "Review required") + dashed treatment; row status repeats it; the editor heading says "Review AI-generated draft". Never conveyed by styling alone. |
| **Tables** | Real `<table>` + sr-only captions + `<th scope="col">` on all faculty/learner lists and progress. |
| **Empty states** | Cause-specific copy + next action (empty bank ≠ filtered-empty ≠ no assessments ≠ no drafts awaiting review). |
| **Error recovery** | Intro load-error follows the Batch-01 error grammar: what happened → your data is safe → try again → where to get help. No internal codes anywhere (C-07). |
| **Announcements of state changes** | Draft created, settings saved, assignment made, drafts generated/accepted, upload processed, attempt started, question changes — all mirrored politely. |

### Known gaps (stated, not hidden)

- Reflow/mobile (WCAG 1.4.10) remains out of scope — desktop-first per D-15; carried from Batch 01 (`QX-01`/`QX-02`).
- The attempt's per-question radio groups re-render on question navigation; focus is managed by the harness's main-focus routine rather than moved to the question heading — acceptable in a prototype, note for implementation.
- Timer expiry behaviour (prompt vs enforce) is a design assumption (A6) awaiting a product decision; enforcement UX is not designed.
- Live-region wording is prototype copy; final announcement text should be reviewed with a screen-reader pass during implementation.

---

## 2 · Faculty / Learner comprehension checks (task §53)

**As Faculty:** what exists → list with status + incomplete flags ✓ · what am I creating → builder header + status rail ✓ · how questions enter → bank ("Ready" only; AI drafts blocked until accepted; upload report) ✓ · which values are configurable → settings groups, sample-tagged, "this assessment only" ✓ · what's incomplete → checklist + tab dots + disabled Assign with reason ✓ · connection to Soil Mechanics → context line, assign tab, learner-sequence explanation ✓ · what the learner experiences → Preview (learner view) from the same generator ✓ · AI requires my review → labels, blocked selection, accept dialog ✓.

**As Learner:** why available → module rail + intro "Why is this available?" (simulation completion date) ✓ · configured rules → generated disclosure, labelled as set-by-faculty for this assessment ✓ · how to answer → option rows / textarea, position + saved-as-you-go ✓ · answered vs not → navigator + count + review list ✓ · what happens on submit → configuration-aware dialog (attempts remaining / last attempt / pending note) ✓ · final vs pending → distinct result states, pending explains what happens next ✓ · progress updated → banners + per-module table; module never completes while pending ✓.

---

## 3 · Visual QA

**Method:** every base screen rendered and inspected at **1440px**; representative screens re-checked at **1280px** (faculty list, builder settings, learner intro, attempt). Captures via headless Chrome through `qa-seed.html` + `seed-states/*.json` (partial state patches; `reset=1` starts clean). 26 screenshots in `screenshots/`.

**Defects found and fixed during QA:**

1. Upload-simulated questions were flagged `inBank` but never added to `bankOrder` — they could never render. Fixed (and seed patched).
2. Question editor crashed opening a True/False or descriptive question (option rows always read `q.options`). Fixed with a safe default option set; verified by editing an AI True/False draft.
3. `type=number` inputs missed the Batch-01 field styling (its selector covers text/textarea/select). Styled in the Batch-02 extension sheet; settings screens recaptured.
4. Progress banner prioritised an older "module complete" event over a fresher "result pending evaluation" one. Priority flipped: pending first.
5. `SAMPLE DESIGN DATA` tag wrapped mid-tag in the narrow preview rail. `white-space:nowrap` added; recaptured.

**Checked explicitly:** no horizontal scroll at 1440 or 1280 (header actions wrap gracefully at 1280) · logo loads over http and falls back to the text lockup when blocked (Batch-01 `onerror` pattern, verified in headless captures) · table density and truncation · builder rail answers "what next" in every state · CTA hierarchy (one primary per context) · no misleading scoring language (every number sample-tagged; "for this assessment" phrasing throughout) · dialog behaviour (Esc/backdrop/focus-return) · prototype navigation works across all routes · timer legible and secondary to text position indicators.

**Functional paths executed end-to-end in a real browser before capture:** A (draft → questions → settings incl. validation → preview → assign), B (generate → loading → review → edit → discard → accept · simulated failure), C (intro → attempt → review incl. unanswered warning → submit dialog → immediate result → progress updated), D (mixed attempt → submit → pending → simulate final → progress updated), E (settings change → learner disclosure reflects it, including the negative-marking line disappearing).
