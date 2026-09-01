/* ============================================================
   Unified Functional Platform — small shared utilities.
   ============================================================ */

window.XRSLP = window.XRSLP || {};

XRSLP.util = (function () {
  'use strict';

  /* HTML-escape for anything interpolated into template strings. */
  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function escAttr(value) { return esc(value); }

  /* Date helpers — presentation only. */
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtDate(iso) {
    if (!iso) { return '—'; }
    var d = new Date(iso);
    if (isNaN(d.getTime())) { return '—'; }
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }
  function fmtDateTime(iso) {
    if (!iso) { return '—'; }
    var d = new Date(iso);
    if (isNaN(d.getTime())) { return '—'; }
    var h = d.getHours(), m = d.getMinutes();
    return fmtDate(iso) + ', ' + (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);
  }
  function addMonths(iso, months) {
    var d = new Date(iso);
    var day = d.getDate();
    d.setMonth(d.getMonth() + months);
    /* Month-end clamp (e.g. 31 Jan + 1 month). */
    if (d.getDate() !== day) { d.setDate(0); }
    return d.toISOString();
  }
  function daysUntil(iso) {
    if (!iso) { return null; }
    var ms = new Date(iso).getTime() - Date.now();
    return Math.ceil(ms / 86400000);
  }

  function slug(text) {
    return String(text || '').toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'tenant';
  }

  function pad3(n) { return ('000' + n).slice(-3); }

  function plural(n, one, many) { return n === 1 ? one : (many || one + 's'); }

  function isEmail(value) {
    /* Deliberately simple format check for a prototype form. */
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
  }

  /* Hand the browser a generated file. Used only by the CSV template
     action, which is a real download and not a placeholder control. */
  function download(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    window.setTimeout(function () {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  }

  return {
    esc: esc, escAttr: escAttr,
    fmtDate: fmtDate, fmtDateTime: fmtDateTime,
    addMonths: addMonths, daysUntil: daysUntil,
    slug: slug, pad3: pad3, plural: plural, isEmail: isEmail, download: download
  };
})();
