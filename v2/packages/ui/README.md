# @xr/ui

The frozen v46 visual system of the XR Learning Platform (`design/handoff-v46/`, decision record
`docs/decisions/ADR-0001-css-architecture-and-tailwind.md`): the eight v46 stylesheets copied byte
for byte into one cascade layer, a small documented product layer, and React components that emit
the v46 class names and ARIA exactly. No third-party design system.

Phase 0 status: the stylesheet entry `src/tokens.css` is still a placeholder and no component is
exported. The v46 stylesheets are ported in WP-0.5 and the components arrive in WP-0.6.
