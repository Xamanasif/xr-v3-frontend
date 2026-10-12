// Generates src/icons/registry.ts — the typed icon registry of @xr/ui (Appendix E §3.1 Icon;
// Appendix F §3.4, WP-0.6). Every path is copied verbatim from the frozen boards; nothing is
// hand-drawn.
//
// - Named icons: board 02 "Icon sizing and working icon set" (`icons = [[label, path], …]`, 48).
// - Every other static `svg.xr-ico` path drawn on the 128 boards (32 more) is kept too, under a
//   name taken from where the boards use it (USE_NAMES below). Generation fails if a drawn path
//   has no name, or if a name points at a path no board draws.
// - Format glyphs: the 16 px `span.xr-fmt > svg` paths for WEB, AR, VR and MR (board 04 and every
//   board that draws a format chip); generation fails if a code is drawn with two paths.
//
// Inputs (read only): design/handoff-v46/canvas-v46/project/*.dc.html. Run
// `pnpm --filter @xr/ui generate:icons` only after an owner-approved handoff change; the drift
// test (src/icons/registry.test.ts) fails whenever the committed file and the boards disagree.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

const packageRoot = join(import.meta.dirname, '..');
export const BOARDS_DIRECTORY = join(
  packageRoot,
  '..',
  '..',
  '..',
  'design',
  'handoff-v46',
  'canvas-v46',
  'project',
);
export const OUTPUT = join(packageRoot, 'src', 'icons', 'registry.ts');

/**
 * Names for the drawn paths board 02 does not list, chosen from their use on the boards (the most
 * frequent use first). The path is the identity; the name is only how code asks for it.
 */
export const USE_NAMES = {
  chevronDown: 'M6 9.5l6 6 6-6', // account-menu and select chevron (03, 05, 07, 08, …)
  warning: 'M12 3.5 2.5 20h19zM12 10v4.5M12 17.5h.01', // xr-notice--warn
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2', // waiting rows and steps
  quote: 'M7 7h4v4c0 2.5-1.2 4.2-3.5 5M14 7h4v4c0 2.5-1.2 4.2-3.5 5', // xv-reason-head
  fileText:
    'M8 3h7.5L20 7.5V20a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM15 3v5h5M10 13h7M10 17h5', // xv-file
  tryAgain: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7', // "Try again" buttons
  checklist:
    'M9 6h11M9 12h11M9 18h11M4 5.5l1.2 1.2L7.5 4.5M4 11.5l1.2 1.2 2.3-2.2M4 17.5l1.2 1.2 2.3-2.2', // xp-sel "Selection"
  assist: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6', // "Draft with assistance"
  chevronLeft: 'M15 6l-6 6 6 6', // xr-back
  chevronRight: 'M9 6l6 6-6 6', // "Next area", row chevrons
  chevronUp: 'M6 14.5l6-6 6 6', // move up (xa-order)
  question:
    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4.5M12 17.5h.01', // xr-row-icon--info (B7)
  person: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20a7.5 7.5 0 0 1 15 0', // "Giving access to …"
  download: 'M12 4v11M7.5 10.5 12 15l4.5-4.5M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5', // "Export CSV"
  headset:
    'M3 10.5A2.5 2.5 0 0 1 5.5 8h13a2.5 2.5 0 0 1 2.5 2.5v4a2.5 2.5 0 0 1-2.5 2.5h-3l-2-2.5h-3l-2 2.5h-3A2.5 2.5 0 0 1 3 14.5z', // xl-dev-ico
  monitor: 'M4 6h16v10H4zM9 20h6M12 16v4M10 9.5l4 1.5-4 1.5z', // "Needs a laptop or desktop"
  arrowUp: 'M12 19V5M6.5 10.5 12 5l5.5 5.5', // xg-icobtn move up
  arrowDown: 'M12 5v14M6.5 13.5 12 19l5.5-5.5', // xg-icobtn move down
  delete: 'M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13M10.5 11v5M13.5 11v5', // xg-del "Delete"
  send: 'M4 12 20 4l-5 16-3.5-6.5zM11.5 13.5 20 4', // "Submit request"
  calendar: 'M4 6h16v14H4zM4 10h16M8 3.5v4M16 3.5v4', // date rows
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z', // rail "Operations"
  play: 'M8 5.5v13l10-6.5z', // "Open preview"
  remove: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3', // "Remove …"
  stopped: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5V12M9 15h6', // xr-row-icon--err (B7)
  link: 'M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1', // resource rows (B3-01)
  table: 'M5 4h14v16H5zM5 9h14M5 14h14M10 9v11', // resource rows (B3-01)
  payment: 'M3 6.5h18v11H3zM3 10h18M7 14.5h4', // "Continue to payment"
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', // xl-open preview
  flag: 'M5 21V4M5 4h12l-2 4 2 4H5', // xr-row-icon--ok (B2-10)
  image: 'M4 5h16v14H4zM4 16l4.5-4.5 3.5 3.5 2.5-2.5L20 18M15.5 9.5h.01', // screenshot (07)
  graduation: 'M3 8.5 12 4l9 4.5-9 4.5zM7 10.5V15c1.5 1.5 3 2 5 2s3.5-.5 5-2v-4.5M21 8.5V14', // "No courses yet"
};

/**
 * Paths the boards draw only from their scripts (state-dependent icons), never as a static
 * `svg.xr-ico`. Each must appear verbatim in the named boards' source.
 */
export const SCRIPT_NAMES = {
  expandMenu: { path: 'M4 5h16v14H4zM9.5 5v14M14 10l2 2-2 2', boards: ['05', '11'] }, // rail "Expand menu"
};

/** "Students · People" → "studentsPeople"; "Read-only" → "readOnly". */
export function nameFor(label) {
  const words = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ');
  return words
    .map((word, index) => (index === 0 ? word : word[0].toUpperCase() + word.slice(1)))
    .join('');
}

/** Board files, sorted. */
export function readBoards(directory = BOARDS_DIRECTORY) {
  return readdirSync(directory)
    .filter((file) => file.endsWith('.dc.html'))
    .sort()
    .map((file) => ({ file, html: readFileSync(join(directory, file), 'utf8') }));
}

/** Board 02's named icon set, in board order. */
export function boardTwoIcons(boards) {
  const board = boards.find((entry) => entry.file.startsWith('02-'));
  if (!board) throw new Error('board 02 not found');
  const start = board.html.indexOf('icons = [');
  const end = board.html.indexOf('].map(', start);
  if (start < 0 || end < 0) throw new Error('board 02 has no `icons = [...].map(…)` list');
  return [...board.html.slice(start, end).matchAll(/\[\s*'([^']+)'\s*,\s*'([^']+)'\s*\]/g)].map(
    ([, label, path]) => ({ label, path }),
  );
}

/** Every static path inside an `svg.xr-ico`, with how often and on how many boards it is drawn. */
export function drawnIconPaths(boards) {
  const drawn = new Map();
  for (const { file, html } of boards) {
    for (const match of html.matchAll(/<svg([^>]*)>(.*?)<\/svg>/gs)) {
      if (!/class="[^"]*\bxr-ico\b/.test(match[1])) continue;
      for (const [, path] of match[2].matchAll(/<path[^>]*\sd="([^"{}]+)"/g)) {
        const entry = drawn.get(path) ?? { uses: 0, boards: new Set() };
        entry.uses += 1;
        entry.boards.add(file);
        drawn.set(path, entry);
      }
    }
  }
  return drawn;
}

/** The format glyph each format code is drawn with (`span.xr-fmt > svg` + code text). */
export function formatGlyphs(boards) {
  const glyphs = new Map();
  for (const { html } of boards) {
    for (const [, path, code] of html.matchAll(
      /<span class="xr-fmt[^"]*"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="([^"{}]+)"><\/path><\/svg>(WEB|AR|VR|MR)<\/span>/g,
    )) {
      const known = glyphs.get(code);
      if (known && known !== path) throw new Error(`${code} is drawn with two glyphs`);
      glyphs.set(code, path);
    }
  }
  for (const code of ['WEB', 'AR', 'VR', 'MR']) {
    if (!glyphs.has(code)) throw new Error(`no drawn glyph for ${code}`);
  }
  return glyphs;
}

/**
 * One object entry, broken the way Prettier breaks it (printWidth 100): a line that is too long
 * breaks after the key, unless the key is shorter than tabWidth + 3 (5) characters.
 */
function entry(key, value) {
  const line = `  ${key}: '${value}',`;
  return line.length <= 100 || key.length < 5 ? [line] : [`  ${key}:`, `    '${value}',`];
}

/** The generated module source, formatted as Prettier formats it. */
export function renderIconRegistry(boards) {
  const named = boardTwoIcons(boards);
  const drawn = drawnIconPaths(boards);
  const icons = new Map();
  const labels = new Map();
  for (const { label, path } of named) {
    const name = nameFor(label);
    if (icons.has(name)) throw new Error(`two board-02 icons are named ${name}`);
    icons.set(name, path);
    labels.set(name, label);
  }
  const namedPaths = new Set(icons.values());
  for (const [name, path] of Object.entries(USE_NAMES)) {
    if (icons.has(name)) throw new Error(`${name} is already a board-02 name`);
    if (namedPaths.has(path)) throw new Error(`${name} repeats a board-02 path`);
    if (!drawn.has(path)) throw new Error(`${name}: no board draws ${path}`);
    icons.set(name, path);
  }
  for (const [name, { path, boards: codes }] of Object.entries(SCRIPT_NAMES)) {
    if (icons.has(name) || [...icons.values()].includes(path)) throw new Error(`${name} repeats`);
    for (const code of codes) {
      const board = boards.find((entry) => entry.file.startsWith(`${code}-`));
      if (!board?.html.includes(path))
        throw new Error(`${name}: board ${code} does not draw ${path}`);
    }
    icons.set(name, path);
  }
  const unnamed = [...drawn.keys()].filter((path) => ![...icons.values()].includes(path));
  if (unnamed.length > 0) throw new Error(`drawn paths without a name: ${unnamed.join(' | ')}`);
  const glyphs = formatGlyphs(boards);

  const lines = [
    '/**',
    ' * GENERATED by scripts/generate-icon-registry.mjs from the frozen boards — do not edit by hand.',
    ' *',
    ` * ${named.length} icons named on board 02 "Icon sizing and working icon set", then`,
    ` * ${icons.size - named.length} more paths the boards draw (statically or from their scripts), named from their`,
    ' * use. Every path is verbatim; no icon is hand-drawn. Drift test: src/icons/registry.test.ts.',
    ' */',
    '',
    '/** 24 × 24 line icons (`svg.xr-ico`, stroke drawn by xr-foundation.css). */',
    'export const ICON_PATHS = {',
  ];
  for (const [name, path] of icons) lines.push(...entry(name, path));
  lines.push('} as const;', '', 'export type IconName = keyof typeof ICON_PATHS;', '');
  lines.push(
    '/** The board-02 label of each named icon (its accessible name where an icon-only control needs one). */',
    'export const BOARD_TWO_LABELS: Readonly<Partial<Record<IconName, string>>> = {',
  );
  for (const [name, label] of labels) lines.push(...entry(name, label.replaceAll("'", "\\'")));
  lines.push('};', '');
  lines.push(
    '/** 16 × 16 format glyphs drawn inside `span.xr-fmt` (WEB · AR · VR · MR). */',
    'export const FORMAT_GLYPH_PATHS = {',
  );
  for (const code of ['WEB', 'AR', 'VR', 'MR']) lines.push(...entry(code, glyphs.get(code)));
  lines.push('} as const;', '', 'export type FormatCode = keyof typeof FORMAT_GLYPH_PATHS;', '');
  return lines.join('\n');
}

if (process.argv[1] && import.meta.filename === process.argv[1]) {
  writeFileSync(OUTPUT, renderIconRegistry(readBoards()));
  process.stdout.write(`wrote ${OUTPUT}\n`);
}
