import { Overview } from '@/features/admin/sa-01-overview/overview';

/**
 * `/admin`: SA-01 Overview (board B7-01) — its Phase-1 Requests group (owner decision, Package-1D
 * authorisation §2). The Super Admin's home is built, so this base no longer replaces itself with
 * Help & support (ADR-0005 §8); the other six bases keep the interim landing.
 */
export default function AdminHome() {
  return <Overview />;
}
