import { AssessmentAttempt } from '@/features/student/st-13-attempt/attempt';

/** ST-13 Assessment attempt, a focused page without the shell (board B4-12). */
export default async function PageAssessmentAttempt({
  params,
}: {
  readonly params: Promise<{ readonly assessmentId: string }>;
}) {
  const { assessmentId } = await params;
  return <AssessmentAttempt assessmentId={assessmentId} />;
}
