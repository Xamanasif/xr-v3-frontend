/**
 * A device request's status tone as the owner-approved Institute Admin export draws it (IA-v1
 * `Main.dc.html` `DTRW`): Waiting on you `warn` (the half disc), Forwarded to BITS `info`, Decided
 * · approved by BITS `ok` — the V3 grammar of the shared v46 tones (`shared/transfer-view.ts`
 * `TRANSFER_TONE`: `wait`, `info`, `ok`), which IA-01 still reads.
 */
import type { DeviceTransferState } from '@xr/domain';
import type { StatusTone } from '@xr/ui/v3';

export const TRANSFER_V3_TONE: Readonly<Record<DeviceTransferState, StatusTone>> = {
  'with-institute-admin': 'warn',
  forwarded: 'info',
  approved: 'ok',
};
