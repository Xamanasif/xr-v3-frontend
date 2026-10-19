# START HERE — Super Admin complete role · Design V3 Refined B

- **Role:** Super Admin · **Foundation:** `XR-V3-RB-1.0` (base CSS byte-identical, see `FOUNDATION-LOCK.json`)
- **Owned IDs:** 18 — SA-01, 02, 03, 06, 07, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22. Not designed (excluded): SA-04, 05, 08, 09, 23, 24, 25.
- **Seeds kept:** SA-01, SA-02, SA-03 reproduce the selected V3 layouts; only data binding, links, states and accessibility were added.

## Status

| Level | State |
|---|---|
| DESIGN COMPLETE | Yes — all 18 IDs with their states (`ROLE-STATUS.json`) |
| CONNECTED PREVIEW COMPLETE | Yes inside the role — every rail destination, tab, detail and action is live; decisions persist while navigating |
| ASSEMBLY PENDING XS | Account menu, Help & support and signed-out page are borrowed implementations of the XS contract |
| OWNER APPROVAL PENDING | Awaiting your visual acceptance |

## Open the live role

- Published preview: https://claude.ai/artifact/JZbKjAN1hdq4DvcjSGHdJN (private until you share it).
- Locally: open `project/index.html` in a browser (internet needed only for the Public Sans webfont). `project/boards.html` shows the same preview at 1440 / 1024 / 768 / 375.
- **Preview controls** (dashed button, bottom right; not product UI): scenario, list loading/failed/empty, “next decision meets a change made elsewhere”, jump to any SA ID, reset. Add `?clean=1` to hide them; `?scenario=busy|new|quiet|konark`, `?list=…`, `?stale=1` also work locally.

## Ten-minute review path

1. Overview → category chips → **Open renewal request** (SA-03 renewal) → back.
2. Preview controls → scenario **8 Oct** → Requests → Godavari → Approve without classification (error) → External → confirm → Back to requests (count 3 → 2) → Institutions (record created). Reset → repeat with Internal.
3. Institutions → Sahyadri → Assign Institute Admin. Godavari → Pause (reason) → its open request is blocked → Restore.
4. Content → Updates → Distillation Column → Hold (reason) → release refused → Lift hold → Release. All content → DC Motor Speed Control (stuck).
5. Platform roles → Reviewers → Dr K. Iyer → assign EEE ZC341 → DC Motor is no longer stuck.
6. Operations → Device transfers → Rahul Verma → Approve. Support → a report → Resolve / Reopen. Access ending.
7. Academic structure → Thermodynamics & Heat Transfer (move blocked) → Add course.

## Package

`project/` source (+ `canvas.json`) · `ROLE-STATUS.json` · `LINK-MAP.json` · `SCENARIOS.json` · `COMPONENT-EXTENSIONS.md` · `HANDOFF.md` · `CHECKS.md` · `FOUNDATION-LOCK.json` · `checks/` (Playwright scripts). Screenshots are in the separate evidence ZIP.

## Limits

The V3 design runtime (`support.js`) and state wrappers were not in the pack, so the role is plain HTML + JS; nothing claims to recover missing V3 files. The published page itself was not rendered from this session; its source files are the ones tested. No React code, old canvas, master CSS or reference file was changed.
