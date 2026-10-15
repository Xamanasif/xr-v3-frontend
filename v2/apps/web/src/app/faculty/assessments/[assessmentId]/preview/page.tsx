import { AssessmentPreview } from '@/features/faculty/fa-11-assessment-preview/assessment-preview';

/** FA-11 Assessment · Preview (`?view=key`; board B4-06 f5, f6). */
export default async function FacultyAssessmentPreviewPage({
  params,
}: {
  readonly params: Promise<{ readonly assessmentId: string }>;
}) {
  const { assessmentId } = await params;
  return <AssessmentPreview assessmentId={assessmentId} />;
}
