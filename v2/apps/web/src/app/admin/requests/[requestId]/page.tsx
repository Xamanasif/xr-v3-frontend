import { RequestDecision } from '@/features/admin/sa-03-request-decision/request-decision';

/** SA-03 Request decision (board B1-11). */
export default async function AdminRequestDecision({
  params,
}: {
  readonly params: Promise<{ readonly requestId: string }>;
}) {
  const { requestId } = await params;
  return <RequestDecision requestId={requestId} />;
}
