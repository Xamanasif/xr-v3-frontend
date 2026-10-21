/**
 * The link-target ledger (ADR-0005 §8; Appendix F §3.3 "Unbuilt destinations", WP-0.13 acceptance
 * 9; register P0-35): every action drawn on the built screens (Phase 0, then Phase-1 Package 1A:
 * XS-01, SA-02, SA-03; Package 1B: the public shell and PU-01 … PU-06 with PU-14; Package 1C: PU-07,
 * PU-08, PU-09, PU-10 with PU-13, PU-12; Package 1D: SA-01, SA-06, SA-07; Phase 2, Packages 2A and
 * 2B: the Institute Admin's and the Student's 21 screens), where it goes, and what that address
 * shows. Its tests prove that every link reaches a built page — the one
 * Phase-0 dead link (PU-15 → PU-04) is gone since Package 1B — and that no primary action resolves
 * to the page it is on; the browser
 * suite follows each link for real and checks that no document load (which would rebuild the
 * sample world, ADR-0004) happens on the way.
 *
 * Targets are written per workspace: `<base>` is the workspace the page is in (for XS-06, the
 * person's OWN base — the address on show belongs to another workspace), `{id}` a report's
 * reference.
 */

import { IA_ACCESS_LINK_TARGETS } from './link-targets-ia/access';
import { IA_PEOPLE_LINK_TARGETS } from './link-targets-ia/people';
import { IA_PLAN_LINK_TARGETS } from './link-targets-ia/plan';
import { P3_DEVICE_LINK_TARGETS } from './link-targets-p3/device';
import { P3_FORMATS_LINK_TARGETS } from './link-targets-p3/formats';
import { P3_HUB_LINK_TARGETS } from './link-targets-p3/hub';
import { P3_INSTITUTE_REQUESTS_LINK_TARGETS } from './link-targets-p3/institute-requests';
import { P3_OPERATIONS_LINK_TARGETS } from './link-targets-p3/operations';
import { P3_PROGRESS_FEEDBACK_LINK_TARGETS } from './link-targets-p3/progress-feedback';
import { P3_USAGE_LINK_TARGETS } from './link-targets-p3/usage';
import { P4_FACULTY_OVERVIEW_LINK_TARGETS } from './link-targets-p4/overview';
import { P4_FACULTY_COURSES_LINK_TARGETS } from './link-targets-p4/courses';
import { P4_FACULTY_EXPERIMENT_LINK_TARGETS } from './link-targets-p4/experiment';
import { P4_ASSESSMENTS_LINK_TARGETS } from './link-targets-p4/assessments';
import { P4_ASSESSMENT_RECORD_LINK_TARGETS } from './link-targets-p4/assessment-record';
import { P4_ASSESSMENT_SETTINGS_LINK_TARGETS } from './link-targets-p4/assessment-settings';
import { P4_QUESTION_BANK_LINK_TARGETS } from './link-targets-p4/question-bank';
import { P4_FACULTY_SHELL_LINK_TARGETS } from './link-targets-p4/shell';
import { P4B_STUDENT_ASSESSMENTS_LINK_TARGETS } from './link-targets-p4b/student-assessments';
import { P4B_ATTEMPT_LINK_TARGETS } from './link-targets-p4b/attempt';
import { P4B_RESULT_LINK_TARGETS } from './link-targets-p4b/result';
import { P4B_SUBMISSIONS_LINK_TARGETS } from './link-targets-p4b/submissions';
import { P4B_MARKING_LINK_TARGETS } from './link-targets-p4b/marking';
import { P4B_FACULTY_STUDENTS_LINK_TARGETS } from './link-targets-p4b/faculty-students';
import { P4B_QUESTION_TOOLS_LINK_TARGETS } from './link-targets-p4b/question-tools';
import { P5_VENDOR_HOME_LINK_TARGETS } from './link-targets-p5/vendor-home';
import { P5_VENDOR_EDITOR_LINK_TARGETS } from './link-targets-p5/vendor-editor';
import { P5_VENDOR_RECORD_LINK_TARGETS } from './link-targets-p5/vendor-record';
import { P5_REVIEWER_LISTS_LINK_TARGETS } from './link-targets-p5/reviewer-lists';
import { P5_REVIEWER_REVIEW_LINK_TARGETS } from './link-targets-p5/reviewer-review';
import { P5_CM_LISTS_LINK_TARGETS } from './link-targets-p5/cm-lists';
import { P5_CM_DECISION_LINK_TARGETS } from './link-targets-p5/cm-decision';
import { P6_CM_CORRECTION_LINK_TARGETS } from './link-targets-p6/cm-correction';
import { P6_REVIEW_UPDATE_LINK_TARGETS } from './link-targets-p6/review-update';
import { P6_RELEASE_LINK_TARGETS } from './link-targets-p6/release';
import { P6_CONTENT_OVERSIGHT_LINK_TARGETS } from './link-targets-p6/content-oversight';
import { P6_STRUCTURE_LINK_TARGETS } from './link-targets-p6/structure';
import { P6_PLATFORM_ROLES_LINK_TARGETS } from './link-targets-p6/platform-roles';
import { P6_OPERATIONS_6_LINK_TARGETS } from './link-targets-p6/operations-6';
import { ST_HOME_LINK_TARGETS } from './link-targets-st/home';
import { ST_HUB_LINK_TARGETS } from './link-targets-st/hub';

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
  | 'PU-07'
  | 'PU-08'
  | 'PU-09'
  | 'PU-10'
  | 'PU-12'
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
  // Phase 4B.
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
    note: 'The built-screen manifest renders only built destinations (XS-07; the Super Admin’s Overview, Requests and Institutions; Package 2A: the Institute Admin’s Overview, Content access, Student access and People, the Student’s Home and My courses); the rest appear with their phase.',
  },
  {
    screen: 'Shell',
    where: 'Sidebar destination (Super Admin only)',
    action: 'Overview',
    role: 'secondary',
    on: '/admin/*',
    target: '/admin',
    outcome: 'built',
    board: '06 (Super Admin raw[]); B7-01 f0 (`aria-current="page"`)',
    note: 'SA-01 Overview: built with its Requests group in Package 1D, completed in Phase 6.',
  },
  {
    screen: 'Shell',
    where: 'Sidebar destination (Super Admin only)',
    action: 'Institutions',
    role: 'secondary',
    on: '/admin/*',
    target: '/admin/institutions',
    outcome: 'built',
    board: '06 (Super Admin raw[]); B7-02 f0, B7-03 f0 (`aria-current="page"`)',
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
  {
    screen: 'Shell',
    where: 'Sidebar destination (Institute Admin only)',
    action: 'Overview',
    role: 'secondary',
    on: '/institute/*',
    target: '/institute',
    outcome: 'built',
    board: '06 (Institute Admin raw[]); B2-01 f0 (`aria-current="page"`)',
    note: 'IA-01 (Package 2A).',
  },
  {
    screen: 'Shell',
    where: 'Sidebar destination (Institute Admin only)',
    action: 'Content access',
    role: 'secondary',
    on: '/institute/*',
    target: '/institute/content-access',
    outcome: 'built',
    board: '06 (Institute Admin raw[]); B2-02 f0, B2-03 f0 (`aria-current="page"`)',
  },
  {
    screen: 'Shell',
    where: 'Sidebar destination (Institute Admin only)',
    action: 'Student access',
    role: 'secondary',
    on: '/institute/*',
    target: '/institute/student-access',
    outcome: 'built',
    board: '06 (Institute Admin raw[]); B2-04 f0, B2-05 f0 (`aria-current="page"`)',
  },
  {
    screen: 'Shell',
    where: 'Sidebar destination (Institute Admin only)',
    action: 'People',
    role: 'secondary',
    on: '/institute/*',
    target: '/institute/people',
    outcome: 'built',
    board: '06 (Institute Admin raw[]); B2-06 f0, B2-07 f0 (`aria-current="page"`)',
    note: 'Requests (IA-17) and Usage (IA-20) render since Phase 3; the Requests count waits on DEV-17 (no count is drawn).',
  },
  {
    screen: 'Shell',
    where: 'Sidebar destination (Student only)',
    action: 'Home',
    role: 'secondary',
    on: '/student/*',
    target: '/student',
    outcome: 'built',
    board: '06 (Student raw[]); B2-10 f0 (`aria-current="page"`)',
    note: 'ST-01 (Package 2A).',
  },
  {
    screen: 'Shell',
    where: 'Sidebar destination (Student only)',
    action: 'My courses',
    role: 'secondary',
    on: '/student/*',
    target: '/student/courses',
    outcome: 'built',
    board: '06 (Student raw[]); B2-11 f0, B2-12 f0 (`aria-current="page"`)',
    note: 'Progress (ST-15) renders since Phase 3; Assessments (ST-11) is not rendered until Phase 4 (DEV-21).',
  },
  // ---- XS-05 Account menu (XS export, design/v3-refined-b/roles/XS-v6) --------------------------
  {
    screen: 'XS-05',
    where: 'Account menu',
    action: 'Help & support',
    role: 'secondary',
    on: ANY_PAGE,
    target: '<base>/help',
    outcome: 'built',
    board: 'XS-v6 LINK-MAP “Help & support” (XsAccountMenu); 06 "Account menu"',
  },
  {
    screen: 'XS-05',
    where: 'Account menu',
    action: 'Sign out',
    role: 'secondary',
    on: ANY_PAGE,
    target: '/sign-in?reason=signed-out',
    outcome: 'built',
    board: 'XS-v6 LINK-MAP “Sign out” → XS-03 “You’re signed out”; 06 "Account menu"',
    note: 'A SessionService.signOut command; the session gate then replaces the address with the sign-in card’s “You’re signed out” notice (XS-03, built in Package 1A). A client-side move: the tab’s sample world is kept (ADR-0004).',
  },
  {
    screen: 'XS-05',
    where: 'Account menu (Students holding AR, VR or MR)',
    action: 'My device',
    role: 'secondary',
    on: '/student/*',
    target: '/student/device',
    outcome: 'built',
    board: 'XS-v6 LINK-MAP “My device” → ST-18; B3-07 f1, f2',
    note: 'ST-18 (Phase 3): offered only to a Student given an AR, VR or MR format (B3-07 f2 “Entry hidden”); never a disabled item.',
  },
  // ---- XS-08 Paused / inactive banners (XS export, XsStatusBanner) -----------------------------
  {
    screen: 'XS-08',
    where: 'Paused and inactive banners',
    action: 'Help',
    role: 'secondary',
    on: ANY_PAGE,
    target: '<base>/help',
    outcome: 'built',
    board: 'XS-v6 LINK-MAP “Help” → XS-07 (XsStatusBanner paused / inactive)',
  },
  // ---- XS-06 Not your workspace (XS export, XsMessagePage not-allowed) --------------------------
  {
    screen: 'XS-06',
    where: 'Message page, in the person’s own shell',
    action: 'Back to Home',
    role: 'primary',
    on: '<other-base>/*',
    target: '<base>',
    outcome: 'interim-landing',
    board: 'XS-v6 LINK-MAP “Back to Home / Back to Overview” (the label is the home’s own name)',
    note: 'The person’s own base, labelled with its home destination (“Back to Overview” in the Super Admin’s, Faculty’s and Vendor’s workspaces); until a home is built it lands on their Help (ADR-0005 §8).',
  },
  {
    screen: 'XS-06',
    where: 'Message page, in the person’s own shell',
    action: 'Help',
    role: 'secondary',
    on: '<other-base>/*',
    target: '<base>/help',
    outcome: 'built',
    board: 'XS-v6 LINK-MAP “Help” (Where: Not your workspace)',
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
    note: 'Lands on the workspace’s Help until its home is built (ADR-0005 §8); in the Super Admin’s workspace, SA-01 Overview (Package 1D).',
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
  // ---- XS-07 Help & support (XS export, XsHelpSupport) ------------------------------------------
  {
    screen: 'XS-07',
    where: 'My reports — page head (with reports) or empty state (none)',
    action: 'Report a problem',
    role: 'primary',
    on: '<base>/help',
    target: '<base>/help/report',
    outcome: 'built',
    board: 'XS-v6 LINK-MAP “Report a problem (page head)” / “(in the empty state)”',
  },
  {
    screen: 'XS-07',
    where: 'My reports — each row',
    action: '(the report’s title)',
    role: 'secondary',
    on: '<base>/help',
    target: '<base>/help/reports/{id}',
    outcome: 'built',
    board: 'XS-v6 LINK-MAP “Report row (title, reference, dates, status)”',
  },
  {
    screen: 'XS-07',
    where: 'Report a problem — breadcrumb (in the page, every width)',
    action: 'Help & support',
    role: 'secondary',
    on: '<base>/help/report',
    target: '<base>/help',
    outcome: 'built',
    board: 'XS-v6 LINK-MAP “Help & support (breadcrumb)”',
  },
  {
    screen: 'XS-07',
    where: 'Report a problem — error summary (after an empty Send)',
    action: 'Say what happened',
    role: 'secondary',
    on: '<base>/help/report',
    target: '#<field>',
    outcome: 'in-page',
    board: 'XS-v6 LINK-MAP “Say what happened (error summary)”',
  },
  {
    screen: 'XS-07',
    where: 'Report a problem — actions',
    action: 'Cancel',
    role: 'secondary',
    on: '<base>/help/report',
    target: '<base>/help',
    outcome: 'built',
    board: 'XS-v6 LINK-MAP “Cancel” → My reports',
  },
  {
    screen: 'XS-07',
    where: 'Report a problem — actions',
    action: 'Send report',
    role: 'primary',
    on: '<base>/help/report',
    target: null,
    outcome: 'in-page',
    board: 'XS-v6 LINK-MAP “Send report” → Report sent',
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
    board: 'XS-v6 LINK-MAP “View my reports”',
  },
  {
    screen: 'XS-07',
    where: 'Report sent (in place of the form)',
    action: 'Back to Home',
    role: 'secondary',
    on: '<base>/help/report',
    target: '<base>',
    outcome: 'interim-landing',
    board: 'XS-v6 LINK-MAP “Back to Home / Back to Overview” (the home’s own name)',
    note: 'Lands on My reports until the workspace home is built (ADR-0005 §8); in the Super Admin’s workspace, SA-01 Overview (Package 1D).',
  },
  {
    screen: 'XS-07',
    where: 'Report detail — breadcrumb (in the page, every width)',
    action: 'Help & support',
    role: 'secondary',
    on: '<base>/help/reports/{id}',
    target: '<base>/help',
    outcome: 'built',
    board: 'XS-v6 LINK-MAP “Help & support (breadcrumb)”',
  },
  {
    screen: 'XS-07',
    where: 'Report detail — foot',
    action: 'Report a problem',
    role: 'secondary',
    on: '<base>/help/reports/{id}',
    target: '<base>/help/report',
    outcome: 'built',
    board: 'XS-v6 LINK-MAP “Report a problem (foot)”',
  },
  // ---- XS-01 Sign in, XS-03 notices, XS-04 disclosures (XS export, XsSignIn) -------------------
  {
    screen: 'XS-01',
    where: 'Sign in with e-mail (the card’s form)',
    action: 'Sign in',
    role: 'primary',
    on: '/sign-in',
    target: null,
    outcome: 'in-page',
    board: 'XS-v6 LINK-MAP “Sign in (submit; Enter in a field)”; B1-09 f0 … f4, f11, f12',
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
    board:
      'XS-v6 LINK-MAP “Sign in with your institution” → “Institution sign-in isn’t available right now”',
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
    board: 'XS-v6 LINK-MAP “Show password / Hide password” (`div.xs-pw`)',
  },
  {
    screen: 'XS-01',
    where: 'Password field (XS-04)',
    action: 'Forgot your password?',
    role: 'secondary',
    on: '/sign-in',
    target: null,
    outcome: 'in-page',
    board: 'XS-v6 LINK-MAP “Forgot your password?” (disclosure, `aria-expanded`)',
    note: 'A disclosure only: activation and recovery are OPEN (T-11 / R02), so it links nowhere.',
  },
  {
    screen: 'XS-01',
    where: 'Under the form (XS-04)',
    action: 'First time signing in?',
    role: 'secondary',
    on: '/sign-in',
    target: null,
    outcome: 'in-page',
    board: 'XS-v6 LINK-MAP “First time signing in?” (disclosure, `aria-expanded`)',
    note: 'A disclosure only: activation is OPEN (T-11 / R02), so it names who can help and links nowhere.',
  },
  {
    screen: 'XS-01',
    where: 'Top row of the entry page',
    action: 'Back to experiments',
    role: 'secondary',
    on: '/sign-in',
    target: '/experiments',
    outcome: 'built',
    board:
      'XS-v6 LINK-MAP “Back to experiments” → PU-04 Catalogue (`a.xs-back`; P1-17 follows the href)',
    note: 'B1-09 sent it to the Landing; the XS export sends it to the public catalogue.',
  },
  {
    screen: 'XS-01',
    where: 'The card’s foot',
    action: 'Request institutional access',
    role: 'secondary',
    on: '/sign-in',
    target: '/request-access',
    outcome: 'built',
    board: 'XS-v6 LINK-MAP “Request institutional access” → PU-08',
    note: 'PU-08 sends a visitor with nothing selected to Your selection first (P1-03, Package 1C).',
  },
  // ---- SA-02 Requests (SA-v1 `V.requests`; LINK-MAP SA-02) ------------------------------------------
  {
    screen: 'SA-02',
    where: 'Each row — the institution',
    action: '(the institution’s name)',
    role: 'secondary',
    on: '/admin/requests',
    target: '/admin/requests/{requestId}',
    outcome: 'built',
    board:
      'SA-v1 LINK-MAP SA-02 rows (“<institution>, <type>, received <date>, <status>. Open the request”) → SA-03',
    note: 'A press anywhere on the row follows its link; the request is named by its institution, never by its reference.',
  },
  {
    screen: 'SA-02',
    where: 'Toolbar',
    action: 'More filters',
    role: 'secondary',
    on: '/admin/requests',
    target: null,
    outcome: 'in-page',
    board: 'SA-v1 LINK-MAP actions SA-02 (“More filters”; “Internal or external” inside)',
  },
  {
    screen: 'SA-02',
    where: 'Toolbar status line (and the no-match state)',
    action: 'Clear filters',
    role: 'secondary',
    on: '/admin/requests',
    target: null,
    outcome: 'in-page',
    board: 'SA-v1 LINK-MAP actions SA-02 (“Clear filters”)',
  },
  {
    screen: 'SA-02',
    where: 'Toolbar status line — each applied filter',
    action: 'Remove filter <filter>',
    role: 'secondary',
    on: '/admin/requests',
    target: null,
    outcome: 'in-page',
    board: 'SA-v1 LINK-MAP actions SA-02 (chips)',
  },
  {
    screen: 'SA-02',
    where: 'Received (the table head; the sort bar where the head is hidden)',
    action: 'Received, newest first. Change order',
    role: 'secondary',
    on: '/admin/requests',
    target: null,
    outcome: 'in-page',
    board: 'SA-v1 LINK-MAP actions SA-02 (“Received sort”); V3P-02',
  },
  {
    screen: 'SA-02',
    where: 'Failed state',
    action: 'Try again',
    role: 'secondary',
    on: '/admin/requests',
    target: null,
    outcome: 'in-page',
    board: "SA-v1 `SA.listState('failed')` (“We couldn’t load the requests”)",
  },
  // ---- SA-03 Request decision (SA-v1 `V.decision`; LINK-MAP SA-03) -------------------------------
  {
    screen: 'SA-03',
    where: 'Breadcrumb',
    action: 'Requests',
    role: 'secondary',
    on: '/admin/requests/{requestId}',
    target: '/admin/requests',
    outcome: 'built',
    board: 'SA-v1 LINK-MAP SA-03 “Requests” (breadcrumb) → SA-02',
  },
  {
    screen: 'SA-03',
    where: 'Page head, below 860 px of page width',
    action: 'Go to decision',
    role: 'secondary',
    on: '/admin/requests/{requestId}',
    target: '#dc-panel',
    outcome: 'in-page',
    board: 'SA-v1 LINK-MAP SA-03 “Go to decision” (in-page anchor)',
    note: 'Moves focus to the decision panel’s heading (the export’s `goPanel`).',
  },
  {
    screen: 'SA-03',
    where: 'Organisation and contact person — the institution (once its record exists)',
    action: '(the institution’s name)',
    role: 'secondary',
    on: '/admin/requests/{requestId}',
    target: '/admin/institutions/{institutionId}',
    outcome: 'built',
    board: 'SA-v1 LINK-MAP SA-03 “<institution>” → SA-07',
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
    board: 'SA-v1 LINK-MAP actions SA-03',
    note: 'Approvals open the confirmation; a request for information is the requestMoreInformation command itself. No Decline, no Mark paid.',
  },
  {
    screen: 'SA-03',
    where: 'Confirmation',
    action: 'Approve request · Approve smaller scope',
    role: 'secondary',
    on: '/admin/requests/{requestId}',
    target: null,
    outcome: 'in-page',
    board: 'SA-v1 `SA.DLG.approveReq` (“Approve request → confirm dialog → Approve request”)',
    note: 'The approveRequest or approveSmallerScope command, with the request’s revision.',
  },
  {
    screen: 'SA-03',
    where: 'Confirmation',
    action: 'Cancel',
    role: 'secondary',
    on: '/admin/requests/{requestId}',
    target: null,
    outcome: 'in-page',
    board: 'SA-v1 `dialogHtml` (Cancel; Esc)',
  },
  {
    screen: 'SA-03',
    where: 'Decision panel (decided)',
    action: 'Back to requests',
    role: 'secondary',
    on: '/admin/requests/{requestId}',
    target: '/admin/requests',
    outcome: 'built',
    board: 'SA-v1 LINK-MAP SA-03 “Back to requests” → SA-02',
  },
  {
    screen: 'SA-03',
    where: 'Decision panel (decided; the institution record this approval created)',
    action: 'Open institution',
    role: 'secondary',
    on: '/admin/requests/{requestId}',
    target: '/admin/institutions/{institutionId}',
    outcome: 'built',
    board: 'SA-v1 LINK-MAP SA-03 “Open institution” → SA-07',
  },
  {
    screen: 'SA-03',
    where: 'Decision panel (institution paused)',
    action: 'View institution',
    role: 'secondary',
    on: '/admin/requests/{requestId}',
    target: '/admin/institutions/{institutionId}',
    outcome: 'built',
    board: 'SA-v1 `V.decision` (“This institution is paused” → “View institution”, SA-07)',
  },
  // ---- SA-01 Overview (SA-v1 `V.overview`; LINK-MAP SA-01): the switch, the Requests group and the
  // failed state; the other groups are in `link-targets-p6/content-oversight.ts` ------------------
  {
    screen: 'SA-01',
    where: 'Category switch',
    action:
      'All · Requests · Corrections · Device transfers · Support · Access ending · Set-up gaps',
    role: 'secondary',
    on: '/admin',
    target: null,
    outcome: 'in-page',
    board: 'SA-v1 LINK-MAP actions SA-01 (“Category switch … filters in place”)',
  },
  {
    screen: 'SA-01',
    where: 'Requests group head',
    action: 'Open Requests',
    role: 'secondary',
    on: '/admin',
    target: '/admin/requests',
    outcome: 'built',
    board: 'SA-v1 LINK-MAP SA-01 “Open Requests” → SA-02',
  },
  {
    screen: 'SA-01',
    where: 'Each request row',
    action: 'Open request',
    role: 'secondary',
    on: '/admin',
    target: '/admin/requests/{requestId}',
    outcome: 'built',
    board:
      'SA-v1 LINK-MAP SA-01 “Open the additional licences request from Konark Polytechnic” → SA-03',
    note: 'Named “Open the <type> request from <institution>”.',
  },
  {
    screen: 'SA-01',
    where: 'Failed state',
    action: 'Try again',
    role: 'secondary',
    on: '/admin',
    target: null,
    outcome: 'in-page',
    board: 'SA-v1 `V.overview` failed (“We couldn’t load what is waiting”)',
  },
  // ---- SA-06 Institutions (SA-v1 `V.institutions`; behaviour of B7-02) — Package 1D, V3 --------------------
  {
    screen: 'SA-06',
    where: 'Filter toolbar',
    action: 'Search · Status',
    role: 'secondary',
    on: '/admin/institutions',
    target: null,
    outcome: 'in-page',
    board: 'SA-v1 `V.institutions` (`rk-tools`: Search, Status with figures)',
    note: 'The status is the service’s `listInstitutions` tab (state-copy SA-06.filters).',
  },
  {
    screen: 'SA-06',
    where: 'Toolbar status line (chips) and the no-match state',
    action: 'Remove filter · Clear filters',
    role: 'secondary',
    on: '/admin/institutions',
    target: null,
    outcome: 'in-page',
    board: 'SA-v1 `V.institutions` (`inChip`, `inClear`; `SA.listState("none")`)',
  },
  {
    screen: 'SA-06',
    where: 'Each row (its link; the whole row opens it)',
    action: '<institution>, <status>. Open the institution',
    role: 'secondary',
    on: '/admin/institutions',
    target: '/admin/institutions/{institutionId}',
    outcome: 'built',
    board: 'SA-v1 LINK-MAP SA-06 → SA-07 (`a.rk-rowlink`, `tr[data-href]`)',
  },
  {
    screen: 'SA-06',
    where: 'Failed state',
    action: 'Try again',
    role: 'secondary',
    on: '/admin/institutions',
    target: null,
    outcome: 'in-page',
    board: 'SA-v1 `SA.listState("failed")` (state-copy SA-06.failed)',
  },
  // ---- SA-07 Institution detail (SA-v1 `V.institution`; behaviour of B7-03, B7-04) — Package 1D, V3 ---------
  {
    screen: 'SA-07',
    where: 'Breadcrumbs',
    action: 'Institutions',
    role: 'secondary',
    on: '/admin/institutions/{institutionId}',
    target: '/admin/institutions',
    outcome: 'built',
    board: 'SA-v1 LINK-MAP SA-07 breadcrumb → SA-06 (`nav.rk-crumbs`)',
  },
  {
    screen: 'SA-07',
    where: 'Page head (under 860 px)',
    action: 'Go to actions',
    role: 'secondary',
    on: '/admin/institutions/{institutionId}',
    target: '#in-panel',
    outcome: 'in-page',
    board: 'SA-v1 LINK-MAP SA-07 “Go to actions” → `#in-panel` (`a.rb-btn.rk-goto`)',
  },
  {
    screen: 'SA-07',
    where: '“What you can do” › Institute Admin — no Institute Admin',
    action: 'Assign Institute Admin',
    role: 'primary',
    on: '/admin/institutions/{institutionId}',
    target: null,
    outcome: 'in-page',
    board: 'SA-v1 LINK-MAP actions SA-07 “Assign Institute Admin → dialog”; HANDOFF SA-07',
    note: 'Opens the dialog (Name, Work e-mail); its Assign is the assignInstituteAdmin command with the institution’s revision; an e-mail someone else signs in with is a field error (PC-49).',
  },
  {
    screen: 'SA-07',
    where: '“What you can do” › Access — access active or ending soon',
    action: 'Pause access',
    role: 'secondary',
    on: '/admin/institutions/{institutionId}',
    target: null,
    outcome: 'in-page',
    board: 'SA-v1 LINK-MAP actions SA-07 “Pause access / Restore access → dialog with reason”',
    note: 'Opens the reason dialog; its Pause access is the pauseInstitution command.',
  },
  {
    screen: 'SA-07',
    where: '“What you can do” › Access — access paused',
    action: 'Restore access',
    role: 'primary',
    on: '/admin/institutions/{institutionId}',
    target: null,
    outcome: 'in-page',
    board: 'SA-v1 LINK-MAP actions SA-07 “Pause access / Restore access → dialog with reason”',
    note: 'Gold while an Institute Admin is assigned (otherwise Assign is the primary). Opens the reason dialog; its Restore access is the restoreInstitution command.',
  },
  {
    screen: 'SA-07',
    where: '“What you can do” › Access — approved, payment required',
    action: 'Open request',
    role: 'secondary',
    on: '/admin/institutions/{institutionId}',
    target: '/admin/requests/{requestId}',
    outcome: 'built',
    board: 'SA-v1 LINK-MAP SA-07 (vizag) “Open request” → SA-03',
  },
  {
    screen: 'SA-07',
    where: '“Access plan” — approved, payment required',
    action: 'Open the approved request',
    role: 'secondary',
    on: '/admin/institutions/{institutionId}',
    target: '/admin/requests/{requestId}',
    outcome: 'built',
    board: 'SA-v1 LINK-MAP SA-07 (vizag) “Open the approved request” → SA-03',
  },
  {
    screen: 'SA-07',
    where: '“Also waiting for this institution” — a request under review',
    action: 'Open request',
    role: 'secondary',
    on: '/admin/institutions/{institutionId}',
    target: '/admin/requests/{requestId}',
    outcome: 'built',
    board: 'SA-v1 LINK-MAP SA-07 “Open request” → SA-03 (`ul.sa-attn`)',
    note: 'State-copy SA-07.attention-request.',
  },
  {
    screen: 'SA-07',
    where: '“Also waiting for this institution” — a device transfer forwarded to BITS',
    action: 'Review transfer',
    role: 'secondary',
    on: '/admin/institutions/{institutionId}',
    target: '/admin/operations/device-transfers/{transferId}',
    outcome: 'built',
    board: 'SA-v1 LINK-MAP SA-07 “Review transfer” → SA-19 (`ul.sa-attn`)',
    note: 'One row per forwarded transfer of the institution (state-copy SA-07.attention-later).',
  },
  {
    screen: 'SA-07',
    where: 'Plan band note — ending soon, renewal in progress',
    action: 'Open renewal request · View renewal',
    role: 'secondary',
    on: '/admin/institutions/{institutionId}',
    target: '/admin/requests/{requestId}',
    outcome: 'built',
    board:
      'SA-v1 LINK-MAP SA-07 (bitshyd) “Open renewal request” → SA-03 (`a.rb-btn.rb-btn--navy`)',
    note: 'State-copy SA-07.plan-status.',
  },
  {
    screen: 'SA-07',
    where: 'People — each student',
    action: 'Change status · Change to <status> · Cancel',
    role: 'secondary',
    on: '/admin/institutions/{institutionId}',
    target: null,
    outcome: 'in-page',
    board: 'SA-v1 LINK-MAP actions SA-07 “Change status (student) → inline reason” (`sa-inline`)',
    note: 'Change to … (navy, the form’s own confirm) is the overrideStudentStatus command with the student record’s revision (PC-37).',
  },
  {
    screen: 'SA-07',
    where: 'Dialogs (Assign, Pause, Restore)',
    action: 'Cancel',
    role: 'secondary',
    on: '/admin/institutions/{institutionId}',
    target: null,
    outcome: 'in-page',
    board: 'SA-v1 `sa-core.js` `dialogHtml` (`dlgCancel`; Esc)',
  },
  {
    screen: 'SA-07',
    where: 'Failed state',
    action: 'Try again',
    role: 'secondary',
    on: '/admin/institutions/{institutionId}',
    target: null,
    outcome: 'in-page',
    board: 'SA-v1 `SA.listState("failed")` formula (`SaRecordGuard`; state-copy SA-07.failed)',
  },
  {
    screen: 'SA-07',
    where: 'Not available (GL-04)',
    action: 'Back to Overview · Help & support',
    role: 'secondary',
    on: '/admin/institutions/{institutionId}',
    target: '/admin',
    outcome: 'built',
    board: 'SA-v1 `sa-core.js` `SA.resolve` `nf` (`SaUnavailable`; state-copy SA-07.not-found)',
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
      'built',
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
      'built',
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
      'built',
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
  // ---- The public request (Phase-1 Package 1C: B1-06 … B1-08; DV-5 / O-05, TE-4) -----------------
  ...publicPage('PU-07', '/selection', [
    [
      'Row',
      '(the experiment’s title)',
      'secondary',
      '/experiments/{experimentId}',
      'built',
      'B1-06 `h2.xp-srow-title a` → B1-05',
    ],
    ['Row', 'Remove', 'secondary', null, 'in-page', 'B1-06 (SelectionService.remove)'],
    [
      'Row · formats',
      '(a format: WEB · Browser …)',
      'secondary',
      null,
      'in-page',
      'B1-06 `fieldset.xp-pills` (SelectionService.setFormats)',
    ],
    ['Undo notice', 'Undo', 'secondary', null, 'in-page', 'B1-06 (SelectionService.undoRemove)'],
    [
      'Summary',
      'Continue to request',
      'primary',
      '/request-access',
      'built',
      'B1-06 `aside.xp-sumcard` → B1-07',
    ],
    [
      'Summary',
      'Continue browsing',
      'secondary',
      '/experiments',
      'built',
      'B1-06 `aside.xp-sumcard` → B1-04',
    ],
    [
      'Bottom bar (below 1024 px)',
      'Continue to request',
      'primary',
      '/request-access',
      'built',
      'B1-06 `div.xp-bottombar` → B1-07',
    ],
    ['Empty', 'Browse experiments', 'primary', '/experiments', 'built', 'B1-06 "Empty selection"'],
  ]),
  ...publicPage('PU-08', '/request-access', [
    ['Details · top', 'Back to selection', 'secondary', '/selection', 'built', 'B1-07 `a.xr-back`'],
    [
      'Details · error summary',
      '(each error, linked to its field)',
      'secondary',
      '#request-institution',
      'in-page',
      'B1-07 f3 "Validation" (summary links focus their field)',
    ],
    [
      'Details · What you need',
      'Change',
      'secondary',
      '/selection',
      'built',
      'B1-07 `div.xp-reqitem a` → B1-06',
    ],
    [
      'Details · foot',
      'Back to selection',
      'secondary',
      '/selection',
      'built',
      'B1-07 `div.xp-formfoot a`',
    ],
    [
      'Details · foot',
      'Review request',
      'primary',
      null,
      'in-page',
      'B1-07 `button[type=submit]` (checks the form, then the review step `?step=review`)',
    ],
    [
      'Review',
      'Edit (each answer)',
      'secondary',
      null,
      'in-page',
      'B1-07 f5 `button.xp-edit` (the details step, its field focused)',
    ],
    [
      'Review · Experiments and formats',
      'Change',
      'secondary',
      '/selection',
      'built',
      'B1-07 f5 `a.xp-edit` → B1-06',
    ],
    [
      'Review · foot',
      'Back to request details',
      'secondary',
      null,
      'in-page',
      'B1-07 f5 (the details step)',
    ],
    [
      'Review · foot',
      'Submit request',
      'primary',
      null,
      'in-page',
      'B1-07 f5 → f8 (sends the request once, then Request sent `/request-access/sent`)',
    ],
  ]),
  ...publicPage('PU-09', '/request-access/sent', [
    [
      'Request sent',
      'Check request status',
      'primary',
      '/requests/{routeId}',
      'built',
      'B1-07 f8 `div.xr-msg-actions a.xr-btn--primary` → B1-08 (O-05: the request’s opaque address)',
    ],
    [
      'Request sent',
      'Browse experiments',
      'secondary',
      '/experiments',
      'built',
      'B1-07 f8 `div.xr-msg-actions a` → B1-04',
    ],
  ]),
  ...publicPage('PU-10', '/requests/{routeId}', [
    [
      'Approved — payment required (f0, f4)',
      'Continue to payment',
      'primary',
      '/requests/{routeId}/payment',
      'built',
      'B1-08 f0 `a.xr-btn--primary` → f5 (PU-12)',
    ],
    [
      'Payment not confirmed (f6)',
      'Check again',
      'secondary',
      null,
      'in-page',
      'B1-08 f6 `button.xr-btn--secondary` (reads the status again; no “pay again”)',
    ],
    [
      'Payment failed (f7)',
      'Try payment again',
      'primary',
      '/requests/{routeId}/payment',
      'built',
      'B1-08 f7 `a.xr-btn--primary` → f5 (PU-12)',
    ],
    [
      'Access active (f8, f9; PU-13)',
      'Sign in',
      'primary',
      '/sign-in',
      'built',
      'B1-08 f8 `a.xr-btn--primary` → B1-09',
    ],
    [
      'Not found (O-05: unknown, or not this session’s request)',
      'Browse experiments',
      'primary',
      '/experiments',
      'built',
      'Board 08 public not-found (PU-15), as every unknown public address',
    ],
  ]),
  ...publicPage('PU-12', '/requests/{routeId}/payment', [
    [
      'Top',
      'Back to request status',
      'secondary',
      '/requests/{routeId}',
      'built',
      'B1-08 f5 `a.xr-back` → PU-10',
    ],
    [
      'Foot',
      'Back to request status',
      'secondary',
      '/requests/{routeId}',
      'built',
      'B1-08 f5 `div.xp-formfoot a` → PU-10',
    ],
    [
      'Foot',
      'Continue to payment',
      'primary',
      null,
      'in-page',
      'B1-08 f5 `a.xr-btn--primary.xp-cta` (starts the payment; TE-4 sample provider; then the request status)',
    ],
  ]),
  // ---- Package 2A (Phase 2): the Institute Admin (B2-01 … B2-07) and the Student (B2-10 … B2-12) --
  // The Institute Admin's rows are kept per V3 screen group (`link-targets-ia/`), spread here in
  // the ledger's order.
  ...IA_PLAN_LINK_TARGETS['IA-01'],
  ...IA_PLAN_LINK_TARGETS['IA-02'],
  ...IA_PLAN_LINK_TARGETS['IA-16'],
  ...IA_PLAN_LINK_TARGETS['IA-03'],
  ...IA_ACCESS_LINK_TARGETS['IA-04'],
  ...IA_ACCESS_LINK_TARGETS['IA-05'],
  ...IA_PEOPLE_LINK_TARGETS['IA-06'],
  ...IA_PEOPLE_LINK_TARGETS['IA-08'],
  ...IA_ACCESS_LINK_TARGETS['IA-07'],
  ...IA_PEOPLE_LINK_TARGETS['IA-10'],
  // ---- Package 2B: IA-09, IA-11, IA-13, IA-14, IA-15 (B2-06 f15 f16, B2-07 f5 … f10, B2-08, B2-09)
  ...IA_PEOPLE_LINK_TARGETS['IA-09'],
  ...IA_PEOPLE_LINK_TARGETS['IA-11'],
  ...IA_PEOPLE_LINK_TARGETS['IA-13'],
  ...IA_ACCESS_LINK_TARGETS['IA-14'],
  ...IA_PEOPLE_LINK_TARGETS['IA-15'],
  // ---- The Student (Packages 2A, 2B): kept per V3 screen group (`link-targets-st/`) --------------
  ...ST_HOME_LINK_TARGETS['ST-01'],
  ...ST_HOME_LINK_TARGETS['ST-02'],
  ...ST_HOME_LINK_TARGETS['ST-04'],
  ...ST_HOME_LINK_TARGETS['ST-03'],
  ...ST_HUB_LINK_TARGETS['ST-05'],
  ...ST_HOME_LINK_TARGETS['ST-19'],
  // ---- Phase 3: one file per screen group (`link-targets-p3/`) ---------------------------------
  ...P3_HUB_LINK_TARGETS,
  ...P3_FORMATS_LINK_TARGETS,
  ...P3_PROGRESS_FEEDBACK_LINK_TARGETS,
  ...P3_DEVICE_LINK_TARGETS,
  ...P3_INSTITUTE_REQUESTS_LINK_TARGETS,
  ...P3_USAGE_LINK_TARGETS,
  ...P3_OPERATIONS_LINK_TARGETS,
  // ---- Phase 4A: one file per screen group (`link-targets-p4/`) --------------------------------
  ...P4_FACULTY_OVERVIEW_LINK_TARGETS,
  ...P4_FACULTY_COURSES_LINK_TARGETS,
  ...P4_FACULTY_EXPERIMENT_LINK_TARGETS,
  ...P4_ASSESSMENTS_LINK_TARGETS,
  ...P4_ASSESSMENT_RECORD_LINK_TARGETS,
  ...P4_ASSESSMENT_SETTINGS_LINK_TARGETS,
  ...P4_QUESTION_BANK_LINK_TARGETS,
  ...P4_FACULTY_SHELL_LINK_TARGETS,
  // ---- Phase 4B: one file per screen group (`link-targets-p4b/`) -------------------------------
  ...P4B_STUDENT_ASSESSMENTS_LINK_TARGETS,
  ...P4B_ATTEMPT_LINK_TARGETS,
  ...P4B_RESULT_LINK_TARGETS,
  ...P4B_SUBMISSIONS_LINK_TARGETS,
  ...P4B_MARKING_LINK_TARGETS,
  ...P4B_FACULTY_STUDENTS_LINK_TARGETS,
  ...P4B_QUESTION_TOOLS_LINK_TARGETS,
  // ---- Phase 5: one file per screen group (`link-targets-p5/`) ---------------------------------
  ...P5_VENDOR_HOME_LINK_TARGETS,
  ...P5_VENDOR_EDITOR_LINK_TARGETS,
  ...P5_VENDOR_RECORD_LINK_TARGETS,
  ...P5_REVIEWER_LISTS_LINK_TARGETS,
  ...P5_REVIEWER_REVIEW_LINK_TARGETS,
  ...P5_CM_LISTS_LINK_TARGETS,
  ...P5_CM_DECISION_LINK_TARGETS,
  ...P6_CM_CORRECTION_LINK_TARGETS,
  ...P6_REVIEW_UPDATE_LINK_TARGETS,
  ...P6_RELEASE_LINK_TARGETS,
  ...P6_CONTENT_OVERSIGHT_LINK_TARGETS,
  ...P6_STRUCTURE_LINK_TARGETS,
  ...P6_PLATFORM_ROLES_LINK_TARGETS,
  ...P6_OPERATIONS_6_LINK_TARGETS,
];

/**
 * The ledger's target for a workspace (`<base>` → `/student`, `{id}` → a report's reference,
 * `{requestId}` → a request's, `{institutionId}` → an institution's; the public pages' `{areaId}`,
 * `{courseId}`, `{experimentId}` → the spine-start world's Shell-and-Tube chain; `{routeId}` → a
 * request's opaque public address, O-05; Phase 4B: `{attemptId}` → ATT-0450).
 */
export function expandTarget(target: string, base: string, reportId = 'SUP-0213'): string {
  return target
    .replace('<base>', base)
    .replace('{id}', reportId)
    .replace('{requestId}', 'REQ-0038')
    .replace('{institutionId}', 'bitshyd')
    .replace('{areaId}', 'mechanical-manufacturing')
    .replace('{courseId}', 'thermodynamics-heat-transfer')
    .replace('{experimentId}', 'shell-and-tube-heat-exchanger')
    .replace('{routeId}', 'rq-0012')
    .replace('{planId}', 'ACC-0107')
    .replace('{studentId}', 'per-0002')
    .replace('{groupId}', 'GRP-0012')
    .replace('{facultyId}', 'per-0013')
    .replace('{transferId}', 'DTR-0018')
    .replace('{assessmentId}', 'ASMT-0009')
    .replace('{questionId}', 'Q-0101')
    .replace('{attemptId}', 'ATT-0450')
    .replace('{draftId}', 'qd-0001')
    .replace('{format}', 'vr');
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
    at('Header', 'Selection (n)', '/selection', 'built', 'B1-01 `a.xp-sel` → B1-06'),
    at('Header', 'Sign in', '/sign-in', 'built', 'B1-01 `a.xp-signin`'),
    at('Header', 'Request access', '/selection', 'built', 'B1-01 `a.xp-access` → B1-06 (HB-02)'),
    at(
      'Header (below 1024 px)',
      'Menu / Close',
      null,
      'in-page',
      'B1-01 `button.xp-menu-btn` ("Mobile 375 · menu open")',
    ),
    ...nav('Menu sheet', 'B1-01 "Mobile 375 · menu open" `ul.xp-sheet-list`'),
    at('Menu sheet', 'Selection (n)', '/selection', 'built', 'B1-01 sheet list → B1-06'),
    at('Menu sheet', 'Sign in', '/sign-in', 'built', 'B1-01 `.xp-sheet-actions`'),
    at('Menu sheet', 'Request access', '/selection', 'built', 'B1-01 `.xp-sheet-actions` → B1-06'),
    ...nav('Footer', 'B1-01 `nav aria-label="Footer"` (real links only; PU-16 excluded)'),
    at('Footer', 'Sign in', '/sign-in', 'built', 'B1-01 footer'),
  ];
}
