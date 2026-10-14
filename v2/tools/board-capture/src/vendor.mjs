// The approved capture inputs (owner authorisation G-5c, WP-0.15) and their integrity checks.
//
// The three scripts are checked against the sha384 SRI values written in the frozen
// `runtime/support.js` itself, read at run time — never against a copy of those values. A
// mismatch throws: the harness never serves bytes that fail the check (no bypass).
// The fonts carry pinned SHA-256 values recorded in PROVENANCE.md when they were fetched.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SUPPORT_JS, VENDOR_ROOT } from './paths.mjs';

/** The scripts `support.js` loads, by the names of its URL/SRI constants. */
export const VENDORED_SCRIPTS = [
  { name: 'REACT', file: 'unpkg.com/react@18.3.1/umd/react.production.min.js' },
  { name: 'REACT_DOM', file: 'unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js' },
  { name: 'BABEL', file: 'unpkg.com/@babel/standalone@7.29.0/babel.min.js' },
];

/** The boards' Google Fonts request (every v46 board and the product root layout use it). */
export const GOOGLE_FONTS_CSS_URL =
  'https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap';

/**
 * The Google Fonts response for that request (fetched with the harness Chromium's user agent) and
 * the three Public Sans v21 woff2 subsets it names. SHA-256 pinned at fetch time (PROVENANCE.md).
 */
export const VENDORED_FONTS = [
  {
    url: GOOGLE_FONTS_CSS_URL,
    file: 'fonts.googleapis.com/css2-public-sans-wght-400-500-600-700-swap.css',
    contentType: 'text/css; charset=utf-8',
    sha256: 'cd0787639340132a9f7d9b1e10ca9e409a7f945cfa7600f19617d8a8a9912bc6',
  },
  {
    url: 'https://fonts.gstatic.com/s/publicsans/v21/ijwRs572Xtc6ZYQws9YVwnNGfJ7QwOk1.woff2',
    file: 'fonts.gstatic.com/s/publicsans/v21/ijwRs572Xtc6ZYQws9YVwnNGfJ7QwOk1.woff2',
    contentType: 'font/woff2',
    sha256: 'c1b6da516e0062e9c2f341b3a51dd2d621d946da72f06c6cfe05fd9d2dd8622d',
  },
  {
    url: 'https://fonts.gstatic.com/s/publicsans/v21/ijwRs572Xtc6ZYQws9YVwnNIfJ7QwOk1Fig.woff2',
    file: 'fonts.gstatic.com/s/publicsans/v21/ijwRs572Xtc6ZYQws9YVwnNIfJ7QwOk1Fig.woff2',
    contentType: 'font/woff2',
    sha256: '1c8a26c0ed4312dacc36670714794c9f4b4a0972ccb45f2936646bd8d444d5f8',
  },
  {
    url: 'https://fonts.gstatic.com/s/publicsans/v21/ijwRs572Xtc6ZYQws9YVwnNJfJ7QwOk1Fig.woff2',
    file: 'fonts.gstatic.com/s/publicsans/v21/ijwRs572Xtc6ZYQws9YVwnNJfJ7QwOk1Fig.woff2',
    contentType: 'font/woff2',
    sha256: 'e43b193880fdb1d6adf494192bcdf77b008cafe910b0cb07d44d46a564d1cdae',
  },
];

/** `var <NAME>_URL = "…"; var <NAME>_SRI = "sha384-…";` as written in the frozen support.js. */
export function supportJsConstants(text = readFileSync(SUPPORT_JS, 'utf8')) {
  const constants = new Map();
  for (const { name } of VENDORED_SCRIPTS) {
    const url = new RegExp(`var ${name}_URL = "([^"]+)";`).exec(text)?.[1];
    const sri = new RegExp(`var ${name}_SRI = "(sha384-[A-Za-z0-9+/=]+)";`).exec(text)?.[1];
    if (!url || !sri) throw new Error(`support.js has no ${name}_URL / ${name}_SRI constant`);
    constants.set(name, { url, sri });
  }
  return constants;
}

const sha384 = (bytes) => `sha384-${createHash('sha384').update(bytes).digest('base64')}`;
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

/**
 * Checks every vendored input and returns the URL → response table the network layer serves.
 * Throws on the first failure: a script whose sha384 differs from support.js's SRI, a script
 * whose vendored path does not match support.js's URL, or a font whose SHA-256 is not the pinned one.
 */
export function verifiedVendor() {
  const constants = supportJsConstants();
  /** @type {Map<string, {body: Buffer, contentType: string, file: string, integrity: string}>} */
  const responses = new Map();
  const checks = [];
  for (const { name, file } of VENDORED_SCRIPTS) {
    const { url, sri } = constants.get(name);
    if (`https://${file}` !== url) {
      throw new Error(`vendored ${file} is not the file support.js loads (${url})`);
    }
    const body = readFileSync(join(VENDOR_ROOT, file));
    const actual = sha384(body);
    if (actual !== sri) {
      throw new Error(
        `SRI MISMATCH — STOP. ${file}: ${actual} ≠ support.js ${name}_SRI ${sri}. Never bypass this check.`,
      );
    }
    responses.set(url, {
      body,
      contentType: 'application/javascript; charset=utf-8',
      file,
      integrity: actual,
    });
    checks.push({ kind: 'script', file, url, expected: sri, actual, ok: true });
  }
  for (const { url, file, contentType, sha256: pinned } of VENDORED_FONTS) {
    const body = readFileSync(join(VENDOR_ROOT, file));
    const actual = sha256(body);
    if (actual !== pinned) {
      throw new Error(`font input ${file} changed: sha256 ${actual} ≠ pinned ${pinned}`);
    }
    responses.set(url, { body, contentType, file, integrity: `sha256-${actual}` });
    checks.push({ kind: 'font', file, url, expected: pinned, actual, ok: true });
  }
  return { responses, checks };
}
