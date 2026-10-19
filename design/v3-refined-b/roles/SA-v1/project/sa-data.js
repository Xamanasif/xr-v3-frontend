/* XR Learning Platform · Design V3 · Super Admin complete role · scenario fixtures
   Illustrative design-preview records only. NOT canonical application data and NOT a service contract.
   Provenance for every record is listed in SCENARIOS.json. Internal references (ref) are kept for
   traceability in this file only; the Super Admin interface never renders them. */
window.SA_DATA = (function () {
  const FM = ['WEB', 'AR', 'VR', 'MR'];
  const FN = { WEB: 'Browser', AR: 'Augmented reality', VR: 'Virtual reality', MR: 'Mixed reality' };

  const SNAP = {
    oct23: { iso: '2026-10-23', long: 'Friday 23 October 2026', short: '23 Oct 2026' },
    oct08: { iso: '2026-10-08', long: 'Thursday 8 October 2026', short: '8 Oct 2026' }
  };

  /* ── requests (V3 SA02.dc.html RQ fixture, v46 B1-10/B1-11/B7-01) ─────────── */
  const REQUESTS = [
    { key: 'godavari-licences', ref: 'REQ-0058', inst: 'Godavari Institute of Technology', instId: 'godavari', contact: 'Meera Iyer', email: 'meera.iyer@godavari.edu.in', phone: 'Not given',
      type: 'Additional licences', received: '21 Oct 2026', iso: '2026-10-21', route: 'External', hasPlan: true, renewal: false,
      exps: [{ t: 'Shell-and-Tube Heat Exchanger', code: 'ME ZG523', course: 'Thermodynamics & Heat Transfer', req: ['WEB', 'VR'], pub: ['WEB', 'AR', 'VR'] }],
      lic: '60 more', licNum: '60', more: true, term: 'Current term', termFixed: true,
      existing: 'An access plan with Shell-and-Tube Heat Exchanger (WEB, VR) and 120 licences, on a yearly term from 8 Oct 2026 to 7 Oct 2027.', msg: '',
      ovT: 'Godavari Institute of Technology asks for 60 more licences', ovD: 'Its access has been active since 8 October.',
      st: { oct23: 'review' } },
    { key: 'godavari-new-access', ref: 'REQ-0042', inst: 'Godavari Institute of Technology', instId: 'godavari', contact: 'Meera Iyer', email: 'meera.iyer@godavari.edu.in', phone: 'Not given',
      type: 'New access', received: '2 Oct 2026, 10:14', iso: '2026-10-02', route: null, hasPlan: false, renewal: false,
      exps: [{ t: 'Shell-and-Tube Heat Exchanger', code: 'ME ZG523', course: 'Thermodynamics & Heat Transfer', req: ['WEB', 'VR'], pub: ['WEB', 'AR', 'VR'] }],
      lic: '120', licNum: '120', term: 'Yearly',
      existing: 'None. There is no institution record for Godavari Institute of Technology yet. Approving this request creates the record; it does not activate access.',
      msg: 'We would like to start with the heat exchanger lab for our ME ZG523 cohort this term, in the browser and in VR.',
      ovT: 'Godavari Institute of Technology asks for new access', ovD: 'Shell-and-Tube Heat Exchanger in WEB and VR, 120 licences, yearly.',
      st: { oct08: 'review', oct23: 'active' },
      base: { oct23: { decided: 'active', choice: 'approve', route: 'External', when: '8 Oct 2026, 11:20', paid: '8 Oct 2026, 15:05' } } },
    { key: 'krishna-new-access', ref: 'REQ-0041', inst: 'Krishna College of Engineering', instId: null, contact: 'S. Pillai', type: 'New access', received: '30 Sep 2026', iso: '2026-09-30', route: null, hasPlan: false, renewal: false, expCount: 3,
      st: { oct08: 'info', oct23: 'info' }, base: { all: { decided: 'info', choice: 'info' } } },
    { key: 'konark-licences', ref: 'REQ-0040', inst: 'Konark Polytechnic', instId: 'konark', contact: 'R. Bhatt', email: 'r.bhatt@konarkpoly.edu.in', phone: '+91 674 000 0000',
      type: 'Additional licences', received: '29 Sep 2026, 12:37', iso: '2026-09-29', route: 'External', hasPlan: true, renewal: false,
      exps: [{ t: 'Buck Converter Ripple', code: 'EEE ZG512', course: 'Power Electronics', req: ['WEB', 'AR'], pub: ['WEB', 'AR'] }],
      lic: '60 more', licNum: '60', more: true, term: 'Current term', termFixed: true,
      existing: 'An access plan with Buck Converter Ripple (WEB, AR) and 180 licences, on a quarterly term that ends on 2 Nov 2026.', msg: 'A second section has joined the course.',
      ovT: 'Konark Polytechnic asks for 60 more licences', ovD: 'Additional licences for Buck Converter Ripple.',
      st: { oct08: 'review', oct23: 'review' } },
    { key: 'hyderabad-new-access', ref: 'REQ-0039', inst: 'BITS Pilani — Hyderabad Campus', instId: 'bitshyd', contact: 'A. Menon', email: 'a.menon@hyderabad.bits-pilani.ac.in', phone: 'Not given',
      type: 'New access', received: '26 Sep 2026', iso: '2026-09-26', route: 'Internal', hasPlan: true, renewal: false, expCount: 2,
      existing: 'The campus also holds an access plan with 3 experiments and 860 licences. Its current term ends on 31 Oct 2026, and its renewal is under review.',
      st: { oct08: 'active', oct23: 'active' }, base: { all: { decided: 'active', choice: 'approve' } } },
    { key: 'hyderabad-renewal', ref: 'REQ-0038', inst: 'BITS Pilani — Hyderabad Campus', instId: 'bitshyd', contact: 'A. Menon', email: 'a.menon@hyderabad.bits-pilani.ac.in', phone: 'Not given',
      type: 'Renewal', received: '24 Sep 2026, 16:02', iso: '2026-09-24', route: 'Internal', hasPlan: true, renewal: true,
      exps: [
        { t: 'Composite Wall Conduction', code: 'ME ZG523', course: 'Thermodynamics & Heat Transfer', req: ['WEB', 'AR'], pub: ['WEB', 'AR'] },
        { t: 'Fin-Tube Bundle', code: 'ME ZG523', course: 'Thermodynamics & Heat Transfer', req: ['WEB', 'VR'], pub: ['WEB', 'VR'] },
        { t: 'Investment Casting', code: 'MEL ZG512', course: 'Manufacturing Processes', req: ['WEB'], pub: ['WEB'] }],
      lic: '860', licNum: '860', term: 'Yearly',
      existing: 'The current access plan holds these 3 experiments and 860 licences. Its current term ends on 31 Oct 2026.', msg: 'Renewal for the next academic year, same experiments.',
      ovT: 'BITS Pilani — Hyderabad Campus asks to renew its access', ovD: 'Same 3 experiments and 860 licences for the next academic year. Access ends on 31 October.',
      st: { oct08: 'review', oct23: 'review' } },
    { key: 'vizag-new-access', ref: 'REQ-0037', inst: 'Vizag Polytechnic', instId: 'vizag', contact: 'K. Rao', type: 'New access', received: '22 Sep 2026', iso: '2026-09-22', route: 'External', hasPlan: false, renewal: false,
      exps: [{ t: 'Distillation Column', req: ['WEB', 'VR'] }], st: { oct08: 'pay', oct23: 'pay' }, base: { all: { decided: 'pay', choice: 'approve' } } },
    { key: 'sahyadri-licences', ref: 'REQ-0036', inst: 'Sahyadri Institute of Engineering', instId: 'sahyadri', contact: 'N. Joshi', type: 'Additional licences', received: '18 Sep 2026', iso: '2026-09-18', route: 'External', hasPlan: true, renewal: false,
      exps: [{ t: 'CNC Turning Centre', req: ['MR'] }], st: { oct08: 'pend', oct23: 'pend' }, base: { all: { decided: 'pend', choice: 'approve' } } }
  ];

  /* ── institutions (v46 B7-02 IX fixture; BITS Hyderabad plan A from V3 SA02 renewal) ── */
  const INSTITUTIONS = [
    { id: 'godavari', name: 'Godavari Institute of Technology', kind: 'External', base: 'live', createdIso: '2026-10-08', ia: 'Meera Iyer', iaEmail: 'meera.iyer@godavari.edu.in', students: 12, faculty: 3, reqKey: 'godavari-new-access',
      plans: [{ key: 'p1', exps: [['Shell-and-Tube Heat Exchanger', 'ME ZG523', ['WEB', 'VR'], ['WEB', 'AR', 'VR']]], lic: '120', term: 'Yearly', startIso: '2026-10-08', endIso: '2027-10-07' }],
      report: [['Shell-and-Tube Heat Exchanger', 5, [['WEB', 4, 2], ['VR', 2, 1]]]],
      hist: [['Request for 60 more licences received', '21 Oct 2026, 16:05', 'Meera Iyer, Institute Admin', '2026-10-21'], ['Institute Admin assigned: Meera Iyer', '8 Oct 2026, 15:20', '', '2026-10-08'], ['Institutional access activated', '8 Oct 2026, 15:05', 'Payment confirmed. Access plan created.', '2026-10-08'], ['Request approved, payment required', '8 Oct 2026, 11:20', 'External · approved as requested. Institution record created.', '2026-10-08']] },
    { id: 'bitshyd', name: 'BITS Pilani — Hyderabad Campus', kind: 'Internal', base: 'live', ia: 'Dr P. Srinivas', iaEmail: 'p.srinivas@hyderabad.bits-pilani.ac.in', students: 46, faculty: 4, reqKey: 'hyderabad-new-access', renewalKey: 'hyderabad-renewal',
      plans: [
        { key: 'p1', exps: [['Composite Wall Conduction', 'ME ZG523', ['WEB', 'AR'], ['WEB', 'AR']], ['Fin-Tube Bundle', 'ME ZG523', ['WEB', 'VR'], ['WEB', 'VR']], ['Investment Casting', 'MEL ZG512', ['WEB'], ['WEB']]], lic: '860', term: 'Yearly', startIso: null, endIso: '2026-10-31' },
        { key: 'p2', exps: [['Distillation Column', 'CHE ZG513', ['WEB', 'VR'], ['WEB', 'VR']], ['Boiler Drum Level', 'CHE ZG513', ['WEB', 'VR'], ['WEB', 'VR']]], lic: '80', term: 'Monthly', startIso: '2026-10-01', endIso: '2026-10-31' }],
      report: [['Distillation Column', 46, [['WEB', 31, 12], ['VR', 9, 3]]], ['Boiler Drum Level', 38, [['WEB', 20, 6], ['VR', 4, 1]]]],
      hist: [['Renewal request received', '24 Sep 2026, 16:02', '3 experiments · internal', '2026-09-24'], ['Institutional access activated', '26 Sep 2026', 'Internal, no payment step. Access plan created for Distillation Column and Boiler Drum Level.', '2026-09-26'], ['Institute Admin assigned: Dr P. Srinivas', '26 Sep 2026', '', '2026-09-26']] },
    { id: 'konark', name: 'Konark Polytechnic', kind: 'External', base: 'live', ia: 'R. Bhatt', iaEmail: 'r.bhatt@konarkpoly.edu.in', students: 28, faculty: 2, reqKey: null,
      plans: [{ key: 'p1', exps: [['Buck Converter Ripple', 'EEE ZG512', ['WEB', 'AR'], ['WEB', 'AR']]], lic: '180', term: 'Quarterly', startIso: '2026-08-03', endIso: '2026-11-02' }],
      report: [['Buck Converter Ripple', 28, [['WEB', 22, 14], ['AR', 6, 2]]]],
      hist: [['Request for additional licences received', '29 Sep 2026, 12:37', 'R. Bhatt, contact person', '2026-09-29'], ['Institutional access activated', '3 Aug 2026', 'Payment confirmed.', '2026-08-03'], ['Institute Admin assigned: R. Bhatt', '3 Aug 2026', '', '2026-08-03']] },
    { id: 'sahyadri', name: 'Sahyadri Institute of Engineering', kind: 'External', base: 'live', ia: '', students: 0, faculty: 0, reqKey: null, noIaSinceIso: '2026-09-30',
      plans: [{ key: 'p1', exps: [['CNC Turning Centre', 'MEL ZG512', ['MR'], ['WEB', 'AR', 'VR', 'MR']]], lic: '40', term: 'Yearly', startIso: '2026-09-30', endIso: '2027-09-29' }],
      report: [],
      hist: [['Institutional access activated', '30 Sep 2026', 'Payment confirmed.', '2026-09-30'], ['Request for additional licences received', '18 Sep 2026', 'N. Joshi, contact person', '2026-09-18'], ['Request approved, payment required', '12 Sep 2026', 'External.', '2026-09-12']] },
    { id: 'vizag', name: 'Vizag Polytechnic', kind: 'External', base: 'payment', ia: '', students: 0, faculty: 0, reqKey: 'vizag-new-access', requested: [['Distillation Column', 'CHE ZG513', ['WEB', 'VR']]], reqLic: '50',
      plans: [], report: [],
      hist: [['Request approved, payment required', '22 Sep 2026', 'External · Distillation Column · WEB and VR. Institution record created.', '2026-09-22'], ['Request received', '22 Sep 2026', 'K. Rao, contact person', '2026-09-22']] },
    { id: 'deccan', name: 'Deccan Institute of Technology', kind: 'External', base: 'live', ia: 'S. Kulkarni', iaEmail: 's.kulkarni@deccan.example', students: 24, faculty: 1, reqKey: null,
      pause: { iso: '2026-10-12', when: '12 Oct 2026, 09:40', reason: 'The institution asked us to pause access while it checks its student list.' },
      plans: [{ key: 'p1', exps: [['Transformer Tests', 'EEE ZC341', ['WEB'], ['WEB']]], lic: '30', term: 'Yearly', startIso: '2026-07-14', endIso: '2027-07-13' }],
      report: [['Transformer Tests', 24, [['WEB', 19, 11]]]],
      hist: [['Access paused by Arjun Mehta', '12 Oct 2026, 09:40', '“The institution asked us to pause access while it checks its student list.”', '2026-10-12'], ['Institutional access activated', '14 Jul 2026', 'Payment confirmed.', '2026-07-14']] },
    { id: 'malnad', name: 'Malnad College of Engineering', kind: 'External', base: 'live', ia: 'V. Hegde', iaEmail: 'v.hegde@malnad.example', students: 18, faculty: 1, reqKey: null,
      plans: [{ key: 'p1', exps: [['Orifice Plate Metering', 'CHE ZG513', ['WEB', 'AR'], ['WEB', 'AR']]], lic: '20', term: 'Quarterly', startIso: '2026-07-15', endIso: '2026-10-15' }],
      report: [['Orifice Plate Metering', 18, [['WEB', 15, 9], ['AR', 3, 1]]]],
      hist: [['Access ended', '15 Oct 2026', 'No renewal was requested.', '2026-10-15'], ['Institutional access activated', '15 Jul 2026', 'Payment confirmed.', '2026-07-15']] }
  ];
  const GODAVARI_STUDENTS = [['Rahul Verma', 'GIT-2026-0418', 'active'], ['Priya Natarajan', 'GIT-2026-0431', 'active'], ['Arun Kumar', 'GIT-2026-0377', 'active'], ['Sneha Reddy', 'GIT-2026-0352', 'inactive'], ['Imran Shaikh', 'GIT-2026-0409', 'active'], ['Divya Menon', 'GIT-2026-0411', 'active'], ['Karthik Rao', 'GIT-2026-0415', 'active'], ['Lakshmi Prasad', 'GIT-2026-0421', 'active'], ['Vikram Joshi', 'GIT-2026-0426', 'active'], ['Fatima Begum', 'GIT-2026-0430', 'active'], ['Nikhil Bose', 'GIT-2026-0436', 'active'], ['Ananya Das', 'GIT-2026-0440', 'active']];

  /* ── content: experiments and submissions (v46 B7-06 CX fixture) ─────────────── */
  const CONTENT = [
    { id: 'shell-and-tube', name: 'Shell-and-Tube Heat Exchanger', course: 'ME ZG523', fmts: ['WEB', 'AR', 'VR'], st: 'published', ver: '1.0', since: '2 Jun 2026', summary: 'Vary flow rates and inlet temperatures across a two-pass exchanger, then derive the effectiveness–NTU relationship from your own readings.', outcomes: ['Determine log mean temperature difference from measured inlet and outlet conditions', 'Compare countercurrent and cocurrent arrangements at matched duty'], hist: [['Published · version 1.0', '2 Jun 2026', 'By the Content Manager.']] },
    { id: 'fin-tube', name: 'Fin-Tube Bundle', course: 'ME ZG523', fmts: ['WEB', 'VR'], st: 'published', ver: '1.0', since: '30 Jul 2026', summary: 'Introduce progressive fouling on the tube side and measure its effect on the overall heat transfer coefficient.', outcomes: ['Quantify the effect of fouling on the overall heat transfer coefficient', 'Distinguish degradation from measurement drift'], hist: [['Published · version 1.0', '30 Jul 2026', 'By the Content Manager.']] },
    { id: 'composite-wall', name: 'Composite Wall Conduction', course: 'ME ZG523', fmts: ['WEB', 'AR'], st: 'published', ver: '1.0', since: '2 Jun 2026', summary: 'Build a layered wall, measure the temperature profile and separate the contribution of each material.', outcomes: ['Measure a steady-state temperature profile across layers', 'Separate the thermal resistance of each material'], hist: [['Published · version 1.0', '2 Jun 2026', 'By the Content Manager.']] },
    { id: 'cnc-turning', name: 'CNC Turning Centre', course: 'MEL ZG512', fmts: ['WEB', 'AR', 'VR', 'MR'], st: 'published', ver: '1.0', since: '2 Jun 2026', summary: 'Work through workholding, tool registration and offset entry, then cut a test part and inspect it against tolerance.', outcomes: ['Register tool offsets against a known datum', 'Inspect a cut part against a dimensional tolerance'], hist: [['Published · version 1.0', '2 Jun 2026', 'By the Content Manager.']] },
    { id: 'investment-casting', name: 'Investment Casting', course: 'MEL ZG512', fmts: ['WEB'], st: 'published', ver: '1.0', since: '2 Jun 2026', summary: 'Sequence the shell build, dewax and burnout steps, and judge the effect of each on surface finish.', outcomes: ['Sequence shell build, dewax and burnout correctly', 'Relate each step to the resulting surface finish'], hist: [['Published · version 1.0', '2 Jun 2026', 'By the Content Manager.']] },
    { id: 'induction-motor', name: 'Induction Motor Loading', course: 'EEE ZC341', fmts: ['WEB', 'VR', 'MR'], st: 'published', ver: '1.0', since: '9 Jun 2026', updId: 'induction-motor-1-1', summary: 'Load the machine through its full range and plot torque, slip and efficiency from instrument readings you take yourself.', outcomes: ['Plot torque, slip and efficiency from your own readings', 'Identify the operating point of maximum efficiency'], hist: [['Published · version 1.0', '9 Jun 2026', 'By the Content Manager.']] },
    { id: 'synchronous-generator', name: 'Synchronous Generator', course: 'EEE ZC341', fmts: ['WEB', 'VR'], st: 'published', ver: '1.0', since: '2 Jun 2026', summary: 'Synchronise to an infinite bus, then adjust excitation and prime-mover torque to see how real and reactive power divide.', outcomes: ['Synchronise a generator to an infinite bus safely', 'Separate the effect of excitation from prime-mover torque'], hist: [['Published · version 1.0', '2 Jun 2026', 'By the Content Manager.']] },
    { id: 'transformer-tests', name: 'Transformer Tests', course: 'EEE ZC341', fmts: ['WEB'], st: 'published', ver: '1.0', since: '2 Jun 2026', summary: 'Run open and short circuit tests, separate core and copper losses and build the equivalent circuit from your measurements.', outcomes: ['Separate core losses from copper losses', 'Build an equivalent circuit from measured data'], hist: [['Published · version 1.0', '2 Jun 2026', 'By the Content Manager.']] },
    { id: 'buck-converter', name: 'Buck Converter Ripple', course: 'EEE ZG512', fmts: ['WEB', 'AR'], st: 'published', ver: '1.0', since: '2 Jun 2026', summary: 'Sweep duty cycle and load, observe inductor current ripple and compare against the continuous-conduction prediction.', outcomes: ['Relate duty cycle to output voltage', 'Identify the boundary of continuous conduction'], hist: [['Published · version 1.0', '2 Jun 2026', 'By the Content Manager.']] },
    { id: 'distillation-column', name: 'Distillation Column', course: 'CHE ZG513', fmts: ['WEB', 'VR'], st: 'published', ver: '1.2', since: '3 Jul 2026', updId: 'distillation-1-3', summary: 'Bring a binary column from cold start to steady state, tuning reflux ratio against overhead purity under realistic lag.', outcomes: ['Bring a column to steady state from cold start', 'Tune reflux ratio against an overhead purity target'], hist: [['Version 1.2 released', '3 Jul 2026', 'Released by the Super Admin.'], ['Version 1.1 released', '19 Jun 2026', ''], ['Published · version 1.0', '2 Jun 2026', 'First publication by the Content Manager.']] },
    { id: 'boiler-drum', name: 'Boiler Drum Level', course: 'CHE ZG513', fmts: ['WEB', 'VR'], st: 'published', ver: '2.0', since: '18 Jun 2026', updId: 'boiler-2-1', summary: 'Tune a cascade loop against shrink and swell, then test it with a step change in steam demand.', outcomes: ['Tune a cascade loop against shrink and swell', 'Test loop performance with a step disturbance'], hist: [['Published · version 2.0', '18 Jun 2026', 'By the Content Manager.']] },
    { id: 'orifice-plate', name: 'Orifice Plate Metering', course: 'CHE ZG513', fmts: ['WEB', 'AR'], st: 'published', ver: '1.1', since: '5 Aug 2026', updId: 'orifice-1-1', summary: 'Calibrate against a reference meter and propagate instrument uncertainty into the reported flow.', outcomes: ['Calibrate against a reference meter', 'Propagate instrument uncertainty into a reported flow'], hist: [['Version 1.1 released', '5 Aug 2026', 'Released by the Super Admin.'], ['Published · version 1.0', '2 Jun 2026', 'By the Content Manager.']] },
    { id: 'conduction-composite', ref: 'SUB-0077', name: 'Conduction Through a Composite Wall', course: 'ME ZG523', fmts: ['WEB', 'VR'], st: 'published', ver: '1.0', since: '28 Aug 2026', ven: 'Northline Simulation Studio', sub: true, summary: 'Measure the temperature profile across a three-layer wall and compare it with the series-resistance model.', outcomes: ['Explain conduction through layers in series using thermal resistance.', 'Predict interface temperatures from layer properties.', 'Compare measured and predicted heat flux and explain the difference.'], hist: [['Published · version 1.0', '28 Aug 2026', 'By Kavya Nair, Content Manager.'], ['Approved by Prof. A. Menon', '27 Aug 2026', 'Academic review, revision 2.'], ['Resubmitted · revision 2', '26 Aug 2026', 'From Anil Shetty, Northline Simulation Studio.'], ['Returned to the vendor by Prof. A. Menon', '19 Aug 2026', 'Revision 1.']] },
    { id: 'dc-motor', ref: 'SUB-0085', name: 'DC Motor Speed Control', course: 'EEE ZC341', fmts: ['WEB'], st: 'review', sinceIso: '2026-10-02', where: 'With the Academic Reviewer since 2 Oct 2026', ven: 'Meridian Virtual Labs', venWho: 'Ritu Sharma · Meridian Virtual Labs', sub: true, summary: 'Close a speed loop around a DC motor and tune it against load steps.', outcomes: [], hist: [['Submitted for academic review', '2 Oct 2026', 'Revision 1 · from Ritu Sharma, Meridian Virtual Labs'], ['Draft started', '22 Sep 2026', 'Ritu Sharma, Meridian Virtual Labs']] },
    { id: 'flash-distillation', ref: 'SUB-0086', name: 'Flash Distillation', course: 'CHE ZG513', fmts: ['WEB'], st: 'review', where: 'With the Academic Reviewer since 24 Aug 2026', ven: 'Meridian Virtual Labs', sub: true, summary: 'Flash a hot binary feed across a valve into a drum and find the vapour fraction from your own readings.', outcomes: [], hist: [['Submitted for academic review', '24 Aug 2026', 'Revision 1 · from Meridian Virtual Labs']] },
    { id: 'venturi-meter', ref: 'SUB-0071', name: 'Venturi Meter Calibration', course: 'CHE ZG513', fmts: ['WEB', 'AR'], st: 'review', where: 'Back with the Academic Reviewer for a re-check since 25 Aug 2026', ven: 'Meridian Virtual Labs', sub: true, summary: 'Calibrate a Venturi meter against a weigh tank and find its discharge coefficient.', outcomes: [], hist: [['Sent back to the Academic Reviewer for a re-check', '25 Aug 2026', 'By Kavya Nair, Content Manager.'], ['Approved by Prof. A. Menon', '18 Aug 2026', '']] },
    { id: 'transient-cooling', ref: 'SUB-0074', name: 'Transient Cooling', course: 'ME ZG523', fmts: ['WEB'], st: 'cm', where: 'With the Content Manager since 14 Aug 2026', who: 'Kavya Nair · Content Manager', ven: 'Northline Simulation Studio', sub: true, summary: 'Cool a heated cylinder in still air and water, and test when the lumped-capacitance model holds.', outcomes: [], hist: [['Approved by Prof. A. Menon', '14 Aug 2026', 'With the Content Manager for a publication decision.']] },
    { id: 'packed-bed', ref: 'SUB-0070', name: 'Packed Bed Pressure Drop', course: 'CHE ZG513', fmts: ['WEB', 'AR'], st: 'cm', where: 'With the Content Manager since 21 Aug 2026', who: 'Kavya Nair · Content Manager', ven: 'Meridian Virtual Labs', sub: true, summary: 'Push air through a packed bed and compare the pressure drop you measure with the Ergun equation.', outcomes: [], hist: [['Approved by Prof. A. Menon', '21 Aug 2026', 'With the Content Manager for a publication decision.']] },
    { id: 'forced-convection', ref: 'SUB-0081', name: 'Forced Convection', course: 'ME ZG523', fmts: ['WEB', 'AR'], st: 'vendor', where: 'Returned to the vendor on 24 Aug 2026', who: 'Anil Shetty · Northline Simulation Studio', ven: 'Northline Simulation Studio', sub: true, summary: 'Blow air across a heated plate and relate the heat transfer coefficient to the air speed.', outcomes: [], hist: [['Returned to the vendor by Prof. A. Menon', '24 Aug 2026', 'With a reason the vendor can see.']] }
  ];

  /* ── corrections to published content (v46 B7-05 UX fixture) ─────────────────── */
  const UPDATES = [
    { id: 'distillation-1-3', ref: 'UPD-0005', exp: 'distillation-column', name: 'Distillation Column', course: 'CHE ZG513', from: '1.2', to: '1.3', st: 'awaiting', apprIso: '2026-08-27', appr: '27 Aug 2026, 11:20', by: 'Prof. A. Menon',
      why: 'Corrects the reflux statement in the description: raising the reflux ratio raises overhead purity — v1.2 says the opposite. The web link moves to build 1.3, which carries the same correction in its on-screen notes.',
      cm: 'Kavya Nair',
      changes: [['Description', 'Learners start a binary column from cold and bring it to steady state. They then change the reflux ratio and watch the overhead purity respond with realistic lag. Lowering the reflux ratio raises the overhead purity, at the cost of more reboiler heat.', 'Learners start a binary column from cold and bring it to steady state. They then change the reflux ratio and watch the overhead purity respond with realistic lag. Raising the reflux ratio raises the overhead purity, at the cost of more reboiler heat.'], ['Web link', 'https://labs.meridian.example/distillation-column', 'https://labs.meridian.example/distillation-column-1-3']],
      hist: [['Approved by Prof. A. Menon', '27 Aug 2026, 11:20', 'With the Super Admin for a release decision. The live version stays 1.2 until then.'], ['Sent for academic review', '25 Aug 2026, 16:00', 'To Prof. A. Menon. The live version 1.2 is unchanged.'], ['Correction started from the published experiment', '25 Aug 2026, 15:40', 'By Kavya Nair, Content Manager. Pre-filled with the live version 1.2.']] },
    { id: 'boiler-2-1', ref: 'UPD-0004', exp: 'boiler-drum', name: 'Boiler Drum Level', course: 'CHE ZG513', from: '2.0', to: '2.1', st: 'hold', apprIso: '2026-08-14', appr: '14 Aug 2026', by: 'Prof. A. Menon', cm: 'Kavya Nair',
      hold: { when: '20 Aug 2026', reason: '' },
      why: '', changes: [],
      hist: [['Put on hold by Arjun Mehta', '20 Aug 2026', 'Version 2.0 stays live.'], ['Approved by Prof. A. Menon', '14 Aug 2026', 'With the Super Admin for a release decision.']] },
    { id: 'orifice-1-1', ref: 'UPD-0003', exp: 'orifice-plate', name: 'Orifice Plate Metering', course: 'CHE ZG513', from: '1.0', to: '1.1', st: 'released', apprIso: '2026-07-30', appr: '30 Jul 2026', by: 'Prof. A. Menon', cm: 'Kavya Nair', rel: '5 Aug 2026', why: '', changes: [],
      hist: [['Released by Arjun Mehta', '5 Aug 2026', 'Version 1.1 is live for everyone. Version 1.0 is kept as Live before.'], ['Approved by Prof. A. Menon', '30 Jul 2026', '']] },
    { id: 'induction-motor-1-1', ref: 'UPD-0006', exp: 'induction-motor', name: 'Induction Motor Loading', course: 'EEE ZC341', from: '1.0', to: '1.1', st: 'returned', notForSA: true, appr: '', by: '', cm: 'Kavya Nair', why: '', changes: [], hist: [] }
  ];

  /* ── platform roles (v46 B7-08 RX fixture) ───────────────────────────────────── */
  const HOLDERS = [
    { id: 'anil-shetty', tab: 'vendors', role: 'Vendor', name: 'Anil Shetty', org: 'Northline Simulation Studio', email: 'anil.shetty@northline.example', since: '4 Jul 2026', sinceIso: '2026-07-04',
      scope: [{ kind: 'course', v: 'ME ZG523', st: 'active', when: '4 Jul 2026' }, { kind: 'course', v: 'MEL ZG512', st: 'withdrawn', when: '15 Aug 2026', reason: 'Manufacturing Processes content is being produced in-house this term.' }],
      hist: [['Scope withdrawn: MEL ZG512', '15 Aug 2026', '“Manufacturing Processes content is being produced in-house this term.” · Arjun Mehta'], ['Registered as Vendor', '4 Jul 2026', 'Arjun Mehta · scope ME ZG523, MEL ZG512']] },
    { id: 'ritu-sharma', tab: 'vendors', role: 'Vendor', name: 'Ritu Sharma', org: 'Meridian Virtual Labs', email: 'ritu.sharma@meridian.example', since: '1 Aug 2026', sinceIso: '2026-08-01',
      scope: [{ kind: 'course', v: 'CHE ZG513', st: 'active', when: '1 Aug 2026' }, { kind: 'course', v: 'EEE ZC341', st: 'active', when: '20 Sep 2026' }],
      hist: [['Scope assigned: EEE ZC341', '20 Sep 2026', 'Arjun Mehta'], ['Registered as Vendor', '1 Aug 2026', 'Arjun Mehta · scope CHE ZG513']] },
    { id: 'a-menon', tab: 'reviewers', role: 'Academic Reviewer', name: 'Prof. A. Menon', org: 'BITS Pilani · WILP', email: 'a.menon@wilp.example', since: '2 Jun 2026', sinceIso: '2026-06-02',
      scope: [{ kind: 'course', v: 'ME ZG523', st: 'active', when: '2 Jun 2026' }, { kind: 'course', v: 'MEL ZG512', st: 'active', when: '2 Jun 2026' }, { kind: 'course', v: 'CHE ZG513', st: 'active', when: '2 Jun 2026' }, { kind: 'course', v: 'EEE ZC341', st: 'withdrawn', when: '1 Oct 2026', reason: 'Electrical Machines reviews move to a reviewer from the electrical faculty.' }],
      hist: [['Scope withdrawn: EEE ZC341', '1 Oct 2026', '“Electrical Machines reviews move to a reviewer from the electrical faculty.” · Arjun Mehta'], ['Registered as Academic Reviewer', '2 Jun 2026', 'Arjun Mehta · scope ME ZG523, MEL ZG512, CHE ZG513, EEE ZC341']] },
    { id: 'k-iyer', tab: 'reviewers', role: 'Academic Reviewer', name: 'Dr K. Iyer', org: 'BITS Pilani · WILP', email: 'k.iyer@wilp.example', since: '20 Oct 2026', sinceIso: '2026-10-20', scope: [],
      hist: [['Registered as Academic Reviewer', '20 Oct 2026', 'Arjun Mehta · no scope yet']] },
    { id: 'kavya-nair', tab: 'content-managers', role: 'Content Manager', name: 'Kavya Nair', org: 'BITS Pilani · WILP', email: 'kavya.nair@wilp.example', since: '2 Jun 2026', sinceIso: '2026-06-02',
      scope: [{ kind: 'all', v: 'All experiments', st: 'active', when: '2 Jun 2026' }],
      hist: [['Registered as Content Manager', '2 Jun 2026', 'Arjun Mehta · scope All experiments']] }
  ];

  /* ── academic structure (v46 B7-07 AX fixture) ───────────────────────────────── */
  const AREAS = [
    { id: 'mechanical', name: 'Mechanical & Manufacturing', desc: 'Heat transfer, thermodynamics and manufacturing processes.', hist: [['Area in use', '2 Jun 2026', 'Shown in the public explorer and catalogue.']] },
    { id: 'electrical', name: 'Electrical & Electronics', desc: 'Electrical machines, transformers and power electronics.', hist: [['Area in use', '2 Jun 2026', 'Shown in the public explorer and catalogue.']] },
    { id: 'chemical', name: 'Chemical & Process', desc: 'Distillation, process control and flow measurement.', hist: [['Area in use', '2 Jun 2026', 'Shown in the public explorer and catalogue.']] }
  ];
  const COURSES = [
    { id: 'me-zg523', code: 'ME ZG523', name: 'Thermodynamics & Heat Transfer', area: 'mechanical', desc: 'Laboratory experiments covering conduction, convection and exchanger performance. Learners take their own instrument readings under realistic operating conditions.', people: { students: 12, faculty: ['Dr S. Ranganathan — Godavari'], note: '12 students and a Faculty member at Godavari Institute of Technology' }, hist: [['Platform code ME ZG523 set by the Content Manager', '2 Jun 2026', ''], ['Course in use', '2 Jun 2026', '']] },
    { id: 'mel-zg512', code: 'MEL ZG512', name: 'Manufacturing Processes', area: 'mechanical', desc: 'Machining and casting experiments that relate process settings to the parts they produce.', people: { students: 0, faculty: [] }, hist: [['Platform code MEL ZG512 set by the Content Manager', '2 Jun 2026', ''], ['Course in use', '2 Jun 2026', '']] },
    { id: 'fluid-mechanics', code: '', name: 'Fluid Mechanics', area: 'mechanical', desc: 'Flow measurement and pipe-flow experiments (course added; no experiments yet).', people: { students: 0, faculty: [] }, hist: [['Course added by Arjun Mehta', '24 Aug 2026', 'Mechanical & Manufacturing · no platform code yet.']] },
    { id: 'eee-zc341', code: 'EEE ZC341', name: 'Electrical Machines', area: 'electrical', desc: 'Motor, generator and transformer experiments built around readings learners take themselves.', people: { students: 24, faculty: ['1 Faculty member — Deccan'], note: '24 students and a Faculty member at Deccan Institute of Technology' }, hist: [['Platform code EEE ZC341 set by the Content Manager', '2 Jun 2026', ''], ['Course in use', '2 Jun 2026', '']] },
    { id: 'eee-zg512', code: 'EEE ZG512', name: 'Power Electronics', area: 'electrical', desc: 'Converter experiments that connect switching behaviour to measured waveforms.', people: { students: 28, faculty: ['2 Faculty members — Konark'], note: '28 students and 2 Faculty members at Konark Polytechnic' }, hist: [['Platform code EEE ZG512 set by the Content Manager', '2 Jun 2026', ''], ['Course in use', '2 Jun 2026', '']] },
    { id: 'che-zg513', code: 'CHE ZG513', name: 'Process Instrumentation & Control', area: 'chemical', desc: 'Column, loop and metering experiments under realistic process lag and uncertainty.', people: { students: 46, faculty: ['4 Faculty members — BITS Pilani — Hyderabad Campus'], note: '46 students and 4 Faculty members at BITS Pilani — Hyderabad Campus' }, hist: [['Platform code CHE ZG513 set by the Content Manager', '2 Jun 2026', ''], ['Course in use', '2 Jun 2026', '']] }
  ];

  /* ── operations: device transfers (v46 B3-11 / B7-09) and support (v46 B7-09 SP) ── */
  const TRANSFERS = [
    { id: 'neha-kulkarni-vr', ref: 'DTR-0016', student: 'Neha Kulkarni', instId: 'bitshyd', inst: 'BITS Pilani — Hyderabad Campus', fmt: 'VR', st: 'forwarded', fwdIso: '2026-10-21', fwd: '21 Oct 2026', fwdBy: 'Dr P. Srinivas, Institute Admin',
      hist: [['Forwarded to BITS', '21 Oct 2026', 'By Dr P. Srinivas, Institute Admin.']] },
    { id: 'rahul-verma-vr', ref: 'DTR-0018', student: 'Rahul Verma', studentNo: 'GIT-2026-0418', instId: 'godavari', inst: 'Godavari Institute of Technology', fmt: 'VR', exp: 'Shell-and-Tube Heat Exchanger', st: 'forwarded', fwdIso: '2026-10-23', fwd: '23 Oct 2026, 10:00', fwdBy: 'Meera Iyer, Institute Admin',
      from: 'ME lab VR headset, asset tag GIT-VR-03', to: 'ME lab VR headset, asset tag GIT-VR-07', note: 'GIT-VR-03 has gone for repair; the lab gave me GIT-VR-07.',
      hist: [['Forwarded to BITS', '23 Oct 2026, 10:00', 'By Meera Iyer, Institute Admin.'], ['Transfer requested', '22 Oct 2026, 09:10', 'By Rahul Verma, Student.']] },
    { id: 'imran-shaikh-vr', ref: 'DTR-0019', student: 'Imran Shaikh', instId: 'godavari', inst: 'Godavari Institute of Technology', fmt: 'VR', st: 'institution', hist: [] },
    { id: 'karthik-rao-vr', ref: 'DTR-0015', student: 'Karthik Rao', instId: 'godavari', inst: 'Godavari Institute of Technology', fmt: 'VR', st: 'approved', fwdIso: '2026-10-14', fwd: '14 Oct 2026', fwdBy: 'Meera Iyer, Institute Admin', apprWhen: '14 Oct 2026', apprBy: 'Arjun Mehta',
      hist: [['Approved by Arjun Mehta', '14 Oct 2026', ''], ['Forwarded to BITS', '14 Oct 2026', 'By Meera Iyer, Institute Admin.']] }
  ];
  const SUPPORT = [
    { id: 'vr-step-2', ref: 'SUP-0213', title: 'VR simulation stopped loading at step 2', who: 'Rahul Verma', role: 'Student', instId: 'godavari', instName: 'Godavari Institute of Technology', sent: '3 Oct 2026', actIso: '2026-10-03', actLabel: 'sent 3 Oct', st: 'open', what: 'The VR simulation stopped loading at the second step.', where: 'ME ZG523 · Shell-and-Tube Heat Exchanger · Simulation · VR', shot: '', hist: [['Sent', '3 Oct 2026', '']] },
    { id: 'import-part-way', ref: 'SUP-0211', title: 'Student import stopped part-way', who: 'Meera Iyer', role: 'Institute Admin', instId: 'godavari', instName: 'Godavari Institute of Technology', sent: '1 Oct 2026', actIso: '2026-10-06', actLabel: 'reopened 6 Oct', st: 'reopened', what: 'The student import stopped after 8 of 12 rows.', where: 'People · Import students', shot: 'import-stopped.png', note: 'The import now finishes. Please try the file again.', hist: [['Reopened', '6 Oct 2026', 'By the reporter.'], ['Resolved', '3 Oct 2026', '“The import now finishes. Please try the file again.”'], ['Sent', '1 Oct 2026', '']] },
    { id: 'usage-slow', ref: 'SUP-0209', title: 'Usage page took a long time to load', who: 'Meera Iyer', role: 'Institute Admin', instId: 'godavari', instName: 'Godavari Institute of Technology', sent: '30 Sep 2026', actIso: '2026-09-30', actLabel: 'sent 30 Sep', st: 'open', what: 'The Usage page took about a minute to load.', where: 'Usage', shot: '', hist: [['Sent', '30 Sep 2026', '']] },
    { id: 'preview-empty-frame', ref: 'SUP-0207', title: 'Delivery link preview showed an empty frame', who: 'Kavya Nair', role: 'Content Manager', instId: null, sent: '28 Sep 2026', actIso: '2026-10-06', actLabel: 'reopened 6 Oct', st: 'reopened', what: 'The preview of the WEB delivery link showed an empty frame.', where: 'Content library · Forced Convection', shot: '', note: 'The preview now loads. Please try again.', hist: [['Reopened', '6 Oct 2026', 'By the reporter.'], ['Resolved', '30 Sep 2026', '“The preview now loads. Please try again.”'], ['Sent', '28 Sep 2026', '']] },
    { id: 'lab-brief-blank', ref: 'SUP-0198', title: 'Lab brief link opened a blank page', who: 'Dr S. Ranganathan', role: 'Faculty', instId: 'godavari', instName: 'Godavari Institute of Technology', sent: '21 Sep 2026', actIso: '2026-09-23', actLabel: 'resolved 23 Sep', st: 'resolved', what: 'The lab brief link on the Resources tab opened a blank page.', where: 'ME ZG523 · Shell-and-Tube Heat Exchanger · Resources', shot: 'blank-page.png', note: 'The lab brief link was updated. It now opens the brief in a new tab.', resolved: '23 Sep 2026', hist: [['Resolved', '23 Sep 2026', '“The lab brief link was updated. It now opens the brief in a new tab.”'], ['Sent', '21 Sep 2026', '']] },
    { id: 'group-name', ref: 'SUP-0189', title: 'Group name didn’t save', who: 'Meera Iyer', role: 'Institute Admin', instId: 'godavari', instName: 'Godavari Institute of Technology', sent: '15 Sep 2026', actIso: '2026-09-18', actLabel: 'resolved 18 Sep', st: 'resolved', what: 'A new group name went back to the old one after saving.', where: 'People · Groups', shot: '', note: 'Fixed — group names now save straight away.', resolved: '18 Sep 2026', hist: [['Resolved', '18 Sep 2026', '“Fixed — group names now save straight away.”'], ['Sent', '15 Sep 2026', '']] }
  ];

  const COURSE_NAMES = { 'ME ZG523': 'Thermodynamics & Heat Transfer', 'MEL ZG512': 'Manufacturing Processes', 'EEE ZC341': 'Electrical Machines', 'EEE ZG512': 'Power Electronics', 'CHE ZG513': 'Process Instrumentation & Control' };

  return { FM, FN, SNAP, REQUESTS, INSTITUTIONS, GODAVARI_STUDENTS, CONTENT, UPDATES, HOLDERS, AREAS, COURSES, TRANSFERS, SUPPORT, COURSE_NAMES,
    SA: { name: 'Arjun Mehta', initials: 'AM', role: 'Super Admin', email: 'arjun.mehta@wilp.example' } };
})();
