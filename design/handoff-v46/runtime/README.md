# Canvas runtime for offline preview (not part of the v46 design)

Every v46 board starts with `<script src="./support.js">`. On the hosted canvas, Claude Design supplies that file; it is **not** one of the 166 design files and is not in `canvas-v46/project/`.

`support.js` here is the copy that ships in the owner’s File-35 package (`file35-current-design-handoff/support.js`, SHA-256 `8fe7df74…28cbe`, 69,150 bytes). It is byte-identical to the runtime Claude used for every local test in Batches 0–8. It is included only so boards can be previewed outside the canvas. It is not design source and is not part of the frozen v46 files.

## Preview a board offline

1. Copy the design files to a scratch folder (never edit `canvas-v46/`): `cp -R canvas-v46/project /tmp/xr-v46-preview`
2. Copy the runtime next to them: `cp runtime/support.js /tmp/xr-v46-preview/`
3. Serve the folder: `cd /tmp/xr-v46-preview && python3 -m http.server 8765`
4. Open `http://127.0.0.1:8765/B8-00-Index.dc.html` (or any board).

The runtime loads React 18.3.1, ReactDOM 18.3.1 and Babel standalone 7.29.0 from unpkg.com. The boards load Public Sans from Google Fonts. Both need internet.
