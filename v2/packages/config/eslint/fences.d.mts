import type { Linter } from 'eslint';

export interface RecordedFenceException {
  readonly file: string;
  readonly fence: string;
  readonly allows: readonly string[];
  readonly evidence: string;
  readonly removal: string;
}

export const TEST_FILES: readonly string[];
export const DOMAIN_VOCABULARY: readonly string[];
export const RECORDED_FENCE_EXCEPTIONS: readonly RecordedFenceException[];
export function webFences(appDir: string): Linter.Config[];
export const uiRules: Linter.Config[];
export const determinism: Linter.Config;
