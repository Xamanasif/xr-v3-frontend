export function parseTscSummary(line: string): { errors: number } | null;
export function localBin(packageDir: string, name: string): string;
export function runGraphDev(options: {
  workspaceRoot: string;
  solution: string;
  api: { root: string; entry: string };
  web?: { root: string; port: number } | null;
  log?: (message: string) => void;
}): { shutdown: (code?: number) => Promise<void> };
