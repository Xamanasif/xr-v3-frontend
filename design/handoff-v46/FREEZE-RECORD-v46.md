# Freeze record — XR Learning Platform design, canvas v46

| | |
|---|---|
| Design artifact | Claude Design canvas (artifact type “Design”), https://claude.ai/artifact/C6jPtVuZgHqwzAw5jPti1Y |
| Frozen version | **v46** · version id `1791542476-9fc2` (published by Claude on 9 Oct 2026) |
| Status | **APPROVED · FROZEN** as the frontend design reference for implementation |
| Approved by | The owner, 9 Oct 2026 |
| Conditions of approval | Subject to the documented open decisions (`project/handoff/open-decisions.json`, board B8-08) and the known accessibility correction (B1-10, below) |

## Owner-executed hosted checks (Play → Fill, canvas v46)

Performed and confirmed **by the owner** on the hosted canvas. Claude did not execute these.

| # | Check | Owner result |
|---|---|---|
| 1 | B3-11 — the approval-confirmation frame scrolls and its buttons are reachable | Passed |
| 2 | B2-10 → B4-11 — Student Home “Open assessment” opens the Batch-4 board, not a batch index | Passed |
| 3 | B6-04 — after Approve update, the long decision status stays inside its panel | Passed |
| 4 | B8-05 — all eight responsive-proof rows render at 1440 / 1024 / 768 / 375 with no blank or cropped screens | Passed |

## Source integrity (checked by Claude at freeze)

- The live version of the artifact is still `1791542476-9fc2` (v46). No later version exists.
- The artifact holds 166 design files of its own (128 boards, 8 stylesheets, 19 SVG artworks, `canvas.json`, 10 handoff data files). Claude read all 166 back from version `1791542476-9fc2` (116 right after publishing, the other 50 at freeze) and compared them byte for byte with the build: **166 / 166 identical**.
- `canvas-v46/project/` in this package is exactly those 166 hosted files. SHA-256 for each is in `MANIFEST.json` and `SHA256SUMS.txt`.
- The artifact also serves the Claude Design type’s own files (`index.html`, `SKILL.md`, `artifact-type/…`). They are the canvas application, not the design, and are not included.

## Local verification behind this version (Claude, Batch 8)

3,741 / 3,741 local checks passed: navigation 132, Batch-8 reach 72, earlier interaction suites (B2 123 · B3 233 · B4 321 · B5 184 · B6 398 · B7 161) and earlier reach suites (B4 466 · B5 456 · B6 490 · B7 705). Rendered link crawl of every product frame: 10,366 links — 0 to a batch index, 0 dead, 0 missing, 0 into another role’s workspace. Details: `verification/`.

## Freeze rules

1. Do not redesign, regenerate, rearrange or edit any approved screen of v46.
2. Do not regenerate Batches 1–3 from their generators: they predate the Batch-8 link corrections and would undo them. The published HTML is the source of truth.
3. No new design batch. This freeze is recorded here, outside the canvas — no canvas version was created to add a label.
4. Any change after the freeze needs a new canvas version and a new owner approval; the implementation then states which version it follows.
