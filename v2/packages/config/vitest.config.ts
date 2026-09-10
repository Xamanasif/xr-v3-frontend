import { defineConfig } from 'vitest/config';

// @xr/config cannot use @xr/testing's factory: that would create a workspace cycle
// (@xr/testing extends @xr/config's tsconfig presets).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
