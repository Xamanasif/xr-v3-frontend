import { EditQuestion } from '@/features/faculty/fa-15-question/question-editor';

/** FA-15 Edit a question (board B4-07 f4). */
export default async function FacultyEditQuestionPage({
  params,
}: {
  readonly params: Promise<{ readonly questionId: string }>;
}) {
  const { questionId } = await params;
  return <EditQuestion questionId={questionId} />;
}
