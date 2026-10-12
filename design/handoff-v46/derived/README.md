# Freeze-time extracts (non-authoritative)

These three files were extracted mechanically from the v46 boards when the design was frozen, to make the boards easier to search. They add nothing to the design and decide nothing. Where an extract and a board differ, the board wins.

- `frame-index.json` — every product frame: caption (the state it shows), workspace, screen IDs named in the caption, headings, status labels, visible controls.
- `screen-frames.json` — each designed screen ID → its boards and the frames whose caption names it.
- `controls-by-workspace.json` — controls seen in each workspace’s frames. Evidence of what a role is shown; it is **not** a permission matrix (none was designed — see HANDOFF-AUDIT-v46.md).

Rendered locally with the canvas runtime stand-in; the board files rendered are byte-identical to hosted v46.
