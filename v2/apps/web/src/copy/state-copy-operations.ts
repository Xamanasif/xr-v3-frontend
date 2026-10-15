import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of Phase 3's SA-18 Device transfers and SA-19 Device transfer decision (B3-11, B7-09, B7-10), with the SA-07 rows they enable — part of the one register (`state-copy.ts`, VD-12).
 *
 * B3-11 draws the three list views, the decision, its DL-1 confirmation, the approved record and
 * (with B7-10 f14) a transfer that has not reached BITS; it draws no loading, failed or empty list
 * and no refusal of the approval. Those, and the rules the screens apply where the boards differ or
 * stay silent, are here. The SA-07 device-transfer row is `SA-07.attention-later` (state-copy.ts).
 */
export const STATE_COPY_OPERATIONS = {
  // ---- SA-18 Operations › Device transfers (B3-11 f0, f2, f3; B7-09 f0, f2) ----
  'SA-18.tabs': {
    screen: 'SA-18',
    state: 'The Operations tabs',
    words: null,
    rule: 'The tab strip shows “Device transfers” only, as the current tab: Support (SA-20) and Access ending (SA-22) are Phase 6 and their links are not rendered (DEV-21). The strip is B3-11’s (`nav.xr-tabs` on the page canvas, then the 20 px gap); B7-09’s re-use adds `xr-tabs--on-white` and a 20 px margin, which is not followed — its caption says the B3-11 design is re-used unchanged. The meta line under the title is kept as drawn.',
    basis:
      'B3-11 f0; B7-09 f0 caption (“re-used: only the sidebar and tab links now lead to the Batch-7 destinations”); B8-06 phase plan',
    status: 'provisional',
    decisions: ['DEV-21', 'VD-12'],
  },
  'SA-18.show-address': {
    screen: 'SA-18',
    state: 'The “Show” filter in the address',
    words: null,
    rule: '“Forwarded to BITS” is the list’s own address; “Still with an institution” and “Approved” add `?show=with-institution` / `?show=approved`. Each is a link (`div.xr-seg.xl-seg` of `a`, the current one `aria-current="true"`), and the view is the service’s answer for that state (`listDeviceTransfers({ state })`). An address whose `show` names no view is replaced by the list’s own address.',
    basis:
      'B3-11 f0, f2, f3 (`xl-seg` links); Appendix A register routes (query filters); as IA-02’s `?tab=`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-18.rows': {
    screen: 'SA-18',
    state: 'The rows of each view',
    words: null,
    rule: 'Newest first (forwarded: by when it was forwarded; still with an institution: by when it was requested; approved: by when it was approved). The reference opens the decision (SA-19) on forwarded and approved rows; a row still with its institution shows its reference unlinked and no action, as drawn. Only a forwarded row has “Review”. The line under the reference is the requesting Student (the record’s own “requested” entry) and the format; the institution is named from the institutions list.',
    basis: 'B3-11 f0 (DTR-0018 23 Oct above DTR-0016 21 Oct), f2 (`span.xr-id`, no link), f3',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-18.forwarded-cell': {
    screen: 'SA-18',
    state: 'The “Forwarded” column',
    words: null,
    rule: '“<date, time> · <who forwarded it>” as B3-11’s live row writes it (`fwdText`: “23 Oct 2026, 10:00 · Meera Iyer”); “Not yet” before it is forwarded. The board’s fixed rows write the date alone (“21 Oct 2026 · Institute Admin”, “14 Oct 2026 · Meera Iyer”) — board versus board; the live row is followed.',
    basis: 'B3-11 script `fwdText`; B3-11 f0, f3 fixed rows',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-18.loading': {
    screen: 'SA-18',
    state: 'The device transfers loading (screen readers)',
    words: 'Loading device transfers',
    basis:
      'Board 04 "State grammar" Loading formula (as SA-02 “Loading requests”); B3-11 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-18.failed': {
    screen: 'SA-18',
    state: 'The device transfers failed to load (service unavailable; a test fault plan only)',
    words: 'The device transfers didn’t load. Nothing was lost.',
    basis: 'Board 04 "State grammar" Failed + retry formula (as SA-07.failed)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-18.failed.line': {
    screen: 'SA-18',
    state: 'The failed state’s next step',
    words: 'Try again. If it keeps happening, report the problem.',
    basis: 'Board 03 "Notices, empty, error, loading and read-only" (the failed notice’s line)',
    status: 'drawn',
  },
  'SA-18.empty.forwarded': {
    screen: 'SA-18',
    state: '“Forwarded to BITS” with nothing forwarded',
    words: 'No device transfers waiting for BITS',
    basis:
      'Board 04 "State grammar" Empty formula (icon, one line, one next step; never “No data”); B3-11 draws no empty view',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-18.empty.forwarded.line': {
    screen: 'SA-18',
    state: 'The empty forwarded view’s line',
    words: 'A transfer appears here when an Institute Admin forwards it.',
    basis:
      'Board 04 Empty formula, worded after B3-11 `beforeSA` (“It appears here when the Institute Admin forwards it.”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-18.empty.with-institution': {
    screen: 'SA-18',
    state: '“Still with an institution” with none waiting',
    words: 'No device transfers are with an institution',
    basis: 'Board 04 "State grammar" Empty formula; B3-11 draws no empty view',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-18.empty.with-institution.line': {
    screen: 'SA-18',
    state: 'The empty “Still with an institution” view’s line',
    words: 'A Student’s request waits here until their Institute Admin forwards it.',
    basis: 'Board 04 Empty formula; B3-11 f2 caption (“Not BITS’s to decide yet”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-18.empty.approved': {
    screen: 'SA-18',
    state: '“Approved” with nothing approved',
    words: 'No device transfers approved yet',
    basis: 'Board 04 "State grammar" Empty formula; B3-11 draws no empty view',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-18.empty.approved.line': {
    screen: 'SA-18',
    state: 'The empty approved view’s line',
    words: 'Transfers you approve appear here.',
    basis: 'Board 04 Empty formula',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  // ---- SA-19 Device transfer decision (B3-11 f1, f4 … f7; B7-09 f1, f3; B7-10 f14) ----
  'SA-19.facts': {
    screen: 'SA-19',
    state: '“The transfer” facts the record does not carry itself',
    words: null,
    rule: 'The Student’s name is the record’s own “requested” entry; their institution ID (“GIT-2026-0418”) and the institution’s name come from the institution (`getInstitution`) — the ID is left out when the institution does not list the Student. The experiment is named from the published catalogue; a transfer that names no experiment reads its format alone. “Forwarded by” is who forwarded it, with their role.',
    basis:
      'B3-11 f1 (`Student`, `Institution`, `Format`, `Forwarded by`); the DTR record (studentId, institutionId, experimentId, forwarded.by)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-19.loading': {
    screen: 'SA-19',
    state: 'The device transfer loading (screen readers)',
    words: 'Loading the device transfer',
    basis:
      'Board 04 "State grammar" Loading formula (as SA-03.loading); B3-11 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-19.failed': {
    screen: 'SA-19',
    state: 'The device transfer failed to load (service unavailable; a test fault plan only)',
    words: 'The device transfer didn’t load. Nothing was lost.',
    basis: 'Board 04 "State grammar" Failed + retry formula (as SA-03.failed)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-19.failed.line': {
    screen: 'SA-19',
    state: 'The failed state’s next step',
    words: 'Try again. If it keeps happening, report the problem.',
    basis: 'Board 03 "Notices, empty, error, loading and read-only" (the failed notice’s line)',
    status: 'drawn',
  },
  'SA-19.unknown': {
    screen: 'SA-19',
    state: 'An address that names no transfer the Super Admin’s list holds',
    words: null,
    rule: 'The in-shell not-found page (the port has no single-transfer read for the Super Admin: the page reads its transfer from `listDeviceTransfers`).',
    basis: 'ADR-0005 §5 record guards; OperationsService `listDeviceTransfers`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-19.moved-on': {
    screen: 'SA-19',
    state:
      'Approve refused because the transfer moved on (a stale revision; approved elsewhere; not yet forwarded) — or the panel ended by such a change while in use',
    words: null,
    rule: 'Nothing is written: the confirmation closes, the transfer is read again and the page shows its current drawn state (approved: read-only with who and when). No notice; focus goes to the decision panel’s heading. The confirmation keeps the transfer’s revision from when it opened, so a change shown meanwhile is refused, never acted on. Approving is the only decision on a transfer (T-32).',
    basis:
      'Appendix G P1-21 interim (“Refetch and render the current drawn state”); as SA-03.moved-on; B3-11 draws no refusal',
    status: 'provisional',
    decisions: ['P1-21', 'T-32'],
  },
  'SA-19.unavailable': {
    screen: 'SA-19',
    state: 'Approve failed for now (service unavailable; a test fault plan only)',
    words: null,
    rule: 'Nothing changes: the confirmation stays open and can be confirmed again; no message.',
    basis:
      'B3-11 draws no failure for its command; Appendix F §6.6 “command unavailable → nothing changes” (as SA-07.unavailable)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
