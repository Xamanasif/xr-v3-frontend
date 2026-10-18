# Parallel execution and whole-role delivery

## One accountable owner per registered screen

`SCREEN-OWNERSHIP.json` assigns every designed ID once. The central register preserves the original type: page, tab, step, state, menu or action. Do not turn 51 state/width artboards into 51 new product pages, and do not omit actions because they are not sidebar entries.

Each role's deliverable must contain:
- all its own registered IDs, including approved V3 seed screens integrated without aesthetic reinvention;
- every sidebar destination and the appropriate nested pages, tabs, forms and dialogs;
- its inherited account/help/refusal states from the shared XS contract;
- a normal navigation path from the role home to each primary task and a return path;
- populated and relevant empty/error/permission states, not just the attractive overview.

Internal milestones are allowed. Do not stop after the overview and call a role complete. If interrupted, leave an honest continuation record and resume the same role; do not discard files or restart its design system.

## Working preview per role

Build a role entry experience (RoleStart or equivalent supported entry). Route between owned views inside that preview and keep its representative records in one role-preview state, using the platform's supported component composition. Separate inspection boards may show widths and scenarios, but clicking around a live role journey must not reset the decision just taken.

If the design host cannot retain state across independent artboards, keep the connected journey in a single role preview root with subviews. Static artboards remain useful evidence but are not a substitute for that connected role experience. Do not add a backend or production state framework to accomplish this.

Every owned destination needs meaningful behavior. No `href="#"`, silent no-op or alert-only placeholder standing in for an approved in-role function. Anchors to real sections are fine. For policy-open behavior, use the existing explanatory/refusal state, not a fabricated mutation.

Cross-role live continuity is the React application's job. In separate design sessions, use consistent documented handoff records; never claim changes propagate between independent private canvases. Keep documented permission boundaries: do not introduce an account switcher or unauthorized cross-role links into normal product UI.

## Shared XS dependency

XS owns account menu, Help, sign-in/session and shared messages once. All role teams consume that same contract and retain the V3 shell. They can begin immediately using existing v46 shared behavior with V3 tokens while the XS team completes its designs; mark these borrowed surfaces, not independently owned redesigns.

Before a role is declared complete, its Account and Help controls must navigate to the delivered shared component or a faithful reusable implementation of the same agreed shared contract. If the environment cannot import it yet, report `DESIGN COMPLETE / ASSEMBLY PENDING XS`, not fully connected. Do not block independent page design while waiting for shared packaging.

The real app must keep its existing working Help, account and navigation available throughout migration, even before XS has its V3 styling.

## Wave recommendation

Start complete Super Admin, complete Institute Admin and Shared Surfaces design sessions using their packs. Claude Code can prepare the scoped V3 component foundation at the same time, without changing normal routes.

Student, Faculty, Vendor, Academic Reviewer, Content Manager and Public non-landing packs are independent assignments that can begin as capacity permits. They do not need to wait for a previous role's frontend integration. Keep only as many concurrent sessions as can actually run under the available account and machine limits; do not promise parallelism bypasses limits.

Deliver finished roles independently. One Claude Code integration owner updates shared components and imports owner-approved role exports. Parallel coders, if authorized later, work in isolated worktrees and non-overlapping files; no concurrent writes to a shared checkout, lockfile, router or stylesheet.

## Package output contract

Each design delivery exports a small SOURCE ZIP first, not one huge archive dominated by screenshots:

- `START-HERE.md`: role, foundation version, exact screen coverage, live preview entry and limits.
- `ROLE-STATUS.json`: each owned screen's source, kind, route proposal, states and completion evidence.
- `project/`: all newly authored source, shared style references and assets needed by the design host; include every wrapper that the new canvas lists.
- `FOUNDATION-LOCK.json`: base version and original shared-file hashes; local additions listed separately.
- `COMPONENT-EXTENSIONS.md`: reused and new role-specific patterns, no hidden token changes.
- `LINK-MAP.json`: source screen, named control, destination screen/route, in-role/shared/external classification and tested status.
- `SCENARIOS.json`: explicit fixture snapshots and provenance; separate from application data.
- `HANDOFF.md`: interaction states, allowed actions, DTO/command needs (existing names if known), known open policies, sources and changes from v46 visual treatment.
- `CHECKS.md`: what was actually rendered/tested, widths, keyboard paths and unresolved findings.

Export screenshots separately by role or as a small optional archive. Include desktop and phone evidence of representative states; full-width/long content captures must be genuinely rendered, not reconstructed by hand. Do not include dependency folders, caches, machine secrets, screenshots of private unrelated material or font files copied from the machine.

## Visual and functional verification without an audit loop

Use targeted checks while building. Render every owned screen in its primary state, and inspect representative complex states and shared patterns at 1440/1024/768/375. Check overflow, text wrapping, menu/dialog focus, visible sorting, long names, error summaries and empty data. Exercise the role's main workflow plus its important refusal/return case.

Use `RENDERED`, `SOURCE CHECKED`, `LOGIC TESTED` and `NOT TESTED` distinctly. A stub passing is not visual proof. Do not ask the owner to inspect dozens of repetitive artboards to compensate for avoidable renderer checks; give a short review path through all sidebar destinations and key details.

Do not run a new Codex audit cycle. Do not interpret that as permission to ignore accessible controls or broken routes. Fix real defects within the selected design, then deliver the whole role.
