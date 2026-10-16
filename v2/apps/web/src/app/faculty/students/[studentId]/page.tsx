import { FacultyStudentDetail } from '@/features/faculty/fa-21-student/student-detail';

/** FA-21 Student detail, per experiment (`?experimentId=`; board B4-10 f3 … f5). */
export default async function PageFacultyStudentDetail({
  params,
}: {
  readonly params: Promise<{ readonly studentId: string }>;
}) {
  const { studentId } = await params;
  return <FacultyStudentDetail studentId={studentId} />;
}
