# COMPONENT EXTENSIONS · XS Entry & shared · XR-V3-RB-1.0

**Summary:** no token was added or changed, and no base class was restyled. `core.css`, `rb.css` and `rb-kit.css` are byte-identical to the foundation (hashes in `FOUNDATION-LOCK.json`). Everything new is in `xs-shared.css`, and every rule there selects an `xs-` class. Load order: `core.css` → `rb.css` → `rb-kit.css` → `xs-shared.css`.

## 1. Reused unchanged from the foundation

| Layer | Used as-is |
|---|---|
| `core.css` (`.xr`) | tokens (`--ink*`, `--navy*`, `--indigo`, `--gold*`, `--paper`, `--mist*`, `--rule*`, `--ok*`, `--err*`, `--info*`, `--focus`, `--sans`), `xr-avatar`, `xr-ico`, `xr-sr`, status pills `xr-st xr-st--info` (Open, Reopened) and `xr-st--ok` (Resolved) |
| `rb.css` (`.rb`) | rail `rb-rail`, `rb-brand`, `rb-logo`, `rb-product`, `rb-ws*`, `rb-nav`, `rb-count`, `rb-rail-foot`; top bar `rb-top`, `rb-menu`, `rb-top-date`, `rb-top-sep`, `rb-acct*`; page `rb-main`, `rb-page`, `rb-h1`, `rb-h2`, `rb-eyebrow-date`, `rb-note`, `rb-link`; buttons `rb-btn`, `--primary`, `--ghost`, `--lg`; drawer `rb-drawer`, `rb-drawer-head`, `rb-close`, `rb-scrim`; tokens `--rb-*` incl. `--rb-shadow` |
| `rb-kit.css` (`rk-`) | `rk-head*`, `rk-sub`, `rk-title`, `rk-eyebrow`, `rk-meta*`, `rk-crumbs`, `rk-surface`, `rk-sec*`, `rk-h3`, `rk-dl`, `rk-tl*` (history, newest first, `is-latest`), `rk-field`, `rk-label`, `rk-hint`, `rk-ferr`, `rk-input`, `rk-textarea`, `rk-errsum*`, `rk-notice` with `--info`, `--ok`, `--paused`, `--off`, `rk-notice-act`, `rk-banner` (paused banner, exactly as the IA-02 seed draws it), `rk-state*` incl. `rk-state-ico--err`, `rk-loading-msg`, `rk-skel*`, `rk-st-lg` |
| Helmet | Same Public Sans link and `body`/`a` rule as the V3 seeds |

The kit's `rk-dialog` is untouched and not used: XS has no confirmation dialog. The only modal surface is the V3 drawer (`role="dialog"`), used unchanged.

## 2. Added in `xs-shared.css` (and why the kit couldn't express it)

| Group | Classes | Why new |
|---|---|---|
| Composition | `xs-host` (display: contents for embedded components), `xs-span`, `xs-read` (920 px reading column), `xs-fit` (focus ring hugs a heading) | Lets one component file render both as its own artboard and inside a workspace |
| Skip link (shell patch XS-P1) | `xs-skip`, `xs-nofocus` | V3 seeds have no bypass link; `xs-nofocus` hides the ring on `<main tabindex=-1>` and the menu panel, which receive focus only programmatically |
| Sign in (XS-01/03/04) | `xs-entry*`, `xs-back`, `xs-card*`, `xs-logo-box`, `xs-or`, `xs-form`, `xs-block`, `xs-sso`, `xs-pw`, `xs-pw-toggle`, `xs-linkbtn`, `xs-disclose`, `xs-field-row`, `xs-trouble`, `xs-errsum-d`, `xs-busy`, `xs-spin`, `xs-proto` | No sign-in page exists in the V3 seeds. Uses `rk-field`/`rk-input`/`rk-errsum`/`rk-notice` inside a new card |
| Account menu (XS-05) | `xs-acct-slot`, `xs-acct`, `xs-menu*`, `xs-menu-item`, `xs-catch` | The V3 account button opens nothing; the kit has no popover |
| Message page (XS-06, XS-08 refusals, XS-07 sent) | `xs-msg`, `xs-msg-ico` (+ `--paused`, `--off`, `--ok`), `xs-msg-d`, `xs-msg-act` | One refusal/confirmation template |
| Inactive banner (XS-08) | `xs-banner--inactive` (added to `rk-banner`) | The kit's banner is the paused one; inactive needs a neutral variant |
| Help (XS-07) | `xs-sec-h`, `xs-reports` (container `xsrep`), `xs-report*`, `xs-form-surface`, `xs-field`, `xs-opt`, `xs-file` (+ `::file-selector-button`), `xs-form-act`, `xs-help-foot`, `xs-live` | Report rows (stack below 560 px), file input, polite live region |
| Preview only | `xs-slot*`, `xs-slotpage`, `xs-pub*` (public slot pages), `xs-spec`, `xs-kit*` (galleries) | Canvas scaffolding. **Never product UI** |

**Responsive:** under the `rb` container below 760 px the card, message and form paddings tighten and primary actions become full width (46 px). Report rows stack under their own container query. Rail-to-drawer switching is the V3 rule, unchanged.

**Motion:** `xs-pop` (menu, 140 ms) and `xs-spin` (busy); both off under `prefers-reduced-motion`, as is the disclosure chevron transition.

## 3. Literal values not found in the base files

Everything else uses tokens or literals the base already uses (e.g. `#F7F8FC`, `#F1F2FA`, `#CDD2EC`, `#F4F5F8`, `#C5CAD8`, `#F8F9FD`, `#C3C9E4`). Five literals are new to the kit; each reuses a base colour in the base's own `rgba` idiom or belongs to preview-only scaffolding:

| Where | Value | Basis |
|---|---|---|
| `xs-skip` shadow | `rgba(12,18,71,.45)` | `--navy-deep` (#0C1247) with alpha, as the base scrim and drawer shadows do |
| `xs-menu` shadow | `rgba(12,18,71,.34)`, `rgba(19,25,56,.06)` | `--navy-deep` and `--ink` with alpha, as `--rb-shadow` and the dialog shadow do |
| `xs-slot` border, background | `#9AA2C6`, `rgba(255,255,255,.55)` | Preview-only slot marker, never product UI |

## 4. Proposed shared shell patches (implemented in XS markup, not in base CSS)

`XS-P1` skip link · `XS-P2` focus the new page's H1 and close the drawer after a rail or drawer choice · `XS-P3` the account button opens `XsAccountMenu`. Details in `HANDOFF.md` §2 and `SHARED-CONTRACT.json`. A central foundation version update decides whether they enter the base.

## 5. Component files

| File | Owns | Notes |
|---|---|---|
| `XsSignIn.dc.html` | XS-01, XS-03, XS-04 | `mode`, `onSignIn(email) → boolean`, `onPublic(target)`; alone it knows no accounts (every attempt reads “isn’t right”, as in v46) |
| `XsAccountMenu.dc.html` | XS-05 | Disclosure pattern; specimen mode explains where an item leads instead of doing nothing |
| `XsHelp.dc.html` | XS-07 | Host owns the records (`reports`, `onSubmit`); `showRefs=false` is the Super Admin variant |
| `XsMessage.dc.html` | XS-06, XS-08 refusals | `kind = notallowed | paused | inactive` |
| `XsAccessNotice.dc.html` | XS-08 | `placement = banner | page`, `audience = student | faculty | ia` |
| `Main.dc.html` | live root | One state for the journey; props only choose a canvas start state |

`XsSignIn` also accepts `email` (initial value; galleries and future session services). It is not used by the live preview, which never pre-fills an e-mail (see `HANDOFF.md` §6).
