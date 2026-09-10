import { z } from 'zod';

/** An opaque record identifier as carried in API payloads (wire form: no trimming). */
export const identifier = z.string().min(1).max(200);

/** URL-safe lower-case slug (catalogue ids such as `direct-shear`). */
export const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'lower-case letters, digits and single hyphens only');
