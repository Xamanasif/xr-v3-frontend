# XR Learning Platform — repository instructions

Frontend design reference: `design/handoff-v46/START-HERE.md` (frozen canvas v46). Never edit files under `design/handoff-v46/`.

- The frozen v46 handoff is the visual design authority. Its integrity is checked with `shasum -a 256 -c SHA256SUMS.txt` from inside `design/handoff-v46/` (178 OK expected). Never modify, normalise, reformat, regenerate or re-export any file under it.
- The earlier `v2/connected-frontend-slice1` connected UI was rejected by the owner. It is not a design reference and its UI must never be reused.
- Canvas-only controls (board controls such as "Restart" and "Sample: …", captions, annotations), the fixed-height presentation frames, and the canvas runtime support code (`design/handoff-v46/runtime/support.js`) are not product features and are never copied into the product.
- The V3 Refined Direction B reference (foundation `XR-V3-RB-1.0`, ADR-0010) is frozen the same way: never edit, normalise or regenerate files under `design/v3-refined-b/`; check it with `shasum -a 256 -c SHA256SUMS.txt` from inside `design/v3-refined-b/` (46 OK expected). Its `.dc.html` sample records and local decision methods are not domain logic, and its `proposedRoute` strings are not route changes. Normal product routes keep the v46 presentation until an owner-approved complete role export is integrated (`design/v3-refined-b/pack/11-Claude-Code-Complete-Role-Intake.md`); the public landing (PU-01, PU-14) stays locked.
