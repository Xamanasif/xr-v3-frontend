import { ExperimentProgress } from '@/features/student/st-10-experiment-progress/experiment-progress';

/** ST-10 Progress for this experiment, a tab of the experiment hub (board B3-01 f8 … f12). */
export default async function StudentExperimentProgress({
  params,
}: {
  readonly params: Promise<{ readonly experimentId: string }>;
}) {
  const { experimentId } = await params;
  return <ExperimentProgress experimentId={experimentId} />;
}
