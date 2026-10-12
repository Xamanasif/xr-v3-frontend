/**
 * Stylesheet specimen (WP-0.5, PF-01 guards): tables whose `<thead>` v46 clips in labelled-row
 * mode. A control left in a clipped header is an invisible focus target (B1-10, BC13).
 *
 * - `.xr-table` in `.xr-content`: B1-10 "Institutional access requests", with its "Received" sort
 *   button in the header (clipped below 760 px of content). The sort behaviour, accessible name
 *   and visible equivalent are WP-0.7; only the CSS guard is checked here.
 * - `.xp-ftable` (B1-05 "Formats and device needs", clipped below 760 xp) and `.xp-compare`
 *   (B1-08 request comparison, clipped below 600 xp): no board draws a header control there; the
 *   guard is preventive, so the specimen adds one to each.
 */
export function V46Tables() {
  return (
    <div className="xr-content" data-probe="content">
      <div className="xr-table-wrap">
        <table className="xr-table">
          <caption className="xr-sr">Institutional access requests</caption>
          <thead>
            <tr>
              <th scope="col">Reference</th>
              <th scope="col">Institution and contact person</th>
              <th scope="col" aria-sort="descending">
                <button type="button" className="xr-btn xr-btn--text" data-probe="xr-table-sort">
                  Received<span className="xr-sr">, newest first. Change order</span>
                </button>
              </th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="is-primary">
                <a href="#REQ-0042">REQ-0042</a>
              </td>
              <td data-label="Institution and contact person">Godavari Institute of Technology</td>
              <td data-label="Received" className="xr-num">
                8 Oct 2026
              </td>
              <td data-label="Status">Under review</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="xp" data-probe="xp">
        <table className="xp-ftable">
          <thead>
            <tr>
              <th>Format</th>
              <th>
                <button type="button" data-probe="xp-ftable-control">
                  How it runs
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td data-label="Format">WEB</td>
              <td data-label="How it runs">The experiment in a web browser.</td>
            </tr>
          </tbody>
        </table>
        <table className="xp-compare">
          <thead>
            <tr>
              <th>
                <span className="xr-sr">Item</span>
              </th>
              <th>
                <a href="#asked" data-probe="xp-compare-control">
                  You asked for
                </a>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td data-label="">Licences</td>
              <td data-label="You asked for">120</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** The kinds of control the PF-01 guard selector names, one of each (probe = kind). */
function HeaderControls({ table }: { readonly table: string }) {
  const probe = (kind: string) => `${table}-${kind}`;
  return (
    <>
      <a href={`#${table}-link`} data-probe={probe('link')}>
        Link
      </a>
      <button type="button" data-probe={probe('button')}>
        Button
      </button>
      <input aria-label={`${table} input`} data-probe={probe('input')} />
      <select aria-label={`${table} select`} data-probe={probe('select')}>
        <option>One</option>
      </select>
      <textarea aria-label={`${table} textarea`} data-probe={probe('textarea')} />
      <details>
        <summary data-probe={probe('summary')}>Summary</summary>
      </details>
      <span tabIndex={0} role="button" data-probe={probe('tabindex')}>
        Tab stop
      </span>
      {/* Not a Tab stop: the guard leaves it displayed (focusable by script only). */}
      <span tabIndex={-1} data-probe={probe('tabindex-minus-one')}>
        Script focus
      </span>
    </>
  );
}

/**
 * Stylesheet specimen (WP-0.7, PF-01 guards): one control of every kind the guard selector names
 * — `a, button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"])` — in each head
 * v46 clips: `.xr-table` (below 760 px of `xr-content`), `.xp-ftable` (below 760 xp) and
 * `.xp-compare` (below 600 xp). No board draws these controls (only B1-10's sort button sits in a
 * head); the specimen proves the guard covers each kind at exactly the clip widths.
 */
export function V46TableGuards() {
  return (
    <div className="xr-content" data-probe="content">
      <div className="xr-table-wrap">
        <table className="xr-table">
          <caption className="xr-sr">Institutional access requests</caption>
          <thead>
            <tr>
              <th scope="col">Reference</th>
              <th scope="col">
                <HeaderControls table="xr-table" />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="is-primary">
                <a href="#REQ-0042">REQ-0042</a>
              </td>
              <td data-label="Received">2 Oct 2026</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="xp" data-probe="xp">
        <table className="xp-ftable">
          <thead>
            <tr>
              <th>Format</th>
              <th>
                <HeaderControls table="xp-ftable" />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td data-label="Format">WEB</td>
              <td data-label="How it runs">The experiment in a web browser.</td>
            </tr>
          </tbody>
        </table>
        <table className="xp-compare">
          <thead>
            <tr>
              <th>
                <span className="xr-sr">Item</span>
              </th>
              <th>
                <HeaderControls table="xp-compare" />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td data-label="">Licences</td>
              <td data-label="You asked for">120</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
