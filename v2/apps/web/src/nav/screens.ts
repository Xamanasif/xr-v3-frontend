/**
 * The screens the workspace navigation knows about, by their handoff id
 * (design/handoff-v46/canvas-v46/project/handoff/screens.json; Appendix A §1). Only designed
 * screens appear: the 24 excluded ids get no route, link or navigation item (ADR-0005 §8). ST-13
 * (the assessment attempt) is not here: it is a focused task with no sidebar (B4-12; Phase 4).
 */
export const WORKSPACE_SCREEN_IDS = [
  // Student (ST-20 excluded; ST-13 has no sidebar)
  'ST-01',
  'ST-02',
  'ST-03',
  'ST-04',
  'ST-05',
  'ST-06',
  'ST-07',
  'ST-08',
  'ST-09',
  'ST-10',
  'ST-11',
  'ST-12',
  'ST-14',
  'ST-15',
  'ST-16',
  'ST-17',
  'ST-18',
  'ST-19',
  // Faculty (FA-13, FA-23, FA-24 excluded; FA-22 is an action on FA-12 / FA-20, not a page)
  'FA-01',
  'FA-02',
  'FA-03',
  'FA-04',
  'FA-05',
  'FA-06',
  'FA-07',
  'FA-08',
  'FA-09',
  'FA-10',
  'FA-11',
  'FA-12',
  'FA-14',
  'FA-15',
  'FA-16',
  'FA-17',
  'FA-18',
  'FA-19',
  'FA-20',
  'FA-21',
  // Institute Admin (IA-12, IA-21, IA-22 excluded)
  'IA-01',
  'IA-02',
  'IA-03',
  'IA-04',
  'IA-05',
  'IA-06',
  'IA-07',
  'IA-08',
  'IA-09',
  'IA-10',
  'IA-11',
  'IA-13',
  'IA-14',
  'IA-15',
  'IA-16',
  'IA-17',
  'IA-18',
  'IA-19',
  'IA-20',
  // Vendor (VE-10, VE-11, VE-12, VE-14, VE-15 excluded)
  'VE-01',
  'VE-02',
  'VE-03',
  'VE-04',
  'VE-05',
  'VE-06',
  'VE-07',
  'VE-08',
  'VE-09',
  'VE-13',
  // Academic Reviewer (RV-07 excluded)
  'RV-01',
  'RV-02',
  'RV-03',
  'RV-04',
  'RV-05',
  'RV-06',
  // Content Manager (CM-10 excluded; CM-06 and CM-07 open the CM-08 correction draft)
  'CM-01',
  'CM-02',
  'CM-03',
  'CM-04',
  'CM-05',
  'CM-06',
  'CM-07',
  'CM-08',
  'CM-09',
  // Super Admin (SA-04, SA-05, SA-08, SA-09, SA-23, SA-24, SA-25 excluded)
  'SA-01',
  'SA-02',
  'SA-03',
  'SA-06',
  'SA-07',
  'SA-10',
  'SA-11',
  'SA-12',
  'SA-13',
  'SA-14',
  'SA-15',
  'SA-16',
  'SA-17',
  'SA-18',
  'SA-19',
  'SA-20',
  'SA-21',
  'SA-22',
  // Shared, in every workspace shell: Not your workspace, Help & support, Not found (in shell)
  'XS-06',
  'XS-07',
  'PU-15',
] as const;

export type WorkspaceScreenId = (typeof WORKSPACE_SCREEN_IDS)[number];

/**
 * Workspace views drawn without a screen id of their own (Appendix A §4.2) that still need a
 * sidebar owner: the Student hub's Assessment tab (B4-11 f7–f9, O-01) and the Institute Admin's
 * request detail (B3-08 f4–f6, O-02).
 */
export const UNNUMBERED_VIEWS = ['student-hub-assessment', 'institute-request-detail'] as const;

export type UnnumberedView = (typeof UNNUMBERED_VIEWS)[number];

/** A screen the workspace shell can show: a screen id, or one of the two unnumbered views. */
export type ScreenKey = WorkspaceScreenId | UnnumberedView;
