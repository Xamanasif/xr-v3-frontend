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

    reviewerHome: function () { return '#/review'; },
    rOverview: function (a) { return '#/review/' + encodeURIComponent(a) + '/overview'; },
    rQueue: function (a) { return '#/review/' + encodeURIComponent(a) + '/queue'; },
    rRecord: function (a, r) { return '#/review/' + encodeURIComponent(a) + '/submission/' + encodeURIComponent(r); },

    managerHome: function () { return '#/content'; },
    mOverview: function (a) { return '#/content/' + encodeURIComponent(a) + '/overview'; },
    mLibrary: function (a) { return '#/content/' + encodeURIComponent(a) + '/library'; },
    mQueue: function (a) { return '#/content/' + encodeURIComponent(a) + '/queue'; },
    mRecord: function (a, r) { return '#/content/' + encodeURIComponent(a) + '/item/' + encodeURIComponent(r); },
    mMetadata: function (a, r) { return '#/content/' + encodeURIComponent(a) + '/item/' + encodeURIComponent(r) + '/metadata'; }
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
          lines.push(kvLine('Selected file', '<span class="mono brk">' + esc(d.packageFile.name) + '</span>' +
            (d.packageFile.size ? ' <span class="muted">(' + esc(d.packageFile.size) + ')</span>' : '') +
            '<span class="dnote">' + ui.ic('info', 'sm') +
            'Prototype records package metadata only; no binary is uploaded or stored.</span>'));
        }
        if (d.install) { lines.push(kvLine('Installation / access notes', esc(d.install))); }
      }
      lines.push(kvLine('Device / runtime requirement', d.runtime
        ? esc(d.runtime) : '<span class="muted">Not supplied</span>'));
      if (d.notes) { lines.push(kvLine('Technical notes', esc(d.notes))); }
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
      'Prototype records document metadata only; no file is uploaded or stored.</p>';
  }

  /* ---------------- history ----------------
     Enough to answer: who created and submitted it, when, who reviewed
     it academically and what they decided, who published it and when,
     at which version. Not an enterprise audit log. */
  var HISTORY_DOT = {
    created: 'edit', submitted: 'arrowR', resubmitted: 'arrowR',
    changes: 'alert', approved: 'check', published: 'check',
    metadata: 'edit', seeded: 'layers'
  };

  function historyTimeline(rec) {
    if (!rec.history || !rec.history.length) {
      return '<p class="muted">No history has been recorded for this item.</p>';
    }
    return '<div class="timeline">' + rec.history.map(function (h) {
      var cls = (h.kind === 'changes') ? 'warn' : (h.kind === 'published' || h.kind === 'approved') ? 'good' : 'info';
      return '<div class="tl-item"><span class="tl-dot ' + cls + '">' +
        ui.ic(HISTORY_DOT[h.kind] || 'circle') + '</span>' +
        '<div class="tl-body"><div class="tl-action">' + esc(h.label) + '</div>' +
        '<div class="tl-who">' +
        (h.actorName ? esc(h.actorName) + ' · ' + esc(h.actorRole) + ' · ' : '') +
        esc(util.fmtDateTime(h.at)) + '</div>' +
        (h.note ? '<p class="tl-note">' + esc(h.note) + '</p>' : '') +
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
      return '<div class="kv">' +
        kvLine('Publication origin',
          '<span class="provline">' + ui.ic('layers', 'sm') + 'Existing published content</span>') +
        kvLine('Recorded', esc(util.fmtDate(p.publishedAt))) +
        kvLine('Version', esc(p.versionLabel)) +
        '</div>' +
        '<p class="dnote">' + ui.ic('info', 'sm') +
        'This experiment was already in the published catalogue when the content production workflow was ' +
        'integrated. No Vendor submission or review history is claimed for it.</p>';
    }
    return '<div class="kv">' +
      kvLine('Published by', esc(p.publishedByName) + ' <span class="muted">· Content Manager</span>') +
      kvLine('Published', esc(util.fmtDateTime(p.publishedAt))) +
      kvLine('Version', esc(p.versionLabel)) +
      kvLine('Submission revision published', esc(String(p.revision))) +
      kvLine('Technologies published', ui.techBadges(p.technologies)) +
      kvLine('Learning Outcomes published', String(p.outcomes.length)) +
      (p.academicReviewerName ? kvLine('Academic validation', esc(p.academicReviewerName)) : '') +
      '</div>';
  }

  /* The one place the Publish / Release firewall is explained, so the
     wording is identical wherever it is shown (STK31-06 / STK31-07). */
  function publishedNextVersionNote() {
    return ui.alertBox('info', 'A later version is a different decision',
      '<p>This experiment is published. Replacing it with a newer version is a separate ' +
      '<strong>Release / Hold</strong> decision owned by the Super Admin, on a different object — ' +
      'it is not part of first publication, and it is not built in this slice. ' +
      'Nothing here can change the published revision.</p>');
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
      var courses = state.actorCourseIds(a.id);
      var scopeText = state.actorHasPlatformScope(a.id)
        ? 'Platform-wide (all Courses)'
        : courses.map(function (cid) {
            var c = data.course(cid); return c ? c.name : cid;
          }).join(', ') || 'No assignment';
      return '<tr>' +
        '<td data-label="Name"><strong>' + esc(a.name) + '</strong><div class="muted">' + esc(a.email) + '</div></td>' +
        '<td data-label="Organisation">' + esc(a.organisation) + '</td>' +
        '<td data-label="Assigned scope">' + esc(scopeText) + '</td>' +
        '<td class="cell-actions"><button class="btn sec sm" type="button" data-actor="' + esc(a.id) + '">' +
        esc(opts.actionLabel) + '</button></td>' +
        '</tr>';
    }).join('');

    return ui.phead(opts.title, opts.metaHTML || '') +
      ui.protoNote('<strong>Prototype view switch — not authentication.</strong> ' +
        'Choosing an identity below grants nothing. What each person can reach comes only from the ' +
        'per-Course role assignments seeded in prototype state, standing in for the Super Admin role-governance ' +
        'screen that a later slice builds.') +
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
    var order = ['DRAFT', 'ACADEMIC_REVIEW', 'CHANGES_ACADEMIC', 'CONTENT_REVIEW', 'CHANGES_CONTENT', 'PUBLISHED'];
    var opts = '<option value="all"' + (current === 'all' ? ' selected' : '') + '>Status: all</option>';
    order.forEach(function (k) {
      if (!seen[k]) { return; }
      var m = state.contentStatusMeta(k);
      var label = m.label + (k === 'CHANGES_ACADEMIC' ? ' — academic'
        : k === 'CHANGES_CONTENT' ? ' — content readiness' : '');
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
    data.COURSES.forEach(function (c) {
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

  return {
    href: href,
    statusBadge: statusBadge, revisionChip: revisionChip, resubmittedChip: resubmittedChip,
    holderLine: holderLine, contextLine: contextLine,
    outcomesList: outcomesList, deliveryRows: deliveryRows, documentsList: documentsList,
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
