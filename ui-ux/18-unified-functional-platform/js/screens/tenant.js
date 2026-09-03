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
            'Everything already recorded — people, groups, academic mappings, assignments, licence ' +
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
            'completes; nothing can be assigned until then.'
          : 'The Super Admin decides what this institution may use. Nothing can be assigned until an ' +
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
    href: href, requireTenant: requireTenant, inactiveRefusal: inactiveRefusal,
    actionsIfWritable: actionsIfWritable, canWrite: canWrite,
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
          : 'none while the institution is deactivated — assignments are kept' }
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
        /* "No effective entitlement" is not the same as "never
           assigned". A student can hold an assignment and still have no
           entitlement — held beyond the approved quantity, or on an
           expired record. Saying they were never assigned sent the
           Tenant Admin to make an assignment that already existed. */
        body: 'These active students hold no effective entitlement. Most have not been assigned an experiment ' +
          'yet; a student who has been assigned one can also appear here if the record is out of licences or ' +
          'its term has ended.',
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
        }).join('; ') + '. Nothing has been deleted: the record, its assignments and every student&rsquo;s ' +
          'progress are kept, but entitlement derived from it is no longer effective.',
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
        body: 'They hold an assignment but no effective entitlement, because the record has no licence left for ' +
          'them. It happens when more students are assigned than the approved quantity covers, when a member joins ' +
          'a group that is already assigned, or when a deactivated student is reactivated after their licence was ' +
          'taken. Nobody who is currently entitled is ever displaced &mdash; a held student waits behind them.',
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
            : 'This institution holds no active content access yet, so there is nothing to map or assign. ' +
              'Content reaches an institution only through an approved institutional access request.'
        });

    var noAccessYet = !state.accessForTenant(tenant.id).length;
    var awaitingPayment = state.tenantAwaitingActivation(tenant.id);
    var admins = state.tenantAdminsFor(tenant.id);

    var html =
      ui.phead('Overview', esc(tenant.name) + ' · ' + esc(tenant.accessContext)) +
      '<div class="stack">' +
      (noAccessYet ? ui.alertBox('info',
        awaitingPayment ? 'No content access yet — awaiting payment' : 'No content access activated yet',
        '<p>' + esc(tenant.name) + ' holds no approved content. People, groups and academic mappings can be ' +
        'prepared now, but no experiment can be assigned until ' +
        (awaitingPayment
          ? 'payment completes on approved request <strong>' + esc(awaitingPayment.id) + '</strong>.'
          : 'the Super Admin approves an institutional access request' +
            (tenant.kind === 'external' ? ' and payment completes' : '') + '.') +
        '</p>') : '') +
      ui.card('Institution at a glance', stats, null, 'h2') +
      ui.card('Needs attention', attention, null, 'h2') +
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
      /* An institution-level reporting surface — completion, assessment
         outcomes, experiment usage, time spent — is not built on this
         plane, and the absence is declared rather than left to be
         discovered. What each Faculty member can see for their OWN
         mapped content IS built (Faculty → Student Progress), so the
         note points there rather than implying nothing exists. */
      ui.gapNote('NOT IN THIS BUILD',
        '<strong>Institution-wide reporting</strong> — completion rates, assessment outcomes, experiment usage ' +
        'and time spent across the whole institution — is not built on this plane. The figures above are ' +
        'provisioning and licence facts, not learning outcomes. Each Faculty member sees progress and results ' +
        'for the content mapped to them under <strong>Student Progress</strong> in their own workspace, and the ' +
        'platform sees institution-level usage indicators on its institution report. Who else should see what, ' +
        'and in what form, is not settled by any source, so nothing is invented here.') +
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
