/**
 * Workspace test support (never product code: ADR-0007): a tab's platform on a fixture world with
 * a person signed in through the CI seam (`beginSession`, as the test-hook bridge does — no
 * sign-in UI, G-8), and a render with the app's navigation supplied by the test instead of Next.js.
 */
import { render, type RenderResult } from '@testing-library/react';
import type { Role } from '@xr/domain';
import { beginSession, type FixtureName, fixtureWorld } from '@xr/sample-platform/testing';
import { Component, type ReactNode } from 'react';
import { type Mock, vi } from 'vitest';

import { type AppNavigation, NavigationProvider } from '@/nav/navigation';
import { composePlatform } from '@/platform/composition';
import { PlatformRuntimeProvider } from '@/platform/platform-provider';
import { assembleRuntime, createQueryClient, type PlatformRuntime } from '@/platform/runtime';

/**
 * One sample person per role in the full walk (`after-flow-d`), as board 06's account-menu table
 * names them: Rahul Verma, Dr S. Ranganathan, Meera Iyer (Godavari), Anil Shetty (Northline),
 * Prof. A. Menon, Kavya Nair, Arjun Mehta.
 */
export const PERSON_OF_ROLE: Readonly<Record<Role, string>> = {
  student: 'per-0002',
  faculty: 'per-0014',
  tenant_admin: 'per-0001',
  vendor: 'per-anil-shetty',
  academic_reviewer: 'per-a-menon',
  content_manager: 'per-kavya-nair',
  super_admin: 'sa-arjun-mehta',
};

/** Sneha Reddy: a Godavari Student deactivated in the walk (S2). */
export const INACTIVE_STUDENT = 'per-0005';
/** S. Kulkarni: Deccan's Institute Admin; Deccan is paused on 12 Oct in the walk. */
export const PAUSED_INSTITUTE_ADMIN = 'per-s-kulkarni';
export const SUPER_ADMIN = 'sa-arjun-mehta';

/** A tab's platform on a fixture world, signed in as `personId` (or signed out). */
export async function tabPlatform(
  personId: string | null,
  fixture: FixtureName = 'after-flow-d',
): Promise<{
  readonly runtime: PlatformRuntime;
  readonly sample: ReturnType<typeof composePlatform>['sample'];
}> {
  const composed = composePlatform({ dataSource: 'sample', world: await fixtureWorld(fixture) });
  const runtime = assembleRuntime({
    composed,
    queryClient: createQueryClient('sample'),
    publicSessionKey: 'public:bs-test',
  });
  if (personId) beginSession(composed.sample, personId);
  await runtime.session.refresh();
  return { runtime, sample: composed.sample };
}

/** What `notFound()` throws in these renders (Next.js throws its own; the boundary catches it). */
export class NotFoundSignal extends Error {
  override readonly name = 'NotFoundSignal';
}

/** The app's navigation as a test supplies it: a fixed address, a spied `replace` and `navigate`. */
export function testNavigation(
  pathname: string,
  search = '',
): AppNavigation & {
  readonly replace: Mock<(href: string) => void>;
  readonly navigate: Mock<(href: string, options?: { readonly replace?: boolean }) => void>;
} {
  return {
    pathname,
    search,
    replace: vi.fn<(href: string) => void>(),
    navigate: vi.fn<(href: string, options?: { readonly replace?: boolean }) => void>(),
    notFound: () => {
      throw new NotFoundSignal(pathname);
    },
  };
}

/** The segment's not-found boundary, as Next.js places it inside the workspace layout. */
export class TestNotFoundBoundary extends Component<
  { readonly fallback: ReactNode; readonly children?: ReactNode },
  { readonly notFound: boolean }
> {
  override state = { notFound: false };

  static getDerivedStateFromError(error: unknown) {
    if (error instanceof NotFoundSignal) return { notFound: true };
    throw error;
  }

  override render() {
    return this.state.notFound ? this.props.fallback : this.props.children;
  }
}

/** Renders inside the tab's platform with the given navigation. */
export function renderInTab(
  ui: ReactNode,
  options: { readonly runtime: PlatformRuntime; readonly navigation: AppNavigation },
): RenderResult {
  return render(
    <PlatformRuntimeProvider runtime={options.runtime} queryClient={options.runtime.queryClient}>
      <NavigationProvider value={options.navigation}>{ui}</NavigationProvider>
    </PlatformRuntimeProvider>,
  );
}
