import type { Scenario } from './types';
import { norskprove } from './norskprove';

export const DRAFT_SCENARIO_LABEL = 'Черновик, проверяется преподавателем';

export function shouldShowDraftScenarios(
  env: Record<string, string | undefined> = process.env
): boolean {
  if (env.VERCEL_ENV === 'production') {
    return false;
  }
  if (env.SCENARIOS_SHOW_DRAFTS === 'true' || env.NEXT_PUBLIC_SCENARIOS_SHOW_DRAFTS === 'true') {
    return true;
  }
  if (env.SCENARIOS_SHOW_DRAFTS === 'false' || env.NEXT_PUBLIC_SCENARIOS_SHOW_DRAFTS === 'false') {
    return false;
  }
  if (env.NODE_ENV === 'development') {
    return true;
  }
  return false;
}

export function getVisibleScenarios(options?: {
  items?: Scenario[];
  showDrafts?: boolean;
  env?: Record<string, string | undefined>;
}): Scenario[] {
  const sourceItems = options?.items ?? norskprove;
  const showDrafts =
    options?.showDrafts !== undefined
      ? options.showDrafts && options?.env?.VERCEL_ENV !== 'production'
      : shouldShowDraftScenarios(options?.env);

  if (showDrafts) {
    return sourceItems;
  }
  return sourceItems.filter((item) => item.status === 'reviewed');
}
