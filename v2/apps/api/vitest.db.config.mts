import { createVitestConfig } from '@xr/testing';
import swc from 'unplugin-swc';

// Database-backed checks (`pnpm test:db`, never cached). Like prisma.config.ts: load the workspace
// root `.env` (v2/.env) when it exists; values already in the shell (CI) take precedence; with
// neither, the database cases are skipped.
try {
  process.loadEnvFile(new URL('../../.env', import.meta.url));
} catch {
  // no root .env — environment variables already set, or the database cases skip
}

// NestJS relies on `emitDecoratorMetadata`, which esbuild cannot produce; SWC can.
export default createVitestConfig(
  { environment: 'node', include: ['test/**/*.db.test.ts'], environmentDependent: true },
  {
    plugins: [
      swc.vite({
        module: { type: 'es6' },
        jsc: {
          target: 'es2022',
          parser: { syntax: 'typescript', decorators: true },
          transform: { legacyDecorator: true, decoratorMetadata: true },
        },
      }),
    ],
  },
);
