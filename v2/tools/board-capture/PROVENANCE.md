# Board-capture inputs — provenance (WP-0.15)

Fetched once on **14 Oct 2026** (≈04:56 UTC) under the owner's WP-0.15 authorisation of gate
**G-5c** ("Downloading the exact specified versions of React 18.3.1, ReactDOM 18.3.1, Babel
Standalone 7.29.0 and the required Public Sans woff2 files for the local visual-capture tooling
only"), recorded as the **local WP-0.15 interim for VD-18** (same machine, same browser; the
runner decision stays open). Downloaded with `curl` into an empty scratch folder, checked, then
copied here. Nothing else was downloaded. These files are used **only** by the test-only capture
harness (`src/network.mjs` fulfils the boards' — and the product pages' — requests with them in
Playwright); they never enter a product package or bundle.

`vendor/` mirrors the request URLs. `vendor/SHA256SUMS.txt` covers every file (8/8);
`pnpm verify` re-checks it and the SRI values on every run (`@xr/config` repository scans).

## Scripts — checked against the frozen `design/handoff-v46/runtime/support.js`

`support.js` (69,150 bytes, SHA-256 `8fe7df74…28cbe`, runtime/README.md) loads three scripts with
`integrity` + `crossOrigin="anonymous"`. Each download's SHA-384 equals the SRI string written in
that file — **3/3 match**; had any differed, work would have stopped (no bypass exists in the
harness: `src/vendor.mjs` throws).

| File (`vendor/…`)                                            | Source URL (support.js constant) | Bytes     | SHA-384 (= SRI in support.js)                                                               | SHA-256          | Served `last-modified` |
| ------------------------------------------------------------ | -------------------------------- | --------- | ------------------------------------------------------------------------------------------- | ---------------- | ---------------------- |
| `unpkg.com/react@18.3.1/umd/react.production.min.js`         | `REACT_URL`                      | 10,751    | `sha384-DGyLxAyjq0f9SPpVevD6IgztCFlnMF6oW/XQGmfe+IsZ8TqEiDrcHkMLKI6fiB/Z` (`REACT_SRI`)     | `d949f1c3…c4dd`  | 26 Aug 2026            |
| `unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js` | `REACT_DOM_URL`                  | 131,835   | `sha384-gTGxhz21lVGYNMcdJOyq01Edg0jhn/c22nsx0kyqP0TxaV5WVdsSH1fSDUf5YJj1` (`REACT_DOM_SRI`) | `35f4f974…66f0d` | 13 Aug 2026            |
| `unpkg.com/@babel/standalone@7.29.0/babel.min.js`            | `BABEL_URL`                      | 3,137,752 | `sha384-m08KidiNqLdpJqLq95G/LEi8Qvjl/xUYll3QILypMoQ65QorJ9Lvtp2RXYGBFj1y` (`BABEL_SRI`)     | `2623a9e2…dcea0` | 28 Jul 2026            |

Licences: React and ReactDOM — MIT; each file opens with its `@license React` banner ("Copyright
(c) Facebook, Inc. and its affiliates … licensed under the MIT license"). Babel standalone — MIT
(the babel/babel repository licence; the minified file carries no licence banner of its own).

## Fonts — Public Sans, as the boards and the product request it

Every v46 board and both app root layouts load
`https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap`
(B8-07; PF-09 note). That CSS was fetched with the user agent of the harness Chromium
(`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)
HeadlessChrome/153.0.8010.12 Safari/537.36`); it names three woff2 subsets of the Public Sans v21
variable font (each declared for weights 400, 500, 600 and 700), which were fetched from
`fonts.gstatic.com`. The CSS is served verbatim, so board and product resolve the same
`@font-face` rules to the same three files.

| File (`vendor/…`)                                                              | Subset (unicode-range)                   | Bytes  | SHA-256          |
| ------------------------------------------------------------------------------ | ---------------------------------------- | ------ | ---------------- |
| `fonts.googleapis.com/css2-public-sans-wght-400-500-600-700-swap.css`          | the CSS response (12 `@font-face` rules) | 5,136  | `cd078763…12bc6` |
| `fonts.gstatic.com/s/publicsans/v21/ijwRs572Xtc6ZYQws9YVwnNGfJ7QwOk1.woff2`    | latin                                    | 26,636 | `c1b6da51…8622d` |
| `fonts.gstatic.com/s/publicsans/v21/ijwRs572Xtc6ZYQws9YVwnNIfJ7QwOk1Fig.woff2` | latin-ext                                | 18,372 | `1c8a26c0…d5f8`  |
| `fonts.gstatic.com/s/publicsans/v21/ijwRs572Xtc6ZYQws9YVwnNJfJ7QwOk1Fig.woff2` | vietnamese                               | 7,576  | `e43b1938…1cdae` |

Full hashes: `vendor/SHA256SUMS.txt`. Served `last-modified`: 15 Sep 2025 (all three woff2).

**Licence.** Read from each font's own `name` table: copyright (ID 0) "Copyright 2015 The Public
Sans Project Authors (https://github.com/uswds/public-sans)"; licence (ID 14) "SIL Open Font
License, Version 1.1: https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL_web; USWDS
Modified Version: https://github.com/uswds/public-sans/blob/master/LICENSE.md"; version 2.001.
`vendor/fonts.gstatic.com/s/publicsans/OFL.txt` carries that copyright line and the standard
SIL Open Font License 1.1 text (copied from a local OFL 1.1 copy; no extra download), as the OFL
requires when the font files are redistributed. Public Sans is a working font only (START-HERE
binding constraint 12), never the official brand typeface.

**Production font loading is unchanged** (PF-09 still loads the boards' Google Fonts link). The
capture harness proves board and product render with byte-identical font files by fulfilling
that same request in both; no demonstrated need to self-host in production arose.
