import { defineConfig } from 'vitest/config';

// The factory lives in this package, so its own tests use Vitest directly.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
