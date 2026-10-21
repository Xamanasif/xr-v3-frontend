  // ── shared helpers ───────────────────────────────────────
  // One next-step rule for Home and the hub (same decisions, labels and destinations as hubVM).
  nextStep(w) {
    const runs = w.runs, a = w.asmt, A = Component.ASM, open = Object.keys(w.opened).length;
    const nx = (key, stage, fmt, t, d, label, rt) => ({ show: true, key, stage, fmt, t, d, hasD: !!d, label, hasAct: !!label, dest: rt ? this.path(rt) : '', href: rt ? '#' + this.path(rt) : '', go: rt ? this.L(rt).go : null });
    if (w.acct !== 'active' || w.grant !== 'active' || w.inst === 'paused') return { show: false, key: '', stage: 0, fmt: '', hasAct: false, dest: '' };
    const prog = ['WEB', 'VR'].find(f => runs[f].st === 'prog' && this.canLaunch(w, f));
    const fbDue = ['WEB', 'VR'].find(f => runs[f].st === 'done' && !w.fb[f]);
    const notStarted = ['WEB', 'VR'].find(f => runs[f].st === 'none' && this.canLaunch(w, f));
    const nothing = ['WEB', 'VR'].every(f => runs[f].st === 'none');
    if (prog === 'WEB') return nx('prog-WEB', 2, 'WEB', 'Continue in your browser', 'WEB is in progress. Last saved ' + this.nbd(runs.WEB.saved) + '.', 'Continue WEB', { s: 'web', exp: 'ste' });
    if (prog === 'VR') return nx('prog-VR', 2, 'VR', 'Continue on your headset', 'VR is in progress. Last session reported ' + this.nbd(runs.VR.saved) + '.', 'Open VR', { s: 'fmt', exp: 'ste', fmt: 'VR' });
    if (fbDue) return nx('fb-' + fbDue, 2, fbDue, 'Feedback on ' + fbDue + ' is open', 'You completed ' + fbDue + ' on ' + this.nbd(this.dOnly(runs[fbDue].done)) + '.', 'Give feedback on ' + fbDue, { s: 'fb', exp: 'ste', fmt: fbDue });
    if (nothing && !open) return nx('res', 1, '', 'Start with the resources', '', 'Open resources', { s: 'hub', exp: 'ste', tab: 'resources' });
    if (nothing) return nx('choose', 2, '', 'Run a simulation', 'Each format has its own progress.', 'Choose a format', { s: 'hub', exp: 'ste', tab: 'simulation' });
    if (a.st === 'todo') return nx('asmt-todo', 3, '', 'Start the assessment', A.name + ' is due ' + this.nbd(A.deadline) + '.', 'Open assessment', { s: 'aintro' });
    if (a.st === 'prog') return nx('asmt-prog', 3, '', 'Finish your attempt', 'Your answers are saved.', 'Continue attempt', { s: 'att' });
    if (notStarted) return nx('setup-' + notStarted, 2, notStarted, 'Set up ' + notStarted, notStarted + ' is waiting for you.', 'Open ' + notStarted, notStarted === 'WEB' ? { s: 'web', exp: 'ste' } : { s: 'fmt', exp: 'ste', fmt: notStarted });
    return nx('none', 0, '', 'Nothing else to do here right now', 'Your work on each format is in the Progress tab.', '', null);
  }
  // Keep a date and time on one line when a sentence wraps (display only; the sample facts are unchanged).
  nbd(s) { return String(s == null ? '' : s).replace(/ /g, '\u00a0'); }
  // Compact format indicator: solid = available to you, dashed = published but not in your institution's access,
  // flat grey = not published, outlined = given to you but held, grey outline = access ended. Words always accompany it.
  fmtChip(w, f) {
    const av = this.avail(w, f);
    const m = { on: ['xr-fmt sv-fmt sv-fmt--on', 'sti-check'], pub: ['xr-fmt sv-fmt xr-fmt--pub', ''], none: ['xr-fmt sv-fmt xr-fmt--none', ''], held: ['xr-fmt sv-fmt sv-fmt--held', av.glyph || ''], ended: ['xr-fmt sv-fmt sv-fmt--ended', 'sti-dash'] }[av.kind];
    return { code: f, fmtCls: m[0], glyph: m[1], hasGlyph: !!m[1], kind: av.kind, label: av.label };
  }
  runWord(w, f) {
    const r = w.runs[f];
    return r.st === 'done' ? ['xr-st xr-st--ok', 'Completed ' + this.dOnly(r.done)] : r.st === 'prog' ? ['xr-st xr-st--warn', 'In progress'] : ['xr-st', 'Not started'];
  }
  offFormats(w) {
    return ['AR', 'MR'].map(f => Object.assign(this.fmtChip(w, f), { name: Component.FN[f], reason: f === 'AR' ? 'Published for this experiment, not included in your institution’s access' : 'Not published for this experiment' }));
  }
  holdReason(w, f) {
    if (w.inst === 'paused') return 'Your institution’s access is paused. Your progress is kept.';
    if (w.grant === 'waiting') return 'No licence is available for you right now. Your institution can tell you more.';
    if (f === 'VR' && !w.vrNow) return 'VR can’t be used at the moment. WEB still opens.';
    return '';
  }

  // ── shared helpers (presentation only) ───────────────────────────────────────────────────
  // The sample activity's three stages as recorded (stage = number of stages finished); never inferred from time.
  // `active` marks the next stage as "Now" on the activity page even before the first stage is finished.
  webStages(w, active) {
    const r = w.runs.WEB, n = r.stage || 0, done = r.st === 'done';
    return [1, 2, 3].map(i => {
      const fin = done || i <= n, now = !fin && i === n + 1 && (active || r.st === 'prog');
      return { k: 'Stage ' + i, s: fin ? 'Finished' : now ? 'Now' : 'Not yet', done: fin, cls: fin ? 'is-done' : now ? 'is-now' : '', aria: 'Stage ' + i + ' of 3, ' + (fin ? 'finished' : now ? 'current' : 'not yet') };
    });
  }
  // A format in list rows: the compact chip plus one line of words — access first when held or ended, then your own progress.
  fmtStatus(w, f) {
    const c = this.fmtChip(w, f), r = w.runs[f];
    const run = r.st === 'done' ? 'completed ' + this.nbd(this.dOnly(r.done)) : r.st === 'prog' ? 'in progress' + (r.saved ? ' · ' + (f === 'WEB' ? 'saved ' : 'last session ') + this.nbd(this.dOnly(r.saved)) : '') : 'not started';
    const text = c.kind === 'held' || c.kind === 'ended' ? c.label + (r.st === 'none' ? '' : ' · ' + run) : run.charAt(0).toUpperCase() + run.slice(1);
    return Object.assign(c, { name: Component.FN[f], text, aria: Component.FN[f] + ' (' + f + '): ' + text.replace(/ /g, ' ') });
  }
  // Day numbers for 'd Mon yyyy[, hh:mm]' facts and the scenario date (display only; nothing is scheduled from these).
  dayNum(s) { const m = String(s || '').match(/(\d{1,2}) (\w{3}) (\d{4})/); return m ? Date.UTC(Number(m[3]), Component.MS.indexOf(m[2]), Number(m[1])) / 864e5 : null; }
  // Date block for a deadline or event: "14 Nov" + "23:59 · in 13 days". Ivory only when it is due within two days.
  whenOf(w, s) {
    const d = this.dayNum(s), today = this.dayNum(w.date), m = String(s || '').match(/(\d{1,2} \w{3})/), t = this.tOnly(s);
    const diff = d === null || today === null ? null : d - today;
    const rel = diff === null ? '' : diff === 0 ? 'today' : diff === 1 ? 'tomorrow' : diff > 1 ? 'in ' + diff + ' days' : diff === -1 ? 'yesterday' : (-diff) + ' days ago';
    const soon = diff !== null && diff >= 0 && diff <= 2;
    return { d: m ? m[1] : String(s || ''), t: [t, rel].filter(Boolean).join(' · '), rel, cls: 'sv-when' + (soon ? ' sv-when--soon' : ''), soon };
  }
