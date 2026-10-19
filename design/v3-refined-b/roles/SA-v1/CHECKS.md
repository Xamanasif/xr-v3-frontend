# Checks — what was actually done

Environment: headless Chromium (Playwright) in a cloud sandbox, `prefers-reduced-motion: reduce`. Google Fonts is blocked in that sandbox, so test runs served the open-licence Public Sans variable font from npm (`@fontsource-variable/public-sans` 5.1.1) through the same `fonts.googleapis.com` URL the page requests. No font files are included in this package. Scripts are in `checks/`.

Legend: **RENDERED** = screenshot taken and inspected or measured · **LOGIC TESTED** = scripted interaction with assertions · **SOURCE CHECKED** = read, not executed · **NOT TESTED**.

## Rendered

- Every owned ID's primary state at **1440, 1024, 768 and 375** (80 full-page captures) — RENDERED. Captures I inspected by eye: SA-01, SA-03, SA-07 at 1440; SA-06, SA-07, SA-11, SA-22, SA-17 at 375; SA-10/11, SA-12, SA-13 at 1024; SA-14, SA-16 at 1440; state boards for dialog, drawer, account menu, preview controls at 375; paused institution and held update at 1440. The rest were measured by script only.
- 29 key states at 1440, 768 and 375 (87 captures): validation, confirmations, decided, paused-blocked, quiet, loading, failed, no match, empty, no Institute Admin, paused, ended, awaiting payment, on hold, released, not yet approved, published record, move blocked, inline withdraw, stale refusal, still with institution, resolve note required, resolved, drawer, account menu, signed out, not available, preview controls — RENDERED.
- Overflow, internal-ID and placeholder-link sweep: 40 routes × 4 widths = 160 page checks; **0** horizontal page overflow, **0** internal IDs in text or accessible names, **0** `href="#"`/empty links, 0 console errors.
- Fidelity to the selected seeds: SA-01 renders at 1440 × 2057 and 375 × 3941, SA-02 at 768 × 1328 — the same board heights as the V3 canvas index for those boards.

## Logic tested — 104 assertions, 0 failures

`journeys.js` (84), `extra.js` (12), `extra2.js` (8):

- J1 new access (8 Oct): row opens → title focused; missing classification refused with focused error summary; External → dialog (focus on title, Tab cycles Cancel ↔ confirm); confirm → outcome focused, “Approved — payment required”, payment waiting; no Mark paid / Decline; back → list heading focused; nav count 3 → 2; row status updated; institution record created with no plan and no status action.
- J2 Internal separately: access active, payment not needed; institution appears in set-up gaps.
- J3 Assign Institute Admin: both field errors; identity collision refused; success flash focused; Overview gap cleared.
- J4 Pause needs reason → paused → request from paused institution has no decision form → restore; Escape returns focus.
- J5 Correction: hold needs reason → held → release refused, live version unchanged → lift hold → release (access-unchanged copy) → 1.3 live → corrections count 0.
- J6 Stuck override: reason required; Published never offered; returned to vendor; set-up gaps 3 → 1.
- J7 Scope: kind required; course required; assign; duplicate refused; withdraw needs reason; restore.
- J8 Support resolve (note required) and reopen. J9 Transfer approve, no Decline, not shipment. J10 Stale decision refused, focus on refusal, nothing changed.
- J11 Drawer at 768 (focus, trap, Escape, navigation). J13 Account menu (focus, arrows, Escape). J14 Quiet Overview and quiet group still reachable. J15 Loading, failed + Try again, empty, no match + Clear filters focus. J16 Help report → My reports and Operations › Support. J17 Add course/rename validation, move blocked. J18 Konark-paused board.
- Extra: smaller scope validation, change summary, decided; renewal — smaller scope disabled, classification locked, no first-activation copy; information request without dialog; Overview and nav counts after all decisions; add course → new record; move allowed; duplicate name; add area; register collision and success; student override.

## Source checked only

Edit description dialogs; area rename success; the preview's `?scenario=` switch inside the published artifact.

## Not tested

- The published artifact page itself (no renderer for claude.ai pages from this session); it serves the same source files that were tested locally.
- Real screen readers (only accessible names, roles and focus order were asserted). Browser zoom at 200/400 %. Safari and Firefox.
- Any React integration — out of scope.

## Known limits

- The V3 `.dc.html` runtime (`support.js`) and state wrappers were not supplied, so the role is built as plain HTML + JavaScript. It does not claim to recover the missing V3 wrappers; `boards.html` is a newly authored inspection board.
- Programmatic focus on the page heading after each navigation shows the focus ring (as the V3 seed does on SA-03).
