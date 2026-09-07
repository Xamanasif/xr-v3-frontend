/* ============================================================
   Unified Functional Platform — selection basket + institutional
   request screens.

   Invariants enforced here:
     · CART / SELECTION ≠ ENTITLEMENT — nothing on these screens
       grants access.
     · Every selected experiment carries ≥ 1 technology.
     · One request record per submission; refresh cannot duplicate.
     · The payment route renders ONLY for an external request in
       APPROVED_PAYMENT_REQUIRED — the internal route simply does
       not contain a payment step (STK31-19).
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

  function statusHref(id) { return '#/request-status/' + encodeURIComponent(id); }

  function itemContextLine(item) {
    var ctx = data.contextOf(item.experimentId);
    if (!ctx) { return ''; }
    return esc(ctx.grouping.name) + ' › ' + esc(ctx.course.name);
  }

  /* ============================================================
     EXPANSION OF EXISTING ACCESS — Implementation 07.2, rule A.

     "If the same institution requests the same experiment again, they
      can request additional licenses. It should show the existing plan
      when they reselect."

     A second request for an experiment an institution already holds has
     always been allowed and still is: nothing below blocks, disables or
     pre-fills anything. What these helpers add is the sentence the
     build never said — that such a request is an EXPANSION of access
     already in place rather than an accidental repeat of it.
     ============================================================ */

  /* One access record, named. Everything here is read from the record
     itself, so an expired record reads as expired and a record that
     narrows what was asked for reads as what was actually granted. */
  function recordPhrase(rec) {
    var termDef = data.term(rec.term);
    var termState = state.accessTermState(rec);
    return esc(rec.id) + ' (' + rec.quantity + ' ' + util.plural(rec.quantity, 'licence') + ', ' +
      esc(termDef ? termDef.label : rec.term) +
      (rec.endsOn ? ' until ' + esc(util.fmtDate(rec.endsOn)) : '') +
      ', ' + esc(termState.label) + ')';
  }

  /* THE "UNAFFECTED" SENTENCE, NAMED.

     Both decision surfaces told the institution that access it already
     held was unaffected, and both said it in the abstract — which is
     the least useful place to be vague, because a second request for an
     experiment the institution already holds is exactly when the reader
     wants to know WHICH records those are and that they are still
     theirs, untouched, whatever happens to the request on screen.

     When the request's institution does not resolve — the ordinary
     state of a first request, before any tenant exists — the sentence
     stays the generality it has always been. It does NOT claim there is
     no other access: the lookup is a seeded-id-then-name match and
     cannot support that inference.

     "Earlier" became "other" deliberately. The records are selected by
     which request wrote them, not by date, and an institution's second
     request can be activated before a first one still sitting at the
     payment step — so calling every other record "earlier" would state
     an ordering the screen has not checked. */
  function unaffectedHTML(r) {
    var tenant = state.resolveRequestTenant(r);
    if (!tenant) {
      return '<p style="margin-top:8px">Any access the institution already holds under another request is ' +
        'unaffected and continues exactly as it is.</p>';
    }
    /* Records written by THIS request are not other access — on the
       payment step there are none yet, and after activation the record
       this request created must not be listed as something it leaves
       alone. */
    var others = state.accessForTenant(tenant.id).filter(function (rec) {
      /* THE RECORD A RENEWAL RENEWS IS NOT "OTHER ACCESS", and it is
         emphatically not unaffected — it is the one thing this request
         changes. It carries the ORIGINAL request's id, so the
         `requestId` test above cannot exclude it, and without this a
         renewal told the institution that the very record it is
         renewing "continues exactly as it is". */
      return rec.requestId !== r.id && rec.id !== r.renewsAccessId;
    });
    /* What this request does to the record it renews, stated plainly. */
    var renewed = r.renewsAccessId ? state.accessById(r.renewsAccessId) : null;
    var renewalLine = renewed
      ? '<p style="margin-top:8px">This is a <strong>renewal</strong> of ' + recordPhrase(renewed) + '. ' +
        'Nothing about it changes until this request completes: the same experiments, the same technologies ' +
        'and the same licence quantity continue, and only then does its access term move forward. ' +
        'No second access record is created, so every student already assigned under it stays assigned.</p>'
      : '';
    if (!others.length) {
      return renewalLine + '<p style="margin-top:8px">' + esc(tenant.name) +
        ' holds no access record from any other request, so there is nothing else for this one to affect.</p>';
    }
    return renewalLine + '<p style="margin-top:8px">Access ' + esc(tenant.name) +
      ' already holds under its other requests is ' +
      'unaffected and continues exactly as it is — ' + others.map(recordPhrase).join('; ') + '. ' +
      'Each record keeps its own technologies, term and licence quantity.</p>';
  }

  /* ---------------- selection basket ---------------- */
  XRSLP.screens.selection = function () {
    var items = state.selectionItems();

    if (!items.length) {
      var emptyHtml =
        ui.phead('Selection') +
        '<div class="tablecard">' +
        ui.emptyState({
          icon: 'basket',
          title: 'Your selection is empty',
          body: 'Browse the catalogue and add experiments — with the technology formats your institution needs — to prepare an institutional access request.',
          actionsHTML: '<a class="btn pri" href="#/catalogue">Browse catalogue</a>'
        }) + '</div>';
      return { title: 'Selection', html: emptyHtml, navKey: 'selection' };
    }

    var techCount = items.reduce(function (n, i) { return n + i.technologies.length; }, 0);

    var rows = items.map(function (item) {
      var ctx = data.contextOf(item.experimentId);
      var e = ctx.experiment;
      var checks = data.sortTech(e.technologies).map(function (t) {
        var def = data.TECHNOLOGIES[t];
        var checked = item.technologies.indexOf(t) !== -1;
        var id = 'sel-' + esc(e.id) + '-' + esc(t);
        var labelText = def.label + (def.name !== def.label ? ' — ' + def.name : '');
        return '<label for="' + id + '"><input type="checkbox" id="' + id + '" data-exp="' + esc(e.id) + '" value="' + esc(t) + '"' +
          (checked ? ' checked' : '') + '>' + esc(labelText) + '</label>';
      }).join('');
      return '<article class="selrow" id="row-' + esc(e.id) + '">' +
        '<div class="sr-top"><div>' +
        '<div class="sr-ctx">' + itemContextLine(item) + '</div>' +
        '<h3><a href="#/experiment/' + encodeURIComponent(e.id) + '">' + esc(e.name) + '</a></h3>' +
        '</div>' +
        '<button class="btn sm sec sr-remove" type="button" data-remove="' + esc(e.id) + '">' +
        ui.ic('x', 'sm') + 'Remove</button></div>' +
        '<fieldset class="sr-tech"><legend>Technologies for this experiment</legend>' +
        '<div class="techchecks">' + checks + '</div>' +
        '<div class="sr-err" id="err-' + esc(e.id) + '"></div>' +
        '</fieldset></article>';
    }).join('');

    var html =
      ui.phead('Selection', items.length + ' ' + util.plural(items.length, 'experiment') + ' · ' +
        techCount + ' technology ' + util.plural(techCount, 'selection')) +
      '<div class="selgrid">' +
      '<div class="stack" id="sel-rows">' + rows + '</div>' +
      '<aside class="sumcard" aria-labelledby="sum-h">' +
      '<div class="sc-head" id="sum-h">Request summary</div>' +
      '<div class="sc-body">' +
      '<div class="sumline"><span>Experiments</span><span class="sl-v">' + items.length + '</span></div>' +
      '<div class="sumline"><span>Technology selections</span><span class="sl-v">' + techCount + '</span></div>' +
      '</div>' +
      '<div class="sc-act">' +
      '<a class="btn pri blk" href="#/request">' + ui.ic('arrowR') + 'Prepare institutional request</a>' +
      '<a class="btn gho blk" href="#/catalogue">Continue browsing</a>' +
      '</div>' +
      '<div class="sc-legal">A selection is not access. Submitting the institutional request sends it for ' +
      'platform review; access activates only after approval' +
      ' — and payment, where it applies. No pricing is shown: commercial amounts are not configured in this prototype.</div>' +
      '</aside></div>';

    return {
      title: 'Selection',
      html: html,
      navKey: 'selection',
      after: function () {
        Array.prototype.slice.call(document.querySelectorAll('[data-remove]')).forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = btn.getAttribute('data-remove');
            var e = data.experiment(id);
            state.selectionRemove(id);
            ui.toast((e ? e.name : 'Experiment') + ' removed from your selection.', 'info');
            XRSLP.render(true);
            ui.focusMain(true);
          });
        });
        Array.prototype.slice.call(document.querySelectorAll('.techchecks input')).forEach(function (box) {
          box.addEventListener('change', function () {
            var expId = box.getAttribute('data-exp');
            var chosen = Array.prototype.slice.call(
              document.querySelectorAll('.techchecks input[data-exp="' + expId + '"]:checked')
            ).map(function (i) { return i.value; });
            var errBox = document.getElementById('err-' + expId);
            if (!chosen.length) {
              /* At least one technology must stay selected (request invariant). */
              box.checked = true;
              if (errBox) {
                errBox.innerHTML = '<div class="ferr" role="alert">' + ui.ic('alertCirc', 'sm') +
                  'At least one technology must stay selected. Remove the experiment instead if it is no longer needed.</div>';
              }
              return;
            }
            if (errBox) { errBox.innerHTML = ''; }
            state.selectionSetTech(expId, chosen);
            var boxId = box.id;
            XRSLP.render(true);
            var again = document.getElementById(boxId);
            if (again) { again.focus(); }
            ui.announce('Technology selection updated.');
          });
        });
      }
    };
  };

  /* ---------------- institutional request form ---------------- */
  XRSLP.screens.requestForm = function () {
    var items = state.selectionItems();
    if (!items.length) { return { redirect: '#/selection' }; }

    var sc = state.scenario();
    var draft = state.draft() || {};
    var techCount = items.reduce(function (n, i) { return n + i.technologies.length; }, 0);

    /* Rule A. The institution is resolved from THE NAME IN THE FORM —
       the same value `resolveRequestTenant` will match this request to
       at approval — falling back to the prototype scenario only while
       the field still holds its default.

       Reading the scenario unconditionally was a real defect: a visitor
       who cleared the prefilled name and typed a different institution
       was shown the SEEDED institution's access records, licence counts
       and terms, and told that "this request expands access <their own
       institution> already holds". An unrecognised name now resolves to
       null and the whole expansion framing simply does not render,
       which is the honest answer for an institution the platform has
       never heard of.

       `state.requesterTenant` is prototype-only and grants nothing. */
    var inst = state.requesterTenant(
      draft.institutionName != null ? draft.institutionName : sc.institution.name);
    var heldSel = inst ? state.heldSelectionFor(inst.id, items) : [];
    var heldByExp = {};
    heldSel.forEach(function (h) { heldByExp[h.experimentId] = h.rows; });

    var itemList = items.map(function (item) {
      var ctx = data.contextOf(item.experimentId);
      var heldRows = heldByExp[item.experimentId];
      return '<div class="ri"><div class="ri-body">' +
        '<div class="ri-ctx">' + itemContextLine(item) + '</div>' +
        '<div class="ri-t">' + esc(ctx.experiment.name) + '</div>' +
        (heldRows
          ? '<div class="ri-ctx" style="margin-top:3px">Already held under ' +
            heldRows.map(function (row) { return esc(row.record.id); }).join(', ') + '</div>'
          : '') + '</div>' +
        '<div class="ri-tech">' + ui.techBadges(item.technologies) + '</div></div>';
    }).join('');

    /* The expansion statement, above the form, so it is read before the
       institution fills anything in. It names every held experiment and
       every record separately: two records covering the same experiment
       have independent technologies, terms and licence counts, and a
       merged line would describe neither of them. */
    var expansionHTML = '';
    if (heldSel.length) {
      /* An institution whose records have all expired still has an
         access history for these experiments, and it still matters that
         this request adds to it rather than repeating it — but it does
         not "already hold" anything, so the heading does not say so. */
      var anyLive = heldSel.some(function (h) {
        return h.rows.some(function (row) { return row.live; });
      });
      var anyExpired = heldSel.some(function (h) {
        return h.rows.some(function (row) { return !row.live; });
      });

      var heldRowsHTML = heldSel.map(function (h) {
        var ctx = data.contextOf(h.experimentId);
        return '<div class="ri"><div class="ri-body">' +
          '<div class="ri-ctx">' + (ctx ? esc(ctx.grouping.name) + ' › ' + esc(ctx.course.name) : '') + '</div>' +
          '<div class="ri-t">' + esc(ctx ? ctx.experiment.name : h.experimentId) + '</div>' +
          h.rows.map(function (row) {
            return '<div class="ri-ctx" style="margin-top:4px">Held under ' + recordPhrase(row.record) + ' — ' +
              ui.techBadges(row.technologies) + '</div>';
          }).join('') +
          '</div></div>';
      }).join('');

      expansionHTML =
        ui.alertBox('info',
          anyLive
            ? 'This request expands access ' + inst.name + ' already holds'
            : 'This request adds to access ' + inst.name + ' has held before',
          '<p>' + esc(inst.name) + ' already has access records covering ' + heldSel.length + ' ' +
          util.plural(heldSel.length, 'experiment') + ' in this selection. Submitting this request asks for ' +
          '<strong>additional licences</strong> alongside the records below — it is an expansion of existing ' +
          'institutional access, not a repeat of it. Nothing already held is replaced, reduced or ended by ' +
          'submitting it, and approval would add a further access record beside the existing ones rather than ' +
          'rewriting them.</p>' +
          '<div class="reqitems" style="margin-top:8px">' + heldRowsHTML + '</div>' +
          (anyExpired
            ? '<p style="margin-top:8px">A record shown as <strong>Expired</strong> is listed because it is part ' +
              'of this institution&rsquo;s access history. While it is expired it grants nothing.</p>'
            : '')) +
        /* Labelled where the expansion claim is made, so the reader sees
           the confirmed part and the open part in one place. */
        ui.gapNote('EXPANSION SCOPE NOT SETTLED',
          '<p>It is confirmed that an institution may request <strong>additional licences</strong> for an ' +
          'experiment it already holds. What is <strong>not</strong> settled is whether that same expansion ' +
          'request may also add technology variants the institution does not currently hold, or change the ' +
          'access term of what it holds.</p>' +
          '<p style="margin-top:6px">This build neither blocks nor assumes either answer: every technology ' +
          'stays selectable on the selection page, every access term stays choosable below, and no rule is ' +
          'encoded in either direction here.</p>');
    }

    /* The licence arithmetic the requester is actually doing, stated
       once and derived rather than typed. `tenantAllocation().approved`
       is a SUM OF APPROVED LICENCES across the institution's live access
       records — an allocation figure, never a count of students, and it
       is labelled that way because the same number read as "students"
       has already caused one contradiction elsewhere in this build. */
    var alloc = inst ? state.tenantAllocation(inst.id) : null;

    function qtyExpansionHTML(rawQty) {
      if (!alloc || !alloc.records) { return ''; }
      var raw = String(rawQty == null ? '' : rawQty).trim();
      var q = parseInt(raw, 10);
      var asks = (raw !== '' && !isNaN(q) && q > 0 && String(q) === raw)
        ? 'this request asks for a further <strong>' + q + '</strong> ' + util.plural(q, 'licence') + ' on top of that'
        : 'the quantity entered above is a further licence figure on top of that';
      return esc(inst.name) + ' currently holds <strong>' + alloc.approved + '</strong> approved ' +
        util.plural(alloc.approved, 'licence') + ' across ' + alloc.records + ' live access ' +
        util.plural(alloc.records, 'record') + ', and ' + asks +
        '. These are licence figures, not student counts.';
    }

    var qtyExpansionLine = qtyExpansionHTML(draft.quantity);

    var termRadios = data.TERMS.map(function (t) {
      var checked = draft.term === t.id;
      return '<div class="radiorow"><input type="radio" name="term" id="term-' + esc(t.id) + '" value="' + esc(t.id) + '"' +
        (checked ? ' checked' : '') + '>' +
        '<label for="term-' + esc(t.id) + '">' + esc(t.label) + '</label></div>';
    }).join('');

    var paymentLine = sc.institution.paymentRequired ?
      'After platform approval, payment is required before access is activated.' :
      'No payment step applies to this access context. After platform approval, access is activated directly.';

    var html =
      ui.crumbs([{ label: 'Selection', href: '#/selection' }, { label: 'Institutional request' }]) +
      ui.phead('Institutional access request',
        'Review the selection, provide your institution details, and submit for platform review.') +
      '<div class="reqlayout">' +
      '<div class="stack">' +
      expansionHTML +
      '<form id="req-form" novalidate>' +
      '<section class="card"><div class="chead"><h2>Institution &amp; contact</h2></div><div class="cbody">' +
      '<div class="ctxpanel"><span class="cp-k">Access context:</span> ' + esc(sc.institution.accessContext) + '. ' +
      esc(paymentLine) + '</div>' +
      ui.protoNote('The access context above comes from the seeded requester scenario selected in Prototype ' +
        'controls. The production rule that classifies an institution as internal or external is not confirmed ' +
        'and is not implemented in this prototype.') +
      '<div class="form-errors" style="margin-top:14px"></div>' +
      '<div class="field" id="f-inst" style="margin-top:14px">' +
      '<label for="in-inst">Institution / organisation name <span class="req" aria-hidden="true">*</span></label>' +
      '<input type="text" id="in-inst" autocomplete="organization" value="' + esc(draft.institutionName != null ? draft.institutionName : sc.institution.name) + '">' +
      '</div>' +
      '<div class="frow">' +
      '<div class="field" id="f-contact">' +
      '<label for="in-contact">Contact person (SPOC) <span class="req" aria-hidden="true">*</span></label>' +
      '<input type="text" id="in-contact" autocomplete="name" value="' + esc(draft.contactName != null ? draft.contactName : sc.institution.contactName) + '">' +
      '</div>' +
      '<div class="field" id="f-email">' +
      '<label for="in-email">Contact email <span class="req" aria-hidden="true">*</span></label>' +
      '<input type="email" id="in-email" autocomplete="email" inputmode="email" value="' + esc(draft.contactEmail != null ? draft.contactEmail : sc.institution.contactEmail) + '">' +
      '</div></div>' +
      '</div></section>' +
      '<section class="card"><div class="chead"><h2>Access requirements</h2></div><div class="cbody">' +
      '<div class="field" id="f-qty">' +
      '<label for="in-qty">Users / licences required <span class="req" aria-hidden="true">*</span></label>' +
      '<input type="number" id="in-qty" min="1" step="1" inputmode="numeric" aria-describedby="qty-hint' +
      (qtyExpansionLine ? ' qty-expansion' : '') + '" value="' + esc(draft.quantity != null ? draft.quantity : '') + '">' +
      '<div class="hint" id="qty-hint">How many learners and staff need access under this request. The quantity is specific to this request — there is no platform-wide cap.</div>' +
      (qtyExpansionLine ? '<div class="hint" id="qty-expansion">' + qtyExpansionLine + '</div>' : '') +
      '</div>' +
      '<fieldset class="fgroup field" id="f-term"><legend>Access term <span class="req" aria-hidden="true">*</span></legend>' +
      termRadios +
      '</fieldset>' +
      '</div></section>' +
      '<div class="stack-sm">' +
      '<button class="btn pri lg" type="submit" form="req-form" id="req-submit">' + ui.ic('arrowR') + 'Submit institutional request</button>' +
      '<p class="sc-legal" style="padding:0;background:none;border:0">Submitting sends the request for platform review. ' +
      'No access is granted until the request is approved and, where applicable, payment is completed.</p>' +
      '</div>' +
      '</form>' +
      '</div>' +
      '<aside class="req-side">' +
      '<section class="card"><div class="chead"><h2>Selected content</h2>' +
      '<span class="cnote">' + items.length + ' ' + util.plural(items.length, 'experiment') + ' · ' + techCount + ' tech.</span></div>' +
      '<div class="cbody"><div class="reqitems">' + itemList + '</div>' +
      '<p style="margin-top:12px;font-size:12.5px;color:var(--text-3)">To change the content or technologies, ' +
      '<a href="#/selection">return to the selection</a>.</p>' +
      '</div></section>' +
      '</aside>' +
      '</div>';

    return {
      title: 'Institutional request',
      html: html,
      navKey: 'selection',
      after: function () {
        var form = document.getElementById('req-form');
        var submitting = false;

        function currentFields() {
          var qtyRaw = document.getElementById('in-qty').value;
          var termInput = form.querySelector('input[name="term"]:checked');
          return {
            institutionName: document.getElementById('in-inst').value.trim(),
            contactName: document.getElementById('in-contact').value.trim(),
            contactEmail: document.getElementById('in-email').value.trim(),
            quantityRaw: qtyRaw,
            term: termInput ? termInput.value : null
          };
        }

        /* Draft persistence — the DRAFT state of the request record. */
        form.addEventListener('input', function () {
          var f = currentFields();
          /* The expansion line quotes the quantity being typed, so it is
             recomputed here rather than left showing the figure the page
             happened to render with. It is derived from the same state
             either way — nothing is stored for it. */
          var expLine = document.getElementById('qty-expansion');
          if (expLine) { expLine.innerHTML = qtyExpansionHTML(f.quantityRaw); }
          state.draftSave({
            institutionName: f.institutionName,
            contactName: f.contactName,
            contactEmail: f.contactEmail,
            quantity: f.quantityRaw,
            term: f.term
          });
        });

        form.addEventListener('submit', function (evt) {
          evt.preventDefault();
          if (submitting) { return; }
          var f = currentFields();
          var errs = [];
          if (!f.institutionName) { errs.push({ field: 'f-inst', message: 'Enter the institution or organisation name.' }); }
          if (!f.contactName) { errs.push({ field: 'f-contact', message: 'Enter a contact person for this request.' }); }
          if (!f.contactEmail) { errs.push({ field: 'f-email', message: 'Enter a contact email address.' }); }
          else if (!util.isEmail(f.contactEmail)) { errs.push({ field: 'f-email', message: 'Enter a valid email address, e.g. name@institution.example.' }); }
          var qty = parseInt(f.quantityRaw, 10);
          if (f.quantityRaw === '' || isNaN(qty)) { errs.push({ field: 'f-qty', message: 'Enter the number of users / licences required.' }); }
          else if (qty <= 0 || String(qty) !== String(f.quantityRaw).trim()) { errs.push({ field: 'f-qty', message: 'The user / licence quantity must be a whole number greater than zero.' }); }
          if (!f.term) { errs.push({ field: 'f-term', message: 'Choose an access term — Monthly, Quarterly or Yearly.' }); }

          if (!ui.showErrors(form, errs, 'The request cannot be submitted yet')) { return; }

          submitting = true;
          document.getElementById('req-submit').setAttribute('disabled', 'disabled');
          var req = state.submitRequest({
            institutionName: f.institutionName,
            contactName: f.contactName,
            contactEmail: f.contactEmail,
            quantity: qty,
            term: f.term
          });
          ui.toast('Request ' + req.id + ' submitted for platform review.');
          XRSLP.router.go(statusHref(req.id));
        });
      }
    };
  };

  /* ---------------- request list (per requester scenario) ---------------- */
  XRSLP.screens.requestList = function () {
    var sc = state.scenario();
    var reqs = state.requestsForScenario(sc.id).slice().reverse();

    var body;
    if (!reqs.length) {
      body = '<div class="tablecard">' + ui.emptyState({
        icon: 'doc',
        title: 'No requests yet',
        body: 'When ' + sc.institution.name + ' submits an institutional access request, it appears here with its review state.',
        actionsHTML: '<a class="btn pri" href="#/catalogue">Browse catalogue</a>'
      }) + '</div>';
    } else {
      var rows = reqs.map(function (r) {
        return '<tr>' +
          '<td data-label="Request"><a class="rowlink" href="' + statusHref(r.id) + '">' +
          '<span class="tmain">' + esc(r.id) + '</span>' +
          '<span class="tsub">Submitted ' + esc(util.fmtDate(r.submittedAt)) + '</span></a></td>' +
          '<td data-label="Experiments" class="num">' + r.items.length + '</td>' +
          '<td data-label="Users" class="num">' + r.quantity + '</td>' +
          '<td data-label="Term">' + esc((data.term(r.term) || {}).label || r.term) + '</td>' +
          '<td data-label="Status">' + ui.statusBadge(r.status) + '</td>' +
          '<td class="cell-actions"><a class="btn sm sec" href="' + statusHref(r.id) + '">Open</a></td>' +
          '</tr>';
      }).join('');
      body = '<div class="tablecard"><div class="tscroll">' +
        '<table class="dt"><caption class="sr-only">Institutional access requests submitted by ' + esc(sc.institution.name) + '</caption>' +
        '<thead><tr><th scope="col">Request</th><th scope="col">Experiments</th><th scope="col">Users</th>' +
        '<th scope="col">Term</th><th scope="col">Status</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table></div></div>';
    }

    var html =
      ui.phead('Institutional requests', 'Requests submitted by ' + esc(sc.institution.name) + '.') +
      body +
      '<div style="margin-top:16px">' +
      ui.protoNote('In production, an institution sees only its own requests after signing in. This prototype has no ' +
        'authentication: the list shows the requests of the requester scenario chosen in Prototype controls.') +
      '</div>';

    return { title: 'Institutional requests', html: html, navKey: 'requests' };
  };

  /* What the platform APPROVED, where it differs from what was
     requested. Shown to the applicant on their own status screen, on
     both routes — a narrowed grant that only the granting side can see
     is not a decision the institution has been told about. */
  function grantedCard(r) {
    var g = r.grant;
    if (!g) { return ''; }
    return ui.card('What was approved',
      '<p class="muted" style="margin:0 0 10px">The platform approved <strong>less</strong> than this request ' +
      'asked for. These are the approved figures; the original request is shown below, unchanged.</p>' +
      '<div class="kv">' +
      '<div class="k">Experiments</div><div class="v">' + g.items.length +
      ' <span class="muted">(' + r.items.length + ' requested)</span></div>' +
      '<div class="k">Users / licences</div><div class="v">' + g.quantity +
      ' <span class="muted">(' + r.quantity + ' requested)</span></div>' +
      '<div class="k">Access term</div><div class="v">' +
      esc((data.term(g.term) || {}).label || g.term) +
      (g.term !== r.term
        ? ' <span class="muted">(' + esc((data.term(r.term) || {}).label || r.term) + ' requested)</span>' : '') +
      '</div></div>' +
      '<div class="reqitems" style="margin-top:12px">' + g.items.map(function (item) {
        var ctx = data.contextOf(item.experimentId);
        return '<div class="ri"><div class="ri-body">' +
          '<div class="ri-ctx">' + (ctx ? esc(ctx.grouping.name) + ' › ' + esc(ctx.course.name) : '') + '</div>' +
          '<div class="ri-t">' + esc(ctx ? ctx.experiment.name : item.experimentId) + '</div></div>' +
          '<div class="ri-tech">' + ui.techBadges(item.technologies) + '</div></div>';
      }).join('') + '</div>' +
      '<p class="cardfoot">To change what the institution holds, submit a new institutional request. ' +
      'Nothing on this page grants access on its own.</p>', null, 'h2');
  }

  /* ---------------- request status (applicant view) ---------------- */
  XRSLP.screens.requestStatus = function (params) {
    var r = state.request(params.id);
    if (!r) { return XRSLP.screens.notFound(); }

    var termLabel = (data.term(r.term) || {}).label || r.term;

    var statusBlock = '';
    if (r.status === state.STATUS.SUBMITTED) {
      statusBlock =
        ui.alertBox('info', 'Submitted — awaiting platform review',
          '<p>The platform team reviews institutional access requests. You will see the state change here once a decision is made. No access is granted before approval.</p>') +
        '<div style="margin-top:12px">' +
        ui.protoNote('To act as the reviewer in this prototype, switch to <strong>Super Admin</strong> in the Prototype controls strip.') +
        '</div>';
    } else if (r.status === state.STATUS.INFO_REQUESTED) {
      /* STK31-20's second outcome, from the applicant's side: a state
         they can see, with the reason, and a way back into the queue. */
      statusBlock =
        ui.alertBox('warning', 'More information requested',
          '<p>The platform has asked for more information before deciding this request. It is ' +
          '<strong>not</strong> approved and <strong>not</strong> refused, and nothing has been activated.</p>' +
          (r.decisionReason
            ? '<p style="margin-top:8px"><strong>What was asked for:</strong> ' + esc(r.decisionReason) + '</p>'
            : '') +
          '<p style="margin-top:8px">Reply below to return the request to the platform review queue. ' +
          'Your selected content, quantity and term are unchanged.</p>') +
        '<form class="card" id="resub-form" novalidate style="margin-top:12px"><div class="cbody">' +
        '<div class="form-errors"></div>' +
        '<div class="field" id="resub-note"><label for="rsn">Your reply <span class="req">(required)</span></label>' +
        '<textarea id="rsn" rows="3" placeholder="The information the platform asked for."></textarea>' +
        '<div class="fhint">Recorded on this request&rsquo;s history, which the platform reviewer reads. ' +
        'Nothing is sent — there is no email or notification provider in this build.</div></div>' +
        '<div class="formact"><button class="btn pri" type="button" id="resub-go">Resubmit request</button></div>' +
        '</div></form>';
    } else if (r.status === state.STATUS.APPROVED_PAYMENT_REQUIRED) {
      statusBlock =
        ui.alertBox('warning', 'Approved — payment required',
          '<p>The platform has approved this request. Payment is required before the access under ' +
          '<strong>this request</strong> is activated.</p>' +
          unaffectedHTML(r) +
          (r.decisionReason ? '<p style="margin-top:8px"><strong>Reviewer&rsquo;s note:</strong> ' +
            esc(r.decisionReason) + '</p>' : '') +
          '<p style="margin-top:8px"><a class="btn pri sm" href="#/payment/' + encodeURIComponent(r.id) + '">' +
          'Continue to payment</a></p>') +
        (state.grantNarrowsRequest(r) ? grantedCard(r) : '');
    } else if (r.status === state.STATUS.ACTIVE) {
      var tenant = r.tenantId ? state.tenantById(r.tenantId) : null;
      /* WHAT WAS ACTUALLY GRANTED, on the applicant's own screen.
         The Super Admin may approve LESS than was asked for, and the
         external route showed that on the payment step — but the
         INTERNAL route has no payment step, so an institution could be
         given fewer experiments, technologies or licences than it
         requested and read nothing but "Access active" beside its
         original request. */
      statusBlock =
        ui.alertBox('success', 'Access active',
          '<p>Institutional access under this request is active' +
          (tenant ? ' for <strong>' + esc(tenant.name) + '</strong>' : '') +
          '. The institution&rsquo;s admin workspace now shows the approved content, technologies, licence quantity and access term.</p>' +
          /* Named here too, because activation is the moment a second
             record appears beside the first and the institution has to
             be able to see that the first is still exactly as it was. */
          unaffectedHTML(r) +
          (r.decisionReason
            ? '<p style="margin-top:8px"><strong>Reviewer&rsquo;s note:</strong> ' + esc(r.decisionReason) + '</p>'
            : '')) +
        (state.grantNarrowsRequest(r) ? grantedCard(r) : '') +
        '<div style="margin-top:12px">' +
        ui.protoNote('Switch to <strong>Tenant Admin</strong> in the Prototype controls strip to see the activated content from the institution&rsquo;s side.') +
        '</div>';
    }

    var itemList = r.items.map(function (item) {
      var ctx = data.contextOf(item.experimentId);
      return '<div class="ri"><div class="ri-body">' +
        '<div class="ri-ctx">' + (ctx ? esc(ctx.grouping.name) + ' › ' + esc(ctx.course.name) : '') + '</div>' +
        '<div class="ri-t">' + esc(ctx ? ctx.experiment.name : item.experimentId) + '</div></div>' +
        '<div class="ri-tech">' + ui.techBadges(item.technologies) + '</div></div>';
    }).join('');

    /* THE NOTE IS RENDERED, not merely stored. STK31-20 requires a
       REASON and a HISTORY TRAIL, and a reason nobody can read is
       neither. This is also the ONLY place the applicant's reply to a
       request for more information reaches the reviewer — it lives on
       the history entry and nowhere else — so omitting it made the
       round trip one-way. The tenant governance timeline already did
       this; the request timelines did not. */
    var timeline = '<div class="timeline">' + r.history.map(function (h, i) {
      var dotCls = i === r.history.length - 1 ?
        (r.status === state.STATUS.ACTIVE ? 'good' : r.status === state.STATUS.APPROVED_PAYMENT_REQUIRED ? 'warn' : 'info') : 'good';
      return '<div class="tl-item"><span class="tl-dot ' + dotCls + '">' + ui.ic(i === 0 ? 'doc' : 'check') + '</span>' +
        '<div class="tl-body"><div class="tl-action">' + esc(h.event) + '</div>' +
        '<div class="tl-who">' + esc(h.who) + ' · ' + esc(util.fmtDateTime(h.at)) + '</div>' +
        (h.note ? '<p class="tl-note">' + esc(h.note) + '</p>' : '') +
        '</div></div>';
    }).join('') + '</div>';

    var html =
      ui.crumbs([{ label: 'Requests', href: '#/requests' }, { label: r.id }]) +
      ui.phead('Request ' + r.id, esc(r.institution.name) + ' · submitted ' + esc(util.fmtDate(r.submittedAt)),
        null, ui.statusBadge(r.status)) +
      '<div class="grid-rail">' +
      '<div class="stack">' +
      statusBlock +
      ui.card('Requested content', '<div class="reqitems">' + itemList + '</div>',
        r.items.length + ' ' + util.plural(r.items.length, 'experiment')) +
      ui.card('Request details',
        '<div class="kv">' +
        '<div class="k">Institution</div><div class="v">' + esc(r.institution.name) + '</div>' +
        '<div class="k">Access context</div><div class="v">' + esc(r.institution.accessContext) + '</div>' +
        '<div class="k">Contact (SPOC)</div><div class="v">' + esc(r.institution.contactName) + ' · ' + esc(r.institution.contactEmail) + '</div>' +
        '<div class="k">Users / licences</div><div class="v">' + r.quantity + '</div>' +
        '<div class="k">Access term</div><div class="v">' + esc(termLabel) + '</div>' +
        '<div class="k">Payment</div><div class="v">' + (r.paymentRequired ? 'Required after approval' : 'Not required for this access context') + '</div>' +
        '</div>') +
      '</div>' +
      '<div class="stack">' + ui.card('History', timeline) + '</div>' +
      '</div>';

    return {
      title: 'Request ' + r.id,
      html: html,
      navKey: 'requests',
      after: function () {
        var form = document.getElementById('resub-form');
        if (!form) { return; }
        document.getElementById('resub-go').addEventListener('click', function () {
          var note = String(form.querySelector('#rsn').value || '').trim();
          if (!ui.showErrors(form, note ? [] : [{ field: 'resub-note', message: 'Enter your reply before resubmitting.' }],
              'This request cannot be resubmitted yet')) { return; }
          var updated = state.resubmitRequest(r.id, note);
          if (updated) { ui.toast('Request ' + updated.id + ' resubmitted for platform review.'); }
          XRSLP.render(false);
        });
      }
    };
  };

  /* ---------------- external payment step (prototype simulation) ---------------- */
  XRSLP.screens.payment = function (params) {
    var r = state.request(params.id);
    if (!r) { return XRSLP.screens.notFound(); }
    /* Only an external request awaiting payment renders this screen.
       Everything else — including the entire internal route — goes to
       the request status page instead (STK31-19). */
    if (r.status !== state.STATUS.APPROVED_PAYMENT_REQUIRED) {
      return { redirect: '#/request-status/' + encodeURIComponent(r.id) };
    }

    /* What the SUPER ADMIN granted, which is not always what was asked
       for (STK31-24). The payment step must show the institution the
       allocation it is actually paying to activate. */
    var granted = r.grant || { items: r.items, quantity: r.quantity, term: r.term };
    var narrowed = state.grantNarrowsRequest(r);
    var termLabel = (data.term(granted.term) || {}).label || granted.term;

    /* The last attempt's outcome, if there was one. Only SUCCESS writes,
       so a declined or unconfirmed attempt leaves the request exactly
       where it was and the screen has to say so honestly. */
    var lastOutcome = r.paymentOutcome || null;
    var outcomeBlock = lastOutcome === state.PAYMENT_OUTCOME.DECLINED
      ? ui.alertBox('danger', 'The last payment attempt was declined',
          '<p>Nothing was activated and nothing about this request changed. The approved allocation, ' +
          'the quantity and the term are all exactly as they were, and no student is entitled. ' +
          'You can attempt payment again below.</p>')
      : lastOutcome === state.PAYMENT_OUTCOME.INDETERMINATE
      ? ui.alertBox('warning', 'The last payment outcome was not confirmed',
          '<p>The platform does not know whether that attempt succeeded. Nothing was activated, and ' +
          'nothing about this request changed. In the product this state is resolved against the payment ' +
          'provider before anything is activated; in this prototype it simply persists until an attempt ' +
          'succeeds.</p>')
      : '';

    var html =
      ui.crumbs([{ label: 'Requests', href: '#/requests' },
                 { label: r.id, href: '#/request-status/' + encodeURIComponent(r.id) },
                 { label: 'Payment' }]) +
      ui.phead('Payment required', esc(r.institution.name) + ' · request ' + esc(r.id), null,
        ui.statusBadge(r.status)) +
      '<div class="payhead stack">' +
      ui.alertBox('warning', 'Approved — awaiting payment',
        '<p>The platform has approved this institutional request. Payment is required before the access ' +
        'under <strong>this request</strong> is activated.</p>' +
        unaffectedHTML(r)) +
      outcomeBlock +
      ui.card('What will be activated',
        (narrowed
          ? '<p class="muted" style="margin:0 0 10px">The platform approved <strong>less</strong> than was ' +
            'requested. These are the approved figures; the original request, and the reviewer&rsquo;s reason, ' +
            'are on the <a href="#/request-status/' + encodeURIComponent(r.id) + '">request status page</a>.</p>'
          : '') +
        '<div class="kv">' +
        '<div class="k">Institution</div><div class="v">' + esc(r.institution.name) + '</div>' +
        '<div class="k">Experiments</div><div class="v">' + granted.items.length +
          (narrowed && granted.items.length !== r.items.length
            ? ' <span class="muted">(' + r.items.length + ' requested)</span>' : '') + '</div>' +
        '<div class="k">Users / licences</div><div class="v">' + granted.quantity +
          (narrowed && granted.quantity !== r.quantity
            ? ' <span class="muted">(' + r.quantity + ' requested)</span>' : '') + '</div>' +
        '<div class="k">Access term</div><div class="v">' + esc(termLabel) + '</div>' +
        '<div class="k">Access context</div><div class="v">' + esc(r.institution.accessContext) + '</div>' +
        '</div>') +
      '<div class="paybox"><span class="pb-ic">' + ui.ic('card') + '</span>' +
      '<div><strong>Commercial amount is not configured in this prototype.</strong><br>' +
      'No payment provider is represented and no real payment is collected. In the product, this step carries the ' +
      'commercial arrangement agreed for the institutional request.</div></div>' +
      /* ND-12 / U-COM-03 — the step is PROVIDER-NEUTRAL and carries all
         three FRD 9.1.x outcomes, and ONLY SUCCESS WRITES. The three
         controls do not simulate a gateway; they choose which of the
         three states the institution is left in, which is a real
         product question with or without a provider. */
      ui.protoNote('No payment is taken. Choose which of the three outcomes to represent — only a successful ' +
        'payment activates anything; the other two leave this request exactly as it is.',
        '<button class="btn pri" type="button" id="pay-simulate">Payment successful</button> ' +
        '<button class="btn sec" type="button" id="pay-declined">Payment declined</button> ' +
        '<button class="btn sec" type="button" id="pay-unknown">Outcome not confirmed</button>') +
      '</div>';

    return {
      title: 'Payment — ' + r.id,
      html: html,
      navKey: 'requests',
      after: function () {
        function wire(id, outcome, done) {
          var btn = document.getElementById(id);
          if (!btn) { return; }
          btn.addEventListener('click', function () {
            btn.setAttribute('disabled', 'disabled');
            var updated = state.completePayment(r.id, outcome);
            if (updated) { done(updated); }
          });
        }
        wire('pay-simulate', state.PAYMENT_OUTCOME.SUCCESS, function (updated) {
          /* 07.3 — a RENEWAL activates nothing new. It extends the term
             of an access record the institution already holds, so saying
             "access is now active" would describe the wrong event and
             imply a second grant. The screen body already says which
             record was renewed; the toast now agrees with it. */
          ui.toast(updated.renewsAccessId
            ? 'Payment simulated — the renewal of ' + updated.renewsAccessId + ' is now activated ' +
              'and its term extended. No new access was created.'
            : 'Payment simulated — access for ' + updated.institution.name + ' is now active.');
          XRSLP.router.go('#/request-status/' + encodeURIComponent(r.id));
        });
        wire('pay-declined', state.PAYMENT_OUTCOME.DECLINED, function () {
          ui.toast('Payment declined — nothing was activated.');
          XRSLP.render(false);
        });
        wire('pay-unknown', state.PAYMENT_OUTCOME.INDETERMINATE, function () {
          ui.toast('Payment outcome not confirmed — nothing was activated.');
          XRSLP.render(false);
        });
      }
    };
  };
})();
