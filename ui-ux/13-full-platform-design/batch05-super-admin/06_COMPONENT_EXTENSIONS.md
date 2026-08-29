# 06 — Component Extensions

| | |
|---|---|
| **Document ID** | `BATCH05_COMPONENT_EXTENSIONS` |
| **Batch** | 05 — Super Admin + platform-wide administration |
| **Date** | 27 August 2026 |
| **Extends** | `ui-ux/13-full-platform-design/03_COMPONENT_SYSTEM.md` (Batch 01) — **read-only, not modified** |
| **Stylesheet** | `prototype/batch05-prototype.css` — loads after `batch01-design-system.css` and only **adds**, with the three commented exceptions in §5 |

---

## 1 · What Batch 05 reuses unchanged

The whole Batch-01 component system. `batch01-design-system.css` is a **byte-identical** snapshot of `../../prototype/batch01-prototype.css` — verified with `cmp` and `sha256`:

```
md5    8f9fa1b862f23ca4eeccc50d429bca75
sha256 1e796f5f7fbfe35780b9d702ff1ccff62b7469ab5d872c1bef91d06f74aaa1c0
```

Reused without modification: the app shell (`.app` · `.topbar` · `.snav` · `.frame` · `.main`), page furniture (`.crumb` · `.phead` · `.grid-rail` · `.stack`), cards (`.card` · `.tablecard`), buttons (`.btn` and its variants), badges (`.badge` · `.fmt` · `.vchip` · `.sample-tag`), tables (`.dt` · `.listbar` · `.searchbox`), alerts, forms, the ladder (`.ladder`), the timeline (`.timeline`), dialogs (`.scrim` · `.dialog`), toasts, empty states, and the prototype strip (`.protobar`).

**No Batch-01 token, component or selector is redefined**, with the three deliberate, commented exceptions below.

## 2 · New components

Five, plus four small shared pieces. Each exists because a Batch-05 idea had no Batch-01 expression.

---

### `SA-C1` · Scope bar — `.scopebar`

**The structural half of `AC-04`.** Every Super Admin surface declares its scope in the same place, in the same shape, immediately below the breadcrumb.

| Variant | Class | Appearance | Used when |
|---|---|---|---|
| Platform | `.scopebar` | Neutral — `--n-25` on `--border`, globe icon | The platform plane. No institutional figure may appear on the page |
| Institution | `.scopebar.inst` | **Tinted** — `--sim-surface` on `--sim-border`, building icon | Inside exactly one institution |

```html
<div class="scopebar inst">
  <span class="sc-ic">⌂</span>
  <span><span class="sc-k">Viewing institution</span><br>
        <span class="sc-v">Meridian College of Engineering</span></span>
  <span class="sc-note">Everything on this page belongs to this institution alone.
        Nothing here is combined with any other institution.</span>
</div>
```

**Why tinted.** The moment of crossing into a tenant must never be invisible. Colour is not the only carrier: the key line changes from *Viewing* to *Viewing institution*, the icon changes, and the note changes.

**Responsive.** Below 1000 px the note drops to its own full-width line rather than compressing.

---

### `SA-C2` · Boundary note — `.boundary`

**The component this batch uses most, and its signature idea.** Where a surface shows something another role owns, it says so — in product language, next to the thing itself.

| Variant | Class | Used for |
|---|---|---|
| Neutral | `.boundary` | A structural limit — *"only individual learners appear here"* |
| Owner | `.boundary.owner` | Naming the role that **does** own it — tinted `--sim-surface`, people icon |

```html
<div class="boundary owner">
  <svg class="ic">…</svg>
  <div><span class="bt">Why there is no edit control on this page</span>
    <p>Everything above is configured inside the institution by its own
       Institute Admin… <span class="cite">FRD 1.3.5 · PM-13</span></p></div>
</div>
```

**Why the owner variant is tinted rather than warned.** *"Someone else owns this"* is a fact about the platform, not a problem with the screen. A warning treatment would read as an error.

**Design rule.** A boundary note names **a role and a requirement**. A note that says only *"you cannot do this here"* has not earned its place.

---

### `SA-C3` · Source gap — `.gap`

Where a Phase-1 requirement exists but its mechanism does not, the screen says so and offers no control.

```html
<div class="gap">
  <div class="gh"><svg class="ic">?</svg>
    <span class="gt">There is no way to decline a request</span>
    <span class="gtag">FRD 2.4.2 · PENDING DECISION</span></div>
  <p>The requirement gives this role one outcome — approval — and describes
     no rejection path…</p>
  <p>Rather than show a decline control that would not work, or a greyed-out
     one implying the route exists, the gap is stated here.</p>
</div>
```

**Dashed border, deliberately unfinished-looking, and never styled as an error.** A gap is a state of the requirement set, not a fault in the platform.

**Design rule — the one that matters.** A gap note **replaces** a control; it never accompanies a disabled one. A greyed-out button implies the route exists and is merely unavailable, which is the opposite of true.

Used on: `SA-02` (who registers an institution), `SA-03` (what *manage* authorises), `SA-04` (learner notification), `SA-06` · `SA-07` (no decline), `SA-08` (the commercial model), `SA-09` (role assignment, and who provisions vendors).

---

### `SA-C4` · Attention list — `.attn`

`SA-01`'s only content. A **work list, not a KPI row**: every item is a thing to open, never a number to admire.

```html
<a class="attn-row act" href="#/releases"
   aria-label="2 module versions awaiting a release decision">
  <span class="a-ic">▣</span>
  <span class="a-body">
    <span class="a-t">Module versions awaiting a release decision</span>
    <span class="a-d">A new version of a published module is ready…</span></span>
  <span class="a-count"><span class="a-n">2</span><span class="a-nl">versions</span></span>
  <span class="a-go">›</span>
</a>
```

| Variant | Class | Used for |
|---|---|---|
| Action | `.attn-row.act` | Something this role decides |
| Watch | `.attn-row.warn` | Something to be aware of that another role resolves |
| Settled | `.attn-clear` | **Nothing is waiting.** Not an empty state — an outcome |

**Accessibility note.** The row is one link wrapping a heading, a sentence and a count, so its accessible name would otherwise concatenate all three into an unusable string. Every row carries an explicit `aria-label` giving the action and the number and nothing else; the sentence stays on screen for sighted readers.

**Why `.attn-clear` is not an empty state.** *"Nothing is waiting on you"* is the successful outcome of this workspace, not the absence of content. It gets a settled, affirmative treatment.

---

### `SA-C5` · Readiness ledger — `.ledger` · `.led`

`SA-03`'s core. Three rows, always all three, in the same order — a missing fact is shown as missing rather than omitted.

| State | Class | Icon |
|---|---|---|
| In place | `.led.ok` | check, success ring |
| Failing | `.led.warn` | triangle, warning ring |
| Not yet | `.led.todo` | minus, **dashed** ring |

Each row carries a **provenance line** (`.l-p`) naming the owning role and the requirement — see [`05_CROSS_TENANT_MODEL.md`](05_CROSS_TENANT_MODEL.md) §5. **Present on every row without exception**: it is the reason there is no edit control beside it.

---

### Small shared pieces

| Piece | Class | Purpose |
|---|---|---|
| **Institution state pill** | `.istate.operating` · `.attention` · `.setup` | Derived state (`DA-01`). Each carries its **own icon and its own words** — colour is never the only carrier (WCAG 1.4.1) |
| **Release decision panel** | `.decide` · `.verpair` · `.verbox` | The live→new pairing and the two outcomes. `.verbox.next` marks the version awaiting a decision. No diff, changelog or version tree — no source defines one |
| **Configuration register row** | `.reg` · `.reg-row` | Three columns: area · why · status + source. Collapses to one column below 980 px, where the source line gains a `Source ·` prefix |
| **Device transfer cell** | `.devmove` | `from → to` stacked in **one** table column. Two side-by-side device columns pushed the queue past 1280 px |
| **Inline citation** | `.cite` | Monospace, muted. Present throughout — traceability is this batch's whole claim — but never competing with the content it justifies |
| **Not-list** | `.notlist` | What a surface deliberately does not show, kept visible so a reviewer can check the boundary instead of trusting it |
| **Sidebar sub-navigation** | `.subnav` · `.subitem` | Batch 05 is the first workspace with a two-level primary nav. Depth stops at two, matching Batch 03's rule. Children appear only while their section is open, so the resting nav stays six items long. The parent is highlighted **without `aria-current`** — only one element in a nav may claim to be the current page, and that is the child |

## 3 · Components deliberately **not** built

Each was considered and rejected on evidence.

| Not built | Why |
|---|---|
| **KPI tile · stat card · metric row** | `PM-11` defers detailed metrics; §6.7.3 prohibits cross-tenant analytics dashboards; Table 41 sets the Phase-1 need at operational status only |
| **Any chart, sparkline, gauge or trend** | Same. There is no chart anywhere in Batch 05 |
| **Institution switcher in the global chrome** | Would imply a current tenant this role does not have. The scope bar carries it, inside the page, only while an institution is open |
| **Audit / activity timeline** | **`GP-4`** — no audit trail is defined outside content governance. The Batch-01 `.timeline` is reused on `SA-07` for the *current request's* own state, which is required by FRD 2.4.2's acceptance criterion, not for history |
| **Disabled-control pattern for missing routes** | A greyed-out control implies the route exists. `SA-C3` replaces it |
| **Settings form controls** | FRD 8.1.1 confirms the authority and no source names a setting. `SA-C4`'s register replaces the form |
| **Status pill for *Inactive* / *Suspended*** | Each is the result of an action no source defines (`DA-01`) |
| **Bulk-select / multi-action toolbar** | No source defines a bulk operation for this role |

## 4 · Icons

Batch-01 set, plus seven additions — all inline SVG on the same 24 viewBox, 1.7 stroke, no icon font, no external file.

| Icon | Used for | Note |
|---|---|---|
| `building` | Institution | Deliberately **not** a bank — this platform has no commercial surface and the icon must not imply one |
| `globe` | Platform scope | |
| `release` | Version release | A package moving **outward**. Never a "publish", "send" or "upload" metaphor |
| `pause` | Hold a version | |
| `swap` | Device transfer | |
| `key` | Licensing | |
| `arrD` | Stacked device transfer | |

## 5 · The four exceptions — inherited corrections

The only places Batch 05 touches a Batch-01 value. All four are commented in place in the stylesheet. **The Batch-01 sheet is not edited** — it remains a byte-identical snapshot, `md5 8f9fa1b862f23ca4eeccc50d429bca75`.

### (a) `--text-3` — accessibility, carried forward from Batch 04

`#6A7686` measures **4.30:1** on `--surface` and 4.06:1 on the warning tint — below AA 4.5:1 for the small text it carries. Corrected locally to **`#5F6B7A`**: 5.43:1 on surface, **4.61:1 worst case** (on `--sunken`), still clearly lighter than `--text-2` so the three-tier hierarchy survives.

### (b) `--control-border` — accessibility, **new finding in Batch 05**

`--border-strong` (`#B6C0CD`) measures **1.84:1** against `--surface`. Where it draws the boundary of an **interactive control**, WCAG 2.1 SC 1.4.11 requires **3:1**, because that boundary is the only thing identifying the control.

The token is **not redefined wholesale.** On cards, tables, dividers and dashed notes it is decorative, and darkening those would visibly repaint chrome that Batches 01–04 share. A separate token is introduced and applied only where a control must be identifiable:

```css
:root{ --control-border:#7E8A99; }          /* 3.51:1 on surface · 3.24:1 on raised */
.field input[type=text], .field textarea, .field select,
.searchbox input, .listbar select, .btn.sec { border-color:var(--control-border); }
```

### (c) `table.dt a.rowlink > .tmain / .tsub` — table text hierarchy

Batch 01's table rule styles `.tmain` and `.tsub` but never sets their `display`, because in Batch 01 they always sat on **block-level** elements inside the cell. Batch 05 has one cell where they do not: `SA-04`'s module cell puts both **directly inside `a.rowlink`**, where an `<a>` wraps spans rather than divs. They therefore inherited the inline default, and the module name ran together with its discipline on a single line — *"Soil Mechanics — Direct Shear TestCivil Engineering"*.

```css
table.dt a.rowlink .tmain,
table.dt a.rowlink .tsub{display:block}
```

Same correction and same reason as `.instcell .tmain,.instcell .tsub{display:block}` directly above it in the sheet.

**Descendant, not direct-child — deliberately.** The first pass shipped this with a `>` combinator, which is correct for today's markup: releases puts the two spans one level under the anchor, every other table puts them three levels under it inside `.instcell`. But the two DOM shapes differ in depth, so `>` fixes the current markup and **silently stops applying the moment a wrapper is added or removed**. The descendant form covers both shapes and any future nesting, and is a no-op wherever `.instcell` has already set block because the value is identical. It stays scoped to `table.dt a.rowlink`, so no cell outside a linked table row is reached.

**Measured, both selectors, both engines.** In Chrome, before and after, at 1440 and 1280 across all eight table routes: the release table's run-together lines go **2→0** and **5→0** and its row heights become uniform (73px at 1440, 96px at 1280); **every other table is identical before and after**, with zero clipped cells and zero horizontal overflow. In **Safari**, an in-page probe measured three states per width — no rule, the retired `>` rule, and the shipped descendant rule:

| Width | Rule | `display` | Run-together | Verdict |
|---|---|---|---|---|
| 1440 | *none* | `inline` | **5 / 5** | run-together |
| 1440 | `>` *(retired)* | `block` | 0 | separate lines |
| 1440 | descendant *(shipped)* | `block` | 0 | separate lines |
| 1280 | *none* | `inline` | **5 / 5** | run-together |
| 1280 | `>` *(retired)* | `block` | 0 | separate lines |
| 1280 | descendant *(shipped)* | `block` | 0 | separate lines |

**Safari applies both selectors correctly.** The run-together rendering reported from a manual Safari review is the *no rule* row — Safari was serving a **cached copy of `batch05-prototype.css` from before the correction existed**. Safari caches `file://` subresources aggressively and does not revalidate them on a normal reload. The selector was never the cause; it has been widened anyway, because a rule that depends on one exact nesting depth is the wrong kind of fragile.

### (d) Two structural patches

`[hidden]{display:none !important}` — so `hidden` wins over the display rules components set on themselves.
`.empty h2{…}` — Batch 01's `.empty` defines `h3`, but an empty state directly beneath the page `h1` must be an `h2`; skipping a level is a heading-order failure. Same rule, same visual weight. Carried forward from Batch 04.

> ⚠ **All three shared findings are referred upward.** `--text-3`, `--border-strong` and the missing `display` on `.tmain` / `.tsub` behave identically in Batches 01, 02, 03 and 04 wherever the same markup shape occurs. **Shared design-system findings, recorded here for consolidation — not fixed there by this task.**

## 6 · Responsive additions

Super Admin is desktop/laptop administration; 1440 and 1280 are the target widths and both are clean. Below them, nothing should **clip**:

| Breakpoint | Rule | Why |
|---|---|---|
| ≤ 1180 px | The prototype strip drops its leading label | The strip must not wrap at 1280 — a wrapped strip grows past `--protobar-h`, which the sticky top bar uses as a fixed offset |
| ≤ 1120 px | `.grid-rail` collapses to one column | Batch-01 rule, inherited |
| ≤ 1000 px | The scope-bar note takes its own line | Rather than compressing to a sliver |
| ≤ 980 px | The configuration register collapses to one column, source line gains a `Source ·` prefix | The three-column grid cannot hold |
| ≤ 900 px | The prototype strip wraps, right-hand label hidden | Below target width; a small sticky imperfection is preferable to losing controls off the edge |
| ≤ 740 px | `.tablecard{overflow-x:auto}`; sidebar becomes a horizontal row | Batch 01's `.tablecard` is `overflow:hidden`, which **clips** wide columns instead of scrolling them. **No `min-width` is forced on the table** — an earlier attempt at that in Batch 04 pushed the whole document sideways and was reverted |
