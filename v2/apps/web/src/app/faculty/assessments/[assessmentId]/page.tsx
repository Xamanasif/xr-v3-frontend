import { AssessmentSummary } from '@/features/faculty/fa-08-assessment-summary/assessment-summary';

/** FA-08 Assessment · Summary (board B4-05 f0 … f5). */
export default async function FacultyAssessmentSummaryPage({
  params,
}: {
  readonly params: Promise<{ readonly assessmentId: string }>;
}) {
  const { assessmentId } = await params;
  return <AssessmentSummary assessmentId={assessmentId} />;
}
