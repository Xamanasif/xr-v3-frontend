/**
 * XS-01 Sign in (with XS-03 and XS-04) on the real composition root and the spine-start sample
 * world, in the owner-approved Entry & shared design (design/v3-refined-b/roles/XS-v6, `XsSignIn`,
 * which keeps board B1-09's words; P1-01 / DV-3 sample sign-in): the session port signs a known
 * sample e-mail in with any non-empty password; its refusals are the drawn states; the session
 * store adopts the adapter's own session; the return address is honoured only inside the person's
 * own workspace; and nothing on the card names an account, a role or a workspace to choose.
 */
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messageFor } from '@xr/contracts/draft';
import { afterEach, describe, expect, it } from 'vitest';

import { board, xsExport } from '@/test-support/boards';
import { renderInTab, tabPlatform, testNavigation } from '@/test-support/workspace';

import { forgetLastAddress } from '../workspace-frame/route-focus';
import { SignIn } from './sign-in';

afterEach(() => {
  forgetLastAddress();
});

const B1_09 = board('B1-09-Sign-In.dc.html');
const XS_SIGN_IN = xsExport('XsSignIn.dc.html');
const ARJUN = 'arjun.mehta@wilp.example';
const KAVYA = 'kavya.nair@wilp.example';
/**
 * B1-09's reveal button: "Show" + `span.xr-sr` " password". jsdom's name computation trims the
 * span's leading space ("Showpassword"); Chromium reads "Show password" (browser suite).
 */
const SHOW = /^Show\s*password$/;
const HIDE = /^Hide\s*password$/;

async function openSignIn(search = '') {
  const { runtime, sample } = await tabPlatform(null, 'spine-start');
  const navigation = testNavigation('/sign-in', search);
  const view = renderInTab(<SignIn />, { runtime, navigation });
  return { runtime, sample, navigation, view };
}

function emailField(): HTMLInputElement {
  return screen.getByLabelText('E-mail');
}
function passwordField(): HTMLInputElement {
  return document.getElementById('sign-in-password') as HTMLInputElement;
}

describe('XS-01 — the card as the XS export draws it', () => {
  it('heading, single sign-on, the e-mail form, XS-04 — and nothing that names an account or role', async () => {
    await openSignIn();
    expect(screen.getByRole('heading', { level: 1, name: 'Sign in' })).toHaveClass('rb-h1 xs-fit');
    expect(screen.getByRole('button', { name: 'Sign in with your institution' })).toHaveClass(
      'rb-btn rb-btn--lg xs-block xs-sso',
    );
    expect(screen.getByText('or sign in with e-mail')).toHaveClass('xs-or');
    expect(screen.getByRole('form', { name: 'Sign in with e-mail' })).toBeVisible();
    expect(emailField()).toHaveAttribute('type', 'email');
    expect(emailField()).toHaveAttribute('autocomplete', 'username');
    expect(passwordField()).toHaveAttribute('type', 'password');
    expect(passwordField()).toHaveAttribute('autocomplete', 'current-password');
    expect(screen.getByRole('button', { name: SHOW })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Forgot your password?' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByRole('button', { name: 'Sign in' })).toHaveAttribute('type', 'submit');
    expect(screen.getByRole('button', { name: 'First time signing in?' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    // No DEMO strip, account list, role switcher, "Viewing as" or chooser. The one quiet
    // prototype line under the card names no account (XS HANDOFF §1.1 "Prototype line").
    const text = document.body.textContent ?? '';
    for (const forbidden of [/demo/i, /viewing as/i, /choose a workspace/i, /@wilp\.example/]) {
      expect(text).not.toMatch(forbidden);
    }
    expect(document.querySelectorAll('select')).toHaveLength(0);
    expect(document.querySelector('.xs-proto')).toHaveTextContent(
      'Prototype sign-in. Real accounts, password checks and institution single sign-on aren’t connected in this build. Sample accounts open with any password.',
    );
    // The words are the XS export's.
    for (const words of [
      'Sign in with your institution',
      'or sign in with e-mail',
      'Forgot your password?',
      'First time signing in?',
      'Official WILP logo',
      'XR Learning Platform',
      '<b>Prototype sign-in.</b> Real accounts, password checks and institution single sign-on aren’t connected in this build. Sample accounts open with any password.',
    ]) {
      expect(XS_SIGN_IN).toContain(words);
    }
  });

  it('Show / Hide reveals the password; XS-04 discloses who can help, and links nowhere', async () => {
    await openSignIn();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: SHOW }));
    expect(passwordField()).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: HIDE }));
    expect(passwordField()).toHaveAttribute('type', 'password');
    const forgot = screen.getByRole('button', { name: 'Forgot your password?' });
    await user.click(forgot);
    expect(forgot).toHaveAttribute('aria-expanded', 'true');
    const hint = screen.getByText('Contact your institution administrator to reset it.');
    expect(hint).toHaveAttribute('id', forgot.getAttribute('aria-controls'));
    expect(hint).toHaveClass('xs-disclose');
    expect(XS_SIGN_IN).toContain('Contact your institution administrator to reset it.');
    const firstTime = screen.getByRole('button', { name: 'First time signing in?' });
    await user.click(firstTime);
    expect(
      screen.getByText(
        'Contact your institution administrator to find out how to sign in for the first time.',
      ),
    ).toHaveAttribute('id', firstTime.getAttribute('aria-controls'));
    // XS-04 links nowhere; the card's one link is "Request institutional access" in its foot, to
    // the request form (PU-08), which sends a visitor with nothing selected to Your selection.
    expect(hint.querySelectorAll('a')).toHaveLength(0);
    expect(
      [...document.querySelectorAll('.xs-card a')].map((link) => [
        link.textContent,
        link.getAttribute('href'),
      ]),
    ).toEqual([['Request institutional access', '/request-access']]);
    expect(XS_SIGN_IN).toContain('Need access for your institution? <a class="rb-link"');
    expect(document.querySelector('.xs-card-foot')).toHaveTextContent(
      'Need access for your institution? Request institutional access',
    );
  });
});

describe('XS-01 — validation is the session port’s (XS “missing details”)', () => {
  it('empty: the summary takes focus and links each field; both fields’ words; nobody signed in', async () => {
    const { runtime } = await openSignIn();
    fireEvent.submit(screen.getByRole('form', { name: 'Sign in with e-mail' }));
    await waitFor(() => expect(emailField()).toHaveAttribute('aria-invalid', 'true'));
    const summary = await screen.findByRole('alert');
    expect(summary).toHaveClass('rk-errsum');
    expect(summary).toHaveTextContent('Check your sign-in details');
    expect(XS_SIGN_IN).toContain('Check your sign-in details');
    await waitFor(() => expect(summary).toHaveFocus());
    expect(
      [...summary.querySelectorAll('a')].map((link) => [
        link.textContent,
        link.getAttribute('href'),
      ]),
    ).toEqual([
      [messageFor('XS-01.email.required'), '#sign-in-email'],
      [messageFor('XS-01.password.required'), '#sign-in-password'],
    ]);
    expect(emailField()).toHaveAccessibleDescription('Enter your e-mail address');
    expect(passwordField()).toHaveAccessibleDescription('Enter your password');
    // The field's error sits between its label and the control, as the export draws it.
    expect(emailField().previousElementSibling).toHaveClass('rk-ferr');
    fireEvent.click(summary.querySelectorAll('a')[1]!);
    expect(passwordField()).toHaveFocus();
    expect(runtime.session.getSnapshot().status).toBe('signed-out');
  });

  it('an e-mail that is not one: B1-09’s format words; typing again clears them', async () => {
    await openSignIn();
    const user = userEvent.setup();
    await user.type(emailField(), 'arjun.mehta');
    await user.type(passwordField(), 'x');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await screen.findAllByText('Enter an e-mail address like name@institution.edu');
    expect(XS_SIGN_IN).toContain('Enter an e-mail address like name@institution.edu');
    await user.type(emailField(), '@');
    expect(screen.queryByText('Enter an e-mail address like name@institution.edu')).toBeNull();
  });
});

describe('XS-01 — “The e-mail or password isn’t right” (XS `invalid`; B1-09 f3)', () => {
  it('an unknown e-mail: the alert takes focus, the password is cleared, the e-mail kept', async () => {
    const { runtime } = await openSignIn();
    const user = userEvent.setup();
    await user.type(emailField(), 'nobody@godavari.edu.in');
    await user.type(passwordField(), 'any-password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveClass('rk-errsum');
    expect(alert).toHaveTextContent('The e-mail or password isn’t right');
    expect(alert).toHaveTextContent('Check both and try again.');
    expect(XS_SIGN_IN).toContain('The e-mail or password isn’t right');
    await waitFor(() => expect(alert).toHaveFocus());
    expect(passwordField()).toHaveValue('');
    expect(emailField()).toHaveValue('nobody@godavari.edu.in');
    expect(runtime.session.getSnapshot().status).toBe('signed-out');
    // Typing again clears the notice (B1-09 `onChange`).
    await user.type(passwordField(), 'y');
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('XS-01 — institution sign-in (XS `ssooff`; T-10 open)', () => {
  it('the port answers policy-open: the unavailable notice replaces the button and takes focus', async () => {
    const { runtime } = await openSignIn();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Sign in with your institution' }));
    const notice = (await screen.findByText('Institution sign-in isn’t available right now'))
      .parentElement!;
    expect(notice).toHaveClass('rk-notice rk-notice--info');
    expect(notice).toHaveAttribute('role', 'status');
    expect(screen.getByText('Sign in with your e-mail and password instead.')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Sign in with your institution' })).toBeNull();
    expect(screen.queryByText('or sign in with e-mail')).toBeNull();
    await waitFor(() => expect(notice).toHaveFocus());
    expect(runtime.session.getSnapshot().status).toBe('signed-out');
    expect(XS_SIGN_IN).toContain('Institution sign-in isn’t available right now');
    expect(B1_09).toContain('Institution sign-in isn’t available right now');
  });
});

describe('XS-01 — signing in through the session port (P1-01 / DV-3)', () => {
  it('Arjun Mehta: the adapter’s session is adopted, the cache cleared, the return address kept', async () => {
    const { runtime, navigation } = await openSignIn('?returnTo=%2Fadmin%2Frequests');
    const before = runtime.session.getSnapshot();
    const user = userEvent.setup();
    await user.type(emailField(), ARJUN);
    await user.type(passwordField(), 'any non-empty password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/admin/requests'));
    const after = runtime.session.getSnapshot();
    expect(after.status).toBe('signed-in');
    if (after.status !== 'signed-in') return;
    expect(after.personId).toBe('sa-arjun-mehta');
    expect(after.sessionKey).not.toBe(before.status === 'unknown' ? '' : before.sessionKey);
    // The session is the adapter's own answer to getSession (not the command's answer).
    const read = await runtime.ports.session.getSession();
    expect(read.ok && read.value?.session.sessionKey).toBe(after.sessionKey);
    // While leaving, the card stays busy (B1-09 f2 "cannot be sent twice").
    expect(screen.getByRole('button', { name: 'Signing in…' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('another workspace’s return address is never honoured: Kavya Nair lands on her own base', async () => {
    const { navigation } = await openSignIn('?returnTo=%2Fadmin%2Frequests');
    const user = userEvent.setup();
    await user.type(emailField(), KAVYA);
    await user.type(passwordField(), 'p');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/content-manager'));
  });

  it.each([
    ['https://evil.example/admin', '/admin'],
    ['//evil.example/admin/requests', '/admin'],
    ['/admin/requests/REQ-0038?x=1', '/admin/requests/REQ-0038?x=1'],
    ['/student/help', '/admin'],
    ['', '/admin'],
  ])('returnTo %j lands on %s (open redirects refused)', async (returnTo, landing) => {
    const { navigation } = await openSignIn(`?returnTo=${encodeURIComponent(returnTo)}`);
    const user = userEvent.setup();
    await user.type(emailField(), ARJUN);
    await user.type(passwordField(), 'p');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith(landing));
  });

  it('someone already signed in is sent to their own workspace (no form)', async () => {
    const { runtime } = await tabPlatform(null, 'spine-start');
    await act(async () => {
      await runtime.ports.session.signIn({ method: 'email', email: ARJUN, password: 'p' });
    });
    const navigation = testNavigation('/sign-in');
    renderInTab(<SignIn />, { runtime, navigation });
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/admin'));
    expect(screen.queryByRole('form')).toBeNull();
  });
});

describe('XS-03 — the notices on the same card (XS `signedout`, `expired`)', () => {
  it('?reason=signed-out: “You’re signed out”, confirmation only; it takes focus', async () => {
    await openSignIn('?reason=signed-out');
    const notice = screen.getByText('You’re signed out').closest('.rk-notice')!;
    expect(notice).toHaveClass('rk-notice--ok');
    expect(notice).toHaveAttribute('role', 'status');
    await waitFor(() => expect(notice).toHaveFocus());
    expect(screen.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible();
    expect(XS_SIGN_IN).toContain('You’re signed out');
  });

  it('?reason=expired: the return address in the page’s words, never the address', async () => {
    await openSignIn('?reason=expired&returnTo=%2Fadmin%2Frequests%2FREQ-0038');
    const notice = screen.getByText('Your session ended').closest('.rk-notice')!;
    expect(notice).toHaveClass('rk-notice--info');
    expect(notice).toHaveTextContent(
      'Sign in again to go back to where you were: Requests › REQ-0038.',
    );
    expect(notice.querySelector('b')).toHaveTextContent('Requests › REQ-0038');
    expect(notice).not.toHaveTextContent('/admin');
    await waitFor(() => expect(notice).toHaveFocus());
    expect(XS_SIGN_IN).toContain('Sign in again to go back to where you were: <b>');
  });

  it('?reason=expired with text that is not a page: no place, no injected words', async () => {
    await openSignIn(
      `?reason=expired&returnTo=${encodeURIComponent('/admin/requests/Enter your password at evil')}`,
    );
    const notice = screen.getByText('Your session ended').closest('.rk-notice')!;
    expect(notice).toHaveTextContent('Sign in again to go back to where you were: Requests.');
    expect(notice).not.toHaveTextContent('evil');
  });

  it('an unknown reason shows no notice', async () => {
    await openSignIn('?reason=anything');
    expect(document.querySelector('.rk-notice')).toBeNull();
  });
});
