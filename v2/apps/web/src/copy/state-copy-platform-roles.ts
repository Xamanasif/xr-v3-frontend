import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of SA-16 Platform roles and SA-17 Role holder — part of the one register
 * (`state-copy.ts`, VD-12): every state string or rule these screens show, with its basis and the
 * decisions it waits on. The screens follow the owner-approved Super Admin export (V3 Refined B,
 * design/v3-refined-b/roles/SA-v1 `sa-views-d.js` `V.roles`, `V.holder`); a state the export draws
 * takes its words (cited “SA-v1 …”), one it does not draw keeps the Phase 6 words (B7-08, B7-10).
 * Decision ids never appear in visible copy.
 */
export const STATE_COPY_PLATFORM_ROLES = {
  // ---- SA-16 Platform roles ----
  'SA-16.tab-address': {
    screen: 'SA-16',
    state: 'Which tab the address names',
    words: null,
    rule: 'The bare address is Vendors (the first tab); `?tab=reviewers` and `?tab=content-managers` name the others. The page tabs are links to those addresses (choosing one is a move, Back returns to the tab before). `?tab=vendors` and a value that names no tab are replaced by the bare address (no history entry).',
    basis:
      'SA-v1 `sa-views-d.js` `V.roles` `nav.rk-tabs.sa-tabs` (links with counts); SA-v1 LINK-MAP SA-16 tabs; Appendix A routes.json SA-16 (D-11: “?tab=vendors accepted and normalised”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-16.loading': {
    screen: 'SA-16',
    state: 'The holders loading (the surface’s status; skeleton rows)',
    words: 'Loading role holders…',
    basis: 'SA-v1 `sa-views-d.js` `V.roles` list state “loading” (`SA.listState`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-16.failed': {
    screen: 'SA-16',
    state: 'The holders failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load the role holders',
    rule: 'The surface shows the failed state with “Nothing has changed. Try again.” and Try again; the page head, the tabs and the foot note stay.',
    basis: 'SA-v1 `sa-views-d.js` `V.roles` list state “failed” (`SA.listState`, Try again)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-16.failed.line': {
    screen: 'SA-16',
    state: 'The failed state’s reassurance',
    words: 'Nothing has changed. Try again.',
    basis:
      'SA-v1 `sa-core.js` `SA.listState` “failed” (every Super Admin list; `copy/sa-shared.ts`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-16.empty': {
    screen: 'SA-16',
    state: 'A tab with no holders (none registered for that role)',
    words: 'Nobody is registered in this role yet',
    rule: 'Shown in the surface with the person icon; the head’s “Register a …” and the foot note stay; no no-scope notice.',
    basis: 'SA-v1 `sa-views-d.js` `V.roles` list state “empty” (`emptyT`, `emptyIco: rki-user`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-16.empty.line': {
    screen: 'SA-16',
    state: 'The empty tab’s line',
    words: 'Register someone, then assign what they can act on.',
    basis: 'SA-v1 `sa-views-d.js` `V.roles` list state “empty” (`emptyD`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-16.can-act-on': {
    screen: 'SA-16',
    state: 'How a row’s “Can act on”, “Scope” and the no-scope notice are written',
    words: null,
    rule: 'The holder’s active scopes in the order they were assigned: a course as its platform code chip (by its name while it has none), “All experiments”, one experiment by its name; with none active, “Nothing yet”. Below, “N scope(s) withdrawn” counts the withdrawn scopes still listed on SA-17 (a scope assigned or restored again is history only). “Scope” is Has scope or No scope. The notice above the table names the tab’s one holder with no active scope (“<name> has no scope yet”) or counts them (“N role holders have no scope yet”), with the role’s line and “Assign scope” to the first of them.',
    basis:
      'SA-v1 `sa-views-d.js` `V.roles` (rows, `none` notice); service facts PC-70; course without a code: CM-03 rule (T-17)',
    status: 'provisional',
    decisions: ['VD-12', 'T-17'],
  },
  'SA-16.register-result': {
    screen: 'SA-16',
    state: 'Register succeeded',
    words: null,
    rule: 'The dialog closes and the new holder opens on SA-17 (a new history entry) with the flash “<name> is registered as <role>.” and “Assign what they can act on. Nothing was sent to them.”; focus moves to the holder’s name (h1). Nothing is sent (T-11).',
    basis:
      'SA-v1 `sa-views-d.js` `SA.DLG.register` `run` (`SA.setFlash`, `SA.go` to the holder); Appendix A routes.json SA-16 “Register success: opens the new holder on SA-17 with a flash”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-16.register-identity': {
    screen: 'SA-16',
    state:
      'Register refused: the work e-mail is already registered, or another sample identity signs in with it',
    words: null,
    rule: 'The service’s field error is shown under Work e-mail in SA-16’s words (“Someone is already registered with this e-mail address”); nobody is merged or replaced, and the other person is not named.',
    basis:
      'SA-v1 HANDOFF SA-16/17 “collision check on e-mail”, “Identity takeover” must not exist; Phase-2 Package 2B identity safeguard (PC-49)',
    status: 'provisional',
    decisions: ['PC-49', 'T-11'],
  },
  'SA-16.vendor-start': {
    screen: 'SA-16',
    state: 'Register a Vendor: what they can submit to from the start (owner decision PD-3)',
    words: 'What can they submit to?',
    rule: 'Only in Register a Vendor, under Organisation: two radio cards, “Any course” selected when the dialog opens and changeable before Register. “Any course” registers the Vendor with the All experiments scope in the same write (the history reads registered, then scope assigned); “Assign courses next” registers them with no scope, as before. Nothing else in the dialog changes; Reviewers and Content Managers are registered as drawn.',
    basis:
      'Owner decision PD-3 option C, 27 Oct 2026 (Vendor ownership audit); SA-v1 `SA.DLG.register` draws name, work e-mail and organisation only; contract PC-75',
    status: 'provisional',
    decisions: ['VD-12', 'PD-3'],
  },
  'SA-16.vendor-start.any': {
    screen: 'SA-16',
    state: 'The “Any course” card',
    words: 'Any course',
    basis: 'Owner decision PD-3 (“a clear, visible ‘Any course’ permission option”)',
    status: 'provisional',
    decisions: ['VD-12', 'PD-3'],
  },
  'SA-16.vendor-start.any-line': {
    screen: 'SA-16',
    state: 'The “Any course” card’s line',
    words:
      'They can submit experiments to every course, including courses added later. They see only their own experiments.',
    basis: 'Owner decisions PD-1, PD-2; board 04 consequence-line formula',
    status: 'provisional',
    decisions: ['VD-12', 'PD-1', 'PD-2'],
  },
  'SA-16.vendor-start.later': {
    screen: 'SA-16',
    state: 'The “Assign courses next” card',
    words: 'Assign courses next',
    basis: 'Owner decision PD-3; SA-v1 “They start with no scope — you assign it next.”',
    status: 'provisional',
    decisions: ['VD-12', 'PD-3'],
  },
  'SA-16.vendor-start.later-line': {
    screen: 'SA-16',
    state: 'The “Assign courses next” card’s line',
    words: 'They start with no scope and can’t submit anything until you assign a course.',
    basis: 'Owner decision PD-3 (no scope is never unrestricted); SA-v1 `EFF.vendor[1]`',
    status: 'provisional',
    decisions: ['VD-12', 'PD-3'],
  },
  'SA-16.register-any-course': {
    screen: 'SA-16',
    state: 'The flash’s line after registering a Vendor with “Any course”',
    words: 'They can submit to any course. Nothing was sent to them.',
    rule: 'Replaces “Assign what they can act on. Nothing was sent to them.” when the Vendor starts with Any course.',
    basis: 'SA-v1 `SA.setFlash` after Register; owner decision PD-3',
    status: 'provisional',
    decisions: ['VD-12', 'PD-3'],
  },
  'SA-16.register.unavailable': {
    screen: 'SA-16',
    state: 'Register failed for now (service unavailable)',
    words: 'They weren’t registered. Nothing was lost — try again.',
    rule: 'Shown in the dialog under the fields, which stay with what was typed.',
    basis: 'Board 08 “failed, try again · Nothing was lost”. SA-v1 draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },

  // ---- SA-17 Role holder ----
  'SA-17.loading': {
    screen: 'SA-17',
    state: 'The holder loading (the loading line over skeleton rows)',
    words: 'Loading the role holder',
    basis: 'Board 04 “State grammar” Loading formula. SA-v1 draws no SA-17 loading state',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-17.failed': {
    screen: 'SA-17',
    state: 'The holder failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load this role holder',
    rule: 'The kit’s failed state with “Nothing has changed. Try again.” and Try again.',
    basis: 'B4-02 f5 failed formula; SA-v1 `SA.listState` “failed”. SA-v1 draws none for SA-17',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-17.failed.line': {
    screen: 'SA-17',
    state: 'The failed state’s reassurance',
    words: 'Nothing has changed. Try again.',
    basis:
      'SA-v1 `sa-core.js` `SA.listState` “failed” (every Super Admin list; `copy/sa-shared.ts`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-17.not-found': {
    screen: 'SA-17',
    state: 'An address that names no role holder',
    words: null,
    rule: 'The GL-04 message in place (“This page isn’t available”, Back to Overview, Help & support); the browser tab reads “Not available”.',
    basis: 'SA-v1 `sa-core.js` `SA.resolve` `nf` (`V.message`); Appendix F §5.2 record guards',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-17.top-title': {
    screen: 'SA-17',
    state: 'The crumbs and the document title',
    words: null,
    rule: 'The page’s crumbs read “Platform roles › <tab> › <name>” (Platform roles to the bare address, the tab to its own). The document title follows the shell rule: “<name> · Platform roles · XR Learning Platform”.',
    basis: 'SA-v1 `sa-views-d.js` `V.holder` `SA.crumbs`; SA-v1 LINK-MAP SA-17 breadcrumb',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-17.choices': {
    screen: 'SA-17',
    state: 'What Assign scope offers',
    words: null,
    rule: 'The three kinds for Reviewers and Content Managers, as drawn; a Vendor’s are `SA-17.vendor-choices`. Courses: every course of the Academic structure in its order, “<code> · <name>” (the name alone while it has no platform code). Experiments: every experiment of the published catalogue in its order, “<name> · <code>”. The service decides the assignment (“<X> is already in scope”).',
    basis:
      'SA-v1 `sa-views-d.js` `V.holder` `courseOpts`, `expOpts`; SA-14 structure; the public catalogue',
    status: 'provisional',
    decisions: ['VD-12', 'T-17'],
  },
  'SA-17.vendor-any-course': {
    screen: 'SA-17',
    state: 'A Vendor holds “All experiments” (owner decision PD-2)',
    words: 'Can create experiments and submit them for any course, now and later.',
    rule: 'The “Can act on” line of a Vendor with an active All experiments scope, whatever course scopes they also hold. It gives submission only: a Vendor sees and edits only the experiments they created (PD-1).',
    basis:
      'Owner decision PD-2, 27 Oct 2026 (ROLE-11 decided); SA-v1 `EFF.vendor[0]` “Can create experiments and submit them for: ”',
    status: 'provisional',
    decisions: ['VD-12', 'PD-2'],
  },
  'SA-17.vendor-experiment-inert': {
    screen: 'SA-17',
    state:
      'A Vendor still holds a one-experiment scope from an earlier world (owner decision PD-4)',
    words: 'One experiment gives a Vendor nothing — withdraw it.',
    rule: 'Added to the “Can act on” line. The scope stays listed and recorded and can be withdrawn; it is not counted as a scope (Has scope / No scope, SA-16’s no-scope notice), and once withdrawn it is not offered for Restore.',
    basis:
      'Owner decision PD-4, 27 Oct 2026; domain `assignScope` / `restoreScope` (`not-for-vendor`)',
    status: 'provisional',
    decisions: ['VD-12', 'PD-4'],
  },
  'SA-17.vendor-choices': {
    screen: 'SA-17',
    state: 'What Assign scope offers for a Vendor (owner decisions PD-2, PD-4)',
    words: 'Any course, now and later. They see only their own experiments.',
    rule: 'For a Vendor the panel offers “All experiments” — with these words as its line — and “A course”; “One experiment” is not offered (the service refuses it for a Vendor). Reviewers and Content Managers keep the three kinds as drawn.',
    basis: 'Owner decisions PD-2, PD-4, 27 Oct 2026; SA-v1 `V.holder` choices',
    status: 'provisional',
    decisions: ['VD-12', 'PD-2', 'PD-4'],
  },
  'SA-17.vendor-no-scope-line': {
    screen: 'SA-17',
    state: 'The “No scope — can’t act on anything yet” notice’s line for a Vendor',
    words:
      'Assign a scope so they can submit experiments: all experiments (any course) or a course.',
    rule: 'Replaces “Assign a scope so they can act: all experiments, a course, or one experiment.” for a Vendor, who is never given one experiment (PD-4).',
    basis: 'SA-v1 `V.holder` no-scope notice; owner decisions PD-2, PD-4',
    status: 'provisional',
    decisions: ['VD-12', 'PD-2', 'PD-4'],
  },
  'SA-17.lists': {
    screen: 'SA-17',
    state: 'The order of the scope lists',
    words: null,
    rule: '“Can act on”: active scopes in the order they were assigned (a restored scope joins the end). “Withdrawn”: the newest withdrawal first. A scope withdrawn and then assigned or restored again leaves the withdrawn list; it stays in the history.',
    basis:
      'SA-v1 `sa-views-d.js` `V.holder` (`act`, `wd`); B7-08 script; domain `supersededAt` (BR-126)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-17.one-panel': {
    screen: 'SA-17',
    state: 'One inline form at a time',
    words: null,
    rule: 'Withdraw opens its form below the scope, in place of its button; opening it on another scope closes the first. Opening Withdraw or Restore clears the flash and the refusal notice. Cancel closes the form and returns focus to its Withdraw button. The Assign scope panel stays open beside the record.',
    basis: 'SA-v1 `sa-views-d.js` `A.wdOpen`, `A.wdCancel`, `A.rsOpen`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-17.history': {
    screen: 'SA-17',
    state: 'How the history is written',
    words: null,
    rule: 'Newest first. Each entry names its scope as the list does (a course by its code, “All experiments”, an experiment by its name): “Registered as <role>” with the scopes given at registration (“<who> · scope …” or “<who> · no scope yet”), “Scope assigned: …” and “Scope restored: …” with who, “Scope withdrawn: …” with the reason and who. Dates are day, month and year.',
    basis:
      'SA-v1 `sa-views-d.js` `x.hist` entries; the export’s new entries add the time (“23 Oct 2026, 10:05”); the seed draws the day only',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-17.expected-rev': {
    screen: 'SA-17',
    state: 'Which revision a change is sent with',
    words: null,
    rule: 'Withdraw carries the holder’s revision from when its form opened, Restore from when its confirmation opened, Assign scope (the panel is always open) the revision the page shows when it is pressed. A holder that changed meanwhile is refused and read again.',
    basis: 'Appendix C `expectedRev`; SA-07 rule (Package 1D); SA-v1 `SA.staleGuard`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-17.stale.title': {
    screen: 'SA-17',
    state:
      'A change refused because the holder changed since the form or confirmation opened (or the scope is no longer what it showed)',
    words: 'This role holder changed since you opened it',
    rule: 'Nothing is written: the form or confirmation closes, the holder is read again and this notice shows at the top of the Assign scope panel, with focus.',
    basis:
      'Board 08 “conflict” formula; CM-03 `CM-03.stale.title`; placed as SA-v1 `SA.refusalHtml` (the export’s own words are a proposal, SA-v1 HANDOFF open decision 8)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-17.stale.line': {
    screen: 'SA-17',
    state: 'The stale notice’s line',
    words: 'It has been read again. Check it, then try again.',
    basis: 'Board 08 “conflict” formula',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-17.unavailable': {
    screen: 'SA-17',
    state: 'Assign, Withdraw or Restore failed for now (service unavailable)',
    words: 'Nothing was changed. Try again.',
    rule: 'Shown in the Assign scope panel above its button, under the Withdraw form’s buttons, or in the Restore confirmation, which stay open with what was chosen or typed.',
    basis: 'Board 08 “failed, try again · Nothing was lost”. SA-v1 draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
