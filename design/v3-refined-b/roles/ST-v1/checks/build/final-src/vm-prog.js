  // ── one experiment's progress, format by format (ST-15 rows and the experiment's Progress tab, ST-10) ─────────
  progExp(w, st, idp) {
    const E = Component.EXP.ste, C = Component.CRS, A = Component.ASM, FN = Component.FN, runs = w.runs, earlier = w.grant === 'ended' || w.grant === 'withdrawn';
    // your formats (given to you): access in words, your own progress, dated facts, at most one action each.
    // A pause or a licence wait holds both formats, so its reason is said once: a pause by the page banner,
    // a licence wait in one line above the table.
    const shared = w.inst === 'paused' || w.grant === 'waiting';
    const holdNote = w.inst === 'paused' ? { show: false, ico: '', d: '' }
      : w.grant === 'waiting' ? { show: true, ico: 'sti-clock', d: 'No licence is available for you right now. Your institution can tell you more.' } : { show: false, ico: '', d: '' };
    let mine = ['WEB', 'VR'].map(f => {
      const c = this.fmtChip(w, f), r = runs[f], fb = w.fb[f], pill = this.runWord(w, f), facts = [];
      if (f === 'WEB') {
        if (r.st === 'none') facts.push('Not opened yet');
        if (r.first) facts.push('First opened ' + this.nbd(r.first));
        if (r.st === 'prog' && r.saved) facts.push('Last saved ' + this.nbd(r.saved));
        if (r.st === 'done') facts.push((r.by === 'platform' ? 'Recorded by the platform at ' : 'Reported by the simulation at ') + this.tOnly(r.done));
      } else {
        if (r.st === 'none') facts.push('No headset session reported yet');
        if (r.first) facts.push('First session reported ' + this.nbd(r.first));
        if (r.st === 'prog' && r.saved && r.saved !== r.first) facts.push('Last session reported ' + this.nbd(r.saved));
        if (r.st === 'done') facts.push('Reported from the headset at ' + this.tOnly(r.done));
      }
      if (r.st === 'done' && fb) facts.push('Feedback sent ' + this.nbd(this.dOnly(fb.when)));
      const why = c.kind === 'held' && !shared ? this.holdReason(w, f) : '';
      if (why) facts.push(why);
      const acts = [];
      if (c.kind === 'on') {
        const pr = f === 'WEB' ? { s: 'web', exp: 'ste' } : { s: 'fmt', exp: 'ste', fmt: f };
        if (r.st === 'prog') acts.push(Object.assign({ label: 'Continue ' + f, kind: 'cont' }, this.L(pr)));
        else if (r.st === 'none') acts.push(Object.assign({ label: 'Open ' + f, kind: 'open' }, this.L(pr)));
        else if (!fb) acts.push(Object.assign({ label: 'Give feedback on ' + f, kind: 'fb' }, this.L({ s: 'fb', exp: 'ste', fmt: f })));
      }
      acts.forEach(x => { x.aria = x.label + ', ' + E.t; });
      return Object.assign(c, { name: FN[f], access: c.kind === 'on' ? 'Available to you' : c.label, pillCls: pill[0], pill: pill[1], facts, acts, st: r.st, launchable: c.kind === 'on' });
    });
    if (st !== 'all') mine = mine.filter(x => x.launchable && x.st === st);
    // one primary action on the page, chosen as before: continue, then feedback, then open
    const has = k => mine.some(x => x.acts.some(y => y.kind === k)), pick = has('cont') ? 'cont' : has('fb') ? 'fb' : 'open';
    let marked = false;
    mine.forEach(x => x.acts.forEach(y => { y.cls = 'rb-btn'; if (!marked && y.kind === pick) { y.cls = 'rb-btn rb-btn--primary'; marked = true; } }));
    const off = st === 'all' ? this.offFormats(w) : [];
    const a = w.asmt, AS = this.asmtRow(w), sc = this.score(w);
    const asmt = a.st === 'none' ? 'Not set by your faculty yet' : a.st === 'todo' ? A.name + ' · to do · due ' + this.nbd(A.deadline) : a.st === 'prog' ? A.name + ' · attempt in progress' : a.st === 'noq' ? A.name + ' · can’t be started yet'
      : a.st === 'wait' ? A.name + ' · submitted, waiting for marking' : a.st === 'notrel' ? A.name + ' · marked, result not released yet' : A.name + ' · ' + (sc >= A.passm ? 'passed' : 'not passed') + ' · ' + sc + ' of ' + A.total + ' marks · released ' + this.nbd(this.dOnly(a.released));
    const linkLabel = { todo: 'Open assessment', prog: 'Continue attempt', ready: 'See result' }[a.st];
    const exp = Object.assign({ hid: idp + '-ste', t: E.t, given: 'Given by your institution' + (w.grant === 'ended' ? ' · access ended on ' + this.nbd(w.endedOn) : w.grant === 'withdrawn' ? ' · no longer given to you' : ''),
      hasOpen: !earlier && w.inst !== 'paused', aria: 'Open experiment ' + E.t, note: holdNote, capt: 'Your formats for ' + E.t + ': progress and actions', mine, hasMine: mine.length > 0, off, hasOff: off.length > 0, offId: idp + '-off-ste',
      asmt, hasAsmtLink: !!linkLabel && !earlier, asmtLink: linkLabel ? Object.assign({ label: linkLabel }, this.L({ s: a.st === 'prog' ? 'att' : a.st === 'todo' ? 'aintro' : 'ares' })) : {} }, this.L({ s: 'hub', exp: 'ste', tab: 'overview' }));
    return exp;
  }
  progVM(w, u) {
    const E = Component.EXP.ste, C = Component.CRS, A = Component.ASM, FN = Component.FN, runs = w.runs;
    const V = { nothing: false, showList: true, showTools: true, st: u.pst, crs: u.pcrs, crsLabel: C.own + ' · ' + C.name, chips: [], hasChips: false, loading: false, failed: false, nomatch: false, groups: [], count: '',
      onSt: ev => this.apply({ ui: { pst: ev.target.value } }), onCrs: ev => this.apply({ ui: { pcrs: ev.target.value } }), clear: () => this.apply({ ui: { pst: 'all', pcrs: 'all' }, focus: 'st-p-st' }), retry: () => this.apply({ ui: { data: 'ok' }, focus: 'st-h1' }) };
    if (w.grant === 'none') { V.nothing = true; V.showList = false; return V; }
    const earlier = w.grant === 'ended' || w.grant === 'withdrawn';
    if (earlier) V.showTools = false;
    if (u.data === 'loading') { V.loading = true; return V; }
    if (u.data === 'failed') { V.failed = true; return V; }
    const st = earlier ? 'all' : u.pst, crs = earlier ? 'all' : u.pcrs;
    const exp = this.progExp(w, st, 'st-p'), mine = exp.mine;
    const show = mine.length > 0 && (crs === 'all' || crs === 'mec-523');
    V.groups = show ? [{ hid: 'st-p-g1', code: C.own, title: earlier ? 'Earlier work · ' + C.name : C.name, d: '1 experiment', hasNote: earlier,
      note: w.grant === 'ended' ? 'Your access to these experiments has ended. Your progress is kept and stays here.' : 'These experiments are no longer given to you. Your progress is kept and stays here.', exps: [exp] }] : [];
    V.nomatch = !show;
    const chips = [];
    if (st !== 'all') chips.push({ label: 'Status: ' + { prog: 'In progress', done: 'Completed', none: 'Not started' }[st], rm: () => this.apply({ ui: { pst: 'all' }, focus: 'st-p-st' }) });
    if (crs !== 'all') chips.push({ label: 'Course: ' + C.own, rm: () => this.apply({ ui: { pcrs: 'all' }, focus: 'st-p-c' }) });
    chips.forEach(c => { c.aria = 'Remove filter ' + c.label; });
    V.chips = chips; V.hasChips = chips.length > 0;
    V.count = chips.length ? (show ? 1 : 0) + ' of 1 experiment' : '1 experiment in 1 course';
    return V;
  }
