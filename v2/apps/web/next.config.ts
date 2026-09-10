import type { NextConfig } from 'next';

// Turbopack is the default in Next.js 16 for `next dev` and `next build`.
// Workspace packages are consumed as compiled ESM (`dist/`), so no transpilePackages.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // `next dev` would otherwise write AGENTS.md / CLAUDE.md into this app; agent guidance
  // for this repository is decided at repository level, not by a framework default.
  agentRules: false,
};

export default nextConfig;
