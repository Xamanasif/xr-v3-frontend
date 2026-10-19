# CHECKS · XS Entry & shared · XR-V3-RB-1.0

**Bottom line:** every owned screen was rendered at 1440, 1024, 768 and 375 and its main paths were exercised in a real browser against the final source. The last run found 0 axe violations, no horizontal page overflow, clean consoles and no failed steps. What was *not* done is listed in §5.

| Term | Meaning here |
|---|---|
| RENDERED | Drawn in Chromium from the exact project files, inspected (screenshot and automatic checks) |
| LOGIC TESTED | Exercised by clicks or keys in that render, with the result read back from the page (focus, text, attributes, counts) |
| SOURCE CHECKED | Read in source only |
| NOT TESTED | Not checked |

## 1. Environment

- **Files:** the 41 files in `project/` (36 `.dc.html`, 4 stylesheets, `canvas.json`), copied unchanged to a local static server, plus local test wrappers (`verification/fixtures/`).
- **Runtime:** the design host's own `.dc.html` runtime (`dc-runtime.js` from the Design artifact type, served as `support.js`), the same runtime the canvas uses.
- **Browser:** Playwright with Chromium 1194, headless, device scale 1, mouse and keyboard input.
- **Font:** Public Sans variable (OFL, `@fontsource-variable/public-sans`), served in answer to the Google Fonts request because Google Fonts is blocked in the sandbox. Same family and weight axis; every render reported `Public Sans loaded: true`.
- **Accessibility engine:** axe-core 4.10.2 with tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`.
- **Automatic checks on every render:** horizontal overflow (document and each element), text under 14 px, font loaded, console errors and warnings, HTTP errors.
- **When:** 18 Oct 2026, after the last source change (removal of four unused rules from `xs-shared.css`). Every log in `verification/logs/` was produced after that change. The canvas holds the same files (Version 6; published hashes compared for the main files).

## 2. Rendered

| Set | Count | Result |
|---|---|---|
| Canvas boards at their frame sizes (`t-final`) | 36 | All render; console clean; no horizontal overflow; font loaded |
| Width matrix (`t-verify`): 14 states × 1440/1024/768/375 (drawer at 768 and 375 only) | 54 | **54 × axe 0 violations**; no horizontal overflow; console clean |
| Galleries and component artboards (`t-gal`) | 7 | Console clean; no overflow |
| Long content (`t-long`) | 9 | No page overflow; text wraps (see below) |

**Width-matrix states:** sign in · missing details · signed out · session ended · account menu open (Rahul) · Not your workspace (Meera) · My reports (Meera) · Report a problem with errors · Report sent (Rahul) · report detail reopened (Kavya) · paused Institute Admin home · inactive Student home · paused refusal (Rahul) · drawer open (Meera).

**Long content:** a 58-character name and a 77-character institution in the account menu at 1440 and 375; a 130-character report title, a 147-character *Where* path, an unbroken 92-character string, an 88-character file name and a long resolution note in the list (1440, 375), detail (1024, 375) and form (375, with a 109-character pre-filled *Where*); a 120-character return address in the session-ended notice at 375 and 320; a 104-character e-mail typed into the sign-in field at 375. Two `CLIP input.rk-input` notes in the log are single-line inputs scrolling their own long value, which is expected.

**Text under 14 px:** only the foundation's own `.rb-logo` placeholder label and the `.rb-count` badge (13 px in `rb.css`, left byte-identical). Every XS-authored text is 14 px or larger.

## 3. Logic tested

Evidence IDs are used in `LINK-MAP.json` and `ROLE-STATUS.json`. Logs: `verification/logs/`.

| ID | What was exercised | Where | Result |
|---|---|---|---|
| J1 | Empty sign-in → summary (focus) → link focuses the field; unknown e-mail → *isn’t right*, password cleared, e-mail kept; `Rahul.Verma@godavari.edu.in ` (capitals, trailing space) → Signing in… → Home H1; account menu (focus on My device, Escape, arrows) → Help → Report a problem → empty send (summary) → send with text and a screenshot name → *Your reference is SUP-0214* → list (2 rows) → detail → Home → Help (still 2 rows) → Sign out → *You’re signed out* | Main @1440 | Pass |
| J2 | Session ended (Student address) → sign in as Meera → XS-06 in her own shell, no rail item current → Back to Overview | @1024 | Pass |
| J2b | Session ended → sign in as Rahul → back on the experiment page, *My courses* current | @1024 | Pass |
| J3 | Godavari paused, session ended → Rahul → paused refusal → Home with banner and notice → sign out and in → notice still there | @768 | Pass |
| J4 | Session ended → Sneha (inactive) → inactive refusal; home notice; menu without My device | @1440 | Pass |
| J5 | Institution sign-in → notice replaces the button and takes focus; Forgot / First time disclosures; Back to experiments → public slot → Sign in; Request institutional access | Main @1440 | Pass |
| J6 | Super Admin: empty list → send → sent without reference → list → detail; scan of text and accessible names finds no internal IDs | @1024 | Pass |
| J7 | Drawer at 375: focus to Close; Shift+Tab and Tab wrap; Escape → Menu; choosing *Usage* closes it and focuses the H1; scrim closes | @375 | Pass |
| J8 | Meera, Godavari paused: banner + Institute Admin notice; banner Help → Help | @1440 | Pass |
| K1 | Sign-in Tab order (9 stops, listed in §4); Enter on Sign in with nothing filled → summary; summary link → field; Show/Hide; Enter in the password field submits (Kavya lands on Overview) | @1440 | Pass |
| K1b | Seven Shift+Tabs back to *Sign in with your institution* → Enter → notice focused → Tab → E-mail | @1440 | Pass |
| K3 | First Tab = Skip link (visible when focused) → Enter → main; account button: Enter opens on the first item, ArrowUp wraps to Sign out, Home, End, Escape returns focus (`aria-expanded` false), ArrowDown opens, Tab, Tab out closes; Space opens → ArrowDown → Enter on Sign out → signed out | @1440 | Pass |
| K3b | Tab out closes; a click on the name inside the panel keeps it open; an outside click closes it and returns focus to the button | @1440 | Pass |
| K5 | Drawer at 768: focus to Close, Tab and Shift+Tab wrap, Escape → Menu; Enter on *People* → H1, drawer gone | @768 | Pass |
| K6 | Help by keyboard: H1 → Report a problem → form fields in order (What happened, Where, Screenshot, Send, Cancel) → Enter on empty Send → summary → link → textarea (`aria-describedby` hint + error) → type → Send → Report sent → View my reports → first row → detail | @1024 | Pass |
| K6b | Error summary by keyboard; `aria-invalid` true; summary and field error clear when text is typed | @1024 | Pass |
| K7 | Reduced motion: menu animation none | @1440 | Pass |
| F2 | Super Admin ID scans on the account menu board, the sent → list → detail board and XS-06 (text, `aria-label`, `title`); institution sign-in by keyboard; Anil's new report survives sign-out and sign-in and does not appear in Kavya's list | @1024/1440 | Pass |
| L1–L10b | Every control in `LINK-MAP.json` (23 runs): My device, crumbs, XS-06 Help with pre-filled *Where*, every banner/notice/refusal Help, Try again → loading → list, Cancel, sent crumb, empty-state action, Back to Home from sent and refusals (notice kept), specimen notes on the five component artboards, Send pressed twice → one report, Sign in pressed twice → one sign-in | various | Pass |
| SW | All eight sample people: sign in, every rail destination (33 in total) gets its H1 and `aria-current`, Help & support (rows per person), account button name, menu head and items, Sign out → notice focused | Main @1440 | Pass |
| AX | Chromium's computed accessible names for sign-in controls, report rows, account menu, rails, drawer and messages (`axnames.log`) | various | Names as intended |
| G | Gallery cards (sign-in states, menus, notices) | galleries | RENDERED; interactions not exercised separately (same component code as the specimens, L8) |

## 4. Keyboard paths

- **Sign in:** Back to experiments → Sign in with your institution → E-mail → Password → Show password → Forgot your password? → Sign in → First time signing in? → Request institutional access. Enter submits from any field. After a refused or incomplete submit, focus goes to the message.
- **Workspace:** first Tab is *Skip to main content*. The account button opens on Enter, Space or ArrowDown; arrows, Home and End move; Escape and an outside click return focus to the button; Tab past the last item closes it.
- **Drawer (below 1024 px):** Menu → focus on Close; Tab stays inside; Escape or the scrim closes it and focus returns to Menu; choosing a destination focuses its H1.
- **Help:** every view change moves focus to the new H1 (or to *My reports* after Try again); every error summary takes focus and links to its field.
- **Every navigation:** focus lands on the destination's H1 (SW: 8 people × every rail destination).

## 5. Not tested · limits

| Not done | Why it matters · how to close it |
|---|---|
| Renders inside the claude.ai canvas itself | Local renders use the same files and runtime, so differences are unlikely. The owner's acceptance pass in the canvas (Play on Main) closes it. |
| Firefox, Safari / WebKit, real phones | Only Chromium was available; 375 is a viewport emulation. Integration should run its existing cross-browser suite on the bound components. |
| Screen readers (NVDA, JAWS, VoiceOver) | Names, roles and states were checked by axe and by reading Chromium's accessibility tree, not by listening. A short VoiceOver/NVDA pass on sign-in, the account menu and Help is the closing check. |
| Zoom to 200 % / 400 % | Reflow was checked down to 320 px wide, not with browser zoom. |
| Gallery card interactions | Same component code as the specimens (L8); not clicked separately. |
| Real sign-in, single sign-on, report delivery | Do not exist by design (T-10, T-11, ND-14, T-34). |

## 6. Findings fixed during the build

1. Slot tags lost spaces between interpolated words (inline-flex trims whitespace) → `inline-block`.
2. A bound SVG `d` attribute logged a parse error → icon sprite; a bound `<use href>` triggered a 404 fetch → fragment reference `#xsi-{icon}`.
3. Focus rings on headings stretched the full row → `xs-fit`.
4. The account menu stayed open when Tab left the document → closes on blur unless focus stays inside; the panel takes focus on click so clicks inside don't close it.
5. Some anchors navigated to their `#target` before the handler ran → every handler prevents the default jump.
6. Copy: inactive home notice retitled *Nothing can be opened right now*; banner and message links shortened to *Help*; gallery labels shortened.
7. Final cleanup: four unused rules removed from `xs-shared.css` (canvas Version 6). Harness corrections: three mis-sequenced keyboard specs (wrong step counts or labels), one no-op step, one locator that matched a sentence instead of the *Try again* button. None of these were product defects.

## 7. Unresolved findings

- **None blocking.**
- Foundation observation (not changed, base is locked): `.rb-logo` placeholder label and `.rb-count` badge are 13 px; the V3 seed's count markup gives the accessible name “Requests , 3 requests under review” (a space before the comma). Harmless for speech; for the central foundation owner.
- Open policies are listed in `HANDOFF.md` §4; they have safe treatments and do not block visual acceptance.
