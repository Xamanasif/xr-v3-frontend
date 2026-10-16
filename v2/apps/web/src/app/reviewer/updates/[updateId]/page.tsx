import { ReviewUpdate } from '@/features/reviewer/rv-04-review-update/review-update';

/** RV-04 Review an update (boards B6-04, B6-13, B7-11). */
export default async function PageReviewUpdate({
  params,
}: {
  readonly params: Promise<{ readonly updateId: string }>;
}) {
  const { updateId } = await params;
  return <ReviewUpdate updateId={updateId} />;
}
