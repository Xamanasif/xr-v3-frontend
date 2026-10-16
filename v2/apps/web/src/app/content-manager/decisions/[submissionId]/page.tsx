import { PublicationDecision } from '@/features/content-manager/cm-03-decision/publication-decision';

/** CM-03 Publication decision (boards B6-07, B6-11). */
export default async function PagePublicationDecision({
  params,
}: {
  readonly params: Promise<{ readonly submissionId: string }>;
}) {
  const { submissionId } = await params;
  return <PublicationDecision submissionId={submissionId} />;
}
