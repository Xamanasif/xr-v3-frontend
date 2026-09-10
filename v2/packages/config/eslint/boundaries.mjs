// ESLint preset enforcing the package boundaries declared in `boundary-matrix.mjs`
// through the resolved-target rule in `rules/resolved-boundaries.mjs`.
import { WORKSPACE_PACKAGES } from './boundary-matrix.mjs';
import { xrPlugin } from './rules/resolved-boundaries.mjs';

export * from './boundary-matrix.mjs';
export {
  externalPackageOf,
  isPublicExport,
  resolvedBoundariesRule,
  xrPlugin,
} from './rules/resolved-boundaries.mjs';

/** ESLint flat-config object enforcing the boundary of one package. */
export function boundaries(packageName) {
  if (!WORKSPACE_PACKAGES.includes(packageName)) {
    throw new Error(`No boundary is declared for ${packageName} in eslint/boundary-matrix.mjs`);
  }
  return {
    plugins: { xr: xrPlugin },
    rules: {
      'xr/resolved-boundaries': ['error', { packageName }],
    },
  };
}
