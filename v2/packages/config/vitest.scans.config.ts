import { defineConfig } from 'vitest/config';

// Repository checks (Appendix F §7.6–§7.7): they read files outside this package, so they are
// never part of the Turbo-cached `test` task. `pnpm verify` runs them on every call.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.scan.test.ts'],
    testTimeout: 60_000,
    // Every check by name, and the summary the suite prints (files, findings, exceptions).
    reporters: ['verbose'],
  },
});
