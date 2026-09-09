/* ============================================================
   PROTOTYPE-ONLY UI AUDIT HARNESS — not part of the product.

   The companion to `qa/checks.js`. That suite exercises the STATE
   layer outside a browser and cannot see a single rendered pixel;
   this one runs INSIDE the page and audits the rendered DOM of every
   route at every required viewport width.

   It ships nothing to the product: index.html does not reference this
   file, and nothing in js/ knows it exists.

   ── WHAT IT CHECKS ───────────────────────────────────────────
     · document-level horizontal overflow, and the elements causing it
       (the root-cause list — NOT masked with overflow-x:hidden)
     · duplicate element ids
     · controls with no accessible name (icon-only buttons included)
     · heading-level skips
     · raw HTML entities that reached the user as literal text
     · images with no alt attribute
     · interactive targets below the 24px minimum (WCAG 2.5.8)
     · dead links (href="#", empty href)
     · development clutter still visible in product UI
       (.proto-note / .gapnote counts per route)

   ── HOW TO RUN ───────────────────────────────────────────────
   Serve the prototype (`python3 serve.py`), open it, then in the
   browser console:

       await (await fetch('qa/ui-audit.js')).text().then(eval)
       await XRSLPAudit.run()

   `XRSLPAudit.run()` returns a plain object and also leaves it on
   `XRSLPAudit.last`. It restores the starting hash when it finishes.

   Navigation is in-page (`location.hash`), and app.js renders
   synchronously on `hashchange`, so a sweep costs no page loads.
   ============================================================ */

window.XRSLPAudit = (function () {
  'use strict';

  var WIDTHS = [375, 768, 1024, 1280, 1440];

  /* History-API rate limiting. Chrome allows roughly 100 history calls
     per 10 seconds; going over it is what silently stalled the first
     working version of this harness. One pause per window is far
     cheaper than a per-route delay. */
  var PACE_EVERY = 80;
  var PACE_MS = 10500;

  /* ---------- route enumeration ----------
     Static routes always exist on the seed. Detail routes are resolved
     from whatever records the CURRENT state actually holds, so the
     sweep grows automatically as a demo build-up creates them. */
  function routes() {
    var st = XRSLP.state, d = XRSLP.data;
    var out = [];
    function add(hash, label) { out.push({ hash: hash, label: label || hash }); }
    function first(arr) { return (arr && arr.length) ? arr[0] : null; }
    function safe(fn, dflt) { try { return fn(); } catch (e) { return dflt; } }

    /* --- public plane --- */
    add('#/', 'public landing');
    add('#/catalogue', 'public catalogue');
    add('#/selection', 'public selection');
    add('#/request', 'public request form');
    add('#/requests', 'public request list');
    safe(function () {
      Object.keys(d.GROUPINGS || {}).forEach(function (k) {
        var g = d.GROUPINGS[k];
        add('#/programme/' + encodeURIComponent(g.id), 'public programme ' + g.id);
      });
      Object.keys(d.COURSES || {}).forEach(function (k) {
        var c = d.COURSES[k];
        add('#/course/' + encodeURIComponent(c.id), 'public course ' + c.id);
      });
      Object.keys(d.EXPERIMENTS || {}).forEach(function (k) {
        var e = d.EXPERIMENTS[k];
        add('#/experiment/' + encodeURIComponent(e.id), 'public experiment ' + e.id);
      });
    });
    safe(function () {
      st.requests().forEach(function (r) {
        add('#/request-status/' + encodeURIComponent(r.id), 'request status ' + r.id);
        add('#/payment/' + encodeURIComponent(r.id), 'payment ' + r.id);
      });
    });

    /* --- Super Admin --- */
    ['overview', 'requests', 'institutions', 'content', 'structure', 'roles', 'operations']
      .forEach(function (p) { add('#/platform/' + p, 'platform ' + p); });
    safe(function () {
      st.requests().forEach(function (r) {
        add('#/platform/requests/' + encodeURIComponent(r.id), 'platform request ' + r.id);
      });
      st.tenants().forEach(function (t) {
        add('#/platform/institutions/' + encodeURIComponent(t.id), 'platform institution ' + t.id);
      });
      (st.contentRecords ? st.contentRecords() : []).forEach(function (r) {
        add('#/platform/content/' + encodeURIComponent(r.id), 'platform record ' + r.id);
      });
      Object.keys(d.GROUPINGS || {}).forEach(function (k) {
        add('#/platform/structure/programme/' + encodeURIComponent(d.GROUPINGS[k].id),
          'platform programme ' + d.GROUPINGS[k].id);
      });
      Object.keys(d.COURSES || {}).forEach(function (k) {
        add('#/platform/structure/course/' + encodeURIComponent(d.COURSES[k].id),
          'platform course ' + d.COURSES[k].id);
      });
      (st.contentActors ? st.contentActors() : []).forEach(function (a) {
        add('#/platform/roles/' + encodeURIComponent(a.id), 'platform actor ' + a.id);
      });
      (st.deviceTransferRequests ? st.deviceTransferRequests() : []).forEach(function (t) {
        add('#/platform/transfer/' + encodeURIComponent(t.id), 'platform transfer ' + t.id);
      });
      (st.supportTickets ? st.supportTickets() : []).forEach(function (t) {
        add('#/platform/support/' + encodeURIComponent(t.id), 'platform ticket ' + t.id);
      });
    });

    /* --- Tenant Admin --- */
    safe(function () {
      st.tenants().forEach(function (t) {
        var b = '#/tenant/' + encodeURIComponent(t.id) + '/';
        ['overview', 'content-access', 'people', 'people/add-faculty', 'people/add-student',
          'people/import', 'groups', 'groups/new', 'mappings', 'assignments',
          'assignments/new', 'faculty-mapping', 'device-requests', 'help']
          .forEach(function (p) { add(b + p, 'tenant ' + t.id + ' ' + p); });
        (st.peopleForTenant ? st.peopleForTenant(t.id) : []).slice(0, 6).forEach(function (p) {
          add(b + 'person/' + encodeURIComponent(p.id), 'tenant person ' + p.id);
        });
        (st.groupsForTenant ? st.groupsForTenant(t.id) : []).forEach(function (g) {
          add(b + 'group/' + encodeURIComponent(g.id), 'tenant group ' + g.id);
        });
      });
    });

    /* --- Faculty --- */
    safe(function () {
      var fac = [];
      st.tenants().forEach(function (t) {
        fac = fac.concat(st.facultyForTenant ? st.facultyForTenant(t.id) : []);
      });
      fac = fac.slice(0, 2);
      fac.forEach(function (f) {
        var b = '#/faculty/' + encodeURIComponent(f.id) + '/';
        ['overview', 'content', 'assessments', 'questions', 'questions/new',
          /* Implementation 09 — the Question Bank import screen. */
          'questions/draft', 'questions/import', 'reviews', 'students', 'help']
          .forEach(function (p) { add(b + p, 'faculty ' + f.id + ' ' + p); });
        var reach = safe(function () { return st.facultyExperimentIds(f.id) || []; }, []);
        reach.slice(0, 2).forEach(function (row) {
          var eid = row.experimentId || row.id || row;
          ['', '/settings', '/questions', '/preview'].forEach(function (sfx) {
            add(b + 'assessment/' + encodeURIComponent(eid) + sfx,
              'faculty assessment ' + eid + (sfx || ''));
          });
        });
      });
    });

    /* --- Student --- */
    safe(function () {
      add('#/learn', 'student chooser');
      var studs = st.people().filter(function (p) { return p.role === 'student'; }).slice(0, 4);
      studs.forEach(function (s) {
        var b = '#/learn/' + encodeURIComponent(s.id) + '/';
        ['home', 'my-learning', 'progress', 'device', 'help']
          .forEach(function (p) { add(b + p, 'student ' + s.id + ' ' + p); });
        var rows = safe(function () { return st.studentExperiments(s.id) || []; }, []);
        rows.slice(0, 2).forEach(function (row) {
          var eid = row.experimentId;
          add(b + 'experiment/' + encodeURIComponent(eid), 'student experiment ' + eid);
          add(b + 'experiment/' + encodeURIComponent(eid) + '/assessment',
            'student assessment ' + eid);
          (row.technologies || []).slice(0, 2).forEach(function (t) {
            add(b + 'experiment/' + encodeURIComponent(eid) + '/simulation/' + encodeURIComponent(t),
              'student simulation ' + eid + ' ' + t);
            /* Implementation 09 — the prototype Web runtime. A package
               technology redirects back to the simulation page, so the
               route is swept for every technology and the redirect is
               part of what is being checked. */
            add(b + 'experiment/' + encodeURIComponent(eid) + '/simulation/' +
              encodeURIComponent(t) + '/run', 'student runtime ' + eid + ' ' + t);
          });
        });
      });
    });

    /* --- content production --- */
    safe(function () {
      var actors = st.contentActors ? st.contentActors() : [];
      function forRole(role) {
        return actors.filter(function (a) { return a.role === role; });
      }
      forRole('vendor').slice(0, 1).forEach(function (a) {
        var b = '#/vendor/' + encodeURIComponent(a.id) + '/';
        ['overview', 'experiments', 'experiments/new', 'submissions', 'versions', 'help']
          .forEach(function (p) { add(b + p, 'vendor ' + p); });
        (st.contentRecords ? st.contentRecords() : []).slice(0, 3).forEach(function (r) {
          add(b + 'experiment/' + encodeURIComponent(r.id), 'vendor record ' + r.id);
          add(b + 'experiment/' + encodeURIComponent(r.id) + '/edit', 'vendor edit ' + r.id);
          add(b + 'experiment/' + encodeURIComponent(r.id) + '/version', 'vendor version ' + r.id);
        });
      });
      forRole('reviewer').slice(0, 1).forEach(function (a) {
        var b = '#/review/' + encodeURIComponent(a.id) + '/';
        ['overview', 'queue', 'help'].forEach(function (p) { add(b + p, 'reviewer ' + p); });
        (st.contentRecords ? st.contentRecords() : []).slice(0, 4).forEach(function (r) {
          add(b + 'submission/' + encodeURIComponent(r.id), 'reviewer submission ' + r.id);
        });
      });
      forRole('manager').slice(0, 1).forEach(function (a) {
        var b = '#/content/' + encodeURIComponent(a.id) + '/';
        ['overview', 'library', 'queue', 'courses', 'help']
          .forEach(function (p) { add(b + p, 'manager ' + p); });
        (st.contentRecords ? st.contentRecords() : []).slice(0, 4).forEach(function (r) {
          add(b + 'item/' + encodeURIComponent(r.id), 'manager item ' + r.id);
          add(b + 'item/' + encodeURIComponent(r.id) + '/metadata', 'manager metadata ' + r.id);
        });
      });
    });

    /* de-duplicate, preserving order */
    var seen = {};
    return out.filter(function (r) {
      if (seen[r.hash]) { return false; }
      seen[r.hash] = 1;
      return true;
    });
  }

  /* ---------- individual checks ---------- */

  /* Every element whose right edge exceeds the document's client width.
     Reports the OUTERMOST offenders only: an overflowing container drags
     all its children past the edge too, and listing them all buries the
     one element that actually needs fixing. */
  function overflowOffenders(limit) {
    var docW = document.documentElement.clientWidth;
    var bad = [];
    var all = document.body.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      var r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) { continue; }
      if (r.right <= docW + 1 && r.left >= -1) { continue; }
      /* The skip link and the sr-only pattern are parked far off-canvas
         on purpose (`left:-9999px`, `clip`). They extend nothing to the
         RIGHT, so they cannot widen the document in an LTR page — and
         reporting them buries the element that actually did. */
      if (r.right <= docW + 1) { continue; }
      /* skip if an ancestor already scrolls this content itself */
      var scrolls = false, p = el.parentElement;
      while (p && p !== document.body) {
        var ov = window.getComputedStyle(p).overflowX;
        if (ov === 'auto' || ov === 'scroll' || ov === 'hidden') { scrolls = true; break; }
        p = p.parentElement;
      }
      if (scrolls) { continue; }
      bad.push(el);
    }
    /* keep outermost only */
    var outer = bad.filter(function (el) {
      return !bad.some(function (o) { return o !== el && o.contains(el); });
    });
    return outer.slice(0, limit || 6).map(function (el) {
      var r = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        cls: (el.className && el.className.toString().slice(0, 80)) || '',
        id: el.id || '',
        right: Math.round(r.right),
        docW: docW,
        text: (el.textContent || '').trim().slice(0, 60)
      };
    });
  }

  function duplicateIds() {
    var seen = {}, dups = {};
    var all = document.querySelectorAll('[id]');
    for (var i = 0; i < all.length; i++) {
      var id = all[i].id;
      if (seen[id]) { dups[id] = (dups[id] || 1) + 1; }
      seen[id] = 1;
    }
    return Object.keys(dups).map(function (id) { return { id: id, count: dups[id] }; });
  }

  function accName(el) {
    var s = (el.getAttribute('aria-label') || '').trim();
    if (s) { return s; }
    var lb = el.getAttribute('aria-labelledby');
    if (lb) {
      var t = lb.split(/\s+/).map(function (i) {
        var n = document.getElementById(i);
        return n ? n.textContent : '';
      }).join(' ').trim();
      if (t) { return t; }
    }
    if (el.id) {
      var lab = document.querySelector('label[for="' + CSS.escape(el.id) + '"]');
      if (lab && lab.textContent.trim()) { return lab.textContent.trim(); }
    }
    var wrap = el.closest('label');
    if (wrap && wrap.textContent.trim()) { return wrap.textContent.trim(); }
    var txt = (el.textContent || '').trim();
    if (txt) { return txt; }
    if (el.tagName === 'INPUT') {
      var ph = el.getAttribute('placeholder');
      if (ph) { return '(placeholder only) ' + ph; }
      if (el.type === 'submit' || el.type === 'button') { return el.value || ''; }
    }
    var t2 = el.getAttribute('title');
    return t2 ? t2.trim() : '';
  }

  function namelessControls() {
    var sel = 'button, a[href], input:not([type=hidden]), select, textarea, [role="button"]';
    var out = [];
    var all = document.body.querySelectorAll(sel);
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el.closest('.sr-only')) { continue; }
      var r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) { continue; }   /* not rendered */
      var n = accName(el);
      if (!n || n.indexOf('(placeholder only)') === 0) {
        out.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className && el.className.toString().slice(0, 60)) || '',
          type: el.getAttribute('type') || '',
          name: n || '(none)',
          html: el.outerHTML.slice(0, 110)
        });
      }
    }
    return out.slice(0, 10);
  }

  /* A heading outline must not skip a level going DOWN (h2 -> h4). */
  function headingSkips() {
    var hs = document.body.querySelectorAll('h1,h2,h3,h4,h5,h6');
    var out = [], prev = 0;
    for (var i = 0; i < hs.length; i++) {
      var lvl = parseInt(hs[i].tagName.slice(1), 10);
      if (prev && lvl > prev + 1) {
        out.push({
          from: 'h' + prev, to: 'h' + lvl,
          text: (hs[i].textContent || '').trim().slice(0, 60)
        });
      }
      prev = lvl;
    }
    return out;
  }

  /* An entity that survived into the TEXT the user reads means a string
     was escaped twice. `&amp;nbsp;` renders as the literal "&nbsp;". */
  function rawEntities() {
    var t = document.body.innerText || '';
    var hits = t.match(/&(amp|lt|gt|quot|#\d+|nbsp|mdash|ndash|rsquo|hellip);/g) || [];
    var uniq = {};
    hits.forEach(function (h) { uniq[h] = (uniq[h] || 0) + 1; });
    return Object.keys(uniq).map(function (k) { return { entity: k, count: uniq[k] }; });
  }

  function imagesWithoutAlt() {
    var out = [];
    var imgs = document.body.querySelectorAll('img');
    for (var i = 0; i < imgs.length; i++) {
      if (!imgs[i].hasAttribute('alt')) {
        out.push({ src: (imgs[i].getAttribute('src') || '').slice(0, 80) });
      }
    }
    return out;
  }

  function smallTargets() {
    var out = [];
    var all = document.body.querySelectorAll('button, a[href], [role="button"], input[type=checkbox], input[type=radio]');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el.closest('.sr-only')) { continue; }
      var r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) { continue; }
      /* WCAG 2.5.8 INLINE EXCEPTION. A link inside a sentence is sized
         by the line-height of the text around it, and the success
         criterion exempts exactly that case. Without this the check
         reports every prose link in the product — 36 routes of noise
         that hides any real undersized control. `min-block-size` in
         layout.css cannot lift these either: it does not apply to
         non-replaced inline boxes. */
      var disp = window.getComputedStyle(el).display;
      if (disp === 'inline' && el.tagName === 'A') { continue; }
      if (r.width < 24 || r.height < 24) {
        out.push({
          display: disp,
          tag: el.tagName.toLowerCase(),
          cls: (el.className && el.className.toString().slice(0, 50)) || '',
          w: Math.round(r.width), h: Math.round(r.height),
          text: (el.textContent || '').trim().slice(0, 40)
        });
      }
    }
    return out.slice(0, 8);
  }

  /* Exactly one h1 per route. Zero means the page has no name; two means
     two things claim to be the page. Both are outline defects a screen
     reader user feels immediately. */
  function h1Count() {
    return document.body.querySelectorAll('#main-content h1, .pubmain h1, .main h1').length ||
           document.body.querySelectorAll('h1').length;
  }

  /* A route that rendered almost nothing. Distinct from a legitimate
     empty state, which still renders a heading and an explanation —
     this catches a screen that threw half-way or returned nothing. */
  /* ⚠ A CAUGHT RENDER ERROR IS NOT A HEALTHY PAGE.

     The app wraps screen rendering in an error boundary, which is right
     — one broken screen must not take the build down. But the fallback
     it renders has a heading, body copy and no overflow, so every
     structural check passes and the sweep reports the route as clean.
     A Faculty Overview that threw on every load sat green in a 890-check
     run because of exactly this.

     The boundary's own wording is the signal, and it is matched here
     rather than the error text, so a screen that legitimately mentions
     "went wrong" is not flagged. */
  function renderedError() {
    var main = document.getElementById('main-content') || document.body;
    var h1 = main.querySelector('h1');
    if (h1 && /could not be displayed/i.test(h1.textContent || '')) { return true; }
    return /Something in the stored prototype data stopped this screen from rendering/i
      .test(main.innerText || '');
  }

  function looksBlank() {
    var main = document.getElementById('main-content') || document.body;
    var text = (main.innerText || '').trim();
    return text.length < 40;
  }


  /* ---------- colour contrast (WCAG 2.1 SC 1.4.3) ----------
     Computed from what the browser actually painted, not from the token
     table: a token can be correct and still be used on the wrong
     surface. Walks real text nodes, resolves the effective background
     by climbing until an opaque one is found, and applies the AA
     thresholds — 4.5:1 for body text, 3:1 for large text
     (>=24px, or >=18.66px when bold). */
  function srgb(c) {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }
  function lum(rgb) {
    return 0.2126 * srgb(rgb[0]) + 0.7152 * srgb(rgb[1]) + 0.0722 * srgb(rgb[2]);
  }
  function parseRGB(s) {
    var m = String(s).match(/rgba?\(([^)]+)\)/);
    if (!m) { return null; }
    var p = m[1].split(',').map(function (x) { return parseFloat(x); });
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  function effectiveBg(el) {
    var node = el;
    while (node && node !== document.documentElement) {
      var bg = parseRGB(window.getComputedStyle(node).backgroundColor);
      if (bg && bg.a >= 0.95) { return [bg.r, bg.g, bg.b]; }
      node = node.parentElement;
    }
    return [255, 255, 255];
  }
  function ratio(fg, bg) {
    var l1 = lum(fg), l2 = lum(bg);
    var hi = Math.max(l1, l2), lo = Math.min(l1, l2);
    return (hi + 0.05) / (lo + 0.05);
  }

  function contrastFailures(limit) {
    var out = [], seen = {};
    var walker = document.createTreeWalker(
      document.getElementById('main-content') || document.body,
      NodeFilter.SHOW_TEXT, null, false);
    var n;
    while ((n = walker.nextNode())) {
      var txt = (n.nodeValue || '').trim();
      if (txt.length < 2) { continue; }
      var el = n.parentElement;
      if (!el || el.closest('.sr-only')) { continue; }
      /* WCAG 1.4.3 EXEMPTS INACTIVE COMPONENTS: "text that is part of an
         inactive user interface component ... has no contrast
         requirement". The design system's disabled button is
         --text-dis on --sunken (2.49:1) BY DESIGN — being visibly
         unavailable is the whole point of it. Without this exemption
         the check reports that one intentional style forever and the
         real signal is lost in it. */
      var inactive = el.closest('[disabled], [aria-disabled="true"], fieldset[disabled]');
      if (inactive) { continue; }
      var cs = window.getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.1) { continue; }
      var r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) { continue; }
      var fg = parseRGB(cs.color);
      if (!fg) { continue; }
      var size = parseFloat(cs.fontSize);
      var weight = parseInt(cs.fontWeight, 10) || 400;
      var large = size >= 24 || (size >= 18.66 && weight >= 700);
      var need = large ? 3 : 4.5;
      var got = ratio([fg.r, fg.g, fg.b], effectiveBg(el));
      if (got + 0.005 < need) {
        var key = cs.color + '|' + size + '|' + weight + '|' + el.className;
        if (seen[key]) { continue; }
        seen[key] = 1;
        out.push({
          text: txt.slice(0, 40),
          cls: (el.className && el.className.toString().slice(0, 50)) || el.tagName.toLowerCase(),
          color: cs.color, size: size, weight: weight,
          ratio: Math.round(got * 100) / 100, need: need
        });
      }
    }
    return out.slice(0, limit || 6);
  }

  function deadLinks() {
    var out = [];
    var as = document.body.querySelectorAll('a[href]');
    for (var i = 0; i < as.length; i++) {
      var h = as[i].getAttribute('href');
      if (h === '#' || h === '' || h === null) {
        out.push({ text: (as[i].textContent || '').trim().slice(0, 50), href: h });
      }
    }
    return out.slice(0, 8);
  }

  /* Development clutter still rendered in stakeholder-facing product UI.
     The prototype-controls STRIP is excluded on purpose: it is openly
     not product UI and is allowed to stay. */
  function devClutter() {
    function outside(sel) {
      return Array.prototype.filter.call(
        document.body.querySelectorAll(sel),
        function (el) { return !el.closest('.protobar'); }
      );
    }
    var proto = outside('.proto-note');
    var gaps = outside('.gapnote');
    return {
      protoNotes: proto.length,
      gapNotes: gaps.length,
      tags: gaps.map(function (g) {
        var t = g.querySelector('.gtag');
        return t ? t.textContent.trim() : '';
      }).filter(Boolean),
      /* characters of dev prose on the page — a crude but stable
         regression figure for the cleanup pass */
      chars: proto.concat(gaps).reduce(function (n, el) {
        return n + (el.innerText || '').length;
      }, 0)
    };
  }

  /* ---------- the sweep ---------- */

  /* NAVIGATE SYNCHRONOUSLY.

     app.js renders on `hashchange`, and that event is dispatched on a
     later task — so the obvious `location.hash = h; await timeout(0)`
     works, but only in a FOREGROUND tab. A hidden or backgrounded tab
     clamps both `setTimeout` and `requestAnimationFrame` to roughly one
     second, which turned a 14ms render into an 800ms one and made a
     full sweep impossible to run from an automation driver.

     Assigning the hash and then dispatching `hashchange` by hand runs
     the app's own handler inline, so the DOM is built before this
     function returns. The browser's own event still arrives afterwards
     and renders the same route a second time — idempotent, and the
     measurements have already been taken from an identical tree. */
  /* ---------- the failed-lookup trap ----------
     THE MOST LIKELY SILENT BUG IN A REDESIGN PASS. Nearly every screen
     returns an `after()` hook that finds elements by id and attaches
     listeners. Rename or drop an id in the markup and the hook still
     runs, `getElementById` simply returns null, the listener is never
     attached, and a control does nothing — no error, no failing test,
     nothing on screen to see.

     Static analysis of this is unreliable: ids are built from prefixes
     concatenated at the call site, emitted by shared helpers in other
     files, and suffixed with indices. So it is trapped at RUNTIME
     instead — wrap the lookup, record every miss, and attribute it to
     the route that was rendering. That is exact, and it costs nothing.

     A null lookup is not always a bug (a screen may probe for something
     legitimately absent), so misses are REPORTED, not failed on. The
     signal is a miss that appears where it did not before. */
  var LOOKUP_MISSES = [];
  var LOOKUP_HOOKED = false;
  function hookLookups() {
    if (LOOKUP_HOOKED) { return; }
    LOOKUP_HOOKED = true;
    var real = document.getElementById.bind(document);
    document.getElementById = function (id) {
      var el = real(id);
      if (el === null) { LOOKUP_MISSES.push(id); }
      return el;
    };
  }

  function nav(hash) {
    hookErrors();
    hookLookups();
    ERRORS = [];
    LOOKUP_MISSES = [];
    var from = window.location.href;
    /* `history.replaceState`, NOT `location.hash = ...`.

       Assigning the hash PUSHES a history entry. A 144-route sweep does
       that 144 times per width, and the browser caps the session history
       (50 entries here) and then rate-limits further navigations — after
       which the assignment silently stops taking effect and every
       remaining route renders `notFound`. That produced a clean-looking
       all-zero result for three of five widths: a false green, which is
       the worst failure mode a QA harness has. replaceState reuses the
       single current entry, so the sweep can run indefinitely. */
    NAVS += 1;
    try {
      window.history.replaceState(null, '', hash);
    } catch (e) {
      /* The browser rate-limits the history API (Chrome: ~100 calls per
         10s). Exceeding it throws — and, worse, some builds ignore the
         call silently, after which every route renders `notFound` and
         the sweep reports a clean all-zero result. Both are recorded so
         a stalled run can never be mistaken for a passing one. */
      NAV_ERRORS.push({ hash: hash, error: e.name + ': ' + e.message, nav: NAVS });
    }
    if (window.location.hash !== hash) {
      NAV_ERRORS.push({ hash: hash, error: 'navigation did not take effect', nav: NAVS });
    }
    window.dispatchEvent(new HashChangeEvent('hashchange', { oldURL: from, newURL: window.location.href }));
    return Promise.resolve();
  }

  /* ⚠ A BLOCKING PAUSE, ON PURPOSE.

     The history API is rate limited (Chrome: ~100 calls per 10s) and
     exceeding it silently stops navigation — so the sweep has to pause.
     But the obvious `setTimeout` pause does not work here: a hidden or
     backgrounded tab throttles timers to roughly one per minute, so an
     automation driver evaluating this from outside the page waits out
     its whole budget on a 10-second sleep that never fires.

     Spinning on `performance.now()` is immune to that, because it never
     yields to the scheduler at all. It blocks the main thread, which
     would be indefensible in product code and is entirely fine in a
     harness that is measuring a static page between navigations. */
  function sleep(ms) {
    var end = performance.now() + ms;
    while (performance.now() < end) { /* deliberate spin — see above */ }
    return Promise.resolve();
  }

  /* A sweep is only believable if the routes actually rendered. Any run
     whose notFound count exceeds the routes that legitimately 404 means
     navigation broke part-way, and the result must be thrown away. */
  function renderedNotFound() {
    var h1 = document.querySelector('#main-content h1, .phead h1, h1');
    return !!(h1 && /page not found/i.test(h1.textContent || ''));
  }

  function auditCurrent(width) {
    var issues = {};
    /* The offender hunt walks every element and reads a rect for each,
       which is the single most expensive thing in this file. Nearly
       every route has no overflow at all, and the document-level figure
       answers that in O(1) — so pay for the hunt only when there is
       something to find. */
    var over = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    if (over > 1) {
      var of = overflowOffenders();
      if (of.length) { issues.overflow = of; }
      else { issues.overflow = [{ tag: '(unattributed)', right: document.documentElement.scrollWidth,
                                  docW: document.documentElement.clientWidth, cls: '', id: '', text: '' }]; }
    }
    var d = duplicateIds();
    if (d.length) { issues.duplicateIds = d; }
    var n = namelessControls();
    if (n.length) { issues.namelessControls = n; }
    var hs = headingSkips();
    if (hs.length) { issues.headingSkips = hs; }
    var re = rawEntities();
    if (re.length) { issues.rawEntities = re; }
    var ia = imagesWithoutAlt();
    if (ia.length) { issues.imagesWithoutAlt = ia; }
    var stg = smallTargets();
    if (stg.length) { issues.smallTargets = stg; }
    var dl = deadLinks();
    if (dl.length) { issues.deadLinks = dl; }
    var h1s = h1Count();
    if (h1s !== 1) { issues.h1Count = [{ found: h1s }]; }
    if (renderedError()) {
      issues.renderError = [{ hash: window.location.hash,
        detail: ((document.getElementById('main-content') || document.body).innerText || '')
          .replace(/\s+/g, ' ').slice(0, 160) }];
    }
    if (looksBlank()) { issues.blankPage = [{ chars: ((document.getElementById('main-content') || document.body).innerText || '').trim().length }]; }
    if (ERRORS.length) { issues.runtimeErrors = ERRORS.slice(0, 4); }
    var cf = contrastFailures();
    if (cf.length) { issues.contrast = cf; }
    return {
      lookupMisses: LOOKUP_MISSES.slice(0, 8),
      width: width,
      docScrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
      overflowPx: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
      issues: issues
    };
  }

  async function run(opts) {
    opts = opts || {};
    var widths = opts.widths || WIDTHS;
    var list = opts.routes || routes();
    var startHash = window.location.hash;
    var results = [];

    /* The harness cannot resize the real window, so widths are applied
       to the DOCUMENT instead: the shells are fluid, so constraining
       the body reproduces the same layout the viewport would force.
       When the caller CAN resize (an automation driver), it passes
       `physical:true` and this is skipped. */
    function setWidth(w) {
      if (opts.physical) { return; }
      var el = document.documentElement;
      if (w === null) { el.style.removeProperty('width'); document.body.style.removeProperty('width'); return; }
      document.body.style.width = w + 'px';
      document.body.style.margin = '0';
    }

    for (var wi = 0; wi < widths.length; wi++) {
      var w = widths[wi];
      setWidth(w);
      for (var i = 0; i < list.length; i++) {
        await nav(list[i].hash);
        var res = auditCurrent(w);
        res.hash = list[i].hash;
        res.label = list[i].label;
        res.title = document.title;
        res.clutter = devClutter();
        results.push(res);
      }
    }
    setWidth(null);
    window.location.hash = startHash || '#/';

    var withIssues = results.filter(function (r) {
      return Object.keys(r.issues).length > 0;
    });
    var summary = {
      routes: list.length,
      widths: widths,
      totalChecks: results.length,
      routesWithIssues: withIssues.length,
      byType: {}
    };
    withIssues.forEach(function (r) {
      Object.keys(r.issues).forEach(function (k) {
        summary.byType[k] = (summary.byType[k] || 0) + 1;
      });
    });
    /* dev-clutter roll-up, measured once per route at the widest width */
    var widest = results.filter(function (r) { return r.width === widths[widths.length - 1]; });
    summary.clutter = {
      routesWithProtoNotes: widest.filter(function (r) { return r.clutter.protoNotes > 0; }).length,
      routesWithGapNotes: widest.filter(function (r) { return r.clutter.gapNotes > 0; }).length,
      totalProtoNotes: widest.reduce(function (n, r) { return n + r.clutter.protoNotes; }, 0),
      totalGapNotes: widest.reduce(function (n, r) { return n + r.clutter.gapNotes; }, 0),
      totalDevProseChars: widest.reduce(function (n, r) { return n + r.clutter.chars; }, 0)
    };

    var out = { summary: summary, results: results, failures: withIssues };
    XRSLPAudit.last = out;
    return out;
  }


  /* ---------- chunked driver ----------
     An automation driver evaluating this from outside the page has a
     wall-clock budget per call, and a 144-route x 5-width sweep does not
     fit in one. `step()` runs a slice and keeps the accumulator on the
     module, so the caller loops until `done` is true. */
  var ACC = null;
  var NAVS = 0;
  var NAV_ERRORS = [];

  /* Uncaught errors are captured per route rather than globally: a
     screen that throws while rendering still leaves a partial DOM, so
     without this the sweep would audit the wreckage and call it clean. */
  var ERRORS = [];
  var ERR_HOOKED = false;
  function hookErrors() {
    if (ERR_HOOKED) { return; }
    ERR_HOOKED = true;
    window.addEventListener('error', function (e) {
      ERRORS.push(e.message + ' @ ' + String(e.filename || '').split('/').pop() + ':' + e.lineno);
    });
    window.addEventListener('unhandledrejection', function (e) {
      ERRORS.push('unhandled rejection: ' + (e.reason && e.reason.message ? e.reason.message : String(e.reason)));
    });
  }

  function begin(opts) {
    opts = opts || {};
    ACC = {
      widths: opts.widths || WIDTHS,
      list: opts.routes || routes(),
      startHash: window.location.hash,
      results: [],
      i: 0,
      wi: 0,
      since: 0
    };
    NAVS = 0;
    NAV_ERRORS = [];
    return { routes: ACC.list.length, widths: ACC.widths };
  }

  async function step(n, opts_ms) {
    if (!ACC) { throw new Error('call begin() first'); }
    n = n || 20;
    /* TIME-BOUNDED, not only count-bounded. An automation driver
       evaluating this from outside the page is killed at a fixed wall
       clock, and route render cost is not uniform — a few heavy admin
       screens cost many times a catalogue card. Returning early keeps
       the caller in control instead of losing the whole slice. */
    var budgetMs = opts_ms || 20000;
    var t0 = (typeof performance !== 'undefined' ? performance.now() : 0);
    var done = 0;
    while (done < n && ACC.wi < ACC.widths.length) {
      if (done && (typeof performance !== 'undefined') && performance.now() - t0 > budgetMs) { break; }
      /* Stay under the history-API rate limit. Paced by COUNT, not by a
         fixed delay per route: a delay per route would cost minutes over
         a 720-check sweep, while one pause per window costs seconds. */
      if (ACC.since >= PACE_EVERY) {
        ACC.since = 0;
        await sleep(PACE_MS);
      }
      var w = ACC.widths[ACC.wi];
      var route = ACC.list[ACC.i];
      await nav(route.hash);
      var res = auditCurrent(w);
      res.hash = route.hash;
      res.label = route.label;
      res.title = document.title;
      res.clutter = devClutter();
      res.notFound = renderedNotFound();
      ACC.results.push(res);
      done += 1;
      ACC.since += 1;
      ACC.i += 1;
      if (ACC.i >= ACC.list.length) { ACC.i = 0; ACC.wi += 1; }
    }
    var finished = ACC.wi >= ACC.widths.length;
    return {
      done: finished,
      progress: ACC.results.length,
      total: ACC.list.length * ACC.widths.length,
      currentWidth: ACC.widths[Math.min(ACC.wi, ACC.widths.length - 1)]
    };
  }

  function finish() {
    if (!ACC) { throw new Error('call begin() first'); }
    var results = ACC.results, widths = ACC.widths, list = ACC.list;
    window.location.hash = ACC.startHash || '#/';
    var withIssues = results.filter(function (r) { return Object.keys(r.issues).length > 0; });
    var notFound = results.filter(function (r) { return r.notFound; });
    var summary = { routes: list.length, widths: widths, totalChecks: results.length,
      routesWithIssues: withIssues.length, byType: {}, byWidth: {},
      /* A non-zero figure here invalidates the run — see nav(). */
      notFoundRoutes: notFound.length,
      notFoundSample: notFound.slice(0, 5).map(function (r) { return r.hash; }),
      navErrors: NAV_ERRORS.length,
      navErrorSample: NAV_ERRORS.slice(0, 3) };
    /* A sweep with navigation errors measured pages that were never
       rendered. Say so loudly rather than returning tidy zeros. */
    summary.valid = NAV_ERRORS.length === 0;
    withIssues.forEach(function (r) {
      Object.keys(r.issues).forEach(function (k) { summary.byType[k] = (summary.byType[k] || 0) + 1; });
      summary.byWidth[r.width] = (summary.byWidth[r.width] || 0) + 1;
    });
    var widest = results.filter(function (r) { return r.width === widths[widths.length - 1]; });
    summary.clutter = {
      routesWithProtoNotes: widest.filter(function (r) { return r.clutter.protoNotes > 0; }).length,
      routesWithGapNotes: widest.filter(function (r) { return r.clutter.gapNotes > 0; }).length,
      totalProtoNotes: widest.reduce(function (n, r) { return n + r.clutter.protoNotes; }, 0),
      totalGapNotes: widest.reduce(function (n, r) { return n + r.clutter.gapNotes; }, 0),
      totalDevProseChars: widest.reduce(function (n, r) { return n + r.clutter.chars; }, 0)
    };
    var out = { summary: summary, results: results, failures: withIssues };
    XRSLPAudit.last = out;
    ACC = null;
    return out;
  }


  /* ============================================================
     DETERMINISTIC STATE BUILD-UP.

     The clean seed grants no institution anything and assigns no
     student anything — correctly, because publication grants nothing.
     That makes the seed the ZERO state, and the zero state alone
     cannot show whether a screen handles one record, a few or many.

     `build()` walks the REAL product path to create them — a public
     selection, an institutional request, a Super Admin approval, then
     tenant assignment — so nothing is fabricated straight into state
     and every screen it produces is one the product can actually
     reach. It is the same sequence `qa/checks.js` uses.

     `build('one' | 'few' | 'many')` — returns what it created.
     ============================================================ */
  function build(shape) {
    var st = XRSLP.state;
    st.reset();
    var TENANT = 'tenant-sample-engineering';
    var STUDENTS = st.people().filter(function (p) { return p.role === 'student'; });

    var PLANS = {
      one:  [{ exps: ['direct-shear'], tech: ['web'], qty: 3 }],
      few:  [{ exps: ['direct-shear', 'consolidation'], tech: ['vr', 'web'], qty: 5 }],
      many: [{ exps: ['direct-shear', 'consolidation', 'total-station'], tech: ['vr', 'web'], qty: 8 },
             { exps: ['beam-deflection', 'torsion-test'], tech: ['web'], qty: 8 }]
    };
    var plan = PLANS[shape] || PLANS.few;
    var made = [];

    plan.forEach(function (p, i) {
      st.setScenario('A');
      st.selectionClear();
      p.exps.forEach(function (id) { st.selectionAdd(id, p.tech.slice()); });
      var req = st.submitRequest({
        institutionName: 'Sample Engineering Institute',
        contactName: 'Dr. Kavita Sharma',
        contactEmail: 'kavita.sharma@sample-institute.example',
        quantity: p.qty, term: 'yearly'
      });
      if (!req) { return; }
      st.approveRequest(req.id, { reason: 'UI audit — approved as submitted.' });
      var acc = st.accessForTenant(TENANT).slice(-1)[0];
      if (!acc) { return; }
      /* Assign to a DIFFERENT number of students per access record, so
         the sweep sees a student with one experiment, a student with
         several, and a student with none — all at once. */
      p.exps.forEach(function (eid, j) {
        var targets = STUDENTS.slice(0, i === 0 ? (j === 0 ? 3 : 2) : 1)
          .map(function (x) { return x.id; });
        st.assignExperiment(TENANT, acc.id, eid, 'student', targets);
      });
      /* FACULTY REACH. A Faculty member reaches content through a
         MAPPING, never through course enrolment — so without one the
         whole Faculty workspace renders its (correct) empty state and
         the sweep never sees a populated Assessments, Question Bank,
         Reviews or Student Progress screen. Mapping the tenant's first
         Faculty member to each granted Course is what makes those
         screens reachable, and it grants no student anything. */
      var faculty = (st.facultyForTenant ? st.facultyForTenant(TENANT) : [])[0];
      if (faculty) {
        p.exps.forEach(function (eid) {
          var ctx = XRSLP.data.contextOf(eid);
          if (ctx && ctx.course) {
            st.mapFaculty(TENANT, faculty.id, acc.id, ctx.course.id, null);
          }
        });
      }

      made.push({ request: req.id, access: acc.id, experiments: p.exps });
    });

    var fac = (st.facultyForTenant ? st.facultyForTenant(TENANT) : [])[0];
    return {
      shape: shape,
      created: made,
      facultyMapped: fac ? { id: fac.id, name: fac.name,
        courses: (st.facultyScope ? (st.facultyScope(fac.id).courses || []).length : 0),
        experiments: (st.facultyExperimentIds ? st.facultyExperimentIds(fac.id).length : 0) } : null,
      perStudent: STUDENTS.map(function (x) {
        var rows = st.studentExperiments(x.id) || [];
        return { id: x.id, name: x.name, entitled: rows.filter(function (r) { return r.effective; }).length };
      })
    };
  }


  /* ============================================================
     INTERACTION CHECKS.

     The route sweep above renders every screen and audits the result.
     These go one step further and DRIVE a surface, because a few of the
     rules this product must hold are properties of an interaction
     rather than of a rendered page.

     Written against roles, names and visible text rather than internal
     ids, so a redesign that renames an id does not silently stop
     testing the rule it was written to protect.
     ============================================================ */

  function q(sel, root) { return (root || document).querySelector(sel); }
  function qa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function byText(sel, re, root) {
    return qa(sel, root).filter(function (el) { return re.test((el.textContent || '').trim()); })[0] || null;
  }

  /* ---- the Content Manager's return, and its two destinations ----
     THE RULE: the manager must CHOOSE. Nothing may be pre-selected, a
     reason is required either way, and nothing may be written to state
     until the confirmation is accepted. */
  function checkReturnPath() {
    var st = XRSLP.state;
    var out = { name: 'content-manager return path', checks: [], failures: [] };
    function assert(cond, label, detail) {
      out.checks.push({ label: label, pass: !!cond });
      if (!cond) { out.failures.push(label + (detail ? ' — ' + detail : '')); }
      return !!cond;
    }

    var mgr = (st.contentActors ? st.contentActors('manager') : []).filter(Boolean)[0] ||
              (st.contentActors ? st.contentActors() : []).filter(function (a) { return a.role === 'manager'; })[0];
    if (!mgr) { out.failures.push('no Content Manager actor in state'); return out; }

    var rec = st.contentRecords().filter(function (r) {
      return r.status === st.CONTENT_STATUS.CONTENT_REVIEW;
    })[0];
    if (!rec) { out.failures.push('no record at the content gate'); return out; }

    var statusBefore = rec.status;
    var historyBefore = (rec.history || []).length;

    nav('#/content/' + encodeURIComponent(mgr.id) + '/item/' + encodeURIComponent(rec.id));

    /* Find and press whatever opens the return, by its words. */
    var opener = byText('button, a.btn', /request changes|return|send back/i);
    if (!assert(!!opener, 'a control exists to request changes')) { return out; }
    opener.click();

    /* The surface may be a sheet, a dialog, or inline — the rule is the
       same wherever it renders. */
    var surface = q('.sheet') || q('.dialog') || q('#f-cm-dest') || document;
    var radios = qa('input[type=radio][name="cm-dest"]', surface);
    assert(radios.length >= 2, 'both destinations are offered', radios.length + ' found');
    assert(radios.filter(function (r) { return r.checked; }).length === 0,
      'NO DESTINATION IS PRE-SELECTED');

    /* A reason is required. Choose a destination, leave the reason
       empty, submit — and nothing may move. */
    if (radios.length) { radios[0].click(); }
    var submit = byText('button', /send to|request changes|confirm/i, surface);
    if (submit) { submit.click(); }
    var after = st.contentRecord(rec.id);
    assert(after.status === statusBefore, 'AN EMPTY REASON WRITES NOTHING');
    assert((after.history || []).length === historyBefore, 'and adds no history entry');

    /* Close whatever is open, without confirming. */
    var closer = q('[data-sheet-cancel], [data-dlg-cancel], [data-sheet-x], [data-dlg-x]');
    if (closer) { closer.click(); }
    var afterClose = st.contentRecord(rec.id);
    assert(afterClose.status === statusBefore, 'AND CANCELLING WRITES NOTHING EITHER');

    return out;
  }

  /* ---- Student Home never offers the same experiment twice ----
     The defect this pass exists to fix, asserted against the rendered
     DOM at every entitlement count the product can produce. */
  function checkStudentHomeNoDuplicates() {
    var st = XRSLP.state;
    var out = { name: 'student home — one action per experiment', checks: [], failures: [] };
    function assert(cond, label, detail) {
      out.checks.push({ label: label, pass: !!cond });
      if (!cond) { out.failures.push(label + (detail ? ' — ' + detail : '')); }
    }

    st.people().filter(function (p) { return p.role === 'student'; }).forEach(function (s) {
      nav('#/learn/' + encodeURIComponent(s.id) + '/home');
      var main = document.getElementById('main-content') || document.body;
      var btns = qa('a.btn[href*="/experiment/"]', main).filter(function (a) {
        return !/simulation|assessment/.test(a.getAttribute('href') || '');
      });
      var counts = {};
      btns.forEach(function (b) {
        var h = b.getAttribute('href');
        counts[h] = (counts[h] || 0) + 1;
      });
      var dupes = Object.keys(counts).filter(function (h) { return counts[h] > 1; });
      var entitled = (st.studentExperiments(s.id) || [])
        .filter(function (r) { return r.effective; }).length;
      var primaries = btns.filter(function (b) { return b.classList.contains('pri'); });

      assert(dupes.length === 0,
        s.name + ' (' + entitled + ' entitled): no experiment carries two controls',
        dupes.join(', '));
      assert(primaries.length <= 1,
        s.name + ' (' + entitled + ' entitled): at most ONE primary action',
        primaries.length + ' found');
      if (entitled === 0) {
        assert(primaries.length === 0,
          s.name + ': a student with nothing entitled gets NO dead primary action');
      }
    });
    return out;
  }

  /* ---- an overlay that opens another overlay keeps focus inside it ----
     THE REGRESSION THIS EXISTS TO CATCH. Restoring focus after a
     close-callback is correct when that callback re-renders the page.
     It is WRONG when the callback opens another overlay: the old
     overlay then pulls focus back to the element behind the new one,
     outside its focus trap, with the modal still covering the screen.
     Cancelling the Content Manager's return confirmation does exactly
     that — it reopens the return sheet. */
  function checkOverlayHandoff() {
    var ui = XRSLP.ui;
    var out = { name: 'overlay focus handoff', checks: [], failures: [] };
    function assert(cond, label, detail) {
      out.checks.push({ label: label, pass: !!cond });
      if (!cond) { out.failures.push(label + (detail ? ' — ' + detail : '')); }
    }

    nav('#/');
    var anchor = q('a[href]');
    if (anchor) { anchor.focus(); }

    /* A dialog whose CANCEL opens a sheet — the shape of the real flow. */
    ui.openDialog({
      title: 'Handoff probe',
      bodyHTML: '<p>probe</p>',
      onCancel: function () {
        ui.openSheet({ title: 'Reopened panel', bodyHTML: '<input id="handoff-probe" value="x">' });
      }
    });
    assert(!!q('.dialog'), 'the dialog opened');
    var cancel = q('[data-dlg-cancel]');
    if (cancel) { cancel.click(); }

    var sheet = q('.sheet');
    assert(!!sheet, 'cancelling opened the sheet');
    if (sheet) {
      assert(sheet.contains(document.activeElement),
        'FOCUS STAYED INSIDE THE REOPENED SHEET',
        'focus is on ' + (document.activeElement && document.activeElement.tagName) +
        ' "' + ((document.activeElement && document.activeElement.textContent) || '').trim().slice(0, 30) + '"');
      var closer = q('[data-sheet-cancel], [data-sheet-x]');
      if (closer) { closer.click(); }
    }
    assert(!q('.sheet') && !q('.dialog'), 'and everything closed cleanly');
    return out;
  }

  /* ---- the support attachment, driven ----
     The state layer's own tests cover normalisation and the quota
     guard. This covers the part only a browser can: that the picker
     produces a real reduced preview from a real file, that Remove
     clears it, and that the report submits carrying it. */
  async function checkSupportMedia() {
    var st = XRSLP.state;
    var out = { name: 'support media attachment', checks: [], failures: [] };
    function assert(cond, label, detail) {
      out.checks.push({ label: label, pass: !!cond });
      if (!cond) { out.failures.push(label + (detail ? ' — ' + detail : '')); }
      return !!cond;
    }

    var stu = st.people().filter(function (p) { return p.role === 'student'; })[0];
    if (!stu) { out.failures.push('no student in state'); return out; }
    nav('#/learn/' + encodeURIComponent(stu.id) + '/help');

    var input = document.getElementById('sp-media-i');
    if (!assert(!!input, 'the attach control is on the Help screen')) { return out; }
    assert(!!q('.dropsurface'), 'and it has a real choose surface');

    /* A genuine PNG, handed over exactly as a file picker would. */
    var c = document.createElement('canvas');
    c.width = 800; c.height = 500;
    var g = c.getContext('2d');
    g.fillStyle = '#2B3982'; g.fillRect(0, 0, 800, 500);
    var blob = await new Promise(function (r) { c.toBlob(r, 'image/png'); });
    var file = new File([blob], 'audit-evidence.png', { type: 'image/png' });
    var dt = new DataTransfer(); dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(function (r) { window.setTimeout(r, 500); });

    var thumb = q('#sp-media-picked img.mp-thumb');
    assert(!!thumb, 'choosing an image produces a PREVIEW');
    assert(!!thumb && thumb.src.length < st.SUPPORT_MEDIA.MAX_THUMB_BYTES,
      'and the preview is reduced, not the original',
      thumb ? thumb.src.length + ' bytes' : '');
    assert(/audit-evidence\.png/.test((q('#sp-media-picked .mp-n') || {}).textContent || ''),
      'the filename is shown');
    assert(!!document.getElementById('sp-media-x'), 'and it can be removed');

    /* Remove clears it, and nothing is left half-attached. */
    document.getElementById('sp-media-x').click();
    await new Promise(function (r) { window.setTimeout(r, 120); });
    assert(!q('#sp-media-picked img.mp-thumb'), 'REMOVE CLEARS THE ATTACHMENT');
    assert(input.files.length === 0, 'and clears the input');

    /* Re-attach and submit. */
    var dt2 = new DataTransfer(); dt2.items.add(file);
    input.files = dt2.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(function (r) { window.setTimeout(r, 500); });

    var before = st.supportTickets().length;
    document.getElementById('sp-category-i').value = st.SUPPORT_CATEGORIES[0].id;
    document.getElementById('sp-subject-i').value = 'UI audit — attachment';
    document.getElementById('sp-description-i').value = 'Submitted by the rendered-DOM audit.';
    document.getElementById('sp-form').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(function (r) { window.setTimeout(r, 400); });

    var made = st.supportTickets().slice(-1)[0];
    assert(st.supportTickets().length === before + 1, 'the report was created');
    assert(!!(made && made.media), 'AND IT CARRIES THE ATTACHMENT');
    assert(!!(made && made.media && made.media.thumb), 'including the preview');

    /* The reviewer sees the same evidence. */
    nav('#/platform/support/' + encodeURIComponent(made.id));
    assert(!!q('.tk-media'), 'THE SUPPORT REVIEWER SEES AN ATTACHED-MEDIA BLOCK');
    assert(!!q('.tk-media img.mp-thumb'), 'with the preview itself');
    return out;
  }


  /* ============================================================
     IMPLEMENTATION 09 — the three new flows, driven for real.

     Each of these asserts something the rendered DOM alone cannot:
     that pressing a control produced (or, more often, did NOT produce)
     a state change. The state-layer suite proves the rules; these prove
     that the screens actually reach them.
     ============================================================ */

  /* ---- the prototype Web runtime writes a real session, and nothing else does ---- */
  function checkPrototypeRuntime() {
    var st = XRSLP.state;
    var out = { name: 'prototype web runtime — a session is real, and opening a page is not',
                checks: [], failures: [] };
    function assert(cond, label, detail) {
      out.checks.push({ label: label, pass: !!cond });
      if (!cond) { out.failures.push(label + (detail ? ' — ' + detail : '')); }
    }

    /* Find a Student who can actually run a hosted technology. Nothing
       is fabricated: if the current state has no such Student the check
       reports that and asserts nothing it cannot see. */
    var target = null;
    st.people().filter(function (p) { return p.role === 'student'; }).forEach(function (s) {
      if (target) { return; }
      (st.studentExperiments(s.id) || []).forEach(function (row) {
        if (target || !row.effective) { return; }
        if ((row.technologies || []).indexOf('web') !== -1 &&
            st.studentCanRun(s.id, row.experimentId, 'web')) {
          target = { student: s, experimentId: row.experimentId };
        }
      });
    });
    if (!target) {
      out.checks.push({ label: 'no student holds a runnable Web technology in this state — skipped',
                        pass: true });
      return out;
    }

    var sid = target.student.id, eid = target.experimentId;
    var base = '#/learn/' + encodeURIComponent(sid) + '/experiment/' +
               encodeURIComponent(eid) + '/simulation/web';

    /* ── OPENING AND LEAVING THE PAGE MUST DO NOTHING ──────────── */
    var before = st.simulationUtilisation(sid, eid, 'web');
    var eventsBefore = st.runtimeEventsFor(sid, eid, 'web').length;
    nav(base + '/run');
    nav(base);
    nav(base + '/run');
    var afterOpen = st.simulationUtilisation(sid, eid, 'web');
    assert(st.runtimeEventsFor(sid, eid, 'web').length === eventsBefore,
      'OPENING THE RUNTIME PAGE WRITES NO EVENT — a page view is not a run');
    assert(afterOpen.launches === before.launches, 'and no launch is recorded');
    assert(afterOpen.completed === before.completed, 'and nothing is completed by arriving');

    /* ── STARTING OPENS A REAL SESSION ─────────────────────────── */
    nav(base + '/run');
    var start = document.getElementById('rt-start');
    assert(!!start, 'the runtime offers a start control');
    if (!start) { return out; }
    start.click();
    nav(base + '/run');
    var running = st.simulationUtilisation(sid, eid, 'web');
    assert(running.launches === before.launches + 1, 'STARTING RECORDS EXACTLY ONE LAUNCH');
    assert(running.sessionCount === before.sessionCount + 1, 'and exactly one session');
    assert(running.openSessions === 1, 'which is open');
    assert(running.completed === before.completed,
      'AND STARTING COMPLETES NOTHING — a launch is not a completion');
    assert(!!document.getElementById('rt-elapsed'), 'the elapsed clock is rendered while it runs');
    assert(!!document.getElementById('rt-done') && !!document.getElementById('rt-end'),
      'and both the finish and the end controls are offered');

    /* ── LEAVING WITHOUT ENDING LEAVES IT OPEN, NOT COMPLETE ────── */
    nav('#/learn/' + encodeURIComponent(sid) + '/home');
    nav(base + '/run');
    var left = st.simulationUtilisation(sid, eid, 'web');
    assert(left.openSessions === 1, 'LEAVING THE PAGE LEAVES THE SESSION OPEN');
    assert(left.completed === before.completed, 'and still completes nothing');
    assert(left.totalSeconds === before.totalSeconds,
      'AND AN OPEN SESSION RECORDS NO TIME — none was measured');

    /* ── FINISHING IS CONFIRMED, AND ONLY THEN COMPLETES ────────── */
    var done = document.getElementById('rt-done');
    assert(!!done, 'the finish control is offered while a session is open');
    if (done) {
      done.click();
      var scrim = document.querySelector('#dialog-root .scrim');
      assert(!!scrim, 'FINISHING ASKS FOR CONFIRMATION rather than acting immediately');
      var mid = st.simulationUtilisation(sid, eid, 'web');
      assert(mid.completed === before.completed,
        'AND WRITES NOTHING WHILE THE DIALOG IS OPEN');
      if (scrim) {
        var dlg = scrim.querySelector('[role="dialog"]') || scrim.firstElementChild;
        assert(!!dlg && dlg.getAttribute('aria-modal') === 'true',
          'the confirmation is a real modal dialog');
        var ok = qa('button', scrim).filter(function (b) {
          return /report it as completed/i.test(b.textContent);
        })[0];
        assert(!!ok, 'and offers the completion action');
        if (ok) {
          ok.click();
          nav(base + '/run');
          var finished = st.simulationUtilisation(sid, eid, 'web');
          assert(finished.completed === true, 'CONFIRMING RECORDS THE COMPLETION');
          assert(finished.openSessions === 0, 'and closes the session');
          assert(finished.totalSeconds >= 0, 'and the session contributes a non-negative duration');
          /* The other technologies of the same Experiment are untouched. */
          (st.studentEntitledTechnologies(sid, eid) || []).forEach(function (t) {
            if (t === 'web') { return; }
            assert(st.simulationUtilisation(sid, eid, t).completed === false,
              'AND COMPLETES NO OTHER TECHNOLOGY: ' + t + ' is untouched');
          });
        }
      }
    }
    return out;
  }

  /* ---- question import writes nothing until it is confirmed ---- */
  function checkQuestionImport() {
    var st = XRSLP.state;
    var out = { name: 'question import — nothing is written before the confirmation',
                checks: [], failures: [] };
    function assert(cond, label, detail) {
      out.checks.push({ label: label, pass: !!cond });
      if (!cond) { out.failures.push(label + (detail ? ' — ' + detail : '')); }
    }

    var fac = null;
    st.people().filter(function (p) { return p.role === 'faculty'; }).forEach(function (f) {
      if (!fac && (st.facultyExperimentIds(f.id) || []).length) { fac = f; }
    });
    if (!fac) {
      out.checks.push({ label: 'no faculty member has mapped content in this state — skipped', pass: true });
      return out;
    }
    var eid = st.facultyExperimentIds(fac.id)[0];
    var before = st.questionsForFaculty(fac.id).length;

    nav('#/faculty/' + encodeURIComponent(fac.id) + '/questions');
    var importLink = qa('a.btn', document.getElementById('main-content') || document.body)
      .filter(function (a) { return /import questions/i.test(a.textContent); })[0];
    assert(!!importLink, 'the Question Bank offers Import questions beside Add and Draft');

    nav('#/faculty/' + encodeURIComponent(fac.id) + '/questions/import');
    var sel = document.getElementById('qi-exp');
    var file = document.getElementById('qi-file');
    assert(!!sel, 'the import screen asks for the course and experiment');
    assert(!!file, 'and offers a file control');
    assert(!!file && file.disabled,
      'WHICH IS DISABLED UNTIL A CONTEXT IS CHOSEN — the file cannot choose the experiment');
    assert(!!sel && qa('option', sel).length - 1 === (st.facultyExperimentIds(fac.id) || []).length,
      'and offers exactly the experiments mapped to this faculty member');

    /* Drive the validator through the SAME entry point the screen uses,
       then assert the bank has not moved. */
    var csv = XRSLP.csv.toCsv(XRSLP.questionImport.templateRows());
    var res = XRSLP.questionImport.validate('csv', csv,
      { experimentId: eid, facultyPersonId: fac.id });
    assert(res.ok === true, 'the template validates');
    assert(st.questionsForFaculty(fac.id).length === before,
      'VALIDATION WRITES NOTHING — the bank is untouched');

    /* An out-of-scope experiment is refused before a row is read. */
    var outside = null;
    var mine = st.facultyExperimentIds(fac.id);
    (st.contentRecords ? st.contentRecords() : []).forEach(function (r) {
      if (!outside && r.status === st.CONTENT_STATUS.PUBLISHED && mine.indexOf(r.id) === -1) {
        outside = r.id;
      }
    });
    if (outside) {
      var bad = XRSLP.questionImport.validate('csv', csv,
        { experimentId: outside, facultyPersonId: fac.id });
      assert(bad.ok === false && bad.rows.length === 0,
        'AN OUT-OF-SCOPE EXPERIMENT IS REFUSED BEFORE A ROW IS READ');
      assert(XRSLP.questionImport.commit(bad, fac.tenantId, fac.id).created === 0,
        'and committing it writes nothing');
    }

    /* A blocked file cannot be committed. */
    var badCsv = csv + '\nmultiple_choice,"Broken row",OnlyOne,,,,z,0,';
    var blocked = XRSLP.questionImport.validate('csv', badCsv,
      { experimentId: eid, facultyPersonId: fac.id });
    assert(blocked.ok === false, 'one bad row blocks the whole file');
    assert(XRSLP.questionImport.commit(blocked, fac.tenantId, fac.id).created === 0,
      'AND COMMITTING A BLOCKED FILE WRITES NOTHING — no partial import');
    assert(st.questionsForFaculty(fac.id).length === before, 'the bank is still untouched');
    return out;
  }

  /* ---- a published artefact is not editable in place ---- */
  function checkPublishedEditGuard() {
    var st = XRSLP.state;
    var out = { name: 'content manager — a published artefact is not rewritten in place',
                checks: [], failures: [] };
    function assert(cond, label, detail) {
      out.checks.push({ label: label, pass: !!cond });
      if (!cond) { out.failures.push(label + (detail ? ' — ' + detail : '')); }
    }

    var manager = (st.contentActors ? st.contentActors() : [])
      .filter(function (a) { return a.role === 'manager'; })[0];
    var rec = (st.contentRecords ? st.contentRecords() : []).filter(function (r) {
      return r.status === st.CONTENT_STATUS.PUBLISHED && st.managerCanEditDelivery(r, manager && manager.id) &&
        (r.technologies || []).indexOf('web') !== -1;
    })[0];
    if (!manager || !rec) {
      out.checks.push({ label: 'no published web record in this manager’s scope — skipped', pass: true });
      return out;
    }

    var liveUrl = st.deliverySummaryFor(rec, 'web');
    var liveLabel = rec.versionLabel;
    nav('#/content/' + encodeURIComponent(manager.id) + '/item/' + encodeURIComponent(rec.id));
    var main = document.getElementById('main-content') || document.body;
    var text = main.innerText || '';

    assert(/material change becomes a version/i.test(text),
      'the screen states that a material change on published content becomes a version');
    assert(!/creates no new version and grants nobody access/i.test(text),
      'AND NO LONGER CLAIMS THE OPPOSITE — the pre-publication footnote is not shown here');

    var openVer = st.openVersionForRecord(rec.id);
    var save = document.getElementById('dl-save-0');
    if (openVer && st.managerCanReviseVersion(openVer, manager.id)) {
      /* ⚠ TWO DIFFERENT BLOCKED CASES, and this used to assert only
         one. When the open candidate is this manager's OWN correction
         and still theirs to change, the editor REVISES it rather than
         refusing — otherwise a correction a reviewer returned could
         only be re-sent unchanged and would block the experiment for
         good. A save control is correct here, and it must say what it
         actually does. */
      assert(!!save, 'a correction this manager may still revise offers a save control');
      assert(!!save && /update your correction/i.test(save.textContent),
        'AND IT SAYS IT UPDATES THE CORRECTION rather than promising a direct write');
      assert(!!document.getElementById('dl-ver-0'),
        'and the version label is carried on the form');
    } else if (openVer) {
      assert(!save, 'a version somebody ELSE holds offers no save control at all');
    } else {
      assert(!!save && /correction version/i.test(save.textContent),
        'the save control names what it will actually do');
      assert(!!document.getElementById('dl-ver-0'),
        'and a new version label is asked for');
    }

    /* The state layer refuses regardless of what the screen offers. */
    assert(st.managerUpdateDelivery(manager.id, rec.id, 'web',
      { url: 'https://example.org/audit-probe' }, 'UI audit probe.') === null,
      'THE IN-PLACE WRITER REFUSES A MATERIAL CHANGE, whatever the screen does');
    assert(st.deliverySummaryFor(st.contentRecord(rec.id), 'web') === liveUrl,
      'and the live delivery reference is unchanged');
    assert(st.contentRecord(rec.id).versionLabel === liveLabel,
      'and so is the published version label');
    return out;
  }

  async function interactions() {
    var startHash = window.location.hash;
    var results = [checkStudentHomeNoDuplicates(), checkReturnPath(), checkOverlayHandoff(),
                   await checkSupportMedia(),
                   /* Implementation 09 — the three new flows, driven for real. */
                   checkPrototypeRuntime(), checkQuestionImport(), checkPublishedEditGuard()];
    window.location.hash = startHash || '#/';
    var failures = results.reduce(function (n, r) { return n + r.failures.length; }, 0);
    var checks = results.reduce(function (n, r) { return n + r.checks.length; }, 0);
    return { checks: checks, failures: failures, results: results };
  }

  return {
    run: run,
    build: build,
    interactions: interactions,
    begin: begin,
    step: step,
    finish: finish,
    routes: routes,
    auditCurrent: auditCurrent,
    overflowOffenders: overflowOffenders,
    contrastFailures: contrastFailures,
    devClutter: devClutter,
    WIDTHS: WIDTHS,
    last: null
  };
})();
