/**
 * PU-15 (board 08 "Page not found · workspace" and "· public"; Appendix F WP-0.13 acceptance 4):
 * the public variant with "Browse experiments" and no Help, placed as the public boards place their
 * message pages; the workspace variant in the person's own shell, nothing current, "Back to Home"
 * and Help.
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';
import { PERSON_OF_ROLE, renderInTab, tabPlatform, testNavigation } from '@/test-support/workspace';

import { forgetLastAddress } from '../workspace-frame/route-focus';
import { WorkspaceLayout } from '../workspace-frame/workspace-frame';
import { PublicFrame } from '../../public/shell/public-frame';
import { PublicNotFound, WorkspaceNotFound } from './not-found';

afterEach(() => forgetLastAddress());

const BOARD_08 = board('08-System-Messages.dc.html');

describe('board 08 draws both variants with these words', () => {
  it('workspace: search icon, title, sentence, Back to Home + Help; public: Browse experiments, no Help', () => {
    expect(BOARD_08).toContain(
      "label: 'Page not found · workspace', ids: 'PU-15 pattern · XS', icon: ICON.search, title: 'We can’t find that page', body: 'The address may be wrong, or the page may have moved.', action: 'Back to Home', hasHelp: true",
    );
    expect(BOARD_08).toContain(
      "label: 'Page not found · public', ids: 'PU-15', icon: ICON.search, title: 'We can’t find that page', body: 'The address may be wrong, or the page may have moved. Published experiments are all in the catalogue.', action: 'Browse experiments', hasHelp: false",
    );
    expect(BOARD_08).toContain("ws('Not found')");
  });
});

describe('PU-15 public variant', () => {
  it('one H1, the sentence, "Browse experiments" to the built catalogue, no Help, inside the public frame (Package 1B)', () => {
    render(
      <PublicFrame pathname="/zz-unknown">
        <PublicNotFound />
      </PublicFrame>,
    );
    const root = document.querySelector('body > div > div.xp')!;
    expect(
      root.querySelector(':scope > main.xp-page#main > div.xp-in > div.xr-msg.xr-x-msg--public'),
    ).not.toBeNull();
    expect(root.querySelector(':scope > header.xp-head')).not.toBeNull();
    expect(root.querySelector(':scope > footer.xp-foot')).not.toBeNull();
    expect(
      screen.getAllByRole('heading', { level: 1 }).map((heading) => heading.textContent),
    ).toEqual(['We can’t find that page']);
    expect(
      screen.getByText(
        'The address may be wrong, or the page may have moved. Published experiments are all in the catalogue.',
      ),
    ).toBeVisible();
    const main = screen.getByRole('main');
    expect(
      within(main)
        .getAllByRole('link')
        .map((link) => [link.textContent, link.getAttribute('href')]),
    ).toEqual([['Browse experiments', '/experiments']]);
    expect(document.title).toBe('We can’t find that page · XR Learning Platform');
    // The public header offers only built destinations — since Package 1C the Selection and
    // Request access (both to PU-07); no Help on the public surface.
    const header = screen.getByRole('banner');
    expect(header).toBeVisible();
    expect(within(header).getByRole('link', { name: 'Request access' })).toHaveAttribute(
      'href',
      '/selection',
    );
    expect(screen.queryByRole('link', { name: /Help/ })).toBeNull();
  });
});

describe('PU-15 workspace variant', () => {
  it('in the person’s own shell: nothing current, "Not found" on top, Back to Home and Help', async () => {
    // A role that keeps its v46 shell (the Faculty member moved to the V3 shell with FA-v1).
    const { runtime } = await tabPlatform(PERSON_OF_ROLE.student);
    renderInTab(
      <WorkspaceLayout workspace="student">
        <WorkspaceNotFound />
      </WorkspaceLayout>,
      { runtime, navigation: testNavigation('/student/courses') },
    );
    const heading = await screen.findByRole('heading', {
      level: 1,
      name: 'We can’t find that page',
    });
    const message = heading.closest('.xr-msg') as HTMLElement;
    expect(message).toHaveClass('xr-x-msg--shell');
    expect(message).toHaveTextContent('The address may be wrong, or the page may have moved.');
    expect(message).not.toHaveTextContent('catalogue');
    expect(
      within(message)
        .getAllByRole('link')
        .map((link) => [link.textContent, link.getAttribute('href')]),
    ).toEqual([
      ['Back to Home', '/student'],
      ['Help', '/student/help'],
    ]);
    await waitFor(() => expect(document.title).toBe('Not found · XR Learning Platform'));
    expect(document.querySelector('.xr-side [aria-current]')).toBeNull();
    expect(document.querySelector('.xr-top-title')).toHaveTextContent('Not found');
  });
});
