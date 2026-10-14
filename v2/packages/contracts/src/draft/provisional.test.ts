/**
 * The provisional register (WP-0.10 authorisation §5): every item is traceable — each trace
 * resolves to a refusal code, history event, system writer, catalogue key, ledger decision or
 * schema field that exists — and reversible; the owner-named WP-0.9 interpretations stay
 * provisional; and every undecided rule the contracts name (register and ledger) is traceable to
 * the WP-0.9 domain or the audit documents.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { SYSTEM_ACTORS } from '@xr/domain';
import { describe, expect, it } from 'vitest';
import type { z } from 'zod';

import { V2 } from '../test-support/sources.js';
import * as draft from './index.js';
import { isMessageKey } from './errors/messages.js';
import { PROVISIONAL_REFUSAL_CODES, REFUSAL_CODES } from './errors/refusals.js';
import { ledgerRows } from './ledger/index.js';
import { PROVISIONAL_REGISTER, type Trace } from './provisional.js';
import { ACCESS_PLAN_EVENTS, INSTITUTION_EVENTS } from './records/institution.js';

const ROWS = new Map(ledgerRows().map((row) => [row.id, row]));
const defOf = (schema: unknown) => (schema as { _zod: { def: Record<string, unknown> } })._zod.def;

/** Unwraps optional, nullable, readonly, default and pipes (their output side). */
function unwrap(schema: z.ZodType): z.ZodType {
  const def = defOf(schema);
  if (['optional', 'nullable', 'readonly', 'default'].includes(def['type'] as string))
    return unwrap(def['innerType'] as z.ZodType);
  if (def['type'] === 'pipe') {
    const out = defOf(def['out']);
    return unwrap((out['type'] === 'transform' ? def['in'] : def['out']) as z.ZodType);
  }
  return schema;
}

/** Whether `path` (`a.b`, `(array).a`, `(union)`, `(enum)`) names a part of `schema` (any union branch). */
function resolves(schema: z.ZodType, path: readonly string[]): boolean {
  const node = unwrap(schema);
  const def = defOf(node);
  const [step, ...rest] = path;
  if (step === undefined) return true;
  if (step === '(union)') return def['type'] === 'union' && rest.length === 0;
  if (step === '(enum)') return def['type'] === 'enum' && rest.length === 0;
  if (def['type'] === 'union')
    return (def['options'] as z.ZodType[]).some((option) => resolves(option, path));
  if (step === '(array)')
    return def['type'] === 'array' && resolves(def['element'] as z.ZodType, rest);
  if (def['type'] !== 'object' || !Object.hasOwn(def['shape'] as object, step)) return false;
  return resolves((def['shape'] as Record<string, z.ZodType>)[step]!, rest);
}

function traceHolds(trace: Trace): boolean {
  switch (trace.kind) {
    case 'refusal-code':
      return REFUSAL_CODES.includes(trace.code);
    case 'event':
      return (
        trace.vocabulary === 'INSTITUTION_EVENTS' ? INSTITUTION_EVENTS : ACCESS_PLAN_EVENTS
      ).includes(trace.value as never);
    case 'system-actor':
      return SYSTEM_ACTORS.includes(trace.value);
    case 'message-key':
      return isMessageKey(trace.key);
    case 'open-decision':
      return ROWS.get(trace.method)?.open.includes(trace.decision) ?? false;
    case 'refusal-of':
      return (
        (ROWS.get(trace.method)?.refusals as readonly string[] | undefined)?.includes(trace.code) ??
        false
      );
    case 'schema-field': {
      const schema = (draft as Record<string, unknown>)[trace.schema];
      return (
        typeof schema === 'object' &&
        schema !== null &&
        '_zod' in schema &&
        resolves(schema as z.ZodType, trace.path.split('.'))
      );
    }
  }
}

describe('the provisional register', () => {
  it('numbers its items PC-01 … PC-35 in order', () => {
    expect(PROVISIONAL_REGISTER.map((item) => item.id)).toEqual(
      Array.from({ length: 35 }, (_, index) => `PC-${String(index + 1).padStart(2, '0')}`),
    );
  });

  it.each(PROVISIONAL_REGISTER.map((item) => [item.id, item] as const))(
    '%s is traceable and reversible',
    (_, item) => {
      for (const trace of item.trace) expect(traceHolds(trace), JSON.stringify(trace)).toBe(true);
      expect(item.source.length).toBeGreaterThan(10);
      expect(item.reversal.length).toBeGreaterThan(10);
      if (item.status === 'unresolved' || item.status === 'owner-approved-interim') {
        expect(item.decisions.length, 'an open question names its decision').toBeGreaterThan(0);
      }
    },
  );

  it('keeps the owner-named WP-0.9 interpretations provisional, never approved', () => {
    const named = {
      'student-import course codes': 'PC-05',
      'licence changes after narrower approvals': 'PC-06',
      'result-release timing': 'PC-07',
      'feedback eligibility after an experiment closes': 'PC-08',
      'question draft ownership fields': 'PC-04',
      'additional refusal types': 'PC-01',
      'additional history-event types': 'PC-02',
    };
    for (const [subject, id] of Object.entries(named)) {
      expect(PROVISIONAL_REGISTER.find((item) => item.id === id)!.status, subject).toBe(
        'provisional-reading',
      );
    }
  });

  it('registers every WP-0.9 refusal code and every pre-rendered read-model field', () => {
    const traced = PROVISIONAL_REGISTER.flatMap((item) => item.trace);
    for (const code of PROVISIONAL_REFUSAL_CODES)
      expect(traced).toContainEqual({ kind: 'refusal-code', code });
    expect(
      PROVISIONAL_REGISTER.find((item) => item.id === 'PC-13')!.trace.length,
    ).toBeGreaterThanOrEqual(6);
  });

  it('flags the contract assumptions an API would make hard to undo', () => {
    const flagged = PROVISIONAL_REGISTER.filter((item) => item.irreversible !== null).map(
      (item) => item.id,
    );
    expect(flagged).toEqual([
      'PC-01',
      'PC-04',
      'PC-19',
      'PC-27',
      'PC-29',
      'PC-30',
      'PC-31',
      'PC-32',
      'PC-33',
      'PC-34',
      'PC-35',
    ]);
  });
});

describe('every undecided rule the contracts name is traceable', () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? walk(path) : [path];
    });
  const domain = walk(join(V2, 'packages', 'domain', 'src'))
    .filter((file) => file.endsWith('.ts') && !file.endsWith('.test.ts'))
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n');
  const documents = [
    ...walk(join(V2, 'docs', 'v46', 'audit')),
    join(V2, 'docs', 'v46', 'permission-matrix.json'),
    join(V2, 'docs', 'OPEN_DECISIONS.md'),
  ]
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n');
  const ids = [
    ...new Set([
      ...ledgerRows().flatMap((row) => row.open),
      ...PROVISIONAL_REGISTER.flatMap((item) => item.decisions),
    ]),
  ];

  it.each(ids)('%s is produced by the WP-0.9 domain or named in the audit documents', (id) => {
    expect(domain.includes(`'${id}'`) || documents.includes(id)).toBe(true);
  });
});
