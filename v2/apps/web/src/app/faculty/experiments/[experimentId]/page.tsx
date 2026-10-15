import { FacultyExperiment } from '@/features/faculty/fa-05-experiment/experiment';

/** FA-05 Experiment, the teaching view (board B4-03). */
export default async function FacultyExperimentPage({
  params,
}: {
  readonly params: Promise<{ readonly experimentId: string }>;
}) {
  const { experimentId } = await params;
  return <FacultyExperiment experimentId={experimentId} />;
}
