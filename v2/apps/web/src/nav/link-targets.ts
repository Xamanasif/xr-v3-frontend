/**
 * The link-target ledger (ADR-0005 §8; Appendix F §3.3 "Unbuilt destinations", WP-0.13 acceptance
 * 9; register P0-35): every action drawn on the built screens (Phase 0, then Phase-1 Package 1A:
 * XS-01, SA-02, SA-03), where it goes, and what that address shows. Its tests prove that every link reaches a built page — except the one
 * documented dead link — and that no primary action resolves to the page it is on; the browser
 * suite follows each link for real and checks that no document load (which would rebuild the
 * sample world, ADR-0004) happens on the way.
 *
 * Targets are written per workspace: `<base>` is the workspace the page is in (for XS-06, the
 * person's OWN base — the address on show belongs to another workspace), `{id}` a report's
 * reference.
 */

/** The screen (or shell part) an action is drawn on. */
export type LedgerScreen =
  'Shell' | 'XS-01' | 'XS-05' | 'XS-06' | 'XS-07' | 'XS-08' | 'PU-15' | 'SA-02' | 'SA-03';

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
  | 'not-rendered';

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
    outcome: 'dead-link',
    board: '08 "Page not found · public"',
    note: 'The one documented Phase-0 dead link: /experiments is PU-04, built in Phase 1 (Appendix F §3.3; register P0-35). It shows the public not-found page until then; no placeholder PU-04 is made.',
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
    outcome: 'not-rendered',
    board: 'B1-09 f0 (`a.xr-back` → B1-01 Landing; P1-17 follows the href)',
    note: 'The Landing (PU-01) is not built: the link appears with it.',
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
];

/**
 * The ledger's target for a workspace (`<base>` → `/student`, `{id}` → a report's reference,
 * `{requestId}` → a request's, `{institutionId}` → an institution's).
 */
export function expandTarget(target: string, base: string, reportId = 'SUP-0213'): string {
  return target
    .replace('<base>', base)
    .replace('{id}', reportId)
    .replace('{requestId}', 'REQ-0038')
    .replace('{institutionId}', 'bitshyd');
}
