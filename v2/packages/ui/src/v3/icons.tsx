import { ICON_PATHS } from '../icons/registry.js';
import { joinClasses } from '../internal/classes.js';

/**
 * The line icons the Refined Direction B boards draw (foundation XR-V3-RB-1.0): the nav icons
 * inline in each rail, and the `rbi-*` / `rki-*` symbols of SA01, SA02, IA01 and IA02, plus the
 * ones the Entry & shared export (XS-v6) draws in its sign-in card, account menu, Help pages and
 * messages, the Super Admin export (SA-v1) in its sprite, the Vendor export (VE-v1) in its
 * `vei-*` symbols, the Content Manager export (CM-v1) in its `cmi-*` symbols, the Academic
 * Reviewer export (RV-v1) in its rail and its `rvi-*` symbols, the Institute Admin export (IA-v1)
 * in its rail and its `rbi-*` / `rki-*` sprite, the Faculty export (FA-v1) in its `fai-*`
 * sprite and the Student export (ST-v1) in its `sti-*` sprite. Thirty-nine are the very paths of
 * the v46 registry (taken from it, so the two never drift); the others are new to V3.
 * `primitives.test.tsx` checks every path against the board or export that draws it.
 */
export const V3_ICON_PATHS = {
  // Shared with the v46 registry (identical paths).
  overview: ICON_PATHS.overview,
  institutions: ICON_PATHS.institutions,
  content: ICON_PATHS.content,
  academicStructure: ICON_PATHS.academicStructure,
  platformRoles: ICON_PATHS.platformRoles,
  operations: ICON_PATHS.operations,
  help: ICON_PATHS.help,
  menu: ICON_PATHS.menu,
  close: ICON_PATHS.close,
  add: ICON_PATHS.add,
  contentAccess: ICON_PATHS.contentAccess,
  studentAccess: ICON_PATHS.studentAccess,
  people: ICON_PATHS.studentsPeople,
  // The Student export's rail (ST-v1 `StudentFinal.dc.html` `sti-home`, `sti-book`, `sti-clip`,
  // `sti-bars`): the v46 Student sidebar's own glyphs, path for path.
  home: ICON_PATHS.home,
  myCourses: ICON_PATHS.myCourses,
  assessments: ICON_PATHS.assessments,
  progress: ICON_PATHS.progress,
  requests: ICON_PATHS.requests,
  usage: ICON_PATHS.usage,
  chevronDown: ICON_PATHS.chevronDown,
  check: ICON_PATHS.done,
  alertCircle: ICON_PATHS.failed,
  alertTriangle: ICON_PATHS.warning,
  clock: ICON_PATHS.clock,
  pauseCircle: ICON_PATHS.paused,
  ended: ICON_PATHS.notAvailable,
  // Shared with the v46 registry, drawn by the Vendor export (VE-v1): the information mark of its
  // notes, the arrow of a return's references and My experiments' flask.
  infoNote: ICON_PATHS.info,
  next: ICON_PATHS.next,
  myExperiments: ICON_PATHS.myExperiments,
  // Shared with the v46 registry, drawn by the Content Manager export (CM-v1 `cmi-*` symbols): its
  // rail (Ready to publish, Content library, Updates, Course codes) and "View the public page".
  readyToPublish: ICON_PATHS.readyToPublish,
  contentLibrary: ICON_PATHS.contentLibrary,
  updates: ICON_PATHS.updates,
  courseCodes: ICON_PATHS.courseCodes,
  externalLink: ICON_PATHS.externalLink,
  // Shared with the v46 registry, drawn by the Academic Reviewer export (RV-v1 `RV.dc.html` rail):
  // Review queue's list.
  reviewQueue: ICON_PATHS.reviewQueue,
  // Shared with the v46 registry, drawn by the XS export (XS-v6).
  back: ICON_PATHS.back,
  signOut: ICON_PATHS.signOut,
  retry: ICON_PATHS.retry,
  checkCircle: ICON_PATHS.reviewedByMe,
  // New in Refined Direction B.
  inbox: 'M4 13l2.5-7h11L20 13v6H4zM4 13h5l1.5 2h3L15 13h5',
  calendar:
    'M8 3v3M16 3v3M4 9h16M20 11V6a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h6M17.5 21a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM17.5 16v1.6l1 .9',
  edit: 'M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4',
  headset:
    'M3 9.5A2.5 2.5 0 0 1 5.5 7h13A2.5 2.5 0 0 1 21 9.5v5a2.5 2.5 0 0 1-2.5 2.5h-3.3a2 2 0 0 1-1.7-1l-.7-1.2a1 1 0 0 0-1.7 0l-.7 1.2a2 2 0 0 1-1.7 1H5.5A2.5 2.5 0 0 1 3 14.5z',
  lifebuoy:
    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5.6 5.6l3.9 3.9M14.5 14.5l3.9 3.9M18.4 5.6l-3.9 3.9M9.5 14.5l-3.9 3.9',
  userMinus:
    'M15 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-4A3.5 3.5 0 0 0 4 17.5V19M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM16.5 11h5',
  hourglass: 'M6 3h12M6 21h12M7 3v3a5 5 0 0 0 10 0V3M7 21v-3a5 5 0 0 1 10 0v3',
  userQuestion:
    'M15 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-4A3.5 3.5 0 0 0 4 17.5V19M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM17.5 8.5a2 2 0 1 1 2.6 1.9c-.6.2-.6.7-.6 1.1M20 14.5h.01',
  faculty: 'M3 9l9-4 9 4-9 4-9-4zM7 11v4.5c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V11M21 9v5',
  search: 'M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15zM16 16l5 5',
  chevronRight: 'M9.5 6l6 6-6 6',
  filter: 'M4 6h10M18 6h2M16 4v4M4 12h3M11 12h9M9 10v4M4 18h11M19 18h1M17 16v4',
  arrowDown: 'M12 5v14M6 13l6 6 6-6',
  arrowUp: 'M12 19V5M6 11l6-6 6 6',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5zM12 15v2.5',
  cloudAlert: 'M7 18h10a4 4 0 0 0 .6-8 6 6 0 0 0-11.4-1.5A4.5 4.5 0 0 0 7 18zM12 11v4M12 17.5h.01',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5a7.5 7.5 0 0 1 15 0',
  // New in the XS export (XS-v6): the information disc of its notices and prototype line.
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01',
  // New in the Super Admin export (SA-v1, `sa-core.js` sprite): its own information disc, the
  // done disc of its flashes, the plain calendar, the person, the way out and the layers.
  infoDisc: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5h.01',
  okDisc: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12.5l3 3 5-6',
  calendarPlain:
    'M8 3v3M16 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z',
  person: 'M18 20v-1.5a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4V20M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  exit: 'M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l-4-4 4-4M6 12h10',
  layers: 'M12 3 3 8l9 5 9-5zM3 13l9 5 9-5',
  // New in the Vendor export (VE-v1, `Main.dc.html` `vei-*` symbols): the return arrow of a
  // returned item and the document of the sample files.
  returned: 'M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
  document: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6',
  // New in the Content Manager export (CM-v1 `cmi-cross`): a publishing check that is not met.
  cross: 'M7 7l10 10M17 7 7 17',
  // New in the Academic Reviewer export (RV-v1 `RV.dc.html` `rvi-*` symbols): the four kinds of
  // review work (`rvi-new`, `rvi-resub`, `rvi-recheck`, `rvi-update`), the delete of an outcome
  // (`rvi-trash`), a document and the preview link (`rvi-doc`, `rvi-play`), the correction's note
  // (`rvi-msg`), the whole-item and stays-live readiness lines (`rvi-layers`, `rvi-live`), the
  // queue flag (`rvi-flag`) and the two refusals (`rvi-scope`, `rvi-none`).
  kindNew: 'M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v5h5M12 11v6M9 14h6',
  kindResubmission:
    'M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h4.5M14 3l5 5v3M14 3v5h5M21 16.5a3.6 3.6 0 1 1-1.1-2.6M21 12.8v3.3h-3.3',
  kindRecheck: 'M20 11a8 8 0 0 0-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16M20 20v-4h-4',
  kindUpdate: 'M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4M14 20h6',
  trash: 'M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13M10 11v6M14 11v6',
  documentText:
    'M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v5h5M9 13h6M9 17h6',
  playDisc: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM10.2 8.6v6.8l5.4-3.4z',
  message: 'M4 5h16v11H10l-6 4zM8 9.5h8M8 12.5h5',
  layersStack: 'M12 3 3 8l9 5 9-5zM3 12.5l9 5 9-5M3 16.8l9 4.7 9-4.7',
  live: 'M12 12h.01M8.6 15.4a4.8 4.8 0 0 1 0-6.8M15.4 8.6a4.8 4.8 0 0 1 0 6.8M5.7 18.3a8.9 8.9 0 0 1 0-12.6M18.3 5.7a8.9 8.9 0 0 1 0 12.6',
  flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
  outsideScope: 'M12 3 5 6v5.5c0 4.3 3 8 7 9.5 4-1.5 7-5.2 7-9.5V6zM9.5 12.5h5',
  unavailable: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM5.6 5.6l12.8 12.8',
  // New in the Institute Admin export (IA-v1 `Main.dc.html` `rki-device`): the headset of the empty
  // Device requests list.
  device:
    'M3 8.5A2.5 2.5 0 0 1 5.5 6h13A2.5 2.5 0 0 1 21 8.5v5a2.5 2.5 0 0 1-2.5 2.5h-3l-1.5-2.5h-4L8.5 16h-3A2.5 2.5 0 0 1 3 13.5z',
  // New in the Faculty export (FA-v1 `Main.dc.html` `fai-*` symbols): the rail's My courses book
  // (`fai-book`), Assessments clipboard (`fai-clip`), Question bank stack (`fai-stack`) and Marking
  // pen (`fai-pen`, which closes its shape where `edit` draws `v4z`); a question's Edit pencil
  // (`fai-edit`), Import and Export (`fai-upload`, `fai-download`; not the v46 `download`), a draft
  // needing review (`fai-draft`), the student view and the answer key of a preview (`fai-eye`, not
  // the v46 `eye`; `fai-key`) and a file or resource (`fai-file`).
  book: 'M5 4.5h11a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11M9 8.5h6',
  clipboardCheck:
    'M9 3.5h6v3H9zM9 5H6.5A1.5 1.5 0 0 0 5 6.5v13A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 17.5 5H15M8.8 13.5l2.2 2.2 4.2-4.6',
  stack: 'M12 3 3 7.5l9 4.5 9-4.5zM3 12l9 4.5 9-4.5M3 16.5 12 21l9-4.5',
  pen: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  pencil: 'M15 5l4 4M4 20l1-5L16 4l4 4L9 19z',
  upload: 'M12 16V4M7 9l5-5 5 5M4 20h16',
  download: 'M12 4v12M7 11l5 5 5-5M4 20h16',
  draft: 'M5 3.5h9l5 5V20.5H5zM14 3.5v5h5M8 13h8M8 17h5',
  eye: 'M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7S2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  key: 'M14.5 14.5a5 5 0 1 0-4.6-3.1L3 18.3V21h2.7l1-1V18h2v-2h2l.9-.9a5 5 0 0 0 2.9-.6zM16.5 7.5h.01',
  file: 'M6 3h8l5 5v13H6zM14 3v5h5',
  // New in the Student export (ST-v1 `StudentFinal.dc.html` `sti-*` symbols): the focused task
  // bar's way back (`sti-left`), the paused and ended format chips (`sti-bars2`, `sti-dash`), a
  // web page and a spreadsheet resource (`sti-web`, `sti-sheet`; a document is `documentText`),
  // the simulation, resources and feedback steps (`sti-sim`, `sti-res`, `sti-chat`; not the RV
  // `playDisc` and `message`) and a device transfer (`sti-swap`).
  chevronLeft: 'M14.5 6l-6 6 6 6',
  pauseBars: 'M9 6v12M15 6v12',
  dash: 'M7 12h10',
  globe:
    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3.5 9h17M3.5 15h17M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9M12 3C9.5 5.6 8.3 8.6 8.3 12s1.2 6.4 3.7 9',
  spreadsheet: 'M4 5h16v14H4zM4 10h16M4 15h16M10 5v14',
  simulation: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM10 8.5v7l6-3.5z',
  resources: 'M4 5h6a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h6z',
  chat: 'M4 5h16v11H9l-5 4zM8 9.5h8M8 12.5h5',
  swap: 'M7 7h12M15 3l4 4-4 4M17 17H5M9 13l-4 4 4 4',
} as const satisfies Record<string, string>;

export type V3IconName = keyof typeof V3_ICON_PATHS;

/** 20 px is the default `xr-ico`; 16 and 18 are the core.css size modifiers. */
export type V3IconSize = 16 | 18 | 20;

export interface V3IconProps {
  readonly name: V3IconName;
  readonly size?: V3IconSize;
  /** A Refined B context class (V3 classes only). */
  readonly className?: string;
}

/**
 * A Refined B line icon, always decorative (`aria-hidden`): a control that shows only an icon
 * carries its own accessible name. Markup as the boards draw it:
 * `<svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="…"/></svg>`.
 */
export function Icon({ name, size = 20, className }: V3IconProps) {
  return (
    <svg
      className={joinClasses(
        'xr-ico',
        size === 16 && 'xr-ico--16',
        size === 18 && 'xr-ico--18',
        className,
      )}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d={V3_ICON_PATHS[name]} />
    </svg>
  );
}

/**
 * The bare glyph the kit draws inside a styled box (`.rk-state-ico svg`, `.rk-notice > svg`,
 * `.rb-pi-kind svg`, …): the box's own rule sizes and strokes it, so it carries no class.
 */
export function Glyph({ name }: { readonly name: V3IconName }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={V3_ICON_PATHS[name]} />
    </svg>
  );
}
