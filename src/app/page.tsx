import { PathHome } from '../components/path/PathHome';
import { getSessionUser, isAuthEnabled } from '../server/auth';

export default async function HomePage() {
  const authEnabled = isAuthEnabled();
  const user = authEnabled ? await getSessionUser() : null;
  return <PathHome authEnabled={authEnabled} userEmail={user?.email ?? null} />;
}

