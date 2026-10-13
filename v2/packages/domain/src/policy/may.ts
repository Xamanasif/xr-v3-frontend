/**
 * `may` and `availableActions` (Appendix F §5.1): pure functions over the actor (resolved from
 * records), scope, record state and `now`. Deny by default. A screen renders a control only when
 * its action is listed (Appendix D §6.3) — it never computes permissions itself.
 */
import type { Refusal } from '../kernel/decision.js';
import type { PolicyContext } from './context.js';
import {
  type ActionId,
  OPEN_CAPABILITIES,
  type OpenCapability,
  POLICY_RULES,
  type PolicyRule,
} from './rules.js';
import type { Subject } from './subjects.js';

export type Verdict =
  | {
      readonly allowed: true;
      readonly rows: readonly string[];
      readonly status: 'CONFIRMED' | 'PROVISIONAL';
    }
  | { readonly allowed: false; readonly refusal: Refusal };

const RULES = POLICY_RULES as unknown as readonly PolicyRule[];
const BY_ACTION = new Map(RULES.map((rule) => [rule.action, rule]));

export function isOpenCapability(action: string): action is OpenCapability {
  return Object.hasOwn(OPEN_CAPABILITIES, action);
}

/** May this actor take this action on this subject now? */
export function may(
  context: PolicyContext,
  action: ActionId | OpenCapability,
  subject: Subject,
): Verdict {
  if (isOpenCapability(action)) {
    return {
      allowed: false,
      refusal: { kind: 'policy-open', decision: OPEN_CAPABILITIES[action].decision },
    };
  }
  const rule = BY_ACTION.get(action);
  if (!rule) return { allowed: false, refusal: { kind: 'not-permitted', why: 'wrong-workspace' } };
  if (rule.subject !== subject.kind) {
    throw new Error(`${action} is asked about a ${rule.subject}, not a ${subject.kind}.`);
  }
  const actor = context.actor;
  // System writers never use a user command (SYSTEM transitions go through their own decisions).
  if (actor.kind === 'system')
    return { allowed: false, refusal: { kind: 'not-permitted', why: 'wrong-workspace' } };
  const who = actor.kind === 'public' ? 'public' : actor.ref.role;
  if (!rule.actors.includes(who))
    return { allowed: false, refusal: { kind: 'not-permitted', why: 'wrong-workspace' } };
  const refusal = rule.check(actor, subject as never, context.now);
  return refusal
    ? { allowed: false, refusal }
    : { allowed: true, rows: rule.rows, status: rule.status };
}

/** Every action this actor is offered on this subject now, in rule order. OPEN capabilities are
 *  never listed. */
export function availableActions(context: PolicyContext, subject: Subject): readonly ActionId[] {
  return RULES.filter((rule) => rule.subject === subject.kind)
    .filter((rule) => may(context, rule.action as ActionId, subject).allowed)
    .map((rule) => rule.action as ActionId);
}

/** The rule behind an action (for traceability). */
export function ruleFor(action: ActionId): PolicyRule {
  return BY_ACTION.get(action)!;
}

export const ALL_RULES: readonly PolicyRule[] = RULES;
