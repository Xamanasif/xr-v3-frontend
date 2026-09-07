/* ============================================================
   Unified Functional Platform — FACULTY workspace.

   Implementation 04 closes the loop the first three slices opened:

     Super Admin approves   →  TENANT ACCESS
     Tenant Admin assigns   →  STUDENT ENTITLEMENT   (derived)
     Tenant Admin maps      →  FACULTY CONTENT       (derived)
     ──────────────────────────────────────────────────────────
     FACULTY CONFIGURE THE ASSESSMENT THE STUDENT SITS,
     AND EVALUATE THE WRITTEN ANSWERS THE STUDENT SUBMITS

   ⚠ THE TWO RULES THIS FILE EXISTS TO OBEY

   1 · EVERYTHING a Faculty member sees comes from
       `state.facultyScope()`, which is a read model over the
       Implementation-02 FacultyAssignment records. There is no second
       Faculty mapping store, and no path by which tenant-held content
       reaches a Faculty member without a mapping.

   2 · FACULTY MAPPING ≠ STUDENT ENTITLEMENT. Student reach is
       `state.facultyStudentReach()`, which derives from EFFECTIVE
       ENTITLEMENT — never course membership, group membership or
       "students at this institution".

   Faculty cannot publish content, cannot add a technology the Tenant
   was not granted, and cannot change a licence quantity (STK31-06 /
   STK31-07 / STK31-24). Nothing in this workspace offers to.

   This file: shared faculty helpers · workspace resolution · Overview ·
   My Content · Student Progress. Assessments, the Question Bank, AI
   drafting and the descriptive review queue live in faculty-assess.js.
   ============================================================ */

window.XRSLP = window.XRSLP || {};
XRSLP.screens = XRSLP.screens || {};

/* ---------------- shared faculty-side helpers ---------------- */
XRSLP.facultyUI = (function () {
  'use strict';

  var esc = XRSLP.util.esc;
  var util = XRSLP.util;
  var ui = XRSLP.ui;
  var data = XRSLP.data;
  var state = XRSLP.state;

  function base(facultyId) { return '#/faculty/' + encodeURIComponent(facultyId); }
  var href = {
    switcher:     function () { return '#/faculty'; },
    overview:     function (f) { return base(f) + '/overview'; },
    content:      function (f) { return base(f) + '/content'; },
    assessments:  function (f) { return base(f) + '/assessments'; },
    assessment:   function (f, e) { return base(f) + '/assessment/' + encodeURIComponent(e); },
    settings:     function (f, e) { return base(f) + '/assessment/' + encodeURIComponent(e) + '/settings'; },
    builder:      function (f, e) { return base(f) + '/assessment/' + encodeURIComponent(e) + '/questions'; },
    preview:      function (f, e) { return base(f) + '/assessment/' + encodeURIComponent(e) + '/preview'; },
    bank:         function (f) { return base(f) + '/questions'; },
    newQuestion:  function (f) { return base(f) + '/questions/new'; },
    draft:        function (f) { return base(f) + '/questions/draft'; },
    question:     function (f, q) { return base(f) + '/question/' + encodeURIComponent(q); },
    reviews:      function (f) { return base(f) + '/reviews'; },
    review:       function (f, r) { return base(f) + '/review/' + encodeURIComponent(r); },
    students:     function (f) { return base(f) + '/students'; },
    studentDetail: function (f, s, e) {
      return base(f) + '/student/' + encodeURIComponent(s) + '/' + encodeURIComponent(e);
    }
  };

  /* Every faculty screen resolves its Faculty member the same way and
     fails the same way when the address is stale. The record must be a
     REAL TenantUser — the prototype never invents one. */
  function requireFaculty(params, navKey) {
    var p = state.personById(params.facultyId);
    if (p && p.role === 'faculty') {
      var tenant = state.tenantById(p.tenantId);
      if (tenant) { return { faculty: p, tenant: tenant }; }
    }
    return {
      faculty: null, tenant: null,
      fail: {
        area: 'faculty', faculty: null, tenant: null, navKey: navKey || null,
        title: 'Faculty member not found',
        html: ui.phead('Faculty member not found') +
          '<div class="tablecard">' + ui.emptyState({
            icon: 'alertCirc',
            title: 'No faculty record for this address',
            body: 'The address may be stale — this record may not exist in the current prototype data.',
            actionsHTML: '<a class="btn pri" href="' + href.switcher() + '">Choose a faculty member</a>'
          }) + '</div>'
      }
    };
  }

  /* Resolve a Faculty member AND check the experiment in the address is
     inside their mapping. This is THE content boundary: a Faculty
     member who hand-edits the address to an Experiment they are not
     mapped to gets a refusal, not a screen. */
  function requireMapped(params, navKey) {
    var r = requireFaculty(params, navKey);
    if (!r.faculty) { return r; }
    var ctx = data.contextOf(params.experimentId);
    var row = ctx ? state.facultyScopeRow(r.faculty.id, params.experimentId) : null;
    if (ctx && row) { return { faculty: r.faculty, tenant: r.tenant, ctx: ctx, row: row }; }
    return {
      faculty: r.faculty, tenant: r.tenant, ctx: null, row: null,
      fail: {
        area: 'faculty', faculty: r.faculty, tenant: r.tenant, navKey: navKey || 'content',
        title: 'Not mapped to you',
        html: ui.phead(ctx ? ctx.experiment.name : 'Experiment not available') +
          '<div class="stack">' +
          ui.alertBox('warning', 'This experiment is not mapped to you',
            '<p>' + (ctx
              ? 'Your institution has not mapped ' + esc(ctx.experiment.name) + ' to you, or the access record ' +
                'behind that mapping is no longer active.'
              : 'The experiment in this address is not part of the sample catalogue.') +
            '</p><p style="margin-top:8px">A Faculty member manages the experiments mapped to them, not every ' +
            'experiment the institution holds.</p>') +
          '<div class="formact"><a class="btn pri" href="' + href.content(r.faculty.id) +
          '">See the content mapped to you</a></div></div>'
      }
    };
  }

  function courseLine(experimentId) {
    var ctx = data.contextOf(experimentId);
    if (!ctx) { return esc(experimentId); }
    return esc(ctx.grouping.name) + ' › ' + esc(ctx.course.name);
  }

  function expLink(facultyId, experimentId) {
    var ctx = data.contextOf(experimentId);
    return '<a class="rowlink" href="' + href.assessment(facultyId, experimentId) + '">' +
      '<span class="tmain">' + esc(ctx ? ctx.experiment.name : experimentId) + '</span>' +
      '<span class="tsub">' + (ctx ? esc(ctx.course.name) : '') + '</span></a>';
  }

  function statGrid(items) {
    return '<div class="statgrid">' + items.map(function (it) {
      return '<div class="stat' + (it.tone ? ' ' + it.tone : '') + '">' +
        '<div class="s-k">' + esc(it.label) + '</div>' +
        '<div class="s-v tabular">' + esc(String(it.value)) + '</div>' +
        (it.note ? '<div class="s-n">' + esc(it.note) + '</div>' : '') +
        '</div>';
    }).join('') + '</div>';
  }

  /* ⚠ THE COMPLETION CAVEAT, WRITTEN ONCE AND REUSED.
     "Completed" here is the PROTOTYPE-DERIVED COMPLETION RULE this
     prototype has used since Implementation 03 — resources done,
     every entitled technology's simulation done, assessment passed
     where one is configured, and never complete while a result is
     pending. It is NOT a stakeholder-confirmed academic completion
     policy, and no Faculty surface may present it as one. */
  function completionNote() {
    return ui.gapNote('PROTOTYPE-DERIVED',
      '<strong>“Completed” is a prototype rule, not an academic policy.</strong> It means: every learning ' +
      'resource marked done, the simulation completed for every technology the student is entitled to, and the ' +
      'assessment passed where one is configured. A result pending faculty review is never counted as complete. ' +
      'No source establishes an institutional completion policy, so none is asserted here.');
  }

  /* The one place a Faculty member is told what they cannot do, and
     why — so an absent control is never mistaken for a missing feature. */
  function authorityNote() {
    return ui.alertBox('info', 'What a Faculty member controls here',
      '<p>You configure the assessment for an experiment mapped to you, keep its question bank, and evaluate ' +
      'written answers from your students.</p>' +
      '<p style="margin-top:8px">You do not publish or release content, do not add a technology your institution ' +
      'was not granted, and do not change licence quantities or student assignments. Those sit with the Content ' +
      'Manager, the Super Admin and your Tenant Admin.</p>');
  }

  /* STK31-29 / U-FAC-01 — "Experiments available to their Tenant".
     STRICTLY INFORMATIONAL, and the card says so in its own words: it
     is what the INSTITUTION holds, not what this Faculty member
     manages. No control here changes a mapping, an assessment or a
     student — only the Tenant Admin can map content — so making the
     institution's holdings legible widens no authority at all. It
     simply stops a Faculty member having to guess whether their
     institution licensed the variant they were asked about. */
  function tenantHoldingsCard(f, tenant) {
    var holdings = state.facultyTenantHoldings(f.id);
    var unmapped = holdings.filter(function (h) { return !h.mapped; });
    if (!holdings.length) {
      return ui.card('Experiments available to ' + esc(tenant.name),
        ui.emptyState({
          icon: 'layers', heading: 'h3',
          title: 'Your institution holds no usable content right now',
          body: 'Content reaches an institution only through an approved institutional access request, and an ' +
            'expired or empty record carries none. This is what the institution holds — not what is mapped to you.'
        }), null, 'h2');
    }
    return ui.card('Experiments available to ' + esc(tenant.name),
      '<p class="muted" style="margin:0 0 10px">Everything your institution currently holds. ' +
      '<strong>This is not your mapping.</strong> You can configure an assessment, see students and evaluate ' +
      'answers only for the rows marked <em>Mapped to you</em> — your Tenant Admin decides the rest.</p>' +
      '<div class="tscroll"><table class="dt">' +
      '<caption class="sr-only">Experiments available to ' + esc(tenant.name) +
      ', and whether each one is mapped to you</caption>' +
      '<thead><tr><th scope="col">Course</th><th scope="col">Experiment</th>' +
      '<th scope="col">Technologies held</th><th scope="col">Your access</th></tr></thead><tbody>' +
      holdings.map(function (h) {
        var ctx = data.contextOf(h.experimentId);
        return '<tr>' +
          '<td data-label="Course">' + esc(ctx ? ctx.course.name : h.courseId) + '</td>' +
          '<td data-label="Experiment"><span class="tmain">' +
          esc(ctx ? ctx.experiment.name : h.experimentId) + '</span></td>' +
          '<td data-label="Technologies held">' + ui.techBadges(h.technologies) + '</td>' +
          '<td data-label="Your access">' + (h.mapped
            ? ui.badge('b-success', 'check', 'Mapped to you')
            : ui.badge('b-neutral', 'minus', 'Not mapped to you')) + '</td>' +
          '</tr>';
      }).join('') + '</tbody></table></div>' +
      '<p class="cardfoot">' + holdings.length + ' ' + util.plural(holdings.length, 'experiment') +
      ' held by the institution, ' + (holdings.length - unmapped.length) + ' mapped to you. ' +
      'Ask your Tenant Admin to map anything you need to deliver; nothing on this card can be changed here.</p>',
      null, 'h2');
  }

  function assessmentBadge(def) {
    if (!def) { return ui.badge('b-neutral', 'minus', 'No assessment'); }
    if (!def.questions.length) { return ui.badge('b-warning', 'alert', 'No questions'); }
    return ui.badge('b-success', 'check', def.questions.length + ' ' +
      util.plural(def.questions.length, 'question'));
  }

  function typeLabel(type) { return state.QUESTION_TYPES[type] || type; }

  function typeBadge(type) {
    var cls = type === 'descriptive' ? 'b-warning' : type === 'tf' ? 'b-info' : 'b-outline';
    var icon = type === 'descriptive' ? 'edit' : type === 'tf' ? 'check' : 'doc';
    return ui.badge(cls, icon, typeLabel(type));
  }

  /* Technologies the TENANT holds for one experiment, across the access
     records this mapping runs through. Faculty read this; they never
     widen it (STK31-24). */
  function mappedTechnologies(row) {
    var set = {};
    row.accessIds.forEach(function (aid) {
      state.accessTechnologies(state.accessById(aid), row.experimentId).forEach(function (t) { set[t] = true; });
    });
    return data.sortTech(Object.keys(set));
  }

  /* A compact per-technology simulation summary. TECHNOLOGY FIGURES
     STAY TECHNOLOGY-SPECIFIC: only SimulationActivity feeds them, so an
     experiment-level assessment submission can never make a technology
     look started (brief §35). */
  function techMetrics(stats) {
    var keys = data.sortTech(Object.keys(stats.technologies));
    if (!keys.length) {
      return '<p class="cardlede">No student is currently entitled to a technology for this experiment, so ' +
        'there is nothing to report.</p>';
    }
    return '<ul class="techmetrics">' + keys.map(function (t) {
      var m = stats.technologies[t];
      return '<li>' + ui.fmtBadge(t) +
        '<span class="tm-n"><span class="tm-v tabular">' + m.entitled + '</span> entitled</span>' +
        '<span class="tm-n"><span class="tm-v tabular">' + m.started + '</span> started</span>' +
        '<span class="tm-n"><span class="tm-v tabular">' + m.completed + '</span> completed</span>' +
        '</li>';
    }).join('') + '</ul>';
  }

  /* ---------- TECHNOLOGY ACTUALLY USED (07.3, stakeholder R6) ----------
     The stakeholder asked how a Faculty member grading an assessment
     knows whether the student performed the experiment in Web, VR or AR.

     ⚠ `mappedTechnologies()` above CANNOT answer that — it reports what
     the institution licensed, which is availability. This reads
     `state.technologyUseSummary()`, which reports what the student
     actually ran, and it renders a SET: a student who ran Web and VR is
     never described as having used only one of them.

     `sourceTechnology` is shown too, but only for what it truly is —
     which simulation the student stepped into the assessment from — and
     never as the answer to "what did they use". */
  function techUsedHTML(personId, experimentId, att) {
    var sum = state.technologyUseSummary(personId, experimentId);
    var out = '';
    if (sum.none) {
      out += '<div class="k">Technologies used</div><div class="v">' +
        '<span class="muted">No simulation run is recorded for this student on this experiment.</span>' +
        (sum.requestedOnly.length
          ? '<span class="tsub2">Access was requested for ' + ui.techBadges(sum.requestedOnly) +
            ', but no run was started.</span>' : '') +
        '</div>';
    } else {
      out += '<div class="k">Technologies used</div><div class="v">' +
        sum.rows.filter(function (r) { return r.used; }).map(function (r) {
          return '<span class="techused">' + ui.fmtBadge(r.technology) +
            '<span class="tsub">' + (r.completed ? 'completed' : 'in progress') + '</span></span>';
        }).join(' ') +
        (sum.multiple
          ? '<span class="tsub2">This student used <strong>more than one</strong> technology for this ' +
            'experiment. The assessment is experiment-level, so it covers all of them.</span>'
          : '') +
        (sum.requestedOnly.length
          ? '<span class="tsub2">Also requested but never run: ' + ui.techBadges(sum.requestedOnly) + '.</span>'
          : '') +
        '</div>';
    }
    if (att && att.sourceTechnology && data.TECHNOLOGIES[att.sourceTechnology]) {
      out += '<div class="k">Entered the assessment from</div><div class="v">' +
        ui.fmtBadge(att.sourceTechnology) + ' simulation' +
        '<span class="tsub2">Which simulation this attempt was started from — not the full list above.</span>' +
        '</div>';
    }
    return out;
  }

  return {
    href: href, requireFaculty: requireFaculty, requireMapped: requireMapped,
    techUsedHTML: techUsedHTML,
    courseLine: courseLine, expLink: expLink, statGrid: statGrid,
    completionNote: completionNote, authorityNote: authorityNote,
    tenantHoldingsCard: tenantHoldingsCard,
    assessmentBadge: assessmentBadge, typeLabel: typeLabel, typeBadge: typeBadge,
    mappedTechnologies: mappedTechnologies, techMetrics: techMetrics
  };
})();


(function () {
  'use strict';

  var esc = XRSLP.util.esc;
  var util = XRSLP.util;
  var ui = XRSLP.ui;
  var data = XRSLP.data;
  var state = XRSLP.state;
  var F = XRSLP.facultyUI;
  var L = XRSLP.studentUI;

  /* ============================================================
     #/faculty — PROTOTYPE-ONLY faculty resolution.

     Real authentication is a later build item (U-AUTH-01 / U-AUTH-06).
     This screen resolves the prototype pointer to a REAL Faculty
     record, or offers a chooser over the Faculty records that actually
     exist. It is not a login and it grants nothing.
     ============================================================ */
  XRSLP.screens.facultyHome = function () {
    var chosen = state.protoFaculty();
    if (chosen) { return { redirect: F.href.overview(chosen.id) }; }

    var rows = [];
    state.tenants().forEach(function (t) {
      state.facultyForTenant(t.id).forEach(function (p) { rows.push({ tenant: t, person: p }); });
    });

    var body = rows.length
      ? '<ul class="picklistr">' + rows.map(function (r) {
          var scope = state.facultyScope(r.person.id);
          var pending = state.reviewsForFaculty(r.person.id, { status: 'pending' }).length;
          return '<li class="pickrow">' +
            '<div class="pk-body">' +
            '<div class="pk-n">' + esc(r.person.name) +
              (pending ? ' ' + ui.badge('b-warning', 'clock', pending + ' to review') : '') + '</div>' +
            '<div class="pk-m">' + esc(r.tenant.name) +
              (r.person.facultyId ? ' · ' + esc(r.person.facultyId) : '') + '</div>' +
            '<div class="pk-e">' +
            esc(scope.experiments.length
              ? scope.experiments.length + ' mapped ' + util.plural(scope.experiments.length, 'experiment')
              : 'No content mapped to this faculty member') + '</div>' +
            '</div>' +
            '<a class="btn sec" href="' + F.href.overview(r.person.id) + '">Open workspace' +
            '<span class="sr-only"> as ' + esc(r.person.name) + '</span></a>' +
            '</li>';
        }).join('') + '</ul>'
      : ui.emptyState({
          icon: 'users', heading: 'h2',
          title: 'No faculty records exist yet',
          body: 'Faculty are created by an institution’s Tenant Admin. Add one, then map content to them.',
          actionsHTML: '<a class="btn pri" href="#/tenant">Open the Tenant Admin workspace</a>'
        });

    return {
      area: 'faculty', faculty: null, tenant: null, navKey: null,
      title: 'Faculty workspace',
      html: ui.phead('Faculty workspace',
        'Choose which real faculty record to view the prototype as.') +
        '<div class="stack">' +
        ui.protoNote('<p>Sign-in is not implemented in this prototype. This chooser lists the ' +
          '<strong>real faculty records</strong> that exist in the current prototype data — the ones a Tenant ' +
          'Admin created. Choosing one changes what is displayed and nothing else: a faculty member still sees ' +
          'only the content mapped to them.</p>') +
        '<div class="tablecard">' + body + '</div>' +
        '</div>'
    };
  };

  /* ============================================================
     FACULTY OVERVIEW — operational, and every figure derived.

     No KPI, index, score, rank, prediction or attendance appears here
     (PM-11 · STK31-29). Each card states what it counts.
     ============================================================ */
  XRSLP.screens.facultyOverview = function (params) {
    var r = F.requireFaculty(params, 'overview');
    if (!r.faculty) { return r.fail; }
    var f = r.faculty, tenant = r.tenant;
    var ov = state.facultyOverview(f.id);
    var scope = ov.scope;

    if (!scope.experiments.length) {
      return {
        area: 'faculty', faculty: f, tenant: tenant, navKey: 'overview',
        title: 'Overview — ' + f.name,
        html: ui.phead('Welcome, ' + f.name, esc(tenant.name)) +
          '<div class="stack">' +
          '<div class="tablecard">' + ui.emptyState({
            icon: 'layers', heading: 'h2',
            title: scope.blocked.length ? 'Your mapped content is not active' : 'No content is mapped to you yet',
            body: scope.blocked.length
              ? 'Content was mapped to you, but the institution’s access behind ' +
                (scope.blocked.length === 1 ? 'that mapping' : 'those mappings') + ' is not currently usable.'
              : 'A faculty member manages the courses and experiments their institution maps to them. Nothing ' +
                'has been mapped to you yet, so there is nothing to configure or review.'
          }) + '</div>' +
          (scope.blocked.length
            ? ui.card('Why your mapped content is unavailable',
                '<ul class="reasonlist">' + scope.blocked.map(function (b) {
                  var c = data.course(b.mapping.courseId);
                  return '<li><strong>' + esc(c ? c.name : b.mapping.courseId) + '</strong> — ' +
                    esc(state.assignabilityText(b.reason)) + '.</li>';
                }).join('') + '</ul>', null, 'h2')
            : '') +
          ui.protoNote('<p>In the product your institution’s Tenant Admin maps faculty to courses and ' +
            'experiments. In this prototype you can do that yourself from the Tenant Admin workspace.</p>',
            '<a class="btn sec sm" href="' + XRSLP.tenantUI.href.facultyMap(tenant.id) +
            '">Open Faculty mapping (Tenant Admin)</a>') +
          '</div>'
      };
    }

    var stats = F.statGrid([
      { label: 'Mapped courses', value: ov.courses, note: 'inside your institution’s active access' },
      { label: 'Mapped experiments', value: ov.experiments, note: 'what you can configure and review' },
      { label: 'Students reached', value: ov.students,
        note: 'entitled to at least one of your experiments' },
      { label: 'Responses to review', value: ov.pendingReviews,
        tone: ov.pendingReviews ? 'warn' : '',
        note: 'written answers waiting for you' }
    ]);

    /* Attention rows: every one is a real current state with a real
       destination. Nothing is listed that cannot be acted on. */
    var attention = [];
    if (ov.pendingReviews) {
      attention.push({
        icon: 'edit', tone: 'warn',
        text: ov.pendingReviews + ' written ' + util.plural(ov.pendingReviews, 'response') +
          ' ' + (ov.pendingReviews === 1 ? 'is' : 'are') + ' waiting for your review.',
        href: F.href.reviews(f.id), action: 'Open reviews'
      });
    }
    ov.experimentsWithoutAssessment.forEach(function (eid) {
      var ctx = data.contextOf(eid);
      attention.push({
        icon: 'doc', tone: '',
        text: esc(ctx ? ctx.experiment.name : eid) + ' has no assessment configured.',
        href: F.href.assessment(f.id, eid), action: 'Configure', raw: true
      });
    });
    ov.assessmentsWithoutQuestions.forEach(function (def) {
      var ctx = data.contextOf(def.experimentId);
      attention.push({
        icon: 'alert', tone: 'warn',
        text: esc(ctx ? ctx.experiment.name : def.experimentId) +
          ' has an assessment with no questions, so no student can take it.',
        href: F.href.builder(f.id, def.experimentId), action: 'Add questions', raw: true
      });
    });
    if (ov.notStarted) {
      attention.push({
        icon: 'minus', tone: '',
        text: ov.notStarted + ' student ' + util.plural(ov.notStarted, 'entitlement') +
          ' across your experiments ' + (ov.notStarted === 1 ? 'has' : 'have') + ' no recorded activity yet.',
        href: F.href.students(f.id), action: 'See student progress'
      });
    }
    if (ov.submitted) {
      attention.push({
        icon: 'check', tone: 'ok',
        text: ov.submitted + ' assessment ' + util.plural(ov.submitted, 'submission') +
          ' recorded across your experiments.',
        href: F.href.students(f.id), action: 'See results'
      });
    }
    scope.blocked.forEach(function (b) {
      var c = data.course(b.mapping.courseId);
      attention.push({
        icon: 'alertCirc', tone: 'warn',
        text: 'A mapping to ' + esc(c ? c.name : b.mapping.courseId) + ' is not usable — ' +
          esc(state.assignabilityText(b.reason)) + '.',
        href: null, action: null, raw: true
      });
    });

    var attentionHTML = attention.length
      ? '<ul class="attn">' + attention.map(function (a) {
          return '<li class="at-row ' + esc(a.tone === 'warn' ? 'warn' : '') + '">' +
            '<span class="at-ic">' + ui.ic(a.icon) + '</span>' +
            '<span class="at-body"><span class="at-t">' + (a.raw ? a.text : esc(a.text)) + '</span></span>' +
            (a.href ? '<a class="btn sm sec" href="' + a.href + '">' + esc(a.action) + '</a>' : '') +
            '</li>';
        }).join('') + '</ul>'
      : '<p class="cardlede">Nothing needs your attention right now.</p>';

    /* A per-experiment roll-up: the same numbers the Student Progress
       screen shows, summarised. */
    var expRows = ov.stats.map(function (st) {
      var ctx = data.contextOf(st.experimentId);
      return '<tr>' +
        '<td data-label="Experiment">' + F.expLink(f.id, st.experimentId) + '</td>' +
        '<td data-label="Students" class="num tabular">' + st.reach + '</td>' +
        '<td data-label="Not started" class="num tabular">' + st.notStarted + '</td>' +
        '<td data-label="In progress" class="num tabular">' + st.inProgress + '</td>' +
        '<td data-label="Awaiting review" class="num tabular">' + st.awaitingReview + '</td>' +
        '<td data-label="Completed" class="num tabular">' + st.completed + '</td>' +
        '<td data-label="Assessment">' + F.assessmentBadge(st.assessment) + '</td>' +
        '</tr>';
    }).join('');

    var html =
      ui.phead('Welcome, ' + f.name, esc(tenant.name) +
        (f.facultyId ? ' · ' + esc(f.facultyId) : '')) +
      '<div class="stack">' +
      stats +
      ui.card('Needs your attention', attentionHTML,
        attention.length ? attention.length + ' ' + util.plural(attention.length, 'item') : null, 'h2') +
      ui.card('Your experiments',
        '<div class="tscroll"><table class="dt">' +
        '<caption class="sr-only">Progress across the experiments mapped to you. Counts are students holding an ' +
        'effective entitlement to each experiment.</caption>' +
        '<thead><tr><th scope="col">Experiment</th><th scope="col" class="num">Students</th>' +
        '<th scope="col" class="num">Not started</th><th scope="col" class="num">In progress</th>' +
        '<th scope="col" class="num">Awaiting review</th><th scope="col" class="num">Completed</th>' +
        '<th scope="col">Assessment</th></tr></thead><tbody>' + expRows + '</tbody></table></div>',
        null, 'h2') +
      F.completionNote() +
      F.authorityNote() +
      '</div>';

    return {
      area: 'faculty', faculty: f, tenant: tenant, navKey: 'overview',
      title: 'Overview — ' + f.name, html: html
    };
  };

  /* ============================================================
     MY CONTENT — the mapping boundary, made visible.
     ============================================================ */
  XRSLP.screens.facultyContent = function (params) {
    var r = F.requireFaculty(params, 'content');
    if (!r.faculty) { return r.fail; }
    var f = r.faculty, tenant = r.tenant;
    var scope = state.facultyScope(f.id);

    if (!scope.experiments.length) {
      return {
        area: 'faculty', faculty: f, tenant: tenant, navKey: 'content',
        title: 'My Content — ' + f.name,
        html: ui.phead('My Content', 'Courses and experiments mapped to you inside ' + esc(tenant.name) + '.') +
          '<div class="stack"><div class="tablecard">' + ui.emptyState(
            /* Implementation 06 — a mapping that exists but is SUSPENDED is
               not the same thing as a mapping that was never made, and
               saying "nothing is mapped to you yet" while the institution
               is deactivated would be plainly untrue. */
            scope.blocked.length
              ? { icon: 'alertCirc', heading: 'h2',
                  title: 'Your mapped content is not available at the moment',
                  body: 'You have ' + scope.blocked.length + ' ' +
                    XRSLP.util.plural(scope.blocked.length, 'mapping') + ' in this institution. ' +
                    (scope.blocked.some(function (b) { return b.reason === 'tenant-inactive'; })
                      ? 'The institution has been deactivated by the platform, so mapped content cannot be ' +
                        'used right now. Nothing has been deleted — everything returns when it is reactivated.'
                      : 'The access records behind them cannot currently carry content: ' +
                        scope.blocked.map(function (b) { return state.assignabilityText(b.reason); })
                          .filter(function (t, i, a) { return a.indexOf(t) === i; }).join('; ') + '.') }
              : { icon: 'layers', heading: 'h2',
                  title: 'No content is mapped to you yet',
                  body: 'Your institution decides which courses and experiments each faculty member delivers. ' +
                    'Until something is mapped to you, there is nothing here — this is not an error.' }
          ) + '</div>' +
          XRSLP.facultyUI.tenantHoldingsCard(f, tenant) +
          (scope.blocked.length ? '' :
            ui.protoNote('<p>In this prototype you can create the mapping yourself from the Tenant Admin ' +
              'workspace.</p>',
              '<a class="btn sec sm" href="' + XRSLP.tenantUI.href.facultyMap(tenant.id) +
              '">Open Faculty mapping (Tenant Admin)</a>')) +
          '</div>'
      };
    }

    var rows = scope.experiments.map(function (row) {
      var ctx = data.contextOf(row.experimentId);
      var techs = F.mappedTechnologies(row);
      var reach = state.facultyStudentReach(f.id, row.experimentId);
      var def = state.assessmentForTenant(tenant.id, row.experimentId);
      var stats = state.facultyExperimentStats(f.id, row.experimentId);
      var mapping = row.viaCourse ? 'Course mapping' : 'Experiment mapping';
      return '<tr>' +
        '<td data-label="Course">' + esc(ctx ? ctx.course.name : row.courseId) +
          '<span class="tsub2">' + esc(mapping) + '</span></td>' +
        '<td data-label="Experiment">' + F.expLink(f.id, row.experimentId) + '</td>' +
        '<td data-label="Technologies">' + (techs.length ? ui.techBadges(techs) :
          '<span class="muted">None held</span>') + '</td>' +
        '<td data-label="Students" class="num tabular">' + reach.length + '</td>' +
        '<td data-label="Assessment">' + F.assessmentBadge(def) + '</td>' +
        '<td data-label="Progress">' + (reach.length
          ? '<span class="minisum">' + stats.completed + ' completed · ' + stats.inProgress + ' in progress · ' +
            stats.notStarted + ' not started</span>'
          : '<span class="muted">No students entitled</span>') + '</td>' +
        '<td class="cell-actions"><a class="btn sm sec" href="' + F.href.assessment(f.id, row.experimentId) +
          '">Open</a></td>' +
        '</tr>';
    }).join('');

    var html =
      ui.phead('My Content', 'Courses and experiments mapped to you inside ' + esc(tenant.name) + '.') +
      '<div class="stack">' +
      ui.alertBox('info', 'Student counts reflect entitlement, not enrolment',
        '<p>The student count for an experiment is the number of students who currently hold an <strong>effective ' +
        'entitlement</strong> to it. A student on the course who has not been assigned the experiment, or who ' +
        'falls outside the approved licence quantity, is not counted — because they cannot open it.</p>') +
      ui.card('Mapped to you',
        '<div class="tscroll"><table class="dt">' +
        '<caption class="sr-only">Experiments mapped to you, the technologies available for each, ' +
        'and how many students are entitled.</caption>' +
        '<thead><tr><th scope="col">Course</th><th scope="col">Experiment</th>' +
        '<th scope="col">Available technologies</th><th scope="col" class="num">Students</th>' +
        '<th scope="col">Assessment</th><th scope="col">Progress</th>' +
        '<th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' +
        rows + '</tbody></table></div>',
        scope.experiments.length + ' ' + util.plural(scope.experiments.length, 'experiment'), 'h2') +
      (scope.blocked.length
        ? ui.card('Mappings that are not currently usable',
            '<ul class="reasonlist">' + scope.blocked.map(function (b) {
              var c = data.course(b.mapping.courseId);
              return '<li><strong>' + esc(c ? c.name : b.mapping.courseId) + '</strong> — ' +
                esc(state.assignabilityText(b.reason)) + '.</li>';
            }).join('') + '</ul>' +
            '<p class="cardfoot">Nothing has been removed. These mappings become usable again if your ' +
            'institution’s access does.</p>',
            null, 'h2')
        : '') +
      F.tenantHoldingsCard(f, tenant) +
      F.authorityNote() +
      '</div>';

    return {
      area: 'faculty', faculty: f, tenant: tenant, navKey: 'content',
      title: 'My Content — ' + f.name, html: html
    };
  };

  /* ============================================================
     STUDENT PROGRESS + OPERATIONAL ANALYTICS.

     One screen, because the analytics ARE the progress: every figure is
     a count over the rows below it, and each column says what it counts.
     ============================================================ */

  /* Filter state lives in the module, like the other builder screens, so
     a re-render keeps the filters the Faculty member set.

     ⚠ It is SCOPED to that faculty member. Left unscoped, a search term
     typed by one faculty member silently narrowed the next one's list —
     the count said "1 of 3" and the missing two looked like missing
     students rather than a filter nobody had set. */
  var progFilter = { owner: null, experimentId: '', status: '', q: '' };
  function progFilterFor(facultyId) {
    if (progFilter.owner !== facultyId) {
      progFilter = { owner: facultyId, experimentId: '', status: '', q: '' };
    }
    return progFilter;
  }

  XRSLP.screens.facultyStudents = function (params) {
    var r = F.requireFaculty(params, 'students');
    if (!r.faculty) { return r.fail; }
    var f = r.faculty, tenant = r.tenant;
    var scope = state.facultyScope(f.id);
    progFilterFor(f.id);

    if (!scope.experiments.length) {
      return {
        area: 'faculty', faculty: f, tenant: tenant, navKey: 'students',
        title: 'Student Progress — ' + f.name,
        html: ui.phead('Student Progress') +
          '<div class="tablecard">' + ui.emptyState({
            icon: 'users', heading: 'h2',
            title: 'No content is mapped to you yet',
            body: 'Student progress is reported for the experiments mapped to you. Nothing is mapped yet.',
            actionsHTML: '<a class="btn pri" href="' + F.href.content(f.id) + '">See My Content</a>'
          }) + '</div>'
      };
    }

    var mappedIds = scope.experiments.map(function (x) { return x.experimentId; });
    if (progFilter.experimentId && mappedIds.indexOf(progFilter.experimentId) === -1) {
      progFilter.experimentId = '';
    }

    /* Build one row per (student × experiment) — the unit a Faculty
       member actually works in. */
    var allRows = [];
    scope.experiments.forEach(function (row) {
      var st = state.facultyExperimentStats(f.id, row.experimentId);
      st.rows.forEach(function (sr) {
        var person = state.personById(sr.personId);
        if (!person) { return; }
        var pendingHere = state.reviewsForFaculty(f.id, {
          experimentId: row.experimentId, status: 'pending'
        }).filter(function (rv) { return rv.personId === sr.personId; }).length;
        allRows.push({
          person: person, experimentId: row.experimentId,
          technologies: sr.technologies, progress: sr.progress,
          attempt: state.latestSubmittedAttempt(sr.personId, row.experimentId),
          assessState: state.assessmentState(sr.personId, row.experimentId),
          pendingReviews: pendingHere
        });
      });
    });

    var q = XRSLP.data.norm(progFilter.q);
    var rows = allRows.filter(function (x) {
      if (progFilter.experimentId && x.experimentId !== progFilter.experimentId) { return false; }
      if (progFilter.status && x.progress.status !== progFilter.status) { return false; }
      if (q) {
        var hay = XRSLP.data.norm(x.person.name + ' ' + (x.person.studentId || '') + ' ' + (x.person.email || ''));
        if (hay.indexOf(q) === -1) { return false; }
      }
      return true;
    });

    /* Aggregates are computed over the FILTERED set, so the numbers and
       the table below them always agree. */
    var agg = { total: rows.length, notStarted: 0, inProgress: 0, awaiting: 0, completed: 0, submitted: 0, passed: 0, notPassed: 0 };
    rows.forEach(function (x) {
      if (x.progress.status === state.TECH_PROGRESS.COMPLETED) { agg.completed += 1; }
      else if (x.progress.status === state.TECH_PROGRESS.PENDING_REVIEW) { agg.awaiting += 1; }
      else if (x.progress.status === state.TECH_PROGRESS.IN_PROGRESS) { agg.inProgress += 1; }
      else { agg.notStarted += 1; }
      if (x.attempt) {
        agg.submitted += 1;
        if (x.attempt.outcome === state.OUTCOME.PASSED) { agg.passed += 1; }
        else if (x.attempt.outcome === state.OUTCOME.NOT_PASSED) { agg.notPassed += 1; }
      }
    });

    var statsHTML = F.statGrid([
      { label: 'Student entitlements', value: agg.total, note: 'student × experiment rows shown below' },
      { label: 'Not started', value: agg.notStarted, note: 'no recorded activity' },
      { label: 'In progress', value: agg.inProgress, note: 'some activity, not complete' },
      { label: 'Awaiting review', value: agg.awaiting, tone: agg.awaiting ? 'warn' : '',
        note: 'a written answer is with you' },
      { label: 'Completed', value: agg.completed, note: 'prototype-derived rule' },
      { label: 'Assessments submitted', value: agg.submitted,
        note: agg.submitted ? agg.passed + ' passed · ' + agg.notPassed + ' not passed · ' +
          (agg.submitted - agg.passed - agg.notPassed) + ' pending' : 'none yet' }
    ]);

    var filterBar =
      '<div class="listbar">' +
      '<label for="pf-q">Search student' +
      '<input type="text" id="pf-q" value="' + esc(progFilter.q) + '" placeholder="Name, ID or email">' +
      '</label>' +
      '<label for="pf-e">Experiment<select id="pf-e">' +
      '<option value="">All mapped experiments</option>' +
      scope.experiments.map(function (row) {
        var ctx = data.contextOf(row.experimentId);
        return '<option value="' + esc(row.experimentId) + '"' +
          (progFilter.experimentId === row.experimentId ? ' selected' : '') + '>' +
          esc(ctx ? ctx.experiment.name : row.experimentId) + '</option>';
      }).join('') + '</select></label>' +
      '<label for="pf-s">Progress<select id="pf-s">' +
      '<option value="">Any state</option>' +
      ['NOT_STARTED', 'IN_PROGRESS', 'PENDING_FACULTY_REVIEW', 'COMPLETED'].map(function (k) {
        return '<option value="' + esc(k) + '"' + (progFilter.status === k ? ' selected' : '') + '>' +
          esc(L.progressLabel(k)) + '</option>';
      }).join('') + '</select></label>' +
      '<span class="lcount">' + rows.length + ' of ' + allRows.length + ' shown</span>' +
      /* 07.3 — the stakeholder's "they cannot count each student".
         Exports the FILTERED rows, so the file matches the screen. */
      '<button class="btn sm sec" type="button" id="pf-export"' +
        (rows.length ? '' : ' disabled aria-disabled="true"') + '>' +
        ui.ic('download') + 'Export CSV</button>' +
      '</div>';

    var tableHTML = rows.length
      ? '<div class="tscroll"><table class="dt">' +
        '<caption class="sr-only">One row per student and experiment. Simulation status is reported separately ' +
        'for each technology; the assessment is one per experiment.</caption>' +
        '<thead><tr><th scope="col">Student</th><th scope="col">Experiment</th>' +
        '<th scope="col">Resources</th><th scope="col">Simulations</th>' +
        '<th scope="col">Assessment</th><th scope="col">Progress</th>' +
        '<th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' +
        rows.map(function (x) {
          var res = x.progress.resources;
          return '<tr>' +
            '<td data-label="Student"><span class="tmain">' + esc(x.person.name) + '</span>' +
              '<span class="tsub">' + esc(x.person.studentId || '') + '</span></td>' +
            '<td data-label="Experiment">' + esc((data.contextOf(x.experimentId) || {}).experiment ?
              data.contextOf(x.experimentId).experiment.name : x.experimentId) + '</td>' +
            '<td data-label="Resources" class="tabular">' + res.completed + ' of ' + res.total + '</td>' +
            '<td data-label="Simulations">' + (x.progress.technologies.length
              ? '<ul class="techstates compact">' + x.progress.technologies.map(function (tp) {
                  return '<li><span class="ts-b">' + ui.fmtBadge(tp.technology) + '</span>' +
                    '<span class="ts-s">' + esc(L.simLabel(tp.simulationStatus)) + '</span></li>';
                }).join('') + '</ul>'
              : '<span class="muted">—</span>') + '</td>' +
            '<td data-label="Assessment">' + L.assessBadge(x.assessState) +
              (x.attempt && x.attempt.score && x.attempt.score.percent !== null
                ? '<span class="tsub2 tabular">' + x.attempt.score.percent + '%' +
                  (x.attempt.score.includesReview ? ' (with review)' : ' (marked questions)') + '</span>'
                : '') +
              (x.pendingReviews ? '<span class="tsub2">' + x.pendingReviews + ' ' +
                util.plural(x.pendingReviews, 'response') + ' to review</span>' : '') + '</td>' +
            '<td data-label="Progress">' + L.progressBadge(x.progress.status) + '</td>' +
            '<td class="cell-actions"><a class="btn sm sec" href="' +
              F.href.studentDetail(f.id, x.person.id, x.experimentId) + '">Open</a></td>' +
            '</tr>';
        }).join('') + '</tbody></table></div>'
      : ui.emptyState({
          icon: 'search', heading: 'h2',
          title: allRows.length ? 'No student matches these filters' : 'No student is entitled to your experiments yet',
          body: allRows.length
            ? 'Change the search or the filters to see other students.'
            : 'Students appear here once your institution assigns one of your experiments to them and they hold ' +
              'an effective entitlement.',
          actionsHTML: allRows.length
            ? '<button class="btn sec" type="button" id="pf-clear">Clear filters</button>' : ''
        });

    /* Per-technology metrics for whichever experiments are in view.
       TECHNOLOGY FIGURES ARE SIMULATION FIGURES ONLY. */
    var techScope = progFilter.experimentId
      ? [progFilter.experimentId]
      : scope.experiments.map(function (x) { return x.experimentId; });
    var techCards = techScope.map(function (eid) {
      var st = state.facultyExperimentStats(f.id, eid);
      var ctx = data.contextOf(eid);
      return ui.card(ctx ? ctx.experiment.name : eid, F.techMetrics(st),
        st.reach + ' ' + util.plural(st.reach, 'student') + ' entitled', 'h3');
    }).join('');

    var html =
      ui.phead('Student Progress',
        'Students entitled to the experiments mapped to you, inside ' + esc(tenant.name) + '.') +
      '<div class="stack">' +
      statsHTML +
      '<div class="tablecard">' + filterBar + tableHTML + '</div>' +
      ui.card('Simulation activity by technology',
        '<p class="cardlede">A simulation is technology-specific, so these figures are too. An assessment ' +
        'submission never counts as simulation activity — the assessment belongs to the experiment, not to a ' +
        'technology.</p>' + '<div class="stack sm">' + techCards + '</div>', null, 'h2') +
      F.completionNote() +
      '</div>';

    return {
      area: 'faculty', faculty: f, tenant: tenant, navKey: 'students',
      title: 'Student Progress — ' + f.name, html: html,
      after: function () {
        function bindSelect(id, key) {
          var el = document.getElementById(id);
          if (!el) { return; }
          el.addEventListener('change', function () {
            progFilter[key] = el.value;
            XRSLP.render(true);
            var again = document.getElementById(id);
            if (again) { again.focus(); }
          });
        }
        bindSelect('pf-e', 'experimentId');
        bindSelect('pf-s', 'status');
        var qi = document.getElementById('pf-q');
        if (qi) {
          qi.addEventListener('input', function () {
            progFilter.q = qi.value;
            XRSLP.render(true);
            var again = document.getElementById('pf-q');
            if (again) {
              again.focus();
              again.setSelectionRange(again.value.length, again.value.length);
            }
          });
        }
        var xp = document.getElementById('pf-export');
        if (xp) {
          xp.addEventListener('click', function () {
            if (!rows.length) { return; }
            var table = XRSLP.csv.facultyProgressRows(rows, {
              state: state, data: data, labels: L,
              /* The institution's OWN local code, kept separate from the
                 canonical one — both columns are in the file. */
              courseMapping: function (experimentId) {
                var c = data.contextOf(experimentId);
                return c && c.course ? state.courseMapping(tenant.id, c.course.id) : null;
              }
            });
            var name = 'student-progress-' + data.norm(f.name).replace(/\s+/g, '-') +
              (progFilter.experimentId ? '-' + progFilter.experimentId : '') + '.csv';
            XRSLP.csv.download(name, XRSLP.csv.toCsv(table));
            ui.announce('Exported ' + rows.length + ' ' + util.plural(rows.length, 'row') + ' to ' + name + '.');
          });
        }
        var clear = document.getElementById('pf-clear');
        if (clear) {
          clear.addEventListener('click', function () {
            progFilter = { owner: f.id, experimentId: '', status: '', q: '' };
            XRSLP.render(true);
          });
        }
      }
    };
  };

  /* ============================================================
     ONE STUDENT × ONE EXPERIMENT.
     ============================================================ */
  XRSLP.screens.facultyStudentDetail = function (params) {
    var r = F.requireMapped(params, 'students');
    if (r.fail) { return r.fail; }
    var f = r.faculty, tenant = r.tenant, ctx = r.ctx;
    var e = ctx.experiment;

    var student = state.personById(params.studentId);
    var reach = state.facultyStudentReach(f.id, e.id);
    if (!student || student.role !== 'student' || reach.indexOf(student.id) === -1) {
      return {
        area: 'faculty', faculty: f, tenant: tenant, navKey: 'students',
        title: 'Student not in scope',
        html: ui.phead(e.name, F.courseLine(e.id)) +
          '<div class="stack">' +
          ui.alertBox('warning', 'That student is not entitled to this experiment',
            '<p>Student progress is reported only for students who hold an effective entitlement to an ' +
            'experiment mapped to you. This student does not.</p>') +
          '<div class="formact"><a class="btn pri" href="' + F.href.students(f.id) +
          '">Back to Student Progress</a></div></div>'
      };
    }

    var techs = state.studentEntitledTechnologies(student.id, e.id);
    var prog = state.experimentProgress(student.id, e.id, techs);
    var att = state.latestSubmittedAttempt(student.id, e.id);
    var open = state.currentAttempt(student.id, e.id);
    var assessState = state.assessmentState(student.id, e.id);
    var def = state.assessmentForTenant(tenant.id, e.id);
    var myReviews = state.reviewsForFaculty(f.id, { experimentId: e.id }).filter(function (rv) {
      return rv.personId === student.id;
    });

    var resList = data.resourcesFor(e.id);
    var resHTML = resList.length
      ? '<ul class="reslist">' + resList.map(function (res) {
          var st = state.resourceStatus(student.id, e.id, res.id);
          return '<li><span class="rl-t">' + esc(res.title) + '</span>' +
            '<span class="rl-s">' + L.simBadge(st) + '</span></li>';
        }).join('') + '</ul>'
      : '<p class="cardlede">This experiment has no learning resources.</p>';

    var techHTML = prog.technologies.length
      ? '<ul class="techrows">' + prog.technologies.map(function (tp) {
          var sim = tp.simulation;
          return '<li>' + ui.fmtBadge(tp.technology) +
            '<span class="tr-s">' + L.simBadge(tp.simulationStatus) + '</span>' +
            '<span class="tr-m">' +
            (sim && sim.launches ? sim.launches + ' ' + util.plural(sim.launches, 'launch', 'launches') : 'Never opened') +
            (sim && sim.timeSpentSeconds ? ' · ' + esc(L.fmtDuration(sim.timeSpentSeconds)) + ' recorded' : '') +
            '</span></li>';
        }).join('') + '</ul>'
      : '<p class="cardlede">This student holds no technology for this experiment.</p>';

    var assessHTML;
    if (!def) {
      assessHTML = '<p class="cardlede">No assessment is configured for this experiment.</p>';
    } else if (!att && !open) {
      assessHTML = '<div class="kv">' +
        '<div class="k">Assessment</div><div class="v">' + esc(def.title) + '</div>' +
        '<div class="k">State</div><div class="v">' + L.assessBadge(assessState) + '</div>' +
        '</div>';
    } else {
      var shown = att || open;
      var snap = state.attemptAssessment(shown);
      var revState = att ? state.attemptReviewState(att.id) : { total: 0, completed: 0, pending: 0 };
      assessHTML = '<div class="kv">' +
        '<div class="k">Assessment</div><div class="v">' + esc(def.title) + '</div>' +
        '<div class="k">State</div><div class="v">' + L.assessBadge(assessState) + '</div>' +
        '<div class="k">Attempts used</div><div class="v tabular">' +
          state.attemptsFor(student.id, e.id).length +
          (def.attemptLimit ? ' of ' + def.attemptLimit : '') + '</div>' +
        (att ? '<div class="k">Submitted</div><div class="v">' + esc(util.fmtDateTime(att.submittedAt)) + '</div>' : '') +
        (att && att.score ? '<div class="k">Score</div><div class="v tabular">' +
          (att.score.percent === null ? '—' : att.score.percent + '%') + ' — ' +
          att.score.earned + ' of ' + att.score.total + ' ' + util.plural(att.score.total, 'mark') +
          (att.score.includesReview ? ' including your review' : ' on the automatically marked questions') +
          '</div>' : '') +
        (att && att.sourceTechnology && data.TECHNOLOGIES[att.sourceTechnology]
          ? '<div class="k">Taken after</div><div class="v">' + ui.fmtBadge(att.sourceTechnology) +
            ' simulation</div>' : '') +
        '<div class="k">Pass mark</div><div class="v tabular">' + (snap ? snap.passMark : def.passMark) + '%</div>' +
        (revState.total
          ? '<div class="k">Written answers</div><div class="v">' + revState.completed + ' of ' +
            revState.total + ' reviewed</div>' : '') +
        '</div>' +
        (revState.pending
          ? '<div class="formact"><a class="btn pri sm" href="' + F.href.reviews(f.id) +
            '">Review the written ' + util.plural(revState.pending, 'answer') + '</a></div>' : '');
    }

    var reviewHTML = myReviews.length
      ? '<ul class="revlist">' + myReviews.map(function (rv) {
          var q = state.reviewQuestion(rv);
          return '<li class="rv-item ' + (rv.status === 'completed' ? 'done' : 'pending') + '">' +
            '<div class="rv-h">' + (rv.status === 'completed'
              ? ui.badge('b-success', 'check', 'Reviewed — ' + rv.marks + ' of ' + rv.maxMarks)
              : ui.badge('b-warning', 'clock', 'Pending Faculty review')) +
            '<a class="btn sm sec" href="' + F.href.review(f.id, rv.id) + '">Open</a></div>' +
            '<p class="rv-q">' + esc(q ? q.text : 'Written answer') + '</p>' +
            (rv.status === 'completed' && rv.feedback
              ? '<p class="rv-f"><span class="an-k">Your feedback</span>' + esc(rv.feedback) + '</p>' : '') +
            '</li>';
        }).join('') + '</ul>'
      : '<p class="cardlede">This student has no written answers for this experiment.</p>';

    var html =
      ui.crumbs([{ label: 'Student Progress', href: F.href.students(f.id) },
                 { label: student.name }]) +
      ui.phead(student.name, esc(e.name) + ' · ' + F.courseLine(e.id),
        null, ' ' + L.progressBadge(prog.status)) +
      '<div class="grid-rail"><div class="stack">' +
      ui.card('Assessment', assessHTML, null, 'h2') +
      ui.card('Written answers', reviewHTML, null, 'h2') +
      ui.card('Learning resources', resHTML,
        prog.resources.completed + ' of ' + prog.resources.total + ' marked done', 'h2') +
      '</div><div class="stack">' +
      ui.card('Simulations', techHTML, null, 'h2') +
      ui.card('Overall',
        '<div class="kv">' +
        '<div class="k">Progress</div><div class="v">' + L.progressBadge(prog.status) + '</div>' +
        '<div class="k">Steps done</div><div class="v tabular">' +
          (prog.steps ? prog.steps.done + ' of ' + prog.steps.total : '—') + '</div>' +
        '<div class="k">Last activity</div><div class="v">' +
          (prog.lastActivityAt ? esc(util.fmtDateTime(prog.lastActivityAt)) : 'No activity recorded') + '</div>' +
        '<div class="k">Student ID</div><div class="v">' + esc(student.studentId || '—') + '</div>' +
        '<div class="k">Account</div><div class="v">' +
          (student.status === 'active' ? ui.badge('b-success', 'check', 'Active')
            : ui.badge('b-neutral', 'minus', 'Inactive')) + '</div>' +
        '</div>', null, 'h2') +
      F.completionNote() +
      '</div></div>';

    return {
      area: 'faculty', faculty: f, tenant: tenant, navKey: 'students',
      title: student.name + ' — ' + e.name, html: html
    };
  };
})();
