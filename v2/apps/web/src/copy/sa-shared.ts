/**
 * Words every Super Admin screen shares in the V3 Refined B design (the owner-approved Super Admin
 * export, design/v3-refined-b/roles/SA-v1): the GL-04 "not available" message for an unknown or
 * unreadable record (`SA.resolve` `nf`), and the list and record states' common sentence.
 * Internal references (REQ-, ACC-, UPD-, DTR-, SUP-, SUB-) never appear in Super Admin text or
 * accessible names (the export's HANDOFF "Shell and shared behaviour").
 */
export const SA_UNAVAILABLE = {
  /** The tab's title and the shell's placement word. */
  documentTitle: 'Not available',
  title: 'This page isn’t available',
  sentence:
    'The address may be incomplete, or the record isn’t part of this workspace. Nothing has changed.',
  back: 'Back to Overview',
  help: 'Help & support',
} as const;

/** A list or record that could not load: the reassurance under its title, and the retry. */
export const SA_FAILED = {
  line: 'Nothing has changed. Try again.',
  retry: 'Try again',
} as const;
