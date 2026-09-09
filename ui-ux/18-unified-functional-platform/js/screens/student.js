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

  /* ============================================================
     ⚠ THE COMPLETION-CONFIRMATION CAVEAT — OWNED IN ONE PLACE.

     Implementation 07.3 (R10). This note already existed, but it lived on
     the simulation screen alone. Every OTHER student surface asserted a
     completion without it: a "Completion recorded" badge and a
     "Completion" sequence step on the Experiment page, a completion
     percentage, "Completed" on a card and in a roll-up. A reader who
     never opened the simulation page was therefore shown a completion as
     a settled fact — which is exactly the claim the platform cannot make
     yet. The wording is owned here so every screen that asserts a
     completion renders the SAME sentence, and so it can never drift.

     ⚠ THE CLAIM DOES NOT VARY, AND NAMES NOTHING.
     No verb, endpoint, payload, provider, event name or screenshot rule
     appears below, because none has been chosen. Naming one would invent
     the very decision this note exists to say is still open. Only the
     closing sentence changes, and only to say where the completions on
     THAT screen actually came from.

     `control`  — the screen carries the prototype control itself.
     `figures`  — the screen only reports completions recorded elsewhere.
     ============================================================ */
  var COMPLETION_GAP_CLAIM =
    'How a finished run is confirmed back to the platform is <strong>not settled</strong>. An API or ' +
    'event call between the experiment runtime and the platform has been discussed and is the expected ' +
    'direction, but no contract, endpoint, payload or provider has been chosen, and none is built here. ';
  var COMPLETION_GAP_CLOSING = {
    control: 'The control on this page is a prototype stand-in so the learning journey can be shown end to end.',
    figures: 'Every completion shown on this page was recorded through that prototype control on the ' +
      'simulation page — none of it was reported by the experiment.'
  };
  function completionGapNote(kind) {
    return ui.gapNote('COMPLETION CONFIRMATION NOT DECIDED',
      COMPLETION_GAP_CLAIM + (COMPLETION_GAP_CLOSING[kind] || COMPLETION_GAP_CLOSING.figures));
  }

  /* ⚠ THE SAME TRUTH, OUT OF THE STUDENT'S WAY (Implementation 08).

     How a simulation reports completion is genuinely undecided, and
     nothing here pretends otherwise — but a dashed engineering panel
     with the words COMPLETION CONFIRMATION NOT DECIDED across it, on
     the page a student uses to study, is a build note wearing the
     product's clothes. The stakeholder reads it before they read the
     product.

     So the statement is kept in full and folded away: closed by
     default, one quiet line, product language, and honest. It does NOT
     claim an integration that does not exist, and it does not claim
     one is coming. `completionGapNote` remains for surfaces where the
     engineering framing is the point — the audit documents cite it. */
  function completionNote(kind) {
    return ui.about('How completion is recorded',
      '<p>A simulation runs outside this platform, and how it reports back that a student ' +
      'finished has <strong>not been decided yet</strong> — so nothing on this page was reported by ' +
      'the experiment itself.</p>' +
      '<p>' + esc(kind === 'control'
        ? 'The control on the simulation page is a stand-in, so the learning journey can be followed ' +
          'from end to end while that decision is open.'
        : 'Every completion shown here was recorded through that stand-in control on the simulation ' +
          'page.') + '</p>');
  }

  /* Does a screen actually ASSERT a completion? A list of experiments
     none of which has been finished claims nothing, and the stakeholder
     asked for less on these screens, not more — so the caveat is rendered
     where a completion is stated and nowhere else. `items` is the shape
     `state.studentProgressSummary().items` returns. */
  function assertsCompletion(items) {
    return items.some(function (it) {
      var prog = it.progress || it;
      if (prog.status === state.TECH_PROGRESS.COMPLETED) { return true; }
      return (prog.technologies || []).some(function (t) {
        return t.simulationStatus === state.SIM_STATUS.COMPLETED;
      });
    });
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
    completionGapNote: completionGapNote, completionNote: completionNote,
    assertsCompletion: assertsCompletion,
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

     ⚠ 07.3 (R09) — WHAT THIS SCREEN HAD TO STOP DOING.
     Home never LISTED a single experiment. In the resume state the only
     link in its main region was the one experiment already in progress;
     everything else the Student was entitled to sat behind a number on a
     stat tile that led nowhere, reachable only through the left nav rail.
     Three cards of counts and explanation stood above no actual way in —
     which is what the stakeholder read as "too much content".

     So Home is now a LIST of what the Student may open, every row opening
     its experiment directly, ordered so work that can be picked up or
     started sits at the top and finished work falls to the bottom.

     ⚠ THE STAT GRID IS GONE, NOT HIDDEN — AND NOTHING IT COUNTED IS.
     Every state those tiles counted is now stated where it belongs: a
     progress badge on each experiment's own row, a section of its own for
     blocked entitlements and for earlier work, and one line of counts in
     words under the list. A number that names a state you can now see on
     the row itself is duplication, and duplication is what made this
     screen long. What is NOT allowed to disappear is entitlement truth —
     see the blocked section below.

     ⚠ SIMPLIFICATION MUST NEVER TURN "NOT ENTITLED" INTO SILENCE.
     An experiment that is assigned but not openable is not the same as
     one that was never assigned, and dropping it would read to the
     Student as the latter. It therefore gets its own section, with the
     same reason sentence the rest of the workspace uses, and — because
     there is genuinely nothing to open — no control at all rather than a
     disabled one.
     ============================================================ */
  /* ============================================================
     STUDENT HOME — REBUILT (Implementation 08).

     ── THE PROBLEM THIS REPLACES ────────────────────────────────
     Home rendered "Continue where you left off" with a **Continue
     learning** button, and then, directly underneath, "Your
     experiments" — a list whose first row was THE SAME EXPERIMENT with
     its own **Continue** button. My Learning then showed it a third
     time. The old code said so in a comment: "It repeats a row from the
     list below on purpose."

     It is not a copy-writing problem and renaming the buttons does not
     fix it. Two controls of equal weight, side by side, doing exactly
     the same thing, is a page that has not decided what it is for.

     ── WHAT THIS PAGE IS FOR ────────────────────────────────────
     Four questions, in this order:
       1. What should I do next?      -> ONE featured action, and only one
       2. Is anything waiting for me? -> the attention list, when non-empty
       3. How am I progressing?       -> the compact figures
       4. What else do I have?        -> the rest, WITHOUT the featured item
     Then, quietly, where the student studies.

     ── THE RULE THAT MAKES IT WORK ──────────────────────────────
     `featured` is REMOVED from `others` (see `others` below). One
     experiment therefore renders exactly ONE card and exactly ONE
     control, never a hero plus its own duplicate row. This is asserted
     in qa/checks.js so it cannot regress.
     ============================================================ */
  XRSLP.screens.studentHome = function (params) {
    var r = L.requireStudent(params, 'home');
    if (!r.student) { return r.fail; }
    var p = r.student, tenant = r.tenant;

    var mem = state.studentCourseMembership(p.id);
    var summary = state.studentProgressSummary(p.id);
    var past = state.studentPastExperiments(p.id);
    /* Assigned, but not currently openable. Same read model My Learning
       uses — there is no second source of truth. */
    var blocked = state.studentExperiments(p.id).filter(function (row) { return !row.effective; });
    var active = p.status === 'active';

    function nameOf(experimentId) {
      var c = data.contextOf(experimentId);
      return c ? c.experiment.name : experimentId;
    }

    /* THE ORDER OF THE LIST IS THE POINT OF THE LIST. Work that can be
       picked up comes first, then work not started; states waiting on
       somebody else, and work already finished, sink. Within a rank the
       most recently touched comes first, then alphabetically, so the
       order is stable between renders — and so the FEATURED item is
       deterministic rather than whichever the read model happened to
       return first. */
    var RANK = {};
    RANK[state.TECH_PROGRESS.IN_PROGRESS] = 0;
    RANK[state.TECH_PROGRESS.NOT_STARTED] = 1;
    RANK[state.TECH_PROGRESS.PENDING_REVIEW] = 2;
    RANK[state.TECH_PROGRESS.RESULT_WITHHELD] = 3;
    RANK[state.TECH_PROGRESS.COMPLETED] = 4;
    function rankOf(it) {
      var v = RANK[it.progress.status];
      return v === undefined ? 5 : v;
    }
    var ordered = summary.items.slice().sort(function (a, b) {
      var d = rankOf(a) - rankOf(b);
      if (d !== 0) { return d; }
      var x = a.progress.lastActivityAt || '', y = b.progress.lastActivityAt || '';
      if (x !== y) { return x < y ? 1 : -1; }
      var na = nameOf(a.row.experimentId), nb = nameOf(b.row.experimentId);
      return na < nb ? -1 : na > nb ? 1 : 0;
    });

    /* ⚠ THE ANTI-DUPLICATION RULE, IN ONE LINE.
       Everything below the featured card is drawn from `others`, and
       `others` is the ordered list MINUS the featured item. There is no
       other path by which an experiment can reach this page twice. */
    var featured = active && ordered.length ? ordered[0] : null;
    var others = featured ? ordered.slice(1) : ordered;

    /* The verb matches what pressing it does, and the WEIGHT matches
       whether there is anything to do. "Review" for finished work is not
       a euphemism for "start again"; a state that is waiting on somebody
       else gets a secondary control, because pressing it changes
       nothing the student controls. */
    var ACTION = {};
    ACTION[state.TECH_PROGRESS.IN_PROGRESS]    = { label: 'Continue',       primary: true  };
    ACTION[state.TECH_PROGRESS.NOT_STARTED]    = { label: 'Start learning', primary: true  };
    ACTION[state.TECH_PROGRESS.PENDING_REVIEW] = { label: 'Open',           primary: false };
    ACTION[state.TECH_PROGRESS.RESULT_WITHHELD]= { label: 'Open',           primary: false };
    ACTION[state.TECH_PROGRESS.COMPLETED]      = { label: 'Review',         primary: false };
    function actionFor(status) { return ACTION[status] || { label: 'Open', primary: false }; }

    /* What the featured card is FOR, said in its own words. A student
       whose only remaining work is waiting on a Faculty member is told
       that, rather than being shown a primary button that achieves
       nothing. */
    var LEAD = {};
    LEAD[state.TECH_PROGRESS.IN_PROGRESS]     = 'Continue where you left off';
    LEAD[state.TECH_PROGRESS.NOT_STARTED]     = 'Start here';
    LEAD[state.TECH_PROGRESS.PENDING_REVIEW]  = 'Waiting on your Faculty';
    LEAD[state.TECH_PROGRESS.RESULT_WITHHELD] = 'Result not released yet';
    LEAD[state.TECH_PROGRESS.COMPLETED]       = 'You have finished everything assigned to you';

    /* ---------- 1 · the one featured action ---------- */
    var focusCard = '';
    if (featured) {
      var fp = featured.progress;
      var fid = featured.row.experimentId;
      var act = actionFor(fp.status);
      focusCard =
        '<section class="focus' + (act.primary ? '' : ' quiet') + '" aria-labelledby="focus-t">' +
        '<div class="fc-k">' + esc(LEAD[fp.status] || 'Up next') + '</div>' +
        '<div class="fc-ctx">' + L.courseLine(fid) + '</div>' +
        '<h2 class="fc-t" id="focus-t">' +
        '<a href="' + L.href.experiment(p.id, fid) + '">' + esc(nameOf(fid)) + '</a></h2>' +
        '<p class="fc-s">' + esc(L.simulationSentence(fp)) + '</p>' +
        (fp.percent
          ? '<div class="fc-p">' +
            '<div class="lc-pl"><span>' + esc(L.progressLabel(fp.status)) + '</span>' +
            '<span class="tabular">' + fp.percent + '%</span></div>' +
            L.progressBar(fp.percent, fp.percent + ' per cent of the learning steps for ' +
              nameOf(fid) + ' complete') + '</div>'
          : '') +
        '<div class="fc-a">' +
        '<a class="btn ' + (act.primary ? 'pri lg' : 'sec') + '" href="' +
          L.href.experiment(p.id, fid) + '">' + esc(act.label) + '</a>' +
        (fp.lastActivityAt
          ? '<span class="fc-when">Last activity ' + esc(util.fmtDateTime(fp.lastActivityAt)) + '</span>'
          : '<span class="fc-when">Not opened yet</span>') +
        '</div></section>';
    }

    /* ---------- 2 · anything waiting ----------
       Only states that actually occur are listed. A row of zeroes is
       noise, and a "0 waiting" row is worse than none. */
    var waiting = [];
    if (summary.awaiting) {
      waiting.push({ icon: 'clock', tone: '',
        t: summary.awaiting + ' ' + util.plural(summary.awaiting, 'answer') + ' with your Faculty',
        d: 'Written answers are marked by a person, so this is not instant.' });
    }
    if (summary.awaitingRelease) {
      waiting.push({ icon: 'shield', tone: '',
        t: summary.awaitingRelease + ' ' + util.plural(summary.awaitingRelease, 'result') +
          ' not released yet',
        d: 'Your Faculty decides when results are shown.' });
    }
    if (blocked.length) {
      waiting.push({ icon: 'alert', tone: 'warn',
        t: blocked.length + ' ' + util.plural(blocked.length, 'experiment') + ' not available',
        d: 'Still assigned to you, and everything you have done is kept. Your institution administers this.',
        href: L.href.myLearning(p.id), a: 'See why' });
    }
    var waitingCard = waiting.length
      ? ui.card('Waiting for you',
          '<ul class="attn">' + waiting.map(function (w) {
            return '<li class="at-row' + (w.tone ? ' ' + w.tone : '') + '">' +
              '<span class="at-ic">' + ui.ic(w.icon) + '</span>' +
              '<div class="at-body"><div class="at-t">' + esc(w.t) + '</div>' +
              '<p>' + esc(w.d) + '</p></div>' +
              (w.href ? '<a class="btn sec sm" href="' + w.href + '">' + esc(w.a) + '</a>' : '') +
              '</li>';
          }).join('') + '</ul>', null, 'h2')
      : '';

    /* ---------- 3 · the figures ----------
       Compact, and only the states that exist. */
    var stats = [];
    if (summary.inProgress) { stats.push({ v: summary.inProgress, k: 'In progress' }); }
    if (summary.notStarted) { stats.push({ v: summary.notStarted, k: 'Not started' }); }
    if (summary.awaiting) { stats.push({ v: summary.awaiting, k: 'With Faculty' }); }
    if (summary.awaitingRelease) { stats.push({ v: summary.awaitingRelease, k: 'Result pending' }); }
    if (summary.completed) { stats.push({ v: summary.completed, k: 'Completed' }); }
    var statsBlock = stats.length > 1
      ? ui.statStrip(stats.map(function (x) {
          return { v: x.v, k: x.k, href: L.href.progress(p.id) };
        }))
      : '';

    /* ---------- 4 · everything else ----------
       Secondary by construction: compact rows, secondary controls, and
       the featured experiment is NOT among them. With one experiment
       assigned this section does not exist at all. */
    /* ⚠ THE SECONDARY ROWS ALL SAY "OPEN", DELIBERATELY.

       Their verb used to match the featured card's — so a student with
       five experiments none of which they had started read the words
       "Start learning" five times down one page, once in a primary
       button and four more times in secondary ones. That is the same
       repetition the featured/list split was introduced to remove,
       reappearing as copy instead of as layout.

       The row already states its own state in a badge ("Not started",
       "In progress", "Completed"), so the verb is not carrying that
       meaning and does not need to vary. One page, one invitation to
       start: the featured card. Everything below it is navigation. */
    function otherRow(it) {
      var prog = it.progress;
      var eid = it.row.experimentId;
      return '<li class="pickrow">' +
        '<div class="pk-body">' +
        '<div class="pk-n">' + esc(nameOf(eid)) + ' ' + L.progressBadge(prog.status) + '</div>' +
        '<div class="pk-m">' + L.courseLine(eid) + '</div>' +
        '</div>' +
        '<a class="btn sm sec" href="' + L.href.experiment(p.id, eid) + '">Open</a>' +
        '</li>';
    }

    var othersBlock = '';
    if (others.length) {
      othersBlock =
        ui.sectionHead({
          title: 'Your other experiments', count: others.length, countLabel: 'experiment',
          heading: 'h2',
          actionsHTML: '<a class="btn sec sm" href="' + L.href.myLearning(p.id) + '">Open My Learning</a>'
        }) +
        '<div class="card"><div class="cbody">' +
        '<ul class="picklistr">' + others.map(otherRow).join('') + '</ul>' +
        '</div></div>';
    }

    /* ---------- the empty and blocked states ----------
       A student with nothing available gets ONE clear statement, not a
       primary button that cannot work. */
    var emptyBlock = '';
    if (!featured) {
      if (!active) {
        /* `accountNotice` already states the reason above; repeating it
           here would be the third time on one screen. */
        emptyBlock = ui.card('Your learning',
          ui.emptyRow({
            icon: 'alertCirc', heading: 'h3',
            title: 'Nothing can be opened while your account is inactive',
            body: 'Everything you have already done is kept. Your record is still available under ' +
              'Your progress.',
            actionsHTML: '<a class="btn sec sm" href="' + L.href.progress(p.id) + '">Your progress</a>'
          }), null, 'h2');
      } else if (blocked.length) {
        emptyBlock = ui.card('Your learning',
          ui.emptyRow({
            icon: 'alert', heading: 'h3',
            title: 'Nothing is available to you right now',
            body: blocked.length + ' ' + util.plural(blocked.length, 'experiment') + ' ' +
              (blocked.length === 1 ? 'is' : 'are') + ' assigned to you but cannot be opened at the ' +
              'moment. Everything you have already done is kept.',
            actionsHTML: '<a class="btn sec sm" href="' + L.href.myLearning(p.id) + '">See why</a>'
          }), null, 'h2');
      } else {
        emptyBlock = ui.card('Your learning',
          ui.emptyState({
            icon: 'flask', heading: 'h3',
            title: 'No experiments have been assigned to you yet',
            body: 'Your institution decides which experiments you take, and in which technologies. ' +
              'Being enrolled on a course, or belonging to a study group, is not the same thing.'
          }), null, 'h2');
      }
    }

    /* ---------- earlier work ---------- */
    var pastNote = past.length
      ? ui.card('Earlier work',
          ui.emptyRow({
            icon: 'clock', heading: 'h3',
            title: past.length + ' ' + util.plural(past.length, 'experiment') + ' no longer assigned to you',
            body: 'Your record of that work is kept.',
            actionsHTML: '<a class="btn sec sm" href="' + L.href.progress(p.id) + '">Your progress</a>'
          }), null, 'h2')
      : '';

    /* ---------- where you study ----------
       True, and nobody's reason for opening this page: it goes last and
       it is compact. */
    var whereCard = ui.card('Where you are studying',
      '<div class="kv compact">' +
      '<div class="k">Institution</div><div class="v">' + esc(tenant.name) + '</div>' +
      '<div class="k">Programme / department</div><div class="v">' +
      (mem && mem.grouping ? esc(mem.grouping.name) : '<span class="muted">Not recorded</span>') + '</div>' +
      '<div class="k">Course</div><div class="v">' +
      (mem && mem.course ? esc(mem.course.name) : '<span class="muted">Not recorded</span>') +
      /* ⚠ A REVERSIBLE UX JUDGEMENT, NOT A CONFIRMED REQUIREMENT.

         The Student is shown their INSTITUTION'S course code and not the
         platform one. What the sources actually settle is the ownership
         split — written clarification E (6 Sep 2026): the platform code
         is the Content Manager's primarily and the Super Admin's also,
         the institution's `localCourseCode` is a separate field the
         Tenant Admin owns, and blank is legal for either. **No source,
         at any date, states which code a STUDENT sees** — an exhaustive
         search of the FRD, the 31 Aug decisions, the correction
         blueprint and the 6/7 Sep clarifications returns nothing.

         So this is our judgement, taken because the platform code is
         governance vocabulary a learner has no use for, and because
         showing both is what prompted the "why does one course have two
         codes?" question. It renders the value with no label asserting
         which kind it is, so nothing on screen claims a convention that
         has not been agreed. Reversible in one line if the stakeholder
         decides otherwise. Recorded in UX_REDESIGN_08.md §4 and §8. */
      (mem && mem.localCode ? ' ' + ui.institutionCode(mem.localCode) : '') + '</div>' +
      (mem && mem.semester ? '<div class="k">Semester</div><div class="v">' + esc(mem.semester) + '</div>' : '') +
      '<div class="k">Student ID</div><div class="v">' + esc(p.studentId || '—') + '</div>' +
      '</div>', null, 'h2');

    /* R10 — this screen can state a completion, so it carries the note
       that says how a completion actually got here. It is now a folded
       "About" rather than a dashed engineering panel: the same honest
       statement, in product language, out of the way of the journey. It
       renders only when a completion is actually asserted. */
    /* ⚠ NOT ON THIS PAGE. The completion caveat is real and is kept —
       but it was rendering on Home, on My Learning, on the experiment
       page, on the simulation page and on Progress, which is the same
       disclosure five times in one journey. Home and My Learning are
       SUMMARIES; the caveat belongs where a completion is produced and
       examined — the simulation and experiment pages — and on Progress,
       which is the record of them. Both of those still carry it. */
    var completionNote = '';

    var html =
      ui.phead('Hello, ' + p.name, esc(tenant.name)) +
      '<div class="stack">' +
      L.accountNotice(p) +
      focusCard +
      emptyBlock +
      waitingCard +
      statsBlock +
      othersBlock +
      pastNote +
      whereCard +
      completionNote +
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

    /* R10 — every card below can print "Completed", a completion date and
       a percentage derived from a recorded simulation completion. The
       caveat that says where a completion actually came from is therefore
       rendered on this screen too, and each card reports whether it
       asserted one, so a My Learning holding nothing finished is not
       given a note qualifying a claim it never made. */
    var showsCompletion = false;
    function noteCompletion(prog) {
      if (L.assertsCompletion([prog])) { showsCompletion = true; }
    }

    function card(row, wide) {
      var ctx = data.contextOf(row.experimentId);
      var prog = state.experimentProgress(p.id, row.experimentId, row.technologies, { studentView: true });
      noteCompletion(prog);
      var name = ctx ? ctx.experiment.name : row.experimentId;
      /* ⚠ ONE VERB, AND IT IS NOT "CONTINUE".
         HOME owns resume semantics — it features exactly one experiment
         and invites you into it. My Learning is the LIBRARY: every card
         is equally available, so a card that says "Continue" competes
         with the one place that should. The card's own badge already
         states whether it is started, in progress or complete, so the
         verb does not have to carry that too. */
      var actionLabel = 'Open experiment';
      /* ⚠ ONE CARD IN A 1220px GRID IS A DESIGN, NOT AN ACCIDENT.
         `.lgrid` is `repeat(auto-fill, minmax(330px,1fr))`, so a student
         holding exactly one experiment got a 330px card marooned in
         about 900px of empty page. The card is not the problem — the
         LAYOUT is: with one item there is no grid to be in. `wide`
         switches it to a horizontal card that uses the width it has. */
      return '<article class="lcard' + (wide ? ' wide' : '') + '">' +
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
    function blockedCard(row, wide) {
      var ctx = data.contextOf(row.experimentId);
      var techs = row.technologies.concat(row.blockedTechnologies);
      var prog = state.experimentProgress(p.id, row.experimentId, techs, { studentView: true });
      var touched = state.hasActivity(p.id, row.experimentId);
      if (touched) { noteCompletion(prog); }
      return '<article class="lcard blocked' + (wide ? ' wide' : '') + '">' +
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

    function pastCard(experimentId, wide) {
      var ctx = data.contextOf(experimentId);
      var techs = state.technologiesWithActivity(p.id, experimentId);
      /* Historical: the assignment is gone, so the technology set it
         covered is unknown and no completion verdict can be claimed. */
      var prog = state.experimentProgress(p.id, experimentId, techs,
        { historical: true, studentView: true });
      noteCompletion(prog);
      return '<article class="lcard past' + (wide ? ' wide' : '') + '">' +
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
      /* THE ONE PLACE A LARGE EMPTY STATE IS RIGHT. This is the page's
         central state, not a quiet queue with nothing in it, so it gets
         the full treatment rather than the compact row. */
      body = '<div class="card"><div class="cbody">' + ui.emptyState({
        icon: 'flask',
        title: 'No experiments have been assigned to you yet',
        body: 'Your institution decides which experiments you take and in which technologies. ' +
          'Nothing appears here until an experiment is assigned to you or to a group you belong to — ' +
          'being enrolled on a course is not the same thing.',
        actionsHTML: '<a class="btn sec" href="' + L.href.home(p.id) + '">Back to Home</a>'
      }) + '</div></div>';
    } else {
      /* ONE / FEW / MANY. The grid is only a grid when there is
         something to line up. With a single record the card goes wide;
         with several it fills the row it is given. Designed for the
         counts, not for the screenshot. */
      function shelf(items, render) {
        if (items.length === 1) { return '<div class="lgrid one">' + render(items[0], true) + '</div>'; }
        return '<div class="lgrid">' + items.map(function (x) { return render(x, false); }).join('') + '</div>';
      }

      body =
        '<section class="lsec" aria-labelledby="ml-avail">' +
        ui.sectionHead({
          title: 'Available to you', heading: 'h2', id: 'ml-avail',
          count: available.length ? available.length : null, countLabel: 'experiment',
          desc: available.length > 3
            ? 'Everything your institution has made available to you, with the technologies you hold.'
            : null
        }) +
        (available.length
          ? shelf(available, card)
          : '<div class="card"><div class="cbody">' + ui.emptyRow({
              icon: 'flask', heading: 'h3',
              title: 'Nothing is available to you right now',
              body: p.status !== 'active'
                ? 'Your account is not active at your institution, so no experiment can be opened.'
                : 'No experiment currently reaches you. Anything listed below is kept for your record.'
            }) + '</div></div>') +
        '</section>' +
        (blocked.length
          ? '<section class="lsec" aria-labelledby="ml-blocked">' +
            ui.sectionHead({
              title: 'Not available at the moment', count: blocked.length, heading: 'h2',
              id: 'ml-blocked', countLabel: 'experiment',
              desc: 'Still assigned to you. Something about your account or your institution\u2019s ' +
                'access means these cannot be opened right now, and nothing you have done is lost.'
            }) +
            shelf(blocked, blockedCard) + '</section>'
          : '') +
        (past.length
          ? '<section class="lsec" aria-labelledby="ml-past">' +
            ui.sectionHead({
              title: 'Earlier work', count: past.length, heading: 'h2', id: 'ml-past',
              countLabel: 'experiment',
              desc: 'No longer assigned to you. Kept so your record stays complete.'
            }) +
            shelf(past, pastCard) + '</section>'
          : '');
    }

    var html =
      ui.phead('My Learning',
        'The experiments made available to you by ' + esc(tenant.name) + '.') +
      L.accountNotice(p) +
      (p.status !== 'active' ? '<div style="height:16px"></div>' : '') +
      body +
      /* See Home: the caveat lives on the experiment, simulation and
         Progress pages, not on the two summary screens. */
      '';

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
          /* A DIFFERENT CAVEAT FROM THE ROLL-UP ONE ABOVE, and it belongs
             here because this is where a completion figure is read in bulk.
             The rule above says the prototype's way of rolling technologies
             up into one experiment is unconfirmed. This says something
             narrower and earlier: the simulation completions those figures
             are counted FROM are entered by hand on the simulation page,
             because how a finished run confirms itself back to the platform
             is not decided. Without it, a percentage read here looks like it
             came from the experiment. */
          '<li>' + ui.ic('info', 'sm') + '<span>A simulation counts as complete once it is recorded on the ' +
          'simulation page. How a finished run in the experiment itself is confirmed back to the platform ' +
          'is <strong>not settled</strong> — an API or event call has been discussed and nothing about it ' +
          'is chosen or built — so every simulation figure here comes from that prototype control, not from ' +
          'the experiment.</span></li>' +
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
