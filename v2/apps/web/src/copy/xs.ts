/**
 * The words of the Entry & shared surfaces every workspace shows (XS-05, XS-06, XS-08), as the
 * owner-approved export draws them (design/v3-refined-b/roles/XS-v6; SHARED-CONTRACT.json
 * `XsAccountMenu`, `XsMessage`, `XsAccessNotice`). Sign-in words are in `./sign-in`, Help words in
 * `./help`. Nothing names an account, a role to switch to or a workspace to choose.
 */

/**
 * The rail foot's link to Help in a V3 role shell (the XS export's shell, LINK-MAP "Help & support
 * (rail foot and drawer foot)"). The v46 shells keep their own "Help".
 */
export const SHELL_HELP = 'Help & support';

/**
 * A V3 role shell's rail count that its role export words differently from board 06, by
 * `role:href` (the v46 shells keep board 06's words): the Content Manager's Ready to publish
 * (CM-v1 `Main.dc.html` `navVM`, "{n} experiments ready to publish", singular at 1) and the
 * Academic Reviewer's Review queue (RV-v1 `RV.dc.html` `navCountLabel`, "{n} items waiting for
 * review", singular at 1).
 */
export const V3_RAIL_COUNT_WORDS: Readonly<
  Partial<Record<string, { readonly other: string; readonly one?: string }>>
> = {
  'content_manager:/content-manager/ready': {
    other: '{n} experiments ready to publish',
    one: '{n} experiment ready to publish',
  },
  'academic_reviewer:/reviewer/queue': {
    other: '{n} items waiting for review',
    one: '{n} item waiting for review',
  },
};

/** XS-05: the account menu's items (links, then Sign out in the panel's foot). */
export const ACCOUNT_MENU = {
  help: 'Help & support',
  signOut: 'Sign out',
} as const;

/**
 * XS-08: the banner at the top of every page of an affected person (`div.rk-banner`): a paused
 * institution (Institute Admin, Faculty and Students), an inactive account (the grey variant).
 * Display only — it never grants, hides or restores access.
 */
export const ACCESS_BANNER = {
  paused: 'Your institution’s access is paused — your work is kept.',
  inactive: 'Your account is inactive. Contact your institution administrator.',
  help: 'Help',
} as const;

/**
 * XS-06 "Not your workspace", in the person's own shell: one sentence naming the workspace they
 * are signed in to, the way back named by its destination, and Help. Never the protected page's
 * title, records, route, role code or error code.
 */
export const NOT_YOUR_WORKSPACE = {
  title: 'This page isn’t part of your workspace',
  line: (workspace: string) =>
    `You’re signed in to the ${workspace} workspace. This address belongs to a different workspace.`,
  /** "Back to Home" (Student) / "Back to Overview" (every other role): the home's own name. */
  back: (homeLabel: string) => `Back to ${homeLabel}`,
  help: 'Help',
} as const;
