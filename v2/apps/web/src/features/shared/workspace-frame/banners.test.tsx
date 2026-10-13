/**
 * XS-08 in the real shell, from the shared world's state (Appendix F WP-0.13 acceptance 3;
 * boards 05, 08; B7-04): the paused banner for a paused institution's Student, Faculty and
 * Institute Admin (Faculty: the banner only, OD-B7-07), the inactive banner for an inactive
 * Student, none for the platform roles; `role="status"`, never modal, Help to the person's own
 * Help. The state is changed only through port commands (no policy is bent to force a banner).
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import { PLATFORM_ROLES, type Role } from '@xr/domain';
import { asPersonId } from '@xr/sample-platform/testing';
import { afterEach, describe, expect, it } from 'vitest';

import type { PlatformRuntime } from '@/platform/runtime';
import { board } from '@/test-support/boards';
import {
  INACTIVE_STUDENT,
  PAUSED_INSTITUTE_ADMIN,
  PERSON_OF_ROLE,
  renderInTab,
  SUPER_ADMIN,
  tabPlatform,
  testNavigation,
} from '@/test-support/workspace';

import { forgetLastAddress } from './route-focus';
import { WorkspaceLayout } from './workspace-frame';
import { workspaceOf } from '@/nav/routes';

afterEach(() => forgetLastAddress());

const PAUSED = 'Your institution’s access is paused — your work is kept.';
const INACTIVE = 'Your account is inactive. Contact your institution administrator.';

function renderShell(runtime: PlatformRuntime, role: Role) {
  return renderInTab(
    <WorkspaceLayout workspace={workspaceOf(role)}>
      <p>page</p>
    </WorkspaceLayout>,
    { runtime, navigation: testNavigation(`/${workspaceOf(role)}/help`) },
  );
}

type Sample = Awaited<ReturnType<typeof tabPlatform>>['sample'];

async function setGodavariPause(sample: Sample, runtime: PlatformRuntime, paused: boolean) {
  const admin = asPersonId(sample, SUPER_ADMIN).institutions;
  const found = await admin.getInstitution('godavari' as never);
  if (!found.ok) throw new Error('getInstitution refused');
  const institution = found.value.institution;
  const answer = paused
    ? await admin.pauseInstitution({
        institutionId: institution.id,
        reason: 'The institution asked us to pause access while it checks its student list.',
        expectedRev: institution.rev,
      })
    : await admin.restoreInstitution({
        institutionId: institution.id,
        reason: 'The student list is checked.',
        expectedRev: institution.rev,
      });
  if (!answer.ok) throw new Error(`${paused ? 'pause' : 'restore'} refused: ${answer.error.kind}`);
  await act(async () => {
    await runtime.invalidate(answer.changed);
  });
}

describe('XS-08 — the words board 05 draws', () => {
  it('paused and inactive, verbatim', () => {
    const source = board('05-Workspace-Shell.dc.html');
    expect(source).toContain(
      '<strong>Your institution’s access is paused — your work is kept.</strong>',
    );
    expect(source).toContain(
      '<strong>Your account is inactive.</strong> Contact your institution administrator.',
    );
  });
});

describe('XS-08 — from the shared world', () => {
  it.each(['student', 'faculty', 'tenant_admin'] as const)(
    'Godavari paused: the %s sees the paused banner; restored: it goes',
    async (role) => {
      const { runtime, sample } = await tabPlatform(PERSON_OF_ROLE[role]);
      renderShell(runtime, role);
      await screen.findByText('page');
      expect(document.querySelector('.xr-banner')).toBeNull();

      await setGodavariPause(sample, runtime, true);
      const shown = await waitFor(() => {
        const element = document.querySelector<HTMLElement>('.xr-banner');
        expect(element).not.toBeNull();
        return element!;
      });
      expect(shown).toHaveClass('xr-banner', 'xr-banner--paused');
      expect(shown).not.toHaveClass('xr-banner--inactive');
      expect(shown).toHaveAttribute('role', 'status');
      expect(shown).toHaveTextContent(PAUSED);
      expect(within(shown).getByRole('link', { name: 'Help' })).toHaveAttribute(
        'href',
        `/${workspaceOf(role)}/help`,
      );
      // Never modal: no dialog, nothing made inert, the page stays usable.
      expect(document.querySelector('dialog, [role="dialog"], [aria-modal="true"]')).toBeNull();
      expect(document.querySelector('[inert]')).toBeNull();
      expect(screen.getByText('page')).toBeVisible();

      await setGodavariPause(sample, runtime, false);
      await waitFor(() => expect(document.querySelector('.xr-banner')).toBeNull());
    },
  );

  it('the platform roles never see an institution banner', async () => {
    for (const role of PLATFORM_ROLES.filter(
      (candidate) => !['student', 'faculty', 'tenant_admin'].includes(candidate),
    )) {
      const { runtime, sample } = await tabPlatform(PERSON_OF_ROLE[role]);
      const view = renderShell(runtime, role);
      await setGodavariPause(sample, runtime, true);
      await screen.findByText('page');
      expect(document.querySelector('.xr-banner')).toBeNull();
      view.unmount();
    }
  });

  it('Deccan, paused in the walk: its Institute Admin signs in to the paused banner', async () => {
    const { runtime } = await tabPlatform(PAUSED_INSTITUTE_ADMIN);
    renderShell(runtime, 'tenant_admin');
    await screen.findByText('page');
    expect(document.querySelector('.xr-banner')).toHaveTextContent(PAUSED);
  });

  it('an inactive Student: the navy inactive banner, distinct from paused', async () => {
    const { runtime } = await tabPlatform(INACTIVE_STUDENT);
    renderShell(runtime, 'student');
    await screen.findByText('page');
    const shown = document.querySelector('.xr-banner')!;
    expect(shown).toHaveClass('xr-banner--inactive', 'xr-dark');
    expect(shown).not.toHaveClass('xr-banner--paused');
    expect(shown).toHaveAttribute('role', 'status');
    expect(shown).toHaveTextContent(INACTIVE);
    expect(within(shown as HTMLElement).getByRole('link', { name: 'Help' })).toHaveAttribute(
      'href',
      '/student/help',
    );
  });

  it('Faculty get the banner treatment only: an inactive Faculty member shows no inactive banner', async () => {
    // Prof. Ravi Shankar is inactive in the walk (PER-07; inactive Faculty sign-in is SES-09 open).
    const { runtime } = await tabPlatform('per-0016');
    renderShell(runtime, 'faculty');
    await screen.findByText('page');
    expect(document.querySelector('.xr-banner')).toBeNull();
  });
});
