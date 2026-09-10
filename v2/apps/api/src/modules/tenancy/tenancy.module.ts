import { Module } from '@nestjs/common';

/**
 * EXTENSION POINT — multi-tenancy resolution is documented, not implemented, in Phase 0.
 *
 * What lands here (Phase 3): resolving a `TenantContext` from the `Principal` for
 * tenant-plane requests, and the repository scoping that makes "one institution never
 * writes into another" (parity row P-08) structural rather than conventional.
 */
@Module({})
export class TenancyModule {}
