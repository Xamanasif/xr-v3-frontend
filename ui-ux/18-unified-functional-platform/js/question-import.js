/* ============================================================
   Unified Functional Platform — FACULTY QUESTION BANK IMPORT.

   Reads a `.csv` or `.xlsx` file of questions, validates every row
   against the SAME rules the Add-a-question form enforces, shows the
   Faculty member exactly what will happen, and writes nothing until
   they confirm.

   ── THE SHAPE OF THE FLOW, AND WHY ───────────────────────────
     Question Bank → Import questions → choose the Course /
     Experiment → choose the file → parse → preview → confirm.

   THE CONTEXT IS CHOSEN BEFORE THE FILE AND NEVER READ FROM IT.
   A spreadsheet row cannot name its own Experiment. If it could, a
   file could file a question against an Experiment its author holds
   no mapping for, and a Faculty member's scope would be decided by
   whoever wrote the spreadsheet. The Experiment list offered here is
   `state.facultyExperimentIds()` and nothing else, and `commit()`
   re-checks it at write time rather than trusting the value the
   screen passed back.

   ALL-OR-NOTHING, like the Student import in `js/csv.js`. If any row
   carries a blocking error the file is not committed at all, so a
   Question Bank can never end up half-imported and needing to be
   reconciled by hand — and there is no per-question delete-and-retry
   that would leave an assessment holding a copy of a question that
   was never meant to exist.

   ── PROVENANCE ───────────────────────────────────────────────
   An imported question is stored with `origin: 'import-csv'` or
   `'import-xlsx'`. It is NEVER stored as `'ai'`: a person wrote it,
   and the Question Bank's authorship label must say so.
   ============================================================ */

window.XRSLP = window.XRSLP || {};

XRSLP.questionImport = (function () {
  'use strict';

  var util = XRSLP.util;

  /* ---------- the column contract ----------
     One stable schema, documented in QUESTION_IMPORT_TEMPLATE.md and
     emitted by `templateRows()` below, so the file a Faculty member
     downloads is generated from THIS array and can never drift from
     what the validator expects. */
  var COLUMNS = [
    { key: 'type',        label: 'question_type',  required: true,
      aliases: ['question_type', 'question type', 'type'] },
    { key: 'text',        label: 'question',       required: true,
      aliases: ['question', 'question_text', 'question text'] },
    { key: 'optionA',     label: 'option_a',       required: false, aliases: ['option_a', 'option a'] },
    { key: 'optionB',     label: 'option_b',       required: false, aliases: ['option_b', 'option b'] },
    { key: 'optionC',     label: 'option_c',       required: false, aliases: ['option_c', 'option c'] },
    { key: 'optionD',     label: 'option_d',       required: false, aliases: ['option_d', 'option d'] },
    { key: 'answer',      label: 'correct_answer', required: false,
      aliases: ['correct_answer', 'correct answer', 'answer'] },
    { key: 'marks',       label: 'marks',          required: true,
      aliases: ['marks', 'mark', 'points'] },
    { key: 'explanation', label: 'explanation',    required: false,
      aliases: ['explanation', 'rationale'] }
  ];
  var OPTION_KEYS = ['optionA', 'optionB', 'optionC', 'optionD'];
  var OPTION_LETTERS = ['a', 'b', 'c', 'd'];

  /* The file's type words map onto the product's ACTUAL question
     types and nothing else. `state.QUESTION_TYPES` is the authority;
     these are the spellings a spreadsheet uses for them. No type is
     invented here — a fourth product type in this table would be a
     question type the Question Bank cannot store. */
  var TYPE_WORDS = {
    'multiple_choice': 'mcq', 'multiple choice': 'mcq', 'mcq': 'mcq',
    'multiplechoice': 'mcq', 'multi_choice': 'mcq',
    'true_false': 'tf', 'true false': 'tf', 'true/false': 'tf',
    'truefalse': 'tf', 'tf': 'tf', 'boolean': 'tf',
    'descriptive': 'descriptive', 'long_answer': 'descriptive',
    'long answer': 'descriptive', 'written': 'descriptive', 'essay': 'descriptive'
  };
  /* The words a validation MESSAGE offers: the canonical spelling of
     each product type, not all fourteen accepted variants. An error
     message is guidance, not a reference table. */
  function typeWordList() { return ['multiple_choice', 'true_false', 'descriptive']; }

  var TRUE_WORDS = ['true', 't', 'yes', 'y', '1'];
  var FALSE_WORDS = ['false', 'f', 'no', 'n', '0'];

  /* Bounds that stop a malformed or oversized file from reaching the
     bank. `MAX_ROWS` is a REFUSAL, not a truncation: silently
     importing the first 500 rows of a 5000-row file is exactly the
     failure this exists to prevent. */
  var MAX_ROWS = 500;
  var MAX_TEXT = 2000;
  var MAX_OPTION = 600;
  var MAX_EXPLANATION = 2000;

  function norm(v) { return String(v == null ? '' : v).trim(); }
  function key(v) { return norm(v).toLowerCase().replace(/\s+/g, ' '); }
  function headerKey(v) { return key(v).replace(/[\s_]+/g, '_'); }

  function matchColumn(headerText) {
    var h = headerKey(headerText);
    for (var i = 0; i < COLUMNS.length; i++) {
      for (var j = 0; j < COLUMNS[i].aliases.length; j++) {
        if (headerKey(COLUMNS[i].aliases[j]) === h) { return COLUMNS[i].key; }
      }
    }
    return null;
  }

  /* ============================================================
     PARSING — one table, from either format.

     CSV goes through `XRSLP.csv.parse`, which is first-party and
     already handles quoting, embedded newlines, escaped quotes, CRLF
     and Excel's BOM. XLSX goes through `XRSLP.xlsx`, which is also
     first-party — see the header of `js/xlsx.js` for why no
     third-party parser was added.
     ============================================================ */
  /* ⚠ THE RAW TABLE, WITH BLANK ROWS LEFT IN PLACE.
     Both parsers can drop empty rows, and for the student import that
     is right. Here it is not: this validator reports a row number the
     faculty member has to find in their own spreadsheet, and a
     compacted table shifts every number after the first blank line.
     The blank rows are skipped by the loop below instead, so the number
     shown is the number the spreadsheet shows. */
  function parseFile(kind, payload) {
    if (kind === 'xlsx') {
      var res = XRSLP.xlsx.read(payload);
      if (!res.ok) { return { ok: false, rows: [], error: res.error, sheetName: null }; }
      return { ok: true, rows: XRSLP.xlsx.rowsOfRaw(res), error: null,
               sheetName: res.sheets[0] ? res.sheets[0].name : null };
    }
    return { ok: true, rows: XRSLP.csv.parseRows(payload), error: null, sheetName: null };
  }
  /* The CSV module's own, rather than a second copy of it that has to
     be kept in step by hand. It takes any array of cells, so it reads a
     worksheet row as happily as a CSV one. */
  function isBlankRow(r) { return XRSLP.csv.isBlankRow(r); }

  /* Which format a file NAME claims to be. The extension is checked
     before anything is read, and the XLSX reader checks the leading
     bytes again — so a `.xlsx` that is really a CSV is caught by the
     second check and named, rather than silently mis-parsed. */
  function kindOfFile(name) {
    var n = String(name || '').toLowerCase();
    if (/\.xlsx$/.test(n)) { return 'xlsx'; }
    if (/\.csv$/.test(n)) { return 'csv'; }
    if (/\.xls$/.test(n)) { return 'xls'; }
    return null;
  }
  function originFor(kind) { return kind === 'xlsx' ? 'import-xlsx' : 'import-csv'; }

  /* ============================================================
     VALIDATION.

     Returns:
       { ok, fatal, headerErrors[], rows[], errors[], warnings[],
         validCount, invalidCount, duplicateCount, columns{},
         headerRow[], experimentId, kind, sheetName }

     `errors` block the import. `warnings` never do — a duplicate is
     reported and left for the Faculty member to decide about, because
     nothing in the product establishes that a repeated question is a
     mistake, and silently dropping or merging one would be a
     behaviour no source asked for.
     ============================================================ */
  function validate(kind, payload, opts) {
    opts = opts || {};
    var state = XRSLP.state;
    var out = {
      ok: false, fatal: null, headerErrors: [], rows: [], errors: [], warnings: [],
      validCount: 0, invalidCount: 0, duplicateCount: 0,
      columns: {}, headerRow: [], experimentId: opts.experimentId || null,
      kind: kind, sheetName: null
    };

    /* ── SCOPE FIRST. Before a single row is read. ────────────── */
    var facultyId = opts.facultyPersonId;
    var allowed = facultyId ? state.facultyExperimentIds(facultyId) : [];
    if (!out.experimentId) {
      out.fatal = 'Choose the course and experiment these questions belong to before choosing a file.';
      return out;
    }
    if (allowed.indexOf(out.experimentId) === -1) {
      out.fatal = 'That experiment is not mapped to you, so questions cannot be filed against it.';
      return out;
    }

    var parsed = parseFile(kind, payload);
    if (!parsed.ok) { out.fatal = parsed.error; return out; }
    out.sheetName = parsed.sheetName;
    var table = parsed.rows;
    if (!table.length || table.every(isBlankRow)) {
      out.fatal = 'The file is empty — no header row and no question rows were found.';
      return out;
    }

    /* ---- header ----
       The first row that is not blank. A file that opens with an empty
       line still has a header; refusing it would be a rule nobody
       expects, and silently renumbering around it is the defect above. */
    var headerAt = 0;
    while (headerAt < table.length && isBlankRow(table[headerAt])) { headerAt += 1; }
    var header = table[headerAt];
    out.headerRow = header.slice();
    out.headerRowNo = headerAt + 1;
    var index = {};
    header.forEach(function (h, i) {
      var k = matchColumn(h);
      if (k && index[k] == null) { index[k] = i; }
    });
    out.columns = index;
    /* ⚠ A COLUMN NOBODY RECOGNISED IS NOT NOTHING.
       Only MISSING REQUIRED columns were reported, so a header cell the
       matcher did not know — `optionB` instead of `option_b`, say — was
       discarded in silence, and with it every value in that column. An
       answer option or every explanation in the file could vanish with
       no error, no warning and nothing on screen to notice.

       It is a WARNING rather than an error: a spreadsheet people
       actually work in legitimately carries extra columns (a topic, a
       chapter, a note to themselves), and refusing those would make the
       import useless for real files. What matters is that the ignored
       columns are NAMED, so a mistyped one is visible. */
    var ignored = [];
    header.forEach(function (h, i) {
      var text = norm(h);
      if (!text) { return; }
      if (matchColumn(h)) { return; }
      ignored.push(text);
    });
    out.ignoredColumns = ignored;
    if (ignored.length) {
      out.warnings.push({ rowNo: headerAt + 1,
        message: 'These columns are not part of the import and everything in them is ignored: ' +
          ignored.join(', ') + '. Check none of them is a mistyped column name.' });
    }
    COLUMNS.forEach(function (col) {
      if (col.required && index[col.key] == null) {
        out.headerErrors.push('Required column "' + col.label + '" is missing from the header row.');
      }
    });
    if (out.headerErrors.length) {
      out.fatal = 'The header row does not match the import template. ' +
        'Download the template to see the columns this import expects.';
      return out;
    }
    /* An MCQ needs somewhere to keep its options. This is a
       HEADER-level fact, not a row error: a file of nothing but
       descriptive questions legitimately carries no option column. */
    var optionCols = OPTION_KEYS.filter(function (k) { return index[k] != null; }).length;

    var body = table.slice(headerAt + 1);
    var filled = body.filter(function (r) { return !isBlankRow(r); });
    if (!filled.length) {
      out.fatal = 'The file contains a header row but no question rows.';
      return out;
    }
    if (filled.length > MAX_ROWS) {
      out.fatal = 'This file has ' + filled.length + ' question rows. This import takes at most ' +
        MAX_ROWS + ' at a time, so split the file and import it in parts.';
      return out;
    }

    /* Existing bank items for THIS experiment, for duplicate
       detection. Keyed on the normalised question text AND the type:
       one sentence asked as a true/false and again as a descriptive
       is two different questions, not a duplicate. */
    var existing = {};
    (facultyId ? state.questionsForFaculty(facultyId) : []).forEach(function (q) {
      if (q.experimentId !== out.experimentId) { return; }
      existing[q.type + '|' + key(q.text)] = q;
    });
    var seenInFile = {};

    body.forEach(function (cells, n) {
      /* THE ROW NUMBER THE SPREADSHEET SHOWS. Counted from the header's
         own position and NOT from a compacted index, so a blank line
         anywhere in the file does not shift every number after it. */
      var rowNo = headerAt + 2 + n;
      if (isBlankRow(cells)) { return; }
      function cell(k) {
        var i = index[k];
        return i == null ? '' : norm(cells[i]);
      }
      var rec = {
        rowNo: rowNo,
        rawType: cell('type'),
        type: null,
        text: cell('text'),
        options: [],
        optionCells: OPTION_KEYS.map(function (k) { return cell(k); }),
        rawAnswer: cell('answer'),
        answer: null,
        rawMarks: cell('marks'),
        points: null,
        explanation: cell('explanation'),
        errors: [], warnings: [], duplicate: null
      };
      function err(field, message, fix) {
        rec.errors.push({ field: field, message: message, fix: fix || '' });
      }
      function warn(message) { rec.warnings.push(message); }

      /* ---- type ---- */
      var t = TYPE_WORDS[headerKey(rec.rawType)] || TYPE_WORDS[key(rec.rawType)];
      if (!rec.rawType) {
        err('question_type', 'The question type is missing.',
          'Enter one of: ' + typeWordList().join(', ') + '.');
      } else if (!t) {
        err('question_type', '"' + rec.rawType + '" is not a question type this platform supports.',
          'Use one of: ' + typeWordList().join(', ') + '.');
      } else {
        rec.type = t;
      }

      /* ---- question text ---- */
      if (!rec.text) {
        err('question', 'The question text is missing.', 'Enter the question a student will read.');
      } else if (rec.text.length > MAX_TEXT) {
        err('question', 'The question text is ' + rec.text.length + ' characters long.',
          'Shorten it to ' + MAX_TEXT + ' characters or fewer.');
      }

      /* ---- marks ----
         The SAME rule the Add-a-question form enforces
         (`state.validateQuestion`): a whole number from 1 to 100. It
         is restated rather than shared because a message about a
         spreadsheet cell has to name the cell and the value in it. */
      if (!rec.rawMarks) {
        err('marks', 'Marks are missing.', 'Enter a whole number between 1 and 100.');
      } else {
        var m = Number(rec.rawMarks);
        if (rec.rawMarks !== '' && (isNaN(m) || !isFinite(m))) {
          err('marks', '"' + rec.rawMarks + '" is not a number.',
            'Enter a whole number between 1 and 100.');
        } else if (Math.round(m) !== m) {
          err('marks', 'Marks must be a whole number, and "' + rec.rawMarks + '" is not.',
            'Enter a whole number between 1 and 100.');
        } else if (m < 1 || m > 100) {
          err('marks', 'Marks must be between 1 and 100, and "' + rec.rawMarks + '" is outside that range.',
            'Enter a whole number between 1 and 100.');
        } else {
          rec.points = m;
        }
      }

      /* ---- explanation ---- */
      if (rec.explanation.length > MAX_EXPLANATION) {
        err('explanation', 'The explanation is ' + rec.explanation.length + ' characters long.',
          'Shorten it to ' + MAX_EXPLANATION + ' characters or fewer.');
      }

      /* ---- per-type shape ---- */
      if (rec.type === 'mcq') {
        if (!optionCols) {
          err('option_a', 'This row is a multiple-choice question, but the file has no option columns.',
            'Add option_a and option_b columns, or change the question type.');
        }
        var filled = [], letters = [];
        rec.optionCells.forEach(function (v, i) {
          if (v) { filled.push(v); letters.push(OPTION_LETTERS[i]); }
          if (v.length > MAX_OPTION) {
            err('option_' + OPTION_LETTERS[i], 'Option ' + OPTION_LETTERS[i].toUpperCase() +
              ' is ' + v.length + ' characters long.',
              'Shorten it to ' + MAX_OPTION + ' characters or fewer.');
          }
        });
        rec.options = filled;
        if (filled.length < 2) {
          err('option_a', 'A multiple-choice question needs at least two answer options, and this row has ' +
            filled.length + '.', 'Fill in option_a and option_b.');
        }
        if (!rec.rawAnswer) {
          err('correct_answer', 'The correct answer is missing.',
            'Enter the letter of the correct option: ' + (letters.join(', ') || 'a, b, c or d') + '.');
        } else {
          /* Accept the LETTER (a/b/c/d, any case, with or without a
             trailing dot or bracket) or the option TEXT itself, which
             is what somebody who typed the answer out rather than the
             letter will have written. */
          var raw = key(rec.rawAnswer).replace(/[).\s]+$/, '');
          var at = OPTION_LETTERS.indexOf(raw);
          if (at === -1) {
            for (var oi = 0; oi < rec.optionCells.length; oi++) {
              if (rec.optionCells[oi] && key(rec.optionCells[oi]) === key(rec.rawAnswer)) { at = oi; break; }
            }
          }
          if (at === -1) {
            err('correct_answer', '"' + rec.rawAnswer + '" does not name one of this row’s options.',
              'Enter the letter of the correct option: ' + (letters.join(', ') || 'a, b, c or d') + '.');
          } else if (!rec.optionCells[at]) {
            err('correct_answer', 'The correct answer points at option ' +
              OPTION_LETTERS[at].toUpperCase() + ', which is empty.',
              'Fill in option ' + OPTION_LETTERS[at].toUpperCase() +
              ', or point the answer at an option that has text in it.');
          } else {
            /* The stored answer is an INDEX INTO THE KEPT OPTIONS, and
               blank option columns are dropped. Reading the letter
               against the raw columns and only then dropping blanks is
               exactly how an answer key slides silently onto the wrong
               option — the defect `state.mcqShape` exists to prevent.
               The index is therefore re-mapped here, once, and
               `commit()` hands the RAW cells back so the state layer
               does the same mapping from the same starting point. */
            rec.answer = letters.indexOf(OPTION_LETTERS[at]);
          }
        }
      } else if (rec.type === 'tf') {
        if (!rec.rawAnswer) {
          err('correct_answer', 'The correct answer is missing.', 'Enter TRUE or FALSE.');
        } else {
          var a = key(rec.rawAnswer);
          if (TRUE_WORDS.indexOf(a) !== -1) { rec.answer = true; }
          else if (FALSE_WORDS.indexOf(a) !== -1) { rec.answer = false; }
          else {
            err('correct_answer', '"' + rec.rawAnswer + '" is not TRUE or FALSE.', 'Enter TRUE or FALSE.');
          }
        }
        rec.optionCells.forEach(function (v, i) {
          if (v) {
            warn('Option ' + OPTION_LETTERS[i].toUpperCase() +
              ' is ignored, because a true/false question has no answer options.');
          }
        });
      } else if (rec.type === 'descriptive') {
        /* ⚠ NOT AN ERROR. A descriptive question has no answer key, so
           a value in the correct_answer column is a marking note in
           the wrong column — something to point out, not a reason to
           refuse the whole file. */
        if (rec.rawAnswer) {
          warn('The correct answer is ignored, because a descriptive question is marked by a faculty ' +
            'member and has no answer key.');
        }
        rec.optionCells.forEach(function (v, i) {
          if (v) {
            warn('Option ' + OPTION_LETTERS[i].toUpperCase() +
              ' is ignored, because a descriptive question has no answer options.');
          }
        });
      }

      /* ---- duplicates ----
         ⚠ FLAGGED, NEVER RESOLVED. Nothing in the product says a
         repeated question is a mistake, so nothing here deletes,
         merges or skips one. The Faculty member is told and decides. */
      if (rec.type && rec.text) {
        var dk = rec.type + '|' + key(rec.text);
        if (existing[dk]) {
          rec.duplicate = 'bank';
          warn('An identical question is already in your Question Bank for this experiment. ' +
            'Importing adds a second copy.');
        } else if (seenInFile[dk]) {
          rec.duplicate = 'file';
          warn('This row repeats row ' + seenInFile[dk] + ' of this file. Importing adds both copies.');
        } else {
          seenInFile[dk] = rowNo;
        }
      }

      out.rows.push(rec);
      if (rec.errors.length) { out.invalidCount += 1; } else { out.validCount += 1; }
      if (rec.duplicate) { out.duplicateCount += 1; }
      rec.errors.forEach(function (e) {
        out.errors.push({ rowNo: rowNo, field: e.field, message: e.message, fix: e.fix });
      });
      rec.warnings.forEach(function (w) { out.warnings.push({ rowNo: rowNo, message: w }); });
    });

    out.ok = out.errors.length === 0 && out.validCount > 0;
    return out;
  }

  /* The index into the RAW four option cells that `addQuestion`
     expects, recovered from the compacted index validation produced. */
  function mcqRawIndex(rec) {
    if (rec.answer === null || rec.answer === undefined) { return -1; }
    var seen = -1;
    for (var i = 0; i < rec.optionCells.length; i++) {
      if (rec.optionCells[i]) {
        seen += 1;
        if (seen === rec.answer) { return i; }
      }
    }
    return -1;
  }

  /* ============================================================
     COMMIT — the only writer, and it writes through `addQuestion`.

     ⚠ IT RE-VALIDATES EVERYTHING. The screen already refuses to offer
     a commit for a result that is not `ok`, and the confirmation
     dialog names the count — but a commit that trusted the result
     object handed to it would be a commit that trusts whatever the
     caller says. The scope is checked again, the result is checked
     again, and every row still goes through `state.addQuestion`,
     which runs `validateQuestion` a second time and carries the
     deactivated-institution guard. Nothing here touches `S.questions`.
     ============================================================ */
  function commit(result, tenantId, facultyPersonId) {
    var state = XRSLP.state;
    var out = { created: 0, questions: [], refused: [] };
    if (!result || !result.ok || !result.experimentId) { return out; }
    if (state.facultyExperimentIds(facultyPersonId).indexOf(result.experimentId) === -1) { return out; }
    /* ⚠ THE INSTITUTION COMES FROM THE PERSON, NOT FROM THE CALLER.
       This re-checked the EXPERIMENT and then passed `tenantId` straight
       through to `addQuestion`, which files the question against
       whatever institution it is given. A caller that passed another
       tenant's id would have written one institution's questions into
       another's bank — and the two faculty members involved could both
       be legitimately mapped to the same platform Experiment, so the
       experiment check alone would not have caught it. The argument is
       now a cross-check, not the source of truth. */
    var person = state.personById(facultyPersonId);
    if (!person || person.role !== 'faculty') { return out; }
    if (tenantId && tenantId !== person.tenantId) { return out; }
    tenantId = person.tenantId;

    var origin = originFor(result.kind);
    result.rows.forEach(function (rec) {
      if (rec.errors.length) { return; }
      var res = state.addQuestion(tenantId, {
        type: rec.type,
        text: rec.text,
        /* The FULL four cells, not the compacted list: `addQuestion`
           re-maps the answer index across blank options itself, so it
           must be given the same starting point validation used. */
        options: rec.optionCells,
        answer: rec.type === 'mcq' ? mcqRawIndex(rec) : rec.answer,
        points: rec.points,
        explanation: rec.explanation,
        experimentId: result.experimentId,
        origin: origin
      }, facultyPersonId);
      if (res.ok) { out.created += 1; out.questions.push(res.question); }
      else { out.refused.push({ rowNo: rec.rowNo, errors: res.errors }); }
    });
    return out;
  }

  /* ============================================================
     TEMPLATE — generated from `COLUMNS`, never hand-typed, so the
     file a Faculty member downloads always matches the validator.

     The sample rows show one of each supported type, including a
     descriptive row with an empty answer, so the template itself
     demonstrates that the answer column is not universal.
     ============================================================ */
  function templateRows() {
    return [
      COLUMNS.map(function (c) { return c.label; }),
      ['multiple_choice', 'Which laboratory test measures shear strength along a predefined failure plane?',
       'Direct shear test', 'Triaxial compression test', 'Consolidation test', 'Permeability test',
       'a', '2', 'The direct shear test forces failure along the horizontal plane of the shear box.'],
      ['true_false',
       'A normally consolidated clay has a preconsolidation pressure greater than its current overburden pressure.',
       '', '', '', '', 'FALSE', '1', 'For a normally consolidated soil the two pressures are equal.'],
      ['descriptive', 'Explain how pore water pressure affects effective stress in a saturated soil.',
       '', '', '', '', '', '5', '']
    ];
  }
  function templateCsv() { return XRSLP.csv.toCsv(templateRows()); }

  /* The schema, rendered on the import screen so the rules are
     readable without downloading anything. Built from the same
     definitions as the template and the validator. */
  function columnGuide() {
    return [
      { label: 'question_type', required: 'Required',
        rule: 'One of ' + typeWordList().join(', ') + '.' },
      { label: 'question', required: 'Required',
        rule: 'The question text a student reads. Up to ' + MAX_TEXT + ' characters.' },
      { label: 'option_a to option_d', required: 'Multiple choice only',
        rule: 'At least two must be filled in for a multiple-choice question. Ignored for the other types.' },
      { label: 'correct_answer', required: 'Multiple choice and true/false',
        rule: 'Multiple choice: the letter of the correct option (a, b, c or d), or its exact text. ' +
              'True/false: TRUE or FALSE. Descriptive: leave it blank.' },
      { label: 'marks', required: 'Required',
        rule: 'A whole number between 1 and 100 — the same rule the Add-a-question form uses.' },
      { label: 'explanation', required: 'Optional',
        rule: 'Shown after an attempt, exactly as it is for a question added by hand.' }
    ];
  }

  return {
    COLUMNS: COLUMNS, OPTION_LETTERS: OPTION_LETTERS,
    MAX_ROWS: MAX_ROWS, MAX_TEXT: MAX_TEXT, MAX_OPTION: MAX_OPTION,
    TYPE_WORDS: TYPE_WORDS, typeWordList: typeWordList,
    kindOfFile: kindOfFile, originFor: originFor,
    parseFile: parseFile, validate: validate, commit: commit,
    templateRows: templateRows, templateCsv: templateCsv, columnGuide: columnGuide
  };
})();
