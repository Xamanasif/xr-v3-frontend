import type { ReactNode } from 'react';

/**
 * A V3 region inside a v46 page (`div.xr.rb.rk-x-region`, V3P-09): an Entry & shared surface —
 * the Help pages, "Not your workspace", the access banner — in the workspace shell of a role
 * whose own V3 design is still pending. It is a V3 root (every V3 and XS rule applies inside it)
 * but not a shell: no grid, no viewport height, no canvas of its own, and no query container, so
 * the V3 breakpoints measure the app's width as they do in the V3 shell. The mirror of
 * `V46Island`, and retired with it once every role has its V3 shell.
 */
export function V3Region({
  placement = 'page',
  children,
}: {
  /**
   * `page`: an XS page's content. `banner`: the XS-08 banner, the first thing in the page column
   * with the V3 page gap (28 px) under it, as the export and the IA-02 seed place it.
   */
  readonly placement?: 'page' | 'banner';
  readonly children: ReactNode;
}) {
  return (
    <div
      className={
        placement === 'banner' ? 'xr rb rk-x-region rk-x-region--banner' : 'xr rb rk-x-region'
      }
    >
      {children}
    </div>
  );
}
