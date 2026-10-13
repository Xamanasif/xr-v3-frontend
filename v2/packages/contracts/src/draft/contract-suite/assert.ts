/**
 * Framework-free assertions of the contract suite: no test runner, no Node built-in, no browser
 * API — a case fails by throwing a `ContractViolation`, so any runner (Vitest in the sample world
 * now, the HTTP adapter's tests later) can run the suite.
 */
import type { Result, ServiceError, ServiceErrorKind } from '../errors/service-error.js';

export class ContractViolation extends Error {
  override readonly name = 'ContractViolation';
}

export function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new ContractViolation(message);
}

function same(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => same(item, b[index]));
  }
  const left = Object.keys(a as object).filter(
    (key) => (a as Record<string, unknown>)[key] !== undefined,
  );
  const right = Object.keys(b as object).filter(
    (key) => (b as Record<string, unknown>)[key] !== undefined,
  );
  if (left.length !== right.length) return false;
  return left.every((key) =>
    same((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
  );
}

/** Structural equality of plain data (records, snapshots). */
export function deepEqual(actual: unknown, expected: unknown, message: string): void {
  check(same(actual, expected), message);
}

function describe(error: ServiceError): string {
  return JSON.stringify(error);
}

/** The value of a success, or a violation naming the step and the error. */
export function valueOf<T>(answer: Result<T, ServiceError>, step: string): T {
  if (!answer.ok)
    throw new ContractViolation(`${step}: expected success, got ${describe(answer.error)}`);
  return answer.value;
}

/** The error of a failure of the given kind, or a violation. */
export function errorOf<K extends ServiceErrorKind>(
  answer: Result<unknown, ServiceError>,
  kind: K,
  step: string,
): Extract<ServiceError, { kind: K }> {
  if (answer.ok) throw new ContractViolation(`${step}: expected ${kind}, got a success`);
  check(answer.error.kind === kind, `${step}: expected ${kind}, got ${describe(answer.error)}`);
  return answer.error as Extract<ServiceError, { kind: K }>;
}

/** The record kinds a success wrote. */
export function changedKinds(answer: Result<unknown, ServiceError>): readonly string[] {
  return answer.ok ? [...new Set(answer.changed.map((ref) => ref.kind))].sort() : [];
}
