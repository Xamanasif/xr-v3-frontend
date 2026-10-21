  fpageVM(w, f, u) {
    const E = Component.EXP.ste, r = w.runs[f], pill = this.runPill(w, f), fb = w.fb[f];
    const paused = w.inst === 'paused', waiting = w.grant === 'waiting', notNow = f === 'VR' && !w.vrNow;
    const V = { code: f, exp: E.t, crumbExp: this.L({ s: 'hub', exp: 'ste', tab: 'overview' }), crumbSim: this.L({ s: 'hub', exp: 'ste', tab: 'simulation' }),
      title: f === 'WEB' ? 'WEB simulation' : 'VR on your headset', pillCls: pill[0], pill: pill[1], meta: '', h2: '', d: '', fail: false, hasGo: false, goIsBtn: false, goIsLink: false,
      goLabel: '', goLink: {}, launch: () => this.launchWeb(), busy: false, busyAria: 'false', hint: '', hasHint: false, hasSecond: false, second: {}, hasDevice: false, hasSetup: false, setup: [],
      report: this.L({ s: 'helpform' }, { ui: { help: { what: '', where: E.t + ' · ' + (f === 'WEB' ? 'WEB simulation' : 'VR'), err: false, busy: false } } }), about: [] };
    const doneT = r.done ? this.tOnly(r.done) : '';
    if (f === 'WEB') {
      V.meta = r.st === 'prog' ? 'Last saved ' + this.nbd(r.saved) : r.st === 'done' ? (r.by === 'platform' ? 'Recorded by the platform at ' + doneT : 'Reported by the simulation at ' + doneT) : '';
      V.about = [{ k: 'Needs', v: 'A laptop or desktop with a current web browser' }, { k: 'In this prototype', v: 'A simulated sample activity stands in for the real simulation.' }, { k: 'Completed means', v: 'The simulation reports that you finished and the platform records it. You can’t mark it yourself.' }];
      if (paused) { V.h2 = 'You can’t open the simulation right now'; V.d = r.st === 'done' ? 'WEB stays completed. You can open it again when access resumes.' : r.st === 'prog' ? 'Your place is kept. You can continue when access resumes.' : 'You can start WEB when access resumes.'; }
      else if (waiting) { V.h2 = 'Not available to you yet'; V.d = 'No licence is available for you right now. Your institution can tell you more.'; }
      else if (r.st === 'done') {
        V.h2 = 'You’ve completed WEB';
        if (fb) { V.d = 'Thank you — your feedback on WEB is recorded.'; V.hasSecond = true; V.second = Object.assign({ label: 'See your feedback' }, this.L({ s: 'fb', exp: 'ste', fmt: 'WEB' })); }
        else { V.d = 'Tell us how this format worked for you. It takes about two minutes.'; V.hasGo = true; V.goIsLink = true; V.goLabel = 'Give feedback on WEB'; V.goLink = this.L({ s: 'fb', exp: 'ste', fmt: 'WEB' }); }
      } else {
        const busy = u.launch === 'busy', fail = u.launch === 'fail';
        V.h2 = r.st === 'prog' ? 'Continue where you left off' : 'Start the WEB simulation';
        V.d = r.st === 'prog' ? 'You’ve finished stage ' + (r.stage || 0) + ' of 3. Your place is kept, so you carry on from stage ' + Math.min((r.stage || 0) + 1, 3) + '.' : 'The sample activity has three stages. Your place is saved after each one, so you can leave and come back.';
        V.fail = fail; V.hasGo = true; V.goIsBtn = true; V.busy = busy; V.busyAria = busy ? 'true' : 'false';
        V.goLabel = busy ? 'Opening the simulation…' : fail ? 'Try again' : r.st === 'prog' ? 'Continue WEB' : 'Launch WEB';
        V.hasHint = true; V.hint = 'Opens the simulated sample activity. Opening it doesn’t complete WEB.';
      }
    } else {
      const devNow = w.dev.stage === 'appr' ? w.dev.newDev : w.dev.dev;
      V.meta = r.st === 'prog' ? 'Last session reported ' + this.nbd(r.saved) : r.st === 'done' ? 'Reported from the headset at ' + doneT : '';
      V.about = [{ k: 'Runs on', v: 'Your authorised VR headset, not in this browser' }, { k: 'This page shows', v: 'Only what the headset reports' }, { k: 'Completed means', v: 'The headset reports that you finished. You can’t mark it yourself.' }];
      V.hasDevice = !!devNow && !paused && !waiting; V.device = devNow; V.devLink = this.L({ s: 'dev' });
      if (paused) { V.h2 = 'You can’t use VR right now'; V.d = r.st === 'done' ? 'VR stays completed. You can use it again when access resumes.' : r.st === 'prog' ? 'Your progress is kept. You can continue when access resumes.' : 'You can start VR when access resumes.'; }
      else if (waiting) { V.h2 = 'Not available to you yet'; V.d = 'No licence is available for you right now. Your institution can tell you more.'; }
      else if (notNow) { V.h2 = 'VR isn’t available right now'; V.d = 'VR can’t be used at the moment. WEB still opens, and your VR progress is kept.'; }
      else if (r.st === 'done') {
        V.h2 = 'You’ve completed VR';
        if (fb) { V.d = 'Thank you — your feedback on VR is recorded.'; V.hasSecond = true; V.second = Object.assign({ label: 'See your feedback' }, this.L({ s: 'fb', exp: 'ste', fmt: 'VR' })); }
        else { V.d = 'Tell us how this format worked for you.'; V.hasGo = true; V.goIsLink = true; V.goLabel = 'Give feedback on VR'; V.goLink = this.L({ s: 'fb', exp: 'ste', fmt: 'VR' }); }
      } else {
        V.h2 = r.st === 'prog' ? 'Continue on your headset' : 'Set up VR';
        V.d = r.st === 'prog' ? 'Pick up where you left off on the headset. This page updates when the headset reports a session.' : 'Nothing has been reported from a headset yet. Follow the setup steps to start.';
        V.hasSetup = true;
        const open = u.setup === null ? r.st === 'none' : !!u.setup;
        V.setupOpen = open; V.setupExp = open ? 'true' : 'false'; V.setupCtl = open ? 'st-setup' : undefined; V.setupLabel = open ? 'Hide setup steps' : 'View setup steps';
        V.toggleSetup = () => this.apply({ ui: { setup: !open } });
        V.setup = [{ n: 1, t: 'Use your authorised VR headset.', d: 'It is shown under My device, in your account menu.' }, { n: 2, t: 'Open the ' + E.t + ' app on the headset.', d: 'If you can’t find it, contact your institution administrator.' },
          { n: 3, t: 'Work through the experiment on the headset.', d: 'Your sessions are reported here, so this page shows where you are.' }, { n: 4, t: 'When the headset reports that you’ve finished, this page shows “Completed”.', d: 'You can then give feedback on VR.' }];
      }
    }
    // when the format is held, the pill says why; the meta keeps the student's own progress visible
    if ((paused || waiting || notNow) && r.st === 'done') V.meta = 'Completed ' + this.nbd(this.dOnly(r.done));
    else if ((paused || waiting || notNow) && r.st === 'prog') V.meta = (f === 'WEB' ? 'In progress · last saved ' : 'In progress · last session reported ') + this.nbd(r.saved);
    V.hasMeta = !!V.meta;
    // the compact chip in the header, and the sample activity's real stages on the WEB page
    V.chip = this.fmtChip(w, f); V.isWeb = f === 'WEB';
    V.hasStages = f === 'WEB' && (r.st === 'prog' || r.st === 'done') && !paused && !waiting; V.stages = V.hasStages ? this.webStages(w, false) : [];
    V.hasAbout = V.about.length > 0;
    return V;
  }
  actVM(w, u) {
    const r = w.runs.WEB, n = r.stage || 0, done = r.st === 'done', busy = !!u.actBusy;
    const stages = this.webStages(w, true);
    const cur = Math.min(n + 1, 3);
    return { exit: this.L({ s: 'web', exp: 'ste' }), stages, working: !done, complete: done,
      sub: done ? 'A local sample stood in for the WEB simulation. All three stages are finished.' : 'A local sample stands in for the WEB simulation. Finish each stage to move on. WEB is recorded as completed only after the last stage — opening this page doesn’t complete it.',
      stageTitle: 'Sample stage ' + cur + ' of 3',
      stageText: cur < 3 ? 'This stage stands in for part of the WEB simulation. Finishing it saves your place; it doesn’t complete WEB.' : 'This is the last stage. When you finish it, the activity reports that you finished and the platform records WEB as completed.',
      finishLabel: busy ? 'Saving…' : cur < 3 ? 'Finish stage ' + cur : 'Finish the activity', finish: () => this.finishStage(cur), busy, busyAria: busy ? 'true' : 'false',
      saveCls: 'st-save' + (busy ? '' : ' st-save--ok'), saveIco: busy ? 'sti-clock' : 'sti-check', saveText: busy ? 'Saving…' : (r.saved ? 'Saved ' + this.tOnly(r.saved) : 'Nothing saved yet'),
      doneLabel: 'Completed ' + this.dOnly(r.done), doneText: (r.by === 'platform' ? 'Recorded by the platform on ' + r.done + ', after the activity’s last stage.' : 'Reported by the simulation on ' + r.done + '.') + (w.fb.WEB ? ' Your feedback on WEB is sent.' : ' You can now give feedback on WEB.') + ' Your VR progress is separate.',
      canFb: !w.fb.WEB, fb: this.L({ s: 'fb', exp: 'ste', fmt: 'WEB' }) };
  }
