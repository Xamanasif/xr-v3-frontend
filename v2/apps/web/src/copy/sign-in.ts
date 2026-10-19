/**
 * The words of the sign-in page (XS-01, XS-03, XS-04) as the owner-approved Entry & shared export
 * draws them (design/v3-refined-b/roles/XS-v6, `XsSignIn`; SHARED-CONTRACT `XsSignIn` copy), which
 * keeps the words of board B1-09. The field rules' words come from the session port's own refusal
 * (the contract copy catalogue `XS-01.*`); the refusal "The e-mail or password isn’t right" and
 * the notices are written here. Nothing names an account, a role or a workspace to choose.
 */
export const SIGN_IN = {
  /** The document title and the card's H1 (`h1.rb-h1`). */
  title: 'Sign in',
  sso: 'Sign in with your institution',
  ssoBusy: 'Opening your institution’s sign-in…',
  or: 'or sign in with e-mail',
  formLabel: 'Sign in with e-mail',
  email: 'E-mail',
  password: 'Password',
  show: 'Show',
  hide: 'Hide',
  /** Read after "Show"/"Hide" by screen readers only (`span.xr-sr`): "Show password". */
  passwordSuffix: ' password',
  submit: 'Sign in',
  busy: 'Signing in…',
  /** The busy state's announcement (`p.xs-live[role=status]`). */
  busyStatus: 'Signing in',
  /** The error summary over missing details (XS `validation_copy.summary`). */
  summary: 'Check your sign-in details',
  forgot: 'Forgot your password?',
  /** XS-04 (recovery and activation are OPEN, T-11 / R02): who can help, nothing sent. */
  forgotHint: 'Contact your institution administrator to reset it.',
  /** XS-04's second disclosure, under the form (`div.xs-trouble`). */
  firstTime: 'First time signing in?',
  firstTimeHint:
    'Contact your institution administrator to find out how to sign in for the first time.',
  /** The top row's way out (`a.xs-back`) — to the public catalogue, PU-04 (XS link map). */
  backToExperiments: 'Back to experiments',
  backHref: '/experiments',
  /**
   * The card's foot (`div.xs-card-foot`): to the request form, PU-08, which sends a visitor with
   * nothing selected to Your selection first (P1-03).
   */
  needAccess: 'Need access for your institution? ',
  requestAccess: 'Request institutional access',
  requestAccessHref: '/request-access',
  /**
   * The quiet line under the card (`p.xs-proto`), local prototype builds only: it says the
   * sign-in is a stand-in and lists no account (XS HANDOFF §1.1 "Prototype line").
   */
  prototypeLead: 'Prototype sign-in.',
  prototypeLine:
    'Real accounts, password checks and institution single sign-on aren’t connected in this build. Sample accounts open with any password.',
} as const;

/** The notices on the card (XS `XsSignIn`; B1-09 f3, f6, f9, f10 and its inactive notice). */
export const SIGN_IN_NOTICES = {
  /** f3 "Wrong details": `refused` `wrong-details` (focus moves here; password cleared). */
  wrongDetails: {
    title: 'The e-mail or password isn’t right',
    line: 'Check both and try again.',
  },
  /** f6 "Institution sign-in unavailable": single sign-on answers `policy-open` T-10. */
  ssoUnavailable: {
    title: 'Institution sign-in isn’t available right now',
    line: 'Sign in with your e-mail and password instead.',
  },
  /** f9 "Session expired" (XS-03): `?reason=expired`; the return address in words. */
  expired: {
    title: 'Your session ended',
    before: 'Sign in again to go back to where you were: ',
    after: '.',
    /** No built page matches the return address: the sentence without a place (PROVISIONAL). */
    withoutPlace: 'Sign in again to go back to where you were.',
  },
  /** f10 "Signed out" (XS-03): `?reason=signed-out`, confirmation only. */
  signedOut: { title: 'You’re signed out' },
  /**
   * The card's inactive refusal, shown when the session port answers `policy-open` SES-09 (an
   * inactive Faculty member's sign-in is undecided), PROVISIONAL. The XS export draws no such
   * state (its sign-in never reveals account status); the product keeps the service's answer and
   * shows it as the card's refusal.
   */
  inactive: {
    title: 'Your account is inactive',
    line: 'Contact your institution administrator.',
  },
} as const;

/** `?reason=` on `/sign-in` (Appendix A XS-03: `signed-out`, `expired`). */
export type SignInReason = 'signed-out' | 'expired';

export function signInReasonOf(value: string | null): SignInReason | null {
  return value === 'signed-out' || value === 'expired' ? value : null;
}
