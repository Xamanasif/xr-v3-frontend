/* ============================================================
   Unified Functional Platform — STUDENT operational screens.

   My device — device replacement / transfer (STK31-38 · FRD 2.4.1/2.4.2)
   Help      — report a technical issue        (STK31-39)

   ── WHAT THE DEVICE REQUEST IS, AND IS NOT ───────────────────
   The confirmed flow has THREE steps, not two:

       Student  →  INSTITUTE / TENANT ADMIN  →  Super Admin

   The institution's own admin is its point of contact: they see the
   request first, facilitate it, and forward it. Only a forwarded
   request is the platform's to decide, and the final decision stays the
   Super Admin's. Approval changes the authorised device binding. That
   is the whole capability.

   ⚠ NOTHING IS SENT TO ANYBODY. This build has no notification channel,
   so no copy on this screen may say a request was sent, mailed or
   raised WITH someone. The state is surfaced in the product — here for
   the Student, and in the Tenant Admin and Super Admin workspaces for
   the two people who act on it.

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

   That last paragraph used to render on the page as a dashed
   NOT IN THIS BUILD panel, in the rail, unconditionally — including
   beside a body that had just said no request could be raised at all.
   Device registration, serial numbers, certification and remote device
   management are later-phase capabilities that nothing here claims and
   nothing here needs to deny at length: the one clause a Student can
   act on ("nothing is registered or checked") is the hint on the field
   where they type a device name, and the rest is this comment.
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

    /* ⚠ THE DESTINATION THE NAVIGATION HAS ALREADY DECIDED IS IRRELEVANT.
       The nav offers My device only to a Student who holds a
       device-delivered technology — including through an entitlement that
       is currently held back — or who has a request on record. The ROUTE
       stays reachable either way (a bookmark, a typed address), and it
       used to answer with a full two-column page: a form-shaped card
       holding an empty state, an empty request history, a rail explaining
       what a transfer does, and a panel denying a device registry — all
       about a device the Student does not have.

       The same two conditions are asked here, and the answer when both
       are false is one statement and a way back. */
    if (!state.studentHasPackageTechnology(p.id) && !mine.length) {
      return {
        area: 'learn', title: 'My device', student: p, tenant: tenant, navKey: 'device',
        /* ⚠ THE ACCOUNT NOTICE BELONGS ON EVERY STUDENT SCREEN, INCLUDING
           THIS ONE. The early return above is the right shape, but it
           first shipped without `L.accountNotice(p)` — so a Student
           whose own account had been deactivated reached this route and
           was told only that nothing they hold runs on a device, with
           no statement anywhere on the page that their account is the
           reason they can open nothing at all. The full page below has
           always carried it; the short answer must too. */
        html: ui.phead('My device', 'Your authorised device and any transfer requests') +
          L.accountNotice(p) +
          '<div class="tablecard">' + ui.emptyState({
            icon: 'monitor',
            title: 'Nothing you hold runs on a device',
            body: 'Your experiments open in a web browser, so there is no authorised device to move. ' +
              'This page becomes useful if your institution gives you an experiment in AR, VR or MR.',
            actionsHTML: '<a class="btn pri" href="' + L.href.myLearning(p.id) + '">Back to My Learning</a>'
          }) + '</div>'
      };
    }

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
    /* The card is titled for the state it is actually in. A card headed
       "Request a device replacement or transfer" whose body says a
       request cannot be raised is a heading arguing with its own
       contents. */
    var bodyTitle = 'Device transfer';
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
    /* No device-delivered technology at all, but a request on record —
       the one way past the early return above. Their holding changed
       after they asked; the request itself is still theirs and is listed
       below, so the page says what is true now and keeps the history. */
    } else if (!state.studentHasPackageTechnology(p.id)) {
      body = ui.emptyRow({
        icon: 'monitor', heading: 'h3',
        title: 'Nothing you hold runs on a device',
        body: 'Your experiments open in a web browser, so there is no authorised device to move. Any ' +
          'request you already made is kept below, with the state it is in.'
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
      /* An open request is now at one of TWO desks, and saying which is
         the only useful thing this box can tell the Student: "waiting"
         alone leaves them unable to tell a request their own institution
         has not looked at yet from one already forwarded for decision.
         Which of the two steps that is now also shows in the track in
         the rail; this sentence names the desk, that shows the shape.

         The card title stays the neutral "Device transfer" here — a card
         headed "Your request" directly above one headed "Your requests"
         reads as two different things when it is one. */
      body = ui.alertBox('info', 'You already have a request waiting',
        '<p>Request <strong>' + esc(open.id) + '</strong> is ' +
        (open.status === state.TRANSFER_STATUS.ESCALATED
          ? 'with the platform team for the final decision'
          : 'with your institution&rsquo;s Institute / Tenant Admin') +
        '. You can raise another once this one has been decided — two open requests would describe two ' +
        'different devices at the same time.</p>');
    } else {
      bodyTitle = 'Request a device replacement or transfer';
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
        /* The hint the field needs, and the one clause about the absent
           device registry a Student can act on. The rest of that
           statement is the comment at the head of this file. */
        '<p class="hint">Describe it in your own words. Nothing is registered or checked ' +
        'automatically.</p></div>' +
        '<div class="field" id="dt-new"><label for="dt-new-i">The replacement device ' +
        '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
        '<input type="text" id="dt-new-i" maxlength="120" autocomplete="off"></div>' +
        '<div class="field" id="dt-reason"><label for="dt-reason-i">Why does it need to change? ' +
        '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
        '<textarea id="dt-reason-i" rows="4"></textarea></div>' +
        /* THE CONSEQUENCE, NOT THE ROUTE. The three-step route is drawn
           once on this page, as the track in "How a request is decided",
           where it can also show which step an open request has reached.
           Spelling it out again beside the button is how the same two
           sentences came to appear four times on one screen. */
        '<div class="formact"><button class="btn pri" type="submit">Request the transfer</button>' +
        '<span class="formnote">Approval moves your authorised device and changes nothing else about ' +
        'what you can open.</span></div>' +
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

    /* THE STUDENT SEES THE WHOLE ROUTE, NOT ONLY ITS END.
       The request travels Student → Institute / Tenant Admin → platform
       team, and a tile that showed status, decision date and decision note
       hid the middle step completely: who at the institution forwarded it,
       when, and any note they added. The Student is the person waiting, and
       the forwarding step is the part of the wait they could not otherwise
       account for. This is the same record and the same markup the Super
       Admin's request page draws, so the two cannot tell different stories.

       `escalated` takes the neutral 'info' tone: forwarding is a step on
       the way, not an outcome, and a warning colour here would read as
       something having gone wrong. History is defensive-read because a
       record restored from an older saved state may predate it. */
    function eventsHTML(t) {
      var rows = (t.history || []).map(function (h) {
        var tone = h.kind === 'approved' ? 'good' : h.kind === 'declined' ? 'warn' : 'info';
        var icon = h.kind === 'approved' ? 'check'
          : h.kind === 'declined' ? 'x'
          : h.kind === 'escalated' ? 'arrowR' : 'monitor';
        return '<div class="tl-item"><span class="tl-dot ' + tone + '">' + ui.ic(icon) + '</span>' +
          '<div class="tl-body"><div class="tl-action">' + esc(h.label) + '</div>' +
          '<div class="tl-who">' + esc(h.who) + ' · ' + esc(util.fmtDateTime(h.at)) + '</div>' +
          (h.note ? '<p class="tl-note">' + esc(h.note) + '</p>' : '') +
          '</div></div>';
      }).join('');
      return rows ? '<div class="timeline" style="margin-top:10px">' + rows + '</div>' : '';
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
              /* The badge above already names the desk this request is
                 sitting at ("Awaiting Institute Admin review" /
                 "Forwarded — awaiting Super Admin"), so this line says
                 the one thing the badge does not: nothing further is
                 needed from the Student, and the answer lands here. */
              : '<div class="tk-w">' + ui.ic('clock', 'sm') +
                '<span>Nothing further is needed from you. The outcome appears here.</span></div>') +
            eventsHTML(t) +
            '</li>';
        }).join('') + '</ul>'
      /* Compact: an empty request history on a page whose subject is the
         request form is routine, not the page's purpose. */
      : ui.emptyRow({
          icon: 'check', heading: 'h3', ok: true,
          title: 'No device requests',
          body: 'Anything you request appears here with the state it is in.'
        });

    /* ---- the route, drawn instead of described ----
       Student → Institute / Tenant Admin → Super Admin. It was stated in
       prose in four places on this screen; here it is one stepper that
       also says WHERE an open request has actually got to, which prose
       repeated four times never did.

       ⚠ The card foot is the transfer guarantee and is not decoration:
       approval moves the authorised device binding and nothing else. It
       consumes no licence, grants no experiment, adds no technology and
       changes no assessment result — which is exactly what the state
       writer does, and the only thing it does. */
    var forwarded = !!open && open.status === state.TRANSFER_STATUS.ESCALATED;
    var routeCard = ui.card('How a request is decided',
      /* ⚠ EVERY STEP NAMES ITS OWN STATE IN WORDS. The stepper carries
         the state in a class and an aria-hidden mark, so a step whose
         text reads identically whether it is done, live or still ahead
         tells a screen reader nothing at all. */
      ui.track([
        { t: 'You raise the request',
          d: open ? 'Raised on ' + util.fmtDateTime(open.createdAt) + '.'
                  : 'From this page, when you need to move your device.',
          state: open ? 'done' : 'todo' },
        { t: 'Your Institute / Tenant Admin reviews it',
          d: !open ? 'They review it and forward it to the platform team.'
            : forwarded ? 'Reviewed, and forwarded to the platform team.'
            : 'With them now. They forward it to the platform team.',
          state: !open ? 'todo' : forwarded ? 'done' : 'live' },
        { t: 'The platform team decides',
          d: forwarded ? 'With them now for the final decision.'
            : 'They take the final decision. Approval moves your authorised device.',
          state: forwarded ? 'live' : 'todo' }
      ]) +
      '<p class="cardfoot">A transfer moves the authorised device your institution&rsquo;s licence is ' +
      'bound to. It does <strong>not</strong> use up another licence, give you another experiment, add a ' +
      'technology, or affect any assessment you have taken.</p>',
      null, 'h2');

    var html =
      ui.phead('My device',
        (canWrite && techs.length)
          ? 'Move your authorised device for ' + esc(data.sortTech(techs).map(function (t) {
              return (data.TECHNOLOGIES[t] || {}).label || t;
            }).join(' · '))
          /* Not "Device access". A subtitle that degrades to a two-word
             fragment the moment a Student cannot act reads as a
             placeholder on the screens where they most need telling what
             the page is for. */
          : 'Your authorised device and any transfer requests') +
      /* The account state is stated once at the top, exactly as Home, My
         Learning and Progress do. This destination stays reachable while
         the account is inactive — the Student still has a device — so it
         has to say so rather than leave the page silent about it. The
         gap between it and the page comes from `.stack`, not from a
         spacer div. */
      '<div class="stack">' +
      L.accountNotice(p) +
      '<div class="grid-rail">' +
      '<div class="stack">' +
      ui.card(bodyTitle, body, null, 'h2') +
      ui.card('Your requests', history, null, 'h2') +
      '</div>' +
      '<div class="stack">' +
      (holdings ? ui.card('What you hold on a device', holdings +
        '<p class="cardfoot">A transfer never changes which experiments or technologies you hold — ' +
        'those come from what your institution assigned you.</p>',
        null, 'h2') : '') +
      routeCard +
      '</div></div></div>';

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
          /* NOT "sent": nothing is delivered to anybody in this build. The
             request is now sitting with the institution's own admin, and
             that is what the toast — and the tile below it — says. */
          ui.toast('Request ' + res.request.id + ' raised. It is with your Institute / Tenant Admin.');
          XRSLP.render(false);
        });
      }
    };
  };

  /* ---------------- Help ----------------
     The whole screen is `XRSLP.supportUI.helpScreen(ctx)`, shared with
     every other workspace, so a Student is told exactly what a Faculty
     member or a Tenant Admin is told. This function's only job is the
     CONTEXT: who is reporting, and which experiments and technologies
     they can actually reach — built from entitlement, including rows
     that are currently blocked, because an experiment a Student cannot
     open is a very good reason to report an issue.

     The support surface promises no response time, assigns no priority,
     routes nothing automatically and sends no email, SMS or
     notification — it says all four in `honestyPanel()`, and this file
     adds no claim of its own. */
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
