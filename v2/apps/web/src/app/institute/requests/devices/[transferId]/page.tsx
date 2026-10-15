import { DeviceRequest } from '@/features/institute/ia-19-device-request/device-request';

/** IA-19 Device request — review and forward (board B3-09 f1 … f5). */
export default async function InstituteDeviceRequest({
  params,
}: {
  readonly params: Promise<{ readonly transferId: string }>;
}) {
  const { transferId } = await params;
  return <DeviceRequest transferId={transferId} />;
}
