import { PathHome } from '../components/path/PathHome';
import { getSessionUser, isAuthEnabled } from '../server/auth';

// Home route renders PathHome; practice studio is rendered by StudioPage at /studio.
export default async function HomePage() {
  const authEnabled = isAuthEnabled();
  const user = authEnabled ? await getSessionUser() : null;
  return <PathHome authEnabled={authEnabled} userEmail={user?.email ?? null} />;
}

