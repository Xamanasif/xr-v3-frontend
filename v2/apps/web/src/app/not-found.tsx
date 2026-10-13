import { PublicNotFound } from '@/features/shared/pu-15-not-found/not-found';

/**
 * PU-15, public variant (board 08): every address outside the seven workspaces — `/` and the
 * public pages included until Phase 1 (G-8) — answers 404 with this page in the root layout.
 */
export default function RootNotFound() {
  return <PublicNotFound />;
}
