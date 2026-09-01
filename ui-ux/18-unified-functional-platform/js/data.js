/* ============================================================
   Unified Functional Platform — PROTOTYPE SAMPLE DATA.

   Everything in this file is prototype/sample data only. It exists
   to exercise the B2B access journey and is NOT production truth:
   no real institutions, no commercial agreements, no prices, no
   licence caps, no real people.

   Content pool notes
   ------------------
   · One content pool, one id namespace (fresh — deliberately not the
     historical `shear` / `c_shear` split namespaces).
   · Hierarchy per STK31-12: AcademicGrouping (Programme / Department,
     ONE grouping level) → Course → Experiment → available technologies.
   · Civil Engineering content mirrors the worked example given in the
     31 Aug stakeholder review, including each experiment's technology
     availability.
   · Technology enum per STK31-15 / STK31-45: Web · VR · MR · AR.
     MR is retained in the enum (structurally supported) even though
     this sample dataset concentrates on AR / VR / Web.
   · This slice runs on SEEDED PUBLISHED content. The content
     production chain (Vendor → Academic Reviewer → Content Manager →
     Published) is required for the complete B2B delivery and is
     integrated in a later slice — it is not modelled here.
   · Learning Outcomes are academically owned by the Academic Reviewer
     in the real workflow (STK31-08); here they are sample published
     catalogue data.
   ============================================================ */

window.XRSLP = window.XRSLP || {};

XRSLP.data = (function () {
  'use strict';

  /* One technology enum, one label set, one device sentence per format.
     Display order follows the FRD format order (Web · VR · MR · AR). */
  var TECHNOLOGIES = {
    web: { id: 'web', label: 'Web', name: 'Web',
           device: 'Runs in a standard web browser. No XR hardware required.' },
    vr:  { id: 'vr', label: 'VR', name: 'Virtual Reality',
           device: 'Runs on supported VR headsets provisioned for the institution.' },
    mr:  { id: 'mr', label: 'MR', name: 'Mixed Reality',
           device: 'Runs on supported MR hardware provisioned by the institution.' },
    ar:  { id: 'ar', label: 'AR', name: 'Augmented Reality',
           device: 'Runs on Android and iOS mobile devices with AR support.' }
  };
  var TECH_ORDER = ['web', 'vr', 'mr', 'ar'];

  /* Programme / Department — one terminology-neutral grouping level (ND-02). */
  var GROUPINGS = [
    {
      id: 'civil-engineering',
      name: 'Civil Engineering',
      summary: 'Laboratory experiments for core civil engineering courses — soil mechanics, surveying and structural analysis — delivered as simulated XR and web experiences.'
    },
    {
      id: 'mechanical-engineering',
      name: 'Mechanical Engineering',
      summary: 'Simulated laboratory work for mechanical engineering fundamentals, covering strength of materials and fluid mechanics.'
    }
  ];

  var COURSES = [
    { id: 'soil-mechanics', groupingId: 'civil-engineering', name: 'Soil Mechanics',
      summary: 'Shear strength and consolidation behaviour of soils, studied through simulated laboratory testing.' },
    { id: 'surveying', groupingId: 'civil-engineering', name: 'Surveying',
      summary: 'Field surveying instruments and procedures practised in a simulated environment.' },
    { id: 'structural-analysis', groupingId: 'civil-engineering', name: 'Structural Analysis',
      summary: 'Behaviour of loaded structural members observed through simulated experiments.' },
    { id: 'strength-of-materials', groupingId: 'mechanical-engineering', name: 'Strength of Materials',
      summary: 'Mechanical behaviour of materials under torsion and other loading conditions.' },
    { id: 'fluid-mechanics', groupingId: 'mechanical-engineering', name: 'Fluid Mechanics',
      summary: 'Principles of fluid flow demonstrated through interactive simulated apparatus.' }
  ];

  /* Technology availability for the Civil Engineering experiments matches
     the 31 Aug worked example exactly. */
  var EXPERIMENTS = [
    {
      id: 'direct-shear', courseId: 'soil-mechanics', name: 'Direct Shear Test',
      summary: 'Determine the shear strength parameters of a soil sample using a simulated direct shear apparatus.',
      description: 'The learner prepares a soil specimen, applies normal stress in stages and shears the sample while recording stress and displacement readings. The simulation reproduces the laboratory procedure of a direct shear apparatus, including specimen preparation, loading increments and failure observation.',
      outcomes: [
        'Prepare a soil specimen and set up the direct shear apparatus correctly.',
        'Record shear stress and displacement readings across staged normal loads.',
        'Determine cohesion and the angle of internal friction from the recorded results.'
      ],
      technologies: ['ar', 'vr', 'web']
    },
    {
      id: 'consolidation', courseId: 'soil-mechanics', name: 'Consolidation Test',
      summary: 'Study the time-dependent settlement of a saturated soil sample under incremental loading.',
      description: 'The learner loads a saturated specimen in a simulated oedometer, observes pore-pressure dissipation and plots settlement against time for each load increment. The simulation covers load staging, dial-gauge reading and the construction of consolidation curves.',
      outcomes: [
        'Set up an oedometer test and apply load increments in the correct sequence.',
        'Record settlement readings over time and construct consolidation curves.',
        'Estimate the coefficient of consolidation from plotted results.'
      ],
      technologies: ['vr', 'web']
    },
    {
      id: 'total-station', courseId: 'surveying', name: 'Total Station Experiment',
      summary: 'Set up a total station and carry out angle and distance measurements on a simulated site.',
      description: 'The learner levels and centres a simulated total station over a survey point, sights reference targets and records horizontal angles, vertical angles and slope distances. The simulation reproduces instrument handling, sighting and booking procedures.',
      outcomes: [
        'Level and centre a total station over a survey station point.',
        'Measure horizontal and vertical angles to sighted targets.',
        'Record and reduce distance measurements from a simulated field exercise.'
      ],
      technologies: ['ar', 'web']
    },
    {
      id: 'beam-deflection', courseId: 'structural-analysis', name: 'Beam Deflection Experiment',
      summary: 'Measure the deflection of a loaded beam and compare observed values with theoretical predictions.',
      description: 'The learner applies point loads to a simply supported beam in a simulated test frame, records deflection at chosen positions and compares the measured profile with the theoretical elastic curve for the loading arrangement.',
      outcomes: [
        'Set up a simply supported beam test with defined support and load positions.',
        'Measure deflection at specified points under increasing load.',
        'Compare measured deflections with values predicted by beam theory.'
      ],
      technologies: ['vr', 'web']
    },
    {
      id: 'torsion-test', courseId: 'strength-of-materials', name: 'Torsion Test',
      summary: 'Apply torque to a metal specimen and study the relationship between torque and angle of twist.',
      description: 'The learner mounts a cylindrical specimen in a simulated torsion testing machine, applies torque in increments and records the angle of twist through to failure. The simulation covers elastic behaviour, yield and the appearance of the failed specimen.',
      outcomes: [
        'Mount a specimen and operate a torsion testing machine safely.',
        'Record torque and angle-of-twist readings through the elastic and plastic ranges.',
        'Determine the modulus of rigidity from the recorded elastic response.'
      ],
      technologies: ['vr', 'web']
    },
    {
      id: 'bernoulli-flow', courseId: 'fluid-mechanics', name: "Bernoulli's Principle Experiment",
      summary: 'Observe pressure and velocity changes along a venturi passage to verify Bernoulli’s principle.',
      description: 'The learner controls flow through a simulated venturi apparatus, reads piezometer levels along the converging and diverging sections and verifies the exchange between pressure head and velocity head predicted by Bernoulli’s equation.',
      outcomes: [
        'Operate a venturi apparatus and establish steady flow conditions.',
        'Record piezometer readings along the test section at multiple flow rates.',
        'Verify Bernoulli’s principle by comparing measured and calculated total heads.'
      ],
      technologies: ['web']
    }
  ];

  /* ------------------------------------------------------------
     PROTOTYPE SCENARIOS — seed requester identities.

     The internal-vs-external classification below is PROTOTYPE SEED
     DATA ONLY (ND-07: the production eligibility/classification rule
     is not confirmed and is NOT invented here). The access context is
     a property of the seeded requester, never a computed rule, and
     an anonymous visitor cannot self-select a free route: the context
     comes only from the clearly-labelled Prototype Controls.
     ------------------------------------------------------------ */
  var SCENARIOS = {
    A: {
      id: 'A',
      title: 'Internal institution (WILP-type)',
      note: 'Existing internal tenant · access context “BITS Community” · no payment step.',
      institution: {
        name: 'Sample Engineering Institute',
        kind: 'internal',
        accessContext: 'BITS Community',
        paymentRequired: false,
        contactName: 'Dr. Kavita Sharma',
        contactEmail: 'kavita.sharma@sample-institute.example'
      },
      seedTenantId: 'tenant-sample-engineering'
    },
    B: {
      id: 'B',
      title: 'External institution',
      note: 'Example external institution · access context “Subscription” · payment required after approval.',
      institution: {
        name: 'Northfield Institute of Technology',
        kind: 'external',
        accessContext: 'Subscription',
        paymentRequired: true,
        contactName: 'Prof. Daniel Mensah',
        contactEmail: 'd.mensah@northfield.example'
      },
      seedTenantId: null
    }
  };

  /* Seeded tenants. The internal sample tenant reuses the coherent
     sample world established by the historical batches
     (“Sample Engineering Institute”) rather than hardcoding any real
     campus or institution as a record (STK31-23). */
  var SEED_TENANTS = [
    {
      id: 'tenant-sample-engineering',
      name: 'Sample Engineering Institute',
      kind: 'internal',
      accessContext: 'BITS Community',
      status: 'active',
      origin: 'Seeded prototype tenant'
    }
  ];

  /* Access terms — Monthly · Quarterly · Yearly. No Lifetime (STK31-28 / STK31-05). */
  var TERMS = [
    { id: 'monthly', label: 'Monthly', months: 1 },
    { id: 'quarterly', label: 'Quarterly', months: 3 },
    { id: 'yearly', label: 'Yearly', months: 12 }
  ];

  /* ------------------------------------------------------------
     PLAN TERMS / ACCESS CONTEXT — sample values only (STK31-26).

     `Plan Terms` was requested "if possible" and its mandatory status
     is an unresolved implementation detail (ND-03), so this list is a
     convenience for data entry, never a validation gate: any value is
     accepted, a blank value is valid, and an unrecognised value is an
     attention row rather than an import failure. It NEVER overrides the
     tenant's actual approved access record (which is authoritative).
     ------------------------------------------------------------ */
  var PLAN_TERMS = ['Subscription', 'BITS Community'];

  /* ------------------------------------------------------------
     SEEDED TENANT PEOPLE — PROTOTYPE SAMPLE DATA ONLY.

     Sample people for the seeded internal tenant so the People,
     Groups and Assignment surfaces are explorable from a fresh reset.
     Names and identifiers reuse the coherent sample world established
     by the historical batches; no real person is represented.

     ⚠ Seeding people deliberately does NOT seed any content access
     record and NOT a single assignment: a fresh reset still has zero
     tenant access and zero student entitlement, which is what keeps
     PUBLISHED ≠ TENANT ACCESS ≠ STUDENT ENTITLEMENT visible.

     `source` is the provenance line required by ND-04 — one of
     `seed` (prototype), `manual`, `csv`. There is no ERP route in this
     slice; the enum is left open for it.
     ------------------------------------------------------------ */
  var SEED_TENANT_ID = 'tenant-sample-engineering';

  var SEED_PEOPLE = [
    { role: 'faculty', name: 'Dr. Arjun Mehta',  email: 'arjun.mehta@sample-institute.example',   facultyId: 'SEI/FAC/0031' },
    { role: 'faculty', name: 'Dr. Sneha Iyer',   email: 'sneha.iyer@sample-institute.example',    facultyId: 'SEI/FAC/0044' },

    { role: 'student', name: 'Rahul Verma',      email: 'rahul.verma@sample-institute.example',   studentId: 'SEI/CE/2023/0142',
      groupingId: 'civil-engineering',      courseId: 'soil-mechanics',        localCourseCode: 'CE-305', semester: '5',  organisation: '', planTerms: 'BITS Community' },
    { role: 'student', name: 'Ananya Krishnan',  email: 'ananya.k@sample-institute.example',      studentId: 'SEI/CE/2023/0158',
      groupingId: 'civil-engineering',      courseId: 'soil-mechanics',        localCourseCode: 'CE-305', semester: '5',  organisation: '', planTerms: 'BITS Community' },
    { role: 'student', name: 'Meera Sundaram',   email: 'meera.sundaram@sample-institute.example', studentId: 'SEI/CE/2023/0163',
      groupingId: 'civil-engineering',      courseId: 'surveying',             localCourseCode: 'CE-212', semester: '',   organisation: '', planTerms: '' },
    { role: 'student', name: 'Rohit Pillai',     email: 'rohit.pillai@sample-institute.example',  studentId: 'SEI/CE/2023/0177',
      groupingId: 'civil-engineering',      courseId: 'structural-analysis',   localCourseCode: 'CE-341', semester: '6',  organisation: '', planTerms: 'BITS Community' },
    { role: 'student', name: 'Karthik Desai',    email: 'karthik.desai@sample-institute.example', studentId: 'SEI/ME/2023/0091',
      groupingId: 'mechanical-engineering', courseId: 'strength-of-materials', localCourseCode: 'ME-208', semester: '',   organisation: '', planTerms: '' },
    { role: 'student', name: 'Tanya Varghese',   email: 'tanya.varghese@sample-institute.example', studentId: 'SEI/ME/2023/0112',
      groupingId: 'mechanical-engineering', courseId: 'fluid-mechanics',       localCourseCode: 'ME-233', semester: '4',  organisation: '', planTerms: '' }
  ];

  /* Groups are an operational assignment convenience — no academic
     semantics are invented for them (STK31-25). Membership alone
     grants nothing. */
  var SEED_GROUPS = [
    { key: 'geo-a',   name: 'Geotechnics Lab Batch A', description: 'Soil mechanics laboratory batch A.', members: ['SEI/CE/2023/0142', 'SEI/CE/2023/0158'] },
    { key: 'survey-a', name: 'Survey Field Batch A',   description: 'Surveying field exercise batch.',    members: ['SEI/CE/2023/0163', 'SEI/CE/2023/0177'] }
  ];

  /* Tenant-local mappings over CANONICAL courses (STK31-11).
     Semester is optional everywhere and is blank on purpose here. */
  var SEED_COURSE_MAPPINGS = [
    { courseId: 'soil-mechanics',        localCode: 'CE-305', semester: '5' },
    { courseId: 'surveying',             localCode: 'CE-212', semester: '' }
  ];

  /* ---- lookup helpers over the static pool ---- */
  function grouping(id) { return GROUPINGS.filter(function (g) { return g.id === id; })[0] || null; }
  function course(id) { return COURSES.filter(function (c) { return c.id === id; })[0] || null; }
  function experiment(id) { return EXPERIMENTS.filter(function (e) { return e.id === id; })[0] || null; }
  function coursesInGrouping(gid) { return COURSES.filter(function (c) { return c.groupingId === gid; }); }
  function experimentsInCourse(cid) { return EXPERIMENTS.filter(function (e) { return e.courseId === cid; }); }
  function experimentsInGrouping(gid) {
    var cids = coursesInGrouping(gid).map(function (c) { return c.id; });
    return EXPERIMENTS.filter(function (e) { return cids.indexOf(e.courseId) !== -1; });
  }
  function contextOf(expId) {
    var e = experiment(expId); if (!e) { return null; }
    var c = course(e.courseId); var g = c ? grouping(c.groupingId) : null;
    return { experiment: e, course: c, grouping: g };
  }
  function term(id) { return TERMS.filter(function (t) { return t.id === id; })[0] || null; }
  /* Name-based resolution for CSV / manual entry. Canonical only: the
     tenant may map a LOCAL code onto a canonical Course, never invent a
     replacement Course or Experiment (STK31-10). */
  function norm(text) { return String(text == null ? '' : text).trim().toLowerCase().replace(/\s+/g, ' '); }
  function groupingByName(name) {
    var n = norm(name);
    return GROUPINGS.filter(function (g) { return norm(g.name) === n; })[0] || null;
  }
  function courseByName(name, groupingId) {
    var n = norm(name);
    return COURSES.filter(function (c) {
      return norm(c.name) === n && (!groupingId || c.groupingId === groupingId);
    })[0] || null;
  }
  /* Technologies actually present in the sample pool — filters derive
     from this so no filter exists whose data does not exist. */
  function technologiesInUse() {
    var used = {};
    EXPERIMENTS.forEach(function (e) { e.technologies.forEach(function (t) { used[t] = true; }); });
    return TECH_ORDER.filter(function (t) { return used[t]; });
  }
  function sortTech(list) {
    return TECH_ORDER.filter(function (t) { return list.indexOf(t) !== -1; });
  }

  return {
    TECHNOLOGIES: TECHNOLOGIES, TECH_ORDER: TECH_ORDER,
    GROUPINGS: GROUPINGS, COURSES: COURSES, EXPERIMENTS: EXPERIMENTS,
    SCENARIOS: SCENARIOS, SEED_TENANTS: SEED_TENANTS, TERMS: TERMS,
    PLAN_TERMS: PLAN_TERMS, SEED_TENANT_ID: SEED_TENANT_ID,
    SEED_PEOPLE: SEED_PEOPLE, SEED_GROUPS: SEED_GROUPS, SEED_COURSE_MAPPINGS: SEED_COURSE_MAPPINGS,
    grouping: grouping, course: course, experiment: experiment,
    coursesInGrouping: coursesInGrouping, experimentsInCourse: experimentsInCourse,
    experimentsInGrouping: experimentsInGrouping, contextOf: contextOf,
    term: term, technologiesInUse: technologiesInUse, sortTech: sortTech,
    norm: norm, groupingByName: groupingByName, courseByName: courseByName
  };
})();
