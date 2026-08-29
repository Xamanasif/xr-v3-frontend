# Master Platform Map

**Read this first if you have not seen the five batches.** It is the whole product on one page.

Legend — ✅ designed · 🟠 partly designed · 🔴 not designed · ⚪ blocked on a PM answer

---

## Mermaid

```mermaid
flowchart TB
    subgraph PUB["🌐 PUBLIC — no sign-in required · 🔴 NOT DESIGNED"]
        LAND["Landing"] --> CAT["Catalogue"]
        CAT --> CRS["Course page"]
        CRS --> EXP["Experiment detail<br/>description · outcomes · preview<br/>technology · device requirement"]
        EXP --> FORK{"Who are you?"}
    end

    FORK -->|Institution| B2B["B2B ROUTE<br/>▶ PRIMARY FOCUS"]
    FORK -->|Individual| B2C["B2C ROUTE<br/>▷ SECONDARY"]

    subgraph B2BF["🏛️ INSTITUTION / TENANT — 🔴 NOT DESIGNED"]
        B2B --> SEL["Identify desired content<br/>⚪ cart? request list? enquiry?"]
        SEL --> APP["Application<br/>organisation · SPOC"]
        APP --> VAL["Platform validation<br/>⚪ WHO?"]
        VAL --> AUTH2["Authorisation<br/>⚪ WHO?"]
        AUTH2 --> BR{"Commercial branch<br/>⚪ WHAT DECIDES?"}
        BR -->|Internal| FREE["Access without payment"]
        BR -->|External| PAID["Commercial cycle"]
        FREE --> TEN["Tenant created"]
        PAID --> TEN
    end

    subgraph ALLOC["📦 TENANT CONTENT ALLOCATION — 🔴 GRANTING END NOT DESIGNED"]
        TEN --> SAALLOC["SUPER ADMIN decides which<br/>experiments this tenant receives"]
        SAALLOC --> TSET["The tenant's available set<br/>🟠 receiving end EXISTS — Batch 03"]
    end

    subgraph TENANT["🏫 TENANT WORKSPACE — ✅ MOSTLY DESIGNED · Batch 03"]
        TSET --> TA["TENANT ADMIN"]
        TA --> SSO["SSO ✅"]
        TA --> ERP["Institution data ✅"]
        TA --> PEOPLE["People ✅ view<br/>🔴 manual create · 🔴 CSV import"]
        TA --> ACC["Content access + eligibility ✅"]
        ACC --> ASSIGN{"⚪ WHO ASSIGNS TO A<br/>STUDENT / GROUP?"}
    end

    ASSIGN --> FAC["FACULTY<br/>✅ assessments — Batch 02<br/>🔴 sees tenant experiments<br/>⚪ analytics vs PM-11"]
    ASSIGN --> STU["STUDENT"]

    subgraph B2CF["👤 INDIVIDUAL — ✅ DESIGNED · Batch 04"]
        B2C --> REG["Register 🔴 screen missing"]
        REG --> AUTHQ{"⚪ Authorisation<br/>before payment?"}
        AUTHQ --> PER["Access period<br/>Monthly · Quarterly · Yearly<br/>NO Lifetime · 🔴 no selector built"]
        PER --> PAY["Payment ✅<br/>success · declined · indeterminate"]
        PAY --> ACR["Access created ✅"]
    end

    subgraph CORE["🎓 SHARED LEARNING CORE — ✅ FULLY DESIGNED"]
        ML["My Learning"] --> EX2["Experiment"]
        EX2 --> RES["Learning resources"]
        RES --> SIM["Simulation<br/>Web in browser · AR/VR/MR on device<br/>entitlement-aware, mechanism-neutral"]
        SIM --> ASM["Assessment"]
        ASM --> PRG["Progress · completion"]
    end

    FAC --> ML
    STU --> ML
    ACR --> ML

    subgraph GOV["🏭 CONTENT SUPPLY — ✅ DESIGNED · Batch 01"]
        V["VENDOR<br/>submit"] --> AR["ACADEMIC REVIEWER<br/>validate"]
        AR --> CM["CONTENT MANAGER<br/>readiness + PUBLISH"]
        AR -.changes required.-> V
        CM -.changes required.-> V
        CM --> PUBC["PUBLISHED CONTENT"]
        PUBC --> VER["Version release / hold<br/>⚪ OWNERSHIP AMBIGUOUS"]
    end

    PUBC --> CAT
    PUBC --> SAALLOC
```

---

## ASCII — the same map, linearly

```
                     ┌──────────────────────────────────┐
                     │   CONTENT SUPPLY  ✅ Batch 01     │
                     │                                  │
                     │  Vendor → Reviewer → Content Mgr │
                     │     ▲        │           │       │
                     │     └── changes required ─┘      │
                     │                          ▼       │
                     │                  PUBLISHED       │
                     │                  CONTENT         │
                     │            ⚪ version release?    │
                     └──────────┬─────────────┬─────────┘
                                │             │
              ┌─────────────────┘             └──────────────┐
              ▼                                              ▼
   ┌──────────────────────┐                    ┌─────────────────────────┐
   │ PUBLIC CATALOGUE  🔴 │                    │ TENANT ALLOCATION    🔴  │
   │ landing · catalogue  │                    │ Super Admin decides     │
   │ course · experiment  │                    │ which experiments a     │
   │ ⚪ pricing? ⚪ CTA?   │                    │ tenant receives         │
   └──────────┬───────────┘                    └───────────┬─────────────┘
              │                                            │
      ┌───────┴────────┐                                   │
      ▼                ▼                                   │
 INSTITUTION      INDIVIDUAL                               │
   🔴 all new     ✅ Batch 04                               │
      │                │                                   │
  application     register 🔴                              │
      │                │                                   │
  validation ⚪    ⚪ authorise?                             │
      │                │                                   │
  authorisation ⚪  period ✅ M/Q/Y 🔴 no selector           │
      │                │                                   │
  free ⚪ / paid ⚪  payment ✅                               │
      │                │                                   │
  TENANT CREATED 🔴    │                                   │
      │                │                                   │
      └────────────────┼───────────────────────────────────┘
                       │
              ┌────────▼─────────────────────────┐
              │ TENANT WORKSPACE  ✅ Batch 03     │
              │ SSO ✅ · institution data ✅       │
              │ people 🟠 (🔴 create · 🔴 CSV)     │
              │ content access + eligibility ✅   │
              │        ⚪ who assigns to a         │
              │           student/group?          │
              └────────┬──────────────┬───────────┘
                       ▼              ▼
                   FACULTY         STUDENT
                   ✅ assessments   ✅ learning
                   🔴 experiments
                       │              │
                       └──────┬───────┘
                              ▼
              ╔═══════════════════════════════════╗
              ║  SHARED LEARNING CORE  ✅          ║
              ║  My Learning → Experiment →       ║
              ║  resources → simulation →         ║
              ║  assessment → progress            ║
              ║  Batches 01 + 02                  ║
              ╚═══════════════════════════════════╝
```

---

## What the map shows at a glance

| | |
|---|---|
| **The bottom is finished** | The learning core and the content-supply chain are designed end to end |
| **The top is missing** | Everything before a person has an account — public discovery, entry, application, authentication |
| **The middle has one new stage** | Super Admin → tenant content allocation. **The receiving end exists; the granting end does not** |
| **Seven ⚪ markers** | Every one is a PM question, not a design problem |
