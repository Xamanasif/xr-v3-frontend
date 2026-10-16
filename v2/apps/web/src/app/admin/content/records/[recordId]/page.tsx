import { ContentRecord } from '@/features/admin/sa-13-content-record/content-record';

/** SA-13 Content record (boards B7-06 f1 … f6, f8; B7-10). */
export default async function PageContentRecord({
  params,
}: {
  readonly params: Promise<{ readonly recordId: string }>;
}) {
  const { recordId } = await params;
  return <ContentRecord recordId={recordId} />;
}
