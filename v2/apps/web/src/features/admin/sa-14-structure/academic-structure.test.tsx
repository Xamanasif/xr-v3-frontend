/**
 * SA-14 Academic structure — the list states the export draws (SA-v1 `V.structure`,
 * `SA.listState`) that the sample world never reaches by itself: still loading (the skeleton rows
 * under the announced line) and empty (no engineering area yet). The structure read is held in
 * each state; everything else is the real composition root (`structure.test.tsx` covers the
 * populated page, failed with Try again, and every command).
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
import { AcademicStructure } from './academic-structure';

const read = vi.hoisted(() => ({
  current: {
    data: undefined as unknown,
    isPending: true,
    isError: false,
    refetch: () => Promise.resolve(),
  },
}));

vi.mock('@/queries/structure', async (original) => ({
  ...(await original<typeof import('@/queries/structure')>()),
  useAcademicStructure: () => read.current,
}));

afterEach(() => {
  forgetLastAddress();
});

async function render() {
  const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
  renderInTab(
    <WorkspaceLayout workspace="admin">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>
        <AcademicStructure />
      </TestNotFoundBoundary>
    </WorkspaceLayout>,
    { runtime, navigation: testNavigation('/admin/structure') },
  );
  await screen.findByRole('heading', { level: 1, name: 'Academic structure' });
}

describe('SA-14 list states (`SA.listState`)', () => {
  it('loading: the announced line over skeleton rows; the head and its actions stay', async () => {
    read.current = {
      data: undefined,
      isPending: true,
      isError: false,
      refetch: read.current.refetch,
    };
    await render();
    const line = screen.getByText('Loading the academic structure…');
    expect(line).toHaveAttribute('role', 'status');
    expect(line).toHaveClass('rk-loading-msg');
    expect(line.parentElement).toHaveAttribute('aria-busy', 'true');
    expect(line.parentElement!.querySelectorAll('.rk-skel-row')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Add area' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Add course' })).toBeVisible();
  });

  it('empty: “No engineering areas yet” with the next step; the foot stays', async () => {
    read.current = {
      data: { ok: true, value: [] },
      isPending: false,
      isError: false,
      refetch: read.current.refetch,
    };
    await render();
    const title = screen.getByText('No engineering areas yet');
    const state = title.closest('.rk-state')!;
    expect(title).toHaveClass('rk-state-t');
    expect(state).not.toHaveAttribute('role');
    expect(state.querySelector('.rk-state-d')).toHaveTextContent(
      'Add an area, then add its courses.',
    );
    expect(state.querySelector('.rk-state-ico svg')).not.toBeNull();
    expect(screen.getByRole('main').querySelector('p.rk-ca-foot')).toHaveTextContent(
      'Areas group courses; there is no module layer.',
    );
  });
});
