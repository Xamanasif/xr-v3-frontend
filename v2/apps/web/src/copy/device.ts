/**
 * ST-18 My device — the words board B3-07 draws (f0 … f9), verbatim, and the lines it composes
 * for its sample (DTR-0018: "Requested by Rahul Verma", "Forwarded to BITS by Meera Iyer",
 * "Approved by BITS", "Used for VR · Shell-and-Tube Heat Exchanger"). The transfer's state words
 * are the role-relative ones of `flow-state-words.ts` (`transferWords(state, 'student')`). Words
 * no board draws are provisional entries of `state-copy-device.ts`.
 */
import type { FormatCode } from '@xr/domain';

export const MY_DEVICE_PAGE = {
  /** The top-bar title, the current crumb and the H1 (f0). */
  title: 'My device',
  /** `div.xr-phead-meta` under the H1 (f0). */
  meta: 'The device authorised for your headset formats',
  authorised: 'Authorised device',
  /** The one primary action while nothing is open (f0, f9). */
  request: 'Request a device transfer',
  /** f8: no new request while the institution's access is paused. */
  paused: 'You can’t request a transfer while your institution’s access is paused.',
  history: 'Request history',
  noHistory: 'No transfer requests yet.',
} as const;

/** The request form (f3): "New device" is the only required field. */
export const DEVICE_REQUEST_FORM = {
  title: 'Request a device transfer',
  movingFrom: 'Moving from',
  newDevice: 'New device',
  newDeviceHint:
    'Describe it the way your lab or institution labels it — for example, its asset tag.',
  note: 'Anything your Institute Admin should know',
  optional: '(optional)',
  whoDecides: 'Your Institute Admin forwards the request to BITS, and BITS decides.',
  cancel: 'Cancel',
  send: 'Send request',
  sending: 'Sending…',
} as const;

/** "Your transfer request" (f4 … f7). */
export const DEVICE_TRANSFER_WORDS = {
  title: 'Your transfer request',
  /** f4, f7: with the Institute Admin. */
  withInstituteAdmin:
    'Your Institute Admin forwards it to BITS. Nothing changes on your device yet.',
  /** f5: forwarded. */
  withBits: 'BITS decides. Nothing changes on your device yet.',
  /** f6: approved. */
  approved: 'BITS approved the transfer. Your authorised device is updated above.',
  /** f7: the institution has no Institute Admin right now. */
  cantForwardTitle: 'This request can’t be forwarded yet',
  noInstituteAdmin:
    'Your institution has no Institute Admin right now. It stays here until one is assigned.',
  from: 'From',
  to: 'To',
} as const;

/** "Used for VR · Shell-and-Tube Heat Exchanger" (f0): the format, then the experiments, if any. */
export function usedForWords(format: FormatCode, experiments: readonly string[]): string {
  const used = `Used for ${format}`;
  return experiments.length === 0 ? used : `${used} · ${experiments.join(', ')}`;
}

/** The history's lines (f4 … f6), newest first on the page. */
export const DEVICE_HISTORY = {
  requested: (name: string) => `Requested by ${name}`,
  forwarded: (name: string) => `Forwarded to BITS by ${name}`,
  approved: 'Approved by BITS',
  /** The request's note: "From <current device> to <new device>". */
  fromTo: (from: string, to: string) => `From ${from} to ${to}`,
  /** The approval's note. */
  nowAuthorised: (device: string) => `The authorised device is now: ${device}`,
} as const;
