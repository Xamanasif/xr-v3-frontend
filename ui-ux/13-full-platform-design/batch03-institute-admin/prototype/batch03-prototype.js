/* ============================================================
   XR Simulation Learning Platform — Batch 03 interactive prototype
   INSTITUTE ADMIN · INSTITUTIONAL CONTENT ACCESS · ELIGIBILITY
   · SINGLE SIGN-ON · INSTITUTION DATA · LEARNER ACCESS HANDOFF

   Plain JavaScript. No framework, no backend, no network request
   of any kind, no real single sign-on, no real institution-data
   integration, no real entitlement service. Every state below is
   local prototype state held in the page; the eligibility
   computation is a function over that state and is NOT a schema,
   contract or API proposal — those remain pending.

   ALL PEOPLE, IDENTIFIERS, INSTITUTIONS, CONTENT ACCESS RECORDS,
   DATES AND COUNTS ARE SAMPLE DESIGN DATA.
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- icons (inline SVG, 24 viewBox — Batch-01 set + institutional additions) ---------------- */
  var PATHS = {
    check: '<polyline points="5 12.5 10 17.5 19 7"/>',
    x: '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    minus: '<line x1="6" y1="12" x2="18" y2="12"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><line x1="16" y1="16" x2="21" y2="21"/>',
    refresh: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3L19.5 9"/><polyline points="19.5 4.5 19.5 9 15 9"/>',
    alertTri: '<path d="M12 3.5 22 20H2z"/><line x1="12" y1="10" x2="12" y2="14.5"/><circle cx="12" cy="17.2" r=".4"/>',
    alertCirc: '<circle cx="12" cy="12" r="8.5"/><line x1="12" y1="7.5" x2="12" y2="13"/><circle cx="12" cy="16.2" r=".4"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><line x1="12" y1="11" x2="12" y2="16.5"/><circle cx="12" cy="7.8" r=".4"/>',
    help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.5 9.4a2.6 2.6 0 1 1 3.6 2.4c-.9.4-1.1 1-1.1 1.9"/><circle cx="12" cy="16.6" r=".4"/>',
    home: '<path d="m4 11 8-7 8 7"/><path d="M6 9.5V20h12V9.5"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M2.8 19.6a6.4 6.4 0 0 1 12.4 0"/><path d="M15.8 5.3a3.2 3.2 0 0 1 0 5.4"/><path d="M17.6 19.6a6.5 6.5 0 0 0-2-4.2"/>',
    user: '<circle cx="12" cy="8.4" r="3.6"/><path d="M4.8 20a7.6 7.6 0 0 1 14.4 0"/>',
    building: '<path d="M4.5 21V5.2L12 3v18"/><path d="M12 9.6 19.5 11.4V21"/><line x1="7.4" y1="8" x2="9.2" y2="8"/><line x1="7.4" y1="12" x2="9.2" y2="12"/><line x1="7.4" y1="16" x2="9.2" y2="16"/><line x1="14.6" y1="14" x2="16.6" y2="14"/><line x1="14.6" y1="17.4" x2="16.6" y2="17.4"/>',
    layers: '<path d="m12 3.4 8.6 4.2L12 11.8 3.4 7.6z"/><path d="m3.4 12.1 8.6 4.2 8.6-4.2"/><path d="m3.4 16.5 8.6 4.2 8.6-4.2"/>',
    boxes: '<path d="M3.6 7.6 12 3.6l8.4 4v8.8L12 20.4l-8.4-4z"/><path d="M3.6 7.6 12 11.6l8.4-4"/><path d="M12 11.6v8.8"/>',
    link: '<path d="M9.5 14.5 14.5 9.5"/><path d="M10.8 6.8 12.6 5a3.8 3.8 0 0 1 5.4 5.4l-1.8 1.8"/><path d="M13.2 17.2 11.4 19a3.8 3.8 0 0 1-5.4-5.4l1.8-1.8"/>',
    key: '<circle cx="7.6" cy="12" r="3.9"/><path d="M11.5 12H21"/><path d="M17.6 12v3.3"/><path d="M20.2 12v2.3"/>',
    database: '<ellipse cx="12" cy="6" rx="7.4" ry="2.9"/><path d="M4.6 6v6c0 1.6 3.3 2.9 7.4 2.9s7.4-1.3 7.4-2.9V6"/><path d="M4.6 12v6c0 1.6 3.3 2.9 7.4 2.9s7.4-1.3 7.4-2.9v-6"/>',
    power: '<path d="M12 3.4v8.2"/><path d="M17.4 6.6a7.6 7.6 0 1 1-10.8 0"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><polyline points="12 7.5 12 12 15.5 14"/>',
    headset: '<path d="M3.5 11.5a8.5 8.5 0 0 1 17 0"/><rect x="2.5" y="11.5" width="4.5" height="7" rx="1.6"/><rect x="17" y="11.5" width="4.5" height="7" rx="1.6"/>',
    monitor: '<rect x="3" y="4.5" width="18" height="12.5" rx="1.5"/><line x1="9" y1="20.5" x2="15" y2="20.5"/><line x1="12" y1="17" x2="12" y2="20.5"/>',
    book: '<path d="M4.5 4.5h6.5a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4.5z"/><path d="M19.5 4.5H13"/><path d="M19.5 4.5v13H13"/>',
    activity: '<polyline points="3 12.5 7.5 12.5 10 6 14 18.5 16.5 12.5 21 12.5"/>',
    shield: '<path d="M12 3 5 5.8v5.4c0 4.5 3 7.9 7 9.3 4-1.4 7-4.8 7-9.3V5.8z"/>',
    chevD: '<polyline points="6.5 9.5 12 15 17.5 9.5"/>',
    arrR: '<line x1="4" y1="12" x2="19" y2="12"/><polyline points="13.5 6.5 19 12 13.5 17.5"/>',
    edit: '<path d="M14.5 5.5 18.5 9.5 8.5 19.5H4.5v-4z"/><path d="m12.8 7.2 4 4"/>',
    list: '<line x1="9" y1="6.5" x2="20" y2="6.5"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="17.5" x2="20" y2="17.5"/><circle cx="5" cy="6.5" r=".5"/><circle cx="5" cy="12" r=".5"/><circle cx="5" cy="17.5" r=".5"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.7"/><circle cx="12" cy="12" r="1"/>',
    calendar: '<rect x="3.5" y="5.5" width="17" height="15" rx="1.6"/><line x1="3.5" y1="10" x2="20.5" y2="10"/><line x1="8" y1="3.5" x2="8" y2="7"/><line x1="16" y1="3.5" x2="16" y2="7"/>',
    file: '<path d="M6 3h8l4 4v14H6z"/><polyline points="13.5 3.5 13.5 7.5 17.5 7.5"/>',
    play: '<path d="M8 5.5v13l10-6.5z"/>',
    eye: '<path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.6"/>',
    settings: '<circle cx="12" cy="12" r="3.1"/><path d="M12 3.4v2.4M12 18.2v2.4M3.4 12h2.4M18.2 12h2.4M5.9 5.9l1.7 1.7M16.4 16.4l1.7 1.7M18.1 5.9l-1.7 1.7M7.6 16.4l-1.7 1.7"/>'
  };
  function ic(name, cls) {
    return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (PATHS[name] || '') + '</svg>';
  }

  /* ============================================================
     SAMPLE DATA & PROTOTYPE STATE

     The access model (03_INSTITUTION_ACCESS_MODEL.md):
       content access record  →  eligibility relationship
       →  learner eligibility  →  content in My Learning
     Nothing upstream of "an access record exists" is modelled,
     because how institutional access is acquired is OPEN
     (OQ-01/OQ-02). No price, seat, term, plan or purchase field
     exists anywhere in this object graph — by design.
     ============================================================ */
  var STORAGE_KEY = 'xrslp-batch03-proto-v1';

  function initialState() {
    return {
      institution: {
        name: 'Sample Engineering Institute',
        code: 'SEI-2026',
        admin: 'Priya Nair',
        adminEmail: 'priya.nair@sample-institute.example',
        status: 'Active'
      },

      /* ---- published content the platform holds (Batch-01 / Batch-02 sample set) ---- */
      content: {
        c_shear:   { id: 'c_shear',   name: 'Soil Mechanics — Direct Shear Test',            fmt: 'VR',  device: 'VR headset — e.g. Meta Quest' },
        c_consol:  { id: 'c_consol',  name: 'Geotechnical — Consolidation Test',             fmt: 'VR',  device: 'VR headset — e.g. Meta Quest' },
        c_bern:    { id: 'c_bern',    name: 'Fluid Mechanics — Bernoulli Flow Visualisation', fmt: 'Web', device: 'Runs in a web browser' },
        c_torsion: { id: 'c_torsion', name: 'Strength of Materials — Torsion Test',           fmt: 'MR',  device: 'MR device required' },
        c_heat:    { id: 'c_heat',    name: 'Thermodynamics — Heat Exchanger Analysis',       fmt: 'VR',  device: 'VR headset — e.g. Meta Quest' },
        c_survey:  { id: 'c_survey',  name: 'Surveying — Total Station Basics',               fmt: 'Web', device: 'Runs in a web browser' }
      },

      /* ---- academic structure (arrives from the institution data connection — 7.1.2, 7.2.3) ---- */
      streams: {
        s_civil: { id: 's_civil', name: 'B.E. Civil Engineering',       source: 'data' },
        s_mech:  { id: 's_mech',  name: 'B.E. Mechanical Engineering',  source: 'data' }
      },
      streamOrder: ['s_civil', 's_mech'],
      groups: {
        g_geoA:   { id: 'g_geoA',   name: 'Geotechnical Lab — Group A (2026)',   stream: 's_civil', faculty: ['p_am'], source: 'data' },
        g_geoB:   { id: 'g_geoB',   name: 'Geotechnical Lab — Group B (2026)',   stream: 's_civil', faculty: [],       source: 'data' },
        g_fluidA: { id: 'g_fluidA', name: 'Fluid Mechanics Lab — Group A (2026)', stream: 's_civil', faculty: ['p_am'], source: 'data' },
        g_thermA: { id: 'g_thermA', name: 'Thermal Lab — Group A (2026)',        stream: 's_mech',  faculty: ['p_si'], source: 'data' }
      },
      groupOrder: ['g_geoA', 'g_geoB', 'g_fluidA', 'g_thermA'],
      courses: {
        k_geo:   { id: 'k_geo',   name: 'Geotechnical Engineering Laboratory', stream: 's_civil', source: 'data' },
        k_fluid: { id: 'k_fluid', name: 'Fluid Mechanics Laboratory',          stream: 's_civil', source: 'data' },
        k_som:   { id: 'k_som',   name: 'Strength of Materials Laboratory',    stream: 's_civil', source: 'data' },
        k_therm: { id: 'k_therm', name: 'Thermal Engineering Laboratory',      stream: 's_mech',  source: 'data' }
      },
      courseOrder: ['k_geo', 'k_fluid', 'k_som', 'k_therm'],

      /* ---- people (accounts provisioned from institution data — 7.2.2) ----
         Faculty carry no `source`: who creates a Faculty account is undefined
         (QP-07 / matrix A6), so no origin is claimed for them.               */
      people: {
        p_rv: { id: 'p_rv', name: 'Rahul Verma',       instId: 'SEI/CE/2023/0142', role: 'learner', stream: 's_civil', groups: ['g_geoA', 'g_fluidA'], account: 'active',    source: 'data', lastSignIn: '24 Aug 2026' },
        p_ak: { id: 'p_ak', name: 'Ananya Krishnan',   instId: 'SEI/CE/2023/0158', role: 'learner', stream: 's_civil', groups: ['g_geoB'],             account: 'active',    source: 'data', lastSignIn: '23 Aug 2026' },
        p_ms: { id: 'p_ms', name: 'Meera Sundaram',    instId: 'SEI/CE/2023/0163', role: 'learner', stream: 's_civil', groups: ['g_geoA'],             account: 'pending',   source: 'data', lastSignIn: null },
        p_rp: { id: 'p_rp', name: 'Rohit Pillai',      instId: 'SEI/CE/2023/0177', role: 'learner', stream: 's_civil', groups: ['g_fluidA'],           account: 'active',    source: 'data', lastSignIn: '22 Aug 2026' },
        p_kd: { id: 'p_kd', name: 'Karthik Desai',     instId: 'SEI/ME/2023/0091', role: 'learner', stream: 's_mech',  groups: ['g_thermA'],           account: 'active',    source: 'data', lastSignIn: '24 Aug 2026' },
        p_ng: { id: 'p_ng', name: 'Nikhil Gupta',      instId: 'SEI/ME/2023/0104', role: 'learner', stream: 's_mech',  groups: ['g_thermA'],           account: 'pending',   source: 'data', lastSignIn: null },
        p_tv: { id: 'p_tv', name: 'Tanya Varghese',    instId: 'SEI/ME/2023/0112', role: 'learner', stream: 's_mech',  groups: [],                     account: 'active',    source: 'data', lastSignIn: '21 Aug 2026', note: 'group' },
        p_sb: { id: 'p_sb', name: 'Sana Basheer',      instId: 'SEI/CE/2024/0027', role: 'learner', stream: null,      groups: [],                     account: 'attention', source: 'data', lastSignIn: null, note: 'stream' },
        p_am: { id: 'p_am', name: 'Dr. Arjun Mehta',   instId: 'SEI/FAC/0031',     role: 'faculty', stream: 's_civil', groups: ['g_geoA', 'g_fluidA'], account: 'active',    source: null,   lastSignIn: '25 Aug 2026' },
        p_si: { id: 'p_si', name: 'Dr. Sneha Iyer',    instId: 'SEI/FAC/0044',     role: 'faculty', stream: 's_mech',  groups: ['g_thermA'],           account: 'active',    source: null,   lastSignIn: '22 Aug 2026' }
      },
      peopleOrder: ['p_rv', 'p_ak', 'p_ms', 'p_rp', 'p_kd', 'p_ng', 'p_tv', 'p_sb', 'p_am', 'p_si'],

      /* ---- institution content access records ----
         A record says what the institution may use. It carries NO price,
         seat count, term, tier, plan, order or purchase field: how the
         institution came to hold it is upstream and OPEN (OQ-01/OQ-02). */
      access: {
        a_geo: {
          id: 'a_geo', name: 'Geotechnical & Soil Mechanics XR', status: 'active',
          covers: ['c_shear', 'c_consol'],
          eligibility: [{ id: 'e1', type: 'stream', ref: 's_civil', added: '14 Jul 2026' }],
          from: '1 Jul 2026', to: '30 Jun 2027', reference: 'ACC-2026-0114', recorded: '14 Jul 2026'
        },
        a_fluid: {
          id: 'a_fluid', name: 'Fluid Mechanics XR', status: 'active',
          covers: ['c_bern'],
          eligibility: [{ id: 'e2', type: 'group', ref: 'g_fluidA', added: '14 Jul 2026' }],
          from: '1 Jul 2026', to: '30 Jun 2027', reference: 'ACC-2026-0115', recorded: '14 Jul 2026'
        },
        a_som: {
          id: 'a_som', name: 'Strength of Materials XR', status: 'active',
          covers: ['c_torsion'],
          eligibility: [{ id: 'e3', type: 'stream', ref: 's_civil', added: '14 Jul 2026' }],
          from: '1 Jul 2026', to: null, reference: 'ACC-2026-0116', recorded: '14 Jul 2026'
        },
        a_thermo: {
          id: 'a_thermo', name: 'Thermodynamics XR', status: 'active',
          covers: ['c_heat'],
          eligibility: [{ id: 'e4', type: 'stream', ref: 's_mech', added: '2 Aug 2026' }],
          from: '1 Aug 2026', to: '31 Jul 2027', reference: 'ACC-2026-0127', recorded: '2 Aug 2026'
        },
        a_survey: {
          id: 'a_survey', name: 'Surveying XR', status: 'active',
          covers: ['c_survey'],
          eligibility: [],
          from: '18 Aug 2026', to: null, reference: 'ACC-2026-0131', recorded: '18 Aug 2026'
        }
      },
      accessOrder: ['a_geo', 'a_fluid', 'a_som', 'a_thermo', 'a_survey'],

      /* ---- institutional single sign-on (4.2.2 · PM-10) ----
         No provider, protocol, attribute or role mapping is modelled.
         `details` is whatever the identity provider supplies — the exact
         fields are pending (QD-04) and are never enumerated here.        */
      sso: {
        providerLabel: '',
        details: '',
        saved: false,
        checkAttempts: 0,
        checkState: 'none',      /* none | failed | passed */
        enabled: false,
        signIns: 0,
        unmatched: 0
      },

      /* ---- institution data connection (7.1.1, 7.1.2, 7.2.1) ----
         No endpoint, credential, payload, schema or provider is modelled. */
      erp: {
        connected: true,
        connectionName: 'Institution records — Sample Engineering Institute',
        interval: 'day',         /* 6h | 12h | day | week */
        running: false,
        runSeq: 0,
        sourceCorrected: false,
        lastRun: { when: '25 Aug 2026 · 06:10', duration: '2 min 14 s', outcome: 'issues', people: 10, streams: 2, groups: 4 },
        runs: [
          { when: '25 Aug 2026 · 06:10', outcome: 'issues', note: '3 records need attention' },
          { when: '24 Aug 2026 · 06:10', outcome: 'ok', note: 'All records applied' },
          { when: '23 Aug 2026 · 06:10', outcome: 'ok', note: 'All records applied' }
        ],
        issues: [
          {
            id: 'i_stream', kind: 'stream', title: 'Academic stream not recognised', count: 1, resolved: false, retried: false,
            what: 'One record names “CIVIL-ENGG-2023” as its academic stream. That value does not match an academic stream in this institution, so the person has not been placed in one — and no content access reaches them.',
            next: 'Once the institution’s records name an academic stream that exists here, retry these records.',
            people: ['p_sb'], link: '#/admin/structure', linkLabel: 'View academic structure'
          },
          {
            id: 'i_group', kind: 'group', title: 'Group not recognised', count: 1, resolved: false, retried: false,
            what: 'One record names a group that is not part of this institution’s academic structure. That person is in their academic stream but is not in a group, so any content access that reaches only a group will not reach them.',
            next: 'Once the institution’s records name a group that exists here, retry these records.',
            people: ['p_tv'], link: '#/admin/structure', linkLabel: 'View academic structure'
          },
          {
            id: 'i_id', kind: 'identifier', title: 'Record could not be matched to a person', count: 1, resolved: false, retried: false,
            what: 'One record arrived without the institutional identifier the platform uses to match it to a person, so nothing was changed by it.',
            next: 'Once the institution’s records include that identifier, retry these records.',
            people: [], link: '#/admin/people', linkLabel: 'View people'
          }
        ]
      },

      flags: { peopleQ: '', peopleRole: 'all', accessQ: '', eligSeq: 10 }
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
     over the demo state on next load so QA captures can open any state directly.
     Not product behaviour — the key only exists when the QA seeder wrote it.
     sessionStorage is used for interactive seeding; localStorage is read as a fallback
     so a headless capture can seed in one browser run and capture in the next. Either
     way the patch is removed as soon as it has been applied. */
  function applyQaPatch() {
    var PATCH_KEY = STORAGE_KEY + '-qa-patch';
    try {
      var raw = null;
      try { raw = sessionStorage.getItem(PATCH_KEY); } catch (e0) { /* storage unavailable */ }
      if (raw) { sessionStorage.removeItem(PATCH_KEY); }
      else {
        try { raw = localStorage.getItem(PATCH_KEY); if (raw) localStorage.removeItem(PATCH_KEY); } catch (e1) { /* storage unavailable */ }
      }
      if (!raw) return;
      var patch = JSON.parse(raw);
      (function merge(dst, src) {
        Object.keys(src).forEach(function (k) {
          if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k]) && dst[k] && typeof dst[k] === 'object' && !Array.isArray(dst[k])) merge(dst[k], src[k]);
          else dst[k] = src[k];
        });
      })(S, patch);
      save();
    } catch (e) { /* ignore malformed patches */ }
  }
  function resetDemo() {
    S = initialState(); save();
    toast('Demo reset — all sample data restored.', 'info');
    render();
  }

  /* ============================================================
     DERIVED MODEL — one eligibility computation serves every screen
     ============================================================ */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function plural(n, one, many) { return n === 1 ? one : many; }
  function learners() { return S.peopleOrder.filter(function (id) { return S.people[id].role === 'learner'; }); }
  function facultyIds() { return S.peopleOrder.filter(function (id) { return S.people[id].role === 'faculty'; }); }
  function peopleInStream(sid) { return S.peopleOrder.filter(function (id) { return S.people[id].stream === sid; }); }
  function learnersInStream(sid) { return peopleInStream(sid).filter(function (id) { return S.people[id].role === 'learner'; }); }
  function peopleInGroup(gid) { return S.peopleOrder.filter(function (id) { return (S.people[id].groups || []).indexOf(gid) !== -1; }); }
  function learnersInGroup(gid) { return peopleInGroup(gid).filter(function (id) { return S.people[id].role === 'learner'; }); }

  /* Does one eligibility relationship resolve to this person? */
  function eligMatches(e, pid) {
    var p = S.people[pid];
    if (!p) return false;
    if (e.type === 'stream') return p.stream === e.ref;
    if (e.type === 'group') return (p.groups || []).indexOf(e.ref) !== -1;
    if (e.type === 'person') return pid === e.ref;
    return false;
  }
  /* How many learners does one relationship currently reach?
     This is a consequence of institutional data — it is NOT a seat count,
     a cap or a licence capacity. OQ-03 is open; nothing here counts seats. */
  function eligReach(e) { return learners().filter(function (pid) { return eligMatches(e, pid); }); }
  function accessReach(a) {
    var set = {};
    (a.eligibility || []).forEach(function (e) { eligReach(e).forEach(function (pid) { set[pid] = true; }); });
    return Object.keys(set);
  }
  function eligLabel(e) {
    if (e.type === 'stream') return S.streams[e.ref] ? S.streams[e.ref].name : 'Academic stream';
    if (e.type === 'group') return S.groups[e.ref] ? S.groups[e.ref].name : 'Group';
    if (e.type === 'person') return S.people[e.ref] ? S.people[e.ref].name : 'Person';
    return '';
  }
  function eligKind(e) { return e.type === 'stream' ? 'Academic stream' : e.type === 'group' ? 'Group' : 'Individual learner'; }
  function eligHref(e) {
    if (e.type === 'stream') return '#/admin/structure/' + e.ref;
    if (e.type === 'group') return '#/admin/structure/' + e.ref;
    if (e.type === 'person') return '#/admin/person/' + e.ref;
    return '#/admin/access';
  }
  /* Everything one person is currently eligible for, and the relationship that produces it. */
  function personAccess(pid) {
    var out = [];
    S.accessOrder.forEach(function (aid) {
      var a = S.access[aid];
      if (a.status !== 'active') return;
      var via = (a.eligibility || []).filter(function (e) { return eligMatches(e, pid); })[0];
      if (!via) return;
      a.covers.forEach(function (cid) { out.push({ contentId: cid, accessId: aid, via: via }); });
    });
    return out;
  }
  /* Access records reaching one population (a stream or a group). */
  function accessForPopulation(type, ref) {
    return S.accessOrder.filter(function (aid) {
      return (S.access[aid].eligibility || []).some(function (e) { return e.type === type && e.ref === ref; });
    });
  }
  function unmappedAccess() {
    return S.accessOrder.filter(function (aid) { return (S.access[aid].eligibility || []).length === 0; });
  }
  function openIssues() { return S.erp.issues.filter(function (i) { return !i.resolved; }); }
  function attentionPeople() { return S.peopleOrder.filter(function (id) { return S.people[id].account === 'attention'; }); }

  /* The attention list on the Overview — every item is a real state of this institution. */
  function attentionItems() {
    var items = [];
    var un = unmappedAccess();
    if (un.length) {
      items.push({
        kind: 'warn', icon: 'boxes',
        t: un.length + ' content ' + plural(un.length, 'access record', 'access records') + ' not yet reaching learners',
        d: un.map(function (aid) { return S.access[aid].name; }).join(' · ') + ' — no one in your institution can see this content yet.',
        href: '#/admin/access', label: 'Review content access'
      });
    }
    var oi = openIssues();
    if (oi.length) {
      var n = oi.reduce(function (s, i) { return s + i.count; }, 0);
      items.push({
        kind: 'warn', icon: 'database',
        t: n + ' ' + plural(n, 'record', 'records') + ' from the last institution data run need attention',
        d: oi.map(function (i) { return i.title; }).join(' · ') + '.',
        href: '#/admin/setup/data/attention', label: 'Review records'
      });
    }
    if (!S.sso.enabled) {
      items.push({
        kind: 'warn', icon: 'key',
        t: 'Institutional sign-in is not turned on yet',
        d: S.sso.saved
          ? (S.sso.checkState === 'passed'
            ? 'The connection has been checked. Institutional sign-in can be turned on.'
            : 'Connection details are saved. Check the connection before turning institutional sign-in on.')
          : 'People in your institution cannot sign in with their institutional account until this is set up.',
        href: '#/admin/setup/sso', label: 'Set up sign-in'
      });
    }
    return items;
  }

  /* ---------------- presentation helpers ---------------- */
  function fmtBadge(f) {
    var map = { Web: 'fmt-web', VR: 'fmt-vr', MR: 'fmt-mr', AR: 'fmt-ar' };
    return '<span class="fmt ' + (map[f] || 'fmt-web') + '">' + esc(f) + '</span>';
  }
  function sampleTag() { return '<span class="sample-tag">SAMPLE DESIGN DATA</span>'; }
  function badge(cls, icon, label) { return '<span class="badge ' + cls + '">' + ic(icon, 'sm') + esc(label) + '</span>'; }
  function accountBadge(p) {
    if (p.account === 'active') return badge('b-success', 'check', 'Active');
    if (p.account === 'pending') return badge('b-neutral', 'clock', 'Awaiting first sign-in');
    return badge('b-warning', 'alertTri', 'Needs attention');
  }
  function accessBadge(a) {
    if ((a.eligibility || []).length === 0) return badge('b-warning', 'alertTri', 'Not yet reaching learners');
    return badge('b-success', 'check', 'Active');
  }
  function sourceCell(p) {
    if (p.source === 'data') return '<span class="srcchip">' + ic('database') + 'From institution data</span>';
    /* Faculty carry no origin: who creates a Faculty account is undefined (QP-07).
       A dash states "not recorded" without inventing a provisioning owner. */
    return '<span class="srcnone" aria-label="Not recorded">—</span>';
  }
  function deviceIcon(fmt) { return fmt === 'Web' ? 'monitor' : 'headset'; }
  function contentRow(c) {
    return '<li><span class="cv-ic">' + ic(deviceIcon(c.fmt)) + '</span><div class="cv-b">' +
      '<div class="cv-t">' + esc(c.name) + '</div>' +
      '<div class="cv-m">' + fmtBadge(c.fmt) + '<span>' + esc(c.device) + '</span></div></div></li>';
  }
  function intervalLabel(v) {
    return { '6h': 'Every 6 hours', '12h': 'Every 12 hours', 'day': 'Every day', 'week': 'Every week' }[v] || 'Every day';
  }

  /* ---------------- feedback primitives (Batch-01 patterns) ---------------- */
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
    function close() {
      root.innerHTML = '';
      document.removeEventListener('keydown', onKey);
      /* Only return focus if the invoking control still exists — a confirm action may have re-rendered the view. */
      if (lastFocus && lastFocus.focus && document.contains(lastFocus)) lastFocus.focus();
      else focusMain(true);
    }
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
      if (opts.onConfirm) opts.onConfirm(root);
      close();
    });
    var focusable = root.querySelector('input, select, textarea') || document.getElementById('dlg-cancel');
    if (focusable) focusable.focus();
    if (opts.afterOpen) opts.afterOpen(root);
  }

  /* ============================================================
     SHELL (SHR-02 — Batch-01 chrome, unchanged)
     ============================================================ */
  var ROLES = {
    admin: {
      key: 'admin', wsLabel: 'Institute administration', wsCtx: 'Sample Engineering Institute', inst: true,
      user: 'Priya Nair', initials: 'PN', role: 'Institute Admin',
      nav: function () {
        var attn = attentionItems().length;
        return [
          { href: '#/admin/overview',  key: 'overview',  label: 'Overview',           icon: 'home',     count: attn || null },
          { href: '#/admin/people',    key: 'people',    label: 'People',             icon: 'users',    count: S.peopleOrder.length },
          { href: '#/admin/structure', key: 'structure', label: 'Academic Structure', icon: 'layers' },
          { href: '#/admin/access',    key: 'access',    label: 'Content Access',     icon: 'boxes',    count: S.accessOrder.length },
          { href: '#/admin/setup',     key: 'setup',     label: 'Institution Setup',  icon: 'settings' }
        ];
      }
    },
    learner: {
      key: 'learner', wsLabel: 'Learner', wsCtx: 'Sample Engineering Institute', inst: true,
      user: 'Rahul Verma', initials: 'RV', role: 'Learner',
      nav: function () {
        return [{ href: '#/learner/my-learning', key: 'my-learning', label: 'My Learning', icon: 'book' }];
      }
    }
  };

  function protobar(activeRole) {
    var links = [
      { href: '#/index', label: 'Index', role: 'index' },
      { href: '#/admin/overview', label: 'Institute Admin', role: 'admin' },
      { href: '#/learner/my-learning', label: 'Learner access check', role: 'learner' }
    ];
    return '<div class="protobar" role="navigation" aria-label="Prototype navigation — not product UI">' +
      '<span class="plabel">PROTOTYPE NAVIGATION — NOT PRODUCT UI · BATCH 03</span>' +
      '<nav>' + links.map(function (l) {
        return '<a href="' + l.href + '"' + (activeRole === l.role ? ' aria-current="true"' : '') + '>' + esc(l.label) + '</a>';
      }).join('') + '</nav>' +
      '<div class="pright"><span class="plabel" style="letter-spacing:.04em">SAMPLE DESIGN DATA</span>' +
      '<button type="button" id="proto-reset">Reset demo</button></div></div>';
  }

  function shell(roleKey, activeKey, crumbHTML, contentHTML) {
    var r = ROLES[roleKey];
    var nav = r.nav().map(function (n) {
      var cur = n.key === activeKey;
      return '<a class="nitem" href="' + n.href + '"' + (cur ? ' aria-current="page"' : '') + '>' +
        ic(n.icon) + '<span>' + esc(n.label) + '</span>' +
        (n.count ? '<span class="ncount">' + n.count + '</span>' : '') + '</a>';
    }).join('');
    return protobar(roleKey) +
      '<div class="app">' +
      '<a class="skip-link" href="#main-content" id="skip-link">Skip to main content</a>' +
      '<header class="topbar">' +
      /* Logo loaded from assets/ — a byte-identical local prototype copy of
         branding/bits-pilani-wilp-logo.png (the source asset is never modified; verify with cmp).
         A local copy is used because Safari blocks parent-directory subresources when the HTML is
         opened directly from file://. If the image still cannot load, the graphic is omitted
         cleanly and the text lockup stands alone — never a broken-image icon. */
      '<div class="brand"><img src="assets/bits-pilani-wilp-logo.png" alt="BITS Pilani WILP" ' +
      'onerror="this.closest(\'.brand\').classList.add(\'no-logo\'); this.remove()">' +
      '<span class="bdiv" aria-hidden="true"></span><span class="pname">XR Simulation Learning Platform</span></div>' +
      '<div class="tspace"></div>' +
      (r.inst ? '<span class="inst-chip">' + esc(S.institution.name) + '</span>' : '') +
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
  function phead(title, metaHTML, actionsHTML, badgeHTML) {
    return '<div class="phead"><div class="ptitles"><h1>' + esc(title) + (badgeHTML || '') + '</h1>' +
      (metaHTML ? '<div class="pmeta">' + metaHTML + '</div>' : '') + '</div>' +
      (actionsHTML ? '<div class="pactions">' + actionsHTML + '</div>' : '') + '</div>';
  }
  function emptyState(icon, title, body, actionHTML) {
    return '<div class="empty"><div class="echip">' + ic(icon, 'lg') + '</div><h3>' + esc(title) + '</h3><p>' + esc(body) + '</p>' + (actionHTML || '') + '</div>';
  }
  function protoNote(bodyHTML, tagText) {
    return '<div class="proto-note"><span class="pn-label">' + esc(tagText || 'PROTOTYPE CONTROL — NOT PRODUCT UI') + '</span><div style="flex:1">' + bodyHTML + '</div></div>';
  }
  function card(titleHTML, bodyHTML, noteHTML) {
    return '<section class="card">' + (titleHTML ? '<div class="chead"><h2>' + titleHTML + '</h2>' + (noteHTML ? '<span class="cnote">' + noteHTML + '</span>' : '') + '</div>' : '') +
      '<div class="cbody">' + bodyHTML + '</div></section>';
  }
  function setupTabs(active) {
    var items = [
      { href: '#/admin/setup', key: 'setup', label: 'Institution' },
      { href: '#/admin/setup/sso', key: 'sso', label: 'Single sign-on', flag: !S.sso.enabled },
      { href: '#/admin/setup/data', key: 'data', label: 'Institution data', flag: openIssues().length > 0 }
    ];
    return '<nav class="tabnav" aria-label="Institution setup sections">' + items.map(function (t) {
      return '<a href="' + t.href + '"' + (t.key === active ? ' aria-current="page"' : '') + '>' + esc(t.label) +
        (t.flag ? '<span class="tn-flag" aria-hidden="true"></span><span class="sr-only"> — needs attention</span>' : '') + '</a>';
    }).join('') + '</nav>';
  }

  /* ============================================================
     INA-01 · INSTITUTION OVERVIEW
     Operational status only (PM-11). Four facts and a work list.
     No chart, no trend, no percentage, no seat count.
     ============================================================ */
  function viewOverview() {
    var items = attentionItems();
    var nLearn = learners().length, nFac = facultyIds().length;
    var nAttnPeople = attentionPeople().length;
    var nAccess = S.accessOrder.length, nUnmapped = unmappedAccess().length;
    var oi = openIssues(), nIssueRecords = oi.reduce(function (s, i) { return s + i.count; }, 0);

    var attn = items.length
      ? '<div class="attnlist">' + items.map(function (a) {
        return '<div class="attn-item' + (a.kind === 'info' ? ' info' : '') + '">' +
          '<span class="ai-chip">' + ic(a.icon) + '</span>' +
          '<div class="ai-body"><div class="ai-t">' + esc(a.t) + '</div><div class="ai-d">' + esc(a.d) + '</div></div>' +
          '<div class="ai-go"><a class="btn sm sec" href="' + a.href + '">' + esc(a.label) + '</a></div></div>';
      }).join('') + '</div>'
      : '<div class="attn-item info" style="padding-top:2px"><span class="ai-chip">' + ic('check') + '</span>' +
        '<div class="ai-body"><div class="ai-t">Nothing needs your attention</div>' +
        '<div class="ai-d">Institutional sign-in is on, the last institution data run applied every record, and every content access record reaches learners.</div></div></div>';

    var ssoState = !S.sso.saved ? { v: 'Not set up', d: 'People cannot sign in with their institutional account yet.' }
      : S.sso.enabled ? { v: 'On', d: 'People in your institution can sign in with their institutional account.' }
      : S.sso.checkState === 'passed' ? { v: 'Ready to turn on', d: 'The connection has been checked.' }
      : S.sso.checkState === 'failed' ? { v: 'Needs attention', d: 'The last connection check did not succeed.' }
      : { v: 'Connection not checked', d: 'Details are saved. Check the connection next.' };

    var dataState = S.erp.running ? { v: 'Running', d: 'A run is in progress.' }
      : !S.erp.connected ? { v: 'Not connected', d: 'People and academic structure are not being kept up to date.' }
      : oi.length ? { v: 'Completed with issues', d: nIssueRecords + ' ' + plural(nIssueRecords, 'record needs', 'records need') + ' attention from the last run.' }
      : { v: 'Completed', d: 'Last run applied every record.' };

    var cards =
      '<div class="opsgrid">' +
      '<div class="opscard"><div class="ok-h">' + ic('users') + 'People</div>' +
      '<div class="ok-v">' + nLearn + ' <span style="font-size:14px;font-weight:500;color:var(--text-3)">' + plural(nLearn, 'learner', 'learners') + '</span></div>' +
      '<div class="ok-d">' + nFac + ' ' + plural(nFac, 'faculty member', 'faculty members') + ' in this institution' +
      (nAttnPeople ? ' · <strong>' + nAttnPeople + ' ' + plural(nAttnPeople, 'record needs', 'records need') + ' attention</strong>' : '') + '</div>' +
      '<div class="ok-l"><a href="#/admin/people">View people ' + ic('arrR', 'sm') + '</a></div></div>' +

      '<div class="opscard' + (nUnmapped ? ' attn' : '') + '"><div class="ok-h">' + ic('boxes') + 'Content access</div>' +
      '<div class="ok-v">' + nAccess + ' <span style="font-size:14px;font-weight:500;color:var(--text-3)">' + plural(nAccess, 'record', 'records') + '</span></div>' +
      '<div class="ok-d">' + (nUnmapped ? nUnmapped + ' not yet reaching learners' : 'All reaching learners') + '</div>' +
      '<div class="ok-l"><a href="#/admin/access">View content access ' + ic('arrR', 'sm') + '</a></div></div>' +

      '<div class="opscard' + (!S.sso.enabled ? ' attn' : '') + '"><div class="ok-h">' + ic('key') + 'Institutional sign-in</div>' +
      '<div class="ok-v sm">' + esc(ssoState.v) + '</div><div class="ok-d">' + esc(ssoState.d) + '</div>' +
      '<div class="ok-l"><a href="#/admin/setup/sso">Open sign-in setup ' + ic('arrR', 'sm') + '</a></div></div>' +

      '<div class="opscard' + (oi.length ? ' attn' : '') + '"><div class="ok-h">' + ic('database') + 'Institution data</div>' +
      '<div class="ok-v sm">' + esc(dataState.v) + '</div>' +
      '<div class="ok-d">' + esc(dataState.d) + ' Last run ' + esc(S.erp.lastRun.when) + '.</div>' +
      '<div class="ok-l"><a href="#/admin/setup/data">Open institution data ' + ic('arrR', 'sm') + '</a></div></div>' +
      '</div>';

    var body =
      phead('Institution overview',
        '<span>' + esc(S.institution.name) + '</span><span class="sep" aria-hidden="true">·</span><span>' + sampleTag() + '</span>') +
      '<div class="stack">' +
      card('What needs attention', attn) +
      cards +
      '</div>';
    return shell('admin', 'overview', crumbs([{ label: 'Overview' }]), body);
  }

  /* ============================================================
     INA-02 · PEOPLE
     ============================================================ */
  function viewPeople() {
    var q = (S.flags.peopleQ || '').toLowerCase();
    var roleF = S.flags.peopleRole || 'all';
    var ids = S.peopleOrder.filter(function (id) {
      var p = S.people[id];
      if (roleF !== 'all' && p.role !== roleF) return false;
      if (!q) return true;
      return (p.name + ' ' + p.instId).toLowerCase().indexOf(q) !== -1;
    });

    var rows = ids.map(function (id) {
      var p = S.people[id];
      var ctx = p.stream ? esc(S.streams[p.stream].name) : '<span style="color:var(--warning-700);font-weight:600">Not placed in an academic stream</span>';
      var grp = (p.groups || []).length ? (p.groups || []).map(function (g) { return esc(S.groups[g].name); }).join(', ') : '—';
      return '<tr' + (p.account === 'attention' ? ' class="row-returned"' : '') + '>' +
        '<td><a class="rowlink" href="#/admin/person/' + id + '"><span class="tmain">' + esc(p.name) + '</span></a>' +
        '<div class="tsub">' + esc(p.instId) + '</div></td>' +
        '<td>' + (p.role === 'faculty' ? 'Faculty' : 'Learner') + '</td>' +
        '<td>' + ctx + '<div class="tsub">' + grp + '</div></td>' +
        '<td>' + accountBadge(p) + '</td>' +
        '<td>' + sourceCell(p) + '</td>' +
        '<td><a class="btn sm sec" href="#/admin/person/' + id + '">Open</a></td></tr>';
    }).join('');

    var counts = {
      all: S.peopleOrder.length,
      learner: learners().length,
      faculty: facultyIds().length
    };
    var chips = ['all', 'learner', 'faculty'].map(function (k) {
      var label = k === 'all' ? 'Everyone' : k === 'learner' ? 'Learners' : 'Faculty';
      return '<a href="#/admin/people?role=' + k + '"' + (roleF === k ? ' aria-current="true"' : '') + '>' + esc(label) +
        ' <span class="cf-n">' + counts[k] + '</span></a>';
    }).join('');

    var table = ids.length
      ? '<table class="dt"><caption class="sr-only">People in this institution</caption><thead><tr>' +
        '<th scope="col">Name</th><th scope="col">Role</th><th scope="col">Academic context</th>' +
        '<th scope="col">Account</th><th scope="col">Source</th><th scope="col"><span class="sr-only">Actions</span></th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table>' +
        '<div class="tfoot"><span>Showing ' + ids.length + ' of ' + S.peopleOrder.length + '</span></div>'
      : (q
        ? emptyState('search', 'No people match this search', 'No one in this institution matches “' + (S.flags.peopleQ || '') + '”. Try a different name or institutional ID.',
          '<a class="btn sm sec" href="#/admin/people">Clear search</a>')
        : emptyState('users', 'No people in this institution yet', 'People appear here once they arrive through the institution data connection.',
          '<a class="btn sm sec" href="#/admin/setup/data">Open institution data</a>'));

    var body =
      phead('People',
        '<span>' + S.peopleOrder.length + ' people in ' + esc(S.institution.name) + '</span><span class="sep" aria-hidden="true">·</span><span>' + sampleTag() + '</span>') +
      '<div class="tablecard">' +
      '<div class="listbar">' +
      '<div class="searchbox">' + ic('search') +
      '<label class="sr-only" for="people-q">Search people by name or institutional ID</label>' +
      '<input type="text" id="people-q" placeholder="Search name or institutional ID" value="' + esc(S.flags.peopleQ || '') + '"></div>' +
      '<div class="chipfilter" role="group" aria-label="Filter by role">' + chips + '</div>' +
      '<span class="lcount">' + ids.length + ' shown</span>' +
      '</div>' + table + '</div>';
    return shell('admin', 'people', crumbs([{ href: '#/admin/overview', label: 'Overview' }, { label: 'People' }]), body);
  }
  function bindPeople() {
    var inp = document.getElementById('people-q');
    if (!inp) return;
    inp.addEventListener('input', function () {
      S.flags.peopleQ = inp.value; save(); render();
      var again = document.getElementById('people-q');
      if (again) { again.focus(); again.setSelectionRange(again.value.length, again.value.length); }
    });
  }

  /* ============================================================
     INA-03 · PERSON DETAIL
     "What can this person reach, and why?" — not a profile dossier
     and not a performance view (PM-11, FRD 1.3.4).
     ============================================================ */
  function viewPerson(pid) {
    var p = S.people[pid];
    if (!p) return viewIndex();
    var acc = personAccess(pid);

    var accessBody = acc.length
      ? '<ul class="covers">' + acc.map(function (x) {
        var c = S.content[x.contentId], a = S.access[x.accessId];
        return '<li><span class="cv-ic">' + ic(deviceIcon(c.fmt)) + '</span><div class="cv-b">' +
          '<div class="cv-t">' + esc(c.name) + '</div>' +
          '<div class="cv-m">' + fmtBadge(c.fmt) +
          '<span>Through <a href="#/admin/access/' + a.id + '">' + esc(a.name) + '</a>, which reaches ' +
          esc(eligKind(x.via).toLowerCase()) + ' <strong>' + esc(eligLabel(x.via)) + '</strong></span></div></div></li>';
      }).join('') + '</ul>'
      : '<div class="alert warning">' + ic('alertTri') + '<div><div class="at">Not currently eligible for any content</div>' +
        (p.stream
          ? 'No content access currently reaches ' + esc(S.streams[p.stream].name) +
            ((p.groups || []).length ? ' or ' + plural(p.groups.length, 'this person’s group', 'this person’s groups') : '') + '.'
          : 'This person has not been placed in an academic stream, so no content access reaches them.') +
        '</div></div>';

    var attnAlert = '';
    if (p.account === 'attention') {
      attnAlert = '<div class="alert warning">' + ic('alertTri') +
        '<div><div class="at">This record needs attention</div>' +
        'The last institution data run named an academic stream that does not exist in this institution, so this person has not been placed in one. ' +
        '<a href="#/admin/setup/data/attention">Review the records needing attention</a>.</div></div>';
    } else if (p.note === 'group' && (p.groups || []).length === 0) {
      attnAlert = '<div class="alert info">' + ic('info') +
        '<div><div class="at">Not in a group</div>' +
        'This person is in their academic stream but is not in a group, so content access that reaches only a group will not reach them. ' +
        '<a href="#/admin/setup/data/attention">Review the records needing attention</a>.</div></div>';
    }

    var groupsHTML = (p.groups || []).length
      ? (p.groups || []).map(function (g) { return '<a href="#/admin/structure/' + g + '">' + esc(S.groups[g].name) + '</a>'; }).join('<br>')
      : '<span style="color:var(--text-3)">Not in a group</span>';

    var left =
      (attnAlert ? '<div style="margin-bottom:16px">' + attnAlert + '</div>' : '') +
      card('Institutional record',
        '<dl class="kv">' +
        '<div class="k">Name</div><div class="v">' + esc(p.name) + '</div>' +
        '<div class="k">Institutional ID</div><div class="v tabular">' + esc(p.instId) + '</div>' +
        '<div class="k">Role</div><div class="v">' + (p.role === 'faculty' ? 'Faculty' : 'Learner') + '</div>' +
        '<div class="k">Academic stream</div><div class="v">' + (p.stream ? '<a href="#/admin/structure/' + p.stream + '">' + esc(S.streams[p.stream].name) + '</a>' : '<span style="color:var(--warning-700);font-weight:600">Not placed in an academic stream</span>') + '</div>' +
        '<div class="k">' + plural((p.groups || []).length, 'Group', 'Groups') + '</div><div class="v">' + groupsHTML + '</div>' +
        '</dl>' +
        '<p class="subtle-note" style="margin-top:12px">' +
        (p.source === 'data'
          ? 'These details come from your institution’s data connection and are shown as they arrived. They are not edited here.'
          : 'No source is recorded for this account.') + '</p>',
        sampleTag()) +
      '<div style="height:16px"></div>' +
      card('Content access' + (acc.length ? ' <span class="badge b-neutral" style="margin-left:8px">' + acc.length + ' ' + plural(acc.length, 'experiment', 'experiments') + '</span>' : ''), accessBody);

    var rail =
      card('Account',
        '<div class="railkv">' +
        '<div><span class="rk">Status</span><span class="rv">' + accountBadge(p) + '</span></div>' +
        '<div><span class="rk">Source</span><span class="rv">' + sourceCell(p) + '</span></div>' +
        '<div><span class="rk">Last signed in</span><span class="rv">' + (p.lastSignIn ? esc(p.lastSignIn) : '<span style="color:var(--text-3)">Not signed in yet</span>') + '</span></div>' +
        '</div>') +
      '<div style="height:16px"></div>' +
      card('Where this person sits',
        '<div class="railkv">' +
        '<div><span class="rk">Institution</span><span class="rv">' + esc(S.institution.name) + '</span></div>' +
        '<div><span class="rk">Academic stream</span><span class="rv">' + (p.stream ? esc(S.streams[p.stream].name) : '—') + '</span></div>' +
        '<div><span class="rk">' + plural((p.groups || []).length, 'Group', 'Groups') + '</span><span class="rv">' + ((p.groups || []).length ? (p.groups || []).map(function (g) { return esc(S.groups[g].name); }).join('<br>') : '—') + '</span></div>' +
        '</div>');

    var body =
      phead(p.name,
        '<span>' + (p.role === 'faculty' ? 'Faculty' : 'Learner') + '</span><span class="sep" aria-hidden="true">·</span>' +
        '<span class="tabular">' + esc(p.instId) + '</span><span class="sep" aria-hidden="true">·</span><span>' + sampleTag() + '</span>',
        (p.role === 'learner' && pid === 'p_rv'
          ? '<a class="btn sec" href="#/learner/my-learning">' + ic('eye') + 'Open learner access check</a>'
          : ''),
        ' ' + accountBadge(p)) +
      '<div class="grid-rail"><div>' + left + '</div><div class="stack">' + rail + '</div></div>';

    return shell('admin', 'people', crumbs([
      { href: '#/admin/overview', label: 'Overview' },
      { href: '#/admin/people', label: 'People' },
      { label: p.name }
    ]), body);
  }

  /* ============================================================
     INA-04 · ACADEMIC STRUCTURE
     View only. Course creation is Phase 2 (3.4.x) and is absent —
     not disabled, not hinted.
     ============================================================ */
  function viewStructure() {
    var streamIssue = S.erp.issues.filter(function (i) { return i.kind === 'stream' && !i.resolved; })[0];
    var groupIssue = S.erp.issues.filter(function (i) { return i.kind === 'group' && !i.resolved; })[0];

    var alerts = '';
    if (streamIssue || groupIssue) {
      var lines = [];
      if (streamIssue) lines.push('One value seen in your institution’s data — “CIVIL-ENGG-2023” — does not match an academic stream here.');
      if (groupIssue) lines.push('One value seen in your institution’s data does not match a group here.');
      alerts = '<div class="alert warning" style="margin-bottom:18px">' + ic('alertTri') +
        '<div><div class="at">Some incoming values do not match this structure</div>' + esc(lines.join(' ')) +
        ' <a href="#/admin/setup/data/attention">Review the records needing attention</a>.</div></div>';
    }

    function streamRows() {
      return S.streamOrder.map(function (sid) {
        var s = S.streams[sid];
        var n = learnersInStream(sid).length;
        var reach = accessForPopulation('stream', sid).length;
        return '<tr><td><a class="rowlink" href="#/admin/structure/' + sid + '"><span class="tmain">' + esc(s.name) + '</span></a>' +
          '<div class="tsub">Academic stream</div></td>' +
          '<td class="num">' + n + '</td>' +
          '<td>' + (reach ? reach + ' ' + plural(reach, 'access record', 'access records') : '<span style="color:var(--warning-700);font-weight:600">None</span>') + '</td>' +
          '<td><span class="srcchip">' + ic('database') + 'From institution data</span></td>' +
          '<td><a class="btn sm sec" href="#/admin/structure/' + sid + '">Open</a></td></tr>';
      }).join('');
    }
    function groupRows() {
      return S.groupOrder.map(function (gid) {
        var g = S.groups[gid];
        var n = learnersInGroup(gid).length;
        var reach = accessForPopulation('group', gid).length;
        return '<tr><td><a class="rowlink" href="#/admin/structure/' + gid + '"><span class="tmain">' + esc(g.name) + '</span></a>' +
          '<div class="tsub">Group · ' + esc(S.streams[g.stream].name) + '</div></td>' +
          '<td class="num">' + n + '</td>' +
          '<td>' + (reach ? reach + ' ' + plural(reach, 'access record', 'access records') : '<span style="color:var(--text-3)">Through its academic stream</span>') + '</td>' +
          '<td><span class="srcchip">' + ic('database') + 'From institution data</span></td>' +
          '<td><a class="btn sm sec" href="#/admin/structure/' + gid + '">Open</a></td></tr>';
      }).join('');
    }
    function courseRows() {
      return S.courseOrder.map(function (kid) {
        var k = S.courses[kid];
        return '<tr><td><span class="tmain">' + esc(k.name) + '</span><div class="tsub">Course · ' + esc(S.streams[k.stream].name) + '</div></td>' +
          '<td><span class="srcchip">' + ic('database') + 'From institution data</span></td></tr>';
      }).join('');
    }

    var body =
      phead('Academic structure',
        '<span>' + S.streamOrder.length + ' academic streams · ' + S.groupOrder.length + ' groups · ' + S.courseOrder.length + ' courses</span>' +
        '<span class="sep" aria-hidden="true">·</span><span>' + sampleTag() + '</span>') +
      alerts +
      '<div class="stack">' +
      '<div class="tablecard"><div class="listbar"><strong style="font-size:14px">Academic streams</strong>' +
      '<span class="lcount">Content access reaches learners through this structure</span></div>' +
      '<table class="dt"><caption class="sr-only">Academic streams in this institution</caption><thead><tr>' +
      '<th scope="col">Academic stream</th><th scope="col">Learners</th><th scope="col">Content access reaching it</th><th scope="col">Source</th>' +
      '<th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' + streamRows() + '</tbody></table></div>' +

      '<div class="tablecard"><div class="listbar"><strong style="font-size:14px">Groups</strong></div>' +
      '<table class="dt"><caption class="sr-only">Groups in this institution</caption><thead><tr>' +
      '<th scope="col">Group</th><th scope="col">Learners</th><th scope="col">Content access reaching it directly</th><th scope="col">Source</th>' +
      '<th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' + groupRows() + '</tbody></table></div>' +

      '<div class="tablecard"><div class="listbar"><strong style="font-size:14px">Courses</strong>' +
      '<span class="lcount">Shown as they arrive from your institution’s data</span></div>' +
      '<table class="dt"><caption class="sr-only">Courses in this institution</caption><thead><tr>' +
      '<th scope="col">Course</th><th scope="col">Source</th></tr></thead><tbody>' + courseRows() + '</tbody></table></div>' +
      '</div>';

    return shell('admin', 'structure', crumbs([{ href: '#/admin/overview', label: 'Overview' }, { label: 'Academic structure' }]), body);
  }

  /* ============================================================
     INA-05 · STREAM / GROUP DETAIL
     ============================================================ */
  function viewStructureDetail(id) {
    var isStream = !!S.streams[id];
    var obj = isStream ? S.streams[id] : S.groups[id];
    if (!obj) return viewStructure();

    var memberIds = isStream ? peopleInStream(id) : peopleInGroup(id);
    var learnerIds = memberIds.filter(function (p) { return S.people[p].role === 'learner'; });
    var facIds = isStream
      ? memberIds.filter(function (p) { return S.people[p].role === 'faculty'; })
      : (obj.faculty || []);

    var direct = accessForPopulation(isStream ? 'stream' : 'group', id);
    var viaStream = isStream ? [] : accessForPopulation('stream', obj.stream);

    function accList(ids, note) {
      if (!ids.length) return '';
      return '<ul class="covers">' + ids.map(function (aid) {
        var a = S.access[aid];
        return '<li><span class="cv-ic">' + ic('boxes') + '</span><div class="cv-b">' +
          '<div class="cv-t"><a href="#/admin/access/' + aid + '" style="color:inherit;text-decoration:none">' + esc(a.name) + '</a></div>' +
          '<div class="cv-m"><span>Covers ' + a.covers.length + ' ' + plural(a.covers.length, 'experiment', 'experiments') + '</span>' +
          (note ? '<span>· ' + esc(note) + '</span>' : '') + '</div></div></li>';
      }).join('') + '</ul>';
    }

    var accessBody = (direct.length || viaStream.length)
      ? accList(direct, isStream ? 'Reaches this academic stream' : 'Reaches this group directly') +
        (viaStream.length ? (direct.length ? '<div style="height:8px"></div>' : '') + accList(viaStream, 'Reaches this group through ' + S.streams[obj.stream].name) : '')
      : '<div class="alert warning">' + ic('alertTri') + '<div><div class="at">No content access reaches this ' + (isStream ? 'academic stream' : 'group') + '</div>' +
        'Learners here will not see any experiments until a content access record reaches them. ' +
        '<a href="#/admin/mapping">Review access mapping</a>.</div></div>';

    var memberRows = memberIds.length ? memberIds.map(function (pid) {
      var p = S.people[pid];
      return '<tr><td><a class="rowlink" href="#/admin/person/' + pid + '"><span class="tmain">' + esc(p.name) + '</span></a>' +
        '<div class="tsub">' + esc(p.instId) + '</div></td>' +
        '<td>' + (p.role === 'faculty' ? 'Faculty' : 'Learner') + '</td>' +
        '<td>' + accountBadge(p) + '</td></tr>';
    }).join('') : '';

    var left =
      card('Content access reaching this ' + (isStream ? 'academic stream' : 'group'), accessBody) +
      '<div style="height:16px"></div>' +
      '<div class="tablecard"><div class="listbar"><strong style="font-size:14px">Members</strong>' +
      '<span class="lcount">' + learnerIds.length + ' ' + plural(learnerIds.length, 'learner', 'learners') + '</span></div>' +
      (memberRows
        ? '<table class="dt"><caption class="sr-only">Members of ' + esc(obj.name) + '</caption><thead><tr>' +
          '<th scope="col">Name</th><th scope="col">Role</th><th scope="col">Account</th></tr></thead><tbody>' + memberRows + '</tbody></table>'
        : emptyState('users', 'No members yet', 'People appear here once your institution’s data places them in this ' + (isStream ? 'academic stream' : 'group') + '.')) +
      '</div>';

    var rail =
      card('About this ' + (isStream ? 'academic stream' : 'group'),
        '<div class="railkv">' +
        '<div><span class="rk">Type</span><span class="rv">' + (isStream ? 'Academic stream' : 'Group') + '</span></div>' +
        (isStream ? '' : '<div><span class="rk">Academic stream</span><span class="rv"><a href="#/admin/structure/' + obj.stream + '">' + esc(S.streams[obj.stream].name) + '</a></span></div>') +
        '<div><span class="rk">Learners</span><span class="rv tabular">' + learnerIds.length + '</span></div>' +
        '<div><span class="rk">Source</span><span class="rv"><span class="srcchip">' + ic('database') + 'From institution data</span></span></div>' +
        '</div>' +
        '<p class="subtle-note" style="margin-top:12px">Academic structure comes from your institution’s data connection and is shown as it arrived.</p>') +
      '<div style="height:16px"></div>' +
      card('Faculty',
        facIds.length
          ? '<ul class="elig">' + facIds.map(function (f) {
            return '<li><span class="el-ic">' + ic('user') + '</span><div class="el-b">' +
              '<div class="el-t"><a href="#/admin/person/' + f + '">' + esc(S.people[f].name) + '</a></div>' +
              '<div class="el-m">Faculty</div></div></li>';
          }).join('') + '</ul>'
          : '<p class="subtle-note">No faculty recorded for this ' + (isStream ? 'academic stream' : 'group') + '.</p>');

    var body =
      phead(obj.name,
        '<span>' + (isStream ? 'Academic stream' : 'Group · ' + esc(S.streams[obj.stream].name)) + '</span>' +
        '<span class="sep" aria-hidden="true">·</span><span>' + sampleTag() + '</span>') +
      '<div class="grid-rail"><div>' + left + '</div><div class="stack">' + rail + '</div></div>';

    return shell('admin', 'structure', crumbs([
      { href: '#/admin/overview', label: 'Overview' },
      { href: '#/admin/structure', label: 'Academic structure' },
      { label: obj.name }
    ]), body);
  }

  /* ============================================================
     INA-06 · CONTENT ACCESS
     What the institution may use. No price, no seats, no term,
     no purchase route — OQ-01/OQ-02/OQ-03 are open.
     ============================================================ */
  function viewAccess() {
    var q = (S.flags.accessQ || '').toLowerCase();
    var ids = S.accessOrder.filter(function (aid) {
      if (!q) return true;
      var a = S.access[aid];
      var hay = a.name + ' ' + a.covers.map(function (c) { return S.content[c].name; }).join(' ');
      return hay.toLowerCase().indexOf(q) !== -1;
    });

    var rows = ids.map(function (aid) {
      var a = S.access[aid];
      var reach = accessReach(a).length;
      var unmapped = (a.eligibility || []).length === 0;
      return '<tr' + (unmapped ? ' class="row-returned"' : '') + '>' +
        '<td><a class="rowlink" href="#/admin/access/' + aid + '"><span class="tmain">' + esc(a.name) + '</span></a>' +
        '<div class="tsub">' + a.covers.map(function (c) { return esc(S.content[c].name); }).join(' · ') + '</div></td>' +
        '<td class="num">' + a.covers.length + '</td>' +
        '<td>' + accessBadge(a) + '</td>' +
        '<td>' + (unmapped
          ? '<span style="color:var(--warning-700);font-weight:600">No one yet</span>'
          : (a.eligibility || []).map(function (e) { return esc(eligLabel(e)); }).join('<br>') +
            '<div class="tsub tabular">' + reach + ' ' + plural(reach, 'learner', 'learners') + '</div>') + '</td>' +
        '<td class="num">' + esc(a.from) + '</td>' +
        '<td><a class="btn sm sec" href="#/admin/access/' + aid + '">Open</a></td></tr>';
    }).join('');

    var nUn = unmappedAccess().length;
    var banner = nUn
      ? '<div class="alert warning" style="margin-bottom:18px">' + ic('alertTri') +
        '<div><div class="at">' + nUn + ' content ' + plural(nUn, 'access record is', 'access records are') + ' not yet reaching learners</div>' +
        'Your institution has access to this content, but no one can see it until the record reaches an academic stream, a group or a learner.</div></div>'
      : '';

    var table = S.accessOrder.length === 0
      ? emptyState('boxes', 'No content access has been recorded for this institution yet',
        'Content access recorded for this institution appears here, with the experiments it covers.')
      : ids.length
        ? '<table class="dt"><caption class="sr-only">Content access records held by this institution</caption><thead><tr>' +
          '<th scope="col">Content access</th><th scope="col">Experiments</th><th scope="col">Status</th>' +
          '<th scope="col">Reaches</th><th scope="col">Effective from</th><th scope="col"><span class="sr-only">Actions</span></th>' +
          '</tr></thead><tbody>' + rows + '</tbody></table>' +
          '<div class="tfoot"><span>Showing ' + ids.length + ' of ' + S.accessOrder.length + '</span></div>'
        : emptyState('search', 'No content access matches this search', 'Nothing matches “' + (S.flags.accessQ || '') + '”. Try a different experiment or record name.',
          '<a class="btn sm sec" href="#/admin/access">Clear search</a>');

    var body =
      phead('Content access',
        '<span>What ' + esc(S.institution.name) + ' may use</span><span class="sep" aria-hidden="true">·</span><span>' + sampleTag() + '</span>',
        '<a class="btn sec" href="#/admin/mapping">' + ic('link') + 'Access mapping</a>') +
      banner +
      '<div class="tablecard">' +
      (S.accessOrder.length
        ? '<div class="listbar"><div class="searchbox">' + ic('search') +
          '<label class="sr-only" for="access-q">Search content access records and experiments</label>' +
          '<input type="text" id="access-q" placeholder="Search record or experiment" value="' + esc(S.flags.accessQ || '') + '"></div>' +
          '<span class="lcount">' + ids.length + ' shown</span></div>'
        : '') +
      table + '</div>';

    return shell('admin', 'access', crumbs([{ href: '#/admin/overview', label: 'Overview' }, { label: 'Content access' }]), body);
  }
  function bindAccess() {
    var inp = document.getElementById('access-q');
    if (!inp) return;
    inp.addEventListener('input', function () {
      S.flags.accessQ = inp.value; save(); render();
      var again = document.getElementById('access-q');
      if (again) { again.focus(); again.setSelectionRange(again.value.length, again.value.length); }
    });
  }

  /* ============================================================
     INA-07 · CONTENT ACCESS DETAIL
     Answers: what may we use, and who currently receives it?
     The eligibility editor here is DESIGN ASSUMPTION DA-07 —
     reversible; who assigns learner entitlement is OQ-04, OPEN.
     ============================================================ */
  function viewAccessDetail(aid) {
    var a = S.access[aid];
    if (!a) return viewAccess();
    var reach = accessReach(a);
    var unmapped = (a.eligibility || []).length === 0;

    var flow =
      '<div class="reachflow">' +
      '<div class="rf-step done"><div class="rf-k">Content access</div><div class="rf-v">' + esc(a.name) + '</div></div>' +
      '<div class="rf-step ' + (unmapped ? 'pending' : 'done') + '"><div class="rf-k">Reaches</div><div class="rf-v">' +
      (unmapped ? 'No one yet' : (a.eligibility || []).map(function (e) { return esc(eligLabel(e)); }).join(', ')) + '</div></div>' +
      '<div class="rf-step ' + (unmapped ? 'pending' : 'done') + '"><div class="rf-k">Eligible learners</div><div class="rf-v">' +
      (unmapped ? 'None' : reach.length + ' ' + plural(reach.length, 'learner', 'learners')) + '</div></div>' +
      '<div class="rf-step ' + (unmapped ? 'pending' : 'done') + '"><div class="rf-k">In their learning</div><div class="rf-v">' +
      (unmapped ? 'Not visible' : a.covers.length + ' ' + plural(a.covers.length, 'experiment', 'experiments')) + '</div></div>' +
      '</div>';

    var unmappedPanel = unmapped
      ? '<div class="alert warning" style="margin-bottom:16px">' + ic('alertTri') +
        '<div><div class="at">No one in your institution can see this content yet</div>' +
        'This content access is active, but it does not yet reach any academic stream, group or learner.</div></div>'
      : '';

    var eligBody = unmapped
      ? '<p class="subtle-note" style="margin-bottom:12px">Choose who this content access reaches. Everyone it reaches will see the experiments it covers in their learning.</p>' +
        '<button class="btn pri" type="button" id="add-elig">' + ic('plus') + 'Add eligibility</button>'
      : '<ul class="elig">' + (a.eligibility || []).map(function (e) {
        var n = eligReach(e).length;
        return '<li><span class="el-ic">' + ic(e.type === 'person' ? 'user' : e.type === 'group' ? 'users' : 'layers') + '</span>' +
          '<div class="el-b"><div class="el-t"><a href="' + eligHref(e) + '">' + esc(eligLabel(e)) + '</a></div>' +
          '<div class="el-m">' + esc(eligKind(e)) + ' · added ' + esc(e.added) + '</div></div>' +
          '<span class="el-r">' + n + ' ' + plural(n, 'learner', 'learners') + '</span>' +
          '<span class="el-x"><button class="btn sm gho" type="button" data-elig="' + esc(e.id) + '" ' +
          'aria-label="Remove eligibility: ' + esc(eligLabel(e)) + '">Remove</button></span></li>';
      }).join('') + '</ul>' +
      '<div style="margin-top:14px"><button class="btn sec" type="button" id="add-elig">' + ic('plus') + 'Add eligibility</button></div>';

    var left =
      unmappedPanel +
      card('How this reaches learners', flow) +
      '<div style="height:16px"></div>' +
      card('What this covers <span class="badge b-neutral" style="margin-left:8px">' + a.covers.length + ' ' + plural(a.covers.length, 'experiment', 'experiments') + '</span>',
        '<ul class="covers">' + a.covers.map(function (cid) { return contentRow(S.content[cid]); }).join('') + '</ul>' +
        '<p class="subtle-note" style="margin-top:12px">Content is published and maintained by the platform. Your institution uses it as published.</p>') +
      '<div style="height:16px"></div>' +
      card('Who this reaches' + (unmapped ? '' : ' <span class="badge b-neutral" style="margin-left:8px">' + reach.length + ' ' + plural(reach.length, 'learner', 'learners') + '</span>'), eligBody);

    var rail =
      card('Access record',
        '<div class="railkv">' +
        '<div><span class="rk">Status</span><span class="rv">' + accessBadge(a) + '</span></div>' +
        '<div><span class="rk">Effective from</span><span class="rv tabular">' + esc(a.from) + '</span></div>' +
        '<div><span class="rk">Effective to</span><span class="rv tabular">' + (a.to ? esc(a.to) : '<span style="color:var(--text-3)">No end date recorded</span>') + '</span></div>' +
        '<div><span class="rk">Reference</span><span class="rv tabular">' + esc(a.reference) + '</span></div>' +
        '<div><span class="rk">Recorded</span><span class="rv tabular">' + esc(a.recorded) + '</span></div>' +
        '</div>' +
        '<p class="subtle-note" style="margin-top:12px">Quote this reference in any query about this content access.</p>',
        sampleTag()) +
      '<div style="height:16px"></div>' +
      card('Eligible learners',
        reach.length
          ? '<ul class="elig">' + reach.slice(0, 5).map(function (pid) {
            return '<li><span class="el-ic">' + ic('user') + '</span><div class="el-b">' +
              '<div class="el-t"><a href="#/admin/person/' + pid + '">' + esc(S.people[pid].name) + '</a></div>' +
              '<div class="el-m">' + esc(S.people[pid].instId) + '</div></div></li>';
          }).join('') + '</ul>' +
          (reach.length > 5 ? '<p class="subtle-note" style="margin-top:10px">and ' + (reach.length - 5) + ' more.</p>' : '')
          : '<p class="subtle-note">No learners are eligible for this content yet.</p>');

    var body =
      phead(a.name,
        '<span>' + a.covers.length + ' ' + plural(a.covers.length, 'experiment', 'experiments') + '</span>' +
        '<span class="sep" aria-hidden="true">·</span><span>' + sampleTag() + '</span>',
        '', ' ' + accessBadge(a)) +
      '<div class="grid-rail"><div>' + left + '</div><div class="stack">' + rail + '</div></div>';

    return shell('admin', 'access', crumbs([
      { href: '#/admin/overview', label: 'Overview' },
      { href: '#/admin/access', label: 'Content access' },
      { label: a.name }
    ]), body);
  }

  function bindAccessDetail(aid) {
    var a = S.access[aid];
    if (!a) return;
    var add = document.getElementById('add-elig');
    if (add) add.addEventListener('click', function () { openEligDialog(aid); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-elig]'), function (btn) {
      btn.addEventListener('click', function () {
        var eid = btn.getAttribute('data-elig');
        var e = (a.eligibility || []).filter(function (x) { return x.id === eid; })[0];
        if (!e) return;
        var n = eligReach(e).length;
        openDialog({
          title: 'Remove this eligibility?',
          body: '<p><strong>' + esc(eligLabel(e)) + '</strong> (' + esc(eligKind(e).toLowerCase()) + ') will no longer receive the content covered by <strong>' + esc(a.name) + '</strong>.</p>' +
            '<div class="consequence">' + ic('info') + '<div>' + n + ' ' + plural(n, 'learner', 'learners') +
            ' will stop seeing ' + a.covers.length + ' ' + plural(a.covers.length, 'experiment', 'experiments') +
            ' in their learning. You can add this eligibility again at any time.</div></div>',
          confirmLabel: 'Remove eligibility',
          onConfirm: function () {
            a.eligibility = (a.eligibility || []).filter(function (x) { return x.id !== eid; });
            save();
            toast('Eligibility removed — ' + eligLabel(e) + ' no longer receives this content.');
            announce('Eligibility removed. ' + eligLabel(e) + ' no longer receives ' + a.name + '.');
            render();
          }
        });
      });
    });
  }

  /* The eligibility picker. DESIGN ASSUMPTION — REVERSIBLE (DA-07):
     it demonstrates the relationship; it does not assert who owns it. */
  function openEligDialog(aid) {
    var a = S.access[aid];
    var existing = {};
    (a.eligibility || []).forEach(function (e) { existing[e.type + ':' + e.ref] = true; });

    function opts(list, type) {
      return list.filter(function (id) { return !existing[type + ':' + id]; });
    }
    var streamOpts = opts(S.streamOrder, 'stream');
    var groupOpts = opts(S.groupOrder, 'group');
    var personOpts = opts(learners(), 'person');

    var body =
      '<p>Choose who receives the content covered by <strong>' + esc(a.name) + '</strong>.</p>' +
      '<div class="pickgroup" role="radiogroup" aria-label="Who this content access reaches">' +
      '<label class="sel"><input type="radio" name="elig-type" value="stream" checked>' +
      '<span><span class="pk-t">An academic stream</span><span class="pk-d">Everyone in that academic stream becomes eligible.</span></span></label>' +
      '<label><input type="radio" name="elig-type" value="group">' +
      '<span><span class="pk-t">A group</span><span class="pk-d">Everyone in that group becomes eligible.</span></span></label>' +
      '<label><input type="radio" name="elig-type" value="person">' +
      '<span><span class="pk-t">An individual learner</span><span class="pk-d">One named learner becomes eligible.</span></span></label>' +
      '</div>' +
      '<div class="field" style="margin-top:6px"><label for="elig-ref">Select</label>' +
      '<select id="elig-ref">' + streamOpts.map(function (s) { return '<option value="' + s + '">' + esc(S.streams[s].name) + '</option>'; }).join('') + '</select>' +
      '<div class="ferr" id="elig-err" hidden>' + ic('alertCirc', 'sm') + '<span></span></div></div>' +
      '<div class="consequence">' + ic('info') + '<div id="elig-conseq">Everyone this reaches will see the ' +
      a.covers.length + ' ' + plural(a.covers.length, 'experiment', 'experiments') + ' covered by this content access in their learning.</div></div>';

    openDialog({
      title: 'Add eligibility',
      body: body,
      confirmLabel: 'Add eligibility',
      afterOpen: function (root) {
        var sel = root.querySelector('#elig-ref');
        function repopulate(type) {
          var list = type === 'stream'
            ? streamOpts.map(function (s) { return { v: s, t: S.streams[s].name }; })
            : type === 'group'
              ? groupOpts.map(function (g) { return { v: g, t: S.groups[g].name + ' — ' + S.streams[S.groups[g].stream].name }; })
              : personOpts.map(function (p) { return { v: p, t: S.people[p].name + ' — ' + S.people[p].instId }; });
          sel.innerHTML = list.length
            ? list.map(function (o) { return '<option value="' + esc(o.v) + '">' + esc(o.t) + '</option>'; }).join('')
            : '<option value="">Nothing left to add for this option</option>';
        }
        repopulate('stream');
        Array.prototype.forEach.call(root.querySelectorAll('input[name="elig-type"]'), function (r) {
          r.addEventListener('change', function () {
            Array.prototype.forEach.call(root.querySelectorAll('.pickgroup label'), function (l) { l.classList.remove('sel'); });
            r.closest('label').classList.add('sel');
            repopulate(r.value);
          });
        });
      },
      validate: function (root) {
        var sel = root.querySelector('#elig-ref');
        var err = root.querySelector('#elig-err');
        if (!sel.value) {
          err.hidden = false;
          err.querySelector('span').textContent = 'Choose who this content access reaches.';
          sel.closest('.field').classList.add('invalid');
          sel.focus();
          return false;
        }
        return true;
      },
      onConfirm: function (root) {
        var type = root.querySelector('input[name="elig-type"]:checked').value;
        var ref = root.querySelector('#elig-ref').value;
        var e = { id: 'e' + (++S.flags.eligSeq), type: type, ref: ref, added: '25 Aug 2026' };
        a.eligibility = (a.eligibility || []).concat([e]);
        save();
        var n = eligReach(e).length;
        toast('Eligibility added — ' + eligLabel(e) + ' now receives this content.');
        announce('Eligibility added. ' + eligLabel(e) + ' now receives ' + a.name + '. This reaches ' + n + ' ' + plural(n, 'learner', 'learners') + '.');
        render();
      }
    });
  }

  /* ============================================================
     INA-08 · ACCESS MAPPING
     The institution-wide eligibility picture, from both directions.
     ============================================================ */
  function viewMapping() {
    var un = unmappedAccess();

    var byPopulation = S.streamOrder.map(function (sid) {
      var recs = accessForPopulation('stream', sid);
      var n = learnersInStream(sid).length;
      return '<div class="maprow"><div class="mp-l"><div class="mp-t"><a href="#/admin/structure/' + sid + '">' + esc(S.streams[sid].name) + '</a></div>' +
        '<div class="mp-s">Academic stream · ' + n + ' ' + plural(n, 'learner', 'learners') + '</div></div>' +
        '<div class="mp-r">' + (recs.length
          ? recs.map(function (aid) { return '<a class="reachpill" href="#/admin/access/' + aid + '">' + ic('boxes') + esc(S.access[aid].name) + '</a>'; }).join('')
          : '<span class="mp-none">' + ic('alertTri', 'sm') + 'No content access reaches this academic stream</span>') + '</div></div>';
    }).join('') + S.groupOrder.map(function (gid) {
      var recs = accessForPopulation('group', gid);
      var viaStream = accessForPopulation('stream', S.groups[gid].stream);
      var n = learnersInGroup(gid).length;
      return '<div class="maprow"><div class="mp-l"><div class="mp-t"><a href="#/admin/structure/' + gid + '">' + esc(S.groups[gid].name) + '</a></div>' +
        '<div class="mp-s">Group · ' + n + ' ' + plural(n, 'learner', 'learners') + '</div></div>' +
        '<div class="mp-r">' +
        recs.map(function (aid) { return '<a class="reachpill" href="#/admin/access/' + aid + '">' + ic('boxes') + esc(S.access[aid].name) + '</a>'; }).join('') +
        viaStream.map(function (aid) { return '<a class="reachpill" href="#/admin/access/' + aid + '" title="Through this group’s academic stream">' + ic('layers') + esc(S.access[aid].name) + '</a>'; }).join('') +
        (!recs.length && !viaStream.length ? '<span class="mp-none">' + ic('alertTri', 'sm') + 'No content access reaches this group</span>' : '') +
        '</div></div>';
    }).join('');

    var byRecord = S.accessOrder.map(function (aid) {
      var a = S.access[aid];
      var reach = accessReach(a).length;
      return '<div class="maprow"><div class="mp-l"><div class="mp-t"><a href="#/admin/access/' + aid + '">' + esc(a.name) + '</a></div>' +
        '<div class="mp-s">' + a.covers.length + ' ' + plural(a.covers.length, 'experiment', 'experiments') +
        (reach ? ' · ' + reach + ' ' + plural(reach, 'learner', 'learners') : '') + '</div></div>' +
        '<div class="mp-r">' + ((a.eligibility || []).length
          ? (a.eligibility || []).map(function (e) {
            return '<a class="reachpill" href="' + eligHref(e) + '">' + ic(e.type === 'person' ? 'user' : e.type === 'group' ? 'users' : 'layers') + esc(eligLabel(e)) + '</a>';
          }).join('')
          : '<span class="mp-none">' + ic('alertTri', 'sm') + 'Not yet reaching learners</span>') + '</div></div>';
    }).join('');

    var banner = un.length
      ? '<div class="alert warning" style="margin-bottom:18px">' + ic('alertTri') +
        '<div><div class="at">' + un.length + ' content ' + plural(un.length, 'access record does', 'access records do') + ' not reach anyone yet</div>' +
        esc(un.map(function (aid) { return S.access[aid].name; }).join(' · ')) + '.</div></div>'
      : '<div class="alert success" style="margin-bottom:18px">' + ic('check') +
        '<div><div class="at">Every content access record reaches learners</div>' +
        'Each record your institution holds reaches at least one academic stream, group or learner.</div></div>';

    var body =
      phead('Access mapping',
        '<span>Which content access reaches which part of your institution</span>' +
        '<span class="sep" aria-hidden="true">·</span><span>' + sampleTag() + '</span>',
        '<a class="btn sec" href="#/admin/access">' + ic('boxes') + 'Content access</a>') +
      banner +
      '<div class="stack">' +
      card('By content access', '<div class="maplist">' + byRecord + '</div>') +
      card('By part of your institution', '<div class="maplist">' + byPopulation + '</div>') +
      '</div>';

    return shell('admin', 'access', crumbs([
      { href: '#/admin/overview', label: 'Overview' },
      { href: '#/admin/access', label: 'Content access' },
      { label: 'Access mapping' }
    ]), body);
  }

  /* ============================================================
     INA-09 · INSTITUTION SETUP
     ============================================================ */
  function viewSetup() {
    var ssoReady = S.sso.enabled;
    var dataOk = S.erp.connected && openIssues().length === 0;

    var ssoLine = !S.sso.saved ? 'Not set up'
      : S.sso.enabled ? 'Institutional sign-in is on'
      : S.sso.checkState === 'passed' ? 'Connection checked — ready to turn on'
      : S.sso.checkState === 'failed' ? 'The last connection check did not succeed'
      : 'Details saved — connection not checked';

    var dataLine = !S.erp.connected ? 'Not connected'
      : openIssues().length ? 'Last run completed with issues'
      : 'Last run completed';

    var body =
      phead('Institution setup',
        '<span>' + esc(S.institution.name) + '</span><span class="sep" aria-hidden="true">·</span><span>' + sampleTag() + '</span>') +
      setupTabs('setup') +
      '<div class="grid-rail"><div>' +
      card('Institution',
        '<dl class="kv">' +
        '<div class="k">Institution name</div><div class="v">' + esc(S.institution.name) + '</div>' +
        '<div class="k">Institution code</div><div class="v tabular">' + esc(S.institution.code) + '</div>' +
        '<div class="k">Primary administrator</div><div class="v">' + esc(S.institution.admin) + '<div class="tsub">' + esc(S.institution.adminEmail) + '</div></div>' +
        '<div class="k">Status</div><div class="v">' + badge('b-success', 'check', S.institution.status) + '</div>' +
        '</dl>' +
        '<div style="margin-top:16px"><button class="btn sec" type="button" id="edit-inst">' + ic('edit') + 'Edit institution details</button></div>',
        sampleTag()) +
      '<div style="height:16px"></div>' +
      '<div class="setupgrid">' +
      '<div class="setupcard"><h3>' + ic('key') + 'Single sign-on</h3>' +
      '<div class="sc-d">Let people in your institution sign in with their institutional account.</div>' +
      '<div>' + (ssoReady ? badge('b-success', 'check', 'On') : badge('b-warning', 'alertTri', 'Needs setup')) + '</div>' +
      '<div class="sc-d">' + esc(ssoLine) + '</div>' +
      '<div class="sc-foot"><a class="btn ' + (ssoReady ? 'sec' : 'pri') + '" href="#/admin/setup/sso">' + (ssoReady ? 'Open sign-in setup' : 'Set up sign-in') + '</a></div></div>' +

      '<div class="setupcard"><h3>' + ic('database') + 'Institution data</h3>' +
      '<div class="sc-d">Keep people and academic structure up to date from your institution’s own records.</div>' +
      '<div>' + (dataOk ? badge('b-success', 'check', 'Connected') : S.erp.connected ? badge('b-warning', 'alertTri', 'Needs attention') : badge('b-neutral', 'minus', 'Not connected')) + '</div>' +
      '<div class="sc-d">' + esc(dataLine) + ' · ' + esc(S.erp.lastRun.when) + '</div>' +
      '<div class="sc-foot"><a class="btn ' + (dataOk ? 'sec' : 'pri') + '" href="#/admin/setup/data">Open institution data</a></div></div>' +
      '</div>' +
      '</div><div class="stack">' +
      card('What setup covers',
        '<p class="subtle-note">Two things make your institution work on the platform: how your people sign in, and how the platform learns who they are and where they sit.</p>' +
        '<div style="height:12px"></div>' +
        '<div class="railkv">' +
        '<div><span class="rk">Sign-in</span><span class="rv">' + esc(ssoLine) + '</span></div>' +
        '<div><span class="rk">Institution data</span><span class="rv">' + esc(dataLine) + '</span></div>' +
        '<div><span class="rk">People</span><span class="rv tabular">' + S.peopleOrder.length + '</span></div>' +
        '<div><span class="rk">Content access</span><span class="rv tabular">' + S.accessOrder.length + ' ' + plural(S.accessOrder.length, 'record', 'records') + '</span></div>' +
        '</div>') +
      '</div></div>';

    return shell('admin', 'setup', crumbs([{ href: '#/admin/overview', label: 'Overview' }, { label: 'Institution setup' }]), body);
  }
  function bindSetup() {
    var b = document.getElementById('edit-inst');
    if (!b) return;
    b.addEventListener('click', function () {
      openDialog({
        title: 'Edit institution details',
        body: '<div class="field"><label for="i-name">Institution name</label>' +
          '<input type="text" id="i-name" value="' + esc(S.institution.name) + '"></div>' +
          '<div class="field"><label for="i-admin">Primary administrator</label>' +
          '<input type="text" id="i-admin" value="' + esc(S.institution.admin) + '"></div>' +
          '<p class="subtle-note">The institution code is set when your institution is created on the platform and is not edited here.</p>',
        confirmLabel: 'Save details',
        onConfirm: function (root) {
          S.institution.name = root.querySelector('#i-name').value || S.institution.name;
          S.institution.admin = root.querySelector('#i-admin').value || S.institution.admin;
          save(); toast('Institution details saved.'); announce('Institution details saved.'); render();
        }
      });
    });
  }

  /* ============================================================
     INA-10 · SINGLE SIGN-ON
     Configure → check → turn on. No provider, no protocol,
     no attribute mapping, no role mapping (Phase 3).
     ============================================================ */
  function viewSso() {
    var s = S.sso;
    var state = !s.saved ? 'unset' : s.enabled ? 'on' : (s.checkState === 'passed' || s.checkState === 'failed' ? s.checkState : 'unchecked');

    var statusMap = {
      unset: { cls: '', icon: 'key', t: 'Not set up', d: 'People in your institution cannot sign in with their institutional account yet. Add the connection details your identity provider gives you, check the connection, then turn institutional sign-in on.' },
      failed: { cls: 'bad', icon: 'alertTri', t: 'Connection check did not succeed', d: 'The platform could not complete a check with the details saved here. Check the details with your identity provider, save them again, and check the connection once more.' },
      passed: { cls: 'ok', icon: 'check', t: 'Connection checked', d: 'The connection works. Turn institutional sign-in on to make it available to people in your institution.' },
      on: { cls: 'ok', icon: 'check', t: 'Institutional sign-in is on', d: 'People in your institution can sign in with their institutional account.' },
      unchecked: { cls: 'warn', icon: 'clock', t: 'Connection not checked', d: 'Details are saved. Check the connection before turning institutional sign-in on.' }
    };
    var st = statusMap[state] || statusMap.unchecked;

    var actions = '';
    if (state === 'passed') actions = '<button class="btn pri" type="button" id="sso-enable">' + ic('power') + 'Turn on institutional sign-in</button>' +
      '<button class="btn sec" type="button" id="sso-check">Check again</button>';
    else if (state === 'on') actions = '<button class="btn sec" type="button" id="sso-check">Check connection</button>';
    else if (s.saved) actions = '<button class="btn pri" type="button" id="sso-check">' + ic('refresh') + 'Check connection</button>';

    var matching = !s.enabled
      ? '<p class="subtle-note">Once institutional sign-in is on, this shows how many people have signed in with their institutional account, and whether any sign-in could not be matched to a person in this institution.</p>'
      : (s.signIns === 0 && s.unmatched === 0)
        ? '<p class="subtle-note">No sign-ins recorded yet. This updates once people in your institution begin signing in.</p>'
        : '<div class="railkv">' +
          '<div><span class="rk">Signed in</span><span class="rv tabular">' + s.signIns + ' ' + plural(s.signIns, 'person', 'people') + '</span></div>' +
          '<div><span class="rk">Not matched</span><span class="rv">' + (s.unmatched
            ? '<span style="color:var(--warning-700);font-weight:600">' + s.unmatched + ' ' + plural(s.unmatched, 'sign-in', 'sign-ins') + '</span>'
            : 'None') + '</span></div>' +
          '</div>' +
          (s.unmatched ? '<p class="subtle-note" style="margin-top:10px">A sign-in that cannot be matched belongs to someone the platform does not hold a record for in this institution. Their record arrives through the institution data connection.</p>' : '');

    var left =
      '<div class="constat ' + st.cls + '" style="margin-bottom:16px">' +
      '<span class="cs-node">' + ic(st.icon) + '</span>' +
      '<div class="cs-body"><div class="cs-t">' + esc(st.t) + '</div><div class="cs-d">' + esc(st.d) + '</div></div>' +
      (actions ? '<div class="cs-act">' + actions + '</div>' : '') +
      '</div>' +
      card('Connection details',
        '<div class="field"><label for="sso-label">Identity provider name <span class="req" aria-hidden="true">*</span></label>' +
        '<input type="text" id="sso-label" value="' + esc(s.providerLabel) + '" placeholder="A name your team will recognise">' +
        '<div class="hint">Your own name for this connection — it appears here and nowhere else.</div>' +
        '<div class="ferr" id="sso-label-err" hidden>' + ic('alertCirc', 'sm') + '<span></span></div></div>' +
        '<div class="field"><label for="sso-details">Details from your identity provider <span class="req" aria-hidden="true">*</span></label>' +
        '<textarea id="sso-details" placeholder="Paste the details your identity provider gives you">' + esc(s.details) + '</textarea>' +
        '<div class="hint">The exact details required will be confirmed by the platform team.</div>' +
        '<div class="ferr" id="sso-details-err" hidden>' + ic('alertCirc', 'sm') + '<span></span></div></div>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:4px">' +
        '<button class="btn ' + (s.saved ? 'sec' : 'pri') + '" type="button" id="sso-save">Save details</button>' +
        (s.saved ? '' : '<span class="subtle-note" style="align-self:center">Save the details before checking the connection.</span>') +
        '</div>') +
      '<div style="height:16px"></div>' +
      card('People signing in', matching);

    var rail =
      card('Setup steps',
        '<div class="stepper">' +
        ['Add the connection details', 'Check the connection', 'Turn institutional sign-in on'].map(function (label, i) {
          var done = (i === 0 && s.saved) || (i === 1 && s.checkState === 'passed') || (i === 2 && s.enabled);
          var cur = (!s.saved && i === 0) || (s.saved && s.checkState !== 'passed' && i === 1) || (s.checkState === 'passed' && !s.enabled && i === 2);
          var ret = i === 1 && s.checkState === 'failed';
          var cls = done ? 'done' : ret ? 'ret' : cur ? 'cur' : '';
          return '<div class="step ' + cls + '"><span class="snode">' + (done ? ic('check', 'sm') : (i + 1)) + '</span>' +
            '<div class="sbody"><div class="slabel">' + esc(label) + '</div>' +
            '<div class="sstate">' + (done ? 'Done' : ret ? 'Did not succeed' : cur ? 'Next' : 'Not started') + '</div></div></div>';
        }).join('') +
        '</div>') +
      '<div style="height:16px"></div>' +
      card('What this changes',
        '<p class="subtle-note">Turning institutional sign-in on makes it available to people in your institution. Their accounts and academic context still come from the institution data connection.</p>');

    var body =
      phead('Single sign-on',
        '<span>How people in ' + esc(S.institution.name) + ' sign in</span><span class="sep" aria-hidden="true">·</span><span>' + sampleTag() + '</span>') +
      setupTabs('sso') +
      '<div class="grid-rail"><div>' + left + '</div><div class="stack">' + rail + '</div></div>';

    return shell('admin', 'setup', crumbs([
      { href: '#/admin/overview', label: 'Overview' },
      { href: '#/admin/setup', label: 'Institution setup' },
      { label: 'Single sign-on' }
    ]), body);
  }

  function bindSso() {
    var saveBtn = document.getElementById('sso-save');
    if (saveBtn) saveBtn.addEventListener('click', function () {
      var l = document.getElementById('sso-label'), d = document.getElementById('sso-details');
      var ok = true;
      [[l, 'sso-label-err', 'Enter a name for this connection.'], [d, 'sso-details-err', 'Enter the details your identity provider gives you.']].forEach(function (t) {
        var el = t[0], err = document.getElementById(t[1]);
        if (!el.value.trim()) {
          ok = false; err.hidden = false; err.querySelector('span').textContent = t[2];
          el.closest('.field').classList.add('invalid'); el.setAttribute('aria-invalid', 'true');
        } else {
          err.hidden = true; el.closest('.field').classList.remove('invalid'); el.removeAttribute('aria-invalid');
        }
      });
      if (!ok) { (l.value.trim() ? d : l).focus(); announce('Some details are missing. Check the highlighted fields.'); return; }
      S.sso.providerLabel = l.value.trim();
      S.sso.details = d.value.trim();
      S.sso.saved = true;
      S.sso.checkState = 'none';
      save();
      toast('Connection details saved. Check the connection next.');
      announce('Connection details saved. Check the connection next.');
      render();
    });

    var checkBtn = document.getElementById('sso-check');
    if (checkBtn) checkBtn.addEventListener('click', function () {
      checkBtn.classList.add('busy'); checkBtn.setAttribute('aria-busy', 'true'); checkBtn.disabled = true;
      announce('Checking the connection.');
      /* Simulated locally — no request leaves the browser, no identity provider is
         contacted, and no protocol is exercised. The first check does not succeed so
         that both the failed and the successful state are reachable in the demo. */
      setTimeout(function () {
        S.sso.checkAttempts += 1;
        S.sso.checkState = S.sso.checkAttempts === 1 ? 'failed' : 'passed';
        save();
        if (S.sso.checkState === 'passed') { toast('Connection checked — institutional sign-in can be turned on.'); announce('Connection checked. Institutional sign-in can be turned on.'); }
        else { toast('The connection check did not succeed.', 'info'); announce('The connection check did not succeed. Check the details with your identity provider.'); }
        render();
      }, 1100);
    });

    var enableBtn = document.getElementById('sso-enable');
    if (enableBtn) enableBtn.addEventListener('click', function () {
      openDialog({
        title: 'Turn on institutional sign-in?',
        body: '<p>People in <strong>' + esc(S.institution.name) + '</strong> will be able to sign in with their institutional account.</p>' +
          '<div class="consequence">' + ic('info') + '<div>Their accounts and academic context continue to come from the institution data connection. You can review how sign-ins are matching on this page afterwards.</div></div>',
        confirmLabel: 'Turn it on',
        onConfirm: function () {
          S.sso.enabled = true; save();
          toast('Institutional sign-in is on.');
          announce('Institutional sign-in is on for ' + S.institution.name + '.');
          render();
        }
      });
    });
  }

  /* ============================================================
     INA-11 · INSTITUTION DATA
     Connection health, schedule, last run. No endpoint, credential,
     payload, schema or provider is modelled anywhere.

     CONFIRMED here (FRD 7.2.1 acceptance criterion): the Institute Admin
     sets the synchronisation interval and can see the last run, its
     outcome, its counts and its errors.

     "Run now" is NOT confirmed. No source establishes a manual or
     on-demand synchronisation for this role; FRD 7.2.1 describes
     scheduled synchronisation at configurable intervals only. It is kept
     as DESIGN ASSUMPTION DA-15 — REVERSIBLE (see
     ../02_INSTITUTE_ADMIN_UX_MODEL.md §7) and can be removed without
     affecting any other screen.
     ============================================================ */
  function viewData() {
    var e = S.erp;
    var oi = openIssues();
    var nRecords = oi.reduce(function (s, i) { return s + i.count; }, 0);

    var st = e.running
      ? { cls: 'busy', icon: 'refresh', t: 'Run in progress', d: 'Bringing in people and academic structure from your institution’s records.' }
      : !e.connected
        ? { cls: '', icon: 'database', t: 'Not connected', d: 'People and academic structure are not being kept up to date.' }
        : oi.length
          ? { cls: 'warn', icon: 'alertTri', t: 'Last run completed with issues', d: nRecords + ' ' + plural(nRecords, 'record', 'records') + ' could not be applied. Everything else was updated as normal.' }
          : { cls: 'ok', icon: 'check', t: 'Last run completed', d: 'Every record was applied.' };

    var actions = e.running
      ? '<span class="inline-ic subtle-note"><span class="spinner" aria-hidden="true"></span>Running…</span>'
      : '<button class="btn sec" type="button" id="run-now">' + ic('refresh') + 'Run now</button>';

    var left =
      '<div class="constat ' + st.cls + '" style="margin-bottom:16px">' +
      '<span class="cs-node">' + (e.running ? '<span class="spinner" aria-hidden="true"></span>' : ic(st.icon)) + '</span>' +
      '<div class="cs-body"><div class="cs-t">' + esc(st.t) + '</div><div class="cs-d">' + esc(st.d) + '</div></div>' +
      '<div class="cs-act">' + actions + '</div></div>' +

      (oi.length
        ? '<div class="alert warning" style="margin-bottom:16px">' + ic('alertTri') +
          '<div><div class="at">' + nRecords + ' ' + plural(nRecords, 'record needs', 'records need') + ' attention</div>' +
          esc(oi.map(function (i) { return i.title; }).join(' · ')) + '. ' +
          '<a href="#/admin/setup/data/attention">Review the records</a>.</div></div>'
        : '') +

      card('Last run',
        '<div class="railkv" style="margin-bottom:14px">' +
        '<div><span class="rk">When</span><span class="rv tabular">' + esc(e.lastRun.when) + '</span></div>' +
        '<div><span class="rk">How long</span><span class="rv tabular">' + esc(e.lastRun.duration) + '</span></div>' +
        '<div><span class="rk">Outcome</span><span class="rv">' + (e.lastRun.outcome === 'ok'
          ? badge('b-success', 'check', 'Completed')
          : badge('b-warning', 'alertTri', 'Completed with issues')) + '</span></div>' +
        '</div>' +
        '<div class="minilabel">Updated in this run</div>' +
        '<div class="updrow">' +
        '<div><div class="u-v">' + e.lastRun.people + '</div><div class="u-k">' + plural(e.lastRun.people, 'person', 'people') + '</div></div>' +
        '<div><div class="u-v">' + e.lastRun.streams + '</div><div class="u-k">academic ' + plural(e.lastRun.streams, 'stream', 'streams') + '</div></div>' +
        '<div><div class="u-v">' + e.lastRun.groups + '</div><div class="u-k">' + plural(e.lastRun.groups, 'group', 'groups') + '</div></div>' +
        '<div><div class="u-v" style="color:' + (nRecords ? 'var(--warning-700)' : 'var(--text)') + '">' + nRecords + '</div><div class="u-k">' + plural(nRecords, 'record needs', 'records need') + ' attention</div></div>' +
        '</div>', sampleTag()) +
      '<div style="height:16px"></div>' +
      card('Recent runs',
        '<ul class="runlist">' + e.runs.slice(0, 6).map(function (r) {
          return '<li' + (r.outcome === 'issues' ? ' class="issues"' : '') + '>' +
            '<span class="rl-dot" aria-hidden="true"></span>' +
            '<span class="rl-when tabular">' + esc(r.when) + '</span>' +
            '<span class="rl-out">' + esc(r.outcome === 'ok' ? 'Completed' : 'Completed with issues') + '</span>' +
            '<span class="rl-n">' + esc(r.note) + '</span></li>';
        }).join('') + '</ul>');

    var rail =
      card('Connection',
        '<div class="railkv">' +
        '<div><span class="rk">Status</span><span class="rv">' + (e.connected ? badge('b-success', 'check', 'Connected') : badge('b-neutral', 'minus', 'Not connected')) + '</span></div>' +
        '<div><span class="rk">Name</span><span class="rv">' + esc(e.connectionName) + '</span></div>' +
        '</div>' +
        '<p class="subtle-note" style="margin-top:12px">The technical details of this connection are not edited here.</p>',
        sampleTag()) +
      '<div style="height:16px"></div>' +
      card('Schedule',
        '<div class="field" style="margin-bottom:8px"><label for="erp-int">How often your institution’s records are brought in</label>' +
        '<select id="erp-int">' +
        ['6h', '12h', 'day', 'week'].map(function (v) {
          return '<option value="' + v + '"' + (e.interval === v ? ' selected' : '') + '>' + esc(intervalLabel(v)) + '</option>';
        }).join('') + '</select></div>' +
        '<p class="subtle-note">Each run checks incoming records before changing anything. Records that cannot be applied are kept with a reason so they can be retried.</p>');

    var body =
      phead('Institution data',
        '<span>People and academic structure from ' + esc(S.institution.name) + '’s own records</span>' +
        '<span class="sep" aria-hidden="true">·</span><span>' + sampleTag() + '</span>') +
      setupTabs('data') +
      '<div class="grid-rail"><div>' + left + '</div><div class="stack">' + rail + '</div></div>';

    return shell('admin', 'setup', crumbs([
      { href: '#/admin/overview', label: 'Overview' },
      { href: '#/admin/setup', label: 'Institution setup' },
      { label: 'Institution data' }
    ]), body);
  }

  function nextRunStamp() {
    var seq = S.erp.runSeq++;
    var mins = 15 + seq * 13;
    var h = 11 + Math.floor(mins / 60), m = mins % 60;
    return '25 Aug 2026 · ' + (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }
  function applyCorrections() {
    /* Applies the records that previously could not be applied. Only reachable
       once the prototype control below has stood in for the real-world event of
       the institution's own records being corrected at source. */
    var applied = 0;
    S.erp.issues.forEach(function (i) {
      if (i.resolved) return;
      if (i.kind === 'stream') { S.people.p_sb.stream = 's_civil'; S.people.p_sb.account = 'active'; delete S.people.p_sb.note; }
      if (i.kind === 'group') { S.people.p_tv.groups = ['g_thermA']; delete S.people.p_tv.note; }
      i.resolved = true; applied += i.count;
    });
    return applied;
  }
  function bindData() {
    var sel = document.getElementById('erp-int');
    if (sel) sel.addEventListener('change', function () {
      S.erp.interval = sel.value; save();
      toast('Schedule saved — ' + intervalLabel(sel.value).toLowerCase() + '.');
      announce('Schedule saved. Your institution’s records are brought in ' + intervalLabel(sel.value).toLowerCase() + '.');
      render();
    });
    var run = document.getElementById('run-now');
    if (run) run.addEventListener('click', function () {
      S.erp.running = true; save(); render();
      announce('A run has started.');
      setTimeout(function () {
        S.erp.running = false;
        var applied = S.erp.sourceCorrected ? applyCorrections() : 0;
        var remaining = openIssues().reduce(function (s, i) { return s + i.count; }, 0);
        var when = nextRunStamp();
        S.erp.lastRun = {
          when: when, duration: '1 min 52 s', outcome: remaining ? 'issues' : 'ok',
          people: S.peopleOrder.length, streams: S.streamOrder.length, groups: S.groupOrder.length
        };
        S.erp.runs.unshift({ when: when, outcome: remaining ? 'issues' : 'ok', note: remaining ? remaining + ' records need attention' : 'All records applied' });
        save();
        if (applied) { toast('Run completed — ' + applied + ' ' + plural(applied, 'record', 'records') + ' applied.'); announce('Run completed. ' + applied + ' records applied. Nothing needs attention.'); }
        else if (remaining) { toast('Run completed with issues — ' + remaining + ' ' + plural(remaining, 'record needs', 'records need') + ' attention.', 'info'); announce('Run completed with issues. ' + remaining + ' records need attention.'); }
        else { toast('Run completed — every record applied.'); announce('Run completed. Every record applied.'); }
        render();
      }, 1500);
    });
  }

  /* ============================================================
     INA-12 · RECORDS NEEDING ATTENTION
     Each row: what happened, then what to do next. No internal code.

     CONFIRMED (FRD 7.2.1; Institute Admin acceptance criterion): "Given a
     failed ERP synchronisation run, when the Institute Admin views
     synchronisation history, then failed records are retained with a
     reason and a retry is available." Retry is therefore the one sourced
     action here, and the only one offered.
     ============================================================ */
  function viewAttention() {
    var e = S.erp;
    var oi = openIssues();
    var nRecords = oi.reduce(function (s, i) { return s + i.count; }, 0);

    var list = e.issues.map(function (i) {
      var people = (i.people || []).filter(function (p) { return S.people[p]; });
      return '<div class="issue' + (i.resolved ? ' resolved' : '') + '">' +
        '<div class="is-h">' + ic(i.resolved ? 'check' : 'alertTri') +
        '<span class="is-t">' + esc(i.title) + '</span>' +
        '<span class="is-n">' + i.count + ' ' + plural(i.count, 'record', 'records') + (i.resolved ? ' · applied' : '') + '</span></div>' +
        '<div class="is-what">' + esc(i.resolved ? 'These records have been applied. Nothing further is needed.' : i.what) + '</div>' +
        (i.resolved ? '' :
          '<div class="is-next"><span class="nx-k">What to do next</span>' + esc(i.next) + '</div>') +
        (people.length && !i.resolved
          ? '<div class="is-acts"><span class="subtle-note" style="color:var(--n-800)">Affects:</span>' +
            people.map(function (p) { return '<a class="reachpill" href="#/admin/person/' + p + '">' + ic('user') + esc(S.people[p].name) + '</a>'; }).join('') + '</div>'
          : '') +
        (i.resolved ? '' :
          '<div class="is-acts">' +
          '<button class="btn sm pri" type="button" data-retry="' + esc(i.id) + '">Retry these records</button>' +
          '<a class="btn sm sec" href="' + i.link + '">' + esc(i.linkLabel) + '</a></div>') +
        '</div>';
    }).join('');

    var head = oi.length
      ? '<div class="alert warning" style="margin-bottom:18px">' + ic('alertTri') +
        '<div><div class="at">' + nRecords + ' ' + plural(nRecords, 'record from the last run needs', 'records from the last run need') + ' attention</div>' +
        'Everything else was applied as normal. Each record below is kept with the reason it could not be applied, so it can be retried.</div></div>'
      : '<div class="alert success" style="margin-bottom:18px">' + ic('check') +
        '<div><div class="at">Nothing needs attention</div>' +
        'Every record from the last run was applied.</div></div>';

    var control = oi.length
      ? '<div style="margin-top:18px">' + protoNote(
        '<p style="margin-bottom:8px">The platform cannot change your institution’s own records. In the real product these records are corrected at source and then retried. Use this control to stand in for that event so the retry path can be demonstrated.</p>' +
        (S.erp.sourceCorrected
          ? '<p style="color:var(--success-700);font-weight:600">Simulated: the institution’s records have been corrected at source. A retry will now apply them.</p>'
          : '<button class="btn sm sec" type="button" id="sim-fix">Simulate: records corrected at source</button>')) + '</div>'
      : '';

    var body =
      phead('Records needing attention',
        '<span>From the run on ' + esc(e.lastRun.when) + '</span><span class="sep" aria-hidden="true">·</span><span>' + sampleTag() + '</span>',
        '<a class="btn sec" href="#/admin/setup/data">' + ic('database') + 'Institution data</a>') +
      head +
      '<div class="issuelist">' + list + '</div>' +
      control;

    return shell('admin', 'setup', crumbs([
      { href: '#/admin/overview', label: 'Overview' },
      { href: '#/admin/setup', label: 'Institution setup' },
      { href: '#/admin/setup/data', label: 'Institution data' },
      { label: 'Records needing attention' }
    ]), body);
  }

  function bindAttention() {
    var sim = document.getElementById('sim-fix');
    if (sim) sim.addEventListener('click', function () {
      S.erp.sourceCorrected = true; save();
      toast('Simulated — the institution’s records are corrected at source.', 'info');
      announce('Simulated. The institution’s records are corrected at source. Retrying will now apply them.');
      render();
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-retry]'), function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-retry');
        var issue = S.erp.issues.filter(function (i) { return i.id === id; })[0];
        if (!issue || issue.resolved) return;
        btn.classList.add('busy'); btn.disabled = true; btn.setAttribute('aria-busy', 'true');
        announce('Retrying these records.');
        setTimeout(function () {
          if (S.erp.sourceCorrected) {
            if (issue.kind === 'stream') { S.people.p_sb.stream = 's_civil'; S.people.p_sb.account = 'active'; delete S.people.p_sb.note; }
            if (issue.kind === 'group') { S.people.p_tv.groups = ['g_thermA']; delete S.people.p_tv.note; }
            issue.resolved = true;
            var remaining = openIssues().reduce(function (s, i) { return s + i.count; }, 0);
            S.erp.lastRun.outcome = remaining ? 'issues' : 'ok';
            if (!remaining) S.erp.runs.unshift({ when: nextRunStamp(), outcome: 'ok', note: 'All records applied' });
            save();
            toast(issue.count + ' ' + plural(issue.count, 'record', 'records') + ' applied.');
            announce(issue.count + ' records applied. ' + (remaining ? remaining + ' records still need attention.' : 'Nothing else needs attention.'));
          } else {
            issue.retried = true; save();
            toast('These records still need attention.', 'info');
            announce('These records still need attention. ' + issue.next);
          }
          render();
        }, 1000);
      });
    });
  }

  /* ============================================================
     INA-13 · LEARNER ACCESS CHECK
     The handoff, seen from the learner's side. A single read-only
     view — the Learner workspace itself is Batch 01 and the learner
     assessment experience is Batch 02. Neither is duplicated here.
     ============================================================ */
  function viewLearnerCheck() {
    var pid = 'p_rv';
    var p = S.people[pid];
    var acc = personAccess(pid);

    var seen = {};
    var items = acc.filter(function (x) { if (seen[x.contentId]) return false; seen[x.contentId] = true; return true; });

    var body =
      phead('My learning',
        '<span>' + esc(S.institution.name) + '</span><span class="sep" aria-hidden="true">·</span><span>' + sampleTag() + '</span>') +
      (items.length
        ? '<div class="entgrid">' + items.map(function (x) {
          var c = S.content[x.contentId];
          return '<article class="entcard"><div class="ec-t">' + esc(c.name) + '</div>' +
            '<div class="ec-m">' + fmtBadge(c.fmt) + '</div>' +
            '<div class="ec-dev">' + ic(deviceIcon(c.fmt)) + esc(c.device) + '</div>' +
            '<div class="ec-acc">' + ic('check') + 'Included in your institution’s access</div></article>';
        }).join('') + '</div>'
        : '<div class="card"><div class="cbody">' +
          emptyState('book', 'Nothing is available to you yet',
            'Your institution decides which experiments are available to you. Contact your institution administrator if you expect to see something here.') +
          '</div></div>') +
      '<div style="height:20px"></div>' +
      protoNote(
        '<p><strong>Batch-03 verification view.</strong> This page exists to show that institutional content access reaches the right learner. ' +
        'Everything after this point — opening an experiment, getting it onto a supported device, the learning sequence and assessments — is designed in Batch 01 and Batch 02 and is not repeated here.</p>' +
        '<p style="margin-top:6px">Signed in as ' + esc(p.name) + ' · ' + esc(p.instId) +
        (p.stream ? ' · ' + esc(S.streams[p.stream].name) : '') + '. ' +
        'Change what reaches this learner from <a href="#/admin/access">Content access</a> in the Institute Admin workspace.</p>',
        'PROTOTYPE SCOPE — NOT PRODUCT UI');

    return shell('learner', 'my-learning', crumbs([{ label: 'My learning' }]), body);
  }

  /* ============================================================
     PROTOTYPE INDEX (not product UI)
     ============================================================ */
  function viewIndex() {
    var roles = [
      ['#/admin/overview', 'PN', 'Priya Nair', 'Institute Admin — Sample Engineering Institute'],
      ['#/learner/my-learning', 'RV', 'Rahul Verma', 'Learner — access verification view']
    ].map(function (r) {
      return '<a class="rolecard" href="' + r[0] + '"><span class="rc-av" aria-hidden="true">' + r[1] + '</span>' +
        '<span><span class="rc-name">' + esc(r[2]) + '</span><br><span class="rc-sub">' + esc(r[3]) + '</span></span></a>';
    }).join('');

    var paths = [
      { k: 'A', h: 'Institution setup overview', steps: ['Overview — what needs attention right now', 'People — who is in the institution', 'Content access — what the institution may use', 'Institution setup — how sign-in and institution data are doing'], go: [['#/admin/overview', 'Start at the Overview']] },
      { k: 'B', h: 'Content access reaches a learner', steps: ['Content access — Surveying XR is not yet reaching learners', 'Open it — no one can see this content yet', 'Add eligibility — an academic stream', 'Access mapping — the picture from both directions', 'Learner access check — the experiment now appears'], go: [['#/admin/access/a_survey', 'Start at Surveying XR'], ['#/admin/mapping', 'Access mapping']] },
      { k: 'C', h: 'People and academic structure', steps: ['People — filter to learners', 'Rahul Verma — what he can reach, and why', 'His academic stream — who is in it and what reaches it'], go: [['#/admin/people', 'Start at People'], ['#/admin/person/p_sb', 'A record needing attention']] },
      { k: 'D', h: 'Single sign-on', steps: ['Institution setup — sign-in is not set up', 'Add the connection details and save them', 'Check the connection — the first check does not succeed', 'Check again — then turn institutional sign-in on'], go: [['#/admin/setup/sso', 'Start at Single sign-on']] },
      { k: 'E', h: 'Institution data and its exceptions', steps: ['Institution data — the last run completed with issues', 'Records needing attention — what happened, what to do next', 'Simulate the records being corrected at source', 'Retry — the records apply and the people change'], go: [['#/admin/setup/data', 'Start at Institution data'], ['#/admin/setup/data/attention', 'Records needing attention']] }
    ].map(function (p) {
      return '<div class="pathcard"><span class="pk" aria-hidden="true">' + p.k + '</span>' +
        '<h2>Path ' + p.k + ' — ' + esc(p.h) + '</h2>' +
        '<ol>' + p.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' +
        '<div class="pgo">' + p.go.map(function (g, i) {
          return '<a class="btn sm ' + (i === 0 ? 'sec' : 'gho') + '" href="' + g[0] + '">' + esc(g[1]) + '</a>';
        }).join('') + '</div></div>';
    }).join('');

    return protobar('index') +
      '<div class="index-wrap">' +
      '<div class="index-head"><span class="itag">PROTOTYPE INDEX — NOT PRODUCT UI</span>' +
      '<h1>Batch 03 — Institute Admin &amp; institutional access</h1>' +
      '<p>The institution’s side of the platform: who is in it, what content it may use, who is eligible for that content, and whether its sign-in and data setup are healthy — ending with the handoff that makes content appear for an eligible learner. Everything here is <strong>sample design data</strong>. Best reviewed at 1440px.</p>' +
      '<p class="subtle-note" style="margin-top:10px">No backend, no network request, no real single sign-on, no real institution-data integration and no real entitlement service. How an institution comes to hold content access, and who assigns learner entitlement, remain open product questions — this prototype demonstrates the relationship without asserting either.</p></div>' +
      '<div class="index-section"><h2>Workspaces</h2><div class="rolegrid">' + roles + '</div></div>' +
      '<div class="index-section"><h2>Demo paths</h2><div class="pathgrid">' + paths + '</div></div>' +
      '</div>';
  }

  /* ============================================================
     ROUTER
     ============================================================ */
  function route() {
    var h = location.hash || '#/index';
    var q = '';
    var qi = h.indexOf('?');
    if (qi !== -1) { q = h.slice(qi + 1); h = h.slice(0, qi); }
    return { parts: h.replace(/^#\//, '').split('/'), query: q };
  }

  function render() {
    var root = document.getElementById('app-root');
    var r = route(), p = r.parts;
    var html = '', after = null;

    if (r.query) {
      var m = /(?:^|&)role=([a-z]+)/.exec(r.query);
      if (m && ['all', 'learner', 'faculty'].indexOf(m[1]) !== -1 && S.flags.peopleRole !== m[1]) { S.flags.peopleRole = m[1]; save(); }
    }

    if (p[0] === 'admin') {
      if (p[1] === 'overview') html = viewOverview();
      else if (p[1] === 'people') { html = viewPeople(); after = bindPeople; }
      else if (p[1] === 'person' && p[2]) html = viewPerson(p[2]);
      else if (p[1] === 'structure' && p[2]) html = viewStructureDetail(p[2]);
      else if (p[1] === 'structure') html = viewStructure();
      else if (p[1] === 'mapping') html = viewMapping();
      else if (p[1] === 'access' && p[2]) { var aid = p[2]; html = viewAccessDetail(aid); after = function () { bindAccessDetail(aid); }; }
      else if (p[1] === 'access') { html = viewAccess(); after = bindAccess; }
      else if (p[1] === 'setup' && p[2] === 'sso') { html = viewSso(); after = bindSso; }
      else if (p[1] === 'setup' && p[2] === 'data' && p[3] === 'attention') { html = viewAttention(); after = bindAttention; }
      else if (p[1] === 'setup' && p[2] === 'data') { html = viewData(); after = bindData; }
      else if (p[1] === 'setup') { html = viewSetup(); after = bindSetup; }
    } else if (p[0] === 'learner') {
      if (p[1] === 'my-learning') html = viewLearnerCheck();
    }

    if (!html) html = viewIndex();
    root.innerHTML = html;

    var pr = document.getElementById('proto-reset');
    if (pr) pr.addEventListener('click', resetDemo);
    var sk = document.getElementById('skip-link');
    if (sk) sk.addEventListener('click', function (ev) {
      ev.preventDefault(); /* hash routing owns the fragment — focus main directly instead */
      focusMain(false);
    });
    if (after) after();
  }

  /* Focus main transiently (tabindex added only for the focus call, so ordinary
     clicks inside main never focus or scroll it). */
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
    var p = route().parts.join('/');
    render();
    if (p !== lastPath) { window.scrollTo(0, 0); lastPath = p; }
    focusMain(true);
  });

  document.addEventListener('DOMContentLoaded', function () {
    if (!location.hash) location.hash = '#/index';
    lastPath = route().parts.join('/');
    render();
  });
})();
