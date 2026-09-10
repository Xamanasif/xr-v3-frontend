// ESLint rule `xr/resolved-boundaries` — package boundaries by RESOLVED TARGET.
//
// Every statically analysable import is classified by where it actually lands, not by
// the text of its specifier:
//   import … from "…"   export … from "…"   export * from "…"   import("literal")   import("literal").Type
//
//   relative / absolute path  → resolved against the importing file → the package that
//                               contains the target. Crossing into ANOTHER package's
//                               tree (its src/, its dist/, anything) is always an error:
//                               a package is reached through its public exports only.
//   tsconfig `paths` alias    → expanded from the importing package's tsconfig, then as above.
//   bare workspace specifier  → the target package must be allowed for the importer;
//                               `src/` and `dist/` subpaths are internal; the subpath
//                               must be exposed by the package's `exports` map (checked
//                               statically, so the boundary holds before a build too).
//   bare third-party          → matched against the importer's forbidden patterns.
//   path into node_modules    → classified as the EXTERNAL package it resolves to (from
//                               the last `node_modules` segment of both the written and
//                               the real path — pnpm's `.pnpm` store included — confirmed
//                               by that package's own package.json name), then judged by
//                               the same forbidden patterns as a bare specifier.
//   node: builtins            → always allowed.
// CommonJS `require()` is not analysed: this is an ESM-only workspace.
import { existsSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { dirname, isAbsolute, join, resolve, sep } from 'node:path';

import {
  FORBIDDEN_THIRD_PARTY,
  WORKSPACE_PACKAGES,
  allowedWorkspaceImports,
  matchesPattern,
} from '../boundary-matrix.mjs';

const BUILTINS = new Set(builtinModules);
const workspaces = new Map();

function findWorkspaceRoot(fromDir) {
  let dir = fromDir;
  for (;;) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function safeRealpath(path) {
  try {
    return realpathSync(path);
  } catch {
    return resolve(path);
  }
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

/** `compilerOptions.paths` of a package's tsconfig.json as prefix → absolute target prefixes. */
function readAliases(packageDir) {
  const file = join(packageDir, 'tsconfig.json');
  if (!existsSync(file)) return [];
  const paths = readJson(file).compilerOptions?.paths ?? {};
  return Object.entries(paths)
    .filter(([key]) => key.endsWith('/*'))
    .map(([key, targets]) => ({
      prefix: key.slice(0, -1),
      targets: targets.map((target) => resolve(packageDir, target.replace(/\*$/, ''))),
    }));
}

function loadWorkspace(root) {
  let workspace = workspaces.get(root);
  if (workspace) return workspace;
  const packages = [];
  for (const group of ['apps', 'packages']) {
    const groupDir = join(root, group);
    if (!existsSync(groupDir)) continue;
    for (const entry of readdirSync(groupDir)) {
      const dir = join(groupDir, entry);
      const manifest = join(dir, 'package.json');
      if (!existsSync(manifest)) continue;
      const { name, exports: exportsField } = readJson(manifest);
      packages.push({ name, dir: safeRealpath(dir), aliases: readAliases(dir), exportsField });
    }
  }
  workspace = { root: safeRealpath(root), packages };
  workspaces.set(root, workspace);
  return workspace;
}

function packageOf(absolutePath, workspace) {
  const real = safeRealpath(absolutePath);
  return (
    workspace.packages.find((pkg) => real === pkg.dir || real.startsWith(pkg.dir + sep)) ?? null
  );
}

/**
 * Is `subpath` ('' for the package root) exposed by the package's `exports` map?
 * Static, so the boundary holds whether or not the package has been built.
 * A package without an `exports` field exposes only its root.
 */
export function isPublicExport(exportsField, subpath) {
  const request = subpath ? `./${subpath}` : '.';
  if (exportsField === undefined || exportsField === null) return request === '.';
  if (typeof exportsField === 'string' || Array.isArray(exportsField)) return request === '.';
  const keys = Object.keys(exportsField);
  if (!keys.some((key) => key.startsWith('.'))) return request === '.'; // a conditions object
  for (const key of keys) {
    if (key === request) return true;
    const star = key.indexOf('*');
    if (star === -1) continue;
    const prefix = key.slice(0, star);
    const suffix = key.slice(star + 1);
    if (
      request.length >= prefix.length + suffix.length &&
      request.startsWith(prefix) &&
      request.endsWith(suffix)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * The external package a filesystem path belongs to, from its last `node_modules`
 * segment (exact segment match, never a substring): `…/node_modules/@nestjs/common/x.js`
 * and `…/node_modules/.pnpm/@nestjs+common@12.0.1_…/node_modules/@nestjs/common/x.js`
 * both identify `@nestjs/common`. The identity is confirmed by the package's own
 * package.json `name` when present. `null` when the path is not under node_modules.
 */
export function externalPackageOf(absolutePath) {
  const segments = absolutePath.split(sep);
  const index = segments.lastIndexOf('node_modules');
  if (index === -1) return null;
  const first = segments[index + 1];
  if (!first || first === '.pnpm' || first === '.bin' || first.startsWith('.')) {
    return { name: null, subpath: '', packageRoot: null };
  }
  const nameSegments = first.startsWith('@') ? segments.slice(index + 1, index + 3) : [first];
  if (first.startsWith('@') && nameSegments.length < 2)
    return { name: null, subpath: '', packageRoot: null };
  const packageRoot = segments.slice(0, index + 1 + nameSegments.length).join(sep);
  let name = nameSegments.join('/');
  const manifest = join(packageRoot, 'package.json');
  if (existsSync(manifest)) {
    try {
      const declared = readJson(manifest).name;
      if (typeof declared === 'string' && declared.length > 0) name = declared;
    } catch {
      // unreadable manifest: keep the path-derived identity
    }
  }
  return { name, subpath: segments.slice(index + 1 + nameSegments.length).join('/'), packageRoot };
}

function parseBare(specifier) {
  const match = specifier.startsWith('@')
    ? /^(@[^/]+\/[^/]+)(?:\/(.*))?$/.exec(specifier)
    : /^([^/]+)(?:\/(.*))?$/.exec(specifier);
  return match ? { name: match[1], subpath: match[2] ?? '' } : { name: specifier, subpath: '' };
}

function literalOf(node) {
  if (!node) return null;
  if (node.type === 'Literal' && typeof node.value === 'string') return node.value;
  if (
    node.type === 'TemplateLiteral' &&
    node.expressions.length === 0 &&
    node.quasis.length === 1
  ) {
    return node.quasis[0].value.cooked ?? null;
  }
  return null;
}

export const resolvedBoundariesRule = {
  meta: {
    type: 'problem',
    docs: { description: 'Enforce workspace package boundaries by resolved import target.' },
    schema: [
      {
        type: 'object',
        properties: { packageName: { type: 'string' } },
        required: ['packageName'],
        additionalProperties: false,
      },
    ],
    messages: {
      crossPackageRelative:
        '"{{specifier}}" resolves into {{target}} ({{resolved}}). Reach another package through its public exports, never by path.',
      forbiddenWorkspace: '{{importer}} must not depend on {{target}} (docs/ARCHITECTURE.md §6).',
      internalPath:
        '"{{specifier}}" reaches into the internals of {{target}} (src/ or dist/). Import its public exports.',
      notExported:
        '"{{specifier}}" is not a public export of {{target}} (its package.json `exports` does not expose it); {{importer}} may only use public exports.',
      forbiddenThirdParty:
        '{{importer}} must not import "{{specifier}}" (matches "{{pattern}}", docs/ARCHITECTURE.md §6).',
      outsideWorkspace: '"{{specifier}}" resolves outside the workspace ({{resolved}}).',
      forbiddenExternalPath:
        '"{{specifier}}" resolves into the external package {{package}} ({{resolved}}); {{importer}} must not import it (matches "{{pattern}}", docs/ARCHITECTURE.md §6).',
      unclassifiableExternalPath:
        '"{{specifier}}" resolves into node_modules ({{resolved}}) but no package identity could be determined; import external packages by their bare specifier.',
    },
  },
  create(context) {
    const filename = context.filename;
    if (!isAbsolute(filename)) return {};
    const root = findWorkspaceRoot(dirname(filename));
    if (!root) return {};
    const workspace = loadWorkspace(root);
    const importer = packageOf(filename, workspace);
    if (!importer) return {}; // root tooling (scripts/) is not a package
    const packageName = context.options[0]?.packageName ?? importer.name;
    const allowed = allowedWorkspaceImports(packageName);
    const forbiddenThirdParty = FORBIDDEN_THIRD_PARTY[packageName] ?? [];

    function checkExternal(node, specifier, external, resolved) {
      if (external.name === null) {
        context.report({
          node,
          messageId: 'unclassifiableExternalPath',
          data: { specifier, resolved },
        });
        return;
      }
      const equivalent = external.subpath ? `${external.name}/${external.subpath}` : external.name;
      for (const pattern of forbiddenThirdParty) {
        if (matchesPattern(equivalent, pattern)) {
          context.report({
            node,
            messageId: 'forbiddenExternalPath',
            data: { specifier, package: external.name, resolved, importer: packageName, pattern },
          });
          return;
        }
      }
    }

    function checkPath(node, specifier, absoluteTarget) {
      // Ownership is decided by the REAL path: a workspace package linked into some
      // node_modules resolves back to its source directory; an installed package
      // resolves into pnpm's store; a path that does not exist keeps its written form.
      const resolved = safeRealpath(absoluteTarget);
      const external = externalPackageOf(resolved);
      if (external) {
        const workspaceTarget = external.name
          ? workspace.packages.find((pkg) => pkg.name === external.name)
          : undefined;
        if (workspaceTarget) {
          if (workspaceTarget.name !== importer.name) {
            context.report({
              node,
              messageId: 'crossPackageRelative',
              data: { specifier, target: workspaceTarget.name, resolved },
            });
          }
          return;
        }
        checkExternal(node, specifier, external, resolved);
        return;
      }
      const target = packageOf(resolved, workspace);
      if (target) {
        if (target.name !== importer.name) {
          context.report({
            node,
            messageId: 'crossPackageRelative',
            data: { specifier, target: target.name, resolved },
          });
        }
        return;
      }
      if (!resolved.startsWith(workspace.root + sep)) {
        context.report({ node, messageId: 'outsideWorkspace', data: { specifier, resolved } });
      }
    }

    function check(node, specifier) {
      if (specifier.startsWith('node:') || BUILTINS.has(specifier)) return;

      if (specifier.startsWith('.') || isAbsolute(specifier)) {
        checkPath(node, specifier, resolve(dirname(filename), specifier));
        return;
      }

      for (const alias of importer.aliases) {
        if (specifier.startsWith(alias.prefix)) {
          const rest = specifier.slice(alias.prefix.length);
          for (const target of alias.targets) checkPath(node, specifier, join(target, rest));
          return;
        }
      }

      const { name, subpath } = parseBare(specifier);
      if (WORKSPACE_PACKAGES.includes(name)) {
        if (!allowed.has(name)) {
          context.report({
            node,
            messageId: 'forbiddenWorkspace',
            data: { importer: packageName, target: name },
          });
          return;
        }
        if (/^(src|dist)(\/|$)/.test(subpath)) {
          context.report({ node, messageId: 'internalPath', data: { specifier, target: name } });
          return;
        }
        const targetPackage = workspace.packages.find((pkg) => pkg.name === name);
        if (targetPackage && !isPublicExport(targetPackage.exportsField, subpath)) {
          context.report({
            node,
            messageId: 'notExported',
            data: { specifier, target: name, importer: packageName },
          });
        }
        return;
      }

      for (const pattern of forbiddenThirdParty) {
        if (matchesPattern(specifier, pattern)) {
          context.report({
            node,
            messageId: 'forbiddenThirdParty',
            data: { importer: packageName, specifier, pattern },
          });
          return;
        }
      }
    }

    return {
      ImportDeclaration(node) {
        check(node, node.source.value);
      },
      ExportNamedDeclaration(node) {
        if (node.source) check(node, node.source.value);
      },
      ExportAllDeclaration(node) {
        check(node, node.source.value);
      },
      ImportExpression(node) {
        const specifier = literalOf(node.source);
        if (specifier !== null) check(node, specifier);
      },
      TSImportType(node) {
        // typescript-eslint 8.70 exposes the literal as `source`; `argument` is the deprecated alias.
        const argument = node.source ?? node.argument;
        const specifier =
          argument?.type === 'TSLiteralType' ? literalOf(argument.literal) : literalOf(argument);
        if (specifier !== null) check(node, specifier);
      },
    };
  },
};

export const xrPlugin = {
  meta: { name: 'xr-boundaries', version: '0.0.0' },
  rules: { 'resolved-boundaries': resolvedBoundariesRule },
};
