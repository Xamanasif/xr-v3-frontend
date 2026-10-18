# Shared visual foundation: XR-V3-RB-1.0

This label identifies the supplied Refined Direction B files for coordination. It is not the name of a remotely installed Claude Design system. Every role pack contains byte-identical copies of these same sources.

## Required reading

Read `references/v3/design-tokens.json`, `references/v3/project/core.css`, `rb.css`, `rb-kit.css`, the five screen implementations contained in the four HTML components, and `references/v3/HANDOFF-original.md`.

Source layers: `.xr` base -> `.rb` refined shell -> `rk-` operational components. Use the resolved values together. A legacy serif variable in core.css does not authorize the rejected Editorial direction.

## Visual contract

- Public Sans; headings navy `#141B5E`; indigo selection/links `#3B49B8`; gold primary action `#E9A825`; paper `#FFFFFF`; canvas `#F3F4F9`.
- Ivory `#FBF5E6` communicates urgency; plan tint `#ECEFFB` carries institutional access context. Do not allocate arbitrary colours to roles or add decorative charts/gradients.
- Shared body target 16/24; page title 40/46, phone 32/38; record title 38/44, phone 30/36; section 20/28; labels 14.5/20. Reuse exact component variants instead of shrinking text to fit.
- Keep the existing 248px navy rail, selected indigo item with gold marker, shared icon language, title/account chrome, border/shadow treatment and control geometry. Role labels and nav destinations differ; the shell design does not.
- Shared controls: 44px fields; button variants from rb.css (40px standard, 46px large); visible focus; status text plus shape; one clear primary action per active context.
- Real reflow at 1440, 1024, 768 and 375 CSS px. Container-query breakpoints depend on the owning component, not a blanket viewport substitution. The rail becomes a drawer below 1024 app px; table, toolbar, detail and format grids each have their own thresholds.
- Preserve labelled mobile rows, visible sorting at narrow widths, content-driven document height, correct zoom behavior and reduced motion. Never shrink a fixed 1440px canvas to pretend it is mobile.

## Consistency without generic dashboards

Use the approved shell and components but compose the page around its task. A Student experiment workspace is not a Super Admin queue with a different heading. A marking page gives the answer room; an authoring flow gives the form room; a library gives discovery room. Do not replicate eight equal cards, triple navigation columns or empty giant panels everywhere.

Do not add dashboard measures simply to make a populated screen attractive. Use only facts the role can legitimately read, with units and time periods. Treat a fresh institution's zero-data state as an intentional experience, not as grounds to invent students or usage.

## Format semantics

The same appearance must never silently change meaning:

- Solid navy: selected/requested/included, using explicit context text (Requested on a request; In your plan on an institution plan).
- Dashed indigo: published but not selected/included in that context.
- Muted grey: not published; never use it to mean merely withheld from a Student.
- Student launchability is a separate authorization fact. A published format or institution plan is not enough to enable a Student's Launch button.
- Keep WEB/AR/VR/MR order. If a format needs an additional role-specific state (pending authorization, paused access, no personal grant), retain the common visual primitives and give it an explicit text label rather than overloading 'Not published'.

## Immutable base, controlled extensions

The copies under `references/` stay unchanged. Reuse them as read-only imported styles/components or copy them byte-identically into the new project. Add owned styles in a separately namespaced file (for example `v3-student.css`), without redefining base classes or global tokens.

A genuinely new role-specific component may be built using the existing tokens. Record its properties, states, ownership and reuse in `COMPONENT-EXTENSIONS.md`. A change to a global token, navigation convention or shared behavior is a proposal for the central integration owner, not a local override.

A confirmed accessibility or correctness defect is not frozen forever: fix it centrally as a small versioned patch, document the reason and propagate the same patch to every consumer. Do not use that exception to change approved aesthetics.

## Shared surfaces

The XS workstream owns sign-in, session states, account menu, help and global notices. Role workstreams own their role content and the placement of shared components. They must not independently redesign seven incompatible account menus or sign-in screens. See the dependency contract for how to keep work moving while XS finishes.
