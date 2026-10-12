/**
 * Phase-0 surface of @xr/ui (WP-0.5): the stylesheet entry `./styles.css` replaces the retired
 * placeholder `./tokens.css`, and the package exports only the generated v46 constants until the
 * v46 components arrive (WP-0.6).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import * as ui from './index.js';

const packageRoot = join(import.meta.dirname, '..');
const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8')) as {
  exports: Record<string, unknown>;
  files: string[];
};

describe('@xr/ui package surface', () => {
  it('exports the generated v46 constants and no component yet', () => {
    expect(Object.keys(ui).sort()).toEqual(['V46_CONTAINER_THRESHOLDS', 'V46_FOCUS_COLOURS']);
  });

  it('exports the v46 stylesheet entry as ./styles.css and ships the styles folder', () => {
    expect(manifest.exports['./styles.css']).toBe('./src/styles/index.css');
    expect(existsSync(join(packageRoot, 'src', 'styles', 'index.css'))).toBe(true);
    expect(manifest.files).toContain('src/styles');
  });

  it('no longer has the placeholder token stylesheet (one token system: xr-foundation.css)', () => {
    expect(Object.keys(manifest.exports).sort()).toEqual(['.', './styles.css']);
    expect(existsSync(join(packageRoot, 'src', 'tokens.css'))).toBe(false);
  });
});
