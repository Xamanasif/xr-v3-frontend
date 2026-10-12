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
