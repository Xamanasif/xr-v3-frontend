# Provisional Design System — XR Simulation Learning Platform

**Document status:** Stage 5 deliverable · **PROVISIONAL** (D-12)
**Created:** 2026-08-10
**Baseline:** WCAG 2.2 AA (D-11) · Desktop-first 1440px (D-15)
**Tokens:** [`tokens.css`](tokens.css)

---

## ⚠️ Provisional status

D-12 confirms the logo is the **only** approved brand asset. Colours, typography, spacing, and visual direction are **not approved** and remain open under Q-13.

**What that means in practice:** this system is built so a brand decision replaces token *values* without restructuring anything. Every colour is referenced through a semantic token (`--color-action`), never a raw value, in every component. Swapping the palette is a change to one file.

**Two gaps to raise with the logo owner:** there is no **vector (SVG)** asset and no **reversed/dark variant**. Both constrain the header lockup and the dark theme, and both are cheap to supply.

---

## 1. Design direction

D-12 requires a system appropriate for engineering · university learning · technical education · commercial SaaS · XR-enabled learning. Those five pull in a consistent direction: **credible, calm, dense with information, quiet in decoration.**

| Principle | Consequence |
|---|---|
| **Content is the interface** | Chrome recedes. Learning resources, simulations, and assessments carry the visual weight. |
| **State must be unmistakable** | Six module states drive the entire experience under D-07. Every one is icon + text + shape — never colour alone. |
| **Quiet by default, loud on consequence** | Colour is reserved for state and action. A screen where everything is emphasised has no hierarchy. |
| **Density with air** | Engineering students scan lists. Rows are compact; the space between groups is generous. |
| **Never decorate a wait** | Loading states show the shape of what's coming, not an entertaining spinner. |

**Explicitly avoided** (brief §16): excessive gradients · neon · glassmorphism · unnecessary animation · decorative XR effects · cluttered dashboards · card soup · meaningless charts · gamification.

### On the logo and the palette

The logo's own colours were sampled for reference — deep indigo-navy `#211D70`, gold `#E8972E`, red `#EC1C24`, sky `#75C2E5` — and **deliberately not adopted as a palette** (D-12). Two reasons beyond the instruction:

1. The gold and red are near-identical in luminance to each other and would fail as adjacent state colours.
2. A three-accent identity palette applied to a dense learning UI produces exactly the "cluttered" result brief §16 rules out.

Instead the primary is an independently-chosen deep indigo that **sits beside** the logo without imitating it, and the accent is a technical teal reserved for simulation/XR. The result harmonises in a header lockup while behaving correctly as a UI system.

---

## 2. Colour

All values validated against WCAG 2.2 AA. Contrast figures are versus the surface each is used on.

### Primary — Indigo

| Token | Hex | Use | Contrast |
|---|---|---|---|
| `--indigo-50` | `#F2F4FC` | Selected row background | — |
| `--indigo-100` | `#E2E7F8` | Subtle fill, progress track fill | — |
| `--indigo-200` | `#C6D0F0` | Border on tinted surfaces | — |
| `--indigo-500` | `#4A62BF` | Dark-theme action | 4.9:1 on `#161B22` |
| `--indigo-700` | `#2B3982` | **Primary action, links** | **10.3:1** on white |
| `--indigo-800` | `#232E66` | Hover | 12.6:1 |
| `--indigo-900` | `#1B2450` | Headings on tinted surfaces | 15.1:1 |

### Accent — Teal · reserved for simulation & XR

| Token | Hex | Use | Contrast |
|---|---|---|---|
| `--teal-600` | `#0F7A75` | Simulation accents, MR badge | **5.2:1** on white |
| `--teal-700` | `#0C625E` | Hover | 7.0:1 |
| `--teal-50` | `#EAF6F5` | Simulation panel tint | — |

Teal appears **only** on simulation and XR surfaces. That restraint is what makes it a signal rather than decoration.

### Semantic

| Token | Hex | Meaning | Contrast |
|---|---|---|---|
| `--success-700` | `#146C43` | Completed, passed | 6.5:1 |
| `--warning-700` | `#8A5200` | Attention, hint used | 6.3:1 |
| `--danger-700` | `#B3261E` | Failed, declined, destructive | 6.6:1 |
| `--info-700` | `#1A56C4` | Informational, Web format | 6.6:1 |

Each has a `-50` surface and `-200` border token for tinted blocks.

### Neutrals — cool slate

| Token | Hex | Use |
|---|---|---|
| `--n-0` | `#FFFFFF` | Base surface |
| `--n-25` | `#FAFBFC` | Page background |
| `--n-50` | `#F4F6F9` | Raised fill, skeletons |
| `--n-100` | `#E9EDF2` | Dividers, progress track |
| `--n-200` | `#D8DEE7` | **Default border** |
| `--n-300` | `#B6C0CD` | Disabled border |
| `--n-400` | `#8C98A8` | **Disabled text only** — 2.9:1, never informational |
| `--n-500` | `#6A7686` | Tertiary text — 4.6:1 ✅ AA |
| `--n-600` | `#515D6C` | **Secondary text** — 6.7:1 ✅ AA *(raised in Review 004)* |
| `--n-700` | `#3B4552` | Body text — 10.0:1 |
| `--n-900` | `#161B22` | **Primary text** — 16.9:1 |

### Semantic aliases — the only names components use

```
--color-bg  --color-surface  --color-surface-raised  --color-border
--color-text  --color-text-secondary  --color-text-disabled
--color-action  --color-action-hover  --color-on-action
--color-focus  --color-sim
--color-success / -surface   --color-warning / -surface
--color-danger  / -surface   --color-info    / -surface
```

**No component references a raw palette value.** This is what makes Q-13 cheap to resolve.

### Dark theme

Every semantic alias is redefined under `prefers-color-scheme: dark` and `[data-theme]`. Surfaces lift rather than borders brightening: `--color-bg #0F1319`, `--color-surface #161B22`, `--color-surface-raised #1D242E`. Action shifts to `--indigo-500` for contrast on dark. All pairings re-validated at AA.

### Colour is never the only signal

WCAG **1.4.1**. Enforced by rule:

| Signal | Carriers |
|---|---|
| Module state | icon + text label + row treatment |
| Format badge | icon + 2–3 letter text + colour |
| Assessment navigator | shape + fill + `aria-label` |
| Pass / fail | icon + word + score |
| Required / optional | word, never a colour dot alone |

---

## 3. Typography

**Intended:** Inter. **Fallback:** `-apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`. Numerals use `font-variant-numeric: tabular-nums` in scores, timers, and prices so digits do not jitter.

| Token | Size / line | Weight | Tracking | Use |
|---|---|---|---|---|
| `--t-display` | 34 / 42 | 650 | −0.02em | Score readouts, price |
| `--t-h1` | 28 / 36 | 650 | −0.015em | Page title |
| `--t-h2` | 22 / 30 | 640 | −0.01em | Section, module title |
| `--t-h3` | 18 / 26 | 640 | −0.005em | Card title |
| `--t-h4` | 16 / 24 | 640 | 0 | Row title |
| `--t-body-lg` | 16 / 26 | 400 | 0 | Reading passages |
| `--t-body` | 15 / 24 | 400 | 0 | **Default** |
| `--t-body-sm` | 14 / 21 | 400 | 0 | Secondary |
| `--t-caption` | 13 / 18 | 400 | 0 | Metadata |
| `--t-overline` | 11 / 16 | 650 | +0.08em | Section eyebrows, uppercase |
| `--t-mono` | 13 / 20 | 400 | 0 | Timer, IDs |

**Rules:** measure 60–75ch for reading content · never below 13px · headings never all-caps except overline · **text resizes to 200% without loss** (WCAG 1.4.4) and reflows at 320px-equivalent (1.4.10), which is why the layout uses relative units throughout despite being desktop-first.

---

## 4. Spacing & grid

**Scale (4px base):** 2 · 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96

**Desktop grid — 1440px**

| Property | Value |
|---|---|
| Columns | 12 |
| Gutter | 24px |
| Page margin | 80px |
| Content max | 1280px |
| Column width | 84.67px |

| Layout | Split | Widths |
|---|---|---|
| Full | 12 | 1280 |
| Detail + rail | 8 / 4 | 845 / 411 |
| Card grid | 4 × 3 | 306 each |
| Centred form | — | 440 |
| Reading measure | — | 680 max |

**Adaptation note (D-15):** desktop-first, but every layout uses `minmax()` grids and relative units so a later responsive pass reflows rather than being rebuilt. No fixed pixel widths on containers.

---

## 5. Radius, borders, elevation

| Radius | Use | | Border | Use |
|---|---|---|---|---|
| `2px` | Badges, chips | | `1px --color-border` | Default |
| `4px` | Inputs, buttons | | `1.5px` | Emphasis, selected |
| `6px` | Rows, small cards | | `2px` | Focus ring only |
| `10px` | Cards, panels | | dashed `1px` | Optional / placeholder |
| `16px` | Modals, hero panels | | | |
| `999px` | Pills, avatars | | | |

**Elevation** — three levels, deliberately restrained:

```
--e1  0 1px 2px rgba(22,27,34,.06), 0 1px 1px rgba(22,27,34,.04)   cards at rest
--e2  0 4px 12px rgba(22,27,34,.08), 0 1px 3px rgba(22,27,34,.05)  dropdowns, hover
--e3  0 12px 32px rgba(22,27,34,.12), 0 2px 8px rgba(22,27,34,.06) modals
```

In dark theme shadows are near-invisible, so elevation is carried by **surface lightness** instead. Both are defined; neither is used alone.

---

## 6. Focus, motion, icons

### Focus — WCAG 2.2

```css
:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
  border-radius: inherit;
}
```

Plus, as a system rule from self-review finding W-07:

```css
.scroll-region { scroll-padding-top: calc(var(--sticky-h) + 12px); }
```

Any scroll container beneath a sticky element carries this, so a focused control is **never obscured** — WCAG 2.2 **2.4.11**. The rule lives here rather than on one screen because the failure recurs anywhere a sticky bar exists.

### Motion

| Token | Duration | Use |
|---|---|---|
| `--m-fast` | 120ms | Hover, focus |
| `--m-base` | 180ms | Expand, tab change |
| `--m-enter` | 240ms | Modal, toast |

Easing `cubic-bezier(.2,.8,.3,1)`. **All motion is suppressed under `prefers-reduced-motion: reduce`** — transitions to 1ms, no transforms. Nothing conveys meaning through motion alone.

### Icons

20px default (24px in dense controls) · 1.5px stroke · currentColor · **decorative icons are `aria-hidden`; meaningful icons carry a text label** · interactive targets ≥24×24 CSS px (**2.5.8**), 40×40 for primary controls.

---

## 7. Loading treatment — system rule (W-05)

| Situation | Treatment |
|---|---|
| Content of known shape (lists, cards, checklist) | **Skeleton** matching the real layout |
| Determinate operation (video buffer, simulation assets) | **Inline progress** with percentage where known |
| Submission (sign in, submit assessment, save) | **Button-local spinner**, button disabled, label changes |
| Genuinely opaque wait (payment) | **Full-page status** — B2C-04 only |

Skeletons animate with a 1.4s shimmer, suppressed under reduced-motion. Loading regions use `aria-busy="true"`; completion announces via a polite live region (**4.1.3**).

---

## 8. Components

Only components the 29 screens actually need. Nothing speculative.

### Primitives

| Component | Variants | Notes |
|---|---|---|
| **Button** | primary · secondary · ghost · danger · sizes sm/md/lg · loading · disabled · icon-left/right | 40px md height; 44px lg |
| **Input** | text · email · password (show/hide) · number · error · disabled | Label always visible — never placeholder-as-label |
| **Select** | single · with description | Native semantics |
| **Checkbox / Radio** | default · error · disabled | Radio groups use `role="radiogroup"` + arrow keys |
| **Search / filter field** | with clear | Explore only |
| **Chip** | filter · toggle · removable | |
| **Tabs** | underline | Roving tabindex |
| **Breadcrumb** | | `aria-current="page"` on last |
| **Top navigation** | B2B · B2C | Differ only by Explore + institution label |
| **Account menu** | | Profile · Preferences · Help · Sign out |

**No sidebar.** Nav depth is 2; a sidebar would add chrome without removing a click.

### Learning

| Component | Variants | Notes |
|---|---|---|
| **Course card** | in-progress · not-started · completed | Thumbnail + progress bar. **Structurally different from a module row** (brief §6). |
| **Module row** | 6 states — Locked · Available · In Progress · Assessment Required · Retry Required · Completed | Sequence number · state icon · format badge · state text. Locked rows stay in the a11y tree. |
| **Resource item** | PDF · video · required · optional · complete · incomplete | Optional visibly distinct; never blocks |
| **Video item** | with duration + coverage | Coverage track ≠ position track (A-36) |
| **Completion checklist** | | Sticky rail on STU-04. Single source of truth for D-08. |
| **Progress bar** | determinate · with label | Track + fill; `role="progressbar"` |
| **Status badge** | 6 module states | icon + text |
| **Format badge** | Web · VR · MR · AR | icon + text + colour, all three |
| **XR device guidance panel** | VR · MR · AR | Format / device / access / status + CTAs + D-07 consequence |
| **Locked state** | inline · row | Reason readable without interaction |

### Assessment

| Component | Notes |
|---|---|
| **Timer** | Sticky, tabular numerals, polite announcements at 5 min / 1 min only (**4.1.3**) |
| **Question navigator** | 4 states via shape + fill + `aria-label`; ≥32px targets |
| **Assessment question** | Radio group, arrow-key navigation |
| **Hint control** | + irreversible-action confirmation dialog |
| **Score breakdown** | Line items incl. hint impact |
| **Attempt history table** | |

### Commerce

| Component | Notes |
|---|---|
| **Product card** | Format badge · price · **owned indicator** · device requirement |
| **Price display** | Tabular numerals · currency via one formatter (A-32) |
| **Order summary** | Line items · tax line · total |
| **Payment status panel** | processing · success · declined · **indeterminate** |

### Feedback

| Component | Notes |
|---|---|
| **Modal / dialog** | Focus trap, ESC, focus restore |
| **Toast** | Polite live region; session warning uses this |
| **Alert** | info · success · warning · danger — inline |
| **Skeleton** | text · card · row · checklist |
| **Empty state** | icon + heading + explanation + action; **cause-specific** |
| **Error state** | Full-page STATE-01/02/03 + inline variants. Every one answers *what happened* / *what next* (D-18) |

---

## 9. Naming

`component--variant__element` · tokens `--category-role-modifier` · Figma layers `Component / Variant / State`, matching the token names one-for-one so a design-to-code diff is readable.

---

## 10. What this system does **not** include

| Excluded | Why |
|---|---|
| Charts, graphs, sparklines | C-04 — no vanity analytics; no Phase-1 requirement needs one |
| Badges, streaks, points, leaderboards | C-04 |
| Avatars beyond an account initial | No FRD requirement |
| Notification centre | No Phase-1 requirement (A-20) |
| Cart | Single-object purchase (IA §4.3) |
| Rich text editor | No Student authoring in Phase 1 |
| Data table with sort/filter | Attempt history is small and read-only |
| Carousel | No content set warrants one |

Every exclusion is a component that would have been plausible and is absent on purpose.
