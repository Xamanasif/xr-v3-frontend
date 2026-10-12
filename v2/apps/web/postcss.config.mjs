/**
 * Tailwind CSS v4 through PostCSS (ADR-0001, G-3 Option A): `globals.css` takes only Tailwind's
 * theme and utilities, never Preflight. The v46 visual system comes from `@xr/ui/styles.css`
 * (its `@import … layer()` statements pass through this pipeline intact — WP-0.5 spike,
 * packages/ui/README.md).
 */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
