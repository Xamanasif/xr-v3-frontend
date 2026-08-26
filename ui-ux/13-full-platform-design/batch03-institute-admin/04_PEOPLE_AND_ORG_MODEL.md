# Batch 03 — People & Organisational Structure Model

The model behind INA-02, INA-03, INA-04 and INA-05.

---

## 1 · People

### 1.1 What a person record shows

| Field | Label | Source | Notes |
|---|---|---|---|
| Name | *(row title)* | 7.2.2, 4.3.1 | **SAMPLE DESIGN DATA** |
| Institutional identifier | **Institutional ID** | 7.2.2 (records arrive from institutional data) | The institution's own identifier for the person. **SAMPLE.** Format is the institution's, not the platform's — nothing about it is specified |
| Role | **Role** | 8.1.3, 8.1.4, 8.1.5 | Learner · Faculty. Only roles that exist on the tenant plane appear (PM-13) |
| Academic context | **Academic stream** · **Groups** | 7.2.3 | Read-only, origin stated |
| Account state | **Account** | — | `Active` · `Awaiting first sign-in` · `Needs attention` — `DA-12` |
| Provenance | **Source** | 7.2.2, 7.1.1 | `From institution data` · `—` |
| Sign-in method | **Sign-in** | 4.2.2 · PM-10 | `Institutional sign-in` · `Not yet signed in`. **No provider or protocol is named** |
| Content access summary | **Content access** | 8.1.3, 7.2.3 | What this person is currently eligible for, and which relationship produces it |

### 1.2 Fields deliberately not shown

Personal contact details beyond an institutional e-mail, date of birth, address, photograph, gender, demographic data, fee or payment status, performance scores, attempt history, time-on-task, device identifiers, last-seen timestamps, IP or session data.

**Why.** Two independent reasons. (a) FRD 1.3.4 confines institutional reporting to the institution's dataset and PM-11 keeps Phase 1 **operational**, so a person record is *"can this person reach their content, and is their account healthy?"* — not a profile dossier and not a performance view. (b) The task brief instructs that unsupported private data be avoided; no source enumerates a person schema, so enumerating one here would invent it.

**Progress and results are visible to Faculty** (matrix `F9`, `K2`–`K6`) and are designed in Batch 02 for that role. They are **not** repeated in the Institute Admin workspace.

### 1.3 Provisioning — what is claimed and what is not

**Claimed** (FRD 7.2.2, `J4`): learner accounts can arrive through the institution data connection, and where they did, the record says so.

**Not claimed:**

- that this is the **only** way an account can come to exist;
- that the Institute Admin creates accounts manually — no such control exists (`DA-04`);
- that Faculty accounts arrive the same way — **who creates a Faculty account is undefined** (`QP-07`, matrix `A6`). Faculty rows therefore show `—` in the Source column. A dash is an ordinary "not stated" in a table; it does not accuse the data of being wrong, and it does not invent an origin.

### 1.4 The "needs attention" person state

One sample learner record is in a `Needs attention` state: the incoming institutional data names an academic stream the platform does not have set up, so the person exists but resolves to no academic context — and therefore to no content access.

This is the **person end** of the same fact INA-12 shows from the **data end**. Both link to each other. It is the single most useful exception in the workspace, because it is the exact shape of *"a learner cannot see anything and nobody knows why"*.

---

## 2 · Academic structure

### 2.1 Terminology — and what is a design normalisation

| Entity | Term used | Source | Status |
|---|---|---|---|
| The level content access maps to | **Academic stream** | FRD 7.2.3 (*stream-based access assignment*), 6.2.1 (*packages mapped to academic streams*) | **Source term — used verbatim** |
| A teaching cohort within a stream | **Group** | Consolidated FRD (*"assigns content to learners and groups"*); matrix `E3` (*person, cohort, stream*) | **Source term — used verbatim** |
| The academic container of modules | **Course** | FRD 3.2.1, 3.2.2, 8.1.3 (*course structures*) | **Source term — used verbatim** |
| The navigation area holding all three | **Academic Structure** | — | **DESIGN NORMALISATION — `DA-02`.** Grouping only; the three entity types stay distinct and separately typed in every list and every detail view |

**The word "program" is not used.** Its only Phase-1 appearance in the FRD is *certification programs* (3.3.1), which PM-12 defers to Phase 2. Borrowing it here would collide with a term that already means something else in this product.

### 2.2 What the Institute Admin may do with academic structure

| Capability | Position | Source |
|---|---|---|
| **View** streams, groups and courses | ✅ Designed | 8.1.3, 7.2.3, matrix `C4` |
| **See where they came from** | ✅ Designed | 7.1.2, 7.2.3 |
| **See which content access reaches each population** | ✅ Designed | 6.2.1, 7.2.3, matrix `H4` |
| **See members and related faculty** | ✅ Designed | 8.1.3, 8.1.4 |
| **Create a course in the platform** | ⛔ **Phase 2** — absent | 3.4.1, 3.4.2; tension **T-1** |
| **Edit externally-sourced structure** | ⛔ absent | `QD-01` working position; matrix `J6` |
| **Assign a course or module to a learner for teaching purposes** | Not in this workspace | Faculty capability (8.1.4, matrix `E3`) — Batch-02 territory |

**T-1 handled explicitly.** FRD 8.1.3 puts *"course structures"* in the Phase-1 Institute Admin role while course **creation** (3.4.x) is Phase 2. The narrowest reading that satisfies both is *view, understand and map* — which is what is built. **No authoring tool of any kind appears**, and nothing is disabled to hint at one.

### 2.3 Faculty on a stream or group

Stream and group detail screens show **related faculty** where the institution's data records them — matrix `A6` leaves faculty *provisioning* undefined, but showing the faculty already associated with a teaching group asserts no provisioning authority. Where no faculty is recorded, the row reads *"No faculty recorded for this group"* rather than being hidden, because an administrator needs to know the difference between "none" and "not shown".

**No faculty assignment control exists** in this workspace.

### 2.4 The "stream not set up" state

One sample academic stream arrives in the institution data but has no corresponding structure in the platform. It appears in the Academic Structure list flagged **Needs attention**, and it is the cause of the person-level exception in §1.4 and of the run outcome in INA-12.

The next step offered is honest about what is and is not known: the platform can show which incoming value it could not resolve, and the administrator can retry the affected records once the structure exists. **What "setting up a stream" involves is not designed**, because the institution-data contract is pending (`QD-03`) — the interface says what happened and where to look, not how to reconfigure a system nobody has specified.

---

## 3 · Counts shown, and what they are not

| Count | What it means | What it is **not** |
|---|---|---|
| Learners in the institution | People with the Learner role on this tenant | A seat count, a cap, or a licence figure (`DA-08`) |
| Faculty in the institution | People with the Faculty role on this tenant | Anything about provisioning authority |
| *"Reaches N learners"* | How many people an eligibility relationship currently resolves to | A quota, an allocation, or a consumption figure |
| Members of a stream or group | People currently in that population | Anything about entitlement by itself |
| Records needing attention | Rows from the last institution-data run that could not be applied | An error rate, a health score or a trend |

**No count in Batch 03 is a percentage, a trend, a comparison, or a rate.** PM-11.
