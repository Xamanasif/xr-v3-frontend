import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { describeSchemaNode } from './zod-introspection.js';

describe('describeSchemaNode (the Zod 4.6 introspection adapter)', () => {
  it('describes a pipeline with both stages as children', () => {
    const node = describeSchemaNode(z.string().pipe(z.string().min(5)));
    expect(node.kind).toBe('pipe');
    expect(node.codec).toBe(false);
    expect(node.children.map((c) => c.label)).toEqual(['[in]', '[out]']);
    expect(describeSchemaNode(node.children[1]!.schema).checks).toEqual([{ kind: 'min_length' }]);
  });

  it('recognises a codec as a pipe that carries conversion functions', () => {
    const codec = z.codec(z.iso.datetime(), z.date(), {
      decode: (value) => new Date(value),
      encode: (value) => value.toISOString(),
    });
    const node = describeSchemaNode(codec);
    expect(node.kind).toBe('pipe');
    expect(node.codec).toBe(true);
  });

  it('describes transforms and preprocess as pipes', () => {
    expect(describeSchemaNode(z.string().transform((s) => s)).kind).toBe('pipe');
    expect(describeSchemaNode(z.preprocess((s) => s, z.string())).kind).toBe('pipe');
    expect(describeSchemaNode(z.stringbool()).kind).toBe('pipe');
  });

  it('lists checks with their kinds and formats', () => {
    const node = describeSchemaNode(
      z
        .string()
        .min(1)
        .max(3)
        .regex(/a/)
        .email()
        .includes('a')
        .trim()
        .refine(() => true),
    );
    expect(node.kind).toBe('string');
    expect(node.checks).toEqual([
      { kind: 'min_length' },
      { kind: 'max_length' },
      { kind: 'string_format', format: 'regex' },
      { kind: 'string_format', format: 'email' },
      { kind: 'string_format', format: 'includes' },
      { kind: 'overwrite' },
      { kind: 'custom' },
    ]);
  });

  it('exposes the format of directly created string-format schemas', () => {
    expect(describeSchemaNode(z.iso.datetime({ offset: true })).format).toBe('datetime');
    expect(describeSchemaNode(z.email()).format).toBe('email');
    expect(describeSchemaNode(z.string()).format).toBeUndefined();
  });

  it('flags coercion', () => {
    expect(describeSchemaNode(z.coerce.number()).coerce).toBe(true);
    expect(describeSchemaNode(z.number()).coerce).toBe(false);
  });

  it('walks object, array, tuple, union, record, wrapper, lazy and template-literal children', () => {
    const labels = (schema: z.ZodType) => describeSchemaNode(schema).children.map((c) => c.label);
    expect(labels(z.object({ a: z.string(), b: z.number() }).catchall(z.string()))).toEqual([
      'a',
      'b',
      '[catchall]',
    ]);
    expect(labels(z.array(z.string()))).toEqual(['[]']);
    expect(labels(z.tuple([z.string(), z.number()]).rest(z.boolean()))).toEqual([
      '0',
      '1',
      '[rest]',
    ]);
    expect(labels(z.union([z.string(), z.number()]))).toEqual(['[option 0]', '[option 1]']);
    expect(labels(z.record(z.string(), z.number()))).toEqual(['[key]', '[value]']);
    expect(labels(z.string().optional())).toEqual(['[inner]']);
    expect(labels(z.lazy(() => z.string()))).toEqual(['[lazy]']);
    expect(labels(z.templateLiteral(['a-', z.number()]))).toEqual(['[part 1]']);
    expect(labels(z.intersection(z.object({}), z.object({})))).toEqual(['[left]', '[right]']);
  });
});
