  // ── ST-01 Home ───────────────────────────────────────────────────────────────────────────
  homeVM(w) {
    const P = this.person(w), E = Component.EXP.ste, C = Component.CRS, A = Component.ASM, runs = w.runs, a = w.asmt, FN = Component.FN;
    const H = { first: P.first, msg: { show: false, hasAct: false, act: { label: '', href: '', go: null }, how: false, steps: [] }, cover: { show: false, step: { act: {} }, course: {}, open: {}, outcomes: [] }, also: { h: '', items: [] } };
    const help = Object.assign({ label: 'Help & support' }, this.L({ s: 'help' }));
    if (w.acct === 'inactive') {
      // the page banner already names the inactive account and links to Help & support
      H.msg = { show: true, ico: 'sti-user', icoCls: 'sv-msg-ico sv-msg-ico--paused', t: 'You can’t open experiments right now', d: 'Your work is kept and will be here when your account is reactivated.', hasAct: false, act: { label: '', href: '', go: null }, how: false, steps: [] };
      return H;
    }
    if (w.grant === 'none') {
      H.msg = { show: true, ico: 'sti-book', icoCls: 'sv-msg-ico', t: 'Your institution hasn’t given you access yet', d: 'When it gives you an experiment, it appears here and in My courses.', hasAct: true, act: help, how: true,
        steps: [{ n: 1, t: 'Your institution gives you an experiment, with the formats you can use.' }, { n: 2, t: 'Read its resources, then run a simulation. Nothing is locked.' }, { n: 3, t: 'Answer the assessment when your faculty sets one.' }] };
      return H;
    }
    const paused = w.inst === 'paused', waiting = w.grant === 'waiting', ended = w.grant === 'ended', gone = w.grant === 'withdrawn';
    const nxt = this.nextStep(w), open = Object.keys(w.opened).length, started = ['WEB', 'VR'].some(f => runs[f].st !== 'none');
    const canOpen = !paused && !ended && !gone, link = canOpen;
    const k = ended || gone ? 'Your earlier work' : paused || waiting || nxt.key === 'none' ? 'Your experiment' : !started && !open ? 'Start here' : 'Continue learning';
    const resV = open === 0 ? (ended || gone ? 'None opened' : 'None opened yet · 3 to read') : open >= 3 ? 'All 3 opened' : open + ' of 3 opened';
    // the one thing to do now (or why nothing can be done)
    const badge = (o, f, ico) => Object.assign(o, f ? Object.assign({ isFmt: true, isIco: false, fmt: f }, (c => ({ fmtCls: c.fmtCls, glyph: c.glyph, hasGlyph: c.hasGlyph }))(this.fmtChip(w, f))) : { isFmt: false, isIco: true, ico, fmt: '', fmtCls: '', glyph: '', hasGlyph: false });
    const btn = (label, rt, cls) => Object.assign({ label, aria: label + ', ' + E.t, cls }, this.L(rt));
    let step;
    // the page banner already says the access is paused and links to Help & support, so the step does not repeat either
    if (paused) step = badge({ cls: 'sv-step sv-step--held', hasK: false, t: 'You can’t open experiments right now', d: 'You can carry on from where you left off when the pause is lifted.', hasAct: false, act: {} }, '', 'sti-pause');
    else if (waiting) step = badge({ cls: 'sv-step sv-step--held', hasK: false, t: 'You’re waiting for a licence', d: 'No licence is available for you right now. Your institution can tell you more.', hasAct: false, act: {} }, '', 'sti-clock');
    else if (ended) step = badge({ cls: 'sv-step sv-step--off', hasK: false, t: 'Your access ended on ' + this.nbd(w.endedOn), d: 'Your earlier work is kept. You can still look back at it.', hasAct: true, act: btn('See earlier work', { s: 'courses', tab: 'courses' }, 'rb-btn') }, '', 'sti-ended');
    else if (gone) step = badge({ cls: 'sv-step sv-step--off', hasK: false, t: 'It’s no longer given to you', d: 'Your institution withdrew it. Your work is kept, and you can look back at it.', hasAct: true, act: btn('See earlier work', { s: 'courses', tab: 'courses' }, 'rb-btn') }, '', 'sti-ended');
    else if (nxt.hasAct) step = badge({ cls: 'sv-step is-next', hasK: true, t: nxt.t, d: nxt.key === 'res' ? '3 resources · none opened yet' : nxt.d, hasAct: true,
      act: { label: nxt.label, aria: nxt.label + ', ' + E.t, cls: 'rb-btn rb-btn--primary rb-btn--lg', href: nxt.href, go: nxt.go } }, nxt.fmt, nxt.stage === 1 ? 'sti-res' : nxt.stage === 3 ? 'sti-clip' : 'sti-sim');
    else step = badge({ cls: 'sv-step', hasK: false, t: 'Nothing else is waiting for you right now', d: 'Your work on each format is kept in Progress.', hasAct: false, act: {} }, '', 'sti-bars');
    // where the student left off: the sample activity's real stages, and the saved time without repeating "in progress"
    step.hasStages = nxt.key === 'prog-WEB'; step.stages = step.hasStages ? this.webStages(w, false) : [];
    if (step.hasStages) step.d = 'Last saved ' + this.nbd(runs.WEB.saved) + '. Your place is kept.';
    step.hasD = !!step.d; step.showAct = step.hasAct || canOpen;
    H.cover = { show: true, k, code: C.own, canCourse: this.current(w), noCourse: !this.current(w), course: Object.assign({ t: C.name, aria: C.name + ', open course' }, this.L({ s: 'course' })),
      canOpen, open: Object.assign({ aria: 'Open experiment, ' + E.t }, this.L({ s: 'hub', exp: 'ste', tab: 'overview' })), t: E.t, d: E.desc, step, outcomes: E.outcomes };
    // the rest of the experiment, quietly: everything except what the next step already covers
    const items = [];
    const item = (o, rt) => Object.assign({ isLink: link && !!rt, isStatic: !(link && rt), href: '', go: null, isFmt: false, isIco: false, fmt: '', fmtCls: '', glyph: '', hasGlyph: false, ico: '' }, o, link && rt ? this.L(rt) : {});
    if (nxt.key !== 'res') items.push(item({ isIco: true, ico: 'sti-res', label: 'Resources', v: resV }, { s: 'hub', exp: 'ste', tab: 'resources' }));
    ['WEB', 'VR'].forEach(f => {
      if (nxt.fmt === f) return;
      const c = this.fmtChip(w, f), r = runs[f], fb = w.fb[f];
      const run = r.st === 'done' ? 'Completed ' + this.nbd(this.dOnly(r.done)) + (fb ? ' · feedback sent' : ' · feedback to give') : r.st === 'prog' ? 'In progress' + (r.saved ? ' · ' + (f === 'WEB' ? 'saved ' : 'last session ') + this.nbd(this.dOnly(r.saved)) : '') : 'Not started';
      const v = c.kind === 'on' ? run : c.label + (r.st === 'none' ? '' : ' · ' + run.charAt(0).toLowerCase() + run.slice(1));
      items.push(item({ isFmt: true, fmt: f, fmtCls: c.fmtCls, glyph: c.glyph, hasGlyph: c.hasGlyph, label: FN[f], v }, f === 'WEB' ? { s: 'web', exp: 'ste' } : { s: 'fmt', exp: 'ste', fmt: f }));
    });
    if (nxt.stage !== 3) {
      const asV = { none: 'Not set by your faculty yet', todo: 'Ready · due ' + this.nbd(A.deadline), noq: 'Can’t be started yet', prog: 'Attempt in progress · answers saved', wait: 'Submitted · waiting for marking', notrel: 'Result not released yet', ready: 'Result released ' + this.nbd(this.dOnly(a.released)) }[a.st] || '';
      items.push(item({ isIco: true, ico: 'sti-clip', label: 'Assessment', v: asV }, a.st === 'none' ? null : { s: 'hub', exp: 'ste', tab: 'assessment' }));
    }
    H.also = { h: nxt.hasAct ? 'Also in this experiment' : 'In this experiment', items };
    return H;
  }

