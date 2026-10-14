/**
 * The link-target ledger (ADR-0005 §8; Appendix F §3.3 "Unbuilt destinations", WP-0.13 acceptance
 * 9; register P0-35): every action drawn on the built screens (Phase 0, then Phase-1 Package 1A:
 * XS-01, SA-02, SA-03; Package 1B: the public shell and PU-01 … PU-06 with PU-14), where it goes,
 * and what that address shows. Its tests prove that every link reaches a built page — the one
 * Phase-0 dead link (PU-15 → PU-04) is gone since Package 1B — and that no primary action resolves
 * to the page it is on; the browser
 * suite follows each link for real and checks that no document load (which would rebuild the
 * sample world, ADR-0004) happens on the way.
 *
 * Targets are written per workspace: `<base>` is the workspace the page is in (for XS-06, the
 * person's OWN base — the address on show belongs to another workspace), `{id}` a report's
 * reference.
 */

/** The screen (or shell part) an action is drawn on. */
export type LedgerScreen =
  | 'Shell'
  | 'Public shell'
  | 'XS-01'
  | 'XS-05'
  | 'XS-06'
  | 'XS-07'
  | 'XS-08'
  | 'PU-01'
  | 'PU-02'
  | 'PU-03'
  | 'PU-04'
  | 'PU-05'
  | 'PU-06'
  | 'PU-15'
  | 'SA-02'
  | 'SA-03';

export type ActionRole =
  /** The page's one primary action (board 08 "One primary action"; `xr-btn--primary`). */
  | 'primary'
  /** Any other drawn link or button. */
  | 'secondary';

export type LedgerOutcome =
  /** Goes to a built page. */
  | 'built'
  /** Goes to `/<base>`, the interim landing, which replaces itself with `/<base>/help` (ADR-0005 §8). */
  | 'interim-landing'
  /** Stays on the page: a command, an in-page jump or the skip link. */
  | 'in-page'
  /** Goes to an address that is not built in Phase 0 — documented, never hidden. */
  | 'dead-link'
  /**
   * Drawn, but not rendered until the page it opens is built (P0-35 built-screen navigation,
   * extended to Phase 1 by the owner): `target` names that unbuilt destination.
   */
  | 'not-rendered'
  /** Leaves the product in a new tab, announced (board 02 "External links say so"). */
  | 'external';

export interface LedgerEntry {
  readonly screen: LedgerScreen;
  /** Where on the screen: the drawn state or part. */
  readonly where: string;
  /** The action's drawn words. */
  readonly action: string;
  readonly role: ActionRole;
  /** The page it is on (pattern), for the "no primary action to its own page" rule. */
  readonly on: string;
  /** Where it goes (pattern); `null` for a command. */
  readonly target: string | null;
  readonly outcome: LedgerOutcome;
  /** The board and frame that draw it. */
  readonly board: string;
  /** For a dead link or an interim: why, and until when. */
  readonly note?: string;
}

const ANY_PAGE = '<base>/*';
/** Every public page, and the public PU-15 (Package 1B). */
const PUBLIC_PAGE = '<public>/*';

export const LINK_TARGET_LEDGER: readonly LedgerEntry[] = [
  // ---- The workspace shell, on every page (boards 05, 06, 12) --------------------------------
  {
    screen: 'Shell',
    where: 'Skip link (first Tab stop)',
    action: 'Skip to main content',
    role: 'secondary',
    on: ANY_PAGE,
    target: '#main',
    outcome: 'in-page',
    board: '05 · GL-01 Workspace Shell; 12 "Shell tab order"',
  },
  {
    screen: 'Shell',
    where: 'Sidebar foot (all seven workspaces; the only built destination in Phase 0)',
    action: 'Help',
    role: 'secondary',
    on: ANY_PAGE,
    target: '<base>/help',
    outcome: 'built',
    board: '06 · Sidebar Variants (Help last); 12 "Consistent help · 3.2.6"',
  },
  {
    screen: 'Shell',
    where: 'Sidebar destinations (Home, My courses … Operations)',
    action: '(none rendered: their screens are not built)',
    role: 'secondary',
    on: ANY_PAGE,
    target: null,
    outcome: 'in-page',
    board: '06 "Navigation rules"; navigation.json "No link to removed or deferred destinations"',
    note: 'The built-screen manifest renders only built destinations (XS-07, and the Super Admin’s Requests); the rest appear with their phase.',
  },
  {
    screen: 'Shell',
    where: 'Sidebar destination (Super Admin only)',
    action: 'Requests',
    role: 'secondary',
    on: '/admin/*',
    target: '/admin/requests',
    outcome: 'built',
    board: '06 (Super Admin raw[]); B1-10 f0 (`aria-current="page"`, “3 requests under review”)',
    note: 'Its count is the requests under review, read through AccessRequestService.listRequests (B1-10 caption “Nav count 3 = requests under review”).',
  },
  // ---- XS-05 Account menu (boards 05, 06) ------------------------------------------------------
  {
    screen: 'XS-05',
    where: 'Account menu',
    action: 'Help',
    role: 'secondary',
    on: ANY_PAGE,
    target: '<base>/help',
    outcome: 'built',
    board: '06 "Account menu · same pattern in every workspace"',
  },
  {
    screen: 'XS-05',
    where: 'Account menu',
    action: 'Sign out',
    role: 'secondary',
    on: ANY_PAGE,
    target: '/sign-in?reason=signed-out',
    outcome: 'built',
    board: '06 "Account menu"; B1-09 f10 "Signed out" (XS-03)',
    note: 'A SessionService.signOut command; the session gate then replaces the address with the sign-in card’s “You’re signed out” notice (XS-03, built in Package 1A). A client-side move: the tab’s sample world is kept (ADR-0004).',
  },
  {
    screen: 'XS-05',
    where: 'Account menu (Students holding AR, VR or MR)',
    action: 'My device',
    role: 'secondary',
    on: ANY_PAGE,
    target: null,
    outcome: 'in-page',
    board: '06 "Account menu" (My device*); B3-07 frame 2',
    note: 'Not offered: ST-18 is not built (Phase 3) — no entry, no disabled item.',
  },
  // ---- XS-08 Paused / inactive banners (boards 05, 08) ----------------------------------------
  {
    screen: 'XS-08',
    where: 'Paused and inactive banners',
    action: 'Help',
    role: 'secondary',
    on: ANY_PAGE,
    target: '<base>/help',
    outcome: 'built',
    board: '05 (banner states); 04 "Paused · shell banner" / "Inactive"',
  },
  // ---- XS-06 Not your workspace (board 08) -----------------------------------------------------
  {
    screen: 'XS-06',
    where: 'Message page, in the person’s own shell',
    action: 'Back to Home',
    role: 'primary',
    on: '<other-base>/*',
    target: '<base>',
    outcome: 'interim-landing',
    board: '08 "This page isn’t part of your workspace"; "At 375 px"',
    note: 'The person’s own base; until their home is built it lands on their Help (ADR-0005 §8).',
  },
  {
    screen: 'XS-06',
    where: 'Message page, in the person’s own shell',
    action: 'Help',
    role: 'secondary',
    on: '<other-base>/*',
    target: '<base>/help',
    outcome: 'built',
    board: '08 "This page isn’t part of your workspace"',
  },
  // ---- PU-15 Not found (board 08) ----------------------------------------------------------------
  {
    screen: 'PU-15',
    where: 'Workspace variant, in the shell',
    action: 'Back to Home',
    role: 'primary',
    on: '<base>/[...unmatched]',
    target: '<base>',
    outcome: 'interim-landing',
    board: '08 "Page not found · workspace"',
    note: 'Lands on the workspace’s Help until its home is built (ADR-0005 §8).',
  },
  {
    screen: 'PU-15',
    where: 'Workspace variant, in the shell',
    action: 'Help',
    role: 'secondary',
    on: '<base>/[...unmatched]',
    target: '<base>/help',
    outcome: 'built',
    board: '08 "Page not found · workspace"',
  },
  {
    screen: 'PU-15',
    where: 'Public variant',
    action: 'Browse experiments',
    role: 'primary',
    on: '/*',
    target: '/experiments',
    outcome: 'built',
    board: '08 "Page not found · public"',
    note: 'The Phase-0 dead link (P0-35) is gone: /experiments is PU-04, built in Phase-1 Package 1B; the page now sits in the public header and footer.',
  },
  // ---- XS-07 Help & support (board 07) -----------------------------------------------------------
  {
    screen: 'XS-07',
    where: 'My reports — page header (with reports) or empty state (none)',
    action: 'Report a problem',
    role: 'primary',
    on: '<base>/help',
    target: '<base>/help/report',
    outcome: 'built',
    board: '07 "State 2 · My reports"; "State 2a · empty" (the action moves into the empty state)',
  },
  {
    screen: 'XS-07',
    where: 'My reports — each row',
    action: '(the report’s title)',
    role: 'secondary',
    on: '<base>/help',
    target: '<base>/help/reports/{id}',
    outcome: 'built',
    board: '07 "State 2": "Rows open the report"',
  },
  {
    screen: 'XS-07',
    where: 'Report a problem — back link',
    action: 'Help & support',
    role: 'secondary',
    on: '<base>/help/report',
    target: '<base>/help',
    outcome: 'built',
    board: '07 "State 1 · Report a problem"',
  },
  {
    screen: 'XS-07',
    where: 'Report a problem — top-bar crumb (from 1024 px)',
    action: 'Help & support',
    role: 'secondary',
    on: '<base>/help/report',
    target: '<base>/help',
    outcome: 'built',
    board: '07 "State 1" (`ol.xr-crumbs`)',
  },
  {
    screen: 'XS-07',
    where: 'Report a problem — error summary (after an empty Send)',
    action: 'Say what happened',
    role: 'secondary',
    on: '<base>/help/report',
    target: '#<field>',
    outcome: 'in-page',
    board: '07 "State 1a · Validation"',
  },
  {
    screen: 'XS-07',
    where: 'Report a problem — actions',
    action: 'Cancel',
    role: 'secondary',
    on: '<base>/help/report',
    target: '<base>/help',
    outcome: 'built',
    board: '07 "State 1"; 11 "375 · AR-8 form"',
  },
  {
    screen: 'XS-07',
    where: 'Report a problem — actions',
    action: 'Send report',
    role: 'primary',
    on: '<base>/help/report',
    target: null,
    outcome: 'in-page',
    board: '07 "State 1b · Sending", "State 1c · Sent · reference"',
    note: 'An OperationsService.reportProblem command; "Report sent" replaces the form in place.',
  },
  {
    screen: 'XS-07',
    where: 'Report sent (in place of the form)',
    action: 'View my reports',
    role: 'primary',
    on: '<base>/help/report',
    target: '<base>/help',
    outcome: 'built',
    board: '07 "State 1c · Sent · reference"',
  },
  {
    screen: 'XS-07',
    where: 'Report sent (in place of the form)',
    action: 'Back to Home',
    role: 'secondary',
    on: '<base>/help/report',
    target: '<base>',
    outcome: 'interim-landing',
    board: '07 "State 1c · Sent · reference"',
    note: 'Lands on My reports until the workspace home is built (ADR-0005 §8).',
  },
  {
    screen: 'XS-07',
    where: 'Report detail — back link',
    action: 'Help & support',
    role: 'secondary',
    on: '<base>/help/reports/{id}',
    target: '<base>/help',
    outcome: 'built',
    board: '07 "State 3 · Report detail"; "State 3a"',
  },
  {
    screen: 'XS-07',
    where: 'Report detail — top-bar crumb (from 1024 px)',
    action: 'Help & support',
    role: 'secondary',
    on: '<base>/help/reports/{id}',
    target: '<base>/help',
    outcome: 'built',
    board: '07 "State 3" (`ol.xr-crumbs`)',
  },
  {
    screen: 'XS-07',
    where: 'Report detail — closing line',
    action: 'Report a problem',
    role: 'secondary',
    on: '<base>/help/reports/{id}',
    target: '<base>/help/report',
    outcome: 'built',
    board: '07 "State 3": "Something else isn’t working? Report a problem"',
  },
  // ---- XS-01 Sign in, XS-03 notices, XS-04 disclosure (B1-09) — Package 1A ----------------------
  {
    screen: 'XS-01',
    where: 'Sign in with e-mail (the card’s form)',
    action: 'Sign in',
    role: 'primary',
    on: '/sign-in',
    target: null,
    outcome: 'in-page',
    board: 'B1-09 f0 … f4, f11, f12',
    note: 'A SessionService.signIn command. Accepted, the person goes to the validated return address in their own workspace, else their role’s base (the interim landing: their Help until the home is built, P0-35).',
  },
  {
    screen: 'XS-01',
    where: 'Single sign-on (above the form)',
    action: 'Sign in with your institution',
    role: 'secondary',
    on: '/sign-in',
    target: null,
    outcome: 'in-page',
    board: 'B1-09 f0, f5 “Institution sign-in starting”, f6 “Institution sign-in unavailable”',
    note: 'A SessionService.signIn command (method sso): policy-open T-10, so the card shows f6 in place of the button.',
  },
  {
    screen: 'XS-01',
    where: 'Password field',
    action: 'Show password',
    role: 'secondary',
    on: '/sign-in',
    target: null,
    outcome: 'in-page',
    board: 'B1-09 f0 (`div.xp-pw` button “Show” / “Hide” + “password”)',
  },
  {
    screen: 'XS-01',
    where: 'Password field (XS-04)',
    action: 'Forgot your password?',
    role: 'secondary',
    on: '/sign-in',
    target: null,
    outcome: 'in-page',
    board:
      'B1-09 f0 (disclosure, `aria-expanded`; “Contact your institution administrator to reset it.”)',
    note: 'A disclosure only: activation and recovery are OPEN (T-11 / R02), so it links nowhere.',
  },
  {
    screen: 'XS-01',
    where: 'Top row of the focused frame',
    action: 'Back to experiments',
    role: 'secondary',
    on: '/sign-in',
    target: '/',
    outcome: 'built',
    board: 'B1-09 f0 (`a.xr-back` → B1-01 Landing; P1-17 follows the href)',
    note: 'Rendered since Package 1B built the Landing (PU-01).',
  },
  {
    screen: 'XS-01',
    where: 'Under the card',
    action: 'Request institutional access',
    role: 'secondary',
    on: '/sign-in',
    target: '/selection',
    outcome: 'not-rendered',
    board: 'B1-09 f0 (`div.xp-auth-links` → B1-06 Selection)',
    note: 'The Selection (PU-07) is not built: the line appears with it.',
  },
  // ---- SA-02 Requests (B1-10) — Package 1A ------------------------------------------------------------
  {
    screen: 'SA-02',
    where: 'Each row — the reference',
    action: '(the request’s reference)',
    role: 'secondary',
    on: '/admin/requests',
    target: '/admin/requests/{requestId}',
    outcome: 'built',
    board: 'B1-10 f0 (“REQ-0042 opens the decision (board B1-11)”), f2',
  },
  {
    screen: 'SA-02',
    where: 'Toolbar',
    action: 'More filters',
    role: 'secondary',
    on: '/admin/requests',
    target: null,
    outcome: 'in-page',
    board: 'B1-10 f0, f1 (“More filters (1)”), f9',
  },
  {
    screen: 'SA-02',
    where: 'Toolbar status row (and the no-match state)',
    action: 'Clear filters',
    role: 'secondary',
    on: '/admin/requests',
    target: null,
    outcome: 'in-page',
    board: 'B1-10 f1, f3, f4 (“One way back: Clear filters”)',
  },
  {
    screen: 'SA-02',
    where: 'Toolbar status row — each applied filter',
    action: 'Remove <filter>',
    role: 'secondary',
    on: '/admin/requests',
    target: null,
    outcome: 'in-page',
    board: 'B1-10 f1, f3, f4, f9 (chips)',
  },
  {
    screen: 'SA-02',
    where: 'Received (header button; the sort bar below 760 px of content)',
    action: 'Received, newest first. Change order',
    role: 'secondary',
    on: '/admin/requests',
    target: null,
    outcome: 'in-page',
    board: 'B1-10 f0; START-HERE Known exception 1 (PF-01, WP-0.7)',
  },
  {
    screen: 'SA-02',
    where: 'Failed state',
    action: 'Try again',
    role: 'secondary',
    on: '/admin/requests',
    target: null,
    outcome: 'in-page',
    board: 'B1-10 f6 “Failed + retry”',
  },
  // ---- SA-03 Request decision (B1-11) — Package 1A ----------------------------------------------------
  {
    screen: 'SA-03',
    where: 'Back link',
    action: 'Requests',
    role: 'secondary',
    on: '/admin/requests/{requestId}',
    target: '/admin/requests',
    outcome: 'built',
    board: 'B1-11 f0 (`a.xr-back`)',
  },
  {
    screen: 'SA-03',
    where: 'Top-bar crumb (from 1024 px)',
    action: 'Requests',
    role: 'secondary',
    on: '/admin/requests/{requestId}',
    target: '/admin/requests',
    outcome: 'built',
    board: 'B1-11 f0 (`ol.xr-crumbs`)',
  },
  {
    screen: 'SA-03',
    where: 'Below 860 px of content, above the details',
    action: 'Go to decision',
    role: 'secondary',
    on: '/admin/requests/{requestId}',
    target: '#decision',
    outcome: 'in-page',
    board: 'B1-11 f15 “Mobile 375 · full page”',
  },
  {
    screen: 'SA-03',
    where: 'Decision panel (open)',
    action:
      '(the panel’s button: Approve request · Approve smaller scope · Send request for information)',
    role: 'primary',
    on: '/admin/requests/{requestId}',
    target: null,
    outcome: 'in-page',
    board: 'B1-11 f0 … f8, f13',
    note: 'Approvals open the confirmation (DL-1); a request for information is the requestMoreInformation command itself.',
  },
  {
    screen: 'SA-03',
    where: 'Confirmation (DL-1)',
    action: 'Approve request · Approve smaller scope',
    role: 'secondary',
    on: '/admin/requests/{requestId}',
    target: null,
    outcome: 'in-page',
    board: 'B1-11 f2 “Confirm · external”, f3 “Confirm · internal”',
    note: 'The approveRequest or approveSmallerScope command, with the request’s revision.',
  },
  {
    screen: 'SA-03',
    where: 'Confirmation (DL-1)',
    action: 'Cancel',
    role: 'secondary',
    on: '/admin/requests/{requestId}',
    target: null,
    outcome: 'in-page',
    board: 'B1-11 f2, f3 (Cancel, Close)',
  },
  {
    screen: 'SA-03',
    where: 'Decision panel (decided)',
    action: 'Back to requests',
    role: 'secondary',
    on: '/admin/requests/{requestId}',
    target: '/admin/requests',
    outcome: 'built',
    board: 'B1-11 f9 … f12',
  },
  {
    screen: 'SA-03',
    where: 'Decision panel (institution paused)',
    action: 'View institution',
    role: 'secondary',
    on: '/admin/requests/{requestId}',
    target: '/admin/institutions/{institutionId}',
    outcome: 'not-rendered',
    board: 'B1-11 f14 (`xr-notice-actions` → B7-03 Institution detail)',
    note: 'Institution detail (SA-07) is not built: the link appears with it.',
  },
  // ---- The public surface (Phase-1 Package 1B: B1-01 … B1-05) --------------------------------
  ...publicShell(),
  ...publicPage('PU-01', '/', [
    [
      'Hero',
      'Browse experiments',
      'primary',
      '/experiments',
      'built',
      'B1-01 hero `a.xr-btn--primary.xp-cta` ("one gold button in the hero")',
    ],
    [
      'Hero · Students and faculty',
      'Already have access? Sign in',
      'secondary',
      '/sign-in',
      'built',
      'B1-01 `li.xp-path`',
    ],
    [
      'Hero · Institutions',
      'Request institutional access',
      'secondary',
      '/selection',
      'not-rendered',
      'B1-01 `li.xp-path` → B1-06',
    ],
    [
      'Hero caption',
      '(the depicted experiment: “ME ZG523 · Shell-and-Tube Heat Exchanger”)',
      'secondary',
      '/experiments/{experimentId}',
      'built',
      'B1-01 `a.xp-hero-course`',
    ],
    [
      'Explorer · selected card',
      'Browse N experiments',
      'secondary',
      '/experiments?area={areaId}',
      'built',
      'B1-02 `a.xr-btn--primary` in `.xp-ex-full` (the card’s, not the page’s, primary)',
    ],
    [
      'Explorer · selected card',
      'View area',
      'secondary',
      '/areas/{areaId}',
      'built',
      'B1-02 `.xp-ex-actions`',
    ],
    [
      'Explorer · neighbouring card',
      'Show <area>',
      'secondary',
      null,
      'in-page',
      'B1-02 `button.xp-ex-mini` (not a tab stop)',
    ],
    ['Explorer controls', 'Previous area', 'secondary', null, 'in-page', 'B1-02 `button.xp-round`'],
    ['Explorer controls', 'Next area', 'secondary', null, 'in-page', 'B1-02 `button.xp-round`'],
    [
      'Explorer controls',
      'View all areas',
      'secondary',
      '/areas',
      'built',
      'B1-02 `a.xp-more` (→ PU-02)',
    ],
    [
      'Explorer · areas loading (plain list)',
      '(an area’s name)',
      'secondary',
      '/areas/{areaId}',
      'built',
      'B1-01 "Areas loading (or art failed) → plain list"',
    ],
    [
      'Explorer · areas loading (plain list)',
      'View all areas',
      'secondary',
      '/areas',
      'built',
      'B1-01 plain list `a.xp-more`',
    ],
    [
      'Explorer · failed',
      'Try again',
      'secondary',
      null,
      'in-page',
      'B1-03 "All areas · failed + retry" (state-copy `PU-01.sections-failed`)',
    ],
    [
      'Explorer · failed',
      'Browse experiments',
      'secondary',
      '/experiments',
      'built',
      'B1-03 "A way forward even when this list fails"',
    ],
    [
      'Featured',
      'Browse all N experiments',
      'secondary',
      '/experiments',
      'built',
      'B1-01 featured head `a.xp-more`',
    ],
    [
      'Featured card',
      '(the experiment’s title)',
      'secondary',
      '/experiments/{experimentId}',
      'built',
      'B1-01 `h3.xp-card-title a`',
    ],
    [
      'Featured · failed',
      'Try again',
      'secondary',
      null,
      'in-page',
      'B1-04 "Failed + retry" (state-copy `PU-01.sections-failed`)',
    ],
    [
      'Formats card',
      'Browse <format> experiments',
      'secondary',
      '/experiments?format=vr',
      'built',
      'B1-01 `a.xp-fcard-link` ("each card filters the catalogue by format")',
    ],
    [
      'For institutions (PU-14)',
      'Request institutional access',
      'secondary',
      '/selection',
      'not-rendered',
      'B1-01 `.xp-inst-foot a.xr-btn--primary` → B1-06',
    ],
    [
      'Closing band',
      'Browse experiments',
      'secondary',
      '/experiments',
      'built',
      'B1-01 `section.xp-band a.xp-btn-navy`',
    ],
  ]),
  ...publicPage('PU-02', '/areas', [
    ['Breadcrumb', 'Home', 'secondary', '/', 'built', 'B1-03 PU-02 `ol.xp-crumbs`'],
    [
      'Facts',
      'Experiments (the count)',
      'secondary',
      '/experiments',
      'built',
      'B1-03 PU-02 "Counts link to the catalogue"',
    ],
    [
      'Area card',
      '(the area’s name)',
      'secondary',
      '/areas/{areaId}',
      'built',
      'B1-03 PU-02 `h2.xp-card-title a`',
    ],
    [
      'Area card',
      'N experiments',
      'secondary',
      '/experiments?area={areaId}',
      'built',
      'B1-03 PU-02 `.xp-acard-counts a`',
    ],
    ['Failed', 'Try again', 'secondary', null, 'in-page', 'B1-03 "All areas · failed + retry"'],
    [
      'Failed',
      'Browse experiments',
      'secondary',
      '/experiments',
      'built',
      'B1-03 "A way forward even when this list fails"',
    ],
  ]),
  ...publicPage('PU-03', '/areas/{areaId}', [
    ['Breadcrumb', 'Home', 'secondary', '/', 'built', 'B1-03 PU-03 `ol.xp-crumbs`'],
    ['Breadcrumb', 'Areas', 'secondary', '/areas', 'built', 'B1-03 PU-03 `ol.xp-crumbs`'],
    [
      'Facts',
      'Experiments (the count)',
      'secondary',
      '/experiments?area={areaId}',
      'built',
      'B1-03 PU-03 "Header with counts that link"',
    ],
    [
      'Header',
      'Browse N experiments',
      'primary',
      '/experiments?area={areaId}',
      'built',
      'B1-03 PU-03 `a.xr-btn--primary`',
    ],
    [
      'Courses in this area',
      '(the course’s name)',
      'secondary',
      '/courses/{courseId}',
      'built',
      'B1-03 PU-03 `h3.xp-course-name a`',
    ],
    [
      'Below the list',
      'How institutional access works',
      'secondary',
      '/#for-institutions',
      'built',
      'B1-03 PU-03 `a.xp-more` (PU-14)',
    ],
    ['Failed', 'Try again', 'secondary', null, 'in-page', 'state-copy `PU-03.failed`'],
    [
      'Failed',
      'Browse experiments',
      'secondary',
      '/experiments',
      'built',
      'state-copy `PU-03.failed` (B1-03 way forward)',
    ],
    [
      'Not found',
      'Browse experiments',
      'secondary',
      '/experiments',
      'built',
      'B1-03 "Area or course · not found" (the message’s own primary)',
    ],
    [
      'Not found',
      'All areas',
      'secondary',
      '/areas',
      'built',
      'B1-03 "Area or course · not found"',
    ],
  ]),
  ...publicPage('PU-04', '/experiments', [
    ['Breadcrumb', 'Home', 'secondary', '/', 'built', 'B1-04 `ol.xp-crumbs`'],
    [
      '"We adjusted this link"',
      'Dismiss',
      'secondary',
      null,
      'in-page',
      'B1-04 "This link was adjusted"',
    ],
    ['View', 'All experiments / By area', 'secondary', null, 'in-page', 'B1-04 `div.xr-seg`'],
    [
      'Above the panel',
      'Hide filters / Show filters',
      'secondary',
      null,
      'in-page',
      'B1-04 `button.xp-filter-toggle` (≥ 1024 px)',
    ],
    [
      'Filters panel and sheet',
      '(a facet option)',
      'secondary',
      null,
      'in-page',
      'B1-04 `label.xp-fopt` (Engineering area · Course · Format)',
    ],
    [
      'Filters panel and sheet',
      'Clear all',
      'secondary',
      null,
      'in-page',
      'B1-04 `.xp-filters-head`, `.xp-fsheet-foot`',
    ],
    [
      'Toolbar',
      'Search experiments / Sort by',
      'secondary',
      null,
      'in-page',
      'B1-04 `div.xr-toolbar`',
    ],
    [
      'Toolbar',
      'Filters (n)',
      'secondary',
      null,
      'in-page',
      'B1-04 `button.xp-filter-btn` (opens the sheet, below 1024 px)',
    ],
    [
      'Toolbar status',
      'Remove <chip>',
      'secondary',
      null,
      'in-page',
      'B1-04 `span.xr-fchip button`',
    ],
    [
      'Toolbar status and no results',
      'Clear all filters',
      'secondary',
      null,
      'in-page',
      'B1-04 status row; "No results"',
    ],
    [
      'Row',
      '(the experiment’s title)',
      'secondary',
      '/experiments/{experimentId}',
      'built',
      'B1-04 "every row opens the experiment" (`?format=` with one format filter, state-copy `PU-04.format-context`)',
    ],
    [
      'By area view',
      'View area',
      'secondary',
      '/areas/{areaId}',
      'built',
      'B1-04 "By area view" `div.xp-group-h a`',
    ],
    ['Failed', 'Try again', 'secondary', null, 'in-page', 'B1-04 "Failed + retry"'],
    [
      'Filter sheet',
      'Close filters / Show N experiments',
      'secondary',
      null,
      'in-page',
      'B1-04 "Mobile 375 · filter sheet"',
    ],
  ]),
  ...publicPage('PU-05', '/courses/{courseId}', [
    ['Breadcrumb', 'Home', 'secondary', '/', 'built', 'B1-03 PU-05 `ol.xp-crumbs`'],
    ['Breadcrumb', 'Areas', 'secondary', '/areas', 'built', 'B1-03 PU-05 `ol.xp-crumbs`'],
    [
      'Breadcrumb',
      '(the area’s name)',
      'secondary',
      '/areas/{areaId}',
      'built',
      'B1-03 PU-05 `ol.xp-crumbs`',
    ],
    [
      'Experiments in this course',
      '(the experiment’s title)',
      'secondary',
      '/experiments/{experimentId}',
      'built',
      'B1-03 PU-05 `h3.xp-erow-title a`',
    ],
    [
      'Below the list',
      'How institutional access works',
      'secondary',
      '/#for-institutions',
      'built',
      'B1-03 PU-05 `a.xp-more` (PU-14)',
    ],
    [
      'Below the list',
      'Back to <area>',
      'secondary',
      '/areas/{areaId}',
      'built',
      'B1-03 PU-05 `a.xp-more`',
    ],
    [
      'Nothing published yet',
      'Browse all experiments',
      'secondary',
      '/experiments',
      'built',
      'B1-03 "Course · nothing published yet"',
    ],
    ['Failed', 'Try again', 'secondary', null, 'in-page', 'state-copy `PU-05.failed`'],
    [
      'Failed',
      'Browse experiments',
      'secondary',
      '/experiments',
      'built',
      'state-copy `PU-05.failed` (B1-03 way forward)',
    ],
    [
      'Not found',
      'Browse experiments',
      'secondary',
      '/experiments',
      'built',
      'B1-03 "Area or course · not found"',
    ],
    [
      'Not found',
      'All areas',
      'secondary',
      '/areas',
      'built',
      'B1-03 "Area or course · not found"',
    ],
  ]),
  ...publicPage('PU-06', '/experiments/{experimentId}', [
    ['Breadcrumb', 'Experiments', 'secondary', '/experiments', 'built', 'B1-05 `ol.xp-crumbs`'],
    [
      'Breadcrumb',
      '(the area’s name)',
      'secondary',
      '/areas/{areaId}',
      'built',
      'B1-05 `ol.xp-crumbs`',
    ],
    [
      'Breadcrumb',
      '(the course’s code or name)',
      'secondary',
      '/courses/{courseId}',
      'built',
      'B1-05 `ol.xp-crumbs`',
    ],
    [
      'Arrived with a format filter',
      'Back to <format> experiments',
      'secondary',
      '/experiments?format=vr',
      'built',
      'B1-05 "Arrived with a format filter (VR)" `a.xr-back`',
    ],
    [
      'Hero',
      '(the course line)',
      'secondary',
      '/courses/{courseId}',
      'built',
      'B1-05 `a.xp-xcourse`',
    ],
    [
      'Panel',
      'Add to selection',
      'primary',
      null,
      'in-page',
      'B1-05 panel (a SelectionService.add command)',
    ],
    [
      'Panel · change formats',
      'Update selection / Cancel',
      'secondary',
      null,
      'in-page',
      'B1-05 "Change formats" (SelectionService.setFormats)',
    ],
    [
      'Panel · in your selection',
      'Change formats / Remove from selection',
      'secondary',
      null,
      'in-page',
      'B1-05 "In your selection" (SelectionService.remove)',
    ],
    [
      'Panel · in your selection',
      'Go to selection',
      'secondary',
      '/selection',
      'not-rendered',
      'B1-05 `a.xr-btn--primary` → B1-06',
    ],
    ['Panel', 'Already have access? Sign in', 'secondary', '/sign-in', 'built', 'B1-05 panel foot'],
    [
      'Preview',
      'Open preview',
      'secondary',
      null,
      'external',
      'B1-05 `.xp-preview-bar a` (the experiment’s preview link; no seeded experiment has one, so the poster shows)',
    ],
    [
      'Part of the course',
      'View the course',
      'secondary',
      '/courses/{courseId}',
      'built',
      'B1-05 `.xp-mini a.xp-more`',
    ],
    [
      'How institutional access works',
      'More about access',
      'secondary',
      '/#for-institutions',
      'built',
      'B1-05 `.xp-mini a.xp-more` (PU-14 mini version)',
    ],
    ['Failed', 'Try again', 'secondary', null, 'in-page', 'state-copy `PU-06.failed`'],
    ['Not found', 'Browse experiments', 'secondary', '/experiments', 'built', 'B1-05 "Not found"'],
    ['Not found', 'Home', 'secondary', '/', 'built', 'B1-05 "Not found"'],
  ]),
];

/**
 * The ledger's target for a workspace (`<base>` → `/student`, `{id}` → a report's reference,
 * `{requestId}` → a request's, `{institutionId}` → an institution's; the public pages' `{areaId}`,
 * `{courseId}`, `{experimentId}` → the spine-start world's Shell-and-Tube chain).
 */
export function expandTarget(target: string, base: string, reportId = 'SUP-0213'): string {
  return target
    .replace('<base>', base)
    .replace('{id}', reportId)
    .replace('{requestId}', 'REQ-0038')
    .replace('{institutionId}', 'bitshyd')
    .replace('{areaId}', 'mechanical-manufacturing')
    .replace('{courseId}', 'thermodynamics-heat-transfer')
    .replace('{experimentId}', 'shell-and-tube-heat-exchanger');
}

type PublicRow = readonly [
  where: string,
  action: string,
  role: ActionRole,
  target: string | null,
  outcome: LedgerOutcome,
  board: string,
];

/** A public page's drawn actions (Package 1B), one row each. */
function publicPage(screen: LedgerScreen, on: string, rows: readonly PublicRow[]): LedgerEntry[] {
  return rows.map(([where, action, role, target, outcome, board]) => ({
    screen,
    where,
    action,
    role,
    on,
    target,
    outcome,
    board,
    ...(outcome === 'not-rendered'
      ? { note: 'The Selection (PU-07) is not built (Package 1C): the action appears with it.' }
      : {}),
  }));
}

/** The public shell's header, menu sheet and footer, on every public page and the public PU-15. */
function publicShell(): LedgerEntry[] {
  const at = (
    where: string,
    action: string,
    target: string | null,
    outcome: LedgerOutcome,
    board: string,
  ): LedgerEntry => ({
    screen: 'Public shell',
    where,
    action,
    role: 'secondary',
    on: PUBLIC_PAGE,
    target,
    outcome,
    board,
    ...(outcome === 'not-rendered'
      ? { note: 'The Selection (PU-07) is not built (Package 1C): the action appears with it.' }
      : {}),
  });
  const nav = (where: string, board: string) => [
    at(where, 'Browse experiments', '/experiments', 'built', board),
    at(where, 'Areas', '/areas', 'built', board),
    at(where, 'For institutions', '/#for-institutions', 'built', board),
  ];
  return [
    at(
      'Skip link (first Tab stop)',
      'Skip to main content',
      '#main',
      'in-page',
      'Appendix E §7.4 (VD-16)',
    ),
    at('Header', 'XR Learning Platform — home', '/', 'built', 'B1-01 `a.xp-brand`'),
    ...nav('Header `nav` Main', 'B1-01 `ul.xp-nav`'),
    at('Header', 'Selection (n)', '/selection', 'not-rendered', 'B1-01 `a.xp-sel` → B1-06'),
    at('Header', 'Sign in', '/sign-in', 'built', 'B1-01 `a.xp-signin`'),
    at(
      'Header',
      'Request access',
      '/selection',
      'not-rendered',
      'B1-01 `a.xp-access` → B1-06 (HB-02)',
    ),
    at(
      'Header (below 1024 px)',
      'Menu / Close',
      null,
      'in-page',
      'B1-01 `button.xp-menu-btn` ("Mobile 375 · menu open")',
    ),
    ...nav('Menu sheet', 'B1-01 "Mobile 375 · menu open" `ul.xp-sheet-list`'),
    at('Menu sheet', 'Selection (n)', '/selection', 'not-rendered', 'B1-01 sheet list → B1-06'),
    at('Menu sheet', 'Sign in', '/sign-in', 'built', 'B1-01 `.xp-sheet-actions`'),
    at(
      'Menu sheet',
      'Request access',
      '/selection',
      'not-rendered',
      'B1-01 `.xp-sheet-actions` → B1-06',
    ),
    ...nav('Footer', 'B1-01 `nav aria-label="Footer"` (real links only; PU-16 excluded)'),
    at('Footer', 'Sign in', '/sign-in', 'built', 'B1-01 footer'),
  ];
}
