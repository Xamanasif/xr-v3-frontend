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

   Scope: a reviewer sees the submissions inside their per-Course
   assignment (STK31-41). A hand-typed route to a submission outside it
   resolves to not found, and the state layer refuses the action too.

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
  var data = XRSLP.data;
  var state = XRSLP.state;
  var cui = XRSLP.contentUI;
  var href = cui.href;
  var CS = state.CONTENT_STATUS;

  var queueFilter = { status: 'all', q: '', course: 'all' };

  function resolveActor(params) {
    var a = state.contentActor(params.actorId);
    if (!a || a.role !== state.CONTENT_ROLE.REVIEWER) { return null; }
    return a;
  }

  function shell(actor, navKey, title, html, after) {
    return { title: title, html: html, area: 'review', navKey: navKey, contentActor: actor, after: after };
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

    var tiles = '<div class="statgrid">' +
      cui.statTile(o.waiting, 'Waiting for review', 'awaiting your decision') +
      cui.statTile(o.changesRequested, 'Changes requested', 'returned to the Vendor') +
      cui.statTile(o.approvedAwaitingPublication, 'Academically approved', 'awaiting publication') +
      cui.statTile(o.published, 'Published', 'from your assigned courses') +
      '</div>';

    var attnHTML = o.queue.length
      ? '<div class="attn">' + o.queue.map(function (r) {
          var ready = state.academicReadiness(r);
          return '<div class="at-row ' + (ready.ok ? '' : 'warn') + '"><span class="at-ic">' +
            ui.ic('clock') + '</span>' +
            '<div class="at-body"><div class="at-t">' + esc(r.name) + '</div>' +
            '<p>' + cui.contextLine(r) + ' · submitted ' +
            esc(util.fmtDate(r.submittedAt)) +
            (r.resubmitted ? ' · resubmitted (revision ' + r.revision + ')' : '') +
            (ready.ok ? '' : ' · Learning Outcomes not yet recorded') + '</p></div>' +
            '<a class="btn sec sm" href="' + href.rRecord(actor.id, r.id) + '">Review</a></div>';
        }).join('') + '</div>'
      : ui.emptyState({
          icon: 'check', heading: 'h3',
          title: 'Nothing is waiting for academic review',
          body: 'No submission in your assigned courses is currently awaiting an academic decision.'
        });

    var recentHTML = o.recent.length
      ? '<div class="timeline">' + o.recent.map(function (d) {
          var rec = state.contentRecord(d.recordId);
          return '<div class="tl-item"><span class="tl-dot ' +
            (d.decision === 'approved' ? 'good' : 'warn') + '">' +
            ui.ic(d.decision === 'approved' ? 'check' : 'alert') + '</span>' +
            '<div class="tl-body"><div class="tl-action">' +
            esc(d.decision === 'approved' ? 'Approved' : 'Changes requested') + ' — ' +
            (rec ? '<a href="' + href.rRecord(actor.id, rec.id) + '">' + esc(rec.name) + '</a>' : esc(d.recordId)) +
            '</div><div class="tl-who">' + esc(util.fmtDateTime(d.at)) +
            ' · revision ' + esc(String(d.revision)) + '</div>' +
            (d.comment ? '<p class="tl-note">' + esc(d.comment) + '</p>' : '') +
            '</div></div>';
        }).join('') + '</div>'
      : '<p class="muted">You have not recorded an academic decision yet.</p>';

    var scopeHTML = o.courses.length
      ? '<ul class="reslist plain">' + o.courses.map(function (cid) {
          var c = data.course(cid);
          var g = c ? data.grouping(c.groupingId) : null;
          return '<li>' + ui.ic('book') + '<span>' + esc(g ? g.name + ' › ' : '') +
            '<strong>' + esc(c ? c.name : cid) + '</strong></span></li>';
        }).join('') + '</ul>'
      : '<p class="muted">No Course has been assigned to you.</p>';

    var html =
      ui.phead('Overview', esc(actor.name) + ' · Academic Reviewer') +
      tiles +
      '<div class="grid-rail" style="margin-top:18px">' +
      '<div class="stack">' + ui.card('Awaiting your academic decision', attnHTML) + '</div>' +
      '<div class="stack">' +
      ui.card('Courses assigned to you', scopeHTML, 'Assigned course scope') +
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
  XRSLP.screens.reviewerQueue = function (params) {
    var actor = resolveActor(params);
    if (!actor) { return XRSLP.screens.notFound(); }
    var all = state.contentForReviewer(actor.id);

    if (!all.length) {
      return shell(actor, 'queue', 'Review queue',
        ui.phead('Review queue', esc(actor.name)) +
        '<div class="tablecard">' + ui.emptyState({
          icon: 'doc',
          title: 'Nothing is in your review queue',
          body: 'No submission has reached academic review in the courses assigned to you. Submissions appear ' +
            'here once a Vendor submits them.'
        }) + '</div>');
    }

    cui.normaliseFilters(all, queueFilter);
    var html =
      ui.phead('Review queue', esc(actor.name) + ' · Academic Reviewer') +
      '<div class="tablecard">' +
      '<div class="listbar">' +
      '<label for="r-q">Search<input type="text" id="r-q" class="cellinput" ' +
      'placeholder="Experiment or course" value="' + esc(queueFilter.q) + '"></label>' +
      '<label for="r-status">Status<select id="r-status">' +
      cui.statusFilterOptions(all, queueFilter.status) + '</select></label>' +
      '<label for="r-course">Course<select id="r-course">' +
      cui.courseFilterOptions(all, queueFilter.course) + '</select></label>' +
      '<span class="lcount" id="r-count"></span>' +
      '</div>' +
      '<div class="tscroll"><table class="dt" id="r-table">' +
      '<caption class="sr-only">Submissions in the courses assigned to you</caption>' +
      '<thead><tr>' +
      '<th scope="col">Experiment</th><th scope="col">Vendor</th><th scope="col">Course</th>' +
      '<th scope="col">Technologies</th><th scope="col">Submitted</th><th scope="col">Version</th>' +
      '<th scope="col">Status</th><th scope="col"><span class="sr-only">Actions</span></th>' +
      '</tr></thead><tbody id="r-rows"></tbody></table></div>' +
      '<div id="r-empty"></div></div>';

    return shell(actor, 'queue', 'Review queue', html, function () {
      var rowsEl = document.getElementById('r-rows');
      var emptyEl = document.getElementById('r-empty');
      var countEl = document.getElementById('r-count');
      var tableEl = document.getElementById('r-table');

      function paint() {
        var rows = all.filter(function (r) { return cui.matchesFilters(r, queueFilter); });
        rowsEl.innerHTML = rows.map(function (r) {
          var vendor = r.createdBy ? state.contentActor(r.createdBy) : null;
          var actionable = r.status === CS.ACADEMIC_REVIEW;
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
            '<td data-label="Status">' + cui.statusBadge(r) + '</td>' +
            '<td class="cell-actions"><a class="btn ' + (actionable ? 'sec' : 'gho') + ' sm" href="' +
            href.rRecord(actor.id, r.id) + '">' + (actionable ? 'Review' : 'View') + '</a></td>' +
            '</tr>';
        }).join('');
        countEl.textContent = rows.length + ' of ' + all.length + ' ' + util.plural(all.length, 'submission');
        if (!rows.length) {
          tableEl.setAttribute('hidden', 'hidden');
          emptyEl.innerHTML = ui.emptyState({
            icon: 'search',
            title: 'No submission matches',
            body: 'No submission in your assigned courses matches the current search and filters.'
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

    var stateNote;
    if (actionable) {
      stateNote = ui.alertBox('info',
        rec.resubmitted ? 'Resubmitted for academic review (revision ' + rec.revision + ')'
                        : 'Awaiting your academic decision',
        '<p>Validate the academic content and its alignment to the Course, record the Learning Outcomes, then ' +
        'approve or request changes. Approving moves this to the Content Manager — it does not publish it.</p>');
    } else {
      stateNote = ui.alertBox('info', 'No academic decision is available',
        '<p>This submission is currently in “' + esc(state.contentStatusMeta(rec.status).label) +
        '” — ' + esc(cui.holderLine(rec, 'reviewer')) + '. It appears here read-only for reference.</p>');
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
          '<div class="formact" style="padding-top:4px">' +
          '<button class="btn pri" type="button" id="r-approve"' +
          (ready.ok ? '' : ' aria-disabled="true"') + '>' + ui.ic('check') + 'Approve academically</button>' +
          '<button class="btn sec" type="button" id="r-changes">' + ui.ic('alert') + 'Request changes</button>' +
          '<span class="formnote">Approval records your identity, the time, the decision and the Learning ' +
          'Outcomes as they stand. It does not publish anything.</span>' +
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
            '</div></div>';
        }).join('') + '</div>'
      : '<p class="muted">No academic decision has been recorded for this submission yet.</p>';

    var html =
      ui.crumbs([{ label: 'Review queue', href: href.rQueue(actor.id) }, { label: rec.name }]) +
      ui.phead(rec.name,
        cui.contextLine(rec) + ' · ' + esc(cui.holderLine(rec, 'reviewer')),
        '', ' ' + cui.statusBadge(rec) + cui.revisionChip(rec) + cui.resubmittedChip(rec)) +
      stateNote +
      '<div class="grid-rail" style="margin-top:18px">' +
      '<div class="stack">' +
      ui.card('Experiment', cui.recordSummaryKV(rec, { showVendorNotes: true })) +
      ui.card('Learning outcomes', outcomesHTML,
        actionable ? 'You own these' : 'Academic Reviewer owned') +
      decisionCard +
      ui.card('Technology delivery — context for your review', cui.deliveryRows(rec),
        'Read-only') +
      ui.card('Supporting documentation', cui.documentsList(rec.documents)) +
      '</div>' +
      '<div class="stack">' +
      ui.card('Submission',
        '<div class="kv">' +
        cui.kvLine('Vendor', vendor
          ? esc(vendor.name) + '<div class="muted">' + esc(vendor.organisation) + '</div>'
          : '<span class="muted">—</span>') +
        cui.kvLine('Submitted', rec.submittedAt ? esc(util.fmtDateTime(rec.submittedAt)) : '—') +
        cui.kvLine('Version', esc(rec.versionLabel || '—')) +
        cui.kvLine('Revision', esc(String(rec.revision))) +
        '</div>') +
      ui.card('Academic decision history', priorHTML) +
      ui.card('Not part of this review',
        '<ul class="reslist plain">' +
        '<li>' + ui.ic('x') + '<span>Publishing — first publication is handled by the Content Manager.</span></li>' +
        '<li>' + ui.ic('x') + '<span>Granting the experiment to an institution — that needs a request and Super Admin approval.</span></li>' +
        '<li>' + ui.ic('x') + '<span>Assessment questions or student answers — those are Faculty’s, inside a tenant.</span></li>' +
        '<li>' + ui.ic('x') + '<span>Installing or deploying a package — no deployment is performed by this platform prototype.</span></li>' +
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
          repaint('Learning outcome moved up.', function () {
            var ups = document.querySelectorAll('.lo-up');
            return ups[iu - 1] || document.querySelectorAll('.lo-down')[iu - 1];
          });
        });
      });
      Array.prototype.slice.call(document.querySelectorAll('.lo-down')).forEach(function (b) {
        b.addEventListener('click', function () {
          var id2 = parseInt(b.getAttribute('data-i'), 10);
          state.moveOutcome(actor.id, fresh.id, id2, 1);
          repaint('Learning outcome moved down.', function () {
            var downs = document.querySelectorAll('.lo-down');
            return downs[id2 + 1] || document.querySelectorAll('.lo-up')[id2 + 1];
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

    if (approve) {
      approve.addEventListener('click', function () {
        var fresh = state.contentRecord(rec.id);
        var ready = state.academicReadiness(fresh);
        if (!ready.ok) {
          ui.toast(ready.blockers[0], 'info');
          return;
        }
        ui.openDialog({
          title: 'Approve academically?',
          bodyHTML: '<p>This records your academic approval of <strong>' + esc(fresh.name) +
            '</strong> at revision ' + fresh.revision + ', together with the ' + fresh.outcomes.length + ' ' +
            util.plural(fresh.outcomes.length, 'Learning Outcome') + ' you have recorded.</p>' +
            '<p style="margin-top:8px">It then moves to the <strong>Content Manager</strong> for content ' +
            'readiness review.</p>' +
            '<div class="consequence">' + ui.ic('info') +
            '<span>Approval does not publish this experiment, and it grants it to no institution.</span></div>',
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
        ui.openDialog({
          title: 'Request changes?',
          bodyHTML: '<p>This returns <strong>' + esc(rec.name) + '</strong> to the Vendor for correction, with ' +
            'your comment.</p><blockquote class="qquote">' + esc(text) + '</blockquote>' +
            '<div class="consequence">' + ui.ic('info') +
            '<span>The Vendor can correct and resubmit. The decision you record here is kept in the ' +
            'history.</span></div>',
          okLabel: 'Request changes',
          onConfirm: function () {
            var updated = state.requestChangesAcademic(actor.id, rec.id, text);
            if (!updated) { ui.toast('Changes could not be requested.', 'info'); return; }
            ui.toast('Changes requested — returned to the Vendor.');
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
      return [
        { href: href.rOverview(actor.id), icon: 'home', label: 'Overview',
          active: activeKey === 'overview', count: 0 },
        { href: href.rQueue(actor.id), icon: 'doc', label: 'Review queue',
          active: activeKey === 'queue', count: o.waiting,
          countLabel: util.plural(o.waiting, 'submission') + ' awaiting your academic decision' }
      ];
    }
  };
})();
