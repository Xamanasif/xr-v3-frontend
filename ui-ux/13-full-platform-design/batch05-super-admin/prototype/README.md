# Batch 05 prototype — Super Admin

Standalone, interactive, no backend.

## Run it

Open **`batch05-prototype.html`** in any browser. **Safari from `file://` works and is verified** — see §Safari below.

```
prototype/batch05-prototype.html
```

## Files

| File | What it is |
|---|---|
| `batch05-prototype.html` | The page. Loads two stylesheets and one script, all **same-directory** |
| `batch01-design-system.css` | **Byte-identical** snapshot of `../../prototype/batch01-prototype.css`. Batch 01 remains the source of truth — verify drift with `cmp`. `md5 8f9fa1b862f23ca4eeccc50d429bca75` |
| `batch05-prototype.css` | Batch-05 additions only, plus the three commented inherited corrections |
| `batch05-prototype.js` | Plain JavaScript, one IIFE, no framework |
| `assets/bits-pilani-wilp-logo.png` | **Byte-identical** copy of `branding/bits-pilani-wilp-logo.png`. `md5 633ba520f5b5cc606300eb76f7b8b52a` |

## What it is not

**No backend. No API. No database. No tenant service. No role service. No identity provider. No payment provider. No analytics. No network request of any kind.**

Every state is local prototype state held in the page. All five institutions are **fictional**; every person, identifier, module, version, date and reference is **sample design data**. No commercial model, licence transaction, seat rule, price, XR delivery mechanism or package format is asserted — each of those is open or pending in the requirement set.

## The one rule to know before reading the code

**There is no publication anywhere in this file.** The Content Manager publishes (`PM-16` · `PM-17` · `PM-18`). Every module the Super Admin sees has **already been published**; the only decision here is whether a **newer version** replaces the one learners are running (FRD 2.3.2). The vocabulary is firewalled — release, hold, held, released, version, production — and never *publish*.

## Routes

| Route | Screen |
|---|---|
| `#/index` | Prototype index — not product UI |
| `#/overview` | SA-01 Platform overview |
| `#/institutions` | SA-02 Institutions |
| `#/institution/<id>` | SA-03 Institution detail — `nit` · `mce` · `cp` · `lst` · `au` |
| `#/releases` *(`?state=all`)* | SA-04 Module releases |
| `#/release/<id>` | SA-05 Release decision — `v-shear-150` · `v-heat-210` · `v-torsion-120` · `v-circuit-301` |
| `#/device-requests` *(`?state=all`)* | SA-06 Device replacement requests |
| `#/device-request/<id>` | SA-07 Device request detail — `dr-01` · `dr-02` · `dr-03` |
| `#/licensing` | SA-08 Licensing |
| `#/platform/roles` | SA-09 Platform roles |
| `#/platform/configuration` | SA-10 Platform configuration |

An unknown route falls back to the index.

## Architecture

**One IIFE.** Sample data and initial state → derived model → presentational helpers → shell → views → router. No build step, no dependency, no module system (`file://` blocks module CORS).

**State.** A single object `S`, persisted to `sessionStorage` on mutation. Nothing derived is stored: every count, badge and state is recomputed on each render, which is why one release decision updates the overview, the navigation counts, the releases list and the module row at once without any of them being told to.

**Routing.** `location.hash`, with `hashchange` re-rendering, scrolling to top on a path change and moving focus to `<main>`.

**Three state machines**, each with exactly the states its requirement defines:

```
version    awaiting ──► released          FRD 2.3.2 — and holding is an
                   └──► held ──► released  "available and visible outcome"

request    awaiting ──► approved           FRD 2.4.2 — there is no third
                                            state; no rejection path exists

institution   derived, never stored        from three readiness facts
              operating · attention needed · setup incomplete
```

## Reset Demo

The button in the prototype strip. Restores the **exact** initial state — verified byte-identical against a fresh serialisation in `../qa/qa-behaviour.html`.

## QA seeding

`../qa/qa-seed.html?f=seed-states/<file>.json&reset=1#/route` deep-merges a partial state patch over the demo state on next load, so any state can be opened directly for capture. Arrays (`versions`, `requests`, `platformRoles`, `instOrder`) are **replaced wholesale** so an "everything settled" seed is expressible. The patch is removed as soon as it is applied. Requires an http server — `fetch` does not run from `file://`.

Seven seeds are in `../qa/seed-states/`.

## Safari `file://`

Verified from Safari's own file context, not inferred:

- both stylesheets loaded and parsed;
- Batch-01 tokens resolved (`--indigo-700` = `#2B3982`, `--topbar-h` = `64px`);
- Batch-05 corrections applied (`--text-3` = `#5F6B7A`, `--control-border` = `#7E8A99`);
- the logo loaded (`naturalWidth > 0`);
- the script loaded, executed, set the route and rendered the shell.

**Why the local copies exist.** Safari blocks **parent-directory** subresources when an HTML file is opened directly from `file://`, which left earlier batches unstyled. Every reference in this prototype is same-directory or a subdirectory of it. There is no `../` reference, no `@import`, no external host, and no `type="module"`.

**Logo fallback.** If the image cannot load in any context, the graphic is omitted cleanly and the text lockup stands alone — never a broken-image icon.

## Accessibility

Semantic headings with no level skipped · `<main>` landmark and skip link on every route, including the index · labelled navigation landmarks with a single `aria-current` each · table captions and `th scope` · labelled form controls · visible focus on every control · full keyboard operation with focus trapped in dialogs and returned on close · `aria-modal` dialogs with labelled titles · a polite live region for decisions · colour never the sole carrier of status · every target ≥ 30 px.

Verified mechanically — 42 route/width combinations, 34 contrast pairs, 31 behaviour assertions. See `../qa/ACCESSIBILITY_AND_UX_QA.md`.
