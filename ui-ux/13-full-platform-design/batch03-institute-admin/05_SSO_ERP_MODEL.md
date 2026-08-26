# Batch 03 — Single Sign-On & Institution Data Model

The model behind INA-09, INA-10, INA-11 and INA-12.

**The governing constraint for this entire document:** the identity provider, the protocol, the attribute mapping, the ERP provider and the integration contract are **all unselected**. PM-10 says so for identity; the consolidated FRD says so for both (*"Every one of these is a contract to be defined, not a product that has been chosen"*). Batch 03 therefore designs **the administrative experience of a connection**, not a connection.

---

## 1 · Single sign-on (INA-10)

### 1.1 Why this surface exists

FRD 4.2.2 is a **Phase-1** requirement: *"Institutions shall be able to configure single sign-on authentication through supported identity providers."* PM-10 confirms the Phase-1 reading, resolving the FRD's own contradiction with 7.4.1. The consolidated FRD states the consequence plainly: *the requirement is a configuration capability, not just a login button — an institution needs somewhere to configure it, test it and enable it, and that surface had never been designed.*

Batch 03 designs that surface.

### 1.2 The state model — sourced ordering, `DA-13` wording

```
NOT SET UP
    │  save details
    ▼
DETAILS SAVED  ── connection not checked
    │  check connection
    ├──────────────▶  CONNECTION CHECK FAILED  ──▶ what happened + what to do next
    │                        │ check again
    │  ◀─────────────────────┘
    ▼
CONNECTION CHECKED
    │  turn on institutional sign-in
    ▼
INSTITUTIONAL SIGN-IN ON
```

These are the four states the Review-006 `IAD-13` row names — *Not configured · configured · test failed · enabled* — in plain language. The **order** is the constraint that matters: **institutional sign-in cannot be turned on before a connection check has passed.**

**That ordering is not a design flourish and not an assumption — it is a confirmed acceptance criterion:**

> *"Given a configured identity provider, when the Institute Admin runs a connection test, then the outcome is reported explicitly and an enabled state is reached only after a successful test."*

The prototype enforces it: the **Turn on institutional sign-in** control does not exist until a check has passed. Only the plain-language **wording** of the four state labels is a design assumption (`DA-13`).

### 1.3 What the configuration surface contains

| Element | Treatment |
|---|---|
| **Identity provider name** | A free-text label the institution chooses, so the administrator can recognise their own connection. **No provider list, no provider logos, no vendor names.** |
| **Connection details** | One clearly-labelled area for the values the identity provider supplies, with helper text: *"The exact connection details required will be confirmed by the platform team."* This mirrors the Batch-01 treatment of the pending submission package format. **No field is named after a protocol concept** — there is no metadata URL, entity ID, client ID, secret, certificate, issuer, audience, claim or assertion field. |
| **How people are matched** | Presented as **status, not configuration**: how many people signed in through institutional sign-in, and how many sign-ins could not be matched to a person in this institution. **Attribute mapping is not configured here** — `QD-04` is pending. |
| **Role mapping** | **Absent.** FRD 7.4.2 is **Phase 3**. Not drawn, not disabled, not mentioned. |
| **Check connection** | A real action with a real result state. In the prototype it is simulated locally; **no request leaves the browser.** |
| **Turn on institutional sign-in** | Confirmed through a dialog that states the consequence for the institution's people in plain language. |

### 1.4 What is deliberately not designed

- **Any protocol.** No SAML, OIDC, OAuth, LDAP, WS-Fed or any other named mechanism appears anywhere in the batch — not in the UI, not in the documentation as a recommendation, not in the sample data.
- **Any provider.** No vendor name is used, including as an example. Where a sample value is needed, it is the institution's own label for its connection and is tagged **SAMPLE DESIGN DATA**.
- **Attribute or claim mapping.** `QD-04` pending.
- **Automatic role assignment from identity attributes.** FRD 7.4.2, Phase 3.
- **Password, multi-factor, lockout or session policy.** Matrix `A8` is `?`; the FRD defines none.
- **A fallback authentication policy.** *Whether* institutional sign-in replaces or supplements other sign-in routes for a tenant is not stated by any source, so the interface does not state it either. The confirmation dialog says what turning it on does — it makes institutional sign-in available to the institution's people — and nothing more.

### 1.5 The recorded collision

FRD 2.4.4 requires institutional learners to sign into the XR application with their LMS credentials; FRD 4.2.2 and PM-10 require institutional single sign-on. **A learner authenticated by single sign-on may hold no password to type into a headset.** Both are Phase-1 requirements and they conflict (`QT-04`).

Batch 03 **records the collision and does not design around it.** No device sign-in guidance, credential guidance or headset instruction appears on the single sign-on screen. Adding any would pick a side of an open technical question.

---

## 2 · Institution data (INA-11)

### 2.1 Why this surface exists

Every institution-data capability in the FRD has a learner-visible consequence that was already designed and an administrator-facing control that was not:

| Requirement | Learner-visible consequence | Administrator-facing control |
|---|---|---|
| 7.1.1 / 7.1.2 — integration by standard API | Their account exists | **Where the connection is set up** |
| 7.2.1 — scheduled synchronisation at institution-set intervals | Their details change without them acting | **Where the interval is set, and how the last run went** |
| 7.2.2 — accounts provisioned from institutional data | They can sign in on day one | **Where provisioning outcomes are visible** |
| 7.2.3 — stream-based access assignment | Content appears or disappears | **Where stream resolution can be checked** |

Batch 03 designs the right-hand column.

### 2.2 What INA-11 shows

| Element | Source |
|---|---|
| **Connection status** — `Connected` / `Not connected` | 7.1.1 |
| **Schedule** — how often the institution's data is brought in, with an interval the institution sets | **7.2.1 — CONFIRMED.** Acceptance criterion: *"An Institute Admin sets the synchronisation interval and can see the last run, its outcome, its counts and its errors."* |
| **Last run** — when it ran, how long it took, and its outcome | **7.2.1 — CONFIRMED** by the same criterion; Review-006 `IAD-12` names the display states (*Scheduled · running · succeeded · failed*) |
| **What the last run updated** — people, academic streams, groups, in plain counts | 7.2.2, 7.2.3 |
| **Records needing attention** — a count linking to INA-12 | **7.2.1 — CONFIRMED.** *"Failed records are retained with a reason, retry is available, and nothing is silently discarded."* |
| **Recent runs** — a short list of previous runs with their outcomes | 7.2.1 operational status; matrix `J3` `V Rp`ᵗ |
| **Run now** | ⚠️ **NOT SOURCE-CONFIRMED — `DA-15`, DESIGN ASSUMPTION, REVERSIBLE.** See §2.3 |

### 2.3 "Run now" — what is confirmed, and what is not

**Confirmed by FRD 7.2.1:** synchronisation is **scheduled**, at an interval the Institute Admin configures, and the Institute Admin can see the last run, its outcome, its counts and its errors. The role's permitted-actions list reads *"Configure ERP integration and synchronisation interval (7.1.1, 7.1.2, 7.2.1)"*. The institutional-integration flow contains only *"Scheduled synchronisation runs at the interval the Institute Admin has configured."*

**Not confirmed:** a **manual or on-demand run**. It appears **nowhere in the FRD set**. Its only prior appearance anywhere is one cell in the Review-006 screen inventory (`IAD-12`, *"Set interval · run now"*) — a design-inventory entry, not a requirement.

**Handling.** The control is **kept**, because it is the only route to the run-in-progress state and the natural action once the institution's own records have been corrected at source. It is recorded as **`DA-15` — DESIGN ASSUMPTION, REVERSIBLE**, and **is presented nowhere as a confirmed requirement**. Removing it costs one state and changes no other screen: the confirmed retry path on INA-12 works on its own.

### 2.4 What INA-11 does not show

**No endpoint. No host or URL. No credential, key, token or secret field. No payload, schema, field name, table or record type. No API version. No provider name. No connector or driver concept. No transport or protocol.**

The connection is presented the way an administrator experiences it — *is it connected, how often does it run, did the last run work, what needs me* — because `QD-03` (which ERP, and what contract) is open and FRD 7.1.1's own list is *"Oracle and Moodle-based systems and other ERP platforms"*, which is not a selection.

The sample "connection" therefore consists of a **connection name the institution chooses** and a **status**. Nothing else is invented.

### 2.5 Ownership of data — the `J6` position

The institution's data source is authoritative for what it supplies (7.1.1) and scheduled synchronisation will overwrite local edits (7.2.1) — yet FRD 4.3.1 also has users providing profile details. **Which fields are user-editable and which are institution-owned is undefined** (`QD-01`, matrix `J6`).

**Working position applied throughout Batch 03:** externally-sourced values are shown **read-only with their origin stated**. Nothing in this workspace offers to edit a value that a later run could silently overwrite. This is the position recorded in the open-questions register; it is applied, and it is not presented as a resolution.

---

## 3 · Records needing attention (INA-12)

### 3.1 The exception this batch demonstrates

The last run **completed with issues**: most records applied, a small number did not. Three sample issue kinds, each chosen because it is a distinct shape of problem an administrator actually has to act on:

| Issue | What the administrator sees | What they can do |
|---|---|---|
| **Academic stream not set up** | The incoming data names a stream the platform does not have, so the people in it resolve to no academic context — and therefore to no content access | See the affected people; retry the records once the structure exists |
| **Person could not be matched** | A record arrived without the institutional identifier the platform needs to match it to a person | See what is missing; retry the records |
| **Incomplete record** | A record arrived without a value the platform needs to place the person in a group | See which value; retry the records |

Each row states **what happened** first and **what to do next** second, in ordinary language, with **no internal code** (`C-07`, `D-18`). Each links to the place the consequence is visible — the person, or the academic structure.

### 3.2 Retry — confirmed, and the only action offered

Retry is **not** an assumption. Three independent statements in the authoritative set establish it:

> *"Given a failed ERP synchronisation run, when the Institute Admin views synchronisation history, then failed records are retained with a reason and a retry is available."* — Institute Admin acceptance criterion
>
> *"Failed records are retained with a reason, retry is available, and nothing is silently discarded."* — institutional-integration flow, step 5 (7.2.1)
>
> *"Given a synchronisation run containing failed records, when it completes, then failed records are retained with a reason, nothing is silently discarded, and a retry is available."* — acceptance criteria register

**Retry is therefore the one sourced action, and it is the only one offered.**

Deliberately absent: edit-the-incoming-record, force-apply, ignore, dismiss, resolve-manually, map-this-value-to-that-one. Every one of those would specify behaviour of an integration contract that does not exist yet (`QD-03`).

### 3.3 The honest limit, stated in the design and not in the product UI

The platform can say *which* incoming value it could not resolve. It cannot say what the institution should change in its own system, and Batch 03 never pretends otherwise. The next step it offers is always something the administrator can do **inside the platform** — look at the affected people, look at the academic structure, retry the records.

---

## 4 · Institution Setup (INA-09)

The landing page for the two connections, carrying the institution record itself.

| Element | Source | Treatment |
|---|---|---|
| Institution name, institution code, primary administrator, institution status | 4.2.1; matrix `A4` `V E`ᵗ; the role's own responsibility *"Register and configure the institution and its tenant settings"* | A short read-only summary with an **Edit** action. **Five fields, not a configuration form** — task brief §18 warns against huge configuration forms, and no source enumerates an institution schema |
| **Single sign-on** status card | 4.2.2 · PM-10 | Status + the next step, linking to INA-10 |
| **Institution data** status card | 7.1.1, 7.2.1 | Status + last run + attention count, linking to INA-11 |

**Not present:** creating or deleting an institution (Super Admin, FRD 4.2.1 / 1.3.5) · tenant or data-residency settings · branding · retention or data-protection settings (Phase 2) · billing details (Phase 2) · role or permission configuration (FRD 8.3, Phase 3).

---

## 5 · No backend, and how that is guaranteed

| Guarantee | How |
|---|---|
| No real single sign-on | *Check connection* resolves against local prototype state. No network request. No redirect. No identity provider is contacted, named or configured |
| No real institution-data integration | *Run now* advances local prototype state on a timer. No request leaves the browser |
| No real entitlement service | Eligibility is computed from local state in the page |
| No external network dependency of any kind | The prototype loads three same-directory files and one same-directory image. No font, script, style, image, analytics or telemetry request goes anywhere |
| Nothing persisted beyond the tab | `sessionStorage`, cleared by **Reset demo** |
