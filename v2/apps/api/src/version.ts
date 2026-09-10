import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let cached: string | undefined;

/** The API package version, read from package.json beside `dist/`. */
export function readPackageVersion(): string {
  if (cached === undefined) {
    try {
      const raw = readFileSync(join(import.meta.dirname, '..', 'package.json'), 'utf8');
      cached = (JSON.parse(raw) as { version?: string }).version ?? '0.0.0';
    } catch {
      cached = '0.0.0';
    }
  }
  return cached;
}
