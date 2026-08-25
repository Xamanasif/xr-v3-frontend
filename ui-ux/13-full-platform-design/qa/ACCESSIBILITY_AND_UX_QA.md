# Batch 01 — Accessibility & UX QA

**Standard:** designed toward **WCAG 2.2 AA** (D-11 baseline carried from Review-005).
**Honest position:** ✅ **DESIGN REVIEW COMPLETED** · ⚠️ **IMPLEMENTATION ACCESSIBILITY TESTING NOT PERFORMED** (no assistive-technology pass, no automated audit tooling, no user testing). No conformance/compliance claim is made. The prototype is a design artefact, not production code.

---

## 1 · Accessibility design review (WCAG 2.2 AA lens)

| Area | Position in Batch 01 |
|---|---|
| **Text contrast** | Tokens are the contrast-annotated Review-005 set: body `#161B22` 16.9:1 · secondary `#515D6C` 6.7:1 · tertiary `#6A7686` 4.6:1 · action `#2B3982` 10.3:1 on white. `n-400` used for disabled text only. Timeline notes and helper text use ≥ 4.6:1 tokens. |
| **Status contrast** | Badge text uses `-700` hues on `-50` tinted surfaces (success 146C43, warning 8A5200, danger B3261E, info 1A56C4 ≈ 5.5–6.6:1). VR format `#6B3FA0` on its tint ≈ 6+:1. |
| **Status not colour-alone** | Every badge/state = icon + text (+ shape for stepper/ladder nodes). Returned rows add a left inset + “With: You” text. Stepper states carry literal words (“Current / Complete / Returned / Upcoming”). |
| **Visible keyboard focus** | Global `:focus-visible` 2px ring, 2px offset, never suppressed; applies to nav, rows’ links, buttons, fields, dialog controls. |
| **Logical tab order / structure** | One `<h1>` per view; landmarks (`header/nav/main`); skip link first; DOM order = visual order (content before rail in source only where reading order remains sensible — rail panels follow their content column). |
| **Form labels & errors** | Every field has a visible `<label for>`; required marked; errors = summary alert (focused on submit) + inline `aria-invalid` + `aria-describedby`-style adjacent messages; reason field in Request Changes validates with an explanatory message. |
| **Tables** | Real `<table>` with `sr-only` captions and `<th scope="col">`; row action is a real link; counts announced via visible text. |
| **Dialogs** | `role="dialog" aria-modal aria-labelledby`; focus moves in on open, is trapped (Tab/Shift-Tab cycle), Esc closes, focus returns to the invoker; confirm dialogs state the consequence in plain language. |
| **Buttons/targets** | Global ≥24×24 rule from tokens; buttons 40/44px; nav items 36px; icon buttons ≥32px. |
| **Readable typography** | 15px body, 1.6 line height, no text under 12.5px except uppercase overlines ≥10.5px with wide tracking (non-essential labels); tabular numerals for versions/counts. |
| **Comments/history readability** | Timeline entries are full sentences with actor · role · time; reasons quoted in distinct note blocks; no truncation that hides the reason. |
| **Loading states** | Publishing uses a determinate progressbar (`role="progressbar"`); availability pending uses honest indeterminate copy (no fake percentages); reduced-motion kill switch suppresses all animation. |
| **Empty states** | Cause-specific copy + next action (queue empty ≠ no submissions ≠ filtered empty). |
| **Error recovery** | Every failure state answers: what happened → can I recover → what action → when to contact support (Help is in a consistent location — WCAG 2.2 3.2.6). No internal codes anywhere (C-07). |
| **Status announcements** | `aria-live="polite"` announcer mirrors key transitions (“Submitted… status Academic Review”, “Completion received. Progress updated.”); toasts live in a polite region and are dismissible. |
| **Completion/status semantics** | “Completion pending” is presented as a normal state, not an error; the platform’s refresh-based reflection is stated in plain words. |

### Known gaps (stated, not hidden)

| # | Gap | Why it stands |
|---|---|---|
| A-01 | **WCAG 1.4.10 Reflow remains NOT MET** | Desktop-first scope (D-15) carried from Review-005; extension of the viewport decision to new workspaces is open (`QX-01`/`QX-02`). Layouts use fluid grids so a later reflow pass is not structurally blocked. |
| A-02 | Dialog focus trap is a minimal prototype implementation | Production needs inert-background / focus-sentinel implementation and AT verification. |
| A-03 | Tabs use the ARIA tab pattern with arrow keys, but AT behaviour is untested | Implementation testing not performed. |
| A-04 | Colour-only risk in the stepper connector lines | Mitigated by per-node text states; connectors are decorative. |
| A-05 | Screen-reader phrasing of the XR status ladder unverified | The ladder is an ordered list with text states; needs an NVDA/VoiceOver pass at build time. |

---

## 2 · Visual QA (task §27)

**Method:** the prototype was rendered and exercised in a real browser (all workspaces, every flow path A–E clicked through with the live state machine), then every base screen and important state was captured with headless Chrome at the primary viewport, plus representative pages at 1280px. Captures are in `qa/screenshots/` (deterministic state seeding via `qa/qa-seed.html` + `qa/seed-states/*.json` — QA utilities, not product code).

> **Re-captured after the PM publication correction (2026-08-25) and the D-07/D-08 fixes.**
> Refreshed: `01-prototype-index` · `08-cm-queue` · `09-cm-readiness-review` (now shows **Publish to production**) · `10-cm-published-result` · `11-cm-published-content` · `w1280-cm-publish-ready` · `22-arv-queue-created-submission` (new — a vendor-created submission queued beside the seeded one).
> Renamed, not deleted, as a record of the withdrawn Super Admin publish screens: `superseded-sa-publish-ready` · `superseded-sa-published-content` · `superseded-w1280-sa-publish-ready`.
> Seed fixtures were migrated to the corrected state shape; `state-sa-ready.json` became `state-cm-publish-ready.json`, and `state-created-submission.json` was added.

**Capture inventory: 30 images** — 21 prototype screens/states at 1440px (`01`–`21`), 5 representative screens at 1280px (`w1280-*`), 4 wireframe sections at 1440px (`wf-*`). `file://` loading of the prototype was additionally verified headlessly (README instruction holds without a server).

| Check | Result |
|---|---|
| Viewports inspected | **1440px** (all screens) · **1280px** (representative: vendor detail, academic review, publish, learner device, my learning) |
| Clipped text / overflow / horizontal scroll | None found at either viewport (rail compresses first; tables stay within the content column) |
| Broken tables / overlapping elements | None found |
| Menus / dialogs | Dialogs verified open/validate/confirm/cancel/Esc; account menu is visual-only by scope |
| Spacing/hierarchy | Consistent card/padding rhythm from tokens; each page has exactly one primary action |
| Status visibility | Gate position, holder, and feedback verified visible on every governance screen; XR states verified on list, detail, and device pages |
| Review sequence clarity | Verified: CM queue shows academic-validation provenance; SA shows both approval records before the publish control |
| Misleading XR language | Swept: no store/APK/pairing/QR/sync/transport words; VR labelled “runs on a supported device — not in this browser” |
| Dead ends | None: every state carries a next action or an explicit “who to contact” |
| Prototype navigation | All routes reachable; role strip + index verified; Reset restores initial sample data |

### Defects found during QA — and fixed

| # | Defect | Severity | Fix |
|---|---|---|---|
| D-01 | `<main tabindex="-1">` made any click on non-interactive content focus `main` and **jump the page to the top** (classic click-focus scroll bug) | High (UX) | Tabindex is now applied transiently only when focusing programmatically (route change / skip link), then removed |
| D-02 | Skip link `href="#main-content"` **collided with hash routing** — following it would re-route the SPA to the index instead of skipping | High (a11y) | Skip link now intercepted; focuses `main` directly without touching the hash |
| D-03 | Dialog confirm ran **after** dialog teardown, so any confirm reading its own fields (Request Changes reason, approval notes) threw and the transition silently never happened | Critical (functional) | `onConfirm` now runs before teardown; verified across all six dialogs |
| D-04 | Review History pages duplicated entries: static seed history repeated decisions already derived from full submission records | Medium (data) | Seed history reduced to submissions with no full record and moved from mutable state to code constants; verified duplicate-free |
| D-05 | Sample build filenames used an invented `.xrpkg` extension — readable as a chosen package format while `QT-05` is pending | Medium (scope honesty) | Renamed to neutral labels (“Direct shear test — XR build package (v1)”); affected captures re-taken |
| D-06 | (Observation) Embedded-browser screenshot compositor showed a misplaced sticky bar at exact-maximum fractional scroll | Not a product defect | Not reproducible in normal browsing; page uses standard document flow; no change |
| D-07 | **Header logo never rendered under Safari `file://`** — it was referenced across three parent directories (`../../../branding/…`), and Safari refuses parent-directory subresources for a document opened directly from `file://`. The text fallback hid the failure rather than the failure being noticed. | High (branding) | Logo now loads from `prototype/assets/bits-pilani-wilp-logo.png`, a **byte-identical** copy of the branding master (verified with `cmp`; `branding/` stays the source of truth). Proven in Safari: the local path loads at 632×316, the old parent path is blocked. Text fallback retained. |
| D-08 | **A new vendor submission never reached the Academic Reviewer.** “Submit for review” hard-coded the seeded `soil` record as its target and discarded every entered value, so the reviewer always saw *Soil Mechanics XR Experiment*; “Save draft” overwrote the seeded draft’s title in place; and the vendor list was a hard-coded array of six seeded ids that no new record could join. | Critical (functional) | The form now creates a real record (`createSub`) carrying the entered title and details, with its own id; the vendor list, nav counts and queue ages are derived from state. Seeded records are never reused as containers. Regression-tested end to end, both with and without a changes-required loop. |

### Residual nits (accepted for Batch 01)

- On rows where the submission title equals the experiment name, the subtitle repeats the name (sample-data artefact).
- The breadcrumb on the edit view reads “Submissions / Edit draft” without the submission name; the page header carries the name context instead.

---

## 3 · Role walkthrough test (task §28) — result

- **Vendor:** what I submitted (summary card), where it is (status badge + holder + stepper), what changes are required and who asked (feedback panel with author/role/time/quote), what to change (reason text + correction mode with pinned feedback), how to resubmit (single primary action + consequence dialog), what happened before (full history). ✔
- **Academic Reviewer:** what needs review (queue + count + resubmitted markers), evidence (tabs: overview/build/documentation), approve (Validate) vs request changes (reason required, consequence stated), previous history visible on resubmissions. ✔
- **Content Manager:** what passed academic review (read-only validation record with date/author), what readiness covers (checklist: metadata/documentation/compatibility), **publish vs request changes**, what publishing does (plain-language consequence + confirm), result (publishing progress → live confirmation + published list), prior decisions in history. ✔
- ~~**Super Admin walkthrough**~~ — **not applicable to Batch 01 after the PM publication correction (2026-08-25).** Publication moved to the Content Manager (row above). **Super Admin remains an approved platform role**; it takes no part in the active Batch-01 content-publication workflow, so there is no Batch-01 workspace to walk through, and its detailed responsibilities are **deferred** to a later batch. `QP-26` (Super Admin return authority) **remains OPEN / PENDING** — the PM update addressed publication ownership only. ✔
- **Learner:** do I have access (explicit access row, B2B copy without purchase prompts), is my device supported (named runtime + example device), what “Get on device” means (mechanism-neutral explanation), current availability (status ladder), what happens next (dimmed upcoming steps), has completion reached the platform (pending vs received distinguished; refresh semantics stated), resulting progress (progress page + updated banner). ✔
