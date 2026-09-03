/* ============================================================
   Unified Functional Platform — STUDENT workspace.

   Implementation 03 connects the two halves already built:

     Super Admin approves  →  TENANT ACCESS
     Tenant Admin assigns  →  STUDENT ENTITLEMENT   (derived)
     ───────────────────────────────────────────────────────
     THE STUDENT SEES EXACTLY THAT, AND NOTHING ELSE

   Student and Learner are ONE formal role (STK31-01). This workspace
   is the institutional (B2B) context of that single role; the same
   learning core serves the deferred B2C context unchanged.

   ⚠ THE RULE THIS FILE EXISTS TO OBEY
   Every experiment, and every technology of every experiment, that
   this workspace shows comes from `state.studentExperiments()`, which
   is a read model over the Implementation-02 entitlement derivation.
   There is NO second entitlement store, no seeded student access, and
   no path by which published catalogue content or tenant-held content
   can reach a Student without an assignment.

   This file: shared student helpers · workspace resolution ·
   Home · My Learning · Progress.
   The Experiment, Simulation and Assessment screens live in
   student-learn.js.
   ============================================================ */

window.XRSLP = window.XRSLP || {};
XRSLP.screens = XRSLP.screens || {};

XRSLP.studentUI = (function () {
  'use strict';

  var esc = XRSLP.util.esc;
  var util = XRSLP.util;
  var ui = XRSLP.ui;
  var data = XRSLP.data;
  var state = XRSLP.state;

  function base(studentId) { return '#/learn/' + encodeURIComponent(studentId); }
  function expBase(studentId, experimentId) {
    return base(studentId) + '/experiment/' + encodeURIComponent(experimentId);
  }
  var href = {
    switcher:   function () { return '#/learn'; },
    home:       function (s) { return base(s) + '/home'; },
    myLearning: function (s) { return base(s) + '/my-learning'; },
    progress:   function (s) { return base(s) + '/progress'; },
    /* Implementation 06 — device replacement / transfer (STK31-38) and
       Help (STK31-39). */
    device:     function (s) { return base(s) + '/device'; },
    help:       function (s) { return base(s) + '/help'; },
    experiment: function (s, e) { return expBase(s, e); },
    simulation: function (s, e, t) { return expBase(s, e) + '/simulation/' + encodeURIComponent(t); },
    /* No technology segment: one assessment per Experiment. */
    assessment: function (s, e) { return expBase(s, e) + '/assessment'; },
    attempt:    function (s, e) { return expBase(s, e) + '/assessment/attempt'; },
    result:     function (s, e) { return expBase(s, e) + '/assessment/result'; }
  };

  /* Every student screen resolves its Student the same way and fails
     the same way when the address is stale. The record must be a REAL
     TenantUser — the prototype never invents one. */
  function requireStudent(params, navKey) {
    var p = state.personById(params.studentId);
    if (p && p.role === 'student') {
      var tenant = state.tenantById(p.tenantId);
      if (tenant) { return { student: p, tenant: tenant }; }
    }
    return {
      student: null, tenant: null,
      fail: {
        area: 'learn', student: null, tenant: null, navKey: navKey || null,
        title: 'Student not found',
        html: ui.phead('Student not found') +
          '<div class="tablecard">' + ui.emptyState({
            icon: 'alertCirc',
            title: 'No student record for this address',
            body: 'The address may be stale — this record may not exist in the current prototype data.',
            actionsHTML: '<a class="btn pri" href="' + href.switcher() + '">Choose a student</a>'
          }) + '</div>'
      }
    };
  }

  /* ---------- status vocabulary ----------
     Status is never carried by colour alone: every badge carries an
     icon and a word. */
  var PROGRESS_META = {
    NOT_STARTED:            { label: 'Not started',            badge: 'b-neutral', icon: 'minus' },
    IN_PROGRESS:            { label: 'In progress',            badge: 'b-info',    icon: 'clock' },
    /* STK31-31: Faculty is the only human role responsible for
       descriptive-answer evaluation, so the Student is told exactly
       who the answer is with. */
    PENDING_FACULTY_REVIEW: { label: 'Pending Faculty review',  badge: 'b-warning', icon: 'clock' },
    /* Evaluation finished, release not due yet. It says what the Student
       may safely be told — that the work is done and the result is
       waiting on a date — and nothing about the result itself. */
    RESULT_WITHHELD:        { label: 'Result pending release',  badge: 'b-info',    icon: 'clock' },
    COMPLETED:              { label: 'Completed',              badge: 'b-success', icon: 'check' }
  };
  function progressBadge(status) {
    var m = PROGRESS_META[status] || PROGRESS_META.NOT_STARTED;
    return ui.badge(m.badge, m.icon, m.label);
  }
  function progressLabel(status) {
    return (PROGRESS_META[status] || PROGRESS_META.NOT_STARTED).label;
  }

  var SIM_META = {
    NOT_STARTED: { label: 'Not started', badge: 'b-neutral', icon: 'minus' },
    IN_PROGRESS: { label: 'In progress', badge: 'b-info',    icon: 'clock' },
    COMPLETED:   { label: 'Completed',   badge: 'b-success', icon: 'check' }
  };
  function simBadge(status) {
    var m = SIM_META[status] || SIM_META.NOT_STARTED;
    return ui.badge(m.badge, m.icon, m.label);
  }
  function simLabel(status) { return (SIM_META[status] || SIM_META.NOT_STARTED).label; }

  var ASSESS_META = {
    NONE:                   { label: 'No assessment',          badge: 'b-neutral', icon: 'minus' },
    NOT_STARTED:            { label: 'Not started',            badge: 'b-neutral', icon: 'minus' },
    IN_PROGRESS:            { label: 'In progress',            badge: 'b-info',    icon: 'clock' },
    PENDING_FACULTY_REVIEW: { label: 'Pending Faculty review',  badge: 'b-warning', icon: 'clock' },
    PASSED:                 { label: 'Passed',                 badge: 'b-success', icon: 'check' },
    NOT_PASSED:             { label: 'Not passed',             badge: 'b-danger',  icon: 'alertCirc' },
    /* Faculty have finished, but the visibility policy has not released
       the result yet. Only a STUDENT surface ever shows this: the state
       layer, the Faculty workspace and the progress derivation all keep
       the true outcome. */
    REVIEWED_WITHHELD:      { label: 'Result pending release',   badge: 'b-info',    icon: 'clock' }
  };
  function assessBadge(stateKey) {
    var m = ASSESS_META[stateKey] || ASSESS_META.NOT_STARTED;
    return ui.badge(m.badge, m.icon, m.label);
  }
  function assessLabel(stateKey) {
    return (ASSESS_META[stateKey] || ASSESS_META.NOT_STARTED).label;
  }

  /* ⚠ THE ONE PLACE A STUDENT-FACING ASSESSMENT STATE IS DECIDED.

     `state.assessmentState()` is the truth — Faculty and every derivation
     read it unchanged. But a result that exists and has NOT been released
     must not be announced to the Student by a badge on another screen
     while the result screen is withholding it (brief §30). This maps the
     outcome to the withheld state for Student surfaces only, and only
     while a Faculty review is actually part of that result.

     It deliberately does NOT touch the Experiment progress roll-up:
     "Completed" is a statement about the work the Student did, not a
     statement of the assessment result, and the Student did do it. */
  function studentAssessState(personId, experimentId) {
    var key = state.assessmentState(personId, experimentId);
    if (key !== state.ASSESS_STATE.PASSED && key !== state.ASSESS_STATE.NOT_PASSED) { return key; }
    /* Decided, but not released — whether the marks came from the machine
       or from a Faculty member. */
    return state.resultWithheld(personId, experimentId) ? 'REVIEWED_WITHHELD' : key;
  }

  /* Why an entitlement the Student can see is not currently usable.
     Written for a Student: no ACC-nnn, no licence arithmetic, no
     administrative vocabulary (brief §32). */
  var UNAVAILABLE_TEXT = {
    /* Implementation 06 — the institution itself has been deactivated by
       the platform. It is listed first because it explains everything
       below it, and it is written as a fact about the institution rather
       than about the Student, which is what it actually is. */
    /* No trailing "everything is kept" sentence here: every caller that
       shows this text already appends one, and saying it twice in a row
       reads as a glitch. */
    'tenant-inactive':  'Your institution’s access to the platform has been suspended.',
    'student-inactive': 'Your account is not active at your institution at the moment.',
    'access-expired':   'Your institution’s access to this experiment has reached its end date.',
    'allocation-held':  'Your institution has not yet made a place available for you on this experiment.'
  };
  function unavailableText(reason) {
    return UNAVAILABLE_TEXT[reason] || 'This experiment is not available to you at the moment.';
  }

  /* An accessible progress bar. The numbers are always present as
     text, so the bar itself is decoration. */
  function progressBar(percent, srLabel) {
    var pct = Math.max(0, Math.min(100, percent || 0));
    return '<div class="lprog" role="img" aria-label="' + esc(srLabel) + '">' +
      '<span style="width:' + pct + '%"></span></div>';
  }

  /* Rule 1 of the per-technology progress model: the roll-up must state
     WHICH technologies it covers. Rule 3: one assigned technology adds
     no noise.

     ⚠ WHAT A TECHNOLOGY LABEL MAY SAY.
     The SIMULATION is the only technology-specific learning activity.
     Learning resources and the assessment belong to the Experiment, so
     letting them colour a per-technology label produced a sentence that
     was simply untrue of the technology — "AR in progress" when the AR
     simulation had never been opened and only the shared assessment had
     moved. Every technology-facing label below therefore reads the
     technology's own SIMULATION state and nothing else. The Experiment
     roll-up still uses the full derivation; it is shown separately, and
     labelled as the prototype-derived rule that it is. */
  function simulationSentence(prog) {
    var rows = prog.technologies;
    if (!rows.length) { return ''; }
    if (rows.length === 1) {
      return data.TECHNOLOGIES[rows[0].technology].label + ' simulation ' +
        simLabel(rows[0].simulationStatus).toLowerCase() + '.';
    }
    return 'Simulations: ' + rows.map(function (r) {
      return data.TECHNOLOGIES[r.technology].label + ' ' + simLabel(r.simulationStatus).toLowerCase();
    }).join(' · ') + '.';
  }

  /* Technology chips — each one reports its OWN simulation. */
  function techStateChips(prog) {
    return '<ul class="techstates">' + prog.technologies.map(function (r) {
      var m = SIM_META[r.simulationStatus] || SIM_META.NOT_STARTED;
      return '<li class="ts ts-' + esc(r.simulationStatus.toLowerCase().replace(/_/g, '-')) + '">' +
        ui.fmtBadge(r.technology) +
        '<span class="ts-s">' + ui.ic(m.icon, 'sm') + esc(m.label) + '</span></li>';
    }).join('') + '</ul>';
  }

  function courseLine(experimentId) {
    var ctx = data.contextOf(experimentId);
    if (!ctx) { return esc(experimentId); }
    return esc(ctx.grouping.name) + ' › ' + esc(ctx.course.name);
  }

  /* The confirmed learning progression, drawn once and reused:
     Learning resources → Simulation → Assessment → Completion.
     PM-09 approved this model and STK31-36 only adds an axis to it. */
  function sequenceStrip(steps) {
    return '<ol class="seqstrip">' + steps.map(function (s, i) {
      return '<li class="sq ' + esc(s.tone || '') + '">' +
        '<span class="sq-n" aria-hidden="true">' + (i + 1) + '</span>' +
        '<span class="sq-b"><span class="sq-t">' + esc(s.title) + '</span>' +
        '<span class="sq-d">' + esc(s.detail) + '</span></span></li>';
    }).join('') + '</ol>';
  }

  /* Account/institution access state, shown at the top of every
     student screen where it applies. Nothing is deleted and nothing is
     renewable from here: renewal is an institutional action. */
  function accountNotice(student) {
    if (student.status !== 'active') {
      return ui.alertBox('warning', 'Your account is not active at the moment',
        '<p>Your institution has made your account inactive, so experiments cannot be opened. ' +
        'Everything you have already done is kept — nothing has been removed — and your learning ' +
        'becomes available again if your institution reactivates your account.</p>' +
        '<p style="margin-top:8px">Your institution administers this. There is nothing to do here.</p>',
        'status');
    }
    return '';
  }

  /* ============================================================
     THE SHARED QUESTION RENDERER.

     Faculty preview and the Student attempt render questions through
     THIS function and no other. That shared code path is what makes
     "preview shows what the student receives" a structural fact rather
     than a claim two implementations have to keep agreeing on.

     opts.given      the answer already recorded (attempt only)
     opts.readOnly   render inert controls — a preview never collects
                     an answer and never creates an attempt
     opts.showKey    AUTHORING CONTEXT ONLY. Marks the correct option
                     as authoring metadata. D-25 is absolute: this is
                     never passed on any Student-facing surface, and
                     the preview's student view never passes it either.
     ============================================================ */
  function questionBody(q, i, total, opts) {
    opts = opts || {};
    var given = opts.given;
    var ro = !!opts.readOnly;
    var dis = ro ? ' disabled' : '';
    var body;
    if (q.type === 'mcq') {
      body = (q.options || []).map(function (opt, oi) {
        var id = 'q-' + q.id + '-' + oi;
        var selected = given === oi;
        var isKey = opts.showKey && oi === q.answer;
        return '<div class="radiorow' + (selected ? ' is-selected' : '') + (isKey ? ' is-key' : '') + '">' +
          '<input type="radio" id="' + id + '" name="q-' + esc(q.id) + '"' +
          ' value="' + oi + '" data-q="' + esc(q.id) + '" data-kind="mcq"' +
          (selected ? ' checked' : '') + dis + '>' +
          '<label for="' + id + '">' + esc(opt) +
          (isKey ? ' <span class="keytag">' + ui.ic('check', 'sm') + 'Correct answer</span>' : '') +
          '</label></div>';
      }).join('');
    } else if (q.type === 'tf') {
      body = [['true', 'True', true], ['false', 'False', false]].map(function (pair) {
        var id = 'q-' + q.id + '-' + pair[0];
        var checked = given === pair[2];
        var isKey = opts.showKey && q.answer === pair[2];
        return '<div class="radiorow' + (checked ? ' is-selected' : '') + (isKey ? ' is-key' : '') + '">' +
          '<input type="radio" id="' + id + '" name="q-' + esc(q.id) + '"' +
          ' value="' + pair[0] + '" data-q="' + esc(q.id) + '" data-kind="tf"' +
          (checked ? ' checked' : '') + dis + '>' +
          '<label for="' + id + '">' + pair[1] +
          (isKey ? ' <span class="keytag">' + ui.ic('check', 'sm') + 'Correct answer</span>' : '') +
          '</label></div>';
      }).join('');
    } else {
      body = '<label class="sr-only" for="q-' + esc(q.id) + '">Your answer to question ' + (i + 1) + '</label>' +
        '<textarea id="q-' + esc(q.id) + '" data-q="' + esc(q.id) + '" data-kind="text" rows="5" ' +
        'placeholder="Write your answer here"' + dis + '>' + esc(given || '') + '</textarea>' +
        (q.guidance ? '<p class="hint">' + esc(q.guidance) + '</p>' : '');
    }
    /* A written answer carries no automatic mark — it is evaluated
       separately — so quoting a mark figure beside it would promise a
       score that the total on the result screen never includes. */
    var pts = q.points || 1;
    var kindLabel = q.type === 'mcq' ? 'Multiple choice · ' + pts + ' ' + util.plural(pts, 'mark')
      : q.type === 'tf' ? 'True or false · ' + pts + ' ' + util.plural(pts, 'mark')
      : 'Written answer · reviewed by your faculty, not marked automatically';
    return '<section class="qcard" id="qn-' + esc(q.id) + '" aria-labelledby="ql-' + esc(q.id) + '">' +
      '<fieldset class="fgroup"' + dis + '>' +
      '<legend id="ql-' + esc(q.id) + '">' +
      '<span class="q-n">Question ' + (i + 1) + ' of ' + total + '</span>' +
      '<span class="q-k">' + kindLabel + '</span>' +
      '<span class="q-t">' + esc(q.text) + '</span>' +
      '</legend>' +
      '<div class="q-b">' + body + '</div>' +
      '</fieldset></section>';
  }

  /* ⚠ WHICH MARKS THE PASS MARK IS MEASURED ON.
     `recomputeAttempt()` applies the pass mark to the WHOLE assessment
     once the Faculty review is complete — the automatically marked
     questions plus the marks the Faculty awarded for the written
     answers. So "n% of the marked questions" told a Student with a
     written answer something the engine does not do: they could answer
     every marked question correctly and still not pass. The disclosure
     has to state the basis actually used, which depends on what the
     assessment is made of. */
  function passBasisText(descCount, objectivePoints) {
    if (!descCount) { return 'of the marked questions'; }
    if (!objectivePoints) {
      /* Nothing here is machine scored, so there is no "marked
         questions" half to add. */
      return 'of the marks your faculty award for the written ' + util.plural(descCount, 'answer');
    }
    return 'of the whole assessment — the marked questions plus the marks your faculty award for the ' +
      'written ' + util.plural(descCount, 'answer');
  }

  /* The generated pre-attempt disclosure. Every figure comes from the
     assessment configuration; none is invented by a screen. Faculty
     preview renders the same rows a Student is shown. */
  function disclosureRows(asm, opts) {
    opts = opts || {};
    var counts = {};
    asm.questions.forEach(function (q) { counts[q.type] = (counts[q.type] || 0) + 1; });
    var descCount = counts.descriptive || 0;
    var objPoints = data.objectivePoints(asm);
    var typeLine = [];
    if (counts.mcq) { typeLine.push(counts.mcq + ' multiple choice'); }
    if (counts.tf) { typeLine.push(counts.tf + ' true or false'); }
    if (descCount) { typeLine.push(descCount + ' written ' + util.plural(descCount, 'answer')); }
    var covers = opts.coversHTML || esc(opts.experimentName || '');
    return '<dl class="disclose">' +
      '<dt>Covers</dt><dd>' + covers + '</dd>' +
      '<dt>Questions</dt><dd>' + asm.questions.length +
        (typeLine.length ? ' — ' + esc(typeLine.join(', ')) : '') + '</dd>' +
      '<dt>To pass</dt><dd>' + asm.passMark + '% ' + passBasisText(descCount, objPoints) + '</dd>' +
      '<dt>Attempts</dt><dd>' + esc(opts.attemptsText ||
        ((asm.attemptLimit || 0) + ' ' + util.plural(asm.attemptLimit || 0, 'attempt') + ' allowed')) + '</dd>' +
      '<dt>Answers and explanations</dt><dd>' + esc(opts.releaseSentence || '') + '</dd>' +
      (descCount
        ? '<dt>Written ' + util.plural(descCount, 'answer') + '</dt><dd>' + esc(opts.descriptiveText ||
          ('The written ' + util.plural(descCount, 'answer') + ' ' + (descCount === 1 ? 'goes' : 'go') +
           ' to the faculty member for review before the result is complete. ' + (objPoints
             ? 'The marked questions are scored straight away.'
             : 'Nothing in this assessment is marked automatically, so the whole result comes from that ' +
               'review.'))) + '</dd>' : '') +
      '</dl>';
  }

  /* Time spent, only ever shown when a real interval was recorded. */
  function fmtDuration(seconds) {
    if (!seconds && seconds !== 0) { return '—'; }
    if (seconds < 60) { return seconds + ' ' + util.plural(seconds, 'second'); }
    var mins = Math.round(seconds / 60);
    if (mins < 60) { return mins + ' ' + util.plural(mins, 'minute'); }
    var hrs = Math.floor(mins / 60), rem = mins % 60;
    return hrs + ' ' + util.plural(hrs, 'hour') + (rem ? ' ' + rem + ' min' : '');
  }

  return {
    href: href, requireStudent: requireStudent,
    PROGRESS_META: PROGRESS_META,
    progressBadge: progressBadge, progressLabel: progressLabel,
    simBadge: simBadge, assessBadge: assessBadge, assessLabel: assessLabel,
    studentAssessState: studentAssessState,
    unavailableText: unavailableText, progressBar: progressBar,
    simulationSentence: simulationSentence, simLabel: simLabel,
    techStateChips: techStateChips,
    courseLine: courseLine, sequenceStrip: sequenceStrip,
    accountNotice: accountNotice, fmtDuration: fmtDuration,
    questionBody: questionBody, disclosureRows: disclosureRows
  };
})();

(function () {
  'use strict';

  var esc = XRSLP.util.esc;
  var util = XRSLP.util;
  var ui = XRSLP.ui;
  var data = XRSLP.data;
  var state = XRSLP.state;
  var L = XRSLP.studentUI;

  /* ============================================================
     #/learn — PROTOTYPE-ONLY student resolution.

     Real authentication is a later build item (U-AUTH-01 / U-AUTH-06).
     Until it exists, the prototype needs a way to say WHICH real
     student record it is viewing as. This screen is that, and it says
     so plainly. It is not a sign-in, not an account switcher, and it
     grants nothing: every student listed is an existing TenantUser
     record created through Implementation 02.
     ============================================================ */
  XRSLP.screens.learnHome = function () {
    var chosen = state.protoStudent();
    if (chosen) { return { redirect: L.href.home(chosen.id) }; }

    var sc = state.scenario();
    var tenants = state.tenants();
    /* The scenario's own tenant first — that is "the current Tenant". */
    var scenarioTenant = null;
    if (sc.seedTenantId) { scenarioTenant = state.tenantById(sc.seedTenantId); }
    if (!scenarioTenant) {
      scenarioTenant = tenants.filter(function (t) {
        return t.name.toLowerCase() === sc.institution.name.toLowerCase();
      })[0] || null;
    }
    var ordered = tenants.slice().sort(function (a, b) {
      if (scenarioTenant && a.id === scenarioTenant.id) { return -1; }
      if (scenarioTenant && b.id === scenarioTenant.id) { return 1; }
      return a.name < b.name ? -1 : 1;
    });

    var anyStudents = false;
    var blocks = ordered.map(function (t) {
      var students = state.studentsForTenant(t.id);
      if (!students.length) { return ''; }
      anyStudents = true;
      var rows = students.map(function (p) {
        var effective = state.getEffectiveStudentEntitlements(p.id).length;
        var all = state.entitlementsForStudent(p.id).length;
        var mem = state.studentCourseMembership(p.id);
        return '<li class="pickrow">' +
          '<div class="pk-body">' +
          '<div class="pk-n">' + esc(p.name) +
          (p.status === 'active' ? '' : ' ' + ui.badge('b-neutral', 'minus', 'Inactive')) + '</div>' +
          '<div class="pk-m">' + esc(p.studentId || '') +
          (mem && mem.course ? ' · ' + esc(mem.course.name) : '') + '</div>' +
          '<div class="pk-e">' + effective + ' effective ' + util.plural(effective, 'entitlement') +
          (all > effective ? ' · ' + (all - effective) + ' not currently effective' : '') + '</div>' +
          '</div>' +
          '<button class="btn sm sec" type="button" data-pick="' + esc(p.id) + '">View as this student</button>' +
          '</li>';
      }).join('');
      return ui.card(esc(t.name),
        '<ul class="picklistr">' + rows + '</ul>',
        students.length + ' ' + util.plural(students.length, 'student'), 'h2');
    }).join('');

    var body;
    if (!anyStudents) {
      body = '<div class="tablecard">' + ui.emptyState({
        icon: 'users',
        title: 'No student records exist yet',
        body: 'A student workspace can only be opened for a real student record. Students are created ' +
          'by the Tenant Admin — manually or through a CSV import — before any of them can be assigned an experiment.',
        actionsHTML: '<a class="btn pri" href="#/tenant">Open the Tenant Admin workspace</a>'
      }) + '</div>';
    } else {
      body = '<div class="stack">' + blocks + '</div>';
    }

    var html =
      ui.phead('Choose a student to view as',
        'Prototype-only. Sign-in is not built in this prototype.') +
      '<div class="stack">' +
      ui.protoNote(
        '<p><strong>This screen is not part of the product.</strong> The real platform resolves the ' +
        'signed-in person and their workspace; authentication and workspace resolution are a later build item. ' +
        'Every student below is a real record created in the Tenant Admin workspace — nothing here is invented, ' +
        'and choosing one grants no access. What that student can see still comes only from what has been ' +
        'assigned to them.</p>') +
      body + '</div>';

    return {
      area: 'learn', title: 'Choose a student', html: html, student: null, tenant: null, navKey: null,
      after: function () {
        Array.prototype.slice.call(document.querySelectorAll('[data-pick]')).forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = btn.getAttribute('data-pick');
            state.setProtoStudent(id);
            var p = state.personById(id);
            XRSLP.router.go(L.href.home(id));
            ui.toast('Now viewing as ' + (p ? p.name : 'the selected student') + ' (prototype only).', 'info');
          });
        });
      }
    };
  };

  /* ============================================================
     STUDENT HOME
     ============================================================ */
  XRSLP.screens.studentHome = function (params) {
    var r = L.requireStudent(params, 'home');
    if (!r.student) { return r.fail; }
    var p = r.student, tenant = r.tenant;

    var mem = state.studentCourseMembership(p.id);
    var summary = state.studentProgressSummary(p.id);
    var past = state.studentPastExperiments(p.id);

    /* "Continue learning" points at real work in progress, and only
       exists when there is some. */
    var inProgress = summary.items.filter(function (it) {
      return it.progress.status === state.TECH_PROGRESS.IN_PROGRESS ||
             it.progress.status === state.TECH_PROGRESS.PENDING_REVIEW;
    }).sort(function (a, b) {
      var x = a.progress.lastActivityAt || '', y = b.progress.lastActivityAt || '';
      return x < y ? 1 : x > y ? -1 : 0;
    });
    var resume = inProgress[0] || null;

    var statItems = [
      { label: 'Experiments available to you', value: summary.entitled },
      { label: 'In progress', value: summary.inProgress },
      { label: 'Completed', value: summary.completed }
    ];
    if (summary.awaiting > 0) {
      statItems.push({ label: 'Pending Faculty review', value: summary.awaiting, tone: 'warn' });
    }
    if (summary.awaitingRelease > 0) {
      statItems.push({ label: 'Result pending release', value: summary.awaitingRelease, tone: '' });
    }
    if (summary.unavailable > 0) {
      statItems.push({ label: 'Not currently available', value: summary.unavailable, tone: 'warn' });
    }
    var stats = '<div class="statgrid">' + statItems.map(function (it) {
      return '<div class="stat' + (it.tone ? ' ' + it.tone : '') + '">' +
        '<div class="s-k">' + esc(it.label) + '</div>' +
        '<div class="s-v tabular">' + esc(String(it.value)) + '</div></div>';
    }).join('') + '</div>';

    var whereCard = ui.card('Where you are studying',
      '<div class="kv">' +
      '<div class="k">Institution</div><div class="v">' + esc(tenant.name) + '</div>' +
      '<div class="k">Programme / department</div><div class="v">' +
      (mem && mem.grouping ? esc(mem.grouping.name) : '<span class="muted">Not recorded</span>') + '</div>' +
      '<div class="k">Course</div><div class="v">' +
      (mem && mem.course ? esc(mem.course.name) : '<span class="muted">Not recorded</span>') +
      (mem && mem.localCode ? ' <span class="muted">(' + esc(mem.localCode) + ')</span>' : '') + '</div>' +
      (mem && mem.semester ? '<div class="k">Semester</div><div class="v">' + esc(mem.semester) + '</div>' : '') +
      '<div class="k">Student ID</div><div class="v">' + esc(p.studentId || '—') + '</div>' +
      '</div>', null, 'h2');

    var actionCard;
    if (p.status !== 'active') {
      actionCard = '';
    } else if (summary.entitled === 0) {
      /* Implementation 06 — an experiment that is assigned but currently
         unavailable is not the same as one that was never assigned. The
         roll-up already counts the blocked ones, so the copy must not
         contradict the number beside it. */
      var blockedNow = state.studentExperiments(p.id).filter(function (row) { return !row.effective; });
      actionCard = ui.card('Your learning',
        ui.emptyState(blockedNow.length
          ? { icon: 'alertCirc', heading: 'h3',
              title: 'Nothing is available to you right now',
              body: blockedNow.length + ' ' + util.plural(blockedNow.length, 'experiment') + ' ' +
                (blockedNow.length === 1 ? 'has' : 'have') + ' been assigned to you but cannot be opened ' +
                'at the moment. ' + L.unavailableText(blockedNow[0].blockedBy) +
                ' Everything you have already done is kept.',
              actionsHTML: '<a class="btn sec sm" href="' + L.href.myLearning(p.id) + '">Open My Learning</a>' }
          : { icon: 'flask', heading: 'h3',
              title: 'No experiments have been assigned to you yet',
              body: 'Experiments appear here once your institution assigns them to you. Being enrolled on a ' +
                'course, or belonging to a study group, does not by itself make an experiment available.',
              actionsHTML: '<a class="btn sec sm" href="' + L.href.myLearning(p.id) + '">Open My Learning</a>' }
        ), null, 'h2');
    } else if (resume) {
      var ctx = data.contextOf(resume.row.experimentId);
      actionCard = ui.card('Continue where you left off',
        '<div class="resume">' +
        '<div class="rz-body">' +
        '<div class="rz-ctx">' + L.courseLine(resume.row.experimentId) + '</div>' +
        '<div class="rz-t">' + esc(ctx ? ctx.experiment.name : resume.row.experimentId) + '</div>' +
        '<div class="rz-s">' + esc(L.simulationSentence(resume.progress)) + '</div>' +
        (resume.progress.lastActivityAt
          ? '<div class="rz-m">Last activity ' + esc(util.fmtDateTime(resume.progress.lastActivityAt)) + '</div>' : '') +
        '</div>' +
        '<a class="btn pri" href="' + L.href.experiment(p.id, resume.row.experimentId) + '">Continue learning</a>' +
        '</div>', null, 'h2');
    } else {
      actionCard = ui.card('Your learning',
        '<p class="cardlede">' + summary.entitled + ' ' + util.plural(summary.entitled, 'experiment') +
        ' ' + (summary.entitled === 1 ? 'is' : 'are') + ' available to you' +
        (summary.completed ? ', and ' + summary.completed + ' ' + util.plural(summary.completed, 'is', 'are') +
          ' already complete' : '') + '.</p>' +
        '<div class="formact"><a class="btn pri" href="' + L.href.myLearning(p.id) + '">Open My Learning</a></div>',
        null, 'h2');
    }

    var pastNote = past.length
      ? ui.card('Earlier work',
          '<p class="cardlede">' + past.length + ' ' + util.plural(past.length, 'experiment') +
          ' you previously worked on ' + (past.length === 1 ? 'is' : 'are') +
          ' no longer available to you. Your record of that work is kept.</p>' +
          '<div class="formact"><a class="btn sec sm" href="' + L.href.progress(p.id) + '">See your progress</a></div>',
          null, 'h2')
      : '';

    var html =
      ui.phead('Hello, ' + p.name, esc(tenant.name)) +
      '<div class="stack">' +
      L.accountNotice(p) +
      (actionCard || '') +
      ui.card('Your learning at a glance', stats, null, 'h2') +
      whereCard +
      pastNote +
      '</div>';

    return {
      area: 'learn', title: 'Home — ' + p.name, html: html,
      student: p, tenant: tenant, navKey: 'home'
    };
  };

  /* ============================================================
     MY LEARNING — built ONLY from effective entitlement.
     ============================================================ */
  XRSLP.screens.studentMyLearning = function (params) {
    var r = L.requireStudent(params, 'my-learning');
    if (!r.student) { return r.fail; }
    var p = r.student, tenant = r.tenant;

    var rows = state.studentExperiments(p.id);
    var available = rows.filter(function (x) { return x.effective; });
    var blocked = rows.filter(function (x) { return !x.effective; });
    var past = state.studentPastExperiments(p.id);

    function card(row) {
      var ctx = data.contextOf(row.experimentId);
      var prog = state.experimentProgress(p.id, row.experimentId, row.technologies, { studentView: true });
      var name = ctx ? ctx.experiment.name : row.experimentId;
      var actionLabel =
        prog.status === state.TECH_PROGRESS.COMPLETED ? 'Review experiment' :
        prog.status === state.TECH_PROGRESS.NOT_STARTED ? 'Start learning' : 'Continue';
      return '<article class="lcard">' +
        '<div class="lc-head">' +
        '<div class="lc-ctx">' + L.courseLine(row.experimentId) + '</div>' +
        '<h3><a href="' + L.href.experiment(p.id, row.experimentId) + '">' + esc(name) + '</a></h3>' +
        '</div>' +
        '<p class="lc-sum">' + esc(ctx ? ctx.experiment.summary : '') + '</p>' +
        '<div class="lc-tech">' +
        '<div class="lc-lab">Your simulations</div>' +
        L.techStateChips(prog) +
        '</div>' +
        '<div class="lc-prog">' +
        '<div class="lc-pl"><span>' + esc(L.progressLabel(prog.status)) + '</span>' +
        '<span class="tabular">' + prog.percent + '%</span></div>' +
        L.progressBar(prog.percent, prog.percent + ' per cent of the learning steps for ' + name + ' complete') +
        '<p class="lc-roll">' + esc(L.simulationSentence(prog)) + '</p>' +
        '</div>' +
        '<div class="lc-foot">' +
        (prog.lastActivityAt
          ? '<span class="lc-when">Last activity ' + esc(util.fmtDate(prog.lastActivityAt)) + '</span>'
          : '<span class="lc-when muted">Not opened yet</span>') +
        '<a class="btn sm pri" href="' + L.href.experiment(p.id, row.experimentId) + '">' + esc(actionLabel) + '</a>' +
        '</div>' +
        '</article>';
    }

    /* A blocked entitlement is still an assignment: the technologies it
       covers are known, and so is the work already done under it. Showing
       the reason but hiding the work would be the same as losing it. */
    function blockedCard(row) {
      var ctx = data.contextOf(row.experimentId);
      var techs = row.technologies.concat(row.blockedTechnologies);
      var prog = state.experimentProgress(p.id, row.experimentId, techs, { studentView: true });
      var touched = state.hasActivity(p.id, row.experimentId);
      return '<article class="lcard blocked">' +
        '<div class="lc-head">' +
        '<div class="lc-ctx">' + L.courseLine(row.experimentId) + '</div>' +
        '<h3>' + esc(ctx ? ctx.experiment.name : row.experimentId) + '</h3>' +
        '</div>' +
        '<div class="lc-tech"><div class="lc-lab">' +
        (touched ? 'Your simulations' : 'Assigned in') + '</div>' +
        (touched ? L.techStateChips(prog) : '<div class="lc-chips">' + ui.techBadges(techs) + '</div>') +
        '</div>' +
        (touched
          ? '<div class="lc-prog">' +
            '<div class="lc-pl"><span>' + esc(L.progressLabel(prog.status)) + ' so far</span>' +
            '<span class="tabular">' + prog.percent + '%</span></div>' +
            L.progressBar(prog.percent, prog.percent + ' per cent of the learning steps complete') +
            '</div>' : '') +
        ui.alertBox('warning', 'Not available at the moment',
          '<p>' + esc(L.unavailableText(row.blockedBy)) + ' ' +
          (touched ? 'The work you have already done is kept exactly as it was.'
                   : 'Nothing has been removed.') + '</p>') +
        '</article>';
    }

    function pastCard(experimentId) {
      var ctx = data.contextOf(experimentId);
      var techs = state.technologiesWithActivity(p.id, experimentId);
      /* Historical: the assignment is gone, so the technology set it
         covered is unknown and no completion verdict can be claimed. */
      var prog = state.experimentProgress(p.id, experimentId, techs,
        { historical: true, studentView: true });
      return '<article class="lcard past">' +
        '<div class="lc-head">' +
        '<div class="lc-ctx">' + L.courseLine(experimentId) + '</div>' +
        '<h3>' + esc(ctx ? ctx.experiment.name : experimentId) + '</h3>' +
        '</div>' +
        '<p class="lc-sum">This experiment is no longer assigned to you, so it cannot be opened. ' +
        'What you did is kept exactly as it was.</p>' +
        (techs.length ? '<div class="lc-tech"><div class="lc-lab">You worked on</div>' +
          L.techStateChips(prog) + '</div>' : '') +
        (prog.lastActivityAt
          ? '<div class="lc-foot"><span class="lc-when">Last activity ' +
            esc(util.fmtDate(prog.lastActivityAt)) + '</span>' +
            '<a class="btn sm sec" href="' + L.href.progress(p.id) + '">See progress</a></div>' : '') +
        '</article>';
    }

    var body;
    if (!available.length && !blocked.length && !past.length) {
      body = '<div class="tablecard">' + ui.emptyState({
        icon: 'flask',
        title: 'No experiments have been assigned to you yet',
        body: 'Your institution decides which experiments you take and in which technologies. ' +
          'Nothing appears here until an experiment is assigned to you or to a group you belong to — ' +
          'being enrolled on a course is not the same thing.',
        actionsHTML: '<a class="btn sec" href="' + L.href.home(p.id) + '">Back to Home</a>'
      }) + '</div>';
    } else {
      body =
        (available.length
          ? '<section class="lsec" aria-labelledby="ml-avail">' +
            '<h2 id="ml-avail" class="lsec-h">Available to you' +
            '<span class="lsec-n">' + available.length + '</span></h2>' +
            '<div class="lgrid">' + available.map(card).join('') + '</div></section>'
          : '<section class="lsec" aria-labelledby="ml-avail">' +
            '<h2 id="ml-avail" class="lsec-h">Available to you</h2>' +
            '<div class="tablecard">' + ui.emptyState({
              icon: 'flask', heading: 'h3',
              title: 'Nothing is available to you right now',
              body: p.status !== 'active'
                ? 'Your account is not active at your institution, so no experiment can be opened.'
                : 'No experiment currently reaches you. Anything listed below is kept for your record.'
            }) + '</div></section>') +
        (blocked.length
          ? '<section class="lsec" aria-labelledby="ml-blocked">' +
            '<h2 id="ml-blocked" class="lsec-h">Not available at the moment' +
            '<span class="lsec-n">' + blocked.length + '</span></h2>' +
            '<p class="lsec-d">These experiments were assigned to you, but something about your account ' +
            'or your institution’s access means they cannot be opened right now.</p>' +
            '<div class="lgrid">' + blocked.map(blockedCard).join('') + '</div></section>'
          : '') +
        (past.length
          ? '<section class="lsec" aria-labelledby="ml-past">' +
            '<h2 id="ml-past" class="lsec-h">Earlier work' +
            '<span class="lsec-n">' + past.length + '</span></h2>' +
            '<p class="lsec-d">No longer assigned to you. Kept so your record stays complete.</p>' +
            '<div class="lgrid">' + past.map(pastCard).join('') + '</div></section>'
          : '');
    }

    var html =
      ui.phead('My Learning',
        'The experiments made available to you by ' + esc(tenant.name) + '.') +
      L.accountNotice(p) +
      (p.status !== 'active' ? '<div style="height:16px"></div>' : '') +
      body;

    return {
      area: 'learn', title: 'My Learning — ' + p.name, html: html,
      student: p, tenant: tenant, navKey: 'my-learning'
    };
  };

  /* ============================================================
     PROGRESS — derived from real actions, per technology.
     ============================================================ */
  XRSLP.screens.studentProgress = function (params) {
    var r = L.requireStudent(params, 'progress');
    if (!r.student) { return r.fail; }
    var p = r.student, tenant = r.tenant;

    var rows = state.studentExperiments(p.id);
    var live = rows.filter(function (x) { return x.effective; });
    /* Assigned but not currently usable — an inactive account, an access
       term that has ended, an allocation hold. These rows are NOT
       droppable: an inactive Student has no effective entitlement at all,
       so filtering to `live` alone would blank the whole Progress screen
       for exactly the person whose record the brief requires to survive. */
    var blocked = rows.filter(function (x) { return !x.effective; });
    var past = state.studentPastExperiments(p.id);
    var summary = state.studentProgressSummary(p.id);

    /* One experiment's block: the resource line, then one row per
       technology, then the roll-up. Three assigned technologies can
       never collapse into one state here. */
    function block(experimentId, technologies, opts) {
      opts = opts || {};
      var ctx = data.contextOf(experimentId);
      var prog = state.experimentProgress(p.id, experimentId, technologies,
        { historical: !!opts.past, studentView: true });
      var asm = state.assessmentForStudent(p.id, experimentId);
      var name = ctx ? ctx.experiment.name : experimentId;

      /* A technology the Student worked on but no longer holds must not
         vanish from their record — but it must not hold the roll-up back
         either, since it is no longer assigned. It is reported BESIDE the
         entitled rows, marked for what it is. */
      var retired = opts.past ? [] : state.technologiesWithActivity(p.id, experimentId)
        .filter(function (t) { return technologies.indexOf(t) === -1; });
      var retiredRows = retired.map(function (t) {
        var tp = state.technologyProgress(p.id, experimentId, t, { studentView: true });
        var sim = tp.simulation;
        return '<tr class="retired">' +
          '<td data-label="Technology">' + ui.fmtBadge(t) +
          '<div class="tsub">No longer available to you</div></td>' +
          '<td data-label="Simulation">' + L.simBadge(tp.simulationStatus) +
          (sim && sim.completedAt ? '<div class="tsub">' + esc(util.fmtDate(sim.completedAt)) + '</div>' : '') + '</td>' +
          '<td data-label="Time spent">' + (sim && sim.status === state.SIM_STATUS.COMPLETED
            ? esc(L.fmtDuration(sim.timeSpentSeconds)) : '<span class="muted">—</span>') + '</td>' +
          '</tr>';
      }).join('');

      /* Only the SIMULATION differs by technology, so that is the ONLY
         thing this table reports per technology. The shared
         Experiment-level state — learning resources, the assessment and
         the overall roll-up — sits above it. Mixing them produced rows
         that contradicted themselves: "Simulation: Completed" beside
         "This technology: In progress", and an untouched AR simulation
         labelled in progress because the shared assessment had moved. */
      var techRows = prog.technologies.map(function (t) {
        var sim = t.simulation;
        return '<tr>' +
          '<td data-label="Technology">' + ui.fmtBadge(t.technology) +
          '<span class="sr-only">' + esc(data.TECHNOLOGIES[t.technology].name) + '</span></td>' +
          '<td data-label="Simulation">' + L.simBadge(t.simulationStatus) +
          (sim && sim.completedAt
            ? '<div class="tsub">' + esc(util.fmtDate(sim.completedAt)) + '</div>' : '') + '</td>' +
          '<td data-label="Time spent">' + (sim && sim.status === state.SIM_STATUS.COMPLETED
            ? esc(L.fmtDuration(sim.timeSpentSeconds)) : '<span class="muted">—</span>') + '</td>' +
          '</tr>';
      }).join('');

      /* The two Experiment-level lines: resources and the assessment.

         ⚠ THE SCORE SHOWN HERE MUST AGREE WITH THE RESULT SCREEN.
         Once Faculty have marked every written answer, `score.percent`
         becomes the WHOLE-assessment figure — so the old wording
         ("on the marked questions") stopped being true, and printing it
         at all would leak a combined result the visibility policy is
         still withholding on the result screen. Both are fixed here by
         asking the same question the result screen asks. */
      var assessState = L.studentAssessState(p.id, experimentId);
      var lastAtt = state.latestSubmittedAttempt(p.id, experimentId);
      /* NO FIGURE OF ANY KIND while the result is withheld — not the
         combined score and not the objective sub-score either. The one
         release decision decides it, so this screen cannot disagree with
         the result screen. */
      var scoreBit = '';
      if (state.scoreWithheld(p.id, experimentId)) {
        var relAt = state.releaseFor(state.latestSubmittedAttempt(p.id, experimentId));
        scoreBit = relAt.releaseAt
          ? ' · <span class="muted">available ' + esc(util.fmtDate(relAt.releaseAt)) + '</span>' : '';
      } else if (lastAtt && lastAtt.score && lastAtt.score.percent !== null) {
        scoreBit = ' · <span class="tabular">' + lastAtt.score.percent + '% ' +
          (lastAtt.score.includesReview ? 'overall, including your faculty’s marks'
                                        : 'on the marked questions') + '</span>';
      }
      var assessLine = asm
        ? '<div class="pg-res">' + ui.ic('doc', 'sm') +
          '<span>Assessment — <strong>' + esc(L.assessLabel(assessState)) + '</strong>' + scoreBit +
          ' <span class="muted">· one assessment for this experiment</span></span></div>'
        : '';

      return '<section class="pgblock' + (opts.past ? ' past' : '') + '" aria-labelledby="pg-' + esc(experimentId) + '">' +
        '<div class="pg-head">' +
        '<div class="pg-t">' +
        '<div class="pg-ctx">' + L.courseLine(experimentId) + '</div>' +
        '<h3 id="pg-' + esc(experimentId) + '">' +
        (opts.past ? esc(name) :
          '<a href="' + L.href.experiment(p.id, experimentId) + '">' + esc(name) + '</a>') + '</h3>' +
        '</div>' +
        '<div class="pg-badge">' + (opts.past
          ? ui.badge('b-neutral', 'clock', 'No longer assigned')
          : L.progressBadge(prog.status)) + '</div>' +
        '</div>' +
        '<div class="pg-body">' +
        (opts.past ? '<p class="pg-note">' + ui.ic('info', 'sm') +
          'No longer assigned to you. This is the record of what you did — not a completion result, ' +
          'because the technologies it was assigned in are no longer known.</p>' : '') +
        (opts.blockedReason ? '<div style="margin-bottom:14px">' + ui.alertBox('warning',
          'Not available at the moment',
          '<p>' + esc(L.unavailableText(opts.blockedReason)) +
          ' Everything below is kept exactly as it was.</p>') + '</div>' : '') +
        (prog.historical
          ? '<div class="pg-overall">' +
            '<div class="lc-pl"><span>' + esc(L.simulationSentence(prog)) + '</span></div></div>'
          : '<div class="pg-overall">' +
            '<div class="lc-pl"><span>Overall experiment — ' + esc(L.progressLabel(prog.status)) + '</span>' +
            '<span class="tabular">' + prog.steps.done + ' of ' + prog.steps.total + ' steps · ' +
            prog.percent + '%</span></div>' +
            L.progressBar(prog.percent, prog.percent + ' per cent of the learning steps for ' + name + ' complete') +
            '<p class="pg-roll">' + esc(L.simulationSentence(prog)) + '</p>' +
            '</div>') +
        '<div class="pg-res">' + ui.ic('book', 'sm') +
        '<span>Learning resources — <strong>' + prog.resources.completed + ' of ' +
        prog.resources.total + '</strong> marked as done' +
        '</span></div>' +
        assessLine +
        (techRows || retiredRows
          ? '<div class="tscroll"><table class="dt"><caption class="sr-only">Progress per technology for ' +
            esc(name) + '</caption>' +
            '<thead><tr><th scope="col">Technology</th><th scope="col">Simulation</th>' +
            '<th scope="col">Time spent</th></tr></thead><tbody>' + techRows + retiredRows +
            '</tbody></table></div>' +
            (retiredRows ? '<p class="pg-note">' + ui.ic('info', 'sm') +
              'A technology marked <strong>past activity</strong> is no longer available to you. ' +
              'Your record of it is kept, and it does not count towards completing this experiment.</p>' : '')
          : '<p class="pg-note">' + ui.ic('info', 'sm') + 'No technology recorded for this experiment.</p>') +
        '</div></section>';
    }

    var body;
    if (!live.length && !blocked.length && !past.length) {
      body = '<div class="tablecard">' + ui.emptyState({
        icon: 'bars',
        title: 'No progress to show yet',
        body: 'Your progress appears here once experiments have been assigned to you and you start working ' +
          'through them.',
        actionsHTML: '<a class="btn sec" href="' + L.href.myLearning(p.id) + '">Open My Learning</a>'
      }) + '</div>';
    } else {
      var stats = '<div class="statgrid">' + [
        { label: 'Available to you', value: summary.entitled },
        { label: 'Not started', value: summary.notStarted },
        { label: 'In progress', value: summary.inProgress },
        { label: 'Pending Faculty review', value: summary.awaiting, tone: summary.awaiting ? 'warn' : '' },
        { label: 'Result pending release', value: summary.awaitingRelease, tone: '' },
        { label: 'Completed', value: summary.completed }
      ].map(function (it) {
        return '<div class="stat' + (it.tone ? ' ' + it.tone : '') + '">' +
          '<div class="s-k">' + esc(it.label) + '</div>' +
          '<div class="s-v tabular">' + esc(String(it.value)) + '</div></div>';
      }).join('') + '</div>';

      body = '<div class="stack">' +
        (live.length ? ui.card('Across your learning', stats, null, 'h2') : '') +
        (live.length
          ? '<section class="lsec" aria-labelledby="pg-current"><h2 id="pg-current" class="lsec-h">Current experiments' +
            '<span class="lsec-n">' + live.length + '</span></h2>' +
            '<div class="stack">' + live.map(function (row) {
              return block(row.experimentId, row.technologies);
            }).join('') + '</div></section>'
          : '') +
        (blocked.length
          ? '<section class="lsec" aria-labelledby="pg-blocked"><h2 id="pg-blocked" class="lsec-h">' +
            'Not available at the moment<span class="lsec-n">' + blocked.length + '</span></h2>' +
            '<p class="lsec-d">Still assigned to you, but not openable right now. Your record is unchanged.</p>' +
            '<div class="stack">' + blocked.map(function (row) {
              return block(row.experimentId,
                row.technologies.concat(row.blockedTechnologies),
                { blockedReason: row.blockedBy });
            }).join('') + '</div></section>'
          : '') +
        (past.length
          ? '<section class="lsec" aria-labelledby="pg-past"><h2 id="pg-past" class="lsec-h">Earlier work' +
            '<span class="lsec-n">' + past.length + '</span></h2>' +
            '<p class="lsec-d">Kept for your record. These experiments are no longer assigned to you.</p>' +
            '<div class="stack">' + past.map(function (eid) {
              return block(eid, state.technologiesWithActivity(p.id, eid), { past: true });
            }).join('') + '</div></section>'
          : '') +
        ui.card('How progress is worked out',
          '<p class="cardlede">Each experiment has a number of learning steps: every learning resource counts ' +
          'once, and each technology you are assigned adds its simulation and, where one is set, its assessment. ' +
          'The percentage is the steps you have completed out of that total.</p>' +
          '<ul class="rulelist">' +
          '<li>' + ui.ic('book', 'sm') + '<span>Learning resources do not stop you opening a simulation — you can ' +
          'start whenever you like — but an experiment is not counted as complete until they are all marked as ' +
          'done. An experiment with no resources is never held up by this.</span></li>' +
          '<li>' + ui.ic('doc', 'sm') + '<span>There is <strong>one assessment for the experiment</strong>, ' +
          'however many technologies you are given. You never sit the same assessment twice because your ' +
          'institution licensed two of them.</span></li>' +
          '<li>' + ui.ic('check', 'sm') + '<span>A technology is <strong>completed</strong> when the learning ' +
          'resources are done, its simulation is complete, and the experiment&rsquo;s assessment, if there ' +
          'is one, is passed.</span></li>' +
          '<li>' + ui.ic('check', 'sm') + '<span>An experiment is <strong>completed</strong> only when ' +
          '<strong>every</strong> technology assigned to you is completed. Finishing one of two does not ' +
          'complete the experiment. <em>This last rule is how this prototype calculates the roll-up; it is ' +
          'not confirmed product policy.</em></span></li>' +
          '<li>' + ui.ic('clock', 'sm') + '<span>Nothing is ever counted as complete while a written answer ' +
          'is still pending Faculty review.</span></li>' +
          '</ul>', null, 'h2') +
        '</div>';
    }

    var html =
      ui.phead('Progress', 'Your work across the experiments assigned to you by ' + esc(tenant.name) + '.') +
      L.accountNotice(p) +
      (p.status !== 'active' ? '<div style="height:16px"></div>' : '') +
      body;

    return {
      area: 'learn', title: 'Progress — ' + p.name, html: html,
      student: p, tenant: tenant, navKey: 'progress'
    };
  };
})();
