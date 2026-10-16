import { ProfilePage } from '../../components/profile/ProfilePage';
import { getSessionUser, isAuthEnabled } from '../../server/auth';

export const metadata = { title: 'Профиль · NorskLive' };

export default async function ProfileRoutePage() {
  const authEnabled = isAuthEnabled();
  const user = authEnabled ? await getSessionUser() : null;

  return (
    <ProfilePage
      authEnabled={authEnabled}
      userEmail={user?.email ?? null}
    />
  );
}
