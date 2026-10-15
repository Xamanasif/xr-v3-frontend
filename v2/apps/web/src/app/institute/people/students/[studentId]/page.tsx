import { StudentRecord } from '@/features/institute/ia-07-student-record/student-record';

/** IA-07 Student record (board B2-06). */
export default async function InstituteStudentRecord({
  params,
}: {
  readonly params: Promise<{ readonly studentId: string }>;
}) {
  const { studentId } = await params;
  return <StudentRecord studentId={studentId} />;
}
