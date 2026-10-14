/**
 * The per-screen state-copy register (VD-12, register P0-18; Appendix F §6.6 "Undrawn states use
 * the board-04 copy formula and go into a per-screen state copy register for sign-off"; Appendix E
 * §5; WP-0.13 acceptance 2: the P0-31 title "marked provisional in the state-copy register").
 *
 * Every state string or rule a Phase-0 screen shows that its own board does not draw word for
 * word: where it comes from, and whether the owner has it yet. `drawn` = the words are on a board
 * (cited); `provisional` = written to a board formula or chosen as an interim, awaiting sign-off.
 * The screens read their words from here, so the register and the product cannot drift apart.
 * Later phases add their screens' entries (Appendix F §9).
 */
export type StateCopyStatus = 'drawn' | 'provisional';

export interface StateCopyEntry {
  /** The screen (or the shell around every screen). */
  readonly screen:
    | 'Shell'
    | 'Public shell'
    | 'XS-01'
    | 'XS-03'
    | 'XS-06'
    | 'XS-07'
    | 'PU-01'
    | 'PU-02'
    | 'PU-03'
    | 'PU-04'
    | 'PU-05'
    | 'PU-06'
    | 'PU-14'
    | 'PU-15'
    | 'SA-02'
    | 'SA-03';
  /** The state, as the screen reaches it. */
  readonly state: string;
  /** The words shown; `null` where the entry is a rule rather than words. */
  readonly words: string | null;
  /** The rule, where the entry is one (how a value is made, or what is left out). */
  readonly rule?: string;
  /** The board, formula or record it rests on. */
  readonly basis: string;
  readonly status: StateCopyStatus;
  /** The owner decision(s) it waits on, where one exists. */
  readonly decisions?: readonly string[];
}

export const STATE_COPY = {
  'shell.session-loading': {
    screen: 'Shell',
    state: 'The tab’s session is resolving (a workspace address before the shell can be drawn)',
    words: 'Loading …',
    basis:
      'Board 04 "State grammar" Loading ("announced politely"); board 12 "Reduced motion" (“Loading …” still announced). No board draws this wait.',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'shell.document-title': {
    screen: 'Shell',
    state: 'The browser tab’s title on every Phase-0 page (WCAG 2.4.2)',
    words: null,
    rule: '“<the page’s top-bar title> · XR Learning Platform”; “XR Learning Platform” alone while loading. The public not-found: “We can’t find that page · XR Learning Platform”.',
    basis:
      'Appendix F §3.3 (metadata "XR Learning Platform" + per-page titles); the product name as the shells write it. No board draws document titles.',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'XS-06.top-title': {
    screen: 'XS-06',
    state: 'Top bar on another role’s workspace',
    words: 'Not your workspace',
    basis: 'Board 08 "At 375 px" (`span.xr-top-title`) and "The family" crumb',
    status: 'drawn',
  },
  'PU-15.top-title': {
    screen: 'PU-15',
    state: 'Top bar on the in-shell not-found',
    words: 'Not found',
    basis: 'Board 08 "The family": "Page not found · workspace" (crumb "Not found")',
    status: 'drawn',
  },
  'XS-07.reports.loading': {
    screen: 'XS-07',
    state: 'My reports loading (screen readers)',
    words: 'Loading your reports',
    basis: 'Board 04 "State grammar" Loading: → screen readers: “Loading your reports”',
    status: 'drawn',
  },
  'XS-07.reports.failed': {
    screen: 'XS-07',
    state: 'My reports failed to load (service unavailable; reached only under a test fault plan)',
    words: 'Your reports didn’t load. Nothing was lost.',
    basis:
      'Board 04 "State grammar" Failed + retry (“What didn’t work + reassurance + retry”, sample “The simulation didn’t open. Nothing was lost.”); line and actions as board 03 draws the failed state',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'XS-07.failed.line': {
    screen: 'XS-07',
    state: 'The failed state’s next step (My reports, a report)',
    words: 'Try again. If it keeps happening, report the problem.',
    basis: 'Board 03 "Notices, empty, error, loading and read-only" (the failed notice’s line)',
    status: 'drawn',
  },
  'XS-07.detail.loading': {
    screen: 'XS-07',
    state: 'A report loading (screen readers)',
    words: 'Loading your report',
    basis: 'Board 04 "State grammar" Loading formula (sample “Loading your reports”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'XS-07.detail.failed': {
    screen: 'XS-07',
    state: 'A report failed to load (service unavailable; reached only under a test fault plan)',
    words: 'Your report didn’t load. Nothing was lost.',
    basis: 'Board 04 "State grammar" Failed + retry formula',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'XS-07.send.failed': {
    screen: 'XS-07',
    state: 'Send report failed for now (service unavailable)',
    words: null,
    rule: 'Nothing changes: the form keeps what was typed and Send can be pressed again; no message is shown.',
    basis:
      'Board 07 draws no failure frame (contract ledger note on reportProblem); Appendix F §6.6 “command unavailable → nothing changes … answers kept”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'XS-07.report-title': {
    screen: 'XS-07',
    state: 'A report’s title in My reports and on its detail',
    words: null,
    rule: 'The beginning of “What happened”: spaces collapsed; up to 60 characters shown whole without a closing full stop; longer text cut at the last whole word, with “…”. Display only — no title is saved.',
    basis:
      'Owner decision P0-31 (12 Oct 2026: display-only excerpt of “What happened”); board 07 draws titles up to 46 characters and no cut title',
    status: 'provisional',
    decisions: ['P0-31'],
  },
  'XS-07.where-prefill': {
    screen: 'XS-07',
    state: '“Where did it happen?” pre-filled',
    words: null,
    rule: 'The last page the person saw outside Help & support in this tab, in that page’s top-bar words joined with “ · ” (e.g. “Not found”, “Not your workspace” in Phase 0); empty when there is none. Never an address.',
    basis:
      'Board 07 "State 1" (“Where” is pre-filled from the page the person came from; places written “Content library · Forced Convection”); board 08 "Rules" (never route names)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'XS-07.where-empty': {
    screen: 'XS-07',
    state: 'Report detail when no place was given',
    words: null,
    rule: 'The “Where” row of “What you reported” is left out.',
    basis: 'Board 07 draws a place in every frame; no words for an empty one are drawn',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'XS-07.no-screenshot': {
    screen: 'XS-07',
    state: 'Report detail when no screenshot was chosen',
    words: 'No screenshot added',
    basis: 'Board 07 "State 3a · Report detail · reopened" (`shot`)',
    status: 'drawn',
  },
  'XS-07.dates': {
    screen: 'XS-07',
    state: 'Every date on Help & support',
    words: null,
    rule: 'Day and month (“3 Oct”), read in Indian time (the sample world’s zone); no year.',
    basis:
      'Board 07 (“sent 3 Oct”, “Resolution note · 23 Sep”); B8-03 (no numeric dates). The zone and the year left out across years are interim.',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  // ---- Phase 1, Package 1A: XS-01 / XS-03 / XS-04 (B1-09), SA-02 (B1-10), SA-03 (B1-11) ----
  'XS-01.links-hidden': {
    screen: 'XS-01',
    state:
      'The card’s ways out: “Back to experiments” (top row) and “Request institutional access” (under the card)',
    words: null,
    rule: 'Each is rendered once its page is built: “Back to experiments” goes to the Landing `/` (P1-17 follows the href) since Package 1B; “Request institutional access” waits for the Selection (PU-07, Package 1C) — an unbuilt address shows the public not-found page and restarts the tab’s world.',
    basis:
      'B1-09 f0 (`a.xr-back` to B1-01, `div.xp-auth-links` to B1-06); owner P0-35 built-screen navigation, extended to Phase 1 (Package 1A authorisation)',
    status: 'provisional',
    decisions: ['P0-35', 'P1-17'],
  },
  'XS-01.signed-in-visit': {
    screen: 'XS-01',
    state:
      'Someone already signed in opens the sign-in address (the browser’s Back, a typed address)',
    words: null,
    rule: 'No form: “Loading …” while they are sent to their own workspace — the validated return address, else their role’s home. Moving between people is signing out, then in (ADR-0003 §5).',
    basis: 'B1-09 draws no signed-in visit; ADR-0003 §5 (no switching without signing out)',
    status: 'provisional',
    decisions: ['VD-12', 'P1-19'],
  },
  'XS-01.sso-unavailable-focus': {
    screen: 'XS-01',
    state: 'Single sign-on answered “not available” (T-10 policy-open)',
    words: null,
    rule: 'The notice replaces the button (B1-09 f6) and focus moves to the E-mail field, where the notice says to sign in instead.',
    basis:
      'B1-09 f5 → f6 (“E-mail sign-in shown as the state; no dead button”); no board draws where focus goes',
    status: 'provisional',
    decisions: ['T-10', 'VD-12'],
  },
  'XS-01.inactive': {
    screen: 'XS-01',
    state: 'The sign-in of an inactive Faculty member (SES-09 policy-open)',
    words: null,
    rule: 'The card’s own drawn notice “Your account is inactive · Contact your institution administrator.”, password cleared, focus on the notice. Nobody is signed in.',
    basis:
      'B1-09 card markup (`g.inactive` notice; no frame shows it); SessionService.signIn answers `policy-open` SES-09; B1-09 f7 draws inactive people signing in with the banner',
    status: 'provisional',
    decisions: ['SES-09', 'P1-01'],
  },
  'XS-01.unavailable': {
    screen: 'XS-01',
    state: 'Sign-in failed for now (service unavailable)',
    words: null,
    rule: 'Nothing changes: the form keeps what was typed and Sign in can be pressed again; no message is shown.',
    basis: 'B1-09 draws no failure frame; Appendix F §6.6 “command unavailable → nothing changes”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'XS-03.return-place': {
    screen: 'XS-03',
    state: '“Session expired”: where the person was, in words',
    words: null,
    rule: 'Only a built page’s address has words — its crumbs and title joined with “ › ” (“Requests › REQ-0038”); a record reference is shown only in the boards’ reference shape (REQ-0042), else the list alone. Any other address: the sentence without a place.',
    basis:
      'B1-09 f9 (“Return address kept and shown”: “My courses › Shell-and-Tube Heat Exchanger”); board 08 “Never show route names”',
    status: 'provisional',
    decisions: ['P1-19', 'VD-12'],
  },
  'XS-03.expired-no-place': {
    screen: 'XS-03',
    state: '“Session expired” with a return address that names no built page',
    words: 'Sign in again to go back to where you were.',
    basis: 'B1-09 f9 sentence without its place (“Sign in again to go back to where you were: …”)',
    status: 'provisional',
    decisions: ['P1-19'],
  },
  'SA-02.unnamed-experiment': {
    screen: 'SA-02',
    state: 'A requested experiment the published catalogue no longer names',
    words: null,
    rule: 'Its reference stands in for the title (no course line).',
    basis: 'B1-10 / B1-11 name every requested experiment; none is drawn unpublished',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-03.loading': {
    screen: 'SA-03',
    state: 'The request loading (screen readers)',
    words: 'Loading the request',
    basis:
      'Board 04 "State grammar" Loading formula (sample “Loading your reports”); B1-11 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-03.failed': {
    screen: 'SA-03',
    state: 'The request failed to load (service unavailable; reached only under a test fault plan)',
    words: 'The request didn’t load. Nothing was lost.',
    basis: 'Board 04 "State grammar" Failed + retry formula',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-03.failed.line': {
    screen: 'SA-03',
    state: 'The failed state’s next step',
    words: 'Try again. If it keeps happening, report the problem.',
    basis: 'Board 03 "Notices, empty, error, loading and read-only" (the failed notice’s line)',
    status: 'drawn',
  },
  'SA-03.message-absent': {
    screen: 'SA-03',
    state: 'A request with no message from the requester',
    words: null,
    rule: 'The “Message from the requester” section is left out.',
    basis: 'B1-11 draws a message on every request',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-03.term-until': {
    screen: 'SA-03',
    state: 'A request for access “Until a fixed date” (B1-07)',
    words: null,
    rule: '“Until 31 Oct 2027” — the date in words. B1-11 has no Super Admin wording for it.',
    basis:
      'B1-07 term option “Until a fixed date”; B1-11 terms Monthly · Quarterly · Yearly (board versus board)',
    status: 'provisional',
    decisions: ['P1-10'],
  },
  'SA-03.term-not-offered': {
    screen: 'SA-03',
    state:
      'A smaller scope for a request whose term the select does not offer (more licences for the “Current term”; “Until a fixed date”)',
    words: null,
    rule: 'The select shows its first option, Monthly, and that is the term sent: the command takes Monthly, Quarterly or Yearly only. “Different from the request” therefore always says “Term: Current term → Monthly”, so a smaller scope with only a reason passes “Change at least one thing” and records Monthly unless the Super Admin picks another term.',
    basis:
      'B1-11 keeps the asked term in its state (`term = s.term || R.term`), so the board would list no term difference — but its select has no such option and the contract (`approveSmallerScopeInput.term`) requires one of the three. Not drawn for REQ-0040 (f14 is paused).',
    status: 'provisional',
    decisions: ['P1-10', 'P1-11'],
  },
  'SA-03.undrawn-refusal': {
    screen: 'SA-03',
    state:
      'The command refuses a rule no board words (a smaller scope’s licences above the request, PC-06 `not-smaller`; a missing term)',
    words: null,
    rule: '“Check your decision” shows without a line and takes focus, the field the rule names is marked invalid, the confirmation closes and nothing is written. Editing that field clears the mark.',
    basis:
      'B1-11 “Check your decision” (`errs`); the contract catalogue leaves these rules undrawn (`UNDRAWN_RULES`, message `null`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-03.unavailable': {
    screen: 'SA-03',
    state:
      'A decision command failed for now (service unavailable; reached only under a test fault plan)',
    words: null,
    rule: 'Nothing changes: the confirmation closes, the panel keeps the decision being composed and its button can be pressed again; no message is shown.',
    basis:
      'B1-11 draws no failure for a decision; Appendix F §6.6 “command unavailable → nothing changes … answers kept” (as XS-01.unavailable)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-02.nav-count-singular': {
    screen: 'SA-02',
    state: 'The Super Admin sidebar count with one request under review (screen readers)',
    words: null,
    rule: 'Read as “1 requests under review”: board 06 and B1-10 draw only the plural (“3 requests under review”), and no singular is configured (nav/nav-config.ts). Open since WP-0.8.',
    basis: 'Board 06 `countText`; B1-10 f0 sidebar (`xr-count` `xr-sr`)',
    status: 'provisional',
    decisions: ['VD-12', 'WP-0.8 open item'],
  },
  'SA-03.existing-no-plan': {
    screen: 'SA-03',
    state: '“Existing access” for an institution with a record but no access plan yet',
    words: 'No access plan yet.',
    basis:
      'B1-11 draws a new institution (“None. There is no institution record …”) and existing plans only',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-03.created-by-this': {
    screen: 'SA-03',
    state: 'Whether the institution record was created by this request’s approval',
    words: null,
    rule: 'Yes when the request asked for new access, has been approved, and every plan the institution holds came from it: “Created · <when>” and “Institution record created by this approval”. Display only.',
    basis:
      'B1-11 `isNew = !R.hasPlan` (f9 … f11); the decision page carries no creation fact of its own',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-03.history-undrawn': {
    screen: 'SA-03',
    state: 'History events B1-11 does not word for the Super Admin',
    words: null,
    rule: 'The requester’s B1-08 words: “BITS started reviewing”, “Payment started”, “Payment not completed”. An internal activation with no plan written (OD-B3-09) reads “No payment step (internal).”',
    basis:
      'B1-08 / B1-13 request timelines; B1-11 `hist` (submitted, approved, information requested, payment confirmed, activated)',
    status: 'provisional',
    decisions: ['VD-12', 'P1-11'],
  },
  'SA-03.decided-by-another': {
    screen: 'SA-03',
    state: 'A decision made by another Super Admin',
    words: null,
    rule: '“Decided by <name>” / “Sent by <name>” in place of “by you”. The sample world holds one Super Admin.',
    basis: 'B1-11 f9 … f12 draw “by you” only',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-03.next-undrawn': {
    screen: 'SA-03',
    state: 'The decided panel of a request whose payment was started but not confirmed, or failed',
    words: null,
    rule: 'No next line (B1-11 words only Approved — payment required, Access active and Information requested).',
    basis: 'B1-11 `next`',
    status: 'provisional',
    decisions: ['VD-12', 'P1-06'],
  },
  'SA-03.policy-open': {
    screen: 'SA-03',
    state:
      'A decision that reaches an open policy (T-03 after “Information requested”, REQ-19 narrowing several experiments)',
    words: null,
    rule: 'Nothing is written; the confirmation closes and the page is read again. No message: no board draws one.',
    basis:
      'AccessRequestService contract (`policy-open` T-03, REQ-19); B1-11 builds only single-experiment narrowing (P1-07)',
    status: 'provisional',
    decisions: ['P1-05', 'P1-07'],
  },
  'SA-03.paused-no-link': {
    screen: 'SA-03',
    state: '“This institution is paused” — its “View institution” link',
    words: null,
    rule: 'Not rendered until Institution detail (SA-07) is built.',
    basis: 'B1-11 f14 (`xr-notice-actions` → B7-03); owner P0-35 built-screen navigation',
    status: 'provisional',
    decisions: ['P0-35'],
  },
  'SA-03.internal-confirm-plan': {
    screen: 'SA-03',
    state: 'Confirming an internal approval of a renewal or more licences',
    words: null,
    rule: 'B1-11’s internal lines are kept as drawn (“… activated now and the access plan is created”), although for these requests the plan effect is open and the mock writes no plan (OD-B3-09).',
    basis:
      'B1-11 f3 `cfInt`; surface-super-admin.json inconsistencies[26]; P1-11 interim (plan effect `policy-open`, no ACC change)',
    status: 'provisional',
    decisions: ['P1-11'],
  },
  // ---- Phase 1, Package 1B: the public surface (B1-01 … B1-05; TE-8) ----
  'Public shell.links-not-rendered': {
    screen: 'Public shell',
    state:
      'The drawn ways into the Selection and the request (PU-07, Package 1C): the header “Selection (n)” link and “Request access” button, the menu sheet’s Selection row and Request access button, the hero and For institutions “Request institutional access”, PU-06 “Go to selection”, and the sign-in card’s “Request institutional access”',
    words: null,
    rule: 'Not rendered until PU-07 is built (Package 1C): an unbuilt address shows the public not-found page and, as a document load, restarts the tab’s sample world (ADR-0004). Adding to the selection works on PU-06; its state shows in the panel and on catalogue rows.',
    basis:
      'B1-01 header `a.xp-sel`, `a.xp-access`, hero `xp-paths`, `xp-inst-foot`; B1-05 panel; owner P0-35 built-screen navigation, extended to Phase 1 (Package 1A and 1B authorisations: “keep the Public navigation within implemented destinations”)',
    status: 'provisional',
    decisions: ['P0-35'],
  },
  'Public shell.skip-link': {
    screen: 'Public shell',
    state: 'The first Tab stop on every public page',
    words: 'Skip to main content',
    basis:
      'Appendix E §7.4 (VD-16: skip link in the PublicShell, WCAG 2.4.1; invisible until focused); board 12 “Shell tab order”. No B1 frame draws it.',
    status: 'provisional',
    decisions: ['VD-16'],
  },
  'Public shell.document-title': {
    screen: 'Public shell',
    state: 'The browser tab’s title on the public pages (WCAG 2.4.2)',
    words: null,
    rule: 'The page’s heading · XR Learning Platform (“Experiments · …”, “Engineering areas · …”, the area, course or experiment name); the Landing is “XR Learning Platform” alone; a not-found state takes its message title.',
    basis: 'As `shell.document-title` (Appendix F §3.3); no board draws document titles',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'Public shell.route-focus': {
    screen: 'Public shell',
    state: 'Focus after a client-side move between public pages',
    words: null,
    rule: 'Focus moves to `main#main` without scrolling, as in the workspaces; arriving at `/#for-institutions` focuses that section (PU-14) and scrolls it into view. A document load moves nothing.',
    basis: 'WP-0.13 route focus (workspace shell); B1-01 “For institutions” anchor (PU-14)',
    status: 'provisional',
    decisions: ['VD-12', 'VD-16'],
  },
  'PU-01.hero-caption': {
    screen: 'PU-01',
    state: 'The hero’s one static scene and its caption link',
    words: null,
    rule: 'The hero shows its drawn illustration (thermal.svg, with its drawn description); the caption names the published experiment that illustration depicts (the experiment whose catalogue artwork is a crop of it), with its published formats — omitted when no published experiment has that artwork.',
    basis:
      'B1-01 hero `figcaption.xp-hero-cap` (“ME ZG523 · Shell-and-Tube Heat Exchanger”, WEB AR VR) and its static art; “One static scene”',
    status: 'provisional',
    decisions: ['P1-22'],
  },
  'PU-01.featured-tag': {
    screen: 'PU-01',
    state: 'The area tag on a featured experiment card',
    words: null,
    rule: 'The first word of the experiment’s area name (“Mechanical”, “Electrical”, “Chemical”); when the areas cannot be read the cards show without a tag.',
    basis: 'B1-01 featured cards `span.xp-card-tag`; the area record holds no short name',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'PU-01.sections-loading': {
    screen: 'PU-01',
    state: 'The explorer, the featured cards and the format counts while their reads load',
    words: null,
    rule: 'The section heads show at once; the explorer section shows B1-01’s plain area list as soon as the areas are known and the explorer when their courses are; each part announces its wait once (“Loading engineering areas”, “Loading experiments”).',
    basis:
      'B1-01 “Areas loading (or art failed) → plain list · Readable immediately; the explorer replaces it when ready”; B1-03 / B1-04 loading words',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'PU-01.sections-failed': {
    screen: 'PU-01',
    state: 'A landing read fails (the areas, the featured experiments or the catalogue counts)',
    words: null,
    rule: 'The section shows the drawn failed block of its family: B1-03 “We couldn’t load the engineering areas” (with Try again and Browse experiments) in the explorer when the areas cannot be read — if only their courses cannot, B1-01’s plain area list stays (“Areas loading (or art failed) → plain list”) — and B1-04 “We couldn’t load the experiments” (with Try again) in Featured; the format cards keep their words and leave the count line out.',
    basis: 'B1-03 “All areas · failed + retry”; B1-04 “Failed + retry”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'PU-03.loading': {
    screen: 'PU-03',
    state: 'An area page while its read loads',
    words: 'Loading engineering area',
    basis: 'Board 04 loading formula; B1-03 “All areas · loading” (“Loading engineering areas”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'PU-03.failed': {
    screen: 'PU-03',
    state: 'An area page’s read fails',
    words: 'We couldn’t load this engineering area',
    basis: 'B1-03 “All areas · failed + retry” formula (“We couldn’t load the engineering areas”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'PU-05.loading': {
    screen: 'PU-05',
    state: 'A course page while its read loads',
    words: 'Loading course',
    basis: 'Board 04 loading formula; B1-03 “All areas · loading”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'PU-05.failed': {
    screen: 'PU-05',
    state: 'A course page’s read fails',
    words: 'We couldn’t load this course',
    basis: 'B1-03 “All areas · failed + retry” formula',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'PU-05.not-found': {
    screen: 'PU-05',
    state: 'An unknown course address',
    words: 'We can’t find that course',
    basis:
      'B1-03 “Area or course · not found” (one frame, titled “We can’t find that area”; the same sentence and actions are kept)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'PU-04.course-chip-without-code': {
    screen: 'PU-04',
    state: 'The filter chip of a course with no platform code',
    words: 'Course: {name}',
    basis: 'B1-04 chips “Course: ME ZG523” (code); T-17 (a course may have no code)',
    status: 'provisional',
    decisions: ['T-17'],
  },
  'PU-04.address': {
    screen: 'PU-04',
    state: 'The catalogue’s address carries its view',
    words: null,
    rule: '`/experiments?area=&course=&format=&q=&sort=&view=` — repeated keys for several values; the defaults (no filter, Default order, All experiments) carry no key. Unknown area, course or format values are dropped and “We adjusted this link” shows once; an unknown order or view falls back to its default. Filters, search and order replace the address (no new history entry).',
    basis:
      'Appendix A PU-04 (query PROPOSED); B1-04 “Arriving with a filter”, “This link was adjusted”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'PU-04.format-context': {
    screen: 'PU-04',
    state: 'A row opened from a catalogue filtered by one format',
    words: null,
    rule: 'With exactly one format filter, each row opens the experiment with `?format=` (B1-05 “Arrived with a format filter”: back link to that catalogue, the format pre-chosen and its row marked). With none or several, the row opens the plain page.',
    basis: 'B1-05 “Arrived with a format filter (VR)”; Appendix A PU-06 (`?format=` PROPOSED)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'PU-06.loading': {
    screen: 'PU-06',
    state: 'An experiment page while its read loads',
    words: 'Loading experiment',
    basis: 'Board 04 loading formula; B1-04 “Loading experiments”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'PU-06.failed': {
    screen: 'PU-06',
    state: 'An experiment page’s read fails',
    words: 'We couldn’t load this experiment',
    basis: 'B1-04 “Failed + retry” formula (“We couldn’t load the experiments”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'PU-06.not-available': {
    screen: 'PU-06',
    state: 'An experiment missing more than one format',
    words: null,
    rule: '“Not available in AR, VR or MR.” — B1-05’s one sentence, listing every format the experiment does not have, in display order.',
    basis: 'B1-05 “Format not available” (“Not available in MR.” — one missing format drawn)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'PU-06.hero-art': {
    screen: 'PU-06',
    state: 'The hero illustration of an experiment',
    words: null,
    rule: 'The experiment’s concept artwork (its full drawing where the catalogue uses a crop); described in words where a board describes that drawing (thermal.svg), otherwise decorative beside the visible “Illustration · concept artwork” label; the drawn fallback when it has none.',
    basis: 'B1-05 hero `figure.xp-xart` (thermal.svg with its description); assets.json',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'PU-06.selection-unexpected': {
    screen: 'PU-06',
    state:
      'The selection refuses a change the panel does not offer (a format no longer published, an experiment added twice in another view)',
    words: null,
    rule: 'The panel re-reads the selection and shows its current state; no undrawn message.',
    basis: 'B1-05 panel states (pick · in your selection · change formats · validation)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;

export type StateCopyId = keyof typeof STATE_COPY;

type WordsId = {
  readonly [Id in StateCopyId]: (typeof STATE_COPY)[Id]['words'] extends string ? Id : never;
}[StateCopyId];

/** The words of a register entry that has words. */
export function stateWords(id: WordsId): string {
  return STATE_COPY[id].words;
}
