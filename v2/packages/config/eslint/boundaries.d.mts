import type { ESLint, Linter, Rule } from 'eslint';

export type WorkspacePackage =
  | '@xr/domain'
  | '@xr/validation'
  | '@xr/contracts'
  | '@xr/config'
  | '@xr/database'
  | '@xr/testing'
  | '@xr/ui'
  | '@xr/api'
  | '@xr/sample-platform'
  | '@xr/web'
  | '@xr/specimens';

export const ALLOWED_WORKSPACE_DEPENDENCIES: Readonly<
  Record<WorkspacePackage, readonly WorkspacePackage[]>
>;
export const TOOLING_WORKSPACE_DEPENDENCIES: readonly WorkspacePackage[];
export const WORKSPACE_PACKAGES: readonly WorkspacePackage[];
export const FORBIDDEN_THIRD_PARTY: Readonly<Record<WorkspacePackage, readonly string[]>>;
export function allowedWorkspaceImports(name: WorkspacePackage): Set<WorkspacePackage>;
export function runtimeWorkspaceDependencies(name: WorkspacePackage): WorkspacePackage[];
export function matchesPattern(specifier: string, pattern: string): boolean;
export function externalPackageOf(
  absolutePath: string,
): { name: string | null; subpath: string; packageRoot: string | null } | null;
export function isPublicExport(exportsField: unknown, subpath: string): boolean;
export const resolvedBoundariesRule: Rule.RuleModule;
export const xrPlugin: ESLint.Plugin;
export function boundaries(packageName: WorkspacePackage): Linter.Config;
