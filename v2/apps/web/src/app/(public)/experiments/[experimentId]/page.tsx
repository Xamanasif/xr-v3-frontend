import { ExperimentPage } from '@/features/public/pu-06-experiment/experiment';

/** PU-06 Experiment (B1-05; `?format=` when opened from a catalogue filtered by one format). */
export default async function PublicExperiment({
  params,
}: {
  readonly params: Promise<{ readonly experimentId: string }>;
}) {
  const { experimentId } = await params;
  return <ExperimentPage experimentId={experimentId} />;
}
