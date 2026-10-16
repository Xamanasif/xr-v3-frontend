import { ExperimentRecord } from '@/features/vendor/ve-07-record/experiment-record';

/** VE-07 Experiment record, with VE-13 History (`?tab=history`; board B5-06). */
export default async function PageExperimentRecord({
  params,
}: {
  readonly params: Promise<{ readonly submissionId: string }>;
}) {
  const { submissionId } = await params;
  return <ExperimentRecord submissionId={submissionId} />;
}
