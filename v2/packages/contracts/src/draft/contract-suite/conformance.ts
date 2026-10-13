/**
 * Every answer a case receives is checked against the method ledger (Appendix F §7.4): the success
 * value against the output schema; a failure against the error union — its kind, refusal code and
 * `policy-open` decision must be declared for that method, and a `validation-failed` must carry the
 * drawn words of its keys and the form's drawn summary title. Around each call the world snapshot
 * is compared: a read, a preview or any refusal writes nothing, and a command's `changed` lists
 * exactly the records it wrote.
 */
import { REFUSAL_CODES } from '../errors/refusals.js';
import { messageFor, summaryTitleFor } from '../errors/messages.js';
import { recordRef } from '../kernel/primitives.js';
import { serviceErrorSchemaFor } from '../errors/service-error.js';
import type { ServiceError } from '../errors/service-error.js';
import type { LedgerRow } from '../ledger/index.js';
import { ledgerRows } from '../ledger/index.js';
import type { ProductPorts } from '../ports/index.js';
import { ContractViolation, check } from './assert.js';

const errorSchema = serviceErrorSchemaFor(REFUSAL_CODES);

/** The rows by `portKey.method`. */
const ROWS = new Map(ledgerRows().map((row) => [`${row.portKey}.${row.method}`, row]));

export function rowFor(portKey: string, method: string): LedgerRow {
  const row = ROWS.get(`${portKey}.${method}`);
  if (!row) throw new ContractViolation(`${portKey}.${method} is not a ledger method.`);
  return row;
}

function issuesOf(error: {
  issues: readonly { path: readonly PropertyKey[]; message: string }[];
}): string {
  return error.issues
    .slice(0, 3)
    .map((issue) => `${issue.path.map(String).join('.') || '(value)'}: ${issue.message}`)
    .join('; ');
}

/** Checks one failure against the method's declared union. */
export function checkError(row: LedgerRow, error: ServiceError): void {
  const parsed = errorSchema.safeParse(error);
  check(
    parsed.success,
    `${row.id}: the error is not a ServiceError (${parsed.success ? '' : issuesOf(parsed.error)})`,
  );
  check(
    (row.errors as readonly string[]).includes(error.kind),
    `${row.id}: answered "${error.kind}", which its ledger entry does not declare (${row.errors.join(', ')})`,
  );
  if (error.kind === 'refused') {
    check(
      (row.refusals as readonly string[]).includes(error.code),
      `${row.id}: refused "${error.code}", which its ledger entry does not declare`,
    );
  }
  if (error.kind === 'policy-open') {
    check(
      row.open.includes(error.decision),
      `${row.id}: policy-open "${error.decision}", a decision its ledger entry does not name (${row.open.join(', ') || 'none'})`,
    );
  }
  if (error.kind === 'validation-failed') {
    for (const item of error.fieldErrors) {
      check(
        item.message === messageFor(item.key, item.params),
        `${row.id}: field ${item.field} carries words that are not the drawn words of ${item.key}`,
      );
    }
    check(
      error.summaryTitle === summaryTitleFor(row.form, error.fieldErrors.length),
      `${row.id}: summary title "${String(error.summaryTitle)}" is not the drawn title of ${row.form ?? 'a form with none'}`,
    );
  }
}

/** Checks one success value (and its `changed`) against the method's ledger entry. */
export function checkValue(row: LedgerRow, value: unknown, changed: unknown): void {
  const parsed = row.output.safeParse(value);
  check(
    parsed.success,
    `${row.id}: the value does not match its output schema (${parsed.success ? '' : issuesOf(parsed.error)})`,
  );
  if (changed === undefined) return;
  check(Array.isArray(changed), `${row.id}: \`changed\` is not a list`);
  for (const ref of changed as unknown[]) {
    check(
      recordRef.safeParse(ref).success,
      `${row.id}: \`changed\` holds something that is not a RecordRef`,
    );
  }
}

type Snapshot = Readonly<Record<string, unknown>>;

function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** The record keys (`KIND:id`) whose contents differ between two snapshots. */
export function writtenKeys(before: Snapshot, after: Snapshot): readonly string[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys].filter((key) => !same(before[key], after[key])).sort();
}

/** What a case's calls did, for the report. */
export interface CallLog {
  readonly calls: { readonly method: string; readonly outcome: string }[];
}

function checkAnswer(row: LedgerRow, answer: unknown, before: Snapshot, after: Snapshot): void {
  const written = writtenKeys(before, after);
  if (row.port === 'SelectionService' && row.method === 'get') {
    checkValue(row, answer, undefined);
    check(written.length === 0, `${row.id}: a read wrote ${written.join(', ')}`);
    return;
  }
  check(
    typeof answer === 'object' &&
      answer !== null &&
      typeof (answer as { ok?: unknown }).ok === 'boolean',
    `${row.id}: did not answer a Result`,
  );
  const result = answer as
    | { ok: true; value: unknown; changed: { kind: string; id: string }[] }
    | { ok: false; error: ServiceError };
  if (!result.ok) {
    checkError(row, result.error);
    check(
      written.length === 0,
      `${row.id}: a refusal wrote ${written.join(', ')} — a refusal writes nothing`,
    );
    return;
  }
  checkValue(row, result.value, result.changed);
  const declared = [...new Set(result.changed.map((ref) => `${ref.kind}:${ref.id}`))].sort();
  if (row.kind === 'read' || row.kind === 'preview') {
    check(written.length === 0, `${row.id}: a ${row.kind} wrote ${written.join(', ')}`);
    check(declared.length === 0, `${row.id}: a ${row.kind} declared changes`);
    return;
  }
  check(
    same(declared, written),
    `${row.id}: \`changed\` lists ${declared.join(', ') || 'nothing'} but the world changed ${written.join(', ') || 'nothing'}`,
  );
}

/**
 * Wraps an adapter's ports so every call is checked as it returns. `snapshot` is the world's
 * record map (`KIND:id` → record); `log` collects what was called.
 */
export function conformingPorts(
  ports: ProductPorts,
  snapshot: () => Snapshot,
  log: CallLog,
): ProductPorts {
  const wrapped: Record<string, Record<string, unknown>> = {};
  for (const row of ledgerRows()) {
    const port = (ports as unknown as Record<string, Record<string, unknown> | undefined>)[
      row.portKey
    ];
    const original = port?.[row.method];
    wrapped[row.portKey] ??= {};
    if (typeof original !== 'function') continue;
    wrapped[row.portKey]![row.method] = (...args: unknown[]) => {
      const before = snapshot();
      const answer = (original as (...a: unknown[]) => unknown).apply(port, args);
      const settle = (value: unknown) => {
        checkAnswer(row, value, before, snapshot());
        const result = value as { ok?: boolean; error?: ServiceError };
        const outcome = result.ok === false && result.error ? result.error.kind : 'ok';
        log.calls.push({ method: row.id, outcome });
        return value;
      };
      return answer instanceof Promise ? answer.then(settle) : settle(answer);
    };
  }
  return wrapped as unknown as ProductPorts;
}
