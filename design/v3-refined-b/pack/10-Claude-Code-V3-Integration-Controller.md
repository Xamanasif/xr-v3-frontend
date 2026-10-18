# XR Learning Platform - V3 presentation migration controller
## Reuse the working application; integrate approved complete roles

Act as the lead frontend engineer and integration owner. The product already exists. You are not asked to rebuild the platform, redesign the UI from scratch, reimplement its backend or copy static demo logic into services.

The owner selected Refined Direction B and authorized complete-role design workstreams. This task establishes the safe V3 foundation and coordinates subsequent owner-approved complete-role imports. Start the foundation now. Do NOT invent or migrate unsupplied role designs.

## 1. Read source authority and establish scope

Read all five `common/` documents in the supplied coordination pack, `FOUNDATION-LOCK.json`, `SCREEN-OWNERSHIP.json`, the current V3 sources and HANDOFF-original.md. Read the actual repository's instructions, architecture and latest accepted decision/phase records.

The files here contain the selected V3 visual foundation and v46 reference coverage, not the latest React repo. Current working routes, contracts, state and accepted prototype exceptions live in the repository. Reconcile references by screen ID. v46 `proposedRoute` strings are not instructions to rename routes.

Do not treat the source HTML's hardcoded sample records, local decision methods or historical scripts as authoritative domain logic.

## 2. Safe repository preflight

Expected active source checkout: `/Users/mymac/Desktop/AR-VR-frontend-v46`.
Expected baseline branch: `v2/frontend-v46`.
Last reported accepted checkpoint: `a55ace9`.
Protected original checkout: `/Users/mymac/Desktop/AR-VR`, last reported at `1b090c9` with a 98-path uncommitted baseline.

Inspect the ACTUAL repo root, HEAD, status, worktree list, common git directory and running work. Capture their current state. If HEAD is later than a55ace9, establish that it is the intended descendant and preserve it; do not reset. If the active source has uncommitted work, do not stash, commit, discard, switch branches or include it silently. Report it and obtain a safe base; read-only planning can continue.

Create and verify one fresh pre-change Git safety bundle from the verified source HEAD. A Git bundle does not include uncommitted or untracked files: preserve those with the existing backup mechanism when necessary and state the distinction. Verify the existing protected-original and frozen-source checks, rather than trusting historical counts.

Use a new isolated worktree for integration:
- proposed branch: `v3/refined-b-ui`
- proposed worktree: `/Users/mymac/Desktop/AR-VR-v3-ui`

If either already exists, inspect and resume only the intended V3 work; never overwrite it. Creating linked-worktree metadata is expected, but leave all protected working-tree files and branches unchanged.

No remote setup, push, deployment, merge into the protected baseline, force checkout, reset, git clean, broad killall or copying secrets. One integration owner writes shared components, routing, lockfiles and test configuration. Do not run parallel mutating agents in this same checkout.

## 3. Foundation-only first deliverable

Inspect the current component/library structure and adapt it. Likely locations are under `v2/apps/web` and `v2/packages/ui`, but confirm. Build a backward-compatible V3 presentation layer using shared components, existing semantic controls and approved Refined B tokens.

Keep copied design references in a NEW V3 reference path, separate from frozen `design/handoff-v46`. Record source hashes and foundation ID. Add V3 styles with scope/variant boundaries so they do not accidentally restyle old screens or the locked landing. Reuse the existing component API where it preserves behavior; do not create a second app or duplicate state framework.

Foundation includes: rail/menu, account chrome, typography, page/section layout, buttons/fields, lists/tables, filter/sort controls, notices/statuses, plan/format indicators, tabs/steps, detail/decision layout, dialogs and accessible empty/error states. Role-specific new components are additive and governed centrally.

Use the supplied five screens as rendering/test specimens for the shared layer. Foundation work is not permission to migrate those five normal routes alone and call Super Admin/Institute Admin done. Normal product routes remain the current working implementation until a complete role export is received and approved. A test/specimen harness must not become a product-visible role switcher or debug dashboard.

The current V3 subset is missing wrappers and the latest support.js. Read it as reference. Do not import DCLogic, custom design-host runtime, an iframe canvas or CDN preview scripts into the product. Implement actual React UI using existing libraries. Do not redesign the approved aesthetics to compensate for a missing design runtime.

## 4. Preserve the functional application

Keep existing service contracts, role guards, original mappings, navigation destinations, shared query/state management, revision checks, command idempotency and rejection behavior. A skin migration must not introduce a new mock store, seeded global fixtures or a user-visible bypass.

Preserve the current authorized local behaviors:
- sample email login and identity-collision protection;
- sample payment and institution activation separation;
- staged system-owned WEB completion and format feedback;
- pre-authorized sample device and transfer chain;
- pinned assessment versions, objective-answer local stand-in, written marking and release-term rules;
- first publication and correction review/release pipelines, private revisions and audience-filtered reasons;
- per-tab identities, cross-tab world synchronization, versioned persistence, corruption recovery and explicit reset;
- grants, groups, faculty mappings and unresolved overlapping/licence semantics.

Do not persist credentials, sessions or request tickets. Do not add real auth/payments, storage, email, AI, hardware or backend infrastructure.

Bind all displayed fields to actual authorized read models. Do not hardcode 4 institutions, 13 experiments, 860 licences, the board date or a specific name. Derive counts and deadlines from the application records/clock with the existing semantics. Multi-plan/multi-course data must remain supported even when the reference board shows only one.

When a reference says a renewal or extra-licence approval changes a plan but the service returns policy-open/no-effect, keep the existing safe behavior and accurate explanation. Do not broaden 'approve smaller' validation. Copying the preview's local transition function is expressly prohibited.

## 5. Handle known design issues without reopening aesthetics

Inspect current contracts before using new urgency sorting or a changed renewal link. Use existing valid destinations and approved ordering where a policy remains open; document the narrow discrepancy. A selected visual design is not a new priority engine.

Do not overwrite Konark or other ambiguous sample records. Separate scenarios when testing static references. In the app, the current world wins for facts. Hide IDs in Super Admin UI/accessibility text, not in internal keys; retain academic codes and do not extend removal to other roles automatically.

Fix confirmed accessibility/behavior problems in shared primitives: dialog/drawer focus entry/trap/return, Escape, visible mobile sort at the TABLE's actual breakpoint, field/error association, table semantics and concise live announcements. Do not copy source defects because a screenshot was approved. A focused state patch is not a new visual-design cycle.

## 6. Complete-role intake and migration queue

The complete-role prompts cover SA, IA, ST, FA, VE, RV, CM, PU and shared XS. Roles can finish in any order. Import only a completed source export with owner approval; read its ID register, hash/version, link map, scenarios and handoff first.

Create a status register with SEPARATE columns: design supplied, owner approved, implementation complete, browser checked, open issue. Include all 147 source entries, with 24 excluded. Keep the 123 designed IDs accurate; preserve PU-01 and PU-14 as locked design content with a separate landing-fidelity integration state.

For each approved role:
1. Map every owned ID to the actual current route/component/action/state.
2. Replace the presentation for the complete role, reusing shared primitives and existing services.
3. Retain every working existing destination. Never remove or disable a link because its V3 design is pending in another role.
4. Integrate borrowed XS surfaces consistently; shared Help/account must still function. If XS V3 is pending, retain the existing working behavior with a compatible shell and report that visual dependency honestly.
5. Test full sidebar exploration plus its nested paths, primary mutation and refusal/error path. Do not ship an overview-only role under a complete label.
6. Record and commit a cohesive verified role migration on the V3 branch. User approval governs accepting its visual result.

Partial work can remain isolated on the migration branch, but do not expose half-migrated role designs as completed deliveries. Subsequent role exports enter the same integration pipeline, not separate replacement prototypes.

## 7. Keep the landing locked

Do not change the current public root route, global CSS affecting it, V1 source/asset files, its text or animations during foundation or role migration. The Public non-landing task excludes PU-01 and its PU-14 section.

The current baseline reportedly has a simplified v46 homepage; preserving it during admin migration is NOT proof that V1 fidelity has been restored. Track that separate integration task honestly. The optional landing-fidelity prompt in this pack is HOLD ONLY and does not activate automatically. It requires its own owner go-ahead and the authorized missing asset/runtime inputs.

## 8. Efficient verification and intentional visual-baseline migration

Use existing tools and scripts; inspect available commands instead of installing an unrelated test framework. Run focused type/lint/unit/component checks during edits. Verify role flows and responsive behavior at 1440/1024/768/375 when the role stabilizes. Include screenshots of the normal product build, not only test-hook rendering.

Keep builds, caches and test ports in this worktree. Check port availability; do not terminate unrelated sessions or saturate the Mac with overlapping whole-suite runs. Run one full existing `pnpm verify` after a coherent complete-role milestone, repeating after genuine fixes, not after every spacing edit. A batch of already-approved complete roles may share one final gate if every role has focused proof and the report identifies that tree.

Redesigned screens will intentionally differ from v46. Keep frozen v46 sources and baselines intact as history. Add a scoped V3 comparison map for migrated screens/states, with owner-approved references and explicit replacement/supersession provenance. Unmigrated screens remain under their old checks. Do not broadly ignore visual tests, loosen tolerances, mask content or count superseded cases as newly passed. Adapt legitimate old copy/structure assertions only where the owner-approved V3 presentation intentionally changed; preserve behavioral assertions.

No independent Codex audit loop. Do perform self-review and fix real defects. Report actual test output, failed attempts, skips and remaining limits accurately. Avoid rerunning an hour-long gate while merely writing a draft status note; finalize source changes before the gate.

## 9. First handover and stop point

For the foundation-only task return:
- actual base HEAD, branch/worktree and safety evidence;
- foundation source ID and hashes;
- existing components adapted, additive variants and scope boundaries;
- specimen/targeted test results and any actual issue;
- confirmation that normal routes, user data, locked landing and protected originals were not changed;
- commit and exact files;
- ready-role intake requirements.

Stop after the foundation if no owner-approved complete-role source export is available. Do not fabricate the remaining designs or implement screens from narrative alone. Once a complete approved role is supplied, use the role-intake instruction to continue in the same worktree.
