/* ============================================================
   Unified Functional Platform — shared content-production UI.

   ONE implementation of every piece the Vendor, the Academic Reviewer
   and the Content Manager all render: routes, status badge, holder
   line, the technology delivery panel, the Learning Outcomes list, the
   documentation list, the readiness list and the history timeline.

   The three workspaces differ by NAVIGATION, CONTENT, ACTIONS and
   AUTHORITY — not by styling. They use the same shell, the same cards,
   the same tables, the same badges and the same dialogs as the Super
   Admin, Tenant Admin, Faculty and Student workspaces.

   ⚠ PUBLIC INFORMATION BOUNDARY. Nothing in this module is rendered on
   a public, tenant, Faculty or Student surface. Vendor notes, reviewer
   comments, package references and the history timeline are internal to
   the content workflow; the public catalogue renders only the published
   catalogue fields.
   ============================================================ */

window.XRSLP = window.XRSLP || {};

XRSLP.contentUI = (function () {
  'use strict';

  var esc = XRSLP.util.esc;
  var util = XRSLP.util;
  var ui = XRSLP.ui;
  var data = XRSLP.data;
  var state = XRSLP.state;

  /* ---------------- routes ---------------- */
  var href = {
    vendorHome: function () { return '#/vendor'; },
    vOverview: function (a) { return '#/vendor/' + encodeURIComponent(a) + '/overview'; },
    vExperiments: function (a) { return '#/vendor/' + encodeURIComponent(a) + '/experiments'; },
    vNew: function (a) { return '#/vendor/' + encodeURIComponent(a) + '/experiments/new'; },
    vSubmissions: function (a) { return '#/vendor/' + encodeURIComponent(a) + '/submissions'; },
    vRecord: function (a, r) { return '#/vendor/' + encodeURIComponent(a) + '/experiment/' + encodeURIComponent(r); },
    vEdit: function (a, r) { return '#/vendor/' + encodeURIComponent(a) + '/experiment/' + encodeURIComponent(r) + '/edit'; },
    /* Implementation 06 — LATER versions of already-published content.
       The Vendor proposes one; the Academic Reviewer approves it; the
       SUPER ADMIN releases or holds it. `publish` appears on none of
       these routes, because publication is a different action on a
       different object (STK31-06 / STK31-07). */
    vNewVersion: function (a, r) { return '#/vendor/' + encodeURIComponent(a) + '/experiment/' + encodeURIComponent(r) + '/version'; },
    vVersions: function (a) { return '#/vendor/' + encodeURIComponent(a) + '/versions'; },
    vVersion: function (a, v) { return '#/vendor/' + encodeURIComponent(a) + '/version/' + encodeURIComponent(v); },
    vHelp: function (a) { return '#/vendor/' + encodeURIComponent(a) + '/help'; },

    reviewerHome: function () { return '#/review'; },
    rOverview: function (a) { return '#/review/' + encodeURIComponent(a) + '/overview'; },
    rQueue: function (a) { return '#/review/' + encodeURIComponent(a) + '/queue'; },
    rRecord: function (a, r) { return '#/review/' + encodeURIComponent(a) + '/submission/' + encodeURIComponent(r); },
    rVersion: function (a, v) { return '#/review/' + encodeURIComponent(a) + '/version/' + encodeURIComponent(v); },
    rHelp: function (a) { return '#/review/' + encodeURIComponent(a) + '/help'; },

    managerHome: function () { return '#/content'; },
    mOverview: function (a) { return '#/content/' + encodeURIComponent(a) + '/overview'; },
    mLibrary: function (a) { return '#/content/' + encodeURIComponent(a) + '/library'; },
    mQueue: function (a) { return '#/content/' + encodeURIComponent(a) + '/queue'; },
    mRecord: function (a, r) { return '#/content/' + encodeURIComponent(a) + '/item/' + encodeURIComponent(r); },
    mMetadata: function (a, r) { return '#/content/' + encodeURIComponent(a) + '/item/' + encodeURIComponent(r) + '/metadata'; },
    mHelp: function (a) { return '#/content/' + encodeURIComponent(a) + '/help'; }
  };

  /* ---------------- status ----------------
     Never colour alone: every badge carries its text label and an icon. */
  function statusBadge(rec) {
    var m = state.contentStatusMeta(rec.status);
    return ui.badge(m.badge, m.icon, m.label);
  }

  function revisionChip(rec) {
    if (!rec.versionLabel && rec.revision <= 1) { return ''; }
    var bits = [];
    if (rec.versionLabel) { bits.push('v' + rec.versionLabel); }
    if (rec.revision > 1) { bits.push('revision ' + rec.revision); }
    return ' ' + ui.badge('b-outline', null, bits.join(' · '));
  }

  function resubmittedChip(rec) {
    return rec.resubmitted && rec.status !== state.CONTENT_STATUS.PUBLISHED
      ? ' ' + ui.badge('b-outline', 'arrowR', 'Resubmitted') : '';
  }

  /* Who the item is WITH — the first question each workspace asks.
     `audience` shifts the wording without changing the fact. */
  function holderLine(rec, audience) {
    /* For the VENDOR audience the line does double duty: it says where
       the item is AND what to do about it. After a role scope has been
       withdrawn the second half would be an instruction the build
       refuses, so it is replaced by the true one. Every other audience —
       the reviewer queue, the Content Library, the Super Admin surfaces
       — reads the wording below unchanged. */
    if (audience === 'vendor' && rec.createdBy && state.vendorScopeWithdrawn(rec, rec.createdBy)) {
      var SW = state.CONTENT_STATUS;
      if (rec.status === SW.DRAFT) { return 'With you — read-only, outside your assigned scope'; }
      if (rec.status === SW.CHANGES_ACADEMIC || rec.status === SW.CHANGES_CONTENT) {
        return 'Returned to you — read-only, outside your assigned scope';
      }
    }
    var S = state.CONTENT_STATUS;
    switch (rec.status) {
      case S.DRAFT:
        return audience === 'vendor' ? 'With you — not yet submitted' : 'With the Vendor (draft)';
      case S.ACADEMIC_REVIEW:
        return audience === 'reviewer' ? 'With you — awaiting your academic decision' : 'With the Academic Reviewer';
      case S.CHANGES_ACADEMIC:
        return audience === 'vendor' ? 'With you — correct and resubmit' : 'Returned to the Vendor for correction';
      case S.CONTENT_REVIEW:
        return audience === 'manager' ? 'With you — awaiting the publication decision' : 'With the Content Manager';
      case S.CHANGES_CONTENT:
        return audience === 'vendor' ? 'With you — correct and resubmit' : 'Returned to the Vendor for correction';
      /* 07.3 — the Content Manager's ACADEMIC return. Without this case
         the switch fell through to `return ''`, and every screen that
         concatenates this line around the new status rendered a hole
         mid-sentence ("...not while it is “Returned for academic
         re-check” and . Editing it now would..."). */
      case S.CHANGES_ACADEMIC_RECHECK:
        return audience === 'reviewer'
          ? 'With you — the Content Manager returned it for an academic re-check'
          : (audience === 'manager'
            ? 'Returned by you to the Academic Reviewer'
            : 'With the Academic Reviewer (returned by the Content Manager)');
      case S.PUBLISHED:
        return rec.publication ? 'Published ' + util.fmtDate(rec.publication.publishedAt) : 'Published';
      default:
        return '';
    }
  }

  function contextLine(rec) {
    var ctx = state.contentContext(rec);
    if (!ctx || !ctx.course) { return '<span class="muted">Course not resolved</span>'; }
    return esc(ctx.grouping ? ctx.grouping.name : '—') + ' › ' + esc(ctx.course.name);
  }

  /* ---------------- the production chain, as a stepper ----------------
     Implementation 08. All three workspaces were describing the same
     four-step chain in prose, each in their own words, on their own
     screen. One renderer, so a Vendor, an Academic Reviewer and a
     Content Manager reading the same Experiment see the same picture of
     where it has got to.

     IT REPORTS, IT NEVER DECIDES. Every state below is derived from
     `rec.status` alone — the single fact `holderLine()` and the status
     badge are already derived from — so the stepper can never claim a
     hand-off the workflow has not made. `ui.track` names each step's
     state in its own text as well as its colour. */
  function productionTrack(rec) {
    var S = state.CONTENT_STATUS;
    var s = rec.status;
    var done = 'done', live = 'live', todo = 'todo', blocked = 'blocked';
    var submitted = s !== S.DRAFT ? done : live;
    var academic = todo, readiness = todo, published = todo;

    if (s === S.DRAFT) { submitted = live; }
    else if (s === S.ACADEMIC_REVIEW) { academic = live; }
    else if (s === S.CHANGES_ACADEMIC) { submitted = blocked; }
    else if (s === S.CHANGES_ACADEMIC_RECHECK) { academic = live; }
    else if (s === S.CONTENT_REVIEW) { academic = done; readiness = live; }
    else if (s === S.CHANGES_CONTENT) { academic = done; readiness = blocked; }
    else if (s === S.PUBLISHED) { academic = done; readiness = done; published = done; }

    return ui.track([
      { t: 'Vendor submission',
        d: s === S.DRAFT ? 'Draft — not yet submitted'
          : (s === S.CHANGES_ACADEMIC || s === S.CHANGES_CONTENT)
            ? 'Returned to the Vendor to correct'
            : 'Submitted by the Vendor',
        state: submitted },
      { t: 'Academic review',
        d: s === S.CHANGES_ACADEMIC_RECHECK ? 'Returned for an academic re-check'
          : rec.academicReview ? 'Approved by ' + rec.academicReview.reviewerName
          : 'Learning Outcomes and academic alignment',
        state: academic },
      { t: 'Content readiness',
        d: s === S.CHANGES_CONTENT ? 'Returned by the Content Manager'
          : 'Canonical metadata and technical delivery',
        state: readiness },
      { t: 'Published',
        d: s === S.PUBLISHED
          ? 'First publication by the Content Manager'
          : 'First publication — the Content Manager’s alone',
        state: published }
    ]);
  }

  /* ---------------- why an item came back ----------------
     Implementation 08. A submission can be returned at EITHER gate, and
     the two were being surfaced asymmetrically: the academic return
     showed its reason on the Vendor's list, the content-readiness one
     showed nothing at all, even though the reason was on the record and
     was rendered on the detail page.

     One accessor for both. The newest `changes` history entry is the
     return being served — the state layer writes the reason, the actor
     and any supporting references onto it whichever gate produced it —
     so this reads that rather than the academic review record, which
     only ever covers one of the two. Returns null when nothing came
     back, so a caller can render one block or none. */
  function returnReason(rec) {
    var S = state.CONTENT_STATUS;
    if (!rec || (rec.status !== S.CHANGES_ACADEMIC && rec.status !== S.CHANGES_CONTENT &&
                 rec.status !== S.CHANGES_ACADEMIC_RECHECK)) { return null; }
    var h = (rec.history || []).filter(function (x) { return x.kind === 'changes'; })[0];
    if (!h) { return null; }
    return {
      who: h.actorName || (rec.status === S.CHANGES_ACADEMIC ? 'Academic Reviewer' : 'Content Manager'),
      role: h.actorRole || (rec.status === S.CHANGES_ACADEMIC ? 'Academic Reviewer' : 'Content Manager'),
      at: h.at,
      text: h.note || '',
      refs: h.refs || []
    };
  }

  /* The compact rendering of the above, for a card or a list row. */
  function returnReasonHTML(rec) {
    var r = returnReason(rec);
    if (!r) { return ''; }
    return '<div class="retbox">' + ui.ic('alert', 'sm') +
      '<div><strong>' + esc(r.who) + ' · ' + esc(r.role) + '</strong>' +
      (r.text ? '<p>' + esc(r.text) + '</p>'
              : '<p>No reason text was recorded with this return.</p>') +
      '</div></div>';
  }

  /* ---------------- learning outcomes ----------------
     Academically owned (STK31-08). Rendered read-only everywhere except
     the Academic Review screen, which owns the editor. */
  function outcomesList(outcomes, emptyText) {
    if (!outcomes || !outcomes.length) {
      return '<p class="muted">' + esc(emptyText ||
        'No Learning Outcomes have been recorded yet. They are authored by the Academic Reviewer.') + '</p>';
    }
    return '<ol class="outcomelist ordered">' + outcomes.map(function (o) {
      return '<li>' + ui.ic('check') + '<span>' + esc(o) + '</span></li>';
    }).join('') + '</ol>';
  }

  /* ---------------- technology delivery ----------------
     AR / VR / MR are an authorised PACKAGE; Web / WebGL is a HOSTED
     link (STK31-37). The two therefore show different fields, and a
     field is never asked of a technology that does not use it. */
  /* The delivery TARGET of each technology, in the words the runtime
     contract uses. Not a new model — a restatement of `TECHNOLOGIES`
     in terms of what a reviewer or a Content Manager would have to
     have in front of them to run it. */
  var RUNTIME_TARGET = {
    web: 'A hosted browser experience. It opens in this browser, and can be inspected from here.',
    ar:  'A mobile / native AR runtime. It runs in an AR application on a supported phone or tablet, ' +
         'and cannot be executed in a browser.',
    vr:  'A VR headset / native runtime. It runs in a headset application on a supported device, ' +
         'and cannot be executed in a browser.',
    mr:  'An MR device / native runtime. It runs in an application on supported MR hardware, ' +
         'and cannot be executed in a browser.'
  };

  function deliveryRows(rec) {
    if (!rec.technologies.length) {
      return '<p class="muted">No technology variant has been selected for this experiment yet.</p>';
    }
    return '<div class="techrows deliv">' + data.sortTech(rec.technologies).map(function (t) {
      var def = data.TECHNOLOGIES[t];
      var d = state.deliveryOf(rec, t);
      var lines = [];
      if (def.delivery === 'hosted') {
        lines.push(kvLine('Hosted URL', d.url
          ? '<span class="mono brk">' + esc(d.url) + '</span>'
          : '<span class="muted">Not supplied</span>'));
      } else {
        lines.push(kvLine('Package label', d.packageLabel ? esc(d.packageLabel) : '<span class="muted">Not supplied</span>'));
        lines.push(kvLine('Package reference', d.packageRef
          ? '<span class="mono">' + esc(d.packageRef) + '</span>'
          : '<span class="muted">Not supplied</span>'));
        if (d.packageFile && d.packageFile.name) {
          /* HONEST, AND SHORT. The name and size are all the browser
             handed over — the bytes were never read and this prototype
             has no server to send them to. Said once, here, next to the
             value it qualifies, rather than as a paragraph. */
          lines.push(kvLine('Selected file', '<span class="mono brk">' + esc(d.packageFile.name) + '</span>' +
            (d.packageFile.size ? ' <span class="muted">(' + esc(d.packageFile.size) + ')</span>' : '') +
            '<span class="dnote">' + ui.ic('info', 'sm') +
            'File name and size only — no binary was uploaded.</span>'));
        }
        if (d.install) { lines.push(kvLine('Installation / access notes', esc(d.install))); }
      }
      lines.push(kvLine('Device / runtime requirement', d.runtime
        ? esc(d.runtime) : '<span class="muted">Not supplied</span>'));
      if (d.notes) { lines.push(kvLine('Technical notes', esc(d.notes))); }
      /* ── Implementation 09 — WHERE THIS ACTUALLY RUNS ────────────
         PM-08 asked how a reviewer tests AR or VR content. The honest
         first step is to stop leaving the delivery TARGET implicit: a
         hosted link opens in the browser the reviewer is already using,
         and a package reference does not open anywhere in this build,
         because running it needs the device application that is the
         subject of RUNTIME_INTEGRATION_CONTRACT.md.

         Stated per technology, from the technology's own definition, so
         it cannot drift from the delivery model it describes. */
      /* ⚠ NOT UNCONDITIONAL. The Web sentence promises the reviewer
         that the experience "opens in this browser, and can be
         inspected from here" — which is false on a record whose hosted
         URL has not been supplied, two lines above a field that says
         "Not supplied". A record with nothing recorded says so. */
      lines.push(kvLine('Where it runs', esc(
        (def.delivery === 'hosted' && !d.url)
          ? 'A hosted browser experience. No link has been supplied yet, so there is nothing to open.'
          : (RUNTIME_TARGET[t] || def.device))));
      return '<div class="tr-block">' +
        '<div class="tr-h">' + ui.fmtBadge(t) + '<span class="tr-n">' + esc(def.name) + '</span>' +
        '<span class="tr-d">' + esc(def.deliveryLabel) + '</span></div>' +
        '<div class="kv">' + lines.join('') + '</div>' +
        '</div>';
    }).join('') + '</div>';
  }

  function kvLine(k, vHTML) {
    return '<div class="k">' + esc(k) + '</div><div class="v">' + vHTML + '</div>';
  }

  function documentsList(docs) {
    if (!docs || !docs.length) {
      return '<p class="muted">No supporting documentation has been recorded for this submission.</p>';
    }
    return '<ul class="reslist plain">' + docs.map(function (d) {
      return '<li>' + ui.ic('doc') + '<span>' + esc(d.name) +
        (d.size ? ' <span class="muted">— ' + esc(d.size) + '</span>' : '') + '</span></li>';
    }).join('') + '</ul>' +
      '<p class="dnote">' + ui.ic('info', 'sm') +
      'File name and size only — no document was uploaded.</p>';
  }

  /* ---------------- history ----------------
     Enough to answer: who created and submitted it, when, who reviewed
     it academically and what they decided, who published it and when,
     at which version. Not an enterprise audit log. */
  var HISTORY_DOT = {
    created: 'edit', submitted: 'arrowR', resubmitted: 'arrowR',
    changes: 'alert', approved: 'check', published: 'check',
    metadata: 'edit', seeded: 'layers',
    /* Implementation 07.2 — a platform override reads AS an override in
       every timeline, not as an ordinary step somebody took. */
    override: 'shield',
    /* 07.3 — a Content Manager delivery-link edit. It is a change to
       what a Student will open, so it does not read as an ordinary
       metadata tweak. */
    delivery: 'monitor'
  };

  function historyTimeline(rec) {
    if (!rec.history || !rec.history.length) {
      return '<p class="muted">No history has been recorded for this item.</p>';
    }
    return '<div class="timeline">' + rec.history.map(function (h) {
      var cls = (h.kind === 'changes' || h.kind === 'override') ? 'warn'
              : (h.kind === 'published' || h.kind === 'approved') ? 'good' : 'info';
      return '<div class="tl-item"><span class="tl-dot ' + cls + '">' +
        ui.ic(HISTORY_DOT[h.kind] || 'circle') + '</span>' +
        '<div class="tl-body"><div class="tl-action">' + esc(h.label) + '</div>' +
        '<div class="tl-who">' +
        /* The role is optional: a platform action has an actor NAME but no
           content role, and printing an empty one left a stray "· ·". */
        (h.actorName ? esc(h.actorName) + ' · ' : '') +
        (h.actorName && h.actorRole ? esc(h.actorRole) + ' · ' : '') +
        esc(util.fmtDateTime(h.at)) + '</div>' +
        (h.note ? '<p class="tl-note">' + esc(h.note) + '</p>' : '') +
        /* 07.3 — supporting references travel WITH the entry that carries
           them. Rendering them only in a dedicated card meant a reviewer
           reading the history saw the reason and not the evidence that
           came with it. `refsHTML` returns '' for an empty list, so an
           entry without references is unchanged. */
        refsHTML(h.refs, { title: 'Supporting references' }) +
        '</div></div>';
    }).join('') + '</div>';
  }

  /* ---------------- readiness ----------------
     A gap is shown as a gap, never as a disabled control with no
     explanation. Every blocker names the thing that is missing. */
  function readinessCard(readiness, okTitle, okBody, blockTitle) {
    if (readiness.ok) {
      return ui.alertBox('success', okTitle, '<p>' + esc(okBody) + '</p>');
    }
    return ui.alertBox('warning', blockTitle,
      '<ul class="blocklist">' + readiness.blockers.map(function (b) {
        return '<li>' + esc(b) + '</li>';
      }).join('') + '</ul>');
  }

  /* The academic decision as the Content Manager and the Vendor read
     it. `showComment` is false on any surface where the reviewer's
     internal comment should not be repeated. */
  function academicDecisionCard(rec, showComment) {
    if (!rec.academicReview) {
      return ui.alertBox('info', 'No academic approval recorded',
        '<p>This item has not completed academic validation. It cannot be published.</p>');
    }
    var r = rec.academicReview;
    return '<div class="kv">' +
      kvLine('Decision', ui.badge('b-success', 'check', 'Academically approved')) +
      kvLine('Academic Reviewer', esc(r.reviewerName)) +
      kvLine('Decided', esc(util.fmtDateTime(r.at))) +
      kvLine('Submission revision reviewed', esc(String(r.revision))) +
      (showComment && r.comment ? kvLine('Reviewer comment', esc(r.comment)) : '') +
      '</div>';
  }

  /* The publication record, as read after the fact. */
  function publicationCard(rec) {
    var p = rec.publication;
    if (!p) { return '<p class="muted">This experiment has not been published.</p>'; }
    if (p.origin === 'seed') {
      /* Provenance, not status — so it is a line of text with an icon
         rather than a badge. A pill cannot wrap, and this phrase is
         longer than the value column of a narrow rail card. */
      /* The seed branch carried the same ambiguity as the one below:
         a bare "Version" beside a header showing the CURRENT version
         reads as a contradiction the moment a release moves them
         apart. Both are labelled. */
      return '<div class="kv">' +
        kvLine('Publication origin',
          '<span class="provline">' + ui.ic('layers', 'sm') + 'Existing published content</span>') +
        kvLine('First recorded', esc(util.fmtDate(p.publishedAt))) +
        kvLine('First recorded version', esc(p.versionLabel)) +
        kvLine('Current public version', rec.versionLabel
          ? '<strong>' + esc(rec.versionLabel) + '</strong>' +
            (String(rec.versionLabel) !== String(p.versionLabel || '')
              ? '<span class="dnote">' + ui.ic('info', 'sm') +
                'A later version has been released since. The first record above is unchanged.</span>'
              : '')
          : '<span class="muted">—</span>') +
        '</div>' +
        '<p class="dnote">' + ui.ic('info', 'sm') +
        'This experiment was already in the published catalogue when the content production workflow was ' +
        'integrated. No Vendor submission or review history is claimed for it.</p>';
    }
    /* ⚠ "Version 1.0" UNDER A CARD HEADED "Publication record", ON A
       PAGE WHOSE TITLE SAID "Published · v1.1" — Implementation 09 QA.

       Both were correct and together they read as a contradiction.
       This card is the record of the FIRST publication, and 1.0 is the
       version that was first published; the header shows the version
       the public sees NOW, which a Super Admin release has since moved
       on. Neither number is wrong, and neither is rewritten here.

       What was wrong was the labels. Every field now says which of the
       two it is, and where they differ the current version is named on
       the same card so a reader never has to reconcile it against the
       page title. */
    var current = String(rec.versionLabel || '');
    var first = String(p.versionLabel || '');
    return '<div class="kv">' +
      kvLine('Published by', esc(p.publishedByName) + ' <span class="muted">· Content Manager</span>') +
      kvLine('First published', esc(util.fmtDateTime(p.publishedAt))) +
      kvLine('First published version', esc(first)) +
      kvLine('Current public version', current
        ? '<strong>' + esc(current) + '</strong>' +
          (current !== first
            ? '<span class="dnote">' + ui.ic('info', 'sm') +
              'A later version has been released since. The first publication above is unchanged.</span>'
            : '')
        : '<span class="muted">—</span>') +
      kvLine('Submission revision published', esc(String(p.revision))) +
      kvLine('Technologies published', ui.techBadges(p.technologies)) +
      kvLine('Learning Outcomes published', String(p.outcomes.length)) +
      (p.academicReviewerName ? kvLine('Academic validation', esc(p.academicReviewerName)) : '') +
      '</div>';
  }

  /* The one place the Publish / Release firewall is explained, so the
     wording is identical wherever it is shown (STK31-06 / STK31-07). */
  /* Implementation 06 built the later-version lifecycle, so this note
     now points AT it instead of recording it as absent. The firewall is
     unchanged and is the whole point of the note: publication and
     release are different decisions, on different objects, owned by
     different roles. */
  function publishedNextVersionNote(opts) {
    opts = opts || {};
    return ui.alertBox('info', 'A later version is a different decision',
      '<p>This experiment is published. Replacing it with a newer version is a separate ' +
      '<strong>Release / Hold</strong> decision owned by the <strong>Super Admin</strong>, on a different ' +
      'object. Nothing on a first-publication surface can change the published version.</p>' +
      (opts.proposeHref
        ? '<p style="margin-top:8px">You can propose a later version. It goes to academic review, and then to ' +
          'the Super Admin — the catalogue keeps showing the current version until that decision is taken.</p>' +
          '<p style="margin-top:8px"><a class="btn sec sm" href="' + opts.proposeHref + '">' +
          esc(opts.proposeLabel || 'Propose a later version') + '</a></p>'
        : ''));
  }

  /* ---------------- prototype role selector ----------------
     A PROTOTYPE VIEW SWITCH over the REAL sample content actors that
     exist in prototype state — never a fabricated identity, and never a
     grant: scope still comes from the seeded role assignments. */
  function actorSelector(role, shown, id, label) {
    var actors = state.contentActors(role);
    if (!actors.length) { return ''; }
    var chosen = shown || null;
    return '<label for="' + id + '">' + esc(label) +
      '<select id="' + id + '">' +
      '<option value="">&mdash; choose &mdash;</option>' +
      actors.map(function (a) {
        return '<option value="' + esc(a.id) + '"' + (chosen && chosen.id === a.id ? ' selected' : '') + '>' +
          esc(a.name + ' — ' + a.organisation) + '</option>';
      }).join('') +
      '</select></label>';
  }

  /* The chooser screen each of the three workspaces shows when no
     prototype identity has been picked yet. */
  function chooserScreen(role, opts) {
    var actors = state.contentActors(role);
    var rows = actors.map(function (a) {
      /* `actorScopeText` rather than a Course list: an Experiment-scope
         assignment names ONE Experiment (STK31-41), and rendering it as
         its Course told the reader the person held the whole Course. */
      var scopeText = state.actorScopeText(a.id);
      return '<tr>' +
        '<td data-label="Name"><strong>' + esc(a.name) + '</strong><div class="muted">' + esc(a.email) + '</div></td>' +
        '<td data-label="Organisation">' + esc(a.organisation) + '</td>' +
        '<td data-label="Assigned scope">' + esc(scopeText) + '</td>' +
        '<td class="cell-actions"><button class="btn sec sm" type="button" data-actor="' + esc(a.id) + '">' +
        esc(opts.actionLabel) + '</button></td>' +
        '</tr>';
    }).join('');

    /* PROTOTYPE CHROME, and it reads as chrome. A stakeholder must not
       mistake this table for a sign-in, so the note stays — but as one
       sentence rather than a paragraph. What it used to spell out (reach
       comes from the Super Admin's per-Course and per-Experiment role
       assignments, never from this picker) is the product's own rule and
       is stated on the scope card of every workspace behind it. */
    return ui.phead(opts.title, opts.metaHTML || '') +
      ui.protoNote('<strong>Prototype view switch, not a sign-in.</strong> Choosing an identity grants ' +
        'nothing — reach comes from the role assignments the Super Admin holds.') +
      '<div class="tablecard" style="margin-top:16px">' +
      '<div class="tscroll"><table class="dt">' +
      '<caption class="sr-only">' + esc(opts.title) + ' — sample identities</caption>' +
      '<thead><tr><th scope="col">Name</th><th scope="col">Organisation</th>' +
      '<th scope="col">Assigned scope</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div></div>';
  }

  /* ---------------- filter bar ----------------
     Only statuses that actually occur in the supplied rows are offered,
     so no filter exists whose data does not exist. */
  function statusFilterOptions(rows, current) {
    var seen = {};
    rows.forEach(function (r) { seen[r.status] = true; });
    /* 07.3 — CHANGES_ACADEMIC_RECHECK joins the list. Without it a
       screen could not filter to the status the Content Manager's
       academic return produces, even though `matchesFilters()` and
       `normaliseFilters()` already handled it. */
    var order = ['DRAFT', 'ACADEMIC_REVIEW', 'CHANGES_ACADEMIC', 'CONTENT_REVIEW', 'CHANGES_CONTENT',
                 'CHANGES_ACADEMIC_RECHECK', 'PUBLISHED'];
    var opts = '<option value="all"' + (current === 'all' ? ' selected' : '') + '>Status: all</option>';
    order.forEach(function (k) {
      if (!seen[k]) { return; }
      var m = state.contentStatusMeta(k);
      var label = m.label + (k === 'CHANGES_ACADEMIC' ? ' — academic'
        : k === 'CHANGES_CONTENT' ? ' — content readiness'
        : k === 'CHANGES_ACADEMIC_RECHECK' ? ' — returned to the reviewer' : '');
      opts += '<option value="' + k + '"' + (current === k ? ' selected' : '') + '>' + esc(label) + '</option>';
    });
    return opts;
  }

  function techFilterOptions(rows, current) {
    var seen = {};
    rows.forEach(function (r) { r.technologies.forEach(function (t) { seen[t] = true; }); });
    var opts = '<option value="all"' + (current === 'all' ? ' selected' : '') + '>Technology: all</option>';
    data.TECH_ORDER.forEach(function (t) {
      if (!seen[t]) { return; }
      opts += '<option value="' + t + '"' + (current === t ? ' selected' : '') + '>' +
        esc(data.TECHNOLOGIES[t].label) + '</option>';
    });
    return opts;
  }

  function courseFilterOptions(rows, current) {
    var seen = {};
    rows.forEach(function (r) { seen[r.courseId] = true; });
    var opts = '<option value="all"' + (current === 'all' ? ' selected' : '') + '>Course: all</option>';
    data.courses().forEach(function (c) {
      if (!seen[c.id]) { return; }
      var g = data.grouping(c.groupingId);
      opts += '<option value="' + esc(c.id) + '"' + (current === c.id ? ' selected' : '') + '>' +
        esc((g ? g.name + ' › ' : '') + c.name) + '</option>';
    });
    return opts;
  }

  /* Screen-local filter state survives navigation, but the values a list
     can offer do not: publish the last DRAFT and "Status: draft" stops
     existing. Left alone, the select would fall back to showing
     "Status: all" while the stale value still filtered every row out —
     an empty list with no visible cause and no way to clear it. Called
     before the options are built, so the control and the filter always
     agree. */
  function normaliseFilters(rows, f) {
    if (f.status && f.status !== 'all' &&
        !rows.some(function (r) { return r.status === f.status; })) { f.status = 'all'; }
    if (f.course && f.course !== 'all' &&
        !rows.some(function (r) { return r.courseId === f.course; })) { f.course = 'all'; }
    if (f.tech && f.tech !== 'all' &&
        !rows.some(function (r) { return r.technologies.indexOf(f.tech) !== -1; })) { f.tech = 'all'; }
    return f;
  }

  function matchesFilters(rec, f) {
    if (f.status && f.status !== 'all' && rec.status !== f.status) { return false; }
    if (f.course && f.course !== 'all' && rec.courseId !== f.course) { return false; }
    if (f.tech && f.tech !== 'all' && rec.technologies.indexOf(f.tech) === -1) { return false; }
    if (f.q && f.q.trim()) {
      var ctx = state.contentContext(rec);
      var hay = (rec.name + ' ' + rec.summary + ' ' +
        (ctx && ctx.course ? ctx.course.name : '') + ' ' +
        (ctx && ctx.grouping ? ctx.grouping.name : '')).toLowerCase();
      if (hay.indexOf(f.q.trim().toLowerCase()) === -1) { return false; }
    }
    return true;
  }

  /* ---------------- metric tiles ---------------- */
  function statTile(value, label, note) {
    return '<div class="stat"><div class="s-v">' + esc(String(value)) + '</div>' +
      '<div class="s-l">' + esc(label) + '</div>' +
      (note ? '<div class="s-n">' + esc(note) + '</div>' : '') + '</div>';
  }

  /* ---------------- shared record summary ---------------- */
  function recordSummaryKV(rec, opts) {
    var o = opts || {};
    var ctx = state.contentContext(rec);
    var creator = rec.createdBy ? state.contentActor(rec.createdBy) : null;
    return '<div class="kv">' +
      kvLine('Programme / Department', ctx && ctx.grouping ? esc(ctx.grouping.name) : '<span class="muted">—</span>') +
      kvLine('Course', ctx && ctx.course ? esc(ctx.course.name) : '<span class="muted">—</span>') +
      kvLine('Catalogue summary', rec.summary ? esc(rec.summary) : '<span class="muted">Not supplied</span>') +
      kvLine('Description', rec.description ? esc(rec.description) : '<span class="muted">Not supplied</span>') +
      kvLine('Technologies', rec.technologies.length
        ? ui.techBadges(rec.technologies) : '<span class="muted">None selected</span>') +
      kvLine('Version', rec.versionLabel ? esc(rec.versionLabel) : '<span class="muted">Not supplied</span>') +
      kvLine('Submission revision', esc(String(rec.revision))) +
      (o.showVendor !== false
        ? kvLine('Vendor', creator
            ? esc(creator.name) + ' <span class="muted">· ' + esc(creator.organisation) + '</span>'
            : '<span class="muted">Existing published content — no Vendor submission</span>')
        : '') +
      kvLine('Submitted', rec.submittedAt ? esc(util.fmtDateTime(rec.submittedAt)) : '<span class="muted">Not submitted</span>') +
      (o.showVendorNotes && rec.vendorNotes
        ? kvLine('Vendor technical notes', esc(rec.vendorNotes)) : '') +
      '</div>';
  }

  /* ============================================================
     07.3 SHARED RENDERERS — supporting references and preview video.

     One implementation each, used by the Vendor, the Academic Reviewer,
     the Content Manager and the public catalogue, so the same object can
     never be described two different ways on two screens.
     ============================================================ */

  /* ⚠ THE HONESTY LINE. A `file` reference holds the browser-reported
     NAME and SIZE of a file somebody picked. The bytes were never read
     and nothing was uploaded — this prototype has no server. Every
     rendering says so; none of them offers a download that cannot work. */
  /* Belt-and-braces at RENDER time. Every write path already refuses a
     non-http(s) URL, but these two renderers put a stored value straight
     into an href on surfaces that include the pre-sign-in public page, so
     they re-check rather than trusting the gate upstream. */
  function safeHttpUrl(u) {
    return /^https?:\/\//i.test(String(u == null ? '' : u)) ? String(u) : null;
  }

  function refsHTML(refs, opts) {
    var o = opts || {};
    var list = Array.isArray(refs) ? refs : [];
    if (!list.length) { return o.emptyHTML || ''; }
    var anyFile = list.some(function (r) { return r.kind === 'file'; });
    return '<div class="refs">' +
      (o.title ? '<span class="an-k">' + esc(o.title) + '</span>' : '') +
      '<ul class="reflist">' + list.map(function (r) {
        if (r.kind === 'file') {
          return '<li>' + ui.ic('doc', 'sm') +
            '<span class="rf-n">' + esc(r.label || r.fileName) + '</span>' +
            '<span class="rf-m">file reference' +
            (r.fileSize != null ? ' · ' + util.fmtBytes(r.fileSize) : '') + '</span>' +
            (r.note ? '<span class="rf-note">' + esc(r.note) + '</span>' : '') +
            '</li>';
        }
        var href = safeHttpUrl(r.url);
        return '<li>' + ui.ic('arrowR', 'sm') +
          (href
            ? '<a class="rf-n" href="' + esc(href) + '" target="_blank" rel="noopener noreferrer">' +
              esc(r.label || r.url) + '</a>'
            : '<span class="rf-n">' + esc(r.label || r.url) + '</span>') +
          '<span class="rf-m">link</span>' +
          (r.note ? '<span class="rf-note">' + esc(r.note) + '</span>' : '') +
          '</li>';
      }).join('') + '</ul>' +
      (anyFile
        ? '<p class="rf-warn">' + ui.ic('info', 'sm') +
          'A file reference records the file&rsquo;s <strong>name and size only</strong>. ' +
          'This prototype has no server, so nothing was uploaded and the file itself cannot be opened here.</p>'
        : '') +
      '</div>';
  }

  /* The editor. `prefix` namespaces the ids so two of these can coexist. */
  function refsEditorHTML(prefix, opts) {
    var o = opts || {};
    return '<fieldset class="refed">' +
      '<legend>' + esc(o.legend || 'Supporting references (optional)') + '</legend>' +
      '<p class="fhint">' + esc(o.hint ||
        'Point to a document, screenshot or reference that explains the change you are asking for.') + '</p>' +
      '<label for="' + prefix + '-refurl">Reference link' +
      '<input type="url" id="' + prefix + '-refurl" placeholder="https://…">' +
      '</label>' +
      '<label for="' + prefix + '-reflabel">What it is' +
      '<input type="text" id="' + prefix + '-reflabel" placeholder="e.g. Annotated screenshot of the broken step">' +
      '</label>' +
      '<label for="' + prefix + '-reffile">Or point at a file on this machine' +
      '<input type="file" id="' + prefix + '-reffile">' +
      '</label>' +
      /* ⚠ THE HONESTY LINE, kept at the picker it qualifies. This
         prototype has no server: choosing a file records its name and
         size and nothing else. Shortened, never removed — a build that
         quietly implied it had the file would be claiming an
         integration it does not have. */
      '<p class="fhint">' + ui.ic('info', 'sm') +
      '<strong>Nothing is uploaded</strong> — the file&rsquo;s name and size are recorded so the recipient ' +
      'knows what to ask you for.</p>' +
      '</fieldset>';
  }

  /* Reads whatever the editor above holds, in the shape the state layer
     normalises. Returns [] when nothing was supplied — never null. */
  function readRefs(prefix) {
    var out = [];
    var url = document.getElementById(prefix + '-refurl');
    var lab = document.getElementById(prefix + '-reflabel');
    var f = document.getElementById(prefix + '-reffile');
    var label = lab && lab.value ? lab.value.trim() : '';
    if (url && url.value && url.value.trim()) {
      out.push({ kind: 'link', url: url.value.trim(), label: label });
    }
    if (f && f.files && f.files.length) {
      out.push({ kind: 'file', fileName: f.files[0].name, fileSize: f.files[0].size, label: label });
    }
    return out;
  }

  /* The preview / demo video. `rec.previewVideo` is a URL reference the
     Vendor supplied. `o.publicView` renders the visitor-facing block. */
  function previewVideoHTML(rec, o) {
    var opts = o || {};
    var v = rec && rec.previewVideo;
    if (!v || !v.url) {
      return opts.emptyHTML === undefined
        ? '<p class="muted">No preview video has been supplied for this experiment.</p>'
        : opts.emptyHTML;
    }
    var pvHref = safeHttpUrl(v.url);
    if (!pvHref) {
      /* Stored value is not an http(s) URL, so it is not offered as a
         link on a public page. The write path already refuses this. */
      return opts.emptyHTML === undefined
        ? '<p class="muted">No preview video has been supplied for this experiment.</p>'
        : opts.emptyHTML;
    }
    return '<div class="pvid">' +
      ui.ic('play', 'sm') +
      '<a class="pv-l" href="' + esc(pvHref) + '" target="_blank" rel="noopener noreferrer">' +
      esc(v.label || 'Preview / demo video') + '</a>' +
      (v.note ? '<span class="pv-n">' + esc(v.note) + '</span>' : '') +
      (opts.publicView ? '' :
        '<span class="pv-m">Supplied by the Vendor' +
        (v.addedAt ? ' · ' + esc(util.fmtDate(v.addedAt)) : '') +
        ' · a link reference, not an upload</span>') +
      '</div>';
  }

  return {
    href: href,
    refsHTML: refsHTML, refsEditorHTML: refsEditorHTML, readRefs: readRefs,
    previewVideoHTML: previewVideoHTML,
    statusBadge: statusBadge, revisionChip: revisionChip, resubmittedChip: resubmittedChip,
    holderLine: holderLine, contextLine: contextLine,
    productionTrack: productionTrack, returnReason: returnReason, returnReasonHTML: returnReasonHTML,
    outcomesList: outcomesList, deliveryRows: deliveryRows, documentsList: documentsList,
    /* Implementation 09 — the delivery target per technology. */
    RUNTIME_TARGET: RUNTIME_TARGET,
    historyTimeline: historyTimeline, readinessCard: readinessCard,
    academicDecisionCard: academicDecisionCard, publicationCard: publicationCard,
    publishedNextVersionNote: publishedNextVersionNote,
    actorSelector: actorSelector, chooserScreen: chooserScreen,
    normaliseFilters: normaliseFilters,
    statusFilterOptions: statusFilterOptions, techFilterOptions: techFilterOptions,
    courseFilterOptions: courseFilterOptions, matchesFilters: matchesFilters,
    statTile: statTile, recordSummaryKV: recordSummaryKV, kvLine: kvLine
  };
})();
