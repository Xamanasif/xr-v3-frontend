import { AssessmentQuestions } from '@/features/faculty/fa-09-assessment-questions/assessment-questions';

/** FA-09 Assessment · Questions (board B4-05 f6 … f8). */
export default async function FacultyAssessmentQuestionsPage({
  params,
}: {
  readonly params: Promise<{ readonly assessmentId: string }>;
}) {
  const { assessmentId } = await params;
  return <AssessmentQuestions assessmentId={assessmentId} />;
}
