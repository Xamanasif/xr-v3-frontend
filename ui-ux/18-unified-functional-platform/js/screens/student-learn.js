/* ============================================================
   Unified Functional Platform — STUDENT learning screens.

   Experiment detail · Simulation · Assessment (intro / attempt /
   result). The confirmed progression PM-09 approved runs straight
   through this file:

       LEARNING RESOURCES → SIMULATION → ASSESSMENT → COMPLETION

   ⚠ TECHNOLOGY-SPECIFIC ACCESS IS THE CRITICAL RULE HERE.
   Every technology surface on every screen below is built from
   `state.studentEntitledTechnologies()` — the effective entitlement —
   and never from the Experiment's catalogue availability. Editing the
   address to a technology that was not granted produces an explicit
   refusal, not an authorised launch state, because the state writers
   apply the same gate as the UI.

   ⚠ NOTHING IS DOWNLOADED, INSTALLED, HOSTED OR LAUNCHED.
   AR/VR/MR are an authorised-package model and Web is a hosted link
   (STK31-37), but the MECHANISM is deliberately unselected (PM-05,
   QT-01 open by instruction). Every action here is a clearly labelled
   prototype state change. No external URL is invented, and no control
   claims to fetch a real package.
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

  /* Marking a resource done re-renders the page, because the sequence
     strip, the resource count and the progress rail all change. Two
     things must survive that re-render or the interaction is hostile:
     which resource panels were expanded, and where the keyboard was. */
  var restoreResources = null;

  /* ---------------- shared resolution ----------------
     Resolves Student + Experiment + the Student's effective view of
     it, and returns a rendered refusal when the experiment is not
     theirs to open. */
  function resolve(params, navKey) {
    var r = L.requireStudent(params, navKey);
    if (!r.student) { return { fail: r.fail }; }
    var p = r.student, tenant = r.tenant;
    var ctx = data.contextOf(params.experimentId);
    var row = state.studentExperiment(p.id, params.experimentId);

    if (!ctx) {
      return { fail: notAvailable(p, tenant, navKey, 'Experiment not found',
        'No experiment with this address exists in the catalogue.') };
    }
    /* Never assigned — and published catalogue content must NEVER leak
       into the Student workspace on the strength of existing. */
    if (!row) {
      var everDid = state.hasActivity(p.id, params.experimentId);
      return { fail: notAvailable(p, tenant, navKey,
        everDid ? 'No longer available to you' : 'Not assigned to you',
        everDid
          ? 'This experiment is no longer assigned to you, so it cannot be opened. Everything you did is kept, ' +
            'and you can still see it under Progress.'
          : 'This experiment has not been assigned to you. Your institution decides which experiments you take — ' +
            'being enrolled on a course, or belonging to a group, is not the same as being assigned an experiment.',
        p, ctx) };
    }
    if (!row.effective) {
      return { fail: notAvailable(p, tenant, navKey, 'Not available at the moment',
        L.unavailableText(row.blockedBy) + ' Everything you have already done is kept.', p, ctx) };
    }
    return { student: p, tenant: tenant, ctx: ctx, row: row };
  }

  /* `student` and `ctx` are optional: the "experiment not found" caller has
     neither, and the recovery action is suppressed accordingly. */
  function notAvailable(p, tenant, navKey, title, body, student, ctx) {
    return {
      area: 'learn', title: title, student: p, tenant: tenant, navKey: navKey,
      html: ui.crumbs([{ label: 'My Learning', href: L.href.myLearning(p.id) },
                       { label: ctx ? ctx.experiment.name : title }]) +
        ui.phead(ctx ? ctx.experiment.name : title, ctx ? L.courseLine(ctx.experiment.id) : '') +
        '<div class="tablecard">' + ui.emptyState({
          icon: 'alert', title: title, body: body,
          actionsHTML: '<a class="btn pri" href="' + L.href.myLearning(p.id) + '">Back to My Learning</a>' +
            (student && state.hasActivity(student.id, ctx ? ctx.experiment.id : '')
              ? ' <a class="btn sec" href="' + L.href.progress(student.id) + '">See your progress</a>' : '')
        }) + '</div>'
    };
  }

  /* ============================================================
     EXPERIMENT — the Student-facing page.

     Deliberately absent: the access record identifier, the approved
     licence quantity, the assignment source (direct or through a
     group), the Super Admin, and every other administrative fact that
     belongs to the Tenant Admin workspace (brief §32).
     ============================================================ */
  XRSLP.screens.studentExperiment = function (params) {
    var r = resolve(params, 'my-learning');
    if (r.fail) { return r.fail; }
    var p = r.student, tenant = r.tenant, ctx = r.ctx, row = r.row;
    var e = ctx.experiment;
    var techs = row.technologies;
    var asm = state.assessmentForStudent(p.id, e.id);
    var prog = state.experimentProgress(p.id, e.id, techs, { studentView: true });
    var resources = data.resourcesFor(e.id);
    var resProg = prog.resources;
    /* ONE assessment for the Experiment — see the source note at the head
       of state.js. Only the simulation below is technology-specific. */
    /* Student surface: a reviewed result the policy has not released is
       shown as reviewed-but-not-released, never as passed or not passed.
       The derivation underneath is untouched. */
    var assessState = L.studentAssessState(p.id, e.id);

    /* ---- the sequence, with its live state ---- */
    var seq = L.sequenceStrip([
      { title: 'Learning resources',
        detail: resProg.total
          ? resProg.completed + ' of ' + resProg.total + ' marked as done'
          : 'None for this experiment',
        tone: resProg.total && resProg.completed === resProg.total ? 'done'
            : resProg.started ? 'live' : '' },
      { title: 'Simulation',
        detail: techs.length === 1
          ? data.TECHNOLOGIES[techs[0]].label + ' — ' +
            L.progressLabel(prog.technologies[0].simulationStatus).toLowerCase()
          : prog.technologies.filter(function (t) {
              return t.simulationStatus === state.SIM_STATUS.COMPLETED;
            }).length + ' of ' + techs.length + ' technologies complete',
        tone: prog.technologies.every(function (t) { return t.simulationStatus === state.SIM_STATUS.COMPLETED; })
          ? 'done' : prog.technologies.some(function (t) { return t.simulationStatus !== state.SIM_STATUS.NOT_STARTED; })
          ? 'live' : '' },
      { title: 'Assessment',
        detail: asm ? L.assessLabel(assessState) : 'Not set for this experiment',
        tone: !asm ? ''
          : assessState === state.ASSESS_STATE.PASSED ? 'done'
          : assessState === state.ASSESS_STATE.NOT_STARTED ? '' : 'live' },
      { title: 'Completion',
        detail: L.progressLabel(prog.status),
        tone: prog.status === state.TECH_PROGRESS.COMPLETED ? 'done' : '' }
    ]);

    /* ---- about ---- */
    var about = ui.card('About this experiment',
      '<p class="cardlede">' + esc(e.description) + '</p>' +
      '<h3 class="subh" style="margin-top:14px">What you should be able to do afterwards</h3>' +
      '<ul class="outcomelist">' + e.outcomes.map(function (o) {
        return '<li>' + ui.ic('check', 'sm') + '<span>' + esc(o) + '</span></li>';
      }).join('') + '</ul>', null, 'h2');

    /* ---- learning resources ---- */
    var resBody;
    if (!resources.length) {
      resBody = ui.emptyState({
        icon: 'book', heading: 'h3',
        title: 'No learning resources for this experiment',
        body: 'You can go straight to the simulation.'
      });
    } else {
      resBody =
        '<p class="cardlede">Working through these first is recommended, and they are not a gate — you can ' +
        'open the simulation at any time. They do count towards completing this experiment, so mark each one ' +
        'as done when you have read it.</p>' +
        '<ul class="reslist">' + resources.map(function (res, i) {
          var st = state.resourceStatus(p.id, e.id, res.id);
          var kind = data.resourceKind(res.kind);
          var done = st === state.RES_STATUS.COMPLETED;
          var opened = st !== state.RES_STATUS.NOT_STARTED;
          return '<li class="ritem' + (done ? ' done' : '') + '">' +
            '<details class="rd"' + (opened && !done ? ' open' : '') + ' data-res="' + esc(res.id) + '">' +
            '<summary>' +
            '<span class="rd-ic">' + ui.ic(done ? 'check' : kind.icon) + '</span>' +
            '<span class="rd-b"><span class="rd-k">' + esc(kind.label) + '</span>' +
            '<span class="rd-t">' + esc(res.title) + '</span></span>' +
            '<span class="rd-s">' + (done
              ? ui.badge('b-success', 'check', 'Done')
              : opened ? ui.badge('b-info', 'clock', 'Opened') : ui.badge('b-neutral', 'minus', 'Not opened')) +
            '</span></summary>' +
            '<div class="rd-body"><p>' + esc(res.body) + '</p>' +
            '<div class="rd-act">' +
            '<label class="rd-check"><input type="checkbox" data-done="' + esc(res.id) + '"' +
            (done ? ' checked' : '') + '> <span>Mark as done</span></label>' +
            '</div></div></details></li>';
        }).join('') + '</ul>';
    }
    var resCard = ui.card('Learning resources', resBody,
      resources.length ? resProg.completed + ' of ' + resProg.total + ' done' : null, 'h2');

    /* ---- simulations, one card per ENTITLED technology ---- */
    var simCards = prog.technologies.map(function (t) {
      var def = data.TECHNOLOGIES[t.technology];
      var sim = t.simulation;
      var delivery = sim ? sim.deliveryState : (def.delivery === 'hosted'
        ? state.DELIVERY_STATE.READY : state.DELIVERY_STATE.NOT_REQUESTED);
      var stateLine;
      if (t.simulationStatus === state.SIM_STATUS.COMPLETED) {
        stateLine = ui.badge('b-success', 'check', 'Completion recorded');
      } else if (t.simulationStatus === state.SIM_STATUS.IN_PROGRESS) {
        stateLine = ui.badge('b-info', 'clock', 'In progress');
      } else if (def.delivery === 'hosted') {
        stateLine = ui.badge('b-neutral', 'minus', 'Not started');
      } else if (delivery === state.DELIVERY_STATE.READY) {
        stateLine = ui.badge('b-success', 'check', 'Ready on device');
      } else if (delivery === state.DELIVERY_STATE.PENDING) {
        stateLine = ui.badge('b-warning', 'clock', 'Availability pending');
      } else {
        stateLine = ui.badge('b-neutral', 'minus', 'Not requested yet');
      }
      var action = t.simulationStatus === state.SIM_STATUS.COMPLETED ? 'Review'
        : t.simulationStatus === state.SIM_STATUS.IN_PROGRESS ? 'Continue'
        : def.delivery === 'hosted' ? 'Open the simulation' : 'Set up and open';
      return '<article class="techcard">' +
        '<div class="tc-head">' + ui.fmtBadge(t.technology) +
        '<span class="tc-n">' + esc(def.name) + '</span>' +
        '<span class="tc-s">' + stateLine + '</span></div>' +
        '<dl class="tc-meta">' +
        '<dt>What you need</dt><dd>' + esc(def.requirement) + '</dd>' +
        '<dt>How it runs</dt><dd>' + esc(def.deliveryLabel) + '</dd>' +
        (sim && sim.status === state.SIM_STATUS.COMPLETED
          ? '<dt>Time spent</dt><dd>' + esc(L.fmtDuration(sim.timeSpentSeconds)) + '</dd>' : '') +
        '</dl>' +
        '<div class="tc-act"><a class="btn sm pri" href="' +
        L.href.simulation(p.id, e.id, t.technology) + '">' + esc(action) + '</a></div>' +
        '</article>';
    }).join('');

    var simCard = ui.card('Simulation',
      '<p class="cardlede">' + (techs.length === 1
        ? 'Your institution has made this experiment available to you in one technology.'
        : 'Your institution has made this experiment available to you in ' + techs.length +
          ' technologies. Each one is tracked separately.') + '</p>' +
      '<div class="techgrid">' + simCards + '</div>',
      techs.length + ' ' + util.plural(techs.length, 'technology', 'technologies'), 'h2');

    /* ---- assessment entry ---- */
    var asmCard = '';
    if (asm) {
      var release = state.assessmentRelease(asm);
      var block = state.attemptBlock(p.id, e.id);
      var last = state.latestSubmittedAttempt(p.id, e.id);
      var open = state.currentAttempt(p.id, e.id);
      /* An attempt in progress outranks a previous result: the badge says
         "In progress", so the only control here must lead there. */
      var label = open ? 'Continue the assessment'
        : last ? 'See your result' : 'Go to the assessment';
      var target = open ? L.href.attempt(p.id, e.id)
        : last ? L.href.result(p.id, e.id)
        : L.href.assessment(p.id, e.id);
      var note = '';
      if (!open && block === 'attempt-limit') {
        note = 'You have used all ' + asm.attemptLimit + ' ' +
          util.plural(asm.attemptLimit, 'attempt') + '.';
      } else if (!open && block === 'pending-faculty-review') {
        note = 'You cannot retake this while your written answer is with your faculty.';
      } else if (!open && block === 'no-questions') {
        note = 'Your faculty have not set the questions yet.';
      }
      asmCard = ui.card('Assessment',
        '<p class="cardlede">' + esc(asm.intro) + '</p>' +
        '<div class="polnote">' + ui.ic('info', 'sm') +
        '<span><strong>' + esc(data.policyLabel(release.mode)) + '.</strong> ' +
        esc(release.sentence) + '</span></div>' +
        '<ul class="aslist"><li class="asrow">' +
        '<span class="as-s">' + L.assessBadge(assessState) + '</span>' +
        '<span class="as-n">' + esc(note) + '</span>' +
        '<a class="btn sm ' + (last && !open ? 'sec' : 'pri') + '" href="' + target + '">' +
        esc(label) + '</a></li></ul>' +
        (techs.length > 1
          ? '<p class="cardfoot">One assessment covers this experiment. You are not asked to sit it again ' +
            'for each technology your institution made available to you.</p>' : ''),
        asm.questions.length + ' ' + util.plural(asm.questions.length, 'question'), 'h2');
    } else {
      asmCard = ui.card('Assessment',
        ui.emptyState({
          icon: 'doc', heading: 'h3',
          title: 'No assessment is set for this experiment',
          body: 'Not every experiment has one. This experiment is complete once you have finished the simulation ' +
            'in each technology available to you.'
        }), null, 'h2');
    }

    /* ---- progress panel ---- */
    var progPanel =
      '<section class="lpanel">' +
      '<h2 class="lp-h">Your progress</h2>' +
      '<div class="lp-b">' +
      '<div class="lc-pl"><span>' + esc(L.progressLabel(prog.status)) + '</span>' +
      '<span class="tabular">' + prog.percent + '%</span></div>' +
      L.progressBar(prog.percent, prog.percent + ' per cent of the learning steps complete') +
      '<p class="lp-roll">' + esc(L.simulationSentence(prog)) + '</p>' +
      (prog.technologies.length && prog.technologies.every(function (t) { return t.waitingOnResources; })
        ? '<p class="lp-note" style="margin-top:10px;padding-top:0;border-top:0">' + ui.ic('book', 'sm') +
          ' Everything else is done. Mark the remaining learning resources as done to complete ' +
          'this experiment.</p>'
        : prog.technologies.some(function (t) { return t.waitingOnResources; })
        ? '<p class="lp-note" style="margin-top:10px;padding-top:0;border-top:0">' + ui.ic('book', 'sm') +
          ' ' + esc(prog.technologies.filter(function (t) { return t.waitingOnResources; })
            .map(function (t) { return data.TECHNOLOGIES[t.technology].label; }).join(' and ')) +
          ' only needs the remaining learning resources marked as done.</p>' : '') +
      '<dl class="lp-steps">' +
      '<dt>Learning resources</dt><dd>' + resProg.completed + ' of ' + resProg.total + '</dd>' +
      '<dt>Learning steps done</dt><dd>' + prog.steps.done + ' of ' + prog.steps.total + '</dd>' +
      (prog.lastActivityAt
        ? '<dt>Last activity</dt><dd>' + esc(util.fmtDateTime(prog.lastActivityAt)) + '</dd>' : '') +
      '</dl>' +
      '<a class="btn sec blk sm" href="' + L.href.progress(p.id) + '">See all your progress</a>' +
      '</div></section>';

    /* The chips report each technology's own SIMULATION, so the panel is
       titled for what it actually shows. Which technologies appear is
       still the entitlement statement — the note says so. */
    var techPanel =
      '<section class="lpanel">' +
      '<h2 class="lp-h">Your simulations</h2>' +
      '<div class="lp-b">' +
      L.techStateChips(prog) +
      '<p class="lp-note">These are the technologies your institution made available to you for this ' +
      'experiment, and how far you have got with each one. Other technologies may exist for it; they ' +
      'have not been made available to you. The assessment is separate and covers the experiment as a ' +
      'whole.</p>' +
      '</div></section>';

    var html =
      ui.crumbs([{ label: 'My Learning', href: L.href.myLearning(p.id) }, { label: e.name }]) +
      ui.phead(e.name, L.courseLine(e.id), null, ' ' + L.progressBadge(prog.status)) +
      '<p class="plede">' + esc(e.summary) + '</p>' +
      seq +
      '<div class="grid-rail">' +
      '<div class="stack">' + about + resCard + simCard + asmCard + '</div>' +
      '<div class="stack">' + progPanel + techPanel + '</div>' +
      '</div>';

    return {
      area: 'learn', title: e.name, html: html, student: p, tenant: tenant, navKey: 'my-learning',
      after: function () {
        /* Opening a resource is a real action and is recorded as one. */
        Array.prototype.slice.call(document.querySelectorAll('details.rd')).forEach(function (d) {
          d.addEventListener('toggle', function () {
            if (!d.open) { return; }
            var id = d.getAttribute('data-res');
            if (state.resourceStatus(p.id, e.id, id) === state.RES_STATUS.NOT_STARTED) {
              state.openResource(p.id, e.id, id);
            }
          });
        });
        Array.prototype.slice.call(document.querySelectorAll('[data-done]')).forEach(function (cb) {
          cb.addEventListener('change', function () {
            var id = cb.getAttribute('data-done');
            var res = data.resource(e.id, id);
            restoreResources = {
              open: Array.prototype.slice.call(document.querySelectorAll('details.rd[open]'))
                .map(function (d) { return d.getAttribute('data-res'); }),
              focus: id
            };
            state.setResourceComplete(p.id, e.id, id, cb.checked);
            ui.toast((res ? res.title : 'Resource') + (cb.checked ? ' marked as done.' : ' no longer marked as done.'),
              cb.checked ? undefined : 'info');
            XRSLP.render(true);
          });
        });

        /* Re-expand what was expanded and put the keyboard back on the
           control that was just used. Re-opening a panel fires `toggle`,
           but `openResource` only acts on a resource that has never been
           opened, so nothing is written twice. */
        if (restoreResources) {
          restoreResources.open.forEach(function (id) {
            var d = document.querySelector('details.rd[data-res="' + id + '"]');
            if (d) { d.open = true; }
          });
          var back = document.querySelector('[data-done="' + restoreResources.focus + '"]');
          if (back) { try { back.focus({ preventScroll: true }); } catch (err) { back.focus(); } }
          restoreResources = null;
        }
      }
    };
  };

  /* ============================================================
     SIMULATION — one entitled technology.
     ============================================================ */
  XRSLP.screens.studentSimulation = function (params) {
    var r = resolve(params, 'my-learning');
    if (r.fail) { return r.fail; }
    var p = r.student, tenant = r.tenant, ctx = r.ctx, row = r.row;
    var e = ctx.experiment;
    var tech = params.tech;
    var def = data.TECHNOLOGIES[tech];

    /* THE technology gate. An address typed by hand, a bookmark from a
       previous entitlement, or a technology the institution never
       licensed all land here — and none of them produces an authorised
       launch state. */
    if (!def || !state.studentCanRun(p.id, e.id, tech)) {
      return techRefusal(p, tenant, ctx, row, tech, def);
    }

    var sim = state.simulationActivity(p.id, e.id, tech);
    var status = sim ? sim.status : state.SIM_STATUS.NOT_STARTED;
    var delivery = sim ? sim.deliveryState
      : (def.delivery === 'hosted' ? state.DELIVERY_STATE.READY : state.DELIVERY_STATE.NOT_REQUESTED);
    var isPackage = def.delivery === 'package';

    /* ---- the state ladder, mechanism-neutral ---- */
    var ladder = [];
    if (isPackage) {
      ladder.push({
        title: 'Access requested for your device',
        detail: 'Your institution has made this experiment available to you in ' + def.label + '.',
        done: delivery !== state.DELIVERY_STATE.NOT_REQUESTED
      });
      ladder.push({
        title: 'Ready on your device',
        detail: 'The authorised ' + def.label + ' package is available to open.',
        done: delivery === state.DELIVERY_STATE.READY
      });
    } else {
      ladder.push({
        title: 'Available to open',
        detail: 'This experiment runs in your browser — nothing needs to be installed.',
        done: true
      });
    }
    ladder.push({
      title: 'Simulation opened',
      detail: 'You have started working through the experiment.',
      done: status !== state.SIM_STATUS.NOT_STARTED
    });
    ladder.push({
      title: 'Completion recorded',
      detail: 'Your completion for ' + def.label + ' has been recorded.',
      done: status === state.SIM_STATUS.COMPLETED
    });

    var ladderHTML = '<ol class="ladder">' + ladder.map(function (s) {
      return '<li class="ld' + (s.done ? ' done' : '') + '">' +
        '<span class="ld-d">' + ui.ic(s.done ? 'check' : 'minus', 'sm') + '</span>' +
        '<span class="ld-b"><span class="ld-t">' + esc(s.title) + '</span>' +
        '<span class="ld-s">' + esc(s.detail) + '</span></span>' +
        '<span class="sr-only">' + (s.done ? 'Done' : 'Not yet') + '</span></li>';
    }).join('') + '</ol>';

    /* ---- actions — every one of them does something real ---- */
    var actions = '', actionNote = '';
    if (isPackage && delivery === state.DELIVERY_STATE.NOT_REQUESTED) {
      actions = '<button class="btn pri" type="button" id="sim-request">Request access on my device</button>';
      actionNote = 'This records that you want the ' + def.label + ' experiment on a supported device.';
    } else if (isPackage && delivery === state.DELIVERY_STATE.PENDING) {
      actions = '<button class="btn sec" type="button" id="sim-ready">Simulate the package becoming ready</button>';
      actionNote = 'Prototype action. In the product the platform reports when the authorised package is ' +
        'available on your device; that delivery mechanism is not built here.';
    } else if (status === state.SIM_STATUS.NOT_STARTED) {
      actions = '<button class="btn pri" type="button" id="sim-start">' +
        (isPackage ? 'Open the ' + def.label + ' experiment' : 'Open the Web simulation') + '</button>';
      actionNote = 'Prototype action. It opens a stand-in for the experiment, not the experiment itself.';
    } else if (status === state.SIM_STATUS.IN_PROGRESS) {
      /* No "open it again" here: the experiment is already open — the panel
         below IS that state — and a control that produces no visible change
         reads as a dead one. */
      actions = '<button class="btn pri" type="button" id="sim-complete">Record my completion</button>' +
        '<a class="btn sec" href="' + L.href.experiment(p.id, e.id) + '">Back to the experiment</a>';
      actionNote = 'In the product the experiment itself reports your completion and the time you spent. ' +
        'Here you record it, and the time between opening and completing is what is stored.';
    } else {
      actions = '<a class="btn sec" href="' + L.href.experiment(p.id, e.id) + '">Back to the experiment</a>';
      var asmExists = state.assessmentForStudent(p.id, e.id);
      if (asmExists) {
        var lastAtt = state.latestSubmittedAttempt(p.id, e.id);
        var openAtt = state.currentAttempt(p.id, e.id);
        actions = '<a class="btn pri" href="' +
          (openAtt ? L.href.attempt(p.id, e.id)
            : lastAtt ? L.href.result(p.id, e.id) : L.href.assessment(p.id, e.id)) + '">' +
          (openAtt ? 'Continue the assessment'
            : lastAtt ? 'See your result' : 'Go to the assessment') + '</a>' + actions;
      }
      actionNote = 'Your completion for ' + def.label + ' is recorded. It does not affect any other technology.';
    }

    /* ---- the stand-in runtime panel, only while genuinely open ---- */
    var runtime = '';
    if (status === state.SIM_STATUS.IN_PROGRESS) {
      runtime = ui.protoNote(
        '<p><strong>This panel stands in for the ' + esc(def.name) + ' experience.</strong> ' +
        (isPackage
          ? 'In the product the authorised ' + esc(def.label) + ' package runs on your device and reports back ' +
            'what you completed and how long you spent. Which delivery mechanism carries it is a technical ' +
            'decision that has deliberately not been made yet, so nothing is downloaded or installed here.'
          : 'In the product this opens the hosted Web experience. No hosted experience exists yet, so nothing ' +
            'is loaded here.') + '</p>' +
        '<p style="margin-top:8px">Opened ' + esc(util.fmtDateTime(sim.startedAt)) + '.</p>');
    }

    /* ---- launch instructions, real content, no invented URL ---- */
    var instructions = isPackage
      ? '<details class="instr"><summary>' + ui.ic('info', 'sm') +
        'How the ' + esc(def.label) + ' experiment reaches your device</summary>' +
        '<div class="instr-b">' +
        '<p>This is how it will work once the ' + esc(def.label) + ' experiences are delivered. ' +
        'None of these steps is available yet.</p>' +
        '<ol>' +
        '<li>Your institution has to hold this experiment in ' + esc(def.label) +
        ', and it has to be assigned to you. Both are already true, which is why this page is open to you.</li>' +
        '<li>You will sign in on a supported device with the same institutional account.</li>' +
        '<li>The ' + esc(def.label) + ' experiment will appear among the experiences you are authorised to ' +
        'run. Experiments you are not entitled to will not appear.</li>' +
        '<li>You will open it, work through the procedure, and your completion will return to this page ' +
        'against ' + esc(def.label) + ' specifically.</li>' +
        '</ol>' +
        '<p class="instr-n">The exact delivery mechanism — a package installed directly, or a single ' +
        'institutional application that carries the experiments you are entitled to — has not been selected. ' +
        'Nothing on this page depends on which one is chosen.</p>' +
        '</div></details>'
      : '';

    var runCard = ui.card('Opening the ' + def.label + ' experiment',
      ladderHTML + runtime + instructions +
      '<div class="formact">' + actions +
      '<span class="formnote">' + esc(actionNote) + '</span></div>', null, 'h2');

    var reqCard = ui.card('What you need',
      '<div class="kv">' +
      '<div class="k">Technology</div><div class="v">' + ui.fmtBadge(tech) + ' ' + esc(def.name) + '</div>' +
      '<div class="k">Device</div><div class="v">' + esc(def.requirement) + '</div>' +
      '<div class="k">How it runs</div><div class="v">' + esc(def.deliveryLabel) + '</div>' +
      (sim && sim.status === state.SIM_STATUS.COMPLETED
        ? '<div class="k">Completed</div><div class="v">' + esc(util.fmtDateTime(sim.completedAt)) + '</div>' +
          '<div class="k">Time spent</div><div class="v">' + esc(L.fmtDuration(sim.timeSpentSeconds)) + '</div>'
        : '') +
      '</div>' +
      '<p class="cardfoot">Device compatibility is described, not certified. No specific headset, handset or ' +
      'browser build is claimed as supported here.</p>', null, 'h2');

    var otherTechs = row.technologies.filter(function (t) { return t !== tech; });
    var otherCard = otherTechs.length
      ? ui.card('Your other technologies',
          /* A technology-facing label reads THAT TECHNOLOGY'S OWN
             SIMULATION and nothing else — the rule stated at the head of
             student.js. Reading the Experiment roll-up here made an
             untouched AR simulation read "In progress" because the shared
             assessment had moved. */
          '<ul class="othertech">' + otherTechs.map(function (t) {
            return '<li>' + ui.fmtBadge(t) +
              '<span class="ot-s">' + L.simBadge(state.simulationStatus(p.id, e.id, t)) + '</span>' +
              '<a class="btn sm sec" href="' + L.href.simulation(p.id, e.id, t) + '">Open</a></li>';
          }).join('') + '</ul>' +
          '<p class="cardfoot">Each technology is tracked on its own. Completing one does not complete another.</p>',
          null, 'h2')
      : '';

    var html =
      ui.crumbs([{ label: 'My Learning', href: L.href.myLearning(p.id) },
                 { label: e.name, href: L.href.experiment(p.id, e.id) },
                 { label: def.label + ' simulation' }]) +
      ui.phead(e.name + ' — ' + def.name, L.courseLine(e.id)) +
      '<div class="grid-rail">' +
      '<div class="stack">' + runCard + '</div>' +
      '<div class="stack">' + reqCard + otherCard + '</div>' +
      '</div>';

    function bind(id, fn, msg) {
      var el = document.getElementById(id);
      if (!el) { return; }
      el.addEventListener('click', function () {
        el.disabled = true;
        fn();
        if (msg) { ui.toast(msg); }
        XRSLP.render(false);
      });
    }

    return {
      area: 'learn', title: e.name + ' — ' + def.name, html: html,
      student: p, tenant: tenant, navKey: 'my-learning',
      after: function () {
        bind('sim-request', function () { state.requestSimulationAccess(p.id, e.id, tech); },
          def.label + ' access requested for your device.');
        bind('sim-ready', function () { state.simulatePackageReady(p.id, e.id, tech); },
          def.label + ' is now ready on your device (prototype).');
        bind('sim-start', function () { state.startSimulation(p.id, e.id, tech); },
          def.label + ' simulation opened.');
        var done = document.getElementById('sim-complete');
        if (done) {
          done.addEventListener('click', function () {
            done.disabled = true;
            state.completeSimulation(p.id, e.id, tech);
            ui.toast('Completion recorded for ' + def.label + '.');
            XRSLP.render(false);
          });
        }
      }
    };
  };

  /* An explicit refusal — never a silently disabled control, and never
     an authorised state for a technology that was not granted. */
  function techRefusal(p, tenant, ctx, row, tech, def) {
    var e = ctx.experiment;
    var known = !!def;
    var everAssigned = row.blockedTechnologies.indexOf(tech) !== -1;
    return {
      area: 'learn', title: 'Not available to you', student: p, tenant: tenant, navKey: 'my-learning',
      html: ui.crumbs([{ label: 'My Learning', href: L.href.myLearning(p.id) },
                       { label: e.name, href: L.href.experiment(p.id, e.id) },
                       { label: 'Not available' }]) +
        ui.phead(e.name, L.courseLine(e.id)) +
        '<div class="stack">' +
        ui.alertBox('warning',
          known ? e.name + ' is not available to you in ' + def.label : 'That technology is not available to you',
          '<p>' + (everAssigned
            ? 'This technology was assigned to you, but it cannot be opened at the moment.'
            : 'Your institution decides which technologies it makes available for each experiment. ' +
              (known ? def.label + ' has not been made available to you for this experiment.'
                     : 'The technology in this address is not one you have been given.')) +
          '</p><p style="margin-top:8px">Nothing here is blocked as a formality — there is no authorised ' +
          'access behind this page to open.</p>', 'alert') +
        ui.card('What you can open',
          row.technologies.length
            ? '<ul class="othertech">' + row.technologies.map(function (t) {
                return '<li>' + ui.fmtBadge(t) +
                  '<span class="ot-s">' + L.simBadge(state.simulationStatus(p.id, e.id, t)) + '</span>' +
                  '<a class="btn sm pri" href="' + L.href.simulation(p.id, e.id, t) + '">Open</a></li>';
              }).join('') + '</ul>'
            : '<p class="cardlede">Nothing for this experiment is available to you at the moment.</p>',
          null, 'h2') +
        '<div class="formact"><a class="btn sec" href="' + L.href.experiment(p.id, e.id) +
        '">Back to the experiment</a></div>' +
        '</div>'
    };
  }

  /* ============================================================
     ASSESSMENT — introduction / disclosure
     ============================================================ */
  XRSLP.screens.studentAssessment = function (params) {
    var r = resolve(params, 'my-learning');
    if (r.fail) { return r.fail; }
    var p = r.student, tenant = r.tenant, ctx = r.ctx, row = r.row;
    var e = ctx.experiment;
    /* No technology gate here: the assessment belongs to the Experiment,
       and `resolve()` has already refused an Experiment the Student does
       not effectively hold. */
    var asm = state.assessmentForStudent(p.id, e.id);
    if (!asm) {
      return {
        area: 'learn', title: 'No assessment', student: p, tenant: tenant, navKey: 'my-learning',
        html: ui.crumbs([{ label: 'My Learning', href: L.href.myLearning(p.id) },
                         { label: e.name, href: L.href.experiment(p.id, e.id) },
                         { label: 'Assessment' }]) +
          ui.phead(e.name, L.courseLine(e.id)) +
          '<div class="tablecard">' + ui.emptyState({
            icon: 'doc', title: 'No assessment is set for this experiment',
            body: 'Not every experiment has one.',
            actionsHTML: '<a class="btn pri" href="' + L.href.experiment(p.id, e.id) + '">Back to the experiment</a>'
          }) + '</div>'
      };
    }

    var open = state.currentAttempt(p.id, e.id);
    var last = state.latestSubmittedAttempt(p.id, e.id);
    if (last && !open) { return { redirect: L.href.result(p.id, e.id) }; }

    var used = state.attemptsFor(p.id, e.id).length;
    var block = state.attemptBlock(p.id, e.id);
    var release = state.assessmentRelease(asm);
    /* "Have they run any of their simulations yet?" — the recommended
       order is Experiment-level now, not per technology. */
    var simDone = row.technologies.some(function (t) {
      return state.simulationStatus(p.id, e.id, t) === state.SIM_STATUS.COMPLETED;
    });

    var descCount = asm.questions.filter(function (q) { return q.type === 'descriptive'; }).length;

    /* The generated disclosure — what the Student is told BEFORE
       starting. Every figure comes from the assessment configuration;
       none is invented by this screen. Faculty preview renders the same
       rows through the same function. */
    var disclosure = L.disclosureRows(asm, {
      coversHTML: esc(e.name) + ' — one assessment for this experiment' +
        (row.technologies.length > 1
          ? ', whichever of ' + esc(row.technologies.map(function (t) {
              return data.TECHNOLOGIES[t].label; }).join(' and ')) + ' you work in' : ''),
      attemptsText: used + (asm.attemptLimit ? ' of ' + asm.attemptLimit : '') + ' used',
      releaseSentence: release.sentence,
      descriptiveText: descCount
        ? 'Your written ' + util.plural(descCount, 'answer') + ' ' + (descCount === 1 ? 'goes' : 'go') +
          ' to your faculty for review before your result is complete. Your marked questions are scored ' +
          'straight away.'
        : ''
    });

    var actionHTML, noteHTML = '';
    if (open) {
      actionHTML = '<a class="btn pri lg" href="' + L.href.attempt(p.id, e.id) + '">Continue your attempt</a>';
      noteHTML = 'You have an attempt in progress. Your answers were saved as you went.';
    } else if (block === 'attempt-limit') {
      actionHTML = '<a class="btn sec" href="' + L.href.experiment(p.id, e.id) + '">Back to the experiment</a>';
      noteHTML = 'You have used all ' + asm.attemptLimit + ' ' +
        util.plural(asm.attemptLimit, 'attempt') + ' for this assessment.';
    } else if (block === 'pending-faculty-review') {
      actionHTML = '<a class="btn sec" href="' + L.href.result(p.id, e.id) + '">See your result</a>';
      noteHTML = 'Your written answer is with your faculty for review. You cannot retake the assessment ' +
        'until that review is done.';
    } else if (block === 'no-questions') {
      actionHTML = '<a class="btn sec" href="' + L.href.experiment(p.id, e.id) + '">Back to the experiment</a>';
      noteHTML = 'Your faculty have not finished setting the questions for this assessment yet. ' +
        'Nothing is wrong with your access — there is simply nothing to answer.';
    } else if (block) {
      actionHTML = '<a class="btn sec" href="' + L.href.experiment(p.id, e.id) + '">Back to the experiment</a>';
      noteHTML = 'This assessment cannot be started right now.';
    } else {
      actionHTML = '<button class="btn pri lg" type="button" id="as-start">Start the assessment</button>';
      noteHTML = 'Your answers are saved as you go, so you can leave and come back.';
    }

    var html =
      ui.crumbs([{ label: 'My Learning', href: L.href.myLearning(p.id) },
                 { label: e.name, href: L.href.experiment(p.id, e.id) },
                 { label: 'Assessment' }]) +
      ui.phead(asm.title, L.courseLine(e.id)) +
      '<div class="grid-rail"><div class="stack">' +
      ui.card('Before you start',
        '<p class="cardlede">' + esc(asm.intro) + '</p>' + disclosure +
        '<div class="formact">' + actionHTML +
        '<span class="formnote">' + esc(noteHTML) + '</span></div>', null, 'h2') +
      '</div><div class="stack">' +
      (!simDone ? ui.card('Suggested order',
        '<p class="cardlede">You have not recorded a completion for any of your simulations yet. The ' +
        'recommended order is to work through the resources, run the simulation, then take the ' +
        'assessment — but nothing stops you starting here.</p>' +
        '<div class="formact"><a class="btn sec sm" href="' +
        L.href.simulation(p.id, e.id, row.technologies[0]) + '">Go to the simulation</a></div>',
        null, 'h2') : '') +
      ui.protoNote('<p>Everything above comes from the assessment your faculty configured for this ' +
        'experiment — the questions, the pass mark, how many attempts you have and when answers become ' +
        'visible. Change nothing here: a learner never configures an assessment.</p>') +
      '</div></div>';

    return {
      area: 'learn', title: asm.title, html: html, student: p, tenant: tenant, navKey: 'my-learning',
      after: function () {
        var btn = document.getElementById('as-start');
        if (!btn) { return; }
        btn.addEventListener('click', function () {
          btn.disabled = true;
          var att = state.startAttempt(p.id, e.id);
          if (!att) { btn.disabled = false; ui.toast('This assessment cannot be started right now.', 'info'); return; }
          XRSLP.router.go(L.href.attempt(p.id, e.id));
        });
      }
    };
  };

  /* ============================================================
     ASSESSMENT — the attempt.

     Answers persist on every change, so a refresh loses nothing.
     D-25 is absolute here: no correct answer and no explanation is
     rendered anywhere on this screen, whatever the visibility policy
     says about the RESULT.
     ============================================================ */
  XRSLP.screens.studentAttempt = function (params) {
    var r = resolve(params, 'my-learning');
    if (r.fail) { return r.fail; }
    var p = r.student, tenant = r.tenant, ctx = r.ctx, row = r.row;
    var e = ctx.experiment;
    var att = state.currentAttempt(p.id, e.id);
    if (!att) { return { redirect: L.href.assessment(p.id, e.id) }; }
    var asm = state.attemptAssessment(att);
    if (!asm) { return { redirect: L.href.experiment(p.id, e.id) }; }

    var answered = state.answeredCount(att);
    var unanswered = state.unansweredQuestions(att);
    var descN = asm.questions.filter(function (q) { return q.type === 'descriptive'; }).length;

    /* THE SHARED RENDERER. Faculty preview draws its questions through
       the same function, so what a Faculty member previews and what a
       Student answers cannot drift apart. D-25: no key is passed here. */
    var qHTML = asm.questions.map(function (q, i) {
      return L.questionBody(q, i, asm.questions.length, { given: att.answers[q.id] });
    }).join('');

    /* A compact review NAVIGATOR, not five repeated status cards. Each
       chip is a real button that jumps to its question — nothing here
       navigates the hash router, which would land the Student on
       "Page not found" and lose the attempt mid-assessment.

       ⚠ PRE-SUBMISSION. The only two states are ANSWERED and NOT
       ANSWERED. Nothing here may hint at correct or incorrect: the
       platform has not told the Student anything about correctness
       yet, so the answered mark uses the neutral action accent and
       never a success colour. */
    function isAnswered(q) {
      var v = att.answers[q.id];
      return v !== undefined && v !== null && v !== '';
    }
    var navChips = asm.questions.map(function (q, i) {
      var has = isAnswered(q);
      return '<li>' +
        '<button type="button" class="qn' + (has ? ' is-answered' : '') + '"' +
        ' data-jump="' + esc(q.id) + '" data-qn="' + (i + 1) + '"' +
        ' aria-label="Question ' + (i + 1) + ' \u2014 ' + (has ? 'answered' : 'not answered') + '">' +
        '<span class="qn-n">' + (i + 1) + '</span>' +
        '<span class="qn-s" aria-hidden="true">' + ui.ic(has ? 'check' : 'circle', 'sm') + '</span>' +
        '</button></li>';
    }).join('');

    function unansweredList() {
      return asm.questions.map(function (q, i) { return isAnswered(q) ? null : (i + 1); })
        .filter(function (n) { return n !== null; });
    }
    function countText(n) { return n + ' of ' + asm.questions.length + ' answered'; }
    function noteText(left) {
      return left
        ? left + ' ' + util.plural(left, 'question') + ' still ' +
          (left === 1 ? 'needs' : 'need') + ' an answer.'
        : 'All questions have been answered. Review anything you want before submitting.';
    }
    var openList = unansweredList();

    var html =
      ui.crumbs([{ label: 'My Learning', href: L.href.myLearning(p.id) },
                 { label: e.name, href: L.href.experiment(p.id, e.id) },
                 { label: 'Assessment' }]) +
      ui.phead(asm.title, L.courseLine(e.id) +
        ' · attempt ' + att.attemptNo + (asm.attemptLimit ? ' of ' + asm.attemptLimit : '')) +
      '<div class="attemptbar" id="attempt-bar">' +
      '<span class="ab-k">Answered</span>' +
      '<span class="ab-v tabular" id="ab-count">' + answered + ' of ' + asm.questions.length + '</span>' +
      '<span class="ab-n">Your answers are saved as you go.</span>' +
      '</div>' +
      '<div class="qwrap">' + qHTML + '</div>' +
      '<section class="reviewcard" id="review" aria-labelledby="rv-h">' +
      '<h2 id="rv-h">Review your answers</h2>' +
      '<p class="rv-lede">Check that you are happy with every answer. You cannot change an answer after ' +
      'you submit.</p>' +
      '<div class="rv-sum">' +
      '<span class="rv-count tabular" id="rv-count">' + esc(countText(answered)) + '</span>' +
      '<span class="rv-note" id="rv-note">' + esc(noteText(openList.length)) + '</span>' +
      '</div>' +
      '<div class="rv-nav">' +
      '<h3 class="rv-navh" id="rv-navh">Questions</h3>' +
      '<ul class="qnav" id="rv-chips" aria-labelledby="rv-navh">' + navChips + '</ul>' +
      '<p class="qnav-key" aria-hidden="true">' +
      '<span>' + ui.ic('check', 'sm') + 'answered</span>' +
      '<span>' + ui.ic('circle', 'sm') + 'not answered</span></p>' +
      '<p class="rv-open" id="rv-open"' + (openList.length ? '' : ' hidden') + '>Still to answer: ' +
      '<span id="rv-open-n">' + esc(openList.join(', ')) + '</span></p>' +
      '</div>' +
      '<div class="rv-act">' +
      '<button class="btn sec" type="button" id="as-next"' + (openList.length ? '' : ' hidden') + '>' +
      'Go to next unanswered</button>' +
      /* Submit stays ENABLED even when questions are unanswered. No source
         makes every question mandatory, so the prototype must not encode
         that as a rule — it warns instead, and the Student decides. */
      '<button class="btn pri lg" type="button" id="as-submit">Submit assessment</button>' +
      '<span class="formnote" id="rv-hint">' +
      (openList.length ? 'You can submit now, but unanswered questions will receive no marks.' : '') +
      '</span></div></section>';

    return {
      area: 'learn', title: asm.title + ' — attempt', html: html,
      student: p, tenant: tenant, navKey: 'my-learning',
      after: function () {
        /* Move to a question and hand it the keyboard. Focus lands on the
           question's own section, not on an option, so a screen reader
           announces the question and its type before any answer — and so
           arriving at a radio group never looks like a selection. */
        function goToQuestion(questionId) {
          var target = document.getElementById('qn-' + questionId);
          if (!target) { return; }
          target.scrollIntoView({ block: 'center' });
          target.setAttribute('tabindex', '-1');
          try { target.focus({ preventScroll: true }); } catch (err) { target.focus(); }
          target.addEventListener('blur', function onBlur() {
            target.removeAttribute('tabindex');
            target.removeEventListener('blur', onBlur);
          });
        }

        function refreshCounts() {
          var live = state.attemptById(att.id);
          if (!live) { return; }
          var n = state.answeredCount(live);
          var open = [];
          asm.questions.forEach(function (q, i) {
            var v = live.answers[q.id];
            if (v === undefined || v === null || v === '') { open.push(i + 1); }
          });

          var bar = document.getElementById('ab-count');
          if (bar) { bar.textContent = n + ' of ' + asm.questions.length; }
          var cnt = document.getElementById('rv-count');
          if (cnt) { cnt.textContent = countText(n); }
          var note = document.getElementById('rv-note');
          if (note) { note.textContent = noteText(open.length); }

          /* Each chip carries its status in its accessible name, so the
             mark is never the only way to know. */
          Array.prototype.slice.call(document.querySelectorAll('#rv-chips .qn')).forEach(function (btn, i) {
            var q = asm.questions[i];
            var v = live.answers[q.id];
            var has = v !== undefined && v !== null && v !== '';
            btn.classList.toggle('is-answered', has);
            btn.setAttribute('aria-label',
              'Question ' + (i + 1) + ' \u2014 ' + (has ? 'answered' : 'not answered'));
            var mark = btn.querySelector('.qn-s');
            if (mark) { mark.innerHTML = ui.ic(has ? 'check' : 'circle', 'sm'); }
          });

          var openRow = document.getElementById('rv-open');
          var openN = document.getElementById('rv-open-n');
          if (openN) { openN.textContent = open.join(', '); }
          if (openRow) { openRow.hidden = open.length === 0; }

          var next = document.getElementById('as-next');
          if (next) { next.hidden = open.length === 0; }

          /* The Submit control is never disabled — incompleteness is a
             warning, not a block. The note beside it states the cost. */
          var hint = document.getElementById('rv-hint');
          if (hint) {
            hint.textContent = open.length
              ? 'You can submit now, but unanswered questions will receive no marks.' : '';
          }
        }

        Array.prototype.slice.call(document.querySelectorAll('[data-jump]')).forEach(function (btn) {
          btn.addEventListener('click', function (ev) {
            ev.preventDefault();
            goToQuestion(btn.getAttribute('data-jump'));
          });
        });

        var nextBtn = document.getElementById('as-next');
        if (nextBtn) {
          nextBtn.addEventListener('click', function () {
            var live = state.attemptById(att.id);
            if (!live) { return; }
            var target = null;
            asm.questions.forEach(function (q) {
              if (target) { return; }
              var v = live.answers[q.id];
              if (v === undefined || v === null || v === '') { target = q.id; }
            });
            if (target) { goToQuestion(target); }
          });
        }

        Array.prototype.slice.call(document.querySelectorAll('[data-q]')).forEach(function (el) {
          var kind = el.getAttribute('data-kind');
          var qid = el.getAttribute('data-q');
          var evt = kind === 'text' ? 'input' : 'change';
          el.addEventListener(evt, function () {
            var value;
            if (kind === 'mcq') { value = parseInt(el.value, 10); }
            else if (kind === 'tf') { value = el.value === 'true'; }
            else { value = el.value.trim(); }
            state.saveAnswer(att.id, qid, value);
            /* Keep the "chosen" styling on exactly one option per question.
               It says SELECTED, never correct or incorrect. */
            if (kind !== 'text') {
              Array.prototype.slice.call(
                document.querySelectorAll('input[name="' + CSS.escape(el.name) + '"]')
              ).forEach(function (sib) {
                var rowEl = sib.parentNode;
                if (rowEl && rowEl.classList) { rowEl.classList.toggle('is-selected', sib.checked); }
              });
            }
            refreshCounts();
          });
        });

        var submit = document.getElementById('as-submit');
        if (!submit) { return; }
        submit.addEventListener('click', function () {
          var live = state.attemptById(att.id);
          if (!live || live.status !== state.ATTEMPT_STATUS.IN_PROGRESS) { return; }
          /* Which question numbers are still open, so the warning can name
             them rather than only counting them. */
          var openNums = [];
          asm.questions.forEach(function (q, i) {
            var v = live.answers[q.id];
            if (v === undefined || v === null || v === '') { openNums.push(i + 1); }
          });
          var n = openNums.length;
          ui.openDialog({
            title: 'Submit assessment?',
            /* The wording matches what scoring actually does: an unanswered
               question earns nothing. It is NOT marked incorrect, and there
               is no negative marking, so neither is claimed. */
            bodyHTML: (n
                ? '<p><strong>' + n + ' ' + util.plural(n, 'question') + ' ' +
                  (n === 1 ? 'is' : 'are') + ' still unanswered.</strong></p>' +
                  '<div class="consequence">' + ui.ic('alert') +
                  '<span><strong>Unanswered ' + util.plural(n, 'question') + ':</strong> ' +
                  esc(openNums.join(', ')) + '</span></div>' +
                  '<p style="margin-top:10px">If you submit now, unanswered questions will receive no ' +
                  'marks and you will not be able to change your answers afterward.</p>'
                : '<p>Your answers are submitted for ' + esc(e.name) +
                  '. You cannot change them afterwards.</p>') +
              (descN
                ? '<div class="consequence">' + ui.ic('info') +
                  '<span>Your written ' + util.plural(descN, 'answer') + ' ' +
                  (descN === 1 ? 'goes' : 'go') + ' to your faculty for review before your result is ' +
                  'complete. Your marked questions are scored straight away.</span></div>'
                : ''),
            cancelLabel: n ? 'Continue reviewing' : 'Cancel',
            okLabel: n ? 'Submit anyway' : 'Submit',
            onConfirm: function () {
              submit.disabled = true;
              var done = state.submitAttempt(att.id);
              if (!done) { ui.toast('This attempt has already been submitted.', 'info'); }
              else { ui.toast('Your answers have been submitted.'); }
              XRSLP.router.go(L.href.result(p.id, e.id));
            }
          });
        });
      }
    };
  };

  /* ============================================================
     ASSESSMENT — the result.

     What is shown depends on the Faculty-controlled visibility policy
     (STK31-32), NOT on a hardcoded assumption of immediate feedback.
     ============================================================ */
  XRSLP.screens.studentResult = function (params) {
    var r = resolve(params, 'my-learning');
    if (r.fail) { return r.fail; }
    var p = r.student, tenant = r.tenant, ctx = r.ctx, row = r.row;
    var e = ctx.experiment;
    /* D-25 IS ABSOLUTE. A previous result can carry the correct answers and
       the explanations; a retry is an ATTEMPT. Leaving the old result
       reachable while a new attempt is open would put the answer key one
       click away from the questions being answered — so an open attempt
       always wins the route. */
    var openAtt = state.currentAttempt(p.id, e.id);
    if (openAtt) { return { redirect: L.href.attempt(p.id, e.id) }; }
    var att = state.latestSubmittedAttempt(p.id, e.id);
    if (!att) { return { redirect: L.href.assessment(p.id, e.id) }; }
    /* THE SNAPSHOT IS WHAT WAS ANSWERED. Questions, options, answer key,
       marks and pass mark come from the attempt's own copy, so a later
       Faculty edit can never rewrite a result that has already been
       given. */
    var asm = state.attemptAssessment(att);
    if (!asm) { return { redirect: L.href.experiment(p.id, e.id) }; }

    /* THE POLICY IS LIVE. When answers and explanations become visible
       is a Faculty decision about what happens next (STK31-32), so it
       is read from the current configuration — a Faculty member who
       changes it must reach this screen, or the control would not be
       the control the source describes. */
    var release = state.releaseFor(att);
    var descCount = asm.questions.filter(function (q) { return q.type === 'descriptive'; }).length;
    var pending = att.outcome === state.OUTCOME.PENDING_REVIEW;
    var used = state.attemptsFor(p.id, e.id).length;
    /* THE ATTEMPT LIMIT IS LIVE. `asm` is the attempt's frozen snapshot,
       which is right for the questions and the pass mark and wrong for
       this: `attemptBlock` gates a new attempt on the CURRENT definition,
       so reading the snapshot here would offer "Try again" the gate then
       refuses, or hide it when the gate would allow it. */
    var liveAsm = state.assessmentForStudent(p.id, e.id);
    var attemptLimit = liveAsm ? liveAsm.attemptLimit : asm.attemptLimit;
    var revState = state.attemptReviewState(att.id);
    /* A FINAL result only exists once Faculty have reviewed the written
       answers. When the visibility policy delays release, that final
       result is withheld with the answers it belongs to — the same
       policy engine, no special path (brief §30). The objective
       sub-score is NOT withheld: it existed at submission and
       Implementation 03 already showed it under every policy. */
    var reviewed = revState.total > 0 && revState.pending === 0;
    /* ONE release decision, shared with Progress and with the badges.
       While it holds, NO figure is shown — not the combined score and
       not the objective sub-score — and no outcome. */
    var scoreHidden = state.scoreWithheld(p.id, e.id);
    var finalWithheld = scoreHidden && !pending;
    /* ⚠ RETRY IS AN OUTCOME CHANNEL. "Try again" appears only for a
       NOT_PASSED attempt, so offering it — or withdrawing it — while the
       result is withheld would announce the result the rest of this
       screen is holding back. Nothing about the attempt limit changes;
       the control simply waits for release, like everything else. */
    var canRetry = !pending && !scoreHidden &&
      att.outcome === state.OUTCOME.NOT_PASSED && !state.attemptBlock(p.id, e.id);

    /* Once Faculty have marked the written answers, the percentage is no
       longer "the marked questions" — it is the whole assessment. The
       sentence has to say which, or the number and the words disagree. */
    var scoredOn = att.score.includesReview
      ? 'across the whole assessment, including the marks your faculty awarded'
      : 'on the marked questions';

    /* ---- headline ---- */
    var headline;
    if (finalWithheld) {
      headline = ui.alertBox('info', 'Result pending release',
        '<p>' + (reviewed
          ? 'Your faculty have finished reviewing your written ' + util.plural(descCount, 'answer') + '. '
          : 'Your assessment has been recorded. ') + esc(release.sentence) + '</p>' +
        '<p style="margin-top:8px">Your marks and your result become available then. Nothing further is ' +
        'needed from you.</p>', 'status');
    } else if (pending && scoreHidden) {
      headline = ui.alertBox('warning', 'Pending Faculty review',
        '<p>Your written ' + util.plural(descCount, 'answer') + ' ' +
        (descCount === 1 ? 'is' : 'are') + ' with your faculty for review. Until that review is done, ' +
        'this experiment is not counted as finished.</p>' +
        '<p style="margin-top:8px">' + esc(release.sentence) + '</p>', 'status');
    } else if (pending) {
      headline = ui.alertBox('warning', 'Pending Faculty review',
        '<p>Your written ' + util.plural(descCount, 'answer') + ' ' +
        (descCount === 1 ? 'is' : 'are') + ' with your faculty for review. Until that review is done, ' +
        'this experiment is not counted as finished.</p>' +
        '<p style="margin-top:8px">Your marked questions have been scored, and your answers are shown ' +
        'below.</p>', 'status');
    } else if (att.outcome === state.OUTCOME.PASSED) {
      headline = ui.alertBox('success', 'You passed',
        '<p>You scored ' + att.score.percent + '% ' + scoredOn + ', and the pass mark is ' +
        asm.passMark + '%.</p>', 'status');
    } else {
      headline = ui.alertBox('danger', 'Not passed this time',
        '<p>You scored ' + att.score.percent + '% ' + scoredOn + ', and the pass mark is ' +
        asm.passMark + '%.</p>' +
        (canRetry
          ? '<p style="margin-top:8px">You have ' + Math.max(0, attemptLimit - used) + ' ' +
            util.plural(Math.max(0, attemptLimit - used), 'attempt') + ' left.</p>'
          : '<p style="margin-top:8px">You have used all ' + attemptLimit + ' ' +
            util.plural(attemptLimit, 'attempt') + '.</p>'), 'status');
    }

    /* ---- score ----
       ⚠ WHILE THE RESULT IS WITHHELD THIS CARD CARRIES NO FIGURE.
       Not the combined score, and not the objective sub-score either:
       "marked automatically" is not the same as "released", and an
       objective figure high or low enough to settle the pass mark is the
       result, disclosed early by another name. What stays is what is
       safe — what the assessment covers, which attempt this was, when it
       was submitted, the pass mark, and how the written answers are
       progressing. */
    var sc = att.score;
    var scoreBody;
    if (scoreHidden) {
      scoreBody = ui.emptyState({
        icon: 'clock', heading: 'h3',
        title: 'Your marks are not available yet',
        body: release.sentence
      });
    } else {
      var showObjectiveOnly = pending || !sc.includesReview;
      var boxPercent = showObjectiveOnly
        ? (sc.objectiveTotal > 0
            ? Math.round(((sc.objectiveEarned || 0) / sc.objectiveTotal) * 100)
            : (sc.percent === null ? null : sc.percent))
        : sc.percent;
      var boxEarned = showObjectiveOnly ? (sc.objectiveEarned !== undefined ? sc.objectiveEarned : sc.earned) : sc.earned;
      var boxTotal = showObjectiveOnly ? (sc.objectiveTotal !== undefined ? sc.objectiveTotal : sc.total) : sc.total;
      scoreBody =
        '<div class="scorebox">' +
        '<div class="sb-v tabular">' + (boxPercent === null ? '—' : boxPercent + '%') + '</div>' +
        '<div class="sb-d">' + boxEarned + ' of ' + boxTotal + ' ' +
        util.plural(boxTotal, 'mark') + ' ' + (showObjectiveOnly
          ? 'on the questions that are marked automatically'
          : 'including the marks your faculty awarded') + '</div>' +
        '</div>';
    }
    var scoreCard = ui.card(scoreHidden ? 'Your result' : 'Your score',
      scoreBody +
      '<div class="kv" style="margin-top:12px">' +
      '<div class="k">Covers</div><div class="v">' + esc(e.name) + '</div>' +
      (att.sourceTechnology && data.TECHNOLOGIES[att.sourceTechnology]
        ? '<div class="k">Taken after</div><div class="v">' + ui.fmtBadge(att.sourceTechnology) + ' ' +
          esc(data.TECHNOLOGIES[att.sourceTechnology].name) + ' simulation</div>' : '') +
      '<div class="k">Attempt</div><div class="v">' + att.attemptNo +
      (attemptLimit ? ' of ' + attemptLimit : '') + '</div>' +
      '<div class="k">Submitted</div><div class="v">' + esc(util.fmtDateTime(att.submittedAt)) + '</div>' +
      '<div class="k">Pass mark</div><div class="v">' + asm.passMark + '%</div>' +
      (revState.total
        ? '<div class="k">Written ' + util.plural(revState.total, 'answer') + '</div><div class="v">' +
          (reviewed ? revState.total + ' of ' + revState.total + ' reviewed by your faculty'
                    : revState.completed + ' of ' + revState.total + ' reviewed so far') + '</div>'
        : '') +
      '</div>' +
      (data.hasDescriptive(asm)
        ? '<p class="cardfoot">' + (reviewed
            ? (finalWithheld
                ? 'Your faculty have reviewed your written ' + util.plural(descCount, 'answer') +
                  '. Your final result is released with your answers.'
                : 'Your faculty have reviewed your written ' + util.plural(descCount, 'answer') +
                  ', and those marks are included above.')
            : 'Written answers are not scored automatically. Your faculty review them, and your result is ' +
              'complete once that review is done.') + '</p>'
        : ''),
      null, 'h2');

    /* ---- answers, governed by the policy ---- */
    var answersCard;
    if (!release.released) {
      answersCard = ui.card('Your answers',
        ui.emptyState({
          icon: 'clock', heading: 'h3',
          title: 'Your answers are not available yet',
          body: release.sentence
        }) +
        '<div class="polnote">' + ui.ic('info', 'sm') +
        '<span><strong>' + esc(data.policyLabel(release.mode)) + '.</strong> ' +
        'Your faculty decide when answers and explanations become visible. Your submission has been ' +
        'recorded and your score above is final for the marked questions.</span></div>',
        null, 'h2');
    } else {
      var items = asm.questions.map(function (q, i) {
        var given = att.answers[q.id];
        var has = given !== undefined && given !== null && given !== '';
        if (q.type === 'descriptive') {
          /* Once Faculty have reviewed, THIS is where the evaluated
             result appears — the same record, not a Faculty-only copy. */
          var rv = state.reviewsForAttempt(att.id).filter(function (x) {
            return x.questionId === q.id;
          })[0] || null;
          var done = rv && rv.status === 'completed';
          return '<li class="ansrow ' + (done ? 'reviewed' : 'pending') + '">' +
            '<div class="an-h"><span class="an-n">Question ' + (i + 1) + '</span>' +
            (done
              ? ui.badge('b-success', 'check', rv.marks + ' of ' + rv.maxMarks + ' ' +
                  util.plural(rv.maxMarks, 'mark'))
              : ui.badge('b-warning', 'clock', 'Pending Faculty review')) + '</div>' +
            '<p class="an-q">' + esc(q.text) + '</p>' +
            '<div class="an-a"><span class="an-k">Your answer</span>' +
            '<p>' + (has ? esc(given) : '<span class="muted">You did not answer this question.</span>') + '</p></div>' +
            (done
              ? (rv.feedback
                  ? '<div class="an-e"><span class="an-k">' + ui.ic('edit', 'sm') + 'Faculty feedback</span>' +
                    '<p>' + esc(rv.feedback) + '</p></div>'
                  : '<div class="an-e"><span class="an-k">' + ui.ic('check', 'sm') + 'Reviewed</span>' +
                    '<p>Your faculty awarded ' + rv.marks + ' of ' + rv.maxMarks + ' ' +
                    util.plural(rv.maxMarks, 'mark') + ' and left no written feedback.</p></div>')
              : '<div class="an-e"><span class="an-k">' + ui.ic('info', 'sm') + 'What happens next</span>' +
                '<p>This answer is with your faculty for review, and carries no result until that is done.</p>' +
                '</div>') +
            '</li>';
        }
        var correct = given === q.answer;
        var yourText = q.type === 'mcq'
          ? (has ? q.options[given] : null)
          : (has ? (given ? 'True' : 'False') : null);
        var rightText = q.type === 'mcq' ? q.options[q.answer] : (q.answer ? 'True' : 'False');
        /* A correct answer is shown ONCE. Repeating the same sentence under
           "Correct answer" would be noise, not confirmation. */
        return '<li class="ansrow ' + (correct ? 'right' : 'wrong') + '">' +
          '<div class="an-h"><span class="an-n">Question ' + (i + 1) + '</span>' +
          (correct ? ui.badge('b-success', 'check', 'Correct') : ui.badge('b-danger', 'x', 'Incorrect')) + '</div>' +
          '<p class="an-q">' + esc(q.text) + '</p>' +
          '<div class="an-a ' + (correct ? 'is-right' : 'is-wrong') + '">' +
          '<span class="an-k">' + ui.ic(correct ? 'check' : 'x', 'sm') + 'Your answer</span>' +
          '<p>' + (yourText ? esc(yourText) : '<span class="muted">You did not answer this question.</span>') + '</p></div>' +
          (!correct
            ? '<div class="an-a is-right"><span class="an-k">' + ui.ic('check', 'sm') + 'Correct answer</span>' +
              '<p>' + esc(rightText) + '</p></div>'
            : '') +
          (q.explanation
            ? '<div class="an-e"><span class="an-k">Why</span><p>' + esc(q.explanation) + '</p></div>'
            : '') +
          '</li>';
      }).join('');
      answersCard = ui.card('Your answers',
        '<div class="polnote">' + ui.ic('info', 'sm') +
        '<span><strong>' + esc(data.policyLabel(release.mode)) + '.</strong> ' + esc(release.sentence) +
        '</span></div>' +
        '<ul class="anslist">' + items + '</ul>', null, 'h2');
    }

    var actions =
      '<div class="formact">' +
      (canRetry
        ? '<button class="btn pri" type="button" id="as-retry">Try again</button>' : '') +
      '<a class="btn sec" href="' + L.href.experiment(p.id, e.id) + '">Back to the experiment</a>' +
      '<a class="btn sec" href="' + L.href.progress(p.id) + '">See your progress</a>' +
      '<span class="formnote">This is your result for ' + esc(e.name) +
      '. One assessment covers the experiment, whichever technology you worked in.</span>' +
      '</div>';

    var html =
      ui.crumbs([{ label: 'My Learning', href: L.href.myLearning(p.id) },
                 { label: e.name, href: L.href.experiment(p.id, e.id) },
                 { label: 'Result' }]) +
      ui.phead('Your result', esc(asm.title)) +
      '<div class="stack">' + headline +
      '<div class="grid-rail"><div class="stack">' + answersCard + '</div>' +
      '<div class="stack">' + scoreCard + '</div></div>' +
      actions + '</div>';

    return {
      area: 'learn', title: 'Result — ' + asm.title, html: html,
      student: p, tenant: tenant, navKey: 'my-learning',
      after: function () {
        var retry = document.getElementById('as-retry');
        if (!retry) { return; }
        retry.addEventListener('click', function () {
          retry.disabled = true;
          var att2 = state.startAttempt(p.id, e.id);
          if (!att2) { retry.disabled = false; ui.toast('No attempts remain.', 'info'); return; }
          XRSLP.router.go(L.href.attempt(p.id, e.id));
        });
      }
    };
  };
})();
