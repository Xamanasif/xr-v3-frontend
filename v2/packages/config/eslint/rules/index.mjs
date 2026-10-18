// The `xr` ESLint plugin: every workspace rule, registered on ONE plugin object. Flat config
// refuses two different objects under the same plugin key, so all presets share this one.
import { deterministicRule } from './deterministic.mjs';
import { importFenceRule } from './import-fence.mjs';
import { noCanvasClassesRule } from './no-canvas-classes.mjs';
import { noProcessEnvRule } from './no-process-env.mjs';
import { noRawHexRule } from './no-raw-hex.mjs';
import { productClassAllowListRule } from './product-class-allow-list.mjs';
import { resolvedBoundariesRule } from './resolved-boundaries.mjs';
import { v3ClassNamesRule } from './v3-class-names.mjs';
import { v46ClassNamesRule } from './v46-class-names.mjs';

export const xrPlugin = {
  meta: { name: 'xr', version: '0.0.0' },
  rules: {
    'resolved-boundaries': resolvedBoundariesRule,
    'import-fence': importFenceRule,
    'no-process-env': noProcessEnvRule,
    deterministic: deterministicRule,
    'no-canvas-classes': noCanvasClassesRule,
    'v46-class-names': v46ClassNamesRule,
    'v3-class-names': v3ClassNamesRule,
    'no-raw-hex': noRawHexRule,
    'product-class-allow-list': productClassAllowListRule,
  },
};

export {
  deterministicRule,
  importFenceRule,
  noCanvasClassesRule,
  noProcessEnvRule,
  noRawHexRule,
  productClassAllowListRule,
  resolvedBoundariesRule,
  v3ClassNamesRule,
  v46ClassNamesRule,
};
