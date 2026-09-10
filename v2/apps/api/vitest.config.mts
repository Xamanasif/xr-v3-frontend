import { createVitestConfig } from '@xr/testing';
import swc from 'unplugin-swc';

// NestJS relies on `emitDecoratorMetadata`, which esbuild cannot produce; SWC can.
export default createVitestConfig(
  { environment: 'node', include: ['src/**/*.test.ts', 'test/**/*.test.ts'] },
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
