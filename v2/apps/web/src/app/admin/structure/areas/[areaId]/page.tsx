import { AreaRecord } from '@/features/admin/sa-15-structure-record/area-record';

/** SA-15 Area record (board B7-07 f5, f6). */
export default async function PageAreaRecord({
  params,
}: {
  readonly params: Promise<{ readonly areaId: string }>;
}) {
  const { areaId } = await params;
  return <AreaRecord areaId={areaId} />;
}
