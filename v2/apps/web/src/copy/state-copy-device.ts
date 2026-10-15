import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of Phase 3's ST-18 My device (B3-07) — part of the one register
 * (`state-copy.ts`, VD-12): every state string or rule the page and its account-menu entry show
 * that B3-07 does not draw word for word.
 */
export const STATE_COPY_DEVICE = {
  'ST-18.offered': {
    screen: 'ST-18',
    state: 'Who is offered “My device” (the account-menu entry and the page)',
    words: null,
    rule: 'A Student who holds an AR, VR or MR format now: an experiment listed for them in My courses (`listMyCourses`, then `getMyCourse`) has that format “Available to you” (or “Not available right now”), unless the experiment is waiting for a licence for them — or the device service records an open transfer request of theirs (`getMyDevice`), so a request on its way is never hidden from its sender. An authorised device on record alone does not offer it, and the catalogue alone never decides it. A paused institution or an inactive account keeps the entry (B3-07 f8). Anyone else: no entry, never a disabled item.',
    basis:
      'B3-07 f1 (“Entry · account menu (Rahul has VR)”), f2 (“Entry hidden · no AR / VR / MR formats”: “Vikram has no experiments yet”), f8; board 06 “My device*”. No board states which reads decide it.',
    status: 'provisional',
    decisions: ['P3-06', 'O-08'],
  },
  'ST-18.direct-visit': {
    screen: 'ST-18',
    state: '`/student/device` opened by a Student who is not offered “My device”',
    words: null,
    rule: 'The in-shell not-found page (PU-15), as for any address that holds nothing for this person; nothing in the sidebar is current.',
    basis:
      'Appendix G P3-06 (provisional recommendation); only the hidden menu entry is drawn (B3-07 f2)',
    status: 'provisional',
    decisions: ['P3-06', 'O-08'],
  },
  'ST-18.loading': {
    screen: 'ST-18',
    state: 'My device loading (screen readers)',
    words: 'Loading your device',
    basis: 'Board 04 “State grammar” Loading formula; B3-07 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-18.failed': {
    screen: 'ST-18',
    state: 'My device failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load your device',
    basis:
      'B2-11 f10 failed pattern (“We couldn’t load …” / “Nothing has changed. Try again.”); B3-07 draws no failed frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-18.no-device': {
    screen: 'ST-18',
    state: 'A Student who holds an AR, VR or MR format but has no authorised device recorded',
    words: 'No authorised device is recorded for you yet.',
    rule: 'Shown in “Authorised device” in place of the device; no transfer is offered (there is nothing to move). Nothing says how or when a device is recorded: no device registry is designed and the product build never records one (only seed fixtures do).',
    basis:
      'B3-07 draws only a Student with a device; Appendix F S7 (the device is a seeded value); OperationsService refuses `no-authorised-device`',
    status: 'provisional',
    decisions: ['P3-03', 'D20b'],
  },
  'ST-18.several-devices': {
    screen: 'ST-18',
    state: 'A Student with more than one authorised device (`canRequest` answers OD-B3-01)',
    words: 'A transfer can’t be requested here while more than one device is authorised for you.',
    rule: 'Every authorised device is listed, each with its format; no device picker and no “Request a device transfer”.',
    basis: 'B3-07 draws one device; provisional register PC-28 (canRequest carries OD-B3-01)',
    status: 'provisional',
    decisions: ['OD-B3-01', 'P3-03'],
  },
  'ST-18.used-for': {
    screen: 'ST-18',
    state: 'The line under the authorised device',
    words: null,
    rule: '“Used for <format> · <experiments>”: the device’s format, then the names of the experiments it is used for that are listed for the Student now, joined with commas; none listed: “Used for <format>”.',
    basis: 'B3-07 f0 (“Used for VR · Shell-and-Tube Heat Exchanger”, one experiment)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-18.after-approval': {
    screen: 'ST-18',
    state: 'After BITS approved the last request (nothing open)',
    words: null,
    rule: '“Your transfer request” keeps the approved request (B3-07 f6). “Request a device transfer” is offered whenever the device service says a request can be made (`canRequest`): one open request at a time, so once the last one is approved a new one may be sent.',
    basis:
      'B3-07 f6 draws the moment of approval without the button (its canvas offers the request only before the first one); “One request at a time · While a request is open, its status replaces the Request button.”',
    status: 'provisional',
    decisions: ['OD-B3-03', 'P3-03'],
  },
  'ST-18.paused-forwarding': {
    screen: 'ST-18',
    state:
      'An open request while the institution’s access is paused (`forwardingBlocked: institution-paused`)',
    words: 'Your institution’s access is paused. It stays here until the access is restored.',
    rule: 'In the drawn “This request can’t be forwarded yet” notice (B3-07 f7), in place of its no-Institute-Admin line.',
    basis:
      'B3-07 f7 (the notice) and f8 (paused: no new request); DTR-08 (not forwarded while paused)',
    status: 'provisional',
    decisions: ['P3-03'],
  },
  'ST-18.refused-open': {
    screen: 'ST-18',
    state: 'Send request refused: a request is already open (`transfer-already-open`)',
    words: 'You already have a transfer request open.',
    rule: 'A notice above the sections; the page reads the device again, so the open request shows in place of the form.',
    basis:
      'B3-07 “One request at a time” (the design does not offer a second); no refusal frame is drawn',
    status: 'provisional',
    decisions: ['OD-B3-03', 'P3-03'],
  },
  'ST-18.refused-paused': {
    screen: 'ST-18',
    state:
      'Send request refused: the institution’s access was paused meanwhile (`institution-paused`)',
    words: null,
    rule: 'B3-07 f8’s words (“You can’t request a transfer while your institution’s access is paused.”) in a notice above the sections; the page reads the device again.',
    basis: 'B3-07 f8 (no new request while paused); no refusal frame is drawn',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-18.refused-no-device': {
    screen: 'ST-18',
    state: 'Send request refused: no authorised device is recorded (`no-authorised-device`)',
    words: null,
    rule: '`ST-18.no-device`’s words in a notice above the sections; the page reads the device again.',
    basis: 'OperationsService refusal; no frame is drawn',
    status: 'provisional',
    decisions: ['P3-03', 'D20b'],
  },
  'ST-18.unavailable': {
    screen: 'ST-18',
    state: 'Send request failed for now (service unavailable)',
    words: null,
    rule: 'Nothing changes: the form keeps what was typed and can be sent again; no message is shown.',
    basis:
      'Appendix F §6.6 “command unavailable → nothing changes … answers kept”; B3-07 draws no failure (as `IA-10.unavailable`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-18.history': {
    screen: 'ST-18',
    state: 'What “Request history” lists',
    words: null,
    rule: 'Each step of the Student’s open request and of the last approved one, newest first: “Requested by <Student>” (note “From <device> to <new device>”), “Forwarded to BITS by <Institute Admin>”, “Approved by BITS” (note “The authorised device is now: <new device>”) — the Super Admin is never named; the Student’s own note is not repeated.',
    basis: 'B3-07 f4 … f6 (one request, DTR-0018)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
