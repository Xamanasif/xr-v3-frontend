/**
 * Icon registry provenance (Appendix E §3.1 Icon: "Generate the registry mechanically from board
 * paths, named from the board-02 list"; Appendix F WP-0.6). The committed module is exactly what
 * the generator writes from the frozen boards; every path is drawn on a board.
 */
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  boardTwoIcons,
  drawnIconPaths,
  OUTPUT,
  readBoards,
  renderIconRegistry,
  SCRIPT_NAMES,
  USE_NAMES,
} from '../../scripts/generate-icon-registry.mjs';
import { BOARD_TWO_LABELS, FORMAT_GLYPH_PATHS, ICON_PATHS } from './registry.js';

const boards = readBoards();

describe('icon registry', () => {
  it('the committed registry is exactly what the generator writes from the boards', () => {
    expect(readFileSync(OUTPUT, 'utf8')).toBe(renderIconRegistry(boards));
  });

  it('holds the 48 board-02 icons, named and labelled in board order', () => {
    const named = boardTwoIcons(boards);
    expect(named).toHaveLength(48);
    expect(Object.values(BOARD_TWO_LABELS)).toEqual(named.map((icon) => icon.label));
    for (const { path } of named) expect(Object.values(ICON_PATHS)).toContain(path);
  });

  it('holds every static icon path the boards draw, and nothing else', () => {
    const drawn = drawnIconPaths(boards);
    expect(drawn.size).toBe(78);
    const registered = new Set(Object.values(ICON_PATHS));
    for (const path of drawn.keys()) expect(registered).toContain(path);
    for (const path of Object.values(USE_NAMES)) expect(drawn.has(path)).toBe(true);
    expect(Object.keys(ICON_PATHS)).toHaveLength(
      48 + Object.keys(USE_NAMES).length + Object.keys(SCRIPT_NAMES).length,
    );
  });

  it('holds the four format glyphs in the fixed order WEB · AR · VR · MR', () => {
    expect(Object.keys(FORMAT_GLYPH_PATHS)).toEqual(['WEB', 'AR', 'VR', 'MR']);
  });
});
