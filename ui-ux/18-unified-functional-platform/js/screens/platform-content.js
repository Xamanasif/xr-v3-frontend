/* ============================================================
   Unified Functional Platform — SUPER ADMIN workspace (part 2 of 3).

   Content governance: the canonical / master catalogue, and the
   later-version RELEASE / HOLD decision.

   ── THE TERMINOLOGY FIREWALL (STK31-06 / STK31-07) ───────────
   The word PUBLISH does not appear on this plane as an action, and
   there is no publish control anywhere in the Super Admin workspace:
   FIRST publication of a NEW Experiment belongs to the Content Manager
   and nobody else. What lives here is RELEASE / HOLD of a LATER
   VERSION of an ALREADY-PUBLISHED Experiment — a different action on a
   different object.

   ── WHAT A RELEASE DOES, AND DOES NOT DO ─────────────────────
   It changes the version the public catalogue shows, under the SAME
   experiment identity. It creates no tenant access, changes no licence
   quantity, creates no assignment, and cannot widen or narrow the
   technology variants a tenant already holds.

   ── CANONICAL / MASTER METADATA (STK31-09) ───────────────────
   Both the Content Manager and the Super Admin may manage canonical
   metadata. Learning Outcomes are NOT canonical metadata — they are
   academically owned (STK31-08) — and technology delivery is the
   Vendor's technical submission. Neither is editable from here.
   Tenant Admins may never redefine this catalogue (STK31-10).
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
  var P = XRSLP.platformUI;

  function versionBadge(v) {
    var m = state.versionStatusMeta(v.status);
    return ui.badge(m.badge, m.icon, m.label);
  }

  function recordStateBadge(rec) {
    var m = state.contentStatusMeta(rec.status);
    return ui.badge(m.badge, m.icon, m.label);
  }

  /* ============================================================
     CONTENT — the canonical catalogue, with the version decisions
     that are waiting at the top of it.
     ============================================================ */
  XRSLP.screens.platformContent = function () {
    var awaiting = state.versionsAwaitingDecision();
    var held = state.versionsOnHold();

    var decisionItems = awaiting.map(function (v) {
      var rec = state.contentRecord(v.recordId);
      return {
        tone: 'warn', icon: 'layers',
        title: (rec ? rec.name : v.recordId) + ' — version ' + v.versionLabel,
        body: 'Academically approved' +
          (v.academicDecisionByName ? ' by ' + esc(v.academicDecisionByName) : '') +
          (v.academicDecisionAt ? ' on ' + esc(util.fmtDate(v.academicDecisionAt)) : '') +
          '. The published version <strong>' + esc(v.replacesVersionLabel || '—') +
          '</strong> stays live until you release this one.',
        href: P.href.record(v.recordId), label: 'Release / Hold',
        aria: 'Open the Release or Hold decision for version ' + v.versionLabel +
          ' of ' + (rec ? rec.name : v.recordId)
      };
    });
    held.forEach(function (v) {
      var rec = state.contentRecord(v.recordId);
      decisionItems.push({
        tone: 'info', icon: 'minus',
        title: (rec ? rec.name : v.recordId) + ' — version ' + v.versionLabel + ' is on hold',
        body: 'The published version <strong>' + esc(rec ? (rec.versionLabel || '—') : '—') +
          '</strong> remains live. The hold can be lifted at any time.',
        href: P.href.record(v.recordId), label: 'Open',
        aria: 'Open the held version ' + v.versionLabel + ' of ' + (rec ? rec.name : v.recordId)
      });
    });

    /* ---- the canonical tree ---- */
    var tree = state.canonicalTree();
    var treeHTML = tree.map(function (g) {
      var courses = g.courses.map(function (c) {
        var rows = c.records.length
          ? '<div class="tscroll"><table class="dt">' +
            '<caption class="sr-only">Experiments in ' + esc(c.course.name) + '</caption>' +
            '<thead><tr><th scope="col">Experiment</th><th scope="col">Technologies</th>' +
            '<th scope="col">Version</th><th scope="col">State</th>' +
            '<th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' +
            c.records.map(function (rec) {
              var open = state.openVersionForRecord(rec.id);
              return '<tr>' +
                '<td data-label="Experiment"><a class="rowlink" href="' + P.href.record(rec.id) + '">' +
                '<span class="tmain">' + esc(rec.name) + '</span>' +
                '<span class="tsub">' + esc(rec.id) + '</span></a></td>' +
                '<td data-label="Technologies">' + (rec.technologies.length
                  ? ui.techBadges(rec.technologies) : '<span class="muted">None</span>') + '</td>' +
                '<td data-label="Version">' + (rec.versionLabel
                  ? esc(rec.versionLabel) : '<span class="muted">—</span>') +
                (open ? '<span class="tsub">' + esc(open.versionLabel) + ' in the workflow</span>' : '') + '</td>' +
                '<td data-label="State">' + recordStateBadge(rec) + '</td>' +
                '<td class="cell-actions"><a class="btn sm sec" href="' + P.href.record(rec.id) + '">Open</a></td>' +
                '</tr>';
            }).join('') + '</tbody></table></div>'
          : '<p class="muted" style="padding:14px 20px">No experiment exists under this course yet.</p>';
        return '<details class="canon"' + '>' +
          '<summary>' + ui.ic('flask', 'sm') + '<span class="cn-n">' + esc(c.course.name) + '</span>' +
          '<span class="cn-c">' + c.records.length + ' ' + util.plural(c.records.length, 'experiment') + '</span>' +
          '</summary><div class="cn-b">' + rows + '</div></details>';
      }).join('');
      return '<section class="canongroup">' +
        '<h3>' + esc(g.grouping.name) + '</h3>' +
        '<p class="cg-s">' + esc(g.grouping.summary) + '</p>' +
        courses + '</section>';
    }).join('');

    var html =
      ui.phead('Content governance',
        awaiting.length
          ? awaiting.length + ' ' + util.plural(awaiting.length, 'version') + ' awaiting a Release / Hold decision'
          : 'Canonical catalogue and later-version decisions') +
      '<div class="stack">' +
      ui.card('Versions awaiting Release / Hold',
        P.attentionList(decisionItems, {
          icon: 'check', heading: 'h3',
          title: 'No version is waiting on a decision',
          body: 'A later version of an already-published Experiment reaches this list once the Academic ' +
            'Reviewer has approved it.'
        }) +
        '<p class="cardfoot"><strong>Release</strong> and <strong>Hold</strong> apply to a LATER version of an ' +
        'already-published Experiment. The <strong>first publication</strong> of a new Experiment is the Content ' +
        'Manager&rsquo;s, and there is no publish control anywhere in this workspace.</p>', null, 'h2') +
      ui.card('Canonical catalogue',
        '<p class="chelp">Programme / department → Course → Experiment. This structure is platform-controlled: ' +
        'a Tenant Admin can never redefine it. Canonical metadata is managed here and by the Content Manager; ' +
        'Learning Outcomes stay with the Academic Reviewer and technology delivery stays with the Vendor.</p>' +
        treeHTML, null, 'h2') +
      ui.gapNote('NOT IN THIS BUILD',
        'Creating or deleting a Programme / department or a Course is not implemented. The sources confirm that ' +
        'the structure is platform-controlled and that canonical metadata may be managed, but describe no create ' +
        'or delete operation — and these identifiers are load-bearing for every existing access record, academic ' +
        'mapping and assignment. Also absent by instruction: unpublishing or withdrawing content, and any ' +
        'bundle, pricing or revenue surface.') +
      '</div>';

    return { title: 'Content governance', html: html, navKey: 'content' };
  };

  /* ============================================================
     ONE EXPERIMENT — canonical metadata, ownership, and the version
     lifecycle with the Release / Hold decision.
     ============================================================ */
  XRSLP.screens.platformRecord = function (params) {
    var rec = state.contentRecord(params.recordId);
    if (!rec) {
      return {
        title: 'Experiment not found', navKey: 'content',
        html: ui.crumbs([{ label: 'Content governance', href: P.href.content() }, { label: 'Not found' }]) +
          ui.phead('Experiment not found') +
          '<div class="tablecard">' + ui.emptyState({
            icon: 'alertCirc', title: 'Experiment not found',
            body: 'No content record exists with this identifier in the prototype data.',
            actionsHTML: '<a class="btn pri" href="' + P.href.content() + '">Back to content governance</a>'
          }) + '</div>'
      };
    }
    var ctx = state.contentContext(rec);
    var editable = state.canonicalEditable(rec);
    var versions = state.versionsForRecord(rec.id);
    var pending = versions.filter(function (v) { return v.status === state.VERSION_STATUS.APPROVED; })[0] || null;
    var heldOne = versions.filter(function (v) { return v.status === state.VERSION_STATUS.HELD; })[0] || null;
    var inFlight = state.openVersionForRecord(rec.id);

    /* ---- the current published state ---- */
    var current = ui.card('Currently published',
      '<div class="kv">' +
      '<div class="k">Experiment</div><div class="v">' + esc(rec.name) + ' <span class="muted">' + esc(rec.id) + '</span></div>' +
      '<div class="k">Course</div><div class="v">' +
      (ctx.course ? esc((ctx.grouping ? ctx.grouping.name + ' › ' : '') + ctx.course.name)
                  : '<span class="muted">Not resolved</span>') + '</div>' +
      '<div class="k">State</div><div class="v">' + recordStateBadge(rec) + '</div>' +
      '<div class="k">Current public version</div><div class="v">' +
      (rec.versionLabel ? '<strong>' + esc(rec.versionLabel) + '</strong>' : '<span class="muted">No version label</span>') +
      '</div>' +
      '<div class="k">Technology availability</div><div class="v">' +
      (rec.technologies.length ? ui.techBadges(rec.technologies) : '<span class="muted">None</span>') + '</div>' +
      (rec.publication
        ? '<div class="k">First published</div><div class="v">' + esc(util.fmtDateTime(rec.publication.publishedAt)) +
          ' <span class="muted">by ' + esc(rec.publication.publishedByName) + ' (Content Manager)</span></div>'
        : '') +
      '</div>' +
      '<p class="cardfoot">Technology availability is central metadata set by the Vendor&rsquo;s submission and ' +
      'validated academically. It is not edited here, and a release can never change it — see the note beside ' +
      'the version panel.</p>', null, 'h2');

    /* ---- role ownership ----
       Who holds this record UNDER A LIVE ASSIGNMENT. For the Vendor row
       that is not the whole truth: a record has an author, and the author
       does not stop being the author when their scope is withdrawn. This
       is the screen a Super Admin reads before deciding whether to
       restore a scope, so saying "Nobody is assigned" about a record with
       a living, named, still-reading owner would be the one untruth that
       matters most here. The withdrawn author is named, and marked. */
    function ownerLine(role) {
      var actors = state.actorsForRecord(rec, role);
      var extra = '';
      if (role === state.CONTENT_ROLE.VENDOR && rec.createdBy &&
          !actors.some(function (a) { return a.id === rec.createdBy; })) {
        var author = state.contentActor(rec.createdBy);
        if (author) {
          extra = '<a href="' + P.href.actor(author.id) + '">' + esc(author.name) + '</a>' +
            ' <span class="muted">· created this submission; no live scope covers it now, so it is ' +
            'read-only for them</span>';
        }
      }
      if (!actors.length) {
        return extra || '<span class="muted">Nobody is assigned</span>';
      }
      return actors.map(function (a) {
        return '<a href="' + P.href.actor(a.id) + '">' + esc(a.name) + '</a>';
      }).join(', ') + (extra ? ', ' + extra : '');
    }
    var ownership = ui.card('Who is assigned to this experiment',
      '<div class="kv">' +
      '<div class="k">Vendor</div><div class="v">' + ownerLine(state.CONTENT_ROLE.VENDOR) + '</div>' +
      '<div class="k">Academic Reviewer</div><div class="v">' + ownerLine(state.CONTENT_ROLE.REVIEWER) + '</div>' +
      '<div class="k">Content Manager</div><div class="v">' + ownerLine(state.CONTENT_ROLE.MANAGER) + '</div>' +
      '</div>' +
      '<p class="cardfoot">Assignment may be platform-wide, per Course or per Experiment, and several people ' +
      'may hold one Experiment. Change it in <a href="' + P.href.roles() + '">Role governance</a>.</p>', null, 'h2');

    /* ---- canonical metadata editor ---- */
    /* Which institutions actually hold this Experiment today — real
       records, counted, not asserted. */
    var holders = state.accessAll().filter(function (a) {
      return (a.items || []).some(function (i) { return i.experimentId === rec.id; });
    }).map(function (a) { return a.tenantId; }).filter(function (t, i, arr) { return arr.indexOf(t) === i; });

    var courseOptions = data.COURSES.map(function (c) {
      var g = data.grouping(c.groupingId);
      return '<option value="' + esc(c.id) + '"' + (c.id === rec.courseId ? ' selected' : '') + '>' +
        esc((g ? g.name + ' — ' : '') + c.name) + '</option>';
    }).join('');
    var metaCard = ui.card('Canonical metadata',
      editable
        ? '<form id="cm-form" novalidate>' +
          '<div class="form-errors"></div>' +
          '<div class="field" id="cm-name"><label for="cm-name-i">Canonical Experiment name ' +
          '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
          '<input type="text" id="cm-name-i" value="' + esc(rec.name) + '" autocomplete="off"></div>' +
          '<div class="field" id="cm-course"><label for="cm-course-i">Course ' +
          '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
          '<select id="cm-course-i">' + courseOptions + '</select>' +
          '<p class="hint">The Experiment identifier never changes, so existing access records, academic ' +
          'mappings and student assignments keep pointing at the same Experiment.' +
          /* Moving an Experiment between Courses is a real consequence, not
             a cosmetic edit: Faculty reach is derived from COURSE-level
             mappings, so a move changes which Faculty at each institution
             the Experiment reaches. No source says what should happen, so
             the action is offered and its consequence is stated — rather
             than blocked by an invented rule, or taken silently. */
          (holders.length
            ? ' <strong>' + holders.length + ' ' + util.plural(holders.length, 'institution') +
              ' currently ' + (holders.length === 1 ? 'holds' : 'hold') + ' this experiment.</strong> ' +
              'Faculty reach is derived from Course-level mappings, so moving it to another Course changes ' +
              'which Faculty members it reaches inside those institutions. No licence, assignment or ' +
              'student entitlement changes.'
            : '') +
          '</p></div>' +
          '<div class="field" id="cm-summary"><label for="cm-summary-i">Catalogue summary</label>' +
          '<textarea id="cm-summary-i" rows="2">' + esc(rec.summary) + '</textarea></div>' +
          '<div class="field" id="cm-description"><label for="cm-description-i">Catalogue description</label>' +
          '<textarea id="cm-description-i" rows="5">' + esc(rec.description) + '</textarea></div>' +
          '<div class="formact"><button class="btn pri" type="submit">Save canonical metadata</button>' +
          '<span class="formnote">' +
          (rec.status === state.CONTENT_STATUS.PUBLISHED
            ? 'Saved immediately, and this experiment is published — the public catalogue shows the change at once. '
            : 'Saved immediately. This experiment is not published, so nothing public changes until it is. ') +
          'Learning Outcomes and technology delivery are not editable here.</span></div>' +
          '</form>'
        : ui.alertBox('info', 'Not editable in this state',
            '<p>Canonical metadata is corrected for published content and for content sitting at the Content ' +
            'Manager&rsquo;s readiness gate. This record is currently with the Vendor or the Academic Reviewer, ' +
            'and rewriting it would change the work under the person doing it.</p>'), null, 'h2');

    /* ---- the version panel ---- */
    var decisionHTML = '';
    if (pending) {
      decisionHTML =
        '<div class="verdec">' +
        '<div class="vd-h">' + versionBadge(pending) +
        '<span class="vd-l">Version ' + esc(pending.versionLabel) + '</span></div>' +
        '<div class="kv">' +
        '<div class="k">Replaces</div><div class="v">' + esc(pending.replacesVersionLabel || '—') + '</div>' +
        '<div class="k">What changed</div><div class="v">' + esc(pending.changeNote) + '</div>' +
        '<div class="k">Submitted by</div><div class="v">' + esc(pending.createdByName) + ' <span class="muted">· Vendor</span></div>' +
        '<div class="k">Academic approval</div><div class="v">' +
        esc(pending.academicDecisionByName || '—') +
        (pending.academicDecisionAt ? ' <span class="muted">· ' + esc(util.fmtDate(pending.academicDecisionAt)) + '</span>' : '') +
        '</div>' +
        '</div>' +
        /* h3: the panel sits inside an h2 card, and no heading level is
           skipped anywhere in the outline. */
        '<h3 class="vd-sh">Description this version would make current</h3>' +
        '<p class="vd-d">' + esc(pending.description) + '</p>' +
        '<div class="decidebar">' +
        '<span class="db-note">Releasing makes version ' + esc(pending.versionLabel) +
        ' the version the public catalogue shows, under the same Experiment. Holding leaves version ' +
        esc(rec.versionLabel || '—') + ' live. Neither changes any tenant&rsquo;s access, licences or ' +
        'technology variants, and neither creates or removes a student assignment.</span>' +
        '<button class="btn sec" type="button" id="v-hold">' + ui.ic('minus') + 'Hold</button>' +
        '<button class="btn pri" type="button" id="v-release">' + ui.ic('check') + 'Release version</button>' +
        '</div></div>';
    } else if (heldOne) {
      decisionHTML =
        '<div class="verdec held">' +
        '<div class="vd-h">' + versionBadge(heldOne) +
        '<span class="vd-l">Version ' + esc(heldOne.versionLabel) + '</span></div>' +
        '<div class="kv">' +
        '<div class="k">Held on</div><div class="v">' +
        esc(heldOne.releaseDecision ? util.fmtDateTime(heldOne.releaseDecision.at) : '—') + '</div>' +
        '<div class="k">Reason recorded</div><div class="v">' +
        esc((heldOne.releaseDecision && heldOne.releaseDecision.note) || '—') + '</div>' +
        '<div class="k">Live version</div><div class="v"><strong>' + esc(rec.versionLabel || '—') +
        '</strong> — unchanged</div>' +
        '</div>' +
        '<div class="decidebar">' +
        '<span class="db-note">The held version is kept, not discarded. Lifting the hold returns it to the ' +
        'Release / Hold decision; it does not release it.</span>' +
        '<button class="btn sec" type="button" id="v-unhold">Lift the hold</button>' +
        '</div></div>';
    } else if (inFlight) {
      decisionHTML = ui.alertBox('info', 'A later version is in the workflow',
        '<p>Version <strong>' + esc(inFlight.versionLabel) + '</strong> is currently ' +
        esc(state.versionStatusMeta(inFlight.status).label.toLowerCase()) +
        '. It reaches the Release / Hold decision only once the Academic Reviewer has approved it, and the ' +
        'public catalogue stays on version <strong>' + esc(rec.versionLabel || '—') + '</strong> until then.</p>');
    } else if (rec.status === state.CONTENT_STATUS.PUBLISHED) {
      decisionHTML = ui.alertBox('info', 'No later version has been submitted',
        '<p>A Vendor assigned to this experiment proposes a later version; the Academic Reviewer approves it; ' +
        'the decision to release it or hold it arrives here.</p>');
    }

    var versionRows = versions.length
      ? '<div class="timeline">' + versions.map(function (v) {
          var cls = v.status === state.VERSION_STATUS.RELEASED ? 'good'
            : v.status === state.VERSION_STATUS.HELD || v.status === state.VERSION_STATUS.CHANGES_ACADEMIC ? 'warn' : 'info';
          var m = state.versionStatusMeta(v.status);
          return '<div class="tl-item"><span class="tl-dot ' + cls + '">' + ui.ic(m.icon) + '</span>' +
            '<div class="tl-body"><div class="tl-action">Version ' + esc(v.versionLabel) + ' — ' + esc(m.label) + '</div>' +
            '<div class="tl-who">' + esc(v.createdByName) + ' · Vendor · ' + esc(util.fmtDateTime(v.createdAt)) + '</div>' +
            (v.changeNote ? '<p class="tl-note">' + esc(v.changeNote) + '</p>' : '') +
            (v.releaseDecision
              ? '<p class="tl-note"><strong>' +
                (v.releaseDecision.decision === 'released' ? 'Released' : 'Held') + '</strong> by ' +
                esc(v.releaseDecision.by) + ' · ' + esc(util.fmtDateTime(v.releaseDecision.at)) +
                (v.releaseDecision.note ? ' — ' + esc(v.releaseDecision.note) : '') + '</p>'
              : '') +
            '</div></div>';
        }).join('') + '</div>'
      : '<p class="muted">No later version has been submitted for this experiment.</p>';

    var versionCard = ui.card('Later versions — Release / Hold',
      decisionHTML + '<h3 class="vh">Version history</h3>' + versionRows, null, 'h2');

    /* ---- first-publication history, read-only ---- */
    var historyCard = ui.card('Content history',
      XRSLP.contentUI.historyTimeline(rec) +
      '<p class="cardfoot">The first publication of this Experiment was the Content Manager&rsquo;s decision. ' +
      'It is shown here as history and cannot be re-taken, reversed or withdrawn from this workspace.</p>', null, 'h2');

    var html =
      ui.crumbs([{ label: 'Content governance', href: P.href.content() }, { label: rec.name }]) +
      ui.phead(rec.name,
        (ctx.course ? esc((ctx.grouping ? ctx.grouping.name + ' › ' : '') + ctx.course.name) : '') +
        (rec.versionLabel ? ' · version ' + esc(rec.versionLabel) : ''),
        null, ' ' + recordStateBadge(rec)) +
      '<div class="grid-rail">' +
      '<div class="stack">' + current + versionCard + metaCard + '</div>' +
      '<div class="stack">' + ownership + historyCard +
      ui.gapNote('OPEN POLICY QUESTION',
        'A later version in this build carries the description, the version label, the vendor notes and the ' +
        'per-technology delivery references. It <strong>cannot change technology availability</strong>: no source ' +
        'states what should happen to a tenant that already holds a technology a newer version drops, so the ' +
        'prototype does not offer an action whose consequence it cannot state honestly. Existing tenant ' +
        'entitlement is therefore left exactly as it stands by every release.') +
      '</div></div>';

    return {
      title: rec.name, html: html, navKey: 'content',
      after: function () {
        var form = document.getElementById('cm-form');
        if (form) {
          var busy = false;
          form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (busy) { return; }
            busy = true;
            var res = state.updateCanonicalAsPlatform(rec.id, {
              name: (document.getElementById('cm-name-i') || {}).value || '',
              courseId: (document.getElementById('cm-course-i') || {}).value || '',
              summary: (document.getElementById('cm-summary-i') || {}).value || '',
              description: (document.getElementById('cm-description-i') || {}).value || ''
            });
            if (!res.ok) { busy = false; ui.showErrors(form, res.errors, 'Please correct the metadata'); return; }
            ui.toast('Canonical metadata updated.');
            XRSLP.render(false);
          });
        }

        var rel = document.getElementById('v-release');
        if (rel && pending) {
          rel.addEventListener('click', function () {
            ui.openDialog({
              title: 'Release version ' + pending.versionLabel + '?',
              bodyHTML:
                '<p>Version <strong>' + esc(pending.versionLabel) + '</strong> becomes the version the public ' +
                'catalogue shows for <strong>' + esc(rec.name) + '</strong>, replacing <strong>' +
                esc(rec.versionLabel || '—') + '</strong>. The Experiment identity does not change.</p>' +
                '<div class="consequence">' + ui.ic('shield') + '<span>This grants no tenant anything. ' +
                'No access record, licence quantity, technology variant or student assignment changes, and no ' +
                'student&rsquo;s progress or attempt history is affected.</span></div>' +
                '<div class="field" id="v-note" style="margin-top:12px">' +
                '<label for="v-note-i">Note (recorded in the version history)</label>' +
                '<input type="text" id="v-note-i" autocomplete="off"></div>',
              okLabel: 'Release version',
              onConfirm: function (body) {
                var input = body ? body.querySelector('#v-note-i') : null;
                var out = state.releaseVersion(pending.id, input ? input.value : '');
                if (out) { ui.toast('Version ' + out.versionLabel + ' released. It is now the current public version.'); }
                XRSLP.render(false);
              }
            });
          });
        }
        var hold = document.getElementById('v-hold');
        if (hold && pending) {
          hold.addEventListener('click', function () {
            ui.openDialog({
              title: 'Hold version ' + pending.versionLabel + '?',
              bodyHTML:
                '<p>The currently published version <strong>' + esc(rec.versionLabel || '—') +
                '</strong> stays live and unchanged. Version ' + esc(pending.versionLabel) +
                ' is kept on hold, not discarded — you can release it later.</p>' +
                '<div class="consequence">' + ui.ic('info') + '<span>Nothing about the public catalogue, any ' +
                'tenant&rsquo;s access or any student&rsquo;s entitlement changes.</span></div>' +
                '<div class="field" id="v-hnote" style="margin-top:12px">' +
                '<label for="v-hnote-i">Reason (recorded in the version history)</label>' +
                '<input type="text" id="v-hnote-i" autocomplete="off"></div>',
              okLabel: 'Hold version',
              onConfirm: function (body) {
                var input = body ? body.querySelector('#v-hnote-i') : null;
                var out = state.holdVersion(pending.id, input ? input.value : '');
                if (out) {
                  ui.toast('Version ' + out.versionLabel + ' held. Version ' + (rec.versionLabel || '—') +
                    ' remains the published version.');
                }
                XRSLP.render(false);
              }
            });
          });
        }
        var unhold = document.getElementById('v-unhold');
        if (unhold && heldOne) {
          unhold.addEventListener('click', function () {
            ui.openDialog({
              title: 'Lift the hold on version ' + heldOne.versionLabel + '?',
              bodyHTML: '<p>The version returns to the Release / Hold decision. <strong>It is not released ' +
                'by this action</strong> — the published version stays live until you release it explicitly.</p>',
              okLabel: 'Lift the hold',
              onConfirm: function () {
                state.returnHeldVersionToDecision(heldOne.id, '');
                ui.toast('Hold lifted. The version is back on the Release / Hold decision.');
                XRSLP.render(false);
              }
            });
          });
        }
      }
    };
  };
})();
