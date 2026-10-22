# PU-01 / PU-14 — V1 Public Landing fidelity integration: analysis and plan

Prepared 22 Oct 2026, read-only. No repository file was changed, nothing was built, no server was started or stopped. The product was read only on `http://localhost:3360` (commit `4c0f180`, branch `v3/refined-b-ui`) from fresh Playwright contexts. Governing task: `design/v3-refined-b/pack/13-HOLD-ONLY-V1-Landing-Fidelity-Integration.md` (HOLD ONLY; it needs the owner's explicit go-ahead before any work).

Evidence folder (outside the repository): `/Users/mymac/Desktop/XR-V3-stakeholder-demo/evidence/landing-plan/` (the `render/` working copy of the frozen file is not kept there; the authoritative file stays in `~/Downloads`).

- `shots/` holds the screenshots named below.
- `frozen-probe.json`, `frozen-motion.json` and `product-probe.json` hold the measurements.
- `frozen-vs-module.diff` is the full diff between the two source copies.
- `scripts/` holds the read-only probe scripts.
- `render/` holds a byte copy of the frozen file (SHA-256 re-checked: `3dbe9412…4d07c`) plus `support.js`. For rendering only, it also holds a copy of the supplied logo at the path the frozen file expects (`assets/bits-wilp-lockup.png`).

Line numbers refer to `21 · FROZEN · Premium Direction B2 - BITS Immersive Experience.dc.html` (2,161 lines) unless stated otherwise.

---

## 1. Source verification

|               | 21 · FROZEN (authority)                                                                                                                                                                        | 35 · MODULE · 21 Public Landing (subordinate copy)                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Path          | `~/Downloads/21 · FROZEN · Premium Direction B2 - BITS Immersive Experience.dc.html` (identical to the file35 handoff copy)                                                                    | `~/Downloads/file35-current-design-handoff/35 · MODULE · 21 Public Landing.dc.html`                                                       |
| Bytes / lines | 265,596 / 2,161                                                                                                                                                                                | 259,410 / 2,106                                                                                                                           |
| SHA-256       | `3dbe9412df26e8479379e10f5f76cc1d87923f773a7be3e226f6c30b75a4d07c`                                                                                                                             | `3e81d0a8cf907a58453d17ab73ab642f1c6beabac738b00aa30c4f0bbb35f276` (matches MANIFEST, `authorityType: MODULE`, version v1790687319709246) |
| Status        | Interactive approved version: a three-scene rotating hero, a scroll-driven four-state story, an accordion explorer, format previews and reveals. **It is not v46's "one static scene" board.** | Its own header comment calls itself "not a design source", with source of truth = 21 FROZEN @ v1790241320737635                           |

**What the module changes.** The full diff is in `frozen-vs-module.diff`; it has 95 lines.

1. **M1 harness removed.** Frozen lines 31–46 (the "Direction B2 harness · outside the product" bar: Landing/Catalogue, 1440/1024/768/375, "Reduced motion", "Measure frame") are replaced by an `xr35Orphan` notice. That notice shows only when the module is opened without a File-35 host.
2. **Internal record removed.** Frozen lines 958–1010, the `<section aria-label="Internal Direction B2 visual record">`, are deleted. The record data arrays stay in `renderVals`.
3. **M2 route check.** A new `xr35Ask(to, kind)` method asks `props.host.request(...)` before `goLanding`/`goCatalogue`. If no host is present, the frozen behaviour is unchanged.
4. **M4 identity.** Adds the `static XR35` metadata, the `data-xr35-module="21"` attribute on the root div and the `xr35Orphan` value.
5. **"M3 start point"** is named in the module's comment, but the diff contains no code change for it.

The module leaves unchanged:

- the scaled presentation frame (lines 48–50: the `transform:scale()` frame with an inner scroll container)
- the Catalogue subview (frozen 779–908)
- the filter sheet (frozen 923–957)
- every landing section, timing and copy

**Conclusion.** The landing content is identical between the two copies, so 21 FROZEN is the only authority. The module adds nothing the product needs. Per pack 13 §4, the Catalogue subview inside either file is not authority over the approved non-landing Public pages (PU-02…PU-12).

The frozen file's own record also marks some of its content as canvas-only (`recordFreeze` / `recordFix`, 2079–2116). The following must never ship:

- the harness bar
- the scaled frame and the `deskRef`/`frameRef` machinery
- the props `surface`, `frameWidth`, `autoRotate`, `forceReducedMotion` and `showInternalRecord`
- the internal record
- `data-screen-label`
- the Catalogue subview and filter sheet
- `support.js` (`DCLogic`, `<x-dc>`, `<helmet>`, `sc-for`/`sc-if` templating, and the `style-hover`/`style-focus`/`style-active` attributes, which the host compiles to `.scpN:hover{…!important}` rules)
- `image-slot.js`

---

## 2. Design inventory — the LANDING view only

### 2.1 Page order

The page sequence is: sticky header → Hero → tricolour → Featured → Explore by area → Inside a simulation → Formats → Academic quality → For institutions (PU-14) → closing gold band → footer.

Measured section tops and heights (frozen render, frame px):

| Section                                          | 1440        | 1024        | 768         | 375                              |
| ------------------------------------------------ | ----------- | ----------- | ----------- | -------------------------------- |
| Header (sticky)                                  | 76          | 76          | 76          | 60                               |
| Hero "Introduction"                              | 76 / 754    | 76 / 703    | 76 / 990    | 60 / 954                         |
| Featured                                         | 835 / 866   | 784 / 1337  | 1071 / 1352 | 1019 / 1124                      |
| Explore by area                                  | 1701 / 937  | 2121 / 877  | 2423 / 997  | 2143 / 986                       |
| Inside a simulation (includes the scroll runway) | 2638 / 2438 | 2997 / 2467 | 3419 / 2241 | 3129 / 816 (tap mode, no runway) |
| Formats                                          | 5076 / 731  | 5464 / 815  | 5660 / 1037 | 3944 / 846                       |
| Academic quality                                 | 5807 / 636  | 6279 / 840  | 6697 / 913  | 4790 / 1142                      |
| For institutions                                 | 6443 / 635  | 7119 / 659  | 7610 / 759  | 5932 / 1056                      |
| Closing band                                     | 7078 / 266  | 7778 / 266  | 8369 / 273  | 6987 / 245                       |
| Footer                                           | 7344 / 122  | 8043 / 150  | 8643 / 212  | 7232 / 223                       |
| **Total height**                                 | **7466**    | **8194**    | **8854**    | **7455**                         |

There is no horizontal overflow at any width (`scrollWidth` equals the frame width). With reduced motion at 1440 the total is 5861, because the story has no runway.

### 2.2 Sections and content

**Header (404–421; values 1972–1980).**

- **Shell:** sticky `top:0`, `z-index:40`, background `#141B5E`, `box-shadow:0 1px 0 rgba(255,255,255,.08)`. Height 76 px (60 px at phone); horizontal padding `padX`.
- **Brand:** one button, `onHome`, containing:
  - a white logo tile (§3)
  - a 1 px × `logoH` divider in `rgba(255,255,255,.22)`
  - the text "Simulation Learning Platform" (700, 19/17/15 px, −.015em, `max-width:150px` at phone)
- **Sub-line:** "Experiments · WEB · AR · VR · MR" is defined but hidden (`brandSubShow:'none'`).
- **Nav (1949–1955):**
  - Buttons "Featured", "Formats" and "For institutions": 15 px, 500, `#C9CEF2`, hover `#FFF`. They are hidden below 1024, and nothing replaces them (no menu).
  - A gold button, 44 px tall, `#E9A825` (hover `#F4B93A`, active `#C98A12`). It reads "Browse the catalogue", or "Catalogue" at phone.

**Hero (426–489; values 1601–1653, 1984–2017).**

- **Stage:**
  - Canvas height 640 (wide) / 580 (mid) / 780 (narrow) / 690 (phone).
  - Base gradient `#0B1040 → #0C1247 → #090D38`.
  - An isometric lattice (60° and −60° at 54 px plus 0° at 31 px, 5 % white, masked from the left, opacity .55) on the media zone. The media zone starts at `subjLeft` (38 %, 36 %, or 0 below 1024).
- **Scenes:** three scenes stacked, defined in `HERO` (1077–1098):
  - e1 Thermal (`#artThermal` + `#flowThermal`)
  - e6 Motor (`#artMotor` + `#flowMotor` + conic spin)
  - e10 Process (`#artProcess` + `#flowProcess`)
  - Each scene has an atmosphere layer, a drifting glow and a subject.
  - An annotation row shows the course chip (`ME ZG523 · Thermodynamics & Heat Transfer`) and four format chips (WEB/AR/VR/MR, with off-state chips for formats not offered).
  - The course-link button exists but is hidden (`linkShow:'none'`).
- **Copy, left:**
  - Eyebrow "BITS Pilani · Work Integrated Learning Programmes" (12 px, 600, .1em, `#F7C95B`).
  - H1 on three block lines: "Set the conditions." / "See what follows." / "Understand why." The third line is `#F7C95B`. Size 56/46/46/31 px, line-height 1, −.025em.
  - Lead: "Hands-on simulations of the lab experiments in your WILP courses, offered across WEB, AR, VR and MR." (17.5/16/14.5 px, lh 1.55, `#DDE1F8`).
  - CTAs "Browse the catalogue →" (gold, 54 px tall, 50 px at phone) and "See featured experiments" (outline).
- **Label, top right:** "Illustrative concept artwork · not a simulation capture" (or "Illustrative artwork · not a capture" at phone).
- **Selector (`heroPicks`):** a "Experiment scenes" group of three cards plus a round 44 px Pause/Play button.
  - Each card has a 128×82 thumbnail (108×70 mid; full width × 88 narrow; 72×48 phone), a kicker "01 · Thermal & heat transfer", and a title.
  - The cards overlap the stage by 30 px at wide (16 px narrow).
  - The active card shows a gold progress edge that fills over 7.6 s.
- **Tricolour (491):** 5 px bands `#F2A33A` / `#7CC0E8` / `#E5323B`. They grow in on load (scaleX, 900 ms, delays 700/860/1020 ms).

**Featured (493–527; 1655–1676).**

- **Section:** background `#F4F5FB`, top padding 88/64/48. Eyebrow "Featured experiments" (`#8A5A05`), H2 "Start with our flagship simulations.", lead "A curated selection across our engineering areas, including an experiment offered in all four formats."
- **Link:** "See all 12 experiments →" with a gold underline.
- **Cards:** four, in a fixed order — CNC Turning Centre (e4), Shell-and-Tube (e1), Induction Motor (e6), Distillation (e10).
  - Each card has art with an area badge, then course line, title, one-line descriptor (fixed text, 1657–1660), duration ("40 min" etc.), four format chips and "View in catalogue →".
  - Layout: 4-up at ≥1300, 2×2 from 560 to 1299, horizontal compact cards at phone (112 px art column; no description and no badge).

**Explore by area (529–560; 1678–1731).**

- **Head:** white section. Eyebrow "Explore by area", H2 "Every experiment, by engineering area.", lead "Pick an area to see its courses, then browse its experiments."
- **Accordion:** a row of three area panels with full-bleed close-up art (`expCrop` viewBoxes).
  - At ≥1024 the panels share the row 54/23/23 by flex, and hover selects a panel. Row height is 580 (520 mid).
  - Below 1024 the panels stack vertically by height: 460–472 px open, 98–116 px closed.
- **Expanded panel:** name, count ("5 experiments · 2 courses"), blurb, course list ("ME ZG523 · Thermodynamics & Heat Transfer") and a gold "Browse 5 experiments →".

**Inside a simulation (562–671; 1733–1802; engine 1255–1449).**

- **Head:** navy section. Eyebrow "Inside a simulation", H2 "See one experiment unfold.", lead "A representative look at how a learner can investigate one experiment."
- **Stage:** one stage, labelled "Illustrative session: Shell-and-Tube Heat Exchanger".
  - The media pane is about 1.7fr and the text plate 1fr; below 1024 they stack.
  - Media layers: lattice, warm/cold glows, the `#artThermal` exchanger under a moving "camera" transform, flow dashes, falling arrows (b2drop), station rings T1–T4, a flow-rate control plate (Hot/Cold flow sliders, `aria-hidden`), and a plot plate.
  - The plot: axes NTU × Effectiveness, eight reading dots, a fitted curve, the legend "Your readings / Fitted relationship" and the caption **"Illustrative · no measured values"**.
  - Context card: "Illustrative session · Shell-and-Tube Heat Exchanger · ME ZG523 · Thermodynamics & Heat Transfer".
  - Caption: "Illustrative artwork · not a simulation capture".
- **Plates (STORY 1750–1755):**
  - 01 Understand — "Two streams, one exchange."
  - 02 Observe — "Set it up and look closely."
  - 03 Experiment — "Change a condition. See the response."
  - 04 Interpret — "Find the relationship in your readings."
- **Index:** a "Story steps" group of four buttons with a gold progress bar.
- Screenshots: `shots/frozen-1440-story-1..4.png` and `frozen-375-story-1/4.png`.

**Formats (673–699; 1804–1847).**

- **Head:** lilac `#E6E8FA` section. Eyebrow "Formats", H2 "One experiment. Four ways to run it.", lead "WEB, AR, VR and MR are equal options. Each experiment shows the formats it offers."
- **Cards:** four peer cards; 4-up at ≥1024, 2×2 below.
  - Each card has a media button (preview: base art plus a reveal layer, cyan glow, gold 4 px top edge, 8 px lift).
  - Below the media: code (30/22 px), kind ("Browser", …), a one-line text (hidden at phone), "Offered in N of 12 experiments", and "Browse WEB experiments →" ("Browse WEB" at phone).
- Screenshot: `shots/frozen-1440-formats-vr-preview.png`.

**Academic quality (701–738; 1849–1855).**

- **Section:** warm `#FBF7EE`.
- **Panel, left (moves below the copy under 1024):** a navy panel with three stepped plates — Course "ME ZG523 · Thermodynamics & Heat Transfer" → Experiment "Shell-and-Tube Heat Exchanger" with a gold "Reviewed" seal → Offered formats chips (MR unfilled). The plates are joined by elbow connectors.
- **Copy:** H2 "Academically reviewed. Built around your courses." (42/34/30), lead.
- **Trust points:** four, with icons — Academically reviewed / Mapped to your course / Consistent across offered formats / Reviewed again when content changes. They sit 2×2, in one column at 1024–1299 and at phone.

**For institutions = PU-14 (740–764; 1856–1869).**

- **Head:** white section with a `#ECE5D3` top hairline. Eyebrow "For institutions", H2 on two lines "Anyone can browse." / "Institutions grant access.", lead "Running an experiment needs access arranged through your institution."
- **Steps:** an ordered list "How access works" with **six** steps (01 Browse the catalogue … 06 Institution grants student access). Each has a ring marker and connector rules, including return connectors at row ends.
  - Layout: 3 across at ≥1024, 2 across at 560–1023, a vertical list at phone.
- **No button inside the section.** Record I/F (2088, 2099) states it was removed.

**Closing band (766–774).**

- Gold `#E9A825`. H2 "Find the experiments for your course." (54/40/34, lh .98).
- One button, "Browse the catalogue →", navy 56 px. Line 773 is empty where a second button used to be.

**Footer (910–920).**

- Background `#0C1247`.
- Logo tile (§3) plus "Simulation Learning Platform".
- Buttons Catalogue · Featured experiments · Formats · For institutions.
- Note: "Sample courses and experiments · illustrative concept artwork · no production data".

### 2.3 Typography

- **Family:** Public Sans only, weights 400/500/600/700. It is loaded from **Google Fonts** (`<link>` lines 11–12, `display=swap`) — the same URL the product root layout already loads (`apps/web/src/app/layout.tsx`).
  - No font files are bundled, so the "no machine font redistribution" rule is satisfied by keeping the Google Fonts link.
  - Probe: Public Sans 400/500/600/700 loaded at every width.
- **Monospace exception:** the SVG text labels T1–T4 (line 165) name `'JetBrains Mono',monospace`. That font is never loaded, so it renders in the system monospace. **Do not add a font**; keep the fallback.

Role scale, at wide / mid / narrow / phone:

| Role               | Size                  | Weight | Line-height | Tracking |
| ------------------ | --------------------- | ------ | ----------- | -------- |
| H1                 | 56 / 46 / 46 / 31 px  | 700    | 1           | −.025em  |
| Light-section H2   | 46 / 46 / 36 / 30     | 700    | 1.05        | −.025em  |
| Academic H2        | 42 / 42 / 34 / 30     | 700    | 1.05        | −.025em  |
| Closing H2         | 54 / 54 / 40 / 34     | 700    | .98         | −.03em   |
| Lead               | 17.5 / 16 / 16 / 14.5 | —      | 1.55        | —        |
| Eyebrows           | 12 px uppercase       | 600    | —           | .1em     |
| Body small         | 14.5                  | —      | 1.5         | —        |
| Chips              | 10.5–11.5             | 600    | —           | .06em    |
| Story plate H3     | 30 / 26 / 24 / 21     | —      | —           | —        |
| Story plate body   | 15.5 / 14.5           | —      | —           | —        |
| Story index labels | 14.5 / 11             | —      | —           | —        |
| Format code        | 30 / 22               | —      | —           | —        |
| Access step title  | 19 / 17.5             | —      | —           | —        |
| Hero buttons       | 15.5 px               | 700    | —           | —        |
| Header CTA         | 14 px                 | 700    | —           | —        |

### 2.4 Colour tokens (all literal; the record says they are "working choices, not WILP brand values")

| Role          | Values                                                                                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Navy          | `#0C1247` (hero, story, footer), `#080C33`, `#0A0F3A` (stage), `#141B5E` (header, headline navy, dark button), `#1B2470`, `#121A5C`/`#0E1550` (plate), `#0B1040`/`#090D38` (hero gradient) |
| Ink           | `#12173F` (text), `#40476B` (body), `#5C6389` (meta), `#7A81A8` (off chip)                                                                                                                 |
| Gold          | `#E9A825` (primary), `#F4B93A` (hover), `#C98A12` (active), `#F7C95B` (accent), `#8A5A05` (eyebrow on light)                                                                               |
| Light accents | `#35C0DE` cyan, `#9FE9F8`, `#F0A93A` orange, `#8592E6`, `#3B49B8`, `#C9CEF2`, `#DDE1F8`, `#9AA3DD`, `#A9B0E0`                                                                              |
| Focus / link  | `#1F4FD8`                                                                                                                                                                                  |
| Grounds       | `#F4F5FB` (featured), `#FFFFFF`, `#E6E8FA` (formats), `#FBF7EE` (academic), `#E9A825` (band)                                                                                               |
| Lines         | `#ECE5D3`, `#DFE3F5`, `#E1E4F3`, `#C9CEEA`                                                                                                                                                 |
| Tricolour     | `#F2A33A`, `#7CC0E8`, `#E5323B`                                                                                                                                                            |
| SVG gradients | 30+ defined in `<defs>` (52–401)                                                                                                                                                           |

### 2.5 Spacing, radii, shadows

**Breakpoints** are by frame width, from `renderVals` line 1578:

- phone < 560
- narrow < 1024
- mid < 1300
- wide ≥ 1300

768 and 375 are sample widths, not breakpoints.

**Spacing:**

- `padX` 64 / 40 / 28 / 18; section padding 96 / 96 / 64 / 56.
- Header 76 / 60.
- `expMt` 44 / 28; headings gap 48 (18 narrow); featured gap 20 (12); formats gap 18 (12).
- Access gaps `40px 28px` (`22px 0` at phone).

**Radii:**

- buttons 6; chips 4–5; logo tile 4; thumbnails 8; cards 12–14; story stage 18; plot 12; sheet 18.

**Shadows:**

- stage `0 30px 70px rgba(4,7,22,.5)`
- active pick `0 18px 40px rgba(4,7,22,.5)`
- featured hover `0 26px 50px rgba(12,18,71,.16)`
- explorer active `0 26px 60px rgba(12,18,71,.28)`
- format active `0 26px 54px rgba(12,18,71,.24)`
- gold CTA hover `0 10px 26px rgba(233,168,37,.32)`

**Easings:** `cubic-bezier(.3,0,.15,1)` (`EASE`) and `cubic-bezier(.2,.7,.2,1)` (`EASE2`).

### 2.6 Motion and interaction, with their drivers

| Behaviour                                                                                   | Timing                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Driver (lines)                                                                                                                  |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Keyframes `b2drift`, `b2spin`, `b2sweep`, `b2dash`, `b2pulse`, `b2rise`, `b2ring`, `b2drop` | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | 18–25                                                                                                                           |
| Hero auto-rotation                                                                          | `setTimeout` every **7,600 ms**. It skips while the hero is off-screen or the tab is hidden, and stops when paused or under reduced motion. Measured: changes at about +5 s and about +12 s after load.                                                                                                                                                                                                                                                                                                                                                                                    | `tick()` 1218–1231; `visibilitychange` 1148                                                                                     |
| Scene change                                                                                | Outgoing: subject fades in 420 ms and scales to 1.03; atmosphere fades in 520 ms. Incoming: atmosphere 720 ms; clip-path reveal left→right 820 ms (+80 ms delay); opacity 360 ms. Annotations +640 ms (420 ms opacity, 600 ms rise 12 px). One light sweep of 1,100 ms.                                                                                                                                                                                                                                                                                                                    | 1604–1623                                                                                                                       |
| Manual scene pick                                                                           | Selects the scene and sets `playing:false` (stops rotation; ambient motion continues). Clicking the active scene only pauses.                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `selectHero` 1232–1235                                                                                                          |
| Pause/Play                                                                                  | `aria-pressed`, label "Pause motion"/"Play motion". It stops rotation **and** all ambient animation (`animation-play-state`). **Hidden at phone** (`playShow`, 2014).                                                                                                                                                                                                                                                                                                                                                                                                                      | 483–487, 2011–2015                                                                                                              |
| Ambient (active scene only)                                                                 | Glow drift 20 s alternate; conic spin 40 s (motor); thermal dashes 4.6 s and 5.6 s; station rings 3.2 s (stagger .8 s); motor pulse 3.8 s; process dash 3.2 s; vapour rise 8 s                                                                                                                                                                                                                                                                                                                                                                                                             | 89–100, 433–435                                                                                                                 |
| Pointer parallax                                                                            | Subject translates by −14 px × x and −9 px × y, through rAF, with a 600 ms ease; resets on leave (900 ms). Off under reduced motion.                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `heroMove` 1236–1250, `heroLeave` 1251–1253                                                                                     |
| Intro stagger                                                                               | Eyebrow, H1 lines, lead, CTAs and selector: 700 ms opacity / 900 ms 18 px rise at delays 60/170/290/410/560/680/820 ms. Starts 90 ms after mount.                                                                                                                                                                                                                                                                                                                                                                                                                                          | 1650–1653, 1152                                                                                                                 |
| Scroll reveals                                                                              | `[data-reveal]` below the fold: opacity 0 → 1 and 28 px rise (700/900 ms). `[data-seq]` connectors draw (scaleX/Y 760 ms) and markers pop (scale .5 → 1), staggered 200 + 90·k ms. Threshold .06. Nothing is hidden when reduced motion is on or IntersectionObserver is missing.                                                                                                                                                                                                                                                                                                          | `setupReveal` 1190–1214                                                                                                         |
| Pick-card hover/focus                                                                       | 3 px lift (6 px when active), thumbnail scale 1.06 over 520 ms, colour shifts 220 ms                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | 1625–1648                                                                                                                       |
| Featured hover/focus                                                                        | 6 px lift, art scale 1.05 over 800 ms, CTA gap 8 → 14 px, underline turns gold                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | 1662–1676                                                                                                                       |
| Explorer accordion                                                                          | Hover (≥1024), focus or click selects. Width (or height below 1024) moves over 520 ms; art scale; scrim. Extra content height animates (opacity delay 200 ms). Arrow, Home and End keys move and focus; closed panels' Browse buttons have `tabIndex -1`.                                                                                                                                                                                                                                                                                                                                  | 1678–1731                                                                                                                       |
| Story engine                                                                                | One continuous value p (−1 … 3) drives about 60 CSS custom properties on the stage (camera, glows, traces, chips, plot draw, index bar). **Scroll mode (≥560):** a sticky stage (`top = headerH + centred in viewH`, where viewH is the fixed 940/900/812 frame height), a runway of 1,530 px (1,320 tablet), knots at 1741, exponential smoothing τ 70 ms, `storySettle` easing at the ends; index clicks scroll to `holdD`. **Tap mode (phone):** a 1,000 ms tween. **Static mode (reduced motion):** immediate. Distant jumps use an 820 ms cross-blend; text layers fade out, then in. | `storyKick`/`storyGeo`/`storyMap`/`storySettle`/`storyParams`/`storyCss`/`storyFrame`/`selectStory` 1255–1449; config 1733–1802 |
| Story keys                                                                                  | Click, Enter or Space; ← and → wrap and move focus. The active step's `aria-pressed` and the plate's `aria-hidden` are set by the engine.                                                                                                                                                                                                                                                                                                                                                                                                                                                  | 1761–1773, 1425–1430                                                                                                            |
| Format preview                                                                              | Pointer-enter, focus or click previews: 8 px lift, gold edge, reveal layer 300/360 ms, cyan glow. "Browse" is a separate button.                                                                                                                                                                                                                                                                                                                                                                                                                                                           | 1826–1847                                                                                                                       |
| Section navigation                                                                          | Smooth scroll to the section top minus header height (instant under reduced motion)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `scrollToRef`/`goSection` 1552–1563                                                                                             |
| Hover/focus states                                                                          | `style-hover`, `style-focus` and `style-active` attributes throughout the markup. Focus rings: gold `#F7C95B` on dark, blue `#1F4FD8` on light, white on gold. These are `:focus` rules, not `:focus-visible`.                                                                                                                                                                                                                                                                                                                                                                             | markup                                                                                                                          |

**Reduced motion.**

- `matchMedia('(prefers-reduced-motion: reduce)')` is read in `componentDidMount` (1118–1124) and listened to for changes.
- Under it: rotation off, ambient off, no sweep, parallax, lifts, reveals or intro, and the story in static mode.
- Verified with emulated reduced motion: "Play motion" `aria-pressed=false`; scenes did not change over 9 s; story stage `position:relative`; page height 5,861; screenshot `shots/frozen-1440-reduced-story-4.png`.

### 2.7 Responsive renders (screenshots)

| Width | Frozen                                                | Current product                   |
| ----- | ----------------------------------------------------- | --------------------------------- |
| 1440  | `shots/frozen-1440-fullpage.png`, `-viewport-top.png` | `shots/current-1440-fullpage.png` |
| 1024  | `shots/frozen-1024-fullpage.png`, `-viewport-top.png` | `shots/current-1024-fullpage.png` |
| 768   | `shots/frozen-768-fullpage.png`, `-viewport-top.png`  | `shots/current-768-fullpage.png`  |
| 375   | `shots/frozen-375-fullpage.png`, `-viewport-top.png`  | `shots/current-375-fullpage.png`  |

**How the frozen full-length captures were made.** The inner frame was expanded to its scroll height, so the sticky story shows its entry state in those images. The story states are in the separate viewport shots.

Additional state shots:

- `frozen-1440-hero-scene-after-rotation.png`, `frozen-1440-hero-scene3.png`
- `frozen-1440-explorer-electrical.png`
- `frozen-1440-formats-vr-preview.png`
- `frozen-1440-catalogue-subview-NOT-AUTHORITY.png` — recorded only to show where the frozen header CTA leads, to its own "Experiment library" subview. It is not to be built.

### 2.8 Accessibility of the frozen controls (facts)

**What holds:**

- Every control is a real `<button>` with a visible focus style.
- Hero: section `aria-label="Introduction"`; selector group "Experiment scenes" with `aria-pressed`; inactive scenes are `aria-hidden` and their links have `tabIndex -1`; the Pause button has a label and `aria-pressed`.
- Explorer: a group with `aria-pressed` and keyboard support.
- Story: a region; index buttons have `aria-label` "Step 01: Understand" and `aria-pressed`.
- Format previews: `aria-pressed`, with the long description as the name.
- Artwork carries `role="img"` and full descriptions; decorative layers are `aria-hidden`.

**What is missing or conflicts:**

- **Navigation is done by buttons, not links.**
- There are **no `<header>`, `<nav>`, `<main>` or `<footer>` landmarks apart from the footer element, and no skip link.**
- The Pause control is absent at phone width (see §7).

---

## 3. The logo

**Where the frozen design places it:**

- **Header (407):** inside the brand button. A `span` with `background:#FFFFFF`, padding `6px 10px` (`5px 10px` at phone), `border-radius:4px`, holding an `<img src="./assets/bits-wilp-lockup.png" alt="BITS Pilani Work Integrated Learning Programmes">` with `object-fit:contain`.
  - Image box 68×34 px, tile 88×46, at ≥560.
  - Image box 48×24 px, tile 68×34, at phone.
  - Followed by the 1 px divider and the product name.
- **Footer (912):** the same tile (6px 10px, radius 4) with the image at **60×30 at every width** (tile 80×42).
- The frozen file names the asset `assets/bits-wilp-lockup.png`, not `wilp-lockup.png`. The asset is **not** in the handoff bundle. It renders as a broken image unless supplied; in my render a copy of the supplied PNG was placed at that path.

**The supplied PNG** (`~/Downloads/bits-pilani-wilp-logo.png`, SHA-256 `f98fe1f89cf9…7184c`):

- 632×316 px, 8-bit palette (123 colours), no transparency, white background.
- **Byte-identical** to `AR-VR-v3-ui/branding/bits-pilani-wilp-logo.png`, which is already committed and deliberately unused (VD-03; `packages/ui/src/foundation/logo-placeholder.tsx`).

**How it fits the tile:**

- Its 2:1 aspect equals every frozen box (68×34, 48×24, 60×30), so `contain` fills each box with no letterboxing.
- Its white background merges with the white tile, so no seam shows.

**Whitespace inside the image (measured):**

- The non-white content box is x 46–585, y 54–261: 540×208 px, which is 85 % of the width and 66 % of the height.
- Rendered content size:
  - header ≈ 58×22 px
  - phone header ≈ 41×16 px
  - footer ≈ 51×20 px
- At these sizes the crest and the "BITS Pilani" wordmark are recognisable. The lines "Pilani | Dubai | Goa…" and "WORK INTEGRATED LEARNING PROGRAMMES" are about 2 px tall and not legible (see `shots/frozen-1440-viewport-top.png`).

**Crispness at 2×:**

- Source pixels per device pixel: 4.65 (header), 6.58 (phone header), 5.27 (footer).
- The raster has more than enough resolution, so a higher-resolution PNG or an SVG would not add sharpness at these box sizes.
- Legibility of the small lines is limited by the box size and the image's built-in margins, not by resolution. Changing that would be a design or asset change (a tighter crop or a larger box), and it is for the owner, not the implementation.

**Current product:** it shows the dashed placeholder "BITS Pilani / WILP logo — placeholder" at 148×48 (118×44 at phone) in the header and footer.

---

## 4. Dependencies and missing assets

| Dependency                                                                                                                                                                                                                                                                                                                                                     | Use                                                                                                                                                          | Status / ship?                                                                                                                                                                                                                                                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `./support.js` (design host: `DCLogic`, `<x-dc>`, `<helmet>`, `sc-for`/`sc-if`, `{{ }}` binding, `style-hover/focus/active` → `.scpN` rules, `ref`, prop editor)                                                                                                                                                                                               | runtime                                                                                                                                                      | Present in the handoff. **Must not ship.** Rebuild as React.                                                                                                                                                                                                                                     |
| `./image-slot.js` (line 13)                                                                                                                                                                                                                                                                                                                                    | design-host helper                                                                                                                                           | **Missing** (file:// 404). It is unused by the landing — there is no `<image-slot>` element. Must not ship.                                                                                                                                                                                      |
| `./assets/bits-wilp-lockup.png`                                                                                                                                                                                                                                                                                                                                | header and footer logo                                                                                                                                       | **Missing from the handoff**. The owner's PNG is available (§3). Ship it only after owner confirmation.                                                                                                                                                                                          |
| Google Fonts `Public Sans:wght@400;500;600;700`                                                                                                                                                                                                                                                                                                                | the only type family                                                                                                                                         | Already linked by the product root layout (same URL). Nothing to add or bundle.                                                                                                                                                                                                                  |
| `'JetBrains Mono'` (SVG T1–T4 labels)                                                                                                                                                                                                                                                                                                                          | named, never loaded                                                                                                                                          | Falls back to system monospace. Do not add.                                                                                                                                                                                                                                                      |
| Inline SVG `<defs>` (52–401): 30+ gradients, 7 clipPaths; symbols `flowThermal`, `flowMotor`, `flowProcess`, `artBundle`, `artSyncGen`, `artThermal`, `artMotor`, `artProcess`, `artUnderstand`/`Observe`/`Experiment`/`Interpret` (unused on the landing), `artWeb`/`WebOn`, `artAr`/`ArOn`, `artVr`/`VrOn`, `artMr`/`MrOn`, plus 8 catalogue-only thumbnails | all artwork                                                                                                                                                  | Self-contained in the file; port verbatim. The v46 copies under `packages/ui/src/styles/v46/art/*.svg` are static CSS background images taken from the same B2 drawings, with no flow layers. They cannot provide `<use>` references or the animated overlays, so they are **not** a substitute. |
| Browser APIs                                                                                                                                                                                                                                                                                                                                                   | `matchMedia`, `IntersectionObserver`, `ResizeObserver`, `requestAnimationFrame`, `document.fonts.ready`, `visibilitychange`, `scrollTo({behavior:'smooth'})` | Standard. Add jsdom stubs for unit tests.                                                                                                                                                                                                                                                        |
| External images, video, canvas or WebGL                                                                                                                                                                                                                                                                                                                        | none                                                                                                                                                         | —                                                                                                                                                                                                                                                                                                |
| Fixture data (`TECHS`, `GROUPS`, `COURSES`, `FIXTURE` e1–e12, `ATM`, `THUMB`, `HERO`)                                                                                                                                                                                                                                                                          | content                                                                                                                                                      | Must not be pasted over the app's records (owner decision 7). Bind to the sample-world catalogue (§6.3).                                                                                                                                                                                         |

Console errors seen in the frozen render (all host-side, not design defects):

- the `image-slot.js` 404
- `Fetch API cannot load file://` (support.js reading its own source)
- seven unresolved `{{ … }}` attribute warnings logged before binding

---

## 5. Comparison with the current `/` (simplified v46 homepage)

Screenshots: `shots/current-1440-fullpage.png` (4,148 px tall) against `shots/frozen-1440-fullpage.png` (7,466), and `shots/current-375-fullpage.png` (7,462) against `shots/frozen-375-fullpage.png` (7,455).

Current order: header → hero → ribbon → **Explore** → **Featured** → Formats → PU-14 → band → footer. The frozen order is Featured **before** Explore, and adds Story and Academic quality.

| Section                  | Same                                                                                              | Simplified / different in current                                                                                                                                                                                                                                                                             | Missing in current                                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Header                   | Navy bar; brand + nav + action                                                                    | Shared v46 public shell. Brand "XR Learning Platform" with a dashed logo placeholder. Nav: Browse experiments · Areas · For institutions; Selection (n); Sign in; "Request access"; Menu sheet below 1024. Not sticky.                                                                                        | Frozen logo tile; "Simulation Learning Platform"; Featured/Formats anchors; sticky behaviour                                         |
| Hero                     | Eyebrow; H1 three lines with a gold third line; illustration label; course chip + format chips    | One static thermal drawing. Lead "Simulations of the lab experiments in engineering courses — in the browser, and in AR, VR and MR where an experiment offers them." CTA "Browse experiments". "Students and faculty — Already have access? Sign in" and "Institutions — Request institutional access" paths. | Three scenes, rotation, Pause/Play, scene selector cards, sweep, ambient motion, parallax, intro stagger, "See featured experiments" |
| Tricolour                | Same 3 colours                                                                                    | Static ribbon                                                                                                                                                                                                                                                                                                 | Grow-in                                                                                                                              |
| Featured                 | Same 4 experiments, area tag, course line, format chips                                           | Title "Start with these experiments."; product summaries as text; "View experiment" → `/experiments/<id>`; "Browse all 12 experiments"                                                                                                                                                                        | Frozen title and lead, descriptors, durations, off-state chips, hover lift/scale, "View in catalogue"                                |
| Explore                  | Same headline and lead; three areas with counts and courses; "Browse N experiments"               | v46 B1-02 carousel: Previous/Next, "1 of 3", swipe below 600, "View area" → `/areas/<id>`, "View all areas" → `/areas`                                                                                                                                                                                        | Flex accordion, hover-select, vertical accordion below 1024                                                                          |
| Inside a simulation      | —                                                                                                 | —                                                                                                                                                                                                                                                                                                             | **Whole section missing**                                                                                                            |
| Formats                  | Same headline, four peers, same texts, "Available in N of 12 experiments", "Browse X experiments" | Static cards                                                                                                                                                                                                                                                                                                  | Preview interaction (lift, reveal layer, glow); lead wording "available in" vs "offers"                                              |
| Academic quality         | —                                                                                                 | —                                                                                                                                                                                                                                                                                                             | **Whole section missing**                                                                                                            |
| For institutions (PU-14) | `#for-institutions` section; eyebrow; lead                                                        | Title "…Institutions **request** access."; **4 steps** (Browse and select; Request institutional access; BITS reviews — payment may be required; Your administrator gives students access); gold "Request institutional access" → `/selection`                                                                | Frozen title "…Institutions **grant** access.", **6 steps**, connector graphics, reveal. No request button in the frozen version.    |
| Closing band             | Same headline                                                                                     | Button "Browse experiments"                                                                                                                                                                                                                                                                                   | "Browse the catalogue"                                                                                                               |
| Footer                   | Navy; brand; links                                                                                | Logo placeholder; nav Browse experiments · Areas · For institutions · Sign in                                                                                                                                                                                                                                 | Logo tile, Featured/Formats links, the "Sample courses…" note                                                                        |

**Links on the current `/` at 1440** (from `product-probe.json`; 375 has the same set):

| Link                                             | Destination                                                                                                      |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Skip to main content                             | `#main`                                                                                                          |
| Brand                                            | `/`                                                                                                              |
| Browse experiments ×4                            | `/experiments`                                                                                                   |
| Areas ×2                                         | `/areas`                                                                                                         |
| For institutions ×2                              | `/#for-institutions`                                                                                             |
| Selection (n)                                    | `/selection`                                                                                                     |
| Request access / Request institutional access ×3 | `/selection`                                                                                                     |
| Sign in ×3                                       | `/sign-in`                                                                                                       |
| Hero course                                      | `/experiments/shell-and-tube-heat-exchanger`                                                                     |
| Browse N experiments                             | `/experiments?area=<area-id>`                                                                                    |
| View area                                        | `/areas/<area-id>`                                                                                               |
| View all areas                                   | `/areas`                                                                                                         |
| Browse all 12 experiments                        | `/experiments`                                                                                                   |
| Featured                                         | `/experiments/{cnc-turning-centre, shell-and-tube-heat-exchanger, induction-motor-loading, distillation-column}` |
| Browse X experiments                             | `/experiments?format={web,ar,vr,mr}`                                                                             |

**Mapping the frozen controls to EXISTING routes.** Every destination below was checked on 3360; no new route is needed.

| Frozen control (line)                                                                        | Frozen behaviour                                                                    | Existing product destination                                                                                                                                     |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brand button (406)                                                                           | `goLanding`                                                                         | `/` (link)                                                                                                                                                       |
| Header "Featured" / "Formats" / "For institutions" (415–419); footer equivalents (2036–2041) | Smooth scroll to the section                                                        | In-page anchors on `/`. `#for-institutions` already exists (PU-14 target, route-focus). Add section ids for Featured and Formats; these are anchors, not routes. |
| Header gold "Browse the catalogue" / "Catalogue" (419, 1977)                                 | Opens the file's Catalogue subview                                                  | `/experiments` (PU-04). **Not** the frozen subview.                                                                                                              |
| Hero "Browse the catalogue" (465); closing band (770); footer "Catalogue"                    | Same                                                                                | `/experiments`                                                                                                                                                   |
| Hero "See featured experiments" (466)                                                        | Scroll to Featured                                                                  | In-page anchor                                                                                                                                                   |
| Hero scene cards (472) / Pause (483)                                                         | Local state                                                                         | Local state only                                                                                                                                                 |
| Hero course link (448, hidden)                                                               | `goCatalogue` course facet                                                          | Not rendered (frozen hides it). If ever shown: `/experiments?course=<course-id>` exists (checked: 3 results).                                                    |
| "See all 12 experiments" (499)                                                               | Catalogue                                                                           | `/experiments`                                                                                                                                                   |
| Featured "View in catalogue" / art click (505, 522; 1674)                                    | Catalogue searched to "CNC" / "Shell-and-Tube" / "Induction Motor" / "Distillation" | `/experiments?q=<term>` (each checked: "1 of 12 experiments"). **Owner choice:** keep this, or use the existing PU-06 `/experiments/<id>` (D-6).                 |
| Explorer "Browse N experiments" (552; 1693)                                                  | Catalogue with area facet                                                           | `/experiments?area=<area-id>` (checked: 5 of 12 for mechanical-manufacturing)                                                                                    |
| Story index, explorer panels, format previews                                                | Local state                                                                         | Local state only                                                                                                                                                 |
| Format "Browse X experiments" (694; 1845)                                                    | Catalogue with format facet                                                         | `/experiments?format=<web/ar/vr/mr>` (checked: MR 2 of 12)                                                                                                       |

**Frozen controls with no existing destination:** none.

**Current destinations the frozen landing does not provide:**

- `/sign-in`
- `/selection`, both as "Selection (n)" and as "Request access"
- `/areas` and `/areas/<id>`
- `/experiments/<id>`
- the Menu sheet below 1024

These are owner decisions D-3 and D-5; nothing is to be added silently.

---

## 6. Implementation plan (Next.js 16 App Router + React 19 + TypeScript)

### 6.1 Principles (from pack 13)

- An isolated presentation adapter that reproduces the frozen DOM, inline styles, copy, SVG and motion one-to-one.
- Data and navigation reach it only through narrow adapters.
- No `support.js`, no `<x-dc>` templating, no iframe, no scaled frame, no harness.
- Frozen sources stay byte-identical outside the repo. If the owner wants them in the repo as reference, place them under a new `design/v1-landing/` with a `SHA256SUMS.txt` (2 files + logo), never edited.

### 6.2 Route and component structure

**Route.**

- **Problem:** `/` currently renders inside `PublicFrame` → `div.xp`. `xr-public.css` line 6 sets `.xp{…;overflow:hidden}`, which makes `.xp` the scroll container for `position:sticky`. The frozen sticky header and the sticky story stage would therefore not stick. It also sets `.xp *{min-width:0}`, and the v46 shell header and footer would sit around the landing.
- **Change:** move `app/(public)/page.tsx` → `app/(landing)/page.tsx`, with a new `app/(landing)/layout.tsx` that renders `<LandingRoute>`. The URL `/` is unchanged and no route is added.
- **New `app/_public/landing-route.tsx`** (beside `public-route.tsx`, the only modules that read `next/navigation`). It supplies:
  - `NavigationProvider` (the same `AppNavigation` shape)
  - `useRouteFocus` (`#for-institutions` focus keeps working)
  - the `SkipLink`
  - …but **not** `PublicFrame`.
- **Alternative** if the owner prefers to keep a single public group: a `pathname === '/'` branch in `PublicRoute` that skips `PublicFrame`. This is less clean.
- `not-found.tsx` and the other `(public)` pages stay unchanged.

**Feature: `apps/web/src/features/public/pu-01-landing/`** replaces `landing.tsx` and `explorer.tsx`; the old files are kept until acceptance or removed in the same commit. Proposed files:

| File                                                                                                                                                                                                                                | Role                                                                                                                                                                                                                                                                                                      | Source lines                                                                             |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `landing-v1.tsx`                                                                                                                                                                                                                    | `LandingV1`: root `div.pl1` (`data-landing="v1"`, container root), measures its width, owns state (`heroSel`, `playing`, `ambient`, `heroHover`, `expSel`, `fmtSel`, `featHover`, `storySel`, `intro`), composes sections                                                                                 | —                                                                                        |
| `layout.ts`                                                                                                                                                                                                                         | Pure TS port of the landing half of `renderVals`: `landingLayout(width, reduce, state)` → the same named values (`padX`, `secPad`, `canvasH`, `h1Size`, …). Unit-testable at 375/768/1024/1440.                                                                                                           | 1572–2057, excluding catalogue and harness                                               |
| `story-engine.ts`                                                                                                                                                                                                                   | The story engine as a framework-free class over a stage element: `storyMap`, `storySettle`, `storyParams`, `storyCss`, `storyFrame`, `select`. A verbatim maths port; only the geometry source changes (window scroll instead of frame `scrollTop`: `d = stickyTop − track.getBoundingClientRect().top`). | 1255–1449                                                                                |
| `art-defs.tsx`                                                                                                                                                                                                                      | `<LandingArtDefs/>`: the hidden `<svg><defs>` with every gradient, clipPath and symbol the landing uses, ported verbatim (JSX attribute names only). Symbol and gradient ids get a `pl1-` prefix so they cannot collide with any other inline SVG on the page. Unused catalogue-only symbols are omitted. | 52–401                                                                                   |
| `header.tsx`, `hero.tsx`, `featured.tsx`, `explorer.tsx`, `story.tsx`, `formats.tsx`, `academic.tsx`, `access.tsx` (PU-14, keeps `id="for-institutions"` and `h2 tabIndex={-1}` for `focusHashTarget`), `closing.tsx`, `footer.tsx` | One per frozen section, same DOM and inline styles                                                                                                                                                                                                                                                        | 404–421, 426–491, 493–527, 529–560, 562–671, 673–699, 701–738, 740–764, 766–774, 910–920 |
| `landing-v1.css`                                                                                                                                                                                                                    | Only what inline styles cannot express: the 8 keyframes, the `style-hover/focus/active` states as classes, the box-sizing revert, reduced-motion guards. Every selector is scoped to `.pl1`.                                                                                                              | —                                                                                        |
| `copy.ts`                                                                                                                                                                                                                           | `LANDING_V1` copy constants (frozen wording verbatim), moved to `@/copy/landing-v1.ts` per the repo's copy convention                                                                                                                                                                                     | —                                                                                        |
| `bind.ts`                                                                                                                                                                                                                           | Data adapter (§6.3)                                                                                                                                                                                                                                                                                       | —                                                                                        |

**Markup fidelity rules:**

- Keep the frozen element types, order, inline style values and ARIA.
- **Adapter-only semantic substitutions (no visual change):**
  - Navigation buttons become `<a>` links styled identically (destinations from §5): brand, header CTA, hero CTA, "See all", "View in catalogue", Browse area/format, closing CTA, footer links. In-page anchors become `<a href="#…">` with the frozen smooth-scroll handler.
  - Wrap the bar in `<header>`, the nav buttons in `<nav aria-label="Main">`, the sections in `<main id="main" tabIndex={-1}>`, and the footer links in `<nav aria-label="Footer">`.
  - Keep `SkipLink`. It is visible on focus only, so it is listed under D-10.
- **Never rendered:** the hidden frozen elements (`linkShow:'none'`, `brandSubShow:'none'`, the unused `cue`).

### 6.3 Data binding (existing reads only)

The sample world matches the frozen fixture exactly (checked on 3360):

- 12 experiments
- areas Mechanical & Manufacturing 5 experiments / 2 courses, Electrical & Electronics 4 / 2, Chemical & Process 3 / 1
- format counts WEB 12, AR 5, VR 7, MR 2
- the same four featured experiments

| Content                                                                          | Source                                                                                                                                                                                                                                                                                                                              |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Area names, counts, course code · name lists, area ids for links                 | `usePublicStructure()` / `usePublicAreas()` (existing). The blurbs are fixed frozen copy, keyed by area order or id.                                                                                                                                                                                                                |
| Featured cards: name, course line, formats, area badge                           | `usePublicCatalogue({featured:true})` + structure. Card order and one-line descriptors are fixed frozen copy, keyed by experiment id. Durations: **no product data** (D-7).                                                                                                                                                         |
| Hero scene course chip and format chips                                          | Catalogue entries for `shell-and-tube-heat-exchanger`, `induction-motor-loading`, `distillation-column` (design picks, keyed by id; D-14 covers the unpublished case)                                                                                                                                                               |
| "See all N experiments", "Offered in N of M experiments"                         | `total` and per-format counts from `usePublicCatalogue` (today 12, as frozen). This is binding, not a design change.                                                                                                                                                                                                                |
| Academic panel, story plates, chips, plot, access steps, trust points, hero copy | **Fixed illustrative design content**, verbatim. The story values (dots, curve, slider positions, NTU and effectiveness) are illustrative, labelled "Illustrative · no measured values" in the design. They are never computed and never described as physics.                                                                      |
| Loading / failed reads                                                           | No frozen state exists. Proposal (owner): render the frozen section shell with the frozen fixed copy, and leave data-bound strings empty or as the `xr-sr` loading status until the data arrives. If the read fails, reuse the existing `FailedBlock` _inside_ that section. This is a visible addition, so it is asked under D-14. |

### 6.4 Motion reproduction

- **CSS keyframes:** `b2*` (renamed `pl1-*`) in `landing-v1.css`. `animation-play-state` is driven by state, as in the frozen file (`ambientPlay`).
- **Hero rotation:** `setTimeout(7600)` loop with the frozen guards. The "hero off-screen" check uses the hero element against the viewport, and rotation is skipped when `document.hidden`.
- **Parallax:** pointer handler + rAF writing `transform` on three refs, exactly as `heroMove`/`heroLeave`.
- **Intro:** state flips `intro` 90 ms after mount (transition strings ported).
- **Reveals:** `IntersectionObserver` with root `null` (viewport), the same threshold (.06), the same pending-below-fold rule, and the same `data-seq` choreography.
- **Story:** the `story-engine.ts` rAF loop.
  - Scroll mode at ≥560: a passive `scroll` listener on window plus `ResizeObserver` and `document.fonts.ready` → `storyKick`.
  - Tap mode at <560; static mode under reduced motion.
  - The stage's custom properties are written straight to the element, outside React, as the frozen file does.
- **Viewport height:** `stageTop` uses the frozen formula `headerH + max(20, round((viewH − headerH − stageH)/2))`. In the frozen file `viewH` is the fixed frame height (940/900/812); in the product it has to be the real `window.innerHeight` (D-9). The section-scroll offset is the header height (`scrollToRef`).
- **Reduced motion:** a `useSyncExternalStore` over `matchMedia('(prefers-reduced-motion: reduce)')`, with the server snapshot set to `false`. The frozen `reduce` branches are honoured as written. The v46 global rule (`xr-foundation.css:335`) also zeroes durations, which is compatible.
- **Visibility:** pause the timers on `visibilitychange`, as frozen. Clean up every listener, observer, timer and rAF on unmount (mirror `componentWillUnmount` 1176–1188).

**Hydration.** The landing is a client component; the public pages already render their data in the browser (TE-8). The layout depends on the root's width, so render a pre-measure state with the intro hidden (the frozen design already starts with the intro at opacity 0), measure in `useLayoutEffect`, then render. Rules:

- never read `window` during render
- no width-dependent markup in the server HTML apart from the default `wide` values

### 6.5 CSS isolation

- **Not inside `.xp`**, so none of the `xr-public.css` rules reach the landing; the shell is not rendered (§6.2).
- **Inline styles** carry every frozen declaration. They beat any layered author rule except `!important` ones.
- **v46 globals that still apply, and how to neutralise them inside `.pl1`:**
  - `*{box-sizing:border-box}` → `.pl1 *, .pl1 *::before, .pl1 *::after {box-sizing: revert}`. The design host has no reset, so the frozen design is content-box apart from UA buttons.
  - `h1,h2,h3,h4,p,figure{margin:0}` — the frozen file sets explicit margins on most of these; check each `p` without one.
  - Global `:where(...):focus-visible` outline → replaced by the frozen `:focus` rules on classes (higher specificity).
  - `a{color}` and `a:hover` → explicit colours on the new links.
  - `body{background:#F4F5FB}` — only seen on overscroll.
- **The stylesheet must be layered:** `e2e/styles.spec.ts` requires every built CSS file to declare exactly `properties, theme, xr.v46, xr.product, utilities` with nothing unlayered, and the landing must carry no `xr.v3`.
  - **Proposal:** write `landing-v1.css` inside `@layer xr.product { … }` (preceded by the same layer statement), with every selector under `.pl1`.
  - A dedicated sub-layer would need an ADR-0001 amendment and a `styles.spec` change (D-12).
- **No V3 stylesheet on `/`** (that test stays as it is).
- The `@xr/ui` v46 sheets and `product.css` are not edited.

### 6.6 Logo placement

- **File:** `apps/web/public/brand/bits-wilp-lockup.png`, a byte copy of `f98fe1f8…`. `apps/web/public/` does not exist yet, so record provenance (hash, source path, owner approval) in a `PROVENANCE`/record note. The integrity scan may need an allow-entry.
- **Markup:** a plain `<img src="/brand/bits-wilp-lockup.png" alt="BITS Pilani Work Integrated Learning Programmes" width={68} height={34}>` with the frozen inline style.
  - Features must not import `next/*` (import fence), so `next/image` is not available from the feature. The `@next/next/no-img-element` lint needs a justified disable, or the `<img>` can come from a tiny `@/platform` wrapper.
  - At phone: 48×24. Footer: 60×30.
- **Accessible name:** the alt text is the frozen one. Because the brand is a link containing the image and the product name, its accessible name becomes "BITS Pilani Work Integrated Learning Programmes Simulation Learning Platform", as in the frozen file. Optionally set `aria-label` to "… — home" (D-10).
- `LogoPlaceholder` in `@xr/ui` stays for every other page unless the owner extends the decision.

### 6.7 Files to change (proposed)

**New:**

- `app/(landing)/layout.tsx`, `app/(landing)/page.tsx`, `app/_public/landing-route.tsx`
- `features/public/pu-01-landing/{landing-v1.tsx, layout.ts, story-engine.ts, art-defs.tsx, header.tsx, hero.tsx, featured.tsx, explorer.tsx (rewritten), story.tsx, formats.tsx, academic.tsx, access.tsx, closing.tsx, footer.tsx, bind.ts, landing-v1.css}`
- `copy/landing-v1.ts`
- `public/brand/bits-wilp-lockup.png`

**Moved or removed:**

- `app/(public)/page.tsx` (moved)
- the old `landing.tsx` and `explorer.tsx`, and the landing-only copy in `copy/public.ts` (`LANDING`, `ACCESS_STEPS`, `stepWords`, `FORMAT_CARDS` if no other page uses it — check before removing)

**Updated:**

- `copy/state-copy.ts`: PU-01 entries `hero-caption`, `featured-tag`, `sections-loading`/`failed`; the `PU-14` focus rule stays.
- `nav/link-targets.ts` (`publicPage('PU-01', '/', …)`)
- `nav/public-nav.ts` (only if the `FOR_INSTITUTIONS` constants move)
- `app/README.md` (route table), `nav/README.md`

**Unchanged:**

- PU-02…PU-12
- `PublicFrame` (still used by every other public page)
- all V3 role work

### 6.8 Tests

**Unit (vitest/jsdom):**

- `layout.test.ts`: every frozen value at 375/768/1024/1440 and at the breakpoints 559/560/1023/1024/1299/1300, reduced and not.
- `story-engine.test.ts`:
  - `storyMap`, `storySettle` and `storyParams` at p = −1, 0, 0.5, 1, 2, 3, against values computed from the frozen formulas
  - `storyCss` keys
  - index `aria-pressed` and plate `aria-hidden`
- `landing-v1.test.tsx`, replacing `public.test.tsx` "PU-01 Landing with PU-14" (137–276) and the PU-01 loading/failed cases (695–720):
  - sections and headings in frozen order
  - copy verbatim
  - bound counts
  - every link `href` per §5
  - `#for-institutions` with a focusable h2
  - the hero selector and Pause (fake timers: rotation at 7,600 ms; a manual pick stops it)
  - the explorer keyboard (arrows, Home, End)
  - the story index (click, ←/→)
  - format preview on focus
  - reduced motion (stub `matchMedia`)
  - logo `alt` and `src`
- Keep `copy/public.test.ts` passing; move the landing parts to `copy/landing-v1.test.ts`.
- Stubs needed: `IntersectionObserver`, `ResizeObserver`, rAF, `matchMedia`, `document.fonts`.

**E2E (Playwright, product build) — new `e2e/landing-v1/landing.spec.ts` at 1440, 1024, 768 and 375:**

- order and headings; no horizontal overflow; no console errors; Public Sans weights loaded; logo `naturalWidth` 632
- sticky header stays at top 0 after scrolling
- story: sticky stage at ≥560 (state advances with scroll; index click scrolls to the hold point); tap mode at 375; static under `emulateMedia({reducedMotion:'reduce'})`
- hero rotation with Playwright's clock, Pause/Play label and `aria-pressed`, manual pick
- explorer hover (≥1024) and keyboard
- format preview
- every link navigates to its existing route (§5)
- `/#for-institutions` from PU-03/PU-05/PU-06 "How institutional access works" lands on the section with focus on its heading
- reduced motion: no rotation or reveal, all content visible
- axe or the existing `checkState` accessibility harness on the default page and on each interactive state
- keyboard tab order through the whole page
- isolation: computed styles of sample landing elements equal the frozen inline values (font sizes, colours, box sizes), and a v46 public page (`/experiments`) and a V3 page are unchanged (their existing parity and spec suites stay green)

**Existing specs that start on `/` and use the shared header or menu** must be re-pointed. They are:

- `package-1b/public.spec.ts` (PU-01 tests 40–158), `package-1b/demonstration.spec.ts`
- `package-1c/flow.ts` (`headerLink`)
- `package-1e/journey.spec.ts`, `package-1e/accessibility.spec.ts` (177: PU-01 explorer at phone)
- `harness/test-seam.spec.ts` (200: expects `header a.xp-signin` on `/`)
- `smoke.spec.ts`, `styles.spec.ts`
- the phase/flow demonstrations

`grep` finds 34 `goto('/')` calls in 21 spec files. The change in each depends on D-3:

- If the frozen header ships, these flows need a different first step — either "Browse the catalogue" on `/`, or starting from `/experiments`/`/sign-in` — because `/` will no longer have "Sign in", "Areas" or "Request access".
- Keep each flow's intent; do not weaken any assertion that guards a business rule.

### 6.9 Parity and evidence

- The v46 B1-01 parity comparisons in `e2e/parity/b1-package-1b.parity.ts`: 22 named `b1-01-*` comparisons — f0 header … whole frame, f1 mobile, f2 menu sheet. That includes 2 of the "7 known Public Landing artwork comparisons" (`b1-01-f0-hero-figure`, `b1-01-f0-formats`).
  - **Retire these by name** through a new `V3-COMPARISON-MAP.json` entry for PU-01/PU-14 (`supersedes: [...]`, migration commit). **Never re-pin.**
  - The other 5 artwork exceptions (B1-03 f0 whole frame, B1-03 f2 experiments, B1-05 f0 preview and whole frame, B1-05 f6 poster) belong to PU-03/PU-06. They are untouched by this work and stay recorded as they are.
  - The parity file has no `b1-02-*` names (checked); the B1-02 explorer is compared inside the `b1-01-*` set.
- **New fidelity evidence** (the reference is never shipped): a capture tool, e.g. `tools/v1-landing/capture.mjs`. It renders the frozen 21 file through `support.js` from a git-ignored local copy, at 1440/1024/768/375, and the product build at the same states:
  - top
  - each hero scene (paused)
  - explorer per area
  - story states 1–4 (scroll mode) and the phone tap states
  - formats preview
  - reduced motion
  - full page
- **Comparison-map entry**, following the XS entries' format:
  - `reference.file` = 21 FROZEN, SHA-256 `3dbe94…`
  - widths
  - method: normal product build, side-by-side plus measured section heights and positions against `frozen-probe.json`
  - tolerance: none claimed for motion; static states compared at component level
  - `differences` listing every adapter-only change (links instead of buttons, landmarks, skip link, real viewport height) and every owner-approved change
- **Register:** `V3-STATUS-REGISTER.json` and `.md` entries PU-01 and PU-14:
  - `landingFidelity` → restored (prompt 13, date, commit)
  - `currentImplementation.paths` → the new files
  - `designSupplied` → 21 FROZEN plus hash
  - `implementationComplete`, `browserChecked`, `openIssue` (remaining mismatches)
- A record doc `docs/v3/PU-LANDING-V1-RECORD.md`: what was restored, what is adapter-only, the remaining mismatch, test evidence. This is what pack 13 asks the report to contain.
- `MASTER-INTEGRATION-RESUME.md` note.
- Commit **only after the owner has seen the fidelity result** (pack 13 §7).

### 6.10 Effort estimate

| Work                                                                                                                          | Days                        |
| ----------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| Port (≈ 350 lines of SVG defs, ≈ 760 lines of markup, ≈ 900 lines of landing logic → roughly 2,500–3,500 lines of TS/TSX/CSS) | 3–4                         |
| Route move, adapters, data binding, logo                                                                                      | 0.5                         |
| Unit tests                                                                                                                    | 1                           |
| New e2e plus re-pointing the existing flows                                                                                   | 1.5–2.5 (depends on D-3)    |
| Capture tool, fidelity review and fixes                                                                                       | 1–1.5                       |
| Records, register, comparison map, full `pnpm verify`                                                                         | 0.5–1                       |
| **Total**                                                                                                                     | **≈ 7.5–10.5 working days** |

### 6.11 Risks

- **Global CSS.**
  - `.xp{overflow:hidden}` breaks sticky; handled by the route move.
  - The `border-box` reset changes the geometry of padded fixed-size boxes; handled by the revert.
  - The global focus ring; handled.
  - The layer-order test; handled by using `xr.product`.
  - `b2*` keyframe or SVG id collisions; handled by prefixing.
- **Performance.** About 60 custom-property writes per animated frame on one element; three always-mounted hero scenes with large inline SVGs; infinite SVG dash animations. Mitigations:
  - ambient animation only on the active scene (frozen: `flowShow`)
  - rAF only while moving
  - pause when hidden
  - passive listeners
  - Measure on a mid-range laptop at 4× CPU throttle.
- **Motion accessibility.** No Pause control at phone (§7); a scroll-jacked-looking story (it is native scroll, not hijacked); reduced motion must cover the JS-driven motion as well as CSS (the v46 global rule covers CSS only).
- **Hydration.** Width-dependent layout. Use the measure-then-reveal approach; no `window` reads during render; avoid the first-paint jump at phone width.
- **Viewport height.** The fixed-height sticky stage on short or landscape viewports (§7, D-9).
- **Navigation regressions.** Many journeys start on `/` and use the shared header (Sign in, Areas, Menu). Re-pointing them is required, and the PU-07 → PU-08 request entry from `/` disappears unless D-3 or D-5 keeps one.
- **PU-14.** Keep `id="for-institutions"`, the focusable h2, and the `FOR_INSTITUTIONS_HREF` links from PU-03, PU-05 and PU-06.
- **Data drift.** If the sample world changes (an unpublished featured or hero experiment), the fixed design picks need a defined fallback (D-14).
- **Scans.** The public-copy scans (`packages/config/policy/terms.mjs`) must pass on the new copy. The footer "Sample courses and experiments…" note matches no current rule, but run the scan. Any new `public/` binary needs integrity and provenance handling.
- **Scope.** Do not let the frozen Catalogue subview, filter sheet or harness leak into the build.

### 6.12 Owner decisions needed before starting

| #    | Decision                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-1  | **Authorise prompt 13** (HOLD ONLY), and confirm `21 · FROZEN …` (SHA-256 `3dbe9412…4d07c`) as the sole authority, with the 35 MODULE as a non-authoritative copy.                                                                                                                                                                                                                                                        |
| D-2  | **Logo:** confirm `bits-pilani-wilp-logo.png` (SHA-256 `f98fe1f8…7184c`, 632×316, white background) as the authorised official WILP asset for the landing. Accept it at the frozen sizes as supplied; its built-in margins leave a visible mark of about 58×22 px in the header and make the two small text lines illegible. Say whether `LogoPlaceholder` on other pages changes too (out of this task unless extended). |
| D-3  | **Header, menu and footer on `/`.** (a) the literal frozen header and footer: Featured · Formats · For institutions + "Browse the catalogue", no nav and no menu below 1024, and no Sign in, Areas, Selection (n) or Request access on `/`; or (b) a stated addition, which is a visible change to the locked design. The other public pages keep the v46 shell either way.                                               |
| D-4  | **Product name:** "Simulation Learning Platform" (frozen 410, 912) vs the product's "XR Learning Platform" (`PRODUCT_NAME`, v46 board change #28). Choose which applies on `/`, and whether the tab title changes.                                                                                                                                                                                                        |
| D-5  | **PU-14 content:** adopt the frozen six steps and "Institutions grant access." without a request button, replacing the v46 four steps and the "Request institutional access" → `/selection` button. Confirm that the landing then has no direct way into the request flow, or name one.                                                                                                                                   |
| D-6  | **Featured "View in catalogue":** keep the frozen behaviour (`/experiments?q=<term>`), or point to the existing PU-06 `/experiments/<id>` under the same label.                                                                                                                                                                                                                                                           |
| D-7  | **Durations ("45 min", …; 1036–1047, 1665):** the product has no duration data. Show the frozen fixed values as illustrative content, hide them, or add data (a separate decision).                                                                                                                                                                                                                                       |
| D-8  | **Phone motion control:** the Pause button is hidden below 560 (2014) while auto-rotation and ambient motion run. Keep it hidden, show it at phone, or disable rotation at phone.                                                                                                                                                                                                                                         |
| D-9  | **Sticky story on short viewports:** the frozen file assumes 940/900/812 px frame heights. Approve using the real viewport height in the same centring formula, and decide the behaviour below about 740 px of height (keep sticky, or fall back to the static or tap mode).                                                                                                                                              |
| D-10 | **Accessibility adapters:** approve the invisible semantic substitutions (links for navigation, landmarks) and the visible-on-focus skip link. Say whether the off-state chip text `#7A81A8` on white (≈ 3.9:1 at 10.5 px; line 1596) stays or is raised to AA. Optionally confirm a "— home" name for the brand link.                                                                                                    |
| D-11 | **Footer note** "Sample courses and experiments · illustrative concept artwork · no production data" (917): ship as is?                                                                                                                                                                                                                                                                                                   |
| D-12 | **CSS placement:** a scoped block in the existing `xr.product` layer (recommended), or a new sub-layer (ADR-0001 amendment plus a `styles.spec` change).                                                                                                                                                                                                                                                                  |
| D-13 | **Route structure:** approve moving `/` into its own `(landing)` route group outside `PublicFrame`/`.xp` (needed for the frozen sticky behaviour).                                                                                                                                                                                                                                                                        |
| D-14 | **Data states:** fallbacks when a fixed design pick (hero e1/e6/e10, featured four) is not published, and the loading or failed rendering inside the frozen sections.                                                                                                                                                                                                                                                     |
| D-15 | **Parity:** retire the 22 `b1-01-*` v46 comparisons by name in the comparison map with the new V1 evidence. The 5 non-landing artwork exceptions stay as recorded.                                                                                                                                                                                                                                                        |
| D-16 | **Format chips:** the frozen design shows all four formats with "not offered" off-states (1590–1599), whereas the current pages show only the available formats. Confirm for the landing only.                                                                                                                                                                                                                            |

---

## 7. Conflicts to ask about, not to change silently (facts and line numbers)

1. **Moving content without a pause control at phone.**
   - `playShow: phone ? 'none' : 'inline-flex'` (2014) hides the Pause button below 560.
   - `tick()` (1218–1231) still auto-rotates every 7.6 s, and ambient animations run (433–435).
   - This sits against WCAG 2.2.2 (Pause, Stop, Hide) for auto-updating content longer than 5 s. → D-8
2. **No sign-in, request or areas entry, and no navigation below 1024.**
   - The header nav is hidden below 1024 (1950: `show: narrow ? 'none' : 'block'`), with no menu.
   - The header and footer contain neither Sign in nor Request access/Selection (415–419, 2036–2041).
   - The access section deliberately has no request button (record 2088, 2099).
   - The product's public flows (PU-07 → PU-12, XS-01) are reached from `/` today. → D-3, D-5
3. **Product name.** "Simulation Learning Platform" (410, 912) vs `PRODUCT_NAME` "XR Learning Platform". → D-4
4. **PU-14 business wording.**
   - The frozen version has six steps with "Institutions grant access." (744, 1856–1863).
   - The current version has four steps including "Browse and select" (the selection step of PU-07) and a "Request institutional access" button.
   - The frozen steps match the access rules (browse ≠ access; review; payment where applicable for external paid requests; provisioning; the institution grants student access) but do not mention the selection. → D-5
5. **Durations with no backing data.** `mins` (1036–1047) shown as "45 min" (1665). The catalogue contract has no duration field. → D-7
6. **Hard-coded counts.**
   - "See all 12 experiments" (499), "Offered in N of 12 experiments" (1842) and "Browse N experiments" (1698) are fixture-derived.
   - Plan: bind them to the sample world, which gives the same values today. Raised so the owner knows these numbers will follow the data.
7. **Contrast.** Off-state format chip text `#7A81A8` on `transparent`/white at 10.5 px (1596) ≈ 3.9:1, below 4.5:1 for normal text. → D-10
8. **Viewport height assumptions.**
   - The sticky story stage is 640/620/660 px tall (1738), centred in a fixed `viewH` of 940/900/812 (1739–1740; 1947).
   - On viewports shorter than about header + stage + 40 (≈ 740 px), the stage and its index row would be partly below the fold while pinned. → D-9
9. **Semantics.**
   - Every navigation is a `<button>` (406, 416, 419, 465–466, 499, 522, 552, 694, 770, 915).
   - There are no header, nav or main landmarks and no skip link (404–421, 910–920).
   - Focus styles use `:focus`, not `:focus-visible`.
   - The plan substitutes links and landmarks invisibly; the skip link is visible on focus. → D-10
10. **Featured action label vs the existing detail page.** "View in catalogue" opens a search (1674) because file 21 had no Experiment Detail (record 2098). The product now has PU-06. → D-6
11. **Footer claim.** "Sample courses and experiments · illustrative concept artwork · no production data" (917). → D-11
12. **Fonts.** The T1–T4 SVG labels name JetBrains Mono (165), which is never loaded; the system monospace renders. The plan keeps the fallback (no font added). Recorded only so a visual difference against another machine is not misread.
13. **Infrastructure, not the design.** `xr-public.css` `.xp{overflow:hidden}` (line 6) prevents the frozen `position:sticky` header and story stage if the landing stays inside the public shell. → D-13

---

## 8. Owner decisions (22 Oct 2026)

The owner authorised the integration (prompt 13) with `21 · FROZEN · Premium Direction B2 – BITS
Immersive Experience.dc.html` (SHA-256 `3dbe9412…4d07c`) as the sole visual and interaction
authority and `branding/bits-pilani-wilp-logo.png` as the official logo (D-1, D-2), and decided:

| Decision         | Owner's choice                                                                                                                                                                                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-3 header entry | Keep the frozen header layout; add **“Sign in”** as a fourth nav link in the frozen nav style at ≥ 1024 px, and a small “Sign in” text link beside the gold “Catalogue” button below 1024 px. Selection, Request access and Areas stay reachable from the catalogue pages. |
| D-5 PU-14        | Keep the six frozen steps and wording; add **one “Request institutional access” button** below them (frozen secondary-button style) to the existing selection / request flow (`/selection`).                                                                               |
| D-4 name         | **“XR Learning Platform”** on the landing (consistent with every V3 screen).                                                                                                                                                                                               |
| D-7 durations    | **Hidden** on the featured cards (no product data).                                                                                                                                                                                                                        |

Implementation details settled by following the frozen source (not owner decisions): D-6 featured
“View in catalogue” keeps the frozen catalogue search (`/experiments?q=…`); D-8 the Pause control
is also shown on phones (WCAG 2.2.2 — a necessary accessibility correction); D-9 the real viewport
height drives the sticky story, falling back to the frozen tap mode on short viewports; D-10
semantic links, landmarks and a focus-only skip link, and the off-state chip text raised from 3.9:1
to 4.5:1; D-11 the footer note kept; D-12 styles scoped in the existing `xr.product` layer; D-13 `/`
in its own route group outside the v46 public shell; D-14 bound to the existing catalogue reads
with defined fallbacks; D-15 the v46 B1-01 comparisons retired by name in the comparison map; D-16
the frozen four-format chips with off-states.
