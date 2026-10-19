# HANDOFF · XS Entry & shared · V3 Refined B (XR-V3-RB-1.0)

For the integration owner (Claude Code) and the role design teams. Design props are not service DTOs: bind every component to the application's existing session, Help/support and permission services, keep the app's routes and its shared sample world, and keep the existing working Help, account and navigation available until these replace them.

Status: DESIGN COMPLETE (7/7) · CONNECTED PREVIEW COMPLETE · ASSEMBLY PENDING · OWNER APPROVAL PENDING.

---

## 1. Components

Five shared components, each a `.dc.html` in `project/`, plus the live root `Main.dc.html` that wires them into one role-preview state. Full props, accessible names and copy are in `SHARED-CONTRACT.json`.

### 1.1 `XsSignIn` · XS-01 Sign in · XS-03 Signed out / session ended · XS-04 Forgot password / first time

**States:** default · missing details (error summary + field errors) · wrong details (password cleared, e-mail kept) · signing in (busy, announced, cannot be sent twice) · institution sign-in unavailable · institution sign-in starting (inspection only; needs an identity provider) · Forgot your password? open · First time signing in? open · signed out · session ended with the return address shown.

**Allowed actions:** sign in with e-mail and password · press *Sign in with your institution* · open/close the two contact disclosures · Show/Hide password · *Back to experiments* (public catalogue, PU-04) · *Request institutional access* (PU-08).

**Never:** sign-up, sample-user chooser, role or workspace chooser (XS-02 excluded), “view as”, reset links or tokens, invitation e-mail, or a success message for an e-mail that was never sent.

**Focus:** H1 when arriving from a public page; the notice when signed out or session ended; the error summary after a missing-details submit (each link focuses its field); the wrong-details message after a refused sign-in; the unavailable notice after pressing institution sign-in; the destination's H1 after a successful sign-in.

**What the app must supply / do**

| Need | Kind | Notes |
|---|---|---|
| Sign in with e-mail + password | command | Outcome accepted → navigate; refused → the one generic “The e-mail or password isn’t right” (same words for an unknown e-mail and a wrong password, so accounts can't be discovered). Today's prototype stand-in accepts a known sample e-mail with any non-empty password (Phase-7); the service name isn't in this pack. |
| Institution sign-in availability | read / policy | T-10 open. Until an identity provider exists, pressing the button shows the unavailable notice and offers e-mail sign-in. The *starting* state is drawn for when a provider exists; it must not appear before then. |
| Return address on session end | route | The page that was open (label only, e.g. “My courses › Shell-and-Tube Heat Exchanger”). No identity or credential is kept to provide it. |
| Destination after sign-in | routing rule (design proposal) | No return address → the person's role home. Return address in their own workspace → that page. Return address in another workspace → XS-06 inside their own shell (never the protected page). Inactive account → XS-08 inactive refusal. Paused institution and an experiment address → XS-08 paused refusal. Confirm against the app's existing redirect before binding. |
| Account inactive / institution paused | read (after sign-in only) | The person signs in and lands on their home with the XS-08 banner, as v46 B1-09 shows. The sign-in page itself never reveals account status. |

**Prototype line:** “Prototype sign-in. Real accounts, password checks and institution single sign-on aren’t connected in this build. Sample accounts open with any password.” It sits below the card, lists no accounts and is switched off with `prototypeNote = false` when real sign-in exists.

### 1.2 `XsAccountMenu` · XS-05

**States:** closed · open for: Student with a device · Student without one (and inactive) · Faculty, Institute Admin (institution line) · Vendor (vendor organisation line) · Academic Reviewer, Content Manager, Super Admin (no organisation line).

**Items:** My device (only a Student with AR, VR or MR access) → ST-18 · Help & support → XS-07 · Sign out → XS-03. Nothing else: no settings, profile, switcher or “view as”.

**Pattern:** disclosure (button + list), not an ARIA menu. Enter/Space/click or ArrowDown opens and focuses the first item; ArrowUp/Down/Home/End move; Escape and an outside click close and return focus to the button; Tab past the last item closes; choosing an item closes it and the destination focuses its H1.

| Need | Kind | Notes |
|---|---|---|
| Name, initials, role label | read | From the signed-in session. |
| Organisation line | read | Institution for Student, Faculty, Institute Admin; the vendor organisation for Vendor; none for platform roles (open, see §4). |
| Device eligibility | read | True only for a Student with AR/VR/MR access (the prototype's pre-authorised device for Rahul). It shows a link; it never authorises anything. |
| Sign out | command | Ends this tab's sign-in. Nothing is stored. |

### 1.3 `XsHelp` · XS-07 Help & support

**Views and states:** My reports (populated · empty with the primary action inside the empty state · loading · failed with *Try again*, which reloads and keeps nothing changed) · Report a problem (missing details · sending) · Report sent (with reference; without it for Super Admin) · report detail (open · resolved with the resolution note · reopened).

**Allowed actions:** send a report · open one of *my* reports · return to the list · go back to the role home. Reporters cannot resolve, reopen or reply; resolving and reopening stay Super Admin actions (SA-20, SA-21).

| Need | Kind | Notes |
|---|---|---|
| My reports for the signed-in person | read | Only the person's own reports, newest first. Fields used: reference, title, status (Open · Reopened · Resolved), sent date, reopened/resolved date, resolution note, what happened, where, screenshot name, history events. The app already has support reports (Phase 6: SA-20 resolve with a note the reporter reads, SA-21 reopen). Bind to those reads; their names aren't in this pack. |
| Send a report | command | Input: what happened (required), where (pre-filled from the page the person came from, editable), screenshot (optional image). Output: the stored record (reference, status Open, sent date). The busy state blocks a second send; keep the service's own repeated-command protection. |
| Title of a report | rule | Prototype rule: the first sentence of *What happened* (≤ 72 characters). Keep the app's existing rule if it differs. |
| Screenshot | data | The preview keeps the file name only; nothing is uploaded. Follow the existing service for storage. |
| References for Super Admin | rule | Super Admin sees no SUP numbers anywhere, including accessible names (`showRefs = false`). Other roles keep their references. |

**Copy rules:** no response times, service levels or named responders (ND-14). Nothing is e-mailed; status is read here (T-34).

### 1.4 `XsMessage` · XS-06 Not your workspace · XS-08 refusal pages

One template inside the person's own shell: icon, the page's only H1 (focused on arrival), one sentence, one primary action named by its destination (*Back to Home* / *Back to Overview*) and *Help*. No rail item is current.

| Kind | Title | Sentence |
|---|---|---|
| notallowed | This page isn’t part of your workspace | You’re signed in to the {workspace} workspace. This address belongs to a different workspace. |
| paused | Your institution’s access is paused | Your work is kept. |
| inactive | Your account is inactive | Nothing can be opened while the account is inactive. Contact your institution administrator. |

**Needs:** the signed-in person's workspace label and home, and the refusal kind from the app's existing authorization outcome. **Never** the protected page's title, records, route, role code or error code.

### 1.5 `XsAccessNotice` · XS-08

| Placement | Who | Copy |
|---|---|---|
| Banner, every page | Institute Admin, Faculty, Students of a paused institution | Your institution’s access is paused — your work is kept. · Help |
| Banner, every page | Students and Faculty whose account is inactive | Your account is inactive. Contact your institution administrator. · Help |
| Home page notice | Student, paused | You can’t open experiments right now / Your institution’s access is paused. Your work is kept, and you can continue when it’s lifted. |
| Home page notice | Institute Admin, paused | BITS has paused your institution’s access / Students can’t open experiments. Pages are read-only until BITS lifts the pause. |
| Home page notice | Faculty, paused | none: banner only (OD-B7-07) |
| Home page notice | Account inactive | Nothing can be opened right now / Your account is inactive. Contact your institution administrator. |

**Display only.** It never grants, hides or restores access; role pages decide which of their own actions are read-only. Signing out and in again does not remove it. **Needs:** the institution's access state and the person's account status from the existing services.

---

## 2. Shell patches proposed (central integration, not applied to base CSS)

| ID | Change | Why |
|---|---|---|
| XS-P1 | *Skip to main content* link as the first focusable element of the workspace shell; focuses `<main tabindex="-1">`. Hidden until focused. | WCAG 2.4.1: up to eight rail links precede the content. The v46 shell (board 05) had this link; the V3 seeds dropped it. |
| XS-P2 | After a rail or drawer choice, close the drawer and move focus to the new page's H1. | The V3 seeds leave focus on the old link or the Menu button. |
| XS-P3 | The top-bar account button opens `XsAccountMenu`. | In the V3 seeds it is labelled *Account menu* but opens nothing. |

The drawer itself is the V3 pattern unchanged (focus to Close, Tab kept inside, Escape or scrim closes, focus back to Menu).

## 3. Preview-only constructs (never ship)

- Dashed **slots** standing in for pages of other workstreams (role homes and destinations, ST-05 experiment, ST-18 My device, PU-04, PU-08).
- **Specimen notes** in the standalone component artboards (“Help & support opens XS-07 …”): they explain where a control leads when there is no host.
- **Tweaks** on Main (start, person, page, scenario, presets): canvas start states only, not product controls.
- **Galleries** and kit frames (`xs-kit-*`, `xs-spec`).
- The **prototype line** under the sign-in card belongs to local prototype builds only.

## 4. Open policies (not decided here; the designed safe treatment is in place)

| Decision | Safe treatment in this design |
|---|---|
| T-10 Identity provider / single sign-on / password policy | Institution sign-in button with an honest unavailable notice; e-mail sign-in works. |
| T-11 / R02 Invitations, first activation, password recovery | *Forgot your password?* and *First time signing in?* show “Contact your institution administrator …” only. Nothing is sent. |
| Contact route for people with no institution administrator (Vendor, BITS staff) under T-11 | Same contact sentence for everyone, because the sign-in page doesn't know who is signing in. |
| Organisation line for platform roles (v46 board 06 note, board 13) | None for Academic Reviewer, Content Manager and Super Admin; the vendor organisation for Vendor. |
| Pause reason shown to institution people (v46 board 08: open) | Not shown. The refusal template has room for one line if decided. |
| ND-14 Support model | No response times, service levels or named responders in Help. |
| T-34 Notifications | Status read in Help only; nothing is e-mailed. |
| OD-B7-07 Faculty view while paused | Banner only, no page notice. |
| SUP-04 (listed among the owner's items in the Phase-6 report) | Its content isn't in this pack. Check it before binding Help. |

Integration confirmations (not policy): the after-sign-in routing rule in §1.1; whether the app shows *Your session ended* with the return address after a refresh (today a refresh signs the tab out by design; the address can come from the URL, never from stored identity); the report title rule; screenshot storage.

## 5. Sample data

`SCENARIOS.json` lists both scenarios (`xs-world-2026-10-23`, `xs-godavari-paused-2026-10-23`), every account and report with provenance, the illustrative additions and three recorded conflicts (SUP-0198 owner, duplicate SUP-0213, IA-01 date). The React app keeps its own world: reproduce the layouts, never these facts.

## 6. Changes from the v46 visual treatment

- **Whole family:** v46 Batch-0 styling replaced by Refined B: navy rail, Public Sans, gold primary buttons, `rk-` notices, error summaries, status pills and timelines, 44 px targets. Copy and behaviour follow v46 unless listed here.
- **Sign in (B1-09):** a 520 px card with a navy head band holding the WILP logo slot and product name; institution sign-in as the first full-width button above “or sign in with e-mail”; Show/Hide inside the password field; *First time signing in?* added beside *Forgot your password?* so XS-04 covers both of its named states with the same contact route. The session-ended state does not pre-fill the e-mail (v46 did): the prototype stores no session or credential, and a refresh signs the tab out, so keeping it would need stored identity. Pass `email` if a real session service keeps it later. v46 said “no DEMO strips” here; the current brief requires honesty about the stand-in, so it is one quiet line, not a strip.
- **Account menu (05, 06):** the V3 top-bar button now opens a panel: avatar, name, role, organisation line, then items, with Sign out in its own footer.
- **Help & support (07):** rows with status pills and a history timeline, newest first; Super Admin variant without reference numbers (owner decision); explicit loading and failed states for My reports.
- **System messages (08) and pause effects (B7-04):** one message card with an icon disc; the paused banner reuses the V3 `rk-banner` exactly as the IA-02 seed draws it; a neutral grey variant for the inactive banner.

## 7. Sources

- v46: `B1-09-Sign-In`, `05-Workspace-Shell`, `06-Sidebar-Variants`, `07-Help-Support`, `08-System-Messages`, `B7-04-Pause-Effects`, `handoff/open-decisions.json`, `B8-08-Open-Decisions-and-Limitations`.
- V3 (immutable): `core.css`, `rb.css`, `rb-kit.css`, `SA01`, `SA02`, `IA01`, `IA02`, `HANDOFF-original.md`.
- Implementation reports: Phase-6 (support reports, SA-20/21), Phase-7 (sample sign-ins, stand-ins, no stored session).
- Owner brief and `common/01–05`.
