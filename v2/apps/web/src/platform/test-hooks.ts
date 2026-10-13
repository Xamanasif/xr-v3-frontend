/**
 * The test-hook seam as every product build compiles it: empty (ADR-0007 §2; Appendix F §3.2,
 * §3.8). `next.config.ts` resolves `@/platform/test-hooks` here unless the build is a dedicated
 * CI/Playwright build, which resolves it to `test-hook-bridge.ts` instead. Hosted builds — owner
 * and reviewer builds included — therefore contain no hook, no boot descriptor reader and no
 * test seam, and nothing at run time can switch them on.
 */
import type { TestHooks } from './test-hook-contract';

export const testHooks: TestHooks | null = null;
