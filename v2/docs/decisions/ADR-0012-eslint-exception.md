# ADR-0012 — ESLint 9 exception (E-23): renew, bounded, with a prepared exit

|                     |                                                                                                                               |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Status**          | **Accepted** — owner, 4 Nov 2026 (exception renewed; expiry 31 Jan 2027)                                                      |
| **Date**            | 4 Nov 2026                                                                                                                    |
| **Branch**          | `backend/b0-groundwork` (backend phase B0, groundwork), from `8ca8166`                                                        |
| **Closes**          | `../OPEN_DECISIONS.md` E-23 (this review) once accepted; the exception itself stays open with the new bound                   |
| **Evidence**        | npm registry reads of 4 Nov 2026 (below). ESLint 10 was **not** installed for this record — investigation only                |
| **Leaves in place** | `eslint` **9.39.5** and `@eslint/js` 9.39.5 everywhere; `eslint-config-next` 16.3.4 with `next` 16.3.4; every lint rule as is |

## Context

E-23 records that the workspace lints on ESLint 9.39 because ESLint 10 crashes inside
`eslint-config-next` 16.3's transitive `eslint-plugin-react` 7.37 (`context.getFilename()` was
removed in ESLint 10; reproduced in Phase 0, then reverted). Its trigger is a Next.js release whose
`eslint-config-next` resolves ESLint-10-compatible plugins; its expiry is "re-check at each Next.js
minor and no later than the start of Phase 3". Backend B0 is that point.

ESLint is not only style here: `xr/resolved-boundaries` (package boundaries), the fence rules and
the v46 / V3 class-name rules are ESLint rules, and `pnpm verify` depends on them.

### What the registry says (read 4 Nov 2026)

| Package                       | Current                                                                       | ESLint 10?                                                                                                                         |
| ----------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `eslint`                      | `latest` 10.14.0 (30 Oct 2026); `maintenance` 9.39.5                          | 10.0.0 shipped 6 Feb 2026. **9.39.5 is marked deprecated: "This version is no longer supported."**                                 |
| `next` / `eslint-config-next` | `latest` 16.4.5 (3 Nov 2026); 16.4.0 on 6 Oct 2026; `canary` 16.5.0-canary.40 | `eslint-config-next` peers `eslint >=9.0.0`, but its dependencies are what break — unchanged in 16.4.5 **and** in the 16.5 canary: |
| ↳ `eslint-plugin-react`       | `^7.37.0` → latest **7.37.5**                                                 | **No** — peer `^3 … ^8 \|\| ^9.7`; still the plugin that calls `context.getFilename()`                                             |
| ↳ `eslint-plugin-jsx-a11y`    | `^6.10.0` → latest **6.10.2**                                                 | **No** — peer up to `^9`                                                                                                           |
| ↳ `eslint-plugin-import`      | `^2.32.0` → latest **2.32.0**                                                 | **No** — peer up to `^9`                                                                                                           |
| ↳ `eslint-plugin-react-hooks` | `^7.1.0` → latest 7.1.1                                                       | Yes — peer includes `^10.0.0`                                                                                                      |
| ↳ `@next/eslint-plugin-next`  | 16.4.5                                                                        | No ESLint peer declared                                                                                                            |
| `typescript-eslint`           | latest 8.72.1 (we pin 8.70.0)                                                 | Yes — `^8.57 \|\| ^9 \|\| ^10` (TypeScript `<6.1`; we are on 6.0.3)                                                                |
| `@eslint/compat`              | 2.1.1                                                                         | Yes — `^8.40 \|\| 9 \|\| 10`; provides `fixupPluginRules` for plugins that call removed context methods                            |

So the E-23 trigger has **not** fired: the current `eslint-config-next` release does not support
ESLint 10, and neither does the next canary. Public reports from projects on the same stack show the
same crash and the same choice (pin ESLint 9, or wrap the legacy plugins with `@eslint/compat`).
What changed since Phase 0 is the cost of waiting: ESLint 9 is now formally unsupported.

## Options

| Option                                                                                                                        | For                                                                                                                            | Against                                                                                                                                                                                                                               |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A · Renew the exception, bounded, and prepare the exit (recommended)**                                                      | No change to a green gate while backend work starts; lint rules and their tests unchanged; the exit is planned, not improvised | Stays on an unsupported major for a further bounded period (no security fixes for ESLint itself — a development-only tool that never ships)                                                                                           |
| B · Upgrade now with `@eslint/compat` `fixupPluginRules` around react / jsx-a11y / import                                     | Back on a supported ESLint; keeps every Next.js rule                                                                           | Shims three plugins whose authors do not declare ESLint 10; any rule still touching a removed API fails only when it runs on matching code. Touches every package's lint, the boundary rule tests and `pnpm verify` — out of B0 scope |
| C · Upgrade now with a web preset without `eslint-config-next` (typescript-eslint, `@next/eslint-plugin-next`, `react-hooks`) | No unsupported plugin at all                                                                                                   | Drops `jsx-a11y` (accessibility) and `react` rules the web app relies on unless re-added through compat — loses coverage the v46 work was gated on                                                                                    |

## Decision (recommended)

**Option A — renew E-23 with a new bound, and plan the upgrade as one work package.**

1. Stay on `eslint` / `@eslint/js` **9.39.5** and `eslint-config-next` matching `next`. No ESLint
   change in backend B0.
2. **New trigger** (unchanged in substance): an `eslint-config-next` release whose resolved
   `eslint-plugin-react`, `eslint-plugin-jsx-a11y` and `eslint-plugin-import` all declare ESLint 10 in
   their peer ranges. Re-check at every Next.js minor (next: 16.5).
3. **New expiry: 31 January 2027, or before the first deployed environment (E-08 / D-05),
   whichever comes first.** At expiry, if the trigger has not fired, execute option B in its own
   work package (`@eslint/compat` around the three plugins), with the acceptance check below;
   option C only if B fails that check.
4. The web preset stays the only ESLint-9-bound piece: the other packages' configs must keep using
   only APIs that exist in both ESLint 9 and 10 (flat config, `context.filename`,
   `context.sourceCode`), so the switch is a version bump outside `apps/web`.

## Consequences

- Backend work proceeds on the current, green lint gate. No lint rule changes.
- The repository knowingly runs a deprecated development tool until the expiry; it is never shipped
  to users. Recorded in `OPEN_DECISIONS.md` E-23 (renewed by the owner, 4 Nov 2026).
- The upgrade has a date and a plan; it is not left to whenever Next.js catches up.
- Custom rules (`xr/resolved-boundaries`, fences, class-name rules) must be checked for ESLint-10
  API use in the upgrade package — `packages/config/src/boundaries/boundaries.test.ts` runs them
  through the real ESLint API and is the regression net.

## How to verify

The trigger, at each Next.js minor:

```bash
npm view eslint-config-next@latest dependencies
npm view eslint-plugin-react@latest peerDependencies      # must include ^10
npm view eslint-plugin-jsx-a11y@latest peerDependencies   # must include ^10
npm view eslint-plugin-import@latest peerDependencies     # must include ^10
```

The upgrade work package's acceptance check (from `v2/`, on its own branch): bump `eslint` and
`@eslint/js` to the same exact 10.x in every package, adjust `apps/web/eslint.config.mjs` only, then

```bash
pnpm install
pnpm turbo run lint --force          # every package clean, no "context.getFilename is not a function"
pnpm --filter @xr/config test        # boundary-rule fixtures (real ESLint API) all pass
pnpm verify                          # the full gate stays green
```
