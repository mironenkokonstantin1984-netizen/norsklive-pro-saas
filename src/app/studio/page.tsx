import { StudioPage } from '../../components/studio/StudioPage';
import { getSessionUser, isAuthEnabled } from '../../server/auth';
import { shouldShowDraftScenarios } from '../../content/scenarios/visibility';

export const metadata = { title: 'Практика · NorskLive' };

export default async function StudioRoutePage() {
  const authEnabled = isAuthEnabled();
  const user = authEnabled ? await getSessionUser() : null;
  const showDrafts = shouldShowDraftScenarios();
  return (
    <StudioPage
      authEnabled={authEnabled}
      userEmail={user?.email ?? null}
      showDrafts={showDrafts}
    />
  );
}
