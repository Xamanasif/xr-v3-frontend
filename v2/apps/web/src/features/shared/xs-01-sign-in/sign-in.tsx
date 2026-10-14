'use client';

import type { Role } from '@xr/domain';
import {
  Button,
  Field,
  FieldError,
  LoadingState,
  LogoPlaceholder,
  Notice,
  TextInput,
} from '@xr/ui';
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react';

import { SIGN_IN, SIGN_IN_NOTICES, signInReasonOf } from '@/copy/sign-in';
import { stateWords } from '@/copy/state-copy';
import { useAppNavigation } from '@/nav/navigation';
import { placeWordsOf } from '@/nav/place-words';
import { returnToFor } from '@/nav/return-to';
import { useSession } from '@/queries/session';
import { useCommand } from '@/queries/use-command';

import { noteEntryAddress } from '../workspace-frame/route-focus';

/** B1-09's placeholder (an unapproved placeholder, never the official asset: owner constraint 12). */

const EMAIL_ID = 'sign-in-email';
const PASSWORD_ID = 'sign-in-password';
const ALERT_ID = 'sign-in-alert';
const FORGOT_ID = 'sign-in-forgot';

/** Which notice the card shows above its heading (B1-09 `mode`). */
type Mode = 'normal' | 'wrong-details' | 'inactive' | 'expired' | 'signed-out';

/** Single sign-on (B1-09 f0 → f5 → f6): idle, opening, or unavailable for this tab. */
type SingleSignOn = 'idle' | 'opening' | 'unavailable';

interface FieldErrors {
  readonly email?: string;
  readonly password?: string;
}

/** The fields of the form, in the order focus visits the first invalid one (B1-09 `submit`). */
const FIELD_ORDER = [
  ['email', EMAIL_ID],
  ['password', PASSWORD_ID],
] as const;

/**
 * XS-01 Sign in, with XS-03 (the "Session expired" and "Signed out" notices on the same card) and
 * XS-04 (the "Forgot your password?" disclosure) — board B1-09, at `/sign-in` (Appendix A; ADR-0005
 * §6: `?reason=signed-out|expired&returnTo=`).
 *
 * - **Sign-in is the session port's command** (`SessionService.signIn`, through `useCommand`): the
 *   sample world resolves the typed e-mail to a sample person and accepts any non-empty password —
 *   the owner-approved local sample rule (P1-01 / DV-3; ADR-0003 §4). No token, no credential in
 *   copy, no account list, role chooser or DEMO banner (B1-09 "Never here"). The SERVICE validates:
 *   its field errors are B1-09's words (the contract catalogue `XS-01.*`), and an unknown e-mail
 *   is its drawn refusal "Wrong details" — the password is cleared, the e-mail kept, and focus
 *   moves to the message (B1-09 f3).
 * - **Who is signed in comes from the session store**, which adopts the adapter's own session
 *   after the command (never the command's answer, WP-0.12) and clears every cached answer. The
 *   person then lands on their role's home (B1-09 "After sign-in"), or on `returnTo` when it is a
 *   same-origin path inside their own workspace (AD-21 interim, `nav/return-to.ts`): another
 *   workspace's address is never honoured. The move is a client-side replace, so the tab's sample
 *   world is kept (ADR-0004).
 * - **Single sign-on** opens (f5 "Opening your institution’s sign-in…") and the port answers
 *   `policy-open` T-10 (no identity provider is decided): the card shows f6 "Institution sign-in
 *   isn’t available right now" in place of the button — no dead button.
 * - **Session expired** is a drawn state reached through `?reason=expired` only: nothing in sample
 *   mode expires a session (P1-19, QT-13). Its notice names the return address in the page's
 *   words (`nav/place-words.ts`).
 */
export function SignIn() {
  const navigation = useAppNavigation();
  const query = new URLSearchParams(navigation.search);
  const reason = signInReasonOf(query.get('reason'));
  const returnTo = query.get('returnTo');
  const session = useSession();
  const signIn = useCommand((ports) => ports.session.signIn);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [mode, setMode] = useState<Mode>(
    reason === 'expired' ? 'expired' : reason === 'signed-out' ? 'signed-out' : 'normal',
  );
  const [singleSignOn, setSingleSignOn] = useState<SingleSignOn>('idle');
  /** Sent, and accepted: the card stays busy until the next page replaces it. */
  const [signingIn, setSigningIn] = useState(false);
  const focusAfter = useRef<string | null>(null);

  const { replace } = navigation;
  const signedInRole: Role | null = session.status === 'signed-in' ? session.session.role : null;

  // The workspace's route focus counts this page as the previous address (`route-focus.ts`), so
  // focus moves to the workspace's main content after signing in.
  useEffect(() => {
    noteEntryAddress(navigation.pathname);
  }, [navigation.pathname]);

  // Signed in — by this form, or already when the page opened — the person goes to their own
  // workspace: the validated return address or their role's home.
  useEffect(() => {
    if (signedInRole) replace(returnToFor(signedInRole, returnTo));
  }, [signedInRole, returnTo, replace]);

  // Focus moves after the state it targets has rendered (B1-09 `focus`).
  useEffect(() => {
    const target = focusAfter.current;
    if (!target) return;
    focusAfter.current = null;
    document.getElementById(target)?.focus();
  });

  if (signedInRole && !signingIn) {
    return <LoadingState label={stateWords('shell.session-loading')} surface={null} lines={0} />;
  }

  const busy = signingIn || signIn.busy;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || session.status === 'unknown') return;
    setErrors({});
    setSigningIn(true);
    signIn.run({ method: 'email', email, password }).then(
      (answer) => {
        if (answer.ok) return; // the session effect above leaves for the workspace
        setSigningIn(false);
        const error = answer.error;
        if (error.kind === 'validation-failed') {
          const next: { email?: string; password?: string } = {};
          for (const fieldError of error.fieldErrors) {
            if (fieldError.field === 'email' && fieldError.message) next.email = fieldError.message;
            if (fieldError.field === 'password' && fieldError.message) {
              next.password = fieldError.message;
            }
          }
          setErrors(next);
          focusAfter.current = FIELD_ORDER.find(([name]) => next[name])?.[1] ?? null;
          return;
        }
        if (error.kind === 'refused' && error.code === 'wrong-details') {
          setMode('wrong-details');
          setPassword('');
          focusAfter.current = ALERT_ID;
          return;
        }
        if (error.kind === 'policy-open' && error.decision === 'SES-09') {
          setMode('inactive');
          setPassword('');
          focusAfter.current = ALERT_ID;
        }
      },
      () => {
        // `unavailable` (thrown): B1-09 draws no failure; the form keeps what was typed and Sign in
        // can be pressed again (state-copy `XS-01.unavailable`).
        setSigningIn(false);
      },
    );
  };

  const openSingleSignOn = () => {
    if (singleSignOn !== 'idle' || session.status === 'unknown') return;
    setSingleSignOn('opening');
    signIn.run({ method: 'sso' }).then(
      (answer) => {
        // T-10: no identity provider is decided, so the port answers `policy-open`; f6.
        if (!answer.ok) {
          setSingleSignOn('unavailable');
          focusAfter.current = EMAIL_ID;
        }
      },
      () => setSingleSignOn('idle'),
    );
  };

  /** Typing again clears that field's error, and the "isn’t right" notice (B1-09 `onChange`). */
  const edit = (field: keyof FieldErrors, value: string) => {
    if (field === 'email') setEmail(value);
    else setPassword(value);
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
    if (mode === 'wrong-details' || mode === 'inactive') setMode('normal');
  };

  const place = placeWordsOf(returnTo);

  return (
    <div className="xp-auth-card">
      <div className="xp-auth-brand">
        <LogoPlaceholder placement="public" />
        <span>{SIGN_IN.product}</span>
      </div>
      {mode === 'expired' ? (
        <Notice tone="info" icon="clock" title={SIGN_IN_NOTICES.expired.title}>
          {place ? (
            <>
              {SIGN_IN_NOTICES.expired.before}
              <strong>{place}</strong>
              {SIGN_IN_NOTICES.expired.after}
            </>
          ) : (
            SIGN_IN_NOTICES.expired.withoutPlace
          )}
        </Notice>
      ) : null}
      {mode === 'signed-out' ? <Notice tone="ok" title={SIGN_IN_NOTICES.signedOut.title} /> : null}
      {mode === 'wrong-details' ? (
        <Notice tone="err" id={ALERT_ID} tabIndex={-1} title={SIGN_IN_NOTICES.wrongDetails.title}>
          {SIGN_IN_NOTICES.wrongDetails.line}
        </Notice>
      ) : null}
      {mode === 'inactive' ? (
        <Notice
          tone="err"
          icon="notAvailable"
          id={ALERT_ID}
          tabIndex={-1}
          title={SIGN_IN_NOTICES.inactive.title}
        >
          {SIGN_IN_NOTICES.inactive.line}
        </Notice>
      ) : null}
      <h1 className="xp-auth-h">{SIGN_IN.title}</h1>
      {singleSignOn === 'unavailable' ? (
        <Notice tone="quiet" title={SIGN_IN_NOTICES.ssoUnavailable.title}>
          {SIGN_IN_NOTICES.ssoUnavailable.line}
        </Notice>
      ) : (
        <>
          <Button
            variant="secondary"
            block
            icon="institutions"
            busy={singleSignOn === 'opening'}
            busyLabel={SIGN_IN.ssoBusy}
            onClick={openSingleSignOn}
          >
            {SIGN_IN.sso}
          </Button>
          <p className="xp-or">{SIGN_IN.or}</p>
        </>
      )}
      <form
        noValidate
        onSubmit={submit}
        aria-label={SIGN_IN.formLabel}
        className="flex flex-col gap-[18px]"
      >
        <Field id={EMAIL_ID} label={SIGN_IN.email} error={errors.email}>
          <TextInput
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => edit('email', event.target.value)}
          />
        </Field>
        <PasswordField
          value={password}
          onChange={(value) => edit('password', value)}
          shown={showPassword}
          onToggle={() => setShowPassword((shown) => !shown)}
          error={errors.password}
          forgotOpen={forgotOpen}
          onForgotToggle={() => setForgotOpen((open) => !open)}
        />
        <Button variant="primary" block type="submit" busy={busy} busyLabel={SIGN_IN.busy}>
          {SIGN_IN.submit}
        </Button>
        {busy ? (
          <span className="xr-sr" role="status">
            {SIGN_IN.busyStatus}
          </span>
        ) : null}
      </form>
    </div>
  );
}

/**
 * The password field (B1-09): the reveal button inside `div.xp-pw` ("Show" / "Hide" + "password"
 * for screen readers), the error, then XS-04 — "Forgot your password?", a disclosure whose hint
 * says only who can help: activation and recovery are OPEN (T-11 / R02), so nothing links
 * anywhere.
 */
function PasswordField({
  value,
  onChange,
  shown,
  onToggle,
  error,
  forgotOpen,
  onForgotToggle,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly shown: boolean;
  readonly onToggle: () => void;
  readonly error: string | undefined;
  readonly forgotOpen: boolean;
  readonly onForgotToggle: () => void;
}): ReactNode {
  const errorId = `${PASSWORD_ID}-e`;
  return (
    <div className="xr-field">
      <label className="xr-label" htmlFor={PASSWORD_ID}>
        {SIGN_IN.password}
      </label>
      <div className="xp-pw">
        <input
          id={PASSWORD_ID}
          className="xr-input"
          type={shown ? 'text' : 'password'}
          autoComplete="current-password"
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
        <button type="button" onClick={onToggle}>
          {shown ? SIGN_IN.hide : SIGN_IN.show}
          <span className="xr-sr">{SIGN_IN.passwordSuffix}</span>
        </button>
      </div>
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
      <Button
        variant="text"
        className="min-h-8 self-start p-0"
        aria-expanded={forgotOpen}
        aria-controls={FORGOT_ID}
        onClick={onForgotToggle}
      >
        {SIGN_IN.forgot}
      </Button>
      {forgotOpen ? (
        <p className="xr-hint" id={FORGOT_ID}>
          {SIGN_IN.forgotHint}
        </p>
      ) : null}
    </div>
  );
}
