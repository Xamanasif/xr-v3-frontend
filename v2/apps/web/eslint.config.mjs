import { defineConfig } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import { boundaries, core, ignores, prettier, webFences } from '@xr/config/eslint';

export default defineConfig([
  ignores,
  ...core,
  ...nextVitals,
  ...nextTs,
  prettier,
  boundaries('@xr/web'),
  // Layer fences and product-code bans (Appendix F §3.8, WP-0.4).
  ...webFences(import.meta.dirname),
  { ignores: ['next-env.d.ts'] },
]);
