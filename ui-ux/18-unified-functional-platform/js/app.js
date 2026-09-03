/* ============================================================
   Unified Functional Platform — application bootstrap.
   Renders the prototype-controls strip, the active shell
   (public / Super Admin / Tenant Admin / Faculty / Student /
   Vendor / Academic Reviewer / Content Manager) and the routed screen.

   All eight surfaces use the SAME workspace shell, the same navigation
   pattern and the same design system. A role is distinguished by its
   navigation, its content, its actions and its authority — never by a
   separate styling system.
   ============================================================ */

(function () {
  'use strict';

  var esc = XRSLP.util.esc;
  var ui = XRSLP.ui;
  var state = XRSLP.state;
  var data = XRSLP.data;
  var screens = XRSLP.screens;

  var firstRender = true;

  /* ---------- prototype controls strip (NOT product UI) ---------- */

  /* The Student entry is a PROTOTYPE VIEW SWITCH, not authentication.
     When the Student workspace is open it also offers a chooser over
     the REAL student records that exist in the prototype data — never
     a fabricated identity, and never a grant of access: what the
     chosen student can see still comes only from what has been
     assigned to them. */
  /* `shown` is the student the page actually rendered. Driving the control
     from the stored pointer alone let the two diverge — open
     `#/learn/<someone-else>/…` directly and the strip claimed you were
     viewing as a different person than the page in front of you. */
  function studentSelector(shown) {
    var chosen = shown || state.protoStudent();
    var groups = state.tenants().map(function (t) {
      var students = state.studentsForTenant(t.id);
      if (!students.length) { return ''; }
      return '<optgroup label="' + esc(t.name) + '">' + students.map(function (p) {
        return '<option value="' + esc(p.id) + '"' + (chosen && chosen.id === p.id ? ' selected' : '') + '>' +
          esc(p.name + (p.status === 'active' ? '' : ' (inactive)')) + '</option>';
      }).join('') + '</optgroup>';
    }).join('');
    if (!groups) { return ''; }
    return '<label for="proto-student">Viewing as student' +
      '<select id="proto-student">' +
      '<option value="">&mdash; choose a student &mdash;</option>' + groups +
      '</select></label>';
  }

  /* The Faculty entry is the same PROTOTYPE VIEW SWITCH. The chooser
     lists the REAL Faculty records that exist in the prototype data —
     the ones a Tenant Admin created in Implementation 02 — and never a
     fabricated identity. Choosing one grants nothing: what that Faculty
     member can reach still comes only from their mappings. */
  function facultySelector(shown) {
    var chosen = shown || state.protoFaculty();
    var groups = state.tenants().map(function (t) {
      var fac = state.facultyForTenant(t.id);
      if (!fac.length) { return ''; }
      return '<optgroup label="' + esc(t.name) + '">' + fac.map(function (p) {
        return '<option value="' + esc(p.id) + '"' + (chosen && chosen.id === p.id ? ' selected' : '') + '>' +
          esc(p.name) + '</option>';
      }).join('') + '</optgroup>';
    }).join('');
    if (!groups) { return ''; }
    return '<label for="proto-faculty">Viewing as Faculty' +
      '<select id="proto-faculty">' +
      '<option value="">&mdash; choose a faculty member &mdash;</option>' + groups +
      '</select></label>';
  }

  /* The three central content roles use the same PROTOTYPE VIEW SWITCH.
     The chooser lists the REAL sample content actors that exist in
     prototype state; picking one grants nothing, because scope still
     comes from the seeded per-Course role assignments. */
  function contentSelector(area, shownActor) {
    if (area === 'vendor') {
      return XRSLP.contentUI.actorSelector('vendor', shownActor || state.protoVendor(),
        'proto-vendor', 'Viewing as Vendor');
    }
    if (area === 'review') {
      return XRSLP.contentUI.actorSelector('reviewer', shownActor || state.protoReviewer(),
        'proto-reviewer', 'Viewing as Academic Reviewer');
    }
    return XRSLP.contentUI.actorSelector('manager', shownActor || state.protoManager(),
      'proto-manager', 'Viewing as Content Manager');
  }

  /* The Tenant Admin entry is the same PROTOTYPE VIEW SWITCH. The
     chooser lists the REAL Tenant Admins the Super Admin has assigned —
     never a fabricated identity — and choosing one navigates to THAT
     PERSON'S OWN TENANT. An admin of one institution can never be
     resolved as the administrator of another: `actingTenantAdmin()`
     honours the pointer only when it names an admin of the tenant the
     route actually names. */
  function tenantAdminSelector(shownTenant) {
    var chosen = state.protoTenantAdmin();
    if (shownTenant) {
      var acting = state.actingTenantAdmin(shownTenant.id);
      if (acting) { chosen = acting; }
    }
    var groups = state.tenants().map(function (t) {
      var admins = state.tenantAdminsFor(t.id);
      if (!admins.length) { return ''; }
      return '<optgroup label="' + esc(t.name) + '">' + admins.map(function (a) {
        return '<option value="' + esc(a.id) + '"' + (chosen && chosen.id === a.id ? ' selected' : '') + '>' +
          esc(a.name) + '</option>';
      }).join('') + '</optgroup>';
    }).join('');
    if (!groups) { return ''; }
    return '<label for="proto-tadmin">Viewing as Tenant Admin' +
      '<select id="proto-tadmin">' +
      '<option value="">&mdash; choose a Tenant Admin &mdash;</option>' + groups +
      '</select></label>';
  }

  function protobar(area, shownStudent, shownFaculty, shownActor, shownTenant) {
    var sc = state.scenario();
    var options = Object.keys(data.SCENARIOS).map(function (key) {
      var s = data.SCENARIOS[key];
      return '<option value="' + key + '"' + (sc.id === key ? ' selected' : '') + '>' +
        esc(s.id + ' — ' + s.title + ' (' + s.institution.accessContext + ')') + '</option>';
    }).join('');
    /* Eight roles now sit on this strip. It is a wrapping flex row with
       every item allowed to wrap, so nothing here can create
       document-level horizontal overflow at any width — the roles are
       split into two labelled groups rather than one long line. */
    var isContent = area === 'vendor' || area === 'review' || area === 'content';
    return '<div class="protobar">' +
      '<span class="plabel">PROTOTYPE CONTROLS — NOT PRODUCT UI</span>' +
      '<nav class="pnav" aria-label="Prototype view switch — not product navigation">' +
      '<span class="pgrp"><span class="pgl" aria-hidden="true">Access</span>' +
      '<a href="#/catalogue"' + (area === 'public' ? ' aria-current="true"' : '') + '>Public</a>' +
      '<a href="#/platform/overview"' + (area === 'platform' ? ' aria-current="true"' : '') + '>Super Admin</a>' +
      '<a href="#/tenant"' + (area === 'tenant' ? ' aria-current="true"' : '') + '>Tenant Admin</a>' +
      '<a href="#/faculty"' + (area === 'faculty' ? ' aria-current="true"' : '') + '>Faculty</a>' +
      '<a href="#/learn"' + (area === 'learn' ? ' aria-current="true"' : '') + '>Student</a>' +
      '</span>' +
      '<span class="pgrp"><span class="pgl" aria-hidden="true">Content</span>' +
      '<a href="#/vendor"' + (area === 'vendor' ? ' aria-current="true"' : '') + '>Vendor</a>' +
      '<a href="#/review"' + (area === 'review' ? ' aria-current="true"' : '') + '>Academic Reviewer</a>' +
      '<a href="#/content"' + (area === 'content' ? ' aria-current="true"' : '') + '>Content Manager</a>' +
      '</span>' +
      '</nav>' +
      '<div class="pright">' +
      (area === 'learn'
        ? studentSelector(shownStudent)
        : area === 'faculty'
        ? facultySelector(shownFaculty)
        : area === 'tenant'
        ? tenantAdminSelector(shownTenant)
        : isContent
        ? contentSelector(area, shownActor)
        : '<label for="proto-scenario">Requester scenario' +
          '<select id="proto-scenario">' + options + '</select></label>') +
      '<button type="button" id="proto-reset">Reset prototype data</button>' +
      '</div></div>';
  }

  function bindProtobar() {
    var stu = document.getElementById('proto-student');
    if (stu) {
      stu.addEventListener('change', function () {
        if (!stu.value) {
          state.setProtoStudent(null);
          XRSLP.router.go('#/learn');
          return;
        }
        state.setProtoStudent(stu.value);
        var p = state.personById(stu.value);
        XRSLP.router.go('#/learn/' + encodeURIComponent(stu.value) + '/my-learning');
        ui.toast('Now viewing as ' + (p ? p.name : 'the selected student') + ' (prototype only).', 'info');
      });
    }
    var tad = document.getElementById('proto-tadmin');
    if (tad) {
      tad.addEventListener('change', function () {
        if (!tad.value) {
          state.setProtoTenantAdmin(null);
          XRSLP.router.go('#/tenant');
          return;
        }
        state.setProtoTenantAdmin(tad.value);
        var a = state.tenantAdminById(tad.value);
        XRSLP.router.go('#/tenant/' + encodeURIComponent(a.tenantId) + '/overview');
        ui.toast('Now viewing as ' + a.name + ', Tenant Admin for ' +
          ((state.tenantById(a.tenantId) || {}).name || 'that institution') + ' (prototype only).', 'info');
      });
    }
    var fac = document.getElementById('proto-faculty');
    if (fac) {
      fac.addEventListener('change', function () {
        if (!fac.value) {
          state.setProtoFaculty(null);
          XRSLP.router.go('#/faculty');
          return;
        }
        state.setProtoFaculty(fac.value);
        var p = state.personById(fac.value);
        XRSLP.router.go('#/faculty/' + encodeURIComponent(fac.value) + '/overview');
        ui.toast('Now viewing as ' + (p ? p.name : 'the selected faculty member') + ' (prototype only).', 'info');
      });
    }
    [['proto-vendor', state.setProtoVendor, '#/vendor', 'Vendor'],
     ['proto-reviewer', state.setProtoReviewer, '#/review', 'Academic Reviewer'],
     ['proto-manager', state.setProtoManager, '#/content', 'Content Manager']].forEach(function (row) {
      var el = document.getElementById(row[0]);
      if (!el) { return; }
      el.addEventListener('change', function () {
        row[1](el.value || null);
        if (!el.value) { XRSLP.router.go(row[2]); return; }
        var a = state.contentActor(el.value);
        XRSLP.router.go(row[2] + '/' + encodeURIComponent(el.value) + '/overview');
        ui.toast('Now viewing as ' + (a ? a.name : 'the selected ' + row[3]) + ' (prototype only).', 'info');
      });
    });
    var sel = document.getElementById('proto-scenario');
    if (sel) {
      sel.addEventListener('change', function () {
        state.setScenario(sel.value);
        var sc = state.scenario();
        ui.toast('Requester scenario set to ' + sc.id + ' — ' + sc.institution.name + '.', 'info');
        render(true);
      });
    }
    var reset = document.getElementById('proto-reset');
    if (reset) {
      reset.addEventListener('click', function () {
        ui.openDialog({
          title: 'Reset prototype data?',
          bodyHTML: '<p>This restores the deterministic seed data: the selection, all requests, ' +
            'created tenants and tenant access records are cleared, tenant people, groups, mappings and ' +
            'assignments return to the seed set, the Question Bank and the assessment configuration return ' +
            'to the seeded sample set, every student learning record — resources opened, simulations run, ' +
            'assessment attempts and faculty reviews — is discarded, the content pool returns to the seeded ' +
            'published catalogue plus the sample in-flight submissions (any experiment produced through the ' +
            'Vendor → Academic Reviewer → Content Manager workflow is discarded with it), and the requester ' +
            'scenario returns to A.</p>' +
            '<p style="margin-top:8px">It also clears every Implementation-06 governance record: tenant ' +
            'activation state and governance history, Tenant Admin assignments, platform role assignments ' +
            '(back to the seeded scope), later-version candidates with their Release / Hold decisions, ' +
            'device transfer requests and support reports.</p>' +
            '<p style="margin-top:8px">Reset is the <strong>only</strong> action that discards existing data. ' +
            'Loading a state saved by an earlier build upgrades it in place instead.</p>' +
            '<div class="consequence">' + ui.ic('info') +
            '<span>Prototype-only action. Storage key: <code>' + esc(state.STORAGE_KEY) + '</code></span></div>',
          okLabel: 'Reset data',
          onConfirm: function () {
            state.reset();
            XRSLP.router.go('#/');
            ui.toast('Prototype data reset to seed state.');
            render(true);
          }
        });
      });
    }
  }

  /* ---------- brand lockup ---------- */
  function brand(href) {
    return '<a class="brandlink" href="' + (href || '#/') + '"><span class="brand">' +
      '<img src="assets/bits-pilani-wilp-logo.png" alt="BITS Pilani WILP" ' +
      'onerror="this.closest(\'.brand\').classList.add(\'no-logo\'); this.remove()">' +
      '<span class="bdiv" aria-hidden="true"></span>' +
      '<span class="pname">XR Simulation Learning Platform</span></span></a>';
  }

  /* ---------- public shell ---------- */
  function publicShell(contentHTML, activeNav) {
    var selCount = state.selectionCount();
    var reqCount = state.requestsForScenario(state.scenario().id).length;
    function navItem(href, key, label, count) {
      return '<a href="' + href + '"' + (activeNav === key ? ' aria-current="page"' : '') + '>' +
        esc(label) +
        (count > 0 ? ' <span class="navcount" aria-hidden="true">' + count + '</span>' +
          '<span class="sr-only"> — ' + count + ' ' + (key === 'selection' ? XRSLP.util.plural(count, 'experiment') + ' selected' : XRSLP.util.plural(count, 'request')) + '</span>' : '') +
        '</a>';
    }
    return '<header class="pubbar"><div class="pubbar-inner">' +
      brand('#/') +
      '<nav class="pubnav" aria-label="Public navigation">' +
      navItem('#/catalogue', 'catalogue', 'Catalogue', 0) +
      navItem('#/requests', 'requests', 'Requests', reqCount) +
      navItem('#/selection', 'selection', 'Selection', selCount) +
      '</nav>' +
      '</div></header>' +
      '<main class="pubmain" id="main-content">' + contentHTML + '</main>' +
      '<footer class="pubfoot"><div class="pubfoot-inner">' +
      '<span>XR Simulation Learning Platform — unified functional prototype</span>' +
      '<span class="fspace"></span>' +
      '<span>Sample catalogue data for demonstration only</span>' +
      '</div></footer>';
  }

  /* ---------- tenant deactivation banner ----------
     Rendered by the SHELL, above every screen of the Tenant Admin,
     Faculty and Student workspaces, so no individual screen can forget
     it and no route can slip past it. It states the fact and the two
     things people most need to know: nothing was deleted, and it is
     reversible. */
  function inactiveBanner(tenant, audience) {
    if (!tenant || state.tenantIsActive(tenant.id)) { return ''; }
    var body = audience === 'student'
      ? '<p>Your institution&rsquo;s access to the platform has been suspended, so experiments cannot be ' +
        'opened at the moment. <strong>Everything you have already done is kept</strong> — your progress, ' +
        'your simulations and your assessment results are all still here.</p>'
      : audience === 'faculty'
      ? '<p>' + esc(tenant.name) + ' has been deactivated by the platform, so mapped content cannot be used ' +
        'and nothing can be changed at the moment. <strong>Nothing has been deleted</strong>: your question ' +
        'bank, assessments, reviews and every student record are all preserved.</p>'
      : '<p>' + esc(state.TENANT_INACTIVE_TEXT) + '</p>';
    return ui.alertBox('warning', 'This institution is deactivated', body, 'status');
  }

  /* ---------- workspace shell (platform + tenant) ---------- */
  function workspaceShell(opts) {
    var navHTML = opts.nav.map(function (n) {
      return '<a class="nitem" href="' + n.href + '"' + (n.active ? ' aria-current="page"' : '') + '>' +
        ui.ic(n.icon) + '<span>' + esc(n.label) + '</span>' +
        (n.count > 0 ? '<span class="ncount" aria-hidden="true">' + n.count + '</span>' +
          '<span class="sr-only"> — ' + n.count + ' ' + esc(n.countLabel || 'items') + '</span>' : '') +
        '</a>';
    }).join('');
    return '<div class="app">' +
      '<header class="topbar">' + brand(opts.homeHref) +
      '<div class="tspace"></div>' +
      (opts.chip ? '<span class="inst-chip">' + esc(opts.chip) + '</span>' : '') +
      '</header>' +
      '<div class="frame">' +
      '<nav class="snav" aria-label="' + esc(opts.navLabel) + '">' +
      '<div class="ws-ctx"><div class="wsk">' + esc(opts.wsKind) + '</div><div class="wsv">' + esc(opts.wsName) + '</div>' +
      (opts.wsSub ? '<div class="wss">' + esc(opts.wsSub) + '</div>' : '') + '</div>' +
      navHTML +
      '</nav>' +
      '<main class="main" id="main-content"><div class="main-inner">' + opts.contentHTML + '</div></main>' +
      '</div></div>';
  }

  /* Six Super Admin destinations, every one implemented, and every
     count derived from real records. There is no publish entry here:
     first publication is the Content Manager's (STK31-06). */
  function platformShell(contentHTML, activeKey) {
    var o = state.platformOverview();
    var submitted = o.requestsAwaiting.length;
    var waiting = submitted + o.versionsAwaiting.length + o.transfersAwaiting.length +
      o.ticketsOpen.length + o.expiryReminders.length + o.tenantsWithoutAdmin.length;
    var ops = o.transfersAwaiting.length + o.ticketsOpen.length + o.expiryReminders.length;
    return workspaceShell({
      homeHref: '#/platform/overview',
      chip: null,
      navLabel: 'Super Admin navigation',
      wsKind: 'Super Admin',
      wsName: 'Platform administration',
      nav: [
        { href: '#/platform/overview', icon: 'home', label: 'Overview', active: activeKey === 'overview',
          count: waiting, countLabel: XRSLP.util.plural(waiting, 'item') + ' waiting on the platform' },
        { href: '#/platform/requests', icon: 'doc', label: 'Access requests', active: activeKey === 'requests',
          count: submitted, countLabel: XRSLP.util.plural(submitted, 'request') + ' awaiting a decision' },
        { href: '#/platform/institutions', icon: 'building', label: 'Institutions',
          active: activeKey === 'institutions', count: o.tenants.length,
          countLabel: XRSLP.util.plural(o.tenants.length, 'tenant') + ' on the platform' },
        { href: '#/platform/content', icon: 'layers', label: 'Content governance', active: activeKey === 'content',
          count: o.versionsAwaiting.length,
          countLabel: XRSLP.util.plural(o.versionsAwaiting.length, 'version') + ' awaiting Release or Hold' },
        { href: '#/platform/roles', icon: 'shield', label: 'Role governance', active: activeKey === 'roles',
          count: o.roleAssignments, countLabel: XRSLP.util.plural(o.roleAssignments, 'role assignment') },
        { href: '#/platform/operations', icon: 'monitor', label: 'Operations', active: activeKey === 'operations',
          count: ops, countLabel: XRSLP.util.plural(ops, 'operational item') + ' needing attention' }
      ],
      contentHTML: contentHTML
    });
  }

  /* ---------- Student workspace shell ----------
     The same unified design system and the same workspace chrome as
     the admin workspaces — a lighter navigation over it, because a
     Student has three destinations and every one is implemented.
     There is no Assessments, Certificates, Messages or Profile entry
     here: none of them is built, and a link that leads nowhere is worse
     than an absent one. Help IS present from Implementation 06, because
     it now has a real destination behind it (STK31-39). */
  function learnShell(contentHTML, student, tenant, activeKey) {
    var nav = [];
    if (student) {
      var h = XRSLP.studentUI.href;
      var summary = state.studentProgressSummary(student.id);
      nav = [
        { href: h.home(student.id), icon: 'home', label: 'Home', active: activeKey === 'home', count: 0 },
        { href: h.myLearning(student.id), icon: 'flask', label: 'My Learning',
          active: activeKey === 'my-learning', count: summary.entitled,
          countLabel: XRSLP.util.plural(summary.entitled, 'experiment') + ' available to you' },
        { href: h.progress(student.id), icon: 'bars', label: 'Progress', active: activeKey === 'progress', count: 0 },
        /* Implementation 06. Both destinations are implemented, and the
           Device entry appears only where the Student actually holds an
           experiment delivered as a package on a device — a Web-only
           Student has no device binding to move (STK31-37 / 38). */
        { href: h.device(student.id), icon: 'monitor', label: 'My device', active: activeKey === 'device',
          count: 0, hidden: !state.studentHasPackageTechnology(student.id) },
        { href: XRSLP.supportUI.href.learn(student.id), icon: 'alertCirc', label: 'Help',
          active: activeKey === 'help', count: 0 }
      ].filter(function (n) { return !n.hidden; });
    }
    return workspaceShell({
      homeHref: student ? XRSLP.studentUI.href.home(student.id) : '#/learn',
      chip: tenant ? tenant.name : null,
      navLabel: 'Student navigation',
      wsKind: 'Student',
      wsName: student ? student.name : 'Student workspace',
      nav: nav,
      contentHTML: inactiveBanner(tenant, 'student') + contentHTML
    });
  }

  /* ---------- Faculty workspace shell ----------
     The same unified design system and the same workspace chrome as the
     other admin workspaces. Seven destinations, and every one of them is
     implemented. */
  function facultyShell(contentHTML, faculty, tenant, activeKey) {
    var nav = [];
    if (faculty) {
      var h = XRSLP.facultyUI.href;
      var scope = state.facultyScope(faculty.id);
      var pending = state.reviewsForFaculty(faculty.id, { status: 'pending' }).length;
      var bank = state.questionsForFaculty(faculty.id).length;
      var asmCount = scope.experiments.filter(function (row) {
        return !!state.assessmentForTenant(faculty.tenantId, row.experimentId);
      }).length;
      var reach = state.facultyStudentIds(faculty.id).length;
      nav = [
        { href: h.overview(faculty.id), icon: 'home', label: 'Overview', active: activeKey === 'overview', count: 0 },
        { href: h.content(faculty.id), icon: 'layers', label: 'My Content', active: activeKey === 'content',
          count: scope.experiments.length,
          countLabel: 'mapped ' + XRSLP.util.plural(scope.experiments.length, 'experiment') },
        { href: h.assessments(faculty.id), icon: 'doc', label: 'Assessments', active: activeKey === 'assessments',
          count: asmCount, countLabel: XRSLP.util.plural(asmCount, 'assessment') + ' configured' },
        { href: h.bank(faculty.id), icon: 'book', label: 'Question Bank', active: activeKey === 'questions',
          count: bank, countLabel: XRSLP.util.plural(bank, 'question') + ' in the bank' },
        { href: h.reviews(faculty.id), icon: 'edit', label: 'Reviews', active: activeKey === 'reviews',
          count: pending, countLabel: XRSLP.util.plural(pending, 'response') + ' waiting for your review' },
        { href: h.students(faculty.id), icon: 'users', label: 'Student Progress', active: activeKey === 'students',
          count: reach, countLabel: XRSLP.util.plural(reach, 'student') + ' reached by your content' },
        { href: XRSLP.supportUI.href.faculty(faculty.id), icon: 'alertCirc', label: 'Help',
          active: activeKey === 'help', count: 0 }
      ];
    }
    return workspaceShell({
      homeHref: faculty ? XRSLP.facultyUI.href.overview(faculty.id) : '#/faculty',
      chip: tenant ? tenant.name : null,
      navLabel: 'Faculty workspace navigation',
      wsKind: 'Faculty',
      wsName: faculty ? faculty.name : 'Faculty workspace',
      nav: nav,
      contentHTML: inactiveBanner(tenant, 'faculty') + contentHTML
    });
  }

  /* ---------- content-production workspace shells (Implementation 05)
     The SAME workspace chrome as every other role. What differs is the
     navigation, the content and the authority — not the styling. Every
     navigation entry below routes to a screen that is fully
     implemented. */
  function contentShell(kind, contentHTML, actor, activeKey) {
    var meta = {
      vendor:  { home: '#/vendor',  label: 'Vendor',            navLabel: 'Vendor workspace navigation',
                 ui: XRSLP.vendorUI,   fallback: 'Vendor workspace' },
      review:  { home: '#/review',  label: 'Academic Reviewer',  navLabel: 'Academic Reviewer workspace navigation',
                 ui: XRSLP.reviewerUI, fallback: 'Academic Reviewer workspace' },
      content: { home: '#/content', label: 'Content Manager',    navLabel: 'Content Manager workspace navigation',
                 ui: XRSLP.managerUI,  fallback: 'Content Manager workspace' }
    }[kind];
    var nav = actor ? meta.ui.nav(actor, activeKey) : [];
    return workspaceShell({
      homeHref: actor ? nav[0].href : meta.home,
      chip: actor ? actor.organisation : null,
      navLabel: meta.navLabel,
      wsKind: meta.label,
      wsName: actor ? actor.name : meta.fallback,
      nav: nav,
      contentHTML: contentHTML
    });
  }

  function tenantShell(contentHTML, tenant, activeKey) {
    var nav = [];
    if (tenant) {
      var h = XRSLP.tenantUI.href;
      var people = state.peopleForTenant(tenant.id);
      var students = people.filter(function (p) { return p.role === 'student'; }).length;
      var accessCount = state.accessForTenant(tenant.id).length;
      var groupCount = state.groupsForTenant(tenant.id).length;
      var asgCount = state.activeAssignments(tenant.id).length;
      /* Every entry below routes to a screen that is fully implemented.
         Faculty mapping lives inside Assignments rather than adding a
         seventh destination. */
      nav = [
        { href: h.overview(tenant.id), icon: 'home', label: 'Overview', active: activeKey === 'overview', count: 0 },
        { href: h.access(tenant.id), icon: 'layers', label: 'Content access', active: activeKey === 'content-access',
          count: accessCount, countLabel: 'access ' + XRSLP.util.plural(accessCount, 'record') },
        { href: h.people(tenant.id), icon: 'users', label: 'People', active: activeKey === 'people',
          count: people.length, countLabel: XRSLP.util.plural(people.length, 'person', 'people') +
            ' (' + students + ' ' + XRSLP.util.plural(students, 'student') + ')' },
        { href: h.groups(tenant.id), icon: 'building', label: 'Groups', active: activeKey === 'groups',
          count: groupCount, countLabel: XRSLP.util.plural(groupCount, 'student group') },
        { href: h.mappings(tenant.id), icon: 'doc', label: 'Academic mappings', active: activeKey === 'mappings', count: 0 },
        { href: h.assignments(tenant.id), icon: 'flask', label: 'Assignments', active: activeKey === 'assignments',
          count: asgCount, countLabel: 'active ' + XRSLP.util.plural(asgCount, 'assignment') },
        { href: XRSLP.supportUI.href.tenant(tenant.id), icon: 'alertCirc', label: 'Help',
          active: activeKey === 'help', count: 0 }
      ];
    }
    /* The workspace names the person actually administering this
       tenant — the Super Admin's assignment (STK31-21), never a
       fabricated identity, and never an admin belonging to a different
       institution. */
    var admin = tenant ? state.actingTenantAdmin(tenant.id) : null;
    return workspaceShell({
      homeHref: '#/tenant',
      chip: tenant ? tenant.name : null,
      navLabel: 'Tenant workspace navigation',
      wsKind: 'Institute Admin / Tenant Admin',
      wsName: tenant ? (admin ? admin.name : tenant.name) : 'Institution workspace',
      wsSub: tenant && admin ? tenant.name : (tenant ? 'No Tenant Admin assigned' : null),
      nav: nav,
      contentHTML: inactiveBanner(tenant, 'tenant') + contentHTML
    });
  }

  /* ---------- render cycle ---------- */
  function render(keepFocus) {
    var route = XRSLP.router.match();
    if (route.redirect) { window.location.replace(route.redirect); return; }

    var screenFn = screens[route.screen] || screens.notFound;
    var result = screenFn(route.params);
    if (result.redirect) { window.location.replace(result.redirect); return; }

    var area = result.area || route.area;
    var shellHTML;
    if (area === 'platform') {
      shellHTML = platformShell(result.html, result.navKey);
    } else if (area === 'tenant') {
      /* Same rule as every other plane: the strip follows the identity
         the page actually rendered. Opening another tenant's workspace
         re-points it at THAT tenant's assigned admin rather than
         claiming the previous one administers it. */
      if (result.tenant) {
        var acting = state.actingTenantAdmin(result.tenant.id);
        if (state.protoTenantAdminId() !== (acting ? acting.id : null)) {
          state.setProtoTenantAdmin(acting ? acting.id : null);
        }
      }
      shellHTML = tenantShell(result.html, result.tenant, result.navKey);
    } else if (area === 'faculty') {
      /* Keep the prototype pointer on the faculty member actually being
         viewed, so `#/faculty` and the strip never disagree with the
         page in front of you. */
      if (result.faculty && state.protoFacultyId() !== result.faculty.id) {
        state.setProtoFaculty(result.faculty.id);
      }
      shellHTML = facultyShell(result.html, result.faculty, result.tenant, result.navKey);
    } else if (area === 'learn') {
      /* Keep the prototype pointer on the student actually being viewed, so
         `#/learn` and the strip never disagree with the page. */
      if (result.student && state.protoStudentId() !== result.student.id) {
        state.setProtoStudent(result.student.id);
      }
      shellHTML = learnShell(result.html, result.student, result.tenant, result.navKey);
    } else if (area === 'vendor' || area === 'review' || area === 'content') {
      /* Same rule as the Student and Faculty planes: the strip follows
         the identity the page actually rendered, so a direct route and
         the control can never disagree. */
      if (result.contentActor) {
        var setters = { vendor: state.setProtoVendor, review: state.setProtoReviewer, content: state.setProtoManager };
        var getters = { vendor: state.protoVendorId, review: state.protoReviewerId, content: state.protoManagerId };
        if (getters[area]() !== result.contentActor.id) { setters[area](result.contentActor.id); }
      }
      shellHTML = contentShell(area, result.html, result.contentActor, result.navKey);
    } else {
      shellHTML = publicShell(result.html, result.navKey);
    }

    var root = document.getElementById('app-root');
    /* The skip link is the very first focusable element on the page,
       ahead of even the prototype-controls strip. */
    root.innerHTML = '<a class="skip-link" href="#main-content" id="skip-link">Skip to main content</a>' +
      protobar(area, result.student, result.faculty, result.contentActor, result.tenant) + shellHTML;

    document.title = (result.title ? result.title + ' — ' : '') + 'XR Simulation Learning Platform (Prototype)';

    bindProtobar();
    var skip = document.getElementById('skip-link');
    if (skip) {
      skip.addEventListener('click', function (e) {
        e.preventDefault();
        ui.focusMain(false);
      });
    }
    if (result.after) { result.after(); }

    if (!firstRender && !keepFocus) {
      ui.focusMain(true);
      window.scrollTo(0, 0);
    }
    firstRender = false;
  }

  XRSLP.render = render;

  window.addEventListener('hashchange', function () { render(false); });
  render(true);
})();
