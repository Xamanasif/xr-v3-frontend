/* ============================================================
   PROTOTYPE-ONLY QA HARNESS — not part of the product.

   Loads the state layer (utils · data · ai-assist · state) outside a
   browser so the invariants can be exercised programmatically. It ships
   nothing to the product: index.html does not reference this file, and
   nothing in js/ knows it exists.

   Run with macOS JavaScriptCore from the prototype folder:

     /System/Library/Frameworks/JavaScriptCore.framework/Versions/A/\
       Helpers/jsc qa/harness.js qa/checks.js

   ⚠ BOTH FILES ARE ARGUMENTS, and there is no `--` between them. With a
   `--` this jsc runs the harness ALONE: it loads the state layer, prints
   NOTHING and exits 0 — a silent false green that reads exactly like a
   passing run. Confirm the literal `ALL CHECKS PASSED — N assertions`
   line before believing the suite passed.

   `window`, `localStorage` and `console` are the only browser surfaces
   the state layer touches; they are shimmed here and nowhere else.
   ============================================================ */

var window = this;
var console = {
  log: function () { print(Array.prototype.join.call(arguments, ' ')); },
  warn: function () { print('WARN ' + Array.prototype.join.call(arguments, ' ')); },
  error: function () { print('ERROR ' + Array.prototype.join.call(arguments, ' ')); }
};

var __store = {};
var localStorage = {
  getItem: function (k) { return Object.prototype.hasOwnProperty.call(__store, k) ? __store[k] : null; },
  setItem: function (k, v) { __store[k] = String(v); },
  removeItem: function (k) { delete __store[k]; },
  clear: function () { __store = {}; }
};

/* Implementation 09 adds three FIRST-PARTY, DOM-FREE modules that the
   suite now exercises directly: the CSV parser, the spreadsheet
   reader/writer, and the Question Bank importer. None of them touches
   `document`; each one's only browser dependency is `Blob`, and only
   inside its `download()` helper, which no check calls. */
function loadState() {
  ['js/utils.js', 'js/data.js', 'js/ai-assist.js', 'js/state.js',
   'js/csv.js', 'js/xlsx.js', 'js/question-import.js'].forEach(function (f) {
    (new Function(readFile(f))).call(window);
  });
}
loadState();

/* --- tiny assertion kit --- */
var PASS = 0, FAIL = 0, GROUP = '';
function group(name) { GROUP = name; print('\n── ' + name + ' ' + Array(Math.max(2, 62 - name.length)).join('─')); }
function ok(cond, label, detail) {
  if (cond) { PASS += 1; print('  PASS  ' + label); }
  else { FAIL += 1; print('  FAIL  ' + label + (detail ? '\n        → ' + detail : '')); }
  return !!cond;
}
function eq(actual, expected, label) {
  return ok(actual === expected, label, 'expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
}
function summary() {
  print('\n' + Array(64).join('='));
  print(FAIL === 0 ? 'ALL CHECKS PASSED — ' + PASS + ' assertions'
                   : FAIL + ' FAILED of ' + (PASS + FAIL) + ' assertions');
  print(Array(64).join('='));
  return FAIL;
}

/* Reset to the deterministic seed between scenarios. */
function fresh() {
  localStorage.clear();
  loadState();
  return XRSLP.state;
}
