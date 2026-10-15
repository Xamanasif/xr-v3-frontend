import { FacultyCourse } from '@/features/faculty/fa-03-course/course';

/** FA-03 Course, the teaching view (board B4-02 f1). */
export default async function FacultyCoursePage({
  params,
}: {
  readonly params: Promise<{ readonly courseId: string }>;
}) {
  const { courseId } = await params;
  return <FacultyCourse courseId={courseId} />;
}
