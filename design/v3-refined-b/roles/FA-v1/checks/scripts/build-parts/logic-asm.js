  /* ══════════ Final: one assessment summary for an experiment (FA-03 panel · FA-05 panel) ══════════ */
  asmSum(e) {
    const W = this.W, a = this.asmOf(e.id), st = this.asmState(a), ss = this.stuOf(e.id), own = this.own(a);
    const cfg = a ? this.cur(a) : null, iso = cfg ? this.parseWhen(cfg.dl) : null, ready1 = !!a && this.isReady(a);
    const days = iso ? Math.round((this.utc(iso) - this.utc(W.clock.iso)) / 86400000) : 0, past = !!iso && this.nowIso() > iso;
    const atts = a ? this.attsOf(a.id) : [], subs = atts.filter(t => t.submitted);
    const waitL = own ? atts.filter(t => this.waiting(t)).sort((x, y) => String(x.subIso).localeCompare(String(y.subIso))) : [];
    const su = this.unitsOf(ss.map(s => subs.some(t => t.st === s.id) ? 'is-sub' : '').sort((x, y) => (y ? 1 : 0) - (x ? 1 : 0)));
    const note = !a ? '' : !own ? 'Created by ' + this.person(a.by).name + '.' : !ready1 ? (cfg.qs.length ? 'Rules not finished' : 'No questions yet') + ' · students can’t see it yet.' : '';
    return {
      stCls: st.cls, stLabel: this.stLabelOf(st).replace(/^Assessment /, '').replace(/^ready$/, 'Ready').replace(/^in draft$/, 'Draft — not ready'),
      hasAsm: !!a, noAsm: !a, asmName: a ? (a.name || 'Untitled draft') : '',
      dueLine: !cfg || !cfg.dl ? 'No deadline set yet' : past ? 'Deadline passed: ' + cfg.dl : 'Due ' + cfg.dl, hasLeft: !!iso && !past && ready1, left: days === 0 ? 'today' : this.plural(days, 'day') + ' left',
      showSubs: !!a && own && ready1 && ss.length > 0, subsUnits: su.units, subsCls: su.cls, subsLine: subs.length + ' of ' + this.plural(ss.length, 'student') + ' submitted',
      hasWait: waitL.length > 0, waitLine: this.plural(waitL.length, 'written answer') + ' waiting for marking',
      hasNote: !!note, note,
      canMark: waitL.length > 0, markLabel: 'Mark ' + this.plural(waitL.length, 'written answer'), markAria: 'Mark ' + this.plural(waitL.length, 'written answer') + ' for ' + (a ? a.name : ''), mark: waitL.length ? this.link({ s: 'FA-19', att: waitL[0].id }) : null,
      asmAct: a ? (ready1 ? 'Open assessment' : 'Continue setting up') : '', goAsm: a ? this.link({ s: 'FA-08', a: a.id }) : null,
      create: ev => { if (ev && ev.preventDefault) ev.preventDefault(); this.startCreate(e.id); }
    };
  }
  /* type tag for a question type (written answers are the ones you mark) */
  typeCls(type) { return 'fr-qtype' + (type === 'w' ? ' fr-qtype--w' : ''); }

  /* ══════════ FA-03 Course (R1 layout · assessment summary shared with FA-05) ══════════ */
  vmCourse() {
    const c = this.course(this.R.c);
    if (!c) return null;
    const W = this.W, exps = c.exps.map(id => this.expo(id));
    const n = new Set(); exps.forEach(e => this.stuOf(e.id).forEach(s => n.add(s.id)));
    const asms = exps.map(e => this.asmOf(e.id)).filter(Boolean), ready = asms.filter(a => this.isReady(a)).length;
    return { code: c.code, t: c.t, src: 'Assigned to you by your Institute Admin in Faculty courses.',
      f1: String(exps.length), f1l: exps.length === 1 ? 'Experiment your institution holds' : 'Experiments your institution holds',
      f2: String(n.size), f2l: 'Students with access',
      f3: String(ready), f3l: ready === 1 ? 'Assessment ready' : 'Assessments ready',
      m1: this.plural(exps.length, 'experiment') + ' in your institution’s access', m2: n.size ? this.plural(n.size, 'student') + ' with access' : 'No students with access yet',
      exps: exps.map(e => {
        const ss = this.stuOf(e.id);
        return Object.assign({ t: e.t, hid: 'fa-c1-' + e.id, actH: 'fa-c1-act-' + e.id, asmH: 'fa-c1-asm-' + e.id, about: e.about,
          fm: e.held, fmAria: 'Formats your institution has: ' + e.held.join(', '), asOf: 'As of ' + W.clock.day, actAria: 'Student activity by format for ' + e.t,
          prog: ss.length ? this.fmProg(e.id) : [], hasStu: ss.length > 0, noStu: !ss.length, reach: this.plural(ss.length, 'student') + ' with access',
          openAria: 'Open experiment ' + e.t, go: this.link({ s: 'FA-05', e: e.id }),
          goStu: ev => { if (ev && ev.preventDefault) ev.preventDefault(); this.U.sl = Object.assign(this.slUi(), { exp: e.id }); this.go({ s: 'FA-20' }); } }, this.asmSum(e));
      }) };
  }

  /* ══════════ FA-05 Experiment (final: identity band · activity · about · assessment panel) ══════════ */
  vmExperiment() {
    const e = this.expo(this.R.e);
    if (!e) return null;
    const c = this.course(e.crs), ss = this.stuOf(e.id), used = this.usedFormats(e.id), W = this.W;
    return Object.assign({
      t: e.t, code: c.code, kicker: 'Experiment you teach · ' + c.t, ctx: c.code + ' · ' + c.t, goCourse: this.link({ s: 'FA-03', c: c.id }),
      fm: e.held, fmAria: 'Formats your institution has: ' + e.held.join(', '),
      used, hasUsed: used.length > 0, noUsed: !used.length, usedAria: 'Formats used by your students: ' + (used.join(', ') || 'none yet'), usedCls: used.length ? '' : 'is-quiet',
      reach: ss.length ? String(ss.length) : 'None yet',
      asOf: 'As of ' + W.clock.day, progAria: 'Student activity by format for ' + e.t + ', as of ' + W.clock.day, prog: ss.length ? this.fmProg(e.id) : [],
      hasStu: ss.length > 0, noStu: !ss.length,
      reachLine: ss.length ? this.plural(ss.length, 'student has', 'students have') + ' this experiment from your institution.' : 'No students have this experiment yet. They appear when your Institute Admin gives them access.',
      goStu: ev => { if (ev && ev.preventDefault) ev.preventDefault(); this.U.sl = Object.assign(this.slUi(), { exp: e.id }); this.go({ s: 'FA-20' }); },
      about: e.about, outcomes: e.outcomes, res: e.resources.map(r => r.t)
    }, this.asmSum(e));
  }

