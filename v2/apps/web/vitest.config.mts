import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { createVitestConfig } from '@xr/testing';

export default createVitestConfig(
  {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
  },
  {
    plugins: [react()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
  },
);
