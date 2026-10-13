/**
 * The documented sample references the flow cases use — names, board references and sample
 * values drawn on the boards and listed in Appendix C §4.1 [C] and `flows.json`. Records a case
 * creates itself are checked for their drawn id format only: the walk reserves the board
 * references for its own commands (Appendix F §4.3), so a case's new request is "REQ-nnnn", not
 * necessarily REQ-0042. Board references are used only for records an earlier flow of the walk
 * created (the `after-flow` fixtures).
 */
import {
  type AccessPlanId,
  type RequestId,
  type StudentAccessGrantId,
  unsafeBrand,
} from '@xr/domain';

export const SAMPLE = {
  /** flows.json A2; B1-07; Appendix C §4.1: REQ-0042 → ACC-0107, external, WEB + VR, 120, Yearly. */
  request: {
    institutionName: 'Godavari Institute of Technology',
    contactPerson: 'Meera Iyer',
    email: 'meera.iyer@godavari.edu.in',
    licencesRequested: '120',
  },
  /** B1-11 sample reason for "Request more information". */
  informationReason: 'Please confirm how many students will use VR in the first term.',
  experiments: {
    /** The experiment Flows A–D trace (flows.json; B2-05; B3-02). */
    shellAndTube: 'Shell-and-Tube Heat Exchanger',
    /** Published WEB + AR before the sample period (Batch-1 catalogue). */
    compositeWall: 'Composite Wall Conduction',
    /** SUB-0077, WEB · VR — a separate record (BC11; OD-B5-09). */
    compositeWallNew: 'Conduction Through a Composite Wall',
    /** UPD-0005: 1.2 → 1.3 (B6-09, B7-05). */
    distillation: 'Distillation Column',
  },
  courseCode: 'ME ZG523',
  /** B4-04: "14 Nov 2026, 23:59", sample times read as Indian local time (Appendix C §1.2). */
  assessment: {
    name: 'Heat Exchanger — post-lab',
    passMarkPercent: '50',
    attemptsAllowed: '2',
    deadline: '2026-11-14T23:59:00+05:30',
  },
  /** B3-07 sample device and note. */
  device: {
    newDevice: 'ME lab VR headset, asset tag GIT-VR-07',
    note: 'GIT-VR-03 has gone for repair; the lab gave me GIT-VR-07.',
  },
  /** Board 07 / B7-09 SUP-0213. */
  support: {
    whatHappened: 'The VR simulation stopped loading at the second step.',
    where: 'ME ZG523 · Shell-and-Tube Heat Exchanger · Simulation · VR',
    note: 'Fixed — please try again.',
  },
  /** B7-03 f2 sample pause reason. */
  pauseReason: 'The institution asked us to pause access while it checks its student list.',
} as const;

/** Board references the walk creates (WP-0.11 acceptance 2), used only on `after-flow` fixtures. */
export const WALK = {
  request: unsafeBrand<RequestId>('REQ-0042'),
  plan: unsafeBrand<AccessPlanId>('ACC-0107'),
  grant: unsafeBrand<StudentAccessGrantId>('SACC-0310'),
} as const;

/** The drawn id form of each prefix (B8-03 "Record IDs"). */
export const DRAWN = {
  request: /^REQ-\d{4}$/,
  plan: /^ACC-\d{4}$/,
  grant: /^SACC-\d{4}$/,
  assessment: /^ASMT-\d{4}$/,
  attempt: /^ATT-\d{4}$/,
  submission: /^SUB-\d{4}$/,
  update: /^UPD-\d{4}$/,
  deviceTransfer: /^DTR-\d{4}$/,
  supportReport: /^SUP-\d{4}$/,
} as const;
