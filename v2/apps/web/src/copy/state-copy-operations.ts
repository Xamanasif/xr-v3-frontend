import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of SA-18 Device transfers and SA-19 Device transfer decision — part of the
 * one register (`state-copy.ts`, VD-12) — in the owner-approved V3 Refined B design (the Super
 * Admin export, design/v3-refined-b/roles/SA-v1, `project/sa-views-d.js` `V.transfers`,
 * `V.transfer`).
 *
 * The export draws the three list views, their loading, failed and empty states, the decision,
 * its confirmation, the approved record, a transfer still with its institution and a refusal of the
 * approval. Its words are here where a screen reads them as a state (`owner-approved`, basis
 * "SA-v1 …"); the rules the screens apply where the export differs from the product or stays
 * silent are here too. The refusal's words follow the repo's conflict formula, not the export's
 * proposal (SA-v1 HANDOFF "Use the existing conflict wording"). The SA-07 device-transfer row is
 * `SA-07.attention-later` (state-copy.ts).
 */
export const STATE_COPY_OPERATIONS = {
  // ---- SA-18 Operations › Device transfers (SA-v1 `V.transfers`) ----
  'SA-18.tabs': {
    screen: 'SA-18',
    state: 'The Operations head and tabs',
    words: null,
    rule: 'The three lists share one head: the date line (phones), “Operations” (the H1, which takes focus with the route), “Device transfers, support reports and access that is ending.”, then the page tabs Device transfers · Support · Access ending — links, the current one `aria-current="page"` (`nav.rk-tabs.sa-tabs`), the same on all three lists.',
    basis: 'SA-v1 sa-views-d.js `opsHead`; SA-v1 LINK-MAP (SA-18/SA-20/SA-22 tabs)',
    status: 'owner-approved',
    decisions: ['SA-v1'],
  },
  'SA-18.show-address': {
    screen: 'SA-18',
    state: 'The view switch and the address',
    words: null,
    rule: 'The views are the export’s segmented switch (`sa-seg` around `rb-switch`: buttons with `aria-pressed`, each with its count): Forwarded to BITS · Still with an institution · Approved. “Forwarded to BITS” is the list’s own address; the others add `?show=with-institution` / `?show=approved`. Choosing a view replaces the address (no history entry); an address from outside is read again, and one whose `show` names no view is replaced by the list’s own address. Each view is the service’s answer for that state (`listDeviceTransfers({ state })`); the counts are its answer for every state (`listDeviceTransfers({})`) and are left out while they are not known.',
    basis:
      'SA-v1 sa-views-d.js `V.transfers` (`SA.seg`), COMPONENT-EXTENSIONS `sa-seg`; Appendix A register routes (query filters); as SA-20’s `?show=`',
    status: 'owner-approved',
    decisions: ['SA-v1'],
  },
  'SA-18.rows': {
    screen: 'SA-18',
    state: 'The rows of each view',
    words: null,
    rule: 'Newest first (forwarded: by when it was forwarded; still with an institution: by when it was requested; approved: by when it was approved). Every row opens its transfer (SA-19), its link named by content (“VR device transfer for Rahul Verma, Forwarded. Open”) — the DTR reference is never shown. The Student is the record’s own “requested” entry, the institution is named from the institutions list.',
    basis:
      'SA-v1 sa-views-d.js `V.transfers` (`rk-rowlink`), LINK-MAP SA-18 → SA-19; SA-v1 HANDOFF (no internal references)',
    status: 'owner-approved',
    decisions: ['SA-v1'],
  },
  'SA-18.forwarded-cell': {
    screen: 'SA-18',
    state: 'The “Forwarded by” and “Forwarded” columns',
    words: null,
    rule: '“Forwarded by”: who forwarded it, with their role (“Meera Iyer, Institute Admin”), or “Not forwarded yet”. “Forwarded”: the day it was forwarded (“23 Oct 2026”), or “Not yet”.',
    basis: "SA-v1 sa-views-d.js `V.transfers` (`t.fwdBy || …`, `t.fwd.split(',')[0]`)",
    status: 'owner-approved',
    decisions: ['SA-v1'],
  },
  'SA-18.loading': {
    screen: 'SA-18',
    state: 'The device transfers loading (over skeleton rows)',
    words: 'Loading device transfers…',
    basis: 'SA-v1 sa-views-d.js `V.transfers` (`SA.listState` loading)',
    status: 'owner-approved',
    decisions: ['SA-v1'],
  },
  'SA-18.failed': {
    screen: 'SA-18',
    state: 'The device transfers failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load the device transfers',
    rule: 'With the shared line “Nothing has changed. Try again.” and “Try again” (`@/copy/sa-shared` SA_FAILED).',
    basis: 'SA-v1 sa-views-d.js `V.transfers` (`SA.listState` failed)',
    status: 'owner-approved',
    decisions: ['SA-v1'],
  },
  'SA-18.empty.forwarded': {
    screen: 'SA-18',
    state: '“Forwarded to BITS” with nothing forwarded',
    words: 'Nothing is waiting for your approval',
    basis: 'SA-v1 sa-views-d.js `V.transfers` (the empty view, `rk-state-t`)',
    status: 'owner-approved',
    decisions: ['SA-v1'],
  },
  'SA-18.empty.with-institution': {
    screen: 'SA-18',
    state: '“Still with an institution” with none waiting',
    words: 'No transfer is still with an institution',
    basis: 'SA-v1 sa-views-d.js `V.transfers` (the empty view, `rk-state-t`)',
    status: 'owner-approved',
    decisions: ['SA-v1'],
  },
  'SA-18.empty.approved': {
    screen: 'SA-18',
    state: '“Approved” with nothing approved',
    words: 'No transfer has been approved yet',
    basis: 'SA-v1 sa-views-d.js `V.transfers` (the empty view, `rk-state-t`)',
    status: 'owner-approved',
    decisions: ['SA-v1'],
  },
  'SA-18.empty.line': {
    screen: 'SA-18',
    state: 'The empty views’ line',
    words: 'Transfers appear here when an Institute Admin forwards a student’s request.',
    basis: 'SA-v1 sa-views-d.js `V.transfers` (the empty view, `rk-state-d`)',
    status: 'owner-approved',
    decisions: ['SA-v1'],
  },
  // ---- SA-19 Device transfer decision (SA-v1 `V.transfer`, `SA.DLG.approveDtr`) ----
  'SA-19.facts': {
    screen: 'SA-19',
    state: '“The transfer” facts the record does not carry itself',
    words: null,
    rule: 'The Student’s name is the record’s own “requested” entry; their institution number (“GIT-2026-0418”, institution data, kept — open owner decision 7) and the institution’s name come from the institution (`getInstitution`) — the number is left out when the institution does not list the Student. The experiment is named from the published catalogue; a transfer that names no experiment reads its format alone. The Student’s note is quoted and left out when there is none; “Forwarded by” is who forwarded it, with their role, left out before it is forwarded.',
    basis:
      'SA-v1 sa-views-d.js `V.transfer` (`rows`); the DTR record (studentId, institutionId, experimentId, forwarded.by)',
    status: 'owner-approved',
    decisions: ['SA-v1'],
  },
  'SA-19.loading': {
    screen: 'SA-19',
    state: 'The device transfer loading (over skeleton rows)',
    words: 'Loading the device transfer…',
    basis:
      'Board 04 "State grammar" Loading formula, in the kit’s loading rows (`SaRecordGuard`); the export draws no loading record',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-19.failed': {
    screen: 'SA-19',
    state: 'The device transfer failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load the device transfer',
    rule: 'With the shared line “Nothing has changed. Try again.” and “Try again” (`SaRecordGuard`).',
    basis:
      'SA-v1 `SA.listState` failed formula (as `SA-18.failed`); the export draws no failed record',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-19.unknown': {
    screen: 'SA-19',
    state: 'An address that names no transfer the Super Admin’s list holds',
    words: null,
    rule: 'The GL-04 message “This page isn’t available” in place (`SaRecordGuard`, `@/copy/sa-shared`), its place named “Not available” — never the address’s reference (the port has no single-transfer read for the Super Admin: the page reads its transfer from `listDeviceTransfers`).',
    basis: 'SA-v1 sa-core.js `SA.resolve` (`nf`); OperationsService `listDeviceTransfers`',
    status: 'owner-approved',
    decisions: ['SA-v1'],
  },
  'SA-19.moved-on': {
    screen: 'SA-19',
    state:
      'Approve refused because the transfer moved on (a stale revision; approved elsewhere; not yet forwarded) — or the panel ended by such a change while in use',
    words: null,
    rule: 'Nothing is written: the confirmation closes, the transfer is read again and the panel shows its current state (approved: read-only with who and when) under the refusal notice (`SA-19.stale.*`, “Check it again” closes it and moves focus to the page’s heading); focus goes to the decision panel’s heading. The confirmation keeps the transfer’s revision from when it opened, so a change shown meanwhile is refused, never acted on. Approving is the only decision on a transfer (T-32).',
    basis:
      'SA-v1 sa-views-d.js `V.transfer` (`SA.refusalHtml`), ROLE-STATUS SA-19 “stale refusal”; Appendix G P1-21 interim (“Refetch and render the current drawn state”)',
    status: 'provisional',
    decisions: ['P1-21', 'T-32'],
  },
  'SA-19.stale.title': {
    screen: 'SA-19',
    state: 'The refusal notice’s title (Approve refused: the transfer changed since it was opened)',
    words: 'This device transfer changed since you opened it',
    basis:
      'Board 08 “conflict” formula (as SA-21.stale.title, SA-11.stale.title); the export’s proposal (“This record changed after you opened it”) is not used — SA-v1 HANDOFF open decision 8',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-19.stale.line': {
    screen: 'SA-19',
    state: 'The refusal notice’s line',
    words: 'It has been read again. Check it, then decide again.',
    basis:
      'Board 08 “conflict” formula (as SA-21.stale.line, CM-03.stale.line); SA-v1 HANDOFF open decision 8',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-19.unavailable': {
    screen: 'SA-19',
    state: 'Approve failed for now (service unavailable; a test fault plan only)',
    words: null,
    rule: 'Nothing changes: the confirmation stays open and can be confirmed again; no message.',
    basis:
      'The export draws no failure for its command; Appendix F §6.6 “command unavailable → nothing changes” (as SA-07.unavailable)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
