import { z } from 'zod';

import { wireSchema } from './openapi.js';

/** RFC 9457 problem details — the one error envelope every API error uses. */
export const PROBLEM_JSON = 'application/problem+json';

export const problemDetailsSchema = wireSchema(
  z.object({
    type: z.string().default('about:blank'),
    title: z.string(),
    status: z.number().int().min(100).max(599),
    detail: z.string().optional(),
    instance: z.string().optional(),
    requestId: z.string().optional(),
    errors: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  }),
  'output',
);
export type ProblemDetails = z.infer<typeof problemDetailsSchema>;
