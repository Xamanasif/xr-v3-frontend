/* ============================================================
   Unified Functional Platform — Super Admin workspace.
   Access request queue · request decision · institutions list.

   The approve action follows the confirmed branches (STK31-19/20):
     internal → ACTIVE immediately (no payment step anywhere)
     external → APPROVED_PAYMENT_REQUIRED (no access yet)
   Rejection / return flows are not source-supported for this slice
   and are deliberately absent — the gap is shown as a gap.
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

  var queueFilter = 'all';

  function detailHref(id) { return '#/platform/requests/' + encodeURIComponent(id); }

  /* ---------------- request queue ---------------- */
  XRSLP.screens.platformRequests = function () {
    var all = state.requests().slice().reverse();
    var submittedCount = all.filter(function (r) { return r.status === state.STATUS.SUBMITTED; }).length;

    var filtered = all.filter(function (r) {
      if (queueFilter === 'all') { return true; }
      return r.status === queueFilter;
    });

    var options = [
      { v: 'all', label: 'All states (' + all.length + ')' },
      { v: state.STATUS.SUBMITTED, label: 'Submitted (' + all.filter(function (r) { return r.status === state.STATUS.SUBMITTED; }).length + ')' },
      { v: state.STATUS.APPROVED_PAYMENT_REQUIRED, label: 'Approved — payment required (' + all.filter(function (r) { return r.status === state.STATUS.APPROVED_PAYMENT_REQUIRED; }).length + ')' },
      { v: state.STATUS.ACTIVE, label: 'Active (' + all.filter(function (r) { return r.status === state.STATUS.ACTIVE; }).length + ')' }
    ].map(function (o) {
      return '<option value="' + esc(o.v) + '"' + (queueFilter === o.v ? ' selected' : '') + '>' + esc(o.label) + '</option>';
    }).join('');

    var body;
    if (!all.length) {
      body = ui.emptyState({
        icon: 'doc',
        title: 'No institutional requests yet',
        body: 'Requests submitted from the public catalogue appear here for review. Nothing is awaiting a decision.'
      });
    } else if (!filtered.length) {
      body = ui.emptyState({
        icon: 'search',
        title: 'No requests in this state',
        body: 'No request currently matches the selected state filter.',
        actionsHTML: '<button class="btn sec sm" type="button" id="q-all">Show all states</button>'
      });
    } else {
      var rows = filtered.map(function (r) {
        return '<tr>' +
          '<td data-label="Request"><a class="rowlink" href="' + detailHref(r.id) + '">' +
          '<span class="tmain">' + esc(r.id) + '</span>' +
          '<span class="tsub">Submitted ' + esc(util.fmtDate(r.submittedAt)) + '</span></a></td>' +
          '<td data-label="Institution"><span class="tmain" style="font-weight:500">' + esc(r.institution.name) + '</span>' +
          '<span class="tsub">' + esc(r.institution.kind === 'internal' ? 'Internal' : 'External') + '</span></td>' +
          '<td data-label="Access context">' + esc(r.institution.accessContext) + '</td>' +
          '<td data-label="Users" class="num">' + r.quantity + '</td>' +
          '<td data-label="Term">' + esc((data.term(r.term) || {}).label || r.term) + '</td>' +
          '<td data-label="Experiments" class="num">' + r.items.length + '</td>' +
          '<td data-label="Status">' + ui.statusBadge(r.status) + '</td>' +
          '<td class="cell-actions"><a class="btn sm ' + (r.status === state.STATUS.SUBMITTED ? 'pri' : 'sec') + '" href="' + detailHref(r.id) + '">' +
          (r.status === state.STATUS.SUBMITTED ? 'Review' : 'Open') + '</a></td>' +
          '</tr>';
      }).join('');
      body = '<div class="tscroll"><table class="dt">' +
        '<caption class="sr-only">Institutional access requests</caption>' +
        '<thead><tr><th scope="col">Request</th><th scope="col">Institution</th><th scope="col">Access context</th>' +
        '<th scope="col">Users</th><th scope="col">Term</th><th scope="col">Experiments</th><th scope="col">Status</th>' +
        '<th scope="col"><span class="sr-only">Actions</span></th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table></div>';
    }

    var html =
      ui.phead('Access requests',
        submittedCount ? submittedCount + ' ' + util.plural(submittedCount, 'request') + ' awaiting a decision' :
          'No requests awaiting a decision') +
      '<div class="tablecard">' +
      '<div class="listbar">' +
      '<label for="q-state">State' +
      '<select id="q-state">' + options + '</select></label>' +
      '<span class="lcount">' + filtered.length + ' of ' + all.length + ' shown</span>' +
      '</div>' +
      body +
      '</div>';

    return {
      title: 'Access requests',
      html: html,
      navKey: 'requests',
      after: function () {
        var sel = document.getElementById('q-state');
        if (sel) {
          sel.addEventListener('change', function () {
            queueFilter = sel.value;
            XRSLP.render(true);
            var again = document.getElementById('q-state');
            if (again) { again.focus(); }
            ui.announce('Request list filtered.');
          });
        }
        var qAll = document.getElementById('q-all');
        if (qAll) {
          qAll.addEventListener('click', function () {
            queueFilter = 'all';
            XRSLP.render(true);
            ui.focusMain(true);
          });
        }
      }
    };
  };

  /* ---------------- request detail + decision ---------------- */
  XRSLP.screens.platformRequestDetail = function (params) {
    var r = state.request(params.id);
    if (!r) {
      return {
        title: 'Request not found',
        navKey: 'requests',
        html: ui.crumbs([{ label: 'Access requests', href: '#/platform/requests' }, { label: 'Not found' }]) +
          '<div class="tablecard">' + ui.emptyState({
            icon: 'alertCirc',
            title: 'Request not found',
            body: 'No institutional request exists with this identifier in the prototype data.',
            actionsHTML: '<a class="btn pri" href="#/platform/requests">Back to access requests</a>'
          }) + '</div>'
      };
    }

    var termLabel = (data.term(r.term) || {}).label || r.term;

    var itemList = r.items.map(function (item) {
      var ctx = data.contextOf(item.experimentId);
      return '<div class="ri"><div class="ri-body">' +
        '<div class="ri-ctx">' + (ctx ? esc(ctx.grouping.name) + ' › ' + esc(ctx.course.name) : '') + '</div>' +
        '<div class="ri-t">' + esc(ctx ? ctx.experiment.name : item.experimentId) + '</div></div>' +
        '<div class="ri-tech">' + ui.techBadges(item.technologies) + '</div></div>';
    }).join('');

    var timeline = '<div class="timeline">' + r.history.map(function (h, i) {
      var dotCls = i === r.history.length - 1 ?
        (r.status === state.STATUS.ACTIVE ? 'good' : r.status === state.STATUS.APPROVED_PAYMENT_REQUIRED ? 'warn' : 'info') : 'good';
      return '<div class="tl-item"><span class="tl-dot ' + dotCls + '">' + ui.ic(i === 0 ? 'doc' : 'check') + '</span>' +
        '<div class="tl-body"><div class="tl-action">' + esc(h.event) + '</div>' +
        '<div class="tl-who">' + esc(h.who) + ' · ' + esc(util.fmtDateTime(h.at)) + '</div></div></div>';
    }).join('') + '</div>';

    var decisionHTML = '';
    if (r.status === state.STATUS.SUBMITTED) {
      var consequence = r.paymentRequired ?
        'External institution (access context “' + r.institution.accessContext + '”): approval moves the request to ' +
        '“Approved — payment required”. Tenant access is activated only after payment completes.' :
        'Internal institution (access context “' + r.institution.accessContext + '”): approval activates tenant access ' +
        'immediately. No payment step exists on this route.';
      decisionHTML =
        '<div class="decidebar">' +
        '<span class="db-note">' + esc(consequence) + '</span>' +
        '<button class="btn pri" type="button" id="req-approve">' + ui.ic('check') + 'Approve request</button>' +
        '</div>';
    } else if (r.status === state.STATUS.APPROVED_PAYMENT_REQUIRED) {
      decisionHTML =
        '<div class="decidebar"><span class="db-note">Approved. Awaiting payment from the institution — ' +
        'tenant access is not active yet and no entitlement exists.</span></div>';
    } else if (r.status === state.STATUS.ACTIVE) {
      var tenant = r.tenantId ? state.tenantById(r.tenantId) : null;
      decisionHTML =
        '<div class="decidebar"><span class="db-note">Access is active' +
        (tenant ? ' for ' + esc(tenant.name) : '') + '. The tenant&rsquo;s approved content is recorded under ' +
        '<a href="#/platform/institutions">Institutions</a>.</span></div>';
    }

    var html =
      ui.crumbs([{ label: 'Access requests', href: '#/platform/requests' }, { label: r.id }]) +
      ui.phead('Request ' + r.id, esc(r.institution.name) + ' · submitted ' + esc(util.fmtDate(r.submittedAt)),
        null, ui.statusBadge(r.status)) +
      '<div class="grid-rail">' +
      '<div class="stack">' +
      '<section class="card">' +
      '<div class="chead"><h2>Institution</h2></div>' +
      '<div class="cbody"><div class="kv">' +
      '<div class="k">Institution</div><div class="v">' + esc(r.institution.name) + '</div>' +
      '<div class="k">Classification</div><div class="v">' + esc(r.institution.kind === 'internal' ? 'Internal (prototype seed)' : 'External (prototype seed)') + '</div>' +
      '<div class="k">Access context</div><div class="v">' + esc(r.institution.accessContext) + '</div>' +
      '<div class="k">Contact (SPOC)</div><div class="v">' + esc(r.institution.contactName) + ' · ' + esc(r.institution.contactEmail) + '</div>' +
      '<div class="k">Payment</div><div class="v">' + (r.paymentRequired ? 'Required after approval' : 'Not required — no payment step on this route') + '</div>' +
      '</div></div></section>' +
      '<section class="card">' +
      '<div class="chead"><h2>Requested access</h2></div>' +
      '<div class="cbody"><div class="kv">' +
      '<div class="k">Users / licences</div><div class="v">' + r.quantity + '</div>' +
      '<div class="k">Access term</div><div class="v">' + esc(termLabel) + '</div>' +
      '<div class="k">Experiments</div><div class="v">' + r.items.length + '</div>' +
      '</div>' +
      '<h3 style="font-size:13.5px;font-weight:640;margin:14px 0 4px">Selected content &amp; technologies</h3>' +
      '<div class="reqitems">' + itemList + '</div>' +
      '</div>' +
      decisionHTML +
      '</section>' +
      '</div>' +
      '<div class="stack">' +
      ui.card('History', timeline) +
      ui.gapNote('NOT IN THIS SLICE',
        'Request-more-information and other decision outcomes are not implemented in this vertical slice; ' +
        'only approval is. Absent capabilities are shown as gaps, never as disabled controls.') +
      '</div>' +
      '</div>';

    return {
      title: 'Request ' + r.id,
      html: html,
      navKey: 'requests',
      after: function () {
        var btn = document.getElementById('req-approve');
        if (btn) {
          btn.addEventListener('click', function () {
            var consequenceHTML = r.paymentRequired ?
              '<p>Approve institutional request <strong>' + esc(r.id) + '</strong> from <strong>' + esc(r.institution.name) + '</strong>?</p>' +
              '<div class="consequence">' + ui.ic('card') + '<span>External route: the request moves to ' +
              '<strong>Approved — payment required</strong>. Tenant access activates only after payment completes.</span></div>' :
              '<p>Approve institutional request <strong>' + esc(r.id) + '</strong> from <strong>' + esc(r.institution.name) + '</strong>?</p>' +
              '<div class="consequence">' + ui.ic('check') + '<span>Internal route (' + esc(r.institution.accessContext) + '): ' +
              'tenant access activates <strong>immediately</strong> — there is no payment step.</span></div>';
            ui.openDialog({
              title: 'Approve request ' + r.id + '?',
              bodyHTML: consequenceHTML,
              okLabel: 'Approve',
              onConfirm: function () {
                var updated = state.approveRequest(r.id);
                if (updated) {
                  ui.toast('Request ' + updated.id + ' approved' +
                    (updated.status === state.STATUS.ACTIVE ? ' — tenant access activated.' : ' — awaiting payment.'));
                }
                XRSLP.render(false);
              }
            });
          });
        }
      }
    };
  };

  /* ---------------- institutions (tenants) ---------------- */
  XRSLP.screens.platformInstitutions = function () {
    var tenants = state.tenants();

    var rows = tenants.map(function (t) {
      var access = state.accessForTenant(t.id);
      return '<tr>' +
        '<td data-label="Institution"><span class="tmain">' + esc(t.name) + '</span>' +
        '<span class="tsub">' + esc(t.origin) + '</span></td>' +
        '<td data-label="Classification">' + esc(t.kind === 'internal' ? 'Internal' : 'External') + '</td>' +
        '<td data-label="Access context">' + esc(t.accessContext) + '</td>' +
        '<td data-label="Active access records" class="num">' + access.length + '</td>' +
        '<td data-label="Status">' + ui.badge('b-success', 'check', 'Active') + '</td>' +
        '<td class="cell-actions"><a class="btn sm sec" href="#/tenant/' + encodeURIComponent(t.id) + '/content-access">View content access</a></td>' +
        '</tr>';
    }).join('');

    var html =
      ui.phead('Institutions', tenants.length + ' ' + util.plural(tenants.length, 'tenant') + ' on the platform') +
      '<div class="tablecard"><div class="tscroll">' +
      '<table class="dt"><caption class="sr-only">Platform tenants</caption>' +
      '<thead><tr><th scope="col">Institution</th><th scope="col">Classification</th><th scope="col">Access context</th>' +
      '<th scope="col">Active access records</th><th scope="col">Status</th>' +
      '<th scope="col"><span class="sr-only">Actions</span></th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div></div>' +
      '<div style="margin-top:16px">' +
      ui.gapNote('NOT IN THIS SLICE',
        'Tenant governance — creation outside a request, Tenant Admin assignment, deactivation, institution ' +
        'profile/report — arrives in later implementation slices. This list is read-only visibility. ' +
        '“View content access” opens the tenant&rsquo;s workspace view of its activated content.') +
      '</div>';

    return { title: 'Institutions', html: html, navKey: 'institutions' };
  };
})();
