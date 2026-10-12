import { defineConfig } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import { boundaries, core, ignores, prettier } from '@xr/config/eslint';

export default defineConfig([
  ignores,
  ...core,
  ...nextVitals,
  ...nextTs,
  prettier,
  boundaries('@xr/specimens'),
  { ignores: ['next-env.d.ts'] },
]);
