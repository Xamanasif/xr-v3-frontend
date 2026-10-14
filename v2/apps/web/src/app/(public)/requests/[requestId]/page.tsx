import { RequestStatusPage } from '@/features/public/pu-10-request-status/request-status';

/**
 * PU-10 Request status with the PU-13 Access active state (B1-08). `requestId` is the request's
 * opaque address (owner decision DV-5 / O-05): never its reference, never its ticket.
 */
export default async function PublicRequestStatus({
  params,
}: {
  readonly params: Promise<{ readonly requestId: string }>;
}) {
  const { requestId } = await params;
  return <RequestStatusPage routeId={requestId} />;
}
