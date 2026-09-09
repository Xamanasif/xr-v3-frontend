/* ============================================================
   Unified Functional Platform — shared components.
   One implementation each of: icons, badges, technology chips,
   cards, breadcrumb, page head, empty state, dialog (with focus
   trap), toasts, live announcer, focus management.
   ============================================================ */

window.XRSLP = window.XRSLP || {};

XRSLP.ui = (function () {
  'use strict';

  var esc = XRSLP.util.esc;

  /* ---------- icons (24 viewBox, stroke-based like the batch system) ---------- */
  var PATHS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.8-3.8"/>',
    basket: '<path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8z"/><path d="M8.5 8V6.5a3.5 3.5 0 0 1 7 0V8"/>',
    check: '<path d="M4.5 12.5l5 5 10-11"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    arrowR: '<path d="M4 12h15"/><path d="M13 6l6 6-6 6"/>',
    building: '<path d="M4 21V5.5A1.5 1.5 0 0 1 5.5 4h8A1.5 1.5 0 0 1 15 5.5V21"/><path d="M15 10h3.5A1.5 1.5 0 0 1 20 11.5V21"/><path d="M2.5 21h19"/><path d="M7 8h2M7 12h2M7 16h2M17.5 14h.01M17.5 17.5h.01"/>',
    flask: '<path d="M9.5 3h5"/><path d="M10 3v5.2L4.8 17.6A2 2 0 0 0 6.6 20.5h10.8a2 2 0 0 0 1.8-2.9L14 8.2V3"/><path d="M7.5 14.5h9"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/><path d="M3 17l9 5 9-5"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2.5"/>',
    alert: '<path d="M12 4l9.5 16.5h-19L12 4z"/><path d="M12 10.5v4"/><path d="M12 17.8h.01"/>',
    alertCirc: '<circle cx="12" cy="12" r="8.5"/><path d="M12 8v4.5"/><path d="M12 15.8h.01"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><path d="M12 7.6h.01"/>',
    card: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3 10h18"/><path d="M7 14.5h4"/>',
    edit: '<path d="M4 20h4.5L20 8.5a2.1 2.1 0 0 0-3-3L5.5 17 4 20z"/><path d="M14.5 7l3 3"/>',
    users: '<circle cx="9" cy="8.5" r="3.5"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 5.5a3.5 3.5 0 0 1 0 6.6"/><path d="M17 14.5a6 6 0 0 1 4 5.5"/>',
    calendar: '<rect x="4" y="5.5" width="16" height="15" rx="2"/><path d="M4 10h16"/><path d="M8.5 3.5v4M15.5 3.5v4"/>',
    monitor: '<rect x="3" y="4.5" width="18" height="12.5" rx="2"/><path d="M9 21h6M12 17.5V21"/>',
    play: '<circle cx="12" cy="12" r="8.5"/><path d="M10 8.8l5 3.2-5 3.2V8.8z"/>',
    doc: '<path d="M6.5 3h7L18.5 8v11a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M13.5 3v5h5"/><path d="M9 13h6M9 16.5h6"/>',
    /* 07.3 — the Faculty progress export. */
    download: '<path d="M12 3v12"/><path d="M7.5 10.5 12 15l4.5-4.5"/><path d="M4.5 18.5h15"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M6 12h12"/>',
    home: '<path d="M4 11l8-7 8 7"/><path d="M6 9.8V20h12V9.8"/><path d="M10 20v-5.5h4V20"/>',
    shield: '<path d="M12 3l7.5 3v6c0 4.4-3 7.6-7.5 9-4.5-1.4-7.5-4.6-7.5-9V6L12 3z"/><path d="M9 11.8l2.2 2.2 4-4.5"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v14H6.5A2.5 2.5 0 0 0 4 19.5V5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H19v-5"/><path d="M8 7h7M8 10.5h7"/>',
    bars: '<path d="M5 20.5V13M12 20.5V4.5M19 20.5v-5.5"/><path d="M3 20.5h18"/>',
    circle: '<circle cx="12" cy="12" r="7"/>',
    /* Implementation 08 — the shared patterns. */
    chevron: '<path d="M9 6l6 6-6 6"/>',
    dot: '<circle cx="12" cy="12" r="3.2"/>',
    filter: '<path d="M4 6h16"/><path d="M7 12h10"/><path d="M10.5 18h3"/>',
    external: '<path d="M14 4h6v6"/><path d="M20 4l-8.5 8.5"/><path d="M18 14v5a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 19V8.2A1.6 1.6 0 0 1 5.6 6.6H11"/>',
    sliders: '<path d="M4 8h10M18 8h2"/><path d="M4 16h4M12 16h8"/><circle cx="16" cy="8" r="2"/><circle cx="10" cy="16" r="2"/>'
  };

  function ic(name, cls) {
    return '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (PATHS[name] || '') + '</svg>';
  }

  /* ---------- badges & chips ---------- */
  function badge(cls, icon, text) {
    return '<span class="badge ' + cls + '">' + (icon ? ic(icon) : '') + esc(text) + '</span>';
  }

  function statusBadge(status) {
    var meta = XRSLP.state.STATUS_META[status];
    if (!meta) { return badge('b-neutral', null, status); }
    return badge(meta.badge, meta.icon, meta.label);
  }

  function termBadge(stateObj) {
    if (stateObj.key === 'expired') { return badge('b-danger', 'alertCirc', 'Expired'); }
    if (stateObj.key === 'expiring') { return badge('b-warning', 'clock', 'Expiring soon'); }
    return badge('b-success', 'check', 'Active');
  }

  function fmtBadge(techId) {
    var t = XRSLP.data.TECHNOLOGIES[techId];
    if (!t) { return ''; }
    return '<span class="fmt fmt-' + t.id + '">' + esc(t.label) + '</span>';
  }

  function techBadges(list) {
    return XRSLP.data.sortTech(list).map(fmtBadge).join(' ');
  }

  /* ---------- the count pill ----------
     ONE component. The same visual element was defined four times
     across layout.css and screens.css — `.snav .ncount`, `.pubnav
     .navcount`, `.seg .segn` and `.lsec-n` — at three different
     paddings and two different min-widths, and only two of the four
     carried a screen-reader unit. So the identical-looking pill was
     announced as "Student access, 5" in one place and as "5" in
     another, and a redesign had four places to keep in step.

     Making the unit part of the component is the point: it cannot be
     forgotten at a call site, because there is no call site that emits
     the number without it. */
  function count(n, unitSingular, unitPlural) {
    var word = XRSLP.util.plural(n, unitSingular, unitPlural);
    return '<span class="count">' + esc(String(n)) +
      '<span class="sr-only"> ' + esc(word) + '</span></span>';
  }

  /* ---------- structural pieces ---------- */
  function crumbs(items) {
    return '<nav class="crumb" aria-label="Breadcrumb">' + items.map(function (c, i) {
      var last = i === items.length - 1;
      if (last) { return '<span aria-current="page">' + esc(c.label) + '</span>'; }
      return '<a href="' + c.href + '">' + esc(c.label) + '</a><span class="sep" aria-hidden="true">/</span>';
    }).join('') + '</nav>';
  }

  function phead(title, metaHTML, actionsHTML, badgeHTML) {
    return '<div class="phead"><div class="ptitles"><h1>' + esc(title) + (badgeHTML || '') + '</h1>' +
      (metaHTML ? '<div class="pmeta">' + metaHTML + '</div>' : '') + '</div>' +
      (actionsHTML ? '<div class="pactions">' + actionsHTML + '</div>' : '') + '</div>';
  }

  function card(titleHTML, bodyHTML, noteHTML, headingLevel) {
    var h = headingLevel || 'h2';
    return '<section class="card">' +
      (titleHTML ? '<div class="chead"><' + h + '>' + titleHTML + '</' + h + '>' +
        (noteHTML ? '<span class="cnote">' + noteHTML + '</span>' : '') + '</div>' : '') +
      '<div class="cbody">' + bodyHTML + '</div></section>';
  }

  /* Empty state; heading tag follows the surrounding outline so no
     level is skipped (Stage-0 correction of the old fixed h3). */
  function emptyState(opts) {
    var h = opts.heading || 'h2';
    return '<div class="empty">' +
      '<div class="echip">' + ic(opts.icon || 'search', 'lg') + '</div>' +
      '<' + h + ' class="etitle">' + esc(opts.title) + '</' + h + '>' +
      '<p>' + esc(opts.body || '') + '</p>' +
      (opts.actionsHTML ? '<div class="eact">' + opts.actionsHTML + '</div>' : '') +
      '</div>';
  }

  function alertBox(kind, titleText, bodyHTML, role) {
    return '<div class="alert ' + kind + '"' + (role ? ' role="' + role + '"' : '') + '>' +
      ic(kind === 'success' ? 'check' : kind === 'warning' ? 'alert' : kind === 'danger' ? 'alertCirc' : 'info') +
      '<div>' + (titleText ? '<div class="at">' + esc(titleText) + '</div>' : '') + bodyHTML + '</div></div>';
  }

  function protoNote(bodyHTML, actionsHTML) {
    return '<div class="proto-note"><span class="pn-label">PROTOTYPE ONLY</span>' +
      '<div class="pn-body">' + bodyHTML +
      (actionsHTML ? '<div class="pn-act">' + actionsHTML + '</div>' : '') + '</div></div>';
  }

  function gapNote(tag, bodyHTML) {
    return '<div class="gapnote"><span class="gtag">' + esc(tag) + '</span><div>' + bodyHTML + '</div></div>';
  }

  /* ---------- live announcer ---------- */
  function announce(msg) {
    var el = document.getElementById('announcer');
    if (!el) { return; }
    el.textContent = '';
    window.setTimeout(function () { el.textContent = msg; }, 40);
  }

  /* ---------- toasts ---------- */
  function toast(msg, kind) {
    var wrap = document.getElementById('toasts');
    if (!wrap) { return; }
    var el = document.createElement('div');
    el.className = 'toast' + (kind === 'info' ? ' info' : '');
    el.innerHTML = ic(kind === 'info' ? 'info' : 'check') + '<span class="tx">' + esc(msg) + '</span>' +
      '<button type="button" aria-label="Dismiss notification">' + ic('x', 'sm') + '</button>';
    el.querySelector('button').addEventListener('click', function () { el.remove(); });
    wrap.appendChild(el);
    announce(msg);
    window.setTimeout(function () { if (el.parentNode) { el.remove(); } }, 6000);
  }

  /* ---------- overlay plumbing, shared by the dialog and the sheet ----------
     Extracted when the side sheet arrived: two overlays maintaining two
     copies of a focus trap is how one of them quietly stops trapping.
     `mount` returns the close function; the caller supplies the markup
     and wires its own controls. */
  function mountOverlay(opts) {
    var root = document.getElementById('dialog-root');
    if (!root) { return null; }
    var lastFocus = document.activeElement;
    root.innerHTML = opts.html;
    var scrim = root.firstElementChild;
    if (!scrim) { return null; }

    function focusables() {
      return Array.prototype.slice.call(
        scrim.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      ).filter(function (el) {
        return !el.disabled && !el.closest('[hidden]') &&
          (el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement);
      });
    }

    function close(confirmed, payload) {
      /* The body is detached BEFORE the callback runs, so a form inside
         the overlay can still be read from: the detached nodes keep
         their current values. */
      var body = scrim.querySelector('.dbody, .sh-body');
      root.innerHTML = '';
      document.removeEventListener('keydown', onKey, true);

      /* ⚠ FOCUS IS RESTORED **AFTER** THE CALLBACK, NOT BEFORE.

         The old order focused `lastFocus` and then ran `onConfirm` —
         and almost every confirm handler in this product ends in
         `XRSLP.render(true)`, which replaces app-root's innerHTML. So
         the element that had just been given focus was destroyed a
         moment later and focus fell to <body>: a keyboard user
         confirming a dialog lost their place and had to tab from the
         top of the page. Nothing visible went wrong, which is why it
         survived.

         Restoring afterwards means the check `document.contains` is
         asked at the only moment its answer is meaningful. */
      /* ⚠ FOCUS AFTER AN OVERLAY CLOSES — THREE CASES, ONE RULE.

         Restoring `lastFocus` is only ever a FALLBACK. It runs after the
         callback, not before, and it defers to the callback in both
         cases where the callback knows better:

           1. The callback OPENED ANOTHER OVERLAY. Cancelling the Content
              Manager's return confirmation reopens the return sheet;
              both mount into this same root. Restoring here would pull
              focus to the page behind the new sheet, outside its trap.
           2. The callback DELIBERATELY MOVED FOCUS. Several handlers
              re-render and then focus the row or control the user acted
              on. Restoring here would override that and drop focus on
              <main> — the handler's work silently undone.
           3. The callback did neither. Then, and only then, focus goes
              back where it came from, or to <main> if that element no
              longer exists because the callback re-rendered the page.

         Restoring BEFORE the callback — which is what this did
         originally — gets case 3 wrong for every re-rendering handler,
         because the element is destroyed a moment later. */
      var focusBefore = document.activeElement;
      if (confirmed && opts.onConfirm) { opts.onConfirm(body, payload); }
      else if (!confirmed && opts.onCancel) { opts.onCancel(body); }

      if (root.firstElementChild) { return; }               /* case 1 */
      var focusNow = document.activeElement;
      if (focusNow && focusNow !== focusBefore && focusNow !== document.body &&
          document.contains(focusNow)) { return; }          /* case 2 */
      if (lastFocus && document.contains(lastFocus)) { lastFocus.focus(); }
      else { focusMain(true); }                             /* case 3 */
    }

    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(false); return; }
      if (e.key === 'Tab') {
        var f = focusables();
        if (!f.length) { return; }
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }

    document.addEventListener('keydown', onKey, true);
    scrim.addEventListener('mousedown', function (e) { if (e.target === scrim) { close(false); } });
    return { root: root, scrim: scrim, close: close, focusables: focusables };
  }

  /* ---------- side sheet (secondary detail) ----------
     THE SURFACE THAT WAS MISSING. Before this the product had exactly
     one overlay — the confirmation dialog — so anything too big for a
     dialog and too secondary for a page became another stacked card on
     an already long screen. That is most of why the operational screens
     read as one endless column.

     A sheet is for DETAIL AND DECISIONS: a request's history, an access
     record's allocation, the Content Manager's return-with-destination.
     The dialog goes back to what it is good at — a bounded yes/no whose
     consequence fits in a sentence.

     `opts.footHTML` replaces the default Cancel/Confirm pair when the
     sheet's own body owns the action (the return flow labels its button
     by destination, which no generic footer can do). */
  function openSheet(opts) {
    var titleId = 'sheet-title';
    var foot = opts.footHTML !== undefined ? opts.footHTML :
      '<button class="btn sec" type="button" data-sheet-cancel>' + esc(opts.cancelLabel || 'Close') + '</button>' +
      (opts.okLabel ? '<button class="btn pri" type="button" data-sheet-ok>' + esc(opts.okLabel) + '</button>' : '');

    var html =
      '<div class="sheet-scrim">' +
      '<div class="sheet' + (opts.wide ? ' wide' : '') + '" role="dialog" aria-modal="true" aria-labelledby="' + titleId + '">' +
      '<div class="sh-head"><div class="sh-titles">' +
      (opts.eyebrow ? '<div class="sh-k">' + esc(opts.eyebrow) + '</div>' : '') +
      '<h2 id="' + titleId + '">' + esc(opts.title) + '</h2>' +
      (opts.subtitle ? '<div class="sh-sub">' + opts.subtitle + '</div>' : '') +
      '</div>' +
      '<button class="iconbtn" type="button" data-sheet-x aria-label="Close panel">' + ic('x') + '</button></div>' +
      '<div class="sh-body">' + opts.bodyHTML + '</div>' +
      (foot ? '<div class="sh-foot">' +
        (opts.footNote ? '<span class="sh-note">' + esc(opts.footNote) + '</span>' : '') + foot + '</div>' : '') +
      '</div></div>';

    var m = mountOverlay({ html: html, onConfirm: opts.onConfirm, onCancel: opts.onCancel });
    if (!m) { return null; }

    var x = m.scrim.querySelector('[data-sheet-x]');
    if (x) { x.addEventListener('click', function () { m.close(false); }); }
    var cancel = m.scrim.querySelector('[data-sheet-cancel]');
    if (cancel) { cancel.addEventListener('click', function () { m.close(false); }); }
    var okBtn = m.scrim.querySelector('[data-sheet-ok]');
    if (okBtn) { okBtn.addEventListener('click', function () { m.close(true); }); }

    if (opts.after) { opts.after(m.scrim, m.close); }

    /* Focus the sheet's own first control, not the close button: the
       point of a sheet is the content, and a screen-reader user landing
       on "Close" first has to hunt for what they opened. */
    var f = m.focusables().filter(function (el) { return !el.hasAttribute('data-sheet-x'); });
    (f[0] || x || m.scrim).focus();
    return m.close;
  }

  /* ---------- modal dialog (bounded confirmation) ----------
     Rebuilt on `mountOverlay` when the sheet arrived, so the focus
     trap, the Escape handling, the scrim dismissal and the focus
     restore have exactly ONE implementation. The dialog's own contract
     is unchanged: `onConfirm` receives the detached body element, so a
     dialog containing inputs can still be read from after it closes. */
  function openDialog(opts) {
    var html =
      '<div class="scrim">' +
      '<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-title">' +
      '<div class="dhead"><h2 id="dlg-title">' + esc(opts.title) + '</h2>' +
      '<button class="iconbtn" type="button" data-dlg-x aria-label="Close dialog">' + ic('x') + '</button></div>' +
      '<div class="dbody">' + opts.bodyHTML + '</div>' +
      '<div class="dfoot">' +
      '<button class="btn sec" type="button" data-dlg-cancel>' + esc(opts.cancelLabel || 'Cancel') + '</button>' +
      '<button class="btn ' + (opts.danger ? 'dgr' : 'pri') + '" type="button" data-dlg-ok>' +
        esc(opts.okLabel || 'Confirm') + '</button>' +
      '</div></div></div>';

    var m = mountOverlay({ html: html, onConfirm: opts.onConfirm, onCancel: opts.onCancel });
    if (!m) { return; }
    m.scrim.querySelector('[data-dlg-x]').addEventListener('click', function () { m.close(false); });
    m.scrim.querySelector('[data-dlg-cancel]').addEventListener('click', function () { m.close(false); });
    m.scrim.querySelector('[data-dlg-ok]').addEventListener('click', function () { m.close(true); });
    if (opts.after) { opts.after(m.scrim, m.close); }
    /* Cancel keeps the initial focus: a confirmation dialog should never
       open with the consequential button under the return key. */
    m.scrim.querySelector('[data-dlg-cancel]').focus();
  }

  /* ---------- route focus management ---------- */
  function focusMain(preventScroll) {
    var main = document.getElementById('main-content');
    if (!main) { return; }
    main.setAttribute('tabindex', '-1');
    try { main.focus({ preventScroll: !!preventScroll }); } catch (e) { main.focus(); }
    main.addEventListener('blur', function onBlur() {
      main.removeAttribute('tabindex');
      main.removeEventListener('blur', onBlur);
    });
  }

  /* ---------- form validation helpers ----------
     Corrects the historical gap: errors are tied to their inputs via
     aria-describedby + aria-invalid, plus a focused summary alert. */
  function clearErrors(formEl) {
    Array.prototype.slice.call(formEl.querySelectorAll('.field.invalid')).forEach(function (el) {
      el.classList.remove('invalid');
    });
    Array.prototype.slice.call(formEl.querySelectorAll('.ferr')).forEach(function (el) { el.remove(); });
    Array.prototype.slice.call(formEl.querySelectorAll('[aria-invalid]')).forEach(function (el) {
      el.removeAttribute('aria-invalid');
      var d = (el.getAttribute('aria-describedby') || '').split(/\s+/).filter(function (t) {
        return t && t.indexOf('err-') !== 0;
      });
      if (d.length) { el.setAttribute('aria-describedby', d.join(' ')); }
      else { el.removeAttribute('aria-describedby'); }
    });
    var box = formEl.querySelector('.form-errors');
    if (box) {
      box.innerHTML = '';
      /* This module owns the one announcement path for form errors: the
         summary it writes is a role="alert" — a live region in its own
         right — and it is focused as well. One container in the product
         (the shared Help report form) also declares aria-live on the
         wrapper, so the same summary was announced again on insertion.
         Normalising the container here keeps every form on one path,
         rather than fixing the single form and leaving the next one to
         re-introduce it. */
      box.removeAttribute('aria-live');
    }
  }

  function showErrors(formEl, errs, heading) {
    clearErrors(formEl);
    if (!errs.length) { return true; }
    var box = formEl.querySelector('.form-errors');
    if (box) {
      box.innerHTML = '<div class="alert danger" role="alert" tabindex="-1" id="errsum">' + ic('alertCirc') +
        '<div><div class="at">' + esc(heading || 'Please correct the following') + '</div>' +
        '<ul style="margin:4px 0 0 16px;padding:0">' +
        errs.map(function (e) { return '<li>' + esc(e.message) + '</li>'; }).join('') +
        '</ul></div></div>';
    }
    errs.forEach(function (e, idx) {
      var fieldWrap = document.getElementById(e.field);
      if (!fieldWrap) { return; }
      fieldWrap.classList.add('invalid');
      var errId = 'err-' + e.field;
      fieldWrap.insertAdjacentHTML('beforeend',
        '<div class="ferr" id="' + errId + '">' + ic('alertCirc', 'sm') + esc(e.message) + '</div>');
      var input = fieldWrap.querySelector('input, select, textarea');
      if (input) {
        input.setAttribute('aria-invalid', 'true');
        var d = (input.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
        if (d.indexOf(errId) === -1) { d.push(errId); }
        input.setAttribute('aria-describedby', d.join(' '));
        if (idx === 0) { input.focus(); }
      }
    });
    var sum = document.getElementById('errsum');
    if (sum && errs.length > 1) { sum.focus(); }
    return false;
  }

  /* ============================================================
     IMPLEMENTATION 08 — shared presentation helpers.
     Each one exists because the screens were building the same thing by
     hand, differently, in several places.
     ============================================================ */

  /* A row of figures, each with its own label. THE REPLACEMENT FOR A
     PARAGRAPH: "5 licences · 1 assigned · 4 remaining · expires
     7 Dec 2026" instead of a sentence defining what an access record
     is. Items: {v, k, tone?} — tone is 'warn' | 'bad' | 'good'. */
  function metrics(items) {
    var rows = (items || []).filter(Boolean);
    if (!rows.length) { return ''; }
    return '<div class="metrics">' + rows.map(function (m) {
      return '<span class="m' + (m.tone ? ' ' + m.tone : '') + '">' +
        '<span class="m-v">' + esc(String(m.v)) + '</span>' +
        '<span class="m-k">' + esc(m.k) + '</span></span>';
    }).join('') + '</div>';
  }

  /* Compact stat strip — `.statgrid` density for an operational page.
     An item with `href` becomes a link, so no figure is a dead end. */
  function statStrip(items) {
    var rows = (items || []).filter(Boolean);
    if (!rows.length) { return ''; }
    return '<div class="statstrip">' + rows.map(function (s) {
      var inner = '<span class="ss-v">' + esc(String(s.v)) + '</span>' +
        '<span class="ss-k">' + esc(s.k) + '</span>';
      var cls = 'ss' + (s.tone ? ' ' + s.tone : '');
      return s.href
        ? '<a class="' + cls + '" href="' + s.href + '">' + inner + '</a>'
        : '<div class="' + cls + '">' + inner + '</div>';
    }).join('') + '</div>';
  }

  /* A quiet operational empty state. `.empty` is 48px of padding and a
     48px medallion — right when the empty state IS the page, half a
     viewport of nothing when it is one queue among several. `ok:true`
     says "nothing needs attention", which is a result rather than an
     absence, in words as well as colour. */
  function emptyRow(opts) {
    var h = opts.heading || 'h3';
    return '<div class="empty compact' + (opts.ok ? ' ok' : '') + '">' +
      '<div class="echip">' + ic(opts.icon || (opts.ok ? 'check' : 'circle')) + '</div>' +
      '<div class="ebody">' +
      '<' + h + ' class="etitle">' + esc(opts.title) + '</' + h + '>' +
      (opts.body ? '<p>' + esc(opts.body) + '</p>' : '') +
      (opts.actionsHTML ? '<div class="eact">' + opts.actionsHTML + '</div>' : '') +
      '</div></div>';
  }

  /* ── DASHBOARD PRIMITIVES (Implementation 08D) ───────────────
     A first-time user should be able to answer, within a few seconds:
     which workspace is this, what is it for, is anything waiting for me,
     and what can I do next. These three are the shared answer to the
     second and fourth of those. They are deliberately NOT a template:
     each dashboard chooses its own wording, actions and order. */

  /* One plain sentence saying what this workspace is FOR. Sits directly
     under the page heading, never longer than a line or two. */
  function orient(text) {
    return '<p class="orient">' + esc(text) + '</p>';
  }

  /* Compact icon + label actions. Every one must resolve to a route that
     already exists — a dashboard that offers a dead action is worse than
     one that offers none. */
  function quickActions(items) {
    var list = (items || []).filter(function (i) { return i && i.href && i.label; });
    if (!list.length) { return ''; }
    return '<div class="qacts">' + list.map(function (i) {
      return '<a class="qact" href="' + i.href + '">' +
        '<span class="qa-ic">' + ic(i.icon || 'circle') + '</span>' +
        '<span class="qa-l">' + esc(i.label) + '</span></a>';
    }).join('') + '</div>';
  }

  /* Navigation tiles: the same restraint as `quickActions`, plus one
     short line saying what the destination is for. Used where a
     first-time user cannot tell two destinations apart by name alone.
     Every href must already resolve — a dashboard that offers a dead
     action is worse than one that offers none. */
  function navTiles(items, opts) {
    var list = (items || []).filter(function (i) { return i && i.href && i.label; });
    if (!list.length) { return ''; }
    opts = opts || {};
    /* `cols:3` is the six-workspace case: 2x3 reads as a set, where
       auto-fit would break it 4 + 2 and look like an accident. */
    return '<div class="navtiles' + (opts.cols === 3 ? ' cols3' : '') + '">' + list.map(function (i) {
      return '<a class="ntile" href="' + i.href + '">' +
        '<span class="nt-ic">' + ic(i.icon || 'circle') + '</span>' +
        '<span class="nt-b"><span class="nt-l">' + esc(i.label) + '</span>' +
        (i.desc ? '<span class="nt-d">' + esc(i.desc) + '</span>' : '') + '</span></a>';
    }).join('') + '</div>';
  }

  /* THE ZERO STATE, AS ONE LINE. A dashboard whose good news occupies a
     300px card teaches the reader that the page is mostly empty. */
  function okRow(text) {
    return '<p class="okrow">' + ic('check') + '<span>' + esc(text) + '</span></p>';
  }

  /* "About this" — genuine product explanation the user may want but
     does not need on first read. THE HONEST REPLACEMENT for a
     `gapNote`: same information, product language, folded away. Where a
     note documented an unresolved ENGINEERING decision rather than
     something the user acts on, it is not moved here — it is removed
     from the UI and kept in the code and the audit documents. */
  function about(summaryText, bodyHTML) {
    return '<details class="about"><summary>' + ic('info') +
      '<span>' + esc(summaryText) + '</span>' +
      '<span class="ab-more" aria-hidden="true">Show</span></summary>' +
      '<div class="ab-b">' + bodyHTML + '</div></details>';
  }

  /* A prototype-only control. Collapsed, dashed, mono-labelled — it
     stays available to us for a demo without shaping the product
     around it. The distinction from `about` is the point: `about` is
     product help, this is scaffolding. */
  function demoPanel(titleText, bodyHTML) {
    return '<details class="demopanel"><summary>' +
      '<span class="dp-tag">DEMO CONTROL</span>' +
      '<span class="dp-t">' + esc(titleText) + '</span>' +
      ic('chevron', 'sm') + '</summary>' +
      '<div class="dp-b">' + bodyHTML + '</div></details>';
  }

  /* One workflow visualisation for every chain in the product.
     Steps: {t, d?, state} where state is 'done'|'live'|'todo'|'blocked'.
     The step's STATE IS NAMED in its own text, never colour alone. */
  function track(steps) {
    var rows = (steps || []).filter(Boolean);
    if (!rows.length) { return ''; }
    return '<ol class="track">' + rows.map(function (s, i) {
      var mark = s.state === 'done' ? ic('check')
        : s.state === 'blocked' ? ic('alert')
        : String(i + 1);
      return '<li class="tk-s ' + esc(s.state || 'todo') + '">' +
        '<span class="tk-i" aria-hidden="true">' + mark + '</span>' +
        '<span class="tk-b"><span class="tk-t">' + esc(s.t) + '</span>' +
        (s.d ? '<span class="tk-d">' + esc(s.d) + '</span>' : '') +
        '</span></li>';
    }).join('') + '</ol>';
  }

  /* A page-level zone heading, above cards rather than inside one. */
  function sectionHead(opts) {
    var h = opts.heading || 'h2';
    /* `id` exists so a <section> can point `aria-labelledby` at this
       heading. Without it a caller has to string-patch the returned
       markup, which is exactly the kind of fragile coupling a shared
       helper is supposed to remove. */
    return '<div class="sechead"><div class="se-b">' +
      '<' + h + (opts.id ? ' id="' + esc(opts.id) + '"' : '') + '>' + esc(opts.title) +
      /* The count pill is decorative to the EYE and ambiguous to the EAR:
         without a unit a screen reader reads "Available to you 3". So the
         helper carries the unit itself — `countLabel` names the thing
         being counted and is announced, never shown. Callers that give a
         count without a unit fall back to a neutral word rather than
         emitting a bare digit. */
      (opts.count !== undefined && opts.count !== null
        ? '<span class="se-n">' + esc(String(opts.count)) +
          '<span class="sr-only"> ' +
          esc(XRSLP.util.plural(opts.count, opts.countLabel || 'item')) + '</span></span>'
        : '') +
      '</' + h + '>' +
      (opts.desc ? '<p class="se-d">' + esc(opts.desc) + '</p>' : '') +
      '</div>' +
      (opts.actionsHTML ? '<div class="se-a">' + opts.actionsHTML + '</div>' : '') +
      '</div>';
  }

  /* Consequential actions, separated from the information above them
     rather than sitting inline beside it. */
  function dangerZone(opts) {
    return '<div class="dangerzone">' +
      '<div class="dz-t">' + ic('shield') + esc(opts.title) + '</div>' +
      (opts.desc ? '<p class="dz-d">' + esc(opts.desc) + '</p>' : '') +
      '<div class="dz-a">' + opts.actionsHTML + '</div></div>';
  }

  /* ---------- the two course codes ----------
     A PLATFORM course code (CE G511) and an INSTITUTION course code
     (CE-306) are different kinds of thing, and a stakeholder seeing
     them side by side in matching styling reasonably asks which one is
     real. They therefore never get matching styling. The platform code
     reads as an issued identifier; the institution's reads as ordinary
     text. Neither helper decides WHICH to show — that is the calling
     screen's judgement, and on a Student screen the answer is normally
     the institution's alone. */
  function platformCode(code) {
    if (!code) { return '<span class="muted">Not set</span>'; }
    return '<span class="pcode" title="Platform course code">' + esc(code) + '</span>';
  }

  function institutionCode(code) {
    if (!code) { return '<span class="muted">Not mapped</span>'; }
    return '<span class="icode">' + esc(code) + '</span>';
  }

  /* Both codes, labelled, for the one screen that genuinely owns the
     mapping between them — the Tenant Admin's academic mappings. */
  function codePair(platform, institution) {
    return '<div class="codepair">' +
      '<div class="cp-r"><span class="cp-k">Platform code</span>' +
      '<span class="cp-v">' + platformCode(platform) + '</span></div>' +
      '<div class="cp-r"><span class="cp-k">Institution code</span>' +
      '<span class="cp-v">' + institutionCode(institution) + '</span></div>' +
      '</div>';
  }

  /* ── AN INTERNAL REFERENCE, AS SECONDARY METADATA ────────────
     `ACC-001` is a traceability handle — useful for support, audit and
     deep detail, and useless as a way to understand what an institution
     can teach. It had become the dominant label on the Student access
     and Content access surfaces, which made an institution admin read
     their own content library as a list of database keys.

     This renders it the way it should always have appeared: small,
     muted, and after the human-readable fact it belongs to. Nothing is
     renamed in state and no record is merged — the identifier is
     unchanged and still exact. Only its prominence changes. */
  function accessRef(id, opts) {
    if (!id) { return ''; }
    opts = opts || {};
    return '<span class="accref">' +
      (opts.bare ? '' : '<span class="ar-k">Reference</span> ') +
      '<span class="ar-v">' + esc(String(id)) + '</span></span>';
  }

  /* ── WHAT AN ACCESS RECORD IS, IN WORDS ──────────────────────
     The operational counterpart to `accessRef`. `ACC-001` answers
     "which row am I looking at" for support and audit; it answers
     nothing an operational reader actually asks, so it must never be
     what a row leads with. THIS is what leads instead: the content the
     record grants.

     Two records carrying the same Experiment stay distinguishable —
     by the content set named here, and by the technology, term and
     licence figures the surrounding row already carries. They are
     never distinguished by ACC-001 vs ACC-002.

     Reads the record only. Nothing is renamed, merged or regenerated;
     `rec.id` is untouched and still exact wherever it belongs. */
  function accessTitle(rec, opts) {
    opts = opts || {};
    var items = (rec && rec.items) || [];
    if (!items.length) { return 'No content on this record'; }
    var names = [], seen = {};
    items.forEach(function (it) {
      var ctx = XRSLP.data.contextOf(it.experimentId);
      var nm = ctx ? ctx.experiment.name : it.experimentId;
      if (!seen[nm]) { seen[nm] = 1; names.push(nm); }
    });
    var max = opts.max || 2;
    var label = names.length <= max
      ? names.join(' \u00b7 ')
      : names.slice(0, max).join(' \u00b7 ') + ' +' + (names.length - max) + ' more';
    /* `opts.plain` for the callers whose slot escapes for them (an
       attention-row title, an <option>). Escaping twice would print the
       entity, not the character. */
    return opts.plain ? label : esc(label);
  }

  /* The union of technologies an approval carries. With the internal
     reference no longer shown in normal UI, the technology set and the
     term are what tell two approvals of the same Experiment apart. */
  function recTechnologies(rec) {
    var out = [], seen = {};
    ((rec && rec.items) || []).forEach(function (it) {
      (it.technologies || []).forEach(function (t) {
        if (!seen[t]) { seen[t] = 1; out.push(t); }
      });
    });
    return out;
  }

  /* The supporting line under `accessTitle`: which courses the record
     reaches, and how many Experiments it carries. This is the business
     context that tells two records apart when their headline content
     overlaps. */
  function accessScope(rec) {
    var items = (rec && rec.items) || [];
    if (!items.length) { return ''; }
    var courses = [], seen = {};
    items.forEach(function (it) {
      var ctx = XRSLP.data.contextOf(it.experimentId);
      var nm = ctx && ctx.course ? ctx.course.name : null;
      if (nm && !seen[nm]) { seen[nm] = 1; courses.push(nm); }
    });
    var n = items.length;
    var count = n + ' ' + XRSLP.util.plural(n, 'experiment');
    return esc(courses.length ? courses.join(' \u00b7 ') + ' \u00b7 ' + count : count);
  }

  /* A real button with a real expanded state. `title` is unreachable by
     keyboard and unread on touch, so it is not used for anything a user
     needs. Wired by `wireInfoTips()` after render. */
  var TIP_SEQ = 0;
  function infoTip(text, labelText) {
    TIP_SEQ += 1;
    var id = 'tip-' + TIP_SEQ;
    return '<span class="infotip">' +
      '<button type="button" aria-expanded="false" aria-controls="' + id + '" ' +
      'aria-label="' + esc(labelText || 'More information') + '">' + ic('info') + '</button>' +
      '<span class="it-p" id="' + id + '" hidden>' + esc(text) + '</span></span>';
  }

  /* Idempotent: safe to call after every render. */
  function wireInfoTips(root) {
    var scope = root || document;
    Array.prototype.slice.call(scope.querySelectorAll('.infotip > button')).forEach(function (btn) {
      if (btn.dataset.tipWired) { return; }
      btn.dataset.tipWired = '1';
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (!panel) { return; }
      function setOpen(open) {
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        panel.hidden = !open;
      }
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        setOpen(btn.getAttribute('aria-expanded') !== 'true');
      });
      btn.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { setOpen(false); btn.focus(); }
      });
      document.addEventListener('click', function (e) {
        if (!btn.parentNode.contains(e.target)) { setOpen(false); }
      });
    });
  }

  return {
    ic: ic, badge: badge, statusBadge: statusBadge, termBadge: termBadge,
    fmtBadge: fmtBadge, techBadges: techBadges,
    crumbs: crumbs, phead: phead, card: card, emptyState: emptyState, count: count,
    alertBox: alertBox, protoNote: protoNote, gapNote: gapNote,
    announce: announce, toast: toast, openDialog: openDialog, focusMain: focusMain,
    clearErrors: clearErrors, showErrors: showErrors,
    /* Implementation 08 — the shared patterns. */
    openSheet: openSheet, metrics: metrics, statStrip: statStrip, emptyRow: emptyRow,
    about: about, demoPanel: demoPanel, track: track, sectionHead: sectionHead,
    orient: orient, quickActions: quickActions, navTiles: navTiles, okRow: okRow,
    dangerZone: dangerZone, platformCode: platformCode, institutionCode: institutionCode,
    codePair: codePair, accessRef: accessRef, accessTitle: accessTitle, accessScope: accessScope,
    recTechnologies: recTechnologies,
    infoTip: infoTip, wireInfoTips: wireInfoTips
  };
})();
