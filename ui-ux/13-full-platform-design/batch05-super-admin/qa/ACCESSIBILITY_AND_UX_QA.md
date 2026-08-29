# Accessibility and UX QA — Batch 05

| | |
|---|---|
| **Batch** | 05 — Super Admin + platform-wide administration |
| **Date** | 27 August 2026 · **re-run 29 August 2026** after the authority-safety pass |
| **Targets** | **1440** primary · **1280** secondary |
| **Result** | **All checks pass.** Four automated suites, zero outstanding findings |

---

## 1 · Summary

| Suite | Coverage | Result |
|---|---|---|
| **Accessibility & overflow** — `qa-audit.html` | 21 routes × 2 widths = **42 combinations** | **PASS** — zero findings |
| **Colour contrast** — `qa-contrast.html` | **34 pairs**, read live from the stylesheets | **PASS** — zero failures |
| **Behaviour & state** — `qa-behaviour.html` | **38 assertions** | **PASS** |
| **Requirement safety** — `qa-safety.html` | **489 control labels** across 20 routes | **PASS** |
| Console errors | Every route | **Zero** |
| Network requests | Every route | **Zero** |
| Safari `file://` | In-place self-test | **PASS** |

Results are captured in `screenshots/00-*.png`. All four harnesses are QA-only and ship nothing.

### Re-run — 29 August 2026, after the version-release terminology pass

The authority-safety pass renamed the two release controls (**Release version** / **Hold version**), rewrote the publication-boundary copy on `SA-04` and `SA-05`, and added the `D-01` / `D-02` open-PM-clarification notes. All four suites were re-run against the changed prototype:

| Suite | Re-run result | Delta |
|---|---|---|
| Accessibility & overflow | **PASS** — 42 route/width combinations | none |
| Colour contrast | **PASS** — 34 pairs | none |
| Behaviour & state | **PASS** — **38 assertions**, 0 failures, including byte-identical **Reset Demo** | none |
| Requirement safety | **PASS** — **489** control labels across 20 routes | none — same count |
| Console errors | **Zero** on every route exercised | none |

**Reset Demo was additionally exercised end-to-end in the live prototype**, not only in the harness: a real release decision was taken through the dialog, the serialised state was confirmed to diverge, and **Reset Demo restored a byte-identical serialisation**.

**Both release dialogs were re-read from the live DOM:** *Release version 1.5.0?* → confirm **Release version**; *Hold version 1.5.0?* → confirm **Hold version**. The `SA-02` institution list was re-read and reports **zero** write controls — the only buttons present are prototype chrome (Reset demo, account menu, Sign out).

### Screenshot refresh — 29 August 2026

The whole 38-screenshot set was re-captured headlessly against the current prototype, at the original widths and heights, and each new capture compared byte-for-byte with the one it replaces.

| | |
|---|---|
| **Refreshed** | **18** — `01` `02` `03` `08` `09` `10` `11` `19` `21` `22` `23` `25` `27` `28` `30` `31` `33` `36` |
| **Left untouched** | **20** — byte-identical to a fresh render, so nothing in them had changed |
| **Result** | **37 of 38 are byte-identical to a current-prototype render.** |

The exception is `29-dialog-approve-confirm`. Its screen is the device-request detail, which this work did not touch — but dialog captures are **not deterministic**: Batch 01's `dlgin` entrance animation (`translateY(10px)` + `opacity`) means the capture lands at whatever phase the animation has reached. Two consecutive captures of the *identical* page differ by **11.3 %** of pixels across 286 rows of the dialog region — the same footprint as the difference against the stored file. The stored capture is therefore kept: replacing it would churn the package without changing a pixel of content.

#### Second refresh — 29 August 2026, after the `OQ-03` removal

Removing the student-cap / seat model changed `SA-01`'s *"what this overview does not show"* list, `SA-03`'s readiness ledger, key/value block and workspace list, and `SA-08`'s table. All 38 were re-captured and compared again.

| | |
|---|---|
| **Refreshed** | **11** — `02` `04` `05` `06` `07` `15` `18` `26` `31` `32` `38` |
| **Left untouched** | **27** — byte-identical to a fresh render |
| **Result** | **35 of 38 byte-identical to a current-prototype render** |

The three exceptions are `27` `28` `29`, the dialog captures. Their underlying screens are byte-identical (`09` `10` `11` `33` for `SA-05`, `13` `14` `34` for the device request), so the dialog **content** cannot have changed; the residual difference is the `dlgin` entrance-animation blend, which lands at a slightly different phase depending on machine load — measured at 11.3 % of pixels between two runs on a loaded machine and 1.2 % on an idle one, always confined to the dialog panel. The stored captures are kept.

**The release screens came back byte-identical** — `08` `09` `10` `11` `23` `25` `33` — which independently confirms that widening the table selector from `>` to a descendant combinator produces pixel-identical output.

**No screenshot presents the retired terminology, and none presents a student cap, seat figure or capacity limit.** Every capture in the set is now a render of the current prototype, and the current prototype contains **zero** occurrences of *Release to production*, *Production release* or *Hold release* — verified by grep across the prototype, the wireframes and the QA harnesses. The release surfaces were also inspected by eye: `08` `09` `10` `11` `19` `23` `25` `33` show **Release version** / **Hold version**, and `27` / `28` show *Release version 1.5.0?* and *Hold version 1.5.0?* with matching confirmation labels.

## 2 · Automated accessibility and overflow

`qa-audit.html` loads every route in a same-origin iframe at each target width and checks:

- **horizontal overflow** — document `scrollWidth` against the viewport, plus any element wider than the viewport that is **not** inside an `overflow-x:auto` ancestor;
- `<main>` landmark, labelled navigation landmark, skip link — **on every route, including the prototype index**;
- exactly one `<h1>`; no heading level skipped;
- an accessible name on every `a[href]`, `button`, `select`, `input`, `textarea`;
- a label on every form control;
- a `<caption>` or `aria-label` on every table, and `scope` on every `thead th`;
- no duplicate `id`;
- at most one `aria-current` per navigation landmark;
- `alt` on every image;
- a live region present.

**Result: `ALL CHECKS PASS — 42 route/width combinations`.** → `screenshots/00-automated-audit-result.png`

### Findings raised and fixed during the batch

| Finding | Fix |
|---|---|
| **1280 `/device-requests` — horizontal overflow, `scrollWidth 1323 > 1280`** | Two side-by-side device columns merged into one stacked *Device transfer* cell. Also reads better: the transfer is one movement, not two facts |
| **1280 — the prototype strip wrapped and tucked under the sticky top bar** | Right-hand label shortened; leading label hidden below 1180 px. The strip must not wrap at either target width, because `--protobar-h` is the top bar's fixed sticky offset |
| **Not-found states had no `h1`** | All three now carry `phead(...)` |
| **The prototype index had no `<main>` or skip link** | Both added. Batch 04's index has neither; this is a local improvement, not a change to that batch |
| **Two nested navigation landmarks in the prototype strip** | The inner `<nav>` became a plain `<div>`; the labelled wrapper is the single landmark |
| **Attention-row link names concatenated title + sentence + count** | Each row now carries an explicit short `aria-label`; the sentence stays on screen for sighted readers |

## 3 · Colour contrast

`qa-contrast.html` resolves each token **from the live stylesheets** — so the check cannot drift from the CSS — and measures WCAG 2.1 ratios: 4.5:1 for normal text, 3:1 for non-text boundaries.

**Result: `ALL 34 PAIRS PASS`.** → `screenshots/00-contrast-check-result.png`

### Two inherited corrections, applied locally

**(a) `--text-3` — carried forward from Batch 04.** `#6A7686` measures **4.30:1** on `--surface`. Corrected to **`#5F6B7A`**: 5.43:1 on surface, **4.61:1 worst case** (on `--sunken`), still clearly lighter than `--text-2` so the three-tier hierarchy survives.

**(b) `--control-border` — a new finding, first surfaced by this batch.** `--border-strong` (`#B6C0CD`) measures **1.84:1** against `--surface`. Where it draws the boundary of an **interactive control**, WCAG 2.1 SC **1.4.11** requires **3:1**, because that boundary is the only thing identifying the control.

The token is **not redefined wholesale** — on cards, tables, dividers and dashed notes it is decorative, and darkening those would visibly repaint chrome that Batches 01–04 share. A separate token, **`#7E8A99`** (3.51:1 on surface, 3.39:1 on `--n-25`, 3.24:1 on `--raised`), is applied only to inputs, selects and secondary buttons.

> ⚠ **REFERRED UPWARD — for later consolidation, not fixed by this task.**
> `--text-3` and `--border-strong` behave identically in **Batches 01, 02, 03 and 04**, and are sub-threshold in all of them. These are shared design-system findings. Batch 05 corrects them **locally**; the Batch-01 sheet is unedited and remains the source of truth.

## 4 · Behaviour and state

`qa-behaviour.html` drives the prototype and asserts on state. **38 assertions, all passing.** → `screenshots/00-behaviour-check-result.png`

> **Count corrected, 29 August 2026.** This document previously recorded **31**. The harness has **38 `ok(...)` call sites**, none inside a loop or branch, and a live run reports **38 ✓ / 0 ✗** — so 31 was documentation drift from an earlier iteration. **No test was changed to make the numbers agree**; the documentation was corrected to follow the executable suite. The focusable-control figure in the *Targets* row below was corrected the same way, from 36 to the **33** the run actually reports.

| Group | What is asserted |
|---|---|
| **Baseline** | 2 versions awaiting · 2 requests awaiting · `c_shear` live at 1.4.0 |
| **Controls** | The release screen offers **both** Release and Hold. The request screen offers Approve and **no decline or reject anywhere on it** |
| **Dialogs** | A decision opens a confirmation · `aria-modal` with a labelled title · focus moves in on open · **Escape closes it and does not take the decision** |
| **Release** | The decided version becomes *released*; the module's live version advances |
| **No cross-contamination** | The other awaiting version is untouched · the held version is still held · other modules keep their live version · **device requests are untouched by a release** · **institutions are untouched by a release** |
| **Approve** | The decided request becomes *approved*; the other request is untouched; the already-approved request keeps its date |
| **Reset Demo** | State genuinely diverged first, then **`RESET DEMO restores the EXACT initial state (byte-identical serialisation)`** |
| **Keyboard** | Skip link targets and focuses `<main>` · account menu reports `aria-expanded` · focus moves into the menu · **Escape collapses it and returns focus to the button** |
| **Targets** | **33** focusable controls on the overview *(the harness prints the live figure)*; **every button and nav target is at least 30 px tall** |

## 5 · Requirement safety

**The decisive regression check for this batch.**

`qa-safety.html` walks every route and collects the accessible name of **every actionable control** — buttons, links, selects, menu items — then asserts that none offers a responsibility the audit did not confirm. It matches against 47 forbidden verbs including *publish · unpublish · withdraw · approve content · request changes · return to vendor · reject · decline · suspend · delete · refund · subscription · billing · invoice · purchase · price · seat · add institution · onboard · assign role · invite · revoke · impersonate · custom role · configure sso · configure erp · assessment · answer key · grade · rollback*.

**Result: `PASS — 489 control labels examined across 20 routes; no control anywhere offers an unsupported Super Admin responsibility`.** → `screenshots/00-requirement-safety-result.png`

**Prose is deliberately excluded from this scan.** A boundary note that says *"the Content Manager publishes"* is exactly what this batch is for. Only **controls** are the risk.

### Prose occurrences, reviewed by hand

A separate scan of all 1,998 rendered string literals found the words *publish*, *publication*, *suspend*, *refund*, *billing*, *price*, *seat*, *invoice*, *renewal* and *custom role*. **Every occurrence is one of:**

| Kind | Example |
|---|---|
| A **boundary statement** naming another role | *"Publishing a module is the Content Manager's decision and has already happened for everything listed here."* |
| A **fact** about a module's history | *"Published 11 Aug 2026."* |
| An **explicit exclusion** | *"No publish, unpublish or withdraw — publication is the Content Manager's."* |
| A **marked gap** | *"There is no price, no term, no renewal, no invoice, no plan, no seat count and no student cap — a draft line about seat utilisation is not a settled rule, and this screen does not present one as though it were."* |
| A **source citation** | `publication: FRD 1.4.3 · PM-16 · PM-17` |
| A **recorded deviation** | *"The FRD still assigns publication to the Super Admin at 1.4.4; that is a recorded deviation, left unreconciled in the sources."* |

**None is a Super Admin product action.**

### The specific regression the batch exists to prevent

There is **no route** `Super Admin → Ready to Publish → Publish`. There is no publish control, no publication queue, no return-to-vendor action and no request-changes action anywhere. **`QP-26` is not resolved** and no control assumes an answer to it.

### The complete write surface, enumerated from the source

Three click handlers in the whole prototype mutate state, and they are the only ones:

| Handler | Control | Basis |
|---|---|---|
| `#rel-go` | **Release version** | FRD 2.3.2 · `D-01` **OPEN PM CLARIFICATION** |
| `#rel-hold` | **Hold version** | FRD 2.3.2 · `D-01` **OPEN PM CLARIFICATION** |
| `#req-approve` | **Approve the transfer** *(device replacement only)* | FRD 2.4.2 · FLOW 8 step 3 · AC-28 |

Every other handler is prototype chrome: dialog close, toast dismiss, filter clear, Reset demo, skip link, account menu, Sign out. **There is no cross-tenant write handler, no role-assignment handler and no configuration handler anywhere in the file.**

`#req-approve` is scoped to **device-replacement licence transfer only**. It creates no licence, cancels none, sets no price, touches no subscription, moves no seat and assigns no learner entitlement — the access itself is unchanged, only the device it opens on.

## 6 · Responsive

| Width | Result |
|---|---|
| **1440** | Clean. No horizontal overflow, nothing clipped, all tables and actions fully visible |
| **1280** | Clean. Same, after the two fixes in §2 |
| < 1180 | Prototype strip drops its leading label |
| < 1120 | `.grid-rail` collapses to one column *(Batch-01 rule)* |
| < 1000 | Scope-bar note takes its own line |
| < 980 | Configuration register collapses to one column |
| < 900 | Prototype strip wraps |
| < 740 | Tables scroll inside their card; sidebar becomes a horizontal row |

Below the target widths the design is resilient rather than clipped. **Super Admin is desktop/laptop administration; no mobile administration scope is asserted or implied.**

## 7 · Safari `file://`

Verified **from Safari's own file context** with an in-place self-test, not inferred from the other browsers. The test file was removed after the run.

| Checked | Result |
|---|---|
| Both stylesheets loaded and parsed | ✓ |
| Batch-01 tokens resolved — `--indigo-700` `#2B3982`, `--topbar-h` `64px` | ✓ |
| Batch-05 corrections applied — `--text-3` `#5F6B7A`, `--control-border` `#7E8A99` | ✓ |
| Logo loaded — `naturalWidth > 0` | ✓ |
| Script loaded, executed, set the route, rendered the shell | ✓ |

**Verdict: `SAFARI SELFTEST — PASS`** *(27 August run).*

> **29 August — Safari measured directly, and the reported bug reproduced and explained.**
>
> A manual Safari review reported the release table still rendering *"Soil Mechanics — Direct Shear TestCivil Engineering"* after the table correction had shipped. Apple-Events scripting is disabled on this machine, so Safari was measured a different way: a temporary probe page, served over `http://127.0.0.1` where Safari is same-origin, measured the release table three times per width — with no rule, with the retired `>` rule, and with the shipped descendant rule — and beaconed each result back to the local QA server. The probe was deleted after the run.
>
> | Width | Rule | `display` | Run-together | Clipped | Verdict |
> |---|---|---|---|---|---|
> | 1440 | *none* | `inline` | **5 / 5** | 0 | run-together |
> | 1440 | `>` *(retired)* | `block` | 0 | 0 | separate lines |
> | 1440 | descendant *(shipped)* | `block` | 0 | 0 | **separate lines** |
> | 1280 | *none* | `inline` | **5 / 5** | 0 | run-together |
> | 1280 | `>` *(retired)* | `block` | 0 | 0 | separate lines |
> | 1280 | descendant *(shipped)* | `block` | 0 | 0 | **separate lines** |
>
> **Safari applies both selectors correctly, and the shipped rule passes.** The reported rendering is the *no rule* row: Safari was serving a **cached `batch05-prototype.css` from before the correction existed**. Safari caches `file://` subresources aggressively and does not revalidate them on an ordinary reload — so a manual `file://` review after a stylesheet edit shows the old stylesheet until the cache is cleared. **To re-check by eye: Safari → Develop → Empty Caches (or hold ⌥ and reload), then reopen the page.**
>
> **Still not automated, and not claimed as such:** the original in-place `file://` self-test needs *Allow JavaScript from Apple Events*, which stays disabled — this work does not change Safari settings. What the probe verifies is Safari's **rendering** of the table, which is what was reported. The structural `file://` preconditions below are re-verified statically and **unchanged**: every subresource reference is same-directory or a subdirectory, there is **no external dependency of any kind**, and `batch01-design-system.css` still hashes to `8f9fa1b862f23ca4eeccc50d429bca75`. A final by-eye pass in Safari from `file://`, after emptying the cache, is still worth doing before sign-off.

**Structural preconditions, verified statically:** every subresource reference is same-directory or a subdirectory (no `../`, no absolute, no external host) · no `@import` · no `type="module"` · no `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource` or dynamic `import()` anywhere.

> **Note.** Safari treats each `file://` document as a unique origin, so a cross-document iframe harness cannot work there — which is why the self-test runs in-place rather than through an iframe. The Chrome-based suites in §2–§5 use iframes and are unaffected.

## 8 · Manual checks

| Check | Result |
|---|---|
| All 10 screens + index load; every navigation link resolves | ✓ |
| Unknown route falls back to the index rather than a blank page | ✓ |
| Breadcrumbs correct on every detail screen | ✓ |
| Navigation counts update immediately after a decision, and disappear at zero | ✓ |
| `Platform` parent highlights without claiming `aria-current` when a child is open | ✓ |
| Toasts announce every decision; a polite live region carries the same message | ✓ |
| Empty and settled states are distinct — *"nothing is waiting on you"* is an outcome, not an empty state | ✓ |
| Every source gap replaces a control rather than accompanying a disabled one | ✓ |
| Every ledger row carries a provenance line naming its owning role | ✓ |
| No chart, KPI, metric, trend or cross-institution total anywhere | ✓ |
| Institution figures appear only inside a single institution's page, under a tinted scope bar | ✓ |

## 9 · Screenshots — 42

`screenshots/`, captured headlessly at full resolution.

| Range | Contents |
|---|---|
| `00-*` | **4 QA results** — automated audit · contrast · behaviour · requirement safety |
| `01`–`17` | Index and all ten screens at 1440, including all four institution states and all three release states |
| `18`–`26` | **Seeded states** — nothing waiting · no results · filtered · all-versions · all-requests · just-released · no access records |
| `27`–`30` | **Dialogs and menus** — release confirm · hold confirm · approve confirm · account menu open |
| `31`–`38` | **1280** — overview · institution · release · device request · configuration · institutions · device queue · licensing |

Seeded states use `qa-seed.html` with the seven JSON patches in `seed-states/`. Dialog states use `qa-shot.html`, which drives one control in a same-origin iframe so transient states can be captured without adding any capture hook to the prototype.

**Capture recipe.** Headless Chrome, one fresh profile per capture, `--force-device-scale-factor=1 --hide-scrollbars`, `--window-size` set to each screenshot's own width and height. Seeded captures run twice in the same profile: once against `qa-seed.html?...&store=local&hold=1&reset=1` to write the patch, then again against the route to capture it. The recipe reproduces the 27 August set byte-for-byte on every screen this work did not change, which is what makes the before/after comparison in §1 meaningful.

**`01`–`38` were re-captured on 29 August 2026** and 18 were replaced — see §1. The four `00-*` harness-result captures are from the 27 August run; every suite has been re-run since with the same verdicts, and the only figure that moved is the behaviour assertion count documented in §4.

## 10 · QA harnesses

All QA-only. None ships; none is referenced by the prototype.

| File | Purpose |
|---|---|
| `qa-audit.html` | Accessibility and overflow, every route × both widths |
| `qa-contrast.html` | WCAG contrast, tokens read live from the stylesheets |
| `qa-behaviour.html` | State, cross-contamination, Reset Demo, keyboard, focus, target size |
| `qa-safety.html` | Requirement safety — every control label on every route |
| `qa-seed.html` | One-shot state seeding for capture |
| `qa-shot.html` | Drives one control before capture, for dialog states |
| `seed-states/*.json` | Seven state patches |
