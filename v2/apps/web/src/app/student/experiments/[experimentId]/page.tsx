import { ExperimentHub } from '@/features/student/st-05-experiment-hub/experiment-hub';

/** ST-05 Experiment hub (board B2-12), with the ST-19 "Experiment not available" state. */
export default async function StudentExperiment({
  params,
}: {
  readonly params: Promise<{ readonly experimentId: string }>;
}) {
  const { experimentId } = await params;
  return <ExperimentHub experimentId={experimentId} />;
}
