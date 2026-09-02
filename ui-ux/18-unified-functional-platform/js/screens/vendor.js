/* ============================================================
   Unified Functional Platform — VENDOR workspace (Implementation 05).

   `Vendor` is one of the seven formal roles (STK31-01). It means
   CONTENT PRODUCER / SUBMITTER, and it covers an external vendor AND an
   internal BITS / WILP content-development team alike (STK31-03) —
   there is no separate internal-developer role.

   Invariants enforced on this plane:

     · A VENDOR CAN NEVER PUBLISH (FRD 1.4.5 — the only explicit role
       prohibition, and STK31-03 extends it to internal submitters).
       There is no publish control here, and `state.publishContent()`
       refuses a Vendor actor even if one is reached directly.
     · A Vendor DOES NOT OWN LEARNING OUTCOMES (STK31-08). This editor
       has no outcomes field; they are authored by the Academic Reviewer
       and shown here read-only once they exist.
     · A Vendor SELECTS a canonical Programme / Course. The canonical
       academic structure is platform-controlled (STK31-10) and is not
       authored here.
     · SOURCE CODE IS NOT REQUIRED (STK31-37). AR / VR / MR carry
       package or reference metadata; Web / WebGL carries a hosted link.
     · A draft is not catalogue content. Nothing on this plane is
       reachable from the public catalogue, tenant access, Faculty or
       Student until the Content Manager publishes it.

   Every navigation destination is implemented. There is no Invoices,
   Contracts, Payments, Messages, Analytics or Support entry: none is
   built, and a link that leads nowhere is worse than an absent one.
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

  /* Screen-local filter state, exactly as the catalogue and the Faculty
     workspace keep theirs. */
  var listFilter = { status: 'all', q: '' };

  /* ---------------- identity resolution ----------------
     `#/vendor` resolves the prototype's currently-selected Vendor, or
     offers the chooser. A direct `#/vendor/<id>/…` route must resolve to
     a REAL Vendor actor; anything else is not found. */
  function resolveActor(params) {
    var a = state.contentActor(params.actorId);
    if (!a || a.role !== state.CONTENT_ROLE.VENDOR) { return null; }
    return a;
  }

  function shell(actor, navKey, title, html) {
    return { title: title, html: html, area: 'vendor', navKey: navKey, contentActor: actor };
  }

  XRSLP.screens.vendorHome = function () {
    discardWork();
    var chosen = state.protoVendor();
    if (chosen) { return { redirect: href.vOverview(chosen.id) }; }
    return {
      title: 'Vendor workspace',
      area: 'vendor',
      navKey: 'overview',
      contentActor: null,
      html: cui.chooserScreen('vendor', {
        title: 'Vendor workspace',
        actionLabel: 'Open workspace',
        metaHTML: 'Choose which sample Vendor identity to view the content submission workspace as.'
      }),
      after: bindChooser(function (id) {
        state.setProtoVendor(id);
        XRSLP.router.go(href.vOverview(id));
      })
    };
  };

  function bindChooser(onPick) {
    return function () {
      Array.prototype.slice.call(document.querySelectorAll('[data-actor]')).forEach(function (btn) {
        btn.addEventListener('click', function () { onPick(btn.getAttribute('data-actor')); });
      });
    };
  }

  /* ---------------- Overview ----------------
     Every tile counts records that exist. There is no vendor score, no
     quality rating, no SLA and no revenue: none is in any source. */
  XRSLP.screens.vendorOverview = function (params) {
    discardWork();
    var actor = resolveActor(params);
    if (!actor) { return XRSLP.screens.notFound(); }
    var o = state.vendorOverview(actor.id);
    var courses = state.actorCourseIds(actor.id);

    var tiles = '<div class="statgrid">' +
      cui.statTile(o.draft, 'Draft', 'not yet submitted') +
      cui.statTile(o.inAcademicReview, 'In academic review', 'with the Academic Reviewer') +
      cui.statTile(o.changesRequested, 'Changes requested', 'returned to you') +
      cui.statTile(o.awaitingPublication, 'Awaiting publication', 'with the Content Manager') +
      cui.statTile(o.published, 'Published', 'live in the catalogue') +
      '</div>';

    var attention = [];
    o.returned.forEach(function (r) {
      var last = state.academicReviewsFor(r.id)[0];
      attention.push({
        kind: 'warn', icon: 'alert',
        title: r.name,
        body: r.status === CS.CHANGES_ACADEMIC
          ? 'Returned at academic review' + (last && last.comment ? ' — ' + last.comment : '.')
          : 'Returned at content readiness review — see the submission for the reason.',
        actionHTML: '<a class="btn sec sm" href="' + href.vEdit(actor.id, r.id) + '">Correct submission</a>'
      });
    });
    o.incompleteDrafts.forEach(function (r) {
      attention.push({
        kind: '', icon: 'edit', title: r.name,
        body: 'Draft is missing information required before it can be submitted for academic review.',
        actionHTML: '<a class="btn sec sm" href="' + href.vEdit(actor.id, r.id) + '">Continue draft</a>'
      });
    });
    o.readyDrafts.forEach(function (r) {
      attention.push({
        kind: '', icon: 'check', title: r.name,
        body: 'Draft is complete and can be submitted for academic review.',
        actionHTML: '<a class="btn sec sm" href="' + href.vRecord(actor.id, r.id) + '">Open submission</a>'
      });
    });
    o.recentlyPublished.forEach(function (r) {
      attention.push({
        kind: 'good', icon: 'check', title: r.name,
        body: 'Published' + (r.publication ? ' on ' + util.fmtDate(r.publication.publishedAt) : '') +
          ' by the Content Manager. It is now discoverable in the public catalogue.',
        actionHTML: '<a class="btn sec sm" href="' + href.vRecord(actor.id, r.id) + '">View</a>'
      });
    });

    var attnHTML = attention.length
      ? '<div class="attn">' + attention.map(function (a) {
          return '<div class="at-row ' + a.kind + '"><span class="at-ic">' + ui.ic(a.icon) + '</span>' +
            '<div class="at-body"><div class="at-t">' + esc(a.title) + '</div>' +
            '<p>' + esc(a.body) + '</p></div>' + a.actionHTML + '</div>';
        }).join('') + '</div>'
      : ui.emptyState({
          icon: 'check', heading: 'h3',
          title: 'Nothing needs your attention',
          body: 'No submission has been returned to you and no draft is waiting to be completed.'
        });

    var scopeHTML = courses.length
      ? '<ul class="reslist plain">' + courses.map(function (cid) {
          var c = data.course(cid);
          var g = c ? data.grouping(c.groupingId) : null;
          return '<li>' + ui.ic('book') + '<span>' + esc(g ? g.name + ' › ' : '') +
            '<strong>' + esc(c ? c.name : cid) + '</strong></span></li>';
        }).join('') + '</ul>'
      : '<p class="muted">No Course has been assigned to you.</p>';

    var html =
      ui.phead('Overview',
        esc(actor.organisation) + ' · ' + esc(actor.name),
        '<a class="btn pri" href="' + href.vNew(actor.id) + '">' + ui.ic('plus') + 'Create experiment</a>') +
      tiles +
      '<div class="grid-rail" style="margin-top:18px">' +
      '<div class="stack">' +
      ui.card('Needs your attention', attnHTML) +
      '</div>' +
      '<div class="stack">' +
      ui.card('Courses you may submit into', scopeHTML,
        'Assigned course scope') +
      ui.card('What happens after you submit',
        '<ol class="steplist">' +
        '<li><strong>Academic review.</strong> An Academic Reviewer validates the academic content and authors the Learning Outcomes.</li>' +
        '<li><strong>Content readiness review.</strong> The Content Manager checks the canonical metadata and the technical delivery information.</li>' +
        '<li><strong>Publish.</strong> The Content Manager performs the first publication. A Vendor never publishes.</li>' +
        '</ol>' +
        '<p class="dnote">' + ui.ic('info', 'sm') +
        'Publication makes an experiment discoverable in the catalogue. It does not grant it to any institution — ' +
        'that still requires an institutional request and Super Admin approval.</p>') +
      '</div></div>';

    return shell(actor, 'overview', 'Vendor overview', html);
  };

  /* ---------------- My Experiments ---------------- */
  XRSLP.screens.vendorExperiments = function (params) {
    discardWork();
    var actor = resolveActor(params);
    if (!actor) { return XRSLP.screens.notFound(); }
    var all = state.contentForVendor(actor.id);

    if (!all.length) {
      var emptyHTML =
        ui.phead('My Experiments', esc(actor.organisation),
          '<a class="btn pri" href="' + href.vNew(actor.id) + '">' + ui.ic('plus') + 'Create experiment</a>') +
        '<div class="tablecard">' + ui.emptyState({
          icon: 'flask',
          title: 'You have not created an experiment yet',
          body: 'Create an experiment draft, add its technical delivery details, and submit it for academic review ' +
            'when it is complete.',
          actionsHTML: '<a class="btn pri" href="' + href.vNew(actor.id) + '">Create experiment</a>'
        }) + '</div>';
      return shell(actor, 'experiments', 'My Experiments', emptyHTML);
    }

    cui.normaliseFilters(all, listFilter);
    var html =
      ui.phead('My Experiments', esc(actor.organisation),
        '<a class="btn pri" href="' + href.vNew(actor.id) + '">' + ui.ic('plus') + 'Create experiment</a>') +
      '<div class="tablecard">' +
      '<div class="listbar">' +
      '<label for="v-q">Search' +
      '<input type="text" id="v-q" class="cellinput" placeholder="Experiment or course" value="' +
      esc(listFilter.q) + '"></label>' +
      '<label for="v-status">Status<select id="v-status">' +
      cui.statusFilterOptions(all, listFilter.status) + '</select></label>' +
      '<span class="lcount" id="v-count"></span>' +
      '</div>' +
      '<div class="tscroll"><table class="dt" id="v-table">' +
      '<caption class="sr-only">Experiments you have created, with their current status</caption>' +
      '<thead><tr>' +
      '<th scope="col">Experiment</th><th scope="col">Course</th><th scope="col">Technologies</th>' +
      '<th scope="col">Version</th><th scope="col">Status</th><th scope="col">Currently with</th>' +
      '<th scope="col"><span class="sr-only">Actions</span></th>' +
      '</tr></thead><tbody id="v-rows"></tbody></table></div>' +
      '<div id="v-empty"></div>' +
      '</div>';

    return withAfter(shell(actor, 'experiments', 'My Experiments', html), function () {
      bindList(actor, all, 'v', listFilter, function () {
        return {
          title: 'No experiment matches',
          body: 'No experiment you have created matches the current search and status filter.'
        };
      });
    });
  };

  /* ---------------- Submissions ----------------
     Everything that has entered the governance chain at least once —
     the answer to "where is my work and what came back?". */
  XRSLP.screens.vendorSubmissions = function (params) {
    discardWork();
    var actor = resolveActor(params);
    if (!actor) { return XRSLP.screens.notFound(); }
    var subs = state.contentForVendor(actor.id).filter(function (r) {
      return r.status !== CS.DRAFT || r.submittedAt;
    });

    if (!subs.length) {
      var emptyHTML = ui.phead('Submissions', esc(actor.organisation)) +
        '<div class="tablecard">' + ui.emptyState({
          icon: 'doc',
          title: 'You have not submitted anything yet',
          body: 'A draft appears here once you submit it for academic review. Until then it stays in ' +
            'My Experiments and is visible to nobody else.',
          actionsHTML: '<a class="btn sec" href="' + href.vExperiments(actor.id) + '">Go to My Experiments</a>'
        }) + '</div>';
      return shell(actor, 'submissions', 'Submissions', emptyHTML);
    }

    var returned = subs.filter(function (r) {
      return r.status === CS.CHANGES_ACADEMIC || r.status === CS.CHANGES_CONTENT;
    });

    var cards = subs.map(function (r) {
      var last = state.academicReviewsFor(r.id)[0];
      var isReturned = r.status === CS.CHANGES_ACADEMIC || r.status === CS.CHANGES_CONTENT;
      return '<article class="lcard sub-card">' +
        '<div class="lc-head">' +
        '<div class="lc-ctx">' + cui.contextLine(r) + '</div>' +
        '<h2><a href="' + href.vRecord(actor.id, r.id) + '">' + esc(r.name) + '</a></h2>' +
        '</div>' +
        '<div class="lc-badges">' + cui.statusBadge(r) + cui.revisionChip(r) + cui.resubmittedChip(r) + '</div>' +
        '<p class="lc-sum">' + esc(cui.holderLine(r, 'vendor')) + '</p>' +
        (isReturned && r.status === CS.CHANGES_ACADEMIC && last && last.comment
          ? '<div class="retbox">' + ui.ic('alert', 'sm') +
            '<div><strong>' + esc(last.reviewerName) + ' · Academic Reviewer</strong><p>' +
            esc(last.comment) + '</p></div></div>'
          : '') +
        '<div class="lc-foot">' + ui.techBadges(r.technologies) +
        '<a class="btn sec sm" href="' + href.vRecord(actor.id, r.id) + '">Open</a>' +
        '</div></article>';
    }).join('');

    var html =
      ui.phead('Submissions', esc(actor.organisation)) +
      (returned.length
        ? ui.alertBox('warning', util.plural(returned.length, 'submission') + ' returned for correction',
            '<p>Open the submission to read the reason, correct it and resubmit.</p>', 'status')
        : '') +
      '<div class="lgrid" style="margin-top:16px">' + cards + '</div>';

    return shell(actor, 'submissions', 'Submissions', html);
  };

  /* ---------------- submission detail ---------------- */
  XRSLP.screens.vendorRecord = function (params) {
    discardWork();
    var actor = resolveActor(params);
    if (!actor) { return XRSLP.screens.notFound(); }
    var rec = state.contentRecord(params.recordId);
    /* Scope: a Vendor reads their OWN work. Ownership, not the course
       assignment, is the rule — a hand-typed route to another Vendor's
       draft is not found. */
    if (!rec || rec.createdBy !== actor.id) { return XRSLP.screens.notFound(); }

    var canEdit = state.vendorCanEdit(rec, actor.id);
    var errs = state.validateContent(rec, 'submit', { exceptId: rec.id });
    var lastReview = state.academicReviewsFor(rec.id)[0];

    var statusNote;
    switch (rec.status) {
      case CS.DRAFT:
        statusNote = errs.length
          ? ui.alertBox('info', 'Draft — not yet submitted',
              '<p>Finish the details below and submit when ready. It goes to academic review first.</p>' +
              '<ul class="blocklist">' + errs.map(function (e) {
                return '<li>' + esc(e.message) + '</li>'; }).join('') + '</ul>')
          : ui.alertBox('success', 'Draft — ready to submit',
              '<p>Everything required for academic review is present. Submitting sends this to the Academic ' +
              'Reviewer; you can follow its status here at every stage.</p>');
        break;
      case CS.ACADEMIC_REVIEW:
        statusNote = ui.alertBox('info',
          rec.resubmitted ? 'Resubmitted — academic review resumed' : 'In academic review',
          '<p>This submission is with the Academic Reviewer, who validates the academic content and authors the ' +
          'Learning Outcomes. It is read-only for you while they hold it, so the revision they are reading ' +
          'cannot change underneath them.</p>');
        break;
      case CS.CHANGES_ACADEMIC:
        statusNote = ui.alertBox('warning', 'Changes requested — academic review',
          (lastReview && lastReview.comment
            ? '<p><strong>' + esc(lastReview.reviewerName) + ' · Academic Reviewer · ' +
              esc(util.fmtDateTime(lastReview.at)) + '</strong></p><p>' + esc(lastReview.comment) + '</p>'
            : '<p>This submission was returned for correction.</p>') +
          '<p>Correct the submission and resubmit. It returns to academic review.</p>');
        break;
      case CS.CONTENT_REVIEW:
        statusNote = ui.alertBox('info', 'Academic validation complete — now in content readiness review',
          '<p>The Content Manager is checking the canonical metadata and the technical delivery information, and ' +
          'performs the first publication once satisfied. It is read-only for you while they hold it.</p>');
        break;
      case CS.CHANGES_CONTENT:
        statusNote = ui.alertBox('warning', 'Changes requested — content readiness',
          '<p>' + esc(changesContentNote(rec)) + '</p>' +
          '<p>Correct the submission and resubmit. It returns to content readiness review — the academic ' +
          'validation it has already passed is not repeated.</p>');
        break;
      case CS.PUBLISHED:
        statusNote = ui.alertBox('success',
          'Published' + (rec.publication ? ' · ' + util.fmtDate(rec.publication.publishedAt) : ''),
          '<p>This experiment is published and discoverable in the public catalogue. Publication does ' +
          '<strong>not</strong> grant it to any institution: an institution still requests it and the Super Admin ' +
          'approves that request.</p>');
        break;
      default:
        statusNote = '';
    }

    var actions = '';
    if (canEdit) {
      actions += '<a class="btn sec" href="' + href.vEdit(actor.id, rec.id) + '">' + ui.ic('edit') +
        (rec.status === CS.DRAFT ? 'Edit draft' : 'Correct submission') + '</a>';
      actions += '<button class="btn pri" type="button" id="v-submit"' +
        (errs.length ? ' aria-disabled="true"' : '') + '>' +
        (rec.status === CS.DRAFT ? 'Submit for academic review' : 'Resubmit for review') + '</button>';
    }

    var html =
      ui.crumbs([{ label: 'My Experiments', href: href.vExperiments(actor.id) }, { label: rec.name }]) +
      ui.phead(rec.name,
        cui.contextLine(rec) + ' · ' + esc(cui.holderLine(rec, 'vendor')),
        actions,
        ' ' + cui.statusBadge(rec) + cui.revisionChip(rec) + cui.resubmittedChip(rec)) +
      statusNote +
      '<div class="grid-rail" style="margin-top:18px">' +
      '<div class="stack">' +
      ui.card('Experiment', cui.recordSummaryKV(rec, { showVendor: false, showVendorNotes: true })) +
      ui.card('Technology delivery', cui.deliveryRows(rec),
        'AR / VR / MR — package · Web — hosted link') +
      ui.card('Supporting documentation', cui.documentsList(rec.documents)) +
      ui.card('Learning outcomes',
        cui.outcomesList(rec.outcomes,
          'No Learning Outcomes yet. They are authored by the Academic Reviewer during academic review, ' +
          'not by the Vendor.'),
        'Academic Reviewer owned') +
      (rec.status === CS.PUBLISHED ? ui.card('Publication', cui.publicationCard(rec)) : '') +
      '</div>' +
      '<div class="stack">' +
      (rec.status === CS.PUBLISHED ? cui.publishedNextVersionNote() : '') +
      ui.card('History', cui.historyTimeline(rec)) +
      '</div></div>';

    return withAfter(shell(actor, 'submissions', rec.name, html), function () {
      var btn = document.getElementById('v-submit');
      if (!btn) { return; }
      btn.addEventListener('click', function () {
        if (errs.length) {
          ui.toast('This submission is not complete yet — open it for editing to fill in what is missing.', 'info');
          return;
        }
        ui.openDialog({
          title: rec.status === CS.DRAFT ? 'Submit for academic review?' : 'Resubmit for review?',
          bodyHTML: '<p>This sends <strong>' + esc(rec.name) + '</strong> to ' +
            (rec.returnedGate === 'content'
              ? 'the <strong>Content Manager</strong> for content readiness review'
              : 'an <strong>Academic Reviewer</strong>') +
            '. While it is with them the submission becomes read-only for you.</p>' +
            '<div class="consequence">' + ui.ic('info') +
            '<span>Submitting does not publish anything. First publication is performed by the Content ' +
            'Manager, and a Vendor never publishes.</span></div>',
          okLabel: rec.status === CS.DRAFT ? 'Submit for review' : 'Resubmit',
          onConfirm: function () {
            var wasAtContentGate = rec.returnedGate === 'content';
            var updated = state.submitContent(actor.id, rec.id);
            if (!updated) {
              ui.toast('This submission could not be sent for review.', 'info');
              return;
            }
            if (updated.status === CS.CONTENT_REVIEW) {
              ui.toast('Resubmitted — now in content readiness review.');
            } else if (wasAtContentGate) {
              ui.toast('The academic content changed, so the earlier approval no longer applies — ' +
                'resubmitted for academic review.', 'info');
            } else {
              ui.toast('Submitted — now in academic review.');
            }
            XRSLP.render(false);
          }
        });
      });
    });
  };

  function changesContentNote(rec) {
    var h = (rec.history || []).filter(function (x) { return x.kind === 'changes'; })[0];
    return h && h.note ? h.note : 'This submission was returned by the Content Manager for correction.';
  }

  /* ---------------- create / edit ----------------
     One form, two entry points (`U-VND-02` and `U-VND-03` inherit the
     same fields). It is a field-set container rather than a fixed
     schema form: the canonical metadata schema is not settled (ND-05),
     so adding a field later must not move the controls. */
  XRSLP.screens.vendorNew = function (params) {
    var actor = resolveActor(params);
    if (!actor) { return XRSLP.screens.notFound(); }
    return editorScreen(actor, null);
  };

  XRSLP.screens.vendorEdit = function (params) {
    var actor = resolveActor(params);
    if (!actor) { return XRSLP.screens.notFound(); }
    var rec = state.contentRecord(params.recordId);
    if (!rec || rec.createdBy !== actor.id) { return XRSLP.screens.notFound(); }
    /* A record under review, or published, is not editable by the
       Vendor. The route resolves; the editor refuses and says why. */
    if (!state.vendorCanEdit(rec, actor.id)) {
      var lockHTML =
        ui.crumbs([{ label: 'My Experiments', href: href.vExperiments(actor.id) },
                   { label: rec.name, href: href.vRecord(actor.id, rec.id) },
                   { label: 'Edit' }]) +
        ui.phead(rec.name, cui.contextLine(rec), '', ' ' + cui.statusBadge(rec)) +
        ui.alertBox('warning', 'This submission cannot be edited right now',
          '<p>' + esc(rec.status === CS.PUBLISHED
            ? 'This experiment is published. The published revision is fixed: replacing it with a newer version ' +
              'is a Super Admin Release / Hold decision on a different object, and it is not part of first ' +
              'publication.'
            : 'It is currently with ' + (rec.status === CS.ACADEMIC_REVIEW ? 'the Academic Reviewer' : 'the Content Manager') +
              '. Editing it now would change the revision they are reading. It becomes editable again if it is ' +
              'returned to you for correction.') + '</p>') +
        '<p style="margin-top:16px"><a class="btn sec" href="' + href.vRecord(actor.id, rec.id) +
        '">Back to the submission</a></p>';
      return shell(actor, 'experiments', rec.name, lockHTML);
    }
    return editorScreen(actor, rec);
  };

  /* Working copy for the editor. It is screen-local: nothing reaches
     state until Save draft is pressed, so an abandoned edit never
     mutates a stored record.

     It is also DISCARDED whenever it could be stale. Keeping a
     module-level copy alive across navigation was a real hazard: come
     back to a record the Content Manager had since corrected, or open
     the create form as a different Vendor, and the stale snapshot would
     be restored and written back over the stored record. The copy is
     therefore stamped with the record it came from, that record's event
     sequence, and the actor who opened it — and rebuilt if any of the
     three has moved. */
  var work = null;

  function freshWork(rec, actorId) {
    if (!rec) {
      return {
        id: null, courseId: '', name: '', summary: '', description: '',
        technologies: [], delivery: {}, documents: [], vendorNotes: '', versionLabel: '1.0',
        __actorId: actorId, __eventSeq: null
      };
    }
    var w = JSON.parse(JSON.stringify({
      id: rec.id, courseId: rec.courseId, name: rec.name, summary: rec.summary,
      description: rec.description, technologies: rec.technologies, delivery: rec.delivery,
      documents: rec.documents, vendorNotes: rec.vendorNotes, versionLabel: rec.versionLabel
    }));
    w.__actorId = actorId;
    w.__eventSeq = rec.eventSeq;
    return w;
  }

  /* Leaving the editor ABANDONS the edit — which is what Cancel, the
     breadcrumb and the side nav all mean. Every screen that is not the
     editor calls this, so an unsaved change can never be silently
     restored on the way back in and written over the stored record. */
  function discardWork() { work = null; }

  function workIsStale(rec, actorId) {
    if (!work) { return true; }
    if (work.__actorId !== actorId) { return true; }
    if (work.id !== (rec ? rec.id : null)) { return true; }
    if (rec && work.__eventSeq !== rec.eventSeq) { return true; }
    return false;
  }

  function editorScreen(actor, rec) {
    var editing = !!rec;
    var correcting = editing && (rec.status === CS.CHANGES_ACADEMIC || rec.status === CS.CHANGES_CONTENT);
    if (workIsStale(rec, actor.id)) { work = freshWork(rec, actor.id); }

    var allowedCourses = state.actorCourseIds(actor.id);
    if (!allowedCourses.length) {
      return shell(actor, 'experiments', 'Create experiment',
        ui.phead('Create experiment') +
        ui.alertBox('warning', 'No Course is assigned to you',
          '<p>A Vendor submits into a canonical Course they are assigned to. No assignment exists for this ' +
          'identity, so there is nothing to submit into.</p>'));
    }

    var lastReview = editing ? state.academicReviewsFor(rec.id)[0] : null;
    var returnedBox = '';
    if (correcting) {
      var note = rec.status === CS.CHANGES_ACADEMIC
        ? (lastReview ? { who: lastReview.reviewerName, role: 'Academic Reviewer', at: lastReview.at, text: lastReview.comment } : null)
        : contentChangeNote(rec);
      returnedBox = ui.alertBox('warning', 'Changes requested — correct and resubmit',
        note
          ? '<p><strong>' + esc(note.who) + ' · ' + esc(note.role) + ' · ' + esc(util.fmtDateTime(note.at)) +
            '</strong></p><p>' + esc(note.text) + '</p>'
          : '<p>This submission was returned for correction.</p>');
    }

    var courseOptions = '<option value="">— select a Course —</option>' +
      allowedCourses.map(function (cid) {
        var c = data.course(cid);
        if (!c) { return ''; }
        var g = data.grouping(c.groupingId);
        return '<option value="' + esc(c.id) + '"' + (work.courseId === c.id ? ' selected' : '') + '>' +
          esc((g ? g.name + ' › ' : '') + c.name) + '</option>';
      }).join('');

    var techChecks = data.TECH_ORDER.map(function (t) {
      var def = data.TECHNOLOGIES[t];
      var on = work.technologies.indexOf(t) !== -1;
      return '<label><input type="checkbox" class="v-tech" value="' + esc(t) + '"' + (on ? ' checked' : '') + '>' +
        '<span>' + esc(def.label) + ' — ' + esc(def.name) + '</span></label>';
    }).join('');

    var html =
      ui.crumbs(editing
        ? [{ label: 'My Experiments', href: href.vExperiments(actor.id) },
           { label: rec.name, href: href.vRecord(actor.id, rec.id) },
           { label: correcting ? 'Correct' : 'Edit' }]
        : [{ label: 'My Experiments', href: href.vExperiments(actor.id) }, { label: 'Create experiment' }]) +
      ui.phead(editing ? (correcting ? 'Correct submission' : 'Edit draft') : 'Create experiment',
        editing ? esc(rec.name) : esc(actor.organisation)) +
      returnedBox +
      '<form class="formwrap" id="v-form" novalidate>' +
      '<div class="stack">' +
      '<div class="form-errors"></div>' +

      ui.card('Academic placement',
        '<div class="field" id="f-course">' +
        '<label for="i-course">Course <span class="req" aria-hidden="true">*</span>' +
        '<span class="sr-only">(required)</span></label>' +
        '<select id="i-course" aria-describedby="h-course">' + courseOptions + '</select>' +
        '<p class="hint" id="h-course">The canonical Programme / Department and Course structure is ' +
        'platform-controlled. Select the Course this experiment belongs to; it cannot be created here.</p>' +
        '</div>') +

      ui.card('Experiment',
        '<div class="field" id="f-name">' +
        '<label for="i-name">Experiment name <span class="req" aria-hidden="true">*</span>' +
        '<span class="sr-only">(required)</span></label>' +
        '<input type="text" id="i-name" value="' + esc(work.name) + '" maxlength="120">' +
        '</div>' +
        '<div class="field" id="f-summary">' +
        '<label for="i-summary">Catalogue summary</label>' +
        '<textarea id="i-summary" rows="2" maxlength="300" aria-describedby="h-summary">' +
        esc(work.summary) + '</textarea>' +
        '<p class="hint" id="h-summary">One or two sentences. This is what a prospective institution reads in ' +
        'the catalogue listing.</p></div>' +
        '<div class="field" id="f-description">' +
        '<label for="i-description">Description</label>' +
        '<textarea id="i-description" rows="5" maxlength="1600">' + esc(work.description) + '</textarea>' +
        '</div>' +
        '<div class="frow">' +
        '<div class="field" id="f-version">' +
        '<label for="i-version">Version label</label>' +
        '<input type="text" id="i-version" value="' + esc(work.versionLabel) + '" maxlength="24" ' +
        'aria-describedby="h-version">' +
        '<p class="hint" id="h-version">Free text. A first submission is commonly 1.0, but no scheme is imposed.</p>' +
        '</div>' +
        '<div class="field"><label>Submission revision</label>' +
        '<p class="hint" style="margin-top:8px">' +
        esc(editing ? String(rec.revision) : '1') +
        ' — increases each time a returned submission is corrected and resubmitted.</p></div>' +
        '</div>') +

      (correcting && rec.returnedGate === 'content' && rec.academicReview
        ? ui.card('This correction returns to the Content Manager',
            '<p>The Content Manager asked for this change, so it goes back to them rather than through ' +
            'academic validation it has already passed.</p>' +
            '<p style="margin-top:8px">If you change the <strong>Course</strong>, the <strong>name</strong>, ' +
            'the <strong>summary</strong>, the <strong>description</strong> or the ' +
            '<strong>technology availability</strong>, that is no longer the work ' +
            esc(rec.academicReview.reviewerName) + ' approved — the approval is withdrawn and the submission ' +
            'returns to academic review instead. Correcting the delivery details or the documentation does ' +
            'not affect it.</p>')
        : '') +
      ui.card('Learning outcomes',
        ui.alertBox('info', 'Authored by the Academic Reviewer',
          '<p>Learning Outcomes are academically owned. They are written during academic review, not on this ' +
          'form, and they are published with the experiment.</p>') +
        (editing && rec.outcomes.length
          ? '<div style="margin-top:12px">' + cui.outcomesList(rec.outcomes) + '</div>' : '')) +

      ui.card('Technology availability',
        '<fieldset class="fgroup" id="f-tech" style="margin:0">' +
        '<legend>Technologies this experiment is available in</legend>' +
        '<div class="techchecks">' + techChecks + '</div>' +
        '<p class="hint">Select only what this experiment actually supports. An institution may later select ' +
        'any combination of what is available. Nothing is added automatically.</p>' +
        '</fieldset>' +
        '<div id="v-tech-panels" style="margin-top:4px"></div>',
        'AR / VR / MR — package · Web — hosted link') +

      ui.card('Supporting documentation',
        '<div id="v-docs"></div>' +
        '<div class="fileline" style="margin-top:10px">' +
        '<label class="btn sec sm" for="i-doc">Choose a document…' +
        '<input type="file" id="i-doc" class="sr-only"></label>' +
        '<span class="muted" id="i-doc-name">No document chosen</span>' +
        '</div>' +
        '<p class="dnote">' + ui.ic('info', 'sm') +
        'Prototype records document metadata only — file name and size. No file is uploaded or stored.</p>') +

      ui.card('Vendor technical notes',
        '<div class="field" style="margin-bottom:0">' +
        '<label for="i-notes">Notes for the reviewers</label>' +
        '<textarea id="i-notes" rows="3" maxlength="800" aria-describedby="h-notes">' +
        esc(work.vendorNotes) + '</textarea>' +
        '<p class="hint" id="h-notes">Internal to the content workflow. Never shown in the public catalogue.</p>' +
        '</div>') +

      '<div class="formact">' +
      '<button class="btn pri" type="button" id="v-save">Save draft</button>' +
      '<button class="btn sec" type="button" id="v-save-submit">' +
      esc(correcting
        ? (rec.returnedGate === 'content'
            ? 'Save and resubmit for content readiness review'
            : 'Save and resubmit for academic review')
        : 'Save and submit for academic review') + '</button>' +
      '<a class="btn gho" href="' + (editing ? href.vRecord(actor.id, rec.id) : href.vExperiments(actor.id)) +
      '">Cancel</a>' +
      '<span class="formnote">A draft is private to you. It does not appear in the public catalogue, ' +
      'to any institution, to Faculty or to any Student.</span>' +
      '</div>' +
      '</div>' +

      '<div class="formaside"><div class="stack">' +
      ui.card('Submission checklist', '<div id="v-check"></div>') +
      ui.card('What is not asked for here',
        '<ul class="reslist plain">' +
        '<li>' + ui.ic('x') + '<span>Source code, a repository or a container image — none is required of a Vendor.</span></li>' +
        '<li>' + ui.ic('x') + '<span>Learning Outcomes — academically owned by the Academic Reviewer.</span></li>' +
        '<li>' + ui.ic('x') + '<span>A price — no commercial value is represented anywhere in this prototype.</span></li>' +
        '<li>' + ui.ic('x') + '<span>A local course code or semester — those are tenant-side mappings.</span></li>' +
        '</ul>') +
      '</div></div>' +
      '</form>';

    return withAfter(shell(actor, 'experiments', editing ? 'Edit experiment' : 'Create experiment', html),
      function () { bindEditor(actor, rec); });
  }

  function contentChangeNote(rec) {
    var h = (rec.history || []).filter(function (x) { return x.kind === 'changes'; })[0];
    if (!h) { return null; }
    return { who: h.actorName || 'Content Manager', role: h.actorRole || 'Content Manager', at: h.at, note: h.note, text: h.note };
  }

  /* ---- technology panels: only the selected technologies, and only
          the fields that technology's delivery model actually uses ---- */
  function techPanelsHTML() {
    if (!work.technologies.length) {
      return '<p class="muted" style="margin-top:10px">Select at least one technology to enter its delivery ' +
        'details.</p>';
    }
    return data.sortTech(work.technologies).map(function (t) {
      var def = data.TECHNOLOGIES[t];
      var d = work.delivery[t] || {};
      var body;
      if (def.delivery === 'hosted') {
        body =
          '<div class="field" id="f-' + t + '-url">' +
          '<label for="i-' + t + '-url">Hosted experience URL</label>' +
          '<input type="text" id="i-' + t + '-url" class="v-d" data-t="' + t + '" data-k="url" ' +
          'value="' + esc(d.url || '') + '" placeholder="https://" aria-describedby="h-' + t + '-url">' +
          '<p class="hint" id="h-' + t + '-url">A full https:// address. The platform opens the hosted ' +
          'experience from this link; nothing is opened while you are authoring.</p></div>' +
          '<div class="field" id="f-' + t + '-runtime">' +
          '<label for="i-' + t + '-runtime">Browser / runtime requirement</label>' +
          '<input type="text" id="i-' + t + '-runtime" class="v-d" data-t="' + t + '" data-k="runtime" ' +
          'value="' + esc(d.runtime || '') + '"></div>' +
          '<div class="field" id="f-' + t + '-notes" style="margin-bottom:0">' +
          '<label for="i-' + t + '-notes">Technical notes</label>' +
          '<textarea id="i-' + t + '-notes" rows="2" class="v-d" data-t="' + t + '" data-k="notes">' +
          esc(d.notes || '') + '</textarea></div>';
      } else {
        body =
          '<div class="field" id="f-' + t + '-pkg">' +
          '<label for="i-' + t + '-label">Package label</label>' +
          '<input type="text" id="i-' + t + '-label" class="v-d" data-t="' + t + '" data-k="packageLabel" ' +
          'value="' + esc(d.packageLabel || '') + '"></div>' +
          '<div class="field">' +
          '<label for="i-' + t + '-ref">Package reference / identifier</label>' +
          '<input type="text" id="i-' + t + '-ref" class="v-d" data-t="' + t + '" data-k="packageRef" ' +
          'value="' + esc(d.packageRef || '') + '" aria-describedby="h-' + t + '-ref">' +
          '<p class="hint" id="h-' + t + '-ref">The authorised package the institution installs on a supported ' +
          'device. A label or a reference is enough to make the submission reviewable.</p></div>' +
          '<div class="field">' +
          '<span class="flabel">Package file</span>' +
          '<div class="fileline">' +
          '<label class="btn sec sm" for="i-' + t + '-file">Choose a package file…' +
          '<input type="file" id="i-' + t + '-file" class="sr-only v-pkgfile" data-t="' + t + '"></label>' +
          '<span class="muted" id="n-' + t + '-file">' +
          esc(d.packageFile && d.packageFile.name ? d.packageFile.name +
            (d.packageFile.size ? ' — ' + d.packageFile.size : '') : 'No file chosen') + '</span>' +
          (d.packageFile ? '<button class="btn gho sm v-pkgclear" type="button" data-t="' + t + '">Clear</button>' : '') +
          '</div>' +
          '<p class="dnote">' + ui.ic('info', 'sm') +
          'Prototype records package metadata only — file name and size. No binary is uploaded or stored.</p>' +
          '</div>' +
          '<div class="field" id="f-' + t + '-runtime">' +
          '<label for="i-' + t + '-runtime">Device / runtime requirement</label>' +
          '<input type="text" id="i-' + t + '-runtime" class="v-d" data-t="' + t + '" data-k="runtime" ' +
          'value="' + esc(d.runtime || '') + '"></div>' +
          '<div class="field">' +
          '<label for="i-' + t + '-install">Installation / access notes</label>' +
          '<textarea id="i-' + t + '-install" rows="2" class="v-d" data-t="' + t + '" data-k="install">' +
          esc(d.install || '') + '</textarea></div>' +
          '<div class="field" id="f-' + t + '-notes" style="margin-bottom:0">' +
          '<label for="i-' + t + '-notes">Technical notes</label>' +
          '<textarea id="i-' + t + '-notes" rows="2" class="v-d" data-t="' + t + '" data-k="notes">' +
          esc(d.notes || '') + '</textarea></div>';
      }
      return '<fieldset class="techcard"><legend>' + ui.fmtBadge(t) + ' ' + esc(def.name) + '</legend>' +
        '<p class="tc-d">' + esc(def.deliveryLabel) + '</p>' + body + '</fieldset>';
    }).join('');
  }

  function docsHTML() {
    if (!work.documents.length) {
      return '<p class="muted">No supporting documentation added.</p>';
    }
    return '<ul class="reslist plain">' + work.documents.map(function (d, i) {
      return '<li>' + ui.ic('doc') + '<span>' + esc(d.name) +
        (d.size ? ' <span class="muted">— ' + esc(d.size) + '</span>' : '') + '</span>' +
        '<button class="btn gho sm v-doc-rm" type="button" data-i="' + i + '" ' +
        'aria-label="Remove ' + esc(d.name) + '">Remove</button></li>';
    }).join('') + '</ul>';
  }

  function checklistHTML() {
    var errs = state.validateContent(work, 'submit', { exceptId: work.id });
    if (!errs.length) {
      return '<p class="ok-line">' + ui.ic('check') +
        'Everything required for academic review is present.</p>';
    }
    return '<ul class="blocklist">' + errs.map(function (e) {
      return '<li>' + esc(e.message) + '</li>';
    }).join('') + '</ul>';
  }

  function readForm() {
    function val(id) { var el = document.getElementById(id); return el ? el.value : ''; }
    work.courseId = val('i-course');
    work.name = val('i-name');
    work.summary = val('i-summary');
    work.description = val('i-description');
    work.versionLabel = val('i-version');
    work.vendorNotes = val('i-notes');
    Array.prototype.slice.call(document.querySelectorAll('.v-d')).forEach(function (el) {
      var t = el.getAttribute('data-t'), k = el.getAttribute('data-k');
      work.delivery[t] = work.delivery[t] || {};
      work.delivery[t][k] = el.value;
    });
    /* Delivery detail for a technology that is no longer selected is
       dropped, so a submission never carries a hosted URL for a
       technology it does not offer. */
    Object.keys(work.delivery).forEach(function (t) {
      if (work.technologies.indexOf(t) === -1) { delete work.delivery[t]; }
    });
  }

  function fmtSize(bytes) {
    if (!bytes && bytes !== 0) { return ''; }
    if (bytes >= 1073741824) { return (bytes / 1073741824).toFixed(1) + ' GB'; }
    if (bytes >= 1048576) { return (bytes / 1048576).toFixed(1) + ' MB'; }
    if (bytes >= 1024) { return Math.round(bytes / 1024) + ' KB'; }
    return bytes + ' B';
  }

  function bindEditor(actor, rec) {
    var form = document.getElementById('v-form');
    if (!form) { return; }

    function repaintTech() {
      var host = document.getElementById('v-tech-panels');
      if (host) { host.innerHTML = techPanelsHTML(); bindDelivery(); }
      repaintCheck();
    }
    function repaintDocs() {
      var host = document.getElementById('v-docs');
      if (host) { host.innerHTML = docsHTML(); bindDocs(); }
      repaintCheck();
    }
    function repaintCheck() {
      var host = document.getElementById('v-check');
      if (host) { host.innerHTML = checklistHTML(); }
    }

    function bindDelivery() {
      Array.prototype.slice.call(document.querySelectorAll('.v-d')).forEach(function (el) {
        el.addEventListener('input', function () {
          var t = el.getAttribute('data-t'), k = el.getAttribute('data-k');
          work.delivery[t] = work.delivery[t] || {};
          work.delivery[t][k] = el.value;
          repaintCheck();
        });
      });
      Array.prototype.slice.call(document.querySelectorAll('.v-pkgfile')).forEach(function (el) {
        el.addEventListener('change', function () {
          var t = el.getAttribute('data-t');
          var f = el.files && el.files[0];
          work.delivery[t] = work.delivery[t] || {};
          work.delivery[t].packageFile = f ? { name: f.name, size: fmtSize(f.size) } : null;
          repaintTech();
          ui.announce(f ? 'Package metadata recorded for ' + data.TECHNOLOGIES[t].label + '. No file is uploaded.'
                        : 'Package file cleared.');
        });
      });
      Array.prototype.slice.call(document.querySelectorAll('.v-pkgclear')).forEach(function (el) {
        el.addEventListener('click', function () {
          var t = el.getAttribute('data-t');
          if (work.delivery[t]) { work.delivery[t].packageFile = null; }
          repaintTech();
        });
      });
    }

    function bindDocs() {
      Array.prototype.slice.call(document.querySelectorAll('.v-doc-rm')).forEach(function (el) {
        el.addEventListener('click', function () {
          work.documents.splice(parseInt(el.getAttribute('data-i'), 10), 1);
          repaintDocs();
        });
      });
    }

    Array.prototype.slice.call(document.querySelectorAll('.v-tech')).forEach(function (box) {
      box.addEventListener('change', function () {
        var t = box.value;
        if (box.checked) {
          if (work.technologies.indexOf(t) === -1) { work.technologies.push(t); }
          work.delivery[t] = work.delivery[t] ||
            { url: '', packageLabel: '', packageRef: '', packageFile: null, runtime: '', install: '', notes: '' };
        } else {
          work.technologies = work.technologies.filter(function (x) { return x !== t; });
        }
        work.technologies = data.sortTech(work.technologies);
        repaintTech();
      });
    });

    ['i-course', 'i-name', 'i-summary', 'i-description', 'i-version', 'i-notes'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.addEventListener('input', function () { readForm(); repaintCheck(); }); }
      if (el && el.tagName === 'SELECT') { el.addEventListener('change', function () { readForm(); repaintCheck(); }); }
    });

    var docInput = document.getElementById('i-doc');
    if (docInput) {
      docInput.addEventListener('change', function () {
        var f = docInput.files && docInput.files[0];
        if (!f) { return; }
        work.documents.push({ name: f.name, size: fmtSize(f.size), note: '' });
        docInput.value = '';
        var nm = document.getElementById('i-doc-name');
        if (nm) { nm.textContent = 'No document chosen'; }
        repaintDocs();
        ui.announce('Document metadata recorded. No file is uploaded.');
      });
    }

    function persist(thenSubmit) {
      readForm();
      var errs = state.validateContent(work, thenSubmit ? 'submit' : 'draft', { exceptId: work.id });
      if (!ui.showErrors(form, errs, thenSubmit
            ? 'This submission is not ready for academic review'
            : 'The draft cannot be saved yet')) { return; }
      var saved;
      if (rec) { saved = state.updateContentDraft(actor.id, rec.id, work); }
      else { saved = state.createContentDraft(actor.id, work); }
      if (!saved) {
        ui.toast('This draft could not be saved.', 'info');
        return;
      }
      if (!thenSubmit) {
        work = null;
        ui.toast('Draft saved. It is private to you until you submit it.');
        XRSLP.router.go(href.vRecord(actor.id, saved.id));
        return;
      }
      var wasAtContentGate = rec && rec.returnedGate === 'content';
      var submitted = state.submitContent(actor.id, saved.id);
      work = null;
      if (submitted) {
        if (submitted.status === CS.CONTENT_REVIEW) {
          ui.toast('Resubmitted — now in content readiness review.');
        } else if (wasAtContentGate) {
          ui.toast('The academic content changed, so the earlier approval no longer applies — ' +
            'resubmitted for academic review.', 'info');
        } else {
          ui.toast(rec ? 'Resubmitted — now in academic review.' : 'Submitted — now in academic review.');
        }
      }
      XRSLP.router.go(href.vRecord(actor.id, saved.id));
    }

    var save = document.getElementById('v-save');
    if (save) { save.addEventListener('click', function () { persist(false); }); }
    var saveSubmit = document.getElementById('v-save-submit');
    if (saveSubmit) { saveSubmit.addEventListener('click', function () { persist(true); }); }

    repaintTech();
    repaintDocs();
  }

  /* ---------------- shared list rendering ---------------- */
  function rowHTML(actor, r) {
    return '<tr>' +
      '<td data-label="Experiment"><a href="' + href.vRecord(actor.id, r.id) + '">' + esc(r.name) + '</a></td>' +
      '<td data-label="Course">' + cui.contextLine(r) + '</td>' +
      '<td data-label="Technologies">' + (r.technologies.length
        ? ui.techBadges(r.technologies) : '<span class="muted">None</span>') + '</td>' +
      '<td data-label="Version">' + (r.versionLabel ? esc(r.versionLabel) : '<span class="muted">—</span>') +
      (r.revision > 1 ? ' <span class="muted">· rev ' + r.revision + '</span>' : '') + '</td>' +
      '<td data-label="Status">' + cui.statusBadge(r) + '</td>' +
      '<td data-label="Currently with">' + esc(cui.holderLine(r, 'vendor')) + '</td>' +
      '<td class="cell-actions"><a class="btn sec sm" href="' + href.vRecord(actor.id, r.id) + '">Open</a></td>' +
      '</tr>';
  }

  function bindList(actor, all, prefix, filter, emptyFor) {
    var rowsEl = document.getElementById(prefix + '-rows');
    var emptyEl = document.getElementById(prefix + '-empty');
    var countEl = document.getElementById(prefix + '-count');
    var tableEl = document.getElementById(prefix + '-table');
    var q = document.getElementById(prefix + '-q');
    var st = document.getElementById(prefix + '-status');

    function paint() {
      var rows = all.filter(function (r) { return cui.matchesFilters(r, filter); });
      rowsEl.innerHTML = rows.map(function (r) { return rowHTML(actor, r); }).join('');
      countEl.textContent = rows.length + ' of ' + all.length + ' ' + util.plural(all.length, 'experiment');
      if (!rows.length) {
        tableEl.setAttribute('hidden', 'hidden');
        var e = emptyFor();
        emptyEl.innerHTML = ui.emptyState({ icon: 'search', title: e.title, body: e.body });
      } else {
        tableEl.removeAttribute('hidden');
        emptyEl.innerHTML = '';
      }
    }
    if (q) { q.addEventListener('input', function () { filter.q = q.value; paint(); }); }
    if (st) { st.addEventListener('change', function () { filter.status = st.value; paint(); }); }
    paint();
  }

  function withAfter(result, after) {
    result.after = after;
    return result;
  }

  /* ---------------- exposed for the shell ---------------- */
  XRSLP.vendorUI = {
    href: href,
    nav: function (actor, activeKey) {
      var o = state.vendorOverview(actor.id);
      var subs = state.contentForVendor(actor.id).filter(function (r) {
        return r.status !== CS.DRAFT || r.submittedAt;
      }).length;
      return [
        { href: href.vOverview(actor.id), icon: 'home', label: 'Overview',
          active: activeKey === 'overview', count: 0 },
        { href: href.vExperiments(actor.id), icon: 'flask', label: 'My Experiments',
          active: activeKey === 'experiments', count: o.total,
          countLabel: util.plural(o.total, 'experiment') + ' you have created' },
        { href: href.vSubmissions(actor.id), icon: 'doc', label: 'Submissions',
          active: activeKey === 'submissions', count: subs,
          countLabel: util.plural(subs, 'submission') + ' in the content workflow' }
      ];
    }
  };
})();
