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
export const PRODUCT_CLASS_ALLOW_LIST: readonly string[];
export const V3_PRODUCT_CLASS_ALLOW_LIST: readonly string[];
export const POLICY_WORD_TERMS: readonly CopyTerm[];
export const PUBLISH_CONTROL_TERM: CopyTerm;
export const DENIED_UI_DEPENDENCIES: readonly DeniedDependency[];
export interface DomTermException {
  readonly term: string;
  readonly text: string;
  readonly where: string;
  readonly evidence: string;
  readonly removal: string;
}
export const RECORDED_DOM_TERM_EXCEPTIONS: readonly DomTermException[];
