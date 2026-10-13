/**
 * The record-guard mechanism (Appendix F §5.2 "Record guards (framework)": "Phase 0 builds the
 * mechanism with fixture view models; each guard is wired with its screen"), with fixture reads:
 * loading, failed for now, answered, refused → not found, refused → a drawn state of its own.
 */
import { render, screen } from '@testing-library/react';
import type { Result, ServiceError } from '@xr/contracts/draft';
import { describe, expect, it, vi } from 'vitest';

import { NavigationProvider } from '@/nav/navigation';
import { NotFoundSignal, TestNotFoundBoundary, testNavigation } from '@/test-support/workspace';

import { RecordGuard, type RecordRead } from './record-guard';

function read(overrides: Partial<RecordRead<{ title: string }>>): RecordRead<{ title: string }> {
  return { isPending: false, isError: false, refetch: vi.fn(), ...overrides };
}

const answered: Result<{ title: string }, ServiceError> = {
  ok: true,
  value: { title: 'SUP-0213' },
  changed: [],
};

function renderGuard(
  value: RecordRead<{ title: string }>,
  refusals?: Parameters<typeof RecordGuard>[0]['refusals'],
) {
  return render(
    <NavigationProvider value={testNavigation('/student/help/reports/SUP-0213')}>
      <TestNotFoundBoundary fallback={<p>in-shell not found</p>}>
        <RecordGuard
          read={value}
          loadingLabel="Loading your report"
          failed={{
            title: 'Your report didn’t load. Nothing was lost.',
            reportHref: '/student/help/report',
          }}
          refusals={refusals}
        >
          {(record) => <h1>{record.title}</h1>}
        </RecordGuard>
      </TestNotFoundBoundary>
    </NavigationProvider>,
  );
}

describe('RecordGuard', () => {
  it('loading: the drawn skeleton, announced', () => {
    renderGuard(read({ isPending: true }));
    expect(screen.getByRole('status')).toHaveTextContent('Loading your report');
  });

  it('failed for now: the drawn failed state with Try again and Report a problem', () => {
    const refetch = vi.fn();
    renderGuard(read({ isError: true, refetch }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Your report didn’t load. Nothing was lost.',
    );
    screen.getByRole('button', { name: 'Try again' }).click();
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link', { name: 'Report a problem' })).toHaveAttribute(
      'href',
      '/student/help/report',
    );
  });

  it('answered: the record goes to the page', () => {
    renderGuard(read({ data: answered }));
    expect(screen.getByRole('heading', { name: 'SUP-0213' })).toBeVisible();
  });

  it.each([
    'not-found',
    'not-permitted',
    'policy-open',
    'validation-failed',
    'not-signed-in',
  ] as const)('refused %s, unmapped: the not-found page (existence not revealed)', (kind) => {
    const refusal = { ok: false, error: { kind } } as unknown as Result<
      { title: string },
      ServiceError
    >;
    renderGuard(read({ data: refusal }));
    expect(screen.getByText('in-shell not found')).toBeVisible();
  });

  it('a refusal mapped to a drawn state renders that state (the later guards: ST-19 …)', () => {
    const refusal = {
      ok: false,
      error: { kind: 'not-permitted', why: 'not-given' },
    } as unknown as Result<{ title: string }, ServiceError>;
    renderGuard(read({ data: refusal }), {
      'not-permitted': <p>This experiment isn’t available to you</p>,
    });
    expect(screen.getByText('This experiment isn’t available to you')).toBeVisible();
  });

  it('not found is thrown, as Next.js’s notFound() is', () => {
    const navigation = testNavigation('/x');
    expect(() => navigation.notFound()).toThrow(NotFoundSignal);
  });
});
