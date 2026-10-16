import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of Phase 6’s SA-16 Platform roles and SA-17 Role holder (B7-08, B7-10) — part of the one register (`state-copy.ts`, VD-12):
 * every state string or rule these screens show that their board does not draw word for word, with
 * its basis and the decisions it waits on. Decision ids never appear in visible copy.
 */
export const STATE_COPY_PLATFORM_ROLES = {
  // ---- SA-16 Platform roles ----
  'SA-16.tab-address': {
    screen: 'SA-16',
    state: 'Which tab the address names',
    words: null,
    rule: 'The bare address is Vendors (the first tab); `?tab=reviewers` and `?tab=content-managers` name the others. `?tab=vendors` and a value that names no tab are replaced by the bare address (no history entry). Choosing a tab replaces the address the same way; an address from outside (Back) is read again.',
    basis:
      'Appendix A routes.json SA-16 (D-11: “?tab=vendors accepted and normalised”); rule T3 (tabs are `role=tablist` buttons)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-16.loading': {
    screen: 'SA-16',
    state: 'The holders loading (the section’s status; skeleton rows in the table’s shape)',
    words: 'Loading the role holders…',
    basis:
      'Board 04 “State grammar” Loading formula; B7-02 f5 “Loading institutions…”. B7-08 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-16.failed': {
    screen: 'SA-16',
    state: 'The holders failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load the role holders',
    basis: 'B4-02 f5 failed formula (“We couldn’t load your experiments”). B7-08 draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-16.failed.line': {
    screen: 'SA-16',
    state: 'The failed state’s reassurance',
    words: 'Nothing has changed. Try again.',
    basis: 'Board 08 “failed, try again”. B7-08 draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-16.empty': {
    screen: 'SA-16',
    state: 'A tab with no holders (none registered for that role)',
    words: 'No {roles} registered yet',
    rule: '“{roles}” is the tab’s label (“No Content Managers registered yet”). The header’s “Register a …” stays; the foot note stays.',
    basis: 'Board 04 empty-state formula. B7-08 draws every tab with holders',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-16.empty.line': {
    screen: 'SA-16',
    state: 'The empty tab’s line',
    words: 'Someone you register appears here with no scope — you assign it next.',
    basis:
      'B7-08 f6 dialog sentence (“They start with no scope — you assign it next”); board 04 empty formula',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-16.can-act-on': {
    screen: 'SA-16',
    state: 'How a row’s “Can act on” is written',
    words: null,
    rule: 'The holder’s active scopes in the order they were assigned: a course by its platform code (by its name while it has none), “All experiments”, one experiment by its name. With none active, the warn tag “Nothing — no scope yet”. Below, “N scope(s) withdrawn” counts the withdrawn scopes still listed on SA-17 (a scope assigned or restored again is history only). The notice above the table counts the tab’s holders with no active scope.',
    basis:
      'B7-08 script `can`, `rows` (f0, f3); service facts PC-70; course without a code: CM-03 rule (T-17)',
    status: 'provisional',
    decisions: ['VD-12', 'T-17'],
  },
  'SA-16.register-result': {
    screen: 'SA-16',
    state: 'Register succeeded',
    words: null,
    rule: 'The dialog closes and the new holder opens on SA-17 (a new history entry) with B7-08’s flash; focus moves to the holder’s name (h1). Nothing is sent (T-11).',
    basis:
      'Appendix A routes.json SA-16 “Register success (engine state: opens the new holder on SA-17 with a flash; no frame)”; B7-08 `doReg` (`focus(tgt + "-h")`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-16.register-identity': {
    screen: 'SA-16',
    state:
      'Register refused: the work e-mail is already registered, or another sample identity signs in with it',
    words: null,
    rule: 'The service’s field error is shown under Work e-mail in SA-16’s drawn words (“Someone is already registered with this e-mail address”); nobody is merged or replaced.',
    basis: 'B7-08 `doReg`; Phase-2 Package 2B identity safeguard (PC-49)',
    status: 'provisional',
    decisions: ['PC-49', 'T-11'],
  },
  'SA-16.register.unavailable': {
    screen: 'SA-16',
    state: 'Register failed for now (service unavailable)',
    words: 'They weren’t registered. Nothing was lost — try again.',
    rule: 'Shown in the dialog, which stays open with what was typed.',
    basis: 'Board 08 “failed, try again · Nothing was lost”. B7-08 draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },

  // ---- SA-17 Role holder ----
  'SA-17.loading': {
    screen: 'SA-17',
    state: 'The holder loading (screen readers; the skeleton in a section)',
    words: 'Loading the role holder',
    basis: 'Board 04 “State grammar” Loading formula. B7-08 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-17.failed': {
    screen: 'SA-17',
    state: 'The holder failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load this role holder',
    basis: 'B4-02 f5 failed formula. B7-08 draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-17.failed.line': {
    screen: 'SA-17',
    state: 'The failed state’s reassurance',
    words: 'Nothing has changed. Try again.',
    basis: 'Board 08 “failed, try again”. B7-08 draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-17.not-found': {
    screen: 'SA-17',
    state: 'An address that names no role holder',
    words: null,
    rule: 'The in-shell not-found page (PU-15); the top bar reads “Platform roles” until a holder is read.',
    basis: 'Appendix F §5.2 record guards',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-17.top-title': {
    screen: 'SA-17',
    state: 'The top bar and the document title',
    words: null,
    rule: 'The top bar reads “Platform roles” (below 1024 px, B7-08 f2); from 1024 px the crumbs read “Platform roles / <name>” (f1). The document title follows the shell rule: “<name> · Platform roles · XR Learning Platform”.',
    basis: 'B7-08 f1 crumbs, f2 `xr-top-title`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-17.choices': {
    screen: 'SA-17',
    state: 'What Assign scope offers',
    words: null,
    rule: 'The three kinds for every role, as drawn. Courses: every course of the Academic structure in its order, “<code> · <name>” (the name alone while it has no platform code). Experiments: every experiment of the published catalogue in its order, “<name> · <code>”. The service decides the assignment (“<X> is already in scope”).',
    basis:
      'B7-08 f5 select options (the sample’s five courses and thirteen experiments); SA-14 structure; the public catalogue',
    status: 'provisional',
    decisions: ['VD-12', 'T-17'],
  },
  'SA-17.vendor-open': {
    screen: 'SA-17',
    state: 'A Vendor holds “All experiments” or one experiment (not a course)',
    words: 'What “All experiments” or one experiment lets a Vendor do isn’t decided yet.',
    rule: 'The scope is shown as the service records it. The “Can act on” line names only the Vendor’s courses, then this sentence — no right is claimed for the other scope; the Vendor’s own screens answer it as open.',
    basis:
      'Matrix ROLE-11 UNRESOLVED (domain `vendorCourses` answers policy-open); B7-08 offers the three kinds for every role',
    status: 'provisional',
    decisions: ['VD-12', 'ROLE-11'],
  },
  'SA-17.lists': {
    screen: 'SA-17',
    state: 'The order of the scope lists',
    words: null,
    rule: '“Can act on”: active scopes in the order they were assigned (a restored scope joins the end). “Withdrawn”: the newest withdrawal first. A scope withdrawn and then assigned or restored again leaves the withdrawn list; it stays in the history.',
    basis:
      'B7-08 script (`scope.concat`, `[withdrawn].concat(wd)`, `wd.filter` on assign); domain `supersededAt` (BR-126)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-17.one-panel': {
    screen: 'SA-17',
    state: 'One inline panel at a time',
    words: null,
    rule: 'Opening Withdraw or Restore on one scope closes any other open panel and the flash; Assign scope closes them too. Cancel closes the panel and returns focus to the button that opened it.',
    basis: 'B7-08 script `start`, `cancel`, `openScope`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-17.history': {
    screen: 'SA-17',
    state: 'How the history is written',
    words: null,
    rule: 'Newest first. Each entry names its scope as the list does (a course by its code, “All experiments”, an experiment by its name): “Registered as <role>” with the scopes given at registration (“<who> · scope …” or “<who> · no scope yet”), “Scope assigned — …” and “Scope restored — …” with who, “Scope withdrawn — …” with the reason and who. Dates are written as B7-08 draws them: day, month and year.',
    basis:
      'B7-08 `hist` (f1, f4, f8; B7-10 f11). The script’s new entries add the time (“23 Oct 2026, 11:50”); the frames draw the day only',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-17.expected-rev': {
    screen: 'SA-17',
    state: 'Which revision a change is sent with',
    words: null,
    rule: 'Assign, Withdraw and Restore carry the holder’s revision from when the dialog or panel opened. A holder that changed meanwhile is refused and read again.',
    basis: 'Appendix C `expectedRev`; SA-07 rule (Package 1D)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-17.stale.title': {
    screen: 'SA-17',
    state:
      'A change refused because the holder changed since the dialog or panel opened (or the scope is no longer what it showed)',
    words: 'This role holder changed since you opened it',
    rule: 'Nothing is written: the dialog or panel closes, the holder is read again and this notice takes the flash’s place, with focus.',
    basis: 'Board 08 “conflict” formula; CM-03 `CM-03.stale.title`. B7-08 draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-17.stale.line': {
    screen: 'SA-17',
    state: 'The stale notice’s line',
    words: 'It has been read again. Check it, then try again.',
    basis: 'Board 08 “conflict” formula. B7-08 draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-17.unavailable': {
    screen: 'SA-17',
    state: 'Assign, Withdraw or Restore failed for now (service unavailable)',
    words: 'Nothing was changed. Try again.',
    rule: 'Shown in the dialog or under the panel’s buttons, which stay open with what was chosen or typed.',
    basis: 'Board 08 “failed, try again · Nothing was lost”. B7-08 draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
