# Batch 01 — Foundations & Shared Shell

**Inputs:** `ui-ux/06-design-system/tokens.css` + `DESIGN_SYSTEM.md` (Review-005), `ui-ux/07-high-fidelity/student-desktop-hifi.html`, `ui-ux/09-accessibility/ACCESSIBILITY_REVIEW.md`, `09_REVIEW005_REUSE_MAP.md`.
All visual foundations remain **provisional under D-12** (logo is the only approved brand asset). Nothing here creates a new brand; it reuses the Review-005 foundations where compatible and rebuilds the application architecture for seven role workspaces.

---

## 1 · Historical Review-005 design — disposition

| Element | Decision | Detail |
|---|---|---|
| **Design tokens (`tokens.css`)** | **KEEP** | Two-layer palette → semantic alias architecture, both themes specified, contrast-annotated. Consumed as-is by the Batch-01 prototype (values copied, alias names canonical — the hifi's renamed aliases like `--color-text-2` are dropped). |
| **Colour system** | **KEEP** | Indigo-700 `#2B3982` primary action · cool slate neutrals · restrained semantic hues · **teal reserved exclusively for simulation/XR surfaces** — this rule carries extra weight now that governance and XR states sit side by side. |
| **Typography scale** | **KEEP + MODIFY** | Scale kept (15px body · 28px h1 · 640–650 heading weights · tabular numerals for counts/times). Modification: no webfont is loaded — the system stack is used verbatim; hard-coded font values in the hifi are replaced by token consumption. |
| **Spacing (4px), radii, borders, elevation, motion** | **KEEP** | Unchanged, including the reduced-motion kill switch and 24px minimum target rule. |
| **Focus treatment** | **KEEP** | 2px solid ring, 2px offset, never suppressed; `:focus-visible` global rule. |
| **Status/format badges, alerts, state grammar (D-18)** | **KEEP + EXTEND** | Icon + text + colour, never colour alone. Format badges (Web/VR/MR/AR) reused; governance status badges are a new variant family on the same pattern. Emoji glyphs are **replaced** by a small inline-SVG icon set (20px, 1.5px stroke) — the emoji placeholders render inconsistently across platforms. |
| **Buttons, inputs, cards, chips, tabs, modals, toasts** | **KEEP + MODIFY** | Patterns reused; drift reconciled (`.btn.lg` 46px→44px documented size; hifi topbar 72px→ token `--topbar-h` 64px; fixed-px `.g87` grid → minmax-based two-column). Real hover/focus/disabled states rendered in the prototype (the hifi had none). |
| **Module row, lockbar, completion checklist, XR guidance panel** | **KEEP + MODIFY** | Learner-side patterns reused; the XR guidance panel is expanded from guidance-only into the entitlement-aware **XR Access panel** (PM-05). |
| **Top-navigation-only Student shell (“No sidebar”)** | **REBUILD** | The “no sidebar, nav depth 2” rule was a Student-workspace judgement. A seven-workspace platform needs one shell that scales; Batch 01 rebuilds the shell with a compact side navigation (below). The Student topbar pattern is retained *inside* the new shell as the header. |
| **845/411 fixed two-column layout** | **REBUILD** | Replaced by a fluid `minmax` content+rail grid that holds at 1440 and 1280. |
| **Hifi HTML as code** | **DO NOT REUSE** | It is a presentation document (no semantic elements, inline styles, no states). Treated as a visual reference only. |
| **Emoji icons** | **DO NOT REUSE** | Replaced by inline SVG set. |
| **Sample data (prices, providers)** | **DO NOT REUSE** | Batch-01 sample data is its own clearly-labelled set (§9 of the task brief). |
| **Dark theme** | **DEFERRED (not used in Batch 01)** | Tokens exist, but the only brand asset is a palette PNG with a baked white background — it cannot sit on a dark header (known gap `QX-07`). Batch 01 presents light theme only; dark-theme tokens are preserved untouched for later. |
| **Accessibility baseline & methodology** | **KEEP + EXTEND** | WCAG 2.2 AA design target (D-11), contrast-annotated tokens, n-400-is-disabled-only rule, scroll-padding rule, 24px targets. Extended to the five new workspaces; findings in `qa/ACCESSIBILITY_AND_UX_QA.md`. 1.4.10 Reflow remains a stated gap (desktop-first scope, `QX-01`/`QX-02`). |

**Why no new brand:** D-12 states the logo is the only confirmed brand asset and the palette was architected for a token-swap rebrand. Replacing it now would create a second unapproved visual identity. The indigo/slate/teal system already reads as credible engineering-education enterprise SaaS, which is the Batch-01 visual direction.

---

## 2 · Logo usage

- Asset: `branding/bits-pilani-wilp-logo.png` (632×316, white background baked in, **referenced in place — never copied, recoloured or re-exported**).
- Placement: global header, left, 36px height on the 64px header, on white surface only.
- Alt text: “BITS Pilani WILP”.
- Constraint carried forward: no SVG / no reversed variant exists (`QX-07`) — this blocks dark headers, not Batch-01 work.

---

## 3 · The shared platform shell (SHR-02, rebuilt)

One shell serves all seven roles. **Role differences come from navigation content, permissions, actions and data — never from different chrome** (`QX-06` position).

```
┌────────────────────────────────────────────────────────────────────────────┐
│ HEADER 64px · white · 1px border-bottom                                    │
│  [Logo 36px] [divider] XR Simulation Learning Platform     [Help] [Account]│
├──────────────┬─────────────────────────────────────────────────────────────┤
│ SIDE NAV     │ CONTENT AREA · bg n-25                                      │
│ 232px, white │  Breadcrumb 13px                                            │
│ 1px border-r │  Page header: H1 24px + context meta + primary actions      │
│              │  Content: full-width | table | content+rail grid            │
│ Workspace    │    rail = minmax(300px, 360px) for review/status panels     │
│ context      │                                                             │
│ label        │  max content width 1440; holds without horizontal scroll    │
│ + nav items  │  at 1280 (rail compresses first)                            │
└──────────────┴─────────────────────────────────────────────────────────────┘
```

| Shell region | Specification |
|---|---|
| **Header** | 64px (`--topbar-h`). Logo + product name lockup left; right: Help (consistent location, WCAG 3.2.6) and account control (initials avatar 32px, name, role caption, menu: Profile · Sign out — visual only in Batch 01). |
| **Workspace context** | Top of the side nav: overline label with workspace name and organisation context — e.g. “VENDOR · Sample XR Content Vendor”, “LEARNER · Sample Engineering Institute”, “ACADEMIC REVIEW”, “CONTENT MANAGEMENT”, “PLATFORM ADMINISTRATION”. This is the role/workspace context surface; there is **no workspace switcher** (multi-role chooser `AUTH-09` is out of batch and not invented as a persistent control). |
| **Side navigation** | 232px. Items 36px, icon 18px + 14px/500 label; active = `action-subtle` background + `action` text + 2px left inset indicator. Hover = raised surface. One level only in Batch 01. |
| **Breadcrumb** | 13.5px, `text-tertiary`, separator “/”; current page not a link. |
| **Page header** | H1 24px/650 + optional status badge inline; supporting meta line 13.5px `text-secondary`; primary action(s) right-aligned. |
| **Content patterns** | (a) full-width list/table page, (b) detail page = content + right rail (`minmax(0,1fr) minmax(300px,360px)`, gap 24), (c) centred narrow form (640px) for focused tasks. |
| **Search/filter row** | Above tables: search input (280px) + filter chips/selects + result count right. |
| **Alerts / toasts / dialogs** | Alert = inline tinted panel with icon (info/success/warning/danger). Toast = bottom-left, `aria-live="polite"`, auto-dismiss + dismiss button. Dialog = 520px max, radius 16, e3 shadow, focus-trapped, Esc closes, initial focus on first field or least-destructive action. |
| **Status/history rail panels** | Detail pages place workflow position, decision actions and review history in the right rail — the same rail slots serve Vendor (status + feedback), Reviewer/CM (decision + history) and SA (publish + record), which is what keeps four governance screens feeling like one product. |

### Batch-01 navigation per workspace (minimal, from the Review-006 IA)

| Workspace | Nav items |
|---|---|
| Vendor | Submissions · New Submission |
| Academic Reviewer | Review Queue · Review History |
| Content Manager | Review Queue · Reviewed Content · Published Content |
| Learner | My Learning · Progress |

No fake dashboards or fillers; governance roles land on their queue (queue-first rule). Later batches extend these lists (e.g. Vendor “My Modules”) without shell changes.

> **PM publication correction (2026-08-25).** Publication is owned by the Content Manager, so the Super Admin workspace is removed from the **active Batch-01 content-publication workflow**. **Super Admin remains one of the approved platform roles** — its detailed workspace and responsibilities are **deferred** until supported by confirmed requirements or PM decisions in a later batch. No replacement Super Admin responsibility is invented here.
>
> The Content Manager's third nav item, **Published Content**, is a **DESIGN ASSUMPTION — REVERSIBLE** (`DA-06` in `01_BATCH01_SCOPE.md`): because the Content Manager is the confirmed publisher, the prototype gives that role a view of published records for workflow continuity. **PM has not separately confirmed the detailed post-publication management responsibility**, so this is not presented as a confirmed requirement.

### Prototype-only navigation

A visually distinct strip above the shell, labelled **“Prototype Navigation — Not Product UI”**, provides role jumping, scenario reset and the demo-path index. It is slate-dark, monospace-labelled and cannot be mistaken for product chrome. Documented in `prototype/README.md`.

---

## 4 · Layout & viewport

- Primary review viewport **1440px**; verified also at **1280px** (rail and table columns compress; no horizontal scroll).
- Desktop-first per D-15; extension of D-15 to all workspaces remains an open design decision (`QX-01`) — Batch 01 does not claim a responsive/mobile strategy. Layouts use fluid grids so a later reflow pass is not blocked (`QX-02` noted, not resolved).

## 5 · Voice & language rules applied

- Human-readable labels only; **no internal IDs** (PM codes, QP/QT/QD/QX, FRD numbers, gate numbers) in any user-facing surface (C-07).
- Governance: “Changes Required”, never “Rejected”; prohibitions expressed positively (“With Academic Reviewer” — no disabled Publish control anywhere).
- XR: mechanism-neutral (“Get on device”, “Availability pending”, “Ready on device”); **copy may change after the XR delivery implementation is selected** — this note appears in design docs, not in product UI.
- Every error state says what happened + what to do next (D-18); no dead ends.
- Sample values are marked “SAMPLE DESIGN DATA” wherever they could be mistaken for approved business values.
