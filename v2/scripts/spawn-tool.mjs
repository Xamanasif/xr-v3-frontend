// Cross-platform launch of the repository's own tools (dependency-free on purpose).
//
// On Windows the `node_modules/.bin/*` entries and `pnpm` are `.cmd` shims, and Node refuses to
// spawn a `.cmd` without a shell (EINVAL since the CVE-2024-27980 fix). Two ways round it:
//   - `nodeBin`: run a package's own JavaScript bin with this Node — no shim, no shell, and paths
//     with spaces stay intact. The same on every platform.
//   - `pnpmCommand`: pnpm itself has no JavaScript entry we can find portably, so on Windows it runs
//     through the shell — and every argument must be a plain token that needs no quoting, or it is
//     refused rather than passed to the shell.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const WINDOWS = process.platform === 'win32';
const PLAIN_TOKEN = /^[\w@%+=:,./-]+$/;

/** How to run `pnpm <args>` here: `{ command, args, options }` for `spawn` / `spawnSync`. */
export function pnpmCommand(args) {
  if (!WINDOWS) return { command: 'pnpm', args, options: {} };
  for (const arg of args) {
    if (!PLAIN_TOKEN.test(arg)) {
      throw new Error(`pnpm argument ${JSON.stringify(arg)} would need shell quoting on Windows`);
    }
  }
  // One command string (the arguments are plain tokens), so no argument array reaches the shell.
  return { command: ['pnpm', ...args].join(' '), args: [], options: { shell: true } };
}

/** The directory of `packageName` as resolved from `fromDir`. */
function packageDir(fromDir, packageName) {
  const require = createRequire(join(fromDir, 'package.json'));
  try {
    return dirname(require.resolve(`${packageName}/package.json`));
  } catch {
    // The package's `exports` hides package.json: walk up from its main entry instead.
    let dir = dirname(require.resolve(packageName));
    for (;;) {
      try {
        const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
        if (manifest.name === packageName) return dir;
      } catch {
        // no package.json at this level
      }
      const parent = dirname(dir);
      if (parent === dir) throw new Error(`cannot find the package directory of ${packageName}`);
      dir = parent;
    }
  }
}

/** `{ command, args }` running `binName` of `packageName` (resolved from `fromDir`) with this Node. */
export function nodeBin(fromDir, packageName, binName, args = []) {
  const dir = packageDir(fromDir, packageName);
  const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  const bin = typeof manifest.bin === 'string' ? manifest.bin : manifest.bin?.[binName];
  if (!bin) throw new Error(`${packageName} has no bin named ${binName}`);
  return { command: process.execPath, args: [join(dir, bin), ...args] };
}
