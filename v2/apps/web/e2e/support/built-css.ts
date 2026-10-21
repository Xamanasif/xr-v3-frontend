/**
 * Static reading of the BUILT product CSS (WP-0.5; ADR-0001; Appendix F risk K-5): the cascade
 * layers each chunk declares, and whether any Tailwind Preflight rule reached the build.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

/**
 * ADR-0001 §3: the only layers, in this order — Tailwind's @property fallback slot `properties`
 * (weakest), then theme < xr.v46 < xr.product < utilities.
 */
export const LAYER_ORDER = ['properties', 'theme', 'xr.v46', 'xr.product', 'utilities'] as const;

/**
 * ADR-0010: a chunk that carries the V3 entry (`@xr/ui/styles-v3.css`, loaded only where a V3
 * surface renders) repeats the statement with `xr.v3` reserved after `xr.product`, then names its
 * nested layers. `xr.v3` is a sublayer of `xr`, so it follows `xr.v46` and `xr.product` and
 * precedes `utilities` whichever chunk loads first.
 */
export const V3_LAYER_ORDER = [
  'properties',
  'theme',
  'xr.v46',
  'xr.product',
  'xr.v3',
  'utilities',
  'xr.v3.rb',
  'xr.v3.xs',
  'xr.v3.sa',
  'xr.v3.ve',
  'xr.v3.cm',
  'xr.v3.rv',
  'xr.v3.ia',
  'xr.v3.fa',
  'xr.v3.patch',
] as const;

// apps/web is not an ES module package: Playwright loads its suites as CommonJS.
const appRoot = join(__dirname, '..', '..');

/** Every CSS file the production build emitted (`.next/static/**`). */
export function builtCssFiles(): string[] {
  const walk = (directory: string): string[] =>
    !existsSync(directory)
      ? []
      : readdirSync(directory).flatMap((entry) => {
          const path = join(directory, entry);
          return statSync(path).isDirectory() ? walk(path) : path.endsWith('.css') ? [path] : [];
        });
  return walk(join(appRoot, '.next', 'static'));
}

const withoutComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Top-level statements and blocks of a stylesheet: `@layer a, b;`, `@layer a{…}`, `p{…}`. */
export function topLevelRules(css: string): { prelude: string; block: boolean }[] {
  const source = withoutComments(css);
  const rules: { prelude: string; block: boolean }[] = [];
  let depth = 0;
  let start = 0;
  let quote: string | null = null;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (char === '\\') index += 1;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") quote = char;
    else if (char === '{') {
      if (depth === 0) rules.push({ prelude: source.slice(start, index).trim(), block: true });
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) start = index + 1;
    } else if (char === ';' && depth === 0) {
      rules.push({ prelude: source.slice(start, index).trim(), block: false });
      start = index + 1;
    }
  }
  return rules.filter((rule) => rule.prelude.length > 0);
}

/**
 * The cascade-layer names in order of first appearance, and the top-level rules that are not
 * `@layer` rules (unlayered CSS beats every layer, so the product has none). `@property`
 * registrations are not style rules and are allowed (Tailwind emits them for some utilities).
 */
export function layerSequence(css: string): { layers: string[]; unlayered: string[] } {
  const layers: string[] = [];
  const unlayered: string[] = [];
  for (const { prelude } of topLevelRules(css)) {
    if (prelude.startsWith('@property ')) continue;
    const match = /^@layer\s+(.+)$/s.exec(prelude);
    if (!match?.[1]) {
      unlayered.push(prelude.slice(0, 80));
      continue;
    }
    for (const name of match[1].split(',').map((part) => part.trim())) {
      if (!layers.includes(name)) layers.push(name);
    }
  }
  return { layers, unlayered };
}

/** `selector{declarations}` pairs at every nesting depth (innermost blocks). */
function innerRules(css: string): { selectors: string; body: string }[] {
  return [...withoutComments(css).matchAll(/([^{};]+)\{([^{}]*)\}/g)].map((match) => ({
    selectors: (match[1] ?? '').trim(),
    body: (match[2] ?? '').trim(),
  }));
}

const normaliseSelector = (selector: string) =>
  selector
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s*([>+~,])\s*/g, '$1')
    .replace(/["']/g, '')
    .replace(/::(before|after|first-line|first-letter)/g, ':$1')
    .replace(/\*(?=[:[.#])/g, '');

const normaliseDeclaration = (declaration: string) =>
  declaration
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s*([:,()/])\s*/g, '$1')
    .replace(/["']/g, '')
    .replace(/--theme\(/g, 'var(');

function signatures(css: string): { selectors: Set<string>; declarations: Set<string> } {
  const selectors = new Set<string>();
  const declarations = new Set<string>();
  for (const rule of innerRules(css)) {
    if (rule.selectors.startsWith('@')) continue;
    for (const selector of normaliseSelector(rule.selectors).split(',')) selectors.add(selector);
    for (const declaration of rule.body.split(';')) {
      if (declaration.includes(':')) declarations.add(normaliseDeclaration(declaration));
    }
  }
  return { selectors, declarations };
}

const appRequire = createRequire(join(appRoot, 'package.json'));

/** Resolves a module as apps/web resolves it. */
export const resolveFromApp = (specifier: string): string => appRequire.resolve(specifier);

/** Tailwind's own Preflight source, as installed for this app. */
export function preflightSource(): string {
  return readFileSync(resolveFromApp('tailwindcss/preflight.css'), 'utf8');
}

/**
 * Preflight's fingerprint: its selectors and declarations that the v46 sheets and the product
 * layer (`allowed`) do not also contain — anything shared with them proves nothing.
 */
export function preflightFingerprint(preflight: string, allowed: string) {
  const own = signatures(preflight);
  const shared = signatures(allowed);
  return {
    selectors: [...own.selectors].filter((selector) => !shared.selectors.has(selector)),
    declarations: [...own.declarations].filter(
      (declaration) => !shared.declarations.has(declaration),
    ),
  };
}

/** The fingerprint selectors and declarations found in `css`. */
export function preflightHits(
  css: string,
  fingerprint: ReturnType<typeof preflightFingerprint>,
): string[] {
  const found = signatures(css);
  return [
    ...fingerprint.selectors.filter((selector) => found.selectors.has(selector)),
    ...fingerprint.declarations.filter((declaration) => found.declarations.has(declaration)),
  ];
}
