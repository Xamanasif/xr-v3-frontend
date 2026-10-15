import { MyCourse } from '@/features/student/st-03-course/course';

/** ST-03 Course (student view) (board B2-11). */
export default async function StudentCourse({
  params,
}: {
  readonly params: Promise<{ readonly courseId: string }>;
}) {
  const { courseId } = await params;
  return <MyCourse courseId={courseId} />;
}
