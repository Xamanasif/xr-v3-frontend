export declare const FOUNDATION_ID: string;
export declare const REFERENCE_ROOT: string;
export declare const FOUNDATION_LOCK: string;
export declare const SOURCE_DIRECTORY: string;
export declare const OUTPUT: string;
export declare const SHEETS: readonly string[];
export declare const ROOT_CLASSES: readonly string[];
export declare const SCOPE_PREFIX: string;
export declare const ISLAND_ATTRIBUTE: string;
export declare const ISLAND_EXCLUSION: string;
export declare function splitTopLevel(text: string, separator: string): string[];
export declare function namesRoot(compound: string): boolean;
export declare function scopeComplexSelector(raw: string): string;
export declare function scopeSelectorList(prelude: string): string;
export declare function scopeStylesheet(
  css: string,
  keepRule?: (prelude: string) => boolean,
): string;
export declare function readInputs(): { sheet: string; sha256: string; css: string }[];
export declare function renderScopedCss(
  inputs: readonly { readonly sheet: string; readonly sha256: string; readonly css: string }[],
): string;
export interface RoleSheet {
  readonly role: string;
  readonly directory: string;
  readonly sheet: string;
  readonly output: string;
}
export declare const ROLE_SHEETS: readonly RoleSheet[];
export declare function readRoleInput(
  role: RoleSheet,
): RoleSheet & { readonly sha256: string; readonly css: string };
export declare function renderRoleCss(
  input: RoleSheet & { readonly sha256: string; readonly css: string },
): string;
export declare function previewOnlyRule(role: RoleSheet, prelude: string): boolean;
