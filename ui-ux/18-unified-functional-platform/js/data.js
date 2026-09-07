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
   · ⚠ SEED SOURCE — since Implementation 05. `EXPERIMENTS` below is
     the seed for the canonical content pool, not the runtime pool.
     `state.contentRecords[]` is the single source of truth; it is
     seeded from this array as EXISTING PUBLISHED CONTENT and is then
     owned by the content production chain (Vendor → Academic Reviewer
     → Content Manager → Published). See the pool note further down.
   · Learning Outcomes are academically owned by the Academic Reviewer
     (STK31-08). The outcomes seeded below are the published outcomes of
     existing catalogue content; from Implementation 05 they are edited
     only through the Academic Review workflow.
   ============================================================ */

window.XRSLP = window.XRSLP || {};

XRSLP.data = (function () {
  'use strict';

  /* One technology enum, one label set, one device sentence per format.
     Display order follows the FRD format order (Web · VR · MR · AR). */
  var TECHNOLOGIES = {
    web: { id: 'web', label: 'Web', name: 'Web',
           device: 'Runs in a standard web browser. No XR hardware required.',
           /* STK31-37: Web is a HOSTED experience represented by a link;
              AR / VR / MR are authorised, downloadable packages. The
              MECHANISM stays unselected (PM-05 / QT-01) — these two
              values describe the packaging only. */
           delivery: 'hosted',
           deliveryLabel: 'Hosted experience — opened from the platform',
           requirement: 'A modern, supported web browser on a laptop, desktop or tablet.' },
    vr:  { id: 'vr', label: 'VR', name: 'Virtual Reality',
           device: 'Runs on supported VR headsets provisioned for the institution.',
           delivery: 'package',
           deliveryLabel: 'Authorised package — installed on a supported device',
           requirement: 'A compatible VR headset provisioned by your institution.' },
    mr:  { id: 'mr', label: 'MR', name: 'Mixed Reality',
           device: 'Runs on supported MR hardware provisioned by the institution.',
           delivery: 'package',
           deliveryLabel: 'Authorised package — installed on a supported device',
           requirement: 'Compatible MR hardware provisioned by your institution.' },
    ar:  { id: 'ar', label: 'AR', name: 'Augmented Reality',
           device: 'Runs on Android and iOS mobile devices with AR support.',
           delivery: 'package',
           deliveryLabel: 'Authorised package — installed on a supported device',
           requirement: 'A supported AR-capable Android or iOS mobile device.' }
  };
  var TECH_ORDER = ['web', 'vr', 'mr', 'ar'];

  /* Programme / Department — one terminology-neutral grouping level (ND-02).

     ⚠ SEED SOURCE — since Implementation 07.1. `GROUPINGS` and `COURSES`
     below are the SEED for the canonical academic structure, not the
     runtime structure. `state.groupings[]` / `state.courses[]` are the
     single source of truth; they are seeded from these two arrays and
     are then owned by the Super Admin's Academic-structure surface
     (open decision D3 — CREATE first, retire deliberately separate).
     The lookups further down resolve through `structureResolver`, so a
     Programme or Course added on the platform reaches the public
     catalogue, the Vendor's Course chooser, role governance and the
     tenant CSV mapping with no call-site change. */
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

  /* `code` is the CANONICAL / OFFICIAL Course Code (Implementation 07.2,
     stakeholder-confirmed): platform master data owned primarily by the
     Content Manager, with the Super Admin also holding access to it. It
     is DELIBERATELY BLANK in the seed — no official code has been
     supplied for these sample Courses, and inventing one would put
     fabricated institutional data on the public catalogue. Blank is a
     legitimate, permanent state; nothing in the build resolves by code.

     It is NOT the tenant's local course code. That stays where it has
     always been, on `courseMappings[].localCode`, scoped to one
     institution, and a Tenant Admin cannot reach this field. */
  var COURSES = [
    { id: 'soil-mechanics', groupingId: 'civil-engineering', name: 'Soil Mechanics', code: '',
      summary: 'Shear strength and consolidation behaviour of soils, studied through simulated laboratory testing.' },
    { id: 'surveying', groupingId: 'civil-engineering', name: 'Surveying', code: '',
      summary: 'Field surveying instruments and procedures practised in a simulated environment.' },
    { id: 'structural-analysis', groupingId: 'civil-engineering', name: 'Structural Analysis', code: '',
      summary: 'Behaviour of loaded structural members observed through simulated experiments.' },
    { id: 'strength-of-materials', groupingId: 'mechanical-engineering', name: 'Strength of Materials', code: '',
      summary: 'Mechanical behaviour of materials under torsion and other loading conditions.' },
    { id: 'fluid-mechanics', groupingId: 'mechanical-engineering', name: 'Fluid Mechanics', code: '',
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
     LEARNING RESOURCES — PROTOTYPE SAMPLE CONTENT (FRD 3.1.2).

     Read-only study material attached to an Experiment. Resources are
     EXPERIMENT-LEVEL, not technology-level (09_STUDENT_LEARNING_
     PROGRESS_MODEL.md §3, rule 4): the same preparation applies
     whichever technology the student runs.

     ⚠ Deliberately no external URLs and no uploaded files. The real
     product carries PDF notes and instructional video; inventing a
     link or a binary here would be a dead control. Each resource is
     local, readable prototype text, which is enough to prove the
     confirmed sequence resources → simulation → assessment.
     ------------------------------------------------------------ */
  var RESOURCE_KIND = {
    intro:     { label: 'Introduction',   icon: 'doc' },
    objective: { label: 'Lab objective',  icon: 'flask' },
    procedure: { label: 'Procedure',      icon: 'layers' },
    safety:    { label: 'Prerequisites',  icon: 'shield' },
    reference: { label: 'Reference notes', icon: 'doc' }
  };
  var RESOURCE_KIND_ORDER = ['intro', 'objective', 'procedure', 'safety', 'reference'];

  var LEARNING_RESOURCES = {
    'direct-shear': [
      { id: 'dsh-r1', kind: 'intro', title: 'Introduction — shear strength of soil',
        body: 'Soil fails along a plane when the shear stress on that plane exceeds the soil’s shear strength. The direct shear test measures that strength directly by forcing failure along a known horizontal plane, which makes it the simplest of the standard shear tests to interpret. Read this before opening the simulation so the readings you take have a purpose.' },
      { id: 'dsh-r2', kind: 'objective', title: 'Lab objective',
        body: 'Determine the two Mohr–Coulomb shear strength parameters of the supplied soil: the cohesion intercept c and the angle of internal friction φ. You will run the specimen at three different normal stresses, record the peak shear stress for each, and fit a failure envelope through the three points.' },
      { id: 'dsh-r3', kind: 'procedure', title: 'Procedure and preparation',
        body: 'Trim the specimen to fit the shear box and record its dimensions and mass. Assemble the two halves of the box with the alignment screws in place, seat the loading pad, and apply the first normal load. Remove the alignment screws before shearing — leaving them in is the single most common cause of an unusable result. Shear at a constant rate and record shear force against horizontal displacement until the reading peaks and falls away. Repeat at the second and third normal stresses.' },
      { id: 'dsh-r4', kind: 'safety', title: 'Prerequisites and safe practice',
        body: 'You should already be able to read a proving ring or load cell and a displacement dial gauge, and to plot a straight-line fit by hand. In a physical laboratory the loading frame carries stored energy: keep hands clear of the shear box while a load is applied, and never adjust the alignment screws under load.' },
      { id: 'dsh-r5', kind: 'reference', title: 'Reference notes — reading your results',
        body: 'Plot peak shear stress (y) against the corresponding normal stress (x) for the three runs. The slope of the best-fit line is tan φ and its intercept on the shear-stress axis is c. A clean granular soil normally gives a near-zero intercept; a measurable intercept on a clean sand usually means a bedding or alignment error rather than real cohesion.' }
    ],
    'consolidation': [
      { id: 'con-r1', kind: 'intro', title: 'Introduction — why saturated soil settles slowly',
        body: 'When load is applied to a saturated fine-grained soil the water carries it first. Settlement can only occur as that water drains out, so the soil consolidates over time rather than instantly. The consolidation test reproduces this in one dimension so the rate and magnitude of settlement can be measured.' },
      { id: 'con-r2', kind: 'objective', title: 'Lab objective',
        body: 'Apply a sequence of load increments to a saturated specimen in an oedometer, record settlement against time within each increment, and use the resulting curves to estimate the coefficient of consolidation cᵥ and the compression behaviour of the soil.' },
      { id: 'con-r3', kind: 'procedure', title: 'Procedure and preparation',
        body: 'Seat the specimen between saturated porous stones in the confining ring and flood the cell. Apply the first load increment and start the clock at the instant of loading. Take dial-gauge readings at increasing intervals — the early readings define the shape of the curve and cannot be recovered later. Leave each increment in place until primary consolidation is complete, then double the load and repeat.' },
      { id: 'con-r4', kind: 'safety', title: 'Prerequisites and safe practice',
        body: 'You should be comfortable with logarithmic plotting and with the idea of effective stress. Keep the cell topped up: allowing the specimen to dry part-way through an increment invalidates every reading that follows it.' },
      { id: 'con-r5', kind: 'reference', title: 'Reference notes — fitting the curve',
        body: 'Both standard constructions work from the settlement–time curve of a single increment: the log-time method locates the point of 50% primary consolidation, the square-root-time method locates 90%. Each gives cᵥ through the corresponding time factor and the drainage path length. Report which construction you used — the two do not give identical values.' }
    ],
    'total-station': [
      { id: 'tst-r1', kind: 'intro', title: 'Introduction — what a total station measures',
        body: 'A total station combines an electronic theodolite with an electronic distance meter. Every observation it records is three numbers: a horizontal angle, a vertical angle and a slope distance to the sighted target. Everything else — coordinates, horizontal distances, height differences — is computed from those three.' },
      { id: 'tst-r2', kind: 'objective', title: 'Lab objective',
        body: 'Set up and level the instrument correctly over a survey station, observe a set of targets, and book horizontal angles, vertical angles and slope distances well enough to reduce them to horizontal distances and height differences.' },
      { id: 'tst-r3', kind: 'procedure', title: 'Procedure and preparation',
        body: 'Set the tripod roughly over the station with the head level. Centre using the optical or laser plummet, level with the footscrews, and re-check centring — the two interact and usually need two or three passes. Enter the instrument height. Sight each target on both faces and book the readings; the mean of face-left and face-right removes most instrument collimation error.' },
      { id: 'tst-r4', kind: 'safety', title: 'Prerequisites and safe practice',
        body: 'You should be able to read angles in degrees, minutes and seconds and to convert between bearings. On a real site, never sight towards the sun through the telescope, and keep the tripod legs clear of walkways.' },
      { id: 'tst-r5', kind: 'reference', title: 'Reference notes — reducing your observations',
        body: 'Horizontal distance is the slope distance multiplied by the sine of the zenith angle; height difference uses the cosine, corrected for instrument and target heights. A misclosure that repeats consistently across a round of angles points to a booking convention error rather than an instrument fault.' }
    ],
    'beam-deflection': [
      { id: 'bdf-r1', kind: 'intro', title: 'Introduction — the elastic curve',
        body: 'A loaded beam bends into a shape that classical elastic theory can predict exactly for simple support and loading arrangements. Comparing a measured deflection profile with the predicted curve is the clearest way to see where the assumptions of that theory hold and where they do not.' },
      { id: 'bdf-r2', kind: 'objective', title: 'Lab objective',
        body: 'Measure the deflection of a simply supported beam under increasing point load at chosen positions along the span, and compare each measured value with the theoretical elastic deflection for the same arrangement.' },
      { id: 'bdf-r3', kind: 'procedure', title: 'Procedure and preparation',
        body: 'Record the span, the section dimensions and the material. Set the dial gauges at the chosen measurement positions and zero them under self-weight only. Add load in equal increments, allowing the reading to settle before each observation, and unload in the same increments to check for residual deflection.' },
      { id: 'bdf-r4', kind: 'safety', title: 'Prerequisites and safe practice',
        body: 'You should be able to compute second moment of area for a rectangular section and to use the standard deflection formulae. Do not exceed the stated maximum load for the test frame: the exercise is an elastic one and permanent set makes the remaining readings meaningless.' },
      { id: 'bdf-r5', kind: 'reference', title: 'Reference notes — comparing with theory',
        body: 'Plot measured deflection against load for each gauge position. A straight line through the origin confirms elastic behaviour; a consistent offset between measured and theoretical values usually indicates support settlement rather than an error in the theory.' }
    ],
    'torsion-test': [
      { id: 'tor-r1', kind: 'intro', title: 'Introduction — torsion of a circular shaft',
        body: 'When torque is applied to a circular shaft, each cross-section rotates relative to the next and shear stress builds up in proportion to the distance from the axis. The torsion test measures the relationship between applied torque and the resulting angle of twist.' },
      { id: 'tor-r2', kind: 'objective', title: 'Lab objective',
        body: 'Apply torque to a cylindrical specimen in increments, record the angle of twist at each stage, and determine the modulus of rigidity of the material from the elastic portion of the torque–twist relationship.' },
      { id: 'tor-r3', kind: 'procedure', title: 'Procedure and preparation',
        body: 'Measure and record the specimen diameter and gauge length. Mount the specimen so it is concentric in both chucks, zero the torque and twist readings, and apply torque in equal increments. Take readings at each increment through the elastic range, then continue to failure and examine the fracture surface.' },
      { id: 'tor-r4', kind: 'safety', title: 'Prerequisites and safe practice',
        body: 'You should be familiar with the torsion formula and with the polar second moment of area. Failure in torsion can be sudden: keep the guard in place and stand clear of the specimen once the elastic range has been passed.' },
      { id: 'tor-r5', kind: 'reference', title: 'Reference notes — finding G',
        body: 'The modulus of rigidity follows from the slope of the initial straight portion of the torque–twist plot, together with the polar second moment of area and the gauge length. A ductile specimen fails on a plane normal to its axis; a brittle one fails on a helical surface at roughly 45°, which is the direction of maximum tensile stress.' }
    ],
    'bernoulli-flow': [
      { id: 'ber-r1', kind: 'intro', title: 'Introduction — pressure and velocity in a venturi',
        body: 'Bernoulli’s principle states that along a streamline in steady, incompressible, frictionless flow the total head is constant. Where a passage narrows the flow speeds up, so velocity head rises and pressure head falls. A venturi makes that exchange directly visible.' },
      { id: 'ber-r2', kind: 'objective', title: 'Lab objective',
        body: 'Establish steady flow through a venturi, read the piezometer levels along the converging and diverging sections at several flow rates, and verify that measured total head is consistent with the value predicted by Bernoulli’s equation.' },
      { id: 'ber-r3', kind: 'procedure', title: 'Procedure and preparation',
        body: 'Prime the apparatus and clear every piezometer tube of air — a trapped bubble produces a plausible but wrong reading. Set a flow rate, wait for the levels to become steady, then read all tappings before changing anything. Record the volumetric flow rate for each set of readings.' },
      { id: 'ber-r4', kind: 'safety', title: 'Prerequisites and safe practice',
        body: 'You should be able to work in heads rather than pressures and to apply continuity between sections of different area. Keep the bench surface dry and do not exceed the rated supply pressure of the apparatus.' },
      { id: 'ber-r5', kind: 'reference', title: 'Reference notes — where the difference goes',
        body: 'Compute velocity at each tapping from continuity, add the velocity head to the measured pressure head, and compare the totals. Real total head falls slightly along the passage: the loss is friction and, in the diverging section, separation — both excluded from the ideal equation.' }
    ]
  };

  /* ------------------------------------------------------------
     ASSESSMENT — SAMPLE CONFIGURATION (Faculty-owned, STK31-30).

     ⚠ EVERY VALUE BELOW IS SAMPLE ASSESSMENT CONFIGURATION, not a
     platform rule. In the product Faculty author these — and since
     Implementation 04 they do so in this prototype too. This array is
     now the SEED SOURCE that `state.js` evolves into editable
     `assessmentDefs[]` and the first `questions[]` of the Question Bank;
     the seeded Direct Shear Test assessment a Student sits is the same
     record a Faculty member edits.

     `policy` is the answer/explanation visibility policy Faculty
     control (STK31-32). The three CONFIRMED general options are the
     only ones modelled:

         SHOW_IMMEDIATELY   · AFTER_DEADLINE   · CUSTOM_DATE

     The BITS/Taxila timing rule is NOT invented (ND-10): no fourth
     mode exists here, and no seeded assessment claims one.

     Two deliberately different policies are seeded, following the
     Batch-02 precedent, so that no single value can be mistaken for a
     platform default. Offsets are in days from the moment the
     prototype data was seeded; state.js resolves them to real dates.

     D-25 is NOT overridden: the correct-answer key is never rendered
     during an attempt, whatever the policy says.
     ------------------------------------------------------------ */
  var POLICY_MODES = {
    SHOW_IMMEDIATELY: 'Show immediately',
    AFTER_DEADLINE:   'Show after the assessment deadline',
    CUSTOM_DATE:      'Show on a set date'
  };

  var ASSESSMENTS = [
    {
      id: 'ASM-001',
      experimentId: 'direct-shear',
      title: 'Direct Shear Test — laboratory assessment',
      intro: 'Five questions on specimen preparation, the shear plane and the interpretation of a direct shear series. Answer every question, review your answers, then submit.',
      passMark: 60,
      attemptLimit: 3,
      policy: { mode: 'SHOW_IMMEDIATELY' },
      questions: [
        { id: 'q1', type: 'mcq', points: 1,
          text: 'In a direct shear test, where does failure take place?',
          options: [
            'On a plane chosen by the operator at any angle to the horizontal.',
            'On the horizontal plane forced by the split between the two halves of the shear box.',
            'On whichever plane inside the specimen happens to be weakest.',
            'On a vertical plane through the centre of the specimen.'
          ],
          answer: 1,
          explanation: 'The split between the upper and lower halves of the box forces failure onto a known horizontal plane. That is the defining feature of the test — and also its main limitation, because the forced plane is not necessarily the weakest one.' },
        { id: 'q2', type: 'mcq', points: 1,
          text: 'Which pair of parameters is obtained from a series of direct shear tests?',
          options: [
            'The coefficient of consolidation and the compression index.',
            'The cohesion intercept and the angle of internal friction.',
            'Young’s modulus and Poisson’s ratio.',
            'The permeability and the void ratio.'
          ],
          answer: 1,
          explanation: 'Plotting peak shear stress against normal stress gives the Mohr–Coulomb failure envelope. Its intercept is the cohesion c and its slope is tan φ.' },
        { id: 'q3', type: 'tf', points: 1,
          text: 'A single direct shear test at one normal stress is enough to determine both the cohesion and the angle of internal friction.',
          answer: false,
          explanation: 'One test gives one point. At least three points at different normal stresses are needed before a failure envelope can be fitted, and only the fitted envelope yields c and φ.' },
        { id: 'q4', type: 'mcq', points: 1,
          text: 'The failure envelope for the series is constructed by plotting:',
          options: [
            'Peak shear stress against the corresponding normal stress.',
            'Horizontal displacement against elapsed time.',
            'Normal stress against void ratio.',
            'Shear stress against the logarithm of time.'
          ],
          answer: 0,
          explanation: 'Each test contributes one (normal stress, peak shear stress) pair. The straight line through those pairs is the failure envelope.' },
        { id: 'q5', type: 'tf', points: 1,
          text: 'The direct shear apparatus allows pore water pressure to be measured during shearing.',
          answer: false,
          explanation: 'It does not. Drainage conditions cannot be controlled and pore pressure cannot be measured in a direct shear box — that is why a triaxial test is used when effective-stress parameters are required.' }
      ]
    },
    {
      id: 'ASM-002',
      experimentId: 'consolidation',
      title: 'Consolidation Test — laboratory assessment',
      intro: 'Three objective questions and one written answer on one-dimensional consolidation. The written answer needs evaluation before your result is complete.',
      passMark: 60,
      attemptLimit: 2,
      /* A deliberately DIFFERENT policy from ASM-001, so that neither
         value reads as a platform rule. The deadline sits 14 days after
         the prototype data was seeded, so this assessment genuinely
         withholds answers on a fresh reset. */
      policy: { mode: 'AFTER_DEADLINE', offsetDays: 14 },
      questions: [
        { id: 'q1', type: 'mcq', points: 1,
          text: 'Which apparatus is used for a standard one-dimensional consolidation test?',
          options: ['A direct shear box.', 'An oedometer (consolidometer).', 'A triaxial cell.', 'A vane shear device.'],
          answer: 1,
          explanation: 'The oedometer confines the specimen laterally in a rigid ring so that all strain is vertical, which is exactly the one-dimensional condition the theory assumes.' },
        { id: 'q2', type: 'tf', points: 1,
          text: 'Primary consolidation is complete when the excess pore water pressure has fully dissipated.',
          answer: true,
          explanation: 'Primary consolidation is the settlement caused by the drainage of excess pore water. Once that excess has dissipated, any further settlement is secondary compression of the soil skeleton.' },
        { id: 'q3', type: 'mcq', points: 1,
          text: 'The coefficient of consolidation is most commonly determined from:',
          options: [
            'The settlement–time curve for a single load increment.',
            'The final settlement of the whole test.',
            'The mass of the specimen before and after the test.',
            'The applied normal stress alone.'
          ],
          answer: 0,
          explanation: 'Both the log-time and square-root-time constructions work from the shape of one increment’s settlement–time curve. The final settlement gives compressibility, not rate.' },
        { id: 'q4', type: 'descriptive', points: 3,
          text: 'Explain why settlement readings within a single load increment are taken at increasing time intervals rather than at a constant interval.',
          guidance: 'Two or three sentences. Refer to the shape of the settlement–time curve.',
          explanation: null }
      ]
    },
    {
      id: 'ASM-003',
      experimentId: 'total-station',
      title: 'Total Station Experiment — field assessment',
      intro: 'Three questions on instrument set-up and the reduction of observations. Answer every question, review your answers, then submit.',
      passMark: 60,
      attemptLimit: 3,
      /* A third distinct policy value. The release date sits 21 days
         after seeding. */
      policy: { mode: 'CUSTOM_DATE', offsetDays: 21 },
      questions: [
        { id: 'q1', type: 'mcq', points: 1,
          text: 'Centring the instrument over the station point ensures that:',
          options: [
            'The telescope is focused at infinity.',
            'The vertical axis of the instrument passes through the station point.',
            'The horizontal circle reads zero on the first target.',
            'The battery is correctly seated.'
          ],
          answer: 1,
          explanation: 'Centring places the instrument’s vertical axis over the mark. Levelling makes that axis vertical. Both are needed, and adjusting one usually disturbs the other.' },
        { id: 'q2', type: 'tf', points: 1,
          text: 'A total station observes horizontal angles, vertical angles and slope distances.',
          answer: true,
          explanation: 'Those three are the measured quantities. Horizontal distance, height difference and coordinates are all computed from them.' },
        { id: 'q3', type: 'mcq', points: 1,
          text: 'Reducing an observed slope distance to a horizontal distance requires:',
          options: ['The instrument height only.', 'The vertical (zenith) angle.', 'The temperature only.', 'The horizontal angle.'],
          answer: 1,
          explanation: 'Horizontal distance is the slope distance resolved through the vertical angle. Instrument and target heights are needed for the height difference, not for the horizontal component.' }
      ]
    }
  ];
  /* Experiments with NO seeded assessment (beam-deflection,
     torsion-test, bernoulli-flow) are deliberate: assessment is
     OPTIONAL per FRD 3.1.2, and a Student must be able to complete an
     Experiment that carries none. */

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

  /* ---- CANONICAL CONTENT POOL — one truth (Implementation 05) ----

     `EXPERIMENTS` above is the SEED, and since Implementation 05 it is
     no longer the runtime pool. The single authoritative content source
     is `state.contentRecords[]`, which is seeded FROM that array at
     first run / migration and is then owned by the content workflow
     (Vendor -> Academic Reviewer -> Content Manager -> Published).

     `XRSLP.content` installs a resolver here at boot. Every lookup
     below therefore reads the live PUBLISHED pool, which means:

       · a newly PUBLISHED Experiment reaches the public catalogue, the
         tenant surfaces, Faculty and Student with no call-site change
         and no second catalogue (STK31-06 / the unified content model);
       · content that is NOT published cannot be reached through these
         functions at all — including by a hand-typed hash route, since
         `contextOf()` returns null and the screen resolves to notFound.

     The resolver returns null while the state layer is seeding or
     migrating (and before `content.js` loads), so those paths fall back
     to the seed array they are describing. */
  var publishedResolver = null;
  function setPublishedResolver(fn) { publishedResolver = fn; }

  /* ---- the canonical ACADEMIC STRUCTURE resolver (Implementation 07.1) ----

     Exactly the same contract as `publishedResolver` above, applied one
     level up the hierarchy. `XRSLP.state` installs it at boot; until it
     does — and while the state layer is seeding or migrating — these
     fall back to the seed arrays, which is the honest answer because a
     state under construction holds precisely the seeded structure. */
  var structureResolver = null;
  function setStructureResolver(fn) { structureResolver = fn; }
  /* `.slice()` is not decoration. These resolve to the LIVE collections in
     state, and a caller that did `data.courses().sort(...)` to tidy a
     dropdown would otherwise reorder the canonical catalogue in place and
     have it persisted on the next save — a structural change with no
     mutator, no validation and no history behind it. Handing back a fresh
     array makes the only supported way to change the structure the one
     that goes through `state.createCourse` / `state.updateCourse`. */
  function groupings() {
    var live = structureResolver ? structureResolver('groupings') : null;
    return (live || GROUPINGS).slice();
  }
  function courses() {
    var live = structureResolver ? structureResolver('courses') : null;
    return (live || COURSES).slice();
  }
  function pool() {
    var live = publishedResolver ? publishedResolver() : null;
    return live || EXPERIMENTS;
  }
  function experiments() { return pool(); }

  /* ---- lookup helpers over the canonical pool ---- */
  function grouping(id) { return groupings().filter(function (g) { return g.id === id; })[0] || null; }
  function course(id) { return courses().filter(function (c) { return c.id === id; })[0] || null; }
  function experiment(id) { return pool().filter(function (e) { return e.id === id; })[0] || null; }
  function coursesInGrouping(gid) { return courses().filter(function (c) { return c.groupingId === gid; }); }
  function experimentsInCourse(cid) { return pool().filter(function (e) { return e.courseId === cid; }); }
  function experimentsInGrouping(gid) {
    var cids = coursesInGrouping(gid).map(function (c) { return c.id; });
    return pool().filter(function (e) { return cids.indexOf(e.courseId) !== -1; });
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
    return groupings().filter(function (g) { return norm(g.name) === n; })[0] || null;
  }
  function courseByName(name, groupingId) {
    var n = norm(name);
    return courses().filter(function (c) {
      return norm(c.name) === n && (!groupingId || c.groupingId === groupingId);
    })[0] || null;
  }
  /* Technologies actually present in the sample pool — filters derive
     from this so no filter exists whose data does not exist. */
  function technologiesInUse() {
    var used = {};
    pool().forEach(function (e) { e.technologies.forEach(function (t) { used[t] = true; }); });
    return TECH_ORDER.filter(function (t) { return used[t]; });
  }
  function sortTech(list) {
    return TECH_ORDER.filter(function (t) { return list.indexOf(t) !== -1; });
  }

  /* ---- learning-side lookups ---- */
  function resourcesFor(experimentId) {
    return LEARNING_RESOURCES[experimentId] || [];
  }
  function resource(experimentId, resourceId) {
    return resourcesFor(experimentId).filter(function (r) { return r.id === resourceId; })[0] || null;
  }
  function resourceKind(kind) {
    return RESOURCE_KIND[kind] || { label: 'Resource', icon: 'doc' };
  }
  /* ⚠ SEED SOURCE ONLY — since Implementation 04.
     Faculty own assessment configuration (STK31-30), so it lives in
     mutable state, not in this file. `state.js` copies the array below
     into `assessmentDefs[]` and `questions[]` at seed and at migration,
     and NOTHING reads these two lookups at runtime: the Student engine
     and the Faculty workspace both go through
     `state.assessmentForTenant()`. They are kept because the seed and
     the migration use them, and because a reader arriving at this file
     should be able to resolve what the sample data describes.

     One seeded assessment per Experiment at most. An Experiment with
     none is a valid, deliberate state — assessment is optional. */
  function assessmentFor(experimentId) {
    return ASSESSMENTS.filter(function (a) { return a.experimentId === experimentId; })[0] || null;
  }
  function assessmentById(id) {
    return ASSESSMENTS.filter(function (a) { return a.id === id; })[0] || null;
  }
  function policyLabel(mode) { return POLICY_MODES[mode] || mode; }
  /* Objective points only — a descriptive question is never machine
     scored (STK31-31: Faculty is the only human evaluator). */
  function objectivePoints(assessment) {
    if (!assessment) { return 0; }
    return assessment.questions.reduce(function (sum, q) {
      return sum + (q.type === 'descriptive' ? 0 : (q.points || 1));
    }, 0);
  }
  function hasDescriptive(assessment) {
    return !!assessment && assessment.questions.some(function (q) { return q.type === 'descriptive'; });
  }

  return {
    TECHNOLOGIES: TECHNOLOGIES, TECH_ORDER: TECH_ORDER,
    GROUPINGS: GROUPINGS, COURSES: COURSES, EXPERIMENTS: EXPERIMENTS,
    SCENARIOS: SCENARIOS, SEED_TENANTS: SEED_TENANTS, TERMS: TERMS,
    LEARNING_RESOURCES: LEARNING_RESOURCES, RESOURCE_KIND: RESOURCE_KIND,
    RESOURCE_KIND_ORDER: RESOURCE_KIND_ORDER,
    ASSESSMENTS: ASSESSMENTS, POLICY_MODES: POLICY_MODES,
    resourcesFor: resourcesFor, resource: resource, resourceKind: resourceKind,
    assessmentFor: assessmentFor, assessmentById: assessmentById,
    policyLabel: policyLabel, objectivePoints: objectivePoints, hasDescriptive: hasDescriptive,
    PLAN_TERMS: PLAN_TERMS, SEED_TENANT_ID: SEED_TENANT_ID,
    SEED_PEOPLE: SEED_PEOPLE, SEED_GROUPS: SEED_GROUPS, SEED_COURSE_MAPPINGS: SEED_COURSE_MAPPINGS,
    experiments: experiments, setPublishedResolver: setPublishedResolver,
    groupings: groupings, courses: courses, setStructureResolver: setStructureResolver,
    grouping: grouping, course: course, experiment: experiment,
    coursesInGrouping: coursesInGrouping, experimentsInCourse: experimentsInCourse,
    experimentsInGrouping: experimentsInGrouping, contextOf: contextOf,
    term: term, technologiesInUse: technologiesInUse, sortTech: sortTech,
    norm: norm, groupingByName: groupingByName, courseByName: courseByName
  };
})();
