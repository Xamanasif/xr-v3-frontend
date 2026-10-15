/**
 * The sample-mode identity safeguard (Phase-2 Package 2B; owner authorisation §5; provisional
 * register PC-49). Sign-in (XS-01) resolves an e-mail to the first sample identity that holds it —
 * People, then Institute Admins, platform-role holders and Super Admins (`personIdByEmail`) — so a
 * new person given an e-mail someone already signs in with would take over or hide that sign-in.
 * Adding a person, importing students and assigning an Institute Admin therefore refuse such an
 * e-mail on the form's e-mail field: nobody is merged, nothing is silently replaced.
 *
 * This guards the sample identity of ADR-0003 only. It is NOT the invitation or identity policy:
 * how one person may hold several roles or institutions stays T-11 / P1-01.
 */
import {
  fieldError,
  fieldErrorsFromDomain,
  type FieldError,
  type IssueTarget,
  type MessageKey,
  type MethodId,
  validationFailed,
} from '@xr/contracts/draft';
import type { Decision, InputIssue } from '@xr/domain';

import { personIdByEmail } from '../pipeline/actor.js';
import { rowOf } from '../pipeline/ledger.js';
import type { Op } from '../pipeline/runner.js';

/** Whether an e-mail already signs a sample identity in (compared trimmed, ignoring case). */
export function signsSomeoneIn(op: Op, email: string): boolean {
  return email.trim() !== '' && personIdByEmail(op.records, op.world.identities, email) !== null;
}

export interface IdentityCheck {
  /** The e-mail the form gives the new identity. */
  readonly email: string;
  /** The form field it is shown on (`institutionEmail`, `workEmail`). */
  readonly field: string;
  readonly key: MessageKey;
  /** The form's fields in its order, for the error summary. */
  readonly order: readonly string[];
  readonly paramsFor?: (issue: InputIssue, target: IssueTarget) => Readonly<Record<string, string>>;
}

/**
 * `op.decide` with the safeguard: when the e-mail already signs someone in and the decision is
 * accepted or refused only for its fields, the e-mail field's refusal joins the domain's own field
 * errors (the domain's word for that field wins — "already belongs to someone in People"). Any
 * other refusal (paused, not permitted) is answered first, as the decision gives it.
 */
export function decideWithIdentity<T>(
  op: Op,
  decision: Decision<T>,
  input: unknown,
  check: IdentityCheck,
): T {
  if (!signsSomeoneIn(op, check.email)) return op.decide(decision, input, check.paramsFor);
  if (!decision.ok && decision.refusal.kind !== 'validation-failed') {
    return op.decide(decision, input, check.paramsFor);
  }
  const method = op.method as MethodId;
  const issues = decision.ok
    ? []
    : decision.refusal.kind === 'validation-failed'
      ? decision.refusal.issues
      : [];
  const errors: FieldError[] = fieldErrorsFromDomain(method, issues, input, check.paramsFor);
  if (!errors.some((error) => error.field === check.field)) {
    errors.push(fieldError(check.field, check.key));
  }
  const at = (error: FieldError) => {
    const index = check.order.indexOf(error.field.split('.')[0]!);
    return index < 0 ? check.order.length : index;
  };
  errors.sort((a, b) => at(a) - at(b));
  return op.refuse(validationFailed(errors, rowOf(method).form));
}
