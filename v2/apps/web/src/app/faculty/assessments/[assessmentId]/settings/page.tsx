import { AssessmentSettings } from '@/features/faculty/fa-10-assessment-settings/assessment-settings';

/** FA-10 Assessment · Settings (board B4-06 f0 … f4). */
export default async function FacultyAssessmentSettingsPage({
  params,
}: {
  readonly params: Promise<{ readonly assessmentId: string }>;
}) {
  const { assessmentId } = await params;
  return <AssessmentSettings assessmentId={assessmentId} />;
}
