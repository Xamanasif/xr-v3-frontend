/**
 * The compile-time ties to `@xr/domain` (ADR-0008 decision 6). The `@ts-expect-error` lines are
 * the test: `pnpm typecheck` fails if any of them stops being an error — a schema that drifts from
 * its domain type, a vocabulary that misses or adds a member, a ledger entry that disagrees with
 * its port signature. The runtime checks cover what types cannot: duplicate vocabulary members,
 * the drawn patterns equal to the domain's, and output schemas an API could publish.
 */
import {
  HTTPS_LINK,
  type IsoInstant,
  RECORD_KINDS,
  type RefusalCode,
  TECHNOLOGIES,
  WORK_EMAIL,
} from '@xr/domain';
import { EMAIL_AS_DRAWN, HTTPS_LINK_AS_DRAWN } from '@xr/validation';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { assertRepresentable } from '../../openapi.js';
import * as draft from '../index.js';
import type { Failure, NotFound, Refused, Result, Unavailable } from '../errors/service-error.js';
import { entry, ledgerRows, portLedger } from '../ledger/index.js';
import { branded, typedAs, vocabulary } from './typed.js';
import { isoInstant, recordKind, technology } from './primitives.js';

interface Sample {
  readonly id: string;
  readonly at: IsoInstant;
  readonly note: string | null;
}

describe('typedAs: a schema compiles only with the exact domain shape', () => {
  it('accepts the exact shape and returns the same schema', () => {
    const schema = z.object({ id: z.string(), at: isoInstant, note: z.string().nullable() });
    expect(typedAs<Sample>()(schema)).toBe(schema);
  });

  it('rejects drift (each call below is a compile error)', () => {
    const missing = z.object({ id: z.string(), at: isoInstant });
    const added = z.object({
      id: z.string(),
      at: isoInstant,
      note: z.string().nullable(),
      extra: z.number(),
    });
    const optional = z.object({ id: z.string(), at: isoInstant, note: z.string().optional() });
    const unbranded = z.object({ id: z.string(), at: z.string(), note: z.string().nullable() });
    const retyped = z.object({ id: z.number(), at: isoInstant, note: z.string().nullable() });
    const check = typedAs<Sample>();
    // @ts-expect-error — a field missing
    check(missing);
    // @ts-expect-error — a field added
    check(added);
    // @ts-expect-error — optional is not nullable
    check(optional);
    // @ts-expect-error — a plain string is not the IsoInstant brand
    check(unbranded);
    // @ts-expect-error — a retyped field
    check(retyped);
    expect(true).toBe(true);
  });
});

describe('vocabulary: a list compiles only with every member of its domain union', () => {
  type Colour = 'red' | 'green';

  it('accepts the exact members', () => {
    expect(vocabulary<Colour>()(['red', 'green'])).toEqual(['red', 'green']);
  });

  it('rejects a missing or an extra member (compile errors)', () => {
    // @ts-expect-error — 'green' is missing
    vocabulary<Colour>()(['red']);
    // @ts-expect-error — 'blue' is not a member
    vocabulary<Colour>()(['red', 'green', 'blue']);
    expect(true).toBe(true);
  });

  it('has no duplicate member in any exported vocabulary (a duplicate still type-checks)', () => {
    const lists = Object.entries(draft).filter(
      ([name, value]) =>
        /^[A-Z][A-Z_]+$/.test(name) &&
        Array.isArray(value) &&
        value.every((item) => typeof item === 'string'),
    ) as [string, readonly string[]][];
    expect(lists.length).toBeGreaterThan(20);
    for (const [name, list] of lists) expect(new Set(list).size, name).toBe(list.length);
  });

  it('keeps one list per domain vocabulary', () => {
    expect([...technology.options]).toEqual([...TECHNOLOGIES]);
    expect([...recordKind.options]).toEqual([...RECORD_KINDS]);
  });
});

describe('the method ledger rejects an entry that disagrees with its port (compile errors)', () => {
  interface Port {
    find(
      id: string,
    ): Promise<Result<{ readonly name: string }, NotFound | Unavailable | Refused<'plan-ended'>>>;
  }
  const output = z.object({ name: z.string() });
  const base = { kind: 'read', input: z.string(), output, mock: 'P1', screens: ['PU-01'] } as const;

  it('accepts the entry that matches', () => {
    const ledger = portLedger<Port>()({
      find: entry({
        ...base,
        errors: ['not-found', 'unavailable', 'refused'],
        refusals: ['plan-ended'],
      }),
    });
    expect(ledger.find.errors).toHaveLength(3);
  });

  it('rejects a wrong error union, refusal list, input or output', () => {
    portLedger<Port>()({
      // @ts-expect-error — `unavailable` is not declared
      find: entry({ ...base, errors: ['not-found', 'refused'], refusals: ['plan-ended'] }),
    });
    portLedger<Port>()({
      // @ts-expect-error — a refusal code the signature does not have
      find: entry({
        ...base,
        errors: ['not-found', 'unavailable', 'refused'],
        refusals: ['plan-ended', 'nothing-held'] as RefusalCode[],
      }),
    });
    portLedger<Port>()({
      // @ts-expect-error — the input schema is not the parameter
      find: entry({
        ...base,
        input: z.number(),
        errors: ['not-found', 'unavailable', 'refused'],
        refusals: ['plan-ended'],
      }),
    });
    portLedger<Port>()({
      // @ts-expect-error — the output schema is not the success value
      find: entry({
        ...base,
        output: z.object({ title: z.string() }),
        errors: ['not-found', 'unavailable', 'refused'],
        refusals: ['plan-ended'],
      }),
    });
    expect(true).toBe(true);
  });

  it('types a failure by its declared kinds only', () => {
    const answer: Failure<NotFound> = { ok: false, error: { kind: 'not-found' } };
    // @ts-expect-error — `unavailable` is not in Failure<NotFound>
    const wrong: Failure<NotFound> = { ok: false, error: { kind: 'unavailable' } };
    expect([answer, wrong]).toHaveLength(2);
  });
});

describe('runtime shapes', () => {
  it('brands at the type level only', () => {
    const schema = z.string();
    expect(branded<IsoInstant>()(schema)).toBe(schema);
  });

  it('uses the domain’s drawn patterns for e-mail and https links', () => {
    expect(EMAIL_AS_DRAWN.source).toBe(WORK_EMAIL.source);
    expect(HTTPS_LINK_AS_DRAWN.source).toBe(HTTPS_LINK.source);
  });

  it('keeps every output schema publishable (OpenAPI-representable, no transform)', () => {
    const outputs = [...new Set(ledgerRows().map((row) => row.output))];
    expect(outputs.length).toBeGreaterThan(100);
    for (const output of outputs) expect(() => assertRepresentable(output, 'output')).not.toThrow();
  });
});
