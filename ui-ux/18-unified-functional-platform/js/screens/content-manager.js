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

   What this role CANNOT do:
     · publish an item that carries no academic approval. The guard is
       in `state.publishContent()`, not in this screen, so a
       hand-driven action fails the same way.
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

  var libFilter = { status: 'all', q: '', course: 'all', tech: 'all' };

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

    var tiles = '<div class="statgrid">' +
      cui.statTile(o.published, 'Published experiments', 'in the Content Library') +
      cui.statTile(o.awaitingPublication, 'Awaiting publication', 'academically approved') +
      cui.statTile(o.inAcademicReview, 'In academic review', 'with an Academic Reviewer') +
      cui.statTile(o.withVendor, 'With a Vendor', 'draft or returned for correction') +
      '</div>';

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
      '<th scope="col">Status</th><th scope="col">Currently with</th>' +
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
            '<td data-label="Currently with">' + esc(cui.holderLine(r, 'manager')) + '</td>' +
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
        '<button class="btn sec" type="button" id="m-changes">' + ui.ic('alert') + 'Request changes</button>';
    }
    /* Canonical content metadata is the Content Manager's (STK31-09).
       It is editable on an item in the library — never the Learning
       Outcomes, which stay academically owned. */
    if (state.canonicalEditable(rec)) {
      actions += '<a class="btn sec" href="' + href.mMetadata(actor.id, rec.id) + '">' + ui.ic('edit') +
        'Edit canonical metadata</a>';
    }

    var decisionCard = atGate
      ? ui.card('Publication decision',
          '<div class="form-errors"></div>' +
          '<div class="field" id="f-cm-comment" style="margin-bottom:10px">' +
          '<label for="i-cm-comment">Reason for requesting changes</label>' +
          '<textarea id="i-cm-comment" rows="3" maxlength="1200" aria-describedby="h-cm-comment"></textarea>' +
          '<p class="hint" id="h-cm-comment">Required when returning the submission to the Vendor. Internal to ' +
          'the content workflow; never shown in the public catalogue.</p></div>' +
          '<p class="dnote">' + ui.ic('info', 'sm') +
          (approvalStillDescribes(rec)
            ? 'Returning an item at this gate sends it back to you when the Vendor resubmits — the academic ' +
              'validation it has already passed is not repeated.'
            : 'The recorded academic approval no longer describes this item, so returning it now sends it ' +
              'back through academic review when the Vendor resubmits, not back to you.') + '</p>')
      : '';

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
      ui.card('Technology delivery', cui.deliveryRows(rec),
        'Vendor submitted — read-only') +
      ui.card('Supporting documentation', cui.documentsList(rec.documents)) +
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
      ui.card('History', cui.historyTimeline(rec)) +
      '</div></div>';

    return shell(actor, published ? 'library' : 'queue', rec.name, html, function () {
      if (!atGate) { return; }
      bindPublish(actor, rec, ready);
    });
  };

  function bindPublish(actor, rec, ready) {
    var pub = document.getElementById('m-publish');
    var chg = document.getElementById('m-changes');

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

    if (chg) {
      chg.addEventListener('click', function () {
        var el = document.getElementById('i-cm-comment');
        var text = el ? el.value.trim() : '';
        if (!text) {
          ui.showErrors(document.getElementById('f-cm-comment').closest('.card'),
            [{ field: 'f-cm-comment', message: 'Enter the reason before returning this item to the Vendor.' }],
            'A returned item needs a reason');
          if (el) { el.focus(); }
          ui.toast('Enter your reason before requesting changes.', 'info');
          return;
        }
        ui.openDialog({
          title: 'Request changes?',
          bodyHTML: '<p>This returns <strong>' + esc(rec.name) + '</strong> to the Vendor for correction, with ' +
            'your reason.</p><blockquote class="qquote">' + esc(text) + '</blockquote>' +
            '<div class="consequence">' + ui.ic('info') +
            '<span>' + (approvalStillDescribes(rec)
              ? 'The academic approval already recorded is kept. When the Vendor resubmits, the item ' +
                'returns to this queue rather than to academic review.'
              : 'The academic approval already recorded no longer describes this item, so it is not ' +
                'carried forward. When the Vendor resubmits, the item goes back through academic review ' +
                'rather than returning to this queue.') + '</span></div>' +
            /* Same honesty as the academic gate: a Vendor whose scope
               was withdrawn cannot resubmit, so the sentence above would
               describe a return that never comes. */
            (state.vendorScopeWithdrawn(rec, rec.createdBy)
              ? '<div class="consequence">' + ui.ic('alert') +
                '<span>The Vendor who submitted this no longer holds a role scope covering it, so they ' +
                'cannot correct or resubmit it. It will stay returned until the Super Admin restores their ' +
                'scope.</span></div>'
              : ''),
          okLabel: 'Request changes',
          onConfirm: function () {
            var updated = state.requestChangesContent(actor.id, rec.id, text);
            if (!updated) { ui.toast('Changes could not be requested.', 'info'); return; }
            ui.toast('Changes requested — returned to the Vendor.');
            XRSLP.router.go(href.mQueue(actor.id));
          }
        });
      });
    }
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
        /* This used to say the master records are administered "on a
           Super Admin surface this prototype does not build", which
           contradicts the Super Admin's own content-governance screen:
           that surface EXISTS and inspects the structure — what is not
           built anywhere is CREATE and DELETE for the grouping and
           Course records, because no source describes either operation
           and those ids are load-bearing for every access record,
           academic mapping and student assignment. */
        '<li>' + ui.ic('x') + '<span><strong>Programme / Course master records</strong> — platform-controlled structure. The Super Admin inspects it on Content governance; creating or deleting a grouping or a Course is not built anywhere, because no source describes either operation.</span></li>' +
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

  XRSLP.managerUI = {
    href: href,
    nav: function (actor, activeKey) {
      var o = state.managerOverview(actor.id);
      var lib = state.contentForManager(actor.id).length;
      return [
        { href: href.mOverview(actor.id), icon: 'home', label: 'Overview',
          active: activeKey === 'overview', count: 0 },
        { href: href.mLibrary(actor.id), icon: 'layers', label: 'Content Library',
          active: activeKey === 'library', count: lib,
          countLabel: util.plural(lib, 'item') + ' in your scope' },
        { href: href.mQueue(actor.id), icon: 'doc', label: 'Publication queue',
          active: activeKey === 'queue', count: o.awaitingPublication,
          countLabel: util.plural(o.awaitingPublication, 'item') + ' awaiting a publication decision' },
        { href: href.mHelp(actor.id), icon: 'alertCirc', label: 'Help',
          active: activeKey === 'help', count: 0 }
      ];
    }
  };
})();
