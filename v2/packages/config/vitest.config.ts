import { defineConfig } from 'vitest/config';

// @xr/config cannot use @xr/testing's factory: that would create a workspace cycle
// (@xr/testing extends @xr/config's tsconfig presets).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Repository scans read other packages and the frozen handoff: they run uncached through
    // `test:scans` (vitest.scans.config.ts), never inside the cached `test` task.
    exclude: ['**/node_modules/**', 'src/**/*.scan.test.ts'],
  },
});
