/**
 * XS-07 Help & support on the real composition root and the shared sample world (Appendix F
 * WP-0.13 acceptance 2; the owner-approved XS export's `XsHelp`, which keeps board 07's words): My
 * reports lists the signed-in person's own reports only; the report form sends through
 * `useCommand` and the service's validation; "Report sent" carries the reference the world gave
 * the new report — none for a Super Admin (owner decision 6); the detail reads it back with its
 * history; another person's report is not found; and the same world serves the next person signed
 * in in the tab.
 */
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messageFor, summaryTitleFor } from '@xr/contracts/draft';
import type { Role } from '@xr/domain';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { forgetPageVisits, recordPageVisit } from '@/nav/page-location';
import type { PlatformRuntime } from '@/platform/runtime';
import { board, xsExport } from '@/test-support/boards';
import {
  PERSON_OF_ROLE,
  renderInTab,
  tabPlatform,
  TestNotFoundBoundary,
  testNavigation,
} from '@/test-support/workspace';

import { WorkspaceNotFound } from '../pu-15-not-found/not-found';
import { forgetLastAddress } from '../workspace-frame/route-focus';
import { WorkspaceLayout } from '../workspace-frame/workspace-frame';
import { HelpHome } from './help-home';
import { ReportDetail } from './report-detail';
import { ReportProblem } from './report-problem';

afterEach(() => {
  forgetPageVisits();
  forgetLastAddress();
});

const BOARD_07 = board('07-Help-Support.dc.html');
const XS_HELP = xsExport('XsHelp.dc.html');

function inWorkspace(runtime: PlatformRuntime, path: string, page: ReactNode) {
  const workspace = path.split('/')[1] as 'student';
  const navigation = testNavigation(path);
  const view = renderInTab(
    <WorkspaceLayout workspace={workspace}>
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>{page}</TestNotFoundBoundary>
    </WorkspaceLayout>,
    { runtime, navigation },
  );
  return { navigation, view };
}

/**
 * The My reports rows (`a.xs-report` in the V3 region of the shell's main: `main.xr-page` in a v46
 * role shell, `main.rb-page` in the Super Admin's V3 shell).
 */
async function reportRows(): Promise<HTMLElement[]> {
  // The session's loading state has a `main` of its own until the shell renders: query afresh.
  await waitFor(() =>
    expect(document.querySelector('main#main .rk-x-region ul.xs-reports')).not.toBeNull(),
  );
  return [...document.querySelectorAll<HTMLElement>('main#main ul.xs-reports a.xs-report')];
}

async function signedIn(role: Role, fixture: 'after-flow-d' | 'spine-start' = 'after-flow-d') {
  return tabPlatform(PERSON_OF_ROLE[role], fixture);
}

describe('My reports — the person’s own reports (board 07 "State 2")', () => {
  it('Rahul (Student) sees SUP-0213 only: title excerpt, reference, sent date, status in words', async () => {
    const { runtime } = await signedIn('student');
    inWorkspace(runtime, '/student/help', <HelpHome />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Help & support' })).toBeVisible();
    const rows = await reportRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveAttribute('href', '/student/help/reports/SUP-0213');
    expect(rows[0]).toHaveTextContent('The VR simulation stopped loading at the second step');
    expect(rows[0]).toHaveTextContent('SUP-0213 · Sent 16 Oct 2026');
    expect(rows[0]!.querySelector('.xr-st')).toHaveTextContent('Open');
    expect(screen.getByText('1 report · newest first')).toBeVisible();
    expect(XS_HELP).toContain("(rows.length === 1 ? ' report' : ' reports') + ' · newest first'");
    // The header carries "Report a problem" while there are reports.
    expect(screen.getByRole('link', { name: 'Report a problem' })).toHaveAttribute(
      'href',
      '/student/help/report',
    );
    // Help is current in the sidebar foot; the top bar reads "Help & support".
    await waitFor(() =>
      expect(document.querySelector('.xr-side-foot a')).toHaveAttribute('aria-current', 'page'),
    );
    expect(document.title).toBe('Help & support · XR Learning Platform');
  });

  it('Kavya (Content Manager) sees SUP-0207 reopened, and nobody else’s', async () => {
    const { runtime } = await signedIn('content_manager');
    inWorkspace(runtime, '/content-manager/help', <HelpHome />);
    const rows = await reportRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent('SUP-0207 · Sent 28 Sep 2026 · Reopened 6 Oct 2026');
    expect(rows[0]!.querySelector('.xr-st')).toHaveTextContent('Reopened');
  });

  it('Arjun (Super Admin): no reference anywhere in Help (owner decision 6; XS showRefs=false)', async () => {
    const { runtime } = await signedIn('super_admin');
    const sent = await runtime.ports.operations.reportProblem({
      whatHappened: 'The renewal list stopped loading.',
      where: 'Overview',
      screenshotFileName: null,
    });
    if (!sent.ok) throw new Error('reportProblem refused');
    const list = inWorkspace(runtime, '/admin/help', <HelpHome />);
    const rows = await reportRows();
    expect(rows[0]).toHaveTextContent(/^The renewal list stopped loading\s*Sent \d+ \w+ 2026/);
    expect(document.querySelector('main')!.textContent).not.toMatch(/SUP-/);
    list.view.unmount();
    inWorkspace(
      runtime,
      `/admin/help/reports/${sent.value.id}`,
      <ReportDetail reportId={sent.value.id} />,
    );
    await screen.findByRole('heading', { level: 1, name: 'The renewal list stopped loading' });
    expect(document.querySelector('main')!.textContent).not.toMatch(/SUP-/);
    await waitFor(() =>
      expect(document.title).toBe('The renewal list stopped loading · XR Learning Platform'),
    );
  });

  it('Anil (Vendor) has none: the empty state carries "Report a problem" (XS; board 07 "State 2a")', async () => {
    expect(XS_HELP).toContain('<p class="rk-state-t">No reports yet</p>');
    expect(BOARD_07).toContain('<h3 class="xr-h3">No reports yet</h3>');
    const { runtime } = await signedIn('vendor');
    inWorkspace(runtime, '/vendor/help', <HelpHome />);
    const empty = (await screen.findByText('No reports yet')).closest('.rk-state')!;
    expect(empty).toHaveTextContent('If something isn’t working, report it and follow it here.');
    expect(within(screen.getByRole('main')).queryByRole('list')).toBeNull();
    const report = screen.getByRole('link', { name: 'Report a problem' });
    expect(report.closest('.rk-state')).toBe(empty);
    expect(report).toHaveAttribute('href', '/vendor/help/report');
  });
});

describe('Report a problem — through the service (board 07 "State 1", "1a", "1b", "1c")', () => {
  it('"Where did it happen?" is filled in from the page the person came from', async () => {
    const { runtime } = await signedIn('student');
    recordPageVisit(PERSON_OF_ROLE.student, { words: ['Not found'], help: false });
    inWorkspace(runtime, '/student/help/report', <ReportProblem />);
    expect(await screen.findByLabelText('Where did it happen?')).toHaveValue('Not found');
    expect(
      screen.getByText('Filled in from the page you came from. Change it if needed.'),
    ).toBeVisible();
    // No category field (P0-34): what happened, where, screenshot — nothing else.
    expect(screen.getAllByRole('textbox').map((box) => box.getAttribute('id'))).toHaveLength(2);
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.queryByRole('radio')).toBeNull();
  });

  it('an empty "What happened" is refused by the service with the drawn words; nothing is written', async () => {
    const { runtime, sample } = await signedIn('student');
    const before = await runtime.ports.operations.listMyReports();
    inWorkspace(runtime, '/student/help/report', <ReportProblem />);
    fireEvent.click(await screen.findByRole('button', { name: 'Send report' }));
    const summary = await screen.findByRole('alert');
    // The service's own words (contract copy catalogue) are the ones drawn on board 07.
    expect(summaryTitleFor('XS-07', 1)).toBe('One thing needs fixing');
    expect(messageFor('XS-07.whatHappened.required')).toBe(
      'Say what happened, so it can be looked into',
    );
    expect(summary).toHaveTextContent('One thing needs fixing');
    expect(within(summary).getByRole('link', { name: 'Say what happened' })).toBeVisible();
    expect(screen.getByText('Say what happened, so it can be looked into')).toBeVisible();
    expect(screen.getByLabelText('What happened?')).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(document.activeElement).toBe(summary));
    expect(await runtime.ports.operations.listMyReports()).toEqual(before);
    expect(sample).toBeDefined();
  });

  it('sends once, then "Report sent" in place with the reference the shared world gave it', async () => {
    const user = userEvent.setup();
    const { runtime } = await signedIn('student');
    recordPageVisit(PERSON_OF_ROLE.student, { words: ['Not your workspace'], help: false });
    inWorkspace(runtime, '/student/help/report', <ReportProblem />);
    await user.type(await screen.findByLabelText('What happened?'), '  The Help page froze.  ');
    const file = new File(['png bytes'], 'frozen-help.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText(/^Screenshot/), file);
    await user.click(screen.getByRole('button', { name: 'Send report' }));
    const sent = await screen.findByRole('heading', { level: 1, name: 'Report sent' });
    const message = sent.closest('.xs-msg') as HTMLElement;
    const reference = within(message).getByText(/^SUP-\d{4}$/).textContent!;
    expect(reference).not.toBe('SUP-0213');
    expect(message).toHaveTextContent(
      `Your reference is ${reference}. You can follow it in My reports.`,
    );
    expect(within(message).getByRole('link', { name: 'View my reports' })).toHaveAttribute(
      'href',
      '/student/help',
    );
    expect(within(message).getByRole('link', { name: 'Back to Home' })).toHaveAttribute(
      'href',
      '/student',
    );
    await waitFor(() => expect(document.activeElement).toBe(sent));
    await waitFor(() => expect(document.title).toBe('Report sent · XR Learning Platform'));
    // The shared world holds it, as sent: trimmed text, the place, the file NAME only.
    const mine = await runtime.ports.operations.listMyReports();
    if (!mine.ok) throw new Error('listMyReports refused');
    const saved = mine.value.find((report) => report.id === reference)!;
    expect(saved).toMatchObject({
      whatHappened: 'The Help page froze.',
      where: 'Not your workspace',
      screenshotFileName: 'frozen-help.png',
      state: 'open',
    });
    expect(JSON.stringify(saved)).not.toContain('png bytes');
  });
});

describe('Report detail (board 07 "State 3", "State 3a")', () => {
  it('reopened: "This report is open again", what was reported, history last; no Reopen control', async () => {
    const { runtime } = await signedIn('content_manager');
    inWorkspace(
      runtime,
      '/content-manager/help/reports/SUP-0207',
      <ReportDetail reportId="SUP-0207" />,
    );
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'The preview of the WEB delivery link showed an empty frame',
      }),
    ).toBeVisible();
    expect(screen.getByText('SUP-0207', { selector: '.rk-head .rk-eyebrow' })).toBeVisible();
    expect(screen.getByText('Sent 28 Sep 2026')).toBeVisible();
    expect(screen.getByText('This report is open again')).toBeVisible();
    expect(
      screen.getByText('It was reopened on 6 Oct 2026. You can follow it here.'),
    ).toBeVisible();
    const history = document.querySelector('.rk-sec:last-child .rk-tl') as HTMLElement;
    expect(history.closest('.rk-sec')?.querySelector('h2')).toHaveTextContent('History');
    expect(
      within(history)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([
      'Reopened6 Oct 2026',
      'Resolved30 Sep 2026“The preview now loads. Please try again.”',
      'Sent28 Sep 2026',
    ]);
    const reported = screen.getByRole('region', { name: 'Report' });
    expect(within(reported).getByText('No screenshot added')).toBeVisible();
    expect(screen.queryByRole('button', { name: /reopen/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /reopen/i })).toBeNull();
  });

  it('resolved: the resolution note first (spine-start SUP-0207)', async () => {
    const { runtime } = await signedIn('content_manager', 'spine-start');
    inWorkspace(
      runtime,
      '/content-manager/help/reports/SUP-0207',
      <ReportDetail reportId="SUP-0207" />,
    );
    const note = await screen.findByText('Resolution note · 30 Sep 2026');
    expect(note.closest('.rk-notice')).toHaveClass('rk-notice--ok');
    expect(note.closest('.rk-notice')).toHaveTextContent(
      '“The preview now loads. Please try again.”',
    );
    expect(screen.queryByText('This report is open again')).toBeNull();
  });

  it('another person’s report, and an unknown reference, are not found (existence not revealed)', async () => {
    for (const reportId of [
      'SUP-0207',
      'SUP-9999',
      'not-a-reference',
      'constructor',
      '__proto__',
    ]) {
      const { runtime } = await signedIn('student');
      const { view } = inWorkspace(
        runtime,
        `/student/help/reports/${reportId}`,
        <ReportDetail reportId={reportId} />,
      );
      expect(
        await screen.findByRole('heading', { level: 1, name: 'We can’t find that page' }),
      ).toBeVisible();
      expect(document.body.textContent).not.toContain('Kavya');
      expect(document.body.textContent).not.toContain('preview');
      view.unmount();
    }
  });
});

describe('one shared world across identity changes in the tab (ADR-0004 option A)', () => {
  it('Rahul’s new report is his alone; the next person signed in reads only their own', async () => {
    const { runtime } = await signedIn('student');
    const sent = await runtime.ports.operations.reportProblem({
      whatHappened: 'The Help page froze.',
      where: null,
      screenshotFileName: null,
    });
    if (!sent.ok) throw new Error('reportProblem refused');
    const first = inWorkspace(runtime, '/student/help', <HelpHome />);
    expect((await reportRows()).map((row) => row.getAttribute('href'))).toEqual([
      `/student/help/reports/${sent.value.id}`,
      '/student/help/reports/SUP-0213',
    ]);
    first.view.unmount();

    // Sign out, then sign in as Kavya through the session port: same platform, same world.
    await act(async () => {
      await runtime.ports.session.signOut();
      await runtime.ports.session.signIn({
        method: 'email',
        email: 'kavya.nair@wilp.example',
        password: 'any-sample-password',
      });
    });
    expect(
      runtime.queryClient
        .getQueryCache()
        .getAll()
        .every((query) => !String(query.queryKey[1]).includes('per-0002')),
    ).toBe(true);
    inWorkspace(runtime, '/content-manager/help', <HelpHome />);
    const rows = await reportRows();
    expect(rows.map((row) => row.getAttribute('href'))).toEqual([
      '/content-manager/help/reports/SUP-0207',
    ]);
    // Rahul's report is still in the world (read as him, in a session of his own).
    const answer = await runtime.ports.session.getSession();
    expect(answer.ok && answer.value?.session.displayName).toBe('Kavya Nair');
  });
});
