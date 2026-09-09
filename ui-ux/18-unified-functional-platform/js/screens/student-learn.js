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

   ⚠ HOW A FINISHED RUN IS CONFIRMED IS ALSO UNDECIDED.
   The simulation screen records a completion from a control the Student
   presses. That control is a stand-in: an API/event call from the
   experiment runtime back to the platform has been discussed and is the
   expected direction, but nothing about it is settled, so no surface here
   may describe the confirmation as a mechanism that exists.

   Implementation 08 moved that statement out of the learner's way without
   softening it. The stand-in controls sit in a `ui.demoPanel()` that names
   itself a demo control, and the caveat over every figure they produce is
   `L.completionNote()` — a folded product note, still rendered in every
   state on both screens that assert a completion, still saying plainly
   that nothing here was reported by the experiment. What was removed is
   the 73-word engineering panel, the four-step narrative of a delivery
   mechanism that does not exist, and the three restatements of the same
   open decision on one screen. The reasoning behind each removal is kept
   in a comment at the place the logic lives.

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

  /* ---------------- a technology that WAS granted but is held back ----------------
     `state.studentExperiments()` puts into `row.blockedTechnologies` a
     technology that reaches this Student only through an entitlement
     that is not currently effective. On an experiment that is otherwise
     open, `row.effective` stays true and `row.blockedBy` stays null — so
     the technology simply disappeared from this page, while the panel
     note went on saying that any technology not listed "has not been
     made available to you", which is untrue of exactly these.

     Everywhere else in this build a gap is shown WITH its reason, so it
     is named here the same way. This grants nothing: the run gate is
     `state.studentCanRun()` and it is untouched.

     `L.unavailableText()` is not reusable here — those sentences end
     "on this experiment", and this experiment is open. Only the two
     per-record reasons can occur, because a block on the account or the
     institution leaves no effective entitlement at all. */
  var TECH_HELD_TEXT = {
    'allocation-held': 'your institution has not yet made a place available for you in it',
    'access-expired':  'your institution’s access covering it has reached its end date'
  };
  function heldTechReason(row, tech) {
    var reason = null;
    row.entitlements.forEach(function (en) {
      if (reason || en.effective) { return; }
      if (en.technologies.indexOf(tech) !== -1) { reason = en.blockedBy; }
    });
    return TECH_HELD_TEXT[reason] || 'it cannot be opened at the moment';
  }
  /* Rendered as a `.polnote` — the compact grey note this file already
     uses for the assessment release policy. It used to be a `.lp-note`,
     which only exists inside the rail panel it was written for; the note
     now sits with the technologies it is about, in the Simulation card. */
  function heldTechNote(row) {
    if (!row.blockedTechnologies.length) { return ''; }
    return '<div class="polnote">' + ui.ic('alert', 'sm') + '<span>' +
      row.blockedTechnologies.map(function (t) {
        var def = data.TECHNOLOGIES[t];
        return esc((def ? def.label : t) + ' was made available to you for this experiment, but ' +
          heldTechReason(row, t) + '.');
      }).join(' ') +
      ' Your institution administers this. Nothing has been removed.</span></div>';
  }

  /* ---------------- the progression, drawn from one place ----------------
     LEARNING RESOURCES → SIMULATION → ASSESSMENT → COMPLETION is the
     confirmed model (PM-09). It was drawn only on the Experiment page, by
     a Student-only `.seqstrip` that predates the shared stepper, so a
     Student who followed a link into the assessment lost every sense of
     where they were in it. It is drawn here through `ui.track()` — the
     one stepper in the design system — and the same four steps are shown
     on the Experiment page and on the assessment introduction.

     ⚠ STEP 3 IS THE EXPERIMENT'S ASSESSMENT, ON EVERY SCREEN.
     There is ONE assessment per Experiment. It is read with no technology
     in the call, and where the Student holds more than one technology the
     step says so in its own words, so no screen can be read as offering
     one assessment per technology.

     `live` names the step the CURRENT SCREEN is, so a step nobody has
     started still reads as "you are here". A step already finished keeps
     its done state: arriving on a screen does not un-finish it. */
  function progressTrack(prog, asm, assessState, live) {
    var res = prog.resources;
    /* Every figure comes from `prog`, which was derived from the
       technologies this Student actually holds — never from a list this
       function was handed separately, which is how a denominator and a
       label drift apart. */
    var rows = prog.technologies;
    var simDone = rows.length && rows.every(function (t) {
      return t.simulationStatus === state.SIM_STATUS.COMPLETED;
    });
    var simStarted = rows.some(function (t) {
      return t.simulationStatus !== state.SIM_STATUS.NOT_STARTED;
    });
    var steps = [
      { t: 'Learning resources',
        d: res.total ? res.completed + ' of ' + res.total + ' marked as done'
                     : 'None for this experiment',
        state: !res.total ? 'todo'
             : res.completed === res.total ? 'done'
             : res.started ? 'live' : 'todo' },
      { t: 'Simulation',
        d: !rows.length ? 'No technology available to you'
          : rows.length === 1
          ? data.TECHNOLOGIES[rows[0].technology].label + ' — ' +
            L.simLabel(rows[0].simulationStatus).toLowerCase()
          : rows.filter(function (t) {
              return t.simulationStatus === state.SIM_STATUS.COMPLETED;
            }).length + ' of ' + rows.length + ' technologies complete',
        state: simDone ? 'done' : simStarted ? 'live' : 'todo' },
      { t: 'Assessment',
        d: !asm ? 'None set for this experiment'
          : L.assessLabel(assessState) +
            (rows.length > 1 ? ' — one for the whole experiment' : ''),
        state: !asm ? 'todo'
          : assessState === state.ASSESS_STATE.PASSED ? 'done'
          : assessState === state.ASSESS_STATE.NOT_STARTED ? 'todo' : 'live' },
      { t: 'Completion',
        d: L.progressLabel(prog.status),
        state: prog.status === state.TECH_PROGRESS.COMPLETED ? 'done' : 'todo' }
    ];
    if (steps[live] && steps[live].state !== 'done') { steps[live].state = 'live'; }
    return '<div class="exptrack">' +
      '<h2 class="et-k">Your progress through this experiment</h2>' +
      ui.track(steps) + '</div>';
  }

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

    /* ---- the sequence, with its live state ----
       `L.sequenceStrip` (the Student-only `.seqstrip`) predates the shared
       `ui.track()` stepper and drew the same four steps in a private
       component. One stepper, one place. */
    var seq = progressTrack(prog, asm, assessState, null);

    /* ---- about ----
       DEMOTED TO THE RAIL, ON PURPOSE. The description and the outcomes
       are reference material: true, worth reading once, and nobody's
       reason for opening the page a second time. Given a card of its own
       at the top of the main column it made the first screenful of a
       LEARNING page a piece of prose, which is most of why this page read
       as a specification. The main column now carries the three things
       the Student came to do, in the order the model puts them. */
    var outcomes = e.outcomes || [];
    var aboutPanel =
      '<section class="lpanel">' +
      '<h2 class="lp-h">About this experiment</h2>' +
      '<div class="lp-b">' +
      (e.description ? '<p class="lp-txt">' + esc(e.description) + '</p>' : '') +
      /* An experiment with no stated outcomes gets no empty heading over
         an empty list — the catalogue does not require them. */
      (outcomes.length
        ? '<h3 class="subh">What you should be able to do afterwards</h3>' +
          '<ul class="outcomelist">' + outcomes.map(function (o) {
            return '<li>' + ui.ic('check', 'sm') + '<span>' + esc(o) + '</span></li>';
          }).join('') + '</ul>'
        : '') +
      '</div></section>';

    /* ---- learning resources ---- */
    var resBody;
    if (!resources.length) {
      /* A card whose body is a 48px medallion reads as unfinished. The
         compact row says the same thing at the weight it is worth. */
      resBody = ui.emptyRow({
        icon: 'book', heading: 'h3',
        title: 'No learning resources for this experiment',
        body: 'You can go straight to the simulation.'
      });
    } else {
      resBody =
        '<p class="cardlede">Not a gate — you can open the simulation at any time — but they do count ' +
        'towards completing this experiment. Mark each one as done when you have read it.</p>' +
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
        /* ── Implementation 09 — WHAT THIS TECHNOLOGY ACTUALLY COST ──
           This showed a time only once the run was COMPLETE, so a
           Student who had spent an hour and not finished saw nothing
           at all. Time and sessions are real either way, and the card
           now says so — from the runtime fold, not from a single
           subtraction. */
        (t.utilisation && t.utilisation.used
          ? '<dt>Time spent</dt><dd>' +
            (t.utilisation.totalSeconds
              ? esc(L.fmtDuration(t.utilisation.totalSeconds)) +
                (t.utilisation.sessionCount > 1
                  ? ' <span class="muted">over ' + t.utilisation.sessionCount + ' sessions</span>' : '')
              : '<span class="muted">Nothing measured yet</span>') + '</dd>' +
            '<dt>Times opened</dt><dd class="tabular">' + t.utilisation.launches + '</dd>'
          : '') +
        '</dl>' +
        '<div class="tc-act"><a class="btn sm pri" href="' +
        L.href.simulation(p.id, e.id, t.technology) + '">' + esc(action) + '</a></div>' +
        '</article>';
    }).join('');

    /* ⚠ WHAT THIS CARD MAY AND MAY NOT BE READ AS SAYING.
       The technologies listed are the ENTITLEMENT statement: they are what
       this institution made available to this Student for this experiment,
       and each one is tracked on its own. The assessment is NOT among them
       — it belongs to the Experiment — so the foot of the card says so
       wherever more than one technology could invite the opposite reading.

       The two branches of the second sentence are not interchangeable.
       Only say "no other technology was made available" when it is true;
       when one WAS made available and is currently held back, this page
       names it, and `heldTechNote` says which and why. */
    var simCard = ui.card('Simulation',
      '<p class="cardlede">' + (techs.length === 1
        ? 'Your institution has made this experiment available to you in one technology.'
        : 'Your institution has made this experiment available to you in ' + techs.length +
          ' technologies. Each one is tracked separately.') + '</p>' +
      '<div class="techgrid">' + simCards + '</div>' +
      heldTechNote(row) +
      '<p class="cardfoot">' +
      (row.blockedTechnologies.length
        ? 'Any technology not named here has not been made available to you. '
        : 'Other technologies may exist for this experiment; they have not been made available to you. ') +
      'The assessment is separate and covers the experiment as a whole.' +
      '</p>',
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
        /* THE canonical statement of the one-assessment rule on this
           page. The Simulation card above points at it in half a line;
           this is where it is spelled out, because this is the card the
           rule is about. */
        (techs.length > 1
          ? '<p class="cardfoot">One assessment covers this experiment, whichever technology you work ' +
            'in — you are not asked to sit it again for each one.</p>' : ''),
        asm.questions.length + ' ' + util.plural(asm.questions.length, 'question'), 'h2');
    } else {
      asmCard = ui.card('Assessment',
        ui.emptyRow({
          icon: 'doc', heading: 'h3',
          title: 'No assessment is set for this experiment',
          body: 'Not every experiment has one. This experiment is complete once you have finished the ' +
            'simulation in each technology available to you.'
        }), null, 'h2');
    }

    /* ---- progress panel ----
       The per-technology chips that used to sit in a second rail panel
       are gone: every technology on this page already carries its own
       status badge on its own card, three inches to the left. What is
       left here is the roll-up — one figure, the steps behind it, and the
       one thing a Student can act on when everything else is finished. */
    var progPanel =
      '<section class="lpanel">' +
      '<h2 class="lp-h">Your progress</h2>' +
      '<div class="lp-b">' +
      /* ⚠ NO PERCENTAGE — Implementation 09 QA. Its denominator counted
         one mandatory step per technology format, which no source
         establishes. The three strands below say what is actually
         true, each against its own denominator. */
      '<div class="lc-pl"><span>' + esc(L.progressLabel(prog.status)) + '</span></div>' +
      (prog.technologies.length && prog.technologies.every(function (t) { return t.waitingOnResources; })
        ? '<p class="lp-cue">' + ui.ic('book', 'sm') +
          ' Everything else is done. Mark the remaining learning resources as done to complete ' +
          'this experiment.</p>'
        : prog.technologies.some(function (t) { return t.waitingOnResources; })
        ? '<p class="lp-cue">' + ui.ic('book', 'sm') +
          ' ' + esc(prog.technologies.filter(function (t) { return t.waitingOnResources; })
            .map(function (t) { return data.TECHNOLOGIES[t.technology].label; }).join(' and ')) +
          ' only needs the remaining learning resources marked as done.</p>' : '') +
      '<dl class="lp-steps">' +
      '<dt>Learning resources</dt><dd>' + resProg.completed + ' of ' + resProg.total + '</dd>' +
      /* The SIMULATION strand, per format and never summed: "1 of 3
         formats" would be the same unsupported claim in a smaller
         font. What is reported is which formats are finished. */
      '<dt>Simulations</dt><dd>' + esc(L.simulationSentence(prog)) + '</dd>' +
      (prog.lastActivityAt
        ? '<dt>Last activity</dt><dd>' + esc(util.fmtDateTime(prog.lastActivityAt)) + '</dd>' : '') +
      '</dl>' +
      '<a class="btn sec blk sm" href="' + L.href.progress(p.id) + '">See all your progress</a>' +
      '</div></section>';

    /* R10 — this page states a completion in four places (a technology
       card's badge, the Completion step above, the percentage in the rail
       and the badge beside the title), so it carries the note that says
       where a completion actually came from. UNCONDITIONAL, as it has
       always been on this screen: the moment a completion HAS been
       claimed is the moment the claim most needs qualifying, so a note
       that appeared only while something was outstanding would vanish
       precisely when it matters. Implementation 08 changed only its
       DRESS — `L.completionNote()` is the same statement, folded, in
       product language, at the foot of the reading order instead of a
       dashed engineering panel in the middle of the Simulation card. */
    var completionNote = L.completionNote('figures');

    var html =
      ui.crumbs([{ label: 'My Learning', href: L.href.myLearning(p.id) }, { label: e.name }]) +
      ui.phead(e.name, L.courseLine(e.id), null, ' ' + L.progressBadge(prog.status)) +
      '<p class="plede">' + esc(e.summary) + '</p>' +
      seq +
      '<div class="grid-rail">' +
      '<div class="stack">' + resCard + simCard + asmCard + completionNote + '</div>' +
      '<div class="stack">' + progPanel + aboutPanel + '</div>' +
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
    /* Implementation 09 — the runtime fold for this technology, read
       once and used by every figure on the page. */
    var use = state.simulationUtilisation(p.id, e.id, tech);
    var delivery = sim ? sim.deliveryState
      : (def.delivery === 'hosted' ? state.DELIVERY_STATE.READY : state.DELIVERY_STATE.NOT_REQUESTED);
    var isPackage = def.delivery === 'package';

    /* ---- the state ladder, mechanism-neutral ----
       Drawn through the shared `ui.track()` stepper rather than the
       private `.ladder` this screen used to build. Two gains beyond
       consistency: the FIRST unfinished step is now marked live, so the
       ladder answers "what happens next" instead of only "what is done".
       Nothing about the states themselves changed.

       ⚠ EVERY STEP NAMES ITS OWN STATE IN WORDS. `ui.track()` carries
       the state in a class and an aria-hidden mark, so a step whose text
       reads the same whether it is finished or not tells a screen reader
       nothing — which is what the old ladder's `sr-only` "Done / Not yet"
       existed to prevent. Each detail below therefore has a done form and
       a not-yet form, and the difference between them is the state. */
    function step(t, done, doneText, todoText) {
      return { t: t, d: done ? doneText : todoText, done: done };
    }
    var ladder = [];
    if (isPackage) {
      ladder.push(step('Access requested', delivery !== state.DELIVERY_STATE.NOT_REQUESTED,
        'Requested for a supported device.',
        'Not requested yet — ask for it on this page.'));
      ladder.push(step('Ready on your device', delivery === state.DELIVERY_STATE.READY,
        'The authorised ' + def.label + ' package is available to open.',
        'Not ready yet. The authorised ' + def.label + ' package becomes available on your device.'));
    } else {
      ladder.push(step('Available to open', true,
        'Ready. This experiment runs in your browser — nothing is installed.', ''));
    }
    ladder.push(step('Simulation opened', status !== state.SIM_STATUS.NOT_STARTED,
      'Opened. You are working through the experiment.',
      'Not opened yet.'));
    ladder.push(step('Completion recorded', status === state.SIM_STATUS.COMPLETED,
      'Your completion for ' + def.label + ' is recorded.',
      'Not recorded yet.'));

    var reached = true;
    var ladderHTML = ui.track(ladder.map(function (s) {
      /* Exactly one step is live: the first one not yet done. Steps after
         it are still ahead, and a finished step stays finished. */
      if (s.done) { return { t: s.t, d: s.d, state: 'done' }; }
      var live = reached;
      reached = false;
      return { t: s.t, d: s.d, state: live ? 'live' : 'todo' };
    }));

    /* ---- actions ----
       ⚠ WHICH CONTROLS ARE THE PRODUCT'S AND WHICH ARE SCAFFOLDING.
       One rule decides it, and it is worth stating because the answer is
       not obvious: a control the STUDENT would genuinely press stays in
       the product — asking for access on a device, and opening the
       experiment. A control that stands in for something the PLATFORM or
       the EXPERIMENT would report is scaffolding, and goes into
       `ui.demoPanel()`: the package becoming available, and the finished
       run being confirmed. Neither behaviour changes; both keep their
       element ids and their state writers. What changes is that a learner
       reading this page is no longer offered "Simulate the package
       becoming ready" as though it were something they do.

       Everything the demo panel holds is a state the product would reach
       on its own, so leaving it collapsed costs a learner nothing and
       costs a demo one click. */
    var actions = '', actionNote = '', demo = '';
    if (isPackage && delivery === state.DELIVERY_STATE.NOT_REQUESTED) {
      actions = '<button class="btn pri" type="button" id="sim-request">Request access on my device</button>';
      actionNote = 'This records that you want the ' + def.label + ' experiment on a supported device.';
    } else if (isPackage && delivery === state.DELIVERY_STATE.PENDING) {
      /* Nothing for the Student to DO here: they are waiting on the
         package, and a button that claimed otherwise would be a button
         that lies. They still get a way back, so the screen is never a
         dead end. */
      actions = '<a class="btn sec" href="' + L.href.experiment(p.id, e.id) + '">Back to the experiment</a>';
      actionNote = 'Nothing is needed from you here. This page shows the ' + def.label + ' experiment as ' +
        'ready once the authorised package is available on your device.';
      demo = ui.demoPanel('Make the ' + def.label + ' package ready on this device',
        '<p>The platform would report this once the authorised package reached the device. No delivery ' +
        'mechanism is built here, so the demo records it instead.</p>' +
        '<div class="formact"><button class="btn sec" type="button" id="sim-ready">' +
        'Mark the package as ready</button></div>');
    } else if (status === state.SIM_STATUS.NOT_STARTED) {
      /* ── Implementation 09 — WEB OPENS A REAL RUNTIME. ─────────
         A hosted experience runs in a browser, and this is a browser,
         so the Web control now LEADS SOMEWHERE: the bounded prototype
         runtime environment, which opens a session, keeps an elapsed
         clock and reports its own completion through the same
         ingestion a native client would use. The Student presses one
         product control and every utilisation figure that follows is
         real evidence of what they did.

         A PACKAGE technology cannot be given the same thing without
         fabricating an in-browser AR or VR runtime, so its control is
         unchanged and its stand-in stays where it was. */
      actions = isPackage
        ? '<button class="btn pri" type="button" id="sim-start">Open the ' + def.label +
          ' experiment</button>'
        : '<a class="btn pri" href="' + L.href.runtime(p.id, e.id, tech) + '">' +
          'Open the Web simulation</a>';
      actionNote = isPackage
        ? 'Nothing is downloaded or installed. This opens a stand-in for the ' + def.name + ' experience.'
        : 'This opens a prototype runtime in your browser. The ' + def.name + ' experience itself is ' +
          'not built here, but the time and sessions it records are real.';
    } else if (status === state.SIM_STATUS.IN_PROGRESS) {
      /* Implementation 09 — for Web there IS somewhere to go back to:
         the runtime, where the session is running and the clock is.
         For a package technology there still is not, so its branch is
         unchanged. */
      actions = (isPackage ? '' :
        '<a class="btn pri" href="' + L.href.runtime(p.id, e.id, tech) + '">' +
        'Back to the simulation</a>') +
        '<a class="btn sec" href="' + L.href.experiment(p.id, e.id) + '">Back to the experiment</a>';
      actionNote = isPackage
        ? 'Your ' + def.label + ' experiment is open. The time you spend in it is what is stored.'
        : 'Your ' + def.label + ' session is open. Time is recorded per session, and a session you ' +
          'leave open records none.';
      /* ── Implementation 09 — THE DEMO RUNTIME-EVENT SIMULATOR ──
         WEB no longer needs this: the prototype runtime page above is
         a real runtime as far as the platform is concerned, and it
         reports its own completion from a real session. The control
         that stood in for that has moved there, where it belongs.

         A PACKAGE technology still needs one, and this is what it
         honestly is: a way to make an AR or VR native client's traffic
         appear so the reporting can be demonstrated. It is labelled as
         a demo control, it names the runtime it is standing in for,
         and the events it writes are stamped with a source that every
         reporting surface prints as NOT CONNECTED — so a figure
         produced here can never be read as native-application traffic.
         See RUNTIME_INTEGRATION_CONTRACT.md for what the real client
         would send. */
      demo = isPackage
        ? ui.demoPanel('Simulate a ' + def.label + ' runtime report',
            '<p>No ' + esc(def.name) + ' application is connected to this build, and none is built here. ' +
            'This writes the session and completion events such an application would report, so the ' +
            'usage and progress screens can be seen working. Everything recorded this way is marked as ' +
            'coming from a demo, not from a device.</p>' +
            '<div class="field"><label for="sim-mins">Minutes to report</label>' +
            '<input type="number" id="sim-mins" min="1" max="240" step="1" value="25"></div>' +
            '<div class="formact">' +
            '<button class="btn sec" type="button" id="sim-session">Report a session only</button>' +
            '<button class="btn sec" type="button" id="sim-complete">Report a completed run</button>' +
            '<button class="btn sec" type="button" id="sim-error">Report a runtime error</button>' +
            '</div>')
        : '';
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

    /* ---- the stand-in runtime state, only while genuinely open ----
       One sentence in the product's own voice, where five sentences of
       decision status used to sit. The learner does need to know that
       nothing is really running; they do not need the two undecided
       technical questions behind that, which are recorded in the comment
       above and in the folded completion note below. */
    var runtime = status === state.SIM_STATUS.IN_PROGRESS
      ? '<div class="polnote">' + ui.ic('play', 'sm') +
        '<span><strong>Opened ' + esc(util.fmtDateTime(sim.startedAt)) + '.</strong> ' +
        'Nothing launches here — this stands in for the ' + esc(def.name) + ' experience.</span></div>'
      : '';

    /* ---- how a package experiment reaches a device ----
       What survives of the old four-step narrative is the part a Student
       could act on: they sign in on a supported device with the same
       institutional account, and they see what they are entitled to and
       nothing else. What was removed was a walk-through of a delivery
       mechanism that has not been selected — a package installed
       directly, or one institutional application carrying the
       experiments a Student is entitled to. Nothing on this page depends
       on which is chosen, which is exactly why it did not belong on the
       page. Web needs none of this: it opens in the browser. */
    /* ⚠ WRITTEN IN THE CONDITIONAL, DELIBERATELY.

       An earlier draft of this said "You sign in on a supported device
       with the same institutional account" and "the experiment appears
       among the experiences you are authorised to run" — in the present
       tense, as statements of fact. Neither is true of this build: there
       is no authentication anywhere in it, and no package is delivered
       to any device. Describing an intended mechanism is fine; asserting
       it already works is the one thing the honesty rule forbids, and it
       is the more dangerous error because a stakeholder cannot tell the
       difference from the copy alone. */
    var deviceHelp = isPackage
      ? ui.about('How the ' + def.label + ' experiment would reach your device',
          '<p>On a device-delivered technology the intended model is that you sign in on a supported ' +
          'device and see only the experiments you are entitled to, with your work recorded against ' +
          esc(def.label) + ' here.</p>' +
          '<p><strong>None of that is built yet.</strong> This build has no sign-in and delivers no ' +
          'package to any device, and how a simulation reports back has not been decided. Use the ' +
          'controls on this page to follow the journey in the meantime.</p>')
      : '';

    /* ⚠ UNCONDITIONAL, AND THAT IS THE POINT OF WHERE IT SITS.
       The runtime note above renders only while the simulation is IN
       PROGRESS, so every qualification it carries disappears at exactly
       the moment a completion has been claimed — the moment a reader is
       most likely to take "Completion recorded" for a confirmed fact
       reported by the experiment. This note renders in every state,
       completed included, so the claim is never left standing
       unqualified. It names no verb, path, payload or provider, because
       none has been chosen; naming one would invent the decision the note
       exists to say is open.

       `control` is the closing sentence that belongs here — this is the
       page that carries the stand-in. The wording is owned by
       `XRSLP.studentUI` so it cannot drift from the Experiment page. */
    var completionNote = L.completionNote('control');

    /* "Opening the VR experiment" is the right title while there is
       something left to open, and the wrong one once the run is behind
       the Student. */
    var runCard = ui.card(status === state.SIM_STATUS.COMPLETED
        ? 'Your ' + def.label + ' simulation'
        : 'Opening the ' + def.label + ' experiment',
      ladderHTML + runtime +
      '<div class="formact">' + actions +
      '<span class="formnote">' + esc(actionNote) + '</span></div>' +
      demo + completionNote, null, 'h2');

    var reqCard = ui.card('What you need',
      '<div class="kv">' +
      '<div class="k">Technology</div><div class="v">' + ui.fmtBadge(tech) + ' ' + esc(def.name) + '</div>' +
      '<div class="k">Device</div><div class="v">' + esc(def.requirement) + '</div>' +
      '<div class="k">How it runs</div><div class="v">' + esc(def.deliveryLabel) + '</div>' +
      /* Implementation 09 — the same figures, from the same fold, on
         the technology's own page. Reported whenever there IS activity,
         not only once it is finished. */
      (use.used
        ? (use.completedAt
            ? '<div class="k">Completed</div><div class="v">' + esc(util.fmtDateTime(use.completedAt)) +
              '</div>' : '') +
          '<div class="k">Times opened</div><div class="v tabular">' + use.launches + '</div>' +
          '<div class="k">Sessions</div><div class="v tabular">' + use.sessionCount +
            (use.openSessions
              ? ' <span class="muted">(' + use.openSessions + ' left open)</span>' : '') + '</div>' +
          '<div class="k">Time spent</div><div class="v tabular">' +
            (use.totalSeconds ? esc(L.fmtDuration(use.totalSeconds))
              : '<span class="muted">Nothing measured yet</span>') + '</div>' +
          '<div class="k">Last activity</div><div class="v">' +
            (use.lastActivityAt ? esc(util.fmtDateTime(use.lastActivityAt))
              : '<span class="muted">—</span>') +
            /* Implementation 09 — the same one-line honesty the Progress
               table carries, from the same shared helper, so the two
               Student screens cannot describe one figure differently. */
            L.useSourceNote(use) + '</div>'
        : '') +
      '</div>' +
      /* KEPT, AND SHORTENED. This is a real disclaimer, not a note about
         an open decision: the platform describes what a technology needs
         and certifies no particular device. */
      '<p class="cardfoot">Device compatibility is described here, not certified.</p>' +
      deviceHelp +
      /* Implementation 06 — the device-transfer entry point sits where
         the device itself is being discussed, and only for a technology
         that actually runs from an authorised package on one (STK31-38).
         A hosted Web experience has no device binding to move. */
      (isPackage
        ? '<div class="formact"><a class="btn sec sm" href="' + L.href.device(p.id) + '">' +
          'Replace or transfer my device</a>' +
          /* ONE LINE, AND NOT THE ROUTE. Implementation 07.2 established
             that the route is Student → Institute / Tenant Admin →
             platform team, and this entry point spelled all three steps
             out — which is how the same two sentences came to appear five
             times across the workspace. My device draws that route once,
             as a stepper, and is the only page that can also say which
             step a live request has reached; so this says the one thing a
             Student needs before following the link, which is what a
             transfer costs them: nothing.

             The open-request sentence still points at My device rather
             than naming a holder, for the same reason: that page reads
             the record and says where it actually is. */
          '<span class="formnote">' +
          (state.openTransferForStudent(p.id)
            ? 'You already have a request in progress. My device shows where it has reached.'
            : 'It moves your authorised device and changes nothing about which experiments or ' +
              'technologies you hold.') +
          '</span></div>'
        : ''), null, 'h2');

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
      /* The badge states THIS technology's own simulation and nothing
         else — never the Experiment roll-up, which moves when the shared
         assessment moves and would report an untouched AR run as "in
         progress". */
      ui.phead(e.name + ' — ' + def.name, L.courseLine(e.id), null, ' ' + L.simBadge(status)) +
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
          def.label + ' is marked ready for you.');
        bind('sim-start', function () { state.startSimulation(p.id, e.id, tech); },
          def.label + ' simulation opened.');
        /* ── Implementation 09 — the demo runtime-event simulator ──
           Every one of these goes through the SAME ingestion a native
           client would use, stamped with a source the reporting
           surfaces print as not connected. The minutes are what the
           "client" measured, so the platform stores a measured
           duration rather than deriving one from the demo's own
           wall-clock — which is exactly the field a real client
           supplies. */
        function demoSource(technology) {
          return technology === 'ar' ? state.RUNTIME_SOURCE.AR_CLIENT
               : technology === 'vr' ? state.RUNTIME_SOURCE.VR_CLIENT
               : technology === 'mr' ? state.RUNTIME_SOURCE.MR_CLIENT
               : state.RUNTIME_SOURCE.DEMO;
        }
        function demoMinutes() {
          var el = document.getElementById('sim-mins');
          var n = el ? Number(el.value) : 25;
          if (!isFinite(n) || n < 1) { n = 1; }
          if (n > 240) { n = 240; }
          return Math.round(n);
        }
        function bindDemo(id, complete) {
          var el = document.getElementById(id);
          if (!el) { return; }
          el.addEventListener('click', function () {
            el.disabled = true;
            var mins = demoMinutes();
            var res = state.runtimeSimulateRun(p.id, e.id, tech, {
              durationSeconds: mins * 60, complete: complete, source: demoSource(tech)
            });
            ui.toast(res.ok
              ? (complete ? 'A completed ' + def.label + ' run was reported.'
                          : 'A ' + mins + '-minute ' + def.label + ' session was reported.')
              : 'The runtime report was refused.', res.ok ? 'success' : 'warn');
            XRSLP.render(false);
          });
        }
        bindDemo('sim-session', false);
        bindDemo('sim-complete', true);

        var errBtn = document.getElementById('sim-error');
        if (errBtn) {
          errBtn.addEventListener('click', function () {
            errBtn.disabled = true;
            var launched = state.runtimeLaunch(p.id, e.id, tech, { source: demoSource(tech) });
            if (launched.ok) {
              state.runtimeError(p.id, e.id, tech, launched.sessionId, {
                code: 'RUNTIME_FAILURE',
                message: 'The ' + def.name + ' runtime reported a failure and the run did not finish.'
              }, { source: demoSource(tech) });
              state.runtimeEndSession(p.id, e.id, tech, launched.sessionId, {
                durationSeconds: 0, source: demoSource(tech)
              });
            }
            ui.toast('A runtime error was reported. It is not a completion.');
            XRSLP.render(false);
          });
        }
      }
    };
  };


  /* ============================================================
     PROTOTYPE WEB RUNTIME — Implementation 09.

     PM-08 asked how the platform knows a Student actually used an
     Experiment, for how long, and how many times. For AR and VR the
     honest answer is a future native application, and the contract it
     would report against is written down in
     RUNTIME_INTEGRATION_CONTRACT.md rather than pretended into
     existence. For WEB the answer can be real in this build, because a
     Web simulation runs in a browser and this IS a browser.

     So this screen is a bounded, clearly-labelled PROTOTYPE RUNTIME
     ENVIRONMENT. It is not the Web simulation — no such simulation is
     built here, and the screen says so in its own first sentence. What
     it does is behave the way a real one would towards the platform:
     it opens a session, keeps a live elapsed clock, and reports
     SESSION_ENDED and SIMULATION_COMPLETED through exactly the same
     ingestion a native client would use. Every figure the Student,
     the Faculty member and the institution then read is derived from
     those events.

     ── WHY THE COMPLETION CONTROL IS ALLOWED TO LIVE HERE ───────
     The rule elsewhere in this build is that a control standing in for
     something the PLATFORM or the EXPERIMENT would report is
     scaffolding and belongs in `ui.demoPanel`. A completion is exactly
     that — so on the Student's own simulation page it stays in the
     demo panel, and it does. Here it is different: this page IS the
     stand-in runtime. Inside a runtime environment, "I have finished"
     is a control the runtime itself owns, and the whole page is
     labelled as the stand-in it is. It is never presented as a product
     capability of the platform.

     ⚠ NOTHING COMPLETES BY BEING OPENED OR CLOSED. Leaving this page
     without ending the session leaves an OPEN session, which the
     utilisation model reports as open and counts no time for. That is
     the honest outcome and it is asserted in `qa/checks.js`.
     ============================================================ */

  /* The live clock. One interval for the whole app, cleared on every
     re-render — `after()` runs after each innerHTML replacement, so an
     un-cleared interval would accumulate one timer per render and keep
     writing into detached nodes. */
  var runtimeTimer = null;
  function stopRuntimeClock() {
    if (runtimeTimer) { clearInterval(runtimeTimer); runtimeTimer = null; }
  }

  XRSLP.screens.studentRuntime = function (params) {
    var r = L.requireStudent(params, 'my-learning');
    if (!r.student) { return r.fail; }
    var p = r.student, tenant = r.tenant;
    var tech = params.tech;
    var ctx = data.contextOf(params.experimentId);
    var def = data.TECHNOLOGIES[tech];
    var row = state.studentExperiment(p.id, params.experimentId);

    /* The same refusal every technology-scoped student screen gives.
       A runtime a Student is not entitled to must not render a single
       control, and the state layer refuses the events anyway. */
    if (!ctx || !def || !row || !row.effective || !state.studentCanRun(p.id, params.experimentId, tech)) {
      return techRefusal(p, tenant, ctx || { experiment: { id: params.experimentId, name: 'Experiment' } },
        row || { technologies: [], blockedTechnologies: [] }, tech, def);
    }
    var e = ctx.experiment;

    /* ⚠ WEB ONLY, AND THAT IS THE POINT.
       An AR or VR experience runs on a device this build cannot reach.
       Offering an in-browser "runtime" for one would be exactly the
       fabrication the delta forbids, so a package technology is sent
       back to its own page, where the delivery ladder and the demo
       runtime simulator live. */
    if (def.delivery !== 'hosted') {
      return { redirect: L.href.simulation(p.id, e.id, tech) };
    }

    var open = state.openRuntimeSession(p.id, e.id, tech);
    var u = state.simulationUtilisation(p.id, e.id, tech);

    var elapsedHTML = open
      ? '<div class="rtclock"><span class="rt-k">This session</span>' +
        '<span class="rt-v tabular" id="rt-elapsed" data-since="' + esc(open.startedAt) +
        '" role="timer" aria-live="off">' + esc(L.fmtDuration(0)) + '</span></div>'
      : '';

    var stateLine = u.completed
      ? ui.badge('b-success', 'check', 'Completion recorded')
      : open ? ui.badge('b-info', 'play', 'Session running')
      : u.used ? ui.badge('b-info', 'clock', 'Used, not finished')
      : ui.badge('b-neutral', 'minus', 'Not started');

    /* The controls. Start / End / Finished — a runtime's own three
       verbs, and nothing else. */
    var controls;
    if (!open) {
      controls =
        '<button class="btn pri" type="button" id="rt-start">' + ui.ic('play') +
          (u.used ? 'Start another session' : 'Start the simulation') + '</button>' +
        '<a class="btn sec" href="' + L.href.simulation(p.id, e.id, tech) + '">Back</a>';
    } else {
      controls =
        '<button class="btn pri" type="button" id="rt-done">' + ui.ic('check') +
          'I have finished the simulation</button>' +
        '<button class="btn sec" type="button" id="rt-end">End this session</button>';
    }

    var sessionRows = (u.sessions || []).slice().reverse().slice(0, 8);
    var sessionsHTML = sessionRows.length
      ? '<div class="tscroll"><table class="dt">' +
        '<caption class="sr-only">Every session recorded for this technology</caption>' +
        '<thead><tr><th scope="col">Session</th><th scope="col">Started</th>' +
        '<th scope="col">Time</th><th scope="col">Outcome</th></tr></thead><tbody>' +
        sessionRows.map(function (s) {
          return '<tr>' +
            '<td data-label="Session"><span class="mono">' + esc(s.sessionId) + '</span></td>' +
            '<td data-label="Started">' + (s.startedAt
              ? esc(util.fmtDateTime(s.startedAt)) : '<span class="muted">—</span>') + '</td>' +
            '<td data-label="Time" class="num tabular">' + (s.open
              ? '<span class="muted">running</span>' : esc(L.fmtDuration(s.seconds))) + '</td>' +
            '<td data-label="Outcome">' + (s.completed
                ? ui.badge('b-success', 'check', 'Completed')
                : s.errored ? ui.badge('b-warning', 'alert', 'Error reported')
                : s.open ? ui.badge('b-info', 'play', 'Running')
                : s.abandoned ? ui.badge('b-neutral', 'minus', 'Left open')
                : ui.badge('b-neutral', 'clock', 'Ended')) + '</td></tr>';
        }).join('') + '</tbody></table></div>'
      : '<p class="cardlede">No session has been recorded for this technology yet.</p>';

    var html =
      ui.crumbs([{ label: 'My Learning', href: L.href.myLearning(p.id) },
                 { label: e.name, href: L.href.experiment(p.id, e.id) },
                 { label: def.label + ' simulation', href: L.href.simulation(p.id, e.id, tech) },
                 { label: 'Runtime' }]) +
      ui.phead(e.name + ' — ' + def.name + ' runtime', L.courseLine(e.id), null, ' ' + stateLine) +
      '<div class="grid-rail">' +
      '<div class="stack">' +
      ui.card('Prototype runtime',
        /* ⚠ THE FIRST SENTENCE ON THE PAGE SAYS WHAT THIS IS.
           A reader must never be able to mistake this for the
           simulation. The claim is made once, plainly, at the top,
           and the panel around it is visibly scaffolding. */
        '<div class="protoruntime">' +
        '<div class="pr-tag">PROTOTYPE RUNTIME ENVIRONMENT</div>' +
        '<p class="pr-lede">The ' + esc(def.name) + ' simulation for <strong>' + esc(e.name) +
          '</strong> is not built in this prototype. This stands in for it, and reports your usage to ' +
          'the platform the way the real one would — so the time, the sessions and the completion ' +
          'recorded against your name are real records of what you did here.</p>' +
        '<div class="pr-stage" aria-hidden="true"><span class="pr-glyph">' + ui.ic('flask', 'lg') +
          '</span><span class="pr-cap">' + esc(open ? 'Session running' :
            u.completed ? 'Nothing is running' : 'Nothing is running yet') + '</span></div>' +
        elapsedHTML +
        '<div class="formact">' + controls + '</div>' +
        '<p class="formnote">' + esc(open
          ? 'Closing this page without ending the session leaves it open. Nothing is completed by leaving.'
          : u.completed
          ? 'Your completion is recorded. Running it again does not remove it.'
          : 'Starting records that you opened it. It does not record a completion.') + '</p>' +
        '</div>', null, 'h2') +
      ui.card('Your sessions on ' + def.label, sessionsHTML,
        u.sessionCount + ' ' + util.plural(u.sessionCount, 'session'), 'h2') +
      '</div>' +
      '<div class="stack">' +
      ui.card('What is recorded',
        '<div class="kv">' +
        '<div class="k">Technology</div><div class="v">' + ui.fmtBadge(tech) + ' ' + esc(def.name) + '</div>' +
        '<div class="k">Times opened</div><div class="v tabular">' + u.launches + '</div>' +
        '<div class="k">Sessions</div><div class="v tabular">' + u.sessionCount +
          (u.openSessions ? ' <span class="muted">(' + u.openSessions + ' open)</span>' : '') + '</div>' +
        '<div class="k">Time spent</div><div class="v tabular">' +
          (u.totalSeconds ? esc(L.fmtDuration(u.totalSeconds)) : '<span class="muted">None recorded</span>') +
          '</div>' +
        '<div class="k">Last activity</div><div class="v">' + (u.lastActivityAt
          ? esc(util.fmtDateTime(u.lastActivityAt)) : '<span class="muted">None</span>') + '</div>' +
        '<div class="k">Simulation</div><div class="v">' + L.simBadge(u.status) + '</div>' +
        '</div>' +
        '<p class="cardfoot">Time is the total of your finished sessions. A session you leave open ' +
        'records no time, because none was measured.</p>', null, 'h2') +
      '</div></div>';

    return {
      area: 'learn', title: e.name + ' — ' + def.label + ' runtime', html: html,
      student: p, tenant: tenant, navKey: 'my-learning',
      after: function () {
        stopRuntimeClock();

        /* The live clock. Reads the session's own start time out of
           the DOM rather than closing over a value, so a re-render
           that keeps the session running picks the same one up. */
        var el = document.getElementById('rt-elapsed');
        if (el) {
          var since = new Date(el.getAttribute('data-since')).getTime();
          var tick = function () {
            var node = document.getElementById('rt-elapsed');
            if (!node) { stopRuntimeClock(); return; }
            var secs = Math.max(0, Math.round((new Date().getTime() - since) / 1000));
            node.textContent = L.fmtDuration(secs);
          };
          tick();
          runtimeTimer = setInterval(tick, 1000);
        }

        var start = document.getElementById('rt-start');
        if (start) {
          start.addEventListener('click', function () {
            start.disabled = true;
            var res = state.runtimeLaunch(p.id, e.id, tech);
            if (!res.ok) { ui.toast('This simulation cannot be opened.', 'warn'); }
            else { ui.announce('Session started.'); }
            XRSLP.render(false);
          });
        }

        /* END and FINISH are two different REPORTS, and the difference
           is the whole model: ending says how long the run lasted,
           finishing says it was completed. A runtime that finishes
           sends BOTH — the run is over, so the session is over — and
           `runtimeComplete` deliberately does not imply the end on its
           own, because a client may legitimately report a completion
           and keep the session open while the learner looks around.
           The finish handler below therefore sends the completion and
           then the end, in that order, which is also the order they
           read in the event log. */
        var end = document.getElementById('rt-end');
        if (end) {
          end.addEventListener('click', function () {
            end.disabled = true;
            var openNow = state.openRuntimeSession(p.id, e.id, tech);
            if (openNow) { state.runtimeEndSession(p.id, e.id, tech, openNow.sessionId); }
            ui.toast('Session ended. Your time has been recorded.');
            XRSLP.render(false);
          });
        }

        var done = document.getElementById('rt-done');
        if (done) {
          done.addEventListener('click', function () {
            var openNow = state.openRuntimeSession(p.id, e.id, tech);
            if (!openNow) { return; }
            ui.openDialog({
              title: 'Report this ' + def.label + ' simulation as completed?',
              bodyHTML:
                '<p>Records a <strong>completion</strong> for ' + esc(def.name) + ' on <strong>' +
                esc(e.name) + '</strong>, and ends this session.</p>' +
                '<div class="consequence">' + ui.ic('info') + '<span>It applies to <strong>' +
                esc(def.label) + '</strong> only. Your other technologies for this experiment are ' +
                'tracked separately and are not affected.</span></div>' +
                '<div class="consequence">' + ui.ic('shield') + '<span>The assessment is separate. ' +
                'Completing the simulation does not submit, pass or change it.</span></div>',
              okLabel: 'Report it as completed',
              onConfirm: function () {
                var s2 = state.openRuntimeSession(p.id, e.id, tech);
                if (!s2) { return; }
                state.runtimeComplete(p.id, e.id, tech, s2.sessionId);
                /* The session ends with the run. Without this the
                   completion would be recorded beside a session that
                   never closed, and the time spent on it would stay
                   at zero — a completed run reporting no duration. */
                state.runtimeEndSession(p.id, e.id, tech, s2.sessionId);
                ui.toast('Completion recorded for ' + def.label + '.');
                XRSLP.render(false);
              }
            });
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
          ' There is no authorised access behind this page to open.</p>', 'alert') +
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
      /* An assessment made ONLY of written answers has no marked
         questions to score straight away, so the second sentence has to
         say what actually happens instead of asserting a step that does
         not exist. */
      descriptiveText: descCount
        ? 'Your written ' + util.plural(descCount, 'answer') + ' ' + (descCount === 1 ? 'goes' : 'go') +
          ' to your faculty for review before your result is complete. ' +
          (data.objectivePoints(asm)
            ? 'Your marked questions are scored straight away.'
            : 'Nothing in this assessment is marked automatically, so your whole result comes from that ' +
              'review.')
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

    /* Where this sits in the experiment. The assessment is step 3, and it
       is the Experiment's — this is the screen where a Student is most
       likely to wonder whether there is another one waiting for the other
       technology they hold, so the step says there is not. */
    var prog = state.experimentProgress(p.id, e.id, row.technologies, { studentView: true });
    /* The Student-facing state: a decided result the policy has not
       released reads as reviewed-but-not-released, never as passed or not
       passed. Read once and used by both the badge and the step. */
    var assessState = L.studentAssessState(p.id, e.id);
    var track = progressTrack(prog, asm, assessState, 2);

    /* ---- the rail ----
       ONE card, useful in both states, and it replaces the old
       "Suggested order" card that built a simulation link from
       `row.technologies[0]` with no guard — an effective row with no
       technology would have produced `.../simulation/undefined`. Here the
       links are built FROM the technologies the Student holds, so a row
       with none simply renders no rail at all.

       It is also the honest place for the recommended order: the order is
       a property of the simulations, and the note changes with whether
       any of them is finished rather than the card appearing and
       disappearing under the Student. */
    var simRail = row.technologies.length
      ? ui.card('Your simulations',
          '<ul class="othertech">' + row.technologies.map(function (t) {
            return '<li>' + ui.fmtBadge(t) +
              '<span class="ot-s">' + L.simBadge(state.simulationStatus(p.id, e.id, t)) + '</span>' +
              '<a class="btn sm sec" href="' + L.href.simulation(p.id, e.id, t) + '">Open</a></li>';
          }).join('') + '</ul>' +
          '<p class="cardfoot">' + (simDone
            ? 'One assessment covers this experiment, whichever technology you worked in.'
            : 'The recommended order is the resources, then a simulation, then this assessment — but ' +
              'nothing stops you starting here.') + '</p>',
          null, 'h2')
      : '';

    var beforeCard = ui.card('Before you start',
      '<p class="cardlede">' + esc(asm.intro) + '</p>' + disclosure +
      '<div class="formact">' + actionHTML +
      '<span class="formnote">' + esc(noteHTML) + '</span></div>', null, 'h2');

    var html =
      ui.crumbs([{ label: 'My Learning', href: L.href.myLearning(p.id) },
                 { label: e.name, href: L.href.experiment(p.id, e.id) },
                 { label: 'Assessment' }]) +
      /* The experiment name is in the breadcrumb directly above, and an
         assessment title normally carries it too — printing it a third
         time in the page meta is how a head starts to read as a record. */
      ui.phead(asm.title, L.courseLine(e.id), null, ' ' + L.assessBadge(assessState)) +
      track +
      /* A two-column skeleton with an empty second column is not a
         layout, it is a gap. With no rail to show, the card takes the
         page. */
      (simRail
        ? '<div class="grid-rail"><div class="stack">' + beforeCard + '</div>' +
          '<div class="stack">' + simRail + '</div></div>'
        : '<div class="stack">' + beforeCard + '</div>');

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
    /* ONE live statement of where the attempt stands, and it sits beside
       the control it is about. The sticky bar above carries the figure
       ("3 of 5") on every screenful, the chips name exactly which
       questions are open, and this says the only thing neither of them
       does: what submitting now would cost. Three separate restatements
       — a repeated count, a prose count and a list of numbers — said
       nothing the bar and the chips had not already said. */
    function hintText(left) {
      return left
        ? left + ' ' + util.plural(left, 'question') + ' still ' +
          (left === 1 ? 'needs' : 'need') + ' an answer. You can submit now, but ' +
          (left === 1 ? 'it will' : 'they will') + ' receive no marks.'
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
      '<div class="rv-nav">' +
      '<h3 class="rv-navh" id="rv-navh">Questions</h3>' +
      '<ul class="qnav" id="rv-chips" aria-labelledby="rv-navh">' + navChips + '</ul>' +
      '<p class="qnav-key" aria-hidden="true">' +
      '<span>' + ui.ic('check', 'sm') + 'answered</span>' +
      '<span>' + ui.ic('circle', 'sm') + 'not answered</span></p>' +
      /* The "Still to answer: 3, 5" line stood here and is gone with the
         repeated count above it. The chips name the same questions,
         carry the same status in their accessible name, and are the only
         one of those three a Student can act on; every number that line
         listed is still reachable, by chip or by "Go to next
         unanswered". */
      '</div>' +
      '<div class="rv-act">' +
      '<button class="btn sec" type="button" id="as-next"' + (openList.length ? '' : ' hidden') + '>' +
      'Go to next unanswered</button>' +
      /* Submit stays ENABLED even when questions are unanswered. No source
         makes every question mandatory, so the prototype must not encode
         that as a rule — it warns instead, and the Student decides. */
      '<button class="btn pri lg" type="button" id="as-submit">Submit assessment</button>' +
      '<span class="formnote" id="rv-hint">' + esc(hintText(openList.length)) +
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

          /* The repeated count and the "still to answer" list are no
             longer in the markup, so there is nothing here to refresh
             for them. `open` still drives the chips above, the
             next-unanswered control and the hint below. */
          var next = document.getElementById('as-next');
          if (next) { next.hidden = open.length === 0; }

          /* The Submit control is never disabled — incompleteness is a
             warning, not a block. The note beside it states the cost. */
          var hint = document.getElementById('rv-hint');
          if (hint) { hint.textContent = hintText(open.length); }
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
    /* Does this assessment contain anything the machine marks at all?
       Read from the attempt's own snapshot, so it describes the paper
       that was actually answered. A paper made only of written answers
       has no objective denominator — "0 of 0 marks" is not a low score,
       it is a figure the assessment never had — and nothing about it
       "has been scored" before the Faculty review. */
    var autoMarked = data.objectivePoints(asm) > 0;
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
        '<p style="margin-top:8px">' + (autoMarked
          ? 'Your marked questions have been scored, and your answers are shown below.'
          : 'Nothing in this assessment is marked automatically, so your whole result comes from that ' +
            'review. Your answers are shown below.') + '</p>', 'status');
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
    var showObjectiveOnly = pending || !sc.includesReview;
    var scoreBody;
    if (scoreHidden) {
      /* Compact, not a 48px medallion: this is a card body with a status
         in it, not a page whose purpose is emptiness. The WORDS are
         unchanged, and they still carry no figure and no outcome. */
      scoreBody = ui.emptyRow({
        icon: 'clock', heading: 'h3',
        title: 'Your marks are not available yet',
        body: release.sentence
      });
    } else if (showObjectiveOnly && !autoMarked) {
      /* Nothing is marked automatically, so the box would read "—" over
         "0 of 0 marks on the questions that are marked automatically" —
         a denominator this assessment never had, presented as a score.
         There is no figure to show until the Faculty review lands. */
      scoreBody = ui.emptyRow({
        icon: 'clock', heading: 'h3',
        title: 'No marks yet',
        body: 'Nothing in this assessment is marked automatically. Your marks come from your faculty ' +
          'once they have reviewed your written ' + util.plural(descCount, 'answer') + '.'
      });
    } else {
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
    /* The card is only titled "Your score" when it actually carries one. */
    var scoreCard = ui.card((scoreHidden || (showObjectiveOnly && !autoMarked)) ? 'Your result' : 'Your score',
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
        ui.emptyRow({
          icon: 'clock', heading: 'h3',
          title: 'Your answers are not available yet',
          body: release.sentence
        }) +
        /* ⚠ NO REFERENCE TO A SCORE HERE, AND NO "above".
           This branch runs under exactly the condition that empties the
           score card (`scoreWithheld` is `!releaseFor(att).released` for
           the same attempt), so pointing at "your score above" pointed
           at an empty state — the leftover of the earlier behaviour that
           did show the objective sub-score, which the withheld-result
           closure removed. "Above" was wrong on its own terms too: the
           score card is a side rail on desktop and stacks BELOW this
           card on narrow widths. */
        '<div class="polnote">' + ui.ic('info', 'sm') +
        '<span><strong>' + esc(data.policyLabel(release.mode)) + '.</strong> ' +
        'Your faculty decide when answers and explanations become visible. Your submission has been ' +
        'recorded, and your marks and your answers are released together.</span></div>',
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

    /* The trailing note that restated the one-assessment rule is gone.
       The rule is a property of the assessment, and it is stated where a
       Student meets the assessment — the "Covers" row of the pre-attempt
       disclosure — not on every screen that mentions a result. The page
       head and the score card already say which experiment this is. */
    var actions =
      '<div class="formact">' +
      (canRetry
        ? '<button class="btn pri" type="button" id="as-retry">Try again</button>' : '') +
      '<a class="btn sec" href="' + L.href.experiment(p.id, e.id) + '">Back to the experiment</a>' +
      '<a class="btn sec" href="' + L.href.progress(p.id) + '">See your progress</a>' +
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
