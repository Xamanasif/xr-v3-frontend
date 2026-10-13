/**
 * §3.1 SessionService (identity) — XS-01, XS-03, XS-04, XS-05, XS-06, XS-08.
 *
 * Sample people sign in only through `signIn`, with a test credential typed into the drawn XS-01
 * form (ADR-0003). No method lists people or switches identity — in the product or any developer
 * surface (owner constraint; B1-09 "Never here"). Banners are derived on every read.
 */
import type { MockSession, ShellBanner } from '@xr/domain';
import { emailAsDrawn } from '@xr/validation';
import { z } from 'zod';

import { mockSession, shellBanner } from '../records/operations.js';
import type {
  NotPermitted,
  NotSignedIn,
  PolicyOpen,
  Refused,
  Unavailable,
  ValidationFailed,
} from '../errors/service-error.js';
import type { Answer, In, Out } from './common.js';
import { key } from './fields.js';

/** The workspace bases (`navigation.json`; routes are proposals, START-HERE Known exception 5). */
export const WORKSPACES = [
  'student',
  'faculty',
  'institute',
  'vendor',
  'reviewer',
  'content-manager',
  'admin',
] as const;
export type Workspace = (typeof WORKSPACES)[number];

export const signInInput = z.discriminatedUnion(
  'method',
  [
    z.object({
      method: z.literal('email'),
      email: emailAsDrawn(key('XS-01.email.required'), key('XS-01.email.format')),
      // A password is never trimmed.
      password: z
        .string({ error: key('XS-01.password.required') })
        .min(1, { error: key('XS-01.password.required') }),
    }),
    z.object({ method: z.literal('sso') }),
  ],
  { error: key('contract.invalid-input') },
);

export const signInOutput = z.object({ session: mockSession, landing: z.string().min(1) });
export const getSessionOutput = z
  .object({ session: mockSession, banners: z.array(shellBanner) })
  .nullable();
export const signOutOutput = z.object({ signedOut: z.literal(true) });
export const workspaceInput = z.enum(WORKSPACES, { error: key('contract.invalid-input') });
export const checkWorkspaceOutput = z.literal('allowed');

export type SignInInput = In<typeof signInInput>;

export interface SessionService {
  /** Policy-open: T-10 (single sign-on is drawn as a button only), SES-09 (an inactive Faculty member). */
  signIn(
    input: SignInInput,
  ): Answer<
    { readonly session: MockSession; readonly landing: string },
    ValidationFailed | Refused<'wrong-details'> | PolicyOpen | Unavailable
  >;
  getSession(): Answer<
    { readonly session: MockSession; readonly banners: readonly ShellBanner[] } | null,
    Unavailable
  >;
  signOut(): Answer<Out<typeof signOutOutput>, NotSignedIn | Unavailable>;
  checkWorkspace(workspace: Workspace): Answer<'allowed', NotSignedIn | NotPermitted | Unavailable>;
}
