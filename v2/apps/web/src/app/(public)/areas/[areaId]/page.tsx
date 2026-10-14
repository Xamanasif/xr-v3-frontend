import { AreaPage } from '@/features/public/pu-03-area/area';

/** PU-03 Engineering area (B1-03). */
export default async function PublicArea({
  params,
}: {
  readonly params: Promise<{ readonly areaId: string }>;
}) {
  const { areaId } = await params;
  return <AreaPage areaId={areaId} />;
}
