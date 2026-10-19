/**
 * SA-06 Institutions — the list state the export draws (SA-v1 `V.institutions`, `SA.listState`)
 * that the sample world never reaches by itself: no institution yet (every one is created by
 * approving a request). The list reads are held empty; everything else is the real composition
 * root (`../institutions.test.tsx` covers the populated list, loading, failed with Try again, no
 * match and the filters).
 */
import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  renderInTab,
  SUPER_ADMIN,
  tabPlatform,
  TestNotFoundBoundary,
  testNavigation,
} from '@/test-support/workspace';

import { WorkspaceNotFound } from '../../shared/pu-15-not-found/not-found';
import { forgetLastAddress } from '../../shared/workspace-frame/route-focus';
import { WorkspaceLayout } from '../../shared/workspace-frame/workspace-frame';
import { Institutions } from './institutions';

const none = vi.hoisted(() => ({
  data: { ok: true, value: [] },
  isPending: false,
  isError: false,
  isPlaceholderData: false,
  refetch: () => Promise.resolve(),
}));

vi.mock('@/queries/institutions', async (original) => ({
  ...(await original<typeof import('@/queries/institutions')>()),
  useInstitutionRows: () => none,
  useInstitutionTab: () => none,
}));

afterEach(() => {
  forgetLastAddress();
});

describe('SA-06 list states (`SA.listState`)', () => {
  it('no institution yet: the empty state and the foot line, no toolbar', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-c');
    renderInTab(
      <WorkspaceLayout workspace="admin">
        <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>
          <Institutions />
        </TestNotFoundBoundary>
      </WorkspaceLayout>,
      { runtime, navigation: testNavigation('/admin/institutions') },
    );
    await screen.findByRole('heading', { level: 1, name: 'Institutions' });
    const title = screen.getByText('No institutions yet');
    expect(title).toHaveClass('rk-state-t');
    const state = title.closest('.rk-state')!;
    expect(state).not.toHaveAttribute('role');
    expect(state).toHaveTextContent(
      'An institution appears here when you approve its first request.',
    );
    expect(state.querySelector('.rk-state-ico svg')).not.toBeNull();
    expect(screen.queryByRole('searchbox')).toBeNull();
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByRole('region', { name: 'Institutions' })).toHaveTextContent(
      'Institutions are created only by approving a request. A plan can’t be amended here; changes come through a new request.',
    );
  });
});
