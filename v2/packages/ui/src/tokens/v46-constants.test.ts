/**
 * Drift test of the generated v46 constants (Appendix E §1.2 T-1/T-2; Appendix F WP-0.5): the
 * committed module equals what the generator produces from the frozen handoff today, its values
 * equal handoff/tokens.json, and tokens.json still equals the `:root` block of the verbatim
 * xr-foundation.css — so there is exactly one token system, defined by the v46 stylesheet.
 */
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  APPROVED_THRESHOLDS,
  OUTPUT,
  SHEETS,
  SHEETS_DIRECTORY,
  TOKENS_JSON,
  containersUsing,
  readInputs,
  renderV46Constants,
} from '../../scripts/generate-v46-constants.mjs';
import { V46_CONTAINER_THRESHOLDS, V46_FOCUS_COLOURS } from './v46-constants.js';

type TokenGroups = Record<string, Record<string, string>>;

const tokenGroups = (JSON.parse(readFileSync(TOKENS_JSON, 'utf8')) as { tokens: TokenGroups })
  .tokens;
const handoffTokens = new Map(Object.values(tokenGroups).flatMap((group) => Object.entries(group)));

function rootCustomProperties(css: string): Map<string, string> {
  const root = /:root\{([^}]*)\}/.exec(css);
  if (!root?.[1]) throw new Error('xr-foundation.css has no :root block');
  return new Map(
    [...root[1].matchAll(/(--[\w-]+):([^;]+)(?:;|$)/g)].map(
      ([, name, value]) => [name, value?.trim()] as [string, string],
    ),
  );
}

describe('generated v46 constants', () => {
  it('the committed module is exactly what the generator writes from the frozen sources', () => {
    expect(readFileSync(OUTPUT, 'utf8')).toBe(renderV46Constants(readInputs()));
  });

  it('exposes exactly the approved thresholds 600, 760, 860, 1024 and 1280', () => {
    expect(Object.values(V46_CONTAINER_THRESHOLDS).map((threshold) => threshold.px)).toEqual([
      600, 760, 860, 1024, 1280,
    ]);
    expect(APPROVED_THRESHOLDS.map((threshold) => threshold.px)).toEqual([
      600, 760, 860, 1024, 1280,
    ]);
  });

  it('each threshold is a real container-query boundary of the v46 sheets', () => {
    const css = SHEETS.map((sheet) => readFileSync(`${SHEETS_DIRECTORY}/${sheet}`, 'utf8')).join(
      '\n',
    );
    for (const threshold of Object.values(V46_CONTAINER_THRESHOLDS)) {
      expect(threshold.containers.length, `${threshold.px}px`).toBeGreaterThan(0);
      expect(containersUsing(css, threshold.px)).toEqual([...threshold.containers]);
    }
    // Spot checks against Appendix E §6.1 (drawer below 1024, labelled rows below 760 content).
    expect(css).toContain('@container xr-app (max-width:1023.98px)');
    expect(css).toContain('@container xr-content (max-width:759.98px)');
    expect(css).toContain('@container xr-content (min-width:860px)');
  });

  it('focus colours equal --xr-focus and --xr-focus-dark in handoff/tokens.json', () => {
    expect(V46_FOCUS_COLOURS).toEqual({
      focus: handoffTokens.get('--xr-focus'),
      focusDark: handoffTokens.get('--xr-focus-dark'),
    });
    expect(V46_FOCUS_COLOURS).toEqual({ focus: '#1F4FD8', focusDark: '#F7C95B' });
  });
});

describe('one token system: handoff/tokens.json equals the verbatim xr-foundation.css :root', () => {
  const root = rootCustomProperties(readFileSync(`${SHEETS_DIRECTORY}/xr-foundation.css`, 'utf8'));

  it('has the 65 v46 tokens in seven groups', () => {
    expect(handoffTokens.size).toBe(65);
    expect(Object.keys(tokenGroups)).toEqual([
      'font',
      'color',
      'space',
      'radius',
      'elevation',
      'motion',
      'layout',
    ]);
  });

  it('name for name and value for value', () => {
    expect(Object.fromEntries(root)).toEqual(Object.fromEntries(handoffTokens));
  });

  it('defines the body colours the acceptance checks expect (#F4F5FB on #12173F)', () => {
    expect(handoffTokens.get('--xr-canvas')).toBe('#F4F5FB');
    expect(handoffTokens.get('--xr-ink')).toBe('#12173F');
  });
});
