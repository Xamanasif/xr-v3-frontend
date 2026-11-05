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
import { STATE_COPY_DEVICE } from './state-copy-device';
import { STATE_COPY_FACULTY } from './state-copy-faculty';
import { STATE_COPY_FORMATS } from './state-copy-formats';
import { STATE_COPY_GROUPS } from './state-copy-groups';
import { STATE_COPY_IMPORT } from './state-copy-import';
import { STATE_COPY_INSTITUTE_HOME } from './state-copy-institute-home';
import { STATE_COPY_INSTITUTE_REQUESTS } from './state-copy-institute-requests';
import { STATE_COPY_LEARNING_HUB } from './state-copy-learning-hub';
import { STATE_COPY_OPERATIONS } from './state-copy-operations';
import { STATE_COPY_PACKAGE_2B } from './state-copy-package-2b';
import { STATE_COPY_PEOPLE } from './state-copy-people';
import { STATE_COPY_PROGRESS_FEEDBACK } from './state-copy-progress-feedback';
import { STATE_COPY_STUDENT } from './state-copy-student';
import { STATE_COPY_STUDENT_ACCESS } from './state-copy-student-access';
import { STATE_COPY_USAGE } from './state-copy-usage';
import { STATE_COPY_FACULTY_OVERVIEW } from './state-copy-faculty-overview';
import { STATE_COPY_FACULTY_COURSES } from './state-copy-faculty-courses';
import { STATE_COPY_FACULTY_EXPERIMENT } from './state-copy-faculty-experiment';
import { STATE_COPY_ASSESSMENTS } from './state-copy-assessments';
import { STATE_COPY_ASSESSMENT_RECORD } from './state-copy-assessment-record';
import { STATE_COPY_ASSESSMENT_SETTINGS } from './state-copy-assessment-settings';
import { STATE_COPY_QUESTION_BANK } from './state-copy-question-bank';
import { STATE_COPY_FACULTY_SHARED } from './state-copy-faculty-shared';
import { STATE_COPY_STUDENT_ASSESSMENTS } from './state-copy-student-assessments';
import { STATE_COPY_ATTEMPT } from './state-copy-attempt';
import { STATE_COPY_RESULT } from './state-copy-result';
import { STATE_COPY_SUBMISSIONS } from './state-copy-submissions';
import { STATE_COPY_MARKING } from './state-copy-marking';
import { STATE_COPY_FACULTY_STUDENTS } from './state-copy-faculty-students';
import { STATE_COPY_QUESTION_TOOLS } from './state-copy-question-tools';
import { STATE_COPY_VENDOR_HOME } from './state-copy-vendor-home';
import { STATE_COPY_VENDOR_EDITOR } from './state-copy-vendor-editor';
import { STATE_COPY_VENDOR_RECORD } from './state-copy-vendor-record';
import { STATE_COPY_REVIEWER_LISTS } from './state-copy-reviewer-lists';
import { STATE_COPY_REVIEWER_REVIEW } from './state-copy-reviewer-review';
import { STATE_COPY_CM_LISTS } from './state-copy-cm-lists';
import { STATE_COPY_CM_DECISION } from './state-copy-cm-decision';
import { STATE_COPY_CM_CORRECTION } from './state-copy-cm-correction';
import { STATE_COPY_REVIEW_UPDATE } from './state-copy-review-update';
import { STATE_COPY_RELEASE } from './state-copy-release';
import { STATE_COPY_CONTENT_OVERSIGHT } from './state-copy-content-oversight';
import { STATE_COPY_STRUCTURE } from './state-copy-structure';
import { STATE_COPY_PLATFORM_ROLES } from './state-copy-platform-roles';
import { STATE_COPY_OPERATIONS_6 } from './state-copy-operations-6';

/**
 * `drawn` = on a board (cited); `provisional` = written to a board formula or chosen as an interim,
 * awaiting sign-off; `owner-approved` = words or a rule the owner decided (the decision is named).
 */
export type StateCopyStatus = 'drawn' | 'provisional' | 'owner-approved';

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
    | 'PU-07'
    | 'PU-08'
    | 'PU-09'
    | 'PU-10'
    | 'PU-12'
    | 'PU-13'
    | 'PU-14'
    | 'PU-15'
    | 'SA-01'
    | 'SA-02'
    | 'SA-03'
    | 'SA-06'
    | 'SA-07'
    | 'IA-01'
    | 'IA-02'
    | 'IA-03'
    | 'IA-04'
    | 'IA-05'
    | 'IA-06'
    | 'IA-07'
    | 'IA-08'
    | 'IA-09'
    | 'IA-10'
    | 'IA-11'
    | 'IA-13'
    | 'IA-14'
    | 'IA-15'
    | 'IA-16'
    | 'ST-01'
    | 'ST-02'
    | 'ST-03'
    | 'ST-04'
    | 'ST-05'
    | 'ST-19'
    // Phase 3.
    | 'ST-06'
    | 'ST-07'
    | 'ST-08'
    | 'ST-09'
    | 'ST-10'
    | 'ST-15'
    | 'ST-16'
    | 'ST-17'
    | 'ST-18'
    | 'IA-17'
    | 'IA-18'
    | 'IA-19'
    | 'IA-20'
    | 'SA-18'
    | 'SA-19'
    // Phase 4A.
    | 'FA-01'
    | 'FA-02'
    | 'FA-03'
    | 'FA-04'
    | 'FA-05'
    | 'FA-06'
    | 'FA-07'
    | 'FA-08'
    | 'FA-09'
    | 'FA-10'
    | 'FA-11'
    | 'FA-14'
    | 'FA-15'
    // Phase 4B (ST-13 is a focused page; the hub's Assessment tab words are ST-05's).
    | 'ST-11'
    | 'ST-12'
    | 'ST-13'
    | 'ST-14'
    | 'FA-12'
    | 'FA-16'
    | 'FA-17'
    | 'FA-18'
    | 'FA-19'
    | 'FA-20'
    | 'FA-21'
    | 'FA-22'
    // Phase 5.
    | 'VE-01'
    | 'VE-02'
    | 'VE-03'
    | 'VE-04'
    | 'VE-05'
    | 'VE-06'
    | 'VE-07'
    | 'VE-08'
    | 'VE-09'
    | 'VE-13'
    | 'RV-01'
    | 'RV-02'
    | 'RV-03'
    | 'RV-05'
    | 'RV-06'
    | 'CM-01'
    | 'CM-02'
    | 'CM-03'
    | 'CM-04'
    | 'CM-05'
    | 'CM-09'
    // Phase 6.
    | 'CM-06'
    | 'CM-07'
    | 'CM-08'
    | 'RV-04'
    | 'SA-10'
    | 'SA-11'
    | 'SA-12'
    | 'SA-13'
    | 'SA-14'
    | 'SA-15'
    | 'SA-16'
    | 'SA-17'
    | 'SA-20'
    | 'SA-21'
    | 'SA-22';
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

const PHASE_1_AND_EARLIER = {
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
    rule: '“<the page’s top-bar title> · XR Learning Platform”; “XR Learning Platform” alone while loading. The public not-found: “We can’t find that page · XR Learning Platform”. Where the current crumb names a record under its destination’s top-bar title (SA-07, Package 1D), it leads: “<record> · <title> · XR Learning Platform”.',
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
    rule: 'Both are rendered (their pages are built): “Back to experiments” opens the public catalogue `/experiments` (PU-04) and “Request institutional access” the request form `/request-access` (PU-08), as the XS link map sends them; P1-17 follows the hrefs.',
    basis:
      'XS-v6 LINK-MAP (“Back to experiments” → PU-04, “Request institutional access” → PU-08); B1-09 f0; owner P0-35 built-screen navigation, extended to Phase 1 (Package 1A authorisation)',
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
    rule: 'Only a built page’s address has words — its crumbs and title joined with “ › ” (“Updates › UPD-0005”); a record reference is shown only in the boards’ reference shape (UPD-0005), else the list alone; a Super Admin record never shows its reference (SA-v1 HANDOFF; owner decision 6), so it names the destination alone (“Requests”). Any other address: the sentence without a place.',
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
    words: 'Nothing has changed. Try again.',
    basis:
      'SA-v1 `sa-core.js` `SA.listState` “failed” (every Super Admin record and list; `copy/sa-shared.ts`, `SaRecordGuard`)',
    status: 'provisional',
    decisions: ['VD-12'],
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
    rule: 'The select shows its first option, Monthly, and that is the term sent: the command takes Monthly, Quarterly or Yearly only. “Different from the request” therefore always says “Term: Current term → Monthly”, so a smaller scope with only a reason passes “Change at least one thing” and records Monthly unless the Super Admin picks another term. The export draws no term select for more licences (“Access term: <term>. Additional licences follow the current term.”); the product keeps the select because the command requires a term.',
    basis:
      'SA-v1 `formHtml` (`r.termFixed` hint); the contract (`approveSmallerScopeInput.term`) requires one of the three',
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
    state: 'The Super Admin rail count with one request under review (screen readers)',
    words: null,
    rule: 'Read as “1 request under review”; more as “<n> requests under review” (nav-config `countWords`).',
    basis: "SA-v1 `sa-core.js` `navHtml` (`plural(n, 'request') + ' under review'`)",
    status: 'provisional',
    decisions: ['VD-12'],
  },

  'SA-03.same-name': {
    screen: 'SA-03',
    state:
      'A public request whose institution name is the same as an existing institution’s (letter case, spaces and dashes aside) while it has no institution yet: approving would create a second record',
    words: 'An institution with this name already exists',
    rule: 'In place of the decision controls, a warning with these words, then for each existing institution “<name> is already on the platform (Internal | External). This request can’t be decided until requests can be matched to an existing institution.” and a link “Open <name>” to its SA-07 page. “Existing access” shows the same sentence in place of “None. There is no institution record … yet.”. No Approve, smaller scope or Request more information is offered; both approvals answer policy-open SEL-05 and write nothing.',
    basis:
      'Owner decision DP-09 (interim duplicate-institution safeguard) and owner-approved provisional wording, 5 Nov 2026; audit P0-5; P1 register §A',
    status: 'provisional',
    decisions: ['DP-09', 'SEL-05', 'Q-A1'],
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
    rule: 'Yes when the request asked for new access, has been approved, and every plan the institution holds came from it: “Created <when>”, “Institution record created by this approval on <when>”, and the decided panel’s “Open institution”. Display only.',
    basis:
      'SA-v1 `V.decision` (`isNew`, `existing`, `doneHtml` “Open institution”); the decision page carries no creation fact of its own',
    status: 'provisional',
    decisions: ['VD-12'],
  },

  'SA-03.history-undrawn': {
    screen: 'SA-03',
    state: 'History events the export does not word for the Super Admin',
    words: null,
    rule: 'The requester’s B1-08 words: “BITS started reviewing”, “Payment started”, “Payment not completed”. An internal activation with no plan written (OD-B3-09) reads “No payment step (internal).”; no plan is named by its reference.',
    basis:
      'B1-08 / B1-13 request timelines; SA-v1 `V.decision` `hist` (submitted, approved, information requested, payment confirmed, activated)',
    status: 'provisional',
    decisions: ['VD-12', 'P1-11'],
  },

  'SA-03.decided-by-another': {
    screen: 'SA-03',
    state: 'A decision made by another Super Admin',
    words: null,
    rule: '“Decided on <when> by <name>, <route>” / “Sent on <when> by <name>” in place of “Decided by you on …” / “Sent by you on …”. The sample world holds one Super Admin.',
    basis:
      'SA-v1 `doneHtml` (`meta`: “Decided on … by Arjun Mehta” for a decision made before the page)',
    status: 'provisional',
    decisions: ['VD-12'],
  },

  'SA-03.next-undrawn': {
    screen: 'SA-03',
    state: 'The decided panel of a request whose payment was started but not confirmed, or failed',
    words: null,
    rule: 'No next line. A payment started but not confirmed shows the record, the request and “Payment: Not confirmed” only (the export’s `pend`); a failed payment keeps B1-08’s “Payment failed”.',
    basis: 'SA-v1 `doneHtml` (`stand` for `pend`; `next`)',
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
  'SA-03.moved-on': {
    screen: 'SA-03',
    state:
      'A decision refused because the request moved on (a stale revision; decided elsewhere; its institution paused) — or the panel ended by such a change while in use',
    words: null,
    rule: 'Nothing is written: the confirmation closes, the request is read again and the page shows its current state. No notice; focus goes to the decision panel’s heading. A decision keeps the request’s revision from when it began (the first change to the form, or the press that sends it or opens its confirmation) and a confirmation sends exactly what it names, so a change shown meanwhile is refused, never acted on. While the request is still open the decision being composed stays in the form, and the next attempt begins from the request as now shown. The export’s proposed notice (“This record changed after you opened it … Check it again”) is not used: the repo’s existing handling stands (HANDOFF open decision 8).',
    basis:
      'Appendix G P1-21 interim (“Refetch and render the current drawn state”); as SA-07.moved-on (Package 1D); SA-v1 HANDOFF “Use the existing conflict wording if the repo has one”',
    status: 'provisional',
    decisions: ['P1-21', 'SA-v1 open decision 8 (stale-decision copy)'],
  },

  'SA-03.internal-confirm-plan': {
    screen: 'SA-03',
    state: 'What the confirmation and the decided panel say about the access plan',
    words: null,
    rule: 'Only the first approval of a new institution’s request for new access creates a plan (“Institutional access is activated now and the access plan is created.”). Any other approval reaches the open policy (`planEffect` policy-open, OD-B3-09) and never claims the plan: internal, “This page does not change the current plan. Its term still shows as ending on <date>.”; external, “Payment is confirmed outside this page. Current access continues unchanged, and the plan isn’t changed from here.”; decided, the renewal’s “… The current plan isn’t changed from this page; its term still shows as ending on <date>.” or “Institutional access is active. The current plan isn’t changed from this page.” Decided on the page, the command’s own `planEffect` is read; otherwise the page’s facts (a plan activated by this request).',
    basis:
      'SA-v1 `SA.DLG.approveReq`, `doneHtml` (`next`); HANDOFF SA-03 “read `planEffect` … keep the copy that the plan is not changed here”; contract `decisionOutcome.planEffect`',
    status: 'provisional',
    decisions: ['P1-11', 'OD-B3-09'],
  },
  'SA-03.named-by-institution': {
    screen: 'SA-03',
    state: 'How the request is named on its page, in the tab and in links',
    words: null,
    rule: 'By its institution (“BITS Pilani — Hyderabad Campus”: the H1, the breadcrumb, the tab title under Requests, the confirmation’s question), never by its reference. Until the request has loaded the tab reads “Requests”.',
    basis:
      'SA-v1 `SA.resolve` (`title: SA.req(p[1]).inst`), `V.decision`; HANDOFF “Internal references never appear”',
    status: 'provisional',
    decisions: ['VD-12'],
  },

  // ---- Phase 1, Package 1B: the public surface (B1-01 … B1-05; TE-8) ----
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
    state: 'The course and format chips of each hero scene (the V1 landing, prompt 13)',
    words: null,
    rule: 'Each of the three scenes names the published experiment it is drawn for (Shell-and-Tube Heat Exchanger, Induction Motor Loading, Distillation Column — the frozen design’s picks): its course line and the four format chips, the ones it is not published in shown off. A scene whose experiment is not published shows its drawing without chips.',
    basis:
      '21 FROZEN 442–450 (annotation row) and 1604–1621 (`heroScenes`); owner decision D-14 (bound to the catalogue reads, defined fallbacks), 22 Oct 2026',
    status: 'provisional',
    decisions: ['P1-22'],
  },
  'PU-01.featured-tag': {
    screen: 'PU-01',
    state: 'The area badge on a featured experiment card',
    words: null,
    rule: 'The first word of the experiment’s area name (“Mechanical”, “Electrical”, “Chemical”), as the frozen design’s badges read; when the areas cannot be read the cards show without a badge. A featured pick that is not published is left out.',
    basis: '21 FROZEN 508, 1665 (`area`); the area record holds no short name',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'PU-01.sections-loading': {
    screen: 'PU-01',
    state: 'The explorer, the featured cards and the format counts while their reads load',
    words: null,
    rule: 'Every section shows its frozen shell and fixed words at once; the parts that are read (the area panels, the featured cards, the counts and chips) appear when their read answers, and each waiting part announces its wait once (“Loading engineering areas”, “Loading experiments”). Nothing is invented while it waits.',
    basis:
      'Owner decision D-14 (22 Oct 2026): the frozen shells, no invented data; B1-03 / B1-04 loading words',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'PU-01.sections-failed': {
    screen: 'PU-01',
    state: 'A landing read fails (the areas, the featured experiments or the catalogue counts)',
    words: null,
    rule: 'The section shows the failed block of its family inside its frozen shell: B1-03 “We couldn’t load the engineering areas” (with Try again and Browse experiments) in Explore by area, B1-04 “We couldn’t load the experiments” (with Try again) in Featured; the format cards keep their words and leave the count line out, and the hero’s scenes show no chips.',
    basis:
      'Owner decision D-14 (22 Oct 2026); B1-03 “All areas · failed + retry”; B1-04 “Failed + retry”',
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
  // ---- Phase 1, Package 1C: the public request (B1-06 … B1-08; DV-5 / O-05, TE-4) ----
  'PU-07.loading': {
    screen: 'PU-07',
    state: 'Your selection while the catalogue names of its experiments are read',
    words: 'Loading your selection',
    basis: 'Board 04 "State grammar" Loading (announced politely); B1-06 draws no loading state',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'PU-07.failed': {
    screen: 'PU-07',
    state: 'Your selection when the catalogue names cannot be read',
    words: 'We couldn’t load your selection',
    rule: 'With B1-04’s failed line and “Try again”; the selection itself is the browser session’s and is kept.',
    basis: 'B1-04 "Failed + retry" formula; B1-06 draws no failed state',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'PU-07.unnamed-experiment': {
    screen: 'PU-07',
    state:
      'A selected experiment the published catalogue no longer names (unpublished since it was added, or a stored selection from elsewhere)',
    words: null,
    rule: 'The row shows the experiment’s reference in place of its title, no formats to change, and Remove — as SA-02 names an unnamed experiment (`SA-02.unnamed-experiment`). Sending the request with it is refused by the service.',
    basis:
      'B1-06 rows name published experiments only (“Only the experiment’s published formats can be chosen”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'PU-07.request-in-progress': {
    screen: 'PU-07',
    state:
      'Your selection, in a browser that holds the ticket of a request still in progress (Submitted, Under review, Information requested, Approved — payment required, Payment not confirmed, Payment failed)',
    words: 'You have a request in progress',
    rule: 'A quiet note above the selection, one per request, newest first: “You have a request in progress for <institution>.” with the link “Check request status” (PU-09’s words) to that request’s status page. The request is named by its institution only — no reference, address or ticket in the words. The service lists only the requests whose ticket this browser holds for the visitor; nothing once access is active, for a person signed in, or in another browser.',
    basis:
      'Owner decision 24 Oct 2026 (P0 fix “external payment request recovery”; audit CB-1 / F-01; ADR-0009 amendment): the line and its link; the v46 quiet notice (B1-06 `div.xr-notice--quiet`, B1-08 PU-12 note) and B1-07’s “Check request status”',
    status: 'owner-approved',
    decisions: ['O-05', 'F-01'],
  },
  'PU-08.edit-label': {
    screen: 'PU-08',
    state: 'The names of the review step’s Edit buttons',
    words: null,
    rule: '“Edit <row label, lower case>” (“Edit contact person”), keeping the acronym: “Edit message to BITS”. The board’s script lowercases the whole label (“Edit message to bits”).',
    basis: "B1-07 `editLabel: 'Edit ' + r.k.toLowerCase()`",
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'PU-08.until-date': {
    screen: 'PU-08',
    state: 'The review step’s access term for “Until a fixed date”',
    words: null,
    rule: '“Until 30 Jun 2027” — the date in words, as B1-08 f9 draws the same term; B1-07’s script shows the date field’s raw value.',
    basis: 'B1-07 `termText`; B1-08 f9 “Until 30 Jun 2027”; B8-03 dates in words',
    status: 'provisional',
    decisions: ['VD-12', 'P1-10'],
  },
  'PU-08.empty-selection': {
    screen: 'PU-08',
    state: 'A direct visit to the request form with nothing selected',
    words: null,
    rule: 'Replaced by Your selection (`/selection`), whose empty state points to the catalogue; no form is shown (an empty selection never offers “Continue to request”).',
    basis:
      'Appendix A §3.7 guard “/request-access with empty selection → /selection”; Appendix G P1-03 (PROVISIONAL)',
    status: 'provisional',
    decisions: ['P1-03', 'O-08'],
  },
  'PU-08.step-fallback': {
    screen: 'PU-08',
    state: 'The review step’s address reached with details still missing (a deep link, a reload)',
    words: null,
    rule: 'The address is replaced by the details step (`?step=details`), with what was typed in this tab (S4: a step URL with missing earlier data falls back to the first incomplete step).',
    basis: 'ADR-0005 §4 S4; Appendix D §6.5',
    status: 'provisional',
    decisions: ['VD-12', 'P1-20'],
  },
  'PU-08.draft': {
    screen: 'PU-08',
    state: 'What the visitor typed, between the details and review steps, Back and Forward',
    words: null,
    rule: 'Kept in this tab’s memory until the request is sent or the person signed in changes; never written to the browser’s storage. No prompt on leaving (none is drawn).',
    basis:
      'Appendix D §6.5 “values come back from the per-tab draft store”; Appendix G P1-20 interim; owner (14 Oct 2026): browser-session storage is kept to the approved selection and ticket mechanism',
    status: 'provisional',
    decisions: ['P1-20'],
  },
  'PU-08.selection-refused': {
    screen: 'PU-08',
    state:
      'Submit refused because of the selection itself (a chosen format no longer published, or nothing left to send since the form opened)',
    words: null,
    rule: 'Nothing is sent; the visitor is taken back to Your selection, which shows the selection as it is now. No words of their own are drawn.',
    basis:
      'B1-07 draws no such state; the service refuses it (`selection-empty`, `PU-08.selection.format-not-published`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'PU-09.cold-visit': {
    screen: 'PU-09',
    state:
      '“Request sent” reached without a request just sent in this tab (a typed address, a reload)',
    words: null,
    rule: 'Replaced by Your selection (`/selection`). The page never looks a request up: the reference is not a key (B1-07).',
    basis:
      'Appendix A PU-09 guard and §3.7 “cold /request-access/sent → /selection”; Appendix G P1-03 (PROVISIONAL)',
    status: 'provisional',
    decisions: ['P1-03', 'O-08'],
  },
  'PU-10.loading': {
    screen: 'PU-10',
    state: 'The request status while it is read',
    words: 'Loading the request status',
    basis: 'Board 04 "State grammar" Loading; B1-08 draws no loading state',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'PU-10.failed': {
    screen: 'PU-10',
    state: 'The request status cannot be read just now',
    words: 'We couldn’t load the request status',
    rule: 'With B1-04’s failed line and “Try again”.',
    basis: 'B1-04 "Failed + retry" formula; B1-08 draws no failed state',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'PU-10.not-found': {
    screen: 'PU-10',
    state:
      'An address that names no request, or a request whose ticket this browser session does not hold and the signed-in person may not open (another browser or device, a cold visit to a request not sent here, another role or institution)',
    words: null,
    rule: 'The public not-found page (PU-15, public variant): nothing of the request is read or shown, and the page cannot tell an unknown address from one it may not open. Also for the payment step.',
    basis:
      'B1-08 “Who can open this page”; owner decision DV-5 / O-05 (14 Oct 2026): “Unauthorized access must return the approved not-found treatment without exposing request details”; Appendix A §3.7 guard row',
    status: 'provisional',
    decisions: ['T-01', 'R01', 'O-05'],
  },
  'PU-10.same-browser': {
    screen: 'PU-10',
    state:
      'The requester comes back to the status page in a local prototype build: a reload, navigating away and back, the tab closed and the site opened again in the same browser',
    words: null,
    rule: 'The same request opens again, with its next step (Continue to payment, Check again, Try payment again): the requester’s own ticket is kept in this browser beside the saved world, bound to that world, and Your selection says “You have a request in progress”. Only this browser: another browser or device — or this one after a reset, or after a save the build cannot read — shows the public not-found page (`PU-10.not-found`); coming back from anywhere needs a requester identity that is not built (production needs real accounts, T-01 / R01). A request sent while signed in stays with that sign-in, which ends with the page. No words are added to the page.',
    basis:
      'Owner decision 24 Oct 2026 (P0 fix “external payment request recovery”; audit CB-1 / F-01; ADR-0009 amendment): “recovery reaches the same browser”; “Another browser or device cannot recover (production needs real accounts)”',
    status: 'owner-approved',
    decisions: ['O-05', 'F-01', 'T-01', 'R01'],
  },
  'PU-10.times': {
    screen: 'PU-10',
    state: 'The times on the status page (“Updated …”, history)',
    words: null,
    rule: 'Every event with its date and time (“5 Oct 2026, 09:12”). B1-08 draws the review start and the information request with a date only, where B1-11 and B3-08 draw the same events with their time.',
    basis: 'B1-08 f2, f3 against B1-11 (“6 Oct 2026, 09:12”) and B3-08 (“5 Oct 2026, 15:20”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'PU-10.history-undrawn': {
    screen: 'PU-10',
    state: 'History lines B1-08 does not word for its requester',
    words: null,
    rule: 'A payment start is shown while it waits (f6); once the provider answers, the outcome stands in its place (f7, f8). A request sent by an Institute Admin names them as its contact person. The deciding Super Admin is never named — BITS decides.',
    basis: 'B1-08 f6 … f9; matrix INST-15 / REQ-28 (“BITS” as the actor for other readers)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'PU-10.history-approved-with-changes-internal': {
    screen: 'PU-10',
    state: 'The history line of an internal approval with a smaller scope',
    words: 'Approved with changes',
    basis:
      'B1-08 draws “Approved” (internal, f9) and “Approved with changes — payment needed” (external, f4) only',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'PU-10.history-no-plan-internal': {
    screen: 'PU-10',
    state:
      'The “Access active” line of an internal renewal or more-licences request, which writes no plan while OD-B3-09 is open',
    words: 'No payment step.',
    basis:
      'B1-08 f9 “Access plan ACC-0098. No payment step.” (a new institution’s plan); OD-B3-09 / P1-11',
    status: 'provisional',
    decisions: ['OD-B3-09', 'P1-11'],
  },
  'PU-10.check-again': {
    screen: 'PU-10',
    state: '“Payment not confirmed” — Check again',
    words: null,
    rule: 'Reads the status again. The status panel (`role="status"`) announces a change; with none, the page stays as it is and nothing new is said (no “pay again”, REQ-08).',
    basis: 'B1-08 f6 “Returned from payment; confirmation pending. No “pay again”.”',
    status: 'provisional',
    decisions: ['VD-12', 'R06'],
  },
  'PU-13.no-plan': {
    screen: 'PU-13',
    state:
      'Access active for a request that wrote no plan (a renewal or more licences of an existing institution: OD-B3-09 open)',
    words: null,
    rule: 'B1-08 f8’s words without the “Access plan” line; the history’s “Access active” line has no plan note.',
    basis:
      'B1-08 f8, f9 draw a new institution’s plan only; P1-11 interim (plan effect `policy-open`)',
    status: 'provisional',
    decisions: ['OD-B3-09', 'P1-11'],
  },
  'PU-12.loading': {
    screen: 'PU-12',
    state: 'The payment step while the request is read',
    words: 'Loading the payment step',
    basis: 'Board 04 "State grammar" Loading; B1-08 draws no loading state',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'PU-12.not-payable': {
    screen: 'PU-12',
    state:
      'The payment step of a request that has no payment step now (internal, not yet approved, payment pending or confirmed)',
    words: null,
    rule: 'Replaced by the request status (`/requests/[requestId]`), which says where the request stands.',
    basis:
      'Appendix A §3.7 “/requests/[requestId]/payment for internal or non-payable state → redirect”; matrix REQ-09',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'PU-12.stand-in': {
    screen: 'PU-12',
    state: '“Continue to payment” in a local prototype build',
    words: null,
    rule: 'TE-4: the sample payment provider stand-in answers the payment just started; the request status then shows the outcome (confirmed → Access active). No provider, amount, method or details exist, nothing is collected, and no person confirms a payment. “Payment not confirmed” and “Payment failed” are reached only through fixtures and CI test hooks.',
    basis:
      'Owner TE-4 authorisation (Package 1C, 14 Oct 2026); B1-08 f5 notice; Appendix G P1-06, P1-18',
    status: 'provisional',
    decisions: ['TE-4', 'T-05', 'R06'],
  },
  'PU-12.busy': {
    screen: 'PU-12',
    state: 'Continue to payment while the payment is started',
    words: 'Starting the payment…',
    rule: 'The button busy (grey, spinner) with these words and a polite “Starting the payment”; it cannot be pressed twice.',
    basis:
      'B1-07 f6 busy formula (“Sending request…” / “Sending your request”); DEV-01 grey busy look',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'PU-12.busy-status': {
    screen: 'PU-12',
    state: 'The polite announcement while the payment is started',
    words: 'Starting the payment',
    basis: 'B1-07 f6 `span.xr-sr role="status"` formula',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'PU-12.failed': {
    screen: 'PU-12',
    state: 'Continue to payment could not reach the service',
    words: 'We couldn’t continue to payment',
    basis: 'B1-07 f7 failed formula (“We couldn’t send your request”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'PU-12.failed-line': {
    screen: 'PU-12',
    state: 'The failed notice’s sentence',
    words: 'Nothing has changed. Try again.',
    basis: 'B1-07 f7 “Nothing was sent. Your details are still here — try again.”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  // ---- Package 1D: SA-01 Overview (B7-01; completed in Phase 6 — its groups are state-copy-content-oversight), SA-06, SA-07 (B7-02, B7-03) ----
  'SA-01.failed': {
    screen: 'SA-01',
    state: 'The overview failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load what is waiting',
    basis: "SA-v1 `V.overview` failed (`SA.listState('failed', { failed: … })`)",
    status: 'provisional',
    decisions: ['VD-12'],
  },

  'SA-01.failed.line': {
    screen: 'SA-01',
    state: 'The failed state’s next step',
    words: 'Nothing has changed. Try again.',
    basis: 'SA-v1 `sa-core.js` `SA.listState` “failed” (`copy/sa-shared.ts`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },

  'SA-06.order': {
    screen: 'SA-06',
    state: 'The order of the institutions',
    words: null,
    rule: 'By name, as SA-v1 draws the list (its caption “Institutions, by name”, read by screen readers): the screen sorts the service’s rows (contract PC-36, created last first) by name. No sort control is drawn.',
    basis:
      'SA-v1 `sa-views-b.js` `V.institutions` (`localeCompare` by name; `caption` “Institutions, by name”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-06.none': {
    screen: 'SA-06',
    state: 'No institution exists yet',
    words: 'No institutions yet',
    rule: '“No institutions yet” · “An institution appears here when you approve its first request.” in the list surface (the kit’s empty state, not a live region); the toolbar is not drawn; the foot line stays. Not reachable on the sample world.',
    basis: 'SA-v1 `sa-views-b.js` `V.institutions` list state “empty” (`SA.listState`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-06.loading': {
    screen: 'SA-06',
    state: 'The institutions loading (announced; skeleton rows in the surface)',
    words: 'Loading institutions…',
    rule: 'The head, the toolbar (its status options without figures until they are read) and the foot line stay; the count line waits for the reads.',
    basis: 'SA-v1 `sa-views-b.js` `V.institutions` list state “loading” (`SA.listState`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-06.failed': {
    screen: 'SA-06',
    state: 'The institutions failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load the institutions',
    basis: 'SA-v1 `sa-views-b.js` `V.institutions` list state “failed” (`SA.listState`, Try again)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-06.failed.line': {
    screen: 'SA-06',
    state: 'The failed state’s next step',
    words: 'Nothing has changed. Try again.',
    basis:
      'SA-v1 `sa-core.js` `SA.listState` “failed” (every Super Admin list; `copy/sa-shared.ts`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-06.filters': {
    screen: 'SA-06',
    state: 'The search and the status filter',
    words: null,
    rule: 'Search (“Institution or Institute Admin”; the service also matches a plan’s reference) and Status, whose options carry each status’s figure without the search (“All statuses (7)”, “Access active (4)”, …, “Access ended (1)”, “No Institute Admin (1)”): each is the service’s `listInstitutions` tab — “Access active” holds the institutions ending soon too, as the service answers, where the export counts active ones only. The count line reads “7 institutions”, or “1 of 7 institutions” while a filter applies; each applied filter is a chip (“Search: “…””, “Status: …”) with “Clear filters”, which, like the no-match state’s, goes back to every institution with focus in Search.',
    basis:
      'SA-v1 `sa-views-b.js` `V.institutions` (`FILTERS`, chips, `inChip`, `inClear`); contract `INSTITUTION_TABS`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-06.plan-cell': {
    screen: 'SA-06',
    state: 'The “Access plan” cell of an institution with several plans',
    words: null,
    rule: '“<n> courses · <n> experiments · <n> plans”: each plan’s courses and experiments as the service counts them (`institutionRow.plans`), added up — an experiment in two plans counts twice (the row carries no distinct count). One plan: “1 course · 1 experiment”; before the payment: “No access plan yet · 1 experiment requested”. No plan reference is shown.',
    basis:
      'SA-v1 `sa-views-b.js` `V.institutions` (`courses`, `expCount`, `plans`); HANDOFF “Internal references”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-06.admin-cell': {
    screen: 'SA-06',
    state: 'The “Institute Admin” cell without an Institute Admin',
    words: null,
    rule: 'Access active, ending soon or paused: the “Needs one” tag; awaiting payment: “Assigned once access is active”; access ended (undrawn): “Not assigned”.',
    basis: 'SA-v1 `sa-views-b.js` `V.institutions` (`noIA`, `rk-tag-warn`, `rk-small`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-06.decision-ids': {
    screen: 'SA-06',
    state: 'The page’s line on how institutions are created',
    words: null,
    rule: 'The V3 page shows SA-v1’s foot line “Institutions are created only by approving a request. A plan can’t be amended here; changes come through a new request.”, which carries no decision id; `copy/institutions.ts` `STRIPPED` keeps B7-02’s wording and its id for traceability.',
    basis:
      'SA-v1 `sa-views-b.js` `V.institutions` (`rk-ca-foot`); B7-02 f0 … f6; owner decision P1-14 / VD-10',
    status: 'owner-approved',
    decisions: ['P1-14', 'VD-10'],
  },
  'SA-07.decision-ids': {
    screen: 'SA-07',
    state: 'The SA-07 sentences B7-03 wrote with decision ids',
    words: null,
    rule: 'The V3 page shows SA-v1’s sentences, which carry no decision id (the licence line “How licences are counted is still open.”, the footnote “A plan can’t be amended here; …”, the activity note, the Assign dialog’s line and flash); `copy/institutions.ts` `STRIPPED` keeps each B7-03 wording and its ids for traceability.',
    basis:
      'SA-v1 `sa-views-b.js` `V.institution`, `SA.DLG.assignIA`; B7-03; owner decision P1-14 / VD-10',
    status: 'owner-approved',
    decisions: ['P1-14', 'VD-10'],
  },
  'SA-07.loading': {
    screen: 'SA-07',
    state: 'The institution loading (announced; skeleton rows in its place)',
    words: 'Loading the institution',
    basis:
      'The Super Admin record guard’s loading line over the kit’s skeleton rows (`SaRecordGuard`); the export draws no record loading state',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-07.failed': {
    screen: 'SA-07',
    state: 'The institution failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load this institution',
    basis: 'SA-v1 `sa-core.js` `SA.listState` “failed” formula (`SaRecordGuard`, Try again)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-07.failed.line': {
    screen: 'SA-07',
    state: 'The failed state’s next step',
    words: 'Nothing has changed. Try again.',
    basis:
      'SA-v1 `sa-core.js` `SA.listState` “failed” (`copy/sa-shared.ts`, shown by `SaRecordGuard`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-07.not-found': {
    screen: 'SA-07',
    state: 'An address that names no institution (or one the service will not show)',
    words: null,
    rule: 'The GL-04 message in place of the page — “This page isn’t available” with Back to Overview and Help & support (`SaUnavailable`); the tab reads “Not available”. Existence is not revealed.',
    basis:
      'SA-v1 `sa-core.js` `SA.resolve` `nf`; HANDOFF “Unknown records use the GL-04 message template”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-07.attention-request': {
    screen: 'SA-07',
    state: '“Also waiting for this institution”: its requests',
    words: null,
    rule: 'Every request the institution’s record names that is under review, newest first, by content: “<type> request under review” (“Additional licences request under review”, “Renewal request under review”) with “Open request” → its decision (SA-03). A request waiting for a payment is not waiting on the Super Admin (payment is not recorded here); awaiting payment, the approved request opens from the Access group and the “Access plan” section. With nothing waiting: “Nothing else needs you here.” No reference is shown.',
    basis:
      'SA-v1 `sa-views-b.js` `V.institution` (`att`, `sa-attn`); the institution record’s own history names its requests; HANDOFF “Internal references”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-07.attention-later': {
    screen: 'SA-07',
    state: '“Also waiting for this institution”: device transfers; the access ending',
    words: null,
    rule: 'Each device transfer of the institution forwarded to BITS and not yet approved follows its requests, newest first — “<format> device transfer for <student>” (the student named from the institution’s people; “<format> device transfer” when not listed) with “Review transfer” → its decision (SA-19). A transfer still with the institution or approved is not listed. The access ending is drawn on its plan band (state-copy `SA-07.attention-access-ending`); a missing Institute Admin and the pause in the panel’s own groups.',
    basis:
      'SA-v1 `sa-views-b.js` `V.institution` (`att`); OperationsService `listDeviceTransfers({ state: forwarded })`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-07.history': {
    screen: 'SA-07',
    state: 'The History section',
    words: null,
    rule: 'The institution record’s own events, newest first, each with the time it was recorded, by content: “Request approved, payment required” (external) / “Request approved” (internal), note “External.” / “Internal.”; “Institutional access activated”, note “Payment confirmed.” / “Internal, no payment step.”; “Institute Admin assigned: <name>” (note: work e-mail · who assigned); “Access paused by <name>” / “Access restored by <name>” (note: the reason); “Request for additional licences received” / “Renewal request received” (note: who sent them, when an Institute Admin did); “Access ended”; “Student status changed”. No reference is shown. A request’s receipt before the record existed and a student’s status change are kept in the request’s and the student’s own histories; the sample world writes no event when a plan ends.',
    basis:
      'SA-v1 `sa-views-b.js` `V.institution` (`SA.timeline`), its flashes and dialogs; Appendix C M01 events',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-07.sample-labels': {
    screen: 'SA-07',
    state: 'The export’s sample labels',
    words: null,
    rule: 'No sample label is shown — “Sample figures up to <day>” in Activity by format’s head, “Student names are sample data for …” under People, and “Their names aren’t part of this sample.” (an institution without a list of names shows its counts, state-copy `SA-07.people-without-list`).',
    basis:
      'SA-v1 `sa-views-b.js` `V.institution`; START-HERE Known exception 4 (sample-data labels are not product features); Appendix E §10 item 5; T-36',
    status: 'owner-approved',
    decisions: ['START-HERE Known exception 4', 'Appendix E §10 item 5', 'T-36'],
  },
  'SA-07.plan-status': {
    screen: 'SA-07',
    state: 'A plan’s status in its band, and its note',
    words: null,
    rule: 'Read from the services: Ended (“Ended <n> days ago”, “This plan ended on <day>” — ended access comes back only through a renewal request) or Ending soon (“<n> days left”, the gold remainder; “Ends on <day>” with its renewal under review — “Open renewal request” — or approved — “View renewal” —, else “Reminder due. Nothing is sent from here.” with “View access ending”, prefixed “Not covered by the renewal request.” while another renewal is open) as Operations › Access ending lists the plan; else Paused while the institution is (“Paused · <n> days left”, the striped track, “Read-only while access is paused”); else Active. An ended plan stays ended while paused.',
    basis:
      'SA-v1 `sa-views-b.js` `planBand`, `term`; OperationsService `listAccessEnding` (`daysLeft`, `endedDaysAgo`, `standing`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-07.term-clock': {
    screen: 'SA-07',
    state: 'The days left in a plan not listed in Access ending, and the term passed',
    words: null,
    rule: 'Today on the sample clock is the session’s sign-in day in Indian time (as SA-01.today): a plan more than 15 days from its end shows the whole calendar days from today to its end date; the track’s fill and today’s marker show the share of the term passed. Days for a plan ending or ended are the service’s.',
    basis:
      'SA-v1 `sa-views-b.js` `term` (`SA.days`); state-copy `SA-01.today`; the screens have no clock of their own',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-07.people-singular': {
    screen: 'SA-07',
    state: 'An institution with one student',
    words: null,
    rule: '“1 student · 3 Faculty” (the export draws the plural only).',
    basis: 'SA-v1 `sa-views-b.js` `V.institution` (“12 students · 3 Faculty”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-07.people-without-list': {
    screen: 'SA-07',
    state: 'People counted but not listed by name',
    words: null,
    rule: '“<n> students and <n> Faculty.” (the export’s line without its sample sentence); nobody at all: “Nobody has been added yet. The Institute Admin adds students and Faculty.”',
    basis: 'SA-v1 `sa-views-b.js` `V.institution` (People without names)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-07.term-until': {
    screen: 'SA-07',
    state: 'A plan whose term runs until a fixed date (B1-07)',
    words: 'Until a fixed date',
    basis:
      'B1-07 term option “Until a fixed date”; SA-v1 terms “Monthly term” · “Quarterly term” · “Yearly term” (the label is the option alone)',
    status: 'provisional',
    decisions: ['P1-10'],
  },
  'SA-07.moved-on': {
    screen: 'SA-07',
    state:
      'Assign, Pause, Restore or a status change refused because the record moved on (a stale revision; paused, restored or assigned elsewhere; a status that no longer allows it)',
    words: null,
    rule: 'Nothing is written: the dialog or the inline form closes, the institution is read again and the page shows its current drawn state. No notice (the export’s proposed “This record changed after you opened it” is not used); focus goes to the page title (after a status change, to its student’s “Change status”). A dialog or form keeps the revision — and a status change its direction — from when it opened, so a change shown meanwhile is refused, never acted on.',
    basis:
      'Appendix G P1-21 interim (“Refetch and render the current drawn state”); as SA-03; SA-v1 HANDOFF (stale refusal copy: use the existing conflict rule)',
    status: 'provisional',
    decisions: ['P1-21'],
  },
  'SA-07.unavailable': {
    screen: 'SA-07',
    state: 'A command failed for now (service unavailable; a test fault plan only)',
    words: null,
    rule: 'Nothing changes: the dialog or the inline panel stays open with what was typed and can be confirmed again; no message.',
    basis:
      'B7-03 draws no failure for its commands; Appendix F §6.6 “command unavailable → nothing changes … answers kept” (as SA-03.unavailable)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;

/**
 * Package 2A (Phase 2) keeps each screen group's entries in its own file beside this one: the
 * Institute Admin's home and content (IA-01 … IA-03), Student access (IA-04, IA-05), People (IA-06,
 * IA-07, IA-08, IA-10) and the Student's screens (ST-01, ST-02, ST-03, ST-05, ST-19). Package 2B
 * adds Groups (IA-13, IA-14), Faculty (IA-09, IA-15), Import students (IA-11) and the rest (IA-16,
 * ST-04, the identity safeguard).
 */
export const STATE_COPY = {
  ...PHASE_1_AND_EARLIER,
  ...STATE_COPY_INSTITUTE_HOME,
  ...STATE_COPY_STUDENT_ACCESS,
  ...STATE_COPY_PEOPLE,
  ...STATE_COPY_STUDENT,
  ...STATE_COPY_GROUPS,
  ...STATE_COPY_FACULTY,
  ...STATE_COPY_IMPORT,
  ...STATE_COPY_PACKAGE_2B,
  // Phase 3: one file per screen group.
  ...STATE_COPY_LEARNING_HUB,
  ...STATE_COPY_FORMATS,
  ...STATE_COPY_PROGRESS_FEEDBACK,
  ...STATE_COPY_DEVICE,
  ...STATE_COPY_INSTITUTE_REQUESTS,
  ...STATE_COPY_USAGE,
  ...STATE_COPY_OPERATIONS,
  // Phase 4A: one file per screen group, and the Faculty pages' shared parts.
  ...STATE_COPY_FACULTY_OVERVIEW,
  ...STATE_COPY_FACULTY_COURSES,
  ...STATE_COPY_FACULTY_EXPERIMENT,
  ...STATE_COPY_ASSESSMENTS,
  ...STATE_COPY_ASSESSMENT_RECORD,
  ...STATE_COPY_ASSESSMENT_SETTINGS,
  ...STATE_COPY_QUESTION_BANK,
  ...STATE_COPY_FACULTY_SHARED,
  // Phase 4B: one file per screen group.
  ...STATE_COPY_STUDENT_ASSESSMENTS,
  ...STATE_COPY_ATTEMPT,
  ...STATE_COPY_RESULT,
  ...STATE_COPY_SUBMISSIONS,
  ...STATE_COPY_MARKING,
  ...STATE_COPY_FACULTY_STUDENTS,
  ...STATE_COPY_QUESTION_TOOLS,
  // Phase 5: one file per screen group.
  ...STATE_COPY_VENDOR_HOME,
  ...STATE_COPY_VENDOR_EDITOR,
  ...STATE_COPY_VENDOR_RECORD,
  ...STATE_COPY_REVIEWER_LISTS,
  ...STATE_COPY_REVIEWER_REVIEW,
  ...STATE_COPY_CM_LISTS,
  ...STATE_COPY_CM_DECISION,
  // Phase 6: one file per screen group.
  ...STATE_COPY_CM_CORRECTION,
  ...STATE_COPY_REVIEW_UPDATE,
  ...STATE_COPY_RELEASE,
  ...STATE_COPY_CONTENT_OVERSIGHT,
  ...STATE_COPY_STRUCTURE,
  ...STATE_COPY_PLATFORM_ROLES,
  ...STATE_COPY_OPERATIONS_6,
} as const satisfies Readonly<Record<string, StateCopyEntry>>;

export type StateCopyId = keyof typeof STATE_COPY;

type WordsId = {
  readonly [Id in StateCopyId]: (typeof STATE_COPY)[Id]['words'] extends string ? Id : never;
}[StateCopyId];

/** The words of a register entry that has words. */
export function stateWords(id: WordsId): string {
  return STATE_COPY[id].words;
}
