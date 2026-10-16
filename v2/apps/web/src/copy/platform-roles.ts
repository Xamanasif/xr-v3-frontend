/**
 * The words of the Super Admin's Platform roles — SA-16 Platform roles and SA-17 Role holder
 * (B7-08 f0 … f8; B7-10 f10, f11; B7-12 “Role holder”) — written from the facts
 * `PlatformRoleService` answers (`holderView`: the holder record and each scope's status, course
 * code and name; PC-70): read models carry no words. Each entry names the board place that draws
 * it; what no board words is a provisional entry of the state-copy register
 * (`state-copy-platform-roles.ts`), never an invented rule.
 *
 * P1-14 / VD-10 (owner decision, as `copy/institutions.ts`): B7-08 writes the decision id “(T-11)”
 * into two sentences. The product shows each without it; `STRIPPED_ROLES` keeps the frozen board
 * wording and its ids, so the copy stays traceable (`platform-roles.test.ts`).
 */
import type { PlatformRole } from '@xr/domain';

import type { StrippedSentence } from './institutions';

function stripped(drawn: string, board: string): StrippedSentence {
  const ids = [...drawn.matchAll(/ \((T-\d{2})\)/g)].map((match) => match[1]!);
  return { words: drawn.replace(/ \(T-\d{2}\)/g, ''), drawn, ids, board };
}

/** The two B7-08 sentences that carry “(T-11)” (P1-14: the suffix goes, the sentence stays). */
export const STRIPPED_ROLES = {
  footNote: stripped(
    'Registering doesn’t send an invitation. How a registered person first signs in is still open (T-11).',
    'B7-08 f0, f3, f6 `p.xl-open` under the table',
  ),
  signInNote: stripped(
    'How they first sign in is still open (T-11) — nothing is sent from here.',
    'B7-08 f1 … f8 “Role holder” `p.xl-meta`',
  ),
} as const satisfies Readonly<Record<string, StrippedSentence>>;

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

/** The role in words (B7-08 `tabs[2]`: “Vendor”, “Academic Reviewer”, “Content Manager”). */
export const ROLE_WORDS: Readonly<Record<PlatformRole, string>> = {
  vendor: 'Vendor',
  academic_reviewer: 'Academic Reviewer',
  content_manager: 'Content Manager',
};

/** The three tabs in board order (B7-08 `tabs`): label, the role each holds, the header action. */
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

// ---- SA-16 Platform roles (B7-08 f0, f3, f6) ----

export const ROLES_PAGE = {
  title: 'Platform roles',
  meta: 'Who can produce, review and publish content — and for what',
  /** `div.xr-tabs[role=tablist][aria-label]`. */
  tabsLabel: 'Role',
  columns: { holder: 'Role holder', canActOn: 'Can act on', action: 'Action' },
  open: 'Open',
  /** The row's tag when nothing is in scope (`span.xw-tag.xw-tag--warn`). */
  nothing: 'Nothing — no scope yet',
  noScopeLine: 'Open the holder and assign a scope.',
  /** B7-08 `p.xl-open`, without “(T-11)” (P1-14). */
  footNote: STRIPPED_ROLES.footNote.words,
} as const;

/** “Open Dr K. Iyer” (the row's `aria-label`). */
export function openHolderLabel(name: string): string {
  return `Open ${name}`;
}

/** f0: “1 holder with no scope — they can’t act on anything yet”. */
export function noScopeTitle(count: number): string {
  return `${plural(count, 'holder')} with no scope — they can’t act on anything yet`;
}

/** f0 “1 scope withdrawn”. */
export function withdrawnCountWords(count: number): string {
  return `${plural(count, 'scope')} withdrawn`;
}

/** f0 row line: “BITS Pilani · WILP · Registered 2 Jun 2026”. */
export function registeredLine(organisation: string, day: string): string {
  return `${organisation} · Registered ${day}`;
}

/** B7-08 f6 “Register a Vendor” (DL-3 with three fields). */
export const REGISTER_DIALOG = {
  rolePrefix: 'Role: ',
  /** After the role in bold. */
  roleTail: '. They start with no scope — you assign it next. Nothing is sent from here.',
  name: 'Name',
  workEmail: 'Work e-mail',
  organisation: 'Organisation',
  confirm: 'Register',
  busy: 'Registering…',
  cancel: 'Cancel',
} as const;

/** B7-08 `doReg` flash, shown on the new holder's page (SA-17). */
export function registeredFlash(name: string, role: PlatformRole): string {
  return `${name} is registered as ${ROLE_WORDS[role]}. They have no scope yet — assign one so they can act. Nothing is sent from here.`;
}

// ---- SA-17 Role holder (B7-08 f1, f2, f4, f5, f7, f8; B7-10 f10, f11) ----

export const HOLDER_PAGE = {
  back: 'Platform roles',
  assign: 'Assign scope',
  noScopeTitle: 'No scope — can’t act on anything yet',
  noScopeLine: 'Assign a scope so they can act: all experiments, a course, or one experiment.',
  canActOn: 'Can act on',
  scopeListLabel: 'Scope',
  withdrawnHeading: 'Withdrawn',
  withdrawnListLabel: 'Withdrawn scope',
  withdraw: 'Withdraw',
  reasonHint: 'Kept in the history. They stop seeing it straight away.',
  withdrawConfirm: 'Withdraw scope',
  restore: 'Restore',
  restoreConfirm: 'Restore scope',
  cancel: 'Cancel',
  holder: 'Role holder',
  keys: {
    role: 'Role',
    organisation: 'Organisation',
    workEmail: 'Work e-mail',
    registered: 'Registered',
  },
  /** B7-08 “Role holder” `p.xl-meta`, without “(T-11)” (P1-14). */
  signInNote: STRIPPED_ROLES.signInNote.words,
  history: 'History',
  historyMeta: 'Newest first',
} as const;

/** f1 overline: “Academic Reviewer · BITS Pilani · WILP” (drawn in capitals by `xr-overline`). */
export function holderOverline(role: PlatformRole, organisation: string): string {
  return `${ROLE_WORDS[role]} · ${organisation}`;
}

/** “Can act on” per role (B7-08 `eff`): the lead before the scopes, and the line with none. */
const EFFECT: Readonly<Record<PlatformRole, readonly [lead: string, none: string]>> = {
  vendor: [
    'Can create experiments and submit them for: ',
    'Can’t create or submit experiments yet — nothing is in scope.',
  ],
  academic_reviewer: [
    'Sees submissions and updates for these in the review queue: ',
    'Their review queue is empty — nothing is in scope. Submissions for courses nobody reviews get stuck.',
  ],
  content_manager: [
    'Decides publication and raises corrections for: ',
    'Can’t publish or correct anything yet — nothing is in scope.',
  ],
};

/**
 * The “Can act on” line (B7-08 `effect`): “Sees submissions and updates for these in the review
 * queue: ME ZG523, MEL ZG512, CHE ZG513.”, or the role's line with nothing in scope.
 */
export function effectLine(role: PlatformRole, inScope: readonly string[]): string {
  const [lead, none] = EFFECT[role];
  return inScope.length > 0 ? `${lead}${inScope.join(', ')}.` : none;
}

/** B7-08 f5 dialog sentence: “Scope decides what … sees and can act on. <lead> the scope you choose.” */
export function assignHelp(name: string, role: PlatformRole): string {
  return `Scope decides what ${name} sees and can act on. ${EFFECT[role][0].replace(': ', ' the scope you choose.')}`;
}

/** What a scope names, in its row (B7-08 `scopeTxt`): the course “ME ZG523 · Thermodynamics & Heat Transfer”. */
export function courseScopeWords(code: string | null, name: string | null): string {
  if (code && name) return `${code} · ${name}`;
  return code ?? name ?? '';
}

/** B7-08 `scopeTxt` for one experiment: “Distillation Column (experiment)”. */
export function experimentScopeWords(name: string): string {
  return `${name} (experiment)`;
}

export const ALL_EXPERIMENTS = 'All experiments';

/** f4 “Since 4 Jul 2026”. */
export function sinceWords(day: string): string {
  return `Since ${day}`;
}

/** f4 “Withdrawn 15 Aug 2026 · “Manufacturing Processes content …”” */
export function withdrawnWords(day: string, reason: string): string {
  return `Withdrawn ${day} · “${reason}”`;
}

/** The row's Withdraw `aria-label`: “Withdraw ME ZG523 · Thermodynamics & Heat Transfer”. */
export function withdrawLabel(scope: string): string {
  return `Withdraw ${scope}`;
}

/** f4 inline panel label: “Reason for withdrawing ME ZG523 · Thermodynamics & Heat Transfer”. */
export function reasonLabel(scope: string): string {
  return `Reason for withdrawing ${scope}`;
}

/** The withdrawn row's Restore `aria-label`. */
export function restoreLabel(scope: string): string {
  return `Restore ${scope}`;
}

/** f8 inline confirmation (no reason asked, OD-B7-10). */
export function restoreQuestion(scope: string): string {
  return `Restore ${scope}? They can act on it again straight away.`;
}

/** B7-08 `save` flash after Withdraw scope: “ME ZG523 withdrawn. Anil Shetty can no longer act on it.” */
export function withdrawnFlash(scope: string, name: string): string {
  return `${scope} withdrawn. ${name} can no longer act on it.`;
}

/** B7-08 restore flash: “EEE ZC341 restored. Prof. A. Menon can act on it again.” */
export function restoredFlash(scope: string, name: string): string {
  return `${scope} restored. ${name} can act on it again.`;
}

/** B7-08 `doScope` flash: “Dr K. Iyer can now act on EEE ZC341.” */
export function assignedFlash(name: string, scope: string): string {
  return `${name} can now act on ${scope}.`;
}

/** f1 “20 Oct 2026 · by Arjun Mehta”. */
export function registeredByWords(day: string, by: string): string {
  return `${day} · by ${by}`;
}

/** B7-08 f5 “Assign scope to Dr K. Iyer” (DL-3). */
export const ASSIGN_DIALOG = {
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
  cancel: 'Cancel',
} as const;

export function assignTitle(name: string): string {
  return `Assign scope to ${name}`;
}

/** f5 option: “Distillation Column · CHE ZG513” (the name alone without a code). */
export function experimentOption(name: string, code: string | null): string {
  return code ? `${name} · ${code}` : name;
}

// ---- History (B7-08 `hist`, newest first) ----

/** “Registered as Academic Reviewer”. */
export function registeredAs(role: PlatformRole): string {
  return `Registered as ${ROLE_WORDS[role]}`;
}

/** “Arjun Mehta · scope ME ZG523, MEL ZG512” or “Arjun Mehta · no scope yet”. */
export function registeredNote(by: string, scopes: readonly string[]): string {
  return scopes.length > 0 ? `${by} · scope ${scopes.join(', ')}` : `${by} · no scope yet`;
}

/** “Scope withdrawn — MEL ZG512”. */
export function scopeWithdrawnWhat(scope: string): string {
  return `Scope withdrawn — ${scope}`;
}

/** “Scope assigned — EEE ZC341” (B7-10 f11). */
export function scopeAssignedWhat(scope: string): string {
  return `Scope assigned — ${scope}`;
}

/** “Scope restored — EEE ZC341” (B7-08 restore `hist`). */
export function scopeRestoredWhat(scope: string): string {
  return `Scope restored — ${scope}`;
}

/** “"Manufacturing Processes content …" · Arjun Mehta”. */
export function reasonByNote(reason: string, by: string): string {
  return `“${reason}” · ${by}`;
}
