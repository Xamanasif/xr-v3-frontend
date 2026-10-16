import { AssessmentIntro } from '@/features/student/st-12-assessment-intro/assessment-intro';

/** ST-12 Assessment — before you start (board B4-11 f11 … f16). */
export default async function PageAssessmentIntro({
  params,
}: {
  readonly params: Promise<{ readonly assessmentId: string }>;
}) {
  const { assessmentId } = await params;
  return <AssessmentIntro assessmentId={assessmentId} />;
}
