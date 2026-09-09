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
    /* WHICH COURSES A NEW EXPERIMENT MAY BE CREATED IN is a different
       question from which Courses this Vendor can read, and only the
       first one may draw a "Create experiment" control. An
       Experiment-scope assignment names one EXISTING Experiment, so it
       can never authorise a new one — the new record gets a new id no
       such row can name, and `createContentDraft` refuses it. Offering
       the control on the wider list sent the Vendor to a form whose save
       the state layer would reject, with no explanation on the way. */
    var createCourses = state.actorCreateCourseIds(actor.id);
    var canCreate = createCourses.length > 0;
    var scopeText = state.actorScopeText(actor.id);
    var noScope = !state.assignmentsFor(actor.id).length;

    var tiles = '<div class="statgrid">' +
      cui.statTile(o.draft, 'Draft', 'not yet submitted') +
      cui.statTile(o.inAcademicReview, 'In academic review', 'with the Academic Reviewer') +
      cui.statTile(o.changesRequested, 'Changes requested', 'returned to you') +
      cui.statTile(o.awaitingPublication, 'Awaiting publication', 'with the Content Manager') +
      cui.statTile(o.published, 'Published', 'live in the catalogue') +
      '</div>';

    /* A row whose record the Vendor may no longer change STAYS — losing
       a scope must not make your own returned submission vanish off the
       one screen that tells you it came back. What changes is the
       action and the sentence: no control that leads to an editor the
       state layer would refuse, and no instruction to finish work that
       cannot now be finished. */
    var attention = [];
    function mutable(r) { return state.vendorCanEdit(r, actor.id); }
    var outOfScopeLine = ' This experiment is no longer in your assigned scope, so the record is read-only ' +
      'until the scope is restored. Nothing has been deleted.';
    o.returned.forEach(function (r) {
      /* ONE ACCESSOR FOR EITHER GATE. This used to read the academic
         review record, which only ever carries the academic return — so
         a submission the Content Manager sent back said "see the
         submission for the reason" while the reason was sitting on the
         record's newest `changes` history entry all along. */
      var back = cui.returnReason(r);
      var open = mutable(r);
      attention.push({
        kind: 'warn', icon: 'alert',
        title: r.name,
        body: 'Returned at ' + (r.status === CS.CHANGES_ACADEMIC
          ? 'academic review' : 'content readiness review') +
          (back && back.text ? ' by ' + back.who + ' — ' + back.text : '.') +
          (open ? '' : outOfScopeLine),
        actionHTML: open
          ? '<a class="btn sec sm" href="' + href.vEdit(actor.id, r.id) + '">Correct submission</a>'
          : '<a class="btn sec sm" href="' + href.vRecord(actor.id, r.id) + '">Open submission</a>'
      });
    });
    o.incompleteDrafts.forEach(function (r) {
      var open = mutable(r);
      attention.push({
        kind: '', icon: open ? 'edit' : 'alert', title: r.name,
        body: 'Draft is missing information required before it can be submitted for academic review.' +
          (open ? '' : outOfScopeLine),
        actionHTML: open
          ? '<a class="btn sec sm" href="' + href.vEdit(actor.id, r.id) + '">Continue draft</a>'
          : '<a class="btn sec sm" href="' + href.vRecord(actor.id, r.id) + '">Open draft</a>'
      });
    });
    o.readyDrafts.forEach(function (r) {
      var open = mutable(r);
      attention.push({
        kind: '', icon: open ? 'check' : 'alert', title: r.name,
        body: open
          ? 'Draft is complete and can be submitted for academic review.'
          : 'Draft is complete, but it cannot be submitted.' + outOfScopeLine,
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

    var scopeHTML = (canCreate
      ? '<ul class="reslist plain">' + createCourses.map(function (cid) {
          var c = data.course(cid);
          var g = c ? data.grouping(c.groupingId) : null;
          return '<li>' + ui.ic('book') + '<span>' + esc(g ? g.name + ' › ' : '') +
            '<strong>' + esc(c ? c.name : cid) + '</strong></span></li>';
        }).join('') + '</ul>'
      : '<p class="muted">' + esc(noScope
          ? 'No Course has been assigned to you, so there is no Course to submit into.'
          : 'No Course-level assignment covers you, so there is no Course to submit a new experiment into.') +
        '</p>') +
      '<p class="dnote">' + ui.ic('info', 'sm') + 'Assigned scope: ' + esc(scopeText) + '.' +
      (canCreate ? ''
        : noScope
          ? ' Content role scope is assigned and withdrawn by the Super Admin, on the Role governance screen.'
          : ' An Experiment-scope assignment names one existing Experiment, so it cannot authorise a new one: ' +
            'a new Experiment gets a new identifier that assignment does not name. Course-level scope is ' +
            'assigned by the Super Admin, on the Role governance screen.') +
      '</p>';

    /* §8 — a first-time Vendor should know immediately that this is
       where submissions are created and carried through review. The
       pipeline tiles already say WHERE work is; the orientation line
       says what the workspace is, and the actions say where to go. */
    var quick = ui.quickActions([
      { href: href.vExperiments(actor.id), icon: 'layers', label: 'My Experiments' }
    ].concat(canCreate
      ? [{ href: href.vNew(actor.id), icon: 'plus', label: 'Create Experiment' }]
      : []).concat([
      { href: href.vSubmissions(actor.id), icon: 'doc',   label: 'Submissions' },
      { href: href.vVersions(actor.id),    icon: 'clock', label: 'Versions' }
    ]));

    var html =
      ui.phead('Overview',
        esc(actor.organisation) + ' · ' + esc(actor.name),
        canCreate
          ? '<a class="btn pri" href="' + href.vNew(actor.id) + '">' + ui.ic('plus') + 'Create experiment</a>'
          : '') +
      ui.orient('Create and manage Experiment submissions and their technical delivery.') +
      tiles +
      '<div style="margin-top:18px">' + ui.card('Quick actions', quick, null, 'h2') + '</div>' +
      '<div class="grid-rail" style="margin-top:18px">' +
      '<div class="stack">' +
      ui.card('Needs your attention', attnHTML) +
      '</div>' +
      '<div class="stack">' +
      ui.card('Courses you may submit into', scopeHTML,
        'Assigned scope') +
      /* The chain as a stepper rather than a numbered paragraph — the
         same four steps, the same words, in the shared component every
         other workspace uses for a workflow. The two facts that matter
         to a Vendor stay in text below it: a Vendor never publishes, and
         publication grants the experiment to nobody. */
      ui.card('What happens after you submit',
        ui.track([
          { t: 'You submit', d: 'Your technical delivery and catalogue detail', state: 'live' },
          { t: 'Academic review', d: 'The Academic Reviewer authors the Learning Outcomes', state: 'todo' },
          { t: 'Content readiness', d: 'The Content Manager checks metadata and delivery', state: 'todo' },
          { t: 'Publish', d: 'The Content Manager alone — a Vendor never publishes', state: 'todo' }
        ]) +
        '<p class="cardfoot">Publication makes an experiment discoverable in the catalogue. It grants it to ' +
        'no institution — that still needs an institutional request and Super Admin approval.</p>') +
      '</div></div>';

    return shell(actor, 'overview', 'Vendor overview', html);
  };

  /* ---------------- My Experiments ---------------- */
  XRSLP.screens.vendorExperiments = function (params) {
    discardWork();
    var actor = resolveActor(params);
    if (!actor) { return XRSLP.screens.notFound(); }
    var all = state.contentForVendor(actor.id);
    /* Same rule as the Overview: the control is drawn only where a new
       record can actually be created, and where it cannot the screen
       says which assignment is missing rather than handing over a button
       that ends on a refusal. */
    var canCreate = state.actorCreateCourseIds(actor.id).length > 0;
    var createBtn = canCreate
      ? '<a class="btn pri" href="' + href.vNew(actor.id) + '">' + ui.ic('plus') + 'Create experiment</a>'
      : '';

    if (!all.length) {
      var emptyHTML =
        ui.phead('My Experiments', esc(actor.organisation), createBtn) +
        '<div class="tablecard">' + ui.emptyState({
          icon: 'flask',
          title: canCreate
            ? 'You have not created an experiment yet'
            : 'No experiment, and no Course to create one in',
          body: canCreate
            ? 'Create an experiment draft, add its technical delivery details, and submit it for academic review ' +
              'when it is complete.'
            : 'You have not created an experiment, and no Course-level assignment covers you at the moment, so ' +
              'a new one cannot be created here. Assigned scope: ' + state.actorScopeText(actor.id) + '. ' +
              'Course-level scope is assigned by the Super Admin, on the Role governance screen.',
          actionsHTML: canCreate
            ? '<a class="btn pri" href="' + href.vNew(actor.id) + '">Create experiment</a>'
            : ''
        }) + '</div>';
      return shell(actor, 'experiments', 'My Experiments', emptyHTML);
    }

    cui.normaliseFilters(all, listFilter);
    /* WHAT THIS LIST IS, said in figures. My Experiments and Submissions
       overlap by design — one is everything you have created, the other
       is everything that has entered the review chain — and the fastest
       way to tell a reader which one they are on is to count the thing
       that distinguishes them. */
    var drafts = all.filter(function (r) { return r.status === CS.DRAFT && !r.submittedAt; }).length;
    var live = all.filter(function (r) { return r.status === CS.PUBLISHED; }).length;
    var html =
      ui.phead('My Experiments', ui.metrics([
        { v: all.length, k: 'you have created' },
        { v: drafts, k: 'never submitted' },
        { v: all.length - drafts - live, k: 'in the workflow' },
        { v: live, k: 'published', tone: live ? 'good' : null }
      ]), createBtn) +
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
      /* 07.3 — "Currently with" removed: the stakeholder pointed out it
         restated Status. `cui.holderLine()` is derived purely from
         `rec.status`, so the two columns were the same fact twice. The
         workflow model is untouched — only the duplicate column is gone,
         and the detail screen still says who holds the item. */
      '<th scope="col">Version</th><th scope="col">Status</th>' +
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
          /* NOT "visible to nobody else" — the Content Manager's Content
             Library and the Super Admin's canonical catalogue both list
             a draft, by design. What a draft is genuinely absent from is
             everything downstream of publication. */
          body: 'A draft appears here once you submit it for academic review. Until then it stays in ' +
            'My Experiments: it is not in the public catalogue and reaches no institution, no Faculty ' +
            'member and no Student, though the Content Manager and the Super Admin can see it in the ' +
            'canonical library.',
          actionsHTML: '<a class="btn sec" href="' + href.vExperiments(actor.id) + '">Go to My Experiments</a>'
        }) + '</div>';
      return shell(actor, 'submissions', 'Submissions', emptyHTML);
    }

    var returned = subs.filter(function (r) {
      return r.status === CS.CHANGES_ACADEMIC || r.status === CS.CHANGES_CONTENT;
    });

    /* THE CARD HEADING IS AN h3, under the h2 its zone heading supplies.
       It was an h2 with no zone above it, and the design system styles
       only `.lcard h3` — so every card on this page rendered its title
       at the browser's default 24px bold with the link in link-blue,
       while every other `.lcard` in the build sat at 16.5px in body
       colour. One outline, one treatment. */
    function subCard(r) {
      return '<article class="lcard sub-card">' +
        '<div class="lc-head">' +
        '<div class="lc-ctx">' + cui.contextLine(r) + '</div>' +
        '<h3><a href="' + href.vRecord(actor.id, r.id) + '">' + esc(r.name) + '</a></h3>' +
        '</div>' +
        '<div class="lc-badges">' + cui.statusBadge(r) + cui.revisionChip(r) + cui.resubmittedChip(r) + '</div>' +
        '<p class="lc-sum">' + esc(cui.holderLine(r, 'vendor')) + '</p>' +
        /* ONE ACCESSOR FOR EITHER GATE. The reason used to be rendered
           only for an ACADEMIC return, read out of the review record —
           so a submission the Content Manager sent back showed a bare
           status badge and no reason at all, on the one screen a Vendor
           uses to triage, even though the reason was on the record and
           was shown on the detail page. `cui.returnReasonHTML` reads the
           newest `changes` history entry, which both gates write. */
        cui.returnReasonHTML(r) +
        '<div class="lc-foot">' + ui.techBadges(r.technologies) +
        '<a class="btn sec sm" href="' + href.vRecord(actor.id, r.id) + '">Open</a>' +
        '</div></article>';
    }

    /* THREE ZONES, IN THE ORDER A VENDOR ASKS THE QUESTIONS: what has
       come back to me, what is out of my hands, and what is finished.
       An ungrouped grid answered none of those without reading every
       badge, and it degraded badly as the list grew. */
    function zone(title, rows, desc, id) {
      if (!rows.length) { return ''; }
      return ui.sectionHead({ title: title, count: rows.length, desc: desc, id: id }) +
        '<section class="lgrid" aria-labelledby="' + id + '">' +
        rows.map(subCard).join('') + '</section>';
    }
    var withOthers = subs.filter(function (r) {
      return r.status === CS.ACADEMIC_REVIEW || r.status === CS.CONTENT_REVIEW ||
             r.status === CS.CHANGES_ACADEMIC_RECHECK;
    });
    var done = subs.filter(function (r) { return r.status === CS.PUBLISHED; });
    /* Anything a future status introduces still appears, rather than
       silently dropping out of a screen built from three fixed lists. */
    var placed = {};
    [returned, withOthers, done].forEach(function (list) {
      list.forEach(function (r) { placed[r.id] = true; });
    });
    var other = subs.filter(function (r) { return !placed[r.id]; });

    /* The same split as the record page: how many came back is a fact
       about the WORK; "correct it and resubmit" is an instruction to the
       READER. If none of the returned submissions is one this Vendor may
       still act on, the instruction is simply wrong. */
    /* 08 — the banner now fires ONLY for the case it exists to report:
       something has come back that this Vendor cannot act on. "Open it,
       correct it, resubmit" is the ordinary instruction and it belongs
       on the zone heading below, where the returned items actually are —
       repeating it in a warning box above them made the routine case
       look like an incident and pushed the work further down the page. */
    var actionable = returned.filter(function (r) { return state.vendorCanEdit(r, actor.id); }).length;
    var frozen = returned.length - actionable;
    var returnedBanner = !frozen ? ''
      : ui.alertBox('warning',
          util.plural(frozen, 'returned submission') + ' you cannot correct at the moment',
          (actionable === 0
            ? '<p>Every submission that has come back belongs to a Course outside your active Vendor scope, ' +
              'so none of them can be corrected or resubmitted. You can still read each one and the reason ' +
              'it came back.</p>'
            : '<p>' + util.plural(frozen, 'submission') + ' below belongs to a Course outside your active ' +
              'Vendor scope, so it cannot be corrected or resubmitted. The rest can.</p>') +
          '<p style="margin-top:8px"><strong>Nothing has been deleted.</strong> The work returns to you if ' +
          'the Super Admin restores the scope.</p>',
          'status');

    var html =
      ui.phead('Submissions', ui.metrics([
        { v: subs.length, k: 'in the workflow' },
        { v: returned.length, k: 'returned to you', tone: returned.length ? 'warn' : null },
        { v: withOthers.length, k: 'with a reviewer or the Content Manager' },
        { v: done.length, k: 'published', tone: done.length ? 'good' : null }
      ])) +
      returnedBanner +
      /* ⚠ THE INSTRUCTION MUST AGREE WITH THE BANNER ABOVE IT.
         When the Vendor's role scope has been withdrawn, `returnedBanner`
         states that none of these can be corrected or resubmitted — and
         this line used to tell the reader to do exactly that, two
         centimetres below it. One of the two was always wrong. The
         guard that governs it (`frozen`) already exists; only the copy
         had stopped consulting it. */
      zone('Returned to you', returned,
        frozen
          ? 'Read the reason. Correcting these is not available while your role scope is withdrawn.'
          : 'Read the reason, correct the submission and resubmit it.', 'z-returned') +
      zone('With someone else', withOthers,
        'Read-only while they hold it, so the revision they are reading cannot change underneath them.',
        'z-elsewhere') +
      zone('Published', done,
        'In the public catalogue. A change to published content is a later version, proposed from Versions.',
        'z-published') +
      zone('Everything else', other, null, 'z-other');

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

    /* LIFECYCLE READINESS AND ACTOR AUTHORITY ARE DIFFERENT FACTS, and
       the status banner has to keep them apart. "Everything required is
       present" is a statement about the RECORD; "you can submit it" is a
       statement about the READER. While the two were fused, a Vendor
       whose scope had been withdrawn met a green "Draft — ready to
       submit" directly beneath the amber banner telling them the record
       was read-only — the page contradicting itself in two adjacent
       boxes.

       So when the scope is gone the banner still reports the lifecycle
       fact, and reports it accurately, but stops phrasing it as an
       invitation and drops the success styling that reads as "go". It
       does NOT repeat the amber banner's governance paragraph — nothing
       is deleted, authority returns on restore — because that is stated
       once, immediately above. */
    var scopeGone = state.vendorScopeWithdrawn(rec, actor.id);
    var frozenTitle = ' — read-only while outside your assigned scope';
    var cannotHere = 'It cannot be edited or submitted while this Course is outside your active Vendor scope.';

    var statusNote;
    switch (rec.status) {
      case CS.DRAFT:
        statusNote = errs.length
          ? ui.alertBox('info', 'Draft' + (scopeGone ? frozenTitle : ' — not yet submitted'),
              (scopeGone
                ? '<p>This draft is still missing information required for academic review. ' + cannotHere + '</p>'
                : '<p>Finish the details below and submit when ready. It goes to academic review first.</p>') +
              '<ul class="blocklist">' + errs.map(function (e) {
                return '<li>' + esc(e.message) + '</li>'; }).join('') + '</ul>')
          : scopeGone
            ? ui.alertBox('info', 'Draft' + frozenTitle,
                '<p>The draft contains the information required for academic review. ' + cannotHere + '</p>')
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
        /* The reviewer's comment is a historical fact and stays. Only the
           instruction that follows it is authority-dependent. */
        statusNote = ui.alertBox('warning',
          'Changes requested — academic review' + (scopeGone ? frozenTitle : ''),
          (lastReview && lastReview.comment
            ? '<p><strong>' + esc(lastReview.reviewerName) + ' · Academic Reviewer · ' +
              esc(util.fmtDateTime(lastReview.at)) + '</strong></p><p>' + esc(lastReview.comment) + '</p>'
            : '<p>This submission was returned for correction.</p>') +
          (scopeGone
            ? '<p>' + cannotHere + '</p>'
            : '<p>Correct the submission and resubmit. It returns to academic review.</p>'));
        break;
      case CS.CONTENT_REVIEW:
        statusNote = ui.alertBox('info', 'Academic validation complete — now in content readiness review',
          '<p>The Content Manager is checking the canonical metadata and the technical delivery information, and ' +
          'performs the first publication once satisfied. It is read-only for you while they hold it.</p>');
        break;
      case CS.CHANGES_CONTENT:
        statusNote = ui.alertBox('warning',
          'Changes requested — content readiness' + (scopeGone ? frozenTitle : ''),
          '<p>' + esc(changesContentNote(rec)) + '</p>' +
          (scopeGone
            ? '<p>' + cannotHere + ' The academic validation it has already passed is unaffected.</p>'
            : '<p>Correct the submission and resubmit. It returns to content readiness review — the academic ' +
              'validation it has already passed is not repeated.</p>'));
        break;
      case CS.PUBLISHED:
        statusNote = ui.alertBox('success',
          'Published' + (rec.publication ? ' · ' + util.fmtDate(rec.publication.publishedAt) : ''),
          '<p>This experiment is published and discoverable in the public catalogue. Publication does ' +
          '<strong>not</strong> grant it to any institution: an institution still requests it and the Super Admin ' +
          'approves that request.</p>');
        break;
      /* 07.3 — the Content Manager's ACADEMIC return. Without this case
         the switch fell to `default: ''`, so at the one moment the Vendor
         most needs telling "this is not yours, do not start correcting",
         their record page rendered no explanation at all. */
      case CS.CHANGES_ACADEMIC_RECHECK:
        statusNote = ui.alertBox('info', 'Returned to the Academic Reviewer for a re-check',
          '<p>The Content Manager judged the issue <strong>academic</strong> and sent this back to the ' +
          'Academic Reviewer, not to you. <strong>You are not being asked for anything</strong>, and the ' +
          'submission does not reopen for editing while it is with them. If the reviewer decides the ' +
          'Vendor must change something, it comes back to you as an ordinary change request.</p>');
        break;
      default:
        statusNote = '';
    }

    /* READING is ownership; MUTATING is ownership AND the lifecycle AND
       the live role assignment (`canMutateVendorRecord`). The ownership
       gate above already let this Vendor in, so the record, its history
       and every decision on it stay on screen whatever their scope is
       now. What a withdrawn scope removes is the authority to change it
       — so no editing or submitting control is drawn at all, because a
       control the state layer would refuse is worse than an absent one,
       and the page says plainly which of the two rules stopped it. */
    var canSubmit = state.vendorCanSubmit(rec, actor.id);
    var actions = '';
    if (canEdit) {
      actions += '<a class="btn sec" href="' + href.vEdit(actor.id, rec.id) + '">' + ui.ic('edit') +
        (rec.status === CS.DRAFT ? 'Edit draft' : 'Correct submission') + '</a>';
      if (canSubmit) {
        actions += '<button class="btn pri" type="button" id="v-submit"' +
          (errs.length ? ' aria-disabled="true"' : '') + '>' +
          (rec.status === CS.DRAFT ? 'Submit for academic review' : 'Resubmit for review') + '</button>';
      }
    }
    var scopeNote = scopeGone
      ? ui.alertBox('warning', 'This experiment is no longer in your assigned scope',
          '<p>No Course assignment covers <strong>' + esc(rec.name) + '</strong> for you any more, so this ' +
          'record is <strong>read-only</strong>. It cannot be edited, submitted or resubmitted, its Course ' +
          'cannot be changed, and no later version can be proposed for it.</p>' +
          '<p><strong>Nothing has been deleted.</strong> The record, its technical delivery details, its ' +
          'history and every decision already taken on it are preserved exactly as they were made. Editing ' +
          'and submission return, wherever the workflow already allowed them, if the scope is restored.</p>')
      : '';

    var html =
      ui.crumbs([{ label: 'My Experiments', href: href.vExperiments(actor.id) }, { label: rec.name }]) +
      ui.phead(rec.name,
        cui.contextLine(rec) + ' · ' + esc(cui.holderLine(rec, 'vendor')),
        actions,
        ' ' + cui.statusBadge(rec) + cui.revisionChip(rec) + cui.resubmittedChip(rec)) +
      /* Where the work has got to, in the four-step chain every
         workspace renders identically. It is the first question a Vendor
         asks about their own submission, and the answer used to be one
         status badge plus a paragraph. */
      cui.productionTrack(rec) +
      '<div style="margin-top:14px">' + scopeNote + statusNote + '</div>' +
      '<div class="grid-rail" style="margin-top:18px">' +
      '<div class="stack">' +
      ui.card('Experiment', cui.recordSummaryKV(rec, { showVendor: false, showVendorNotes: true })) +
      ui.card('Technology delivery', cui.deliveryRows(rec),
        'AR / VR / MR — package · Web — hosted link') +
      /* PREVIEW / DEMO VIDEO (07.3 — R13). The Vendor supplies the
         content, so the Vendor supplies the video that shows what the
         content looks like. It is rendered here through the SAME shared
         helper every other plane uses, so the Vendor sees exactly the
         reference the Academic Reviewer and the Content Manager will
         read — one video, one renderer, no plane-specific version of
         the truth.

         The empty state names the editor only when this actor may
         actually reach it. A record under review, published, or outside
         the Vendor's scope has no editor to send them to, and pointing
         at one would be an instruction the workflow refuses. */
      ui.card('Preview / demo video',
        cui.previewVideoHTML(rec, {
          emptyHTML: '<p class="muted">No preview video has been supplied for this experiment.' +
            (canEdit
              ? ' Adding one is optional — open the editor and paste the address of a video you already host.'
              : '') + '</p>'
        }),
        'Optional · a link reference, not an upload') +
      ui.card('Supporting documentation', cui.documentsList(rec.documents)) +
      ui.card('Learning outcomes',
        cui.outcomesList(rec.outcomes,
          'No Learning Outcomes yet. They are authored by the Academic Reviewer during academic review, ' +
          'not by the Vendor.'),
        'Academic Reviewer owned') +
      (rec.status === CS.PUBLISHED ? ui.card('Publication', cui.publicationCard(rec)) : '') +
      '</div>' +
      '<div class="stack">' +
      (rec.status === CS.PUBLISHED
        ? (function () {
            /* Only the Vendor whose LIVE role assignment covers this
               experiment may propose a later version — the same scope
               check every other action on this plane uses. */
            var open = state.openVersionForRecord(rec.id);
            if (open && open.createdBy === actor.id) {
              return cui.publishedNextVersionNote({
                proposeHref: href.vVersion(actor.id, open.id),
                proposeLabel: 'Open version ' + open.versionLabel + ' (in the workflow)'
              });
            }
            if (open) { return cui.publishedNextVersionNote(); }
            return state.vendorCanVersion(rec, actor.id)
              ? cui.publishedNextVersionNote({ proposeHref: href.vNewVersion(actor.id, rec.id) })
              : cui.publishedNextVersionNote();
          })()
        : '') +
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
    /* A record under review, published, or no longer inside this
       Vendor's assigned scope is not editable by them. THE ROUTE STILL
       RESOLVES — a hand-typed or bookmarked edit URL must not answer
       "not found" for a record its owner may legitimately read — but the
       editor refuses and says which rule refused it. The state layer
       refuses the same write independently, so this screen is the
       explanation, never the enforcement. */
    if (!state.vendorCanEdit(rec, actor.id)) {
      var scopeGone = state.vendorScopeWithdrawn(rec, actor.id);
      var lockBody = scopeGone
        ? '<p>No Course assignment covers <strong>' + esc(rec.name) + '</strong> for you any more, so this ' +
          'record is <strong>read-only</strong>. It cannot be edited or resubmitted and its Course cannot be ' +
          'changed — including from this address.</p>' +
          '<p><strong>Nothing has been deleted.</strong> The record, its history and every decision already ' +
          'taken on it are preserved, and editing returns if the scope is restored.</p>'
        : '<p>' + esc(rec.status === CS.PUBLISHED
            ? 'This experiment is published. The published revision is fixed: replacing it with a newer version ' +
              'is a Super Admin Release / Hold decision on a different object, and it is not part of first ' +
              'publication.'
            : 'It is currently with ' + (rec.status === CS.ACADEMIC_REVIEW ? 'the Academic Reviewer' : 'the Content Manager') +
              '. Editing it now would change the revision they are reading. It becomes editable again if it is ' +
              'returned to you for correction.') + '</p>';
      var lockHTML =
        ui.crumbs([{ label: 'My Experiments', href: href.vExperiments(actor.id) },
                   { label: rec.name, href: href.vRecord(actor.id, rec.id) },
                   { label: 'Edit' }]) +
        ui.phead(rec.name, cui.contextLine(rec), '', ' ' + cui.statusBadge(rec)) +
        ui.alertBox('warning',
          scopeGone ? 'This experiment is no longer in your assigned scope'
                    : 'This submission cannot be edited right now',
          lockBody) +
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
        /* Null, not `{}` — "this experiment has no preview video" is a
           legal, complete state, and `updateContentDraft` reads a falsey
           value as "clear it". */
        previewVideo: null,
        __actorId: actorId, __eventSeq: null
      };
    }
    var w = JSON.parse(JSON.stringify({
      id: rec.id, courseId: rec.courseId, name: rec.name, summary: rec.summary,
      description: rec.description, technologies: rec.technologies, delivery: rec.delivery,
      documents: rec.documents, vendorNotes: rec.vendorNotes, versionLabel: rec.versionLabel,
      /* Carried into the working copy so an edit that does not touch the
         video cannot drop it. The form always sends a value — a real
         reference or null — and `undefined` (leave unchanged) is
         therefore never relied on here; the round trip is explicit. */
      previewVideo: rec.previewVideo || null
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

  function rec_courseIdOf(rec) { return rec ? rec.courseId : null; }

  function editorScreen(actor, rec) {
    var editing = !!rec;
    var correcting = editing && (rec.status === CS.CHANGES_ACADEMIC || rec.status === CS.CHANGES_CONTENT);
    if (workIsStale(rec, actor.id)) { work = freshWork(rec, actor.id); }

    /* ⚠ THE EDITOR IS NEVER RENDERED FOR A RECORD THE VENDOR MAY NOT
       MUTATE. `vendorEdit` already refuses before it gets here, and the
       state layer refuses the write regardless; this is the third and
       innermost of those three, so that no future caller can reach the
       form by a path that forgot to ask. It answers the ONE question
       that matters — may this actor change this record, as it stands —
       rather than the weaker "do they hold any Course at all", which was
       the defect: a Vendor who kept a second Course still got a fully
       live form for a record whose own Course had been withdrawn. */
    if (editing && !state.vendorCanEdit(rec, actor.id)) {
      return shell(actor, 'experiments', rec.name,
        ui.crumbs([{ label: 'My Experiments', href: href.vExperiments(actor.id) }, { label: rec.name }]) +
        ui.phead(rec.name, cui.contextLine(rec), null, ' ' + cui.statusBadge(rec)) +
        ui.alertBox('warning',
          state.vendorScopeWithdrawn(rec, actor.id)
            ? 'This experiment is no longer in your assigned scope'
            : 'This submission cannot be edited right now',
          '<p>' + (state.vendorScopeWithdrawn(rec, actor.id)
            ? 'No Course assignment covers <strong>' + esc(rec.name) + '</strong> for you any more, so this ' +
              'record is <strong>read-only</strong>: it cannot be edited or resubmitted, and its Course ' +
              'cannot be changed.'
            : 'Someone else in the workflow is holding this revision, so it cannot be changed underneath ' +
              'them.') + '</p>' +
          '<p><strong>Nothing has been deleted.</strong> The record, its history and any decision already ' +
          'taken on it are all preserved, and editing returns if the scope is restored.</p>') +
        '<div class="formact"><a class="btn sec" href="' + href.vRecord(actor.id, rec.id) +
        '">Open the submission</a>' +
        '<a class="btn sec" href="' + href.vExperiments(actor.id) + '">Back to My Experiments</a></div>');
    }

    /* THE COURSES THE STATE LAYER WILL ACTUALLY ACCEPT. Both writers
       behind this form — `createContentDraft` for a new record and
       `updateContentDraft` for the Course being chosen — ask
       `vendorCanCreateIn`, which reads `actorCreateCourseIds`. Offering
       the wider read list here meant the select could hold a Course the
       save would refuse, so the list and the writer now ask the same
       question. */
    var allowedCourses = state.actorCreateCourseIds(actor.id);
    if (!editing && !allowedCourses.length) {
      /* Creating, with no Course-level assignment. (An EDIT does not
         reach this branch — the mutate gate above has already answered
         it, and answered it on the record rather than on the Course
         list.) */
      var createNoScope = !state.assignmentsFor(actor.id).length;
      return shell(actor, 'experiments', 'Create experiment',
        ui.phead('Create experiment') +
        ui.alertBox('warning',
          createNoScope ? 'No Course is assigned to you' : 'No Course-level assignment covers you',
          '<p>A Vendor submits into a canonical Course they are assigned to. ' +
          (createNoScope
            ? 'No assignment exists for this identity, so there is nothing to submit into.'
            : 'Your assignment is <strong>' + esc(state.actorScopeText(actor.id)) + '</strong>. An ' +
              'Experiment-scope assignment names one existing Experiment, so it cannot authorise a new ' +
              'one: a new Experiment gets a new identifier that assignment does not name.') + '</p>' +
          '<p>Content role scope is assigned and withdrawn by the Super Admin, on the Role governance ' +
          'screen. Nothing you have already created is affected.</p>'));
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

    /* THE RECORD'S OWN COURSE IS ALWAYS AN OPTION, and always the
       selected one. Offering only the assigned Courses meant a record
       whose Course was not among them lost its selection, and saving
       silently re-filed the Experiment under whichever Course the Vendor
       picked next. A Vendor may choose where to submit; they may never
       move an existing Experiment out from under the Course it was
       placed in by not noticing.

       KEPT, and now the innermost of several defences rather than the
       only one. `updateContentDraft` re-asks both halves of the question
       anyway, and it stays because the guarantee it makes is one the
       build should not depend on a single gate for: whatever else
       changes, this select cannot silently re-file an existing
       Experiment. It is still reachable — a Vendor who holds only
       Experiment-level scope on this record covers it for editing but
       may not file an Experiment into its Course — so the wording below
       says exactly that rather than claiming the record is out of
       scope. */
    var courseChoices = allowedCourses.slice();
    var recCourseOutOfScope = editing && rec.courseId && courseChoices.indexOf(rec.courseId) === -1;
    if (recCourseOutOfScope) { courseChoices.unshift(rec.courseId); }
    var courseOptions = '<option value="">— select a Course —</option>' +
      courseChoices.map(function (cid) {
        var c = data.course(cid);
        if (!c) { return ''; }
        var g = data.grouping(c.groupingId);
        return '<option value="' + esc(c.id) + '"' + (work.courseId === c.id ? ' selected' : '') + '>' +
          esc((g ? g.name + ' › ' : '') + c.name) +
          (cid === rec_courseIdOf(rec) && recCourseOutOfScope
            ? ' — a Course you may no longer file an Experiment into' : '') +
          '</option>';
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

      /* THREE ZONES ON ONE LONG FORM (Implementation 08). It was eight
         cards in a single column with nothing to say which of them
         belonged together, and the Vendor's two jobs — describe the
         experiment for the catalogue, and supply the technical delivery
         — read as one undifferentiated list of boxes. The fields, their
         ids and their validation are untouched; only the zoning is new,
         and the cards drop to h3 so the outline nests. */
      ui.sectionHead({ id: 'z-cat', title: 'Catalogue detail',
        desc: 'What an institution reads about this experiment, and the Course it belongs to.' }) +
      ui.card('Academic placement',
        '<div class="field" id="f-course">' +
        '<label for="i-course">Course <span class="req" aria-hidden="true">*</span>' +
        '<span class="sr-only">(required)</span></label>' +
        '<select id="i-course" aria-describedby="h-course">' + courseOptions + '</select>' +
        (recCourseOutOfScope
          ? '<p class="hint">This Experiment sits in a Course you may no longer file an Experiment into. It ' +
            'stays selected so saving cannot move it; choosing a different Course would re-file the ' +
            'Experiment, and every institution that holds it maps Faculty to it through its Course.</p>'
          : '') +
        '<p class="hint" id="h-course">The Programme / Department and Course structure is ' +
        'platform-controlled. Select the Course this experiment belongs to; it cannot be created here.</p>' +
        '</div>', null, 'h3') +

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
        '</div>', null, 'h3') +

      (correcting && rec.returnedGate === 'content' && rec.academicReview
        ? ui.card('This correction returns to the Content Manager',
            '<p>The Content Manager asked for this change, so it goes back to them rather than through ' +
            'academic validation it has already passed.</p>' +
            '<p style="margin-top:8px">If you change the <strong>Course</strong>, the <strong>name</strong>, ' +
            'the <strong>summary</strong>, the <strong>description</strong> or the ' +
            '<strong>technology availability</strong>, that is no longer the work ' +
            esc(rec.academicReview.reviewerName) + ' approved — the approval is withdrawn and the submission ' +
            'returns to academic review instead. Correcting the delivery details or the documentation does ' +
            'not affect it.</p>', null, 'h3')
        : '') +
      ui.card('Learning outcomes',
        ui.alertBox('info', 'Authored by the Academic Reviewer',
          '<p>Learning Outcomes are academically owned. They are written during academic review, not on this ' +
          'form, and they are published with the experiment.</p>') +
        (editing && rec.outcomes.length
          ? '<div style="margin-top:12px">' + cui.outcomesList(rec.outcomes) + '</div>' : ''),
        'Academic Reviewer owned', 'h3') +

      ui.sectionHead({ id: 'z-tech', title: 'Technical delivery',
        desc: 'How the platform reaches the experience. A hosted link for Web, an authorised package ' +
          'reference for AR / VR / MR — no source code, no repository, no container image.' }) +
      ui.card('Technology availability',
        '<fieldset class="fgroup" id="f-tech" style="margin:0">' +
        '<legend>Technologies this experiment is available in</legend>' +
        '<div class="techchecks">' + techChecks + '</div>' +
        '<p class="hint">Select only what this experiment actually supports. An institution may later select ' +
        'any combination of what is available. Nothing is added automatically.</p>' +
        '</fieldset>' +
        '<div id="v-tech-panels" style="margin-top:4px"></div>',
        'AR / VR / MR — package · Web — hosted link', 'h3') +

      /* PREVIEW / DEMO VIDEO (07.3 — R13). The stakeholder asked for the
         Vendor to be given "a provision to add the video also", because
         the party that produces the content is the party that has the
         walkthrough footage — and because the public experiment page has
         nowhere else to get it from.

         IT SITS WITH THE DELIVERY FIELDS ON PURPOSE. It is technical
         material the Vendor supplies about the build, not catalogue
         copy: it belongs next to the packages and hosted links, not next
         to the summary. It is deliberately OUTSIDE the per-technology
         panels, because one experiment has one preview, whatever mix of
         AR / VR / MR / Web it ships in — a video per technology would
         invent a rule nobody asked for.

         IT IS A LINK, NOT AN UPLOAD, and the form says so in as many
         words. This prototype has no server, no storage and no
         transcoder; the honest control is therefore an address field for
         a video the Vendor already hosts. Offering a file picker here
         would be a fake upload — exactly the kind of claim this build
         does not make. (The package and document pickers below record
         file NAME and SIZE as metadata and say so; a video that must be
         watchable after publication cannot be faked the same way, so it
         is not offered as a file at all.)

         IT IS OPTIONAL. `validateContent` does not require it, and an
         experiment without one is a complete submission — so nothing
         here is marked required and the submission checklist never asks
         for it. */
      ui.card('Preview / demo video',
        '<div class="field" id="f-preview-url">' +
        '<label for="i-preview-url">Video address</label>' +
        '<input type="text" id="i-preview-url" value="' + esc(previewOf().url) + '" ' +
        'placeholder="https://" maxlength="500" aria-describedby="h-preview-url">' +
        '<p class="hint" id="h-preview-url">A full http:// or https:// address for a video you already host. ' +
        'Anything else is refused rather than stored. Clear this field to remove the video.</p></div>' +
        '<div class="field" id="f-preview-label">' +
        '<label for="i-preview-label">Link label</label>' +
        '<input type="text" id="i-preview-label" value="' + esc(previewOf().label) + '" ' +
        'maxlength="80" aria-describedby="h-preview-label">' +
        '<p class="hint" id="h-preview-label">What the link is called on screen — “2-minute walkthrough”, for ' +
        'example. Left empty it reads “Preview / demo video”.</p></div>' +
        '<div class="field" id="f-preview-note" style="margin-bottom:0">' +
        '<label for="i-preview-note">Note</label>' +
        '<textarea id="i-preview-note" rows="2" maxlength="240" aria-describedby="h-preview-note">' +
        esc(previewOf().note) + '</textarea>' +
        '<p class="hint" id="h-preview-note">Optional. One line of context — what the video shows, how long ' +
        'it runs, whether it is narrated.</p></div>' +
        /* THE HONESTY LINE FOR THIS FIELD, once. The build has no
           storage and no transcoder, so a video can only ever be an
           address it keeps — and where it travels afterwards is the
           other half of what a Vendor wants to know before typing one. */
        '<p class="cardfoot">A link, not an upload — the address you type is all this platform keeps, and the ' +
        'video keeps playing wherever it already lives. It travels with the submission, so the Academic ' +
        'Reviewer and the Content Manager both see it, and it reaches the public experiment page only when ' +
        'the Content Manager publishes.</p>',
        'Optional · one per experiment, whatever technologies it ships in', 'h3') +

      ui.sectionHead({ id: 'z-support', title: 'Supporting material',
        desc: 'Optional. Nothing here is required to submit, and none of it reaches the public catalogue.' }) +
      ui.card('Supporting documentation',
        '<div id="v-docs"></div>' +
        '<div class="fileline" style="margin-top:10px">' +
        '<label class="btn sec sm" for="i-doc">Choose a document…' +
        '<input type="file" id="i-doc" class="sr-only"></label>' +
        '<span class="muted" id="i-doc-name">No document chosen</span>' +
        '</div>' +
        '<p class="dnote">' + ui.ic('info', 'sm') +
        'File name and size only — no document is uploaded, here or anywhere in this platform.</p>',
        null, 'h3') +

      ui.card('Vendor technical notes',
        '<div class="field" style="margin-bottom:0">' +
        '<label for="i-notes">Notes for the reviewers</label>' +
        '<textarea id="i-notes" rows="3" maxlength="800" aria-describedby="h-notes">' +
        esc(work.vendorNotes) + '</textarea>' +
        '<p class="hint" id="h-notes">Internal to the content workflow. Never shown in the public catalogue.</p>' +
        '</div>', null, 'h3') +

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
      '<span class="formnote">A draft is not catalogue content. It does not appear in the public catalogue, ' +
      'to any institution, to Faculty or to any Student.</span>' +
      '</div>' +
      '</div>' +

      '<div class="formaside"><div class="stack">' +
      ui.card('Submission checklist', '<div id="v-check"></div>') +
      /* WHAT IS NOT ASKED FOR — and, since 07.3, what IS.
         This card is read as the definitive list of what a Vendor hands
         over, so while it named only exclusions it read as "media is not
         wanted either": a Vendor with a walkthrough recording had no
         reason to look for a field for it. The preview video is now
         called out positively, with the `play` icon rather than the
         `x`, so the two kinds of statement cannot be misread as one
         list of refusals. */
      ui.card('What is not asked for here',
        '<ul class="reslist plain">' +
        '<li>' + ui.ic('x') + '<span>Source code, a repository or a container image — none is required of a Vendor.</span></li>' +
        '<li>' + ui.ic('x') + '<span>Learning Outcomes — academically owned by the Academic Reviewer.</span></li>' +
        '<li>' + ui.ic('x') + '<span>A price — no commercial value is represented anywhere in this prototype.</span></li>' +
        '<li>' + ui.ic('x') + '<span>A local course code or semester — those are tenant-side mappings.</span></li>' +
        '<li>' + ui.ic('play') + '<span><strong>A preview / demo video is asked for.</strong> It is optional, ' +
        'it is supplied as a link in the form, and it is the Vendor — not the platform — who provides it.</span></li>' +
        '</ul>') +
      /* 08 — the fourth copy of "nothing is uploaded" on this one form
         is gone. It is now said once beside each control that could be
         mistaken for an upload: the package picker, the document picker
         and the video address field. A statement repeated four times
         stops being read the first time. */
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
          'File name and size only — no binary is uploaded. The reference above is what the platform holds.</p>' +
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

  /* The working copy's preview video as three always-present strings, so
     the editor's markup never has to guard a null on every read.
     `work.previewVideo` itself stays null when there is no video —
     that null is exactly what `updateContentDraft` reads as "clear it",
     so it is not flattened into an empty object. */
  function previewOf() {
    var v = work && work.previewVideo;
    return {
      url: (v && v.url) || '',
      label: (v && v.label) || '',
      note: (v && v.note) || ''
    };
  }

  /* PREVIEW-VIDEO VALIDATION, kept out of `validateContent` on purpose:
     the video is optional, so its absence is never an error and it must
     never appear in the submission checklist or block a submission.

     What it does catch is the pair of cases where the state layer would
     otherwise drop the Vendor's typing without a word.
     `normalizePreviewVideo()` returns null for anything that is not an
     http(s) address, and stores nothing at all when there is no address
     — so a mistyped link, or a label and note with no link, would be
     accepted by the Save button and then simply not be there. A silent
     no-op on a field someone deliberately filled in is the worst
     outcome available, so both cases are reported inline, against the
     address field, through the same `ui.showErrors` path every other
     field on this form uses.

     The URL test is `state.isHttpUrl` — the SAME predicate the state
     layer applies — so this screen can never accept something the write
     refuses, or refuse something the write would accept. */
  function previewVideoErrors() {
    var v = work && work.previewVideo;
    if (!v) { return []; }
    var url = String(v.url || '').trim();
    if (!url) {
      if (!v.label && !v.note) { return []; }
      return [{
        field: 'f-preview-url',
        message: 'Add the preview video address, or clear its label and note. The video is stored as a link, ' +
          'so without an address there is nothing to keep.'
      }];
    }
    if (!state.isHttpUrl(url)) {
      return [{
        field: 'f-preview-url',
        message: 'The preview video address must be a full http:// or https:// link. The platform stores only ' +
          'the address, so anything else could never be opened — it would be discarded rather than saved.'
      }];
    }
    return [];
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
    /* PREVIEW / DEMO VIDEO. Held as `{url,label,note}` or null, which is
       precisely the shape `updateContentDraft` expects in
       `fields.previewVideo`; the state layer normalises it and stamps
       who added it and when.

       EMPTYING THE FIELDS IS HOW A VENDOR REMOVES THE VIDEO — the null
       below clears it on save. That is why there is no separate "Remove
       video" button: a second way to do the same thing would either
       disagree with the field or sit there doing nothing. The label and
       the note are kept in the object even when only they were typed,
       so `previewVideoErrors()` can tell "no video" apart from "a video
       whose address is missing" and say so. */
    var pvUrl = String(val('i-preview-url')).trim();
    var pvLabel = String(val('i-preview-label')).trim();
    var pvNote = String(val('i-preview-note')).trim();
    work.previewVideo = (pvUrl || pvLabel || pvNote)
      ? { url: pvUrl, label: pvLabel, note: pvNote }
      : null;
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

    ['i-course', 'i-name', 'i-summary', 'i-description', 'i-version', 'i-notes',
     /* The preview-video fields join the same list so the working copy
        tracks them as they are typed, like every other free-text field.
        `persist()` re-reads the whole form regardless, so this is not
        what makes the value save; it is what keeps `work` truthful in
        between, which is what the checklist and any later read see. */
     'i-preview-url', 'i-preview-label', 'i-preview-note'].forEach(function (id) {
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
      /* The lifecycle rules come from the state layer; the preview-video
         rule is added on top of them rather than woven into them,
         because it guards against a SILENT DROP rather than an
         incomplete submission. Both sets go through one `showErrors`
         call so the summary box lists everything wrong at once and the
         first bad field takes focus — a second, separate error pass
         would steal focus from the first. */
      var errs = state.validateContent(work, thenSubmit ? 'submit' : 'draft', { exceptId: work.id })
        .concat(previewVideoErrors());
      if (!ui.showErrors(form, errs, thenSubmit
            ? 'This submission is not ready for academic review'
            : 'The draft cannot be saved yet')) { return; }
      var saved;
      if (rec) { saved = state.updateContentDraft(actor.id, rec.id, work); }
      else {
        saved = state.createContentDraft(actor.id, work);
        /* ⚠ `createContentDraft` builds the new record from a fixed
           field list that does not carry `previewVideo`, so a video
           supplied on the CREATE form would be dropped on the way in —
           the Vendor would type it, save, and find it gone. Writing it
           immediately afterwards through `updateContentDraft` — the one
           writer that normalises and stamps it — puts it on the record
           by the only supported path, instead of this screen reaching
           into the stored object and setting the field itself.

           Nothing new is authorised by the second call: same actor, same
           record they have just created, same Course, so every gate it
           re-asks has already been answered yes a line earlier. If it
           were ever to refuse, the draft still exists and the Vendor is
           taken to it, where the empty video card says plainly that no
           video has been supplied. */
        if (saved && work.previewVideo && work.previewVideo.url) {
          state.updateContentDraft(actor.id, saved.id, work);
        }
      }
      if (!saved) {
        ui.toast('This draft could not be saved.', 'info');
        return;
      }
      if (!thenSubmit) {
        work = null;
        /* Not "private to you": the Content Library and the canonical
           catalogue both list a draft. The toast says the same thing the
           form's own note says, and nothing more. */
        ui.toast('Draft saved. It is not in the public catalogue and reaches no institution, Faculty or Student.');
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
      /* Later versions this Vendor is carrying — drafts included, because
          the count is "versions you have", not "versions you submitted". */
      var vers = state.versionsForVendor(actor.id).length;
      return [
        { href: href.vOverview(actor.id), icon: 'home', label: 'Overview',
          active: activeKey === 'overview', count: 0 },
        { href: href.vExperiments(actor.id), icon: 'flask', label: 'My Experiments',
          active: activeKey === 'experiments', count: o.total,
          countLabel: util.plural(o.total, 'experiment') + ' you have created' },
        { href: href.vSubmissions(actor.id), icon: 'doc', label: 'Submissions',
          active: activeKey === 'submissions', count: subs,
          countLabel: util.plural(subs, 'submission') + ' in the content workflow' },
        /* Implementation 06 — later versions of ALREADY-PUBLISHED
           experiments. A separate destination from Submissions because
           it is a separate object with a separate lifecycle, ending in
           the Super Admin's Release / Hold decision, not publication. */
        { href: href.vVersions(actor.id), icon: 'layers', label: 'Versions',
          active: activeKey === 'versions', count: vers,
          countLabel: util.plural(vers, 'later version') + ' you are carrying' },
        { href: href.vHelp(actor.id), icon: 'alertCirc', label: 'Help',
          active: activeKey === 'help', count: 0 }
      ];
    }
  };
})();
