'use client';

/*
 * Super Admin V3 components for SA-17 Role holder (the owner-approved Super Admin export,
 * design/v3-refined-b/roles/SA-v1, `project/sa-views-d.js` `V.holder`): the holder's scopes. Markup
 * as the export's view emits it; every word, figure, date and destination comes from the caller.
 * What SA-16 and SA-17 share with other screens is in `sa.tsx` (`QuietLine`, `InlineForm`,
 * `GoButton`) and the kit (`ConfirmDialog`).
 */
import type { ReactNode } from 'react';

import { CourseCode } from './codes.js';

/**
 * A holder's scopes (`ul.sa-scopes`; the export's `V.holder` "Can act on" and "Withdrawn"): one
 * bordered list, a `ScopeItem` per scope.
 */
export function ScopeList({ children }: { readonly children: ReactNode }) {
  return <ul className="sa-scopes">{children}</ul>;
}

export interface ScopeItemProps {
  /** A course scope's platform code, drawn as its chip before the name (`span.rk-code`). */
  readonly code?: string | null;
  /** What the scope names: the course's name, "All experiments", the experiment's name. */
  readonly title: ReactNode;
  /** The quiet line under it (`p.rk-small`): "Assigned 2 Jun 2026", "Withdrawn 1 Oct 2026 · …". */
  readonly detail: ReactNode;
  /** The row's action ("Withdraw", "Restore"); none while its inline form is open. */
  readonly action?: ReactNode;
  /** The open inline form (`InlineForm`), below the row. */
  readonly children?: ReactNode;
}

/**
 * One scope (`li` > `div.sa-scope-row`): the code chip and the name (`p.sa-scope-t`), the quiet
 * line, the action at the end — and, below the row, its inline form while it is open.
 */
export function ScopeItem({ code, title, detail, action, children }: ScopeItemProps) {
  return (
    <li>
      <div className="sa-scope-row">
        <div>
          <p className="sa-scope-t">
            {code ? (
              <>
                <CourseCode code={code} />{' '}
              </>
            ) : null}
            {title}
          </p>
          <p className="rk-small">{detail}</p>
        </div>
        {action}
      </div>
      {children}
    </li>
  );
}
