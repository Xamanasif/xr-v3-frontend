/* ============================================================
   Unified Functional Platform — CSV bulk Student provisioning.

   Real browser-side import: FileReader → parse → validate → preview
   → commit. Nothing here is simulated with hardcoded rows.

   FIELD SET — STK31-26, exactly as confirmed. No schema is invented:

     REQUIRED   Programme · Course Name · Course ID/Code ·
                Student ID · Student Name · Email
     OPTIONAL   Semester       — OPTIONAL and never mandatory (STK31-11)
                Organisation   — OPTIONAL (STK31-26)
                Plan Terms     — OPTIONAL; mandatory status unresolved
                                 (ND-03), so a blank value is VALID and
                                 an unrecognised value is an attention
                                 row, never an import failure

   ERROR POLICY — deterministic and all-or-nothing: if ANY row carries
   a blocking error the file is not committed, so an institution can
   never end up with a half-imported cohort it must reconcile by hand.
   The per-row report (row number · field · problem) is produced either
   way. ⚠ `07_TENANT_ONBOARDING_AND_ADMIN_MODEL.md` §6.2 sketches
   “commit only the rows that pass”; the all-or-nothing rule is the
   safer reading and is recorded as a judgement call in the README.

   Programme / Course resolve against the CANONICAL catalogue only —
   a tenant may map a LOCAL code onto a canonical Course but may never
   invent a replacement Course or Experiment (STK31-10).
   ============================================================ */

window.XRSLP = window.XRSLP || {};

XRSLP.csv = (function () {
  'use strict';

  var data = XRSLP.data;
  var util = XRSLP.util;

  /* ---------- column contract ---------- */
  var COLUMNS = [
    { key: 'programme',    label: 'Programme',      required: true,  aliases: ['programme', 'program', 'department', 'academic grouping'] },
    { key: 'courseName',   label: 'Course Name',    required: true,  aliases: ['course name', 'course'] },
    { key: 'courseCode',   label: 'Course ID/Code', required: true,  aliases: ['course id/code', 'course id', 'course code', 'course id / code'] },
    { key: 'studentId',    label: 'Student ID',     required: true,  aliases: ['student id', 'studentid'] },
    { key: 'studentName',  label: 'Student Name',   required: true,  aliases: ['student name', 'name'] },
    { key: 'email',        label: 'Email',          required: true,  aliases: ['email', 'student email', 'e-mail'] },
    { key: 'semester',     label: 'Semester',       required: false, aliases: ['semester'] },
    { key: 'organisation', label: 'Organisation',   required: false, aliases: ['organisation', 'organization'] },
    { key: 'planTerms',    label: 'Plan Terms',     required: false, aliases: ['plan terms', 'plan terms / access context', 'access context', 'plan'] }
  ];

  function requiredColumns() { return COLUMNS.filter(function (c) { return c.required; }); }
  function optionalColumns() { return COLUMNS.filter(function (c) { return !c.required; }); }

  /* ============================================================
     PARSER — RFC 4180-shaped, written as a small state machine.
     Handles quoted values, commas and newlines inside quotes, and
     escaped quotes (""). A naive line.split(',') would corrupt any
     real institutional export, so it is deliberately not used.
     ============================================================ */
  function parse(text) {
    var rows = [], row = [], field = '';
    var inQuotes = false, i = 0, c;
    var src = String(text == null ? '' : text);
    /* Strip a UTF-8 BOM — Excel writes one on every export. */
    if (src.charCodeAt(0) === 0xFEFF) { src = src.slice(1); }

    function endField() { row.push(field); field = ''; }
    function endRow() { endField(); rows.push(row); row = []; }

    while (i < src.length) {
      c = src.charAt(i);
      if (inQuotes) {
        if (c === '"') {
          if (src.charAt(i + 1) === '"') { field += '"'; i += 2; continue; }
          inQuotes = false; i += 1; continue;
        }
        field += c; i += 1; continue;
      }
      if (c === '"') { inQuotes = true; i += 1; continue; }
      if (c === ',') { endField(); i += 1; continue; }
      if (c === '\r') {
        if (src.charAt(i + 1) === '\n') { i += 1; }
        endRow(); i += 1; continue;
      }
      if (c === '\n') { endRow(); i += 1; continue; }
      field += c; i += 1;
    }
    /* Trailing field/row unless the file ended on a newline. */
    if (field !== '' || row.length) { endRow(); }

    /* Drop rows that are entirely empty (a trailing newline, or blank
       separator lines some spreadsheet tools leave behind). */
    return rows.filter(function (r) {
      return r.some(function (v) { return String(v).trim() !== ''; });
    });
  }

  /* ---------- header resolution (case / spacing tolerant) ---------- */
  function matchColumn(headerText) {
    var h = data.norm(headerText).replace(/\s*\/\s*/g, '/');
    for (var i = 0; i < COLUMNS.length; i++) {
      var col = COLUMNS[i];
      for (var j = 0; j < col.aliases.length; j++) {
        if (data.norm(col.aliases[j]).replace(/\s*\/\s*/g, '/') === h) { return col.key; }
      }
    }
    return null;
  }

  /* ============================================================
     VALIDATION — produces the preview the Tenant Admin commits from.

     Returns:
       { ok, fatal, headerErrors[], rows[], errors[], warnings[],
         validCount, invalidCount, columns{} }
     `errors` block the commit; `warnings` never do.
     ============================================================ */
  function validate(text, tenantId) {
    var state = XRSLP.state;
    var out = {
      ok: false, fatal: null,
      headerErrors: [], rows: [], errors: [], warnings: [],
      validCount: 0, invalidCount: 0, columns: {}, headerRow: []
    };

    var table = parse(text);
    if (!table.length) {
      out.fatal = 'The file is empty — no header row and no data rows were found.';
      return out;
    }

    /* --- header --- */
    var header = table[0];
    out.headerRow = header.slice();
    var index = {};
    header.forEach(function (h, i) {
      var key = matchColumn(h);
      if (key && index[key] == null) { index[key] = i; }
    });
    out.columns = index;

    requiredColumns().forEach(function (col) {
      if (index[col.key] == null) {
        out.headerErrors.push('Required column “' + col.label + '” is missing from the header row.');
      }
    });
    if (out.headerErrors.length) {
      out.fatal = 'The header row does not match the template.';
      return out;
    }

    var body = table.slice(1);
    if (!body.length) {
      out.fatal = 'The file contains a header row but no student rows.';
      return out;
    }

    /* --- rows --- */
    var seenStudentId = {}, seenEmail = {};

    body.forEach(function (cells, n) {
      /* Row number as the person sees it in a spreadsheet: header is 1. */
      var rowNo = n + 2;
      function cell(key) {
        var i = index[key];
        return i == null ? '' : String(cells[i] == null ? '' : cells[i]).trim();
      }
      var rec = {
        rowNo: rowNo,
        programme: cell('programme'),
        courseName: cell('courseName'),
        courseCode: cell('courseCode'),
        studentId: cell('studentId'),
        studentName: cell('studentName'),
        email: cell('email'),
        semester: cell('semester'),
        organisation: cell('organisation'),
        planTerms: cell('planTerms'),
        errors: [], warnings: [],
        groupingId: null, courseId: null
      };

      function err(field, message) {
        var e = { rowNo: rowNo, field: field, message: message };
        rec.errors.push(e); out.errors.push(e);
      }
      function warn(field, message) {
        var w = { rowNo: rowNo, field: field, message: message };
        rec.warnings.push(w); out.warnings.push(w);
      }

      /* required fields */
      requiredColumns().forEach(function (col) {
        if (!rec[col.key]) { err(col.label, col.label + ' is required and this row leaves it blank.'); }
      });

      /* email format */
      if (rec.email && !util.isEmail(rec.email)) {
        err('Email', '“' + rec.email + '” is not a valid email address.');
      }

      /* duplicates inside the file */
      var sidKey = data.norm(rec.studentId);
      if (rec.studentId) {
        if (seenStudentId[sidKey]) {
          err('Student ID', 'Student ID “' + rec.studentId + '” is already used on row ' + seenStudentId[sidKey] + ' of this file.');
        } else { seenStudentId[sidKey] = rowNo; }
      }
      var emKey = data.norm(rec.email);
      if (rec.email) {
        if (seenEmail[emKey]) {
          err('Email', 'Email “' + rec.email + '” is already used on row ' + seenEmail[emKey] + ' of this file.');
        } else { seenEmail[emKey] = rowNo; }
      }

      /* duplicates against people already in this tenant */
      if (rec.studentId && state.studentByStudentId(tenantId, rec.studentId)) {
        err('Student ID', 'A student with ID “' + rec.studentId + '” already exists in this institution.');
      }
      if (rec.email && state.personByEmail(tenantId, rec.email)) {
        err('Email', '“' + rec.email + '” already belongs to a person in this institution.');
      }

      /* Programme / Course resolution — canonical only, never guessed */
      if (rec.programme) {
        var g = data.groupingByName(rec.programme);
        if (!g) {
          err('Programme', '“' + rec.programme + '” does not match any Programme / Department in the platform catalogue.');
        } else {
          rec.groupingId = g.id;
          if (rec.courseName) {
            var c = data.courseByName(rec.courseName, g.id);
            if (!c) {
              err('Course Name', '“' + rec.courseName + '” is not a Course in ' + g.name + '.');
            } else {
              rec.courseId = c.id;
              /* Local code conflict with an existing tenant mapping is an
                 attention row, never an overwrite (ND-04). */
              var mapping = state.courseMapping(tenantId, c.id);
              if (rec.courseCode && mapping && mapping.localCode &&
                  data.norm(mapping.localCode) !== data.norm(rec.courseCode)) {
                warn('Course ID/Code', 'This institution already maps ' + c.name + ' to “' + mapping.localCode +
                  '”. The existing mapping is kept; “' + rec.courseCode + '” is stored on the student record only.');
              }
            }
          }
        }
      }

      /* OPTIONAL fields — a blank value is VALID and produces no row */
      if (rec.planTerms && data.PLAN_TERMS.indexOf(rec.planTerms) === -1) {
        warn('Plan Terms', '“' + rec.planTerms + '” is not one of the sample access contexts. It is stored as entered; ' +
          'Plan Terms is administrative context only and never changes what the institution is approved to use.');
      }

      out.rows.push(rec);
    });

    out.validCount = out.rows.filter(function (r) { return !r.errors.length; }).length;
    out.invalidCount = out.rows.length - out.validCount;
    out.ok = out.errors.length === 0;
    return out;
  }

  /* ---------- commit ----------
     Only called when validate() reported zero blocking errors. */
  function commit(result, tenantId) {
    var state = XRSLP.state;
    if (!result || !result.ok) { return { created: 0, students: [], mappings: 0, blocked: false }; }
    /* Implementation 06 — a deactivated institution takes no operational
       action, and `addStudent` refuses. Committing row by row would then
       report a created count for people who were never created, so the
       whole commit stops here instead. The Import screen refuses before
       reaching this point; this is the writer saying the same thing. */
    if (!state.tenantCanWrite(tenantId)) {
      return { created: 0, students: [], mappings: 0, blocked: true };
    }
    var students = [], mappings = 0;
    result.rows.forEach(function (r) {
      var made = state.addStudent(tenantId, {
        studentId: r.studentId,
        name: r.studentName,
        email: r.email,
        groupingId: r.groupingId,
        courseId: r.courseId,
        localCourseCode: r.courseCode,
        semester: r.semester,
        organisation: r.organisation,
        planTerms: r.planTerms,
        source: 'csv'
      });
      /* A refused write is never counted as a created student. */
      if (made) { students.push(made); }
      /* Create the tenant course mapping only where none exists yet —
         an existing mapping is never silently overwritten (ND-04). */
      if (r.courseId && r.courseCode) {
        var existing = state.courseMapping(tenantId, r.courseId);
        if (!existing || !existing.localCode) {
          state.setCourseMapping(tenantId, r.courseId, r.courseCode, existing ? existing.semester : '');
          mappings += 1;
        }
      }
    });
    return { created: students.length, students: students, mappings: mappings, blocked: false };
  }

  /* ---------- template ----------
     A real file, generated in the browser, using the confirmed fields
     and nothing else. Sample rows show a blank Semester, a blank
     Organisation and a blank Plan Terms so the optional columns are
     demonstrably optional.

     ⚠ THE PROGRAMME AND COURSE CELLS ARE READ FROM THE LIVE CATALOGUE,
     never hardcoded. This import resolves both BY NAME, and since the
     Super Admin can rename canonical structure (Implementation 07.1) a
     frozen sample row would eventually hand the user a template that
     this same file's validator rejects. Taking the first two Courses of
     the catalogue as it stands means the template a tenant downloads
     always validates against the catalogue they are importing into. */
  function templateText() {
    var header = COLUMNS.map(function (c) { return c.label; });
    var live = data.courses().filter(function (c) { return !!data.grouping(c.groupingId); });
    function cell(i, which) {
      var c = live[i] || live[0] || null;
      if (!c) { return which === 'course' ? 'Course Name' : 'Programme / Department'; }
      return which === 'course' ? c.name : data.grouping(c.groupingId).name;
    }
    var rows = [
      [cell(0, 'grouping'), cell(0, 'course'), 'CE-305', 'SEI/CE/2026/0001', 'Sample Student One', 'sample.one@institution.example', '5', 'Sample Engineering Institute', 'BITS Community'],
      [cell(1, 'grouping'), cell(1, 'course'), 'CE-212', 'SEI/CE/2026/0002', 'Sample Student Two', 'sample.two@institution.example', '', '', ''],
      [cell(2, 'grouping'), cell(2, 'course'), 'ME-208', 'SEI/ME/2026/0003', 'Sample Student Three', 'sample.three@institution.example', '', '', 'Subscription']
    ];
    return toCsv([header].concat(rows));
  }

  function quote(value) {
    var v = String(value == null ? '' : value);
    return /[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }
  /* A value a spreadsheet would execute. Student names, course names and
     reasons are institution-supplied, so a leading =, +, -, @, TAB or CR
     is neutralised with a leading apostrophe — the conventional fix, and
     it keeps the value readable. */
  function deFormula(v) {
    var t = v === null || v === undefined ? '' : String(v);
    return /^[=+\-@\t\r]/.test(t) ? "'" + t : t;
  }

  function toCsv(rows) {
    return rows.map(function (r) {
      return r.map(function (v) { return quote(deFormula(v)); }).join(',');
    }).join('\r\n') + '\r\n';
  }

  /* ============================================================
     FACULTY STUDENT-PROGRESS EXPORT (07.3, stakeholder R7)

     The stakeholder's problem was concrete: *"if there are 100s of
     students, if they have to take a list of how many students have
     completed, how the faculty will get to know ... they cannot count
     each student."*

     ── WHAT THIS EXPORTS ─────────────────────────────────────────
     EXACTLY the rows the Faculty member is looking at — the FILTERED
     set, in the order shown. Exporting the unfiltered set would answer a
     different question from the one on screen.

     ── THE PRIVACY RULE ──────────────────────────────────────────
     Marks are included, and that is correct rather than a leak: the
     Faculty member IS the evaluator, `scoreWithheld` is explicitly a
     STUDENT-view gate (state.js — "deliberately NOT applied without
     studentView: Faculty performed the evaluation and must keep seeing
     it"), and every figure here is already on their screen.

     What the file adds is the thing a detached file otherwise loses: a
     `Result released to student` column. A withheld result travels in
     the export MARKED as withheld, so a Faculty member who forwards or
     prints the file cannot mistake an unreleased outcome for a released
     one. Nothing is exported that the Faculty member cannot already see.
     ============================================================ */
  var PROGRESS_EXPORT_COLUMNS = [
    'Student name', 'Student ID', 'Email', 'Programme / Department', 'Course',
    'Official course code', 'Institution course code', 'Experiment',
    'Technologies licensed', 'Technologies used', 'Simulation status by technology',
    'Resources completed', 'Resources total',
    'Assessment state', 'Attempt number', 'Score %', 'Score basis', 'Outcome',
    'Result released to student', 'Responses awaiting review', 'Progress'
  ];

  /* `rows` are the screen's own row objects. `deps` supplies the label
     helpers the screen already uses, so the file and the table can never
     describe the same state with two different words. */
  function facultyProgressRows(rows, deps) {
    var state = deps.state, data = deps.data, L = deps.labels;
    var out = [PROGRESS_EXPORT_COLUMNS.slice()];
    rows.forEach(function (x) {
      var ctx = data.contextOf(x.experimentId) || {};
      var use = state.technologyUseSummary(x.person.id, x.experimentId);
      var att = x.attempt;
      var score = att && att.score && att.score.percent !== null ? att.score.percent : null;
      /* ⚠ GATE ON THE SAME DECISION THE STUDENT SURFACES USE — 07.3
         adversarial fix. `resultWithheld` is DECIDED-outcome-only, but
         every student-facing score surface is gated on the broader
         `scoreWithheld`. During the pending-review window under a delayed
         release policy the export therefore printed the objective
         sub-score and answered the privacy column "n/a — no decided
         outcome yet", while the student was being shown nothing at all —
         the exact residual channel the state layer warns about. */
      var scoreHidden = state.scoreWithheld(x.person.id, x.experimentId);
      var withheld = scoreHidden;
      var decided = att && (att.outcome === state.OUTCOME.PASSED || att.outcome === state.OUTCOME.NOT_PASSED);
      var mapping = deps.courseMapping ? deps.courseMapping(x.experimentId) : null;
      out.push([
        x.person.name || '',
        x.person.studentId || '',
        x.person.email || '',
        ctx.grouping ? ctx.grouping.name : '',
        ctx.course ? ctx.course.name : '',
        /* CANONICAL code — blank is legal and stays blank. */
        ctx.course ? (state.courseRecord(ctx.course.id) || {}).code || '' : '',
        mapping ? mapping.localCode || '' : '',
        ctx.experiment ? ctx.experiment.name : x.experimentId,
        (x.technologies || []).join(' | '),
        /* USE, not availability — the stakeholder's other correction. */
        use.used.join(' | '),
        (x.progress.technologies || []).map(function (tp) {
          return tp.technology + '=' + L.simLabel(tp.simulationStatus);
        }).join(' | '),
        x.progress.resources.completed,
        x.progress.resources.total,
        L.assessLabel ? L.assessLabel(x.assessState) : String(x.assessState || ''),
        att ? att.attemptNo : '',
        score === null ? '' : score,
        att && att.score ? (att.score.includesReview ? 'with review' : 'marked questions') : '',
        decided ? (att.outcome === state.OUTCOME.PASSED ? 'Passed' : 'Not passed') : '',
        !att ? 'n/a — nothing submitted'
             : (scoreHidden
                 ? (decided ? 'NO — withheld' : 'NO — score withheld, review pending')
                 : (!decided ? 'n/a — no decided outcome yet' : 'yes')),
        x.pendingReviews || 0,
        L.progressLabel(x.progress.status)
      ]);
    });
    return out;
  }

  /* Hands the browser a file. Delegates to the existing
     `util.download(blob, filename)` rather than repeating its
     object-URL lifecycle — one implementation, one place to fix.
     A UTF-8 BOM is prepended so Excel opens the file in the right
     encoding, which is the same convention `parse()` strips on import. */
  function download(filename, text) {
    var blob = new Blob(['\ufeff' + text], { type: 'text/csv;charset=utf-8;' });
    util.download(blob, filename);
    return filename;
  }

  return {
    COLUMNS: COLUMNS,
    requiredColumns: requiredColumns, optionalColumns: optionalColumns,
    parse: parse, validate: validate, commit: commit,
    templateText: templateText, toCsv: toCsv,
    PROGRESS_EXPORT_COLUMNS: PROGRESS_EXPORT_COLUMNS,
    facultyProgressRows: facultyProgressRows, download: download
  };
})();
