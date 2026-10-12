/**
 * Phase-0 surface of @xr/ui (WP-0.3): the rejected foundation component is gone and no
 * component is exported until the v46 components arrive (WP-0.6); the stylesheet entry
 * the web app imports still resolves.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import * as ui from './index.js';

const packageRoot = join(import.meta.dirname, '..');

describe('@xr/ui package surface', () => {
  it('exports no component before the v46 components arrive', () => {
    expect(Object.keys(ui)).toEqual([]);
  });

  it('keeps the stylesheet entry the web application imports', () => {
    const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8')) as {
      exports: Record<string, unknown>;
    };
    expect(manifest.exports['./tokens.css']).toBe('./src/tokens.css');
    expect(existsSync(join(packageRoot, 'src', 'tokens.css'))).toBe(true);
  });
});
