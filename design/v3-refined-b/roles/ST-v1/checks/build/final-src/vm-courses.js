  courseLine(w) {
    if (w.inst === 'paused') return 'Paused — your institution’s access is paused';
    if (w.grant === 'ended') return 'Access ended on ' + w.endedOn + ' · earlier work kept';
    if (w.grant === 'withdrawn') return 'No longer given to you · earlier work kept';
    if (w.grant === 'waiting') return '1 experiment given to you · waiting for a licence';
    return '1 experiment given to you · ' + (this.avail(w, 'VR').kind === 'on' ? 'WEB and VR available' : 'WEB available · VR not available right now');
  }
  // ── one experiment as a list row: what it is, your formats with their status, one way in ─────────────
  xcard(w, hidPrefix) {
    const E = Component.EXP.ste, C = Component.CRS;
    const canOpen = this.current(w) && w.inst !== 'paused';
    return Object.assign({ hid: hidPrefix + '-ste', t: E.t, desc: E.desc, code: C.own, course: C.name, canOpen, aria: 'Open experiment ' + E.t, fAria: 'Your formats for ' + E.t,
      fmts: ['WEB', 'VR'].map(f => this.fmtStatus(w, f)), fstats: ['WEB', 'VR'].map(f => this.fstat(w, f, false)) }, this.L({ s: 'hub', exp: 'ste', tab: 'overview' }));
  }
  // A course as a section: its codes and area, then the experiments given to you in it.
  courseCard(w) {
    const C = Component.CRS, paused = w.inst === 'paused', waiting = w.grant === 'waiting';
    return Object.assign({ hid: 'st-c-mec-523', code: C.own, bits: C.bits, area: C.area, name: C.name, count: '1 experiment given to you',
      hasPill: paused || waiting, pillCls: paused ? 'xr-st xr-st--paused' : 'xr-st xr-st--warn', pill: paused ? 'Paused' : 'Waiting for a licence',
      aria: 'Open course ' + C.name, listAria: 'Experiments given to you in ' + C.name, exps: [this.xcard(w, 'st-c')] }, this.L({ s: 'course' }));
  }
  coursesVM(w, r, u) {
    const E = Component.EXP.ste, C = Component.CRS, isX = r.tab === 'experiments';
    const V = { tabC: Object.assign({ cur: isX ? undefined : 'page' }, this.L({ s: 'courses', tab: 'courses' })), tabX: Object.assign({ cur: isX ? 'page' : undefined }, this.L({ s: 'courses', tab: 'experiments' })),
      loading: false, failed: false, none: false, earlier: { show: false, view: {} }, showCourses: false, showX: false, rows: [],
      loadingText: isX ? 'Loading your experiments…' : 'Loading your courses…', failText: isX ? 'We couldn’t load your experiments' : 'We couldn’t load your courses',
      noneText: isX ? 'Experiments appear here when your institution gives them to you.' : 'Courses appear here when your institution gives you an experiment in them.',
      retry: () => this.apply({ ui: { data: 'ok' }, focus: 'st-h1' }) };
    const X = { q: u.xq, f: u.xf, fopts: [], chips: [], hasChips: false, rows: [], has: false, nomatch: false, count: '' };
    if (w.grant === 'none') { V.none = true; return { C: V, X }; }
    if (w.grant === 'ended' || w.grant === 'withdrawn') {
      V.earlier = { show: true, t: E.t, code: C.own, course: C.name, note: w.grant === 'ended' ? 'Access ended on ' + this.nbd(w.endedOn) + '. Your earlier work is kept.' : 'No longer given to you. Your work is kept.',
        fmts: ['WEB', 'VR'].map(f => this.fmtStatus(w, f)), fAria: 'Your formats for ' + E.t,
        view: Object.assign({ aria: 'View earlier work on ' + E.t }, this.L({ s: 'prog' })) };
      return { C: V, X };
    }
    if (u.data === 'loading') { V.loading = true; return { C: V, X }; }
    if (u.data === 'failed') { V.failed = true; return { C: V, X }; }
    if (!isX) { V.showCourses = true; V.rows = [this.courseCard(w)]; return { C: V, X }; }
    V.showX = true;
    const all = [this.xcard(w, 'st-x')], q = String(u.xq || '').trim().toLowerCase(), fopts = ['WEB', 'VR'];
    const list = all.filter(e => (!q || (e.t + ' ' + e.course + ' ' + e.code + ' ' + C.bits).toLowerCase().includes(q)) && (u.xf === 'all' || fopts.includes(u.xf)));
    const chips = [];
    if (q) chips.push({ label: 'Search: “' + String(u.xq).trim() + '”', rm: () => this.apply({ ui: { xq: '' }, focus: 'st-x-q' }) });
    if (u.xf !== 'all') chips.push({ label: 'Format: ' + u.xf, rm: () => this.apply({ ui: { xf: 'all' }, focus: 'st-x-f' }) });
    chips.forEach(c => { c.aria = 'Remove filter ' + c.label; });
    Object.assign(X, { onQ: ev => this.apply({ ui: { xq: ev.target.value } }), onF: ev => this.apply({ ui: { xf: ev.target.value } }), fopts, chips, hasChips: chips.length > 0,
      clear: () => this.apply({ ui: { xq: '', xf: 'all' }, focus: 'st-x-q' }), rows: list, has: list.length > 0, nomatch: list.length === 0,
      count: chips.length ? list.length + ' of ' + this.plural(all.length, 'experiment') : this.plural(all.length, 'experiment') + ' in 1 course' });
    return { C: V, X };
  }
  courseVM(w) {
    const C = Component.CRS;
    const paused = w.inst === 'paused', waiting = w.grant === 'waiting';
    return { back: this.L({ s: 'courses', tab: 'courses' }), name: C.name, code: C.own, bits: C.bits, area: C.area, meta: '1 experiment given to you', hasPill: paused || waiting,
      pillCls: paused ? 'xr-st xr-st--paused' : 'xr-st xr-st--warn', pill: paused ? 'Paused' : 'Waiting for a licence', paused, rows: [this.xcard(w, 'st-co')] };
  }
