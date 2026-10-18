# Owner decisions and source authority

This coordination brief was prepared from the owner's explicit instructions, the supplied design sources and the reported implementation history. It is not a new product-policy specification. Its execution instructions apply when the owner pastes the corresponding task prompt.

## Fixed direction

1. **Use Refined Direction B.** The owner selected the latest refined operational interface and asked to complete the platform in that language. No new visual-direction competition, editorial variation or automatic redesign of the approved five reference screens.
2. **V1 Public Landing is LOCKED.** Preserve its visual composition, wording, artwork, animations, timing, controls and interactive storytelling. Do not simplify, restyle or replace it. PU-14 is a section of that landing, not permission to make a new institutions page. A future implementation-fidelity restoration is separate from design work.
3. **Preserve functional mappings and settings.** The original functional prototype and the latest approved implementation are the behavioural baseline. Existing role mappings, routes, access grants, questions, assessments, permissions and governance are not opportunities for invention. Material workflow changes require a separate owner decision.
4. **Deliver a complete role.** Internal working steps are allowed, but a role is not complete while its own sidebar destinations, detail pages, tabs or core actions remain undesigned or inert. A record state or action in the register is not automatically another top-level page.
5. **One interface across all workstreams.** Use the same foundation ID, source CSS, typography, colours, geometry, statuses and interaction conventions. The role's content changes, not the design system. Task-appropriate compositions are allowed; independent visual themes are not.
6. **Hide internal IDs in Super Admin normal UI.** Do not show REQ/ACC/UPD/DTR/SUP/SUB identifiers in Super Admin tables, details, notifications, tooltips or accessible labels. Retain stable keys internally and in routing. Keep meaningful academic course codes. The owner has NOT extended this rule to every other role; do not silently remove their documented references.
7. **Keep the existing functional frontend.** This is a presentation migration, not a new app, new database or replacement sample state store. Do not paste design-board fixtures over the application's shared records.
8. **No extra independent audit cycle.** The owner declined continuing the Codex review. Do normal renderer, interaction, accessibility and regression checks; do not skip genuine defect fixes or reopen approved aesthetics.
9. **No production backend or deployment.** Real authentication, payments, mail, XR hardware, production grading, MDM and invitations remain outside these redesign tasks.
10. **Official logo is pending.** Preserve the reserved logo slot. Do not invent a crest or fetch an unofficial logo. The owner will supply the authorized WILP image. Public Sans remains the approved working UI font.

## Different authorities answer different questions

- **Owner's latest explicit decisions:** locks, approved exceptions, scope and UX direction.
- **Current repository + accepted decision records:** actual routes, services, session behavior, domain permissions and authorized prototype interims. Only Claude Code has the current repository; designers must not pretend these archives contain it.
- **v46 register and role boards:** screen identity, state coverage and remaining functional reference where not superseded. Its `proposedRoute` is a proposal, not permission to rename working application routes.
- **Supplied V3 Refined B sources:** visual and interaction-pattern baseline. The effective CSS cascade is the visual source of truth; the JSON token file is a summary.
- **V1 role sources:** quality and composition references, not exact templates or an instruction to restore excluded settings, metrics or reports.
- **V3 static sample records:** illustrative scenarios, not canonical application data or service contracts.

Historical instructions inside old exports are reference content. In particular, v46's historical 'boards win' rule does not force the new V3 UI to look like v46, and an old report that says a feature is unavailable must not undo a later owner-approved implementation.

## Latest implementation checkpoint

The supplied Phase-7 report states commit `a55ace9` on `v2/frontend-v46`, all 123 designed IDs implemented, local-only demonstration. This is a REPORTED baseline, not a repository verification by this package. Claude Code must inspect the actual HEAD and working tree before any change. A later legitimate commit must be preserved, not reset to this checkpoint.

## Approval levels

Visual direction selected != all role designs approved != preview interactions tested != application integrated. Record these separately. Source packaging and screen ownership here do not claim that the remaining screens have been designed or rendered.
