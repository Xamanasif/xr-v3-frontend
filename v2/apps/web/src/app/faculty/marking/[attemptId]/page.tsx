import { MarkSubmission } from '@/features/faculty/fa-19-mark-submission/mark-submission';

/** FA-19 Mark a submission (board B4-09 f1 … f3, f7, f8). */
export default async function PageMarkSubmission({
  params,
}: {
  readonly params: Promise<{ readonly attemptId: string }>;
}) {
  const { attemptId } = await params;
  return <MarkSubmission attemptId={attemptId} />;
}
