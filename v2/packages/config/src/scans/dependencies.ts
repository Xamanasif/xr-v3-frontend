/**
 * The UI-kit deny-list (owner constraint; ADR-0001 §5; Appendix E §11 item 3; Appendix F §7.6):
 * no workspace package may depend on a listed kit, directly or through the lockfile.
 */
import { DENIED_UI_DEPENDENCIES } from '../../policy/terms.mjs';
import { matchesPattern } from '../../eslint/boundaries.mjs';

export interface DeniedDependencyFinding {
  readonly where: string;
  readonly dependency: string;
  readonly kit: string;
}

const SECTIONS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

export function deniedKit(name: string): string | null {
  return DENIED_UI_DEPENDENCIES.find((entry) => matchesPattern(name, entry.pattern))?.kit ?? null;
}

/** Denied kits declared by one package manifest. */
export function deniedInManifest(
  where: string,
  manifest: Record<string, unknown>,
): DeniedDependencyFinding[] {
  const findings: DeniedDependencyFinding[] = [];
  for (const section of SECTIONS) {
    for (const dependency of Object.keys((manifest[section] as Record<string, string>) ?? {})) {
      const kit = deniedKit(dependency);
      if (kit) findings.push({ where: `${where} ${section}`, dependency, kit });
    }
  }
  return findings;
}

/**
 * Package names in every `packages:` section of the lockfile. pnpm 12 writes two YAML
 * documents (its own install lock, then the workspace), each with a `packages:` section.
 */
export function lockfilePackageNames(lockfile: string): string[] {
  const names: string[] = [];
  for (const document of lockfile.split(/^---\s*$/m)) {
    const section = document.split(/^packages:\s*$/m)[1]?.split(/^\S/m)[0] ?? '';
    for (const match of section.matchAll(/^ {2}'?((?:@[^/@\s]+\/)?[^@\s':]+)@/gm)) {
      names.push(match[1] ?? '');
    }
  }
  return names;
}

/** Denied kits anywhere in the resolved graph (`packages:` keys of pnpm-lock.yaml). */
export function deniedInLockfile(lockfile: string): DeniedDependencyFinding[] {
  const findings: DeniedDependencyFinding[] = [];
  for (const name of new Set(lockfilePackageNames(lockfile))) {
    const kit = deniedKit(name);
    if (kit) findings.push({ where: 'pnpm-lock.yaml', dependency: name, kit });
  }
  return findings;
}

/**
 * Every package (name only) reachable from the given lockfile importers: their dependencies
 * and devDependencies, the dependencies of the workspace packages they link to, and everything
 * those resolve to transitively (pnpm lockfile v9 `importers:` and `snapshots:` sections).
 */
export function reachablePackages(lockfile: string, roots: readonly string[]): Set<string> {
  const importers = new Map<string, { name: string; version: string; dev: boolean }[]>();
  const snapshots = new Map<string, string[]>();
  for (const document of lockfile.split(/^---\s*$/m)) {
    const importerSection = document.split(/^importers:\s*$/m)[1]?.split(/^\S/m)[0] ?? '';
    let importer = '';
    let section = '';
    let dependency = '';
    for (const line of importerSection.split('\n')) {
      const importerMatch = /^ {2}(\S[^:]*):\s*$/.exec(line);
      const sectionMatch = /^ {4}(\w+):\s*$/.exec(line);
      const dependencyMatch = /^ {6}'?([^':]+)'?:\s*$/.exec(line);
      const versionMatch = /^ {8}version: (\S+)/.exec(line);
      if (importerMatch) {
        importer = importerMatch[1] ?? '';
        importers.set(importer, []);
      } else if (sectionMatch) section = sectionMatch[1] ?? '';
      else if (dependencyMatch) dependency = dependencyMatch[1] ?? '';
      else if (versionMatch && importer && dependency) {
        importers.get(importer)?.push({
          name: dependency,
          version: versionMatch[1] ?? '',
          dev: section === 'devDependencies',
        });
      }
    }
    const snapshotSection = document.split(/^snapshots:\s*$/m)[1]?.split(/^\S/m)[0] ?? '';
    let key = '';
    for (const line of snapshotSection.split('\n')) {
      const keyMatch = /^ {2}(?! )'?(.+?)'?:(?: \{\})?\s*$/.exec(line);
      const dependencyMatch = /^ {6}'?([^':]+)'?: (\S+)/.exec(line);
      if (keyMatch) {
        key = keyMatch[1] ?? '';
        snapshots.set(key, []);
      } else if (dependencyMatch && key) {
        snapshots.get(key)?.push(`${dependencyMatch[1]}@${dependencyMatch[2]}`);
      }
    }
  }

  const names = new Set<string>();
  const seen = new Set<string>();
  const queue: string[] = [];
  const visitImporter = (path: string, includeDev: boolean) => {
    if (seen.has(`importer:${path}`)) return;
    seen.add(`importer:${path}`);
    for (const entry of importers.get(path) ?? []) {
      if (entry.dev && !includeDev) continue;
      if (entry.version.startsWith('link:')) {
        const linked = posixJoin(path, entry.version.slice('link:'.length));
        visitImporter(linked, false);
        continue;
      }
      names.add(entry.name);
      queue.push(`${entry.name}@${entry.version}`);
    }
  };
  for (const root of roots) visitImporter(root, true);
  while (queue.length > 0) {
    const key = queue.pop() ?? '';
    if (seen.has(key)) continue;
    seen.add(key);
    for (const dependency of snapshots.get(key) ?? []) {
      names.add(dependency.slice(0, dependency.indexOf('@', 1)));
      queue.push(dependency);
    }
  }
  return names;
}

function posixJoin(base: string, relativePath: string): string {
  const parts = base === '.' ? [] : base.split('/');
  for (const part of relativePath.split('/')) {
    if (part === '..') parts.pop();
    else if (part && part !== '.') parts.push(part);
  }
  return parts.join('/') || '.';
}

/** Number of package entries (name@version) in the lockfile's `packages:` sections. */
export function lockfilePackageCount(lockfile: string): number {
  return lockfilePackageNames(lockfile).length;
}
