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

  /* TWO STATUSES, ONE LABEL, AND ONE SURFACE WHERE THAT BREAKS.
     `CHANGES_ACADEMIC` and `CHANGES_CONTENT` both read "Changes
     requested", correctly: to the Vendor holding the record, a return
     is a return, and which gate sent it back is answered by the comment
     rather than by the badge. The platform override is the one place
     that offers BOTH as destinations at once, and two rows reading
     "Move to Changes requested" would leave the Super Admin picking
     between options they cannot tell apart. The status filter in
     `content-ui.js` already separates these two with a suffix, so the
     same suffix is reused here rather than a second, competing wording.
     Nothing about the stored status or its badge changes. */
  function statusLabelFor(status) {
    var m = state.contentStatusMeta(status);
    if (!m) { return status; }
    if (status === state.CONTENT_STATUS.CHANGES_ACADEMIC) { return m.label + ' — academic'; }
    if (status === state.CONTENT_STATUS.CHANGES_CONTENT) { return m.label + ' — content readiness'; }
    return m.label;
  }

  /* Which gate a returned record was sent back from. This is what the
     status already means in the workflow, said in words — not a new
     rule, and not a claim about who will pick it up next. */
  function statusOriginNote(status) {
    if (status === state.CONTENT_STATUS.CHANGES_ACADEMIC) {
      return ' A record here has been returned from <strong>academic review</strong>.';
    }
    if (status === state.CONTENT_STATUS.CHANGES_CONTENT) {
      return ' A record here has been returned from the <strong>content readiness gate</strong>.';
    }
    /* 07.3 — the Content Manager's return now has TWO destinations, and
       this one is the half that does not go to the Vendor. Without this
       sentence the override list offers a destination whose holder is
       the Academic Reviewer while every other "returned" state on the
       same list is held by the Vendor, and nothing on screen says why
       the pattern breaks. */
    if (status === state.CONTENT_STATUS.CHANGES_ACADEMIC_RECHECK) {
      return ' The Content Manager returned it at the readiness gate to the <strong>Academic Reviewer</strong> ' +
        'rather than to the Vendor, because the problem was academic rather than technical.';
    }
    return '';
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

    /* ⚠ THE CANONICAL TREE WAS REMOVED FROM THIS SCREEN AT 08R.

       It rendered the full Programme → Course → Experiment hierarchy
       here, one nav item away from Academic structure, which renders
       the same hierarchy from the same `state.canonicalTree()`. Two
       copies of one structure on two screens is not consistency — it
       made Content governance look like a second structure editor, and
       it buried the two decision queues this screen exists for under a
       tree nobody came here to browse.

       Content governance now answers what is live, what is waiting and
       where to act; the structure is a LINK at the foot of the
       published-content card. `state.canonicalTree()` is unchanged and
       is still what Academic structure reads. */

    /* ── R17 — THE PROBLEMS THIS PLANE CAN ACTUALLY MITIGATE ─────
       The stakeholder's words were that a Content Manager, an Academic
       Reviewer or a Vendor in trouble should be resolvable HERE. Both
       resolution surfaces already existed — the per-record platform
       override, and Role governance — but nothing on this screen ever
       said a record was stuck, so finding one meant opening Experiments
       until you hit it.

       This card is the missing half. It counts nothing new: see
       `P.blockedRecords` for the derivation and why PUBLISHED records
       are never in it. Each row leads to the record's own override. */
    var stuck = P.blockedItems();
    var scopeless = P.scopelessItems();

    var stuckCard = ui.card('Stalled in the production chain',
      P.attentionList(stuck.concat(scopeless), {
        icon: 'check', heading: 'h3',
        title: 'Nothing is stalled',
        body: 'Every Experiment still in the production chain has somebody with a live scope able to act on it, ' +
          'and every registered Vendor, Academic Reviewer and Content Manager holds at least one scope.'
      }) +
      '<p class="cardfoot">A record appears here when <strong>nobody holds a live scope</strong> covering it in ' +
      'the role that owns its current stage. Assign a scope in <a href="' + P.href.roles() + '">Role ' +
      'governance</a> — the proper repair — or move it by platform override on its own page. A published ' +
      'Experiment never appears here: it has left the production chain.</p>', null, 'h2');

    /* The governed set: what the public catalogue actually carries,
       each with the version in flight behind it if there is one. */
    var governed = state.contentRecords()
      .filter(function (r) { return r.status === state.CONTENT_STATUS.PUBLISHED; })
      .map(function (rec) {
        var openVersions = (state.versionsForRecord ? state.versionsForRecord(rec.id) : [])
          .filter(function (v) { return v.status !== state.VERSION_STATUS.RELEASED; });
        var pending = openVersions[0] || null;
        return {
          rec: rec,
          ctx: data.contextOf(rec.id),
          pending: pending,
          pendingMeta: pending ? state.versionStatusMeta(pending.status) : null
        };
      });

    var html =
      /* The subtitle used to say "Canonical catalogue and later-version
         decisions", which described the tree that is no longer here. */
      ui.phead('Content governance',
        awaiting.length
          ? awaiting.length + ' ' + util.plural(awaiting.length, 'version') + ' awaiting a Release / Hold decision'
          : 'What is published, and what is waiting on a decision') +
      '<div class="stack">' +
      stuckCard +
      ui.card('Versions awaiting Release / Hold',
        P.attentionList(decisionItems, {
          icon: 'check', heading: 'h3',
          title: 'No version is waiting on a decision',
          body: 'A later version of an already-published Experiment reaches this list once the Academic ' +
            'Reviewer has approved it.'
        }) +
        /* ⚠ THE TERMINOLOGY FIREWALL, STATED ON THE SURFACE THAT COULD
           BREAK IT. Release / Hold acts on a LATER VERSION of an
           already-published Experiment; first publication is the Content
           Manager's and the word Publish appears as an action nowhere in
           this workspace. Do not shorten this away. */
        '<p class="cardfoot"><strong>Release</strong> and <strong>Hold</strong> apply to a later version of an ' +
        'already-published Experiment. First publication of a new Experiment is the Content Manager&rsquo;s, ' +
        'and there is no publish control anywhere in this workspace.</p>', null, 'h2') +
      /* ⚠ THIS CARD USED TO BE THE WHOLE CANONICAL TREE, and that was a
         duplicate of Academic structure one nav item away — the same
         Programme → Course → Experiment hierarchy, rendered twice, on
         two screens that answer different questions.

         Content GOVERNANCE answers: what is live, what is waiting on
         me, and where do I act. So this is now the governed content
         itself — one row per Experiment with its public version, any
         version in flight, its technologies and its state — and the
         structure it is filed under is a link, not a second copy. */
      ui.card('Published content',
        (governed.length
          ? '<p class="chelp">Every Experiment the public catalogue carries, with the version that is live ' +
            'now and anything waiting behind it.</p>' +
            '<div class="tscroll"><table class="dt">' +
            '<caption class="sr-only">Published Experiments and their versions</caption>' +
            '<thead><tr><th scope="col">Experiment</th><th scope="col">Course</th>' +
            '<th scope="col">Technologies</th><th scope="col">Public version</th>' +
            '<th scope="col">In flight</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead>' +
            '<tbody>' + governed.map(function (g) {
              return '<tr>' +
                '<td data-label="Experiment"><a class="rowlink" href="' + P.href.record(g.rec.id) + '">' +
                '<span class="tmain">' + esc(g.rec.name) + '</span></a></td>' +
                '<td data-label="Course">' + (g.ctx
                  ? esc(g.ctx.grouping.name) + ' <span class="muted">›</span> ' + esc(g.ctx.course.name)
                  : '<span class="muted">Not resolved</span>') + '</td>' +
                '<td data-label="Technologies">' + ui.techBadges(g.rec.technologies || []) + '</td>' +
                '<td data-label="Public version"><span class="verchip">Version ' +
                esc(g.rec.versionLabel || '1.0') + '</span></td>' +
                '<td data-label="In flight">' + (g.pending
                  ? ui.badge(g.pendingMeta.badge, g.pendingMeta.icon,
                      'v' + g.pending.versionLabel + ' · ' + g.pendingMeta.label)
                  : '<span class="muted">—</span>') + '</td>' +
                '<td class="cell-actions"><a class="btn sm sec" href="' + P.href.record(g.rec.id) + '">Open' +
                '<span class="sr-only"> ' + esc(g.rec.name) + '</span></a></td>' +
                '</tr>';
            }).join('') + '</tbody></table></div>'
          : ui.emptyRow({ icon: 'flask', heading: 'h3',
              title: 'Nothing is published yet',
              body: 'An Experiment appears here once the Content Manager publishes it for the first time.' })) +
        '<p class="cardfoot">The structure these are filed under — Programme / department → Course — is ' +
        'managed in <a href="' + P.href.structure() + '">Academic structure</a>. Nothing is ever removed ' +
        'from it: live institutional access, academic mappings, Faculty mappings and assignments point at those ' +
        'identifiers, and published content is never unpublished or withdrawn.</p>',
        null, 'h2') +
      '</div>';

    return { title: 'Content governance', html: html, navKey: 'content' };
  };

  /* ============================================================
     ACADEMIC STRUCTURE — Programme / Department and Course master
     records (Implementation 07.1, open decision D3).

     Platform-controlled (`STK31-10`). This is the Super Admin plane, so
     nothing here is reachable by a Tenant Admin, and a Vendor, Academic
     Reviewer or Content Manager has no route to it either: a Vendor
     SELECTS a canonical Course, it never defines one.

     CREATE and RENAME only — D3's own recommendation is to scope create
     first, because retiring a structure record is the expensive half and
     needs a rule for live references that no source states.
     ============================================================ */
  XRSLP.screens.platformStructure = function () {
    var groupings = state.groupingRecords();
    var courseTotal = 0;
    groupings.forEach(function (g) { courseTotal += state.coursesInGroupingRecord(g.id).length; });

    /* ── THE HIERARCHY, RENDERED AS A HIERARCHY ──────────────────
       Programme / department → Course → Experiment count and usage.
       What was here before was a bare `<h3>`, two paragraphs of body
       prose (one of them wrapping the Manage BUTTON), and a three-column
       table whose middle cell held a run-on sentence of five unrelated
       figures. It read as a debug dump of the structure tables rather
       than as the canonical catalogue the platform is built on.

       Each Programme is now a zone heading carrying its own counts and
       its own Manage action, over a list of Course records. */
    var rows = groupings.map(function (g) {
      var courses = state.coursesInGroupingRecord(g.id);
      /* TWO DIFFERENT POPULATIONS, NAMED APART — the same distinction
         the Programme's own page makes. `experimentsInGrouping` resolves
         through the PUBLISHED pool; `courseUsage().records` counts every
         content record, in-flight ones included. */
      var published = data.experimentsInGrouping(g.id).length;
      var allRecords = courses.reduce(function (n, c) { return n + state.courseUsage(c.id).records; }, 0);

      /* ⚠ THE MAIN LIST ANSWERS "WHAT IS THE STRUCTURE", NOT "WHAT
         REFERENCES IT".

         Each Course row carried its full dependency breakdown — 3
         Experiments · 1 Tenant mapping · 1 Faculty mapping · 2 Role
         scopes · 2 People · 9 Questions — six figures per row, on every
         row, which turned a Programme listing into a database inspector
         and buried the one number a reader is actually scanning for.

         The row now carries what identifies a Course: its name, its
         PLATFORM COURSE CODE, and how many Experiments are filed under
         it. The full dependency picture is one click away on the Course
         page, which already renders it in full and is where somebody
         asking "what would this affect?" is going anyway. Nothing was
         removed from the product — it was moved to the level it belongs
         to. */
      var courseRows = courses.length
        ? '<ul class="reclist">' + courses.map(function (c) {
            var use = state.courseUsage(c.id);
            return '<li class="recrow">' +
              '<div class="rr-b">' +
              '<div class="rr-t"><a href="' + P.href.course(c.id) + '">' + esc(c.name) + '</a>' +
              (c.code ? ui.platformCode(c.code) : '') + '</div>' +
              '<div class="rr-m">' + esc(c.summary) + '</div>' +
              '</div>' +
              '<div class="rr-mid">' + ui.metrics([
                { v: use.records, k: util.plural(use.records, 'Experiment') }
              ]) + '</div>' +
              '<div class="rr-a"><a class="btn sm sec" href="' + P.href.course(c.id) + '">Manage' +
              '<span class="sr-only"> the Course ' + esc(c.name) + '</span></a></div>' +
              '</li>';
          }).join('') + '</ul>'
        : ui.emptyRow({ icon: 'book', heading: 'h3',
            title: 'No Course in this Programme / department yet',
            body: 'A Course added below appears here, and becomes available to Vendor submissions, role ' +
              'governance and the public catalogue at once.' });

      /* ONE `<section>` PER PROGRAMME, holding its own zone heading and
         its own card, so the `.stack` gap separates PROGRAMMES rather
         than separating each heading from the list it introduces. The
         old `.canongroup` wrapper is deliberately not reused: its
         `h3` rule in screens.css would out-specify the section head's
         own type scale, since screens.css loads after components.css. */
      return '<section>' +
        ui.sectionHead({
          /* h2: this zone head sits directly under the page h1, so h3
             would skip a level. The Content governance tree uses h3
             because there the same zone sits inside an h2 card. */
          title: g.name, heading: 'h2', desc: g.summary,
          count: courses.length, countLabel: 'Course',
          actionsHTML: '<a class="btn sm sec" href="' + P.href.grouping(g.id) + '">Manage' +
            '<span class="sr-only"> the Programme / department ' + esc(g.name) + '</span></a>'
        }) +
        ui.card('',
          ui.metrics([
            { v: courses.length, k: util.plural(courses.length, 'Course') },
            { v: published, k: 'Experiments published' },
            { v: allRecords, k: 'Experiments — all records' }
          ]) +
          '<div style="margin-top:12px">' + courseRows + '</div>') +
        '</section>';
    }).join('');

    var html =
      ui.phead('Academic structure',
        groupings.length + ' ' +
        (groupings.length === 1 ? 'Programme / department' : 'Programmes / departments') + ' · ' +
        courseTotal + ' ' + util.plural(courseTotal, 'Course') +
        ' — the canonical structure every Experiment is filed under') +
      '<p class="chelp">Programme / department → Course → Experiment. This structure is ' +
      '<strong>platform-controlled</strong>: a Tenant Admin can never redefine it, and a Vendor selects a ' +
      'canonical Course rather than inventing one. A Course added here is available to role governance, to ' +
      'Vendor submissions and to the public catalogue immediately &mdash; there is no second catalogue to ' +
      'keep in step, and no way to take one back out again.</p>' +
      '<div class="stack">' +
      (groupings.length
        ? rows
        : ui.card('Canonical structure', ui.emptyRow({ icon: 'book', heading: 'h3',
            title: 'No Programme / department yet',
            body: 'Add one below. Every Course, and therefore every Experiment, is filed under one.' }), null, 'h2')) +
      /* ── WHY THERE IS NO DELETE OR RETIRE CONTROL HERE ───────────
         There is none, and none is offered, and that is correct. The
         reasoning used to be printed on screen as a ~700-character
         dashed gap note — "No source describes a create, retire or
         delete operation for these records", the STK31-10 / STK31-09
         citations, open decision D3, "remain open to the stakeholder".
         All of that is requirements traceability addressed to the build
         team; on a stakeholder-facing screen it reads as an admission of
         incompleteness about a decision that is in fact settled. It is
         recorded here instead, and the product simply does not offer an
         unsafe action:

           · The FRD contains no occurrence of delete, retire, deprecate,
             unpublish or cascade. The conceptual data model gives
             AcademicGrouping, Course and Experiment no lifecycle at all.
           · STK31-22 ("prefer a reversible status change over physical
             deletion") scopes itself explicitly to tenant termination,
             student removal and the Question Bank — not to canonical
             structure.
           · Every id here is referenced by live access records, tenant
             course mappings, Faculty mappings and student records, and
             elsewhere in this build "a Course id never changes and
             nothing deletes a Course" is a load-bearing assumption.
           · Create and rename are built on the D3 recommendation
             ("scope create first, treat retire separately").

         What the operator needs is the consequence, not the provenance:
         it is stated once on the create forms ("it cannot be retired")
         and once beside the dependency figures on each record's own
         page, where it is a fact about THAT record. The rename /
         CSV-import consequence lives on the rename forms, which is where
         somebody is about to cause it. */
      ui.sectionHead({ title: 'Add to the canonical structure', heading: 'h2',
        desc: 'A Programme / department or a Course can be created and renamed here. Neither can be retired: ' +
          'live records point at them.' }) +
      /* The Course form has five fields including a select and a textarea;
         the Programme form has two. The wide column goes to the wider
         form — the reverse of how this was laid out. */
      '<div class="grid-rail"><div class="stack">' + newCourseCard() + '</div>' +
      '<div class="stack">' + newGroupingCard() + '</div></div>' +
      '</div>';

    return {
      title: 'Academic structure', html: html, navKey: 'structure',
      after: function () { wireStructureForms(); }
    };
  };

  /* WHAT REFERENCES THIS COURSE, as labelled metadata.
     This was `usageText()`, which joined five independent metrics with
     middots into one cell: "3 experiments (all records) · 1 tenant
     mapping · 2 role assignments · 1 person". Five different kinds of
     dependency read as one sentence, and the identical data was already
     rendered correctly as separate rows on the Course page one click
     away. Zero values are still suppressed — a row is shorter and
     easier to scan when it names only what actually exists — and the
     complete breakdown, zeros included, stays on the Course page. */
  function usageMetrics(use) {
    var parts = [];
    if (use.records) { parts.push({ v: use.records, k: util.plural(use.records, 'Experiment') }); }
    if (use.mappings) { parts.push({ v: use.mappings, k: util.plural(use.mappings, 'Tenant mapping') }); }
    if (use.facultyMappings) {
      parts.push({ v: use.facultyMappings, k: util.plural(use.facultyMappings, 'Faculty mapping') });
    }
    if (use.assignments) { parts.push({ v: use.assignments, k: util.plural(use.assignments, 'Role scope') }); }
    if (use.people) { parts.push({ v: use.people, k: util.plural(use.people, 'Person', 'People') }); }
    /* ⚠ THE QUESTION BANK IS A REFERENCE TOO — added at Implementation 08
       together with the `courseUsage().questions` counter behind it.
       Six collections carry a courseId and this list showed five, so a
       Course whose other references had all been cleared but against
       which a Faculty member had written a question bank rendered the
       words "Not yet referenced" to a Super Admin. The counter was
       corrected in js/state.js; showing it here is what makes the
       correction visible on the screen that states the conclusion. */
    if (use.questions) {
      parts.push({ v: use.questions, k: util.plural(use.questions, 'Question') });
    }
    return parts.length
      ? ui.metrics(parts)
      : '<span class="tsub2">Not yet referenced</span>';
  }

  /* The same five counters as one number — how many live things point at
     a record, and therefore why it is permanent. */
  function usageTotal(use) {
    return (use.records || 0) + (use.mappings || 0) + (use.facultyMappings || 0) +
      (use.questions || 0) + (use.assignments || 0) + (use.people || 0);
  }

  /* ── R20 — "What is this origin? ... I have to remove it" ────
     Provenance is still worth keeping — `STK31-41`'s sibling
     instruction for identities applies to structure too: say where a
     record came from rather than inventing a lifecycle for it — but it
     was being shown as an "Origin" COLUMN repeated down a table and as
     a badge beside every heading, in the prototype's own vocabulary
     ("seed"). Read fifty times, it told the reader nothing they could
     act on.

     So the badge and the column are gone, and the fact survives as one
     sentence on each record's own identity card, under a label that
     asks a question a person would ask. Nothing about `source` is
     deleted, and no audit truth is lost. */
  function structureAddedLine(rec) {
    return rec.source === 'seed'
      ? 'Part of the sample catalogue this prototype starts with.'
      : 'Created here on the platform by the Super Admin.';
  }

  function groupingSelectOptions(selectedId) {
    return state.groupingRecords().map(function (g) {
      return '<option value="' + esc(g.id) + '"' + (g.id === selectedId ? ' selected' : '') + '>' +
        esc(g.name) + '</option>';
    }).join('');
  }

  function newGroupingCard() {
    return ui.card('Add a Programme / department',
      '<form id="pg-form" novalidate>' +
      '<div class="form-errors"></div>' +
      '<div class="field" id="pg-name"><label for="pg-name-i">Name ' +
      '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
      '<input type="text" id="pg-name-i" autocomplete="off">' +
      /* The grouping level is deliberately terminology-neutral: whether
         it is finally called Programme, Department or Academic Stream is
         open (ND-02). That is a naming decision for the stakeholder, not
         something the person filling this form in acts on, so the field
         says what the level IS rather than citing the open question. */
      '<p class="hint">One grouping level above Course — a Programme, a Department or an academic stream, ' +
      'whichever this institution&rsquo;s catalogue calls it.</p></div>' +
      '<div class="field" id="pg-summary"><label for="pg-summary-i">Description ' +
      '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
      '<textarea id="pg-summary-i" rows="3"></textarea>' +
      '<p class="hint">Shown on the public catalogue.</p></div>' +
      '<div class="formact"><button class="btn pri" type="submit">Add Programme / department</button>' +
      '<span class="formnote">Creates no content and grants no institution anything &mdash; but it is ' +
      '<strong>immediately visible on the public catalogue</strong>, and it cannot be retired.</span></div>' +
      /* h3: both create cards sit under the "Add to the canonical
         structure" zone head, which is the h2. */
      '</form>', null, 'h3');
  }

  function newCourseCard() {
    return ui.card('Add a Course',
      '<form id="pc-form" novalidate>' +
      '<div class="form-errors"></div>' +
      '<div class="field" id="pc-grouping"><label for="pc-grouping-i">Programme / department ' +
      '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
      '<select id="pc-grouping-i">' + groupingSelectOptions(null) + '</select></div>' +
      '<div class="field" id="pc-name"><label for="pc-name-i">Course name ' +
      '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
      '<input type="text" id="pc-name-i" autocomplete="off"></div>' +
      /* THE CANONICAL COURSE CODE — the Super Admin's half of it. The
         field is owned PRIMARILY by the Content Manager, who has their
         own screen for it; it is offered here as well because the Super
         Admin is the only person who can create a Course at all, and
         forcing them to create one and then wait for somebody else to
         put a code on it would be an invented handover. Optional, and
         staying blank is a permanent legitimate state — no official
         code exists for the sample Courses and none is invented. */
      '<div class="field" id="pc-code"><label for="pc-code-i">Platform course code</label>' +
      '<input type="text" id="pc-code-i" autocomplete="off" maxlength="40" aria-describedby="pc-code-h">' +
      '<p class="hint" id="pc-code-h">Optional. Unique across the whole platform when it is set — the platform ' +
      'code identifies one Course everywhere, unlike the Course <em>name</em>, which only has to be unique ' +
      'inside its Programme. It is managed primarily by the Content Manager; you also have access to it. ' +
      'An institution&rsquo;s own course code is a separate field, recorded by that institution.</p></div>' +
      '<div class="field" id="pc-summary"><label for="pc-summary-i">Description ' +
      '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
      '<textarea id="pc-summary-i" rows="3"></textarea>' +
      '<p class="hint">Shown on the public catalogue.</p></div>' +
      '<div class="formact"><button class="btn pri" type="submit">Add Course</button>' +
      '<span class="formnote">A Vendor still needs a scope on this Course before they can submit into it. ' +
      'It is <strong>immediately visible on the public catalogue</strong>, and it cannot be retired.</span></div>' +
      '</form>', null, 'h3');
  }

  function wireStructureForms() {
    var gForm = document.getElementById('pg-form');
    if (gForm) {
      var gBusy = false;
      gForm.addEventListener('submit', function (e) {
        e.preventDefault();
        if (gBusy) { return; }
        var fields = {
          name: (document.getElementById('pg-name-i') || {}).value || '',
          summary: (document.getElementById('pg-summary-i') || {}).value || ''
        };
        var errs = state.validateGroupingFields(fields, null);
        if (!ui.showErrors(gForm, errs, 'Please correct the Programme / department')) { return; }
        gBusy = true;
        var res = state.createGrouping(fields);
        if (!res.ok) { gBusy = false; ui.showErrors(gForm, res.errors, 'Please correct the Programme / department'); return; }
        ui.toast(res.grouping.name + ' added. Add a Course to it to make it usable.');
        XRSLP.render(false);
      });
    }
    var cForm = document.getElementById('pc-form');
    if (cForm) {
      var cBusy = false;
      cForm.addEventListener('submit', function (e) {
        e.preventDefault();
        if (cBusy) { return; }
        var fields = {
          groupingId: (document.getElementById('pc-grouping-i') || {}).value || '',
          name: (document.getElementById('pc-name-i') || {}).value || '',
          code: (document.getElementById('pc-code-i') || {}).value || '',
          summary: (document.getElementById('pc-summary-i') || {}).value || ''
        };
        var errs = state.validateCourseFields(fields, null);
        if (!ui.showErrors(cForm, errs, 'Please correct the Course')) { return; }
        cBusy = true;
        var res = state.createCourse(fields);
        if (!res.ok) { cBusy = false; ui.showErrors(cForm, res.errors, 'Please correct the Course'); return; }
        ui.toast(res.course.name + ' added to the canonical catalogue.');
        XRSLP.render(false);
      });
    }
  }

  /* ---------------- one Programme / department ---------------- */
  XRSLP.screens.platformGrouping = function (params) {
    var g = state.groupingRecord(params.groupingId);
    if (!g) { return structureNotFound('Programme / department'); }
    var courses = state.coursesInGroupingRecord(g.id);
    /* TWO DIFFERENT POPULATIONS, NAMED AS SUCH. `experimentsInGrouping`
       resolves through the PUBLISHED pool; `courseUsage().records` counts
       every content record, in-flight ones included. Reporting one as
       "Experiments" next to Course rows showing the other made the same
       screen contradict itself — 4 against a Course-row total of 7 on the
       seeded data alone. Both are shown, each labelled for what it is. */
    var publishedCount = data.experimentsInGrouping(g.id).length;
    var allRecords = courses.reduce(function (n, c) { return n + state.courseUsage(c.id).records; }, 0);
    /* Everything that points at this Programme, through its Courses. It
       is the figure the permanence line is about, so the two can never
       disagree. */
    var childRefs = courses.reduce(function (n, c) { return n + usageTotal(state.courseUsage(c.id)); }, 0);

    var html =
      ui.crumbs([{ label: 'Academic structure', href: P.href.structure() }, { label: g.name }]) +
      ui.phead(g.name, 'Programme / department master record · ' +
        courses.length + ' ' + util.plural(courses.length, 'Course') + ' · ' +
        publishedCount + ' published ' + util.plural(publishedCount, 'Experiment')) +
      '<div class="grid-rail"><div class="stack">' +
      ui.card('Rename or re-describe',
        '<form id="pg-edit" novalidate>' +
        '<div class="form-errors"></div>' +
        '<div class="field" id="pg-name"><label for="pg-name-i">Name ' +
        '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
        '<input type="text" id="pg-name-i" autocomplete="off" value="' + esc(g.name) + '"></div>' +
        '<div class="field" id="pg-summary"><label for="pg-summary-i">Description ' +
        '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
        '<textarea id="pg-summary-i" rows="3">' + esc(g.summary) + '</textarea></div>' +
        '<div class="formact"><button class="btn pri" type="submit">Save changes</button>' +
        '<span class="formnote">The identifier never changes, so every <em>stored</em> reference stays valid. ' +
        'A tenant CSV whose Programme column still names the old text will no longer match, because that ' +
        'import resolves by name.</span></div>' +
        '</form>', null, 'h2') +
      '</div><div class="stack">' +
      ui.card('Identity',
        '<div class="kv">' +
        '<div class="k">Identifier</div><div class="v">' + esc(g.id) + '</div>' +
        '<div class="k">Courses</div><div class="v">' + courses.length + '</div>' +
        '<div class="k">Experiments — published</div><div class="v">' + publishedCount + '</div>' +
        '<div class="k">Experiments — all records</div><div class="v">' + allRecords +
        '<span class="tsub2">in-flight submissions included</span></div>' +
        '<div class="k">How this record was added</div><div class="v">' +
        esc(structureAddedLine(g)) + '</div>' +
        '</div>' +
        /* THE PERMANENCE LINE, NEXT TO THE FIGURES IT IS ABOUT.
           A fact about THIS record rather than a note about what the
           build does not implement — see the block comment on
           `platformStructure` for the full reasoning and the sources. */
        '<p class="cardfoot">This record is <strong>permanent</strong>. ' +
        (childRefs
          ? 'Its Courses are referenced ' + childRefs + ' ' + util.plural(childRefs, 'time') +
            ' by live institutional access, tenant and Faculty mappings, role scopes and student records, so it ' +
            'cannot be removed. It can be renamed at any time.'
          : 'Canonical structure is never removed in this build, so a Programme / department stays in the ' +
            'catalogue once it exists. It can be renamed at any time.') + '</p>',
        null, 'h2') +
      '</div></div>';

    return {
      title: g.name, html: html, navKey: 'structure',
      after: function () {
        var form = document.getElementById('pg-edit');
        if (!form) { return; }
        var busy = false;
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          if (busy) { return; }
          var fields = {
            name: (document.getElementById('pg-name-i') || {}).value || '',
            summary: (document.getElementById('pg-summary-i') || {}).value || ''
          };
          var errs = state.validateGroupingFields(fields, g.id);
          if (!ui.showErrors(form, errs, 'Please correct the Programme / department')) { return; }
          busy = true;
          var res = state.updateGrouping(g.id, fields);
          if (!res.ok) { busy = false; ui.showErrors(form, res.errors, 'Please correct the Programme / department'); return; }
          ui.toast('Saved. The identifier is unchanged, so every stored reference still resolves — but a CSV import naming the old text will not.');
          XRSLP.render(false);
        });
      }
    };
  };

  /* ---------------- one Course ---------------- */
  XRSLP.screens.platformCourse = function (params) {
    var c = state.courseRecord(params.courseId);
    if (!c) { return structureNotFound('Course'); }
    var use = state.courseUsage(c.id);
    var records = state.contentRecords().filter(function (r) { return r.courseId === c.id; });

    var recordsHTML = records.length
      ? '<ul class="reslist plain">' + records.map(function (r) {
          return '<li>' + ui.ic('flask') + '<span><a href="' + P.href.record(r.id) + '">' + esc(r.name) + '</a> ' +
            '<span class="muted">· ' + esc(state.contentStatusMeta(r.status).label) + '</span></span></li>';
        }).join('') + '</ul>'
      : '<p class="muted">No Experiment is filed under this Course yet.</p>';

    var html =
      ui.crumbs([{ label: 'Academic structure', href: P.href.structure() }, { label: c.name }]) +
      ui.phead(c.name,
        (function () {
          var g = data.grouping(c.groupingId);
          return 'Course master record' + (g ? ' · ' + esc(g.name) : '') +
            ' · ' + records.length + ' ' + util.plural(records.length, 'Experiment');
        })(),
        null, c.code ? ' ' + ui.platformCode(c.code) : '') +
      '<div class="grid-rail"><div class="stack">' +
      ui.card('Rename, re-describe or move',
        '<form id="pc-edit" novalidate>' +
        '<div class="form-errors"></div>' +
        '<div class="field" id="pc-grouping"><label for="pc-grouping-i">Programme / department ' +
        '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
        '<select id="pc-grouping-i">' + groupingSelectOptions(c.groupingId) + '</select>' +
        '<p class="hint">' +
        (state.courseMoveBlock(c.id)
          ? '<strong>This Course can no longer change Programme / department.</strong> ' +
            esc(String(state.courseMoveBlock(c.id))) + ' ' +
            esc(util.plural(state.courseMoveBlock(c.id), 'person is', 'people are')) + ' filed against it, and ' +
            'each of those records stores its own Programme — moving the Course would leave them disagreeing, ' +
            'in tenant-owned records this plane does not own. Renaming and re-describing still work.'
          : 'Moving a Course re-files it in the tree. The Experiments under it, the tenant mappings that name it ' +
            'and the role assignments that cover it are all untouched, because none of them stores a Programme. ' +
            'It is only offered while <strong>nobody is enrolled</strong> against the Course.') +
        '</p></div>' +
        '<div class="field" id="pc-name"><label for="pc-name-i">Course name ' +
        '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
        '<input type="text" id="pc-name-i" autocomplete="off" value="' + esc(c.name) + '"></div>' +
        /* See the create form: the canonical code is primarily the
           Content Manager's field, and this is the Super Admin's access
           to the same one value. Pre-filled from the stored code, and
           an empty box means the Course genuinely has no code. */
        '<div class="field" id="pc-code"><label for="pc-code-i">Platform course code</label>' +
        '<input type="text" id="pc-code-i" autocomplete="off" maxlength="40" aria-describedby="pc-code-h" ' +
        'value="' + esc(c.code || '') + '">' +
        '<p class="hint" id="pc-code-h">Optional, and unique across the whole platform when it is set. Managed ' +
        'primarily by the Content Manager; you also have access to it. Clearing the box removes the code and ' +
        'leaves the Course with none, which is a legitimate state.</p></div>' +
        '<div class="field" id="pc-summary"><label for="pc-summary-i">Description ' +
        '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
        '<textarea id="pc-summary-i" rows="3">' + esc(c.summary) + '</textarea></div>' +
        '<div class="formact"><button class="btn pri" type="submit">Save changes</button>' +
        '<span class="formnote">The identifier never changes, so every <em>stored</em> reference stays valid. ' +
        'A tenant CSV whose Course column still names the old text will no longer match, because that import ' +
        'resolves by name. ' +
        /* THE CODE IS NOT THE IDENTIFIER, AND THE ID-STABILITY SENTENCE
           MUST NOT BE STRETCHED OVER IT. The id above is stable by
           construction; the code is a value a human types and retypes,
           and a code is precisely the thing an external student
           information system would key on. Inside this prototype that
           is harmless, because nothing here resolves by code — CSV
           import and manual entry both match canonical structure BY
           NAME. Outside it, it would not be, and saying so is the only
           honest version of this note. */
        '<strong>The Course code is separate.</strong> Nothing here resolves a Course by its code, so changing ' +
        'it breaks nothing on the platform &mdash; an external system keyed on the code would need ' +
        'checking.</span></div>' +
        '</form>', null, 'h2') +
      ui.card('Experiments filed under this Course', recordsHTML, null, 'h2') +
      '</div><div class="stack">' +
      /* ⚠ USAGE & DEPENDENCIES LIVE HERE, not on the Programme listing.

         The structure list used to print all six of these figures on
         every Course row, which made a Programme page read as a
         database inspector. They belong to the record, and this is the
         record's own page — the place somebody asking "what would
         changing this affect?" has already navigated to.

         It is also the page that explains why nothing can be removed:
         the count IS the reason, so the figures and the sentence sit
         together instead of the sentence appearing on its own. */
      ui.card('Usage & dependencies',
        (usageTotal(use)
          ? '<p class="chelp">What currently references this Course. Every one of these is a live ' +
            'record elsewhere in the platform.</p>' + usageMetrics(use)
          : ui.emptyRow({ icon: 'check', ok: true, heading: 'h3',
              title: 'Nothing references this Course yet',
              body: 'No Experiment, tenant mapping, Faculty mapping, role scope, enrolment or question ' +
                'is filed against it.' })) +
        '<p class="cardfoot">Canonical structure is permanent in this build. A Course keeps its identifier ' +
        'for the life of the platform so every record above continues to resolve; renaming and re-describing ' +
        'are the changes that are safe, and both are on this page.</p>', null, 'h2') +
      ui.card('Identity',
        '<div class="kv">' +
        '<div class="k">Identifier</div><div class="v">' + esc(c.id) + '</div>' +
        /* TWO DIFFERENT THINGS, ONE ABOVE THE OTHER, NAMED APART. The
           identifier is minted by the platform and never changes; the
           canonical code is optional master data a person sets. Showing
           only the id let the code look like an internal detail of it,
           which is exactly the confusion rule E exists to remove. */
        /* PLATFORM course code — never "canonical", which is engineering
           vocabulary, and never a bare "Course code", which is the exact
           ambiguity this pass exists to remove. */
        '<div class="k">Platform course code</div><div class="v">' +
        (c.code ? ui.platformCode(c.code) : '<span class="muted">Not set</span>') +
        '<span class="tsub2">Managed primarily by the Content Manager &mdash; the Super Admin ' +
        'also has access to it, on the form beside this card. This is not an institution&rsquo;s own ' +
        'course code, which each Tenant Admin records separately for their own institution.</span></div>' +
        '<div class="k">Experiments — all records</div><div class="v">' + use.records +
        '<span class="tsub2">in-flight submissions included</span></div>' +
        '<div class="k">Experiments — published</div><div class="v">' +
        data.experimentsInCourse(c.id).length + '</div>' +
        '<div class="k">Tenant mappings</div><div class="v">' + use.mappings + '</div>' +
        '<div class="k">Faculty mappings</div><div class="v">' + use.facultyMappings + '</div>' +
        '<div class="k">People filed against it</div><div class="v">' + use.people + '</div>' +
        '<div class="k">Role assignments</div><div class="v">' + use.assignments + '</div>' +
        '<div class="k">How this record was added</div><div class="v">' +
        esc(structureAddedLine(c)) + '</div>' +
        '</div>' +
        /* THE PERMANENCE LINE, NEXT TO THE FIGURES IT IS ABOUT — the six
           rows above ARE the reason, so the sentence names their total
           rather than asserting a rule in the abstract. See the block
           comment on `platformStructure` for the sources. */
        '<p class="cardfoot">This record is <strong>permanent</strong>. ' +
        (usageTotal(use)
          ? usageTotal(use) + ' live ' + util.plural(usageTotal(use), 'record') +
            ' above point at this Course, so it cannot be removed. It can be renamed, re-described and — while ' +
            'nobody is filed against it — moved to another Programme.'
          : 'Canonical structure is never removed in this build, so a Course stays in the catalogue once it ' +
            'exists. It can be renamed, re-described and moved to another Programme.') + '</p>', null, 'h2') +
      '</div></div>';

    return {
      title: c.name, html: html, navKey: 'structure',
      after: function () {
        var form = document.getElementById('pc-edit');
        if (!form) { return; }
        var busy = false;
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          if (busy) { return; }
          var fields = {
            groupingId: (document.getElementById('pc-grouping-i') || {}).value || '',
            name: (document.getElementById('pc-name-i') || {}).value || '',
            code: (document.getElementById('pc-code-i') || {}).value || '',
            summary: (document.getElementById('pc-summary-i') || {}).value || ''
          };
          var errs = state.validateCourseFields(fields, c.id);
          if (!ui.showErrors(form, errs, 'Please correct the Course')) { return; }
          /* Read BEFORE the save. `updateCourse` mutates the very record
             `c` points at, so comparing afterwards would always report
             "unchanged" and the code sentence would never appear. */
          var priorCode = String(c.code || '');
          busy = true;
          var res = state.updateCourse(c.id, fields);
          if (!res.ok) { busy = false; ui.showErrors(form, res.errors, 'Please correct the Course'); return; }
          /* The id-stability promise is made about the id ONLY. Where the
             code changed, the second sentence says what is true of a
             code instead — a distinct claim, not the same one reused. */
          var codeChanged = String(fields.code || '').trim() !== priorCode;
          ui.toast('Saved. The identifier is unchanged, so every stored reference still resolves — but a CSV import naming the old text will not.' +
            (codeChanged
              ? ' The Course code also changed; nothing in this prototype resolves a Course by its code, so nothing here breaks.'
              : ''));
          XRSLP.render(false);
        });
      }
    };
  };

  function structureNotFound(what) {
    return {
      title: what + ' not found', navKey: 'structure',
      html: ui.crumbs([{ label: 'Academic structure', href: P.href.structure() }, { label: 'Not found' }]) +
        ui.phead(what + ' not found') +
        '<div class="tablecard">' + ui.emptyState({
          icon: 'alertCirc', title: what + ' not found',
          body: 'No ' + what + ' exists with this identifier in the canonical structure.',
          actionsHTML: '<a class="btn pri" href="' + P.href.structure() + '">Back to Academic structure</a>'
        }) + '</div>'
    };
  }

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

    /* ---- the current published state ----
       The canonical structure lists every Experiment the platform holds,
       including ones still in the production chain, so this card is
       reached for unpublished records too. Titling it "Currently
       published" and labelling a draft's working label as the "current
       public version" said the catalogue was showing something it was
       not. The card now names the record's real state. */
    var isPublished = rec.status === state.CONTENT_STATUS.PUBLISHED;
    var current = ui.card(isPublished ? 'Currently published' : 'This Experiment is not published',
      (isPublished ? '' :
        '<p class="muted" style="margin:0 0 10px">Nothing below is public. This Experiment is still in the ' +
        'content production chain, so the catalogue does not show it and no institution can request it. ' +
        'First publication is the Content Manager&rsquo;s decision; a later version&rsquo;s Release / ' +
        'Hold — which is yours — exists only for an Experiment that is already published.</p>') +
      '<div class="kv">' +
      '<div class="k">Experiment</div><div class="v">' + esc(rec.name) + ' <span class="muted">' + esc(rec.id) + '</span></div>' +
      '<div class="k">Course</div><div class="v">' +
      (ctx.course ? esc((ctx.grouping ? ctx.grouping.name + ' › ' : '') + ctx.course.name)
                  : '<span class="muted">Not resolved</span>') + '</div>' +
      '<div class="k">State</div><div class="v">' + recordStateBadge(rec) + '</div>' +
      '<div class="k">' + (isPublished ? 'Current public version' : 'Working version label') + '</div><div class="v">' +
      (rec.versionLabel ? '<strong>' + esc(rec.versionLabel) + '</strong>' : '<span class="muted">No version label</span>') +
      (isPublished ? '' : ' <span class="muted">— not public</span>') +
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

    var courseOptions = data.courses().map(function (c) {
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
          '<p class="hint">The Experiment identifier never changes, so existing institutional access, academic ' +
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
          /* WHY, NOT ONLY WHO. Correcting the master record of something
             the public catalogue is already showing is the heaviest
             content act on this plane, so on a PUBLISHED record the
             state layer refuses the save without a reason and returns
             it against `cm-reason`. At the readiness gate the record is
             not public and the Content Manager is about to publish it
             anyway, so the box is offered and not demanded — it is
             shown in both states rather than appearing out of nowhere
             at the moment it becomes compulsory. */
          '<div class="field" id="cm-reason"><label for="cm-reason-i">Reason for this correction' +
          (rec.status === state.CONTENT_STATUS.PUBLISHED
            ? ' <span class="req">(required)</span>'
            : ' <span class="muted">(optional)</span>') + '</label>' +
          '<input type="text" id="cm-reason-i" autocomplete="off" aria-describedby="cm-reason-h">' +
          '<p class="hint" id="cm-reason-h">' +
          (rec.status === state.CONTENT_STATUS.PUBLISHED
            ? 'Required: this experiment is published, so the correction reaches the public catalogue at once.'
            : 'Optional while this experiment is unpublished. It becomes required once it is published.') +
          ' Recorded on the Experiment&rsquo;s own history, where the Vendor, the Academic Reviewer and the ' +
          'Content Manager all read it. Nothing is sent to anybody.</p></div>' +
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
            'and rewriting it would change the work under the person doing it.</p>' +
            /* R17 — the refusal now says where the power actually is,
               instead of reading as a dead end. It is deliberately NOT
               softened into an edit control: role-specific ownership is
               the thing the Super Admin's authority protects, not the
               thing it overrides. The override moves the record to a
               stage where this editor opens legitimately; it does not
               let the Super Admin write over somebody mid-task. */
            '<p style="margin-top:8px">If the record is stuck rather than simply in progress, the ' +
            '<strong>platform override</strong> below moves it to a stage where this editor opens ' +
            'legitimately. There is deliberately no way to overwrite the metadata while somebody else is ' +
            'working on the revision.</p>'), null, 'h2');

    /* ---- THE PLATFORM OVERRIDE ON THE CONTENT CHAIN ----
       The stakeholder confirmed the Super Admin holds overall control,
       content problems and role problems included. That is built as ONE
       separately labelled surface rather than as quiet extra authority
       spread through the ordinary workflow: no ordinary permission is
       widened by it, and every move made here is explicit, reasoned and
       written into the record's own history.

       What it is actually FOR is unsticking the chain. A submission
       whose only assigned Academic Reviewer has had their scope
       withdrawn sits in academic review with nobody able to move it,
       and without this card nothing in the build could free it. That is
       also why each destination's REACHABILITY is shown before the
       decision rather than after it: an override that lands a record
       where nobody live can act has not resolved the deadlock, it has
       moved it somewhere less obvious.

       Rendered on every record, published ones included. A control that
       silently disappears teaches a stakeholder nothing about why it is
       absent, so the published case is shown as refused, with its
       reason, in the same place the control would otherwise be. */
    /* ── R17 — IS THIS RECORD STUCK RIGHT NOW? ───────────────────
       The override card has always been able to FIX a deadlock; nothing
       on the screen told the Super Admin one existed. Derived from the
       same two facts `P.blockedRecords` uses, so the record page and the
       Content governance list can never disagree about which records
       are stalled.

       A PUBLISHED record is excluded by construction: its status has no
       holder role, it has left the production chain, and implying an
       override might rescue it would be the publish firewall leaking. */
    var holderMeta = state.contentStatusMeta(rec.status);
    var holderRole = holderMeta ? holderMeta.holder : null;
    var liveHolders = holderRole ? state.actorsForRecord(rec, holderRole) : [];
    var isStuck = !isPublished && !!holderRole && !liveHolders.length;

    var stuckAlert = isStuck
      ? ui.alertBox('warning', 'Nobody can act on this Experiment',
          '<p>It sits in <strong>' + esc(statusLabelFor(rec.status)) + '</strong>, which is held by the ' +
          '<strong>' + esc(state.contentRoleLabel(holderRole)) + '</strong>, and <strong>no live scope covers ' +
          'this Experiment in that role</strong>. It cannot move on its own, and whoever used to hold it no ' +
          'longer sees it as work &mdash; though everything they already decided stays in the history below, ' +
          'with their name on it.</p>' +
          '<p style="margin-top:8px">Two things resolve it, and both are yours. <strong>Assign a scope</strong> ' +
          'in <a href="' + P.href.roles() + '">Role governance</a> &mdash; the proper repair, because it returns ' +
          'the work to a named person who can finish it. Or use the <strong>platform override</strong> further ' +
          'down to move the record to a stage somebody live can reach; that unsticks the chain without widening ' +
          'anybody&rsquo;s ordinary authority, and it changes no licence, entitlement, publication or academic ' +
          'decision.</p>')
      : '';

    var overrideDests = state.overrideDestinations(rec.id);
    var overrideBody;
    if (isPublished) {
      overrideBody = ui.alertBox('warning', 'A published Experiment is not moved from here',
        '<p>This Experiment is published, and an override will not move it &mdash; <strong>in either ' +
        'direction</strong>.</p>' +
        '<p>First publication is the Content Manager&rsquo;s act, and there is no publish control anywhere in ' +
        'this workspace; replacing what the catalogue shows is yours, through <strong>Release / Hold</strong> ' +
        'above, which acts on a <em>later version</em> &mdash; a different object with its own decision. An ' +
        'override that could reach across that line would be a publish control by another name, and it would ' +
        'strand the institutional access, Faculty mappings, assignments and in-progress attempts that already point ' +
        'at this Experiment.</p>');
    } else if (!overrideDests.length) {
      overrideBody = '<p class="muted">No destination is available for this record.</p>';
    } else {
      overrideBody =
        '<p class="chelp">This record is in <strong>' + esc(statusLabelFor(rec.status)) +
        '</strong>. An override moves it to another point in the production chain when the chain itself is ' +
        'stuck &mdash; most often because the only person assigned to it no longer holds a scope covering it. ' +
        'Each destination below says who normally holds a record there, and whether anybody live actually ' +
        'does.</p>' +
        '<div class="attn">' +
        overrideDests.map(function (d) {
          var names = d.actors.map(function (a) {
            return '<a href="' + P.href.actor(a.id) + '">' + esc(a.name) + '</a>';
          }).join(', ');
          return '<div class="at-row' + (d.reachable ? '' : ' warn') + '">' +
            '<span class="at-ic">' + ui.ic(d.reachable ? 'arrowR' : 'alert') + '</span>' +
            '<div class="at-body"><div class="at-t">Move to ' + esc(statusLabelFor(d.status)) + '</div>' +
            '<p>' +
            (d.holderLabel
              ? 'A record in this state is held by the <strong>' + esc(d.holderLabel) + '</strong>.' +
                statusOriginNote(d.status) + ' '
              : '') +
            (d.reachable
              ? d.actors.length + ' ' + util.plural(d.actors.length, 'person', 'people') +
                ' currently ' + (d.actors.length === 1 ? 'holds' : 'hold') +
                ' a live scope covering this Experiment: ' + names + '.'
              : '<strong>Nobody holds a live scope covering this Experiment in that role.</strong> Moving it ' +
                'there would leave the record with nobody able to act on it &mdash; the same deadlock in a ' +
                'different place. Assign a scope in <a href="' + P.href.roles() + '">Role governance</a> first.') +
            '</p></div>' +
            '<button class="btn sm sec" type="button" data-ovr-to="' + esc(d.status) + '">' +
            'Move here<span class="sr-only"> — ' + esc(rec.name) + ' to ' +
            esc(statusLabelFor(d.status)) + '</span></button>' +
            '</div>';
        }).join('') +
        '</div>';
    }
    var overrideCard = ui.card('Platform override — move this Experiment in the workflow',
      overrideBody +
      /* KEPT, AND SHORTENED. This is a product warning on a powerful
         control, not engineering clutter, so it stays — but it was
         making two of its five claims twice ("not extra authority" and
         "widens nobody's authority by a single step" are the same
         sentence). Every distinct claim survives. */
      '<p class="cardfoot"><strong>This is an override, not extra authority.</strong> It changes no licence, ' +
      'entitlement, publication or academic decision: the Vendor still submits, the Academic Reviewer still ' +
      'owns the Learning Outcomes, and the Content Manager still controls first publication. Every override is ' +
      'written into this Experiment&rsquo;s own history with your reason, and nothing is sent to anybody.</p>',
      null, 'h2');

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
        /* ⚠ THE ROLE COMES FROM THE VERSION, NOT FROM AN ASSUMPTION.
           A Content Manager's correction is not a Vendor submission,
           and this is the panel where the Super Admin decides on it. */
        '<div class="k">Raised by</div><div class="v">' +
          XRSLP.versionUI.raisedByLine(pending) + XRSLP.versionUI.correctionChip(pending) + '</div>' +
        '<div class="k">Academic approval</div><div class="v">' +
        esc(pending.academicDecisionByName || '—') +
        (pending.academicDecisionAt ? ' <span class="muted">· ' + esc(util.fmtDate(pending.academicDecisionAt)) + '</span>' : '') +
        '</div>' +
        '</div>' +
        /* h3: the panel sits inside an h2 card, and no heading level is
           skipped anywhere in the outline. */
        /* ── Implementation 09 QA — WHAT A RELEASE WOULD CHANGE ──
           The same safety principle as the Academic Reviewer's screen,
           on the surface where the decision is final: before Release or
           Hold, the Super Admin sees the current live value beside the
           proposed one, for every field that actually moves — and one
           line saying everything else is carried forward. */
        '<h3 class="vd-sh">What releasing version ' + esc(pending.versionLabel) +
          ' would change</h3>' +
        XRSLP.versionUI.diff(rec, pending, { hideReason: true }) +
        '<h3 class="vd-sh">Description this version would make current</h3>' +
        '<p class="vd-d">' + esc(pending.description) + '</p>' +
        /* A release writes this version's per-technology delivery onto
           the published Experiment, so the person taking that decision
           has to be able to see it first. Read-only: the Vendor owns
           these technical references (STK31-08). */
        '<h3 class="vd-sh">Technology delivery a release would write</h3>' +
        XRSLP.versionUI.delivery(rec, pending) +
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
            '<div class="tl-who">' + esc(v.createdByName) + ' · ' +
              esc(XRSLP.versionUI.raisedByRole(v)) + ' · ' + esc(util.fmtDateTime(v.createdAt)) + '</div>' +
            (v.changeNote ? '<p class="tl-note">' + esc(v.changeNote) + '</p>' : '') +
            /* ── R17 — THE VERSION'S DURABLE LINE, NOT ITS CURRENT FIELD ──
               This read `v.releaseDecision`, which is the version's
               CURRENT decision and is set to null the moment a hold is
               lifted. So holding a version with a stated reason and then
               lifting the hold erased the reason: the timeline showed a
               version that had simply been approved, and the fact that
               the Super Admin had once held it back — and why — was
               gone from every surface in the build.

               `v.history` is append-only and carries the same events
               plus the lift itself, so it survives. Same defect and the
               same fix as the withdraw/restore line on a role scope. */
            (Array.isArray(v.history) ? v.history : []).map(function (e) {
              return '<p class="tl-note"><strong>' + esc(e.label) + '</strong> · ' +
                esc(e.actorName || 'Super Admin') +
                (e.actorRole ? ' <span class="muted">(' + esc(e.actorRole) + ')</span>' : '') +
                ' · ' + esc(util.fmtDateTime(e.at)) +
                (e.note ? ' — &ldquo;' + esc(e.note) + '&rdquo;' : '') + '</p>';
            }).join('') +
            '</div></div>';
        }).join('') + '</div>'
      : '<p class="muted">No later version has been submitted for this experiment.</p>';

    /* THE CONSTRAINT ON A RELEASE, ATTACHED TO THE RELEASE DECISION.
       This was a rail `gapNote` tagged OPEN POLICY QUESTION, framed
       around what no source states. The RULE is real and binds the
       decision being taken on this card — a release cannot change
       technology availability, and no tenant's entitlement moves — so it
       belongs here, in product language. The reason it is a rule rather
       than a feature is that nothing states what should happen to a
       tenant already holding a technology a newer version drops; that
       is a note for the build team, and this is its home. */
    var versionCard = ui.card('Later versions — Release / Hold',
      decisionHTML + '<h3 class="vh">Version history</h3>' + versionRows +
      '<p class="cardfoot">A later version carries the description, the version label, the vendor notes and the ' +
      'per-technology delivery references. It <strong>cannot change technology availability</strong>: a tenant ' +
      'that holds a technology today still holds it after any release or hold.</p>', null, 'h2');

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
      stuckAlert +
      '<div class="grid-rail">' +
      '<div class="stack">' + current + versionCard + metaCard + overrideCard + '</div>' +
      /* The rail's OPEN POLICY QUESTION note is gone: the rule it
         carried is now stated on the Release / Hold card, beside the
         decision it constrains. */
      '<div class="stack">' + ownership + historyCard +
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
            }, (document.getElementById('cm-reason-i') || {}).value || '');
            if (!res.ok) { busy = false; ui.showErrors(form, res.errors, 'Please correct the metadata'); return; }
            ui.toast('Canonical metadata updated.');
            XRSLP.render(false);
          });
        }

        /* The override, with its consequence stated before it is taken
           and a reason required to take it — the same treatment the
           platform override on a student already carries. The state
           layer returns null on a missing reason, so the refusal is
           reported from the return value rather than pre-empted here:
           one rule, in one place, and the screen cannot drift from it. */
        Array.prototype.slice.call(document.querySelectorAll('[data-ovr-to]')).forEach(function (btn) {
          btn.addEventListener('click', function () {
            var to = btn.getAttribute('data-ovr-to');
            var dest = overrideDests.filter(function (d) { return d.status === to; })[0];
            if (!dest) { return; }
            var destLabel = statusLabelFor(dest.status);
            ui.openDialog({
              title: 'Move ' + rec.name + ' to ' + destLabel + '?',
              bodyHTML:
                '<p>This is a <strong>platform override</strong> of the content production chain. ' +
                '<strong>' + esc(rec.name) + '</strong> moves from <strong>' +
                esc(statusLabelFor(rec.status)) + '</strong> to <strong>' +
                esc(destLabel) + '</strong>.</p>' +
                (dest.reachable
                  ? '<div class="consequence">' + ui.ic('check') + '<span>' + dest.actors.length + ' ' +
                    util.plural(dest.actors.length, 'person', 'people') + ' ' +
                    (dest.actors.length === 1 ? 'holds' : 'hold') + ' a live scope covering this Experiment as ' +
                    esc(dest.holderLabel || 'its holder') + ', so the record can be acted on once it arrives.</span></div>'
                  : '<div class="consequence">' + ui.ic('alert') + '<span><strong>Nobody can act on it there.</strong> ' +
                    'No live scope covers this Experiment as ' + esc(dest.holderLabel || 'its holder') + ', so the ' +
                    'record would sit in ' + esc(destLabel) + ' exactly as stuck as it is now. Assigning a scope ' +
                    'in Role governance first is the fix; this move is not.</span></div>') +
                '<div class="consequence">' + ui.ic('shield') + '<span>No licence, entitlement, assignment, ' +
                'publication or academic decision changes, and nobody&rsquo;s ordinary authority widens. ' +
                'Learning Outcomes, the recorded academic approval and the technology delivery are untouched.</span></div>' +
                '<div class="field" id="ovr-reason" style="margin-top:12px">' +
                '<label for="ovr-reason-i">Reason <span class="req">(required)</span></label>' +
                '<input type="text" id="ovr-reason-i" autocomplete="off"></div>' +
                '<p class="muted" style="margin-top:8px">Recorded in this Experiment&rsquo;s own history, which ' +
                'the Vendor, the Academic Reviewer and the Content Manager all read. Nothing is sent to ' +
                'anybody.</p>',
              okLabel: 'Move by override',
              onConfirm: function (body) {
                var input = body ? body.querySelector('#ovr-reason-i') : null;
                var out = state.overrideContentStatusAsPlatform(rec.id, to, input ? input.value : '');
                ui.toast(out
                  ? rec.name + ' moved to ' + destLabel + ' by platform override.'
                  : 'No change — a reason is required for a platform override.');
                XRSLP.render(false);
              }
            });
          });
        });

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
                'No institutional access, licence quantity, technology variant or student assignment changes, and no ' +
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
                'by this action</strong> — the published version stays live until you release it explicitly.</p>' +
                '<div class="consequence">' + ui.ic('shield') + '<span>The hold itself is <strong>not ' +
                'erased</strong>. It stays in this version&rsquo;s history with the reason recorded at the time, ' +
                'and so does this lift — the version does not go back to looking as though it was never ' +
                'held.</span></div>' +
                (heldOne.releaseDecision && heldOne.releaseDecision.note
                  ? '<div class="consequence">' + ui.ic('doc') + '<span>It was held for this reason: &ldquo;' +
                    esc(heldOne.releaseDecision.note) + '&rdquo;</span></div>'
                  : '') +
                '<div class="field" id="v-unote" style="margin-top:12px">' +
                '<label for="v-unote-i">Reason for lifting it <span class="muted">(optional)</span></label>' +
                '<input type="text" id="v-unote-i" autocomplete="off">' +
                '<p class="hint">Recorded in the version history. Optional: lifting a hold returns the version ' +
                'to a decision rather than taking one, and nothing becomes public because of it.</p></div>',
              okLabel: 'Lift the hold',
              onConfirm: function (body) {
                var input = body ? body.querySelector('#v-unote-i') : null;
                state.returnHeldVersionToDecision(heldOne.id, input ? input.value : '');
                ui.toast('Hold lifted. The version is back on the Release / Hold decision, and the hold stays ' +
                  'on its history.');
                XRSLP.render(false);
              }
            });
          });
        }
      }
    };
  };
})();
