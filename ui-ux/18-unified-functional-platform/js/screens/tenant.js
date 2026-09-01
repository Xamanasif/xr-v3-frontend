/* ============================================================
   Unified Functional Platform — Tenant workspace (Institute Admin /
   Tenant Admin — one role, STK31-02).

   This slice proves the access handoff: the tenant sees the content,
   technologies, licence quantity and term activated through approved
   requests. Learner/group assignment, people provisioning and the
   rest of the tenant workspace arrive in later slices and are shown
   as gaps, never as disabled controls.
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

  function accessHref(tenantId) { return '#/tenant/' + encodeURIComponent(tenantId) + '/content-access'; }

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
    if (tenant) { return { redirect: accessHref(tenant.id) }; }

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
              '<div class="ri-tech"><a class="btn sm sec" href="' + accessHref(t.id) + '">Open workspace</a></div></li>';
          }).join('') + '</ul>') : '') +
      ui.protoNote('The tenant this view resolves to follows the requester scenario chosen in Prototype controls.') +
      '</div>';

    return { title: 'Tenant workspace', html: html, tenant: null, navKey: null };
  };

  /* ---------------- content access ---------------- */
  XRSLP.screens.tenantContentAccess = function (params) {
    var tenant = state.tenantById(params.tenantId);
    if (!tenant) {
      return {
        title: 'Tenant not found',
        tenant: null,
        navKey: null,
        html: ui.phead('Tenant not found') +
          '<div class="tablecard">' + ui.emptyState({
            icon: 'alertCirc',
            title: 'No tenant with this identifier',
            body: 'The address may be stale — the tenant may not exist in the current prototype data.',
            actionsHTML: '<a class="btn pri" href="#/tenant">Resolve my tenant workspace</a>'
          }) + '</div>'
      };
    }

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
        var covers = rec.items.map(function (item) {
          var ctx = data.contextOf(item.experimentId);
          return '<div class="cvrow"><span class="cv-ic">' + ui.ic('flask') + '</span>' +
            '<div class="cv-body">' +
            '<div class="cv-ctx">' + (ctx ? esc(ctx.grouping.name) + ' › ' + esc(ctx.course.name) : '') + '</div>' +
            '<div class="cv-t">' + esc(ctx ? ctx.experiment.name : item.experimentId) + '</div></div>' +
            '<div class="cv-tech">' + ui.techBadges(item.technologies) + '</div></div>';
        }).join('');
        return '<section class="accessrec" aria-label="Access record ' + esc(rec.id) + '">' +
          '<div class="ar-head"><h2>Access record ' + esc(rec.id) + '</h2>' +
          '<span class="ar-ref">from request ' + esc(rec.requestId) + '</span>' +
          '<div class="ar-badges">' + ui.badge('b-outline', null, rec.accessContext) + ui.termBadge(termState) + '</div>' +
          '</div>' +
          '<div class="ar-body">' +
          '<div class="kv" style="margin-bottom:14px">' +
          '<div class="k">Users / licences approved</div><div class="v">' + rec.quantity + '</div>' +
          '<div class="k">Access term</div><div class="v">' + esc(termDef ? termDef.label : rec.term) +
          (rec.endsOn ? ' — until ' + esc(util.fmtDate(rec.endsOn)) : '') + '</div>' +
          '<div class="k">Activated</div><div class="v">' + esc(util.fmtDate(rec.startsOn)) + '</div>' +
          '<div class="k">Granted by</div><div class="v">' + esc(rec.recordedBy) + '</div>' +
          '</div>' +
          '<h3 style="font-size:13.5px;font-weight:640;margin:0 0 4px">Approved experiments &amp; technologies</h3>' +
          '<div class="covers">' + covers + '</div>' +
          '<div style="margin-top:14px">' +
          ui.gapNote('NEXT SLICE',
            '<strong>Learner assignment.</strong> Assigned students, remaining allocation, Faculty mapping and ' +
            'student/group assignment arrive in the next implementation slice. No learner assignments exist yet ' +
            'for this access record — holding tenant access does not by itself entitle any learner.') +
          '</div>' +
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
