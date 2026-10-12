# Handoff audit — v46 (Claude, 9 Oct 2026)

What the approved handoff provides, checked against the actual files. “Partial” and “Missing” are reported, not filled in: nothing here invents a mapping, specification or requirement.

| # | Required | Status | Evidence in v46 |
|---|---|---|---|
| 1 | Canonical screen register: 147 IDs, 123 designed, 24 not designed | **Present — verified** | `handoff/screens.json`: 147 IDs; 123 `designed: true`; 24 not designed, each with its disposition (OPEN · DEFER · REMOVE / MERGE). Board B8-01. |
| 2 | Every role / surface and its navigation hierarchy | **Present** | `navigation.json`: Public header + 7 authenticated roles, primary destinations in order and what is reached from them; navigation place per screen in `screens.json`. |
| 3 | Screen → source-file mapping | **Present — verified** | All 123 designed IDs list at least one board, and every listed file exists in `canvas-v46/project/`. Frame level: 111 of 123 designed IDs are named in at least one frame caption (`derived/screen-frames.json`); the rest are identified by board only. |
| 4 | Visual system: CSS, layout, typography, components, responsive | **Present** | 8 stylesheets; `tokens.json` / `tokens.css` (65 tokens); boards 01–04, 09a/09b, 10–12; B8-07 (type scale, component → board, container-query breakpoints); B8-05 + per-batch proofs at 1440 / 1024 / 768 / 375. |
| 5 | Screen states, interactions, validation, dialogs, errors | **Present on the boards; partial as data** | Each state is a drawn frame; behaviour is in each board’s inline script; rules in B8-07 and boards 04 · 08 · 10 · 12. No machine-readable per-screen state or validation catalogue was produced — `derived/frame-index.json` lists all 966 product frames by caption as a search aid. |
| 6 | Cross-role workflows and shared-record requirements | **Present** | `flows.json` (27 steps: A–F + device chain, actor, screens, record, transition, outcome, evidence boards); `entities.json` (15 records, owners, status words, relations, 10 business rules); one-shared-state requirement in `handoff/README.md`, B8-04, B8-06. |
| 7 | Role permissions and visibility boundaries | **Partial** | Present: per-role navigation, record owner / writer, actor per flow step, role guards and XS-06 “Not your workspace” (B8-06), 0 cross-role links (B8-01 audit). **Missing: an explicit role × action permission matrix** — never designed. Claude Code must derive permissions from the boards and these files and list any doubtful case for the owner, not guess. `derived/controls-by-workspace.json` shows observed controls per workspace (evidence, not policy). |
| 8 | Open product-policy decisions, prototype assumptions, limitations | **Present** | `open-decisions.json`: 79 batch decisions (55 product policy · 12 shape the data model · 7 sample data · OD-B5-09 still open · 4 resolved / recorded) + 35 Register §T items (28 design-now-safely · 7 wait-for-decision), each with its safe treatment; 0 frontend build blockers. B8-08 adds limitations. |
| 9 | Accessibility findings and design exceptions | **Present on boards; added here as text** | B8-03 / B8-08 record the B1-10 defect; board 12 holds the rules. The handoff README and JSON did not mention B1-10 — now stated in `START-HERE.md` (package level; the canvas is unchanged). |
| 10 | React / Next.js implementation instructions | **Present** | `handoff/README.md` (rules, files, build order, definition of done), B8-06 (what to build, mock services, tests, what not to copy). |

## Missing or not designed (explicit)

- **Role × action permission matrix** — not designed (item 7).
- **Field-level data schemas and service contracts** — only record names, owners, status words and relations exist; 12 open decisions “shape the data model” and need confirming before a real backend.
- **Machine-readable per-screen state / validation spec** — states and validation are drawn on the boards only (item 5).
- **Final URLs** — routes are proposals.
- **Approved brand assets** — logo file and official font were never supplied.
- **Canvas runtime** — `./support.js` is supplied by the Claude Design host and is not a design file. The package adds the copy from the owner’s File-35 package (`runtime/`, identical to the runtime used in all local tests) for offline preview only.

## Reference check

All 12,156 local `href` / `src` / `url()` references in the markup and stylesheets of the 166 files resolve inside the package, except `./support.js` (all 128 boards; host-supplied runtime — preview copy in `runtime/`). External: Google Fonts only. Sample `.example` links are intentional sample data.

## Constraint check (owner list)

All 14 binding constraints in `START-HERE.md` are consistent with v46. Evidence: 7 authenticated workspaces + public header (`navigation.json`); 0 occurrences of “Module” in any rendered frame; distinct statuses for publication, institution access, student access and per-format progress (`entities.json`); Flows E and F (`flows.json`); “Publishing gives no one access” (B6-07); out-of-scope rule (`handoff/README.md` rule 9); OD-B5-09 open; logo labelled “placeholder”; B1-10 on B8-03 / B8-08; shared-state requirement (B8-04).
