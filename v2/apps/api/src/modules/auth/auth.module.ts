import { Module } from '@nestjs/common';

/**
 * EXTENSION POINT — authentication is NOT implemented and NOT faked in Phase 0.
 *
 * What lands here (Phase 3, first backend increment):
 *  - a guard that verifies OIDC bearer tokens against the configured issuer
 *    (`ApiConfigService.oidc`) using JWKS discovery;
 *  - `Principal` resolution from platform records (role assignments, Tenant Admin
 *    assignment, tenant membership) — see `principal.ts`;
 *  - the platform-authentication fallback for institutions without SSO (STK31-44).
 *
 * The identity provider / broker is an open decision (docs/OPEN_DECISIONS.md A-01, E-01–E-03).
 */
@Module({})
export class AuthModule {}
