/* ============================================================
   Unified Functional Platform — FACULTY assessment authoring,
   Question Bank, AI drafting and descriptive review.

   ── WHAT THIS FILE INHERITS ───────────────────────────────────
   Batch 02 built and validated this surface, and
   `13_BATCH_01_05_EXACT_CORRECTION_MAP.md` marks it KEEP: the
   assessments list, the tabbed builder with its three-item
   completeness rail, the question editor, the AI-draft review model and
   the learner-view preview all carry forward. Four things change, and
   only because a 31 Aug decision changed them:

     · `Module`  →  `Experiment`                        STK31-14
     · answer / explanation visibility policy is NEW    STK31-32
     · Question Bank `Delete` is NEW                    STK31-34
     · AI generation gains a SOURCE MATERIAL input      STK31-33

   ── WHAT THIS FILE MUST NEVER DO ──────────────────────────────
   · No publish, release, approve or activate step. An assessment is
     usable when it has questions and complete settings — a derived
     state, never a stored lifecycle column.
   · No second human evaluator. `finaliseReview` is reachable only from
     the Faculty review screen (STK31-31).
   · No confidence score, no similarity percentage, no model or provider,
     and no claim that the local suggestion is how a production
     auto-review scores (ND-09 · 18_REQUIREMENT_SAFETY_CHECK). The
     suggestion states its own derivation rather than hiding it.
   · No answer key on any Student-facing surface, preview included
     (D-25). The authoring view is the one place a key appears, and it
     is labelled as authoring metadata.
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
  var F = XRSLP.facultyUI;
  var L = XRSLP.studentUI;

  /* ---------------- shared assessment furniture ---------------- */

  function tabs(f, experimentId, active) {
    var items = [
      { key: 'overview', label: 'Overview', href: F.href.assessment(f.id, experimentId) },
      { key: 'questions', label: 'Questions', href: F.href.builder(f.id, experimentId) },
      { key: 'settings', label: 'Settings', href: F.href.settings(f.id, experimentId) },
      { key: 'preview', label: 'Preview', href: F.href.preview(f.id, experimentId) }
    ];
    return '<nav class="seg fac-tabs" aria-label="Assessment sections">' + items.map(function (i) {
      return '<a class="segi" href="' + i.href + '"' + (active === i.key ? ' aria-current="page"' : '') + '>' +
        esc(i.label) + '</a>';
    }).join('') + '</nav>';
  }

  /* THE COMPLETENESS RAIL — three items, then one next-action sentence.
     Batch 02's model, kept because it is what makes an assessment's
     state legible without inventing a lifecycle. */
  function completenessRail(f, def, experimentId, reach) {
    var rd = state.assessmentReadiness(def);
    var totals = state.assessmentTotals(def);
    var ctx = data.contextOf(experimentId);
    var items = [
      { ok: rd.hasQuestions, title: 'Questions selected',
        detail: rd.hasQuestions
          ? totals.count + ' ' + util.plural(totals.count, 'question') + ' · ' + totals.total + ' ' +
            util.plural(totals.total, 'mark') + ' available'
          : 'No questions have been added yet.' },
      { ok: rd.settingsComplete, title: 'Settings complete',
        detail: rd.settingsComplete
          ? 'Pass ' + def.passMark + '% · ' + def.attemptLimit + ' ' +
            util.plural(def.attemptLimit, 'attempt') + ' · ' + esc(data.policyLabel(def.policy.mode))
          : 'Pass mark, attempts and answer visibility are not all set.' },
      { ok: rd.contextBound, title: 'Learning context',
        detail: ctx
          ? esc(ctx.experiment.name) + ' · ' + reach + ' ' + util.plural(reach, 'student') + ' entitled'
          : 'Not bound to an experiment.' }
    ];
    var next;
    if (!rd.hasQuestions) {
      next = { text: 'Add questions from your Question Bank.', href: F.href.builder(f.id, experimentId),
               label: 'Add questions' };
    } else if (!rd.settingsComplete) {
      next = { text: 'Complete the settings so students can be told what this assessment is.',
               href: F.href.settings(f.id, experimentId), label: 'Open settings' };
    } else if (!reach) {
      next = { text: 'This assessment is ready. No student currently holds an entitlement to this experiment, ' +
               'so nobody can take it yet — your institution assigns that.', href: null, label: null };
    } else {
      next = { text: 'This assessment is ready and reaches ' + reach + ' ' + util.plural(reach, 'student') + '.',
               href: F.href.preview(f.id, experimentId), label: 'Preview it' };
    }
    return ui.card('Completeness',
      '<ul class="railitems">' + items.map(function (it) {
        return '<li class="' + (it.ok ? 'ok' : 'todo') + '">' +
          ui.ic(it.ok ? 'check' : 'circle') +
          '<span class="ri-b"><span class="ri-t">' + esc(it.title) + '</span>' +
          '<span class="ri-d">' + it.detail + '</span></span></li>';
      }).join('') + '</ul>' +
      '<p class="railnext">' + esc(next.text) + '</p>' +
      (next.href ? '<div class="formact"><a class="btn sec sm" href="' + next.href + '">' +
        esc(next.label) + '</a></div>' : ''),
      null, 'h2');
  }

  /* Once submitted attempts exist, a structural change is a REVISION.
     Said before the change, never discovered after it. */
  function revisionNotice(def, stats) {
    if (!stats.submitted) { return ''; }
    return ui.alertBox('warning', 'This assessment has ' + stats.submitted + ' submitted ' +
      util.plural(stats.submitted, 'attempt'),
      '<p>Adding, removing or reordering a question creates <strong>revision ' +
      ((def.revision || 1) + 1) + '</strong>, which applies to attempts started from then on.</p>' +
      '<p style="margin-top:8px">Every attempt already submitted keeps the questions, marks and pass mark it ' +
      'was taken against, so no student’s result changes and no history is lost.</p>');
  }

  function assessmentHead(f, tenant, def, experimentId, activeTab, extraHTML) {
    var ctx = data.contextOf(experimentId);
    var rd = state.assessmentReadiness(def);
    return ui.crumbs([{ label: 'Assessments', href: F.href.assessments(f.id) },
                      { label: ctx ? ctx.experiment.name : experimentId }]) +
      ui.phead(def ? def.title : (ctx ? ctx.experiment.name : experimentId),
        F.courseLine(experimentId) +
        (def && def.revision > 1 ? ' · revision ' + def.revision : ''),
        extraHTML || null,
        def ? ' ' + ui.badge(rd.ready ? 'b-success' : 'b-warning', rd.ready ? 'check' : 'alert', rd.label) : '') +
      tabs(f, experimentId, activeTab);
  }

  /* ============================================================
     ASSESSMENTS LIST
     ============================================================ */
  XRSLP.screens.facultyAssessments = function (params) {
    var r = F.requireFaculty(params, 'assessments');
    if (!r.faculty) { return r.fail; }
    var f = r.faculty, tenant = r.tenant;
    var scope = state.facultyScope(f.id);

    if (!scope.experiments.length) {
      return {
        area: 'faculty', faculty: f, tenant: tenant, navKey: 'assessments',
        title: 'Assessments — ' + f.name,
        html: ui.phead('Assessments') +
          '<div class="tablecard">' + ui.emptyState({
            icon: 'doc', heading: 'h2',
            title: 'No content is mapped to you yet',
            body: 'An assessment belongs to an experiment. Once your institution maps an experiment to you, ' +
              'you can configure its assessment here.',
            actionsHTML: '<a class="btn pri" href="' + F.href.content(f.id) + '">See My Content</a>'
          }) + '</div>'
      };
    }

    var rows = scope.experiments.map(function (row) {
      var ctx = data.contextOf(row.experimentId);
      var def = state.assessmentForTenant(tenant.id, row.experimentId);
      var rd = state.assessmentReadiness(def);
      var totals = state.assessmentTotals(def);
      var stats = state.assessmentAttemptStats(tenant.id, row.experimentId);
      var reach = state.facultyStudentReach(f.id, row.experimentId).length;
      return '<tr>' +
        '<td data-label="Assessment">' + (def
          ? '<a class="rowlink" href="' + F.href.assessment(f.id, row.experimentId) + '">' +
            '<span class="tmain">' + esc(def.title) + '</span>' +
            '<span class="tsub">' + esc(ctx ? ctx.experiment.name : row.experimentId) + '</span></a>'
          : '<span class="tmain muted">Not configured</span>' +
            '<span class="tsub">' + esc(ctx ? ctx.experiment.name : row.experimentId) + '</span>') + '</td>' +
        '<td data-label="Questions" class="num tabular">' + (def ? totals.count : '—') + '</td>' +
        '<td data-label="Marks" class="num tabular">' + (def ? totals.total : '—') + '</td>' +
        '<td data-label="Status">' + (def
          ? ui.badge(rd.ready ? 'b-success' : 'b-warning', rd.ready ? 'check' : 'alert', rd.label)
          : ui.badge('b-neutral', 'minus', 'No assessment')) + '</td>' +
        '<td data-label="Students" class="num tabular">' + reach + '</td>' +
        '<td data-label="Attempts" class="num tabular">' + stats.submitted + '</td>' +
        '<td data-label="Updated">' + (def ? esc(util.fmtDate(def.updatedAt)) : '—') + '</td>' +
        '<td class="cell-actions">' + (def
          ? '<a class="btn sm sec" href="' + F.href.assessment(f.id, row.experimentId) + '">Open' +
            '<span class="sr-only"> ' + esc(def.title) + '</span></a>'
          : '<a class="btn sm pri" href="' + F.href.settings(f.id, row.experimentId) + '">Create' +
            '<span class="sr-only"> an assessment for ' + esc(ctx ? ctx.experiment.name : row.experimentId) +
            '</span></a>') + '</td>' +
        '</tr>';
    }).join('');

    var html =
      ui.phead('Assessments', 'One assessment per experiment mapped to you, inside ' + esc(tenant.name) + '.') +
      '<div class="stack">' +
      ui.alertBox('info', 'One assessment covers an experiment',
        '<p>A student sits <strong>one</strong> assessment for an experiment, however many technologies their ' +
        'institution licensed. The simulation is technology-specific; the assessment is not.</p>' +
        '<p style="margin-top:8px">An experiment does not have to have one — assessment is optional.</p>') +
      ui.card('Your experiments',
        '<div class="tscroll"><table class="dt">' +
        '<caption class="sr-only">Assessments for the experiments mapped to you.</caption>' +
        '<thead><tr><th scope="col">Assessment</th><th scope="col" class="num">Questions</th>' +
        '<th scope="col" class="num">Marks</th><th scope="col">Status</th>' +
        '<th scope="col" class="num">Students</th><th scope="col" class="num">Submitted</th>' +
        '<th scope="col">Updated</th><th scope="col"><span class="sr-only">Actions</span></th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table></div>',
        scope.experiments.length + ' ' + util.plural(scope.experiments.length, 'experiment'), 'h2') +
      '</div>';

    return {
      area: 'faculty', faculty: f, tenant: tenant, navKey: 'assessments',
      title: 'Assessments — ' + f.name, html: html
    };
  };

  /* ============================================================
     ASSESSMENT — OVERVIEW TAB
     ============================================================ */
  XRSLP.screens.facultyAssessment = function (params) {
    var r = F.requireMapped(params, 'assessments');
    if (r.fail) { return r.fail; }
    var f = r.faculty, tenant = r.tenant, ctx = r.ctx, row = r.row;
    var e = ctx.experiment;
    var def = state.assessmentForTenant(tenant.id, e.id);
    var reach = state.facultyStudentReach(f.id, e.id);

    if (!def) {
      return {
        area: 'faculty', faculty: f, tenant: tenant, navKey: 'assessments',
        title: e.name + ' — no assessment',
        html: ui.crumbs([{ label: 'Assessments', href: F.href.assessments(f.id) }, { label: e.name }]) +
          ui.phead(e.name, F.courseLine(e.id)) +
          '<div class="stack">' +
          '<div class="tablecard">' + ui.emptyState({
            icon: 'doc', heading: 'h2',
            title: 'No assessment is configured for this experiment',
            body: 'Assessment is optional — a student can complete this experiment without one. Create one ' +
              'when you want to assess it.',
            actionsHTML: '<a class="btn pri" href="' + F.href.settings(f.id, e.id) + '">Create an assessment</a>'
          }) + '</div>' +
          ui.card('What this experiment carries today',
            '<div class="kv">' +
            '<div class="k">Course</div><div class="v">' + esc(ctx.course.name) + '</div>' +
            '<div class="k">Available technologies</div><div class="v">' +
              (F.mappedTechnologies(row).length ? ui.techBadges(F.mappedTechnologies(row)) : 'None') + '</div>' +
            '<div class="k">Students entitled</div><div class="v tabular">' + reach.length + '</div>' +
            '<div class="k">Learning resources</div><div class="v tabular">' +
              data.resourcesFor(e.id).length + '</div>' +
            '</div>', null, 'h2') +
          '</div>'
      };
    }

    var totals = state.assessmentTotals(def);
    var stats = state.assessmentAttemptStats(tenant.id, e.id);
    var release = state.assessmentRelease(def);
    var pending = state.reviewsForFaculty(f.id, { experimentId: e.id, status: 'pending' }).length;
    var mapping = state.courseMapping(tenant.id, ctx.course.id);

    var summary = ui.card('Configuration',
      '<div class="kv">' +
      '<div class="k">Name</div><div class="v">' + esc(def.title) + '</div>' +
      '<div class="k">Experiment</div><div class="v">' + esc(e.name) + '</div>' +
      '<div class="k">Questions</div><div class="v">' + totals.count + ' — ' +
        [totals.mcq ? totals.mcq + ' multiple choice' : null,
         totals.tf ? totals.tf + ' true or false' : null,
         totals.desc ? totals.desc + ' written' : null].filter(Boolean).join(', ') + '</div>' +
      '<div class="k">Marks available</div><div class="v tabular">' + totals.total +
        (totals.descriptive ? ' (' + totals.objective + ' marked automatically, ' + totals.descriptive +
          ' by you)' : '') + '</div>' +
      '<div class="k">Pass mark</div><div class="v tabular">' + def.passMark + '%</div>' +
      '<div class="k">Attempts allowed</div><div class="v tabular">' + def.attemptLimit + '</div>' +
      '<div class="k">Deadline</div><div class="v">' +
        (def.deadline ? esc(util.fmtDate(def.deadline)) : 'None set') + '</div>' +
      '<div class="k">Answers and explanations</div><div class="v">' +
        esc(data.policyLabel(def.policy.mode)) +
        (release.releaseAt ? ' — ' + esc(util.fmtDate(release.releaseAt)) : '') +
        (release.unresolved ? ' <span class="muted">(no date set yet)</span>' : '') + '</div>' +
      '<div class="k">Last updated</div><div class="v">' + esc(util.fmtDateTime(def.updatedAt)) + '</div>' +
      '</div>' +
      '<p class="cardfoot">Scores and attempts are recorded automatically for every attempt. That is platform ' +
      'behaviour, not a setting.</p>', null, 'h2');

    /* U-FAC-05 — the assign region, realised as REACH.
       ⚠ JUDGEMENT CALL, recorded in the README. Batch 02's third builder
       tab bound an assessment to a module and assigned it to learners.
       In this unified model the assessment is created FOR an experiment,
       and who may take it is derived from the Tenant Admin's assignment
       (STK31-25) — a Faculty member cannot create learner eligibility.
       So the region shows the reach it actually has, with the local
       course code and the OPTIONAL semester the row calls for, and
       offers no control that would take the Tenant Admin's authority. */
    var reachCard = ui.card('Who this assessment reaches',
      '<div class="kv">' +
      '<div class="k">Course</div><div class="v">' + esc(ctx.course.name) + '</div>' +
      '<div class="k">Local course code</div><div class="v">' +
        (mapping && mapping.localCode ? esc(mapping.localCode) : '<span class="muted">Not mapped</span>') + '</div>' +
      '<div class="k">Semester</div><div class="v">' +
        (mapping && mapping.semester ? esc(mapping.semester)
          : '<span class="muted">Not set — semester is optional</span>') + '</div>' +
      '<div class="k">Students entitled</div><div class="v tabular">' + reach.length + '</div>' +
      '<div class="k">Attempts submitted</div><div class="v tabular">' + stats.submitted +
        '<span class="tsub2">every attempt at this assessment in the institution</span></div>' +
      '<div class="k">In progress now</div><div class="v tabular">' + stats.inProgress + '</div>' +
      (pending ? '<div class="k">Waiting for you</div><div class="v">' + pending + ' written ' +
        util.plural(pending, 'response') + '</div>' : '') +
      '</div>' +
      '<p class="cardfoot">Students reach this assessment through the entitlement your institution assigns. ' +
      'You configure the assessment; your Tenant Admin decides who holds the experiment.</p>' +
      (pending ? '<div class="formact"><a class="btn pri sm" href="' + F.href.reviews(f.id) +
        '">Open reviews</a></div>' : ''),
      null, 'h2');

    var html =
      assessmentHead(f, tenant, def, e.id, 'overview',
        '<a class="btn sec" href="' + F.href.preview(f.id, e.id) + '">Preview</a>' +
        '<a class="btn pri" href="' + F.href.builder(f.id, e.id) + '">Edit questions</a>') +
      '<div class="grid-rail"><div class="stack">' +
      revisionNotice(def, stats) +
      summary + reachCard +
      '</div><div class="stack">' +
      completenessRail(f, def, e.id, reach.length) +
      ui.card('Questions in order',
        totals.count
          ? '<ol class="qmini">' + def.questions.map(function (q) {
              return '<li>' + F.typeBadge(q.type) +
                '<span class="qm-t">' + esc(q.text) + '</span>' +
                '<span class="qm-m tabular">' + (q.points || 1) + ' ' +
                util.plural(q.points || 1, 'mark') + '</span></li>';
            }).join('') + '</ol>'
          : '<p class="cardlede">No questions yet.</p>', null, 'h2') +
      '</div></div>';

    return {
      area: 'faculty', faculty: f, tenant: tenant, navKey: 'assessments',
      title: def.title, html: html
    };
  };

  /* ============================================================
     ASSESSMENT — SETTINGS TAB (also the create form)
     ============================================================ */
  function dateInputValue(iso) {
    if (!iso) { return ''; }
    var d = new Date(iso);
    if (isNaN(d.getTime())) { return ''; }
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day);
  }

  XRSLP.screens.facultyAssessmentSettings = function (params) {
    var r = F.requireMapped(params, 'assessments');
    if (r.fail) { return r.fail; }
    var f = r.faculty, tenant = r.tenant, ctx = r.ctx;
    var e = ctx.experiment;
    var def = state.assessmentForTenant(tenant.id, e.id);
    var creating = !def;
    var reach = state.facultyStudentReach(f.id, e.id).length;
    var stats = state.assessmentAttemptStats(tenant.id, e.id);

    var pol = def ? def.policy.mode : '';
    var form =
      '<form id="as-form" novalidate><div class="form-errors"></div>' +
      '<div class="field" id="as-title"><label for="as-title-i">Assessment name ' +
        '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
        '<input type="text" id="as-title-i" value="' + esc(def ? def.title : '') + '" ' +
        'placeholder="' + esc(e.name + ' — laboratory assessment') + '"></div>' +
      '<div class="field" id="as-intro"><label for="as-intro-i">Introduction shown before the attempt</label>' +
        '<textarea id="as-intro-i" rows="3" placeholder="What this assessment covers and how to approach it.">' +
        esc(def ? def.intro : '') + '</textarea>' +
        '<p class="hint">Optional. Students see this on the assessment introduction screen, above the ' +
        'generated summary of your settings.</p></div>' +
      '<div class="frow">' +
      '<div class="field" id="as-pass"><label for="as-pass-i">Pass mark (%) ' +
        '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
        '<input type="number" id="as-pass-i" min="0" max="100" step="1" value="' +
        esc(def ? def.passMark : '') + '">' +
        '<p class="hint">A percentage of the marks that are awarded — the automatically marked questions, ' +
        'plus any marks you award for written answers.</p></div>' +
      '<div class="field" id="as-limit"><label for="as-limit-i">Attempts allowed ' +
        '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
        '<input type="number" id="as-limit-i" min="1" max="20" step="1" value="' +
        esc(def ? def.attemptLimit : '') + '">' +
        '<p class="hint">This limits starting a new attempt. Every attempt that is started is recorded either ' +
        'way — that is platform behaviour, not a setting.</p></div>' +
      '</div>' +
      '<div class="field" id="as-deadline"><label for="as-deadline-i">Assessment deadline</label>' +
        '<input type="date" id="as-deadline-i" value="' + esc(dateInputValue(def ? def.deadline : null)) + '">' +
        '<p class="hint">Optional unless you release answers after the deadline. A deadline set here does not ' +
        'close the assessment — nothing in this prototype auto-submits or locks an attempt.</p></div>' +
      '<fieldset class="fgroup boxed" id="as-policy-wrap">' +
      '<legend>When students see answers and explanations</legend>' +
      '<div class="field" id="as-policy">' +
      ['SHOW_IMMEDIATELY', 'AFTER_DEADLINE', 'CUSTOM_DATE'].map(function (mode) {
        var descr = mode === 'SHOW_IMMEDIATELY'
          ? 'As soon as the student submits.'
          : mode === 'AFTER_DEADLINE'
          ? 'Once the assessment deadline above has passed.'
          : 'From a date you choose.';
        return '<div class="radiorow' + (pol === mode ? ' is-selected' : '') + '">' +
          '<input type="radio" id="as-pol-' + mode + '" name="as-policy" value="' + mode + '"' +
          (pol === mode ? ' checked' : '') + '>' +
          '<label for="as-pol-' + mode + '"><strong>' + esc(data.policyLabel(mode)) + '</strong>' +
          '<span class="optdesc">' + esc(descr) + '</span></label></div>';
      }).join('') +
      '</div>' +
      '<div class="field" id="as-date"><label for="as-date-i">Release date</label>' +
        '<input type="date" id="as-date-i" value="' +
        esc(dateInputValue(def && def.policy.mode === 'CUSTOM_DATE' ? def.policy.date : null)) + '">' +
        '<p class="hint">Used when you choose “Show on a set date”.</p></div>' +
      '</fieldset>' +
      '<div class="formact">' +
      '<button class="btn pri" type="submit" id="as-save">' +
        (creating ? 'Create assessment' : 'Save settings') + '</button>' +
      '<a class="btn sec" href="' + (creating ? F.href.assessments(f.id) : F.href.assessment(f.id, e.id)) +
        '">Cancel</a>' +
      '</div></form>';

    var html =
      (creating
        ? ui.crumbs([{ label: 'Assessments', href: F.href.assessments(f.id) },
                     { label: e.name, href: F.href.assessment(f.id, e.id) },
                     { label: 'New assessment' }]) +
          ui.phead('Create an assessment', esc(e.name) + ' · ' + F.courseLine(e.id))
        : assessmentHead(f, tenant, def, e.id, 'settings', null)) +
      '<div class="grid-rail"><div class="stack">' +
      (creating
        ? ui.alertBox('info', 'Nothing is pre-filled',
            '<p>No pass mark, attempt limit or visibility policy is suggested for you. No source establishes a ' +
            'platform default for any of them, so this form does not assert one — every value here is yours.</p>')
        : revisionNotice(def, stats)) +
      ui.card(creating ? 'Assessment settings' : 'Settings', form, null, 'h2') +
      '</div><div class="stack">' +
      (def ? completenessRail(f, def, e.id, reach) : '') +
      ui.card('What students are told',
        '<p class="cardlede">Before starting, a student is shown a summary generated from these settings — how ' +
        'many questions and of what kind, the pass mark, how many attempts they have used, when answers become ' +
        'visible, and whether a written answer will come to you.</p>' +
        '<p class="cardlede">Nothing on that screen is written by hand. If you change a setting here, the ' +
        'student’s summary changes with it.</p>', null, 'h2') +
      /* The tag names the STATE, not the internal question id: a
          requirement identifier is a project artefact and must not reach
          a Faculty member's screen. */
      ui.gapNote('PENDING — NOT ESTABLISHED',
        '<strong>The BITS / Taxila feedback-timing rule is not implemented, because it is not established.</strong> ' +
        'The 31 August review said to refer to the Taxila behaviour for BITS cases. That behaviour is not in the ' +
        'project sources, so no BITS default is preselected here and none is invented. The three options above ' +
        'are the confirmed general policy; a BITS-specific behaviour would later be <em>selected</em> from a ' +
        'control like this one, not built into it.') +
      '</div></div>';

    return {
      area: 'faculty', faculty: f, tenant: tenant, navKey: 'assessments',
      title: (creating ? 'New assessment — ' : 'Settings — ') + e.name, html: html,
      after: function () {
        var formEl = document.getElementById('as-form');
        if (!formEl) { return; }

        function policyMode() {
          var checked = formEl.querySelector('input[name="as-policy"]:checked');
          return checked ? checked.value : '';
        }
        function syncDate() {
          var wrap = document.getElementById('as-date');
          if (wrap) { wrap.hidden = policyMode() !== 'CUSTOM_DATE'; }
          Array.prototype.slice.call(formEl.querySelectorAll('#as-policy .radiorow')).forEach(function (rowEl) {
            var input = rowEl.querySelector('input');
            rowEl.classList.toggle('is-selected', !!(input && input.checked));
          });
        }
        Array.prototype.slice.call(formEl.querySelectorAll('input[name="as-policy"]')).forEach(function (el) {
          el.addEventListener('change', syncDate);
        });
        syncDate();

        formEl.addEventListener('submit', function (ev) {
          ev.preventDefault();
          var fields = {
            title: document.getElementById('as-title-i').value,
            intro: document.getElementById('as-intro-i').value,
            passMark: document.getElementById('as-pass-i').value,
            attemptLimit: document.getElementById('as-limit-i').value,
            deadline: document.getElementById('as-deadline-i').value,
            policyMode: policyMode(),
            customDate: document.getElementById('as-date-i').value
          };
          var res = creating
            ? state.createAssessment(tenant.id, e.id, f.id, fields)
            : state.updateAssessmentSettings(def.id, fields, f.id);
          if (!res.ok) { ui.showErrors(formEl, res.errors, 'This assessment cannot be saved yet'); return; }
          ui.clearErrors(formEl);
          XRSLP.router.go(F.href.assessment(f.id, e.id));
          ui.toast(creating ? 'Assessment created.' : 'Settings saved.');
          XRSLP.render(true);
        });
      }
    };
  };

  /* ============================================================
     ASSESSMENT — QUESTIONS TAB (the builder)
     ============================================================ */
  /* Scoped to the assessment being built, for the same reason the
     student-progress filter is scoped to its faculty member. */
  var pickFilter = { owner: null, type: '', q: '' };
  function pickFilterFor(key) {
    if (pickFilter.owner !== key) { pickFilter = { owner: key, type: '', q: '' }; }
    return pickFilter;
  }

  XRSLP.screens.facultyAssessmentQuestions = function (params) {
    var r = F.requireMapped(params, 'assessments');
    if (r.fail) { return r.fail; }
    var f = r.faculty, tenant = r.tenant, ctx = r.ctx;
    var e = ctx.experiment;
    var def = state.assessmentForTenant(tenant.id, e.id);
    if (!def) { return { redirect: F.href.settings(f.id, e.id) }; }
    pickFilterFor(f.id + '::' + e.id);
    var stats = state.assessmentAttemptStats(tenant.id, e.id);
    var reach = state.facultyStudentReach(f.id, e.id).length;
    var totals = state.assessmentTotals(def);

    var included = {};
    def.questions.forEach(function (q) { if (q.bankQuestionId) { included[q.bankQuestionId] = true; } });

    var bank = state.questionsForFaculty(f.id).filter(function (q) {
      return q.experimentId === e.id && !included[q.id];
    });
    var qq = data.norm(pickFilter.q);
    var candidates = bank.filter(function (q) {
      if (pickFilter.type && q.type !== pickFilter.type) { return false; }
      if (qq && data.norm(q.text).indexOf(qq) === -1) { return false; }
      return true;
    });

    var currentHTML = def.questions.length
      ? '<ol class="qbuild">' + def.questions.map(function (q, i) {
          var link = state.assessmentQuestionLink(q);
          return '<li class="qb-row">' +
            '<div class="qb-h">' +
            '<span class="qb-n tabular">' + (i + 1) + '</span>' +
            F.typeBadge(q.type) +
            '<span class="qb-m tabular">' + (q.points || 1) + ' ' + util.plural(q.points || 1, 'mark') + '</span>' +
            '</div>' +
            '<p class="qb-t">' + esc(q.text) + '</p>' +
            (link.state === 'updated'
              ? '<p class="qb-link upd">' + ui.ic('info', 'sm') +
                'This question has been changed in the Question Bank since it was added here. ' +
                '<button type="button" class="linkbtn" data-refresh="' + esc(q.id) + '">Use the updated ' +
                'version</button></p>'
              : link.state === 'deleted'
              ? '<p class="qb-link del">' + ui.ic('info', 'sm') +
                'This question has been deleted from the Question Bank. The copy in this assessment is ' +
                'unaffected, and every attempt already taken is unaffected.</p>'
              : '') +
            '<div class="qb-a">' +
            '<button class="btn sm sec" type="button" data-move="up" data-q="' + esc(q.id) + '"' +
              (i === 0 ? ' disabled' : '') + '>Move up<span class="sr-only"> — question ' + (i + 1) + '</span></button>' +
            '<button class="btn sm sec" type="button" data-move="down" data-q="' + esc(q.id) + '"' +
              (i === def.questions.length - 1 ? ' disabled' : '') + '>Move down' +
              '<span class="sr-only"> — question ' + (i + 1) + '</span></button>' +
            '<button class="btn sm sec" type="button" data-remove="' + esc(q.id) + '">Remove from this ' +
              'assessment<span class="sr-only"> — question ' + (i + 1) + '</span></button>' +
            '</div></li>';
        }).join('') + '</ol>'
      : ui.emptyState({
          icon: 'doc', heading: 'h3',
          title: 'This assessment has no questions yet',
          body: 'Add questions from your Question Bank. Until it has at least one, no student can take it.'
        });

    var pickerHTML = candidates.length
      ? '<form id="pick-form" novalidate>' +
        '<fieldset class="fgroup"><legend class="sr-only">Question Bank items to add</legend>' +
        '<ul class="picklist">' + candidates.map(function (q) {
          return '<li><label class="pick">' +
            '<input type="checkbox" value="' + esc(q.id) + '" data-pick>' +
            '<span class="pk-b"><span class="pk-t">' + esc(q.text) + '</span>' +
            '<span class="pk-s">' + F.typeBadge(q.type) + ' <span class="tabular">' + (q.points || 1) + ' ' +
            util.plural(q.points || 1, 'mark') + '</span>' +
            (q.origin === 'ai' ? ' ' + ui.badge('b-outline', 'info', 'AI-assisted') : '') +
            '</span></span></label></li>';
        }).join('') + '</ul></fieldset>' +
        '<div class="formact"><button class="btn pri" type="submit" id="pick-add">Add selected questions</button>' +
        '<span class="formnote" id="pick-note">Nothing selected yet.</span></div></form>'
      : ui.emptyState({
          icon: 'search', heading: 'h3',
          title: bank.length ? 'No question matches these filters'
            : (state.questionsForFaculty(f.id).filter(function (q) { return q.experimentId === e.id; }).length
                ? 'Every question for this experiment is already in the assessment'
                : 'Your Question Bank has nothing for this experiment yet'),
          body: bank.length ? 'Change the search or the type filter.'
            : 'Add questions to the bank, or draft some with assistance, then come back here.',
          actionsHTML: bank.length ? '' :
            '<a class="btn pri" href="' + F.href.newQuestion(f.id) + '">Add a question</a>' +
            '<a class="btn sec" href="' + F.href.draft(f.id) + '">Draft with assistance</a>'
        });

    var html =
      assessmentHead(f, tenant, def, e.id, 'questions',
        '<a class="btn sec" href="' + F.href.preview(f.id, e.id) + '">Preview</a>') +
      '<div class="grid-rail"><div class="stack">' +
      revisionNotice(def, stats) +
      ui.card('In this assessment', currentHTML,
        totals.count + ' ' + util.plural(totals.count, 'question') + ' · ' + totals.total + ' ' +
        util.plural(totals.total, 'mark'), 'h2') +
      ui.card('Add from your Question Bank',
        '<div class="listbar">' +
        '<label for="pk-q">Search<input type="text" id="pk-q" value="' + esc(pickFilter.q) +
          '" placeholder="Question text"></label>' +
        '<label for="pk-t">Type<select id="pk-t">' +
        '<option value="">All types</option>' +
        Object.keys(state.QUESTION_TYPES).map(function (t) {
          return '<option value="' + esc(t) + '"' + (pickFilter.type === t ? ' selected' : '') + '>' +
            esc(state.QUESTION_TYPES[t]) + '</option>';
        }).join('') + '</select></label>' +
        '<span class="lcount">' + candidates.length + ' available</span>' +
        '</div>' + pickerHTML, null, 'h2') +
      '</div><div class="stack">' +
      completenessRail(f, def, e.id, reach) +
      ui.alertBox('info', 'Remove is not Delete',
        '<p><strong>Remove from this assessment</strong> takes a question out of this assessment. The question ' +
        'stays in your Question Bank and can be added again.</p>' +
        '<p style="margin-top:8px"><strong>Delete</strong>, in the Question Bank, removes the question from the ' +
        'bank itself. It is a different action, in a different place.</p>') +
      '</div></div>';

    return {
      area: 'faculty', faculty: f, tenant: tenant, navKey: 'assessments',
      title: 'Questions — ' + def.title, html: html,
      after: function () {
        function announceRevision(res) {
          if (res && res.revised) {
            ui.toast('Saved as revision ' + state.assessmentDefById(def.id).revision +
              '. Submitted attempts are unchanged.');
          }
        }
        Array.prototype.slice.call(document.querySelectorAll('[data-move]')).forEach(function (btn) {
          btn.addEventListener('click', function () {
            var res = state.moveAssessmentQuestion(def.id, btn.getAttribute('data-q'),
              btn.getAttribute('data-move'), f.id);
            if (!res.ok) { return; }
            announceRevision(res);
            XRSLP.render(true);
          });
        });
        Array.prototype.slice.call(document.querySelectorAll('[data-remove]')).forEach(function (btn) {
          btn.addEventListener('click', function () {
            var qid = btn.getAttribute('data-remove');
            var q = def.questions.filter(function (x) { return x.id === qid; })[0];
            ui.openDialog({
              title: 'Remove this question from the assessment?',
              bodyHTML: '<p>' + esc(q ? q.text : '') + '</p>' +
                '<div class="consequence">' + ui.ic('info') +
                '<span>The question stays in your Question Bank. Attempts already submitted keep the questions ' +
                'they were taken against.</span></div>',
              okLabel: 'Remove from assessment',
              onConfirm: function () {
                var res = state.removeQuestionFromAssessment(def.id, qid, f.id);
                if (res.ok) {
                  ui.toast('Removed from this assessment. It is still in your Question Bank.');
                  announceRevision(res);
                }
                XRSLP.render(true);
              }
            });
          });
        });
        Array.prototype.slice.call(document.querySelectorAll('[data-refresh]')).forEach(function (btn) {
          btn.addEventListener('click', function () {
            var res = state.refreshAssessmentQuestion(def.id, btn.getAttribute('data-refresh'), f.id);
            if (res.ok) { ui.toast('This assessment now uses the updated question.'); announceRevision(res); }
            XRSLP.render(true);
          });
        });

        function bindFilter(id, key, isText) {
          var el = document.getElementById(id);
          if (!el) { return; }
          el.addEventListener(isText ? 'input' : 'change', function () {
            pickFilter[key] = el.value;
            XRSLP.render(true);
            var again = document.getElementById(id);
            if (again) {
              again.focus();
              if (isText) { again.setSelectionRange(again.value.length, again.value.length); }
            }
          });
        }
        bindFilter('pk-q', 'q', true);
        bindFilter('pk-t', 'type', false);

        var pickForm = document.getElementById('pick-form');
        if (pickForm) {
          function picked() {
            return Array.prototype.slice.call(pickForm.querySelectorAll('[data-pick]:checked'))
              .map(function (el) { return el.value; });
          }
          function syncNote() {
            var n = picked().length;
            var note = document.getElementById('pick-note');
            if (note) {
              note.textContent = n ? n + ' ' + util.plural(n, 'question') + ' selected.' : 'Nothing selected yet.';
            }
          }
          Array.prototype.slice.call(pickForm.querySelectorAll('[data-pick]')).forEach(function (el) {
            el.addEventListener('change', syncNote);
          });
          pickForm.addEventListener('submit', function (ev) {
            ev.preventDefault();
            var ids = picked();
            if (!ids.length) { ui.toast('Select at least one question to add.', 'info'); return; }
            var res = state.addQuestionsToAssessment(def.id, ids, f.id);
            if (!res.ok) { ui.toast('Nothing was added.', 'info'); return; }
            ui.toast(res.added + ' ' + util.plural(res.added, 'question') + ' added to this assessment.');
            announceRevision(res);
            XRSLP.render(true);
          });
        }
      }
    };
  };

  /* ============================================================
     ASSESSMENT — PREVIEW

     Renders through the SAME functions the Student attempt renders
     through (`L.questionBody`, `L.disclosureRows`). That shared code
     path is the proof that configuration — not a second implementation
     — drives what a Student receives.

     ⚠ No attempt is created, nothing is recorded, and the student view
     shows no answer key. The authoring view is a separate, explicitly
     labelled view for the Faculty member who wrote the questions.
     ============================================================ */
  /* Scoped like every other module-level UI state in this file. The
     authoring view SHOWS THE ANSWER KEY, so it must never carry over
     into a different assessment or a different faculty member's session
     unasked. */
  var previewMode = { owner: null, view: 'student' };
  function previewModeFor(key) {
    if (previewMode.owner !== key) { previewMode = { owner: key, view: 'student' }; }
    return previewMode;
  }

  XRSLP.screens.facultyAssessmentPreview = function (params) {
    var r = F.requireMapped(params, 'assessments');
    if (r.fail) { return r.fail; }
    var f = r.faculty, tenant = r.tenant, ctx = r.ctx;
    var e = ctx.experiment;
    var def = state.assessmentForTenant(tenant.id, e.id);
    if (!def) { return { redirect: F.href.settings(f.id, e.id) }; }
    var release = state.assessmentRelease(def);
    var totals = state.assessmentTotals(def);
    previewModeFor(f.id + '::' + e.id);
    var authoring = previewMode.view === 'authoring';

    var disclosure = L.disclosureRows(def, {
      coversHTML: esc(e.name) + ' — one assessment for this experiment',
      attemptsText: def.attemptLimit + ' ' + util.plural(def.attemptLimit, 'attempt') + ' allowed',
      releaseSentence: release.sentence
    });

    var body = def.questions.length
      ? def.questions.map(function (q, i) {
          return L.questionBody(q, i, def.questions.length, { readOnly: true, showKey: authoring });
        }).join('')
      : ui.emptyState({
          icon: 'doc', heading: 'h3',
          title: 'Nothing to preview yet',
          body: 'Add questions to this assessment and they will appear here exactly as a student sees them.',
          actionsHTML: '<a class="btn pri" href="' + F.href.builder(f.id, e.id) + '">Add questions</a>'
        });

    var html =
      assessmentHead(f, tenant, def, e.id, 'preview',
        '<a class="btn sec" href="' + F.href.builder(f.id, e.id) + '">Edit questions</a>') +
      '<div class="stack">' +
      ui.alertBox('info', 'This is a preview',
        '<p>Nothing here is recorded. No attempt is created, no answer is saved, and this does not count ' +
        'against anyone’s attempt limit.</p>') +
      '<div class="previewswitch">' +
      '<span class="pv-k">View</span>' +
      '<div class="seg" role="group" aria-label="Preview view">' +
      '<button class="segi" type="button" data-pv="student"' + (!authoring ? ' aria-current="true"' : '') +
        '>What the student sees</button>' +
      '<button class="segi" type="button" data-pv="authoring"' + (authoring ? ' aria-current="true"' : '') +
        '>Authoring view</button>' +
      '</div>' +
      '<span class="pv-n">' + (authoring
        ? 'The correct answers below are authoring information. A student never sees them during an attempt.'
        : 'Exactly what a student is shown. No correct answers appear.') + '</span>' +
      '</div>' +
      ui.card('Before you start',
        '<p class="cardlede">' + esc(def.intro || 'No introduction has been written for this assessment.') +
        '</p>' + disclosure, 'Generated from your settings', 'h2') +
      (authoring
        ? ui.alertBox('warning', 'Authoring view — correct answers shown',
            '<p>This view exists so you can check the answer key you set. It is not a student view, and the ' +
            'key is never rendered on a student screen during an attempt.</p>')
        : '') +
      '<div class="qwrap preview">' + body + '</div>' +
      ui.card('What happens when a student submits',
        '<div class="kv">' +
        '<div class="k">Marked automatically</div><div class="v">' + totals.objective + ' ' +
          util.plural(totals.objective, 'mark') + ' across ' + (totals.mcq + totals.tf) + ' ' +
          util.plural(totals.mcq + totals.tf, 'question') + '</div>' +
        '<div class="k">Marked by you</div><div class="v">' +
          (totals.desc ? totals.descriptive + ' ' + util.plural(totals.descriptive, 'mark') + ' across ' +
            totals.desc + ' written ' + util.plural(totals.desc, 'answer') : 'Nothing — there are no written answers') +
          '</div>' +
        '<div class="k">Pass mark</div><div class="v tabular">' + def.passMark + '%</div>' +
        '<div class="k">Answers and explanations</div><div class="v">' + esc(release.sentence) + '</div>' +
        '</div>' +
        (totals.desc
          ? '<p class="cardfoot">A student’s result stays <strong>Pending Faculty review</strong> until you have ' +
            'reviewed every written answer. Their experiment is never counted as complete while that is ' +
            'outstanding.</p>' : ''),
        null, 'h2') +
      '</div>';

    return {
      area: 'faculty', faculty: f, tenant: tenant, navKey: 'assessments',
      title: 'Preview — ' + def.title, html: html,
      after: function () {
        Array.prototype.slice.call(document.querySelectorAll('[data-pv]')).forEach(function (btn) {
          btn.addEventListener('click', function () {
            previewMode.view = btn.getAttribute('data-pv');
            XRSLP.render(true);
            var again = document.querySelector('[data-pv="' + previewMode.view + '"]');
            if (again) { again.focus(); }
          });
        });
      }
    };
  };

  /* ============================================================
     QUESTION BANK — Add · Edit · DELETE (STK31-34)
     ============================================================ */
  var bankFilter = { owner: null, type: '', experimentId: '', q: '' };
  function bankFilterFor(facultyId) {
    if (bankFilter.owner !== facultyId) {
      bankFilter = { owner: facultyId, type: '', experimentId: '', q: '' };
    }
    return bankFilter;
  }

  XRSLP.screens.facultyQuestionBank = function (params) {
    var r = F.requireFaculty(params, 'questions');
    if (!r.faculty) { return r.fail; }
    var f = r.faculty, tenant = r.tenant;
    var scope = state.facultyScope(f.id);
    bankFilterFor(f.id);

    if (!scope.experiments.length) {
      return {
        area: 'faculty', faculty: f, tenant: tenant, navKey: 'questions',
        title: 'Question Bank — ' + f.name,
        html: ui.phead('Question Bank') +
          '<div class="tablecard">' + ui.emptyState({
            icon: 'book', heading: 'h2',
            title: 'No content is mapped to you yet',
            body: 'A question belongs to an experiment. Once an experiment is mapped to you, you can write ' +
              'questions for it.',
            actionsHTML: '<a class="btn pri" href="' + F.href.content(f.id) + '">See My Content</a>'
          }) + '</div>'
      };
    }

    var mappedIds = scope.experiments.map(function (x) { return x.experimentId; });
    if (bankFilter.experimentId && mappedIds.indexOf(bankFilter.experimentId) === -1) {
      bankFilter.experimentId = '';
    }
    var all = state.questionsForFaculty(f.id);
    var qq = data.norm(bankFilter.q);
    var rows = all.filter(function (q) {
      if (bankFilter.type && q.type !== bankFilter.type) { return false; }
      if (bankFilter.experimentId && q.experimentId !== bankFilter.experimentId) { return false; }
      if (qq && data.norm(q.text).indexOf(qq) === -1) { return false; }
      return true;
    });

    var tableHTML = rows.length
      ? '<div class="tscroll"><table class="dt">' +
        '<caption class="sr-only">Questions in your bank, for the experiments mapped to you.</caption>' +
        '<thead><tr><th scope="col">Question</th><th scope="col">Type</th>' +
        '<th scope="col" class="num">Marks</th><th scope="col">Experiment</th>' +
        '<th scope="col">Used in</th><th scope="col">Updated</th>' +
        '<th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' +
        rows.map(function (q) {
          var usage = state.questionUsage(q.id);
          var ctx = data.contextOf(q.experimentId);
          return '<tr>' +
            '<td data-label="Question"><a class="rowlink" href="' + F.href.question(f.id, q.id) + '">' +
              '<span class="tmain">' + esc(q.text) + '</span>' +
              (q.origin === 'ai'
                ? '<span class="tsub">' + esc('Added from an assisted draft') + '</span>' : '') +
              '</a></td>' +
            '<td data-label="Type">' + F.typeBadge(q.type) + '</td>' +
            '<td data-label="Marks" class="num tabular">' + (q.points || 1) + '</td>' +
            '<td data-label="Experiment">' + esc(ctx ? ctx.experiment.name : q.experimentId) + '</td>' +
            '<td data-label="Used in">' + (usage.assessments.length
              ? usage.assessments.length + ' ' + util.plural(usage.assessments.length, 'assessment')
              : '<span class="muted">Not used yet</span>') +
              (usage.attempts ? '<span class="tsub2">' + usage.attempts + ' submitted ' +
                util.plural(usage.attempts, 'attempt') + '</span>' : '') + '</td>' +
            '<td data-label="Updated">' + esc(util.fmtDate(q.updatedAt)) + '</td>' +
            '<td class="cell-actions">' +
              '<a class="btn sm sec" href="' + F.href.question(f.id, q.id) + '">Edit' +
              '<span class="sr-only"> this question</span></a>' +
              '<button class="btn sm sec danger" type="button" data-del="' + esc(q.id) + '">Delete' +
              '<span class="sr-only"> this question</span></button>' +
            '</td></tr>';
        }).join('') + '</tbody></table></div>'
      : ui.emptyState({
          icon: all.length ? 'search' : 'book', heading: 'h2',
          title: all.length ? 'No question matches these filters' : 'Your Question Bank is empty',
          body: all.length
            ? 'Change the search, the type or the experiment filter.'
            : 'Write a question yourself, or draft some with assistance and review them before adding.',
          actionsHTML: all.length
            ? '<button class="btn sec" type="button" id="qb-clear">Clear filters</button>'
            : '<a class="btn pri" href="' + F.href.newQuestion(f.id) + '">Add a question</a>' +
              '<a class="btn sec" href="' + F.href.draft(f.id) + '">Draft with assistance</a>'
        });

    var html =
      ui.phead('Question Bank',
        'Questions for the experiments mapped to you, inside ' + esc(tenant.name) + '.',
        '<a class="btn sec" href="' + F.href.draft(f.id) + '">Draft with assistance</a>' +
        '<a class="btn pri" href="' + F.href.newQuestion(f.id) + '">Add a question</a>') +
      '<div class="stack">' +
      '<div class="tablecard">' +
      '<div class="listbar">' +
      '<label for="qb-q">Search<input type="text" id="qb-q" value="' + esc(bankFilter.q) +
        '" placeholder="Question text"></label>' +
      '<label for="qb-t">Type<select id="qb-t">' +
      '<option value="">All types</option>' +
      Object.keys(state.QUESTION_TYPES).map(function (t) {
        return '<option value="' + esc(t) + '"' + (bankFilter.type === t ? ' selected' : '') + '>' +
          esc(state.QUESTION_TYPES[t]) + '</option>';
      }).join('') + '</select></label>' +
      '<label for="qb-e">Experiment<select id="qb-e">' +
      '<option value="">All mapped experiments</option>' +
      scope.experiments.map(function (row) {
        var c = data.contextOf(row.experimentId);
        return '<option value="' + esc(row.experimentId) + '"' +
          (bankFilter.experimentId === row.experimentId ? ' selected' : '') + '>' +
          esc(c ? c.experiment.name : row.experimentId) + '</option>';
      }).join('') + '</select></label>' +
      '<span class="lcount">' + rows.length + ' of ' + all.length + ' shown</span>' +
      '</div>' + tableHTML + '</div>' +
      ui.alertBox('info', 'Deleting a question never deletes a result',
        '<p>Delete removes a question from your active Question Bank. An assessment that already contains it ' +
        'keeps its copy, and every attempt a student has already submitted keeps the question, the answer key ' +
        'and the marks it was taken against.</p>') +
      '<div class="gapnote"><span class="gtag">NOT IN THIS BUILD</span><div>' +
      '<strong>Spreadsheet import of questions.</strong> It is not implemented here, and no control claims ' +
      'otherwise. Supplying source material for drafting <em>is</em> implemented — see Draft with ' +
      'assistance.</div></div>' +
      '</div>';

    return {
      area: 'faculty', faculty: f, tenant: tenant, navKey: 'questions',
      title: 'Question Bank — ' + f.name, html: html,
      after: function () {
        function bindFilter(id, key, isText) {
          var el = document.getElementById(id);
          if (!el) { return; }
          el.addEventListener(isText ? 'input' : 'change', function () {
            bankFilter[key] = el.value;
            XRSLP.render(true);
            var again = document.getElementById(id);
            if (again) {
              again.focus();
              if (isText) { again.setSelectionRange(again.value.length, again.value.length); }
            }
          });
        }
        bindFilter('qb-q', 'q', true);
        bindFilter('qb-t', 'type', false);
        bindFilter('qb-e', 'experimentId', false);
        var clear = document.getElementById('qb-clear');
        if (clear) {
          clear.addEventListener('click', function () {
            bankFilter = { owner: f.id, type: '', experimentId: '', q: '' };
            XRSLP.render(true);
          });
        }
        Array.prototype.slice.call(document.querySelectorAll('[data-del]')).forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = btn.getAttribute('data-del');
            var q = state.questionById(id);
            if (!q) { return; }
            var usage = state.questionUsage(id);
            var consequences = [];
            if (usage.assessments.length) {
              consequences.push('It is used in ' + usage.assessments.length + ' ' +
                util.plural(usage.assessments.length, 'assessment') +
                ' (' + usage.assessments.map(function (d) { return d.title; }).join(', ') +
                '). Those assessments keep their copy of the question and continue to work.');
            }
            if (usage.attempts) {
              consequences.push(usage.attempts + ' submitted ' + util.plural(usage.attempts, 'attempt') +
                ' already contains this question. Every one of those attempts and its result stays exactly ' +
                'as it is.');
            }
            ui.openDialog({
              title: 'Delete this question?',
              bodyHTML: '<p>' + esc(q.text) + '</p>' +
                (consequences.length
                  ? '<div class="consequence">' + ui.ic('info') + '<span>' +
                    consequences.map(esc).join('</span></div><div class="consequence">' + ui.ic('info') +
                    '<span>') + '</span></div>'
                  : '<div class="consequence">' + ui.ic('info') +
                    '<span>This question is not used in any assessment and no student has answered it.</span></div>') +
                '<div class="consequence">' + ui.ic('alert') +
                '<span>The question is removed from your active Question Bank. To use it again you would ' +
                'write it again.</span></div>',
              okLabel: 'Delete question',
              onConfirm: function () {
                if (state.deleteQuestion(id)) { ui.toast('Question deleted from your Question Bank.'); }
                XRSLP.render(true);
              }
            });
          });
        });
      }
    };
  };

  /* ============================================================
     QUESTION EDITOR — one form for create and edit.
     ============================================================ */
  var OPTION_SLOTS = 6;

  function questionForm(f, opts) {
    var q = opts.question || null;
    var scope = state.facultyScope(f.id);
    var type = opts.type || (q ? q.type : 'mcq');
    var options = (q && q.type === 'mcq' ? q.options.slice() : []);
    while (options.length < 4) { options.push(''); }
    options = options.slice(0, OPTION_SLOTS);
    var answer = q && q.type === 'mcq' ? q.answer : -1;

    var optionRows = options.map(function (opt, i) {
      return '<div class="field optrow" id="q-opt-' + i + '">' +
        '<div class="opt-line">' +
        '<input type="radio" name="q-answer" id="q-ans-' + i + '" value="' + i + '"' +
          (answer === i ? ' checked' : '') + '>' +
        '<label class="sr-only" for="q-ans-' + i + '">Option ' + (i + 1) + ' is the correct answer</label>' +
        '<label class="sr-only" for="q-opt-i-' + i + '">Option ' + (i + 1) + ' text</label>' +
        '<input type="text" id="q-opt-i-' + i + '" data-opt="' + i + '" value="' + esc(opt) + '" ' +
        'placeholder="Option ' + (i + 1) + (i < 2 ? '' : ' (leave blank if unused)') + '">' +
        '</div></div>';
    }).join('');

    return '<form id="q-form" novalidate><div class="form-errors"></div>' +
      '<fieldset class="fgroup boxed"><legend>Question type</legend>' +
      '<div class="field" id="q-type">' +
      Object.keys(state.QUESTION_TYPES).map(function (t) {
        var descr = t === 'mcq' ? 'One correct option from a list.'
          : t === 'tf' ? 'A statement that is either true or false.'
          : 'A written answer that you review and mark yourself.';
        return '<div class="radiorow' + (type === t ? ' is-selected' : '') + '">' +
          '<input type="radio" name="q-type" id="q-type-' + t + '" value="' + t + '"' +
          (type === t ? ' checked' : '') + '>' +
          '<label for="q-type-' + t + '"><strong>' + esc(state.QUESTION_TYPES[t]) + '</strong>' +
          '<span class="optdesc">' + esc(descr) + '</span></label></div>';
      }).join('') + '</div></fieldset>' +

      '<div class="field" id="q-exp"><label for="q-exp-i">Experiment ' +
        '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
        '<select id="q-exp-i">' +
        '<option value="">Choose an experiment…</option>' +
        scope.experiments.map(function (row) {
          var c = data.contextOf(row.experimentId);
          var sel = (q ? q.experimentId : opts.experimentId) === row.experimentId;
          return '<option value="' + esc(row.experimentId) + '"' + (sel ? ' selected' : '') + '>' +
            esc(c ? c.course.name + ' — ' + c.experiment.name : row.experimentId) + '</option>';
        }).join('') + '</select>' +
        '<p class="hint">Only experiments mapped to you appear here.</p></div>' +

      '<div class="field" id="q-text"><label for="q-text-i">Question ' +
        '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
        '<textarea id="q-text-i" rows="3">' + esc(q ? q.text : (opts.text || '')) + '</textarea></div>' +

      '<div class="field" id="q-points"><label for="q-points-i">Marks ' +
        '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
        '<input type="number" id="q-points-i" min="1" max="100" step="1" value="' +
        esc(q ? (q.points || 1) : (opts.points || 1)) + '"></div>' +

      '<fieldset class="fgroup boxed" id="q-mcq-wrap"><legend>Options and correct answer</legend>' +
      '<p class="hint">At least two options. Mark exactly one as correct — students never see which.</p>' +
      '<div class="field" id="q-answer"><div class="optlist">' + optionRows + '</div></div>' +
      '</fieldset>' +

      '<fieldset class="fgroup boxed" id="q-tf-wrap"><legend>Correct answer</legend>' +
      '<div class="field" id="q-tf">' +
      [['true', 'True'], ['false', 'False']].map(function (pair) {
        var checked = q && q.type === 'tf' && q.answer === (pair[0] === 'true');
        return '<div class="radiorow' + (checked ? ' is-selected' : '') + '">' +
          '<input type="radio" name="q-tf" id="q-tf-' + pair[0] + '" value="' + pair[0] + '"' +
          (checked ? ' checked' : '') + '>' +
          '<label for="q-tf-' + pair[0] + '">' + pair[1] + '</label></div>';
      }).join('') + '</div></fieldset>' +

      '<div class="field" id="q-guidance"><label for="q-guidance-i">Evaluation guidance</label>' +
        '<textarea id="q-guidance-i" rows="3" placeholder="What a good answer covers.">' +
        esc(q ? q.guidance : (opts.guidance || '')) + '</textarea>' +
        '<p class="hint">Shown to the student as guidance on a written answer, and used by you when you review ' +
        'it. A written answer needs no machine answer key.</p></div>' +

      '<div class="field" id="q-expl"><label for="q-expl-i">Explanation</label>' +
        '<textarea id="q-expl-i" rows="3" placeholder="Why the correct answer is correct.">' +
        esc(q ? q.explanation : (opts.explanation || '')) + '</textarea>' +
        '<p class="hint">Shown to the student with their result, when your visibility policy releases it. ' +
        'Never shown during an attempt.</p></div>' +

      '<div class="formact">' +
      '<button class="btn pri" type="submit" id="q-save">' + esc(opts.submitLabel || 'Save question') + '</button>' +
      '<a class="btn sec" href="' + F.href.bank(f.id) + '">Cancel</a>' +
      '</div></form>';
  }

  /* Reads the editor form. Kept in one place so create and edit cannot
     drift apart. */
  function readQuestionForm() {
    var typeEl = document.querySelector('input[name="q-type"]:checked');
    var type = typeEl ? typeEl.value : '';
    var opts = [];
    Array.prototype.slice.call(document.querySelectorAll('[data-opt]')).forEach(function (el) {
      opts[Number(el.getAttribute('data-opt'))] = el.value;
    });
    var mcqAns = document.querySelector('input[name="q-answer"]:checked');
    var tfAns = document.querySelector('input[name="q-tf"]:checked');
    return {
      type: type,
      experimentId: document.getElementById('q-exp-i').value,
      text: document.getElementById('q-text-i').value,
      points: document.getElementById('q-points-i').value,
      options: opts,
      answer: type === 'mcq' ? (mcqAns ? Number(mcqAns.value) : -1)
        : type === 'tf' ? (tfAns ? tfAns.value === 'true' : null) : null,
      guidance: document.getElementById('q-guidance-i').value,
      explanation: document.getElementById('q-expl-i').value
    };
  }

  /* Only the fields that belong to the chosen type are present. A
     hidden fieldset is also disabled, so its controls leave the tab
     order rather than becoming invisible traps. */
  function bindTypeSwitch() {
    function sync() {
      var el = document.querySelector('input[name="q-type"]:checked');
      var type = el ? el.value : 'mcq';
      [['q-mcq-wrap', type === 'mcq'], ['q-tf-wrap', type === 'tf'],
       ['q-guidance', type === 'descriptive'], ['q-expl', type !== 'descriptive']].forEach(function (pair) {
        var wrap = document.getElementById(pair[0]);
        if (!wrap) { return; }
        wrap.hidden = !pair[1];
        Array.prototype.slice.call(wrap.querySelectorAll('input, textarea, select')).forEach(function (c) {
          c.disabled = !pair[1];
        });
      });
      Array.prototype.slice.call(document.querySelectorAll('#q-type .radiorow, #q-tf .radiorow'))
        .forEach(function (rowEl) {
          var input = rowEl.querySelector('input');
          rowEl.classList.toggle('is-selected', !!(input && input.checked));
        });
    }
    Array.prototype.slice.call(document.querySelectorAll('input[name="q-type"], input[name="q-tf"]'))
      .forEach(function (el) { el.addEventListener('change', sync); });
    sync();
  }

  XRSLP.screens.facultyQuestionNew = function (params) {
    var r = F.requireFaculty(params, 'questions');
    if (!r.faculty) { return r.fail; }
    var f = r.faculty, tenant = r.tenant;
    var scope = state.facultyScope(f.id);
    if (!scope.experiments.length) { return { redirect: F.href.bank(f.id) }; }

    var html =
      ui.crumbs([{ label: 'Question Bank', href: F.href.bank(f.id) }, { label: 'Add a question' }]) +
      ui.phead('Add a question', 'It goes into your Question Bank. Adding it to an assessment is a separate step.') +
      '<div class="formwrap"><div class="stack">' +
      ui.card('Question', questionForm(f, {
        /* Re-own the filter first: read raw, the preselected experiment
           could be one another faculty member had filtered to. */
        experimentId: bankFilterFor(f.id).experimentId || scope.experiments[0].experimentId,
        submitLabel: 'Add to Question Bank'
      }), null, 'h2') +
      '</div><div class="formaside">' +
      ui.card('Where this goes',
        '<p class="cardlede">A new question is added to your Question Bank only. No assessment changes, and no ' +
        'student sees it, until you add it to an assessment yourself.</p>' +
        '<p class="cardlede">A written answer needs no machine answer key — you review and mark it.</p>',
        null, 'h2') +
      '</div></div>';

    return {
      area: 'faculty', faculty: f, tenant: tenant, navKey: 'questions',
      title: 'Add a question', html: html,
      after: function () {
        bindTypeSwitch();
        var formEl = document.getElementById('q-form');
        if (!formEl) { return; }
        formEl.addEventListener('submit', function (ev) {
          ev.preventDefault();
          var res = state.addQuestion(tenant.id, readQuestionForm(), f.id);
          if (!res.ok) { ui.showErrors(formEl, res.errors, 'This question cannot be added yet'); return; }
          ui.clearErrors(formEl);
          XRSLP.router.go(F.href.bank(f.id));
          ui.toast('Question added to your Question Bank.');
          XRSLP.render(true);
        });
      }
    };
  };

  XRSLP.screens.facultyQuestionEdit = function (params) {
    var r = F.requireFaculty(params, 'questions');
    if (!r.faculty) { return r.fail; }
    var f = r.faculty, tenant = r.tenant;
    var q = state.activeQuestion(params.questionId);
    if (!q || q.tenantId !== tenant.id || !state.facultyCanManage(f.id, q.experimentId)) {
      return {
        area: 'faculty', faculty: f, tenant: tenant, navKey: 'questions',
        title: 'Question not available',
        html: ui.phead('Question not available') +
          '<div class="tablecard">' + ui.emptyState({
            icon: 'alertCirc', heading: 'h2',
            title: 'This question is not in your Question Bank',
            body: 'It may have been deleted, or it may belong to an experiment that is not mapped to you.',
            actionsHTML: '<a class="btn pri" href="' + F.href.bank(f.id) + '">Back to the Question Bank</a>'
          }) + '</div>'
      };
    }

    var usage = state.questionUsage(q.id);
    var html =
      ui.crumbs([{ label: 'Question Bank', href: F.href.bank(f.id) }, { label: 'Edit question' }]) +
      ui.phead('Edit question', esc(F.typeLabel(q.type)) + ' · ' +
        esc(data.contextOf(q.experimentId) ? data.contextOf(q.experimentId).experiment.name : q.experimentId)) +
      '<div class="formwrap"><div class="stack">' +
      ui.card('Question', questionForm(f, { question: q, submitLabel: 'Save question' }), null, 'h2') +
      '</div><div class="formaside">' +
      ui.card('What editing changes',
        '<div class="kv">' +
        '<div class="k">Used in</div><div class="v">' + (usage.assessments.length
          ? esc(usage.assessments.map(function (d) { return d.title; }).join(', '))
          : 'No assessment yet') + '</div>' +
        '<div class="k">Submitted attempts</div><div class="v tabular">' + usage.attempts + '</div>' +
        '<div class="k">Revision</div><div class="v tabular">' + q.revision + '</div>' +
        '</div>' +
        '<p class="cardfoot">Saving changes this question in your Question Bank. An assessment that already ' +
        'contains it keeps its own copy — you decide, question by question, whether to take the update. ' +
        'Attempts a student has already submitted never change.</p>', null, 'h2') +
      (usage.attempts
        ? ui.alertBox('info', 'Answered attempts are protected',
            '<p>' + usage.attempts + ' submitted ' + util.plural(usage.attempts, 'attempt') +
            ' contains this question. Each of those keeps the wording, the options, the answer key and the marks ' +
            'it was answered against, whatever you change here.</p>')
        : '') +
      '</div></div>';

    return {
      area: 'faculty', faculty: f, tenant: tenant, navKey: 'questions',
      title: 'Edit question', html: html,
      after: function () {
        bindTypeSwitch();
        var formEl = document.getElementById('q-form');
        if (!formEl) { return; }
        formEl.addEventListener('submit', function (ev) {
          ev.preventDefault();
          var res = state.updateQuestion(q.id, readQuestionForm());
          if (!res.ok) { ui.showErrors(formEl, res.errors, 'This question cannot be saved yet'); return; }
          ui.clearErrors(formEl);
          XRSLP.router.go(F.href.bank(f.id));
          ui.toast('Question updated.');
          XRSLP.render(true);
        });
      }
    };
  };

  /* ============================================================
     ASSISTED QUESTION DRAFTING (U-FAC-09 · STK31-33)

     Drafts are held on this screen only. They are NOT Question Bank
     items, they have no id in any collection, and a refresh discards
     them — because a draft nobody reviewed should not survive as
     something that looks reviewed.

     Nothing here contacts a service. See js/ai-assist.js.
     ============================================================ */
  /* Held drafts, plus WHICH ONE is being edited. `openDraft` is an index
     into `drafts`, or null when every draft is collapsed to its summary.

     Exactly one editor exists in the DOM at a time. That is the point of
     the redesign — three simultaneous editors made the page a wall of
     form controls with no hierarchy — and it has a second benefit worth
     stating: because there is only one, the editor can reuse the SAME
     field ids as the manual question form (`q-text`, `q-points`,
     `q-answer`, `q-tf`), so `state.validateQuestion` errors land on the
     right control through `ui.showErrors` with no special casing. */
  var aiState = { owner: null, prompt: '', sourceText: '', sourceName: '', type: 'mixed', count: 3,
                  experimentId: '', drafts: [], generated: false, openDraft: null };
  /* Drafts belong to the faculty member who generated them. Switching
     to a different one starts from nothing rather than inheriting
     someone else's unreviewed drafts. */
  function aiStateFor(facultyId) {
    if (aiState.owner !== facultyId) {
      aiState = { owner: facultyId, prompt: '', sourceText: '', sourceName: '', type: 'mixed', count: 3,
                  experimentId: '', drafts: [], generated: false, openDraft: null };
    }
    return aiState;
  }

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  XRSLP.screens.facultyQuestionDraft = function (params) {
    var r = F.requireFaculty(params, 'questions');
    if (!r.faculty) { return r.fail; }
    var f = r.faculty, tenant = r.tenant;
    var scope = state.facultyScope(f.id);
    if (!scope.experiments.length) { return { redirect: F.href.bank(f.id) }; }
    aiStateFor(f.id);
    var mappedIds = scope.experiments.map(function (x) { return x.experimentId; });
    if (!aiState.experimentId || mappedIds.indexOf(aiState.experimentId) === -1) {
      aiState.experimentId = scope.experiments[0].experimentId;
      aiState.drafts = [];
      aiState.generated = false;
      aiState.openDraft = null;
    }
    /* A stale index — after a discard, or a state the screen re-entered —
       must never address a draft that is gone. */
    if (aiState.openDraft !== null &&
        (aiState.openDraft < 0 || aiState.openDraft >= aiState.drafts.length)) {
      aiState.openDraft = null;
    }

    var requestCard = ui.card('What should the drafts cover?',
      '<form id="ai-form" novalidate>' +
      '<div class="field" id="ai-exp"><label for="ai-exp-i">Experiment</label>' +
      '<select id="ai-exp-i">' + scope.experiments.map(function (row) {
        var c = data.contextOf(row.experimentId);
        return '<option value="' + esc(row.experimentId) + '"' +
          (aiState.experimentId === row.experimentId ? ' selected' : '') + '>' +
          esc(c ? c.course.name + ' — ' + c.experiment.name : row.experimentId) + '</option>';
      }).join('') + '</select></div>' +
      '<div class="field" id="ai-prompt"><label for="ai-prompt-i">Prompt</label>' +
      '<textarea id="ai-prompt-i" rows="3" placeholder="Create 3 beginner questions about ' +
        esc((data.contextOf(aiState.experimentId) || { experiment: { name: '' } }).experiment.name) +
        ' specimen preparation and the failure plane.">' + esc(aiState.prompt) + '</textarea>' +
      '<p class="hint">The wording steers which of the source material the drafts are built from.</p></div>' +
      '<div class="field" id="ai-src"><label for="ai-src-i">Source material</label>' +
      '<textarea id="ai-src-i" rows="5" placeholder="Paste lecture notes, a lab sheet or any text the ' +
        'questions should come from.">' + esc(aiState.sourceText) + '</textarea>' +
      '<p class="hint">Optional. Without it, drafts are built from this experiment’s own learning resources. ' +
      'Anything you paste or open stays in this browser.</p>' +
      '<div class="fileline"><label class="btn sec sm" for="ai-file">Open a text file…' +
      '<input type="file" id="ai-file" accept=".txt,.md,.csv,text/plain" class="sr-only"></label>' +
      '<span id="ai-file-name">' + (aiState.sourceName ? esc(aiState.sourceName) + ' loaded'
        : 'No file opened') + '</span></div></div>' +
      '<div class="frow">' +
      '<div class="field" id="ai-type"><label for="ai-type-i">Question type</label>' +
      '<select id="ai-type-i">' +
      [['mixed', 'A mix of types'], ['mcq', 'Multiple choice'], ['tf', 'True or false'],
       ['descriptive', 'Descriptive']].map(function (pair) {
        return '<option value="' + pair[0] + '"' + (aiState.type === pair[0] ? ' selected' : '') + '>' +
          esc(pair[1]) + '</option>';
      }).join('') + '</select></div>' +
      '<div class="field" id="ai-count"><label for="ai-count-i">Number of drafts</label>' +
      '<select id="ai-count-i">' + [1, 2, 3, 4, 5, 6].map(function (n) {
        return '<option value="' + n + '"' + (aiState.count === n ? ' selected' : '') + '>' + n + '</option>';
      }).join('') + '</select></div>' +
      '</div>' +
      '<div class="formact"><button class="btn pri" type="submit" id="ai-go">Generate draft questions</button>' +
      (aiState.drafts.length
        ? '<button class="btn sec" type="button" id="ai-clear">Discard all drafts</button>' : '') +
      '</div></form>', null, 'h2');

    /* ---------- the collapsed summary ----------
       Enough to decide on the draft WITHOUT opening it: order, type, that
       it is an unreviewed AI draft, the question itself, the marks, where
       it came from, and — for a keyed type — how many options there are
       and whether a key is set. What it deliberately does NOT show is
       which option the key points at: that is a correctness verdict, and
       the whole rule here is that a faculty member decides it. */
    function draftMeta(d) {
      var bits = [];
      if (d.type === 'mcq') {
        var filled = (d.options || []).filter(function (o) { return String(o || '').trim(); }).length;
        bits.push(filled + ' ' + util.plural(filled, 'option'));
      } else if (d.type === 'tf') {
        bits.push('True or false');
      }
      var pts = Number(d.points);
      bits.push((isNaN(pts) ? d.points : pts) + ' ' + util.plural(pts, 'mark'));
      if (d.type === 'mcq') {
        bits.push(d.answer >= 0 ? 'answer key selected' : 'no answer key selected');
      } else if (d.type === 'tf') {
        bits.push(d.answer === true || d.answer === false ? 'answer key selected' : 'no answer key selected');
      }
      return bits;
    }

    /* ---------- the ONE open editor ----------
       Field ids match the manual question form on purpose; see the note
       on `aiState`. */
    function draftEditor(d, i) {
      var isMcq = d.type === 'mcq';
      var isTf = d.type === 'tf';
      var opts = (d.options || []).slice();
      while (opts.length < 4) { opts.push(''); }
      return '<div class="dc-ed" id="draft-ed-' + i + '"><div class="form-errors"></div>' +
        '<div class="field" id="q-text"><label for="q-text-i">Question ' +
        '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
        '<textarea id="q-text-i" rows="3">' + esc(d.text) + '</textarea></div>' +
        (isMcq
          ? '<fieldset class="fgroup boxed"><legend>Options and correct answer</legend>' +
            '<p class="hint">Check every option before you add this. The key below is a draft, not a fact.</p>' +
            '<div class="field" id="q-answer"><div class="optlist">' +
            opts.map(function (o, oi) {
              return '<div class="field optrow" id="q-opt-' + oi + '"><div class="opt-line">' +
                '<input type="radio" name="q-answer" id="q-ans-' + oi + '" value="' + oi + '"' +
                (d.answer === oi ? ' checked' : '') + '>' +
                '<label class="sr-only" for="q-ans-' + oi + '">Option ' + (oi + 1) +
                ' is the correct answer</label>' +
                '<label class="sr-only" for="q-opt-i-' + oi + '">Option ' + (oi + 1) + ' text</label>' +
                '<input type="text" id="q-opt-i-' + oi + '" data-opt="' + oi + '" value="' + esc(o) + '" ' +
                'placeholder="Option ' + (oi + 1) + (oi < 2 ? '' : ' (leave blank if unused)') + '">' +
                '</div></div>';
            }).join('') + '</div></div></fieldset>'
          : '') +
        (isTf
          ? '<fieldset class="fgroup boxed"><legend>Correct answer</legend>' +
            '<div class="field" id="q-tf">' +
            [['true', 'True', true], ['false', 'False', false]].map(function (pair) {
              return '<div class="radiorow' + (d.answer === pair[2] ? ' is-selected' : '') + '">' +
                '<input type="radio" name="q-tf" id="q-tf-' + pair[0] + '" value="' + pair[0] + '"' +
                (d.answer === pair[2] ? ' checked' : '') + '>' +
                '<label for="q-tf-' + pair[0] + '">' + pair[1] + '</label></div>';
            }).join('') + '</div></fieldset>'
          : '') +
        '<div class="frow">' +
        '<div class="field" id="q-points"><label for="q-points-i">Marks ' +
        '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
        '<input type="number" id="q-points-i" min="1" max="100" step="1" value="' +
        esc(d.points) + '"></div>' +
        '<div class="field" id="q-extra"><label for="q-extra-i">' +
        (d.type === 'descriptive' ? 'Evaluation guidance' : 'Explanation') + '</label>' +
        '<textarea id="q-extra-i" rows="3">' +
        esc(d.type === 'descriptive' ? d.guidance : d.explanation) + '</textarea></div>' +
        '</div></div>';
    }

    function draftCard(d, i) {
      var open = aiState.openDraft === i;
      var edId = 'draft-ed-' + i;
      var meta = draftMeta(d);
      return '<li class="draftcard' + (open ? ' is-open' : '') + '" id="draft-' + i + '">' +
        '<div class="dc-h">' +
        '<span class="dc-n" aria-hidden="true">' + pad2(i + 1) + '</span>' +
        F.typeBadge(d.type) +
        '<span class="dc-flag">' + ui.ic('info', 'sm') + 'AI-assisted draft · Review required</span>' +
        /* The open card is marked in TEXT as well as with an accent, so
           "which one am I editing" never depends on colour. */
        (open ? '<span class="dc-editing">Editing</span>' : '') +
        '</div>' +
        (open
          ? draftEditor(d, i)
          : '<p class="dc-q">' + esc(d.text) + '</p>' +
            '<p class="dc-meta">' + esc(meta.join(' · ')) + '</p>' +
            '<p class="dc-src">Source: ' + esc(d.sourceTitle) + '</p>') +
        '<div class="dc-a">' +
        '<button class="btn sm sec" type="button" data-edit="' + i + '" aria-expanded="' + open + '"' +
        (open ? ' aria-controls="' + edId + '"' : '') + '>' + (open ? 'Close editor' : 'Review &amp; edit') +
        '<span class="sr-only"> — draft ' + (i + 1) + '</span></button>' +
        '<button class="btn sm pri" type="button" data-add="' + i + '">Add to Question Bank' +
        '<span class="sr-only"> — draft ' + (i + 1) + '</span></button>' +
        '<button class="btn sm sec" type="button" data-discard="' + i + '">Discard' +
        '<span class="sr-only"> draft ' + (i + 1) + '</span></button>' +
        '</div></li>';
    }

    var draftsCard = aiState.generated
      ? ui.card('Draft questions',
          aiState.drafts.length
            ? '<p class="cardlede">Review each draft before adding it to the Question Bank. Nothing below is in ' +
              'your Question Bank yet, and only the draft you open is editable — change anything that is wrong, ' +
              'especially the answer key.</p>' +
              '<ul class="draftlist">' + aiState.drafts.map(draftCard).join('') + '</ul>'
            : ui.emptyState({
                icon: 'check', heading: 'h3',
                title: 'No drafts left',
                body: 'You have added or discarded every draft from this run. Generate again if you want more.'
              }),
          aiState.drafts.length + ' AI-assisted ' + util.plural(aiState.drafts.length, 'draft'), 'h2')
      : ui.card('Draft questions',
          ui.emptyState({
            icon: 'edit', heading: 'h3',
            title: 'No drafts yet',
            body: 'Describe what the questions should cover, optionally paste the material they should come ' +
              'from, and generate. Drafts appear here for you to review.'
          }), null, 'h2');

    /* The request form keeps its rail; the review workspace sits BELOW at
       full width. An editor squeezed beside a 360px rail is the reason
       long option text used to wrap into a column of fragments. */
    var html =
      ui.crumbs([{ label: 'Question Bank', href: F.href.bank(f.id) }, { label: 'Draft with assistance' }]) +
      ui.phead('Draft questions with assistance',
        'Drafts only. Nothing reaches your Question Bank, an assessment or a student until you add it.') +
      '<div class="grid-rail"><div class="stack">' +
      requestCard +
      '</div><div class="stack">' +
      ui.protoNote('<p><strong>AI-assisted drafting — prototype.</strong> There is no AI provider connected and ' +
        'no network request is made. Drafts are generated locally, in this browser, from the source material you ' +
        'supply or from this experiment’s own learning resources. The same prompt always produces the same ' +
        'drafts.</p>' +
        '<p style="margin-top:8px">No claim is made about the quality or accuracy of a draft. Read every one ' +
        'before adding it to the Question Bank.</p>') +
      ui.card('How a draft becomes a question',
        '<ol class="steplist">' +
        '<li>Drafts are generated and listed below, each marked <strong>AI-assisted draft</strong> and ' +
        '<strong>Review required</strong>.</li>' +
        '<li>You open one at a time and edit anything that is wrong — the wording, the options, the marks, and ' +
        'above all the correct answer.</li>' +
        '<li>You add the ones you want. Only then does a question exist in your Question Bank.</li>' +
        '<li>Adding it to an assessment is still a separate step, in the assessment builder.</li>' +
        '</ol>' +
        '<p class="cardfoot">A question added this way keeps its assisted provenance in the Question Bank, so ' +
        'you can always see where it came from.</p>', null, 'h2') +
      '</div></div>' +
      '<div class="draftwork">' + draftsCard + '</div>';

    return {
      area: 'faculty', faculty: f, tenant: tenant, navKey: 'questions',
      title: 'Draft questions with assistance', html: html,
      after: function () {
        var formEl = document.getElementById('ai-form');

        var fileInput = document.getElementById('ai-file');
        if (fileInput) {
          fileInput.addEventListener('change', function () {
            var file = fileInput.files && fileInput.files[0];
            if (!file) { return; }
            var reader = new FileReader();
            reader.onload = function () {
              var text = String(reader.result || '').slice(0, 20000);
              var box = document.getElementById('ai-src-i');
              if (box) { box.value = text; }
              /* Write it into the held state as well. Living only in the
                 textarea meant any re-render dropped the material while
                 the label still claimed the file was loaded. */
              aiState.sourceText = text;
              aiState.sourceName = file.name;
              var name = document.getElementById('ai-file-name');
              if (name) { name.textContent = file.name + ' loaded'; }
              ui.toast('Source material loaded from ' + file.name + '. It stays in this browser.');
            };
            reader.onerror = function () { ui.toast('That file could not be read.', 'info'); };
            reader.readAsText(file);
          });
        }

        if (formEl) {
          formEl.addEventListener('submit', function (ev) {
            ev.preventDefault();
            aiState.experimentId = document.getElementById('ai-exp-i').value;
            aiState.prompt = document.getElementById('ai-prompt-i').value;
            aiState.sourceText = document.getElementById('ai-src-i').value;
            aiState.type = document.getElementById('ai-type-i').value;
            aiState.count = Number(document.getElementById('ai-count-i').value) || 3;
            aiState.drafts = XRSLP.assist.draftQuestions({
              experimentId: aiState.experimentId,
              prompt: aiState.prompt,
              sourceText: aiState.sourceText,
              type: aiState.type,
              count: aiState.count
            });
            aiState.generated = true;
            /* Everything arrives COLLAPSED. Opening one for the faculty
               member would be this screen choosing which draft matters. */
            aiState.openDraft = null;
            XRSLP.render(true);
            /* Focus stays on the control that was used; the announcement
               is what tells a screen-reader user the list arrived. */
            ui.announce(aiState.drafts.length + ' ' + util.plural(aiState.drafts.length, 'draft') +
              ' generated. Each one needs review. Nothing has been added to your Question Bank.');
            ui.toast(aiState.drafts.length + ' ' + util.plural(aiState.drafts.length, 'draft') +
              ' generated. Nothing has been added to your Question Bank.');
            var first = document.getElementById('draft-0');
            if (first) { first.scrollIntoView({ block: 'start' }); }
          });
        }

        var clearBtn = document.getElementById('ai-clear');
        if (clearBtn) {
          clearBtn.addEventListener('click', function () {
            aiState.drafts = [];
            aiState.generated = false;
            aiState.openDraft = null;
            XRSLP.render(true);
            ui.toast('Drafts discarded. Nothing was added to your Question Bank.');
          });
        }

        /* ⚠ Edits live in the DOM until something needs them, so typing
           never re-renders and never loses focus. They must be read back
           into `aiState` BEFORE any re-render, or opening another draft
           would silently throw the current one's edits away.

           Only ONE editor exists, so this reads that one. The `!textEl`
           guard is load-bearing: when every draft is collapsed there is
           nothing to read, and writing the empty result back would wipe
           a draft that is perfectly intact in state. */
        function syncOpenDraft() {
          var i = aiState.openDraft;
          if (i === null) { return; }
          var d = aiState.drafts[i];
          if (!d) { return; }
          var textEl = document.getElementById('q-text-i');
          if (!textEl) { return; }
          d.text = textEl.value;
          var ptsEl = document.getElementById('q-points-i');
          if (ptsEl) { d.points = ptsEl.value; }
          var extraEl = document.getElementById('q-extra-i');
          if (extraEl) {
            if (d.type === 'descriptive') { d.guidance = extraEl.value; }
            else { d.explanation = extraEl.value; }
          }
          if (d.type === 'mcq') {
            var opts = [];
            Array.prototype.slice.call(document.querySelectorAll('#q-answer [data-opt]'))
              .forEach(function (el) { opts[Number(el.getAttribute('data-opt'))] = el.value; });
            d.options = opts;
            var sel = document.querySelector('input[name="q-answer"]:checked');
            d.answer = sel ? Number(sel.value) : -1;
          } else if (d.type === 'tf') {
            var tf = document.querySelector('input[name="q-tf"]:checked');
            d.answer = tf ? tf.value === 'true' : null;
          }
        }

        /* Called AFTER syncOpenDraft, so it reads the edited draft. */
        function readDraft(i) {
          var d = aiState.drafts[i];
          return {
            type: d.type,
            experimentId: aiState.experimentId,
            text: d.text,
            points: d.points,
            options: (d.options || []).slice(),
            answer: d.answer,
            guidance: d.type === 'descriptive' ? (d.guidance || '') : '',
            explanation: d.type === 'descriptive' ? '' : (d.explanation || ''),
            origin: 'ai'
          };
        }

        /* Removing a draft renumbers the ones after it, so the open index
           has to follow. Getting this wrong would leave the editor open on
           somebody else's draft. */
        function afterRemoval(i) {
          if (aiState.openDraft === i) { aiState.openDraft = null; }
          else if (aiState.openDraft !== null && aiState.openDraft > i) { aiState.openDraft -= 1; }
        }

        function openEditor(i) {
          syncOpenDraft();
          aiState.openDraft = i;
          XRSLP.render(true);
          var field = document.getElementById('q-text-i');
          if (field) { field.focus(); }
        }

        Array.prototype.slice.call(document.querySelectorAll('[data-edit]')).forEach(function (btn) {
          btn.addEventListener('click', function () {
            var i = Number(btn.getAttribute('data-edit'));
            if (aiState.openDraft === i) {
              syncOpenDraft();
              aiState.openDraft = null;
              XRSLP.render(true);
              /* Collapsing returns focus to the control that did it. */
              var back = document.querySelector('[data-edit="' + i + '"]');
              if (back) { back.focus(); }
              return;
            }
            openEditor(i);
          });
        });

        Array.prototype.slice.call(document.querySelectorAll('[data-add]')).forEach(function (btn) {
          btn.addEventListener('click', function () {
            var i = Number(btn.getAttribute('data-add'));
            syncOpenDraft();
            var fields = readDraft(i);
            /* Add is offered from the COLLAPSED summary too, so validate
               first. If the draft is not addable the faculty member is put
               into its editor with the errors on the actual controls,
               rather than being told no beside a card they cannot fix. */
            var errs = state.validateQuestion(fields);
            var res = errs.length ? { ok: false, errors: errs }
                                  : state.addQuestion(tenant.id, fields, f.id);
            if (!res.ok) {
              aiState.openDraft = i;
              XRSLP.render(true);
              var card = document.getElementById('draft-' + i);
              var editor = document.getElementById('draft-ed-' + i);
              if (card) { card.classList.add('has-error'); }
              if (editor) {
                ui.showErrors(editor, res.errors, 'This draft cannot be added yet');
              } else {
                ui.toast(res.errors[0] ? res.errors[0].message : 'This draft cannot be added yet.', 'info');
              }
              return;
            }
            aiState.drafts.splice(i, 1);
            afterRemoval(i);
            XRSLP.render(true);
            ui.toast('Added to your Question Bank. It is not in any assessment yet.');
          });
        });

        Array.prototype.slice.call(document.querySelectorAll('[data-discard]')).forEach(function (btn) {
          btn.addEventListener('click', function () {
            var i = Number(btn.getAttribute('data-discard'));
            syncOpenDraft();
            aiState.drafts.splice(i, 1);
            afterRemoval(i);
            XRSLP.render(true);
            ui.toast('Draft discarded. It was never in your Question Bank.');
          });
        });
      }
    };
  };

  /* ============================================================
     DESCRIPTIVE REVIEW — the queue (U-FAC-10)
     ============================================================ */
  var revFilter = { owner: null, experimentId: '', status: 'pending' };
  function revFilterFor(facultyId) {
    if (revFilter.owner !== facultyId) {
      revFilter = { owner: facultyId, experimentId: '', status: 'pending' };
    }
    return revFilter;
  }

  XRSLP.screens.facultyReviews = function (params) {
    var r = F.requireFaculty(params, 'reviews');
    if (!r.faculty) { return r.fail; }
    var f = r.faculty, tenant = r.tenant;
    var scope = state.facultyScope(f.id);
    revFilterFor(f.id);
    var mappedIds = scope.experiments.map(function (x) { return x.experimentId; });
    if (revFilter.experimentId && mappedIds.indexOf(revFilter.experimentId) === -1) {
      revFilter.experimentId = '';
    }
    var all = state.reviewsForFaculty(f.id, {});
    var rows = all.filter(function (rv) {
      if (revFilter.experimentId && rv.experimentId !== revFilter.experimentId) { return false; }
      if (revFilter.status && rv.status !== revFilter.status) { return false; }
      return true;
    });
    var pendingCount = all.filter(function (rv) { return rv.status === 'pending'; }).length;
    var pref = state.facultyPref(f.id);

    var tableHTML = rows.length
      ? '<div class="tscroll"><table class="dt">' +
        '<caption class="sr-only">Written answers from your students, for the experiments mapped to you.</caption>' +
        '<thead><tr><th scope="col">Student</th><th scope="col">Experiment</th>' +
        '<th scope="col">Question</th><th scope="col" class="num">Marks</th>' +
        '<th scope="col">Submitted</th><th scope="col">State</th>' +
        '<th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' +
        rows.map(function (rv) {
          var p = state.personById(rv.personId);
          var q = state.reviewQuestion(rv);
          var att = state.attemptById(rv.attemptId);
          var ctx = data.contextOf(rv.experimentId);
          return '<tr>' +
            '<td data-label="Student"><span class="tmain">' + esc(p ? p.name : rv.personId) + '</span>' +
              '<span class="tsub">' + esc(p && p.studentId ? p.studentId : '') + '</span></td>' +
            '<td data-label="Experiment">' + esc(ctx ? ctx.experiment.name : rv.experimentId) + '</td>' +
            '<td data-label="Question"><span class="clamp2">' + esc(q ? q.text : 'Written answer') + '</span></td>' +
            '<td data-label="Marks" class="num tabular">' +
              (rv.status === 'completed' ? rv.marks + ' / ' + rv.maxMarks : 'of ' + rv.maxMarks) + '</td>' +
            '<td data-label="Submitted">' + esc(util.fmtDateTime(att ? att.submittedAt : rv.createdAt)) +
              '<span class="tsub2">attempt ' + (att ? att.attemptNo : '?') + '</span></td>' +
            '<td data-label="State">' + (rv.status === 'completed'
              ? ui.badge('b-success', 'check', 'Reviewed')
              : ui.badge('b-warning', 'clock', 'Pending Faculty review')) + '</td>' +
            '<td class="cell-actions"><a class="btn sm ' + (rv.status === 'completed' ? 'sec' : 'pri') + '" href="' +
              F.href.review(f.id, rv.id) + '">' + (rv.status === 'completed' ? 'View' : 'Review') +
              '<span class="sr-only"> ' + esc(p ? p.name : '') + '</span></a></td>' +
            '</tr>';
        }).join('') + '</tbody></table></div>'
      : ui.emptyState({
          /* h2: this empty state is the first section heading under the
             page h1, so h3 would skip a level. */
          icon: all.length ? 'search' : 'check', heading: 'h2',
          title: all.length ? 'Nothing matches these filters'
            : 'No written answers are waiting for you',
          body: all.length
            ? 'Change the experiment or state filter to see other responses.'
            : 'A written answer appears here as soon as a student submits an assessment that contains one, for ' +
              'an experiment mapped to you.'
        });

    var html =
      ui.phead('Reviews', 'Written answers from students on the experiments mapped to you.',
        null, pendingCount ? ' ' + ui.badge('b-warning', 'clock', pendingCount + ' waiting') : '') +
      '<div class="stack">' +
      ui.alertBox('info', 'You are the evaluator',
        /* The authorisation boundary is the Implementation-02 Faculty
           MAPPING. Nothing in this prototype records a teaching
           assignment, so the copy must not imply one. */
        '<p>A written answer is evaluated by the Faculty member mapped to the Experiment. No other role ' +
        'marks it, and no result exists for it until you confirm one.</p>') +
      '<div class="tablecard">' +
      '<div class="listbar">' +
      '<label for="rv-e">Experiment<select id="rv-e">' +
      '<option value="">All mapped experiments</option>' +
      scope.experiments.map(function (row) {
        var c = data.contextOf(row.experimentId);
        return '<option value="' + esc(row.experimentId) + '"' +
          (revFilter.experimentId === row.experimentId ? ' selected' : '') + '>' +
          esc(c ? c.experiment.name : row.experimentId) + '</option>';
      }).join('') + '</select></label>' +
      '<label for="rv-s">State<select id="rv-s">' +
      [['pending', 'Waiting for review'], ['completed', 'Reviewed'], ['', 'All']].map(function (pair) {
        return '<option value="' + pair[0] + '"' + (revFilter.status === pair[0] ? ' selected' : '') + '>' +
          esc(pair[1]) + '</option>';
      }).join('') + '</select></label>' +
      '<span class="lcount">' + rows.length + ' of ' + all.length + ' shown</span>' +
      '</div>' + tableHTML + '</div>' +
      ui.card('Review assistance',
        '<form id="pref-form"><div class="field" id="pref-mode">' +
        '<fieldset class="fgroup"><legend class="sr-only">Review assistance</legend>' +
        [[state.REVIEW_MODE.MANUAL, 'Manual', 'Mark and write feedback yourself. No suggestion is offered.'],
         [state.REVIEW_MODE.ASSISTED, 'With a suggestion',
          'A local prototype suggestion is offered on each response, which you accept, change or ignore.']]
          .map(function (trio) {
            return '<div class="radiorow' + (pref.reviewMode === trio[0] ? ' is-selected' : '') + '">' +
              '<input type="radio" name="pref-mode" id="pref-' + trio[0] + '" value="' + trio[0] + '"' +
              (pref.reviewMode === trio[0] ? ' checked' : '') + '>' +
              '<label for="pref-' + trio[0] + '"><strong>' + esc(trio[1]) + '</strong>' +
              '<span class="optdesc">' + esc(trio[2]) + '</span></label></div>';
          }).join('') + '</fieldset></div></form>' +
        '<p class="cardfoot">This is a preference about how you work, not a change of who evaluates. Either way ' +
        'the result exists only once you confirm it.</p>', null, 'h2') +
      '</div>';

    return {
      area: 'faculty', faculty: f, tenant: tenant, navKey: 'reviews',
      title: 'Reviews — ' + f.name, html: html,
      after: function () {
        function bindFilter(id, key) {
          var el = document.getElementById(id);
          if (!el) { return; }
          el.addEventListener('change', function () {
            revFilter[key] = el.value;
            XRSLP.render(true);
            var again = document.getElementById(id);
            if (again) { again.focus(); }
          });
        }
        bindFilter('rv-e', 'experimentId');
        bindFilter('rv-s', 'status');
        Array.prototype.slice.call(document.querySelectorAll('input[name="pref-mode"]')).forEach(function (el) {
          el.addEventListener('change', function () {
            state.setFacultyReviewMode(f.id, el.value);
            XRSLP.render(true);
            ui.toast(el.value === state.REVIEW_MODE.ASSISTED
              ? 'Review assistance is on. Suggestions still need your confirmation.'
              : 'Review assistance is off.');
          });
        });
      }
    };
  };

  /* ============================================================
     DESCRIPTIVE REVIEW — one response.

     ⚠ THE RULE. `state.finaliseReview` is the only writer of an
     evaluated descriptive result, and this screen is the only caller.
     A suggestion changes nothing until the Faculty member confirms.
     ============================================================ */
  /* Whether the Faculty member actually APPLIED the suggestion, as
     opposed to merely generating one and then ignoring it. Reset for each
     response so the record says what happened on that response. */
  var suggestionApplied = { reviewId: null, applied: false };

  /* ⚠ PRESENTATION STATE — MODULE-LOCAL, NEVER PERSISTED.

     Whether the suggestion panel is on screen is not the same fact as
     whether a suggestion exists. The suggestion RECORD is persisted (it
     carries the audit trail `finaliseReview` stamps); the panel is not.

     Conflating the two was a real bug: because `generateReviewAssistance`
     saves to localStorage, a hard reload found `rv.assistance` truthy and
     rebuilt the whole panel unbidden — the Generate control gone, a
     tinted block owning the Suggestion section — as though something had
     reopened itself. A reload must land on a normal Review Detail. This
     flag starts empty on every page load, so it does. */
  var suggestionView = { reviewId: null, shown: false };

  XRSLP.screens.facultyReview = function (params) {
    var r = F.requireFaculty(params, 'reviews');
    if (!r.faculty) { return r.fail; }
    var f = r.faculty, tenant = r.tenant;
    var rv = state.reviewById(params.reviewId);
    if (!rv || !state.facultyCanReview(f.id, rv)) {
      return {
        area: 'faculty', faculty: f, tenant: tenant, navKey: 'reviews',
        title: 'Response not available',
        html: ui.phead('Response not available') +
          '<div class="tablecard">' + ui.emptyState({
            icon: 'alertCirc', heading: 'h2',
            title: 'This response is not in your queue',
            body: 'It may belong to an experiment that is not mapped to you, or the address may be stale.',
            actionsHTML: '<a class="btn pri" href="' + F.href.reviews(f.id) + '">Back to Reviews</a>'
          }) + '</div>'
      };
    }

    var student = state.personById(rv.personId);
    var att = state.attemptById(rv.attemptId);
    var q = state.reviewQuestion(rv);
    var answer = state.reviewAnswer(rv);
    var ctx = data.contextOf(rv.experimentId);
    var done = rv.status === 'completed';
    var pref = state.facultyPref(f.id);
    var siblings = state.reviewsForAttempt(rv.attemptId);
    var attState = state.attemptReviewState(rv.attemptId);
    var release = att ? state.releaseFor(att) : state.assessmentRelease(null);
    var nextPending = state.reviewsForFaculty(f.id, { status: 'pending' }).filter(function (x) {
      return x.id !== rv.id;
    })[0] || null;
    if (suggestionApplied.reviewId !== rv.id) { suggestionApplied = { reviewId: rv.id, applied: false }; }

    var contextCard = ui.card('The response',
      '<div class="kv">' +
      '<div class="k">Student</div><div class="v">' + esc(student ? student.name : rv.personId) +
        (student && student.studentId ? ' <span class="muted">· ' + esc(student.studentId) + '</span>' : '') + '</div>' +
      '<div class="k">Experiment</div><div class="v">' + esc(ctx ? ctx.experiment.name : rv.experimentId) +
        '<span class="tsub2">' + F.courseLine(rv.experimentId) + '</span></div>' +
      '<div class="k">Assessment</div><div class="v">' +
        esc(att && att.snapshot ? att.snapshot.title : '—') + '</div>' +
      '<div class="k">Attempt</div><div class="v">' + (att ? att.attemptNo : '—') +
        (att && att.snapshot && att.snapshot.attemptLimit ? ' of ' + att.snapshot.attemptLimit : '') + '</div>' +
      '<div class="k">Submitted</div><div class="v">' +
        esc(util.fmtDateTime(att ? att.submittedAt : rv.createdAt)) + '</div>' +
      (att && att.sourceTechnology && data.TECHNOLOGIES[att.sourceTechnology]
        ? '<div class="k">Taken after</div><div class="v">' + ui.fmtBadge(att.sourceTechnology) +
          ' simulation</div>' : '') +
      '<div class="k">Maximum marks</div><div class="v tabular">' + rv.maxMarks + '</div>' +
      (siblings.length > 1
        ? '<div class="k">Written answers in this attempt</div><div class="v">' +
          attState.completed + ' of ' + attState.total + ' reviewed</div>' : '') +
      '</div>', null, 'h2');

    var answerCard = ui.card('Question and answer',
      '<div class="revq"><span class="an-k">Question</span><p>' + esc(q ? q.text : '—') + '</p></div>' +
      (q && q.guidance
        ? '<div class="revg"><span class="an-k">' + ui.ic('info', 'sm') + 'Your evaluation guidance</span>' +
          '<p>' + esc(q.guidance) + '</p></div>' : '') +
      '<div class="revans"><span class="an-k">The student’s answer</span>' +
      (answer ? '<p>' + esc(answer).replace(/\n/g, '<br>') + '</p>'
              : '<p class="muted">This question was left unanswered.</p>') + '</div>', null, 'h2');

    /* The panel shows only when THIS page load generated it. A record left
       in storage by an earlier visit is data, not a reason to reopen. */
    var showSuggestion = !!rv.assistance && suggestionView.reviewId === rv.id && suggestionView.shown;

    var assistHTML = '';
    if (!done && pref.reviewMode === state.REVIEW_MODE.ASSISTED) {
      if (showSuggestion) {
        /* Tolerate a record written before `signals` became `reasons`. */
        var reasons = rv.assistance.reasons || rv.assistance.signals || [];
        assistHTML = ui.card('Suggestion',
          '<div class="assistbox" id="rv-suggestion" role="group" aria-labelledby="rv-sg-h">' +
          '<div class="ab-h"><span id="rv-sg-h" class="ab-t">AI-assisted suggestion</span>' +
          ui.badge('b-warning', 'alert', 'Faculty confirmation required') + '</div>' +
          '<div class="ab-v"><span class="ab-k">Suggested marks</span>' +
          '<span class="ab-n tabular">' + rv.assistance.suggestedMarks + ' / ' + rv.maxMarks + '</span></div>' +
          '<div class="ab-f"><span class="ab-k">Suggested feedback</span>' +
          '<p>' + esc(rv.assistance.suggestedFeedback) + '</p></div>' +
          '<div class="ab-s"><span class="ab-k">Why this was suggested</span><ul>' +
          reasons.map(function (s) {
            return '<li><span class="sg-k">' + esc(s.label) + '</span><span class="sg-v">' +
              esc(s.value) + '</span></li>';
          }).join('') + '</ul></div>' +
          '<p class="ab-r">This is a starting point only. Review and change it before confirming.</p>' +
          '<div class="formact"><button class="btn sec sm" type="button" id="rv-use">Use suggestion</button>' +
          '<button class="btn sec sm" type="button" id="rv-dismiss">Dismiss</button>' +
          '<span class="formnote">Using it fills the form below. Nothing is saved until you confirm the ' +
          'review.</span></div>' +
          '</div>', null, 'h2');
      } else {
        assistHTML = ui.card('Suggestion',
          '<p class="cardlede">You can generate a local suggestion for this response. It fills nothing in until ' +
          'you choose to use it, and it never becomes the student’s result on its own.</p>' +
          '<div class="formact"><button class="btn sec" type="button" id="rv-gen">Generate suggestion</button>' +
          '</div>', null, 'h2');
      }
    } else if (!done) {
      assistHTML = ui.card('Review assistance is off',
        '<p class="cardlede">You are marking this response yourself. You can turn a local suggestion on in ' +
        'Reviews — it would be a suggestion only, and you would still confirm every result.</p>' +
        '<div class="formact"><a class="btn sec sm" href="' + F.href.reviews(f.id) +
        '">Review assistance settings</a></div>', null, 'h2');
    }

    var decisionCard = done
      ? ui.card('Your review',
          '<div class="kv">' +
          '<div class="k">Marks awarded</div><div class="v tabular">' + rv.marks + ' of ' + rv.maxMarks + '</div>' +
          '<div class="k">Feedback</div><div class="v">' +
            (rv.feedback ? esc(rv.feedback) : '<span class="muted">No written feedback</span>') + '</div>' +
          '<div class="k">Reviewed</div><div class="v">' + esc(util.fmtDateTime(rv.reviewedAt)) + '</div>' +
          '<div class="k">Reviewed by</div><div class="v">' +
            esc((state.personById(rv.reviewedBy) || {}).name || 'Faculty') + '</div>' +
          (rv.assistance
            ? '<div class="k">Assistance</div><div class="v">' +
              (rv.assistance.accepted ? 'A suggestion was used as a starting point'
                                      : 'A suggestion was generated and not used') + '</div>' : '') +
          '</div>' +
          '<div class="consequence">' + ui.ic('info') +
          '<span>A completed review is read-only in this prototype. No source establishes a re-grading ' +
          'workflow, so none is invented — see the note beside this card.</span></div>',
          null, 'h2')
      : ui.card('Your review',
          '<form id="rv-form" novalidate><div class="form-errors"></div>' +
          '<div class="frow">' +
          '<div class="field" id="rv-marks"><label for="rv-marks-i">Marks awarded ' +
            '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
            '<input type="number" id="rv-marks-i" min="0" max="' + rv.maxMarks + '" step="0.5" ' +
            'inputmode="decimal">' +
            '<p class="hint">Out of ' + rv.maxMarks + '. Whole or half marks.</p></div>' +
          '<div class="field"></div>' +
          '</div>' +
          '<div class="field" id="rv-feedback"><label for="rv-feedback-i">Feedback for the student</label>' +
            '<textarea id="rv-feedback-i" rows="4" placeholder="What was good, and what was missing."></textarea>' +
            '<p class="hint">Optional. The student sees this with their result, when your visibility policy ' +
            'releases it.</p></div>' +
          '<div class="formact"><button class="btn pri" type="submit" id="rv-save">Confirm review</button>' +
          '<span class="formnote">Confirming records the marks and completes this response. It cannot be ' +
          'changed afterwards in this prototype.</span></div>' +
          '</form>', null, 'h2');

    var effectCard = ui.card('What confirming does',
      '<ol class="steplist">' +
      '<li>The marks you award are added to this student’s score for the assessment.</li>' +
      (attState.total > 1
        ? '<li>This attempt has ' + attState.total + ' written answers. The result stays ' +
          '<strong>Pending Faculty review</strong> until all of them are reviewed.</li>' : '') +
      '<li>The result is then decided against the pass mark the attempt was taken under.</li>' +
      '<li>' + esc(release.mode === 'SHOW_IMMEDIATELY'
        ? 'Your visibility policy shows answers immediately, so the student sees the outcome and your feedback ' +
          'as soon as the last review is confirmed.'
        : release.sentence + ' Until then the result is evaluated but withheld — the student is told it has ' +
          'been reviewed and when it becomes available.') + '</li>' +
      '</ol>', null, 'h2');

    var html =
      ui.crumbs([{ label: 'Reviews', href: F.href.reviews(f.id) },
                 { label: student ? student.name : 'Response' }]) +
      ui.phead('Written answer', esc(student ? student.name : '') + ' · ' +
        esc(ctx ? ctx.experiment.name : rv.experimentId),
        (nextPending ? '<a class="btn sec" href="' + F.href.review(f.id, nextPending.id) +
          '">Next waiting response</a>' : ''),
        ' ' + (done ? ui.badge('b-success', 'check', 'Reviewed')
                    : ui.badge('b-warning', 'clock', 'Pending Faculty review'))) +
      '<div class="grid-rail"><div class="stack">' +
      answerCard + assistHTML + decisionCard +
      '</div><div class="stack">' +
      contextCard + effectCard +
      /* The provenance note belongs BESIDE the workflow, not inside it.
         Its long form — what ND-09 leaves unspecified about a production
         auto-review — is documentation; what a Faculty member needs here
         is short and about consequence. */
      (!done && pref.reviewMode === state.REVIEW_MODE.ASSISTED
        ? ui.protoNote('<p><strong>Review assistance.</strong> A suggestion is produced locally in this browser ' +
            'by comparing the answer with your own evaluation guidance. There is no AI provider connected and no ' +
            'network request is made.</p>' +
            '<p style="margin-top:8px">It is never a mark and never a judgement of whether the answer is ' +
            'correct. Only your confirmation creates a result.</p>')
        : '') +
      (done
        ? ui.gapNote('PROTOTYPE LIMITATION',
            '<strong>A completed review cannot be reopened here.</strong> Whether a faculty member may revise a ' +
            'finalised descriptive mark, and who may authorise it, is not established in the project sources. ' +
            'Rather than invent a re-grading workflow, this prototype makes a confirmed review read-only and ' +
            'says so.')
        : '') +
      '</div></div>';

    return {
      area: 'faculty', faculty: f, tenant: tenant, navKey: 'reviews',
      title: 'Review — ' + (student ? student.name : rv.id), html: html,
      after: function () {
        var gen = document.getElementById('rv-gen');
        if (gen) {
          gen.addEventListener('click', function () {
            gen.disabled = true;
            state.generateReviewAssistance(rv.id);
            /* Opening the panel is THIS interaction's decision, recorded
               only here. Nothing persists it, so a reload will not repeat
               it. */
            suggestionView = { reviewId: rv.id, shown: true };
            XRSLP.render(true);
            /* New content appeared in place, below the control that was
               just used. Focus stays where the Faculty member put it; the
               announcement is what tells a screen-reader user it arrived. */
            ui.announce('Suggestion generated. Faculty confirmation is required. Nothing is recorded until you ' +
              'confirm the review.');
            ui.toast('Suggestion generated. Nothing is recorded until you confirm the review.', 'info');
          });
        }
        var use = document.getElementById('rv-use');
        if (use) {
          use.addEventListener('click', function () {
            var m = document.getElementById('rv-marks-i');
            var fb = document.getElementById('rv-feedback-i');
            if (m) { m.value = rv.assistance.suggestedMarks; }
            if (fb) { fb.value = rv.assistance.suggestedFeedback; }
            suggestionApplied = { reviewId: rv.id, applied: true };
            /* Filling the form is the point of the action, so the focus
               moves to the first field the Faculty member now owns. The
               review is NOT saved, submitted or completed by this. */
            if (m) { m.focus(); }
            ui.toast('Suggestion copied into your review. Change anything you disagree with, then confirm.', 'info');
          });
        }
        var dismiss = document.getElementById('rv-dismiss');
        if (dismiss) {
          dismiss.addEventListener('click', function () {
            /* Hides the panel. The generated record stays, so a completed
               review still reports that a suggestion was generated and not
               used — dismissing is not the same as it never happening. */
            suggestionView = { reviewId: rv.id, shown: false };
            XRSLP.render(true);
            var again = document.getElementById('rv-gen');
            if (again) { again.focus(); }
            ui.toast('Suggestion dismissed. You are marking this response yourself.', 'info');
          });
        }
        var formEl = document.getElementById('rv-form');
        if (!formEl) { return; }
        formEl.addEventListener('submit', function (ev) {
          ev.preventDefault();
          var marks = document.getElementById('rv-marks-i').value;
          var feedback = document.getElementById('rv-feedback-i').value;
          ui.openDialog({
            title: 'Confirm this review?',
            bodyHTML: '<p>You are awarding <strong>' + esc(marks === '' ? '—' : marks) + ' of ' + rv.maxMarks +
              '</strong> ' + util.plural(rv.maxMarks, 'mark') + ' to ' +
              esc(student ? student.name : 'this student') + '.</p>' +
              '<div class="consequence">' + ui.ic('info') +
              '<span>This completes the response. A confirmed review is read-only in this prototype.</span></div>' +
              (attState.pending > 1
                ? '<div class="consequence">' + ui.ic('clock') +
                  '<span>' + (attState.pending - 1) + ' other written ' +
                  util.plural(attState.pending - 1, 'answer') + ' in this attempt still ' +
                  (attState.pending - 1 === 1 ? 'needs' : 'need') +
                  ' reviewing before the student’s result is complete.</span></div>'
                : ''),
            okLabel: 'Confirm review',
            onConfirm: function () {
              var res = state.finaliseReview(rv.id, marks, feedback, f.id,
                suggestionApplied.reviewId === rv.id && suggestionApplied.applied);
              if (!res.ok) {
                ui.showErrors(formEl, res.errors, 'This review cannot be confirmed yet');
                return;
              }
              XRSLP.render(true);
              ui.toast('Review confirmed. The student’s result has been updated.');
            }
          });
        });
      }
    };
  };
})();
