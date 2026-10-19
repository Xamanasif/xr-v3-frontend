# START HERE · XR Learning Platform V3 · Entry & shared (XS)

| | |
|---|---|
| Workstream | XS · Entry & shared surfaces (owned once for every role) |
| Foundation | `XR-V3-RB-1.0` · Design V3 Refined Direction B |
| Owned designed IDs | **7 of 7 designed**: XS-01, XS-03, XS-04, XS-05, XS-06, XS-07, XS-08 |
| Excluded | XS-02 Choose workspace (designed:false, DEFER) · not designed, no switcher anywhere |
| Package date | 18 Oct 2026 (sample world dated Fri 23 Oct 2026) |
| Canvas | Claude Design artifact “XR Learning Platform — V3 · Entry & shared (XS) · Refined B” (new canvas; no older canvas edited) |

## Status

| Flag | State |
|---|---|
| DESIGN COMPLETE | **Yes** · all 7 owned IDs, with their populated, empty, error, busy, refusal and policy-open states |
| CONNECTED PREVIEW COMPLETE | **Yes** · `project/Main.dc.html` runs every ID in one role-preview state |
| ASSEMBLY PENDING | **Yes** · role packages place the shared components; Claude Code binds them to the app's existing session, Help and permission services |
| OWNER APPROVAL PENDING | **Yes** · visual acceptance not yet given |

## Coverage

| ID | Screen | Type | Where to see it | Disposition |
|---|---|---|---|---|
| XS-01 | Sign in | page | Main (starts here) · XS01 boards · `XsSignIn` | Designed, connected |
| XS-03 | Signed out / session expired | page | Main → Sign out · XS03 boards | Designed, connected |
| XS-04 | First-time activation · Forgot password | state (links only; flows open) | Sign-in card disclosures · sign-in states gallery | Designed as the documented contact route (T-11 open) |
| XS-05 | Account menu | menu | Top bar of every workspace in Main · XS05 boards · `XsAccountMenu` | Designed, connected in all 7 workspaces |
| XS-06 | Not your workspace | page | XS-03 session-ended board (sign in as Meera) · XS06 boards · `XsMessage` | Designed, connected |
| XS-07 | Help & support: report a problem + my reports | page | Rail foot and account menu in every workspace · XS07 boards · `XsHelp` | Designed, connected (send → list → detail, state kept) |
| XS-08 | Institution paused / account inactive notice | state | Main Tweaks `scenario = godavari-paused`, Sneha's sign-in · XS08 boards · `XsAccessNotice` | Designed, connected |

## Live role entry

Open the canvas, select the board **Live role preview** (`project/Main.dc.html`) and press Play. It starts at Sign in.

Sign in with any non-empty password:

| E-mail | Person · workspace |
|---|---|
| `rahul.verma@godavari.edu.in` | Rahul Verma · Student (VR device, so the menu shows My device) |
| `meera.iyer@godavari.edu.in` | Meera Iyer · Institute Admin (reopened, open and resolved reports) |
| `arjun.mehta@wilp.example` | Arjun Mehta · Super Admin (no reference numbers anywhere) |
| `anil.shetty@northline.example` | Anil Shetty · Vendor (empty My reports) |
| `a.menon@wilp.example` | Prof. A. Menon · Academic Reviewer |
| `kavya.nair@wilp.example` | Kavya Nair · Content Manager (reopened report) |
| `s.ranganathan@godavari.edu.in` | Dr S. Ranganathan · Faculty (resolved report) · e-mail illustrative |
| `sneha.reddy@godavari.edu.in` | Sneha Reddy · Student, account inactive · e-mail illustrative |

The first six come from the Phase-7 walkthrough. The last two e-mails were added for this design only (see `SCENARIOS.json`). None of this list appears in the product: there is no sample-user chooser.

## Five-minute review path

1. **Main → Play.** Press Sign in with nothing filled (summary + field errors), then type a wrong address (“The e-mail or password isn’t right”). Press *Sign in with your institution* (honest unavailable notice) and open *Forgot your password?* and *First time signing in?* (contact route only).
2. Sign in as **Rahul**. Account menu (top right) → Help & support → Report a problem → Send with nothing (error summary) → write something → Send → View my reports → open the new report. Go to Home and come back: it is still listed.
3. Account menu → **Sign out** → “You’re signed out”. Sign in as **Meera**: open the reopened and the resolved reports. Try every rail destination (labelled slots for the Institute Admin package) and the account menu keys (arrows, Escape).
4. Board **XS-03 · session ended**: sign in as Meera → *Not your workspace*; as Rahul → back to his experiment; as Sneha → inactive refusal.
5. Main's Tweaks: **scenario = godavari-paused**, sign in as Meera, Rahul or Dr S. Ranganathan → XS-08 banner and notices; sign out and in again — the notice stays.
6. Narrow the canvas below 1024 px (or open **Workspace drawer · 768**) → Menu → drawer; Escape closes it.

Every other board is evidence for one state or width; you don't need to open them all.

## What is in this package

| Path | What |
|---|---|
| `project/` | Every file the canvas lists: 36 `.dc.html` artboards (1 live root, 5 shared components, 3 galleries, 27 state/width wrappers), `canvas.json`, the three base stylesheets (byte-identical) and `xs-shared.css`. `support.js` is served by the design host and not included. |
| `SHARED-CONTRACT.json` | Component IDs, props, accessible names, keyboard, items by role, copy, nav targets, variant ownership (exported early for the role teams; still current). |
| `ROLE-STATUS.json` | Each owned ID: source, kind, route proposal, states, boards, evidence, status. |
| `FOUNDATION-LOCK.json` | Base version, original shared-file hashes, local additions with hashes. |
| `COMPONENT-EXTENSIONS.md` | What was reused unchanged, what `xs-shared.css` adds, proposed shell patches. |
| `LINK-MAP.json` | Every control: source, destination, classification, tested status. |
| `SCENARIOS.json` | Sample world, accounts, reports, return addresses, provenance and recorded conflicts. |
| `HANDOFF.md` | States, allowed actions, data and command needs, open policies, sources, changes from v46. |
| `CHECKS.md` | What was rendered, logic-tested, source-checked and not tested; widths; keyboard paths; findings. |
| `verification/` | The local harness, specs, fixtures and final logs used for `CHECKS.md` (no dependency folders, no fonts). |
| `SHA256SUMS.txt` | Hashes of every file in this package. |

Screenshots are in the separate optional archive `XR-V3-XS-Entry-Shared-Screenshots.zip`.

## Limits (read before integrating)

- Real authentication, institution single sign-on, password recovery and invitations are **not implemented**. The preview mirrors the prototype stand-in: a known sample e-mail plus any non-empty password. The sign-in page says so in one line.
- Pages owned by other workstreams appear as dashed, labelled slots so the shared shell, menu, Help and notices can be exercised around them. They are not product UI and not designs of those pages.
- Nothing is sent anywhere: no e-mail, notification or ticket leaves the preview. Reports live in the preview's memory for the session.
- Renders were checked by loading these exact files with the design host's runtime in local Chromium (Public Sans served locally because Google Fonts is blocked in that sandbox). They were not captured inside the claude.ai canvas itself, nor in Firefox or Safari, nor with a screen reader. See `CHECKS.md`.
- Route strings are v46 proposals used for identification; Claude Code keeps the application's routes.
