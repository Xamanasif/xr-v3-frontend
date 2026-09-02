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
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M6 12h12"/>',
    home: '<path d="M4 11l8-7 8 7"/><path d="M6 9.8V20h12V9.8"/><path d="M10 20v-5.5h4V20"/>',
    shield: '<path d="M12 3l7.5 3v6c0 4.4-3 7.6-7.5 9-4.5-1.4-7.5-4.6-7.5-9V6L12 3z"/><path d="M9 11.8l2.2 2.2 4-4.5"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v14H6.5A2.5 2.5 0 0 0 4 19.5V5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H19v-5"/><path d="M8 7h7M8 10.5h7"/>',
    bars: '<path d="M5 20.5V13M12 20.5V4.5M19 20.5v-5.5"/><path d="M3 20.5h18"/>',
    circle: '<circle cx="12" cy="12" r="7"/>'
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

  /* ---------- modal dialog (focus trap, Escape, focus restore) ---------- */
  function openDialog(opts) {
    var root = document.getElementById('dialog-root');
    if (!root) { return; }
    var lastFocus = document.activeElement;
    root.innerHTML =
      '<div class="scrim" id="dlg-scrim">' +
      '<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-title">' +
      '<div class="dhead"><h2 id="dlg-title">' + esc(opts.title) + '</h2>' +
      '<button class="iconbtn" type="button" id="dlg-x" aria-label="Close dialog">' + ic('x') + '</button></div>' +
      '<div class="dbody">' + opts.bodyHTML + '</div>' +
      '<div class="dfoot">' +
      '<button class="btn sec" type="button" id="dlg-cancel">' + esc(opts.cancelLabel || 'Cancel') + '</button>' +
      '<button class="btn pri" type="button" id="dlg-ok">' + esc(opts.okLabel || 'Confirm') + '</button>' +
      '</div></div></div>';

    var scrim = document.getElementById('dlg-scrim');

    function close(confirmed) {
      /* The dialog body is detached before onConfirm runs, so a dialog
         that contains inputs can still be read from: the detached nodes
         keep their current values. onConfirm receives that element. */
      var body = scrim.querySelector('.dbody');
      root.innerHTML = '';
      document.removeEventListener('keydown', onKey, true);
      if (lastFocus && document.contains(lastFocus)) { lastFocus.focus(); }
      else { focusMain(true); }
      if (confirmed && opts.onConfirm) { opts.onConfirm(body); }
    }

    function focusables() {
      return Array.prototype.slice.call(
        scrim.querySelectorAll('button, [href], input, select, textarea')
      ).filter(function (el) { return !el.disabled; });
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
    document.getElementById('dlg-x').addEventListener('click', function () { close(false); });
    document.getElementById('dlg-cancel').addEventListener('click', function () { close(false); });
    document.getElementById('dlg-ok').addEventListener('click', function () { close(true); });
    scrim.addEventListener('mousedown', function (e) { if (e.target === scrim) { close(false); } });
    document.getElementById('dlg-cancel').focus();
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
    if (box) { box.innerHTML = ''; }
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

  return {
    ic: ic, badge: badge, statusBadge: statusBadge, termBadge: termBadge,
    fmtBadge: fmtBadge, techBadges: techBadges,
    crumbs: crumbs, phead: phead, card: card, emptyState: emptyState,
    alertBox: alertBox, protoNote: protoNote, gapNote: gapNote,
    announce: announce, toast: toast, openDialog: openDialog, focusMain: focusMain,
    clearErrors: clearErrors, showErrors: showErrors
  };
})();
