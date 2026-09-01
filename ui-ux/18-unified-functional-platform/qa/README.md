# QA fixtures — sample/test data only

Two small CSV files used to reproduce the Implementation-02 bulk-import
checks in `../QA_CHECKLIST.md`. **Sample data only** — no real student,
no real institution, no real email address.

| File | Purpose |
|---|---|
| `students-invalid.csv` | Every blocking error class the import must catch, plus rows that prove **blank Semester / Organisation / Plan Terms are valid** |
| `students-valid.csv` | The corrected file — imports cleanly |

Import them from **Tenant Admin → People → Import Students (CSV)**.
`students-valid.csv` assumes the seeded *Sample Engineering Institute*
tenant, whose seeded students already occupy `SEI/CE/2023/0142` and
`rahul.verma@sample-institute.example` — the invalid file collides with
both on purpose.
