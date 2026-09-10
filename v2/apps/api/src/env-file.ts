import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Load the workspace root `.env` (v2/.env) if present, using Node's built-in loader.
 * Variables already present in the process environment are not overridden.
 * Returns the file that was loaded, or null.
 */
export function loadRootEnvFile(): string | null {
  const candidates = [
    resolve(process.cwd(), '.env'),
    resolve(import.meta.dirname, '..', '..', '..', '.env'),
  ];
  for (const file of candidates) {
    if (existsSync(file)) {
      process.loadEnvFile(file);
      return file;
    }
  }
  return null;
}
