import { PublishedExperiment } from '@/features/content-manager/cm-05-published/published-experiment';

/** CM-05 Published experiment (board B6-08; its correction entry is Phase 6). */
export default async function PagePublishedExperiment({
  params,
}: {
  readonly params: Promise<{ readonly experimentId: string }>;
}) {
  const { experimentId } = await params;
  return <PublishedExperiment experimentId={experimentId} />;
}
