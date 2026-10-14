import { PublicNotFoundRoute } from './_public/public-route';

/**
 * PU-15, public variant (board 08): every address outside the seven workspaces and the public
 * pages answers 404 with this page, inside the public header and footer (Package 1B).
 */
export default function RootNotFound() {
  return <PublicNotFoundRoute />;
}
