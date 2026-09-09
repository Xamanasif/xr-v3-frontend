/* ============================================================
   Unified Functional Platform — public discovery screens.
   Landing · Catalogue · Programme/Department · Course · Experiment
   detail (with explicit technology selection) · Not found.
   ============================================================ */

window.XRSLP = window.XRSLP || {};
XRSLP.screens = XRSLP.screens || {};

(function () {
  'use strict';

  var esc = XRSLP.util.esc;
  var ui = XRSLP.ui;
  var cui = XRSLP.contentUI;
  var data = XRSLP.data;
  var state = XRSLP.state;

  function expHref(id) { return '#/experiment/' + encodeURIComponent(id); }
  function courseHref(id) { return '#/course/' + encodeURIComponent(id); }
  function groupHref(id) { return '#/programme/' + encodeURIComponent(id); }

  /* ============================================================
     WHAT THE INSTITUTION ALREADY HOLDS — Implementation 07.2, rule A.

     "If the same institution requests the same experiment again, they
      can request additional licenses. It should show the existing plan
      when they reselect."

     The re-request itself has always worked: a second approved request
     writes a SECOND access record beside the first and both histories
     stand untouched. What was missing is that no public surface ever
     said so, so an institution re-selecting an experiment it already
     holds could not tell an expansion from an accidental repeat.

     Everything added here is READ-ONLY. Nothing is disabled, hidden,
     pre-filled or blocked because an institution already holds an
     experiment — whether an expansion may also add technology variants
     or change the term is not settled, and a disabled checkbox would
     decide it silently.

     The institution comes from the PROTOTYPE SCENARIO SELECTOR, which
     is not authentication and grants nothing: the catalogue is
     deliberately open to browse before any sign-in and this build has
     no sign-in at all. `state.scenarioTenant()` legitimately returns
     null for a scenario whose institution has not been provisioned yet,
     and every surface below simply renders nothing in that case.
     ============================================================ */

  /* Answered per card rather than precomputed for the page: the read
     model is a lookup over the institution's own records, and the
     catalogue re-renders as the reader types, so a precomputed list
     would only be one more thing to keep in step.
     LIVE records only — an expired record is access history, not access
     the institution has. */
  /* ⚠ THE PROVENANCE TRAVELS WITH THE CHIP, not in a banner.

     This badge asserts knowledge of the visitor on a page that has no
     sign-in, so it has to say where that knowledge came from. It used
     to do that through a bordered callout across the top of the
     results — which is the "large explanatory banner" that dominated
     the most important stakeholder surface in the build.

     The chip now names the institution itself: visible text stays the
     two words a scanner needs, and the full statement is in the
     accessible name and the tooltip, attached to the thing it explains
     rather than floating above sixty cards. */
  function heldChip(experimentId) {
    var inst = state.scenarioTenant();
    if (!inst || !state.tenantHoldsExperiment(inst.id, experimentId)) { return ''; }
    /* §3/§8 — its own class, not a technology badge, and no tooltip
       explaining the prototype requester mechanism. */
    return '<span class="heldstate">' + ui.ic('building', 'sm') + 'Already held' +
      '<span class="sr-only"> by ' + esc(inst.name) + '</span></span>';
  }

  /* The institution those chips refer to, if any of THIS result set is
     held. The catalogue is an explicitly pre-sign-in surface, so a badge
     asserting knowledge of the visitor has to say where the knowledge
     came from on the same screen — the equivalent note previously lived
     only on the experiment detail page. */
  /* §3 — `heldNoteHTML` and `heldInstitutionFor` are gone. They existed
     only to render the requester-scenario mechanism as product copy;
     that explanation belongs in Demo controls, not the catalogue body.
     `heldChip` resolves the requester itself and is unchanged in what it
     computes — only in what it says. */

  /* ============================================================
     THE ACADEMIC CONTEXT, RESOLVED DEFENSIVELY.

     `data.contextOf()` returns `{experiment, course, grouping}` where
     COURSE OR GROUPING MAY BE NULL: the canonical structure is governed
     state now (a Course can be re-parented, and nothing is ever deleted
     but a reference can still fail to resolve), while the published pool
     is a separate collection keyed by `courseId`. Every public surface in
     this file used to read `ctx.grouping.name` straight through, so ONE
     dangling reference threw a TypeError and took the whole screen —
     catalogue, course page or experiment page — down with it.

     Reading the names through this helper degrades a dangling reference
     to a stated "not filed" label instead. That is not cosmetic: a
     PUBLISHED experiment must stay reachable, and a screen that throws
     is the least reachable thing there is.
     ============================================================ */
  var UNFILED_GROUP_LABEL = 'Not filed under a programme / department';

  function ctxOf(expId) {
    var ctx = data.contextOf(expId) || {};
    return {
      experiment: ctx.experiment || null,
      course: ctx.course || null,
      grouping: ctx.grouping || null,
      courseName: ctx.course ? ctx.course.name : 'Course not resolved',
      groupingName: ctx.grouping ? ctx.grouping.name : UNFILED_GROUP_LABEL
    };
  }

  /* ============================================================
     ONE EXPERIMENT COMPONENT — Implementation 08.

     The same experiment used to be rendered by two unrelated card
     systems: `.catcard` in the flat view (which led with a
     Programme › Course line) and `.exprow` in the grouped view, the
     course page and the unfiled group (which had no context line at
     all and put technologies in a right-hand column). Switching view
     therefore changed WHAT the reader learned about an experiment, not
     only how the results were arranged — while the page itself claimed
     the two views showed the same thing.

     There is one anatomy now. The CONTAINER decides the two things that
     legitimately differ: whether the programme / course line is shown
     (redundant inside a course block, needed in a flat list) and what
     heading level the title takes, so the outline mirrors the structure
     it sits in.
     ============================================================ */
  function expItemHTML(e, opts) {
    opts = opts || {};
    var h = opts.heading || 'h3';
    var inSel = !!state.selectionGet(e.id);
    var ctxLine = '';
    if (opts.context) {
      var c = ctxOf(e.id);
      ctxLine = '<div class="xc-ctx">' + esc(c.groupingName) + ' › ' + esc(c.courseName) + '</div>';
    }
    /* §8 — "Already held" is an ACCESS STATE, not a technology. It used
       to sit in the same badge row as Web / VR / AR and read as a fourth
       format. Technologies keep their row; access state gets its own,
       with its own semantics.

       §9 — ONE link, not two. The title anchor is stretched over the
       whole card (see `.expcard h3 a::after`), so the card is clickable
       everywhere while the accessible name stays the experiment's own.
       "View experiment" is a visual cue, not a second competing link. */
    var held = heldChip(e.id);
    return '<li class="expcard">' + ctxLine +
      '<' + h + '><a href="' + expHref(e.id) + '">' + esc(e.name) + '</a></' + h + '>' +
      '<p class="xc-s">' + esc(e.summary) + '</p>' +
      '<div class="xc-f">' + ui.techBadges(e.technologies) + '</div>' +
      (held || inSel
        ? '<div class="xc-state">' + held +
          (inSel ? '<span class="xc-sel">' + ui.ic('check', 'sm') + 'In selection</span>' : '') +
          '</div>'
        : '') +
      '<span class="xc-go" aria-hidden="true">View experiment' + ui.ic('arrowR', 'sm') + '</span>' +
      '</li>';
  }

  /* ---------------- landing ---------------- */
  XRSLP.screens.landing = function () {
    var groupings = data.groupings();
    var groupCards = groupings.map(function (g) {
      var courses = data.coursesInGrouping(g.id);
      var exps = data.experimentsInGrouping(g.id);
      return '<article class="groupcard">' +
        '<div class="gc-kind">Programme / Department</div>' +
        '<h3><a href="' + groupHref(g.id) + '">' + esc(g.name) + '</a></h3>' +
        '<p>' + esc(g.summary) + '</p>' +
        '<div class="gc-foot"><span>' + courses.length + ' ' + XRSLP.util.plural(courses.length, 'course') + '</span>' +
        '<span aria-hidden="true">·</span><span>' + exps.length + ' ' + XRSLP.util.plural(exps.length, 'experiment') + '</span></div>' +
        '</article>';
    }).join('');

    /* Read from the technology table rather than hand-written, so this
       public line cannot drift from the formats the platform actually
       carries. It previously read "AR · VR · Web" and silently dropped
       MR, which STK31-45 retains and the Vendor form offers. */
    var techLabels = data.TECH_ORDER.map(function (t) {
      return data.TECHNOLOGIES[t].label;
    }).join(' · ');

    /* The hero's factual line, DERIVED. It replaces three chips, two of
       which ("Browse before login", "Institutional access model") only
       repeated the lede above them and the journey strip below them.
       These are catalogue figures — what is published, in how much
       structure — and nothing else: no revenue, no usage, no business
       metric of any kind exists in this build. */
    var heroStats = ui.metrics([
      { v: data.experiments().length, k: 'published experiments' },
      { v: data.courses().length, k: 'courses' },
      { v: groupings.length, k: 'programmes / departments' }
    ]);

    var html =
      '<div class="hero">' +
      '<span class="htag">Institutional XR learning</span>' +
      '<h1>Laboratory experiments, delivered as Web, VR, MR and AR simulations</h1>' +
      '<p class="hlede">The XR Simulation Learning Platform hosts simulated laboratory experiments for ' +
      'academic programmes. Institutions browse the published catalogue before any sign-in, choose the ' +
      'experiments and technology formats they need, and request institutional access for their learners.</p>' +
      '<div class="hact">' +
      '<a class="btn pri lg" href="#/catalogue">' + ui.ic('search') + 'Browse catalogue</a>' +
      '<button class="btn sec lg" type="button" id="how-access">How institutional access works</button>' +
      '</div>' +
      '<div class="herostats">' + heroStats +
      '<p class="hform">' + ui.ic('monitor') + 'Experiment formats: ' + esc(techLabels) + '</p>' +
      '</div>' +
      '</div>' +

      '<section class="journey" id="journey" aria-labelledby="journey-h">' +
      '<h2 id="journey-h">How institutional access works</h2>' +
      '<p class="jsub">The catalogue is open to browse. Access to run experiments is granted to institutions ' +
      'through an approved request — adding items to a selection never grants access by itself.</p>' +
      '<div class="jgrid">' +
      '<div class="jstep"><span class="jn">1</span><h3>Browse the catalogue</h3><p>Explore programmes, courses and experiments, with the technology formats each experiment supports.</p></div>' +
      '<div class="jstep"><span class="jn">2</span><h3>Select experiments &amp; technologies</h3><p>Choose the experiments your institution needs and the technology formats for each.</p></div>' +
      '<div class="jstep"><span class="jn">3</span><h3>Submit an institutional request</h3><p>Provide your organisation and contact details, the number of licences, and the access term.</p></div>' +
      '<div class="jstep"><span class="jn">4</span><h3>Approval &amp; activation</h3><p>The platform team reviews the request. After approval — and payment where applicable — access is activated for your institution.</p></div>' +
      '</div>' +
      '</section>' +

      '<section class="landing-groupings" aria-labelledby="lg-h">' +
      /* The "published sample catalogue content" caption used to sit
         here and again in the shell footer. It is said once, in the
         footer, where it belongs to the whole prototype. */
      ui.sectionHead({ title: 'Browse by Programme / Department', id: 'lg-h',
        count: groupings.length,
        desc: 'Every published experiment is filed under a course, and every course under a programme or department.' }) +
      (groupings.length
        ? '<div class="groupcards">' + groupCards + '</div>'
        : '<div class="tablecard">' + ui.emptyState({
            icon: 'book', heading: 'h3',
            title: 'Nothing is published yet',
            body: 'The catalogue is open, but no experiment has been published into it so far. Published ' +
              'content appears here as it reaches the catalogue.'
          }) + '</div>') +
      '</section>';

    return {
      title: 'Discover institutional XR learning',
      html: html,
      navKey: 'home',
      after: function () {
        /* The second CTA opens the real explanation rather than
           repeating it: it moves the reader to the journey strip, which
           on a phone is well below the fold. */
        var btn = document.getElementById('how-access');
        if (btn) {
          btn.addEventListener('click', function () {
            var target = document.getElementById('journey');
            if (target) {
              target.scrollIntoView({ behavior: 'smooth', block: 'start' });
              target.setAttribute('tabindex', '-1');
              target.focus({ preventScroll: true });
            }
          });
        }
      }
    };
  };

  /* ============================================================
     CATALOGUE — Implementation 07.3, correction R01.

     STAKEHOLDER: "the civil engineering has like 4 experiments … It
     should be compiled inside civil engineering … why is it showing?"

     WHAT WAS WRONG. The page rendered the SAME experiments twice: once
     as a count on a "Browse by Programme / Department" card, and again
     immediately below as an "All experiments" wall containing every
     published experiment in the platform, flat, with no structure at
     all. The programme cards therefore promised a hierarchy the page
     then refused to use. Two further defects came out of the audit:

       · the whole programme section carried `hidden` the moment ANY
         filter was set, so filtering DESTROYED the structure instead of
         scoping it — exactly backwards;
       · Course appeared only as escaped text on each card. There was not
         one course link on the page, although `#/course/:id` exists and
         works.

     WHAT IT DOES NOW. Programme / Department → Course → Experiment is
     the primary reading, and A FILTER SCOPES THAT STRUCTURE rather than
     replacing it: the same tree is rendered, narrowed to what matches.
     Course is a real link into its existing route, and the flat wall is
     no longer rendered under the tree at all — it is one of two VIEWS
     the reader chooses between, so the two can never duplicate each
     other on screen.

     WHY THE FLAT VIEW SURVIVES AS A CHOICE. Searching for one
     experiment by name across the whole catalogue is a genuine task,
     and grouping is overhead for it. It is opt-in, never rendered
     beside the tree, and it is not the default.

     No new route is invented here: the headings link into the
     `#/programme/:id` and `#/course/:id` screens that already exist
     further down this file.
     ============================================================ */

  /* Ephemeral filter state (not persisted — a fresh visit starts unfiltered). */
  var catFilters = { q: '', grouping: 'all', tech: {} };

  /* The reading of the results, not a filter — clearing the filters
     leaves it alone, because it is a preference about presentation and
     not something the reader asked the catalogue to narrow.

     ⚠ THAT DISTINCTION IS NOW CARRIED VISUALLY. The view switch used to
     sit inside the filter bar in the same pill styling as the technology
     FILTERS, so two controls with completely different semantics — one
     narrows the data, one only rearranges it — were indistinguishable,
     and "Clear search & filters" deliberately cleared one and not the
     other. It is a segmented control on the results header now, outside
     the filters entirely. */
  var CAT_VIEWS = [
    { id: 'grouped', label: 'By programme' },
    { id: 'list', label: 'Flat list' }
  ];
  var catView = 'grouped';

  /* Which Courses the reader has COLLAPSED. Stored as collapsed-ness
     rather than open-ness so the default (open) needs no seeding and a
     Course created after this page was first drawn is open like every
     other. The results are repainted as the reader types, so without
     this the reader's collapse would be undone by the next character. */
  var catCollapsed = Object.create(null);

  function filtersActive() {
    return catFilters.q.trim() !== '' || catFilters.grouping !== 'all' ||
      Object.keys(catFilters.tech).some(function (k) { return catFilters.tech[k]; });
  }

  /* What is currently narrowing the results, in words. The reader could
     previously see a shrunken catalogue and a "Clear" button with no
     statement of what had been applied. */
  function filterSummaryHTML() {
    var parts = [];
    if (catFilters.q.trim()) { parts.push('search &ldquo;' + esc(catFilters.q.trim()) + '&rdquo;'); }
    if (catFilters.grouping !== 'all') {
      var g = data.grouping(catFilters.grouping);
      parts.push(esc(g ? g.name : catFilters.grouping));
    }
    Object.keys(catFilters.tech).forEach(function (t) {
      if (!catFilters.tech[t]) { return; }
      var def = data.TECHNOLOGIES[t];
      parts.push(esc(def ? def.label : t));
    });
    if (!parts.length) { return ''; }
    return 'Filtered by ' + parts.join(' · ');
  }

  function filteredExperiments() {
    var q = catFilters.q.trim().toLowerCase();
    var activeTech = Object.keys(catFilters.tech).filter(function (k) { return catFilters.tech[k]; });
    return data.experiments().filter(function (e) {
      var ctx = ctxOf(e.id);
      /* A programme filter excludes anything the catalogue cannot place
         IN that programme, which includes an experiment whose grouping
         does not resolve at all. It is not in the chosen programme, so
         it is not a match — it stays reachable through the unfiltered
         view, where it is listed explicitly. */
      if (catFilters.grouping !== 'all' && (!ctx.grouping || ctx.grouping.id !== catFilters.grouping)) { return false; }
      if (activeTech.length) {
        var hasAll = activeTech.every(function (t) { return e.technologies.indexOf(t) !== -1; });
        if (!hasAll) { return false; }
      }
      if (q) {
        var hay = (e.name + ' ' + e.summary + ' ' + ctx.courseName + ' ' + ctx.groupingName).toLowerCase();
        if (hay.indexOf(q) === -1) { return false; }
      }
      return true;
    });
  }

  /* ---- Programme → Course → Experiment over the CURRENT results ----

     Built from the canonical structure OUTWARDS (`data.groupings()`,
     then `data.coursesInGrouping()`) rather than from the experiments
     inwards, so the reading order is the catalogue's own order and does
     not reshuffle itself as the reader types.

     `unfiled` is the load-bearing part. An experiment whose Course does
     not sit under any Programme is still PUBLISHED, and silently
     dropping it would make live content invisible in the one place the
     public is told to look. It is listed in its own group instead, and
     the group says plainly why it is there. */
  /* ⚠ NULL-PROTOTYPE MAPS — 07.3 adversarial fix.
     These are keyed by Course / Programme id. A bare `{}` inherits every
     Object.prototype key, so a Course whose slug is `constructor`,
     `toString`, `valueOf` … resolved to the INHERITED value instead of
     undefined: `byCourse[id] || []` handed back a function and `.map`
     threw inside the count line before any HTML existed. The shell wraps
     every screen render in a try/catch now (js/app.js), so the failure
     mode is an error screen rather than a blank page — but the catalogue
     would still have been unreachable, and unrecoverable from inside the
     product, because a Course id never changes and nothing deletes a
     Course. `Object.create(null)` inherits nothing. */
  function groupResults(list) {
    var byCourse = Object.create(null);
    list.forEach(function (e) {
      if (!byCourse[e.courseId]) { byCourse[e.courseId] = []; }
      byCourse[e.courseId].push(e);
    });

    var placed = Object.create(null);
    var programmes = data.groupings().map(function (g) {
      var courses = data.coursesInGrouping(g.id).map(function (c) {
        placed[c.id] = true;
        return { course: c, experiments: byCourse[c.id] || [] };
      });
      var total = 0;
      courses.forEach(function (node) { total += node.experiments.length; });
      return { grouping: g, courses: courses, total: total };
    });

    var unfiled = list.filter(function (e) { return !placed[e.courseId]; });
    return { programmes: programmes, unfiled: unfiled };
  }

  /* A PUBLIC course block, and not the Super Admin's content-governance
     disclosure row that the catalogue used to reuse verbatim. There, the
     course name was neither a heading nor a link and carried a
     right-aligned count where a description belongs.

     `details` is kept deliberately: it collapses, which is what keeps a
     long course readable at 375px, and it is keyboard operable and
     announced with no script. `scoped` (a filter is active) FORCES every
     rendered Course open — a collapsed Course holding the only match
     would hide the result and let the filter decide what structure the
     reader may see. */
  function courseBlockHTML(node, scoped) {
    var c = node.course;
    var n = node.experiments.length;
    var open = scoped || !catCollapsed[c.id];
    return '<details class="coursebk" data-course="' + esc(c.id) + '"' + (open ? ' open' : '') + '>' +
      '<summary>' + ui.ic('chevron', 'sm cb-x') +
      '<h3>' + esc(c.name) + '</h3>' +
      '<span class="cb-n">' + n + ' ' + XRSLP.util.plural(n, 'experiment') +
      (scoped ? ' matching' : '') + '</span>' +
      '</summary>' +
      '<div class="cb-b">' +
      /* §5 — this read "<Course name> course page", which is developer
         wording. The heading itself cannot become the link: it lives in
         a <summary>, which is already a control, and a link nested in
         one is ambiguous to operate by keyboard. So the explicit-action
         pattern is used instead, identically for every Course, with the
         course named in an accessible label so the link still reads
         correctly out of context. */
      '<div class="cb-head">' +
      '<p class="cb-s">' + esc(c.summary) + '</p>' +
      '<a class="cb-go" href="' + courseHref(c.id) + '">View course' +
      '<span class="sr-only"> ' + esc(c.name) + '</span>' + ui.ic('arrowR', 'sm') + '</a>' +
      '</div>' +
      '<ul class="explist inset">' +
      node.experiments.map(function (e) { return expItemHTML(e, { heading: 'h4' }); }).join('') +
      '</ul>' +
      '</div></details>';
  }

  /* A Programme / Department and everything published under it.
     `idx` only supplies a collision-free heading id — grouping ids are
     platform-authored strings and are not assumed to be usable as
     fragment identifiers. */
  function programmeSectionHTML(node, scoped, idx) {
    var g = node.grouping;
    var withExps = node.courses.filter(function (cn) { return cn.experiments.length; });
    var empties = node.courses.filter(function (cn) { return !cn.experiments.length; });
    var hid = 'cg-h-' + idx;

    /* The counts were a muted trailing clause on the summary paragraph.
       They are the programme's own figures and read as figures now. */
    var metrics = ui.metrics([
      { v: node.total, k: scoped ? 'matching' : 'published' },
      { v: withExps.length, k: XRSLP.util.plural(withExps.length, 'course') }
    ]);

    /* Courses with nothing to show are NAMED, not hidden — a Course is
       real catalogue structure whether or not anything is published in
       it yet, and it has a page the reader can open. They share one
       line rather than getting a block each, so an empty Course never
       outweighs a full one on the page.

       Suppressed while a filter is active, where "nothing published"
       and "nothing matching" would be indistinguishable and the line
       would state the wrong one of the two. */
    var emptyCourseLinks = empties.map(function (cn) {
      return '<a href="' + courseHref(cn.course.id) + '">' + esc(cn.course.name) + '</a>';
    }).join(', ');

    var body;
    if (withExps.length) {
      body = '<div class="ps-b">' +
        withExps.map(function (cn) { return courseBlockHTML(cn, scoped); }).join('') +
        '</div>' +
        (empties.length && !scoped
          ? '<p class="ps-n">Nothing is published yet in: ' + emptyCourseLinks + '.</p>'
          : '');
    } else if (empties.length && !scoped) {
      /* One sentence, not two. Saying "nothing is published here" and
         then listing every course as empty says the same thing twice. */
      body = '<p class="ps-n">Nothing is published yet in ' +
        (empties.length === 1 ? 'the one course listed here: ' : 'any of the courses listed here: ') +
        emptyCourseLinks + '. Experiments appear as they are published.</p>';
    } else {
      body = '<p class="ps-n">No experiment is published under this programme / ' +
        'department yet. It appears here as soon as one is published.</p>';
    }

    return '<section class="progsec" aria-labelledby="' + hid + '">' +
      '<div class="ps-h">' +
      '<h2 id="' + hid + '"><a href="' + groupHref(g.id) + '">' + esc(g.name) + '</a></h2>' +
      '<p class="ps-s">' + esc(g.summary) + '</p>' +
      '<div class="ps-m">' + metrics + '</div>' +
      '</div>' +
      body +
      '</section>';
  }

  /* Published, but not placeable in the structure. See `ctxOf` above for
     why this state is reachable at all; it is rendered rather than
     dropped because published content the public cannot find is worse
     than published content in an oddly-named group.

     It renders as a quiet appendix, not as a peer of Civil Engineering,
     and it says what it is in one clause. The four sentences of
     product-team reasoning that used to explain the decision to the
     public are now this comment. */
  function unfiledSectionHTML(list) {
    return '<section class="progsec unfiled" aria-labelledby="cg-h-unfiled">' +
      '<div class="ps-h"><h2 id="cg-h-unfiled">' + esc(UNFILED_GROUP_LABEL) + '</h2>' +
      '<p class="ps-s">' + list.length + ' published ' + XRSLP.util.plural(list.length, 'experiment') +
      ' whose course does not currently sit in a programme or department.</p></div>' +
      '<div class="ps-b"><ul class="explist">' +
      list.map(function (e) { return expItemHTML(e, { heading: 'h3', context: true }); }).join('') +
      '</ul></div>' +
      '</section>';
  }

  /* Two different absences, said differently. The old empty state
     assumed a filter was active and offered a "Clear search & filters"
     button that would have done nothing on an unfiltered, genuinely
     empty catalogue — which is a legitimate state, because the Content
     Manager publishes INTO this pool. */
  function catEmptyHTML() {
    if (filtersActive()) {
      return ui.emptyState({
        icon: 'search', heading: 'h2',
        title: 'No experiments match',
        body: 'No published experiment matches the current search and filters. Try different words, or clear them.',
        actionsHTML: '<button class="btn sec" type="button" id="cat-clear-empty">Clear search &amp; filters</button>'
      });
    }
    return ui.emptyState({
      icon: 'book', heading: 'h2',
      title: 'Nothing is published yet',
      body: 'The catalogue is open to browse, but no experiment has been published into it so far. ' +
        'Published experiments appear here as they reach the catalogue.',
      actionsHTML: '<a class="btn pri" href="#/">Back to the overview</a>'
    });
  }

  function catResultsHTML() {
    var results = filteredExperiments();
    if (!results.length) { return '<div class="tablecard">' + catEmptyHTML() + '</div>'; }

    if (catView === 'list') {
      /* No reconciliation paragraph between the two views: an experiment
         the catalogue cannot place carries its own "not filed" context
         line here, which says the same thing where it matters. */
      return '<h2 class="sr-only">' + (filtersActive() ? 'Matching experiments' : 'All experiments') + '</h2>' +
        '<ul class="expgrid">' +
        results.map(function (e) { return expItemHTML(e, { heading: 'h3', context: true }); }).join('') +
        '</ul>';
    }

    var grouped = groupResults(results);
    var scoped = filtersActive();
    var sections = [];
    var withoutMatch = 0;
    grouped.programmes.forEach(function (node, i) {
      /* While a filter is active a programme with no match is left out
         and COUNTED, not silently dropped: the line below says how many
         were set aside, so the reader can tell a narrowed catalogue from
         a shrunken one. */
      if (scoped && !node.total) { withoutMatch += 1; return; }
      sections.push(programmeSectionHTML(node, scoped, i));
    });
    if (grouped.unfiled.length) { sections.push(unfiledSectionHTML(grouped.unfiled)); }

    return sections.join('') +
      (withoutMatch
        ? '<p class="ps-n">' + withoutMatch + ' other ' +
          XRSLP.util.plural(withoutMatch, 'programme / department', 'programmes / departments') +
          (withoutMatch === 1 ? ' holds' : ' hold') +
          ' nothing matching the current search and filters.</p>'
        : '');
  }

  /* The result count as FIGURES, at readable contrast, in the results
     header — not a 12.5px trailing clause in the filter bar's footer. */
  /* §2 — the same figures as one line: "6 experiments · 5 courses ·
     2 programmes". `catCountMetrics` is kept because the flat view and
     the repaint path both read it. */
  function catCountLine() {
    var rows = catCountMetrics(true);
    return rows.map(function (r) {
      return '<span><strong>' + r.v + '</strong> ' + esc(r.k) + '</span>';
    }).join('<span class="rb-dot" aria-hidden="true">·</span>');
  }

  function catCountMetrics(raw) {
    var results = filteredExperiments();
    var n = results.length;
    var rows = [{ v: n, k: XRSLP.util.plural(n, 'experiment') + (filtersActive() ? ' matching' : ' published') }];
    if (catView === 'grouped' && n) {
      var grouped = groupResults(results);
      var courses = 0, progs = 0;
      grouped.programmes.forEach(function (node) {
        if (!node.total) { return; }
        progs += 1;
        node.courses.forEach(function (cn) { if (cn.experiments.length) { courses += 1; } });
      });
      if (progs) {
        rows.push({ v: courses, k: XRSLP.util.plural(courses, 'course') });
        rows.push({ v: progs, k: XRSLP.util.plural(progs, 'programme') });
      }
      if (grouped.unfiled.length) {
        rows.push({ v: grouped.unfiled.length, k: 'not filed under a programme' });
      }
    }
    return raw ? rows : ui.metrics(rows);
  }

  /* The same figures as a sentence, for the live region. A screen
     reader is told the result, never asked to parse a layout. */
  function catCountText() {
    var results = filteredExperiments();
    var n = results.length;
    var text = n + ' ' + XRSLP.util.plural(n, 'experiment') + (filtersActive() ? ' matching' : ' published');
    if (catView !== 'grouped' || !n) { return text; }

    var grouped = groupResults(results);
    var courses = 0, progs = 0;
    grouped.programmes.forEach(function (node) {
      if (!node.total) { return; }
      progs += 1;
      node.courses.forEach(function (cn) { if (cn.experiments.length) { courses += 1; } });
    });
    return text +
      (progs ? ' · across ' + courses + ' ' + XRSLP.util.plural(courses, 'course') +
        ' in ' + progs + ' ' + XRSLP.util.plural(progs, 'programme') : '') +
      (grouped.unfiled.length
        ? ' · ' + grouped.unfiled.length + ' not filed under a programme'
        : '');
  }

  XRSLP.screens.catalogue = function () {
    var techInUse = data.technologiesInUse();
    var groupingOptions = '<option value="all"' + (catFilters.grouping === 'all' ? ' selected' : '') + '>All programmes</option>' +
      data.groupings().map(function (g) {
        return '<option value="' + esc(g.id) + '"' + (catFilters.grouping === g.id ? ' selected' : '') + '>' + esc(g.name) + '</option>';
      }).join('');

    var techToggles = techInUse.map(function (t) {
      var def = data.TECHNOLOGIES[t];
      var pressed = !!catFilters.tech[t];
      return '<button type="button" class="ttog" data-tech="' + esc(t) + '" aria-pressed="' + pressed + '">' +
        (pressed ? ui.ic('check') : '') + esc(def.label) + '</button>';
    }).join('');

    var viewToggles = CAT_VIEWS.map(function (v) {
      var pressed = catView === v.id;
      /* A toggle button, so the state is `aria-pressed` — not
         `aria-current`, which belongs to navigation. The segmented
         control's own styling is keyed off the same attribute. */
      return '<button type="button" class="segi" data-view="' + esc(v.id) + '"' +
        ' aria-pressed="' + pressed + '">' + esc(v.label) + '</button>';
    }).join('');

    var summary = filterSummaryHTML();

    var html =
      ui.phead('Catalogue', 'Published experiments, open to browse before any sign-in — organised by ' +
        'programme / department, then course.') +
      '<div class="filterbar">' +
      '<div class="fb-row">' +
      '<div class="fb-search"><label class="fb-label" for="cat-q">Search</label>' +
      '<div class="searchbox">' + ui.ic('search') +
      '<input type="search" id="cat-q" placeholder="Search experiments, courses, programmes" value="' + esc(catFilters.q) + '"></div></div>' +
      '<div class="fb-sel"><label class="fb-label" for="cat-grouping">Programme / Department</label>' +
      '<select id="cat-grouping">' + groupingOptions + '</select></div>' +
      /* Suppressed rather than rendered empty when nothing is published:
         a labelled control group with no controls in it is furniture. */
      (techInUse.length
        ? '<div class="fb-tech"><span class="fb-label" id="tech-label">Technology</span>' +
          '<div class="techtoggles" role="group" aria-labelledby="tech-label">' + techToggles + '</div></div>'
        : '') +
      '</div>' +
      '<div class="fb-foot" id="cat-foot"' + (summary ? '' : ' hidden') + '>' +
      '<span class="fb-count" id="cat-filtersum">' + summary + '</span>' +
      '<button class="btn sm sec fb-clear" type="button" id="cat-clear">Clear search &amp; filters</button>' +
      '</div></div>' +
      /* §2 — this was a "RESULTS" heading over three stat tiles, which
         made a catalogue read as an analytics report. The counts are
         useful, so they stay — as one compact line of catalogue
         metadata that does not compete with the content.

         §3 — the paragraph explaining that "Already held" comes from the
         requester selected in Prototype controls is gone. That is
         prototype mechanics; it belongs in Demo controls, not in the
         catalogue body. The badge itself still appears, on the one
         Experiment it applies to, and says what it means there. */
      '<div class="resbar">' +
      '<p class="rb-meta" id="cat-count">' + catCountLine() + '</p>' +
      /* §4 — Programme / department browsing is the primary model and
         the default. The switch used to be two equal pills under a
         "VIEW" label, which asked a first-time visitor to choose an
         information architecture before browsing. It is now a small
         secondary control. */
      '<div class="rb-a viewswitch" role="group" aria-label="Catalogue layout">' + viewToggles + '</div>' +
      '</div>' +
      '<div id="cat-results">' + catResultsHTML() + '</div>';

    /* A full re-render replaces the whole document body, so it is used
       only where a control's own pressed state has to change with it —
       the programme select, the technology toggles, the view switch and
       Clear. */
    function repaintAll(keepCaret) {
      /* A pending debounce belongs to the markup this render replaces.
         Letting it land would re-bind the results a second time on top
         of the listeners the new render attaches. */
      if (searchTimer) { window.clearTimeout(searchTimer); searchTimer = null; }
      var caretPos = null;
      var input = document.getElementById('cat-q');
      if (keepCaret && input) { caretPos = input.selectionStart; }
      XRSLP.render(true);
      if (keepCaret) {
        var el2 = document.getElementById('cat-q');
        if (el2) {
          el2.focus();
          try { el2.setSelectionRange(caretPos, caretPos); } catch (e) { /* not critical */ }
        }
      }
      ui.announce(catCountText() + '.');
    }

    /* ⚠ THE SEARCH BOX IS NOT A FULL RE-RENDER, AND IT IS DEBOUNCED.
       Every keystroke used to rebuild the entire application root —
       prototype strip, header, main and footer — and fire the live
       region once per character, which for a screen-reader or switch
       user is the whole page being replaced mid-word. Only the results,
       the count and the filter summary depend on the query, so only
       those are rewritten, and only once the reader stops typing. */
    var searchTimer = null;
    function repaintResults() {
      /* The reader has navigated away with a keystroke still in flight.
         The repaint belongs to a screen that is no longer on the page,
         and announcing a catalogue count over an unrelated screen would
         be worse than doing nothing. */
      var box = document.getElementById('cat-results');
      if (!box) { return; }
      box.innerHTML = catResultsHTML();
      var count = document.getElementById('cat-count');
      if (count) { count.innerHTML = catCountLine(); }
      var sum = document.getElementById('cat-filtersum');
      var foot = document.getElementById('cat-foot');
      var text = filterSummaryHTML();
      if (sum) { sum.innerHTML = text; }
      if (foot) { foot.hidden = !text; }
      bindResults();
      ui.wireInfoTips(box);
      ui.announce(catCountText() + '.');
    }

    /* Everything inside `#cat-results` that carries a listener. Called
       once on first render and again after every scoped repaint, so a
       control never silently stops working. */
    function bindResults() {
      /* Remember a collapsed Course across the repaint that typing in
         the search box causes.

         ⚠ `toggle` ALSO FIRES FOR THE STATE THE RENDER ITSELF JUST
         PRODUCED. Setting `open` through innerHTML queues a toggle task
         in the browser, and that task lands after this function has
         attached the listener — so a naive handler reads the markup back
         as if the reader had clicked it. The consequence was real and
         one-directional: a filter renders every matching Course open,
         that echo deleted the reader's collapse, and clearing the filter
         re-expanded a Course they had shut.

         So the state this render produced is captured first, and a
         toggle that merely repeats it is ignored. Only a change the
         reader actually made is written down. */
      Array.prototype.slice.call(document.querySelectorAll('details.coursebk[data-course]')).forEach(function (d) {
        var lastOpen = d.open;
        d.addEventListener('toggle', function () {
          if (d.open === lastOpen) { return; }
          lastOpen = d.open;
          var cid = d.getAttribute('data-course');
          if (d.open) { delete catCollapsed[cid]; } else { catCollapsed[cid] = true; }
        });
      });
      var clearEmpty = document.getElementById('cat-clear-empty');
      if (clearEmpty) { clearEmpty.addEventListener('click', clearAll); }
    }

    function clearAll() {
      catFilters = { q: '', grouping: 'all', tech: {} };
      repaintAll(false);
      var qi = document.getElementById('cat-q');
      if (qi) { qi.focus(); }
    }

    return {
      title: 'Catalogue',
      html: html,
      navKey: 'catalogue',
      after: function () {
        var q = document.getElementById('cat-q');
        if (q) {
          q.addEventListener('input', function () {
            catFilters.q = q.value;
            if (searchTimer) { window.clearTimeout(searchTimer); }
            searchTimer = window.setTimeout(function () {
              searchTimer = null;
              repaintResults();
            }, 250);
          });
        }
        var sel = document.getElementById('cat-grouping');
        if (sel) {
          sel.addEventListener('change', function () {
            catFilters.grouping = sel.value;
            repaintAll(false);
            var again = document.getElementById('cat-grouping');
            if (again) { again.focus(); }
          });
        }
        /* Scoped to the TECHNOLOGY toggles. The view switch used to
           share the `.ttog` class for its styling, and a bare `.ttog`
           selector bound it to the technology handler — which read a
           null `data-tech` and filtered the catalogue down to nothing.
           The two controls no longer share a class at all. */
        Array.prototype.slice.call(document.querySelectorAll('.ttog[data-tech]')).forEach(function (btn) {
          btn.addEventListener('click', function () {
            var t = btn.getAttribute('data-tech');
            catFilters.tech[t] = !catFilters.tech[t];
            repaintAll(false);
            var again = document.querySelector('.ttog[data-tech="' + t + '"]');
            if (again) { again.focus(); }
          });
        });
        Array.prototype.slice.call(document.querySelectorAll('.segi[data-view]')).forEach(function (btn) {
          btn.addEventListener('click', function () {
            var v = btn.getAttribute('data-view');
            if (catView === v) { return; }
            catView = v;
            repaintAll(false);
            var again = document.querySelector('.segi[data-view="' + v + '"]');
            if (again) { again.focus(); }
          });
        });
        bindResults();
        var clearBtn = document.getElementById('cat-clear');
        if (clearBtn) { clearBtn.addEventListener('click', clearAll); }
      }
    };
  };

  /* ---------------- programme / department ---------------- */
  XRSLP.screens.programme = function (params) {
    var g = data.grouping(params.id);
    if (!g) { return XRSLP.screens.notFound(); }
    var courses = data.coursesInGrouping(g.id);
    var expCount = data.experimentsInGrouping(g.id).length;

    var cards = courses.map(function (c) {
      var exps = data.experimentsInCourse(c.id);
      var techUnion = {};
      exps.forEach(function (e) { e.technologies.forEach(function (t) { techUnion[t] = true; }); });
      return '<article class="groupcard">' +
        '<div class="gc-kind">Course</div>' +
        '<h3><a href="' + courseHref(c.id) + '">' + esc(c.name) + '</a></h3>' +
        '<p>' + esc(c.summary) + '</p>' +
        '<div class="gc-foot"><span>' + exps.length + ' ' + XRSLP.util.plural(exps.length, 'experiment') + '</span>' +
        (exps.length ? '<span aria-hidden="true">·</span>' + ui.techBadges(Object.keys(techUnion)) : '') + '</div>' +
        '</article>';
    }).join('');

    var html =
      ui.crumbs([{ label: 'Catalogue', href: '#/catalogue' }, { label: g.name }]) +
      ui.phead(g.name, ui.metrics([
        { v: courses.length, k: XRSLP.util.plural(courses.length, 'course') },
        { v: expCount, k: XRSLP.util.plural(expCount, 'published experiment') }
      ])) +
      '<p class="plede">' + esc(g.summary) + '</p>' +
      '<section aria-labelledby="pc-h">' +
      ui.sectionHead({ title: 'Courses', id: 'pc-h', count: courses.length,
        desc: 'Every published experiment in this programme / department is filed under one of these courses.' }) +
      /* A Programme with no Courses is a real, reachable state — the
         platform can add one before any Course sits in it — so the page
         says so rather than rendering an empty container. */
      (courses.length
        ? '<div class="coursecards">' + cards + '</div>'
        : '<div class="tablecard">' + ui.emptyState({
            icon: 'book', heading: 'h3', title: 'No course is listed here yet',
            body: 'This programme / department has been added to the catalogue, but no course has been ' +
              'published under it so far. Published experiments appear here as they reach the catalogue.',
            actionsHTML: '<a class="btn pri" href="#/catalogue">Browse the whole catalogue</a>'
          }) + '</div>') +
      '</section>';

    return { title: g.name, html: html, navKey: 'catalogue' };
  };

  /* ---------------- course ---------------- */
  XRSLP.screens.course = function (params) {
    var c = data.course(params.id);
    if (!c) { return XRSLP.screens.notFound(); }
    var g = data.grouping(c.groupingId);
    var exps = data.experimentsInCourse(c.id);

    /* The parent Programme / Department may not resolve — see `ctxOf`.
       The Course page still stands on its own: the crumb and the meta
       line simply stop claiming a parent this build cannot name, rather
       than the screen throwing on `g.name` and rendering nothing. */
    var crumbItems = [{ label: 'Catalogue', href: '#/catalogue' }];
    if (g) { crumbItems.push({ label: g.name, href: groupHref(g.id) }); }
    crumbItems.push({ label: c.name });

    var html =
      ui.crumbs(crumbItems) +
      ui.phead(c.name, esc(g ? g.name : UNFILED_GROUP_LABEL)) +
      '<p class="plede">' + esc(c.summary) + '</p>' +
      '<section aria-labelledby="cx-h">' +
      ui.sectionHead({ title: 'Experiments', id: 'cx-h', count: exps.length,
        desc: 'Open an experiment for its learning outcomes, technology formats and device requirements.' }) +
      (exps.length
        ? '<ul class="explist">' +
          exps.map(function (e) { return expItemHTML(e, { heading: 'h3' }); }).join('') + '</ul>'
        : '<div class="tablecard">' + ui.emptyState({
            icon: 'flask', heading: 'h3', title: 'No experiment is published in this course yet',
            body: 'This course exists in the catalogue, but nothing has been published under it so far. ' +
              'Experiments appear here once they are published.',
            /* Back to the parent when there is one to go back to;
               otherwise the catalogue, which lists this course in its
               "not filed" group. Never a link built from a null. */
            actionsHTML: g
              ? '<a class="btn pri" href="' + groupHref(g.id) + '">Back to ' + esc(g.name) + '</a>'
              : '<a class="btn pri" href="#/catalogue">Back to the catalogue</a>'
          }) + '</div>') +
      '</section>';

    return { title: c.name, html: html, navKey: 'catalogue' };
  };

  /* The existing plan, shown while the institution is re-selecting.

     ONE ROW PER ACCESS RECORD, never a blended summary. Two records
     carrying the same experiment have their own technologies, their own
     term and their own licence quantity, and one can expire while the
     other is still running — a single "current plan" line would be true
     of neither of them. Expired records are listed too: they are real
     access history and the term badge says plainly that they are
     expired.

     ⚠ THIS BELONGS IN THE MAIN COLUMN, not the decision rail. In the
     360px rail it stacked a kicker, a paragraph, a block per record, an
     expired-record caveat and a prototype note ABOVE the rail's own
     title and its primary button, which routinely made the rail the
     tallest column on the page — at which point `position:sticky` can
     never engage and the decision scrolls away. */
  function heldAccessCardHTML(inst, rows) {
    var anyExpired = rows.some(function (row) { return !row.live; });
    var anyLive = rows.some(function (row) { return row.live; });

    var recs = rows.map(function (row) {
      var rec = row.record;
      var termDef = data.term(rec.term);
      var alloc = row.allocation;
      return '<li class="heldrec">' +
        /* The card header opened with `ACC-001`, so the first thing an
           institution read about its own access was a key. The term and
           its state lead now; the reference sits at the end of the
           header, muted, still exact. */
        '<div class="hr-h">' + ui.termBadge(row.termState) +
        '<span class="hr-term">' + esc(termDef ? termDef.label : rec.term) +
        (rec.endsOn ? ' · until ' + esc(XRSLP.util.fmtDate(rec.endsOn)) : '') + '</span>' +
        '</div>' +
        '<div class="hr-t">' + ui.techBadges(row.technologies) + '</div>' +
        /* Licences, and said so. `allocation.approved` is the licence
           quantity the Super Admin approved on this record — it is an
           allocation figure and is never a count of students. */
        ui.metrics([
          { v: alloc.approved, k: 'licences approved' },
          { v: alloc.assigned, k: 'assigned' },
          { v: alloc.remaining, k: 'remaining' }
        ]) +
        '</li>';
    }).join('');

    return ui.card(
      anyLive
        ? 'Access ' + esc(inst.name) + ' already holds'
        /* EVERY record has expired. Saying "already holds" there would be
           plainly false — the institution held it, and holds nothing
           now. The records are still listed, because the history is real
           and is exactly what makes a new request an expansion rather
           than a first purchase. */
        : 'Access ' + esc(inst.name) + ' has held before',
      '<p class="chelp">' + rows.length + ' ' + XRSLP.util.plural(rows.length, 'approval') +
      ' covering this experiment, listed separately. Requesting it again asks for ' +
      '<strong>additional licences</strong> alongside what is already in place — it does not replace, ' +
      'reduce or end any of it.</p>' +
      '<ul class="heldrecs">' + recs + '</ul>' +
      (anyExpired
        ? '<p class="cardfoot">Access shown as <strong>Expired</strong> is listed because it is part of ' +
          'this institution&rsquo;s access history. While it is expired it grants nothing.</p>'
        : '') +
      /* §3 — cut to one clause. It stays inside `protoNote`, which marks
         it as prototype scaffolding rather than product copy: this panel
         names an institution on a page with no sign-in, and saying why
         is an honesty requirement, not an explanation of mechanics. */
      ui.protoNote('Requester chosen in <strong>Prototype controls</strong> \u2014 ' +
        'this build has no sign-in.'),
      rows.length + ' ' + XRSLP.util.plural(rows.length, 'record'), 'h2');
  }

  /* ---------------- experiment detail ---------------- */
  XRSLP.screens.experiment = function (params) {
    var ctx = ctxOf(params.id);
    /* Not published — or not an experiment at all. `data.contextOf()`
       resolves against the PUBLISHED pool only, which is what stops a
       hand-typed hash route from reaching a draft. */
    if (!ctx.experiment) { return XRSLP.screens.notFound(); }
    var e = ctx.experiment;
    var selItem = state.selectionGet(e.id);
    var techs = data.sortTech(e.technologies);

    /* Rule A, the informational half. Both are empty for a visitor the
       prototype cannot place in any institution, and the card below then
       renders nothing at all rather than an empty container. */
    var inst = state.scenarioTenant();
    var held = inst ? state.tenantAccessForExperiment(inst.id, e.id) : [];
    /* Access that is STILL RUNNING — a different question from whether
       any record exists. An expired record is real history worth
       showing, but it is not something a new request "adds to". */
    var heldLive = held.some(function (row) { return row.live; });
    var heldCard = held.length ? heldAccessCardHTML(inst, held) : '';

    /* The shared ordered list, which numbers the outcomes and renders no
       tick. A green check is this product's ACHIEVED signal — it marks a
       resolved support report and an approved decision — and on a
       pre-login catalogue page one per outcome implied the visitor had
       reached outcomes the experiment merely intends. */
    var outcomes = cui.outcomesList(e.outcomes,
      'No learning outcomes are recorded for this experiment yet.');

    /* ============================================================
       R13 — THE PUBLISHED PREVIEW VIDEO.

       ⚠ SECURITY-ADJACENT. A preview must never be visible publicly
       before publication.

       `publicShape()` DOES carry `previewVideo` (js/state.js) — that
       projection is the publication boundary, and `publishedPool()` maps
       only PUBLISHED records through it. An earlier comment here said
       the opposite and used it to justify the second read below; that
       was wrong, and it is corrected rather than built on.

       The second read is kept anyway, as defence in depth rather than
       as a necessity. Two independent gates stand between a Vendor's
       draft and this page:

         1. the experiment is only resolvable at all while its record is
            PUBLISHED (`publishedPool()` filters on exactly that), which
            is what makes a hand-typed hash route land on Not found;
         2. this check, which refuses to read the record unless the
            record itself says PUBLISHED.

       Gate 1 alone is enough today. It is deliberately not relied on: it
       lives in another module, it is a lookup by id in a pool this
       screen does not own, and the cost of it ever changing is a
       Vendor's unreleased preview link on an open, pre-sign-in page.

       There is no leak through the version workflow either — a later
       version is a `contentVersions[]` row and `releaseVersion()` never
       writes `previewVideo`, so what is shown is the video of the
       published record and nothing in flight.
       ============================================================ */
    var pubRec = state.contentRecord(e.id);
    if (!pubRec || pubRec.status !== state.CONTENT_STATUS.PUBLISHED) { pubRec = null; }

    /* A LINK REFERENCE, not an upload and not a player. The prototype
       stores no bytes and streams nothing.

       ⚠ NO IMAGERY IS FABRICATED HERE, and none should be. Where no
       preview exists — which is every seeded experiment — the frame is a
       deliberately neutral surface tinted with the accent of the
       technology this experiment already carries, saying only that
       nothing was supplied. It used to be a 170px DASHED box, and a
       dashed outline is this product's own convention for prototype
       scaffolding, so the resting state of every catalogue page read as
       unfinished rather than as a designed empty state. */
    var pvLink = cui.previewVideoHTML(pubRec, { publicView: true, emptyHTML: '' });
    var previewHTML =
      '<div class="pvframe t-' + esc(techs[0] || 'web') + '">' +
      '<span class="pv-mark">' + ui.ic('play', 'lg') + '</span>' +
      (pvLink ? pvLink : '<p class="pv-empty">No preview supplied</p>') +
      '</div>' +
      '<p class="pv-cap">' + (pvLink
        ? 'The preview opens the video where the published content hosts it. This prototype does not host, ' +
          'stream or upload video.'
        : 'A preview appears here when the published content record carries a preview link. This prototype ' +
          'does not host, stream or upload video.') + '</p>';

    /* THE PROCUREMENT QUESTION, ANSWERED. The card was titled
       "technologies & device requirements" and rendered only
       `def.device`; `deliveryLabel` and `requirement` — the two strings
       that actually tell an institution whether it can run this, and
       that the Student's own screen already shows — were never public. */
    var reqRows = '<ul class="techreq">' + techs.map(function (t) {
      var def = data.TECHNOLOGIES[t];
      /* The badge already carries the short label, so the full name is
         printed only where it says something more: `def.name` for Web is
         literally "Web", and rendering both unconditionally produced
         "Web Web". */
      return '<li>' + ui.fmtBadge(t) +
        '<div class="tr-b">' +
        (def.name !== def.label ? '<div class="tr-n">' + esc(def.name) + '</div>' : '') +
        '<div class="tr-d">' + esc(def.deliveryLabel) + '</div>' +
        '<div class="tr-r">' + esc(def.requirement) + '</div></div></li>';
    }).join('') + '</ul>';

    /* THE RAIL CARRIES THE DECISION AND NOTHING ELSE. The full
       technology detail is in the card above; the picker references it
       instead of repeating the same device sentence a second time. */
    var panelHTML;
    if (selItem) {
      panelHTML =
        '<aside class="accesspanel insel" aria-labelledby="ap-h">' +
        '<div class="ap-k" id="ap-h">Institutional access</div>' +
        '<div class="ap-t">' + ui.ic('check') + ' In your selection</div>' +
        '<div class="ap-sub">Selected technologies: ' + ui.techBadges(selItem.technologies) +
        (heldLive
          ? '<br>The request this selection prepares would add licences to the access listed on this page.'
          : held.length
          ? '<br>The access listed on this page has expired, so this selection prepares a fresh request ' +
            'rather than an addition.'
          : '') + '</div>' +
        '<div class="ap-act">' +
        '<a class="btn pri blk" href="#/selection">View selection</a>' +
        '<button class="btn sec blk" type="button" id="exp-remove">Remove from selection</button>' +
        '</div>' +
        '<p class="ap-note">Technologies can be adjusted on the selection page. A selection prepares an ' +
        'institutional request — it does not grant access.</p>' +
        '</aside>';
    } else {
      var picks = techs.map(function (t) {
        var def = data.TECHNOLOGIES[t];
        return '<div class="tp-row"><input type="checkbox" id="tech-' + esc(t) + '" value="' + esc(t) + '">' +
          '<div class="tp-body"><label class="tp-l" for="tech-' + esc(t) + '">' +
          ui.fmtBadge(t) + (def.name !== def.label ? esc(def.name) : '') + '</label></div></div>';
      }).join('');
      panelHTML =
        '<aside class="accesspanel" aria-labelledby="ap-h">' +
        '<div class="ap-k" id="ap-h">Institutional access</div>' +
        '<div class="ap-t">Select technologies</div>' +
        '<div class="ap-sub">Choose at least one technology format for this experiment.' +
        (held.length
          ? ' Every format stays selectable, including any the institution does not hold today.'
          : '') + '</div>' +
        '<fieldset class="fgroup"><legend class="sr-only">Available technologies</legend>' +
        '<div class="techpick compact">' + picks + '</div>' +
        '<div id="tech-err"></div></fieldset>' +
        '<p class="ap-x">Delivery mode and device requirements for each format are listed under ' +
        '<strong>Technology formats</strong>.</p>' +
        '<div class="ap-act">' +
        /* The label names what a second selection of a held experiment
           actually is. The control itself is unchanged — it adds to the
           selection and nothing more — which is why the note below it
           still says, in both cases, that a request is what grants
           access. */
        '<button class="btn pri blk" type="button" id="exp-add">' + ui.ic('basket') +
        /* "Additional" is only true of access that is still running. An
           institution whose every record has expired is not adding to
           anything — it is requesting the experiment again. */
        (heldLive ? 'Request additional licences' : 'Add to selection') + '</button>' +
        '</div>' +
        '<p class="ap-note">Institutional access is granted through an approved request. Your selection prepares ' +
        'that request — adding to it does not grant access.' +
        (held.length
          ? ' Nothing is requested until the institutional request is submitted, and the access already held ' +
            'is unaffected either way.'
          : '') + '</p>' +
        '</aside>';
    }

    /* Only the levels that actually resolve become crumbs — an
       unresolved parent is dropped from the trail rather than rendered
       as a link into a page that cannot be built. */
    var crumbItems = [{ label: 'Catalogue', href: '#/catalogue' }];
    if (ctx.grouping) { crumbItems.push({ label: ctx.grouping.name, href: groupHref(ctx.grouping.id) }); }
    if (ctx.course) { crumbItems.push({ label: ctx.course.name, href: courseHref(ctx.course.id) }); }
    crumbItems.push({ label: e.name });

    var html =
      ui.crumbs(crumbItems) +
      '<div class="phero">' +
      '<div class="ph-main">' +
      /* Its own eyebrow class. This line was marked up as `.pmeta`,
         whose only rule in the stylesheet is `.phead .pmeta` — a
         selector that never matched here, so the context line rendered
         at full body size in full black and competed with the h1
         directly beneath it. */
      '<div class="ph-eyebrow">' + esc(ctx.groupingName) + ' <span aria-hidden="true">›</span> ' +
      esc(ctx.courseName) + '</div>' +
      '<h1>' + esc(e.name) + '</h1>' +
      '<p class="ph-lede">' + esc(e.description) + '</p>' +
      '<div class="ph-tags">' + ui.techBadges(e.technologies) + '</div>' +
      /* Implementation 06 — the version the catalogue is actually
         showing. It changes only when the Content Manager first
         publishes, or the Super Admin RELEASES a later version. A
         candidate anywhere in the version workflow never appears.

         It is provenance, not a fifth technology format: it used to sit
         inline with the badges in matching pill styling and read as one
         of them. */
      (e.versionLabel
        ? '<p class="ph-prov">' + ui.ic('layers', 'sm') + 'Published version ' + esc(e.versionLabel) + '</p>'
        : '') +
      '<div class="stack ph-cards">' +
      ui.card('Learning outcomes', outcomes,
        e.outcomes.length + ' ' + XRSLP.util.plural(e.outcomes.length, 'outcome'), 'h2') +
      ui.card('Technology formats &amp; device requirements',
        '<p class="chelp">Each format is a separate way to run the same experiment. An institution requests ' +
        'the formats it can support, and the requirement below is what its learners need.</p>' + reqRows,
        techs.length + ' ' + XRSLP.util.plural(techs.length, 'format'), 'h2') +
      ui.card('Preview', previewHTML, null, 'h2') +
      heldCard +
      '</div></div>' +
      panelHTML +
      '</div>';

    return {
      title: e.name,
      html: html,
      navKey: 'catalogue',
      after: function () {
        var addBtn = document.getElementById('exp-add');
        if (addBtn) {
          addBtn.addEventListener('click', function () {
            var chosen = Array.prototype.slice.call(
              document.querySelectorAll('.techpick input:checked')
            ).map(function (i) { return i.value; });
            var errBox = document.getElementById('tech-err');
            /* The write point's own guard: `state.selectionAdd` refuses
               an empty technology list, and this stops the reader from
               reaching it by accident. Both halves stay. */
            if (!chosen.length) {
              errBox.innerHTML = '<div class="ferr" role="alert">' + ui.ic('alertCirc', 'sm') +
                'Select at least one technology before adding this experiment.</div>';
              var first = document.querySelector('.techpick input');
              if (first) { first.focus(); }
              return;
            }
            errBox.innerHTML = '';
            state.selectionAdd(e.id, chosen);
            ui.toast(e.name + ' added to your selection.');
            XRSLP.render(true);
            ui.focusMain(true);
          });
        }
        var removeBtn = document.getElementById('exp-remove');
        if (removeBtn) {
          removeBtn.addEventListener('click', function () {
            state.selectionRemove(e.id);
            ui.toast(e.name + ' removed from your selection.', 'info');
            XRSLP.render(true);
            ui.focusMain(true);
          });
        }
      }
    };
  };

  /* ---------------- not found ---------------- */
  XRSLP.screens.notFound = function () {
    var html =
      ui.phead('Page not found') +
      '<div class="tablecard">' +
      ui.emptyState({
        icon: 'alertCirc',
        title: 'This page does not exist',
        body: 'The address may be incomplete, or it may point at a part of the platform that is not part of this prototype.',
        actionsHTML: '<a class="btn pri" href="#/">Go to the landing page</a>' +
          '<a class="btn sec" href="#/catalogue">Browse the catalogue</a>'
      }) + '</div>';
    return { title: 'Page not found', html: html, navKey: null };
  };
})();
