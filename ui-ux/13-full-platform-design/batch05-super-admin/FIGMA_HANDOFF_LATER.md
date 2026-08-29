# Figma Handoff — Later

| | |
|---|---|
| **Document ID** | `BATCH05_FIGMA_HANDOFF_LATER` |
| **Batch** | 05 — Super Admin + platform-wide administration |
| **Status** | **Deferred.** No Figma work is performed in this batch |

---

## Why this is deferred

Batch 05 is functional, high-fidelity UI/UX design. The final visual redesign has not been performed, and the design language continues Batches 01–04 unchanged. A Figma pass belongs after the visual direction is settled — and, for this batch specifically, **after the PM has answered the two judgement calls**, because one of them decides whether two of the ten screens exist at all.

Existing Figma-related work elsewhere in the repository is untouched.

## What a later pass would need

### 1 · Frames — 10 screens, 26 states, 3 dialogs

Sizes: **1440 × auto** primary, **1280 × auto** secondary. Super Admin is desktop/laptop administration; no mobile scope is asserted.

| Frame group | Screens |
|---|---|
| Platform | SA-01 Overview |
| Institutions | SA-02 list · SA-03 detail *(4 institution states + not found)* |
| Releases | SA-04 list · SA-05 decision *(awaiting · held · released · not found)* |
| Device requests | SA-06 queue · SA-07 detail *(awaiting · approved · not found)* |
| Licensing | SA-08 *(records · partial · none)* |
| Platform | SA-09 roles · SA-10 configuration register |
| Dialogs | Release · Hold · Approve |

State inventory: [`07_SCREEN_INVENTORY.md`](07_SCREEN_INVENTORY.md) §4. Every state is capturable from the prototype — routes and QA seeds are listed in [`qa/ACCESSIBILITY_AND_UX_QA.md`](qa/ACCESSIBILITY_AND_UX_QA.md).

### 2 · Variables — inherit, plus two corrections

The Batch-01 token set, unchanged, **plus the two accessibility corrections this batch makes locally**. Both must be carried into any shared library rather than left as Batch-05 overrides:

| Token | Value | Why |
|---|---|---|
| `--text-3` | `#5F6B7A` *(was `#6A7686`)* | 4.30:1 → 5.43:1. Sub-AA in Batches 01–04 too |
| `--control-border` *(new)* | `#7E8A99` | WCAG 1.4.11 needs 3:1 for control boundaries; `--border-strong` gives 1.84:1. Applied to inputs, selects and secondary buttons only |

> ⚠ **Both are referred upward as shared design-system findings.** A Figma pass is the natural place to consolidate them across all batches — but that is a separate decision, not this batch's to take.

### 3 · Components — five new, plus small pieces

Full specifications in [`06_COMPONENT_EXTENSIONS.md`](06_COMPONENT_EXTENSIONS.md).

| Component | Variants |
|---|---|
| **Scope bar** | platform · institution *(tinted)* |
| **Boundary note** | neutral · owner *(tinted)* |
| **Source gap** | one, with a source tag |
| **Attention list** | action row · watch row · settled |
| **Readiness ledger** | in place · failing · not yet *(dashed)* |
| Institution state pill | operating · attention · setup |
| Release decision panel | awaiting · held · released |
| Configuration register row | built here · another role · later phase · not defined |
| Device transfer cell | one |
| Sidebar sub-navigation | Batch 05 is the first two-level nav |

### 4 · Roles

`08 — Super Admin` (platform-wide; the only role that spans planes — FRD 1.3.5 · `PM-13`).

The Content Manager, Vendor, Academic Reviewer, Institute Admin, Faculty and Learner workspaces are outside this batch.

### 5 · Rules a Figma pass must not break

- **No publish, publication queue, approve-content, return or request-changes control anywhere for this role.** `PM-16` · `PM-17` · `PM-18`; `QP-26` open.
- **Release vocabulary is firewalled**: release · hold · held · released · version · production. Never *publish*.
- **No decline on a device request** — the gap is stated, never a disabled control.
- **No cross-institution total, aggregate, chart, ranking or comparison.** FRD 1.3.4 · AC-04 · `PM-11` · §6.7.3.
- **No institution switcher in the global chrome** — the scope bar carries it, inside the page.
- **No price, seat, invoice, subscription, renewal or refund.**
- **Every boundary note names a role and a requirement.** Stripping the citation removes the point.

### 6 · Assets

`prototype/assets/bits-pilani-wilp-logo.png` — a **byte-identical** copy of `branding/bits-pilani-wilp-logo.png`:

```
md5    633ba520f5b5cc606300eb76f7b8b52a
sha256 f98fe1f89cf99ab5058cfb34fed6857de0712a02ef71d611c3bcbdac17a7184c
```

The branding source is never modified. Icons are inline SVG on a 24 viewBox at 1.7 stroke — no icon font, no external file.
