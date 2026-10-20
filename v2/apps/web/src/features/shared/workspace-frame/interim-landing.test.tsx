/**
 * The interim landing (ADR-0005 §8): `/<base>` replaces itself with `/<base>/help` — after the
 * workspace guard, so another role's base keeps its address and shows XS-06.
 */
import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { PERSON_OF_ROLE, renderInTab, tabPlatform, testNavigation } from '@/test-support/workspace';

import { InterimLanding } from './interim-landing';
import { forgetLastAddress } from './route-focus';
import { WorkspaceLayout } from './workspace-frame';

afterEach(() => forgetLastAddress());

describe('InterimLanding', () => {
  it('the own base lands on the own Help & support', async () => {
    const { runtime } = await tabPlatform(PERSON_OF_ROLE.content_manager);
    const navigation = testNavigation('/content-manager');
    renderInTab(
      <WorkspaceLayout workspace="content-manager">
        <InterimLanding />
      </WorkspaceLayout>,
      { runtime, navigation },
    );
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/content-manager/help'));
    expect(navigation.replace).toHaveBeenCalledTimes(1);
    // The shell already shows Help's place while the address changes (the Content Manager's V3
    // shell: Help & support in the rail foot).
    await waitFor(() =>
      expect(
        within(
          within(
            screen.getByRole('complementary', { name: 'Content Manager workspace' }),
          ).getByRole('navigation', { name: 'Help' }),
        ).getByRole('link', { name: 'Help & support' }),
      ).toHaveAttribute('aria-current', 'page'),
    );
  });

  it('another role’s base keeps its address: XS-06, no redirect', async () => {
    const { runtime } = await tabPlatform(PERSON_OF_ROLE.student);
    const navigation = testNavigation('/admin');
    renderInTab(
      <WorkspaceLayout workspace="admin">
        <InterimLanding />
      </WorkspaceLayout>,
      { runtime, navigation },
    );
    expect(
      await screen.findByRole('heading', { name: 'This page isn’t part of your workspace' }),
    ).toBeVisible();
    expect(navigation.replace).not.toHaveBeenCalled();
  });
});
