import { AssessmentSubmissions } from '@/features/faculty/fa-12-submissions/submissions';

/** FA-12 Assessment · Submissions, with FA-22 Export CSV (board B4-06 f7 … f11). */
export default async function PageAssessmentSubmissions({
  params,
}: {
  readonly params: Promise<{ readonly assessmentId: string }>;
}) {
  const { assessmentId } = await params;
  return <AssessmentSubmissions assessmentId={assessmentId} />;
}
