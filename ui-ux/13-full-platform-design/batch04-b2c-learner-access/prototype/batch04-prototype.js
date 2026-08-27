/* ============================================================
   XR Simulation Learning Platform — Batch 04 interactive prototype
   INDIVIDUAL (B2C) LEARNER ACCESS
   CATALOGUE · MODULE / BUNDLE DETAIL · GETTING ACCESS
   · PAYMENT OUTCOMES · ENTITLEMENT · MY LEARNING

   Plain JavaScript. No framework, no backend, no network request
   of any kind, no payment provider or gateway, no authentication
   provider, no entitlement service, no analytics. Every state
   below is local prototype state held in the page.

   THE ACCESS SPINE. One record type drives every screen:

       S.access[moduleId] = { via, on, ref }

   Catalogue access state, module detail, bundle detail, the
   access summary, the outcome screen and My Learning are all
   FUNCTIONS OF THAT ONE MAP. A bundle is never a special case:
   it grants each module it contains (FRD 6.1.2 — "a bundle
   purchase entitles the learner to every module the bundle
   contains, each reachable individually"), and every downstream
   surface then recomputes on its own. Nothing is hard-coded to a
   particular offering, and no My Learning row exists independently
   of an access record.

   ALL PEOPLE, IDENTIFIERS, CONTENT, SUMMARIES, DATES, REFERENCES
   AND MONETARY AMOUNTS ARE SAMPLE DESIGN DATA. No commercial
   model, price, currency treatment, payment provider, tax rule or
   authentication provider is asserted by this prototype — every
   one of those is open or pending in the source. See
   ../04_CHECKOUT_AND_ENTITLEMENT_MODEL.md.
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- icons (inline SVG, 24 viewBox — Batch-01 set + Batch-04 additions) ---------------- */
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
    compass: '<circle cx="12" cy="12" r="8.5"/><polygon points="15.6 8.4 13.6 13.6 8.4 15.6 10.4 10.4"/>',
    boxes: '<path d="M3.6 7.6 12 3.6l8.4 4v8.8L12 20.4l-8.4-4z"/><path d="M3.6 7.6 12 11.6l8.4-4"/><path d="M12 11.6v8.8"/>',
    cube: '<path d="M12 3.2 20 7.4v9.2L12 20.8 4 16.6V7.4z"/><path d="M4 7.4 12 11.6l8-4.2"/><path d="M12 11.6v9.2"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><polyline points="12 7.5 12 12 15.5 14"/>',
    headset: '<path d="M3.5 11.5a8.5 8.5 0 0 1 17 0"/><rect x="2.5" y="11.5" width="4.5" height="7" rx="1.6"/><rect x="17" y="11.5" width="4.5" height="7" rx="1.6"/>',
    monitor: '<rect x="3" y="4.5" width="18" height="12.5" rx="1.5"/><line x1="9" y1="20.5" x2="15" y2="20.5"/><line x1="12" y1="17" x2="12" y2="20.5"/>',
    phone: '<rect x="6.5" y="2.8" width="11" height="18.4" rx="2"/><line x1="10.6" y1="18.4" x2="13.4" y2="18.4"/>',
    book: '<path d="M4.5 4.5h6.5a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4.5z"/><path d="M19.5 4.5H13"/><path d="M19.5 4.5v13H13"/>',
    file: '<path d="M6 3h8l4 4v14H6z"/><polyline points="13.5 3.5 13.5 7.5 17.5 7.5"/>',
    video: '<rect x="2.8" y="6" width="12.4" height="12" rx="2"/><polygon points="15.2 10.4 21.2 7.4 21.2 16.6 15.2 13.6"/>',
    clipboard: '<path d="M9 4.5H7a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V6A1.5 1.5 0 0 0 17 4.5h-2"/><rect x="9" y="2.8" width="6" height="3.4" rx="1"/>',
    play: '<path d="M8 5.5v13l10-6.5z"/>',
    activity: '<polyline points="3 12.5 7.5 12.5 10 6 14 18.5 16.5 12.5 21 12.5"/>',
    shield: '<path d="M12 3 5 5.8v5.4c0 4.5 3 7.9 7 9.3 4-1.4 7-4.8 7-9.3V5.8z"/>',
    lock: '<rect x="4.8" y="10.4" width="14.4" height="10.2" rx="2"/><path d="M8.2 10.4V7.8a3.8 3.8 0 0 1 7.6 0v2.6"/>',
    card: '<rect x="2.8" y="5.4" width="18.4" height="13.2" rx="2"/><line x1="2.8" y1="9.8" x2="21.2" y2="9.8"/><line x1="6.4" y1="14.6" x2="10" y2="14.6"/>',
    bank: '<path d="M3.4 9.6 12 4.4l8.6 5.2"/><line x1="5.4" y1="11.4" x2="5.4" y2="17.4"/><line x1="9.8" y1="11.4" x2="9.8" y2="17.4"/><line x1="14.2" y1="11.4" x2="14.2" y2="17.4"/><line x1="18.6" y1="11.4" x2="18.6" y2="17.4"/><line x1="3" y1="19.8" x2="21" y2="19.8"/>',
    wallet: '<path d="M3.4 7.4a2 2 0 0 1 2-2h11.2a2 2 0 0 1 2 2v.8"/><rect x="3.4" y="7.4" width="17.2" height="11.6" rx="2"/><circle cx="16.6" cy="13.2" r="1.2"/>',
    chevD: '<polyline points="6.5 9.5 12 15 17.5 9.5"/>',
    chevR: '<polyline points="9.5 6.5 15 12 9.5 17.5"/>',
    arrR: '<line x1="4" y1="12" x2="19" y2="12"/><polyline points="13.5 6.5 19 12 13.5 17.5"/>',
    arrL: '<line x1="20" y1="12" x2="5" y2="12"/><polyline points="10.5 6.5 5 12 10.5 17.5"/>',
    arrD: '<line x1="12" y1="4" x2="12" y2="19"/><polyline points="6.5 13.5 12 19 17.5 13.5"/>',
    receipt: '<path d="M5.5 3.4h13v17.2l-2.2-1.4-2.2 1.4-2.1-1.4-2.2 1.4-2.1-1.4-2.2 1.4z"/><line x1="8.6" y1="8.4" x2="15.4" y2="8.4"/><line x1="8.6" y1="12.2" x2="15.4" y2="12.2"/>',
    signout: '<path d="M14.5 4.5H6a1.5 1.5 0 0 0-1.5 1.5v12A1.5 1.5 0 0 0 6 19.5h8.5"/><polyline points="15.5 8.5 19.5 12 15.5 15.5"/><line x1="19.5" y1="12" x2="9.5" y2="12"/>',
    settings: '<circle cx="12" cy="12" r="3.1"/><path d="M12 3.4v2.4M12 18.2v2.4M3.4 12h2.4M18.2 12h2.4M5.9 5.9l1.7 1.7M16.4 16.4l1.7 1.7M18.1 5.9l-1.7 1.7M7.6 16.4l-1.7 1.7"/>'
  };
  function ic(name, cls) {
    return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (PATHS[name] || '') + '</svg>';
  }

  /* ============================================================
     SAMPLE DATA & PROTOTYPE STATE

     Content names, formats and device lines are carried over from the
     Batch-01 and Batch-03 sample set unchanged, so the same experiment
     reads as the same experiment across the whole platform design.

     What this object graph deliberately does NOT contain, because no
     source establishes it: any recurring term, plan, tier, membership,
     renewal date, expiry, cancellation, refund, coupon, discount, tax
     line, invoice, saved instrument, billing address, seat, or named
     payment/authentication provider.
     ============================================================ */
  var STORAGE_KEY = 'xrslp-batch04-proto-v1';

  /* A fixed sample "today". Real clock time is deliberately not read: the
     prototype must render identically on every run so QA captures are
     comparable and a reviewer never sees a date drift between screens. */
  var TODAY = '27 Aug 2026';

  function initialState() {
    return {
      /* ---- the signed-in individual learner ----
         Personal account, no institution: FRD 1.3.2 places the individual
         learner in a separate data environment, and Divergence 2 in
         06_B2B_B2C_JOURNEYS.md removes the institution label from the
         header in this context. */
      learner: {
        name: 'Aditya Rao', initials: 'AR',
        email: 'aditya.rao@sample-learner.example',
        signedIn: true
      },

      /* ---- individual learning items ("modules": FRD 3.1.1 — one module is
             exactly one XR simulation; 3.1.2 — optional resources and
             assessment). Formats and device lines follow FRD 1.2.1–1.2.4. ---- */
      modules: {
        c_shear:   { id: 'c_shear',   name: 'Soil Mechanics — Direct Shear Test',              disc: 'Civil Engineering',      fmt: 'VR',  pdfs: 2, videos: 1, assessment: true,  summary: 'Run a direct shear test on a soil specimen, apply normal loads and read the shear-strength envelope from your own results.' },
        c_consol:  { id: 'c_consol',  name: 'Geotechnical — Consolidation Test',               disc: 'Civil Engineering',      fmt: 'VR',  pdfs: 2, videos: 1, assessment: true,  summary: 'Load a soil sample in an oedometer, record settlement against time and derive the compression characteristics.' },
        c_survey:  { id: 'c_survey',  name: 'Surveying — Total Station Basics',                disc: 'Civil Engineering',      fmt: 'Web', pdfs: 1, videos: 2, assessment: true,  summary: 'Set up and level a total station, take angle and distance observations, and close a simple traverse.' },
        c_bern:    { id: 'c_bern',    name: 'Fluid Mechanics — Bernoulli Flow Visualisation',  disc: 'Civil Engineering',      fmt: 'Web', pdfs: 1, videos: 1, assessment: true,  summary: 'Vary flow through a converging–diverging duct and see pressure and velocity head trade off along the section.' },
        c_beam:    { id: 'c_beam',    name: 'Structural Analysis — Beam Deflection',           disc: 'Civil Engineering',      fmt: 'Web', pdfs: 2, videos: 0, assessment: true,  summary: 'Load simply-supported and cantilever beams, measure deflection at each station and compare it with theory.' },
        c_torsion: { id: 'c_torsion', name: 'Strength of Materials — Torsion Test',            disc: 'Mechanical Engineering', fmt: 'MR',  pdfs: 1, videos: 1, assessment: true,  summary: 'Twist a specimen to failure, follow the torque–angle curve and read the modulus of rigidity from it.' },
        c_heat:    { id: 'c_heat',    name: 'Thermodynamics — Heat Exchanger Analysis',        disc: 'Mechanical Engineering', fmt: 'VR',  pdfs: 2, videos: 1, assessment: true,  summary: 'Operate a shell-and-tube exchanger in parallel and counter flow and work out its effectiveness from your readings.' },
        c_gear:    { id: 'c_gear',    name: 'Machine Design — Gear Train Assembly',            disc: 'Mechanical Engineering', fmt: 'AR',  pdfs: 1, videos: 1, assessment: false, summary: 'Assemble a compound gear train on your own desk and check the speed ratio you predicted against the one you get.' },
        c_circuit: { id: 'c_circuit', name: 'Electrical Machines — Induction Motor Test',      disc: 'Electrical Engineering', fmt: 'Web', pdfs: 2, videos: 1, assessment: true,  summary: 'Run no-load and blocked-rotor tests on a three-phase induction motor and build its equivalent circuit.' }
      },

      /* ---- catalogue offerings ----
         The two purchasable product types the source establishes, and only
         those two: an individual module (FRD 6.1.1) and a bundle of modules
         (FRD 6.1.2). A COURSE IS NOT AN OFFERING — direct course purchase is
         NOT-SPECIFIED / PRODUCT-PENDING (`QP-28`, D-21), so no course record,
         course price or course action exists anywhere in this prototype.

         `amount` is SAMPLE DESIGN DATA. No source specifies price, currency
         or price presentation (FRD 9.1.2 is PRODUCT-PENDING on exactly that).

         EACH BUNDLE AMOUNT IS EXACTLY THE SUM OF ITS COMPONENT MODULE AMOUNTS.
         That is deliberate. A bundle priced below the sum of its parts implies a
         discount rule, and no bundle pricing policy exists: bundle creation
         (6.3.1) and pricing configuration (6.3.2) are PHASE 2, and who sets
         Phase-1 bundle prices is a PENDING DECISION recorded against 6.1.2.
         Summing avoids asserting any pricing formula in either direction —
         it is arithmetic, not a policy. Bundle pricing logic = PRODUCT-PENDING. */
      offerings: {
        o_shear:   { id: 'o_shear',   kind: 'module', module: 'c_shear',   amount: 2400 },
        o_consol:  { id: 'o_consol',  kind: 'module', module: 'c_consol',  amount: 2400 },
        o_survey:  { id: 'o_survey',  kind: 'module', module: 'c_survey',  amount: 1800 },
        o_bern:    { id: 'o_bern',    kind: 'module', module: 'c_bern',    amount: 1800 },
        o_beam:    { id: 'o_beam',    kind: 'module', module: 'c_beam',    amount: 1800 },
        o_torsion: { id: 'o_torsion', kind: 'module', module: 'c_torsion', amount: 2600 },
        o_heat:    { id: 'o_heat',    kind: 'module', module: 'c_heat',    amount: 2400 },
        o_gear:    { id: 'o_gear',    kind: 'module', module: 'c_gear',    amount: 2200 },
        o_circuit: { id: 'o_circuit', kind: 'module', module: 'c_circuit', amount: 1800 },

        o_bgeo: {
          id: 'o_bgeo', kind: 'bundle', amount: 6000,   /* = 2400 + 1800 + 1800 */
          name: 'Geotechnical Engineering Bundle', disc: 'Civil Engineering',
          modules: ['c_consol', 'c_survey', 'c_beam'],
          summary: 'Three civil-engineering experiments taken together — consolidation, surveying and beam deflection.'
        },
        o_bmech: {
          id: 'o_bmech', kind: 'bundle', amount: 7200,  /* = 2600 + 2400 + 2200 */
          name: 'Mechanical Engineering Bundle', disc: 'Mechanical Engineering',
          modules: ['c_torsion', 'c_heat', 'c_gear'],
          summary: 'Three mechanical-engineering experiments taken together — torsion, heat transfer and machine design.'
        }
      },
      offeringOrder: [
        'o_bgeo', 'o_shear', 'o_consol', 'o_survey', 'o_bern', 'o_beam',
        'o_bmech', 'o_torsion', 'o_heat', 'o_gear', 'o_circuit'
      ],

      /* ---- THE ACCESS SPINE ----
         moduleId -> { via: <offering that created it>, on, ref }.
         Seed: this learner already has one experiment, so the
         already-have-access path is reachable from the first screen.
         Everything else in the catalogue is available to get access to. */
      access: {
        c_shear: { via: 'o_shear', on: '12 Aug 2026', ref: 'ACC-2026-0114' }
      },

      /* ---- what the learner has done ----
         A plain record of access created against this account. It is NOT a
         receipt or an invoice: what a B2C buyer receives is undefined in the
         source (9.3.1 GST invoicing is Phase 2 and institution-facing), so no
         document, download or invoice number is offered. */
      history: [
        { ref: 'ACC-2026-0114', offering: 'o_shear', on: '12 Aug 2026', amount: 2400, granted: ['c_shear'] }
      ],
      seq: 115,

      /* ---- transaction in flight ----
         null, or { offering, simulate, stage, ref, granted }. No payment
         method is held, because none is offered — see the note at B2C-04.
         stage: 'checkout' | 'processing' | 'success' | 'failed' | 'pending' */
      tx: null,

      /* ---- catalogue discovery controls ---- */
      filters: { q: '', disc: 'all', fmt: 'all', kind: 'all' }
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
      /* `access` and `history` are REPLACED wholesale rather than deep-merged:
         a seed that means "this learner has nothing" must be able to empty them. */
      if (patch.access) { S.access = patch.access; delete patch.access; }
      if (patch.history) { S.history = patch.history; delete patch.history; }
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
    toast('Demo reset — the original sample access has been restored.', 'info');
    if ((location.hash || '').indexOf('#/explore') !== 0) { location.hash = '#/explore'; }
    else { render(); }
  }

  /* ============================================================
     DERIVED MODEL
     One computation over S.access serves every screen. Nothing below
     is stored; it is all recomputed on each render, which is why a
     single grant updates the catalogue, the detail screens and
     My Learning at once without any of them being told to.
     ============================================================ */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function plural(n, one, many) { return n === 1 ? one : many; }

  function hasAccess(mid) { return !!S.access[mid]; }
  /* every module an offering would grant — one module, or a bundle's contents */
  function offeringModules(o) { return o.kind === 'bundle' ? o.modules.slice() : [o.module]; }
  function offeringName(o) { return o.kind === 'bundle' ? o.name : S.modules[o.module].name; }
  function offeringDisc(o) { return o.kind === 'bundle' ? o.disc : S.modules[o.module].disc; }
  function offeringSummary(o) { return o.kind === 'bundle' ? o.summary : S.modules[o.module].summary; }
  /* the delivery formats a learner would need for this offering, de-duplicated */
  function offeringFormats(o) {
    var seen = {}, out = [];
    offeringModules(o).forEach(function (mid) {
      var f = S.modules[mid].fmt;
      if (!seen[f]) { seen[f] = 1; out.push(f); }
    });
    return out;
  }

  /* THE ACCESS STATE OF AN OFFERING — 'none' | 'some' | 'all'.
     'some' can only arise for a bundle whose contents the learner has
     partly reached by another route; it is reported factually and no
     price consequence is claimed for it (see OQ-B4-03). */
  function offeringAccess(o) {
    var mods = offeringModules(o);
    var have = mods.filter(hasAccess);
    return {
      state: have.length === 0 ? 'none' : (have.length === mods.length ? 'all' : 'some'),
      have: have.length, total: mods.length,
      missing: mods.filter(function (m) { return !hasAccess(m); })
    };
  }
  /* what a learner would newly reach by getting access to this offering */
  function newModules(o) { return offeringModules(o).filter(function (m) { return !hasAccess(m); }); }

  /* every module the learner can reach, in catalogue order for stability */
  function myModules() {
    var order = [];
    S.offeringOrder.forEach(function (oid) {
      offeringModules(S.offerings[oid]).forEach(function (mid) {
        if (hasAccess(mid) && order.indexOf(mid) === -1) order.push(mid);
      });
    });
    return order;
  }
  /* how the learner came to have this module, in learner-facing words */
  function accessOrigin(mid) {
    var a = S.access[mid];
    if (!a) return null;
    var o = S.offerings[a.via];
    if (!o) return { line: 'Added to your learning on ' + a.on, on: a.on };
    if (o.kind === 'bundle') return { line: 'From ' + offeringName(o) + ' · ' + a.on, on: a.on, href: '#/bundle/' + o.id };
    return { line: 'Added on ' + a.on, on: a.on, href: '#/module/' + o.id };
  }

  /* the catalogue after search + filters */
  function filtered() {
    var f = S.filters, q = f.q.trim().toLowerCase();
    return S.offeringOrder.filter(function (oid) {
      var o = S.offerings[oid];
      if (f.kind !== 'all' && o.kind !== f.kind) return false;
      if (f.disc !== 'all' && offeringDisc(o) !== f.disc) return false;
      if (f.fmt !== 'all' && offeringFormats(o).indexOf(f.fmt) === -1) return false;
      if (q) {
        var hay = (offeringName(o) + ' ' + offeringDisc(o) + ' ' + offeringSummary(o) + ' ' +
          offeringModules(o).map(function (m) { return S.modules[m].name; }).join(' ')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }
  function filtersActive() {
    var f = S.filters;
    return !!(f.q.trim() || f.disc !== 'all' || f.fmt !== 'all' || f.kind !== 'all');
  }
  function disciplines() {
    var seen = {}, out = [];
    S.offeringOrder.forEach(function (oid) {
      var d = offeringDisc(S.offerings[oid]);
      if (!seen[d]) { seen[d] = 1; out.push(d); }
    });
    return out.sort();
  }

  /* ---------------- presentation helpers ---------------- */
  var DEVICE_LINE = {
    /* FRD 1.2.1–1.2.4. Device names are FRD examples, shown as examples and
       never as a promise: the delivery mechanism itself is deliberately
       unselected (PM-05 · QT-01). */
    Web: 'Runs in a web browser — no XR hardware needed',
    VR: 'VR headset required — e.g. Meta Quest',
    MR: 'MR device required — e.g. Ajna Lens',
    AR: 'Android or iOS mobile device required'
  };
  var DEVICE_SHORT = { Web: 'Web browser', VR: 'VR headset', MR: 'MR device', AR: 'Mobile AR' };
  function deviceIcon(f) { return f === 'Web' ? 'monitor' : f === 'AR' ? 'phone' : 'headset'; }
  function fmtBadge(f) { return '<span class="fmt fmt-' + f.toLowerCase() + '">' + esc(f) + '</span>'; }
  function fmtBadges(list) { return list.map(fmtBadge).join(' '); }
  function badge(cls, icon, label) { return '<span class="badge ' + cls + '">' + (icon ? ic(icon, 'sm') : '') + esc(label) + '</span>'; }
  function sampleTag(txt) { return '<span class="sample-tag">' + esc(txt || 'SAMPLE DESIGN DATA') + '</span>'; }

  /* Monetary presentation. The amount is sample design data and the currency
     treatment is PRODUCT-PENDING in the source (FRD 9.1.2) — so the figure is
     rendered plainly, with no tax line, no strike-through, no saving, no
     instalment and no recurrence anywhere near it. */
  function money(n) { return '₹' + n.toLocaleString('en-IN'); }

  /* the learner-facing access state of an offering — words first, never colour alone */
  function accessBadge(o) {
    var a = offeringAccess(o);
    if (a.state === 'all') return badge('b-success', 'check', 'You have access');
    if (a.state === 'some') return badge('b-info', 'info', a.have + ' of ' + a.total + ' already yours');
    return badge('b-outline', null, 'Available to get access');
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

     The individual-learner primary navigation is the one confirmed in
     04_PLATFORM_INFORMATION_ARCHITECTURE.md: Home · My Learning ·
     Explore · Progress, with Account. Explore is present because this
     is the individual context; the institutional learner does not have
     it (Divergence 1). There is NO institution chip in the header here
     (Divergence 2, FRD 1.3.2) and no cart control anywhere.
     ============================================================ */
  var NAV = [
    { href: '#/home', key: 'home', label: 'Home', icon: 'home' },
    { href: '#/my-learning', key: 'my-learning', label: 'My Learning', icon: 'book' },
    { href: '#/explore', key: 'explore', label: 'Explore', icon: 'compass' },
    { href: '#/progress', key: 'progress', label: 'Progress', icon: 'activity' }
  ];

  function protobar(active) {
    var links = [
      { href: '#/index', label: 'Index', key: 'index' },
      { href: '#/explore', label: 'Explore', key: 'explore' },
      { href: '#/my-learning', label: 'My Learning', key: 'my-learning' },
      { href: '#/history', label: 'Access history', key: 'history' }
    ];
    return '<div class="protobar" role="navigation" aria-label="Prototype navigation — not product UI">' +
      '<span class="plabel">PROTOTYPE NAVIGATION — NOT PRODUCT UI · BATCH 04</span>' +
      '<nav>' + links.map(function (l) {
        return '<a href="' + l.href + '"' + (active === l.key ? ' aria-current="true"' : '') + '>' + esc(l.label) + '</a>';
      }).join('') + '</nav>' +
      '<div class="pright"><span class="plabel" style="letter-spacing:.04em">SAMPLE DESIGN DATA — AMOUNTS INCLUDED</span>' +
      '<button type="button" id="proto-reset">Reset demo</button></div></div>';
  }

  function shell(activeKey, crumbHTML, contentHTML) {
    var L = S.learner;
    var nav = NAV.map(function (n) {
      var cur = n.key === activeKey;
      return '<a class="nitem" href="' + n.href + '"' + (cur ? ' aria-current="page"' : '') + '>' +
        ic(n.icon) + '<span>' + esc(n.label) + '</span></a>';
    }).join('');

    /* Account control. Signed out, it becomes a plain sign-in action rather
       than a menu — the individual learner's account menu has nothing in it
       until there is an account. */
    var account = L.signedIn
      ? '<button class="account" type="button" id="acct-btn" aria-haspopup="true" aria-expanded="false" aria-controls="acct-menu">' +
        '<span class="av" aria-hidden="true">' + esc(L.initials) + '</span>' +
        '<span class="awho"><span class="aname">' + esc(L.name) + '</span><br><span class="arole">Learner</span></span>' +
        ic('chevD', 'sm') + '</button>' +
        '<div class="acctmenu" id="acct-menu" role="menu" aria-label="Account" hidden>' +
        '<a role="menuitem" href="#/history">' + ic('receipt', 'sm') + 'Access history</a>' +
        '<a role="menuitem" href="#/account" onclick="return false" aria-disabled="true">' + ic('user', 'sm') + 'Profile</a>' +
        '<a role="menuitem" href="#/help" onclick="return false" aria-disabled="true">' + ic('help', 'sm') + 'Help</a>' +
        '<button role="menuitem" type="button" id="acct-signout">' + ic('signout', 'sm') + 'Sign out</button>' +
        '</div>'
      : '<a class="btn sm sec" href="#/sign-in">Sign in</a>';

    return protobar(activeKey === 'explore' || activeKey === 'my-learning' || activeKey === 'history' ? activeKey : null) +
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
      '<div class="acctwrap">' + account + '</div>' +
      '</header>' +
      '<div class="frame">' +
      '<nav class="snav" aria-label="Learner navigation">' +
      '<div class="ws-ctx"><div class="wsk">Learner</div><div class="wsv">Individual account</div></div>' +
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
  function protoNote(bodyHTML, tagText) {
    /* The body is a class, not an inline `flex:1`: an inline declaration outranks the
       stylesheet, which would stop the narrow-width rule from ever taking effect. */
    return '<div class="proto-note"><span class="pn-label">' + esc(tagText || 'PROTOTYPE CONTROL — NOT PRODUCT UI') + '</span><div class="pn-body">' + bodyHTML + '</div></div>';
  }
  function card(titleHTML, bodyHTML, noteHTML) {
    return '<section class="card">' + (titleHTML ? '<div class="chead"><h2>' + titleHTML + '</h2>' + (noteHTML ? '<span class="cnote">' + noteHTML + '</span>' : '') + '</div>' : '') +
      '<div class="cbody">' + bodyHTML + '</div></section>';
  }

  /* "what is included" — one component, three callers (module detail,
     bundle detail, access summary), so the promise reads identically wherever
     the learner meets it. */
  function inclRows(mids, opts) {
    opts = opts || {};
    return '<div class="incl">' + mids.map(function (mid) {
      var m = S.modules[mid], have = hasAccess(mid);
      var side = '';
      if (opts.showAccess) {
        side = have
          ? badge('b-success', 'check', 'Already yours')
          : (opts.offerIndividually
              /* Only shown when the bundle itself cannot be completed (overlap),
                 so the learner has a confirmed route: individual module purchase
                 (FRD 6.1.1). The amount is the module's own — nothing is derived
                 from the bundle, and no bundle pricing rule is implied. */
              ? '<a class="btn sm sec" href="#/module/' + esc(moduleOffering(mid)) + '">Get this one · ' +
                esc(money(S.offerings[moduleOffering(mid)].amount)) + '</a>'
              : (opts.newLabel ? badge('b-outline', null, opts.newLabel) : ''));
      }
      var title = opts.link
        ? '<a href="#/module/' + esc(moduleOffering(mid)) + '">' + esc(m.name) + '</a>'
        : esc(m.name);
      return '<div class="incl-row' + (have && opts.showAccess ? ' have' : '') + '">' +
        '<span class="ir-node">' + ic(deviceIcon(m.fmt)) + '</span>' +
        '<div class="ir-body"><div class="ir-t">' + title + '</div>' +
        '<div class="ir-d">' + fmtBadge(m.fmt) + '<span>' + esc(DEVICE_LINE[m.fmt]) + '</span></div></div>' +
        (side ? '<div class="ir-side">' + side + '</div>' : '') +
        '</div>';
    }).join('') + (opts.foot ? '<div class="incl-foot">' + opts.foot + '</div>' : '') + '</div>';
  }
  /* the module-offering that sells a given module, for cross-linking */
  function moduleOffering(mid) {
    for (var i = 0; i < S.offeringOrder.length; i++) {
      var o = S.offerings[S.offeringOrder[i]];
      if (o.kind === 'module' && o.module === mid) return o.id;
    }
    return '';
  }

  /* ============================================================
     B2C-01 · EXPLORE — THE CATALOGUE
     What can I learn, what does it run on, what do I already have,
     and what can I get access to. Four controls, no more.
     ============================================================ */
  function catCard(o) {
    var a = offeringAccess(o), mods = offeringModules(o);
    var isBundle = o.kind === 'bundle';
    var href = (isBundle ? '#/bundle/' : '#/module/') + o.id;
    var act;
    if (a.state === 'all') {
      act = '<a class="btn sm sec" href="#/my-learning">Go to My Learning</a>';
    } else {
      act = '<a class="btn sm pri" href="' + href + '">View details</a>';
    }
    return '<article class="catcard' + (a.state === 'all' ? ' owned' : '') + '">' +
      /* The kind chip carries only the word, so a bundle's top row is the same
         width as a module's and never wraps beside the access badge — the module
         count moves down to the facts row instead, where it sits with the other
         decision facts. No information is lost. */
      '<div class="cc-top">' +
      '<span class="cc-kind' + (isBundle ? ' bundle' : '') + '">' + ic(isBundle ? 'boxes' : 'cube', 'sm') +
      (isBundle ? 'Bundle' : 'Module') + '</span>' +
      accessBadge(o) + '</div>' +
      /* Title and discipline share one fixed-height block, so the discipline always
         sits directly under the title and the slack from a one-line title falls
         below the pair rather than between them. */
      '<div class="cc-head"><h3><a href="' + href + '">' + esc(offeringName(o)) + '</a></h3>' +
      '<div class="cc-disc">' + esc(offeringDisc(o)) + '</div></div>' +
      '<p class="cc-sum">' + esc(offeringSummary(o)) + '</p>' +
      '<div class="cc-meta">' +
      (isBundle ? '<span class="cc-count">' + ic('cube', 'sm') + mods.length + ' modules</span>' : '') +
      fmtBadges(offeringFormats(o)) + '</div>' +
      '<div class="cc-foot">' +
      /* A partly-held bundle shows NO amount: it is not offered as a single
         purchase, because bundle-overlap pricing is undecided (Q-45). */
      /* "In your learning" rather than the longer phrase used on the detail panel
         and in My Learning: at 1280 the fuller wording wrapped the footer onto a
         second line, leaving this card's footer 23px out of step with every other
         card in its row. The meaning is unchanged, and the card's top badge
         already reads "You have access". */
      (a.state === 'all'
        ? '<span class="cc-amt cc-state ok">In your learning</span>'
        : a.state === 'some'
          ? '<span class="cc-amt cc-state">Partly in your learning</span>'
          : '<span class="cc-amt">' + money(o.amount) + '<span class="cc-amt-note">SAMPLE AMOUNT</span></span>') +
      '<span class="cc-act">' + act + '</span>' +
      '</div></article>';
  }

  function viewCatalogue() {
    var f = S.filters, list = filtered();
    var discOpts = ['all'].concat(disciplines()).map(function (d) {
      return '<option value="' + esc(d) + '"' + (f.disc === d ? ' selected' : '') + '>' + esc(d === 'all' ? 'All disciplines' : d) + '</option>';
    }).join('');
    var fmtOpts = [['all', 'All delivery types'], ['Web', 'Web browser'], ['VR', 'VR headset'], ['MR', 'MR device'], ['AR', 'Mobile AR']].map(function (p) {
      return '<option value="' + p[0] + '"' + (f.fmt === p[0] ? ' selected' : '') + '>' + esc(p[1]) + '</option>';
    }).join('');
    var kindOpts = [['all', 'Modules and bundles'], ['module', 'Modules only'], ['bundle', 'Bundles only']].map(function (p) {
      return '<option value="' + p[0] + '"' + (f.kind === p[0] ? ' selected' : '') + '>' + esc(p[1]) + '</option>';
    }).join('');

    var pills = [];
    if (f.q.trim()) pills.push(['q', 'Search: ' + f.q.trim()]);
    if (f.disc !== 'all') pills.push(['disc', f.disc]);
    if (f.fmt !== 'all') pills.push(['fmt', DEVICE_SHORT[f.fmt] || f.fmt]);
    if (f.kind !== 'all') pills.push(['kind', f.kind === 'module' ? 'Modules only' : 'Bundles only']);

    var bar =
      '<div class="filterbar">' +
      '<div class="fb-row">' +
      '<div class="fb-search"><label for="cat-q">Search the catalogue</label>' +
      '<div class="searchbox">' + ic('search') +
      '<input type="text" id="cat-q" value="' + esc(f.q) + '" placeholder="Try “soil”, “surveying” or “heat”" autocomplete="off"></div></div>' +
      '<div class="fb-sel"><label for="cat-disc">Discipline</label><select id="cat-disc">' + discOpts + '</select></div>' +
      '<div class="fb-sel"><label for="cat-fmt">Delivery type</label><select id="cat-fmt">' + fmtOpts + '</select></div>' +
      '<div class="fb-sel"><label for="cat-kind">Type</label><select id="cat-kind">' + kindOpts + '</select></div>' +
      '</div>' +
      /* Clear filters sits with the active-filter pills rather than in the control
         row: the four controls then fit one line at 1280 instead of dropping it to
         a second, and the two affordances that both concern active filters are
         together, in a footer row that was otherwise mostly empty. */
      '<div class="fb-foot">' +
      '<span class="fb-count" id="cat-count"><strong>' + list.length + '</strong> ' + plural(list.length, 'item', 'items') +
      (filtersActive() ? ' of ' + S.offeringOrder.length : '') + '</span>' +
      '<span class="fb-active">' +
      (pills.length ? '<span class="fb-pills">' + pills.map(function (p) {
        return '<span class="fpill">' + esc(p[1]) +
          '<button type="button" data-clear="' + p[0] + '" aria-label="Remove filter: ' + esc(p[1]) + '">' + ic('x', 'sm') + '</button></span>';
      }).join('') + '</span>' : '') +
      '<button class="btn sec sm" type="button" id="cat-reset"' + (filtersActive() ? '' : ' disabled') + '>Clear filters</button>' +
      '</span></div></div>';

    var body = list.length
      ? '<div class="catgrid">' + list.map(function (oid) { return catCard(S.offerings[oid]); }).join('') + '</div>'
      : '<div class="tablecard">' + emptyState('search', 'No matching learning content',
        'Nothing in the catalogue matches this search and these filters. Try a broader search term, or clear the filters to see everything again.',
        '<button class="btn pri" type="button" id="cat-reset-2">Clear filters</button>') + '</div>';

    var mine = myModules().length;
    return shell('explore', '',
      phead('Explore', 'Published XR experiments you can add to your learning. ' +
        '<span class="sample-tag">SAMPLE DESIGN DATA</span>') +
      (mine ? '<div class="alert info" style="margin-bottom:20px">' + ic('check') +
        '<div><div class="at">You already have ' + mine + ' ' + plural(mine, 'experiment', 'experiments') + '</div>' +
        'Anything already included in your learning is marked below and opens from <a href="#/my-learning">My Learning</a> rather than being offered again.</div></div>' : '') +
      bar +
      '<section id="cat-results" aria-live="polite" aria-labelledby="cat-results-h">' +
      '<h2 class="sr-only" id="cat-results-h">Learning content</h2>' + body + '</section>'
    );
  }

  function bindCatalogue() {
    var q = document.getElementById('cat-q');
    if (q) {
      q.addEventListener('input', function () { S.filters.q = q.value; save(); repaintCatalogue(true); });
    }
    ['disc', 'fmt', 'kind'].forEach(function (k) {
      var el = document.getElementById('cat-' + k);
      if (el) el.addEventListener('change', function () { S.filters[k] = el.value; save(); repaintCatalogue(false); });
    });
    [document.getElementById('cat-reset'), document.getElementById('cat-reset-2')].forEach(function (b) {
      if (b) b.addEventListener('click', function () {
        S.filters = { q: '', disc: 'all', fmt: 'all', kind: 'all' }; save();
        repaintCatalogue(false);
        announce('Filters cleared. Showing all ' + S.offeringOrder.length + ' items.');
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-clear]'), function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-clear');
        S.filters[k] = k === 'q' ? '' : 'all'; save();
        repaintCatalogue(false);
      });
    });
  }
  /* Re-render the catalogue in place. `keepFocus` preserves the caret while
     someone is still typing in the search field. */
  function repaintCatalogue(keepFocus) {
    var pos = null;
    if (keepFocus) {
      var el = document.getElementById('cat-q');
      if (el) pos = el.selectionStart;
    }
    render();
    if (keepFocus) {
      var el2 = document.getElementById('cat-q');
      if (el2) { el2.focus(); try { el2.setSelectionRange(pos, pos); } catch (e) { /* not supported */ } }
    }
    var n = filtered().length;
    announce(n + ' ' + plural(n, 'item', 'items') + ' ' + plural(n, 'matches', 'match') + ' your search and filters.');
  }

  /* ============================================================
     B2C-02 · MODULE DETAIL
     What this is, what is in it, what it runs on, and whether the
     learner already has it. No assessment settings, no certificate,
     no course, no duration promise.
     ============================================================ */
  function componentRows(m) {
    var rows = [];
    rows.push({ ic: 'play', t: 'One XR simulation', d: m.name.split(' — ')[1] || m.name, note: DEVICE_LINE[m.fmt] });
    if (m.pdfs) rows.push({ ic: 'file', t: m.pdfs + ' ' + plural(m.pdfs, 'reading', 'readings'), d: 'Reference material to work through before or alongside the experiment.' });
    if (m.videos) rows.push({ ic: 'video', t: m.videos + ' ' + plural(m.videos, 'video', 'videos'), d: 'Walkthrough of the apparatus and the procedure.' });
    if (m.assessment) rows.push({ ic: 'clipboard', t: 'An assessment', d: 'A set of questions to check what you took from the experiment.' });
    return '<div class="incl">' + rows.map(function (r) {
      return '<div class="incl-row"><span class="ir-node">' + ic(r.ic) + '</span>' +
        '<div class="ir-body"><div class="ir-t">' + esc(r.t) + '</div>' +
        '<div class="ir-d"><span>' + esc(r.d) + '</span></div>' +
        (r.note ? '<div class="ir-d" style="margin-top:4px">' + fmtBadge(m.fmt) + '<span>' + esc(r.note) + '</span></div>' : '') +
        '</div></div>';
    }).join('') + '</div>';
  }

  /* The access-decision panel. This is the ONLY place on a detail screen
     where an amount and a primary access action appear — and when the
     learner already has access it shows neither. */
  function accessPanel(o) {
    var a = offeringAccess(o);
    if (a.state === 'all') {
      var mids = offeringModules(o);
      var org = accessOrigin(mids[0]);
      return '<aside class="accesspanel have" aria-labelledby="ap-h">' +
        '<div class="ap-state" id="ap-h"><span class="ap-node">' + ic('check') + '</span>' +
        (o.kind === 'bundle' ? 'You have all of this' : 'You have access') + '</div>' +
        '<p class="ap-note" style="margin-bottom:14px">' +
        (o.kind === 'bundle'
          ? 'Every module in this bundle is already included in your learning.'
          : 'This experiment is already included in your learning' + (org ? ' — ' + esc(org.line.toLowerCase()) : '') + '.') +
        '</p>' +
        '<div class="ap-act"><a class="btn pri lg" href="#/my-learning">Go to My Learning</a></div>' +
        '<p class="ap-sub">There is nothing more to get for this ' + (o.kind === 'bundle' ? 'bundle' : 'experiment') + '. Open it from My Learning whenever you want to work on it.</p>' +
        '</aside>';
    }

    var gained = newModules(o);

    /* PARTLY-HELD BUNDLE — the overlap case (Q-45 / OQ-B4-01, OPEN).
       The learner already holds some of what this bundle contains. Every way of
       completing the transaction would assert a commercial rule that no source
       establishes: charging the full amount asserts "no credit for what you own",
       and charging anything less asserts a proration, discount or credit rule.

       So the bundle is not priced and cannot be completed here. The overlap is
       shown plainly, and the learner is offered the route that IS confirmed —
       getting the remaining modules individually (FRD 6.1.1). Nothing about
       bundle-overlap pricing is implied in either direction.
       DESIGN ASSUMPTION — REVERSIBLE. */
    if (a.state === 'some') {
      return '<aside class="accesspanel partial" aria-labelledby="ap-h">' +
        '<div class="ap-state" id="ap-h"><span class="ap-node">' + ic('info') + '</span>Partly yours already</div>' +
        '<p class="ap-note">Some content in this bundle is already in your learning — ' +
        a.have + ' of the ' + a.total + ' modules. ' +
        'You can add the remaining ' + gained.length + ' ' + plural(gained.length, 'module', 'modules') + ' individually below.</p>' +
        '<div class="ap-act">' +
        '<a class="btn pri lg" href="#/module/' + esc(moduleOffering(gained[0])) + '">' +
        (gained.length === 1 ? 'Open the one you don’t have' : 'Open the first you don’t have') + '</a>' +
        '<a class="btn gho" href="#/my-learning">Go to My Learning</a>' +
        '</div>' +
        '<p class="ap-sub">' + ic('info', 'sm') +
        ' No amount is shown for this bundle. How a bundle is priced when you already have part of it is not yet decided, ' +
        'so it isn’t offered as a single purchase here.</p>' +
        '</aside>';
    }

    return '<aside class="accesspanel" aria-labelledby="ap-h">' +
      '<div class="ap-state" id="ap-h"><span class="ap-node">' + ic('cube') + '</span>' +
      'Available to get access</div>' +
      '<div class="ap-amt-row"><span class="ap-amt">' + money(o.amount) + '</span>' + sampleTag('SAMPLE AMOUNT') + '</div>' +
      '<p class="ap-note">' +
      (o.kind === 'bundle'
        ? 'Adds all ' + a.total + ' modules in this bundle to your learning.'
        : 'Adds this experiment to your learning.') +
      '</p>' +
      '<div class="ap-act">' +
      '<a class="btn pri lg" href="' + (S.learner.signedIn ? '#/get-access/' + o.id : '#/sign-in/' + o.id) + '">Get access</a>' +
      '<a class="btn gho" href="#/explore">Back to Explore</a>' +
      '</div>' +
      '<p class="ap-sub">' + ic('shield', 'sm') + ' Access is added to your own account and appears in My Learning as soon as the payment succeeds.</p>' +
      '</aside>';
  }

  function viewModule(oid) {
    var o = S.offerings[oid];
    if (!o || o.kind !== 'module') return notFound();
    var m = S.modules[o.module], a = offeringAccess(o);

    var main =
      '<div class="ph-kicker">' +
      '<span class="cc-kind">' + ic('cube', 'sm') + 'Module</span>' +
      accessBadge(o) + fmtBadge(m.fmt) + '</div>' +
      '<h1>' + esc(m.name) + '</h1>' +
      '<p class="ph-lede">' + esc(m.summary) + '</p>' +
      '<div class="ph-facts">' +
      '<span class="ph-fact">' + ic('boxes') + '<span><strong>' + esc(m.disc) + '</strong></span></span>' +
      '<span class="ph-fact">' + ic(deviceIcon(m.fmt)) + '<span>' + esc(DEVICE_LINE[m.fmt]) + '</span></span>' +
      '</div>';

    var body =
      '<div class="phero">' +
      '<div class="ph-main">' + main + '</div>' +
      accessPanel(o) +
      '</div>' +
      card('What you get', componentRows(m),
        'One module is one XR simulation') +
      '<div style="height:20px"></div>' +
      card('What you need to run it',
        '<div class="alert info">' + ic(deviceIcon(m.fmt)) +
        '<div><div class="at">' + esc(DEVICE_SHORT[m.fmt]) + '</div>' + esc(DEVICE_LINE[m.fmt]) + '.' +
        (m.fmt === 'Web'
          ? ' You can start it from My Learning on the device you are reading this on.'
          : ' Once it is in your learning, the platform makes it available on your supported device.') +
        '</div></div>' +
        (m.fmt !== 'Web' ? '<p class="subtle-note" style="margin-top:12px">Device names are examples. How an experiment reaches a device is shown in the learner XR screens designed in Batch 01.</p>' : ''),
        null) +
      (a.state === 'all' ? '' :
        '<div style="height:20px"></div>' +
        card('Also available in a bundle', bundlesContaining(o.module), null));

    return shell('explore', crumbs([{ label: 'Explore', href: '#/explore' }, { label: m.name }]), body);
  }

  /* If a module also appears inside a bundle, say so plainly — it is a real
     decision the learner is entitled to make. No comparison, no saving claim. */
  function bundlesContaining(mid) {
    var found = S.offeringOrder.filter(function (oid) {
      var o = S.offerings[oid];
      return o.kind === 'bundle' && o.modules.indexOf(mid) !== -1;
    });
    if (!found.length) return '<p class="subtle-note">This experiment is not part of any bundle in the catalogue right now.</p>';
    return '<div class="incl">' + found.map(function (oid) {
      var o = S.offerings[oid], a = offeringAccess(o);
      return '<div class="incl-row' + (a.state === 'all' ? ' have' : '') + '"><span class="ir-node">' + ic('boxes') + '</span>' +
        '<div class="ir-body"><div class="ir-t"><a href="#/bundle/' + o.id + '">' + esc(o.name) + '</a></div>' +
        '<div class="ir-d"><span>' + o.modules.length + ' modules, including this one</span></div></div>' +
        '<div class="ir-side">' + (a.state === 'all'
          ? badge('b-success', 'check', 'You have access')
          : '<span class="cc-amt" style="font-size:14px">' + money(o.amount) + '</span>') + '</div></div>';
    }).join('') + '<div class="incl-foot">Amounts are sample design data. Nothing here is described as a saving or an offer — how bundles are priced is not settled.</div></div>';
  }

  /* ============================================================
     B2C-03 · BUNDLE DETAIL
     A bundle is exactly its contents. The list below is generated from
     the bundle record, so what is promised here and what arrives in
     My Learning cannot drift apart.
     ============================================================ */
  function viewBundle(oid) {
    var o = S.offerings[oid];
    if (!o || o.kind !== 'bundle') return notFound();
    var a = offeringAccess(o);
    var fmts = offeringFormats(o);
    var needsDevice = fmts.filter(function (f) { return f !== 'Web'; });

    var main =
      '<div class="ph-kicker">' +
      '<span class="cc-kind bundle">' + ic('boxes', 'sm') + 'Bundle · ' + o.modules.length + ' modules</span>' +
      accessBadge(o) + '</div>' +
      '<h1>' + esc(o.name) + '</h1>' +
      '<p class="ph-lede">' + esc(o.summary) + '</p>' +
      '<div class="ph-facts">' +
      '<span class="ph-fact">' + ic('boxes') + '<span><strong>' + esc(o.disc) + '</strong></span></span>' +
      '<span class="ph-fact">' + ic('cube') + '<span><strong>' + o.modules.length + '</strong> modules</span></span>' +
      '<span class="ph-fact">' + ic('monitor') + '<span>' + esc(fmts.map(function (f) { return DEVICE_SHORT[f]; }).join(' · ')) + '</span></span>' +
      '</div>';

    var body =
      '<div class="phero">' +
      '<div class="ph-main">' + main + '</div>' +
      accessPanel(o) +
      '</div>' +
      card('What is in this bundle',
        inclRows(o.modules, {
          showAccess: true, link: true, offerIndividually: a.state === 'some',
          foot: 'Each module stays a separate experiment with its own resources, simulation and assessment. ' +
            'You open them one at a time from My Learning, in whatever order you like.'
        }),
        o.modules.length + ' modules') +
      (a.state === 'some'
        ? '<div style="height:20px"></div>' +
          '<div class="alert info">' + ic('info') +
          '<div><div class="at">Some content in this bundle is already in your learning</div>' +
          'You have ' + a.have + ' of these ' + a.total + ' already, and what you have stays exactly as it is. ' +
          'How a bundle is priced when you already hold part of it has not been decided, so this bundle is not offered ' +
          'as a single purchase for you — the ' + a.missing.length + ' ' + plural(a.missing.length, 'module', 'modules') +
          ' you do not have ' + plural(a.missing.length, 'is', 'are') + ' available individually below.</div></div>'
        : '') +
      (needsDevice.length
        ? '<div style="height:20px"></div>' +
          card('What you need to run these',
            '<div class="incl">' + fmts.map(function (f) {
              var inFmt = o.modules.filter(function (m) { return S.modules[m].fmt === f; });
              return '<div class="incl-row"><span class="ir-node">' + ic(deviceIcon(f)) + '</span>' +
                '<div class="ir-body"><div class="ir-t">' + esc(DEVICE_SHORT[f]) + '</div>' +
                '<div class="ir-d">' + fmtBadge(f) + '<span>' + esc(DEVICE_LINE[f]) + ' — ' + inFmt.length + ' ' + plural(inFmt.length, 'module', 'modules') + '</span></div></div></div>';
            }).join('') + '</div>' +
            '<p class="subtle-note" style="margin-top:12px">Device names are examples. You do not need every device to start — each module runs on its own.</p>',
            null)
        : '');

    return shell('explore', crumbs([{ label: 'Explore', href: '#/explore' }, { label: o.name }]), body);
  }

  /* ============================================================
     B2C-04 · GET ACCESS — the access summary and payment step

     Answers exactly five things and nothing else: what you are getting,
     what is included, the amount, which account receives the access, and
     one primary action. There is NO cart, no coupon field, no tax line,
     no saved instrument, no billing address, no recurrence and no
     duration promise — none of those is established by any source.
     ============================================================ */
  /* NO PAYMENT-METHOD CHOICE IS OFFERED, because none is source-supported.
     A search across the whole v5 requirement set — Core, Team Lead and Detailed —
     returns ZERO occurrences of "payment method", "payment mode", "payment option",
     "payment instrument", card, netbanking, UPI, wallet or bank transfer. FRD 7.9
     states plainly: "No payment provider is selected, and no currency, tax, refund
     or invoice rule is invented by this draft," and the acceptance criterion for
     9.1.1 asks for exactly one thing — "a PROVIDER-NEUTRAL PAYMENT STEP whose
     success, decline and indeterminate outcomes are all designed."

     Constraint C-05 forbids inventing the gateway; Q-34 (which gateway, and what
     integration pattern) is OPEN. Redirect versus embedded is also undetermined,
     so neither is implied here either. The step below names no method, no
     instrument, no network and no provider, and collects nothing. */

  function viewCheckout(oid) {
    var o = S.offerings[oid];
    if (!o) return notFound();
    if (!S.learner.signedIn) { location.replace('#/sign-in/' + oid); return ''; }
    var a = offeringAccess(o);
    /* Guard: an offering the learner already fully has can never enter this
       screen — the duplicate-access path is closed at the route, not merely
       hidden on the card. */
    if (a.state === 'all') return alreadyHave(o);

    /* Guard: a bundle the learner already partly holds cannot be completed here.
       Any amount charged would assert a bundle-overlap pricing rule, and none is
       established (Q-45 / OQ-B4-01, OPEN). Closed at the route, so forcing the URL
       cannot reach a payment control either. */
    if (a.state === 'some') return partlyHeld(o);

    /* Returning to checkout starts a fresh attempt: the chosen simulation carries
       over as a convenience, but a finished stage never does, so a stale success
       or failure can never be re-read as a current one. */
    var tx = S.tx && S.tx.offering === oid ? S.tx : { offering: oid, simulate: 'success' };
    tx.stage = 'checkout'; delete tx.ref; delete tx.granted;
    S.tx = tx; save();

    var gained = newModules(o);
    var L = S.learner;

    var main =
      card('What you are getting',
        '<div class="incl"><div class="incl-row">' +
        '<span class="ir-node">' + ic(o.kind === 'bundle' ? 'boxes' : 'cube') + '</span>' +
        '<div class="ir-body"><div class="ir-t">' + esc(offeringName(o)) + '</div>' +
        '<div class="ir-d"><span>' + esc(offeringDisc(o)) + '</span>' +
        (o.kind === 'bundle' ? '<span>· ' + o.modules.length + ' modules</span>' : '') + '</div></div></div></div>' +
        /* The itemised list is only worth showing when it says something the line
           above does not — i.e. for a bundle. A single module would just repeat itself. */
        (o.kind === 'bundle'
          ? '<p class="minilabel" style="margin:18px 0 8px">' +
            (gained.length === 1 ? 'This adds 1 experiment to your learning' : 'This adds ' + gained.length + ' experiments to your learning') + '</p>' +
            inclRows(gained, { showAccess: false }) +
            (a.state === 'some'
              ? '<p class="subtle-note" style="margin-top:10px">' + ic('info', 'sm') + ' ' + a.have + ' of the ' + a.total +
                ' modules in this bundle are already yours and are not listed again.</p>'
              : '')
          : '<p class="subtle-note" style="margin-top:14px">' + fmtBadge(S.modules[o.module].fmt) + ' ' +
            esc(DEVICE_LINE[S.modules[o.module].fmt]) + '. This adds one experiment to your learning.</p>'),
        null) +

      '<div style="height:20px"></div>' +
      card('The account this is added to',
        '<div class="acctbox"><span class="ab-av" aria-hidden="true">' + esc(L.initials) + '</span>' +
        '<div><div class="ab-n">' + esc(L.name) + '</div><div class="ab-e">' + esc(L.email) + '</div></div></div>' +
        '<p class="subtle-note" style="margin-top:12px">Access is added to this account. It appears in My Learning as soon as the payment succeeds — you do not have to activate anything.</p>',
        null) +

      '<div style="height:20px"></div>' +
      card('Payment',
        '<div class="paystep">' +
        '<span class="ps-ic">' + ic('lock') + '</span>' +
        '<div class="ps-body"><div class="ps-t">Online payment</div>' +
        /* "taken through" would hint at a redirect; redirect-versus-embedded is
           itself undetermined (FRD 9.1.1), so the wording asserts neither. */
        '<div class="ps-d">This is completed through a secure payment step.</div></div>' +
        '</div>' +
        '<p class="subtle-note" style="margin-top:12px">' + ic('info', 'sm') +
        ' No payment provider, gateway, card network or payment method has been selected for the platform, ' +
        'so this step is deliberately neutral. Nothing is collected here.</p>',
        null) +

      '<div style="height:20px"></div>' +
      protoNote(
        '<strong style="color:var(--text)">Choose the outcome to simulate.</strong> ' +
        'This control exists only so a reviewer can reach every payment state. It is not part of the product.' +
        '<div class="pn-actions">' +
        [['success', 'Successful'], ['failed', 'Not completed'], ['pending', 'Still confirming']].map(function (p) {
          return '<button class="btn sm ' + (tx.simulate === p[0] ? 'pri' : 'sec') + '" type="button" data-sim="' + p[0] + '" aria-pressed="' + (tx.simulate === p[0]) + '">' + esc(p[1]) + '</button>';
        }).join('') + '</div>');

    var summary =
      '<aside class="sumcard" aria-labelledby="sum-h">' +
      '<div class="sc-head"><h2 id="sum-h">Access summary</h2></div>' +
      '<div class="sc-body">' +
      '<div class="sumline"><span class="sl-k">Item</span><span class="sl-v">' + esc(offeringName(o)) + '</span></div>' +
      '<div class="sumline"><span class="sl-k">Type</span><span class="sl-v">' + (o.kind === 'bundle' ? 'Bundle · ' + o.modules.length + ' modules' : 'Single module') + '</span></div>' +
      '<div class="sumline"><span class="sl-k">Experiments added</span><span class="sl-v">' + gained.length + '</span></div>' +
      '<div class="sumline"><span class="sl-k">Account</span><span class="sl-v">' + esc(L.email) + '</span></div>' +
      '<div class="sumtotal"><span class="st-k">Amount</span><span class="st-v">' + money(o.amount) + '</span></div>' +
      '<p class="subtle-note" style="margin-top:8px;text-align:right">' + sampleTag('SAMPLE AMOUNT') + '</p>' +
      '</div>' +
      '<div class="sc-foot"><button class="btn pri lg" type="button" id="pay-btn">Pay ' + money(o.amount) + ' and get access</button>' +
      '<div style="height:9px"></div>' +
      '<a class="btn sec" href="' + (o.kind === 'bundle' ? '#/bundle/' : '#/module/') + o.id + '" style="width:100%">Back to details</a></div>' +
      '<p class="sc-legal">The amount shown is sample design data for this prototype. No payment is taken and no payment or personal detail is collected anywhere in it.</p>' +
      '</aside>';

    return shell('explore',
      crumbs([{ label: 'Explore', href: '#/explore' },
        { label: offeringName(o), href: (o.kind === 'bundle' ? '#/bundle/' : '#/module/') + o.id },
        { label: 'Get access' }]),
      phead('Get access', 'Check what you are getting, then confirm.') +
      '<div class="checkout"><div class="co-main">' + main + '</div>' + summary + '</div>');
  }

  function bindCheckout(oid) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-sim]'), function (b) {
      b.addEventListener('click', function () {
        if (!S.tx) return;
        S.tx.simulate = b.getAttribute('data-sim'); save(); render();
      });
    });
    var pay = document.getElementById('pay-btn');
    if (pay) pay.addEventListener('click', function () {
      if (!S.tx) return;
      S.tx.stage = 'processing'; save();
      location.hash = '#/processing';
    });
  }

  /* ============================================================
     B2C-05 · PROCESSING
     Determinate, so waiting never reads as a hang, and the wait says
     plainly that nothing has been added yet.
     ============================================================ */
  function viewProcessing() {
    var tx = S.tx;
    if (!tx || tx.stage !== 'processing') return notFound();
    var o = S.offerings[tx.offering];
    return shell('explore', '',
      '<div style="padding:40px 0">' +
      '<div class="outcome busy">' +
      '<div class="oc-node">' + ic('clock') + '</div>' +
      '<h1>Confirming your payment</h1>' +
      '<p class="oc-lede">Hold on while the payment for <strong>' + esc(offeringName(o)) + '</strong> is confirmed. ' +
      'Nothing has been added to your learning yet — please do not close this page.</p>' +
      '<div class="procbar"><div class="progressbar"><span id="proc-bar" style="width:8%"></span></div>' +
      '<div class="pb-steps"><span>Sent</span><span>Confirming</span><span>Access</span></div></div>' +
      '</div></div>');
  }
  function bindProcessing() {
    var bar = document.getElementById('proc-bar');
    var pcts = [30, 58, 82, 96], i = 0;
    announce('Confirming your payment. Please wait.');
    var iv = setInterval(function () {
      if (!bar || !document.contains(bar)) { clearInterval(iv); return; }
      bar.style.width = pcts[i] + '%';
      if (++i >= pcts.length) {
        clearInterval(iv);
        setTimeout(settleTransaction, 420);
      }
    }, 430);
  }

  /* THE MOMENT ACCESS IS CREATED.
     Success is the only branch that writes to S.access — a declined or an
     unconfirmed payment leaves the access spine untouched, which is why no
     downstream screen has to remember to hide anything. */
  function settleTransaction() {
    var tx = S.tx;
    if (!tx || tx.stage !== 'processing') return;
    var o = S.offerings[tx.offering];

    if (tx.simulate === 'success') {
      var granted = newModules(o);
      var ref = 'ACC-2026-0' + (S.seq++);
      granted.forEach(function (mid) {
        S.access[mid] = { via: o.id, on: TODAY, ref: ref };
      });
      S.history.unshift({ ref: ref, offering: o.id, on: TODAY, amount: o.amount, granted: granted });
      tx.ref = ref; tx.granted = granted; tx.stage = 'success';
    } else if (tx.simulate === 'failed') {
      tx.stage = 'failed';
    } else {
      tx.stage = 'pending';
    }
    save();
    location.hash = '#/result';
  }

  /* ============================================================
     B2C-06 · ACCESS RESULT — three outcomes
     Success · not completed · still confirming. FRD 9.1.x requires all
     three to be designed states. Each one says what happened, what it
     means for access, and what to do next.
     ============================================================ */
  function viewResult() {
    var tx = S.tx;
    if (!tx || ['success', 'failed', 'pending'].indexOf(tx.stage) === -1) return notFound();
    var o = S.offerings[tx.offering];
    var backHref = (o.kind === 'bundle' ? '#/bundle/' : '#/module/') + o.id;

    if (tx.stage === 'success') {
      var granted = (tx.granted || []).slice();
      return shell('explore', '',
        '<div style="padding:32px 0">' +
        '<div class="outcome ok">' +
        '<div class="oc-node">' + ic('check') + '</div>' +
        '<h1>' + (granted.length === 1 ? 'It’s yours — access added' : 'They’re yours — access added') + '</h1>' +
        '<p class="oc-lede">' + esc(offeringName(o)) + ' has been added to your learning. ' +
        (granted.length === 1 ? 'You can open it now.' : 'All ' + granted.length + ' experiments are ready to open now.') + '</p>' +
        '<div class="oc-detail">' + inclRows(granted, { showAccess: false }) + '</div>' +
        '<div class="oc-act">' +
        '<a class="btn pri lg" href="#/my-learning">Go to My Learning</a>' +
        '<a class="btn sec" href="#/explore">Keep exploring</a></div>' +
        '<div class="oc-ref"><span>Reference</span><code>' + esc(tx.ref) + '</code><span>·</span><span>' + esc(TODAY) + '</span>' + sampleTag() + '</div>' +
        '</div></div>');
    }

    if (tx.stage === 'failed') {
      return shell('explore', '',
        '<div style="padding:32px 0">' +
        '<div class="outcome bad">' +
        '<div class="oc-node">' + ic('alertCirc') + '</div>' +
        '<h1>Payment not completed</h1>' +
        '<p class="oc-lede">The payment for <strong>' + esc(offeringName(o)) + '</strong> did not go through, ' +
        'so <strong>nothing has been added to your learning</strong> and no amount has been taken.</p>' +
        '<div class="oc-detail"><div class="alert warning">' + ic('info') +
        '<div><div class="at">You can safely try again</div>' +
        'Trying again starts a fresh payment. Your learning is exactly as it was before you started, and you can check that at any time in ' +
        '<a href="#/my-learning">My Learning</a>.</div></div></div>' +
        '<div class="oc-act">' +
        '<a class="btn pri lg" href="#/get-access/' + o.id + '">Try again</a>' +
        '<a class="btn sec" href="' + backHref + '">Back to details</a></div>' +
        '</div></div>');
    }

    /* indeterminate — FRD 9.1.x names this outcome explicitly. What the
       platform does about it operationally is not specified anywhere, so
       this screen states the position and stops. No timing, no banking
       rule, no automatic retry is invented. */
    return shell('explore', '',
      '<div style="padding:32px 0">' +
      '<div class="outcome wait">' +
      '<div class="oc-node">' + ic('clock') + '</div>' +
      '<h1>Still confirming your payment</h1>' +
      '<p class="oc-lede">This payment for <strong>' + esc(offeringName(o)) + '</strong> has not been confirmed yet. ' +
      '<strong>Nothing has been added to your learning so far.</strong></p>' +
      '<div class="oc-detail"><div class="alert info">' + ic('info') +
      '<div><div class="at">If it completes, access appears on its own</div>' +
      'You do not need to activate anything. Check <a href="#/my-learning">My Learning</a> — if the experiment is there, the payment went through. ' +
      'If it is still not there and you have not been charged, you can start again.</div></div></div>' +
      '<div class="oc-act">' +
      '<a class="btn pri lg" href="#/my-learning">Check My Learning</a>' +
      '<a class="btn sec" href="' + backHref + '">Back to details</a></div>' +
      '<div class="oc-ref">' + sampleTag('OUTCOME HANDLING PENDING') + '</div>' +
      '</div></div>');
  }
  function bindResult() {
    var tx = S.tx;
    if (!tx) return;
    if (tx.stage === 'success') announce('Access added. ' + offeringName(S.offerings[tx.offering]) + ' is now in My Learning.');
    else if (tx.stage === 'failed') announce('Payment not completed. Nothing was added to your learning. You can try again.');
    else announce('Payment still being confirmed. Nothing has been added to your learning yet.');
  }

  /* ============================================================
     LRN-02 · MY LEARNING (individual context)
     Every row here is an access record. There is no second list and no
     hard-coded row: delete the access and the row goes with it.
     ============================================================ */
  /* "Just added" is a moment, not a state. It is shown the first time the
     learner reaches My Learning after a successful payment and then stops —
     so a refresh, or coming back later, shows the settled list. The access
     records themselves are untouched by this; only the emphasis is. */
  function justAdded() {
    return (S.tx && S.tx.stage === 'success' && !S.tx.seen) ? (S.tx.granted || []) : [];
  }
  function bindMyLearning() {
    if (S.tx && S.tx.stage === 'success' && !S.tx.seen) { S.tx.seen = true; save(); }
  }

  function viewMyLearning() {
    var mine = myModules();
    var fresh = justAdded();

    if (!mine.length) {
      /* Divergence 6 — the individual learner's empty state offers Explore.
         The institutional learner's says "contact your institution" instead. */
      return shell('my-learning', '',
        phead('My Learning', 'Everything you have access to.') +
        '<div class="tablecard">' + emptyState('book', 'Nothing in your learning yet',
          'When you get access to an experiment or a bundle, it appears here straight away and you can start from this page.',
          '<a class="btn pri" href="#/explore">Explore the catalogue</a>') + '</div>');
    }

    var rows = mine.map(function (mid) {
      var m = S.modules[mid], org = accessOrigin(mid);
      var isNew = fresh.indexOf(mid) !== -1;
      return '<tr' + (isNew ? ' class="row-new"' : '') + '>' +
        '<td><a class="rowlink" href="#/learn/' + mid + '"><span class="tmain">' + esc(m.name) + '</span></a>' +
        '<div class="tsub">' + esc(DEVICE_LINE[m.fmt]) + '</div></td>' +
        '<td>' + fmtBadge(m.fmt) + '</td>' +
        '<td><span class="tsub" style="margin:0">' + esc(org ? org.line : '') + '</span>' +
        (isNew ? ' ' + badge('b-success', 'check', 'Just added') : '') + '</td>' +
        '<td><a class="btn sm sec" href="#/learn/' + mid + '">Open</a></td></tr>';
    }).join('');

    var justCount = fresh.length;

    return shell('my-learning', '',
      phead('My Learning', 'Everything you have access to. ' + sampleTag()) +
      (justCount
        ? '<div class="alert success" style="margin-bottom:20px">' + ic('check') +
          '<div><div class="at">' + justCount + ' ' + plural(justCount, 'experiment', 'experiments') + ' just added</div>' +
          esc(offeringName(S.offerings[S.tx.offering])) + ' is now part of your learning and is marked below.</div></div>'
        : '') +
      '<div class="tablecard">' +
      '<div class="listbar"><h2 style="font-size:14px;font-weight:650">Your experiments</h2>' +
      '<span class="lcount">' + mine.length + ' ' + plural(mine.length, 'experiment', 'experiments') + '</span></div>' +
      '<table class="dt"><caption class="sr-only">Experiments you have access to</caption>' +
      '<thead><tr><th scope="col">Experiment</th><th scope="col">Runs on</th><th scope="col">How you got it</th>' +
      '<th scope="col"><span class="sr-only">Actions</span></th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div>' +

      '<div style="height:20px"></div>' +
      '<div class="alert info">' + ic('info') +
      '<div><div class="at">Where the rest of the learning experience is</div>' +
      'From an experiment, the learner works through resources, then the simulation, then the assessment, and progress is recorded. ' +
      'Those screens are designed in <strong>Batch 01</strong> (resources, simulation, XR device access, progress) and <strong>Batch 02</strong> ' +
      '(assessment and results). <strong>Batch 04 does not duplicate them</strong> — it ends where they begin.</div></div>' +

      '<div style="height:20px"></div>' +
      '<a class="btn sec" href="#/explore">' + ic('compass') + 'Explore more</a>');
  }

  /* ============================================================
     LEARN — the handoff out of Batch 04
     A real destination for "Open" so My Learning is not a dead end,
     and an honest statement of where the rest is designed.
     ============================================================ */
  function viewLearn(mid) {
    var m = S.modules[mid];
    if (!m || !hasAccess(mid)) return notFound();
    var org = accessOrigin(mid);

    return shell('my-learning',
      crumbs([{ label: 'My Learning', href: '#/my-learning' }, { label: m.name }]),
      '<div class="phero">' +
      '<div class="ph-main">' +
      '<div class="ph-kicker">' + badge('b-success', 'check', 'You have access') + fmtBadge(m.fmt) + '</div>' +
      '<h1>' + esc(m.name) + '</h1>' +
      '<p class="ph-lede">' + esc(m.summary) + '</p>' +
      '<div class="ph-facts">' +
      '<span class="ph-fact">' + ic('boxes') + '<span><strong>' + esc(m.disc) + '</strong></span></span>' +
      '<span class="ph-fact">' + ic(deviceIcon(m.fmt)) + '<span>' + esc(DEVICE_LINE[m.fmt]) + '</span></span>' +
      (org ? '<span class="ph-fact">' + ic('check') + '<span>' + esc(org.line) + '</span></span>' : '') +
      '</div></div>' +
      '<aside class="accesspanel have">' +
      '<div class="ap-state"><span class="ap-node">' + ic('check') + '</span>Included in your learning</div>' +
      '<p class="ap-note" style="margin-bottom:14px">You have everything you need to start this experiment.</p>' +
      '<div class="ap-act"><a class="btn pri lg" href="#/learn/' + mid + '" onclick="return false" aria-disabled="true">Start learning</a></div>' +
      '<p class="ap-sub">' + ic('info', 'sm') + ' This action is inactive in Batch 04 — it opens the learner screens designed in Batch 01.</p>' +
      '</aside></div>' +

      card('What is in this experiment', componentRows(m), null) +

      '<div style="height:20px"></div>' +
      '<div class="alert info">' + ic('info') +
      '<div><div class="at">This is where Batch 04 hands over</div>' +
      'Batch 04 covers how an individual learner discovers content, gets access to it, and finds it here. ' +
      'What happens from this point — <strong>learning resources → simulation → XR device access → assessment → results → progress</strong> — ' +
      'is already designed and demonstrated in <strong>Batch 01</strong> and <strong>Batch 02</strong>, and is identical whether the access came ' +
      'from an institution or from an individual purchase. It is deliberately not rebuilt here.</div></div>');
  }

  /* ============================================================
     B2C-07 · ACCESS HISTORY
     What access was created against this account, and when. NOT a
     receipt or invoice surface: what a B2C buyer receives as a document
     is undefined in the source, so none is offered.
     ============================================================ */
  function viewHistory() {
    if (!S.learner.signedIn) { location.replace('#/sign-in'); return ''; }
    if (!S.history.length) {
      return shell('history', '',
        phead('Access history', 'Access added to your account.') +
        '<div class="tablecard">' + emptyState('receipt', 'Nothing here yet',
          'When you get access to an experiment or a bundle, it is recorded here with the date and a reference.',
          '<a class="btn pri" href="#/explore">Explore the catalogue</a>') + '</div>');
    }

    var rows = S.history.map(function (h) {
      var o = S.offerings[h.offering];
      return '<tr><td><span class="tmain">' + esc(o ? offeringName(o) : 'Access') + '</span>' +
        '<div class="tsub">' + (h.granted.length === 1 ? '1 experiment' : h.granted.length + ' experiments') +
        ' · ' + esc(o && o.kind === 'bundle' ? 'Bundle' : 'Single module') + '</div></td>' +
        '<td>' + esc(h.on) + '</td>' +
        '<td><code style="font-family:var(--mono);font-size:12.5px">' + esc(h.ref) + '</code></td>' +
        '<td class="num">' + money(h.amount) + '</td></tr>';
    }).join('');

    return shell('history', '',
      phead('Access history', 'Access added to your account. ' + sampleTag()) +
      '<div class="tablecard">' +
      '<div class="listbar"><h2 style="font-size:14px;font-weight:650">Your access</h2>' +
      '<span class="lcount">' + S.history.length + ' ' + plural(S.history.length, 'record', 'records') + '</span></div>' +
      '<table class="dt"><caption class="sr-only">Access added to your account</caption>' +
      '<thead><tr><th scope="col">What you got</th><th scope="col">Date</th><th scope="col">Reference</th>' +
      '<th scope="col">Amount</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div style="height:20px"></div>' +
      '<p class="subtle-note">Amounts are sample design data. What a buyer receives as a document — a receipt, an invoice or neither — is not yet decided, ' +
      'so nothing is offered for download here.</p>');
  }

  /* ============================================================
     SIGN IN TO CONTINUE — the minimum handoff
     Batch 04 does not design authentication. This screen exists only
     so the "a transaction belongs to an account" rule is visible. It
     collects nothing, names no provider, and asserts no sign-in method.
     ============================================================ */
  function viewSignIn(oid) {
    var o = oid ? S.offerings[oid] : null;
    var next = o ? '#/get-access/' + o.id : '#/explore';
    return shell('explore', '',
      '<div style="padding:40px 0">' +
      '<div class="handoff">' +
      '<div class="ho-node">' + ic('user') + '</div>' +
      '<h1>Sign in to continue</h1>' +
      '<p class="ho-lede">' +
      (o ? 'Access to <strong>' + esc(offeringName(o)) + '</strong> is added to a personal account, so you need to be signed in before you continue.'
         : 'You need to be signed in to see this part of your account.') +
      '</p>' +
      '<div class="ho-act">' +
      '<button class="btn pri lg" type="button" id="ho-signin">Sign in</button>' +
      '<button class="btn sec lg" type="button" id="ho-signup">Create an account</button>' +
      '</div>' +
      '<div class="alert info">' + ic('info') +
      '<div><div class="at">Authentication is not designed in Batch 04</div>' +
      'Signing in, creating an account and the sign-in methods available to an individual learner are shared platform work and are designed elsewhere. ' +
      'This prototype only shows the handoff, so both buttons above simply continue.</div></div>' +
      '<p class="subtle-note" style="margin-top:16px">' + ic('shield', 'sm') +
      ' Nothing is collected on this screen. There is no password field, no one-time code and no named sign-in provider anywhere in this prototype.</p>' +
      '<input type="hidden" id="ho-next" value="' + esc(next) + '">' +
      '</div></div>');
  }
  function bindSignIn() {
    var nxt = document.getElementById('ho-next');
    ['ho-signin', 'ho-signup'].forEach(function (id) {
      var b = document.getElementById(id);
      if (b) b.addEventListener('click', function () {
        S.learner.signedIn = true; save();
        toast('Signed in as ' + S.learner.name + '.', 'info');
        location.hash = nxt ? nxt.value : '#/explore';
      });
    });
  }

  /* ============================================================
     HOME · PROGRESS — where they are designed
     Both are confirmed parts of the individual learner's navigation, and
     neither belongs to Batch 04. Showing the real navigation and saying
     plainly where each surface lives is more honest than hiding the item
     or drawing a screen this batch has no basis for.
     ============================================================ */
  function viewElsewhere(which) {
    var map = {
      home: {
        t: 'Home', ic: 'home',
        d: 'The learner’s landing surface — one-click resumption of whatever they were last working on.',
        where: 'Confirmed in the platform information architecture as <code>LRN-01</code>. It is <strong>not designed in any batch yet</strong> and is not part of Batch 04’s scope.'
      },
      progress: {
        t: 'Progress', ic: 'activity',
        d: 'Personal progress — completion across experiments, assessment scores and attempt history.',
        where: 'Designed and demonstrated in <strong>Batch 01</strong> (completion and progress) and <strong>Batch 02</strong> (assessment results and attempt history). Batch 04 does not duplicate it.'
      }
    };
    var m = map[which];
    return shell(which, '',
      phead(m.t, esc(m.d)) +
      '<div class="tablecard"><div class="empty">' +
      '<div class="echip">' + ic(m.ic, 'lg') + '</div>' +
      '<h2>Not part of Batch 04</h2>' +
      '<p style="max-width:520px">' + m.where + '</p>' +
      '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">' +
      '<a class="btn pri" href="#/my-learning">Go to My Learning</a>' +
      '<a class="btn sec" href="#/explore">Explore the catalogue</a></div>' +
      '</div></div>' +
      '<div style="height:20px"></div>' +
      protoNote('This screen is a reviewer signpost, not product UI. It exists so that the individual learner’s confirmed navigation ' +
        '(Home · My Learning · Explore · Progress) can be shown intact without Batch 04 inventing a surface it has no basis for.',
        'PROTOTYPE SIGNPOST — NOT PRODUCT UI'));
  }

  /* Partly-held bundle guard target. Says what is true, offers the confirmed
     route (individual modules, FRD 6.1.1), and asserts no pricing rule. */
  function partlyHeld(o) {
    var gained = newModules(o);
    return shell('explore',
      crumbs([{ label: 'Explore', href: '#/explore' },
        { label: offeringName(o), href: '#/bundle/' + o.id }]),
      '<div style="padding:32px 0"><div class="outcome wait">' +
      '<div class="oc-node">' + ic('info') + '</div>' +
      '<h1>Some of this bundle is already yours</h1>' +
      '<p class="oc-lede">You already have ' + esc(String(offeringAccess(o).have)) + ' of the ' +
      esc(String(offeringAccess(o).total)) + ' modules in <strong>' + esc(offeringName(o)) + '</strong>. ' +
      'You can add the ' + gained.length + ' you do not have ' + plural(gained.length, 'as a single module', 'individually') + '.</p>' +
      '<div class="oc-detail">' + inclRows(gained, { showAccess: false, link: true,
        foot: 'Each of these is available on its own. What you already have stays exactly as it is.' }) + '</div>' +
      '<div class="oc-act">' +
      '<a class="btn pri lg" href="#/module/' + esc(moduleOffering(gained[0])) + '">Open the first of these</a>' +
      '<a class="btn sec" href="#/bundle/' + o.id + '">Back to the bundle</a></div>' +
      '<div class="oc-ref">' + sampleTag('BUNDLE OVERLAP PRICING PENDING') + '</div>' +
      '</div></div>');
  }

  /* already-have guard target — reached only if someone forces the URL */
  function alreadyHave(o) {
    return shell('explore',
      crumbs([{ label: 'Explore', href: '#/explore' }, { label: offeringName(o) }]),
      '<div style="padding:32px 0"><div class="outcome ok">' +
      '<div class="oc-node">' + ic('check') + '</div>' +
      '<h1>You already have this</h1>' +
      '<p class="oc-lede"><strong>' + esc(offeringName(o)) + '</strong> is already included in your learning, so there is nothing to get. ' +
      'Open it from My Learning whenever you want to work on it.</p>' +
      '<div class="oc-act"><a class="btn pri lg" href="#/my-learning">Go to My Learning</a>' +
      '<a class="btn sec" href="#/explore">Back to Explore</a></div>' +
      '</div></div>');
  }

  function notFound() {
    /* Carries a page heading of its own: without one the screen would have no h1,
       leaving a screen-reader user with no title for where they landed. */
    return shell('explore', '',
      phead('Page not found') +
      '<div class="tablecard">' + emptyState('search', 'That page isn’t here',
        'The link may be out of date, or the step it belonged to has already finished.',
        '<a class="btn pri" href="#/explore">Go to Explore</a>') + '</div>');
  }

  /* ============================================================
     PROTOTYPE INDEX — not product UI
     ============================================================ */
  function viewIndex() {
    var paths = [
      { k: 'A', h: 'Discover → get access → My Learning', steps: ['Explore — Surveying is available, not yet yours', 'Open the module and read what you get', 'Get access — check the summary and the account', 'Pay — simulate a successful payment', 'Access confirmed, then My Learning shows the same experiment'], go: [['#/explore', 'Start at Explore'], ['#/module/o_survey', 'Straight to Surveying']] },
      { k: 'B', h: 'Bundle access', steps: ['Explore — filter to bundles', 'Geotechnical bundle — see all three modules', 'Get access once', 'All three arrive in My Learning separately'], go: [['#/bundle/o_bgeo', 'Start at the bundle']] },
      { k: 'C', h: 'Something you already have', steps: ['Explore — Direct Shear Test is already yours', 'The card offers My Learning, not a purchase', 'The detail screen shows no amount and no Get access'], go: [['#/module/o_shear', 'Open Direct Shear Test']] },
      { k: 'D', h: 'Payment that does not complete', steps: ['Open any item you do not have', 'Get access, then simulate “Not completed”', 'Nothing is added — check My Learning to confirm', 'Try again and simulate success'], go: [['#/module/o_bern', 'Open Bernoulli Flow']] },
      { k: 'E', h: 'Search, filter and no results', steps: ['Search “soil”', 'Filter to Civil Engineering and VR', 'Search something the catalogue does not have', 'Clear the filters'], go: [['#/explore', 'Start at Explore']] },
      { k: 'F', h: 'Signed out', steps: ['Account menu → Sign out', 'Open an item and press Get access', 'Sign in to continue → back to exactly where you were'], go: [['#/explore', 'Start at Explore']] }
    ].map(function (p) {
      return '<div class="pathcard"><span class="pk" aria-hidden="true">' + p.k + '</span>' +
        '<h2>Path ' + p.k + ' — ' + esc(p.h) + '</h2>' +
        '<ol>' + p.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' +
        '<div class="pgo">' + p.go.map(function (g, i) {
          return '<a class="btn sm ' + (i === 0 ? 'sec' : 'gho') + '" href="' + g[0] + '">' + esc(g[1]) + '</a>';
        }).join('') + '</div></div>';
    }).join('');

    var conv =
      '<div class="converge">' +
      '<div class="cv-col"><h3>Institutional learner</h3><div class="cv-sub">Batch 03 designs this route</div>' +
      ['The institution holds content access', 'The learner is eligible through a stream or a group', 'The experiment appears in My Learning']
        .map(function (s, i) { return '<div class="cv-step"><span class="cv-n">' + (i + 1) + '</span><span>' + esc(s) + '</span></div>'; }).join('') +
      '</div>' +
      '<div class="cv-col"><h3>Individual learner</h3><div class="cv-sub">Batch 04 designs this route</div>' +
      ['The learner finds a module or a bundle in the catalogue', 'They get access and the payment succeeds', 'The experiment appears in My Learning']
        .map(function (s, i) { return '<div class="cv-step"><span class="cv-n">' + (i + 1) + '</span><span>' + esc(s) + '</span></div>'; }).join('') +
      '</div></div>' +
      '<div class="converge-foot"><div class="cf-t">' + ic('arrD', 'sm') + ' Same platform from here on</div>' +
      '<div class="cf-d">Resources → simulation → assessment → progress is identical on both routes and is designed in Batch 01 and Batch 02. ' +
      'Two ways in, one learning experience.</div></div>';

    return protobar('index') +
      '<div class="index-wrap">' +
      '<div class="index-head"><span class="itag">PROTOTYPE INDEX — NOT PRODUCT UI</span>' +
      '<h1>Batch 04 — Individual learner access</h1>' +
      /* "reaching the platform through an institution" rather than "subscribing institution":
         what institutions subscribe to is OQ-01/OQ-02 and remains open, so even reviewer
         copy avoids leaning on the word. */
      '<p>How a person who reaches the platform on their own, rather than through an institution, finds XR learning content, understands what they would be getting, ' +
      'gets access to it, and then finds it in My Learning. Everything here is <strong>sample design data</strong>, including every ' +
      'monetary amount. Best reviewed at 1440px.</p>' +
      '<p class="subtle-note" style="margin-top:10px">No backend, no network request, no payment provider or gateway, no authentication provider ' +
      'and no entitlement service. The commercial model itself — what a learner is buying, for how long, and whether anything recurs — is an ' +
      'open product question, and this prototype is built so that it does not answer it.</p></div>' +
      '<div class="index-section"><h2>Two ways in, one learning experience</h2>' + conv + '</div>' +
      '<div class="index-section"><h2>Demo paths</h2><div class="pathgrid">' + paths + '</div></div>' +
      '<div class="index-section"><h2>Start anywhere</h2><div class="rolegrid">' +
      [['#/explore', 'EX', 'Explore', 'The catalogue'],
       ['#/my-learning', 'ML', 'My Learning', 'What the learner has'],
       ['#/history', 'AH', 'Access history', 'What was added, and when']]
        .map(function (r) {
          return '<a class="rolecard" href="' + r[0] + '"><span class="rc-av" aria-hidden="true">' + r[1] + '</span>' +
            '<span><span class="rc-name">' + esc(r[2]) + '</span><br><span class="rc-sub">' + esc(r[3]) + '</span></span></a>';
        }).join('') + '</div></div>' +
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
    var p = route().parts;
    var html = '', after = null;

    if (p[0] === 'explore') { html = viewCatalogue(); after = bindCatalogue; }
    else if (p[0] === 'module' && p[1]) html = viewModule(p[1]);
    else if (p[0] === 'bundle' && p[1]) html = viewBundle(p[1]);
    else if (p[0] === 'get-access' && p[1]) { var oid = p[1]; html = viewCheckout(oid); after = function () { bindCheckout(oid); }; }
    else if (p[0] === 'processing') { html = viewProcessing(); after = bindProcessing; }
    else if (p[0] === 'result') { html = viewResult(); after = bindResult; }
    else if (p[0] === 'my-learning') { html = viewMyLearning(); after = bindMyLearning; }
    else if (p[0] === 'learn' && p[1]) html = viewLearn(p[1]);
    else if (p[0] === 'history') html = viewHistory();
    else if (p[0] === 'sign-in') { html = viewSignIn(p[1]); after = bindSignIn; }
    else if (p[0] === 'home') html = viewElsewhere('home');
    else if (p[0] === 'progress') html = viewElsewhere('progress');

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

  /* account menu — a real menu, because Access history and Sign out live in it */
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
      S.learner.signedIn = false; save(); close();
      toast('Signed out. Browsing the catalogue does not need an account.', 'info');
      location.hash = '#/explore';
      render();
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
