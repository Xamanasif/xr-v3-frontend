/**
 * Test platforms for jsdom tests (Appendix D §2.5): a sample world composed through the real
 * composition root and runtime, supplied to components with `PlatformRuntimeProvider`. Identity
 * is set by signing in through the session port with a sample e-mail (README "Sample
 * credentials"), never through UI.
 */
import type { ReactNode } from 'react';

import { type ComposeOptions, composePlatform, type SampleWorld } from '@/platform/composition';

type SnapshotStorage = NonNullable<ComposeOptions['worldStorage']>;
import { PlatformRuntimeProvider } from '@/platform/platform-provider';
import { assembleRuntime, createQueryClient, type PlatformRuntime } from '@/platform/runtime';

/** Sample people of the spine-start world (`@xr/sample-platform` README). */
export const SAMPLE_PEOPLE = {
  arjun: { personId: 'sa-arjun-mehta', email: 'arjun.mehta@wilp.example' },
  anil: { personId: 'per-anil-shetty', email: 'anil.shetty@northline.example' },
  kavya: { email: 'kavya.nair@wilp.example' },
} as const;

/** Any non-empty password signs a known sample e-mail in (AD-03 interim). */
export const SAMPLE_PASSWORD = 'any-sample-password';

export async function testPlatform(
  options: {
    readonly world?: SampleWorld;
    /**
     * TE-6: a page load of the local prototype build on this browser storage (its world snapshot
     * and the visitor's request tickets kept beside it); a new lineage name for each fresh start.
     */
    readonly kept?: { readonly storage: SnapshotStorage; readonly lineage: string };
  } = {},
) {
  const composed = composePlatform({
    dataSource: 'sample',
    ...(options.world ? { world: options.world } : {}),
    ...(options.kept ? { worldStorage: options.kept.storage, lineage: options.kept.lineage } : {}),
  });
  const runtime = assembleRuntime({
    composed,
    queryClient: createQueryClient('sample'),
    publicSessionKey: 'public:bs-test',
  });
  await runtime.session.refresh();
  return { composed, runtime, sample: composed.sample };
}

export function platformWrapper(runtime: PlatformRuntime) {
  return function Wrapper({ children }: { readonly children?: ReactNode }) {
    return (
      <PlatformRuntimeProvider runtime={runtime} queryClient={runtime.queryClient}>
        {children}
      </PlatformRuntimeProvider>
    );
  };
}

export async function signInAs(runtime: PlatformRuntime, email: string) {
  const answer = await runtime.ports.session.signIn({
    method: 'email',
    email,
    password: SAMPLE_PASSWORD,
  });
  if (!answer.ok) throw new Error(`Sample sign-in refused: ${answer.error.kind}`);
  return answer.value.session;
}
