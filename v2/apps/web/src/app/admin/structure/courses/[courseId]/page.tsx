import { CourseRecord } from '@/features/admin/sa-15-structure-record/course-record';

/** SA-15 Course record (boards B7-07 f1 … f4, f8; B7-10). */
export default async function PageCourseRecord({
  params,
}: {
  readonly params: Promise<{ readonly courseId: string }>;
}) {
  const { courseId } = await params;
  return <CourseRecord courseId={courseId} />;
}
