/* ============================================================
   Unified Functional Platform — Tenant workspace (Institute Admin /
   Tenant Admin — ONE role, STK31-02).

   Implementation 02 completes the institution-side half of the chain:

     Super Admin approves  →  TENANT ACCESS      (what the tenant holds)
     Tenant Admin assigns  →  STUDENT ENTITLEMENT (who inside it gets it)

   The Tenant Admin can never grant content outside the approved set
   (STK31-24) and can never redefine the canonical catalogue (STK31-10).

   This file: shared tenant helpers · workspace resolution · Overview ·
   Content access. People, Groups/Mappings and Student access live in
   tenant-people.js, tenant-groups.js and tenant-assign.js.

   ── IMPLEMENTATION 07.3 — THREE STAKEHOLDER CORRECTIONS ───────

   R04 · TERMINOLOGY. "Assignment" is gone from every user-facing string
   in this workspace. The stakeholder rejected it outright — "that is not
   assignment … it will change the complete context" — and they are
   right: an assignment is homework a teacher sets, while what a Tenant
   Admin does here is GIVE A STUDENT ACCESS to content the institution is
   already approved for. The words are now:

     Content access   what the INSTITUTION holds  (unchanged)
     Student access   who INSIDE it can open it   (was "Assignments")
     access grant     one such record             (was "an assignment")
     Faculty mapping  which content a Faculty member manages (unchanged —
                      it was already named correctly)

   Routes, state records, helper names and `navKey` values are
   deliberately NOT renamed. They are internal, they are shared with
   files this one does not own, and renaming them would be regression
   risk with no user-visible gain.

   ⚠ "Access record" is still the term the STATE LAYER prints in its own
   refusal sentences (`assignabilityText`), and the Super Admin screens
   use it too. Renaming it here alone would make one screen disagree with
   another, which is worse than the jargon. It is therefore GLOSSED in
   plain words wherever it first appears rather than renamed — see
   `accessRecordGlossHTML` below.

   R05 · SCALE. An institution may hold ~50 experiments across several
   Programmes. A flat list is unusable at that size, so Content access is
   now a SEARCHABLE, FILTERABLE CONTENT LIBRARY organised
   Programme → Course → Experiment, and each access record panel below it
   summarises its content by Programme instead of listing every
   experiment twice.

   R06 · THE INSTITUTION'S LEARNING OVERVIEW. The Tenant Admin is the
   institution's point of contact and had provisioning figures only. The
   Overview now carries the learning half as well — students started, in
   progress, awaiting Faculty review, completed, and the distribution
   across Courses and Experiments.

   ⚠ EVERY LEARNING FIGURE IS DERIVED, per student, from the SAME
   functions the Student workspace and the Faculty screens answer with
   (`studentExperiments`, `experimentProgress`). Nothing is estimated,
   sampled or invented, and there is no revenue or financial analytics
   anywhere in this build.

   ⚠ IT IS OVERSIGHT, NOT EVALUATION. No mark, no pass/fail count, no
   individual result and no review queue appears here. Faculty is the
   only human evaluator (STK31-31), and the roll-up is taken in the
   STUDENT VIEW (`studentView: true`) precisely so that a result which
   has been evaluated but not yet released cannot be inferred from the
   institution's own dashboard.
   ============================================================ */

window.XRSLP = window.XRSLP || {};
XRSLP.screens = XRSLP.screens || {};

/* ---------------- shared tenant-side helpers ---------------- */
XRSLP.tenantUI = (function () {
  'use strict';

  var esc = XRSLP.util.esc;
  var ui = XRSLP.ui;
  var data = XRSLP.data;
  var state = XRSLP.state;

  function base(tenantId) { return '#/tenant/' + encodeURIComponent(tenantId); }
  var href = {
    overview:      function (t) { return base(t) + '/overview'; },
    access:        function (t) { return base(t) + '/content-access'; },
    people:        function (t) { return base(t) + '/people'; },
    addFaculty:    function (t) { return base(t) + '/people/add-faculty'; },
    addStudent:    function (t) { return base(t) + '/people/add-student'; },
    importCsv:     function (t) { return base(t) + '/people/import'; },
    person:        function (t, p) { return base(t) + '/person/' + encodeURIComponent(p); },
    groups:        function (t) { return base(t) + '/groups'; },
    newGroup:      function (t) { return base(t) + '/groups/new'; },
    group:         function (t, g) { return base(t) + '/group/' + encodeURIComponent(g); },
    mappings:      function (t) { return base(t) + '/mappings'; },
    assignments:   function (t) { return base(t) + '/assignments'; },
    newAssignment: function (t) { return base(t) + '/assignments/new'; },
    facultyMap:    function (t) { return base(t) + '/faculty-mapping'; },
    /* Implementation 07.2 — the device-request queue this institution
       is the point of contact for. */
    deviceRequests: function (t) { return base(t) + '/device-requests'; },
    deviceRequest:  function (t, id) { return base(t) + '/device-request/' + encodeURIComponent(id); }
  };

  /* Every tenant screen resolves its tenant the same way, and fails the
     same way when the address is stale.

     Implementation 06 adds one option: `write: true`. A screen whose
     whole purpose is a MUTATION — creating a person, importing a CSV,
     making an assignment — passes it, and a deactivated tenant then gets
     a rendered refusal instead of a form whose Save button would be
     silently refused by the state layer. A dead control is worse than an
     honest refusal, so there is no third behaviour. Read-only screens
     pass nothing and stay fully readable: deactivation hides no history. */
  function requireTenant(params, navKey, opts) {
    var tenant = state.tenantById(params.tenantId);
    if (tenant) {
      /* `tenant: null` on purpose: every screen tests `if (!r.tenant)
         { return r.fail; }`, and the refusal object carries the tenant
         itself, so the workspace shell still renders with the right
         navigation and the right institution name. */
      if (opts && opts.write && !state.tenantCanWrite(tenant.id)) {
        return { tenant: null, fail: inactiveRefusal(tenant, navKey, opts.what) };
      }
      return { tenant: tenant };
    }
    return {
      tenant: null,
      fail: {
        title: 'Tenant not found',
        tenant: null,
        navKey: navKey || null,
        html: ui.phead('Tenant not found') +
          '<div class="tablecard">' + ui.emptyState({
            icon: 'alertCirc',
            title: 'No tenant with this identifier',
            body: 'The address may be stale — the tenant may not exist in the current prototype data.',
            actionsHTML: '<a class="btn pri" href="#/tenant">Resolve my tenant workspace</a>'
          }) + '</div>'
      }
    };
  }

  /* The refusal a mutating screen shows while the institution is
     deactivated. It names the action that is unavailable, says plainly
     that nothing was deleted, and offers the one place that can still
     be reached. */
  function inactiveRefusal(tenant, navKey, what) {
    return {
      title: 'Not available — institution deactivated',
      tenant: tenant,
      navKey: navKey || null,
      html: ui.phead(what || 'Not available',
        esc(tenant.name) + ' has been deactivated by the Super Admin') +
        '<div class="tablecard">' + ui.emptyState({
          icon: 'alertCirc',
          title: 'This institution is deactivated',
          body: (what ? what + ' is not available while the institution is deactivated. ' : '') +
            'Everything already recorded — people, groups, academic mappings, student access grants, licence ' +
            'allocation, assessments and every student’s progress — is preserved exactly as it stands. ' +
            'Nothing has been deleted, and reactivating the institution restores what is still valid.',
          actionsHTML: '<a class="btn pri" href="' + href.overview(tenant.id) + '">Back to the overview</a>' +
            '<a class="btn sec" href="' + XRSLP.supportUI.href.tenant(tenant.id) + '">Report an issue</a>'
        }) + '</div>'
    };
  }

  /* Action markup, but only while the institution can be operated on.
     A deactivated tenant keeps every screen READABLE — history is never
     hidden — and simply does not render controls the state layer would
     refuse. A dead control is worse than an absent one. */
  function actionsIfWritable(tenant, html, note) {
    if (!tenant || state.tenantCanWrite(tenant.id)) { return html; }
    return note === false ? '' :
      '<p class="muted" style="font-size:12.5px;line-height:1.55;margin:0">' +
      esc(note || 'Not available while the institution is deactivated. Nothing here has been deleted.') +
      '</p>';
  }
  function canWrite(tenant) { return !!tenant && state.tenantCanWrite(tenant.id); }

  /* ---------- small display pieces ---------- */

  function personStatusBadge(p) {
    return p.status === 'active'
      ? ui.badge('b-success', 'check', 'Active')
      : ui.badge('b-neutral', 'minus', 'Inactive');
  }

  function sourceLabel(source) { return state.SOURCE_META[source] || 'Unknown'; }

  /* Provenance line required by ND-04 — shown, never asserted as an
     authority. There is no ERP route in this slice. */
  function sourceBadge(source) {
    return '<span class="prov">' + esc(sourceLabel(source)) + '</span>';
  }

  function personLink(tenantId, p) {
    return '<a class="rowlink" href="' + href.person(tenantId, p.id) + '">' +
      '<span class="tmain">' + esc(p.name) + '</span>' +
      '<span class="tsub">' + esc(p.role === 'faculty' ? (p.facultyId || 'Faculty') : (p.studentId || 'Student')) + '</span></a>';
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

  /* Approved · Assigned · Remaining — the exact trio STK31-27 permits,
     and only because every figure derives from the approved request.
     The bar is decoration: all three numbers are text, so the state is
     never carried by colour alone. */
  function allocMeter(alloc, opts) {
    opts = opts || {};
    var pct = alloc.approved > 0 ? Math.min(100, Math.round((alloc.assigned / alloc.approved) * 100)) : 0;
    var tone = alloc.over > 0 ? 'over' : alloc.remaining === 0 ? 'full' : '';
    return '<div class="alloc' + (tone ? ' ' + tone : '') + '">' +
      '<div class="al-nums">' +
      '<span class="al-i"><span class="al-k">Approved</span><span class="al-v tabular">' + alloc.approved + '</span></span>' +
      '<span class="al-i"><span class="al-k">Assigned</span><span class="al-v tabular">' + alloc.assigned + '</span></span>' +
      '<span class="al-i"><span class="al-k">Remaining</span><span class="al-v tabular">' + alloc.remaining + '</span></span>' +
      '</div>' +
      '<div class="al-bar" role="img" aria-label="' +
      esc(alloc.assigned + ' of ' + alloc.approved + ' approved licences assigned, ' + alloc.remaining + ' remaining') +
      '"><span style="width:' + pct + '%"></span></div>' +
      (alloc.over > 0 ?
        '<p class="al-note">' + alloc.over + ' ' + XRSLP.util.plural(alloc.over, 'student') +
        ' hold an access grant beyond the approved quantity and are <strong>not</strong> entitled. ' +
        'Free a licence, or ask the Super Admin to revise the approved quantity.</p>' : '') +
      (opts.noteHTML ? '<p class="al-note">' + opts.noteHTML + '</p>' : '') +
      '</div>';
  }

  function accessOptionLabel(rec) {
    var termDef = data.term(rec.term);
    return rec.id + ' — ' + rec.items.length + ' ' + XRSLP.util.plural(rec.items.length, 'experiment') +
      ' · ' + rec.quantity + ' approved · ' + (termDef ? termDef.label : rec.term);
  }

  /* R04 — "Access record" glossed rather than renamed.

     The stakeholder questioned the phrase, and it IS jargon. It cannot
     simply be replaced here: the state layer prints it inside its own
     refusal sentences (`assignabilityText`), and the Super Admin screens
     use it as well — so a rename confined to this workspace would make
     two surfaces disagree about what the same record is called, which is
     a worse failure than the jargon itself. Instead the term is defined
     in plain words wherever the Tenant Admin first meets it. */
  function accessRecordGlossHTML() {
    return '<p>An <strong>access record</strong> is one approved allocation: the experiments, the technology ' +
      'variants, the number of student licences and the term the Super Admin approved for this institution. ' +
      'It says what the institution <em>may</em> use. It gives no student anything on its own &mdash; that is ' +
      'what <strong>Student access</strong> does.</p>';
  }

  function expLine(experimentId) {
    var ctx = data.contextOf(experimentId);
    if (!ctx) { return esc(experimentId); }
    return '<span class="tmain">' + esc(ctx.experiment.name) + '</span>' +
      '<span class="tsub">' + esc(ctx.grouping.name) + ' › ' + esc(ctx.course.name) + '</span>';
  }

  /* Why no student can be given access right now — stated precisely,
     never as a bare "no access". If the tenant holds records that simply
     cannot be granted from, each one is named with its reason, so this
     screen can never silently contradict the navigation count or the
     Content access page. */
  function noAssignableAccessHTML(tenant, headingLevel) {
    var blocked = state.unassignableAccessForTenant(tenant.id);
    if (!blocked.length) {
      /* The institution can exist with an APPROVED request and still
         hold nothing, because approval creates the institution and
         payment activates its access. Saying "until a request is
         approved" would then be untrue — one already has been. */
      var pendingPay = state.tenantAwaitingActivation(tenant.id);
      return ui.emptyState({
        icon: pendingPay ? 'card' : 'layers', heading: headingLevel,
        title: pendingPay ? 'No content access yet — awaiting payment' : 'No content access yet',
        body: pendingPay
          ? 'The Super Admin has approved an institutional access request for ' + tenant.name +
            ', which is why this institution exists. The approved content is activated when payment ' +
            'completes; no student can be given anything until then.'
          : 'The Super Admin decides what this institution may use. No student can be given content until an ' +
            'institutional access request for ' + tenant.name + ' is approved and activated.',
        actionsHTML: '<a class="btn sec" href="' + href.access(tenant.id) + '">View content access</a>'
      });
    }
    return ui.emptyState({
      icon: 'alert', heading: headingLevel,
      title: blocked.length === 1
        ? 'The one access record this institution holds cannot be granted from'
        : 'None of the ' + blocked.length + ' access records this institution holds can be granted from',
      body: 'Student access can never reach outside an approved, usable access record.',
      actionsHTML: '<a class="btn sec" href="' + href.access(tenant.id) + '">View content access</a>'
    }) +
    '<ul class="blocklist">' + blocked.map(function (b) {
      return '<li><span class="mono">' + esc(b.record.id) + '</span> — ' +
        esc(state.assignabilityText(b.reason)) + '.</li>';
    }).join('') + '</ul>';
  }

  /* ============================================================
     R05 — CONTENT ORGANISATION AT SCALE.

     "If they have to assign 50 experiments, how they will handle it …
      otherwise everything is going to be in a very big dropdown."

     The tenant's content is therefore organised the way the catalogue
     itself is — PROGRAMME / DEPARTMENT → COURSE → EXPERIMENT — instead
     of being flattened into one list. `data.contextOf()` already
     resolves that whole path for an experiment; every screen in this
     workspace used to resolve it and then throw the grouping away.

     One function builds the tree, so the Content access library, the
     access-record panels and the Student access pickers can never
     disagree about how the same content is organised.

     Ordering is alphabetical by Programme, then Course, then Experiment
     — stable, and the same order in every surface. Content whose
     context cannot be resolved is NOT dropped: it is collected under a
     clearly-named "Unresolved" Programme, because silently hiding
     content the institution is paying for would be the worst possible
     failure of this screen.
     ============================================================ */
  function groupContent(items) {
    var progs = {}, order = [];
    (items || []).forEach(function (item) {
      var expId = item.experimentId;
      var ctx = data.contextOf(expId);
      var gId = ctx && ctx.grouping ? ctx.grouping.id : '__none';
      var gName = ctx && ctx.grouping ? ctx.grouping.name : 'Unresolved — not in the current catalogue';
      var cId = ctx && ctx.course ? ctx.course.id : '__none';
      var cName = ctx && ctx.course ? ctx.course.name : 'Unresolved course';
      if (!progs[gId]) {
        progs[gId] = { id: gId, name: gName, courses: {}, courseOrder: [], count: 0, technologies: {} };
        order.push(progs[gId]);
      }
      var g = progs[gId];
      if (!g.courses[cId]) {
        g.courses[cId] = { id: cId, name: cName, groupingId: gId, groupingName: gName, rows: [] };
        g.courseOrder.push(g.courses[cId]);
      }
      g.courses[cId].rows.push({
        experimentId: expId,
        name: ctx ? ctx.experiment.name : expId,
        courseId: cId, courseName: cName,
        groupingId: gId, groupingName: gName,
        technologies: (item.technologies || []).slice(),
        item: item
      });
      g.count += 1;
      (item.technologies || []).forEach(function (t) { g.technologies[t] = true; });
    });
    function byName(a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; }
    order.sort(byName);
    order.forEach(function (g) {
      g.courseOrder.sort(byName);
      g.courseOrder.forEach(function (c) { c.rows.sort(byName); });
      g.technologies = data.sortTech(Object.keys(g.technologies));
    });
    return order;
  }

  /* Flat, ordered rows out of the same tree — the shape a table wants. */
  function contentRows(items) {
    var out = [];
    groupContent(items).forEach(function (g) {
      g.courseOrder.forEach(function (c) {
        c.rows.forEach(function (row) { out.push(row); });
      });
    });
    return out;
  }

  /* `<optgroup>` per PROGRAMME, options labelled "Course — Experiment".

     This is the minimum the stakeholder's own example demands: a single
     flat `<select>` over 50 experiments is unusable, and the browser's
     own grouped select is free, accessible and needs no new CSS. The
     screens that use it pair it with a text filter, because grouping
     alone still leaves 50 options to scroll past. */
  function experimentOptionsHTML(items, selectedId) {
    return groupContent(items).map(function (g) {
      return '<optgroup label="' + esc(g.name) + '">' +
        g.courseOrder.map(function (c) {
          return c.rows.map(function (row) {
            return '<option value="' + esc(row.experimentId) + '"' +
              (selectedId === row.experimentId ? ' selected' : '') + '>' +
              esc(c.name + ' — ' + row.name) + '</option>';
          }).join('');
        }).join('') +
        '</optgroup>';
    }).join('');
  }

  /* Does one content row match a {q, grouping, course, tech} filter?
     Shared so the library, the pickers and their result counts can never
     apply different rules to the same row. */
  function contentMatches(row, f) {
    if (f.grouping && f.grouping !== 'all' && row.groupingId !== f.grouping) { return false; }
    if (f.course && f.course !== 'all' && row.courseId !== f.course) { return false; }
    if (f.tech && f.tech !== 'all' && row.technologies.indexOf(f.tech) === -1) { return false; }
    if (f.q) {
      var hay = (row.name + ' ' + row.courseName + ' ' + row.groupingName + ' ' + row.experimentId).toLowerCase();
      if (hay.indexOf(f.q.toLowerCase()) === -1) { return false; }
    }
    return true;
  }

  /* Reason a derived entitlement is not effective — always explained. */
  var BLOCK_TEXT = {
    'student-inactive': 'Student is inactive',
    'access-expired': 'Access record expired',
    'allocation-held': 'Held — allocation full'
  };
  function entitlementBadge(ent) {
    if (ent.effective) { return ui.badge('b-success', 'check', 'Entitled'); }
    return ui.badge('b-warning', 'alert', BLOCK_TEXT[ent.blockedBy] || 'Not effective');
  }

  return {
    href: href, requireTenant: requireTenant, inactiveRefusal: inactiveRefusal,
    actionsIfWritable: actionsIfWritable, canWrite: canWrite,
    personStatusBadge: personStatusBadge, sourceBadge: sourceBadge, sourceLabel: sourceLabel,
    personLink: personLink, statGrid: statGrid, allocMeter: allocMeter,
    noAssignableAccessHTML: noAssignableAccessHTML,
    accessOptionLabel: accessOptionLabel, expLine: expLine,
    accessRecordGlossHTML: accessRecordGlossHTML,
    groupContent: groupContent, contentRows: contentRows,
    experimentOptionsHTML: experimentOptionsHTML, contentMatches: contentMatches,
    entitlementBadge: entitlementBadge, BLOCK_TEXT: BLOCK_TEXT
  };
})();

(function () {
  'use strict';

  var esc = XRSLP.util.esc;
  var util = XRSLP.util;
  var ui = XRSLP.ui;
  var data = XRSLP.data;
  var state = XRSLP.state;
  var T = XRSLP.tenantUI;

  /* ============================================================
     R06 — THE INSTITUTION'S LEARNING ROLL-UP.

     "He is the POC for the institution … he should have that overview."

     ⚠ EVERY FIGURE BELOW IS DERIVED FROM REAL LEARNING RECORDS. It walks
     the students who actually hold EFFECTIVE entitlement
     (`entitledStudentIds`), asks for their experiments through the same
     `studentExperiments()` the Student workspace uses, and takes each
     state from the same `experimentProgress()` the Faculty screens read.
     Nothing is estimated, weighted, sampled or invented. If a figure
     cannot be derived it is not shown.

     ⚠ `studentView: true` IS THE PRIVACY GUARD, NOT A DETAIL. A result
     that Faculty have evaluated but whose release the assessment's own
     visibility policy is still holding must not become inferable from
     the institution's dashboard. In the student view that case reports
     as RESULT_WITHHELD — an honest "evaluated, not released yet" — and
     never as passed or not passed. Take this roll-up without it and the
     Tenant Admin's completion count would publish outcomes the Student
     themselves has not been shown.

     ⚠ NO OUTCOMES, EVER. There is no mark, no score, no pass rate and no
     individual student result anywhere in this roll-up, and no route
     from it into a review. Faculty is the only human evaluator
     (STK31-31); this is oversight of PROGRESS, which is what the POC
     needs to run the institution.

     ⚠ NO REVENUE, COST OR COMMERCIAL ANALYTICS. None exists in this
     build, and none is invented.
     ============================================================ */
  function learningRollup(tenant) {
    var TP = state.TECH_PROGRESS;
    var out = {
      students: 0, started: 0, notStartedStudents: 0, allComplete: 0,
      pairs: 0,
      notStarted: 0, inProgress: 0, awaitingReview: 0, awaitingRelease: 0, completed: 0,
      byExperiment: {}, experimentOrder: [],
      byCourse: {}, courseOrder: []
    };

    function bucketOf(status) {
      if (status === TP.COMPLETED) { return 'completed'; }
      if (status === TP.RESULT_WITHHELD) { return 'awaitingRelease'; }
      if (status === TP.PENDING_REVIEW) { return 'awaitingReview'; }
      if (status === TP.IN_PROGRESS) { return 'inProgress'; }
      return 'notStarted';
    }
    function blank(extra) {
      var o = { students: 0, notStarted: 0, inProgress: 0, awaitingReview: 0, awaitingRelease: 0, completed: 0 };
      for (var k in extra) { if (Object.prototype.hasOwnProperty.call(extra, k)) { o[k] = extra[k]; } }
      return o;
    }

    var ids = state.entitledStudentIds(tenant.id);
    out.students = ids.length;

    ids.forEach(function (pid) {
      /* EFFECTIVE rows only. A student who holds a grant on an expired
         record, or is held beyond the approved quantity, cannot open the
         experiment — counting them as "not started" would blame a
         learner for a licence state. Those cases already have their own
         attention rows above. */
      var rows = state.studentExperiments(pid).filter(function (r) { return r.effective; });
      var touched = 0, done = 0;
      rows.forEach(function (row) {
        var prog = state.experimentProgress(pid, row.experimentId, row.technologies, { studentView: true });
        var b = bucketOf(prog.status);
        out.pairs += 1;
        out[b] += 1;
        if (b !== 'notStarted') { touched += 1; }
        if (b === 'completed') { done += 1; }

        var ctx = data.contextOf(row.experimentId);
        var e = out.byExperiment[row.experimentId];
        if (!e) {
          e = out.byExperiment[row.experimentId] = blank({
            experimentId: row.experimentId,
            name: ctx ? ctx.experiment.name : row.experimentId,
            courseId: ctx && ctx.course ? ctx.course.id : '',
            courseName: ctx && ctx.course ? ctx.course.name : '—',
            groupingName: ctx && ctx.grouping ? ctx.grouping.name : '—'
          });
          out.experimentOrder.push(e);
        }
        e.students += 1; e[b] += 1;

        var cKey = (ctx && ctx.course ? ctx.course.id : '__none');
        var c = out.byCourse[cKey];
        if (!c) {
          c = out.byCourse[cKey] = blank({
            courseId: cKey,
            name: ctx && ctx.course ? ctx.course.name : 'Unresolved course',
            groupingName: ctx && ctx.grouping ? ctx.grouping.name : '—',
            experiments: {}, experimentCount: 0,
            studentIds: {}
          });
          out.courseOrder.push(c);
        }
        c[b] += 1;
        if (!c.experiments[row.experimentId]) { c.experiments[row.experimentId] = true; c.experimentCount += 1; }
        /* A student taking three experiments in one Course is ONE
           student in that Course's "students with access" column. The
           per-state columns stay per experiment, and the table says so —
           mixing the two silently is how a roll-up starts contradicting
           the tiles above it. */
        if (!c.studentIds[pid]) { c.studentIds[pid] = true; c.students += 1; }
      });
      if (touched) { out.started += 1; } else { out.notStartedStudents += 1; }
      if (rows.length && done === rows.length) { out.allComplete += 1; }
    });

    function order(a, b) {
      var ka = a.groupingName + ' ' + (a.courseName || a.name) + ' ' + a.name;
      var kb = b.groupingName + ' ' + (b.courseName || b.name) + ' ' + b.name;
      return ka < kb ? -1 : ka > kb ? 1 : 0;
    }
    out.experimentOrder.sort(order);
    out.courseOrder.sort(order);
    return out;
  }

  /* ============================================================
     RENEWAL — Implementation 07.2, stakeholder rule D.

     "Tenant should go through same payment method which he follows in
      initial onboarding."

     THREE surfaces need the same answer — the expiry attention row and
     the expired-record row on the Overview, and every record on Content
     access — so there is ONE builder here and all three call it. Two
     screens describing renewal in their own words is exactly how they
     start disagreeing.

     ⚠ THE ROUTE COMES FROM THE INSTITUTION. `renewalRouteFor` derives
     it from the tenant and its ORIGINAL onboarding request, never from
     the prototype scenario selector — reading the selector here would
     put an internal institution on the payment route whenever the
     external scenario happened to be chosen, and vice versa.

     ⚠ REQUESTING A RENEWAL EXTENDS NOTHING. It raises an ordinary
     request that the Super Admin decides on the decision surface that
     already exists and that, where the institution's route has one,
     goes through the payment screen that already exists. No second
     decision surface and no second payment surface is built here, and
     there is no writer anywhere in this build that lengthens a term
     because somebody asked.
     ============================================================ */

  /* The institution's route, stated before any control is offered, so
     the Tenant Admin knows what pressing the button actually starts. */
  function renewalRouteHTML(tenant) {
    /* INSTITUTION-WIDE sentence. It is only true where every live record
       agrees; where they do not, each record states its own route and
       this paragraph says so rather than generalising. */
    var route = state.renewalRouteFor(tenant.id);
    var recordRoutes = {};
    state.accessForTenant(tenant.id).forEach(function (r) {
      var rr = state.renewalRouteForAccess(r.id);
      if (rr) { recordRoutes[rr.paymentRequired ? 'payment' : 'none'] = true; }
    });
    var routesDiffer = recordRoutes.payment && recordRoutes.none;
    if (!route) { return ''; }
    return '<p>' + (routesDiffer
      ? 'This institution holds access records that arrived on <strong>different routes</strong>. A renewal ' +
        'follows the route of the <strong>record being renewed</strong>, so each record below states its own ' +
        'and there is no single answer for the institution as a whole.'
      : route.paymentRequired
      ? 'A renewal for ' + esc(tenant.name) + ' follows the <strong>same payment step this institution was ' +
        'onboarded through</strong>. The Super Admin decides the renewal request first, and the access term is ' +
        'extended only when that payment step completes.'
      : 'There is <strong>no payment step</strong> on this institution&rsquo;s access route, so the ' +
        '<strong>Super Admin&rsquo;s approval</strong> is what activates a renewal.') + '</p>' +
      '<p style="margin-top:8px">Requesting a renewal <strong>extends nothing on its own</strong>, and nobody ' +
      '&mdash; the Super Admin included &mdash; can extend an access term directly. The term moves only when ' +
      'this institution&rsquo;s own route has completed.</p>';
  }

  /* A renewal already in flight. It is an ORDINARY request row, so it is
     tracked on the ordinary request status page and, where the route has
     one, paid for on the ordinary payment screen. Neither is rebuilt. */
  function openRenewalHTML(req) {
    var awaitingPay = req.status === state.STATUS.APPROVED_PAYMENT_REQUIRED;
    return '<p style="margin-top:10px">Renewal request <strong class="mono">' + esc(req.id) + '</strong> ' +
      ui.statusBadge(req.status) + '</p>' +
      '<div class="formact">' +
      '<a class="btn sm sec" href="#/request-status/' + encodeURIComponent(req.id) + '">Track this request</a>' +
      (awaitingPay
        ? '<a class="btn sm pri" href="#/payment/' + encodeURIComponent(req.id) + '">Complete the payment step</a>'
        : '') +
      '</div>' +
      '<p class="cardfoot">Until it is activated, this record&rsquo;s end date is unchanged and nothing has ' +
      'been charged, sent or confirmed.</p>';
  }

  /* Renewals already activated on this record. The PREVIOUS end date is
     kept beside the new one and is never removed: a renewal extends a
     term, and dropping what it extended from would make the record
     unreadable as history. */
  function renewalHistoryHTML(rec) {
    var list = Array.isArray(rec.renewals) ? rec.renewals : [];
    if (!list.length) { return ''; }
    return '<h3 class="subh">Renewal history</h3>' +
      '<ul class="reslist plain">' + list.map(function (rn) {
        var termDef = data.term(rn.term);
        return '<li>' + ui.ic('clock') + '<span><strong>' + esc(util.fmtDate(rn.at)) + '</strong> &mdash; ' +
          esc(termDef ? termDef.label : rn.term) + ' added. Previously ended ' +
          esc(rn.previousEndsOn ? util.fmtDate(rn.previousEndsOn) : 'with no recorded end date') +
          '; now ends ' + esc(util.fmtDate(rn.endsOn)) + '.' +
          (rn.requestId ? ' <span class="muted">· request ' + esc(rn.requestId) + '</span>' : '') +
          '</span></li>';
      }).join('') + '</ul>';
  }

  /* What this ONE record can do about renewal right now: track the
     renewal already running, read why one cannot be raised, or raise
     one. Never a dead control — `renewalBlock` names the reason and the
     reason is printed instead of the button. */
  function renewalRecordHTML(rec) {
    var openReq = state.openRenewalForAccess(rec.id);
    var block = state.renewalBlock(rec.id);
    var action;
    if (openReq) {
      action = openRenewalHTML(openReq);
    } else if (block) {
      action = '<p style="margin-top:8px">A renewal cannot be requested for <strong class="mono">' +
        esc(rec.id) + '</strong> right now because ' + esc(state.renewalBlockText(block)) + '. Nothing has ' +
        'been lost: the record, its access grants and every student&rsquo;s progress are kept exactly as they ' +
        'stand.</p>';
    } else if (state.canRenewAccess(rec.id)) {
      action = '<div class="formact">' +
        '<button class="btn sm pri" type="button" data-renew="' + esc(rec.id) + '">Request renewal' +
        '<span class="sr-only"> of access record ' + esc(rec.id) + '</span></button></div>';
    } else {
      action = '';
    }
    return action + renewalHistoryHTML(rec);
  }

  /* The whole renewal block for a SET of records — the shape the two
     Overview attention rows need, where one row already speaks about
     several records at once. The route is stated once, because it
     belongs to the institution rather than to any one record. */
  function renewalPanelsHTML(tenant, records) {
    if (!records.length) { return ''; }
    return renewalRouteHTML(tenant) + records.map(function (rec) {
      return '<div style="margin-top:10px">' +
        (records.length > 1 ? '<p><strong class="mono">' + esc(rec.id) + '</strong></p>' : '') +
        renewalRecordHTML(rec) + '</div>';
    }).join('');
  }

  /* THE ONE PLACE A RENEWAL IS RAISED. Both the Overview and Content
     access bind it, because both offer the control and neither may grow
     a second submission path. */
  function bindRenewal() {
    Array.prototype.slice.call(document.querySelectorAll('[data-renew]')).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var accessId = btn.getAttribute('data-renew');
        var rec = state.accessById(accessId);
        if (!rec) { return; }
        /* PER RECORD. An institution may hold records that arrived on
           different routes, and this dialog speaks about ONE of them. */
        var route = state.renewalRouteForAccess(accessId);
        var termDef = data.term(rec.term);
        ui.openDialog({
          title: 'Request renewal of ' + accessId + '?',
          bodyHTML:
            '<p>This raises a renewal request for <strong>' + esc(accessId) + '</strong> that mirrors the ' +
            'current plan exactly &mdash; <strong>' + rec.items.length + ' ' +
            util.plural(rec.items.length, 'experiment') + '</strong>, <strong>' + rec.quantity + '</strong> ' +
            'approved ' + util.plural(rec.quantity, 'licence') + ', <strong>' +
            esc(termDef ? termDef.label : rec.term) + '</strong>. None of it can be edited on the way ' +
            'through.</p>' +
            '<div class="consequence">' + ui.ic('info') + '<span><strong>Nothing is extended by asking.</strong> ' +
            (route && route.paymentRequired
              ? 'The Super Admin decides the request, and the term moves only when the same payment step this ' +
                'institution was onboarded through completes.'
              : 'The Super Admin decides the request, and the term moves only when that approval activates it ' +
                '&mdash; there is no payment step on this institution&rsquo;s access route.') +
            '</span></div>' +
            '<div class="consequence">' + ui.ic('shield') + '<span>The record keeps its identifier, so every ' +
            'access grant, faculty mapping and student&rsquo;s progress on it stays exactly where it is. No ' +
            'second access record, no extra licence and no extra experiment is created.</span></div>' +
            '<div class="field" id="rn-note" style="margin-top:12px">' +
            '<label for="rn-note-i">Note recorded on the renewal request (optional)</label>' +
            '<input type="text" id="rn-note-i" autocomplete="off">' +
            '<p class="hint">Optional. It is kept on the request&rsquo;s own history, where the platform team ' +
            'reads it. Nothing is sent to anybody.</p></div>',
          okLabel: 'Request renewal',
          onConfirm: function (body) {
            var input = body ? body.querySelector('#rn-note-i') : null;
            var out = state.submitRenewalRequest(accessId, { note: input ? input.value : '' });
            if (!out.ok) {
              /* The state layer refused. Say which of its reasons it was
                 rather than a generic failure — and say that nothing was
                 written, because nothing was. */
              var why = state.renewalBlockText(out.reason);
              ui.toast('Nothing was requested — ' + why + '.', 'info');
              ui.announce('The renewal was not requested because ' + why + '.');
              XRSLP.render(false);
              return;
            }
            ui.toast('Renewal request ' + out.request.id + ' raised for ' + accessId +
              '. Nothing is extended yet — the end date is unchanged.');
            XRSLP.render(false);
          }
        });
      });
    });
  }

  /* ---------------- tenant home — resolve the active scenario's tenant ---------------- */
  XRSLP.screens.tenantHome = function () {
    var sc = state.scenario();
    var tenant = null;
    if (sc.seedTenantId) { tenant = state.tenantById(sc.seedTenantId); }
    if (!tenant) {
      var byName = state.tenants().filter(function (t) {
        return t.name.toLowerCase() === sc.institution.name.toLowerCase();
      })[0];
      if (byName) { tenant = byName; }
    }
    if (tenant) { return { redirect: T.href.overview(tenant.id) }; }

    /* The scenario institution has no tenant yet — access has not been
       activated. This is a real, meaningful state for the external
       scenario before approval + payment. */
    var others = state.tenants();
    var html =
      ui.phead('Tenant workspace') +
      '<div class="stack">' +
      ui.alertBox('info', 'No active tenant workspace for ' + sc.institution.name,
        '<p>A tenant workspace exists only after an institutional access request has been approved' +
        (sc.institution.paymentRequired ? ' and payment has been completed' : '') +
        '. ' + esc(sc.institution.name) + ' does not have activated access yet, so there is no approved content to show.</p>' +
        '<p style="margin-top:8px"><a href="#/requests">Track the institution&rsquo;s requests</a></p>') +
      (others.length ?
        ui.card('Existing prototype tenants',
          '<ul class="reqitems">' + others.map(function (t) {
            return '<li class="ri"><div class="ri-body"><div class="ri-t">' + esc(t.name) + '</div>' +
              '<div class="ri-ctx">' + esc(t.accessContext) + '</div></div>' +
              '<div class="ri-tech"><a class="btn sm sec" href="' + T.href.overview(t.id) + '">Open workspace</a></div></li>';
          }).join('') + '</ul>') : '') +
      ui.protoNote('The tenant this view resolves to follows the requester scenario chosen in Prototype controls.') +
      '</div>';

    return { title: 'Tenant workspace', html: html, tenant: null, navKey: null };
  };

  /* ---------------- OVERVIEW ---------------- */
  XRSLP.screens.tenantOverview = function (params) {
    var r = T.requireTenant(params, 'overview');
    if (!r.tenant) { return r.fail; }
    var tenant = r.tenant;

    var faculty = state.facultyForTenant(tenant.id);
    var students = state.studentsForTenant(tenant.id);
    var activeStudents = students.filter(function (p) { return p.status === 'active'; });
    var groups = state.groupsForTenant(tenant.id);
    var live = state.liveAccessForTenant(tenant.id);
    var alloc = state.tenantAllocation(tenant.id);
    var tenantActive = state.tenantIsActive(tenant.id);
    var entitled = state.entitledStudentIds(tenant.id);

    var stats = T.statGrid([
      { label: 'Faculty', value: faculty.length },
      { label: 'Students', value: students.length,
        note: activeStudents.length === students.length ? 'All active' : activeStudents.length + ' active' },
      { label: 'Student groups', value: groups.length },
      { label: 'Active access records', value: live.length },
      { label: 'Approved licences', value: alloc.approved,
        note: live.length ? 'across ' + live.length + ' ' + util.plural(live.length, 'record') : 'no active access yet' },
      /* A LICENCE SUM, NOT A STUDENT COUNT. `tenantAllocation` adds the
         per-record `assigned` figures together, so a student entitled
         under two access records is counted twice — correctly, because
         they hold two licences. Labelling it "Assigned students" made it
         a student count, and it then contradicted both the student
         figures beside it and the Super Admin's institution report.
         `alloc.uniqueLicenceHolders` is the distinct-people answer. */
      { label: 'Licences assigned', value: alloc.assigned,
        note: alloc.uniqueLicenceHolders + ' distinct ' +
          util.plural(alloc.uniqueLicenceHolders, 'student') + ' holding one' },
      { label: 'Remaining allocation', value: alloc.remaining,
        tone: alloc.approved > 0 && alloc.remaining === 0 ? 'warn' : '' },
      /* EFFECTIVE ENTITLEMENT, from the one function the whole platform
         answers this question with. It is NOT the allocation roll-up:
         `tenantAllocation()` counts who HOLDS A LICENCE, which is a fact
         about allocation and must survive a deactivation untouched —
         which is exactly why reading it here made the Overview contradict
         itself, showing "Entitled students 1" beside "N active students
         with no entitlement" (that second figure already came from
         `entitledStudentIds()`), while the Super Admin and Content access
         screens both correctly showed nobody entitled.

         ASSIGNED ≠ EFFECTIVELY ENTITLED. The tile above reports the
         stored allocation and is deliberately left alone; this one
         reports what is true for a learner right now. */
      { label: 'Entitled students', value: entitled.length,
        note: tenantActive
          ? 'hold at least one experiment'
          : 'none while the institution is deactivated — access grants are kept' }
    ]);

    /* Attention — every row is a real state of this institution.
       No revenue, completion, assessment or support analytics: none of
       those exist yet, and inventing them would be fiction. */
    var items = [];
    var noAccess = state.accessWithoutAssignments(tenant.id);
    if (noAccess.length) {
      items.push({
        tone: 'warn', icon: 'layers',
        title: noAccess.length + ' active content ' + util.plural(noAccess.length, 'access record') + ' not yet reaching any student',
        body: 'Holding approved content does not entitle anyone. ' + esc(noAccess.map(function (a) { return a.id; }).join(', ')) +
          ' ' + (noAccess.length === 1 ? 'has' : 'have') + ' no access grant on it.',
        href: T.href.newAssignment(tenant.id), label: 'Give students access'
      });
    }
    var unassigned = state.unassignedStudents(tenant.id);
    if (unassigned.length && live.length) {
      items.push({
        tone: 'info', icon: 'users',
        title: unassigned.length + ' active ' + util.plural(unassigned.length, 'student') + ' with no entitlement',
        /* "No effective entitlement" is not the same as "never granted
           anything". A student can hold an access grant and still have no
           entitlement — held beyond the approved quantity, or on an
           expired record. Saying they were never given anything sent the
           Tenant Admin to create a grant that already existed. */
        body: 'These active students hold no effective entitlement. Most have not been given an experiment ' +
          'yet; a student who already has an access grant can also appear here if the record is out of ' +
          'licences or its term has ended.',
        href: T.href.people(tenant.id), label: 'Open People'
      });
    }
    var unmapped = state.coursesWithoutMapping(tenant.id);
    if (unmapped.length) {
      items.push({
        tone: 'info', icon: 'doc',
        title: unmapped.length + ' ' + util.plural(unmapped.length, 'course') + ' without a local course code',
        body: unmapped.map(function (cid) { var c = data.course(cid); return c ? c.name : cid; }).join(', ') +
          ' — the canonical course name is unchanged; only the institution-local code is missing.',
        href: T.href.mappings(tenant.id), label: 'Open academic mappings'
      });
    }
    /* Records the institution holds that cannot be granted from. This is
       the bridge that stops Overview and Student access ever disagreeing
       silently: if a record is counted here but cannot be granted from,
       the Overview says so and links to the record. */
    var blockedAccess = state.unassignableAccessForTenant(tenant.id);
    if (blockedAccess.length) {
      items.push({
        tone: 'warn', icon: 'alert',
        title: blockedAccess.length + ' access ' + util.plural(blockedAccess.length, 'record') +
          ' cannot be granted from',
        body: blockedAccess.map(function (b) {
          return esc(b.record.id) + ' — ' + esc(state.assignabilityText(b.reason));
        }).join('; ') + '. The record is still listed under Content access; only giving students access is ' +
          'unavailable.',
        href: T.href.access(tenant.id), label: 'Open content access'
      });
    }
    /* Implementation 06 — the SAME derivation the Super Admin's
       operational list uses (`expiryReminderDue`), so the two surfaces
       can never disagree about which records are due. Inclusive at
       exactly 15 days; a record already past its end instant is expired,
       not "due". */
    var expiring = state.tenantAccessNeedingExpiryReminder(tenant.id);
    if (expiring.length) {
      items.push({
        tone: 'warn', icon: 'clock',
        title: expiring.length + ' access ' + util.plural(expiring.length, 'record') +
          ' expiring within 15 days — renewal attention',
        body: expiring.map(function (a) {
          var d = state.accessDaysUntilExpiry(a);
          return esc(a.id) + ' — ' + d + ' ' + util.plural(d, 'day') + ' remaining, ends ' +
            esc(util.fmtDate(a.endsOn));
        }).join('; ') + '. Entitlement derived from an expired record stops being effective. ' +
          'There is no automatic renewal, payment or extension.',
        /* Implementation 07.2 — the renewal entry point sits ON the row
           that tells the institution its term is ending, because that is
           where a Tenant Admin is when they need it. It offers the ONE
           renewal path; it does not extend anything itself. */
        extraHTML: renewalPanelsHTML(tenant, expiring),
        href: T.href.access(tenant.id), label: 'Open content access'
      });
    }
    var expiredRecs = state.expiredAccessForTenant(tenant.id);
    if (expiredRecs.length) {
      items.push({
        tone: 'warn', icon: 'alertCirc',
        title: expiredRecs.length + ' access ' + util.plural(expiredRecs.length, 'record') + ' has expired',
        body: expiredRecs.map(function (a) {
          return esc(a.id) + ' — ended ' + esc(util.fmtDate(a.endsOn));
        }).join('; ') + '. Nothing has been deleted: the record, its access grants and every student&rsquo;s ' +
          'progress are kept, but entitlement derived from it is no longer effective.',
        /* An expired record is the case renewal exists for, so the same
           entry point is offered here. A renewed record keeps its own
           identifier, which is why every assignment and every student&rsquo;s
           progress on it comes back with the term rather than needing to
           be rebuilt. */
        extraHTML: renewalPanelsHTML(tenant, expiredRecs),
        href: T.href.access(tenant.id), label: 'Open content access'
      });
    }
    var openTickets = state.ticketsForTenant(tenant.id).filter(function (x) {
      return x.status === state.SUPPORT_STATUS.OPEN;
    });
    if (openTickets.length) {
      items.push({
        tone: 'info', icon: 'alertCirc',
        title: openTickets.length + ' technical ' + util.plural(openTickets.length, 'issue') +
          ' reported from this institution',
        body: openTickets.map(function (t) { return esc(t.subject); }).join('; ') +
          '. The platform team resolves reported issues; the outcome appears on the reporter&rsquo;s own Help page.',
        href: XRSLP.supportUI.href.tenant(tenant.id), label: 'Open Help'
      });
    }
    /* A submitted written answer whose Experiment has no mapped Faculty
       member has no evaluator, and STK31-31 makes Faculty the only human
       evaluator there is. The Student is still being told their answer
       is with their faculty, so this has to be visible to the one role
       that can fix it — by mapping a Faculty member again. Only the
       mapping fact appears; the responses themselves stay inside the
       Faculty review queue where they belong. */
    var orphanReviews = state.pendingReviewsWithoutEvaluator(tenant.id);
    if (orphanReviews.length) {
      items.push({
        tone: 'warn', icon: 'alert',
        title: orphanReviews.length + ' submitted written ' + util.plural(orphanReviews.length, 'response') +
          ' with no mapped Faculty evaluator',
        body: 'Those students are waiting at <em>Pending Faculty review</em> and cannot complete the experiment. ' +
          'Nothing has been lost — mapping a Faculty member to that content puts the responses straight back ' +
          'into their review queue.',
        href: T.href.facultyMap(tenant.id), label: 'Open Faculty mapping'
      });
    }
    if (alloc.over > 0) {
      items.push({
        tone: 'warn', icon: 'alert',
        title: alloc.over + ' ' + util.plural(alloc.over, 'student') + ' held beyond the approved allocation',
        body: 'They hold an access grant but no effective entitlement, because the record has no licence left for ' +
          'them. It happens when more students are given content than the approved quantity covers, when a member ' +
          'joins a group that already has access, or when a deactivated student is reactivated after their licence ' +
          'was taken. Nobody who is currently entitled is ever displaced &mdash; a held student waits behind them.',
        href: T.href.access(tenant.id), label: 'Review allocation'
      });
    }

    var attention = items.length
      ? '<ul class="attn">' + items.map(function (it) {
          return '<li class="at-row ' + it.tone + '"><span class="at-ic">' + ui.ic(it.icon) + '</span>' +
            '<div class="at-body"><div class="at-t">' + esc(it.title) + '</div>' +
            /* `extraHTML` is markup this file just built — the renewal
               block. It sits OUTSIDE the paragraph because it contains
               block-level elements of its own. */
            '<p>' + it.body + '</p>' + (it.extraHTML || '') + '</div>' +
            '<a class="btn sm sec" href="' + it.href + '">' + esc(it.label) + '</a></li>';
        }).join('') + '</ul>'
      /* The body must only claim what was actually checked. The
         "students with no entitlement" row is deliberately suppressed
         while the institution holds no live access record — there is
         nothing to assign, so listing every student as unassigned would
         be noise — but the empty state then asserted that no student
         lacks an entitlement, which was untrue of exactly that state. */
      : ui.emptyState({
          icon: 'check', heading: 'h3',
          title: 'Nothing needs attention',
          body: live.length
            ? 'No unmapped courses, no unreached content and no active student left without an entitlement.'
            : 'This institution holds no active content access yet, so there is nothing to map, and nobody ' +
              'can be given anything. ' +
              'Content reaches an institution only through an approved institutional access request.'
        });

    /* ---------- R06 · the learning half of the overview ---------- */
    var learn = learningRollup(tenant);

    /* The two altitudes are kept visually apart because they answer
       different questions and are counted differently: one row per
       STUDENT, and one row per STUDENT × EXPERIMENT. Presenting them in
       a single grid is how "12 in progress" starts being read as twelve
       people when it is twelve experiments. */
    var learningStudentStats = T.statGrid([
      { label: 'Students with access', value: learn.students,
        note: learn.students ? 'hold at least one experiment they can open' : 'nobody is entitled yet' },
      { label: 'Started', value: learn.started, note: 'opened at least one experiment' },
      { label: 'Not started', value: learn.notStartedStudents,
        tone: learn.students && learn.notStartedStudents === learn.students ? 'warn' : '',
        note: 'have access but no recorded activity yet' },
      { label: 'Finished everything they hold', value: learn.allComplete }
    ]);
    var learningWorkStats = T.statGrid([
      { label: 'Experiments given to students', value: learn.pairs,
        note: 'counted once per student per experiment' },
      { label: 'Not started', value: learn.notStarted },
      { label: 'In progress', value: learn.inProgress },
      { label: 'Awaiting Faculty review', value: learn.awaitingReview,
        tone: learn.awaitingReview ? 'warn' : '',
        note: learn.awaitingReview ? 'a written answer is with the mapped Faculty member' : '' },
      { label: 'Evaluated, result not released', value: learn.awaitingRelease,
        note: learn.awaitingRelease ? 'the outcome is not shown here or to the student yet' : '' },
      { label: 'Completed', value: learn.completed }
    ]);

    /* Where the institution's students actually are, by Course. The
       per-EXPERIMENT breakdown is on Content access, where it sits with
       the search and filters that make ~50 experiments navigable — an
       overview that grew a fifty-row table would stop being an overview. */
    var courseTable = learn.courseOrder.length
      ? '<div class="tscroll"><table class="dt">' +
        '<caption class="sr-only">Student progress by Course across ' + esc(tenant.name) + '</caption>' +
        '<thead><tr><th scope="col">Programme</th><th scope="col">Course</th>' +
        '<th scope="col">Experiments</th><th scope="col">Students with access</th>' +
        '<th scope="col">Not started</th><th scope="col">In progress</th>' +
        '<th scope="col">Awaiting Faculty review</th><th scope="col">Completed</th></tr></thead><tbody>' +
        learn.courseOrder.map(function (c) {
          return '<tr>' +
            '<td data-label="Programme">' + esc(c.groupingName) + '</td>' +
            '<td data-label="Course"><span class="tmain">' + esc(c.name) + '</span></td>' +
            '<td data-label="Experiments" class="num">' + c.experimentCount + '</td>' +
            '<td data-label="Students with access" class="num">' + c.students + '</td>' +
            '<td data-label="Not started" class="num">' + c.notStarted + '</td>' +
            '<td data-label="In progress" class="num">' + c.inProgress + '</td>' +
            '<td data-label="Awaiting Faculty review" class="num">' + c.awaitingReview + '</td>' +
            '<td data-label="Completed" class="num">' + c.completed + '</td>' +
            '</tr>';
        }).join('') + '</tbody></table></div>' +
        '<p class="cardfoot"><strong>Students with access</strong> counts a person once per Course. The four ' +
        'state columns count one <strong>student and experiment</strong> at a time, so a student taking three ' +
        'experiments in a Course appears three times across them. Anything evaluated but not yet released is ' +
        'held out of <em>Completed</em> &mdash; it is in the tile above instead.</p>'
      : '';

    var learningBody;
    if (!tenantActive) {
      /* A deactivated institution has no effective entitlement at all,
         so every figure would be a truthful zero that reads as a false
         claim about the learning that happened. Say what is actually
         true instead of printing zeros. */
      learningBody = ui.emptyState({
        icon: 'alertCirc', heading: 'h3',
        title: 'Learning figures are unavailable while the institution is deactivated',
        body: 'No student holds effective entitlement right now, so there is nothing to report against. ' +
          'Every learning record — resources opened, simulations run, assessment attempts and Faculty ' +
          'reviews — is preserved exactly as it stands and reappears when the institution is reactivated.'
      });
    } else if (!learn.students) {
      learningBody = ui.emptyState({
        icon: 'flask', heading: 'h3',
        title: 'No student holds content yet',
        body: live.length
          ? 'This institution holds approved content, but no student has been given any of it, so there is no ' +
            'learning to report. Holding access and giving a student access are two different things.'
          : 'Content reaches an institution only through an approved institutional access request, and this ' +
            'institution holds none that is active.',
        actionsHTML: (live.length && T.canWrite(tenant))
          ? '<a class="btn pri sm" href="' + T.href.newAssignment(tenant.id) + '">Give students access</a>' : ''
      });
    } else {
      learningBody =
        '<h3 class="subh">Students</h3>' + learningStudentStats +
        '<h3 class="subh" style="margin-top:18px">Experiments students hold</h3>' + learningWorkStats +
        (courseTable ? '<h3 class="subh" style="margin-top:18px">By Course</h3>' + courseTable : '') +
        '<p class="cardfoot">Every figure here is counted from real learning records for the students who hold ' +
        'effective entitlement — nothing is estimated. <strong>No mark, score or pass rate appears anywhere on ' +
        'this page.</strong> Faculty are the only evaluators, and a result they have finished but whose release ' +
        'the assessment still holds is deliberately reported as <em>evaluated, result not released</em> so that ' +
        'it cannot be inferred from here. ' +
        /* ⚠ STATED RATHER THAN OVERCLAIMED — 07.3 adversarial fix. The
           earlier wording said no individual result appears at all, but
           "Completed" is only reachable through a PASSED assessment, so
           in a released, small cohort the count does carry an individual
           outcome. The withheld case is correctly masked; this sentence
           now describes what the released case actually shows. */
        '<em>Completed</em> counts a student who has finished everything including a <strong>released</strong> ' +
        'assessment pass, so in a very small cohort it can imply one student&rsquo;s released outcome. A result ' +
        'the assessment is still withholding is never counted there. ' +
        '<a href="' + T.href.access(tenant.id) + '">Content access</a> carries the same breakdown per ' +
        'experiment, with search and filters.</p>';
    }

    var noAccessYet = !state.accessForTenant(tenant.id).length;
    var awaitingPayment = state.tenantAwaitingActivation(tenant.id);
    var admins = state.tenantAdminsFor(tenant.id);

    var html =
      ui.phead('Overview', esc(tenant.name) + ' · ' + esc(tenant.accessContext)) +
      '<div class="stack">' +
      (noAccessYet ? ui.alertBox('info',
        awaitingPayment ? 'No content access yet — awaiting payment' : 'No content access activated yet',
        '<p>' + esc(tenant.name) + ' holds no approved content. People, groups and academic mappings can be ' +
        'prepared now, but no student can be given an experiment until ' +
        (awaitingPayment
          ? 'payment completes on approved request <strong>' + esc(awaitingPayment.id) + '</strong>.'
          : 'the Super Admin approves an institutional access request' +
            (tenant.kind === 'external' ? ' and payment completes' : '') + '.') +
        '</p>') : '') +
      ui.card('Institution at a glance', stats, null, 'h2') +
      ui.card('Needs attention', attention, null, 'h2') +
      /* R06 — the learning half. It sits directly under the provisioning
         figures because the Tenant Admin is the institution's point of
         contact for both, and separating them across screens is what
         made this workspace look like a licence console. */
      ui.card('Learning across the institution', learningBody,
        /* ⚠ `pairs` IS STUDENT × EXPERIMENT, NOT EXPERIMENTS — 07.3
           adversarial fix. Printed under the bare noun "experiments" it
           multiplied the institution's real experiment count by its
           student count: at the stakeholder's stated scale (~50
           experiments, a few hundred students) the header would have
           claimed thousands. It also contradicted the tile directly
           beneath it and the Content access header for the same
           institution at the same moment. */
        tenantActive && learn.students
          ? learn.students + ' ' + util.plural(learn.students, 'student') + ' · ' +
            learn.pairs + ' student ' + util.plural(learn.pairs, 'entitlement')
          : null,
        'h2') +
      /* Implementation 06 — the honest in-product representation of the
         confirmed 15-day reminder. It appears only when a reminder is
         actually due, and it never claims a message was sent. */
      (expiring.length
        ? ui.gapNote('DELIVERY CHANNEL PENDING',
            'Your institution must receive an expiry reminder <strong>15 days before</strong> the access term ' +
            'ends. That requirement is confirmed; the <strong>delivery channel is not</strong>, so this build ' +
            'represents the reminder as the attention state above and on the platform&rsquo;s own operations ' +
            'list. <strong>No email, SMS, push or notification of any kind has been sent</strong>, and no ' +
            'provider is integrated. Access does not renew automatically, and nothing is charged.')
        : '') +
      /* ⚠ THIS NOTE WAS REWRITTEN, NOT DELETED. Implementation 07.3 built
         the institution-level PROGRESS view above, so the old claim that
         "institution-wide reporting … is not built on this plane" became
         false and had to go. What genuinely remains absent is narrower
         and is still declared: OUTCOME reporting, time-on-task and
         export. Two of those three are deliberate refusals rather than
         unfinished work, and the note says which is which. */
      ui.gapNote('DELIBERATELY NOT SHOWN · NOT IN THIS BUILD',
        '<strong>Assessment outcomes are deliberately not reported here.</strong> Marks, scores, pass rates and ' +
        'individual results belong to the Faculty member who evaluated them (STK31-31) and to the student ' +
        'themselves; an institution-level pass rate would also make a single student&rsquo;s withheld result ' +
        'inferable in a small cohort. Faculty see progress and results for the content mapped to them under ' +
        '<strong>Student Progress</strong> in their own workspace.' +
        '<br><br><strong>Time spent, engagement analytics and any export of the figures above are not built.</strong> ' +
        'No source settles what should be measured or who may download it, so nothing is invented. There is no ' +
        'revenue, cost or commercial reporting anywhere in this build.') +
      /* Who the platform recorded as responsible for this institution.
         Super Admin assigns it (STK31-21); the Tenant Admin cannot. */
      ui.card('Institution administration',
        (admins.length
          ? '<ul class="reslist plain">' + admins.map(function (a) {
              return '<li>' + ui.ic('users') + '<span><strong>' + esc(a.name) + '</strong> ' +
                '<span class="muted">· ' + esc(a.email) + '</span></span></li>';
            }).join('') + '</ul>'
          : '<p class="muted">No Tenant Admin has been assigned to this institution yet.</p>') +
        '<p class="cardfoot">The Super Admin assigns the Institute / Tenant Admin. It cannot be changed from ' +
        'inside the institution, and this institution&rsquo;s administrators can never act for another one.</p>',
        null, 'h2') +
      '</div>';

    return {
      title: 'Overview — ' + tenant.name, html: html, tenant: tenant, navKey: 'overview',
      /* The renewal control the two expiry attention rows may render.
         `bindRenewal` finds nothing and does nothing when neither row
         is present, so this is unconditional. */
      after: bindRenewal
    };
  };

  /* ---------------- CONTENT ACCESS ----------------
     R05 — this screen is the institution's CONTENT LIBRARY.

     It used to be a stack of access-record panels, each listing every
     approved experiment flat. At the stakeholder's own scale — ~50
     experiments across Civil, Mechanical and Pharmaceutical — that is
     unreadable, and it was the only place the institution's content
     could be seen at all. So the screen now leads with one searchable,
     filterable table organised Programme → Course → Experiment, and the
     record panels below it summarise their content BY PROGRAMME instead
     of repeating all fifty rows a second time.
     ============================================================ */

  /* The library filter. Module-level so it survives the re-render that
     applies it, exactly like the People directory filter. */
  var lib = { q: '', grouping: 'all', course: 'all', tech: 'all', record: 'all' };
  function libIsFiltered() {
    return !!lib.q || lib.grouping !== 'all' || lib.course !== 'all' ||
      lib.tech !== 'all' || lib.record !== 'all';
  }
  function resetLib() { lib = { q: '', grouping: 'all', course: 'all', tech: 'all', record: 'all' }; }

  /* WHERE THE STUDENTS WHO HOLD ONE EXPERIMENT ACTUALLY ARE.

     Same derivation as the Overview roll-up and, underneath it, the same
     `experimentProgress()` the Student and Faculty screens read — so the
     per-experiment column here and the per-Course table there can never
     disagree. `studentView: true` for the same reason it is used there:
     an evaluated-but-unreleased result must not become inferable from a
     column of counts. */
  function experimentLearning(accessId, experimentId) {
    var TP = state.TECH_PROGRESS;
    var out = { students: 0, notStarted: 0, inProgress: 0, awaitingReview: 0, awaitingRelease: 0, completed: 0 };
    state.entitledStudentsFor(accessId, experimentId).forEach(function (pid) {
      out.students += 1;
      var techs = state.studentEntitledTechnologies(pid, experimentId);
      var prog = state.experimentProgress(pid, experimentId, techs, { studentView: true });
      if (prog.status === TP.COMPLETED) { out.completed += 1; }
      else if (prog.status === TP.RESULT_WITHHELD) { out.awaitingRelease += 1; }
      else if (prog.status === TP.PENDING_REVIEW) { out.awaitingReview += 1; }
      else if (prog.status === TP.IN_PROGRESS) { out.inProgress += 1; }
      else { out.notStarted += 1; }
    });
    return out;
  }

  /* Non-zero states only, one short line each. A cell of five numbers
     that are mostly zero is noise; the total sits in its own column
     beside it, so nothing is lost by omitting the zeros. */
  function learningCellHTML(l) {
    if (!l.students) { return '<span class="muted">No student holds this yet</span>'; }
    var lines = [];
    if (l.completed) { lines.push(l.completed + ' completed'); }
    if (l.awaitingReview) { lines.push(l.awaitingReview + ' awaiting Faculty review'); }
    if (l.awaitingRelease) { lines.push(l.awaitingRelease + ' evaluated, not released'); }
    if (l.inProgress) { lines.push(l.inProgress + ' in progress'); }
    if (l.notStarted) { lines.push(l.notStarted + ' not started'); }
    return lines.map(function (t) { return '<span class="tsub2">' + esc(t) + '</span>'; }).join('');
  }

  XRSLP.screens.tenantContentAccess = function (params) {
    var r = T.requireTenant(params, 'content-access');
    if (!r.tenant) { return r.fail; }
    var tenant = r.tenant;

    var records = state.accessForTenant(tenant.id).slice().reverse();

    /* ---- the library: every approved experiment, once per record ----
       An experiment approved on TWO records is two rows on purpose. The
       licences, the term and the technologies all belong to the record,
       so collapsing them would have to invent a combined figure that
       exists nowhere in the state layer. */
    var libItems = [];
    records.forEach(function (rec) {
      (rec.items || []).forEach(function (item) {
        libItems.push({ experimentId: item.experimentId, technologies: item.technologies, rec: rec });
      });
    });
    var allRows = T.contentRows(libItems);

    /* Filter options are built from what this institution ACTUALLY
       holds. A filter offering a Programme with no content behind it is
       a dead control. */
    var progSeen = {}, progOpts = [], techSeen = {}, recSeen = {};
    allRows.forEach(function (row) {
      if (!progSeen[row.groupingId]) { progSeen[row.groupingId] = true; progOpts.push({ id: row.groupingId, name: row.groupingName }); }
      row.technologies.forEach(function (t) { techSeen[t] = true; });
      /* Which access records this institution's own rows actually
         belong to — see the stale-filter note below. */
      recSeen[row.item.rec.id] = true;
    });
    var techOpts = data.sortTech(Object.keys(techSeen));
    if (lib.grouping !== 'all' && !progSeen[lib.grouping]) { lib.grouping = 'all'; }
    /* ⚠ VALIDATE AGAINST THIS TENANT'S ROWS, NOT THE WHOLE PLATFORM —
       07.3 adversarial fix.

       This previously asked `state.accessById(lib.record)`, which
       searches `S.access` GLOBALLY with no tenant check. `lib` is
       module-level and survives navigation, so after filtering by an
       access record on one institution and switching to another with the
       prototype's Tenant Admin selector, the stale id still resolved —
       the guard passed, the select (whose options ARE tenant-scoped)
       matched nothing and displayed "All access records", and the row
       filter below then removed every row. The screen showed "No
       experiment matches these filters" over an institution that holds
       approved content, under a control claiming no filter was applied.

       The two sibling guards were already correct; only this one reached
       outside the tenant. `recSeen` is built from this institution's own
       rows, exactly as `js/screens/tenant-assign.js` does for its list. */
    if (lib.record !== 'all' && !recSeen[lib.record]) { lib.record = 'all'; }
    if (lib.tech !== 'all' && !techSeen[lib.tech]) { lib.tech = 'all'; }

    /* Courses follow the chosen Programme, so the two selects can never
       describe a combination that has nothing in it. */
    var courseSeen = {}, courseOpts = [];
    allRows.forEach(function (row) {
      if (lib.grouping !== 'all' && row.groupingId !== lib.grouping) { return; }
      if (!courseSeen[row.courseId]) { courseSeen[row.courseId] = true; courseOpts.push({ id: row.courseId, name: row.courseName }); }
    });
    if (lib.course !== 'all' && !courseSeen[lib.course]) { lib.course = 'all'; }

    var shownRows = allRows.filter(function (row) {
      if (lib.record !== 'all' && row.item.rec.id !== lib.record) { return false; }
      return T.contentMatches(row, lib);
    });

    /* One allocation read per record, not one per row. */
    var allocCache = {};
    function allocFor(id) {
      if (!allocCache[id]) { allocCache[id] = state.accessAllocation(id); }
      return allocCache[id];
    }

    function selectHTML(id, label, value, options, allLabel) {
      return '<div class="fb-sel"><label class="fb-label" for="' + id + '">' + esc(label) + '</label>' +
        '<select id="' + id + '">' +
        '<option value="all"' + (value === 'all' ? ' selected' : '') + '>' + esc(allLabel) + '</option>' +
        options.map(function (o) {
          return '<option value="' + esc(o.id) + '"' + (value === o.id ? ' selected' : '') + '>' +
            esc(o.name) + '</option>';
        }).join('') + '</select></div>';
    }

    var filterBar =
      '<div class="filterbar">' +
      '<div class="fb-row">' +
      '<div class="fb-search"><label class="fb-label" for="lib-q">Search experiments</label>' +
      '<div class="searchbox">' + ui.ic('search') +
      '<input type="text" id="lib-q" placeholder="Experiment, course or programme" value="' + esc(lib.q) + '"></div></div>' +
      selectHTML('lib-prog', 'Programme / department', lib.grouping, progOpts, 'All programmes') +
      selectHTML('lib-course', 'Course', lib.course, courseOpts, 'All courses') +
      selectHTML('lib-tech', 'Technology', lib.tech, techOpts.map(function (t) {
        var def = data.TECHNOLOGIES[t];
        return { id: t, name: def ? def.name : t };
      }), 'All technologies') +
      selectHTML('lib-rec', 'Access record', lib.record, records.map(function (rec) {
        return { id: rec.id, name: rec.id + ' — ' + rec.items.length + ' ' + util.plural(rec.items.length, 'experiment') };
      }), 'All access records') +
      '</div>' +
      '<div class="fb-foot"><span class="fb-count">' + shownRows.length + ' of ' + allRows.length + ' ' +
      util.plural(allRows.length, 'experiment') + ' shown' +
      (records.length > 1 ? ' · across ' + records.length + ' access records' : '') + '</span>' +
      (libIsFiltered() ? '<button class="btn sm sec fb-clear" type="button" id="lib-clear">Clear filters</button>' : '') +
      '</div></div>';

    var libraryTable = shownRows.length
      ? '<div class="tscroll"><table class="dt">' +
        '<caption class="sr-only">Experiments ' + esc(tenant.name) + ' is approved to use</caption>' +
        '<thead><tr><th scope="col">Experiment</th><th scope="col">Technologies granted</th>' +
        '<th scope="col">Access record</th><th scope="col">Licences on that record</th>' +
        '<th scope="col">Students with access</th><th scope="col">Where those students are</th></tr></thead><tbody>' +
        shownRows.map(function (row) {
          var rec = row.item.rec;
          var alloc = allocFor(rec.id);
          var l = experimentLearning(rec.id, row.experimentId);
          return '<tr>' +
            '<td data-label="Experiment"><span class="tmain">' + esc(row.name) + '</span>' +
            '<span class="tsub">' + esc(row.groupingName) + ' › ' + esc(row.courseName) + '</span></td>' +
            '<td data-label="Technologies granted">' + ui.techBadges(row.technologies) + '</td>' +
            '<td data-label="Access record"><span class="mono">' + esc(rec.id) + '</span>' +
            '<span class="tsub">' + esc(state.accessTermState(rec).key === 'expired' ? 'Term expired' : 'Term active') +
            '</span></td>' +
            /* The allocation belongs to the RECORD, not to this row —
               said plainly rather than left to be assumed, because a
               reader who takes it as per-experiment will over-count the
               institution's licences several times over. */
            '<td data-label="Licences on that record"><span class="tsub2">' + alloc.approved + ' approved</span>' +
            '<span class="tsub2">' + alloc.assigned + ' assigned</span>' +
            '<span class="tsub2">' + alloc.remaining + ' remaining</span></td>' +
            '<td data-label="Students with access" class="num">' + l.students + '</td>' +
            '<td data-label="Where those students are">' + learningCellHTML(l) + '</td>' +
            '</tr>';
        }).join('') + '</tbody></table></div>' +
        '<p class="cardfoot">Licence figures are <strong>per access record</strong>, shared by every experiment ' +
        'on it — a student counts once against a record however many of its experiments they hold, so these ' +
        'three numbers repeat down the column rather than adding up. <strong>Students with access</strong> is ' +
        'effective entitlement, not a licence count. No mark or result is shown here.</p>'
      : ui.emptyState({
          icon: 'search', heading: 'h3',
          title: 'No experiment matches these filters',
          /* `ui.emptyState` ESCAPES `body`, so an entity here renders as
             the literal text "institution&rsquo;s". Use the character. */
          body: 'Nothing in this institution’s approved content matches the current search and filters.',
          actionsHTML: '<button class="btn sec sm" type="button" id="lib-clear-empty">Clear filters</button>'
        });

    var body;
    if (!records.length) {
      body = '<div class="tablecard">' + ui.emptyState({
        icon: 'layers',
        title: 'No active content yet',
        body: 'Approved content appears here once an institutional access request for ' + tenant.name +
          ' is approved and activated by the platform.'
      }) + '</div>';
    } else {
      body = '<div class="stack">' +
        ui.card('Content library', filterBar + libraryTable,
          allRows.length + ' ' + util.plural(allRows.length, 'experiment'), 'h2') +
        records.map(function (rec) {
        var termDef = data.term(rec.term);
        var termState = state.accessTermState(rec);
        var alloc = state.accessAllocation(rec.id);

        /* R05 — the record's content BY PROGRAMME, not fifty flat rows.
           Every experiment is still reachable: the library above lists
           them all, and the button on each Programme row filters it down
           to exactly this record and this Programme. */
        var groups = T.groupContent(rec.items);
        var covers = groups.map(function (g) {
          var entitledHere = 0;
          g.courseOrder.forEach(function (c) {
            c.rows.forEach(function (row) {
              entitledHere += state.entitledStudentsFor(rec.id, row.experimentId).length;
            });
          });
          return '<div class="cvrow"><span class="cv-ic">' + ui.ic('layers') + '</span>' +
            '<div class="cv-body">' +
            '<div class="cv-ctx">Programme / department</div>' +
            '<div class="cv-t">' + esc(g.name) + '</div>' +
            '<div class="cv-ent">' + g.courseOrder.length + ' ' + util.plural(g.courseOrder.length, 'course') +
            ' · ' + g.count + ' ' + util.plural(g.count, 'experiment') + '</div>' +
            '<div class="cv-ent">' + g.courseOrder.map(function (c) {
              return esc(c.name) + ' <span class="tabular">(' + c.rows.length + ')</span>';
            }).join(' · ') + '</div>' +
            '<div class="cv-ent tabular">' + entitledHere + ' student ' +
            util.plural(entitledHere, 'entitlement') + ' across this programme</div>' +
            '<div style="margin-top:8px"><button class="btn sm sec" type="button" ' +
            'data-lib-rec="' + esc(rec.id) + '" data-lib-prog="' + esc(g.id) + '">' + ui.ic('search') +
            'Show in the content library<span class="sr-only"> — ' + esc(g.name) + ' on access record ' +
            esc(rec.id) + '</span></button></div>' +
            '</div>' +
            '<div class="cv-tech">' + ui.techBadges(g.technologies) + '</div></div>';
        }).join('');

        var blockedReason = state.accessAssignability(rec, tenant.id);
        return '<section class="accessrec" aria-label="Access record ' + esc(rec.id) + '">' +
          '<div class="ar-head"><h2>Access record ' + esc(rec.id) + '</h2>' +
          '<span class="ar-ref">from request ' + esc(rec.requestId) + '</span>' +
          '<div class="ar-badges">' + ui.badge('b-outline', null, rec.accessContext) + ui.termBadge(termState) + '</div>' +
          '</div>' +
          '<div class="ar-body">' +
          T.allocMeter(alloc, {
            noteHTML: 'A student counts <strong>once</strong> against this record however many of its experiments they receive. ' +
              'Giving a student a second experiment on the same record consumes no further licence.'
          }) +
          '<div class="kv" style="margin:14px 0">' +
          '<div class="k">Access term</div><div class="v">' + esc(termDef ? termDef.label : rec.term) +
          (rec.endsOn ? ' — until ' + esc(util.fmtDate(rec.endsOn)) : '') + '</div>' +
          '<div class="k">Activated</div><div class="v">' + esc(util.fmtDate(rec.startsOn)) + '</div>' +
          '<div class="k">Granted by</div><div class="v">' + esc(rec.recordedBy) + '</div>' +
          '</div>' +
          '<h3 class="subh">Approved content by Programme / department</h3>' +
          '<div class="covers">' + covers + '</div>' +
          (!blockedReason ?
            '<div class="ar-act"><a class="btn sm pri" href="' + T.href.newAssignment(tenant.id) + '">' +
            ui.ic('plus') + 'Give students access</a>' +
            '<a class="btn sm sec" href="' + T.href.assignments(tenant.id) + '">View student access</a></div>' :
            '<div style="margin-top:14px">' + ui.alertBox('warning',
              blockedReason === 'expired' ? 'This access record has expired' : 'No student can be given content from this record',
              '<p>Nobody can be given content from it because ' + esc(state.assignabilityText(blockedReason)) + '. ' +
              (blockedReason === 'expired'
                ? 'Entitlement derived from it is no longer effective. Every access grant on it is retained for ' +
                  'traceability. Renewal is an explicit institutional action — nothing renews automatically — and ' +
                  'it is offered under <em>Renewal</em> directly below.'
                : 'The record is kept exactly as the Super Admin allocated it; only giving students access is ' +
                  'unavailable.') +
              '</p>') + '</div>') +
          /* Implementation 07.2 — the renewal entry point on the screen
             that shows what the institution actually holds. Every record
             gets it, expired or not: a term that is still running is
             exactly where an early renewal is raised, and the state layer
             adds the new term to whatever is left rather than discarding
             it. The route sentence is repeated per record on purpose —
             each record is read on its own here. */
          '<h3 class="subh">Renewal</h3>' +
          renewalRouteHTML(tenant) +
          renewalRecordHTML(rec) +
          '</div></section>';
      }).join('') + '</div>';
    }

    var html =
      ui.phead('Content access',
        'Content and technologies activated for ' + esc(tenant.name) + ' through approved institutional requests.') +
      /* R04 — the jargon defined where it is first met, rather than
         renamed. The reasoning is at the head of `accessRecordGlossHTML`. */
      '<div style="margin-bottom:16px">' +
      ui.alertBox('info', 'What this page holds — and what it does not give anybody',
        T.accessRecordGlossHTML() +
        '<p style="margin-top:8px">Everything below is what the Super Admin approved for this institution. ' +
        '<strong>Nobody can open any of it until a student is given access</strong> under ' +
        '<a href="' + T.href.assignments(tenant.id) + '">Student access</a>.</p>') +
      '</div>' +
      body +
      /* ONE declaration of what is genuinely unresolved about renewal.
         It is not decided here, in either direction: the build fails
         safe by mirroring the plan and offering no editing at all. */
      (records.length
        ? '<div style="margin-top:16px">' + ui.gapNote('RENEWAL PLAN CHANGES NOT SETTLED',
            'A renewal currently <strong>mirrors this institution&rsquo;s current plan exactly</strong> &mdash; the ' +
            'same experiments, the same technologies, the same licence quantity and the same term length &mdash; ' +
            'and none of it can be edited on the way through. That is because whether a renewal may ' +
            '<strong>change</strong> any of those is <strong>not settled</strong>, and it is left open here rather ' +
            'than decided by accident. In this build, more licences or different content reach an institution ' +
            'through an ordinary institutional access request, not through a renewal.') + '</div>'
        : '');

    return {
      title: 'Content access — ' + tenant.name,
      html: html,
      tenant: tenant,
      navKey: 'content-access',
      after: function () {
        bindRenewal();

        /* Every control re-renders and then puts focus back where it
           was, the way the People directory and the assignment builder
           already do — a filter that steals focus is unusable with a
           keyboard, and a search box that loses the caret is unusable
           with any input device. */
        function rerender(focusId, caret) {
          XRSLP.render(true);
          var el = document.getElementById(focusId);
          if (!el) { return; }
          el.focus();
          if (caret && el.setSelectionRange) { el.setSelectionRange(el.value.length, el.value.length); }
        }
        var q = document.getElementById('lib-q');
        if (q) {
          q.addEventListener('input', function () { lib.q = q.value; rerender('lib-q', true); });
        }
        [['lib-prog', 'grouping', true], ['lib-course', 'course', false],
         ['lib-tech', 'tech', false], ['lib-rec', 'record', false]].forEach(function (row) {
          var el = document.getElementById(row[0]);
          if (!el) { return; }
          el.addEventListener('change', function () {
            lib[row[1]] = el.value;
            /* Choosing a Programme drops a Course filter that belonged to
               a different Programme, rather than silently showing nothing. */
            if (row[2]) { lib.course = 'all'; }
            rerender(row[0], false);
          });
        });
        ['lib-clear', 'lib-clear-empty'].forEach(function (id) {
          var el = document.getElementById(id);
          if (!el) { return; }
          el.addEventListener('click', function () {
            resetLib();
            XRSLP.render(true);
            ui.announce('Content library filters cleared.');
            var again = document.getElementById('lib-q');
            if (again) { again.focus(); }
          });
        });
        /* The record panels' shortcut into the library. It only sets the
           filter this page already offers — it grants nothing, changes no
           record, and the announcement says exactly what it did. */
        Array.prototype.slice.call(document.querySelectorAll('[data-lib-rec]')).forEach(function (btn) {
          btn.addEventListener('click', function () {
            lib.record = btn.getAttribute('data-lib-rec');
            lib.grouping = btn.getAttribute('data-lib-prog') || 'all';
            lib.course = 'all';
            lib.q = '';
            /* A technology filter left from an earlier look would hide
               every experiment in the Programme just asked for, under a
               control announcing it had filtered TO that record. */
            lib.tech = 'all';
            XRSLP.render(true);
            var again = document.getElementById('lib-rec');
            if (again) { again.focus(); }
            ui.announce('Content library filtered to access record ' + lib.record +
              (lib.grouping !== 'all' ? ', programme ' + lib.grouping : '') +
              '. Other filters cleared.');
          });
        });
      }
    };
  };
})();
