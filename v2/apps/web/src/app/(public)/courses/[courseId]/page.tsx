import { CoursePage } from '@/features/public/pu-05-course/course';

/** PU-05 Course (B1-03; Appendix A: keyed by the course id, never the code, D-13). */
export default async function PublicCourse({
  params,
}: {
  readonly params: Promise<{ readonly courseId: string }>;
}) {
  const { courseId } = await params;
  return <CoursePage courseId={courseId} />;
}
