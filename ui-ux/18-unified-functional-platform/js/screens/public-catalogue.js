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
     catalogue re-renders on every keystroke of the search box, so a
     precomputed list would only be one more thing to keep in step.
     LIVE records only — an expired record is access history, not access
     the institution has. */
  function heldChip(experimentId) {
    var inst = state.scenarioTenant();
    if (!inst || !state.tenantHoldsExperiment(inst.id, experimentId)) { return ''; }
    return ui.badge('b-outline', 'building', 'Already held');
  }

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

  /* ---------------- landing ---------------- */
  XRSLP.screens.landing = function () {
    var groupCards = data.groupings().map(function (g) {
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
      '<div class="herofacts">' +
      '<span class="hf">' + ui.ic('monitor') + esc(techLabels) + ' experiment formats</span>' +
      '<span class="hf">' + ui.ic('search') + 'Browse before login</span>' +
      '<span class="hf">' + ui.ic('building') + 'Institutional access model</span>' +
      '</div>' +
      '</div>' +

      '<section class="journey" id="journey" aria-labelledby="journey-h">' +
      '<h2 id="journey-h">How institutional access works</h2>' +
      '<p class="jsub">The catalogue is open to browse. Access to run experiments is granted to institutions ' +
      'through an approved request — adding items to a selection never grants access by itself.</p>' +
      '<div class="jgrid">' +
      '<div class="jstep"><span class="jn">1</span><h3>Browse the catalogue</h3><p>Explore programmes, courses and experiments, with the technology formats each experiment supports.</p></div>' +
      '<div class="jstep"><span class="jn">2</span><h3>Select experiments &amp; technologies</h3><p>Choose the experiments your institution needs and the technology formats for each.</p></div>' +
      '<div class="jstep"><span class="jn">3</span><h3>Submit an institutional request</h3><p>Provide your organisation and contact details, the number of users, and the access term.</p></div>' +
      '<div class="jstep"><span class="jn">4</span><h3>Approval &amp; activation</h3><p>The platform team reviews the request. After approval — and payment where applicable — access is activated for your institution.</p></div>' +
      '</div>' +
      '</section>' +

      '<section class="landing-groupings" aria-labelledby="lg-h">' +
      '<h2 id="lg-h">Browse by Programme / Department</h2>' +
      '<p class="jsub">Published sample catalogue content in this prototype.</p>' +
      '<div class="groupcards">' + groupCards + '</div>' +
      '</section>';

    return {
      title: 'Discover institutional XR learning',
      html: html,
      navKey: 'home',
      after: function () {
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
     not something the reader asked the catalogue to narrow. */
  var CAT_VIEWS = [
    { id: 'grouped', label: 'By programme' },
    { id: 'list', label: 'Flat list' }
  ];
  var catView = 'grouped';

  /* Which Courses the reader has COLLAPSED. Stored as collapsed-ness
     rather than open-ness so the default (open) needs no seeding and a
     Course created after this page was first drawn is open like every
     other. The catalogue re-renders on every keystroke of the search
     box, so without this the reader's collapse would be undone by the
     next character they typed. */
  var catCollapsed = Object.create(null);

  function filtersActive() {
    return catFilters.q.trim() !== '' || catFilters.grouping !== 'all' ||
      Object.keys(catFilters.tech).some(function (k) { return catFilters.tech[k]; });
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
     undefined: `byCourse[id] || []` handed back a function, `.map` threw
     inside the count line before any HTML existed, and `render()` has no
     try/catch — so the whole catalogue went blank. Worse, it was
     unrecoverable from inside the product, because a Course id never
     changes and nothing deletes a Course. `Object.create(null)` inherits
     nothing. */
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

  /* One experiment inside a Course. ONE renderer, used by both the
     catalogue tree and the Course screen, so an experiment reads
     identically wherever the structure puts it and the two cannot
     drift apart. `li`, because in both places it is one item in a list
     of the experiments a Course holds — `ul[class]` is already stripped
     of markers and padding by the base reset, so the list costs nothing
     visually and gives a screen reader the count. */
  function expRowHTML(e) {
    var inSel = !!state.selectionGet(e.id);
    return '<li class="exprow">' +
      '<div class="xr-body">' +
      '<h3><a href="' + expHref(e.id) + '">' + esc(e.name) + '</a></h3>' +
      '<p>' + esc(e.summary) + '</p>' +
      '</div>' +
      '<div class="xr-side">' +
      '<div class="xr-tech">' + ui.techBadges(e.technologies) + '</div>' +
      heldChip(e.id) +
      (inSel ? '<span class="cc-insel">' + ui.ic('check', 'sm') + 'In selection</span>' : '') +
      '</div></li>';
  }

  /* A Course, with its experiments compiled inside it — the shape the
     stakeholder asked for. `details` collapses, which is what keeps the
     tree readable at 375px and at catalogue sizes this prototype does
     not seed.

     `scoped` (a filter is active) FORCES every rendered Course open. A
     collapsed Course holding the only match would hide the result and
     reintroduce the original defect wearing a different hat: the filter
     would once again be deciding what structure the reader may see. */
  function courseBlockHTML(node, scoped) {
    var c = node.course;
    var n = node.experiments.length;
    var open = scoped || !catCollapsed[c.id];
    return '<details class="canon" data-course="' + esc(c.id) + '"' + (open ? ' open' : '') + '>' +
      '<summary>' + ui.ic('book', 'sm') +
      '<span class="cn-n">' + esc(c.name) + '</span>' +
      '<span class="cn-c">' + n + ' ' + XRSLP.util.plural(n, 'experiment') +
      (scoped ? ' matching' : '') + '</span>' +
      '</summary>' +
      '<div class="cn-b" style="padding:12px 14px 14px">' +
      '<p class="cg-s" style="margin:0 0 10px">' + esc(c.summary) + '</p>' +
      /* The course link the page never had. It names its destination
         instead of saying "open" so it still reads correctly out of
         context in a screen reader's link list. It sits in the body
         rather than in the summary because a summary is already a
         control, and a link nested inside one is ambiguous to operate
         by keyboard. */
      '<p style="margin:0 0 12px"><a href="' + courseHref(c.id) + '">' +
      esc(c.name) + ' course page</a></p>' +
      '<ul class="expliste">' + node.experiments.map(expRowHTML).join('') + '</ul>' +
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

    var count = node.total + ' ' + XRSLP.util.plural(node.total, 'experiment') +
      (scoped ? ' matching' : ' published') + ' in ' +
      withExps.length + ' ' + XRSLP.util.plural(withExps.length, 'course');

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
      body = withExps.map(function (cn) { return courseBlockHTML(cn, scoped); }).join('') +
        (empties.length && !scoped
          ? '<p class="muted" style="font-size:13px; margin-top:10px">Nothing is published yet in: ' +
            emptyCourseLinks + '.</p>'
          : '');
    } else if (empties.length && !scoped) {
      /* One sentence, not two. Saying "nothing is published here" and
         then listing every course as empty says the same thing twice. */
      body = '<p class="muted" style="font-size:13px">Nothing is published yet in ' +
        (empties.length === 1 ? 'the one course listed here: ' : 'any of the courses listed here: ') +
        emptyCourseLinks + '. Experiments appear as they are published.</p>';
    } else {
      body = '<p class="muted" style="font-size:13px">No experiment is published under this programme / ' +
        'department yet. It appears here as soon as one is published.</p>';
    }

    return '<section class="cat-section canongroup" aria-labelledby="' + hid + '">' +
      '<h2 id="' + hid + '"><a href="' + groupHref(g.id) + '">' + esc(g.name) + '</a></h2>' +
      '<p class="cg-s">' + esc(g.summary) + ' <span class="muted">· ' + esc(count) + '</span></p>' +
      body +
      '</section>';
  }

  /* Published, but not placeable in the structure. See `ctxOf` above for
     why this state is reachable at all; it is rendered rather than
     dropped because published content the public cannot find is worse
     than published content in an oddly-named group. */
  function unfiledSectionHTML(list) {
    return '<section class="cat-section canongroup" aria-labelledby="cg-h-unfiled">' +
      '<h2 id="cg-h-unfiled">' + esc(UNFILED_GROUP_LABEL) + '</h2>' +
      '<p class="cg-s">' + list.length + ' published ' + XRSLP.util.plural(list.length, 'experiment') +
      ' below ' + (list.length === 1 ? 'is' : 'are') + ' filed under a course that does not currently sit in ' +
      'any programme / department, so the catalogue cannot place ' + (list.length === 1 ? 'it' : 'them') +
      ' in the structure above. ' + (list.length === 1 ? 'It is' : 'They are') + ' listed here rather than ' +
      'dropped — published content stays reachable.</p>' +
      '<ul class="expliste">' + list.map(expRowHTML).join('') + '</ul>' +
      '</section>';
  }

  function catCard(e) {
    var ctx = ctxOf(e.id);
    var inSel = !!state.selectionGet(e.id);
    return '<article class="catcard">' +
      '<div class="cc-ctx">' + esc(ctx.groupingName) + ' › ' + esc(ctx.courseName) + '</div>' +
      '<h3><a href="' + expHref(e.id) + '">' + esc(e.name) + '</a></h3>' +
      '<p class="cc-sum">' + esc(e.summary) + '</p>' +
      '<div class="cc-foot">' + ui.techBadges(e.technologies) + heldChip(e.id) +
      (inSel ? '<span class="cc-insel">' + ui.ic('check', 'sm') + 'In selection</span>' : '') +
      '</div></article>';
  }

  function catEmptyHTML() {
    return '<section class="cat-section"><h2 class="sr-only">Results</h2>' +
      ui.emptyState({
        icon: 'search',
        title: 'No experiments match',
        body: 'No published experiment matches your current search and filters. Try different words, or clear the filters.',
        actionsHTML: '<button class="btn sec" type="button" id="cat-clear-empty">Clear search &amp; filters</button>',
        heading: 'h3'
      }) + '</section>';
  }

  function catResultsHTML() {
    var results = filteredExperiments();
    if (!results.length) { return catEmptyHTML(); }

    if (catView === 'list') {
      return '<section class="cat-section" aria-labelledby="ce-h">' +
        '<h2 id="ce-h">' + (filtersActive() ? 'Matching experiments' : 'All experiments') + '</h2>' +
        '<div class="catgrid">' + results.map(catCard).join('') + '</div>' +
        /* The same set, differently arranged — said plainly, because the
           two views must never look like two catalogues. The caveat is
           there because it is true: an experiment the catalogue cannot
           place appears there in its own group, not under a programme. */
        '<p class="muted" style="font-size:13px; margin-top:14px">Every experiment above also appears in the ' +
        '<strong>By programme</strong> view — under its programme and course, or in an explicit ' +
        '&ldquo;not filed&rdquo; group where the catalogue cannot place it.</p>' +
        '</section>';
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
        ? '<p class="muted" style="font-size:13px; margin-top:16px">' + withoutMatch + ' other ' +
          XRSLP.util.plural(withoutMatch, 'programme / department', 'programmes / departments') +
          (withoutMatch === 1 ? ' holds' : ' hold') +
          ' nothing matching the current search and filters.</p>'
        : '');
  }

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
      return '<button type="button" class="ttog" data-view="' + esc(v.id) + '" aria-pressed="' + pressed + '">' +
        (pressed ? ui.ic('check') : '') + esc(v.label) + '</button>';
    }).join('');

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
      '<div class="fb-tech"><span class="fb-label" id="tech-label">Technology</span>' +
      '<div class="techtoggles" role="group" aria-labelledby="tech-label">' + techToggles + '</div></div>' +
      '<div class="fb-tech"><span class="fb-label" id="view-label">View</span>' +
      '<div class="techtoggles" role="group" aria-labelledby="view-label">' + viewToggles + '</div></div>' +
      '</div>' +
      '<div class="fb-foot"><span class="fb-count" id="cat-count">' + esc(catCountText()) + '</span>' +
      (filtersActive() ? '<button class="btn sm sec fb-clear" type="button" id="cat-clear">Clear search &amp; filters</button>' : '') +
      '</div></div>' +
      '<div id="cat-results">' + catResultsHTML() + '</div>';

    function repaint(keepCaret) {
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

    return {
      title: 'Catalogue',
      html: html,
      navKey: 'catalogue',
      after: function () {
        var q = document.getElementById('cat-q');
        if (q) {
          q.addEventListener('input', function () {
            catFilters.q = q.value;
            repaint(true);
          });
        }
        var sel = document.getElementById('cat-grouping');
        if (sel) {
          sel.addEventListener('change', function () {
            catFilters.grouping = sel.value;
            repaint(false);
            var again = document.getElementById('cat-grouping');
            if (again) { again.focus(); }
          });
        }
        /* Scoped to the TECHNOLOGY toggles. The view toggles share the
           `.ttog` class for their styling, and a bare `.ttog` selector
           bound them to the technology handler — which read a null
           `data-tech` and filtered the catalogue down to nothing. */
        Array.prototype.slice.call(document.querySelectorAll('.ttog[data-tech]')).forEach(function (btn) {
          btn.addEventListener('click', function () {
            var t = btn.getAttribute('data-tech');
            catFilters.tech[t] = !catFilters.tech[t];
            repaint(false);
            var again = document.querySelector('.ttog[data-tech="' + t + '"]');
            if (again) { again.focus(); }
          });
        });
        Array.prototype.slice.call(document.querySelectorAll('.ttog[data-view]')).forEach(function (btn) {
          btn.addEventListener('click', function () {
            var v = btn.getAttribute('data-view');
            if (catView === v) { return; }
            catView = v;
            repaint(false);
            var again = document.querySelector('.ttog[data-view="' + v + '"]');
            if (again) { again.focus(); }
          });
        });
        /* Remember a collapsed Course across the re-render that every
           keystroke in the search box causes.

           ⚠ `toggle` ALSO FIRES FOR THE STATE THE RENDER ITSELF JUST
           PRODUCED. Setting `open` through innerHTML queues a toggle
           task in the browser, and that task lands after this function
           has attached the listener — so a naive handler reads the
           markup back as if the reader had clicked it. The consequence
           was real and one-directional: a filter renders every matching
           Course open, that echo deleted the reader's collapse, and
           clearing the filter re-expanded a Course they had shut.

           So the state this render produced is captured first, and a
           toggle that merely repeats it is ignored. Only a change the
           reader actually made is written down. */
        Array.prototype.slice.call(document.querySelectorAll('details.canon[data-course]')).forEach(function (d) {
          var lastOpen = d.open;
          d.addEventListener('toggle', function () {
            if (d.open === lastOpen) { return; }
            lastOpen = d.open;
            var cid = d.getAttribute('data-course');
            if (d.open) { delete catCollapsed[cid]; } else { catCollapsed[cid] = true; }
          });
        });
        function clearAll() {
          catFilters = { q: '', grouping: 'all', tech: {} };
          repaint(false);
          var qi = document.getElementById('cat-q');
          if (qi) { qi.focus(); }
        }
        var clearBtn = document.getElementById('cat-clear');
        if (clearBtn) { clearBtn.addEventListener('click', clearAll); }
        var clearEmpty = document.getElementById('cat-clear-empty');
        if (clearEmpty) { clearEmpty.addEventListener('click', clearAll); }
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
      ui.phead(g.name, courses.length + ' ' + XRSLP.util.plural(courses.length, 'course') + ' · ' +
        expCount + ' ' + XRSLP.util.plural(expCount, 'experiment')) +
      '<p class="plede">' + esc(g.summary) + '</p>' +
      '<section aria-labelledby="pc-h"><h2 id="pc-h" class="sr-only">Courses in ' + esc(g.name) + '</h2>' +
      /* A Programme with no Courses is a real, reachable state — the
         platform can add one before any Course sits in it — so the page
         says so rather than rendering an empty container. */
      (courses.length
        ? '<div class="coursecards">' + cards + '</div>'
        : '<div class="tablecard">' + ui.emptyState({
            icon: 'book', title: 'No course is listed here yet',
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

    var rows = '<ul class="expliste">' + exps.map(expRowHTML).join('') + '</ul>';

    /* The parent Programme / Department may not resolve — see `ctxOf`.
       The Course page still stands on its own: the crumb and the meta
       line simply stop claiming a parent this build cannot name, rather
       than the screen throwing on `g.name` and rendering nothing. */
    var crumbItems = [{ label: 'Catalogue', href: '#/catalogue' }];
    if (g) { crumbItems.push({ label: g.name, href: groupHref(g.id) }); }
    crumbItems.push({ label: c.name });

    var html =
      ui.crumbs(crumbItems) +
      ui.phead(c.name, esc(g ? g.name : UNFILED_GROUP_LABEL) + ' · ' +
        exps.length + ' ' + XRSLP.util.plural(exps.length, 'experiment')) +
      '<p class="plede">' + esc(c.summary) + '</p>' +
      '<section aria-labelledby="cx-h"><h2 id="cx-h" class="sr-only">Experiments in ' + esc(c.name) + '</h2>' +
      (exps.length
        ? rows
        : '<div class="tablecard">' + ui.emptyState({
            icon: 'flask', title: 'No experiment is published in this course yet',
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
     expired. */
  function heldPanelHTML(inst, rows) {
    var anyExpired = rows.some(function (row) { return !row.live; });

    var recs = rows.map(function (row) {
      var rec = row.record;
      var termDef = data.term(rec.term);
      var alloc = row.allocation;
      return '<div class="rq">' +
        '<div class="rq-body">' +
        '<span class="rq-t">Access record ' + esc(rec.id) + '</span> ' + ui.termBadge(row.termState) +
        '<div style="margin-top:5px">' + ui.techBadges(row.technologies) + '</div>' +
        '<div style="margin-top:5px">' + esc(termDef ? termDef.label : rec.term) +
        (rec.endsOn ? ' · until ' + esc(XRSLP.util.fmtDate(rec.endsOn)) : '') + '</div>' +
        /* Licences, and said so. `allocation.approved` is the licence
           quantity the Super Admin approved on this record — it is an
           allocation figure and is never a count of students. */
        '<div style="margin-top:3px">Licences: ' + alloc.approved + ' approved · ' +
        alloc.assigned + ' assigned · ' + alloc.remaining + ' remaining</div>' +
        '</div></div>';
    }).join('');

    return '<div class="ctxpanel" style="margin-bottom:14px">' +
      '<div class="cp-k">' +
      (rows.some(function (row) { return row.live; })
        ? 'Your institution already has access to this experiment'
        /* EVERY record has expired. Saying "already has access" there
           would be plainly false — the institution held it, and holds
           nothing now. The records are still listed, because the
           history is real and is exactly what makes a new request an
           expansion rather than a first purchase. */
        : 'Your institution has held this experiment before') + '</div>' +
      '<p style="margin-top:6px">' + esc(inst.name) + ' has ' + rows.length + ' access ' +
      XRSLP.util.plural(rows.length, 'record') + ' covering this experiment, listed separately below. ' +
      'Requesting it again asks for <strong>additional licences</strong> alongside what is already in place — ' +
      'it does not replace, reduce or end any of it.</p>' +
      '<div class="reqrows" style="margin-top:8px">' + recs + '</div>' +
      (anyExpired
        ? '<p style="margin-top:8px">A record shown as <strong>Expired</strong> is listed because it is part of ' +
          'this institution&rsquo;s access history. While it is expired it grants nothing.</p>'
        : '') +
      '</div>' +
      ui.protoNote('The institution named above is the requester chosen in <strong>Prototype controls</strong>. ' +
        'The catalogue is deliberately open to browse before any sign-in and this build has no authentication, ' +
        'so this panel identifies nobody, proves nothing and grants nothing.');
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

    /* Rule A, the informational half. Both are empty for a visitor the
       prototype cannot place in any institution, and the panel below
       then renders nothing at all rather than an empty container. */
    var inst = state.scenarioTenant();
    var held = inst ? state.tenantAccessForExperiment(inst.id, e.id) : [];
    /* Access that is STILL RUNNING — a different question from whether
       any record exists. An expired record is real history worth
       showing, but it is not something a new request "adds to". */
    var heldLive = held.some(function (row) { return row.live; });
    var heldHTML = held.length ? heldPanelHTML(inst, held) : '';

    var outcomes = '<ul class="outcomelist">' + e.outcomes.map(function (o) {
      return '<li>' + ui.ic('check') + '<span>' + esc(o) + '</span></li>';
    }).join('') + '</ul>';

    /* ============================================================
       R13 — THE PUBLISHED PREVIEW VIDEO.

       ⚠ SECURITY-ADJACENT. A preview must never be visible publicly
       before publication, and this is the one public screen that reads
       a CONTENT RECORD rather than the published projection of it:
       `data.contextOf()` hands back `publicShape()`, which deliberately
       carries no `previewVideo`, so the field has to be fetched from
       `state.contentRecord()` — and THAT returns any record whatever
       its status, draft included.

       So the published status is re-asserted here, on the record
       itself, before a single field of it is rendered. Two independent
       gates now stand between a Vendor's draft and this page:

         1. the experiment is only resolvable at all while its record is
            PUBLISHED (`publishedPool()` filters on exactly that), which
            is what makes a hand-typed hash route land on Not found;
         2. this check, which refuses to read the record unless the
            record says PUBLISHED.

       Gate 1 alone would be enough today. It is deliberately not relied
       on: it lives in another module, it is a lookup by id in a pool
       this screen does not own, and the cost of it ever changing is a
       Vendor's unreleased preview link on an open, pre-sign-in page.

       There is no leak through the version workflow either — a later
       version is a `contentVersions[]` row and `releaseVersion()` never
       writes `previewVideo`, so what is shown is the video of the
       published record and nothing in flight.
       ============================================================ */
    var pubRec = state.contentRecord(e.id);
    if (!pubRec || pubRec.status !== state.CONTENT_STATUS.PUBLISHED) { pubRec = null; }

    /* A LINK REFERENCE, not an upload and not a player. The prototype
       stores no bytes and streams nothing, so the honest rendering is
       the link the published content supplies, said plainly — and when
       none was supplied, a placeholder that says only that. */
    var previewHTML = cui.previewVideoHTML(pubRec, {
      publicView: true,
      emptyHTML: '<div class="previewbox">' + ui.ic('play', 'lg') +
        '<span>No preview video has been supplied for this experiment. One appears here when the published ' +
        'content record carries a preview link.</span></div>'
    }) + (pubRec && pubRec.previewVideo && pubRec.previewVideo.url
      ? '<p class="muted" style="font-size:13px; margin-top:8px">The preview opens the video where the ' +
        'published content hosts it. This prototype does not host, stream or upload video.</p>'
      : '');

    var reqRows = '<div class="reqrows">' + data.sortTech(e.technologies).map(function (t) {
      var def = data.TECHNOLOGIES[t];
      return '<div class="rq">' + ui.fmtBadge(t) +
        '<div class="rq-body"><span class="rq-t">' + esc(def.name) + '</span><br>' + esc(def.device) + '</div></div>';
    }).join('') + '</div>';

    var panelHTML;
    if (selItem) {
      panelHTML =
        '<aside class="accesspanel insel" aria-labelledby="ap-h">' +
        '<div class="ap-k" id="ap-h">Institutional access</div>' +
        heldHTML +
        '<div class="ap-t">' + ui.ic('check') + ' In your selection</div>' +
        '<div class="ap-sub">Selected technologies: ' + ui.techBadges(selItem.technologies) +
        (heldLive
          ? '<br>The request this selection prepares would be an addition to the access shown above.'
          : held.length
          ? '<br>The access shown above has expired, so this selection prepares a fresh request rather than an addition.'
          : '') + '</div>' +
        '<div class="ap-act">' +
        '<a class="btn pri blk" href="#/selection">View selection</a>' +
        '<button class="btn sec blk" type="button" id="exp-remove">Remove from selection</button>' +
        '</div>' +
        '<p class="ap-note">Technologies can be adjusted on the selection page. A selection prepares an ' +
        'institutional request — it does not grant access.</p>' +
        '</aside>';
    } else {
      var picks = data.sortTech(e.technologies).map(function (t) {
        var def = data.TECHNOLOGIES[t];
        return '<div class="tp-row"><input type="checkbox" id="tech-' + esc(t) + '" value="' + esc(t) + '" aria-describedby="techd-' + esc(t) + '">' +
          '<div class="tp-body"><label class="tp-l" for="tech-' + esc(t) + '">' + ui.fmtBadge(t) + esc(def.name) + '</label>' +
          '<div class="tp-d" id="techd-' + esc(t) + '">' + esc(def.device) + '</div></div></div>';
      }).join('');
      panelHTML =
        '<aside class="accesspanel" aria-labelledby="ap-h">' +
        '<div class="ap-k" id="ap-h">Institutional access</div>' +
        heldHTML +
        '<div class="ap-t">Select technologies</div>' +
        '<div class="ap-sub">Choose at least one technology format for this experiment.' +
        (held.length
          ? ' Every format stays selectable, including any the institution does not hold today.'
          : '') + '</div>' +
        '<fieldset class="fgroup" style="margin:0"><legend class="sr-only">Available technologies</legend>' +
        '<div class="techpick">' + picks + '</div>' +
        '<div id="tech-err"></div></fieldset>' +
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
      '<div class="pmeta" style="margin-bottom:8px">' + esc(ctx.groupingName) + ' › ' + esc(ctx.courseName) + '</div>' +
      '<h1>' + esc(e.name) + '</h1>' +
      '<p class="ph-lede">' + esc(e.description) + '</p>' +
      '<div class="pmeta" style="margin-top:12px">' + ui.techBadges(e.technologies) +
      /* Implementation 06 — the version the catalogue is actually
         showing. It changes only when the Content Manager first
         publishes, or the Super Admin RELEASES a later version. A
         candidate anywhere in the version workflow never appears. */
      (e.versionLabel
        ? ' <span class="verchip">Version ' + esc(e.versionLabel) + '</span>' : '') + '</div>' +
      '<div class="stack" style="margin-top:22px">' +
      ui.card('Learning outcomes', outcomes) +
      ui.card('Available technologies &amp; device requirements', reqRows) +
      ui.card('Preview', previewHTML) +
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
