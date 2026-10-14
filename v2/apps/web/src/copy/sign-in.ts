/**
 * The words of the sign-in card (XS-01, XS-03, XS-04; board B1-09 "Sign in and session"), as the
 * board draws them. The field rules' words come from the session port's own refusal (the contract
 * copy catalogue `XS-01.*`, checked verbatim against B1-09); the drawn refusal "Wrong details"
 * (`wrong-details`) and the notices are written here. Nothing names a sample account, a role or a
 * workspace to choose (B1-09 "Never here").
 */
export const SIGN_IN = {
  /** The document title and the card's H1 (`h1.xp-auth-h`). */
  title: 'Sign in',
  product: 'XR Learning Platform',
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
  /** The busy state's status line (`span.xr-sr[role=status]`). */
  busyStatus: 'Signing in',
  forgot: 'Forgot your password?',
  /** XS-04 (B1-09 "Forgot password": recovery and activation are OPEN, T-11 / R02). */
  forgotHint: 'Contact your institution administrator to reset it.',
  /** The top row's way out to the Landing (`a.xr-back`; P1-17 follows the href; Package 1B). */
  backToExperiments: 'Back to experiments',
  /** B1-09 `div.xp-auth-links` under the form (to B1-06 Your selection). */
  needAccess: 'Need access for your institution? ',
  requestAccess: 'Request institutional access',
} as const;

/** The notices on the card (B1-09 f3, f6, f9, f10 and the card's drawn inactive / paused notices). */
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
   * The card's inactive notice (drawn in B1-09's card markup), shown when the session port
   * answers `policy-open` SES-09 (an inactive Faculty member's sign-in is undecided), PROVISIONAL.
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
