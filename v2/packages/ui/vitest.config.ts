import { createVitestConfig } from '@xr/testing';

export default createVitestConfig({
  environment: 'jsdom',
  include: ['src/**/*.test.{ts,tsx}'],
  setupFiles: ['./vitest.setup.ts'],
});
