/* ============================================================
   Unified Functional Platform — STUDENT operational screens.

   My device — device replacement / transfer (STK31-38 · FRD 2.4.1/2.4.2)
   Help      — report a technical issue        (STK31-39)

   ── WHAT THE DEVICE REQUEST IS, AND IS NOT ───────────────────
   The confirmed flow is: the Student requests a transfer, the Super
   Admin reviews and approves, and the authorised device binding
   changes. That is the whole capability.

   It is relevant only where a technology is delivered as an
   AUTHORISED PACKAGE ON A DEVICE — AR, VR and MR. A hosted Web
   experience opens in a browser and has no device binding to move
   (STK31-37), so a Web-only Student never sees this destination.

   Approval consumes NO licence, grants NO experiment, adds NO
   technology and changes NO assessment state. The screen says so, and
   the state layer enforces it: the decision writes the request record
   and nothing else.

   ⚠ There is NO device registry anywhere in the sources — the platform
   has a device transfer approval with no device record behind it. So
   the request carries the plain labels the Student types. Nothing here
   names a headset or handset model, checks a serial number, or
   certifies that any device is compatible.
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
  var L = XRSLP.studentUI;

  /* ---------------- My device ---------------- */
  XRSLP.screens.studentDevice = function (params) {
    var r = L.requireStudent(params, 'device');
    if (!r.student) { return r.fail; }
    var p = r.student, tenant = r.tenant;

    var techs = state.packageTechnologiesForStudent(p.id);
    var mine = state.transfersForStudent(p.id);
    var open = state.openTransferForStudent(p.id);
    var canWrite = state.personCanWrite(p.id);

    /* What the Student actually holds on a device — derived from
       entitlement, never asserted. Kept visible while the institution is
       suspended: it is a statement about what this Student HOLDS, and
       nothing about that has changed. */
    var deviceRows = state.studentExperiments(p.id).filter(function (row) {
      return row.technologies.concat(row.blockedTechnologies).some(state.isPackageTechnology);
    });

    var holdings = deviceRows.length
      ? '<ul class="reslist plain">' + deviceRows.map(function (row) {
          var ctx = data.contextOf(row.experimentId);
          var pk = row.technologies.concat(row.blockedTechnologies).filter(state.isPackageTechnology);
          return '<li>' + ui.ic('flask') + '<span>' + esc(ctx ? ctx.experiment.name : row.experimentId) +
            ' <span class="muted">· ' + ui.techBadges(pk) + '</span></span></li>';
        }).join('') + '</ul>'
      : '';

    var body;
    /* ACCESS STATE IS TESTED BEFORE THE TECHNOLOGY LIST — both halves of
       it. A suspended institution AND a deactivated Student each leave a
       Student with no *effective* entitlement, so testing the technology
       list first tells them the plain untruth that nothing they hold runs
       on a device — next to the card on this very page that lists their
       VR and AR holdings. `personCanWrite()` covers only the institution,
       so the Student's own status needs its own test. */
    if (!canWrite) {
      body = ui.alertBox('warning', 'Your institution’s access is suspended',
        '<p>' + esc(L.unavailableText('tenant-inactive')) + ' A device request cannot be raised at the moment, ' +
        'and nothing about your device has changed. Any request you already made is still here, with the ' +
        'state it is in.</p>');
    } else if (p.status !== 'active') {
      body = ui.alertBox('warning', 'Your account is not active at the moment',
        '<p>' + esc(L.unavailableText('student-inactive')) + ' A device request cannot be raised while it ' +
        'is, and nothing about your device has changed. Any request you already made is still here, with ' +
        'the state it is in.</p>');
    /* Whether the Student holds ANY device-delivered technology, including
       through an entitlement that is currently held back — the question
       `studentHasPackageTechnology` was written for, and the one the nav
       item already asks. `techs` is the narrower "can act right now" list,
       and reading it here made a held or expired entitlement produce the
       same untruth. */
    } else if (!state.studentHasPackageTechnology(p.id)) {
      body = ui.emptyState({
        icon: 'monitor', heading: 'h2',
        title: 'Nothing you hold runs on a device',
        body: 'Your experiments open in a web browser, so there is no authorised device to move. This page ' +
          'becomes useful if your institution gives you an experiment in AR, VR or MR.',
        actionsHTML: '<a class="btn pri" href="' + L.href.myLearning(p.id) + '">Back to My Learning</a>'
      });
    } else if (!techs.length) {
      /* They DO hold a device-delivered technology, but every entitlement
         carrying one is currently held back or has reached its end date,
         so there is no live authorised device to move and the form below
         would have nothing to offer. The reason belongs to the experiment,
         which is where it is already stated. */
      body = ui.alertBox('warning', 'No device request can be raised at the moment',
        '<p>None of the technologies you hold on a device can be opened right now, so there is no ' +
        'authorised device to move. Each one is shown on its experiment in My Learning, with the ' +
        'reason.</p>' +
        '<p style="margin-top:8px">Nothing has been removed, and any request you already made is still ' +
        'here, with the state it is in.</p>');
    } else if (open) {
      body = ui.alertBox('info', 'You already have a request waiting',
        '<p>Request <strong>' + esc(open.id) + '</strong> is with the platform team. Its state appears below. ' +
        'You can raise another once this one has been decided — two open requests would describe two ' +
        'different devices at the same time.</p>');
    } else {
      var techOptions = techs.map(function (t) {
        var d = data.TECHNOLOGIES[t];
        return '<option value="' + esc(t) + '">' + esc(d ? d.name : t) + '</option>';
      }).join('');
      body =
        '<form id="dt-form" novalidate>' +
        '<div class="form-errors"></div>' +
        '<div class="field" id="dt-tech"><label for="dt-tech-i">Which technology is affected?</label>' +
        '<select id="dt-tech-i"><option value="">— all of them —</option>' + techOptions + '</select>' +
        '<p class="hint">Only technologies your institution has made available to you on a device are listed. ' +
        (techs.length === 1
          ? 'You hold one — <strong>' + esc((data.TECHNOLOGIES[techs[0]] || {}).name || techs[0]) +
            '</strong> — so &ldquo;all of them&rdquo; means that one, and the request will say so.'
          : '&ldquo;All of them&rdquo; covers all ' + techs.length + ', and the request will list them.') +
        '</p></div>' +
        '<div class="field" id="dt-current"><label for="dt-current-i">The device you use now ' +
        '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
        '<input type="text" id="dt-current-i" maxlength="120" autocomplete="off">' +
        '<p class="hint">Describe it in your own words. Nothing is registered, checked or certified — the ' +
        'platform holds no device records.</p></div>' +
        '<div class="field" id="dt-new"><label for="dt-new-i">The replacement device ' +
        '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
        '<input type="text" id="dt-new-i" maxlength="120" autocomplete="off"></div>' +
        '<div class="field" id="dt-reason"><label for="dt-reason-i">Why does it need to change? ' +
        '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
        '<textarea id="dt-reason-i" rows="4"></textarea></div>' +
        '<div class="formact"><button class="btn pri" type="submit">Request the transfer</button>' +
        '<span class="formnote">The platform team decides. Approval moves your authorised device and ' +
        'changes nothing else about what you can open.</span></div>' +
        '</form>';
    }

    /* What the request covers, from the one state-layer reader. A single
       technology names itself; several are listed rather than collapsed
       into a word like "all", which would hide which devices are
       actually in scope. */
    function techLine(t) {
      var list = state.transferTechnologies(t);
      if (!list.length) { return ''; }
      return list.map(function (x) {
        var d = data.TECHNOLOGIES[x];
        return d ? d.name : x;
      }).join(' · ');
    }

    var history = mine.length
      ? '<ul class="tickets">' + mine.map(function (t) {
          var m = state.transferStatusMeta(t.status);
          var line = techLine(t);
          return '<li class="tk">' +
            '<div class="tk-h"><span class="tk-id">' + esc(t.id) + '</span>' +
            ui.badge(m.badge, m.icon, m.label) + '</div>' +
            '<div class="tk-m">' + (line ? esc(line) + ' · ' : '') +
            'requested ' + esc(util.fmtDateTime(t.createdAt)) + '</div>' +
            '<div class="kv" style="margin-top:8px">' +
            '<div class="k">From</div><div class="v">' + esc(t.currentDevice) + '</div>' +
            '<div class="k">To</div><div class="v">' + esc(t.newDevice) + '</div>' +
            '<div class="k">Reason</div><div class="v">' + esc(t.reason) + '</div>' +
            '</div>' +
            (t.status === state.TRANSFER_STATUS.APPROVED
              ? '<div class="tk-r">' + ui.ic('check', 'sm') +
                '<div><strong>Approved</strong> ' + esc(util.fmtDateTime(t.decidedAt)) +
                '<p>Your authorised device has moved to the replacement. Nothing else changed: the same ' +
                'experiments, the same technologies, and all of your progress.</p>' +
                (t.decisionNote ? '<p>' + esc(t.decisionNote) + '</p>' : '') + '</div></div>'
              : t.status === state.TRANSFER_STATUS.DECLINED
              ? '<div class="tk-w">' + ui.ic('x', 'sm') +
                '<div><strong>Declined</strong> ' + esc(util.fmtDateTime(t.decidedAt)) +
                '<p>' + esc(t.decisionNote) + '</p></div></div>'
              : '<div class="tk-w">' + ui.ic('clock', 'sm') +
                '<span>With the platform team. The outcome appears here.</span></div>') +
            '</li>';
        }).join('') + '</ul>'
      : ui.emptyState({
          icon: 'check', heading: 'h3',
          title: 'No device requests',
          body: 'Anything you request appears here with the state it is in.'
        });

    var html =
      ui.phead('My device',
        (canWrite && techs.length)
          ? 'Move your authorised device for ' + esc(data.sortTech(techs).map(function (t) {
              return (data.TECHNOLOGIES[t] || {}).label || t;
            }).join(' · '))
          : 'Device access') +
      /* The account state is stated once at the top, exactly as Home, My
         Learning and Progress do. This destination stays reachable while
         the account is inactive — the Student still has a device — so it
         has to say so rather than leave the page silent about it. */
      L.accountNotice(p) +
      (p.status !== 'active' ? '<div style="height:16px"></div>' : '') +
      '<div class="grid-rail">' +
      '<div class="stack">' +
      ui.card('Request a device replacement or transfer', body, null, 'h2') +
      ui.card('Your requests', history, null, 'h2') +
      '</div>' +
      '<div class="stack">' +
      (holdings ? ui.card('What you hold on a device', holdings +
        '<p class="cardfoot">A device transfer moves your authorised device. It never changes which ' +
        'experiments or technologies you hold — those come from what your institution assigned you.</p>',
        null, 'h2') : '') +
      ui.alertBox('info', 'What a transfer does',
        '<p>It moves the authorised device your institution&rsquo;s licence is bound to. It does ' +
        '<strong>not</strong> use up another licence, give you another experiment, add a technology, or ' +
        'affect any assessment you have taken.</p>') +
      ui.gapNote('NOT IN THIS BUILD',
        'The platform holds no device registry, so nothing here registers hardware, records a serial number ' +
        'or certifies that a particular headset or handset is supported. Device registration and remote ' +
        'device management are later-phase capabilities.') +
      '</div></div>';

    return {
      area: 'learn', title: 'My device', html: html, student: p, tenant: tenant, navKey: 'device',
      after: function () {
        var form = document.getElementById('dt-form');
        if (!form) { return; }
        var busy = false;
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          if (busy) { return; }
          var fields = {
            technology: (document.getElementById('dt-tech-i') || {}).value || null,
            currentDevice: (document.getElementById('dt-current-i') || {}).value || '',
            newDevice: (document.getElementById('dt-new-i') || {}).value || '',
            reason: (document.getElementById('dt-reason-i') || {}).value || ''
          };
          var errs = state.validateTransfer(p.id, fields);
          if (!ui.showErrors(form, errs, 'Please complete the request')) { return; }
          busy = true;
          var res = state.createDeviceTransfer(p.id, fields);
          if (!res.ok) { busy = false; ui.showErrors(form, res.errors, 'Please complete the request'); return; }
          ui.toast('Request ' + res.request.id + ' sent to the platform team.');
          XRSLP.render(false);
        });
      }
    };
  };

  /* ---------------- Help ---------------- */
  XRSLP.screens.studentHelp = function (params) {
    var r = L.requireStudent(params, 'help');
    if (!r.student) { return r.fail; }
    var p = r.student, tenant = r.tenant;

    var rows = state.studentExperiments(p.id);
    var experiments = rows.map(function (row) {
      var ctx = data.contextOf(row.experimentId);
      return { id: row.experimentId, name: ctx ? ctx.experiment.name : row.experimentId };
    });
    var techs = {};
    rows.forEach(function (row) {
      row.technologies.concat(row.blockedTechnologies).forEach(function (t) { techs[t] = true; });
    });

    var ctx = {
      kind: 'student', id: p.id, name: p.name, roleLabel: 'Student',
      tenantId: tenant.id, tenantName: tenant.name,
      experiments: experiments, technologies: Object.keys(techs)
    };
    var out = XRSLP.supportUI.helpScreen(ctx);

    return {
      area: 'learn', title: 'Help and support', html: out.html,
      student: p, tenant: tenant, navKey: 'help',
      after: function () { XRSLP.supportUI.bindHelp(ctx); }
    };
  };
})();
