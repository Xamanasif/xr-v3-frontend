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
  var data = XRSLP.data;
  var state = XRSLP.state;

  function expHref(id) { return '#/experiment/' + encodeURIComponent(id); }
  function courseHref(id) { return '#/course/' + encodeURIComponent(id); }
  function groupHref(id) { return '#/programme/' + encodeURIComponent(id); }

  /* ---------------- landing ---------------- */
  XRSLP.screens.landing = function () {
    var groupCards = data.GROUPINGS.map(function (g) {
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

    var html =
      '<div class="hero">' +
      '<span class="htag">Institutional XR learning</span>' +
      '<h1>Laboratory experiments, delivered as AR, VR and Web simulations</h1>' +
      '<p class="hlede">The XR Simulation Learning Platform hosts simulated laboratory experiments for ' +
      'academic programmes. Institutions browse the published catalogue before any sign-in, choose the ' +
      'experiments and technology formats they need, and request institutional access for their learners.</p>' +
      '<div class="hact">' +
      '<a class="btn pri lg" href="#/catalogue">' + ui.ic('search') + 'Browse catalogue</a>' +
      '<button class="btn sec lg" type="button" id="how-access">How institutional access works</button>' +
      '</div>' +
      '<div class="herofacts">' +
      '<span class="hf">' + ui.ic('monitor') + 'AR · VR · Web experiment formats</span>' +
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
      '<div class="jstep"><span class="jn">2</span><h3>Select experiments &amp; technologies</h3><p>Choose the experiments your institution needs and the AR, VR or Web formats for each.</p></div>' +
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

  /* ---------------- catalogue ---------------- */

  /* Ephemeral filter state (not persisted — a fresh visit starts unfiltered). */
  var catFilters = { q: '', grouping: 'all', tech: {} };

  function filtersActive() {
    return catFilters.q.trim() !== '' || catFilters.grouping !== 'all' ||
      Object.keys(catFilters.tech).some(function (k) { return catFilters.tech[k]; });
  }

  function filteredExperiments() {
    var q = catFilters.q.trim().toLowerCase();
    var activeTech = Object.keys(catFilters.tech).filter(function (k) { return catFilters.tech[k]; });
    return data.experiments().filter(function (e) {
      var ctx = data.contextOf(e.id);
      if (catFilters.grouping !== 'all' && ctx.grouping.id !== catFilters.grouping) { return false; }
      if (activeTech.length) {
        var hasAll = activeTech.every(function (t) { return e.technologies.indexOf(t) !== -1; });
        if (!hasAll) { return false; }
      }
      if (q) {
        var hay = (e.name + ' ' + e.summary + ' ' + ctx.course.name + ' ' + ctx.grouping.name).toLowerCase();
        if (hay.indexOf(q) === -1) { return false; }
      }
      return true;
    });
  }

  function catCard(e) {
    var ctx = data.contextOf(e.id);
    var inSel = !!state.selectionGet(e.id);
    return '<article class="catcard">' +
      '<div class="cc-ctx">' + esc(ctx.grouping.name) + ' › ' + esc(ctx.course.name) + '</div>' +
      '<h3><a href="' + expHref(e.id) + '">' + esc(e.name) + '</a></h3>' +
      '<p class="cc-sum">' + esc(e.summary) + '</p>' +
      '<div class="cc-foot">' + ui.techBadges(e.technologies) +
      (inSel ? '<span class="cc-insel">' + ui.ic('check', 'sm') + 'In selection</span>' : '') +
      '</div></article>';
  }

  function catResultsHTML() {
    var results = filteredExperiments();
    if (!results.length) {
      return ui.emptyState({
        icon: 'search',
        title: 'No experiments match',
        body: 'No published experiment matches your current search and filters. Try different words, or clear the filters.',
        actionsHTML: '<button class="btn sec" type="button" id="cat-clear-empty">Clear search &amp; filters</button>',
        heading: 'h3'
      });
    }
    return '<div class="catgrid">' + results.map(catCard).join('') + '</div>';
  }

  function catCountText() {
    var n = filteredExperiments().length;
    return n + ' ' + XRSLP.util.plural(n, 'experiment') + (filtersActive() ? ' matching' : ' published');
  }

  XRSLP.screens.catalogue = function () {
    var techInUse = data.technologiesInUse();
    var groupingOptions = '<option value="all"' + (catFilters.grouping === 'all' ? ' selected' : '') + '>All programmes</option>' +
      data.GROUPINGS.map(function (g) {
        return '<option value="' + esc(g.id) + '"' + (catFilters.grouping === g.id ? ' selected' : '') + '>' + esc(g.name) + '</option>';
      }).join('');

    var techToggles = techInUse.map(function (t) {
      var def = data.TECHNOLOGIES[t];
      var pressed = !!catFilters.tech[t];
      return '<button type="button" class="ttog" data-tech="' + esc(t) + '" aria-pressed="' + pressed + '">' +
        (pressed ? ui.ic('check') : '') + esc(def.label) + '</button>';
    }).join('');

    var groupSection = '<section class="cat-section" id="cat-groupings" aria-labelledby="cg-h"' + (filtersActive() ? ' hidden' : '') + '>' +
      '<h2 id="cg-h">Browse by Programme / Department</h2>' +
      '<div class="groupcards">' + data.GROUPINGS.map(function (g) {
        var courses = data.coursesInGrouping(g.id);
        var exps = data.experimentsInGrouping(g.id);
        return '<article class="groupcard">' +
          '<div class="gc-kind">Programme / Department</div>' +
          '<h3><a href="' + groupHref(g.id) + '">' + esc(g.name) + '</a></h3>' +
          '<p>' + esc(g.summary) + '</p>' +
          '<div class="gc-foot"><span>' + courses.length + ' ' + XRSLP.util.plural(courses.length, 'course') + '</span>' +
          '<span aria-hidden="true">·</span><span>' + exps.length + ' ' + XRSLP.util.plural(exps.length, 'experiment') + '</span></div>' +
          '</article>';
      }).join('') + '</div></section>';

    var html =
      ui.phead('Catalogue', 'Published experiments, open to browse before any sign-in.') +
      '<div class="filterbar">' +
      '<div class="fb-row">' +
      '<div class="fb-search"><label class="fb-label" for="cat-q">Search</label>' +
      '<div class="searchbox">' + ui.ic('search') +
      '<input type="search" id="cat-q" placeholder="Search experiments, courses, programmes" value="' + esc(catFilters.q) + '"></div></div>' +
      '<div class="fb-sel"><label class="fb-label" for="cat-grouping">Programme / Department</label>' +
      '<select id="cat-grouping">' + groupingOptions + '</select></div>' +
      '<div class="fb-tech"><span class="fb-label" id="tech-label">Technology</span>' +
      '<div class="techtoggles" role="group" aria-labelledby="tech-label">' + techToggles + '</div></div>' +
      '</div>' +
      '<div class="fb-foot"><span class="fb-count" id="cat-count">' + esc(catCountText()) + '</span>' +
      (filtersActive() ? '<button class="btn sm sec fb-clear" type="button" id="cat-clear">Clear search &amp; filters</button>' : '') +
      '</div></div>' +
      groupSection +
      '<section class="cat-section" aria-labelledby="ce-h">' +
      '<h2 id="ce-h">' + (filtersActive() ? 'Matching experiments' : 'All experiments') + '</h2>' +
      '<div id="cat-results">' + catResultsHTML() + '</div>' +
      '</section>';

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
        Array.prototype.slice.call(document.querySelectorAll('.ttog')).forEach(function (btn) {
          btn.addEventListener('click', function () {
            var t = btn.getAttribute('data-tech');
            catFilters.tech[t] = !catFilters.tech[t];
            repaint(false);
            var again = document.querySelector('.ttog[data-tech="' + t + '"]');
            if (again) { again.focus(); }
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
        '<div class="gc-kind">Course sub-bundle</div>' +
        '<h3><a href="' + courseHref(c.id) + '">' + esc(c.name) + '</a></h3>' +
        '<p>' + esc(c.summary) + '</p>' +
        '<div class="gc-foot"><span>' + exps.length + ' ' + XRSLP.util.plural(exps.length, 'experiment') + '</span>' +
        '<span aria-hidden="true">·</span>' + ui.techBadges(Object.keys(techUnion)) + '</div>' +
        '</article>';
    }).join('');

    var html =
      ui.crumbs([{ label: 'Catalogue', href: '#/catalogue' }, { label: g.name }]) +
      ui.phead(g.name, courses.length + ' ' + XRSLP.util.plural(courses.length, 'course') + ' · ' +
        expCount + ' ' + XRSLP.util.plural(expCount, 'experiment')) +
      '<p class="plede">' + esc(g.summary) + '</p>' +
      '<section aria-labelledby="pc-h"><h2 id="pc-h" class="sr-only">Courses in ' + esc(g.name) + '</h2>' +
      '<div class="coursecards">' + cards + '</div></section>';

    return { title: g.name, html: html, navKey: 'catalogue' };
  };

  /* ---------------- course ---------------- */
  XRSLP.screens.course = function (params) {
    var c = data.course(params.id);
    if (!c) { return XRSLP.screens.notFound(); }
    var g = data.grouping(c.groupingId);
    var exps = data.experimentsInCourse(c.id);

    var rows = exps.map(function (e) {
      var inSel = !!state.selectionGet(e.id);
      return '<article class="exprow">' +
        '<div class="xr-body">' +
        '<h3><a href="' + expHref(e.id) + '">' + esc(e.name) + '</a></h3>' +
        '<p>' + esc(e.summary) + '</p>' +
        '</div>' +
        '<div class="xr-side">' +
        '<div class="xr-tech">' + ui.techBadges(e.technologies) + '</div>' +
        (inSel ? '<span class="cc-insel">' + ui.ic('check', 'sm') + 'In selection</span>' : '') +
        '</div></article>';
    }).join('');

    var html =
      ui.crumbs([{ label: 'Catalogue', href: '#/catalogue' },
                 { label: g.name, href: groupHref(g.id) },
                 { label: c.name }]) +
      ui.phead(c.name, esc(g.name) + ' · ' + exps.length + ' ' + XRSLP.util.plural(exps.length, 'experiment')) +
      '<p class="plede">' + esc(c.summary) + '</p>' +
      '<section aria-labelledby="cx-h"><h2 id="cx-h" class="sr-only">Experiments in ' + esc(c.name) + '</h2>' +
      '<div class="expliste">' + rows + '</div></section>';

    return { title: c.name, html: html, navKey: 'catalogue' };
  };

  /* ---------------- experiment detail ---------------- */
  XRSLP.screens.experiment = function (params) {
    var ctx = data.contextOf(params.id);
    if (!ctx) { return XRSLP.screens.notFound(); }
    var e = ctx.experiment;
    var selItem = state.selectionGet(e.id);

    var outcomes = '<ul class="outcomelist">' + e.outcomes.map(function (o) {
      return '<li>' + ui.ic('check') + '<span>' + esc(o) + '</span></li>';
    }).join('') + '</ul>';

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
        '<div class="ap-t">' + ui.ic('check') + ' In your selection</div>' +
        '<div class="ap-sub">Selected technologies: ' + ui.techBadges(selItem.technologies) + '</div>' +
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
        '<div class="ap-t">Select technologies</div>' +
        '<div class="ap-sub">Choose at least one technology format for this experiment.</div>' +
        '<fieldset class="fgroup" style="margin:0"><legend class="sr-only">Available technologies</legend>' +
        '<div class="techpick">' + picks + '</div>' +
        '<div id="tech-err"></div></fieldset>' +
        '<div class="ap-act">' +
        '<button class="btn pri blk" type="button" id="exp-add">' + ui.ic('basket') + 'Add to selection</button>' +
        '</div>' +
        '<p class="ap-note">Institutional access is granted through an approved request. Your selection prepares ' +
        'that request — adding to it does not grant access.</p>' +
        '</aside>';
    }

    var html =
      ui.crumbs([{ label: 'Catalogue', href: '#/catalogue' },
                 { label: ctx.grouping.name, href: groupHref(ctx.grouping.id) },
                 { label: ctx.course.name, href: courseHref(ctx.course.id) },
                 { label: e.name }]) +
      '<div class="phero">' +
      '<div class="ph-main">' +
      '<div class="pmeta" style="margin-bottom:8px">' + esc(ctx.grouping.name) + ' › ' + esc(ctx.course.name) + '</div>' +
      '<h1>' + esc(e.name) + '</h1>' +
      '<p class="ph-lede">' + esc(e.description) + '</p>' +
      '<div class="pmeta" style="margin-top:12px">' + ui.techBadges(e.technologies) + '</div>' +
      '<div class="stack" style="margin-top:22px">' +
      ui.card('Learning outcomes', outcomes) +
      ui.card('Available technologies &amp; device requirements', reqRows) +
      ui.card('Preview',
        '<div class="previewbox">' + ui.ic('play', 'lg') +
        '<span>A preview video for this experiment will appear here when the published content provides one. ' +
        'No preview is available in this prototype.</span></div>') +
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
        body: 'The address may be incomplete, or it may point at a part of the platform that is not part of this prototype slice.',
        actionsHTML: '<a class="btn pri" href="#/">Go to the landing page</a>' +
          '<a class="btn sec" href="#/catalogue">Browse the catalogue</a>'
      }) + '</div>';
    return { title: 'Page not found', html: html, navKey: null };
  };
})();
