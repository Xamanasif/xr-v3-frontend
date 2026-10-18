# Ready-role intake requirements — V3 on foundation XR-V3-RB-1.0

What a complete V3 role needs before it can be integrated on `v3/refined-b-ui`, and how it is
integrated. Sources: pack prompt 11 (`design/v3-refined-b/pack/11-Claude-Code-Complete-Role-Intake.md`),
`pack/common/01…05`, the controller prompt §6–§8, ADR-0010 and `V3-FOUNDATION-RECORD.md`.

## 1. From the owner

1. **An explicit approval in the conversation**, naming each role, its export file and revision,
   and saying the role is complete. An archive that is only present on disk (for example in
   `~/Downloads`) is not an approval and is not opened.
2. **Pack prompt 11** pasted with the export, in a session that resumes this worktree (it never
   resets to `a55ace9` or recreates the worktree).
3. **The source ZIP** of the role (small; screenshots separate), as the parallel-delivery contract
   defines it (`pack/common/04`, "Package output contract"):

   | File                      | Must give                                                                               |
   | ------------------------- | --------------------------------------------------------------------------------------- |
   | `START-HERE.md`           | role, foundation version, exact screen coverage, live preview entry, limits             |
   | `ROLE-STATUS.json`        | every owned id: source, kind, route proposal, states, completion evidence               |
   | `project/`                | all newly authored source and every wrapper its canvas lists                            |
   | `FOUNDATION-LOCK.json`    | `XR-V3-RB-1.0` and the original shared-file hashes; local additions listed separately   |
   | `COMPONENT-EXTENSIONS.md` | reused and new patterns; no hidden token changes                                        |
   | `LINK-MAP.json`           | every named control → destination, in-role / shared / external, tested status           |
   | `SCENARIOS.json`          | fixture snapshots and their provenance, apart from application data                     |
   | `HANDOFF.md`              | interaction states, allowed actions, DTO/command needs, open policies, changes from v46 |
   | `CHECKS.md`               | what was rendered and tested, widths, keyboard paths, unresolved findings               |

4. **The design runtime the export renders with**, if it is not the historical v46 one. Without it,
   board comparisons keep using the historical runtime and stay evidence, not baselines.
5. **Shared surfaces (XS):** the XS export, or acceptance that the role ships with the existing
   account panel and Help inside a v46 island, reported as `ASSEMBLY PENDING XS`.

## 2. Completeness bar (checked before any code)

| Workstream        | Designed ids to cover                                       | V3 seed screens already integrated as specimens |
| ----------------- | ----------------------------------------------------------- | ----------------------------------------------- |
| Super Admin       | 18                                                          | SA-01, SA-02, SA-03                             |
| Institute Admin   | 19                                                          | IA-01, IA-02                                    |
| Student           | 19                                                          | —                                               |
| Faculty           | 21                                                          | —                                               |
| Vendor            | 10                                                          | —                                               |
| Academic Reviewer | 6                                                           | —                                               |
| Content Manager   | 9                                                           | —                                               |
| Public            | 12 (PU-01 and PU-14 are the locked landing: not redesigned) | —                                               |
| Entry & shared    | 7                                                           | —                                               |

- `ROLE-STATUS.json` covers **every** id `SCREEN-OWNERSHIP.json` gives the workstream, with its
  type kept (page, tab, step, state, menu, action): a state or action id maps to behaviour, not to
  a new page. The 24 excluded ids stay excluded.
- Every sidebar destination, its nested pages, tabs, forms and dialogs; the role's account and Help
  entries; populated, empty, error and permission states; one complete primary workflow with its
  return path. An export with only overview or list screens is not complete: intake work may start
  on it, but no migration is claimed.
- `FOUNDATION-LOCK.json` names `XR-V3-RB-1.0` with the ten base hashes of
  `V3-FOUNDATION-RECORD.md` §2. A different base is a new foundation version: stop and ask; the
  scoped stylesheet is regenerated only with the owner's approval.
- No independent theme, palette, sidebar, badge set, form library or second global stylesheet; no
  redefinition of a base class or token. New patterns are additive and namespaced.
- `LINK-MAP.json` has no `href="#"`, silent no-op or alert-only stand-in for an owned function.

## 3. Intake steps (pack prompt 11, in order)

1. **Record and protect.** Record the worktree HEAD; confirm no other session writes to it.
   Hash the archive and every file; copy the export read-only to a versioned reference path
   (`design/v3-refined-b/roles/<ROLE>-<revision>/` with its own `SHA256SUMS.txt`, plus a line in
   `CLAUDE.md`); never edit it. Re-check `design/v3-refined-b` (46/46) and `design/handoff-v46`
   (178/178).
2. **Reconcile ids.** Map every owned id to the actual route, component, action or state
   (`V3-STATUS-REGISTER.json` → `currentImplementation`). v46 `proposedRoute` strings and the
   export's route proposals are not route changes.
3. **Shared components first.** Map each pattern of the export to an existing `@xr/ui/v3`
   component; add what is missing once, centrally, with a row in `COMPONENT-EXTENSIONS.md`
   (new central patches continue at V3P-09). One integration owner writes shared components,
   routing, lockfiles and test configuration.
4. **Product prerequisites, on the first role only** (ADR-0010): the V3 entry
   (`@xr/ui/styles-v3.css`) and the Public Sans `wght@400..800` link in the migrated role's
   layout — never the root layout of the public landing; `apps/web` lint support for V3 classes;
   the Preflight fingerprint test and `e2e/support/built-css.ts` layer order extended to
   `xr.v3.*`; the scope scan in `packages/config/src/scans/v3-reference.scan.test.ts` changed to
   name the migrated routes.
5. **Replace the presentation, keep the behaviour.** Bind the existing sample services and query
   layer; keep role authorisation, guards, validation, revisions, idempotency, refusals, the sample
   login and identity-collision rules, payment separation, WEB completion, the pre-authorised
   device, pinned assessments, the publication and correction pipelines, per-tab identities,
   persistence and reset, grants, groups and mappings. Board sample records and local preview
   state machines are never application behaviour (the preview's local transition function is
   expressly excluded). No real auth, payment, storage, email, AI, hardware or backend.
6. **Keep every other destination working.** Links to roles not yet migrated stay live, with their
   v46 presentation. No user-visible test control, role switcher or debug view.
7. **Test the whole role** from its landing page: every sidebar entry, nested pages, account and
   Help, one complete primary workflow, an empty or no-match case and a permission or refusal case,
   plus the cross-role seams it touches (`pack/CROSS-ROLE-FLOWS.json`) without changing those roles.
8. **Compare at 1440 / 1024 / 768 / 375** on the normal product build against the approved export
   (`tools/v3-reference` extended to the export's boards). The product's data may differ from a
   board fixture: verify the binding, never fake a match. Add each migrated screen state to
   `V3-COMPARISON-MAP.json` `productScreens` and retire the v46 parity comparisons it supersedes by
   name. No masks, blanket skips or looser tolerances; v46 copy or structure assertions change only
   where the approved V3 design changed them; behavioural assertions stay.
9. **Gate and commit.** Focused checks while building, then one full `pnpm verify` on the
   stabilised tree with this worktree's ports (`XR_E2E_WEB_PORT`, `XR_E2E_SPECIMENS_PORT`,
   `XR_E2E_TEST_HOOKS_PORT`; never stopping another checkout's servers). Update the register's five
   columns for every owned id, commit only intended files on `v3/refined-b-ui`, and make a verified
   safety bundle. No push, merge, deployment or landing change.

## 4. Order when several roles arrive together

XS first when it is among them (account, Help, sign-in and shared messages are consumed by every
role). Then Super Admin and Institute Admin, which already have V3 seed screens and whose list,
decision and plan patterns other roles reuse. The remaining roles follow in any order, one cohesive
commit each; each keeps working links to everything else.

## 5. Handover per role

Role id coverage (all owned ids, by type); connected navigation and workflow proof; shared components
and patches added or changed; tests run, with counts and skips; known limitations; source revision
and code commit; startup and a short human review route that reaches every sidebar destination.
Accounts are the seeded sample accounts; accounts created during a browser session are named as such.
The owner's browser acceptance decides the visual result.
