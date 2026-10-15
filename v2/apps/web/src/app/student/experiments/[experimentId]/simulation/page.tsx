import { SimulationChooser } from '@/features/student/st-07-simulation/simulation-chooser';

/** ST-07 Simulation — choose a format, a tab of the experiment hub (board B3-02). */
export default async function StudentExperimentSimulation({
  params,
}: {
  readonly params: Promise<{ readonly experimentId: string }>;
}) {
  const { experimentId } = await params;
  return <SimulationChooser experimentId={experimentId} />;
}
