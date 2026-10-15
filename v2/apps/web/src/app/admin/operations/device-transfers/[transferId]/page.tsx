import { DeviceTransferDecision } from '@/features/admin/sa-19-device-transfer/device-transfer-decision';

/** SA-19 Device transfer decision (boards B3-11 f1 … f7, B7-09, B7-10). */
export default async function AdminDeviceTransfer({
  params,
}: {
  readonly params: Promise<{ readonly transferId: string }>;
}) {
  const { transferId } = await params;
  return <DeviceTransferDecision transferId={transferId} />;
}
