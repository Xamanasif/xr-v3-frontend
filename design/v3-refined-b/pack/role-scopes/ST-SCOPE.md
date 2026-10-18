# Student - exact ownership

| ID | Registered screen | Type | v46 proposed route |
| --- | --- | --- | --- |
| ST-01 | Home | page | /student |
| ST-02 | My courses | page | /student/courses |
| ST-03 | Course (student view) | page | /student/courses/[courseId] |
| ST-04 | All my experiments | tab | /student/courses?tab=experiments |
| ST-05 | Experiment (hub: Overview · Resources · Simulation · Assessment · Progress) | page | /student/experiments/[experimentId] |
| ST-06 | Resources | tab | /student/experiments/[experimentId]/resources |
| ST-07 | Simulation — choose a format | tab | /student/experiments/[experimentId]/simulation |
| ST-08 | WEB simulation (launch / resume) | page | /student/experiments/[experimentId]/simulation/web |
| ST-09 | AR / VR / MR format (setup & progress) | page | /student/experiments/[experimentId]/simulation/[format] |
| ST-10 | Progress for this experiment | tab | /student/experiments/[experimentId]/progress |
| ST-11 | Assessments | page | /student/assessments |
| ST-12 | Assessment — before you start | page | /student/assessments/[assessmentId] |
| ST-13 | Assessment attempt | step | /student/assessments/[assessmentId]/attempt |
| ST-14 | Result | page | /student/assessments/[assessmentId]/result |
| ST-15 | Progress (all experiments) | page | /student/progress |
| ST-16 | Format feedback | step | /student/experiments/[experimentId]/feedback/[format] |
| ST-17 | Feedback sent (confirmation, read-only) | state | /student/experiments/[experimentId]/feedback/[format] (sent state) |
| ST-18 | My device (AR/VR/MR holders only) | page | /student/device |
| ST-19 | Experiment not available (refusal page) | state | /student/experiments/[experimentId] (not-available state) |

Already-selected V3 seeds for this role: None in the supplied five-screen V3 source subset. Retain them and complete the role around them.

Excluded: ST-20.

## Source boards
- `B2-10-Student-Home.dc.html`
- `B2-11-My-Courses.dc.html`
- `B2-12-Experiment-Hub.dc.html`
- `B2-13-Flow-2-Continuity.dc.html`
- `B3-01-Hub-Resources-and-Progress.dc.html`
- `B3-02-Simulation-Choose-Format.dc.html`
- `B3-03-WEB-Simulation.dc.html`
- `B3-04-AR-VR-MR-Format.dc.html`
- `B3-05-Progress.dc.html`
- `B3-06-Format-Feedback.dc.html`
- `B3-07-My-Device.dc.html`
- `B4-11-Student-Assessments.dc.html`
- `B4-12-Assessment-Attempt.dc.html`
- `B4-13-Assessment-Result.dc.html`
