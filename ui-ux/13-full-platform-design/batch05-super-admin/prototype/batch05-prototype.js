/* ============================================================
   XR Simulation Learning Platform — Batch 05 interactive prototype
   SUPER ADMIN · PLATFORM-WIDE ADMINISTRATION
   CROSS-INSTITUTION OVERSIGHT · MODULE VERSION RELEASE CONTROL
   · DEVICE-REPLACEMENT APPROVAL · LICENCE VISIBILITY
   · PLATFORM CONFIGURATION REGISTER

   Plain JavaScript. No framework, no backend, no API, no database,
   no tenant service, no role service, no identity provider, no
   analytics, no network request of any kind. Every state below is
   local prototype state held in the page.

   ------------------------------------------------------------
   WHAT THIS ROLE MAY DO, AND THE LINE THAT DEFINES IT
   ------------------------------------------------------------
   After the 25 August publication correction (PM-16 / PM-17 / PM-18)
   the Super Admin holds exactly TWO write actions in Phase 1:

       release or hold a module version   FRD 2.3.2 · FLOW 10 step 1
       approve a device replacement       FRD 2.4.2 · FLOW 8 step 3

   ...and ONE bounded read capability:

       cross-institution governance and operational oversight
                                          FRD 1.3.5 · PM-13

   THERE IS NO PUBLICATION ACTION ANYWHERE IN THIS FILE.
   The Content Manager publishes (PM-16 / PM-17). FRD 1.4.4 still
   assigns publication to the Super Admin; that is a RECORDED PM
   DEVIATION, left unreconciled in the sources, and it is not
   implemented here under that name or any other. `QP-26` — whether
   Super Admin may RETURN a submission at the publication gate —
   remains OPEN / PENDING and is likewise not implemented.
   See ../02_SUPER_ADMIN_AUTHORITY_AUDIT.md.

   ------------------------------------------------------------
   THE ONE STRUCTURAL RULE
   ------------------------------------------------------------
   FRD §6.7.4, verbatim: "Given cross-tenant access, when Super Admin
   views an institution, then tenant-scoped data remains presented
   within its institutional context rather than aggregated across
   institutions."

   That is enforced structurally, not by convention. Institutional
   figures exist ONLY inside `viewInstitution()`, one institution at a
   time, under a tinted scope bar. There is no cross-institution total,
   roll-up, comparison, league table or aggregate anywhere in this
   prototype — including on the overview, which counts only PLATFORM
   work items, never tenant data.

   ALL PEOPLE, INSTITUTIONS, IDENTIFIERS, MODULES, VERSIONS AND DATES
   ARE SAMPLE DESIGN DATA. The institutions are fictional. No
   commercial model, licence transaction, seat rule, price, provider,
   XR delivery mechanism or package format is asserted — every one of
   those is open or pending in the source.
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- icons (inline SVG, 24 viewBox — Batch-01 set + Batch-05 additions) ---------------- */
  var PATHS = {
    check: '<polyline points="5 12.5 10 17.5 19 7"/>',
    x: '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><line x1="16" y1="16" x2="21" y2="21"/>',
    refresh: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3L19.5 9"/><polyline points="19.5 4.5 19.5 9 15 9"/>',
    alertTri: '<path d="M12 3.5 22 20H2z"/><line x1="12" y1="10" x2="12" y2="14.5"/><circle cx="12" cy="17.2" r=".4"/>',
    alertCirc: '<circle cx="12" cy="12" r="8.5"/><line x1="12" y1="7.5" x2="12" y2="13"/><circle cx="12" cy="16.2" r=".4"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><line x1="12" y1="11" x2="12" y2="16.5"/><circle cx="12" cy="7.8" r=".4"/>',
    help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.5 9.4a2.6 2.6 0 1 1 3.6 2.4c-.9.4-1.1 1-1.1 1.9"/><circle cx="12" cy="16.6" r=".4"/>',
    home: '<path d="m4 11 8-7 8 7"/><path d="M6 9.5V20h12V9.5"/>',
    user: '<circle cx="12" cy="8.4" r="3.6"/><path d="M4.8 20a7.6 7.6 0 0 1 14.4 0"/>',
    users: '<circle cx="9.4" cy="8.6" r="3.2"/><path d="M3.4 19.6a6.3 6.3 0 0 1 12 0"/><path d="M16 5.7a3.2 3.2 0 0 1 0 5.9"/><path d="M17.4 14.2a6.3 6.3 0 0 1 3.2 5.4"/>',
    /* Institution: a plain building. Deliberately not a "bank" — this platform has
       no commercial surface and the icon should not imply one. */
    building: '<path d="M4.4 20.4V6.2L12 3.4l7.6 2.8v14.2"/><line x1="2.8" y1="20.4" x2="21.2" y2="20.4"/><rect x="8.4" y="9.4" width="3" height="3"/><rect x="12.6" y="9.4" width="3" height="3"/><rect x="8.4" y="14.4" width="3" height="3"/><rect x="12.6" y="14.4" width="3" height="3"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.2 2.4 3.4 5.4 3.4 8.5S14.2 18.1 12 20.5c-2.2-2.4-3.4-5.4-3.4-8.5S9.8 5.9 12 3.5z"/>',
    cube: '<path d="M12 3.2 20 7.4v9.2L12 20.8 4 16.6V7.4z"/><path d="M4 7.4 12 11.6l8-4.2"/><path d="M12 11.6v9.2"/>',
    upload: '<path d="M12 16.5V4.5"/><polyline points="7 9.5 12 4.5 17 9.5"/><path d="M4.5 15v3.5a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5V15"/>',
    /* Release: a package moving outward. Never a "publish" or "send" metaphor. */
    release: '<path d="M3.6 8.2 12 4.2l8.4 4v7.6L12 19.8l-8.4-4z"/><path d="M3.6 8.2 12 12.2l8.4-4"/><path d="M12 12.2v7.6"/><polyline points="9.6 15.4 12 17.8 14.4 15.4"/>',
    pause: '<rect x="7.6" y="5.6" width="3.2" height="12.8" rx="1"/><rect x="13.2" y="5.6" width="3.2" height="12.8" rx="1"/>',
    headset: '<path d="M3.5 11.5a8.5 8.5 0 0 1 17 0"/><rect x="2.5" y="11.5" width="4.5" height="7" rx="1.6"/><rect x="17" y="11.5" width="4.5" height="7" rx="1.6"/>',
    monitor: '<rect x="3" y="4.5" width="18" height="12.5" rx="1.5"/><line x1="9" y1="20.5" x2="15" y2="20.5"/><line x1="12" y1="17" x2="12" y2="20.5"/>',
    phone: '<rect x="6.5" y="2.8" width="11" height="18.4" rx="2"/><line x1="10.6" y1="18.4" x2="13.4" y2="18.4"/>',
    swap: '<polyline points="6.5 4.5 3 8 6.5 11.5"/><path d="M3 8h12.5a4 4 0 0 1 0 8H14"/><polyline points="17.5 19.5 21 16 17.5 12.5"/>',
    key: '<circle cx="8.2" cy="12" r="3.8"/><path d="M12 12h8.5"/><line x1="17.4" y1="12" x2="17.4" y2="15.4"/><line x1="20.5" y1="12" x2="20.5" y2="14.4"/>',
    link: '<path d="M10.4 13.6a3.6 3.6 0 0 0 5.1 0l2.6-2.6a3.6 3.6 0 0 0-5.1-5.1l-1.3 1.3"/><path d="M13.6 10.4a3.6 3.6 0 0 0-5.1 0l-2.6 2.6a3.6 3.6 0 0 0 5.1 5.1l1.3-1.3"/>',
    settings: '<circle cx="12" cy="12" r="3.1"/><path d="M12 3.4v2.4M12 18.2v2.4M3.4 12h2.4M18.2 12h2.4M5.9 5.9l1.7 1.7M16.4 16.4l1.7 1.7M18.1 5.9l-1.7 1.7M7.6 16.4l-1.7 1.7"/>',
    shield: '<path d="M12 3 5 5.8v5.4c0 4.5 3 7.9 7 9.3 4-1.4 7-4.8 7-9.3V5.8z"/>',
    lock: '<rect x="4.8" y="10.4" width="14.4" height="10.2" rx="2"/><path d="M8.2 10.4V7.8a3.8 3.8 0 0 1 7.6 0v2.6"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><polyline points="12 7.5 12 12 15.5 14"/>',
    activity: '<polyline points="3 12.5 7.5 12.5 10 6 14 18.5 16.5 12.5 21 12.5"/>',
    list: '<line x1="8.5" y1="7" x2="20" y2="7"/><line x1="8.5" y1="12" x2="20" y2="12"/><line x1="8.5" y1="17" x2="20" y2="17"/><circle cx="4.6" cy="7" r="1.1"/><circle cx="4.6" cy="12" r="1.1"/><circle cx="4.6" cy="17" r="1.1"/>',
    file: '<path d="M6 3h8l4 4v14H6z"/><polyline points="13.5 3.5 13.5 7.5 17.5 7.5"/>',
    minus: '<line x1="5.5" y1="12" x2="18.5" y2="12"/>',
    chevD: '<polyline points="6.5 9.5 12 15 17.5 9.5"/>',
    arrD: '<line x1="12" y1="4.5" x2="12" y2="18"/><polyline points="7 13 12 18 17 13"/>',
    chevR: '<polyline points="9.5 6.5 15 12 9.5 17.5"/>',
    arrR: '<line x1="4" y1="12" x2="19" y2="12"/><polyline points="13.5 6.5 19 12 13.5 17.5"/>',
    signout: '<path d="M14.5 4.5H6a1.5 1.5 0 0 0-1.5 1.5v12A1.5 1.5 0 0 0 6 19.5h8.5"/><polyline points="15.5 8.5 19.5 12 15.5 15.5"/><line x1="19.5" y1="12" x2="9.5" y2="12"/>'
  };
  function ic(name, cls) {
    return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (PATHS[name] || '') + '</svg>';
  }

  /* ============================================================
     SAMPLE DATA & PROTOTYPE STATE

     Module names, disciplines and formats are carried over from the
     Batch-01, 03 and 04 sample sets unchanged, so the same experiment
     reads as the same experiment across the whole platform design.
     The five institutions are new to Batch 05 and are FICTIONAL.

     What this object graph deliberately does NOT contain, because no
     source establishes it: any price, currency, invoice, seat purchase,
     renewal, subscription, plan, refund, promo, contract, payment
     provider, identity provider by name, XR transport, endpoint,
     package format, audit-log record, module lifecycle state, custom
     role, permission set, tenant-internal person, learner analytic, or
     cross-institution total of any kind.
     ============================================================ */
  var STORAGE_KEY = 'xrslp-batch05-proto-v1';

  /* A fixed sample "today". Real clock time is deliberately not read: the
     prototype must render identically on every run so QA captures are
     comparable and a reviewer never sees a date drift between screens. */
  var TODAY = '27 Aug 2026';

  function initialState() {
    return {
      /* ---- the signed-in Super Admin ----
         Platform-plane identity. There is NO institution chip in the header:
         FRD 1.3.5 places this role above every tenant, and PM-13 confirms it
         is the only role that spans planes. An institution appears in the
         chrome only while one is open (see the scope bar in `shell`). */
      admin: { name: 'Devika Raman', initials: 'DR', role: 'Super Admin' },

      /* ---- institutions (tenants) ----
         FICTIONAL. FRD 1.3.5 is the only requirement granting sight of more
         than one of these to anybody.

         `signIn`, `data` and `access` are the three OBSERVABLE READINESS FACTS
         from which operational state is derived at render time — the platform
         does not store a lifecycle label, because no requirement defines one.
         See stateOf() below and DA-01 in ../03_SUPER_ADMIN_UX_MODEL.md.

         Each fact is owned by the INSTITUTE ADMIN (Batch 03), not by this role:
           signIn  FRD 4.2.2  configured by the Institute Admin  (INA-10)
           data    FRD 7.1.1 / 7.1.2 / 7.2.1                     (INA-11)
           access  FRD 6.2.1 / 6.2.2 — exists; how it is transacted is OPEN */
      institutions: {
        nit: {
          id: 'nit', name: 'Northfield Institute of Technology', short: 'NIT',
          city: 'Pune', registered: '14 Mar 2026', ref: 'INS-2026-0114',
          signIn: { on: true, note: 'Institutional sign-in is configured and in use.' },
          data:   { on: true, lastRun: '27 Aug 2026 · 04:00', outcome: 'ok', received: 2418, failed: 0,
                    note: 'Scheduled synchronisation completed with no failed records.' },
          access: { on: true, streams: 4, note: 'Content access recorded against 4 academic streams.' }
        },
        mce: {
          id: 'mce', name: 'Meridian College of Engineering', short: 'MCE',
          city: 'Coimbatore', registered: '2 Apr 2026', ref: 'INS-2026-0207',
          signIn: { on: true, note: 'Institutional sign-in is configured and in use.' },
          data:   { on: true, lastRun: '27 Aug 2026 · 04:00', outcome: 'failing', received: 1740, failed: 26,
                    note: '26 records were not applied in the last run. The institution retains each failed record with its reason and can retry it.' },
          access: { on: true, streams: 3, note: 'Content access recorded against 3 academic streams.' }
        },
        cp: {
          id: 'cp', name: 'Calder Polytechnic', short: 'CP',
          city: 'Nashik', registered: '19 Aug 2026', ref: 'INS-2026-0388',
          signIn: { on: false, note: 'Institutional sign-in has not been configured yet.' },
          data:   { on: false, lastRun: null, outcome: 'none', received: 0, failed: 0,
                    note: 'No institution data integration has been configured yet.' },
          access: { on: true, streams: 2, note: 'Content access recorded against 2 academic streams.' }
        },
        au: {
          id: 'au', name: 'Ashcroft University', short: 'AU',
          city: 'Hyderabad', registered: '8 Jan 2026', ref: 'INS-2026-0031',
          signIn: { on: true, note: 'Institutional sign-in is configured and in use.' },
          data:   { on: true, lastRun: '27 Aug 2026 · 03:30', outcome: 'ok', received: 5106, failed: 0,
                    note: 'Scheduled synchronisation completed with no failed records.' },
          access: { on: true, streams: 6, note: 'Content access recorded against 6 academic streams.' }
        },
        lst: {
          id: 'lst', name: 'Lakeside School of Technology', short: 'LST',
          city: 'Kochi', registered: '22 Aug 2026', ref: 'INS-2026-0402',
          signIn: { on: true, note: 'Institutional sign-in is configured and in use.' },
          data:   { on: true, lastRun: '26 Aug 2026 · 04:00', outcome: 'ok', received: 640, failed: 0,
                    note: 'Scheduled synchronisation completed with no failed records.' },
          access: { on: false, streams: 0, note: 'No content access record exists against this institution yet.' }
        }
      },
      instOrder: ['au', 'cp', 'lst', 'mce', 'nit'],

      /* ---- modules (already published by the Content Manager) ----
         FRD 3.1.1 — one module is exactly one XR simulation. Formats follow
         FRD 1.2.1–1.2.4. `live` is the version currently in production.

         These modules are PUBLISHED. Publication is the Content Manager's
         (PM-16 / PM-17) and happened before anything on this screen: the
         Super Admin never sees an unpublished module and has no route to one. */
      modules: {
        c_shear:   { id: 'c_shear',   name: 'Soil Mechanics — Direct Shear Test',             disc: 'Civil Engineering',      fmt: 'VR',  live: '1.4.0', published: '11 Aug 2026' },
        c_heat:    { id: 'c_heat',    name: 'Thermodynamics — Heat Exchanger Analysis',       disc: 'Mechanical Engineering', fmt: 'VR',  live: '2.0.1', published: '24 Jul 2026' },
        c_torsion: { id: 'c_torsion', name: 'Strength of Materials — Torsion Test',           disc: 'Mechanical Engineering', fmt: 'MR',  live: '1.1.0', published: '6 Aug 2026' },
        c_circuit: { id: 'c_circuit', name: 'Electrical Machines — Induction Motor Test',     disc: 'Electrical Engineering', fmt: 'Web', live: '3.0.0', published: '2 Jun 2026' },
        c_survey:  { id: 'c_survey',  name: 'Surveying — Total Station Basics',               disc: 'Civil Engineering',      fmt: 'Web', live: '1.2.0', published: '30 Jul 2026' }
      },

      /* ---- module versions awaiting, or having had, a release decision ----
         FRD 2.3.2: "Super Admin shall control when new versions of modules are
         released to production environments." FLOW 10 step 1: "...and may hold
         a release."

         `state` is one of exactly three, because the requirement and its
         acceptance criterion define exactly three and no more:
             'awaiting'  no decision has been taken; the live version stands
             'released'  this version has been released to production
             'held'      a decision was taken NOT to release it, for now

         There is deliberately NO reason, comment or note field on a hold.
         Phase 1 defines no audit trail outside content governance (GP-4), so a
         recorded justification would be a record the requirement set does not
         have. The screen says that plainly instead of inventing the field.

         There is NO module lifecycle state (draft / live / retired): FRD 1.5.1
         is Phase 2. And no delivery mechanism is named anywhere: PM-05
         explicitly declined to select one (QT-01). */
      versions: [
        { id: 'v-shear-150',   mid: 'c_shear',   version: '1.5.0', submitted: '26 Aug 2026',
          summary: 'Adds a second soil specimen and corrects the shear-box friction constant used in the strength-envelope calculation.',
          state: 'awaiting', decidedOn: null },
        { id: 'v-heat-210',    mid: 'c_heat',    version: '2.1.0', submitted: '25 Aug 2026',
          summary: 'Rebuilds the counter-flow exchanger geometry and adds a third flow-rate preset to the parallel-flow run.',
          state: 'awaiting', decidedOn: null },
        { id: 'v-torsion-120', mid: 'c_torsion', version: '1.2.0', submitted: '21 Aug 2026',
          summary: 'Adjusts the torque–angle sampling rate and replaces two specimen materials in the selection panel.',
          state: 'held', decidedOn: '22 Aug 2026' },
        { id: 'v-circuit-301', mid: 'c_circuit', version: '3.0.1', submitted: '14 Aug 2026',
          summary: 'Corrects the blocked-rotor reading tolerance and the equivalent-circuit worksheet labels.',
          state: 'released', decidedOn: '15 Aug 2026' },
        { id: 'v-survey-121',  mid: 'c_survey',  version: '1.2.1', submitted: '8 Aug 2026',
          summary: 'Fixes the traverse-closure rounding in the observation sheet.',
          state: 'released', decidedOn: '9 Aug 2026' }
      ],

      /* ---- device-replacement requests ----
         FRD 2.4.2, B2C ONLY. FRD 2.4.3 explains why: institutional deployments
         use SHARED devices, so no institutional learner has a personal device
         binding to transfer. No institutional request can exist here, and the
         queue says so rather than leaving it to be inferred.

         FLOW 8's framing, verbatim: "This is the platform's only Phase-1
         two-role, cross-plane approval workflow outside content governance."

         `state` is one of exactly two:
             'awaiting'  the learner is waiting on this Super Admin
             'approved'  the licence has rebound to the new device

         There is NO third state. FRD 2.4.2's row records verbatim: "The FRD
         describes no rejection path, no evidence requirement and no limit on
         replacement frequency — all PENDING DECISION." None is invented: the
         screen shows the absent decline route as a marked gap rather than as a
         disabled control, which would imply the route exists.

         Device identifiers are shown partly masked. FRD 2.4.1 requires the
         licence to bind to "a specific encrypted XR device ID"; nothing in the
         source asks an administrator to read one in full. */
      requests: [
        { id: 'dr-01', learner: 'Aditya Rao', initials: 'AR', account: 'aditya.rao@sample-learner.example',
          module: 'Soil Mechanics — Direct Shear Test', fmt: 'VR',
          from: 'XRD-8F2A-••••-41C7', fromLabel: 'VR headset, registered 3 Mar 2026',
          to:   'XRD-D3B9-••••-77E0', toLabel: 'VR headset, presented 26 Aug 2026',
          raised: '26 Aug 2026 · 18:12', state: 'awaiting', decidedOn: null },
        { id: 'dr-02', learner: 'Priya Nair', initials: 'PN', account: 'priya.nair@sample-learner.example',
          module: 'Thermodynamics — Heat Exchanger Analysis', fmt: 'VR',
          from: 'XRD-2C64-••••-9A15', fromLabel: 'VR headset, registered 11 Jan 2026',
          to:   'XRD-A701-••••-5E38', toLabel: 'VR headset, presented 27 Aug 2026',
          raised: '27 Aug 2026 · 09:40', state: 'awaiting', decidedOn: null },
        { id: 'dr-03', learner: 'Rohan Mehta', initials: 'RM', account: 'rohan.mehta@sample-learner.example',
          module: 'Machine Design — Gear Train Assembly', fmt: 'AR',
          from: 'XRD-5B18-••••-C204', fromLabel: 'Mobile device, registered 8 Feb 2026',
          to:   'XRD-9E42-••••-1D6B', toLabel: 'Mobile device, presented 19 Aug 2026',
          raised: '19 Aug 2026 · 14:05', state: 'approved', decidedOn: '20 Aug 2026' }
      ],

      /* ---- platform-plane role holders ----
         READ-ONLY. FRD 8.1.1 confirms the AUTHORITY ("platform configuration
         and platform role assignment", §6.7.2) but `QD-02` — the Phase-1 origin
         of role assignment — is an open HIGH question, so no assign, revoke,
         invite, create or deactivate control exists.

         Only CENTRAL-PLANE roles appear. Institute Admin, Faculty and Learner
         are tenant-internal and are deliberately absent: PM-13 places them on
         the tenant plane, and how a person becomes one in Phase 1 is expressly
         undefined. Their absence is stated on the screen.

         Vendor and Academic Reviewer appear as holders because PM-07 made them
         first-class roles — but who PROVISIONS them is assigned by no source at
         all, which the screen also records. */
      platformRoles: [
        { role: 'Super Admin',       people: ['Devika Raman'],                basis: 'FRD 8.1.1', plane: 'Platform-wide' },
        { role: 'Content Manager',   people: ['M. Kulkarni'],                 basis: 'FRD 8.1.2 · PM-16 · PM-17', plane: 'Central content plane' },
        { role: 'Academic Reviewer', people: ['Dr. R. Iyer'],                 basis: 'FRD 1.4.2 · PM-07', plane: 'Central content plane' },
        { role: 'Vendor',            people: ['Ananya Rao', 'K. Menon'],      basis: 'FRD 1.4.1 · 1.4.5 · PM-07', plane: 'Central content plane' }
      ],

      filters: { instQ: '', instState: 'all', relState: 'awaiting', reqState: 'awaiting' }
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
      /* Arrays are REPLACED wholesale rather than deep-merged: a seed that means
         "nothing is awaiting a decision" must be able to empty them. */
      ['versions', 'requests', 'platformRoles', 'instOrder'].forEach(function (k) {
        if (patch[k]) { S[k] = patch[k]; delete patch[k]; }
      });
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
    toast('Demo reset — the original sample platform state has been restored.', 'info');
    if ((location.hash || '').indexOf('#/overview') !== 0) { location.hash = '#/overview'; }
    else { render(); }
  }

  /* ============================================================
     DERIVED MODEL

     Nothing below is stored. Every count, state and badge in this
     prototype is recomputed on each render from the three sample
     collections above, which is why one release decision updates the
     overview, the releases list and the module row at once without any
     of them being told to.
     ============================================================ */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function plural(n, one, many) { return n === 1 ? one : many; }
  function nfmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  /* ------------------------------------------------------------
     stateOf(institution) — the derived operational state.

     THE PLATFORM STORES NO LIFECYCLE LABEL, because no requirement
     defines one. State is computed, every time, from the three
     readiness facts, each of which has its own requirement and its own
     owning role:

        access   FRD 6.2.1 / 6.2.2   a content access record exists
        signIn   FRD 4.2.2           institutional sign-in is configured
        data     FRD 7.1.1 / 7.2.1   institution data integration runs

     Three outcomes, in priority order:
        'attention'  something configured is FAILING and is visible to
                     the platform (FRD 7.2.1 requires failures to be
                     retained with a reason)
        'setup'      a readiness fact is not yet in place
        'operating'  all three are in place and nothing is failing

     DELIBERATELY ABSENT: any "inactive", "suspended", "expired" or
     "cancelled" state. Each of those would be the RESULT of an
     administrative action, and no source defines a Super Admin action
     that produces one. Deriving states from observable facts keeps the
     read-only surface honest — see DA-01 and D-02 in the UX model.
     ------------------------------------------------------------ */
  function stateOf(inst) {
    if (inst.data.on && inst.data.outcome === 'failing') return 'attention';
    if (!inst.access.on || !inst.signIn.on || !inst.data.on) return 'setup';
    return 'operating';
  }
  var STATE_META = {
    operating: { label: 'Operating',        icon: 'check',    cls: 'operating', blurb: 'Content access, institutional sign-in and institution data are all in place, and nothing is failing.' },
    attention: { label: 'Attention needed', icon: 'alertTri', cls: 'attention', blurb: 'A configured integration reported failures on its last run. The institution can see and retry them.' },
    setup:     { label: 'Setup incomplete', icon: 'minus',    cls: 'setup',     blurb: 'One or more of the three readiness facts is not yet in place.' }
  };
  function istate(inst) {
    var m = STATE_META[stateOf(inst)];
    return '<span class="istate ' + m.cls + '">' + ic(m.icon) + m.label + '</span>';
  }

  function instList() { return S.instOrder.map(function (id) { return S.institutions[id]; }); }
  function inst(id) { return S.institutions[id] || null; }

  function versionsIn(state) { return S.versions.filter(function (v) { return v.state === state; }); }
  function version(id) { for (var i = 0; i < S.versions.length; i++) if (S.versions[i].id === id) return S.versions[i]; return null; }
  function requestsIn(state) { return S.requests.filter(function (r) { return r.state === state; }); }
  function request(id) { for (var i = 0; i < S.requests.length; i++) if (S.requests[i].id === id) return S.requests[i]; return null; }

  /* The two numbers that drive the overview and the nav counts. Both count
     PLATFORM work items awaiting THIS role — never tenant data, and never
     anything aggregated across institutions (FRD §6.7.4 / AC-04). */
  function awaitingReleases() { return versionsIn('awaiting').length; }
  function awaitingRequests() { return requestsIn('awaiting').length; }

  /* ---------------- small presentational helpers (Batch-01 patterns) ---------------- */
  function badge(cls, icon, text) {
    return '<span class="badge ' + cls + '">' + (icon ? ic(icon) : '') + esc(text) + '</span>';
  }
  function fmtChip(f) {
    var k = String(f).toLowerCase();
    return '<span class="fmt fmt-' + k + '">' + esc(f) + '</span>';
  }
  function cite(t) { return '<span class="cite">' + esc(t) + '</span>'; }

  /* Boundary note — the component this batch leans on hardest.
     `owner` marks the tinted variant used when naming the role that DOES own
     the thing on screen, so "someone else owns this" never reads as "this is
     broken". */
  function boundary(title, body, owner) {
    return '<div class="boundary' + (owner ? ' owner' : '') + '">' + ic(owner ? 'users' : 'lock') +
      '<div><span class="bt">' + esc(title) + '</span>' + body + '</div></div>';
  }
  /* Source gap — a Phase-1 requirement exists, its mechanism does not. */
  function gap(title, bodyHTML, tag) {
    return '<div class="gap"><div class="gh">' + ic('help') + '<span class="gt">' + esc(title) + '</span>' +
      (tag ? '<span class="gtag">' + esc(tag) + '</span>' : '') + '</div>' + bodyHTML + '</div>';
  }
  function sampleNote(text) {
    return '<div class="samplenote">' + ic('info', 'sm') + '<span>' + esc(text) + '</span></div>';
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
      '<button class="btn ' + (opts.confirmClass || 'pri') + '" type="button" id="dlg-ok">' + esc(opts.confirmLabel || 'Confirm') + '</button>' +
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
      if (opts.onConfirm) opts.onConfirm(root);
      close();
    });
    var focusable = document.getElementById('dlg-cancel');
    if (focusable) focusable.focus();
  }

  /* ============================================================
     SHELL (SHR-02 — Batch-01 chrome, unchanged)

     THE NAVIGATION IS DERIVED FROM THE SURVIVING CAPABILITIES, not
     copied from another role and not carried over from the pre-override
     model.

     Detailed FRD Table 41 records the pre-override Super Admin
     navigation as "Overview · Publishing · Content · Institutions ·
     Licensing · Platform · Account". Batch 05 departs from it in three
     specific places, each for a stated reason:

       PUBLISHING  struck. PM-16 / PM-17 / PM-18 moved publication to the
                   Content Manager. Nothing replaces it.
       CONTENT     struck. With publication gone, the only content this
                   role still touches is a VERSION AWAITING A RELEASE
                   DECISION — which is what "Releases" is. A second
                   content catalogue would duplicate the Content
                   Manager's Published Content screen (CM-03), which
                   Batch 01 already reassigned from Super Admin.
       RELEASES    added. FRD 2.3.2 has a Phase-1 surface and had no
                   navigation entry of its own, because Table 41 folded
                   it into "Publishing".

     Everything else is Table 41's, unchanged. Six primary items, depth
     two at most — the same shape as the Institute Admin workspace in
     Batch 03, so the two read as one platform.
     ============================================================ */
  var NAV = [
    { href: '#/overview',      key: 'overview',     label: 'Overview',        icon: 'home' },
    { href: '#/institutions',  key: 'institutions', label: 'Institutions',    icon: 'building' },
    { href: '#/releases',      key: 'releases',     label: 'Releases',        icon: 'release',  count: awaitingReleases },
    { href: '#/device-requests', key: 'requests',   label: 'Device requests', icon: 'swap',     count: awaitingRequests },
    { href: '#/licensing',     key: 'licensing',    label: 'Licensing',       icon: 'key' },
    { href: '#/platform',      key: 'platform',     label: 'Platform',        icon: 'settings',
      children: [
        { href: '#/platform/roles',         key: 'roles',  label: 'Platform roles' },
        { href: '#/platform/configuration', key: 'config', label: 'Configuration' }
      ] }
  ];

  function protobar(active) {
    var links = [
      { href: '#/index', label: 'Index', key: 'index' },
      { href: '#/overview', label: 'Overview', key: 'overview' },
      { href: '#/institutions', label: 'Institutions', key: 'institutions' },
      { href: '#/releases', label: 'Releases', key: 'releases' },
      { href: '#/device-requests', label: 'Device requests', key: 'requests' },
      { href: '#/platform/configuration', label: 'Configuration', key: 'config' }
    ];
    return '<div class="protobar" role="navigation" aria-label="Prototype navigation — not product UI">' +
      '<span class="plabel">PROTOTYPE NAVIGATION — NOT PRODUCT UI · BATCH 05</span>' +
      /* A plain div, not a nested <nav>: the wrapper above already carries
         role="navigation" with its label, and a <nav> inside it would announce the
         same links as a second, unlabelled landmark. */
      '<div class="plinks">' + links.map(function (l) {
        return '<a href="' + l.href + '"' + (active === l.key ? ' aria-current="true"' : '') + '>' + esc(l.label) + '</a>';
      }).join('') + '</div>' +
      /* Kept short so the prototype strip never wraps at 1280 — a wrapped strip
         would push under the sticky top bar, whose offset is a fixed token. */
      '<div class="pright"><span class="plabel" style="letter-spacing:.04em">SAMPLE DESIGN DATA</span>' +
      '<button type="button" id="proto-reset">Reset demo</button></div></div>';
  }

  /* `scope` is the structural half of AC-04. Every Super Admin surface passes
     one, and there are only two kinds:
        {plane:true}          the platform — no institutional figure may appear
        {inst:<institution>}  inside exactly one institution
     A surface that is inside an institution gets the tinted bar, so the moment
     of crossing into a tenant is never invisible. */
  function scopebar(scope) {
    if (scope && scope.inst) {
      var i = scope.inst;
      return '<div class="scopebar inst">' +
        '<span class="sc-ic">' + ic('building') + '</span>' +
        '<span><span class="sc-k">Viewing institution</span><br><span class="sc-v">' + esc(i.name) + '</span></span>' +
        '<span class="sc-note">Everything on this page belongs to this institution alone. Nothing here is combined with any other institution.</span>' +
        '</div>';
    }
    return '<div class="scopebar">' +
      '<span class="sc-ic">' + ic('globe') + '</span>' +
      '<span><span class="sc-k">Viewing</span><br><span class="sc-v">The platform</span></span>' +
      '<span class="sc-note">Platform-wide view. Institutional figures are shown on an institution’s own page, never combined here.</span>' +
      '</div>';
  }

  function shell(activeKey, crumbHTML, contentHTML) {
    var A = S.admin;
    var nav = NAV.map(function (n) {
      var cur = n.key === activeKey;
      var kids = '';
      if (n.children) {
        var kidActive = n.children.some(function (c) { return c.key === activeKey; });
        if (cur || kidActive) {
          kids = '<div class="subnav">' + n.children.map(function (c) {
            return '<a class="subitem" href="' + c.href + '"' + (c.key === activeKey ? ' aria-current="page"' : '') + '>' + esc(c.label) + '</a>';
          }).join('') + '</div>';
        }
        cur = cur || kidActive;
      }
      var count = n.count ? n.count() : 0;
      return '<a class="nitem" href="' + n.href + '"' + (n.key === activeKey ? ' aria-current="page"' : (cur ? ' data-parent-current="true"' : '')) + '>' +
        ic(n.icon) + '<span>' + esc(n.label) + '</span>' +
        /* The badge is aria-hidden and the announcement is a separate sr-only span, so
           the accessible name reads "Releases — 2 items awaiting a decision" rather than
           the run-together "Releases2 items…" that a nested count produces. */
        (n.count && count
          ? '<span class="ncount" aria-hidden="true">' + count + '</span>' +
            '<span class="sr-only"> \u2014 ' + count + ' ' + plural(count, 'item', 'items') + ' awaiting a decision</span>'
          : '') +
        '</a>' + kids;
    }).join('');

    return protobar(activeKey) +
      '<div class="app">' +
      '<a class="skip-link" href="#main-content" id="skip-link">Skip to main content</a>' +
      '<header class="topbar">' +
      /* Logo loaded from assets/ — a byte-identical local prototype copy of
         branding/bits-pilani-wilp-logo.png (the source asset is never modified;
         verified with cmp and sha256). A local copy is used because Safari blocks
         parent-directory subresources when the HTML is opened directly from file://.
         If the image still cannot load, the graphic is omitted cleanly and the text
         lockup stands alone — never a broken-image icon. */
      '<div class="brand"><img src="assets/bits-pilani-wilp-logo.png" alt="BITS Pilani WILP" ' +
      'onerror="this.closest(\'.brand\').classList.add(\'no-logo\'); this.remove()">' +
      '<span class="bdiv" aria-hidden="true"></span><span class="pname">XR Simulation Learning Platform</span></div>' +
      '<div class="tspace"></div>' +
      /* NO institution chip. FRD 1.3.5 and PM-13 place this role above every
         tenant; an institution name in the global chrome would imply a current
         tenant this role does not have. The institution appears in the scope
         bar, inside the page, only while one is open. */
      '<div class="acctwrap">' +
      '<button class="account" type="button" id="acct-btn" aria-haspopup="true" aria-expanded="false" aria-controls="acct-menu">' +
      '<span class="av" aria-hidden="true">' + esc(A.initials) + '</span>' +
      '<span class="awho"><span class="aname">' + esc(A.name) + '</span><br><span class="arole">' + esc(A.role) + '</span></span>' +
      ic('chevD', 'sm') + '</button>' +
      '<div class="acctmenu" id="acct-menu" role="menu" aria-label="Account" hidden>' +
      '<a role="menuitem" href="#/platform/roles">' + ic('users', 'sm') + 'Platform roles</a>' +
      '<a role="menuitem" href="#/account" onclick="return false" aria-disabled="true">' + ic('user', 'sm') + 'Profile</a>' +
      '<a role="menuitem" href="#/help" onclick="return false" aria-disabled="true">' + ic('help', 'sm') + 'Help</a>' +
      '<button role="menuitem" type="button" id="acct-signout">' + ic('signout', 'sm') + 'Sign out</button>' +
      '</div></div>' +
      '</header>' +
      '<div class="frame">' +
      '<nav class="snav" aria-label="Super Admin navigation">' +
      '<div class="ws-ctx"><div class="wsk">Super Admin</div><div class="wsv">Platform-wide administration</div></div>' +
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
    /* h2, not h3: an empty state is a region-level message and usually sits
       directly beneath the page h1, so h3 would skip a level. */
    return '<div class="empty"><div class="echip">' + ic(icon, 'lg') + '</div><h2>' + esc(title) + '</h2><p>' + esc(body) + '</p>' + (actionHTML || '') + '</div>';
  }
  function card(titleHTML, bodyHTML, noteHTML) {
    return '<section class="card">' + (titleHTML ? '<div class="chead"><h2>' + titleHTML + '</h2>' + (noteHTML ? '<span class="cnote">' + noteHTML + '</span>' : '') + '</div>' : '') +
      '<div class="cbody">' + bodyHTML + '</div></section>';
  }
  function tablecard(barHTML, tableHTML, footHTML) {
    return '<div class="tablecard">' + (barHTML || '') + tableHTML + (footHTML || '') + '</div>';
  }

  /* A card whose body sets its own padding — used by the row lists (attention
     list, ledger, register) whose rows must run edge to edge. */
  function cardFlush(titleHTML, bodyHTML, noteHTML) {
    return '<section class="card">' + (titleHTML ? '<div class="chead" style="padding-bottom:14px;border-bottom:1px solid var(--border-subtle)"><h2>' + titleHTML + '</h2>' +
      (noteHTML ? '<span class="cnote">' + noteHTML + '</span>' : '') + '</div>' : '') + bodyHTML + '</section>';
  }

  /* ============================================================
     SA-01 · PLATFORM OVERVIEW                        route #/overview

     The one question this screen answers is "what needs a decision from
     me?" — and it answers nothing else.

     FRD 8.1.1 grants "cross-tenant analytics", but PM-11 defers detailed
     metrics to a later phase and FRD §6.7.3 prohibits cross-tenant
     analytics dashboards outright ("8.2.x and 11.3.x are Phase 2").
     Table 41 sets the Phase-1 reporting need as exactly: "Cross-tenant
     operational oversight and content pipeline status. No detailed
     analytics in Phase 1."

     So there are no KPIs, no charts, no trends, no percentages and no
     learner figures on this page. The two numbers that DO appear are
     counts of platform work items awaiting this role — which are
     operational status, not analytics, and are the same two numbers the
     navigation shows.

     The institution list is a ROLL CALL, not a roll-up: each row carries
     its own institution's derived state, and no column combines
     institutions (AC-04 / FRD §6.7.4).
     ============================================================ */
  function viewOverview() {
    var rel = awaitingReleases(), req = awaitingRequests();
    var insts = instList();
    var needing = insts.filter(function (i) { return stateOf(i) !== 'operating'; });

    /* Each row is a single link wrapping a heading, a sentence and a count. Left
       alone, its accessible name concatenates all three into an unusable string, so
       every row carries an explicit aria-label giving the action and the number and
       nothing else. The sentence stays on screen for sighted readers. */
    var attnRows = '';
    if (rel) {
      attnRows += '<a class="attn-row act" href="#/releases" aria-label="' +
        rel + ' module ' + plural(rel, 'version', 'versions') + ' awaiting a release decision">' +
        '<span class="a-ic">' + ic('release') + '</span>' +
        '<span class="a-body"><span class="a-t">Module versions awaiting a release decision</span>' +
        '<span class="a-d">The module is already published. A newer version is ready, and it replaces the live one only when you release the version.</span></span>' +
        '<span class="a-count"><span class="a-n">' + rel + '</span><span class="a-nl">' + plural(rel, 'version', 'versions') + '</span></span>' +
        '<span class="a-go">' + ic('chevR') + '</span></a>';
    }
    if (req) {
      attnRows += '<a class="attn-row act" href="#/device-requests" aria-label="' +
        req + ' device replacement ' + plural(req, 'request', 'requests') + ' awaiting approval">' +
        '<span class="a-ic">' + ic('swap') + '</span>' +
        '<span class="a-body"><span class="a-t">Device replacement requests awaiting approval</span>' +
        '<span class="a-d">An individual learner is waiting to move their access to a different device.</span></span>' +
        '<span class="a-count"><span class="a-n">' + req + '</span><span class="a-nl">' + plural(req, 'request', 'requests') + '</span></span>' +
        '<span class="a-go">' + ic('chevR') + '</span></a>';
    }
    if (needing.length) {
      attnRows += '<a class="attn-row warn" href="#/institutions?state=needing" aria-label="' +
        needing.length + ' ' + plural(needing.length, 'institution', 'institutions') + ' not yet fully operating">' +
        '<span class="a-ic">' + ic('building') + '</span>' +
        '<span class="a-body"><span class="a-t">Institutions not yet fully operating</span>' +
        '<span class="a-d">Setup or an integration needs the institution’s attention. You can see the state; the institution makes the change.</span></span>' +
        '<span class="a-count"><span class="a-n">' + needing.length + '</span><span class="a-nl">' + plural(needing.length, 'institution', 'institutions') + '</span></span>' +
        '<span class="a-go">' + ic('chevR') + '</span></a>';
    }
    if (!attnRows) {
      attnRows = '<div class="attn-clear"><span class="ac-ic">' + ic('check') + '</span>' +
        '<span>Nothing is waiting on you. Every module version has had a release decision, no device replacement is pending, and every institution is operating.</span></div>';
    }

    var instRows = insts.map(function (i) {
      var st = stateOf(i);
      return '<tr>' +
        '<td><a class="rowlink" href="#/institution/' + esc(i.id) + '"><span class="instcell"><span class="ia" aria-hidden="true">' + esc(i.short) + '</span>' +
        '<span><span class="tmain">' + esc(i.name) + '</span><span class="tsub">' + esc(i.city) + ' · registered ' + esc(i.registered) + '</span></span></span></a></td>' +
        '<td>' + istate(i) + '</td>' +
        '<td>' + (i.signIn.on ? badge('b-neutral', 'check', 'Configured') : badge('b-outline', null, 'Not configured')) + '</td>' +
        '<td>' + (!i.data.on ? badge('b-outline', null, 'Not configured')
          : i.data.outcome === 'failing' ? badge('b-warning', 'alertTri', i.data.failed + ' not applied')
          : badge('b-neutral', 'check', 'Last run clean')) + '</td>' +
        '<td><a class="btn sm sec" href="#/institution/' + esc(i.id) + '">Open</a></td>' +
        '</tr>';
    }).join('');

    return shell('overview', null,
      scopebar({ plane: true }) +
      phead('Platform overview',
        'Signed in as ' + esc(S.admin.name) + ' · ' + esc(TODAY)) +

      '<div class="stack">' +

      cardFlush('What needs a decision',
        '<div class="attn">' + attnRows + '</div>', 'Platform work only') +

      card('Institutions',
        '<p style="font-size:13.5px;color:var(--text-2);margin-bottom:14px;line-height:1.6">' +
        'Every institution on the platform, each with its own state. Open one to see it in its own context.</p>' +
        tablecard('',
          '<table class="dt"><caption class="sr-only">Institutions on the platform, with each institution’s own operating state</caption><thead><tr>' +
          '<th scope="col">Institution</th><th scope="col">State</th><th scope="col">Institutional sign-in</th>' +
          '<th scope="col">Institution data</th><th scope="col"><span class="sr-only">Actions</span></th>' +
          '</tr></thead><tbody>' + instRows + '</tbody></table>') +
        '<div style="margin-top:14px">' +
        boundary('These figures belong to each institution, not to the platform',
          '<p>Each row shows one institution’s own state. Nothing on this page combines institutions, and there is no platform total — an institution’s data stays inside that institution. ' + cite('FRD 1.3.4 · 1.3.5 · AC-04') + '</p>') +
        '</div>',
        insts.length + ' ' + plural(insts.length, 'institution', 'institutions')) +

      card('What this overview deliberately does not show',
        '<p style="font-size:13.5px;color:var(--text-2);line-height:1.6;margin-bottom:6px">Phase 1 sets this role’s reporting need as operational oversight and nothing more. These are absences by decision, not gaps in the build:</p>' +
        '<ul class="notlist">' +
        '<li>No cross-institution totals, comparisons or rankings — an institution’s data never leaves its own context. ' + cite('FRD 1.3.4 · AC-04') + '</li>' +
        '<li>No analytics dashboard, metric or trend. ' + cite('PM-11 · FRD §6.7.3 — 8.2.x and 11.3.x are Phase 2') + '</li>' +
        '<li>No learner, faculty or institutional-staff record. Those are the institution’s, and this role has no reason to hold them. ' + cite('PM-13') + '</li>' +
        '<li>No seat, cap or licence-utilisation figure. Whether institutional access is even bounded by a learner or seat cap is an open question, so no figure of that kind is shown or implied. ' + cite('OQ-03 — OPEN · 8.2.2 is Phase 2') + '</li>' +
        '<li>No content publication queue. The Content Manager publishes. ' + cite('PM-16 · PM-17 · PM-18') + '</li>' +
        '</ul>') +

      '</div>'
    );
  }

  /* ============================================================
     SA-02 · INSTITUTIONS                        route #/institutions

     The cross-tenant list — the one screen FRD 1.3.5 most directly
     supports, and the entry point to the institutional context that
     AC-04 requires before any institutional figure may be shown.

     READ-ONLY, deliberately. FRD 1.3.5's words are "view and manage",
     but no source names a single cross-tenant management ACTION, and
     the Review-006 matrix's own note concedes its `M` is "derived from
     1.3.5" rather than from a requirement of its own. Batch 05 therefore
     designs the sight and not the hand, and asks the question instead of
     answering it. See D-02 in ../02_SUPER_ADMIN_AUTHORITY_AUDIT.md.

     There is NO "add institution" control: FRD 4.2.1 reads "Institutions
     shall register their organization through the platform's
     institutional onboarding interface" — the institution registers
     itself, and the requirement assigns the action to no administrator.

     The columns are readiness facts, never institutional volumes. A
     learner count here would put five institutions' figures side by side,
     which is the comparison AC-04 exists to prevent.
     ============================================================ */
  function viewInstitutions(query) {
    var f = S.filters;
    if (query && query.indexOf('state=needing') !== -1 && f.instState === 'all') f.instState = 'needing';

    var all = instList();
    var rows = all.filter(function (i) {
      if (f.instQ) {
        var q = f.instQ.toLowerCase();
        if (i.name.toLowerCase().indexOf(q) === -1 && i.city.toLowerCase().indexOf(q) === -1 && i.ref.toLowerCase().indexOf(q) === -1) return false;
      }
      if (f.instState === 'needing') return stateOf(i) !== 'operating';
      if (f.instState !== 'all') return stateOf(i) === f.instState;
      return true;
    });

    var body = rows.length ? rows.map(function (i) {
      var d = i.data;
      return '<tr>' +
        '<td><a class="rowlink" href="#/institution/' + esc(i.id) + '"><span class="instcell"><span class="ia" aria-hidden="true">' + esc(i.short) + '</span>' +
        '<span><span class="tmain">' + esc(i.name) + '</span><span class="tsub">' + esc(i.ref) + ' · ' + esc(i.city) + '</span></span></span></a></td>' +
        '<td>' + istate(i) + '</td>' +
        '<td>' + (i.access.on ? badge('b-neutral', 'check', 'Recorded') : badge('b-outline', null, 'None yet')) + '</td>' +
        '<td>' + (i.signIn.on ? badge('b-neutral', 'check', 'Configured') : badge('b-outline', null, 'Not configured')) + '</td>' +
        '<td>' + (!d.on ? badge('b-outline', null, 'Not configured')
          : d.outcome === 'failing' ? badge('b-warning', 'alertTri', d.failed + ' not applied')
          : badge('b-neutral', 'check', 'Last run clean')) + '</td>' +
        '<td class="tabular" style="white-space:nowrap">' + esc(i.registered) + '</td>' +
        '<td><a class="btn sm sec" href="#/institution/' + esc(i.id) + '">Open</a></td>' +
        '</tr>';
    }).join('') : '';

    var table = body
      ? '<table class="dt"><caption class="sr-only">Institutions on the platform. Each row shows one institution’s own readiness; no column combines institutions.</caption><thead><tr>' +
        '<th scope="col">Institution</th><th scope="col">State</th><th scope="col">Content access</th>' +
        '<th scope="col">Institutional sign-in</th><th scope="col">Institution data</th><th scope="col">Registered</th>' +
        '<th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' + body + '</tbody></table>'
      : emptyState('search', 'No institution matches',
          'No institution matches what you have typed or the state you have chosen. Clear the search and the filter to see all ' + all.length + '.',
          '<button class="btn sec" type="button" id="inst-clear">Clear search and filter</button>');

    var bar =
      '<div class="listbar">' +
      '<div class="searchbox">' + ic('search') +
      '<label class="sr-only" for="inst-q">Search institutions by name, city or reference</label>' +
      '<input id="inst-q" type="text" placeholder="Search institutions…" value="' + esc(f.instQ) + '"></div>' +
      '<label class="sr-only" for="inst-state">Filter by state</label>' +
      '<select id="inst-state">' +
      [['all', 'All states'], ['needing', 'Not yet operating'], ['operating', 'Operating'], ['attention', 'Attention needed'], ['setup', 'Setup incomplete']].map(function (o) {
        return '<option value="' + o[0] + '"' + (f.instState === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
      }).join('') + '</select>' +
      '<span class="lcount">' + rows.length + ' of ' + all.length + '</span></div>';

    return shell('institutions', crumbs([{ href: '#/overview', label: 'Overview' }, { label: 'Institutions' }]),
      scopebar({ plane: true }) +
      phead('Institutions',
        'Every institution on the platform. Open one to see it in its own context.') +
      '<div class="stack">' +
      tablecard(bar, table) +

      boundary('You can see every institution. You change none of them.',
        '<p>This role exists to watch the platform across institutions — not to run them. Each institution is configured by its own Institute Admin, and every setting shown here is theirs to change. ' + cite('FRD 1.3.5 · PM-13') + '</p>' +
        '<p style="margin-top:9px">Cross-tenant <em>visibility</em> is source-supported. Specific cross-tenant <em>write</em> actions are not: FRD 1.3.5 says “view and manage” and then names no management action anywhere. Which ones are authorised is <strong>D-02</strong>, an open PM clarification, and until it is answered there is no edit, deactivate, suspend, delete, sign-in, institution-data, content-assignment, licence-assignment or user control on any institution surface. ' +
        cite('FRD 1.3.5 · D-02 — OPEN PM CLARIFICATION') + '</p>', true) +

      gap('Who registers an institution, and who activates it, is not settled',
        '<p>The requirement reads “Institutions shall register their organization through the platform’s institutional onboarding interface” — the institution is the one registering, and no administrator is named as doing it for them. There is no <em>add institution</em> action here because no source puts one in this role’s hands.</p>' +
        '<p>How the first Institute Admin comes to exist is likewise stated nowhere. Both are open questions carried into this batch rather than answered by it.</p>',
        'FRD 4.2.1 · QD-02 · OPEN') +

      sampleNote('All five institutions are fictional sample design data, created for this prototype. None represents a real organisation.') +
      '</div>'
    );
  }

  function bindInstitutions() {
    var q = document.getElementById('inst-q');
    if (q) {
      q.addEventListener('input', function () { S.filters.instQ = q.value; save(); repaintInstitutions(true); });
    }
    var st = document.getElementById('inst-state');
    if (st) st.addEventListener('change', function () { S.filters.instState = st.value; save(); repaintInstitutions(false); });
    var cl = document.getElementById('inst-clear');
    if (cl) cl.addEventListener('click', function () {
      S.filters.instQ = ''; S.filters.instState = 'all'; save(); repaintInstitutions(false);
    });
  }
  /* Repaint in place rather than re-rendering the shell, so typing in the search
     box never loses the caret. `keepFocus` restores the caret position after the
     table swap; a filter change moves focus nowhere. */
  function repaintInstitutions(keepFocus) {
    var q = document.getElementById('inst-q');
    var pos = q ? q.selectionStart : null;
    render();
    if (keepFocus) {
      var q2 = document.getElementById('inst-q');
      if (q2) { q2.focus(); try { q2.setSelectionRange(pos, pos); } catch (e) { /* not supported */ } }
    }
  }

  /* ============================================================
     SA-03 · INSTITUTION DETAIL           route #/institution/<id>

     The one place in the whole prototype where this role is inside a
     tenant. FRD §6.7.4, verbatim: "Given cross-tenant access, when Super
     Admin views an institution, then tenant-scoped data remains
     presented within its institutional context rather than aggregated
     across institutions."

     The scope bar turns and tints here, and everything on the page
     belongs to this institution alone.

     READ-ONLY, and visibly so. Every fact carries a PROVENANCE LINE
     naming the role that owns it and the requirement that says so. That
     line is the reason there is no edit control beside it — and it is
     also what keeps this screen from becoming a second, worse copy of
     the Institute Admin workspace built in Batch 03:

        institutional sign-in   Institute Admin  FRD 4.2.2   INA-10
        institution data        Institute Admin  FRD 7.1.x   INA-11
        content access          Institute Admin  FRD 6.2.x   INA-06/07/08
        people, structure       Institute Admin              INA-02/03/04

     What the Institute Admin OPERATES, the Super Admin only OBSERVES.
     ============================================================ */
  function viewInstitution(id) {
    var i = inst(id);
    if (!i) return shell('institutions', crumbs([{ href: '#/institutions', label: 'Institutions' }, { label: 'Not found' }]),
      phead('Institution not found') +
      emptyState('search', 'No such institution',
        'That institution reference does not match any institution in this prototype.',
        '<a class="btn sec" href="#/institutions">Back to institutions</a>'));

    var st = stateOf(i), meta = STATE_META[st];

    /* The readiness ledger. Three rows, always all three, in the same order —
       a fact that is missing is shown as missing rather than omitted, because
       "not configured" is the state a reviewer most needs to see. */
    function led(cls, icon, title, state, detail, provenance, ref) {
      return '<div class="led ' + cls + '"><span class="l-ic">' + ic(icon) + '</span>' +
        '<div class="l-body"><div class="l-t">' + esc(title) + '<span class="l-s">' + esc(state) + '</span></div>' +
        '<div class="l-d">' + esc(detail) + '</div>' +
        '<div class="l-p">' + ic('users', 'sm') + '<span>' + provenance + '</span>' + cite(ref) + '</div></div></div>';
    }
    /* Provenance strings are written out rather than templated from a role name,
       because the three facts do not have the same kind of owner. Sign-in and
       institution data are configured by a person in a known role. A content
       access record is NOT: FRD 6.2.1's transaction mechanism is open, so only
       the stream mapping has a named owner. Saying "configured by" for all three
       would assert an origin the requirements have not settled. */
    var OWN_IA = 'Configured by this institution’s <span class="owner">Institute Admin</span>';
    var OWN_ACCESS = 'Streams mapped by the <span class="owner">Institute Admin</span> · how the record itself comes to exist is open';

    var accessRow = i.access.on
      ? led('ok', 'check', 'Content access', 'Recorded', i.access.note, OWN_ACCESS, 'FRD 6.2.1 · QP-04 · OQ-03 — OPEN')
      : led('todo', 'minus', 'Content access', 'None yet', i.access.note + ' Until one exists, no learner here can reach content.', OWN_ACCESS, 'FRD 6.2.1 · QP-04 · OQ-03 — OPEN');

    var signRow = i.signIn.on
      ? led('ok', 'check', 'Institutional sign-in', 'Configured', i.signIn.note, OWN_IA, 'FRD 4.2.2 · PM-10')
      : led('todo', 'minus', 'Institutional sign-in', 'Not configured', i.signIn.note + ' Learners here cannot sign in through the institution yet.', OWN_IA, 'FRD 4.2.2 · PM-10');

    var dataRow = !i.data.on
      ? led('todo', 'minus', 'Institution data', 'Not configured', i.data.note, OWN_IA, 'FRD 7.1.1 · 7.2.1')
      : i.data.outcome === 'failing'
        ? led('warn', 'alertTri', 'Institution data', i.data.failed + ' not applied',
            'Last run ' + i.data.lastRun + '. ' + i.data.note, OWN_IA, 'FRD 7.2.1')
        : led('ok', 'check', 'Institution data', 'Last run clean',
            'Last run ' + i.data.lastRun + ' — ' + nfmt(i.data.received) + ' records received, none failed.', OWN_IA, 'FRD 7.1.2 · 7.2.1');

    var attentionAlert = st === 'attention'
      ? '<div class="alert warning">' + ic('alertTri') +
        '<div><div class="at">This institution’s last data run left ' + i.data.failed + ' records unapplied</div>' +
        'The institution keeps every failed record with its reason and can retry it from its own workspace. There is nothing for you to do here — this is visible to you as operational status, not as a task. ' +
        cite('FRD 7.2.1 · PM-11') + '</div></div>'
      : st === 'setup'
        ? '<div class="alert info">' + ic('info') +
          '<div><div class="at">This institution is not finished setting up</div>' +
          'One or more of the three readiness facts below is not yet in place. Each is the institution’s own to complete. ' + cite('FRD 4.2.2 · 6.2.1 · 7.1.1') + '</div></div>'
        : '';

    return shell('institutions',
      crumbs([{ href: '#/overview', label: 'Overview' }, { href: '#/institutions', label: 'Institutions' }, { label: i.name }]),
      scopebar({ inst: i }) +
      phead(i.name, esc(i.ref) + ' · ' + esc(i.city) + ' · registered ' + esc(i.registered), null, ' ' + istate(i)) +
      (attentionAlert ? '<div style="margin-bottom:18px">' + attentionAlert + '</div>' : '') +

      '<div class="grid-rail">' +

      '<div class="stack">' +

      cardFlush('Readiness',
        '<div style="padding:16px 20px 18px"><p style="font-size:13.5px;color:var(--text-2);line-height:1.6;margin-bottom:4px">' +
        'This institution is <strong>' + esc(meta.label.toLowerCase()) + '</strong>. ' + esc(meta.blurb) + '</p>' +
        '<div class="ledger" style="margin-top:12px">' + accessRow + signRow + dataRow + '</div></div>',
        'Derived, not stored') +

      card('What this institution is running',
        '<div class="kv">' +
        '<div class="k">Academic streams with access</div><div class="v">' + (i.access.on ? esc(i.access.streams) + ' ' + plural(i.access.streams, 'stream', 'streams') : 'None recorded yet') + '</div>' +
        '<div class="k">Records in the last data run</div><div class="v tabular">' + (i.data.on ? nfmt(i.data.received) + (i.data.failed ? ' · ' + i.data.failed + ' not applied' : '') : '—') + '</div>' +
        '<div class="k">Last data run</div><div class="v">' + (i.data.lastRun ? esc(i.data.lastRun) : '—') + '</div>' +
        '</div>' +
        '<div style="margin-top:16px">' +
        boundary('Why there is no edit control on this page',
          '<p>Everything above is configured inside the institution by its own Institute Admin, in their workspace. This role can see that the institution is set up and working; it does not set it up. ' +
          cite('FRD 1.3.5 · PM-13') + '</p>', true) +
        '</div>' +
        sampleNote('Stream counts and record counts are sample design data for this fictional institution.')) +

      gap('What “manage across tenants” lets you do is not yet defined',
        '<p>The requirement grants this role “controlled access to <strong>view and manage</strong> data across tenants strictly for governance and operational oversight” — but no requirement anywhere names a single cross-institution management <em>action</em>.</p>' +
        '<p>Rather than invent one, this page is read-only. If a governance action is later defined — suspending an institution, or anything else — it belongs on this page and the layout leaves room for it.</p>',
        'FRD 1.3.5 · OPEN') +

      '</div>' +

      '<div class="stack">' +

      card('This institution runs its own workspace',
        '<p style="font-size:13.5px;color:var(--text-2);line-height:1.65">The Institute Admin here manages everything inside the institution. None of it is reachable from this role, and none of it is duplicated here:</p>' +
        '<ul class="notlist" style="margin-top:10px">' +
        '<li>Its people, and who they are</li>' +
        '<li>Its academic structure, streams and groups</li>' +
        '<li>Which content each stream reaches</li>' +
        '<li>Its institutional sign-in settings</li>' +
        '<li>Its institution-data connection and schedule</li>' +
        '<li>Whatever reporting it has on its own use of that content</li>' +
        '</ul>' +
        '<p style="font-size:12.5px;color:var(--text-3);margin-top:12px;line-height:1.6">' +
        'Institutional reporting stays inside the institution that produced it. Whether that reporting includes a learner or seat cap is itself an open question and is not asserted here. ' + cite('FRD 1.3.4 · 8.1.3 · OQ-03 — OPEN') + '</p>') +

      card('No record is kept of what you looked at',
        '<p style="font-size:13.5px;color:var(--text-2);line-height:1.65">Phase 1 requires review history for the content governance chain and nothing else. No requirement defines an audit trail for governance access, licensing, configuration or device approvals — so this prototype does not show one, and does not pretend one exists.</p>' +
        '<p style="font-size:12.5px;color:var(--text-3);margin-top:10px">' + cite('PM-14 · GP-4 · FRD §6.7.5 — OPEN') + '</p>') +

      '</div>' +
      '</div>'
    );
  }

  /* ============================================================
     SA-04 · MODULE RELEASES                        route #/releases
     SA-05 · RELEASE DECISION                  route #/release/<id>

     ------------------------------------------------------------
     READ THIS BEFORE CHANGING ANYTHING ON THESE TWO SCREENS
     ------------------------------------------------------------
     THIS IS NOT PUBLICATION. It is version release, and the two are
     different requirements with different owners:

        PUBLICATION      FRD 1.4.4, FLOW 1 — a module reaches learners
                         for the first time. Owned by the CONTENT
                         MANAGER (PM-16 / PM-17). Not here. Not ever.

        VERSION RELEASE  FRD 2.3.2, FLOW 10 — a NEW VERSION of a module
                         that the Content Manager ALREADY PUBLISHED
                         reaches production environments. Owned by the
                         Super Admin.

     Every module on these screens is already published and already
     reaching learners. The decision here is only whether the newer
     version replaces the one they are running.

     THE VOCABULARY IS FIREWALLED. These screens say release, hold, held,
     released and version. They never say publish, publishing, published,
     ready to publish, approve, return or request changes for this role.
     That is not decoration — it is what stops the overridden FRD 1.4.4
     being reintroduced by wording.

     THE TWO CONTROLS ARE NAMED FOR WHAT THEY ACT ON — the VERSION:

        RELEASE VERSION    not "release to production", not "publish"
        HOLD VERSION       not "hold release", not "hold publication"

     "Production" survives only where it explains the CONSEQUENCE, in
     FRD 2.3.2's own words ("released to production environments"). It is
     never the name of the action, because an action named for a
     destination reads as a second shipping gate — and the shipping gate
     is publication, which already happened and is the Content Manager's.

     BOTH SCREENS SAY, IN PRODUCT LANGUAGE, THAT PUBLICATION HAS ALREADY
     OCCURRED. SA-04 says it in the lead alert; SA-05 says it in the
     boundary note, with the module's own publication date. Neither
     screen is a second publication gate and neither may become one.

     D-01 IS AN OPEN PM CLARIFICATION, NOT A SETTLED READING:
        "After Content Manager publishes content, does Super Admin still
         retain the separate Phase-1 version release/hold authority from
         FRD 2.3.2?"
     The capability is kept ISOLATED and REVERSIBLE for exactly that
     reason: nothing else in Batch 05 reads or writes release state, so
     SA-04 and SA-05 withdraw as a pair, leaving no orphaned surface.

     TWO OUTCOMES, BOTH FIRST-CLASS. FLOW 10 step 1 reads "Controls when
     a new module version is released to the production environment, AND
     MAY HOLD A RELEASE", and the 2.3.2 acceptance criterion makes it
     explicit: "holding a release is an available and visible outcome".
     Hold is therefore a real control with its own state — never a
     disabled button and never merely the absence of pressing Release.

     WHAT IS DELIBERATELY ABSENT
       · no reason or comment field on a hold — Phase 1 defines no audit
         trail outside content governance (GP-4), so a recorded
         justification would be a record the requirement set has not got
       · no module lifecycle state (draft / live / retired) — FRD 1.5.1
         is Phase 2
       · no learner notification — no Phase-1 requirement defines one,
         and FLOW 10's recorded gap says so in as many words
       · no delivery mechanism, transport, endpoint or package format —
         PM-05 explicitly declined to select one (QT-01)
       · no unrelease, rollback or withdraw — no source defines any
     ============================================================ */
  var REL_STATES = {
    awaiting: { label: 'Awaiting decision', badge: 'b-info',    icon: 'clock' },
    released: { label: 'Released',          badge: 'b-success', icon: 'check' },
    held:     { label: 'Held',              badge: 'b-warning', icon: 'pause' }
  };
  function relBadge(v) {
    var m = REL_STATES[v.state];
    return badge(m.badge, m.icon, m.label);
  }

  function viewReleases() {
    var f = S.filters;
    var counts = { awaiting: versionsIn('awaiting').length, held: versionsIn('held').length, released: versionsIn('released').length, all: S.versions.length };
    var rows = f.relState === 'all' ? S.versions.slice() : versionsIn(f.relState);

    var body = rows.map(function (v) {
      var m = S.modules[v.mid];
      return '<tr>' +
        '<td><a class="rowlink" href="#/release/' + esc(v.id) + '"><span class="tmain">' + esc(m.name) + '</span>' +
        '<span class="tsub">' + esc(m.disc) + '</span></a></td>' +
        '<td>' + fmtChip(m.fmt) + '</td>' +
        '<td class="tabular"><span class="vchip">' + esc(m.live) + '</span></td>' +
        '<td class="tabular"><span class="vchip">' + esc(v.version) + '</span></td>' +
        '<td>' + relBadge(v) + (v.decidedOn ? '<div class="tsub">' + esc(v.decidedOn) + '</div>' : '') + '</td>' +
        '<td class="tabular" style="white-space:nowrap">' + esc(v.submitted) + '</td>' +
        '<td><a class="btn sm ' + (v.state === 'awaiting' ? 'pri' : 'sec') + '" href="#/release/' + esc(v.id) + '">' +
        (v.state === 'awaiting' ? 'Decide' : 'Open') + '</a></td>' +
        '</tr>';
    }).join('');

    var table = body
      ? '<table class="dt"><caption class="sr-only">Module versions and their release state</caption><thead><tr>' +
        '<th scope="col">Module</th><th scope="col">Format</th><th scope="col">In production</th><th scope="col">New version</th>' +
        '<th scope="col">Release state</th><th scope="col">Ready since</th><th scope="col"><span class="sr-only">Actions</span></th>' +
        '</tr></thead><tbody>' + body + '</tbody></table>'
      : emptyState('check',
          f.relState === 'awaiting' ? 'Nothing is awaiting a release decision' : 'Nothing here',
          f.relState === 'awaiting'
            ? 'Every new module version has had a decision. Learners are running the versions currently in production.'
            : 'No module version is in this state.',
          '<a class="btn sec" href="#/releases?state=all">Show every version</a>');

    var bar =
      '<div class="listbar">' +
      '<label class="sr-only" for="rel-state">Filter by release state</label>' +
      '<select id="rel-state">' +
      [['awaiting', 'Awaiting decision (' + counts.awaiting + ')'], ['held', 'Held (' + counts.held + ')'],
       ['released', 'Released (' + counts.released + ')'], ['all', 'All versions (' + counts.all + ')']].map(function (o) {
        return '<option value="' + o[0] + '"' + (f.relState === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
      }).join('') + '</select>' +
      '<span class="lcount">' + rows.length + ' ' + plural(rows.length, 'version', 'versions') + '</span></div>';

    return shell('releases', crumbs([{ href: '#/overview', label: 'Overview' }, { label: 'Releases' }]),
      scopebar({ plane: true }) +
      phead('Module releases',
        'Version release control only. Publication has already happened, and it is the Content Manager’s.') +
      '<div class="stack">' +

      '<div class="alert info">' + ic('info') +
      '<div><div class="at">Content publication has already occurred — this screen is version release control only</div>' +
      'Every module listed here was published by the Content Manager before it reached this screen, and this screen is not a second look at that decision. Nothing here publishes, re-publishes, withdraws or gates publication. What you decide is only whether a <strong>newer version</strong> replaces the version learners are currently running. ' +
      cite('FRD 2.3.2 · publication: PM-16 · PM-17 · D-01 — OPEN PM CLARIFICATION') + '</div></div>' +

      tablecard(bar, table) +

      gap('Learners are not told when a version changes underneath them',
        '<p>A device downloads an updated version automatically once it is released, and a learner may see an <em>update available</em> state if they happen to be looking. Phase 1 has no notification requirement anywhere, so the platform cannot tell a learner who is not looking.</p>' +
        '<p>The consequence is recorded rather than designed around: nothing on this screen promises a learner will be informed.</p>',
        'FRD 2.3.1 · 1.5.1 is Phase 2 · OPEN') +

      sampleNote('Module names, versions and dates are sample design data. No delivery mechanism, package format or environment is named anywhere in this prototype.') +
      '</div>'
    );
  }
  function bindReleases() {
    var st = document.getElementById('rel-state');
    if (st) st.addEventListener('change', function () { S.filters.relState = st.value; save(); render(); });
  }

  function viewRelease(id) {
    var v = version(id);
    if (!v) return shell('releases', crumbs([{ href: '#/releases', label: 'Releases' }, { label: 'Not found' }]),
      phead('Module version not found') +
      emptyState('search', 'No such version',
        'That version reference does not match any module version in this prototype.',
        '<a class="btn sec" href="#/releases">Back to releases</a>'));
    var m = S.modules[v.mid];
    var deciding = v.state === 'awaiting';

    var decisionPanel;
    if (deciding) {
      decisionPanel =
        '<div class="decide">' +
        '<div class="d-lead">Releasing this version puts <strong>' + esc(v.version) + '</strong> in place of ' + esc(m.live) + ' for the learners already entitled to this module. ' +
        'Holding leaves ' + esc(m.live) + ' in place and keeps this version available to release later. Neither outcome publishes anything.</div>' +
        '<button class="btn sec" type="button" id="rel-hold">' + ic('pause') + 'Hold version</button>' +
        '<button class="btn pri" type="button" id="rel-go">' + ic('release') + 'Release version</button>' +
        '</div>';
    } else if (v.state === 'held') {
      decisionPanel =
        '<div class="decide">' +
        '<div class="d-lead">This version is <strong>held</strong>. ' + esc(m.live) + ' is still what learners are running. ' +
        'You can release it whenever you choose — holding does not expire and does not withdraw the version.</div>' +
        '<button class="btn pri" type="button" id="rel-go">' + ic('release') + 'Release version</button>' +
        '</div>';
    } else {
      decisionPanel =
        '<div class="decide">' +
        '<div class="d-lead">This version was <strong>released</strong> on ' + esc(v.decidedOn) + ' and is what learners are running now.</div>' +
        '</div>';
    }

    /* The live → new pairing. Two boxes and an arrow: the whole decision in one
       glance, without a diff, a changelog format or a version-history tree —
       none of which any requirement defines. */
    var pair =
      '<div class="verpair">' +
      '<div class="verbox"><div class="v-k">In production now</div><div class="v-v tabular">' + esc(m.live) + '</div>' +
      '<div class="v-d">Published ' + esc(m.published) + '. This is what every entitled learner is running.</div></div>' +
      '<div class="verarrow">' + ic('arrR', 'lg') + '</div>' +
      '<div class="verbox' + (deciding ? ' next' : '') + '"><div class="v-k">' + (v.state === 'released' ? 'Released' : 'Waiting on you') + '</div>' +
      '<div class="v-v tabular">' + esc(v.version) + '</div>' +
      '<div class="v-d">Ready since ' + esc(v.submitted) + '.' + (v.decidedOn ? ' Decision recorded ' + esc(v.decidedOn) + '.' : '') + '</div></div>' +
      '</div>';

    return shell('releases',
      crumbs([{ href: '#/overview', label: 'Overview' }, { href: '#/releases', label: 'Releases' }, { label: m.name + ' · ' + v.version }]),
      scopebar({ plane: true }) +
      phead(m.name, esc(m.disc) + ' · ' + esc(m.fmt), null, ' ' + relBadge(v)) +

      '<div class="grid-rail">' +
      '<div class="stack">' +

      cardFlush('Version ' + v.version,
        '<div style="padding:16px 20px 18px">' + pair +
        '<p style="font-size:14px;color:var(--text-2);line-height:1.65;margin-top:16px">' + esc(v.summary) + '</p></div>' +
        decisionPanel) +

      (v.state === 'held'
        ? '<div class="alert warning">' + ic('pause') +
          '<div><div class="at">This release is held</div>' +
          'Holding is a decision, not a delay — it is one of the two outcomes this screen offers, and it stays until you release the version. No reason is recorded against it, because Phase 1 defines no record of release decisions. ' +
          cite('FRD 2.3.2 · GP-4') + '</div></div>'
        : '') +

      boundary('This is a version decision, not a publication decision',
        '<p>' + esc(m.name) + ' was published on ' + esc(m.published) + ' by the Content Manager, and has been reaching learners ever since. <strong>Content publication has already occurred.</strong> Nothing on this screen publishes anything, re-publishes anything, withdraws anything, or changes who can see this module — it is not a second publication gate standing in front of the Content Manager’s. ' +
        cite('publication: FRD 1.4.3 · PM-16 · PM-17') + '</p>' +
        '<p style="margin-top:9px">Whether this role keeps the separate version release authority at all is <strong>D-01</strong>, an open PM clarification. The capability is deliberately isolated here so that it can be withdrawn without disturbing anything else in the workspace. ' +
        cite('FRD 2.3.2 · §6.6.5 · D-01 — OPEN PM CLARIFICATION') + '</p>', true) +

      '</div>' +

      '<div class="stack">' +

      card('What releasing does',
        '<div class="ladder">' +
        '<div class="lrow ' + (v.state === 'released' ? 'ok' : deciding ? 'cur' : 'warn') + '"><span class="lnode">' + ic(v.state === 'released' ? 'check' : deciding ? 'clock' : 'pause') + '</span>' +
        '<div class="lbody"><div class="lt">You decide<span class="lstat">' + esc(REL_STATES[v.state].label) + '</span></div>' +
        '<div class="ld">The version reaches production only on your release. ' + cite('FRD 2.3.2') + '</div></div></div>' +

        '<div class="lrow ' + (v.state === 'released' ? 'ok' : 'dim') + '"><span class="lnode">' + ic('cube') + '</span>' +
        '<div class="lbody"><div class="lt">The device application picks it up</div>' +
        '<div class="ld">An updated module version is downloaded automatically once it is available. ' + cite('FRD 2.3.1') + '</div></div></div>' +

        '<div class="lrow ' + (v.state === 'released' ? 'ok' : 'dim') + '"><span class="lnode">' + ic('refresh') + '</span>' +
        '<div class="lbody"><div class="lt">No reinstall is needed</div>' +
        '<div class="ld">A module updates independently of the application it runs in. ' + cite('FRD 2.3.3') + '</div></div></div>' +

        '<div class="lrow ' + (v.state === 'released' ? 'ok' : 'dim') + '"><span class="lnode">' + ic('user') + '</span>' +
        '<div class="lbody"><div class="lt">The learner may see an update is available</div>' +
        '<div class="ld">An unrequested update never blocks anyone from carrying on with what they were doing. ' + cite('FRD 2.3.1 · PM-05') + '</div></div></div>' +
        '</div>' +
        '<p style="font-size:12.5px;color:var(--text-3);margin-top:14px;line-height:1.6">' +
        'How a module actually reaches a device is deliberately not stated anywhere in this design. That decision has not been made. ' + cite('PM-05 · QT-01 — OPEN') + '</p>') +

      card('Not available here',
        '<ul class="notlist">' +
        '<li>No publish, unpublish or withdraw — publication is the Content Manager’s ' + cite('PM-16 · PM-17') + '</li>' +
        '<li>No return to the vendor or request for changes ' + cite('QP-26 — OPEN') + '</li>' +
        '<li>No rollback to an earlier version — no source defines one</li>' +
        '<li>No module lifecycle state ' + cite('FRD 1.5.1 is Phase 2') + '</li>' +
        '<li>No record of who decided, or when, beyond the state you see ' + cite('GP-4') + '</li>' +
        '</ul>') +

      '</div>' +
      '</div>'
    );
  }

  function bindRelease(id) {
    var v = version(id);
    if (!v) return;
    var m = S.modules[v.mid];

    var go = document.getElementById('rel-go');
    if (go) go.addEventListener('click', function () {
      openDialog({
        title: 'Release version ' + v.version + '?',
        body: '<p><strong>' + esc(m.name) + '</strong> version ' + esc(v.version) + ' replaces ' + esc(m.live) + ' as the version learners run. The module itself stays exactly as published.</p>' +
          '<div class="consequence">' + ic('info', 'sm') +
          '<span>Devices download the new version automatically. Learners are not notified — Phase 1 has no notification requirement — and anyone part-way through keeps going uninterrupted.</span></div>',
        confirmLabel: 'Release version',
        onConfirm: function () {
          v.state = 'released'; v.decidedOn = TODAY;
          /* The module's live version becomes this one. This is the single piece of
             derived truth the release decision changes, and every other screen
             recomputes from it. */
          m.live = v.version;
          save();
          toast('Version ' + v.version + ' released. It is now what learners are running.');
          announce('Version ' + v.version + ' of ' + m.name + ' has been released.');
          render();
        }
      });
    });

    var hold = document.getElementById('rel-hold');
    if (hold) hold.addEventListener('click', function () {
      openDialog({
        title: 'Hold version ' + v.version + '?',
        body: '<p>Learners carry on with ' + esc(m.live) + '. Version ' + esc(v.version) + ' stays ready and you can release it at any time.</p>' +
          '<div class="consequence">' + ic('info', 'sm') +
          '<span>No reason is recorded against a hold. Phase 1 defines no audit trail for release decisions, so the state you set is the whole record.</span></div>',
        confirmLabel: 'Hold version',
        confirmClass: 'sec',
        onConfirm: function () {
          v.state = 'held'; v.decidedOn = TODAY;
          save();
          toast('Version ' + v.version + ' held. Learners continue on ' + m.live + '.', 'info');
          announce('Version ' + v.version + ' of ' + m.name + ' is held.');
          render();
        }
      });
    });
  }

  /* ============================================================
     SA-06 · DEVICE REPLACEMENT REQUESTS    route #/device-requests
     SA-07 · DEVICE REQUEST DETAIL       route #/device-request/<id>

     FRD 2.4.2, verbatim: "Users requesting device replacement must
     receive approval from the Super Admin before transferring their
     license to a new device."

     FLOW 8's own framing, verbatim: "This is the platform's only Phase-1
     two-role, cross-plane approval workflow outside content governance:
     a learner in the personal context requesting an action only a
     platform-wide Super Admin can grant. Neither end had any designed
     surface."

     B2C ONLY, and for a stated reason. FRD 2.4.3 makes institutional
     deployments use SHARED devices, so no institutional learner has a
     personal device binding to transfer. No institutional request can
     ever appear here, and the screen says so rather than leaving a
     reviewer to wonder where they are.

     ONE OUTCOME. FRD 2.4.2's row records verbatim: "The FRD describes no
     rejection path, no evidence requirement and no limit on replacement
     frequency — all PENDING DECISION." So there is Approve, and there is
     nothing else. The absent decline route appears as a marked gap in
     the page, NOT as a greyed-out Decline button — a disabled control
     would imply the route exists and is merely unavailable, which is the
     opposite of true.

     THE LEARNER SIDE IS PART OF THE REQUIREMENT. FRD 2.4.2's acceptance
     criterion: "the request's state is visible to the learner throughout",
     and FLOW 8 step 4: "the learner can see that it has." Both ends are
     shown on the detail screen, so the effect of the approval on the
     person waiting is visible to the person deciding.
     ============================================================ */
  var REQ_STATES = {
    awaiting: { label: 'Awaiting your approval', badge: 'b-info',    icon: 'clock' },
    approved: { label: 'Approved',               badge: 'b-success', icon: 'check' }
  };
  function reqBadge(r) {
    var m = REQ_STATES[r.state];
    return badge(m.badge, m.icon, m.label);
  }

  function viewRequests() {
    var f = S.filters;
    var counts = { awaiting: requestsIn('awaiting').length, approved: requestsIn('approved').length, all: S.requests.length };
    var rows = f.reqState === 'all' ? S.requests.slice() : requestsIn(f.reqState);

    var body = rows.map(function (r) {
      return '<tr' + (r.state === 'awaiting' ? '' : '') + '>' +
        '<td><a class="rowlink" href="#/device-request/' + esc(r.id) + '"><span class="instcell">' +
        '<span class="ia" aria-hidden="true">' + esc(r.initials) + '</span>' +
        '<span><span class="tmain">' + esc(r.learner) + '</span><span class="tsub">Individual account</span></span></span></a></td>' +
        '<td><span style="color:var(--text)">' + esc(r.module) + '</span><div class="tsub">' + esc(r.fmt) + '</div></td>' +
        /* One column, not two. Two side-by-side device columns pushed the table past
           1280 and forced a page-level horizontal scroll; stacked, the transfer also
           reads better — it is one movement, not two facts. */
        '<td class="tabular"><span class="devmove">' +
        '<span class="vchip">' + esc(r.from) + '</span>' +
        '<span class="dm-arr" aria-hidden="true">' + ic('arrD', 'sm') + '</span>' +
        '<span class="sr-only"> moving to </span>' +
        '<span class="vchip">' + esc(r.to) + '</span></span></td>' +
        '<td>' + reqBadge(r) + (r.decidedOn ? '<div class="tsub">' + esc(r.decidedOn) + '</div>' : '') + '</td>' +
        '<td class="tabular" style="white-space:nowrap">' + esc(r.raised) + '</td>' +
        '<td><a class="btn sm ' + (r.state === 'awaiting' ? 'pri' : 'sec') + '" href="#/device-request/' + esc(r.id) + '">' +
        (r.state === 'awaiting' ? 'Review' : 'Open') + '</a></td>' +
        '</tr>';
    }).join('');

    var table = body
      ? '<table class="dt"><caption class="sr-only">Device replacement requests from individual learners</caption><thead><tr>' +
        '<th scope="col">Learner</th><th scope="col">Access</th><th scope="col">Device transfer</th>' +
        '<th scope="col">State</th><th scope="col">Requested</th><th scope="col"><span class="sr-only">Actions</span></th>' +
        '</tr></thead><tbody>' + body + '</tbody></table>'
      : emptyState('check',
          f.reqState === 'awaiting' ? 'No one is waiting on you' : 'Nothing here',
          f.reqState === 'awaiting'
            ? 'Every device replacement request has been approved. Nobody is currently locked out of their access waiting for a decision.'
            : 'No request is in this state.',
          '<a class="btn sec" href="#/device-requests?state=all">Show every request</a>');

    var bar =
      '<div class="listbar">' +
      '<label class="sr-only" for="req-state">Filter by request state</label>' +
      '<select id="req-state">' +
      [['awaiting', 'Awaiting approval (' + counts.awaiting + ')'], ['approved', 'Approved (' + counts.approved + ')'],
       ['all', 'All requests (' + counts.all + ')']].map(function (o) {
        return '<option value="' + o[0] + '"' + (f.reqState === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
      }).join('') + '</select>' +
      '<span class="lcount">' + rows.length + ' ' + plural(rows.length, 'request', 'requests') + '</span></div>';

    return shell('requests', crumbs([{ href: '#/overview', label: 'Overview' }, { label: 'Device requests' }]),
      scopebar({ plane: true }) +
      phead('Device replacement requests',
        'An individual learner cannot move their access to a new device until you approve it.') +
      '<div class="stack">' +

      (counts.awaiting
        ? '<div class="alert info">' + ic('clock') +
          '<div><div class="at">' + counts.awaiting + ' ' + plural(counts.awaiting, 'learner is', 'learners are') + ' waiting</div>' +
          'Until a request is approved, that learner’s access stays bound to their old device. Nobody else on the platform can grant this. ' +
          cite('FRD 2.4.2 · FLOW 8') + '</div></div>'
        : '') +

      tablecard(bar, table) +

      boundary('Only individual learners appear here',
        '<p>Institutional deployments run on shared devices, so an institutional learner has no personal device binding to move. No request from an institution can exist — this is not a filter, it is the shape of the requirement. ' +
        cite('FRD 2.4.1 is B2C · 2.4.3') + '</p>') +

      gap('There is no way to decline a request',
        '<p>The requirement gives this role one outcome — approval — and describes no rejection path, no evidence a learner must supply, and no limit on how often a device may be replaced. All three are pending decisions.</p>' +
        '<p>Rather than show a decline control that would not work, or a greyed-out one implying the route exists, the gap is stated here. A learner whose request should not be granted currently has no defined outcome at all.</p>',
        'FRD 2.4.2 · PENDING DECISION') +

      sampleNote('Learner names, accounts and device identifiers are sample design data. Device identifiers are shown partly masked; nothing in the requirements asks an administrator to read one in full.') +
      '</div>'
    );
  }
  function bindRequests() {
    var st = document.getElementById('req-state');
    if (st) st.addEventListener('change', function () { S.filters.reqState = st.value; save(); render(); });
  }

  function viewRequest(id) {
    var r = request(id);
    if (!r) return shell('requests', crumbs([{ href: '#/device-requests', label: 'Device requests' }, { label: 'Not found' }]),
      phead('Device request not found') +
      emptyState('search', 'No such request',
        'That request reference does not match any device replacement request in this prototype.',
        '<a class="btn sec" href="#/device-requests">Back to device requests</a>'));

    var waiting = r.state === 'awaiting';

    /* Both ends of FLOW 8 in one thread. The learner-side states are not
       decoration: FRD 2.4.2's acceptance criterion requires the request's state
       to be visible to the learner throughout, and FLOW 8 step 4 requires the
       rebinding to be visible to them too. Showing them here is how the person
       deciding sees what the decision does to the person waiting. */
    var thread =
      '<div class="timeline">' +
      '<div class="tl-item"><span class="tl-dot info">' + ic('user') + '</span>' +
      '<div class="tl-body"><div class="tl-action">' + esc(r.learner) + ' asked to move their access</div>' +
      '<div class="tl-who">' + esc(r.raised) + ' · from the individual learner’s own account ' + cite('FRD 2.4.2') + '</div></div></div>' +

      '<div class="tl-item"><span class="tl-dot ' + (waiting ? 'wait' : 'good') + '">' + ic(waiting ? 'clock' : 'check') + '</span>' +
      '<div class="tl-body"><div class="tl-action">' + (waiting ? 'Waiting for your approval' : 'You approved the transfer') + '</div>' +
      '<div class="tl-who">' + (waiting
        ? 'The learner can see that their request is with the platform. ' + cite('FRD 2.4.2 acceptance criterion')
        : esc(r.decidedOn) + ' · ' + esc(S.admin.name) + ' ' + cite('FLOW 8 step 3')) + '</div></div></div>' +

      '<div class="tl-item"><span class="tl-dot ' + (waiting ? '' : 'good') + '">' + ic(waiting ? 'lock' : 'check') + '</span>' +
      '<div class="tl-body"><div class="tl-action">' + (waiting ? 'Access stays on the current device' : 'Access moved to the new device') + '</div>' +
      '<div class="tl-who">' + (waiting
        ? 'Until you approve, ' + esc(r.learner.split(' ')[0]) + ' can only open this on the device they already have.'
        : 'The licence rebound, and the learner can see that it has. ' + cite('FLOW 8 step 4 · AC-28')) + '</div></div></div>' +
      '</div>';

    var decision = waiting
      ? '<div class="decide">' +
        '<div class="d-lead">Approving moves this learner’s access from <strong>' + esc(r.from) + '</strong> to <strong>' + esc(r.to) + '</strong>. ' +
        'The old device stops being able to open it.</div>' +
        '<button class="btn pri" type="button" id="req-approve">' + ic('check') + 'Approve the transfer</button>' +
        '</div>'
      : '<div class="decide">' +
        '<div class="d-lead">Approved on <strong>' + esc(r.decidedOn) + '</strong>. This learner’s access is bound to ' + esc(r.to) + '.</div>' +
        '</div>';

    var pair =
      '<div class="verpair">' +
      '<div class="verbox"><div class="v-k">' + (waiting ? 'Bound now' : 'Was bound to') + '</div>' +
      '<div class="v-v tabular" style="font-size:15px">' + esc(r.from) + '</div>' +
      '<div class="v-d">' + esc(r.fromLabel) + '</div></div>' +
      '<div class="verarrow">' + ic('arrR', 'lg') + '</div>' +
      '<div class="verbox' + (waiting ? ' next' : '') + '"><div class="v-k">' + (waiting ? 'Requested' : 'Bound now') + '</div>' +
      '<div class="v-v tabular" style="font-size:15px">' + esc(r.to) + '</div>' +
      '<div class="v-d">' + esc(r.toLabel) + '</div></div>' +
      '</div>';

    return shell('requests',
      crumbs([{ href: '#/overview', label: 'Overview' }, { href: '#/device-requests', label: 'Device requests' }, { label: r.learner }]),
      scopebar({ plane: true }) +
      phead('Device replacement · ' + r.learner,
        esc(r.account) + ' · requested ' + esc(r.raised), null, ' ' + reqBadge(r)) +

      '<div class="grid-rail">' +
      '<div class="stack">' +

      cardFlush('The transfer',
        '<div style="padding:16px 20px 18px">' + pair +
        '<div class="kv" style="margin-top:18px">' +
        '<div class="k">Access affected</div><div class="v">' + esc(r.module) + ' · ' + esc(r.fmt) + '</div>' +
        '<div class="k">Account</div><div class="v">' + esc(r.account) + '</div>' +
        '<div class="k">Market context</div><div class="v">Individual (B2C) — no institution is involved ' + cite('FRD 1.3.2') + '</div>' +
        '</div></div>' +
        decision) +

      card('Where this request has got to',
        thread) +

      '</div>' +

      '<div class="stack">' +

      (waiting
        ? gap('If this should not be granted, there is nothing to press',
            '<p>The requirement describes approval and nothing else — no rejection, no evidence requirement, no limit on how often a learner may do this. A decline control is not offered here because no decline outcome exists to design.</p>' +
            '<p>This is a real gap in the requirement set, not an omission in this screen.</p>',
            'FRD 2.4.2 · PENDING DECISION')
        : '<div class="alert success">' + ic('check') +
          '<div><div class="at">The licence has rebound</div>' +
          esc(r.learner) + ' can open this on their new device, and can see that the move went through. ' + cite('FLOW 8 step 4 · AC-28') + '</div></div>') +

      card('Not available here',
        '<ul class="notlist">' +
        '<li>No decline or rejection ' + cite('FRD 2.4.2 — PENDING') + '</li>' +
        '<li>No evidence or supporting-document step ' + cite('FRD 2.4.2 — PENDING') + '</li>' +
        '<li>No replacement-frequency limit or counter ' + cite('FRD 2.4.2 — PENDING') + '</li>' +
        '<li>No device registration or remote device management ' + cite('FRD 2.5.x · 2.6.x are Phase 2') + '</li>' +
        '<li>No record of this approval beyond the state you see ' + cite('GP-4 — OPEN') + '</li>' +
        '<li>No payment, refund or entitlement change — the access itself is unchanged, only the device it opens on ' + cite('QP-18') + '</li>' +
        '</ul>') +

      '</div>' +
      '</div>'
    );
  }

  function bindRequest(id) {
    var r = request(id);
    if (!r) return;
    var ap = document.getElementById('req-approve');
    if (ap) ap.addEventListener('click', function () {
      openDialog({
        title: 'Approve this device transfer?',
        body: '<p><strong>' + esc(r.learner) + '</strong>’s access to ' + esc(r.module) + ' will move from ' + esc(r.from) + ' to ' + esc(r.to) + '.</p>' +
          '<div class="consequence">' + ic('info', 'sm') +
          '<span>The old device stops being able to open it. The learner sees straight away that the move went through. No record of this approval is kept beyond the request’s own state.</span></div>',
        confirmLabel: 'Approve the transfer',
        onConfirm: function () {
          r.state = 'approved'; r.decidedOn = TODAY;
          save();
          toast('Transfer approved. ' + r.learner + ' can now open this on their new device.');
          announce('Device transfer approved for ' + r.learner + '. The licence has rebound to the new device.');
          render();
        }
      });
    });
  }

  /* ============================================================
     SA-08 · LICENSING                             route #/licensing

     FRD 8.1.1 and §6.7.2 confirm "licensing management" as a Super Admin
     area. The mechanism does not exist.

     FLOW 2's recorded gap, verbatim: "How an institutional licence is
     transacted in Phase 1 is undefined, because institutional billing
     (FRD 9.3.1, 9.3.2) is Phase 2. Licences are shown as existing; no
     in-platform purchase flow is invented."

     §6.7.5 lists the same thing as an unresolved detail of the role
     itself: "How an institutional licence is transacted in Phase 1."

     So this screen shows access records AS EXISTING and does nothing
     else. There is no purchase, no seat, no cap, no price, no currency,
     no renewal, no expiry, no invoice, no plan, no term, no refund and
     no cancellation anywhere on it, because `OQ-01`-`OQ-06` and `QP-04`
     leave every one of those open.

     NO STUDENT CAP, DELIBERATELY. An earlier pass carried a "Student
     cap" column here and a capped-at figure on SA-03, read from a draft
     FRD line about seat utilisation (6.2.2). `OQ-03` is OPEN — whether
     institutional access is bounded by a learner or seat cap at all,
     and by what model, is unresolved — so presenting a cap as a fact of
     the record asserted a rule no source has settled. The column, the
     figure and the underlying seed field are removed. Nothing replaces
     them: no alternative commercial model is invented in their place.

     The individual (B2C) side has no administrative action at all: FRD
     9.2.1 makes activation automatic — "Upon successful payment,
     licenses shall be automatically activated and linked to the user
     account" — with no human step for anyone.
     ============================================================ */
  function viewLicensing() {
    var withAccess = instList().filter(function (i) { return i.access.on; });
    var without = instList().filter(function (i) { return !i.access.on; });

    var rows = withAccess.map(function (i) {
      return '<tr>' +
        '<td><a class="rowlink" href="#/institution/' + esc(i.id) + '"><span class="instcell">' +
        '<span class="ia" aria-hidden="true">' + esc(i.short) + '</span>' +
        '<span><span class="tmain">' + esc(i.name) + '</span><span class="tsub">' + esc(i.ref) + '</span></span></span></a></td>' +
        '<td class="tabular">' + esc(i.access.streams) + ' ' + plural(i.access.streams, 'stream', 'streams') + '</td>' +
        '<td>' + badge('b-neutral', 'check', 'Recorded') + '</td>' +
        '<td><a class="btn sm sec" href="#/institution/' + esc(i.id) + '">Open institution</a></td>' +
        '</tr>';
    }).join('');

    return shell('licensing', crumbs([{ href: '#/overview', label: 'Overview' }, { label: 'Licensing' }]),
      scopebar({ plane: true }) +
      phead('Licensing',
        'Which institutions hold content access, and what that access covers.') +
      '<div class="stack">' +

      '<div class="alert info">' + ic('info') +
      '<div><div class="at">Access records are shown as they stand</div>' +
      'How an institution comes to hold content access has not been decided. Nothing here creates, changes, prices, renews or ends an access record — this screen shows what exists. ' +
      cite('FRD 6.2.1 · QP-04 · OQ-01 — OPEN') + '</div></div>' +

      cardFlush('Institutional content access',
        tablecard('',
          '<table class="dt"><caption class="sr-only">Institutions holding content access, with the academic streams each record covers</caption><thead><tr>' +
          '<th scope="col">Institution</th><th scope="col">Academic streams covered</th>' +
          '<th scope="col">State</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' + rows + '</tbody></table>') +
        (without.length
          ? '<div style="padding:14px 20px 18px">' +
            boundary(without.length + ' ' + plural(without.length, 'institution has', 'institutions have') + ' no access record yet',
              '<p>' + esc(without.map(function (i) { return i.name; }).join(', ')) + '. Until an access record exists, no learner there can reach content. There is no action here that creates one. ' +
              cite('FRD 6.2.1 — the transaction is OPEN') + '</p>') + '</div>'
          : '') +
        (withAccess.length + ' of ' + instList().length + ' institutions')) +

      card('Individual access',
        '<p style="font-size:13.5px;color:var(--text-2);line-height:1.65">' +
        'An individual learner’s access activates by itself when their payment succeeds, and attaches to their account without anyone doing anything. There is no administrative step, and so no administrative screen.</p>' +
        '<p style="font-size:12.5px;color:var(--text-3);margin-top:10px">' + cite('FRD 9.2.1 · 9.2.2 — activation is automatic') + '</p>' +
        '<div style="margin-top:14px">' +
        boundary('Individual learners are not listed here',
          '<p>Individual-learner data is held apart from institutional data, and nothing on this platform combines the two. Where an individual learner does need something from this role, it reaches you as a request — see device replacements. ' +
          cite('FRD 1.3.1 · 1.3.2 · PM-13') + '</p>') + '</div>') +

      gap('The commercial model behind all of this is not settled',
        '<p>What an institution subscribes to, <strong>whether access is bounded by a learner or seat cap at all</strong>, how a learner comes to be entitled, and how any of it is paid for are all open. Institutional billing is a later phase.</p>' +
        '<p>Nothing on this screen implies an answer to any of them. There is no price, no term, no renewal, no invoice, no plan, <strong>no seat count and no student cap</strong> — a draft line about seat utilisation is not a settled rule, and this screen does not present one as though it were.</p>',
        'OQ-01 · OQ-02 · OQ-03 — OPEN · OQ-04 · QP-04 · FRD 9.3.x is Phase 2') +

      sampleNote('Stream counts are sample design data. No cap, seat count, amount, currency, term or provider appears anywhere in this prototype.') +
      '</div>'
    );
  }

  /* ============================================================
     SA-09 · PLATFORM ROLES                  route #/platform/roles

     READ-ONLY, and the reason is the whole point of the screen.

     The AUTHORITY is confirmed — §6.7.2, verbatim: "Manage platform
     configuration and platform role assignment (8.1.1)".

     The MECHANISM is not. `QD-02` is an open HIGH question, and the
     Detailed FRD states the position plainly: "Super Admin assigns
     platform roles under 8.1.1; how a person becomes Faculty or
     Institute Admin within a tenant in Phase 1 is recorded as an open
     question."

     So this screen shows who holds each central-plane role and offers no
     control to change it. Assigning, inviting, creating, revoking and
     deactivating are all absent — not disabled, absent — because the
     provisioning route they would use has not been decided.

     TENANT-INTERNAL ROLES ARE DELIBERATELY MISSING. Institute Admin,
     Faculty and Learner are the institution's, and how someone becomes
     one in Phase 1 is expressly undefined. Their absence is stated on
     the screen so it reads as a boundary rather than an oversight.

     NO CUSTOM ROLES. FRD 8.3.1 and 8.3.2 are Phase 3 and §6.7.3
     prohibits them outright. The seven approved roles are the whole set
     and nothing here can add to it or change what one means.
     ============================================================ */
  function viewPlatformRoles() {
    var rows = S.platformRoles.map(function (pr) {
      return '<tr>' +
        '<td><span class="tmain">' + esc(pr.role) + '</span><div class="tsub">' + esc(pr.plane) + '</div></td>' +
        '<td>' + pr.people.map(function (p) {
          return '<span class="instcell" style="margin-bottom:4px"><span class="ia" aria-hidden="true">' +
            esc(p.replace(/^Dr\.\s*/, '').split(/[\s.]+/).filter(Boolean).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase()) + '</span>' +
            '<span class="tmain" style="font-weight:500">' + esc(p) + '</span></span>';
        }).join('') + '</td>' +
        '<td class="tabular">' + pr.people.length + '</td>' +
        '<td>' + cite(pr.basis) + '</td>' +
        '</tr>';
    }).join('');

    return shell('roles', crumbs([{ href: '#/overview', label: 'Overview' }, { href: '#/platform/roles', label: 'Platform' }, { label: 'Platform roles' }]),
      scopebar({ plane: true }) +
      phead('Platform roles',
        'Who holds each of the roles that work across the platform rather than inside an institution.') +
      '<div class="stack">' +

      cardFlush('Central platform roles',
        tablecard('',
          '<table class="dt"><caption class="sr-only">Roles that operate across the platform, and who currently holds each</caption><thead><tr>' +
          '<th scope="col">Role</th><th scope="col">Held by</th><th scope="col">People</th><th scope="col">Basis</th>' +
          '</tr></thead><tbody>' + rows + '</tbody></table>'),
        'Read-only') +

      gap('There is no way to assign a role here yet',
        '<p>This role does hold platform role assignment as an authority. How anyone is actually assigned a role in Phase 1 — invited, created, imported, or something else — has not been decided, and it is an open question of the highest priority in the requirement set.</p>' +
        '<p>Designing an assignment control would mean choosing that mechanism. This screen shows who holds what and waits for the decision instead.</p>',
        'FRD 8.1.1 · QD-02 — OPEN, HIGH') +

      '<div class="grid-rail">' +
      card('The roles inside an institution are not shown',
        '<p style="font-size:13.5px;color:var(--text-2);line-height:1.65">' +
        'Institute Admin, Faculty and Learner belong to an institution, not to the platform. How a person becomes one of them is undefined in Phase 1, and neither the people nor the assignment reach this role.</p>' +
        '<ul class="notlist" style="margin-top:10px">' +
        '<li>No institutional person appears on this screen</li>' +
        '<li>No institutional role can be assigned from here</li>' +
        '<li>No institution’s staff list is reachable from here</li>' +
        '</ul>' +
        '<p style="font-size:12.5px;color:var(--text-3);margin-top:12px">' + cite('PM-13 · QD-02 · FRD 7.4.2 is Phase 3') + '</p>') +

      card('The seven roles are fixed',
        '<p style="font-size:13.5px;color:var(--text-2);line-height:1.65">' +
        'Learner, Faculty, Institute Admin, Content Manager, Super Admin, Vendor and Academic Reviewer are the platform’s roles. Creating a new one, or changing what an existing one may do, is a later phase — nothing here can alter the set or its meanings.</p>' +
        '<p style="font-size:12.5px;color:var(--text-3);margin-top:10px">' + cite('FRD 8.1.1–8.1.5 · PM-07 · 8.3.x is Phase 3') + '</p>') +
      '</div>' +

      gap('Who sets up a vendor or a reviewer is assigned to nobody',
        '<p>The requirements speak of “authorised vendors” without ever saying who authorises them, and academic validation is described without any account administration around it. Both roles exist and both are confirmed; the route by which a person becomes one is written down nowhere.</p>',
        'FRD 1.4.1 · 1.4.2 · PM-07 — OPEN') +

      sampleNote('Names are sample design data, carried over from the Batch-01 content governance prototype so the same person reads as the same person across the platform design.') +
      '</div>'
    );
  }

  /* ============================================================
     SA-10 · PLATFORM CONFIGURATION  route #/platform/configuration

     THIS SCREEN IS DELIBERATELY NOT A SETTINGS PAGE.

     FRD 8.1.1 confirms the authority in as many words — "full
     administrative control over platform configuration" — and then no
     source, anywhere in the v5 set, names a single Phase-1 platform-wide
     setting for this role to control.

     A settings page invented to fill that space would be the single most
     misleading artefact this batch could produce: it would look like a
     specification, and every control on it would be fiction. So the
     screen renders the REGISTER instead — each configuration area a
     reader would expect, and the actual reason it has no control.

     The screen's content IS the finding. It is the honest form of "we
     checked, and here is exactly what the requirements say."

     Each row is one of four kinds, and the register says which:
        ANOTHER ROLE   the setting exists, and someone else owns it
        LATER PHASE    the requirement exists and is Phase 2 or Phase 3
        NOT DEFINED    no requirement defines it at all
        ELSEWHERE      it is real, and it already has its own screen here
     ============================================================ */
  var CONFIG_REGISTER = [
    { area: 'Module version release', desc: 'When a new version of a published module reaches production environments.',
      src: 'FRD 2.3.2', kind: 'ELSEWHERE', why: 'Confirmed, and built. It has its own screen — Releases.', href: '#/releases' },
    { area: 'Device replacement approval', desc: 'Whether an individual learner may move their access to a different device.',
      src: 'FRD 2.4.2', kind: 'ELSEWHERE', why: 'Confirmed, and built. It has its own screen — Device requests.', href: '#/device-requests' },
    { area: 'Platform role assignment', desc: 'Who holds each role that works across the platform.',
      src: 'FRD 8.1.1 · QD-02', kind: 'NOT DEFINED', why: 'The authority is confirmed; the Phase-1 mechanism is an open question. Shown read-only under Platform roles.', href: '#/platform/roles' },
    { area: 'Institutional sign-in', desc: 'How an institution’s people authenticate.',
      src: 'FRD 4.2.2 · PM-10', kind: 'ANOTHER ROLE', why: 'Each institution configures its own, in its own workspace. The Institute Admin owns it.' },
    { area: 'Institution data integration', desc: 'The connection that brings an institution’s records in, and how often it runs.',
      src: 'FRD 7.1.1 · 7.2.1', kind: 'ANOTHER ROLE', why: 'Configured inside the institution by the Institute Admin, including the schedule.' },
    { area: 'Content access and stream mapping', desc: 'Which content an institution’s academic streams reach.',
      src: 'FRD 6.2.1 · 7.2.3', kind: 'ANOTHER ROLE', why: 'The Institute Admin maps its own streams. How the access record itself comes to exist is open.' },
    { area: 'Assessment rules and grading', desc: 'How assessments are configured and marked.',
      src: 'FRD 5.1.x · PM-15', kind: 'ANOTHER ROLE', why: 'Faculty configures assessments, in both market contexts. This role has no assessment surface at all.' },
    { area: 'Bundles and pricing', desc: 'Grouping modules, and what anything costs.',
      src: 'FRD 6.3.1 · 6.3.2', kind: 'LATER PHASE', why: 'Phase 2, and explicitly prohibited to this role in Phase 1.' },
    { area: 'Custom roles and permissions', desc: 'Creating a role, or changing what a role may do.',
      src: 'FRD 8.3.1 · 8.3.2', kind: 'LATER PHASE', why: 'Phase 3, and explicitly prohibited to this role in Phase 1. The seven roles are fixed.' },
    { area: 'Cross-institution analytics', desc: 'Metrics and dashboards spanning institutions.',
      src: 'FRD 8.2.2 · 11.3.x · PM-11', kind: 'LATER PHASE', why: 'Phase 2, deferred, and explicitly prohibited. Phase 1 gives this role operational status only.' },
    { area: 'Device registration and management', desc: 'Registering devices and managing them remotely.',
      src: 'FRD 2.5.x · 2.6.x', kind: 'LATER PHASE', why: 'Phase 2. Must not appear in a Phase-1 administrative workspace.' },
    { area: 'XR delivery mechanism', desc: 'How an experiment actually reaches the device that runs it.',
      src: 'PM-05 · QT-01', kind: 'NOT DEFINED', why: 'Left open by explicit instruction. No mechanism is selected, and none is implied anywhere in this design.' },
    { area: 'Session, password and sign-in policy', desc: 'Complexity, expiry, lockout, multi-factor and session duration.',
      src: '—', kind: 'NOT DEFINED', why: 'No requirement defines any of it. Nothing is drawn, because there is nothing to draw from.' },
    { area: 'Audit and activity records', desc: 'A record of licensing, entitlement, configuration and approval decisions.',
      src: 'GP-4 · FRD §6.7.5', kind: 'NOT DEFINED', why: 'Phase 1 requires review history for the content governance chain only. Everything else is an acknowledged gap.' },
    { area: 'Notifications', desc: 'Telling anyone that anything has changed.',
      src: '—', kind: 'NOT DEFINED', why: 'No Phase-1 notification requirement exists anywhere in the requirement set.' }
  ];
  /* Badge labels are kept short so they never wrap or clip in the register's
     fixed third column; the sentence-length explanation lives in the `why`
     column beside them, where it has room. */
  var KIND_BADGE = {
    'ELSEWHERE':   ['b-success', 'check',    'Built here'],
    'ANOTHER ROLE':['b-info',    'users',    'Another role'],
    'LATER PHASE': ['b-neutral', 'clock',    'Later phase'],
    'NOT DEFINED': ['b-outline', 'help',     'Not defined']
  };

  function viewConfiguration() {
    var rows = CONFIG_REGISTER.map(function (c) {
      var k = KIND_BADGE[c.kind];
      return '<div class="reg-row">' +
        '<div><div class="r-t">' + esc(c.area) + (c.href ? ' <a class="btn sm gho" href="' + c.href + '" style="height:22px;padding:0 8px;font-size:12px">Open' + ic('chevR', 'sm') + '</a>' : '') + '</div>' +
        '<div class="r-d">' + esc(c.desc) + '</div></div>' +
        '<div class="r-why">' + esc(c.why) + '</div>' +
        '<div>' + badge(k[0], k[1], k[2]) + '<div class="r-src" style="margin-top:6px">' + esc(c.src) + '</div></div>' +
        '</div>';
    }).join('');

    var counts = {};
    CONFIG_REGISTER.forEach(function (c) { counts[c.kind] = (counts[c.kind] || 0) + 1; });

    return shell('config', crumbs([{ href: '#/overview', label: 'Overview' }, { href: '#/platform/roles', label: 'Platform' }, { label: 'Configuration' }]),
      scopebar({ plane: true }) +
      phead('Platform configuration',
        'What this role can configure across the platform, and what it cannot.') +
      '<div class="stack">' +

      '<div class="alert info">' + ic('info') +
      '<div><div class="at">There is nothing to set here yet</div>' +
      'This role holds platform configuration as an authority, but no Phase-1 requirement names a platform-wide setting for it to control. Rather than show controls that would be invented, this page lists every area a reader might expect and says exactly where each one actually stands. ' +
      cite('FRD 8.1.1') + '</div></div>' +

      cardFlush('Configuration register',
        '<div class="reg">' + rows + '</div>',
        counts['ELSEWHERE'] + ' built · ' + counts['ANOTHER ROLE'] + ' another role · ' + counts['LATER PHASE'] + ' later phase · ' + counts['NOT DEFINED'] + ' not defined') +

      boundary('Why this page has no form on it',
        '<p>Every field a settings page would need — a value, a default, a permitted range, an effect — comes from a requirement. Where the requirement does not exist, the field would be invention dressed as specification. The register is the honest version of this screen, and it stays until a requirement gives it something to hold. ' +
        cite('FRD 8.1.1 · §6.7.3') + '</p>') +

      '</div>'
    );
  }

  /* ============================================================
     PROTOTYPE INDEX — not a product screen         route #/index

     The reviewer's way in. It states the batch's finding up front,
     because a reviewer opening a Super Admin workspace in this
     programme arrives expecting a publication queue, and the first thing
     they need to know is why there isn't one.
     ============================================================ */
  function viewIndex() {
    var rel = awaitingReleases(), req = awaitingRequests();
    /* The index is prototype navigation rather than product UI, but it is still a
       page someone lands on, so it carries the same landmark and skip affordance as
       every product screen. Batch 04's index has neither; this is a local
       improvement, not a change to that batch. */
    return protobar('index') +
      '<a class="skip-link" href="#main-content" id="skip-link">Skip to main content</a>' +
      '<main class="index-wrap" id="main-content">' +
      '<div class="index-head">' +
      '<span class="itag">BATCH 05 · SUPER ADMIN · PLATFORM-WIDE ADMINISTRATION</span>' +
      '<h1>Super Admin workspace — interactive prototype</h1>' +
      '<p>Ten screens covering what the approved Super Admin role actually owns in Phase 1: cross-institution oversight, module version release control, device-replacement approval, licence visibility, and the platform configuration register. Every screen traces to a requirement or states the gap where one is missing.</p>' +
      '</div>' +

      '<div class="alert warning" style="margin-bottom:22px">' + ic('alertTri') +
      '<div><div class="at">There is no publication anywhere in this prototype — deliberately</div>' +
      'The Content Manager publishes content. The Super Admin is not part of the publication flow, holds no publish control, no publication queue and no return-to-vendor action, and none is invented in its place. ' +
      'The FRD still assigns publication to the Super Admin at 1.4.4; that is a recorded deviation, left unreconciled in the sources. ' +
      'Whether the Super Admin may return a submission at the publication gate is an open question and stays open. ' +
      '<span class="cite">PM-16 · PM-17 · PM-18 · QP-26</span></div></div>' +

      '<div class="alert info" style="margin-bottom:22px">' + ic('info') +
      '<div><div class="at">Releases is version release control — it is not publication, and not a second gate in front of it</div>' +
      'Every module on the Releases screens was published by the Content Manager before it got there. The two controls are <strong>Release version</strong> and <strong>Hold version</strong>, and they decide only whether a newer version replaces the one learners are running. ' +
      'Whether this role keeps that separate authority at all is <strong>D-01</strong>, an open PM clarification — so the capability is isolated to two screens and withdraws as a pair. ' +
      '<span class="cite">FRD 2.3.2 · §6.6.5 · D-01 — OPEN PM CLARIFICATION</span></div></div>' +

      '<div class="alert info" style="margin-bottom:22px">' + ic('info') +
      '<div><div class="at">The cross-tenant institution screens are read-only, and that is an open question too</div>' +
      'FRD 1.3.5 says “view and manage” but names no cross-tenant management action, so Batch 05 designs the sight and not the hand. Which specific cross-tenant write actions are authorised is <strong>D-02</strong>, an open PM clarification. ' +
      '<span class="cite">FRD 1.3.5 · PM-13 · D-02 — OPEN PM CLARIFICATION</span></div></div>' +

      '<div class="index-section">' +
      '<h2>Walkthroughs</h2>' +
      '<div class="pathgrid">' +

      '<div class="pathcard"><span class="pk">A</span><h2>An institution needs attention</h2>' +
      '<ol><li>Open the platform overview and see what is waiting</li>' +
      '<li>Follow the institution that is not fully operating</li>' +
      '<li>Read its readiness, and see who owns each part of it</li>' +
      '<li>Find that there is nothing here for you to change — and why</li></ol>' +
      '<div class="pgo"><a class="btn sm pri" href="#/overview">Start</a>' +
      '<a class="btn sm sec" href="#/institution/mce">Jump to the institution</a></div></div>' +

      '<div class="pathcard"><span class="pk">B</span><h2>Release a new module version</h2>' +
      '<ol><li>Open Releases — ' + rel + ' ' + plural(rel, 'version is', 'versions are') + ' awaiting a decision</li>' +
      '<li>Open one and compare it with the version learners are running</li>' +
      '<li>Release it, or hold it — both are real outcomes</li>' +
      '<li>Watch the overview and navigation counts settle</li></ol>' +
      '<div class="pgo"><a class="btn sm pri" href="#/releases">Start</a>' +
      '<a class="btn sm sec" href="#/release/v-torsion-120">See a held release</a></div></div>' +

      '<div class="pathcard"><span class="pk">C</span><h2>Approve a device replacement</h2>' +
      '<ol><li>Open Device requests — ' + req + ' ' + plural(req, 'learner is', 'learners are') + ' waiting</li>' +
      '<li>Open one and see both ends of the request</li>' +
      '<li>Approve the transfer, and watch the learner’s side resolve</li>' +
      '<li>Note that there is no way to decline — and why</li></ol>' +
      '<div class="pgo"><a class="btn sm pri" href="#/device-requests">Start</a>' +
      '<a class="btn sm sec" href="#/device-request/dr-03">See an approved one</a></div></div>' +

      '<div class="pathcard"><span class="pk">D</span><h2>Where the boundaries actually are</h2>' +
      '<ol><li>Licensing — access records exist; nothing transacts them</li>' +
      '<li>Platform roles — the authority is confirmed, the mechanism is not</li>' +
      '<li>Configuration — the register, not a settings page</li>' +
      '<li>Every gap on those screens is a real gap in the requirements</li></ol>' +
      '<div class="pgo"><a class="btn sm pri" href="#/platform/configuration">Start</a>' +
      '<a class="btn sm sec" href="#/licensing">Licensing</a></div></div>' +

      '</div></div>' +

      '<div class="index-section">' +
      '<h2>Every screen</h2>' +
      '<div class="rolegrid">' +
      [['SA-01', 'Platform overview', '#/overview'],
       ['SA-02', 'Institutions', '#/institutions'],
       ['SA-03', 'Institution detail', '#/institution/nit'],
       ['SA-04', 'Module releases', '#/releases'],
       ['SA-05', 'Release decision', '#/release/v-shear-150'],
       ['SA-06', 'Device requests', '#/device-requests'],
       ['SA-07', 'Device request detail', '#/device-request/dr-01'],
       ['SA-08', 'Licensing', '#/licensing'],
       ['SA-09', 'Platform roles', '#/platform/roles'],
       ['SA-10', 'Platform configuration', '#/platform/configuration']].map(function (r) {
        return '<a class="rolecard" href="' + r[2] + '"><span class="rc-av" aria-hidden="true">' + r[0].slice(3) + '</span>' +
          '<span><span class="rc-name">' + esc(r[1]) + '</span><br><span class="rc-sub">' + r[0] + '</span></span></a>';
      }).join('') +
      '</div></div>' +

      '<div class="index-section">' +
      '<h2>What this prototype is not</h2>' +
      '<div class="proto-note"><span class="pn-label">SCOPE</span><div class="pn-body" style="flex:1">' +
      'No backend, no API, no database, no tenant service, no role service, no identity provider, no payment provider, no analytics and no network request of any kind. All institutions are fictional; all people, identifiers, modules, versions and dates are sample design data. ' +
      'No commercial model, licence transaction, seat rule, price, XR delivery mechanism or package format is asserted — each of those is open or pending in the requirement set.' +
      '</div></div></div>' +

      '</main>';
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

    if (p[0] === 'overview') html = viewOverview();
    else if (p[0] === 'institutions') { html = viewInstitutions(r.query); after = bindInstitutions; }
    else if (p[0] === 'institution' && p[1]) html = viewInstitution(p[1]);
    else if (p[0] === 'releases') {
      if (r.query.indexOf('state=all') !== -1) S.filters.relState = 'all';
      html = viewReleases(); after = bindReleases;
    }
    else if (p[0] === 'release' && p[1]) { var vid = p[1]; html = viewRelease(vid); after = function () { bindRelease(vid); }; }
    else if (p[0] === 'device-requests') {
      if (r.query.indexOf('state=all') !== -1) S.filters.reqState = 'all';
      html = viewRequests(); after = bindRequests;
    }
    else if (p[0] === 'device-request' && p[1]) { var rid = p[1]; html = viewRequest(rid); after = function () { bindRequest(rid); }; }
    else if (p[0] === 'licensing') html = viewLicensing();
    else if (p[0] === 'platform' && p[1] === 'configuration') html = viewConfiguration();
    else if (p[0] === 'platform') html = viewPlatformRoles();

    if (!html) html = viewIndex();
    root.innerHTML = html;

    var pr = document.getElementById('proto-reset');
    if (pr) pr.addEventListener('click', resetDemo);
    var sk = document.getElementById('skip-link');
    if (sk) sk.addEventListener('click', function (ev) {
      ev.preventDefault(); /* hash routing owns the fragment — focus main directly instead */
      focusMain(false);
    });
    bindAccountMenu();
    if (after) after();
  }

  /* account menu — a real menu, because Platform roles and Sign out live in it */
  function bindAccountMenu() {
    var btn = document.getElementById('acct-btn'), menu = document.getElementById('acct-menu');
    if (!btn || !menu) return;
    function close() {
      menu.hidden = true; btn.setAttribute('aria-expanded', 'false');
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('mousedown', onOutside, true);
    }
    function open() {
      menu.hidden = false; btn.setAttribute('aria-expanded', 'true');
      document.addEventListener('keydown', onKey, true);
      document.addEventListener('mousedown', onOutside, true);
      var first = menu.querySelector('a, button'); if (first) first.focus();
    }
    function onKey(ev) {
      if (ev.key === 'Escape') { close(); btn.focus(); }
      if (ev.key === 'Tab' && !menu.contains(ev.target)) close();
    }
    function onOutside(ev) { if (!menu.contains(ev.target) && ev.target !== btn) close(); }
    btn.addEventListener('click', function () { menu.hidden ? open() : close(); });
    var so = document.getElementById('acct-signout');
    if (so) so.addEventListener('click', function () {
      close();
      /* No authentication is modelled anywhere in this prototype: how anyone
         signs in, and how a role is resolved at sign-in, are open questions
         (QT-04, QD-02). Signing out returns to the prototype index rather than
         asserting a sign-in screen this batch has no authority to design. */
      toast('Sign-out is not modelled in this prototype — authentication and role resolution are open questions.', 'info');
      location.hash = '#/index';
    });
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
