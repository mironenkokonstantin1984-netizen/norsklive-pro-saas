import { StudioPage } from '../../components/studio/StudioPage';
import { getSessionUser, isAuthEnabled } from '../../server/auth';

export default async function StudioRoutePage() {
  const authEnabled = isAuthEnabled();
  const user = authEnabled ? await getSessionUser() : null;
  return <StudioPage authEnabled={authEnabled} userEmail={user?.email ?? null} />;
}
