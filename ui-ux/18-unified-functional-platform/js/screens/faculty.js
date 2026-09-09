/* ============================================================
   Unified Functional Platform — FACULTY workspace.

   Implementation 04 closes the loop the first three slices opened:

     Super Admin approves   →  TENANT ACCESS
     Tenant Admin assigns   →  STUDENT ENTITLEMENT   (derived)
     Tenant Admin maps      →  FACULTY CONTENT       (derived)
     ──────────────────────────────────────────────────────────
     FACULTY CONFIGURE THE ASSESSMENT THE STUDENT SITS,
     AND EVALUATE THE WRITTEN ANSWERS THE STUDENT SUBMITS

   ⚠ THE TWO RULES THIS FILE EXISTS TO OBEY

   1 · EVERYTHING a Faculty member sees comes from
       `state.facultyScope()`, which is a read model over the
       Implementation-02 FacultyAssignment records. There is no second
       Faculty mapping store, and no path by which tenant-held content
       reaches a Faculty member without a mapping.

   2 · FACULTY MAPPING ≠ STUDENT ENTITLEMENT. Student reach is
       `state.facultyStudentReach()`, which derives from EFFECTIVE
       ENTITLEMENT — never course membership, group membership or
       "students at this institution".

   Faculty cannot publish content, cannot add a technology the Tenant
   was not granted, and cannot change a licence quantity (STK31-06 /
   STK31-07 / STK31-24). Nothing in this workspace offers to.

   This file: shared faculty helpers · workspace resolution · Overview ·
   My Content · Student Progress. Assessments, the Question Bank, AI
   drafting and the descriptive review queue live in faculty-assess.js.
   ============================================================ */

window.XRSLP = window.XRSLP || {};
XRSLP.screens = XRSLP.screens || {};

/* ---------------- shared faculty-side helpers ---------------- */
XRSLP.facultyUI = (function () {
  'use strict';

  var esc = XRSLP.util.esc;
  var util = XRSLP.util;
  var ui = XRSLP.ui;
  var data = XRSLP.data;
  var state = XRSLP.state;

  function base(facultyId) { return '#/faculty/' + encodeURIComponent(facultyId); }
  var href = {
    switcher:     function () { return '#/faculty'; },
    overview:     function (f) { return base(f) + '/overview'; },
    content:      function (f) { return base(f) + '/content'; },
    assessments:  function (f) { return base(f) + '/assessments'; },
    assessment:   function (f, e) { return base(f) + '/assessment/' + encodeURIComponent(e); },
    settings:     function (f, e) { return base(f) + '/assessment/' + encodeURIComponent(e) + '/settings'; },
    builder:      function (f, e) { return base(f) + '/assessment/' + encodeURIComponent(e) + '/questions'; },
    preview:      function (f, e) { return base(f) + '/assessment/' + encodeURIComponent(e) + '/preview'; },
    bank:         function (f) { return base(f) + '/questions'; },
    newQuestion:  function (f) { return base(f) + '/questions/new'; },
    draft:        function (f) { return base(f) + '/questions/draft'; },
    importQuestions: function (f) { return base(f) + '/questions/import'; },
    question:     function (f, q) { return base(f) + '/question/' + encodeURIComponent(q); },
    reviews:      function (f) { return base(f) + '/reviews'; },
    review:       function (f, r) { return base(f) + '/review/' + encodeURIComponent(r); },
    students:     function (f) { return base(f) + '/students'; },
    studentDetail: function (f, s, e) {
      return base(f) + '/student/' + encodeURIComponent(s) + '/' + encodeURIComponent(e);
    }
  };

  /* Every faculty screen resolves its Faculty member the same way and
     fails the same way when the address is stale. The record must be a
     REAL TenantUser — the prototype never invents one. */
  function requireFaculty(params, navKey) {
    var p = state.personById(params.facultyId);
    if (p && p.role === 'faculty') {
      var tenant = state.tenantById(p.tenantId);
      if (tenant) { return { faculty: p, tenant: tenant }; }
    }
    return {
      faculty: null, tenant: null,
      fail: {
        area: 'faculty', faculty: null, tenant: null, navKey: navKey || null,
        title: 'Faculty member not found',
        html: ui.phead('Faculty member not found') +
          '<div class="tablecard">' + ui.emptyState({
            icon: 'alertCirc',
            title: 'No faculty record for this address',
            body: 'The address may be stale — this record may not exist in the current prototype data.',
            actionsHTML: '<a class="btn pri" href="' + href.switcher() + '">Choose a faculty member</a>'
          }) + '</div>'
      }
    };
  }

  /* Resolve a Faculty member AND check the experiment in the address is
     inside their mapping. This is THE content boundary: a Faculty
     member who hand-edits the address to an Experiment they are not
     mapped to gets a refusal, not a screen. */
  function requireMapped(params, navKey) {
    var r = requireFaculty(params, navKey);
    if (!r.faculty) { return r; }
    var ctx = data.contextOf(params.experimentId);
    var row = ctx ? state.facultyScopeRow(r.faculty.id, params.experimentId) : null;
    if (ctx && row) { return { faculty: r.faculty, tenant: r.tenant, ctx: ctx, row: row }; }
    return {
      faculty: r.faculty, tenant: r.tenant, ctx: null, row: null,
      fail: {
        area: 'faculty', faculty: r.faculty, tenant: r.tenant, navKey: navKey || 'content',
        title: 'Not mapped to you',
        html: ui.phead(ctx ? ctx.experiment.name : 'Experiment not available') +
          '<div class="stack">' +
          ui.alertBox('warning', 'This experiment is not mapped to you',
            '<p>' + (ctx
              ? 'Your institution has not mapped ' + esc(ctx.experiment.name) + ' to you, or the access ' +
                'behind that mapping is no longer active.'
              : 'The experiment in this address is not part of the sample catalogue.') +
            '</p><p style="margin-top:8px">A Faculty member manages the experiments mapped to them, not every ' +
            'experiment the institution holds.</p>') +
          '<div class="formact"><a class="btn pri" href="' + href.content(r.faculty.id) +
          '">See the content mapped to you</a></div></div>'
      }
    };
  }

  function courseLine(experimentId) {
    var ctx = data.contextOf(experimentId);
    if (!ctx) { return esc(experimentId); }
    return esc(ctx.grouping.name) + ' › ' + esc(ctx.course.name);
  }

  function expLink(facultyId, experimentId) {
    var ctx = data.contextOf(experimentId);
    return '<a class="rowlink" href="' + href.assessment(facultyId, experimentId) + '">' +
      '<span class="tmain">' + esc(ctx ? ctx.experiment.name : experimentId) + '</span>' +
      '<span class="tsub">' + (ctx ? esc(ctx.course.name) : '') + '</span></a>';
  }

  /* The four-tile `.statgrid`. Implementation 08 moved both Faculty
     screens that used it to the denser `ui.statStrip`, whose figures can
     also be links — a number on a dashboard that cannot be opened is a
     number the reader has to go and find again. The helper stays because
     `.statgrid` is still the right pattern for a true overview with a
     handful of headline figures, and rebuilding it later by hand is how
     two versions of one component appear. */
  function statGrid(items) {
    return '<div class="statgrid">' + items.map(function (it) {
      var inner =
        '<div class="s-k">' + esc(it.label) + '</div>' +
        '<div class="s-v tabular">' + esc(String(it.value)) + '</div>' +
        (it.note ? '<div class="s-n">' + esc(it.note) + '</div>' : '');
      var cls = 'stat' + (it.tone ? ' ' + it.tone : '') + (it.href ? ' statlink' : '');
      /* A figure on a dashboard that cannot be opened is a figure the
         reader has to go and find again. `a.stat.statlink` already
         exists in the design system for exactly this. */
      return it.href
        ? '<a class="' + cls + '" href="' + it.href + '">' + inner + '</a>'
        : '<div class="' + cls + '">' + inner + '</div>';
    }).join('') + '</div>';
  }

  /* ⚠ THE COMPLETION CAVEAT, WRITTEN ONCE AND REUSED.
     "Completed" here is the PROTOTYPE-DERIVED COMPLETION RULE this
     prototype has used since Implementation 03 — resources done,
     every entitled technology's simulation done, assessment passed
     where one is configured, and never complete while a result is
     pending. It is NOT a stakeholder-confirmed academic completion
     policy, and no Faculty surface may present it as one.

     Implementation 08 — it was a standing 60-word gapNote on three
     screens, above or below the table the faculty member came for. The
     DEFINITION is genuine product help: someone reading a Completed
     column wants it. So it is folded away beside the figure it defines,
     once per screen, and the closing sourcing sentence ("no source
     establishes an institutional completion policy, so none is asserted
     here") is project-traceability language that belongs in README /
     QA_CHECKLIST rather than on a faculty member's screen. The rule it
     described has not changed. */
  /* ⚠ REWRITTEN AT THE IMPLEMENTATION-09 QA CORRECTION, and the reason
     matters. The old wording described the rule as if finishing every
     technology were a settled requirement. Web, AR and VR are DELIVERY
     FORMATS of one experiment, and no source says a student must
     complete all of the formats their institution happens to hold.

     So the rule is stated as what it is — the conservative reading,
     which never announces a completion that has not been evidenced —
     and the open question is named rather than hidden behind it. */
  function completionNote() {
    return ui.about('How “Completed” is calculated',
      '<p><strong>Completed</strong> is shown only when nothing is outstanding: every learning resource is ' +
      'marked done, every technology this student can open has a recorded completion, and the assessment is ' +
      'passed where one is configured. A result waiting for your review is never counted as complete.</p>' +
      '<p style="margin-top:8px">That is deliberately the <strong>cautious</strong> reading. Whether a student ' +
      'has to finish an experiment in <em>every</em> technology format their institution holds — Web and VR and ' +
      'AR — is <strong>not settled</strong>, so this screen never claims a completion it cannot evidence, and ' +
      'never scores one format against another. Each format is reported on its own.</p>');
  }

  /* The one place a Faculty member is told what they cannot do, and
     why — so an absent control is never mistaken for a missing feature.
     Stated ONCE, on My Content, which is the screen about the boundary;
     it used to repeat on the Overview as well, where it pushed the
     dashboard down for no new information. */
  function authorityNote() {
    return ui.about('What you control, and what your institution controls',
      '<p>You configure the assessment for an experiment mapped to you, keep its question bank, and evaluate ' +
      'written answers from your students.</p>' +
      '<p style="margin-top:8px">Publishing content, adding a technology your institution was not granted, and ' +
      'changing licence quantities or student assignments sit with the Content Manager, the Super Admin and ' +
      'your Tenant Admin.</p>');
  }

  /* THE PROTOTYPE'S OWN SHORTCUT, MARKED AS ONE. In the product a Tenant
     Admin maps faculty to content; in the prototype the demonstrator can
     do it themselves. That is scaffolding, not product copy, so it is a
     demo panel rather than a note inside an empty state — and it is
     built here once because two empty states offered it verbatim. */
  function mappingDemoPanel(tenant) {
    return ui.demoPanel('Map content to this faculty member',
      '<p>Faculty mapping is your Tenant Admin’s job in the product. In this prototype you can do it yourself.</p>' +
      '<div class="formact"><a class="btn sec sm" href="' + XRSLP.tenantUI.href.facultyMap(tenant.id) +
      '">Open Faculty mapping (Tenant Admin)</a></div>');
  }

  /* ⚠ THE RELEASE POLICY, SURFACED WITHOUT WEAKENING THE GUARD.
     `scoreWithheld` is a STUDENT-view decision, and Faculty deliberately
     keep seeing an evaluation they performed (state.js — "deliberately
     NOT applied without studentView"). What was missing is that the
     screen never said whether the STUDENT had been shown it, while the
     CSV built from the identical rows did — so a percentage read off
     this screen could be quoted to a student the policy is still
     withholding it from. Same words as the export column. */
  function withheldMark(personId, experimentId) {
    if (!state.scoreWithheld(personId, experimentId)) { return ''; }
    return '<span class="withheld">' + ui.ic('clock', 'sm') + 'Not yet released to the student</span>';
  }

  /* Per-technology simulation chips on the SAME markup contract the
     Student workspace uses (`studentUI.techStateChips`): the state class
     lives on the <li>, which is what `.techstates .ts-completed .ts-s`
     and its siblings hook on to. The Faculty copy used to emit a wrapper
     class defined in no stylesheet and no state class at all, so every
     technology rendered as identical grey text. */
  function techStateList(technologies, compact) {
    var L = XRSLP.studentUI;
    if (!technologies || !technologies.length) { return '<span class="muted">—</span>'; }
    return '<ul class="techstates' + (compact ? ' compact' : '') + '">' + technologies.map(function (tp) {
      return '<li class="ts ts-' + esc(String(tp.simulationStatus).toLowerCase().replace(/_/g, '-')) + '">' +
        ui.fmtBadge(tp.technology) +
        '<span class="ts-s">' + esc(L.simLabel(tp.simulationStatus)) + '</span></li>';
    }).join('') + '</ul>';
  }

  /* ============================================================
     UTILISATION — Implementation 09.

     PM-08's direct question: how does a Faculty member know a Student
     actually used an Experiment, for how long and how often, WITHOUT
     opening hundreds of records. These two helpers are the answer, and
     they are shared by the Student Progress row, the row's usage
     drawer and the per-student detail page, so one fact never gets two
     shapes on three screens.

     ⚠ NOTHING HERE IS AN OUTCOME. No mark, no score, no pass rate.
     Utilisation is how much an experiment was USED; the assessment
     column is where a result lives, and it is still gated on
     `withheldMark` exactly as before.
     ============================================================ */

  /* The compact line under a row's technology chips. Every figure
     states what it is, because "3 · 2 · 41m" means nothing on its own,
     and the whole line is omitted rather than printing a row of zeros
     that reads as a claim about learning that did not happen. */
  function useFigures(u) {
    /* Local, exactly like `techStateList` above: this IIFE declares the
       Faculty namespace and does not close over the Student one. */
    var L = XRSLP.studentUI;
    if (!u || !u.anyUse) {
      return '<span class="usefigs"><span class="uf"><span class="uf-v none">Never opened</span></span></span>';
    }
    var parts = [
      { k: util.plural(u.launches, 'launch', 'launches'), v: u.launches },
      { k: util.plural(u.sessionCount, 'session'), v: u.sessionCount }
    ];
    var html = '<span class="usefigs">' + parts.map(function (x) {
      return '<span class="uf"><span class="uf-v tabular">' + x.v + '</span>' +
        '<span class="uf-k">' + esc(x.k) + '</span></span>';
    }).join('') +
      '<span class="uf"><span class="uf-v tabular">' +
        (u.totalSeconds ? esc(L.fmtDuration(u.totalSeconds)) : '—') + '</span>' +
        '<span class="uf-k">recorded</span></span>' +
      (u.openSessions
        ? '<span class="uf"><span class="uf-v tabular">' + u.openSessions + '</span>' +
          '<span class="uf-k">' + esc(util.plural(u.openSessions, 'session') + ' left open') +
          '</span></span>' : '') +
      '</span>';
    return html;
  }

  /* Where the figures came from. It renders ONLY when a stand-in
     produced some of them, because a note on every row would become
     invisible — and the one case a reader must not miss is a figure
     that looks like device traffic and is not. */
  function useSourceNote(u) {
    if (!u) { return ''; }
    /* ⚠ AN INHERITED FIGURE NEEDS A LABEL TOO, and used to get none.
       This returned '' for an empty source list — which is exactly what
       a PRE-TELEMETRY record has, because no runtime ever reported it.
       So the one figure a reader most needs qualified was the one shown
       bare. Inherited figures are now named, and a MIXED figure says
       both things, because both are true of it. */
    var sources = u.sources || [];
    var inherited = u.evidence === 'pre-telemetry' || u.evidence === 'mixed' ||
      u.inheritedLaunches > 0 || u.inheritedSeconds > 0 || u.inheritedCompletion;
    var standIn = sources.length && !state.runtimeSourcesAllReal(sources);
    if (!inherited && !standIn) { return ''; }
    var bits = [];
    if (standIn) {
      bits.push(esc(state.runtimeSourceLabels(sources).join(' · ')) +
        ' — no device application is connected in this build');
    }
    if (inherited) {
      bits.push('part of this was recorded before session tracking existed, so it has no session detail');
    }
    return '<span class="usesrc"><span class="us-tag">' +
      (standIn ? 'STAND-IN' : 'INHERITED') + '</span>' + bits.join('. ') + '.</span>';
  }

  /* The full per-technology breakdown for the student detail page.

     ── Implementation 09 — RESPONSIVE PRESENTATION ─────────────
     SEVEN COLUMNS NEEDED 848px AND HAD 318. This table sat in the
     360px detail rail, so Launches, Sessions, Time spent and Last
     activity — the four figures the section exists to report — were
     reachable only by dragging the table sideways. `.tscroll` hid the
     defect rather than causing it: the overflow was CONTAINED, so the
     document-level audit could not see it and only manual QA did.

     Three changes. No telemetry is dropped and no figure is recomputed:

       · SIX COLUMNS, NOT SEVEN. `First used` is a bracket on
         `Last activity`, not an independent figure, so it keeps its
         own words and its own value as a labelled sub-line of that
         cell instead of holding a column open across every width.
       · `.simuse` SCOPES THE PRESENTATION. Below 900px each
         technology becomes its own stacked block, so the desktop
         table is never squeezed into a tablet or phone viewport.
         Nothing is scoped to `table.dt` at large — no other screen's
         table moves.
       · The card is no longer IN the rail. The caller gives it the
         full content width, which is what makes six columns fit at
         1024 as well as at 1440.

     ⚠ The row still reads `state.experimentUtilisation` and nothing
     else. Launch, session, time and completion semantics are
     untouched; this function only decides how they are laid out. */
  function useDetailHTML(personId, experimentId, technologies) {
    var L = XRSLP.studentUI;
    var ex = state.experimentUtilisation(personId, experimentId, technologies || []);
    if (!ex.technologies.length) {
      return '<p class="cardlede">This student holds no technology for this experiment.</p>';
    }
    return '<div class="simuse"><div class="tscroll"><table class="dt">' +
      '<caption class="sr-only">Recorded simulation use, one row per technology</caption>' +
      '<thead><tr><th scope="col">Technology</th><th scope="col">Simulation status</th>' +
      '<th scope="col" class="num">Launches</th><th scope="col" class="num">Sessions</th>' +
      '<th scope="col" class="num">Time spent</th>' +
      '<th scope="col">Last activity</th></tr></thead><tbody>' +
      ex.technologies.map(function (u) {
        return '<tr>' +
          '<td data-label="Technology" class="c-tech">' + ui.fmtBadge(u.technology) +
            (u.evidence === 'none' ? '' : useSourceNote(u)) + '</td>' +
          '<td data-label="Simulation status" class="c-sim">' + L.simBadge(u.status) +
            (u.errors ? '<span class="tsub2">' + u.errors + ' ' +
              util.plural(u.errors, 'runtime error') + ' reported</span>' : '') +
            (u.inheritedCompletion
              ? '<span class="tsub2">Recorded before session tracking existed</span>' : '') + '</td>' +
          '<td data-label="Launches" class="c-m num tabular">' + u.launches + '</td>' +
          '<td data-label="Sessions" class="c-m num tabular">' + u.sessionCount +
            (u.openSessions ? ' <span class="muted">(' + u.openSessions + ' open)</span>' : '') + '</td>' +
          '<td data-label="Time spent" class="c-m num tabular">' +
            (u.totalSeconds ? esc(L.fmtDuration(u.totalSeconds)) : '<span class="muted">—</span>') + '</td>' +
          '<td data-label="Last activity" class="c-m">' + (u.lastActivityAt
            ? esc(util.fmtDateTime(u.lastActivityAt)) : '<span class="muted">—</span>') +
            (u.firstActivityAt
              ? '<span class="tsub2">First used ' + esc(util.fmtDate(u.firstActivityAt)) + '</span>'
              : '') + '</td>' +
          '</tr>';
      }).join('') + '</tbody></table></div></div>' +
      '<p class="cardfoot">Each technology is tracked separately. Resource viewing and assessment ' +
      'activity do not complete a simulation. Time counts finished sessions only — a session left ' +
      'open records none.</p>';
  }

  /* THE FOUR PROGRESS STATES AS ONE WHOLE. Printed as four bare
     integers, the reader has to do the proportion arithmetic for every
     row. The counts stay next to the bar and in the table caption, so a
     figure is never carried by colour or width alone. */
  function progressBar(st) {
    var parts = [
      { k: 'completed', v: st.completed, label: 'completed' },
      { k: 'awaiting', v: st.awaitingReview, label: 'awaiting review' },
      { k: 'progress', v: st.inProgress, label: 'in progress' },
      { k: 'notstarted', v: st.notStarted, label: 'not started' }
    ];
    var total = parts.reduce(function (n, p) { return n + p.v; }, 0);
    if (!total) { return '<span class="muted">No students with access</span>'; }
    return '<div class="pbcell">' +
      '<div class="pbar" aria-hidden="true">' + parts.map(function (p) {
        return p.v ? '<span class="pb-' + p.k + '" style="width:' + (p.v / total * 100) + '%"></span>' : '';
      }).join('') + '</div>' +
      '<div class="pbkey">' + parts.filter(function (p) { return p.v; }).map(function (p) {
        return '<span class="pk"><span class="pk-d ' + p.k + '"></span>' +
          '<span class="pk-v tabular">' + p.v + '</span> ' + esc(p.label) + '</span>';
      }).join('') + '</div></div>';
  }

  /* ONE SEARCH-BOX BINDING FOR THE WHOLE WORKSPACE — Student Progress,
     the Question Bank and the assessment builder's picker all had their
     own copy, and all three did the same two things wrong: they
     re-rendered the entire screen on every keystroke, and they then
     forced the caret to the END of the value, so a typo in the middle of
     a search term could not be corrected. This restores the exact
     selection offsets and debounces the re-render.

     `apply(value)` writes the filter; the caller owns what that means. */
  var searchTimer = null;
  function bindSearch(id, apply, delay) {
    var el = document.getElementById(id);
    if (!el) { return; }
    el.addEventListener('input', function () {
      var value = el.value;
      var start = el.selectionStart, end = el.selectionEnd;
      if (searchTimer) { window.clearTimeout(searchTimer); }
      searchTimer = window.setTimeout(function () {
        searchTimer = null;
        apply(value);
        XRSLP.render(true);
        var again = document.getElementById(id);
        if (!again) { return; }
        again.focus();
        /* Guarded: setSelectionRange throws on input types that have no
           selection, and a caller may reuse this on one. */
        try { again.setSelectionRange(start, end); } catch (err) { /* no selection to restore */ }
      }, delay === undefined ? 150 : delay);
    });
  }

  /* The INSTITUTION's own code for a Course. A Faculty member works
     inside one institution, so this is the code that means something to
     them; the platform code is the Content Manager's identifier and is
     not shown on a Faculty screen (design-system rule 3). */
  function institutionCourseCode(tenantId, courseId) {
    if (!courseId) { return ''; }
    var m = state.courseMapping(tenantId, courseId);
    return m && m.localCode ? ui.institutionCode(m.localCode) : '';
  }

  /* STK31-29 / U-FAC-01 — "Experiments available to their Tenant".
     STRICTLY INFORMATIONAL, and the card says so in its own words: it
     is what the INSTITUTION holds, not what this Faculty member
     manages. No control here changes a mapping, an assessment or a
     student — only the Tenant Admin can map content — so making the
     institution's holdings legible widens no authority at all. It
     simply stops a Faculty member having to guess whether their
     institution licensed the variant they were asked about. */
  function tenantHoldingsCard(f, tenant) {
    var holdings = state.facultyTenantHoldings(f.id);
    var unmapped = holdings.filter(function (h) { return !h.mapped; });
    if (!holdings.length) {
      return ui.card('Experiments available to ' + esc(tenant.name),
        ui.emptyState({
          icon: 'layers', heading: 'h3',
          title: 'Your institution holds no usable content right now',
          body: 'Content reaches an institution only through an approved institutional access request, and an ' +
            'expired or empty record carries none. This is what the institution holds — not what is mapped to you.'
        }), null, 'h2');
    }
    return ui.card('Experiments available to ' + esc(tenant.name),
      ui.metrics([
        { v: holdings.length, k: util.plural(holdings.length, 'experiment') + ' held' },
        { v: holdings.length - unmapped.length, k: 'mapped to you' },
        { v: unmapped.length, k: 'not mapped to you' }
      ]) +
      '<p class="facnote">Read-only. You configure an assessment, see students and evaluate answers only for ' +
      'the rows marked <em>Mapped to you</em> — your Tenant Admin decides the rest.</p>' +
      '<div class="tscroll"><table class="dt">' +
      '<caption class="sr-only">Experiments available to ' + esc(tenant.name) +
      ', and whether each one is mapped to you</caption>' +
      '<thead><tr><th scope="col">Course</th><th scope="col">Experiment</th>' +
      '<th scope="col">Technologies held</th><th scope="col">Your access</th></tr></thead><tbody>' +
      holdings.map(function (h) {
        var ctx = data.contextOf(h.experimentId);
        /* The INSTITUTION's own course code, not the platform one: this
           card is about what this institution holds. */
        var icode = institutionCourseCode(tenant.id, ctx && ctx.course ? ctx.course.id : h.courseId);
        return '<tr>' +
          '<td data-label="Course"><span class="tmain">' + esc(ctx ? ctx.course.name : h.courseId) + '</span>' +
            (icode ? '<span class="tsub2">' + icode + '</span>' : '') + '</td>' +
          '<td data-label="Experiment"><span class="tmain">' +
          esc(ctx ? ctx.experiment.name : h.experimentId) + '</span></td>' +
          '<td data-label="Technologies held">' + ui.techBadges(h.technologies) + '</td>' +
          '<td data-label="Your access">' + (h.mapped
            ? ui.badge('b-success', 'check', 'Mapped to you')
            : ui.badge('b-neutral', 'minus', 'Not mapped to you')) + '</td>' +
          '</tr>';
      }).join('') + '</tbody></table></div>' +
      '<p class="cardfoot">Ask your Tenant Admin to map anything you need to deliver. Nothing on this card can ' +
      'be changed here.</p>',
      null, 'h2');
  }

  /* ONE STATUS WORD FOR AN ASSESSMENT, ON EVERY SCREEN. This used to
     report CONTENT ("4 questions" / "No questions") while the
     Assessments list and all four builder tabs reported the DERIVED
     READINESS ("Ready for students" / "Incomplete" / "Draft"), so an
     assessment with questions but an unresolved release date showed
     green here and amber one click away. Both now read the one
     derivation, `state.assessmentReadiness`. The question count is a
     figure and belongs in a column that counts figures. */
  function assessmentBadge(def) {
    if (!def) { return ui.badge('b-neutral', 'minus', 'No assessment'); }
    var rd = state.assessmentReadiness(def);
    return ui.badge(rd.ready ? 'b-success' : 'b-warning', rd.ready ? 'check' : 'alert', rd.label);
  }

  function typeLabel(type) { return state.QUESTION_TYPES[type] || type; }

  function typeBadge(type) {
    var cls = type === 'descriptive' ? 'b-warning' : type === 'tf' ? 'b-info' : 'b-outline';
    var icon = type === 'descriptive' ? 'edit' : type === 'tf' ? 'check' : 'doc';
    return ui.badge(cls, icon, typeLabel(type));
  }

  /* Technologies the TENANT holds for one experiment, across the access
     records this mapping runs through. Faculty read this; they never
     widen it (STK31-24). */
  function mappedTechnologies(row) {
    var set = {};
    row.accessIds.forEach(function (aid) {
      state.accessTechnologies(state.accessById(aid), row.experimentId).forEach(function (t) { set[t] = true; });
    });
    return data.sortTech(Object.keys(set));
  }

  /* A compact per-technology simulation summary. TECHNOLOGY FIGURES
     STAY TECHNOLOGY-SPECIFIC: only SimulationActivity feeds them, so an
     experiment-level assessment submission can never make a technology
     look started (brief §35). */
  function techMetrics(stats) {
    var keys = data.sortTech(Object.keys(stats.technologies));
    if (!keys.length) {
      return '<p class="cardlede">No student can currently open a technology for this experiment, so ' +
        'there is nothing to report.</p>';
    }
    return '<ul class="techmetrics">' + keys.map(function (t) {
      var m = stats.technologies[t];
      return '<li>' + ui.fmtBadge(t) +
        '<span class="tm-n"><span class="tm-v tabular">' + m.entitled + '</span> with access</span>' +
        '<span class="tm-n"><span class="tm-v tabular">' + m.started + '</span> started</span>' +
        '<span class="tm-n"><span class="tm-v tabular">' + m.completed + '</span> completed</span>' +
        '</li>';
    }).join('') + '</ul>';
  }

  /* ---------- TECHNOLOGY ACTUALLY USED (07.3, stakeholder R6) ----------
     The stakeholder asked how a Faculty member grading an assessment
     knows whether the student performed the experiment in Web, VR or AR.

     ⚠ `mappedTechnologies()` above CANNOT answer that — it reports what
     the institution licensed, which is availability. This reads
     `state.technologyUseSummary()`, which reports what the student
     actually ran, and it renders a SET: a student who ran Web and VR is
     never described as having used only one of them.

     `sourceTechnology` is shown too, but only for what it truly is —
     which simulation the student stepped into the assessment from — and
     never as the answer to "what did they use". */
  function techUsedHTML(personId, experimentId, att) {
    var sum = state.technologyUseSummary(personId, experimentId);
    var out = '';
    if (sum.none) {
      out += '<div class="k">Technologies used</div><div class="v">' +
        '<span class="muted">No simulation run is recorded for this student on this experiment.</span>' +
        (sum.requestedOnly.length
          ? '<span class="tsub2">Access was requested for ' + ui.techBadges(sum.requestedOnly) +
            ', but no run was started.</span>' : '') +
        '</div>';
    } else {
      out += '<div class="k">Technologies used</div><div class="v">' +
        sum.rows.filter(function (r) { return r.used; }).map(function (r) {
          return '<span class="techused">' + ui.fmtBadge(r.technology) +
            '<span class="tsub">' + (r.completed ? 'completed' : 'in progress') + '</span></span>';
        }).join(' ') +
        (sum.multiple
          ? '<span class="tsub2">This student used <strong>more than one</strong> technology for this ' +
            'experiment. The assessment is experiment-level, so it covers all of them.</span>'
          : '') +
        (sum.requestedOnly.length
          ? '<span class="tsub2">Also requested but never run: ' + ui.techBadges(sum.requestedOnly) + '.</span>'
          : '') +
        '</div>';
    }
    if (att && att.sourceTechnology && data.TECHNOLOGIES[att.sourceTechnology]) {
      out += '<div class="k">Entered the assessment from</div><div class="v">' +
        ui.fmtBadge(att.sourceTechnology) + ' simulation' +
        '<span class="tsub2">Which simulation this attempt was started from — not the full list above.</span>' +
        '</div>';
    }
    return out;
  }

  return {
    href: href, requireFaculty: requireFaculty, requireMapped: requireMapped,
    techUsedHTML: techUsedHTML,
    courseLine: courseLine, expLink: expLink, statGrid: statGrid,
    completionNote: completionNote, authorityNote: authorityNote,
    mappingDemoPanel: mappingDemoPanel, withheldMark: withheldMark,
    techStateList: techStateList, progressBar: progressBar,
    institutionCourseCode: institutionCourseCode, bindSearch: bindSearch,
    tenantHoldingsCard: tenantHoldingsCard,
    assessmentBadge: assessmentBadge, typeLabel: typeLabel, typeBadge: typeBadge,
    /* Implementation 09 — utilisation presentation, shared by the
       Student Progress row, its usage drawer and the detail page. */
    useFigures: useFigures, useSourceNote: useSourceNote, useDetailHTML: useDetailHTML,
    mappedTechnologies: mappedTechnologies, techMetrics: techMetrics
  };
})();


(function () {
  'use strict';

  var esc = XRSLP.util.esc;
  var util = XRSLP.util;
  var ui = XRSLP.ui;
  var data = XRSLP.data;
  var state = XRSLP.state;
  var F = XRSLP.facultyUI;
  var L = XRSLP.studentUI;

  /* ============================================================
     #/faculty — PROTOTYPE-ONLY faculty resolution.

     Real authentication is a later build item (U-AUTH-01 / U-AUTH-06).
     This screen resolves the prototype pointer to a REAL Faculty
     record, or offers a chooser over the Faculty records that actually
     exist. It is not a login and it grants nothing.
     ============================================================ */
  XRSLP.screens.facultyHome = function () {
    var chosen = state.protoFaculty();
    if (chosen) { return { redirect: F.href.overview(chosen.id) }; }

    var rows = [];
    state.tenants().forEach(function (t) {
      state.facultyForTenant(t.id).forEach(function (p) { rows.push({ tenant: t, person: p }); });
    });

    var body = rows.length
      ? '<ul class="picklistr">' + rows.map(function (r) {
          var scope = state.facultyScope(r.person.id);
          var pending = state.reviewsForFaculty(r.person.id, { status: 'pending' }).length;
          return '<li class="pickrow">' +
            '<div class="pk-body">' +
            '<div class="pk-n">' + esc(r.person.name) +
              (pending ? ' ' + ui.badge('b-warning', 'clock', pending + ' to review') : '') + '</div>' +
            '<div class="pk-m">' + esc(r.tenant.name) +
              (r.person.facultyId ? ' · ' + esc(r.person.facultyId) : '') + '</div>' +
            '<div class="pk-e">' +
            esc(scope.experiments.length
              ? scope.experiments.length + ' mapped ' + util.plural(scope.experiments.length, 'experiment')
              : 'No content mapped to this faculty member') + '</div>' +
            '</div>' +
            '<a class="btn sec" href="' + F.href.overview(r.person.id) + '">Open workspace' +
            '<span class="sr-only"> as ' + esc(r.person.name) + '</span></a>' +
            '</li>';
        }).join('') + '</ul>'
      : ui.emptyState({
          icon: 'users', heading: 'h2',
          title: 'No faculty records exist yet',
          body: 'Faculty are created by an institution’s Tenant Admin. Add one, then map content to them.',
          actionsHTML: '<a class="btn pri" href="#/tenant">Open the Tenant Admin workspace</a>'
        });

    return {
      area: 'faculty', faculty: null, tenant: null, navKey: null,
      title: 'Faculty workspace',
      html: ui.phead('Faculty workspace',
        'Choose which real faculty record to view the prototype as.') +
        '<div class="stack">' +
        /* KEPT, and deliberately not folded away: this note is what stops
           a role chooser being read as a sign-in screen. Cut to the two
           sentences that carry that — the rest ("the ones a Tenant Admin
           created", "still sees only the content mapped to them") is
           restated by the list itself and by every screen behind it. */
        ui.protoNote('<p>Sign-in is not implemented in this prototype. Choosing a faculty member changes what ' +
          'is displayed and nothing else.</p>') +
        '<div class="tablecard">' + body + '</div>' +
        '</div>'
    };
  };

  /* ============================================================
     FACULTY OVERVIEW — operational, and every figure derived.

     No KPI, index, score, rank, prediction or attendance appears here
     (PM-11 · STK31-29). Each card states what it counts.
     ============================================================ */
  XRSLP.screens.facultyOverview = function (params) {
    var r = F.requireFaculty(params, 'overview');
    if (!r.faculty) { return r.fail; }
    var f = r.faculty, tenant = r.tenant;
    var ov = state.facultyOverview(f.id);
    var scope = ov.scope;

    if (!scope.experiments.length) {
      return {
        area: 'faculty', faculty: f, tenant: tenant, navKey: 'overview',
        title: 'Overview — ' + f.name,
        html: ui.phead('Welcome, ' + f.name, esc(tenant.name)) +
          '<div class="stack">' +
          '<div class="tablecard">' + ui.emptyState({
            icon: 'layers', heading: 'h2',
            title: scope.blocked.length ? 'Your mapped content is not active' : 'No content is mapped to you yet',
            body: scope.blocked.length
              ? 'Content was mapped to you, but the institution’s access behind ' +
                (scope.blocked.length === 1 ? 'that mapping' : 'those mappings') + ' is not currently usable.'
              : 'A faculty member manages the courses and experiments their institution maps to them. Nothing ' +
                'has been mapped to you yet, so there is nothing to configure or review.'
          }) + '</div>' +
          (scope.blocked.length
            ? ui.card('Why your mapped content is unavailable',
                '<ul class="reasonlist">' + scope.blocked.map(function (b) {
                  var c = data.course(b.mapping.courseId);
                  return '<li><strong>' + esc(c ? c.name : b.mapping.courseId) + '</strong> — ' +
                    esc(state.assignabilityText(b.reason)) + '.</li>';
                }).join('') + '</ul>', null, 'h2')
            : '') +
          F.mappingDemoPanel(tenant) +
          '</div>'
      };
    }

    /* THE FIGURES, AND EVERY ONE OF THEM A DESTINATION. A number on a
       dashboard that cannot be opened is a number the reader has to go
       and find again somewhere else. The two rows that used to sit in
       "Needs your attention" as pure statistics — submissions recorded,
       entitlements with no activity — are figures, and live here. */
    var readyCount = ov.stats.filter(function (st) {
      return st.assessment && state.assessmentReadiness(st.assessment).ready;
    }).length;
    /* ⚠ FOUR TILES, NOT SEVEN FIGURES IN A STRIP.

       Implementation 08 replaced this dashboard's `.statgrid` with the
       dense `ui.statStrip`, and then — because the strip is cheap — grew
       it to seven. Seven numbers of equal weight across one row is not a
       dashboard; it is a readout, and the two that mattered (what you
       teach, what is waiting for you) were the same size as the two that
       did not (submissions, not started).

       Back to four tiles, which is what the previous build had and what
       it was right about. `submissions` and `not started` were not
       deleted — they are per-experiment facts and they are in the table
       below, where they belong to a row rather than to the institution.
       Every tile is still a link, which the old tiles were not. */
    /* `F.statGrid`, not a bare call: the screens live in a different
       IIFE from the helper module that defines it. */
    var stats = F.statGrid([
      { label: 'Experiments', value: ov.experiments,
        note: util.plural(ov.experiments, 'experiment') + ' mapped to you',
        href: F.href.content(f.id) },
      { label: 'Students', value: ov.students,
        note: 'can open at least one', href: F.href.students(f.id) },
      { label: 'Assessments ready', value: readyCount + ' of ' + ov.assessments,
        note: 'ready for students', href: F.href.assessments(f.id) },
      { label: 'Responses to review', value: ov.pendingReviews,
        note: ov.pendingReviews ? 'written answers waiting for you' : 'nothing waiting',
        tone: ov.pendingReviews ? 'warn' : '', href: F.href.reviews(f.id) }
    ]);

    /* ATTENTION ROWS: every one is a real current state with a real
       destination, and every one is something to DO. A statistic is not
       something to do — it went to the strip above. Rows carry a weight
       so the list is ordered by urgency rather than by the order the
       loops happen to run in, and the tail folds away: an unbounded
       list of equally-weighted rows is a wall, not a dashboard. */
    var attention = [];
    scope.blocked.forEach(function (b) {
      var c = data.course(b.mapping.courseId);
      attention.push({
        w: 0, icon: 'alertCirc', tone: 'warn',
        text: 'A mapping to ' + esc(c ? c.name : b.mapping.courseId) + ' is not usable — ' +
          esc(state.assignabilityText(b.reason)) + '.',
        href: null, action: null, raw: true
      });
    });
    if (ov.pendingReviews) {
      attention.push({
        w: 1, icon: 'edit', tone: 'warn',
        text: ov.pendingReviews + ' written ' + util.plural(ov.pendingReviews, 'response') +
          ' ' + (ov.pendingReviews === 1 ? 'is' : 'are') + ' waiting for your review.',
        href: F.href.reviews(f.id), action: 'Open reviews'
      });
    }
    ov.assessmentsWithoutQuestions.forEach(function (def) {
      var ctx = data.contextOf(def.experimentId);
      attention.push({
        w: 2, icon: 'alert', tone: 'warn',
        text: esc(ctx ? ctx.experiment.name : def.experimentId) +
          ' has an assessment with no questions, so no student can take it.',
        href: F.href.builder(f.id, def.experimentId), action: 'Add questions', raw: true
      });
    });
    /* THE DEADLINE, WHERE IT CAN BE ACTED ON. `def.deadline` is stored
       and edited but was surfaced nowhere a faculty member would use it.
       A deadline is worth raising only while it is still ahead and the
       submissions are short of the students entitled — a passed deadline
       is history, and a complete one is finished. */
    ov.stats.forEach(function (st) {
      var def = st.assessment;
      if (!def || !def.deadline || !st.reach) { return; }
      var days = util.daysUntil(def.deadline);
      if (days === null || days < 0 || days > 14) { return; }
      if (st.submitted >= st.reach) { return; }
      var ctx = data.contextOf(st.experimentId);
      attention.push({
        w: 3, icon: 'clock', tone: 'warn',
        text: esc(ctx ? ctx.experiment.name : st.experimentId) + ' is due ' +
          (days === 0 ? 'today' : days === 1 ? 'tomorrow' : 'in ' + days + ' days') + ' — ' +
          st.submitted + ' of ' + st.reach + ' ' + util.plural(st.reach, 'student') +
          ' ' + (st.submitted === 1 ? 'has' : 'have') + ' submitted.',
        href: F.href.students(f.id), action: 'See progress', raw: true
      });
    });
    ov.experimentsWithoutAssessment.forEach(function (eid) {
      var ctx = data.contextOf(eid);
      attention.push({
        w: 4, icon: 'doc', tone: '',
        text: esc(ctx ? ctx.experiment.name : eid) + ' has no assessment configured.',
        href: F.href.assessment(f.id, eid), action: 'Configure', raw: true
      });
    });
    attention.sort(function (a, b) { return a.w - b.w; });

    function attentionRow(a) {
      /* The computed tone is EMITTED. It used to be collapsed to
         warn-or-nothing, which made `.attn .at-row.good` unreachable. */
      return '<li class="at-row ' + esc(a.tone === 'warn' ? 'warn' : a.tone === 'good' ? 'good' : '') + '">' +
        '<span class="at-ic">' + ui.ic(a.icon) + '</span>' +
        '<span class="at-body"><span class="at-t">' + (a.raw ? a.text : esc(a.text)) + '</span></span>' +
        (a.href ? '<a class="btn sm sec" href="' + a.href + '">' + esc(a.action) + '</a>' : '') +
        '</li>';
    }
    var TOP = 5;
    var attentionHTML = attention.length
      ? '<ul class="attn">' + attention.slice(0, TOP).map(attentionRow).join('') + '</ul>' +
        (attention.length > TOP
          ? '<details class="about"><summary>' + ui.ic('info') +
            '<span>' + (attention.length - TOP) + ' more ' +
            util.plural(attention.length - TOP, 'item') + '</span>' +
            '<span class="ab-more" aria-hidden="true">Show</span></summary>' +
            '<div class="ab-b"><ul class="attn">' +
            attention.slice(TOP).map(attentionRow).join('') + '</ul></div></details>'
          : '')
      /* §11 — one line, not a card. */
      : ui.okRow('Nothing needs your attention');

    /* A per-experiment roll-up: the same numbers the Student Progress
       screen shows, summarised. Not started / In progress / Awaiting
       review / Completed are four parts of ONE whole, so they are drawn
       as one proportion with the counts beside it — as five bare integer
       columns the reader had to do the arithmetic on every row. */
    var totals = { reach: 0, notStarted: 0, inProgress: 0, awaitingReview: 0, completed: 0 };
    var expRows = ov.stats.map(function (st) {
      totals.reach += st.reach;
      totals.notStarted += st.notStarted;
      totals.inProgress += st.inProgress;
      totals.awaitingReview += st.awaitingReview;
      totals.completed += st.completed;
      var def = st.assessment;
      var count = def ? def.questions.length : 0;
      return '<tr>' +
        '<td data-label="Experiment">' + F.expLink(f.id, st.experimentId) + '</td>' +
        '<td data-label="Students" class="num tabular">' + st.reach + '</td>' +
        '<td data-label="Student progress">' + F.progressBar(st) + '</td>' +
        '<td data-label="Assessment">' + F.assessmentBadge(def) +
          (def ? '<span class="tsub2 tabular">' + count + ' ' + util.plural(count, 'question') +
            (def.deadline ? ' · due ' + esc(util.fmtDate(def.deadline)) : '') + '</span>' : '') + '</td>' +
        '</tr>';
    }).join('');

    /* §5 — the four-metric strip was already the right shape. What was
       missing was a statement of what this workspace is for and a way
       into the four screens a Faculty member actually works in. */
    var quick = ui.quickActions([
      { href: F.href.content(f.id),     icon: 'layers', label: 'My Content' },
      { href: F.href.assessments(f.id), icon: 'doc',    label: 'Assessments' },
      { href: F.href.bank(f.id),        icon: 'book',   label: 'Question Bank' },
      { href: F.href.reviews(f.id),     icon: 'check',  label: 'Review responses' }
    ]);

    var html =
      ui.phead('Welcome, ' + f.name, esc(tenant.name) +
        (f.facultyId ? ' · ' + esc(f.facultyId) : '')) +
      ui.orient('Manage your experiments, assessments, questions and student progress.') +
      '<div class="stack">' +
      stats +
      ui.card('Quick actions', quick, null, 'h2') +
      ui.sectionHead({ title: 'Needs your attention', count: attention.length,
        desc: 'Everything here is something you can act on now.' }) +
      ui.card(null, attentionHTML) +
      ui.sectionHead({ title: 'Your experiments', count: ov.experiments,
        desc: 'Students who can open each experiment mapped to you, and how far they have got.',
        actionsHTML: '<a class="btn sec sm" href="' + F.href.students(f.id) + '">Student progress</a>' }) +
      ui.card(null,
        '<div class="tscroll"><table class="dt">' +
        '<caption class="sr-only">Progress across the experiments mapped to you. For each experiment: how ' +
        'many students can open it, then how many have not started, are in progress, are awaiting your ' +
        'review and are completed, then the state of its assessment.</caption>' +
        '<thead><tr><th scope="col">Experiment</th><th scope="col" class="num">Students</th>' +
        '<th scope="col">Student progress</th>' +
        '<th scope="col">Assessment</th></tr></thead><tbody>' + expRows + '</tbody>' +
        (ov.stats.length > 1
          ? '<tfoot><tr><th scope="row">All experiments</th>' +
            '<td class="num tabular">' + totals.reach + '</td>' +
            '<td>' + F.progressBar(totals) + '</td><td></td></tr></tfoot>'
          : '') +
        /* §13 — `completionNote()` explains how "Completed" is derived.
           That is documentation, and it stays on the Student progress
           screen where the figure is the subject; a dashboard should
           explain the user's work, not the derivation. */
        '</table></div>') +
      '</div>';

    return {
      area: 'faculty', faculty: f, tenant: tenant, navKey: 'overview',
      title: 'Overview — ' + f.name, html: html
    };
  };

  /* ============================================================
     MY CONTENT — the mapping boundary, made visible.
     ============================================================ */
  XRSLP.screens.facultyContent = function (params) {
    var r = F.requireFaculty(params, 'content');
    if (!r.faculty) { return r.fail; }
    var f = r.faculty, tenant = r.tenant;
    var scope = state.facultyScope(f.id);

    if (!scope.experiments.length) {
      return {
        area: 'faculty', faculty: f, tenant: tenant, navKey: 'content',
        title: 'My Content — ' + f.name,
        html: ui.phead('My Content', 'Courses and experiments mapped to you inside ' + esc(tenant.name) + '.') +
          '<div class="stack"><div class="tablecard">' + ui.emptyState(
            /* Implementation 06 — a mapping that exists but is SUSPENDED is
               not the same thing as a mapping that was never made, and
               saying "nothing is mapped to you yet" while the institution
               is deactivated would be plainly untrue. */
            scope.blocked.length
              ? { icon: 'alertCirc', heading: 'h2',
                  title: 'Your mapped content is not available at the moment',
                  body: 'You have ' + scope.blocked.length + ' ' +
                    XRSLP.util.plural(scope.blocked.length, 'mapping') + ' in this institution. ' +
                    (scope.blocked.some(function (b) { return b.reason === 'tenant-inactive'; })
                      ? 'The institution has been deactivated by the platform, so mapped content cannot be ' +
                        'used right now. Nothing has been deleted — everything returns when it is reactivated.'
                      : 'The approvals behind them cannot currently carry content: ' +
                        scope.blocked.map(function (b) { return state.assignabilityText(b.reason); })
                          .filter(function (t, i, a) { return a.indexOf(t) === i; }).join('; ') + '.') }
              : { icon: 'layers', heading: 'h2',
                  title: 'No content is mapped to you yet',
                  body: 'Your institution decides which courses and experiments each faculty member delivers. ' +
                    'Until something is mapped to you, there is nothing here — this is not an error.' }
          ) + '</div>' +
          XRSLP.facultyUI.tenantHoldingsCard(f, tenant) +
          (scope.blocked.length ? '' : F.mappingDemoPanel(tenant)) +
          '</div>'
      };
    }

    var totalStudents = 0;
    var rows = scope.experiments.map(function (row) {
      var ctx = data.contextOf(row.experimentId);
      var techs = F.mappedTechnologies(row);
      var reach = state.facultyStudentReach(f.id, row.experimentId);
      var def = state.assessmentForTenant(tenant.id, row.experimentId);
      var stats = state.facultyExperimentStats(f.id, row.experimentId);
      var mapping = row.viaCourse ? 'Course mapping' : 'Experiment mapping';
      /* The INSTITUTION's course code, because a Faculty member works
         inside one institution and that is the code their colleagues and
         their students use. The platform code belongs to the Content
         Manager and is not this reader's identifier. */
      var icode = F.institutionCourseCode(tenant.id, ctx && ctx.course ? ctx.course.id : row.courseId);
      totalStudents += reach.length;
      return '<tr>' +
        '<td data-label="Course"><span class="tmain">' + esc(ctx ? ctx.course.name : row.courseId) + '</span>' +
          (icode ? '<span class="tsub2">' + icode + '</span>' : '') +
          '<span class="tsub2">' + esc(mapping) + '</span></td>' +
        '<td data-label="Experiment">' + F.expLink(f.id, row.experimentId) + '</td>' +
        '<td data-label="Technologies">' + (techs.length ? ui.techBadges(techs) :
          '<span class="muted">None held</span>') + '</td>' +
        '<td data-label="Students" class="num tabular">' + reach.length + '</td>' +
        '<td data-label="Assessment">' + F.assessmentBadge(def) + '</td>' +
        '<td data-label="Student progress">' + F.progressBar(stats) + '</td>' +
        '<td class="cell-actions"><a class="btn sm sec" href="' + F.href.assessment(f.id, row.experimentId) +
          '">Open<span class="sr-only"> ' + esc(ctx ? ctx.experiment.name : row.experimentId) +
          '</span></a></td>' +
        '</tr>';
    }).join('');

    var html =
      ui.phead('My Content', 'Courses and experiments mapped to you inside ' + esc(tenant.name) + '.') +
      '<div class="stack">' +
      ui.sectionHead({ title: 'Mapped to you', count: scope.experiments.length,
        desc: 'What your institution has asked you to deliver. Everything you can configure, review or evaluate ' +
          'is on this list.' }) +
      ui.card(null,
        ui.metrics([
          { v: scope.experiments.length, k: util.plural(scope.experiments.length, 'experiment') },
          { v: scope.courseIds.length, k: util.plural(scope.courseIds.length, 'course') },
          { v: totalStudents, k: 'students with access' },
          scope.blocked.length
            ? { v: scope.blocked.length, k: 'mappings not usable', tone: 'warn' } : null
        ]) +
        /* The entitlement-not-enrolment rule was a standing 55-word alert
           box above the table on every visit. It qualifies ONE column, so
           it is a single line under the figure it qualifies. The rule
           itself is unchanged and still absolute: reach is effective
           entitlement, never course enrolment. */
        '<p class="facnote">Students are counted by <strong>who can actually open the experiment</strong>, ' +
        'not by course enrolment. A student who has not been given the experiment, or who falls outside the ' +
        'approved licence quantity, cannot open it and is not counted.</p>' +
        '<div class="tscroll"><table class="dt">' +
        '<caption class="sr-only">Experiments mapped to you, the technologies available for each, ' +
        'and how many students can open them.</caption>' +
        '<thead><tr><th scope="col">Course</th><th scope="col">Experiment</th>' +
        '<th scope="col">Available technologies</th><th scope="col" class="num">Students</th>' +
        '<th scope="col">Assessment</th><th scope="col">Student progress</th>' +
        '<th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' +
        rows + '</tbody></table></div>') +
      (scope.blocked.length
        ? ui.card('Mappings that are not currently usable',
            '<ul class="reasonlist">' + scope.blocked.map(function (b) {
              var c = data.course(b.mapping.courseId);
              return '<li><strong>' + esc(c ? c.name : b.mapping.courseId) + '</strong> — ' +
                esc(state.assignabilityText(b.reason)) + '.</li>';
            }).join('') + '</ul>' +
            '<p class="cardfoot">Nothing has been removed. These mappings become usable again if your ' +
            'institution’s access does.</p>',
            null, 'h2')
        : '') +
      F.tenantHoldingsCard(f, tenant) +
      /* The authority boundary, stated ONCE in the workspace, on the
         screen whose subject it is. It used to repeat on the Overview. */
      F.authorityNote() +
      '</div>';

    return {
      area: 'faculty', faculty: f, tenant: tenant, navKey: 'content',
      title: 'My Content — ' + f.name, html: html
    };
  };

  /* ============================================================
     STUDENT PROGRESS + OPERATIONAL ANALYTICS.

     One screen, because the analytics ARE the progress: every figure is
     a count over the rows below it, and each column says what it counts.
     ============================================================ */

  /* Filter state lives in the module, like the other builder screens, so
     a re-render keeps the filters the Faculty member set.

     ⚠ It is SCOPED to that faculty member. Left unscoped, a search term
     typed by one faculty member silently narrowed the next one's list —
     the count said "1 of 3" and the missing two looked like missing
     students rather than a filter nobody had set. */
  var progFilter = { owner: null, experimentId: '', status: '', q: '', page: 0 };
  function progFilterFor(facultyId) {
    if (progFilter.owner !== facultyId) {
      progFilter = { owner: facultyId, experimentId: '', status: '', q: '', page: 0 };
    }
    return progFilter;
  }
  /* How many student × experiment rows one page carries. A faculty
     member mapped at course level to six experiments with sixty entitled
     students each is 360 rows, and the page re-rendered all of them on
     every keystroke in the search box. */
  var PROG_PAGE = 25;


  XRSLP.screens.facultyStudents = function (params) {
    var r = F.requireFaculty(params, 'students');
    if (!r.faculty) { return r.fail; }
    var f = r.faculty, tenant = r.tenant;
    var scope = state.facultyScope(f.id);
    progFilterFor(f.id);

    if (!scope.experiments.length) {
      return {
        area: 'faculty', faculty: f, tenant: tenant, navKey: 'students',
        title: 'Student Progress — ' + f.name,
        html: ui.phead('Student Progress') +
          '<div class="tablecard">' + ui.emptyState({
            icon: 'users', heading: 'h2',
            title: 'No content is mapped to you yet',
            body: 'Student progress is reported for the experiments mapped to you. Nothing is mapped yet.',
            actionsHTML: '<a class="btn pri" href="' + F.href.content(f.id) + '">See My Content</a>'
          }) + '</div>'
      };
    }

    var mappedIds = scope.experiments.map(function (x) { return x.experimentId; });
    if (progFilter.experimentId && mappedIds.indexOf(progFilter.experimentId) === -1) {
      progFilter.experimentId = '';
    }

    /* ⚠ COMPUTE THE ANALYTICS TREE ONCE PER RENDER.
       `facultyExperimentStats` runs facultyStudentReach → liveAccessForTenant
       → entitledStudentsFor and then experimentProgress for every student.
       It used to be called once per experiment while building the rows and
       a SECOND time per experiment while building the technology cards
       below — the whole tree, twice, on every keystroke. Same figures,
       same source, one pass. */
    var statsByExperiment = {};
    scope.experiments.forEach(function (row) {
      statsByExperiment[row.experimentId] = state.facultyExperimentStats(f.id, row.experimentId);
    });

    /* Build one row per (student × experiment) — the unit a Faculty
       member actually works in. */
    var allRows = [];
    scope.experiments.forEach(function (row) {
      var st = statsByExperiment[row.experimentId];
      st.rows.forEach(function (sr) {
        var person = state.personById(sr.personId);
        if (!person) { return; }
        var pendingHere = state.reviewsForFaculty(f.id, {
          experimentId: row.experimentId, status: 'pending'
        }).filter(function (rv) { return rv.personId === sr.personId; }).length;
        allRows.push({
          person: person, experimentId: row.experimentId,
          technologies: sr.technologies, progress: sr.progress,
          attempt: state.latestSubmittedAttempt(sr.personId, row.experimentId),
          assessState: state.assessmentState(sr.personId, row.experimentId),
          pendingReviews: pendingHere,
          /* Implementation 09 — folded from the runtime event log, ONCE
             per row in the same pass as everything else, for the same
             reason the stats tree above is computed once. */
          use: state.experimentUtilisation(sr.personId, row.experimentId, sr.technologies)
        });
      });
    });

    var q = XRSLP.data.norm(progFilter.q);
    var rows = allRows.filter(function (x) {
      if (progFilter.experimentId && x.experimentId !== progFilter.experimentId) { return false; }
      if (progFilter.status && x.progress.status !== progFilter.status) { return false; }
      if (q) {
        var hay = XRSLP.data.norm(x.person.name + ' ' + (x.person.studentId || '') + ' ' + (x.person.email || ''));
        if (hay.indexOf(q) === -1) { return false; }
      }
      return true;
    });

    /* Aggregates are computed over the FILTERED set, so the numbers and
       the table below them always agree. */
    var agg = { total: rows.length, notStarted: 0, inProgress: 0, awaiting: 0, completed: 0, submitted: 0, passed: 0, notPassed: 0 };
    rows.forEach(function (x) {
      if (x.progress.status === state.TECH_PROGRESS.COMPLETED) { agg.completed += 1; }
      else if (x.progress.status === state.TECH_PROGRESS.PENDING_REVIEW) { agg.awaiting += 1; }
      else if (x.progress.status === state.TECH_PROGRESS.IN_PROGRESS) { agg.inProgress += 1; }
      else { agg.notStarted += 1; }
      if (x.attempt) {
        agg.submitted += 1;
        if (x.attempt.outcome === state.OUTCOME.PASSED) { agg.passed += 1; }
        else if (x.attempt.outcome === state.OUTCOME.NOT_PASSED) { agg.notPassed += 1; }
      }
    });

    /* ⚠ FOUR FIGURES, NOT EIGHT.

       This strip carried entitlements shown · not started · in progress ·
       awaiting review · completed · submitted · passed · not passed —
       eight numbers of identical weight, of which three (submitted,
       passed, not passed) describe ASSESSMENT OUTCOMES rather than
       progress, and are already in the table's own Assessment column
       row by row. Reading eight equal figures is not reading a summary.

       What survives is the four a Faculty member acts on: how many
       students they are looking at, how many are moving, how many are
       WAITING ON THEM, and how many are finished. Nothing is lost — the
       outcome breakdown is one filter away and is on every row. */
    /* ⚠ ONE COUNTING ALTITUDE ACROSS THE WHOLE STRIP — Implementation
       09 QA relabelled the first figure, and the trap in doing so is
       that the other three count STUDENT × EXPERIMENT rows. Calling the
       first one "students" would put a count of people beside three
       counts of pairings, which is exactly how "12 in progress" starts
       being read as twelve people. Every figure here is a pairing, and
       the label says so in the vocabulary the institution's own
       utilisation card already uses. */
    var statsHTML = ui.statStrip([
      { v: agg.total, k: util.plural(agg.total, 'student–experiment pairing') },
      { v: agg.inProgress, k: 'in progress' },
      { v: agg.awaiting, k: 'awaiting your review', tone: agg.awaiting ? 'warn' : '' },
      { v: agg.completed, k: 'completed' }
    ]);

    /* PAGING. `rows` stays the whole filtered set — the aggregates above
       and the CSV export below both describe it — and only the table is
       windowed. The page index is clamped here rather than in the
       handlers, so an experiment filter that shortens the list can never
       leave the reader on an empty page. */
    var pageCount = Math.max(1, Math.ceil(rows.length / PROG_PAGE));
    if (progFilter.page >= pageCount) { progFilter.page = pageCount - 1; }
    if (progFilter.page < 0) { progFilter.page = 0; }
    var from = progFilter.page * PROG_PAGE;
    var pageRows = rows.slice(from, from + PROG_PAGE);

    var filterBar =
      '<div class="listbar">' +
      '<label for="pf-q">Search student' +
      '<input type="text" id="pf-q" value="' + esc(progFilter.q) + '" placeholder="Name, ID or email">' +
      '</label>' +
      '<label for="pf-e">Experiment<select id="pf-e">' +
      '<option value="">All mapped experiments</option>' +
      scope.experiments.map(function (row) {
        var ctx = data.contextOf(row.experimentId);
        return '<option value="' + esc(row.experimentId) + '"' +
          (progFilter.experimentId === row.experimentId ? ' selected' : '') + '>' +
          esc(ctx ? ctx.experiment.name : row.experimentId) + '</option>';
      }).join('') + '</select></label>' +
      '<label for="pf-s">Progress<select id="pf-s">' +
      '<option value="">Any state</option>' +
      ['NOT_STARTED', 'IN_PROGRESS', 'PENDING_FACULTY_REVIEW', 'COMPLETED'].map(function (k) {
        return '<option value="' + esc(k) + '"' + (progFilter.status === k ? ' selected' : '') + '>' +
          esc(L.progressLabel(k)) + '</option>';
      }).join('') + '</select></label>' +
      '<span class="lcount">' + (rows.length === allRows.length
        ? rows.length + ' ' + util.plural(rows.length, 'pairing')
        : rows.length + ' of ' + allRows.length + ' shown') + '</span>' +
      /* 07.3 — the stakeholder's "they cannot count each student".
         Exports the FILTERED rows — the whole set, not the page — so the
         file matches what the filters describe. */
      '<button class="btn sm sec" type="button" id="pf-export"' +
        (rows.length ? '' : ' disabled aria-disabled="true"') + '>' +
        ui.ic('download') + 'Export CSV</button>' +
      '</div>';

    var pageBar = rows.length > PROG_PAGE
      ? '<div class="pagebar"><span class="pg-n tabular">Showing ' + (from + 1) + '–' +
        (from + pageRows.length) + ' of ' + rows.length + '</span>' +
        '<span class="pg-n">Page ' + (progFilter.page + 1) + ' of ' + pageCount + '</span>' +
        '<span class="pg-a">' +
        '<button class="btn sm sec" type="button" id="pf-prev"' +
          (progFilter.page === 0 ? ' disabled aria-disabled="true"' : '') + '>Previous</button>' +
        '<button class="btn sm sec" type="button" id="pf-next"' +
          (progFilter.page >= pageCount - 1 ? ' disabled aria-disabled="true"' : '') + '>Next</button>' +
        '</span></div>'
      : '';

    var tableHTML = rows.length
      ? '<div class="tscroll"><table class="dt">' +
        '<caption class="sr-only">One row per student and experiment. Simulation status is reported separately ' +
        'for each technology; the assessment is one per experiment. ' +
        (rows.length > PROG_PAGE
          ? 'Showing rows ' + (from + 1) + ' to ' + (from + pageRows.length) + ' of ' + rows.length + '.'
          : '') + '</caption>' +
        '<thead><tr><th scope="col">Student</th><th scope="col">Experiment</th>' +
        '<th scope="col">Resources</th><th scope="col">Simulation activity</th>' +
        '<th scope="col">Assessment</th><th scope="col">Overall</th>' +
        '<th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' +
        pageRows.map(function (x) {
          var res = x.progress.resources;
          var ectx = data.contextOf(x.experimentId);
          return '<tr>' +
            '<td data-label="Student"><span class="tmain">' + esc(x.person.name) + '</span>' +
              '<span class="tsub">' + esc(x.person.studentId || '') + '</span></td>' +
            '<td data-label="Experiment">' + esc(ectx ? ectx.experiment.name : x.experimentId) + '</td>' +
            '<td data-label="Resources" class="tabular">' + res.completed + ' of ' + res.total + '</td>' +
            /* ── Implementation 09 — USE, NOT ONLY STATE ────────────
               PM-08: a Faculty member could see WHETHER a simulation
               was completed and nothing about whether it was used. The
               per-technology chips are unchanged and still carry the
               state; underneath them the row now carries the evidence —
               launches, sessions, recorded time, and when it was last
               touched. A row with no activity says "Never opened"
               rather than printing three zeros. */
            /* ⚠ A SUMMARY, NOT THE TELEMETRY. Per-technology state and
               one line of figures. First use, last activity, open
               sessions and error counts are real and are all on the
               record — putting them here as well is what made this
               column unreadable at 1280px. The stand-in note STAYS: it
               is short, and a figure that came from a demo control may
               never be shown as device traffic anywhere. */
            '<td data-label="Simulation activity">' + F.techStateList(x.progress.technologies, true) +
              F.useFigures(x.use) + F.useSourceNote(x.use) + '</td>' +
            '<td data-label="Assessment">' + L.assessBadge(x.assessState) +
              (x.attempt && x.attempt.score && x.attempt.score.percent !== null
                ? '<span class="tsub2 tabular">' + x.attempt.score.percent + '%' +
                  (x.attempt.score.includesReview ? ' (with review)' : ' (marked questions)') + '</span>'
                : '') +
              /* ⚠ Faculty keep seeing the score; the STUDENT may not have
                 been shown it yet. Saying so here is what stops a figure
                 read off this screen being quoted before the policy
                 releases it — the export already says the same thing. */
              F.withheldMark(x.person.id, x.experimentId) +
              (x.pendingReviews ? '<span class="tsub2">' + x.pendingReviews + ' ' +
                util.plural(x.pendingReviews, 'response') + ' to review</span>' : '') + '</td>' +
            '<td data-label="Overall">' + L.progressBadge(x.progress.status) + '</td>' +
            /* ⚠ ONE DETAIL DESTINATION, NOT TWO — Implementation 09 QA.
               This row carried BOTH a "Usage" drawer and an "Open" link,
               and a reader had to guess which held what. The full
               Student–Experiment record already answers everything the
               drawer did — and the resources, the assessment and the
               written answers besides — so it is the single detail
               destination and the drawer is gone. The per-technology
               session breakdown was not lost with it: `useDetailHTML`
               still renders it, on the record. */
            '<td class="cell-actions">' +
              '<a class="btn sm sec" href="' +
              F.href.studentDetail(f.id, x.person.id, x.experimentId) + '">View details' +
              '<span class="sr-only"> for ' + esc(x.person.name) + '</span></a></td>' +
            '</tr>';
        }).join('') + '</tbody></table></div>' + pageBar
      /* h2, not h3: this empty state stands in for the table on a page
         whose only other heading is the h1, so h3 skips a level. The
         compact empty row is not inside a card with a heading of its
         own — that is the case where h3 would be right. */
      : ui.emptyRow({
          icon: allRows.length ? 'search' : 'users', heading: 'h2',
          title: allRows.length ? 'No student matches these filters' : 'No student can open your experiments yet',
          body: allRows.length
            ? 'Change the search or the filters to see other students.'
            : 'Students appear here once your institution gives one of your experiments to them and they can ' +
              'open it.',
          actionsHTML: allRows.length
            ? '<button class="btn sec sm" type="button" id="pf-clear">Clear filters</button>' : ''
        });

    /* Per-technology metrics for whichever experiments are in view, from
       the stats computed once above. TECHNOLOGY FIGURES ARE SIMULATION
       FIGURES ONLY — an experiment-level assessment submission never
       makes a technology look started. */
    var techScope = progFilter.experimentId
      ? [progFilter.experimentId]
      : scope.experiments.map(function (x) { return x.experimentId; });
    var techCards = techScope.map(function (eid) {
      var st = statsByExperiment[eid] || state.facultyExperimentStats(f.id, eid);
      var ctx = data.contextOf(eid);
      return ui.card(ctx ? ctx.experiment.name : eid, F.techMetrics(st),
        st.reach + ' ' + util.plural(st.reach, 'student') + ' with access', 'h3');
    }).join('');

    /* The technology analytics are a SECOND read of the same students,
       one card per experiment in view. With three or more experiments in
       scope that is a wall of cards under the table the faculty member
       came for, so past two it folds — the figures are unchanged, and
       one click away. */
    var techLede = '<p class="cardlede">A simulation is technology-specific, so these figures are too. An ' +
      'assessment submission never counts as simulation activity — the assessment belongs to the experiment, ' +
      'not to a technology.</p>';
    var techSection = techScope.length > 2
      ? ui.card('Simulation activity by technology',
          techLede +
          '<details class="about"><summary>' + ui.ic('info') +
          '<span>Per-technology figures for ' + techScope.length + ' experiments</span>' +
          '<span class="ab-more" aria-hidden="true">Show</span></summary>' +
          '<div class="ab-b"><div class="stack sm">' + techCards + '</div></div></details>', null, 'h2')
      : ui.card('Simulation activity by technology',
          techLede + '<div class="stack sm">' + techCards + '</div>', null, 'h2');

    var html =
      ui.phead('Student Progress',
        'Students who can open the experiments mapped to you, inside ' + esc(tenant.name) + '.') +
      '<div class="stack">' +
      statsHTML +
      '<div class="tablecard">' + filterBar + tableHTML + '</div>' +
      (rows.length
        ? '<p class="facnote">Export CSV writes every row these filters select — all ' + rows.length + ' of ' +
          'them, not just the page on screen. A result the student has not been shown is marked as withheld in ' +
          'the file.</p>'
        : '') +
      techSection +
      F.completionNote() +
      '</div>';

    return {
      area: 'faculty', faculty: f, tenant: tenant, navKey: 'students',
      title: 'Student Progress — ' + f.name, html: html,
      after: function () {
        function bindSelect(id, key) {
          var el = document.getElementById(id);
          if (!el) { return; }
          el.addEventListener('change', function () {
            progFilter[key] = el.value;
            /* A narrower list starts at its own beginning. */
            progFilter.page = 0;
            XRSLP.render(true);
            var again = document.getElementById(id);
            if (again) { again.focus(); }
          });
        }
        bindSelect('pf-e', 'experimentId');
        bindSelect('pf-s', 'status');
        F.bindSearch('pf-q', function (value) { progFilter.q = value; progFilter.page = 0; });

        function bindPage(id, delta) {
          var el = document.getElementById(id);
          if (!el) { return; }
          el.addEventListener('click', function () {
            progFilter.page += delta;
            XRSLP.render(true);
            /* Focus follows the control that moved the page; when it has
               become disabled at an end, the other one takes it. */
            var again = document.getElementById(id);
            if (again && !again.disabled) { again.focus(); }
            else {
              var other = document.getElementById(delta > 0 ? 'pf-prev' : 'pf-next');
              if (other) { other.focus(); }
            }
            ui.announce('Page ' + (progFilter.page + 1) + '.');
          });
        }
        bindPage('pf-prev', -1);
        bindPage('pf-next', 1);
        var xp = document.getElementById('pf-export');
        if (xp) {
          xp.addEventListener('click', function () {
            if (!rows.length) { return; }
            var table = XRSLP.csv.facultyProgressRows(rows, {
              state: state, data: data, labels: L,
              /* The INSTITUTION course code, kept separate from the
                 PLATFORM course code — both columns are in the file, and
                 neither is ever filled in from the other. */
              courseMapping: function (experimentId) {
                var c = data.contextOf(experimentId);
                return c && c.course ? state.courseMapping(tenant.id, c.course.id) : null;
              }
            });
            var name = 'student-progress-' + data.norm(f.name).replace(/\s+/g, '-') +
              (progFilter.experimentId ? '-' + progFilter.experimentId : '') + '.csv';
            XRSLP.csv.download(name, XRSLP.csv.toCsv(table));
            ui.announce('Exported ' + rows.length + ' ' + util.plural(rows.length, 'row') + ' to ' + name + '.');
          });
        }
        var clear = document.getElementById('pf-clear');
        if (clear) {
          clear.addEventListener('click', function () {
            progFilter = { owner: f.id, experimentId: '', status: '', q: '', page: 0 };
            XRSLP.render(true);
          });
        }
      }
    };
  };

  /* ============================================================
     ONE STUDENT × ONE EXPERIMENT.
     ============================================================ */
  XRSLP.screens.facultyStudentDetail = function (params) {
    var r = F.requireMapped(params, 'students');
    if (r.fail) { return r.fail; }
    var f = r.faculty, tenant = r.tenant, ctx = r.ctx;
    var e = ctx.experiment;

    var student = state.personById(params.studentId);
    var reach = state.facultyStudentReach(f.id, e.id);
    if (!student || student.role !== 'student' || reach.indexOf(student.id) === -1) {
      return {
        area: 'faculty', faculty: f, tenant: tenant, navKey: 'students',
        title: 'Student not in scope',
        html: ui.phead(e.name, F.courseLine(e.id)) +
          '<div class="stack">' +
          ui.alertBox('warning', 'That student cannot open this experiment',
            '<p>Student progress is reported only for students who can open an experiment mapped to you. ' +
            'This student cannot.</p>') +
          '<div class="formact"><a class="btn pri" href="' + F.href.students(f.id) +
          '">Back to Student Progress</a></div></div>'
      };
    }

    var techs = state.studentEntitledTechnologies(student.id, e.id);
    var prog = state.experimentProgress(student.id, e.id, techs);
    var att = state.latestSubmittedAttempt(student.id, e.id);
    var open = state.currentAttempt(student.id, e.id);
    var assessState = state.assessmentState(student.id, e.id);
    var def = state.assessmentForTenant(tenant.id, e.id);
    var myReviews = state.reviewsForFaculty(f.id, { experimentId: e.id }).filter(function (rv) {
      return rv.personId === student.id;
    });

    var resList = data.resourcesFor(e.id);
    /* `.facreslist`, not `.reslist`: the Student workspace's learning
       list owns `.reslist` as a stack of <details> cards, and this flat
       two-column list was quietly sharing the selector, so a change made
       for one workspace reached the other. */
    var resHTML = resList.length
      ? '<ul class="facreslist">' + resList.map(function (res) {
          var st = state.resourceStatus(student.id, e.id, res.id);
          return '<li><span class="rl-t">' + esc(res.title) + '</span>' +
            '<span class="rl-s">' + L.simBadge(st) + '</span></li>';
        }).join('') + '</ul>'
      : '<p class="cardlede">This experiment has no learning resources.</p>';

    /* ── Implementation 09 — THE FULL PER-TECHNOLOGY RECORD ──────
       This list used to read `sim.launches` and `sim.timeSpentSeconds`
       off the Implementation-03 record: two numbers with nothing
       behind them. Both are now projections of the runtime event log,
       and the whole log is reportable — sessions, when it was first
       used, when it was last touched, how many sessions were left
       open, and which runtime reported each figure. The shared
       renderer is the same one the Student Progress drawer uses, so
       the two screens cannot describe one student differently. */
    var techHTML = F.useDetailHTML(student.id, e.id, techs);

    var assessHTML;
    if (!def) {
      assessHTML = '<p class="cardlede">No assessment is configured for this experiment.</p>';
    } else if (!att && !open) {
      assessHTML = '<div class="kv">' +
        '<div class="k">Assessment</div><div class="v">' + esc(def.title) + '</div>' +
        '<div class="k">State</div><div class="v">' + L.assessBadge(assessState) + '</div>' +
        '</div>';
    } else {
      var shown = att || open;
      var snap = state.attemptAssessment(shown);
      var revState = att ? state.attemptReviewState(att.id) : { total: 0, completed: 0, pending: 0 };
      assessHTML = '<div class="kv">' +
        '<div class="k">Assessment</div><div class="v">' + esc(def.title) + '</div>' +
        '<div class="k">State</div><div class="v">' + L.assessBadge(assessState) + '</div>' +
        '<div class="k">Attempts used</div><div class="v tabular">' +
          state.attemptsFor(student.id, e.id).length +
          (def.attemptLimit ? ' of ' + def.attemptLimit : '') + '</div>' +
        (att ? '<div class="k">Submitted</div><div class="v">' + esc(util.fmtDateTime(att.submittedAt)) + '</div>' : '') +
        /* ⚠ The score STAYS — Faculty performed the evaluation and keep
           seeing it. What is added is whether the STUDENT has been shown
           it, in the same words the progress export uses, so a mark read
           here is never quoted to a student the policy still withholds
           it from. */
        (att && att.score ? '<div class="k">Score</div><div class="v tabular">' +
          (att.score.percent === null ? '—' : att.score.percent + '%') + ' — ' +
          att.score.earned + ' of ' + att.score.total + ' ' + util.plural(att.score.total, 'mark') +
          (att.score.includesReview ? ' including your review' : ' on the automatically marked questions') +
          F.withheldMark(student.id, e.id) +
          '</div>' : '') +
        (att && att.sourceTechnology && data.TECHNOLOGIES[att.sourceTechnology]
          ? '<div class="k">Taken after</div><div class="v">' + ui.fmtBadge(att.sourceTechnology) +
            ' simulation</div>' : '') +
        '<div class="k">Pass mark</div><div class="v tabular">' + (snap ? snap.passMark : def.passMark) + '%</div>' +
        (revState.total
          ? '<div class="k">Written answers</div><div class="v">' + revState.completed + ' of ' +
            revState.total + ' reviewed</div>' : '') +
        '</div>' +
        (revState.pending
          ? '<div class="formact"><a class="btn pri sm" href="' + F.href.reviews(f.id) +
            '">Review the written ' + util.plural(revState.pending, 'answer') + '</a></div>' : '');
    }

    var reviewHTML = myReviews.length
      ? '<ul class="revlist">' + myReviews.map(function (rv) {
          var q = state.reviewQuestion(rv);
          return '<li class="rv-item ' + (rv.status === 'completed' ? 'done' : 'pending') + '">' +
            '<div class="rv-h">' + (rv.status === 'completed'
              ? ui.badge('b-success', 'check', 'Reviewed — ' + rv.marks + ' of ' + rv.maxMarks)
              : ui.badge('b-warning', 'clock', 'Pending Faculty review')) +
            '<a class="btn sm sec" href="' + F.href.review(f.id, rv.id) + '">Open</a></div>' +
            '<p class="rv-q">' + esc(q ? q.text : 'Written answer') + '</p>' +
            (rv.status === 'completed' && rv.feedback
              ? '<p class="rv-f"><span class="an-k">Your feedback</span>' + esc(rv.feedback) + '</p>' : '') +
            '</li>';
        }).join('') + '</ul>'
      : '<p class="cardlede">This student has no written answers for this experiment.</p>';

    var html =
      ui.crumbs([{ label: 'Student Progress', href: F.href.students(f.id) },
                 { label: student.name }]) +
      /* WHO, answered before anything else: the student, their
         institutional ID, the experiment and the course. The ID used to
         sit at the bottom of the Overall card, four cards away from the
         name it belongs to. */
      ui.phead(student.name,
        (student.studentId ? esc(student.studentId) + ' · ' : '') +
        esc(e.name) + ' · ' + F.courseLine(e.id),
        null, ' ' + L.progressBadge(prog.status)) +
      /* ⚠ NO TECHNOLOGY DENOMINATOR — Implementation 09 QA.
         This read "0 of 3 simulations completed", which asserts that
         all three technology formats are required. Nothing in any
         source says so: Web, AR and VR are delivery formats of one
         experiment, not three mandatory steps. The count of formats
         actually finished is a fact and stays; the denominator that
         turned it into a target is gone. */
      ui.metrics([
        { v: prog.resources.completed + ' of ' + prog.resources.total, k: 'resources done' },
        { v: prog.technologies.filter(function (tp) {
            return tp.simulationStatus === state.SIM_STATUS.COMPLETED;
          }).length, k: 'simulation formats completed' },
        { v: myReviews.filter(function (rv) { return rv.status === 'pending'; }).length,
          k: 'answers waiting for you',
          tone: myReviews.some(function (rv) { return rv.status === 'pending'; }) ? 'warn' : '' },
        { v: state.attemptsFor(student.id, e.id).length, k: 'assessment attempts' }
      ]) +
      '<div class="stack">' +
      /* ⚠ OUT OF THE RAIL — Implementation 09 QA. The per-technology
         record is the widest block on this page and was the narrowest
         column's tenant: six figures inside 318px of usable rail, four
         of them behind a sideways drag nothing on screen advertised.
         It takes the FULL content width, directly under the figures it
         explains — which is also what lets six columns fit at 1024.
         `Overall` stays in the rail; it is a summary and reads as one. */
      ui.card('Simulation activity by technology', techHTML, null, 'h2') +
      '<div class="grid-rail"><div class="stack">' +
      ui.card('Assessment', assessHTML, null, 'h2') +
      ui.card('Written answers', reviewHTML, null, 'h2') +
      ui.card('Learning resources', resHTML,
        prog.resources.completed + ' of ' + prog.resources.total + ' marked done', 'h2') +
      '</div><div class="stack">' +
      ui.card('Overall',
        '<div class="kv">' +
        /* The completion rule is defined once on this page, on the row
           it qualifies, instead of as a standing note under the rail. */
        '<div class="k">Overall ' + ui.infoTip('Completed is shown only when nothing is outstanding: every ' +
          'learning resource marked done, a recorded completion for every technology this student can open, ' +
          'and the assessment passed where one is configured. A result waiting for your review is never ' +
          'counted as complete. Whether every technology format is required at all is not settled, so this ' +
          'is the cautious reading.', 'How “Completed” is calculated') + '</div>' +
        '<div class="v">' + L.progressBadge(prog.status) + '</div>' +
        /* ⚠ "Steps done 0 of 9" IS GONE — Implementation 09 QA.
           Its denominator was resources + one per technology format +
           the assessment, so it silently asserted that finishing Web,
           VR and AR were three separate mandatory steps. The three
           strands are reported separately on this page instead, each
           against a denominator that is actually its own. */
        '<div class="k">Last activity</div><div class="v">' +
          (prog.lastActivityAt ? esc(util.fmtDateTime(prog.lastActivityAt)) : 'No activity recorded') + '</div>' +
        '<div class="k">Account</div><div class="v">' +
          (student.status === 'active' ? ui.badge('b-success', 'check', 'Active')
            : ui.badge('b-neutral', 'minus', 'Inactive')) + '</div>' +
        '</div>', null, 'h2') +
      '</div></div></div>';

    return {
      area: 'faculty', faculty: f, tenant: tenant, navKey: 'students',
      title: student.name + ' — ' + e.name, html: html
    };
  };
})();
