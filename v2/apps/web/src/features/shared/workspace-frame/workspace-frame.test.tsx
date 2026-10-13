/**
 * The workspace frame and XS-06 (Appendix F §5.2 "Workspace guard (XS-06)", WP-0.13 acceptance
 * 1; ADR-0005 §5; board 08): for every (role, workspace) pair the shell is the session role's, and
 * another role's workspace shows XS-06 in place — the board 08 words with the person's own
 * workspace named, nothing current in the sidebar, "Back to Home" to their own base and Help to
 * their own Help, and the requested page never rendered. On the real composition root and the
 * shared sample world; the same 42 pairs run in the browser (`e2e/foundation/workspace-guard`).
 */
import { screen, waitFor, within } from '@testing-library/react';
import { WORKSPACES } from '@xr/contracts/draft';
import { PLATFORM_ROLES, ROLE_LABEL, type Role } from '@xr/domain';
import { afterEach, describe, expect, it } from 'vitest';

import { WORKSPACE_NAV } from '@/nav/nav-config';
import { roleOfWorkspace, workspaceOf } from '@/nav/routes';
import { BOARD_ACCOUNT_ROWS, board } from '@/test-support/boards';
import { PERSON_OF_ROLE, renderInTab, tabPlatform, testNavigation } from '@/test-support/workspace';

import { bannerKindOf, shellPersonOf, WorkspaceLayout } from './workspace-frame';
import { forgetLastAddress } from './route-focus';

afterEach(() => forgetLastAddress());

const BOARD_08 = board('08-System-Messages.dc.html');

const PAIRS = PLATFORM_ROLES.flatMap((role) =>
  WORKSPACES.filter((workspace) => workspace !== workspaceOf(role)).map(
    (workspace) => [role, workspace] as const,
  ),
);

function RequestedPage() {
  return <p>The requested page</p>;
}

async function renderAs(role: Role, workspace: (typeof WORKSPACES)[number]) {
  const { runtime } = await tabPlatform(PERSON_OF_ROLE[role]);
  const navigation = testNavigation(`/${workspace}/help`);
  const view = renderInTab(
    <WorkspaceLayout workspace={workspace}>
      <RequestedPage />
    </WorkspaceLayout>,
    { runtime, navigation },
  );
  return { runtime, navigation, view };
}

describe('XS-06 — the 42 (role, other workspace) pairs', () => {
  it('there are 42 pairs: seven roles, six other workspaces each', () => {
    expect(PAIRS).toHaveLength(42);
  });

  it('board 08 draws the words this test expects', () => {
    expect(BOARD_08).toContain(
      '<h1 class="xr-msg-title">This page isn’t part of your workspace</h1>',
    );
    expect(BOARD_08).toContain(
      'You’re signed in to the Student workspace. This address belongs to a different workspace.',
    );
    expect(BOARD_08).toContain('<span class="xr-top-title">Not your workspace</span>');
  });

  it.each(PAIRS)('%s opening /%s: own shell, XS-06 in place', async (role, workspace) => {
    const { navigation } = await renderAs(role, workspace);
    const heading = await screen.findByRole('heading', {
      level: 1,
      name: 'This page isn’t part of your workspace',
    });
    const message = heading.closest('.xr-msg') as HTMLElement;
    expect(message).toHaveClass('xr-x-msg--shell');
    expect(message).toHaveTextContent(
      `You’re signed in to the ${ROLE_LABEL[role]} workspace. This address belongs to a different workspace.`,
    );
    const own = WORKSPACE_NAV[role];
    expect(within(message).getByRole('link', { name: 'Back to Home' })).toHaveAttribute(
      'href',
      own.base,
    );
    expect(within(message).getByRole('link', { name: 'Help' })).toHaveAttribute(
      'href',
      own.help.href,
    );
    // The shell is the person's own: the sidebar names their workspace; nothing is current.
    expect(screen.getByRole('complementary', { name: `${own.workspace} workspace` })).toBeVisible();
    expect(document.querySelector('[aria-current="page"]:not(.xr-crumbs *)')).toBeNull();
    expect(
      screen.getByRole('button', { name: new RegExp(`^Account menu: .*, ${ROLE_LABEL[role]}`) }),
    ).toBeInTheDocument();
    // The requested page is never rendered; the address is never changed by the guard.
    expect(screen.queryByText('The requested page')).toBeNull();
    expect(navigation.replace).not.toHaveBeenCalled();
    await waitFor(() => expect(document.title).toBe('Not your workspace · XR Learning Platform'));
    // Never a route, role code or status code (board 08 "Rules").
    expect(document.body.textContent).not.toMatch(
      new RegExp(`/${workspace}|${roleOfWorkspace(workspace)}|403|404|not-permitted`),
    );
  });
});

describe('each role in its own workspace sees the requested page in its own shell', () => {
  it.each(PLATFORM_ROLES)('%s', async (role) => {
    await renderAs(role, workspaceOf(role));
    expect(await screen.findByText('The requested page')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'This page isn’t part of your workspace' }),
    ).toBeNull();
  });
});

describe('the shell’s person comes from the session (board 06 account-menu lines)', () => {
  it.each(PLATFORM_ROLES)('%s: name, role and line as board 06 draws them', async (role) => {
    const { runtime } = await tabPlatform(PERSON_OF_ROLE[role]);
    const answer = await runtime.ports.session.getSession();
    if (!answer.ok || !answer.value) throw new Error('no session');
    const person = shellPersonOf(answer.value.session);
    const row = BOARD_ACCOUNT_ROWS.get(ROLE_LABEL[role])!;
    expect(person.name).toBe(row.name);
    expect(person.initials).toBe(row.initials);
    if (row.line) expect(person.organisation).toBe(row.line);
    await renderAs(role, workspaceOf(role));
    const button = await screen.findByRole('button', { name: /^Account menu: / });
    expect(button).toHaveAccessibleName(
      `Account menu: ${[row.name, row.role, row.line].filter(Boolean).join(', ')}`,
    );
  });
});

describe('bannerKindOf (XS-08)', () => {
  it('maps the session’s banner facts to the drawn banner', () => {
    expect(bannerKindOf([])).toBeNull();
    expect(bannerKindOf(['institution-paused'])).toBe('paused');
    expect(bannerKindOf(['account-inactive'])).toBe('inactive');
    expect(bannerKindOf(['institution-paused', 'account-inactive'])).toBe('inactive');
  });
});
