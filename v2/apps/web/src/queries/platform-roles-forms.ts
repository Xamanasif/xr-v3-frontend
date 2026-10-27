/**
 * SA-16 Platform roles and SA-17 Role holder (Phase 6; boards B7-08, B7-10 f10 · f11, B7-12): the
 * read models’ types and the forms’ checks on the contract’s own schemas — features import
 * contracts for types only (Appendix F §3.8), so the runtime pieces live here. Each form is checked
 * before anything is sent with its input schema’s rules and message keys (B7-08 `doReg`,
 * `doScope`, the withdraw panel’s `save`), every error at once as the board shows them, and the
 * service’s own `validation-failed` answer — an e-mail already registered or used by another
 * sample identity (PC-49), “<X> is already in scope” — is read the same way.
 */
import {
  assignScopeInput,
  type FieldError,
  type holderView,
  type Out,
  parseInput,
  registerHolderInput,
  type scopeView,
  type ValidationFailed,
  withdrawScopeInput,
} from '@xr/contracts/draft';
import type { CourseId, ExperimentId, PlatformRole, RoleHolderId, ScopeId } from '@xr/domain';

import { fieldWords } from '@/copy/field-words';

/** `getHolder` / one row of `listHolders`: the holder record and its scopes as facts (PC-70). */
export type HolderView = Out<typeof holderView>;

/** One scope as the service names it: status, the course’s platform code and name, or the experiment’s. */
export type ScopeView = Out<typeof scopeView>;

/** The drawn words of a `validation-failed` answer, by field (the first word per field wins). */
function wordsByField(
  error: ValidationFailed,
  fieldOf: (item: FieldError) => string,
): Readonly<Record<string, string>> {
  const words: Record<string, string> = {};
  for (const item of error.fieldErrors) {
    const field = fieldOf(item);
    const text = fieldWords(item);
    if (text && words[field] === undefined) words[field] = text;
  }
  return words;
}

// ---- SA-16 Register a <role> (B7-08 f6) ----

export interface RegisterDraft {
  readonly role: PlatformRole;
  readonly name: string;
  readonly workEmail: string;
  readonly organisation: string;
  /** A Vendor starts with “Any course” (owner decision PD-3; PC-75). */
  readonly anyCourse?: boolean;
}

/** The dialog’s three drawn errors, in words. */
export interface RegisterErrors {
  readonly name?: string;
  readonly workEmail?: string;
  readonly organisation?: string;
}

const REGISTER_FIELDS = ['name', 'workEmail', 'organisation'] as const;

/** A `validation-failed` answer as the dialog’s errors (the catalogue’s drawn words). */
export function registerErrorsOf(error: ValidationFailed): RegisterErrors {
  const words = wordsByField(error, (item) => item.field.split('.')[0]!);
  const errors: { -readonly [K in keyof RegisterErrors]: string } = {};
  for (const field of REGISTER_FIELDS) if (words[field]) errors[field] = words[field];
  return errors;
}

/**
 * B7-08 `doReg`: name, work e-mail (required, then its format) and organisation, all at once. An
 * e-mail already registered is the service’s answer (`registerHolder`), never checked here.
 */
export function checkRegister(draft: RegisterDraft): RegisterErrors | null {
  const parsed = parseInput(registerHolderInput, draft, null);
  if (parsed.ok) return null;
  const errors = registerErrorsOf(parsed.error);
  return Object.keys(errors).length > 0 ? errors : null;
}

// ---- SA-17 Assign scope (B7-08 f5) ----

/** What the dialog has chosen: nothing yet, all experiments, a course or one experiment. */
export type ScopeKind = 'all' | 'course' | 'experiment';

export interface AssignDraft {
  readonly kind: ScopeKind | null;
  /** The chosen course (`''`: “Choose a course”). */
  readonly courseId: string;
  /** The chosen experiment (`''`: “Choose an experiment”). */
  readonly experimentId: string;
}

/**
 * The dialog’s errors: `kind` under the choices (“Choose what they can act on”), `target` under
 * the course or experiment select — or, for All experiments, under the choices (“All experiments
 * is already in scope”), where B7-08 draws `Rh-sa-e`.
 */
export interface AssignErrors {
  readonly kind?: string;
  readonly target?: string;
}

/** The command’s input for a draft (the select’s blank choice is no choice: `null`). */
export function assignInput(holderId: string, draft: AssignDraft, expectedRev: number) {
  const target =
    draft.kind === 'all'
      ? { kind: 'all' as const }
      : draft.kind === 'course'
        ? { kind: 'course' as const, courseId: (draft.courseId || null) as CourseId | null }
        : draft.kind === 'experiment'
          ? {
              kind: 'experiment' as const,
              experimentId: (draft.experimentId || null) as ExperimentId | null,
            }
          : { kind: null };
  return { holderId: holderId as RoleHolderId, target, expectedRev };
}

/** A `validation-failed` answer as the dialog’s errors. */
export function assignErrorsOf(error: ValidationFailed): AssignErrors {
  const words = wordsByField(error, (item) =>
    item.key === 'SA-17.target.required' ? 'kind' : 'target',
  );
  const errors: { kind?: string; target?: string } = {};
  if (words['kind']) errors.kind = words['kind'];
  if (words['target']) errors.target = words['target'];
  return errors;
}

/**
 * B7-08 `doScope`: what they can act on, then the course or the experiment. “<X> is already in
 * scope” is the service’s answer (the domain’s `assignScope`), never checked here.
 */
export function checkAssign(
  holderId: string,
  draft: AssignDraft,
  expectedRev: number,
): AssignErrors | null {
  const parsed = parseInput(assignScopeInput, assignInput(holderId, draft, expectedRev), null);
  if (parsed.ok) return null;
  const errors = assignErrorsOf(parsed.error);
  return errors.kind || errors.target ? errors : null;
}

// ---- SA-17 Withdraw scope (B7-08 f4; B7-10 f11) ----

/** The inline panel’s one drawn error (“Add a reason — it is kept in the history”), or null. */
export function checkWithdrawReason(
  holderId: string,
  scopeId: string,
  reason: string,
  expectedRev: number,
): string | null {
  const parsed = parseInput(
    withdrawScopeInput,
    {
      holderId: holderId as RoleHolderId,
      scopeId: scopeId as ScopeId,
      reason,
      expectedRev,
    },
    null,
  );
  if (parsed.ok) return null;
  return withdrawErrorOf(parsed.error);
}

/** A `validation-failed` answer as the panel’s reason error. */
export function withdrawErrorOf(error: ValidationFailed): string | null {
  return wordsByField(error, (item) => item.field.split('.')[0]!)['reason'] ?? null;
}
