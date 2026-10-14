import { PracticeScreen } from '../../components/practice/PracticeScreen';
import { getSessionUser, isAuthEnabled } from '../../server/auth';
import { shouldShowDraftScenarios } from '../../content/scenarios/visibility';

export const metadata = { title: 'Практика · NorskLive' };

export default async function PracticeRoutePage() {
  const authEnabled = isAuthEnabled();
  const user = authEnabled ? await getSessionUser() : null;
  const showDrafts = shouldShowDraftScenarios();
  return (
    <PracticeScreen
      authEnabled={authEnabled}
      userEmail={user?.email ?? null}
      showDrafts={showDrafts}
    />
  );
}
