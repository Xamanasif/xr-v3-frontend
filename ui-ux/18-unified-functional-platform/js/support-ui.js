/* ============================================================
   Unified Functional Platform — shared SUPPORT / HELP surface.

   ONE implementation of "report a technical issue and see what state
   the report is in", used by every workspace that has a Help
   destination: Student · Faculty · Tenant Admin · Vendor · Academic
   Reviewer · Content Manager. The Super Admin side of the same records
   — the queue, the detail and the resolution — lives in the platform
   screens, because that is a different job with a different authority.

   WCAG 2.2 SC 3.2.6 *Consistent Help* is a Level A criterion, and
   `12_SUPPORT_AND_OPERATIONS_MODEL.md` §4 records that Help was present
   in the early batches, dropped by one and demoted by another. Help
   therefore sits in the SAME place in every workspace navigation here.

   ⛔ WHAT THIS DELIBERATELY DOES NOT CONTAIN (STK31-39, all four
   explicitly prohibited): an SLA or response-time promise · a priority
   or severity formula · an external ticketing provider · a chatbot.
   There is also no notification of any kind: no source describes one
   for support, so the state is surfaced in the product and nothing
   here claims a message was sent to anybody.

   ⚠ THE PUBLIC PLANE HAS NO HELP DESTINATION, and that is a decision
   rather than an oversight. The map below covers the six workspaces; a
   pre-sign-in visitor has no identity to key a report to, so there is
   nothing for `ticketsForRequester` to return and nothing to show them
   afterwards. The public answer instead lives on the request status
   screen, which says plainly that the request itself is the channel
   and that no message of any kind is sent.

   A support request changes NO entitlement, NO licence, NO assignment
   and NO content state. It writes its own record and stops.
   ============================================================ */

window.XRSLP = window.XRSLP || {};

XRSLP.supportUI = (function () {
  'use strict';

  var esc = XRSLP.util.esc;
  var util = XRSLP.util;
  var ui = XRSLP.ui;
  var data = XRSLP.data;
  var state = XRSLP.state;

  /* ---------------- routes ----------------
     One Help destination per workspace, at the same position in each
     workspace's navigation. */
  var href = {
    learn:   function (id) { return '#/learn/' + encodeURIComponent(id) + '/help'; },
    faculty: function (id) { return '#/faculty/' + encodeURIComponent(id) + '/help'; },
    tenant:  function (id) { return '#/tenant/' + encodeURIComponent(id) + '/help'; },
    vendor:  function (id) { return '#/vendor/' + encodeURIComponent(id) + '/help'; },
    review:  function (id) { return '#/review/' + encodeURIComponent(id) + '/help'; },
    content: function (id) { return '#/content/' + encodeURIComponent(id) + '/help'; }
  };

  function statusBadge(t) {
    var m = state.supportStatusMeta(t.status);
    return ui.badge(m.badge, m.icon, m.label);
  }

  /* ---------------- one report's own trail ----------------
     ⚠ THE REPORTER USED TO SEE TWO STATES AND NEVER THE STORY. The
     list rendered either "Resolved, with the note" or "Open with the
     platform team", and never `t.history` — which the state layer has
     maintained all along with submitted / resolved / reopened entries.
     A report that was resolved and then reopened showed its reporter
     the generic waiting line with no sign that it had ever been
     answered, and `previousResolution` was stored and never surfaced.

     The trail is folded away because it is a second read, not the
     headline; the reopened case gets its own visible line, because
     "this WAS answered, and the answer no longer stands" is news. */
  function ticketHistoryHTML(t) {
    var hist = t.history || [];
    if (hist.length < 2) { return ''; }
    var rows = hist.map(function (h) {
      var dot = h.kind === 'resolved' ? 'good' : h.kind === 'reopened' ? 'warn' : 'info';
      var icon = h.kind === 'resolved' ? 'check' : h.kind === 'reopened' ? 'alert' : 'doc';
      return '<div class="tl-item"><span class="tl-dot ' + dot + '">' + ui.ic(icon) + '</span>' +
        '<div class="tl-body"><div class="tl-action">' + esc(h.label || h.kind || 'Event') + '</div>' +
        '<div class="tl-who">' + esc(h.who || '') + ' · ' + esc(util.fmtDateTime(h.at)) + '</div>' +
        (h.note ? '<p class="tl-note">' + esc(h.note) + '</p>' : '') +
        '</div></div>';
    }).join('');
    return '<div class="tk-hist">' +
      ui.about(hist.length + ' ' + util.plural(hist.length, 'event', 'events') + ' on this report',
        '<div class="timeline">' + rows + '</div>') +
      '</div>';
  }

  /* ---------------- the reporter's own list ---------------- */
  /* ── ATTACHED EVIDENCE, ONE RENDERER ─────────────────────────
     Used by the reporter's own list AND by the Super Admin's ticket
     detail in platform-ops.js, so the person who sent the evidence and
     the person acting on it are looking at the same thing.

     `thumb` is a real reduced picture when one survived; when it did
     not, the facts still name the file so the report never loses that
     evidence was attached. */
  function ticketMediaHTML(t, opts) {
    var m = t && t.media;
    if (!m) { return ''; }
    opts = opts || {};
    return '<div class="tk-media">' +
      '<span class="tk-mk">' + ui.ic('doc', 'sm') + 'Attached media</span>' +
      '<div class="mp-row">' +
      (m.thumb
        ? '<img class="mp-thumb" src="' + m.thumb + '" alt="Attached image: ' + esc(m.name) + '">'
        : '<span class="mp-thumb mp-none">' + ui.ic(m.kind === 'video' ? 'play' : 'doc') + '</span>') +
      '<span class="mp-b"><span class="mp-n">' + esc(m.name) + '</span>' +
      '<span class="mp-m">' + esc(state.supportMediaSummary(m)) +
      (m.kind === 'video'
        ? ' · no preview for video'
        : (m.thumb ? '' : ' · preview unavailable')) + '</span></span>' +
      '</div>' +
      (opts.reviewer
        ? '<p class="tk-mn">The reporter&rsquo;s original file stays on their device; this is the ' +
          'preview attached to the report.</p>'
        : '') +
      '</div>';
  }

  function ticketList(tickets, opts) {
    opts = opts || {};
    if (!tickets.length) {
      return ui.emptyRow({
        icon: 'check', ok: true, heading: opts.heading || 'h3',
        title: opts.emptyTitle || 'You have not reported anything',
        body: opts.emptyBody ||
          'Reports you submit appear here with the state they are in, so you always know whether ' +
          'the platform has dealt with them.'
      });
    }
    return '<ul class="tickets">' + tickets.map(function (t) {
      var resolved = t.status === state.SUPPORT_STATUS.RESOLVED;
      return '<li class="tk">' +
        '<div class="tk-h"><span class="tk-id">' + esc(t.id) + '</span>' + statusBadge(t) + '</div>' +
        '<div class="tk-t">' + esc(t.subject) + '</div>' +
        '<div class="tk-m">' + esc(state.supportCategoryLabel(t.category)) +
        ' · reported ' + esc(util.fmtDateTime(t.createdAt)) +
        (opts.showReporter && t.requesterName ? ' · by ' + esc(t.requesterName) : '') + '</div>' +
        '<p class="tk-d">' + esc(t.description) + '</p>' +
        ticketMediaHTML(t, { reviewer: !!opts.reviewer }) +
        (resolved
          ? '<div class="tk-r">' + ui.ic('check', 'sm') +
            '<div><strong>Resolved</strong> ' + esc(util.fmtDateTime(t.resolvedAt)) +
            '<p>' + esc(t.resolutionNote) + '</p></div></div>'
          : '<div class="tk-w">' + ui.ic('clock', 'sm') +
            '<span>Open with the platform team. This page is where the outcome appears.</span></div>') +
        /* Reopened: the earlier resolution is history, not the current
           state, so it is shown as history and labelled as such. */
        (!resolved && t.previousResolution
          ? '<div class="tk-prev">' + ui.ic('info', 'sm') +
            '<div>This report was resolved and then reopened. The earlier resolution was: ' +
            esc(t.previousResolution) + '</div></div>'
          : '') +
        ticketHistoryHTML(t) +
        '</li>';
    }).join('') + '</ul>';
  }

  /* ---------------- the report form ----------------
     `ctx.experiments` is offered only where the workspace genuinely
     knows which experiments the reporter can reach; a role with no
     experiment context simply does not get the field. */
  function reportForm(ctx) {
    var cats = state.SUPPORT_CATEGORIES.map(function (c) {
      return '<option value="' + esc(c.id) + '">' + esc(c.label) + '</option>';
    }).join('');
    var expField = '';
    if (ctx.experiments && ctx.experiments.length) {
      expField =
        '<div class="field" id="sp-experiment"><label for="sp-experiment-i">Experiment</label>' +
        '<select id="sp-experiment-i"><option value="">— not about a specific experiment —</option>' +
        ctx.experiments.map(function (e) {
          return '<option value="' + esc(e.id) + '">' + esc(e.name) + '</option>';
        }).join('') + '</select></div>';
    }
    var techField = '';
    if (ctx.technologies && ctx.technologies.length) {
      techField =
        '<div class="field" id="sp-technology"><label for="sp-technology-i">Technology</label>' +
        '<select id="sp-technology-i"><option value="">— not technology specific —</option>' +
        data.sortTech(ctx.technologies).map(function (t) {
          var d = data.TECHNOLOGIES[t];
          return '<option value="' + esc(t) + '">' + esc(d ? d.name : t) + '</option>';
        }).join('') + '</select></div>';
    }

    /* ── ATTACH MEDIA (optional) ──────────────────────────────
       Stakeholder requirement: a report can carry evidence. One
       implementation, in the shared module, so every role's Help screen
       gets exactly the same control rather than six variations.

       Product copy stays to one line. What is and is not retained is a
       real limitation, so it is stated — but as a short line under the
       control, not as a warning panel over the form. The full account
       is in UX_REDESIGN_08.md and in js/state.js. */
    var mediaField =
      '<div class="field" id="sp-media">' +
      '<span class="flabel" id="sp-media-l">Attach media <span class="muted">(optional)</span></span>' +
      '<label class="dropsurface" for="sp-media-i">' +
      ui.ic('download', 'lg') +
      '<span class="ds-t">Choose a screenshot, photo or video</span>' +
      '<span class="ds-s">Attach anything that helps explain the issue.</span>' +
      '<input type="file" id="sp-media-i" accept="image/*,video/*" aria-describedby="sp-media-h">' +
      '</label>' +
      '<div id="sp-media-picked" class="mediapick" hidden></div>' +
      '<p class="hint" id="sp-media-h">Images are attached as a preview the platform team can see. ' +
      'The original file stays on your device.</p>' +
      '</div>';

    return '<form id="sp-form" novalidate>' +
      /* No aria-live here. `ui.showErrors` writes a role="alert" into
         this container and focuses it; a live region around an alert
         that is also focused announces the same message up to three
         times. The alert carries the announcement on its own. */
      '<div class="form-errors"></div>' +
      '<div class="field" id="sp-category"><label for="sp-category-i">What kind of issue is it? ' +
      '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
      '<select id="sp-category-i"><option value="">— choose —</option>' + cats + '</select>' +
      /* KEPT. It is what stops the category select being read as a
         severity or a routing control — there is neither. */
      '<p class="hint">These are the issue kinds the platform handles. Nothing here is scored, ' +
      'prioritised or routed automatically.</p></div>' +
      '<div class="field" id="sp-subject"><label for="sp-subject-i">Short title ' +
      '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
      '<input id="sp-subject-i" type="text" maxlength="120" autocomplete="off"></div>' +
      expField + techField +
      '<div class="field" id="sp-description"><label for="sp-description-i">What were you doing, and what happened? ' +
      '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
      '<textarea id="sp-description-i" rows="5"></textarea></div>' +
      mediaField +
      '<div class="formact"><button class="btn pri" type="submit">Report the issue</button>' +
      '<span class="formnote">Your name, your role' +
      (ctx.tenantId ? ' and your institution' : '') +
      ' are recorded with the report, because the platform already knows them.</span></div>' +
      '</form>';
  }

  /* What the reporter is told about how this works, BEFORE they write
     anything — which is why it is rendered above the form and not in
     the rail, where a narrow viewport put it below both the form and
     the list.

     The second paragraph is the sentence that makes the absence of an
     SLA, a priority formula and a notification channel explicit. It
     stays at readable size and contrast; it is not fine print. */
  function honestyPanel() {
    return ui.alertBox('info', 'How this works',
      '<p>The platform team can see your report, including which experiment, technology and institution ' +
      'it concerns. Any outcome appears on this page.</p>' +
      '<p>No response time is promised, no priority is assigned, and ' +
      '<strong>no email, SMS or notification is sent</strong> — this page is where the state lives.</p>');
  }

  /* The four prohibited features, denied plainly.

     This was a `gapNote` headed "NOT IN THIS BUILD" sitting in the same
     rail as the honesty panel, which said half of it again. It is the
     reason this surface is defensible, so it is kept in full — but it
     is a scope statement a reporter benefits from, not an engineering
     caveat, so it reads as product copy in one place instead of as a
     tagged box beside a duplicate. */
  function scopeCard() {
    return ui.card('What this does not include',
      '<p class="chelp">Reporting an issue here is the whole service. There is no knowledge base, no ' +
      'manuals or guides, and no escalation path. No external ticketing system is used and there is no ' +
      'chatbot.</p>' +
      '<p class="cardfoot">Your report goes into the platform team&rsquo;s queue and the outcome is ' +
      'recorded against it here.</p>', null, 'h2');
  }

  /* ---------------- the whole Help screen, for any workspace ----------------
     `ctx` = { kind, id, name, roleLabel, tenantId, experiments[], technologies[], heading } */
  /* ---------------- the whole Help screen, for any workspace ----------------
     `ctx` = { kind, id, name, roleLabel, tenantId, experiments[], technologies[], heading }

     REBUILT AT 08R. It was a two-column page whose right rail carried
     three cards — "How this works", "What is recorded" and "What this
     does not include" — and between them they spent more words telling
     the reader what the platform does NOT have (no knowledge base, no
     chatbot, no escalation path, no SLA, no notification) than helping
     them report anything. A support page whose loudest content is a
     list of absences reads as an apology, not a service.

     Those constraints are real and are still honoured — none of them is
     built, and nothing here implies otherwise — but they are scope
     facts for the documentation, not the first thing a person with a
     broken headset should read. What survives on screen is the single
     line that changes what a reporter DOES: no notification is sent, so
     this page is where the answer appears.

     One column. Report first, history under it. */
  function helpScreen(ctx) {
    var mine = state.ticketsForRequester(ctx.kind, ctx.id);
    var open = mine.filter(function (t) { return t.status === state.SUPPORT_STATUS.OPEN; }).length;

    var html =
      ui.phead('Help & support',
        esc('Report a technical issue with the platform or an experiment.')) +
      '<div class="stack helpcol">' +
      ui.card('Report an issue', reportForm(ctx), null, 'h2') +
      ui.card(ctx.listTitle || 'Your reports', ticketList(mine, {
        heading: 'h3',
        showReporter: !!ctx.listShowReporter,
        emptyTitle: ctx.listEmptyTitle,
        emptyBody: ctx.listEmptyBody
      }), mine.length ? mine.length + ' ' + util.plural(mine.length, 'report') +
          (open ? ' · ' + open + ' open' : '') : null, 'h2') +
      /* The one constraint that changes what the reporter does, and the
         one sentence about what is recorded. Everything else that used
         to be here is in the documentation. */
      '<p class="helpfoot">' + ui.ic('info', 'sm') +
      '<span>Your name, role and institution are recorded with the report. ' +
      'Nothing is emailed or texted — any outcome appears here.</span></p>' +
      '</div>';

    return { html: html, tickets: mine };
  }

  /* Binds the form. `ctx` is the same object the screen rendered with. */
  function bindHelp(ctx) {
    var form = document.getElementById('sp-form');
    if (!form) { return; }
    var submitting = false;
    var pickedMedia = null;

    /* ---- the attachment picker ----
       The FULL file never leaves the machine. For an image the browser
       draws it into a canvas at THUMB_EDGE and re-encodes, so what the
       record carries is a small picture plus the original's facts. For
       a video there is no frame to grab from a file input, so the facts
       are recorded on their own. Every failure path ends in a message
       and no attachment, never in a half-attached report. */
    var input = document.getElementById('sp-media-i');
    var picked = document.getElementById('sp-media-picked');

    function clearPick(message) {
      pickedMedia = null;
      if (input) { input.value = ''; }
      if (!picked) { return; }
      if (message) {
        picked.hidden = false;
        picked.innerHTML = '<p class="mp-err">' + ui.ic('alertCirc', 'sm') + esc(message) + '</p>';
      } else {
        picked.hidden = true;
        picked.innerHTML = '';
      }
    }

    function showPick(media) {
      if (!picked) { return; }
      picked.hidden = false;
      picked.innerHTML =
        '<div class="mp-row">' +
        (media.thumb
          ? '<img class="mp-thumb" src="' + media.thumb + '" alt="Preview of ' + esc(media.name) + '">'
          : '<span class="mp-thumb mp-none">' + ui.ic(media.kind === 'video' ? 'play' : 'doc') + '</span>') +
        '<span class="mp-b"><span class="mp-n">' + esc(media.name) + '</span>' +
        '<span class="mp-m">' + esc(state.supportMediaSummary(media)) + '</span></span>' +
        '<button class="btn sec sm" type="button" id="sp-media-x">Remove</button>' +
        '</div>';
      var x = document.getElementById('sp-media-x');
      if (x) {
        x.addEventListener('click', function () {
          clearPick('');
          ui.announce('Attachment removed.');
          if (input) { input.focus(); }
        });
      }
    }

    function accept(file) {
      var kind = state.supportMediaKind(file.type);
      if (kind !== 'image') {
        var res = state.attachSupportMedia({ name: file.name, type: file.type, size: file.size });
        if (!res.ok) { clearPick(res.error); return; }
        pickedMedia = res.media;
        showPick(res.media);
        return;
      }
      var reader = new FileReader();
      reader.onerror = function () { clearPick('That file could not be read.'); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { clearPick('That image could not be read.'); };
        img.onload = function () {
          var edge = state.SUPPORT_MEDIA.THUMB_EDGE;
          var scale = Math.min(1, edge / Math.max(img.width, img.height));
          var w = Math.max(1, Math.round(img.width * scale));
          var h = Math.max(1, Math.round(img.height * scale));
          var thumb = '';
          try {
            var c = document.createElement('canvas');
            c.width = w; c.height = h;
            c.getContext('2d').drawImage(img, 0, 0, w, h);
            thumb = c.toDataURL('image/jpeg', 0.6);
          } catch (e) { thumb = ''; }
          var out = state.attachSupportMedia({
            name: file.name, type: file.type, size: file.size,
            width: img.width, height: img.height, thumb: thumb
          });
          if (!out.ok) { clearPick(out.error); return; }
          pickedMedia = out.media;
          showPick(out.media);
          ui.announce('Attached ' + out.media.name + '.');
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }

    if (input) {
      input.addEventListener('change', function () {
        var f = input.files && input.files[0];
        if (!f) { clearPick(''); return; }
        accept(f);
      });
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (submitting) { return; }
      var expEl = document.getElementById('sp-experiment-i');
      var techEl = document.getElementById('sp-technology-i');
      var fields = {
        category: (document.getElementById('sp-category-i') || {}).value || '',
        subject: (document.getElementById('sp-subject-i') || {}).value || '',
        description: (document.getElementById('sp-description-i') || {}).value || '',
        experimentId: expEl ? (expEl.value || null) : null,
        technology: techEl ? (techEl.value || null) : null,
        /* Whatever the picker accepted, already normalised and size
           checked by the state layer. `null` when nothing was chosen —
           an attachment is optional and its absence is not an error. */
        media: pickedMedia
      };
      var errs = state.validateSupportTicket(fields);
      if (!ui.showErrors(form, errs, 'Please complete the report')) { return; }
      submitting = true;
      var res = state.createSupportTicket({
        kind: ctx.kind, id: ctx.id, name: ctx.name,
        roleLabel: ctx.roleLabel, tenantId: ctx.tenantId || null
      }, fields);
      if (!res.ok) { submitting = false; ui.showErrors(form, res.errors, 'Please complete the report'); return; }
      /* "Recorded … in the queue" rather than "now with the platform
         team": the record IS what `state.openSupportTickets()` hands the
         Super Admin, and "now with" can be read as "has been sent to" —
         nothing is sent anywhere. */
      clearPick('');
      ui.toast('Issue ' + res.ticket.id + ' recorded. It is now in the platform team’s queue.');
      XRSLP.render(false);
    });
  }

  return {
    href: href, statusBadge: statusBadge,
    ticketList: ticketList, reportForm: reportForm, honestyPanel: honestyPanel,
    ticketMediaHTML: ticketMediaHTML,
    helpScreen: helpScreen, bindHelp: bindHelp
  };
})();
