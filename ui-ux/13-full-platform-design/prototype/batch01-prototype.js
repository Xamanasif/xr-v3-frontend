/* ============================================================
   XR Simulation Learning Platform — Batch 01 interactive prototype
   Plain JavaScript. No framework, no backend, no real upload,
   no real XR communication. All state is simulated client-side
   and advanced only by explicit user actions.
   ALL PEOPLE, DATES AND CONTENT ARE SAMPLE DESIGN DATA.
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- icons (inline SVG, 24 viewBox) ---------------- */
  var PATHS = {
    check: '<polyline points="5 12.5 10 17.5 19 7"/>',
    x: '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    inbox: '<path d="M4 5h16v14H4z"/><path d="M4 14h5l1.5 2.5h3L15 14h5"/>',
    send: '<path d="M21 3 3 10.5l7 2.5"/><path d="M21 3 13.5 21 10 13"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><polyline points="12 7.5 12 12 15.5 14"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><line x1="16" y1="16" x2="21" y2="21"/>',
    upload: '<path d="M12 16V5"/><polyline points="7 9.5 12 4.5 17 9.5"/><path d="M4.5 16.5v3h15v-3"/>',
    file: '<path d="M6 3h8l4 4v14H6z"/><polyline points="13.5 3.5 13.5 7.5 17.5 7.5"/>',
    refresh: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3L19.5 9"/><polyline points="19.5 4.5 19.5 9 15 9"/>',
    ret: '<path d="M19 6v5a4 4 0 0 1-4 4H5"/><polyline points="9 10.5 4.5 15 9 19.5"/>',
    eye: '<path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.6"/>',
    alertTri: '<path d="M12 3.5 22 20H2z"/><line x1="12" y1="10" x2="12" y2="14.5"/><circle cx="12" cy="17.2" r=".4"/>',
    alertCirc: '<circle cx="12" cy="12" r="8.5"/><line x1="12" y1="7.5" x2="12" y2="13"/><circle cx="12" cy="16.2" r=".4"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><line x1="12" y1="11" x2="12" y2="16.5"/><circle cx="12" cy="7.8" r=".4"/>',
    help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.5 9.4a2.6 2.6 0 1 1 3.6 2.4c-.9.4-1.1 1-1.1 1.9"/><circle cx="12" cy="16.6" r=".4"/>',
    headset: '<path d="M3.5 11.5a8.5 8.5 0 0 1 17 0"/><rect x="2.5" y="11.5" width="4.5" height="7" rx="1.6"/><rect x="17" y="11.5" width="4.5" height="7" rx="1.6"/>',
    monitor: '<rect x="3" y="4.5" width="18" height="12.5" rx="1.5"/><line x1="9" y1="20.5" x2="15" y2="20.5"/><line x1="12" y1="17" x2="12" y2="20.5"/>',
    layers: '<path d="m12 3.5 9 4.8-9 4.8-9-4.8z"/><path d="m4.7 12.2-1.7.9 9 4.8 9-4.8-1.7-.9"/>',
    box: '<path d="m12 3 8 4.2v9.6L12 21l-8-4.2V7.2z"/><polyline points="4.5 7.5 12 11.5 19.5 7.5"/><line x1="12" y1="11.5" x2="12" y2="20.5"/>',
    list: '<line x1="9" y1="6.5" x2="20" y2="6.5"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="17.5" x2="20" y2="17.5"/><circle cx="5" cy="6.5" r=".5"/><circle cx="5" cy="12" r=".5"/><circle cx="5" cy="17.5" r=".5"/>',
    listCheck: '<line x1="12" y1="6.5" x2="20" y2="6.5"/><line x1="12" y1="12" x2="20" y2="12"/><line x1="12" y1="17.5" x2="20" y2="17.5"/><polyline points="4 6.5 5.5 8 8.5 5"/><polyline points="4 12 5.5 13.5 8.5 10.5"/>',
    book: '<path d="M4.5 4.5h6.5a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4.5z"/><path d="M19.5 4.5H13"/><path d="M19.5 4.5v13H13"/>',
    play: '<path d="M8 5.5v13l10-6.5z"/>',
    activity: '<polyline points="3 12.5 7.5 12.5 10 6 14 18.5 16.5 12.5 21 12.5"/>',
    shield: '<path d="M12 3 5 5.8v5.4c0 4.5 3 7.9 7 9.3 4-1.4 7-4.8 7-9.3V5.8z"/>',
    user: '<circle cx="12" cy="8.4" r="3.6"/><path d="M4.8 20a7.6 7.6 0 0 1 14.4 0"/>',
    chevD: '<polyline points="6.5 9.5 12 15 17.5 9.5"/>',
    arrR: '<line x1="4" y1="12" x2="19" y2="12"/><polyline points="13.5 6.5 19 12 13.5 17.5"/>',
    home: '<path d="m4 11 8-7 8 7"/><path d="M6 9.5V20h12V9.5"/>',
    edit: '<path d="M14.5 5.5 18.5 9.5 8.5 19.5H4.5v-4z"/><path d="m12.8 7.2 4 4"/>',
    hourglass: '<path d="M7 3.5h10"/><path d="M7 20.5h10"/><path d="M8 3.5v3.2c0 2.6 4 3.8 4 5.3s-4 2.7-4 5.3v3.2"/><path d="M16 3.5v3.2c0 2.6-4 3.8-4 5.3s4 2.7 4 5.3v3.2"/>'
  };
  function ic(name, cls) {
    return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (PATHS[name] || '') + '</svg>';
  }

  /* ---------------- sample data & state ---------------- */
  /* Bumped to v2 when the Content Manager became the publisher and vendor-created
     submissions became real records — a v1 blob left in a tab would describe the old model. */
  var STORAGE_KEY = 'xrslp-batch01-proto-v2';

  function initialState() {
    var st = {
      subs: {
        soil: {
          id: 'soil', title: 'Soil Mechanics XR Experiment',
          experiment: 'Soil Mechanics — Direct Shear Test',
          vendor: 'Sample XR Content Vendor', fmt: 'VR', device: 'Meta Quest',
          discipline: 'Civil Engineering',
          desc: 'VR laboratory experiment: determine the shear strength parameters of a soil specimen using the direct shear apparatus, including normal-load staging, shearing and result interpretation.',
          version: 1, status: 'draft', resubmitted: false, returnedGate: null,
          feedback: null,
          build: { name: 'Direct shear test — XR build package (v1)', size: '1.2 GB' },
          docs: [{ name: 'Instructor guide — Direct Shear Test.pdf', size: '2.4 MB' }, { name: 'Lab procedure & objectives.pdf', size: '1.1 MB' }],
          history: [
            { t: 'created', label: 'Draft created', actor: 'Ananya Rao', role: 'Vendor', when: '19 Aug 2026 · 16:40' }
          ]
        },
        venturi: {
          id: 'venturi', title: 'Fluid Dynamics — Venturi Meter Experiment',
          experiment: 'Fluid Dynamics — Venturi Meter', vendor: 'Sample XR Content Vendor',
          fmt: 'VR', device: 'Meta Quest', discipline: 'Mechanical Engineering',
          desc: 'VR experiment on flow measurement using a venturi meter: pressure tappings, manometer readings and discharge coefficient calculation.',
          version: 1, status: 'academic', resubmitted: false, returnedGate: null, feedback: null,
          build: { name: 'Venturi meter — XR build package (v1)', size: '860 MB' },
          docs: [{ name: 'Instructor guide — Venturi Meter.pdf', size: '1.9 MB' }],
          history: [
            { t: 'submitted', label: 'Submitted (v1)', actor: 'Ananya Rao', role: 'Vendor', when: '19 Aug 2026 · 10:05' },
            { t: 'created', label: 'Draft created', actor: 'Ananya Rao', role: 'Vendor', when: '18 Aug 2026 · 14:22' }
          ]
        },
        bod: {
          id: 'bod', title: 'Environmental Engg — BOD Test',
          experiment: 'Environmental Engineering — BOD Test', vendor: 'Sample Labs Collective',
          fmt: 'Web', device: 'Web browser', discipline: 'Environmental Engineering',
          desc: 'Browser-based simulation of the biochemical oxygen demand (BOD) test over a five-day incubation.',
          version: 1, status: 'content', resubmitted: false, returnedGate: null, feedback: null,
          build: { name: 'BOD test — web build package (v1)', size: '240 MB' },
          docs: [{ name: 'Instructor notes — BOD.pdf', size: '900 KB' }],
          history: [
            { t: 'validated', label: 'Academic validation complete', actor: 'Dr. R. Iyer', role: 'Academic Reviewer', when: '19 Aug 2026 · 15:30', note: 'Curriculum alignment confirmed for water-quality module objectives.' },
            { t: 'submitted', label: 'Submitted (v1)', actor: 'K. Menon', role: 'Vendor', when: '18 Aug 2026 · 11:12' }
          ]
        },
        openchannel: {
          id: 'openchannel', title: 'Hydraulics — Open Channel Flow',
          experiment: 'Hydraulics — Open Channel Flow', vendor: 'Sample XR Content Vendor',
          fmt: 'VR', device: 'Meta Quest', discipline: 'Civil Engineering',
          desc: 'VR flume experiment: flow profiles over a broad-crested weir with depth and discharge measurement.',
          version: 1, status: 'changes_content', resubmitted: false, returnedGate: 'content',
          feedback: {
            by: 'M. Kulkarni', role: 'Content Manager', when: '18 Aug 2026 · 17:45',
            text: 'Metadata is incomplete: the supported-device entry is missing its firmware baseline, and the instructor guide PDF still carries a draft watermark. Please update both and resubmit.'
          },
          build: { name: 'Open channel flow — XR build package (v1)', size: '1.5 GB' },
          docs: [{ name: 'Instructor guide — Open Channel Flow (draft).pdf', size: '2.1 MB' }],
          history: [
            { t: 'changes', label: 'Changes requested — content readiness', actor: 'M. Kulkarni', role: 'Content Manager', when: '18 Aug 2026 · 17:45', note: 'Metadata is incomplete: the supported-device entry is missing its firmware baseline, and the instructor guide PDF still carries a draft watermark. Please update both and resubmit.' },
            { t: 'validated', label: 'Academic validation complete', actor: 'Dr. R. Iyer', role: 'Academic Reviewer', when: '17 Aug 2026 · 12:10' },
            { t: 'submitted', label: 'Submitted (v1)', actor: 'Ananya Rao', role: 'Vendor', when: '16 Aug 2026 · 09:30' }
          ]
        },
        heatx: {
          id: 'heatx', title: 'Thermodynamics — Heat Exchanger VR Lab',
          experiment: 'Thermodynamics — Heat Exchanger Analysis', vendor: 'Sample XR Content Vendor',
          fmt: 'VR', device: 'Meta Quest', discipline: 'Mechanical Engineering',
          desc: 'Shell-and-tube heat exchanger performance experiment in VR: LMTD and effectiveness–NTU analysis.',
          version: 2, status: 'published', resubmitted: false, returnedGate: null, feedback: null,
          publishedOn: '11 Aug 2026',
          build: { name: 'Heat exchanger — XR build package (v2)', size: '1.1 GB' },
          docs: [{ name: 'Instructor guide — Heat Exchanger.pdf', size: '3.0 MB' }],
          history: [
            { t: 'published', label: 'Published to production', actor: 'M. Kulkarni', role: 'Content Manager', when: '11 Aug 2026 · 15:02' },
            { t: 'validated', label: 'Academic validation complete', actor: 'Dr. R. Iyer', role: 'Academic Reviewer', when: '10 Aug 2026 · 16:20' },
            { t: 'resubmitted', label: 'Corrected & resubmitted (v2)', actor: 'Ananya Rao', role: 'Vendor', when: '10 Aug 2026 · 09:55' },
            { t: 'changes', label: 'Changes requested — academic review', actor: 'Dr. R. Iyer', role: 'Academic Reviewer', when: '08 Aug 2026 · 13:15', note: 'Energy-balance worksheet does not match the simulated instrument readings; please correct the sample data set.' },
            { t: 'submitted', label: 'Submitted (v1)', actor: 'Ananya Rao', role: 'Vendor', when: '07 Aug 2026 · 10:30' }
          ]
        },
        gear: {
          id: 'gear', title: 'Machine Design — Gear Train Assembly',
          experiment: 'Machine Design — Gear Train Assembly', vendor: 'Sample XR Content Vendor',
          fmt: 'VR', device: 'Meta Quest', discipline: 'Mechanical Engineering',
          desc: 'Draft submission — assembly and ratio analysis of a compound gear train in VR.',
          version: 1, status: 'draft', resubmitted: false, returnedGate: null, feedback: null,
          build: null, docs: [],
          history: [{ t: 'created', label: 'Draft created', actor: 'Ananya Rao', role: 'Vendor', when: '17 Aug 2026 · 15:05' }]
        }
      },

      exps: {
        shear: {
          id: 'shear', name: 'Soil Mechanics — Direct Shear Test', fmt: 'VR',
          deviceLine: 'VR headset — e.g. Meta Quest',
          ent: 'active', dev: 'supported',
          xr: 'none', lastKnown: 'pending', refreshes: 0, progress: 'not_started',
          desc: 'Determine the shear strength parameters of a soil specimen using the direct shear apparatus: apply normal load stages, shear the specimen and interpret the results.',
          resources: ['Lab briefing — Direct shear theory (PDF)', 'Apparatus walkthrough (video)']
        },
        bernoulli: {
          id: 'bernoulli', name: 'Fluid Mechanics — Bernoulli Flow Visualisation', fmt: 'Web',
          deviceLine: 'Runs in your web browser', ent: 'active', dev: 'web',
          xr: 'none', progress: 'in_progress', webdone: false,
          desc: 'Visualise pressure and velocity head along a converging–diverging duct and verify Bernoulli’s principle.',
          resources: ['Bernoulli’s principle — reading (PDF)']
        },
        torsion: {
          id: 'torsion', name: 'Strength of Materials — Torsion Test', fmt: 'MR',
          deviceLine: 'MR device required', ent: 'active', dev: 'unsupported',
          xr: 'none', progress: 'not_started',
          desc: 'Mixed-reality torsion test on a metallic specimen: apply torque and observe shear stress development to failure.',
          resources: ['Torsion of circular shafts — reading (PDF)']
        },
        consolidation: {
          id: 'consolidation', name: 'Geotechnical — Consolidation Test', fmt: 'VR',
          deviceLine: 'VR headset — e.g. Meta Quest', ent: 'denied', dev: 'supported',
          xr: 'none', progress: 'not_started',
          desc: 'Oedometer consolidation experiment in VR: load increments, settlement readings and coefficient of consolidation.',
          resources: ['Consolidation theory — reading (PDF)']
        },
        heatxl: {
          id: 'heatxl', name: 'Thermodynamics — Heat Exchanger Analysis', fmt: 'VR',
          deviceLine: 'VR headset — e.g. Meta Quest', ent: 'none', dev: 'supported',
          xr: 'none', progress: 'not_started',
          desc: 'Shell-and-tube heat exchanger performance experiment in VR: LMTD and effectiveness–NTU analysis.',
          resources: []
        },
        surveying: {
          id: 'surveying', name: 'Surveying — Total Station Basics', fmt: 'Web',
          deviceLine: 'Runs in your web browser', ent: 'active', dev: 'web',
          xr: 'none', progress: 'completed', completedOn: '12 Aug 2026',
          desc: 'Set up a total station, take angle and distance readings, and reduce them to coordinates.',
          resources: ['Total station field manual (PDF)']
        }
      },

      /* Counter behind the id of each submission the vendor creates during the demo —
         gives every new record a stable, unique key with no backend and no random source. */
      seq: 0
    };
    /* Everything above is the seeded sample data set. Submissions created during the demo
       are added alongside it, carry seeded:false, and are the only records a reset removes. */
    Object.keys(st.subs).forEach(function (k) { st.subs[k].seeded = true; });
    return st;
  }

  /* Static history for submissions that predate the sample data set — reference
     data, not mutable state (derived entries from live submissions cover the rest). */
  var ARV_SEED_HISTORY = [
    { sub: 'Concrete Technology — Slump Test', action: 'Academic validation complete', when: '12 Aug 2026', note: '' }
  ];
  var CM_SEED_HISTORY = [
    { sub: 'Concrete Technology — Slump Test', action: 'Published to production', when: '13 Aug 2026', note: '' }
  ];

  var S = load() || initialState();

  function save() { try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable — in-memory only */ } }
  function load() {
    try { var raw = sessionStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null; }
    catch (e) { return null; }
  }
  function resetDemo() {
    S = initialState(); save();
    location.hash = '#/index';
    toast('Prototype reset — all sample data restored to its starting state.', 'info');
    render();
  }

  /* ---------------- misc helpers ---------------- */
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nowStamp() {
    var d = new Date(), hh = ('0' + d.getHours()).slice(-2), mm = ('0' + d.getMinutes()).slice(-2);
    return 'Today · ' + hh + ':' + mm;
  }
  function fmtBadge(f) {
    var m = { VR: 'fmt-vr', MR: 'fmt-mr', AR: 'fmt-ar', Web: 'fmt-web' };
    return '<span class="fmt ' + (m[f] || 'fmt-web') + '">' + ic(f === 'Web' ? 'monitor' : 'headset', 'sm') + esc(f) + '</span>';
  }

  /* PM publication correction: the Content Manager publishes at gate 3, so there is no
     'Ready to Publish' hand-off state between content readiness review and production. */
  var STATUS_LABEL = {
    draft: 'Draft', academic: 'Academic Review', changes_academic: 'Changes Required',
    content: 'Content Readiness Review', changes_content: 'Changes Required',
    publishing: 'Publishing…', published: 'Published'
  };
  function statusBadge(sub) {
    var s = sub.status;
    if (s === 'draft') return '<span class="badge b-neutral">' + ic('edit', 'sm') + 'Draft</span>';
    if (s === 'academic') return '<span class="badge b-info">' + ic('eye', 'sm') + 'Academic Review</span>';
    if (s === 'content') return '<span class="badge b-info">' + ic('listCheck', 'sm') + 'Content Readiness Review</span>';
    if (s === 'changes_academic' || s === 'changes_content') return '<span class="badge b-warning">' + ic('ret', 'sm') + 'Changes Required</span>';
    if (s === 'publishing') return '<span class="badge b-info">' + ic('clock', 'sm') + 'Publishing…</span>';
    if (s === 'published') return '<span class="badge b-published">' + ic('check', 'sm') + 'Published</span>';
    return '';
  }
  function holderLine(sub, audience) {
    var s = sub.status;
    if (s === 'draft') return audience === 'vendor' ? 'With you — not yet submitted' : 'With vendor (draft)';
    if (s === 'academic') return 'With Academic Reviewer';
    if (s === 'content') return 'With Content Manager';
    if (s === 'publishing') return 'Publishing to production…';
    if (s === 'changes_academic' || s === 'changes_content') return audience === 'vendor' ? 'With you — correct & resubmit' : 'With vendor for correction';
    if (s === 'published') return 'Published' + (sub.publishedOn ? ' · ' + sub.publishedOn : '');
    return '';
  }
  function resubChip(sub) {
    return sub.resubmitted ? ' <span class="badge b-outline">' + ic('refresh', 'sm') + 'Resubmitted</span>' : '';
  }
  function vchip(sub) { return '<span class="vchip">v' + sub.version + '</span>'; }

  /* ---------------- submission records ---------------- */
  var VENDOR_ORG = 'Sample XR Content Vendor';

  /* A submission the vendor creates during the demo becomes a real record in S.subs,
     exactly like a seeded one, so it travels the governance chain under its own id and
     with the title and details the vendor entered. Seeded records are never reused. */
  function createSub(v) {
    S.seq = (S.seq || 0) + 1;
    var id = 'sub-' + S.seq;
    S.subs[id] = {
      id: id, seeded: false, seq: S.seq,
      title: v.title, experiment: v.title, vendor: VENDOR_ORG,
      fmt: v.fmt, device: v.device, discipline: v.discipline, desc: v.desc,
      version: 1, status: 'draft', resubmitted: false, returnedGate: null, feedback: null,
      build: v.build || null, docs: v.docs ? v.docs.slice() : [],
      history: [{ t: 'created', label: 'Draft created', actor: 'Ananya Rao', role: 'Vendor', when: nowStamp() }]
    };
    save();
    return id;
  }

  /* The vendor's own submissions — created ones first (newest at the top), then the
     seeded sample set. Derived from state, never a hard-coded list of ids. */
  function vendorSubs() {
    var all = Object.keys(S.subs).map(function (k) { return S.subs[k]; })
      .filter(function (s) { return s.vendor === VENDOR_ORG; });
    var created = all.filter(function (s) { return !s.seeded; })
      .sort(function (a, b) { return (b.seq || 0) - (a.seq || 0); });
    return created.concat(all.filter(function (s) { return s.seeded; }));
  }

  /* How long a submission has been waiting in a review queue — read from its own
     history so seeded and created records are treated identically. */
  function queuedSince(sub) {
    for (var i = 0; i < sub.history.length; i++) {
      var t = sub.history[i].t;
      if (t === 'submitted' || t === 'resubmitted') return String(sub.history[i].when).split(' · ')[0];
    }
    return '—';
  }

  /* ---------------- state transitions (governance) ---------------- */
  function pushHist(sub, entry) { sub.history.unshift(entry); }

  function submitSub(id) {
    var sub = S.subs[id];
    sub.status = 'academic'; sub.returnedGate = null;
    pushHist(sub, { t: 'submitted', label: 'Submitted (v' + sub.version + ')', actor: 'Ananya Rao', role: 'Vendor', when: nowStamp() });
    save();
    toast('Submitted for review — now with the Academic Reviewer.', 'ok');
    announce('Submission sent. Status: Academic Review.');
  }
  function arvApprove(id, note) {
    var sub = S.subs[id];
    sub.status = 'content'; sub.resubmitted = false; sub.returnedGate = null; sub.feedback = null;
    pushHist(sub, { t: 'validated', label: 'Academic validation complete', actor: 'Dr. R. Iyer', role: 'Academic Reviewer', when: nowStamp(), note: note || '' });
    save();
    toast('Academic validation recorded — moved to Content Readiness Review.', 'ok');
    announce('Academic validation complete. Status: Content Readiness Review.');
  }
  function arvChanges(id, reason) {
    var sub = S.subs[id];
    sub.status = 'changes_academic'; sub.resubmitted = false; sub.returnedGate = 'academic';
    sub.feedback = { by: 'Dr. R. Iyer', role: 'Academic Reviewer', when: nowStamp(), text: reason };
    pushHist(sub, { t: 'changes', label: 'Changes requested — academic review', actor: 'Dr. R. Iyer', role: 'Academic Reviewer', when: nowStamp(), note: reason });
    save();
    toast('Changes requested — returned to the vendor with your reason.', 'ok');
    announce('Changes requested. The submission is returned to the vendor.');
  }
  /* PM publication correction: publication is owned by the Content Manager and happens
     at gate 3, directly after content readiness review. There is no separate publish gate. */
  function cmPublish(id, note) {
    var sub = S.subs[id];
    sub.status = 'publishing'; sub.resubmitted = false; sub.returnedGate = null; sub.feedback = null;
    save(); render();
    var pct = 0, bar = null, tid = setInterval(function () {
      pct = Math.min(100, pct + 20);
      bar = document.getElementById('pubbar');
      if (bar) bar.style.width = pct + '%';
      if (pct >= 100) {
        clearInterval(tid);
        sub.status = 'published'; sub.publishedOn = 'Today';
        pushHist(sub, { t: 'published', label: 'Published to production', actor: 'M. Kulkarni', role: 'Content Manager', when: nowStamp(), note: note || '' });
        save();
        toast('Published to production — the experiment is now live for entitled learners and institutions.', 'ok');
        announce('Published. The experiment is live.');
        render();
      }
    }, 260);
  }
  function cmChanges(id, reason) {
    var sub = S.subs[id];
    sub.status = 'changes_content'; sub.resubmitted = false; sub.returnedGate = 'content';
    sub.feedback = { by: 'M. Kulkarni', role: 'Content Manager', when: nowStamp(), text: reason };
    pushHist(sub, { t: 'changes', label: 'Changes requested — content readiness', actor: 'M. Kulkarni', role: 'Content Manager', when: nowStamp(), note: reason });
    save();
    toast('Changes requested — returned to the vendor with your reason.', 'ok');
    announce('Changes requested. The submission is returned to the vendor.');
  }
  function vendorResubmit(id) {
    var sub = S.subs[id];
    var target = sub.returnedGate === 'content' ? 'content' : 'academic';
    sub.version += 1; sub.status = target; sub.resubmitted = true; sub.feedback = null;
    pushHist(sub, {
      t: 'resubmitted', label: 'Corrected & resubmitted (v' + sub.version + ')', actor: 'Ananya Rao', role: 'Vendor', when: nowStamp(),
      note: target === 'academic' ? 'Re-enters academic review.' : 'Re-enters content readiness review.'
    });
    save();
    var where = target === 'academic' ? 'Academic Review' : 'Content Readiness Review';
    toast('Resubmitted (v' + sub.version + ') — review resumes at ' + where + '.', 'ok');
    announce('Resubmitted. Review resumes at ' + where + '.');
  }
  /* ---------------- state transitions (learner XR) ---------------- */
  function xrGetOnDevice() {
    var e = S.exps.shear; e.xr = 'pending'; e.lastKnown = 'pending'; save();
    announce('Availability pending. The experiment is being made available for your device.');
    render();
  }
  function xrRefresh() {
    var e = S.exps.shear;
    if (e.xr === 'pending') {
      e.xr = 'ready'; e.lastKnown = 'ready'; save();
      toast('Ready on your device — put on your supported headset to run the experiment.', 'ok');
      announce('Ready on device.');
    } else if (e.xr === 'unknown') {
      e.xr = e.lastKnown; save();
      toast('Status confirmed — connection restored.', 'info');
    } else if (e.xr === 'completion_pending') {
      e.refreshes = (e.refreshes || 0) + 1;
      if (e.refreshes >= 2) {
        e.xr = 'completion_received'; e.progress = 'completed'; e.completedOn = 'Today'; save();
        toast('Completion received — your progress has been updated.', 'ok');
        announce('Completion received. Progress updated.');
      } else {
        save();
        toast('No completion received yet. This can take a little while after your session ends — it isn’t an error.', 'info');
        announce('No completion received yet.');
      }
    }
    render();
  }
  function xrRetry() { var e = S.exps.shear; e.xr = 'pending'; e.lastKnown = 'pending'; save(); toast('Trying again — availability pending.', 'info'); render(); }
  function xrSet(state) { var e = S.exps.shear; if (state === 'failed' || state === 'unknown') { e.xr = state; } save(); render(); }
  function xrSessionDone() {
    var e = S.exps.shear; e.xr = 'completion_pending'; e.refreshes = 0;
    if (e.progress === 'not_started') e.progress = 'in_progress';
    save();
    toast('Sample device session ended. The platform has not received the completion yet.', 'info');
    render();
  }
  function webSimFinish() {
    var e = S.exps.bernoulli; e.webdone = true; e.progress = 'completed'; e.completedOn = 'Today'; save();
    toast('Simulation completed — your progress has been updated.', 'ok');
    announce('Web simulation complete. Progress updated.');
  }

  /* ---------------- toast + announce ---------------- */
  function toast(msg, kind) {
    var host = document.getElementById('toasts');
    var el = document.createElement('div');
    el.className = 'toast' + (kind === 'info' ? ' info' : '');
    el.innerHTML = ic(kind === 'info' ? 'info' : 'check') + '<span class="tx">' + esc(msg) + '</span>' +
      '<button type="button" aria-label="Dismiss notification">' + ic('x', 'sm') + '</button>';
    el.querySelector('button').addEventListener('click', function () { el.remove(); });
    host.appendChild(el);
    setTimeout(function () { el.remove(); }, 6000);
  }
  function announce(msg) {
    var a = document.getElementById('announcer');
    if (a) { a.textContent = ''; setTimeout(function () { a.textContent = msg; }, 40); }
  }

  /* ---------------- dialog ---------------- */
  var lastFocus = null;
  function openDialog(opts) {
    lastFocus = document.activeElement;
    var root = document.getElementById('dialog-root');
    root.innerHTML =
      '<div class="scrim" id="dlg-scrim">' +
      '<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-title">' +
      '<div class="dhead"><h2 id="dlg-title">' + esc(opts.title) + '</h2>' +
      '<button class="iconbtn" type="button" id="dlg-x" aria-label="Close dialog">' + ic('x') + '</button></div>' +
      '<div class="dbody">' + (opts.body || '') + '</div>' +
      '<div class="dfoot">' +
      '<button class="btn sec" type="button" id="dlg-cancel">Cancel</button>' +
      '<button class="btn pri" type="button" id="dlg-ok">' + esc(opts.confirmLabel || 'Confirm') + '</button>' +
      '</div></div></div>';
    function close() { root.innerHTML = ''; document.removeEventListener('keydown', onKey); if (lastFocus) lastFocus.focus(); }
    function onKey(ev) {
      if (ev.key === 'Escape') { close(); }
      if (ev.key === 'Tab') {
        var f = root.querySelectorAll('button, [href], input, select, textarea');
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
        else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener('keydown', onKey);
    document.getElementById('dlg-x').addEventListener('click', close);
    document.getElementById('dlg-cancel').addEventListener('click', close);
    document.getElementById('dlg-scrim').addEventListener('mousedown', function (ev) { if (ev.target === this) close(); });
    document.getElementById('dlg-ok').addEventListener('click', function () {
      if (opts.validate && !opts.validate(root)) return;
      // Run the confirm action BEFORE tearing the dialog down — it reads field values from the dialog DOM.
      if (opts.onConfirm) opts.onConfirm(root);
      close();
    });
    var focusable = root.querySelector('textarea, input, select') || document.getElementById('dlg-cancel');
    focusable.focus();
    if (opts.afterOpen) opts.afterOpen(root);
  }

  /* ---------------- shared render pieces ---------------- */
  var ROLES = {
    vendor: {
      key: 'vendor', wsLabel: 'Vendor workspace', wsCtx: 'Sample XR Content Vendor',
      user: 'Ananya Rao', initials: 'AR', role: 'Vendor',
      nav: function () {
        return [
          { href: '#/vendor/submissions', label: 'Submissions', icon: 'inbox', count: vendorSubs().length },
          { href: '#/vendor/new', label: 'New Submission', icon: 'plus' }
        ];
      }
    },
    arv: {
      key: 'arv', wsLabel: 'Academic Reviewer', wsCtx: 'Central content governance',
      user: 'Dr. R. Iyer', initials: 'RI', role: 'Academic Reviewer',
      nav: function () {
        var n = Object.keys(S.subs).filter(function (k) { return S.subs[k].status === 'academic'; }).length;
        return [
          { href: '#/arv/queue', label: 'Review Queue', icon: 'listCheck', count: n },
          { href: '#/arv/history', label: 'Review History', icon: 'clock' }
        ];
      }
    },
    cm: {
      key: 'cm', wsLabel: 'Content Manager', wsCtx: 'Central content governance',
      user: 'M. Kulkarni', initials: 'MK', role: 'Content Manager',
      nav: function () {
        var n = Object.keys(S.subs).filter(function (k) { return S.subs[k].status === 'content'; }).length;
        return [
          { href: '#/cm/queue', label: 'Review Queue', icon: 'listCheck', count: n },
          { href: '#/cm/history', label: 'Reviewed Content', icon: 'clock' },
          { href: '#/cm/published', label: 'Published Content', icon: 'box' }
        ];
      }
    },
    learner: {
      key: 'learner', wsLabel: 'Learner', wsCtx: 'Sample Engineering Institute', inst: true,
      user: 'Rahul Verma', initials: 'RV', role: 'Learner',
      nav: function () {
        return [
          { href: '#/learner/my-learning', label: 'My Learning', icon: 'book' },
          { href: '#/learner/progress', label: 'Progress', icon: 'activity' }
        ];
      }
    }
  };

  function protobar(activeRole) {
    var links = [
      { href: '#/index', label: 'Index', role: 'index' },
      { href: '#/vendor/submissions', label: 'Vendor', role: 'vendor' },
      { href: '#/arv/queue', label: 'Academic Reviewer', role: 'arv' },
      { href: '#/cm/queue', label: 'Content Manager', role: 'cm' },
      { href: '#/learner/my-learning', label: 'Learner', role: 'learner' }
    ];
    return '<div class="protobar" role="navigation" aria-label="Prototype navigation — not product UI">' +
      '<span class="plabel">PROTOTYPE NAVIGATION — NOT PRODUCT UI</span>' +
      '<nav>' + links.map(function (l) {
        return '<a href="' + l.href + '"' + (activeRole === l.role ? ' aria-current="true"' : '') + '>' + esc(l.label) + '</a>';
      }).join('') + '</nav>' +
      '<div class="pright"><span class="plabel" style="letter-spacing:.04em">SAMPLE DESIGN DATA</span>' +
      '<button type="button" id="proto-reset">Reset demo</button></div></div>';
  }

  function shell(roleKey, activeHref, crumbHTML, contentHTML) {
    var r = ROLES[roleKey];
    var nav = r.nav().map(function (n) {
      var cur = n.href === activeHref;
      return '<a class="nitem" href="' + n.href + '"' + (cur ? ' aria-current="page"' : '') + '>' +
        ic(n.icon) + '<span>' + esc(n.label) + '</span>' +
        (typeof n.count === 'number' ? '<span class="ncount">' + n.count + '</span>' : '') + '</a>';
    }).join('');
    return protobar(roleKey) +
      '<div class="app">' +
      '<a class="skip-link" href="#main-content" id="skip-link">Skip to main content</a>' +
      '<header class="topbar">' +
      /* Logo loaded from assets/ — a byte-identical local prototype copy of
         branding/bits-pilani-wilp-logo.png (branding/ remains the source of truth; the source
         asset is never modified and the copy is never independently edited — verify with cmp).
         A local copy is used because Safari blocks parent-directory subresources when the HTML
         is opened directly from file://, which left the real logo missing. If the image still
         can't load, the graphic is omitted cleanly and the text lockup stands alone — never a
         broken-image icon. */
      '<div class="brand"><img src="assets/bits-pilani-wilp-logo.png" alt="BITS Pilani WILP" ' +
      'onerror="this.closest(\'.brand\').classList.add(\'no-logo\'); this.remove()">' +
      '<span class="bdiv" aria-hidden="true"></span><span class="pname">XR Simulation Learning Platform</span></div>' +
      '<div class="tspace"></div>' +
      (r.inst ? '<span class="inst-chip">Sample Engineering Institute</span>' : '') +
      '<a class="top-help" href="#/help" onclick="return false" title="Help (visual only in this prototype)">' + ic('help') + 'Help</a>' +
      '<button class="account" type="button" aria-haspopup="menu" aria-expanded="false" title="Account menu (visual only in this prototype)">' +
      '<span class="av" aria-hidden="true">' + esc(r.initials) + '</span>' +
      '<span class="awho"><span class="aname">' + esc(r.user) + '</span><br><span class="arole">' + esc(r.role) + '</span></span>' +
      ic('chevD', 'sm') + '</button>' +
      '</header>' +
      '<div class="frame">' +
      '<nav class="snav" aria-label="Workspace navigation">' +
      '<div class="ws-ctx"><div class="wsk">' + esc(r.wsLabel) + '</div><div class="wsv">' + esc(r.wsCtx) + '</div></div>' +
      nav + '</nav>' +
      '<main class="main" id="main-content"><div class="main-inner">' +
      (crumbHTML || '') + contentHTML +
      '</div></main></div></div>';
  }

  function crumbs(items) {
    return '<nav class="crumb" aria-label="Breadcrumb">' + items.map(function (c, i) {
      var last = i === items.length - 1;
      if (last) return '<span aria-current="page">' + esc(c.label) + '</span>';
      return '<a href="' + c.href + '">' + esc(c.label) + '</a><span class="sep" aria-hidden="true">/</span>';
    }).join('') + '</nav>';
  }

  /* Workflow position stepper (vertical, rail) */
  function stepper(sub) {
    var stages = [
      { key: 'submit', label: 'Submit' },
      { key: 'academic', label: 'Academic Review' },
      { key: 'content', label: 'Content Readiness Review' },
      { key: 'publish', label: 'Published' }
    ];
    var st = sub.status;
    function cls(key) {
      if (key === 'submit') return (st === 'draft') ? 'cur' : 'done';
      if (key === 'academic') {
        if (st === 'academic') return 'cur';
        if (st === 'changes_academic') return 'ret';
        if (st === 'content' || st === 'changes_content' || st === 'publishing' || st === 'published') return 'done';
        return '';
      }
      if (key === 'content') {
        if (st === 'content') return 'cur';
        if (st === 'changes_content') return 'ret';
        if (st === 'publishing' || st === 'published') return 'done';
        return '';
      }
      if (key === 'publish') {
        if (st === 'publishing') return 'cur';
        if (st === 'published') return 'done';
        return '';
      }
      return '';
    }
    function detail(key, c) {
      if (key === 'submit' && st === 'draft') return 'Draft — not yet submitted';
      if (key === 'academic' && c === 'ret') return 'Returned for changes — resumes here after resubmission';
      if (key === 'academic' && c === 'cur') return sub.resubmitted ? 'Resubmitted (v' + sub.version + ') — review resumed' : 'With Academic Reviewer';
      if (key === 'content' && c === 'ret') return 'Returned for changes — resumes here after resubmission';
      if (key === 'content' && c === 'cur') return sub.resubmitted ? 'Resubmitted (v' + sub.version + ') — review resumed' : 'With Content Manager — reviews and publishes';
      if (key === 'publish' && c === 'cur') return 'Publishing to production…';
      if (key === 'publish' && c === 'done') return 'Published' + (sub.publishedOn ? ' · ' + sub.publishedOn : '');
      return '';
    }
    function stateWord(c) {
      return c === 'done' ? 'Complete' : c === 'cur' ? 'Current' : c === 'ret' ? 'Returned' : 'Upcoming';
    }
    return '<ol class="stepper">' + stages.map(function (g, i) {
      var c = cls(g.key);
      var node = c === 'done' ? ic('check', 'sm') : c === 'ret' ? ic('ret', 'sm') : String(i + 1);
      var d = detail(g.key, c);
      return '<li class="step ' + c + '"><span class="snode" aria-hidden="true">' + node + '</span>' +
        '<div class="sbody"><div class="slabel">' + esc(g.label) + ' <span class="sstate">· ' + stateWord(c) + '</span></div>' +
        (d ? '<div class="sdetail">' + esc(d) + '</div>' : '') + '</div></li>';
    }).join('') + '</ol>';
  }

  /* Review history timeline (SHR-05) */
  function timeline(sub) {
    if (!sub.history.length) return '<p style="font-size:13px;color:var(--text-3)">No history yet.</p>';
    var dot = { submitted: ['info', 'send'], resubmitted: ['info', 'refresh'], validated: ['good', 'check'], readiness: ['good', 'check'], changes: ['warn', 'ret'], published: ['pub', 'check'], created: ['', 'edit'] };
    return '<ol class="timeline">' + sub.history.map(function (h) {
      var d = dot[h.t] || ['', 'clock'];
      return '<li class="tl-item' + (h.t === 'changes' ? ' warnnote' : '') + '">' +
        '<span class="tl-dot ' + d[0] + '" aria-hidden="true">' + ic(d[1]) + '</span>' +
        '<div class="tl-body"><div class="tl-action">' + esc(h.label) + '</div>' +
        '<div class="tl-who">' + esc(h.actor) + ' · ' + esc(h.role) + ' · ' + esc(h.when) + '</div>' +
        (h.note ? '<div class="tl-note">“' + esc(h.note) + '”</div>' : '') +
        '</div></li>';
    }).join('') + '</ol>';
  }

  function historyCard(sub) {
    return '<section class="card" aria-label="Review history">' +
      '<div class="chead"><h3>Review history</h3><span class="cnote">every decision is recorded</span></div>' +
      '<div class="cbody">' + timeline(sub) + '</div></section>';
  }

  function submissionSummaryCard(sub, opts) {
    opts = opts || {};
    return '<section class="card">' +
      '<div class="chead"><h3>Submission summary</h3><span class="cnote"><span class="sample-tag">SAMPLE DESIGN DATA</span></span></div>' +
      '<div class="cbody tight"><dl class="kv">' +
      '<div class="k">Experiment</div><div class="v">' + esc(sub.experiment) + '</div>' +
      '<div class="k">Vendor</div><div class="v">' + esc(sub.vendor) + '</div>' +
      '<div class="k">XR format</div><div class="v">' + fmtBadge(sub.fmt) + '</div>' +
      '<div class="k">Example supported device</div><div class="v">' + esc(sub.device) + '</div>' +
      '<div class="k">Discipline</div><div class="v">' + esc(sub.discipline) + '</div>' +
      '<div class="k">Version</div><div class="v">v' + sub.version + (sub.resubmitted ? ' · resubmitted' : '') + '</div>' +
      '<div class="k">Description</div><div class="v">' + esc(sub.desc) + '</div>' +
      '</dl></div></section>';
  }

  function buildDocsCard(sub) {
    var rows = '';
    if (sub.build) rows += '<li>' + '<span class="ftile">' + ic('box') + '</span><span>' + esc(sub.build.name) + '</span><span class="fsize">' + esc(sub.build.size) + '</span></li>';
    sub.docs.forEach(function (d) { rows += '<li><span class="ftile">' + ic('file') + '</span><span>' + esc(d.name) + '</span><span class="fsize">' + esc(d.size) + '</span></li>'; });
    if (!rows) rows = '<li style="color:var(--text-3)">No files added yet.</li>';
    return '<section class="card"><div class="chead"><h3>Build, assets &amp; documentation</h3></div>' +
      '<div class="cbody"><ul class="filelist">' + rows + '</ul>' +
      '<p style="font-size:12.5px;color:var(--text-3);margin-top:10px">Files are read-only once submitted. Package requirements will be confirmed by the platform team.</p>' +
      '</div></section>';
  }

  function emptyState(icon, title, body, actionHTML) {
    return '<div class="empty"><div class="echip">' + ic(icon, 'lg') + '</div><h3>' + esc(title) + '</h3><p>' + esc(body) + '</p>' + (actionHTML || '') + '</div>';
  }

  function protoNote(labelHTML) {
    return '<div class="proto-note"><span class="pn-label">PROTOTYPE CONTROL — NOT PRODUCT UI</span><div style="flex:1">' + labelHTML + '</div></div>';
  }

  /* ============================================================
     VIEWS
     ============================================================ */

  /* ---------- prototype index ---------- */
  function viewIndex() {
    var soil = S.subs.soil, shear = S.exps.shear;
    var html = protobar('index') +
      '<div class="app"><div class="index-wrap">' +
      '<div class="index-head">' +
      '<span class="itag">PROTOTYPE NAVIGATION — NOT PRODUCT UI</span>' +
      '<h1>XR Simulation Learning Platform — Batch 01 prototype</h1>' +
      '<p>High-fidelity interactive prototype of two end-to-end experiences: <strong>content governance to production</strong> (Vendor → Academic Reviewer → Content Manager → Published) and <strong>entitled XR access to a learner device</strong>. Everything is simulated in this browser — no backend, no real upload, no real XR delivery. All people, dates and content are sample design data.</p>' +
      '</div>' +

      '<div class="index-section"><h2>Jump into a workspace</h2><div class="rolegrid">' +
      [['#/vendor/submissions', 'AR', 'Ananya Rao', 'Vendor — Sample XR Content Vendor'],
       ['#/arv/queue', 'RI', 'Dr. R. Iyer', 'Academic Reviewer'],
       ['#/cm/queue', 'MK', 'M. Kulkarni', 'Content Manager'],
       ['#/learner/my-learning', 'RV', 'Rahul Verma', 'Learner — Sample Engineering Institute']].map(function (r) {
        return '<a class="rolecard" href="' + r[0] + '"><span class="rc-av">' + r[1] + '</span><span><span class="rc-name">' + r[2] + '</span><br><span class="rc-sub">' + r[3] + '</span></span></a>';
      }).join('') +
      '</div></div>' +

      '<div class="index-section"><h2>Demo paths (suggested order)</h2><div class="pathgrid">' +

      '<div class="pathcard"><span class="pk">A</span><h2>Content happy path</h2><ol>' +
      '<li>Vendor → open “Soil Mechanics XR Experiment” (Draft) → Edit &amp; submit</li>' +
      '<li>Academic Reviewer → Review Queue → open it → Validate — approve</li>' +
      '<li>Content Manager → Review Queue → open it → Publish to production</li></ol>' +
      '<p style="font-size:12.5px;color:var(--text-3);margin:8px 0 0">Or run the same path on a submission of your own: Vendor → <strong>New Submission</strong>. It becomes its own record under the title you enter and travels the chain alongside the sample data.</p>' +
      '<div class="pgo"><a class="btn sm sec" href="#/vendor/submission/soil">Start at the vendor</a>' +
      '<a class="btn sm gho" href="#/vendor/new">New Submission</a></div></div>' +

      '<div class="pathcard"><span class="pk">B</span><h2>Academic changes required</h2><ol>' +
      '<li>Submit as vendor (as in A)</li>' +
      '<li>Academic Reviewer → open it → Request changes (reason required)</li>' +
      '<li>Vendor → submission shows Changes Required + exact feedback</li>' +
      '<li>Correct submission → Resubmit → review resumes at Academic Review with history intact</li></ol>' +
      '<div class="pgo"><a class="btn sm sec" href="#/arv/queue">Reviewer queue</a></div></div>' +

      '<div class="pathcard"><span class="pk">C</span><h2>Content manager changes required</h2><ol>' +
      '<li>After academic approval, Content Manager → Request changes</li>' +
      '<li>Vendor corrects and resubmits</li>' +
      '<li>Review resumes at Content Readiness Review — not at the start, and never skipping the academic gate</li></ol>' +
      '<div class="pgo"><a class="btn sm sec" href="#/cm/queue">CM queue</a></div></div>' +

      '<div class="pathcard"><span class="pk">D</span><h2>Learner XR access</h2><ol>' +
      '<li>Learner → My Learning → “Soil Mechanics — Direct Shear Test”</li>' +
      '<li>Entitlement ✓ and device compatibility ✓ → Get on device</li>' +
      '<li>Availability pending → Refresh → Ready on device</li>' +
      '<li>Simulate a completed device session → Completion pending → Refresh (twice) → Completion received → Progress updated</li></ol>' +
      '<div class="pgo"><a class="btn sm sec" href="#/learner/experiment/shear">Open the experiment</a></div></div>' +

      '<div class="pathcard"><span class="pk">E</span><h2>XR restriction &amp; failure states</h2><ol>' +
      '<li>“Thermodynamics — Heat Exchanger Analysis” → not entitled</li>' +
      '<li>“Geotechnical — Consolidation Test” → access denied</li>' +
      '<li>“Strength of Materials — Torsion Test” → device not supported</li>' +
      '<li>On the device access page: availability failed / availability unknown (prototype controls)</li></ol>' +
      '<div class="pgo"><a class="btn sm sec" href="#/learner/my-learning">My Learning</a></div></div>' +

      '<div class="pathcard"><span class="pk">＋</span><h2>Current demo state</h2>' +
      '<ol style="list-style:none;margin-left:0">' +
      '<li>Governance hero: <strong>' + esc(STATUS_LABEL[soil.status] || soil.status) + '</strong> (v' + soil.version + ')</li>' +
      '<li>Learner hero: <strong>' + esc(shear.xr === 'none' ? 'Not yet on device' : shear.xr.replace(/_/g, ' ')) + '</strong></li>' +
      '<li>State persists in this tab; reset any time.</li></ol>' +
      '<div class="pgo"><button class="btn sm sec" type="button" id="idx-reset">Reset demo</button></div></div>' +

      '</div></div>' +

      '<div class="index-section"><h2>Notes for reviewers</h2>' +
      '<div class="card"><div class="cbody" style="font-size:13.5px;color:var(--text-2);line-height:1.7">' +
      '<p>· The XR delivery mechanism is deliberately <strong>not selected</strong> — all device copy is mechanism-neutral (“Get on device”, “Ready on device”) and may change once the implementation is chosen.</p>' +
      '<p>· VR/MR/AR simulations never run in this browser; only Web-format simulations do (see the Bernoulli experiment).</p>' +
      '<p>· The vendor has no publish control anywhere — publication belongs to the Content Manager, and is only reachable after academic validation.</p>' +
      '<p>· Publication is owned by the <strong>Content Manager</strong> (PM publication correction, 25 Aug 2026). <strong>Super Admin remains an approved platform role</strong>, but takes no part in the active Batch-01 content-publication workflow, so it has no workspace here; its detailed responsibilities are deferred to a later batch.</p>' +
      '<p>· The Content Manager’s <strong>Published Content</strong> list is a <strong>design assumption (reversible)</strong>, not a PM-confirmed requirement — post-publication management responsibility has not been separately confirmed.</p>' +
      '<p>· Wireframes: <span style="font-family:var(--mono);font-size:12px">../wireframes/batch01-wireframes.html</span> · Docs: <span style="font-family:var(--mono);font-size:12px">01_BATCH01_SCOPE.md · 02_FOUNDATIONS_AND_SHELL.md · 03_COMPONENT_SYSTEM.md</span></p>' +
      '</div></div></div>' +

      '</div></div>';
    return html;
  }

  /* ---------- S01 vendor submissions ---------- */
  function viewVendorSubs() {
    var mine = vendorSubs();
    var returned = mine.filter(function (s) { return s.status === 'changes_academic' || s.status === 'changes_content'; });
    var rows = mine.map(function (s) {
      var isRet = s.status === 'changes_academic' || s.status === 'changes_content';
      return '<tr class="' + (isRet ? 'row-returned' : '') + '">' +
        '<td><a class="rowlink" href="#/vendor/submission/' + s.id + '"><span class="tmain">' + esc(s.title) + '</span></a>' +
        '<div class="tsub">' + esc(s.experiment) + '</div></td>' +
        '<td>' + fmtBadge(s.fmt) + '</td>' +
        '<td class="num">v' + s.version + '</td>' +
        '<td>' + statusBadge(s) + resubChip(s) + '</td>' +
        '<td>' + esc(holderLine(s, 'vendor')) + '</td>' +
        '<td><a class="btn sm ' + (isRet ? 'pri' : 'gho') + '" href="#/vendor/submission/' + s.id + '">' + (isRet ? 'View feedback' : 'Open') + '</a></td></tr>';
    }).join('');
    var banner = returned.length ?
      '<div class="alert warning" role="status" style="margin-bottom:16px">' + ic('ret') +
      '<div><div class="at">' + returned.length + ' submission' + (returned.length > 1 ? 's need' : ' needs') + ' your changes</div>' +
      'A reviewer has returned work with a reason. Open it to read the feedback, correct the submission and resubmit — review then resumes where it left off.</div></div>' : '';
    var content =
      '<div class="phead"><div class="ptitles"><h1>My Submissions</h1>' +
      '<div class="pmeta">Everything you have submitted to the platform, and where each item is in review.</div></div>' +
      '<div class="pactions"><a class="btn pri" href="#/vendor/new">' + ic('plus') + 'New Submission</a></div></div>' +
      banner +
      '<div class="tablecard">' +
      '<div class="listbar"><div class="searchbox">' + ic('search') + '<input type="search" id="q" placeholder="Search submissions" aria-label="Search submissions"></div>' +
      '<label class="sr-only" for="fstatus">Filter by status</label>' +
      '<select id="fstatus"><option value="">Status: All</option><option>Draft</option><option>Academic Review</option><option>Changes Required</option><option>Content Readiness Review</option><option>Published</option></select>' +
      '<span class="lcount" id="lcount">' + mine.length + ' submissions</span></div>' +
      '<table class="dt" id="subtable"><caption class="sr-only">My submissions with status and holder</caption>' +
      '<thead><tr><th scope="col">Submission</th><th scope="col">Format</th><th scope="col">Version</th><th scope="col">Status</th><th scope="col">Current step</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table>' +
      '<div class="tfoot"><span>Showing all submissions</span><nav class="pgn" aria-label="Pagination"><button disabled>Previous</button><button disabled>Next</button></nav></div>' +
      '</div>';
    return shell('vendor', '#/vendor/submissions', '', content);
  }

  function bindVendorSubsFilters() {
    var q = document.getElementById('q'), f = document.getElementById('fstatus'), table = document.getElementById('subtable');
    if (!q || !table) return;
    function apply() {
      var term = q.value.toLowerCase(), st = f.value;
      var shown = 0;
      table.querySelectorAll('tbody tr').forEach(function (tr) {
        var txt = tr.textContent.toLowerCase();
        var ok = (!term || txt.indexOf(term) !== -1) && (!st || tr.textContent.indexOf(st) !== -1);
        tr.style.display = ok ? '' : 'none'; if (ok) shown++;
      });
      var lc = document.getElementById('lcount');
      if (lc) lc.textContent = shown + ' of ' + table.querySelectorAll('tbody tr').length + ' submissions';
    }
    q.addEventListener('input', apply); f.addEventListener('change', apply);
  }

  /* ---------- S02 new submission / edit ---------- */
  function viewVendorForm(editId) {
    var editing = !!editId, sub = editing ? S.subs[editId] : null;
    var correcting = editing && (sub.status === 'changes_academic' || sub.status === 'changes_content');
    var vals = editing ? sub : { title: '', discipline: '', fmt: 'VR', device: 'Meta Quest', desc: '', build: null, docs: [] };
    var fbPanel = correcting && sub.feedback ?
      '<div class="feedback-panel" style="margin-bottom:16px">' +
      '<div class="fh">' + ic('ret') + 'Changes requested by the ' + esc(sub.feedback.role) + '</div>' +
      '<div class="fwho">' + esc(sub.feedback.by) + ' · ' + esc(sub.feedback.role) + ' · ' + esc(sub.feedback.when) + '</div>' +
      '<blockquote>“' + esc(sub.feedback.text) + '”</blockquote>' +
      '<div class="facts"><span style="font-size:12.5px;color:var(--text-2)">Correct the submission below, then resubmit — review resumes at ' + (sub.returnedGate === 'content' ? 'Content Readiness Review' : 'Academic Review') + '.</span></div>' +
      '</div>' : '';
    var content =
      '<div class="phead"><div class="ptitles"><h1>' + (correcting ? 'Correct submission' : editing ? 'Edit draft' : 'New Submission') + '</h1>' +
      '<div class="pmeta">' + (correcting ? esc(sub.title) + ' · v' + sub.version + ' · returned for changes' : 'Prepare an XR experiment submission for review.') + ' <span class="sample-tag">SAMPLE DESIGN DATA</span></div></div></div>' +
      '<div class="grid-rail"><div class="stack">' +
      fbPanel +
      '<div id="form-errors"></div>' +
      '<section class="card"><div class="chead"><h3>1 · Experiment details</h3></div><div class="cbody">' +
      '<div class="field" id="f-title"><label for="in-title">Submission title <span class="req" aria-hidden="true">*</span></label>' +
      '<input type="text" id="in-title" value="' + esc(vals.title) + '" required></div>' +
      '<div class="frow">' +
      '<div class="field"><label for="in-disc">Discipline <span class="req" aria-hidden="true">*</span></label>' +
      '<select id="in-disc"><option value="">Select…</option>' + ['Civil Engineering', 'Mechanical Engineering', 'Electrical Engineering', 'Environmental Engineering'].map(function (d) { return '<option' + (vals.discipline === d ? ' selected' : '') + '>' + d + '</option>'; }).join('') + '</select>' +
      '<p class="hint">Sample list — the discipline taxonomy is not finalised.</p></div>' +
      '<div class="field"><label for="in-fmt">XR format <span class="req" aria-hidden="true">*</span></label>' +
      '<select id="in-fmt">' + ['VR', 'MR', 'AR', 'Web'].map(function (fk) { return '<option' + (vals.fmt === fk ? ' selected' : '') + '>' + fk + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="field" id="f-desc"><label for="in-desc">Description <span class="req" aria-hidden="true">*</span></label>' +
      '<textarea id="in-desc">' + esc(vals.desc) + '</textarea>' +
      '<p class="hint">What the experiment covers and what the learner will do.</p></div>' +
      '</div></section>' +

      '<section class="card"><div class="chead"><h3>2 · Build &amp; assets</h3></div><div class="cbody">' +
      '<div class="field" id="f-build"><label>XR build package <span class="req" aria-hidden="true">*</span></label>' +
      (vals.build ?
        '<div class="upfile">' + ic('box') + '<span>' + esc(vals.build.name) + '</span><span class="fsize">' + esc(vals.build.size) + '</span>' +
        '<button class="btn sm gho rm" type="button" id="rm-build">Remove</button></div>' :
        '<button class="upload" type="button" id="up-build"><div class="up-ic">' + ic('upload', 'lg') + '</div>Add your XR build package<br><span style="font-size:12px;color:var(--text-3)">Package requirements will be confirmed by the platform team.</span></button>') +
      '</div>' +
      '<div class="field"><label>Supporting assets</label>' +
      '<button class="upload" type="button" id="up-assets" style="padding:14px">Add previews or data sheets (optional)</button></div>' +
      '</div></section>' +

      '<section class="card"><div class="chead"><h3>3 · Metadata &amp; documentation</h3><span class="cnote">fields are SAMPLE — schema pending</span></div><div class="cbody">' +
      '<div class="frow">' +
      '<div class="field"><label for="in-dev">Example supported device</label>' +
      '<select id="in-dev">' + ['Meta Quest', 'Supported MR device', 'Android / iOS device', 'Web browser'].map(function (d) { return '<option' + (vals.device === d ? ' selected' : '') + '>' + d + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="in-ver">Version label</label><input type="text" id="in-ver" value="v' + (editing ? sub.version : 1) + '" readonly style="background:var(--raised)"></div></div>' +
      '<div class="field" id="f-docs"><label>Instructor / lab documentation <span class="req" aria-hidden="true">*</span></label>' +
      (vals.docs && vals.docs.length ?
        vals.docs.map(function (d, i) { return '<div class="upfile" style="margin-bottom:8px">' + ic('file') + '<span>' + esc(d.name) + '</span><span class="fsize">' + esc(d.size) + '</span></div>'; }).join('') +
        '<button class="upload" type="button" id="up-docs" style="padding:12px;margin-top:4px">Add another document</button>'
        : '<button class="upload" type="button" id="up-docs" style="padding:14px">Add documentation (PDF)</button>') +
      '</div>' +
      '</div></section>' +

      '<div style="display:flex; gap:10px; align-items:center">' +
      (correcting ?
        '<button class="btn pri lg" type="button" id="btn-resubmit">' + ic('refresh') + 'Resubmit for review</button>' :
        '<button class="btn sec" type="button" id="btn-savedraft">Save draft</button>' +
        '<button class="btn pri" type="button" id="btn-submit">' + ic('send') + 'Submit for review</button>') +
      '<a class="btn gho" href="' + (editing ? '#/vendor/submission/' + editId : '#/vendor/submissions') + '">Cancel</a>' +
      '</div>' +
      '</div>' +

      '<div class="stack">' +
      '<section class="card"><div class="chead"><h3>What happens next</h3></div><div class="cbody" style="font-size:13.5px;color:var(--text-2);line-height:1.7">' +
      (correcting ?
        'Resubmitting sends this back to the gate that returned it — <strong>' + (sub.returnedGate === 'content' ? 'Content Readiness Review' : 'Academic Review') + '</strong>. Earlier decisions stay in the review history.' :
        'Submitting sends this to <strong>Academic Review</strong>. You can follow its status at every stage and you’ll see the reason if changes are requested. Publication itself is handled by the Content Manager once academic validation is complete.') +
      '</div></section>' +
      (editing ? historyCard(sub) : '') +
      '</div></div>';
    return shell('vendor', '#/vendor/new', crumbs([{ label: 'Submissions', href: '#/vendor/submissions' }, { label: correcting ? 'Correct submission' : editing ? 'Edit draft' : 'New Submission' }]), content);
  }

  function bindVendorForm(editId) {
    var editing = !!editId, sub = editing ? S.subs[editId] : null;
    var correcting = editing && (sub.status === 'changes_academic' || sub.status === 'changes_content');
    /* Sample files added on this form instance only — scoped to the form so nothing
       carries over into the next submission the vendor starts. */
    var pendingBuild = null, pendingDocs = [];

    function collect() {
      return {
        title: document.getElementById('in-title').value.trim(),
        discipline: document.getElementById('in-disc').value,
        fmt: document.getElementById('in-fmt').value,
        device: document.getElementById('in-dev').value,
        desc: document.getElementById('in-desc').value.trim(),
        build: pendingBuild,
        docs: pendingDocs
      };
    }
    function showErrors(errs, heading) {
      document.querySelectorAll('.field.invalid').forEach(function (el) { el.classList.remove('invalid'); });
      document.querySelectorAll('.ferr').forEach(function (el) { el.remove(); });
      var box = document.getElementById('form-errors'); box.innerHTML = '';
      if (!errs.length) return true;
      box.innerHTML = '<div class="alert danger" role="alert" tabindex="-1" id="errsum">' + ic('alertCirc') +
        '<div><div class="at">' + esc(heading) + '</div><ul style="margin:4px 0 0 16px;padding:0">' +
        errs.map(function (e) { return '<li>' + esc(e.m) + '</li>'; }).join('') + '</ul></div></div>';
      errs.forEach(function (e) {
        var fld = document.getElementById(e.f);
        if (fld) { fld.classList.add('invalid'); fld.insertAdjacentHTML('beforeend', '<div class="ferr">' + ic('alertCirc', 'sm') + esc(e.m) + '</div>'); }
      });
      document.getElementById('errsum').focus();
      return false;
    }
    function validate(v) {
      var errs = [];
      if (!v.title) errs.push({ f: 'f-title', m: 'Enter a submission title.' });
      if (!v.desc) errs.push({ f: 'f-desc', m: 'Enter a description.' });
      var hasBuild = editing ? (!!sub.build || !!pendingBuild) : !!pendingBuild;
      if (!hasBuild) errs.push({ f: 'f-build', m: 'Add the XR build package.' });
      return showErrors(errs, 'The submission can’t be sent yet');
    }
    /* A draft only needs a name — it is not going anywhere yet. */
    function validateDraft(v) {
      return showErrors(v.title ? [] : [{ f: 'f-title', m: 'Enter a submission title.' }], 'The draft needs a title');
    }
    /* Apply the entered values and return the id they belong to. Editing updates that
       record in place; a new submission creates its own — a seeded record is never reused
       as a container for someone else's submission. */
    function persist(v) {
      if (!editing) return createSub(v);
      sub.title = v.title || sub.title; sub.discipline = v.discipline || sub.discipline;
      sub.fmt = v.fmt; sub.device = v.device; sub.desc = v.desc || sub.desc;
      if (v.build && !sub.build) sub.build = v.build;
      v.docs.forEach(function (d) { sub.docs.push(d); });
      pendingDocs = [];
      save();
      return editId;
    }

    /* Sample file names follow the title the vendor typed, so a new submission never
       inherits another experiment's file names. */
    function titledName(subject) {
      var el = document.getElementById('in-title'), t = el ? el.value.trim() : '';
      return (t ? t + ' — ' : '') + subject;
    }
    var upB = document.getElementById('up-build');
    if (upB) upB.addEventListener('click', function () {
      pendingBuild = { name: titledName('XR build package (v1)'), size: '1.2 GB' };
      upB.outerHTML = '<div class="upfile">' + ic('box') + '<span>' + esc(pendingBuild.name) + '</span><span class="fsize">1.2 GB · sample file added</span></div>';
      toast('Sample build package added (no real upload happens in this prototype).', 'info');
    });
    var upD = document.getElementById('up-docs');
    if (upD) upD.addEventListener('click', function () {
      if (editing) { sub.docs.push({ name: 'Additional lab documentation.pdf', size: '1.0 MB' }); save(); render(); }
      else {
        var doc = { name: titledName('Instructor guide.pdf'), size: '2.4 MB' };
        pendingDocs.push(doc);
        upD.outerHTML = '<div class="upfile">' + ic('file') + '<span>' + esc(doc.name) + '</span><span class="fsize">2.4 MB · sample file added</span></div>';
        toast('Sample document added.', 'info');
      }
    });
    var upA = document.getElementById('up-assets');
    if (upA) upA.addEventListener('click', function () { toast('Sample asset added (visual only).', 'info'); });

    var bSave = document.getElementById('btn-savedraft');
    if (bSave) bSave.addEventListener('click', function () {
      var v = collect();
      if (editing) { persist(v); toast('Draft saved.', 'ok'); return; }
      if (!validateDraft(v)) return;
      var id = persist(v);
      toast('Draft saved — “' + v.title + '” is now in My Submissions.', 'ok');
      location.hash = '#/vendor/submission/' + id;
    });
    var bSubmit = document.getElementById('btn-submit');
    if (bSubmit) bSubmit.addEventListener('click', function () {
      var v = collect(); if (!validate(v)) return;
      openDialog({
        title: 'Submit for review?',
        body: '<p><strong>' + esc(v.title || (sub && sub.title) || 'This submission') + '</strong> will be sent to <strong>Academic Review</strong>. You won’t be able to edit it while it’s under review.</p>' +
          '<div class="consequence">' + ic('info') + '<span>You can follow its status and read reviewer feedback at every stage. If changes are requested, you’ll be able to correct and resubmit.</span></div>',
        confirmLabel: 'Submit for review',
        onConfirm: function () {
          var id = persist(v);
          submitSub(id);
          location.hash = '#/vendor/submission/' + id;
        }
      });
    });
    var bResub = document.getElementById('btn-resubmit');
    if (bResub) bResub.addEventListener('click', function () {
      var v = collect(); if (!validate(v)) return;
      var gate = sub.returnedGate === 'content' ? 'Content Readiness Review' : 'Academic Review';
      openDialog({
        title: 'Resubmit for review?',
        body: '<p><strong>' + esc(sub.title) + '</strong> will become <strong>v' + (sub.version + 1) + '</strong> and go back to <strong>' + gate + '</strong> — the gate that requested changes.</p>' +
          '<div class="consequence">' + ic('info') + '<span>Earlier decisions and comments stay visible in the review history. Resubmission never skips a review gate.</span></div>',
        confirmLabel: 'Resubmit',
        onConfirm: function () { persist(v); vendorResubmit(editId); location.hash = '#/vendor/submission/' + editId; }
      });
    });
  }

  /* ---------- S03 vendor submission detail ---------- */
  function viewVendorDetail(id) {
    var sub = S.subs[id];
    if (!sub) return shell('vendor', '#/vendor/submissions', '', '<p>Submission not found.</p>');
    var st = sub.status;
    var fb = '';
    if ((st === 'changes_academic' || st === 'changes_content') && sub.feedback) {
      fb = '<div class="feedback-panel">' +
        '<div class="fh">' + ic('ret') + 'Changes requested by the ' + esc(sub.feedback.role) + '</div>' +
        '<div class="fwho">' + esc(sub.feedback.by) + ' · ' + esc(sub.feedback.role) + ' · ' + esc(sub.feedback.when) + '</div>' +
        '<blockquote>“' + esc(sub.feedback.text) + '”</blockquote>' +
        '<div class="facts"><a class="btn pri" href="#/vendor/submission/' + id + '/edit">' + ic('edit') + 'Correct submission</a>' +
        '<span style="font-size:12.5px;color:var(--text-2)">After you resubmit, review resumes at ' + (sub.returnedGate === 'content' ? 'Content Readiness Review' : 'Academic Review') + '.</span></div></div>';
    }
    var statusInfo = '';
    if (st === 'draft') statusInfo = '<div class="alert info">' + ic('info') + '<div><div class="at">Draft — not yet submitted</div>Finish the details and submit when ready. It will go to Academic Review first.</div></div>';
    if (st === 'academic') statusInfo = '<div class="alert info">' + ic('eye') + '<div><div class="at">' + (sub.resubmitted ? 'Resubmitted — academic review resumed' : 'In Academic Review') + '</div>Your submission is with the Academic Reviewer. You’ll see the outcome and any comments here.</div></div>';
    if (st === 'content') statusInfo = '<div class="alert info">' + ic('listCheck') + '<div><div class="at">Academic validation complete — now in Content Readiness Review</div>The Content Manager is checking metadata, documentation and platform compatibility, and publishes once satisfied.</div></div>';
    if (st === 'publishing') statusInfo = '<div class="alert success">' + ic('check') + '<div><div class="at">Publishing to production</div>The Content Manager has released this experiment. It will be live shortly.</div></div>';
    if (st === 'published') statusInfo = '<div class="alert success">' + ic('check') + '<div><div class="at">Published' + (sub.publishedOn ? ' · ' + esc(sub.publishedOn) : '') + '</div>This experiment is live. Entitled learners and institutions can now access it.</div></div>';

    var actions = '';
    if (st === 'draft') actions = '<a class="btn pri" href="#/vendor/submission/' + id + '/edit">' + ic('edit') + 'Edit &amp; submit</a>';
    if (st === 'changes_academic' || st === 'changes_content') actions = '<a class="btn pri" href="#/vendor/submission/' + id + '/edit">' + ic('edit') + 'Correct submission</a>';

    var content =
      '<div class="phead"><div class="ptitles"><h1>' + esc(sub.title) + ' ' + statusBadge(sub) + resubChip(sub) + '</h1>' +
      '<div class="pmeta">' + vchip(sub) + '<span>·</span><span>' + esc(holderLine(sub, 'vendor')) + '</span></div></div>' +
      '<div class="pactions">' + actions + '</div></div>' +
      '<div class="grid-rail"><div class="stack">' +
      fb + statusInfo +
      submissionSummaryCard(sub) +
      buildDocsCard(sub) +
      '</div><div class="stack">' +
      '<section class="card"><div class="chead"><h3>Where it is</h3></div><div class="cbody">' + stepper(sub) + '</div></section>' +
      historyCard(sub) +
      '</div></div>';
    return shell('vendor', '#/vendor/submissions', crumbs([{ label: 'Submissions', href: '#/vendor/submissions' }, { label: sub.title }]), content);
  }

  /* ---------- S04 ARV queue + history ---------- */
  function viewArvQueue() {
    var q = Object.keys(S.subs).map(function (k) { return S.subs[k]; }).filter(function (s) { return s.status === 'academic'; });
    var rows = q.map(function (s) {
      return '<tr><td><a class="rowlink" href="#/arv/review/' + s.id + '"><span class="tmain">' + esc(s.title) + '</span></a>' +
        '<div class="tsub">' + esc(s.vendor) + '</div></td>' +
        '<td>' + fmtBadge(s.fmt) + '</td><td class="num">v' + s.version + '</td>' +
        '<td>' + (s.resubmitted ? '<span class="badge b-outline">' + ic('refresh', 'sm') + 'Resubmitted</span>' : '<span class="badge b-neutral">New</span>') + '</td>' +
        '<td>' + esc(queuedSince(s)) + '</td>' +
        '<td><a class="btn sm sec" href="#/arv/review/' + s.id + '">Review</a></td></tr>';
    }).join('');
    var table = q.length ?
      '<table class="dt"><caption class="sr-only">Submissions awaiting academic review</caption>' +
      '<thead><tr><th scope="col">Submission</th><th scope="col">Format</th><th scope="col">Version</th><th scope="col">Queue status</th><th scope="col">Waiting since</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' + rows + '</tbody></table>' :
      emptyState('listCheck', 'Nothing is waiting for academic review', 'New and resubmitted submissions appear here as soon as vendors send them.');
    var content =
      '<div class="phead"><div class="ptitles"><h1>Review Queue</h1>' +
      '<div class="pmeta">Submissions awaiting academic validation against curriculum standards.</div></div></div>' +
      '<div class="tablecard">' +
      '<div class="listbar"><div class="searchbox">' + ic('search') + '<input type="search" placeholder="Search queue" aria-label="Search review queue"></div>' +
      '<span class="lcount">' + q.length + ' awaiting review</span></div>' +
      table + '</div>';
    return shell('arv', '#/arv/queue', '', content);
  }

  function viewArvHistory() {
    var derived = [];
    Object.keys(S.subs).forEach(function (k) {
      S.subs[k].history.forEach(function (h) {
        if (h.role === 'Academic Reviewer') derived.push({ sub: S.subs[k].title, id: k, action: h.label, when: h.when, note: h.note || '' });
      });
    });
    var all = derived.concat(ARV_SEED_HISTORY.map(function (h) { return { sub: h.sub, action: h.action, when: h.when, note: h.note, id: null }; }));
    var rows = all.map(function (h) {
      var isRet = /Changes requested/.test(h.action);
      return '<tr><td>' + (h.id ? '<a class="rowlink" href="#/arv/review/' + h.id + '"><span class="tmain">' + esc(h.sub) + '</span></a>' : '<span class="tmain">' + esc(h.sub) + '</span>') + '</td>' +
        '<td>' + (isRet ? '<span class="badge b-warning">' + ic('ret', 'sm') + 'Changes requested</span>' : '<span class="badge b-success-o">' + ic('check', 'sm') + 'Validated</span>') + '</td>' +
        '<td>' + esc(h.when) + '</td><td style="max-width:340px">' + (h.note ? '<span class="tsub" style="font-style:italic">“' + esc(h.note) + '”</span>' : '—') + '</td></tr>';
    }).join('');
    var content =
      '<div class="phead"><div class="ptitles"><h1>Review History</h1>' +
      '<div class="pmeta">Your past academic review decisions, including returns. <span class="sample-tag">SAMPLE DESIGN DATA</span></div></div></div>' +
      '<div class="tablecard"><table class="dt"><caption class="sr-only">Past academic review decisions</caption>' +
      '<thead><tr><th scope="col">Submission</th><th scope="col">Decision</th><th scope="col">When</th><th scope="col">Reason / note</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div>';
    return shell('arv', '#/arv/history', '', content);
  }

  /* ---------- S05 / S07 review screens ---------- */
  function reviewTabs(sub, gate) {
    var tabs = [
      { id: 'overview', label: 'Overview & metadata' },
      { id: 'build', label: 'Build & assets' },
      { id: 'docs', label: 'Documentation' }
    ];
    var panels = {
      overview:
        '<dl class="kv">' +
        '<div class="k">Experiment</div><div class="v">' + esc(sub.experiment) + '</div>' +
        '<div class="k">Vendor</div><div class="v">' + esc(sub.vendor) + '</div>' +
        '<div class="k">XR format</div><div class="v">' + fmtBadge(sub.fmt) + '</div>' +
        '<div class="k">Example supported device</div><div class="v">' + esc(sub.device) + '</div>' +
        '<div class="k">Discipline</div><div class="v">' + esc(sub.discipline) + '</div>' +
        '<div class="k">Description</div><div class="v">' + esc(sub.desc) + '</div>' +
        '</dl>' +
        (gate === 'academic' ?
          '<div class="alert info" style="margin-top:14px">' + ic('book') + '<div><div class="at">Curriculum alignment</div>Assess this submission against the applicable academic/curriculum validation criteria. This screen records your decision and reason.</div></div>' : ''),
      build:
        '<ul class="filelist">' +
        (sub.build ? '<li><span class="ftile">' + ic('box') + '</span><span>' + esc(sub.build.name) + '</span><span class="fsize">' + esc(sub.build.size) + '</span></li>' : '<li style="color:var(--text-3)">No build attached.</li>') +
        '</ul><p style="font-size:12.5px;color:var(--text-3);margin-top:10px">Read-only. The reviewer examines the packaged build as submitted; execution happens in the staging environment, not in this portal view.</p>',
      docs:
        '<ul class="filelist">' +
        (sub.docs.length ? sub.docs.map(function (d) { return '<li><span class="ftile">' + ic('file') + '</span><span>' + esc(d.name) + '</span><span class="fsize">' + esc(d.size) + '</span></li>'; }).join('') : '<li style="color:var(--text-3)">No documentation attached.</li>') +
        '</ul>'
    };
    var order = ['overview', 'build', 'docs'];
    return '<section class="card"><div class="tabs" role="tablist" aria-label="Submission content">' +
      tabs.map(function (t, i) {
        return '<button role="tab" id="tab-' + t.id + '" aria-controls="panel-' + t.id + '" aria-selected="' + (i === 0 ? 'true' : 'false') + '" tabindex="' + (i === 0 ? '0' : '-1') + '">' + esc(t.label) + '</button>';
      }).join('') + '</div>' +
      order.map(function (tid, i) {
        return '<div role="tabpanel" id="panel-' + tid + '" aria-labelledby="tab-' + tid + '"' + (i === 0 ? '' : ' hidden') + '>' + panels[tid] + '</div>';
      }).join('') + '</section>';
  }
  function bindTabs() {
    var tabs = Array.prototype.slice.call(document.querySelectorAll('[role=tab]'));
    if (!tabs.length) return;
    function select(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      tab.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (ev) {
        var idx = i;
        if (ev.key === 'ArrowRight') { idx = (i + 1) % tabs.length; select(tabs[idx]); ev.preventDefault(); }
        if (ev.key === 'ArrowLeft') { idx = (i - 1 + tabs.length) % tabs.length; select(tabs[idx]); ev.preventDefault(); }
      });
    });
  }

  function requestChangesDialog(sub, gate) {
    var gateName = gate === 'academic' ? 'academic review' : 'content readiness review';
    var sample = gate === 'academic' ?
      'The lab procedure omits the shear-stage data capture required by the curriculum standard, and the assessment mapping is incomplete for objectives 2–3. Please revise the procedure section and update the metadata.' :
      'Metadata is incomplete: the supported-device entry is missing its firmware baseline, and the instructor guide PDF still carries a draft watermark. Please update both and resubmit.';
    openDialog({
      title: 'Request changes — ' + sub.title,
      body:
        '<div class="field" id="f-reason" style="margin-bottom:6px"><label for="in-reason">Reason &amp; comments for the vendor <span class="req" aria-hidden="true">*</span></label>' +
        '<textarea id="in-reason" placeholder="Explain what must change and why…"></textarea>' +
        '<p class="hint">The vendor sees this as the reason for changes. <button type="button" class="btn sm gho" id="fill-sample" style="height:24px;padding:0 6px">Insert sample reason</button></p></div>' +
        '<div class="consequence">' + ic('ret') + '<span>The submission returns to the vendor. When they correct and resubmit, ' + gateName + ' resumes here — it never skips ahead.</span></div>',
      confirmLabel: 'Send back to vendor',
      validate: function (root) {
        var ta = root.querySelector('#in-reason'), fld = root.querySelector('#f-reason');
        fld.classList.remove('invalid');
        var old = fld.querySelector('.ferr'); if (old) old.remove();
        if (!ta.value.trim()) {
          fld.classList.add('invalid');
          fld.insertAdjacentHTML('beforeend', '<div class="ferr">' + ic('alertCirc', 'sm') + 'A reason is required — the vendor needs to know what to change.</div>');
          ta.focus(); return false;
        }
        return true;
      },
      onConfirm: function (root) {
        var reason = root.querySelector('#in-reason').value.trim();
        if (gate === 'academic') { arvChanges(sub.id, reason); location.hash = '#/arv/queue'; }
        else { cmChanges(sub.id, reason); location.hash = '#/cm/queue'; }
      },
      afterOpen: function (root) {
        root.querySelector('#fill-sample').addEventListener('click', function () {
          root.querySelector('#in-reason').value = sample;
        });
      }
    });
  }

  function viewArvReview(id) {
    var sub = S.subs[id];
    if (!sub) return shell('arv', '#/arv/queue', '', '<p>Not found.</p>');
    var actionable = sub.status === 'academic';
    var notice = actionable ? '' :
      '<div class="alert info" style="margin-bottom:16px">' + ic('info') + '<div><div class="at">No academic review action available</div>This submission is currently in “' + esc(STATUS_LABEL[sub.status] || sub.status) + '”. It appears here read-only for reference.</div></div>';
    var decision = actionable ?
      '<section class="card"><div class="chead"><h3>Decision</h3></div><div class="cbody">' +
      '<p style="font-size:13px;color:var(--text-2);margin-bottom:12px">Academic review of <strong>v' + sub.version + '</strong>' + (sub.resubmitted ? ' (resubmitted)' : '') + '</p>' +
      '<div class="stack-sm">' +
      '<button class="btn pri blk" type="button" id="btn-validate">' + ic('check') + 'Validate — approve</button>' +
      '<button class="btn sec blk" type="button" id="btn-changes">' + ic('ret') + 'Request changes</button>' +
      '</div>' +
      '<p style="font-size:12.5px;color:var(--text-3);margin-top:12px">Approving sends this to Content Readiness Review. Requesting changes returns it to the vendor with your reason. Publication happens later, at the Content Manager gate.</p>' +
      '</div></section>' : '';
    var content =
      '<div class="phead"><div class="ptitles"><h1>' + esc(sub.title) + ' ' + statusBadge(sub) + resubChip(sub) + '</h1>' +
      '<div class="pmeta">' + vchip(sub) + '<span>·</span><span>' + esc(sub.vendor) + '</span><span>·</span><span>Academic validation — curriculum alignment</span></div></div></div>' +
      notice +
      '<div class="grid-rail"><div class="stack">' +
      reviewTabs(sub, 'academic') +
      '</div><div class="stack">' +
      decision +
      '<section class="card"><div class="chead"><h3>Where it is</h3></div><div class="cbody">' + stepper(sub) + '</div></section>' +
      historyCard(sub) +
      '</div></div>';
    return shell('arv', '#/arv/queue', crumbs([{ label: 'Review Queue', href: '#/arv/queue' }, { label: sub.title }]), content);
  }
  function bindArvReview(id) {
    var sub = S.subs[id];
    var bv = document.getElementById('btn-validate');
    if (bv) bv.addEventListener('click', function () {
      openDialog({
        title: 'Validate — approve this submission?',
        body: '<p><strong>' + esc(sub.title) + '</strong> (v' + sub.version + ') will be recorded as academically validated and move to <strong>Content Readiness Review</strong>.</p>' +
          '<div class="field" style="margin-top:12px"><label for="in-note">Note (optional)</label><textarea id="in-note" style="min-height:70px" placeholder="e.g. Curriculum alignment confirmed for objectives 1–4."></textarea></div>' +
          '<div class="consequence">' + ic('info') + '<span>Your decision is recorded in the review history. This does not publish the experiment.</span></div>',
        confirmLabel: 'Validate — approve',
        onConfirm: function (root) {
          arvApprove(id, root.querySelector('#in-note').value.trim());
          location.hash = '#/arv/queue';
        }
      });
    });
    var bc = document.getElementById('btn-changes');
    if (bc) bc.addEventListener('click', function () { requestChangesDialog(sub, 'academic'); });
  }

  /* ---------- S06 CM queue + history ---------- */
  function viewCmQueue() {
    var q = Object.keys(S.subs).map(function (k) { return S.subs[k]; }).filter(function (s) { return s.status === 'content'; });
    var rows = q.map(function (s) {
      var acad = null;
      for (var i = 0; i < s.history.length; i++) if (s.history[i].t === 'validated') { acad = s.history[i]; break; }
      return '<tr><td><a class="rowlink" href="#/cm/review/' + s.id + '"><span class="tmain">' + esc(s.title) + '</span></a>' +
        '<div class="tsub">' + esc(s.vendor) + '</div></td>' +
        '<td>' + fmtBadge(s.fmt) + '</td><td class="num">v' + s.version + '</td>' +
        '<td>' + (acad ? '<span class="badge b-success-o">' + ic('check', 'sm') + 'Validated</span><div class="tsub">' + esc(acad.when) + '</div>' : '—') + '</td>' +
        '<td>' + (s.resubmitted ? '<span class="badge b-outline">' + ic('refresh', 'sm') + 'Resubmitted</span>' : '<span class="badge b-neutral">New</span>') + '</td>' +
        '<td><a class="btn sm sec" href="#/cm/review/' + s.id + '">Review</a></td></tr>';
    }).join('');
    var table = q.length ?
      '<table class="dt"><caption class="sr-only">Submissions awaiting content readiness review</caption>' +
      '<thead><tr><th scope="col">Submission</th><th scope="col">Format</th><th scope="col">Version</th><th scope="col">Academic validation</th><th scope="col">Queue status</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' + rows + '</tbody></table>' :
      emptyState('listCheck', 'Nothing is waiting for readiness review', 'Submissions arrive here after academic validation is complete, ready for review and publication.');
    var content =
      '<div class="phead"><div class="ptitles"><h1>Content Review Queue</h1>' +
      '<div class="pmeta">Academically validated submissions awaiting readiness review — metadata, documentation and compatibility — and publication.</div></div></div>' +
      '<div class="tablecard"><div class="listbar"><div class="searchbox">' + ic('search') + '<input type="search" placeholder="Search queue" aria-label="Search content review queue"></div>' +
      '<span class="lcount">' + q.length + ' awaiting readiness review</span></div>' + table + '</div>';
    return shell('cm', '#/cm/queue', '', content);
  }

  function viewCmHistory() {
    var derived = [];
    Object.keys(S.subs).forEach(function (k) {
      S.subs[k].history.forEach(function (h) {
        if (h.role === 'Content Manager') derived.push({ sub: S.subs[k].title, id: k, action: h.label, when: h.when, note: h.note || '' });
      });
    });
    var all = derived.concat(CM_SEED_HISTORY.map(function (h) { return { sub: h.sub, action: h.action, when: h.when, note: h.note, id: null }; }));
    var rows = all.map(function (h) {
      var isRet = /Changes requested/.test(h.action), isPub = /Published/.test(h.action);
      var badge = isRet ? '<span class="badge b-warning">' + ic('ret', 'sm') + 'Changes requested</span>' :
        isPub ? '<span class="badge b-published">' + ic('check', 'sm') + 'Published</span>' :
          '<span class="badge b-success-o">' + ic('check', 'sm') + 'Readiness approved</span>';
      return '<tr><td>' + (h.id ? '<a class="rowlink" href="#/cm/review/' + h.id + '"><span class="tmain">' + esc(h.sub) + '</span></a>' : '<span class="tmain">' + esc(h.sub) + '</span>') + '</td>' +
        '<td>' + badge + '</td>' +
        '<td>' + esc(h.when) + '</td><td style="max-width:340px">' + (h.note ? '<span class="tsub" style="font-style:italic">“' + esc(h.note) + '”</span>' : '—') + '</td></tr>';
    }).join('');
    var content =
      '<div class="phead"><div class="ptitles"><h1>Reviewed Content</h1>' +
      '<div class="pmeta">Your past readiness and publication decisions, including returns. <span class="sample-tag">SAMPLE DESIGN DATA</span></div></div></div>' +
      '<div class="tablecard"><table class="dt"><caption class="sr-only">Past content readiness decisions</caption>' +
      '<thead><tr><th scope="col">Submission</th><th scope="col">Decision</th><th scope="col">When</th><th scope="col">Reason / note</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div>';
    return shell('cm', '#/cm/history', '', content);
  }

  /* ---------- S07 CM review ---------- */
  function viewCmReview(id) {
    var sub = S.subs[id];
    if (!sub) return shell('cm', '#/cm/queue', '', '<p>Not found.</p>');
    var actionable = sub.status === 'content';
    var acad = null;
    for (var i = 0; i < sub.history.length; i++) if (sub.history[i].t === 'validated') { acad = sub.history[i]; break; }
    var releasing = sub.status === 'publishing', live = sub.status === 'published';
    var notice = (actionable || releasing || live) ? '' :
      '<div class="alert info" style="margin-bottom:16px">' + ic('info') + '<div><div class="at">No readiness action available</div>This submission is currently in “' + esc(STATUS_LABEL[sub.status] || sub.status) + '”. It appears here read-only for reference.</div></div>';
    var acadCard = '<section class="card"><div class="chead"><h3>Academic validation record</h3><span class="cnote">read-only — owned by the Academic Reviewer</span></div><div class="cbody">' +
      (acad ?
        '<div class="alert success">' + ic('check') + '<div><div class="at">Academically validated</div>' + esc(acad.actor) + ' · ' + esc(acad.role) + ' · ' + esc(acad.when) +
        (acad.note ? '<div style="margin-top:6px;font-style:italic">“' + esc(acad.note) + '”</div>' : '') + '</div></div>' :
        '<p style="font-size:13px;color:var(--text-3)">No academic validation recorded.</p>') +
      '</div></section>';
    var checklist = actionable ?
      '<section class="card"><div class="chead"><h3>Readiness review</h3><span class="cnote">criteria are SAMPLE</span></div><div class="cbody">' +
      '<div class="checkrow"><input type="checkbox" id="ck1" checked><label for="ck1">Metadata complete and accurate (title, discipline, format, device)</label></div>' +
      '<div class="checkrow"><input type="checkbox" id="ck2" checked><label for="ck2">Documentation present and final (instructor guide, lab procedure)</label></div>' +
      '<div class="checkrow"><input type="checkbox" id="ck3" checked><label for="ck3">Platform compatibility recorded (format, device, version)</label></div>' +
      '</div></section>' : '';
    /* PM publication correction: this gate publishes. There is no onward hand-off. */
    var decision = '';
    if (actionable) {
      decision = '<section class="card"><div class="chead"><h3>Decision</h3></div><div class="cbody">' +
        '<p style="font-size:13px;color:var(--text-2);margin-bottom:12px">Readiness review of <strong>v' + sub.version + '</strong>' + (sub.resubmitted ? ' (resubmitted)' : '') + '</p>' +
        '<div class="stack-sm">' +
        '<button class="btn pri blk" type="button" id="btn-publish">' + ic('send') + 'Publish to production</button>' +
        '<button class="btn sec blk" type="button" id="btn-changes">' + ic('ret') + 'Request changes</button>' +
        '</div>' +
        '<p style="font-size:12.5px;color:var(--text-3);margin-top:12px">Publishing releases the experiment to production. It is only reachable once academic validation is recorded.</p>' +
        '</div></section>';
    } else if (releasing) {
      decision = '<section class="card"><div class="chead"><h3>Publishing…</h3></div><div class="cbody">' +
        '<div class="progressbar" role="progressbar" aria-label="Publishing to production"><span id="pubbar" style="width:10%"></span></div>' +
        '<p style="font-size:12.5px;color:var(--text-3);margin-top:10px">Releasing to production. This experiment will become available to entitled learners and institutions.</p></div></section>';
    } else if (live) {
      decision = '<section class="card"><div class="chead"><h3>Published</h3></div><div class="cbody">' +
        '<div class="alert success">' + ic('check') + '<div><div class="at">Live in production' + (sub.publishedOn ? ' · ' + esc(sub.publishedOn) : '') + '</div>Entitled learners and institutions can now access this experiment.</div></div>' +
        '<div style="margin-top:12px" class="stack-sm"><a class="btn sec blk" href="#/cm/published">View Published Content</a></div>' +
        '</div></section>';
    }
    var content =
      '<div class="phead"><div class="ptitles"><h1>' + esc(sub.title) + ' ' + statusBadge(sub) + resubChip(sub) + '</h1>' +
      '<div class="pmeta">' + vchip(sub) + '<span>·</span><span>' + esc(sub.vendor) + '</span><span>·</span><span>Content readiness — metadata · documentation · compatibility</span></div></div></div>' +
      notice +
      '<div class="grid-rail"><div class="stack">' +
      acadCard + checklist + reviewTabs(sub, 'content') +
      '</div><div class="stack">' +
      decision +
      '<section class="card"><div class="chead"><h3>Where it is</h3></div><div class="cbody">' + stepper(sub) + '</div></section>' +
      historyCard(sub) +
      '</div></div>';
    return shell('cm', '#/cm/queue', crumbs([{ label: 'Review Queue', href: '#/cm/queue' }, { label: sub.title }]), content);
  }
  function bindCmReview(id) {
    var sub = S.subs[id];
    var br = document.getElementById('btn-publish');
    if (br) br.addEventListener('click', function () {
      openDialog({
        title: 'Publish to production?',
        body: '<p><strong>' + esc(sub.title) + '</strong> (v' + sub.version + ') will be released to production. It becomes available for institutional licensing and to entitled learners.</p>' +
          '<div class="field" style="margin-top:12px"><label for="in-note">Note (optional)</label><textarea id="in-note" style="min-height:70px" placeholder="e.g. Metadata and documentation verified."></textarea></div>' +
          '<div class="consequence">' + ic('info') + '<span>Academic validation is recorded, and your readiness decision is recorded with it. Publication cannot be reached before academic validation.</span></div>',
        confirmLabel: 'Publish to production',
        onConfirm: function (root) { cmPublish(id, root.querySelector('#in-note').value.trim()); }
      });
    });
    var bc = document.getElementById('btn-changes');
    if (bc) bc.addEventListener('click', function () { requestChangesDialog(sub, 'content'); });
  }

  /* ---------- S09 published content (Content Manager — publisher of record) ---------- */
  function viewCmPublished() {
    var pubs = Object.keys(S.subs).map(function (k) { return S.subs[k]; }).filter(function (s) { return s.status === 'published'; });
    var staticRows = [
      { title: 'Surveying — Total Station Basics', vendor: 'Sample Labs Collective', fmt: 'Web', version: 'v1', when: '05 Aug 2026' },
      { title: 'Fluid Mechanics — Bernoulli Flow Visualisation', vendor: 'Sample Labs Collective', fmt: 'Web', version: 'v3', when: '03 Aug 2026' }
    ];
    var rows = pubs.map(function (s) {
      return '<tr><td><a class="rowlink" href="#/cm/review/' + s.id + '"><span class="tmain">' + esc(s.title) + '</span></a><div class="tsub">' + esc(s.vendor) + '</div></td>' +
        '<td>' + fmtBadge(s.fmt) + '</td><td class="num">v' + s.version + '</td><td>' + esc(s.publishedOn || '—') + '</td>' +
        '<td><span class="badge b-published">' + ic('check', 'sm') + 'Published</span></td></tr>';
    }).join('') + staticRows.map(function (s) {
      return '<tr><td><span class="tmain">' + esc(s.title) + '</span><div class="tsub">' + esc(s.vendor) + '</div></td>' +
        '<td>' + fmtBadge(s.fmt) + '</td><td class="num">' + s.version + '</td><td>' + esc(s.when) + '</td>' +
        '<td><span class="badge b-published">' + ic('check', 'sm') + 'Published</span></td></tr>';
    }).join('');
    var content =
      '<div class="phead"><div class="ptitles"><h1>Published Content</h1>' +
      '<div class="pmeta">Experiments you have released to production. <span class="sample-tag">SAMPLE DESIGN DATA</span></div></div></div>' +
      '<div class="tablecard"><div class="listbar"><div class="searchbox">' + ic('search') + '<input type="search" placeholder="Search published content" aria-label="Search published content"></div>' +
      '<span class="lcount">' + (pubs.length + staticRows.length) + ' published</span></div>' +
      '<table class="dt"><caption class="sr-only">Published experiments</caption>' +
      '<thead><tr><th scope="col">Experiment</th><th scope="col">Format</th><th scope="col">Version</th><th scope="col">Published</th><th scope="col">Status</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div>';
    return shell('cm', '#/cm/published', '', content);
  }

  /* ---------- S11 learner my learning ---------- */
  function expStatusChip(e) {
    if (e.ent === 'none') return '<span class="badge b-neutral">Not included</span>';
    if (e.ent === 'denied') return '<span class="badge b-danger">' + ic('alertCirc', 'sm') + 'Access issue</span>';
    if (e.dev === 'unsupported') return '<span class="badge b-warning">' + ic('alertTri', 'sm') + 'Device not supported</span>';
    if (e.progress === 'completed') return '<span class="badge b-published">' + ic('check', 'sm') + 'Completed</span>';
    if (e.xr === 'completion_pending') return '<span class="badge b-warning">' + ic('hourglass', 'sm') + 'Completion pending</span>';
    if (e.xr === 'ready') return '<span class="badge b-success">' + ic('check', 'sm') + 'Ready on device</span>';
    if (e.xr === 'pending') return '<span class="badge b-info">' + ic('clock', 'sm') + 'Availability pending</span>';
    if (e.xr === 'failed') return '<span class="badge b-danger">' + ic('alertCirc', 'sm') + 'Availability failed</span>';
    if (e.progress === 'in_progress') return '<span class="badge b-info">' + ic('activity', 'sm') + 'In progress</span>';
    return '<span class="badge b-neutral">Not started</span>';
  }
  function viewLearnerHome() {
    var order = ['shear', 'bernoulli', 'torsion', 'consolidation'];
    var rows = order.map(function (k) {
      var e = S.exps[k];
      return '<tr><td><a class="rowlink" href="#/learner/experiment/' + e.id + '"><span class="tmain">' + esc(e.name) + '</span></a>' +
        '<div class="tsub">' + esc(e.deviceLine) + '</div></td>' +
        '<td>' + fmtBadge(e.fmt) + '</td>' +
        '<td>' + expStatusChip(e) + '</td>' +
        '<td><a class="btn sm sec" href="#/learner/experiment/' + e.id + '">Open</a></td></tr>';
    }).join('');
    var done = S.exps.surveying;
    var content =
      '<div class="phead"><div class="ptitles"><h1>My Learning</h1>' +
      '<div class="pmeta">XR experiments included in your access at Sample Engineering Institute.</div></div></div>' +
      '<div class="tablecard" style="margin-bottom:20px">' +
      '<div class="listbar"><h2 style="font-size:14px;font-weight:650">Your experiments</h2><span class="lcount">' + order.length + ' available</span></div>' +
      '<table class="dt"><caption class="sr-only">Entitled experiments</caption>' +
      '<thead><tr><th scope="col">Experiment</th><th scope="col">Format</th><th scope="col">Status</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div>' +

      '<div class="tablecard" style="margin-bottom:20px">' +
      '<div class="listbar"><h2 style="font-size:14px;font-weight:650">Completed</h2></div>' +
      '<table class="dt"><caption class="sr-only">Completed experiments</caption><tbody>' +
      '<tr><td><a class="rowlink" href="#/learner/experiment/surveying"><span class="tmain">' + esc(done.name) + '</span></a>' +
      '<div class="tsub">Completed ' + esc(done.completedOn) + '</div></td><td>' + fmtBadge(done.fmt) + '</td>' +
      '<td><span class="badge b-published">' + ic('check', 'sm') + 'Completed</span></td>' +
      '<td><a class="btn sm gho" href="#/learner/experiment/surveying">Open</a></td></tr>' +
      (S.exps.shear.progress === 'completed' ? '' : '') +
      '</tbody></table></div>' +

      '<div class="tablecard">' +
      '<div class="listbar"><h2 style="font-size:14px;font-weight:650">Also at your institution</h2><span class="lcount">not in your current access</span></div>' +
      '<table class="dt"><caption class="sr-only">Experiments not included in your access</caption><tbody>' +
      '<tr><td><a class="rowlink" href="#/learner/experiment/heatxl"><span class="tmain">' + esc(S.exps.heatxl.name) + '</span></a>' +
      '<div class="tsub">Not included in your current access</div></td><td>' + fmtBadge('VR') + '</td>' +
      '<td><span class="badge b-neutral">Not included</span></td>' +
      '<td><a class="btn sm gho" href="#/learner/experiment/heatxl">Details</a></td></tr>' +
      '</tbody></table></div>';
    return shell('learner', '#/learner/my-learning', '', content);
  }

  /* ---------- S12 experiment detail ---------- */
  function xrLadder(e) {
    var rows = [];
    // entitlement
    if (e.ent === 'active') {
      rows.push({ cls: 'ok', icon: 'check', t: 'Access', stat: 'Confirmed', d: 'Included in your institution’s access.' });
    } else if (e.ent === 'none') {
      rows.push({ cls: '', icon: 'shield', t: 'Access', stat: 'Not included', d: 'This experiment isn’t part of your current access. Contact your institution administrator if you think it should be.' });
    } else if (e.ent === 'denied') {
      rows.push({ cls: 'bad', icon: 'alertCirc', t: 'Access', stat: 'Denied', d: 'Your access couldn’t be confirmed when it was checked. This can happen when a licence changes or expires.' });
    }
    // device
    if (e.ent === 'active' || e.ent === 'denied') {
      if (e.fmt === 'Web') {
        rows.push({ cls: 'ok', icon: 'monitor', t: 'Device', stat: 'Web browser', d: 'Runs in your browser — no XR hardware needed.' });
      } else if (e.dev === 'supported') {
        rows.push({ cls: e.ent === 'active' ? 'ok' : 'dim', icon: 'headset', t: 'Device compatibility', stat: 'Supported', d: esc(e.deviceLine) + '.' });
      } else {
        rows.push({ cls: 'warn', icon: 'alertTri', t: 'Device compatibility', stat: 'Not supported', d: 'This experiment needs an MR device. A supported MR device isn’t currently available for your account — contact your institution about device availability.' });
      }
    }
    return '<div class="ladder">' + rows.map(function (r) {
      return '<div class="lrow ' + r.cls + '"><span class="lnode" aria-hidden="true">' + ic(r.icon) + '</span>' +
        '<div class="lbody"><div class="lt">' + r.t + '<span class="lstat">' + r.stat + '</span></div><div class="ld">' + r.d + '</div></div></div>';
    }).join('') + '</div>';
  }

  function viewLearnerExp(id) {
    var e = S.exps[id];
    if (!e) return shell('learner', '#/learner/my-learning', '', '<p>Not found.</p>');
    var rail = '';
    var mainExtras = '';

    if (e.ent === 'none') {
      rail = '<section class="card"><div class="chead"><h3>XR access</h3></div><div class="cbody">' + xrLadder(e) +
        '<p style="font-size:12.5px;color:var(--text-3);margin-top:10px">No device actions are available for content outside your access.</p></div></section>';
    } else if (e.ent === 'denied') {
      rail = '<section class="card"><div class="chead"><h3>XR access</h3></div><div class="cbody">' + xrLadder(e) +
        '<div class="stack-sm" style="margin-top:12px">' +
        '<button class="btn sec blk" type="button" id="btn-recheck">' + ic('refresh') + 'Check access again</button>' +
        '</div>' +
        '<p style="font-size:12.5px;color:var(--text-3);margin-top:10px">If this keeps happening, contact your institution administrator — they manage access for your account.</p></div></section>';
    } else if (e.fmt === 'Web') {
      var webDone = e.progress === 'completed';
      rail = '<section class="card"><div class="chead"><h3>Simulation</h3></div><div class="cbody">' + xrLadder(e) +
        '<div class="stack-sm" style="margin-top:12px">' +
        (webDone ?
          '<div class="alert success">' + ic('check') + '<div><div class="at">Completed' + (e.completedOn ? ' · ' + esc(e.completedOn) : '') + '</div>Your progress is up to date.</div></div>' :
          '<a class="btn sim blk" href="#/learner/experiment/' + e.id + '/run">' + ic('play') + 'Launch simulation</a>') +
        '</div>' +
        (webDone ? '' : '<p style="font-size:12.5px;color:var(--text-3);margin-top:10px">Web simulations run inside the portal; completion is recorded when you finish.</p>') +
        '</div></section>';
    } else if (e.dev === 'unsupported') {
      rail = '<section class="card"><div class="chead"><h3>XR access</h3></div><div class="cbody">' + xrLadder(e) +
        '<p style="font-size:12.5px;color:var(--text-3);margin-top:10px">No launch control is shown for a device that can’t run this experiment.</p></div></section>';
    } else {
      // supported XR (hero)
      var xr = e.xr;
      var cta = '';
      if (xr === 'none') {
        cta = '<button class="btn pri blk" type="button" id="btn-getdev">' + ic('headset') + 'Get on device</button>' +
          '<p style="font-size:12.5px;color:var(--text-3);margin-top:10px">Makes this experiment available on your supported device. You’ll see its availability status here.</p>';
      } else {
        var line =
          xr === 'pending' ? '<span class="badge b-info">' + ic('clock', 'sm') + 'Availability pending</span>' :
          xr === 'ready' ? '<span class="badge b-success">' + ic('check', 'sm') + 'Ready on device</span>' :
          xr === 'failed' ? '<span class="badge b-danger">' + ic('alertCirc', 'sm') + 'Availability failed</span>' :
          xr === 'unknown' ? '<span class="badge b-warning">' + ic('alertTri', 'sm') + 'Availability unknown</span>' :
          xr === 'completion_pending' ? '<span class="badge b-warning">' + ic('hourglass', 'sm') + 'Completion pending</span>' :
          '<span class="badge b-success">' + ic('check', 'sm') + 'Completion received</span>';
        cta = '<div style="margin-bottom:10px">' + line + '</div>' +
          '<a class="btn sec blk" href="#/learner/experiment/' + e.id + '/device">View device access</a>';
      }
      rail = '<section class="card"><div class="chead"><h3>XR access</h3></div><div class="cbody">' + xrLadder(e) +
        '<div style="margin-top:14px">' + cta + '</div></div></section>';
    }

    var progressCard = '';
    if (e.progress === 'completed') {
      progressCard = '<section class="card"><div class="chead"><h3>Completion</h3></div><div class="cbody">' +
        '<div class="alert success">' + ic('check') + '<div><div class="at">Completed' + (e.completedOn ? ' · ' + esc(e.completedOn) : '') + '</div>Recorded to your account. <a href="#/learner/progress">View progress</a></div></div></div></section>';
    } else if (e.xr === 'completion_pending') {
      progressCard = '<section class="card"><div class="chead"><h3>Completion</h3></div><div class="cbody">' +
        '<div class="alert warning">' + ic('hourglass') + '<div><div class="at">Completion pending</div>Your session ended on the device, but the platform hasn’t received the completion record yet. This is normal shortly after a session. <a href="#/learner/experiment/' + e.id + '/device">Check status</a></div></div></div></section>';
    }

    var content =
      '<div class="phead"><div class="ptitles"><h1>' + esc(e.name) + ' ' + fmtBadge(e.fmt) + '</h1>' +
      '<div class="pmeta"><span>' + esc(e.deviceLine) + '</span></div></div></div>' +
      '<div class="grid-rail"><div class="stack">' +
      '<section class="card"><div class="chead"><h3>About this experiment</h3><span class="cnote"><span class="sample-tag">SAMPLE DESIGN DATA</span></span></div>' +
      '<div class="cbody"><p style="font-size:14px;color:var(--text-2);line-height:1.7">' + esc(e.desc) + '</p></div></section>' +
      '<section class="card"><div class="chead"><h3>Learning components</h3></div><div class="cbody">' +
      '<ul class="filelist">' +
      (e.resources || []).map(function (r) { return '<li><span class="ftile">' + ic('file') + '</span><span>' + esc(r) + '</span><span class="fsize">resource</span></li>'; }).join('') +
      '<li><span class="ftile">' + ic(e.fmt === 'Web' ? 'monitor' : 'headset') + '</span><span>Simulation — ' + esc(e.fmt) + (e.fmt === 'Web' ? ' (runs in your browser)' : ' (runs on a supported device — not in this browser)') + '</span><span class="fsize">simulation</span></li>' +
      '<li><span class="ftile">' + ic('listCheck') + '</span><span>Assessment — configured by your institution</span><span class="fsize">assessment</span></li>' +
      '</ul>' +
      '<p style="font-size:12.5px;color:var(--text-3);margin-top:10px">Components follow your institution’s learning sequence: resources → simulation → assessment.</p>' +
      '</div></section>' +
      mainExtras +
      '</div><div class="stack">' + rail + progressCard + '</div></div>';
    return shell('learner', '#/learner/my-learning', crumbs([{ label: 'My Learning', href: '#/learner/my-learning' }, { label: e.name }]), content);
  }
  function bindLearnerExp(id) {
    var bg = document.getElementById('btn-getdev');
    if (bg) bg.addEventListener('click', function () {
      xrGetOnDevice();
      location.hash = '#/learner/experiment/' + id + '/device';
    });
    var br = document.getElementById('btn-recheck');
    if (br) br.addEventListener('click', function () {
      toast('Access is still denied for this experiment (sample state). Your institution administrator can restore it.', 'info');
    });
  }

  /* ---------- S13 device access ---------- */
  function viewDeviceAccess(id) {
    var e = S.exps[id];
    if (!e || e.fmt === 'Web') { location.hash = '#/learner/experiment/' + id; return ''; }
    var xr = e.xr;
    var ladder = [];
    ladder.push({ cls: 'ok', icon: 'check', t: 'Access confirmed', stat: '', d: 'Included in your institution’s access (Sample Engineering Institute).' });
    ladder.push({ cls: 'ok', icon: 'headset', t: 'Device supported', stat: '', d: esc(e.deviceLine) + '.' });

    if (xr === 'none') {
      ladder.push({ cls: 'cur', icon: 'arrR', t: 'Get on device', stat: 'Next step', d: 'Make this experiment available on your supported device.' });
      ladder.push({ cls: 'dim', icon: 'play', t: 'Run on your device', stat: '', d: 'Once it’s ready, put on your supported headset and open the experiment there.' });
      ladder.push({ cls: 'dim', icon: 'activity', t: 'Completion', stat: '', d: 'Recorded to your account after the platform receives it.' });
    } else if (xr === 'pending') {
      ladder.push({ cls: 'cur', icon: 'clock', t: 'Availability pending', stat: 'In progress', d: 'We’re making this experiment available for your device. This can take a little while — you can leave this page and come back.' });
      ladder.push({ cls: 'dim', icon: 'play', t: 'Run on your device', stat: '', d: 'Once it’s ready, put on your supported headset and open the experiment there.' });
      ladder.push({ cls: 'dim', icon: 'activity', t: 'Completion', stat: '', d: 'Recorded to your account after the platform receives it.' });
    } else if (xr === 'ready') {
      ladder.push({ cls: 'ok', icon: 'check', t: 'Ready on device', stat: 'Ready', d: 'This experiment is available on your supported device.' });
      ladder.push({ cls: 'cur', icon: 'play', t: 'Run on your device', stat: 'Next step', d: 'Put on your supported headset and open the experiment there. The simulation runs on the device — not in this browser.' });
      ladder.push({ cls: 'dim', icon: 'activity', t: 'Completion', stat: '', d: 'After your session, completion reaches your account. You can check it here.' });
    } else if (xr === 'failed') {
      ladder.push({ cls: 'bad', icon: 'alertCirc', t: 'Availability failed', stat: 'Problem', d: 'We couldn’t make the experiment available this time. This is usually temporary.' });
    } else if (xr === 'unknown') {
      ladder.push({ cls: 'warn', icon: 'alertTri', t: 'Availability unknown', stat: 'Can’t confirm', d: 'We can’t confirm the current status — there may be a network problem. Your experiment may still be fine on the device.' });
    } else if (xr === 'completion_pending') {
      ladder.push({ cls: 'ok', icon: 'check', t: 'Ready on device', stat: '', d: 'The experiment is available on your supported device.' });
      ladder.push({ cls: 'ok', icon: 'play', t: 'Session ended', stat: '', d: 'A session finished on your device (sample).' });
      ladder.push({ cls: 'cur', icon: 'hourglass', t: 'Completion pending', stat: 'Waiting', d: 'The platform hasn’t received the completion record yet. This is normal shortly after a session — it isn’t an error.' });
    } else if (xr === 'completion_received') {
      ladder.push({ cls: 'ok', icon: 'check', t: 'Ready on device', stat: '', d: '' });
      ladder.push({ cls: 'ok', icon: 'play', t: 'Session complete', stat: '', d: '' });
      ladder.push({ cls: 'ok', icon: 'check', t: 'Completion received', stat: 'Done', d: 'Your completion has reached the platform and your progress is updated.' });
    }

    var ladderHTML = '<div class="ladder">' + ladder.map(function (r) {
      return '<div class="lrow ' + r.cls + '"><span class="lnode" aria-hidden="true">' + ic(r.icon) + '</span>' +
        '<div class="lbody"><div class="lt">' + r.t + (r.stat ? '<span class="lstat">' + r.stat + '</span>' : '') + '</div>' +
        (r.d ? '<div class="ld">' + r.d + '</div>' : '') + '</div></div>';
    }).join('') + '</div>';

    var actions = '';
    if (xr === 'none') actions = '<button class="btn pri blk" type="button" id="btn-getdev2">' + ic('headset') + 'Get on device</button>';
    if (xr === 'pending') actions =
      '<button class="btn sec blk" type="button" id="btn-refresh">' + ic('refresh') + 'Refresh status</button>' +
      '<p style="font-size:12.5px;color:var(--text-3);margin-top:10px">Status updates when you refresh — this page doesn’t continuously monitor your device.</p>';
    if (xr === 'ready') actions =
      '<div class="alert success" style="margin-bottom:10px">' + ic('check') + '<div><div class="at">Ready on your device</div>Put on your supported headset and open the experiment there.</div></div>' +
      '<button class="btn sec blk" type="button" id="btn-refresh">' + ic('refresh') + 'Refresh status</button>';
    if (xr === 'failed') actions =
      '<button class="btn pri blk" type="button" id="btn-retry">' + ic('refresh') + 'Try again</button>' +
      '<p style="font-size:12.5px;color:var(--text-3);margin-top:10px">If this keeps failing, check your connection first; if it still fails, contact support via Help.</p>';
    if (xr === 'unknown') actions =
      '<button class="btn pri blk" type="button" id="btn-refresh">' + ic('refresh') + 'Refresh status</button>' +
      '<p style="font-size:12.5px;color:var(--text-3);margin-top:10px">Check your internet connection and refresh. If the status still can’t be confirmed, try again later or contact support via Help.</p>';
    if (xr === 'completion_pending') actions =
      '<button class="btn pri blk" type="button" id="btn-refresh">' + ic('refresh') + 'Refresh status</button>' +
      '<p style="font-size:12.5px;color:var(--text-3);margin-top:10px">Completion usually arrives shortly after a session ends. If it hasn’t arrived after a long while, refresh again — and if it never arrives, contact support via Help so your work isn’t lost.</p>';
    if (xr === 'completion_received') actions =
      '<a class="btn pri blk" href="#/learner/progress">' + ic('activity') + 'View updated progress</a>' +
      '<a class="btn gho blk" href="#/learner/experiment/' + id + '" style="margin-top:8px">Back to the experiment</a>';

    var protoControls = '';
    if (xr === 'pending') protoControls = protoNote('Preview failure states: ' +
      '<button class="btn sm sec" type="button" id="pc-fail" style="margin:0 6px 0 8px">Availability failed</button>' +
      '<button class="btn sm sec" type="button" id="pc-unknown">Availability unknown</button>');
    if (xr === 'ready') protoControls = protoNote('The real session happens on the headset. For this demo: ' +
      '<button class="btn sm sec" type="button" id="pc-done" style="margin-left:8px">Simulate a completed session on the device</button>');

    var content =
      '<div class="phead"><div class="ptitles"><h1>Device access ' + fmtBadge(e.fmt) + '</h1>' +
      '<div class="pmeta"><span>' + esc(e.name) + '</span><span>·</span><span>' + esc(e.deviceLine) + '</span></div></div></div>' +
      '<div class="grid-rail"><div class="stack">' +
      '<section class="card"><div class="chead"><h3>Status</h3></div><div class="cbody">' + ladderHTML + '</div></section>' +
      protoControls +
      '</div><div class="stack">' +
      '<section class="card"><div class="chead"><h3>Actions</h3></div><div class="cbody">' + actions + '</div></section>' +
      '<section class="card"><div class="chead"><h3>While you wait</h3></div><div class="cbody" style="font-size:13.5px;color:var(--text-2)">' +
      'Review the learning resources for this experiment — they’re part of the same module. <a href="#/learner/experiment/' + id + '">Back to the experiment</a>.' +
      '</div></section>' +
      '</div></div>';
    return shell('learner', '#/learner/my-learning', crumbs([{ label: 'My Learning', href: '#/learner/my-learning' }, { label: e.name, href: '#/learner/experiment/' + id }, { label: 'Device access' }]), content);
  }
  function bindDeviceAccess(id) {
    var b;
    if ((b = document.getElementById('btn-getdev2'))) b.addEventListener('click', function () { xrGetOnDevice(); });
    if ((b = document.getElementById('btn-refresh'))) b.addEventListener('click', function () { xrRefresh(); });
    if ((b = document.getElementById('btn-retry'))) b.addEventListener('click', function () { xrRetry(); });
    if ((b = document.getElementById('pc-fail'))) b.addEventListener('click', function () { xrSet('failed'); });
    if ((b = document.getElementById('pc-unknown'))) b.addEventListener('click', function () { xrSet('unknown'); });
    if ((b = document.getElementById('pc-done'))) b.addEventListener('click', function () { xrSessionDone(); });
  }

  /* ---------- web sim runtime placeholder ---------- */
  function viewWebRun(id) {
    var e = S.exps[id];
    if (!e) { location.hash = '#/learner/my-learning'; return ''; }
    var content =
      '<div class="phead"><div class="ptitles"><h1>' + esc(e.name) + ' ' + fmtBadge('Web') + '</h1>' +
      '<div class="pmeta">Web simulation — runs in your browser. <span class="sample-tag">SAMPLE PLACEHOLDER — the web runtime itself is outside Batch 01</span></div></div></div>' +
      '<div class="card" style="overflow:hidden"><div class="cbody" id="simwrap">' +
      '<div id="simload"><p style="font-size:13.5px;color:var(--text-2);margin-bottom:10px">Loading simulation assets…</p>' +
      '<div class="progressbar" role="progressbar" aria-label="Loading simulation"><span id="simbar" style="width:5%"></span></div></div>' +
      '<div id="simstage" hidden><div class="simstage"><div class="gridfx" aria-hidden="true"></div>' +
      '<div class="ss-title">Bernoulli flow visualisation — sample placeholder</div>' +
      '<div class="ss-sub">This stands in for the web simulation runtime (retained Review-005 pattern, out of Batch-01 scope). Completion is recorded when you finish.</div>' +
      '<button class="btn sim" type="button" id="btn-endsim">End session &amp; record completion</button></div></div>' +
      '</div></div>' +
      '<div style="margin-top:14px"><a class="btn gho" href="#/learner/experiment/' + id + '">' + ic('arrR') + 'Exit without finishing</a></div>';
    return shell('learner', '#/learner/my-learning', crumbs([{ label: 'My Learning', href: '#/learner/my-learning' }, { label: e.name, href: '#/learner/experiment/' + id }, { label: 'Simulation' }]), content);
  }
  function bindWebRun(id) {
    var pct = 0, bar = document.getElementById('simbar');
    var t = setInterval(function () {
      pct = Math.min(100, pct + 25);
      if (bar) bar.style.width = pct + '%';
      if (pct >= 100) {
        clearInterval(t);
        var l = document.getElementById('simload'), s = document.getElementById('simstage');
        if (l && s) { l.hidden = true; s.hidden = false; }
      }
    }, 320);
    var be = document.getElementById('btn-endsim');
    if (be) be.addEventListener('click', function () {
      webSimFinish();
      location.hash = '#/learner/experiment/' + id;
    });
  }

  /* ---------- S14 progress ---------- */
  function viewProgress() {
    var sh = S.exps.shear, be = S.exps.bernoulli;
    function row(name, fmt, sim, status, when) {
      return '<tr><td><span class="tmain">' + esc(name) + '</span></td><td>' + fmtBadge(fmt) + '</td>' +
        '<td>' + sim + '</td><td>' + status + '</td><td>' + esc(when) + '</td></tr>';
    }
    var shSim = sh.progress === 'completed' ? '<span class="badge b-success">' + ic('check', 'sm') + 'Completion received</span>' :
      sh.xr === 'completion_pending' ? '<span class="badge b-warning">' + ic('hourglass', 'sm') + 'Completion pending</span>' :
      '<span class="badge b-neutral">Not completed</span>';
    var shStat = sh.progress === 'completed' ? '<span class="badge b-published">' + ic('check', 'sm') + 'Progress updated</span>' :
      sh.progress === 'in_progress' ? '<span class="badge b-info">In progress</span>' : '<span class="badge b-neutral">Not started</span>';
    var beStat = be.progress === 'completed' ? '<span class="badge b-published">' + ic('check', 'sm') + 'Completed</span>' : '<span class="badge b-info">In progress</span>';
    var content =
      '<div class="phead"><div class="ptitles"><h1>Progress</h1>' +
      '<div class="pmeta">Your learning progress, recorded to your account. <span class="sample-tag">SAMPLE DESIGN DATA</span></div></div></div>' +
      (sh.progress === 'completed' ?
        '<div class="alert success" role="status" style="margin-bottom:16px">' + ic('check') + '<div><div class="at">Soil Mechanics — Direct Shear Test: progress updated</div>The completion from your device session has been received and recorded to your account.</div></div>' : '') +
      '<div class="tablecard"><table class="dt"><caption class="sr-only">Progress per experiment</caption>' +
      '<thead><tr><th scope="col">Experiment</th><th scope="col">Format</th><th scope="col">Simulation</th><th scope="col">Status</th><th scope="col">Updated</th></tr></thead><tbody>' +
      row(sh.name, 'VR', shSim, shStat, sh.progress === 'completed' ? 'Today' : '—') +
      row(be.name, 'Web', be.progress === 'completed' ? '<span class="badge b-success">' + ic('check', 'sm') + 'Completed in browser</span>' : '<span class="badge b-info">In progress</span>', beStat, be.progress === 'completed' ? 'Today' : '18 Aug 2026') +
      row(S.exps.surveying.name, 'Web', '<span class="badge b-success">' + ic('check', 'sm') + 'Completed in browser</span>', '<span class="badge b-published">' + ic('check', 'sm') + 'Completed</span>', '12 Aug 2026') +
      '</tbody></table></div>' +
      '<p style="font-size:12.5px;color:var(--text-3);margin-top:14px">Completion for device-run simulations is recorded to your account when the platform receives it — the portal reflects your account state; it doesn’t watch the session itself.</p>';
    return shell('learner', '#/learner/progress', '', content);
  }

  /* ============================================================
     ROUTER
     ============================================================ */
  function route() {
    var h = location.hash || '#/index';
    var p = h.replace(/^#\//, '').split('/');
    return p;
  }

  function render() {
    var p = route();
    var root = document.getElementById('app-root');
    var html = '', after = null;

    if (p[0] === 'index' || p[0] === '') { html = viewIndex(); after = function () { var b = document.getElementById('idx-reset'); if (b) b.addEventListener('click', resetDemo); }; }
    else if (p[0] === 'vendor') {
      if (p[1] === 'submissions') { html = viewVendorSubs(); after = bindVendorSubsFilters; }
      else if (p[1] === 'new') { html = viewVendorForm(null); after = function () { bindVendorForm(null); }; }
      else if (p[1] === 'submission' && p[2] && p[3] === 'edit') { html = viewVendorForm(p[2]); after = function () { bindVendorForm(p[2]); }; }
      else if (p[1] === 'submission' && p[2]) { html = viewVendorDetail(p[2]); }
    }
    else if (p[0] === 'arv') {
      if (p[1] === 'queue') html = viewArvQueue();
      else if (p[1] === 'history') html = viewArvHistory();
      else if (p[1] === 'review' && p[2]) { html = viewArvReview(p[2]); after = function () { bindTabs(); bindArvReview(p[2]); }; }
    }
    else if (p[0] === 'cm') {
      if (p[1] === 'queue') html = viewCmQueue();
      else if (p[1] === 'history') html = viewCmHistory();
      else if (p[1] === 'published') html = viewCmPublished();
      else if (p[1] === 'review' && p[2]) { html = viewCmReview(p[2]); after = function () { bindTabs(); bindCmReview(p[2]); }; }
    }
    else if (p[0] === 'learner') {
      if (p[1] === 'my-learning') html = viewLearnerHome();
      else if (p[1] === 'progress') html = viewProgress();
      else if (p[1] === 'experiment' && p[2] && p[3] === 'device') { html = viewDeviceAccess(p[2]); after = function () { bindDeviceAccess(p[2]); }; }
      else if (p[1] === 'experiment' && p[2] && p[3] === 'run') { html = viewWebRun(p[2]); after = function () { bindWebRun(p[2]); }; }
      else if (p[1] === 'experiment' && p[2]) { html = viewLearnerExp(p[2]); after = function () { bindLearnerExp(p[2]); }; }
    }
    if (!html) { html = viewIndex(); }
    root.innerHTML = html;

    var pr = document.getElementById('proto-reset');
    if (pr) pr.addEventListener('click', resetDemo);
    var sk = document.getElementById('skip-link');
    if (sk) sk.addEventListener('click', function (ev) {
      ev.preventDefault(); // hash routing owns the fragment — focus main directly instead
      focusMain(false);
    });
    if (after) after();
  }

  /* Focus main transiently (tabindex added only for the focus call, so ordinary
     clicks inside main never focus/scroll it). */
  function focusMain(preventScroll) {
    var main = document.getElementById('main-content');
    if (!main) return;
    main.setAttribute('tabindex', '-1');
    try { main.focus({ preventScroll: !!preventScroll }); } catch (e) { main.focus(); }
    main.addEventListener('blur', function h() {
      main.removeAttribute('tabindex');
      main.removeEventListener('blur', h);
    });
  }

  var lastPath = null;
  window.addEventListener('hashchange', function () {
    var p = route().join('/');
    render();
    if (p !== lastPath) { window.scrollTo(0, 0); lastPath = p; }
    focusMain(true);
  });

  document.addEventListener('DOMContentLoaded', function () {
    if (!location.hash) location.hash = '#/index';
    lastPath = route().join('/');
    render();
  });
})();
