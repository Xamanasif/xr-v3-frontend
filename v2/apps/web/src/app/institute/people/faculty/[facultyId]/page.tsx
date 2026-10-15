import { FacultyRecord } from '@/features/institute/ia-09-faculty-record/faculty-record';

/** IA-09 Faculty record (board B2-06 f15, f16). */
export default async function InstituteFacultyRecord({
  params,
}: {
  readonly params: Promise<{ readonly facultyId: string }>;
}) {
  const { facultyId } = await params;
  return <FacultyRecord facultyId={facultyId} />;
}
