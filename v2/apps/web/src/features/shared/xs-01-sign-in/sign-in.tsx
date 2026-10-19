'use client';

import type { Role } from '@xr/domain';
import {
  Button,
  Disclosure,
  EntryCard,
  EntryForm,
  EntryHeading,
  ErrorSummary,
  Field,
  FieldRow,
  LiveStatus,
  LoadingRows,
  Notice,
  OrRule,
  PasswordInput,
  PrototypeNote,
  RefusalSummary,
  TextInput,
  TextLink,
  TroubleLinks,
  type ErrorSummaryItem,
} from '@xr/ui/v3';
import { type FormEvent, useEffect, useRef, useState } from 'react';

import { SIGN_IN, SIGN_IN_NOTICES, signInReasonOf } from '@/copy/sign-in';
import { stateWords } from '@/copy/state-copy';
import { useAppNavigation } from '@/nav/navigation';
import { placeWordsOf } from '@/nav/place-words';
import { returnToFor } from '@/nav/return-to';
import { useSession } from '@/queries/session';
import { useCommand } from '@/queries/use-command';

import { noteEntryAddress } from '../workspace-frame/route-focus';

const EMAIL_ID = 'sign-in-email';
const PASSWORD_ID = 'sign-in-password';
const ALERT_ID = 'sign-in-alert';
const SUMMARY_ID = 'sign-in-errors';
const NOTE_ID = 'sign-in-note';
const SSO_NOTE_ID = 'sign-in-sso-note';
const FORGOT_ID = 'sign-in-forgot';
const FIRST_TIME_ID = 'sign-in-first-time';

/** Which notice or refusal the card shows above its heading. */
type Mode = 'normal' | 'wrong-details' | 'inactive' | 'expired' | 'signed-out';

/** Single sign-on: idle, opening, or unavailable for this tab (T-10). */
type SingleSignOn = 'idle' | 'opening' | 'unavailable';

interface FieldErrors {
  readonly email?: string;
  readonly password?: string;
}

/** The fields of the form, in page order (the error summary's order). */
const FIELD_ORDER = [
  ['email', EMAIL_ID],
  ['password', PASSWORD_ID],
] as const;

/**
 * XS-01 Sign in, with XS-03 (the "You’re signed out" and "Your session ended" notices on the same
 * card) and XS-04 (the "Forgot your password?" and "First time signing in?" disclosures), in the
 * owner-approved Entry & shared design (design/v3-refined-b/roles/XS-v6, `XsSignIn`), at
 * `/sign-in` (ADR-0005 §6: `?reason=signed-out|expired&returnTo=`).
 *
 * - **Sign-in is the session port's command** (`SessionService.signIn`, through `useCommand`): the
 *   sample world resolves the typed e-mail to a sample person and accepts any non-empty password —
 *   the owner-approved local sample rule (P1-01 / DV-3; ADR-0003 §4). No token, no credential in
 *   copy, no account list, role chooser or "view as". The SERVICE validates: its field errors are
 *   the contract catalogue's words (`XS-01.*`), shown in the error summary — which takes focus,
 *   each link focusing its field — and beside each field. An unknown e-mail is its refusal
 *   `wrong-details`: "The e-mail or password isn’t right", the password cleared, the e-mail kept,
 *   focus on the refusal. The same words for an unknown e-mail and a wrong password.
 * - **Who is signed in comes from the session store**, which adopts the adapter's own session
 *   after the command and clears every cached answer. The person then lands on their role's home,
 *   or on `returnTo` when it is a same-origin path inside their own workspace (AD-21 interim,
 *   `nav/return-to.ts`): another workspace's address is never honoured. A client-side replace, so
 *   the tab's sample world is kept (ADR-0004).
 * - **Single sign-on** opens ("Opening your institution’s sign-in…") and the port answers
 *   `policy-open` T-10 (no identity provider is decided): the notice "Institution sign-in isn’t
 *   available right now" takes the button's place and takes focus — no dead button.
 * - **XS-03**: `?reason=signed-out` and `?reason=expired` (with the return address in words) show
 *   their notice, which takes focus. Nothing in sample mode expires a session (P1-19, QT-13).
 * - **SES-09**: the service answers `policy-open` for an inactive Faculty member's sign-in; the
 *   card shows its refusal (the XS export draws no such state).
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
  const [firstTimeOpen, setFirstTimeOpen] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [mode, setMode] = useState<Mode>(
    reason === 'expired' ? 'expired' : reason === 'signed-out' ? 'signed-out' : 'normal',
  );
  const [singleSignOn, setSingleSignOn] = useState<SingleSignOn>('idle');
  /** Sent, and accepted: the card stays busy until the next page replaces it. */
  const [signingIn, setSigningIn] = useState(false);
  const focusAfter = useRef<string | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  const { replace } = navigation;
  const signedInRole: Role | null = session.status === 'signed-in' ? session.session.role : null;

  // The workspace's route focus counts this page as the previous address, so focus moves into
  // the workspace after signing in.
  useEffect(() => {
    noteEntryAddress(navigation.pathname);
  }, [navigation.pathname]);

  // Arriving signed out or with an ended session, the notice takes focus (XS-03).
  useEffect(() => {
    if (reason) document.getElementById(NOTE_ID)?.focus();
  }, [reason]);

  // Signed in — by this form, or already when the page opened — the person goes to their own
  // workspace: the validated return address or their role's home.
  useEffect(() => {
    if (signedInRole) replace(returnToFor(signedInRole, returnTo));
  }, [signedInRole, returnTo, replace]);

  // Focus moves after the state it targets has rendered.
  useEffect(() => {
    const target = focusAfter.current;
    if (!target) return;
    focusAfter.current = null;
    document.getElementById(target)?.focus();
  });

  if (signedInRole && !signingIn) {
    return <LoadingRows message={stateWords('shell.session-loading')} rows={0} />;
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
          if (mode === 'wrong-details' || mode === 'inactive') setMode('normal');
          // A summary still on screen from the last attempt takes focus again.
          summaryRef.current?.focus();
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
        // `unavailable` (thrown): no failure is drawn; the form keeps what was typed and Sign in
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
        // T-10: no identity provider is decided, so the port answers `policy-open`.
        if (!answer.ok) {
          setSingleSignOn('unavailable');
          focusAfter.current = SSO_NOTE_ID;
        }
      },
      () => setSingleSignOn('idle'),
    );
  };

  /** Typing again clears that field's error, and the refusal. */
  const edit = (field: keyof FieldErrors, value: string) => {
    if (field === 'email') setEmail(value);
    else setPassword(value);
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
    if (mode === 'wrong-details' || mode === 'inactive') setMode('normal');
  };

  const summary: ErrorSummaryItem[] = FIELD_ORDER.flatMap(([name, id]) => {
    const message = errors[name];
    return message ? [{ fieldId: id, summaryText: message }] : [];
  });
  const place = placeWordsOf(returnTo);

  return (
    <>
      <EntryCard
        foot={
          <>
            {SIGN_IN.needAccess}
            <TextLink href={SIGN_IN.requestAccessHref}>{SIGN_IN.requestAccess}</TextLink>
          </>
        }
      >
        {mode === 'signed-out' ? (
          <Notice
            tone="ok"
            icon="checkCircle"
            id={NOTE_ID}
            role="status"
            title={SIGN_IN_NOTICES.signedOut.title}
          />
        ) : null}
        {mode === 'expired' ? (
          <Notice
            tone="info"
            icon="clock"
            id={NOTE_ID}
            role="status"
            title={SIGN_IN_NOTICES.expired.title}
          >
            {place ? (
              <>
                {SIGN_IN_NOTICES.expired.before}
                <b>{place}</b>
                {SIGN_IN_NOTICES.expired.after}
              </>
            ) : (
              SIGN_IN_NOTICES.expired.withoutPlace
            )}
          </Notice>
        ) : null}
        {mode === 'wrong-details' ? (
          <RefusalSummary id={ALERT_ID} title={SIGN_IN_NOTICES.wrongDetails.title}>
            {SIGN_IN_NOTICES.wrongDetails.line}
          </RefusalSummary>
        ) : null}
        {mode === 'inactive' ? (
          <RefusalSummary id={ALERT_ID} title={SIGN_IN_NOTICES.inactive.title}>
            {SIGN_IN_NOTICES.inactive.line}
          </RefusalSummary>
        ) : null}
        <ErrorSummary ref={summaryRef} id={SUMMARY_ID} title={SIGN_IN.summary} items={summary} />
        <EntryHeading>{SIGN_IN.title}</EntryHeading>
        {singleSignOn === 'unavailable' ? (
          <Notice
            tone="info"
            icon="institutions"
            id={SSO_NOTE_ID}
            role="status"
            title={SIGN_IN_NOTICES.ssoUnavailable.title}
          >
            {SIGN_IN_NOTICES.ssoUnavailable.line}
          </Notice>
        ) : (
          <>
            <Button
              size="lg"
              block
              className="xs-sso"
              icon="institutions"
              iconSize={20}
              busy={singleSignOn === 'opening'}
              spinner
              busyLabel={SIGN_IN.ssoBusy}
              onClick={openSingleSignOn}
            >
              {SIGN_IN.sso}
            </Button>
            <OrRule>{SIGN_IN.or}</OrRule>
          </>
        )}
        <EntryForm label={SIGN_IN.formLabel} onSubmit={submit}>
          <Field id={EMAIL_ID} label={SIGN_IN.email} error={errors.email} errorPlacement="before">
            <TextInput
              type="email"
              autoComplete="username"
              inputMode="email"
              spellCheck={false}
              value={email}
              onChange={(event) => edit('email', event.target.value)}
            />
          </Field>
          <FieldRow>
            <Field
              id={PASSWORD_ID}
              label={SIGN_IN.password}
              error={errors.password}
              errorPlacement="before"
            >
              <PasswordInput
                autoComplete="current-password"
                value={password}
                onChange={(event) => edit('password', event.target.value)}
                shown={showPassword}
                onToggle={() => setShowPassword((shown) => !shown)}
                showLabel={SIGN_IN.show}
                hideLabel={SIGN_IN.hide}
                toggleSuffix={SIGN_IN.passwordSuffix}
              />
            </Field>
            <Disclosure
              id={FORGOT_ID}
              label={SIGN_IN.forgot}
              open={forgotOpen}
              onToggle={() => setForgotOpen((open) => !open)}
            >
              {SIGN_IN.forgotHint}
            </Disclosure>
          </FieldRow>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            block
            busy={busy}
            spinner
            busyLabel={SIGN_IN.busy}
          >
            {SIGN_IN.submit}
          </Button>
          <LiveStatus>{busy ? SIGN_IN.busyStatus : ''}</LiveStatus>
        </EntryForm>
        <TroubleLinks>
          <Disclosure
            id={FIRST_TIME_ID}
            label={SIGN_IN.firstTime}
            open={firstTimeOpen}
            onToggle={() => setFirstTimeOpen((open) => !open)}
          >
            {SIGN_IN.firstTimeHint}
          </Disclosure>
        </TroubleLinks>
      </EntryCard>
      <PrototypeNote lead={SIGN_IN.prototypeLead}>{SIGN_IN.prototypeLine}</PrototypeNote>
    </>
  );
}
