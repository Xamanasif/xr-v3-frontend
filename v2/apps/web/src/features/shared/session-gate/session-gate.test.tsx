/**
 * The session gate and signing out (Appendix F §3.3 notes, §5.2 "Session gate"; ADR-0003 §6;
 * WP-0.13 acceptance 5): the loading state while the tab's session resolves; a signed-out visitor
 * sent to `/sign-in?returnTo=<the address>`; "Sign out" in the account menu runs the session
 * port's command, clears the query cache, and leaves with `reason=signed-out` — the shared world
 * is kept (ADR-0004 option A).
 */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { asPersonId } from '@xr/sample-platform/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { PlatformRuntimeProvider } from '@/platform/platform-provider';
import { createQueryClient } from '@/platform/runtime';
import { PERSON_OF_ROLE, renderInTab, tabPlatform, testNavigation } from '@/test-support/workspace';
import { render } from '@testing-library/react';

import { forgetLastAddress } from '../workspace-frame/route-focus';
import { WorkspaceLayout } from '../workspace-frame/workspace-frame';
import { HelpHome } from '../xs-07-help/help-home';
import { NavigationProvider } from '@/nav/navigation';

afterEach(() => forgetLastAddress());

describe('SessionGate', () => {
  it('while the tab’s platform boots: the loading state, announced; nothing of any shell', () => {
    const navigation = testNavigation('/student/help');
    render(
      <PlatformRuntimeProvider runtime={null} queryClient={createQueryClient('sample')}>
        <NavigationProvider value={navigation}>
          <WorkspaceLayout workspace="student">
            <p>page</p>
          </WorkspaceLayout>
        </NavigationProvider>
      </PlatformRuntimeProvider>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Loading …');
    expect(screen.queryByText('page')).toBeNull();
    expect(screen.queryByRole('complementary')).toBeNull();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('signed out: replaced with /sign-in?returnTo=<the address asked for>, once', async () => {
    const { runtime } = await tabPlatform(null);
    const navigation = testNavigation('/student/help/reports/SUP-0213', '?x=1');
    renderInTab(
      <WorkspaceLayout workspace="student">
        <p>page</p>
      </WorkspaceLayout>,
      { runtime, navigation },
    );
    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith(
        '/sign-in?returnTo=%2Fstudent%2Fhelp%2Freports%2FSUP-0213%3Fx%3D1',
      ),
    );
    expect(navigation.replace).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('page')).toBeNull();
  });
});

describe('XS-05 "Sign out"', () => {
  it('calls the session service, clears the cache, keeps the world, leaves with reason=signed-out', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(PERSON_OF_ROLE.student);
    const navigation = testNavigation('/student/help');
    renderInTab(
      <WorkspaceLayout workspace="student">
        <HelpHome />
      </WorkspaceLayout>,
      { runtime, navigation },
    );
    await waitFor(() => expect(document.querySelector('main.xr-page ul.xr-rows')).not.toBeNull());
    const signedIn = runtime.session.getSnapshot();
    if (signedIn.status !== 'signed-in') throw new Error('not signed in');
    expect(runtime.queryClient.getQueryCache().getAll().length).toBeGreaterThan(0);

    const button = screen.getByRole('button', { name: /^Account menu: Rahul Verma, Student/ });
    // Rahul holds VR (Phase 3: ST-18 is built): "My device" joins once the shell's reads answer.
    await waitFor(() => expect(runtime.queryClient.isFetching()).toBe(0));
    await user.click(button);
    const menu = document.getElementById(button.getAttribute('aria-controls')!)!;
    // Board 06: My device* · Help · Sign out — no switcher.
    expect(
      within(menu)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['My device', 'Help']);
    expect(within(menu).getByRole('link', { name: 'Help' })).toHaveAttribute(
      'href',
      '/student/help',
    );
    await user.click(within(menu).getByRole('button', { name: 'Sign out' }));

    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith('/sign-in?reason=signed-out'),
    );
    expect(navigation.replace).toHaveBeenCalledTimes(1);
    expect(runtime.session.getSnapshot().status).toBe('signed-out');
    // No answer cached for Rahul's session survives.
    const keys = runtime.queryClient
      .getQueryCache()
      .getAll()
      .map((query) => String(query.queryKey[1]));
    expect(keys.filter((key) => key === signedIn.sessionKey)).toEqual([]);
    // The shared world is kept: SUP-0213 is still there for Rahul.
    const still = await asPersonId(sample, PERSON_OF_ROLE.student).operations.listMyReports();
    expect(still.ok && still.value.map((report) => report.id)).toEqual(['SUP-0213']);
  });
});
