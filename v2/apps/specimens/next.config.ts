import type { NextConfig } from 'next';

// The specimen harness (VD-17): developer and test infrastructure, never deployed.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Agent guidance for this repository is decided at repository level, not by a framework default.
  agentRules: false,
};

export default nextConfig;
