import { Resources } from '@/features/student/st-06-resources/resources';

/** ST-06 Resources, a tab of the experiment hub (board B3-01 f0 … f7). */
export default async function StudentExperimentResources({
  params,
}: {
  readonly params: Promise<{ readonly experimentId: string }>;
}) {
  const { experimentId } = await params;
  return <Resources experimentId={experimentId} />;
}
