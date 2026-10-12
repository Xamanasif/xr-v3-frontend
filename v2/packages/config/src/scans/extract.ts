/**
 * Text extraction for the static scans: what a TypeScript/TSX or CSS file says, split by the
 * kind of text it is, so each scan reads only what it is about (comments are never scanned).
 */
import ts from 'typescript';

import type { CopyKind } from '../../policy/terms.mjs';

export type TextKind = CopyKind | 'identifier' | 'code-attr';

export interface TextItem {
  readonly kind: TextKind;
  readonly text: string;
  readonly line: number;
  /** For attribute values: the JSX attribute name. */
  readonly attribute?: string;
}

export interface Extracted {
  readonly items: readonly TextItem[];
  readonly imports: readonly { readonly specifier: string; readonly line: number }[];
  readonly jsxAttributes: readonly { readonly name: string; readonly line: number }[];
  readonly classTokens: readonly { readonly token: string; readonly line: number }[];
}

/** JSX attributes whose values people read or hear (copy), as opposed to code values. */
export const COPY_ATTRIBUTES = new Set([
  'aria-label',
  'aria-description',
  'aria-roledescription',
  'aria-placeholder',
  'aria-valuetext',
  'title',
  'alt',
  'placeholder',
  'label',
  'heading',
  'description',
  'children',
]);

const CLASS_ATTRIBUTES = new Set(['className', 'class']);

export function extractScript(fileName: string, source: string, copyModule: boolean): Extracted {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const items: TextItem[] = [];
  const imports: { specifier: string; line: number }[] = [];
  const jsxAttributes: { name: string; line: number }[] = [];
  const classTokens: { token: string; line: number }[] = [];
  const lineOf = (node: ts.Node) =>
    sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;

  const enclosingAttribute = (node: ts.Node): string | null => {
    for (let current = node.parent; current; current = current.parent) {
      if (ts.isJsxAttribute(current)) return current.name.getText(sourceFile);
      if (
        ts.isJsxElement(current) ||
        ts.isJsxSelfClosingElement(current) ||
        ts.isJsxFragment(current) ||
        ts.isFunctionLike(current) ||
        ts.isBlock(current) ||
        ts.isSourceFile(current)
      ) {
        return null;
      }
    }
    return null;
  };

  const addText = (node: ts.Node, text: string) => {
    if (!text.trim()) return;
    const attribute = enclosingAttribute(node);
    const line = lineOf(node);
    if (attribute !== null) {
      if (CLASS_ATTRIBUTES.has(attribute)) {
        for (const token of text.split(/\s+/)) if (token) classTokens.push({ token, line });
      }
      items.push({
        kind: COPY_ATTRIBUTES.has(attribute) ? 'copy-attr' : 'code-attr',
        text,
        line,
        attribute,
      });
      return;
    }
    items.push({ kind: copyModule ? 'copy-module-string' : 'string', text, line });
  };

  const visit = (node: ts.Node): void => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      imports.push({ specifier: node.moduleSpecifier.text, line: lineOf(node) });
      if (ts.isImportDeclaration(node) && node.importClause) visit(node.importClause);
      if (ts.isExportDeclaration(node) && node.exportClause) visit(node.exportClause);
      return;
    }
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      imports.push({ specifier: node.arguments[0].text, line: lineOf(node) });
      return;
    }
    if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) {
      const literal = node.argument.literal;
      if (ts.isStringLiteral(literal))
        imports.push({ specifier: literal.text, line: lineOf(node) });
    }
    if (ts.isJsxAttribute(node)) {
      jsxAttributes.push({ name: node.name.getText(sourceFile), line: lineOf(node) });
    }
    if (ts.isIdentifier(node) || ts.isPrivateIdentifier(node)) {
      items.push({ kind: 'identifier', text: node.text, line: lineOf(node) });
    } else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      addText(node, node.text);
    } else if (ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
      addText(node, node.text);
    } else if (ts.isJsxText(node)) {
      const text = node.text.replace(/\s+/g, ' ').trim();
      if (text) items.push({ kind: 'jsx-text', text, line: lineOf(node) });
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return { items, imports, jsxAttributes, classTokens };
}

export interface ExtractedCss {
  /** The stylesheet without comments and without `url(…)` arguments. */
  readonly text: string;
  readonly classTokens: readonly { readonly token: string; readonly line: number }[];
  readonly lineOf: (index: number) => number;
}

export function extractCss(source: string): ExtractedCss {
  const blank = (match: string) => match.replace(/[^\n]/g, ' ');
  const text = source.replace(/\/\*[\s\S]*?\*\//g, blank).replace(/url\([^)]*\)/g, blank);
  const lineOf = (index: number) => text.slice(0, index).split('\n').length;
  const classTokens: { token: string; line: number }[] = [];
  for (const match of text.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) {
    classTokens.push({ token: match[1] ?? '', line: lineOf(match.index ?? 0) });
  }
  return { text, classTokens, lineOf };
}
