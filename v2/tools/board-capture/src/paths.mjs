// Locations the board-capture harness reads. Test-only tooling (WP-0.15, Appendix F §7.5): never
// imported by product code, never deployed.
//
// The suites that use these modules (Playwright, Vitest) may load them as CommonJS, where
// `import.meta` is a syntax error, so the repository root is found from the working directory:
// the nearest ancestor holding `design/handoff-v46/START-HERE.md`.
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

function findRepositoryRoot(start) {
  for (let directory = start; ; directory = dirname(directory)) {
    if (existsSync(join(directory, 'design', 'handoff-v46', 'START-HERE.md'))) return directory;
    if (dirname(directory) === directory) {
      throw new Error(`board-capture: no design/handoff-v46 above ${start}`);
    }
  }
}

/** The repository root (holds `design/handoff-v46` and `v2`). */
export const REPO_ROOT = findRepositoryRoot(process.cwd());

/** `v2`. */
export const WORKSPACE_ROOT = join(REPO_ROOT, 'v2');

/** `v2/tools/board-capture`. */
export const TOOL_ROOT = join(WORKSPACE_ROOT, 'tools', 'board-capture');

/** The frozen v46 handoff. Read only: nothing in this harness writes below it. */
export const HANDOFF_ROOT = join(REPO_ROOT, 'design', 'handoff-v46');

/** The frozen design files (boards, stylesheets, art, handoff data). */
export const PROJECT_ROOT = join(HANDOFF_ROOT, 'canvas-v46', 'project');

/** The canvas runtime copy shipped for offline preview (runtime/README.md). */
export const SUPPORT_JS = join(HANDOFF_ROOT, 'runtime', 'support.js');

/** Freeze-time index of the 966 product frames (derived/README.md: non-authoritative). */
export const FRAME_INDEX = join(HANDOFF_ROOT, 'derived', 'frame-index.json');

/** The approved, integrity-checked capture inputs (G-5c). Prettier-ignored. */
export const VENDOR_ROOT = join(TOOL_ROOT, 'vendor');

/**
 * Run artefacts (references, product captures, diffs, the run report). Git-ignored: captures are
 * machine-specific and never committed as cross-OS baselines (Appendix E §9.1, VD-18).
 */
export const RUNS_ROOT = join(TOOL_ROOT, '.runs');

/**
 * The scoped V3 comparison map (ADR-0010): migrated product screens and the v46 comparisons each
 * one supersedes, retired by name.
 */
export const V3_COMPARISON_MAP = join(WORKSPACE_ROOT, 'docs', 'v3', 'V3-COMPARISON-MAP.json');
