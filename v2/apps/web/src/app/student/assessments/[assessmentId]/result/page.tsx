import { AssessmentResult } from '@/features/student/st-14-result/result';

/** ST-14 Result (board B4-13). */
export default async function PageAssessmentResult({
  params,
}: {
  readonly params: Promise<{ readonly assessmentId: string }>;
}) {
  const { assessmentId } = await params;
  return <AssessmentResult assessmentId={assessmentId} />;
}
