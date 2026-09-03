/* ============================================================
   Unified Functional Platform — shared SUPPORT / HELP surface.

   ONE implementation of "report a technical issue and see what state
   the report is in", used by every workspace that has a Help
   destination: Student · Faculty · Tenant Admin · Vendor · Academic
   Reviewer · Content Manager. The Super Admin side of the same records
   — the queue, the detail and the resolution — lives in the platform
   screens, because that is a different job with a different authority.

   WCAG 2.2 SC 3.2.6 *Consistent Help* is a Level A criterion, and
   `12_SUPPORT_AND_OPERATIONS_MODEL.md` §4 records that Help was present
   in the early batches, dropped by one and demoted by another. Help
   therefore sits in the SAME place in every workspace navigation here.

   ⛔ WHAT THIS DELIBERATELY DOES NOT CONTAIN (STK31-39, all four
   explicitly prohibited): an SLA or response-time promise · a priority
   or severity formula · an external ticketing provider · a chatbot.
   There is also no notification of any kind: no source describes one
   for support, so the state is surfaced in the product and nothing
   here claims a message was sent to anybody.

   A support request changes NO entitlement, NO licence, NO assignment
   and NO content state. It writes its own record and stops.
   ============================================================ */

window.XRSLP = window.XRSLP || {};

XRSLP.supportUI = (function () {
  'use strict';

  var esc = XRSLP.util.esc;
  var util = XRSLP.util;
  var ui = XRSLP.ui;
  var data = XRSLP.data;
  var state = XRSLP.state;

  /* ---------------- routes ----------------
     One Help destination per workspace, at the same position in each
     workspace's navigation. */
  var href = {
    learn:   function (id) { return '#/learn/' + encodeURIComponent(id) + '/help'; },
    faculty: function (id) { return '#/faculty/' + encodeURIComponent(id) + '/help'; },
    tenant:  function (id) { return '#/tenant/' + encodeURIComponent(id) + '/help'; },
    vendor:  function (id) { return '#/vendor/' + encodeURIComponent(id) + '/help'; },
    review:  function (id) { return '#/review/' + encodeURIComponent(id) + '/help'; },
    content: function (id) { return '#/content/' + encodeURIComponent(id) + '/help'; }
  };

  function statusBadge(t) {
    var m = state.supportStatusMeta(t.status);
    return ui.badge(m.badge, m.icon, m.label);
  }

  /* ---------------- the reporter's own list ---------------- */
  function ticketList(tickets, opts) {
    opts = opts || {};
    if (!tickets.length) {
      return ui.emptyState({
        icon: 'check', heading: opts.heading || 'h3',
        title: opts.emptyTitle || 'You have not reported anything',
        body: opts.emptyBody ||
          'Reports you submit appear here with the state they are in, so you always know whether ' +
          'the platform has dealt with them.'
      });
    }
    return '<ul class="tickets">' + tickets.map(function (t) {
      return '<li class="tk">' +
        '<div class="tk-h"><span class="tk-id">' + esc(t.id) + '</span>' + statusBadge(t) + '</div>' +
        '<div class="tk-t">' + esc(t.subject) + '</div>' +
        '<div class="tk-m">' + esc(state.supportCategoryLabel(t.category)) +
        ' · reported ' + esc(util.fmtDateTime(t.createdAt)) +
        (opts.showReporter && t.requesterName ? ' · by ' + esc(t.requesterName) : '') + '</div>' +
        '<p class="tk-d">' + esc(t.description) + '</p>' +
        (t.status === state.SUPPORT_STATUS.RESOLVED
          ? '<div class="tk-r">' + ui.ic('check', 'sm') +
            '<div><strong>Resolved</strong> ' + esc(util.fmtDateTime(t.resolvedAt)) +
            '<p>' + esc(t.resolutionNote) + '</p></div></div>'
          : '<div class="tk-w">' + ui.ic('clock', 'sm') +
            '<span>Open with the platform team. This page is where the outcome appears.</span></div>') +
        '</li>';
    }).join('') + '</ul>';
  }

  /* ---------------- the report form ----------------
     `ctx.experiments` is offered only where the workspace genuinely
     knows which experiments the reporter can reach; a role with no
     experiment context simply does not get the field. */
  function reportForm(ctx) {
    var cats = state.SUPPORT_CATEGORIES.map(function (c) {
      return '<option value="' + esc(c.id) + '">' + esc(c.label) + '</option>';
    }).join('');
    var expField = '';
    if (ctx.experiments && ctx.experiments.length) {
      expField =
        '<div class="field" id="sp-experiment"><label for="sp-experiment-i">Experiment</label>' +
        '<select id="sp-experiment-i"><option value="">— not about a specific experiment —</option>' +
        ctx.experiments.map(function (e) {
          return '<option value="' + esc(e.id) + '">' + esc(e.name) + '</option>';
        }).join('') + '</select></div>';
    }
    var techField = '';
    if (ctx.technologies && ctx.technologies.length) {
      techField =
        '<div class="field" id="sp-technology"><label for="sp-technology-i">Technology</label>' +
        '<select id="sp-technology-i"><option value="">— not technology specific —</option>' +
        data.sortTech(ctx.technologies).map(function (t) {
          var d = data.TECHNOLOGIES[t];
          return '<option value="' + esc(t) + '">' + esc(d ? d.name : t) + '</option>';
        }).join('') + '</select></div>';
    }

    return '<form id="sp-form" novalidate>' +
      /* No aria-live here. `ui.showErrors` writes a role="alert" into
         this container and focuses it; a live region around an alert
         that is also focused announces the same message up to three
         times. The alert carries the announcement on its own. */
      '<div class="form-errors"></div>' +
      '<div class="field" id="sp-category"><label for="sp-category-i">What kind of issue is it? ' +
      '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
      '<select id="sp-category-i"><option value="">— choose —</option>' + cats + '</select>' +
      '<p class="hint">These are the issue kinds the platform handles. Nothing here is scored, ' +
      'prioritised or routed automatically.</p></div>' +
      '<div class="field" id="sp-subject"><label for="sp-subject-i">Short title ' +
      '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
      '<input id="sp-subject-i" type="text" maxlength="120" autocomplete="off"></div>' +
      expField + techField +
      '<div class="field" id="sp-description"><label for="sp-description-i">What were you doing, and what happened? ' +
      '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
      '<textarea id="sp-description-i" rows="5"></textarea></div>' +
      '<div class="formact"><button class="btn pri" type="submit">Report the issue</button>' +
      '<span class="formnote">Your name, your role' +
      (ctx.tenantId ? ' and your institution' : '') +
      ' are recorded with the report, because the platform already knows them.</span></div>' +
      '</form>';
  }

  /* What the reporter is told about how this works. It states the
     limits plainly rather than implying a service that does not exist. */
  function honestyPanel() {
    return ui.alertBox('info', 'How this works',
      '<p>Your report goes to the platform team, who can see it, understand which experiment, ' +
      'technology and institution it concerns, and resolve it. You will see the outcome on this page.</p>' +
      '<p style="margin-top:6px">No response time is promised, no priority is assigned, and ' +
      '<strong>no email, SMS or notification is sent</strong> — this page is where the state lives.</p>');
  }

  /* ---------------- the whole Help screen, for any workspace ----------------
     `ctx` = { kind, id, name, roleLabel, tenantId, experiments[], technologies[], heading } */
  function helpScreen(ctx) {
    var mine = state.ticketsForRequester(ctx.kind, ctx.id);
    var open = mine.filter(function (t) { return t.status === state.SUPPORT_STATUS.OPEN; }).length;

    var html =
      ui.phead('Help and support',
        open ? open + ' ' + util.plural(open, 'report') + ' open' : 'Report a technical issue') +
      '<div class="grid-rail">' +
      '<div class="stack">' +
      ui.card('Report a technical issue', reportForm(ctx), null, 'h2') +
      ui.card(ctx.listTitle || 'Your reports', ticketList(mine, {
        heading: 'h3',
        showReporter: !!ctx.listShowReporter,
        emptyTitle: ctx.listEmptyTitle,
        emptyBody: ctx.listEmptyBody
      }), null, 'h2') +
      '</div>' +
      '<div class="stack">' +
      honestyPanel() +
      ui.card('What is recorded',
        '<div class="kv">' +
        '<div class="k">Reported by</div><div class="v">' + esc(ctx.name) + '</div>' +
        '<div class="k">Role</div><div class="v">' + esc(ctx.roleLabel) + '</div>' +
        (ctx.tenantName
          ? '<div class="k">' + (ctx.tenantId ? 'Institution' : 'Organisation') + '</div>' +
            '<div class="v">' + esc(ctx.tenantName) +
            (ctx.tenantId ? '' : ' <span class="muted">— recorded for context; this report is not ' +
              'attributed to an institution</span>') + '</div>'
          : '') +
        '</div>' +
        '<p class="cardfoot">Only what the platform already holds. Nothing else is collected.</p>', null, 'h2') +
      ui.gapNote('NOT IN THIS BUILD',
        'Manuals and guides, a knowledge base, and any escalation path are not part of this ' +
        'capability. No external ticketing provider is integrated, and no chatbot exists.') +
      '</div></div>';

    return { html: html, tickets: mine };
  }

  /* Binds the form. `ctx` is the same object the screen rendered with. */
  function bindHelp(ctx) {
    var form = document.getElementById('sp-form');
    if (!form) { return; }
    var submitting = false;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (submitting) { return; }
      var expEl = document.getElementById('sp-experiment-i');
      var techEl = document.getElementById('sp-technology-i');
      var fields = {
        category: (document.getElementById('sp-category-i') || {}).value || '',
        subject: (document.getElementById('sp-subject-i') || {}).value || '',
        description: (document.getElementById('sp-description-i') || {}).value || '',
        experimentId: expEl ? (expEl.value || null) : null,
        technology: techEl ? (techEl.value || null) : null
      };
      var errs = state.validateSupportTicket(fields);
      if (!ui.showErrors(form, errs, 'Please complete the report')) { return; }
      submitting = true;
      var res = state.createSupportTicket({
        kind: ctx.kind, id: ctx.id, name: ctx.name,
        roleLabel: ctx.roleLabel, tenantId: ctx.tenantId || null
      }, fields);
      if (!res.ok) { submitting = false; ui.showErrors(form, res.errors, 'Please complete the report'); return; }
      ui.toast('Issue ' + res.ticket.id + ' reported. It is now with the platform team.');
      XRSLP.render(false);
    });
  }

  return {
    href: href, statusBadge: statusBadge,
    ticketList: ticketList, reportForm: reportForm, honestyPanel: honestyPanel,
    helpScreen: helpScreen, bindHelp: bindHelp
  };
})();
