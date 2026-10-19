/**
 * The Entry & shared components (owner-approved export design/v3-refined-b/roles/XS-v6): the
 * sign-in card's pieces, the account menu with both triggers, the message page, the Help pieces,
 * the V3 region and the access banner. Markup against the export's classes, the XS keyboard
 * contract, the class contract and the accessibility checks.
 */
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  assertNoAxeViolations,
  expectNoInternalReferences,
  expectV3ClassesOnly,
  xsExportText,
} from '../testing/index.js';
import { AccountMenu, AccountMenuInV46Shell, accountMenuName } from './account.js';
import { Button } from './actions.js';
import { Timeline } from './detail.js';
import {
  Disclosure,
  EntryCard,
  EntryForm,
  EntryHeading,
  EntryPage,
  FieldRow,
  LiveStatus,
  OrRule,
  PasswordInput,
  PrototypeNote,
  RefusalSummary,
  TroubleLinks,
} from './entry.js';
import { ErrorSummary, Field, Textarea, TextInput } from './fields.js';
import {
  FileInput,
  FormActions,
  HelpColumn,
  HelpFoot,
  OptionalMark,
  ReportFormSurface,
  ReportListSurface,
  ReportRows,
  ReportSection,
} from './help.js';
import { LoadingRows } from './list.js';
import { MessagePage } from './message.js';
import { Banner } from './notices.js';
import { V3Region } from './region.js';

describe('the sign-in card (XS-01, XS-03, XS-04)', () => {
  function SignInCard({ busy = false }: { readonly busy?: boolean }) {
    const [shown, setShown] = useState(false);
    const [forgot, setForgot] = useState(false);
    return (
      <EntryPage back={{ href: '/', label: 'Back to experiments' }}>
        <EntryCard
          foot={
            <>
              Need access for your institution? <a href="/selection">Request access</a>
            </>
          }
        >
          <RefusalSummary id="alert" title="The e-mail or password isn’t right">
            Check both and try again.
          </RefusalSummary>
          <EntryHeading id="title">Sign in</EntryHeading>
          <Button size="lg" block icon="institutions" className="xs-sso">
            Sign in with your institution
          </Button>
          <OrRule>or sign in with e-mail</OrRule>
          <EntryForm label="Sign in with e-mail" onSubmit={(event) => event.preventDefault()}>
            <Field id="email" label="E-mail" errorPlacement="before" error="Enter your e-mail">
              <TextInput type="email" />
            </Field>
            <FieldRow>
              <Field id="pw" label="Password">
                <PasswordInput
                  shown={shown}
                  onToggle={() => setShown((value) => !value)}
                  showLabel="Show"
                  hideLabel="Hide"
                  toggleSuffix=" password"
                />
              </Field>
              <Disclosure
                id="forgot"
                label="Forgot your password?"
                open={forgot}
                onToggle={() => setForgot((value) => !value)}
              >
                Contact your institution administrator to reset it.
              </Disclosure>
            </FieldRow>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              block
              busy={busy}
              spinner
              busyLabel="Signing in…"
            >
              Sign in
            </Button>
            <LiveStatus>{busy ? 'Signing in' : ''}</LiveStatus>
          </EntryForm>
          <TroubleLinks>
            <Disclosure id="first" label="First time signing in?" open={false} onToggle={vi.fn()}>
              Contact your institution administrator.
            </Disclosure>
          </TroubleLinks>
        </EntryCard>
        <PrototypeNote lead="Prototype sign-in.">
          Sample accounts open with any password.
        </PrototypeNote>
      </EntryPage>
    );
  }

  it('is a whole V3 page with the export’s structure and classes', () => {
    const { container } = render(<SignInCard />);
    const root = container.firstElementChild!;
    expect(root.className).toBe('xr rb');
    expect(root.querySelector('.xs-entry > header.xs-entry-top > a.xs-back')?.textContent).toBe(
      'Back to experiments',
    );
    expect(
      root.querySelector('main.xs-entry-main > div.xs-card > div.xs-card-head'),
    ).not.toBeNull();
    expect(root.querySelector('.xs-card-head .rb-logo')?.textContent).toBe('Official WILP logo');
    expect(screen.getByRole('heading', { level: 1 }).className).toBe('rb-h1 xs-fit');
    expect(screen.getByRole('alert').className).toBe('rk-errsum');
    // The field error sits between the label and the control, as the export draws it.
    const email = screen.getByLabelText('E-mail');
    expect(email.previousElementSibling?.className).toBe('rk-ferr');
    expect(email.getAttribute('aria-invalid')).toBe('true');
    expectV3ClassesOnly(root);
  });

  it('Show / Hide reveals the password and names the field it controls', () => {
    render(<SignInCard />);
    const password = screen.getByLabelText('Password');
    expect(password.getAttribute('type')).toBe('password');
    // jsdom trims the hidden span's leading space ("Showpassword"); Chromium reads "Show password".
    const toggle = screen.getByRole('button', { name: /^Show\s*password$/ });
    expect(toggle.getAttribute('aria-controls')).toBe('pw');
    act(() => toggle.click());
    expect(password.getAttribute('type')).toBe('text');
    expect(screen.getByRole('button', { name: /^Hide\s*password$/ })).toBeTruthy();
  });

  it('a disclosure shows its answer in place (XS-04: a contact route, nothing sent)', () => {
    render(<SignInCard />);
    const forgot = screen.getByRole('button', { name: 'Forgot your password?' });
    expect(forgot.getAttribute('aria-expanded')).toBe('false');
    act(() => forgot.click());
    expect(forgot.getAttribute('aria-expanded')).toBe('true');
    expect(document.getElementById('forgot')?.className).toBe('xs-disclose');
  });

  it('busy: the turning ring and the progress cursor, the press ignored', () => {
    render(<SignInCard busy />);
    const submit = screen.getByRole('button', { name: 'Signing in…' });
    expect(submit.className).toBe('rb-btn rb-btn--primary rb-btn--lg xs-block xs-busy');
    expect(submit.getAttribute('aria-disabled')).toBe('true');
    expect(submit.firstElementChild?.className).toBe('xs-spin');
    expect(screen.getAllByRole('status').some((node) => node.textContent === 'Signing in')).toBe(
      true,
    );
  });

  it('the export draws the same parts', () => {
    const source = xsExportText('XsSignIn.dc.html');
    for (const part of [
      'class="xs-entry-top"',
      'class="xs-back"',
      'class="xs-card-head"',
      'class="xs-logo-box"',
      'class="xs-or"',
      'class="xs-form"',
      'class="xs-pw"',
      'class="xs-pw-toggle"',
      'class="xs-linkbtn"',
      'class="xs-disclose"',
      'class="xs-trouble"',
      'class="xs-card-foot"',
      'class="xs-proto"',
      'class="xs-live"',
      'rb-btn rb-btn--lg xs-block xs-sso',
    ]) {
      expect(source, part).toContain(part);
    }
  });

  it('has no axe violations', async () => {
    const { container } = render(<SignInCard />);
    await assertNoAxeViolations(container);
  });
});

const LINKS = [
  { label: 'My device', href: '/student/device', icon: 'headset' as const },
  { label: 'Help & support', href: '/student/help', icon: 'help' as const },
];

describe('the account menu (XS-05)', () => {
  it('names the person, role and organisation', () => {
    expect(accountMenuName('Meera Iyer', 'Institute Admin', 'Godavari')).toBe(
      'Account menu, Meera Iyer, Institute Admin, Godavari',
    );
    expect(accountMenuName('Arjun Mehta', 'Super Admin')).toBe(
      'Account menu, Arjun Mehta, Super Admin',
    );
  });

  it.each([
    ['V3 trigger', AccountMenu, 'rb-acct'],
    ['v46 trigger', AccountMenuInV46Shell, 'xr-acct-btn'],
  ] as const)('%s: one XS panel, keys as the export defines them', (_, Menu, triggerClass) => {
    const signOut = vi.fn();
    render(
      <>
        <Menu
          name="Rahul Verma"
          role="Student"
          organisation="Godavari Institute of Technology"
          initials="RV"
          links={LINKS}
          signOut={{ label: 'Sign out', onSelect: signOut }}
        />
        <button type="button">After</button>
      </>,
    );
    const trigger = screen.getByRole('button', {
      name: 'Account menu, Rahul Verma, Student, Godavari Institute of Technology',
    });
    expect(trigger.className).toBe(triggerClass);
    // Enter / click opens it and moves focus to the first item.
    act(() => trigger.click());
    const panel = document.getElementById(trigger.getAttribute('aria-controls')!)!;
    expect(panel.className).toBe('xs-menu xs-nofocus');
    const list = within(panel).getByRole('list', { name: 'Account' });
    const device = within(list).getByRole('link', { name: 'My device' });
    const help = within(list).getByRole('link', { name: 'Help & support' });
    const out = within(panel).getByRole('button', { name: 'Sign out' });
    expect(out.parentElement?.className).toBe('xs-menu-foot');
    expect(document.activeElement).toBe(device);
    expect(panel.querySelector('.xs-menu-org')?.textContent).toBe(
      'Godavari Institute of Technology',
    );
    // ArrowDown / ArrowUp wrap; Home / End.
    fireEvent.keyDown(device, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(help);
    fireEvent.keyDown(help, { key: 'End' });
    expect(document.activeElement).toBe(out);
    fireEvent.keyDown(out, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(device);
    fireEvent.keyDown(device, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(out);
    fireEvent.keyDown(out, { key: 'Home' });
    expect(document.activeElement).toBe(device);
    // Escape closes and returns focus to the button.
    fireEvent.keyDown(device, { key: 'Escape' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
    // ArrowDown on the closed button opens it on the first item.
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement?.textContent).toBe('My device');
    // The outside-click layer closes it and returns focus to the button.
    const catcher = screen.getByRole('button', { name: 'Close account menu' });
    expect(catcher.getAttribute('tabindex')).toBe('-1');
    act(() => catcher.click());
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
    // Tab past the last item closes it without pulling focus back.
    act(() => trigger.click());
    const after = screen.getByRole('button', { name: 'After' });
    fireEvent.blur(screen.getByRole('button', { name: 'Sign out' }), { relatedTarget: after });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    // Sign out closes the menu and calls the caller's command.
    act(() => trigger.click());
    act(() => screen.getByRole('button', { name: 'Sign out' }).click());
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('the v46-shell variant puts the panel in a V3 root that draws no box (V3P-10)', () => {
    render(
      <AccountMenuInV46Shell
        name="Arjun Mehta"
        role="Super Admin"
        initials="AM"
        links={[{ label: 'Help & support', href: '/admin/help', icon: 'help' }]}
        signOut={{ label: 'Sign out', onSelect: vi.fn() }}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Account menu, Arjun Mehta, Super Admin' });
    expect(trigger.parentElement?.className).toBe('xr-acct');
    act(() => trigger.click());
    const popover = document.querySelector('.rk-x-popover')!;
    expect(popover.className).toBe('xr rb rk-x-popover');
    expect(popover.parentElement).toBe(trigger.parentElement);
    expectV3ClassesOnly(popover);
    expect(popover.querySelector('.xs-menu-org')).toBeNull();
    expectNoInternalReferences(popover);
  });

  it('has no axe violations, open', async () => {
    const { container } = render(
      <AccountMenu
        name="Kavya Nair"
        role="Content Manager"
        initials="KN"
        links={[{ label: 'Help & support', href: '/content-manager/help', icon: 'help' }]}
        signOut={{ label: 'Sign out', onSelect: vi.fn() }}
      />,
    );
    act(() => screen.getByRole('button').click());
    await assertNoAxeViolations(container);
  });
});

describe('the message page (XS-06, XS-08 refusals, Report sent)', () => {
  it.each([
    ['not-allowed', 'xs-msg-ico'],
    ['paused', 'xs-msg-ico xs-msg-ico--paused'],
    ['inactive', 'xs-msg-ico xs-msg-ico--off'],
    ['done', 'xs-msg-ico xs-msg-ico--ok'],
  ] as const)('%s', async (kind, disc) => {
    const { container } = render(
      <V3Region>
        <MessagePage
          kind={kind}
          title="This page isn’t part of your workspace"
          titleId="msg-title"
          primary={{ href: '/institute', label: 'Back to Overview' }}
          secondary={{ href: '/institute/help', label: 'Help' }}
        >
          You’re signed in to the Institute Admin workspace.
        </MessagePage>
      </V3Region>,
    );
    const section = screen.getByRole('region', { name: 'This page isn’t part of your workspace' });
    expect(section.className).toBe('xs-msg');
    expect(section.firstElementChild?.className).toBe(disc);
    const title = screen.getByRole('heading', { level: 1 });
    expect(title.getAttribute('tabindex')).toBe('-1');
    expect(screen.getByRole('link', { name: 'Back to Overview' }).className).toBe(
      'rb-btn rb-btn--primary rb-btn--lg',
    );
    expect(screen.getByRole('link', { name: 'Help' }).className).toBe('rb-link');
    expectV3ClassesOnly(container.firstElementChild!);
    await assertNoAxeViolations(container);
  });
});

describe('Help & support (XS-07)', () => {
  it('My reports: the rows with their status, newest first', async () => {
    const { container } = render(
      <V3Region>
        <HelpColumn>
          <ReportListSurface title="My reports" titleId="mine" note="2 reports · newest first">
            <ReportRows
              rows={[
                {
                  href: '/institute/help/reports/a',
                  title: 'Student import stopped part-way',
                  meta: 'SUP-0211 · Sent 1 Oct 2026 · Reopened 6 Oct 2026',
                  status: { tone: 'info', label: 'Reopened' },
                },
                {
                  href: '/institute/help/reports/b',
                  title: 'Group name didn’t save',
                  meta: 'SUP-0189 · Sent 15 Sep 2026 · Resolved 18 Sep 2026',
                  status: { tone: 'ok', label: 'Resolved' },
                },
              ]}
            />
          </ReportListSurface>
        </HelpColumn>
      </V3Region>,
    );
    expect(container.querySelector('.xs-read > section.rk-surface > .xs-sec-h')).not.toBeNull();
    const rows = container.querySelectorAll('ul.xs-reports > li > a.xs-report');
    expect(rows).toHaveLength(2);
    expect(rows[0]!.querySelector('.xr-st')?.className).toBe('xr-st xr-st--info');
    expect(rows[1]!.querySelector('.xr-st')?.className).toBe('xr-st xr-st--ok');
    expectV3ClassesOnly(container.firstElementChild!);
    await assertNoAxeViolations(container);
  });

  it('the loading skeleton draws two cells per row', () => {
    const { container } = render(
      <V3Region>
        <LoadingRows message="Loading your reports…" cells={[2, 1]} />
      </V3Region>,
    );
    const row = container.querySelector('.rk-skel-row')!;
    expect([...row.children].map((cell) => cell.querySelectorAll('.rk-skel').length)).toEqual([
      2, 1,
    ]);
  });

  it('Report a problem: the form, its error summary and fields, the actions', async () => {
    const { container } = render(
      <V3Region>
        <HelpColumn>
          <h1 id="form-title">Report a problem</h1>
          <ReportFormSurface labelledBy="form-title" onSubmit={(event) => event.preventDefault()}>
            <ErrorSummary
              title="One thing needs fixing"
              items={[{ fieldId: 'what', summaryText: 'Say what happened' }]}
            />
            <Field
              id="what"
              label="What happened?"
              hint="Say what you were doing and what you saw."
              error="Say what happened, so it can be looked into"
              errorPlacement="before"
            >
              <Textarea rows={5} />
            </Field>
            <Field
              id="shot"
              label={
                <>
                  Screenshot <OptionalMark>(optional)</OptionalMark>
                </>
              }
              hint="A picture of the screen can help."
            >
              <FileInput accept="image/*" />
            </Field>
            <FormActions>
              <Button type="submit" variant="primary" size="lg">
                Send report
              </Button>
            </FormActions>
          </ReportFormSurface>
        </HelpColumn>
      </V3Region>,
    );
    const form = screen.getByRole('form', { name: 'Report a problem' });
    expect(form.className).toBe('rk-surface xs-form-surface');
    const what = screen.getByLabelText('What happened?');
    expect(what.getAttribute('aria-describedby')).toBe('what-h what-e');
    expect(screen.getByLabelText(/Screenshot/).className).toBe('xs-file');
    expectV3ClassesOnly(container.firstElementChild!);
    await assertNoAxeViolations(container);
  });

  it('a report: its sections and history, the foot', () => {
    const { container } = render(
      <V3Region>
        <HelpColumn>
          <ReportSection title="History" note="Newest first">
            <Timeline events={[{ what: 'Resolved', when: '18 Sep 2026', note: '“Saved.”' }]} />
          </ReportSection>
          <HelpFoot>
            Something else isn’t working? <a href="/x">Report a problem</a>
          </HelpFoot>
        </HelpColumn>
      </V3Region>,
    );
    expect(container.querySelector('.rk-sec > .rk-sec-h > h2.rk-h3')?.textContent).toBe('History');
    expect(container.querySelector('p.xs-help-foot')).not.toBeNull();
  });
});

describe('the V3 region and the access banner (V3P-09, XS-08)', () => {
  it('a region is a V3 root, never a shell', () => {
    const { container } = render(<V3Region>x</V3Region>);
    expect(container.firstElementChild?.className).toBe('xr rb rk-x-region');
  });

  it('paused and inactive banners', () => {
    const { container } = render(
      <V3Region>
        <Banner action={<a href="/student/help">Help</a>}>
          Your institution’s access is paused — your work is kept.
        </Banner>
        <Banner tone="inactive" action={<a href="/student/help">Help</a>}>
          Your account is inactive. Contact your institution administrator.
        </Banner>
      </V3Region>,
    );
    const banners = screen.getAllByRole('status');
    expect(banners.map((banner) => banner.className)).toEqual([
      'rk-banner',
      'rk-banner xs-banner--inactive',
    ]);
    expectV3ClassesOnly(container.firstElementChild!);
  });
});
