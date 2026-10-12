# XR Learning Platform — repository instructions

Frontend design reference: `design/handoff-v46/START-HERE.md` (frozen canvas v46). Never edit files under `design/handoff-v46/`.

- The frozen v46 handoff is the visual design authority. Its integrity is checked with `shasum -a 256 -c SHA256SUMS.txt` from inside `design/handoff-v46/` (178 OK expected). Never modify, normalise, reformat, regenerate or re-export any file under it.
- The earlier `v2/connected-frontend-slice1` connected UI was rejected by the owner. It is not a design reference and its UI must never be reused.
- Canvas-only controls (board controls such as "Restart" and "Sample: …", captions, annotations), the fixed-height presentation frames, and the canvas runtime support code (`design/handoff-v46/runtime/support.js`) are not product features and are never copied into the product.
