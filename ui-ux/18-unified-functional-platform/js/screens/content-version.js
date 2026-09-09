/* ============================================================
   Unified Functional Platform — LATER VERSIONS of already-published
   content.

     current released version
        →  Vendor proposes a later version
        →  Academic Reviewer approves it
        →  SUPER ADMIN releases or holds it        ← the only step that
                                                     changes what the
                                                     public sees

   ── THE TERMINOLOGY FIREWALL, ON THESE SCREENS ───────────────
   The word PUBLISH appears nowhere in this file as an action. First
   publication of a NEW Experiment is the Content Manager's, and it acts
   on the content record. RELEASE / HOLD is the Super Admin's, and it
   acts on a version candidate. Two actions, two objects, two words.

   ── WHY THE CONTENT MANAGER IS NOT A GATE HERE ───────────────
   ⚠ IMPLEMENTATION JUDGEMENT, recorded as one. The confirmed path is
   "current released version → newer APPROVED version → SUPER ADMIN
   Release / Hold". The Vendor owns "version submissions" and the
   Academic Reviewer owns "the academic review decision", which supplies
   the approval. The Content Manager's confirmed authority is first
   approval and first publication — the FIRST instance — and no source
   places them on the later-version path. Since "no additional approval
   gates may be invented", the conservative reading is to leave them
   out rather than in. The Content Manager still sees every version in
   the Content Library, read-only.

   ── WHAT A LATER VERSION MAY CARRY ───────────────────────────
   Version label, catalogue summary and description, vendor notes and
   per-technology delivery references. It CANNOT change which
   technologies the Experiment offers: no source states what should
   happen to a tenant that already holds a technology a newer version
   drops, and the prototype does not offer an action whose consequence
   it cannot state honestly. Recorded as an open policy question.
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
  var VS = state.VERSION_STATUS;

  function versionBadge(v) {
    var m = state.versionStatusMeta(v.status);
    return ui.badge(m.badge, m.icon, m.label);
  }

  /* ---------- the release chain, as a stepper ----------
     Implementation 08. The twin of `cui.productionTrack()`, for the
     OTHER object: a version candidate does not travel the publication
     chain, it travels the release chain, and the two must never look
     alike. Four steps ending in Release / Hold — the Super Admin's, and
     named as theirs on every step where it matters.

     Derived from `v.status` alone, so it reports and never decides. */
  /* `raisedByRole` is declared below; a function declaration hoists, so
     this is safe — and it is named here so a reader does not have to
     take that on trust. */
  function versionTrack(v) {
    var s = v.status;
    var proposed = 'done', academic = 'todo', decision = 'todo', out = 'todo';
    if (s === VS.DRAFT) { proposed = 'live'; }
    else if (s === VS.ACADEMIC_REVIEW) { academic = 'live'; }
    else if (s === VS.CHANGES_ACADEMIC) { proposed = 'blocked'; }
    else if (s === VS.APPROVED) { academic = 'done'; decision = 'live'; }
    else if (s === VS.HELD) { academic = 'done'; decision = 'blocked'; }
    else if (s === VS.RELEASED) { academic = 'done'; decision = 'done'; out = 'done'; }
    /* ⚠ THE ACTOR COMES FROM THE CANDIDATE — Implementation 09 QA.
       Every one of these three lines named the Vendor, so a correction
       raised by a Content Manager was described on the Academic
       Reviewer's own screen as *"Submitted by the Vendor"* — a plainly
       false statement about who did the work, on the surface where the
       reader most needs to know. `createCorrectionVersion` has recorded
       the provenance since it was written; nothing read it here. */
    var who = raisedByRole(v);
    var isCorrection = v.origin === 'content-manager';
    return ui.track([
      { t: isCorrection ? 'Correction proposed' : 'Version proposed',
        d: s === VS.DRAFT ? 'With you — not yet submitted'
        : s === VS.CHANGES_ACADEMIC ? 'Returned to the ' + who + ' to correct'
        : 'Submitted by the ' + who, state: proposed },
      { t: 'Academic review', d: 'The Academic Reviewer approves it or asks for changes', state: academic },
      { t: 'Release / Hold', d: s === VS.HELD ? 'Held by the Super Admin'
        : 'The Super Admin’s decision', state: decision },
      { t: 'Released', d: s === VS.RELEASED ? 'This is the version the catalogue shows'
        : 'The catalogue keeps the current version until then', state: out }
    ]);
  }

  /* Who the version is WITH — the first question every workspace asks. */
  function holderLine(v, audience) {
    switch (v.status) {
      case VS.DRAFT:
        return audience === 'vendor' ? 'With you — not yet submitted' : 'With the Vendor (draft)';
      case VS.ACADEMIC_REVIEW:
        return audience === 'reviewer' ? 'With you — awaiting your academic decision' : 'With the Academic Reviewer';
      case VS.CHANGES_ACADEMIC:
        return audience === 'vendor' ? 'With you — correct and resubmit' : 'Returned to the Vendor for correction';
      case VS.APPROVED:
        return 'With the Super Admin — awaiting the Release / Hold decision';
      case VS.RELEASED:
        return 'Released' + (v.releaseDecision ? ' ' + util.fmtDate(v.releaseDecision.at) : '');
      case VS.HELD:
        return 'Held by the Super Admin — the published version stays live';
      default:
        return '';
    }
  }

  /* The holder line answers "where is this?" — but for the VENDOR
     audience it also tells them what to do next, and after a scope
     withdrawal that instruction is false: the candidate is still with
     them, and they can no longer correct or resubmit it. The shared
     `holderLine()` keeps its exact wording for every other audience —
     the reviewer queue and the Content Library read it too — so only
     the Vendor's own view learns the extra fact. */
  function vendorHolderLine(v, actorId) {
    if (state.versionScopeWithdrawn(v, actorId)) {
      if (v.status === VS.DRAFT) { return 'With you — read-only, outside your assigned scope'; }
      if (v.status === VS.CHANGES_ACADEMIC) {
        return 'Returned to you — read-only, outside your assigned scope';
      }
    }
    return holderLine(v, 'vendor');
  }

  /* ---------- the per-technology delivery editor ----------
     Exactly the fields each technology actually uses: a hosted link for
     Web, a package reference for AR / VR / MR (STK31-37). A field is
     never asked of a technology that does not use it, and the
     technology SET itself is fixed — this edits references, not
     availability. */
  function deliveryFields(rec, v) {
    return '<div class="techrows deliv">' + data.sortTech(rec.technologies).map(function (t) {
      var def = data.TECHNOLOGIES[t];
      var cur = (v && v.delivery && v.delivery[t]) ? v.delivery[t] : state.deliveryOf(rec, t);
      var idp = 'vd-' + t;
      var body = def.delivery === 'hosted'
        ? '<div class="field" id="' + idp + '-url"><label for="' + idp + '-url-i">Hosted link</label>' +
          '<input type="text" id="' + idp + '-url-i" value="' + esc(cur.url || '') + '" autocomplete="off"></div>'
        : '<div class="field" id="' + idp + '-lab"><label for="' + idp + '-lab-i">Package label</label>' +
          '<input type="text" id="' + idp + '-lab-i" value="' + esc(cur.packageLabel || '') + '" autocomplete="off"></div>' +
          '<div class="field" id="' + idp + '-ref"><label for="' + idp + '-ref-i">Package reference</label>' +
          '<input type="text" id="' + idp + '-ref-i" value="' + esc(cur.packageRef || '') + '" autocomplete="off"></div>';
      return '<div class="tr-block">' +
        '<div class="tr-h">' + ui.fmtBadge(t) + '<span class="tr-n">' + esc(def.name) + '</span>' +
        '<span class="tr-d">' + esc(def.deliveryLabel) + '</span></div>' +
        body +
        '<div class="field" id="' + idp + '-run"><label for="' + idp + '-run-i">Device / runtime requirement</label>' +
        '<input type="text" id="' + idp + '-run-i" value="' + esc(cur.runtime || '') + '" autocomplete="off"></div>' +
        '</div>';
    }).join('') + '</div>' +
      /* ⚠ OPEN POLICY QUESTION, recorded here rather than on screen.
         The form cannot add or remove a TECHNOLOGY because no source
         states what should happen to a tenant that already holds a
         technology a newer version would drop. That is requirements
         traceability, not something a Vendor filling in this form acts
         on; the rule itself is what they need, so the rule is what the
         line says. Also recorded in this file's header. */
      '<p class="cardfoot">References only — nothing is uploaded. A later version cannot add or remove a ' +
      'technology: a release never changes which technologies an Experiment offers.</p>';
  }

  function readDelivery(rec) {
    var out = {};
    rec.technologies.forEach(function (t) {
      var def = data.TECHNOLOGIES[t];
      var idp = 'vd-' + t;
      function val(id) { var el = document.getElementById(id); return el ? el.value : ''; }
      var row = { runtime: val(idp + '-run-i') };
      if (def.delivery === 'hosted') { row.url = val(idp + '-url-i'); }
      else { row.packageLabel = val(idp + '-lab-i'); row.packageRef = val(idp + '-ref-i'); }
      out[t] = row;
    });
    return out;
  }

  /* The SAME per-technology references, rendered as facts rather than
     as inputs. A candidate that has become read-only — because someone
     else is holding it, or because the Vendor's scope was withdrawn —
     must still show everything it holds. Withdrawing authority to change
     a record is not permission to show its owner less of it. */
  /* WHAT A RELEASE WOULD ACTUALLY WRITE — the same merge `releaseVersion`
     performs, not the candidate object on its own. A candidate carries
     only the fields the version form offers, and a BLANK field means
     "leave the published value alone" (the release skips empty strings
     deliberately, so an untouched field cannot blank a working link).
     Rendering the raw candidate therefore showed an em-dash where the
     published value would in fact survive — and this card is read by the
     two people deciding whether to approve and release it. */
  function mergedDelivery(rec, v, tech) {
    /* ⚠ A WITHDRAWAL IS NOT AN ABSENT VALUE — Implementation 09.
       `releaseVersion` skips empty incoming values so an untouched
       technology carries its published values forward, and this
       function mirrors that so the decision surface shows what a
       release would actually produce. A Content Manager's correction
       can also WITHDRAW a reference, and that is an instruction rather
       than an absent value — recorded in `v.removals`. Without this
       branch the Academic Reviewer and the Super Admin would be shown
       the link that the release is about to remove, and would be
       approving one thing while reading another. */
    if (isWithdrawn(v, tech)) { return {}; }
    var current = state.deliveryOf(rec, tech) || {};
    var incoming = (v && v.delivery && v.delivery[tech]) || null;
    var merged = {};
    Object.keys(current).forEach(function (k) { merged[k] = current[k]; });
    if (incoming) {
      Object.keys(incoming).forEach(function (k) {
        var val = incoming[k];
        if (typeof val === 'string' && !val.trim()) { return; }
        if (val === null || val === undefined) { return; }
        merged[k] = val;
      });
    }
    clearedFields(v, tech).forEach(function (k) { delete merged[k]; });
    return merged;
  }
  function isWithdrawn(v, tech) {
    return !!(v && v.removals && v.removals.indexOf(tech) !== -1);
  }
  /* Fields this version will CLEAR on that technology — a blanked
     runtime requirement, say, rather than a whole withdrawal. Shown for
     the same reason the withdrawal is: the merge cannot express a
     clear, so a reader would otherwise see the value that is about to
     go. */
  function clearedFields(v, tech) {
    return (v && v.clears && v.clears[tech]) ? v.clears[tech] : [];
  }

  function deliveryReadOnly(rec, v) {
    return '<div class="techrows deliv">' + data.sortTech(rec.technologies).map(function (t) {
      var def = data.TECHNOLOGIES[t];
      var cur = mergedDelivery(rec, v, t);
      var rows = def.delivery === 'hosted'
        ? '<div class="k">Hosted link</div><div class="v">' + esc(cur.url || '—') + '</div>'
        : '<div class="k">Package label</div><div class="v">' + esc(cur.packageLabel || '—') + '</div>' +
          '<div class="k">Package reference</div><div class="v">' + esc(cur.packageRef || '—') + '</div>';
      return '<div class="tr-block">' +
        '<div class="tr-h">' + ui.fmtBadge(t) + '<span class="tr-n">' + esc(def.name) + '</span>' +
        '<span class="tr-d">' + esc(def.deliveryLabel) + '</span></div>' +
        /* Said before the fields, not after them: a row of em-dashes on
           its own reads as "the Vendor supplied nothing", which is a
           different decision from "this version withdraws it". */
        (isWithdrawn(v, t)
          ? '<p class="cardlede">' + ui.ic('alert', 'sm') +
            ' <strong>This version withdraws the ' + esc(def.label) + ' delivery reference.</strong> ' +
            'If it is released, the platform will hold nothing for ' + esc(def.label) +
            ' until a replacement is recorded. ' + esc(def.label) +
            ' stays on the experiment — a version never removes a technology.</p>'
          : clearedFields(v, t).length
          ? '<p class="cardlede">' + ui.ic('alert', 'sm') +
            ' <strong>This version clears ' + esc(clearedFields(v, t).join(', ')) + ' for ' +
            esc(def.label) + '.</strong> Those values are shown as empty below because that is what a ' +
            'release would leave.</p>'
          : '') +
        '<div class="kv">' + rows +
        '<div class="k">Device / runtime</div><div class="v">' + esc(cur.runtime || '—') + '</div>' +
        '</div></div>';
    }).join('') + '</div>';
  }

  function versionFormFields(rec, v) {
    return '<div class="field" id="vv-label"><label for="vv-label-i">Version label ' +
      '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
      '<input type="text" id="vv-label-i" maxlength="40" autocomplete="off" value="' +
      esc(v ? v.versionLabel : '') + '">' +
      '<p class="hint">The published version is currently <strong>' + esc(rec.versionLabel || '—') +
      '</strong>. This label is what the catalogue would show if the Super Admin releases this version. ' +
      'It is a different thing from the correction-round number on a submission.</p></div>' +
      '<div class="field" id="vv-change"><label for="vv-change-i">What changed in this version ' +
      '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
      '<textarea id="vv-change-i" rows="3">' + esc(v ? v.changeNote : '') + '</textarea>' +
      '<p class="hint">Read by the Academic Reviewer and by the Super Admin making the Release / Hold decision.</p></div>' +
      '<div class="field" id="vv-summary"><label for="vv-summary-i">Catalogue summary</label>' +
      '<textarea id="vv-summary-i" rows="2">' + esc(v ? v.summary : rec.summary) + '</textarea></div>' +
      '<div class="field" id="vv-description"><label for="vv-description-i">Catalogue description ' +
      '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
      '<textarea id="vv-description-i" rows="6">' + esc(v ? v.description : rec.description) + '</textarea></div>' +
      '<div class="field" id="vv-notes"><label for="vv-notes-i">Technical notes</label>' +
      '<textarea id="vv-notes-i" rows="3">' + esc(v ? v.vendorNotes : '') + '</textarea></div>';
  }

  function readVersionFields(rec) {
    function val(id) { var el = document.getElementById(id); return el ? el.value : ''; }
    return {
      versionLabel: val('vv-label-i'),
      changeNote: val('vv-change-i'),
      summary: val('vv-summary-i'),
      description: val('vv-description-i'),
      vendorNotes: val('vv-notes-i'),
      delivery: readDelivery(rec)
    };
  }

  /* ============================================================
     VENDOR — propose, edit and submit a later version.
     ============================================================ */
  function vendorActor(params) {
    var a = state.contentActor(params.actorId);
    return (a && a.role === state.CONTENT_ROLE.VENDOR) ? a : null;
  }

  XRSLP.screens.vendorNewVersion = function (params) {
    var actor = vendorActor(params);
    var rec = state.contentRecord(params.recordId);
    if (!actor || !state.vendorCanVersion(rec, actor.id)) { return XRSLP.screens.notFound(); }
    var existing = state.openVersionForRecord(rec.id);
    if (existing) { return { redirect: href.vVersion(actor.id, existing.id) }; }

    var html =
      ui.crumbs([{ label: 'Versions', href: href.vVersions(actor.id) }, { label: 'New version' }]) +
      ui.phead('New version of ' + rec.name,
        'Current published version ' + esc(rec.versionLabel || '—')) +
      '<div class="formwrap">' +
      '<form id="vv-form" novalidate>' +
      '<div class="form-errors"></div>' +
      ui.card('The version', versionFormFields(rec, null), null, 'h2') +
      ui.card('Technology delivery', deliveryFields(rec, null), null, 'h2') +
      '<div class="formact">' +
      '<button class="btn pri" type="submit">Save the version</button>' +
      '<a class="btn sec" href="' + href.vVersions(actor.id) + '">Cancel</a>' +
      '<span class="formnote">Saving keeps it with you. It reaches the Academic Reviewer only when you ' +
      'submit it, and the public catalogue does not change until the Super Admin releases it.</span>' +
      '</div></form>' +
      '<div class="formaside">' +
      /* THE FIREWALL IS THE POINT OF THIS ASIDE, so it leads it — but it
         is not a GAP. `ui.gapNote` prints a shouty uppercase tag that
         means "this is not built", and the later-version workflow is
         fully built: a Vendor proposes, a Reviewer approves, the Super
         Admin releases or holds. The wording is kept identical to
         `cui.publishedNextVersionNote()` so there is one canonical
         statement of the rule across the whole build. */
      ui.alertBox('info', 'A later version is a different decision',
        '<p>First publication of a <em>new</em> Experiment is the Content Manager&rsquo;s and uses the word ' +
        '<strong>publish</strong>. This is a later version of content that is already published, and its ' +
        'decision is the Super Admin&rsquo;s <strong>Release / Hold</strong> — a different action on a ' +
        'different object.</p>') +
      ui.card('What happens to this version',
        ui.track([
          { t: 'You propose it', d: 'Saved here, with you', state: 'live' },
          { t: 'Academic review', d: 'Approved, or returned to you', state: 'todo' },
          { t: 'Release / Hold', d: 'The Super Admin decides', state: 'todo' }
        ]) +
        '<p class="cardfoot">Until a release, <strong>version ' + esc(rec.versionLabel || '—') +
        '</strong> stays the version everybody sees — in the public catalogue, in every institution that ' +
        'holds this experiment, and for every student using it.</p>', null, 'h2') +
      '</div></div>';

    return {
      title: 'New version', html: html, area: 'vendor', navKey: 'versions', contentActor: actor,
      after: function () {
        var form = document.getElementById('vv-form');
        if (!form) { return; }
        var busy = false;
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          if (busy) { return; }
          busy = true;
          var res = state.createContentVersion(actor.id, rec.id, readVersionFields(rec));
          if (!res.ok) { busy = false; ui.showErrors(form, res.errors, 'Please correct the version'); return; }
          ui.toast('Version ' + res.version.versionLabel + ' saved. It is with you until you submit it.');
          XRSLP.router.go(href.vVersion(actor.id, res.version.id));
        });
      }
    };
  };

  XRSLP.screens.vendorVersions = function (params) {
    var actor = vendorActor(params);
    if (!actor) { return XRSLP.screens.notFound(); }
    var mine = state.versionsForVendor(actor.id);

    /* Published experiments this Vendor is assigned to — the only ones a
       later version can exist for. */
    var candidates = state.contentRecords().filter(function (rec) {
      return state.vendorCanVersion(rec, actor.id);
    });

    var list = mine.length
      ? '<div class="tscroll"><table class="dt">' +
        '<caption class="sr-only">Later versions you have submitted</caption>' +
        '<thead><tr><th scope="col">Version</th><th scope="col">Experiment</th>' +
        /* 07.3 — "With" was `holderLine()`, derived from the same status
           the State badge shows. Duplicate column removed. */
        '<th scope="col">Replaces</th><th scope="col">State</th>' +
        '<th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' +
        mine.map(function (v) {
          var rec = state.contentRecord(v.recordId);
          return '<tr>' +
            '<td data-label="Version"><a class="rowlink" href="' + href.vVersion(actor.id, v.id) + '">' +
            '<span class="tmain">' + esc(v.versionLabel) + '</span>' +
            '<span class="tsub">' + esc(util.fmtDate(v.createdAt)) + '</span></a></td>' +
            '<td data-label="Experiment">' + esc(rec ? rec.name : v.recordId) + '</td>' +
            '<td data-label="Replaces">' + esc(v.replacesVersionLabel || '—') + '</td>' +
            '<td data-label="State">' + versionBadge(v) + '</td>' +
            '<td class="cell-actions"><a class="btn sm sec" href="' + href.vVersion(actor.id, v.id) + '">Open</a></td>' +
            '</tr>';
        }).join('') + '</tbody></table></div>'
      : ui.emptyState({
          icon: 'layers', heading: 'h3',
          title: 'You have not submitted a later version',
          body: 'A later version applies to content that is already published. Choose one of your published ' +
            'experiments below to propose one.'
        });

    var startList = candidates.length
      ? '<ul class="reslist plain">' + candidates.map(function (rec) {
          var open = state.openVersionForRecord(rec.id);
          return '<li>' + ui.ic('flask') +
            '<span><strong>' + esc(rec.name) + '</strong> <span class="muted">· published version ' +
            esc(rec.versionLabel || '—') + '</span></span>' +
            /* A candidate belongs to the Vendor who created it. Linking to
               someone else's would land on a not-found; saying whose it is
               is both true and more useful. */
            (open && open.createdBy === actor.id
              ? '<a class="btn sm sec" href="' + href.vVersion(actor.id, open.id) + '">Version in progress</a>'
              : open
              ? '<span class="muted">Version ' + esc(open.versionLabel) + ' is in the workflow, submitted by ' +
                esc(open.createdByName) + '</span>'
              : '<a class="btn sm pri" href="' + href.vNewVersion(actor.id, rec.id) + '">Propose a version</a>') +
            '</li>';
        }).join('') + '</ul>'
      : '<p class="muted">' + (state.actorCreateCourseIds(actor.id).length || state.actorCourseIds(actor.id).length
          ? 'None of the experiments in your assigned scope is published yet. A later version only exists ' +
            'for content that has already been published.'
          : 'No Course is assigned to you at the moment, so there is no published experiment you can propose ' +
            'a later version for. Any version you have already created is still listed above, and is kept ' +
            'exactly as it is.') + '</p>';

    var submitted = mine.filter(function (v) { return v.status !== VS.DRAFT; }).length;
    var released = mine.filter(function (v) { return v.status === VS.RELEASED; }).length;
    var html =
      ui.phead('Versions', ui.metrics([
        { v: mine.length, k: 'later ' + util.plural(mine.length, 'version') },
        { v: mine.length - submitted, k: 'not yet submitted' },
        { v: released, k: 'released', tone: released ? 'good' : null }
      ])) +
      /* THE THREE-STEP CHAIN, AS A STEPPER RATHER THAN A "GAP".
         `ui.gapNote` prints an uppercase tag that means "this is not
         built"; this workflow is fully built, and what the reader
         actually needs is who does what, in order. The firewall it was
         carrying — a later version is Released or Held, never published
         — is in the line beneath it. */
      ui.track([
        { t: 'You propose a version', d: 'Of an experiment already published', state: 'done' },
        { t: 'Academic review', d: 'The Academic Reviewer approves it or asks for changes', state: 'todo' },
        { t: 'Release or Hold', d: 'The Super Admin decides — nobody publishes a later version', state: 'todo' }
      ]) +
      '<p class="dnote" style="margin-top:10px">' + ui.ic('info', 'sm') +
      '<span>The published version does not change until the Super Admin releases a later one.</span></p>' +
      '<div class="stack" style="margin-top:18px">' +
      ui.card('Your later versions', list, null, 'h2') +
      ui.card('Published experiments you can propose a version for', startList +
        '<p class="cardfoot">Only one later version of an experiment can be in the workflow at a time, so two ' +
        'candidates can never race for the same public version.</p>', null, 'h2') +
      '</div>';

    return { title: 'Versions', html: html, area: 'vendor', navKey: 'versions', contentActor: actor };
  };

  XRSLP.screens.vendorVersion = function (params) {
    var actor = vendorActor(params);
    var v = state.contentVersion(params.versionId);
    if (!actor || !v || v.createdBy !== actor.id) { return XRSLP.screens.notFound(); }
    var rec = state.contentRecord(v.recordId);
    if (!rec) { return XRSLP.screens.notFound(); }
    /* A candidate follows exactly the rule a first submission does.
       VIEWING it is ownership — the gate above — so it stays reachable,
       listed and fully legible whatever the Vendor's scope is now.
       CHANGING it needs a live assignment covering the Experiment, so a
       withdrawn scope makes it read-only: no Save, no Submit, no
       rewriting of the catalogue metadata or the per-technology package
       and hosted-link references a release would carry into published
       content. Restoring the scope brings both back. */
    var editable = state.versionEditableByVendor(v, actor.id);
    var canSubmit = state.versionSubmittableByVendor(v, actor.id);
    var scopeGone = state.versionScopeWithdrawn(v, actor.id);

    var editor = editable
      ? '<form id="vv-form" novalidate>' +
        '<div class="form-errors"></div>' +
        versionFormFields(rec, v) +
        '<h3 class="vh">Technology delivery</h3>' +
        deliveryFields(rec, v) +
        '<div class="formact">' +
        '<button class="btn sec" type="submit">Save changes</button>' +
        (canSubmit
          ? '<button class="btn pri" type="button" id="vv-submit">' +
            (v.status === VS.CHANGES_ACADEMIC ? 'Resubmit for academic review' : 'Submit for academic review') +
            '</button>' +
            '<span class="formnote">Submitting hands it to the Academic Reviewer. It does not publish anything ' +
            'and does not change the version anyone sees.</span>'
          : '') +
        '</div></form>'
      : '<div class="kv">' +
        '<div class="k">Version label</div><div class="v">' + esc(v.versionLabel) + '</div>' +
        '<div class="k">Replaces</div><div class="v">' + esc(v.replacesVersionLabel || '—') + '</div>' +
        '<div class="k">What changed</div><div class="v">' + esc(v.changeNote) + '</div>' +
        '<div class="k">Catalogue summary</div><div class="v">' + esc(v.summary || '—') + '</div>' +
        '<div class="k">Description</div><div class="v">' + esc(v.description) + '</div>' +
        '<div class="k">Technical notes</div><div class="v">' + esc(v.vendorNotes || '—') + '</div>' +
        '</div>' +
        '<h3 class="vh">Technology delivery</h3>' +
        deliveryReadOnly(rec, v) +
        /* The reason has to be the TRUE one. A decided version — released
           or held — is not "with a reviewer", and saying so sent the
           Vendor looking for a reviewer who had already finished. */
        '<p class="cardfoot">' + (scopeGone
          ? 'Read-only because this experiment is no longer in your assigned scope. Everything you wrote is ' +
            'kept exactly as it is.'
          : v.status === VS.RELEASED
          ? 'Read-only because this version has been <strong>released</strong>. It is the version the public ' +
            'catalogue now shows, and a released version is never edited — a further change is a new later ' +
            'version, which you can propose from Versions.'
          /* ⚠ WHAT LIFTING A HOLD ACTUALLY DOES. This said the hold is
             lifted "and released", which is not what
             `returnHeldVersionToDecision()` does: it sets the candidate
             back to APPROVED and clears the release decision, so it
             returns to the Release / Hold queue and may be held again.
             Telling a Vendor that a lift and a release are one step
             promises them an outcome nobody has decided. */
          : v.status === VS.HELD
          ? 'Read-only because the Super Admin has placed this version on <strong>hold</strong>. The published ' +
            'version stays live and nothing you wrote has been lost. While it is held it remains this ' +
            'experiment&rsquo;s one open candidate, so a further version cannot be proposed until the Super ' +
            'Admin lifts the hold — which returns it to the Release / Hold decision rather than releasing it.'
          : v.status === VS.APPROVED
          ? 'Read-only because it has been academically approved and is now with the <strong>Super Admin</strong> ' +
            'for the Release / Hold decision. Nothing you wrote has changed.'
          : 'Read-only while someone else holds it. The revision under review cannot change underneath the ' +
            'person reviewing it.') + '</p>';

    var scopeNote = scopeGone
      ? ui.alertBox('warning', 'This experiment is no longer in your assigned scope',
          '<p>No Course assignment covers <strong>' + esc(rec.name) + '</strong> for you any more, so this ' +
          'version is <strong>read-only</strong>. It cannot be edited, submitted or resubmitted.</p>' +
          '<p><strong>Nothing has been deleted.</strong> The version, its change note, its delivery ' +
          'references and its history are preserved exactly as they were. Editing and submission return if ' +
          'the scope is restored.</p>')
      : '';

    var html =
      ui.crumbs([{ label: 'Versions', href: href.vVersions(actor.id) }, { label: v.versionLabel }]) +
      ui.phead(rec.name + ' — version ' + v.versionLabel, esc(vendorHolderLine(v, actor.id)), null,
        ' ' + versionBadge(v)) +
      versionTrack(v) +
      (scopeNote ? '<div style="margin-top:14px">' + scopeNote + '</div>' : '') +
      '<div class="grid-rail" style="margin-top:18px">' +
      '<div class="stack">' + ui.card('This version', editor, null, 'h2') + '</div>' +
      '<div class="stack">' +
      ui.card('Currently published',
        '<div class="kv">' +
        '<div class="k">Experiment</div><div class="v">' + esc(rec.name) + '</div>' +
        '<div class="k">Live version</div><div class="v"><strong>' + esc(rec.versionLabel || '—') + '</strong></div>' +
        '<div class="k">Technologies</div><div class="v">' + ui.techBadges(rec.technologies) + '</div>' +
        '</div>' +
        '<p class="cardfoot">Unchanged, and it stays unchanged until the Super Admin releases a later version.</p>',
        null, 'h2') +
      ui.card('History', versionHistory(v), null, 'h2') +
      '</div></div>';

    return {
      title: rec.name + ' — version ' + v.versionLabel, html: html,
      area: 'vendor', navKey: 'versions', contentActor: actor,
      after: function () {
        var form = document.getElementById('vv-form');
        if (!form) { return; }
        var busy = false;
        function save() {
          var res = state.updateContentVersion(actor.id, v.id, readVersionFields(rec));
          if (!res.ok) { ui.showErrors(form, res.errors, 'Please correct the version'); return null; }
          return res.version;
        }
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          if (busy) { return; }
          busy = true;
          var out = save();
          busy = false;
          if (!out) { return; }
          ui.toast('Version ' + out.versionLabel + ' saved.');
          XRSLP.render(false);
        });
        var sub = document.getElementById('vv-submit');
        if (sub) {
          sub.addEventListener('click', function () {
            if (busy) { return; }
            busy = true;
            var out = save();
            if (!out) { busy = false; return; }
            ui.openDialog({
              title: 'Submit version ' + out.versionLabel + ' for academic review?',
              bodyHTML: '<p>It goes to the Academic Reviewer assigned to <strong>' + esc(rec.name) +
                '</strong>, and becomes read-only for you while they hold it.</p>' +
                '<div class="consequence">' + ui.ic('info') + '<span>This does not publish anything. The ' +
                'public catalogue stays on version <strong>' + esc(rec.versionLabel || '—') +
                '</strong> until the Super Admin releases a later one.</span></div>',
              okLabel: 'Submit for review',
              onConfirm: function () {
                state.submitContentVersion(actor.id, v.id);
                ui.toast('Version submitted for academic review.');
                XRSLP.render(false);
              }
            });
            busy = false;
          });
        }
      }
    };
  };

  /* ---------- shared history renderer ---------- */
  function versionHistory(v) {
    if (!v.history || !v.history.length) { return '<p class="muted">No history has been recorded.</p>'; }
    var DOT = { created: 'edit', submitted: 'arrowR', resubmitted: 'arrowR', metadata: 'edit',
                changes: 'alert', approved: 'check', released: 'check', held: 'minus', reopened: 'clock' };
    return '<div class="timeline">' + v.history.map(function (h) {
      var cls = h.kind === 'changes' || h.kind === 'held' ? 'warn'
        : h.kind === 'approved' || h.kind === 'released' ? 'good' : 'info';
      return '<div class="tl-item"><span class="tl-dot ' + cls + '">' + ui.ic(DOT[h.kind] || 'circle') + '</span>' +
        '<div class="tl-body"><div class="tl-action">' + esc(h.label) + '</div>' +
        '<div class="tl-who">' + esc(h.actorName || 'Super Admin') +
        (h.actorRole ? ' · ' + esc(h.actorRole) : '') + ' · ' + esc(util.fmtDateTime(h.at)) + '</div>' +
        (h.note ? '<p class="tl-note">' + esc(h.note) + '</p>' : '') +
        '</div></div>';
    }).join('') + '</div>';
  }

  /* ============================================================
     ACADEMIC REVIEWER — the academic decision on a later version.

     The reviewer approves or asks for changes. Approving does NOT
     release: it hands the version to the Super Admin, and says so.
     ============================================================ */
  XRSLP.screens.reviewerVersion = function (params) {
    var actor = state.contentActor(params.actorId);
    if (!actor || actor.role !== state.CONTENT_ROLE.REVIEWER) { return XRSLP.screens.notFound(); }
    var v = state.contentVersion(params.versionId);
    if (!v) { return XRSLP.screens.notFound(); }
    var rec = state.contentRecord(v.recordId);
    /* Scope is read from the LIVE role assignments, so a reviewer whose
       scope has been withdrawn cannot reach new work here either — and
       the status is checked as well, so a Vendor's UNSUBMITTED draft
       candidate is not readable through a hand-typed address. The queue
       already excludes drafts; the queue is not the boundary. */
    if (!rec || !state.reviewerCanViewVersion(v, actor.id)) { return XRSLP.screens.notFound(); }
    var canAct = state.reviewerCanActOnVersion(v, actor.id);

    var decision = canAct
      ? '<form id="rv-form" novalidate>' +
        '<div class="form-errors"></div>' +
        '<div class="field" id="rv-comment"><label for="rv-comment-i">Comment</label>' +
        '<textarea id="rv-comment-i" rows="4"></textarea>' +
        '<p class="hint">Required when you ask for changes; optional when you approve.</p></div>' +
        '<div class="decidebar">' +
        '<span class="db-note">Approving hands the version to the <strong>Super Admin</strong>, who decides ' +
        'whether to release it or hold it. Approving does not release it, and the published version does not ' +
        'change here.</span>' +
        '<button class="btn sec" type="button" id="rv-changes">Request changes</button>' +
        '<button class="btn pri" type="button" id="rv-approve">' + ui.ic('check') + 'Approve version</button>' +
        '</div></form>'
      : '<div class="decidebar"><span class="db-note">' + esc(holderLine(v, 'reviewer')) + '</span></div>';

    var html =
      ui.crumbs([{ label: 'Review queue', href: href.rQueue(actor.id) },
                 { label: rec.name + ' — version ' + v.versionLabel }]) +
      ui.phead(rec.name + ' — version ' + v.versionLabel,
        esc(holderLine(v, 'reviewer')), null, ' ' + versionBadge(v)) +
      /* The SAME stepper the Vendor sees on the same candidate, so both
         people reading this version read one picture of where it is —
         and so the Release / Hold step is visibly the Super Admin's on
         the screen where an Academic Reviewer might otherwise think
         approving is the last word. */
      versionTrack(v) +
      '<div class="grid-rail" style="margin-top:18px">' +
      '<div class="stack">' +
      '<section class="card"><div class="chead"><h2>What this version proposes</h2></div>' +
      '<div class="cbody">' +
      '<div class="kv">' +
      '<div class="k">Version label</div><div class="v">' + esc(v.versionLabel) + '</div>' +
      '<div class="k">Replaces</div><div class="v">' + esc(v.replacesVersionLabel || '—') + '</div>' +
      '<div class="k">Submitted by</div><div class="v">' + raisedByLine(v) + correctionChip(v) + '</div>' +
      '<div class="k">What changed</div><div class="v">' + esc(v.changeNote) + '</div>' +
      '</div>' +
      '<h3 class="vh">Description</h3><p class="vd-d">' + esc(v.description) + '</p>' +
      (v.vendorNotes ? '<h3 class="vh">Technical notes</h3><p class="vd-d">' + esc(v.vendorNotes) + '</p>' : '') +
      /* THE DELIVERY THE VERSION CARRIES, shown to the person deciding on
         it. A release writes these references onto the published record,
         so approving a version without seeing them was approving
         something unseen. The Vendor owns them (STK31-08) and the
         Reviewer cannot change them — this is context for the academic
         decision, exactly as the technical delivery is on a first
         submission. */
      /* ⚠ TERMINOLOGY. This heading read "…this version would publish".
         A later version is never published by anyone: it is RELEASED or
         HELD by the Super Admin, and the file header two hundred lines
         above states that the word publish appears nowhere here as an
         action. The paragraph immediately below it already had it right,
         which is how the heading survived. */
      /* ── Implementation 09 QA — WHAT ACTUALLY CHANGES ────────
         The reviewer could see the proposed value and had to work out
         for themselves whether it differed from the live one. The
         comparison comes first now, because it is the decision; the
         full delivery block stays beneath it as the context it always
         was. */
      '<h3 class="vh">What this version changes</h3>' +
      versionDiffHTML(rec, v, { hideReason: true }) +
      '<h3 class="vh">Technology delivery a release would write</h3>' +
      deliveryReadOnly(rec, v) +
      '<p class="cardfoot">The Vendor owns these technical references; they are shown here as ' +
      'context and cannot be edited from this screen. Releasing this version writes them onto the ' +
      'published Experiment.</p>' +
      decision +
      '</div></section>' +
      ui.card('Learning Outcomes — unchanged by a later version',
        XRSLP.contentUI.outcomesList(rec.outcomes) +
        '<p class="cardfoot">Learning Outcomes are academically owned and belong to the Experiment, not to a ' +
        'version, so a later version never changes them and there is nothing to edit here. They were authored ' +
        'and approved on the original submission; a published Experiment&rsquo;s outcomes are not reopened by ' +
        'this decision.</p>', null, 'h2') +
      '</div>' +
      '<div class="stack">' +
      ui.card('Currently published',
        '<div class="kv">' +
        '<div class="k">Live version</div><div class="v"><strong>' + esc(rec.versionLabel || '—') + '</strong></div>' +
        '<div class="k">Description</div><div class="v">' + esc(rec.description) + '</div>' +
        '</div>' +
        '<p class="cardfoot">This is what everyone sees today, and what they keep seeing until the Super ' +
        'Admin releases a later version.</p>', null, 'h2') +
      ui.card('History', versionHistory(v), null, 'h2') +
      '</div></div>';

    return {
      title: rec.name + ' — version ' + v.versionLabel, html: html,
      area: 'review', navKey: 'queue', contentActor: actor,
      after: function () {
        var form = document.getElementById('rv-form');
        if (!form) { return; }
        var ap = document.getElementById('rv-approve');
        if (ap) {
          ap.addEventListener('click', function () {
            var note = (document.getElementById('rv-comment-i') || {}).value || '';
            ui.openDialog({
              title: 'Approve version ' + v.versionLabel + ' academically?',
              bodyHTML: '<p>The version goes to the <strong>Super Admin</strong> for the Release / Hold decision.</p>' +
                '<div class="consequence">' + ui.ic('info') + '<span>This does not release it. Version ' +
                '<strong>' + esc(rec.versionLabel || '—') + '</strong> stays the published version until the ' +
                'Super Admin decides otherwise.</span></div>',
              okLabel: 'Approve version',
              onConfirm: function () {
                state.approveVersionAcademic(actor.id, v.id, note);
                ui.toast('Version approved. It is now with the Super Admin for Release or Hold.');
                XRSLP.render(false);
              }
            });
          });
        }
        var ch = document.getElementById('rv-changes');
        if (ch) {
          ch.addEventListener('click', function () {
            var note = (document.getElementById('rv-comment-i') || {}).value || '';
            if (!String(note).trim()) {
              ui.showErrors(form, [{ field: 'rv-comment', message: 'Say what needs to change before returning it.' }],
                'A comment is required');
              return;
            }
            ui.openDialog({
              title: 'Request changes to version ' + v.versionLabel + '?',
              bodyHTML: '<p>The version returns to <strong>' + esc(v.createdByName) + '</strong> to correct ' +
                'and resubmit. The published version is unaffected.</p>' +
                /* The later-version twin of the two first-submission
                   gates: do not promise a correction the Vendor has no
                   authority to make. */
                (state.versionScopeWithdrawn(v, v.createdBy)
                  ? '<div class="consequence">' + ui.ic('alert') +
                    '<span>' + esc(v.createdByName) + ' no longer holds a role scope covering this ' +
                    'experiment, so they cannot correct or resubmit the version. It will stay returned ' +
                    'until the Super Admin restores their scope.</span></div>'
                  : ''),
              okLabel: 'Request changes',
              onConfirm: function () {
                state.requestChangesVersionAcademic(actor.id, v.id, note);
                ui.toast('Changes requested. The version is back with the Vendor.');
                XRSLP.render(false);
              }
            });
          });
        }
      }
    };
  };

  /* Exposed so the reviewer queue and the Content Library can render the
     same badge and holder line without re-deriving them. */
  /* ── Implementation 09 — WHO RAISED THIS VERSION ──────────────
     `createCorrectionVersion` records `origin: 'content-manager'` so
     the history can never present a Content Manager's correction as a
     Vendor's technical submission — and then every downstream screen
     printed the literal word "Vendor" beside `createdByName` anyway.
     The Super Admin's Release / Hold panel and the Academic Reviewer's
     queue were both telling the two roles who make the decision that a
     correction came from somebody who did not raise it.

     One helper, so the label is derived from the record in every place
     that shows it. */
  function raisedByRole(v) {
    return (v && v.origin === 'content-manager') ? 'Content Manager' : 'Vendor';
  }
  function raisedByLine(v) {
    return esc(v ? (v.createdByName || '') : '') +
      ' <span class="muted">· ' + esc(raisedByRole(v)) + '</span>';
  }
  /* A correction is a different KIND of candidate from a Vendor's later
     version, and a reviewer deciding on one should be able to see which
     they are looking at without opening it. */
  function correctionChip(v) {
    if (!v || v.origin !== 'content-manager') { return ''; }
    return ' ' + ui.badge('b-outline', 'edit', 'Content Manager correction');
  }


  /* ============================================================
     CURRENT → PROPOSED — Implementation 09 QA correction.

     ── WHY THIS EXISTS ──────────────────────────────────────────
     Both people who decide on a later version could see what it
     PROPOSES, and neither could see what it CHANGES. The Academic
     Reviewer read a hosted URL; whether it differed from the live one,
     and how, was theirs to work out by opening another screen and
     comparing two strings by eye. The Super Admin took the release
     decision on the same information.

     A decision surface that shows only the new value is asking someone
     to approve a diff they have not been shown.

     ── WHAT IT DELIBERATELY IS NOT ──────────────────────────────
     ⛔ NOT a side-by-side copy of the whole Experiment. Almost every
     field of a correction is identical to the published record, and a
     wall of unchanged rows is how the two or three that actually moved
     get missed. ONLY changed fields are listed; everything else is
     summarised as unchanged, in one line.

     It reports and never decides: it compares the candidate against
     the published record and renders the difference. `releaseVersion`
     remains the only thing that writes.
     ============================================================ */

  /* One comparison row. `kind` is 'changed' | 'cleared' — a withdrawal
     is not an empty new value, it is a removal, and the two must not
     read alike. */
  function diffRow(label, current, proposed, kind) {
    return { label: label, current: current, proposed: proposed, kind: kind || 'changed' };
  }

  /* Everything a RELEASE of this candidate would actually change on the
     published record. Mirrors `releaseVersion`'s own write rules: it
     merges non-empty values, and applies `clears` afterwards. */
  function versionChanges(rec, v) {
    var out = [];
    if (!rec || !v) { return out; }

    function textDiff(label, now, next) {
      var a = String(now == null ? '' : now).trim();
      var b = String(next == null ? '' : next).trim();
      if (!b || a === b) { return; }          /* empty carries forward — not a change */
      out.push(diffRow(label, a, b, 'changed'));
    }
    textDiff('Description', rec.description, v.description);
    textDiff('Catalogue summary', rec.summary, v.summary);
    textDiff('Vendor notes', rec.vendorNotes, v.vendorNotes);

    var FIELD = {
      url: 'Hosted URL', packageLabel: 'Package label', packageRef: 'Package reference',
      runtime: 'Device / runtime requirement', notes: 'Technical notes',
      install: 'Installation / access notes'
    };
    data.sortTech(rec.technologies || []).forEach(function (t) {
      var def = data.TECHNOLOGIES[t] || {};
      var now = state.deliveryOf(rec, t) || {};
      var incoming = (v.delivery && v.delivery[t]) || {};
      var cleared = (v.clears && v.clears[t]) || [];
      Object.keys(FIELD).forEach(function (k) {
        var a = String(now[k] == null ? '' : now[k]).trim();
        if (cleared.indexOf(k) !== -1) {
          if (a) { out.push(diffRow((def.label || t) + ' · ' + FIELD[k], a, '', 'cleared')); }
          return;
        }
        var raw = incoming[k];
        if (raw === undefined || raw === null) { return; }
        var b = String(raw).trim();
        if (!b || a === b) { return; }
        out.push(diffRow((def.label || t) + ' · ' + FIELD[k], a, b, 'changed'));
      });
    });
    return out;
  }

  /* The count of technologies a release would leave exactly as they
     are — said in one line, so "nothing else moves" is stated rather
     than inferred from an absence. */
  function unchangedTechnologies(rec, v) {
    var changed = {};
    versionChanges(rec, v).forEach(function (d) {
      (rec.technologies || []).forEach(function (t) {
        var def = data.TECHNOLOGIES[t] || {};
        if (d.label.indexOf((def.label || t) + ' · ') === 0) { changed[t] = true; }
      });
    });
    return (rec.technologies || []).filter(function (t) { return !changed[t]; });
  }

  /* "AR and VR", not "AR, VR" — a sentence a person reads, not a list
     a machine printed. */
  function listWords(items) {
    if (items.length <= 1) { return items.join(''); }
    return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
  }

  function versionDiffHTML(rec, v, opts) {
    opts = opts || {};
    var rows = versionChanges(rec, v);
    var liveLabel = esc(rec.versionLabel || '—');
    var nextLabel = esc(v.versionLabel || '—');
    if (!rows.length) {
      return '<p class="cardlede">' + ui.ic('info', 'sm') +
        ' This version changes no delivery reference and no catalogue text against version <strong>' +
        liveLabel + '</strong>. Releasing it would move the version label and nothing else.</p>';
    }
    var untouched = unchangedTechnologies(rec, v);
    return '<div class="vdiff">' + rows.map(function (d) {
      return '<div class="vd-row' + (d.kind === 'cleared' ? ' cleared' : '') + '">' +
        '<div class="vd-f">' + esc(d.label) +
          (d.kind === 'cleared'
            ? ' ' + ui.badge('b-warning', 'alert', 'Withdrawn') : '') + '</div>' +
        '<div class="vd-side"><span class="vd-k">Current · v' + liveLabel + '</span>' +
          '<span class="vd-v mono brk">' + (d.current
            ? esc(d.current) : '<span class="muted">Nothing recorded</span>') + '</span></div>' +
        '<div class="vd-side vd-new"><span class="vd-k">Proposed · v' + nextLabel + '</span>' +
          '<span class="vd-v mono brk">' + (d.proposed
            ? esc(d.proposed)
            : '<span class="muted">Nothing — the reference is withdrawn</span>') + '</span></div>' +
        '</div>';
    }).join('') + '</div>' +
    '<p class="cardfoot">' +
    rows.length + ' ' + util.plural(rows.length, 'field') + ' would change. ' +
    (untouched.length
      ? 'Every other field, and ' + listWords(untouched.map(function (t) {
          return esc((data.TECHNOLOGIES[t] || {}).label || t);
        })) + ', ' + (untouched.length === 1 ? 'is' : 'are') + ' unchanged and carried forward.'
      : 'Every field not listed is unchanged and carried forward.') +
    (v.changeNote && !opts.hideReason
      ? '</p><blockquote class="qquote">' + esc(v.changeNote) + '</blockquote><p class="cardfoot">' +
        'The reason recorded by whoever raised it.'
      : '') +
    '</p>';
  }

  XRSLP.versionUI = {
    raisedByRole: raisedByRole, raisedByLine: raisedByLine, correctionChip: correctionChip,
    /* Implementation 09 QA — current → proposed, for the two people
       who decide on a version. */
    changes: versionChanges, diff: versionDiffHTML,
    badge: versionBadge, holderLine: holderLine, history: versionHistory,
    /* Also used by the Super Admin's Release / Hold screen, so the two
       approvers see exactly the same delivery the release would write. */
    delivery: deliveryReadOnly
  };
})();
