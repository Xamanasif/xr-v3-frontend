import { ExperimentEditor } from '@/features/vendor/editor/experiment-editor';

/** VE-09 Edit draft, with VE-04 … VE-06 as its `?step=`s (boards B5-04, B5-05, B5-07 f5). */
export default async function PageEditDraft({
  params,
}: {
  readonly params: Promise<{ readonly submissionId: string }>;
}) {
  const { submissionId } = await params;
  return <ExperimentEditor mode="edit" submissionId={submissionId} />;
}
