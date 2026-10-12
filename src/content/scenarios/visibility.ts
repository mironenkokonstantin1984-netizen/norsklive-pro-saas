import type { Scenario } from './types';
import { norskprove } from './norskprove';

export const DRAFT_SCENARIO_LABEL = 'Черновик, проверяется преподавателем';

export function shouldShowDraftScenarios(
  env: Record<string, string | undefined> = process.env
): boolean {
  if (env.SCENARIOS_SHOW_DRAFTS === 'false' || env.NEXT_PUBLIC_SCENARIOS_SHOW_DRAFTS === 'false') {
    return false;
  }
  return true;
}

export function getVisibleScenarios(options?: {
  items?: Scenario[];
  showDrafts?: boolean;
  env?: Record<string, string | undefined>;
}): Scenario[] {
  const sourceItems = options?.items ?? norskprove;
  const showDrafts =
    options?.showDrafts !== undefined
      ? options.showDrafts
      : shouldShowDraftScenarios(options?.env);

  if (showDrafts) {
    return sourceItems;
  }
  return sourceItems.filter((item) => item.status === 'reviewed');
}
