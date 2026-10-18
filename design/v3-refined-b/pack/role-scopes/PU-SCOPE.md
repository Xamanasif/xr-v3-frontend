# Public - exact ownership

| ID | Registered screen | Type | v46 proposed route |
| --- | --- | --- | --- |
| PU-01 | Landing | page | / |
| PU-02 | All engineering areas ("View all areas") | page | /areas |
| PU-03 | Engineering area | page | /areas/[areaId] |
| PU-04 | Catalogue | page | /experiments |
| PU-05 | Course | page | /courses/[courseCode] |
| PU-06 | Experiment | page | /experiments/[experimentId] |
| PU-07 | Your selection | page | /selection |
| PU-08 | Request institutional access | step | /request-access |
| PU-09 | Request sent | step | /request-access/sent |
| PU-10 | Request status | page | /requests/[requestId] |
| PU-12 | Payment (external route only) | step | /requests/[requestId]/payment |
| PU-13 | Access activated | state | /requests/[requestId] (Access active state) |
| PU-14 | How institutional access works | state | / (#for-institutions section) |
| PU-15 | Not found | page | not-found.tsx |

PU-01 and PU-14 are LOCKED retained content, not redesign work. The other 12 Public IDs are the design task.

Excluded: PU-11, PU-16.

## Source boards
- `08-System-Messages.dc.html`
- `B1-01-Public-Landing.dc.html`
- `B1-03-Areas-and-Course.dc.html`
- `B1-04-Catalogue.dc.html`
- `B1-05-Experiment-Detail.dc.html`
- `B1-06-Selection.dc.html`
- `B1-07-Request-Access.dc.html`
- `B1-08-Request-Status.dc.html`
