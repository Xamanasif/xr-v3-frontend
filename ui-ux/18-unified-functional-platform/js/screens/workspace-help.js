/* ============================================================
   Unified Functional Platform — the Help destination for the Tenant
   Admin, Faculty, Vendor, Academic Reviewer and Content Manager
   workspaces. (The Student's lives in student-ops.js, beside their
   device screen; the Super Admin's side of the same records is the
   operations queue.)

   Every one of these is the SAME screen from XRSLP.supportUI, given a
   different requester context. That is the point: WCAG 2.2 SC 3.2.6
   *Consistent Help* is a Level A criterion, and Help now has one real
   destination in the same place in every workspace.

   What the context carries is only what the platform already knows —
   who is reporting, in which role, for which institution, and (where
   the role has one) which experiment and technology. Nothing is
   fabricated and nothing extra is collected.
   ============================================================ */

window.XRSLP = window.XRSLP || {};
XRSLP.screens = XRSLP.screens || {};

(function () {
  'use strict';

  var data = XRSLP.data;
  var state = XRSLP.state;
  var sup = XRSLP.supportUI;

  /* ---------------- Tenant Admin ---------------- */
  XRSLP.screens.tenantHelp = function (params) {
    var T = XRSLP.tenantUI;
    var r = T.requireTenant(params, 'help');
    if (!r.tenant) { return r.fail; }
    var tenant = r.tenant;
    var admin = state.actingTenantAdmin(tenant.id);

    /* The experiments the institution actually holds — the only ones a
       Tenant Admin could sensibly be reporting about. */
    var seen = {}, experiments = [];
    state.accessForTenant(tenant.id).forEach(function (rec) {
      (rec.items || []).forEach(function (i) {
        if (seen[i.experimentId]) { return; }
        seen[i.experimentId] = true;
        var ctx = data.contextOf(i.experimentId);
        experiments.push({ id: i.experimentId, name: ctx ? ctx.experiment.name : i.experimentId });
      });
    });

    /* ⚠ THE REQUESTER KEY IS THE TENANT, NOT THE ADMIN.

       A Tenant Admin assignment is governed state: the Super Admin can
       assign one, remove them, and assign somebody else. Keying reports
       to the admin's own id made the institution's report history
       disappear the moment that happened — and, before any admin was
       assigned, keyed them to the tenant id, so they vanished as soon as
       one was. The tenant id is the one identifier that cannot move.

       The consequence is deliberate and correct: this is the
       INSTITUTION'S report queue, and each report still records the
       person who actually filed it in `requesterName`. */
    var ctx = {
      kind: 'tenant-admin',
      id: tenant.id,
      name: admin ? admin.name : tenant.name,
      roleLabel: 'Institute Admin / Tenant Admin',
      tenantId: tenant.id, tenantName: tenant.name,
      experiments: experiments, technologies: [],
      /* Say plainly whose queue this is, and name the person who filed
         each one — the reader is not necessarily the reporter. */
      listTitle: 'Reports from this institution',
      listShowReporter: true,
      listEmptyTitle: 'Nothing has been reported from this institution',
      listEmptyBody: 'Reports raised from this workspace appear here with the state they are in, whoever ' +
        'files them, and they stay here if the Tenant Admin assignment changes.'
    };
    var out = sup.helpScreen(ctx);
    return {
      title: 'Help and support', html: out.html, tenant: tenant, navKey: 'help',
      after: function () { sup.bindHelp(ctx); }
    };
  };

  /* ---------------- Faculty ---------------- */
  XRSLP.screens.facultyHelp = function (params) {
    var F = XRSLP.facultyUI;
    var r = F.requireFaculty(params, 'help');
    if (!r.faculty) { return r.fail; }
    var faculty = r.faculty, tenant = r.tenant;

    var scope = state.facultyScope(faculty.id);
    var experiments = scope.experiments.map(function (row) {
      var c = data.contextOf(row.experimentId);
      return { id: row.experimentId, name: c ? c.experiment.name : row.experimentId };
    });
    var techs = {};
    scope.experiments.forEach(function (row) {
      F.mappedTechnologies(row).forEach(function (t) { techs[t] = true; });
    });

    var ctx = {
      kind: 'faculty', id: faculty.id, name: faculty.name, roleLabel: 'Faculty',
      tenantId: tenant.id, tenantName: tenant.name,
      experiments: experiments, technologies: Object.keys(techs)
    };
    var out = sup.helpScreen(ctx);
    return {
      area: 'faculty', title: 'Help and support', html: out.html,
      faculty: faculty, tenant: tenant, navKey: 'help',
      after: function () { sup.bindHelp(ctx); }
    };
  };

  /* ---------------- the three content roles ----------------
     They report about content they can actually see, so their experiment
     list is the same set of rows their own workspace shows.

     For an Academic Reviewer and a Content Manager that is exactly their
     live role scope. For a VENDOR it is their live scope PLUS the
     records they created, because a Vendor keeps sight of their own work
     after a scope is withdrawn — and reporting a technical problem is a
     read path, not an act of authority over content. Filing a report
     mutates no record, consumes no licence and grants nothing; blocking
     it would have punished the withdrawal by taking away the one route
     the person has for saying something is wrong. */
  function contentHelp(area, role) {
    return function (params) {
      var actor = state.contentActor(params.actorId);
      if (!actor || actor.role !== role) { return XRSLP.screens.notFound(); }
      var experiments = state.contentRecords().filter(function (rec) {
        if (state.actorCoversRecord(actor.id, rec)) { return true; }
        return role === state.CONTENT_ROLE.VENDOR && state.canViewHistoricalRecord(rec, actor.id);
      }).map(function (rec) { return { id: rec.id, name: rec.name }; });

      var ctx = {
        kind: role, id: actor.id, name: actor.name,
        roleLabel: state.contentRoleLabel(role),
        tenantId: null, tenantName: actor.organisation,
        experiments: experiments, technologies: []
      };
      var out = sup.helpScreen(ctx);
      return {
        area: area, title: 'Help and support', html: out.html,
        contentActor: actor, navKey: 'help',
        after: function () { sup.bindHelp(ctx); }
      };
    };
  }

  XRSLP.screens.vendorHelp = contentHelp('vendor', state.CONTENT_ROLE.VENDOR);
  XRSLP.screens.reviewerHelp = contentHelp('review', state.CONTENT_ROLE.REVIEWER);
  XRSLP.screens.managerHelp = contentHelp('content', state.CONTENT_ROLE.MANAGER);
})();
