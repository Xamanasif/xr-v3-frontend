/**
 * Shared shapes of the port signatures (Appendix C §3.0). Every method takes at most one argument
 * and answers a `Result`; the caller is never a parameter — the adapter resolves the person, role,
 * institution and scope from the session and the records on every call (rule 1).
 */
import type { z } from 'zod';

import type { DeepReadonly } from '../kernel/typed.js';
import type { Result, ServiceError } from '../errors/service-error.js';

/** An asynchronous port answer. */
export type Answer<T, E extends ServiceError> = Promise<Result<T, E>>;

/** What a caller passes for a schema (its input side), readonly so read-only data can be passed. */
export type In<S extends z.ZodType> = DeepReadonly<z.input<S>>;

/** What a port answers for a schema (its output side). */
export type Out<S extends z.ZodType> = DeepReadonly<z.output<S>>;
