/* XR Learning Platform · Design V3 · Super Admin complete role · preview runtime (core)
   One role-preview root: in-memory role state, hash routes between owned views, shared shell,
   dialogs and the design-only preview controls. No backend, no persistence beyond this tab. */
(function () {
  const D = window.SA_DATA;
  const SA = window.SA = { V: {}, A: {}, D };

  /* ── utilities ────────────────────────────────────────────────────────────── */
  const esc = s => String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clone = x => JSON.parse(JSON.stringify(x));
  const T = x => String(x || '').trim();
  const plural = (n, w, ws) => n + ' ' + (n === 1 ? w : (ws || w + 's'));
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const isoD = iso => { const p = iso.split('-').map(Number); return new Date(Date.UTC(p[0], p[1] - 1, p[2])); };
  const dmy = iso => { const d = isoD(iso); return d.getUTCDate() + ' ' + MON[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); };
  const dm = iso => { const d = isoD(iso); return d.getUTCDate() + ' ' + MON[d.getUTCMonth()]; };
  const dLong = iso => { const d = isoD(iso); return d.getUTCDate() + ' ' + MONL[d.getUTCMonth()]; };
  const days = (a, b) => Math.round((isoD(b) - isoD(a)) / 86400000);
  const parseShort = s => { const m = /^(\d{1,2}) (\w{3}) (\d{4})/.exec(s || ''); if (!m) return null; const mi = MON.indexOf(m[2]); return m[3] + '-' + String(mi + 1).padStart(2, '0') + '-' + String(m[1]).padStart(2, '0'); };
  Object.assign(SA, { esc, clone, T, plural, dmy, dm, dLong, days, parseShort });

  /* ── vocabulary ───────────────────────────────────────────────────────────── */
  SA.REQ_LBL = { review: 'Under review', info: 'Information requested', pay: 'Approved — payment required', pend: 'Payment not confirmed', active: 'Access active' };
  SA.REQ_KIND = { review: 'info', info: 'err', pay: 'warn', pend: 'warn', active: 'ok' };
  SA.INST_LBL = { active: 'Access active', ending: 'Ending soon', paused: 'Access paused', payment: 'Approved — payment required', ended: 'Access ended' };
  SA.INST_KIND = { active: 'ok', ending: 'warn', paused: 'paused', payment: 'warn', ended: 'ended' };
  SA.pill = (kind, label, lg) => '<span class="xr-st ' + (kind === 'ended' ? 'rk-st-ended' : 'xr-st--' + kind) + (lg ? ' rk-st-lg' : '') + '"><i></i>' + esc(label) + '</span>';
  SA.code = c => c ? '<span class="rk-code">' + esc(c) + '</span>' : '';
  SA.fmtBadges = (list, aria) => '<span class="rk-fmts"' + (aria ? ' aria-label="' + esc(aria) + '"' : '') + '>' + D.FM.filter(f => list.indexOf(f) >= 0).map(f => '<span class="xr-fmt"' + (aria ? ' aria-hidden="true"' : '') + '>' + f + '</span>').join('') + '</span>';
  SA.ico = (id, cls) => '<svg class="' + (cls || 'xr-ico') + '" viewBox="0 0 24 24" aria-hidden="true"><use href="#' + id + '"></use></svg>';

  /* ── scenarios (documented in SCENARIOS.json) ─────────────────────────────── */
  SA.SCENARIOS = {
    busy: { label: '23 Oct 2026 · working day', asOf: 'oct23' },
    new: { label: '8 Oct 2026 · new institution asks for access', asOf: 'oct08' },
    quiet: { label: '23 Oct 2026 · nothing waiting', asOf: 'oct23' },
    konark: { label: '23 Oct 2026 · Konark paused (V3 SA-03 board)', asOf: 'oct23' }
  };

  function build(scenario) {
    const sc = SA.SCENARIOS[scenario] ? scenario : 'busy';
    const asOf = SA.SCENARIOS[sc].asOf, A = D.SNAP[asOf];
    let insts = clone(D.INSTITUTIONS);
    if (asOf === 'oct08') insts = insts.filter(i => !i.createdIso || i.createdIso <= A.iso);
    insts.forEach(i => { if (i.pause && i.pause.iso && i.pause.iso > A.iso) delete i.pause; i.students0 = i.students; });
    const has = id => insts.some(i => i.id === id);
    let requests = clone(D.REQUESTS).filter(r => r.st[asOf]).map(r => {
      const b = r.base ? (r.base[asOf] || r.base.all || null) : null;
      r.dec = b ? Object.assign({ when: '', fromBase: true }, b) : { decided: null };
      r.form = { choice: null, route: null, fm: null, lic: null, term: null, reason: '', errs: {} };
      return r;
    });
    let content = clone(D.CONTENT), updates = clone(D.UPDATES), holders = clone(D.HOLDERS).filter(h => h.sinceIso <= A.iso);
    let transfers = clone(D.TRANSFERS).filter(t => has(t.instId) && (!t.fwdIso || t.fwdIso <= A.iso) && !(asOf === 'oct08' && !t.fwdIso));
    let support = clone(D.SUPPORT).filter(s => !s.instId || has(s.instId));
    if (sc === 'quiet') {
      const drop = ['bitshyd', 'konark', 'sahyadri'];
      insts = insts.filter(i => drop.indexOf(i.id) < 0);
      requests = requests.filter(r => r.st[asOf] !== 'review' && drop.indexOf(r.instId) < 0);
      updates = updates.filter(u => u.st !== 'awaiting');
      transfers = transfers.filter(t => t.st !== 'forwarded' && has(t.instId));
      support = support.filter(s => s.st === 'resolved');
      content = content.filter(c => c.id !== 'dc-motor');
      holders = holders.filter(h => h.id !== 'k-iyer');
    }
    if (sc === 'konark') { const k = insts.find(i => i.id === 'konark'); k.pause = { iso: null, when: '', reason: '' }; }
    return {
      scenario: sc, asOf, A, tix: 0,
      requests, insts, content, updates, holders, transfers, support,
      areas: clone(D.AREAS), courses: clone(D.COURSES),
      students: D.GODAVARI_STUDENTS.map(s => ({ n: s[0], id: s[1], st: s[2] })),
      myReports: [],
      ui: {
        ov: 'all', reqList: { q: '', st: 'all', type: 'all', route: 'all', desc: true, more: false },
        instList: { q: '', f: 'all' }, updTab: 'awaiting', contList: { q: '', f: 'all' }, dtrTab: 'forwarded', supTab: 'open',
        help: { what: '', where: '', file: '', errs: {}, sent: false }
      },
      flash: null, refusal: null, dlg: null, menu: false, acct: false, inline: null
    };
  }
  SA.build = build;

  /* ── derived facts ────────────────────────────────────────────────────────── */
  SA.now = () => { const S = SA.S; const m = 5 + S.tix * 7; S.tix++; return S.A.short + ', ' + String(10 + Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
  SA.inst = id => SA.S.insts.find(i => i.id === id);
  SA.instStatus = i => {
    const iso = SA.S.A.iso;
    if (!i.plans.length) return 'payment';
    if (i.plans.every(p => p.endIso < iso)) return 'ended';
    if (i.pause) return 'paused';
    const live = i.plans.filter(p => p.endIso >= iso).map(p => p.endIso).sort()[0];
    return days(iso, live) <= 15 ? 'ending' : 'active';
  };
  SA.instEnd = i => { const iso = SA.S.A.iso; const live = i.plans.filter(p => p.endIso >= iso).map(p => p.endIso).sort(); return live[0] || i.plans.map(p => p.endIso).sort().slice(-1)[0] || null; };
  SA.noIA = i => !i.ia && ['active', 'ending', 'paused'].indexOf(SA.instStatus(i)) >= 0;
  SA.req = key => SA.S.requests.find(r => r.key === key);
  SA.reqStatus = r => r.dec.decided || r.st[SA.S.asOf];
  SA.reqRoute = r => r.route || (r.dec.decided && r.dec.decided !== 'info' ? r.dec.route : null);
  SA.reqBlocked = r => { if (r.dec.decided) return false; const i = r.instId && SA.inst(r.instId); return !!(i && SA.instStatus(i) === 'paused'); };
  SA.reviewersFor = c => SA.S.holders.filter(h => h.tab === 'reviewers' && h.scope.some(s => s.st === 'active' && (s.kind === 'all' || (s.kind === 'course' && s.v === c.course) || (s.kind === 'experiment' && s.v === c.name))));
  SA.contentStatus = c => c.st === 'review' && !SA.reviewersFor(c).length ? 'stuck' : c.st;
  SA.CONT_LBL = { published: 'Published', stuck: 'Stuck — nobody can act', review: 'With the Academic Reviewer', cm: 'With the Content Manager', vendor: 'Returned to the vendor' };
  SA.CONT_KIND = { published: 'ok', stuck: 'err', review: 'info', cm: 'info', vendor: 'warn' };
  SA.whoCanAct = c => {
    const s = SA.contentStatus(c);
    if (s === 'published') return 'Nobody needs to act';
    if (s === 'stuck') return 'Nobody. No Academic Reviewer has ' + c.course + ' in scope';
    if (s === 'review') return SA.reviewersFor(c).map(h => h.name).join(', ') + ' · Academic Reviewer';
    return c.who || '';
  };
  SA.upd = id => SA.S.updates.find(u => u.id === id);
  SA.content = id => SA.S.content.find(c => c.id === id);
  SA.holder = id => SA.S.holders.find(h => h.id === id);
  SA.hasScope = h => h.scope.some(s => s.st === 'active');
  SA.courseName = code => (SA.S.courses.find(c => c.code === code) || {}).name || D.COURSE_NAMES[code] || '';
  SA.reviewCount = () => SA.S.requests.filter(r => SA.reqStatus(r) === 'review').length;

  /* work items for the Overview; counted once per semantic item from the same records the destinations use */
  SA.work = () => {
    const S = SA.S, iso = S.A.iso;
    const ago = (fromIso, verb) => { const n = days(fromIso, iso); return { when: n === 0 ? 'Today' : plural(n, 'day'), when2: n === 0 ? dm(fromIso) : (verb || 'since') + ' ' + dm(fromIso) }; };
    const req = S.requests.filter(r => SA.reqStatus(r) === 'review').sort((a, b) => a.iso.localeCompare(b.iso)).map(r => Object.assign({
      t: r.ovT || (r.inst + ' asks for ' + r.type.toLowerCase()), d: r.ovD || '', act: 'Open request', href: '#/requests/' + r.key,
      aria: 'Open the ' + (r.renewal ? 'renewal' : r.type.toLowerCase()) + ' request from ' + r.inst, sort: r.iso }, ago(r.iso)));
    const upd = S.updates.filter(u => u.st === 'awaiting').sort((a, b) => a.apprIso.localeCompare(b.apprIso)).map(u => {
      const c = SA.content(u.exp);
      return Object.assign({ t: u.name + ' correction, version ' + u.from + ' to ' + u.to, d: 'Approved by the Academic Reviewer on ' + dLong(u.apprIso) + '. Version ' + (c ? c.ver : u.from) + ' is still live.',
        act: 'Review correction', href: '#/content/updates/' + u.id, aria: 'Review the ' + u.name + ' correction', sort: u.apprIso, u }, ago(u.apprIso));
    });
    const dtr = S.transfers.filter(t => t.st === 'forwarded').sort((a, b) => a.fwdIso.localeCompare(b.fwdIso)).map(t => Object.assign({
      t: t.fmt + ' device transfer for ' + t.student, d: t.inst + '. Forwarded by its Institute Admin.', act: 'Review transfer', href: '#/operations/device-transfers/' + t.id,
      aria: 'Review the ' + t.fmt + ' device transfer for ' + t.student }, ago(t.fwdIso)));
    const sup = S.support.filter(s => s.st !== 'resolved').sort((a, b) => a.actIso.localeCompare(b.actIso) || (SA.parseShort(a.sent) || '').localeCompare(SA.parseShort(b.sent) || '')).map(s => {
      const a = ago(s.actIso); return { t: s.title, d: s.who + ', ' + s.role, when: a.when, when2: s.actLabel, act: 'Open report', href: '#/operations/support/' + s.id, aria: 'Open the report: ' + s.title };
    });
    const end = S.insts.filter(i => SA.instStatus(i) === 'ending' || (SA.instStatus(i) === 'paused' && SA.instEnd(i) && days(iso, SA.instEnd(i)) <= 15 && days(iso, SA.instEnd(i)) >= 0)).map(i => {
      const e = SA.instEnd(i), n = days(iso, e), ren = i.renewalKey && SA.req(i.renewalKey);
      const renOpen = ren && SA.reqStatus(ren) === 'review';
      const d = ren ? (renOpen ? 'Access ends on ' + dLong(e) + '. Renewal in progress.' : 'Access ends on ' + dLong(e) + '. The renewal was approved; this page does not change the current term.') : 'Access ends on ' + dLong(e) + '. Reminder due; nothing is sent from here.';
      return { inst: i, t: i.name, d, when: n === 0 ? 'Today' : 'In ' + plural(n, 'day'), when2: dm(e), due: true, endIso: e, renOpen,
        act: ren ? 'Open renewal request' : 'View access ending', href: ren ? '#/requests/' + ren.key : '#/operations/access-ending',
        aria: ren ? 'Open the renewal request from ' + i.name : 'View access ending for ' + i.name,
        pd: ren ? (renOpen ? 'Its renewal request has been under review since ' + dLong(ren.iso) + '.' : 'Its renewal was approved. The current term still shows this end date.') : 'The reminder is due. Nothing is sent from here.' };
    }).sort((a, b) => a.endIso.localeCompare(b.endIso));
    const noia = S.insts.filter(SA.noIA).map(i => { const since = i.noIaSinceIso || i.createdIso || iso; return Object.assign({
      t: i.name + ' has no Institute Admin', d: 'Access ' + (SA.instStatus(i) === 'paused' ? 'paused' : 'active') + ' since ' + dLong(since) + '. Nobody there can give students access.',
      act: 'Assign Institute Admin', href: '#/institutions/' + i.id + '/assign', aria: 'Assign an Institute Admin to ' + i.name }, ago(since)); });
    const stuck = S.content.filter(c => SA.contentStatus(c) === 'stuck').map(c => Object.assign({
      t: c.name + ' is stuck in review', d: c.course + '. With the Academic Reviewer since ' + dLong(c.sinceIso) + '; no reviewer has this course in scope.',
      act: 'Open in All content', href: '#/content/records/' + c.id, aria: 'Open ' + c.name + ' in All content' }, ago(c.sinceIso)));
    const scope = S.holders.filter(h => !SA.hasScope(h)).map(h => Object.assign({
      t: h.name + ' has no scope yet', d: h.role + ', registered ' + dLong(h.sinceIso || iso) + '. Can’t act on anything yet.', act: 'Assign scope', href: '#/roles/holder/' + h.id,
      aria: 'Assign scope to ' + h.name }, ago(h.sinceIso || iso)));
    return { req, upd, dtr, sup, end, noia, stuck, scope };
  };

  /* ── routing ──────────────────────────────────────────────────────────────── */
  SA.route = () => {
    const p = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    const r = { p, sec: p[0] || 'overview' };
    return r;
  };
  SA.go = (hash, focusId) => { SA.pendingFocus = focusId || null; if (location.hash === hash) { onRoute(); } else location.hash = hash; };

  const NAV = [
    ['overview', 'Overview', 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z', '#/overview'],
    ['requests', 'Requests', 'M4 13l2.5-7h11L20 13v6H4zM4 13h5l1.5 2h3L15 13h5', '#/requests'],
    ['institutions', 'Institutions', 'M3 9.5 12 4l9 5.5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20.5h18', '#/institutions'],
    ['content', 'Content', 'M8 3h7.5L20 7.5V17a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM15 3v5h5M4 7v13a1 1 0 0 0 1 1h11', '#/content/updates'],
    ['structure', 'Academic structure', 'M10 3h4v4h-4zM3.5 17h4v4h-4zM10 17h4v4h-4zM16.5 17h4v4h-4zM12 7v5M5.5 17v-5h13v5M12 12v5', '#/structure'],
    ['roles', 'Platform roles', 'M12 3 5 6v5.5c0 4.3 3 8 7 9.5 4-1.5 7-5.2 7-9.5V6zM9 12l2 2 4-4', '#/roles/vendors'],
    ['operations', 'Operations', 'M4 6h9M17 6h3M15 4v4M4 12h3M11 12h9M9 10v4M4 18h11M19 18h1M17 16v4', '#/operations/device-transfers']
  ];
  const HELP_ICO = 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.6 9.4a2.5 2.5 0 0 1 4.9.8c0 1.7-2.5 2.2-2.5 3.8M12 17h.01';

  function navHtml(cur, withIcons) {
    const n = SA.reviewCount();
    return '<nav class="rb-nav" aria-label="Super Admin navigation">' + NAV.map(x => {
      const count = x[0] === 'requests' && n > 0 ? '<span class="rb-count"><span aria-hidden="true">' + n + '</span><span class="xr-sr">, ' + plural(n, 'request') + ' under review</span></span>' : '';
      return '<a href="' + x[3] + '"' + (cur === x[0] ? ' aria-current="page"' : '') + ' data-close-menu="1">' + (withIcons ? '<svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="' + x[2] + '"></path></svg>' : '') + '<span>' + x[1] + '</span>' + count + '</a>';
    }).join('') + '</nav>';
  }
  function helpNav(cur, withIcons) {
    return '<div class="rb-rail-foot"><nav class="rb-nav" aria-label="Help"><a href="#/help"' + (cur === 'help' ? ' aria-current="page"' : '') + ' data-close-menu="1">' + (withIcons ? '<svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="' + HELP_ICO + '"></path></svg>' : '') + '<span>Help &amp; support</span></a></nav></div>';
  }

  const SPRITE = '<svg width="0" height="0" style="position: absolute; overflow: hidden" aria-hidden="true" focusable="false">' + [
    ['rbi-inbox', 'M4 13l2.5-7h11L20 13v6H4zM4 13h5l1.5 2h3L15 13h5'], ['rbi-edit', 'M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4'],
    ['rbi-vr', 'M3 9.5A2.5 2.5 0 0 1 5.5 7h13A2.5 2.5 0 0 1 21 9.5v5a2.5 2.5 0 0 1-2.5 2.5h-3.3a2 2 0 0 1-1.7-1l-.7-1.2a1 1 0 0 0-1.7 0l-.7 1.2a2 2 0 0 1-1.7 1H5.5A2.5 2.5 0 0 1 3 14.5z'],
    ['rbi-life', 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5.6 5.6l3.9 3.9M14.5 14.5l3.9 3.9M18.4 5.6l-3.9 3.9M9.5 14.5l-3.9 3.9'],
    ['rbi-cal', 'M8 3v3M16 3v3M4 9h16M20 11V6a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h6M17.5 21a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM17.5 16v1.6l1 .9'],
    ['rbi-userminus', 'M15 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-4A3.5 3.5 0 0 0 4 17.5V19M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM16.5 11h5'],
    ['rbi-hourglass', 'M6 3h12M6 21h12M7 3v3a5 5 0 0 0 10 0V3M7 21v-3a5 5 0 0 1 10 0v3'],
    ['rbi-userq', 'M15 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-4A3.5 3.5 0 0 0 4 17.5V19M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM17.5 8.5a2 2 0 1 1 2.6 1.9c-.6.2-.6.7-.6 1.1M20 14.5h.01'],
    ['rki-search', 'M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15zM16 16l5 5'], ['rki-chev', 'M6 9.5l6 6 6-6'], ['rki-right', 'M9.5 6l6 6-6 6'],
    ['rki-filter', 'M4 6h10M18 6h2M16 4v4M4 12h3M11 12h9M9 10v4M4 18h11M19 18h1M17 16v4'], ['rki-down', 'M12 5v14M6 13l6 6 6-6'], ['rki-up', 'M12 19V5M6 11l6-6 6 6'],
    ['rki-x', 'M6 6l12 12M18 6 6 18'], ['rki-lock', 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5zM12 15v2.5'], ['rki-alert', 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5v5.5M12 16.5h.01'],
    ['rki-check', 'M5 12.5l4.5 4.5L19 7.5'], ['rki-clock', 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2'], ['rki-pause', 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM10 9v6M14 9v6'],
    ['rki-inbox', 'M4 13l2.5-7h11L20 13v6H4zM4 13h5l1.5 2h3L15 13h5'], ['rki-cloud', 'M7 18h10a4 4 0 0 0 .6-8 6 6 0 0 0-11.4-1.5A4.5 4.5 0 0 0 7 18zM12 11v4M12 17.5h.01'],
    ['rki-cal', 'M8 3v3M16 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z'], ['rki-ended', 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12h8'],
    ['rki-info', 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5h.01'], ['rki-ok', 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12.5l3 3 5-6'],
    ['rki-plus', 'M12 5v14M5 12h14'], ['rki-user', 'M18 20v-1.5a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4V20M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
    ['rki-calm', 'M5 12.5l4.5 4.5L19 7.5'], ['rki-out', 'M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l-4-4 4-4M6 12h10'],
    ['rki-layers', 'M12 3 3 8l9 5 9-5zM3 13l9 5 9-5']
  ].map(s => '<symbol id="' + s[0] + '" viewBox="0 0 24 24"><path d="' + s[1] + '"></path></symbol>').join('') + '</svg>';

  /* ── shell ────────────────────────────────────────────────────────────────── */
  function shell(cur, page) {
    const S = SA.S, me = D.SA;
    return '<div class="xr rb">' + SPRITE +
      '<aside class="rb-rail" aria-label="Super Admin workspace"><div class="rb-brand"><div class="rb-logo">Official WILP logo</div><p class="rb-product">XR Learning Platform</p><p class="rb-ws"><span class="rb-ws-role">Super Admin</span></p></div>' + navHtml(cur, true) + helpNav(cur, true) + '</aside>' +
      '<div class="rb-main"><div class="rb-top">' +
        '<button type="button" class="rb-menu" id="sa-menu" aria-expanded="' + (S.menu ? 'true' : 'false') + '" data-act="openMenu"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"></path></svg>Menu</button>' +
        '<p class="rb-top-date">' + esc(S.A.long) + '</p>' +
        '<div class="sa-acctwrap"><button type="button" class="rb-acct" id="sa-acct" aria-haspopup="true" aria-expanded="' + (S.acct ? 'true' : 'false') + '" aria-controls="sa-acctmenu" aria-label="Account menu, ' + esc(me.name) + ', Super Admin" data-act="toggleAcct"><span class="xr-avatar" aria-hidden="true">' + me.initials + '</span><span class="rb-acct-text" aria-hidden="true"><span class="rb-acct-name">' + esc(me.name) + '</span><span class="rb-acct-role">Super Admin</span></span><svg class="xr-ico xr-ico--18" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9.5l6 6 6-6"></path></svg></button>' +
        (S.acct ? '<div class="sa-acctmenu" id="sa-acctmenu" role="menu" aria-label="Account"><div class="sa-acctmenu-who" role="presentation"><span class="xr-avatar" aria-hidden="true">' + me.initials + '</span><span><b>' + esc(me.name) + '</b><span>Super Admin · ' + esc(me.email) + '</span></span></div><a role="menuitem" id="sa-acct-help" href="#/help" data-act="closeAcct">' + SA.ico('rki-info') + 'Help &amp; support</a><a role="menuitem" id="sa-acct-out" href="#/signed-out" data-act="closeAcct">' + SA.ico('rki-out') + 'Sign out</a></div>' : '') +
        '</div></div>' +
        '<main class="rb-page" id="top">' + page + '</main></div>' +
      (S.menu ? '<button type="button" class="rb-scrim" aria-label="Close menu" tabindex="-1" data-act="closeMenu"></button><div class="rb-drawer" id="sa-drawer" role="dialog" aria-modal="true" aria-label="Menu"><div class="rb-drawer-head"><p class="rb-product">XR Learning Platform</p><button type="button" class="rb-close" id="sa-menu-close" aria-label="Close menu" data-act="closeMenu"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"></path></svg></button></div><div class="rb-brand" style="padding-top: 0"><div class="rb-logo">Official WILP logo</div><p class="rb-ws"><span class="rb-ws-role">Super Admin</span></p></div>' + navHtml(cur, false) + helpNav(cur, false) + '</div>' : '') +
      dialogHtml() + '</div>';
  }

  /* ── dialogs (ConfirmDialog pattern from rb-kit) ──────────────────────────── */
  SA.DLG = {};
  function dialogHtml() {
    const S = SA.S; if (!S.dlg) return '';
    const spec = SA.DLG[S.dlg.type] ? SA.DLG[S.dlg.type](S.dlg) : null; if (!spec) return '';
    const busy = !!S.dlg.busy;
    return '<div class="rk-scrim" aria-hidden="true"></div><div class="rk-dialog" id="sa-dlg" role="dialog" aria-modal="true" aria-labelledby="dlg-t" aria-describedby="dlg-d">' +
      '<div class="rk-dlg-head"><h2 id="dlg-t" tabindex="-1">' + esc(spec.title) + '</h2><p id="dlg-d">' + esc(spec.desc) + '</p></div>' +
      '<div class="rk-dlg-body">' + (spec.body || '') + '</div>' +
      '<div class="rk-dlg-foot"><button type="button" class="rb-btn rb-btn--lg" id="dlg-cancel" data-act="dlgCancel"' + (busy ? ' disabled' : '') + '>Cancel</button><button type="button" class="rb-btn rb-btn--primary rb-btn--lg" id="dlg-ok" data-act="dlgOk"' + (busy ? ' aria-disabled="true"' : '') + '>' + esc(busy ? spec.busyLabel || 'Saving…' : spec.ok) + '</button></div></div>';
  }
  SA.dlgList = (now, later) => (now && now.length ? '<div class="rk-dlg-group rk-dlg-now"><h3>What happens now</h3><ul class="rk-dlg-list">' + now.map(t => '<li>' + SA.ico('rki-check', '') + '<span>' + esc(t) + '</span></li>').join('') + '</ul></div>' : '') +
    (later && later.length ? '<div class="rk-dlg-group rk-dlg-later"><h3>Only after later events, or not from here</h3><ul class="rk-dlg-list">' + later.map(t => '<li>' + SA.ico('rki-clock', '') + '<span>' + esc(t) + '</span></li>').join('') + '</ul></div>' : '');
  SA.field = (o) => {
    const id = o.id, err = o.err;
    const ctl = o.textarea
      ? '<textarea id="' + id + '" class="rk-textarea" data-bind="' + o.bind + '"' + (err ? ' aria-invalid="true"' : '') + ' aria-describedby="' + [o.hint ? id + '-hint' : '', err ? id + '-err' : ''].filter(Boolean).join(' ') + '">' + esc(o.value) + '</textarea>'
      : o.select
        ? '<div class="rk-selwrap"><select id="' + id + '" class="rk-select" data-bind="' + o.bind + '"' + (err ? ' aria-invalid="true"' : '') + (err ? ' aria-describedby="' + id + '-err"' : '') + '>' + o.select.map(op => '<option value="' + esc(op[0]) + '"' + (String(op[0]) === String(o.value) ? ' selected' : '') + '>' + esc(op[1]) + '</option>').join('') + '</select>' + SA.ico('rki-chev', '') + '</div>'
        : '<input id="' + id + '" class="rk-input" type="' + (o.type || 'text') + '" data-bind="' + o.bind + '" value="' + esc(o.value) + '" autocomplete="off"' + (err ? ' aria-invalid="true"' : '') + ' aria-describedby="' + [o.hint ? id + '-hint' : '', err ? id + '-err' : ''].filter(Boolean).join(' ') + '">';
    return '<div class="rk-field"><label class="rk-label" for="' + id + '">' + esc(o.label) + '</label>' + (o.hint ? '<p class="rk-hint" id="' + id + '-hint">' + esc(o.hint) + '</p>' : '') + ctl + (err ? '<p class="rk-ferr" id="' + id + '-err">' + SA.ico('rki-alert', '') + esc(err) + '</p>' : '') + '</div>';
  };
  SA.openDlg = (d, focusId) => { SA.S.dlg = Object.assign({ errs: {} }, d, { opener: d.opener || (document.activeElement && document.activeElement.id) || null }); SA.render(); SA.focus(focusId || 'dlg-t'); };
  SA.closeDlg = () => { const op = SA.S.dlg && SA.S.dlg.opener; SA.S.dlg = null; SA.render(); if (op) SA.focus(op); };

  /* ── page fragments ───────────────────────────────────────────────────────── */
  SA.crumbs = items => '<nav class="rk-crumbs" aria-label="Breadcrumb">' + items.map((c, i) => i < items.length - 1 ? '<a href="' + c[1] + '">' + esc(c[0]) + '</a>' + SA.ico('rki-right', '') : '<span aria-current="page">' + esc(c[0]) + '</span>').join('') + '</nav>';
  SA.timeline = list => '<ol class="rk-tl">' + list.map((h, i) => '<li' + (i === 0 ? ' class="is-latest"' : '') + '><p class="rk-tl-w">' + esc(h[0]) + '</p><p class="rk-tl-t">' + esc(h[1]) + '</p>' + (h[2] ? '<p class="rk-tl-n">' + esc(h[2]) + '</p>' : '') + '</li>').join('') + '</ol>';
  SA.histFilter = list => list.filter(h => { const iso = h[3] || SA.parseShort(h[1]); return !iso || iso <= SA.S.A.iso; });
  SA.notice = (kind, ico, t, d, act, id) => '<div class="rk-notice rk-notice--' + kind + '"' + (id ? ' id="' + id + '" tabindex="-1"' : '') + ' role="' + (kind === 'warn' || kind === 'err' ? 'status' : 'status') + '">' + SA.ico(ico, '') + '<p class="rk-notice-t">' + esc(t) + '</p>' + (d ? '<p class="rk-notice-d">' + d + '</p>' : '') + (act ? '<div class="rk-notice-act">' + act + '</div>' : '') + '</div>';
  SA.flashHtml = key => { const f = SA.S.flash; return f && f.key === key ? SA.notice('ok', 'rki-ok', f.t, f.d ? esc(f.d) : '', '', 'sa-flash') : ''; };
  SA.setFlash = (key, t, d, route) => { SA.S.flash = { key, t, d, route: route || location.hash }; };
  SA.refusalHtml = key => { const r = SA.S.refusal; return r && r.key === key ? '<div class="rk-notice rk-notice--warn" id="sa-refusal" tabindex="-1" role="alert">' + SA.ico('rki-alert', '') + '<p class="rk-notice-t">' + esc(r.t) + '</p><p class="rk-notice-d">' + esc(r.d) + '</p><div class="rk-notice-act"><button type="button" class="rb-btn" data-act="clearRefusal">Check it again</button></div></div>' : ''; };
  /* stale-decision simulation: returns true when the command must be refused */
  SA.staleGuard = key => { if (!SA.S.sim.stale) return false; SA.S.sim.stale = false; SA.S.dlg = null; SA.S.refusal = { key, t: 'This record changed after you opened it', d: 'Nothing was saved. Check what it shows now, then decide again.' }; SA.render(); SA.focus('sa-refusal'); return true; };
  SA.A.clearRefusal = () => { SA.S.refusal = null; SA.render(); SA.focus('page-h1'); };

  /* list states shared by every list (ListState from rb-kit) */
  SA.listState = (kind, o) => {
    if (kind === 'loading') return '<div aria-busy="true"><p class="rk-loading-msg" role="status">' + esc(o.loading) + '</p>' + [0, 1, 2].map(() => '<div class="rk-skel-row" aria-hidden="true"><div><span class="rk-skel"></span><span class="rk-skel"></span></div><div><span class="rk-skel"></span><span class="rk-skel"></span></div><div><span class="rk-skel"></span></div><div><span class="rk-skel"></span></div><div><span class="rk-skel"></span></div></div>').join('') + '</div>';
    if (kind === 'failed') return '<div class="rk-state" role="alert"><span class="rk-state-ico rk-state-ico--err" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#rki-cloud"></use></svg></span><p class="rk-state-t">' + esc(o.failed) + '</p><p class="rk-state-d">Nothing has changed. Try again.</p><button type="button" class="rb-btn" data-act="retryList">Try again</button></div>';
    if (kind === 'empty') return '<div class="rk-state"><span class="rk-state-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#' + (o.emptyIco || 'rki-inbox') + '"></use></svg></span><p class="rk-state-t">' + esc(o.emptyT) + '</p><p class="rk-state-d">' + esc(o.emptyD) + '</p></div>';
    return '<div class="rk-state" role="status"><span class="rk-state-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#rki-search"></use></svg></span><p class="rk-state-t">' + esc(o.noneT) + '</p><p class="rk-state-d">' + esc(o.noneD) + '</p><button type="button" class="rb-btn" data-act="' + o.clearAct + '">Clear filters</button></div>';
  };
  SA.A.retryList = () => { SA.S.sim.list = null; SA.render(); };
  SA.listMode = () => SA.S.sim.list || 'ok';

  /* ── render + focus management ────────────────────────────────────────────── */
  SA.focus = id => { SA.pendingFocus = id; window.setTimeout(applyFocus, 30); };
  function applyFocus() { const id = SA.pendingFocus; if (!id) return; SA.pendingFocus = null; const el = document.getElementById(id); if (el) { el.focus({ preventScroll: false }); if (el.scrollIntoView && id !== 'page-h1') el.scrollIntoView({ block: 'nearest' }); } }

  SA.render = () => {
    const root = document.getElementById('app');
    const a = document.activeElement, keepId = a && a.id && root.contains(a) ? a.id : null;
    let sel = null; try { if (keepId && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA') && a.type !== 'radio' && a.type !== 'checkbox') sel = [a.selectionStart, a.selectionEnd]; } catch (e) {}
    const r = SA.route();
    let out;
    try { out = SA.resolve(r); } catch (e) { console.error(e); out = { sec: '', title: 'Something went wrong', html: SA.V.message({ t: 'This page couldn’t be shown', d: 'Nothing has changed. Go back to the Overview and try again.', act: '<a class="rb-btn rb-btn--primary" href="#/overview">Back to Overview</a>' }) }; }
    root.innerHTML = (r.sec === 'signed-out' ? '<div class="xr sa-out">' + out.html + '</div>' : shell(out.sec, out.html)) + previewHtml();
    document.title = out.title + ' — Super Admin';
    Array.prototype.forEach.call(root.querySelectorAll('.rk-tabs [aria-current="page"], .rb-switch [aria-pressed="true"]'), el => { const box = el.parentElement; if (box.scrollWidth > box.clientWidth) box.scrollLeft = Math.max(0, el.offsetLeft - box.offsetLeft - 16); });
    if (keepId && !SA.pendingFocus) { const el = document.getElementById(keepId); if (el) { el.focus({ preventScroll: true }); if (sel) try { el.setSelectionRange(sel[0], sel[1]); } catch (e) {} } }
    if (SA.pendingFocus) window.setTimeout(applyFocus, 30);
  };

  SA.resolve = r => {
    const p = r.p, V = SA.V;
    const nf = { sec: '', title: 'Not available', html: V.message({ t: 'This page isn’t available', d: 'The address may be incomplete, or the record isn’t part of this workspace. Nothing has changed.', act: '<a class="rb-btn rb-btn--primary" href="#/overview">Back to Overview</a> <a class="rb-link" href="#/help">Help &amp; support</a>' }) };
    switch (r.sec) {
      case 'overview': return { sec: 'overview', title: 'Overview', html: V.overview() };
      case 'requests': if (!p[1]) return { sec: 'requests', title: 'Requests', html: V.requests() };
        return SA.req(p[1]) ? { sec: 'requests', title: SA.req(p[1]).inst, html: V.decision(SA.req(p[1])) } : nf;
      case 'institutions': if (!p[1]) return { sec: 'institutions', title: 'Institutions', html: V.institutions() };
        return SA.inst(p[1]) ? { sec: 'institutions', title: SA.inst(p[1]).name, html: V.institution(SA.inst(p[1]), p[2]) } : nf;
      case 'content':
        if (p[1] === 'updates' && !p[2]) return { sec: 'content', title: 'Content updates', html: V.updates() };
        if (p[1] === 'updates' && SA.upd(p[2])) return { sec: 'content', title: SA.upd(p[2]).name + ' correction', html: V.update(SA.upd(p[2])) };
        if (p[1] === 'all') return { sec: 'content', title: 'All content', html: V.allContent() };
        if (p[1] === 'records' && SA.content(p[2])) return { sec: 'content', title: SA.content(p[2]).name, html: V.record(SA.content(p[2])) };
        if (!p[1]) return { sec: 'content', title: 'Content updates', html: V.updates() };
        return nf;
      case 'structure':
        if (!p[1]) return { sec: 'structure', title: 'Academic structure', html: V.structure() };
        if (p[1] === 'areas' && SA.S.areas.find(a => a.id === p[2])) return { sec: 'structure', title: SA.S.areas.find(a => a.id === p[2]).name, html: V.area(SA.S.areas.find(a => a.id === p[2])) };
        if (p[1] === 'courses' && SA.S.courses.find(c => c.id === p[2])) return { sec: 'structure', title: SA.S.courses.find(c => c.id === p[2]).name, html: V.course(SA.S.courses.find(c => c.id === p[2])) };
        return nf;
      case 'roles':
        if (p[1] === 'holder') return SA.holder(p[2]) ? { sec: 'roles', title: SA.holder(p[2]).name, html: V.holder(SA.holder(p[2])) } : nf;
        if (!p[1] || ['vendors', 'reviewers', 'content-managers'].indexOf(p[1]) >= 0) return { sec: 'roles', title: 'Platform roles', html: V.roles(p[1] || 'vendors') };
        return nf;
      case 'operations':
        if (!p[1] || p[1] === 'device-transfers') { if (p[2]) { const t = SA.S.transfers.find(x => x.id === p[2]); return t ? { sec: 'operations', title: t.fmt + ' device transfer for ' + t.student, html: V.transfer(t) } : nf; } return { sec: 'operations', title: 'Device transfers', html: V.transfers() }; }
        if (p[1] === 'support') { if (p[2]) { const s = SA.S.support.find(x => x.id === p[2]); return s ? { sec: 'operations', title: s.title, html: V.report(s) } : nf; } return { sec: 'operations', title: 'Support reports', html: V.support() }; }
        if (p[1] === 'access-ending') return { sec: 'operations', title: 'Access ending', html: V.accessEnding() };
        return nf;
      case 'help': return { sec: 'help', title: 'Help & support', html: V.help() };
      case 'signed-out': return { sec: '', title: 'Signed out', html: V.signedOut() };
      default: return nf;
    }
  };

  /* ── design-only preview controls (not product UI; hidden with ?clean=1) ──── */
  SA.SCREENS = [
    ['SA-01', 'Overview', '#/overview'], ['SA-02', 'Requests', '#/requests'], ['SA-03', 'Request decision', '#/requests/hyderabad-renewal'],
    ['SA-06', 'Institutions', '#/institutions'], ['SA-07', 'Institution detail', '#/institutions/godavari'],
    ['SA-10', 'Content updates', '#/content/updates'], ['SA-11', 'Release or hold an update', '#/content/updates/distillation-1-3'],
    ['SA-12', 'All content & stuck items', '#/content/all'], ['SA-13', 'Content record', '#/content/records/dc-motor'],
    ['SA-14', 'Academic structure', '#/structure'], ['SA-15', 'Area / course record', '#/structure/courses/me-zg523'],
    ['SA-16', 'Platform roles', '#/roles/reviewers'], ['SA-17', 'Role holder', '#/roles/holder/k-iyer'],
    ['SA-18', 'Device transfers', '#/operations/device-transfers'], ['SA-19', 'Device transfer decision', '#/operations/device-transfers/rahul-verma-vr'],
    ['SA-20', 'Support reports', '#/operations/support'], ['SA-21', 'Support report', '#/operations/support/import-part-way'],
    ['SA-22', 'Access ending & renewals', '#/operations/access-ending']
  ];
  function previewHtml() {
    const S = SA.S; if (SA.clean) return '';
    if (!S.pv) return '<div class="xr"><button type="button" class="sa-pv-fab" id="sa-pv-open" data-act="pvOpen" aria-expanded="false">' + SA.ico('rki-layers', '') + 'Preview controls</button></div>';
    return '<div class="xr"><section class="sa-pv" id="sa-pv" aria-labelledby="sa-pv-h"><div class="sa-pv-head"><h2 id="sa-pv-h" tabindex="-1">Preview controls</h2><button type="button" class="rb-close sa-pv-close" id="sa-pv-close" aria-label="Close preview controls" data-act="pvClose">' + SA.ico('rki-x') + '</button></div>' +
      '<p class="sa-pv-note">Design review only. Not part of the Super Admin interface.</p>' +
      SA.field({ id: 'pv-sc', label: 'Scenario', bind: 'pv.scenario', value: S.scenario, select: Object.keys(SA.SCENARIOS).map(k => [k, SA.SCENARIOS[k].label]) }) +
      SA.field({ id: 'pv-list', label: 'Lists load as', bind: 'sim.list', value: S.sim.list || '', select: [['', 'Normal'], ['loading', 'Loading'], ['failed', 'Failed'], ['empty', 'Empty']] }) +
      '<label class="rk-check sa-pv-check" for="pv-stale"><input type="checkbox" id="pv-stale" data-bind="sim.stale"' + (S.sim.stale ? ' checked' : '') + '>Next decision meets a change made elsewhere</label>' +
      '<div class="sa-pv-screens"><p class="rk-label">Screens</p><ul>' + SA.SCREENS.map(s => '<li><a href="' + s[2] + '"><b>' + s[0] + '</b> ' + esc(s[1]) + '</a></li>').join('') + '</ul></div>' +
      '<button type="button" class="rb-btn" id="pv-reset" data-act="pvReset">Reset this scenario</button></section></div>';
  }
  SA.A.pvOpen = () => { SA.S.pv = true; SA.render(); SA.focus('sa-pv-h'); };
  SA.A.pvClose = () => { SA.S.pv = false; SA.render(); SA.focus('sa-pv-open'); };
  SA.A.pvReset = () => { const sim = SA.S.sim, pv = SA.S.pv; SA.S = build(SA.S.scenario); SA.S.sim = sim; SA.S.pv = pv; SA.render(); SA.focus('pv-reset'); };

  /* ── generic actions ──────────────────────────────────────────────────────── */
  SA.A.openMenu = () => { SA.S.menu = true; SA.render(); SA.focus('sa-menu-close'); };
  SA.A.closeMenu = () => { SA.S.menu = false; SA.render(); SA.focus('sa-menu'); };
  SA.A.toggleAcct = () => { SA.S.acct = !SA.S.acct; SA.render(); SA.focus(SA.S.acct ? 'sa-acct-help' : 'sa-acct'); };
  SA.A.closeAcct = () => { SA.S.acct = false; };
  SA.A.dlgCancel = () => { if (SA.S.dlg && SA.S.dlg.busy) return; SA.closeDlg(); };
  SA.A.dlgOk = () => { const d = SA.S.dlg; if (!d || d.busy) return; const fn = SA.DLG[d.type] && SA.DLG[d.type](d).run; if (fn) fn(d); };

  function setPath(obj, path, val) { const ks = path.split('.'); let o = obj; for (let i = 0; i < ks.length - 1; i++) { if (o[ks[i]] === undefined || o[ks[i]] === null) o[ks[i]] = {}; o = o[ks[i]]; } o[ks[ks.length - 1]] = val; }
  SA.setPath = setPath;
  function bindTarget(path) {
    const S = SA.S;
    const m = /^(req|upd|holder|sup):([^.]+)\.(.+)$/.exec(path);
    if (m) { const o = m[1] === 'req' ? SA.req(m[2]) : m[1] === 'upd' ? SA.upd(m[2]) : m[1] === 'sup' ? SA.S.support.find(x => x.id === m[2]) : SA.holder(m[2]); return [o, m[3]]; }
    return [S, path];
  }

  function onRoute() {
    const S = SA.S; S.menu = false; S.acct = false; S.dlg = null; S.refusal = null; S.inline = null;
    const sec = SA.route().sec, LBL = { overview: 'Overview', requests: 'Requests', institutions: 'Institutions', content: 'Content', structure: 'Academic structure', roles: 'Platform roles', operations: 'Operations' };
    if (sec === 'help' && SA.lastSec !== 'help') { S.ui.help.where = ''; SA.prevPlace = LBL[SA.lastSec] || 'Overview'; }
    SA.lastSec = sec;
    if (S.flash && S.flash.route !== location.hash) S.flash = null;
    SA.render();
    if (!SA.pendingFocus) SA.focus('page-h1');
    try { window.scrollTo(0, 0); } catch (e) {}
    const rr = SA.route();
    if (rr.sec === 'institutions' && rr.p[2] === 'assign') { const i = SA.inst(rr.p[1]); if (i && SA.noIA(i)) window.setTimeout(() => SA.A.instAssign({ id: i.id }), 40); }
  }
  SA.onRoute = onRoute;

  document.addEventListener('click', ev => {
    const t = ev.target;
    const actEl = t.closest('[data-act]');
    if (actEl && document.getElementById('app').contains(actEl)) {
      const fn = SA.A[actEl.dataset.act];
      if (fn) { if (actEl.tagName === 'A' && actEl.dataset.act !== 'closeAcct') ev.preventDefault(); fn(actEl.dataset, actEl, ev); return; }
    }
    if (t.closest('[data-close-menu]')) { SA.S.menu = false; }
    const row = t.closest('tr[data-href]');
    if (row && !t.closest('a,button,input,select,label')) { SA.go(row.dataset.href); return; }
    if (SA.S.acct && !t.closest('.sa-acctwrap')) { SA.S.acct = false; SA.render(); }
  });
  document.addEventListener('input', ev => {
    const el = ev.target; if (!el.dataset || !el.dataset.bind || el.type === 'checkbox' || el.type === 'radio' || el.tagName === 'SELECT') return;
    const [o, p] = bindTarget(el.dataset.bind); setPath(o, p, el.value);
    if (el.dataset.live) SA.render();
  });
  document.addEventListener('change', ev => {
    const el = ev.target; if (!el.dataset || !el.dataset.bind) return;
    if (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && ['checkbox', 'radio', 'file'].indexOf(el.type) < 0)) return; /* already stored on input; re-rendering on blur would swallow the next click */
    const path = el.dataset.bind;
    if (path === 'pv.scenario') { const sim = SA.S.sim; SA.S = build(el.value); SA.S.sim = sim; SA.S.pv = true; SA.render(); SA.focus('pv-sc'); return; }
    if (el.type === 'file') { const [o, p] = bindTarget(path); setPath(o, p, el.files && el.files[0] ? el.files[0].name : ''); SA.render(); return; }
    let v = el.type === 'checkbox' ? el.checked : el.value;
    if (path === 'sim.list') v = v || null;
    const [o, p] = bindTarget(path); setPath(o, p, v);
    if (el.dataset.onchange && SA.A[el.dataset.onchange]) SA.A[el.dataset.onchange](el.dataset, el);
    SA.render();
  });
  document.addEventListener('keydown', ev => {
    const S = SA.S;
    if (ev.key === 'Escape') {
      if (S.dlg) { ev.preventDefault(); SA.A.dlgCancel(); return; }
      if (S.menu) { ev.preventDefault(); SA.A.closeMenu(); return; }
      if (S.acct) { ev.preventDefault(); S.acct = false; SA.render(); SA.focus('sa-acct'); return; }
      if (S.pv) { ev.preventDefault(); SA.A.pvClose(); return; }
    }
    if (ev.key === 'Tab') {
      const box = S.dlg ? document.getElementById('sa-dlg') : S.menu ? document.getElementById('sa-drawer') : null;
      if (!box) return;
      const items = Array.prototype.slice.call(box.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select, textarea')).filter(x => x.offsetParent !== null || x === document.activeElement);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1], a = document.activeElement;
      if (!box.contains(a)) { ev.preventDefault(); first.focus(); return; }
      if (ev.shiftKey && (a === first || a.id === 'dlg-t')) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && a === last) { ev.preventDefault(); first.focus(); }
    }
    if (S.acct && (ev.key === 'ArrowDown' || ev.key === 'ArrowUp')) {
      const items = Array.prototype.slice.call(document.querySelectorAll('#sa-acctmenu [role="menuitem"]')); const i = items.indexOf(document.activeElement);
      if (items.length) { ev.preventDefault(); items[(i + (ev.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus(); }
    }
  });
  window.addEventListener('hashchange', onRoute);

  SA.start = () => {
    const q = new URLSearchParams(location.search);
    SA.clean = q.get('clean') === '1';
    SA.S = build(q.get('scenario') || 'busy');
    SA.S.sim = { list: q.get('list') || null, stale: q.get('stale') === '1' };
    if (!/^#\//.test(location.hash)) { try { history.replaceState(null, '', location.pathname + location.search + '#/overview'); } catch (e) { location.hash = '#/overview'; } }
    SA.lastSec = SA.route().sec;
    SA.render();
    if (SA.boot) SA.boot(q);
  };
})();
