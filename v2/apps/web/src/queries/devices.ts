'use client';

/**
 * The device-transfer chain (Phase 3: ST-18, IA-18, IA-19, SA-18, SA-19; boards B3-07, B3-09,
 * B3-11; Device 1–3), through `OperationsService`. One shared record per request (DTR): the
 * Student's request, the Institute Admin's forward and the Super Admin's approval are commands
 * (`useCommand(ports => ports.operations.requestDeviceTransfer | forwardDeviceTransfer |
 * approveDeviceTransfer)`) whose receipts (`changed: DTR`) refresh every read below in the same
 * tab. A transfer is an authorisation change only: nothing is shipped, no device is provisioned,
 * and there is no decline (T-32). Each port answers only what its reader may see.
 */
import type { ProductPorts } from '@xr/contracts/draft';
import type { DeviceTransferId } from '@xr/domain';

import { defineQuery, useXrQuery } from './use-xr-query';

/** The transfer reads depend on the transfers and devices, the institution and its people. */
const DEVICE_DEPS = ['DTR', 'INST', 'PER', 'SACC', 'ACC', 'EXP'] as const;

type TransferState = 'with-institute-admin' | 'forwarded' | 'approved';

/** ST-18: the Student's authorised devices, the open request and the last approved one. */
export const myDevice = defineQuery({
  family: 'DTR',
  view: 'my-device',
  deps: DEVICE_DEPS,
  read: (ports: ProductPorts) => ports.operations.getMyDevice(),
});

export function useMyDevice(enabled = true) {
  return useXrQuery(myDevice, null, { enabled });
}

/** IA-18: the institution's device requests (`listDeviceRequests`), optionally one state. */
export const deviceRequests = defineQuery({
  family: 'DTR',
  view: 'institute-device-requests',
  deps: DEVICE_DEPS,
  read: (ports: ProductPorts, state: TransferState | null) =>
    ports.operations.listDeviceRequests(state === null ? {} : { state }),
});

export function useDeviceRequests(state: TransferState | null = null, enabled = true) {
  return useXrQuery(deviceRequests, state, { enabled });
}

/** IA-19: one of the institution's device requests (`getDeviceRequest`). */
export const deviceRequest = defineQuery({
  family: 'DTR',
  view: 'institute-device-request',
  deps: DEVICE_DEPS,
  // The address is untrusted text: existence and scope are the adapter's answer (lenient ids).
  read: (ports: ProductPorts, transferId: string) =>
    ports.operations.getDeviceRequest(transferId as DeviceTransferId),
});

export function useDeviceRequest(transferId: string, enabled = true) {
  return useXrQuery(deviceRequest, transferId, { enabled });
}

/**
 * SA-18 / SA-19: the device transfers the Super Admin may see (`listDeviceTransfers`), optionally
 * one state. SA-19 reads its transfer from this list: the port has no single-transfer read for
 * the Super Admin.
 */
export const deviceTransfers = defineQuery({
  family: 'DTR',
  view: 'device-transfers',
  deps: DEVICE_DEPS,
  read: (ports: ProductPorts, state: TransferState | null) =>
    ports.operations.listDeviceTransfers(state === null ? {} : { state }),
});

export function useDeviceTransfers(state: TransferState | null = null, enabled = true) {
  return useXrQuery(deviceTransfers, state, { enabled });
}
