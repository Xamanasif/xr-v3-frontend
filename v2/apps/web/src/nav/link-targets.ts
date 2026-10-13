/**
 * The link-target ledger (ADR-0005 §8; Appendix F §3.3 "Unbuilt destinations", WP-0.13 acceptance
 * 9; register P0-35): every action drawn on the Phase-0 screens, where it goes, and what that
 * address shows in Phase 0. Its tests prove that every link reaches a built page — except the one
 * documented dead link — and that no primary action resolves to the page it is on; the browser
 * suite follows each link for real and checks that no document load (which would rebuild the
 * sample world, ADR-0004) happens on the way.
 *
 * Targets are written per workspace: `<base>` is the workspace the page is in (for XS-06, the
 * person's OWN base — the address on show belongs to another workspace), `{id}` a report's
 * reference.
 */

/** The screen (or shell part) an action is drawn on. */
export type LedgerScreen = 'Shell' | 'XS-05' | 'XS-06' | 'XS-07' | 'XS-08' | 'PU-15';

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
  /** The session gate leaves for the unbuilt sign-in (XS-01, Phase 1): K-21. */
  | 'sign-in';

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
    note: 'The built-screen manifest renders only built destinations (XS-07); the rest appear with their phase.',
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
    outcome: 'sign-in',
    board: '06 "Account menu"; B1-09 f10 "Signed out" (XS-03, Phase 1)',
    note: 'A SessionService.signOut command; the session gate then leaves for the XS-03 notice, which is Phase 1 (G-8): /sign-in shows the public not-found page until then (K-21). With the public PU-15’s dead link, one of the two Phase-0 actions that end in a document load (both addresses answer 404), which rebuilds the tab’s sample world (ADR-0004).',
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
];

/** The ledger's target for a workspace (`<base>` → `/student`, `{id}` → the reference). */
export function expandTarget(target: string, base: string, reportId = 'SUP-0213'): string {
  return target.replace('<base>', base).replace('{id}', reportId);
}
