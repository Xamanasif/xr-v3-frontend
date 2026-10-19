// Policy, owner-constraint, canvas and Slice-1 terms of the v46 frontend — the ONE list.
//
// Consumers:
//   1. `src/scans/*.scan.test.ts` — the static scans of Appendix F §7.6, run uncached by
//      `pnpm verify` (they read files outside this package);
//   2. `@xr/testing/browser` `expectNoDeveloperSurfaces` — the same terms in rendered DOM;
//   3. `eslint/rules/no-canvas-classes.mjs` — the canvas-only class names.
//
// A term is added only with evidence: an owner decision, a frozen v46 board or the approved
// Phase-0 plan. Each entry cites it. Where a board DRAWS a word as product copy, the term is
// scoped so the drawn copy stays legal (e.g. "Pass mark 50%" on B4-11, "licensed" on B2-02,
// "Hyderabad Campus" on B1-11, "Learners …" in B1-03 experiment descriptions, which are
// sample-world data and not product copy).

/**
 * Where a term applies, by the kind of text it is found in:
 *   'copy'       rendered words: JSX text, copy attributes (aria-label, title, alt, …),
 *                string literals in TSX and in `src/copy/**` (Appendix F §7.6);
 *   'code'       identifiers and string literals in product code (comments excluded);
 *   'identifier' identifiers only;
 *   'dom'        text and copy attributes of a rendered page.
 */

/** Owner constraint (9 Oct 2026): no DEMO banner, account or role selector, "Viewing as". */
export const DEVELOPER_SURFACE_TERMS = [
  {
    id: 'demo-wording',
    pattern: /demo(?!nstrat)/i,
    scope: ['code', 'copy', 'dom'],
    evidence:
      'Owner constraint 9 Oct 2026 (no DEMO banner); B1-09 "Never here: DEMO strips"; B8-03 "Developer / demo wording 0"; Appendix F §2.4 ("demo" naming in product-reachable code)',
  },
  {
    id: 'viewing-as',
    pattern: /viewing\s+as\b/i,
    scope: ['code', 'copy', 'dom'],
    evidence: 'B1-09 "Never here: … “Viewing as…”"; board 06 "No demo strip, no “Viewing as”"',
  },
  {
    id: 'switch-identity',
    pattern: /\bswitch[\s-]*(?:account|role|user|workspace|person|identity)s?\b/i,
    scope: ['code', 'copy', 'dom'],
    evidence: 'Owner constraint 9 Oct 2026 (no account switcher); Appendix F §7.6 "Switch account"',
  },
  {
    id: 'identity-selector',
    pattern:
      /\b(?:account|role|user|identity|persona|workspace)[\s-]*(?:switcher|selector|chooser|picker)s?\b/i,
    scope: ['code', 'copy', 'dom'],
    evidence:
      'Owner constraint 9 Oct 2026; B1-09 "Never here: … a role switcher, … a “choose a workspace” step"; ADR-0003 §5',
  },
  {
    id: 'sample-accounts',
    pattern: /\bsample[\s-]*accounts?\b/i,
    scope: ['code', 'copy', 'dom'],
    evidence: 'B1-09 "Never here: … sample accounts"; board 06 "no sample-account selector"',
  },
  {
    id: 'workspace-chooser',
    pattern: /\bchoose\s+(?:a\s+|your\s+)?workspace\b/i,
    scope: ['code', 'copy', 'dom'],
    evidence: 'B1-09 "Never here: … a “choose a workspace” step"; P0-10 (XS-02 not designed)',
  },
  {
    id: 'sign-in-as',
    pattern: /\b(?:sign|log)\s+in\s+as\b/i,
    scope: ['copy', 'dom'],
    evidence: 'ADR-0003 §5: a reviewer changes role only by signing out and signing in',
  },
  {
    id: 'impersonation',
    pattern: /impersonat/i,
    scope: ['code', 'copy', 'dom'],
    evidence: 'ADR-0003 §5 (no account or role switcher anywhere)',
  },
  {
    id: 'developer-controls',
    pattern: /\bdev(?:eloper)?[\s-]*(?:mode|tools?|only|switcher|panel|controls?|toolbar)\b/i,
    scope: ['code', 'copy', 'dom'],
    evidence:
      'Owner constraint 9 Oct 2026 (no developer surfaces); Appendix G schemas §8-10 "no developer surface of any kind"',
  },
  {
    id: 'test-identities',
    pattern: /\btest[\s-]*(?:accounts?|users?|logins?|personas?)\b/i,
    scope: ['code', 'copy', 'dom'],
    evidence: 'ADR-0003 §3/§5 (tests set sessions through the CI-only boot descriptor, never UI)',
  },
];

/**
 * Recorded exceptions to the rendered-DOM half of the owner-constraint scans (each one an exact
 * sentence, for one term, where it is drawn). The DOM check removes the sentence before it tests
 * the term; the sentence must still be on the page, word for word.
 */
export const RECORDED_DOM_TERM_EXCEPTIONS = [
  {
    term: 'sample-accounts',
    text: 'Sample accounts open with any password.',
    where: '/sign-in — the XS-01 prototype line under the card (`p.xs-proto`)',
    evidence:
      'design/v3-refined-b/roles/XS-v6/project/XsSignIn.dc.html `p.xs-proto`; XS HANDOFF.md §1.1 "Prototype line" (names and lists no account); owner approval of the XS export, 19 Oct 2026',
    removal: 'real sign-in exists (XS `prototypeNote = false`), or the owner rewords the line',
  },
];

/** Canvas-only controls, captions and runtime (START-HERE exceptions 2–4, 6; Appendix E §10). */
export const CANVAS_TERMS = [
  {
    id: 'board-control',
    pattern: /board\s+control/i,
    scope: ['code', 'copy', 'dom'],
    evidence: 'Appendix E §10 item 3: `.xa-boardctl` "Board control — not part of the product."',
  },
  {
    id: 'not-part-of-the-product',
    pattern: /not\s+part\s+of\s+the\s+product/i,
    scope: ['code', 'copy', 'dom'],
    evidence: 'Appendix E §10 item 3',
  },
  {
    id: 'restart-control',
    pattern: /\bRestart\b/,
    scope: ['code', 'copy', 'dom'],
    evidence:
      'CLAUDE.md (board control "Restart" is canvas-only); Appendix E §10 item 3; no product frame draws "Restart"',
  },
  {
    id: 'reload-the-board',
    pattern: /reload\s+the\s+board/i,
    scope: ['code', 'copy', 'dom'],
    evidence: 'Appendix E §10 item 9 ("Reload the board to start the walkthrough again")',
  },
  {
    id: 'sample-switch',
    pattern: /\bSample:/,
    scope: ['code', 'copy', 'dom'],
    evidence: 'CLAUDE.md ("Sample: …" board controls); Appendix E §10 item 5 (B1-08, B5-03)',
  },
  {
    id: 'sample-labels',
    pattern: /\(sample file\)|TEST FIXTURES|Sample figures ·/i,
    scope: ['code', 'copy', 'dom'],
    evidence: 'Appendix E §10 item 5 (sample labels do not ship; T-36)',
  },
  {
    id: 'canvas-runtime',
    pattern:
      /support\.js|\bdc-script\b|<\/?x-dc\b|\bsc-(?:if|for)\b|\b__resources\b|\b(?:REACT|REACT_DOM|BABEL)_SRI\b|\bDCLogic\b/,
    scope: ['code'],
    evidence:
      'CLAUDE.md (runtime/support.js is never copied); Appendix E §10 item 1; Appendix F §7.6 canvas leakage',
  },
];

/**
 * Canvas-only class names (Appendix F §3.8; Appendix E §2.6 and §10 items 2, 4, 7, 8).
 * Matched against whole class tokens; `b1-` and `doc-` also catch a prefix fragment that is
 * completed at run time (`doc-${kind}`, 'b1-' + part).
 */
export const CANVAS_CLASS_PATTERNS = [
  /^b1-[\w-]*$/,
  /^doc-[\w-]*$/,
  /^is-focus$/,
  /^is-shown$/,
  /^xa-boardctl$/,
  /^xl-board-btn$/,
  /^xw-live$/,
  /^xr-dialog-scrim$/,
  /^xw-dlg-top$/,
  /^xa-dlg-end$/,
  /^xa-dlg-auto$/,
  /^xg-dlg$/,
  // The XS export's preview-only scaffolding (design/v3-refined-b/roles/XS-v6/COMPONENT-EXTENSIONS.md
  // §2 "Preview only … Never product UI"): dashed slots for other workstreams' pages, the public
  // slot pages, specimen notes and the galleries.
  /^xs-slot[\w-]*$/,
  /^xs-pub[\w-]*$/,
  /^xs-spec$/,
  /^xs-kit[\w-]*$/,
  // The Super Admin export's design-only preview controls (design/v3-refined-b/roles/SA-v1/
  // COMPONENT-EXTENSIONS.md: "`sa-pv-*` … Never part of the product").
  /^sa-pv(?:-[\w-]*)?$/,
];

/**
 * The ONLY product-added class names (T-4; Appendix E §2.6 "the tests keep an explicit allow-list";
 * Appendix F WP-0.6 acceptance 2). Every other class @xr/ui emits is a v46 board class.
 * - PF-01 sort control (Appendix E §7.1), used from WP-0.7.
 * - PF-04 dialog alignment modifiers, accepted by the owner in the WP-0.6 authorisation
 *   (12 Oct 2026); VD-08 (the alignment mapping itself) stays provisional.
 * - PF-14 Help & support glue and PF-15 message-page tint and placement (board 07, 08, 11 inline
 *   styles), authorised by the owner as narrow Phase-0 corrections in the WP-0.13 authorisation.
 */
export const PRODUCT_CLASS_ALLOW_LIST = [
  'xr-x-table-sortbar',
  'xr-x-th-sort',
  'xr-x-th-text',
  'xr-x-dialog--start',
  'xr-x-dialog--end',
  'xr-x-dialog--decision',
  'xr-x-dialog--marks',
  'xr-x-help-form',
  'xr-x-help-back',
  'xr-x-help-empty',
  'xr-x-help-foot',
  'xr-x-msg--shell',
  'xr-x-msg--public',
  'xr-x-msg-icon--ok',
  // PF-21 (Phase 1 Package 1A): B1-11's confirmation lists its effects (`ul.doc-list`, a canvas
  // class) — the product name for the same declarations.
  'xr-x-dialog-effects',
  // PF-23 (Phase 1 Package 1D): B7-01 f1's all-clear tint on the empty-state icon (inline style).
  'xr-x-empty-icon--ok',
];

/**
 * The ONLY product-added class names of the V3 presentation layer (foundation XR-V3-RB-1.0,
 * ADR-0010; `packages/ui/src/styles/v3/patch.css`, `packages/ui/src/v3/COMPONENT-EXTENSIONS.md`).
 * Every other class the V3 layer emits is a Refined Direction B class of the frozen sources.
 * - V3P-02: the narrow-width sort bar follows the table's own breakpoint.
 * - V3P-09: a V3 region (an Entry & shared surface) inside the v46 workspace shell.
 * - V3P-10: the XS account menu panel under the v46 account button.
 * - V3P-11: the XS "Report sent" breadcrumb, 12 px above its card.
 * - V3P-12: the Super Admin export's inline spacings (a quiet line alone in a cell, the notes
 *   under a table or a definition list, SA-07's lines and list, SA-01's head and loading queue).
 * (V3P-06 `rk-x-skip` and V3P-07 `rk-x-acct` were retired with the XS export: the shell now draws
 * its skip link and account wrapper with the XS classes `xs-skip`, `xs-acct-slot`, `xs-acct`.)
 */
export const V3_PRODUCT_CLASS_ALLOW_LIST = [
  'rk-x-sort-shown',
  'rk-x-sort-hidden',
  'rk-x-region',
  'rk-x-region--banner',
  'rk-x-popover',
  'rk-x-crumbs-tight',
  // V3P-12: the Super Admin export's (SA-v1) inline spacings, each on the element it styles.
  'rk-x-small-flush',
  'rk-x-hint-table',
  'rk-x-hint-list',
  'rk-x-next-above',
  'rk-x-next-below',
  'rk-x-ask-above',
  'rk-x-sec-head-tight',
  'rk-x-queue-flush',
];

/** The rejected Slice-1 work (Appendix F §2.3 DISCARD and §2.4 "must not be carried"). */
export const SLICE1_TERMS = [
  {
    id: 'no-place-remaining',
    pattern: /no-place-remaining/,
    scope: ['code', 'copy'],
    evidence: 'Appendix F §2.4 (the `no-place-remaining` refusal; D7 counting, T-06)',
  },
  {
    id: 'licence-counting',
    pattern:
      /places?(?:Before|After|Remaining|Left|Used)|(?:remaining|free|available)(?:Places|Seats|Licen[cs]es)|seats?(?:Remaining|Left|Used)|licen[cs]es?(?:Remaining|Left|Used)|\blearner places\b|\b(?:places|seats) (?:left|remaining)\b/i,
    scope: ['code', 'copy'],
    evidence:
      'Appendix F §2.4 (`places.ts` arithmetic, `placesBefore/After`, "learner places"); T-06 / D7 licence counting is open',
  },
  {
    id: 'slice1-components',
    pattern:
      /\b(?:PlacesMeter|FormatLegend|FormatChip|AppShell|DemoBar|DemoAccounts\w*)\b|places-meter|format-legend|demo-bar|demo-accounts/,
    scope: ['code'],
    evidence:
      'Appendix F §2.3 DISCARD (Slice-1 UI) and WP-0.6 (6) Slice-1-only identifiers; START-HERE Known exception 4',
  },
  {
    id: 'slice1-identifiers',
    pattern: /^(?:Card|cx)$|^places/,
    scope: ['identifier'],
    evidence:
      'Appendix F WP-0.6 acceptance 6 (Slice-1-only identifiers `Card`, `cx`, `places*`; `demo-*` is `demo-wording`); START-HERE Known exception 4',
  },
  {
    id: 'slice1-routes',
    pattern: /\(connected\)|connected-slice1/,
    scope: ['code'],
    evidence: 'Appendix F §2.3 DISCARD (`app/(connected)/**`, `e2e/connected-slice1.spec.ts`)',
  },
  {
    id: 'campus-entity',
    pattern: /campus/i,
    scope: ['identifier'],
    evidence:
      'Appendix F §2.4 ("campus" wording in Slice-1 code); Appendix C §8-1 (no Campus entity). Copy may say "Campus": B1-08, B1-11 draw it',
  },
];

/** B8-03 business-rule and terminology scans, applied to copy only. */
export const POLICY_WORD_TERMS = [
  {
    id: 'publish-grants-access',
    pattern:
      /\b(?:publish|releas)\w*\b(?:(?!\b(?:no|not|never|nothing|none)\b)[^.]){0,60}\b(?:gives?|grants?|granted|unlocks?|provides?|opens?)\b(?:(?!\b(?:no|not|never|nothing|none)\b)[^.]){0,30}\baccess\b/i,
    evidence:
      'B8-03 "Text scan: 0 “publish/release grants access”" (drawn: “Publishing gives no one access”, B6-07)',
  },
  {
    id: 'decline-reject',
    pattern: /\b(?:declin|reject)\w*/i,
    evidence: 'B8-03 "Decline / Reject 0"; B1-10/B1-11 (T-02 / R21)',
  },
  {
    id: 'aggregate-progress',
    pattern:
      /\boverall\s+(?:progress|completion|complete|completed|status|verdict|score)\b|\b\d{1,3}(?:\.\d+)?\s?%\s*(?:complete|completed|done|finished|progress)\b|\b(?:progress|completion|completed)\b[^.]{0,20}\b\d{1,3}(?:\.\d+)?\s?%|\bexperiment completed\b/i,
    evidence:
      'B8-03 "Aggregate progress verdicts 0"; B3-14 "No percentage, no overall completion, no “experiment completed”" (pass marks such as B4-11 "Pass mark 50%" stay legal)',
  },
  {
    id: 'shipping-words',
    pattern: /\b(?:ship|ships|shipped|shipping|shipment|courier|dispatch(?:ed)?|parcel|postage)\b/i,
    evidence: 'B8-03 "Device transfer = authorisation, not shipping … 0 shipping words"',
  },
  {
    id: 'role-name-variants',
    pattern:
      /\b(?:Tenant Admin|Institution Admin|Institutional Admin|Teacher|Instructor|SPOC|Learner)s?\b/i,
    evidence:
      'B8-03 "Role-name variants (Institution Admin, Tenant Admin, Teacher, Instructor, SPOC …) 0"; Appendix F §7.6 ("Tenant Admin", "Learner"); BC1',
  },
  {
    id: 'us-license',
    pattern: /\blicenses?\b/i,
    evidence: 'B8-03 "US spelling “license” 0" ("licensed", the verb, is drawn on B2-02)',
  },
  {
    id: 'email-spelling',
    pattern: /\bemail\b/i,
    kinds: ['jsx-text', 'copy-attr', 'copy-module-string'],
    evidence: 'B8-03 "“email” outside the CSV column name 0" (B1-09 draws "E-mail")',
  },
  {
    id: 'numeric-date',
    pattern: /\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b/,
    evidence: 'B8-03 "Numeric or US date formats 0" ("23 Oct 2026, 10:30"); Appendix F §7.6',
  },
  {
    id: 'course-code-space',
    pattern: /\b[A-Z]{2,4}ZG\d{3}\b/,
    evidence: 'B8-03 "Course codes without the space 0" ("ME ZG523")',
  },
  {
    id: 'internal-jargon',
    pattern: /\btenant\b|\bprovisioned\b|\bcanonical metadata\b/i,
    evidence: 'B8-03 "Internal jargon (tenant, provisioned, canonical metadata …) 0"',
  },
  {
    id: 'academic-quality',
    pattern: /\bacademic quality\b/i,
    evidence: 'B8-03 "“Academic quality” claims 0"',
  },
];

/**
 * B8-03 "Scan: no Publish control on any Super Admin or Reviewer frame" — applied to the
 * admin and reviewer feature folders only (they arrive in Phases 1, 5 and 6).
 */
export const PUBLISH_CONTROL_TERM = {
  id: 'publish-on-sa-or-reviewer',
  pattern: /\bPublish\b/,
  evidence:
    'B8-03 "First publication = Content Manager … no Publish control on any Super Admin or Reviewer frame"',
};

/**
 * UI kits and design systems that may never be a dependency of the product (owner
 * constraint; ADR-0001 §5; Appendix E §11 item 3; Appendix F §7.6 deny-list).
 */
export const DENIED_UI_DEPENDENCIES = [
  { pattern: '@mui/*', kit: 'MUI' },
  { pattern: '@material-ui/*', kit: 'MUI (legacy)' },
  { pattern: '@chakra-ui/*', kit: 'Chakra UI' },
  { pattern: '@radix-ui/*', kit: 'Radix (styled kits and headless primitives)' },
  { pattern: 'radix-ui', kit: 'Radix' },
  { pattern: 'shadcn', kit: 'shadcn/ui' },
  { pattern: 'shadcn-ui', kit: 'shadcn/ui' },
  { pattern: '@shadcn/*', kit: 'shadcn/ui' },
  { pattern: '@tailwindui/*', kit: 'Tailwind UI' },
  { pattern: '@tailwindplus/*', kit: 'Tailwind Plus (Tailwind UI)' },
  { pattern: '@headlessui/*', kit: 'Headless UI (headless kit)' },
  { pattern: 'react-aria', kit: 'React Aria (headless kit)' },
  { pattern: 'react-aria-components', kit: 'React Aria (headless kit)' },
  { pattern: '@react-aria/*', kit: 'React Aria (headless kit)' },
  { pattern: '@react-stately/*', kit: 'React Aria (headless kit)' },
  { pattern: 'ariakit', kit: 'Ariakit (headless kit)' },
  { pattern: '@ariakit/*', kit: 'Ariakit (headless kit)' },
  { pattern: '@reach/*', kit: 'Reach UI (headless kit)' },
  { pattern: '@ark-ui/*', kit: 'Ark UI (headless kit)' },
  { pattern: '@base-ui-components/*', kit: 'Base UI (headless kit)' },
  { pattern: '@base-ui/*', kit: 'Base UI (headless kit)' },
  { pattern: '@mantine/*', kit: 'Mantine' },
  { pattern: 'antd', kit: 'Ant Design' },
  { pattern: '@ant-design/*', kit: 'Ant Design' },
  { pattern: 'primereact', kit: 'PrimeReact' },
  { pattern: '@nextui-org/*', kit: 'NextUI' },
  { pattern: '@heroui/*', kit: 'HeroUI' },
  { pattern: 'daisyui', kit: 'daisyUI' },
  { pattern: 'flowbite', kit: 'Flowbite' },
  { pattern: 'flowbite-react', kit: 'Flowbite' },
  { pattern: 'bootstrap', kit: 'Bootstrap' },
  { pattern: 'react-bootstrap', kit: 'React Bootstrap' },
  { pattern: 'semantic-ui-react', kit: 'Semantic UI' },
  { pattern: '@fluentui/*', kit: 'Fluent UI' },
  { pattern: '@blueprintjs/*', kit: 'Blueprint' },
  { pattern: '@fortawesome/*', kit: 'Font Awesome (icon font)' },
  { pattern: 'font-awesome', kit: 'Font Awesome (icon font)' },
  { pattern: 'material-icons', kit: 'Material Icons (icon font)' },
  { pattern: 'material-symbols', kit: 'Material Symbols (icon font)' },
  { pattern: '@material-symbols/*', kit: 'Material Symbols (icon font)' },
  { pattern: '@mdi/font', kit: 'Material Design Icons (icon font)' },
  { pattern: 'bootstrap-icons', kit: 'Bootstrap Icons (icon font)' },
  { pattern: 'remixicon', kit: 'Remix Icon (icon font)' },
  { pattern: 'ionicons', kit: 'Ionicons (icon font)' },
  { pattern: '@tabler/icons-webfont', kit: 'Tabler (icon font)' },
];
