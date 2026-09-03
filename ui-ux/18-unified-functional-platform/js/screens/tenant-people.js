/* ============================================================
   Unified Functional Platform — Tenant Admin · PEOPLE.

   People directory · manual Faculty · manual Student · CSV bulk
   import · person detail (STK31-25 / STK31-26).

   Terminology: one canonical word — “Students”. There is no separate
   Learners section, because Student and Learner are ONE role
   (STK31-01); the B2C individual route reuses the same formal role.

   Nothing here invents an identity mechanism: no invitation, no
   activation e-mail, no account creation (QD-02 stays open). A person
   record is created and its provenance is shown.
   ============================================================ */

window.XRSLP = window.XRSLP || {};
XRSLP.screens = XRSLP.screens || {};

(function () {
  'use strict';

  var esc = XRSLP.util.esc;
  var util = XRSLP.util;
  var ui = XRSLP.ui;
  var data = XRSLP.data;
  var state = XRSLP.state;
  var T = XRSLP.tenantUI;

  /* Filter state lives in the module so a re-render keeps it, exactly
     like the Super Admin queue filter. */
  var f = { role: 'all', status: 'all', q: '' };
  /* CSV working state — file text, validation result, and a commit
     guard so a double click cannot import twice. */
  var imp = { fileName: '', text: '', result: null, committed: null, busy: false };

  function resetImport() { imp = { fileName: '', text: '', result: null, committed: null, busy: false }; }

  /* ============================================================
     PEOPLE DIRECTORY
     ============================================================ */
  XRSLP.screens.tenantPeople = function (params) {
    var r = T.requireTenant(params, 'people');
    if (!r.tenant) { return r.fail; }
    var tenant = r.tenant;

    var all = state.peopleForTenant(tenant.id);
    var faculty = all.filter(function (p) { return p.role === 'faculty'; });
    var students = all.filter(function (p) { return p.role === 'student'; });

    var list = all.filter(function (p) {
      if (f.role !== 'all' && p.role !== f.role) { return false; }
      if (f.status !== 'all' && p.status !== f.status) { return false; }
      if (f.q) {
        var hay = (p.name + ' ' + p.email + ' ' + (p.studentId || '') + ' ' + (p.facultyId || '')).toLowerCase();
        if (hay.indexOf(f.q.toLowerCase()) === -1) { return false; }
      }
      return true;
    });

    function tab(key, label, count) {
      return '<a class="segi" href="' + T.href.people(tenant.id) + '" data-role="' + key + '"' +
        (f.role === key ? ' aria-current="true"' : '') + '>' + esc(label) +
        ' <span class="segn tabular">' + count + '</span></a>';
    }

    var body;
    if (!all.length) {
      body = ui.emptyState({
        icon: 'users',
        title: 'No people in this institution yet',
        body: 'Add Faculty and Students individually, or import a cohort of Students from a CSV file. ' +
          'Provisioning people does not give anyone content — assignment does that.',
        actionsHTML: T.actionsIfWritable(tenant,
          '<a class="btn pri" href="' + T.href.addStudent(tenant.id) + '">Add Student</a>' +
          '<a class="btn sec" href="' + T.href.addFaculty(tenant.id) + '">Add Faculty</a>' +
          '<a class="btn sec" href="' + T.href.importCsv(tenant.id) + '">Import Students (CSV)</a>', false)
      });
    } else if (!list.length) {
      body = ui.emptyState({
        icon: 'search',
        title: 'No people match these filters',
        body: 'Nothing in this institution matches the current search and filter combination.',
        actionsHTML: '<button class="btn sec sm" type="button" id="pf-clear">Clear filters</button>'
      });
    } else {
      var rows = list.map(function (p) {
        var mem = p.role === 'student' ? state.studentCourseMembership(p.id) : null;
        var ent = p.role === 'student' ? state.effectiveEntitlementCount(p.id) : null;
        return '<tr>' +
          '<td data-label="Name">' + T.personLink(tenant.id, p) + '</td>' +
          '<td data-label="Role">' + esc(p.role === 'faculty' ? 'Faculty' : 'Student') + '</td>' +
          '<td data-label="Identifier">' + esc(p.role === 'faculty' ? (p.facultyId || '—') : (p.studentId || '—')) + '</td>' +
          '<td data-label="Email">' + esc(p.email) + '</td>' +
          '<td data-label="Academic context">' +
            (mem ? (mem.course ? esc(mem.course.name) + (mem.localCode ? ' <span class="tsub">' + esc(mem.localCode) + '</span>' : '') : '—') : '—') +
          '</td>' +
          '<td data-label="Entitlements" class="num">' + (ent == null ? '—' : ent) + '</td>' +
          '<td data-label="Source">' + T.sourceBadge(p.source) + '</td>' +
          '<td data-label="Status">' + T.personStatusBadge(p) + '</td>' +
          '</tr>';
      }).join('');
      body = '<div class="tscroll"><table class="dt">' +
        '<caption class="sr-only">People in ' + esc(tenant.name) + '</caption>' +
        '<thead><tr><th scope="col">Name</th><th scope="col">Role</th><th scope="col">Identifier</th>' +
        '<th scope="col">Email</th><th scope="col">Academic context</th><th scope="col">Entitlements</th>' +
        '<th scope="col">Source</th><th scope="col">Status</th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table></div>';
    }

    var html =
      ui.phead('People',
        faculty.length + ' ' + util.plural(faculty.length, 'Faculty', 'Faculty') + ' · ' +
        students.length + ' ' + util.plural(students.length, 'Student'),
        T.actionsIfWritable(tenant,
          '<a class="btn sec" href="' + T.href.addFaculty(tenant.id) + '">' + ui.ic('plus') + 'Add Faculty</a>' +
          '<a class="btn sec" href="' + T.href.addStudent(tenant.id) + '">' + ui.ic('plus') + 'Add Student</a>' +
          '<a class="btn pri" href="' + T.href.importCsv(tenant.id) + '">' + ui.ic('doc') + 'Import Students (CSV)</a>',
          false)) +
      '<div class="tablecard">' +
      '<div class="seg" role="group" aria-label="Filter people by role">' +
      tab('all', 'All', all.length) + tab('faculty', 'Faculty', faculty.length) + tab('student', 'Students', students.length) +
      '</div>' +
      '<div class="listbar">' +
      '<div class="searchbox" style="flex:1 1 240px">' + ui.ic('search') +
      '<label class="sr-only" for="pf-q">Search people by name, identifier or email</label>' +
      '<input type="text" id="pf-q" placeholder="Search name, ID or email" value="' + esc(f.q) + '"></div>' +
      '<label for="pf-status">Status<select id="pf-status">' +
      ['all', 'active', 'inactive'].map(function (v) {
        return '<option value="' + v + '"' + (f.status === v ? ' selected' : '') + '>' +
          (v === 'all' ? 'All' : v === 'active' ? 'Active' : 'Inactive') + '</option>';
      }).join('') + '</select></label>' +
      '<span class="lcount">' + list.length + ' of ' + all.length + ' shown</span>' +
      '</div>' + body + '</div>';

    return {
      title: 'People — ' + tenant.name,
      html: html, tenant: tenant, navKey: 'people',
      after: function () {
        Array.prototype.slice.call(document.querySelectorAll('.seg .segi')).forEach(function (a) {
          a.addEventListener('click', function (e) {
            e.preventDefault();
            f.role = a.getAttribute('data-role');
            XRSLP.render(true);
            ui.announce('Filtered to ' + a.textContent.trim() + '.');
          });
        });
        var q = document.getElementById('pf-q');
        if (q) {
          q.addEventListener('input', function () {
            f.q = q.value;
            XRSLP.render(true);
            var again = document.getElementById('pf-q');
            if (again) { again.focus(); again.setSelectionRange(again.value.length, again.value.length); }
          });
        }
        var st = document.getElementById('pf-status');
        if (st) {
          st.addEventListener('change', function () {
            f.status = st.value;
            XRSLP.render(true);
            var again = document.getElementById('pf-status');
            if (again) { again.focus(); }
          });
        }
        var clr = document.getElementById('pf-clear');
        if (clr) {
          clr.addEventListener('click', function () {
            f = { role: 'all', status: 'all', q: '' };
            XRSLP.render(true);
            ui.focusMain(true);
          });
        }
      }
    };
  };

  /* ============================================================
     MANUAL FACULTY
     Only Name and Email are required. No department approval, HR
     status, employment type, phone or address is invented.
     ============================================================ */
  XRSLP.screens.tenantAddFaculty = function (params) {
    var r = T.requireTenant(params, 'people', { write: true, what: 'Adding a Faculty record' });
    if (!r.tenant) { return r.fail; }
    var tenant = r.tenant;

    var html =
      ui.crumbs([{ label: 'People', href: T.href.people(tenant.id) }, { label: 'Add Faculty' }]) +
      ui.phead('Add Faculty', 'Create a Faculty record in ' + esc(tenant.name) + '.') +
      '<div class="formwrap">' +
      '<form id="fac-form" novalidate>' +
      '<div class="form-errors"></div>' +
      ui.card('Faculty details',
        '<div class="field" id="ff-name"><label for="ff-name-i">Full name <span class="req" aria-hidden="true">*</span>' +
        '<span class="sr-only">(required)</span></label>' +
        '<input type="text" id="ff-name-i" autocomplete="off" required></div>' +
        '<div class="field" id="ff-email"><label for="ff-email-i">Email <span class="req" aria-hidden="true">*</span>' +
        '<span class="sr-only">(required)</span></label>' +
        '<input type="email" id="ff-email-i" autocomplete="off" required>' +
        '<p class="hint">Must be unique inside this institution.</p></div>' +
        '<div class="field" id="ff-fid"><label for="ff-fid-i">Faculty / staff ID</label>' +
        '<input type="text" id="ff-fid-i" autocomplete="off">' +
        '<p class="hint">Optional. The institution&rsquo;s own reference, if it uses one.</p></div>',
        null, 'h2') +
      '<div class="formact">' +
      '<button class="btn pri" type="submit" id="fac-save">Create Faculty record</button>' +
      '<a class="btn sec" href="' + T.href.people(tenant.id) + '">Cancel</a>' +
      '</div></form>' +
      '<div class="formaside">' + ui.gapNote('NOT IN THIS SLICE',
        '<strong>How an identity first exists</strong> — invitation, activation or identity-provider mapping — is not ' +
        'decided by any source, so nothing is invented here. This creates the record the institution assigns work to; ' +
        'its origin is shown as provenance on the person&rsquo;s detail page.') + '</div>' +
      '</div>';

    return {
      title: 'Add Faculty', html: html, tenant: tenant, navKey: 'people',
      after: function () {
        var form = document.getElementById('fac-form');
        if (!form) { return; }
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var name = document.getElementById('ff-name-i').value.trim();
          var email = document.getElementById('ff-email-i').value.trim();
          var fid = document.getElementById('ff-fid-i').value.trim();
          var errs = [];
          if (!name) { errs.push({ field: 'ff-name', message: 'Enter the Faculty member’s full name.' }); }
          if (!email) { errs.push({ field: 'ff-email', message: 'Enter an email address.' }); }
          else if (!util.isEmail(email)) { errs.push({ field: 'ff-email', message: 'Enter a valid email address.' }); }
          else if (state.personByEmail(tenant.id, email)) {
            errs.push({ field: 'ff-email', message: 'A person with this email already exists in ' + tenant.name + '.' });
          }
          if (!ui.showErrors(form, errs, 'Faculty record not created')) { return; }
          var btn = document.getElementById('fac-save');
          btn.disabled = true;
          var rec = state.addFaculty(tenant.id, { name: name, email: email, facultyId: fid });
          ui.toast('Faculty record created for ' + rec.name + '.');
          XRSLP.router.go(T.href.person(tenant.id, rec.id));
        });
      }
    };
  };

  /* ============================================================
     MANUAL STUDENT
     Required: Student ID · Name · Email · Programme · Course ·
     Course ID/Code.  OPTIONAL: Semester · Organisation · Plan Terms —
     none of the three may ever block creation (STK31-11 / ND-03).
     ============================================================ */
  XRSLP.screens.tenantAddStudent = function (params) {
    var r = T.requireTenant(params, 'people', { write: true, what: 'Adding a Student record' });
    if (!r.tenant) { return r.fail; }
    var tenant = r.tenant;

    /* Course options depend on the chosen Programme; the whole form
       re-renders on change so the two selects can never disagree. */
    var chosenGrouping = XRSLP.screens.tenantAddStudent._grouping || '';

    function groupingOptions() {
      return '<option value="">Select a Programme / Department…</option>' +
        data.GROUPINGS.map(function (g) {
          return '<option value="' + esc(g.id) + '"' + (chosenGrouping === g.id ? ' selected' : '') + '>' +
            esc(g.name) + '</option>';
        }).join('');
    }
    function courseOptions() {
      if (!chosenGrouping) { return '<option value="">Select a Programme first…</option>'; }
      return '<option value="">Select a Course…</option>' +
        data.coursesInGrouping(chosenGrouping).map(function (c) {
          return '<option value="' + esc(c.id) + '">' + esc(c.name) + '</option>';
        }).join('');
    }

    var html =
      ui.crumbs([{ label: 'People', href: T.href.people(tenant.id) }, { label: 'Add Student' }]) +
      ui.phead('Add Student', 'Create a Student record in ' + esc(tenant.name) + '.') +
      '<div class="formwrap">' +
      '<form id="stu-form" novalidate>' +
      '<div class="form-errors"></div>' +
      ui.card('Student identity',
        '<div class="frow">' +
        '<div class="field" id="sf-sid"><label for="sf-sid-i">Student ID <span class="req" aria-hidden="true">*</span>' +
        '<span class="sr-only">(required)</span></label><input type="text" id="sf-sid-i" autocomplete="off" required></div>' +
        '<div class="field" id="sf-name"><label for="sf-name-i">Student name <span class="req" aria-hidden="true">*</span>' +
        '<span class="sr-only">(required)</span></label><input type="text" id="sf-name-i" autocomplete="off" required></div>' +
        '</div>' +
        '<div class="field" id="sf-email"><label for="sf-email-i">Student email <span class="req" aria-hidden="true">*</span>' +
        '<span class="sr-only">(required)</span></label><input type="email" id="sf-email-i" autocomplete="off" required>' +
        '<p class="hint">Must be unique inside this institution.</p></div>',
        null, 'h2') +
      ui.card('Academic context',
        '<div class="field" id="sf-prog"><label for="sf-prog-i">Programme / Academic grouping <span class="req" aria-hidden="true">*</span>' +
        '<span class="sr-only">(required)</span></label><select id="sf-prog-i" required>' + groupingOptions() + '</select>' +
        '<p class="hint">Programmes and Courses are platform-controlled. An institution maps its own code onto them; it never replaces them.</p></div>' +
        '<div class="field" id="sf-course"><label for="sf-course-i">Course <span class="req" aria-hidden="true">*</span>' +
        '<span class="sr-only">(required)</span></label><select id="sf-course-i" required' +
        (chosenGrouping ? '' : ' disabled') + '>' + courseOptions() + '</select></div>' +
        '<div class="frow">' +
        '<div class="field" id="sf-code"><label for="sf-code-i">Course ID / Code <span class="req" aria-hidden="true">*</span>' +
        '<span class="sr-only">(required)</span></label><input type="text" id="sf-code-i" autocomplete="off" required>' +
        '<p class="hint">The institution&rsquo;s local code for this Course, e.g. CE-305.</p></div>' +
        '<div class="field" id="sf-sem"><label for="sf-sem-i">Semester</label>' +
        '<input type="text" id="sf-sem-i" autocomplete="off">' +
        '<p class="hint">Optional. Never required, anywhere.</p></div>' +
        '</div>',
        null, 'h2') +
      ui.card('Administrative context',
        '<div class="field" id="sf-org"><label for="sf-org-i">Organisation</label>' +
        '<input type="text" id="sf-org-i" autocomplete="off"><p class="hint">Optional.</p></div>' +
        '<div class="field" id="sf-plan"><label for="sf-plan-i">Plan terms / access context</label>' +
        '<input type="text" id="sf-plan-i" list="plan-terms" autocomplete="off">' +
        '<datalist id="plan-terms">' + data.PLAN_TERMS.map(function (v) {
          return '<option value="' + esc(v) + '"></option>';
        }).join('') + '</datalist>' +
        '<p class="hint">Optional, and administrative only. It records context such as ' +
        esc(data.PLAN_TERMS.join(' or ')) + '; it never changes what this institution is approved to use, ' +
        'and it never grants or waives access.</p></div>',
        null, 'h2') +
      '<div class="formact">' +
      '<button class="btn pri" type="submit" id="stu-save">Create Student record</button>' +
      '<a class="btn sec" href="' + T.href.people(tenant.id) + '">Cancel</a>' +
      '</div></form>' +
      '<div class="formaside">' + ui.alertBox('info', 'Creating a Student grants nothing',
        '<p>A new Student has no experiments until a Tenant Admin assigns approved content to them or to a group they belong to.</p>') +
      '</div></div>';

    return {
      title: 'Add Student', html: html, tenant: tenant, navKey: 'people',
      after: function () {
        var form = document.getElementById('stu-form');
        if (!form) { return; }
        var prog = document.getElementById('sf-prog-i');
        /* Keep whatever the person already typed when the Programme
           changes and the form re-renders. */
        var keep = {};
        ['sf-sid-i', 'sf-name-i', 'sf-email-i', 'sf-code-i', 'sf-sem-i', 'sf-org-i', 'sf-plan-i'].forEach(function (id) {
          var el = document.getElementById(id);
          if (el && XRSLP.screens.tenantAddStudent._keep && XRSLP.screens.tenantAddStudent._keep[id] != null) {
            el.value = XRSLP.screens.tenantAddStudent._keep[id];
          }
        });
        function snapshot() {
          ['sf-sid-i', 'sf-name-i', 'sf-email-i', 'sf-code-i', 'sf-sem-i', 'sf-org-i', 'sf-plan-i'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) { keep[id] = el.value; }
          });
          XRSLP.screens.tenantAddStudent._keep = keep;
        }
        if (prog) {
          prog.addEventListener('change', function () {
            snapshot();
            XRSLP.screens.tenantAddStudent._grouping = prog.value;
            XRSLP.render(true);
            var again = document.getElementById('sf-prog-i');
            if (again) { again.focus(); }
          });
        }

        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var v = {
            studentId: document.getElementById('sf-sid-i').value.trim(),
            name: document.getElementById('sf-name-i').value.trim(),
            email: document.getElementById('sf-email-i').value.trim(),
            groupingId: document.getElementById('sf-prog-i').value,
            courseId: document.getElementById('sf-course-i').value,
            localCourseCode: document.getElementById('sf-code-i').value.trim(),
            semester: document.getElementById('sf-sem-i').value.trim(),
            organisation: document.getElementById('sf-org-i').value.trim(),
            planTerms: document.getElementById('sf-plan-i').value.trim()
          };
          var errs = [];
          if (!v.studentId) { errs.push({ field: 'sf-sid', message: 'Enter the Student ID.' }); }
          else if (state.studentByStudentId(tenant.id, v.studentId)) {
            errs.push({ field: 'sf-sid', message: 'A student with this ID already exists in ' + tenant.name + '.' });
          }
          if (!v.name) { errs.push({ field: 'sf-name', message: 'Enter the student’s name.' }); }
          if (!v.email) { errs.push({ field: 'sf-email', message: 'Enter an email address.' }); }
          else if (!util.isEmail(v.email)) { errs.push({ field: 'sf-email', message: 'Enter a valid email address.' }); }
          else if (state.personByEmail(tenant.id, v.email)) {
            errs.push({ field: 'sf-email', message: 'A person with this email already exists in ' + tenant.name + '.' });
          }
          if (!v.groupingId) { errs.push({ field: 'sf-prog', message: 'Select a Programme / Academic grouping.' }); }
          if (!v.courseId) { errs.push({ field: 'sf-course', message: 'Select a Course.' }); }
          if (!v.localCourseCode) { errs.push({ field: 'sf-code', message: 'Enter the local Course ID / Code.' }); }
          /* Semester, Organisation and Plan terms are never validated
             as required — that is the whole point of STK31-11/ND-03. */
          if (!ui.showErrors(form, errs, 'Student record not created')) { return; }
          document.getElementById('stu-save').disabled = true;
          var rec = state.addStudent(tenant.id, v);
          XRSLP.screens.tenantAddStudent._grouping = '';
          XRSLP.screens.tenantAddStudent._keep = null;
          ui.toast('Student record created for ' + rec.name + '.');
          XRSLP.router.go(T.href.person(tenant.id, rec.id));
        });
      }
    };
  };

  /* ============================================================
     CSV BULK STUDENT IMPORT — upload → preview/validate → commit.
     ============================================================ */
  XRSLP.screens.tenantImport = function (params) {
    var r = T.requireTenant(params, 'people', { write: true, what: 'Bulk student import' });
    if (!r.tenant) { return r.fail; }
    var tenant = r.tenant;
    var csv = XRSLP.csv;

    function columnTable() {
      return '<div class="tscroll"><table class="dt sm">' +
        '<caption class="sr-only">CSV columns accepted by this import</caption>' +
        '<thead><tr><th scope="col">Column</th><th scope="col">Required</th><th scope="col">Notes</th></tr></thead><tbody>' +
        csv.COLUMNS.map(function (c) {
          var note = c.key === 'semester' ? 'Optional. Blank is valid and never an error.' :
            c.key === 'organisation' ? 'Optional. Blank is valid.' :
            c.key === 'planTerms' ? 'Optional. Blank is valid. Administrative context only — it never changes approved access.' :
            c.key === 'programme' ? 'Must match a Programme / Department in the platform catalogue.' :
            c.key === 'courseName' ? 'Must match a Course inside that Programme.' :
            c.key === 'courseCode' ? 'The institution&rsquo;s own local code for the Course.' :
            c.key === 'email' ? 'Must be a valid address and unique in this institution.' :
            'Must be unique in this institution.';
          return '<tr><td data-label="Column"><span class="tmain">' + esc(c.label) + '</span></td>' +
            '<td data-label="Required">' + (c.required ? ui.badge('b-info', null, 'Required') : ui.badge('b-neutral', null, 'Optional')) + '</td>' +
            '<td data-label="Notes">' + note + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }

    /* ---- stage 3: committed ---- */
    if (imp.committed) {
      var c = imp.committed;
      var html3 =
        ui.crumbs([{ label: 'People', href: T.href.people(tenant.id) }, { label: 'Import Students' }]) +
        ui.phead('Import complete') +
        '<div class="stack">' +
        ui.alertBox('success', c.created + ' ' + util.plural(c.created, 'Student') + ' imported',
          '<p>Created from <strong>' + esc(c.fileName) + '</strong>. ' +
          (c.mappings ? c.mappings + ' new local course ' + util.plural(c.mappings, 'code') + ' recorded. ' : '') +
          'The records persist across a page refresh.</p>' +
          '<p style="margin-top:8px">No student has received any content: an import provisions people, ' +
          'and only an assignment creates entitlement.</p>', 'status') +
        ui.card('Imported students',
          '<div class="tscroll"><table class="dt"><caption class="sr-only">Students created by this import</caption>' +
          '<thead><tr><th scope="col">Student ID</th><th scope="col">Name</th><th scope="col">Email</th>' +
          '<th scope="col">Course</th><th scope="col">Semester</th></tr></thead><tbody>' +
          c.students.map(function (p) {
            var course = p.courseId ? data.course(p.courseId) : null;
            return '<tr><td data-label="Student ID">' + esc(p.studentId) + '</td>' +
              '<td data-label="Name">' + T.personLink(tenant.id, p) + '</td>' +
              '<td data-label="Email">' + esc(p.email) + '</td>' +
              '<td data-label="Course">' + esc(course ? course.name : '—') +
              (p.localCourseCode ? ' <span class="tsub">' + esc(p.localCourseCode) + '</span>' : '') + '</td>' +
              '<td data-label="Semester">' + (p.semester ? esc(p.semester) : '<span class="muted">Not specified</span>') + '</td></tr>';
          }).join('') + '</tbody></table></div>', null, 'h2') +
        '<div class="formact">' +
        '<a class="btn pri" href="' + T.href.people(tenant.id) + '">Go to People</a>' +
        '<button class="btn sec" type="button" id="imp-again">Import another file</button>' +
        '</div></div>';
      return {
        title: 'Import complete', html: html3, tenant: tenant, navKey: 'people',
        after: function () {
          var b = document.getElementById('imp-again');
          if (b) { b.addEventListener('click', function () { resetImport(); XRSLP.render(false); }); }
        }
      };
    }

    /* ---- stage 2: preview / validate ---- */
    var previewHTML = '';
    if (imp.result) {
      var res = imp.result;
      if (res.fatal) {
        previewHTML = ui.alertBox('danger', 'This file cannot be imported',
          '<p>' + esc(res.fatal) + '</p>' +
          (res.headerErrors.length ? '<ul style="margin:6px 0 0 16px">' +
            res.headerErrors.map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('') + '</ul>' : '') +
          '<p style="margin-top:8px">Download the template, correct the file and upload it again.</p>', 'alert');
      } else {
        var blocking = res.errors.length > 0;
        var summary = ui.alertBox(blocking ? 'danger' : 'success',
          blocking ?
            'Import blocked — ' + res.invalidCount + ' of ' + res.rows.length + ' ' + util.plural(res.rows.length, 'row') + ' cannot be imported' :
            'File is valid — ' + res.validCount + ' ' + util.plural(res.validCount, 'row') + ' ready to import',
          blocking ?
            '<p><strong>' + res.validCount + '</strong> valid ' + util.plural(res.validCount, 'row') + ' · ' +
            '<strong>' + res.invalidCount + '</strong> invalid ' + util.plural(res.invalidCount, 'row') + '. ' +
            'Nothing is imported while any row carries a blocking error, so a cohort can never arrive half-created. ' +
            'Correct the rows listed below and upload the file again.</p>' :
            '<p>Every row passes validation. Blank Semester, Organisation and Plan Terms values are valid and are not errors.</p>',
          'alert');

        var errorTable = '';
        if (blocking) {
          errorTable = ui.card('Blocking errors',
            '<div class="tscroll"><table class="dt"><caption class="sr-only">Rows that block this import</caption>' +
            '<thead><tr><th scope="col">Row</th><th scope="col">Field</th><th scope="col">Problem</th></tr></thead><tbody>' +
            res.errors.map(function (e) {
              return '<tr><td data-label="Row" class="num">' + e.rowNo + '</td>' +
                '<td data-label="Field">' + esc(e.field) + '</td>' +
                '<td data-label="Problem">' + esc(e.message) + '</td></tr>';
            }).join('') + '</tbody></table></div>',
            res.errors.length + ' ' + util.plural(res.errors.length, 'error'), 'h2');
        }

        var warnTable = '';
        if (res.warnings.length) {
          warnTable = ui.card('Rows needing attention',
            '<p class="cardlede">These do <strong>not</strong> block the import. They are recorded so nothing is ' +
            'silently overwritten or silently reinterpreted.</p>' +
            '<div class="tscroll"><table class="dt"><caption class="sr-only">Rows needing attention</caption>' +
            '<thead><tr><th scope="col">Row</th><th scope="col">Field</th><th scope="col">Note</th></tr></thead><tbody>' +
            res.warnings.map(function (w) {
              return '<tr><td data-label="Row" class="num">' + w.rowNo + '</td>' +
                '<td data-label="Field">' + esc(w.field) + '</td>' +
                '<td data-label="Note">' + esc(w.message) + '</td></tr>';
            }).join('') + '</tbody></table></div>',
            res.warnings.length + ' ' + util.plural(res.warnings.length, 'note'), 'h2');
        }

        var rowsTable = ui.card('Preview',
          '<div class="tscroll"><table class="dt"><caption class="sr-only">Every row in the uploaded file</caption>' +
          '<thead><tr><th scope="col">Row</th><th scope="col">Student ID</th><th scope="col">Name</th>' +
          '<th scope="col">Email</th><th scope="col">Programme &amp; Course</th><th scope="col">Semester</th>' +
          '<th scope="col">Plan terms</th><th scope="col">Result</th></tr></thead><tbody>' +
          res.rows.map(function (row) {
            var bad = row.errors.length > 0;
            return '<tr class="' + (bad ? 'row-bad' : '') + '">' +
              '<td data-label="Row" class="num">' + row.rowNo + '</td>' +
              '<td data-label="Student ID">' + esc(row.studentId || '—') + '</td>' +
              '<td data-label="Name">' + esc(row.studentName || '—') + '</td>' +
              '<td data-label="Email">' + esc(row.email || '—') + '</td>' +
              '<td data-label="Programme &amp; Course"><span class="tmain" style="font-weight:500">' +
              esc(row.courseName || '—') + '</span><span class="tsub">' + esc(row.programme || '') +
              (row.courseCode ? ' · ' + esc(row.courseCode) : '') + '</span></td>' +
              '<td data-label="Semester">' + (row.semester ? esc(row.semester) : '<span class="muted">Not specified</span>') + '</td>' +
              '<td data-label="Plan terms">' + (row.planTerms ? esc(row.planTerms) : '<span class="muted">Not specified</span>') + '</td>' +
              '<td data-label="Result">' + (bad
                ? ui.badge('b-danger', 'alertCirc', row.errors.length + ' ' + util.plural(row.errors.length, 'error'))
                : row.warnings.length ? ui.badge('b-warning', 'alert', 'Attention')
                : ui.badge('b-success', 'check', 'Valid')) + '</td></tr>';
          }).join('') + '</tbody></table></div>',
          esc(imp.fileName), 'h2');

        previewHTML = '<div class="stack">' + summary + errorTable + warnTable + rowsTable +
          '<div class="formact">' +
          (blocking
            ? '<button class="btn pri" type="button" id="imp-commit" disabled aria-disabled="true">Import Students</button>' +
              '<span class="formnote">Correct the blocking errors and upload the file again to enable the import.</span>'
            : '<button class="btn pri" type="button" id="imp-commit">Import ' + res.validCount + ' ' +
              util.plural(res.validCount, 'Student') + '</button>') +
          '<button class="btn sec" type="button" id="imp-clear">Choose a different file</button>' +
          '</div></div>';
      }
    }

    /* ---- stage 1: upload ---- */
    var html =
      ui.crumbs([{ label: 'People', href: T.href.people(tenant.id) }, { label: 'Import Students' }]) +
      ui.phead('Import Students from CSV',
        'Upload a <code>.csv</code> file, review every row, then commit.') +
      '<div class="stack">' +
      ui.card('1 · Upload a file',
        '<div class="field" id="imp-field">' +
        '<label for="imp-file">CSV file</label>' +
        '<input type="file" id="imp-file" accept=".csv,text/csv" aria-describedby="imp-file-hint">' +
        '<p class="hint" id="imp-file-hint">Comma-separated values only. Spreadsheet formats such as ' +
        '<code>.xlsx</code> are not supported by this import — export the sheet as CSV first.</p>' +
        (imp.fileName ? '<p class="filepick">' + ui.ic('doc', 'sm') + '<span>' + esc(imp.fileName) + '</span></p>' : '') +
        '</div>' +
        '<div class="formact"><button class="btn sec" type="button" id="imp-template">' + ui.ic('doc') +
        'Download CSV template</button></div>',
        null, 'h2') +
      previewHTML +
      ui.card('Columns this import accepts', columnTable(), null, 'h2') +
      '</div>';

    return {
      title: 'Import Students', html: html, tenant: tenant, navKey: 'people',
      after: function () {
        var tpl = document.getElementById('imp-template');
        if (tpl) {
          tpl.addEventListener('click', function () {
            var blob = new Blob([XRSLP.csv.templateText()], { type: 'text/csv;charset=utf-8;' });
            util.download(blob, 'student-import-template.csv');
            ui.toast('CSV template downloaded.', 'info');
          });
        }
        var file = document.getElementById('imp-file');
        if (file) {
          file.addEventListener('change', function () {
            var f0 = file.files && file.files[0];
            if (!f0) { return; }
            var reader = new FileReader();
            reader.onerror = function () {
              imp.result = { fatal: 'The file could not be read.', headerErrors: [], rows: [], errors: [], warnings: [] };
              XRSLP.render(false);
            };
            reader.onload = function () {
              imp.fileName = f0.name;
              imp.text = String(reader.result || '');
              imp.result = XRSLP.csv.validate(imp.text, tenant.id);
              imp.committed = null;
              XRSLP.render(false);
              ui.announce(imp.result.fatal ? 'The file cannot be imported.' :
                imp.result.ok ? imp.result.validCount + ' rows are valid and ready to import.' :
                'Import blocked: ' + imp.result.invalidCount + ' of ' + imp.result.rows.length + ' rows have errors.');
            };
            reader.readAsText(f0);
          });
        }
        var clear = document.getElementById('imp-clear');
        if (clear) { clear.addEventListener('click', function () { resetImport(); XRSLP.render(false); }); }

        var commit = document.getElementById('imp-commit');
        if (commit) {
          commit.addEventListener('click', function () {
            if (imp.busy || !imp.result || !imp.result.ok) { return; }
            imp.busy = true;                  /* double-click guard */
            commit.disabled = true;
            var outcome = XRSLP.csv.commit(imp.result, tenant.id);
            imp.committed = {
              created: outcome.created, students: outcome.students,
              mappings: outcome.mappings, fileName: imp.fileName
            };
            imp.result = null; imp.text = ''; imp.busy = false;
            XRSLP.render(false);
            ui.toast(outcome.created + ' ' + util.plural(outcome.created, 'student') + ' imported.');
          });
        }
      }
    };
  };

  /* ============================================================
     PERSON DETAIL — Student or Faculty
     ============================================================ */
  XRSLP.screens.tenantPerson = function (params) {
    var r = T.requireTenant(params, 'people');
    if (!r.tenant) { return r.fail; }
    var tenant = r.tenant;
    var p = state.personById(params.personId);
    if (!p || p.tenantId !== tenant.id) {
      return {
        title: 'Person not found', tenant: tenant, navKey: 'people',
        html: ui.crumbs([{ label: 'People', href: T.href.people(tenant.id) }, { label: 'Not found' }]) +
          '<div class="tablecard">' + ui.emptyState({
            icon: 'alertCirc', title: 'Person not found',
            body: 'No person with this identifier exists in ' + tenant.name + '.',
            actionsHTML: '<a class="btn pri" href="' + T.href.people(tenant.id) + '">Back to People</a>'
          }) + '</div>'
      };
    }
    return p.role === 'faculty' ? facultyDetail(tenant, p) : studentDetail(tenant, p);
  };

  function optional(value) {
    return value ? esc(value) : '<span class="muted">Not specified</span>';
  }

  function studentDetail(tenant, p) {
    var mem = state.studentCourseMembership(p.id);
    var groups = state.groupsOfPerson(p.id);
    var ents = state.entitlementsForStudent(p.id);
    var effective = ents.filter(function (e) { return e.effective; }).length;

    var identity = ui.card('Student',
      '<div class="kv">' +
      '<div class="k">Student ID</div><div class="v">' + esc(p.studentId || '—') + '</div>' +
      '<div class="k">Email</div><div class="v">' + esc(p.email) + '</div>' +
      '<div class="k">Status</div><div class="v">' + T.personStatusBadge(p) +
      (p.status === 'inactive' && p.deactivatedAt ? ' <span class="muted">since ' + esc(util.fmtDate(p.deactivatedAt)) + '</span>' : '') + '</div>' +
      '<div class="k">Record source</div><div class="v">' + esc(T.sourceLabel(p.source)) + '</div>' +
      '<div class="k">Created</div><div class="v">' + esc(util.fmtDate(p.createdAt)) + '</div>' +
      '</div>', null, 'h2');

    var academic = ui.card('Academic mapping',
      '<div class="kv">' +
      '<div class="k">Programme / grouping</div><div class="v">' + (mem && mem.grouping ? esc(mem.grouping.name) : optional('')) + '</div>' +
      '<div class="k">Course (canonical)</div><div class="v">' + (mem && mem.course ? esc(mem.course.name) : optional('')) + '</div>' +
      '<div class="k">Local course code</div><div class="v">' + optional(p.localCourseCode) + '</div>' +
      '<div class="k">Semester</div><div class="v">' + optional(p.semester) + '</div>' +
      '<div class="k">Organisation</div><div class="v">' + optional(p.organisation) + '</div>' +
      '<div class="k">Plan terms / access context</div><div class="v">' + optional(p.planTerms) + '</div>' +
      '</div>' +
      (p.planTerms ? '<p class="cardfoot">Plan terms are administrative context recorded against the student. ' +
        'What this student may be assigned comes only from the institution&rsquo;s approved access records.</p>' : ''),
      null, 'h2');

    var groupCard = ui.card('Groups',
      groups.length
        ? '<ul class="chiplist">' + groups.map(function (g) {
            return '<li><a class="chip" href="' + T.href.group(tenant.id, g.id) + '">' + esc(g.name) + '</a></li>';
          }).join('') + '</ul>' +
          '<p class="cardfoot">Group membership by itself grants no content. It only decides which assignments reach this student.</p>'
        : ui.emptyState({
            icon: 'users', heading: 'h3', title: 'Not in any group',
            body: 'Groups are an assignment convenience — a student can belong to several, or none.',
            actionsHTML: '<a class="btn sec sm" href="' + T.href.groups(tenant.id) + '">Open Groups</a>'
          }),
      groups.length ? groups.length + ' ' + util.plural(groups.length, 'group') : null, 'h2');

    var entBody;
    if (!ents.length) {
      entBody = ui.emptyState({
        icon: 'flask', heading: 'h3',
        title: 'No experiments assigned',
        body: 'This student has no entitlement. Holding institutional access does not entitle anyone — ' +
          'an experiment must be assigned to this student or to a group they belong to.',
        actionsHTML: state.assignableAccessForTenant(tenant.id).length
          ? '<a class="btn pri sm" href="' + T.href.newAssignment(tenant.id) + '">Assign an experiment</a>'
          : '<a class="btn sec sm" href="' + T.href.access(tenant.id) + '">View content access</a>'
      });
    } else {
      entBody = '<div class="tscroll"><table class="dt">' +
        '<caption class="sr-only">Effective experiment entitlements for ' + esc(p.name) + '</caption>' +
        '<thead><tr><th scope="col">Course &amp; Experiment</th><th scope="col">Technologies</th>' +
        '<th scope="col">Access record</th><th scope="col">Assignment source</th><th scope="col">Status</th></tr></thead><tbody>' +
        ents.map(function (e) {
          return '<tr><td data-label="Course &amp; Experiment">' + T.expLine(e.experimentId) + '</td>' +
            '<td data-label="Technologies">' + ui.techBadges(e.technologies) + '</td>' +
            '<td data-label="Access record"><span class="mono">' + esc(e.accessId) + '</span></td>' +
            '<td data-label="Assignment source">' + e.sources.map(function (s) {
              return '<span class="srcchip">' + ui.ic(s.type === 'group' ? 'users' : 'shield', 'sm') +
                (s.type === 'group' ? 'Group · ' + esc(s.label) : 'Direct') + '</span>';
            }).join(' ') + '</td>' +
            '<td data-label="Status">' + T.entitlementBadge(e) + '</td></tr>';
        }).join('') + '</tbody></table></div>' +
        '<p class="cardfoot">One effective entitlement per experiment, however many sources support it. ' +
        'Removing one source leaves the entitlement in place while another still supports it.</p>';
    }
    var entCard = ui.card('Experiment entitlements', entBody,
      effective + ' effective of ' + ents.length, 'h2');

    var actions = !T.canWrite(tenant)
      ? '<div class="formact"><span class="formnote">Student activation cannot be changed while the ' +
        'institution is deactivated. This record, its assignments and its entitlement history are all ' +
        'preserved exactly as they stand.</span></div>'
      :
      '<div class="formact">' +
      (p.status === 'active'
        ? '<button class="btn sec" type="button" id="p-deact">Deactivate student</button>'
        : '<button class="btn pri" type="button" id="p-react">Reactivate student</button>') +
      '<span class="formnote">' + (p.status === 'active'
        ? 'Deactivating is reversible. The student keeps every assignment record, holds no effective entitlement while inactive, and frees their licence.'
        : 'Reactivating restores entitlement where the access record is still active and a licence is available.') +
      '</span></div>';

    var html =
      ui.crumbs([{ label: 'People', href: T.href.people(tenant.id) }, { label: p.name }]) +
      ui.phead(p.name, esc(p.studentId || '') + ' · ' + esc(p.email), null, ' ' + T.personStatusBadge(p)) +
      (p.status === 'inactive' ? ui.alertBox('warning', 'This student is inactive',
        '<p>Inactive students hold no effective entitlement and cannot receive new assignments. ' +
        'Their assignment history is preserved and nothing has been deleted.</p>') + '<div style="height:16px"></div>' : '') +
      '<div class="grid-rail"><div class="stack">' + entCard + academic + '</div>' +
      '<div class="stack">' + identity + groupCard + '</div></div>' +
      actions;

    return {
      title: p.name, html: html, tenant: tenant, navKey: 'people',
      after: function () {
        var de = document.getElementById('p-deact');
        if (de) {
          de.addEventListener('click', function () {
            ui.openDialog({
              title: 'Deactivate ' + p.name + '?',
              bodyHTML: '<p>The student record stays in the institution and every assignment record is kept.</p>' +
                '<div class="consequence">' + ui.ic('info') + '<span>While inactive they hold <strong>no effective entitlement</strong>, ' +
                'cannot receive new assignments, and their licence is released back to the allocation. ' +
                'This is reversible.</span></div>',
              okLabel: 'Deactivate',
              onConfirm: function () {
                state.setStudentStatus(p.id, 'inactive');
                ui.toast(p.name + ' deactivated — entitlement is no longer effective.');
                XRSLP.render(false);
              }
            });
          });
        }
        var re = document.getElementById('p-react');
        if (re) {
          re.addEventListener('click', function () {
            state.setStudentStatus(p.id, 'active');
            var after = state.entitlementsForStudent(p.id);
            var held = after.filter(function (e) { return e.blockedBy === 'allocation-held'; }).length;
            ui.toast(p.name + ' reactivated' + (held
              ? ' — ' + held + ' ' + util.plural(held, 'entitlement') + ' held: the allocation is full.'
              : '.'));
            XRSLP.render(false);
          });
        }
      }
    };
  }

  function facultyDetail(tenant, p) {
    var maps = state.facultyMappingsFor(p.id);
    var courseIds = {}, expIds = [];
    maps.forEach(function (m) {
      courseIds[m.courseId] = true;
      if (m.experimentId) { expIds.push(m); }
    });

    var mapBody = maps.length
      ? '<div class="tscroll"><table class="dt">' +
        '<caption class="sr-only">Content mapped to ' + esc(p.name) + '</caption>' +
        '<thead><tr><th scope="col">Course</th><th scope="col">Experiment</th>' +
        '<th scope="col">Technologies</th><th scope="col">Access record</th></tr></thead><tbody>' +
        maps.map(function (m) {
          var course = data.course(m.courseId);
          var rec = state.accessById(m.accessId);
          return '<tr><td data-label="Course"><span class="tmain">' + esc(course ? course.name : m.courseId) + '</span></td>' +
            '<td data-label="Experiment">' + (m.experimentId ? T.expLine(m.experimentId) :
              '<span class="muted">Whole course context</span>') + '</td>' +
            '<td data-label="Technologies">' + (m.experimentId && rec
              ? ui.techBadges(state.accessTechnologies(rec, m.experimentId)) : '<span class="muted">—</span>') + '</td>' +
            '<td data-label="Access record"><span class="mono">' + esc(m.accessId) + '</span></td></tr>';
        }).join('') + '</tbody></table></div>'
      : ui.emptyState({
          icon: 'flask', heading: 'h3', title: 'No content mapped',
          body: 'This Faculty member is not mapped to any course or experiment inside the institution’s approved access.',
          actionsHTML: '<a class="btn sec sm" href="' + T.href.facultyMap(tenant.id) + '">Open Faculty mapping</a>'
        });

    var html =
      ui.crumbs([{ label: 'People', href: T.href.people(tenant.id) }, { label: p.name }]) +
      ui.phead(p.name, esc(p.facultyId || 'Faculty') + ' · ' + esc(p.email), null,
        ' ' + ui.badge('b-outline', null, 'Faculty')) +
      '<div class="grid-rail"><div class="stack">' +
      ui.card('Mapped content', mapBody,
        Object.keys(courseIds).length + ' ' + util.plural(Object.keys(courseIds).length, 'course') +
        ' · ' + expIds.length + ' ' + util.plural(expIds.length, 'experiment'), 'h2') +
      '</div><div class="stack">' +
      ui.card('Faculty',
        '<div class="kv">' +
        '<div class="k">Faculty / staff ID</div><div class="v">' + optional(p.facultyId) + '</div>' +
        '<div class="k">Email</div><div class="v">' + esc(p.email) + '</div>' +
        '<div class="k">Record source</div><div class="v">' + esc(T.sourceLabel(p.source)) + '</div>' +
        '<div class="k">Created</div><div class="v">' + esc(util.fmtDate(p.createdAt)) + '</div>' +
        '</div>', null, 'h2') +
      ui.alertBox('info', 'Faculty mapping does not consume a student licence',
        '<p>The approved quantity on an access record is a student/user allocation. Mapping a Faculty member to a ' +
        'course or experiment does not take one of those licences.</p>') +
      /* The Faculty workspace this used to defer to now exists, so the
         note states the boundary rather than an absence. */
      ui.alertBox('info', 'This page is the Tenant Admin’s view',
        '<p>Assessment authoring, the descriptive review queue and Student progress belong to the Faculty ' +
        'member, who reaches them in the Faculty workspace for whatever is mapped above.</p>') +
      '</div></div>';

    return { title: p.name, html: html, tenant: tenant, navKey: 'people' };
  }
})();
