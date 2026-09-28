import { getSessionUser, isAuthEnabled } from './auth';
import {
  getLatestSessionWithTurns,
  type PracticeSessionRow,
  type TurnRow
} from './sessions';

export interface CurrentSessionHandlerDeps {
  authEnabled?: () => boolean;
  getUser?: () => Promise<{ id: string } | null>;
  getLatestSessionWithTurns?: (
    userId: string
  ) => Promise<{ session: PracticeSessionRow | null; turns: TurnRow[] }>;
}

export function createCurrentSessionHandler(
  deps: CurrentSessionHandlerDeps = {}
): () => Promise<Response> {
  const checkAuthEnabled = deps.authEnabled ?? isAuthEnabled;
  const resolveUser = deps.getUser ?? getSessionUser;
  const fetchLatest =
    deps.getLatestSessionWithTurns ??
    ((userId: string) => getLatestSessionWithTurns(userId));

  return async (): Promise<Response> => {
    try {
      if (!checkAuthEnabled()) {
        return new Response(null, { status: 204 });
      }

      const user = await resolveUser();
      if (!user) {
        return Response.json({ error: 'auth_required' }, { status: 401 });
      }

      const data = await fetchLatest(user.id);
      return Response.json(data, { status: 200 });
    } catch {
      return Response.json({ error: 'Internal error' }, { status: 500 });
    }
  };
}
