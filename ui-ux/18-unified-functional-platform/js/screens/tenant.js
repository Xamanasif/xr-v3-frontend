/* ============================================================
   Unified Functional Platform — Tenant workspace (Institute Admin /
   Tenant Admin — ONE role, STK31-02).

   Implementation 02 completes the institution-side half of the chain:

     Super Admin approves  →  TENANT ACCESS      (what the tenant holds)
     Tenant Admin assigns  →  STUDENT ENTITLEMENT (who inside it gets it)

   The Tenant Admin can never assign content outside the approved set
   (STK31-24) and can never redefine the canonical catalogue (STK31-10).

   This file: shared tenant helpers · workspace resolution · Overview ·
   Content access. People, Groups/Mappings and Assignments live in
   tenant-people.js, tenant-groups.js and tenant-assign.js.
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
    facultyMap:    function (t) { return base(t) + '/faculty-mapping'; }
  };

  /* Every tenant screen resolves its tenant the same way, and fails the
     same way when the address is stale. */
  function requireTenant(params, navKey) {
    var tenant = state.tenantById(params.tenantId);
    if (tenant) { return { tenant: tenant }; }
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
        ' hold an assignment beyond the approved quantity and are <strong>not</strong> entitled. ' +
        'Free a licence, or ask the Super Admin to revise the approved quantity.</p>' : '') +
      (opts.noteHTML ? '<p class="al-note">' + opts.noteHTML + '</p>' : '') +
      '</div>';
  }

  function accessOptionLabel(rec) {
    var termDef = data.term(rec.term);
    return rec.id + ' — ' + rec.items.length + ' ' + XRSLP.util.plural(rec.items.length, 'experiment') +
      ' · ' + rec.quantity + ' approved · ' + (termDef ? termDef.label : rec.term);
  }

  function expLine(experimentId) {
    var ctx = data.contextOf(experimentId);
    if (!ctx) { return esc(experimentId); }
    return '<span class="tmain">' + esc(ctx.experiment.name) + '</span>' +
      '<span class="tsub">' + esc(ctx.grouping.name) + ' › ' + esc(ctx.course.name) + '</span>';
  }

  /* Why no assignment can be made right now — stated precisely, never
     as a bare "no access". If the tenant holds records that simply are
     not assignable, each one is named with its reason, so this screen
     can never silently contradict the navigation count or the Content
     access page. */
  function noAssignableAccessHTML(tenant, headingLevel) {
    var blocked = state.unassignableAccessForTenant(tenant.id);
    if (!blocked.length) {
      return ui.emptyState({
        icon: 'layers', heading: headingLevel,
        title: 'No content access yet',
        body: 'The Super Admin decides what this institution may use. Nothing can be assigned until an ' +
          'institutional access request for ' + tenant.name + ' is approved and activated.',
        actionsHTML: '<a class="btn sec" href="' + href.access(tenant.id) + '">View content access</a>'
      });
    }
    return ui.emptyState({
      icon: 'alert', heading: headingLevel,
      title: blocked.length === 1
        ? 'The one access record this institution holds cannot be assigned from'
        : 'None of the ' + blocked.length + ' access records this institution holds can be assigned from',
      body: 'Assignment can never reach outside an approved, usable access record.',
      actionsHTML: '<a class="btn sec" href="' + href.access(tenant.id) + '">View content access</a>'
    }) +
    '<ul class="blocklist">' + blocked.map(function (b) {
      return '<li><span class="mono">' + esc(b.record.id) + '</span> — ' +
        esc(state.assignabilityText(b.reason)) + '.</li>';
    }).join('') + '</ul>';
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
    href: href, requireTenant: requireTenant,
    personStatusBadge: personStatusBadge, sourceBadge: sourceBadge, sourceLabel: sourceLabel,
    personLink: personLink, statGrid: statGrid, allocMeter: allocMeter,
    noAssignableAccessHTML: noAssignableAccessHTML,
    accessOptionLabel: accessOptionLabel, expLine: expLine,
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

    var stats = T.statGrid([
      { label: 'Faculty', value: faculty.length },
      { label: 'Students', value: students.length,
        note: activeStudents.length === students.length ? 'All active' : activeStudents.length + ' active' },
      { label: 'Student groups', value: groups.length },
      { label: 'Active access records', value: live.length },
      { label: 'Approved licences', value: alloc.approved,
        note: live.length ? 'across ' + live.length + ' ' + util.plural(live.length, 'record') : 'no active access yet' },
      { label: 'Assigned students', value: alloc.assigned },
      { label: 'Remaining allocation', value: alloc.remaining,
        tone: alloc.approved > 0 && alloc.remaining === 0 ? 'warn' : '' },
      { label: 'Entitled students', value: alloc.uniqueEntitledStudents,
        note: 'hold at least one experiment' }
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
          ' ' + (noAccess.length === 1 ? 'has' : 'have') + ' no assignment.',
        href: T.href.newAssignment(tenant.id), label: 'Assign content'
      });
    }
    var unassigned = state.unassignedStudents(tenant.id);
    if (unassigned.length && live.length) {
      items.push({
        tone: 'info', icon: 'users',
        title: unassigned.length + ' active ' + util.plural(unassigned.length, 'student') + ' with no entitlement',
        body: 'These students exist in the institution but have not been assigned any experiment yet.',
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
    /* Records the institution holds that cannot be assigned from. This is
       the bridge that stops Overview and Assignments ever disagreeing
       silently: if a record is counted here but is not assignable, the
       Overview says so and links to the record. */
    var blockedAccess = state.unassignableAccessForTenant(tenant.id);
    if (blockedAccess.length) {
      items.push({
        tone: 'warn', icon: 'alert',
        title: blockedAccess.length + ' access ' + util.plural(blockedAccess.length, 'record') +
          ' cannot be assigned from',
        body: blockedAccess.map(function (b) {
          return esc(b.record.id) + ' — ' + esc(state.assignabilityText(b.reason));
        }).join('; ') + '. The record is still listed under Content access; only assignment is unavailable.',
        href: T.href.access(tenant.id), label: 'Open content access'
      });
    }
    var expiring = state.accessForTenant(tenant.id).filter(function (a) {
      return state.accessTermState(a).key === 'expiring';
    });
    if (expiring.length) {
      items.push({
        tone: 'warn', icon: 'clock',
        title: expiring.length + ' access ' + util.plural(expiring.length, 'record') + ' expiring within 15 days',
        body: 'Entitlement derived from an expired record stops being effective. ' +
          'The confirmed 15-day reminder to the Tenant is a required platform capability; its delivery channel is not yet decided, so no notification is sent from this prototype.',
        href: T.href.access(tenant.id), label: 'Open content access'
      });
    }
    if (alloc.over > 0) {
      items.push({
        tone: 'warn', icon: 'alert',
        title: alloc.over + ' ' + util.plural(alloc.over, 'student') + ' held beyond the approved allocation',
        body: 'They hold an assignment but no effective entitlement. This is reachable by reactivating a student after their licence was taken by someone else.',
        href: T.href.access(tenant.id), label: 'Review allocation'
      });
    }

    var attention = items.length
      ? '<ul class="attn">' + items.map(function (it) {
          return '<li class="at-row ' + it.tone + '"><span class="at-ic">' + ui.ic(it.icon) + '</span>' +
            '<div class="at-body"><div class="at-t">' + esc(it.title) + '</div>' +
            '<p>' + it.body + '</p></div>' +
            '<a class="btn sm sec" href="' + it.href + '">' + esc(it.label) + '</a></li>';
        }).join('') + '</ul>'
      : ui.emptyState({
          icon: 'check', heading: 'h3',
          title: 'Nothing needs attention',
          body: 'No unmapped courses, no unreached content and no students left without an entitlement.'
        });

    var noAccessYet = !state.accessForTenant(tenant.id).length;

    var html =
      ui.phead('Overview', esc(tenant.name) + ' · ' + esc(tenant.accessContext)) +
      '<div class="stack">' +
      (noAccessYet ? ui.alertBox('info', 'No content access activated yet',
        '<p>' + esc(tenant.name) + ' holds no approved content. People, groups and academic mappings can be prepared now, ' +
        'but no experiment can be assigned until the Super Admin approves an institutional access request' +
        (tenant.kind === 'external' ? ' and payment completes' : '') + '.</p>') : '') +
      ui.card('Institution at a glance', stats, null, 'h2') +
      ui.card('Needs attention', attention, null, 'h2') +
      '</div>';

    return { title: 'Overview — ' + tenant.name, html: html, tenant: tenant, navKey: 'overview' };
  };

  /* ---------------- CONTENT ACCESS ---------------- */
  XRSLP.screens.tenantContentAccess = function (params) {
    var r = T.requireTenant(params, 'content-access');
    if (!r.tenant) { return r.fail; }
    var tenant = r.tenant;

    var records = state.accessForTenant(tenant.id).slice().reverse();

    var body;
    if (!records.length) {
      body = '<div class="tablecard">' + ui.emptyState({
        icon: 'layers',
        title: 'No active content yet',
        body: 'Approved content appears here once an institutional access request for ' + tenant.name +
          ' is approved and activated by the platform.'
      }) + '</div>';
    } else {
      body = '<div class="stack">' + records.map(function (rec) {
        var termDef = data.term(rec.term);
        var termState = state.accessTermState(rec);
        var alloc = state.accessAllocation(rec.id);
        var live = state.accessIsLive(rec);

        var covers = rec.items.map(function (item) {
          var ctx = data.contextOf(item.experimentId);
          var entitled = state.entitledStudentsFor(rec.id, item.experimentId);
          return '<div class="cvrow"><span class="cv-ic">' + ui.ic('flask') + '</span>' +
            '<div class="cv-body">' +
            '<div class="cv-ctx">' + (ctx ? esc(ctx.grouping.name) + ' › ' + esc(ctx.course.name) : '') + '</div>' +
            '<div class="cv-t">' + esc(ctx ? ctx.experiment.name : item.experimentId) + '</div>' +
            '<div class="cv-ent tabular">' + entitled.length + ' ' + util.plural(entitled.length, 'student') + ' entitled</div>' +
            '</div>' +
            '<div class="cv-tech">' + ui.techBadges(item.technologies) + '</div></div>';
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
              'Experiment assignments are not counted as separate licences.'
          }) +
          '<div class="kv" style="margin:14px 0">' +
          '<div class="k">Access term</div><div class="v">' + esc(termDef ? termDef.label : rec.term) +
          (rec.endsOn ? ' — until ' + esc(util.fmtDate(rec.endsOn)) : '') + '</div>' +
          '<div class="k">Activated</div><div class="v">' + esc(util.fmtDate(rec.startsOn)) + '</div>' +
          '<div class="k">Granted by</div><div class="v">' + esc(rec.recordedBy) + '</div>' +
          '</div>' +
          '<h3 class="subh">Approved experiments &amp; technologies</h3>' +
          '<div class="covers">' + covers + '</div>' +
          (!blockedReason ?
            '<div class="ar-act"><a class="btn sm pri" href="' + T.href.newAssignment(tenant.id) + '">' +
            ui.ic('plus') + 'Assign an experiment</a>' +
            '<a class="btn sm sec" href="' + T.href.assignments(tenant.id) + '">View assignments</a></div>' :
            '<div style="margin-top:14px">' + ui.alertBox('warning',
              blockedReason === 'expired' ? 'This access record has expired' : 'This access record cannot be assigned from',
              '<p>Nothing can be assigned from it because ' + esc(state.assignabilityText(blockedReason)) + '. ' +
              (blockedReason === 'expired'
                ? 'Entitlement derived from it is no longer effective. Assignment records are retained for traceability. ' +
                  'Renewal is an explicit institutional action — nothing renews automatically.'
                : 'The record is kept exactly as the Super Admin allocated it; only assignment is unavailable.') +
              '</p>') + '</div>') +
          '</div></section>';
      }).join('') + '</div>';
    }

    var html =
      ui.phead('Content access',
        'Content and technologies activated for ' + esc(tenant.name) + ' through approved institutional requests.') +
      body;

    return {
      title: 'Content access — ' + tenant.name,
      html: html,
      tenant: tenant,
      navKey: 'content-access'
    };
  };
})();
