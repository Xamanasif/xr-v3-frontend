import { ExperimentEditor } from '@/features/vendor/editor/experiment-editor';

/** VE-08 Revise and resubmit (`?step=`; board B5-07). */
export default async function PageRevise({
  params,
}: {
  readonly params: Promise<{ readonly submissionId: string }>;
}) {
  const { submissionId } = await params;
  return <ExperimentEditor mode="revise" submissionId={submissionId} />;
}
