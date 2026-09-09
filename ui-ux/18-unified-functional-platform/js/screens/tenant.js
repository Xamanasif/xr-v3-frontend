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

   ── IMPLEMENTATION 08 — WHAT THE PRESENTATION PASS CHANGED ────
   Behaviour, guards, authority boundaries and state transitions are
   untouched. What moved:

     · The Overview lost eighteen stat tiles across three grids and two
       dashed notes. Provisioning is one linked `ui.statStrip`; the
       licence trio is ONE `ui.metrics` line; the learning methodology and
       the privacy disclosure are folded into `ui.about`; an attention row
       is a title, one line and one link, and no longer hosts whole
       renewal panels.
     · Content access opens on data. The access-record definition, the
       licence-counting rule and the institution's renewal route are
       stated ONCE, folded, at the top — the route used to be re-emitted
       verbatim inside every record panel — and each record leads with
       what it covers, its term and its licence line, with the detail and
       the renewal control behind "Show details".
     · ONE canonical licence rendering (`allocMetrics`) replaced four.
     · The record actions carry their record: they call the prefill hooks
       `tenantAssignPrefill` / `tenantAssignListPrefill`, so "Give
       students access" on ACC-002 opens the builder on ACC-002.
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

  /* Provenance required by ND-04 — shown, never asserted as an
     authority. There is no ERP route in this slice.

     ⚠ `sourceBadge` (the `.prov` chip) is gone with the People
     directory's Source column. Provenance is a fact about ONE person and
     belongs on their record, where it still appears as "Record source";
     a chip repeated on every row of a directory of several hundred
     people was one more block per person on a phone and told the reader
     nothing they had asked for. `statGrid` went the same way when the
     Overview moved to `ui.statStrip` + `ui.metrics`; the Faculty and
     platform workspaces have their own. */
  function sourceLabel(source) { return state.SOURCE_META[source] || 'Unknown'; }

  /* The subtitle names the ROLE and then the institution's own reference.
     It used to print the reference alone and fall back to the role word
     only when there was no reference, which made "Faculty" look like an
     identifier — and it forced the People directory to carry a whole
     Role column repeating what the segmented tabs above it already said. */
  function personLink(tenantId, p) {
    var role = p.role === 'faculty' ? 'Faculty' : 'Student';
    var ref = p.role === 'faculty' ? p.facultyId : p.studentId;
    return '<a class="rowlink" href="' + href.person(tenantId, p.id) + '">' +
      '<span class="tmain">' + esc(p.name) + '</span>' +
      '<span class="tsub">' + esc(ref ? role + ' · ' + ref : role) + '</span></a>';
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

  /* ONE canonical rendering of Approved / Assigned / Remaining.

     The same three numbers were being drawn four different ways across
     this workspace — the big-number meter below, three stat tiles on the
     Overview, three stacked lines in a table cell and a key/value list on
     a blocked grant — so one fact read as four. `allocMeter` survives for
     the ONE place a PROPORTION is being judged (the access-grant builder,
     where the reader is about to spend licences and the bar carries
     meaning); every other surface uses this line.

     The end date rides along because "4 remaining" and "expires in six
     days" are read together or not at all. */
  function allocMetrics(alloc, rec, opts) {
    /* `opts.available` is the Overview's wording only. The deep access
       screens keep "remaining" — they were accepted as they stand. */
    opts = opts || {};
    var items = [
      { v: alloc.approved, k: 'approved' },
      { v: alloc.assigned, k: 'assigned' },
      { v: alloc.remaining, k: opts.available ? 'available' : 'remaining',
        tone: alloc.over > 0 ? 'bad' : (alloc.approved > 0 && alloc.remaining === 0) ? 'warn' : '' }
    ];
    if (rec && rec.endsOn) {
      var ts = state.accessTermState(rec);
      items.push({
        v: XRSLP.util.fmtDate(rec.endsOn),
        k: ts.key === 'expired' ? 'ended' : 'expires',
        tone: ts.key === 'expired' ? 'bad' : ts.key === 'expiring' ? 'warn' : ''
      });
    }
    if (alloc.over > 0) {
      items.push({ v: alloc.over, k: 'held beyond the allocation', tone: 'bad' });
    }
    return ui.metrics(items);
  }

  /* The licence-counting rule, stated in ONE place and reused. It used to
     appear three times on Content access alone, in three wordings. */
  var LICENCE_RULE = 'Licences belong to the approved content, not to an experiment. A student counts once ' +
    'against a record however many of its experiments they hold, so the same three figures apply to every ' +
    'experiment on it.';

  /* Same reasoning, for the rule two screens both need to state. */
  var FACULTY_LICENCE_RULE = 'The approved quantity is a student allocation. Mapping a ' +
    'Faculty member consumes none of it and entitles no student.';

  /* What a record COVERS, for use as its heading. An opaque identifier
     tells a reader nothing about which record they are looking at; the
     Programmes it covers do, and the identifier stays beside it. */
  function accessRecordTitle(rec) {
    var n = (rec.items || []).length;
    var names = groupContent(rec.items || []).map(function (g) { return g.name; });
    if (!names.length) { return 'No approved content'; }
    var label = names.length <= 2
      ? names.join(' · ')
      : names.slice(0, 2).join(' · ') + ' +' + (names.length - 2) + ' more';
    /* The experiment count is part of the heading, not a badge: two
       records covering the same Programme are otherwise indistinguishable
       until the reader reaches the identifier beside them. */
    return label + ' · ' + n + ' ' + XRSLP.util.plural(n, 'experiment');
  }

  /* ── HUMAN-READABLE ACCESS CONTEXT ───────────────────────────
     `ACC-001` is a reference, not a description. These two produce the
     words that should appear WHERE THE REFERENCE USED TO: what the
     access covers, and how long it runs. The identifier is still shown
     on every one of those surfaces — through `ui.accessRef` — but after
     the fact it identifies, not instead of it. */
  /* The four-tile dashboard grid, linked. `.statgrid`/`.stat` and
     `a.stat.statlink` are both already in the design system; this is the
     one place the tenant workspace builds them. */
  function statGrid(items) {
    return '<div class="statgrid">' + items.map(function (it) {
      var inner = '<div class="s-k">' + esc(it.label) + '</div>' +
        '<div class="s-v tabular">' + esc(String(it.value)) + '</div>' +
        (it.note ? '<div class="s-n">' + esc(it.note) + '</div>' : '');
      var cls = 'stat' + (it.tone ? ' ' + it.tone : '') + (it.href ? ' statlink' : '');
      return it.href
        ? '<a class="' + cls + '" href="' + it.href + '">' + inner + '</a>'
        : '<div class="' + cls + '">' + inner + '</div>';
    }).join('') + '</div>';
  }

  function accessContentLine(rec) {
    if (!rec) { return 'Access'; }
    var names = (rec.items || []).map(function (it) {
      var c = data.contextOf(it.experimentId);
      return c ? c.experiment.name : it.experimentId;
    });
    if (!names.length) { return 'Approved access'; }
    if (names.length === 1) { return names[0]; }
    if (names.length === 2) { return names[0] + ' and ' + names[1]; }
    return names[0] + ' and ' + (names.length - 1) + ' more';
  }

  /* The union of technologies an approval carries — one of the two
     facts (with the term) that tells two approvals of the same
     Experiment apart, now that the reference is not shown. */
  function recTechnologies(rec) { return XRSLP.ui.recTechnologies(rec); }

  function accessTermLine(rec) {
    if (!rec) { return ''; }
    var termDef = data.term(rec.term);
    var label = termDef ? termDef.label : rec.term;
    var st = state.accessTermState(rec);
    /* `endsOn`, not `endsAt` — the field the record actually carries. */
    if (rec.endsOn) {
      return label + ' · ' + (st.key === 'expired' ? 'ended ' : 'ends ') +
        XRSLP.util.fmtDate(rec.endsOn);
    }
    return label;
  }

  /* THE CONTEXTUAL CHOOSER LABEL.

     An <option> carries no markup, so everything needed to tell two
     approvals apart has to be IN the text — and none of it may be the
     internal reference. Two approvals can legitimately carry the SAME
     Experiment; what separates them is the technology set, the licence
     quantity and the term, so all three are named. */
  function accessChoiceLabel(rec) {
    if (!rec) { return ''; }
    var termDef = data.term(rec.term);
    var bits = [accessContentLine(rec)];
    var courses = [], seenC = {};
    (rec.items || []).forEach(function (it) {
      var c = data.contextOf(it.experimentId);
      var nm = c && c.course ? c.course.name : null;
      if (nm && !seenC[nm]) { seenC[nm] = 1; courses.push(nm); }
    });
    if (courses.length) { bits.push(courses.join(' · ')); }
    var techs = [], seenT = {};
    (rec.items || []).forEach(function (it) {
      (it.technologies || []).forEach(function (t) {
        if (seenT[t]) { return; }
        seenT[t] = 1;
        var def = data.TECHNOLOGIES[t];
        techs.push(def ? def.name : t);
      });
    });
    if (techs.length) { bits.push(techs.join(' + ')); }
    bits.push(rec.quantity + ' ' + XRSLP.util.plural(rec.quantity, 'licence'));
    bits.push(termDef ? termDef.label : rec.term);
    if (rec.endsOn) {
      bits.push((state.accessTermState(rec).key === 'expired' ? 'ended ' : 'ends ') +
        XRSLP.util.fmtDate(rec.endsOn));
    }
    return bits.join(' · ');
  }
  /* Kept under its old name for the builders that already call it. */
  function accessOptionLabel(rec) { return accessChoiceLabel(rec); }

  /* R04 — "Access record" glossed rather than renamed.

     The stakeholder questioned the phrase, and it IS jargon. It cannot
     simply be replaced here: the state layer prints it inside its own
     refusal sentences (`assignabilityText`), and the Super Admin screens
     use it as well — so a rename confined to this workspace would make
     two surfaces disagree about what the same record is called, which is
     a worse failure than the jargon itself. Instead the term is defined
     in plain words wherever the Tenant Admin first meets it. */
  function accessRecordGlossHTML() {
    /* The stakeholder questioned "access record" as a user-facing term
       and no replacement noun was agreed, so the UI stops naming the
       object and describes what it IS instead. */
    return '<p>Each <strong>approval</strong> below is one thing the Super Admin approved for this ' +
      'institution: the experiments, the technology variants, the number of student licences and the term. ' +
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
        ? 'The one approval this institution holds cannot be granted from'
        : 'None of the ' + blocked.length + ' approvals this institution holds can be granted from',
      body: 'Student access can never reach outside what the institution has been approved for.',
      actionsHTML: '<a class="btn sec" href="' + href.access(tenant.id) + '">View content access</a>'
    }) +
    '<ul class="blocklist">' + blocked.map(function (b) {
      return '<li>' + ui.accessTitle(b.record) + ' — ' +
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
    'access-expired': 'Access expired',
    'allocation-held': 'Held — allocation full'
  };
  function entitlementBadge(ent) {
    if (ent.effective) { return ui.badge('b-success', 'check', 'Entitled'); }
    return ui.badge('b-warning', 'alert', BLOCK_TEXT[ent.blockedBy] || 'Not effective');
  }

  return {
    href: href, requireTenant: requireTenant, inactiveRefusal: inactiveRefusal,
    actionsIfWritable: actionsIfWritable, canWrite: canWrite,
    personStatusBadge: personStatusBadge, sourceLabel: sourceLabel,
    personLink: personLink, allocMeter: allocMeter,
    allocMetrics: allocMetrics, LICENCE_RULE: LICENCE_RULE,
    FACULTY_LICENCE_RULE: FACULTY_LICENCE_RULE, accessRecordTitle: accessRecordTitle,
    noAssignableAccessHTML: noAssignableAccessHTML,
    accessOptionLabel: accessOptionLabel, accessChoiceLabel: accessChoiceLabel, expLine: expLine,
    accessContentLine: accessContentLine, accessTermLine: accessTermLine,
    recTechnologies: recTechnologies,
    statGrid: statGrid,
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

  /* The institution's route, stated ONCE, in the folded explanation at
     the head of Content access.

     ⚠ IT USED TO BE CALLED FROM INSIDE `records.map`, so a four-record
     institution read this same two-paragraph passage four times — and its
     argument is the TENANT, so every copy was byte-identical. The route
     genuinely differs per RECORD, which is what `renewalRouteLine` below
     now prints beside each record's own renewal control; this paragraph
     is the institution-level frame and is emitted exactly once. */
  function renewalRouteHTML(tenant) {
    var route = state.renewalRouteFor(tenant.id);
    var recordRoutes = {};
    state.accessForTenant(tenant.id).forEach(function (r) {
      var rr = state.renewalRouteForAccess(r.id);
      if (rr) { recordRoutes[rr.paymentRequired ? 'payment' : 'none'] = true; }
    });
    var routesDiffer = recordRoutes.payment && recordRoutes.none;
    if (!route) { return ''; }
    return '<p>' + (routesDiffer
      ? 'This institution holds approvals that arrived on <strong>different routes</strong>. A renewal ' +
        'follows the route of the <strong>record being renewed</strong>, and each record states its own beside ' +
        'its renewal control.'
      : route.paymentRequired
      ? 'A renewal for ' + esc(tenant.name) + ' follows the <strong>same payment step this institution was ' +
        'onboarded through</strong>. The Super Admin decides the renewal request first, and the access term is ' +
        'extended only when that payment step completes.'
      : 'There is <strong>no payment step</strong> on this institution&rsquo;s access route, so the ' +
        '<strong>Super Admin&rsquo;s approval</strong> is what activates a renewal.') + '</p>' +
      '<p>Requesting a renewal <strong>extends nothing on its own</strong>, and nobody &mdash; the Super Admin ' +
      'included &mdash; can extend an access term directly. The term moves only when the record&rsquo;s own ' +
      'route has completed.</p>';
  }

  /* THIS RECORD'S route, in one line, beside the control that starts it.
     The institution-level paragraph above promises each record states its
     own; before this existed that promise was false — the per-record
     route appeared nowhere outside the confirmation dialog. */
  function renewalRouteLine(rec) {
    var route = state.renewalRouteForAccess(rec.id);
    if (!route) { return ''; }
    return '<p class="tsub2">Renewal route for ' + ui.accessTitle(rec) + ': ' +
      (route.paymentRequired
        ? 'Super Admin decision, then this institution&rsquo;s payment step.'
        : 'Super Admin decision — no payment step.') + '</p>';
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
      '<p class="cardfoot">Until it is activated, the end date is unchanged and nothing has ' +
      'been charged, sent or confirmed.</p>';
  }

  /* Renewals already activated on this record. The PREVIOUS end date is
     kept beside the new one and is never removed: a renewal extends a
     term, and dropping what it extended from would make the record
     unreadable as history. */
  function renewalHistoryHTML(rec) {
    var list = Array.isArray(rec.renewals) ? rec.renewals : [];
    if (!list.length) { return ''; }
    /* TABULAR, AND FOLDED. Each renewal used to be one unbroken 40-word
       sentence, so three of them could only be compared by reading them
       word by word. The same five facts line up as columns instead, and
       the whole block is closed until it is asked for — history matters,
       but it is never the reason somebody opened this record. */
    return ui.about(list.length + ' ' + util.plural(list.length, 'renewal') + ' already activated on this access',
      '<div class="tscroll"><table class="dt sm">' +
      '<caption class="sr-only">Renewals activated on ' + esc(T.accessContentLine(rec)) + '</caption>' +
      '<thead><tr><th scope="col">Activated</th><th scope="col">Term added</th>' +
      '<th scope="col">Previously ended</th><th scope="col">Now ends</th>' +
      '<th scope="col">Request</th></tr></thead><tbody>' +
      list.map(function (rn) {
        var termDef = data.term(rn.term);
        return '<tr><td data-label="Activated">' + esc(util.fmtDate(rn.at)) + '</td>' +
          '<td data-label="Term added">' + esc(termDef ? termDef.label : rn.term) + '</td>' +
          '<td data-label="Previously ended">' +
          (rn.previousEndsOn ? esc(util.fmtDate(rn.previousEndsOn)) : '<span class="muted">Not recorded</span>') +
          '</td>' +
          '<td data-label="Now ends">' + esc(util.fmtDate(rn.endsOn)) + '</td>' +
          '<td data-label="Request">' + (rn.requestId
            ? '<span class="mono">' + esc(rn.requestId) + '</span>' : '<span class="muted">—</span>') +
          '</td></tr>';
      }).join('') + '</tbody></table></div>');
  }

  /* What this ONE record can do about renewal right now: track the
     renewal already running, read why one cannot be raised, or raise
     one. Never a dead control — `renewalBlock` names the reason and the
     reason is printed instead of the button. */
  function renewalRecordHTML(rec) {
    var openReq = state.openRenewalForAccess(rec.id);
    var block = state.renewalBlock(rec.id);
    var action;
    /* ⚠ THE ROUTE LINE IS UNCONDITIONAL, BECAUSE THE PROMISE ABOVE IT IS.
       On an institution holding records that arrived by different
       routes, the paragraph at the head of this screen says "each
       record states its own beside its renewal control". `renewalRouteLine`
       was emitted in only ONE of the three branches below, so a record
       with a renewal already in flight — or one blocked for any other
       reason — printed no route at all and the promise was false for
       exactly the records a reader was most likely to be looking at.
       The route is a fact about the RECORD, not about whether it happens
       to be renewable this minute. */
    var routeLine = renewalRouteLine(rec);
    if (openReq) {
      action = openRenewalHTML(openReq);
    } else if (block) {
      action = '<p>A renewal cannot be requested for this access right now because ' +
        esc(state.renewalBlockText(block)) + '. Nothing has been lost: the record, its access grants and every ' +
        'student&rsquo;s progress are kept exactly as they stand.</p>';
    } else if (state.canRenewAccess(rec.id)) {
      /* ⚠ THE PLAN RULE, STATED WHERE THE DECISION IS TAKEN — not as a
         492-character note at the foot of the longest screen in the
         workspace, which is where it used to live and where nobody
         renewing anything would ever read it. Whether a renewal may
         CHANGE the plan is not settled by any source; the build fails
         safe by mirroring it and offering no editing, and that is a
         product rule the admin can act on rather than an open question
         they cannot. */
      action = '<p class="tsub2">A renewal repeats this plan exactly &mdash; same experiments, technologies, licence ' +
        'quantity and term length &mdash; and cannot be edited on the way through. More licences or different ' +
        'content come through a new institutional access request.</p>' +
        '<div class="formact">' +
        '<button class="btn sm pri" type="button" data-renew="' + esc(rec.id) + '">Request renewal' +
        '<span class="sr-only"> of ' + esc(T.accessContentLine(rec)) + '</span></button></div>';
    } else {
      action = '';
    }
    return routeLine + action + renewalHistoryHTML(rec);
  }

  /* THE ONE PLACE A RENEWAL IS RAISED. `root` scopes the binding so a
     panel rendered outside the main region can wire its own control;
     Content access passes nothing and binds the whole page. */
  function bindRenewal(root) {
    Array.prototype.slice.call((root || document).querySelectorAll('[data-renew]')).forEach(function (btn) {
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
            'second set of access, no extra licence and no extra experiment is created.</span></div>' +
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

    /* FIVE FIGURES, NOT EIGHTEEN. The page carried three grids of tiles
       and three of them named nearly the same thing — "Licences
       assigned", "Entitled students" and, further down, "Students with
       access" — which the reader had to hold apart from small notes.

       The provisioning counts are now a compact strip, each one a LINK to
       the screen that acts on it, and the licence trio moves to the one
       canonical licence line below it. The two counts that genuinely
       differ are stated together, once:

         ENTITLED STUDENTS is effective entitlement — what a learner can
         actually open right now.
         LICENCES ASSIGNED is a per-record sum, so a student entitled
         under two access records holds two licences and is counted
         twice. It is a fact about allocation and survives deactivation
         untouched, which is exactly why reading it as a student count
         made this page contradict itself. */
    /* ⚠ FOUR TILES, AND NO MODEL VOCABULARY.

       This carried five tiles and then two more paragraphs of counting
       underneath, ending in the sentence "N distinct students hold at
       least one licence across M active access records" — which is the
       licence data model read aloud. A Tenant Admin does not think in
       distinct licence holders across records; they think in people,
       content and how much room is left.

       Four tiles: the two populations they administer, the content the
       institution holds, and how many students can actually open
       something. Student groups moved out — it is a navigation count,
       and the side nav already carries it. The allocation numbers stay,
       because Approved / Assigned / Available is the one arithmetic this
       role genuinely needs, and the counting rule behind it stays one
       tap away in the info affordance rather than a paragraph. */
    var stats = T.statGrid([
      { label: 'Students', value: students.length, href: T.href.people(tenant.id),
        note: activeStudents.length !== students.length
          ? activeStudents.length + ' active' : null },
      { label: 'Faculty', value: faculty.length, href: T.href.people(tenant.id) },
      { label: 'Content access', value: live.length, href: T.href.access(tenant.id),
        note: live.length ? 'active' : 'none yet' },
      { label: 'Students with learning access', value: entitled.length, href: T.href.assignments(tenant.id),
        note: tenantActive ? 'can start learning' : 'paused while deactivated',
        tone: tenantActive && live.length && !entitled.length ? 'warn' : '' }
    ]) +
      /* §4 — the trio was an unlabelled "5 · 1 · 4". It needs a heading
         to be readable at all, and "available" says what "remaining"
         only implies. */
      '<div class="cardfoot">' +
      (live.length
        ? '<h3 class="subh">Student licences ' +
          ui.infoTip(T.LICENCE_RULE, 'How licences are counted') + '</h3>' +
          T.allocMetrics(alloc, null, { available: true }) +
          (tenantActive ? '' :
            '<p style="margin-top:8px">Every access grant is kept while the institution is ' +
            'deactivated; no entitlement is effective until it is reactivated.</p>')
        : '<p>No licences yet — this institution holds no active access.</p>') +
      '</div>';

    /* Attention — every row is a real state of this institution.
       No revenue, completion, assessment or support analytics: none of
       those exist yet, and inventing them would be fiction.

       ⚠ A ROW IS A TITLE, ONE LINE AND ONE LINK. Two of them used to
       inject whole renewal panels — route paragraphs, a Request-renewal
       button per record and the full renewal history — into a list item,
       which turned a dashboard row into a form and printed a record's
       history on two screens at once. Renewal is a Content-access action;
       these rows link to it. */
    var items = [];
    var noAccess = state.accessWithoutAssignments(tenant.id);
    if (noAccess.length) {
      items.push({
        tone: 'warn', icon: 'layers',
        /* §4 — this printed the ACC ids and explained entitlement. It
           names the content and says what to do instead. */
        title: noAccess.length + ' approved ' + util.plural(noAccess.length, 'Experiment') +
          ' ' + (noAccess.length === 1 ? 'hasn\u2019t' : 'haven\u2019t') + ' been given to any student',
        body: 'Give students access when they are ready to start.',
        href: T.href.newAssignment(tenant.id), label: 'Give students access'
      });
    }
    var unassigned = state.unassignedStudents(tenant.id);
    if (unassigned.length && live.length) {
      items.push({
        tone: 'info', icon: 'users',
        /* §3 — "entitlement" is model vocabulary. */
        title: unassigned.length + ' active ' + util.plural(unassigned.length, 'student') +
          ' without learning access',
        /* "No effective entitlement" is not the same as "never granted
           anything". A student can hold an access grant and still have no
           entitlement — held beyond the approved quantity, or on an
           expired record. Saying they were never given anything sent the
           Tenant Admin to create a grant that already existed. */
        body: 'They have nothing they can open yet.',
        href: T.href.people(tenant.id), label: 'Open People'
      });
    }
    var unmapped = state.coursesWithoutMapping(tenant.id);
    if (unmapped.length) {
      items.push({
        tone: 'info', icon: 'doc',
        title: unmapped.length + ' ' + util.plural(unmapped.length, 'course') +
          ' without an institution course code',
        body: unmapped.map(function (cid) { var c = data.course(cid); return c ? c.name : cid; }).join(', ') + '.',
        /* The link opens the mappings table already filtered to exactly
           these courses, so the fix is the first thing on the screen. */
        href: T.href.mappings(tenant.id), label: 'Add the codes', attrs: ' data-map-missing="1"'
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
        /* Named the ACC key. Named by its content now, one line. */
        title: blockedAccess.length + ' content ' + util.plural(blockedAccess.length, 'access') +
          ' cannot be given to students',
        body: blockedAccess.map(function (b) {
          return ui.accessTitle(b.record) + ' — ' + esc(state.assignabilityText(b.reason));
        }).join('; ') + '.',
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
        /* ⚠ OVERVIEW LANGUAGE. This said "1 access record expiring" and
           carried the ACC reference plus three sentences of policy. An
           Overview row gets a title, ONE line and one action; the
           reference belongs to the deep screen, not here. */
        title: expiring.length + ' content ' + util.plural(expiring.length, 'access') +
          ' ' + (expiring.length === 1 ? 'expires' : 'expire') + ' within 15 days',
        body: expiring.map(function (a) {
          var d = state.accessDaysUntilExpiry(a);
          return ui.accessTitle(a) + ' — ' + d + ' ' + util.plural(d, 'day') + ' left, ends ' +
            esc(util.fmtDate(a.endsOn));
        /* The "nothing was sent" fact is load-bearing — an admin who
           believes an email went out and does not follow up is a real
           harm — so it survives, as the last clause of the one line. */
        }).join('; ') + '. Nothing renews automatically and no reminder is sent &mdash; ' +
          'this row is the reminder.',
        href: T.href.access(tenant.id), label: 'Review and renew'
      });
    }
    var expiredRecs = state.expiredAccessForTenant(tenant.id);
    if (expiredRecs.length) {
      items.push({
        tone: 'warn', icon: 'alertCirc',
        title: expiredRecs.length + ' content ' + util.plural(expiredRecs.length, 'access') +
          ' ' + (expiredRecs.length === 1 ? 'has' : 'have') + ' expired',
        body: expiredRecs.map(function (a) {
          return ui.accessTitle(a) + ' — ended ' + esc(util.fmtDate(a.endsOn));
        }).join('; ') + '. Nothing is deleted &mdash; students keep their progress, and renewing restores it.',
        href: T.href.access(tenant.id), label: 'Review and renew'
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
        body: openTickets.map(function (t) { return esc(t.subject); }).join('; ') + '.',
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
            '<p>' + it.body + '</p></div>' +
            '<a class="btn sm sec" href="' + it.href + '"' + (it.attrs || '') + '>' + esc(it.label) + '</a></li>';
        }).join('') + '</ul>'
      /* The body must only claim what was actually checked. The
         "students with no entitlement" row is deliberately suppressed
         while the institution holds no live access record — there is
         nothing to assign, so listing every student as unassigned would
         be noise — but the empty state then asserted that no student
         lacks an entitlement, which was untrue of exactly that state.

         `emptyRow` rather than `emptyState`: "nothing needs attention" is
         a RESULT, not a missing page, and half a viewport of medallion
         and whitespace overstates it. */
      /* §11 — a normal zero state is ONE line. Half a viewport of
         medallion and whitespace overstates good news. */
      : ui.okRow(live.length
          ? 'Everything is up to date'
          : 'Nothing to do yet — this institution has no approved content');

    /* ---------- R06 · the learning half of the overview ---------- */
    var learn = learningRollup(tenant);

    /* The two altitudes are kept visually apart because they answer
       different questions and are counted differently: one row per
       STUDENT, and one row per STUDENT × EXPERIMENT. Presenting them in
       a single grid is how "12 in progress" starts being read as twelve
       people when it is twelve experiments. */
    /* ONE ROW PER STUDENT above, one row per STUDENT × EXPERIMENT below,
       and the two are kept visually apart because they are counted
       differently: "12 in progress" is twelve experiments, not twelve
       people. The second altitude is a metrics line rather than six more
       tiles — six tiles of mostly-zero states read as a dashboard of
       problems the institution does not have. */
    /* §5 — THE LEARNING SNAPSHOT. Four values, no more: how many
       learners can start, and where they are. Every figure is read from
       the SAME `learningRollup` the removed report used — no new
       progress formula, no estimate, nothing fabricated.

       `students` is one row per STUDENT; the three progress figures are
       one row per STUDENT x EXPERIMENT, which is why the line beneath
       states both counts in words rather than letting the reader guess
       which altitude a number belongs to. */
    var learningSnapshot = ui.statStrip([
      { v: learn.students, k: 'Students with learning access' },
      { v: learn.notStarted, k: 'Not started',
        tone: learn.pairs && learn.notStarted === learn.pairs ? 'warn' : '' },
      { v: learn.inProgress, k: 'In progress' },
      { v: learn.completed, k: 'Completed', tone: learn.completed ? 'good' : '' }
    ]) +
      (learn.students
        ? '<p class="ls-line">' + learn.students + ' ' + util.plural(learn.students, 'student') +
          ' currently ' + (learn.students === 1 ? 'has' : 'have') + ' access to ' +
          learn.pairs + ' ' + util.plural(learn.pairs, 'Experiment') + '.</p>'
        : '');

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
        /* §5 — the Overview carried two stat rows, a Course-by-Course
           table, a disclaimer and a folded methodology panel. That is
           reporting, and it belongs on the screens that own it: the
           per-Course and per-Experiment breakdowns are unchanged on
           Content access and in the Faculty workspace. Four values here,
           derived from the SAME `learningRollup` as before — no new
           formula, nothing fabricated. */
        learningSnapshot +
        '<p class="cardfoot"><a href="' + T.href.assignments(tenant.id) + '">View student access</a> ' +
        'for the per-student detail.</p>';
    }

    var noAccessYet = !state.accessForTenant(tenant.id).length;
    var awaitingPayment = state.tenantAwaitingActivation(tenant.id);
    var admins = state.tenantAdminsFor(tenant.id);

    /* §4 — orientation, then the four figures, then what to DO. A
       first-time Tenant Admin previously landed on five numbers with no
       statement of what this workspace is for and no way forward. */
    /* §3D — the same four working destinations, but each says what it
       is for. A first-time Tenant Admin could not tell "Academic
       mappings" from "Content access" by name alone. */
    var quick = ui.navTiles([
      { href: T.href.people(tenant.id), icon: 'users', label: 'People',
        desc: 'Add or manage Students and Faculty' },
      { href: T.href.newAssignment(tenant.id), icon: 'plus', label: 'Give student access',
        desc: 'Make approved Experiments available to learners' },
      { href: T.href.mappings(tenant.id), icon: 'book', label: 'Academic mappings',
        desc: 'Set institution Course codes' },
      { href: T.href.access(tenant.id), icon: 'layers', label: 'Content access',
        desc: 'View approved Experiments and licences' }
    ]);

    var html =
      ui.phead('Overview', esc(tenant.name) + ' · ' + esc(tenant.accessContext)) +
      ui.orient('Manage your institution\u2019s people, content access and learning setup.') +
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
      ui.card('Institution at a glance', stats, esc(tenant.accessContext), 'h2') +
      ui.card('Manage your institution', quick, null, 'h2') +
      /* §6 — attention and the learning snapshot sit side by side on a
         wide screen: both are short, and stacking them left a column of
         empty page beside each. The grid collapses to one column at
         1040 and below (`.ov-two` in responsive.css). */
      '<div class="ov-two">' +
      ui.card('Needs attention', attention,
        items.length ? items.length + ' ' + util.plural(items.length, 'item') : null, 'h2') +
      /* R06 — the learning half. It sits directly under the provisioning
         figures because the Tenant Admin is the institution's point of
         contact for both, and separating them across screens is what
         made this workspace look like a licence console. */
      /* The count that used to sit in this card's header multiplied
         students by experiments; the snapshot states both in words
         instead, so the header carries no figure at all. */
      ui.card('Learning snapshot', learningBody, null, 'h2') +
      '</div>' +
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
      after: function () {
        /* The unmapped-courses row opens Academic mappings already
           filtered to the courses it is complaining about. It sets a view
           filter on the destination screen and nothing else. */
        var toMissing = document.querySelector('[data-map-missing]');
        if (toMissing && XRSLP.screens.tenantMappingsPrefill) {
          toMissing.addEventListener('click', function () {
            XRSLP.screens.tenantMappingsPrefill({ missing: true });
          });
        }
      }
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

  /* Which record panels are open. Presentation state, module-level for
     the same reason the filter is: every control on this page re-renders
     it, and a panel that closed itself on each keystroke is unusable. */
  var openRecs = {};
  /* The library search debounce (see the input handler). */
  var libTimer = null;

  /* ONE entitlement read per (record, experiment) per render.
     The library table and the record panels below it were each walking
     `entitledStudentsFor` over the same pairs — two independent passes
     over the same derivation on one render, at an institution that may
     hold ~50 experiments across several records. Reset at the top of the
     screen so nothing is ever served from a previous state. */
  var entCache = {};
  function entitledIn(accessId, experimentId) {
    var k = accessId + '::' + experimentId;
    if (!entCache[k]) { entCache[k] = state.entitledStudentsFor(accessId, experimentId); }
    return entCache[k];
  }

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
    entitledIn(accessId, experimentId).forEach(function (pid) {
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

    entCache = {};
    var records = state.accessForTenant(tenant.id).slice().reverse();
    var assignable = state.assignableAccessForTenant(tenant.id);

    /* ---- the library: every approved experiment, once per record ----
       An experiment approved on TWO records is two rows on purpose. The
       licences, the term and the technologies all belong to the record,
       so collapsing them would have to invent a combined figure that
       exists nowhere in the state layer.

       ⚠ THAT REASONING USED TO EXIST ONLY HERE, IN THIS COMMENT. On the
       screen the reader simply met the same experiment twice with
       different licence figures and no cue, which reads as a bug. Every
       duplicated row now says which other records the experiment is also
       approved on, so the repetition is a stated relationship. */
    var libItems = [];
    var expRecords = {};
    records.forEach(function (rec) {
      (rec.items || []).forEach(function (item) {
        libItems.push({ experimentId: item.experimentId, technologies: item.technologies, rec: rec });
        if (!expRecords[item.experimentId]) { expRecords[item.experimentId] = []; }
        if (expRecords[item.experimentId].indexOf(rec.id) === -1) { expRecords[item.experimentId].push(rec.id); }
      });
    });
    var allRows = T.contentRows(libItems);
    /* ⚠ ROWS ARE (RECORD, EXPERIMENT) PAIRS, NOT EXPERIMENTS. Printed
       under the bare noun "experiment" this multiplied the institution's
       real catalogue by its number of records — an institution holding 50
       experiments across 3 records reported 150 — and contradicted every
       record panel below it. Same correction as `learn.pairs` on the
       Overview: count distinct experiments for the noun, and label the
       pair count for what it is. */
    var distinctExperiments = Object.keys(expRecords).length;

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
      selectHTML('lib-rec', 'Access source', lib.record, records.map(function (rec) {
        /* The filter listed the institution's own content library by key.
           It lists it by content now, with the reference trailing. */
        return { id: rec.id,
                 name: T.accessChoiceLabel(rec) };
      }), 'All approved content') +
      '</div>' +
      '<div class="fb-foot"><span class="fb-count">Showing ' + shownRows.length + ' of ' + allRows.length + ' ' +
      (records.length > 1
        ? util.plural(allRows.length, 'approval') + ' · ' + distinctExperiments + ' distinct ' +
          util.plural(distinctExperiments, 'experiment') + ' across ' + records.length + ' approvals'
        : util.plural(allRows.length, 'experiment')) + '</span>' +
      (libIsFiltered() ? '<button class="btn sm sec fb-clear" type="button" id="lib-clear">Clear filters</button>' : '') +
      '</div></div>';

    var libraryTable = shownRows.length
      ? '<div class="tscroll"><table class="dt">' +
        '<caption class="sr-only">Experiments ' + esc(tenant.name) + ' is approved to use</caption>' +
        '<thead><tr><th scope="col">Experiment</th><th scope="col">Technologies granted</th>' +
        '<th scope="col">Access source / term</th>' +
        '<th scope="col">Students with access</th><th scope="col">Where those students are</th></tr></thead><tbody>' +
        shownRows.map(function (row) {
          var rec = row.item.rec;
          var alloc = allocFor(rec.id);
          var l = experimentLearning(rec.id, row.experimentId);
          /* The OTHER approvals carrying this same experiment, named by
             what tells them apart — technologies and term — never by id. */
          var also = (expRecords[row.experimentId] || [])
            .filter(function (id) { return id !== rec.id; })
            .map(function (id) {
              var other = state.accessById(id);
              if (!other) { return null; }
              var techs = [], seen = {};
              (other.items || []).forEach(function (it) {
                if (it.experimentId !== row.experimentId) { return; }
                (it.technologies || []).forEach(function (t) {
                  if (seen[t]) { return; }
                  seen[t] = 1;
                  var def = data.TECHNOLOGIES[t];
                  techs.push(def ? def.name : t);
                });
              });
              return (techs.length ? techs.join(' + ') + ' \u00b7 ' : '') + T.accessTermLine(other);
            })
            .filter(Boolean);
          return '<tr>' +
            '<td data-label="Experiment"><span class="tmain">' + esc(row.name) + '</span>' +
            '<span class="tsub">' + esc(row.groupingName) + ' › ' + esc(row.courseName) + '</span>' +
            (also.length
              /* Was "Also approved on ACC-002" — a key the reader cannot
                 act on. The other approval is named by its own term and
                 technologies, which is what distinguishes it. */
              ? '<span class="tsub">Also approved under ' + esc(also.join('; ')) + '</span>' : '') + '</td>' +
            '<td data-label="Technologies granted">' + ui.techBadges(row.technologies) + '</td>' +
            /* ONE derivation, ONE vocabulary. This cell used to collapse
               the three-state term into two, so a record three days from
               expiry read "Term active" here and "Expiring soon" in its
               own panel on the same page. And the licence trio used to be
               three stacked lines repeated down the column, which needed
               325 characters of cardfoot to explain why they never add
               up; one compact "12 of 30 used" removes the question. */
            /* ⚠ TERM AND LICENCES FIRST, REFERENCE LAST. The cell led
               with `ACC-001` in monospace, which put a database key at
               the head of the institution's own content library. What a
               Tenant Admin needs from this column is how long the access
               runs and how much of it is used; the reference stays, and
               stays exact, underneath. */
            '<td data-label="Access source / term">' +
            ui.termBadge(state.accessTermState(rec)) +
            '<span class="tsub">' + esc(T.accessTermLine(rec)) + '</span>' +
            '<span class="tsub tabular">' + alloc.assigned + ' of ' + alloc.approved + ' licences used</span>' +
            '</td>' +
            '<td data-label="Students with access" class="num">' +
            (l.students
              /* Not a dead number: it opens Student access filtered to
                 exactly this record and this experiment. */
              ? '<a href="' + T.href.assignments(tenant.id) + '" data-asg-rec="' + esc(rec.id) +
                '" data-asg-q="' + esc(row.name) + '">' + l.students + '</a>'
              : '0') + '</td>' +
            '<td data-label="Where those students are">' + learningCellHTML(l) + '</td>' +
            '</tr>';
        }).join('') + '</tbody></table></div>' +
        '<p class="cardfoot"><strong>Students with access</strong> is effective entitlement, not a licence ' +
        'count. No mark or result is shown here.</p>'
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
      /* ---- the access records ----
         Each one used to be roughly a viewport and a half: a big-number
         meter with a 172-character note, a key/value block, one row per
         Programme, an actions row, then a Renewal heading with 312-430
         characters of route prose — repeated verbatim per record — and
         the full renewal history. The three things an admin actually came
         for were the last items on the panel, and there was no way to see
         four records at once.

         A record now opens as a SUMMARY: what it covers, its term, its
         licence line, and the three actions. Everything else — the term
         detail, the content breakdown, renewal — is one click away in the
         panel below it, and stays open across the re-renders the filters
         above cause. */
      var recordsHTML = records.map(function (rec) {
        var termDef = data.term(rec.term);
        var termState = state.accessTermState(rec);
        var alloc = allocFor(rec.id);
        var open = !!openRecs[rec.id];
        var panelId = 'ar-p-' + rec.id;
        var headId = 'ar-h-' + rec.id;

        /* R05 — the record's content BY PROGRAMME, not fifty flat rows.
           Every experiment is still reachable: the library above lists
           them all, and the button on each Programme row filters it down
           to exactly this record and this Programme. */
        var groups = T.groupContent(rec.items);
        var covers = groups.map(function (g) {
          var entitledHere = 0;
          g.courseOrder.forEach(function (c) {
            c.rows.forEach(function (row) {
              entitledHere += entitledIn(rec.id, row.experimentId).length;
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
            'Show in the content library<span class="sr-only"> — ' + esc(g.name) + ' in ' +
            esc(T.accessContentLine(rec)) + '</span></button></div>' +
            '</div>' +
            '<div class="cv-tech">' + ui.techBadges(g.technologies) + '</div></div>';
        }).join('');

        var blockedReason = state.accessAssignability(rec, tenant.id);
        /* THE ACTIONS ARE PER RECORD, AND NOW ACTUALLY GO THERE. Both
           buttons used to carry tenant-wide routes with no record in
           them, so every copy led to the same two places and the builder
           opened blank unless the institution happened to hold exactly
           one usable record. The prefill hooks the builder and the grant
           list already export are called on the way through. */
        var recActions = (blockedReason ? '' :
          '<a class="btn sm pri" href="' + T.href.newAssignment(tenant.id) + '" data-asg-new="' + esc(rec.id) + '">' +
          ui.ic('plus') + 'Give students access<span class="sr-only"> from ' +
          esc(T.accessContentLine(rec)) + '</span></a>' +
          '<a class="btn sm sec" href="' + T.href.assignments(tenant.id) + '" data-asg-rec="' + esc(rec.id) + '">' +
          'View student access<span class="sr-only"> on ' + esc(T.accessContentLine(rec)) + '</span></a>') +
          '<button class="btn sm sec" type="button" data-ar-toggle="' + esc(rec.id) + '" ' +
          'aria-expanded="' + (open ? 'true' : 'false') + '" aria-controls="' + esc(panelId) + '">' +
          (open ? 'Hide details' : 'Show details') +
          '<span class="sr-only"> for ' + esc(T.accessContentLine(rec)) + '</span></button>';

        return '<section class="accessrec" aria-labelledby="' + esc(headId) + '">' +
          /* The internal reference is NOT on the card. It lives in the
             expandable detail below, which is the forensic context. */
          /* §5 — content-first: the Experiments the approval carries,
             then the courses and count. It led with the Programme, which
             is not what a Tenant Admin recognises the approval by. */
          '<div class="ar-head"><h3 id="' + esc(headId) + '">' + esc(T.accessContentLine(rec)) + '</h3>' +
          '<span class="ar-sub">' + ui.accessScope(rec) + ' \u00b7 ' + esc(T.accessTermLine(rec)) + '</span>' +
          '<span class="ar-sub">' + ui.techBadges(ui.recTechnologies(rec)) + '</span>' +
          '<div class="ar-badges">' + ui.badge('b-outline', null, rec.accessContext) + ui.termBadge(termState) + '</div>' +
          '</div>' +
          '<div class="ar-body">' +
          T.allocMetrics(alloc, rec) +
          (blockedReason
            ? '<div style="margin-top:12px">' + ui.alertBox('warning',
                blockedReason === 'expired' ? 'This access has expired'
                  : 'No student can be given content from this access',
                '<p>Nobody can be given content from it because ' + esc(state.assignabilityText(blockedReason)) +
                '. It, every access grant on it and every student&rsquo;s progress are kept exactly as ' +
                'they stand' +
                (blockedReason === 'expired' ? ' — renewal is under <em>Show details</em>.' : '.') +
                '</p>') + '</div>'
            : '') +
          '<div class="ar-act">' + recActions + '</div>' +
          '<div class="ar-more" id="' + esc(panelId) + '"' + (open ? '' : ' hidden') + '>' +
          '<div class="kv compact">' +
          '<div class="k">Access term</div><div class="v">' + esc(termDef ? termDef.label : rec.term) +
          (rec.endsOn ? ' — until ' + esc(util.fmtDate(rec.endsOn)) : '') + '</div>' +
          '<div class="k">Activated</div><div class="v">' + esc(util.fmtDate(rec.startsOn)) + '</div>' +
          '<div class="k">From request</div><div class="v"><span class="mono">' + esc(rec.requestId) + '</span></div>' +
          '<div class="k">Granted by</div><div class="v">' + esc(rec.recordedBy) + '</div>' +
          /* THE ONE PLACE A TENANT ADMIN SEES THE INTERNAL REFERENCE:
             an explicitly opened detail panel, for quoting to support.
             It appears nowhere in the normal operational view. */
          '<div class="k">Internal reference</div><div class="v"><span class="mono">' + esc(rec.id) +
          '</span><span class="hint"> Quote this when contacting support.</span></div>' +
          '</div>' +
          '<h4 class="subh" style="margin-top:14px">Approved content by Programme / department</h4>' +
          '<div class="covers">' + covers + '</div>' +
          /* Implementation 07.2 — the renewal entry point on the screen
             that shows what the institution actually holds. Every record
             gets it, expired or not: a term that is still running is
             exactly where an early renewal is raised, and the state layer
             adds the new term to whatever is left rather than discarding
             it. The institution-level route is stated once at the top of
             the page; what appears here is this RECORD's own route. */
          '<h4 class="subh" style="margin-top:16px">Renewal</h4>' +
          renewalRecordHTML(rec) +
          '</div>' +
          '</div></section>';
      }).join('');

      body = '<div class="stack">' +
        ui.card('Content library', filterBar + libraryTable,
          distinctExperiments + ' ' + util.plural(distinctExperiments, 'experiment'), 'h2') +
        ui.sectionHead({
          title: 'Approved content', count: records.length, heading: 'h2', id: 'ar-sec',
          desc: 'One approved allocation each. The licences, the term and the technologies all belong to the record.'
        }) +
        recordsHTML + '</div>';
    }

    var html =
      ui.phead('Content access',
        'What the Super Admin approved for ' + esc(tenant.name) + '. Nothing here reaches a student until ' +
        'somebody is given access to it.',
        (assignable.length && T.canWrite(tenant)
          ? '<a class="btn pri" href="' + T.href.newAssignment(tenant.id) + '">' + ui.ic('plus') +
            'Give students access</a>'
          : null)) +
      /* R04 — the jargon defined where it is first met, rather than
         renamed (the reasoning is at the head of `accessRecordGlossHTML`)
         — but FOLDED. The page used to open on a 49-word definition and a
         26-word restriction before the first number, and close on an
         83-word note about an unresolved decision. Everything a reader
         may want and nobody needs on first read is in one place here:
         the definition, the licence-counting rule stated ONCE for the
         whole page, and the institution's renewal route stated ONCE
         rather than repeated inside every record panel. */
      (records.length
        ? '<div style="margin-bottom:16px">' +
          ui.about('How content access, licences and renewal work here',
            T.accessRecordGlossHTML() +
            '<p>' + esc(T.LICENCE_RULE) + '</p>' +
            renewalRouteHTML(tenant)) +
          '</div>'
        : '') +
      body;

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
          /* ⚠ DEBOUNCED, BECAUSE THE RE-RENDER IS EXPENSIVE HERE.
             Every keystroke rebuilds the workspace shell and re-derives
             the learning figures for every shown row — `entitledStudentsFor`
             plus `experimentProgress` per entitled student. At the
             stakeholder's stated scale that ran on every character typed.
             The filter value is taken immediately, so nothing is ever
             applied late or out of order; only the paint waits. */
          q.addEventListener('input', function () {
            lib.q = q.value;
            if (libTimer) { window.clearTimeout(libTimer); }
            libTimer = window.setTimeout(function () {
              libTimer = null;
              rerender('lib-q', true);
            }, 180);
          });
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
            ui.announce('Content library filtered to ' + T.accessContentLine(state.accessById(lib.record)) +
              (lib.grouping !== 'all' ? ', programme ' + lib.grouping : '') +
              '. Other filters cleared.');
          });
        });

        /* Show / hide one record's detail. It is a view state and nothing
           else: no record is read, written or re-derived, and the panel
           is already in the page so the toggle costs no re-render. */
        Array.prototype.slice.call(document.querySelectorAll('[data-ar-toggle]')).forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = btn.getAttribute('data-ar-toggle');
            var panel = document.getElementById('ar-p-' + id);
            if (!panel) { return; }
            var nowOpen = !!panel.hidden;
            panel.hidden = !nowOpen;
            openRecs[id] = nowOpen;
            btn.setAttribute('aria-expanded', nowOpen ? 'true' : 'false');
            btn.firstChild.nodeValue = nowOpen ? 'Hide details' : 'Show details';
          });
        });

        /* RECORD-SCOPED HAND-OFFS. Each one sets a view filter on the
           destination screen through the hook that screen exports, then
           lets the ordinary link navigate. Nothing is granted, nothing is
           written, and if the destination has not been loaded the link
           still works — it simply arrives unfiltered. */
        Array.prototype.slice.call(document.querySelectorAll('[data-asg-new]')).forEach(function (el) {
          el.addEventListener('click', function () {
            if (XRSLP.screens.tenantAssignPrefill) {
              XRSLP.screens.tenantAssignPrefill(el.getAttribute('data-asg-new'));
            }
          });
        });
        Array.prototype.slice.call(document.querySelectorAll('[data-asg-rec]')).forEach(function (el) {
          el.addEventListener('click', function () {
            if (XRSLP.screens.tenantAssignListPrefill) {
              XRSLP.screens.tenantAssignListPrefill(
                el.getAttribute('data-asg-rec'), el.getAttribute('data-asg-q') || '');
            }
          });
        });
      }
    };
  };
})();
