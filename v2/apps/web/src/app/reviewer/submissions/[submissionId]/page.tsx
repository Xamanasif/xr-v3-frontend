import { ReviewSubmission } from '@/features/reviewer/rv-03-review/review-submission';

/** RV-03 Review a submission, with RV-06 its decided read-only state (boards B6-03, B6-11). */
export default async function PageReviewSubmission({
  params,
}: {
  readonly params: Promise<{ readonly submissionId: string }>;
}) {
  const { submissionId } = await params;
  return <ReviewSubmission submissionId={submissionId} />;
}
