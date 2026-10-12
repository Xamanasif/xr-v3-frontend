export type TermScope = 'code' | 'copy' | 'identifier' | 'dom';
export type CopyKind = 'jsx-text' | 'copy-attr' | 'string' | 'copy-module-string';

export interface ScopedTerm {
  readonly id: string;
  readonly pattern: RegExp;
  readonly scope: readonly TermScope[];
  readonly evidence: string;
}

export interface CopyTerm {
  readonly id: string;
  readonly pattern: RegExp;
  /** Copy kinds the term applies to; all copy kinds when absent. */
  readonly kinds?: readonly CopyKind[];
  readonly evidence: string;
}

export interface DeniedDependency {
  readonly pattern: string;
  readonly kit: string;
}

export const DEVELOPER_SURFACE_TERMS: readonly ScopedTerm[];
export const CANVAS_TERMS: readonly ScopedTerm[];
export const CANVAS_CLASS_PATTERNS: readonly RegExp[];
export const SLICE1_TERMS: readonly ScopedTerm[];
export const POLICY_WORD_TERMS: readonly CopyTerm[];
export const PUBLISH_CONTROL_TERM: CopyTerm;
export const DENIED_UI_DEPENDENCIES: readonly DeniedDependency[];
