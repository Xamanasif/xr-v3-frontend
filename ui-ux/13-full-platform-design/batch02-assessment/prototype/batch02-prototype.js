/* ============================================================
   XR Simulation Learning Platform — Batch 02 interactive prototype
   FACULTY ASSESSMENT CONFIGURATION → LEARNER ASSESSMENT → RESULT/PROGRESS
   Plain JavaScript. No framework, no backend, no real AI service,
   no real scoring service, no real API. All state is local
   prototype state; the single configuration object per assessment
   drives BOTH the Faculty and the Learner experience (PM-08).
   ALL PEOPLE, DATES, QUESTIONS AND VALUES ARE SAMPLE DESIGN DATA.
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- icons (inline SVG, 24 viewBox — Batch-01 set + assessment additions) ---------------- */
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
    hourglass: '<path d="M7 3.5h10"/><path d="M7 20.5h10"/><path d="M8 3.5v3.2c0 2.6 4 3.8 4 5.3s-4 2.7-4 5.3v3.2"/><path d="M16 3.5v3.2c0 2.6-4 3.8-4 5.3s4 2.7 4 5.3v3.2"/>',
    sparkle: '<path d="M12 4.5 13.6 9.9 19 11.5 13.6 13.1 12 18.5 10.4 13.1 5 11.5 10.4 9.9z"/><path d="M18.5 4.5v3.4"/><path d="M16.8 6.2h3.4"/>',
    settings: '<circle cx="12" cy="12" r="3.1"/><path d="M12 3.4v2.4M12 18.2v2.4M3.4 12h2.4M18.2 12h2.4M5.9 5.9l1.7 1.7M16.4 16.4l1.7 1.7M18.1 5.9l-1.7 1.7M7.6 16.4l-1.7 1.7"/>',
    link: '<path d="M9.5 14.5 14.5 9.5"/><path d="M10.8 6.8 12.6 5a3.8 3.8 0 0 1 5.4 5.4l-1.8 1.8"/><path d="M13.2 17.2 11.4 19a3.8 3.8 0 0 1-5.4-5.4l1.8-1.8"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.7"/><circle cx="12" cy="12" r="1"/>',
    hash: '<line x1="9.5" y1="4" x2="7.5" y2="20"/><line x1="16.5" y1="4" x2="14.5" y2="20"/><line x1="4.5" y1="9" x2="20.5" y2="9"/><line x1="3.5" y1="15" x2="19.5" y2="15"/>',
    shuffle: '<path d="M3.5 6.5h3.2c5.8 0 8 11 13.8 11h.5"/><path d="M3.5 17.5h3.2c2.5 0 4.2-2 5.8-4.3M14.8 9c1.4-1.6 2.9-2.5 5.7-2.5h.5"/><polyline points="18 3.5 21 6.5 18 9.5"/><polyline points="18 14.5 21 17.5 18 20.5"/>',
    minus: '<line x1="6" y1="12" x2="18" y2="12"/>',
    flag: '<path d="M5.5 21V4.5"/><path d="M5.5 5h12l-2.5 3.5L17.5 12h-12"/>'
  };
  function ic(name, cls) {
    return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (PATHS[name] || '') + '</svg>';
  }

  /* ============================================================
     SAMPLE DATA & PROTOTYPE STATE
     One configuration object per assessment (a.cfg) is the single
     source both workspaces read — Faculty writes it, the Learner
     screens render from it. Local prototype state only: it is NOT
     an API schema proposal (the contract is pending, QT-03).
     ============================================================ */
  var STORAGE_KEY = 'xrslp-batch02-proto-v1';

  function initialState() {
    return {
      /* ---- question bank (Faculty, tenant-scoped) ---- */
      bank: {
        q_sh1: { id: 'q_sh1', type: 'mcq', topic: 'shear', status: 'ready', origin: 'authored', inBank: true,
          text: 'Which soil parameters are determined from a direct shear test?',
          options: [{ k: 'A', t: 'Shear strength parameters — cohesion (c) and angle of internal friction (φ)' }, { k: 'B', t: 'Permeability coefficient (k)' }, { k: 'C', t: 'Compression index (Cc)' }, { k: 'D', t: 'Specific gravity of soil solids (G)' }],
          correct: 'A' },
        q_sh2: { id: 'q_sh2', type: 'tf', topic: 'shear', status: 'ready', origin: 'authored', inBank: true,
          text: 'In the direct shear apparatus, the specimen is forced to fail along a predetermined horizontal plane.',
          correct: 'True' },
        q_sh3: { id: 'q_sh3', type: 'mcq', topic: 'shear', status: 'ready', origin: 'authored', inBank: true,
          text: 'While the specimen is being sheared, the applied normal load is:',
          options: [{ k: 'A', t: 'Held constant for that test stage' }, { k: 'B', t: 'Increased continuously' }, { k: 'C', t: 'Removed completely' }, { k: 'D', t: 'Reversed in direction' }],
          correct: 'A' },
        q_sh4: { id: 'q_sh4', type: 'mcq', topic: 'shear', status: 'ready', origin: 'authored', inBank: true,
          text: 'The direct shear test is generally most suitable for determining the drained strength of:',
          options: [{ k: 'A', t: 'Clean sands (cohesionless soils)' }, { k: 'B', t: 'Saturated soft clays' }, { k: 'C', t: 'Organic peats' }, { k: 'D', t: 'Rock cores' }],
          correct: 'A' },
        q_sh5: { id: 'q_sh5', type: 'tf', topic: 'shear', status: 'ready', origin: 'authored', inBank: true,
          text: 'For a dry sand, a higher normal stress generally produces a higher peak shear stress.',
          correct: 'True' },
        q_sh6: { id: 'q_sh6', type: 'mcq', topic: 'shear', status: 'ready', origin: 'authored', inBank: true,
          text: 'In a direct shear test, the shear stress is calculated as the shear force divided by:',
          options: [{ k: 'A', t: 'The corrected cross-sectional area of the specimen' }, { k: 'B', t: 'The specimen volume' }, { k: 'C', t: 'The specimen height' }, { k: 'D', t: 'The normal force' }],
          correct: 'A' },
        q_be1: { id: 'q_be1', type: 'mcq', topic: 'bernoulli', status: 'ready', origin: 'authored', inBank: true,
          text: 'Bernoulli’s equation is a statement of the conservation of:',
          options: [{ k: 'A', t: 'Energy along a streamline' }, { k: 'B', t: 'Mass' }, { k: 'C', t: 'Momentum' }, { k: 'D', t: 'Temperature' }],
          correct: 'A' },
        q_be2: { id: 'q_be2', type: 'mcq', topic: 'bernoulli', status: 'ready', origin: 'authored', inBank: true,
          text: 'In the converging section of the apparatus, as the flow velocity increases the static pressure:',
          options: [{ k: 'A', t: 'Decreases' }, { k: 'B', t: 'Increases' }, { k: 'C', t: 'Stays constant' }, { k: 'D', t: 'Oscillates randomly' }],
          correct: 'A' },
        q_be3: { id: 'q_be3', type: 'desc', topic: 'bernoulli', status: 'ready', origin: 'authored', inBank: true,
          text: 'Using the readings you recorded in the simulation, briefly explain why the piezometer head falls where the duct narrows.',
          correct: null },
        q_be4: { id: 'q_be4', type: 'tf', topic: 'bernoulli', status: 'ready', origin: 'authored', inBank: true,
          text: 'Bernoulli’s equation in its simplest form assumes the fluid is incompressible and inviscid.',
          correct: 'True' },
        q_to1: { id: 'q_to1', type: 'mcq', topic: 'torsion', status: 'ready', origin: 'authored', inBank: true,
          text: 'The torsion test on a circular shaft is primarily used to determine:',
          options: [{ k: 'A', t: 'Modulus of rigidity (G)' }, { k: 'B', t: 'Young’s modulus (E)' }, { k: 'C', t: 'Poisson’s ratio' }, { k: 'D', t: 'Surface hardness' }],
          correct: 'A' },
        q_to2: { id: 'q_to2', type: 'tf', topic: 'torsion', status: 'ready', origin: 'authored', inBank: true,
          text: 'In pure torsion, shear stress varies linearly from zero at the shaft axis to a maximum at the outer surface.',
          correct: 'True' },
        q_to3: { id: 'q_to3', type: 'mcq', topic: 'torsion', status: 'ready', origin: 'authored', inBank: true,
          text: 'The polar moment of inertia of a solid circular section of diameter d is:',
          options: [{ k: 'A', t: 'πd⁴/32' }, { k: 'B', t: 'πd⁴/64' }, { k: 'C', t: 'πd³/16' }, { k: 'D', t: 'πd²/4' }],
          correct: 'A' },
        q_to4: { id: 'q_to4', type: 'mcq', topic: 'torsion', status: 'ready', origin: 'authored', inBank: true,
          text: 'A ductile shaft loaded in pure torsion typically fails:',
          options: [{ k: 'A', t: 'On a plane perpendicular to the shaft axis' }, { k: 'B', t: 'Along a 45° helical surface' }, { k: 'C', t: 'By longitudinal splitting' }, { k: 'D', t: 'Without visible deformation' }],
          correct: 'A' },
        q_co1: { id: 'q_co1', type: 'mcq', topic: 'consolidation', status: 'ready', origin: 'authored', inBank: true,
          text: 'The one-dimensional consolidation (oedometer) test determines:',
          options: [{ k: 'A', t: 'Compressibility characteristics such as Cc and mv' }, { k: 'B', t: 'Shear strength parameters' }, { k: 'C', t: 'Atterberg limits' }, { k: 'D', t: 'Field density' }],
          correct: 'A' },
        q_co2: { id: 'q_co2', type: 'tf', topic: 'consolidation', status: 'ready', origin: 'authored', inBank: true,
          text: 'Primary consolidation is caused by the expulsion of pore water from the soil.',
          correct: 'True' },
        q_co3: { id: 'q_co3', type: 'mcq', topic: 'consolidation', status: 'ready', origin: 'authored', inBank: true,
          text: 'The coefficient of consolidation (cv) governs:',
          options: [{ k: 'A', t: 'The rate at which consolidation settlement occurs' }, { k: 'B', t: 'The magnitude of total settlement' }, { k: 'C', t: 'The soil’s shear strength' }, { k: 'D', t: 'The initial void ratio' }],
          correct: 'A' },
        /* pre-authored rows that arrive via the SIMULATED spreadsheet upload (5.1.1) */
        q_up1: { id: 'q_up1', type: 'mcq', topic: 'shear', status: 'ready', origin: 'upload', inBank: false,
          text: 'The rate of shearing in a drained direct shear test on clay should be:',
          options: [{ k: 'A', t: 'Slow enough for excess pore pressure to dissipate' }, { k: 'B', t: 'As fast as the machine allows' }, { k: 'C', t: 'Equal to the normal loading rate' }, { k: 'D', t: 'Irrelevant to the result' }],
          correct: 'A' },
        q_up2: { id: 'q_up2', type: 'tf', topic: 'shear', status: 'ready', origin: 'upload', inBank: false,
          text: 'The direct shear test can measure pore water pressure inside the specimen.',
          correct: 'False' }
      },
      bankOrder: ['q_sh1', 'q_sh2', 'q_sh3', 'q_sh4', 'q_sh5', 'q_sh6', 'q_be1', 'q_be2', 'q_be3', 'q_be4', 'q_to1', 'q_to2', 'q_to3', 'q_to4', 'q_co1', 'q_co2', 'q_co3'],
      uploadDone: false,
      nextQ: 1,

      /* ---- AI question generation (FRD 5.1.2 — prototype-local only) ---- */
      ai: { state: 'idle', topic: 'shear', count: 3, failNext: false },

      /* ---- assessments: definition + THE configuration object ---- */
      assessments: {
        shearq: {
          id: 'shearq', title: 'Direct Shear Test — Module Assessment',
          contextModule: 'shear', questions: ['q_sh1', 'q_sh2', 'q_sh3', 'q_sh4', 'q_sh5'],
          cfg: { randomize: false, negativeMarking: true, timeLimitMin: 25, marksCorrect: 2, marksIncorrect: 0.5, marksUnanswered: 0, passPercent: 50, attemptLimit: 2, floorZero: true },
          updated: '20 Aug 2026 · 09:40'
        },
        bernq: {
          id: 'bernq', title: 'Bernoulli’s Theorem — Lab Assessment',
          contextModule: 'bernoulli', questions: ['q_be1', 'q_be2', 'q_be3'],
          cfg: { randomize: true, negativeMarking: false, timeLimitMin: null, marksCorrect: 2, marksIncorrect: 0, marksUnanswered: 0, passPercent: 60, attemptLimit: 1, floorZero: true },
          updated: '19 Aug 2026 · 15:05'
        },
        torsq: {
          id: 'torsq', title: 'Torsion Test — Module Assessment',
          contextModule: 'torsion', questions: ['q_to1', 'q_to2', 'q_to3', 'q_to4'],
          cfg: { randomize: false, negativeMarking: false, timeLimitMin: 15, marksCorrect: 1, marksIncorrect: 0, marksUnanswered: 0, passPercent: 50, attemptLimit: 3, floorZero: true },
          updated: '18 Aug 2026 · 11:20'
        },
        consolq: {
          id: 'consolq', title: 'Consolidation Test — Module Assessment',
          contextModule: null, questions: ['q_co1', 'q_co2'],
          cfg: { randomize: false, negativeMarking: false, timeLimitMin: null, marksCorrect: 2, marksIncorrect: 0, marksUnanswered: 0, passPercent: null, attemptLimit: null, floorZero: true },
          updated: '20 Aug 2026 · 10:12'
        }
      },
      asmOrder: ['shearq', 'bernq', 'torsq', 'consolq'],

      /* ---- learning contexts (modules) — learner side of the same story ---- */
      modules: {
        shear: { id: 'shear', name: 'Soil Mechanics — Direct Shear Test', fmt: 'VR', deviceLine: 'VR headset — e.g. Meta Quest', course: 'Geotechnical Engineering Laboratory',
          resources: ['Lab briefing — Direct shear theory (PDF)', 'Apparatus walkthrough (video)'], resourcesDone: true,
          sim: 'completed', simOn: '20 Aug 2026', simNote: 'Completion received from your device session' },
        bernoulli: { id: 'bernoulli', name: 'Fluid Dynamics — Bernoulli’s Theorem', fmt: 'Web', deviceLine: 'Runs in your browser', course: 'Fluid Mechanics Laboratory',
          resources: ['Bernoulli’s principle — notes (PDF)'], resourcesDone: true,
          sim: 'completed', simOn: '20 Aug 2026', simNote: 'Completed in your browser' },
        torsion: { id: 'torsion', name: 'Strength of Materials — Torsion Test', fmt: 'VR', deviceLine: 'VR headset — e.g. Meta Quest', course: 'Strength of Materials Laboratory',
          resources: ['Torsion of circular shafts — notes (PDF)'], resourcesDone: true,
          sim: 'not_completed', simOn: null, simNote: 'Run the simulation on your supported device' },
        consolidation: { id: 'consolidation', name: 'Soil Mechanics — Consolidation Test', fmt: 'VR', deviceLine: 'VR headset — e.g. Meta Quest', course: 'Geotechnical Engineering Laboratory',
          resources: ['Consolidation theory — notes (PDF)'], resourcesDone: false,
          sim: 'not_completed', simOn: null, simNote: 'Run the simulation on your supported device' },
        surveying: { id: 'surveying', name: 'Surveying — Levelling Exercise', fmt: 'Web', deviceLine: 'Runs in your browser', course: 'Surveying Laboratory',
          resources: [], resourcesDone: true,
          sim: 'completed', simOn: '12 Aug 2026', simNote: 'Completed in your browser', done: true, doneOn: '12 Aug 2026' }
      },
      moduleOrder: ['shear', 'bernoulli', 'torsion', 'consolidation'],

      /* ---- the learner's attempts (Rahul Verma) — recording is always on (11.2.1 / 11.2.2) ---- */
      attempts: {
        shearq: { used: 0, current: null, history: [] },
        bernq: { used: 0, current: null, history: [] },
        torsq: { used: 0, current: null, history: [] },
        consolq: { used: 0, current: null, history: [] }
      },

      flags: { introError: false }
    };
  }

  var S = load() || initialState();
  applyQaPatch();

  function save() { try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable — in-memory only */ } }
  function load() {
    try { var raw = sessionStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null; }
    catch (e) { return null; }
  }
  /* QA-seed support (../qa/qa-seed.html): a one-shot partial state patch, deep-merged
     over the current state so QA captures can open any demo state directly.
     Not product behaviour — the key only exists when the QA seeder wrote it. */
  function applyQaPatch() {
    var PATCH_KEY = STORAGE_KEY + '-qa-patch';
    try {
      var raw = sessionStorage.getItem(PATCH_KEY);
      if (!raw) return;
      sessionStorage.removeItem(PATCH_KEY);
      var patch = JSON.parse(raw);
      (function merge(dst, src) {
        Object.keys(src).forEach(function (k) {
          if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k]) && dst[k] && typeof dst[k] === 'object' && !Array.isArray(dst[k])) merge(dst[k], src[k]);
          else dst[k] = src[k];
        });
      })(S, patch);
      // relative timer marker: endsAt === -1 → N minutes from seed time (default 18)
      Object.keys(S.attempts).forEach(function (aid) {
        var c = S.attempts[aid].current;
        if (c && c.endsAt === -1) c.endsAt = Date.now() + (c.minLeft || 18) * 60000;
      });
      save();
    } catch (e) { /* ignore malformed patches */ }
  }
  function resetDemo() {
    S = initialState();
    save();
    location.hash = '#/index';
    render();
    toast('Demo reset — all sample data restored.', 'info');
  }

  /* ---------------- utilities ---------------- */
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nowStamp() {
    var d = new Date();
    var h = d.getHours(), m = d.getMinutes();
    return '20 Aug 2026 · ' + (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }
  function fmtNum(n) {
    if (n == null || isNaN(n)) return '—';
    var r = Math.round(n * 100) / 100;
    return String(r);
  }
  function plural(n, one, many) { return n === 1 ? one : many; }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  /* ---------------- assessment derivations ---------------- */
  var TYPE_LABEL = { mcq: 'Multiple choice', tf: 'True / False', desc: 'Descriptive' };

  function qtypeBadge(t) { return '<span class="qtype">' + esc(TYPE_LABEL[t] || t) + '</span>'; }
  function aiDraftBadges() {
    return '<span class="ai-badge">' + ic('sparkle', 'sm') + 'AI-generated draft</span> <span class="badge b-warning">' + ic('alertTri', 'sm') + 'Review required</span>';
  }

  function cfgComplete(a) {
    var c = a.cfg;
    return c.passPercent != null && c.passPercent >= 1 && c.passPercent <= 100 &&
      c.attemptLimit != null && c.attemptLimit >= 1 &&
      c.marksCorrect != null && c.marksCorrect > 0 &&
      (!c.negativeMarking || (c.marksIncorrect != null && c.marksIncorrect >= 0));
  }
  /* Lifecycle terminology (DESIGN ASSUMPTION A1, from the Review-006 FAC-07 state list):
     Draft → Configured (questions + settings complete) → Assigned (has a learning context). */
  function asmStatus(a) {
    var complete = a.questions.length > 0 && cfgComplete(a);
    if (complete && a.contextModule) return 'assigned';
    if (complete) return 'configured';
    return 'draft';
  }
  function asmStatusBadge(a) {
    var st = asmStatus(a);
    if (st === 'assigned') return '<span class="badge b-success">' + ic('check', 'sm') + 'Assigned</span>';
    if (st === 'configured') return '<span class="badge b-info">' + ic('listCheck', 'sm') + 'Configured</span>';
    return '<span class="badge b-neutral">' + ic('edit', 'sm') + 'Draft</span>';
  }
  function completeness(a) {
    var items = [];
    items.push({ ok: a.questions.length > 0, label: 'Questions selected', detail: a.questions.length > 0 ? a.questions.length + ' ' + plural(a.questions.length, 'question', 'questions') + ' included' : 'Add at least one question from the Question Bank' });
    items.push({ ok: cfgComplete(a), label: 'Settings complete', detail: cfgComplete(a) ? 'All required settings for this assessment are set' : 'Pass mark and attempts are not set yet' });
    items.push({ ok: !!a.contextModule, label: 'Assigned to a learning context', detail: a.contextModule ? S.modules[a.contextModule].name : 'Not available to any learner until it is assigned' });
    return items;
  }
  function hasDesc(a) {
    return a.questions.some(function (qid) { return S.bank[qid] && S.bank[qid].type === 'desc'; });
  }
  function typeSummary(a) {
    var present = [];
    ['mcq', 'tf', 'desc'].forEach(function (t) {
      if (a.questions.some(function (qid) { return S.bank[qid] && S.bank[qid].type === t; })) present.push(TYPE_LABEL[t].toLowerCase());
    });
    return present.join(', ');
  }
  function maxMarks(a) { return a.questions.length * (a.cfg.marksCorrect || 0); }
  function usedIn(qid) {
    return S.asmOrder.filter(function (aid) { return S.assessments[aid].questions.indexOf(qid) !== -1; });
  }
  function latestOutcome(aid) {
    var h = S.attempts[aid].history;
    return h.length ? h[0] : null;
  }
  function asmPassed(aid) {
    var l = latestOutcome(aid);
    return !!(l && l.state === 'passed');
  }
  function moduleComplete(m) {
    if (m.done) return true;
    var aid = assessmentForModule(m.id);
    if (!aid) return false;
    return m.resourcesDone && m.sim === 'completed' && asmPassed(aid);
  }
  function assessmentForModule(mid) {
    var found = null;
    S.asmOrder.forEach(function (aid) { if (S.assessments[aid].contextModule === mid) found = aid; });
    return found;
  }
  /* ---------------- scoring (PROTOTYPE-LOCAL SAMPLE SCORING; reads the configuration) ---------------- */
  function scoreAttempt(a, answers) {
    var c = a.cfg;
    var score = 0, answered = 0, unanswered = 0, descCount = 0;
    a.questions.forEach(function (qid) {
      var q = S.bank[qid];
      var v = answers[qid];
      var has = v != null && String(v).trim() !== '';
      if (has) answered += 1; else unanswered += 1;
      if (q.type === 'desc') { if (has) descCount += 1; return; }
      if (!has) { score += (c.marksUnanswered || 0); return; }
      if (v === q.correct) score += c.marksCorrect;
      else if (c.negativeMarking) score -= c.marksIncorrect;
    });
    return { score: score, answered: answered, unanswered: unanswered, descAnswered: descCount };
  }

  function fmtBadge(f) {
    var map = { Web: 'fmt-web', VR: 'fmt-vr', MR: 'fmt-mr', AR: 'fmt-ar' };
    return '<span class="fmt ' + (map[f] || 'fmt-web') + '">' + esc(f) + '</span>';
  }
  function sampleTag() { return '<span class="sample-tag">SAMPLE DESIGN DATA</span>'; }

  /* ---------------- feedback primitives (Batch-01 pattern) ---------------- */
  function toast(msg, kind) {
    var wrap = document.getElementById('toasts');
    var el = document.createElement('div');
    el.className = 'toast ' + (kind || '');
    el.innerHTML = ic(kind === 'info' ? 'info' : 'check') + '<span class="tx">' + esc(msg) + '</span><button type="button" aria-label="Dismiss notification">' + ic('x', 'sm') + '</button>';
    el.querySelector('button').addEventListener('click', function () { el.remove(); });
    wrap.appendChild(el);
    setTimeout(function () { el.remove(); }, 6000);
  }
  function announce(msg) {
    var a = document.getElementById('announcer');
    if (a) { a.textContent = ''; setTimeout(function () { a.textContent = msg; }, 40); }
  }

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
      '<button class="btn sec" type="button" id="dlg-cancel">' + esc(opts.cancelLabel || 'Cancel') + '</button>' +
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

  /* ---------------- shell (SHR-02, unchanged Batch-01 chrome) ---------------- */
  var ROLES = {
    faculty: {
      key: 'faculty', wsLabel: 'Faculty workspace', wsCtx: 'Sample Engineering Institute', inst: true,
      user: 'Dr. Arjun Mehta', initials: 'AM', role: 'Faculty',
      nav: function () {
        return [
          { href: '#/faculty/assessments', label: 'Assessments', icon: 'listCheck', count: S.asmOrder.length },
          { href: '#/faculty/questions', label: 'Question Bank', icon: 'list', count: S.bankOrder.filter(function (k) { return S.bank[k].inBank; }).length }
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
      { href: '#/faculty/assessments', label: 'Faculty', role: 'faculty' },
      { href: '#/learner/my-learning', label: 'Learner', role: 'learner' }
    ];
    return '<div class="protobar" role="navigation" aria-label="Prototype navigation — not product UI">' +
      '<span class="plabel">PROTOTYPE NAVIGATION — NOT PRODUCT UI · BATCH 02</span>' +
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
         branding/bits-pilani-wilp-logo.png (the source asset is never modified; verify with cmp).
         A local copy is used because Safari blocks parent-directory subresources when the HTML
         is opened directly from file://. If the image still can't load, the graphic is omitted
         cleanly and the text lockup stands alone — never a broken-image icon. */
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

  function emptyState(icon, title, body, actionHTML) {
    return '<div class="empty"><div class="echip">' + ic(icon, 'lg') + '</div><h3>' + esc(title) + '</h3><p>' + esc(body) + '</p>' + (actionHTML || '') + '</div>';
  }
  function protoNote(bodyHTML, tagText) {
    return '<div class="proto-note"><span class="pn-label">' + esc(tagText || 'PROTOTYPE CONTROL — NOT PRODUCT UI') + '</span><div style="flex:1">' + bodyHTML + '</div></div>';
  }

  /* ============================================================
     THE DISCLOSURE GENERATOR — the point of PM-08.
     Every row is derived from the assessment's configuration
     object. Nothing here is authored copy for one assessment:
     change the configuration and the disclosure changes.
     Negative marking is mentioned ONLY when it is enabled
     (a disabled rule must not be disclosed as if it existed);
     randomization state is ALWAYS disclosed (FRD 5.3.1
     acceptance criterion).
     ============================================================ */
  function disclosureRows(a, att) {
    var c = a.cfg;
    var rows = [];
    rows.push({ icon: 'list', t: a.questions.length + ' ' + plural(a.questions.length, 'question', 'questions'), d: 'Question ' + plural(a.questions.length, 'type', 'types') + ': ' + typeSummary(a) + '.' });
    if (c.timeLimitMin != null) {
      rows.push({ icon: 'clock', t: 'Time limit: ' + c.timeLimitMin + ' minutes in total', d: 'One overall time budget for the attempt — spend it across questions as you choose. The remaining time is shown during the attempt.' });
    } else {
      rows.push({ icon: 'clock', t: 'No time limit', d: 'This assessment has no time limit — take the time you need.' });
    }
    var used = att ? att.used : 0;
    rows.push({ icon: 'refresh', t: c.attemptLimit + ' ' + plural(c.attemptLimit, 'attempt', 'attempts') + ' for this assessment', d: 'You have used ' + used + ' of ' + c.attemptLimit + '. Every attempt is recorded to your account.' });
    rows.push({ icon: 'target', t: 'Pass mark: ' + c.passPercent + '% of total marks', d: 'Total marks available: ' + fmtNum(maxMarks(a)) + '.' });
    var marking = '+' + fmtNum(c.marksCorrect) + ' ' + plural(c.marksCorrect, 'mark', 'marks') + ' for each correct answer';
    if (c.negativeMarking) marking += ' · −' + fmtNum(c.marksIncorrect) + ' for each incorrect answer';
    marking += ' · unanswered questions score ' + fmtNum(c.marksUnanswered) + '.';
    var markingNote = c.floorZero ? 'Your reported score will not go below zero.' : '';
    rows.push({ icon: 'hash', t: 'Marking', d: marking + (markingNote ? ' ' + markingNote : '') });
    rows.push({ icon: 'shuffle', t: c.randomize ? 'Question order: randomized for each attempt' : 'Question order: fixed for every attempt', d: c.randomize ? 'You may see the questions in a different order than other attempts.' : 'Questions are presented in the same order in every attempt.' });
    if (hasDesc(a)) {
      rows.push({ icon: 'hourglass', t: 'Includes a descriptive answer', d: 'Descriptive answers require evaluation after you submit. Your final result will be available after the required evaluation is completed.' });
    }
    return rows;
  }
  function disclosureCard(a, att, headingLevel) {
    var h = headingLevel || 'h3';
    var rows = disclosureRows(a, att).map(function (r) {
      return '<div class="disc-row"><span class="d-ic" aria-hidden="true">' + ic(r.icon) + '</span>' +
        '<div class="d-body"><div class="d-t">' + esc(r.t) + '</div><div class="d-d">' + esc(r.d) + '</div></div></div>';
    }).join('');
    return '<section class="card"><div class="chead"><' + h + '>How this assessment works</' + h + '>' +
      '<span class="cnote">' + sampleTag() + '</span></div>' +
      '<div class="cbody"><p class="subtle-note" style="margin-bottom:10px">These are the settings for <strong>this assessment</strong>, set by your institution’s faculty — they are not platform-wide rules.</p>' +
      '<div class="disc">' + rows + '</div>' +
      '<p class="subtle-note" style="margin-top:12px">Your score and attempts are recorded to your account.</p>' +
      '</div></section>';
  }

  /* Renders one question's answer area for the ATTEMPT screen. */
  function questionBody(q, answer, interactive) {
    if (q.type === 'desc') {
      if (!interactive) {
        return '<div class="opts"><div class="opt static"><span class="o-t" style="color:var(--text-3)">The learner types a short answer here. Descriptive answers are evaluated after submission.</span></div></div>';
      }
      return '<div class="desc-input" style="margin-top:16px">' +
        '<label class="sr-only" for="desc-ans">Your answer</label>' +
        '<textarea id="desc-ans" placeholder="Type your answer…">' + esc(answer || '') + '</textarea>' +
        '<div class="savenote" id="desc-saved" ' + (answer ? '' : 'hidden') + '>' + ic('check') + 'Saved in this attempt</div>' +
        '<p class="subtle-note" style="margin-top:8px">This answer is evaluated after you submit the assessment.</p></div>';
    }
    var opts = q.type === 'tf' ? [{ k: 'True', t: 'True' }, { k: 'False', t: 'False' }] : q.options;
    return '<div class="opts" role="radiogroup" aria-label="Answer options">' + opts.map(function (o) {
      var sel = answer === o.k;
      if (!interactive) {
        return '<div class="opt static"><span class="o-k" aria-hidden="true">' + (q.type === 'tf' ? '' : esc(o.k)) + '</span><span class="o-t">' + esc(o.t) + '</span></div>';
      }
      return '<label class="opt' + (sel ? ' sel' : '') + '" data-k="' + esc(o.k) + '">' +
        '<input type="radio" name="q-ans" value="' + esc(o.k) + '"' + (sel ? ' checked' : '') + '>' +
        (q.type === 'tf' ? '' : '<span class="o-k" aria-hidden="true">' + esc(o.k) + '</span>') +
        '<span class="o-t">' + esc(o.t) + '</span></label>';
    }).join('') + '</div>';
  }

  /* ============================================================
     FACULTY VIEWS
     ============================================================ */

  /* ---------- FAC-06 · Assessments list ---------- */
  function viewFacAssessments() {
    var qy = (S.flags.asmSearch || '').toLowerCase();
    var ids = S.asmOrder.filter(function (aid) {
      return !qy || S.assessments[aid].title.toLowerCase().indexOf(qy) !== -1;
    });
    var rows = ids.map(function (aid) {
      var a = S.assessments[aid];
      var ctx = a.contextModule ? S.modules[a.contextModule].name : '<span style="color:var(--text-3)">No learning context yet</span>';
      var incomplete = asmStatus(a) === 'draft' ? ' <span class="badge b-warning">' + ic('alertTri', 'sm') + 'Setup incomplete</span>' : '';
      return '<tr><td><a class="rowlink" href="#/faculty/assessment/' + aid + '"><span class="tmain">' + esc(a.title) + '</span></a>' +
        '<div class="tsub">' + ctx + '</div></td>' +
        '<td class="num">' + a.questions.length + '</td>' +
        '<td>' + asmStatusBadge(a) + incomplete + '</td>' +
        '<td>' + esc(a.updated) + '</td>' +
        '<td><a class="btn sm sec" href="#/faculty/assessment/' + aid + '">Open</a></td></tr>';
    }).join('');
    var table;
    if (!S.asmOrder.length) {
      table = '<div class="tablecard">' + emptyState('listCheck', 'No assessments yet', 'Create your first assessment, add questions from the Question Bank, configure its settings and assign it to a learning context.', '<button class="btn pri" type="button" id="btn-create-asm">' + ic('plus') + 'Create assessment</button>') + '</div>';
    } else {
      table = '<div class="tablecard">' +
        '<div class="listbar"><div class="searchbox">' + ic('search') + '<label class="sr-only" for="asm-search">Search assessments</label><input id="asm-search" type="text" placeholder="Search assessments…" value="' + esc(S.flags.asmSearch || '') + '"></div>' +
        '<span class="lcount">' + ids.length + ' of ' + S.asmOrder.length + ' ' + plural(S.asmOrder.length, 'assessment', 'assessments') + '</span></div>' +
        (ids.length ?
          '<table class="dt"><caption class="sr-only">Assessments owned by this faculty account</caption>' +
          '<thead><tr><th scope="col">Assessment</th><th scope="col">Questions</th><th scope="col">Status</th><th scope="col">Updated</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead>' +
          '<tbody>' + rows + '</tbody></table>'
          : emptyState('search', 'No matching assessments', 'No assessment title matches your search. Clear the search to see all assessments.')) +
        '</div>';
    }
    var content =
      '<div class="phead"><div class="ptitles"><h1>Assessments</h1>' +
      '<div class="pmeta">Assessments you own for Sample Engineering Institute. Each assessment uses its own configured settings.</div></div>' +
      '<div class="pactions"><button class="btn pri" type="button" id="btn-create-asm2">' + ic('plus') + 'Create assessment</button></div></div>' +
      table +
      /* Descriptive-evaluation ownership and workflow are unresolved. No Faculty evaluation
         surface is presented as product UI — this is a prototype annotation only. */
      '<div style="margin-top:20px">' + protoNote(
        'Descriptive answers submitted by learners require evaluation before a final result. The evaluation owner and workflow are a pending product decision, so no Faculty evaluation area is designed in this batch. Learners see “Result pending evaluation” in the meantime.',
        'PROTOTYPE NOTE — NOT PRODUCT UI') + '</div>';
    return shell('faculty', '#/faculty/assessments', '', content);
  }
  function bindFacAssessments() {
    ['btn-create-asm', 'btn-create-asm2'].forEach(function (id) {
      var b = document.getElementById(id);
      if (b) b.addEventListener('click', createAssessmentDialog);
    });
    var sr = document.getElementById('asm-search');
    if (sr) sr.addEventListener('input', function () {
      S.flags.asmSearch = sr.value; save();
      var v = sr.value; render();
      var el = document.getElementById('asm-search');
      if (el) { el.focus(); el.setSelectionRange(v.length, v.length); }
    });
  }
  function createAssessmentDialog() {
    openDialog({
      title: 'Create assessment',
      confirmLabel: 'Create draft',
      body: '<div class="field" id="fld-asm-title"><label for="asm-title">Assessment title <span class="req">*</span></label>' +
        '<input type="text" id="asm-title" placeholder="e.g. Consolidation Test — Module Assessment">' +
        '<div class="hint">The new assessment starts as a draft. You then add questions, complete its settings and assign it to a learning context.</div></div>',
      validate: function (root) {
        var f = root.querySelector('#asm-title');
        var wrap = root.querySelector('#fld-asm-title');
        if (!f.value.trim()) {
          wrap.classList.add('invalid');
          if (!wrap.querySelector('.ferr')) wrap.insertAdjacentHTML('beforeend', '<div class="ferr">' + ic('alertCirc', 'sm') + 'Enter a title for the assessment.</div>');
          f.focus(); return false;
        }
        return true;
      },
      onConfirm: function (root) {
        var title = root.querySelector('#asm-title').value.trim();
        var id = 'asm' + Math.floor(Math.random() * 100000);
        S.assessments[id] = {
          id: id, title: title, contextModule: null, questions: [],
          cfg: { randomize: false, negativeMarking: false, timeLimitMin: null, marksCorrect: null, marksIncorrect: null, marksUnanswered: 0, passPercent: null, attemptLimit: null, floorZero: true },
          updated: nowStamp()
        };
        S.asmOrder.push(id);
        S.attempts[id] = { used: 0, current: null, history: [] };
        save();
        toast('Draft assessment created. Add questions, complete the settings, then assign it.');
        announce('Draft assessment created.');
        location.hash = '#/faculty/assessment/' + id;
      }
    });
  }

  /* ---------- FAC-07 · Assessment builder (Questions · Settings · Assign + status rail) ---------- */
  function builderTabs(aid, active) {
    function tab(href, label, key, flagged) {
      return '<a href="' + href + '"' + (active === key ? ' aria-current="page"' : '') + '>' +
        (flagged ? '<span class="tn-flag" aria-hidden="true"></span>' : '') + esc(label) +
        (flagged ? '<span class="sr-only"> — needs attention</span>' : '') + '</a>';
    }
    var a = S.assessments[aid];
    return '<nav class="tabnav" aria-label="Assessment sections">' +
      tab('#/faculty/assessment/' + aid, 'Questions', 'questions', a.questions.length === 0) +
      tab('#/faculty/assessment/' + aid + '/settings', 'Settings', 'settings', !cfgComplete(a)) +
      tab('#/faculty/assessment/' + aid + '/assign', 'Assign', 'assign', !a.contextModule) +
      '</nav>';
  }
  function builderRail(a) {
    var items = completeness(a).map(function (i) {
      return '<li class="' + (i.ok ? 'ok' : 'todo') + '"><span class="dl-ic" aria-hidden="true">' + ic(i.ok ? 'check' : 'alertTri') + '</span>' +
        '<div><div class="dl-t">' + esc(i.label) + (i.ok ? '' : ' — to do') + '</div><div class="dl-d">' + esc(i.detail) + '</div></div></li>';
    }).join('');
    var st = asmStatus(a);
    var next =
      a.questions.length === 0 ? 'Next: add questions from the Question Bank.' :
      !cfgComplete(a) ? 'Next: complete the settings (pass mark and attempts).' :
      !a.contextModule ? 'Next: preview the learner view, then assign the assessment to its learning context.' :
      'This assessment is assigned. Learners reach it through the module’s learning sequence after their simulation completion.';
    var attemptsLine = '';
    var att = S.attempts[a.id];
    if (att && att.history.length) {
      attemptsLine = '<p class="subtle-note" style="margin-top:10px">' + att.history.length + ' learner ' + plural(att.history.length, 'attempt', 'attempts') + ' recorded (sample). Detailed learner status is part of a later batch.</p>';
    }
    return '<section class="card" aria-label="Assessment status"><div class="chead"><h3>Status</h3>' + asmStatusBadge(a) + '</div>' +
      '<div class="cbody"><ol class="donelist">' + items + '</ol>' +
      '<p class="subtle-note" style="margin-top:12px">' + esc(next) + '</p>' + attemptsLine + '</div></section>' +
      '<section class="card"><div class="chead"><h3>Recorded automatically</h3></div><div class="cbody">' +
      '<p class="subtle-note">Learner scores and attempts are always recorded to their account — this is platform behaviour, not a setting.</p></div></section>';
  }
  function builderHead(a) {
    return '<div class="phead"><div class="ptitles"><h1>' + esc(a.title) + ' ' + asmStatusBadge(a) + '</h1>' +
      '<div class="pmeta">' + (a.contextModule ? 'Learning context: ' + esc(S.modules[a.contextModule].name) : 'Not assigned to a learning context yet') +
      ' · Updated ' + esc(a.updated) + ' ' + sampleTag() + '</div></div>' +
      '<div class="pactions"><a class="btn sec" href="#/faculty/assessment/' + a.id + '/preview">' + ic('eye') + 'Preview learner view</a></div></div>';
  }

  function viewBuilderQuestions(aid) {
    var a = S.assessments[aid];
    if (!a) return shell('faculty', '#/faculty/assessments', '', '<p>Not found.</p>');
    var rows;
    if (!a.questions.length) {
      rows = emptyState('list', 'No questions in this assessment yet', 'Add questions from the Question Bank. Only questions marked Ready can be included — AI-generated drafts must be reviewed and accepted first.', '<button class="btn pri" type="button" id="btn-addq">' + ic('plus') + 'Add from Question Bank</button>');
    } else {
      rows = a.questions.map(function (qid, i) {
        var q = S.bank[qid];
        return '<div class="qrow"><span class="qnum" aria-hidden="true">' + (i + 1) + '</span>' +
          '<div class="qbody"><div class="qtext">' + esc(q.text) + '</div>' +
          '<div class="qmeta">' + qtypeBadge(q.type) + (q.type !== 'desc' ? '' : '<span class="subtle-note">requires evaluation after submission</span>') + '</div></div>' +
          '<div class="qactions"><button class="btn sm gho" type="button" data-editq="' + qid + '">Edit</button>' +
          '<button class="btn sm gho" type="button" data-rmq="' + qid + '">Remove</button></div></div>';
      }).join('');
      rows = '<div class="cbody">' + rows + '</div>' +
        '<div class="cbody" style="border-top:1px solid var(--border-subtle)"><button class="btn sec" type="button" id="btn-addq">' + ic('plus') + 'Add from Question Bank</button></div>';
    }
    var descNote = hasDesc(a) ?
      '<div class="alert info" style="margin-top:16px">' + ic('info') + '<div><div class="at">This assessment includes a descriptive question</div>Descriptive answers require evaluation after submission, so learners see “Result pending evaluation” until the required evaluation is completed. Who performs that evaluation is a pending product decision.</div></div>' : '';
    var content = builderHead(a) + builderTabs(aid, 'questions') +
      '<div class="grid-rail"><div class="stack">' +
      '<section class="card"><div class="chead"><h2 style="font-size:15.5px;font-weight:640">Included questions</h2><span class="cnote">' + a.questions.length + ' ' + plural(a.questions.length, 'question', 'questions') + ' · total ' + fmtNum(maxMarks(a)) + ' marks with current settings</span></div>' +
      (a.questions.length ? rows : '<div class="cbody">' + rows + '</div>') +
      '</section>' + descNote +
      '</div><div class="stack">' + builderRail(a) + '</div></div>';
    return shell('faculty', '#/faculty/assessments', crumbs([{ label: 'Assessments', href: '#/faculty/assessments' }, { label: a.title }]), content);
  }
  function bindBuilderQuestions(aid) {
    var a = S.assessments[aid];
    var add = document.getElementById('btn-addq');
    if (add) add.addEventListener('click', function () { addFromBankDialog(aid); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-rmq]'), function (b) {
      b.addEventListener('click', function () {
        var qid = b.getAttribute('data-rmq');
        openDialog({
          title: 'Remove question?',
          confirmLabel: 'Remove question',
          body: '<p>“' + esc(S.bank[qid].text) + '”</p><div class="consequence">' + ic('info') + '<span>The question stays in the Question Bank — it is only removed from this assessment.</span></div>',
          onConfirm: function () {
            a.questions = a.questions.filter(function (x) { return x !== qid; });
            a.updated = nowStamp(); save(); render();
            toast('Question removed from this assessment.');
          }
        });
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-editq]'), function (b) {
      b.addEventListener('click', function () {
        S.flags.editorBack = '#/faculty/assessment/' + aid; save();
        location.hash = '#/faculty/question/' + b.getAttribute('data-editq');
      });
    });
  }
  function addFromBankDialog(aid) {
    var a = S.assessments[aid];
    var candidates = S.bankOrder.filter(function (qid) {
      var q = S.bank[qid];
      return q.inBank && q.status === 'ready' && a.questions.indexOf(qid) === -1;
    });
    var body;
    if (!candidates.length) {
      body = '<p>Every question marked Ready in the bank is already included in this assessment. Create or upload more questions in the Question Bank.</p>';
    } else {
      body = '<p style="margin-bottom:10px">Questions marked Ready in your Question Bank. AI-generated drafts are not listed — they must be reviewed and accepted first.</p>' +
        '<div style="max-height:320px;overflow:auto;border:1px solid var(--border);border-radius:var(--r-md);padding:4px 14px">' +
        candidates.map(function (qid) {
          var q = S.bank[qid];
          return '<label class="checkrow"><input type="checkbox" value="' + qid + '">' +
            '<span><span style="color:var(--text)">' + esc(q.text) + '</span><br><span style="font-size:12px;color:var(--text-3)">' + esc(TYPE_LABEL[q.type]) + '</span></span></label>';
        }).join('') + '</div>';
    }
    openDialog({
      title: 'Add questions from the bank',
      confirmLabel: candidates.length ? 'Add selected' : 'Close',
      body: body,
      onConfirm: function (root) {
        var picked = Array.prototype.slice.call(root.querySelectorAll('input[type=checkbox]:checked')).map(function (c) { return c.value; });
        if (picked.length) {
          picked.forEach(function (qid) { a.questions.push(qid); });
          a.updated = nowStamp(); save();
          toast(picked.length + ' ' + plural(picked.length, 'question', 'questions') + ' added to the assessment.');
          announce(picked.length + ' questions added.');
        }
        render();
      }
    });
  }

  /* ---------- FAC-07 · Settings (rule configuration — PM-08) ---------- */
  function viewBuilderSettings(aid) {
    var a = S.assessments[aid];
    if (!a) return shell('faculty', '#/faculty/assessments', '', '<p>Not found.</p>');
    var c = a.cfg;
    var content = builderHead(a) + builderTabs(aid, 'settings') +
      '<div class="grid-rail"><div class="stack">' +
      '<form id="cfg-form" novalidate>' +
      '<div id="cfg-errors"></div>' +

      '<fieldset class="cfggroup"><legend>Question order</legend><div class="cfgbody">' +
      '<label class="cfg-radio"><input type="radio" name="cfg-rand" value="fixed"' + (!c.randomize ? ' checked' : '') + '><span><span class="cr-t">Fixed order</span><div class="cr-d">Questions appear in the same order in every attempt.</div></span></label>' +
      '<label class="cfg-radio"><input type="radio" name="cfg-rand" value="random"' + (c.randomize ? ' checked' : '') + '><span><span class="cr-t">Randomized for each attempt</span><div class="cr-d">Each attempt presents the questions in a different order.</div></span></label>' +
      '<p class="cfg-note">The chosen order is disclosed to the learner before the attempt begins.</p>' +
      '</div></fieldset>' +

      '<fieldset class="cfggroup"><legend>Negative marking</legend><div class="cfgbody">' +
      '<label class="cfg-radio"><input type="radio" name="cfg-neg" value="on"' + (c.negativeMarking ? ' checked' : '') + '><span><span class="cr-t">On — incorrect answers deduct marks</span><div class="cr-d">The deduction per incorrect answer is set below.</div></span></label>' +
      '<label class="cfg-radio"><input type="radio" name="cfg-neg" value="off"' + (!c.negativeMarking ? ' checked' : '') + '><span><span class="cr-t">Off</span><div class="cr-d">Incorrect answers do not deduct marks. The learner’s pre-attempt disclosure will not mention negative marking.</div></span></label>' +
      '</div></fieldset>' +

      '<fieldset class="cfggroup"><legend>Timing</legend><div class="cfgbody">' +
      '<label class="cfg-radio"><input type="radio" name="cfg-time" value="none"' + (c.timeLimitMin == null ? ' checked' : '') + '><span><span class="cr-t">No time limit</span><div class="cr-d">The learner may take as long as they need.</div></span></label>' +
      '<label class="cfg-radio"><input type="radio" name="cfg-time" value="total"' + (c.timeLimitMin != null ? ' checked' : '') + '><span><span class="cr-t">Total time budget for the attempt</span><div class="cr-d cfg-inline" style="margin-top:6px"><label class="sr-only" for="cfg-minutes">Time limit in minutes</label><input type="number" id="cfg-minutes" min="1" max="600" value="' + (c.timeLimitMin != null ? c.timeLimitMin : '') + '"' + (c.timeLimitMin == null ? ' disabled' : '') + '><span class="unit">minutes in total, spent across questions as the learner chooses</span></div></span></label>' +
      '</div></fieldset>' +

      '<fieldset class="cfggroup"><legend>Marks <span class="sample-tag">SAMPLE VALUES</span></legend><div class="cfgbody">' +
      '<div class="frow">' +
      '<div class="field" id="fld-correct"><label for="cfg-correct">Marks per correct answer <span class="req">*</span></label><input type="number" id="cfg-correct" min="0.5" step="0.5" value="' + (c.marksCorrect != null ? c.marksCorrect : '') + '"></div>' +
      '<div class="field' + (c.negativeMarking ? '' : ' off') + '" id="fld-incorrect"><label for="cfg-incorrect">Deducted per incorrect answer</label><input type="number" id="cfg-incorrect" min="0" step="0.5" value="' + (c.marksIncorrect != null ? c.marksIncorrect : '') + '"' + (c.negativeMarking ? '' : ' disabled') + '><div class="hint">Applies only while negative marking is on.</div></div>' +
      '</div><div class="frow">' +
      '<div class="field" id="fld-unans"><label for="cfg-unans">Marks per unanswered question</label><input type="number" id="cfg-unans" step="0.5" value="' + (c.marksUnanswered != null ? c.marksUnanswered : 0) + '"></div>' +
      '<div class="field"><label for="cfg-floor">Reported score floor</label><label class="checkrow" style="padding-top:6px"><input type="checkbox" id="cfg-floor"' + (c.floorZero ? ' checked' : '') + '><span>The reported score does not go below zero</span></label></div>' +
      '</div></div></fieldset>' +

      '<fieldset class="cfggroup"><legend>Passing &amp; attempts <span class="sample-tag">SAMPLE VALUES</span></legend><div class="cfgbody"><div class="frow">' +
      '<div class="field" id="fld-pass"><label for="cfg-pass">Pass mark (% of total marks) <span class="req">*</span></label><input type="number" id="cfg-pass" min="1" max="100" value="' + (c.passPercent != null ? c.passPercent : '') + '"></div>' +
      '<div class="field" id="fld-attempts"><label for="cfg-attempts">Attempts allowed <span class="req">*</span></label><input type="number" id="cfg-attempts" min="1" max="99" value="' + (c.attemptLimit != null ? c.attemptLimit : '') + '"><div class="hint">Every attempt is recorded, whatever the limit.</div></div>' +
      '</div></div></fieldset>' +

      '<div class="alert info" style="margin-bottom:16px">' + ic('info') + '<div>These settings apply to <strong>this assessment only</strong> — each assessment is configured deliberately.</div></div>' +
      '<div style="display:flex;gap:10px"><button class="btn pri" type="submit">Save settings</button>' +
      '<a class="btn sec" href="#/faculty/assessment/' + aid + '">Back to questions</a></div>' +
      '</form>' +
      '</div><div class="stack">' + builderRail(a) + '</div></div>';
    return shell('faculty', '#/faculty/assessments', crumbs([{ label: 'Assessments', href: '#/faculty/assessments' }, { label: a.title }]), content);
  }
  function bindBuilderSettings(aid) {
    var a = S.assessments[aid];
    var form = document.getElementById('cfg-form');
    if (!form) return;
    // enable/disable dependent fields live
    Array.prototype.forEach.call(form.querySelectorAll('input[name=cfg-neg]'), function (r) {
      r.addEventListener('change', function () {
        var on = form.querySelector('input[name=cfg-neg]:checked').value === 'on';
        var f = document.getElementById('cfg-incorrect');
        f.disabled = !on;
        document.getElementById('fld-incorrect').classList.toggle('off', !on);
        if (on && !f.value) f.value = '';
      });
    });
    Array.prototype.forEach.call(form.querySelectorAll('input[name=cfg-time]'), function (r) {
      r.addEventListener('change', function () {
        var timed = form.querySelector('input[name=cfg-time]:checked').value === 'total';
        document.getElementById('cfg-minutes').disabled = !timed;
        if (timed) document.getElementById('cfg-minutes').focus();
      });
    });
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var errs = [];
      function num(id) { var v = document.getElementById(id).value; return v === '' ? null : Number(v); }
      var neg = form.querySelector('input[name=cfg-neg]:checked').value === 'on';
      var timed = form.querySelector('input[name=cfg-time]:checked').value === 'total';
      var vals = {
        randomize: form.querySelector('input[name=cfg-rand]:checked').value === 'random',
        negativeMarking: neg,
        timeLimitMin: timed ? num('cfg-minutes') : null,
        marksCorrect: num('cfg-correct'),
        marksIncorrect: neg ? num('cfg-incorrect') : 0,
        marksUnanswered: num('cfg-unans') == null ? 0 : num('cfg-unans'),
        passPercent: num('cfg-pass'),
        attemptLimit: num('cfg-attempts'),
        floorZero: document.getElementById('cfg-floor').checked
      };
      ['fld-correct', 'fld-incorrect', 'fld-pass', 'fld-attempts'].forEach(function (id) {
        var el = document.getElementById(id); el.classList.remove('invalid');
        var fe = el.querySelector('.ferr'); if (fe) fe.remove();
      });
      function fieldErr(fld, input, msg) {
        errs.push({ id: input, msg: msg });
        var el = document.getElementById(fld);
        el.classList.add('invalid');
        el.insertAdjacentHTML('beforeend', '<div class="ferr">' + ic('alertCirc', 'sm') + esc(msg) + '</div>');
      }
      if (timed && (vals.timeLimitMin == null || vals.timeLimitMin < 1)) errs.push({ id: 'cfg-minutes', msg: 'Enter the total time in minutes, or choose “No time limit”.' });
      if (vals.marksCorrect == null || vals.marksCorrect <= 0) fieldErr('fld-correct', 'cfg-correct', 'Enter the marks awarded per correct answer.');
      if (neg && (vals.marksIncorrect == null || vals.marksIncorrect < 0)) fieldErr('fld-incorrect', 'cfg-incorrect', 'Enter the deduction per incorrect answer (0 or more).');
      if (vals.passPercent == null || vals.passPercent < 1 || vals.passPercent > 100) fieldErr('fld-pass', 'cfg-pass', 'Enter a pass mark between 1 and 100 percent.');
      if (vals.attemptLimit == null || vals.attemptLimit < 1) fieldErr('fld-attempts', 'cfg-attempts', 'Enter how many attempts are allowed (at least 1).');
      var box = document.getElementById('cfg-errors');
      if (errs.length) {
        box.innerHTML = '<div class="alert danger" role="alert" tabindex="-1" id="cfg-errsum" style="margin-bottom:16px">' + ic('alertCirc') +
          '<div><div class="at">The settings can’t be saved yet</div><ul style="margin:4px 0 0 16px;padding:0">' +
          errs.map(function (e) { return '<li><a href="#" data-focus="' + e.id + '">' + esc(e.msg) + '</a></li>'; }).join('') + '</ul></div></div>';
        Array.prototype.forEach.call(box.querySelectorAll('[data-focus]'), function (l) {
          l.addEventListener('click', function (ev2) { ev2.preventDefault(); var t = document.getElementById(l.getAttribute('data-focus')); if (t) { t.disabled = false; t.focus(); } });
        });
        document.getElementById('cfg-errsum').focus();
        return;
      }
      box.innerHTML = '';
      a.cfg = vals;
      a.updated = nowStamp();
      save();
      toast('Settings saved for “' + a.title + '”.');
      announce('Assessment settings saved.');
      render();
    });
  }

  /* ---------- FAC-07 · Assign (learning-context association — FRD 8.1.4) ---------- */
  function viewBuilderAssign(aid) {
    var a = S.assessments[aid];
    if (!a) return shell('faculty', '#/faculty/assessments', '', '<p>Not found.</p>');
    var ready = a.questions.length > 0 && cfgComplete(a);
    var options = S.moduleOrder.map(function (mid) {
      var m = S.modules[mid];
      var takenBy = assessmentForModule(mid);
      var taken = takenBy && takenBy !== aid;
      return '<label class="cfg-radio" style="' + (taken ? 'opacity:.55' : '') + '">' +
        '<input type="radio" name="ctx" value="' + mid + '"' + (a.contextModule === mid ? ' checked' : '') + (taken ? ' disabled' : '') + '>' +
        '<span><span class="cr-t">' + esc(m.name) + '</span><div class="cr-d">' + esc(m.course) + ' · ' + m.fmt + ' simulation' +
        (taken ? ' · already has an assessment (“' + esc(S.assessments[takenBy].title) + '”)' : '') + '</div></span></label>';
    }).join('');
    var content = builderHead(a) + builderTabs(aid, 'assign') +
      '<div class="grid-rail"><div class="stack">' +
      (!ready ? '<div class="alert warning">' + ic('alertTri') + '<div><div class="at">Complete the assessment before assigning it</div>' +
        (a.questions.length === 0 ? 'Add at least one question. ' : '') + (!cfgComplete(a) ? 'Complete the settings (pass mark and attempts).' : '') + '</div></div>' : '') +
      '<section class="card"><div class="chead"><h2 style="font-size:15.5px;font-weight:640">Learning context</h2></div>' +
      '<div class="cbody">' +
      '<p class="subtle-note" style="margin-bottom:8px">The assessment becomes the assessment step of the chosen module’s learning sequence: Learning resources → Simulation → <strong>Assessment</strong> → Completion. It opens for each learner after their simulation completion is received.</p>' +
      '<div role="radiogroup" aria-label="Module to assign this assessment to">' + options + '</div>' +
      '</div>' +
      '<div class="cbody" style="border-top:1px solid var(--border-subtle);display:flex;gap:10px;flex-wrap:wrap">' +
      '<button class="btn pri" type="button" id="btn-assign"' + (ready ? '' : ' disabled') + '>' + (a.contextModule ? 'Change assignment' : 'Assign to module') + '</button>' +
      (a.contextModule ? '<button class="btn sec" type="button" id="btn-unassign">Remove assignment</button>' : '') +
      '</div></section>' +
      (a.contextModule ?
        '<div class="alert success">' + ic('check') + '<div><div class="at">Assigned to ' + esc(S.modules[a.contextModule].name) + '</div>Learners in this module see the assessment once their simulation completion is received. Sample learner: Rahul Verma.</div></div>' :
        '<div class="alert info">' + ic('info') + '<div><div class="at">Not assigned yet</div>This assessment is not available to any learner until it is assigned to a learning context.</div></div>') +
      '</div><div class="stack">' + builderRail(a) + '</div></div>';
    return shell('faculty', '#/faculty/assessments', crumbs([{ label: 'Assessments', href: '#/faculty/assessments' }, { label: a.title }]), content);
  }
  function bindBuilderAssign(aid) {
    var a = S.assessments[aid];
    var b = document.getElementById('btn-assign');
    if (b) b.addEventListener('click', function () {
      var sel = document.querySelector('input[name=ctx]:checked');
      if (!sel) { toast('Choose a module first.', 'info'); return; }
      var mid = sel.value;
      var m = S.modules[mid];
      openDialog({
        title: 'Assign assessment to module?',
        confirmLabel: 'Assign assessment',
        body: '<p>“' + esc(a.title) + '” will become the assessment step of <strong>' + esc(m.name) + '</strong>.</p>' +
          '<div class="consequence">' + ic('info') + '<span>Learners in this module will see the assessment in their learning sequence. It opens for each learner after their simulation completion is received. You can remove the assignment later.</span></div>',
        onConfirm: function () {
          a.contextModule = mid;
          a.updated = nowStamp(); save();
          toast('Assessment assigned to ' + m.name + '.');
          announce('Assessment assigned to ' + m.name + '. It is now part of that module’s learning sequence.');
          render();
        }
      });
    });
    var u = document.getElementById('btn-unassign');
    if (u) u.addEventListener('click', function () {
      openDialog({
        title: 'Remove assignment?',
        confirmLabel: 'Remove assignment',
        body: '<p>“' + esc(a.title) + '” will no longer be available in <strong>' + esc(S.modules[a.contextModule].name) + '</strong>.</p>' +
          '<div class="consequence">' + ic('alertTri') + '<span>Learners will no longer see this assessment. Recorded attempts and scores are kept.</span></div>',
        onConfirm: function () {
          a.contextModule = null;
          a.updated = nowStamp(); save();
          toast('Assignment removed. The assessment is configured but not available to learners.');
          render();
        }
      });
    });
  }

  /* ---------- Preview (learner view, from the same configuration) ---------- */
  function viewBuilderPreview(aid) {
    var a = S.assessments[aid];
    if (!a) return shell('faculty', '#/faculty/assessments', '', '<p>Not found.</p>');
    var qcards = a.questions.map(function (qid, i) {
      var q = S.bank[qid];
      return '<section class="card qcard"><div class="cbody">' +
        '<div class="qkind">Question ' + (i + 1) + ' of ' + a.questions.length + ' · ' + esc(TYPE_LABEL[q.type]) + '</div>' +
        '<p class="qprompt">' + esc(q.text) + '</p>' +
        questionBody(q, null, false) +
        '</div></section>';
    }).join('');
    var content =
      '<div class="phead"><div class="ptitles"><h1>Preview — learner view</h1>' +
      '<div class="pmeta">' + esc(a.title) + (a.contextModule ? ' · ' + esc(S.modules[a.contextModule].name) : '') + '</div></div>' +
      '<div class="pactions"><a class="btn sec" href="#/faculty/assessment/' + aid + '">' + ic('ret') + 'Back to builder</a></div></div>' +
      '<div class="previewbar">' + ic('eye') + '<div><span class="pb-t">Faculty preview.</span> This is what the learner will see, generated from this assessment’s current configuration. Nothing you do here is recorded. This preview does not display answer-key information — post-submission feedback depends on the assessment’s approved feedback policy.</div></div>' +
      '<div class="grid-rail"><div class="stack">' +
      (a.questions.length ? qcards : '<section class="card"><div class="cbody">' + emptyState('list', 'Nothing to preview yet', 'Add questions to the assessment to preview the learner experience.') + '</div></section>') +
      '</div><div class="stack">' +
      (cfgComplete(a) ? disclosureCard(a, null) :
        '<div class="alert warning">' + ic('alertTri') + '<div><div class="at">Settings incomplete</div>The learner introduction can’t be generated until the settings are complete (pass mark and attempts).</div></div>') +
      '</div></div>';
    return shell('faculty', '#/faculty/assessments', crumbs([{ label: 'Assessments', href: '#/faculty/assessments' }, { label: a.title, href: '#/faculty/assessment/' + aid }, { label: 'Preview' }]), content);
  }

  /* ---------- FAC-08 · Question Bank ---------- */
  function viewQuestionBank() {
    var qy = (S.flags.qSearch || '').toLowerCase();
    var tf = S.flags.qType || 'all';
    var ids = S.bankOrder.filter(function (qid) {
      var q = S.bank[qid];
      if (!q.inBank) return false;
      if (tf !== 'all' && q.type !== tf) return false;
      if (qy && q.text.toLowerCase().indexOf(qy) === -1) return false;
      return true;
    });
    var total = S.bankOrder.filter(function (qid) { return S.bank[qid].inBank; }).length;
    var rows = ids.map(function (qid) {
      var q = S.bank[qid];
      var used = usedIn(qid).length;
      var status = q.status === 'ai' ?
        '<a href="#/faculty/questions/ai" style="text-decoration:none">' + aiDraftBadges() + '</a>' :
        '<span class="badge b-success-o">' + ic('check', 'sm') + 'Ready</span>' +
        (q.origin === 'upload' ? ' <span class="badge b-neutral">Uploaded</span>' : '') +
        (q.origin === 'ai' ? ' <span class="badge b-neutral">' + ic('sparkle', 'sm') + 'AI-assisted</span>' : '');
      return '<tr><td style="max-width:520px"><button class="rowlink linklike" data-open="' + qid + '" style="background:none;border:0;padding:0;text-align:left;font:inherit;color:inherit;cursor:pointer"><span class="tmain">' + esc(q.text) + '</span></button>' +
        '<div class="tsub">' + (used ? 'Used in ' + used + ' ' + plural(used, 'assessment', 'assessments') : 'Not used in an assessment yet') + '</div></td>' +
        '<td>' + qtypeBadge(q.type) + '</td>' +
        '<td>' + status + '</td>' +
        '<td><button class="btn sm gho" type="button" data-open="' + qid + '">' + (q.status === 'ai' ? 'Review' : 'Edit') + '</button></td></tr>';
    }).join('');
    var body = ids.length ?
      '<table class="dt"><caption class="sr-only">Question bank</caption>' +
      '<thead><tr><th scope="col">Question</th><th scope="col">Type</th><th scope="col">Status</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' + rows + '</tbody></table>' :
      (total === 0 ?
        emptyState('list', 'The question bank is empty', 'Upload questions with the spreadsheet template, generate drafts with AI assistance, or add a question directly.') :
        emptyState('search', 'No matching questions', 'No question matches the current search and filters. Clear them to see the full bank.'));
    var aiCount = S.bankOrder.filter(function (qid) { return S.bank[qid].inBank && S.bank[qid].status === 'ai'; }).length;
    var content =
      '<div class="phead"><div class="ptitles"><h1>Question Bank</h1>' +
      '<div class="pmeta">Questions owned by your faculty account at Sample Engineering Institute. Only questions marked Ready can be added to an assessment. ' + sampleTag() + '</div></div>' +
      '<div class="pactions">' +
      '<button class="btn sec" type="button" id="btn-upload">' + ic('upload') + 'Upload questions</button>' +
      '<a class="btn sec" href="#/faculty/questions/ai">' + ic('sparkle') + 'Generate with AI' + (aiCount ? ' <span class="ncount" style="background:var(--fmt-vr-s);color:var(--fmt-vr)">' + aiCount + '</span>' : '') + '</a>' +
      '<button class="btn pri" type="button" id="btn-newq">' + ic('plus') + 'Add question</button></div></div>' +
      (S.flags.uploadReport ? uploadReportPanel() : '') +
      '<div class="tablecard">' +
      '<div class="listbar"><div class="searchbox">' + ic('search') + '<label class="sr-only" for="q-search">Search questions</label><input id="q-search" type="text" placeholder="Search questions…" value="' + esc(S.flags.qSearch || '') + '"></div>' +
      '<label class="sr-only" for="q-type">Filter by type</label>' +
      '<select id="q-type">' +
      '<option value="all"' + (tf === 'all' ? ' selected' : '') + '>All types</option>' +
      '<option value="mcq"' + (tf === 'mcq' ? ' selected' : '') + '>Multiple choice</option>' +
      '<option value="tf"' + (tf === 'tf' ? ' selected' : '') + '>True / False</option>' +
      '<option value="desc"' + (tf === 'desc' ? ' selected' : '') + '>Descriptive</option></select>' +
      '<span class="lcount">' + ids.length + ' of ' + total + ' ' + plural(total, 'question', 'questions') + '</span></div>' +
      body + '</div>';
    return shell('faculty', '#/faculty/questions', '', content);
  }
  function uploadReportPanel() {
    return '<section class="card" style="margin-bottom:20px" aria-label="Upload result"><div class="chead"><h2 style="font-size:15.5px;font-weight:640">Upload result</h2>' +
      '<span class="cnote"><button class="btn sm gho" type="button" id="btn-dismiss-report">Dismiss</button></span></div>' +
      '<div class="cbody"><ul class="uprep">' +
      '<li class="ok">' + ic('check') + '<span><strong>2 questions added</strong> to the bank from “direct-shear-questions.xlsx” (sample upload).</span></li>' +
      '<li class="bad">' + ic('alertTri') + '<span><strong>Row 4 needs attention</strong> — no correct option is marked. The row was not imported; correct it in the spreadsheet and upload again, or add the question directly.</span></li>' +
      '<li class="bad">' + ic('alertTri') + '<span><strong>Row 9 needs attention</strong> — question type “matching” is not supported. Supported types: multiple choice, true/false, descriptive.</span></li>' +
      '</ul><p class="subtle-note" style="margin-top:10px">Rows with problems are reported individually — a valid row is never rejected because another row failed.</p></div></section>';
  }
  function bindQuestionBank() {
    var up = document.getElementById('btn-upload');
    if (up) up.addEventListener('click', function () {
      openDialog({
        title: 'Upload questions',
        confirmLabel: S.uploadDone ? 'Close' : 'Simulate upload (prototype)',
        body: '<p>Upload a question bank using the structured spreadsheet template.</p>' +
          '<button class="upload" type="button" style="margin:12px 0">' + '<div class="up-ic">' + ic('upload', 'lg') + '</div>' + 'Choose a spreadsheet file<br><span style="font-size:12px;color:var(--text-3)">The upload template will be confirmed by the platform team.</span></button>' +
          (S.uploadDone ? '<div class="consequence">' + ic('info') + '<span>The sample upload has already been added in this demo session. Reset the demo to run it again.</span></div>' :
            '<div class="consequence">' + ic('info') + '<span>Prototype only — no file is read. A sample result is shown: valid rows are added and invalid rows are reported individually.</span></div>'),
        onConfirm: function () {
          if (!S.uploadDone) {
            S.bank.q_up1.inBank = true; S.bank.q_up2.inBank = true;
            if (S.bankOrder.indexOf('q_up1') === -1) S.bankOrder.push('q_up1', 'q_up2');
            S.uploadDone = true;
            S.flags.uploadReport = true;
            save();
            toast('Upload processed — 2 questions added, 2 rows need attention.');
            announce('Upload processed. Two questions added. Two rows need attention.');
          }
          render();
        }
      });
    });
    var dr = document.getElementById('btn-dismiss-report');
    if (dr) dr.addEventListener('click', function () { S.flags.uploadReport = false; save(); render(); });
    var nq = document.getElementById('btn-newq');
    if (nq) nq.addEventListener('click', function () {
      S.flags.editorBack = '#/faculty/questions'; save();
      location.hash = '#/faculty/question/new';
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-open]'), function (b) {
      b.addEventListener('click', function () {
        var qid = b.getAttribute('data-open');
        if (S.bank[qid].status === 'ai') { location.hash = '#/faculty/questions/ai'; return; }
        S.flags.editorBack = '#/faculty/questions'; save();
        location.hash = '#/faculty/question/' + qid;
      });
    });
    var sr = document.getElementById('q-search');
    if (sr) sr.addEventListener('input', function () {
      S.flags.qSearch = sr.value; save();
      var v = sr.value; render();
      var el = document.getElementById('q-search');
      if (el) { el.focus(); el.setSelectionRange(v.length, v.length); }
    });
    var tp = document.getElementById('q-type');
    if (tp) tp.addEventListener('change', function () { S.flags.qType = tp.value; save(); render(); });
  }

  /* ---------- Question editor (create / edit; also edits AI drafts) ---------- */
  function viewQuestionEditor(qid) {
    var isNew = qid === 'new';
    var q = isNew ? { type: 'mcq', text: '', options: [{ k: 'A', t: '' }, { k: 'B', t: '' }, { k: 'C', t: '' }, { k: 'D', t: '' }], correct: null, status: 'ready' } : S.bank[qid];
    if (!q) return shell('faculty', '#/faculty/questions', '', '<p>Not found.</p>');
    var isAi = q.status === 'ai';
    var back = S.flags.editorBack || '#/faculty/questions';
    // MCQ option rows render (hidden) for every type so switching type to MCQ has editable rows.
    var editOpts = q.options || [{ k: 'A', t: '' }, { k: 'B', t: '' }, { k: 'C', t: '' }, { k: 'D', t: '' }];
    function optRows() {
      return editOpts.map(function (o) {
        return '<div class="cfg-radio" style="align-items:center">' +
          '<input type="radio" name="ed-correct" value="' + esc(o.k) + '"' + (q.correct === o.k ? ' checked' : '') + ' aria-label="Mark option ' + esc(o.k) + ' as the correct answer">' +
          '<span class="o-k" style="font-weight:650;color:var(--text-3);width:18px">' + esc(o.k) + '</span>' +
          '<input type="text" data-opt="' + esc(o.k) + '" value="' + esc(o.t) + '" aria-label="Option ' + esc(o.k) + ' text" style="flex:1;border:1px solid var(--border-strong);border-radius:var(--r-sm);font:inherit;font-size:14px;padding:9px 12px;min-height:42px">' +
          (editOpts.length > 2 ? '<button class="btn sm gho" type="button" data-rmopt="' + esc(o.k) + '">Remove</button>' : '') +
          '</div>';
      }).join('');
    }
    var content =
      '<div class="phead"><div class="ptitles"><h1>' + (isNew ? 'Add question' : (isAi ? 'Review AI-generated draft' : 'Edit question')) + '</h1>' +
      '<div class="pmeta">' + (isAi ? aiDraftBadges() + ' — this draft is not usable in an assessment until you accept it.' : 'Question Bank · Sample Engineering Institute') + '</div></div></div>' +
      '<form id="qed-form" novalidate style="max-width:760px">' +
      '<div id="qed-errors"></div>' +
      '<fieldset class="cfggroup"><legend>Question type</legend><div class="cfgbody" style="display:flex;gap:22px;flex-wrap:wrap">' +
      ['mcq', 'tf', 'desc'].map(function (t) {
        return '<label class="cfg-radio" style="padding:4px 0"><input type="radio" name="ed-type" value="' + t + '"' + (q.type === t ? ' checked' : '') + '><span class="cr-t">' + TYPE_LABEL[t] + '</span></label>';
      }).join('') +
      '<p class="cfg-note" style="flex-basis:100%">Multiple choice and true/false answers are scored automatically. Descriptive answers require evaluation after submission.</p>' +
      '</div></fieldset>' +
      '<div class="field" id="fld-qtext"><label for="ed-text">Question text <span class="req">*</span></label>' +
      '<textarea id="ed-text" rows="3">' + esc(q.text) + '</textarea></div>' +
      '<fieldset class="cfggroup" id="grp-mcq"' + (q.type === 'mcq' ? '' : ' hidden') + '><legend>Options</legend><div class="cfgbody" id="fld-opts">' +
      '<p class="cfg-note" style="margin-bottom:6px">Mark the correct answer. The correct answer is visible to faculty only — it is never shown to learners.</p>' +
      '<div id="opt-rows">' + optRows() + '</div>' +
      '<button class="btn sm sec" type="button" id="btn-addopt" style="margin-top:8px"' + (editOpts.length >= 6 ? ' disabled' : '') + '>' + ic('plus') + 'Add option</button>' +
      '</div></fieldset>' +
      '<fieldset class="cfggroup" id="grp-tf"' + (q.type === 'tf' ? '' : ' hidden') + '><legend>Correct answer</legend><div class="cfgbody" id="fld-tf" style="display:flex;gap:22px">' +
      '<label class="cfg-radio" style="padding:4px 0"><input type="radio" name="ed-tf" value="True"' + (q.correct === 'True' ? ' checked' : '') + '><span class="cr-t">True</span></label>' +
      '<label class="cfg-radio" style="padding:4px 0"><input type="radio" name="ed-tf" value="False"' + (q.correct === 'False' ? ' checked' : '') + '><span class="cr-t">False</span></label>' +
      '<p class="cfg-note" style="flex-basis:100%">Visible to faculty only — never shown to learners.</p>' +
      '</div></fieldset>' +
      '<div class="alert info" id="desc-note"' + (q.type === 'desc' ? '' : ' hidden') + ' style="margin-bottom:16px">' + ic('info') + '<div>Descriptive questions have no stored answer key. How submitted answers are evaluated, and by whom, is a pending product decision — the learner sees “Result pending evaluation” until the required evaluation is completed.</div></div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
      '<button class="btn pri" type="submit">' + (isNew ? 'Add to Question Bank' : (isAi ? 'Save draft changes' : 'Save question')) + '</button>' +
      '<a class="btn sec" href="' + back + '">Cancel</a></div>' +
      '</form>';
    var crumbTail = isNew ? 'Add question' : (isAi ? 'Review draft' : 'Edit question');
    return shell('faculty', '#/faculty/questions', crumbs([{ label: 'Question Bank', href: '#/faculty/questions' }, { label: crumbTail }]), content);
  }
  function bindQuestionEditor(qid) {
    var form = document.getElementById('qed-form');
    if (!form) return;
    var isNew = qid === 'new';
    // type switching shows the matching answer section
    Array.prototype.forEach.call(form.querySelectorAll('input[name=ed-type]'), function (r) {
      r.addEventListener('change', function () {
        var t = form.querySelector('input[name=ed-type]:checked').value;
        document.getElementById('grp-mcq').hidden = t !== 'mcq';
        document.getElementById('grp-tf').hidden = t !== 'tf';
        document.getElementById('desc-note').hidden = t !== 'desc';
      });
    });
    var addOpt = document.getElementById('btn-addopt');
    if (addOpt) addOpt.addEventListener('click', function () {
      var rows = document.getElementById('opt-rows');
      var n = rows.querySelectorAll('[data-opt]').length;
      if (n >= 6) return;
      var k = String.fromCharCode(65 + n);
      rows.insertAdjacentHTML('beforeend',
        '<div class="cfg-radio" style="align-items:center">' +
        '<input type="radio" name="ed-correct" value="' + k + '" aria-label="Mark option ' + k + ' as the correct answer">' +
        '<span class="o-k" style="font-weight:650;color:var(--text-3);width:18px">' + k + '</span>' +
        '<input type="text" data-opt="' + k + '" value="" aria-label="Option ' + k + ' text" style="flex:1;border:1px solid var(--border-strong);border-radius:var(--r-sm);font:inherit;font-size:14px;padding:9px 12px;min-height:42px">' +
        '</div>');
      if (n + 1 >= 6) addOpt.disabled = true;
      rows.lastElementChild.querySelector('[data-opt]').focus();
    });
    form.addEventListener('click', function (ev) {
      var rm = ev.target.closest && ev.target.closest('[data-rmopt]');
      if (rm) { rm.parentElement.remove(); }
    });
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var t = form.querySelector('input[name=ed-type]:checked').value;
      var text = document.getElementById('ed-text').value.trim();
      var errs = [];
      document.getElementById('fld-qtext').classList.remove('invalid');
      Array.prototype.forEach.call(form.querySelectorAll('.ferr'), function (e) { e.remove(); });
      if (!text) {
        errs.push({ id: 'ed-text', msg: 'Enter the question text.' });
        document.getElementById('fld-qtext').classList.add('invalid');
        document.getElementById('fld-qtext').insertAdjacentHTML('beforeend', '<div class="ferr">' + ic('alertCirc', 'sm') + 'Enter the question text.</div>');
      }
      var options = [], correct = null;
      if (t === 'mcq') {
        var seen = 0;
        Array.prototype.forEach.call(form.querySelectorAll('#opt-rows [data-opt]'), function (inp, i) {
          var k = String.fromCharCode(65 + i); // re-letter after removals
          if (inp.value.trim()) { options.push({ k: k, t: inp.value.trim() }); seen++; }
          var radio = inp.parentElement.querySelector('input[type=radio]');
          if (radio && radio.checked && inp.value.trim()) correct = k;
        });
        if (options.length < 2) {
          errs.push({ id: 'opt-rows', msg: 'Provide at least two options with text.' });
          document.getElementById('fld-opts').insertAdjacentHTML('beforeend', '<div class="ferr">' + ic('alertCirc', 'sm') + 'Provide at least two options with text.</div>');
        } else if (!correct) {
          errs.push({ id: 'opt-rows', msg: 'Mark which option is the correct answer.' });
          document.getElementById('fld-opts').insertAdjacentHTML('beforeend', '<div class="ferr">' + ic('alertCirc', 'sm') + 'Mark which option is the correct answer.</div>');
        }
      } else if (t === 'tf') {
        var tfSel = form.querySelector('input[name=ed-tf]:checked');
        if (!tfSel) {
          errs.push({ id: 'fld-tf', msg: 'Choose whether the statement is true or false.' });
          document.getElementById('fld-tf').insertAdjacentHTML('beforeend', '<div class="ferr">' + ic('alertCirc', 'sm') + 'Choose whether the statement is true or false.</div>');
        } else correct = tfSel.value;
      }
      var box = document.getElementById('qed-errors');
      if (errs.length) {
        box.innerHTML = '<div class="alert danger" role="alert" tabindex="-1" id="qed-errsum" style="margin-bottom:16px">' + ic('alertCirc') +
          '<div><div class="at">The question can’t be saved yet</div><ul style="margin:4px 0 0 16px;padding:0">' +
          errs.map(function (e) { return '<li>' + esc(e.msg) + '</li>'; }).join('') + '</ul></div></div>';
        document.getElementById('qed-errsum').focus();
        return;
      }
      box.innerHTML = '';
      var q;
      if (isNew) {
        var id = 'q_new' + (S.nextQ++);
        q = { id: id, type: t, topic: 'shear', status: 'ready', origin: 'authored', inBank: true, text: text, correct: correct };
        if (t === 'mcq') q.options = options;
        S.bank[id] = q;
        S.bankOrder.push(id);
        toast('Question added to the bank.');
        announce('Question added to the question bank.');
      } else {
        q = S.bank[qid];
        q.type = t; q.text = text; q.correct = correct;
        if (t === 'mcq') q.options = options; else delete q.options;
        toast(q.status === 'ai' ? 'Draft updated — it still needs your acceptance before it can be used.' : 'Question saved.');
        announce('Question saved.');
      }
      save();
      location.hash = S.flags.editorBack || '#/faculty/questions';
    });
  }

  /* ---------- FAC-09 · AI question drafts (FRD 5.1.2 — prototype-local, Faculty-reviewed) ---------- */
  var AI_TEMPLATES = {
    shear: [
      { type: 'mcq', text: 'Which plot from the direct shear test is used to obtain the angle of internal friction?', options: [{ k: 'A', t: 'Shear stress at failure versus normal stress' }, { k: 'B', t: 'Shear stress versus horizontal displacement' }, { k: 'C', t: 'Vertical displacement versus time' }, { k: 'D', t: 'Load versus specimen height' }], correct: 'A' },
      { type: 'tf', text: 'The direct shear test provides the complete stress state of the specimen during shearing.', correct: 'False' },
      { type: 'mcq', text: 'A commonly cited limitation of the direct shear test is that:', options: [{ k: 'A', t: 'Failure is forced along a predetermined plane' }, { k: 'B', t: 'It requires a triaxial cell' }, { k: 'C', t: 'It cannot apply a normal load' }, { k: 'D', t: 'It only works on rock specimens' }], correct: 'A' }
    ],
    bernoulli: [
      { type: 'mcq', text: 'In the Bernoulli apparatus, the total head along the duct (ignoring losses) is:', options: [{ k: 'A', t: 'Approximately constant' }, { k: 'B', t: 'Always increasing' }, { k: 'C', t: 'Always decreasing' }, { k: 'D', t: 'Zero at the throat' }], correct: 'A' },
      { type: 'tf', text: 'Piezometer readings in the experiment represent the velocity head at each tapping.', correct: 'False' },
      { type: 'desc', text: 'Describe one source of error you observed in the simulated Bernoulli experiment and how it would affect the measured heads.', correct: null }
    ]
  };
  function viewAiDrafts() {
    var drafts = S.bankOrder.filter(function (qid) { return S.bank[qid].inBank && S.bank[qid].status === 'ai'; });
    var body = '';
    if (S.ai.state === 'loading') {
      body = '<section class="card"><div class="cbody"><div class="genwrap"><span class="spinner" aria-hidden="true"></span><span role="status">Generating question drafts for review… This usually takes a moment.</span></div></div></section>';
    } else if (S.ai.state === 'failed') {
      body = '<section class="card"><div class="cbody">' +
        '<div class="alert danger">' + ic('alertCirc') + '<div><div class="at">Draft generation didn’t complete</div>Something went wrong while generating drafts. No drafts were created and nothing was added to your bank. You can try again, or add questions directly.</div></div>' +
        '<div style="margin-top:12px"><button class="btn sec" type="button" id="btn-gen-retry">' + ic('refresh') + 'Try again</button></div>' +
        '</div></section>';
    } else if (drafts.length) {
      body = drafts.map(function (qid) {
        var q = S.bank[qid];
        var opts = '';
        if (q.type === 'mcq') {
          opts = '<ol class="optlist">' + q.options.map(function (o) {
            return '<li class="' + (o.k === q.correct ? 'correct' : '') + '"><span class="ok">' + o.k + '</span><span>' + esc(o.t) + (o.k === q.correct ? ' — marked correct (visible to faculty only)' : '') + '</span></li>';
          }).join('') + '</ol>';
        } else if (q.type === 'tf') {
          opts = '<p class="subtle-note" style="margin-top:8px">Marked correct answer (faculty only): <strong>' + esc(q.correct) + '</strong></p>';
        } else {
          opts = '<p class="subtle-note" style="margin-top:8px">Descriptive — answers require evaluation after submission.</p>';
        }
        return '<article class="aicard" aria-label="AI-generated draft question">' +
          '<div class="ai-head">' + aiDraftBadges() + qtypeBadge(q.type) + '</div>' +
          '<p class="qtext">' + esc(q.text) + '</p>' + opts +
          '<div class="ai-foot">' +
          '<button class="btn sm pri" type="button" data-accept="' + qid + '">Accept into bank</button>' +
          '<button class="btn sm sec" type="button" data-edit="' + qid + '">Review &amp; edit</button>' +
          '<button class="btn sm gho" type="button" data-discard="' + qid + '">Discard</button>' +
          '<span class="subtle-note" style="margin-left:auto">Not usable in an assessment until accepted</span>' +
          '</div></article>';
      }).join('');
      body = '<div class="stack">' + body + '</div>';
    } else {
      body = '<section class="card"><div class="cbody">' + emptyState('sparkle', 'No drafts awaiting review', 'Generate question drafts and they will appear here for your review. Nothing enters the Question Bank without your acceptance.') + '</div></section>';
    }
    var content =
      '<div class="phead"><div class="ptitles"><h1>AI question drafts</h1>' +
      '<div class="pmeta">A faculty assistance tool: generated questions arrive as clearly-marked drafts for your review. <strong>No draft can enter an assessment or reach a learner until you accept it.</strong></div></div></div>' +
      '<div class="grid-rail"><div class="stack">' +
      '<section class="card"><div class="chead"><h2 style="font-size:15.5px;font-weight:640">Generate question drafts</h2></div>' +
      '<div class="cbody"><div class="frow">' +
      '<div class="field"><label for="ai-topic">Topic — learning context</label><select id="ai-topic">' +
      '<option value="shear"' + (S.ai.topic === 'shear' ? ' selected' : '') + '>Soil Mechanics — Direct Shear Test</option>' +
      '<option value="bernoulli"' + (S.ai.topic === 'bernoulli' ? ' selected' : '') + '>Fluid Dynamics — Bernoulli’s Theorem</option>' +
      '</select></div>' +
      '<div class="field"><label for="ai-count">Number of drafts</label><select id="ai-count">' +
      '<option' + (S.ai.count === 2 ? ' selected' : '') + '>2</option><option' + (S.ai.count === 3 ? ' selected' : '') + '>3</option></select></div>' +
      '</div>' +
      '<button class="btn pri" type="button" id="btn-generate"' + (S.ai.state === 'loading' ? ' disabled' : '') + '>' + ic('sparkle') + 'Generate drafts</button>' +
      '<p class="subtle-note" style="margin-top:10px">Generated questions are drafts only — review each one for correctness and fit before accepting it. Generated content is not academically validated.</p>' +
      '</div></section>' +
      body +
      protoNote('This is a local prototype of the AI-assistance flow — no real AI service is called, and the drafts are sample design data. <button class="btn sec" type="button" id="btn-failnext">Simulate a generation failure</button>') +
      '</div><div class="stack">' +
      '<section class="card"><div class="chead"><h3>How this works</h3></div><div class="cbody"><ol class="donelist">' +
      '<li class="ok"><span class="dl-ic">' + ic('check') + '</span><div><div class="dl-t">You request drafts</div><div class="dl-d">For a topic you teach.</div></div></li>' +
      '<li class="ok"><span class="dl-ic">' + ic('check') + '</span><div><div class="dl-t">Drafts arrive marked for review</div><div class="dl-d">Every draft is labelled “AI-generated draft · Review required”.</div></div></li>' +
      '<li class="ok"><span class="dl-ic">' + ic('check') + '</span><div><div class="dl-t">You edit, accept or discard</div><div class="dl-d">Only questions you accept become usable bank content.</div></div></li>' +
      '</ol><p class="subtle-note" style="margin-top:10px">AI-assisted question generation is included in the Phase-1 requirements. The final implementation approach, AI provider and technical integration remain to be determined.</p></div></section>' +
      '</div></div>';
    return shell('faculty', '#/faculty/questions', crumbs([{ label: 'Question Bank', href: '#/faculty/questions' }, { label: 'AI question drafts' }]), content);
  }
  function bindAiDrafts() {
    var gen = document.getElementById('btn-generate');
    if (gen) gen.addEventListener('click', function () {
      S.ai.topic = document.getElementById('ai-topic').value;
      S.ai.count = Number(document.getElementById('ai-count').value);
      S.ai.state = 'loading'; save(); render();
      setTimeout(function () {
        if (S.ai.failNext) {
          S.ai.failNext = false; S.ai.state = 'failed'; save(); render();
          announce('Draft generation failed. No drafts were created.');
          return;
        }
        var tpl = AI_TEMPLATES[S.ai.topic] || AI_TEMPLATES.shear;
        var made = 0;
        tpl.slice(0, S.ai.count).forEach(function (t) {
          var id = 'q_ai' + (S.nextQ++);
          var q = { id: id, type: t.type, topic: S.ai.topic, status: 'ai', origin: 'ai', inBank: true, text: t.text, correct: t.correct };
          if (t.options) q.options = JSON.parse(JSON.stringify(t.options));
          S.bank[id] = q; S.bankOrder.push(id); made++;
        });
        S.ai.state = 'idle'; save(); render();
        toast(made + ' draft ' + plural(made, 'question', 'questions') + ' generated — review required before use.');
        announce(made + ' AI-generated draft questions are ready for your review. They are not usable until accepted.');
      }, 1400);
    });
    var rt = document.getElementById('btn-gen-retry');
    if (rt) rt.addEventListener('click', function () { S.ai.state = 'idle'; save(); render(); });
    var fn = document.getElementById('btn-failnext');
    if (fn) fn.addEventListener('click', function () {
      S.ai.failNext = true; save();
      toast('The next generation attempt will fail (prototype control).', 'info');
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-accept]'), function (b) {
      b.addEventListener('click', function () {
        var q = S.bank[b.getAttribute('data-accept')];
        openDialog({
          title: 'Accept draft into the Question Bank?',
          confirmLabel: 'Accept question',
          body: '<p>“' + esc(q.text) + '”</p><div class="consequence">' + ic('info') + '<span>Accepting marks this question as Ready — it becomes available to add to assessments. You remain responsible for its academic correctness.</span></div>',
          onConfirm: function () {
            q.status = 'ready'; save(); render();
            toast('Question accepted into the bank.');
            announce('Draft accepted. The question is now available for assessments.');
          }
        });
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-edit]'), function (b) {
      b.addEventListener('click', function () {
        S.flags.editorBack = '#/faculty/questions/ai'; save();
        location.hash = '#/faculty/question/' + b.getAttribute('data-edit');
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-discard]'), function (b) {
      b.addEventListener('click', function () {
        var qid = b.getAttribute('data-discard');
        openDialog({
          title: 'Discard this draft?',
          confirmLabel: 'Discard draft',
          body: '<p>“' + esc(S.bank[qid].text) + '”</p><div class="consequence">' + ic('alertTri') + '<span>The draft is removed. It was never visible to learners.</span></div>',
          onConfirm: function () {
            delete S.bank[qid];
            S.bankOrder = S.bankOrder.filter(function (x) { return x !== qid; });
            save(); render();
            toast('Draft discarded.');
          }
        });
      });
    });
  }

  /* ============================================================
     LEARNER VIEWS — continuation of the Batch-01 learner workspace
     ============================================================ */

  function moduleSeqChip(m) {
    var aid = assessmentForModule(m.id);
    if (moduleComplete(m)) return '<span class="badge b-published">' + ic('check', 'sm') + 'Module complete</span>';
    if (aid) {
      var att = S.attempts[aid];
      var latest = latestOutcome(aid);
      if (latest && latest.state === 'pending') return '<span class="badge b-warning">' + ic('hourglass', 'sm') + 'Result pending evaluation</span>';
      if (latest && latest.state === 'not_passed' && att.used >= S.assessments[aid].cfg.attemptLimit) return '<span class="badge b-neutral">Assessment attempts used</span>';
      if (latest && latest.state === 'not_passed') return '<span class="badge b-warning">' + ic('alertTri', 'sm') + 'Assessment not passed yet</span>';
      if (att.current) return '<span class="badge b-info">' + ic('edit', 'sm') + 'Assessment attempt in progress</span>';
      if (m.sim === 'completed' && asmStatus(S.assessments[aid]) === 'assigned') return '<span class="badge b-info">' + ic('listCheck', 'sm') + 'Assessment available</span>';
    }
    if (m.sim !== 'completed') return '<span class="badge b-neutral">' + ic('play', 'sm') + 'Simulation not completed</span>';
    return '<span class="badge b-neutral">In progress</span>';
  }

  /* ---------- My Learning (entry context) ---------- */
  function viewMyLearning() {
    var rows = S.moduleOrder.map(function (mid) {
      var m = S.modules[mid];
      return '<tr><td><a class="rowlink" href="#/learner/module/' + mid + '"><span class="tmain">' + esc(m.name) + '</span></a>' +
        '<div class="tsub">' + esc(m.deviceLine) + ' · ' + esc(m.course) + '</div></td>' +
        '<td>' + fmtBadge(m.fmt) + '</td>' +
        '<td>' + moduleSeqChip(m) + '</td>' +
        '<td><a class="btn sm sec" href="#/learner/module/' + mid + '">Open</a></td></tr>';
    }).join('');
    var done = S.modules.surveying;
    var content =
      '<div class="phead"><div class="ptitles"><h1>My Learning</h1>' +
      '<div class="pmeta">Modules included in your access at Sample Engineering Institute. Each module follows the sequence: learning resources → simulation → assessment → completion.</div></div></div>' +
      '<div class="tablecard" style="margin-bottom:20px">' +
      '<div class="listbar"><h2 style="font-size:14px;font-weight:650">Your modules</h2><span class="lcount">' + S.moduleOrder.length + ' active</span></div>' +
      '<table class="dt"><caption class="sr-only">Modules in your access</caption>' +
      '<thead><tr><th scope="col">Module</th><th scope="col">Format</th><th scope="col">Status</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div>' +
      '<div class="tablecard"><div class="listbar"><h2 style="font-size:14px;font-weight:650">Completed</h2></div>' +
      '<table class="dt"><caption class="sr-only">Completed modules</caption><tbody>' +
      '<tr><td><span class="tmain">' + esc(done.name) + '</span><div class="tsub">Completed ' + esc(done.doneOn) + '</div></td>' +
      '<td>' + fmtBadge(done.fmt) + '</td><td><span class="badge b-published">' + ic('check', 'sm') + 'Completed</span></td><td></td></tr>' +
      '</tbody></table></div>';
    return shell('learner', '#/learner/my-learning', '', content);
  }

  /* ---------- LRN-04 · Module detail — the assessment step in the learning sequence ---------- */
  function viewModule(mid) {
    var m = S.modules[mid];
    if (!m) return shell('learner', '#/learner/my-learning', '', '<p>Not found.</p>');
    var aid = assessmentForModule(mid);
    var a = aid ? S.assessments[aid] : null;
    var att = aid ? S.attempts[aid] : null;
    var latest = aid ? latestOutcome(aid) : null;
    var simDone = m.sim === 'completed';

    /* assessment row state + action */
    var asmState, asmDetail, asmAction = '';
    if (!a || asmStatus(a) !== 'assigned') {
      asmState = { cls: 'dim', icon: 'listCheck', stat: 'Not available yet' };
      asmDetail = 'The assessment for this module hasn’t been made available by your institution yet.';
    } else if (!simDone) {
      asmState = { cls: 'dim', icon: 'listCheck', stat: 'Locked' };
      asmDetail = 'Available after the simulation is completed — your learning sequence finishes the simulation first.';
    } else if (latest && latest.state === 'passed') {
      asmState = { cls: 'ok', icon: 'check', stat: 'Passed' };
      asmDetail = 'Result recorded to your account.';
      asmAction = '<a class="btn sm sec" href="#/learner/assessment/' + aid + '/result">View result</a>';
    } else if (latest && latest.state === 'pending') {
      asmState = { cls: 'warn', icon: 'hourglass', stat: 'Pending' };
      asmDetail = 'Submitted — a final result will be available after the required evaluation is completed.';
      asmAction = '<a class="btn sm sec" href="#/learner/assessment/' + aid + '/result">View status</a>';
    } else if (att.current) {
      asmState = { cls: 'cur', icon: 'edit', stat: 'In progress' };
      asmDetail = 'You have an attempt in progress. Your answers so far are saved.';
      asmAction = '<a class="btn sm pri" href="#/learner/assessment/' + aid + '/attempt">Resume attempt</a>';
    } else if (latest && latest.state === 'not_passed' && att.used >= a.cfg.attemptLimit) {
      asmState = { cls: 'warn', icon: 'alertTri', stat: 'Attempts used' };
      asmDetail = 'You have used all ' + a.cfg.attemptLimit + ' configured attempts for this assessment.';
      asmAction = '<a class="btn sm sec" href="#/learner/assessment/' + aid + '/result">View result</a>';
    } else if (latest && latest.state === 'not_passed') {
      asmState = { cls: 'warn', icon: 'alertTri', stat: 'Not passed yet' };
      asmDetail = 'You can attempt again — ' + (a.cfg.attemptLimit - att.used) + ' of ' + a.cfg.attemptLimit + ' attempts remaining.';
      asmAction = '<a class="btn sm pri" href="#/learner/assessment/' + aid + '">Open assessment</a>';
    } else {
      asmState = { cls: 'cur', icon: 'arrR', stat: 'Available' };
      asmDetail = 'Your simulation completion was received' + (m.simOn ? ' on ' + m.simOn : '') + ', so the assessment is now open.';
      asmAction = '<a class="btn sm pri" href="#/learner/assessment/' + aid + '">View assessment</a>';
    }
    var complete = moduleComplete(m);
    var compState = complete ? { cls: 'ok', icon: 'check', stat: 'Complete' } : { cls: 'dim', icon: 'activity', stat: '' };
    var compDetail = complete ? 'All components are complete. Recorded to your account.' :
      (latest && latest.state === 'pending') ? 'Waits for the final assessment result — your progress shows the pending state.' :
        'Completes when resources, the simulation and the assessment are all done.';

    var seq =
      '<section class="card seq"><div class="chead"><h2 style="font-size:15.5px;font-weight:640">Learning sequence</h2><span class="cnote">resources → simulation → assessment → completion</span></div>' +
      '<div class="cbody"><div class="ladder">' +
      '<div class="lrow ' + (m.resourcesDone ? 'ok' : 'cur') + '"><span class="lnode" aria-hidden="true">' + ic(m.resourcesDone ? 'check' : 'book') + '</span>' +
      '<div class="lbody"><div class="lt">Learning resources<span class="lstat">' + (m.resourcesDone ? 'Viewed' : 'Start here') + '</span></div>' +
      '<div class="ld">' + (m.resources.length ? esc(m.resources.join(' · ')) : 'No resources for this module.') + '</div></div></div>' +
      '<div class="lrow ' + (simDone ? 'ok' : 'cur') + '"><span class="lnode" aria-hidden="true">' + ic(simDone ? 'check' : (m.fmt === 'Web' ? 'monitor' : 'headset')) + '</span>' +
      '<div class="lbody"><div class="lt">Simulation — ' + esc(m.fmt) + '<span class="lstat">' + (simDone ? 'Completion received' : 'Not completed') + '</span></div>' +
      '<div class="ld">' + esc(m.simNote) + (simDone && m.simOn ? ' · ' + esc(m.simOn) : '') + '</div></div></div>' +
      '<div class="lrow ' + asmState.cls + '"><span class="lnode" aria-hidden="true">' + ic(asmState.icon) + '</span>' +
      '<div class="lbody"><div class="lt">Assessment<span class="lstat">' + asmState.stat + '</span></div>' +
      '<div class="ld">' + asmDetail + '</div></div>' +
      (asmAction ? '<div class="lact">' + asmAction + '</div>' : '') + '</div>' +
      '<div class="lrow ' + compState.cls + '"><span class="lnode" aria-hidden="true">' + ic(compState.icon) + '</span>' +
      '<div class="lbody"><div class="lt">Module completion<span class="lstat">' + compState.stat + '</span></div>' +
      '<div class="ld">' + compDetail + '</div></div></div>' +
      '</div></div></section>';

    var rail = '';
    if (a && asmStatus(a) === 'assigned') {
      rail += '<section class="card"><div class="chead"><h3>Assessment</h3></div><div class="cbody">' +
        '<p style="font-size:14px;font-weight:640">' + esc(a.title) + '</p>' +
        '<p class="subtle-note" style="margin-top:6px">Set up by your institution’s faculty. Its rules are shown on the assessment introduction before you start.</p>' +
        (simDone ?
          '<div class="alert success" style="margin-top:12px">' + ic('check') + '<div><div class="at">Why is this available?</div>Your simulation completion was received' + (m.simOn ? ' on ' + esc(m.simOn) : '') + '. The assessment is the next step in your learning sequence.</div></div>' :
          '<div class="alert info" style="margin-top:12px">' + ic('info') + '<div><div class="at">Why is this locked?</div>Your learning sequence completes the simulation before the assessment. Finish the simulation on ' + (m.fmt === 'Web' ? 'the web' : 'your supported device') + ' and this will open.</div></div>') +
        '</div></section>';
    }
    rail += '<section class="card"><div class="chead"><h3>About this module</h3><span class="cnote">' + sampleTag() + '</span></div><div class="cbody">' +
      '<dl class="kv"><div class="k">Course</div><div class="v">' + esc(m.course) + '</div>' +
      '<div class="k">Simulation</div><div class="v">' + esc(m.fmt) + ' · ' + esc(m.deviceLine) + '</div></dl></div></section>';

    var content =
      '<div class="phead"><div class="ptitles"><h1>' + esc(m.name) + ' ' + fmtBadge(m.fmt) + '</h1>' +
      '<div class="pmeta">' + esc(m.course) + '</div></div></div>' +
      '<div class="grid-rail"><div class="stack">' + seq + '</div><div class="stack">' + rail + '</div></div>';
    return shell('learner', '#/learner/my-learning', crumbs([{ label: 'My Learning', href: '#/learner/my-learning' }, { label: m.name }]), content);
  }

  /* ---------- LRN-09 · Assessment introduction — disclosure generated from configuration ---------- */
  function viewIntro(aid) {
    var a = S.assessments[aid];
    if (!a) return shell('learner', '#/learner/my-learning', '', '<p>Not found.</p>');
    var m = a.contextModule ? S.modules[a.contextModule] : null;
    var att = S.attempts[aid];
    var latest = latestOutcome(aid);
    var crumbsHtml = crumbs([{ label: 'My Learning', href: '#/learner/my-learning' }].concat(m ? [{ label: m.name, href: '#/learner/module/' + m.id }] : []).concat([{ label: a.title }]));

    /* temporary load / network error state (STATE-03 grammar) */
    if (S.flags.introError) {
      var errContent =
        '<div class="phead"><div class="ptitles"><h1>' + esc(a.title) + '</h1>' +
        '<div class="pmeta">' + (m ? 'Module: ' + esc(m.name) : '') + '</div></div></div>' +
        '<section class="card" style="max-width:640px"><div class="cbody">' +
        '<div class="alert danger">' + ic('alertCirc') + '<div><div class="at">The assessment couldn’t be loaded right now</div>Your answers and attempts are safe — nothing was lost. This is usually temporary: check your connection and try again. If it keeps happening, use Help in the top bar.</div></div>' +
        '<div style="margin-top:14px;display:flex;gap:10px"><button class="btn pri" type="button" id="btn-retry-load">' + ic('refresh') + 'Try again</button>' +
        (m ? '<a class="btn sec" href="#/learner/module/' + m.id + '">Back to module</a>' : '') + '</div>' +
        '</div></section>';
      return shell('learner', '#/learner/my-learning', crumbsHtml, errContent);
    }

    var head =
      '<div class="phead"><div class="ptitles"><h1>' + esc(a.title) + '</h1>' +
      '<div class="pmeta">' + (m ? 'Module: ' + esc(m.name) + ' · ' + esc(m.course) : '') + '</div></div></div>';

    /* not available: unassigned or simulation incomplete */
    if (asmStatus(a) !== 'assigned' || !m) {
      return shell('learner', '#/learner/my-learning', crumbsHtml, head +
        '<section class="card" style="max-width:640px"><div class="cbody">' + emptyState('shield', 'This assessment isn’t available', 'It hasn’t been made available by your institution yet.') + '</div></section>');
    }
    if (m.sim !== 'completed') {
      return shell('learner', '#/learner/my-learning', crumbsHtml, head +
        '<section class="card" style="max-width:680px"><div class="cbody">' +
        '<div class="alert info">' + ic('info') + '<div><div class="at">Not yet available</div>This assessment opens after the module’s simulation completion is received. Your learning sequence is: resources → simulation → assessment.</div></div>' +
        '<div style="margin-top:14px"><a class="btn pri" href="#/learner/module/' + m.id + '">' + ic('ret') + 'Back to the module</a></div>' +
        '</div></section>');
    }

    var mainCol = '', rail = '';
    var remaining = a.cfg.attemptLimit - att.used;

    if (att.current) {
      mainCol += '<div class="alert info" style="margin-bottom:16px">' + ic('edit') + '<div><div class="at">You have an attempt in progress</div>Your answers so far are saved. Resume when you’re ready.</div></div>';
    } else if (latest && latest.state === 'pending') {
      mainCol += '<div class="alert warning" style="margin-bottom:16px">' + ic('hourglass') + '<div><div class="at">Submitted — result pending evaluation</div>Your assessment has been submitted. A final result will be available after the required evaluation is completed. <a href="#/learner/assessment/' + aid + '/result">View status</a></div></div>';
    } else if (latest && latest.state === 'passed') {
      mainCol += '<div class="alert success" style="margin-bottom:16px">' + ic('check') + '<div><div class="at">Passed</div>Your result is recorded. <a href="#/learner/assessment/' + aid + '/result">View result</a></div></div>';
    } else if (latest && latest.state === 'not_passed' && remaining <= 0) {
      mainCol += '<div class="alert warning" style="margin-bottom:16px">' + ic('alertTri') + '<div><div class="at">No attempts remaining</div>You have used all ' + a.cfg.attemptLimit + ' attempts configured for this assessment. Your recorded result stays available. <a href="#/learner/assessment/' + aid + '/result">View result</a></div></div>';
    }

    mainCol += disclosureCard(a, att, 'h2');

    /* primary action — configuration-aware */
    var canStart = !att.current && remaining > 0 && !(latest && (latest.state === 'passed' || latest.state === 'pending'));
    var cta = '';
    if (att.current) {
      cta = '<a class="btn pri lg" href="#/learner/assessment/' + aid + '/attempt">' + ic('play') + 'Resume attempt</a>';
    } else if (canStart) {
      var label = att.used === 0 ? 'Start attempt' : 'Start attempt ' + (att.used + 1) + ' of ' + a.cfg.attemptLimit;
      cta = '<button class="btn pri lg" type="button" id="btn-start">' + ic('play') + label + '</button>';
    }
    if (cta) {
      mainCol += '<div style="margin-top:20px;display:flex;gap:12px;align-items:center;flex-wrap:wrap">' + cta +
        '<a class="btn sec lg" href="#/learner/module/' + m.id + '">Back to module</a>' +
        (a.cfg.timeLimitMin != null && canStart ? '<span class="subtle-note">The ' + a.cfg.timeLimitMin + '-minute time budget starts when you begin.</span>' : '') +
        '</div>';
    }

    /* attempt history — recording is always on (11.2.2) */
    if (att.history.length) {
      rail += '<section class="card"><div class="chead"><h3>Your attempts</h3><span class="cnote">recorded to your account</span></div><div class="cbody"><ol class="timeline">' +
        att.history.map(function (h) {
          var d = h.state === 'passed' ? ['good', 'check'] : h.state === 'pending' ? ['warn', 'hourglass'] : ['warn', 'alertTri'];
          var label = h.state === 'passed' ? 'Passed — ' + h.pct + '%' : h.state === 'pending' ? 'Submitted — pending evaluation' : 'Not passed — ' + h.pct + '%';
          return '<li class="tl-item"><span class="tl-dot ' + d[0] + '" aria-hidden="true">' + ic(d[1]) + '</span>' +
            '<div class="tl-body"><div class="tl-action">Attempt ' + h.n + ' — ' + esc(label) + '</div>' +
            '<div class="tl-who">' + esc(h.when) + '</div></div></li>';
        }).join('') + '</ol></div></section>';
    }
    rail += '<section class="card"><div class="chead"><h3>Why is this available?</h3></div><div class="cbody">' +
      '<p class="subtle-note">Your simulation completion for <strong>' + esc(m.name) + '</strong> was received' + (m.simOn ? ' on ' + esc(m.simOn) : '') + '. The assessment is the next step in your learning sequence, and its rules above were set by your institution’s faculty for this assessment.</p></div></section>';

    var content = head +
      '<div class="grid-rail"><div class="stack">' + mainCol +
      protoNote('<button class="btn sec" type="button" id="btn-sim-loaderr">Simulate a temporary loading problem</button>') +
      '</div><div class="stack">' + rail + '</div></div>';
    return shell('learner', '#/learner/my-learning', crumbsHtml, content);
  }
  function bindIntro(aid) {
    var a = S.assessments[aid];
    var att = S.attempts[aid];
    var st = document.getElementById('btn-start');
    if (st) st.addEventListener('click', function () {
      var order = a.cfg.randomize ? shuffle(a.questions) : a.questions.slice();
      att.current = {
        n: att.used + 1,
        order: order,
        answers: {},
        cur: 0,
        endsAt: a.cfg.timeLimitMin != null ? Date.now() + a.cfg.timeLimitMin * 60000 : null
      };
      save();
      announce('Attempt started. Question 1 of ' + order.length + '.');
      location.hash = '#/learner/assessment/' + aid + '/attempt';
    });
    var se = document.getElementById('btn-sim-loaderr');
    if (se) se.addEventListener('click', function () { S.flags.introError = true; save(); render(); });
    var rl = document.getElementById('btn-retry-load');
    if (rl) rl.addEventListener('click', function () { S.flags.introError = false; save(); render(); toast('Assessment loaded.', 'info'); });
  }

  /* ---------- LRN-10 · Attempt ---------- */
  var timerId = null;
  function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }
  function fmtClock(ms) {
    if (ms < 0) ms = 0;
    var s = Math.floor(ms / 1000), mn = Math.floor(s / 60), ss = s % 60;
    return (mn < 10 ? '0' : '') + mn + ':' + (ss < 10 ? '0' : '') + ss;
  }
  function answeredCount(a, cur) {
    return a.questions.reduce(function (n, qid) {
      var v = cur.answers[qid];
      return n + ((v != null && String(v).trim() !== '') ? 1 : 0);
    }, 0);
  }

  function viewAttempt(aid) {
    var a = S.assessments[aid];
    var att = S.attempts[aid];
    if (!a || !att || !att.current) { location.hash = '#/learner/assessment/' + aid; return ''; }
    var cur = att.current;
    var qid = cur.order[cur.cur];
    var q = S.bank[qid];
    var n = cur.order.length;
    var ansCount = answeredCount(a, cur);
    var m = S.modules[a.contextModule];

    var qnav = cur.order.map(function (id2, i) {
      var has = cur.answers[id2] != null && String(cur.answers[id2]).trim() !== '';
      return '<button type="button" data-goq="' + i + '" class="' + (has ? 'ans' : '') + '"' + (i === cur.cur ? ' aria-current="true"' : '') +
        ' aria-label="Question ' + (i + 1) + (has ? ', answered' : ', not answered') + (i === cur.cur ? ', current' : '') + '">' + (i + 1) + '</button>';
    }).join('');

    var timer = '';
    if (cur.endsAt != null) {
      var left = cur.endsAt - Date.now();
      timer = '<span class="timerchip' + (left < 5 * 60000 ? ' low' : '') + '" id="timerchip">' + ic('clock') +
        '<span id="timer-text">' + fmtClock(left) + '</span><span class="sr-only"> remaining of the configured time budget</span></span>';
    }

    var expired = cur.endsAt != null && (cur.endsAt - Date.now()) <= 0;
    var expiredAlert = expired ?
      '<div class="alert warning" role="alert" style="margin-bottom:16px" id="time-alert">' + ic('clock') + '<div><div class="at">The configured time for this assessment has elapsed</div>Please review and submit your answers now. Your saved answers are kept.</div></div>' : '';

    var content =
      '<div class="phead"><div class="ptitles"><h1 style="font-size:20px">' + esc(a.title) + '</h1>' +
      '<div class="pmeta">Attempt ' + cur.n + ' of ' + a.cfg.attemptLimit + (m ? ' · ' + esc(m.name) : '') + ' ' + sampleTag() + '</div></div></div>' +
      expiredAlert +
      '<div class="attempt-grid"><div>' +
      '<div class="attempt-top"><span class="at-pos">Question ' + (cur.cur + 1) + ' of ' + n + '</span>' +
      '<span class="at-sub" id="ans-count">' + ansCount + ' of ' + n + ' answered</span>' + timer + '</div>' +
      '<section class="card qcard"><div class="cbody">' +
      '<div class="qkind">' + esc(TYPE_LABEL[q.type]) + (q.type === 'desc' ? ' — evaluated after submission' : '') + '</div>' +
      '<p class="qprompt">' + esc(q.text) + '</p>' +
      questionBody(q, cur.answers[qid], true) +
      '</div></section>' +
      '<div class="attempt-nav">' +
      '<button class="btn sec" type="button" id="btn-prev"' + (cur.cur === 0 ? ' disabled' : '') + '>' + ic('ret') + 'Previous</button>' +
      (cur.cur < n - 1 ? '<button class="btn pri" type="button" id="btn-next">Next question' + ic('arrR') + '</button>' : '') +
      '<span class="spacer"></span>' +
      '<a class="btn ' + (cur.cur === n - 1 ? 'pri' : 'sec') + '" href="#/learner/assessment/' + aid + '/review">' + ic('listCheck') + 'Review answers</a>' +
      '</div>' +
      '</div><div class="stack">' +
      '<section class="card"><div class="chead"><h2 style="font-size:14px;font-weight:650">Questions</h2></div><div class="cbody">' +
      '<div class="qgrid" role="navigation" aria-label="Question navigator">' + qnav + '</div>' +
      '<div class="qlegend">' +
      '<span class="lg"><span class="sw ans" aria-hidden="true"></span>Answered</span>' +
      '<span class="lg"><span class="sw cur" aria-hidden="true"></span>Current question</span>' +
      '<span class="lg"><span class="sw" aria-hidden="true"></span>Not answered yet</span></div>' +
      '</div></section>' +
      '<section class="card"><div class="cbody tight"><p class="subtle-note">' + ic('check', 'sm') + ' Answers are saved in this attempt as you go. You can leave and resume.</p></div></section>' +
      '</div></div>';
    return shell('learner', '#/learner/my-learning', crumbs([{ label: 'My Learning', href: '#/learner/my-learning' }, { label: m ? m.name : 'Module', href: m ? '#/learner/module/' + m.id : '#/learner/my-learning' }, { label: 'Attempt' }]), content);
  }
  function bindAttempt(aid) {
    var a = S.assessments[aid];
    var att = S.attempts[aid];
    if (!att.current) return;
    var cur = att.current;
    var qid = cur.order[cur.cur];
    var q = S.bank[qid];
    var n = cur.order.length;

    function updateAnsweredUi() {
      var c = answeredCount(a, cur);
      var el = document.getElementById('ans-count');
      if (el) el.textContent = c + ' of ' + n + ' answered';
      var btn = document.querySelector('[data-goq="' + cur.cur + '"]');
      var has = cur.answers[qid] != null && String(cur.answers[qid]).trim() !== '';
      if (btn) {
        btn.classList.toggle('ans', has);
        btn.setAttribute('aria-label', 'Question ' + (cur.cur + 1) + (has ? ', answered' : ', not answered') + ', current');
      }
    }
    // option selection (radio) — saved immediately, no full re-render (keyboard focus preserved)
    Array.prototype.forEach.call(document.querySelectorAll('.opt input[type=radio]'), function (r) {
      r.addEventListener('change', function () {
        cur.answers[qid] = r.value; save();
        Array.prototype.forEach.call(document.querySelectorAll('.opt'), function (o) {
          o.classList.toggle('sel', o.querySelector('input').checked);
        });
        updateAnsweredUi();
      });
    });
    // descriptive — saved on input (debounced indicator)
    var ta = document.getElementById('desc-ans');
    if (ta) {
      var deb = null;
      ta.addEventListener('input', function () {
        cur.answers[qid] = ta.value; save();
        if (deb) clearTimeout(deb);
        deb = setTimeout(function () {
          var sv = document.getElementById('desc-saved');
          if (sv) sv.hidden = !(ta.value.trim());
          updateAnsweredUi();
        }, 350);
      });
    }
    function go(i) { cur.cur = i; save(); render(); announce('Question ' + (i + 1) + ' of ' + n + '.'); }
    var prev = document.getElementById('btn-prev');
    if (prev) prev.addEventListener('click', function () { if (cur.cur > 0) go(cur.cur - 1); });
    var next = document.getElementById('btn-next');
    if (next) next.addEventListener('click', function () { if (cur.cur < n - 1) go(cur.cur + 1); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-goq]'), function (b) {
      b.addEventListener('click', function () { go(Number(b.getAttribute('data-goq'))); });
    });
    // timer — display only; expiry prompts, it never auto-submits (design assumption A6)
    if (cur.endsAt != null) {
      stopTimer();
      timerId = setInterval(function () {
        var t = document.getElementById('timer-text');
        var chip = document.getElementById('timerchip');
        if (!t) { stopTimer(); return; }
        var left = cur.endsAt - Date.now();
        t.textContent = fmtClock(left);
        if (chip && left < 5 * 60000) chip.classList.add('low');
        if (left <= 0) {
          stopTimer();
          if (!document.getElementById('time-alert')) render();
          announce('The configured time for this assessment has elapsed. Please review and submit your answers.');
        }
      }, 1000);
    }
  }

  /* ---------- Review answers (pre-submission) + LRN-11 submit confirmation ---------- */
  function viewReview(aid) {
    var a = S.assessments[aid];
    var att = S.attempts[aid];
    if (!a || !att || !att.current) { location.hash = '#/learner/assessment/' + aid; return ''; }
    var cur = att.current;
    var m = S.modules[a.contextModule];
    var n = cur.order.length;
    var unanswered = [];
    var rows = cur.order.map(function (qid, i) {
      var q = S.bank[qid];
      var v = cur.answers[qid];
      var has = v != null && String(v).trim() !== '';
      if (!has) unanswered.push(i + 1);
      var ansText;
      if (!has) ansText = 'Not answered';
      else if (q.type === 'mcq') {
        var opt = (q.options || []).filter(function (o) { return o.k === v; })[0];
        ansText = '<span class="ans-chip">' + esc(v) + ' — ' + esc(opt ? opt.t : '') + '</span>';
      } else if (q.type === 'tf') ansText = '<span class="ans-chip">' + esc(v) + '</span>';
      else ansText = '<span class="ans-chip">' + esc(String(v).length > 90 ? String(v).slice(0, 90) + '…' : v) + '</span> <span class="subtle-note">evaluated after submission</span>';
      return '<div class="revrow' + (has ? '' : ' unans') + '"><span class="qnum" aria-hidden="true">' + (i + 1) + '</span>' +
        '<div class="rv-body"><div class="rv-q">' + esc(q.text) + '</div>' +
        '<div class="rv-a">' + (has ? 'Your answer: ' : '') + ansText + '</div></div>' +
        '<button class="btn sm ' + (has ? 'gho' : 'sec') + '" type="button" data-goq="' + i + '">' + (has ? 'Change answer' : 'Answer now') + '</button></div>';
    }).join('');
    var warn = unanswered.length ?
      '<div class="alert warning" style="margin-bottom:16px">' + ic('alertTri') + '<div><div class="at">' + unanswered.length + ' ' + plural(unanswered.length, 'question', 'questions') + ' not answered (' + unanswered.join(', ') + ')</div>' +
      'Unanswered questions score ' + fmtNum(a.cfg.marksUnanswered) + ' ' + plural(a.cfg.marksUnanswered, 'mark', 'marks') + ' in this assessment. You can answer them before submitting.</div></div>' :
      '<div class="alert success" style="margin-bottom:16px">' + ic('check') + '<div><div class="at">All ' + n + ' questions answered</div>Check your answers below, then submit when you’re ready.</div></div>';
    var content =
      '<div class="phead"><div class="ptitles"><h1 style="font-size:20px">Review your answers</h1>' +
      '<div class="pmeta">' + esc(a.title) + ' · Attempt ' + cur.n + ' of ' + a.cfg.attemptLimit + '</div></div>' +
      '<div class="pactions"><a class="btn sec" href="#/learner/assessment/' + aid + '/attempt">' + ic('ret') + 'Back to questions</a>' +
      '<button class="btn pri" type="button" id="btn-submit">' + ic('send') + 'Submit assessment</button></div></div>' +
      warn +
      '<section class="card"><div class="cbody">' + rows + '</div></section>' +
      '<p class="subtle-note" style="margin-top:14px">Correct answers are not shown here — this review is for checking what you submitted, and detailed answer feedback depends on the assessment’s approved feedback policy.</p>';
    return shell('learner', '#/learner/my-learning', crumbs([{ label: 'My Learning', href: '#/learner/my-learning' }, { label: m ? m.name : 'Module', href: m ? '#/learner/module/' + m.id : '#/learner/my-learning' }, { label: 'Review answers' }]), content);
  }
  function bindReview(aid) {
    var a = S.assessments[aid];
    var att = S.attempts[aid];
    if (!att.current) return;
    var cur = att.current;
    Array.prototype.forEach.call(document.querySelectorAll('[data-goq]'), function (b) {
      b.addEventListener('click', function () {
        cur.cur = Number(b.getAttribute('data-goq')); save();
        location.hash = '#/learner/assessment/' + aid + '/attempt';
      });
    });
    var sb = document.getElementById('btn-submit');
    if (sb) sb.addEventListener('click', function () {
      var n = cur.order.length;
      var ansN = answeredCount(a, cur);
      var un = n - ansN;
      var remainingAfter = a.cfg.attemptLimit - att.used - 1;
      var attemptLine = remainingAfter > 0 ?
        'You will have ' + remainingAfter + ' ' + plural(remainingAfter, 'attempt', 'attempts') + ' remaining for this assessment.' :
        'This is your last configured attempt for this assessment.';
      var pendLine = hasDesc(a) ? ' Your final result will be available after the required evaluation is completed.' : ' Your result is available immediately.';
      openDialog({
        title: 'Submit assessment?',
        confirmLabel: 'Submit assessment',
        body: '<p>You are submitting <strong>' + ansN + ' of ' + n + '</strong> answered ' + plural(n, 'question', 'questions') + ' for “' + esc(a.title) + '”.</p>' +
          (un ? '<div class="consequence">' + ic('alertTri') + '<span>' + un + ' ' + plural(un, 'question is', 'questions are') + ' unanswered and will score ' + fmtNum(a.cfg.marksUnanswered) + ' ' + plural(a.cfg.marksUnanswered, 'mark', 'marks') + '.</span></div>' : '') +
          '<div class="consequence">' + ic('info') + '<span>After you submit, answers for this attempt can’t be changed. ' + esc(attemptLine) + esc(pendLine) + '</span></div>',
        onConfirm: function () { submitAttempt(aid); }
      });
    });
  }
  function submitAttempt(aid) {
    var a = S.assessments[aid];
    var att = S.attempts[aid];
    var cur = att.current;
    var res = scoreAttempt(a, cur.answers);
    var max = maxMarks(a);
    att.used += 1;
    var entry;
    if (hasDesc(a)) {
      entry = {
        n: cur.n, when: nowStamp(), state: 'pending',
        answered: res.answered, total: cur.order.length,
        objScore: res.score, max: max, answers: cur.answers
      };
      announce('Assessment submitted. Result pending evaluation.');
    } else {
      var raw = res.score;
      var reported = (a.cfg.floorZero && raw < 0) ? 0 : raw;
      var pct = max > 0 ? Math.round((reported / max) * 100) : 0;
      var passed = pct >= a.cfg.passPercent;
      entry = {
        n: cur.n, when: nowStamp(), state: passed ? 'passed' : 'not_passed',
        score: reported, rawScore: raw, max: max, pct: pct,
        answered: res.answered, total: cur.order.length
      };
      announce('Assessment submitted. ' + (passed ? 'Passed' : 'Not passed') + ', ' + pct + ' percent.');
    }
    att.history.unshift(entry);
    att.current = null;
    save();
    stopTimer();
    location.hash = '#/learner/assessment/' + aid + '/result';
    toast('Assessment submitted — attempt ' + entry.n + ' recorded.');
  }

  /* ---------- LRN-12 · Result — immediate result AND result-pending-evaluation states ---------- */
  function viewResult(aid) {
    var a = S.assessments[aid];
    var att = S.attempts[aid];
    var latest = latestOutcome(aid);
    var m = a && a.contextModule ? S.modules[a.contextModule] : null;
    if (!a || !latest) { location.hash = '#/learner/assessment/' + aid; return ''; }
    var crumbsHtml = crumbs([{ label: 'My Learning', href: '#/learner/my-learning' }].concat(m ? [{ label: m.name, href: '#/learner/module/' + m.id }] : []).concat([{ label: 'Result' }]));
    var head =
      '<div class="phead"><div class="ptitles"><h1>' + esc(a.title) + '</h1>' +
      '<div class="pmeta">' + (m ? 'Module: ' + esc(m.name) + ' · ' : '') + 'Attempt ' + latest.n + ' of ' + a.cfg.attemptLimit + ' · Submitted ' + esc(latest.when) + ' ' + sampleTag() + '</div></div></div>';

    var hero, detail = '', actions = '', rail = '';
    var remaining = a.cfg.attemptLimit - att.used;

    if (latest.state === 'pending') {
      hero = '<div class="result-hero pend" role="status"><span class="rh-ic" aria-hidden="true">' + ic('hourglass') + '</span>' +
        '<div><h2>Submitted — result pending evaluation</h2>' +
        '<p>Your assessment has been submitted. It includes a descriptive answer, so a final result will be available after the required evaluation is completed. Your progress will update when the final result is available.</p></div></div>';
      detail =
        '<section class="card"><div class="chead"><h3>What was submitted</h3></div><div class="cbody"><dl class="kv">' +
        '<div class="k">Questions answered</div><div class="v">' + latest.answered + ' of ' + latest.total + '</div>' +
        '<div class="k">Requires evaluation</div><div class="v">1 descriptive answer</div>' +
        '<div class="k">Submitted</div><div class="v">' + esc(latest.when) + '</div>' +
        '<div class="k">Recorded</div><div class="v">This attempt is recorded to your account</div>' +
        '</dl></div></section>' +
        '<div class="alert info" style="margin-top:16px">' + ic('info') + '<div>You don’t need to do anything — check back later, or watch your <a href="#/learner/progress">Progress</a> page. No score is shown until the final result is available.</div></div>';
      actions = '<div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap">' +
        (m ? '<a class="btn sec" href="#/learner/module/' + m.id + '">Back to module</a>' : '') +
        '<a class="btn sec" href="#/learner/progress">View progress</a></div>' +
        protoNote('<button class="btn sec" type="button" id="btn-sim-final">Simulate final result received</button> <span style="display:inline-block;margin-top:4px">Stands in for the completed evaluation — who performs it is a pending product decision.</span>');
    } else {
      var passed = latest.state === 'passed';
      hero = passed ?
        '<div class="result-hero pass" role="status"><span class="rh-ic" aria-hidden="true">' + ic('check') + '</span>' +
        '<div><h2>Passed</h2><p>' + (latest.finalized ? 'The required evaluation is complete and your final result is recorded to your account.' : 'Your result was calculated from this assessment’s configured marking and recorded to your account.') + (moduleComplete(m || {}) ? ' This module is now complete — the next module in your course sequence is unlocked.' : '') + '</p></div></div>' :
        '<div class="result-hero fail" role="status"><span class="rh-ic" aria-hidden="true">' + ic('alertCirc') + '</span>' +
        '<div><h2>Not passed' + (latest.finalized ? ' — final result' : '') + '</h2><p>Your score is below this assessment’s configured pass mark. Your attempt is recorded. ' +
        (remaining > 0 ? 'You have ' + remaining + ' ' + plural(remaining, 'attempt', 'attempts') + ' remaining — reviewing the learning resources first may help.' : 'You have used all ' + a.cfg.attemptLimit + ' attempts configured for this assessment.') + '</p></div></div>';
      detail =
        '<section class="card" style="margin-top:16px"><div class="chead"><h3>Your result</h3><span class="cnote">' + sampleTag() + '</span></div><div class="cbody">' +
        '<div class="scoreline">' +
        '<div class="sc"><div class="k">Score</div><div class="v">' + fmtNum(latest.score) + ' / ' + fmtNum(latest.max) + '</div><div class="d">marks' + (latest.rawScore != null && latest.rawScore < 0 ? ' (reported score floored at zero)' : '') + '</div></div>' +
        '<div class="sc"><div class="k">Percentage</div><div class="v">' + latest.pct + '%</div><div class="d">of total marks</div></div>' +
        '<div class="sc"><div class="k">Pass mark</div><div class="v">' + a.cfg.passPercent + '%</div><div class="d">for this assessment</div></div>' +
        '<div class="sc"><div class="k">Answered</div><div class="v">' + latest.answered + ' / ' + latest.total + '</div><div class="d">questions</div></div>' +
        '</div>' +
        (latest.finalized ? '<p class="subtle-note" style="margin-top:10px">Final result recorded on ' + esc(latest.finalizedWhen) + ' after the required evaluation was completed.</p>' : '') +
        '</div></section>' +
        '<div class="alert info" style="margin-top:16px">' + ic('info') + '<div>Detailed answer feedback depends on the assessment’s approved feedback policy.</div></div>';
      actions = '<div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap">' +
        (passed ? '<a class="btn pri" href="#/learner/progress">' + ic('activity') + 'View progress</a>' :
          (remaining > 0 ? '<a class="btn pri" href="#/learner/assessment/' + aid + '">' + ic('refresh') + 'Start attempt ' + (att.used + 1) + ' of ' + a.cfg.attemptLimit + '</a>' : '')) +
        (m ? '<a class="btn sec" href="#/learner/module/' + m.id + '">Back to module</a>' : '') +
        (!passed && m ? '<a class="btn sec" href="#/learner/module/' + m.id + '">Review learning resources</a>' : '') +
        '</div>';
    }

    if (att.history.length) {
      rail = '<section class="card"><div class="chead"><h3>Attempt history</h3><span class="cnote">recorded to your account</span></div><div class="cbody"><ol class="timeline">' +
        att.history.map(function (h) {
          var d = h.state === 'passed' ? ['good', 'check'] : h.state === 'pending' ? ['warn', 'hourglass'] : ['warn', 'alertTri'];
          var label = h.state === 'passed' ? 'Passed — ' + h.pct + '%' : h.state === 'pending' ? 'Submitted — pending evaluation' : 'Not passed — ' + h.pct + '%';
          return '<li class="tl-item"><span class="tl-dot ' + d[0] + '" aria-hidden="true">' + ic(d[1]) + '</span>' +
            '<div class="tl-body"><div class="tl-action">Attempt ' + h.n + ' — ' + esc(label) + '</div><div class="tl-who">' + esc(h.when) + '</div></div></li>';
        }).join('') + '</ol></div></section>';
    }
    rail += '<section class="card"><div class="chead"><h3>How this result works</h3></div><div class="cbody"><p class="subtle-note">' +
      'Scoring follows this assessment’s configuration — marking, pass mark and attempts were set by your institution’s faculty for this assessment. Scores and attempts are recorded to your account.</p></div></section>';

    var content = head + hero + detail + actions;
    content = '<div class="grid-rail"><div>' + content + '</div><div class="stack">' + rail + '</div></div>';
    return shell('learner', '#/learner/my-learning', crumbsHtml, content);
  }
  function bindResult(aid) {
    var b = document.getElementById('btn-sim-final');
    if (b) b.addEventListener('click', function () {
      var a = S.assessments[aid];
      var att = S.attempts[aid];
      var latest = latestOutcome(aid);
      if (!latest || latest.state !== 'pending') return;
      /* The prototype stands in for the completed evaluation: the auto-scored part is real
         prototype scoring; the descriptive answer receives a SAMPLE evaluated mark. */
      var descAward = a.cfg.marksCorrect ? Math.max(1, Math.round(a.cfg.marksCorrect / 2)) : 1; // SAMPLE
      var raw = latest.objScore + descAward;
      var reported = (a.cfg.floorZero && raw < 0) ? 0 : raw;
      var pct = latest.max > 0 ? Math.round((reported / latest.max) * 100) : 0;
      var passed = pct >= a.cfg.passPercent;
      latest.state = passed ? 'passed' : 'not_passed';
      latest.score = reported; latest.pct = pct;
      latest.finalized = true; latest.finalizedWhen = nowStamp();
      save();
      toast('Final result received — progress updated.');
      announce('Final result received. ' + (passed ? 'Passed' : 'Not passed') + ', ' + pct + ' percent. Progress updated.');
      render();
    });
  }

  /* ---------- LRN-13 · Progress ---------- */
  function viewProgress() {
    function asmCell(mid) {
      var aid = assessmentForModule(mid);
      if (!aid || asmStatus(S.assessments[aid]) !== 'assigned') return '<span class="badge b-neutral">Not available yet</span>';
      var att = S.attempts[aid];
      var latest = latestOutcome(aid);
      var m = S.modules[mid];
      if (m.sim !== 'completed') return '<span class="badge b-neutral">After simulation</span>';
      if (!latest && att.current) return '<span class="badge b-info">' + ic('edit', 'sm') + 'Attempt in progress</span>';
      if (!latest) return '<span class="badge b-info">' + ic('listCheck', 'sm') + 'Available</span>';
      if (latest.state === 'pending') return '<span class="badge b-warning">' + ic('hourglass', 'sm') + 'Result pending evaluation</span>';
      if (latest.state === 'passed') return '<span class="badge b-success">' + ic('check', 'sm') + 'Passed · ' + latest.pct + '%</span>';
      return '<span class="badge b-warning">' + ic('alertTri', 'sm') + 'Not passed · ' + latest.pct + '%</span>';
    }
    function simCell(m) {
      if (m.sim === 'completed') return '<span class="badge b-success">' + ic('check', 'sm') + 'Completion received</span>';
      return '<span class="badge b-neutral">Not completed</span>';
    }
    function modCell(m) {
      if (moduleComplete(m)) return '<span class="badge b-published">' + ic('check', 'sm') + 'Complete</span>';
      var aid = assessmentForModule(m.id);
      var latest = aid ? latestOutcome(aid) : null;
      if (latest && latest.state === 'pending') return '<span class="badge b-warning">' + ic('hourglass', 'sm') + 'Waiting on final result</span>';
      return '<span class="badge b-info">In progress</span>';
    }
    var banner = '';
    var shearLatest = latestOutcome('shearq');
    var bernLatest = latestOutcome('bernq');
    if (bernLatest && bernLatest.state === 'pending') {
      banner = '<div class="alert warning" role="status" style="margin-bottom:16px">' + ic('hourglass') + '<div><div class="at">Fluid Dynamics — Bernoulli’s Theorem: result pending evaluation</div>Your submission was received. Progress for this module will update when the final result is available.</div></div>';
    } else if (shearLatest && shearLatest.state === 'passed' && moduleComplete(S.modules.shear)) {
      banner = '<div class="alert success" role="status" style="margin-bottom:16px">' + ic('check') + '<div><div class="at">Soil Mechanics — Direct Shear Test: progress updated</div>Assessment passed and the module is complete. Your next module in the course sequence is unlocked.</div></div>';
    } else if (bernLatest && bernLatest.finalized) {
      banner = '<div class="alert success" role="status" style="margin-bottom:16px">' + ic('check') + '<div><div class="at">Fluid Dynamics — Bernoulli’s Theorem: final result received</div>The required evaluation is complete and your progress has been updated.</div></div>';
    }
    var rows = S.moduleOrder.map(function (mid) {
      var m = S.modules[mid];
      return '<tr><td><a class="rowlink" href="#/learner/module/' + mid + '"><span class="tmain">' + esc(m.name) + '</span></a></td>' +
        '<td>' + fmtBadge(m.fmt) + '</td>' +
        '<td>' + simCell(m) + '</td>' +
        '<td>' + asmCell(mid) + '</td>' +
        '<td>' + modCell(m) + '</td></tr>';
    }).join('');
    var done = S.modules.surveying;
    rows += '<tr><td><span class="tmain">' + esc(done.name) + '</span></td><td>' + fmtBadge(done.fmt) + '</td>' +
      '<td><span class="badge b-success">' + ic('check', 'sm') + 'Completion received</span></td>' +
      '<td><span class="badge b-success">' + ic('check', 'sm') + 'Passed</span></td>' +
      '<td><span class="badge b-published">' + ic('check', 'sm') + 'Complete · ' + esc(done.doneOn) + '</span></td></tr>';
    var content =
      '<div class="phead"><div class="ptitles"><h1>Progress</h1>' +
      '<div class="pmeta">Your learning progress, recorded to your account. Assessment scores and attempts are always recorded. ' + sampleTag() + '</div></div></div>' +
      banner +
      '<div class="tablecard"><table class="dt"><caption class="sr-only">Progress per module</caption>' +
      '<thead><tr><th scope="col">Module</th><th scope="col">Format</th><th scope="col">Simulation</th><th scope="col">Assessment</th><th scope="col">Module status</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div>' +
      '<p class="subtle-note" style="margin-top:14px">A module is complete when its resources, simulation and assessment are all done. While an assessment result is pending evaluation, the module stays “Waiting on final result” — it is never marked complete early.</p>';
    return shell('learner', '#/learner/progress', '', content);
  }

  /* ============================================================
     PROTOTYPE INDEX
     ============================================================ */
  function viewIndex() {
    var paths = [
      { k: 'A', title: 'Faculty happy path', steps: ['Faculty → Assessments', 'Open the draft “Consolidation Test — Module Assessment”', 'Add questions from the Question Bank', 'Complete the settings (sample values)', 'Preview the learner view', 'Assign to the Consolidation Test module'], go: [{ href: '#/faculty/assessments', label: 'Start as Faculty' }] },
      { k: 'B', title: 'AI question assistance', steps: ['Question Bank → Generate with AI', 'Loading → drafts marked “AI-generated · Review required”', 'Review & edit a draft', 'Discard one · Accept one into the bank'], go: [{ href: '#/faculty/questions/ai', label: 'Open AI drafts' }] },
      { k: 'C', title: 'Learner objective result', steps: ['Soil Mechanics — simulation completion already received', 'Assessment Introduction (rules from configuration)', 'Answer 5 objective questions', 'Review answers → Submit', 'Immediate result → Progress updated'], go: [{ href: '#/learner/module/shear', label: 'Open the module' }] },
      { k: 'D', title: 'Descriptive → pending evaluation', steps: ['Bernoulli’s Theorem — includes a descriptive answer', 'Attempt → Review → Submit', 'Result pending evaluation (no evaluator named)', 'Progress shows the pending state', '“Simulate final result received” → progress updated'], go: [{ href: '#/learner/module/bernoulli', label: 'Open the module' }] },
      { k: 'E', title: 'Configuration variation', steps: ['Faculty → Direct Shear Test — Module Assessment → Settings', 'Change a supported value (e.g. time limit, attempts, negative marking off)', 'Save', 'Learner → the introduction reflects the change', 'Negative marking off ⇒ the disclosure stops mentioning it'], go: [{ href: '#/faculty/assessment/shearq/settings', label: 'Open settings' }, { href: '#/learner/assessment/shearq', label: 'Learner intro' }] }
    ];
    var pathCards = paths.map(function (p) {
      return '<article class="pathcard"><span class="pk" aria-hidden="true">' + p.k + '</span><h2>' + esc(p.title) + '</h2>' +
        '<ol>' + p.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' +
        '<div class="pgo">' + p.go.map(function (g) { return '<a class="btn sm sec" href="' + g.href + '">' + esc(g.label) + '</a>'; }).join('') + '</div></article>';
    }).join('');
    var roles = [
      ['#/faculty/assessments', 'AM', 'Dr. Arjun Mehta', 'Faculty — Sample Engineering Institute'],
      ['#/learner/my-learning', 'RV', 'Rahul Verma', 'Learner — Sample Engineering Institute']
    ].map(function (r) {
      return '<a class="rolecard" href="' + r[0] + '"><span class="rc-av" aria-hidden="true">' + r[1] + '</span>' +
        '<span><span class="rc-name">' + esc(r[2]) + '</span><br><span class="rc-sub">' + esc(r[3]) + '</span></span></a>';
    }).join('');
    return protobar('index') +
      '<div class="index-wrap">' +
      '<div class="index-head"><span class="itag">BATCH 02 PROTOTYPE INDEX — NOT PRODUCT UI</span>' +
      '<h1>Assessment: Faculty configuration → Learner result &amp; progress</h1>' +
      '<p>Faculty sets up each assessment in the portal — questions, rules and learning context — and the learner experience is generated from that configuration (never from platform constants). ' +
      'Learners never author or configure assessments. All people, questions, dates and values are <strong>sample design data</strong>. ' +
      'No backend, no real AI service, no real scoring service — local prototype state only. Batch 01 (content governance &amp; XR access) is a separate prototype and is unchanged.</p></div>' +
      '<div class="index-section"><h2>Open a workspace</h2><div class="rolegrid">' + roles + '</div></div>' +
      '<div class="index-section"><h2>Demo paths</h2><div class="pathgrid">' + pathCards + '</div></div>' +
      '<div class="index-section"><h2>Deliberately pending (not resolved by this prototype)</h2>' +
      '<p style="font-size:13px;color:var(--text-2);max-width:860px;line-height:1.7">Who evaluates descriptive answers and on what turnaround · answer-key visibility and detailed post-attempt feedback policy · hints · single- vs multi-select multiple choice · the assessment configuration API contract · the spreadsheet upload template format · pure-B2C assessment authoring operations. The UI works with these open rather than deciding them.</p></div>' +
      '</div>';
  }

  /* ============================================================
     ROUTER
     ============================================================ */
  function route() {
    var h = location.hash || '#/index';
    return h.replace(/^#\//, '').split('/');
  }
  function render() {
    stopTimer();
    var root = document.getElementById('app-root');
    var p = route();
    var html = '', after = null;
    if (p[0] === 'faculty') {
      if (p[1] === 'assessments') { html = viewFacAssessments(); after = bindFacAssessments; }
      else if (p[1] === 'assessment' && p[2]) {
        var aid = p[2];
        if (p[3] === 'settings') { html = viewBuilderSettings(aid); after = function () { bindBuilderSettings(aid); }; }
        else if (p[3] === 'assign') { html = viewBuilderAssign(aid); after = function () { bindBuilderAssign(aid); }; }
        else if (p[3] === 'preview') { html = viewBuilderPreview(aid); }
        else { html = viewBuilderQuestions(aid); after = function () { bindBuilderQuestions(aid); }; }
      }
      else if (p[1] === 'questions' && p[2] === 'ai') { html = viewAiDrafts(); after = bindAiDrafts; }
      else if (p[1] === 'questions') { html = viewQuestionBank(); after = bindQuestionBank; }
      else if (p[1] === 'question' && p[2]) { html = viewQuestionEditor(p[2]); after = function () { bindQuestionEditor(p[2]); }; }
    }
    else if (p[0] === 'learner') {
      if (p[1] === 'my-learning') html = viewMyLearning();
      else if (p[1] === 'progress') html = viewProgress();
      else if (p[1] === 'module' && p[2]) html = viewModule(p[2]);
      else if (p[1] === 'assessment' && p[2]) {
        var lid = p[2];
        if (p[3] === 'attempt') { html = viewAttempt(lid); after = function () { bindAttempt(lid); }; }
        else if (p[3] === 'review') { html = viewReview(lid); after = function () { bindReview(lid); }; }
        else if (p[3] === 'result') { html = viewResult(lid); after = function () { bindResult(lid); }; }
        else { html = viewIntro(lid); after = function () { bindIntro(lid); }; }
      }
    }
    if (!html) html = viewIndex();
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
