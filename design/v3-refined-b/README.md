# V3 Refined Direction B — frozen reference (foundation XR-V3-RB-1.0)

This folder holds the owner-selected **Refined Direction B** sources and the V3 coordination
documents, copied byte for byte from the owner's integration pack. It is a design reference, the
same way `design/handoff-v46/` is: **never edit, normalise, reformat, regenerate or re-export any
file under `pack/`.**

| Item | Value |
| --- | --- |
| Foundation id | `XR-V3-RB-1.0` (`pack/FOUNDATION-LOCK.json`) |
| Source archive | `XR-V3-Claude-Code-Integration-Pack.zip`, 3,323,185 bytes, SHA-256 `2550811119489c43573c94fdb485584731d974eb8d999d21f990c2a7a883d252` |
| Copied | 18 Oct 2026, into worktree `/Users/mymac/Desktop/AR-VR-v3-ui`, branch `v3/refined-b-ui` |
| Integrity | `shasum -a 256 -c SHA256SUMS.txt` from this folder: **46 OK** expected |
| Cross-check | every copied file (except the manifest itself) also matches its line in `pack/PACK-MANIFEST.json`; the ten foundation files match `pack/FOUNDATION-LOCK.json` |

## What is here

- `pack/references/v3/` — the nine Refined B source files the owner supplied (`core.css`,
  `rb.css`, `rb-kit.css`, `design-tokens.json`, `canvas.json`, `SA01.dc.html`, `SA02.dc.html`,
  `IA01.dc.html`, `IA02.dc.html`) and `HANDOFF-original.md`. The effective CSS cascade is the visual
  source of truth; `design-tokens.json` is a summary.
- `pack/common/01…05` — owner decisions, the foundation contract, behaviour and data guards, the
  parallel-delivery contract and the source-completeness statement.
- `pack/SCREEN-OWNERSHIP.json|md`, `pack/CROSS-ROLE-FLOWS.json`, `pack/role-scopes/` — the 147
  registered ids (123 designed, 24 excluded) and their owning workstreams.
- `pack/10…13-*.md` — the Claude Code controller, role-intake, final-verification and HOLD-ONLY
  landing-fidelity prompts, kept for later sessions. Prompt 13 does not activate by being here.
- `pack/README.md`, `START-HERE.md`, `EXECUTION-PLAN.md`, `SOURCE-PROVENANCE.json`,
  `PACK-MANIFEST.json` — the pack's own index and provenance.

Not copied (they stay in the source archive): `references/v46/` (the repository already holds the
complete frozen v46 handoff in `design/handoff-v46/`), `references/v1/` (designer references,
3 MB of canvas HTML, not used by the code) and `references/implementation-reports/` (copies of
reports whose originals live in `v2/docs/`).

## What it is not

- Not a complete runnable V3 canvas: the owner's upload lacks the state and width wrappers, `Main`,
  `Kit`, `IA01-calm` and the current V3 `support.js` (`pack/common/05-SOURCE-COMPLETENESS.md`).
  Nothing here is loaded by the product; the design-host runtime is never shipped.
- Not application data: the sample records inside the `.dc.html` files (`RQ`, `SNAP`, `SC`, `EXPS`)
  are illustrative fixtures, and their local decision methods are not domain logic.
- Not a role design. Only SA-01, SA-02, SA-03, IA-01 and IA-02 have V3 source; every other designed
  id waits for an owner-approved complete-role export (`pack/11-Claude-Code-Complete-Role-Intake.md`).

## How the code uses it

`v2/packages/ui/scripts/generate-v3-scoped-css.mjs` reads `core.css`, `rb.css` and `rb-kit.css` from
here, checks their SHA-256 against `pack/FOUNDATION-LOCK.json`, and writes the scoped product
derivative `v2/packages/ui/src/styles/v3/rb-scoped.css`. The derivative keeps every declaration
and the order of every rule, and confines each selector to a V3 root (`.xr`). The provenance test
`v2/packages/ui/src/styles/v3-provenance.test.ts` fails when either side drifts. The integration
record is `v2/docs/v3/V3-FOUNDATION-RECORD.md`.
