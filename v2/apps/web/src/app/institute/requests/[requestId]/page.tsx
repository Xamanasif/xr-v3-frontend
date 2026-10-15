import { InstituteRequestDetail } from '@/features/institute/ia-17-requests/request-detail';

/** IA-17's request detail (board B3-08 f4 … f6; no screen id of its own, O-02). */
export default async function InstituteRequestDetailPage({
  params,
}: {
  readonly params: Promise<{ readonly requestId: string }>;
}) {
  const { requestId } = await params;
  return <InstituteRequestDetail requestId={requestId} />;
}
