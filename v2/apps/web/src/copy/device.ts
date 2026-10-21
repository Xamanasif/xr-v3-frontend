/**
 * ST-18 My device — the words the owner-approved V3 Student export draws (design/v3-refined-b/
 * roles/ST-v1, `project/StudentFinal.dc.html`: the `device` region, `devVM`, `sendDev`,
 * `msg('dev-not')`), verbatim, and the lines it composes for its sample (the request's three dated
 * steps: "Forwarded to BITS" · "Meera Iyer · 23 Oct 2026, 10:00"). The transfer's state words are
 * the role-relative ones of `flow-state-words.ts` (`transferWords(state, 'student')`). No word
 * names the transfer by its record (lead decision 3): the request is told by its steps, From / To
 * and the note. Words the export does not draw are provisional entries of `state-copy-device.ts`.
 */
export const MY_DEVICE_PAGE = {
  /** The top-bar title and the H1. */
  title: 'My device',
  /** `p.rk-sub` under the H1. */
  meta: 'The device authorised for your headset formats',
  /** The kicker over the device's name. */
  authorised: 'Authorised device',
  /** The one primary action while nothing is open. */
  request: 'Request a device transfer',
  /** No new request while the institution's access is paused. */
  paused: 'You can’t request a transfer while your institution’s access is paused.',
  /** The request section's title while there is no request. */
  requests: 'Transfer requests',
  noRequests: 'No transfer requests yet.',
  /** No authorised device recorded. */
  noDeviceTitle: 'No authorised device is recorded for you',
  noDeviceLine:
    'Your institution can tell you more. When a device is authorised for you, it appears here.',
} as const;

/** "Used for VR: " — read by screen readers before the experiments a device is used for. */
export function usedForLabel(code: string): string {
  return `Used for ${code}: `;
}

/** The request form: "New device" is the only required field. */
export const DEVICE_REQUEST_FORM = {
  title: 'Request a device transfer',
  movingFrom: 'Moving from',
  newDevice: 'New device',
  newDeviceHint:
    'Describe it the way your lab or institution labels it — for example, its asset tag.',
  note: 'Anything your Institute Admin should know (optional)',
  whoDecides: 'Your Institute Admin forwards the request to BITS, and BITS decides.',
  cancel: 'Cancel',
  send: 'Send request',
  sending: 'Sending…',
} as const;

/** "Your transfer request": what happens next, the steps, the notice and the facts. */
export const DEVICE_TRANSFER_WORDS = {
  title: 'Your transfer request',
  /** With the Institute Admin. */
  withInstituteAdmin:
    'Your Institute Admin forwards it to BITS. Nothing changes on your device yet.',
  /** With no Institute Admin to forward it. */
  nothingYet: 'Nothing changes on your device yet.',
  /** Forwarded. */
  withBits: 'BITS decides. Nothing changes on your device yet.',
  /** Approved. */
  approved: 'BITS approved the transfer. Your authorised device is updated above.',
  /** The institution has no Institute Admin right now. */
  cantForwardTitle: 'This request can’t be forwarded yet',
  noInstituteAdmin:
    'Your institution has no Institute Admin right now. It stays here until one is assigned.',
  from: 'From',
  to: 'To',
  yourNote: 'Your note',
} as const;

/** The request as three dated steps (`devVM` `steps`). */
export const DEVICE_STEPS = {
  label: 'Steps of your transfer request',
  requested: 'Requested',
  forwarded: 'Forwarded to BITS',
  bitsDecides: 'BITS decides',
  approved: 'Approved by BITS',
  withInstituteAdmin: 'With your Institute Admin',
  waitingForInstituteAdmin: 'Waiting for an Institute Admin',
  withBitsNow: 'With BITS now',
  notYet: 'Not yet',
  /** "Meera Iyer · 23 Oct 2026, 10:00". */
  by: (name: string, when: string) => `${name} · ${when}`,
  /** "Forwarded to BITS, done, Meera Iyer · 23 Oct 2026, 10:00". */
  aria: (title: string, state: 'done' | 'now' | 'next', detail: string) =>
    `${title}, ${state === 'done' ? 'done' : state === 'now' ? 'current' : 'not yet'}${detail ? `, ${detail}` : ''}`,
} as const;

/** The approved request before the open one: "Earlier request · approved 24 Oct 2026". */
export function earlierRequestWords(approvedOn: string): string {
  return `Earlier request · approved ${approvedOn}`;
}

/** "How a transfer works" beside the card. */
export const DEVICE_HOW = {
  title: 'How a transfer works',
  steps: [
    {
      key: 'ask',
      title: 'You ask for the transfer',
      detail: 'Name the new device and add a note if it helps.',
    },
    {
      key: 'forward',
      title: 'Your Institute Admin forwards it',
      detail: 'The request goes to BITS.',
    },
    { key: 'approve', title: 'BITS approves it', detail: 'Your authorised device changes here.' },
  ],
  note: 'A transfer only changes which device is authorised for your headset formats. Your progress stays with you.',
} as const;

/** My device not offered (`msg('dev-not')`): no AR, VR or MR format is given now. */
export const DEVICE_NOT_AVAILABLE = {
  kicker: 'My device',
  title: 'My device isn’t available to you',
  line: 'It’s for students who use AR, VR or MR formats. None of your experiments uses them right now.',
  back: 'Back to Home',
} as const;
