/* ============================================================
   Unified Functional Platform — CONTENT MANAGER workspace
   (Implementation 05).

   `Content Manager` is one of the seven formal roles (STK31-01).

   What this role OWNS (STK31-06 / STK31-08 / STK31-09):
     · the Content Library
     · content readiness review, and request changes (PM-14)
     · THE FIRST PUBLICATION of a new Experiment
     · canonical content metadata

   ⚠ THE TERMINOLOGY FIREWALL (STK31-07). The action on this plane is
   PUBLISH, and it is the FIRST publication of a NEW Experiment.
   RELEASE and HOLD are the SUPER ADMIN's actions on a LATER VERSION of
   an already-published Experiment — a different object, a different
   owner and a different decision. That workflow IS built (a Vendor
   proposes it, an Academic Reviewer approves it, and the SUPER ADMIN
   releases or holds it), and it is built somewhere else. Neither word
   appears as an action anywhere in this workspace: later versions are
   listed here read-only, and no control over them exists on this plane.

   ── IMPLEMENTATION 07.3, STAKEHOLDER CORRECTIONS ─────────────
   R15 · RETURNING AN ITEM HAS TWO DESTINATIONS, and the person
   returning it chooses which. *"If you click the request, there should
   be 2 options available. One is academic reviewer and one is vendor."*
   An academic / content problem is the Academic Reviewer's to resolve;
   a technical, application or delivery problem is the Vendor's. Sending
   a broken link back through academic review fixes nothing, which is the
   exact waste the stakeholder named. The destination is therefore an
   EXPLICIT choice with no pre-selected default, and what each one causes
   is stated before it is taken — twice: live in the card, and again in
   the confirmation.

   R14 · A change request may carry supporting references (a link, or the
   name of a file), and past ones show what was attached.

   R16 · THE DELIVERY REFERENCE IS EDITABLE BY THIS ROLE. *"Content
   manager should have the provision to edit the link … if he wants to
   delete and replace the link also he can replace it."* The Vendor
   stays the supplier and owner of the technical submission; what this
   role may correct is the REFERENCE the platform holds for a technology
   the record already carries. A reason is mandatory and every edit is
   written to the item's history with what it was and what it became.

   What this role CANNOT do:
     · publish an item that carries no academic approval. The guard is
       in `state.publishContent()`, not in this screen, so a
       hand-driven action fails the same way.
     · add or remove a TECHNOLOGY on a record. Correcting the reference
       for a technology already on the submission is not the same act as
       widening the submission, and widening it here would hand an
       institution a technology nobody reviewed.
     · re-mark Learning Outcomes. They are academically owned
       (STK31-08); this workspace reads them.
     · release or hold a later version (STK31-07 — Super Admin).
     · grant tenant access, alter a licence or assign a student.
       Publishing writes ONLY the content record.
     · mark a Student's descriptive answer — that is Faculty
       (STK31-31).
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
  var cui = XRSLP.contentUI;
  var href = cui.href;
  var CS = state.CONTENT_STATUS;
  var DEST = state.CHANGE_DESTINATION;

  var libFilter = { status: 'all', q: '', course: 'all', tech: 'all' };

  /* WHICH DELIVERY EDITOR IS OPEN, remembered across a re-render so a
     refused save does not fold the panel the person was working in and
     lose the reason they had typed a validation message about. Keyed by
     record as well as technology: opening another item must not inherit
     the previous item's open panel. */
  var deliveryOpen = { recordId: null, tech: null };

  /* The Course-code route. `content-ui.js` owns the shared href table
     for all three content roles and is not this file's to extend, so
     the one route this workspace adds is built here — in exactly the
     shape the rest of the content plane uses, and matching the pattern
     the router already resolves for it. */
  function coursesHref(actorId) {
    return '#/content/' + encodeURIComponent(actorId) + '/courses';
  }

  function resolveActor(params) {
    var a = state.contentActor(params.actorId);
    if (!a || a.role !== state.CONTENT_ROLE.MANAGER) { return null; }
    return a;
  }

  function shell(actor, navKey, title, html, after) {
    return { title: title, html: html, area: 'content', navKey: navKey, contentActor: actor, after: after };
  }

  /* WHERE A RETURNED ITEM COMES BACK TO is not a fixed fact, so the
     screens that state it must read the live answer. `submitContent()`
     fails closed on exactly this test: an approval that cannot be shown
     to describe the work being resubmitted is withdrawn, and the
     submission goes back through academic review instead of returning to
     this gate. A canonical-metadata correction here — the Content
     Manager's own authority, STK31-09 — is enough to make that true, and
     while the copy promised the return unconditionally it described a
     path the state layer would not take. */
  function approvalStillDescribes(rec) {
    var fp = rec && rec.academicReview && rec.academicReview.fingerprint;
    return typeof fp === 'string' && fp === state.academicFingerprint(rec);
  }

  /* A Content Manager whose role scope has been withdrawn — or who was
     never given one — reaches an entirely empty workspace, and an empty
     workspace with no explanation reads as a broken prototype rather
     than as governance working. The Vendor and the Academic Reviewer
     both name the reason on their own planes; this says the same thing
     here, on every screen the emptiness reaches. Withdrawing a scope
     never destroys anything: what it removes is reach. */
  function scopeGapNote(actor) {
    if (state.assignmentsFor(actor.id).length) { return ''; }
    return ui.alertBox('warning', 'No role scope is assigned to you',
      '<p>A Content Manager works inside an assigned scope, and no assignment is in force for this identity. ' +
      'The Content Library, the publication queue and the counts on this page are therefore empty — nothing ' +
      'has been deleted, and nothing has been published or unpublished.</p>' +
      '<p>Content role scope is assigned and withdrawn by the Super Admin, on the Role governance screen.</p>');
  }

  XRSLP.screens.managerHome = function () {
    var chosen = state.protoManager();
    if (chosen) { return { redirect: href.mOverview(chosen.id) }; }
    return {
      title: 'Content Manager workspace',
      area: 'content', navKey: 'overview', contentActor: null,
      html: cui.chooserScreen('manager', {
        title: 'Content Manager workspace',
        actionLabel: 'Open workspace',
        metaHTML: 'Choose which sample Content Manager identity to view the Content Library as.'
      }),
      after: function () {
        Array.prototype.slice.call(document.querySelectorAll('[data-actor]')).forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = btn.getAttribute('data-actor');
            state.setProtoManager(id);
            XRSLP.router.go(href.mOverview(id));
          });
        });
      }
    };
  };

  /* ---------------- Overview ----------------
     No engagement metric, no quality score, no usage rating: none is in
     any source, and usage analytics belong to a different slice. */
  XRSLP.screens.managerOverview = function (params) {
    var actor = resolveActor(params);
    if (!actor) { return XRSLP.screens.notFound(); }
    var o = state.managerOverview(actor.id);

    /* 07.3 — THE TWO RETURN DESTINATIONS ARE COUNTED SEPARATELY, because
       they are held by different people. An item this role sent back to
       the Academic Reviewer is with the REVIEWER: the Vendor has not been
       asked for anything and the submission has not reopened for editing.
       `managerOverview()` deliberately keeps it out of `withVendor`, and
       folding the two together here would undo that and tell the Content
       Manager the wrong person is holding their work. */
    var tiles = '<div class="statgrid">' +
      cui.statTile(o.published, 'Published experiments', 'in the Content Library') +
      cui.statTile(o.awaitingPublication, 'Awaiting publication', 'academically approved') +
      cui.statTile(o.inAcademicReview, 'In academic review', 'with an Academic Reviewer') +
      cui.statTile(o.returnedToReviewer, 'Returned for academic re-check',
        'sent back by you — with an Academic Reviewer') +
      cui.statTile(o.withVendor, 'With a Vendor', 'draft or returned for correction') +
      '</div>' +
      '<p class="dnote" style="margin-top:8px">' + ui.ic('info', 'sm') +
      'An item you returned to the Academic Reviewer is counted under <strong>Returned for academic ' +
      're-check</strong> and never under <strong>With a Vendor</strong> — the reviewer is holding it and the ' +
      'Vendor has not been asked for anything. Nothing is counted twice.</p>';

    var attnHTML = o.queue.length
      ? '<div class="attn">' + o.queue.map(function (r) {
          var ready = state.publishReadiness(r);
          return '<div class="at-row ' + (ready.ok ? '' : 'warn') + '"><span class="at-ic">' +
            ui.ic(ready.ok ? 'layers' : 'alert') + '</span>' +
            '<div class="at-body"><div class="at-t">' + esc(r.name) + '</div>' +
            '<p>' + cui.contextLine(r) +
            (r.academicReview ? ' · academically approved by ' + esc(r.academicReview.reviewerName) : '') +
            (ready.ok ? '' : ' · ' + ready.blockers.length + ' ' +
              util.plural(ready.blockers.length, 'item') + ' to resolve before publishing') +
            '</p></div>' +
            '<a class="btn sec sm" href="' + href.mRecord(actor.id, r.id) + '">Open</a></div>';
        }).join('') + '</div>'
      : ui.emptyState({
          icon: 'check', heading: 'h3',
          title: 'Nothing is awaiting publication',
          body: 'No academically approved submission is waiting for a publication decision.'
        });

    var coverHTML = o.technologyCoverage.length
      ? '<ul class="techmetrics">' + o.technologyCoverage.map(function (row) {
          return '<li>' + ui.fmtBadge(row.tech) +
            '<span class="tm-v">' + row.count + '</span>' +
            '<span class="tm-n">published ' + esc(util.plural(row.count, 'experiment')) + '</span></li>';
        }).join('') + '</ul>'
      : '<p class="muted">No published experiment carries a technology yet.</p>';

    var html =
      ui.phead('Overview', esc(actor.name) + ' · Content Manager') +
      scopeGapNote(actor) +
      tiles +
      '<div class="grid-rail" style="margin-top:18px">' +
      '<div class="stack">' + ui.card('Awaiting a publication decision', attnHTML) + '</div>' +
      '<div class="stack">' +
      ui.card('Technology coverage', coverHTML,
        'Derived from published content') +
      /* 07.3 R15 — said on the overview as well as at the gate, because
         the split is the thing the stakeholder asked for and the person
         should meet it before they are standing in front of the choice. */
      ui.card('Returning an item — two destinations',
        '<p>When an item at your gate is not publishable, <strong>you choose who it goes back to</strong>. ' +
        'There is no default, because the two answers reach different people and fix different problems.</p>' +
        '<ul class="reslist plain" style="margin-top:10px">' +
        '<li>' + ui.ic('book') + '<span><strong>The Academic Reviewer</strong> — an academic or content issue: ' +
        'the Learning Outcomes, the description, whether the experiment teaches what it claims. The Vendor is ' +
        'not involved and the submission does not reopen for editing.</span></li>' +
        '<li>' + ui.ic('monitor') + '<span><strong>The Vendor</strong> — a technical, application or delivery ' +
        'issue: the app not working, a package that will not install, a broken hosted link, a delivery ' +
        'discrepancy. The submission reopens for them to correct and resubmit.</span></li>' +
        '</ul>' +
        '<p class="cardfoot">A broken link sent back through academic review fixes nothing, and an Academic ' +
        'Reviewer cannot rebuild a package. Choosing the wrong one costs a round trip, so each choice states ' +
        'what it causes before you take it.</p>') +
      ui.card('What publishing does — and does not do',
        '<p><strong>Publish</strong> makes a new Experiment part of the published catalogue: discoverable by ' +
        'the public and selectable in an institutional request.</p>' +
        '<ul class="blocklist" style="margin-top:10px">' +
        '<li>It grants the experiment to <strong>no</strong> institution.</li>' +
        '<li>It changes <strong>no</strong> existing licence or access record.</li>' +
        '<li>It assigns the experiment to <strong>no</strong> student.</li>' +
        '</ul>' +
        '<p style="margin-top:10px">An institution still requests it and the Super Admin still approves that ' +
        'request; a Tenant Admin still assigns it before any student can see it.</p>') +
      '</div></div>';

    return shell(actor, 'overview', 'Content Manager overview', html);
  };

  /* ---- WHAT THIS CONTENT MANAGER HAS ALREADY DECIDED, OUTSIDE THEIR
     CURRENT SCOPE ----
     The Content Library is scope-filtered, so an Experiment published
     under a scope the Super Admin has since withdrawn simply vanished
     from this workspace. The build's own rule is that WITHDRAWING
     AUTHORITY NEVER DESTROYS HISTORY (`STK31-41`) — the same rule the
     Vendor and the Academic Reviewer already follow: future authority
     goes, the record of what you did stays readable.

     STRICTLY READ-ONLY, and it grants nothing. `contentForManager` is
     unchanged, every mutation still asks `managerCanAct`, and there is
     no link to an editor here — only the fact that the work exists and
     what became of it. */
  function historyOutsideScope(actor, inScope) {
    var seen = {};
    inScope.forEach(function (r) { seen[r.id] = true; });
    var rows = state.actorHistoricalRecordIds(actor.id)
      .filter(function (id) { return !seen[id]; })
      .map(function (id) { return state.contentRecord(id); })
      .filter(function (r) { return !!r; });
    if (!rows.length) { return ''; }
    return ui.card('Outside your current scope \u2014 what you have already decided',
      '<p class="muted" style="margin:0 0 10px">These Experiments are no longer inside your assigned scope, so ' +
      'they are not in the library above and you cannot act on them. <strong>Nothing has been deleted</strong> ' +
      'and a published Experiment stays published \u2014 this is the record of your own decisions, kept readable. ' +
      'If a scope is restored, the Experiments under it return to the library.</p>' +
      '<div class="tscroll"><table class="dt">' +
      '<caption class="sr-only">Experiments this Content Manager has acted on that are outside their current scope</caption>' +
      '<thead><tr><th scope="col">Experiment</th><th scope="col">Programme / Course</th>' +
      '<th scope="col">Status</th><th scope="col">Your decision</th></tr></thead><tbody>' +
      rows.map(function (r) {
        var pub = state.publicationFor(r.id);
        var mine = pub && pub.publishedBy === actor.id;
        return '<tr>' +
          '<td data-label="Experiment"><span class="tmain">' + esc(r.name) + '</span>' +
          '<span class="tsub">' + esc(r.id) + '</span></td>' +
          '<td data-label="Programme / Course">' + cui.contextLine(r) + '</td>' +
          '<td data-label="Status">' + cui.statusBadge(r) + '</td>' +
          '<td data-label="Your decision">' + (mine
            ? 'Published by you ' + esc(util.fmtDate(pub.publishedAt))
            : '<span class="muted">Recorded on the Experiment&rsquo;s own history</span>') + '</td>' +
          '</tr>';
      }).join('') + '</tbody></table></div>', null, 'h2');
  }

  /* ---------------- Content Library ----------------
     The platform-level canonical library, over the SAME content source
     the public catalogue consumes. There is no second CMS catalogue. */
  XRSLP.screens.managerLibrary = function (params) {
    var actor = resolveActor(params);
    if (!actor) { return XRSLP.screens.notFound(); }
    var all = state.contentForManager(actor.id);

    if (!all.length) {
      return shell(actor, 'library', 'Content Library',
        ui.phead('Content Library', esc(actor.name)) +
        scopeGapNote(actor) +
        '<div class="tablecard">' + ui.emptyState({
          icon: 'layers',
          title: 'The Content Library is empty',
          /* HONEST ABOUT WHAT IS MISSING, not silent about it. This
             library is scope-filtered, so an Experiment this Content
             Manager published under a scope since withdrawn is absent
             from it. Withdrawing authority never destroys history — the
             record still exists and stays published — but this workspace
             has no read model that would show it here, so the screen
             says so rather than implying the work is gone. */
          body: 'No content exists inside your assigned scope. Assigned scope: ' +
            state.actorScopeText(actor.id) + '. An experiment you published under a scope you no longer ' +
            'hold still exists and stays published; it is simply not in reach from here while the scope ' +
            'is withdrawn.'
        }) + '</div>');
    }

    cui.normaliseFilters(all, libFilter);
    var html =
      ui.phead('Content Library',
        esc(all.filter(function (r) { return r.status === CS.PUBLISHED; }).length) + ' published · ' +
        esc(all.length) + ' total in your scope') +
      '<div class="tablecard">' +
      '<div class="listbar">' +
      '<label for="m-q">Search<input type="text" id="m-q" class="cellinput" ' +
      'placeholder="Experiment or course" value="' + esc(libFilter.q) + '"></label>' +
      '<label for="m-status">Status<select id="m-status">' +
      cui.statusFilterOptions(all, libFilter.status) + '</select></label>' +
      '<label for="m-course">Course<select id="m-course">' +
      cui.courseFilterOptions(all, libFilter.course) + '</select></label>' +
      '<label for="m-tech">Technology<select id="m-tech">' +
      cui.techFilterOptions(all, libFilter.tech) + '</select></label>' +
      '<span class="lcount" id="m-count"></span>' +
      '</div>' +
      '<div class="tscroll"><table class="dt" id="m-table">' +
      '<caption class="sr-only">The canonical Content Library — published and pipeline content</caption>' +
      '<thead><tr>' +
      '<th scope="col">Experiment</th><th scope="col">Programme / Course</th>' +
      '<th scope="col">Technologies</th><th scope="col">Version</th>' +
      /* 07.3 — duplicate of Status; see js/screens/vendor.js. */
      '<th scope="col">Status</th>' +
      '<th scope="col"><span class="sr-only">Actions</span></th>' +
      '</tr></thead><tbody id="m-rows"></tbody></table></div>' +
      '<div id="m-empty"></div></div>' +
      historyOutsideScope(actor, all);

    return shell(actor, 'library', 'Content Library', html, function () {
      var rowsEl = document.getElementById('m-rows');
      var emptyEl = document.getElementById('m-empty');
      var countEl = document.getElementById('m-count');
      var tableEl = document.getElementById('m-table');

      function paint() {
        var rows = all.filter(function (r) { return cui.matchesFilters(r, libFilter); });
        rowsEl.innerHTML = rows.map(function (r) {
          return '<tr>' +
            '<td data-label="Experiment"><a href="' + href.mRecord(actor.id, r.id) + '">' + esc(r.name) + '</a>' +
            (r.origin === 'seed' ? '<div class="muted">Existing published content</div>' : '') + '</td>' +
            '<td data-label="Programme / Course">' + cui.contextLine(r) + '</td>' +
            '<td data-label="Technologies">' + (r.technologies.length
              ? ui.techBadges(r.technologies) : '<span class="muted">None</span>') + '</td>' +
            '<td data-label="Version">' + esc(r.versionLabel || '—') + '</td>' +
            '<td data-label="Status">' + cui.statusBadge(r) + '</td>' +
            '<td class="cell-actions"><a class="btn sec sm" href="' + href.mRecord(actor.id, r.id) +
            '">Open</a></td></tr>';
        }).join('');
        countEl.textContent = rows.length + ' of ' + all.length + ' ' + util.plural(all.length, 'item');
        if (!rows.length) {
          tableEl.setAttribute('hidden', 'hidden');
          emptyEl.innerHTML = ui.emptyState({
            icon: 'search',
            title: 'No content matches',
            body: 'No item in the Content Library matches the current search and filters.',
            actionsHTML: '<button class="btn sec" type="button" id="m-clear">Clear search &amp; filters</button>'
          });
          var clear = document.getElementById('m-clear');
          if (clear) {
            clear.addEventListener('click', function () {
              libFilter.q = ''; libFilter.status = 'all'; libFilter.course = 'all'; libFilter.tech = 'all';
              XRSLP.render(false);
            });
          }
        } else {
          tableEl.removeAttribute('hidden');
          emptyEl.innerHTML = '';
        }
      }
      [['m-q', 'q'], ['m-status', 'status'], ['m-course', 'course'], ['m-tech', 'tech']].forEach(function (pair) {
        var el = document.getElementById(pair[0]);
        if (!el) { return; }
        el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', function () {
          libFilter[pair[1]] = el.value; paint();
        });
      });
      paint();
    });
  };

  /* ---------------- Publication queue ---------------- */
  XRSLP.screens.managerQueue = function (params) {
    var actor = resolveActor(params);
    if (!actor) { return XRSLP.screens.notFound(); }
    var queue = state.contentForManager(actor.id, { queue: true });

    if (!queue.length) {
      return shell(actor, 'queue', 'Publication queue',
        ui.phead('Publication queue', esc(actor.name)) +
        scopeGapNote(actor) +
        '<div class="tablecard">' + ui.emptyState({
          icon: 'layers',
          title: 'Nothing is awaiting publication',
          body: 'An item appears here once an Academic Reviewer has approved it academically. Until then it is ' +
            'with the Vendor or with the Academic Reviewer.',
          actionsHTML: '<a class="btn sec" href="' + href.mLibrary(actor.id) + '">Open the Content Library</a>'
        }) + '</div>');
    }

    var rows = queue.map(function (r) {
      var ready = state.publishReadiness(r);
      var vendor = r.createdBy ? state.contentActor(r.createdBy) : null;
      return '<tr>' +
        '<td data-label="Experiment"><a href="' + href.mRecord(actor.id, r.id) + '">' + esc(r.name) + '</a></td>' +
        '<td data-label="Programme / Course">' + cui.contextLine(r) + '</td>' +
        '<td data-label="Vendor">' + (vendor ? esc(vendor.name) : '<span class="muted">—</span>') + '</td>' +
        '<td data-label="Academic approval">' + (r.academicReview
          ? esc(r.academicReview.reviewerName) + '<div class="muted">' +
            esc(util.fmtDate(r.academicReview.at)) + '</div>'
          : ui.badge('b-danger', 'alertCirc', 'None')) + '</td>' +
        '<td data-label="Technologies">' + ui.techBadges(r.technologies) + '</td>' +
        '<td data-label="Version">' + esc(r.versionLabel || '—') + '</td>' +
        '<td data-label="Readiness">' + (ready.ok
          ? ui.badge('b-success', 'check', 'Ready to publish')
          : ui.badge('b-warning', 'alert', ready.blockers.length + ' to resolve')) + '</td>' +
        '<td class="cell-actions"><a class="btn sec sm" href="' + href.mRecord(actor.id, r.id) +
        '">Open</a></td></tr>';
    }).join('');

    var html =
      ui.phead('Publication queue',
        esc(queue.length) + ' academically approved ' + esc(util.plural(queue.length, 'item')) +
        ' awaiting a first publication decision') +
      ui.alertBox('info', 'First publication only',
        '<p>Items here are new Experiments reaching the catalogue for the first time. Replacing an ' +
        'already-published Experiment with a newer version is a separate Super Admin decision on a different ' +
        'object and does not appear in this queue.</p>') +
      '<div class="tablecard" style="margin-top:16px">' +
      '<div class="tscroll"><table class="dt">' +
      '<caption class="sr-only">Academically approved items awaiting first publication</caption>' +
      '<thead><tr>' +
      '<th scope="col">Experiment</th><th scope="col">Programme / Course</th><th scope="col">Vendor</th>' +
      '<th scope="col">Academic approval</th><th scope="col">Technologies</th><th scope="col">Version</th>' +
      '<th scope="col">Readiness</th><th scope="col"><span class="sr-only">Actions</span></th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div></div>';

    return shell(actor, 'queue', 'Publication queue', html);
  };

  /* ============================================================
     R15 — THE RETURN PATH, AND ITS TWO DESTINATIONS (07.3)

     `state.requestChangesContent()` takes `{destination}` and the two
     values are a real fork, not a label: each writes a different status
     whose HOLDER is a different role, so the record genuinely lands in
     that person's queue. This half of it makes the fork visible —
     nothing is pre-selected, and the consequence of each answer is on
     screen before the button is pressed.
     ============================================================ */

  /* WHO COULD ACTUALLY PICK IT UP. Reviewer reach is scope, not role, so
     "it goes to the Academic Reviewer" can be true of nobody. Saying so
     before the return is taken is the difference between an item that is
     waiting on a person and an item that is waiting on the Super Admin. */
  function reviewersCovering(rec) {
    return state.contentActors(state.CONTENT_ROLE.REVIEWER).filter(function (a) {
      return state.actorCoversRecord(a.id, rec);
    });
  }

  /* One description of each destination's consequences, rendered two
     ways: as alert boxes inside the card (live, as the choice is made)
     and as `.consequence` rows inside the confirmation dialog. Building
     it once means the card and the dialog can never drift into
     promising two different things. */
  function destConsequences(dest, rec, vendor) {
    var out = [];
    if (dest === DEST.REVIEWER) {
      var revs = reviewersCovering(rec);
      out.push({ kind: 'info', title: 'It goes to an Academic Reviewer',
        html: 'This item leaves your queue and its status becomes &ldquo;' +
          esc(state.contentStatusMeta(CS.CHANGES_ACADEMIC_RECHECK).label) + '&rdquo;. The <strong>Vendor is ' +
          'not asked for anything</strong> and the submission does not reopen for editing, so nothing about ' +
          'the build changes. The reviewer either approves it academically again — which brings it straight ' +
          'back to this queue — or returns it to the Vendor themselves.' +
          (rec.academicReview
            ? ' It was last approved by ' + esc(rec.academicReview.reviewerName) + '.'
            : '') });
      out.push(revs.length
        ? { kind: 'info', title: 'Who can pick it up',
            html: String(revs.length) + ' Academic ' + esc(util.plural(revs.length, 'Reviewer')) +
              (revs.length === 1 ? ' currently holds' : ' currently hold') +
              ' a scope covering this item: ' +
              esc(revs.map(function (a) { return a.name; }).join(', ')) + '.' }
        : { kind: 'warning', title: 'Nobody can act on it yet',
            html: 'No Academic Reviewer holds a role scope covering this item, so nobody can act on it until ' +
              'the Super Admin assigns one. It would sit in that state — nothing is lost and nothing is ' +
              'deleted, but nobody is working on it either.' });
      return out;
    }

    out.push({ kind: 'info', title: 'It goes to the Vendor' + (vendor ? ' — ' + vendor.name : ''),
      html: 'This item leaves your queue and its status becomes &ldquo;' +
        esc(state.contentStatusMeta(CS.CHANGES_CONTENT).label) + '&rdquo;. The submission <strong>reopens ' +
        'for the Vendor to correct</strong> and resubmit.' });
    /* The academic-approval consequence is the Vendor route's alone: on
       the academic route the reviewer is the one being asked, so the
       question of whether their approval still describes the item is
       theirs to answer rather than a warning about a resubmission. */
    out.push({ kind: approvalStillDescribes(rec) ? 'info' : 'warning',
      title: 'What happens to the academic approval',
      html: approvalStillDescribes(rec)
        ? 'The academic approval already recorded is kept, because it still describes this item. When the ' +
          'Vendor resubmits, it returns to this queue rather than to academic review.'
        : 'The academic approval already recorded no longer describes this item, so it is not carried ' +
          'forward. When the Vendor resubmits, the item goes back through academic review rather than ' +
          'returning to this queue.' });
    /* Same honesty as the academic gate: a Vendor whose scope was
       withdrawn cannot resubmit, so the sentence above would describe a
       return that never comes. */
    if (state.vendorScopeWithdrawn(rec, rec.createdBy)) {
      out.push({ kind: 'warning', title: 'That Vendor cannot act on it',
        html: 'The Vendor who submitted this no longer holds a role scope covering it, so they cannot correct ' +
          'or resubmit it. It will stay returned until the Super Admin restores their scope.' });
    }
    if (!vendor) {
      out.push({ kind: 'warning', title: 'There is no Vendor to return this to',
        html: 'This item carries no Vendor submission, so nobody would receive it. An academic or content ' +
          'correction is the route that reaches a person.' });
    }
    return out;
  }

  function conseqCardHTML(items) {
    return items.map(function (c) {
      return ui.alertBox(c.kind, c.title, '<p>' + c.html + '</p>');
    }).join('');
  }

  function conseqDialogHTML(items) {
    return items.map(function (c) {
      return '<div class="consequence">' + ui.ic(c.kind === 'warning' ? 'alert' : 'info') +
        '<span><strong>' + esc(c.title) + '.</strong> ' + c.html + '</span></div>';
    }).join('');
  }

  function destRadio(value, label, note) {
    return '<label class="radiorow"><input type="radio" name="cm-dest" value="' + esc(value) + '">' +
      '<span><span class="rr-t">' + esc(label) + '</span>' +
      '<span class="rr-n">' + esc(note) + '</span></span></label>';
  }

  function destPlaceholderHTML() {
    return '<p class="dnote">' + ui.ic('info', 'sm') +
      'Choose a destination above and this will say exactly who receives the item and what happens next.</p>';
  }

  /* The return control itself. It lives in the body of a card rather
     than in the page header, because it is no longer one button: the
     destination, the reason and any supporting reference are all part of
     the same decision and belong beside each other. */
  function changeRequestCard(rec, vendor) {
    return ui.card('Request changes — choose where it goes back to',
      '<div class="form-errors"></div>' +
      '<p>A returned item goes to <strong>one</strong> of two people, and which one is your decision — there ' +
      'is no default. An academic or content problem is the Academic Reviewer’s to resolve; a technical, ' +
      'application or delivery problem is the Vendor’s. A broken link sent back through academic review ' +
      'fixes nothing.</p>' +
      '<div class="field" id="f-cm-dest">' +
      '<fieldset class="fgroup"><legend>Send this back to <span class="req" aria-hidden="true">*</span>' +
      '<span class="sr-only">(required)</span></legend>' +
      destRadio(DEST.REVIEWER, 'The Academic Reviewer',
        'Academic or content issue — the Learning Outcomes, the description, whether the experiment teaches ' +
        'what it claims.') +
      destRadio(DEST.VENDOR, 'The Vendor' + (vendor ? ' — ' + vendor.name : ''),
        'Technical, application or delivery issue — the app not working, a package that will not install, a ' +
        'broken hosted link, a delivery discrepancy.') +
      '</fieldset></div>' +
      '<div id="cm-dest-what" aria-live="polite">' + destPlaceholderHTML() + '</div>' +
      '<div class="field" id="f-cm-comment" style="margin-top:14px">' +
      '<label for="i-cm-comment">Reason for requesting changes ' +
      '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
      '<textarea id="i-cm-comment" rows="3" maxlength="1200" aria-describedby="h-cm-comment"></textarea>' +
      '<p class="hint" id="h-cm-comment">Required whichever destination you choose: the person receiving this ' +
      'cannot act on it without knowing what is wrong. Internal to the content workflow; never shown in the ' +
      'public catalogue.</p></div>' +
      /* R14 — the same references editor the Academic Reviewer uses, so
         a change request can carry the screenshot or document that
         actually shows the problem. The honesty line about uploads lives
         inside the shared helper and is not repeated here. */
      cui.refsEditorHTML('cmchg', {
        legend: 'Supporting references (optional)',
        hint: 'Point at the thing that shows the problem — an annotated screenshot, a recording, a document, ' +
          'the failing link itself.'
      }) +
      '<div class="formact">' +
      '<button class="btn sec" type="button" id="m-changes">' + ui.ic('alert') + 'Request changes</button>' +
      '<span class="formnote">Nothing is sent until you confirm, and the confirmation repeats what this ' +
      'destination causes.</span>' +
      '</div>');
  }

  /* R14 — PAST CHANGE REQUESTS, WITH WHAT WAS ATTACHED TO THEM. The
     shared timeline renders the label, the actor and the note; it does
     not render references. Rather than fork that helper (it is shared
     with two other roles), this card shows the return events on their
     own, with their references — and the full timeline still sits below
     it, unchanged. */
  function changeRequestHistoryCard(rec) {
    var rows = (rec.history || []).filter(function (h) { return h.kind === 'changes'; });
    if (!rows.length) { return ''; }
    return ui.card('Change requests on this item',
      '<div class="timeline">' + rows.map(function (h) {
        return '<div class="tl-item"><span class="tl-dot warn">' + ui.ic('alert') + '</span>' +
          '<div class="tl-body"><div class="tl-action">' + esc(h.label) + '</div>' +
          '<div class="tl-who">' +
          (h.actorName ? esc(h.actorName) + ' · ' : '') +
          (h.actorName && h.actorRole ? esc(h.actorRole) + ' · ' : '') +
          esc(util.fmtDateTime(h.at)) + '</div>' +
          (h.note ? '<p class="tl-note">' + esc(h.note) + '</p>' : '') +
          cui.refsHTML(h.refs, { title: 'Supporting references' }) +
          '</div></div>';
      }).join('') + '</div>',
      rows.length + ' ' + util.plural(rows.length, 'return'));
  }

  /* ============================================================
     R16 — DELIVERY REFERENCE MANAGEMENT (07.3)

     *"Content manager should have the provision to edit the link … if he
     wants to delete and replace the link also he can replace it."*

     WHAT THIS IS NOT. It is not authorship of the technical submission:
     the Vendor supplied it and stays its owner, and the card says so.
     It is not the power to change WHICH technologies an Experiment ships
     in — `managerUpdateDelivery()` refuses a technology the record does
     not already carry, and no control here offers one.

     WHY THE SCREEN IS NARROWER THAN THE STATE LAYER. `managerCanEditDelivery()`
     asks scope only, deliberately. This screen additionally requires the
     item to be at the readiness gate or published — the same test
     `canonicalEditable()` applies to canonical metadata — because a
     draft is with its Vendor and a submission under academic review is
     with its reviewer, and rewriting either would change the work under
     the person currently holding it. Where the editor is not offered the
     card says why, so the absence reads as a rule rather than a gap.
     ============================================================ */
  var DELIVERY_FIELD_LABEL = {
    url: 'Hosted URL', packageLabel: 'Package label', packageRef: 'Package reference',
    runtime: 'Device / runtime requirement', notes: 'Technical notes'
  };
  var DELIVERY_FIELD_ORDER = ['url', 'packageLabel', 'packageRef', 'runtime', 'notes'];

  function deliveryVal(id) {
    var el = document.getElementById(id);
    return el ? String(el.value || '').trim() : '';
  }

  /* Exactly the fields `managerUpdateDelivery()` accepts for THIS
     technology's delivery model, and no others: a hosted experience has
     no package reference, and asking for one would invite a value the
     state layer would silently ignore. */
  function readDeliveryPatch(i, tech) {
    var def = data.TECHNOLOGIES[tech] || {};
    var p = {};
    if (def.delivery === 'hosted') {
      p.url = deliveryVal('dl-url-' + i);
    } else {
      p.packageLabel = deliveryVal('dl-plabel-' + i);
      p.packageRef = deliveryVal('dl-pref-' + i);
    }
    p.runtime = deliveryVal('dl-rt-' + i);
    p.notes = deliveryVal('dl-notes-' + i);
    return p;
  }

  function deliveryChanges(rec, tech, patch) {
    var d = state.deliveryOf(rec, tech);
    var out = [];
    DELIVERY_FIELD_ORDER.forEach(function (k) {
      if (patch[k] === undefined) { return; }
      var was = String(d[k] || '');
      var now = String(patch[k] || '');
      if (was === now) { return; }
      out.push({ key: k, was: was, now: now });
    });
    return out;
  }

  function deliveryChangeRowsHTML(changes) {
    return '<div class="kv">' + changes.map(function (c) {
      return cui.kvLine(DELIVERY_FIELD_LABEL[c.key],
        '<span class="muted">was</span> ' + (c.was ? esc(c.was) : '<span class="muted">none</span>') +
        '<br><span class="muted">now</span> ' + (c.now ? esc(c.now) : '<span class="muted">none</span>'));
    }).join('') + '</div>';
  }

  /* Is there anything recorded for this technology at all? Decides
     whether a Remove control is rendered — a control that would clear
     nothing is a dead control, so it is not drawn. */
  function deliveryHasContent(rec, tech) {
    var d = state.deliveryOf(rec, tech);
    return DELIVERY_FIELD_ORDER.some(function (k) { return String(d[k] || '') !== ''; });
  }

  function deliveryEditorHTML(rec, tech, i) {
    var def = data.TECHNOLOGIES[tech] || {};
    var d = state.deliveryOf(rec, tech);
    var hosted = def.delivery === 'hosted';
    var open = deliveryOpen.recordId === rec.id && deliveryOpen.tech === tech;
    var summary = state.deliverySummaryFor(rec, tech);

    var fieldsHTML = hosted
      ? '<div class="field" id="f-dl-url-' + i + '">' +
        '<label for="dl-url-' + i + '">Hosted URL</label>' +
        '<input type="text" id="dl-url-' + i + '" value="' + esc(d.url || '') + '" ' +
        'placeholder="https://…" aria-describedby="h-dl-url-' + i + '">' +
        '<p class="hint" id="h-dl-url-' + i + '">Must begin with http:// or https://. Anything else is ' +
        'refused rather than stored — a Student would otherwise be handed a reference that cannot open.</p>' +
        '</div>'
      : '<div class="field" id="f-dl-plabel-' + i + '">' +
        '<label for="dl-plabel-' + i + '">Package label</label>' +
        '<input type="text" id="dl-plabel-' + i + '" value="' + esc(d.packageLabel || '') + '" ' +
        'maxlength="120"></div>' +
        '<div class="field" id="f-dl-pref-' + i + '">' +
        '<label for="dl-pref-' + i + '">Package reference</label>' +
        '<input type="text" id="dl-pref-' + i + '" value="' + esc(d.packageRef || '') + '" ' +
        'maxlength="160" aria-describedby="h-dl-pref-' + i + '">' +
        '<p class="hint" id="h-dl-pref-' + i + '">A reference to the authorised build. Nothing is uploaded ' +
        'here and no binary is stored — this prototype has no server.</p></div>';

    return '<div class="tr-block" id="dl-block-' + i + '">' +
      '<div class="tr-h">' + ui.fmtBadge(tech) + '<span class="tr-n">' + esc(def.name || tech) + '</span>' +
      '<span class="tr-d">' + esc(def.deliveryLabel || '') + '</span></div>' +
      '<div class="kv">' +
      cui.kvLine('Currently recorded', summary
        ? '<span class="mono brk">' + esc(summary) + '</span>'
        : '<span class="muted">Nothing recorded for this technology</span>') +
      '</div>' +
      '<div class="formact">' +
      '<button class="btn sec sm" type="button" id="dl-toggle-' + i + '" data-tech="' + esc(tech) + '" ' +
      'aria-expanded="' + (open ? 'true' : 'false') + '" aria-controls="dl-panel-' + i + '">' +
      ui.ic('edit') + (open ? 'Close' : (summary ? 'Edit or replace' : 'Add the reference')) + '</button>' +
      '</div>' +
      '<div id="dl-panel-' + i + '"' + (open ? '' : ' hidden') + ' style="margin-top:12px">' +
      fieldsHTML +
      '<div class="field" id="f-dl-rt-' + i + '">' +
      '<label for="dl-rt-' + i + '">Device / runtime requirement</label>' +
      '<input type="text" id="dl-rt-' + i + '" value="' + esc(d.runtime || '') + '" maxlength="200"></div>' +
      '<div class="field" id="f-dl-notes-' + i + '">' +
      '<label for="dl-notes-' + i + '">Technical notes</label>' +
      '<textarea id="dl-notes-' + i + '" rows="2" maxlength="600">' + esc(d.notes || '') + '</textarea></div>' +
      /* MANDATORY, AND THE SCREEN SAYS WHY. `managerUpdateDelivery()`
         returns null without one, so a missing reason is not a style
         preference — it is a refusal. The reason is also the only part
         of the history entry a later reader cannot reconstruct: what
         changed is recorded automatically, why it changed is not. */
      '<div class="field" id="f-dl-why-' + i + '">' +
      '<label for="dl-why-' + i + '">Why this reference is changing ' +
      '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
      '<textarea id="dl-why-' + i + '" rows="2" maxlength="600" ' +
      'aria-describedby="h-dl-why-' + i + '"></textarea>' +
      '<p class="hint" id="h-dl-why-' + i + '">Required. The change is written to this item’s history with ' +
      'what it was and what it became; your reason is the part that cannot be reconstructed later. Without ' +
      'one, nothing is saved.</p></div>' +
      '<div class="formact">' +
      '<button class="btn pri sm" type="button" id="dl-save-' + i + '" data-tech="' + esc(tech) + '">' +
      'Save this reference</button>' +
      (deliveryHasContent(rec, tech)
        ? '<button class="btn sec sm" type="button" id="dl-remove-' + i + '" data-tech="' + esc(tech) + '">' +
          'Remove the reference</button>'
        : '') +
      '<span class="formnote">' + esc(def.label || tech) + ' stays on this Experiment either way — a ' +
      'technology is never added or removed here.</span>' +
      '</div></div></div>';
  }

  function deliveryCard(rec, editable) {
    var body = cui.deliveryRows(rec);

    if (!editable) {
      return ui.card('Technology delivery',
        body +
        '<p class="cardfoot">The Vendor supplies and owns this technical submission. You may correct or ' +
        'replace the reference the platform holds for a technology once the item reaches content readiness ' +
        'review, and after it is published — not while it is “' +
        esc(state.contentStatusMeta(rec.status).label) + '” and ' + esc(cui.holderLine(rec, 'manager')) +
        '. Editing it now would change the work under the person currently holding it. Which technologies ' +
        'this Experiment ships in is never editable here.</p>',
        'Vendor supplied — not editable in this state');
    }

    var editors = rec.technologies.length
      ? '<div class="techrows deliv" style="margin-top:16px">' +
        data.sortTech(rec.technologies).map(function (t, i) {
          return deliveryEditorHTML(rec, t, i);
        }).join('') + '</div>'
      : '';

    return ui.card('Technology delivery',
      body +
      '<div class="form-errors" style="margin-top:14px"></div>' +
      '<p class="cardfoot">The Vendor supplies and owns this technical submission. What you may correct is ' +
      'the <strong>reference the platform holds</strong> — a hosted link that has gone stale, a package ' +
      'reference that has changed — without waiting for a resubmission. You cannot add or remove a ' +
      '<strong>technology</strong>: that is the Vendor’s submission, and widening it here would hand an ' +
      'institution a technology nobody reviewed. Every change needs a reason and is written to this item’s ' +
      'history with what it was and what it became. It creates no new version, changes no recorded academic ' +
      'approval or publication record, and grants nobody access.</p>' +
      editors,
      'Vendor supplied — you may correct the reference');
  }

  /* ---------------- Content item / final review ---------------- */
  XRSLP.screens.managerRecord = function (params) {
    var actor = resolveActor(params);
    if (!actor) { return XRSLP.screens.notFound(); }
    var rec = state.contentRecord(params.recordId);
    if (!rec || !state.actorCoversRecord(actor.id, rec)) { return XRSLP.screens.notFound(); }

    var published = rec.status === CS.PUBLISHED;
    var atGate = rec.status === CS.CONTENT_REVIEW;
    var ready = state.publishReadiness(rec);
    var vendor = rec.createdBy ? state.contentActor(rec.createdBy) : null;
    /* R16 — scope AND state. See the block comment above deliveryCard()
       for why this screen is narrower than `managerCanEditDelivery()`. */
    var deliveryEditable = state.managerCanEditDelivery(rec, actor.id) && state.canonicalEditable(rec);
    /* Only candidates that have been handed over — see the card below. */
    var chainVersions = state.versionsForRecord(rec.id).filter(function (v) {
      return v.status !== state.VERSION_STATUS.DRAFT;
    });

    var stateNote;
    if (published) {
      stateNote = ui.alertBox('success',
        'Published' + (rec.publication ? ' · ' + util.fmtDate(rec.publication.publishedAt) : ''),
        '<p>This experiment is in the published catalogue. Publication made it discoverable and requestable — ' +
        'it granted it to no institution.</p>');
    } else if (atGate) {
      stateNote = cui.readinessCard(ready,
        'Ready for first publication',
        'Academic approval is recorded and every canonical and technical requirement is present. ' +
        'You may publish this experiment.',
        'Not ready to publish yet');
    } else {
      stateNote = ui.alertBox('info', 'No publication decision is available',
        '<p>This item is currently in “' + esc(state.contentStatusMeta(rec.status).label) + '” — ' +
        esc(cui.holderLine(rec, 'manager')) + '. It appears here read-only for reference.</p>');
    }

    var actions = '';
    if (atGate) {
      actions =
        '<button class="btn pri" type="button" id="m-publish"' +
        (ready.ok ? '' : ' aria-disabled="true"') + '>' + ui.ic('check') + 'Publish</button>' +
        /* 07.3 — the return is no longer a single button with a hidden
           destination, so the header control cannot BE the action any
           more: it takes you to the choice instead of making it for you.
           It is kept because this is where the person looks for it. */
        '<button class="btn sec" type="button" id="m-changes-jump">' + ui.ic('alert') +
        'Request changes</button>';
    }
    /* Canonical content metadata is the Content Manager's (STK31-09).
       It is editable on an item in the library — never the Learning
       Outcomes, which stay academically owned. */
    if (state.canonicalEditable(rec)) {
      actions += '<a class="btn sec" href="' + href.mMetadata(actor.id, rec.id) + '">' + ui.ic('edit') +
        'Edit canonical metadata</a>';
    }

    var decisionCard = atGate ? changeRequestCard(rec, vendor) : '';

    var html =
      ui.crumbs([{ label: 'Content Library', href: href.mLibrary(actor.id) }, { label: rec.name }]) +
      ui.phead(rec.name,
        cui.contextLine(rec) + ' · ' + esc(cui.holderLine(rec, 'manager')),
        actions,
        ' ' + cui.statusBadge(rec) + cui.revisionChip(rec) + cui.resubmittedChip(rec)) +
      stateNote +
      '<div class="grid-rail" style="margin-top:18px">' +
      '<div class="stack">' +
      ui.card('Canonical metadata', cui.recordSummaryKV(rec, { showVendorNotes: true }),
        'You may manage these') +
      ui.card('Learning outcomes',
        cui.outcomesList(rec.outcomes,
          'No Learning Outcomes are recorded. They are authored by the Academic Reviewer, not here.'),
        'Academic Reviewer owned — read-only') +
      ui.card('Academic validation', cui.academicDecisionCard(rec, true)) +
      deliveryCard(rec, deliveryEditable) +
      ui.card('Supporting documentation', cui.documentsList(rec.documents)) +
      /* R13 (display half) — the Vendor's preview / demo video, shown to
         the role that decides whether this reaches the catalogue. It is
         a link reference the Vendor supplied, not an upload and not
         anything this build hosts; `cui.previewVideoHTML` says so. */
      ui.card('Preview / demo video', cui.previewVideoHTML(rec),
        'Vendor supplied — a link reference') +
      decisionCard +
      '</div>' +
      '<div class="stack">' +
      (published ? ui.card('Publication record', cui.publicationCard(rec)) : '') +
      (published ? cui.publishedNextVersionNote() : '') +
      /* Later versions are VISIBLE here, and read-only. The Content
         Manager's confirmed authority is content readiness review and
         the FIRST publication; the decision on a later version is the
         Super Admin's Release / Hold, and no control for it exists on
         this plane.

         A candidate the Vendor has NOT submitted is excluded. A draft is
         still with its Vendor and has not entered the governance chain,
         so listing it here would report work nobody has handed over as
         though it were part of the record's version history. */
      (published && chainVersions.length
        ? ui.card('Later versions',
            '<div class="tscroll"><table class="dt">' +
            '<caption class="sr-only">Later versions of ' + esc(rec.name) + '</caption>' +
            '<thead><tr><th scope="col">Version</th><th scope="col">Vendor</th>' +
            '<th scope="col">State</th></tr></thead><tbody>' +
            chainVersions.map(function (v) {
              return '<tr>' +
                '<td data-label="Version">' + esc(v.versionLabel) + '</td>' +
                '<td data-label="Vendor">' + esc(v.createdByName) + '</td>' +
                '<td data-label="State">' + XRSLP.versionUI.badge(v) + '</td>' +
                '</tr>';
            }).join('') + '</tbody></table></div>' +
            '<p class="cardfoot">Versions that have entered the governance chain — a candidate a Vendor has ' +
            'not submitted yet is not listed. Shown for visibility: the decision to release a later version ' +
            'or hold it is the <strong>Super Admin&rsquo;s</strong>, and there is no control for it here.</p>',
            'Read-only — Super Admin decides')
        : '') +
      ui.card('Submission',
        '<div class="kv">' +
        cui.kvLine('Vendor', vendor
          ? esc(vendor.name) + '<div class="muted">' + esc(vendor.organisation) + '</div>'
          : '<span class="muted">Existing published content — no Vendor submission</span>') +
        cui.kvLine('Submitted', rec.submittedAt ? esc(util.fmtDateTime(rec.submittedAt)) : '—') +
        /* NOT "Version": `rec.versionLabel` is the version the public
           sees, and a Super Admin Release overwrites it. Under a card
           headed Submission it read as the label the Vendor submitted,
           which after a release it is not. */
        cui.kvLine('Current public version', esc(rec.versionLabel || '—')) +
        cui.kvLine('Revision', esc(String(rec.revision))) +
        '</div>') +
      changeRequestHistoryCard(rec) +
      ui.card('History', cui.historyTimeline(rec)) +
      '</div></div>';

    return shell(actor, published ? 'library' : 'queue', rec.name, html, function () {
      if (atGate) {
        bindPublish(actor, rec, ready);
        bindChangeRequest(actor, rec, vendor);
      }
      /* Delivery editing is NOT gated on `atGate`: the stakeholder's own
         example is a published experiment whose hosted link has gone
         stale, and that record is past every gate. */
      if (deliveryEditable) { bindDelivery(actor, rec); }
    });
  };

  function bindPublish(actor, rec, ready) {
    var pub = document.getElementById('m-publish');
    var chg = document.getElementById('m-changes-jump');

    if (pub) {
      pub.addEventListener('click', function () {
        var fresh = state.contentRecord(rec.id);
        var check = state.publishReadiness(fresh);
        if (!check.ok) {
          ui.toast(check.blockers[0], 'info');
          return;
        }
        var ctx = state.contentContext(fresh);
        ui.openDialog({
          title: 'Publish this experiment?',
          bodyHTML:
            '<p><strong>' + esc(fresh.name) + '</strong> becomes part of the published catalogue under ' +
            esc(ctx && ctx.grouping ? ctx.grouping.name : '—') + ' › ' +
            esc(ctx && ctx.course ? ctx.course.name : '—') + ', at version ' +
            esc(fresh.versionLabel) + '.</p>' +
            '<div class="kv" style="margin-top:10px">' +
            cui.kvLine('Technologies published', ui.techBadges(fresh.technologies)) +
            cui.kvLine('Learning Outcomes', String(fresh.outcomes.length)) +
            cui.kvLine('Academic approval', esc(fresh.academicReview ? fresh.academicReview.reviewerName : '—')) +
            '</div>' +
            '<div class="consequence">' + ui.ic('info') +
            '<span><strong>Publishing grants access to nobody.</strong> It makes the experiment discoverable ' +
            'and requestable. An institution still submits a request, the Super Admin still approves it, and ' +
            'a Tenant Admin still assigns it before any student can see it.</span></div>',
          okLabel: 'Publish',
          onConfirm: function () {
            var updated = state.publishContent(actor.id, fresh.id);
            if (!updated) {
              ui.toast('This item could not be published.', 'info');
              return;
            }
            ui.toast(updated.name + ' published to the catalogue.');
            XRSLP.router.go(href.mRecord(actor.id, updated.id));
          }
        });
      });
    }

    /* The header control is a JUMP, not the action — see the phead. */
    if (chg) {
      chg.addEventListener('click', function () {
        var wrap = document.getElementById('f-cm-dest');
        if (!wrap) { return; }
        wrap.scrollIntoView();
        var first = wrap.querySelector('input');
        if (first) { first.focus(); }
      });
    }
  }

  /* ---- R15 — the return, with its destination ---- */
  function bindChangeRequest(actor, rec, vendor) {
    var btn = document.getElementById('m-changes');
    var wrap = document.getElementById('f-cm-dest');
    var what = document.getElementById('cm-dest-what');
    if (!btn || !wrap) { return; }

    function chosen() {
      var picked = wrap.querySelector('input[name="cm-dest"]:checked');
      return picked ? picked.value : '';
    }

    /* SAY THE CONSEQUENCE AS THE CHOICE IS MADE, not only in the
       confirmation. By the time a dialog is open the person has already
       decided; the point of the split is that they decide with the
       consequence in front of them. */
    Array.prototype.slice.call(wrap.querySelectorAll('input[name="cm-dest"]')).forEach(function (input) {
      input.addEventListener('change', function () {
        if (!what) { return; }
        var dest = chosen();
        what.innerHTML = dest
          ? conseqCardHTML(destConsequences(dest, rec, vendor))
          : destPlaceholderHTML();
      });
    });

    btn.addEventListener('click', function () {
      var card = wrap.closest('.card');
      var dest = chosen();
      var el = document.getElementById('i-cm-comment');
      var text = el ? el.value.trim() : '';
      var errs = [];
      if (!dest) {
        errs.push({ field: 'f-cm-dest',
          message: 'Choose where this goes back to. An academic or content issue goes to the Academic ' +
            'Reviewer; a technical, application or delivery issue goes to the Vendor.' });
      }
      if (!text) {
        errs.push({ field: 'f-cm-comment',
          message: 'Enter the reason. Whoever receives this cannot act on it without knowing what is wrong.' });
      }
      if (!ui.showErrors(card, errs, 'This item cannot be returned yet')) {
        ui.toast('Choose a destination and enter your reason before requesting changes.', 'info');
        return;
      }

      var toReviewer = dest === DEST.REVIEWER;
      /* Read the references from the LIVE page before the dialog opens.
         The dialog detaches its own body on confirm, which is a
         different element tree — reading them here keeps the two apart
         and means the count shown in the dialog is the count sent. */
      var refs = cui.readRefs('cmchg');

      ui.openDialog({
        title: toReviewer ? 'Return this for academic re-check?' : 'Return this to the Vendor?',
        bodyHTML:
          '<p>This returns <strong>' + esc(rec.name) + '</strong> to ' +
          (toReviewer ? 'an <strong>Academic Reviewer</strong>' : 'the <strong>Vendor</strong>') +
          ', with your reason.</p>' +
          '<blockquote class="qquote">' + esc(text) + '</blockquote>' +
          (refs.length
            ? cui.refsHTML(refs, { title: refs.length + ' supporting ' + util.plural(refs.length, 'reference') })
            : '') +
          conseqDialogHTML(destConsequences(dest, rec, vendor)),
        okLabel: toReviewer ? 'Return to the Academic Reviewer' : 'Return to the Vendor',
        onConfirm: function () {
          var updated = state.requestChangesContent(actor.id, rec.id, text,
            { destination: dest, refs: refs });
          if (!updated) { ui.toast('Changes could not be requested.', 'info'); return; }
          ui.toast(toReviewer
            ? 'Returned for academic re-check — an Academic Reviewer now holds it.'
            : 'Changes requested — returned to the Vendor.');
          XRSLP.router.go(href.mQueue(actor.id));
        }
      });
    });
  }

  /* ---- R16 — edit / replace / remove a delivery reference ---- */
  function bindDelivery(actor, rec) {
    var techs = data.sortTech(rec.technologies);

    techs.forEach(function (tech, i) {
      var toggle = document.getElementById('dl-toggle-' + i);
      var panel = document.getElementById('dl-panel-' + i);
      var save = document.getElementById('dl-save-' + i);
      var remove = document.getElementById('dl-remove-' + i);
      var block = document.getElementById('dl-block-' + i);
      var card = block ? block.closest('.card') : null;
      var def = data.TECHNOLOGIES[tech] || {};

      if (toggle && panel) {
        toggle.addEventListener('click', function () {
          var nowOpen = panel.hasAttribute('hidden');
          deliveryOpen = nowOpen
            ? { recordId: rec.id, tech: tech }
            : { recordId: null, tech: null };
          /* Re-render rather than toggling in place: the button label,
             the expanded state and the remembered panel then all come
             from one source, and no second copy of that logic can drift. */
          XRSLP.render(true);
        });
      }

      /* Report the reason the write ACTUALLY failed. `managerUpdateDelivery`
         returns null for a missing reason (caught before we call it), a
         hosted URL that is not a URL, or lost authority — and sending
         somebody to re-type their reason over an authority problem is
         the mistake the canonical-metadata editor already had to fix. */
      function reportRefusal(patch) {
        if (def.delivery === 'hosted' && patch && patch.url && !state.isHttpUrl(patch.url)) {
          ui.showErrors(card, [{ field: 'f-dl-url-' + i,
            message: 'Enter a full web address beginning with http:// or https://. A value that is not a URL ' +
              'is refused rather than stored.' }], 'This delivery reference was not saved');
          return;
        }
        ui.showErrors(card, [{ field: 'f-dl-why-' + i,
          message: 'This change was refused. Your role scope no longer covers this item, so it cannot be ' +
            'edited from here. Nothing was changed.' }], 'This delivery reference was not saved');
      }

      if (save) {
        save.addEventListener('click', function () {
          var fresh = state.contentRecord(rec.id);
          if (!fresh) { return; }
          var patch = readDeliveryPatch(i, tech);
          var changes = deliveryChanges(fresh, tech, patch);
          if (!changes.length) {
            ui.clearErrors(card);
            ui.toast('Nothing to save — this delivery reference is unchanged.', 'info');
            return;
          }
          var why = deliveryVal('dl-why-' + i);
          if (!ui.showErrors(card, why ? [] : [{ field: 'f-dl-why-' + i,
            message: 'Enter why this reference is changing. It is written to the item’s history beside what ' +
              'changed, and the change is not saved without it.' }],
            'This delivery reference was not saved')) {
            return;
          }

          ui.openDialog({
            title: 'Save this delivery reference?',
            bodyHTML:
              '<p>' + esc(def.name || tech) + ' delivery for <strong>' + esc(fresh.name) + '</strong>:</p>' +
              deliveryChangeRowsHTML(changes) +
              '<blockquote class="qquote">' + esc(why) + '</blockquote>' +
              '<div class="consequence">' + ui.ic('info') +
              '<span><strong>The Vendor stays the owner of this submission.</strong> This corrects the ' +
              'reference the platform holds. It writes an entry to this item’s history naming what it was ' +
              'and what it became, creates no new version, changes no recorded academic approval or ' +
              'publication record, and grants nobody access.</span></div>',
            okLabel: 'Save the reference',
            onConfirm: function () {
              var updated = state.managerUpdateDelivery(actor.id, fresh.id, tech, patch, why, false);
              if (!updated) { reportRefusal(patch); return; }
              deliveryOpen = { recordId: null, tech: null };
              ui.toast((def.label || tech) + ' delivery reference updated.');
              XRSLP.render(true);
            }
          });
        });
      }

      if (remove) {
        remove.addEventListener('click', function () {
          var fresh = state.contentRecord(rec.id);
          if (!fresh) { return; }
          var why = deliveryVal('dl-why-' + i);
          if (!ui.showErrors(card, why ? [] : [{ field: 'f-dl-why-' + i,
            message: 'Enter why this reference is being removed. Removal is recorded like any other change, ' +
              'and it is not saved without a reason.' }],
            'This delivery reference was not removed')) {
            return;
          }
          var d = state.deliveryOf(fresh, tech);
          ui.openDialog({
            title: 'Remove this delivery reference?',
            bodyHTML:
              '<p>Everything the platform records for the <strong>' + esc(def.name || tech) + '</strong> ' +
              'delivery of <strong>' + esc(fresh.name) + '</strong> is cleared:</p>' +
              '<div class="kv" style="margin-top:10px">' +
              DELIVERY_FIELD_ORDER.filter(function (k) { return String(d[k] || '') !== ''; })
                .map(function (k) { return cui.kvLine(DELIVERY_FIELD_LABEL[k], esc(String(d[k]))); })
                .join('') +
              '</div>' +
              '<blockquote class="qquote">' + esc(why) + '</blockquote>' +
              '<div class="consequence">' + ui.ic('info') +
              '<span><strong>' + esc(def.label || tech) + ' stays on this Experiment.</strong> Removing the ' +
              'reference does not remove the technology — only what the platform holds for it. The ' +
              'Experiment keeps its status, and the removal is written to its history with what was there ' +
              'before.</span></div>' +
              '<div class="consequence">' + ui.ic('alert') +
              '<span>Until a replacement is recorded, this Experiment carries a technology with <strong>no ' +
              'reference at all</strong>. Record the replacement in the same sitting where you can.</span>' +
              '</div>',
            okLabel: 'Remove the reference',
            onConfirm: function () {
              var updated = state.managerUpdateDelivery(actor.id, fresh.id, tech, null, why, true);
              if (!updated) { reportRefusal(null); return; }
              deliveryOpen = { recordId: fresh.id, tech: tech };
              ui.toast((def.label || tech) + ' delivery reference removed — record a replacement here.');
              XRSLP.render(true);
            }
          });
        });
      }
    });
  }

  /* ---------------- canonical metadata editor ----------------
     STK31-09 gives the Content Manager canonical CONTENT metadata. This
     edits the canonical catalogue fields of ONE item in the library.

     It deliberately does NOT edit: Learning Outcomes (academically
     owned), the technology delivery detail (the Vendor's technical
     submission), or the Programme / Course master records themselves —
     platform master-data administration is a Super Admin surface this
     prototype does not build. */
  XRSLP.screens.managerMetadata = function (params) {
    var actor = resolveActor(params);
    if (!actor) { return XRSLP.screens.notFound(); }
    var rec = state.contentRecord(params.recordId);
    if (!rec || !state.actorCoversRecord(actor.id, rec)) { return XRSLP.screens.notFound(); }

    /* Canonical metadata is a Content LIBRARY action. A draft the Vendor
       is still writing, and a submission the Academic Reviewer is
       holding, are not in the library yet — rewriting either would change
       the work under the person doing it, and could move a submission out
       of its assigned reviewer's scope. The route resolves; the editor is
       not rendered, and `updateCanonicalMetadata()` refuses the same way. */
    if (!state.canonicalEditable(rec)) {
      var lockedHTML =
        ui.crumbs([{ label: 'Content Library', href: href.mLibrary(actor.id) },
                   { label: rec.name, href: href.mRecord(actor.id, rec.id) },
                   { label: 'Canonical metadata' }]) +
        ui.phead('Canonical metadata', esc(rec.name), '', ' ' + cui.statusBadge(rec)) +
        ui.alertBox('warning', 'This item is not in the Content Library yet',
          '<p>It is currently in “' + esc(state.contentStatusMeta(rec.status).label) + '” — ' +
          esc(cui.holderLine(rec, 'manager')) + '. Canonical metadata is editable once the item reaches ' +
          'content readiness review, and after publication. Editing it now would change the work under the ' +
          'person currently holding it.</p>') +
        '<p style="margin-top:16px"><a class="btn sec" href="' + href.mRecord(actor.id, rec.id) +
        '">Back to the item</a></p>';
      return shell(actor, 'library', rec.name, lockedHTML);
    }

    /* ONLY THE COURSES THE SAVE WILL ACCEPT — plus the record's own
       Course, which is always offered and always selected, so a record
       can never lose its placement by being edited. Offering every
       canonical Course meant the picker held destinations
       `updateCanonicalMetadata` would refuse. */
    var courseOptions = data.courses().filter(function (c) {
      return state.managerCanFileInto(actor.id, rec.id, c.id);
    }).map(function (c) {
      var g = data.grouping(c.groupingId);
      return '<option value="' + esc(c.id) + '"' + (rec.courseId === c.id ? ' selected' : '') + '>' +
        esc((g ? g.name + ' › ' : '') + c.name) + '</option>';
    }).join('');

    var html =
      ui.crumbs([{ label: 'Content Library', href: href.mLibrary(actor.id) },
                 { label: rec.name, href: href.mRecord(actor.id, rec.id) },
                 { label: 'Canonical metadata' }]) +
      ui.phead('Canonical metadata', esc(rec.name), '', ' ' + cui.statusBadge(rec)) +
      (rec.status === CS.PUBLISHED
        ? ui.alertBox('warning', 'This experiment is published',
            '<p>Corrections here take effect in the public catalogue immediately. They do not create a new ' +
            'version and they do not change the published revision, the recorded academic approval or the ' +
            'publication record — a newer version is a separate Super Admin decision.</p>')
        : '') +
      /* SAY THE CONSEQUENCE BEFORE THE ACTION, not after it. The name,
         the Course, the summary and the description are part of what the
         Academic Reviewer approved, so changing one of them at the
         readiness gate means the recorded approval no longer describes
         this item and `publishReadiness()` blocks publication. That
         guard is correct and stays; what was missing was any statement
         of it before Save. */
      (rec.status === CS.CONTENT_REVIEW && rec.academicReview
        ? ui.alertBox('warning', 'This item is at the publication gate',
            '<p>The name, the Course, the summary and the description are part of what ' +
            esc(rec.academicReview.reviewerName) + ' approved. Saving a change to any of them means the ' +
            'recorded approval no longer describes this item, and <strong>publication is blocked</strong> ' +
            'until either the earlier wording is restored or the item goes back through academic review.</p>' +
            (approvalStillDescribes(rec)
              ? ''
              : '<p>That has already happened: the approval on record no longer describes this item as it ' +
                'now stands.</p>'))
        : '') +
      '<form class="formwrap" id="cm-form" novalidate><div class="stack">' +
      '<div class="form-errors"></div>' +
      ui.card('Canonical catalogue fields',
        '<div class="field" id="f-name">' +
        '<label for="i-name">Experiment name <span class="req" aria-hidden="true">*</span>' +
        '<span class="sr-only">(required)</span></label>' +
        '<input type="text" id="i-name" value="' + esc(rec.name) + '" maxlength="120"></div>' +
        '<div class="field" id="f-course">' +
        '<label for="i-course">Course <span class="req" aria-hidden="true">*</span>' +
        '<span class="sr-only">(required)</span></label>' +
        '<select id="i-course" aria-describedby="h-course">' + courseOptions + '</select>' +
        '<p class="hint" id="h-course">Moves the experiment under a different canonical Course. The Programme / ' +
        'Department and Course master records themselves are platform master data and are not edited here.</p>' +
        '</div>' +
        '<div class="field" id="f-summary">' +
        '<label for="i-summary">Catalogue summary</label>' +
        '<textarea id="i-summary" rows="2" maxlength="300">' + esc(rec.summary) + '</textarea></div>' +
        '<div class="field" id="f-description" style="margin-bottom:0">' +
        '<label for="i-description">Description</label>' +
        '<textarea id="i-description" rows="5" maxlength="1600">' + esc(rec.description) + '</textarea></div>') +
      '<div class="formact">' +
      '<button class="btn pri" type="button" id="cm-save">Save metadata</button>' +
      '<a class="btn gho" href="' + href.mRecord(actor.id, rec.id) + '">Cancel</a>' +
      '</div></div>' +
      '<div class="formaside"><div class="stack">' +
      ui.card('Not editable here',
        '<ul class="reslist plain">' +
        '<li>' + ui.ic('x') + '<span><strong>Learning Outcomes</strong> — academically owned by the Academic Reviewer.</span></li>' +
        '<li>' + ui.ic('x') + '<span><strong>Technology delivery</strong> — the Vendor’s technical submission.</span></li>' +
        /* THIS SENTENCE HAS NOW BEEN WRONG TWICE, SO IT IS WORTH BEING
           EXACT. It first said the master records are administered "on a
           Super Admin surface this prototype does not build", which the
           Super Admin's own content-governance screen contradicted. It
           was corrected to "creating or deleting … is not built
           anywhere" — but Implementation 07.1 BUILT create and rename on
           Academic structure, so half of that became untrue in turn.
           What is genuinely unbuilt is only RETIREMENT: those ids are
           load-bearing for every access record, academic mapping,
           Faculty mapping and student assignment, and no source states
           what should happen to those live references when a structure
           record retires. Nothing is deleted anywhere in this build. */
        '<li>' + ui.ic('x') + '<span><strong>Programme / Course master records</strong> — platform-controlled structure. The Super Admin <strong>creates and renames</strong> them on Academic structure; <strong>retiring or deleting</strong> one is not built anywhere, because those ids are referenced by live access records, mappings and assignments and no source states what should become of those references.</span></li>' +
        /* The one part of a Course that IS this role's, and it is on a
           screen of its own rather than in this editor — the code
           belongs to the Course master record, not to this Experiment. */
        '<li>' + ui.ic('arrowR') + '<span><strong>The canonical Course code</strong> — yours, but not from this form. Set it on <a href="' + coursesHref(actor.id) + '">Course codes</a>, where it sits on the Course master record it belongs to.</span></li>' +
        '<li>' + ui.ic('x') + '<span><strong>The published revision and its publication record</strong> — fixed once published.</span></li>' +
        '</ul>') +
      '</div></div></form>';

    return shell(actor, 'library', 'Canonical metadata', html, function () {
      var form = document.getElementById('cm-form');
      var btn = document.getElementById('cm-save');
      if (!btn || !form) { return; }
      btn.addEventListener('click', function () {
        function val(id) { var el = document.getElementById(id); return el ? el.value : ''; }
        var fields = {
          name: val('i-name'), courseId: val('i-course'),
          summary: val('i-summary'), description: val('i-description')
        };
        var errs = [];
        if (!fields.name.trim()) { errs.push({ field: 'f-name', message: 'Enter an experiment name.' }); }
        if (!fields.courseId) { errs.push({ field: 'f-course', message: 'Select a Course.' }); }
        if (!ui.showErrors(form, errs, 'The metadata cannot be saved yet')) { return; }
        var saved = state.updateCanonicalMetadata(actor.id, rec.id, fields);
        if (!saved) {
          /* Report the reason that actually applies. Every refusal used
             to be announced as a name clash, which sent the Content
             Manager renaming an Experiment over an authority problem. */
          ui.showErrors(form, [!state.managerCanFileInto(actor.id, rec.id, fields.courseId)
            ? { field: 'f-course',
                message: 'You hold no assignment covering that Course, so this experiment cannot be filed ' +
                  'into it. Course scope is assigned by the Super Admin.' }
            : { field: 'f-name',
                message: 'Another experiment already uses this name. Choose a different one.' }],
            'The metadata cannot be saved yet');
          return;
        }
        ui.toast('Canonical metadata updated.');
        XRSLP.router.go(href.mRecord(actor.id, rec.id));
      });
    });
  };

  /* ============================================================
     COURSE CODES — the canonical Course code, Implementation 07.2,
     stakeholder rule E.

     "Content Manager primarily. Super Admin will also get access to it."

     This screen is the PRIMARY half. It manages exactly ONE field on
     the Course master record and nothing else: the Programme /
     Department and Course records themselves stay platform-controlled
     (STK31-10), and no control on this plane creates, renames,
     re-parents or retires one.

     ── WHICH CODE THIS IS ───────────────────────────────────────
     The CANONICAL code — one Course, one code, across the whole
     platform. It is NOT an institution's own course code: each Tenant
     Admin records theirs separately on their Academic mappings screen,
     against the same canonical Course, and neither field can overwrite
     the other. That distinction is the whole point of rule E, so both
     surfaces name it rather than assuming it is obvious.

     ── BLANK IS A REAL ANSWER ───────────────────────────────────
     No official code exists for the sample Courses and none is
     invented. A Course with no code is a permanent legitimate state,
     which is why the field is optional and clearing it is allowed.
     ============================================================ */
  XRSLP.screens.managerCourses = function (params) {
    var actor = resolveActor(params);
    if (!actor) { return XRSLP.screens.notFound(); }
    var courses = state.coursesForManager(actor.id);

    /* Said once, beside the table and beside the empty state alike:
       what this screen governs, and what it deliberately leaves where
       it is. */
    var boundaryCard = ui.card('What this screen does not do',
      '<ul class="reslist plain">' +
      '<li>' + ui.ic('x') + '<span><strong>It does not create, rename, re-parent or retire a Course</strong> — ' +
      'and neither does anything else on this plane. The Course and Programme / Department master records are ' +
      'platform-controlled; the Super Admin creates and renames them, and retiring one is not built anywhere in ' +
      'this product.</span></li>' +
      '<li>' + ui.ic('x') + '<span><strong>It does not touch any institution&rsquo;s own course code.</strong> ' +
      'A Tenant Admin records that separately, against the same canonical Course, and the two live side by ' +
      'side.</span></li>' +
      '<li>' + ui.ic('x') + '<span><strong>It publishes nothing and grants nothing.</strong> No Experiment, ' +
      'licence, access record or student assignment changes when a code is set.</span></li>' +
      '<li>' + ui.ic('x') + '<span><strong>It does not change what a Course is called.</strong> The catalogue, ' +
      'CSV import and manual entry all resolve a Course by its <em>name</em>; the code is carried beside the ' +
      'name, never instead of it.</span></li>' +
      '</ul>', null, 'h2');

    var scopeCard = ui.card('Your assigned scope',
      '<div class="kv">' +
      '<div class="k">Scope</div><div class="v">' + esc(state.actorScopeText(actor.id)) + '</div>' +
      '<div class="k">Courses in reach</div><div class="v">' + courses.length + '</div>' +
      '</div>' +
      '<p class="cardfoot">Scope is assigned and withdrawn by the Super Admin, in Role governance. A Course ' +
      'outside it is not listed here and a code cannot be set on it &mdash; the same rule the Content Library ' +
      'already follows.</p>', null, 'h2');

    var asideNote = ui.gapNote('USE OF THE CODE OUTSIDE THIS PRODUCT IS NOT DECIDED',
      '<strong>Nothing in this build resolves a Course by its code.</strong> The public catalogue, CSV import ' +
      'and manual entry all match on the Course name, and the tenant&rsquo;s own conflict check compares local ' +
      'codes only. So changing a code here is safe, and this screen can say so honestly. What is <strong>not ' +
      'settled</strong> is whether an external system &mdash; a student information system, a timetabling ' +
      'tool &mdash; would key on this code. If one did, changing a code would matter to it, and no source ' +
      'states whether such an integration exists or what it would expect.');

    if (!courses.length) {
      return shell(actor, 'courses', 'Course codes',
        ui.phead('Course codes', esc(actor.name) + ' · Content Manager') +
        scopeGapNote(actor) +
        '<div class="tablecard">' + ui.emptyState({
          icon: 'book',
          title: 'No Course is inside your assigned scope',
          body: 'The canonical Course code is managed Course by Course, and none is in reach from this ' +
            'identity. Assigned scope: ' + state.actorScopeText(actor.id) + '. Nothing is hidden and nothing ' +
            'has been cleared — every Course still holds whatever code it had.',
          actionsHTML: '<a class="btn sec" href="' + href.mLibrary(actor.id) + '">Open the Content Library</a>'
        }) + '</div>' +
        '<div class="grid-rail" style="margin-top:18px">' +
        '<div class="stack">' + boundaryCard + '</div>' +
        '<div class="stack">' + scopeCard + asideNote + '</div>' +
        '</div>');
    }

    /* ONE FORM OVER THE WHOLE TABLE, saved row by row — the shape the
       Tenant Admin's Academic mappings screen already uses for the same
       job, so a stakeholder meets one pattern for "edit codes in a
       table" and not two.

       ⚠ THE FIELD WRAPPER IDS CARRY A ROW SUFFIX. `ui.showErrors`
       resolves each error to its field by DOCUMENT id, and a table of
       Courses cannot carry the id `pc-code` many times over. The state
       layer's error field stays the anchor — every wrapper here is
       `pc-code-<row>` and the errors it returns are mapped onto the row
       that produced them, so a message lands under the input it is
       about instead of under whichever row happened to be first. */
    var rows = courses.map(function (c, i) {
      var g = data.grouping(c.groupingId);
      return '<tr>' +
        '<td data-label="Programme">' + esc(g ? g.name : '—') + '</td>' +
        '<td data-label="Course (canonical)"><span class="tmain">' + esc(c.name) + '</span>' +
        '<span class="tsub">' + esc(c.id) + '</span></td>' +
        '<td data-label="Course code">' +
        '<div class="field" id="pc-code-' + i + '" style="margin-bottom:0">' +
        '<label class="sr-only" for="pc-code-i-' + i + '">Canonical Course code for ' + esc(c.name) +
        ' (optional)</label>' +
        '<input type="text" id="pc-code-i-' + i + '" data-course="' + esc(c.id) + '" class="cellinput" ' +
        'maxlength="40" value="' + esc(c.code || '') + '" placeholder="Optional"></div></td>' +
        /* Provenance, not status — the same discipline the structure
           screens follow. A Course nobody has ever given a code says
           so, rather than showing an empty cell that could read as a
           value that failed to load. */
        '<td data-label="Last set">' + (c.codeSetBy
          ? esc(c.codeSetBy) + '<span class="tsub">' + esc(util.fmtDate(c.codeSetAt)) + '</span>'
          : '<span class="muted">Never set</span>') + '</td>' +
        '</tr>';
    }).join('');

    var html =
      ui.phead('Course codes',
        courses.length + ' ' + util.plural(courses.length, 'Course') + ' in your assigned scope') +
      scopeGapNote(actor) +
      ui.alertBox('info', 'The canonical code — one Course, one code, platform-wide',
        '<p>This is the platform&rsquo;s own code for a Course. It is <strong>optional</strong>, and a Course ' +
        'with no code is a normal state, not a missing one. When a code is set it must be unique across the ' +
        'whole platform &mdash; unlike a Course <em>name</em>, which only has to be unique inside its ' +
        'Programme.</p>' +
        '<p>It is <strong>not</strong> an institution&rsquo;s local course code. Each Tenant Admin records ' +
        'theirs against the same canonical Course, on their own Academic mappings screen, and the two are ' +
        'shown side by side there. Neither overwrites the other.</p>' +
        '<p>The Super Admin also has access to this field, on the Course master record. It is one value, ' +
        'reached from two places &mdash; not two codes.</p>') +
      '<div class="tablecard" style="margin-top:16px">' +
      '<form id="cc-form" novalidate><div class="form-errors"></div>' +
      '<div class="tscroll"><table class="dt maptable">' +
      '<caption class="sr-only">Canonical Course codes for the Courses in this Content Manager&rsquo;s scope</caption>' +
      '<thead><tr><th scope="col">Programme</th><th scope="col">Course (canonical)</th>' +
      '<th scope="col">Course code</th><th scope="col">Last set</th></tr></thead><tbody>' +
      rows + '</tbody></table></div>' +
      '<div class="formact"><button class="btn pri" type="submit" id="cc-save">Save Course codes</button>' +
      '<span class="formnote">Each row is saved on its own. Clearing a box removes that Course&rsquo;s code and ' +
      'leaves it with none. A code another Course already holds is refused &mdash; clear it there first, then ' +
      'set it here.</span></div>' +
      '</form></div>' +
      '<div class="grid-rail" style="margin-top:18px">' +
      '<div class="stack">' + boundaryCard + '</div>' +
      '<div class="stack">' + scopeCard + asideNote + '</div>' +
      '</div>';

    return shell(actor, 'courses', 'Course codes', html, function () {
      var form = document.getElementById('cc-form');
      if (!form) { return; }
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var inputs = Array.prototype.slice.call(form.querySelectorAll('[data-course]'));

        /* CAUGHT HERE RATHER THAN ROW BY ROW. Two rows typed with the
           same code are a single mistake, and letting the first one
           save before the second collided with it would leave the
           Course a code moved OFF holding nothing, for no reason the
           person could see. Nothing is written until this passes.

           The key is prefixed because this map is keyed by whatever a
           person typed: a bare `{}` already answers to `constructor`,
           `toString` and the rest of Object.prototype, so a Course code
           typed as one of those words would read as an existing entry
           and the row would be flagged against nothing. */
        var dupErrs = [];
        var firstAt = {};
        inputs.forEach(function (input, i) {
          var typed = input.value.trim();
          if (!typed) { return; }
          var key = 'code:' + typed.toLowerCase();
          if (firstAt[key] === undefined) { firstAt[key] = i; return; }
          /* Each row's message quotes THAT row's text. The two rows
             collide case-insensitively, so they are not necessarily
             typed the same way, and telling somebody their row says
             something it does not is worse than saying nothing. */
          var tail = ' is also on another row. A canonical Course code identifies one Course across the ' +
            'whole platform, so no two Courses may carry it. Nothing was saved.';
          dupErrs.push({ field: 'pc-code-' + firstAt[key],
            message: 'The code ' + inputs[firstAt[key]].value.trim() + tail });
          dupErrs.push({ field: 'pc-code-' + i, message: 'The code ' + typed + tail });
        });
        if (!ui.showErrors(form, dupErrs, 'No Course code was saved')) { return; }

        var saved = 0;
        var writeErrs = [];
        inputs.forEach(function (input, i) {
          var cid = input.getAttribute('data-course');
          var next = input.value.trim();
          var current = state.courseRecord(cid);
          if (current && String(current.code || '') === next) { return; }
          var res = state.updateCourseCode(actor.id, cid, next);
          if (res.ok) { saved += 1; return; }
          res.errors.forEach(function (err) {
            writeErrs.push({ field: 'pc-code-' + i, message: err.message });
          });
        });

        /* NO RE-RENDER WHILE A MESSAGE IS ON SCREEN. Re-rendering would
           rebuild the form and wipe the very errors that explain why
           some rows did not save; the rows that DID save already show
           the values the person typed, so nothing on screen is stale. */
        if (writeErrs.length) {
          ui.showErrors(form, writeErrs,
            saved ? 'Some Course codes were not saved' : 'No Course code was saved');
          ui.toast(saved
            ? saved + ' ' + util.plural(saved, 'Course code') + ' saved; the rest are unchanged.'
            : 'Nothing was saved.', 'info');
          return;
        }
        if (!saved) { ui.toast('No changes to save.', 'info'); return; }
        ui.toast(saved + ' ' + util.plural(saved, 'Course code') + ' saved.');
        XRSLP.render(false);
      });
    });
  };

  XRSLP.managerUI = {
    href: href,
    nav: function (actor, activeKey) {
      var o = state.managerOverview(actor.id);
      var lib = state.contentForManager(actor.id).length;
      var cnt = state.coursesForManager(actor.id).length;
      return [
        { href: href.mOverview(actor.id), icon: 'home', label: 'Overview',
          active: activeKey === 'overview', count: 0 },
        { href: href.mLibrary(actor.id), icon: 'layers', label: 'Content Library',
          active: activeKey === 'library', count: lib,
          countLabel: util.plural(lib, 'item') + ' in your scope' },
        { href: href.mQueue(actor.id), icon: 'doc', label: 'Publication queue',
          active: activeKey === 'queue', count: o.awaitingPublication,
          countLabel: util.plural(o.awaitingPublication, 'item') + ' awaiting a publication decision' },
        /* Course master data, not content — which is why it sits below
           the two content surfaces rather than among them. The count is
           the Courses in reach, not a queue: nothing here is waiting on
           a decision, and a Course with no code is not a task. */
        { href: coursesHref(actor.id), icon: 'book', label: 'Course codes',
          active: activeKey === 'courses', count: cnt,
          countLabel: util.plural(cnt, 'Course') + ' in your assigned scope' },
        { href: href.mHelp(actor.id), icon: 'alertCirc', label: 'Help',
          active: activeKey === 'help', count: 0 }
      ];
    }
  };
})();
