/**
 * Test support: read-only access to the documents the draft contracts are checked against — the
 * frozen v46 boards (`design/handoff-v46/`, never written), the committed audit appendices and
 * `flows.json` — and to this package's own sources. Excluded from the build (`tsconfig.build.json`).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/** `v2/packages/contracts`. */
export const PACKAGE = fileURLToPath(new URL('../..', import.meta.url));
export const SRC = join(PACKAGE, 'src');
export const V2 = join(PACKAGE, '..', '..');
const REPOSITORY = join(V2, '..');
const PROJECT = join(REPOSITORY, 'design', 'handoff-v46', 'canvas-v46', 'project');
const AUDIT = join(V2, 'docs', 'v46', 'audit');

const unescape = (text: string) =>
  text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');

const boards = new Map<string, string>();

/** The text of a frozen board by its code (`B2-07`, `08`), entities decoded. */
export function boardText(code: string): string {
  const cached = boards.get(code);
  if (cached !== undefined) return cached;
  const file = readdirSync(PROJECT).find(
    (name) => name.startsWith(`${code}-`) && name.endsWith('.dc.html'),
  );
  if (!file) throw new Error(`No frozen board ${code} in ${PROJECT}`);
  const text = unescape(readFileSync(join(PROJECT, file), 'utf8'));
  boards.set(code, text);
  return text;
}

/**
 * The parts of a message that must appear verbatim on its board: the text split at its
 * `{placeholders}` (a value from the record is drawn as a sample value), parts of 3+ characters.
 */
export function drawnParts(text: string): readonly string[] {
  return text
    .split(/\{[a-zA-Z]+\}/)
    .map((part) => part)
    .filter((part) => part.trim().length >= 3);
}

/** The parts of `text` its board does not draw (empty when every part is drawn verbatim). */
export function missingOnBoard(text: string, board: string): readonly string[] {
  const page = boardText(board);
  return drawnParts(text).filter((part) => !page.includes(part));
}

export function appendix(name: 'C' | 'D' | 'F'): string {
  const file = readdirSync(AUDIT).find((entry) => entry.startsWith(`Appendix-${name}-`));
  if (!file) throw new Error(`No Appendix ${name} in ${AUDIT}`);
  return readFileSync(join(AUDIT, file), 'utf8');
}

/** The method names of each interface in a TypeScript block, in order (brace depth 1, paren depth 0). */
function methodsOf(body: string): string[] {
  const text = body.replace(/\/\/.*$/gm, '');
  const names: string[] = [];
  let braces = 0;
  let parens = 0;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]!;
    if (char === '{') braces += 1;
    else if (char === '}') braces -= 1;
    else if (char === '(') {
      if (braces === 0 && parens === 0) {
        const name = /([A-Za-z_]\w*)\s*$/.exec(text.slice(0, index));
        if (name) names.push(name[1]!);
      }
      parens += 1;
    } else if (char === ')') parens -= 1;
  }
  return names;
}

/** `interface Name { … }` blocks of Appendix C §3, by name, with their methods in order. */
export function appendixCInterfaces(): ReadonlyMap<string, readonly string[]> {
  const text = appendix('C');
  const section = text.slice(
    text.indexOf('## 3. Mock service contracts'),
    text.indexOf('## 4. Sample-world requirements'),
  );
  const found = new Map<string, readonly string[]>();
  const opening = /export interface (\w+) \{/g;
  for (let match = opening.exec(section); match; match = opening.exec(section)) {
    let depth = 1;
    let index = match.index + match[0].length;
    while (depth > 0 && index < section.length) {
      if (section[index] === '{') depth += 1;
      else if (section[index] === '}') depth -= 1;
      index += 1;
    }
    found.set(match[1]!, methodsOf(section.slice(match.index + match[0].length, index - 1)));
  }
  return found;
}

export interface FlowStep {
  readonly flow: string;
  readonly step: string;
  readonly screens: string;
  readonly evidenceBoards: string;
}

/** The 27 traced steps of `handoff/flows.json`. */
export function flowSteps(): readonly FlowStep[] {
  const file = join(PROJECT, 'handoff', 'flows.json');
  return (JSON.parse(readFileSync(file, 'utf8')) as { steps: FlowStep[] }).steps;
}

/** This package's source files under `dir` (relative to `src`), tests excluded unless asked. */
export function sourceFiles(dir: string, options: { tests?: boolean } = {}): readonly string[] {
  const walk = (path: string): string[] =>
    readdirSync(path).flatMap((name) => {
      const full = join(path, name);
      if (statSync(full).isDirectory()) return walk(full);
      if (!name.endsWith('.ts')) return [];
      return options.tests || !name.endsWith('.test.ts') ? [full] : [];
    });
  return walk(join(SRC, dir)).sort();
}

export const relativeToSrc = (file: string) => relative(SRC, file);

export const readSource = (file: string) => readFileSync(file, 'utf8');

/** The relative module specifiers a source file imports or re-exports (type-only included). */
export function importsOf(
  text: string,
): readonly { readonly specifier: string; readonly typeOnly: boolean }[] {
  const found: { specifier: string; typeOnly: boolean }[] = [];
  const pattern = /(?:^|\n)\s*(import|export)\s+(type\s+)?(?:[^'";]*?\sfrom\s+)?['"]([^'"]+)['"]/g;
  for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
    found.push({ specifier: match[3]!, typeOnly: Boolean(match[2]) });
  }
  const dynamic = /import\(\s*['"]([^'"]+)['"]\s*\)/g;
  for (let match = dynamic.exec(text); match; match = dynamic.exec(text)) {
    found.push({ specifier: match[1]!, typeOnly: false });
  }
  return found;
}
