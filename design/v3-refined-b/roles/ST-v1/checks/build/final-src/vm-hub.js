  hubVM(w, r, u) {
    const E = Component.EXP.ste, C = Component.CRS, A = Component.ASM, FN = Component.FN, tab = r.tab || 'overview';
    const paused = w.inst === 'paused', waiting = w.grant === 'waiting';
    const V = { crumbCourses: this.L({ s: 'courses', tab: 'courses' }), crumbCourse: this.L({ s: 'course' }), course: C.name, code: C.own, bits: C.bits, area: C.area, t: E.t, desc: E.desc,
      hasPill: waiting && !paused, pillCls: 'xr-st xr-st--warn', pill: 'Waiting for a licence', pillText: 'Your institution can tell you more.',
      tabsAria: E.t + ' sections', isOverview: tab === 'overview', isResources: tab === 'resources', isFormats: tab === 'simulation' || tab === 'progress', isAssessment: tab === 'assessment',
      tabs: [['overview', 'Overview'], ['resources', 'Resources'], ['simulation', 'Simulation'], ['assessment', 'Assessment'], ['progress', 'Progress']].map(t => Object.assign({ t: t[1], cur: t[0] === tab ? 'page' : undefined }, this.L({ s: 'hub', exp: 'ste', tab: t[0] }))),
      outcomes: E.outcomes, need: [{ code: 'WEB', t: 'Laptop or desktop with a current web browser' }, { code: 'VR', t: 'Supported VR headset' }] };
    V.cells = ['WEB', 'AR', 'VR', 'MR'].map(f => { const a = this.avail(w, f), c = this.cellOf(a); return { code: f, name: FN[f], state: a.label, cls: c.cls, glyph: c.glyph, hasGlyph: c.hasGlyph }; });
    // next step (deterministic rule recorded in HANDOFF.md)
    const runs = w.runs, a = w.asmt, open = Object.keys(w.opened).length;
    const nx = (t, d, label, rt) => ({ show: true, t, d, hasD: !!d, label, hasAct: !!label, href: label ? '#' + this.path(rt) : '', go: label ? this.L(rt).go : null });
    let next = { show: false };
    if (!paused && !waiting) {
      const prog = ['WEB', 'VR'].find(f => runs[f].st === 'prog' && this.canLaunch(w, f));
      const fbDue = ['WEB', 'VR'].find(f => runs[f].st === 'done' && !w.fb[f]);
      const notStarted = ['WEB', 'VR'].find(f => runs[f].st === 'none' && this.canLaunch(w, f));
      const nothing = ['WEB', 'VR'].every(f => runs[f].st === 'none');
      if (prog === 'WEB') next = nx('Continue in your browser', 'WEB is in progress. Last saved ' + runs.WEB.saved + '.', 'Continue WEB', { s: 'web', exp: 'ste' });
      else if (prog === 'VR') next = nx('Continue on your headset', 'VR is in progress. Last session reported ' + runs.VR.saved + '.', 'Open VR', { s: 'fmt', exp: 'ste', fmt: 'VR' });
      else if (fbDue) next = nx('Give feedback on ' + fbDue, 'You completed ' + fbDue + ' on ' + this.dOnly(runs[fbDue].done) + '.', 'Give feedback on ' + fbDue, { s: 'fb', exp: 'ste', fmt: fbDue });
      else if (nothing && !open) next = nx('Open the resources', '', 'Open resources', { s: 'hub', exp: 'ste', tab: 'resources' });
      else if (nothing) next = nx('Choose a format', 'Each format has its own progress.', 'Choose a format', { s: 'hub', exp: 'ste', tab: 'simulation' });
      else if (a.st === 'todo') next = nx('Start the assessment', A.name + ' is due ' + A.deadline + '.', 'Open assessment', { s: 'aintro' });
      else if (a.st === 'prog') next = nx('Finish your attempt', 'Your answers are saved.', 'Continue attempt', { s: 'att' });
      else if (notStarted) next = nx('Set up ' + notStarted, notStarted + ' is waiting for you.', 'Open ' + notStarted, notStarted === 'WEB' ? { s: 'web', exp: 'ste' } : { s: 'fmt', exp: 'ste', fmt: notStarted });
      else next = nx('Nothing else to do here right now', 'Your work on each format is in the Progress tab.', '', null);
    }
    V.next = next;
    V.note = paused ? { show: true, cls: 'st-band-note st-band-note--paused', ico: 'sti-pause', t: 'Your institution’s access is paused', d: 'Resources and simulations can’t be opened right now. Your work is kept, and you can continue when it’s lifted.' }
      : waiting ? { show: true, cls: 'st-band-note st-band-note--wait', ico: 'sti-clock', t: 'You’re waiting for a licence', d: 'No licence is available for you on ACC-0107 right now. Your institution can tell you more.' } : { show: false };
    // three steps, no locks and no completion verdict
    const resD = paused ? 'Not available while your institution’s access is paused.' : waiting ? 'Not available to you yet — you’re waiting for a licence.'
      : open === 0 ? '3 resources · none opened yet.' : open === 1 ? Component.RES.find(x => w.opened[x.id]).short + ' opened on ' + this.dOnly(w.opened[Object.keys(w.opened)[0]]) + '. 2 more to read.' : open + ' of 3 opened.';
    const w1 = runs.WEB.st, v1 = runs.VR.st, word = s => s === 'done' ? 'completed' : s === 'prog' ? 'in progress' : 'not started';
    const simD = paused ? 'Not available while your institution’s access is paused. Your progress is kept.' : waiting ? 'Waiting for a licence. Your institution can tell you more.'
      : !w.vrNow ? 'WEB is available to you; VR is not available right now. WEB ' + word(w1) + ' · VR ' + word(v1) + '.'
      : (w1 === 'none' && v1 === 'none' ? 'WEB and VR are available to you. ' : '') + 'WEB ' + word(w1) + ' · VR ' + word(v1) + '. Each format has its own progress.';
    const AS = this.asmtRow(w);
    const asD = a.st === 'none' ? 'Your faculty hasn’t set an assessment for this experiment yet. Nothing to do here yet.' : a.st === 'todo' ? A.name + ' is ready. Due ' + A.deadline + '.'
      : a.st === 'prog' ? 'Attempt ' + a.attempt + ' in progress. Your answers are saved.' : a.st === 'wait' ? 'Submitted ' + a.submitted + ' — waiting for marking.'
      : a.st === 'notrel' ? 'Marked — released after the deadline: ' + A.deadline + '.' : a.st === 'noq' ? 'It can’t be started yet: it has no questions.' : 'Result released ' + this.dOnly(a.released) + '.';
    const st = (n, t, d, label, rt) => Object.assign({ n, t, d, label, hasAct: !!label }, label ? this.L(rt) : {});
    V.steps = [
      st(1, 'Resources', resD, paused || waiting ? '' : 'Open resources', { s: 'hub', exp: 'ste', tab: 'resources' }),
      st(2, 'Simulation', simD, paused || waiting ? '' : (w1 === 'prog' && this.canLaunch(w, 'WEB') ? 'Continue WEB' : 'Choose a format'), w1 === 'prog' && this.canLaunch(w, 'WEB') ? { s: 'web', exp: 'ste' } : { s: 'hub', exp: 'ste', tab: 'simulation' }),
      st(3, 'Assessment', asD, AS.has ? AS.act : '', AS.has ? { s: AS.act === 'Continue attempt' ? 'att' : AS.act === 'Open' ? 'aintro' : 'ares' } : null)
    ];
    return V;
  }
  // ── ST-05 Experiment hub · Overview ──────────────────────────────────────────────────────
  overviewVM(w) {
    const A = Component.ASM, FN = Component.FN, runs = w.runs, a = w.asmt, E = Component.EXP.ste;
    const paused = w.inst === 'paused', waiting = w.grant === 'waiting', held = paused || waiting;
    const nxt = this.nextStep(w), open = Object.keys(w.opened).length;
    const primary = rt => !!(nxt.hasAct && rt && this.path(rt) === nxt.dest);
    // your formats: access in words, your own progress, one action each where one exists
    const firstOpen = nxt.key === 'choose' ? ['WEB', 'VR'].find(f => runs[f].st === 'none' && this.canLaunch(w, f)) : '';
    // a pause or a licence wait holds both formats; the page already says so (pause banner, or the licence status under the title)
    const shared = held;
    const mine = ['WEB', 'VR'].map(f => {
      const c = this.fmtChip(w, f), r = runs[f], fb = w.fb[f], pill = this.runWord(w, f);
      const facts = c.kind !== 'on' && !shared ? this.holdReason(w, f) : c.kind !== 'on' ? (r.st === 'done' ? (fb ? 'Feedback sent ' + this.nbd(this.dOnly(fb.when)) : 'Feedback not given yet') : r.st === 'prog' ? 'Your progress is kept' : '') : r.st === 'done' ? (fb ? 'Feedback sent ' + this.nbd(this.dOnly(fb.when)) : 'Feedback not given yet')
        : r.st === 'prog' ? (f === 'WEB' ? 'Last saved ' : 'Last session reported ') + this.nbd(r.saved) : (f === 'WEB' ? 'Runs in your browser on a laptop or desktop' : 'Needs a supported VR headset');
      let act = null;
      if (c.kind === 'on') {
        const pr = f === 'WEB' ? { s: 'web', exp: 'ste' } : { s: 'fmt', exp: 'ste', fmt: f };
        if (r.st === 'prog') act = [(f === 'WEB' ? 'Continue WEB' : 'Open VR'), pr];
        else if (r.st === 'none') act = ['Open ' + f, pr];
        else if (!fb) act = ['Give feedback on ' + f, { s: 'fb', exp: 'ste', fmt: f }];
      }
      const isNext = !!act && (primary(act[1]) || firstOpen === f);
      return Object.assign(c, { name: FN[f], access: c.kind === 'on' ? 'Available to you' : c.label, pillCls: pill[0], pill: pill[1], facts, hasFacts: !!facts, isNext, cls: 'sv-frow' + (isNext ? ' is-next' : ''),
        hasAct: !!act, act: act ? Object.assign({ label: act[0], aria: act[0] + ', ' + E.t, cls: isNext ? 'rb-btn rb-btn--primary' : 'rb-btn' }, this.L(act[1])) : {} });
    });
    // learning resources
    const resRt = { s: 'hub', exp: 'ste', tab: 'resources' }, resNext = primary(resRt);
    const res = { isNext: resNext, cls: 'sv-sec sv-side-sec' + (resNext ? ' is-next' : ''),
      d: paused ? 'They open again when the pause is lifted.' : waiting ? 'They open when you have a licence.' : open === 0 ? 'None opened yet.' : open + ' of 3 opened.',
      items: Component.RES.map(x => ({ ico: x.ico, t: x.short, s: w.opened[x.id] ? 'Opened ' + this.nbd(this.dOnly(w.opened[x.id])) : 'Not opened yet', sCls: 'sv-rlist-s' + (w.opened[x.id] ? ' is-opened' : '') })),
      hasAct: !held, act: held ? {} : Object.assign({ label: 'Open resources', aria: 'Open resources, ' + E.t, cls: resNext ? 'rb-btn rb-btn--primary sv-side-btn' : 'rb-btn sv-side-btn' }, this.L(resRt)) };
    // assessment
    const AS = this.asmtRow(w);
    const asRt = AS.has ? { s: AS.act === 'Continue attempt' ? 'att' : AS.act === 'Open' ? 'aintro' : 'ares' } : null, asNext = primary(asRt);
    const asD = a.st === 'none' ? 'Your faculty hasn’t set an assessment for this experiment yet.' : a.st === 'todo' ? A.name + ' is ready. Due ' + this.nbd(A.deadline) + '.'
      : a.st === 'prog' ? 'Attempt ' + a.attempt + ' in progress · due ' + this.nbd(A.deadline) + '.' : a.st === 'wait' ? 'Submitted ' + this.nbd(a.submitted) + ' — waiting for marking.'
      : a.st === 'notrel' ? 'Marked — released after the deadline: ' + this.nbd(A.deadline) + '.' : a.st === 'noq' ? 'It can’t be started yet: it has no questions.' : 'Result released ' + this.nbd(this.dOnly(a.released)) + '.';
    const asLabel = AS.act === 'Open' ? 'Open assessment' : AS.act;
    const as = { isNext: asNext, cls: 'sv-sec sv-side-sec' + (asNext ? ' is-next' : ''), d: asD, hasAct: !!AS.has,
      act: AS.has ? Object.assign({ label: asLabel, aria: asLabel + ', ' + A.name, cls: asNext ? 'rb-btn rb-btn--primary sv-side-btn' : 'rb-btn sv-side-btn' }, this.L(asRt)) : {} };
    return { mine, off: this.offFormats(w), res, as };
  }
  // ── ST-06 Resources: a reading list; a pause or a licence wait is said once, not on every row ────────
  resVM(w, u) {
    const paused = w.inst === 'paused', waiting = w.grant === 'waiting', held = paused || waiting, open = Object.keys(w.opened).length;
    const V = { note: u.data === 'ok' ? '3 resources · each opens in a new tab' : 'Each resource opens in a new tab', has: false, none: false, loading: u.data === 'loading', failed: u.data === 'failed',
      retry: () => this.apply({ ui: { data: 'ok' }, focus: 'st-res-h' }), rows: [], held, heldText: paused ? 'They can’t be opened while your institution’s access is paused.' : waiting ? 'They open when you have a licence.' : '',
      openedText: open === 0 ? 'None opened yet' : open >= 3 ? 'All 3 opened' : open + ' of 3 opened' };
    if (V.loading || V.failed) return V;
    V.rows = Component.RES.map(r => {
      const opened = w.opened[r.id], busy = u.resBusy === r.id, failed = !!u.resFail[r.id] && !busy;
      return Object.assign({}, r, { stId: 'st-res-st-' + r.id, isNot: !opened && !busy && !failed, isOpened: !!opened && !busy && !failed, isBusy: busy, isFailed: failed,
        openedText: 'Opened ' + this.nbd(opened || ''), canOpen: !held, btn: failed ? 'Try again' : 'Open', aria: (failed ? 'Try opening ' : 'Open ') + r.t + ' in a new tab', open: () => this.openRes(r) });
    });
    V.has = V.rows.length > 0;
    return V;
  }
  // ── ST-07 Simulation: choose a format. Launchable formats as cards (what you need, your progress, one action);
  //    formats that aren't yours as compact rows with the reason. Actions and the one primary come from fmtRows (unchanged rule).
  simVM(w) {
    const FN = Component.FN, rows = this.fmtRows(w, 'sim'), nxt = this.nextStep(w), paused = w.inst === 'paused', waiting = w.grant === 'waiting', shared = paused || waiting;
    const devNow = w.dev.stage === 'appr' ? w.dev.newDev : w.dev.dev;
    const need = { WEB: 'Runs in your browser on a laptop or desktop. This page keeps your place between visits.', VR: 'Runs on your authorised VR headset, not in this browser. Sessions are reported here.' };
    const cards = ['WEB', 'VR'].map(f => {
      const row = rows.find(x => x.code === f), c = this.fmtChip(w, f), r = w.runs[f], fb = w.fb[f], pill = this.runWord(w, f), facts = [];
      if (f === 'WEB') {
        if (r.st === 'prog' && r.saved) facts.push('Last saved ' + this.nbd(r.saved));
        if (r.st === 'done') facts.push((r.by === 'platform' ? 'Recorded by the platform at ' : 'Reported by the simulation at ') + this.tOnly(r.done));
        if (r.st === 'none') facts.push('Not opened yet');
      } else {
        if (r.st === 'prog') facts.push('Last session reported ' + this.nbd(r.saved));
        if (r.st === 'done') facts.push('Reported from the headset at ' + this.tOnly(r.done));
        if (r.st === 'none') facts.push('No headset session reported yet');
      }
      if (r.st === 'done') facts.push(fb ? 'Feedback sent ' + this.nbd(this.dOnly(fb.when)) : 'Feedback not given yet');
      const why = c.kind === 'held' && !shared ? this.holdReason(w, f) : '';
      const acts = row.acts.map(a => Object.assign({}, a, { label: a.kind === 'view' ? 'Open ' + f : a.label }));
      // the "Next step" tag only where this card's action is the experiment's next step (same rule as Home and Overview)
      const isNext = !!nxt.hasAct && acts.some(a => '#' + nxt.dest === a.href);
      return Object.assign(c, { name: FN[f], need: need[f], hasDevice: f === 'VR' && c.kind === 'on' && !!devNow, device: devNow || '', pillCls: pill[0], pill: pill[1],
        access: c.kind === 'on' ? 'Available to you' : c.label, facts, hasFacts: facts.length > 0, why, hasWhy: !!why, acts, hasActs: acts.length > 0, isNext,
        cls: 'sv-card sv-fcard' + (isNext ? ' is-next' : ''), hasStages: f === 'WEB' && r.st === 'prog', stages: f === 'WEB' && r.st === 'prog' ? this.webStages(w, false) : [], hid: 'st-fc-' + f.toLowerCase() });
    });
    // the chooser's note says a shared hold once (the baseline repeated it on every row, with the access-plan reference)
    const note = w.grant === 'waiting' && w.inst !== 'paused' ? 'No licence is available for you right now.' : 'Formats come from your institution’s access. Each one has its own progress.';
    return { cards, off: this.offFormats(w), note };
  }
  // ── ST-10 Progress for this experiment: the same rows as ST-15, scoped to this experiment ─────────────
  // the grant line carries no record identifier on either tab (owner decision: internal identifiers stay out of Student labels);
  // the hub header already says “Your institution can tell you more.”, so the tab's licence note stops at the reason
  progTabVM(w) { const exp = this.progExp(w, 'all', 'st-pt'); if (exp.note && exp.note.d) exp.note.d = exp.note.d.replace(' Your institution can tell you more.', ''); return { exp }; }
  // ── the hub's Assessment tab: the deadline as a date block, the key facts, the state and one action ─────────
  asmtTabVM(w) {
    const A = Component.ASM, AS = this.asmtRow(w), a = w.asmt;
    if (!AS.has) return { none: true, has: false, when: {}, act: {} };
    const label = { Open: 'Open assessment', View: 'View' }[AS.act] || AS.act;
    const out = { none: false, has: true, name: A.name, desc: A.desc, when: this.whenOf(w, A.deadline), whenK: a.st === 'todo' || a.st === 'prog' || a.st === 'noq' ? 'Due' : 'Deadline',
      facts: '4 questions · ' + A.total + ' marks · pass mark ' + A.passpct + ' · ' + A.attempts + ' attempts · no time limit', pillCls: AS.pillCls, pill: AS.pill,
      state: { todo: '', noq: 'It has no questions yet', prog: 'Your answers are saved', wait: 'Submitted ' + this.nbd(a.submitted) + ' · your faculty marks written answers', notrel: 'Marked · released after the deadline', ready: 'Released ' + this.nbd(a.released) }[a.st] || '',
      act: Object.assign({ label, cls: AS.btnCls, aria: label + ', ' + A.name }, { href: AS.href, go: AS.go }) };
    out.hasState = !!out.state;
    return out;
  }
