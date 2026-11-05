/**
 * `SessionService` for the `api` data source before the identity phase (B3; ADR-0014). The API
 * has no sign-in yet (A-01 / E-01 / E-02 open), so the truthful answers are: nobody is signed in,
 * and signing in is not available. No identity is invented and no sample person stands in.
 */
import { failure, type SessionService, success } from '@xr/contracts/draft';

export function visitorSessionPort(): SessionService {
  return {
    signIn: async () => failure({ kind: 'unavailable' }),
    getSession: async () => success(null),
    signOut: async () => failure({ kind: 'not-signed-in' }),
    checkWorkspace: async () => failure({ kind: 'not-signed-in' }),
  };
}
