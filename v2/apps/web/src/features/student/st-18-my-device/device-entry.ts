'use client';

/**
 * Who is offered "My device" (XS-05 account-menu entry and ST-18 itself; B3-07 f1 / f2; state-copy
 * `ST-18.offered`, provisional, P3-06 / O-08). The fact comes from what the Student is given now,
 * read through the existing reads — never from the catalogue alone:
 *
 * - a headset format (AR, VR or MR) given on an experiment listed for the Student in My courses
 *   (`listMyCourses`, then `getMyCourse`, the read ST-04 shares): "Available to you" or "Not
 *   available right now", read with the closure lifted, so a paused institution or an inactive
 *   account keeps it (B3-07 f8) — but not while the experiment waits for a licence for them;
 * - or an open transfer request the device service records for them (`getMyDevice`): a request
 *   on its way is never hidden from the Student who sent it (state-coverage DTR-0019, Imran
 *   Shaikh). A device on record alone does not offer it: a Student given no headset format yet
 *   has no entry (B3-07 f2 "has no experiments yet"), as Rahul before his grant (`after-setup`,
 *   whose device the walk seeds at S7).
 *
 * The shell runs these reads for a Student only; the page runs the same ones (one cache entry).
 */
import type { OperationsService } from '@xr/contracts/draft';
import type { Technology } from '@xr/domain';

import { useMyDevice } from '@/queries/devices';
import { type MyExperimentsRead, useMyExperiments } from '@/queries/student';

import { isGiven } from '../shared/student-view';

/** ST-18's read (`OperationsService.getMyDevice`): devices, the open request, the last approved. */
export type MyDeviceRead = Extract<
  Awaited<ReturnType<OperationsService['getMyDevice']>>,
  { readonly ok: true }
>['value'];

const HEADSET_FORMATS: ReadonlySet<Technology> = new Set<Technology>(['ar', 'vr', 'mr']);

/** An AR, VR or MR format is given to the Student now on an experiment listed for them. */
export function holdsHeadsetFormat(read: MyExperimentsRead): boolean {
  return read.rows.some(
    ({ experiment }) =>
      experiment.closure?.kind !== 'waiting-for-a-licence' &&
      experiment.formats.some(
        (entry) => HEADSET_FORMATS.has(entry.format) && isGiven(entry.availability),
      ),
  );
}

/** The entry and the page are offered: a headset format held now, or an open request on record. */
export function offersMyDevice(
  experiments: MyExperimentsRead | null,
  device: MyDeviceRead | null,
): boolean {
  if (experiments !== null && holdsHeadsetFormat(experiments)) return true;
  return device !== null && device.openTransfer !== null;
}

export interface MyDeviceEntry {
  /** `failed`: a read is unavailable (thrown); `pending` until both have answered. */
  readonly status: 'pending' | 'failed' | 'ready';
  /** Whether "My device" is offered; `false` until the reads have answered. */
  readonly offered: boolean;
  /** The Student's listed experiments (`null` when refused). */
  readonly experiments: MyExperimentsRead | null;
  /** The device read (`null` when refused). */
  readonly device: MyDeviceRead | null;
  /** Reads both again ("Try again", or after a refused request). */
  readonly refetch: () => void;
}

/** The two reads behind "My device", for the signed-in Student (`enabled` false: no request). */
export function useMyDeviceEntry(enabled = true): MyDeviceEntry {
  const experiments = useMyExperiments(enabled);
  const device = useMyDevice(enabled);
  const experimentsValue = experiments.data?.ok ? experiments.data.value : null;
  const deviceValue = device.data?.ok ? device.data.value : null;
  const status =
    experiments.isError || device.isError
      ? 'failed'
      : experiments.data === undefined || device.data === undefined
        ? 'pending'
        : 'ready';
  return {
    status,
    offered: status === 'ready' && offersMyDevice(experimentsValue, deviceValue),
    experiments: experimentsValue,
    device: deviceValue,
    refetch: () => {
      void experiments.refetch();
      void device.refetch();
    },
  };
}
