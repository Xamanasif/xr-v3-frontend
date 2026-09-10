// Dependency-graph development runner (dependency-free on purpose).
//
// ONE compiler for the whole TypeScript graph: `tsc -b --watch` over a solution of
// project references (every shared package plus the API), with `noEmitOnError` and
// `composite` on every project. The runner parses the compiler's summary lines and:
//   - starts or restarts the API only after the ENTIRE graph reports zero errors;
//   - stops the API as soon as any project in the graph has an error — a type error in a
//     shared package emits nothing new (noEmitOnError) and takes the server down until
//     the graph is clean again, so no stale process ever serves broken sources;
//   - restarts the API when a successful shared-package change is compiled;
//   - optionally runs `next dev`, which reads the same freshly emitted package output;
//   - cleans up every child on SIGINT / SIGTERM.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/** Parse a `tsc --watch` summary line: "Found N errors. Watching for file changes." */
export function parseTscSummary(line) {
  const match = /Found (\d+) errors?\. Watching for file changes/.exec(line);
  return match ? { errors: Number(match[1]) } : null;
}

export function localBin(packageDir, name) {
  const candidate = join(packageDir, 'node_modules', '.bin', name);
  return existsSync(candidate) ? candidate : name;
}

/**
 * @param {object} options
 * @param {string} options.workspaceRoot   directory containing tsconfig.solution.json / node_modules/.bin
 * @param {string} options.solution        tsconfig passed to `tsc -b`
 * @param {{ root: string, entry: string }} options.api   API package dir and compiled entry point
 * @param {{ root: string, port: number } | null} [options.web]   Next.js app to run alongside (optional)
 * @param {(message: string) => void} [options.log]
 */
export function runGraphDev({
  workspaceRoot,
  solution,
  api,
  web = null,
  log = (m) => console.log(`[dev] ${m}`),
}) {
  let server = null;
  let webServer = null;
  let graphClean = false;
  let restartTimer = null;
  let stopping = false;

  const kill = (child) =>
    new Promise((done) => {
      if (!child || child.exitCode !== null || child.signalCode !== null) return done();
      const force = setTimeout(() => child.kill('SIGKILL'), 3_000);
      child.once('exit', () => {
        clearTimeout(force);
        done();
      });
      child.kill('SIGTERM');
    });

  async function stopServer(reason) {
    if (!server) return;
    const child = server;
    server = null;
    log(`stopping API (${reason})`);
    await kill(child);
  }

  async function startServer(reason) {
    await stopServer('restart');
    if (stopping || !graphClean) return;
    if (!existsSync(api.entry)) {
      log(`${api.entry} is missing; waiting for the compiler`);
      return;
    }
    log(`starting API (${reason})`);
    server = spawn(process.execPath, ['--enable-source-maps', api.entry], {
      stdio: 'inherit',
      cwd: api.root,
    });
    server.on('exit', (code, signal) => {
      if (server === null || stopping) return;
      server = null;
      log(`API exited (${signal ?? code}); it restarts on the next clean compile`);
    });
  }

  function scheduleRestart(reason) {
    clearTimeout(restartTimer);
    restartTimer = setTimeout(() => void startServer(reason), 300);
  }

  const compiler = spawn(
    localBin(workspaceRoot, 'tsc'),
    ['-b', '--watch', '--preserveWatchOutput', '--pretty', 'false', solution],
    { cwd: workspaceRoot, stdio: ['ignore', 'pipe', 'inherit'] },
  );
  let pending = '';
  compiler.stdout.on('data', (chunk) => {
    process.stdout.write(chunk);
    pending += chunk.toString();
    const lines = pending.split('\n');
    pending = lines.pop() ?? '';
    for (const line of lines) {
      const summary = parseTscSummary(line);
      if (!summary) continue;
      if (summary.errors === 0) {
        graphClean = true;
        scheduleRestart('graph compiled cleanly');
      } else {
        graphClean = false;
        clearTimeout(restartTimer);
        log(
          `${summary.errors} error(s) in the compile graph: the API stays down until every project compiles`,
        );
        void stopServer('compile errors');
      }
    }
  });
  compiler.on('exit', (code) => {
    if (!stopping) {
      log(`tsc exited with code ${code}`);
      void shutdown(code ?? 1);
    }
  });

  if (web) {
    webServer = spawn(localBin(web.root, 'next'), ['dev', '-p', String(web.port)], {
      stdio: 'inherit',
      cwd: web.root,
    });
    webServer.on('exit', (code, signal) => {
      if (stopping) return;
      log(`next dev exited (${signal ?? code})`);
    });
  }

  async function shutdown(code = 0) {
    if (stopping) return;
    stopping = true;
    clearTimeout(restartTimer);
    await Promise.all([kill(compiler), kill(server), kill(webServer)]);
    process.exit(code);
  }
  process.on('SIGINT', () => void shutdown(0));
  process.on('SIGTERM', () => void shutdown(0));
  return { shutdown };
}
