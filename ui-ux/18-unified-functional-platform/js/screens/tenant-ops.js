/* ============================================================
   Unified Functional Platform — Tenant Admin · DEVICE REQUESTS.

   Implementation 07.2, stakeholder rule C:

     "Any request from institution should come through Tenant Admin.
      He will be our POC to facilitate and final approval comes to
      Super Admin."

   The chain is therefore Student → INSTITUTE / TENANT ADMIN → Super
   Admin, and this file is the middle hop. A request raised by a
   student inside this institution lands here FIRST; the Tenant Admin
   reads it and forwards it; the platform team takes the final
   decision. Nothing on either screen in this file approves, declines
   or decides anything, and neither screen offers a control that
   pretends otherwise.

   ⚠ WHAT FORWARDING DOES. It moves the request one hop and writes one
   history line. It consumes no licence, grants no Experiment, adds no
   technology, touches no assignment and changes no assessment result —
   the same guarantee the Super Admin's own decision surface gives, and
   for the same reason: a device is a delivery relationship, not an
   entitlement.

   ⚠ NO DEVICE REGISTRY EXISTS ANYWHERE IN THIS BUILD. The platform
   holds a device transfer APPROVAL with no device RECORD behind it, so
   both devices shown here are exactly the free text the student typed.
   There is no serial number, no model, no compatibility certification,
   no MDM and no authentication step on this path, and none is invented
   to make the screen look more complete than the capability is.

   ⚠ NOTHING IS SENT. This build has no notification channel of any
   kind, so no copy here claims anybody was told anything. The state is
   surfaced in the product: the student sees it in their own workspace,
   the platform team sees it on its operations list.
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
  var T = XRSLP.tenantUI;

  /* THE TECHNOLOGIES ONE REQUEST COVERS — read through the same pair of
     state functions the Student's page and the Super Admin's queue read
     them through, so the three surfaces cannot drift apart on what was
     actually asked for.

     A request that meant "every device-based technology I hold" says so
     rather than showing one badge, which would read as a narrower
     request than the student made. */
  function techCell(rec) {
    var list = state.transferTechnologies(rec);
    if (!list.length) { return '<span class="muted">Not specified</span>'; }
    return ui.techBadges(list) +
      (state.transferCoversAll(rec)
        ? '<span class="tsub">Every device-based technology this student holds</span>'
        : '');
  }

  /* The same answer with the technology NAMES spelled out, for the one
     place there is room for them. */
  function techDetail(rec) {
    var list = state.transferTechnologies(rec);
    if (!list.length) { return '<span class="muted">Not specified</span>'; }
    var names = list.map(function (t) {
      var def = data.TECHNOLOGIES[t];
      return def ? def.name : t;
    }).join(' · ');
    return ui.techBadges(list) + ' ' + esc(names) +
      (state.transferCoversAll(rec)
        ? ' <span class="muted">· every device-based technology this student holds</span>'
        : '');
  }

  function requestTable(tenant, list, captionText) {
    return '<div class="tscroll"><table class="dt">' +
      '<caption class="sr-only">' + esc(captionText) + '</caption>' +
      '<thead><tr><th scope="col">Request</th><th scope="col">Student</th>' +
      '<th scope="col">Technologies</th><th scope="col">Current device</th>' +
      '<th scope="col">Replacement device</th><th scope="col">Status</th>' +
      '<th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' +
      list.map(function (rec) {
        var m = state.transferStatusMeta(rec.status);
        var waiting = rec.status === state.TRANSFER_STATUS.SUBMITTED;
        return '<tr>' +
          '<td data-label="Request"><a class="rowlink" href="' + T.href.deviceRequest(tenant.id, rec.id) + '">' +
          '<span class="tmain">' + esc(rec.id) + '</span>' +
          '<span class="tsub">' + esc(util.fmtDate(rec.createdAt)) + '</span></a></td>' +
          '<td data-label="Student">' + esc(rec.personName) + '</td>' +
          '<td data-label="Technologies">' + techCell(rec) + '</td>' +
          /* The devices are the student's own words, shown unedited. The
             platform has nothing else to show: there is no registry to
             resolve either label against. */
          '<td data-label="Current device">' + esc(rec.currentDevice) + '</td>' +
          '<td data-label="Replacement device">' + esc(rec.newDevice) + '</td>' +
          '<td data-label="Status">' + ui.badge(m.badge, m.icon, m.label) + '</td>' +
          '<td class="cell-actions"><a class="btn sm ' + (waiting ? 'pri' : 'sec') + '" href="' +
          T.href.deviceRequest(tenant.id, rec.id) + '">' + (waiting ? 'Review' : 'Open') +
          '<span class="sr-only"> device request ' + esc(rec.id) + '</span></a></td>' +
          '</tr>';
      }).join('') + '</tbody></table></div>';
  }

  /* ============================================================
     DEVICE REQUESTS — the institution's queue.
     ============================================================ */
  XRSLP.screens.tenantDeviceRequests = function (params) {
    /* READ-ONLY, so no write guard. A deactivated institution keeps
       every device request it ever raised fully readable — deactivation
       hides no history anywhere in this build. Forwarding is the only
       thing it withdraws, and that control lives on the detail screen,
       which does carry the guard. */
    var r = T.requireTenant(params, 'device-requests');
    if (!r.tenant) { return r.fail; }
    var tenant = r.tenant;

    var waiting = state.transfersAwaitingTenant(tenant.id);
    var all = state.transfersForTenant(tenant.id);
    /* "Everything else" is defined by SUBTRACTION from the same two
       reads the navigation count uses, so the two sections together are
       always exactly what the institution has raised — never a record
       twice, and never one missing. */
    var waitingIds = {};
    waiting.forEach(function (rec) { waitingIds[rec.id] = true; });
    var rest = all.filter(function (rec) { return !waitingIds[rec.id]; });
    var admin = state.actingTenantAdmin(tenant.id);

    var body;
    if (!all.length) {
      body = '<div class="tablecard">' + ui.emptyState({
        icon: 'monitor',
        title: 'No device requests from this institution',
        body: 'A student whose experiments are delivered as an authorised package on a device raises a ' +
          'replacement request from their own workspace. It arrives here first, because the Institute / ' +
          'Tenant Admin is this institution’s point of contact for it.'
      }) + '</div>';
    } else {
      body =
        ui.card('Waiting on you',
          (waiting.length
            ? requestTable(tenant, waiting,
                'Device requests waiting on the Institute / Tenant Admin of ' + tenant.name)
            : ui.emptyState({
                icon: 'check', heading: 'h3',
                title: 'Nothing is waiting on you',
                body: 'Every device request raised inside this institution has already been forwarded or ' +
                  'decided. They are all listed below.'
              })),
          waiting.length + ' ' + util.plural(waiting.length, 'request'), 'h2') +
        ui.card('Forwarded or decided',
          (rest.length
            ? requestTable(tenant, rest, 'Device requests already forwarded or decided in ' + tenant.name)
            : ui.emptyState({
                icon: 'monitor', heading: 'h3',
                title: 'Nothing forwarded yet',
                body: 'A request appears here once you have forwarded it, and it keeps its place once the ' +
                  'platform team has decided it.'
              })),
          rest.length + ' ' + util.plural(rest.length, 'request'), 'h2');
    }

    /* ⚠ THE "FORWARDING CHANGES NOTHING" GUARANTEE IS STATED ONCE PER
       DECISION, NOT FOUR TIMES PER PAGE. It used to appear in this intro
       alert, again in the detail screen's decide bar, again as a
       three-item card in that screen's sidebar, and again in the
       confirmation dialog — four near-identical wordings between an admin
       and one button. It belongs where the decision is taken: the dialog.
       Here the reader only needs to know whose queue this is. */
    var html =
      ui.phead('Device requests',
        'Raised by students in ' + esc(tenant.name) + '. They arrive here first — you review and forward; ' +
        'the platform team takes the final decision.') +
      '<div class="stack">' +
      (admin
        ? ''
        : ui.alertBox('warning', 'Nothing can be forwarded from here yet',
            '<p>No Institute / Tenant Admin has been assigned to ' + esc(tenant.name) + ', and forwarding ' +
            'records who performed it. The Super Admin assigns that person; until then every request stays ' +
            'exactly where it is and nothing about it is lost.</p>')) +
      body +
      '</div>';

    return {
      title: 'Device requests — ' + tenant.name,
      html: html,
      tenant: tenant,
      navKey: 'device-requests'
    };
  };

  /* ============================================================
     ONE DEVICE REQUEST — the POC hop itself.
     ============================================================ */
  XRSLP.screens.tenantDeviceRequest = function (params) {
    /* `write: true` on what is mostly a reading screen, deliberately.
       The reason a Tenant Admin opens one of these is to forward it,
       and a deactivated institution cannot: `escalateDeviceTransfer`
       refuses it in the state layer. Meeting the standard refusal is
       honest; rendering the whole record with a Forward button that
       would be silently refused is not. No history is hidden by this —
       the list screen carries no guard and stays fully readable. */
    var r = T.requireTenant(params, 'device-requests',
      { write: true, what: 'Forwarding a device request' });
    if (!r.tenant) { return r.fail; }
    var tenant = r.tenant;

    var rec = state.deviceTransferById(params.id);
    /* A request belonging to a DIFFERENT institution is "not found"
       here, not merely un-forwardable. One institution's administrators
       can never act for another one, and must not be able to read
       another institution's students either. */
    if (!rec || rec.tenantId !== tenant.id) {
      return {
        title: 'Device request not found', tenant: tenant, navKey: 'device-requests',
        html: ui.crumbs([
            { label: 'Device requests', href: T.href.deviceRequests(tenant.id) },
            { label: 'Not found' }
          ]) +
          ui.phead('Device request not found') +
          '<div class="tablecard">' + ui.emptyState({
            icon: 'alertCirc',
            title: 'No device request with this identifier',
            body: 'No device request with this identifier was raised inside ' + tenant.name +
              '. The address may be stale, or the request may belong to another institution — an ' +
              'institution’s administrators can only see their own students’ requests.',
            actionsHTML: '<a class="btn pri" href="' + T.href.deviceRequests(tenant.id) + '">' +
              'Back to device requests</a>'
          }) + '</div>'
      };
    }

    var m = state.transferStatusMeta(rec.status);
    var person = state.personById(rec.personId);
    /* THE ACTOR MUST BE REAL. `escalateDeviceTransfer` refuses to
       forward when the institution has no assigned Tenant Admin,
       because the history line it writes names whoever performed the
       hop and no name is invented to fill it. That state is real and
       reachable, so the screen reads it up front and explains it
       instead of rendering a button that would be refused. */
    var admin = state.actingTenantAdmin(tenant.id);
    var waiting = rec.status === state.TRANSFER_STATUS.SUBMITTED;

    var stateSentence;
    if (rec.status === state.TRANSFER_STATUS.ESCALATED) {
      stateSentence = 'Forwarded ' + util.fmtDateTime(rec.escalatedAt) +
        (rec.escalatedBy ? ' by ' + rec.escalatedBy : '') +
        '. The final decision is the platform team’s and has not been taken yet.';
    } else if (rec.status === state.TRANSFER_STATUS.APPROVED) {
      stateSentence = 'Approved by the platform team ' + util.fmtDateTime(rec.decidedAt) +
        '. The student can see the outcome in their own workspace.';
    } else if (rec.status === state.TRANSFER_STATUS.DECLINED) {
      stateSentence = 'Declined by the platform team ' + util.fmtDateTime(rec.decidedAt) +
        '. The student can see the outcome and the reason in their own workspace.';
    } else {
      stateSentence = 'This request is with you, the Institute / Tenant Admin.';
    }

    var forwardHTML;
    if (waiting && admin) {
      forwardHTML = '<div class="decidebar">' +
        '<span class="db-note">You are the institution&rsquo;s point of contact, not the approver — the ' +
        'platform team takes the final decision.</span>' +
        '<button class="btn pri" type="button" id="td-forward">' + ui.ic('arrowR') +
        'Forward to the platform team</button>' +
        '</div>';
    } else if (waiting) {
      forwardHTML = '<div style="margin-top:14px">' + ui.alertBox('warning',
        'This request cannot be forwarded yet',
        '<p>No Institute / Tenant Admin has been assigned to <strong>' + esc(tenant.name) + '</strong>, and the ' +
        'forwarding step records who performed it. The Super Admin assigns that person. Until then this ' +
        'request stays exactly where it is &mdash; nothing about it has been lost, and the student&rsquo;s ' +
        'entitlement is untouched.</p>') + '</div>';
    } else {
      forwardHTML = '<div class="decidebar"><span class="db-note">' + esc(stateSentence) + '</span></div>';
    }

    /* The history, in the same markup the Super Admin's own request
       detail uses, so one request reads identically on both planes.

       'escalated' is Implementation 07.2's new kind — the POC hop. It
       is neither good news nor a warning but a MOVEMENT, so it takes
       the neutral info tone the submission line already carries, with
       an arrow rather than a tick. */
    var timeline = '<div class="timeline">' + rec.history.map(function (h) {
      var cls = h.kind === 'approved' ? 'good' : h.kind === 'declined' ? 'warn' : 'info';
      var icon = h.kind === 'approved' ? 'check'
        : h.kind === 'declined' ? 'x'
        : h.kind === 'escalated' ? 'arrowR' : 'monitor';
      return '<div class="tl-item"><span class="tl-dot ' + cls + '">' + ui.ic(icon) + '</span>' +
        '<div class="tl-body"><div class="tl-action">' + esc(h.label) + '</div>' +
        '<div class="tl-who">' + esc(h.who) + ' · ' + esc(util.fmtDateTime(h.at)) + '</div>' +
        (h.note ? '<p class="tl-note">' + esc(h.note) + '</p>' : '') +
        '</div></div>';
    }).join('') + '</div>';

    var html =
      ui.crumbs([
        { label: 'Device requests', href: T.href.deviceRequests(tenant.id) },
        { label: rec.id }
      ]) +
      ui.phead('Device request ' + rec.id,
        esc(rec.personName) + ' · ' + esc(tenant.name),
        null, ' ' + ui.badge(m.badge, m.icon, m.label)) +
      '<div class="grid-rail">' +
      '<div class="stack">' +
      '<section class="card"><div class="chead"><h2>What the student asked for</h2></div>' +
      '<div class="cbody"><div class="kv">' +
      '<div class="k">Student</div><div class="v">' + esc(rec.personName) +
      (person ? ' <span class="muted">· ' + esc(person.studentId || person.email) + '</span>' : '') + '</div>' +
      '<div class="k">Technologies</div><div class="v">' + techDetail(rec) + '</div>' +
      /* ⚠ BOTH DEVICE LINES ARE THE STUDENT'S OWN WORDS, AND SAYING SO
         ONCE IS ENOUGH. This used to carry "As the student described it"
         under each field and then repeat the same point at length in a
         dashed note below — three statements of one fact on one page.
         The fact the admin genuinely needs is that the labels are
         unverified, so that is what the one line says. There is no device
         registry anywhere in this build: nothing here registers hardware,
         names a model, checks a serial number, certifies compatibility or
         configures anything remotely, and nothing is invented to make the
         screen look more capable than the platform is. */
      '<div class="k">Current device</div><div class="v">' + esc(rec.currentDevice) + '</div>' +
      '<div class="k">Replacement device</div><div class="v">' + esc(rec.newDevice) +
      '<span class="tsub">Both are free text from the student — the platform does not verify device ' +
      'details.</span></div>' +
      '<div class="k">Reason given</div><div class="v">' + esc(rec.reason) + '</div>' +
      '<div class="k">Raised</div><div class="v">' + esc(util.fmtDateTime(rec.createdAt)) + '</div>' +
      (rec.escalatedAt
        ? '<div class="k">Forwarded</div><div class="v">' + esc(util.fmtDateTime(rec.escalatedAt)) +
          (rec.escalatedBy ? ' <span class="muted">· by ' + esc(rec.escalatedBy) + '</span>' : '') + '</div>'
        : '') +
      (rec.escalationNote
        ? '<div class="k">Forwarding note</div><div class="v">' + esc(rec.escalationNote) + '</div>'
        : '') +
      (rec.decisionNote
        ? '<div class="k">Platform decision note</div><div class="v">' + esc(rec.decisionNote) + '</div>'
        : '') +
      '</div>' + forwardHTML + '</div></section>' +
      '</div>' +
      '<div class="stack">' +
      ui.card('History', timeline, null, 'h2') +
      /* The one thing the sidebar card said that the dialog does not:
         nothing is sent to anybody. Kept, in one line, because an admin
         who believes the student was notified will not follow up. */
      ui.about('What forwarding does — and does not do',
        '<p>Forwarding moves this request one hop to the platform team, who take the final decision, and writes ' +
        'one line of history. It changes <strong>no licence</strong>, grants <strong>no experiment</strong>, ' +
        'adds <strong>no technology</strong> and changes <strong>no assessment result</strong>: this ' +
        'student&rsquo;s entitlement is exactly what it was before, whatever the platform team decides.</p>' +
        '<p><strong>Nothing is sent to anybody.</strong> This build has no notification channel of any kind. ' +
        'The student sees each state change on their own device page, and the platform team sees the request ' +
        'on its operations list.</p>') +
      '</div></div>';

    return {
      title: 'Device request ' + rec.id,
      html: html,
      tenant: tenant,
      navKey: 'device-requests',
      after: function () {
        var btn = document.getElementById('td-forward');
        if (!btn) { return; }
        btn.addEventListener('click', function () {
          ui.openDialog({
            title: 'Forward ' + rec.id + ' to the platform team?',
            bodyHTML:
              '<p><strong>' + esc(rec.personName) + '</strong> asked for their authorised package to move from ' +
              '<strong>' + esc(rec.currentDevice) + '</strong> to <strong>' + esc(rec.newDevice) + '</strong>.</p>' +
              '<div class="consequence">' + ui.ic('arrowR') + '<span>Forwarding records that you reviewed this ' +
              'as the institution&rsquo;s point of contact and passes it on. <strong>The final decision is the ' +
              'platform team&rsquo;s</strong>, and it has not been taken.</span></div>' +
              '<div class="consequence">' + ui.ic('shield') + '<span>This consumes <strong>no licence</strong>, ' +
              'grants <strong>no experiment</strong>, adds <strong>no technology</strong> and changes ' +
              '<strong>no assessment result</strong>.</span></div>' +
              '<div class="field" id="td-note" style="margin-top:12px">' +
              '<label for="td-note-i">Note recorded with the forwarding (optional)</label>' +
              '<input type="text" id="td-note-i" autocomplete="off">' +
              '<p class="hint">Optional. Anything you write is kept on this request&rsquo;s own history, where ' +
              'the student and the platform team can read it. Nothing is sent to anybody.</p></div>',
            okLabel: 'Forward request',
            onConfirm: function (body) {
              var input = body ? body.querySelector('#td-note-i') : null;
              var out = state.escalateDeviceTransfer(rec.id, input ? input.value : '');
              if (!out) {
                /* Say what actually stopped it. The reachable cause is an
                   institution with no assigned Tenant Admin — the state
                   layer refuses rather than putting a fabricated name on
                   the audit trail — and the other two are the ordinary
                   deactivation guard and a request that has already
                   moved on. Nothing was written in any of the three. */
                var why = !state.actingTenantAdmin(tenant.id)
                  ? 'no Institute / Tenant Admin has been assigned to ' + tenant.name
                  : !state.tenantCanWrite(tenant.id)
                    ? tenant.name + ' has been deactivated by the Super Admin'
                    : 'this request is no longer waiting on this institution';
                ui.toast('Nothing was forwarded — ' + why + '.', 'info');
                ui.announce('The request was not forwarded because ' + why + '.');
                XRSLP.render(false);
                return;
              }
              ui.toast('Request ' + rec.id + ' forwarded to the platform team. No licence, experiment, ' +
                'technology or assessment result changed.');
              XRSLP.render(false);
            }
          });
        });
      }
    };
  };
})();
