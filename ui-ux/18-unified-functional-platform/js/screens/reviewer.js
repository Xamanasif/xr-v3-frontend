/* ============================================================
   Unified Functional Platform — ACADEMIC REVIEWER workspace
   (Implementation 05).

   `Academic Reviewer` is one of the seven formal roles (STK31-01).

   What this role OWNS (STK31-08):
     · academic validation
     · Course / Experiment academic alignment
     · LEARNING OUTCOMES — this workspace is where they are authored
     · the academic review decision: approve, or request changes (PM-14)

   What this role CANNOT do:
     · publish, or set published status — that is the Content Manager's
       first publication (STK31-06). There is no publish control here,
       and `state.publishContent()` refuses a reviewer actor.
     · grant tenant access, alter a licence, assign a student, or change
       a Faculty mapping — none of those is a content-production action.
     · grade a descriptive answer — that is Faculty, the only human
       evaluator (STK31-31). This is not the Faculty review queue.

   Scope: a reviewer sees the submissions inside their assignment, which
   may be per-Course or per-Experiment (STK31-41). A hand-typed route to
   a submission outside it resolves to not found, and the state layer
   refuses the action too.

   Every navigation destination is implemented. There is no Question
   Bank, student grading, tenant operations, publishing or licence
   entry: none belongs to this role.
   ============================================================ */

window.XRSLP = window.XRSLP || {};
XRSLP.screens = XRSLP.screens || {};

(function () {
  'use strict';

  var esc = XRSLP.util.esc;
  var util = XRSLP.util;
  var ui = XRSLP.ui;
  var state = XRSLP.state;
  var data = XRSLP.data;
  var cui = XRSLP.contentUI;
  var href = cui.href;
  var CS = state.CONTENT_STATUS;

  var queueFilter = { status: 'all', q: '', course: 'all' };

  /* Implementation 07 — the reviewer's own decision history links to the
     object the decision was taken on, and BOTH destinations read the LIVE
     role assignments: `reviewerRecord` below, and `reviewerVersion` in
     content-version.js. So a record that has left this reviewer's scope —
     a withdrawn assignment, or a Content Manager moving the Experiment to
     another Course — makes that route resolve to Not found. The decision
     itself is kept, so the row stays; only the link goes, and the row
     says why. Never render a link that is known to 404. */
  function decisionTargetHTML(actor, d) {
    var rec = state.contentRecord(d.recordId);
    if (!rec) { return esc(d.recordId); }
    if (!state.actorCoversRecord(actor.id, rec)) {
      return esc(rec.name) +
        ' <span class="muted">· outside your assigned scope now — the decision is kept</span>';
    }
    if (d.versionId) {
      return '<a href="' + href.rVersion(actor.id, d.versionId) + '">' + esc(rec.name) + '</a>';
    }
    /* Seeded catalogue content carries no submission, and `reviewerRecord`
       refuses it for that reason. */
    if (rec.origin === 'seed') { return esc(rec.name); }
    return '<a href="' + href.rRecord(actor.id, rec.id) + '">' + esc(rec.name) + '</a>';
  }

  /* The academic decisions this reviewer took on LATER VERSIONS. The state
     layer records them on the version itself (`academicDecision*` and the
     version's own history) rather than in `academicReviews[]`, whose
     revision / outcomes / fingerprint shape belongs to a submission — so
     reading only `academicReviews[]` left half of a reviewer's own
     decisions missing from the one card that claims to list them. */
  function versionDecisionsBy(actorId) {
    var out = [];
    state.contentVersions().forEach(function (v) {
      /* One row per decision TAKEN, not one per version: a version that
         was returned and later approved carries two decisions, and only
         the second survives in `academicDecision*`. The version's own
         history keeps both, and on a version 'approved' and 'changes' are
         the academic decision and nothing else — Release, Hold and the
         lifting of a hold are 'released' / 'held' / 'reopened'. */
      (v.history || []).forEach(function (h) {
        if (h.actorId !== actorId) { return; }
        if (h.kind !== 'approved' && h.kind !== 'changes') { return; }
        out.push({
          recordId: v.recordId, versionId: v.id, versionLabel: v.versionLabel,
          decision: h.kind === 'approved' ? 'approved' : 'changes_requested',
          at: h.at, comment: h.note
        });
      });
    });
    return out;
  }

  function resolveActor(params) {
    var a = state.contentActor(params.actorId);
    if (!a || a.role !== state.CONTENT_ROLE.REVIEWER) { return null; }
    return a;
  }

  function shell(actor, navKey, title, html, after) {
    return { title: title, html: html, area: 'review', navKey: navKey, contentActor: actor, after: after };
  }

  /* ============================================================
     07.3 — THE CONTENT MANAGER'S ACADEMIC RETURN
     (`CONTENT_STATUS.CHANGES_ACADEMIC_RECHECK`).

     The Content Manager's single "request changes" was split into two
     real destinations. The academic one lands HERE: the record comes
     back to the Academic Reviewer, not to the Vendor.

     Everything below exists because such a record LOOKS like a fresh
     submission in this workspace — same queue, same decision controls —
     and is not one. It has already been through academic approval once,
     the Vendor has not been asked for anything, and the reason it is
     back was written by somebody else. A reviewer who cannot see that
     re-reviews the wrong thing.
     ============================================================ */

  /* One sentence per state, owned by the shared renderer. A local
     override here forked the wording, so the same record described itself
     differently depending on which screen rendered it. */
  function holderText(rec, audience) {
    return cui.holderLine(rec, audience);
  }

  /* WHY a record is back. The state layer keeps no dedicated field for
     it: `requestChangesContent(..., {destination:'reviewer'})` writes the
     Content Manager's reason and references as an ordinary `changes`
     history event, and history is newest-first, so the newest `changes`
     entry written by a MANAGER actor is the return being served.

     The actor's ROLE is checked rather than merely taking the newest
     `changes` entry, because the same record can also carry this
     reviewer's own earlier returns to the Vendor. Presenting one of those
     as "why the Content Manager sent this back" would be a fabrication —
     the reviewer would answer a comment nobody just made. */
  function managerReturnEntry(rec) {
    if (!rec || rec.status !== CS.CHANGES_ACADEMIC_RECHECK) { return null; }
    var found = null;
    (rec.history || []).forEach(function (h) {
      if (found || h.kind !== 'changes') { return; }
      var a = h.actorId ? state.contentActor(h.actorId) : null;
      if (a && a.role === state.CONTENT_ROLE.MANAGER) { found = h; }
    });
    return found;
  }

  /* The full explanation, for the record detail. The Content Manager's
     supporting references are rendered with the SHARED renderer, which
     carries the "nothing was uploaded" honesty note with them, and they
     are titled as the Content Manager's — never merged with the Vendor's
     supporting documentation, which is a different list from a different
     person at a different point in the workflow. */
  /* ⚠ WHO ACTUALLY APPROVED IT — 07.3 adversarial fix.

     This panel used to assert "You approved it academically" to whoever
     was reading. Two ways that is false, and both are reachable:

       · SEVERAL REVIEWERS MAY HOLD THE SAME SCOPE. `STK31-41` allows it
         and `assignPlatformRole()` enforces no uniqueness, so the
         approver may be a colleague — and the panel would tell this
         reader they made a decision they did not make.
       · IT MAY NEVER HAVE BEEN APPROVED AT ALL. `CONTENT_REVIEW` is in
         `OVERRIDABLE_STATUS`, so a Super Admin can move a record to the
         publication gate without any `approveAcademic()` call. The
         Content Manager can then return it, which writes exactly the
         history entry this panel keys on.

     The record already carries the truth, so the sentence is derived
     rather than assumed. */
  function approvalProvenance(rec, actorId) {
    var ar = rec && rec.academicReview;
    if (!ar || !ar.reviewerId) {
      return 'It reached the Content Manager <strong>without a recorded academic approval</strong> — ' +
        'a platform override can move an item to the publication gate — so treat this as a first ' +
        'academic decision rather than a re-check of your own.';
    }
    if (ar.reviewerId === actorId) {
      return 'You approved it academically, it went to the Content Manager, and they sent it back.';
    }
    return 'It was approved academically by <strong>' + esc(ar.reviewerName || 'another Academic Reviewer') +
      '</strong>, went to the Content Manager, and has come back to you — not to them.';
  }

  function returnedByManagerHTML(rec, actorId) {
    var h = managerReturnEntry(rec);
    if (!h) { return ''; }
    return ui.alertBox('warning', 'Returned to you by the Content Manager for academic re-check',
      '<p>This is <strong>not a new submission</strong>. ' + approvalProvenance(rec, actorId) +
      ' The Content Manager sent it back for an <strong>academic</strong> reason rather than to the ' +
      'Vendor. The Vendor has not been asked for anything and cannot edit it while it is with you.</p>' +
      '<p class="muted" style="margin-top:8px">' +
      (h.actorName ? esc(h.actorName) + ' · ' : '') +
      (h.actorRole ? esc(h.actorRole) + ' · ' : '') + esc(util.fmtDateTime(h.at)) + '</p>' +
      (h.note
        ? '<blockquote class="qquote">' + esc(h.note) + '</blockquote>'
        : '<p class="muted">No reason text was recorded with this return.</p>') +
      cui.refsHTML(h.refs, { title: 'References supplied by the Content Manager' }));
  }

  /* The one-line version, for the queue and the overview, where a full
     alert box would drown the rows around it. */
  function returnedByManagerLine(rec) {
    var h = managerReturnEntry(rec);
    if (!h) { return ''; }
    return '<p class="muted">Returned by the Content Manager' +
      (h.actorName ? ' (' + esc(h.actorName) + ')' : '') + ' on ' + esc(util.fmtDate(h.at)) +
      ' — not a new submission.' +
      (h.note ? ' <q>' + esc(h.note) + '</q>' : '') +
      (h.refs && h.refs.length
        ? ' <span>' + h.refs.length + ' supporting ' + util.plural(h.refs.length, 'reference') +
          ' attached — open the record to read them.</span>'
        : '') +
      '</p>';
  }

  /* ---------------- R16 — inspect, do not edit ----------------
     The Academic Reviewer must be able to OPEN what they are reviewing.
     `cui.deliveryRows()` prints the hosted URL as text, so the only way
     to see the experience was to select the URL and paste it somewhere —
     which is why a reviewer would ask for edit rights they must not have.

     This adds the open affordance and NOTHING else. There is no delivery
     field, no save, no re-upload and no remove here: correcting a
     delivery reference is the Content Manager's action (with a reason),
     and supplying one is the Vendor's. Opening is inspection.

     A link is only rendered when there is genuinely something to open —
     a hosted URL, or a package reference the Vendor recorded as a URL.
     A package reference that is not a URL is stated as not openable
     rather than being dressed up as a link that would 404, because this
     prototype hosts, uploads and deploys nothing. */
  function deliveryOpenHTML(rec) {
    var techs = rec.technologies || [];
    if (!techs.length) { return ''; }
    var rows = data.sortTech(techs).map(function (t) {
      var def = data.TECHNOLOGIES[t];
      var d = state.deliveryOf(rec, t);
      var hosted = !!def && def.delivery === 'hosted';
      var name = def ? def.name : t;
      var url = hosted ? (d.url || '') : (d.packageRef || '');
      if (url && state.isHttpUrl(url)) {
        return '<li>' + ui.ic('arrowR') + '<span>' + ui.fmtBadge(t) + ' ' +
          '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer" ' +
          'aria-label="Open the ' + esc(name) + ' delivery link in a new tab">' + esc(url) + '</a>' +
          (hosted ? '' : ' <span class="muted">· distribution reference supplied as a link</span>') +
          '</span></li>';
      }
      return '<li>' + ui.ic('info') + '<span>' + ui.fmtBadge(t) + ' ' + esc(name) + ' — ' +
        (hosted
          ? 'no hosted URL has been supplied, so there is nothing to open.'
          : (url
              ? 'the package reference (' + esc(url) + ') is not a link, so it cannot be opened here.'
              : 'no package reference has been supplied, so there is nothing to open.')) +
        '</span></li>';
    }).join('');

    return '<div style="margin-top:16px;padding-top:13px;border-top:1px solid var(--border-subtle)">' +
      '<p><strong>Open it for your review</strong></p>' +
      '<ul class="reslist plain">' + rows + '</ul>' +
      /* `.dnote` is a flex row of exactly two children — icon, then text.
         Marked-up text must therefore be wrapped in ONE span, or every
         inline element becomes its own flex item and the sentence lays
         itself out in columns. */
      '<p class="dnote">' + ui.ic('info', 'sm') +
      '<span>Opening a link is <strong>inspection only</strong>. It gives you no authority over the ' +
      'delivery: the Vendor supplies it and the Content Manager corrects it with a recorded reason. ' +
      'Nothing is installed, downloaded or deployed by this prototype, so an authorised package can only ' +
      'be described here, never opened.</span></p>' +
      '</div>';
  }

  XRSLP.screens.reviewerHome = function () {
    var chosen = state.protoReviewer();
    if (chosen) { return { redirect: href.rOverview(chosen.id) }; }
    return {
      title: 'Academic Reviewer workspace',
      area: 'review', navKey: 'overview', contentActor: null,
      html: cui.chooserScreen('reviewer', {
        title: 'Academic Reviewer workspace',
        actionLabel: 'Open workspace',
        metaHTML: 'Choose which sample Academic Reviewer identity to view the review workspace as.'
      }),
      after: function () {
        Array.prototype.slice.call(document.querySelectorAll('[data-actor]')).forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = btn.getAttribute('data-actor');
            state.setProtoReviewer(id);
            XRSLP.router.go(href.rOverview(id));
          });
        });
      }
    };
  };

  /* ---------------- Overview ----------------
     No academic quality score, no reviewer rating, no throughput
     target: none exists in any source. Every tile counts records. */
  XRSLP.screens.reviewerOverview = function (params) {
    var actor = resolveActor(params);
    if (!actor) { return XRSLP.screens.notFound(); }
    var o = state.reviewerOverview(actor.id);
    /* Implementation 06 — a later version waits on the SAME academic
       decision as a first submission, so it belongs in the same figure.
       Counting only submissions here made the Overview say nothing was
       waiting while the navigation badge beside it said one item was. */
    var waitingVersions = state.versionsForReviewer(actor.id,
      { status: state.VERSION_STATUS.ACADEMIC_REVIEW });
    /* Implementation 07 — the same reasoning for the returned figure: a
       later version sent back at the academic gate is with its Vendor
       exactly as a returned submission is, and counting only submissions
       here read as nothing returned while the queue below listed one. */
    var returnedVersions = state.versionsForReviewer(actor.id,
      { status: state.VERSION_STATUS.CHANGES_ACADEMIC });

    /* 07.3 — `o.waiting` already counts the records the Content Manager
       returned for academic re-check, because they wait on exactly the
       same decision. Counting them silently would have made the tile say
       more work arrived than a reviewer could account for, so the note
       says how much of the figure came back rather than in. */
    var waitingNote = o.returnedByManager
      ? 'awaiting your decision · ' + o.returnedByManager + ' returned by the Content Manager'
      : 'awaiting your decision';

    var tiles = '<div class="statgrid">' +
      cui.statTile(o.waiting + waitingVersions.length, 'Waiting for review', waitingNote) +
      cui.statTile(o.changesRequested + returnedVersions.length, 'Changes requested', 'returned to the Vendor') +
      cui.statTile(o.approvedAwaitingPublication, 'Academically approved', 'awaiting publication') +
      cui.statTile(o.published, 'Published', 'from your assigned scope') +
      '</div>';

    var versionRows = waitingVersions.map(function (v) {
      var rec = state.contentRecord(v.recordId);
      return '<div class="at-row"><span class="at-ic">' + ui.ic('layers') + '</span>' +
        '<div class="at-body"><div class="at-t">' + esc(rec ? rec.name : v.recordId) +
        ' — version ' + esc(v.versionLabel) + '</div>' +
        '<p>Later version of published content · replaces ' + esc(v.replacesVersionLabel || '—') +
        ' · submitted ' + esc(util.fmtDate(v.submittedAt)) +
        '. Approving it hands it to the Super Admin for the Release / Hold decision.</p></div>' +
        '<a class="btn sec sm" href="' + href.rVersion(actor.id, v.id) + '">Review</a></div>';
    }).join('');

    var attnHTML = (o.queue.length || waitingVersions.length)
      ? '<div class="attn">' + versionRows + o.queue.map(function (r) {
          var ready = state.academicReadiness(r);
          /* A returned record is not a fresh arrival, so it does not read
             as one: alert icon, warn row, and the Content Manager's own
             reason underneath. Without this the row is indistinguishable
             from a first submission and the reviewer re-reviews the whole
             thing instead of the point that was raised. */
          var back = managerReturnEntry(r);
          return '<div class="at-row ' + (ready.ok && !back ? '' : 'warn') + '"><span class="at-ic">' +
            ui.ic(back ? 'alert' : 'clock') + '</span>' +
            '<div class="at-body"><div class="at-t">' + esc(r.name) + '</div>' +
            '<p>' + cui.contextLine(r) + ' · submitted ' +
            esc(util.fmtDate(r.submittedAt)) +
            (r.resubmitted ? ' · resubmitted (revision ' + r.revision + ')' : '') +
            (ready.ok ? '' : ' · Learning Outcomes not yet recorded') + '</p>' +
            returnedByManagerLine(r) + '</div>' +
            '<a class="btn sec sm" href="' + href.rRecord(actor.id, r.id) + '">' +
            (back ? 'Re-check' : 'Review') + '</a></div>';
        }).join('') + '</div>'
      : ui.emptyState({
          icon: 'check', heading: 'h3',
          title: 'Nothing is waiting for academic review',
          body: 'No submission in your assigned scope is currently awaiting an academic decision.'
        });

    /* Both kinds of academic decision, newest first: first submissions and
       later versions. A later version is Released or Held by the Super
       Admin, never published by anyone here, so the row says which object
       the decision was taken on and claims nothing further. */
    var decisions = o.decisions.concat(versionDecisionsBy(actor.id))
      .sort(function (a, b) { return new Date(b.at) - new Date(a.at); });
    var shown = decisions.slice(0, 5);
    /* The list was cut to five silently, which read as "these are all the
       decisions I have taken". Say what is being withheld. */
    var recentFoot = '';
    if (shown.some(function (d) { return !!d.versionId; })) {
      recentFoot += 'A later-version decision is recorded on the version itself. Approving one hands it to ' +
        'the Super Admin for the Release / Hold decision; it releases nothing here. ';
    }
    if (decisions.length > shown.length) {
      recentFoot += 'Showing the ' + shown.length + ' most recent of ' + decisions.length +
        ' decisions you have recorded.';
    }

    var recentHTML = shown.length
      ? '<div class="timeline">' + shown.map(function (d) {
          return '<div class="tl-item"><span class="tl-dot ' +
            (d.decision === 'approved' ? 'good' : 'warn') + '">' +
            ui.ic(d.decision === 'approved' ? 'check' : 'alert') + '</span>' +
            '<div class="tl-body"><div class="tl-action">' +
            esc(d.decision === 'approved' ? 'Approved' : 'Changes requested') + ' — ' +
            decisionTargetHTML(actor, d) +
            '</div><div class="tl-who">' + esc(util.fmtDateTime(d.at)) + ' · ' +
            (d.versionId
              ? 'later version ' + esc(d.versionLabel || '—')
              : 'revision ' + esc(String(d.revision))) + '</div>' +
            (d.comment ? '<p class="tl-note">' + esc(d.comment) + '</p>' : '') +
            /* 07.3 — the supporting references the reviewer attached to a
               change request are part of the decision they took, so the
               list of their own decisions has to show them. A later-version
               decision row is built from version history and carries none,
               and the shared renderer returns nothing for an empty list. */
            cui.refsHTML(d.refs, { title: 'Supporting references' }) +
            '</div></div>';
        }).join('') + '</div>' +
        (recentFoot ? '<p class="cardfoot">' + recentFoot + '</p>' : '')
      : '<p class="muted">You have not recorded an academic decision yet.</p>';

    /* Implementation 07 — this card listed `actorCourseIds()`, which
       widens an Experiment-scope assignment to its parent Course: a
       reviewer granted one Experiment was shown the whole Course as
       theirs, while the Super Admin's governance screen described the very
       same row as "Experiment — <name>". `actorScopeText()` reports the
       rows as they were granted. */
    var scopeHTML = o.courses.length
      ? '<ul class="reslist plain"><li>' + ui.ic('book') + '<span><strong>' +
        esc(state.actorScopeText(actor.id)) + '</strong></span></li></ul>'
      : '<p class="muted">No Course or Experiment has been assigned to you.</p>';

    var html =
      ui.phead('Overview', esc(actor.name) + ' · Academic Reviewer') +
      tiles +
      '<div class="grid-rail" style="margin-top:18px">' +
      '<div class="stack">' + ui.card('Awaiting your academic decision', attnHTML) + '</div>' +
      '<div class="stack">' +
      ui.card('Your assigned scope', scopeHTML, 'Granted by the Super Admin') +
      ui.card('Your recent decisions', recentHTML) +
      ui.card('What academic approval does',
        '<p>Approval records the academic decision and the Learning Outcomes, and moves the submission to the ' +
        '<strong>Content Manager</strong> for content readiness review.</p>' +
        '<p style="margin-top:8px">It does <strong>not</strong> publish anything. First publication is the ' +
        'Content Manager’s, and it does not grant the experiment to any institution.</p>') +
      '</div></div>';

    return shell(actor, 'overview', 'Academic Reviewer overview', html);
  };

  /* ---------------- Review queue ---------------- */
  /* Implementation 06 — LATER VERSIONS of already-published experiments
     wait on the same academic decision as a first submission, so they
     belong in the same queue. They are a different object with a
     different lifecycle, so they get their own card rather than being
     mixed into the submissions table: approving one hands it to the
     SUPER ADMIN for Release / Hold, and the card says so. */
  function versionCard(actor) {
    var vers = state.versionsForReviewer(actor.id, {});
    var waiting = vers.filter(function (v) { return v.status === state.VERSION_STATUS.ACADEMIC_REVIEW; });
    if (!vers.length) { return ''; }
    return ui.card('Later versions',
      '<div class="tscroll"><table class="dt">' +
      '<caption class="sr-only">Later versions of published experiments in your assigned scope</caption>' +
      '<thead><tr><th scope="col">Experiment</th><th scope="col">Version</th><th scope="col">Replaces</th>' +
      '<th scope="col">Vendor</th><th scope="col">State</th>' +
      '<th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' +
      vers.map(function (v) {
        var rec = state.contentRecord(v.recordId);
        var actionable = v.status === state.VERSION_STATUS.ACADEMIC_REVIEW;
        return '<tr>' +
          '<td data-label="Experiment">' + esc(rec ? rec.name : v.recordId) + '</td>' +
          '<td data-label="Version">' + esc(v.versionLabel) + '</td>' +
          '<td data-label="Replaces">' + esc(v.replacesVersionLabel || '—') + '</td>' +
          '<td data-label="Vendor">' + esc(v.createdByName) + '</td>' +
          '<td data-label="State">' + XRSLP.versionUI.badge(v) + '</td>' +
          '<td class="cell-actions"><a class="btn ' + (actionable ? 'sec' : 'gho') + ' sm" href="' +
          href.rVersion(actor.id, v.id) + '">' + (actionable ? 'Review' : 'View') + '</a></td>' +
          '</tr>';
      }).join('') + '</tbody></table></div>' +
      '<p class="cardfoot">' +
      (waiting.length
        ? waiting.length + ' ' + util.plural(waiting.length, 'version') + ' awaiting your academic decision. '
        : '') +
      'Approving a version hands it to the <strong>Super Admin</strong> for the Release / Hold decision. ' +
      'It does not publish anything, and the published version does not change here.</p>', null, 'h2');
  }

  XRSLP.screens.reviewerQueue = function (params) {
    var actor = resolveActor(params);
    if (!actor) { return XRSLP.screens.notFound(); }
    var all = state.contentForReviewer(actor.id);
    var vcard = versionCard(actor);

    if (!all.length) {
      /* Implementation 07 — an empty queue has two different causes, and
         promising future arrivals is false for one of them: with no Course
         and no Experiment assigned, nothing can ever reach this queue.
         Same distinction the versions screen already draws. */
      var hasScope = state.actorCourseIds(actor.id).length > 0;
      return shell(actor, 'queue', 'Review queue',
        ui.phead('Review queue', esc(actor.name)) +
        '<div class="stack">' +
        '<div class="tablecard">' + ui.emptyState(hasScope ? {
          icon: 'doc',
          title: 'Nothing is in your review queue',
          body: 'No submission has reached academic review in the scope assigned to you. Submissions appear ' +
            'here once a Vendor submits them.'
        } : {
          icon: 'doc',
          title: 'No review scope is assigned to you',
          body: 'No Course or Experiment is currently assigned to you, so no submission can reach this queue. ' +
            'The Super Admin assigns review scope. Any decision you have already recorded is kept exactly ' +
            'as it is.'
        }) + '</div>' + vcard + '</div>');
    }

    cui.normaliseFilters(all, queueFilter);

    /* 07.3 — records the Content Manager returned for academic re-check.
       They sit in the same table as first submissions (they need the same
       decision), so the banner names them individually before the reader
       reaches the table: the status badge alone does not say WHO sent it
       back or WHY, and the reason is the whole point of the return. */
    var returned = all.filter(function (r) { return r.status === CS.CHANGES_ACADEMIC_RECHECK; });
    var returnedBanner = returned.length
      ? '<div style="margin-bottom:16px">' + ui.alertBox('warning',
          returned.length + ' ' + util.plural(returned.length, 'item') +
          ' returned by the Content Manager for academic re-check',
          '<p>These are <strong>not new submissions</strong>. Each was academically approved, then sent back ' +
          'to <strong>you</strong> rather than to the Vendor because the Content Manager judged the issue ' +
          'academic. The Vendor cannot edit them while they are with you.</p>' +
          '<ul class="reslist plain" style="margin-top:10px">' + returned.map(function (r) {
            var h = managerReturnEntry(r);
            return '<li>' + ui.ic('alert') + '<span>' +
              '<a href="' + href.rRecord(actor.id, r.id) + '">' + esc(r.name) + '</a>' +
              (h && h.note ? ' — <span class="muted">' + esc(h.note) + '</span>' : '') +
              '</span></li>';
          }).join('') + '</ul>') + '</div>'
      : '';

    var html =
      ui.phead('Review queue', esc(actor.name) + ' · Academic Reviewer') +
      returnedBanner +
      '<div class="tablecard">' +
      '<div class="listbar">' +
      '<label for="r-q">Search<input type="text" id="r-q" class="cellinput" ' +
      'placeholder="Experiment or course" value="' + esc(queueFilter.q) + '"></label>' +
      '<label for="r-status">Status<select id="r-status">' +
      /* `cui.statusFilterOptions()` now carries CHANGES_ACADEMIC_RECHECK
         itself. A local append here duplicated the option — same value,
         two labels, both marked selected when the filter was active. */
      cui.statusFilterOptions(all, queueFilter.status) +
      '</select></label>' +
      '<label for="r-course">Course<select id="r-course">' +
      cui.courseFilterOptions(all, queueFilter.course) + '</select></label>' +
      '<span class="lcount" id="r-count"></span>' +
      '</div>' +
      '<div class="tscroll"><table class="dt" id="r-table">' +
      '<caption class="sr-only">Submissions in the scope assigned to you</caption>' +
      '<thead><tr>' +
      '<th scope="col">Experiment</th><th scope="col">Vendor</th><th scope="col">Course</th>' +
      '<th scope="col">Technologies</th><th scope="col">Submitted</th><th scope="col">Version</th>' +
      '<th scope="col">Status</th><th scope="col"><span class="sr-only">Actions</span></th>' +
      '</tr></thead><tbody id="r-rows"></tbody></table></div>' +
      '<div id="r-empty"></div></div>' + (vcard ? '<div style="margin-top:16px">' + vcard + '</div>' : '');

    return shell(actor, 'queue', 'Review queue', html, function () {
      var rowsEl = document.getElementById('r-rows');
      var emptyEl = document.getElementById('r-empty');
      var countEl = document.getElementById('r-count');
      var tableEl = document.getElementById('r-table');

      function paint() {
        var rows = all.filter(function (r) { return cui.matchesFilters(r, queueFilter); });
        rowsEl.innerHTML = rows.map(function (r) {
          var vendor = r.createdBy ? state.contentActor(r.createdBy) : null;
          /* 07.3 — ask the state layer, do not re-derive the rule. A
             record returned for academic re-check is actionable here too,
             and a hard-coded `=== ACADEMIC_REVIEW` offered it as "View"
             while the decision controls on the detail screen were live —
             the row would have contradicted the screen it links to. */
          var actionable = state.reviewerCanAct(r, actor.id);
          var back = r.status === CS.CHANGES_ACADEMIC_RECHECK;
          return '<tr>' +
            '<td data-label="Experiment"><a href="' + href.rRecord(actor.id, r.id) + '">' + esc(r.name) + '</a></td>' +
            '<td data-label="Vendor">' + (vendor
              ? esc(vendor.name) + '<div class="muted">' + esc(vendor.organisation) + '</div>'
              : '<span class="muted">—</span>') + '</td>' +
            '<td data-label="Course">' + cui.contextLine(r) + '</td>' +
            '<td data-label="Technologies">' + ui.techBadges(r.technologies) + '</td>' +
            '<td data-label="Submitted">' + (r.submittedAt
              ? esc(util.fmtDate(r.submittedAt)) : '<span class="muted">—</span>') + '</td>' +
            '<td data-label="Version">' + esc(r.versionLabel || '—') +
            (r.revision > 1 ? ' <span class="muted">· rev ' + r.revision + '</span>' : '') + '</td>' +
            '<td data-label="Status">' + cui.statusBadge(r) +
            (back ? '<div class="muted">Returned by the Content Manager — not a new submission</div>' : '') +
            '</td>' +
            '<td class="cell-actions"><a class="btn ' + (actionable ? 'sec' : 'gho') + ' sm" href="' +
            href.rRecord(actor.id, r.id) + '">' +
            (back ? 'Re-check' : actionable ? 'Review' : 'View') + '</a></td>' +
            '</tr>';
        }).join('');
        countEl.textContent = rows.length + ' of ' + all.length + ' ' + util.plural(all.length, 'submission');
        if (!rows.length) {
          tableEl.setAttribute('hidden', 'hidden');
          emptyEl.innerHTML = ui.emptyState({
            icon: 'search',
            title: 'No submission matches',
            body: 'No submission in your assigned scope matches the current search and filters.'
          });
        } else {
          tableEl.removeAttribute('hidden');
          emptyEl.innerHTML = '';
        }
      }
      ['r-q', 'r-status', 'r-course'].forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) { return; }
        var key = id === 'r-q' ? 'q' : id === 'r-status' ? 'status' : 'course';
        el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', function () {
          queueFilter[key] = el.value; paint();
        });
      });
      paint();
    });
  };

  /* ---------------- Academic review detail ----------------
     The reviewer reads the academic and contextual content, and the
     technical delivery information as CONTEXT — they are not presented
     as a package-deployment operator. There is no install action, no
     download and no deploy control on this screen. */
  XRSLP.screens.reviewerRecord = function (params) {
    var actor = resolveActor(params);
    if (!actor) { return XRSLP.screens.notFound(); }
    var rec = state.contentRecord(params.recordId);
    /* Scope guard. Seeded published catalogue content carries no
       submission and is not review work; it is not reachable here. */
    if (!rec || rec.origin === 'seed' || !state.actorCoversRecord(actor.id, rec)) {
      return XRSLP.screens.notFound();
    }

    var actionable = state.reviewerCanAct(rec, actor.id);
    var ready = state.academicReadiness(rec);
    var vendor = rec.createdBy ? state.contentActor(rec.createdBy) : null;
    var priorDecisions = state.academicReviewsFor(rec.id);

    /* 07.3 — non-null only when the Content Manager returned this record
       for academic re-check, which is the one case where the reviewer is
       answering somebody else's specific point rather than reviewing a
       submission from scratch. */
    var backEntry = managerReturnEntry(rec);

    var stateNote;
    if (backEntry && actionable) {
      /* The two decisions available on a returned record are the same two
         controls as ever, but they mean different things now, so they are
         spelled out: approving sends it BACK to the Content Manager (it is
         not a first approval), and requesting changes moves it on to the
         VENDOR — the one route by which the Vendor becomes involved again.
         `requestChangesAcademic()` always returns to the Vendor; there is
         no reviewer→manager change request in the state layer, and none is
         invented here. */
      stateNote = returnedByManagerHTML(rec, actor.id) +
        '<div style="margin-top:14px">' + ui.alertBox('info', 'What you can do with it',
          '<p>Correct the academic content and the Learning Outcomes, then <strong>approve it again</strong> — ' +
          'it goes back to the Content Manager for the publication decision. If the fix is really the ' +
          'Vendor’s — the build, the package or a delivery link — <strong>request changes</strong> instead ' +
          'and it goes to the Vendor with your reason, not back to the Content Manager.</p>') + '</div>';
    } else if (actionable) {
      stateNote = ui.alertBox('info',
        rec.resubmitted ? 'Resubmitted for academic review (revision ' + rec.revision + ')'
                        : 'Awaiting your academic decision',
        '<p>Validate the academic content and its alignment to the Course, record the Learning Outcomes, then ' +
        'approve or request changes. Approving moves this to the Content Manager — it does not publish it.</p>');
    } else {
      stateNote = ui.alertBox('info', 'No academic decision is available',
        '<p>This submission is currently in “' + esc(state.contentStatusMeta(rec.status).label) +
        '” — ' + esc(holderText(rec, 'reviewer')) + '. It appears here read-only for reference.</p>');
    }

    var outcomesHTML = actionable
      ? '<div id="lo-editor"></div>'
      : cui.outcomesList(rec.outcomes,
          'No Learning Outcomes were recorded for this submission.');

    var decisionCard = actionable
      ? ui.card('Academic decision',
          /* Repainted by `refreshDecision()` whenever an outcome is added
             or deleted, so this can never contradict the Approve control
             sitting a few lines below it. */
          '<div id="r-readiness">' + readinessHTML(ready) + '</div>' +
          '<div class="form-errors" style="margin-top:14px"></div>' +
          '<div class="field" id="f-comment" style="margin-top:14px">' +
          '<label for="i-comment">Review comment</label>' +
          '<textarea id="i-comment" rows="4" maxlength="1200" aria-describedby="h-comment"></textarea>' +
          '<p class="hint" id="h-comment">Optional when approving. <strong>Required</strong> when requesting ' +
          'changes — a submission returned without a reason is not a review. Internal to the content ' +
          'workflow; never shown in the public catalogue.</p></div>' +
          /* R14 — the Academic Reviewer's own supporting references.
             The stakeholder asked for a provision to attach the reference
             document or resource that explains the change being asked for:
             "you should change the learning outcome" without the standard,
             rubric or annotated screenshot behind it sends the Vendor back
             to guess. `requestChangesAcademic()` takes the list as its 4th
             argument and keeps it on both the review record and the
             history entry.

             This is the REVIEWER'S list. It is deliberately not merged
             with — and never labelled the same as — the Vendor's own
             "Supporting documentation", which is what the Vendor supplied
             ABOUT the experiment. Two different people, two different
             purposes, two different points in the workflow. */
          cui.refsEditorHTML('r-rq', {
            legend: 'Supporting references for a change request (optional)',
            hint: 'Attach the standard, rubric, annotated screenshot or document that explains the change ' +
              'you are asking for. Used only when you request changes — an approval records no reference.'
          }) +
          '<div class="formact" style="padding-top:4px">' +
          '<button class="btn pri" type="button" id="r-approve"' +
          (ready.ok ? '' : ' aria-disabled="true"') + '>' + ui.ic('check') + 'Approve academically</button>' +
          '<button class="btn sec" type="button" id="r-changes">' + ui.ic('alert') + 'Request changes</button>' +
          '<span class="formnote">Approval records your identity, the time, the decision and the Learning ' +
          'Outcomes as they stand. It does not publish anything, and it attaches no reference — references ' +
          'travel with a change request.</span>' +
          '</div>')
      : '';

    var priorHTML = priorDecisions.length
      ? '<div class="timeline">' + priorDecisions.map(function (d) {
          return '<div class="tl-item"><span class="tl-dot ' +
            (d.decision === 'approved' ? 'good' : 'warn') + '">' +
            ui.ic(d.decision === 'approved' ? 'check' : 'alert') + '</span>' +
            '<div class="tl-body"><div class="tl-action">' +
            esc(d.decision === 'approved' ? 'Approved' : 'Changes requested') +
            ' — revision ' + esc(String(d.revision)) + '</div>' +
            '<div class="tl-who">' + esc(d.reviewerName) + ' · ' + esc(util.fmtDateTime(d.at)) + '</div>' +
            (d.comment ? '<p class="tl-note">' + esc(d.comment) + '</p>' : '') +
            /* R14 — the references attached to a past change request are
               part of what was asked for, so they stay attached to it
               here. An approval carries none and the shared renderer
               returns nothing for an empty list, so no card gains an
               empty "Supporting references" heading. */
            cui.refsHTML(d.refs, { title: 'Supporting references' }) +
            '</div></div>';
        }).join('') + '</div>'
      : '<p class="muted">No academic decision has been recorded for this submission yet.</p>';

    var html =
      ui.crumbs([{ label: 'Review queue', href: href.rQueue(actor.id) }, { label: rec.name }]) +
      ui.phead(rec.name,
        cui.contextLine(rec) + ' · ' + esc(holderText(rec, 'reviewer')),
        '', ' ' + cui.statusBadge(rec) + cui.revisionChip(rec) + cui.resubmittedChip(rec)) +
      stateNote +
      '<div class="grid-rail" style="margin-top:18px">' +
      '<div class="stack">' +
      ui.card('Experiment', cui.recordSummaryKV(rec, { showVendorNotes: true })) +
      /* R13 — the Vendor's preview / demo video, on the screen where the
         academic decision is actually taken. It sits directly under the
         Experiment summary and above the decision controls so it can be
         watched while deciding, rather than being something the reviewer
         has to go and look for somewhere else. It is a LINK the Vendor
         supplied, not an upload and not a substitute for the delivery. */
      ui.card('Preview / demo video',
        cui.previewVideoHTML(rec) +
        '<p class="dnote">' + ui.ic('info', 'sm') +
        '<span>A demonstration of the experience supplied by the Vendor. It is not the delivery itself, ' +
        'and watching it is not a substitute for reading the academic content below.</span></p>',
        rec.previewVideo ? 'Supplied by the Vendor' : null) +
      ui.card('Learning outcomes', outcomesHTML,
        actionable ? 'You own these' : 'Academic Reviewer owned') +
      decisionCard +
      /* R16 — openable, still read-only. See `deliveryOpenHTML()`. */
      ui.card('Technology delivery — context for your review',
        cui.deliveryRows(rec) + deliveryOpenHTML(rec),
        'Read-only · inspect only') +
      /* Named for whose list it is. The reviewer's own change-request
         references are a different list and are shown with the decision
         that carried them, never merged into this card. */
      ui.card('Supporting documentation from the Vendor', cui.documentsList(rec.documents)) +
      '</div>' +
      '<div class="stack">' +
      ui.card('Submission',
        '<div class="kv">' +
        cui.kvLine('Vendor', vendor
          ? esc(vendor.name) + '<div class="muted">' + esc(vendor.organisation) + '</div>'
          : '<span class="muted">—</span>') +
        cui.kvLine('Submitted', rec.submittedAt ? esc(util.fmtDateTime(rec.submittedAt)) : '—') +
        /* NOT "Version": `rec.versionLabel` is the version the PUBLIC
           sees, and a Super Admin Release overwrites it. Under a card
           headed Submission it read as the label the Vendor submitted,
           which after a release it is not. The same correction is on
           the Content Manager's item detail. */
        cui.kvLine(rec.status === state.CONTENT_STATUS.PUBLISHED ? 'Current public version' : 'Version label',
          esc(rec.versionLabel || '—')) +
        cui.kvLine('Revision', esc(String(rec.revision))) +
        '</div>') +
      ui.card('Academic decision history', priorHTML) +
      ui.card('Not part of this review',
        '<ul class="reslist plain">' +
        '<li>' + ui.ic('x') + '<span>Publishing — first publication is handled by the Content Manager.</span></li>' +
        '<li>' + ui.ic('x') + '<span>Granting the experiment to an institution — that needs a request and Super Admin approval.</span></li>' +
        '<li>' + ui.ic('x') + '<span>Assessment questions or student answers — those are Faculty’s, inside a tenant.</span></li>' +
        '<li>' + ui.ic('x') + '<span>Installing or deploying a package — no deployment is performed by this platform prototype.</span></li>' +
        /* R16 states the boundary in the same place every other refusal
           on this screen is stated, so "I can open it" is never read as
           "I can change it". */
        '<li>' + ui.ic('x') + '<span>Correcting a delivery link or package reference — you can open it to ' +
        'inspect it, but the Vendor supplies it and the Content Manager corrects it with a recorded ' +
        'reason.</span></li>' +
        '</ul>') +
      ui.card('History', cui.historyTimeline(rec)) +
      '</div></div>';

    return shell(actor, 'queue', rec.name, html, function () {
      if (actionable) { bindOutcomeEditor(actor, rec); bindDecision(actor, rec); }
    });
  };

  /* ---------------- Learning Outcomes editor ----------------
     Add · Edit · Delete · reorder, on the submission the reviewer
     currently holds. Ordered, because outcomes are read in order. */
  var loDraft = { text: '', editingIndex: -1, editingText: '' };

  function outcomeEditorHTML(rec) {
    var list = rec.outcomes.length
      ? '<ol class="lolist">' + rec.outcomes.map(function (o, i) {
          if (loDraft.editingIndex === i) {
            return '<li class="lo-editing">' +
              '<div class="field" style="margin:0">' +
              '<label class="sr-only" for="lo-edit">Edit learning outcome ' + (i + 1) + '</label>' +
              '<textarea id="lo-edit" rows="2" maxlength="300">' + esc(loDraft.editingText) + '</textarea>' +
              '</div>' +
              '<div class="lo-a">' +
              '<button class="btn pri sm" type="button" id="lo-save">Save</button>' +
              '<button class="btn gho sm" type="button" id="lo-cancel">Cancel</button>' +
              '</div></li>';
          }
          return '<li>' +
            '<span class="lo-t">' + esc(o) + '</span>' +
            '<span class="lo-a">' +
            '<button class="btn gho sm lo-up" type="button" data-i="' + i + '"' +
            (i === 0 ? ' disabled' : '') + ' aria-label="Move outcome ' + (i + 1) + ' up">' +
            ui.ic('arrowR', 'up') + '</button>' +
            '<button class="btn gho sm lo-down" type="button" data-i="' + i + '"' +
            (i === rec.outcomes.length - 1 ? ' disabled' : '') +
            ' aria-label="Move outcome ' + (i + 1) + ' down">' + ui.ic('arrowR', 'down') + '</button>' +
            '<button class="btn gho sm lo-edit" type="button" data-i="' + i + '"' +
            ' aria-label="Edit outcome ' + (i + 1) + '">Edit</button>' +
            '<button class="btn gho sm lo-del" type="button" data-i="' + i + '"' +
            ' aria-label="Delete outcome ' + (i + 1) + '">Delete</button>' +
            '</span></li>';
        }).join('') + '</ol>'
      : ui.emptyState({
          icon: 'book', heading: 'h3',
          title: 'No Learning Outcomes yet',
          body: 'Learning Outcomes are yours to author. Add one at a time — the list is numbered ' +
            'automatically. Add at least one before approving: they are published with the experiment and ' +
            'are what a prospective institution and every entitled student read.'
        });

    return list +
      '<div class="lo-add">' +
      '<div class="field" style="margin-bottom:8px">' +
      '<label for="lo-new">Add a learning outcome</label>' +
      '<textarea id="lo-new" rows="2" maxlength="300" aria-describedby="lo-new-h" ' +
      'placeholder="On completing this experiment the learner can…">' + esc(loDraft.text) + '</textarea>' +
      '<p class="hint" id="lo-new-h">Add one Learning Outcome at a time. The list is numbered ' +
      'automatically.</p>' +
      '</div>' +
      '<button class="btn sec sm" type="button" id="lo-add">' + ui.ic('plus') + 'Add outcome</button>' +
      '</div>';
  }

  function bindOutcomeEditor(actor, rec) {
    var host = document.getElementById('lo-editor');
    if (!host) { return; }

    /* Repainting the editor destroys the button that was just pressed, so
       focus would otherwise fall to <body> and a keyboard user would lose
       their place after every add, edit, move or delete. `refocus` names
       where to put it back. */
    function repaint(announce, refocus) {
      var fresh = state.contentRecord(rec.id);
      host.innerHTML = outcomeEditorHTML(fresh);
      bind(fresh);
      if (refocus) {
        var el = typeof refocus === 'string' ? document.getElementById(refocus) : refocus();
        if (el && el.focus) { el.focus(); }
      }
      if (announce) { ui.announce(announce); }
    }

    function bind(fresh) {
      var add = document.getElementById('lo-add');
      var input = document.getElementById('lo-new');
      if (input) {
        input.addEventListener('input', function () { loDraft.text = input.value; });
      }
      if (add) {
        add.addEventListener('click', function () {
          var text = (input && input.value || '').trim();
          if (!text) {
            ui.toast('Enter the outcome text before adding it.', 'info');
            if (input) { input.focus(); }
            return;
          }
          if (!state.addOutcome(actor.id, fresh.id, text)) {
            ui.toast('This outcome could not be added.', 'info');
            return;
          }
          loDraft.text = '';
          repaint('Learning outcome added.', 'lo-new');
          refreshDecision(actor, fresh.id);
        });
      }
      Array.prototype.slice.call(document.querySelectorAll('.lo-edit')).forEach(function (b) {
        b.addEventListener('click', function () {
          loDraft.editingIndex = parseInt(b.getAttribute('data-i'), 10);
          loDraft.editingText = fresh.outcomes[loDraft.editingIndex];
          repaint(null, 'lo-edit');
        });
      });
      Array.prototype.slice.call(document.querySelectorAll('.lo-del')).forEach(function (b) {
        b.addEventListener('click', function () {
          var i = parseInt(b.getAttribute('data-i'), 10);
          ui.openDialog({
            title: 'Delete this learning outcome?',
            bodyHTML: '<p>' + esc(fresh.outcomes[i]) + '</p>' +
              '<div class="consequence">' + ui.ic('info') +
              '<span>This submission is not published, so no catalogue page or student is reading this ' +
              'outcome yet.</span></div>',
            okLabel: 'Delete outcome',
            onConfirm: function () {
              state.deleteOutcome(actor.id, fresh.id, i);
              loDraft.editingIndex = -1;
              /* The deleted row is gone, so focus moves to the row that
                 took its place, or to the add field if it was the last. */
              repaint('Learning outcome deleted.', function () {
                var dels = document.querySelectorAll('.lo-del');
                return dels[Math.min(i, dels.length - 1)] || document.getElementById('lo-new');
              });
              refreshDecision(actor, fresh.id);
            }
          });
        });
      });
      Array.prototype.slice.call(document.querySelectorAll('.lo-up')).forEach(function (b) {
        b.addEventListener('click', function () {
          var iu = parseInt(b.getAttribute('data-i'), 10);
          state.moveOutcome(actor.id, fresh.id, iu, -1);
          /* The moved row is now at iu - 1. At the top of the list its own
             Move up button is rendered `disabled`, and focusing a disabled
             button is a no-op — focus would fall to <body>, which is the
             exact case this refocus exists to prevent. So the target has
             to be checked for being focusable, not merely for existing;
             the row's Move down button is always enabled here, because a
             move needs two outcomes. */
          repaint('Learning outcome moved up.', function () {
            var up = document.querySelectorAll('.lo-up')[iu - 1];
            return (up && !up.disabled) ? up : document.querySelectorAll('.lo-down')[iu - 1];
          });
        });
      });
      Array.prototype.slice.call(document.querySelectorAll('.lo-down')).forEach(function (b) {
        b.addEventListener('click', function () {
          var id2 = parseInt(b.getAttribute('data-i'), 10);
          state.moveOutcome(actor.id, fresh.id, id2, 1);
          /* Mirror of the up case: at the bottom of the list the moved
             row's own Move down button is disabled and cannot take focus,
             so fall through to its Move up button. */
          repaint('Learning outcome moved down.', function () {
            var down = document.querySelectorAll('.lo-down')[id2 + 1];
            return (down && !down.disabled) ? down : document.querySelectorAll('.lo-up')[id2 + 1];
          });
        });
      });
      var save = document.getElementById('lo-save');
      if (save) {
        save.addEventListener('click', function () {
          var ta = document.getElementById('lo-edit');
          var text = (ta && ta.value || '').trim();
          if (!text) { ui.toast('An outcome cannot be empty.', 'info'); return; }
          var ie = loDraft.editingIndex;
          state.updateOutcome(actor.id, fresh.id, ie, text);
          loDraft.editingIndex = -1;
          repaint('Learning outcome updated.', function () {
            return document.querySelectorAll('.lo-edit')[ie];
          });
          refreshDecision(actor, fresh.id);
        });
      }
      var cancel = document.getElementById('lo-cancel');
      if (cancel) {
        cancel.addEventListener('click', function () {
          var ic = loDraft.editingIndex;
          loDraft.editingIndex = -1;
          repaint(null, function () { return document.querySelectorAll('.lo-edit')[ic]; });
        });
      }
    }

    loDraft.editingIndex = -1;
    loDraft.text = '';
    repaint();
  }

  function readinessHTML(ready) {
    return ready.ok
      ? ui.alertBox('success', 'Ready for an academic decision',
          '<p>Learning Outcomes are recorded. You may approve academically, or return the submission to ' +
          'the Vendor with your reason.</p>')
      : cui.readinessCard(ready, '', '', 'Not ready to approve yet');
  }

  /* Keep the approve control AND the readiness statement above it honest
     as outcomes are added or removed, without a full re-render. */
  function refreshDecision(actor, recordId) {
    var fresh = state.contentRecord(recordId);
    if (!fresh) { return; }
    var ready = state.academicReadiness(fresh);
    var box = document.getElementById('r-readiness');
    if (box) { box.innerHTML = readinessHTML(ready); }
    var btn = document.getElementById('r-approve');
    if (!btn) { return; }
    if (ready.ok) { btn.removeAttribute('aria-disabled'); }
    else { btn.setAttribute('aria-disabled', 'true'); }
  }

  function bindDecision(actor, rec) {
    var approve = document.getElementById('r-approve');
    var changes = document.getElementById('r-changes');
    function comment() {
      var el = document.getElementById('i-comment');
      return el ? el.value.trim() : '';
    }
    /* R14 — read at CLICK time, not at render time: the reviewer types
       the link and picks the file after the screen has been built, and a
       value captured at render would always be empty. `cui.readRefs()`
       returns [] when the editor is untouched, never null. */
    function refs() { return cui.readRefs('r-rq'); }

    if (approve) {
      approve.addEventListener('click', function () {
        var fresh = state.contentRecord(rec.id);
        var ready = state.academicReadiness(fresh);
        if (!ready.ok) {
          ui.toast(ready.blockers[0], 'info');
          return;
        }
        /* `approveAcademic()` takes no references — an approval is not a
           request for anything, so there is nothing to point at. Silently
           dropping a reference the reviewer had just typed would be the
           worst of both: it would look attached and be gone. Say so
           before they confirm. */
        var pending = refs();
        var returned = managerReturnEntry(fresh);
        ui.openDialog({
          title: 'Approve academically?',
          bodyHTML: '<p>This records your academic approval of <strong>' + esc(fresh.name) +
            '</strong> at revision ' + fresh.revision + ', together with the ' + fresh.outcomes.length + ' ' +
            util.plural(fresh.outcomes.length, 'Learning Outcome') + ' you have recorded.</p>' +
            '<p style="margin-top:8px">It ' + (returned ? 'goes back to' : 'then moves to') +
            ' the <strong>Content Manager</strong> for content readiness review.</p>' +
            '<div class="consequence">' + ui.ic('info') +
            '<span>Approval does not publish this experiment, and it grants it to no institution.</span></div>' +
            (pending.length
              ? '<div class="consequence">' + ui.ic('alert') +
                '<span>The supporting ' + util.plural(pending.length, 'reference') + ' you entered ' +
                (pending.length === 1 ? 'is' : 'are') + ' attached to a <strong>change request</strong> only. ' +
                'Approving records ' + (pending.length === 1 ? 'it' : 'them') + ' nowhere.</span></div>'
              : ''),
          okLabel: 'Approve academically',
          onConfirm: function () {
            var updated = state.approveAcademic(actor.id, fresh.id, comment());
            if (!updated) { ui.toast('This submission could not be approved.', 'info'); return; }
            ui.toast('Academic validation complete — now with the Content Manager.');
            XRSLP.router.go(href.rQueue(actor.id));
          }
        });
      });
    }

    if (changes) {
      changes.addEventListener('click', function () {
        var text = comment();
        if (!text) {
          ui.showErrors(document.getElementById('f-comment').closest('.card'),
            [{ field: 'f-comment', message: 'Enter the reason before returning this submission to the Vendor.' }],
            'A returned submission needs a reason');
          var el = document.getElementById('i-comment');
          if (el) { el.focus(); }
          ui.toast('Enter your reason before requesting changes.', 'info');
          return;
        }
        /* Captured once, so the dialog describes exactly what the confirm
           will write. */
        var refList = refs();
        var wasReturned = managerReturnEntry(rec);
        ui.openDialog({
          title: 'Request changes?',
          bodyHTML: '<p>This returns <strong>' + esc(rec.name) + '</strong> to the Vendor for correction, with ' +
            'your comment.</p><blockquote class="qquote">' + esc(text) + '</blockquote>' +
            /* R14 — the reviewer sees the references as the Vendor will
               see them, rendered by the SAME shared renderer, so the
               "nothing was uploaded" line is in front of them before they
               confirm rather than discovered afterwards. */
            cui.refsHTML(refList, { title: 'Supporting references sent with this request' }) +
            '<div class="consequence">' + ui.ic('info') +
            '<span>The Vendor can correct and resubmit. The decision you record here is kept in the ' +
            'history.</span></div>' +
            /* A record the CONTENT MANAGER returned for academic re-check
               goes to the VENDOR from here, not back to the Content
               Manager — a different person from the one who asked. Nobody
               should discover that after the fact. */
            (wasReturned
              ? '<div class="consequence">' + ui.ic('alert') +
                '<span>The Content Manager returned this to you, but a change request goes to the ' +
                '<strong>Vendor</strong>. The Content Manager is not asked for anything and will see it ' +
                'again only after the Vendor resubmits and you approve it.</span></div>'
              : '') +
            /* ⚠ Returning work to a Vendor whose role scope has been
               withdrawn leaves it with nobody able to move it: read-only
               for them, and out of this queue. The decision is still the
               Reviewer's to take — this states the consequence rather
               than blocking it, because the alternative is a surprise. */
            (state.vendorScopeWithdrawn(rec, rec.createdBy)
              ? '<div class="consequence">' + ui.ic('alert') +
                '<span>The Vendor who submitted this no longer holds a role scope covering it, so they ' +
                'cannot correct or resubmit it. It will stay returned until the Super Admin restores their ' +
                'scope.</span></div>'
              : ''),
          okLabel: 'Request changes',
          onConfirm: function () {
            /* R14 — the references are the 4th argument. The state layer
               normalises and caps the list and keeps it on both the review
               record and the history entry, which is what makes it
               readable again from the Vendor's screen and from the
               decision history on this one. */
            var updated = state.requestChangesAcademic(actor.id, rec.id, text, refList);
            if (!updated) { ui.toast('Changes could not be requested.', 'info'); return; }
            ui.toast(refList.length
              ? 'Changes requested — returned to the Vendor with ' + refList.length + ' supporting ' +
                util.plural(refList.length, 'reference') + '.'
              : 'Changes requested — returned to the Vendor.');
            XRSLP.router.go(href.rQueue(actor.id));
          }
        });
      });
    }
  }

  XRSLP.reviewerUI = {
    href: href,
    nav: function (actor, activeKey) {
      var o = state.reviewerOverview(actor.id);
      /* First submissions AND later versions both wait on the same
         academic decision, so the queue counts both. */
      var waiting = o.waiting + state.versionsForReviewer(actor.id,
        { status: state.VERSION_STATUS.ACADEMIC_REVIEW }).length;
      return [
        { href: href.rOverview(actor.id), icon: 'home', label: 'Overview',
          active: activeKey === 'overview', count: 0 },
        { href: href.rQueue(actor.id), icon: 'doc', label: 'Review queue',
          active: activeKey === 'queue', count: waiting,
          countLabel: util.plural(waiting, 'item') + ' awaiting your academic decision' },
        { href: href.rHelp(actor.id), icon: 'alertCirc', label: 'Help',
          active: activeKey === 'help', count: 0 }
      ];
    }
  };
})();
