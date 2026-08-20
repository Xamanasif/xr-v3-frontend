# Batch 02 — High-Fidelity Interactive Prototype (Assessment)

**Primary Batch-02 deliverable.** Semantic HTML + modern CSS + minimal plain JavaScript. No framework, no backend, no database, no authentication, no real API, **no real AI service, no real scoring service**, no telemetry. All interactivity is local prototype state — one configuration object per assessment drives both the Faculty and the Learner experience (PM-08). It is prototype state only, **not** an API schema proposal (the contract is pending).

## How to open

**Option 1 — directly in a browser (recommended):** open `batch02-prototype.html` by double-clicking, or:

```bash
open "ui-ux/13-full-platform-design/batch02-assessment/prototype/batch02-prototype.html"
```

This works in Safari and Chrome alike, **including the header logo**: Safari blocks parent-directory subresources for directly-opened local files, so the prototype keeps everything it needs inside this folder — `batch01-design-system.css` (a verbatim, byte-identical snapshot of the Batch-01 stylesheet) and `assets/bits-pilani-wilp-logo.png` (a byte-identical local copy of the branding source).

**Option 2 — simple local server** (from the repository root; only QA seeding needs http):

```bash
python3 -m http.server 8080
```

then visit `http://localhost:8080/ui-ux/13-full-platform-design/batch02-assessment/prototype/batch02-prototype.html`.

Best reviewed at **1440px** (also checked at 1280px). Light theme only, as in Batch 01.

## What you land on

The **Prototype Index** (labelled *"Prototype Navigation — Not Product UI"*) linking the two workspaces and five demo paths:

- **A — Faculty happy path:** open the draft *Consolidation Test — Module Assessment* → add questions from the bank → complete the settings (validation included) → preview the learner view → assign to its module.
- **B — AI question assistance:** Question Bank → Generate with AI → loading → drafts marked *AI-generated · Review required* → review & edit / discard / accept. No draft is usable until accepted; a generation-failure simulation is included.
- **C — Learner objective result:** Soil Mechanics (simulation completion already received) → introduction generated from configuration → 5 objective questions → review answers → submit → immediate result → progress updated.
- **D — Descriptive → pending evaluation:** Bernoulli's Theorem → attempt (includes a descriptive answer) → submit → **Result pending evaluation** (no evaluator named, no score) → *Simulate final result received* (PROTOTYPE CONTROL) → final result → progress updated.
- **E — Configuration variation:** change a supported setting as Faculty (e.g. time limit, attempts, negative marking off) → the learner introduction reflects it — including the disclosure **no longer mentioning negative marking** when it is off.

The dark strip on every page is prototype navigation; **Reset demo** restores all sample data. State persists per tab (sessionStorage) so you can move between Faculty and Learner mid-flow — which is exactly how Path E is demonstrated.

## Notes & limits

- **All people, questions, dates and values are SAMPLE DESIGN DATA** (tagged in the UI wherever they could be mistaken for approved values). No number shown is a platform default — whether platform default behaviour exists at all is a pending product decision (QP-21), and none is invented here.
- **Deliberately unresolved, by instruction:** descriptive-grading owner and turnaround (the learner sees only "the required evaluation"; on the Faculty side the topic appears only as a "PROTOTYPE NOTE — NOT PRODUCT UI" annotation, never as product UI) · answer-key/feedback policy (results show score and pass state plus a feedback-policy note; no per-question correctness) · hints (absent) · single- vs multi-select MCQ (single-select shown) · the configuration API contract (nothing here names endpoints or payloads).
- Where the real world would act (the completed evaluation of a descriptive answer, a temporary loading failure, an AI generation failure), the prototype provides clearly-labelled **"PROTOTYPE CONTROL — NOT PRODUCT UI"** buttons rather than pretending the browser can do it.
- Timer expiry prompts the learner to submit; it does not auto-submit (design assumption A6 — enforcement is undecided).
- Help and the account menu are visual-only, as in Batch 01.
- The header logo loads from `assets/bits-pilani-wilp-logo.png` — a **byte-identical local prototype copy** of `branding/bits-pilani-wilp-logo.png` (the source asset is never modified; check for drift with `cmp`). If the image ever fails to load, the graphic is omitted cleanly and the text lockup stands alone — never a broken image.

## Files

| File | Purpose |
|---|---|
| `batch02-prototype.html` | Entry point (mounts the app) |
| `batch01-design-system.css` | **Verbatim, byte-identical snapshot** of `../../prototype/batch01-prototype.css` so the prototype loads styled from `file://` in Safari (which blocks parent-directory subresources for directly-opened files). Batch 01 remains the source of truth — check for drift with `cmp` against the original |
| `batch02-prototype.css` | **Extensions only** — assessment-specific components on the same tokens: one design system, two batches |
| `batch02-prototype.js` | Sample data, the per-assessment configuration objects, views, router, dialogs/toasts; includes a small commented QA-seed hook used by `../qa/qa-seed.html` |
| `assets/bits-pilani-wilp-logo.png` | **Byte-identical local copy** of `branding/bits-pilani-wilp-logo.png` so the header logo renders when the file is opened directly (Safari blocks parent-directory subresources from `file://`). The branding source remains untouched and authoritative |
