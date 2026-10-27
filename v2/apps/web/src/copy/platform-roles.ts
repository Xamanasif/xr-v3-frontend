/**
 * The words of the Super Admin's Platform roles — SA-16 Platform roles and SA-17 Role holder — in
 * the owner-approved V3 Refined B design (design/v3-refined-b/roles/SA-v1, `project/sa-views-d.js`
 * `V.roles`, `V.holder`, `SA.DLG.register`, `SA.DLG.restoreScope`), written from the facts
 * `PlatformRoleService` answers (`holderView`: the holder record and each scope's status, course
 * code and name; PC-70): read models carry no words. What the export does not draw keeps its
 * provisional entry of the state-copy register (`state-copy-platform-roles.ts`), never an
 * invented rule. Nothing here names an internal reference; how a registered person first signs in
 * is open (T-11), so nothing claims a message is sent.
 */
import type { PlatformRole } from '@xr/domain';

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

/** The role in words (the export's `TABS[i][2]`: “Vendor”, “Academic Reviewer”, “Content Manager”). */
export const ROLE_WORDS: Readonly<Record<PlatformRole, string>> = {
  vendor: 'Vendor',
  academic_reviewer: 'Academic Reviewer',
  content_manager: 'Content Manager',
};

/** The three tabs in the export's order (`TABS`): label, the role each holds, the head's action. */
export const ROLE_TAB_WORDS = {
  vendors: { label: 'Vendors', role: 'vendor', register: 'Register a Vendor' },
  reviewers: { label: 'Reviewers', role: 'academic_reviewer', register: 'Register a Reviewer' },
  'content-managers': {
    label: 'Content Managers',
    role: 'content_manager',
    register: 'Register a Content Manager',
  },
} as const satisfies Readonly<
  Record<string, { readonly label: string; readonly role: PlatformRole; readonly register: string }>
>;

/** What a role can do with its scope (the export's `EFF`): the lead before the scopes, and the line with none. */
const EFFECT: Readonly<Record<PlatformRole, readonly [lead: string, none: string]>> = {
  vendor: [
    'Can create experiments and submit them for: ',
    'Can’t create or submit experiments yet. Nothing is in scope.',
  ],
  academic_reviewer: [
    'Sees submissions and updates for these in the review queue: ',
    'Their review queue is empty. Nothing is in scope, and submissions for courses nobody reviews get stuck.',
  ],
  content_manager: [
    'Decides publication and raises corrections for: ',
    'Can’t publish or correct anything yet. Nothing is in scope.',
  ],
};

/**
 * The “Can act on” line (the export's `EFF[tab][0] + scopes + '.'`): “Sees submissions and
 * updates for these in the review queue: ME ZG523, MEL ZG512, CHE ZG513.”, or the role's line
 * with nothing in scope.
 */
export function effectLine(role: PlatformRole, inScope: readonly string[]): string {
  const [lead, none] = EFFECT[role];
  return inScope.length > 0 ? `${lead}${inScope.join(', ')}.` : none;
}

/** What a role holder with no scope cannot do (the export's `EFF[tab][1]`). */
export function noScopeLine(role: PlatformRole): string {
  return EFFECT[role][1];
}

export const ALL_EXPERIMENTS = 'All experiments';

// ---- SA-16 Platform roles (`V.roles`) ----

export const ROLES_PAGE = {
  title: 'Platform roles',
  lead: 'Who can produce, review and publish content, and for what.',
  /** `nav.rk-tabs.sa-tabs[aria-label]`. */
  tabsLabel: 'Platform roles',
  columns: {
    holder: 'Role holder',
    canActOn: 'Can act on',
    workEmail: 'Work e-mail',
    registered: 'Registered',
    scope: 'Scope',
  },
  /** The row's “Can act on” with nothing active. */
  nothing: 'Nothing yet',
  hasScope: 'Has scope',
  noScope: 'No scope',
  /** The no-scope notice's action (to the first holder without scope). */
  assignScope: 'Assign scope',
  /** `p.rk-ca-foot` at the foot of the surface. */
  footNote:
    'Registering doesn’t send an invitation. How a registered person first signs in is still open.',
} as const;

/** The table's caption: “Reviewers and what they can act on”. */
export function holdersCaption(tabLabel: string): string {
  return `${tabLabel} and what they can act on`;
}

/** The row link's name: “Dr K. Iyer, Academic Reviewer, no scope. Open”. */
export function holderRowLabel(name: string, role: PlatformRole, hasScope: boolean): string {
  return `${name}, ${ROLE_WORDS[role]}${hasScope ? '' : ', no scope'}. Open`;
}

/** The no-scope notice: “Dr K. Iyer has no scope yet”, or “2 role holders have no scope yet”. */
export function noScopeTitle(names: readonly string[]): string {
  return names.length === 1
    ? `${names[0]} has no scope yet`
    : `${names.length} role holders have no scope yet`;
}

/** “1 scope withdrawn”. */
export function withdrawnCountWords(count: number): string {
  return `${plural(count, 'scope')} withdrawn`;
}

/** `SA.DLG.register`: “Register a Vendor”, its line, the three fields. */
export const REGISTER_DIALOG = {
  description: 'Registering doesn’t send an invitation. You assign what they can act on next.',
  name: 'Name',
  workEmail: 'Work e-mail',
  organisation: 'Organisation',
  confirm: 'Register',
  busy: 'Registering…',
  cancel: 'Cancel',
} as const;

/** One flash (`div.rk-notice--ok`): what happened, and its line. */
export interface FlashWords {
  readonly title: string;
  readonly line?: string;
}

/** The flash the new holder's page opens with (`SA.setFlash` after Register); a Vendor who
 *  starts with Any course has its own line (state-copy `SA-16.register-any-course`). */
export function registeredFlash(name: string, role: PlatformRole, line?: string): FlashWords {
  return {
    title: `${name} is registered as ${ROLE_WORDS[role]}.`,
    line: line ?? 'Assign what they can act on. Nothing was sent to them.',
  };
}

// ---- SA-17 Role holder (`V.holder`) ----

export const HOLDER_PAGE = {
  /** “Go to assign scope” (`a.rk-goto`, under 860 px). */
  goTo: 'Go to assign scope',
  noScopeTitle: 'No scope — can’t act on anything yet',
  noScopeLine: 'Assign a scope so they can act: all experiments, a course, or one experiment.',
  canActOn: 'Can act on',
  withdrawnHeading: 'Withdrawn',
  withdraw: 'Withdraw',
  reasonHint: 'Kept with the scope in the history.',
  withdrawConfirm: 'Withdraw scope',
  restore: 'Restore',
  cancel: 'Cancel',
  holder: 'Role holder',
  keys: {
    role: 'Role',
    organisation: 'Organisation',
    workEmail: 'Work e-mail',
    registered: 'Registered',
  },
  signInNote: 'How they first sign in is still open. Nothing is sent from here.',
  history: 'History',
  historyMeta: 'Newest first',
} as const;

/** The head's meta: “Registered 20 Oct 2026”. */
export function registeredOn(day: string): string {
  return `Registered ${day}`;
}

/** What a course scope names in full (the export's `scopeLabel`): “ME ZG523 · Thermodynamics & Heat Transfer”. */
export function courseScopeWords(code: string | null, name: string | null): string {
  if (code && name) return `${code} · ${name}`;
  return code ?? name ?? '';
}

/** A scope row's line: “Assigned 2 Jun 2026”. */
export function assignedWords(day: string): string {
  return `Assigned ${day}`;
}

/** A withdrawn row's line: “Withdrawn 1 Oct 2026 · “Electrical Machines reviews move …””. */
export function withdrawnWords(day: string, reason: string): string {
  return reason ? `Withdrawn ${day} · “${reason}”` : `Withdrawn ${day}`;
}

/** The row's Withdraw name: “Withdraw scope ME ZG523 · Thermodynamics & Heat Transfer”. */
export function withdrawLabel(scope: string): string {
  return `Withdraw scope ${scope}`;
}

/** The inline form's label: “Reason for withdrawing ME ZG523”. */
export function reasonLabel(scope: string): string {
  return `Reason for withdrawing ${scope}`;
}

/** The withdrawn row's Restore name: “Restore scope EEE ZC341 · Electrical Machines”. */
export function restoreLabel(scope: string): string {
  return `Restore scope ${scope}`;
}

/** `SA.DLG.restoreScope`: “Restore EEE ZC341 for Prof. A. Menon?”. */
export const RESTORE_DIALOG = {
  description:
    'The same scope comes back. No reason is asked; the earlier withdrawal stays in the history.',
  confirm: 'Restore scope',
  busy: 'Restoring…',
  cancel: 'Cancel',
} as const;

export function restoreQuestion(scope: string, name: string): string {
  return `Restore ${scope} for ${name}?`;
}

/** `A.hoAssign` flash: “Scope assigned: EEE ZC341.” */
export function assignedFlash(scope: string): FlashWords {
  return { title: `Scope assigned: ${scope}.`, line: 'It now appears in their workspace.' };
}

/** `A.wdSave` flash: “Scope withdrawn: ME ZG523.” */
export function withdrawnFlash(scope: string): FlashWords {
  return { title: `Scope withdrawn: ${scope}.`, line: 'The reason is kept with the scope.' };
}

/** `SA.DLG.restoreScope` flash: “Scope restored: EEE ZC341.” */
export function restoredFlash(scope: string): FlashWords {
  return { title: `Scope restored: ${scope}.` };
}

/** The “Assign scope” panel (`aside#ho-panel`). */
export const ASSIGN_PANEL = {
  title: 'Assign scope',
  errorsTitle: 'Check the scope',
  legend: 'What can they act on?',
  choices: {
    all: { title: 'All experiments', sub: 'Everything on the platform, now and later.' },
    course: { title: 'A course', sub: 'Every experiment in one course.' },
    experiment: { title: 'One experiment', sub: 'Only the experiment you choose.' },
  },
  course: 'Course',
  chooseCourse: 'Choose a course',
  experiment: 'Experiment',
  chooseExperiment: 'Choose an experiment',
  confirm: 'Assign scope',
  busy: 'Assigning…',
  hint: 'Scope decides what appears in their workspace. It doesn’t change their role.',
} as const;

/** An experiment option: “Distillation Column · CHE ZG513” (the name alone without a code). */
export function experimentOption(name: string, code: string | null): string {
  return code ? `${name} · ${code}` : name;
}

// ---- History (`x.hist`, newest first) ----

/** “Registered as Academic Reviewer”. */
export function registeredAs(role: PlatformRole): string {
  return `Registered as ${ROLE_WORDS[role]}`;
}

/** “Arjun Mehta · scope ME ZG523, MEL ZG512” or “Arjun Mehta · no scope yet”. */
export function registeredNote(by: string, scopes: readonly string[]): string {
  return scopes.length > 0 ? `${by} · scope ${scopes.join(', ')}` : `${by} · no scope yet`;
}

/** “Scope withdrawn: MEL ZG512”. */
export function scopeWithdrawnWhat(scope: string): string {
  return `Scope withdrawn: ${scope}`;
}

/** “Scope assigned: EEE ZC341”. */
export function scopeAssignedWhat(scope: string): string {
  return `Scope assigned: ${scope}`;
}

/** “Scope restored: EEE ZC341”. */
export function scopeRestoredWhat(scope: string): string {
  return `Scope restored: ${scope}`;
}

/** “"Manufacturing Processes content …" · Arjun Mehta”. */
export function reasonByNote(reason: string, by: string): string {
  return `“${reason}” · ${by}`;
}
