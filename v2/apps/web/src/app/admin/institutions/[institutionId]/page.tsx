import { InstitutionDetail } from '@/features/admin/sa-07-institution-detail/institution-detail';

/** SA-07 Institution detail (boards B7-03, B7-04). */
export default async function AdminInstitutionDetail({
  params,
}: {
  readonly params: Promise<{ readonly institutionId: string }>;
}) {
  const { institutionId } = await params;
  return <InstitutionDetail institutionId={institutionId} />;
}
